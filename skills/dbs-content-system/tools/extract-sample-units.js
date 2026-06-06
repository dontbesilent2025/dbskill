#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(process.cwd());
const stateRoot = path.join(root, "03-处理状态");
const sourceRoot = path.join(root, "01-原始素材区");
const unitRoot = path.join(root, "02-内容单元库");
const themeRoot = path.join(root, "05-主题地图");
const assemblyRoot = path.join(root, "06-选题装配");
const templateRoot = path.join(root, "04-模板");

const typeConfig = {
  QST: { dir: "问题单元", template: "问题单元模板.md", typeName: "问题单元" },
  CON: { dir: "概念单元", template: "概念单元模板.md", typeName: "概念单元" },
  OPI: { dir: "观点单元", template: "观点单元模板.md", typeName: "观点单元" },
  CAS: { dir: "案例单元", template: "案例单元模板.md", typeName: "案例单元" },
  SOL: { dir: "方案单元", template: "方案单元模板.md", typeName: "方案单元" },
};

const ledgerCatalog = [
  { category: "短视频", sourceType: "短视频", dirs: ["短视频/文稿"] },
  { category: "公众号", sourceType: "公众号文章", dirs: ["公众号"] },
  { category: "观点与概念", sourceType: "观点与概念", dirs: ["观点与概念"] },
  { category: "爆款文稿", sourceType: "爆款文稿", dirs: ["爆款文稿"] },
  { category: "推文", sourceType: "推文素材", dirs: ["推文"] },
  { category: "其他作者", sourceType: "外部研究素材", dirs: ["其他作者"] },
  { category: "dontbesilent", sourceType: "本人内容", dirs: ["dontbesilent"] },
  { category: "完整副本", sourceType: "完整副本", dirs: ["完整副本"] },
];

function usage(exitCode = 0) {
  console[exitCode === 0 ? "log" : "error"](
    [
      "用法：",
      "node 07-脚本与工具/extract-sample-units.js --files <相对路径1,相对路径2,...> [--theme 主题] [--author 作者] [--date YYYYMMDD]",
      "node 07-脚本与工具/extract-sample-units.js --plan '短视频/文稿/011.md,公众号/xxx.md'",
    ].join("\n")
  );
  process.exit(exitCode);
}

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) result[key] = true;
    else {
      result[key] = next;
      i += 1;
    }
  }
  return result;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function moveFileToTrash(filePath, reasonDir) {
  if (!fs.existsSync(filePath)) return;
  const trashRoot = path.join(root, ".trash", `${new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())}_${reasonDir}`);
  const relative = path.relative(root, filePath);
  const target = path.join(trashRoot, relative);
  ensureDir(path.dirname(target));
  fs.renameSync(filePath, target);
}

function extractIdFromFilename(filePath) {
  return path.basename(filePath, ".md").split("_")[0] || "";
}

function readTextSafe(file) {
  const ext = path.extname(file).toLowerCase();
  if (![".md", ".txt", ".html", ".json", ".csv", ".jsonl"].includes(ext)) return "";
  return fs.readFileSync(file, "utf8");
}

function walkLedgerFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkLedgerFiles(full));
    else if (entry.isFile() && /\.(md|txt|html|csv|json|jsonl)$/i.test(entry.name)) results.push(full);
  }
  return results;
}

function titleFromPath(relPath) {
  return path.basename(relPath, path.extname(relPath)).replace(/[_-]+/g, " ").trim() || "未命名样本";
}

function slugFromTitle(title) {
  const cleaned = title.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || "未命名主题";
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === "\"") {
      if (inQuotes && line[i + 1] === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else current += ch;
  }
  cells.push(current);
  return cells;
}

function loadRegistry() {
  const registryPath = path.join(stateRoot, "来源注册表.csv");
  const candidatePath = path.join(stateRoot, "来源注册表_批量生成候选.csv");
  const map = new Map();
  for (const file of [registryPath, candidatePath]) {
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
    for (const line of lines.slice(1)) {
      const cells = parseCsvLine(line);
      if (cells[1] && cells[0] && !map.has(cells[1])) map.set(cells[1], cells[0]);
    }
  }
  return map;
}

function loadProcessedRows() {
  const processedPath = path.join(stateRoot, "已处理清单.csv");
  if (!fs.existsSync(processedPath)) return [["path", "status", "source_type", "notes"]];
  return fs.readFileSync(processedPath, "utf8").split("\n").filter(Boolean).map(parseCsvLine);
}

function saveProcessedRows(rows) {
  const processedPath = path.join(stateRoot, "已处理清单.csv");
  fs.writeFileSync(processedPath, rows.map((row) => row.map(csvEscape).join(",")).join("\n") + "\n");
}

function rebuildPendingLedger(processedSet) {
  const rawIndexPath = path.join(stateRoot, "原始素材索引.csv");
  const pendingPath = path.join(stateRoot, "待处理清单.csv");
  const rawRows = [["path", "category"]];
  const pendingRows = [["path", "status", "source_type", "notes"]];

  for (const rule of ledgerCatalog) {
    const files = rule.dirs
      .flatMap((rel) => walkLedgerFiles(path.join(sourceRoot, rel)))
      .map((file) => path.relative(sourceRoot, file).replaceAll(path.sep, "/"))
      .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));

    for (const rel of files) {
      rawRows.push([rel, rule.category]);
      if (!processedSet.has(rel)) pendingRows.push([rel, "待处理", rule.sourceType, ""]);
    }
  }

  fs.writeFileSync(rawIndexPath, rawRows.map((row) => row.map(csvEscape).join(",")).join("\n") + "\n");
  fs.writeFileSync(pendingPath, pendingRows.map((row) => row.map(csvEscape).join(",")).join("\n") + "\n");
  return { rawCount: rawRows.length - 1, pendingCount: pendingRows.length - 1 };
}

function appendLog(lines) {
  const logPath = path.join(stateRoot, "抽取日志.md");
  const existing = fs.existsSync(logPath) ? fs.readFileSync(logPath, "utf8").trimEnd() : "# 抽取日志";
  fs.writeFileSync(logPath, `${existing}\n\n${lines.join("\n")}\n`);
}

function upsertStatusOverview(summary) {
  const output = path.join(stateRoot, "处理状态总览.md");
  const lines = [
    "# 处理状态总览",
    "",
    `最后更新：${summary.today}`,
    "",
    "## 当前范围",
    "",
    ...summary.scope.map((item) => `- ${item}`),
    "",
    "## 当前已完成",
    "",
    ...summary.done.map((item) => `- ${item}`),
    "",
    "## 当前未完成",
    "",
    ...summary.todo.map((item) => `- ${item}`),
    "",
    "## 下一步",
    "",
    ...summary.next.map((item) => `- ${item}`),
  ];
  fs.writeFileSync(output, lines.join("\n") + "\n");
}

function nextId(prefix, dateText) {
  if (!nextId.cache) nextId.cache = new Map();
  const cacheKey = `${prefix}-${dateText}`;
  if (nextId.cache.has(cacheKey)) {
    const current = nextId.cache.get(cacheKey) + 1;
    nextId.cache.set(cacheKey, current);
    return `${prefix}-${dateText}-${String(current).padStart(3, "0")}`;
  }
  const dir = path.join(unitRoot, typeConfig[prefix].dir);
  ensureDir(dir);
  const existing = fs.readdirSync(dir).filter((name) => name.startsWith(`${prefix}-${dateText}-`) && name.endsWith(".md"));
  let max = 0;
  for (const name of existing) {
    const match = name.match(new RegExp(`^${prefix}-${dateText}-(\\d{3})_`));
    if (match) max = Math.max(max, Number(match[1]));
  }
  const next = max + 1;
  nextId.cache.set(cacheKey, next);
  return `${prefix}-${dateText}-${String(next).padStart(3, "0")}`;
}

function splitLines(text) {
  return removeFrontmatter(text).replace(/\r\n/g, "\n").split("\n");
}

function splitParagraphs(text) {
  return removeFrontmatter(text)
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((item) => item.replace(/\n/g, " ").trim())
    .filter((item) => item.length >= 16);
}

function removeFrontmatter(text) {
  const normalized = String(text || "").replace(/\r\n/g, "\n");
  return normalized.replace(/^---\n[\s\S]*?\n---\n*/, "");
}

