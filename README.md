# dbskill

dontbesilent 商业诊断工具箱。从 12,307 条推文中提炼方法论，做成一组可组合使用的 Agent skill。

可在 Claude Code、Codex、Cursor、Trae Solo 等任意支持 skill / system prompt 的 Agent 上使用。

**最新更新：v2.17.0**

**v2.17.0 更新**：统一 Agent 宿主 skill 根目录模型。`/dbs-bridge` 现在会同时处理 Claude Code（`~/.claude/skills`）、Codex（`~/.codex/skills`）、通用 Agents（`~/.agents/skills`，豆包 Mac App / Trae Solo / Codex 可读取）和 Grok（`~/.grok/skills`）；其中 Grok 会生成带 `user_invocable: true` 的薄 bridge。`/dbs-agent-migration` 和 `/dbs` 主入口也同步纳入 `~/.agents/skills` 与 Grok 的多端统一语境。

**v2.16.0 更新**：新增 `/dbs-script-flow`——短视频逐字稿逻辑延续检查。三个维度扫描：段落间逻辑衔接、段落内信息密度、句子口播流畅度，找出「观众会在哪一秒划走」的风险点。诊断完默认主动问是否做标记式改稿（保留原文，用删除线和 🆕 标出改动）。

**v2.15.1 更新**：新增 `/dbs-wechat-html`——把 Markdown 转成可粘贴到微信公众号后台的 HTML，内置 15 种经典媒体/科技产品/中文公众号风格，支持推荐单风格、6 个预览、全量 15 个三种生成模式。

**v2.15.0 更新**：集中导航逻辑。把 `/dbs` 升级为双模式路由器——任务前帮你找对工具，任务后读诊断结论推荐 2-3 个下一步。同时清理了 22 个 skill 末尾原来各自分散的"下一步建议"表，统一指向 `/dbs`，不知道下一步就回 `/dbs`。

**v2.14.3 更新**：新增两个内容传播工具。`/dbs-spread` 传播心理解码——用 5 个经典传播学理论分析已有内容为什么能引起共鸣，输出受众情绪底层和聊天室讨论方向。`/dbs-resonate` 文稿共鸣诊断——写完文稿但心里没底时用，专门识别「写得全面但没刺中核心」的问题，给出具体删改建议。

**v2.14.2 更新**：优化 `/dbs-chatroom` 的推荐人物规则。推荐专家时不再靠固定名单或泛名人直觉，改为先判断话题缺什么视角，再选择真正能推进讨论的人；同时明确排除泛财经、泛商业、靠表达和传播出名但判断密度偏弱的人。

**v2.14.1 更新**：修复 `/dbs-content-system` 发布包缺少 `scaffold/root/AGENTS.md`、`CLAUDE.md`、`SOURCE_OF_TRUTH.md` 的问题。`v2.14.0` 新增了正式版内容结构化系统，本版本补齐初始化脚本依赖的根级脚手架文件。

近期几次更新集中在 5 个方向：
- 内容工程：新增内容结构化系统，支持把大量本地素材搭成可继续生长的内容资产工程
- Agent 工作台迁移：支持 Grok Build 和 `~/.agents/skills`，统一多端迁移语境
- 决策系统：从业务决策记录扩展成通用个人决策系统
- 学习与提问：新增 `dbs-learning`、`dbs-good-question`
- 状态管理：补齐 `dbs-save`、`dbs-restore`、`dbs-report`

