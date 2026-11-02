#!/usr/bin/env python3
"""把 dbskill 的正式 Skill 生成 Grok Bot 版，并安装进 Grok Bot 的技能库。

Grok Bot 的自定义 skill 只有一份正文，不能带 references/、scripts/ 等子文件。
本脚本把每个 Skill 的 references 合并到正文末尾的附录，按教练类型挑选 Skill，
生成只列已装 Skill 的 dbs 调度台，然后写入技能库目录。

用法：
  python3 tools/grok/install.py --coach startup            # 安装创业教练用的 Skill
  python3 tools/grok/install.py --coach content --dry-run  # 只生成到临时目录，不安装
  python3 tools/grok/install.py --coach all --out <目录>    # 生成到指定目录
"""
import argparse
import hashlib
import json
import pathlib
import re
import sys

REPO = pathlib.Path(__file__).resolve().parents[2]
WORKFLOW_DIRS = [pathlib.Path('/home/box/agent-data/workflows'), pathlib.Path('/home/box/sand-data/workflows')]
MAX_SKILLS = 100
MAX_BODY = 100000
MAX_DESC = 1536

COACHES = {
    'startup': ['dbs', 'dbs-diagnosis', 'dbs-benchmark', 'dbs-standard-answer', 'dbs-theory-grounding',
                'dbs-action', 'dbs-deconstruct', 'dbs-goal', 'dbs-good-question', 'dbs-jtbd', 'dbs-decision',
                'dbs-chatroom', 'dbs-chatroom-austrian', 'dbs-save', 'dbs-restore', 'dbs-report'],
    'content': ['dbs', 'dbs-content', 'dbs-content-value', 'dbs-content-risk-check', 'dbs-title-cover-intro',
                'dbs-spread', 'dbs-resonate', 'dbs-script-flow', 'dbs-ai-check', 'dbs-plain-writing',
                'dbs-wechat-html', 'dbs-benchmark', 'dbs-save', 'dbs-restore', 'dbs-report'],
}
COACHES['all'] = ['dbs', 'dbs-diagnosis', 'dbs-benchmark', 'dbs-standard-answer', 'dbs-theory-grounding',
                  'dbs-action', 'dbs-content', 'dbs-content-value', 'dbs-content-risk-check',
                  'dbs-title-cover-intro', 'dbs-deconstruct', 'dbs-chatroom', 'dbs-chatroom-austrian',
                  'dbs-ai-check', 'dbs-plain-writing', 'dbs-wechat-html', 'dbs-goal', 'dbs-good-question',
                  'dbs-jtbd', 'dbs-learning', 'dbs-spread', 'dbs-resonate', 'dbs-script-flow', 'dbs-save',
                  'dbs-restore', 'dbs-report', 'dbs-decision', 'dbs-knowledge', 'dbs-skill-maker']
SKIP_REFS = {'dbs': {'local.md'}, 'dbs-skill-maker': {'github-publishing.md'}}
EXTRA = {'dbs-wechat-html': ['templates/styles.md']}


def frontmatter(text):
    head, body = re.match(r'^---\n(.*?)\n---\n(.*)$', text, re.S).groups()
    desc = re.search(r'^description:\s*(.+)$', head, re.M).group(1).strip()
    if desc in ('|', '>', '|-', '>-'):
        block = re.search(r'^description:.*\n((?:  .*\n?)+)', head, re.M).group(1)
        desc = ''.join(line.strip() for line in block.splitlines())
    handoff = re.search(r'dbs-handoff: \|\n((?:    .*\n?)+)', head)
    return desc, (handoff.group(1).replace('    ', '').strip() if handoff else ''), body


def sub(text, old, new):
    assert old in text, 'not found: ' + old[:40]
    return text.replace(old, new, 1)


def cut(text, start, end):
    i = text.index(start)
    return text[:i] + text[text.index(end, i + len(start)):]


def link(m):
    return '「%s」（见文末附录 %s）' % (m.group(1), m.group(2))