function stripMarkdown(text) {
  return removeFrontmatter(text)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function countMatches(text, pattern) {
  return (String(text || "").match(pattern) || []).length;
}

function fileBaseName(relPath) {
  return path.basename(relPath, path.extname(relPath));
}

function normalizeCandidateTitleText(text, max = 28) {
  const normalized = stripMarkdown(String(text || ""))
    .replace(/\*\*原链接\*\*[:：].*$/gi, "")
    .replace(/原链接[:：].*$/gi, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/#\S+/g, "")
    .replace(/[|｜].*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return truncateText(normalized, max);
}

function classifySource(relPath, rawText) {
  const ext = path.extname(relPath).toLowerCase();
  const normalized = String(rawText || "");
  const stripped = stripMarkdown(normalized);
  const basename = fileBaseName(relPath);
  const lineCount = splitLines(normalized).length;
  const paragraphCount = splitParagraphs(normalized).length;
  const headingCount = countMatches(normalized, /^#{1,6}\s+/gm);
  const bulletCount = countMatches(normalized, /^\s*(?:[-*+]\s+|\d+\.\s+)/gm);
  const hasJsonSignals = /"[^"]+"\s*:/.test(normalized);
  const hasCsvSignals = ext === ".csv" || /^".+?",".+?"/m.test(normalized);
  const hasUrlDensity = countMatches(normalized, /https?:\/\//g) >= 5;
  const hasTweetMarkers = /tweet|推文|转发|回复|主贴|thread/i.test(`${relPath}\n${normalized}`);
  const hasBatchSignals = /batch_\d+|annotated|cleaned|analysis report|content library|insights collection|quality report/i.test(
    `${relPath}\n${normalized}`
  );
  const hasMissingTextSignals = /missing_text|缺正文推文清单|来源：quality_report/i.test(`${relPath}\n${normalized}`);
  const hasReadableLongform = headingCount >= 2 || paragraphCount >= 6 || bulletCount >= 8;
  const numberedShortDraft = /^\d{3}$/.test(basename) && relPath.includes("/短视频/文稿/");

  if (ext === ".json" || ext === ".jsonl" || hasJsonSignals) {
    return {
      kind: "skip",
      reason: "结构化中间文件",
      confidence: "high",
    };
  }

  if (hasCsvSignals) {
    return {
      kind: "skip",
      reason: "表格索引文件",
      confidence: "high",
    };
  }

  if (/README\.md$/i.test(relPath) || /^README$/i.test(basename)) {
    return {
      kind: "skip",
      reason: "说明文件",
      confidence: "high",
    };
  }

  if (hasBatchSignals) {
    return {
      kind: "skip",
      reason: "推文处理中间产物",
      confidence: "high",
    };
  }

  if (hasMissingTextSignals) {
    return {
      kind: "skip",
      reason: "缺正文索引或质量报告",
      confidence: "high",
    };
  }

  if (hasTweetMarkers && (hasUrlDensity || lineCount > 400 || paragraphCount > 40)) {
    return {
      kind: "normalize-tweet-archive",
      reason: "推文合集或导出长卷",
      confidence: "high",
    };
  }

  if (numberedShortDraft && stripped.length >= 80) {
    return {
      kind: "extract-short-draft",
      reason: "编号短视频文稿",
      confidence: "medium",
    };
  }

  if (hasReadableLongform && stripped.length >= 400) {
    return {
      kind: "extract-article",
      reason: "结构较完整的成稿",
      confidence: "high",
    };
  }

  if (stripped.length >= 120 && paragraphCount >= 2) {
    return {
      kind: "extract-short-draft",
      reason: "可抽取短稿",
      confidence: "medium",
    };
  }

  return {
    kind: "skip",
    reason: "信息密度不足或不适合直接抽取",
    confidence: "medium",
  };
}

function normalizeTweetArchive(relPath, rawText) {
  const bodyMatches = [...removeFrontmatter(rawText).matchAll(/正文：\s*\n\n([\s\S]*?)(?=\n---\n|\n###\s+\d+\.|\n##\s+|$)/g)]
    .map((match) => cleanSentence(match[1]))
    .filter((item) => item && item.length >= 18);
  if (bodyMatches.length > 0) {
    return dedupeBy(bodyMatches, (item) => item)
      .slice(0, 12)
      .map((item, index) => {
        const title = normalizeCandidateTitleText(takeFirstSentence(item) || `${fileBaseName(relPath)} 第 ${index + 1} 段`);
        return {
          relPath: `${relPath}#chunk-${String(index + 1).padStart(2, "0")}`,
          title,
          text: item,
          normalizedTitle: title,
          primaryTheme: normalizeCandidateTitleText(takeFirstSentence(item) || "推文", 18),
          sourceType: "推文素材",
        };
      });
  }

  const lines = splitLines(rawText)
    .map((line) => line.trim())
    .filter((line) => line && !/^原链接[:：]/i.test(line) && !/^\d{4}-\d{2}-\d{2}/.test(line) && !/^来源[:：]/.test(line));
  const paragraphs = splitParagraphs(rawText);
  const longParagraphs = paragraphs.filter(
    (item) =>
      stripMarkdown(item).length >= 60 &&
      !/^原链接[:：]/i.test(item) &&
      !/^\d{4}-\d{2}-\d{2}/.test(item) &&
      !/^来源[:：]/.test(item)
  );
  const tweetLikeLines = lines.filter((line) => stripMarkdown(line).length >= 30 && !/^https?:\/\//i.test(line));
  const chunks = dedupeBy([...longParagraphs, ...tweetLikeLines], (item) => stripMarkdown(item))
    .slice(0, 12)
    .map((item, index) => ({
      relPath: `${relPath}#chunk-${String(index + 1).padStart(2, "0")}`,
      title: normalizeCandidateTitleText(takeFirstSentence(item) || `${fileBaseName(relPath)} 第 ${index + 1} 段`),
      text: item,
      normalizedTitle: normalizeCandidateTitleText(takeFirstSentence(item) || `${fileBaseName(relPath)} 第 ${index + 1} 段`),
      primaryTheme: normalizeCandidateTitleText(takeFirstSentence(item) || "推文", 18),
      sourceType: "推文素材",
    }));
  return chunks;
}

function cleanSentence(text) {
  return stripMarkdown(text).replace(/[。；：]+$/, "").trim();
}

function normalizeKeywords(items) {
  const result = [];
  for (const item of items) {
    const normalized = stripMarkdown(String(item || "")).replace(/[，、]/g, " ").trim();
    if (!normalized) continue;
    for (const token of normalized.split(/\s+/)) {
      const clean = token.trim();
      if (!clean || clean.length < 2) continue;
      if (!result.includes(clean)) result.push(clean);
      if (result.length >= 8) return result;
    }
  }
  return result;
}

function takeFirstSentence(paragraph) {
  const text = stripMarkdown(paragraph);
  const parts = text.split(/[。！？!?]/).map((item) => item.trim()).filter(Boolean);
  return (parts[0] || text).trim();
}

function removeLeadingSerial(text) {
  return stripMarkdown(text).replace(/^\d+[.\-_\s、]+/, "").trim();
}

function ensureQuestion(text) {
  const normalized = cleanSentence(text).replace(/[？?！!。]+$/g, "").trim();
  if (!normalized) return "";
  return `${normalized}？`;
}

function truncateText(text, max = 120) {
  const normalized = stripMarkdown(text);
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max).trim()}……`;
}

function dedupeBy(items, getKey) {
  const map = new Map();
  for (const item of items) {
    const key = getKey(item);
    if (!key || map.has(key)) continue;
    map.set(key, item);
  }
  return [...map.values()];
}

function buildBulletBody(lines) {
  return lines.filter(Boolean).map((line) => `- ${line}`).join("\n");
}

function summarizeList(items, max = 3) {
  const cleaned = items.map((item) => cleanSentence(item)).filter(Boolean);
  return cleaned.slice(0, max).join("；");
}

function collectSection(lines, heading) {
  const startIndex = lines.findIndex((line) => line.trim() === heading);
  if (startIndex === -1) return "";
  const collected = [];
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^##\s+/.test(line.trim())) break;
    collected.push(line);
  }
  return collected.join("\n").trim();
}

function findParagraph(paragraphs, pattern) {
  return paragraphs.find((item) => pattern.test(item)) || "";
}

function parseBullets(text) {
  const lines = splitLines(text);
  const result = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const bulletMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (bulletMatch) {
      result.push(cleanSentence(bulletMatch[1]));
      continue;
    }
    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      result.push(cleanSentence(orderedMatch[1]));
      continue;
    }
  }
  return result.filter(Boolean);
}

function parseInlineField(text, label) {
  const pattern = new RegExp(`\\*\\*${label}：\\*\\*\\s*([^\\n]+)`);
  const match = text.match(pattern);
  return match ? cleanSentence(match[1]) : "";
}

function summarizeThreePartClaim(text) {
  const match = text.match(/满足三个条件[：:]?([\s\S]*?)$/);
  if (!match) return "";
  const fragment = cleanSentence(match[1]);
  if (!fragment) return "";
  return `兴趣变现要同时满足三件事：${fragment}`;
}

function inferTheme(relPath, providedTheme, context) {
  if (providedTheme) return providedTheme;
  if (context.primaryTheme) return context.primaryTheme;
  const parts = relPath.split("/");
  if (parts.length >= 2) {
    const candidate = parts[parts.length - 2].replace(/[_-]+/g, " ").trim();
    if (candidate && !/^(文稿|推文|cleaned|完整副本)$/i.test(candidate)) return candidate;
  }
  if (context.normalizedTitle && !/^\d{3}$/.test(context.normalizedTitle)) return context.normalizedTitle;
  return "待补主题";
}

function inferSourceType(relPath) {
  if (relPath.includes("推文")) return "推文素材";
  if (relPath.includes("短视频")) return "短视频";
  if (relPath.includes("公众号")) return "公众号文章";
  if (relPath.includes("爆款文稿")) return "爆款文稿";
  if (relPath.includes("观点与概念")) return "观点与概念";
  if (relPath.includes("其他作者")) return "外部研究素材";
  return "原始素材";
}

function detectQuestionType(text) {
  if (/为什么|本质|根本|误区|错在/.test(text)) return "认知问题";
  if (/怎么|如何|怎样|步骤|路径|开始|落地/.test(text)) return "方法问题";
  return "待人工复核";
}

function buildKeywords(title, context, extra = []) {
  const merged = [
    title,
    context.coreTheme,
    ...(context.keywords || []),
    ...(context.applicableScenes || []),
    ...extra,
  ];
  const keywords = normalizeKeywords(merged);
  return keywords.length > 0 ? keywords.slice(0, 8) : ["待补关键词"];
}

function extractStructuredContext(text, title) {
  const lines = splitLines(text);
  const summarySection = collectSection(lines, "## 核心观点提炼");
  const videoSection = collectSection(lines, "## 视频文稿");
  const scenarioSection = collectSection(lines, "## 适用场景");
  const definitionSection = collectSection(lines, "## 概念定义");
  const conceptSection = collectSection(lines, "## 核心观点");
  const examplesSection = collectSection(lines, "## 使用示例");

  const context = {
    title,
    normalizedTitle: removeLeadingSerial(title),
    titleQuestion: title.includes("如何") || title.includes("为什么") ? title : "",
    videoSummary: splitParagraphs(videoSection),
    summaryParagraphs: splitParagraphs(summarySection),
    applicableScenes: parseBullets(scenarioSection),
    conceptDefinitionSection: splitParagraphs(definitionSection),
    conceptViewSection: splitParagraphs(conceptSection),
    examplesSection: splitParagraphs(examplesSection),
    coreTheme: parseInlineField(text, "核心主题"),
    keywords: normalizeKeywords([parseInlineField(text, "关键词")]),
    dataPoint: parseInlineField(text, "视频数据"),
  };

  const structuredBullets = parseBullets(summarySection);
  context.structuredBullets = structuredBullets;
  context.primaryTheme = context.coreTheme.split(/[、,，]/).map((item) => cleanSentence(item)).find(Boolean) || "";

  const numberedBlocks = [...summarySection.matchAll(/###\s+(.+?)\n([\s\S]*?)(?=\n###\s+|\s*$)/g)];
  context.summaryBlocks = numberedBlocks.map((match) => ({
    heading: cleanSentence(match[1]),
    body: cleanSentence(match[2]),
    bullets: parseBullets(match[2]),
  }));

  const questionCandidate = context.titleQuestion || findParagraph(context.videoSummary, /如何|为什么|怎么|能不能|是不是/);
  context.questionText = cleanSentence(questionCandidate || `这篇内容试图回答什么问题：${title}`);

  const threePartBlock = context.summaryBlocks.find((item) => /兴趣变现三要素/.test(item.heading));
  const opinionCandidate =
    summarizeThreePartClaim(findParagraph(context.videoSummary, /满足三个条件|满足三件事/)) ||
    cleanSentence(
      threePartBlock
        ? `兴趣变现要同时满足三件事：${threePartBlock.bullets
            .filter((item) => /生产型兴趣|匹配的能力|具体的业务/.test(item))
            .join("；")}`
        : ""
    ) ||
    context.summaryParagraphs.find((item) => /我认为|关键|本质|核心|正确/.test(item)) ||
    findParagraph(context.videoSummary, /我认为|关键|本质|不是|一定要/);
  context.opinionText = cleanSentence(opinionCandidate || `${title} 对应的核心判断待人工补全`);

  const conceptDefinitionParagraph =
    context.conceptDefinitionSection[0] ||
    findParagraph(context.videoSummary, /生产型兴趣|消费型兴趣/) ||
    "";
  const conceptCandidate = cleanSentence(
    conceptDefinitionParagraph
      ? "生产型兴趣是能持续产出价值并进入市场交换的兴趣；消费型兴趣只消耗金钱和时间，不产生可交易产出"
      : ""
  );
  context.conceptText = conceptCandidate || `${title} 中出现了需要稳定定义的概念，待人工补全`;
  context.conceptFunction = cleanSentence(
    context.conceptViewSection[0] ||
      "用于区分什么样的兴趣能转化成业务，以及为什么仅有兴趣本身还不够"
  );

  const caseSummaryCandidate =
    findParagraph(context.videoSummary, /一万两千条|一万粉丝|一千六百万|十二万|答疑群|小红书|抖音/) ||
    context.examplesSection[0] ||
    "";
  context.caseSummary = cleanSentence(
    caseSummaryCandidate ||
      "把商业问题想清楚、写清楚、说清楚，先换数据，再换产品，再换流量和商业模式"
  );
  context.caseProcess = cleanSentence(
    findParagraph(context.videoSummary, /首先我做的第一个事情|这个时候我就马上意识到|所以接下来|基于此/) ||
      "先公开输出换数据，再把数据转成产品，再把产品和能力转成流量与业务"
  );
  context.caseResult = cleanSentence(
    findParagraph(context.videoSummary, /一万粉丝|一千六百万次|十二万|交易过的人没有亏过|线上加线下/) ||
      "验证了兴趣可以通过能力和具体业务被持续兑换成钱"
  );

  const stepBullets = structuredBullets.filter((item) => /^第|兴趣→|数据→|产品→|能力→|流量→/.test(item) || /步骤|路径|测试|迭代/.test(item));
  const explicitSteps = stepBullets.length > 0 ? stepBullets : parseBullets(videoSection).slice(0, 5);
  const solutionCandidate =
    context.summaryBlocks.find((item) => /步骤|路径|方法|三要素/.test(item.heading))?.body ||
    explicitSteps[0] ||
    context.videoSummary.find((item) => /第一|第二|第三|步骤|路径/.test(item)) ||
    "";
  context.solutionSummary = cleanSentence(solutionCandidate || `${title} 对应的方案摘要待人工补全`);
  context.actionSteps = explicitSteps.length > 0 ? explicitSteps.slice(0, 6) : ["待人工补全步骤 1"];
  context.expectedResult = cleanSentence(
    findParagraph(context.videoSummary, /然后你就能把你的兴趣变成钱|构成了我现在的线上加线下|实现可持续的规模增长/) ||
      "最终把兴趣、能力和具体业务接上，形成可持续增长的现金流"
  );

  context.relatedScenes = context.applicableScenes.length > 0 ? context.applicableScenes.slice(0, 6) : ["待人工补全"];
  return context;
}

function extractSimpleContext(text, title, relPath, profile) {
  const rawNormalizedTitle = normalizeCandidateTitleText(removeLeadingSerial(title));
  const stripped = stripMarkdown(text);
  const paragraphs = splitParagraphs(text);
  const lines = splitLines(text).map((item) => item.trim()).filter(Boolean);
  const sentences = stripped
    .split(/[。！？!?]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 12);
  const inferredTitle =
    sentences.find((item) => item.length >= 14 && !/^(所以|但是|然后|如果|因为|你要|你得|我们|就是)/.test(item)) ||
    paragraphs.find((item) => stripMarkdown(item).length >= 14) ||
    rawNormalizedTitle;
  const normalizedTitle = /^\d{3}$/.test(rawNormalizedTitle)
    ? normalizeCandidateTitleText(inferredTitle) || "待人工聚类短稿"
    : rawNormalizedTitle;
  const firstSentence = sentences[0] || stripped.slice(0, 80);
  const questionLine =
    sentences.find((item) => /为什么|如何|怎么|能不能|是不是|是否/.test(item)) ||
    (profile.kind === "extract-short-draft" ? `${normalizedTitle} 这条文稿试图说明什么问题` : `${normalizedTitle} 这篇内容试图回答什么问题`);
  const opinionLine =
    sentences.find((item) => /本质|核心|关键|不是|而是|必须|应该|不要|先/.test(item)) ||
    firstSentence;
  const conceptLine =
    sentences.find((item) => /是指|就是|意味着|区别|本质是/.test(item)) ||
    opinionLine;
  const exampleLine =
    sentences.find((item) => /\d+|案例|比如|例如|有人|一次|后来|结果/.test(item)) ||
    firstSentence;
  const actionBullets = lines
    .filter((item) => /先|再|然后|最后|第一|第二|第三|步骤|动作|可以/.test(item))
    .slice(0, 4)
    .map((item) => cleanSentence(item));
  const fallbackSteps =
    actionBullets.length > 0
      ? actionBullets
      : sentences
          .filter((item) => /先|再|然后|最后/.test(item))
          .slice(0, 3)
          .map((item) => cleanSentence(item));
  const sourceType = relPath.includes("/短视频/") ? "短视频" : relPath.includes("/推文/") ? "推文素材" : inferSourceType(relPath);
  const primaryTheme =
    relPath.includes("/短视频/") ? normalizedTitle :
    relPath.includes("/推文/") ? "推文" :
    normalizedTitle || "待补主题";

  return {
    title,
    normalizedTitle,
    titleQuestion: /如何|为什么|怎么|能不能|是不是/.test(normalizedTitle) ? normalizedTitle : "",
    videoSummary: paragraphs,
    summaryParagraphs: paragraphs,
    applicableScenes: [primaryTheme],
    conceptDefinitionSection: [conceptLine],
    conceptViewSection: [opinionLine],
    examplesSection: [exampleLine],
    coreTheme: primaryTheme,
    keywords: buildKeywords(normalizedTitle, { coreTheme: primaryTheme, keywords: [], applicableScenes: [primaryTheme] }),
    dataPoint: "",
    structuredBullets: fallbackSteps,
    primaryTheme,
    summaryBlocks: [],
    questionText: cleanSentence(questionLine),
    opinionText: cleanSentence(opinionLine),
    conceptText: cleanSentence(conceptLine),
    conceptFunction: "用于把短稿里的核心判断固定成可复用节点",
    caseSummary: cleanSentence(exampleLine),
    caseProcess: cleanSentence(sentences[1] || exampleLine),
    caseResult: cleanSentence(sentences[2] || exampleLine),
    solutionSummary: cleanSentence(fallbackSteps[0] || firstSentence),
    actionSteps: fallbackSteps.length > 0 ? fallbackSteps : ["待人工复核后补全步骤"],
    expectedResult: "把短稿里的核心判断固定成可复用节点，并保留后续人工复核入口",
    relatedScenes: [primaryTheme],
    sourceType,
    extractionMode: profile.kind,
    extractionReason: profile.reason,
  };
}

function findSummaryBlock(context, pattern) {
  return context.summaryBlocks.find((item) => pattern.test(item.heading));
}

function findVideoParagraph(context, pattern) {
  return context.videoSummary.find((item) => pattern.test(item)) || "";
}

function buildMainQuestion(context) {
  if (/生产型兴趣/.test(context.conceptText) && /兴趣/.test(context.normalizedTitle) && /赚钱|变现/.test(context.normalizedTitle)) {
    return "什么样的兴趣属于可以变现的生产型兴趣，以及怎样把兴趣、能力和具体业务接起来，做成可持续增长？";
  }
  if (/赛道思维|具体生意|686种组合/.test(`${context.coreTheme} ${context.normalizedTitle}`)) {
    return "怎样在不陷入赛道思维的前提下，快速找到一个可以从零到一测试并盈利的具体生意？";
  }
  if (isAntifragileIncomeContext(context)) {
    return "为什么看起来稳定的工资收入，本质上是在用增长空间和风险承担能力去交换确定性，以及怎样把自己练成反脆弱状态？";
  }
  if (isPassiveIncomeSystemContext(context)) {
    return "被动收入到底是什么，怎样把线性的人力赚钱改造成一个可维护、可放量、还能逐步融入兴趣的赚钱系统？";
  }
  if (isBossMindsetContext(context)) {
    return "为什么很多人离开公司之后仍然赚不到钱，以及怎样把从能力出发的员工思维改成从需求倒推的老板思维？";
  }
  if (context.normalizedTitle && /如何|为什么|怎么|能不能|是不是/.test(context.normalizedTitle)) {
    return ensureQuestion(context.normalizedTitle);
  }
  return ensureQuestion(context.questionText || `${context.normalizedTitle} 这件事到底该怎么处理`);
}

function isIndustryStrategyContext(context) {
  return /赛道思维|具体生意|686种组合/.test(`${context.coreTheme} ${context.normalizedTitle}`);
}

function isAntifragileIncomeContext(context) {
  return /稳定收入|保险费|反脆弱|工资的本质|不确定性/.test(`${context.coreTheme} ${context.normalizedTitle}`);
}

function isPassiveIncomeSystemContext(context) {
  return /被动收入|系统赚钱|自增长长尾流量|兴趣融入业务/.test(
    `${context.coreTheme} ${context.normalizedTitle} ${textifyContext(context)}`
  );
}

function isBossMindsetContext(context) {
  return /员工思维|老板思维|从右到左|需求倒推|目的vs手段|找对标/.test(
    `${context.coreTheme} ${context.normalizedTitle} ${textifyContext(context)}`
  );
}

function buildMainOpinion(context) {
  if (/生产型兴趣/.test(context.conceptText)) {
    return "兴趣能不能变现，不取决于兴趣这个标签本身，而取决于三件事：它是不是生产型兴趣、有没有与之匹配的能力、有没有落到具体业务里";
  }
  if (/赛道思维|具体生意|686种组合/.test(`${context.coreTheme} ${context.normalizedTitle}`)) {
    return "找生意时不要先问某个行业能不能做，而要先拆一个具体生意的内容、流量、变现和产品组合，再用短周期测试验证自己能不能做";
  }
  if (isAntifragileIncomeContext(context)) {
    return "工资的本质不是单纯的劳动报酬，而是把业务波动和不确定性打包转交给雇主之后，为自己购买稳定性的一份保险";
  }
  if (isPassiveIncomeSystemContext(context)) {
    return "被动收入不是你什么都不干，而是资金流入和时间支出不再线性相关；真正关键的是把人赚钱改造成系统赚钱，再把兴趣逐步融入系统里";
  }
  if (isBossMindsetContext(context)) {
    return "赚不到钱的根本原因，往往不是能力不够，而是思维顺序错了；员工从能力出发，老板从需求出发，再倒推产品、内容和所需能力";
  }
  return cleanSentence(context.opinionText || `${context.normalizedTitle} 对应的核心判断待补全`);
}

function buildThreePartSteps(context) {
  if (/生产型兴趣/.test(context.conceptText)) {
    return [
      "先区分生产型兴趣和消费型兴趣，确认这件事能不能持续产出可交易价值",
      "再补齐与兴趣匹配的能力，例如写作、理解用户和升维解释问题",
      "最后把兴趣和能力放进一个具体业务，明确产品、渠道和成交方式",
    ];
  }
  if (/赛道思维|具体生意|686种组合/.test(`${context.coreTheme} ${context.normalizedTitle}`)) {
    return [
      "先找一个已经有人赚到钱的具体生意，不要先盯行业和赛道标签",
      "再把这个生意拆成内容、流量、变现、产品几个维度，看清它的组合方式",
      "最后给自己半个月到一个月去测试，验证自己能不能做，并根据结果调整下一次选择",
    ];
  }
  if (isAntifragileIncomeContext(context)) {
    return [
      "先识别自己为了稳定性支付了哪些隐性保险费，例如工资折价、负债束缚和选择权流失",
      "再为自己准备反脆弱底盘，例如 6 到 12 个月储备金、避免高杠杆、持续跨学科学习",
      "最后把收入目标从固定数值改成与价值创造挂钩，训练自己和波动性共处",
    ];
  }
  if (isPassiveIncomeSystemContext(context)) {
    return [
      "先承认被动收入不是不干活，而是先搭出一个能替你承接流量、成交和交付的赚钱系统",
      "再判断这个系统处在哪一层：零投入分佣、可放量分销、可推高天花板的产品，还是自增长长尾流量",
      "最后把你的兴趣和长期愿意持续做的内容融进去，让维护系统这件事本身也变成你愿意主动做的事情",
    ];
  }
  if (isBossMindsetContext(context)) {
    return [
      "先从用户需求出发，判断什么内容和产品组合已经被市场验证能赚钱",
      "再倒推要解决哪些环节，自己不会的能力就去学、去雇人或者去找合作",
      "最后用对标持续校正内容和产品的匹配，而不是困在我会什么技能这类左到右的问题里",
    ];
  }
  return context.actionSteps.slice(0, 3);
}

function buildAudience(context) {
  if (isPassiveIncomeSystemContext(context)) {
    return "已经不满足于按小时换钱，想把收入改造成系统性现金流，同时希望把兴趣和内容能力融进业务的人";
  }
  if (isBossMindsetContext(context)) {
    return "有技能、有执行力，但一开口总是在问我的能力怎么变现，而不是先看需求和对标的人";
  }
  if (isIndustryStrategyContext(context)) {
    return "正在找从零到一生意方向，但总是被赛道、行业和机会清单绕住的人";
  }
  if (isAntifragileIncomeContext(context)) {
    return "表面追求稳定收入，实际已经感受到工资、负债和确定性依赖正在限制自己的人";
  }
  return cleanSentence(
    context.relatedScenes[0] ||
      context.summaryParagraphs.find((item) => /适合|适用|讨论/.test(item)) ||
      "对这个问题有真实需求、并准备把旧内容重组为新表达的人"
  );
}

function buildClosingLine(context) {
  if (isPassiveIncomeSystemContext(context)) {
    return "把一次性体力活，改造成一个能被维护、被放大、还能承接兴趣的赚钱系统";
  }
  if (isBossMindsetContext(context)) {
    return "把我会什么改成用户要什么，你的内容、产品和赚钱路径才会真正连起来";
  }
  return "把原本抽象的问题，改造成可以逐项检查、持续增长的内容结构";
}

function buildPathSteps(context) {
  const keyPathBlock = findSummaryBlock(context, /关键路径|增长路径|执行路径/);
  if (keyPathBlock && keyPathBlock.bullets.length > 0) return keyPathBlock.bullets.slice(0, 6);
  const arrowSteps = (context.actionSteps || []).filter((item) => /→|路径|第一|第二|第三/.test(item));
  if (arrowSteps.length >= 3) return arrowSteps.slice(0, 6);
  return [];
}

function pickPrimaryCandidate(candidates, preferredKey) {
  return candidates.find((item) => item.key === preferredKey) || candidates[0] || null;
}

function buildSemanticCandidates(context, theme) {
  const sharedUsage = context.relatedScenes;
  const candidates = {
    QST: [],
    CON: [],
    OPI: [],
    CAS: [],
    SOL: [],
  };

  const mainQuestion = buildMainQuestion(context);
  candidates.QST.push({
    key: "qst-main",
    title: /生产型兴趣/.test(context.conceptText)
      ? "什么样的兴趣能真正变现"
      : isPassiveIncomeSystemContext(context)
      ? "怎样把人赚钱改造成系统赚钱"
      : isBossMindsetContext(context)
      ? "为什么能力强的人离开公司后仍然赚不到钱"
      : `${context.normalizedTitle} 的核心问题`,
    questionText: mainQuestion,
    questionType: detectQuestionType(mainQuestion),
    applicableTopics: [theme, ...sharedUsage.slice(0, 3)].filter(Boolean),
    bodyText: [
      `核心问题：${mainQuestion}`,
      isIndustryStrategyContext(context)
        ? "拆解边界：先停止用行业标签提问，再拆一个具体生意的内容、流量、变现和产品组合，最后用短周期测试验证自己能不能做。"
        : isAntifragileIncomeContext(context)
        ? "拆解边界：先看稳定收入背后付出的保险费，再看负债和固定成本怎样抽走了你的能量，最后看怎样把自己训练成能和波动共处的反脆弱状态。"
        : isPassiveIncomeSystemContext(context)
        ? "拆解边界：先区分一次性赚钱和系统赚钱，再比较不同系统层级的放量能力与天花板，最后判断怎样把兴趣融进系统。"
        : isBossMindsetContext(context)
        ? "拆解边界：先把问题起点从我的能力改成用户需求，再用对标验证内容与产品的匹配，最后倒推自己该补哪一环。"
        : "拆解边界：先判断它是不是生产型兴趣，再判断有没有匹配能力，最后判断有没有落到具体业务里。",
    ].join("\n\n"),
    usageScenarios: sharedUsage,
  });

  if (isIndustryStrategyContext(context)) {
    candidates.QST.push({
      key: "qst-wrong-question",
      title: "为什么不能先问某某行业怎么做",
      questionText: "为什么「某某行业怎么做」是一个错误问题，而不是一个能直接帮你找到生意的问题？",
      questionType: "认知问题",
      applicableTopics: [theme, ...sharedUsage.slice(0, 2)].filter(Boolean),
      bodyText: [
        "核心问题：为什么「某某行业怎么做」是一个错误问题，而不是一个能直接帮你找到生意的问题？",
        "拆解焦点：行业内部会分化出大量具体生意路径，真正需要判断的是哪条路径适合你测试，而不是先研究整条赛道。",
      ].join("\n\n"),
      usageScenarios: sharedUsage,
    });
  }

  if (isPassiveIncomeSystemContext(context)) {
    candidates.QST.push({
      key: "qst-passive-income-definition",
      title: "被动收入不是啥都不干",
      questionText: "为什么被动收入不是啥都不干，而是资金流入和时间支出不再线性相关？",
      questionType: "认知问题",
      applicableTopics: [theme, ...sharedUsage.slice(0, 2)].filter(Boolean),
      bodyText: [
        "核心问题：为什么被动收入不是啥都不干，而是资金流入和时间支出不再线性相关？",
        "拆解焦点：不是追求彻底不劳动，而是先搭一个系统，让系统替你承接一部分流量、成交和交付，你负责维护和升级。",
      ].join("\n\n"),
      usageScenarios: sharedUsage,
    });
  }

  if (isBossMindsetContext(context)) {
    candidates.QST.push({
      key: "qst-demand-before-skill",
      title: "为什么不能从我的能力怎么变现开始问",
      questionText: "为什么「我有这个能力，怎么把它变现」通常是一个会把人带回打工思维的问题？",
      questionType: "认知问题",
      applicableTopics: [theme, ...sharedUsage.slice(0, 2)].filter(Boolean),
      bodyText: [
        "核心问题：为什么「我有这个能力，怎么把它变现」通常会把人带回打工思维？",
        "拆解焦点：因为它默认先有技能再去找需求，思路是从左到右，而真正能创业赚钱的路径是先有需求，再倒推产品、内容和能力。",
      ].join("\n\n"),
      usageScenarios: sharedUsage,
    });
  }

  const whyBlock = findSummaryBlock(context, /为什么/);
  if (whyBlock) {
    const whyQuestion = ensureQuestion(whyBlock.heading);
    candidates.QST.push({
      key: "qst-why-block",
      title: removeLeadingSerial(whyBlock.heading),
      questionText: whyQuestion,
      questionType: detectQuestionType(whyQuestion),
      applicableTopics: [theme, ...sharedUsage.slice(0, 2)].filter(Boolean),
      bodyText: [
        `核心问题：${whyQuestion}`,
        `拆解焦点：${whyBlock.bullets.join("；") || cleanSentence(whyBlock.body)}`,
      ].join("\n\n"),
      usageScenarios: sharedUsage,
    });
  }

  const conceptTitle = /生产型兴趣/.test(context.conceptText)
    ? "生产型兴趣与消费型兴趣的区别"
    : /赛道思维|具体生意|686种组合/.test(`${context.coreTheme} ${context.normalizedTitle}`)
    ? "具体生意与赛道思维的区别"
    : isAntifragileIncomeContext(context)
    ? "工资稳定性与反脆弱的区别"
    : isPassiveIncomeSystemContext(context)
    ? "被动收入与系统赚钱的区别"
    : isBossMindsetContext(context)
    ? "员工思维与老板思维的区别"
    : `${context.normalizedTitle} 的关键概念`;
  candidates.CON.push({
    key: "con-main",
    title: conceptTitle,
    conceptDefinition: /赛道思维|具体生意|686种组合/.test(`${context.coreTheme} ${context.normalizedTitle}`)
      ? "赛道思维是先按行业标签提问，再试图穷举行业里的所有做法；具体生意思维是先找到一个真实赚钱的业务闭环，再拆解它的内容、流量、变现和产品组合"
      : isAntifragileIncomeContext(context)
      ? "稳定工资本质上是一种保险安排：个体把业务波动和风险转手给雇主，换取确定性的现金流；反脆弱则是在波动和不确定性出现时，能力、储备和选择权反而会被放大"
      : isPassiveIncomeSystemContext(context)
      ? "被动收入不是完全不干活，而是收入和时间投入不再线性绑定；系统赚钱则是把原本靠人完成的获客、成交、交付，改造成一个可维护、可放量的系统"
      : isBossMindsetContext(context)
      ? "员工思维是从自己会什么能力出发，再问能不能变现；老板思维是从用户需求出发，再倒推要做什么产品、内容和该找谁解决能力问题"
      : context.conceptText,
    conceptFunction: /赛道思维|具体生意|686种组合/.test(`${context.coreTheme} ${context.normalizedTitle}`)
      ? "用于解释为什么行业问题通常无效，以及为什么从零到一更适合先拆具体生意而不是先研究整条赛道"
      : isAntifragileIncomeContext(context)
      ? "用于解释为什么稳定并不免费，以及为什么真正长期安全来自承受和利用波动的能力，而不是表面上的固定收入"
      : isPassiveIncomeSystemContext(context)
      ? "用于区分做一笔就停的一次性收入，和能够持续承接现金流的赚钱系统，也用于解释为什么真正关键的是系统而不是被动两个字"
      : isBossMindsetContext(context)
      ? "用于解释为什么很多能力很强的人一离开公司就赚不到钱，也用于解释内容、产品、需求和分工之间的正确连接顺序"
      : context.conceptFunction,
    bodyText: [
      `概念定义：${
        /赛道思维|具体生意|686种组合/.test(`${context.coreTheme} ${context.normalizedTitle}`)
          ? "赛道思维是先按行业标签提问，再试图穷举行业里的所有做法；具体生意思维是先找到一个真实赚钱的业务闭环，再拆解它的内容、流量、变现和产品组合"
          : isAntifragileIncomeContext(context)
          ? "稳定工资本质上是一种保险安排：个体把业务波动和风险转手给雇主，换取确定性的现金流；反脆弱则是在波动和不确定性出现时，能力、储备和选择权反而会被放大"
          : isPassiveIncomeSystemContext(context)
          ? "被动收入不是完全不干活，而是收入和时间投入不再线性绑定；系统赚钱则是把原本靠人完成的获客、成交、交付，改造成一个可维护、可放量的系统"
          : isBossMindsetContext(context)
          ? "员工思维是从自己会什么能力出发，再问能不能变现；老板思维是从用户需求出发，再倒推要做什么产品、内容和该找谁解决能力问题"
          : context.conceptText
      }`,
      `解释作用：${
        /赛道思维|具体生意|686种组合/.test(`${context.coreTheme} ${context.normalizedTitle}`)
          ? "用于解释为什么行业问题通常无效，以及为什么从零到一更适合先拆具体生意而不是先研究整条赛道"
          : isAntifragileIncomeContext(context)
          ? "用于解释为什么稳定并不免费，以及为什么真正长期安全来自承受和利用波动的能力，而不是表面上的固定收入"
          : isPassiveIncomeSystemContext(context)
          ? "用于区分做一笔就停的一次性收入，和能够持续承接现金流的赚钱系统，也用于解释为什么真正关键的是系统而不是被动两个字"
          : isBossMindsetContext(context)
          ? "用于解释为什么很多能力很强的人一离开公司就赚不到钱，也用于解释内容、产品、需求和分工之间的正确连接顺序"
          : context.conceptFunction
      }`,
    ].join("\n\n"),
    usageScenarios: sharedUsage,
    relationshipRefs: [
      { type: "解释", targetKey: "opi-main", note: "概念解释核心观点" },
      { type: "解释", targetKey: "qst-main", note: "概念解释主问题" },
    ],
  });

  const mainOpinion = buildMainOpinion(context);
  candidates.OPI.push({
    key: "opi-main",
    title: /生产型兴趣/.test(context.conceptText)
      ? "兴趣变现不是看兴趣本身"
      : /赛道思维|具体生意|686种组合/.test(`${context.coreTheme} ${context.normalizedTitle}`)
      ? "不要先问行业，先问具体生意"
      : isAntifragileIncomeContext(context)
      ? "工资的本质是一份稳定性保险"
      : isPassiveIncomeSystemContext(context)
      ? "被动收入的核心是系统赚钱"
      : isBossMindsetContext(context)
      ? "先看需求，不要先看能力"
      : `${context.normalizedTitle} 的核心观点`,
    coreClaim: mainOpinion,
    claimScope: cleanSentence(sharedUsage.join("；") || "适用于当前主题的核心论证场景"),
    whyItMatters: "这条判断把一个空泛的大问题，改成了可以逐项核对的结构化问题。",
    bodyText: [
      `核心判断：${mainOpinion}`,
      "判断价值：它可以直接用来筛掉无效兴趣、无效能力和没有业务承接的空想法。",
    ].join("\n\n"),
    usageScenarios: sharedUsage,
    relationshipRefs: [
      { type: "回应", targetKey: "qst-main", note: "观点回应主问题" },
    ],
  });

  if (/赛道思维|具体生意|686种组合/.test(`${context.coreTheme} ${context.normalizedTitle}`)) {
    candidates.OPI.push({
      key: "opi-can-do-vs-you-can-do",
      title: "能做不代表你能做",
      coreClaim: "任何合法行业都有人赚钱，但行业能做不代表这个具体生意你现在就能做，真正该验证的是你的能力能不能撑起这条业务路径",
      claimScope: cleanSentence(sharedUsage.join("；") || "适用于从零到一找生意与测试路径场景"),
      whyItMatters: "这条判断把行业判断转成个人能力判断，直接决定测试方向。",
      bodyText: [
        "核心判断：任何合法行业都有人赚钱，但行业能做不代表这个具体生意你现在就能做。",
        "判断价值：真正需要验证的不是行业本身，而是你的能力能不能撑起这条业务路径。",
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "回应", targetKey: "qst-main", note: "观点补充主问题的判断边界" },
      ],
    });
  }

  if (isAntifragileIncomeContext(context)) {
    candidates.OPI.push({
      key: "opi-stability-is-expensive",
      title: "稳定是昂贵的奢侈品",
      coreClaim: "真正昂贵的不是波动，而是稳定；越想让收入看起来旱涝保收，就越会在看不见的地方支付高额保险费和选择权成本",
      claimScope: cleanSentence(sharedUsage.join("；") || "适用于解释稳定收入、负债约束和风险承受能力的场景"),
      whyItMatters: "这条判断把稳定从美德改写成交易结果，能直接改变人对风险的理解。",
      bodyText: [
        "核心判断：真正昂贵的不是波动，而是稳定。",
        "判断价值：一旦理解稳定是交易结果，就会开始计算自己为确定性支付了哪些代价。",
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "回应", targetKey: "qst-main", note: "观点补充稳定性的代价" },
      ],
    });
  }

  if (isPassiveIncomeSystemContext(context)) {
    candidates.OPI.push({
      key: "opi-interest-in-system",
      title: "把兴趣融进系统才更持久",
      coreClaim: "长期更优的状态，不是系统能赚钱但你厌烦维护，而是把兴趣融入内容和业务里，让维护系统这件事本身也变成你愿意主动做的事情",
      claimScope: cleanSentence(sharedUsage.join("；") || "适用于内容业务、个人 IP 和长期被动收入系统设计场景"),
      whyItMatters: "这条判断把赚钱系统从冷冰冰的自动机，推进到可以长期迭代的人和系统共生结构。",
      bodyText: [
        "核心判断：长期更优的状态，不是系统能赚钱但你厌烦维护，而是把兴趣融进内容和业务里。",
        "判断价值：这样系统越做越像你自己，而不是越赚钱越像新的打工。",
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "回应", targetKey: "qst-main", note: "观点补充主问题的长期目标" },
      ],
    });
  }

  if (isBossMindsetContext(context)) {
    candidates.OPI.push({
      key: "opi-benchmark-proof",
      title: "对标是内容和产品匹配的证据",
      coreClaim: "对标的价值不是抄别人，而是用已经赚钱的样本证明：这样的内容和这样的产品确实能满足真实需求",
      claimScope: cleanSentence(sharedUsage.join("；") || "适用于内容选题、产品设计和商业验证场景"),
      whyItMatters: "这条判断把找对标从模糊方法论，变成了连接需求、内容和产品的验证工具。",
      bodyText: [
        "核心判断：对标的价值不是抄别人，而是验证内容和产品的匹配是否已经被市场证明。",
        "判断价值：它能减少拍脑袋设计产品和内容的概率，让验证先于投入。",
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "回应", targetKey: "qst-main", note: "观点补充验证路径" },
      ],
    });
  }

  if (whyBlock) {
    const secondaryClaim = /本质/.test(whyBlock.body) || whyBlock.bullets.some((item) => /本质/.test(item))
      ? "答疑群难做的本质，不是产品形态有问题，而是运营者缺少把答疑沉淀为内容、理解用户并升维解释问题的能力"
      : cleanSentence(whyBlock.body);
    candidates.OPI.push({
      key: "opi-why-block",
      title: removeLeadingSerial(whyBlock.heading),
      coreClaim: secondaryClaim,
      claimScope: cleanSentence(sharedUsage.join("；") || "适用于答疑、咨询和内容沉淀场景"),
      whyItMatters: "这条判断解释了为什么同一种业务形态，换不同的人来做，结果会完全不同。",
      bodyText: [
        `核心判断：${secondaryClaim}`,
        `展开依据：${whyBlock.bullets.join("；") || cleanSentence(whyBlock.body)}`,
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "回应", targetKey: "qst-why-block", note: "观点回应补充问题" },
      ],
    });
  }

  const publicOutputParagraph = findVideoParagraph(context, /一万两千条|1\.2万|一万粉丝|1万粉丝|推文/);
  if (publicOutputParagraph) {
    candidates.CAS.push({
      key: "cas-public-output",
      title: "公开输出先换到数据验证",
      caseSubject: "把生产型兴趣先公开输出，再用数据验证价值",
      caseSummary: "先不急着做产品，而是把高价值判断公开发出去，用持续输出换到第一批数据反馈。",
      caseProcess: "不把内容留在私密笔记里，而是连续公开发布推文；先观察有没有人点赞、关注、转发，再决定下一步去哪里放大流量和业务。",
      caseResult: "持续约 14 个月发布约 1.2 万条推文，1 个月获得 1 万粉丝，证明这类输出确实有人需要。",
      bodyText: [
        "案例摘要：先把有价值的判断公开输出，用数据验证生产型兴趣是否真有市场需求。",
        "关键过程：持续公开发布推文，先换到数据，再决定产品和平台迁移。",
        "结果：持续约 14 个月发布约 1.2 万条推文，1 个月获得 1 万粉丝。",
        "证明点：先换到数据，才能知道兴趣到底是不是值得继续做的生产型兴趣。",
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "证明", targetKey: "opi-main", note: "案例证明主观点" },
        { type: "承接", targetKey: "sol-path", note: "案例落在增长路径的前两步" },
      ],
    });
  }

  if (/686种组合|686 种组合/.test(textifyContext(context))) {
    candidates.CAS.push({
      key: "cas-686-combinations",
      title: "686种组合证明行业问题无效",
      caseSubject: "用 686 种组合说明为什么不能先问行业怎么做",
      caseSummary: "把内容、流量、变现、产品四个维度拆开后，同一个行业内部就会出现大量组合，单问行业怎么做没有实际指导意义。",
      caseProcess: "先拆内容载体，再拆流量放大方式，再拆变现路径，最后拆产品策略，把每个维度的组合乘起来，看见一个行业内部不是一条路径而是大量路径。",
      caseResult: "仅按精简版拆解就能得到 686 种情况，已经足以说明研究行业标签本身不能帮人快速找到自己的从零到一路径。",
      bodyText: [
        "案例摘要：把内容、流量、变现、产品四个维度拆开后，同一个行业内部会出现大量组合。",
        "关键过程：逐层拆内容、流量、变现、产品，并把它们按组合关系乘起来。",
        "结果：仅精简版就能得到 686 种情况。",
        "证明点：单问行业怎么做，无法直接导出一个适合你的具体生意路径。",
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "证明", targetKey: "opi-main", note: "案例证明不能先问行业" },
      ],
    });
  }

  if (isAntifragileIncomeContext(context) && /二十四万|24万|六万|6万|保险/.test(textifyContext(context))) {
    candidates.CAS.push({
      key: "cas-salary-insurance",
      title: "24万收益换6万工资说明保险费逻辑",
      caseSubject: "用雇佣关系解释工资为什么像保险费",
      caseSummary: "员工创造的是波动收益，但要求雇主按月稳定付款，工资差额本质上就是把业务风险转手后的保险费。",
      caseProcess: "先看岗位一年能创造多少价值，再看雇主必须在亏损月份也持续支付工资，最后比较总创造价值和总工资之间的差额。",
      caseResult: "当一年创造 24 万、只拿 6 万工资时，中间的差额可以被理解为购买稳定性的隐性保险费。",
      bodyText: [
        "案例摘要：员工创造的是波动收益，但要求按月稳定发薪，差额本质上是保险费。",
        "关键过程：比较岗位创造价值、工资刚性支付和风险承担方是谁。",
        "结果：创造 24 万、拿 6 万工资时，差额可以被理解为稳定性保险费。",
        "证明点：工资并不只是劳动报酬，也是一种把风险打包转移出去的交易安排。",
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "证明", targetKey: "opi-main", note: "案例证明工资像保险费" },
      ],
    });
  }

  if (isPassiveIncomeSystemContext(context)) {
    candidates.CAS.push({
      key: "cas-ai-affiliate",
      title: "AI 产品分佣说明零投入层级",
      caseSubject: "用 AI 产品分佣说明被动收入的最低层级",
      caseSummary: "分享自己真的在用的 AI 产品，对方通过分佣链接购买，你获得佣金，这是一种接近零投入但也难以主动放量的被动收入模式。",
      caseProcess: "先持续公开分享产品使用体验，再在有人主动来问时提供分佣链接，让系统自动完成折扣和返佣。",
      caseResult: "连续 3 个月月均约 187 美金，证明零投入模式可以赚钱，但也暴露出放量能力弱的问题。",
      bodyText: [
        "案例摘要：分享真实使用体验，再通过分佣链接自动完成成交和返佣。",
        "关键过程：先公开种草，再在用户主动询问时给链接，而不是自己手动成交。",
        "结果：连续 3 个月月均约 187 美金。",
        "证明点：零投入层级确实能赚钱，但很难主动扩张和放量。",
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "证明", targetKey: "opi-main", note: "案例证明系统层级差异" },
      ],
    });

    candidates.CAS.push({
      key: "cas-blogger-distribution",
      title: "博主分销说明可放量但有天花板",
      caseSubject: "用博主分销 PDF 说明系统可放量但有天花板",
      caseSummary: "博主发内容，粉丝即时付费，系统自动分佣，这让分销者比员工还主动，但话题疲劳和博主总数会限制增长。",
      caseProcess: "先打通销售链路和即时分佣，再持续拓展新博主；随着话题变窄和审美疲劳增加，必须越来越快地补充新渠道。",
      caseResult: "系统具备主动放量能力，但最终仍会受博主总数、题材宽度和维护成本限制。",
      bodyText: [
        "案例摘要：通过即时分佣让博主主动帮你卖货，系统开始具备放量能力。",
        "关键过程：打通博主发文、评论区成交、即时分佣这条链路，并持续补充新博主。",
        "结果：可以放量，但会受到题材疲劳和渠道总数限制。",
        "证明点：系统能放量，不代表天花板自动消失，维护仍是成本。",
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "证明", targetKey: "opi-main", note: "案例证明系统赚钱的中间层级" },
      ],
    });

    candidates.CAS.push({
      key: "cas-ip-long-tail",
      title: "自增长长尾流量是更高层的系统",
      caseSubject: "用自媒体 IP 说明更高层的被动收入系统",
      caseSummary: "把研究 AI 产品这个兴趣，转成图文、视频、私域、课程和社群的组合，形成既能拿流量又能承接产品的长尾系统。",
      caseProcess: "把兴趣内容拆成适合算法传播的流量内容和适合买家转化的产品内容，再让平台流量持续进入课程和社群。",
      caseResult: "系统不仅能赚钱，还能把兴趣成本摊进业务里，让维护系统本身变成更愿意主动做的事。",
      bodyText: [
        "案例摘要：把兴趣、内容、流量和产品接成一个会自增长的长尾系统。",
        "关键过程：图文去承接私域和品牌，视频去承接平台流量，流量再进入课程和社群。",
        "结果：系统既能赚钱，也能让兴趣被纳入业务，而不是和业务分离。",
        "证明点：更高层的被动收入，不只是自动化，更是兴趣和系统的长期结合。",
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "证明", targetKey: "opi-interest-in-system", note: "案例证明兴趣融入系统" },
      ],
    });
  }

  if (isBossMindsetContext(context)) {
    candidates.CAS.push({
      key: "cas-lemonade-demand",
      title: "卖柠檬水说明需求先于原料",
      caseSubject: "用卖柠檬水说明为什么不能从我家有什么出发",
      caseSummary: "真正能赚钱的表述不是我家有柠檬能不能卖，而是夏天很热、路上人多，所以我做冰柠檬水去满足需求。",
      caseProcess: "先判断街上有没有人愿意买冷饮，再决定卖什么水果，而不是先看家里有什么原料。",
      caseResult: "案例说明从原料和技能出发会把问题问反，需求才是更稳定的起点。",
      bodyText: [
        "案例摘要：不是因为家里有柠檬才去卖柠檬水，而是因为路上有人要买冷饮。",
        "关键过程：先看需求，再决定用什么原料去满足需求。",
        "结果：同样是卖饮料，需求导向的成功率远高于库存导向。",
        "证明点：赚钱时先问用户要什么，比先问我手里有什么更重要。",
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "证明", targetKey: "opi-main", note: "案例证明需求先于能力" },
      ],
    });

    candidates.CAS.push({
      key: "cas-ai-course-wrong-order",
      title: "先写课程大纲再问能不能卖是顺序错了",
      caseSubject: "用 AI 课程案例说明为什么不能先做产品再找需求",
      caseSummary: "如果一个人只会先列课程大纲，却完全不谈用户要解决什么问题，那么这个产品即使做完，也没有明确的成交对象和推出路径。",
      caseProcess: "先写课程内容，再反过来问能不能卖；问题在于用户需求、产品定位和内容推出路径都还没有被确认。",
      caseResult: "案例说明产品设计如果脱离需求验证，最后往往不是卖不掉，就是根本不知道怎么推出去。",
      bodyText: [
        "案例摘要：先把课程做完，再来问能不能卖，顺序已经错了。",
        "关键过程：只谈课程结构，不谈用户需求、问题场景和推出路径。",
        "结果：即使产品本身不差，也很难找到明确买家和推出方式。",
        "证明点：先找需求，再做产品，比先做产品再问谁会买更有效。",
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "证明", targetKey: "opi-main", note: "案例证明需求先于产品" },
      ],
    });

    candidates.CAS.push({
      key: "cas-middleman-90",
      title: "中介分走 90% 说明匹配需求更值钱",
      caseSubject: "用中介分成说明匹配需求与产品才是核心价值",
      caseSummary: "能做产品的人未必拿走大头，真正更值钱的是找到真实需求、匹配产品并完成转化的人。",
      caseProcess: "先找到 A 的需求，再找到 B 的交付能力，最后把供需两端接起来；这时做连接和匹配的人会拿走大部分收益。",
      caseResult: "案例说明在交易里，需求判断和产品匹配常常比单一执行能力更稀缺、更接近钱。",
      bodyText: [
        "案例摘要：会做东西的人不一定分得最多，接通需求和产品的人往往拿走更大价值。",
        "关键过程：先找需求，再找产品提供者，最后完成撮合和转化。",
        "结果：需求匹配与成交路径的价值，常常高于单独生产一个产品。",
        "证明点：能力不是没价值，但它不是整个链路里最稀缺的那一段。",
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "证明", targetKey: "opi-main", note: "案例证明需求匹配更接近钱" },
      ],
    });
  }

  const experimentParagraph = findVideoParagraph(context, /1600万|一千六百万|十二万|12万|两万粉丝|2万粉丝/);
  if (experimentParagraph) {
    candidates.CAS.push({
      key: "cas-douyin-experiment",
      title: "先发 100 条再做抖音开头实验",
      caseSubject: "通过高频发布和开头实验验证短视频反馈机制",
      caseSummary: "先设定发满 100 条的反馈学习路径，再通过复用爆款开头的实验，验证短视频流量机制。",
      caseProcess: "先不追求一条就火，而是先发满 100 条收集正负反馈；随后拿一条爆款开头做对照实验，观察为什么同样的开头会不会火。",
      caseResult: "单条视频拿到约 1600 万播放，账号粉丝从约 2 万增长到约 12 万，直接验证了持续测试的回报。",
      bodyText: [
        "案例摘要：先通过高频发布建立反馈样本，再用开头实验验证流量机制。",
        "关键过程：先发满 100 条，再做一次明确的变量实验，而不是靠上课替代测试。",
        "结果：单条视频约 1600 万播放，粉丝从约 2 万增长到约 12 万。",
        "证明点：真正有效的增长理解，来自可追溯的反馈实验，不来自抽象技巧清单。",
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "证明", targetKey: "opi-main", note: "案例证明主观点" },
        { type: "证明", targetKey: "sol-path", note: "案例证明增长路径可行" },
      ],
    });
  }

  const threePartSteps = buildThreePartSteps(context);
  candidates.SOL.push({
    key: "sol-three-part",
    title: /生产型兴趣/.test(context.conceptText)
      ? "兴趣变现三要素检查法"
      : isPassiveIncomeSystemContext(context)
      ? "系统化构建被动收入的三步方案"
      : isBossMindsetContext(context)
      ? "从需求倒推而不是从能力出发"
      : `${context.normalizedTitle} 的三步方案`,
    targetProblem: mainQuestion,
    solutionSummary: isIndustryStrategyContext(context)
      ? "先放弃赛道提问，再拆具体生意组合，最后用短周期测试判断这条路径你能不能做。"
      : isAntifragileIncomeContext(context)
      ? "先识别稳定性的真实成本，再补足自己的反脆弱底盘，最后把收入目标改成和价值创造挂钩。"
      : isPassiveIncomeSystemContext(context)
      ? "先承认被动收入的核心是系统，再判断系统层级，最后把兴趣融进可维护、可放量的结构。"
      : isBossMindsetContext(context)
      ? "先从需求出发，再用对标验证内容和产品组合，最后倒推自己该补哪种能力。"
      : "先确认兴趣是否具有生产性，再补齐与兴趣匹配的能力，最后把两者放进一个具体业务。",
    actionSteps: threePartSteps,
    expectedResult: isIndustryStrategyContext(context)
      ? "把行业层面的空问题改写成可以直接测试、直接迭代的具体生意路径。"
      : isAntifragileIncomeContext(context)
      ? "把对稳定收入的依赖，逐步改写成对储备、能力和波动适应性的依赖。"
      : isPassiveIncomeSystemContext(context)
      ? "逐步把收入从一次性人力交换，升级成一个能维护、能放量、也能和兴趣长期兼容的系统。"
      : isBossMindsetContext(context)
      ? "把我会什么怎么变现，改造成谁有需求、什么组合被验证、我该补哪一环的清晰路径。"
      : "把「兴趣能不能赚钱」改写成可以逐项核对、可以继续迭代的 3 步检查框架。",
    bodyText: [
      isIndustryStrategyContext(context)
        ? "方案摘要：先放弃赛道提问，再拆具体生意，最后做短周期测试。"
        : isAntifragileIncomeContext(context)
        ? "方案摘要：先看稳定成本，再练反脆弱能力，最后重建收入观。"
        : isPassiveIncomeSystemContext(context)
        ? "方案摘要：先搭系统，再分层级，最后把兴趣融进去。"
        : isBossMindsetContext(context)
        ? "方案摘要：先看需求，再找对标，最后补能力。"
        : "方案摘要：先判断生产性，再判断能力，再判断业务承接。",
      buildBulletBody(threePartSteps),
    ].join("\n\n"),
    usageScenarios: sharedUsage,
    relationshipRefs: [
      { type: "回应", targetKey: "qst-main", note: "方案回应主问题" },
      { type: "承接", targetKey: "opi-main", note: "方案落地核心观点" },
    ],
  });

  if (isAntifragileIncomeContext(context)) {
    candidates.SOL.push({
      key: "sol-antifragile-path",
      title: "把自己练成反脆弱的路径",
      targetProblem: mainQuestion,
      solutionSummary: "避免高杠杆，保留储备金，持续扩大跨学科能力，让自己在风险和机会来临时拥有更多选择。",
      actionSteps: [
        "先避免高杠杆负债，减少房贷车贷这类会抽走你风险承受能力的固定成本",
        "准备 6 到 12 个月储备金，让自己在波动中不被立刻击穿",
        "持续学习跨行业、跨学科能力，让机遇和风险来临时自己能够升级而不是被动承受",
      ],
      expectedResult: "当社会环境波动时，你不是更脆弱，而是更容易抓住机会并放大自身价值。",
      bodyText: [
        "方案摘要：减负债、留储备、练能力，把自己放到会因波动而变强的位置。",
        buildBulletBody([
          "先避免高杠杆负债，减少房贷车贷这类会抽走你风险承受能力的固定成本",
          "准备 6 到 12 个月储备金，让自己在波动中不被立刻击穿",
          "持续学习跨行业、跨学科能力，让机遇和风险来临时自己能够升级而不是被动承受",
        ]),
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "回应", targetKey: "qst-main", note: "方案回应主问题" },
        { type: "承接", targetKey: "opi-stability-is-expensive", note: "方案承接稳定性代价判断" },
      ],
    });
  }

  const pathSteps = buildPathSteps(context);
  if (pathSteps.length > 0) {
    candidates.SOL.push({
      key: "sol-path",
      title: /关键路径/.test((findSummaryBlock(context, /关键路径|增长路径|执行路径/) || {}).heading || "")
        ? removeLeadingSerial(findSummaryBlock(context, /关键路径|增长路径|执行路径/).heading)
        : "从数据到业务的增长路径",
      targetProblem: mainQuestion,
      solutionSummary: "先公开输出换到数据，再用数据换产品，用产品倒逼能力，最后把能力放大成流量和商业模式。",
      actionSteps: pathSteps,
      expectedResult: "形成一条从兴趣出发、经过数据验证、最终落到具体业务的增长闭环。",
      bodyText: [
        "方案摘要：把兴趣先拿去换数据，再把数据依次换成产品、能力、流量和商业模式。",
        buildBulletBody(pathSteps),
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "回应", targetKey: "qst-main", note: "方案回应主问题" },
        { type: "承接", targetKey: "opi-main", note: "方案承接核心观点" },
      ],
    });
  }

  if (/赛道思维|具体生意|686种组合/.test(`${context.coreTheme} ${context.normalizedTitle}`)) {
    candidates.SOL.push({
      key: "sol-test-path",
      title: "从零到一测试具体生意的路径",
      targetProblem: mainQuestion,
      solutionSummary: "先找一个真实赚钱的具体生意，再拆它的组合方式，最后用短周期测试验证自己能不能做。",
      actionSteps: [
        "随机找一个已经赚钱的具体生意，而不是先研究整条行业赛道",
        "把这个生意拆成内容、流量、变现、产品几个维度，看清它的闭环",
        "给自己半个月到一个月去测试，失败就记录自己不擅长什么，下一次直接规避",
      ],
      expectedResult: "更快找到一个你自己能从零到一跑通的具体生意，而不是停留在行业层面的空讨论。",
      bodyText: [
        "方案摘要：先找具体生意，再拆组合，再做短周期测试。",
        buildBulletBody([
          "随机找一个已经赚钱的具体生意，而不是先研究整条行业赛道",
          "把这个生意拆成内容、流量、变现、产品几个维度，看清它的闭环",
          "给自己半个月到一个月去测试，失败就记录自己不擅长什么，下一次直接规避",
        ]),
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "回应", targetKey: "qst-main", note: "方案回应主问题" },
        { type: "承接", targetKey: "opi-main", note: "方案承接核心观点" },
        { type: "承接", targetKey: "opi-can-do-vs-you-can-do", note: "方案承接能力匹配判断" },
      ],
    });
  }

  if (isPassiveIncomeSystemContext(context)) {
    candidates.SOL.push({
      key: "sol-passive-income-layers",
      title: "构建被动收入系统的四层路径",
      targetProblem: mainQuestion,
      solutionSummary: "先用最低成本跑出自动成交链路，再升级到可放量结构，继续判断天花板，最后追求自增长长尾流量。",
      actionSteps: [
        "先用最低成本跑出一条能自动成交的最小链路，例如分佣、自动交付或即时分润",
        "再把系统升级到可以主动放量的结构，例如渠道分销、广告放量或产品线扩展",
        "继续判断天花板来自哪里，是题材、渠道、流量还是产品创新空间",
        "最后把兴趣和稀缺内容能力接进系统，形成能自增长的长尾流量和更稳定的产品承接",
      ],
      expectedResult: "你会清楚自己当前在哪一层，以及下一层应该升级系统的哪个部件。",
      bodyText: [
        "方案摘要：从零投入最小链路起步，升级到可放量结构，再追求自增长长尾流量。",
        buildBulletBody([
          "先用最低成本跑出一条能自动成交的最小链路，例如分佣、自动交付或即时分润",
          "再把系统升级到可以主动放量的结构，例如渠道分销、广告放量或产品线扩展",
          "继续判断天花板来自哪里，是题材、渠道、流量还是产品创新空间",
          "最后把兴趣和稀缺内容能力接进系统，形成能自增长的长尾流量和更稳定的产品承接",
        ]),
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "回应", targetKey: "qst-main", note: "方案回应主问题" },
        { type: "承接", targetKey: "opi-main", note: "方案承接系统赚钱判断" },
        { type: "承接", targetKey: "opi-interest-in-system", note: "方案承接兴趣融入系统判断" },
      ],
    });
  }

  if (isBossMindsetContext(context)) {
    candidates.SOL.push({
      key: "sol-right-to-left",
      title: "从右到左的赚钱判断路径",
      targetProblem: mainQuestion,
      solutionSummary: "先看需求，再看对标已验证的内容和产品组合，最后倒推自己要补哪种能力、找哪种合作。",
      actionSteps: [
        "先写清楚用户到底要解决什么问题，而不是先罗列自己有什么技能",
        "去找已经赚钱的对标样本，确认什么内容和什么产品组合确实能满足这个需求",
        "把整条链路拆成需求、内容、产品、交付几个环节，判断哪些自己做、哪些去学、哪些去雇人",
        "最后再决定当前最值得投入的能力，而不是让已有技能反过来决定业务方向",
      ],
      expectedResult: "把我会什么怎么变现，改造成谁有需求、什么组合被验证、我该补哪一环的清晰路径。",
      bodyText: [
        "方案摘要：先需求，后对标，再拆链路，最后补能力。",
        buildBulletBody([
          "先写清楚用户到底要解决什么问题，而不是先罗列自己有什么技能",
          "去找已经赚钱的对标样本，确认什么内容和什么产品组合确实能满足这个需求",
          "把整条链路拆成需求、内容、产品、交付几个环节，判断哪些自己做、哪些去学、哪些去雇人",
          "最后再决定当前最值得投入的能力，而不是让已有技能反过来决定业务方向",
        ]),
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "回应", targetKey: "qst-main", note: "方案回应主问题" },
        { type: "承接", targetKey: "opi-main", note: "方案承接需求导向判断" },
        { type: "承接", targetKey: "opi-benchmark-proof", note: "方案承接对标验证判断" },
      ],
    });
  }

  if (candidates.CAS.length === 0) {
    candidates.CAS.push({
      key: "cas-fallback",
      title: `${context.normalizedTitle} 的关键案例`,
      caseSubject: context.normalizedTitle,
      caseSummary: truncateText(context.caseSummary || context.opinionText, 90),
      caseProcess: truncateText(context.caseProcess, 120),
      caseResult: truncateText(context.caseResult, 120),
      bodyText: [
        `案例摘要：${truncateText(context.caseSummary || context.opinionText, 120)}`,
        `关键过程：${truncateText(context.caseProcess, 120)}`,
        `结果：${truncateText(context.caseResult, 120)}`,
      ].join("\n\n"),
      usageScenarios: sharedUsage,
      relationshipRefs: [
        { type: "证明", targetKey: "opi-main", note: "案例证明主观点" },
      ],
    });
  }

  for (const type of Object.keys(candidates)) {
    candidates[type] = dedupeBy(candidates[type], (item) => `${item.title}::${item.bodyText}`);
  }
  return candidates;
}

function textifyContext(context) {
  return [
    context.title,
    context.normalizedTitle,
    context.coreTheme,
    ...(context.videoSummary || []),
    ...(context.summaryParagraphs || []),
    ...(context.structuredBullets || []),
    ...(context.summaryBlocks || []).map((item) => `${item.heading} ${item.body} ${(item.bullets || []).join(" ")}`),
  ].join("\n");
}

function applyTemplate(prefix, data) {
  const templatePath = path.join(templateRoot, typeConfig[prefix].template);
  let content = fs.readFileSync(templatePath, "utf8");
  const formattedDate = `${data.date.slice(0, 4)}-${data.date.slice(4, 6)}-${data.date.slice(6, 8)}`;

  content = content
    .replace(`${prefix}-YYYYMMDD-001`, data.id)
    .replace(/^title:\s*标题$/m, `title: ${data.title}`)
    .replace(/^created_at:\s*YYYY-MM-DD$/m, `created_at: ${formattedDate}`)
    .replace(/^updated_at:\s*YYYY-MM-DD$/m, `updated_at: ${formattedDate}`)
    .replace(/^source_documents:\n(?:  - .+\n)+/m, `source_documents:\n  - ${data.sourceId}\n`)
    .replace(/^source_authors:\n(?:  - .+\n)+/m, `source_authors:\n  - ${data.author}\n`)
    .replace(/^themes:\n(?:  - .+\n)+/m, `themes:\n  - ${data.theme}\n`)
    .replace(
      /^keywords:\n(?:  - .+\n)+/m,
      `keywords:\n${data.keywords.map((item) => `  - ${item}`).join("\n")}\n`
    );

  if (prefix === "QST") {
    content = content
      .replace(/^question_text:\s*问题原句$/m, `question_text: ${data.questionText}`)
      .replace(/^question_type:\s*认知问题$/m, `question_type: ${data.questionType}`)
      .replace(
        /^applicable_topics:\n(?:  - .+\n)+/m,
        `applicable_topics:\n${data.applicableTopics.map((item) => `  - ${item}`).join("\n")}\n`
      );
  }

  if (prefix === "CON") {
    content = content
      .replace(/^concept_definition:\s*概念定义$/m, `concept_definition: ${data.conceptDefinition}`)
      .replace(/^concept_function:\s*解释什么$/m, `concept_function: ${data.conceptFunction}`);
  }

  if (prefix === "OPI") {
    content = content
      .replace(/^core_claim:\s*核心判断$/m, `core_claim: ${data.coreClaim}`)
      .replace(/^claim_scope:\s*适用范围$/m, `claim_scope: ${data.claimScope}`)
      .replace(/^why_it_matters:\s*为什么重要$/m, `why_it_matters: ${data.whyItMatters}`);
  }

  if (prefix === "CAS") {
    content = content
      .replace(/^case_subject:\s*案例主体$/m, `case_subject: ${data.caseSubject}`)
      .replace(/^case_summary:\s*案例摘要$/m, `case_summary: ${data.caseSummary}`)
      .replace(/^case_process:\s*关键过程$/m, `case_process: ${data.caseProcess}`)
      .replace(/^case_result:\s*结果$/m, `case_result: ${data.caseResult}`);
  }

  if (prefix === "SOL") {
    content = content
      .replace(/^target_problem:\s*解决什么问题$/m, `target_problem: ${data.targetProblem}`)
      .replace(/^solution_summary:\s*方案摘要$/m, `solution_summary: ${data.solutionSummary}`)
      .replace(
        /^action_steps:\n(?:  - .+\n)+/m,
        `action_steps:\n${data.actionSteps.map((item) => `  - ${item}`).join("\n")}\n`
      )
      .replace(/^expected_result:\s*预期结果$/m, `expected_result: ${data.expectedResult}`);
  }

  if (data.relationships && data.relationships.length > 0) {
    content = content.replace(
      /^relationships:\s*\[\]$/m,
      `relationships:\n${data.relationships
        .map((item) => `  - type: ${item.type}\n    target: ${item.target}\n    note: ${item.note}`)
        .join("\n")}`
    );
  }

  content = content.replace(/^## 核心内容$/m, `## 核心内容\n\n${data.bodyText}\n`);
  content = content.replace(
    /^## 来源依据$/m,
    `## 来源依据\n\n- 来源文件：${data.sourceRel}\n- 来源类型：${data.sourceType}\n`
  );
  content = content.replace(
    /^## 使用场景$/m,
    `## 使用场景\n\n${data.usageScenarios.map((item) => `- ${item}`).join("\n")}\n`
  );

  return content;
}

function writeUnit(prefix, data) {
  const dir = path.join(unitRoot, typeConfig[prefix].dir);
  ensureDir(dir);
  const existingFiles = findExistingUnitFiles(prefix, data.title, data.sourceId, data.sourceRel);
  const normalizedTargetPath = path.join(dir, `${data.id}_${slugFromTitle(data.title)}.md`);
  let targetPath = normalizedTargetPath;
  if (existingFiles[0]) {
    targetPath = existingFiles[0];
    if (targetPath !== normalizedTargetPath) {
      if (fs.existsSync(normalizedTargetPath) && normalizedTargetPath !== targetPath) {
        moveFileToTrash(normalizedTargetPath, "重复单元清理");
      }
      fs.renameSync(targetPath, normalizedTargetPath);
      targetPath = normalizedTargetPath;
    }
  }
  for (const staleFile of existingFiles.slice(1)) moveFileToTrash(staleFile, "重复单元清理");
  fs.writeFileSync(targetPath, applyTemplate(prefix, data));
  return targetPath;
}

function readFrontmatterValue(content, field) {
  const match = content.match(new RegExp(`^${field}:\\s*(.+)$`, "m"));
  return match ? match[1].trim() : "";
}

function readFrontmatterList(content, field) {
  const match = content.match(new RegExp(`^${field}:\\n((?:\\s+-\\s+.+\\n?)*)`, "m"));
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((line) => line.trim().replace(/^- /, "").trim())
    .filter(Boolean);
}

function findExistingUnitFiles(prefix, title, sourceId, sourceRel) {
  const dir = path.join(unitRoot, typeConfig[prefix].dir);
  if (!fs.existsSync(dir)) return [];
  const matches = [];
  for (const name of fs.readdirSync(dir).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"))) {
    if (!name.endsWith(".md")) continue;
    const filePath = path.join(dir, name);
    const content = fs.readFileSync(filePath, "utf8");
    const existingTitle = readFrontmatterValue(content, "title");
    if (existingTitle !== title) continue;
    const sourceDocuments = readFrontmatterList(content, "source_documents");
    const sourceLines = content.match(/^-\s*来源文件：(.+)$/m);
    const existingSourceRel = sourceLines ? sourceLines[1].trim() : "";
    if (sourceDocuments.includes(sourceId) || existingSourceRel === sourceRel) matches.push(filePath);
  }
  return matches;
}

function resolveUnitIdentity(prefix, title, sourceId, sourceRel, dateText) {
  const existingFiles = findExistingUnitFiles(prefix, title, sourceId, sourceRel);
  if (existingFiles.length > 0) {
    const firstExistingId = readFrontmatterValue(fs.readFileSync(existingFiles[0], "utf8"), "id");
    return {
      id: firstExistingId || extractIdFromFilename(existingFiles[0]) || nextId(prefix, dateText),
      existingFiles,
    };
  }
  return {
    id: nextId(prefix, dateText),
    existingFiles: [],
  };
}

function loadExistingThemeMap(theme) {
  const filePath = path.join(themeRoot, `${slugFromTitle(theme)}.md`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf8");
}

function extractLinkedItems(content, heading) {
  const match = content.match(new RegExp(`## ${heading}\\n\\n([\\s\\S]*?)(?=\\n## |$)`));
  if (!match) return [];
  return [...match[1].matchAll(/\[\[([^\]]+)\]\]/g)].map((item) => `[[${item[1]}]]`);
}

function findUnitFileByBasename(basename) {
  if (!findUnitFileByBasename.cache) findUnitFileByBasename.cache = new Map();
  if (findUnitFileByBasename.cache.has(basename)) return findUnitFileByBasename.cache.get(basename);
  for (const config of Object.values(typeConfig)) {
    const candidate = path.join(unitRoot, config.dir, `${basename}.md`);
    if (fs.existsSync(candidate)) {
      findUnitFileByBasename.cache.set(basename, candidate);
      return candidate;
    }
  }
  findUnitFileByBasename.cache.set(basename, "");
  return "";
}

function linkedItemExists(linkedItem) {
  const basename = linkedItem.replace(/^\[\[|\]\]$/g, "");
  return Boolean(findUnitFileByBasename(basename));
}

function linkedItemMatchesSource(linkedItem, sourceId, sourceRel) {
  const basename = linkedItem.replace(/^\[\[|\]\]$/g, "");
  const filePath = findUnitFileByBasename(basename);
  if (!filePath || !fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, "utf8");
  const sourceDocuments = readFrontmatterList(content, "source_documents");
  const sourceLineMatch = content.match(/^-\s*来源文件：(.+)$/m);
  const existingSourceRel = sourceLineMatch ? sourceLineMatch[1].trim() : "";
  return sourceDocuments.includes(sourceId) || existingSourceRel === sourceRel;
}

function ensureThemeMap(theme, overview, unitIndex, sourceId, sourceRel) {
  ensureDir(themeRoot);
  const filePath = path.join(themeRoot, `${slugFromTitle(theme)}.md`);
  const existing = loadExistingThemeMap(theme);
  const buckets = {
    "核心问题单元": [],
    "核心概念单元": [],
    "核心观点单元": [],
    "核心案例单元": [],
    "核心方案单元": [],
  };

  if (existing) {
    for (const heading of Object.keys(buckets)) {
      buckets[heading] = extractLinkedItems(existing, heading).filter(
        (item) => linkedItemExists(item) && !linkedItemMatchesSource(item, sourceId, sourceRel)
      );
    }
  }

  const appendUnique = (heading, link) => {
    if (!link) return;
    const wrapped = `[[${link}]]`;
    if (!buckets[heading].includes(wrapped)) buckets[heading].push(wrapped);
  };

  appendUnique("核心问题单元", unitIndex.primary.QST);
  for (const link of unitIndex.all.QST) appendUnique("核心问题单元", link);
  appendUnique("核心概念单元", unitIndex.primary.CON);
  for (const link of unitIndex.all.CON) appendUnique("核心概念单元", link);
  appendUnique("核心观点单元", unitIndex.primary.OPI);
  for (const link of unitIndex.all.OPI) appendUnique("核心观点单元", link);
  appendUnique("核心案例单元", unitIndex.primary.CAS);
  for (const link of unitIndex.all.CAS) appendUnique("核心案例单元", link);
  appendUnique("核心方案单元", unitIndex.primary.SOL);
  for (const link of unitIndex.all.SOL) appendUnique("核心方案单元", link);

  const lines = [
    `# 主题地图：${theme}`,
    "",
    "## 主题定义",
    "",
    overview.themeDefinition,
    "",
    "## 核心问题单元",
    "",
    ...(buckets["核心问题单元"].length > 0 ? buckets["核心问题单元"].map((item) => `- ${item}`) : ["- 待补"]),
    "",
    "## 核心概念单元",
    "",
    ...(buckets["核心概念单元"].length > 0 ? buckets["核心概念单元"].map((item) => `- ${item}`) : ["- 待补"]),
    "",
    "## 核心观点单元",
    "",
    ...(buckets["核心观点单元"].length > 0 ? buckets["核心观点单元"].map((item) => `- ${item}`) : ["- 待补"]),
    "",
    "## 核心案例单元",
    "",
    ...(buckets["核心案例单元"].length > 0 ? buckets["核心案例单元"].map((item) => `- ${item}`) : ["- 待补"]),
    "",
    "## 核心方案单元",
    "",
    ...(buckets["核心方案单元"].length > 0 ? buckets["核心方案单元"].map((item) => `- ${item}`) : ["- 待补"]),
    "",
    "## 常见装配路径",
    "",
    `1. 问题：${overview.pathQuestion}`,
    `2. 概念：${overview.pathConcept}`,
    `3. 观点：${overview.pathOpinion}`,
    `4. 案例：${overview.pathCase}`,
    `5. 方案：${overview.pathSolution}`,
    "",
    "## 同主题可继续重组的补充单元",
    "",
    `- 补充问题：${overview.extraQuestions.length > 0 ? overview.extraQuestions.map((item) => `[[${item}]]`).join("、") : "暂无"}`,
    `- 补充观点：${overview.extraOpinions.length > 0 ? overview.extraOpinions.map((item) => `[[${item}]]`).join("、") : "暂无"}`,
    `- 补充案例：${overview.extraCases.length > 0 ? overview.extraCases.map((item) => `[[${item}]]`).join("、") : "暂无"}`,
    `- 补充方案：${overview.extraSolutions.length > 0 ? overview.extraSolutions.map((item) => `[[${item}]]`).join("、") : "暂无"}`,
    "",
    "## 相关主题",
    "",
    ...(overview.relatedThemes.length > 0 ? overview.relatedThemes.map((item) => `- ${item}`) : ["- 待补"]),
  ];

  fs.writeFileSync(filePath, lines.join("\n") + "\n");
  return filePath;
}

function ensureAssembly(title, overview, unitIndex) {
  ensureDir(assemblyRoot);
  const datePrefix = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const filePath = path.join(assemblyRoot, `${datePrefix}_${slugFromTitle(title)}_装配稿.md`);
  const lines = [
    `# 选题装配：${title}`,
    "",
    "## 目标受众",
    "",
    overview.audience,
    "",
    "## 装配理由",
    "",
    overview.assemblyReason,
    "",
    "## 核心调用单元",
    "",
    "### 问题",
    "",
    unitIndex.primary.QST ? `- [[${unitIndex.primary.QST}]]` : "- 待补",
    "",
    "### 概念",
    "",
    unitIndex.primary.CON ? `- [[${unitIndex.primary.CON}]]` : "- 待补",
    "",
    "### 观点",
    "",
    unitIndex.primary.OPI ? `- [[${unitIndex.primary.OPI}]]` : "- 待补",
    "",
    "### 案例",
    "",
    unitIndex.primary.CAS ? `- [[${unitIndex.primary.CAS}]]` : "- 待补",
    "",
    "### 方案",
    "",
    unitIndex.primary.SOL ? `- [[${unitIndex.primary.SOL}]]` : "- 待补",
    "",
    "## 可追加调用单元",
    "",
    `- 补充问题：${overview.extraQuestions.length > 0 ? overview.extraQuestions.map((item) => `[[${item}]]`).join("、") : "暂无"}`,
    `- 补充观点：${overview.extraOpinions.length > 0 ? overview.extraOpinions.map((item) => `[[${item}]]`).join("、") : "暂无"}`,
    `- 补充案例：${overview.extraCases.length > 0 ? overview.extraCases.map((item) => `[[${item}]]`).join("、") : "暂无"}`,
    `- 补充方案：${overview.extraSolutions.length > 0 ? overview.extraSolutions.map((item) => `[[${item}]]`).join("、") : "暂无"}`,
    "",
    "## 建议结构",
    "",
    `1. 痛点：${overview.structure[0]}`,
    `2. 冲突：${overview.structure[1]}`,
    `3. 展开：${overview.structure[2]}`,
    `4. 案例：${overview.structure[3]}`,
    `5. 方法：${overview.structure[4]}`,
    `6. 收束：${overview.structure[5]}`,
    "",
    "## 表达骨架",
    "",
    `### 开头\n\n${overview.bones.opening}`,
    "",
    `### 中段 1\n\n${overview.bones.body1}`,
    "",
    `### 中段 2\n\n${overview.bones.body2}`,
    "",
    `### 中段 3\n\n${overview.bones.body3}`,
    "",
    `### 结尾\n\n${overview.bones.closing}`,
  ];
  fs.writeFileSync(filePath, lines.join("\n") + "\n");
  return filePath;
}

function buildUnitOverview(context, theme, candidateBuckets, unitIndex) {
  const primaryQuestion = pickPrimaryCandidate(candidateBuckets.QST, "qst-main");
  const primaryConcept = pickPrimaryCandidate(candidateBuckets.CON, "con-main");
  const primaryOpinion = pickPrimaryCandidate(candidateBuckets.OPI, "opi-main");
  const primaryCase = pickPrimaryCandidate(candidateBuckets.CAS, "cas-public-output") || pickPrimaryCandidate(candidateBuckets.CAS);
  const primarySolution = pickPrimaryCandidate(candidateBuckets.SOL, "sol-three-part");
  const extraQuestions = unitIndex.all.QST.filter((item) => item !== unitIndex.primary.QST);
  const extraOpinions = unitIndex.all.OPI.filter((item) => item !== unitIndex.primary.OPI);
  const extraCases = unitIndex.all.CAS.filter((item) => item !== unitIndex.primary.CAS);
  const extraSolutions = unitIndex.all.SOL.filter((item) => item !== unitIndex.primary.SOL);
  const themeDefinition = cleanSentence(
    primaryOpinion?.coreClaim ||
      buildMainOpinion(context)
  );
  const caseSummary = primaryCase?.caseSummary || "用一段真实案例证明判断";
  const solutionSummary = primarySolution?.solutionSummary || "先判断生产型兴趣，再补齐匹配能力，最后落到具体业务";
  return {
    themeDefinition,
    pathQuestion: primaryQuestion?.questionText || buildMainQuestion(context),
    pathConcept: primaryConcept?.conceptDefinition || context.conceptText,
    pathOpinion: primaryOpinion?.coreClaim || buildMainOpinion(context),
    pathCase: caseSummary,
    pathSolution: solutionSummary,
    relatedThemes: normalizeKeywords([context.coreTheme, ...context.keywords]).filter((item) => item !== theme).slice(0, 5),
    audience: buildAudience(context),
    assemblyReason: cleanSentence(
      `这组装配先用「${primaryQuestion?.questionText || buildMainQuestion(context)}」把问题提纯，再用「${
        primaryOpinion?.coreClaim || buildMainOpinion(context)
      }」建立判断边界，随后用案例证明，最后用方案把判断落成可执行路径。`
    ),
    structure: [
      primaryQuestion?.questionText || buildMainQuestion(context),
      primaryOpinion?.coreClaim || buildMainOpinion(context),
      primaryConcept?.conceptDefinition || context.conceptText,
      caseSummary,
      solutionSummary,
      buildClosingLine(context),
    ],
    bones: {
      opening: primaryQuestion?.questionText || buildMainQuestion(context),
      body1: primaryConcept?.conceptDefinition || context.conceptText,
      body2: primaryOpinion?.coreClaim || buildMainOpinion(context),
      body3: solutionSummary,
      closing: buildClosingLine(context),
    },
    extraQuestions,
    extraOpinions,
    extraCases,
    extraSolutions,
    reviewFocus: summarizeList([
      primaryQuestion?.questionText,
      primaryOpinion?.coreClaim,
      primaryCase?.caseResult,
      primarySolution?.expectedResult,
    ], 4),
  };
}

function buildPayload(prefix, candidate, sourceMeta, context, dateText) {
  const identity = resolveUnitIdentity(prefix, candidate.title, sourceMeta.sourceId, sourceMeta.sourceRel, dateText);
  const payloadBase = {
    id: identity.id,
    sourceId: sourceMeta.sourceId,
    author: sourceMeta.author,
    theme: sourceMeta.theme,
    keywords: buildKeywords(sourceMeta.title, context, [
      candidate.title,
      candidate.questionText,
      candidate.coreClaim,
      candidate.conceptDefinition,
      candidate.caseSummary,
      candidate.solutionSummary,
      ...(candidate.actionSteps || []),
    ]),
    date: dateText,
    sourceRel: sourceMeta.sourceRel,
    sourceType: sourceMeta.sourceType,
    relationships: [],
    usageScenarios: candidate.usageScenarios || context.relatedScenes,
  };

  let payload;
  if (prefix === "QST") {
    payload = {
      ...payloadBase,
      title: candidate.title,
      questionText: candidate.questionText,
      questionType: candidate.questionType,
      applicableTopics: candidate.applicableTopics,
      bodyText: candidate.bodyText,
    };
  } else if (prefix === "CON") {
    payload = {
      ...payloadBase,
      title: candidate.title,
      conceptDefinition: candidate.conceptDefinition,
      conceptFunction: candidate.conceptFunction,
      bodyText: candidate.bodyText,
    };
  } else if (prefix === "OPI") {
    payload = {
      ...payloadBase,
      title: candidate.title,
      coreClaim: candidate.coreClaim,
      claimScope: candidate.claimScope,
      whyItMatters: candidate.whyItMatters,
      bodyText: candidate.bodyText,
    };
  } else if (prefix === "CAS") {
    payload = {
      ...payloadBase,
      title: candidate.title,
      caseSubject: candidate.caseSubject,
      caseSummary: candidate.caseSummary,
      caseProcess: candidate.caseProcess,
      caseResult: candidate.caseResult,
      bodyText: candidate.bodyText,
    };
  } else {
    payload = {
      ...payloadBase,
      title: candidate.title,
      targetProblem: candidate.targetProblem,
      solutionSummary: candidate.solutionSummary,
      actionSteps: candidate.actionSteps,
      expectedResult: candidate.expectedResult,
      bodyText: candidate.bodyText,
    };
  }

  candidate.payload = payload;
  candidate.existingFiles = identity.existingFiles;
  return identity.id;
}

function extractUnitsFromContext(context, sourceMeta, dateText, createdUnits) {
  const candidateBuckets = buildSemanticCandidates(context, sourceMeta.theme);
  const unitIndex = {
    primary: {},
    all: { QST: [], CON: [], OPI: [], CAS: [], SOL: [] },
  };
  const keyToId = new Map();
  const bucketOrder = ["QST", "CON", "OPI", "CAS", "SOL"];
  const primaryKeys = {
    QST: "qst-main",
    CON: "con-main",
    OPI: "opi-main",
    CAS: "cas-public-output",
    SOL: "sol-three-part",
  };

  for (const prefix of bucketOrder) {
    for (const candidate of candidateBuckets[prefix]) {
      const id = buildPayload(prefix, candidate, sourceMeta, context, dateText);
      keyToId.set(candidate.key, id);
    }
  }

  for (const prefix of bucketOrder) {
    for (const candidate of candidateBuckets[prefix]) {
      candidate.payload.relationships = (candidate.relationshipRefs || [])
        .map((item) => {
          const targetId = keyToId.get(item.targetKey);
          if (!targetId) return null;
          return { type: item.type, target: targetId, note: item.note };
        })
        .filter(Boolean);
      const filePath = writeUnit(prefix, candidate.payload);
      const basename = path.basename(filePath, ".md");
      unitIndex.all[prefix].push(basename);
      if (!unitIndex.primary[prefix]) unitIndex.primary[prefix] = basename;
      if (primaryKeys[prefix] === candidate.key) unitIndex.primary[prefix] = basename;
      createdUnits.push(path.relative(root, filePath).replaceAll(path.sep, "/"));
    }
  }

  return { candidateBuckets, unitIndex };
}

const args = parseArgs(process.argv.slice(2));
if (args.help) usage(0);

let fileList = [];
if (args.files) fileList = args.files.split(",").map((item) => item.trim()).filter(Boolean);
if (args.plan) fileList = args.plan.split(",").map((item) => item.trim()).filter(Boolean);
if (fileList.length === 0) usage(1);

const registry = loadRegistry();
const processedRows = loadProcessedRows();
const processedSet = new Set(processedRows.slice(1).map((row) => row[0]));
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const dateText = (args.date || today.replaceAll("-", "")).trim();
if (!/^\d{8}$/.test(dateText)) {
  console.error("date 必须是 YYYYMMDD");
  process.exit(1);
}

const createdUnits = [];
const logLines = [`## ${today} 样本抽取`, ""];
const processedNow = [];
const skippedNow = [];
const skippedByClassifier = [];

for (const relPath of fileList) {
  if (processedSet.has(relPath)) {
    skippedNow.push(relPath);
    continue;
  }

  const sourcePath = path.join(sourceRoot, relPath);
  if (!fs.existsSync(sourcePath)) {
    console.error(`样本不存在：${relPath}`);
    process.exit(1);
  }

  const text = readTextSafe(sourcePath);
  if (!text.trim()) {
    console.error(`样本文稿无法读取文本：${relPath}`);
    process.exit(1);
  }

  const title = titleFromPath(relPath);
  const author = args.author || "待补";
  const sourceId = registry.get(relPath) || "SRC-*";
  const profile = classifySource(relPath, text);

  if (profile.kind === "skip") {
    processedRows.push([relPath, `已跳过：${profile.reason}`, inferSourceType(relPath), `分类器跳过于 ${today}`]);
    processedSet.add(relPath);
    skippedByClassifier.push(relPath);
    logLines.push(`- 样本：${relPath}`);
    logLines.push(`  - 分类：跳过`);
    logLines.push(`  - 原因：${profile.reason}`);
    continue;
  }

  const extractionItems =
    profile.kind === "normalize-tweet-archive"
      ? normalizeTweetArchive(relPath, text)
      : [
          {
            relPath,
            title,
            text,
          },
        ];

  let sourceCreatedCount = 0;
  const sourceThemes = [];
  const sourceAssemblies = [];
  const generatedUnitNames = [];

  for (const item of extractionItems) {
    const itemTitle = item.title || title;
    const itemText = item.text || text;
    const context =
      profile.kind === "extract-article"
        ? extractStructuredContext(itemText, itemTitle)
        : extractSimpleContext(itemText, itemTitle, relPath, profile);
    if (item.normalizedTitle) context.normalizedTitle = item.normalizedTitle;
    if (item.primaryTheme) context.primaryTheme = item.primaryTheme;
    if (item.sourceType) context.sourceType = item.sourceType;
    const displayTitle = normalizeCandidateTitleText(context.normalizedTitle || itemTitle) || itemTitle;

    const theme = inferTheme(item.relPath || relPath, args.theme, context);
    const sourceMeta = {
      title: displayTitle,
      author,
      sourceId,
      sourceRel: relPath,
      sourceType: context.sourceType || inferSourceType(relPath),
      theme,
    };
    const { candidateBuckets, unitIndex } = extractUnitsFromContext(context, sourceMeta, dateText, createdUnits);
    const overview = buildUnitOverview(context, theme, candidateBuckets, unitIndex);
    const themeFile = ensureThemeMap(theme, overview, unitIndex, sourceId, relPath);
    const assemblyFile = ensureAssembly(displayTitle, overview, unitIndex);

    sourceCreatedCount += Object.values(unitIndex.all).flat().length;
    sourceThemes.push(path.relative(root, themeFile).replaceAll(path.sep, "/"));
    sourceAssemblies.push(path.relative(root, assemblyFile).replaceAll(path.sep, "/"));
    generatedUnitNames.push(...Object.values(unitIndex.all).flat());
  }

  if (sourceCreatedCount === 0) {
    processedRows.push([relPath, "待人工复核", inferSourceType(relPath), `分类为 ${profile.kind}，但未生成内容单元`]);
    processedSet.add(relPath);
    skippedByClassifier.push(relPath);
    logLines.push(`- 样本：${relPath}`);
    logLines.push(`  - 分类：${profile.kind}`);
    logLines.push("  - 结果：未生成内容单元，已转人工复核");
    continue;
  }

  processedRows.push([relPath, "已抽取样本", inferSourceType(relPath), `样本抽取于 ${today}；模式：${profile.kind}`]);
  processedSet.add(relPath);
  processedNow.push(relPath);

  logLines.push(`- 样本：${relPath}`);
  logLines.push(`  - 分类：${profile.kind}`);
  logLines.push(`  - 原因：${profile.reason}`);
  logLines.push(`  - 生成单元：${generatedUnitNames.join("、")}`);
  logLines.push(`  - 主题地图：${dedupeBy(sourceThemes, (item) => item).join("、")}`);
  logLines.push(`  - 装配稿：${dedupeBy(sourceAssemblies, (item) => item).join("、")}`);
}

saveProcessedRows(processedRows);
const ledgerStats = rebuildPendingLedger(processedSet);
appendLog(logLines);
upsertStatusOverview({
  today,
  scope: [
    "当前目录已进入内容结构化系统样本模式",
    processedNow.length > 0 ? `本轮处理文稿：${processedNow.join("、")}` : "本轮未新增处理文稿",
    skippedNow.length > 0 ? `本轮跳过已处理文稿：${skippedNow.join("、")}` : "本轮无已处理跳过项",
    skippedByClassifier.length > 0 ? `本轮被分类器跳过：${skippedByClassifier.join("、")}` : "本轮无分类器跳过项",
  ],
  done: [
    `本轮新增 ${createdUnits.length} 个内容单元`,
    `已更新已处理清单，累计已处理 ${processedSet.size} 条`,
    `已回收待处理清单，当前剩余 ${ledgerStats.pendingCount} 条`,
    "已按分类、归一化、抽取三段式处理来源，并生成对应主题地图与装配稿",
  ],
  todo: [
    "运行关系索引、去重候选与 Obsidian 补链脚本",
    "人工复核高价值单元的字段与边界",
    "继续收紧去重规则，降低噪音候选",
  ],
  next: [
    "运行 `node 07-脚本与工具/generate-link-map.js`",
    "运行 `node 07-脚本与工具/generate-duplicate-candidates.js`",
    "运行 `node 07-脚本与工具/fill-obsidian-links.js`",
  ],
});

console.log(
  JSON.stringify(
    {
      processedFiles: processedNow,
      skippedFiles: skippedNow,
      createdUnits,
      count: createdUnits.length,
    },
    null,
    2
  )
);
