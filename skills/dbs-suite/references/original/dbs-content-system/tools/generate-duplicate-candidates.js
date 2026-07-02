#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(process.cwd());
const unitRoot = path.join(root, "02-内容单元库");
const outputDir = path.join(root, "03-处理状态");
const csvOutput = path.join(outputDir, "去重候选索引.csv");
const summaryOutput = path.join(outputDir, "去重与冲突总览.md");
const auditOutput = path.join(outputDir, "去重与冲突审计.csv");
const manualCandidateInput = path.join(outputDir, "人工去重候选.csv");
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full));
    else if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".md") files.push(full);
  }
  return files;
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  return match ? match[1] : "";
}

function getScalar(frontmatter, field) {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = frontmatter.match(new RegExp(`^${escaped}:\\s*(.+)$`, "m"));
  return match ? match[1].trim() : "";
}

function getList(frontmatter, field) {
  const lines = frontmatter.split("\n");
  const start = lines.findIndex((line) => line.trim() === `${field}:`);
  if (start === -1) return [];

  const items = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.startsWith("  - ")) break;
    items.push(line.replace("  - ", "").trim());
  }
  return items;
}

function getRelationships(frontmatter) {
  const lines = frontmatter.split("\n");
  const relationships = [];
  let inRelationships = false;
  let current = null;

  for (const line of lines) {
    if (!inRelationships) {
      if (line.trim() === "relationships:") inRelationships = true;
      continue;
    }

    if (!line.startsWith("  ")) break;

    const trimmed = line.trim();
    if (trimmed === "[]") break;

    const typeMatch = trimmed.match(/^- type:\s*(.+)$/);
    if (typeMatch) {
      current = { type: typeMatch[1].trim(), target: "", note: "" };
      relationships.push(current);
      continue;
    }

    if (!current) continue;

    const targetMatch = trimmed.match(/^target:\s*(.+)$/);
    if (targetMatch) {
      current.target = targetMatch[1].trim();
      continue;
    }

    const noteMatch = trimmed.match(/^note:\s*(.+)$/);
    if (noteMatch) current.note = noteMatch[1].trim();
  }

  return relationships;
}

function uniqueIntersection(a, b) {
  const bSet = new Set(b);
  return [...new Set(a.filter((item) => bSet.has(item)))];
}

function normalizeText(text) {
  return text.replace(/[^\p{Script=Han}A-Za-z0-9]+/gu, "");
}

function uniqueChars(text) {
  return [...new Set(normalizeText(text).split(""))].filter(Boolean);
}

function titleSimilarity(a, b) {
  const aChars = uniqueChars(a);
  const bChars = uniqueChars(b);
  if (aChars.length === 0 || bChars.length === 0) return 0;
  const shared = uniqueIntersection(aChars, bChars).length;
  return shared / Math.max(aChars.length, bChars.length);
}

function escapeCsv(value) {
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
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

function pairKey(a, b) {
  return [a, b].sort().join("::");
}

function loadExistingReviews() {
  const reviews = new Map();
  if (!fs.existsSync(csvOutput)) return reviews;

  const lines = fs.readFileSync(csvOutput, "utf8").trim().split("\n");
  if (lines.length <= 1) return reviews;

  const header = parseCsvLine(lines[0]);
  const indexByName = Object.fromEntries(header.map((name, index) => [name, index]));

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cells = parseCsvLine(line);
    const unitA = cells[indexByName.unit_a_id];
    const unitB = cells[indexByName.unit_b_id];
    const status = cells[indexByName.status] || "待人工判断";
    const note = cells[indexByName.note] || "";
    reviews.set(pairKey(unitA, unitB), { status, note });
  }

  return reviews;
}

function loadManualCandidates() {
  const manual = new Map();
  if (!fs.existsSync(manualCandidateInput)) return manual;

  const lines = fs.readFileSync(manualCandidateInput, "utf8").trim().split("\n");
  if (lines.length <= 1) return manual;

  const header = parseCsvLine(lines[0]);
  const indexByName = Object.fromEntries(header.map((name, index) => [name, index]));

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cells = parseCsvLine(line);
    const unitA = cells[indexByName.unit_a_id];
    const unitB = cells[indexByName.unit_b_id];
    if (!unitA || !unitB) continue;
    manual.set(pairKey(unitA, unitB), {
      reason: cells[indexByName.reason] || "人工补充候选",
      status: cells[indexByName.status] || "待人工判断",
      note: cells[indexByName.note] || "",
    });
  }

  return manual;
}

