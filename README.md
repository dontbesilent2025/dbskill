# dbskill for OpenAI Codex CLI (in MacOS Terminal app) [➡English Version](README_EN.md)

dontbesilent 商业诊断工具箱。从 12,307 条推文中提炼方法论，做成 Codex skills。

**所有内容开放，可以整套装，也可以只拿一部分。知识包、原子库、单个公理，都能单独用。**

---

## v2 更新

- **知识库重建**：从 12,307 条推文中提取 4,176 个知识原子，替代旧的推文堆叠。每个原子有主题标签、Skill 关联、类型分类和置信度评分
- **内联案例**：每个 Skill 新增 3 个正面案例 + 2 个反面案例，直接写在 SKILL.md 里，不依赖外部文件也能用
- **Skill 知识包**：10 个提炼后的方法论文档，按 Skill 需求组织（不再是按学科分类的推文堆叠）

---

## 工具箱

| Skill | 做什么 |
|---|---|
| `/dbs` | 主入口，自动路由到对的工具 |
| `/dbs-diagnosis` | 商业模式诊断。消解问题，不回答问题 |
| `/dbs-benchmark` | 对标分析。五重过滤，排除噪音 |
| `/dbs-content` | 内容创作诊断。五维检测 |
| `/dbs-unblock` | 执行力诊断。阿德勒框架 |
| `/dbs-deconstruct` | 概念拆解。维特根斯坦式审查 |

### 工作流

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

Skill 之间会自动推荐下一步。比如 diagnosis 发现心理问题信号，会建议你去 unblock。

---

## 安装 for Codex CLI (in Terminal app)



这是一个用于 **OpenAI Codex CLI** 的技能包安装仓库说明。

本仓库的作用，是将这里提供的 skills 安装到你本机的 Codex skills 目录中，使它们能够在 Codex 中被识别和调用。

本说明面向 **macOS 用户**，默认使用 **Terminal.app** 进行安装。


### 第 1 步：检查 `~/.agents/skills` 文件夹是否已经存在

在 Terminal 中运行：

```bash
ls -ld ~/.agents/skills
```

如果该文件夹已经存在，那么你**不需要重复创建**。

如果系统提示这个目录不存在，那么请继续执行下面这一步来创建它。

---

### 第 2 步：如果目录不存在，则创建 `~/.agents/skills`


```bash
mkdir -p ~/.agents/skills
```


### 第 3 步：把本仓库克隆到 `/tmp`

运行：

```bash
git clone https://github.com/eawlot3000/dbskill.git /tmp/dbskill
```

说明：

* 这里把仓库临时克隆到 `/tmp/dbskill`
* `/tmp` 是一个临时目录，适合用于这种中转安装方式
* 这样不会把仓库直接下载到你当前正在工作的目录里

---

### 第 4 步：把仓库中的 skills 复制到 Codex 的 skills 目录

运行：

```bash
cp -R /tmp/dbskill/skills/* ~/.agents/skills/
```

说明：

* `cp` 表示复制
* `-R` 表示递归复制整个目录内容
* 这条命令会把 `/tmp/dbskill/skills/` 下面的所有 skill 文件夹复制到 `~/.agents/skills/` 中

---

### 第 5 步：可选，删除临时克隆目录

运行：

```bash
rm -rf /tmp/dbskill
```

说明：

* 这一步不是必须的
* 它只是删除刚才临时克隆到 `/tmp` 的仓库副本
* 不会影响已经复制到 `~/.agents/skills/` 里的内容

---

## 一键安装命令

如果你不想一步一步执行，也可以直接运行下面这一整组命令：

```bash
mkdir -p ~/.agents/skills
git clone https://github.com/eawlot3000/dbskill.git /tmp/dbskill
cp -R /tmp/dbskill/skills/* ~/.agents/skills/
rm -rf /tmp/dbskill
```

---

## 如何验证是否安装成功

安装完成后，可以先启动 Codex：

```bash
codex
```

进入 Codex 之后，你可以尝试查看 skills 是否已经被识别。

有些 Codex 环境支持输入：

```text
/skills
```

来查看当前可用技能。

你也可以尝试直接调用某个 skill，例如：

```text
$dbs
```

如果你的 Codex 环境支持显式调用 skills，那么它应该可以识别已经安装好的技能。

---

## 卸载方法

如果你之后不想继续使用这些 skills，可以手动进入下面的目录：


```bash
open ~/.agents/skills
```

然后删除对应的 skill 文件夹即可。


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
│   ├── unblock_心理诊断框架.md
│   ├── unblock_信号案例库.md
│   ├── deconstruct_语言与概念框架.md
│   └── deconstruct_解构案例库.md
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

每个 Skill 有 2 个知识包——一个是框架方法论，一个是案例库。Skill 运行时会读取这些文件作为深度参考。

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

---

## 作者

[dontbesilent](https://x.com/dontbesilent)
