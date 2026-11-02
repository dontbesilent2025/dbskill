# dbskill

简体中文 | [English](README.en.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [繁體中文](README.zh-TW.md)

[![Version](https://img.shields.io/badge/version-3.2.0-2563EB.svg?style=flat-square)](VERSION)
[![skills.sh](https://skills.sh/b/dontbesilent2025/dbskill)](https://skills.sh/b/dontbesilent2025/dbskill)
[![License](https://img.shields.io/badge/license-CC%20BY--NC%204.0-16A34A.svg?style=flat-square)](LICENSE)

**本次更新：** 新增在 Grok Bot 里使用 dbskill 的方法：把一段话发给 bot，就能装好 29 个公开技能，配合「dbs 创业教练」「dbs 内容教练」模板直接用；其他 Agent 的安装和用法不变

## dbskill 是什么

dbskill 是 dontbesilent 制作的中文 AI Skills 工具箱，共 34 个 Skill。安装到豆包、WorkBuddy、Claude Code、Codex 等支持 Skills 的 Agent 后，可以在对话里直接使用

Skill 是一套写给 Agent 的做事方法。装好 dbskill 后，你可以让 Agent：

- 判断一门生意的问题出在哪，比如续费低、客户嫌贵
- 找值得学的同行，看对方具体怎么做
- 把一个选题做成内容方案，检查稿子哪里没打动人
- 给一条视频写标题、封面文字和开头，发布前检查有没有违规风险
- 分析自己为什么知道该做却一直没做
- 把本地文件夹整理成可以随时查询的知识库

方法资料来自 dontbesilent 的 16,152 条公开推文，整理成 4,176 个知识原子。作者：[@dontbesilent](https://x.com/dontbesilent)

## 快速开始

**第 1 步：安装**

在终端运行：

```bash
npx -y skills add dontbesilent2025/dbskill -g --all
```

使用 Claude Code 插件市场或只装单个 Skill，见下文[安装详情](#安装详情)。在 Grok Bot 里使用，见 [Grok Bot](#grok-bot)

**第 2 步：把问题交给 `/dbs`**

在 Agent 对话框输入 `/dbs`，后面写上你的情况和问题。信息不完整也可以：

```text
/dbs 我做少儿编程课，有 40 个付费学员，但续费率很低。我不知道该先检查产品、定价还是客户匹配
```

第一次使用，可以先输入 `/dbs 新手入门`，了解能处理哪些任务

**第 3 步：在同一个对话里继续**

收到结果后，直接补充事实、材料或修改意见，不用重新输入命令。换一个新目标时，再输入一次 `/dbs`

## /dbs 怎样安排 Skill

`/dbs` 是 dbskill 的技能调度台。它先看你要的最终结果，再决定用哪几个 Skill、按什么顺序用。能少用就少用：简单问题直接回答，一个 Skill 够用就只用一个

常见的安排有 6 种：

1. **只用一个**：诊断商业模式，只用 `dbs-diagnosis`
2. **按顺序接着做**：后一步要用前一步的结果。`dbs-content` 给出创作方案，你写完稿子，再用 `dbs-content-risk-check` 检查发布风险
3. **各做各的**：几件事互不相关。`dbs-ai-check` 查 AI 味，`dbs-wechat-html` 排版，两份结果分别交给你
4. **先判断，再决定做不做**：`dbs-content-value` 先判断选题值不值得做，值得再用 `dbs-content` 出方案
5. **分别分析，再比较**：同一个问题可能有几种原因。稿子流量低，`dbs-content-value` 和 `dbs-resonate` 各自给出原因，`/dbs` 再比较
6. **做完检查，再修改**：要求高的文字，`dbs-plain-writing` 写完后用 `dbs-ai-check` 检查，再按问题修改

需要你定方向时，`/dbs` 会把选项列给你，不替你选。开始前，它会说明打算怎么安排、为什么这样安排

## 全部 Skill

已经知道要用哪个 Skill 时，可以直接输入它的命令。每个 Skill 的适用时机、输入示例和边界，见[新手入门与 Skill 全目录](docs/新手入门.md#skill-全目录)

### 入口

| 命令 | 用途 |
| --- | --- |
| [`/dbs`](skills/dbs/SKILL.md) | 根据你的问题选择和安排 Skill，在当前对话里推进 |

### 商业判断与问题澄清

| 命令 | 用途 |
| --- | --- |
| [`/dbs-diagnosis`](skills/dbs-diagnosis/SKILL.md) | 判断一个商业问题是否成立，或全面检查一门生意，给出明天要做的第一件事 |
| [`/dbs-benchmark`](skills/dbs-benchmark/SKILL.md) | 筛选值得模仿的同行，拆出对方获客、转化、交付的具体做法 |
| [`/dbs-jtbd`](skills/dbs-jtbd/SKILL.md) | 分析顾客为什么选择或放弃一个产品 |
| [`/dbs-goal`](skills/dbs-goal/SKILL.md) | 把模糊的愿望整理成能检查的目标和完成标准 |
| [`/dbs-good-question`](skills/dbs-good-question/SKILL.md) | 把模糊的问题改写清楚，判断哪些部分能交给 Agent |
| [`/dbs-deconstruct`](skills/dbs-deconstruct/SKILL.md) | 拆解一个说不清的概念，讲清它在不同场合的意思 |
| [`/dbs-theory-grounding`](skills/dbs-theory-grounding/SKILL.md) | 检查课程、PPT 或方法论里的判断，找到可信的理论依据 |
| [`/dbs-standard-answer`](skills/dbs-standard-answer/SKILL.md) | 研究一个问题的相关理论和历史案例，给出带条件的标准答案 |

### 内容创作与发布

| 命令 | 用途 |
| --- | --- |
| [`/dbs-content`](skills/dbs-content/SKILL.md) | 把已定的选题做成内容方案：形式、平台、结构和表达 |
| [`/dbs-title-cover-intro`](skills/dbs-title-cover-intro/SKILL.md) | 先定选题，再写小红书、B 站、抖音、视频号的标题、封面文字和开头 |
| [`/dbs-resonate`](skills/dbs-resonate/SKILL.md) | 找出写好的稿子哪里没打动目标受众，给出删改建议 |
| [`/dbs-script-flow`](skills/dbs-script-flow/SKILL.md) | 检查短视频逐字稿的衔接和口播流畅度，标出观众可能划走的位置 |
| [`/dbs-content-value`](skills/dbs-content-value/SKILL.md) | 判断内容会吸引谁、开头能不能留住人，以及可能的流量和商业价值 |
| [`/dbs-spread`](skills/dbs-spread/SKILL.md) | 解释一条已有反响的内容为什么让人共鸣或转发 |
| [`/dbs-ai-check`](skills/dbs-ai-check/SKILL.md) | 标出文案里的 AI 写作痕迹 |
| [`/dbs-content-risk-check`](skills/dbs-content-risk-check/SKILL.md) | 发布前逐句检查平台审核风险，给出最小的修改方法 |
| [`/dbs-plain-writing`](skills/dbs-plain-writing/SKILL.md) | 按事实顺序写产品、功能和更新说明，不加营销包装 |
| [`/dbs-wechat-html`](skills/dbs-wechat-html/SKILL.md) | 把 Markdown 排成能粘贴到公众号后台的 HTML |

### 视频处理

| 命令 | 用途 |
| --- | --- |
| [`/dbs-video-extract`](skills/dbs-video-extract/SKILL.md) | 根据平台链接取得作品数据和语音文字稿；需要外部服务凭证 |
| [`/dbs-video-navigation`](skills/dbs-video-navigation/SKILL.md) | 为本地视频划分章节，生成可导入剪辑软件的导航条 |

### 行动、学习与决策

| 命令 | 用途 |
| --- | --- |
| [`/dbs-action`](skills/dbs-action/SKILL.md) | 分析知道该做却一直没做的原因，给出今天能做的一步 |
| [`/dbs-learning`](skills/dbs-learning/SKILL.md) | 把一个课题拆成连续的学习文章，按你的反馈调整下一篇 |
| [`/dbs-decision`](skills/dbs-decision/SKILL.md) | 为需要长期跟踪的决策建立本地记录，之后回填结果和复盘 |

### 存档与报告

| 命令 | 用途 |
| --- | --- |
| [`/dbs-save`](skills/dbs-save/SKILL.md) | 把当前对话的结论和下一步保存到本机 |
| [`/dbs-restore`](skills/dbs-restore/SKILL.md) | 读取上次的存档，接着处理 |
| [`/dbs-report`](skills/dbs-report/SKILL.md) | 把多份存档合并成一份报告 |

### 多视角讨论

| 命令 | 用途 |
| --- | --- |
| [`/dbs-chatroom`](skills/dbs-chatroom/SKILL.md) | 请几位专家角色围绕一个话题分别发言，最后汇总 |
| [`/dbs-chatroom-austrian`](skills/dbs-chatroom-austrian/SKILL.md) | 用哈耶克、米塞斯两位奥派经济学家的视角讨论问题 |

### 资料与工具

| 命令 | 用途 |
| --- | --- |
| [`/dbs-knowledge`](skills/dbs-knowledge/SKILL.md) | 把本地文件夹建成 Agent 能查找、收录和维护的知识库 |
| [`/dbs-content-system`](skills/dbs-content-system/SKILL.md) | 把一批旧文稿整理成可以拆分、复用的内容资料库 |
| [`/dbs-human-dispatch`](skills/dbs-human-dispatch/SKILL.md) | 把任务派给员工或协作者，跟进进度并验收结果 |
| [`/dbs-skill-maker`](skills/dbs-skill-maker/SKILL.md) | 制作新的 Skill，或改进已有的 Skill |
| [`/dbs-install-skill`](skills/dbs-install-skill/SKILL.md) | 把 Skill 安装到多个 Agent，并清理重复的入口 |

## 安装详情

以下命令都在终端运行，不要作为聊天内容发给 Agent

### Skills CLI

```bash
npx -y skills add dontbesilent2025/dbskill -g --all
```

`-g` 表示全局安装，`--all` 表示安装到 Skills CLI 识别的所有 Agent。只想装到一个 Agent 时，删掉 `--all`，按提示选择

### Claude Code 插件市场

```bash
claude plugin marketplace add dontbesilent2025/dbskill
claude plugin install dbs@dontbesilent-skills
```

插件方式下，命令前面要加 `dbs:`，例如 `/dbs:dbs`、`/dbs:dbs-diagnosis`

只装一个 Skill 时，安装对应的插件，例如：

```bash
claude plugin install dbs-diagnosis@dontbesilent-skills
```

![Claude Code 插件安装演示](demo.gif)

### Grok Bot

这一节的内容不在终端运行，而是整段作为聊天内容发给你的 Grok Bot。

用「dbs 创业教练」模板的，发：

```text
请在你的运行环境里执行下面两条命令安装 dbskill，把输出原样告诉我：
git clone --depth 1 https://github.com/dontbesilent2025/dbskill /tmp/dbskill 2>/dev/null || git -C /tmp/dbskill pull --ff-only
python3 /tmp/dbskill/tools/grok/install.py --coach startup
```

用「dbs 内容教练」模板的，把最后的 `startup` 换成 `content`；想装全部 29 个公开 Skill，换成 `all`。装好后对 Bot 说「用 dbs 帮我看看……」即可。之后想更新，再发一次同样的话

### 装好后没看到命令

先确认安装命令运行成功，并且装到的是你正在用的 Agent。Skills CLI 安装用短命令，例如 `/dbs`；Claude Code 插件用带 `dbs:` 的命令。具体名称以 Agent 里显示的为准

## 更多用法

### 直接调用某个 Skill

在命令后写上问题、材料和你想要的结果：

```text
/dbs-diagnosis 我做收纳咨询，客单价 3,000 元。最近 10 个咨询里有 6 个说贵，3 个没有回复。请判断下一步先核实什么
```

```text
/dbs-title-cover-intro 这是准备拍的短视频稿，请按小红书发布，给我标题、封面文字和开头：粘贴文稿
```

提问时附上这些信息，结果会更准确：

- 你手上已有的事实和数字，例如价格、人数、成交情况
- 完整的稿子或材料，不要只给摘要
- 你想要什么结果，例如判断、方案，还是能直接用的文字

需要读取本地文件、联网或处理视频的 Skill，Agent 还要有相应的权限或工具，具体见各 Skill 的说明

### 使用视频里的三位编号

在 dontbesilent 的视频里拿到三位编号后，输入：

```text
/dbs 123
```

把 `123` 换成视频给出的编号。想看当前所有编号，输入 `/dbs 给我所有隐藏级 skill`。编号内容在使用时从 GitHub 读取，Agent 需要能访问 GitHub

### 跨对话保留结论

用 `/dbs-save` 保存当前的结论，下次用 `/dbs-restore` 接着处理。存档保存在本机 `~/.dbs/`

## 仓库资料

安装 Skill 不会下载这些资料，需要时在仓库里查阅

| 资料 | 用途 |
| --- | --- |
| [公开推文集（Markdown）](books/dontbesilent-开源推文集.md) | 搜索、阅读，或交给 AI 分析 |
| [公开推文集（PDF）](books/dontbesilent-开源推文集.pdf) | 阅读和保存 |
| [原子库说明](知识库/原子库/README.md) | 数据范围、字段和使用方式 |
| [知识原子数据](知识库/原子库/atoms.jsonl) | 自建检索、分析或 RAG |
| [Skill 知识包](知识库/Skill知识包) | 按 Skill 整理的方法资料 |

## 更新与帮助

在 Agent 对话里说：

```text
更新 dbskill
```

更新会同步官方 dbskill，保留 `~/.dbs/` 里的存档和记录，并自动清理已经下线的旧 Skill。手动清理方法见[新手入门](docs/新手入门.md#怎样更新)。历史改动见[更新记录](https://github.com/dontbesilent2025/dbskill/commits/main)

- [新手入门与 Skill 全目录](docs/新手入门.md)
- [提交问题或建议](https://github.com/dontbesilent2025/dbskill/issues)
- [付费答疑群说明](https://mp.weixin.qq.com/s/RpwNjMo4M_er4GOrfCYt1g)
- 作者：[@dontbesilent](https://x.com/dontbesilent) · [小红书](https://xhslink.com/m/637xuspR4iI) · [抖音](https://v.douyin.com/pRUDhpBqOrc/)

## 贡献者

`dbs-content-risk-check` 的敏感词检查能力由以下共创者共同完善：

- [@Ronnie2025](https://github.com/Ronnie2025)
- [@非著名投放小沈](https://xhslink.cn/m/4NSBjmZTC1j)

## 许可证

本项目采用 [CC BY-NC 4.0](LICENSE) 许可证。个人学习、研究和非商业使用请注明来源；商业用途请联系作者获取授权
