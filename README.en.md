# dbskill

[简体中文](README.md) | English | [日本語](README.ja.md) | [한국어](README.ko.md) | [繁體中文](README.zh-TW.md)

> A Chinese AI Skills toolkit for entrepreneurs and content creators. Give your Agent a real business, content, or execution problem, and get a clear judgment plus the next action you can take.

[![Version](https://img.shields.io/badge/version-2.18.48-111111.svg)](VERSION)
[![Skills](https://img.shields.io/badge/Skills-37-111111.svg)](docs/新手入门.md#skill-全目录)
[![License](https://img.shields.io/badge/license-CC%20BY--NC%204.0-111111.svg)](LICENSE)

**Supported in Doubao, WorkBuddy, Claude Code, Codex, and other Agents that support Skills.**

Created by [dontbesilent](https://x.com/dontbesilent), dbskill includes 4,176 knowledge atoms drawn from 16,152 public posts. The toolkit provides 34 current business Skills, 2 legacy entries, and 1 system update entry.

**This update:** Codex Skill lists now show each English identifier with its confirmed Chinese name, making Skills easier to recognize and invoke.

[Quick start](#quick-start) · [Install](#install) · [Capabilities](#capabilities) · [Full guide](docs/新手入门.md) · [Changes](https://github.com/dontbesilent2025/dbskill/commits/main)

![dbskill composition map](docs/skill-link-map-4x3.svg)

## What dbskill helps you solve

You do not need to learn a complex methodology first, or know which tool to invoke. Give `/dbs` your current business situation, material, decision, or blocker. It decides whether one Skill is sufficient; complex tasks can use one lead Skill and up to two supporting Skills.

| Situation | What you get |
| --- | --- |
| Customers say your offer is expensive | Business diagnosis, risks, and validation actions |
| You have a topic but cannot turn it into watchable content | Content direction, hooks, titles, and script improvements |
| You know what to do but cannot move forward | Analysis of the blocker and one concrete starting action |
| You keep facing similar decisions without accumulating experience | Decision records, patterns, and snapshots |
| Your drafts, topics, and cases are scattered | A maintainable content-asset project |

## Quick start

After installation, enter this in your Agent:

```text
/dbs I run coding classes for children. I have 40 paid students, but renewals are low.
Help me determine whether the issue is the product, pricing, or customer segment.
```

`/dbs` reads the current conversation, explains its selection, and generates a prompt you can send directly. Add new facts or feedback after a round, then call `/dbs` again to reassess the current task.

For videos with a three-digit code, use `/dbs list all hidden skills` to see published codes, then `/dbs <code>` to start the matching method. The content is fetched from GitHub when used, so GitHub access is required. New codes do not require another dbskill update. An empty catalog is reported as empty.

When you already know the task, call a Skill directly:

```text
/dbs-diagnosis I offer home-organization consulting for mothers. Clients say it is expensive. What should I change?
/dbs-content I want to discuss “ordinary people should not rush into building a personal brand.” How can I turn this into content?
/dbs-title-cover-intro Here are the first 20 seconds of my video script. Improve the opening: …
/dbs-benchmark I want to study enterprise-service content accounts. Which benchmarks should I research?
```

## Capabilities

| Goal | Main Skills | Typical output |
| --- | --- | --- |
| Evaluate a business, product, price, or customer | `/dbs-diagnosis` | Diagnosis, risks, validation plan |
| Find and study benchmarks | `/dbs-benchmark` | Benchmark shortlist and research framework |
| Audit an experiential claim and ground it in a credible theory | `/dbs-theory-grounding` | Revised claim, theory anchor, case reinterpretation, and boundaries |
| Ground a problem in relevant fields and theories, then study historical analogies | `/dbs-standard-answer` | Theory anchor, case matrix, conditional answer, and failure boundaries |
| Create topics, content, titles, and videos | `/dbs-content`, `/dbs-title-cover-intro` | Direction and publishable copy |
| Extract short-video data and speech transcripts | `/dbs-video-extract` | Work or account data plus Markdown transcripts filed by author and title |
| Create chapter, topic, or step navigation for a video | `/dbs-video-navigation` | Separate navigation MP4, animated progress, timeline, and placement instructions |
| Assess the audience, reach, and commercial value of a whole piece | `/dbs-content-value` | Overall assessment, evidence, and priorities |
| Check content risks before publishing | `/dbs-content-risk-check` | Machine-review signals, substantive issues, and minimal edits |
| Review resonance, logic, and reach | `/dbs-resonate`, `/dbs-script-flow`, `/dbs-spread` | Prioritized edits |
| Clarify concepts, goals, and questions | `/dbs-deconstruct`, `/dbs-goal`, `/dbs-good-question` | Testable definitions and goals |
| Work through procrastination and execution blocks | `/dbs-action` | Blocker analysis and next action |
| Record and review long-term decisions | `/dbs-decision`, `/dbs-save`, `/dbs-restore`, `/dbs-report` | Local decision archive and reports |
| Build content assets and multi-Agent workflows | `/dbs-content-system`, `/dbs-agent-migration`, `/dbs-install-skill` | Local project, topic map, and installation plan |
| Turn a local folder into a knowledge base | `/dbs-knowledge` | Knowledge navigation, version rules, and ready-to-use prompts |
| Turn a recurring task into a Skill | `/dbs-skill-maker` | Installable Skill, validation results, and optional publishing preparation |
| Delegate work and follow up with people | `/dbs-human-dispatch` | Task briefs, feedback, acceptance checks, and progress reports |

See the [full guide and Skill directory](docs/新手入门.md#skill-全目录) for current capabilities, examples, and boundaries.

### Video navigation

```text
/dbs-video-navigation Create chapter navigation and an animated progress bar for this local video.
```

Provide a local video or timestamped SRT. With subtitles alone, also provide the final canvas, frame rate, and video duration. The output is a separate black-background MP4 for a video editor; the source video is not automatically edited or published. The Agent adapts chapters, topics, or steps to the content and checks placement and timing. Requires Python, FFmpeg/ffprobe, and suitable fonts. macOS can use Swift/AppKit; other environments use Pillow and explicit font paths. Video-only input also requires an available transcription tool; any cloud service and upload scope are explained beforehand. Chinese teaching video production has been verified; other genres have not been systematically evaluated.

Use `/dbs-title-cover-intro` for titles, cover text, and video openings. `/dbs-hook` and `/dbs-xhs-title` are retained only for explicit legacy use or version comparisons.

## Install

### Recommended: Claude Code, Doubao, WorkBuddy, Codex, and other Agents supporting Skills

Run in a terminal:

```bash
npx -y skills add dontbesilent2025/dbskill -g --all
```

Return to your Agent and enter `/dbs 新手入门` to begin.

### Claude Code marketplace

You can also install the complete toolkit through the Claude Code marketplace:

```bash
claude plugin marketplace add dontbesilent2025/dbskill
claude plugin install dbs@dontbesilent-skills
```

The `dbs` plugin includes 34 current business Skills, 2 legacy entries, and the `dbs-update` system entry. Claude Code namespaces plugin Skills: use `/dbs:dbs` for the main entry and `/dbs:dbs-diagnosis` for a specific capability.

To install only one capability, choose its marketplace plugin, for example `claude plugin install dbs-diagnosis@dontbesilent-skills`.

![Claude Code installation demo](demo.gif)

### Update

Ask your current Agent:

```text
更新 dbskill
```

This syncs the official dbskill and does not modify records, reports, or decisions under `~/.dbs/`. See the [commit history](https://github.com/dontbesilent2025/dbskill/commits/main) for changes.

## How it works

```text
A real task
   ↓
/dbs reads context and decides between one Skill or a composition
   ↓
It generates a directly usable task prompt
   ↓
The selected Skills deliver one unified result
   ↓
Add results and feedback, then reassess the task
```

## Knowledge base and local records

The repository includes 4,176 structured knowledge atoms, methodology documents organized by Skill, and a high-frequency concept glossary.

- Read the [atom library guide](知识库/原子库/README.md) for data scope and fields.
- Use `知识库/原子库/atoms.jsonl` to build your own RAG.
- Browse the [Skill knowledge packs](知识库/Skill知识包) for the methods.
- Use `/dbs-save`, `/dbs-restore`, and `/dbs-report` for work across conversations. Data stays locally in `~/.dbs/`.

![dbskill knowledge pipeline](docs/knowledge-pipeline.svg)

## Author and support

Author: [@dontbesilent](https://x.com/dontbesilent) · [Xiaohongshu](https://xhslink.com/m/637xuspR4iI) · [Douyin](https://v.douyin.com/pRUDhpBqOrc/)

For paid Q&A support, scan the QR code or see the [group details](https://mp.weixin.qq.com/s/RpwNjMo4M_er4GOrfCYt1g).

![Paid Q&A group QR code](docs/paid-qa-group-qrcode.png)

## License

Licensed under [CC BY-NC 4.0](LICENSE).

- Personal use, study, research, and non-commercial projects are welcome.
- Please attribute the source when you publish derivative work.
- Commercial use requires separate authorization. Contact the author.
