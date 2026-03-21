# dbskill for OpenAI Codex CLI (in macOS Terminal.app)

dontbesilent’s business diagnosis toolkit. Methodologies distilled from 12,307 tweets, packaged as Codex skills.

**Everything is open. You can install the full set, or just take the parts you need. The knowledge packs, the atom library, and even individual axioms can all be used independently.**

---

## v2 Updates

- **Knowledge base rebuilt**: 4,176 knowledge atoms extracted from 12,307 tweets, replacing the old tweet-stacking approach. Each atom includes topic tags, Skill associations, type classification, and a confidence score
- **Inline cases**: each Skill now includes 3 positive cases + 2 negative cases directly inside `SKILL.md`, so it can work even without external files
- **Skill knowledge packs**: 10 distilled methodology documents, organized by Skill needs (no longer tweet stacks organized by discipline)

---

## Toolbox

| Skill | What it does |
|---|---|
| `/dbs` | Main entry point, automatically routes to the right tool |
| `/dbs-diagnosis` | Business model diagnosis. Dissolves problems instead of answering problems |
| `/dbs-benchmark` | Benchmark analysis. Five-layer filtering to remove noise |
| `/dbs-content` | Content creation diagnosis. Five-dimensional inspection |
| `/dbs-unblock` | Execution diagnosis. Adlerian framework |
| `/dbs-deconstruct` | Concept deconstruction. Wittgenstein-style scrutiny |

### Workflow

```

diagnosis (is the business model correct?)
↓
benchmark (who should you imitate?)
↓
content (how should the content be made?)
↓
unblock (what to do if you cannot execute?)

deconstruct (deconstruct concepts at any time)

````

Skills will automatically recommend the next step. For example, if diagnosis detects signals of a psychological blockage, it will suggest that you move to unblock.

---

## Installation for Codex CLI (in Terminal.app)

This repository is an installation guide for a skill pack used with **OpenAI Codex CLI**.

The purpose of this repository is to install the provided skills into your local Codex skills directory, so that they can be recognized and invoked by Codex.

This guide is intended for **macOS users** and uses **Terminal.app** by default for installation.

### Step 1: Check whether the `~/.agents/skills` folder already exists

Run this in Terminal:

```bash
ls -ld ~/.agents/skills
````

If the folder already exists, you **do not need to create it again**.

If the system says that the directory does not exist, continue to the next step to create it.

---

### Step 2: If the directory does not exist, create `~/.agents/skills`

```bash
mkdir -p ~/.agents/skills
```

### Step 3: Clone this repository into `/tmp`

Run:

```bash
git clone https://github.com/eawlot3000/dbskill.git /tmp/dbskill
```

Notes:

* This clones the repository temporarily into `/tmp/dbskill`
* `/tmp` is a temporary directory, which is suitable for this kind of relay-style installation
* This prevents the repository from being downloaded directly into your current working directory

---

### Step 4: Copy the skills from the repository into the Codex skills directory

Run:

```bash
cp -R /tmp/dbskill/skills/* ~/.agents/skills/
```

Notes:

* `cp` means copy
* `-R` means recursively copy the entire directory contents
* This command copies all skill folders under `/tmp/dbskill/skills/` into `~/.agents/skills/`

---

### Step 5: Optional — remove the temporary cloned directory

Run:

```bash
rm -rf /tmp/dbskill
```

Notes:

* This step is not required
* It only removes the temporary repository copy that was cloned into `/tmp`
* It does not affect the content already copied into `~/.agents/skills/`

---

## One-command installation

If you do not want to run everything step by step, you can also run the full set of commands below directly:

```bash
mkdir -p ~/.agents/skills
git clone https://github.com/eawlot3000/dbskill.git /tmp/dbskill
cp -R /tmp/dbskill/skills/* ~/.agents/skills/
rm -rf /tmp/dbskill
```

---

## How to verify that the installation succeeded

After installation, you can first start Codex:

```bash
codex
```

After entering Codex, you can try checking whether the skills have been recognized.

Some Codex environments support entering:

```text
/skills
```

to view the currently available skills.

You can also try directly invoking a skill, for example:

```text
$dbs
```

If your Codex environment supports explicit skill invocation, it should recognize the installed skills.

---

## How to uninstall

If you no longer want to use these skills later, you can manually open the following directory:

```bash
open ~/.agents/skills
```

Then delete the corresponding skill folders.

---

## Knowledge Base

The dbskill knowledge base is fully open. You do not need to install the full Skill set in order to use it — you can take only the parts you need.

### Directory Structure

```text
知识库/
├── 原子库/                     # Structured knowledge database
│   ├── atoms.jsonl             # 4,176 knowledge atoms (full set)
│   ├── atoms_2024Q4.jsonl      # Split by quarter
│   ├── atoms_2025Q1.jsonl
│   ├── ...
│   └── README.md               # Field descriptions
│
├── Skill知识包/                # Distilled methodology documents
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

### What is the atom library?

Each knowledge atom is one knowledge point distilled from a tweet, structured as JSON:

```json
{
  "id": "2024Q4_042",
  "knowledge": "One necessary condition for judging whether a business is viable is whether you can state the color of the product.",
  "original": "One necessary condition for judging whether a business is viable is whether you can state the color of the product...",
  "url": "https://x.com/dontbesilent/status/...",
  "date": "2024-10-01",
  "topics": ["Business Models and Pricing", "Language and Thinking"],
  "skills": ["dbs-diagnosis", "dbs-deconstruct"],
  "type": "anti-pattern",
  "confidence": "high"
}
```

**Field descriptions:**

| Field        | Description                                               |
| ------------ | --------------------------------------------------------- |
| `knowledge`  | The distilled knowledge point                             |
| `original`   | The original tweet text (≤ 200 characters)                |
| `topics`     | 10 topic categories (multiple selections allowed)         |
| `skills`     | Associated Skills                                         |
| `type`       | principle / method / case / anti-pattern / insight / tool |
| `confidence` | high / medium / low                                       |

### What are the Skill knowledge packs?

Each Skill has 2 knowledge packs — one framework/methodology pack and one case library. When a Skill runs, it reads these files as deep reference material.

Even if you do not install the Skill, you can still read these `.md` files directly. They are standalone, readable methodology documents.

### How to use it in your own projects

**Scenario 1: Give your AI business diagnosis capability**

Paste the contents of `知识库/Skill知识包/diagnosis_公理与诊断框架.md` into your system prompt. Your AI will then have the 6 axioms + the problem-dissolving funnel.

**Scenario 2: Build a RAG knowledge base**

Import `知识库/原子库/atoms.jsonl` into your vector database. 4,176 structured knowledge points, each with topic tags, naturally suited for retrieval.

**Scenario 3: You only want cases**

Only look at atoms with `type: "case"` or `type: "anti-pattern"`. That gives you roughly 700+ real business cases and negative cases.

**Scenario 4: Build a chatbot**

Use the methodologies in the Skill knowledge packs as the system prompt, and use the atom library for RAG enhancement. No need to install Claude Code.

**Scenario 5: Learning and research**

Filter by `topics` and only look at the fields you care about. For example, there are 296 entries whose `topics` include `"Psychology and Execution"`.

---

## License

This project is licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).

* Personal use, learning, research, and non-commercial projects: no attribution required, no application required
* Public release of derivative works (articles, tools, courses, etc.): please cite the source
* Commercial use: separate authorization is required, please contact the author

---

## Author

[dontbesilent](https://x.com/dontbesilent)