const units = walkFiles(unitRoot).map((file) => {
  const content = fs.readFileSync(file, "utf8");
  const frontmatter = extractFrontmatter(content);
  return {
    id: getScalar(frontmatter, "id"),
    type: getScalar(frontmatter, "type"),
    title: getScalar(frontmatter, "title"),
    relPath: path.relative(root, file).replaceAll(path.sep, "/"),
    themes: getList(frontmatter, "themes"),
    keywords: getList(frontmatter, "keywords"),
    sourceDocuments: getList(frontmatter, "source_documents"),
    relationships: getRelationships(frontmatter),
  };
}).filter((unit) => unit.id && unit.type && unit.title);

const unitById = new Map(units.map((unit) => [unit.id, unit]));
const candidates = [];
const existingReviews = loadExistingReviews();
const manualCandidates = loadManualCandidates();
const seenPairs = new Set();

for (let i = 0; i < units.length; i += 1) {
  for (let j = i + 1; j < units.length; j += 1) {
    const a = units[i];
    const b = units[j];

    if (a.type !== b.type) continue;

    const sharedThemes = uniqueIntersection(a.themes, b.themes);
    const sharedKeywords = uniqueIntersection(a.keywords, b.keywords);
    const sharedSources = uniqueIntersection(a.sourceDocuments, b.sourceDocuments);
    const similarity = titleSimilarity(a.title, b.title);
    const score = sharedThemes.length * 3 + sharedKeywords.length * 2 + sharedSources.length * 2 + Math.round(similarity * 10);

    const isCandidate =
      (sharedThemes.length >= 1 && sharedKeywords.length >= 1) ||
      (sharedSources.length >= 1 && (sharedThemes.length >= 1 || sharedKeywords.length >= 1)) ||
      (similarity >= 0.35 && (sharedThemes.length >= 1 || sharedKeywords.length >= 1 || sharedSources.length >= 1));

    if (!isCandidate) continue;

    let candidateType = "近似重复候选";
    if (sharedSources.length > 0 && sharedThemes.length > 0 && (sharedKeywords.length >= 1 || similarity >= 0.45)) {
      candidateType = "同义重复候选";
    }

    const review = existingReviews.get(pairKey(a.id, b.id)) || { status: "待人工判断", note: "" };
    const key = pairKey(a.id, b.id);
    seenPairs.add(key);

    candidates.push({
      unit_a_id: a.id,
      unit_a_type: a.type,
      unit_a_title: a.title,
      unit_b_id: b.id,
      unit_b_type: b.type,
      unit_b_title: b.title,
      shared_themes: sharedThemes.join(" | "),
      shared_keywords: sharedKeywords.join(" | "),
      shared_sources: sharedSources.join(" | "),
      title_similarity: similarity.toFixed(2),
      score,
      candidate_type: candidateType,
      status: review.status,
      note: review.note,
      candidate_reason: "自动识别",
      unit_a_file: a.relPath,
      unit_b_file: b.relPath,
    });
  }
}

for (const [key, manual] of manualCandidates.entries()) {
  if (seenPairs.has(key)) continue;
  const [unitAId, unitBId] = key.split("::");
  const a = unitById.get(unitAId);
  const b = unitById.get(unitBId);
  if (!a || !b) continue;

  const sharedThemes = uniqueIntersection(a.themes, b.themes);
  const sharedKeywords = uniqueIntersection(a.keywords, b.keywords);
  const sharedSources = uniqueIntersection(a.sourceDocuments, b.sourceDocuments);
  const similarity = titleSimilarity(a.title, b.title);

  candidates.push({
    unit_a_id: a.id,
    unit_a_type: a.type,
    unit_a_title: a.title,
    unit_b_id: b.id,
    unit_b_type: b.type,
    unit_b_title: b.title,
    shared_themes: sharedThemes.join(" | "),
    shared_keywords: sharedKeywords.join(" | "),
    shared_sources: sharedSources.join(" | "),
    title_similarity: similarity.toFixed(2),
    score: -1,
    candidate_type: "人工补充候选",
    status: manual.status,
    note: manual.note,
    candidate_reason: manual.reason,
    unit_a_file: a.relPath,
    unit_b_file: b.relPath,
  });
}

