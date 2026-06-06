#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(process.cwd());
const templateRoot = path.join(root, "04-模板");
const unitRoot = path.join(root, "02-内容单元库");

const typeMap = {
  QST: { dir: "问题单元", template: "问题单元模板.md" },
  CON: { dir: "概念单元", template: "概念单元模板.md" },
  OPI: { dir: "观点单元", template: "观点单元模板.md" },
  CAS: { dir: "案例单元", template: "案例单元模板.md" },
  SOL: { dir: "方案单元", template: "方案单元模板.md" },
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

const [, , prefix, date, seq, title, sourceId = "SRC-*", theme = "主题", keyword = "关键词", author = "待补"] = process.argv;

if (!prefix || !date || !seq || !title) {
  fail("用法：node 07-脚本与工具/generate-unit-draft.js <QST|CON|OPI|CAS|SOL> <YYYYMMDD> <序号3位> <标题> [sourceId] [theme] [keyword] [author]");
}

if (!typeMap[prefix]) fail(`不支持的类型前缀：${prefix}`);
if (!/^\d{8}$/.test(date)) fail("日期必须是 YYYYMMDD");
if (!/^\d{3}$/.test(seq)) fail("序号必须是 3 位数字");

const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
const id = `${prefix}-${date}-${seq}`;
const meta = typeMap[prefix];
const templatePath = path.join(templateRoot, meta.template);
const targetDir = path.join(unitRoot, meta.dir);
const fileName = `${id}_${title}.md`;
const targetPath = path.join(targetDir, fileName);

if (!fs.existsSync(templatePath)) fail(`模板不存在：${templatePath}`);
if (fs.existsSync(targetPath)) fail(`文件已存在：${targetPath}`);

let content = fs.readFileSync(templatePath, "utf8");
content = content
  .replace(`${prefix}-YYYYMMDD-001`, id)
  .replace(/^title:\s*标题$/m, `title: ${title}`)
  .replace(/^  - SRC-\*$/m, `  - ${sourceId}`)
  .replace(/^  - 待补$/m, `  - ${author}`)
  .replace(/^  - 主题$/m, `  - ${theme}`)
  .replace(/^  - 关键词$/m, `  - ${keyword}`)
  .replace(/^created_at:\s*YYYY-MM-DD$/m, `created_at: ${formattedDate}`)
  .replace(/^updated_at:\s*YYYY-MM-DD$/m, `updated_at: ${formattedDate}`);

fs.writeFileSync(targetPath, content);
console.log(targetPath);