def adapt_dbs(desc, body, skills):
    desc = sub(desc, '、输入三位编号或查询隐藏款目录', '')
    body = sub(body, '# dbs：技能调度台\n', '# dbs：技能调度台\n\n> 这是 dontbesilent 的 dbskill 的 Grok Bot 版（github.com/dontbesilent2025/dbskill）。下文候选表里的 skill 都已经作为本 bot 的 skill 安装，按名字调用即可读取正文。\n')
    body = sub(body, '你负责四件事：', '你负责两件事：')
    body = re.sub(r'3\. \*\*编号执行\*\*.*\n4\. \*\*隐藏款目录查询\*\*.*\n', '', body)
    body = cut(body, '## 版本检查', '## 隐藏款目录查询')
    body = cut(body, '## 隐藏款目录查询', '## 编号执行模式')
    body = cut(body, '## 编号执行模式', '## 模式判断')
    rows = []
    for name in skills:
        if name == 'dbs':
            continue
        d, handoff, _ = frontmatter((REPO / 'skills' / name / 'SKILL.md').read_text())
        rows.append('| %s | %s | %s |' % (name, d.replace('|', '／'), handoff.replace('\n', '<br>').replace('|', '／') or '—'))
    table = ('#### 候选与接手字段\n\n候选就是下表列出的 skill，它们都已安装在本 bot 中，不扫描目录，也不调用脚本。'
             '「接手」一列每行写「接手时的状态 → 交出的东西」，最后一行写「不交出：……」。description 只够判断是否相关；先后、分工和可跳过的步骤，以接手字段为依据。\n\n'
             '| skill | 用途 | 接手 |\n| --- | --- | --- |\n' + '\n'.join(rows) +
             '\n\n候选范围：排除 `/dbs` 本身；表外的 skill 不进入候选；缺少正文的候选不得入选。\n\n')
    body = cut(body, '#### 读取候选与接手字段', '#### 动态拆解')
    body = sub(body, '#### 动态拆解', table + '#### 动态拆解')
    body = sub(body, '- `/dbs` 只编排 Marketplace 正式条目（本机补充规则另有规定的除外）；', '- `/dbs` 只编排候选表列出的 skill；')
    body = re.sub(r'- 编号执行只从.*\n', '', body)
    body = sub(body, '这些点名登记在 `tools/check-skill-routing-contract.py` 的允许清单中。', '')
    body = re.sub(r'- 版本提醒是否仅在脚本有输出时放到末尾？\n', '', body)
    body = re.sub(r'编号任务检查：.*\n\n', '', body)
    body = re.sub(r'目录查询检查：.*\n\n', '', body)
    return desc, body


def adapt_skill_maker(desc, body):
    desc = sub(desc, '；只有用户明确要求分享或发布时，才准备 GitHub 仓库并验证 `npx skills add`。', '。在 Grok Bot 里，完成后用 UpdateSkill 存成本账号的 skill。')
    body = sub(body, '本地可用并通过当前证据支持的验证，即构成一次完整交付。GitHub 发布是可选能力，不能成为默认步骤。',
               '存进本账号的 skill 并通过当前证据支持的验证，即构成一次完整交付。本版运行在 Grok Bot 中：skill 只有一份正文，用 UpdateSkill 写入（name、description、正文），不建 scripts/、assets/ 等子目录，需要的参考资料合并到正文末尾的附录。')
    body = sub(body, '9. **外部动作单独授权。** 创建远端仓库、push、tag、Release 和公开测试材料，都需要用户明确要求。',
               '9. **外部动作单独授权。** 公开分享 skill 或测试材料，需要用户明确要求。')
    body = re.sub(r'\| 明确要求发布、分享或生成 `npx` 安装命令 .*\n', '', body)
    body = sub(body, '2. 确认改动可以回退：目标位于 Git 仓库且相关文件没有未提交改动时，以当前提交为回退点；否则先把相关文件复制到临时目录作为快照；',
               '2. 确认改动可以回退：改已有 skill 前，先把原正文完整保存一份作为回退点；')
    i, j = body.index('4. 新建 Skill 时可以运行'), body.index('不得把初始骨架')
    body = body[:i] + ('4. 写入前确认账号里没有同名 skill；每个账号最多 100 个自定义 skill，单个正文最多 10 万字符，name 最多 80 字符，description 最多 1536 字符；\n'
                       '5. 用 UpdateSkill 写入后，读回正文核对 frontmatter、附录引用和停止条件。\n\n') + body[j:]
    body = re.sub(r'\| 4．安装交付 .*\n', '', body)
    body = sub(body, 'Skill 名称和绝对路径；', 'Skill 名称；')
    body = sub(body, '本地安装或调用方式。', '调用方式（用 / 或 @ 点名）。')
    i, j = body.index('如果当前环境能使用 `$dbs-install-skill`'), body.index('## 改进本 Skill 自身')
    body = body[:i] + '新 Skill 交付后说明：已存进本账号，可以用 / 或 @ 点名调用。\n\n' + body[j:]
    body = sub(body, '- GitHub 相关动作尚未获得授权。\n', '')
    body = sub(body, '- 不使用 `git add .` 或 `git add -A`；发布时只暂存明确文件。\n- 不把本地绝对路径、测试答案、密钥或内部记录写进公开仓库。\n',
               '- 不把测试答案、密钥或内部记录写进 skill 正文。\n')
    return desc, body


def adapt_skill_maker_ref(stem, text):
    if stem == 'skill-construction':
        text = sub(text, '## 选择最小结构\n', '## 选择最小结构\n\n在 Grok Bot 里只有一份正文：下面的目录结构合并为正文加附录，不建 scripts/、assets/。\n')
        text = re.sub(r'使用本 Skill 自带的校验器：\n\n```bash\n.*?\n```\n', '按以上清单逐项核对。\n', text, flags=re.S)
    return text


