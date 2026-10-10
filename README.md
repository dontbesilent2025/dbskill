# dbskill

简体中文 | [English](README.en.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [繁體中文](README.zh-TW.md)

dbskill 是 dontbesilent 的中文 AI Skills 工具箱，包含商业判断、内容创作、行动决策、学习和知识管理等能力，可安装到支持 Skills 的 Agent 中使用

[![Version](https://img.shields.io/badge/version-2.18.49-2563EB.svg?style=flat-square)](VERSION)
[![skills.sh](https://skills.sh/b/dontbesilent2025/dbskill)](https://skills.sh/b/dontbesilent2025/dbskill)
[![License](https://img.shields.io/badge/license-CC%20BY--NC%204.0-16A34A.svg?style=flat-square)](LICENSE)

支持豆包、WorkBuddy、Claude Code、Codex 和其他兼容 Skills 的 Agent。项目方法资料从 16,152 条公开推文中筛选整理，包含 4,176 个结构化知识原子。作者：[@dontbesilent](https://x.com/dontbesilent)

## 目录

- [dbskill 是什么](#dbskill-是什么)
- [安装](#安装)
- [开始使用](#开始使用)
- [怎样提供任务材料](#怎样提供任务材料)
- [按任务查找 Skill](#按任务查找-skill)
- [仓库资料](#仓库资料)
- [更新、问题与支持](#更新问题与支持)
- [贡献者](#贡献者)
- [许可证](#许可证)

## dbskill 是什么

Skill 是一套针对某类任务编写的 Agent 指令。安装 dbskill 后，可以在 Agent 对话中调用 `/dbs` 或某个具体 Skill，例如 `/dbs-diagnosis`

如果你还不知道该用哪项能力，从 `/dbs` 开始。它读取当前对话，推荐适合当前任务的 Skill，并说明为什么这样选择。任务包含几项独立要求时，`/dbs` 可以安排 1 个主 Skill 和最多 2 个辅助 Skill

`/dbs` 负责推荐入口和准备调用提示词。具体 Skill 负责后续分析、制作、检查或文件工作。每次只处理一个当前任务；收到结果和新材料后，可以继续当前任务，或再次让 `/dbs` 判断下一步

dbskill 常用于这些工作：

- 判断商业模式、产品、客户、定价和对标
- 澄清概念、目标、用户需求和复杂问题
- 开发内容方案，检查文稿共鸣、逻辑、传播性和发布风险
- 生成标题、封面文字、短视频开头或视频章节导航
- 处理行动受阻、学习计划和长期决策记录
- 建立本地文件夹知识库，整理内容资产和 Agent 工作台

## 安装

选择与你的 Agent 相符的一种安装方式。以下安装命令都在终端运行，不要把它们作为聊天内容发送给 Agent

### 使用 Skills CLI 安装到支持的 Agent

终端需要能够运行 `npx`。执行：

```bash
npx -y skills add dontbesilent2025/dbskill -g --all
```

`-g` 表示全局安装，`--all` 表示安装到 Skills CLI 识别的所有 Agent。只想安装到某一个 Agent 时，可以删除 `--all`，然后按 CLI 提示选择目标

安装后，在目标 Agent 的对话中输入：

```text
/dbs 新手入门
```

如果目标 Agent 的命令名称带有命名空间，请使用它显示的完整名称。Claude Code 插件的命名方式见下文

### 使用 Claude Code 插件市场

在终端运行：

```bash
claude plugin marketplace add dontbesilent2025/dbskill
claude plugin install dbs@dontbesilent-skills
```

安装完整插件后，Claude Code 会为命令添加 `dbs:` 命名空间：主入口是 `/dbs:dbs`，商业诊断是 `/dbs:dbs-diagnosis`，内容创作是 `/dbs:dbs-content`

只安装一个能力时，可以安装对应插件，例如：

```bash
claude plugin install dbs-diagnosis@dontbesilent-skills
```

![Claude Code 插件安装演示](demo.gif)

### 安装后没有看到命令

先确认安装命令成功，并确认安装目标是当前正在使用的 Agent。Skills CLI 安装使用短命令，例如 `/dbs`；Claude Code 插件使用带命名空间的命令，例如 `/dbs:dbs`。每项 Skill 的入口以所在 Agent 实际显示的名称为准

## 开始使用

### 第一次使用：先了解入口

在 Agent 对话框输入：

```text
/dbs 新手入门
```

主入口会介绍能处理的任务、如何选择 Skill，以及怎样开始。之后可以直接提交你正在处理的问题

### 不确定该用什么：让 `/dbs` 推荐

把当前情况和问题写在 `/dbs` 后面。可以说得不完整，Agent 会先利用当前对话中已经提供的信息：

```text
/dbs 我做少儿编程课，有 40 个付费学员，但续费率很低。我不知道该先检查产品、定价还是客户匹配。
```

`/dbs` 会说明推荐理由，并生成一段可继续发送的调用提示词。把它发给 Agent 后，推荐的 Skill 才开始完成具体任务。你无需重新描述已经说过的背景

### 已经知道要做什么：直接调用 Skill

在命令后附上问题、材料和希望得到的结果：

```text
/dbs-diagnosis 我做收纳咨询，客户总觉得贵。请帮我判断需要检查哪些因素，并说明还缺哪些信息。
```

```text
/dbs-content 我想讲“普通人别急着做个人 IP”。请根据这个选题设计内容方向和论证结构。
```

```text
/dbs-title-cover-intro 这是准备拍的短视频稿。请按小红书发布，给我标题、封面文字和开头：粘贴文稿
```

```text
/dbs-knowledge 帮我整理这个本地文件夹，建立导航，之后可以按主题查资料。
```

在 Claude Code 插件方式下，把上述命令换成带命名空间的名称，例如 `/dbs:dbs-diagnosis`

### 使用视频中的三位编号

如果你从 dontbesilent 的视频中获得了一个三位编号，并且已经安装 `/dbs`，可以直接输入：

```text
/dbs 123
```

将 `123` 替换为视频给出的编号。想查看当前可用的编号时，输入：

```text
/dbs 给我所有隐藏级 skill
```

编号提示词会在使用时从 GitHub 读取，因此 Agent 需要能够访问 GitHub。编号目录为空或暂时无法联网时，入口会说明当前状态。

### 收到结果后：继续当前任务或重新判断

如果结果还需要补充，直接在当前对话中提供新事实、材料或修改意见。当前 Skill 会接着处理

如果当前任务已经完成，又有新的目标，可以重新输入 `/dbs`，说明新目标。入口会依据当前对话和新目标重新推荐，不需要把前一个任务预先写成固定流程

需要跨对话保留阶段性结论时，可以调用 [`/dbs-save`](skills/dbs-save/SKILL.md) 存档；之后用 [`/dbs-restore`](skills/dbs-restore/SKILL.md) 恢复。存档默认保存在本机 `~/.dbs/`

## 怎样提供任务材料

结果会受到你提供的事实、材料和 Agent 当前工具权限影响。提问时可以按需补充以下信息，不需要为了填满模板而回答无关问题：

| 任务类型 | 建议提供的信息 | 可以提出的要求 |
| --- | --- | --- |
| 商业判断 | 产品或服务、客户、价格、成交或流失情况、已尝试的做法 | 判断主要问题、列出依据、说明还需要验证什么 |
| 内容创作 | 完整选题或文稿、发布平台、目标受众、拍摄状态 | 形成内容方案、检查文稿、生成标题或开头 |
| 内容检查 | 完整文字、图片或视频材料、准备发布的平台 | 标出具体风险位置并说明最小调整方式 |
| 个人决策 | 要做的选择、候选方案、时间和资源限制、担心的代价 | 比较方案、记录判断依据、设定回看条件 |
| 知识库整理 | Agent 可访问的本地文件夹、资料用途、维护方式 | 建立导航、检查版本、按问题查找或收录资料 |

例如，商业问题可以这样描述：

```text
/dbs-diagnosis 我提供企业收纳咨询，客单价 3,000 元。最近 10 个咨询里有 6 个说贵，3 个没有回复。我试过打折，成交多了但交付时间也变长。请判断下一步先核实什么；如果信息不足，请问我最关键的一个问题。
```

如果任务需要本地文件、网页访问、视频处理或外部服务，Agent 还必须具备相应的文件访问、联网能力、工具或凭证。比如，视频数据提取和本地视频章节导航的运行条件不同；调用前可查看对应 Skill 的说明

## 按任务查找 Skill

下面列出常见入口。每项链接到 Skill 定义；完整目录包含每项能力的适用时机、输入示例和边界，见[新手入门与 Skill 全目录](docs/新手入门.md#skill-全目录)

| 当前要做的事 | 入口 | 用途 |
| --- | --- | --- |
| 不确定该从哪个方法开始 | [`/dbs`](skills/dbs/SKILL.md) | 根据当前问题推荐入口并生成调用提示词 |
| 检查商业模式、客户或定价 | [`/dbs-diagnosis`](skills/dbs-diagnosis/SKILL.md) | 判断当前商业问题并形成诊断方向 |
| 研究可以学习的同行或产品 | [`/dbs-benchmark`](skills/dbs-benchmark/SKILL.md) | 筛选对标并分析可借鉴之处 |
| 澄清复杂需求或用户购买动机 | [`/dbs-good-question`](skills/dbs-good-question/SKILL.md)、[`/dbs-jtbd`](skills/dbs-jtbd/SKILL.md) | 把模糊问题说清楚，分析用户想完成的任务 |
| 把选题发展成内容 | [`/dbs-content`](skills/dbs-content/SKILL.md) | 设计内容结构、论证和表达方案 |
| 检查已写好的稿件 | [`/dbs-resonate`](skills/dbs-resonate/SKILL.md)、[`/dbs-script-flow`](skills/dbs-script-flow/SKILL.md) | 检查受众共鸣、段落衔接和表达流畅度 |
| 设计标题、封面文字和短视频开头 | [`/dbs-title-cover-intro`](skills/dbs-title-cover-intro/SKILL.md) | 根据文稿和拍摄状态生成或修改配套文案 |
| 提取短视频数据或语音文字稿 | [`/dbs-video-extract`](skills/dbs-video-extract/SKILL.md) | 根据平台链接获取作品信息和转写内容；部分功能需要外部服务凭证 |
| 为本地视频添加章节导航 | [`/dbs-video-navigation`](skills/dbs-video-navigation/SKILL.md) | 根据视频或带时间戳字幕生成章节导航和进度条 |
| 发布前检查内容风险 | [`/dbs-content-risk-check`](skills/dbs-content-risk-check/SKILL.md) | 定位可能的审核信号和需要调整的内容 |
| 梳理行动阻滞或长期选择 | [`/dbs-action`](skills/dbs-action/SKILL.md)、[`/dbs-decision`](skills/dbs-decision/SKILL.md) | 分析执行卡点，记录并复盘决策 |
| 整理本地文件供 Agent 查找 | [`/dbs-knowledge`](skills/dbs-knowledge/SKILL.md) | 建立和维护文件夹知识库 |

`dbs-hook` 和 `dbs-xhs-title` 是旧版兼容入口。新任务请使用 `dbs-title-cover-intro`

## 仓库资料

安装 Skills 与阅读仓库资料是两种不同的使用方式。公开推文集、知识原子和知识包均可在仓库中查阅；Skills CLI 安装 Skill 文件，不会自动下载整套公开推文集

| 资料 | 用途 |
| --- | --- |
| [公开推文集（Markdown）](books/dontbesilent-开源推文集.md) | 搜索、阅读、复制或交给 AI 分析 |
| [公开推文集（PDF）](books/dontbesilent-开源推文集.pdf) | 阅读和保存 |
| [原子库说明](知识库/原子库/README.md) | 查看数据范围、字段和使用方式 |
| [知识原子数据](知识库/原子库/atoms.jsonl) | 用于自建检索、分析或 RAG 流程 |
| [Skill 知识包](知识库/Skill知识包) | 查阅按 Skill 整理的方法资料 |

## 更新、问题与支持

### 更新

已安装 dbskill 时，在 Agent 对话中说：

```text
更新 dbskill
```

系统更新入口会同步官方 dbskill，并保留 `~/.dbs/` 中的存档、报告和决策记录。也可以查看[更新记录](https://github.com/dontbesilent2025/dbskill/commits/main)

### 获取帮助

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
