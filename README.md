# dbskill

dontbesilent 商业诊断工具箱。基于 12,307 条推文提炼的方法论，用 Claude Code skill 实现。

## 工具箱

| Skill | 触发方式 | 做什么 |
|---|---|---|
| `/dbs` | `/dbs`、`帮我看看` | 主入口，自动路由到对的工具 |
| `/dbs-diagnosis` | `/dbs-诊断`、`我有个商业问题` | 商业模式诊断。消解问题，不回答问题 |
| `/dbs-benchmark` | `/dbs-对标`、`我该模仿谁` | 对标分析。五重过滤，排除噪音 |
| `/dbs-content` | `/dbs-content`、`这个内容怎么做` | 内容创作诊断。五维检测 |
| `/dbs-unblock` | `/dbs-自检`、`我总是拖延` | 执行力诊断。阿德勒框架 |
| `/dbs-deconstruct` | `/dbs-拆概念`、`这个词什么意思` | 概念拆解。维特根斯坦式审查 |

## 工作流

```
diagnosis（商业模式对不对）
    ↓
benchmark（找谁模仿）
    ↓
content（内容怎么做）
    ↓
unblock（做不动怎么办）

deconstruct（随时拆概念）
```

## 安装

```bash
# 安装 / 更新（同一条命令）
cd ~/.claude/skills && git clone https://github.com/dontbesilent2025/dbskill.git /tmp/dbskill && cp -r /tmp/dbskill/dbs* . && rm -rf /tmp/dbskill
```

## 使用方式

1. 在 Claude Code 中用 `/dbs` 启动，或直接调用具体 skill
2. 首次使用会自动路由到最合适的诊断工具

## 原理

每个 SKILL.md 里已经包含了完整的方法论框架、诊断流程和说话风格定义，开箱即用。

这些框架从 12,307 条推文中提炼而来，覆盖商业本体论、IP 与内容、思维与哲学、实操运营、AI 与工具、心理与执行等方向。

## 作者

[dontbesilent](https://x.com/dontbesilent)
