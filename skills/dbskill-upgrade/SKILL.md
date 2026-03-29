---
name: dbskill-upgrade
description: |
  升级 dontbesilent dbskill 到最新版本并汇总变化。用于用户明确要求检查、比较、更新、重装或修复 dbskill 时，尤其适用于 Codex + Windows + PowerShell 环境，以及技能安装在 `.agents/skills`、`$CODEX_HOME/skills` 或 `~/.codex/skills` 的情况。
---

# dbskill-upgrade

在 Codex 环境中安全升级 dbskill，并显示更新内容。

## 适配范围

- 优先支持 Windows + PowerShell
- 支持 `%USERPROFILE%\\.agents\\skills`
- 支持 `$CODEX_HOME/skills`
- 支持 `%USERPROFILE%\\.codex\\skills`
- 不假设存在 `~/.claude/skills`
- 不假设本地一定有 `VERSION` 或 `README.md`

## 官方目录清单

只把以下目录视为官方 dbskill：

- `chatroom-austrian`
- `dbs`
- `dbs-action`
- `dbs-benchmark`
- `dbs-content`
- `dbs-deconstruct`
- `dbs-diagnosis`
- `dbs-hook`
- `dbskill-upgrade`

不要覆盖 `find-skills` 或任何其他无关 skill，除非用户明确要求。

## 升级流程

### Step 1：定位当前安装目录

按下面顺序找安装目录：

1. 当前 `dbskill-upgrade` 所在父目录是否同时包含 `dbs`
2. `%USERPROFILE%\\.agents\\skills`
3. `$CODEX_HOME/skills`（如果 `CODEX_HOME` 已设置）
4. `%USERPROFILE%\\.codex\\skills`

命中规则：

- 候选目录必须至少包含 `dbs\\SKILL.md`
- 如果找到多个候选目录，先向用户说明，再选择正在生效的那个
- 如果一个都找不到，就停止并说明没有检测到已安装的 dbskill

### Step 2：读取本地版本信息（可选）

- 如果安装目录附近存在 `VERSION` 文件，读取它
- 如果没有，就告诉用户「当前版本未知」
- 不要因为缺少版本文件而中止升级

### Step 3：准备上游源

优先级：

1. 用户明确提供的 zip 或本地目录
2. 官方仓库：`https://github.com/dontbesilent2025/dbskill`

准备上游源时要做的检查：

- 上游源里必须有 `skills/dbs/SKILL.md`
- 如果仓库根目录有 `VERSION`，读取远程版本
- 如果没有版本文件，就把版本标记为「未知」，改用变更摘要代替版本对比
- 如果用户只是要求“检查有没有更新”，做到只读比较就停，不要写盘

### Step 4：备份当前安装

- 在安装目录下创建时间戳备份目录，例如 `.dbskill-backup-YYYYMMDD-HHMMSS`
- 只备份官方目录清单里实际存在的目录
- 记录完整备份路径
- 如果一个官方目录都没找到，就不要创建空备份

### Step 5：执行替换

Windows 下优先用 PowerShell 原生命令。

替换规则：

- 逐个验证目标目录路径，确保都在选定的安装目录内
- 逐个删除和复制，不要用宽泛通配符一把删整个 skills 目录
- 只处理官方目录清单里的目录
- 覆盖完成后，确认每个已更新目录都存在 `SKILL.md`

### Step 6：失败恢复

如果任一步失败：

- 停止继续写盘
- 用备份逐个恢复已经改动过的目录
- 明确告诉用户失败点、恢复结果、以及还需要什么人工处理

### Step 7：整理更新摘要

优先级：

1. 如果官方仓库有 `README.md` 或发布说明，就基于这些内容总结变化
2. 如果没有，就基于新旧目录差异总结变化
3. 如果拿不到说明，就诚实告诉用户只能确认目录已更新，无法给出完整变更日志

建议输出格式：

```text
dbskill 升级完成
- 安装目录：{INSTALL_DIR}
- 备份目录：{BACKUP_DIR 或 未创建}
- 本地版本：{OLD_VERSION 或 未知}
- 上游版本：{REMOTE_VERSION 或 未知}
- 已更新目录：{目录列表}
- 变化摘要：
  - {要点 1}
  - {要点 2}
```

## 安全规则

- 不要假设用户在用 Claude Code
- 不要把 `.agents/skills`、`.codex/skills` 以外的目录当成安装目录
- 不要删除无关 skill
- 不要因为缺少版本文件就拒绝升级
- 如果写入目录超出当前工作区，先申请用户授权
- 如果需要联网下载而当前环境受限，先申请用户授权
