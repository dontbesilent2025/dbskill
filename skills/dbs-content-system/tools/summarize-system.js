#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(process.cwd());

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

function isContentMarkdown(file) {
  return path.extname(file).toLowerCase() === ".md" && path.basename(file).toLowerCase() !== "readme.md";
}

function countContentMarkdownFiles(dir) {
  return walkFiles(dir).filter(isContentMarkdown).length;
}

function countBySubdir(dir) {
  if (!fs.existsSync(dir)) return {};
  const result = {};
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    result[entry.name] = countContentMarkdownFiles(path.join(dir, entry.name));
  }
  return result;
}

const summary = {
  totalUnits: countContentMarkdownFiles(path.join(root, "02-内容单元库")),
  unitBreakdown: countBySubdir(path.join(root, "02-内容单元库")),
  themeMaps: countContentMarkdownFiles(path.join(root, "05-主题地图")),
  assemblies: countContentMarkdownFiles(path.join(root, "06-选题装配")),
  totalFolders: walkFiles(root).filter((file) => false).length,
};

function countDirs(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    count += 1;
    count += countDirs(path.join(dir, entry.name));
  }
  return count;
}

summary.totalFolders = countDirs(root);
summary.totalFiles = walkFiles(root).length;

console.log(JSON.stringify(summary, null, 2));
