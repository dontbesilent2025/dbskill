---
name: dbs-suite
description: |
  dontbesilent/dbskill DBS 工具箱的统一入口和路由器。适用于用户调用任何 /dbs 命令，或提出 DBS 风格的商业诊断、内容诊断、内容结构化、AI 写作检测、概念拆解、目标澄清、执行/拖延诊断、对标分析、慢就是快策略、决策系统、好问题说明书、交互式学习、短视频 hook、共鸣/传播心理分析、小红书标题、微信公众号 HTML 排版、诊断存档/接续/报告、Agent 工作台迁移、专家聊天室模拟等任务。这个单一技能通过 references/original/ 下的原始模块保留所有 dbs-* 子技能效果。
---

# dbs-suite

把这个技能作为 dontbesilent DBS 工具箱的唯一入口。

不要在这里维护一套独立的意图路由表。项目本身已经有 `/dbs` 导航中枢，它才是任务前路由和任务后导航的权威规则。

## 核心流程

1. 如果用户明确调用 `/dbs-*` 具体模块命令，说明用户已经完成路由，直接读取对应模块：
   `references/original/<module>/instructions.md`
2. 如果用户调用 `/dbs`、`/商业`，或只是提出 DBS 风格任务但没有明确点名具体模块，先读取：
   `references/original/dbs/instructions.md`
3. 按 `/dbs` 中枢的模式 A / 模式 B 判断：
   - 模式 A：任务前路由。用 `/dbs` 的路由表判断应该进入哪个模块。
   - 模式 B：任务后导航。用 `/dbs` 的导航地图给出 2-3 个下一步方向；用户确认后再进入对应模块。
4. `/dbs` 中枢选出目标命令后，把命令映射到同名模块目录，再完整读取该模块的 `instructions.md`。
   例如 `/dbs-content` → `references/original/dbs-content/instructions.md`。
5. 如果被选中的模块提到 `docs/`、`tools/`、`templates/`、`scaffold/` 等本地文件，把路径解析到该模块目录下：
   `references/original/<module>/`
6. 按被选中模块的说明执行，就像用户直接触发了那个原始 `dbs-*` 技能。
7. 如果任务明确跨多个模块，先用 `/dbs` 中枢判断当前最该进入的第一个模块；完成后再回到 `/dbs` 做下一步导航，不要一次性读取全部模块。

## 具体模块命令

这些命令表示用户已经选定具体模块，可以直接读取同名模块目录：

| 用户命令 | 模块目录 |
|---|---|
| `/dbs-diagnosis` | `dbs-diagnosis` |
| `/dbs-goal` | `dbs-goal` |
| `/dbs-action` | `dbs-action` |
| `/dbs-deconstruct` | `dbs-deconstruct` |
| `/dbs-benchmark` | `dbs-benchmark` |
| `/dbs-slowisfast` | `dbs-slowisfast` |
| `/dbs-decision` | `dbs-decision` |
| `/dbs-good-question` | `dbs-good-question` |
| `/dbs-learning`, `/dbs-learn` | `dbs-learning` |
| `/dbs-content` | `dbs-content` |
| `/dbs-content-system` | `dbs-content-system` |
| `/dbs-ai-check` | `dbs-ai-check` |
| `/dbs-resonate` | `dbs-resonate` |
| `/dbs-spread` | `dbs-spread` |
| `/dbs-hook` | `dbs-hook` |
| `/dbs-xhs-title` | `dbs-xhs-title` |
| `/dbs-wechat-html` | `dbs-wechat-html` |
| `/dbs-save` | `dbs-save` |
| `/dbs-restore` | `dbs-restore` |
| `/dbs-report` | `dbs-report` |
| `/dbs-agent-migration` | `dbs-agent-migration` |
| `/dbs-chatroom` | `dbs-chatroom` |
| `/dbs-chatroom-austrian`, `/chatroom-austrian` | `dbs-chatroom-austrian` |

中文别名、模糊意图、多模块下一步推荐，都不要在这里单独判断；交给 `references/original/dbs/instructions.md`。

## 加载纪律

- 不要一次性读取所有原始 DBS 模块。
- 不要在读取 `/dbs` 中枢前自行判断模糊意图。
- 不要把 `/dbs` 中枢的路由表复制到本文件里；更新路线应以 `references/original/dbs/instructions.md` 为准。
- 显式具体模块命令优先于 `/dbs` 中枢判断。
- 模块规定了固定输出格式时，必须保留。
- 模块写明“默认只诊断”时，除非用户要求，不要直接改写。
- 模块涉及创建或编辑本地文件时，必须保护用户数据；有破坏性风险时先确认。

## 归档说明

原来的独立 `dbs-*` 技能可以移出 `~/.codex/skills`，减少技能列表噪音。这个聚合技能的权威副本在 `references/original/` 下。
