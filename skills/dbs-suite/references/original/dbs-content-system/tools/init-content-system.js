#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const skillRoot = __dirname.startsWith(path.sep)
  ? path.resolve(__dirname, "..")
  : path.resolve(process.cwd(), path.dirname(__filename), "..");

const targetArg = process.argv[2];
if (!targetArg) {
  console.error("用法：node tools/init-content-system.js <目标工程目录>");
  process.exit(1);
}

const targetRoot = path.isAbsolute(targetArg)
  ? path.resolve(targetArg)
  : path.resolve(process.cwd(), targetArg);
const dirs = [
  "00-规则与索引",
  "01-原始素材区",
  "01-原始素材区/完整副本",
  "02-内容单元库/问题单元",
  "02-内容单元库/概念单元",
  "02-内容单元库/观点单元",
  "02-内容单元库/案例单元",
  "02-内容单元库/方案单元",
  "03-处理状态",
  "04-模板",
  "05-主题地图",
  "06-选题装配",
  "07-脚本与工具",
];

for (const dir of dirs) {
  fs.mkdirSync(path.join(targetRoot, dir), { recursive: true });
}

const files = {
  "03-处理状态/来源注册表.csv": "\"source_id\",\"path\",\"source_type\",\"author\",\"status\",\"notes\"\n",
  "03-处理状态/来源注册表_批量生成候选.csv": "\"source_id\",\"path\",\"source_type\",\"author\",\"status\",\"notes\"\n",
  "03-处理状态/原始素材索引.csv": "\"path\",\"category\"\n",
  "03-处理状态/待处理清单.csv": "\"path\",\"status\",\"source_type\",\"notes\"\n",
  "03-处理状态/已处理清单.csv": "\"path\",\"status\",\"source_type\",\"notes\"\n",
  "03-处理状态/人工去重候选.csv": "\"unit_a_id\",\"unit_b_id\",\"reason\",\"status\",\"note\"\n",
  "03-处理状态/处理状态总览.md": "# 处理状态总览\n\n最后更新：待补\n\n## 当前范围\n\n- 待补\n\n## 当前已完成\n\n- 工程骨架已建立\n\n## 当前未完成\n\n- 待补\n\n## 下一步\n\n- 复制原始素材\n- 生成来源候选与原始索引\n- 运行首批样本抽取\n",
  "03-处理状态/抽取日志.md": "# 抽取日志\n",
  "03-处理状态/第一批样本计划.md": "# 第一批样本计划\n\n## 目标\n\n- 选择 3 到 5 篇代表性样本文稿\n- 首批至少产出 15 个内容单元\n\n## 样本清单\n\n- 待补\n",
};

for (const [rel, content] of Object.entries(files)) {
  const filePath = path.join(targetRoot, rel);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
  }
}

const templateNames = [
  "问题单元模板.md",
  "概念单元模板.md",
  "观点单元模板.md",
  "案例单元模板.md",
  "方案单元模板.md",
  "主题地图模板.md",
  "选题装配模板.md",
];

for (const name of templateNames) {
  const src = path.join(skillRoot, "templates", name);
  const dst = path.join(targetRoot, "04-模板", name);
  fs.copyFileSync(src, dst);
}

const scaffoldRoot = path.join(skillRoot, "scaffold", "root");
for (const name of ["AGENTS.md", "CLAUDE.md", "README.md", "SOURCE_OF_TRUTH.md"]) {
  const src = path.join(scaffoldRoot, name);
  const dst = path.join(targetRoot, name);
  fs.copyFileSync(src, dst);
}

const scaffoldRules = path.join(skillRoot, "scaffold", "rules");
for (const name of [
  "内容单元字段规范.md",
  "内容单元关系规则.md",
  "内容单元去重与版本规则.md",
  "处理流程.md",
  "新增文稿进入系统流程.md",
  "来源命名规范.md",
]) {
  const src = path.join(scaffoldRules, name);
  const dst = path.join(targetRoot, "00-规则与索引", name);
  fs.copyFileSync(src, dst);
}

const toolNames = [
  "rebuild-processing-ledger.js",
  "generate-unit-draft.js",
  "extract-sample-units.js",
  "assemble-topic-from-units.js",
  "generate-source-registry.js",
  "generate-link-map.js",
  "generate-duplicate-candidates.js",
  "fill-obsidian-links.js",
  "summarize-system.js",
];

for (const name of toolNames) {
  const src = path.join(skillRoot, "tools", name);
  const dst = path.join(targetRoot, "07-脚本与工具", name);
  fs.copyFileSync(src, dst);
}

console.log(JSON.stringify({ targetRoot, created: true }, null, 2));