更完整的历史变更，见 [GitHub Releases](https://github.com/dontbesilent2025/dbskill/releases)。

**作者**：[X](https://x.com/dontbesilent) · [小红书](https://xhslink.com/m/637xuspR4iI) · [抖音](https://v.douyin.com/pRUDhpBqOrc/)

**所有内容开放，可以整套装，也可以只拿一部分。知识包、原子库、单个公理，都能单独用。**

---

## 如何安装 dbskill

![demo](demo.gif)

#### Claude Code

推荐用下面这一条命令装全部 21 个 skill：

```bash
npx -y skills add dontbesilent2025/dbskill -g --all
```

装完在 Claude Code 里 `/reload-plugins`，`/dbs`、`/dbs-content`、`/dbs-hook` 等就都能用了。

> ⚠️ 如果你用的是插件市场方式：
>
> ```bash
> claude plugin marketplace add dontbesilent2025/dbskill
> claude plugin install dbs@dontbesilent-skills
> ```
>
> 注意 `dbs`、`dbs-content`、`dbs-diagnosis` …在本市场里是 **21 个相互独立的 plugin**，`dbs` 这个 plugin 只包含主入口路由（`/dbs`）。所以只跑上面两行，你只会装到路由器，`/dbs-content` 等会提示 `Unknown skill`。要装全套，请用上面的 `npx … --all`；或按需逐个 `claude plugin install <名字>@dontbesilent-skills`（如 `dbs-content@dontbesilent-skills`）。

#### 通用安装方式（适用于 Codex / Claude Code）

```bash
npx -y skills add dontbesilent2025/dbskill -g --all
```

#### Trae Solo

Trae Solo 一个 zip 装一个 skill。从 [GitHub Releases](https://github.com/dontbesilent2025/dbskill/releases) 下载最新的 `dbskill-版本号.zip`，解压后里面是当前正式发布的独立 skill zip（每个 zip 解压后根级是 `SKILL.md`），逐个拖进 Trae Solo 的「上传技能」窗口即可。

如果想本地构建，运行 `bash tools/build-skills.sh`，产物在 `dist/skills/`。脚本会自动跳过名字里带 `beta` 的本地试验版 skill。

## 付费答疑群

如果你想加入我的付费答疑群，可以扫码查看：

![付费答疑群二维码](docs/paid-qa-group-qrcode.png)

也可以直接打开这个链接：
[https://mp.weixin.qq.com/s/V7Dr0-75VYZOLJ6lbT_s0w](https://mp.weixin.qq.com/s/V7Dr0-75VYZOLJ6lbT_s0w)

## 如何更新 dbskill

#### Claude Code 插件市场安装的用户

```bash
claude plugin marketplace update dontbesilent-skills
claude plugin update dbs@dontbesilent-skills
/reload-plugins
```

#### 通过 `npx skills add` 安装的用户

重新运行一次同样的命令即可。安装和更新用的是同一条命令，不需要换成别的写法。

```bash
npx -y skills add dontbesilent2025/dbskill -g --all
```

---

## 工具箱

### dbs 诊断工具

| Skill | 做什么 |
|---|---|
| `/dbs` | 主入口 + 导航中枢。任务前路由到对的工具；走完任何 skill 后输入 `/dbs`，它读诊断结论推荐 2-3 个下一步 |
| `/dbs-diagnosis` | 商业模式诊断。消解问题，不回答问题 |
| `/dbs-benchmark` | 对标分析。五重过滤，排除噪音 |
| `/dbs-content` | 内容创作诊断。五维检测 |
| `/dbs-content-system` | 内容结构化系统。把本地大量内容资产搭成一个可持续生长的内容工程 |
| `/dbs-hook` | 短视频开头优化。诊断 + 生成方案 |
| `/dbs-xhs-title` | 小红书标题公式。75 个爆款公式匹配 |
| `/dbs-ai-check` | AI 写作特征识别。22 条特征扫描，只诊断不改 |
| `/dbs-wechat-html` | 微信公众号 HTML 生成。15 种经典媒体/科技产品/中文公众号风格，支持推荐、预览和全量生成 |
| `/dbs-slowisfast` | 慢就是快。摩擦建造资产，找到值得慢做的环节 |
| `/dbs-action` | 执行力诊断。阿德勒框架（原 dbs-unblock） |
| `/dbs-deconstruct` | 概念拆解。维特根斯坦式审查 |
| `/dbs-goal` | 目标清晰化。把模糊目标审计成可检查的交付物 |
| `/dbs-good-question` | 好问题生成器。把模糊问题改成 Agent 可推理、可批评、可验证的问题说明书 |
| `/dbs-decision` | 个人决策系统。把任何长期跟踪的领域做成本地知识工程，四层结构 + 来源标签 + 隐私模式 |

### 内容传播工具

| Skill | 做什么 |
|---|---|
| `/dbs-spread` | 传播心理解码。用 5 个经典传播学理论分析已有内容为什么能引起共鸣，输出受众情绪底层和聊天室讨论方向 |
| `/dbs-resonate` | 文稿共鸣诊断。写完文稿但心里没底时用，专门识别「写得全面但没刺中核心」的问题，给出具体删改建议 |
| `/dbs-script-flow` | 逻辑延续检查。三维扫描逐字稿（段落衔接 / 信息密度 / 口播流畅度），找出「观众会在哪一秒划走」的风险点，支持标记式改稿 |

### 学习工具

| Skill | 做什么 |
|---|---|
| `/dbs-learning` 或 `/dbs-learn` | 交互式学习。把课题拆成连续文章，根据上一篇反馈生成下一篇 |

### 状态管理三件套

| Skill          | 做什么                                          |
| -------------- | -------------------------------------------- |
| `/dbs-save`    | 把当前诊断的关键结论、否决方向、推荐下一步存到本地。每次新增不覆盖            |
| `/dbs-restore` | 拉出上次的存档，下次开新对话也能接着诊断              |
| `/dbs-report`  | 把多次存档合并成一份带时间索引的 markdown 报告。可分享、可归档 |

> **几个关键词**
> - **存档**：`/dbs-save` 写到本地的一份诊断状态文件。每次 save 都新增一份，不会覆盖。一个项目下可以攒很多份存档，记录诊断从开始到收尾的全过程。
> - **项目**：用来分隔不同生意的诊断。默认按你当前的目录名隔离——给小红书做的诊断和给线下课做的诊断不会混在一起。
> - **接着上次**：你今天关掉 Claude Code，明天重开。只要还在同一个项目目录里 `/dbs-restore`，就会自动把上次的存档拉回来。

诊断的存档默认放在 `~/.dbs/sessions/{项目名}/`，报告放在 `~/.dbs/reports/{项目名}/`。

### 决策系统

| Skill | 做什么 |
|---|---|
| `/dbs-decision` | 个人决策系统主入口。自动判断是更新状态、立案、回填还是出快照 |
| `/决策立案` | 强制进入立案模式（建决策事件文件） |
| `/结果回填` | 强制进入回填模式（事件结果落盘） |
| `/状态画像` | 生成阶段快照 |

决策项目默认放在 `~/.dbs/decisions/{项目名}/`，加 `--here` 或要求"放在当前项目里"则落到 `{当前目录}/决策/{项目名}/`。

**四层结构**（每层规则不同）：

- `01_事实/` —— 发生过什么。只追加。
- `02_规律/` —— 看出什么。缓慢追加修正，原段不重写。
- `03_定格/` —— 某时整体什么样。写完不改，新版本另起。
- `04_待解/` —— 还没想清楚的（含决策事件）。完成即清。

每层目录里放一个 `_这层放什么.md`，说明这个目录该记什么，常见误放项有哪些。

**核心机制**：

- `我的当前状态.md` 是第一入口，每次对话先读、对话结束先更新
- 来源标签强制（`[本人]` / `[AI 推测]` / `[AI 结论]` / `[AI 关键标注]` / `[AI 元记录]` / `[结果回填]` / `[修正]`）
- 概念升级 `02_规律/` 要满足 3 条门槛里的 2 条（出现 3 次 / 解释多事实 / 有工具性）
- 隐私模式（init 时问一句决定是否开）：强制代号 + git 黑名单提示
- "问什么办 → 拒方案 → 问新的"循环时 AI 停止给方案，写 `[AI 元记录]`

### Agent 基建

| Skill | 做什么 |
|---|---|
| `/dbs-agent-migration` | Agent 工作台迁移。把任意项目整理成 Claude Code / Codex / Grok / 通用 Agents 多端一致的 Agent 工作台：审计规则文件、识别真源、统一命名与 bridge |
| `/dbs-bridge` | 多端 skill 桥接。把任意 skill 目录挂到 Claude Code、Codex、`~/.agents/skills` 和 Grok，改源目录后多端自动同步。支持单个 skill、集合目录、外部路径，以及拆桥和状态查看 |

### chatroom 系列

| Skill | 做什么 |
|---|---|
| `/dbs-chatroom-austrian` | 奥派经济聊天室。哈耶克 × 米塞斯 × Claude 三人对话 |
| `/dbs-chatroom` | 定向聊天室。推荐专家或指定人物，多角色对话 + 判官总结 |

### 工具路径图

![Skill 联动图](docs/skill-link-map.svg)

#### 常见主线

```text
diagnosis（方向对不对）
    ↓
benchmark（找谁模仿）
    ↓
content（内容怎么做）
```

#### 内容局部优化

```text
content 发现开头问题 → hook（开头怎么优化）
content 需要标题 → xhs-title（标题公式）
content 想检查 AI 味 → ai-check（AI 写作检测）
```

#### 横向工具

```text
goal（目标本身是空转的，无法驱动行动）
slowisfast（任何关键决策阶段：当你在走捷径、贪快、绕开关键摩擦时）
action（知道该做什么，但就是做不动）
deconstruct（概念模糊，导致判断不成立）
chatroom（想先听多个视角，再决定下一步）
learning（把一个主题拆成连续学习文章，根据反馈继续推进）
decision（把重大决策沉淀成长期资产，支持回填和规律复盘）
```

#### 交互式学习

```text
选一个课题
    ↓
生成 01.md，并留下学习反馈区
    ↓
用户写反馈
    ↓
learning 先读反馈，再生成 02.md
    ↓
持续形成自适应学习梯度
```

#### 状态管理（贯穿所有诊断）

```text
任何诊断 skill 走完有结论
    ↓
save（把结论、否决方向、下一步存档到本地）
    ↓
下次回来 → restore（把上次的存档拉回来，接着走）
    ↓
攒了多份存档 → report（合并出可分享的报告）
```

诊断走到「问题被消解」「报告输出」「行动方案确定」这类节点时，相关 skill 会主动建议你 `/dbs-save`。后面回来时一句「接着上次」或 `/dbs-restore` 就能继续，不用从头再讲一遍背景。

不知道下一步走哪个 skill？输入 `/dbs`——它会读取你刚才的诊断结论，推荐 2-3 个值得走的下一步，每个都说清楚为什么。

---

## 知识库

dbskill 的知识库是完全开放的。你不需要安装整套 Skill 才能用——可以只拿走你需要的部分。

### 目录结构

```
知识库/
├── 原子库/                     # 结构化知识数据库
│   ├── atoms.jsonl             # 4,176 个知识原子（全量）
│   ├── atoms_2024Q4.jsonl      # 按季度拆分
│   ├── atoms_2025Q1.jsonl
│   ├── ...
│   └── README.md               # 字段说明
│
├── Skill知识包/                 # 提炼后的方法论文档
│   ├── diagnosis_公理与诊断框架.md
│   ├── diagnosis_问题消解案例库.md
│   ├── benchmark_对标方法论.md
│   ├── benchmark_平台运营知识.md
│   ├── content_内容创作方法论.md
│   ├── content_平台特性与案例.md
│   ├── action_心理诊断框架.md
│   ├── action_信号案例库.md
│   ├── deconstruct_语言与概念框架.md
│   ├── deconstruct_解构案例库.md
│   ├── decision_决策记录方法论.md
│   └── decision_结构与回填规则.md
│
└── 高频概念词典.md
```

### 原子库是什么

每个知识原子是一条从推文中提炼的知识点，结构化为 JSON：

```json
{
  "id": "2024Q4_042",
  "knowledge": "判断一个生意能不能做，必要条件之一是你能不能说出这个产品的颜色",
  "original": "判断一个生意能不能做，必要条件之一是你能不能说出这个产品的颜色...",
  "url": "https://x.com/dontbesilent/status/...",
  "date": "2024-10-01",
  "topics": ["商业模式与定价", "语言与思维"],
  "skills": ["dbs-diagnosis", "dbs-deconstruct"],
  "type": "anti-pattern",
  "confidence": "high"
}
```

**字段说明：**

| 字段 | 说明 |
|------|------|
| `knowledge` | 提炼后的知识点 |
| `original` | 推文原文（≤200 字） |
| `topics` | 10 个主题分类（可多选） |
| `skills` | 关联的 Skill |
| `type` | principle / method / case / anti-pattern / insight / tool |
| `confidence` | high / medium / low |

### Skill 知识包是什么

很多 Skill 都配有知识包——通常一份偏方法，一份偏案例。它们是公开的方法论文档，可以单独阅读，也可以作为后续维护时的背景材料。

如果你不安装 Skill，也可以直接读这些 .md 文件。它们是独立的、可读的方法论文档。

### 怎么在你自己的项目里用

**场景 1：给你的 AI 加商业诊断能力**

把 `知识库/Skill知识包/diagnosis_公理与诊断框架.md` 的内容粘贴到你的 system prompt 里。你的 AI 就有了 6 公理 + 消解漏斗。

**场景 2：做 RAG 知识库**

把 `知识库/原子库/atoms.jsonl` 导入你的向量数据库。4,176 条结构化知识点，自带主题标签，天然适合检索。

**场景 3：只要案例**

只看 `type: "case"` 或 `type: "anti-pattern"` 的原子。大约 700+ 条真实商业案例和反面案例。

**场景 4：做 chatbot**

用 Skill 知识包里的方法论作为 system prompt，用原子库做 RAG 增强。不需要安装 Claude Code。

**场景 5：学习和研究**

按 `topics` 过滤，只看你感兴趣的领域。比如 `topics` 包含 `"心理与执行力"` 的有 296 条。

---

## 许可证

本项目采用 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 许可证。

- 个人使用、学习、研究、非商业项目：不需要署名，不需要申请
- 公开发布衍生作品（文章、工具、课程等）：请注明来源
- 商业用途：需要单独授权，请联系作者
