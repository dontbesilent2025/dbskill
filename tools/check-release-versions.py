#!/usr/bin/env python3
"""校验 dbskill 发布版本在全部公开入口保持一致。"""

import json
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
version = (ROOT_DIR / "VERSION").read_text(encoding="utf-8").strip()
marketplace_path = ROOT_DIR / ".claude-plugin" / "marketplace.json"
marketplace = json.loads(marketplace_path.read_text(encoding="utf-8"))
readme = (ROOT_DIR / "README.md").read_text(encoding="utf-8")

errors = []
metadata_version = marketplace.get("metadata", {}).get("version")
if metadata_version != version:
    errors.append(
        f"metadata.version 为 {metadata_version!r}，VERSION 为 {version!r}"
    )

for label, expected in (
    ("README 最新更新", f"**最新更新：v{version}**"),
    ("README 当前版本", "当前版本：" + chr(96) + f"v{version}" + chr(96)),
):
    if expected not in readme:
        errors.append(f"{label} 未声明为 v{version}")

for plugin in marketplace.get("plugins", []):
    plugin_version = plugin.get("version")
    if plugin_version != version:
        errors.append(
            f"插件 {plugin.get('name', '<未命名>')} 的 version 为 "
            f"{plugin_version!r}，应为 {version!r}"
        )

if errors:
    print("发布版本校验失败：", file=sys.stderr)
    for error in errors:
        print(f"- {error}", file=sys.stderr)
    sys.exit(1)

print(
    f"发布版本校验通过：{version} "
    f"（{len(marketplace.get('plugins', []))} 个插件）"
)
