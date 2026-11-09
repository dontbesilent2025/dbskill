#!/usr/bin/env python3
"""从本机 Agent 的聊天记录里整理出写「近况」用的素材，并管理同步状态。

只用标准库，只读聊天记录；collect 不联网，push 经 HTTPS 推给配对过的 bot。素材文件和状态都放在 ~/.dondon-sync/，权限 600。

子命令：
  collect      整理素材：只取上次同步以后（或最近 N 天）的记录，只留用户说的话和每轮的最后回答，
               先隐去密钥、手机号、证件号、银行卡号、邮箱等，再按字数上限截断，写进素材文件。
  copy         从标准输入读近况全文，复制到剪贴板。
  mark-synced  记下这次同步的时间，并删掉素材文件。用户确认发出后再运行。
  status       显示上次同步时间和能找到的聊天记录位置。
  push         把 collect 找出的文档隐去敏感信息后推到 bot 的知识库，近况（--recent，标准输入）直接写进 bot。
               需要先用 pair 配对；没配对的电脑只能用 copy。
  skills       从 bot 取它装着的技能列表，写机会清单时只能从这里选。
  pair <码>    用 bot 给的 6 位配对码换同步钥匙（客户的正常用法）；之后 push 走 HTTPS，只认 Skill 自带的证书。
  schedule     自动同步：on [--time HH:MM] 每天定时同步一次（macOS）；off 关掉；decline 记下用户不要；status 查看。
  auto-run     定时任务实际运行的命令：整理素材 → 请本机 Agent（不开任何工具）写近况和机会清单 → 推送 → 记同步时间。

不同步的内容：API 密钥、令牌、密码、私钥、助记词。文档里只要出现一处，整份文档不传；文件名像存这些东西的文档也不传。
手机号、邮箱、证件号、银行卡号在聊天素材、文档、近况和机会清单里一律先换成「〔已隐去〕」。

聊天记录来源：Claude Code、Codex、WorkBuddy、Grok CLI。豆包的对话存在云端，本机读不到。
"""
import argparse
import glob
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from urllib.parse import unquote
import socket
import ssl
import time
import urllib.error
import urllib.request

STATE_DIR = os.path.expanduser("~/.dondon-sync")
STATE_FILE = os.path.join(STATE_DIR, "state.json")
MATERIAL_FILE = os.path.join(STATE_DIR, "material.md")
CLAUDE_GLOB = os.path.expanduser("~/.claude/projects/*/*.jsonl")
CODEX_GLOB = os.path.expanduser("~/.codex/sessions/**/*.jsonl")
WORKBUDDY_GLOB = os.path.expanduser("~/.workbuddy/projects/*/*.jsonl")
GROK_GLOB = os.path.expanduser("~/.grok/sessions/*/*/chat_history.jsonl")
CONFIG_FILE = os.path.join(STATE_DIR, "config.json")
FILES_LIST = os.path.join(STATE_DIR, "files.json")
STAGE_DIR = os.path.join(STATE_DIR, "stage")
REMOTE_DIR_NAME = "近期工作文件"
OWNER_LINE = "这是客户本人的资料，不是别人的。客户问到自己（我是谁、我做什么、我说过什么）和自己的生意、内容、产品时，先在这里找。"
SYNC_MARK = "【近况同步】"

USER_MSG_LIMIT = 500      # 每条用户消息最多保留的字数
ANSWER_LIMIT = 600        # 每轮最后回答最多保留的字数
DEFAULT_MAX_CHARS = 30000  # 素材总字数上限
SESSION_MIN_BUDGET = 1000  # 每个会话至少分到的字数
DEFAULT_DAYS = 7          # 写近况看最近几天的聊天：一周才看得出主线和卡点
FILE_DAYS = 14            # 文档取最近几天用到的：每次整批替换，所以每批都要带够两周
MAX_DAYS = 30

REDACT = "〔已隐去〕"
REDACT_PATTERNS = [
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----", re.S),
    re.compile(r"\b(?:sk|pk|rk)-[A-Za-z0-9_\-]{12,}"),
    re.compile(r"\b(?:ddb|ghp|gho|ghs|github_pat|xox[abpr]|glpat|AKIA|ASIA)[_\-]?[A-Za-z0-9_\-]{10,}"),
    re.compile(r"\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{5,}"),  # JWT
    re.compile(r"(?i)\b(?:bearer|token|api[_\-]?key|secret|password|passwd|pwd|密码|口令|密钥)\s*[:=：]\s*\S+"),
    re.compile(r"\b[A-Fa-f0-9]{32,}\b"),
    re.compile(r"\b[A-Za-z0-9+/]{40,}={0,2}"),
    re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}"),
    re.compile(r"(?<!\d)\d{17}[\dXx](?!\d)"),          # 身份证
    re.compile(r"(?<!\d)\d{16,19}(?!\d)"),              # 银行卡
    re.compile(r"(?<!\d)(?:\+?86[\- ]?)?1[3-9]\d{9}(?!\d)"),  # 手机号
]

# 核心秘密：文档里只要出现一处，整份不传（隐去还不够：留着上下文也可能被拼回去）。这些东西对 bot 帮用户做事没有用处。
SECRET_VALUE = r"[\"'`]?[A-Za-z0-9_\-+/=.]{12,}"
SECRET_PATTERNS = [
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    re.compile(r"\b(?:sk|pk|rk)-[A-Za-z0-9_\-]{16,}"),
    re.compile(r"\b(?:ghp|gho|ghs|github_pat|xox[abpr]|glpat|AKIA|ASIA|ddb|dds)[_\-]?[A-Za-z0-9_\-]{12,}"),
    re.compile(r"\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{5,}"),  # JWT
    re.compile(r"(?i)\b(?:api[_\-]?key|secret[_\-]?key|access[_\-]?key|client[_\-]?secret|app[_\-]?secret|auth[_\-]?token|"
               r"access[_\-]?token|password|passwd|bearer)\s*[:=：]?\s*" + SECRET_VALUE),
    re.compile(r"(?:密钥|密码|口令|私钥|助记词|令牌)\s*[:=：]\s*" + SECRET_VALUE),
]
SECRET_NAME_RE = re.compile(r"(?i)(api[_\- ]?keys?|secrets?|passw(?:or)?ds?|credentials?|\.env\b|密钥|密码|口令|私钥|凭证|助记词)")