def build(skills, router_skills=None):
    """router_skills：dbs 候选表要列的 skill，默认就是本次生成的 skill。"""
    result = {}
    for name in skills:
        src = REPO / 'skills' / name
        desc, _, body = frontmatter((src / 'SKILL.md').read_text())
        if name == 'dbs':
            desc, body = adapt_dbs(desc, body, router_skills or skills)
        if name == 'dbs-skill-maker':
            desc, body = adapt_skill_maker(desc, body)
        refs = sorted((src / 'references').glob('*.md')) if (src / 'references').is_dir() else []
        refs = [r for r in refs if r.name not in SKIP_REFS.get(name, set())] + [src / e for e in EXTRA.get(name, [])]
        body = re.sub(r'\[([^\]]+)\]\(references/([\w-]+)\.md\)', link, body)
        body = re.sub(r'`(?:references|templates)/([\w-]+)\.md`', lambda m: '附录 %s' % m.group(1), body)
        parts = ['---\nname: %s\nsource: dbskill\ndescription: %s\n---\n' % (name, desc), body.rstrip(), '\n']
        if refs:
            parts.append('\n---\n\n# 附录：参考资料\n\n正文说「见文末附录 xxx」或「附录 xxx」时，读下面对应的小节。\n')
            for r in refs:
                text = r.read_text()
                if name == 'dbs-skill-maker':
                    text = adapt_skill_maker_ref(r.stem, text)
                text = re.sub(r'\[([^\]]+)\]\(([\w-]+)\.md\)', link, text)
                text = re.sub(r'^(#+) ', lambda m: '#' + m.group(1) + ' ', text, flags=re.M)
                parts.append('\n## 附录 %s\n\n%s\n' % (r.stem, text.strip()))
        text = ''.join(parts)
        if len(desc) > MAX_DESC or len(text) >= MAX_BODY:
            sys.exit('%s 超出 Grok 的长度上限' % name)
        result[name] = text
    return result


def is_dbskill_entry(path, name):
    """已有同名 skill 时，只覆盖 dbskill 自己装的版本。"""
    head = path.read_text(errors='ignore')[:400]
    return head.startswith('---\nname: %s\n' % name) and ('dbskill' in head or 'dontbesilent' in head)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--coach', choices=sorted(COACHES), required=True)
    parser.add_argument('--out', help='只生成到这个目录，不安装')
    parser.add_argument('--dry-run', action='store_true', help='只生成并检查，不写入技能库')
    parser.add_argument('--target', help='技能库目录，默认自动查找 Grok Bot 的目录')
    args = parser.parse_args()

    skills = COACHES[args.coach]

    if args.out:
        built = build(skills)
        manifest = {n: [len(t), hashlib.sha256(t.encode()).hexdigest()[:12]] for n, t in built.items()}
        total = hashlib.sha256(json.dumps(manifest, sort_keys=True).encode()).hexdigest()[:16]
        out = pathlib.Path(args.out)
        for name, text in built.items():
            (out / name).mkdir(parents=True, exist_ok=True)
            (out / name / 'SKILL.md').write_text(text)
        print(json.dumps({'skills': len(built), 'chars': sum(v[0] for v in manifest.values()), 'total': total}))
        return

    target = pathlib.Path(args.target) if args.target else next((d for d in WORKFLOW_DIRS if d.is_dir()), None)
    if target is None:
        sys.exit('找不到 Grok Bot 的技能库目录，这个脚本只能在 Grok Bot 的运行环境里安装。')
    existing = {p.name for p in target.iterdir() if (p / 'SKILL.md').is_file()}
    blocked = [n for n in skills if n in existing and not is_dbskill_entry(target / n / 'SKILL.md', n)]
    new = [n for n in skills if n not in existing]
    # 账号里只有一个 dbs：候选表要包含之前装过的 dbskill skill，装第二个教练时不能把第一个的候选挤掉
    installed = [n for n in COACHES['all'] if n in existing and is_dbskill_entry(target / n / 'SKILL.md', n)]
    router = [n for n in COACHES['all'] if n in skills or n in installed]
    built = build(skills, router)
    report = {'target': str(target), 'skills': skills, 'new': len(new), 'existing_total': len(existing),
              'dbs_candidates': len(router) - 1, 'blocked': blocked}
    if blocked:
        report['error'] = '这些名字已经被别的 skill 占用，没有安装：' + '、'.join(blocked)
    elif new and len(existing) + len(new) > MAX_SKILLS:
        report['error'] = '自定义 skill 名额不够：已有 %d 个，还要新增 %d 个，上限 %d 个。' % (len(existing), len(new), MAX_SKILLS)
    if 'error' in report or args.dry_run:
        print(json.dumps(report, ensure_ascii=False, indent=1))
        sys.exit(1 if 'error' in report else 0)
    for name, text in built.items():
        (target / name).mkdir(exist_ok=True)
        (target / name / 'SKILL.md').write_text(text)
    report['installed'] = skills
    print(json.dumps(report, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
