---
name: dbs-suite
description: |
  dontbesilent/dbskill DBS 工具箱的统一入口和路由器。适用于用户调用任何 /dbs 命令，或提出 DBS 风格的商业诊断、内容诊断、内容结构化、AI 写作检测、概念拆解、目标澄清、执行/拖延诊断、对标分析、慢就是快策略、决策系统、好问题说明书、交互式学习、短视频 hook、共鸣/传播心理分析、小红书标题、微信公众号 HTML 排版、诊断存档/接续/报告、Agent 工作台迁移、专家聊天室模拟等任务。这个单一技能通过 references/original/ 下的原始模块保留所有 dbs-* 子技能效果。
---

# dbs-suite

把这个技能作为 dontbesilent DBS 工具箱的唯一入口。

不要凭记忆重写子技能。先判断应该使用哪个原始模块，再完整读取该模块的 `instructions.md`，并把它当作权威流程执行。

## 核心流程

1. 根据用户的显式命令、关键词或真实意图，判断应该使用哪个 DBS 模块。
2. 先且只先读取一个最相关的原始模块：
   `references/original/<module>/instructions.md`
3. 如果被选中的模块提到 `docs/`、`tools/`、`templates/`、`scaffold/` 等本地文件，把路径解析到该模块目录下：
   `references/original/<module>/`
4. 按被选中模块的说明执行，就像用户直接触发了那个原始 `dbs-*` 技能。
5. 如果任务明确跨多个模块，按顺序加载相关模块，不要一次性读取全部模块。
6. 如果路由不清楚，先读取 `references/original/dbs/instructions.md`，用它做工具箱导航。

## 精确命令路由

如果用户使用这些命令，直接路由到对应模块：

| 用户命令 | 读取模块 |
|---|---|
| `/dbs`, `/商业` | `references/original/dbs/instructions.md` |
| `/dbs-diagnosis`, `/问诊` | `references/original/dbs-diagnosis/instructions.md` |
| `/dbs-goal`, `/目标` | `references/original/dbs-goal/instructions.md` |
| `/dbs-action`, `/action` | `references/original/dbs-action/instructions.md` |
| `/dbs-deconstruct`, `/拆概念` | `references/original/dbs-deconstruct/instructions.md` |
| `/dbs-benchmark`, `/对标` | `references/original/dbs-benchmark/instructions.md` |
| `/dbs-slowisfast`, `/慢就是快` | `references/original/dbs-slowisfast/instructions.md` |
| `/dbs-decision`, `/决策系统`, `/决策立案`, `/结果回填`, `/状态画像` | `references/original/dbs-decision/instructions.md` |
| `/dbs-good-question`, `/好问题`, `/问题说明书`, `/Agent可解性` | `references/original/dbs-good-question/instructions.md` |
| `/dbs-learning`, `/dbs-learn`, `/交互式学习` | `references/original/dbs-learning/instructions.md` |
| `/dbs-content`, `/内容诊断` | `references/original/dbs-content/instructions.md` |
| `/dbs-content-system`, `/内容结构化系统` | `references/original/dbs-content-system/instructions.md` |
| `/dbs-ai-check`, `/AI检测` | `references/original/dbs-ai-check/instructions.md` |
| `/dbs-resonate` | `references/original/dbs-resonate/instructions.md` |
| `/dbs-spread`, `/传播心理解码` | `references/original/dbs-spread/instructions.md` |
| `/dbs-hook`, `/hook` | `references/original/dbs-hook/instructions.md` |
| `/dbs-xhs-title`, `/小红书标题` | `references/original/dbs-xhs-title/instructions.md` |
| `/dbs-wechat-html`, `/公众号HTML` | `references/original/dbs-wechat-html/instructions.md` |
| `/dbs-save`, `/存档` | `references/original/dbs-save/instructions.md` |
| `/dbs-restore`, `/续上` | `references/original/dbs-restore/instructions.md` |
| `/dbs-report`, `/出报告` | `references/original/dbs-report/instructions.md` |
| `/dbs-agent-migration`, `/agent迁移` | `references/original/dbs-agent-migration/instructions.md` |
| `/dbs-chatroom`, `/定向聊天室` | `references/original/dbs-chatroom/instructions.md` |
| `/dbs-chatroom-austrian`, `/chatroom-austrian`, `/奥派` | `references/original/dbs-chatroom-austrian/instructions.md` |

## 意图路由

如果用户没有使用显式命令，按真实需求路由：

