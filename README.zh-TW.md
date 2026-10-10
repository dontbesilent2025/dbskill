# dbskill

[简体中文](README.md) | [English](README.en.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | 繁體中文

> 給創業者與內容創作者使用的中文 AI Skills 工具箱。把真實的商業、內容與行動問題交給 Agent，取得清晰判斷與可以立即執行的下一步。

[![Version](https://img.shields.io/badge/version-2.18.48-111111.svg)](VERSION)
[![Skills](https://img.shields.io/badge/Skills-37-111111.svg)](docs/新手入门.md#skill-全目录)
[![License](https://img.shields.io/badge/license-CC%20BY--NC%204.0-111111.svg)](LICENSE)

**支援：豆包、WorkBuddy、Claude Code、Codex，以及其他支援 Skills 的 Agent。**

dbskill 由 [dontbesilent](https://x.com/dontbesilent) 建立。方法資料包含從 16,152 則公開貼文整理的 4,176 個知識原子；工具箱提供 34 個現行業務 Skill、2 個舊版相容入口和 1 個系統更新入口。

**本次更新：** Codex 技能清單同時顯示英文識別名稱與已確認的中文名稱，方便辨識與呼叫。

[快速開始](#快速開始) · [安裝](#安裝) · [能力一覽](#能力一覽) · [完整指南](docs/新手入门.md) · [更新紀錄](https://github.com/dontbesilent2025/dbskill/commits/main)

![dbskill 動態編排圖](docs/skill-link-map-4x3.svg)

## dbskill 可以處理什麼問題

你不需要先學一套複雜方法，也不需要知道該呼叫哪個工具。把眼前的商業處境、材料、選擇或卡點交給 `/dbs`，它會判斷單個 Skill 是否足夠；複雜任務可以編排 1 個主 Skill 和最多 2 個輔助 Skill。

| 真實處境 | 你會得到 |
| --- | --- |
| 客戶總說貴 | 商業診斷、風險判斷與驗證動作 |
| 有一個主題，卻做不出有人看的內容 | 內容方向、開頭、標題與逐字稿優化 |
| 知道該做什麼，卻遲遲推不動 | 對行動卡點的分析與一條可開始的動作 |
| 反覆面對同類選擇，經驗無法累積 | 可回填的決策紀錄、規律與階段快照 |
| 文稿、選題、案例散落各處 | 可持續維護的內容資產工程 |

## 快速開始

安裝後，直接在 Agent 中輸入：

```text
/dbs 我做兒童程式設計課，已經有 40 個付費學員，但續費率很低。
我需要判斷問題出在產品、定價，還是我找錯了客戶。
```

`/dbs` 會讀取目前的對話資訊，說明推薦理由，並生成一段可以直接繼續發送的提示詞。完成一輪後，補充新的事實或回饋，再輸入 `/dbs`，它會重新判斷目前任務需要單項還是組合。

影片附有三位數編號時，輸入 `/dbs 給我所有隱藏版 Skill` 可查詢已發布的編號，輸入 `/dbs <編號>` 可直接使用對應方法。內容會在使用時從 GitHub 讀取，因此需要能連上 GitHub；日後新增編號無須再次更新 dbskill。尚無已發布編號時，目錄會如實提示。

已經知道需求時，可以直接呼叫具體 Skill：

```text
/dbs-diagnosis 我做面向媽媽的收納諮詢，客戶總覺得貴。我該調整什麼？
/dbs-content 我想講「普通人別急著做個人 IP」，這個選題怎樣做成內容？
/dbs-title-cover-intro 這是我短影片前 20 秒的逐字稿，請幫我優化開頭：……
/dbs-benchmark 我想研究企業服務內容帳號，應該找哪些對標？
```

## 能力一覽

| 工作目標 | 主要入口 | 常見產出 |
| --- | --- | --- |
| 判斷生意、產品、定價與客戶 | `/dbs-diagnosis` | 商業診斷、風險、驗證方案 |
| 找對標並提煉可學習的部分 | `/dbs-benchmark` | 對標篩選與研究框架 |
| 審查經驗判斷並找到可信理論依據 | `/dbs-theory-grounding` | 命題修正、理論錨點、案例重釋與適用邊界 |
| 先挖掘相關領域、作者和可信理論，再研究歷史同構答案 | `/dbs-standard-answer` | 理論錨點、案例矩陣、條件性答案與失效邊界 |
| 做選題、內容、標題與短影片 | `/dbs-content`、`/dbs-title-cover-intro` | 內容方向與可發布文案 |
| 提取短影片資料與語音文字稿 | `/dbs-video-extract` | 作品／帳號資料、依作者與標題歸檔的 Markdown 文字稿 |
| 製作影片章節、話題或步驟導航 | `/dbs-video-navigation` | 獨立導航 MP4、動態進度條、時間表與擺放說明 |
| 評估整份內容的受眾、流量與商業價值 | `/dbs-content-value` | 整體判斷、證據與改善優先順序 |
| 發布前檢查敏感詞、導流、廣告與受限內容 | `/dbs-content-risk-check` | 機器審核訊號、內容問題與最小修改動作 |
| 檢查文稿共鳴、邏輯與傳播性 | `/dbs-resonate`、`/dbs-script-flow`、`/dbs-spread` | 修改意見與優先順序 |
| 釐清概念、目標和問題 | `/dbs-deconstruct`、`/dbs-goal`、`/dbs-good-question` | 可驗證的定義與行動目標 |
| 處理拖延與行動受阻 | `/dbs-action` | 卡點分析與下一步動作 |
| 紀錄、復盤長期決策 | `/dbs-decision`、`/dbs-save`、`/dbs-restore`、`/dbs-report` | 本機決策檔案與報告 |
| 建立內容資產與多端 Agent 工作台 | `/dbs-content-system`、`/dbs-agent-migration`、`/dbs-install-skill` | 本機工程、主題地圖與安裝方案 |
| 把本機資料夾變成知識庫 | `/dbs-knowledge` | 知識庫導航、版本規則與可直接使用的提問入口 |
| 把反覆出現的任務製作成 Skill | `/dbs-skill-maker` | 可安裝 Skill、驗證結果與可選的發布準備 |
| 將任務交給員工並跟進成果 | `/dbs-human-dispatch` | 委派說明、回饋答疑、成果驗收與進度彙報 |

現行功能、輸入範例與分工，見 [新手入門與 Skill 全目錄](docs/新手入门.md#skill-全目录)。

### 影片導航怎樣使用

```text
/dbs-video-navigation 為這條本機影片製作章節導航和動態進度條。
```

提供本機影片或帶時間戳的 SRT；只有字幕時，還需最終畫布、幀率和總時長。輸出為可匯入剪輯軟體的獨立黑底 MP4，不會自動剪輯或發布原片。Agent 會按內容選擇章節、話題或步驟，檢查布局和時間對應。需要 Python、FFmpeg/ffprobe 和適用字型；macOS 可用 Swift/AppKit，其他環境使用 Pillow 和指定字型。只有影片時另需轉寫工具，雲端轉寫會事先說明服務和上傳範圍。已驗證中文教學影片，其他類型尚未系統性驗證。

標題、封面文字和短影片開頭統一使用 `/dbs-title-cover-intro`。舊 `/dbs-hook` 和 `/dbs-xhs-title` 僅保留供明確呼叫及版本對照。

## 安裝

### 推薦：Claude Code、豆包、WorkBuddy、Codex 與其他支援 Skills 的 Agent

在終端機執行：

```bash
npx -y skills add dontbesilent2025/dbskill -g --all
```

安裝後回到 Agent，輸入 `/dbs 新手入门` 即可開始。

### Claude Code 外掛市集

也可以透過 Claude Code 外掛市集安裝完整工具箱：

```bash
claude plugin marketplace add dontbesilent2025/dbskill
claude plugin install dbs@dontbesilent-skills
```

`dbs` 外掛包含 34 個現行業務 Skill、2 個舊版相容入口和 1 個 `dbs-update` 更新入口。Claude Code 的主入口使用 `/dbs:dbs`，具體能力例如 `/dbs:dbs-diagnosis`。

只想安裝一個能力時，可以在外掛市集中選擇對應外掛，例如 `claude plugin install dbs-diagnosis@dontbesilent-skills`。

![Claude Code 外掛安裝示範](demo.gif)

### 更新

已安裝 dbskill 時，直接對目前的 Agent 說：

```text
更新 dbskill
```

它會同步官方 dbskill，不會修改 `~/.dbs/` 中的存檔、報告和決策紀錄。版本變更見 [提交紀錄](https://github.com/dontbesilent2025/dbskill/commits/main)。

## dbskill 怎樣工作

```text
真實任務
   ↓
/dbs 讀取上下文並判斷單項或主輔組合
   ↓
生成一段可以直接繼續發送的提示詞
   ↓
入選 Skill 交付一份統一結果
   ↓
補充結果與回饋，再重新編排
```

## 知識庫與本機紀錄

倉庫公開了 4,176 條結構化知識原子、依 Skill 整理的方法論文件與高頻概念詞典。

- 想查看資料範圍與欄位，閱讀[原子庫說明](知识库/原子库/README.md)。
- 想建立自己的 RAG，可使用 `知识库/原子库/atoms.jsonl`。
- 想了解各項方法，瀏覽 [Skill 知識包](知识库/Skill知识包)。
- 想跨對話保留工作，使用 `/dbs-save`、`/dbs-restore` 與 `/dbs-report`。資料預設儲存在本機的 `~/.dbs/`。

![dbskill 知識來源圖](docs/knowledge-pipeline.svg)

## 作者與支援

作者：[@dontbesilent](https://x.com/dontbesilent) · [小紅書](https://xhslink.com/m/637xuspR4iI) · [抖音](https://v.douyin.com/pRUDhpBqOrc/)

如需加入付費問答群，可掃描 QR Code 或開啟[群組說明](https://mp.weixin.qq.com/s/RpwNjMo4M_er4GOrfCYt1g)。

![付費問答群 QR Code](docs/paid-qa-group-qrcode.png)

## 授權條款

本專案採用 [CC BY-NC 4.0](LICENSE) 授權條款。

- 個人使用、學習、研究與非商業專案可以直接使用。
- 公開發布衍生作品時，請註明來源。
- 商業用途需要另行授權，請聯絡作者。