def secret_hit(text):
    return any(p.search(text) for p in SECRET_PATTERNS)


# 宿主自动注入、不是用户本人说的话
INJECTED_PREFIXES = (
    "<", "# AGENTS.md instructions", "Caveat:", "[Request interrupted", "This session is being continued",
    "Base directory for this skill", "[SYSTEM NOTIFICATION",
)


def redact(text):
    for p in REDACT_PATTERNS:
        text = p.sub(REDACT, text)
    return text


def clip(text, limit):
    text = re.sub(r"```.*?```", "〔代码略〕", text, flags=re.S)
    text = re.sub(r"(?m)^#{1,6}\s+", "", text)  # 去掉标题符号，免得和会话标题混在一起
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text if len(text) <= limit else text[:limit] + "……"


def parse_time(s):
    if not s:
        return None
    try:
        return datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    except ValueError:
        return None


def is_user_words(text):
    t = text.lstrip()
    return bool(t) and not t.startswith(INJECTED_PREFIXES) and SYNC_MARK not in t


def project_name(cwd):
    return os.path.basename(cwd.rstrip("/")) if cwd else "未知目录"


def read_jsonl(path):
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            for line in f:
                try:
                    yield json.loads(line)
                except ValueError:
                    continue
    except OSError:
        return


def claude_sessions(since, refs=None):
    """Claude Code：~/.claude/projects/<目录>/<会话>.jsonl。子 Agent 的记录在 subagents/ 下，不读。"""
    for path in glob.glob(CLAUDE_GLOB):
        if datetime.fromtimestamp(os.path.getmtime(path), timezone.utc) < since:
            continue
        title, cwd, turns, last_answer = None, None, [], None
        for o in read_jsonl(path):
            kind = o.get("type")
            if kind == "custom-title":
                title = o.get("customTitle") or title
                continue
            if kind not in ("user", "assistant") or o.get("isSidechain") or o.get("isMeta"):
                continue
            ts = parse_time(o.get("timestamp"))
            if not ts or ts < since:
                continue
            cwd = o.get("cwd") or cwd
            content = (o.get("message") or {}).get("content")
            if kind == "user":
                if isinstance(content, str):
                    texts = [content]
                elif isinstance(content, list):
                    texts = [b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text"]
                else:
                    texts = []
                texts = [t for t in texts if is_user_words(t)]
                if texts:
                    note_refs(refs, texts, ts, "Claude Code", title)
                    if turns and last_answer:
                        turns[-1]["answer"] = last_answer
                    last_answer = None
                    turns.append({"time": ts, "user": "\n".join(texts), "answer": None})
            elif isinstance(content, list):
                note_refs(refs, [b.get("input") for b in content if isinstance(b, dict) and b.get("type") == "tool_use"],
                          ts, "Claude Code", title)
                texts = [b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text"]
                if any(t.strip() for t in texts):
                    last_answer = "\n".join(texts)
        if turns and last_answer:
            turns[-1]["answer"] = last_answer
        if turns:
            yield {"source": "Claude Code", "title": title, "project": project_name(cwd), "turns": turns}


def codex_sessions(since, refs=None):
    """Codex：~/.codex/sessions/年/月/日/rollout-*.jsonl。parent_thread_id 不为空的是子线程，不读。"""
    for path in glob.glob(CODEX_GLOB, recursive=True):
        if datetime.fromtimestamp(os.path.getmtime(path), timezone.utc) < since:
            continue
        cwd, turns, last_answer, child = None, [], None, False
        for o in read_jsonl(path):
            p = o.get("payload") or {}
            if o.get("type") == "session_meta":
                child = bool(p.get("parent_thread_id"))
                cwd = p.get("cwd")
                continue
            if o.get("type") != "response_item" or p.get("type") not in ("message", "function_call", "custom_tool_call"):
                continue
            ts = parse_time(o.get("timestamp")) or datetime.fromtimestamp(os.path.getmtime(path), timezone.utc)
            if ts < since:
                continue
            if p.get("type") != "message":
                if not child:
                    note_refs(refs, p.get("arguments") or p.get("input"), ts, "Codex", None)
                continue
            texts = [b.get("text", "") for b in p.get("content") or [] if isinstance(b, dict)]
            if p.get("role") == "user":
                texts = [t for t in texts if is_user_words(t)]
                if texts:
                    if not child:
                        note_refs(refs, texts, ts, "Codex", None)
                    if turns and last_answer:
                        turns[-1]["answer"] = last_answer
                    last_answer = None
                    turns.append({"time": ts, "user": "\n".join(texts), "answer": None})
            elif p.get("role") == "assistant" and any(t.strip() for t in texts):
                last_answer = "\n".join(texts)
        if child:
            continue
        if turns and last_answer:
            turns[-1]["answer"] = last_answer
        if turns:
            yield {"source": "Codex", "title": None, "project": project_name(cwd), "turns": turns}


def ms_time(v):
    try:
        return datetime.fromtimestamp(int(v) / 1000, timezone.utc)
    except (TypeError, ValueError, OverflowError, OSError):
        return None


def block_texts(content):
    if isinstance(content, str):
        return [content]
    if isinstance(content, list):
        return [b.get("text", "") for b in content if isinstance(b, dict) and isinstance(b.get("text"), str)]
    return []


def workbuddy_sessions(since, refs=None):
    """WorkBuddy：~/.workbuddy/projects/<目录>/<会话>.jsonl，条目 type=message（role user/assistant）、function_call。"""
    for path in glob.glob(WORKBUDDY_GLOB):
        if datetime.fromtimestamp(os.path.getmtime(path), timezone.utc) < since:
            continue
        title, cwd, turns, last_answer = None, None, [], None
        for o in read_jsonl(path):
            kind = o.get("type")
            if kind == "ai-title":
                title = o.get("aiTitle") or title
                continue
            cwd = o.get("cwd") or cwd
            ts = ms_time(o.get("timestamp")) or parse_time(o.get("timestamp"))
            if not ts or ts < since:
                continue
            if kind == "function_call":
                note_refs(refs, o.get("arguments"), ts, "WorkBuddy", title)
                continue
            if kind != "message":
                continue
            texts = block_texts(o.get("content"))
            if o.get("role") == "user":
                texts = [t for t in texts if is_user_words(t)]
                if texts:
                    note_refs(refs, texts, ts, "WorkBuddy", title)
                    if turns and last_answer:
                        turns[-1]["answer"] = last_answer
                    last_answer = None
                    turns.append({"time": ts, "user": "\n".join(texts), "answer": None})
            elif o.get("role") == "assistant" and any(t.strip() for t in texts):
                last_answer = "\n".join(texts)
        if turns and last_answer:
            turns[-1]["answer"] = last_answer
        if turns:
            yield {"source": "WorkBuddy", "title": title, "project": project_name(cwd), "turns": turns}


GROK_QUERY = re.compile(r"<user_query>\s*(.*?)\s*</user_query>", re.S)


def grok_sessions(since, refs=None):
    """Grok CLI：~/.grok/sessions/<编码后的目录>/<会话>/chat_history.jsonl，条目 type=user/assistant/tool_result。
    用户的话包在 <user_query> 里，其余是宿主注入的环境说明。条目没有时间，用文件修改时间。"""
    for path in glob.glob(GROK_GLOB):
        mtime = datetime.fromtimestamp(os.path.getmtime(path), timezone.utc)
        if mtime < since:
            continue
        cwd = unquote(os.path.basename(os.path.dirname(os.path.dirname(path))))
        turns, last_answer = [], None
        for o in read_jsonl(path):
            kind = o.get("type")
            if kind == "user":
                texts = []
                for t in block_texts(o.get("content")):
                    m = GROK_QUERY.search(t)
                    if m:
                        texts.append(m.group(1))
                    elif is_user_words(t):
                        texts.append(t)
                if texts:
                    note_refs(refs, texts, mtime, "Grok", None)
                    if turns and last_answer:
                        turns[-1]["answer"] = last_answer
                    last_answer = None
                    turns.append({"time": mtime, "user": "\n".join(texts), "answer": None})
            elif kind == "assistant":
                note_refs(refs, {k: v for k, v in o.items() if k != "content"}, mtime, "Grok", None)
                texts = block_texts(o.get("content"))
                if any(t.strip() for t in texts):
                    last_answer = "\n".join(texts)
        if turns and last_answer:
            turns[-1]["answer"] = last_answer
        if turns:
            yield {"source": "Grok", "title": None, "project": project_name(cwd), "turns": turns}


# ---------------------------------------------------------------- 会话里用到的文件

HOME = os.path.expanduser("~")
ICLOUD = os.path.join(HOME, "Library", "Mobile Documents", "com~apple~CloudDocs")
PATH_RE = re.compile(r"(?:/Users/|~/)[^\n\r\t\"'`<>|*?\\]*?\.(?:md|markdown|txt)(?![A-Za-z0-9_])")
FILE_EXTS = (".md", ".markdown", ".txt")
# 不同步的位置：Agent 自己的配置和记录、本工具、临时目录、客户资料暂存、私密目录
SKIP_PREFIXES = [os.path.join(HOME, d) for d in (
    ".claude", ".codex", ".workbuddy", ".grok", ".agents", ".gemini", ".cursor", ".dondon-sync",
    "dondon-kb-staging", "Downloads",
)]
SKIP_PARTS = {".git", "node_modules", "private", ".private", "evals", ".obsidian", ".trash", "build", "dist",
              "skills", "vendor", "__pycache__"}
SKIP_NAMES = {"SKILL.md", "AGENTS.md", "CLAUDE.md", "CODEBUDDY.md", "GEMINI.md", "MEMORY.md", "SOURCE_OF_TRUTH.md"}
MAX_FILE_BYTES = 1024 * 1024        # 单个文件超过 1 MB 不传
MAX_TOTAL_BYTES = 20 * 1024 * 1024  # 一次最多 20 MB
MAX_FILES = 400


def walk_strings(v, depth=0):
    if depth > 12:
        return
    if isinstance(v, str):
        yield v
    elif isinstance(v, dict):
        for x in v.values():
            yield from walk_strings(x, depth + 1)
    elif isinstance(v, list):
        for x in v:
            yield from walk_strings(x, depth + 1)


def note_refs(refs, value, ts, source, title):
    """在工具调用参数和用户的话里找本机文档路径，记下次数、最近时间和来自哪个会话。"""
    if refs is None or value is None:
        return
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except ValueError:
            pass
    for s in walk_strings(value):
        if "/Users/" not in s and "~/" not in s:
            continue
        for m in PATH_RE.finditer(s):
            p = os.path.normpath(os.path.expanduser(m.group(0)))
            r = refs.setdefault(p, {"count": 0, "last": ts, "from": set()})
            r["count"] += 1
            if ts > r["last"]:
                r["last"] = ts
            r["from"].add(f"{source}｜{title}" if title else source)


def skip_reason(p):
    if not p.startswith(HOME + os.sep) or not p.lower().endswith(FILE_EXTS):
        return "不在本人目录或不是文档"
    if any(p == d or p.startswith(d + os.sep) for d in SKIP_PREFIXES):
        return "Agent 配置或暂存目录"
    if p.startswith(os.path.join(HOME, "Library") + os.sep) and not p.startswith(ICLOUD + os.sep):
        return "系统目录"
    parts = os.path.relpath(p, HOME).split(os.sep)
    if any(x in SKIP_PARTS or (x.startswith(".") and x not in (".",)) for x in parts[:-1]):
        return "私密、隐藏或生成目录"
    if parts[-1] in SKIP_NAMES or parts[-1].startswith("."):
        return "Agent 规则文件"
    if SECRET_NAME_RE.search(parts[-1]):
        return SECRET_REASON
    return None


SECRET_REASON = "像是存密钥、密码的文档，整份不传"


def remote_rel(p):
    """本机路径 → 同步目录里的相对路径：去掉主目录、iCloud 前缀和「claude code/」。"""
    rel = os.path.relpath(p, ICLOUD) if p.startswith(ICLOUD + os.sep) else os.path.relpath(p, HOME)
    if rel.startswith("claude code" + os.sep):
        rel = rel[len("claude code" + os.sep):]
    return rel


def pick_files(refs):
    """按最近用到的时间排序，过滤后在数量和总量上限内取文件。含核心秘密的整份不取，名字记进 held。"""
    picked, skipped, total, held = [], {}, 0, []
    for p, r in sorted(refs.items(), key=lambda kv: (kv[1]["last"], kv[1]["count"]), reverse=True):
        why = skip_reason(p)
        if not why and not os.path.isfile(p):
            why = "文件已不在"
        if not why:
            size = os.path.getsize(p)
            if size > MAX_FILE_BYTES:
                why = "单个文件超过 1 MB"
            elif total + size > MAX_TOTAL_BYTES or len(picked) >= MAX_FILES:
                why = "超出 20 MB 或 400 个文件的上限"
            else:
                try:
                    with open(p, encoding="utf-8") as fh:
                        if secret_hit(fh.read()):
                            why = SECRET_REASON
                except (OSError, UnicodeDecodeError):
                    why = "读不出来"
        if why == SECRET_REASON:
            held.append(remote_rel(p))
        if why:
            skipped[why] = skipped.get(why, 0) + 1
            continue
        total += size
        picked.append({"path": p, "rel": remote_rel(p), "size": size, "count": r["count"],
                       "last": r["last"].isoformat(), "from": sorted(r["from"])[:3]})
    return picked, skipped, total, held


def load_state():
    try:
        with open(STATE_FILE, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def save_private(path, text):
    os.makedirs(STATE_DIR, mode=0o700, exist_ok=True)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(text)


def local(ts):
    return ts.astimezone().strftime("%m-%d %H:%M")


def render_turn(t, answer_limit):
    out = f"- 用户（{local(t['time'])}）：{redact(clip(t['user'], USER_MSG_LIMIT))}"
    if t["answer"]:
        out += f"\n  回答：{redact(clip(t['answer'], answer_limit))}"
    return out


def render_session(s, budget):
    """每个会话一份篇幅：第一轮（交代任务）必留，其余从最近一轮往前放，放不下的中间轮次略去。"""
    turns = s["turns"]
    first, last = turns[0]["time"], turns[-1]["time"]
    head = f"## {'【上次同步以后有新进展】' if s.get('new') and s.get('mark_new') else ''}{s['source']}｜{s['project']}"
    if s["title"]:
        head += f"｜{s['title']}"
    head += f"\n时间：{local(first)} 至 {local(last)}，共 {len(turns)} 轮\n"
    answer_limit = ANSWER_LIMIT if len(turns) <= 3 else ANSWER_LIMIT // 2
    opening = render_turn(turns[0], answer_limit)
    used = len(head) + len(opening)
    recent = []
    for t in reversed(turns[1:]):
        line = render_turn(t, answer_limit)
        if used + len(line) > budget:
            break
        recent.append(line)
        used += len(line)
    skipped = len(turns) - 1 - len(recent)
    body = [opening] + ([f"- ……（中间 {skipped} 轮略去）"] if skipped else []) + list(reversed(recent))
    return head + "\n" + "\n".join(body) + "\n"


def cmd_collect(args):
    now = datetime.now(timezone.utc)
    state = load_state()
    # 范围固定，不从上次同步算起：聊天看最近 7 天写近况，文档取最近 14 天（整批替换，少了就会把前几天的清掉）。
    # 上次同步的时间只用来标出哪些会话有新进展、自动同步时判断有没有新东西。
    days = min(args.days, MAX_DAYS) if args.days else DEFAULT_DAYS
    since = now - timedelta(days=days)
    files_since = now - timedelta(days=max(days, FILE_DAYS))
    last_sync = parse_time(state["last_sync"]) if state.get("last_sync") else None

    sessions, refs = [], {}
    readers = {"claude": claude_sessions, "codex": codex_sessions, "workbuddy": workbuddy_sessions, "grok": grok_sessions}
    for name in args.sources:
        if name in readers:
            sessions += list(readers[name](files_since, refs))
    # 写近况只用最近 days 天的轮次
    for x in sessions:
        x["turns"] = [t for t in x["turns"] if t["time"] >= since]
    sessions = [x for x in sessions if x["turns"]]
    for x in sessions:
        x["new"] = last_sync is None or x["turns"][-1]["time"] > last_sync
    if args.exclude:
        refs = {p: r for p, r in refs.items() if not any(x in p for x in args.exclude)}
    files, skipped, total, held = pick_files(refs)
    save_private(FILES_LIST, json.dumps({"since": files_since.isoformat(), "files": files, "held_back": held}, ensure_ascii=False))
    if args.exclude:
        sessions = [s for s in sessions if not any(x in s["project"] for x in args.exclude)]
    # 最近的会话优先；超出字数上限时丢掉最旧的会话
    sessions.sort(key=lambda s: s["turns"][-1]["time"], reverse=True)
    # 分出去的旁支会话会带上主会话的历史，同一轮只留第一次出现的那份
    seen, unique = set(), []
    for s in sessions:
        turns = []
        for t in s["turns"]:
            key = (t["time"].replace(microsecond=0), t["user"][:80])
            if key not in seen:
                seen.add(key)
                turns.append(t)
        if turns:
            s["turns"] = turns
            unique.append(s)
    sessions = unique

    # 每个会话分到同样的篇幅（至少 SESSION_MIN_BUDGET），总量超了就丢掉最旧的会话
    for x in sessions:
        x["mark_new"] = last_sync is not None
    budget = max(SESSION_MIN_BUDGET, args.max_chars // max(len(sessions), 1))
    blocks, used, dropped = [], 0, 0
    for s in sessions:
        block = render_session(s, budget)
        if used + len(block) > args.max_chars:
            dropped += 1
            continue
        blocks.append(block)
        used += len(block)

    sources = sorted({s["source"] for s in sessions})
    header = [
        "# 近况素材（只在本机使用，写完近况后会删除）",
        "",
        f"范围：{since.astimezone().strftime('%Y-%m-%d %H:%M')} 至 {now.astimezone().strftime('%Y-%m-%d %H:%M')}（最近 {days} 天）"
        + (f"；上次同步 {local(last_sync)}，标「上次同步以后有新进展」的会话写近况时放在前面" if last_sync else ""),
        f"来源：{'、'.join(sources) if sources else '无'}；会话 {len(sessions)} 个，收入 {len(blocks)} 个，"
        f"因字数上限略去较旧的 {dropped} 个",
        "已隐去：密钥、令牌、密码、长串编码、邮箱、手机号、证件号、银行卡号；代码块已略去。"
        "近况和机会清单里不写任何密钥、密码、账号。",
        "",
    ]
    by_proj = {}
    for f in files:
        top = f["rel"].split(os.sep)[0] if os.sep in f["rel"] else "其他"
        by_proj[top] = by_proj.get(top, 0) + 1
    flist = ["", f"# 最近 {max(days, FILE_DAYS)} 天用到的文档（{len(files)} 个，共 {total / 1024 / 1024:.1f} MB，确认后会同步给 bot）", ""]
    flist += [f"- {f['rel']}（{local(datetime.fromisoformat(f['last']))}，用到 {f['count']} 次）" for f in files[:60]]
    if len(files) > 60:
        flist.append(f"- ……另外 {len(files) - 60} 个")
    save_private(MATERIAL_FILE, "\n".join(header) + "\n".join(blocks) + "\n".join(flist) + "\n")
    print(json.dumps({
        "material": MATERIAL_FILE,
        "since": since.astimezone().strftime("%Y-%m-%d"),
        "files_since": files_since.astimezone().strftime("%Y-%m-%d"),
        "sessions_new_since_last_sync": sum(1 for x in sessions if x["new"]),
        "until": now.astimezone().strftime("%Y-%m-%d"),
        "sources": sources,
        "sessions_found": len(sessions),
        "sessions_included": len(blocks),
        "sessions_dropped": dropped,
        "chars": used,
        "files": len(files),
        "files_mb": round(total / 1024 / 1024, 2),
        "files_by_folder": dict(sorted(by_proj.items(), key=lambda kv: -kv[1])[:10]),
        "files_skipped": skipped,
        "held_back_secret_files": held[:20],
    }, ensure_ascii=False))
    return {"sessions": len(blocks), "new": sum(1 for x in sessions if x["new"]), "files": len(files),
            "since": since, "until": now, "sources": sources}


def cmd_copy(_args):
    text = sys.stdin.read().strip()
    if not text.startswith(SYNC_MARK):
        sys.exit(f"近况第一行必须是「{SYNC_MARK}」，没有复制。")
    for cmd in (["pbcopy"], ["clip"], ["wl-copy"], ["xclip", "-selection", "clipboard"], ["xsel", "--clipboard", "--input"]):
        if shutil.which(cmd[0]):
            # pbcopy 按系统区域设置解码，没设 UTF-8 时中文会变成乱码
            env = dict(os.environ, LANG="en_US.UTF-8", LC_ALL="en_US.UTF-8")
            subprocess.run(cmd, input=text.encode("utf-8"), check=True, env=env)
            print(f"已复制到剪贴板（{len(text)} 字）。")
            return
    sys.exit("这台电脑上没找到剪贴板命令，请手动复制近况全文。")


def cmd_mark_synced(_args):
    state = load_state()
    state["last_sync"] = datetime.now(timezone.utc).isoformat()
    save_private(STATE_FILE, json.dumps(state, ensure_ascii=False))
    for f in (MATERIAL_FILE, FILES_LIST):
        if os.path.exists(f):
            os.remove(f)
    print(f"已记下同步时间 {datetime.now().strftime('%Y-%m-%d %H:%M')}，素材和文件清单已删除。")


DEFAULT_SERVER = "https://101.201.141.217:8443"   # dondon 的同步入口（只开 /sync/*）
CA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dondon-ca.pem")  # 只认这张证书
KEY_RE = re.compile(r"dds_[A-Za-z0-9_-]{20,}")
SERVER_RE = re.compile(r"https://[0-9A-Za-z.-]+(?::\d{2,5})?|http://127\.0\.0\.1:\d{2,5}")


def load_config():
    try:
        with open(CONFIG_FILE, encoding="utf-8") as f:
            cfg = json.load(f)
    except (OSError, ValueError):
        return None
    if cfg.get("key"):
        if not KEY_RE.fullmatch(str(cfg["key"])) or not SERVER_RE.fullmatch(str(cfg.get("server", ""))):
            sys.exit(f"{CONFIG_FILE} 里的同步钥匙或服务器地址不合规，请对 bot 说「绑定电脑」重新配对。")
        return cfg
    return None  # 没有同步钥匙就当没配对


def api(cfg, method, path, body=None, key=None, timeout=60):
    """调同步入口：https 只认 Skill 自带的 dondon-ca.pem；http 只允许 127.0.0.1（本机测试用）"""
    server = cfg["server"]
    ctx = None
    if server.startswith("https://"):
        if not os.path.isfile(CA_FILE):
            sys.exit("Skill 里缺少 dondon-ca.pem，没法安全连接，请更新这个 Skill。")
        ctx = ssl.create_default_context(cafile=CA_FILE)
    data = json.dumps(body, ensure_ascii=False).encode("utf-8") if body is not None else None
    headers = {"content-type": "application/json"}
    if key:
        headers["authorization"] = f"Bearer {key}"
    req = urllib.request.Request(server + path, data=data, method=method, headers=headers)
    # 直连，不走本机的网络代理：代理会替服务器「接通」端口，真正连不上时只剩一句看不懂的握手失败
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), urllib.request.HTTPSHandler(context=ctx))
    try:
        with opener.open(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode("utf-8") or "{}")
        except ValueError:
            return e.code, {}
    except (urllib.error.URLError, OSError, ValueError) as e:
        sys.exit(f"连不上同步服务（{getattr(e, 'reason', e)}）。多半是同步服务的端口还没对外开放，或者这台电脑的网络"
                 f"（公司网络、代理软件的全局或 TUN 模式）拦住了 {server.split('://')[-1]}；"
                 "换个网络或把这个地址设成直连再试。一直不行就告诉 dondon 的服务方。")


def err_msg(j):
    return ((j or {}).get("error") or {}).get("message") or "未知原因"


def cmd_pair(args):
    code = re.sub(r"\D", "", args.code or "")
    if len(code) != 6:
        sys.exit("配对码是 6 位数字。请在微信或飞书里对 dondon 说「绑定电脑」拿一个。")
    server = args.server or DEFAULT_SERVER
    if not SERVER_RE.fullmatch(server):
        sys.exit("服务器地址不合规。")
    st, j = api({"server": server}, "POST", "/sync/claim", {"code": code, "device": socket.gethostname()[:40]})
    if st != 200 or not KEY_RE.fullmatch(str(j.get("key", ""))):
        sys.exit(f"配对没成功：{err_msg(j)}")
    save_private(CONFIG_FILE, json.dumps({"server": server, "key": j["key"], "customer": j.get("customer", "")}, ensure_ascii=False))
    print(json.dumps({"paired": True, "customer": j.get("customer", ""), "server": server}, ensure_ascii=False))


def stage_files(files):
    """把文档隐去敏感信息后放进暂存目录，并写 INDEX.md。原文件不动。"""
    shutil.rmtree(STAGE_DIR, ignore_errors=True)
    dest = os.path.join(STAGE_DIR, REMOTE_DIR_NAME)
    os.makedirs(dest, mode=0o700)
    rows, hidden, unreadable = [], 0, 0
    for f in files:
        try:
            with open(f["path"], encoding="utf-8") as fh:
                text = fh.read()
        except (OSError, UnicodeDecodeError):
            unreadable += 1
            continue
        if secret_hit(text):  # 整理之后才写进密钥的，照样整份不传
            unreadable += 1
            continue
        clean = redact(text)
        if clean != text:
            hidden += 1
        out = os.path.join(dest, f["rel"])
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, "w", encoding="utf-8") as fh:
            fh.write(clean)
        rows.append(f)
    by_top = {}
    for f in rows:
        by_top.setdefault(f["rel"].split(os.sep)[0] if os.sep in f["rel"] else "其他", []).append(f)
    lines = [
        f"# {REMOTE_DIR_NAME}",
        "",
        OWNER_LINE,
        "",
        f"由客户本机的「同步给 dondon」按最近各个 Agent 聊天里读过、写过的文档整理，同步时间 "
        f"{datetime.now().strftime('%Y-%m-%d %H:%M')}。每次同步整目录替换；这里没有的文件说明最近没再用到。"
        "文件里出现「〔已隐去〕」的地方是本机先隐去的密钥、手机号等。",
        "",
    ]
    for top in sorted(by_top, key=lambda t: -len(by_top[t])):
        lines += [f"## {top}（{len(by_top[top])} 个）", ""]
        for f in sorted(by_top[top], key=lambda x: x["last"], reverse=True):
            lines.append(f"- `{f['rel']}`：最近用到 {local(datetime.fromisoformat(f['last']))}，"
                         f"{f['count']} 次，来自 {'、'.join(f['from'])}")
        lines.append("")
    with open(os.path.join(dest, "INDEX.md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    return dest, len(rows), hidden, unreadable


HISTORY_DIR = os.path.join(STATE_DIR, "history")
HISTORY_KEEP = 30


def read_opps(args):
    if not getattr(args, "opps_file", None):
        return ""
    with open(args.opps_file, encoding="utf-8") as fh:
        return redact(fh.read().strip())


def save_history(recent, opps, files, result, material=""):
    """每次发出去的近况、机会清单、文档名（自动同步时还有上传的会话素材）在本机留一份，最多留 HISTORY_KEEP 次，用户随时可以翻看。"""
    os.makedirs(HISTORY_DIR, mode=0o700, exist_ok=True)
    name = datetime.now().strftime("%Y%m%d-%H%M%S") + ".md"
    lines = [f"# 同步记录 {datetime.now().strftime('%Y-%m-%d %H:%M')}", "",
             f"结果：{json.dumps(result, ensure_ascii=False)}", "", recent or "（这次没有近况）", "", opps or "（这次没有机会清单）",
             "", f"## 发出的文档（{len(files)} 个，内容里的手机号等已隐去）", ""]
    lines += [f"- {f['rel']}" for f in files]
    if material:
        lines += ["", "## 上传的会话素材（自动同步时由服务器据此写近况，写完即丢弃）", "", material]
    save_private(os.path.join(HISTORY_DIR, name), "\n".join(lines) + "\n")
    old = sorted(x for x in os.listdir(HISTORY_DIR) if x.endswith(".md"))
    for x in old[:-HISTORY_KEEP]:
        os.remove(os.path.join(HISTORY_DIR, x))


def push_key(cfg, args, recent, files, material="", rules=""):
    """上传文档和近况、机会清单；自动同步时不带近况，改交会话素材和写法规则，由服务器写近况和机会清单。"""
    dest, n, hidden, unreadable = stage_files(files)
    up = []
    for dp, _, fns in os.walk(dest):
        for fn in fns:
            full = os.path.join(dp, fn)
            with open(full, encoding="utf-8") as fh:
                up.append({"path": os.path.relpath(full, dest), "text": fh.read()})
    if material:
        opps = ""
        body = {"files": up, "material": material, "rules": rules}
    else:
        opps = read_opps(args)
        body = {"files": up, "recent": recent, "opps": opps}
    st, j = api(cfg, "POST", "/sync/upload", body, key=cfg["key"], timeout=420 if material else 180)  # 服务器写近况要一两分钟
    shutil.rmtree(STAGE_DIR, ignore_errors=True)
    if st != 200:
        sys.exit(f"上传没成功：{err_msg(j)}")
    if material:
        recent, opps = j.get("recent") or "", j.get("opps") or ""
        if not recent.startswith(SYNC_MARK):
            sys.exit("同步服务还不支持替你写近况（服务方还没升级），这次没发。")
    result = {"uploaded_files": n, "redacted_files": hidden, "unreadable_skipped": unreadable}
    for _ in range(45):  # 服务器每 15 秒处理一次，最多等 90 秒
        time.sleep(2)
        st, r = api(cfg, "GET", "/sync/result", key=cfg["key"])
        if st == 200 and r.get("status") == "done":
            result.update({k: r[k] for k in ("ok", "files", "recent", "opps", "message") if k in r})
            break
    else:
        result["note"] = "已经上传，bot 那边还在处理，几分钟内会收到。"
    save_history(recent, opps, files, result, material)
    print(json.dumps(result, ensure_ascii=False))
    if result.get("ok") is False:
        sys.exit(1)


def cmd_push(args):
    cfg = load_config()
    if not cfg:
        sys.exit("这台电脑还没和 dondon 配对。请在微信或飞书里对 dondon 说「绑定电脑」，拿到配对码后运行 pair <配对码>。")
    recent = redact(sys.stdin.read().strip()) if args.recent else ""
    if args.recent and not recent.startswith(SYNC_MARK):
        sys.exit(f"近况第一行必须是「{SYNC_MARK}」，没有推送。")
    try:
        with open(FILES_LIST, encoding="utf-8") as f:
            files = json.load(f)["files"]
    except (OSError, ValueError, KeyError):
        sys.exit("没有文件清单，先运行 collect。")
    return push_key(cfg, args, recent, files)


def fetch_skills():
    """从 bot 取它装着的技能列表（中文名（英文名）），写机会清单时只能从这里选。"""
    cfg = load_config()
    if not cfg:
        sys.exit("这台电脑还没和 dondon 配对，取不到 bot 的技能列表；机会清单可以不写。")
    st, j = api(cfg, "GET", "/sync/skills", key=cfg["key"])
    if st != 200:
        sys.exit(f"取技能列表失败：{err_msg(j)}")
    skills = j.get("skills") or {}
    if not skills:
        sys.exit("bot 那边还没报上技能列表（几分钟后再试）；这次机会清单的技能都写「无」。")
    return "\n".join(f"{zh}（{en}）" for en, zh in skills.items())


def cmd_skills(_args):
    print(fetch_skills())


def cmd_status(_args):
    state = load_state()
    print(json.dumps({
        "last_sync": state.get("last_sync"),
        "claude_code_logs": len(glob.glob(CLAUDE_GLOB)),
        "codex_logs": len(glob.glob(CODEX_GLOB, recursive=True)),
        "workbuddy_logs": len(glob.glob(WORKBUDDY_GLOB)),
        "grok_logs": len(glob.glob(GROK_GLOB)),
        "material_left": os.path.exists(MATERIAL_FILE),
        "push_target": {k: v for k, v in (load_config() or {}).items() if k != "key"} or None,  # 钥匙不打印
        "auto": schedule_info(state),
    }, ensure_ascii=False))


# ---------- 自动同步（macOS launchd） ----------
LABEL = "com.dontbesilent.dondon-sync"
PLIST = os.path.expanduser(f"~/Library/LaunchAgents/{LABEL}.plist")
AUTO_LOG = os.path.join(STATE_DIR, "auto.log")
SKILL_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "SKILL.md")


def schedule_info(state=None):
    state = state if state is not None else load_state()
    a = state.get("auto") or {}
    return {"asked": bool(a.get("asked")), "on": bool(a.get("on")) and os.path.exists(PLIST), "time": a.get("time"),
            "last_run": a.get("last_run"), "last_result": a.get("last_result"),
            "history_dir": HISTORY_DIR}


def save_auto(**kw):
    state = load_state()
    state.setdefault("auto", {}).update(kw)
    save_private(STATE_FILE, json.dumps(state, ensure_ascii=False))


def launchctl(*a):
    return subprocess.run(["launchctl", *a], capture_output=True, text=True)


def cmd_schedule(args):
    if args.action == "status":
        print(json.dumps(schedule_info(), ensure_ascii=False))
        return
    if args.action == "decline":
        save_auto(asked=True, on=False)
        print(json.dumps({"auto": "off", "note": "已记下：只手动同步，以后不再问。想开时说「开启自动同步」。"}, ensure_ascii=False))
        return
    uid = str(os.getuid())
    if args.action == "off":
        launchctl("bootout", f"gui/{uid}/{LABEL}")
        if os.path.exists(PLIST):
            os.remove(PLIST)
        save_auto(asked=True, on=False)
        print(json.dumps({"auto": "off", "note": "已停止自动同步。"}, ensure_ascii=False))
        return
    # on
    if sys.platform != "darwin":
        sys.exit("这台电脑不是 macOS，暂时不支持自动同步；每次手动运行同步就行。")
    if not load_config():
        sys.exit("这台电脑还没和 dondon 配对，先对 bot 说「绑定电脑」配对，再开自动同步。")
    m = re.fullmatch(r"([01]?\d|2[0-3]):([0-5]\d)", args.time or "09:00")
    if not m:
        sys.exit("时间写成 HH:MM，例如 09:00。")
    hour, minute = int(m.group(1)), int(m.group(2))
    script = os.path.abspath(__file__)
    path_env = "/usr/bin:/bin:/usr/sbin:/sbin"
    import plistlib
    os.makedirs(os.path.dirname(PLIST), exist_ok=True)
    with open(PLIST, "wb") as f:
        plistlib.dump({
            "Label": LABEL,
            "ProgramArguments": [sys.executable, "-I", script, "auto-run"],
            "StartCalendarInterval": {"Hour": hour, "Minute": minute},  # 那时在睡眠，醒来后补跑一次
            "EnvironmentVariables": {"PATH": path_env, "HOME": HOME, "LANG": "zh_CN.UTF-8"},
            "StandardOutPath": AUTO_LOG, "StandardErrorPath": AUTO_LOG,
            "ProcessType": "Background", "LowPriorityIO": True,
        }, f)
    launchctl("bootout", f"gui/{uid}/{LABEL}")
    r = launchctl("bootstrap", f"gui/{uid}", PLIST)
    if r.returncode:
        sys.exit("登记定时任务失败：" + (r.stderr or r.stdout).strip()[-300:])
    save_auto(asked=True, on=True, time=f"{hour:02d}:{minute:02d}")
    print(json.dumps({"auto": "on", "time": f"每天 {hour:02d}:{minute:02d}",
                      "history_dir": HISTORY_DIR, "log": AUTO_LOG}, ensure_ascii=False))


def skill_rules():
    """从 SKILL.md 取写近况和机会清单的规则（第 2 步、第 2b 步），自动同步时原样交给服务器，按它写近况。"""
    try:
        text = open(SKILL_FILE, encoding="utf-8").read()
    except OSError:
        sys.exit("找不到 SKILL.md，自动同步没法按规则写近况。")
    a, b = text.find("## 第 2 步"), text.find("## 第 3 步")
    if a < 0 or b < a:
        sys.exit("SKILL.md 里找不到第 2 步的规则。")
    return text[a:b]


def cmd_auto_run(_args):
    """定时任务入口。没人看着：任何一步不对就停下记日志，不发半截内容。"""
    started = datetime.now()

    def done(ok, msg):
        save_auto(last_run=started.strftime("%Y-%m-%d %H:%M"), last_result=("成功：" if ok else "没发出：") + msg)
        print(f"[{started:%Y-%m-%d %H:%M}] {'成功' if ok else '没发出'}：{msg}", flush=True)
        if not ok:
            sys.exit(1)

    if not load_config():
        done(False, "这台电脑还没配对")
    cfg = load_config()
    ns = argparse.Namespace(days=None, sources=["claude", "codex", "workbuddy", "grok"], exclude=[], max_chars=DEFAULT_MAX_CHARS)
    import contextlib
    import io
    with contextlib.redirect_stdout(io.StringIO()):
        info = cmd_collect(ns)
    if not info["sessions"] or not info["new"]:
        for f in (MATERIAL_FILE, FILES_LIST):
            if os.path.exists(f):
                os.remove(f)
        done(True, "上次同步以后没有新的聊天，这次不发")
    material = open(MATERIAL_FILE, encoding="utf-8").read()
    try:
        with open(FILES_LIST, encoding="utf-8") as f:
            files = json.load(f)["files"]
    except (OSError, ValueError, KeyError):
        done(False, "没有文件清单")
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            push_key(cfg, argparse.Namespace(opps_file=None), "", files, material=redact(material), rules=skill_rules())
        pushed = True
    except SystemExit as e:
        pushed, reason = False, str(e) or buf.getvalue()[-300:]
    if not pushed:
        done(False, "推送失败：" + reason)
    with contextlib.redirect_stdout(io.StringIO()):
        cmd_mark_synced(None)
    done(True, f"近况和 {info['files']} 个文档已同步（近况由服务器按素材写）；发出的内容留在 {HISTORY_DIR}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("collect", help="整理素材")
    c.add_argument("--days", type=int, help=f"聊天看最近 N 天（默认 {DEFAULT_DAYS}，最多 {MAX_DAYS}）；文档取 N 天和 {FILE_DAYS} 天里较长的")
    c.add_argument("--sources", default="claude,codex,workbuddy,grok", help="claude、codex、workbuddy、grok，用逗号隔开")
    c.add_argument("--exclude", nargs="*", default=[], help="不收入的项目目录名（包含即排除）")
    c.add_argument("--max-chars", type=int, default=DEFAULT_MAX_CHARS)
    sub.add_parser("copy", help="从标准输入复制近况到剪贴板")
    sub.add_parser("mark-synced", help="记下同步时间并删除素材")
    sub.add_parser("status", help="查看同步状态")
    pu = sub.add_parser("push", help="把文件清单里的文档（和标准输入里的近况）直接推给 bot")
    pu.add_argument("--recent", action="store_true", help="从标准输入读近况，一起写进 bot")
    pu.add_argument("--opps-file", help="机会清单文件（第一行【机会清单】），一起交给 bot")
    sub.add_parser("skills", help="从 bot 取它装着的技能列表")
    pa = sub.add_parser("pair", help="用 bot 给的 6 位配对码换同步钥匙")
    pa.add_argument("code")
    pa.add_argument("--server", help=f"同步入口（默认 {DEFAULT_SERVER}）")
    sc = sub.add_parser("schedule", help="自动同步：on / off / decline / status")
    sc.add_argument("action", choices=["on", "off", "decline", "status"])
    sc.add_argument("--time", help="每天几点同步，HH:MM，默认 09:00")
    sub.add_parser("auto-run", help="定时任务运行的命令（不用手动调用）")
    args = ap.parse_args()
    if args.cmd == "collect":
        args.sources = [x.strip() for x in args.sources.split(",") if x.strip()]
    {"collect": cmd_collect, "copy": cmd_copy, "mark-synced": cmd_mark_synced, "status": cmd_status,
     "push": cmd_push, "skills": cmd_skills, "pair": cmd_pair,
     "schedule": cmd_schedule, "auto-run": cmd_auto_run}[args.cmd](args)


if __name__ == "__main__":
    main()
