#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${1:-"$ROOT_DIR/dist/skills"}"
VERSION="$(tr -d '[:space:]' < "$ROOT_DIR/VERSION")"

if ! command -v python3 >/dev/null 2>&1; then
  echo "error: python3 command is required" >&2
  exit 1
fi

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

INNER_DIR="$(mktemp -d)"
trap 'rm -rf "$INNER_DIR"' EXIT

# skill 名 → 分组目录
group_for() {
  case "$1" in
    dbs)
      echo "必装入口" ;;
    dbs-diagnosis|dbs-deconstruct|dbs-goal|dbs-good-question|dbs-slowisfast|dbs-action)
      echo "看商业问题" ;;
    dbs-content|dbs-benchmark|dbs-hook|dbs-xhs-title|dbs-ai-check)
      echo "做内容" ;;
    dbs-content-system)
      echo "进阶-内容工程" ;;
    dbs-chatroom|dbs-chatroom-austrian)
      echo "进阶-聊天室" ;;
    dbs-save|dbs-restore|dbs-report)
      echo "进阶-状态管理" ;;
    dbs-decision)
      echo "进阶-决策系统" ;;
    dbs-agent-migration)
      echo "进阶-Agent基建" ;;
    dbs-learning)
      echo "进阶-学习" ;;
    *)
      echo "未分组" ;;
  esac
}

build_one() {
  local skill_dir="$1"
  local name
  local group
  local stage_dir
  local target_dir
  local refs

  name="$(basename "$skill_dir")"
  group="$(group_for "$name")"
  target_dir="$INNER_DIR/$group"
  mkdir -p "$target_dir"

  stage_dir="$(mktemp -d)"

  cp "$skill_dir/SKILL.md" "$stage_dir/SKILL.md"

  if [ -d "$skill_dir/templates" ]; then
    mkdir -p "$stage_dir/templates"
    cp -R "$skill_dir/templates/." "$stage_dir/templates/"
  fi

  if [ -d "$skill_dir/scaffold" ]; then
    mkdir -p "$stage_dir/scaffold"
    cp -R "$skill_dir/scaffold/." "$stage_dir/scaffold/"
  fi

  if [ -d "$skill_dir/docs" ]; then
    mkdir -p "$stage_dir/docs"
    cp -R "$skill_dir/docs/." "$stage_dir/docs/"
  fi

  if [ -d "$skill_dir/tools" ]; then
    mkdir -p "$stage_dir/tools"
    cp -R "$skill_dir/tools/." "$stage_dir/tools/"
  fi

  refs="$(grep -Eo '知识库/[^`,。 、)]*\.md' "$skill_dir/SKILL.md" || true)"
  if [ -n "$refs" ]; then
    while IFS= read -r ref; do
      [ -n "$ref" ] || continue
      if [ -f "$ROOT_DIR/$ref" ]; then
        mkdir -p "$stage_dir/$(dirname "$ref")"
        cp "$ROOT_DIR/$ref" "$stage_dir/$ref"
      fi
    done <<< "$refs"
  fi

  python3 - "$stage_dir" "$target_dir/${name}.zip" <<'PY'
import os
import sys
import zipfile

source_dir, archive_path = sys.argv[1], sys.argv[2]

with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    for root, _, files in os.walk(source_dir):
        for filename in files:
            path = os.path.join(root, filename)
            archive.write(path, os.path.relpath(path, source_dir))
PY

  rm -rf "$stage_dir"
  echo "built $group/${name}.zip"
}

for skill_md in "$ROOT_DIR"/skills/*/SKILL.md; do
  build_one "$(dirname "$skill_md")"
done

cat > "$INNER_DIR/README.md" <<EOF
# dbskill ${VERSION}

Trae Solo 一个 zip 装一个 skill。本压缩包按使用场景分了几个文件夹，按需把里面的 zip 逐个拖进 Trae Solo 的「上传技能」窗口即可。

## 必装入口

- **dbs** — 主入口，根据你的问题自动路由到合适的诊断 skill。其他 skill 都依赖它，先装这个。

## 看商业问题

- **dbs-diagnosis** — 商业模式诊断（问诊 + 体检两种模式）
- **dbs-deconstruct** — 概念拆解（维特根斯坦 + 奥派经济学）
- **dbs-goal** — 目标清晰化（把「我想做个人 IP」这种愿望语法审计成可检查的交付物）
- **dbs-good-question** — 好问题生成器（把模糊问题改成 Agent 可推理、可验证的问题说明书）
- **dbs-slowisfast** — 慢就是快（找看起来更慢但长期更快的方法）
- **dbs-action** — 执行力诊断（阿德勒心理学，「知道该做但就是不做」）

## 做内容

- **dbs-content** — 内容创作诊断
- **dbs-benchmark** — 对标分析
- **dbs-hook** — 短视频开头优化
- **dbs-xhs-title** — 小红书标题公式（75 个验证过的爆款公式）
- **dbs-ai-check** — AI 写作特征识别

## 进阶-内容工程

- **dbs-content-system** — 内容结构化系统（把本地大量内容资产搭成可继续生长的内容工程）

## 进阶-聊天室

- **dbs-chatroom** — 定向聊天室（推荐专家或指定人物，多角色对话）
- **dbs-chatroom-austrian** — 奥派经济聊天室（哈耶克 × 米塞斯 × Claude）

## 进阶-状态管理

诊断状态跨会话续接的三件套，攒几次诊断打包成一份报告。

- **dbs-save** — 存档当前诊断
- **dbs-restore** — 恢复上次诊断
- **dbs-report** — 多次存档合并成可交付的 markdown 报告

## 进阶-决策系统

- **dbs-decision** — 决策系统（把重大决策沉淀成 ~/.dbs/decisions/ 下的本地知识工程）

## 进阶-Agent基建

- **dbs-agent-migration** — Agent 工作台迁移（Claude Code / Codex / Grok 三端一致）

## 进阶-学习

- **dbs-learning** — 交互式学习（根据上一篇反馈生成下一篇）

---

每个 zip 解压后根级是 SKILL.md（带 YAML frontmatter，含 name + description），格式遵循 Anthropic Skills 规范。
EOF

python3 - "$INNER_DIR" "$OUT_DIR/dbskill-${VERSION}.zip" <<'PY'
import os
import sys
import zipfile

inner_dir, archive_path = sys.argv[1], sys.argv[2]

with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    for root, _, files in os.walk(inner_dir):
        for filename in sorted(files):
            path = os.path.join(root, filename)
            archive.write(path, os.path.relpath(path, inner_dir))
PY

echo
echo "done: $OUT_DIR/dbskill-${VERSION}.zip"