candidates.sort((a, b) => {
  if (b.score !== a.score) return b.score - a.score;
  const byType = a.unit_a_type.localeCompare(b.unit_a_type, "zh-Hans-CN");
  if (byType !== 0) return byType;
  return a.unit_a_id.localeCompare(b.unit_a_id, "zh-Hans-CN");
});

const rows = [
  [
    "unit_a_id",
    "unit_a_type",
    "unit_a_title",
    "unit_b_id",
    "unit_b_type",
    "unit_b_title",
    "shared_themes",
    "shared_keywords",
    "shared_sources",
    "title_similarity",
    "score",
    "candidate_type",
    "candidate_reason",
    "status",
    "note",
    "unit_a_file",
    "unit_b_file",
  ],
  ...candidates.map((row) => [
    row.unit_a_id,
    row.unit_a_type,
    row.unit_a_title,
    row.unit_b_id,
    row.unit_b_type,
    row.unit_b_title,
    row.shared_themes,
    row.shared_keywords,
    row.shared_sources,
    row.title_similarity,
    row.score,
    row.candidate_type,
    row.candidate_reason,
    row.status,
    row.note,
    row.unit_a_file,
    row.unit_b_file,
  ]),
];

fs.writeFileSync(csvOutput, rows.map((row) => row.map(escapeCsv).join(",")).join("\n") + "\n");

const typeCounts = candidates.reduce((acc, row) => {
  acc[row.candidate_type] = (acc[row.candidate_type] || 0) + 1;
  return acc;
}, {});
const statusCounts = candidates.reduce((acc, row) => {
  acc[row.status] = (acc[row.status] || 0) + 1;
  return acc;
}, {});

function getRelationshipBetween(unit, targetId, type = null) {
  return unit.relationships.find((relationship) => {
    if (relationship.target !== targetId) return false;
    if (type && relationship.type !== type) return false;
    return true;
  });
}

const auditRows = [];
const auditCounts = {
  conflict_backlinked_ok: 0,
  conflict_backlinked_missing: 0,
  layered_link_ok: 0,
  layered_link_not_required: 0,
  layered_link_missing: 0,
};

for (const candidate of candidates) {
  const unitA = unitById.get(candidate.unit_a_id);
  const unitB = unitById.get(candidate.unit_b_id);
  if (!unitA || !unitB) continue;

  if (candidate.status === "已判断：不合并，建立冲突关系") {
    const aConflict = getRelationshipBetween(unitA, unitB.id, "冲突");
    const bConflict = getRelationshipBetween(unitB, unitA.id, "冲突");
    const ok = Boolean(aConflict?.note && bConflict?.note);
    auditCounts[ok ? "conflict_backlinked_ok" : "conflict_backlinked_missing"] += 1;
    auditRows.push({
      candidate_pair: `${unitA.id} <-> ${unitB.id}`,
      candidate_status: candidate.status,
      audit_type: "冲突回写审计",
      audit_result: ok ? "通过" : "缺失",
      audit_note: ok
        ? "双方内容单元均已写入带 note 的冲突关系"
        : "候选已判断为建立冲突关系，但至少一侧未回写冲突关系或缺少 note",
    });
    continue;
  }

  if (candidate.status === "已判断：不合并，分层保留") {
    const aToB = getRelationshipBetween(unitA, unitB.id);
    const bToA = getRelationshipBetween(unitB, unitA.id);
    const hasExplicitLink = Boolean(aToB || bToA);
    const isConceptToJudgmentOrSolution =
      (unitA.type === "概念单元" && (unitB.type === "观点单元" || unitB.type === "方案单元")) ||
      (unitB.type === "概念单元" && (unitA.type === "观点单元" || unitA.type === "方案单元"));
    const isQuestionPair = unitA.type === "问题单元" && unitB.type === "问题单元";
    const isViewToSolution =
      (unitA.type === "观点单元" && unitB.type === "方案单元") ||
      (unitA.type === "方案单元" && unitB.type === "观点单元");

    let auditResult = "缺失";
    let auditNote = "候选已判断为分层保留，但对应内容单元之间缺少显式关系";

    if (hasExplicitLink) {
      auditResult = "通过";
      auditNote = "至少一侧内容单元已写入显式关系，能支撑分层保留";
      auditCounts.layered_link_ok += 1;
    } else if (isQuestionPair || isViewToSolution) {
      auditResult = "无需";
      auditNote = "当前分层保留组合不强制要求显式关系";
      auditCounts.layered_link_not_required += 1;
    } else if (isConceptToJudgmentOrSolution) {
      auditResult = "缺失";
      auditNote = "概念单元分层保留时，应至少通过 `解释` 关系显式支撑对应观点或方案";
      auditCounts.layered_link_missing += 1;
    } else {
      auditResult = "无需";
      auditNote = "当前分层保留组合不强制要求显式关系";
      auditCounts.layered_link_not_required += 1;
    }

    auditRows.push({
      candidate_pair: `${unitA.id} <-> ${unitB.id}`,
      candidate_status: candidate.status,
      audit_type: "分层保留关系审计",
      audit_result: auditResult,
      audit_note: auditNote,
    });
  }
}

