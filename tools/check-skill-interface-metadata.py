#!/usr/bin/env python3
"""校验或补齐 Agent Skill 的 Codex 界面元数据。"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path


SHORT_DESCRIPTION_MIN = 25
SHORT_DESCRIPTION_MAX = 64
GATE_MARKER = "<!-- skill-interface-gate: required -->"
FORBIDDEN_TEMPLATES = (
    "调用该 Skill 完成",
    "并给出清晰、具体、可继续执行的结果",
    "处理相关输入",
    "按专用流程完成任务",
)


@dataclass
class Skill:
    root: Path
    directory: Path
    name: str
    description: str
    body: str

    @property
    def metadata_path(self) -> Path:
        return self.directory / "agents" / "openai.yaml"


def read_frontmatter(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    match = re.match(r"\A---\s*\n(.*?)\n---(?:\s*\n|\Z)", text, re.DOTALL)
    if match is None:
        raise ValueError("缺少合法的 YAML frontmatter")
    return match.group(1)


def read_frontmatter_scalar(frontmatter: str, field: str) -> str:
    lines = frontmatter.splitlines()
    prefix = f"{field}:"
    for index, line in enumerate(lines):
        if not line.startswith(prefix):
            continue
        value = line[len(prefix) :].strip()
        if not re.fullmatch(r"[|>][+-]?", value):
            return value.strip("\"'")
        content: list[str] = []
        for continuation in lines[index + 1 :]:
            if continuation and not continuation[0].isspace():
                break
            content.append(
                continuation[2:] if continuation.startswith("  ") else continuation
            )
        return ("\n" if value.startswith("|") else " ").join(content).strip()
    return ""


def read_interface_scalar(text: str, field: str) -> str:
    match = re.search(rf"(?m)^\s{{2}}{re.escape(field)}:\s*(.*?)\s*$", text)
    if match is None:
        return ""
    raw = match.group(1).strip()
    if len(raw) >= 2 and raw[0] == raw[-1] and raw[0] in {"\"", "'"}:
        if raw[0] == "\"":
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                pass
        return raw[1:-1]
    return raw


def valid_display_name(name: str, display_name: str) -> bool:
    if display_name == name:
        return True
    return (
        display_name.startswith(f"{name}（")
        and display_name.endswith("）")
        and bool(re.search(r"[\u3400-\u9fff]", display_name[len(name) + 1 : -1]))
    )


def discover_skills(argument: Path) -> tuple[Path, list[Path]]:
    path = argument.expanduser().resolve()
    if (path / "SKILL.md").is_file():
        return path.parent, [path]
    collection = path / "skills" if (path / "skills").is_dir() else path
    directories = sorted(
        skill_file.parent
        for skill_file in collection.glob("*/SKILL.md")
        if skill_file.is_file()
    )
    if not directories:
        raise ValueError(f"{path} 中没有一级 Skill")
    return collection, directories


def load_skill(root: Path, directory: Path) -> Skill:
    skill_path = directory / "SKILL.md"
    source = skill_path.read_text(encoding="utf-8")
    frontmatter = read_frontmatter(skill_path)
    name = read_frontmatter_scalar(frontmatter, "name")
    description = read_frontmatter_scalar(frontmatter, "description")
    if not name:
        raise ValueError("frontmatter 缺少 name")
    if name in {".", ".."} or "/" in name:
        raise ValueError(f"name 不合法：{name!r}")
    if not description:
        raise ValueError("frontmatter 缺少 description")
    body = re.sub(r"\A---\s*\n.*?\n---(?:\s*\n|\Z)", "", source, count=1, flags=re.DOTALL)
    return Skill(
        root=root,
        directory=directory,
        name=name,
        description=description,
        body=body,
    )


def normalize_description(description: str) -> str:
    text = re.sub(r"[`*_#]", "", description)
    text = re.sub(r"\s+", " ", text).strip()
    text = re.split(r"(?:触发方式|触发词|Triggers?)\s*[：:]", text, maxsplit=1)[0]
    text = text.strip(" ，,。；;：:")
    first_sentence = re.split(r"(?<=[。！？!?；;])\s*", text, maxsplit=1)[0]
    return first_sentence.strip(" ，,。；;：:")


def body_summary(body: str) -> str:
    body = re.sub(r"```.*?```", "", body, flags=re.DOTALL)
    candidates: list[tuple[int, str]] = []
    action_markers = ("把", "将", "通过", "读取", "生成", "分析", "转换", "创建", "检查", "搜索", "识别", "用于")
    for order, paragraph in enumerate(re.split(r"\n\s*\n", body)):
        lines = [line.strip() for line in paragraph.splitlines() if line.strip()]
        if not lines or any(
            line.startswith(("#", "- ", "* ", ">", "|", "```"))
            or re.match(r"^\d+[.)、]\s*", line)
            for line in lines
        ):
            continue
        text = re.sub(r"[`*_]", "", " ".join(lines))
        text = re.sub(r"\s+", " ", text).strip()
        if not 10 <= len(text) <= 240:
            continue
        if "触发" in text or re.fullmatch(r"(?:https?://\S+|\S+：\S+)", text):
            continue
        score = sum(marker in text for marker in action_markers) * 3
        if text.startswith(("当用户", "用户", "本 skill", "本 Skill")):
            score += 4
        score += max(0, 6 - order)
        candidates.append((score, text))
    if not candidates:
        return ""
    return max(candidates, key=lambda item: item[0])[1].strip(" ，,。；;：:")


def make_short_description(skill: Skill) -> str:
    text = normalize_description(skill.description)
    if len(text) < SHORT_DESCRIPTION_MIN:
        supplement = body_summary(skill.body)
        if supplement:
            text = f"{text}：{supplement}"
        else:
            text = f"{text}，按专用流程完成任务并输出可直接使用的结果"
    if len(text) < SHORT_DESCRIPTION_MIN:
        text = f"{text}，输出可直接使用的结果"
    if len(text) > SHORT_DESCRIPTION_MAX:
        text = text[: SHORT_DESCRIPTION_MAX - 1].rstrip(" ，,。；;：:") + "…"
    return text


def render_metadata(name: str, short_description: str) -> str:
    prompt = f"使用 ${name}，{short_description.rstrip('。')}。"
    return (
        "interface:\n"
        f"  display_name: {json.dumps(name, ensure_ascii=False)}\n"
        f"  short_description: {json.dumps(short_description, ensure_ascii=False)}\n"
        f"  default_prompt: {json.dumps(prompt, ensure_ascii=False)}\n"
    )


def replace_interface_scalar(text: str, field: str, value: str) -> str:
    replacement = f"  {field}: {json.dumps(value, ensure_ascii=False)}"
    pattern = re.compile(rf"(?m)^\s{{2}}{re.escape(field)}:\s*.*$")
    if pattern.search(text):
        return pattern.sub(replacement, text, count=1)
    interface = re.search(r"(?m)^interface:\s*$", text)
    if interface is None:
        suffix = "" if not text or text.endswith("\n") else "\n"
        return f"{text}{suffix}interface:\n{replacement}\n"
    insert_at = interface.end()
    return f"{text[:insert_at]}\n{replacement}{text[insert_at:]}"


def fix_skill(skill: Skill) -> bool:
    path = skill.metadata_path
    generated_short = make_short_description(skill)
    if not path.is_file():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(render_metadata(skill.name, generated_short), encoding="utf-8")
        print(f"created: {path}")
        return True

    original = path.read_text(encoding="utf-8")
    text = original
    display_name = read_interface_scalar(text, "display_name")
    short_description = read_interface_scalar(text, "short_description")
    default_prompt = read_interface_scalar(text, "default_prompt")
    if not valid_display_name(skill.name, display_name):
        text = replace_interface_scalar(text, "display_name", skill.name)
    if (
        not SHORT_DESCRIPTION_MIN <= len(short_description) <= SHORT_DESCRIPTION_MAX
        or any(marker in short_description for marker in FORBIDDEN_TEMPLATES)
    ):
        short_description = generated_short
        text = replace_interface_scalar(text, "short_description", short_description)
    if f"${skill.name}" not in default_prompt or any(
        marker in default_prompt for marker in FORBIDDEN_TEMPLATES
    ):
        prompt = f"使用 ${skill.name}，{short_description.rstrip('。')}。"
        text = replace_interface_scalar(text, "default_prompt", prompt)
    if text != original:
        if not text.endswith("\n"):
            text += "\n"
        path.write_text(text, encoding="utf-8")
        print(f"updated: {path}")
        return True
    return False


def validate_skill(skill: Skill) -> list[str]:
    path = skill.metadata_path
    relative = path.relative_to(skill.root)
    if not path.is_file():
        return [f"{skill.root.name}/{relative} 不存在"]
    text = path.read_text(encoding="utf-8")
    display_name = read_interface_scalar(text, "display_name")
    short_description = read_interface_scalar(text, "short_description")
    default_prompt = read_interface_scalar(text, "default_prompt")
    errors: list[str] = []
    if not valid_display_name(skill.name, display_name):
        errors.append(
            f"{relative} 的 display_name 应为 {skill.name!r} 或“{skill.name}（中文名）”，"
            f"当前为 {display_name!r}"
        )
    if not SHORT_DESCRIPTION_MIN <= len(short_description) <= SHORT_DESCRIPTION_MAX:
        errors.append(
            f"{relative} 的 short_description 应为 {SHORT_DESCRIPTION_MIN}–"
            f"{SHORT_DESCRIPTION_MAX} 个字符，当前为 {len(short_description)} 个字符"
        )
    for marker in FORBIDDEN_TEMPLATES:
        if marker in short_description or marker in default_prompt:
            errors.append(f"{relative} 使用了空泛界面模板 {marker!r}")
    if f"${skill.name}" not in default_prompt:
        errors.append(f"{relative} 的 default_prompt 必须包含 ${skill.name}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fix", action="store_true", help="补齐并修正常见元数据问题")
    parser.add_argument("paths", nargs="+", type=Path, help="项目根目录、skills 目录或 Skill 目录")
    args = parser.parse_args()

    all_groups: list[tuple[Path, list[Skill]]] = []
    errors: list[str] = []
    changed = 0
    for argument in args.paths:
        try:
            root, directories = discover_skills(argument)
        except ValueError as error:
            errors.append(str(error))
            continue
        skills: list[Skill] = []
        for directory in directories:
            try:
                skill = load_skill(root, directory)
            except ValueError as error:
                errors.append(f"{directory / 'SKILL.md'}：{error}")
                continue
            if args.fix and fix_skill(skill):
                changed += 1
            skills.append(skill)
        all_groups.append((root, skills))

    for root, skills in all_groups:
        display_names: dict[str, Path] = {}
        short_descriptions: dict[str, Path] = {}
        for skill in skills:
            errors.extend(validate_skill(skill))
            if not skill.metadata_path.is_file():
                continue
            text = skill.metadata_path.read_text(encoding="utf-8")
            display_name = read_interface_scalar(text, "display_name")
            short_description = read_interface_scalar(text, "short_description")
            if display_name in display_names:
                errors.append(
                    f"{root} 内 display_name 重复：{display_name!r}，"
                    f"见 {display_names[display_name]} 与 {skill.metadata_path}"
                )
            else:
                display_names[display_name] = skill.metadata_path
            if short_description in short_descriptions:
                errors.append(
                    f"{root} 内 short_description 重复：{short_description!r}，"
                    f"见 {short_descriptions[short_description]} 与 {skill.metadata_path}"
                )
            else:
                short_descriptions[short_description] = skill.metadata_path

    by_name: dict[str, list[Path]] = defaultdict(list)
    for _, skills in all_groups:
        for skill in skills:
            by_name[skill.name].append(skill.directory.resolve())
    cross_root_conflicts = {
        name: paths for name, paths in by_name.items() if len(set(paths)) > 1
    }
    for name, paths in sorted(cross_root_conflicts.items()):
        print(
            f"warning: 跨真源存在同名 Skill {name!r}："
            + "；".join(str(path) for path in paths),
            file=sys.stderr,
        )

    if errors:
        print("Skill 界面元数据校验失败：", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    total = sum(len(skills) for _, skills in all_groups)
    action = f"，修复 {changed} 个文件" if args.fix else ""
    print(
        f"Skill 界面元数据校验通过：{total} 个 Skill{action}；"
        f"跨真源同名冲突 {len(cross_root_conflicts)} 个"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
