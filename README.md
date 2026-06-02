# dbskill
dontbesilent 商业诊断工具箱。从 12,307 条推文中提炼方法论，做成 Claude Code skill。
**所有内容开放，可以整套装，也可以只拿一部分。知识包、原子库、单个公理，都能单独用。**

---

## v2.2 更新
**新增**：
- `/chatroom-austrian` 或 `/奥派` - 奥派经济聊天室（哈耶克 × 米塞斯 × Claude 三人对话）
**优化**：
- 完善 skill 联动：诊断工具遇到哲学问题推到聊天室，聊天室讨论完推回诊断工具

---

## v2.1 更新
**新增**：
- `/dbs-hook` - 短视频开头优化（诊断内容质量 + 生成 10+ 条开头方案）
**优化**：
- `/dbs-unblock` 重命名为 `/dbs-action`（执行力诊断，更直观）
- 更新 skill 协作链路（dbs-content 可推荐 dbs-hook）

---

## v2 更新
- **知识库重建**：从 12,307 条推文中提取 4,176 个知识原子，替代旧的推文堆叠。每个原子有主题标签、Skill 关联、类型分类和置信度评分
- **内联案例**：每个 Skill 新增 3 个正面案例 + 2 个反面案例，直接写在 SKILL.md 里，不依赖外部文件也能用
- **Skill 知识包**：10 个提炼后的方法论文档，按 Skill 需求组织（不再是按学科分类的推文堆叠）

---

## 工具箱

### dbs 诊断工具
| Skill | 做什么 |
|---|---|
| `/dbs` | 主入口，自动路由到对的工具 |
| `/dbs-diagnosis` | 商业模式诊断。消解问题，不回答问题 |
| `/dbs-benchmark` | 对标分析。五重过滤，排除噪音 |
| `/dbs-offer` | 产品化与成交路径诊断。把模糊想法审计成可销售、可交付、可验收的 Offer |
| `/dbs-content` | 内容创作诊断。五维检测 |
| `/dbs-hook` | 短视频开头优化。诊断 + 生成方案 |
| `/dbs-action` | 执行力诊断。阿德勒框架（原 dbs-unblock） |
| `/dbs-deconstruct` | 概念拆解。维特根斯坦式审查 |

### chatroom 系列
| Skill | 做什么 |
|---|---|
| `/chatroom-austrian` 或 `/奥派` | 奥派经济聊天室。哈耶克 × 米塞斯 × Claude 三人对话 ⭐ 新增 |

### 工作流
```
diagnosis（商业模式对不对）
↓
benchmark（找谁模仿）
↓
offer（卖什么、怎么卖、怎么交付） ⭐ 新增
↓
content（内容怎么做）
↓ 发现开头问题
hook（开头怎么优化）
↓
action（做不动怎么办）
deconstruct（随时拆概念）
```

Skill 之间会自动推荐下一步。比如：
- diagnosis 发现方向成立但产品不清楚 → 推荐 offer
- content 发现没有产品或 CTA 接不住成交 → 推荐 offer
- benchmark 找到对标但不知道怎么包装自己的服务 → 推荐 offer
- offer 成立后需要内容获客 → 推荐 content
- offer 涉及重大定价或转型选择 → 推荐 decision
- diagnosis 发现心理问题 → 推荐 action
- content 发现开头问题 → 推荐 hook
- benchmark 发现逃避执行 → 推荐 action

---

## 安装
```bash
npx skills add dontbesilent2025/dbskill
```
或手动：
```bash
git clone https://github.com/dontbesilent2025/dbskill.git /tmp/dbskill && cp -r /tmp/dbskill/skills/dbs* ~/.claude/skills/ && rm -rf /tmp/dbskill
```
安装后在 Claude Code 中输入 `/dbs` 即可。

---

## 知识库
dbskill 的知识库是完全开放的。你不需要安装整套 Skill 才能用——可以只拿走你需要的部分。

### 目录结构
```
知识库/
├── 原子库/ # 结构化知识数据库
│ ├── atoms.jsonl # 4,176 个知识原子（全量）
│ ├── atoms_2024Q4.jsonl # 按季度拆分
│ ├── atoms_2025Q1.jsonl
│ ├── ...
│ └── README.md # 字段说明
│
├── Skill知识包/ # 提炼后的方法论文档
│ ├── diagnosis_公理与诊断框架.md
│ ├── diagnosis_问题消解案例库.md
│ ├── benchmark_对标方法论.md
│ ├── benchmark_平台运营知识.md
│ ├── offer_产品化与成交路径.md ⭐ 新增
│ ├── content_内容创作方法论.md
│ ├── content_平台特性与案例.md
│ ├── unblock_心理诊断框架.md
│ ├── unblock_信号案例库.md
│ ├── deconstruct_语言与概念框架.md
│ └── deconstruct_解构案例库.md
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
- X: [dontbesilent](https://x.com/dontbesilent)
- 小红书: [dontbesilent](https://xhslink.com/m/637xuspR4iI)
- 抖音: [dontbesilent](https://v.douyin.com/pRUDhpBqOrc/)
