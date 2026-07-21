# dbskill

简体中文 | [English](README.en.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [繁體中文](README.zh-TW.md)

> 面向创业者与内容创作者的中文 AI Skills 工具箱。把真实业务、内容与行动问题交给 Agent，获得清晰判断和可以立刻执行的下一步。

[![Version](https://img.shields.io/badge/version-2.18.2-2563EB.svg?style=flat-square)](VERSION)
[![skills.sh](https://skills.sh/b/dontbesilent2025/dbskill)](https://skills.sh/dontbesilent2025/dbskill)
[![License](https://img.shields.io/badge/license-CC%20BY--NC%204.0-16A34A.svg?style=flat-square)](LICENSE)

**支持：豆包、WorkBuddy、Claude Code、Codex，以及其他支持 Skills 的 Agent。**

dbskill 由 [dontbesilent](https://x.com/dontbesilent) 创建。从 16,152 条公开推文中筛选、结构化出 4,176 个知识原子，并将其中的方法沉淀为 28 个可直接调用的 Skills。

[快速开始](#快速开始) · [安装](#安装) · [能力一览](#能力一览) · [完整使用手册](docs/新手入门.md) · [更新日志](https://github.com/dontbesilent2025/dbskill/releases)

本次更新（v2.18.1）：`dbs-learning` 新增项目知识基础确认。新课题可先识别本地已有表达，再由用户选择基于项目、从零开始或指定材料；同时增加敏感材料排除、候选证据表述和分支验收规则。

![dbskill 动态路由图](docs/skill-link-map.svg)

## dbskill 解决什么问题

你不需要先学会一套复杂的方法，也不需要知道该调用哪个工具。把当下的业务、材料、选择或卡点交给 `/dbs`，它会根据对话上下文选择当前适合的 Skill。

| 真实处境 | 你会得到 |
| --- | --- |
| 客户总说贵，不知道该改价格、产品还是客群 | 商业模式诊断、风险判断和验证动作 |
| 有一个选题，却做不出能被人看完的内容 | 内容方向、开头、标题与逐字稿优化 |
| 知道该做什么，却迟迟推不动 | 对行动卡点的分析和一条可开始的动作 |
| 反复面对同类选择，经验无法积累 | 可回填的决策记录、规律与阶段快照 |
| 文稿、选题、案例散落在多个文件夹 | 可持续维护的内容资产工程 |
| 本地资料很多，希望 Agent 能稳定查找和调用 | 基于文件夹的知识库导航、版本规则与使用入口 |

## 快速开始

安装完成后，直接在 Agent 中输入：

```text
/dbs 我做少儿编程课，已经有 40 个付费学员，但续费率很低。
我需要判断问题出在产品、定价，还是我找错了客户。
```

`/dbs` 会读取当前对话信息，选择合适的分析路径。完成一轮后，继续补充新的事实或反馈，再输入 `/dbs`，它会判断当前该推进什么。

已经知道需求时，可以直接调用具体 Skill：

```text
/dbs-diagnosis 我做面向宝妈的收纳咨询，客户总觉得贵。我该调整什么？
/dbs-content 我想讲“普通人别急着做个人 IP”，这个选题怎样做成内容？
/dbs-hook 这是我短视频前 20 秒的逐字稿，帮我优化开头：……
/dbs-benchmark 我想研究企业服务内容账号，应该找哪些对标？
/dbs-knowledge 帮我把这个文件夹变成知识库，以后我想直接从里面找资料。
```

## 能力一览

| 工作目标 | 主要入口 | 常见产出 |
| --- | --- | --- |
| 判断生意、产品、定价与客户 | `/dbs-diagnosis` | 商业诊断、风险、验证方案 |
| 找对标并提炼可学习的部分 | `/dbs-benchmark` | 对标筛选与研究框架 |
| 做选题、内容、标题与短视频 | `/dbs-content`、`/dbs-hook`、`/dbs-xhs-title` | 内容方向与可发布文案 |
| 检查文稿共鸣、逻辑与传播性 | `/dbs-resonate`、`/dbs-script-flow`、`/dbs-spread` | 修改意见与优先级 |
| 澄清概念、目标和问题 | `/dbs-deconstruct`、`/dbs-goal`、`/dbs-good-question` | 可验证的定义与行动目标 |
| 处理拖延、贪快和行动受阻 | `/dbs-action`、`/dbs-slowisfast` | 卡点分析与下一步动作 |
| 记录、复盘长期决策 | `/dbs-decision`、`/dbs-save`、`/dbs-restore`、`/dbs-report` | 本地决策档案与报告 |
| 建立和治理文件夹知识库 | `/dbs-knowledge` | 知识库导航、版本规则、健康检查与 SOT 分层瘦身 |
| 建立内容资产与多端 Agent 工作台 | `/dbs-content-system`、`/dbs-agent-migration`、`/dbs-bridge` | 本地工程、主题地图与桥接方案 |
| 审查本地 Skill 风险 | `/dbs-skill-cleaner` | 风险报告与确认后的隔离操作 |

完整的 28 个 Skill、适用时机、输入示例和常见衔接方式，见 [新手入门与 Skill 全目录](docs/新手入门.md#skill-全目录)。

## 安装

### 豆包、WorkBuddy、Codex 与其他支持 Skills 的 Agent

在终端执行：

```bash
npx -y skills add dontbesilent2025/dbskill -g --all
```

安装后回到 Agent，输入 `/dbs 新手入门` 即可开始。

### Claude Code 插件市场

```bash
claude plugin marketplace add dontbesilent2025/dbskill
claude plugin install dbs@dontbesilent-skills
```

![Claude Code 插件安装演示](demo.gif)

### 更新

已安装 dbskill 时，直接对当前 Agent 说：

```text
更新 dbskill
```

它会同步官方 dbskill，不会修改你在 `~/.dbs/` 中的存档、报告和决策记录。版本变化见 [GitHub Releases](https://github.com/dontbesilent2025/dbskill/releases)。

## dbskill 怎样工作

```text
真实任务
   ↓
/dbs 读取上下文并选择当前入口
   ↓
一个 Skill 完成诊断、产出或记录
   ↓
补充结果与反馈，再决定下一步
```

dbskill 的重点是推进眼前真实的任务。它会先处理当前最有价值的结点，再根据实际结果衔接后续工作。

## 知识库与本地记录

仓库公开了 4,176 条结构化知识原子、按 Skill 整理的方法论文档与高频概念词典。

- 想查看数据范围和字段，阅读 [原子库说明](知识库/原子库/README.md)。
- 想构建自己的 RAG，可使用 `知识库/原子库/atoms.jsonl`。
- 想了解各项方法，浏览 [Skill 知识包](知识库/Skill知识包)。
- 想把自己的本地文件夹直接当作知识库，使用 `/dbs-knowledge` 建立导航并持续查找、收录和调用资料。
- 想跨对话保留工作，使用 `/dbs-save`、`/dbs-restore` 与 `/dbs-report`。数据默认保存在用户本机的 `~/.dbs/`。

![dbskill 知识来源图](docs/knowledge-pipeline.svg)

## 项目结构

```text
dbskill/
├── skills/                  # 28 个正式发布的 Skills + 1 个更新入口
├── 知识库/                   # 知识原子、方法论文档与概念词典
├── docs/                    # 新手入门、图示与演示素材
├── .claude-plugin/          # Claude Code 插件市场定义
└── tools/                   # 构建与维护脚本
```

本地构建发布包：

```bash
bash tools/build-skills.sh
```

构建产物位于 `dist/skills/`；名称带 `beta` 的本地试验 Skill 不会进入发布包。

## 作者与支持

作者：[@dontbesilent](https://x.com/dontbesilent) · [小红书](https://xhslink.com/m/637xuspR4iI) · [抖音](https://v.douyin.com/pRUDhpBqOrc/)

如需加入付费答疑群，可扫码或打开 [答疑群说明](https://mp.weixin.qq.com/s/V7Dr0-75VYZOLJ6lbT_s0w)。

![付费答疑群二维码](docs/paid-qa-group-qrcode.png)

## 许可证

本项目采用 [CC BY-NC 4.0](LICENSE) 许可证。

- 个人使用、学习、研究与非商业项目可以直接使用。
- 公开发布衍生作品时，请注明来源。
- 商业用途需要单独授权，请联系作者。
