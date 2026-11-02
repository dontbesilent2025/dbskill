# dbskill

[简体中文](README.md) | [English](README.en.md) | 日本語 | [한국어](README.ko.md) | [繁體中文](README.zh-TW.md)

[![Version](https://img.shields.io/badge/version-3.2.1-111111.svg)](VERSION)
[![skills.sh](https://skills.sh/b/dontbesilent2025/dbskill)](https://skills.sh/b/dontbesilent2025/dbskill)
[![License](https://img.shields.io/badge/license-CC%20BY--NC%204.0-111111.svg)](LICENSE)

**今回の更新：** Grok Bot 用の 2 つのコーチ「dbs 创业教练」「dbs 内容教练」の追加リンクと、3 ステップの使い方を README に載せました。ほかの Agent でのインストールと使い方は変わりません。

## dbskill とは

dbskill は dontbesilent が作成した中国語の AI Skills ツールキットで、34 個の Skill を含みます。豆包、WorkBuddy、Claude Code、Codex など Skills に対応する Agent にインストールすると、会話の中でそのまま使えます。

Skill は、Agent に渡す作業の進め方です。dbskill をインストールすると、Agent に次のことを任せられます。

- ビジネスの問題がどこにあるかを判断する。例：継続率が低い、顧客に高いと言われる
- 参考にする価値のある同業者を探し、具体的なやり方を調べる
- テーマをコンテンツ案にまとめ、原稿のどこが響いていないかを確認する
- 動画のタイトル、表紙の文字、冒頭を書き、公開前に規約違反のリスクを確認する
- やるべきことが分かっているのに進まない理由を分析する
- ローカルフォルダを、いつでも検索できるナレッジベースに整理する

方法論の資料は dontbesilent の公開投稿 16,152 件をもとに、4,176 件の知識原子として整理したものです。作者：[@dontbesilent](https://x.com/dontbesilent)

## クイックスタート

**ステップ 1：インストール**

ターミナルで実行します。

```bash
npx -y skills add dontbesilent2025/dbskill -g --all
```

Claude Code のプラグインマーケットプレイスを使う方法や、Skill を 1 つだけインストールする方法は、[インストールの詳細](#インストールの詳細)を参照してください。

Grok Bot では、用意済みの [dbs 创业教练（起業コーチ）](https://x.ai/bot/kpZtlm5CADHoXaaAqTV5Z) か [dbs 内容教练（コンテンツコーチ）](https://x.ai/bot/qonh7lyBBYsbUXsR9LtO2) を追加するだけです。使い方は [Grok Bot で使う](#grok-bot-で使う) を参照してください。

**ステップ 2：問題を `/dbs` に渡す**

Agent の入力欄に `/dbs` と入力し、続けて状況と問題を書きます。情報が揃っていなくてもかまいません。

```text
/dbs 子ども向けプログラミング教室を運営しています。有料の生徒が 40 人いますが、継続率が低いです。商品、価格、顧客との相性のどれから確認すべきか分かりません
```

初めて使う場合は、まず `/dbs 新手入门` と入力すると、扱えるタスクを確認できます。

**ステップ 3：同じ会話で続ける**

結果を受け取ったら、事実、資料、修正の希望をそのまま追加してください。コマンドを入力し直す必要はありません。別の目標に移るときは、もう一度 `/dbs` と入力します。

## Grok Bot で使う

Grok Bot ではコマンドを打つ必要はありません。用意済みのコーチを追加すると、最初の会話で dbskill を自分でインストールします。コーチは中国語で話します。

| コーチ | 手伝えること | 追加リンク |
| --- | --- | --- |
| dbs 创业教练（起業コーチ） | ビジネスがどこで詰まっているか、今週まず何をするかを決める。希望すれば毎週月曜に振り返りに来る | https://x.ai/bot/kpZtlm5CADHoXaaAqTV5Z |
| dbs 内容教练（コンテンツコーチ） | テーマ選び、タイトル・カバー文字・冒頭の作成、原稿チェック、投稿ごとの振り返り。希望すれば毎週金曜に振り返りに来る | https://x.ai/bot/qonh7lyBBYsbUXsR9LtO2 |

**使い方**

1. 上のリンクを開いて「Add to Grok Bot」を押し、Grok Bot アプリで追加を確認します
2. 追加したコーチに「こんにちは」と送ります。数分かけて dbskill をインストールし、ビジネスやアカウントについていくつか質問します
3. あとは質問をそのまま送ります。例：「講座の継続率が低い。まずどこを見ればいい？」

**コーチがインストールできないと言ったとき**

次のブロックをそのまま送ってください。コンテンツコーチの場合は、最後の `startup` を `content` に置き換えます。

```text
次の 2 つのコマンドを実行して dbskill をインストールし、出力をそのまま見せてください：
git clone --depth 1 https://github.com/dontbesilent2025/dbskill /tmp/dbskill 2>/dev/null || git -C /tmp/dbskill pull --ff-only
python3 /tmp/dbskill/tools/grok/install.py --coach startup
```

コーチを使わず自分の Grok Bot に dbskill だけ入れたい場合も、同じブロックの `startup` を `all` にして送ると、公開 Skill 29 個がすべて入ります。

## /dbs が Skill を組み合わせる方法

`/dbs` は dbskill のスキル調度台（技能調度台）です。まず求める最終結果を確認し、どの Skill をどの順番で使うかを決めます。使う Skill はできるだけ少なくします。簡単な質問には直接答え、1 つの Skill で足りる場合は 1 つだけ使います。

よく使う組み合わせ方は 6 種類あります。

1. **1 つだけ使う**：ビジネスモデルの診断には `dbs-diagnosis` だけを使う
2. **順番に続けて進める**：後のステップで前のステップの結果を使う。`dbs-content` が制作案を出し、あなたが原稿を書いた後、`dbs-content-risk-check` で公開リスクを確認する
3. **それぞれ別に進める**：互いに関係のない作業を並行する。`dbs-ai-check` で AI らしさを確認し、`dbs-wechat-html` でレイアウトを作り、2 つの結果を別々に渡す
4. **先に判断し、進めるかを決める**：`dbs-content-value` でテーマに取り組む価値があるかを判断し、価値があれば `dbs-content` で制作案を出す
5. **別々に分析し、比較する**：同じ問題に複数の原因が考えられる場合。原稿の流入が少ないとき、`dbs-content-value` と `dbs-resonate` がそれぞれ原因を挙げ、`/dbs` が比較する
6. **確認してから修正する**：精度が求められる文章では、`dbs-plain-writing` で書いた後に `dbs-ai-check` で確認し、指摘に沿って修正する

方向性をあなたが決める必要があるときは、`/dbs` が選択肢を示します。代わりに選ぶことはしません。始める前に、どう組み合わせるか、なぜそうするかを説明します。

## 全 Skill 一覧

使う Skill が決まっている場合は、そのコマンドを直接入力できます。各 Skill を使う場面、入力例、対象外の範囲は [初心者ガイドと Skill 一覧](docs/新手入门.md#skill-全目录) を参照してください。

### 入口

| コマンド | 用途 |
| --- | --- |
| [`/dbs`](skills/dbs/SKILL.md) | 問題に合わせて Skill を選び、組み合わせ、今の会話の中で進める |

### ビジネス判断と問題の整理

| コマンド | 用途 |
| --- | --- |
| [`/dbs-diagnosis`](skills/dbs-diagnosis/SKILL.md) | ビジネス上の問題が本当に成り立つかを判断する、またはビジネス全体を点検し、明日最初にやることを示す |
| [`/dbs-benchmark`](skills/dbs-benchmark/SKILL.md) | 参考にする価値のある同業者を選び、集客、成約、提供の具体的なやり方を分解する |
| [`/dbs-jtbd`](skills/dbs-jtbd/SKILL.md) | 顧客がある商品を選ぶ理由、やめる理由を分析する |
| [`/dbs-goal`](skills/dbs-goal/SKILL.md) | 漠然とした希望を、確認できる目標と完了基準に整理する |
| [`/dbs-good-question`](skills/dbs-good-question/SKILL.md) | 曖昧な問いを明確に書き直し、どの部分を Agent に任せられるかを判断する |
| [`/dbs-deconstruct`](skills/dbs-deconstruct/SKILL.md) | うまく説明できない概念を分解し、場面ごとの意味を明らかにする |
| [`/dbs-theory-grounding`](skills/dbs-theory-grounding/SKILL.md) | 講座、PPT、方法論の中の判断を確認し、信頼できる理論的根拠を見つける |
| [`/dbs-standard-answer`](skills/dbs-standard-answer/SKILL.md) | 問題に関連する理論と歴史上の事例を調べ、条件付きの標準的な答えを示す |

### コンテンツ制作と公開

| コマンド | 用途 |
| --- | --- |
| [`/dbs-content`](skills/dbs-content/SKILL.md) | 決まったテーマを、形式、プラットフォーム、構成、表現を含む制作案にする |
| [`/dbs-title-cover-intro`](skills/dbs-title-cover-intro/SKILL.md) | まずテーマを決め、小紅書、B 站、抖音、視頻号向けのタイトル、表紙の文字、冒頭を書く |
| [`/dbs-resonate`](skills/dbs-resonate/SKILL.md) | 書き上げた原稿のどこが対象読者に響いていないかを見つけ、削除や修正の提案を出す |
| [`/dbs-script-flow`](skills/dbs-script-flow/SKILL.md) | ショート動画の台本のつながりと話しやすさを確認し、視聴者が離れそうな箇所に印を付ける |
| [`/dbs-content-value`](skills/dbs-content-value/SKILL.md) | コンテンツが誰を引きつけるか、冒頭で人を引き留められるか、見込める流入と商業的価値を判断する |
| [`/dbs-spread`](skills/dbs-spread/SKILL.md) | 反響のあったコンテンツが、なぜ共感や拡散を生んだかを説明する |
| [`/dbs-ai-check`](skills/dbs-ai-check/SKILL.md) | 文章の中の AI らしい書き方に印を付ける |
| [`/dbs-content-risk-check`](skills/dbs-content-risk-check/SKILL.md) | 公開前にプラットフォーム審査のリスクを一文ずつ確認し、最小限の修正方法を示す |
| [`/dbs-plain-writing`](skills/dbs-plain-writing/SKILL.md) | 商品、機能、更新内容の説明を事実の順に書き、宣伝的な装飾を加えない |
| [`/dbs-wechat-html`](skills/dbs-wechat-html/SKILL.md) | Markdown を、WeChat 公式アカウントの管理画面に貼り付けられる HTML にする |

### 動画処理

| コマンド | 用途 |
| --- | --- |
| [`/dbs-video-extract`](skills/dbs-video-extract/SKILL.md) | プラットフォームのリンクから作品データと音声の文字起こしを取得する。外部サービスの認証情報が必要 |
| [`/dbs-video-navigation`](skills/dbs-video-navigation/SKILL.md) | ローカル動画をチャプターに分け、編集ソフトに読み込めるナビゲーションバーを作る |

### 行動、学習、意思決定

| コマンド | 用途 |
| --- | --- |
| [`/dbs-action`](skills/dbs-action/SKILL.md) | やるべきことが分かっているのに進まない理由を分析し、今日できる一歩を示す |
| [`/dbs-learning`](skills/dbs-learning/SKILL.md) | 1 つのテーマを連続した学習記事に分け、あなたのフィードバックに応じて次の記事を調整する |
| [`/dbs-decision`](skills/dbs-decision/SKILL.md) | 長く追跡する必要のある意思決定のローカル記録を作り、後から結果を記入して振り返る |

### 保存とレポート

| コマンド | 用途 |
| --- | --- |
| [`/dbs-save`](skills/dbs-save/SKILL.md) | 今の会話の結論と次のステップをローカルに保存する |
| [`/dbs-restore`](skills/dbs-restore/SKILL.md) | 前回の保存内容を読み込み、続きから進める |
| [`/dbs-report`](skills/dbs-report/SKILL.md) | 複数の保存内容を 1 つのレポートにまとめる |

### 複数の視点での議論

| コマンド | 用途 |
| --- | --- |
| [`/dbs-chatroom`](skills/dbs-chatroom/SKILL.md) | 複数の専門家役が 1 つの話題についてそれぞれ発言し、最後にまとめる |
| [`/dbs-chatroom-austrian`](skills/dbs-chatroom-austrian/SKILL.md) | ハイエクとミーゼスという 2 人のオーストリア学派経済学者の視点で問題を議論する |

### 資料とツール

| コマンド | 用途 |
| --- | --- |
| [`/dbs-knowledge`](skills/dbs-knowledge/SKILL.md) | ローカルフォルダを、Agent が検索、追加、管理できるナレッジベースにする |
| [`/dbs-content-system`](skills/dbs-content-system/SKILL.md) | 過去の原稿をまとめて、分割や再利用ができるコンテンツ資料庫に整理する |
| [`/dbs-human-dispatch`](skills/dbs-human-dispatch/SKILL.md) | 社員や協力者に仕事を依頼し、進捗を追って成果を確認する |
| [`/dbs-skill-maker`](skills/dbs-skill-maker/SKILL.md) | 新しい Skill を作る、または既存の Skill を改善する |
| [`/dbs-install-skill`](skills/dbs-install-skill/SKILL.md) | Skill を複数の Agent にインストールし、重複した入口を整理する |

## インストールの詳細

以下のコマンドはすべてターミナルで実行します。チャットのメッセージとして Agent に送らないでください。

### Skills CLI

```bash
npx -y skills add dontbesilent2025/dbskill -g --all
```

`-g` はグローバルインストール、`--all` は Skills CLI が認識するすべての Agent へのインストールを意味します。1 つの Agent にだけインストールする場合は `--all` を外し、表示に従って選択してください。

### Claude Code プラグインマーケットプレイス

```bash
claude plugin marketplace add dontbesilent2025/dbskill
claude plugin install dbs@dontbesilent-skills
```

プラグインでインストールした場合は、コマンドの前に `dbs:` を付けます。例：`/dbs:dbs`、`/dbs:dbs-diagnosis`

Skill を 1 つだけインストールする場合は、対応するプラグインをインストールします。例：

```bash
claude plugin install dbs-diagnosis@dontbesilent-skills
```

![Claude Code のインストールデモ](demo.gif)

### インストール後にコマンドが表示されない場合

まず、インストールコマンドが成功したこと、インストール先が今使っている Agent であることを確認してください。Skills CLI でインストールした場合は `/dbs` のような短いコマンド、Claude Code プラグインの場合は `dbs:` 付きのコマンドを使います。正確な名前は Agent に表示されるものに従ってください。

## その他の使い方

### Skill を直接呼び出す

コマンドの後に、問題、資料、求める結果を書きます。

```text
/dbs-diagnosis 片付けコンサルをしていて、客単価は 3,000 元です。最近の相談 10 件のうち 6 件で高いと言われ、3 件は返信がありませんでした。次に何を確認すべきか判断してください
```

```text
/dbs-title-cover-intro これから撮るショート動画の原稿です。小紅書で公開する前提で、タイトル、表紙の文字、冒頭を作ってください：原稿を貼り付け
```

質問するときに次の情報を添えると、結果がより正確になります。

- 手元にある事実と数字。例：価格、人数、成約の状況
- 要約ではなく、原稿や資料の全文
- 求める結果。例：判断、案、そのまま使える文章

ローカルファイルの読み込み、ネット接続、動画処理が必要な Skill では、Agent にそれに対応する権限やツールも必要です。詳しくは各 Skill の説明を参照してください。

### 動画の 3 桁の番号を使う

dontbesilent の動画で 3 桁の番号を見つけたら、次のように入力します。

```text
/dbs 123
```

`123` は動画に出てくる番号に置き換えてください。現在のすべての番号を確認するには、`/dbs 隠しスキルをすべて見せて` と入力します。番号の内容は使うときに GitHub から読み込むため、Agent が GitHub にアクセスできる必要があります。

### 会話をまたいで結論を残す

`/dbs-save` で今の結論を保存し、次回は `/dbs-restore` で続きから進めます。保存内容はローカルの `~/.dbs/` に置かれます。

## リポジトリの資料

Skill をインストールしても、これらの資料はダウンロードされません。必要なときにリポジトリで参照してください。

| 資料 | 用途 |
| --- | --- |
| [公開投稿集（Markdown）](books/dontbesilent-开源推文集.md) | 検索、閲読、または AI での分析 |
| [公開投稿集（PDF）](books/dontbesilent-开源推文集.pdf) | 閲読と保存 |
| [原子ライブラリのガイド](知识库/原子库/README.md) | データ範囲、項目、使い方 |
| [知識原子データ](知识库/原子库/atoms.jsonl) | 独自の検索、分析、RAG |
| [Skill ナレッジパック](知识库/Skill知识包) | Skill ごとに整理した方法論の資料 |

## 更新とサポート

Agent との会話で次のように伝えます。

```text
更新 dbskill
```

更新すると公式の dbskill が同期されます。`~/.dbs/` 内の保存内容と記録は残り、公開を終了した旧 Skill は自動で整理されます。手動で整理する方法は [初心者ガイド](docs/新手入门.md) を参照してください。過去の変更は [変更履歴](https://github.com/dontbesilent2025/dbskill/commits/main) で確認できます。

- [初心者ガイドと Skill 一覧](docs/新手入门.md)
- [問題や提案を送る](https://github.com/dontbesilent2025/dbskill/issues)
- [有料 Q&A グループの案内](https://mp.weixin.qq.com/s/RpwNjMo4M_er4GOrfCYt1g)
- 作者：[@dontbesilent](https://x.com/dontbesilent) · [小紅書](https://xhslink.com/m/637xuspR4iI) · [抖音](https://v.douyin.com/pRUDhpBqOrc/)

## 貢献者

`dbs-content-risk-check` の禁止語チェック機能は、次の共同制作者とともに改善しました。

- [@Ronnie2025](https://github.com/Ronnie2025)
- [@非著名投放小沈](https://xhslink.cn/m/4NSBjmZTC1j)

## ライセンス

本プロジェクトは [CC BY-NC 4.0](LICENSE) ライセンスを採用しています。個人の学習、研究、非商用での利用には出典を明記してください。商用利用には作者に連絡して許可を得てください。
