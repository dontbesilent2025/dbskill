#!/usr/bin/env python3
"""校验 Skill 的触发元数据、Codex 界面元数据与本地 beta 隐藏标记。"""

import json
import re
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
SKILLS_DIR = ROOT_DIR / "skills"
MARKETPLACE_PATH = ROOT_DIR / ".claude-plugin" / "marketplace.json"
DISPLAY_NAMES_PATH = ROOT_DIR / "tools" / "skill-display-names.json"

SPEC_DESCRIPTION_MAX = 1024
PROJECT_DESCRIPTION_WARNING = 300
PROJECT_DESCRIPTION_MAX = 512
PROJECT_DESCRIPTION_TOTAL_MAX = 6000

# 超过项目单项预算时，必须在这里登记 Skill 名和具体理由。
DESCRIPTION_LENGTH_EXCEPTIONS: dict[str, str] = {}

USAGE_MARKERS = (
    "用户",
    "用于",
    "适用",
    "当",
    "需要",
    "要求",
    "希望",
    "提到",
    "请求",
    "use when",
)

SHORT_DESCRIPTION_MIN = 25
SHORT_DESCRIPTION_MAX = 64
FORBIDDEN_INTERFACE_TEMPLATES = (
    "调用该 Skill 完成",
    "并给出清晰、具体、可继续执行的结果",
)


def read_frontmatter(skill_path: Path) -> str:
    text = skill_path.read_text(encoding="utf-8")
    match = re.match(r"\A---\s*\n(.*?)\n---(?:\s*\n|\Z)", text, re.DOTALL)
    if match is None:
        raise ValueError("缺少合法的 YAML frontmatter")
    return match.group(1)


def read_scalar(frontmatter: str, field: str) -> str:
    lines = frontmatter.splitlines()
    prefix = f"{field}:"

    for index, line in enumerate(lines):
        if not line.startswith(prefix):
            continue

        value = line[len(prefix) :].strip()
        if value not in {"|", ">"}:
            return value.strip("\"'")

        content: list[str] = []
        for continuation in lines[index + 1 :]:
            if continuation and not continuation[0].isspace():
                break
            content.append(continuation[2:] if continuation.startswith("  ") else continuation)
        separator = "\n" if value == "|" else " "
        return separator.join(content).strip()

    return ""


def is_internal(frontmatter: str) -> bool:
    return bool(
        re.search(
            r"(?ms)^metadata:\s*\n"
            r"(?:(?:[ \t]+[^\n]*)\n)*?"
            r"^[ \t]+internal:\s*(?:true|['\"]true['\"])\s*$",
            frontmatter,
        )
    )


def read_quoted_yaml_scalar(text: str, field: str) -> str:
    match = re.search(
        rf'(?m)^\s+{re.escape(field)}:\s*(["\'])(.*?)\1\s*$',
        text,
    )
    return match.group(2) if match else ""


def check_openai_metadata(skill_name: str, errors: list[str]) -> tuple[str, str]:
    metadata_path = SKILLS_DIR / skill_name / "agents" / "openai.yaml"
    relative_path = metadata_path.relative_to(ROOT_DIR)
    if not metadata_path.is_file():
        errors.append(f"{relative_path} 不存在，Codex 界面名称将退回自动生成")
        return "", ""

    text = metadata_path.read_text(encoding="utf-8")
    display_name = read_quoted_yaml_scalar(text, "display_name")
    short_description = read_quoted_yaml_scalar(text, "short_description")
    default_prompt = read_quoted_yaml_scalar(text, "default_prompt")
    if not display_name.startswith(f"{skill_name}（") or not display_name.endswith("）"):
        errors.append(
            f"{relative_path} 的 display_name 必须采用“{skill_name}（中文名）”格式；"
            f"当前为 {display_name!r}"
        )
    if not (SHORT_DESCRIPTION_MIN <= len(short_description) <= SHORT_DESCRIPTION_MAX):
        errors.append(
            f"{relative_path} 的 short_description 应为 "
            f"{SHORT_DESCRIPTION_MIN}–{SHORT_DESCRIPTION_MAX} 个字符，"
            f"当前为 {len(short_description)} 个字符"
        )
    for marker in FORBIDDEN_INTERFACE_TEMPLATES:
        if marker in short_description or marker in default_prompt:
            errors.append(
                f"{relative_path} 使用了空泛界面模板 {marker!r}；"
                "应写清该 Skill 独有的处理对象、动作与结果"
            )
    if f"${skill_name}" not in default_prompt:
        errors.append(
            f"{relative_path} 的 default_prompt 必须显式包含 ${skill_name}"
        )

    return display_name, short_description


