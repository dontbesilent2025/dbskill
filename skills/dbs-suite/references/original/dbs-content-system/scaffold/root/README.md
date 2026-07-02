# 内容结构化系统

这是一个把原始内容资产加工为「内容单元」的新工程。

## 先看哪里

1. `SOURCE_OF_TRUTH.md`
2. `AGENTS.md`
3. `03-处理状态/处理状态总览.md`

## 当前默认目标

- 新工程目录已建立
- 规则文件、模板文件、状态文件已建立
- 原始素材副本已复制到 `01-原始素材区/完整副本/`
- 已建立来源注册、原始索引、待处理清单
- 已完成首批样本文稿的内容单元抽取
- 已建立关系索引与关系总览
- 已建立去重候选索引与去重总览
- 已建立主题地图和选题装配层
- 已建立系统总览脚本

## 当前真实基线

- 内容单元：以 `node 07-脚本与工具/summarize-system.js` 输出为准
- 主题地图：以 `node 07-脚本与工具/summarize-system.js` 输出为准
- 装配稿：以 `node 07-脚本与工具/summarize-system.js` 输出为准
- 关系总数：以 `03-处理状态/关系总览.md` 为准
- 去重候选：以 `03-处理状态/去重与冲突总览.md` 为准

说明：静态数字容易过期，不把固定统计写死在本文件里。

## 当前核心目录

- `00-规则与索引/`
- `01-原始素材区/`
- `02-内容单元库/`
- `03-处理状态/`
- `04-模板/`
- `05-主题地图/`
- `06-选题装配/`
- `07-脚本与工具/`

## 处理入口

- 批量生成来源候选：`node 07-脚本与工具/generate-source-registry.js`
- 重建原始索引与待处理清单：`node 07-脚本与工具/rebuild-processing-ledger.js`
- 自动抽取首批样本：`node 07-脚本与工具/extract-sample-units.js --help`
- 基于真实单元重组新选题：`node 07-脚本与工具/assemble-topic-from-units.js --title '你的选题' ...`
- 按选题自动推荐第一版装配：`node 07-脚本与工具/assemble-topic-from-units.js --title '年轻人怎么赚钱' --auto --top 3`
- 生成关系索引：`node 07-脚本与工具/generate-link-map.js`
- 生成去重候选：`node 07-脚本与工具/generate-duplicate-candidates.js`
- 补全 `Obsidian` 链接：`node 07-脚本与工具/fill-obsidian-links.js`
- 输出系统总览：`node 07-脚本与工具/summarize-system.js`

## Obsidian 链接约定

- `frontmatter` 中继续保留单元 `id`，供脚本、索引和关系字段使用
- 正文里引用其他内容单元、主题地图或装配稿时，统一使用 `Obsidian` `[[文件名]]` 直链
- 如果新增或修改了大量正文引用，可运行：`node 07-脚本与工具/fill-obsidian-links.js`

## 当前可验证能力

- 可以按语义块抽出多个真实单元，而不是每篇固定生成占位文件
- 可以生成可点击的主题地图与装配稿，并直接在 `Obsidian` 中跳转
- 可以基于现有内容单元，跨主题重组出新的选题装配稿
- 自动推荐不再只会回到原主题内部，已经可以给宽题拉出跨主题主轴
