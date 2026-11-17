#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  install-skill.sh link <skill-name-or-path>
  install-skill.sh unlink <skill-name-or-path>
  install-skill.sh status <skill-name-or-path>

Examples:
  install-skill.sh link dbs-diagnosis
  install-skill.sh link skills/dbs-diagnosis
  install-skill.sh link skills
  install-skill.sh status /absolute/path/to/skill

Routing:
  ~/.agents/skills is the shared skill bus. Codex, GitHub Copilot, Gemini CLI,
  Cursor, Augment, Roo Code, OpenCode, and OpenHands read skills from there.

  Claude Code, WorkBuddy, Hermes Agent, Kiro, Qwen Code, and Cline receive
  native links only when their home directories already exist. Windows uses
  directory Junctions; Unix-like systems use symbolic links.

  Grok receives a thin bridge instead of a filesystem link. Legacy and
  duplicate links under shared-compatible or retired host directories are
  removed automatically when they point to the selected source.
USAGE
}

die() {
  echo "✗ $*" >&2
  exit 1
}

repo_root() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$script_dir/../../.." && pwd
}

script_dir() {
  cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P
}

is_windows_layer() {
  case "${DBS_INSTALL_PLATFORM:-}" in
    windows) return 0 ;;
    unix) return 1 ;;
  esac

  case "$(uname -s)" in
    MINGW*|MSYS*|CYGWIN*) return 0 ;;
    *) return 1 ;;
  esac
}

windows_powershell() {
  local candidate

  if [[ -n "${DBS_INSTALL_POWERSHELL:-}" ]]; then
    printf '%s\n' "$DBS_INSTALL_POWERSHELL"
    return 0
  fi

  for candidate in pwsh.exe powershell.exe pwsh powershell; do
    if command -v "$candidate" >/dev/null 2>&1; then
      command -v "$candidate"
      return 0
    fi
  done

  return 1
}

windows_path() {
  local path="$1"
  local converter="${DBS_INSTALL_CYGPATH:-cygpath}"

  command -v "$converter" >/dev/null 2>&1 || die "Windows 环境缺少 cygpath，无法安全创建 Junction"
  "$converter" -aw "$path"
}

windows_long_path() {
  local path="$1"
  local converter="${DBS_INSTALL_CYGPATH:-cygpath}"

  command -v "$converter" >/dev/null 2>&1 || die "Windows 环境缺少 cygpath，无法比较路径"
  "$converter" -awl "$path" 2>/dev/null || "$converter" -aw "$path"
}

posix_path() {
  local path="$1"
  local converter="${DBS_INSTALL_CYGPATH:-cygpath}"

  command -v "$converter" >/dev/null 2>&1 || return 1
  "$converter" -au "$path"
}

run_windows_junction() {
  local action="$1"
  local path="$2"
  local target="${3:-}"
  local powershell
  local helper
  local path_windows
  local target_windows=""
  local -a powershell_args

  powershell="$(windows_powershell)" || die "Windows 环境缺少 PowerShell，无法安全管理 Junction"
  helper="$(windows_path "$(script_dir)/windows-junction.ps1")"
  path_windows="$(windows_path "$path")"
  if [[ -n "$target" ]]; then
    target_windows="$(windows_path "$target")"
  fi

  powershell_args=(
    -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass
    -File "$helper" -Action "$action" -Path "$path_windows"
  )
  if [[ -n "$target_windows" ]]; then
    powershell_args+=(-Target "$target_windows")
  fi

  MSYS2_ARG_CONV_EXCL='*' "$powershell" "${powershell_args[@]}"
}