def main() -> None:
    marketplace = json.loads(MARKETPLACE_PATH.read_text(encoding="utf-8"))
    formal_names = [plugin["name"] for plugin in marketplace.get("plugins", [])]
    registry = json.loads(DISPLAY_NAMES_PATH.read_text(encoding="utf-8"))
    approved_names = registry.get("names", {})
    errors: list[str] = []
    warnings: list[str] = []
    description_lengths: dict[str, int] = {}
    display_names: dict[str, str] = {}
    short_descriptions: dict[str, str] = {}

    missing_registry = sorted(set(formal_names) - set(approved_names))
    stale_registry = sorted(set(approved_names) - set(formal_names))
    if missing_registry:
        errors.append(
            "正式 Skill 尚未確認中文展示名，禁止發布：" + ", ".join(missing_registry)
        )
    if stale_registry:
        errors.append(
            "中文展示名登記表包含不在 marketplace 的 Skill：" + ", ".join(stale_registry)
        )

    for name in formal_names:
        skill_path = SKILLS_DIR / name / "SKILL.md"
        if not skill_path.is_file():
            errors.append(f"正式 Skill 缺少定义文件：skills/{name}/SKILL.md")
            continue

        try:
            frontmatter = read_frontmatter(skill_path)
        except ValueError as error:
            errors.append(f"skills/{name}/SKILL.md：{error}")
            continue

        declared_name = read_scalar(frontmatter, "name")
        description = read_scalar(frontmatter, "description")
        length = len(description)
        description_lengths[name] = length

        if declared_name != name:
            errors.append(
                f"skills/{name}/SKILL.md 的 name 为 {declared_name!r}，应为 {name!r}"
            )
        expected_display_name = f"{name}（{approved_names.get(name, '').strip()}）"
        if not approved_names.get(name, "").strip():
            errors.append(f"正式 Skill {name} 的中文展示名尚未確認")
        else:
            metadata_path = SKILLS_DIR / name / "agents" / "openai.yaml"
            if metadata_path.is_file():
                display_name = read_quoted_yaml_scalar(
                    metadata_path.read_text(encoding="utf-8"), "display_name"
                )
                if display_name != expected_display_name:
                    errors.append(
                        f"skills/{name}/agents/openai.yaml 的 display_name 为 {display_name!r}，"
                        f"应与已确认名称一致：{expected_display_name!r}"
                    )
        if not description:
            errors.append(f"skills/{name}/SKILL.md 的 description 不能为空")
            continue
        if length > SPEC_DESCRIPTION_MAX:
            errors.append(
                f"skills/{name}/SKILL.md 的 description 为 {length} 个字符，"
                f"超过 Agent Skills 规范上限 {SPEC_DESCRIPTION_MAX}"
            )
        if length > PROJECT_DESCRIPTION_MAX:
            reason = DESCRIPTION_LENGTH_EXCEPTIONS.get(name, "").strip()
            if not reason:
                errors.append(
                    f"skills/{name}/SKILL.md 的 description 为 {length} 个字符，"
                    f"超过项目预算 {PROJECT_DESCRIPTION_MAX}，且未登记例外理由"
                )
        elif length > PROJECT_DESCRIPTION_WARNING:
            warnings.append(
                f"skills/{name}/SKILL.md 的 description 为 {length} 个字符，"
                f"超过建议值 {PROJECT_DESCRIPTION_WARNING}"
            )

        lowered = description.casefold()
        if not any(marker.casefold() in lowered for marker in USAGE_MARKERS):
            errors.append(
                f"skills/{name}/SKILL.md 的 description 缺少明确使用条件；"
                "应同时说明做什么和什么时候使用"
            )

    total_length = sum(description_lengths.values())
    if total_length > PROJECT_DESCRIPTION_TOTAL_MAX:
        errors.append(
            f"正式 Skill description 总量为 {total_length} 个字符，"
            f"超过项目预算 {PROJECT_DESCRIPTION_TOTAL_MAX}"
        )

    beta_paths = sorted(SKILLS_DIR.glob("*beta*/SKILL.md"))
    for skill_path in beta_paths:
        try:
            frontmatter = read_frontmatter(skill_path)
        except ValueError as error:
            errors.append(f"{skill_path.relative_to(ROOT_DIR)}：{error}")
            continue
        if not is_internal(frontmatter):
            errors.append(
                f"{skill_path.relative_to(ROOT_DIR)} 缺少 metadata.internal: true，"
                "可能被通用安装器公开发现"
            )

    for skill_name in formal_names:
        display_name, short_description = check_openai_metadata(skill_name, errors)
        if not display_name:
            continue
        previous_skill = display_names.get(display_name)
        if previous_skill:
            errors.append(
                f"Codex 界面名称重复：{display_name!r} 同时用于 "
                f"{previous_skill} 和 {skill_name}"
            )
        else:
            display_names[display_name] = skill_name
        previous_skill = short_descriptions.get(short_description)
        if previous_skill:
            errors.append(
                f"Codex 短描述重复：{short_description!r} 同时用于 "
                f"{previous_skill} 和 {skill_name}"
            )
        else:
            short_descriptions[short_description] = skill_name

    for warning in warnings:
        print(f"warning: {warning}", file=sys.stderr)

    if errors:
        print("Skill 元数据校验失败：", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        sys.exit(1)

    longest_name = max(description_lengths, key=description_lengths.get)
    print(
        "Skill 元数据校验通过："
        f"{len(description_lengths)} 个正式 Skill 的 description 共 "
        f"{total_length} 个字符，最长为 {longest_name} "
        f"（{description_lengths[longest_name]} 个字符）；"
        f"{len(beta_paths)} 个 beta Skill 已标记为 internal；"
        f"{len(display_names)} 个正式 Skill 的 Codex 界面元数据符合命名规范，"
        "短描述均具体且互不重复"
    )


if __name__ == "__main__":
    main()
