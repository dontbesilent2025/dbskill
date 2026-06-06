# dbs-content-system Quickstart

## 定位

`dbs-content-system` 是 `dbskill` 里的进阶内容工程模块。

它适合这类用户：

- 本地已经积累了大量文稿、推文、课程稿、案例素材
- 不只是想改一篇内容，而是想把旧内容变成可复用资产
- 愿意先做样本验证，再逐步推进批量结构化

它不适合这类用户：

- 只有零散素材
- 只想优化单篇内容
- 还没有明确边界就想一口气全量处理

## 安装

整套安装：

```bash
npx -y skills add dontbesilent2025/dbskill -g --all
```

单独安装本模块：

```bash
npx -y skills add dontbesilent2025/dbskill --skill dbs-content-system
```

## 最短启动链路

### 1. 初始化新工程

```bash
node tools/init-content-system.js /你的/新工程目录
```

### 2. 复制首批样本文稿

把 `3` 到 `5` 篇代表性文稿复制到：

`01-原始素材区/完整副本/`

优先级：

- 已经有清晰标题、分段、小标题的 `Markdown`
- 已经带有「核心观点提炼」「概念定义」「适用场景」之类区块的主稿
- 不要先拿导出版 `HTML` 做首批验证

### 3. 生成来源候选与原始索引

```bash
cd /你的/新工程目录
node 07-脚本与工具/generate-source-registry.js
node 07-脚本与工具/rebuild-processing-ledger.js
```

### 4. 自动抽取首批样本

```bash
node 07-脚本与工具/extract-sample-units.js --files '完整副本/路径1.md,完整副本/路径2.md,完整副本/路径3.md'
```

首批验证不要只挑同一种稿子。

至少覆盖：

- 1 篇「兴趣变现 / 生产型兴趣」类文稿
- 1 篇「找生意 / 反赛道思维」类文稿
- 1 篇「稳定收入 / 反脆弱」类文稿
- 1 篇「系统赚钱 / 被动收入」类文稿
- 1 篇「需求倒推 / 老板思维」类文稿

这样才能看出抽取器是不是只对单一题材成立。

### 5. 跑校验链路

```bash
node 07-脚本与工具/generate-link-map.js
node 07-脚本与工具/generate-duplicate-candidates.js
node 07-脚本与工具/fill-obsidian-links.js
node 07-脚本与工具/summarize-system.js
```

### 6. 用真实单元重组一个新选题

手工指定单元：

```bash
node 07-脚本与工具/assemble-topic-from-units.js \
  --title '年轻人怎么赚钱（结构化重组版）' \
  --question 'QST-20260602-192,QST-20260602-199' \
  --concept 'CON-20260602-190,CON-20260602-194' \
  --opinion 'OPI-20260602-200,OPI-20260602-198' \
  --case 'CAS-20260602-192,CAS-20260602-199' \
  --solution 'SOL-20260602-176,SOL-20260602-186'
```

按选题标题自动推荐：

```bash
node 07-脚本与工具/assemble-topic-from-units.js \
  --title '年轻人怎么赚钱' \
  --auto \
  --top 3
```

说明：

- `--auto` 会按标题自动推荐每类单元的候选组合
- `--auto` 现在会优先尝试给宽题选出一条主轴，再补充跨主题单元
- 对于「年轻人怎么赚钱」这类宽题，主问题可以来自「兴趣变现」，主观点可以来自「需求倒推」，这正是系统要实现的重组能力
- 自动推荐结果已经可以作为第一版装配稿，但正式对外输出前仍要人工复核

## 跑完之后应该看到什么

- `02-内容单元库/` 里出现第一批内容单元
- `05-主题地图/` 里出现主题地图
- `06-选题装配/` 里出现装配稿
- `03-处理状态/` 里出现来源候选、原始索引、待处理清单、关系索引、去重候选和状态总览

还要额外检查：

- 内容单元不是标题回填
- 观点、概念、案例、方案字段已经能脱离原文被调用
- 主题地图和装配稿不是空壳
- 主题地图已经变成主题入口，而不是只列 5 个文件
- 装配稿已经写出「目标受众 / 装配理由 / 建议结构 / 表达骨架」
- 至少抽查 1 份装配稿，确认不回原文也能看懂为什么这样组
- 至少跑 1 次 `assemble-topic-from-units.js`，确认系统已经能从现有单元重组新选题
- 至少跑 1 次 `assemble-topic-from-units.js --auto`，确认自动推荐不是只会回到原主题内部，而是能拉出跨主题的主观点或补充单元

## 先看哪里

新工程初始化后，优先阅读：

1. `README.md`
2. `SOURCE_OF_TRUTH.md`
3. `03-处理状态/处理状态总览.md`
