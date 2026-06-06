#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(process.cwd());
const unitRoot = path.join(root, "02-内容单元库");
const targetRoots = [
  path.join(root, "02-内容单元库"),
  path.join(root, "05-主题地图"),
  path.join(root, "06-选题装配"),
];
const codeFencePattern = /```[\s\S]*?```/g;
const associationSectionPattern = /\n## 关联单元\n([\s\S]*?)(\n## |\s*$)/;

function walkMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkMarkdownFiles(full));
    else if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".md") files.push(full);
  }
  return files;
}

function extractFrontmatter(content) {
  const match = content.match(/^(---\n[\s\S]*?\n---\n?)([\s\S]*)$/);
  if (!match) return { frontmatter: "", body: content };
  return { frontmatter: match[1], body: match[2] };
}

function getId(frontmatter) {
  const match = frontmatter.match(/^id:\s*(.+)$/m);
  return match ? match[1].trim() : "";
}

function getRelationshipTargets(frontmatter) {
  return [...frontmatter.matchAll(/^\s*target:\s*(\S+)\s*$/gm)].map((match) => match[1]);
}

const idToLink = new Map();
for (const file of walkMarkdownFiles(unitRoot)) {
  const content = fs.readFileSync(file, "utf8");
  const { frontmatter } = extractFrontmatter(content);
  const id = getId(frontmatter);
  if (!id) continue;
  idToLink.set(id, `[[${path.basename(file, ".md")}]]`);
}

let changedFiles = 0;
let changedLinks = 0;
let syncedAssociationFiles = 0;
let syncedAssociationLinks = 0;

function replaceLinksInBody(body) {
  const codeFences = [];
  const bodyWithoutCode = body.replace(codeFencePattern, (block) => {
    const token = `__CODE_FENCE_${codeFences.length}__`;
    codeFences.push(block);
    return token;
  });

  let nextBody = bodyWithoutCode;

  for (const [id, link] of idToLink.entries()) {
    const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const backtickPattern = new RegExp("`" + escapedId + "`", "g");
    const barePattern = new RegExp(`(^|[^\\w\\[\\]])(${escapedId})(?=$|[^\\w_])`, "gm");

    const backtickMatches = nextBody.match(backtickPattern);
    if (backtickMatches) {
      changedLinks += backtickMatches.length;
      nextBody = nextBody.replace(backtickPattern, link);
    }

    const bareMatches = [...nextBody.matchAll(barePattern)].filter(([fullMatch]) => !fullMatch.includes(`[[${id}_`));
    if (bareMatches.length > 0) {
      changedLinks += bareMatches.length;
      nextBody = nextBody.replace(barePattern, (_, prefix, matchedId) => `${prefix}${idToLink.get(matchedId)}`);
    }
  }

  return nextBody.replace(/__CODE_FENCE_(\d+)__/g, (_, index) => codeFences[Number(index)]);
}

function syncAssociationSection(frontmatter, body) {
  const targets = getRelationshipTargets(frontmatter)
    .map((targetId) => idToLink.get(targetId))
    .filter(Boolean);

  if (targets.length === 0) return body;

  const uniqueTargets = [...new Set(targets)];
  const match = body.match(associationSectionPattern);
  if (!match) {
    syncedAssociationFiles += 1;
    syncedAssociationLinks += uniqueTargets.length;
    const trimmedBody = body.replace(/\s*$/, "");
    return `${trimmedBody}\n\n## 关联单元\n\n${uniqueTargets.map((link) => `- ${link}`).join("\n")}\n`;
  }

  const sectionContent = match[1];
  const existingLinks = [...sectionContent.matchAll(/\[\[([^\]]+)\]\]/g)].map((item) => `[[${item[1]}]]`);
  const missingLinks = uniqueTargets.filter((link) => !existingLinks.includes(link));

  if (missingLinks.length === 0) return body;

  const nextSectionContent = `${sectionContent}${missingLinks.map((link) => `- ${link}\n`).join("")}`;
  syncedAssociationFiles += 1;
  syncedAssociationLinks += missingLinks.length;
  return body.replace(associationSectionPattern, `\n## 关联单元\n${nextSectionContent}${match[2]}`);
}

for (const dir of targetRoots) {
  for (const file of walkMarkdownFiles(dir)) {
    const content = fs.readFileSync(file, "utf8");
    const { frontmatter, body } = extractFrontmatter(content);
    let nextBody = replaceLinksInBody(body);

    if (file.startsWith(unitRoot)) {
      nextBody = syncAssociationSection(frontmatter, nextBody);
    }

    if (nextBody === body) continue;
    fs.writeFileSync(file, `${frontmatter}${nextBody}`);
    changedFiles += 1;
  }
}

console.log(JSON.stringify({
  changedFiles,
  changedLinks,
  syncedAssociationFiles,
  syncedAssociationLinks,
}, null, 2));