const auditCsvRows = [
  ["candidate_pair", "candidate_status", "audit_type", "audit_result", "audit_note"],
  ...auditRows.map((row) => [row.candidate_pair, row.candidate_status, row.audit_type, row.audit_result, row.audit_note]),
];

fs.writeFileSync(auditOutput, auditCsvRows.map((row) => row.map(escapeCsv).join(",")).join("\n") + "\n");

const summaryLines = [
  "# 去重与冲突总览",
  "",
  `最后更新：${today}`,
  "",
  "## 当前统计",
  "",
  `- 内容单元总数：${units.length}`,
  `- 去重候选总数：${candidates.length}`,
  "",
  "## 候选类型分布",
  "",
];

for (const type of Object.keys(typeCounts).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"))) {
  summaryLines.push(`- ${type}：${typeCounts[type]}`);
}
if (Object.keys(typeCounts).length === 0) summaryLines.push("- 暂无候选");

summaryLines.push("", "## 处理状态分布", "");
for (const status of Object.keys(statusCounts).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"))) {
  summaryLines.push(`- ${status}：${statusCounts[status]}`);
}
if (Object.keys(statusCounts).length === 0) summaryLines.push("- 暂无状态");

summaryLines.push(
  "",
  "## 当前说明",
  "",
  "- 本文件先给出去重候选，不自动合并",
  "- 自动识别候选与人工补充候选会同时进入索引",
  "- 已判断为 `建立冲突关系` 的候选，会审计双方内容单元是否都已回写 `冲突` 关系",
  "- 已判断为 `分层保留` 的候选，会审计对应内容单元之间是否存在显式关系支撑",
  "",
  "## 关系审计",
  "",
  `- 冲突回写已通过：${auditCounts.conflict_backlinked_ok}`,
  `- 冲突回写待补：${auditCounts.conflict_backlinked_missing}`,
  `- 分层保留关系已通过：${auditCounts.layered_link_ok}`,
  `- 分层保留关系无需直连：${auditCounts.layered_link_not_required}`,
  `- 分层保留关系待补：${auditCounts.layered_link_missing}`,
  "",
  "## 权威文件",
  "",
  `- 候选明细：\`${path.relative(root, csvOutput).replaceAll(path.sep, "/")}\``,
  `- 审计明细：\`${path.relative(root, auditOutput).replaceAll(path.sep, "/")}\``,
  `- 人工补充候选：\`${path.relative(root, manualCandidateInput).replaceAll(path.sep, "/")}\``,
  "- 去重规则：`00-规则与索引/内容单元去重与版本规则.md`",
  "- 关系规则：`00-规则与索引/内容单元关系规则.md`",
);

fs.writeFileSync(summaryOutput, `${summaryLines.join("\n")}\n`);

console.log(JSON.stringify({
  csvOutput,
  summaryOutput,
  auditOutput,
  unitCount: units.length,
  candidateCount: candidates.length,
}, null, 2));
