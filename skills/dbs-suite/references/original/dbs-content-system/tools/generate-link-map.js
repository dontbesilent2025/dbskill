#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(process.cwd());
const unitRoot = path.join(root, "02-内容单元库");
const themeRoot = path.join(root, "05-主题地图");
const assemblyRoot = path.join(root, "06-选题装配");
const stateRoot = path.join(root, "03-处理状态");

const relationCsv = path.join(stateRoot, "关系索引.csv");
const relationSummary = path.join(stateRoot, "关系总览.md");
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

function getRelationships(frontmatter) {
  if (/^relationships:\s*\[\s*\]\s*$/m.test(frontmatter)) return [];
  const lines = frontmatter.split("\n");
  const start = lines.findIndex((line) => line.trim() === "relationships:");
  if (start === -1) return [];
  const block = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.startsWith("  ")) break;
    block.push(line);
  }
  const relationships = [];
  let current = null;
  for (const line of block) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- type:")) {
      if (current) relationships.push(current);
      current = { type: trimmed.slice("- type:".length).trim(), target: "", note: "" };
      continue;
    }
    if (!current) continue;
    if (trimmed.startsWith("target:")) current.target = trimmed.slice("target:".length).trim();
    if (trimmed.startsWith("note:")) current.note = trimmed.slice("note:".length).trim();
  }
  if (current) relationships.push(current);
  return relationships;
}

function escapeCsv(value) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}

const files = walkFiles(unitRoot);
const units = files.map((file) => {
  const content = fs.readFileSync(file, "utf8");
  const frontmatter = extractFrontmatter(content);
  return {
    file,
    relPath: path.relative(root, file).replaceAll(path.sep, "/"),
    id: getScalar(frontmatter, "id"),
    type: getScalar(frontmatter, "type"),
    title: getScalar(frontmatter, "title"),
    relationships: getRelationships(frontmatter),
  };
});

const unitById = new Map(units.map((unit) => [unit.id, unit]));
const relationRows = [];
for (const unit of units) {
  for (const relation of unit.relationships) {
    const targetUnit = unitById.get(relation.target);
    relationRows.push({
      source_id: unit.id,
      source_type: unit.type,
      source_title: unit.title,
      relation_type: relation.type,
      target_id: relation.target,
      target_type: targetUnit ? targetUnit.type : "",
      target_title: targetUnit ? targetUnit.title : "",
      note: relation.note || "",
      source_file: unit.relPath,
      target_file: targetUnit ? targetUnit.relPath : "",
      status: targetUnit ? "有效" : "目标缺失",
    });
  }
}

relationRows.sort((a, b) => {
  const bySource = a.source_id.localeCompare(b.source_id, "zh-Hans-CN");
  if (bySource !== 0) return bySource;
  const byType = a.relation_type.localeCompare(b.relation_type, "zh-Hans-CN");
  if (byType !== 0) return byType;
  return a.target_id.localeCompare(b.target_id, "zh-Hans-CN");
});

const rows = [[
  "source_id","source_type","source_title","relation_type","target_id","target_type","target_title","note","source_file","target_file","status"
], ...relationRows.map((row) => [
  row.source_id,row.source_type,row.source_title,row.relation_type,row.target_id,row.target_type,row.target_title,row.note,row.source_file,row.target_file,row.status
])];

fs.writeFileSync(relationCsv, rows.map((row) => row.map(escapeCsv).join(",")).join("\n") + "\n");

const relationTypeCounts = relationRows.reduce((acc, row) => {
  acc[row.relation_type] = (acc[row.relation_type] || 0) + 1;
  return acc;
}, {});

const unitsWithRelationships = units.filter((unit) => unit.relationships.length > 0).length;
const missingTargets = relationRows.filter((row) => row.status !== "有效");

const lines = [
  "# 关系总览",
  "",
  `最后更新：${today}`,
  "",
  "## 当前统计",
  "",
  `- 内容单元总数：${units.length}`,
  `- 含关系的内容单元数：${unitsWithRelationships}`,
  `- 关系总数：${relationRows.length}`,
  "",
  "## 关系类型分布",
  "",
];

for (const type of Object.keys(relationTypeCounts).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"))) {
  lines.push(`- ${type}：${relationTypeCounts[type]}`);
}
if (Object.keys(relationTypeCounts).length === 0) lines.push("- 暂无关系");
lines.push("", "## 校验结果", "");
if (missingTargets.length === 0) lines.push("- 所有关系统一指向有效内容单元");
else {
  lines.push(`- 存在 ${missingTargets.length} 条目标缺失关系`);
  for (const row of missingTargets) lines.push(`- ${row.source_id} -> ${row.target_id}（${row.relation_type}）`);
}
lines.push("", "## 权威文件", "", "- 明细索引：`03-处理状态/关系索引.csv`", "- 关系规则：`00-规则与索引/内容单元关系规则.md`");
fs.writeFileSync(relationSummary, lines.join("\n") + "\n");

console.log(JSON.stringify({
  relationCsv,
  relationSummary,
  totalUnits: units.length,
  unitsWithRelationships,
  relationCount: relationRows.length,
  themeCount: walkFiles(themeRoot).filter((file) => path.basename(file).toLowerCase() !== "readme.md").length,
  assemblyCount: walkFiles(assemblyRoot).filter((file) => path.basename(file).toLowerCase() !== "readme.md").length,
}, null, 2));