| 用户意图 | 读取模块 |
|---|---|
| 商业模式、产品、报价、客户、定位、变现、战略诊断 | `references/original/dbs-diagnosis/instructions.md` |
| “下一步怎么走”、DBS 工具箱导航、诊断后的下一步 | `references/original/dbs/instructions.md` |
| 模糊目标、个人 IP 目标、“我想成为……”“我想变得……” | `references/original/dbs-goal/instructions.md` |
| 拖延、逃避、“知道该做什么但就是不做” | `references/original/dbs-action/instructions.md` |
| 模糊概念、词义不清、分类混乱、商业概念拆到原子级 | `references/original/dbs-deconstruct/instructions.md` |
| 找对标、找模仿对象、竞品/榜样分析、“我该学谁” | `references/original/dbs-benchmark/instructions.md` |
| 速度太快、长期资产、摩擦、看起来慢但更稳的方法 | `references/original/dbs-slowisfast/instructions.md` |
| 长期个人/业务决策系统、状态快照、结果回填 | `references/original/dbs-decision/instructions.md` |
| 把模糊问题改成 Agent 可推理、可批评、可验证的问题说明书 | `references/original/dbs-good-question/instructions.md` |
| 围绕一个课题做连续、可根据反馈调整的交互式学习 | `references/original/dbs-learning/instructions.md` |
| 诊断一个选题或文稿怎样做成好内容 | `references/original/dbs-content/instructions.md` |
| 把大量本地文稿、素材、案例做成可复用内容资产系统 | `references/original/dbs-content-system/instructions.md` |
| 检测 AI 写作痕迹，默认只诊断不改写 | `references/original/dbs-ai-check/instructions.md` |
| 判断文稿是否有共鸣、能不能发、完播率/流量风险在哪里 | `references/original/dbs-resonate/instructions.md` |
| 解码内容为什么能火、打中了什么受众情绪 | `references/original/dbs-spread/instructions.md` |
| 优化短视频开头、hook、前三秒表达 | `references/original/dbs-hook/instructions.md` |
| 生成或诊断小红书/RED 标题 | `references/original/dbs-xhs-title/instructions.md` |
| 把 Markdown 转成微信公众号后台可粘贴 HTML | `references/original/dbs-wechat-html/instructions.md` |
| 把当前诊断状态保存到本地 | `references/original/dbs-save/instructions.md` |
| 从上次保存的诊断状态继续 | `references/original/dbs-restore/instructions.md` |
| 把多次保存的诊断状态整理成交付报告 | `references/original/dbs-report/instructions.md` |
| 清理或迁移 Claude Code / Codex / Grok Agent 工作台和 bridge | `references/original/dbs-agent-migration/instructions.md` |
| 模拟多专家聊天室讨论 | `references/original/dbs-chatroom/instructions.md` |
| 模拟哈耶克 × 米塞斯 × Claude 的奥派经济学聊天室 | `references/original/dbs-chatroom-austrian/instructions.md` |

## 多模块组合

遇到天然跨模块的任务，按这些常见顺序加载，不要一次性加载全部：

- 模糊问题 → 问题说明书 → 商业诊断：
  1. `dbs-good-question`
  2. `dbs-diagnosis`
- 模糊目标 → 执行力阻塞：
  1. `dbs-goal`
  2. `dbs-action`
- 文稿/内容审阅 → 共鸣诊断 → 标题：
  1. `dbs-content`
  2. `dbs-resonate`
  3. `dbs-xhs-title`
- 爆款/传播心理分析：
  1. `dbs-spread`
  2. `dbs-chatroom`
- 长诊断流程：
  1. 先用对应诊断模块
  2. 再用 `dbs-save`
  3. 下次用 `dbs-restore`
  4. 最后用 `dbs-report`
- 本地内容资产工程：
  1. `dbs-content-system`
  2. 再按输出需求使用 `dbs-content`、`dbs-xhs-title` 或 `dbs-wechat-html`
- Agent 工作台整理：
  1. `dbs-agent-migration`
  2. 只有用户同时要求业务/内容诊断时，才加载其他模块。

## 加载纪律

- 不要一次性读取所有原始 DBS 模块。
- 不要在读取模块前自行总结或重写模块流程。
- 显式命令优先于模糊意图判断。
- 模块规定了固定输出格式时，必须保留。
- 模块写明“默认只诊断”时，除非用户要求，不要直接改写。
- 模块涉及创建或编辑本地文件时，必须保护用户数据；有破坏性风险时先确认。

## 归档说明

原来的独立 `dbs-*` 技能可以移出 `~/.codex/skills`，减少技能列表噪音。这个聚合技能的权威副本在 `references/original/` 下。