resolve_candidate() {
  local input="$1"
  local root="$2"
  local candidate

  if [[ "$input" = /* ]]; then
    candidate="$input"
  elif [[ -d "$PWD/$input" ]]; then
    candidate="$PWD/$input"
  elif [[ -d "$root/$input" ]]; then
    candidate="$root/$input"
  elif [[ -d "$root/skills/$input" ]]; then
    candidate="$root/skills/$input"
  else
    die "找不到 Skill 或 Skill 集合目录：$input"
  fi

  candidate="$(cd "$candidate" && pwd -P)"
  printf '%s\n' "$candidate"
}

list_skill_sources() {
  local candidate="$1"
  local found=0
  local skill_dir

  if [[ -f "$candidate/SKILL.md" ]]; then
    printf '%s\n' "$candidate"
    return 0
  fi

  for skill_dir in "$candidate"/*; do
    [[ "$(basename "$skill_dir")" == "private" ]] && continue
    [[ -f "$skill_dir/SKILL.md" ]] || continue
    found=1
    (cd "$skill_dir" && pwd -P)
  done

  [[ "$found" -eq 1 ]] || die "$candidate 里没有 SKILL.md，也没有包含 SKILL.md 的一级子目录"
}

skill_name() {
  local src="$1"
  local skill_file="$src/SKILL.md"
  local name

  name="$(awk '
    NR == 1 && $0 == "---" { in_frontmatter = 1; next }
    in_frontmatter && $0 == "---" { exit }
    in_frontmatter && /^name:[[:space:]]*/ {
      sub(/^name:[[:space:]]*/, "")
      gsub(/^[[:space:]]+|[[:space:]]+$/, "")
      print
      exit
    }
  ' "$skill_file")"

  if [[ "$name" == \"*\" && "$name" == *\" ]] || [[ "$name" == \'*\' && "$name" == *\' ]]; then
    name="${name:1:${#name}-2}"
  fi
  [[ -n "$name" ]] || name="$(basename "$src")"

  case "$name" in
    .|..|*/*) die "Skill name 不合法：$name（$skill_file）" ;;
  esac
  printf '%s\n' "$name"
}

interface_gate_required() {
  local current="$1"
  local parent

  while true; do
    if [[ -f "$current/AGENTS.md" ]] && grep -Fq '<!-- skill-interface-gate: required -->' "$current/AGENTS.md"; then
      return 0
    fi
    parent="$(dirname "$current")"
    [[ "$parent" != "$current" ]] || return 1
    current="$parent"
  done
}

validate_interface_gate() {
  local candidate="$1"
  local validator

  interface_gate_required "$candidate" || return 0
  validator="$(repo_root)/tools/check-skill-interface-metadata.py"
  [[ -f "$validator" ]] || die "已启用 Skill 界面元数据闸门，但找不到校验器：$validator"
  echo "== Skill 界面元数据闸门 =="
  python3 "$validator" "$candidate" || die "Skill 界面元数据校验失败，已停止安装"
}

INSTALL_HOME="${DBS_INSTALL_HOME:-$HOME}"
SHARED_TARGET_DIR="$INSTALL_HOME/.agents/skills"

# 这些客户端没有采用 ~/.agents/skills，或当前仍需要原生目录。
NATIVE_TARGET_DIRS=(
  "$INSTALL_HOME/.claude/skills"
  "$INSTALL_HOME/.workbuddy/skills"
  "$INSTALL_HOME/.hermes/skills"
  "$INSTALL_HOME/.kiro/skills"
  "$INSTALL_HOME/.qwen/skills"
  "$INSTALL_HOME/.cline/skills"
  "$INSTALL_HOME/.gemini/config/skills"
)

# 前 8 项已能读取 ~/.agents/skills；其余是旧版脚本曾写入、现已停止维护的目录。
# link 会清理其中指向当前源 Skill 的链接，避免同一 Skill 多入口和随机扩散。
REDUNDANT_TARGET_DIRS=(
  "$INSTALL_HOME/.codex/skills"
  "$INSTALL_HOME/.copilot/skills"
  "$INSTALL_HOME/.gemini/skills"
  "$INSTALL_HOME/.cursor/skills"
  "$INSTALL_HOME/.augment/skills"
  "$INSTALL_HOME/.roo/skills"
  "$INSTALL_HOME/.config/opencode/skills"
  "$INSTALL_HOME/.openhands/skills"
  "$INSTALL_HOME/.kilocode/skills"
  "$INSTALL_HOME/.trae/skills"
  "$INSTALL_HOME/.trae-cn/skills"
  "$INSTALL_HOME/.codebuddy/skills"
  "$INSTALL_HOME/.zencoder/skills"
  "$INSTALL_HOME/.continue/skills"
  "$INSTALL_HOME/.aider-desk/skills"
  "$INSTALL_HOME/.factory/skills"
  "$INSTALL_HOME/.forge/skills"
  "$INSTALL_HOME/.vibe/skills"
  "$INSTALL_HOME/.codestudio/skills"
  "$INSTALL_HOME/.codemaker/skills"
  "$INSTALL_HOME/.codeartsdoer/skills"
  "$INSTALL_HOME/.junie/skills"
  "$INSTALL_HOME/.qoder/skills"
  "$INSTALL_HOME/.openclaw/skills"
)

host_root_for() {
  dirname "$1"
}

path_entry_exists() {
  local path="$1"
  local parent
  local entry

  [[ -e "$path" || -L "$path" ]] && return 0
  parent="$(dirname "$path")"
  [[ -d "$parent" ]] || return 1
  while IFS= read -r entry; do
    [[ "$entry" == "$path" ]] && return 0
  done < <(find "$parent" -mindepth 1 -maxdepth 1 -print)
  return 1
}

normalized_path_for_compare() {
  local path="$1"
  local normalized

  if is_windows_layer; then
    normalized="$(windows_long_path "$path")"
    normalized="${normalized//$'\r'/}"
    normalized="$(printf '%s' "$normalized" | tr '\\\\' '/' | tr '[:upper:]' '[:lower:]')"
    printf '%s\n' "${normalized%/}"
  else
    printf '%s\n' "${path%/}"
  fi
}

paths_are_same() {
  local left
  local right

  left="$(normalized_path_for_compare "$1")"
  right="$(normalized_path_for_compare "$2")"
  [[ "$left" == "$right" ]] && return 0
  is_windows_layer || return 1
  run_windows_junction same "$1" "$2" >/dev/null 2>&1
}

path_is_under() {
  local path
  local root

  path="$(normalized_path_for_compare "$1")"
  root="$(normalized_path_for_compare "$2")"
  case "$path" in
    "$root"|"$root"/*) return 0 ;;
    *) ;;
  esac

  is_windows_layer || return 1
  run_windows_junction under "$1" "$2" >/dev/null 2>&1
}

is_managed_link() {
  local link="$1"

  [[ -L "$link" ]] && return 0
  is_windows_layer || return 1
  path_entry_exists "$link" || return 1
  run_windows_junction test "$link" >/dev/null 2>&1
}

raw_link_target() {
  local link="$1"
  local windows_target

  if [[ -L "$link" ]]; then
    readlink "$link"
    return
  fi

  is_windows_layer || return 1
  path_entry_exists "$link" || return 1
  windows_target="$(run_windows_junction target "$link")" || return 1
  windows_target="${windows_target//$'\r'/}"
  posix_path "$windows_target"
}

remove_managed_link() {
  local link="$1"

  if [[ -L "$link" ]]; then
    rm "$link"
    return
  fi

  is_windows_layer || return 1
  run_windows_junction remove "$link" >/dev/null
}

create_managed_link() {
  local src="$1"
  local link="$2"

  if is_windows_layer; then
    run_windows_junction create "$link" "$src" >/dev/null
  else
    ln -s "$src" "$link"
  fi
}

managed_links_in_dir() {
  local dest_dir="$1"
  local entry
  local windows_entry

  [[ -d "$dest_dir" ]] || return 0
  if is_windows_layer; then
    while IFS= read -r windows_entry; do
      windows_entry="${windows_entry//$'\r'/}"
      [[ -n "$windows_entry" ]] || continue
      posix_path "$windows_entry"
    done < <(run_windows_junction list "$dest_dir")
    return 0
  fi

  while IFS= read -r entry; do
    is_managed_link "$entry" && printf '%s\n' "$entry"
  done < <(find "$dest_dir" -mindepth 1 -maxdepth 1 -print | sort)
}

resolved_link_target() {
  local link="$1"
  local target

  target="$(raw_link_target "$link")" || return 1
  resolved_target_from_raw "$link" "$target"
}

resolved_target_from_raw() {
  local link="$1"
  local target="$2"
  local parent

  if [[ "$target" = /* ]]; then
    [[ -d "$target" ]] || return 1
    (cd "$target" && pwd -P)
    return
  fi

  parent="$(dirname "$link")"
  [[ -d "$parent/$target" ]] || return 1
  (cd "$parent/$target" && pwd -P)
}

link_points_to() {
  local link="$1"
  local src="$2"
  local raw_target

  raw_target="$(raw_link_target "$link" 2>/dev/null)" || return 1
  target_points_to "$link" "$raw_target" "$src"
}

target_points_to() {
  local link="$1"
  local raw_target="$2"
  local src="$3"
  local resolved_target

  paths_are_same "$raw_target" "$src" && return 0

  resolved_target="$(resolved_target_from_raw "$link" "$raw_target" 2>/dev/null || true)"
  [[ -n "$resolved_target" ]] && paths_are_same "$resolved_target" "$src"
}

link_targets_under() {
  local link="$1"
  local candidate="$2"
  local raw_target
  local resolved_target

  raw_target="$(raw_link_target "$link" 2>/dev/null)" || return 1
  path_is_under "$raw_target" "$candidate" && return 0

  resolved_target="$(resolved_target_from_raw "$link" "$raw_target" 2>/dev/null || true)"
  [[ -n "$resolved_target" ]] && path_is_under "$resolved_target" "$candidate" && return 0
  return 1
}

link_one() {
  local src="$1"
  local dest_dir="$2"
  local name="$3"
  local create_parent="$4"
  local link="$dest_dir/$name"
  local host_root
  local raw_target

  host_root="$(host_root_for "$dest_dir")"
  if [[ "$create_parent" -eq 0 && ! -d "$host_root" ]]; then
    echo "· $host_root 不存在，跳过"
    return 0
  fi

  mkdir -p "$dest_dir"

  raw_target="$(raw_link_target "$link" 2>/dev/null || true)"
  if [[ -n "$raw_target" ]]; then
    if target_points_to "$link" "$raw_target" "$src"; then
      echo "✓ $link -> $raw_target"
      return 0
    fi
    echo "✗ $link 指向其他源 $raw_target，已保留"
    return 2
  fi

  if [[ -e "$link" ]]; then
    echo "✗ $link 是真实目录或文件，已保留"
    if is_windows_layer && [[ -d "$link" ]]; then
      echo "  可能是旧版 MSYS 生成的实体副本；请核对并手动移走后重试"
    fi
    return 2
  fi

  create_managed_link "$src" "$link"
  echo "✓ $link -> $src"
}

unlink_if_points_to() {
  local src="$1"
  local dest_dir="$2"
  local name="$3"
  local link="$dest_dir/$name"
  local raw_target

  raw_target="$(raw_link_target "$link" 2>/dev/null || true)"
  if [[ -n "$raw_target" ]]; then
    if target_points_to "$link" "$raw_target" "$src"; then
      remove_managed_link "$link"
      echo "✓ 已移除链接 $link"
    else
      echo "✗ $link 指向其他源，已保留"
      return 2
    fi
  elif [[ -e "$link" ]]; then
    echo "✗ $link 是真实目录或文件，已保留"
    return 2
  else
    echo "· $link 不存在，跳过"
  fi
}

remove_redundant_one() {
  local src="$1"
  local dest_dir="$2"
  local name="$3"
  local link="$dest_dir/$name"
  local raw_target

  [[ -e "$dest_dir" || -L "$dest_dir" ]] || return 0

  raw_target="$(raw_link_target "$link" 2>/dev/null || true)"
  if [[ -n "$raw_target" ]]; then
    if target_points_to "$link" "$raw_target" "$src"; then
      remove_managed_link "$link"
      echo "✓ 已清理冗余链接 $link"
    else
      echo "✗ $link 指向其他源，已保留"
      return 2
    fi
  elif [[ -e "$link" ]]; then
    echo "✗ $link 是真实目录或文件，已保留"
    return 2
  fi
}

remove_redundant_collection_links() {
  local candidate="$1"
  local dest_dir
  local link

  for dest_dir in "${REDUNDANT_TARGET_DIRS[@]}"; do
    [[ -d "$dest_dir" ]] || continue
    while IFS= read -r link; do
      if link_targets_under "$link" "$candidate"; then
        remove_managed_link "$link"
        echo "✓ 已清理冗余链接 $link"
      fi
    done < <(managed_links_in_dir "$dest_dir")
  done
}

remove_duplicate_aliases() {
  local candidate="$1"
  local dest_dir
  local link
  local target
  local canonical
  local canonical_name

  for dest_dir in "$SHARED_TARGET_DIR" "${NATIVE_TARGET_DIRS[@]}"; do
    [[ -d "$dest_dir" ]] || continue
    while IFS= read -r link; do
      link_targets_under "$link" "$candidate" || continue
      target="$(resolved_link_target "$link" 2>/dev/null || true)"
      [[ -n "$target" ]] || continue
      [[ -f "$target/SKILL.md" ]] || continue
      canonical_name="$(skill_name "$target")"
      canonical="$dest_dir/$canonical_name"
      if ! paths_are_same "$link" "$canonical" && link_points_to "$canonical" "$target"; then
        remove_managed_link "$link"
        echo "✓ 已清理重复别名 $link"
      fi
    done < <(managed_links_in_dir "$dest_dir")
  done
}

remove_stale_collection_artifacts() {
  local candidate="$1"
  local dest_dir
  local link
  local raw_target
  local grok_skill
  local source_file
  local grok_dir

  for dest_dir in "$SHARED_TARGET_DIR" "${NATIVE_TARGET_DIRS[@]}"; do
    [[ -d "$dest_dir" ]] || continue
    while IFS= read -r link; do
      raw_target="$(raw_link_target "$link")"
      if path_is_under "$raw_target" "$candidate" && [[ ! -f "$raw_target/SKILL.md" ]]; then
        remove_managed_link "$link"
        echo "✓ 已清理失效链接 $link"
      fi
    done < <(managed_links_in_dir "$dest_dir")
  done

  [[ -d "$INSTALL_HOME/.grok/skills" ]] || return 0
  while IFS= read -r grok_skill; do
    grep -q '^## Grok Bridge$' "$grok_skill" || continue
    source_file="$(grep -m 1 '^- Source of truth:' "$grok_skill" | sed 's/^- Source of truth: //')"
    case "$source_file" in
      "$candidate"/SKILL.md|"$candidate"/*/SKILL.md)
        if [[ ! -f "$source_file" ]]; then
          grok_dir="$(dirname "$grok_skill")"
          rm -rf "$grok_dir"
          echo "✓ 已清理失效 Grok bridge $grok_dir"
        fi
        ;;
    esac
  done < <(find "$INSTALL_HOME/.grok/skills" -mindepth 2 -maxdepth 2 -name SKILL.md -type f | sort)
}

status_one() {
  local src="$1"
  local dest_dir="$2"
  local name="$3"
  local label="$4"
  local link="$dest_dir/$name"
  local raw_target

  raw_target="$(raw_link_target "$link" 2>/dev/null || true)"
  if [[ -n "$raw_target" ]]; then
    if target_points_to "$link" "$raw_target" "$src"; then
      echo "✓ ${label}：$link -> $raw_target"
    else
      echo "✗ ${label}：$link 指向其他源 $raw_target"
      return 2
    fi
  elif [[ -e "$link" ]]; then
    echo "✗ ${label}：$link 存在，但不是受管链接"
    return 2
  else
    echo "· ${label}：$link 未桥接"
  fi
}

status_redundant_one() {
  local src="$1"
  local dest_dir="$2"
  local name="$3"
  local link="$dest_dir/$name"
  local raw_target

  raw_target="$(raw_link_target "$link" 2>/dev/null || true)"
  if [[ -n "$raw_target" ]]; then
    if target_points_to "$link" "$raw_target" "$src"; then
      echo "✗ 发现冗余入口：$link -> $raw_target"
    else
      echo "✗ 公共兼容客户端存在同名其他来源：$link -> $raw_target"
    fi
    return 2
  fi

  if [[ -e "$link" ]]; then
    echo "✗ 公共兼容客户端存在同名真实目录或文件：$link"
    return 2
  fi
  return 0
}

link_grok_one() {
  local src="$1"
  local name="$2"
  local grok_home="$INSTALL_HOME/.grok"
  local dir="$grok_home/skills/$name"
  local skill_file="$dir/SKILL.md"
  local existing_source

  if [[ ! -d "$grok_home" ]]; then
    echo "· $grok_home 不存在，跳过"
    return 0
  fi

  if is_managed_link "$dir"; then
    remove_managed_link "$dir"
  elif [[ -e "$dir" && ! -d "$dir" ]]; then
    echo "✗ $dir 是真实文件，已保留"
    return 2
  elif [[ -d "$dir" && -f "$skill_file" ]] && ! grep -q '^## Grok Bridge$' "$skill_file"; then
    echo "✗ $dir 是真实 Grok Skill，已保留"
    return 2
  elif [[ -d "$dir" && ! -f "$skill_file" ]]; then
    echo "✗ $dir 是真实目录，已保留"
    return 2
  elif [[ -f "$skill_file" ]]; then
    existing_source="$(grok_bridge_source "$skill_file")"
    if [[ "$existing_source" != "$src/SKILL.md" && -f "$existing_source" ]]; then
      echo "✗ $dir 是指向其他真源的 Grok 适配层（$existing_source），已保留"
      return 2
    fi
  fi

  mkdir -p "$dir"
  cat > "$skill_file" <<EOF
---
name: $name
user_invocable: true
description: |
  $name bridge。在 Grok TUI 中可通过 /$name 触发；触发后必须先读取项目真源 SKILL.md。
---
# $name

## Grok Bridge

- Source of truth: $src/SKILL.md
- Read the source-of-truth file before executing this skill.
- Follow the source file's workflow, constraints, examples, and output format.
- Treat this file as a thin Grok bridge only; do not maintain long-form logic here.

## 使用说明

1. 在 Grok TUI 中输入 \`/$name\` 即可触发。
2. Grok 会优先使用本 bridge 指向的真源。
3. 如需更新，直接修改真源。
EOF
  echo "✓ $dir -> $src"
}

grok_bridge_source() {
  grep -m 1 '^- Source of truth:' "$1" | sed 's/^- Source of truth: //'
}

unlink_grok_one() {
  local src="$1"
  local name="$2"
  local grok_home="$INSTALL_HOME/.grok"
  local dir="$grok_home/skills/$name"
  local skill_file="$dir/SKILL.md"

  if [[ ! -d "$grok_home" ]]; then
    echo "· $grok_home 不存在，跳过"
    return 0
  fi

  if is_managed_link "$dir"; then
    remove_managed_link "$dir"
    echo "✓ 已移除链接 $dir"
  elif [[ -d "$dir" && -f "$skill_file" ]] && grep -q '^## Grok Bridge$' "$skill_file"; then
    if [[ "$(grok_bridge_source "$skill_file")" != "$src/SKILL.md" ]]; then
      echo "✗ $dir 指向其他真源（$(grok_bridge_source "$skill_file")），已保留"
      return 2
    fi
    rm -rf "$dir"
    echo "✓ 已移除 Grok bridge $dir"
  elif [[ -e "$dir" ]]; then
    echo "✗ $dir 是真实目录或文件，已保留"
    return 2
  else
    echo "· $dir 不存在，跳过"
  fi
}

status_grok_one() {
  local name="$1"
  local grok_home="$INSTALL_HOME/.grok"
  local dir="$grok_home/skills/$name"
  local skill_file="$dir/SKILL.md"
  local source

  if [[ ! -d "$grok_home" ]]; then
    echo "· Grok：$grok_home 不存在"
    return 0
  fi

  if [[ -d "$dir" && -f "$skill_file" ]] && grep -q '^## Grok Bridge$' "$skill_file"; then
    source="$(grep -m 1 '^- Source of truth:' "$skill_file" | sed 's/^- Source of truth: //')"
    if grep -q '^user_invocable: true$' "$skill_file"; then
      echo "✓ Grok：$dir -> $source"
    else
      echo "✗ Grok：$dir 缺少 user_invocable: true"
      return 2
    fi
  elif [[ -e "$dir" ]]; then
    echo "✗ Grok：$dir 存在，但并非 dbs-install-skill 生成的适配层"
    return 2
  else
    echo "· Grok：$dir 未桥接"
  fi
}

main() {
  if [[ $# -ne 2 ]]; then
    usage
    exit 1
  fi

  local action="$1"
  local input="$2"
  local root
  local candidate
  local src
  local name
  local target_dir
  local failed=0

  case "$action" in
    link|unlink|status) ;;
    *) usage; exit 1 ;;
  esac

  root="$(repo_root)"
  candidate="$(resolve_candidate "$input" "$root")"

  if [[ "$action" == "link" || "$action" == "status" ]]; then
    validate_interface_gate "$candidate"
  fi

  while IFS= read -r src; do
    name="$(skill_name "$src")"
    echo "== $name =="

    case "$action" in
      link)
        link_one "$src" "$SHARED_TARGET_DIR" "$name" 1 || failed=1
        for target_dir in "${NATIVE_TARGET_DIRS[@]}"; do
          link_one "$src" "$target_dir" "$name" 0 || failed=1
        done
        for target_dir in "${REDUNDANT_TARGET_DIRS[@]}"; do
          remove_redundant_one "$src" "$target_dir" "$name" || failed=1
        done
        link_grok_one "$src" "$name" || failed=1
        ;;
      unlink)
        unlink_if_points_to "$src" "$SHARED_TARGET_DIR" "$name" || failed=1
        for target_dir in "${NATIVE_TARGET_DIRS[@]}" "${REDUNDANT_TARGET_DIRS[@]}"; do
          unlink_if_points_to "$src" "$target_dir" "$name" || failed=1
        done
        unlink_grok_one "$src" "$name" || failed=1
        ;;
      status)
        status_one "$src" "$SHARED_TARGET_DIR" "$name" "公共入口" || failed=1
        for target_dir in "${NATIVE_TARGET_DIRS[@]}"; do
          if [[ -d "$(host_root_for "$target_dir")" ]]; then
            status_one "$src" "$target_dir" "$name" "专属入口" || failed=1
          fi
        done
        for target_dir in "${REDUNDANT_TARGET_DIRS[@]}"; do
          status_redundant_one "$src" "$target_dir" "$name" || failed=1
        done
        status_grok_one "$name" || failed=1
        ;;
    esac
  done < <(list_skill_sources "$candidate")

  if [[ "$action" == "link" ]]; then
    remove_redundant_collection_links "$candidate"
    remove_duplicate_aliases "$candidate"
    remove_stale_collection_artifacts "$candidate"
  fi

  if [[ "$action" == "status" && "$failed" -eq 0 ]]; then
    echo "✓ 未发现冗余入口"
  fi

  exit "$failed"
}

main "$@"
