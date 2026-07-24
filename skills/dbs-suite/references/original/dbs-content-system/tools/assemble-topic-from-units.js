#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(process.cwd());
const unitRoot = path.join(root, "02-内容单元库");
const assemblyRoot = path.join(root, "06-选题装配");

const typeDirs = {
  QST: "问题单元",
  CON: "概念单元",
  OPI: "观点单元",
  CAS: "案例单元",
  SOL: "方案单元",
};

function fail(message) {
  console.error(message);
  process.exit(1);
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

function slugFromTitle(title) {
  return title.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim() || "未命名选题";
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  return match ? match[1] : "";
}

function readBody(content) {
  const match = content.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return match ? match[1] : content;
}

function getField(frontmatter, field) {
  const match = frontmatter.match(new RegExp(`^${field}:\\s*(.+)$`, "m"));
  return match ? match[1].trim() : "";
}

function getListField(frontmatter, field) {
  const match = frontmatter.match(new RegExp(`^${field}:\\n((?:\\s+-\\s+.+\\n?)*)`, "m"));
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((line) => line.trim().replace(/^- /, "").trim())
    .filter(Boolean);
}

function getRelationshipTargets(frontmatter) {
  return [...frontmatter.matchAll(/^\s*target:\s*(.+)$/gm)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function getSection(body, heading) {
  const match = body.match(new RegExp(`## ${heading}\\n\\n([\\s\\S]*?)(?=\\n## |$)`));
  return match ? match[1].trim() : "";
}

function summarizeUnit(unit) {
  if (unit.prefix === "QST") return unit.fieldValue("question_text") || unit.section("核心内容");
  if (unit.prefix === "CON") return unit.fieldValue("concept_definition") || unit.section("核心内容");
  if (unit.prefix === "OPI") return unit.fieldValue("core_claim") || unit.section("核心内容");
  if (unit.prefix === "CAS") return unit.fieldValue("case_summary") || unit.section("核心内容");
  if (unit.prefix === "SOL") return unit.fieldValue("solution_summary") || unit.section("核心内容");
  return unit.section("核心内容");
}

function oneLine(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function tokenize(text) {
  const normalized = String(text || "").toLowerCase().trim();
  const parts = normalized
    .replace(/[^\p{Script=Han}a-z0-9]+/gu, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const tokens = new Set();
  for (const part of parts) {
    if (part.length >= 2) tokens.add(part);
    if (/^\p{Script=Han}+$/u.test(part)) {
      for (let size = 2; size <= 3; size += 1) {
        if (part.length < size) continue;
        for (let i = 0; i <= part.length - size; i += 1) {
          tokens.add(part.slice(i, i + size));
        }
      }
    }
  }

  return [...tokens];
}

function normalizeAssemblyTitle(title) {
  return String(title || "")
    .replace(/（[^）]*）/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/自动推荐版|结构化重组版|调试/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandIntentTokens(title, query) {
  const source = `${normalizeAssemblyTitle(title)} ${query || ""}`;
  const extras = [];

  if (/年轻人/.test(source) && /赚钱|变现|收入/.test(source)) {
    extras.push("兴趣", "变现", "需求", "生意", "具体业务", "老板思维", "生产型兴趣");
  }

  if (/赚钱|变现|收入/.test(source) && !/被动收入|系统赚钱/.test(source)) {
    extras.push("需求", "变现", "生意");
  }

  if (/兴趣/.test(source) && /赚钱|变现/.test(source)) {
    extras.push("生产型兴趣", "具体业务", "能力");
  }

  if (/创业|生意/.test(source)) {
    extras.push("需求", "具体生意", "从右到左");
  }

  return tokenize(extras.join(" "));
}

function findUnitFile(ref) {
  const normalized = ref.replace(/^\[\[|\]\]$/g, "").replace(/\.md$/i, "");
  for (const dir of Object.values(typeDirs)) {
    const direct = path.join(unitRoot, dir, `${normalized}.md`);
    if (fs.existsSync(direct)) return direct;
  }

  if (!normalized.includes("_")) {
    for (const dir of Object.values(typeDirs)) {
      const fullDir = path.join(unitRoot, dir);
      if (!fs.existsSync(fullDir)) continue;
      for (const entry of fs.readdirSync(fullDir)) {
        if (!entry.endsWith(".md")) continue;
        if (!entry.startsWith(`${normalized}_`)) continue;
        return path.join(fullDir, entry);
      }
    }
  }

  fail(`找不到内容单元：${ref}`);
}

function loadUnit(ref) {
  const filePath = findUnitFile(ref);
  const content = fs.readFileSync(filePath, "utf8");
  const frontmatter = readFrontmatter(content);
  const body = readBody(content);
  const id = getField(frontmatter, "id");
  const title = getField(frontmatter, "title");
  const prefix = id.split("-")[0];
  const basename = path.basename(filePath, ".md");
  return {
    id,
    prefix,
    title,
    basename,
    filePath,
    fieldValue(field) {
      return getField(frontmatter, field);
    },
    listField(field) {
      return getListField(frontmatter, field);
    },
    relationshipTargets() {
      return getRelationshipTargets(frontmatter);
    },
    section(heading) {
      return getSection(body, heading);
    },
    summary: summarizeUnit({
      prefix,
      fieldValue: (field) => getField(frontmatter, field),
      section: (heading) => getSection(body, heading),
    }),
  };
}

function loadAllUnits() {
  const units = [];
  for (const dir of Object.values(typeDirs)) {
    const fullDir = path.join(unitRoot, dir);
    if (!fs.existsSync(fullDir)) continue;
    for (const entry of fs.readdirSync(fullDir)) {
      if (!entry.endsWith(".md")) continue;
      units.push(loadUnit(path.basename(entry, ".md")));
    }
  }
  return units;
}

function buildIntentProfile(title, query) {
  const source = `${normalizeAssemblyTitle(title)} ${query || ""}`;
  return {
    money: /赚钱|变现|收入|生意/.test(source),
    young: /年轻人/.test(source),
    interest: /兴趣|爱好/.test(source) || (/年轻人/.test(source) && /赚钱|变现|收入/.test(source)),
    demand: /需求|老板思维|创业|生意|业务/.test(source) || (/赚钱|变现|收入/.test(source) && /年轻人|创业|生意/.test(source)),
    business: /生意|业务|创业/.test(source) || /赚钱|变现|收入/.test(source),
    passive: /被动收入|系统赚钱/.test(source),
    stability: /稳定|反脆弱/.test(source),
  };
}

function unitText(unit) {
  return [
    unit.title,
    unit.summary,
    unit.fieldValue("question_text"),
    unit.fieldValue("core_claim"),
    unit.fieldValue("case_summary"),
    unit.fieldValue("case_result"),
    unit.fieldValue("solution_summary"),
    unit.listField("themes").join(" "),
    unit.listField("keywords").join(" "),
    unit.listField("applicable_topics").join(" "),
  ]
    .filter(Boolean)
    .join(" ");
}

function hasThemeSignal(unit, pattern) {
  return pattern.test(unitText(unit));
}

function getThemes(unit) {
  return unit.listField("themes").map((item) => item.trim()).filter(Boolean);
}

function sharesTheme(a, b) {
  const aThemes = new Set(getThemes(a));
  const bThemes = getThemes(b);
  return bThemes.some((theme) => aThemes.has(theme));
}

function scoreIntentAlignment(unit, intentProfile) {
  const text = unitText(unit);
  let score = 0;

  if (intentProfile.money && /赚钱|变现|收入|生意|需求|业务/.test(text)) score += 4;

  if (intentProfile.interest) {
    if (/兴趣|生产型兴趣|消费型兴趣/.test(text)) score += 6;
    if (unit.prefix === "QST" && /什么样的兴趣|兴趣.*变现|变现.*兴趣/.test(text)) score += 10;
    if (unit.prefix === "CON" && /生产型兴趣|消费型兴趣/.test(text)) score += 12;
    if (unit.prefix === "SOL" && /兴趣变现|生产性|具体业务/.test(text)) score += 8;
  }

  if (intentProfile.demand) {
    if (/需求|老板思维|从需求倒推|从右到左|具体业务/.test(text)) score += 8;
    if (unit.prefix === "OPI" && /先看需求|老板思维|思维顺序错了|从需求出发|倒推产品/.test(text)) score += 20;
    if (unit.prefix === "QST" && /能力.*变现|赚不到钱|需求倒推/.test(text)) score += 6;
    if (unit.prefix === "SOL" && /从需求出发|对标|倒推/.test(text)) score += 7;
    if (unit.prefix === "CAS" && /柠檬水|需求先于原料/.test(text)) score += 5;
  }

  if (intentProfile.young && intentProfile.money) {
    if (unit.prefix === "QST" && /什么样的兴趣能真正变现/.test(text)) score += 8;
    if (unit.prefix === "OPI" && /先看需求|能力不够|老板/.test(text)) score += 12;
  }

  if (intentProfile.passive) {
    if (/被动收入|系统赚钱/.test(text)) score += 10;
  }

  if (intentProfile.stability) {
    if (/稳定|反脆弱|保险/.test(text)) score += 8;
  }

  if (unit.prefix === "OPI" && /为什么要找对标/.test(unit.title)) score -= 8;
  if (unit.prefix === "OPI" && /问题：|答案：|逻辑：/.test(text)) score -= 5;

  return score;
}

function scoreUnit(unit, primaryTokens, queryTokens, intentProfile) {
  const titleTokens = tokenize(unit.title);
  const keywordTokens = tokenize(unit.listField("keywords").join(" "));
  const themeTokens = tokenize(unit.listField("themes").join(" "));
  const summaryTokens = tokenize(unit.summary);
  const applicableTokens = tokenize(unit.listField("applicable_topics").join(" "));
  const pool = [
    ...titleTokens,
    ...keywordTokens,
    ...themeTokens,
    ...summaryTokens,
    ...applicableTokens,
  ];
  const poolSet = new Set(pool);

  let score = 0;
  for (const token of primaryTokens) {
    if (titleTokens.includes(token)) score += 14;
    if (keywordTokens.includes(token)) score += 9;
    if (themeTokens.includes(token)) score += 7;
    if (applicableTokens.includes(token)) score += 5;
    if (summaryTokens.includes(token)) score += 4;
    if (poolSet.has(token)) score += 2;
  }

  for (const token of queryTokens) {
    if (titleTokens.includes(token)) score += 8;
    if (keywordTokens.includes(token)) score += 5;
    if (themeTokens.includes(token)) score += 4;
    if (applicableTokens.includes(token)) score += 3;
    if (summaryTokens.includes(token)) score += 2;
    if (poolSet.has(token)) score += 1;
  }

  if (unit.prefix === "QST" && /怎么|如何|为什么|能不能|赚钱|变现|收入|生意/.test(unit.title + unit.summary)) score += 2;
  if (unit.prefix === "SOL" && /路径|方案|步骤|检查法|方法/.test(unit.title + unit.summary)) score += 2;
  if (unit.prefix === "CAS" && /案例|证明|过程|结果|数据/.test(unit.summary)) score += 1;
  if (unit.prefix === "OPI" && /本质|核心|判断|不要|先/.test(unit.summary)) score += 1;

  if (/概念图谱|用途：|底层概念坐标系|关键概念$|核心问题$|核心观点$|关键案例$|可执行方案$/.test(unit.title + " " + unit.summary)) {
    score -= 10;
  }

  if (unit.prefix === "QST" && !/[？?]|为什么|如何|怎么|能不能|怎样/.test(unit.fieldValue("question_text") || unit.summary)) {
    score -= 6;
  }

  if (unit.prefix === "OPI" && !/本质|核心|不要|先|应该|不是|而是|判断|根本/.test(unit.fieldValue("core_claim") || unit.summary)) {
    score -= 4;
  }

  if (unit.prefix === "CAS" && !/案例|过程|结果|证明|数据|月均|粉丝|播放|增长|收益/.test(unit.fieldValue("case_summary") + " " + unit.fieldValue("case_result") + " " + unit.summary)) {
    score -= 4;
  }

  if (unit.prefix === "SOL" && !/步骤|方案|路径|检查法|先|再|最后/.test(unit.fieldValue("solution_summary") + " " + unit.summary)) {
    score -= 4;
  }

  score += scoreIntentAlignment(unit, intentProfile);
  return score;
}

function scoreMainSelection(unit, prefix, intentProfile, context) {
  const text = unitText(unit);
  const targets = unit.relationshipTargets();
  let score = 0;
  const isHybridMoneyTopic =
    intentProfile.young && intentProfile.money && intentProfile.interest && intentProfile.demand;

  if (context.mainQuestion) {
    if (targets.includes(context.mainQuestion.id)) score += isHybridMoneyTopic && prefix === "OPI" ? 6 : 18;
    if (sharesTheme(unit, context.mainQuestion)) score += 6;
  }

  if (context.mainConcept) {
    if (targets.includes(context.mainConcept.id)) score += 10;
    if (sharesTheme(unit, context.mainConcept)) score += 5;
  }

  if (context.mainOpinion) {
    if (targets.includes(context.mainOpinion.id)) score += 20;
    if (sharesTheme(unit, context.mainOpinion)) score += 6;
  }

  if (prefix === "QST") {
    if (intentProfile.money && intentProfile.interest && /什么样的兴趣能真正变现/.test(text)) score += 18;
    if (intentProfile.demand && !intentProfile.interest && /为什么能力强的人离开公司后仍然赚不到钱/.test(text)) score += 18;
    if (intentProfile.demand && /能力怎么变现|老板思维|需求倒推/.test(text)) score += 8;
  }

  if (prefix === "CON") {
    if (intentProfile.interest && /生产型兴趣|消费型兴趣/.test(text)) score += 18;
    if (intentProfile.demand && !intentProfile.interest && /员工思维|老板思维/.test(text)) score += 18;
    if (intentProfile.money && intentProfile.young && /生产型兴趣|消费型兴趣/.test(text)) score += 10;
  }

  if (prefix === "OPI") {
    if (intentProfile.money && intentProfile.demand && /先看需求|老板思维|从需求出发|倒推产品/.test(text)) score += 24;
    if (intentProfile.interest && !intentProfile.demand && /兴趣能不能变现|生产型兴趣/.test(text)) score += 16;
    if (isHybridMoneyTopic) {
      if (/先看需求|老板思维|从需求出发|倒推产品/.test(text)) score += 48;
      if (/兴趣能不能变现，不取决于兴趣这个标签本身/.test(text)) score -= 20;
    }
    if (/为什么要找对标/.test(unit.title)) score -= 10;
    if (/为什么别人做不了答疑群/.test(unit.title) && intentProfile.demand) score -= 8;
  }

  if (prefix === "CAS") {
    if (intentProfile.money && intentProfile.demand && /需求先于原料|先写课程大纲|需求先于产品/.test(text)) score += 14;
    if (intentProfile.interest && /公开输出|数据验证/.test(text)) score += 10;
    if (intentProfile.young && intentProfile.money && intentProfile.demand && /需求先于原料|需求先于产品/.test(text)) score += 8;
  }

  if (prefix === "SOL") {
    if (intentProfile.interest && /兴趣变现三要素|生产性|具体业务/.test(text)) score += 14;
    if (intentProfile.demand && /从需求出发|对标|倒推/.test(text)) score += 14;
    if (intentProfile.young && intentProfile.money && intentProfile.demand && /从需求出发|倒推/.test(text)) score += 10;
    if (context.mainOpinion && targets.includes(context.mainOpinion.id)) score += 12;
  }

  return score;
}

function isHybridMoneyTopic(intentProfile) {
  return intentProfile.young && intentProfile.money && intentProfile.interest && intentProfile.demand;
}

function isDemandDrivenOpinion(unit) {
  return /先看需求|老板思维|从需求出发|倒推产品/.test(unitText(unit));
}

function isDemandDrivenSolution(unit) {
  return /从需求出发|先看需求|从右到左|对标|倒推/.test(unitText(unit));
}

function rankUnitsForType(candidates, prefix, topPerType, intentProfile, context = {}) {
  if (candidates.length === 0) return [];

  const sorted = [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.unit.title.localeCompare(b.unit.title, "zh-Hans-CN");
  });

  const mainSorted = [...sorted].sort((a, b) => {
    const aScore = a.score + scoreMainSelection(a.unit, prefix, intentProfile, context);
    const bScore = b.score + scoreMainSelection(b.unit, prefix, intentProfile, context);
    if (bScore !== aScore) return bScore - aScore;
    return a.unit.title.localeCompare(b.unit.title, "zh-Hans-CN");
  });

  let primaryUnit = mainSorted[0].unit;

  if (prefix === "OPI" && isHybridMoneyTopic(intentProfile)) {
    const demandDriven = mainSorted.find((item) => isDemandDrivenOpinion(item.unit));
    if (demandDriven) primaryUnit = demandDriven.unit;
  }

  if (prefix === "SOL" && isHybridMoneyTopic(intentProfile) && context.mainOpinion && isDemandDrivenOpinion(context.mainOpinion)) {
    const demandDriven = mainSorted.find((item) => isDemandDrivenSolution(item.unit));
    if (demandDriven) primaryUnit = demandDriven.unit;
  }

  const selected = [primaryUnit];
  const remaining = sorted.slice(1).map((item) => {
    let bonus = 0;
    const primary = selected[0];

    if (!sharesTheme(item.unit, primary)) bonus += 3;

    if (intentProfile.money && intentProfile.demand) {
      if (prefix === "OPI" && hasThemeSignal(primary, /兴趣|生产型兴趣/) && hasThemeSignal(item.unit, /需求|老板思维|从需求倒推/)) {
        bonus += 8;
      }
      if (prefix === "SOL" && hasThemeSignal(item.unit, /从需求出发|对标|倒推/)) {
        bonus += 4;
      }
      if (prefix === "CAS" && hasThemeSignal(item.unit, /需求先于原料|数据验证|公开输出/)) {
        bonus += 3;
      }
    }

    return { ...item, score: item.score + bonus };
  });

  remaining.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.unit.title.localeCompare(b.unit.title, "zh-Hans-CN");
  });

  for (const item of remaining) {
    if (selected.length >= topPerType) break;
    if (selected.some((unit) => unit.id === item.unit.id)) continue;
    selected.push(item.unit);
  }

  return selected;
}

function recommendUnitsByQuery(title, query, topPerType = 3) {
  const primaryTokens = tokenize(normalizeAssemblyTitle(title));
  const queryTokens = tokenize(query);
  const intentTokens = expandIntentTokens(title, query);
  const intentProfile = buildIntentProfile(title, query);
  if (queryTokens.length === 0 && primaryTokens.length === 0) fail("query 和 title 不能同时为空");
  const allUnits = loadAllUnits();
  const grouped = { QST: [], CON: [], OPI: [], CAS: [], SOL: [] };

  for (const unit of allUnits) {
    const summary = `${unit.summary} ${unit.fieldValue("question_text")} ${unit.fieldValue("core_claim")} ${unit.fieldValue("case_summary")} ${unit.fieldValue("solution_summary")}`;
    if (/概念图谱/.test(unit.title) || /^> 用途：/.test(summary) || /底层概念坐标系/.test(summary)) continue;
    if (/ 的关键概念$| 的核心问题$| 的核心观点$| 的关键案例$| 的可执行方案$/.test(unit.title)) continue;
    const score = scoreUnit(unit, [...primaryTokens, ...intentTokens], queryTokens, intentProfile);
    if (score <= 0) continue;
    grouped[unit.prefix].push({ unit, score });
  }

  const context = {};
  grouped.QST = rankUnitsForType(grouped.QST, "QST", topPerType, intentProfile, context);
  context.mainQuestion = grouped.QST[0];
  grouped.CON = rankUnitsForType(grouped.CON, "CON", topPerType, intentProfile, context);
  context.mainConcept = grouped.CON[0];
  grouped.OPI = rankUnitsForType(grouped.OPI, "OPI", topPerType, intentProfile, context);
  context.mainOpinion = grouped.OPI[0];
  grouped.CAS = rankUnitsForType(grouped.CAS, "CAS", topPerType, intentProfile, context);
  grouped.SOL = rankUnitsForType(grouped.SOL, "SOL", topPerType, intentProfile, context);

  return grouped;
}

function formatLinks(units) {
  return units.length > 0 ? units.map((unit) => `[[${unit.basename}]]`).join("、") : "暂无";
}

function buildAssembly(args) {
  const title = args.title;
  let questionUnits = splitList(args.questions || args.question).map(loadUnit);
  let conceptUnits = splitList(args.concepts || args.concept).map(loadUnit);
  let opinionUnits = splitList(args.opinions || args.opinion).map(loadUnit);
  let caseUnits = splitList(args.cases || args.case).map(loadUnit);
  let solutionUnits = splitList(args.solutions || args.solution).map(loadUnit);

  if (args.query || args.auto) {
    const recommended = recommendUnitsByQuery(args.title, args.query || "", Number(args.top || 3));
    if (questionUnits.length === 0) questionUnits = recommended.QST;
    if (conceptUnits.length === 0) conceptUnits = recommended.CON;
    if (opinionUnits.length === 0) opinionUnits = recommended.OPI;
    if (caseUnits.length === 0) caseUnits = recommended.CAS;
    if (solutionUnits.length === 0) solutionUnits = recommended.SOL;
  }

  if (questionUnits.length === 0) fail("至少提供 1 个问题单元：--question 或 --questions");
  if (conceptUnits.length === 0) fail("至少提供 1 个概念单元：--concept 或 --concepts");
  if (opinionUnits.length === 0) fail("至少提供 1 个观点单元：--opinion 或 --opinions");
  if (caseUnits.length === 0) fail("至少提供 1 个案例单元：--case 或 --cases");
  if (solutionUnits.length === 0) fail("至少提供 1 个方案单元：--solution 或 --solutions");

  const mainQuestion = questionUnits[0];
  const mainConcept = conceptUnits[0];
  const mainOpinion = opinionUnits[0];
  const mainCase = caseUnits[0];
  const mainSolution = solutionUnits[0];

  const audience =
    args.audience ||
    "对赚钱这件事有真实焦虑，但还没有把兴趣、需求、能力和业务接成一条完整路径的人";
  const assemblyReason =
    args.reason ||
    `这组装配先用「${oneLine(mainQuestion.summary)}」界定问题，再用「${oneLine(mainOpinion.summary)}」给出判断边界，然后用案例把判断落地，最后用方案把下一步动作写清楚。`;
  const closing =
    args.closing ||
    "把抽象的赚钱焦虑，改造成可以拆解、可以验证、可以继续重组的内容结构";

  const lines = [
    `# 选题装配：${title}`,
    "",
    "## 目标受众",
    "",
    audience,
    "",
    "## 装配理由",
    "",
    assemblyReason,
    "",
    "## 核心调用单元",
    "",
    "### 问题",
    "",
    `- [[${mainQuestion.basename}]]`,
    "",
    "### 概念",
    "",
    `- [[${mainConcept.basename}]]`,
    "",
    "### 观点",
    "",
    `- [[${mainOpinion.basename}]]`,
    "",
    "### 案例",
    "",
    `- [[${mainCase.basename}]]`,
    "",
    "### 方案",
    "",
    `- [[${mainSolution.basename}]]`,
    "",
    "## 可追加调用单元",
    "",
    `- 补充问题：${formatLinks(questionUnits.slice(1))}`,
    `- 补充概念：${formatLinks(conceptUnits.slice(1))}`,
    `- 补充观点：${formatLinks(opinionUnits.slice(1))}`,
    `- 补充案例：${formatLinks(caseUnits.slice(1))}`,
    `- 补充方案：${formatLinks(solutionUnits.slice(1))}`,
    "",
    "## 建议结构",
    "",
    `1. 痛点：${oneLine(mainQuestion.summary)}`,
    `2. 冲突：${oneLine(mainOpinion.summary)}`,
    `3. 展开：${oneLine(mainConcept.summary)}`,
    `4. 案例：${oneLine(mainCase.summary)}`,
    `5. 方法：${oneLine(mainSolution.summary)}`,
    `6. 收束：${closing}`,
    "",
    "## 表达骨架",
    "",
    `### 开头\n\n${oneLine(mainQuestion.summary)}`,
    "",
    `### 中段 1\n\n${oneLine(mainConcept.summary)}`,
    "",
    `### 中段 2\n\n${oneLine(mainOpinion.summary)}`,
    "",
    `### 中段 3\n\n${oneLine(mainSolution.summary)}`,
    "",
    `### 结尾\n\n${closing}`,
    "",
    "## 备注",
    "",
    `- 来源单元：${[...questionUnits, ...conceptUnits, ...opinionUnits, ...caseUnits, ...solutionUnits]
      .map((unit) => `[[${unit.basename}]]`)
      .join("、")}`,
    args.query ? `- 查询词：${args.query}` : null,
    `- 生成时间：${new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())}`,
  ].filter(Boolean);

  ensureDir(assemblyRoot);
  const datePrefix = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const target = path.join(assemblyRoot, `${datePrefix}_${slugFromTitle(title)}_装配稿.md`);
  fs.writeFileSync(target, lines.join("\n") + "\n");
  console.log(target);
}

const args = parseArgs(process.argv.slice(2));
if (!args.title) fail("缺少标题：--title");

buildAssembly(args);
