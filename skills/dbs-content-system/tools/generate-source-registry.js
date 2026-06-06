#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(process.cwd());
const sourceRoot = path.join(root, "01-原始素材区");
const stateRoot = path.join(root, "03-处理状态");
const output = path.join(stateRoot, "来源注册表_批量生成候选.csv");
const registryPath = path.join(stateRoot, "来源注册表.csv");

const rules = [
  { keywords: ["短视频", "文稿"], type: "短视频", code: "VIDEO" },
  { keywords: ["公众号"], type: "公众号文章", code: "WX" },
  { keywords: ["观点与概念"], type: "观点与概念", code: "CON" },
  { keywords: ["爆款文稿"], type: "爆款文稿", code: "BK" },
  { keywords: ["推文"], type: "推文素材", code: "POST" },
  { keywords: ["其他作者"], type: "外部研究素材", code: "EXT" },
  { keywords: ["dontbesilent"], type: "本人内容", code: "USER" },
];

function walk(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) results.push(...walk(full));
    else if (entry.isFile()) results.push(full);
  }
  return results;
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

function escapeCsv(value) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}

function loadRegistry() {
  const byPath = new Map();
  const maxSeqByCode = new Map();
  const usedIds = new Set();

  if (!fs.existsSync(registryPath)) return { byPath, maxSeqByCode, usedIds };

  const lines = fs.readFileSync(registryPath, "utf8").split("\n").filter(Boolean);
  if (lines.length <= 1) return { byPath, maxSeqByCode, usedIds };

  for (const line of lines.slice(1)) {
    const [sourceId, relPath] = parseCsvLine(line);
    if (!sourceId || !relPath) continue;
    byPath.set(relPath, sourceId);
    usedIds.add(sourceId);
    const match = sourceId.match(/^SRC-([A-Z]+)-(\d{3})$/);
    if (!match) continue;
    const [, code, seq] = match;
    maxSeqByCode.set(code, Math.max(maxSeqByCode.get(code) || 0, Number(seq)));
  }

  return { byPath, maxSeqByCode, usedIds };
}

function inferRule(relPath) {
  const normalized = relPath.replaceAll("\\", "/");
  for (const rule of rules) {
    if (rule.keywords.every((item) => normalized.includes(item))) return rule;
  }
  return { type: "未分类素材", code: "MISC" };
}

function inferStableId(rule, relPath, existing) {
  if (existing.byPath.has(relPath)) return existing.byPath.get(relPath);

  const base = path.basename(relPath);
  const videoMatch = base.match(/^(\d{3})\.[^.]+$/);
  if (rule.code === "VIDEO" && videoMatch) {
    const id = `SRC-VIDEO-${videoMatch[1]}`;
    existing.usedIds.add(id);
    existing.maxSeqByCode.set(rule.code, Math.max(existing.maxSeqByCode.get(rule.code) || 0, Number(videoMatch[1])));
    return id;
  }

  const burstMatch = base.match(/^(\d{2})-/);
  if (rule.code === "BK" && burstMatch) {
    const seq = Number(burstMatch[1]);
    const id = `SRC-BK-${String(seq).padStart(3, "0")}`;
    existing.usedIds.add(id);
    existing.maxSeqByCode.set(rule.code, Math.max(existing.maxSeqByCode.get(rule.code) || 0, seq));
    return id;
  }

  let next = existing.maxSeqByCode.get(rule.code) || 0;
  let id = "";
  do {
    next += 1;
    id = `SRC-${rule.code}-${String(next).padStart(3, "0")}`;
  } while (existing.usedIds.has(id));

  existing.maxSeqByCode.set(rule.code, next);
  existing.usedIds.add(id);
  return id;
}

const existing = loadRegistry();
const rows = [["source_id", "path", "source_type", "author", "status", "notes"]];
const files = walk(sourceRoot)
  .filter((file) => /\.(md|txt|html|csv|json|jsonl|docx|pdf)$/i.test(file))
  .map((file) => path.relative(sourceRoot, file).replaceAll(path.sep, "/"))
  .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));

for (const rel of files) {
  const rule = inferRule(rel);
  const id = inferStableId(rule, rel, existing);
  rows.push([id, rel, rule.type, "待补", "候选", "脚本生成，待人工确认"]);
}

fs.writeFileSync(output, rows.map((row) => row.map(escapeCsv).join(",")).join("\n") + "\n");

console.log(JSON.stringify({
  output,
  count: rows.length - 1,
}, null, 2));
