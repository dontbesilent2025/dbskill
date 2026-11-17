---
name: dbs-install-skill
description: 将单个 Skill 或 Skill 集合安装到通用 Agents、Claude Code、Codex、WorkBuddy、Grok、Hermes Agent、Kiro、Qwen Code、Cline、Antigravity 等 Agent。用户要求跨 Agent 安装、同步、查看、去重或卸载 Skill 时使用。
metadata:
  dbs-handoff: |
    - 一个 Skill 名称、路径或 Skill 集合目录，要安装或同步 → 在本机已有的各 Agent 里建立入口链接，本机有 Grok 时另建适配层，清理指向同一来源的重复链接，交出各入口和清理结果；目标位置已有真实目录或其他来源时停下等用户确认
    - 已安装的 Skill，要查看状态 → 安装状态和发现的重复入口
    - 已安装的 Skill，要卸载 → 移除各入口链接和 Grok 适配层，保留 Skill 源文件
    - 不交出：Skill 内容修改、项目规则文件迁移、为未安装的 Agent 新建目录、覆盖或删除真实目录
---

# dbs-install-skill：多端 Skill 安装与同步

把任意包含 `SKILL.md` 的 Skill 源目录，或包含多个 Skill 子目录的集合目录，安装到本机已经存在的 Agent。

用户始终使用同一条命令。脚本自动选择公共入口或专属入口，用户无需判断宿主类型，也无需添加模式参数。

---

## 自动路由

### 公共入口

脚本始终把 Skill 链接写入：

- 通用 Agents：`~/.agents/skills/<skill-name>`

以下客户端可以读取该公共入口，因此不再写入各自的专属目录：

- Codex；
- GitHub Copilot；
- Gemini CLI；
- Cursor；
- Augment；
- Roo Code；
- OpenCode；
- OpenHands。

同一个 Skill 不会同时出现在 `~/.agents/skills` 和上述客户端的专属目录中。这样可以避免 Codex 等客户端重复显示。

### 专属入口

以下客户端当前仍使用专属目录。只有对应主目录已经存在时，脚本才创建链接：

- Claude Code：`~/.claude/skills/<skill-name>`；
- WorkBuddy：`~/.workbuddy/skills/<skill-name>`；
- Hermes Agent：`~/.hermes/skills/<skill-name>`；
- Kiro：`~/.kiro/skills/<skill-name>`；
- Qwen Code：`~/.qwen/skills/<skill-name>`；
- Cline：`~/.cline/skills/<skill-name>`；
- Antigravity App、IDE 和 CLI：`~/.gemini/config/skills/<skill-name>`（仅在 `~/.gemini/config` 已存在时）。

Unix-like 系统使用符号链接；Windows 的 Bash／MSYS 环境使用目录 Junction，避免 `ln -s` 在部分配置下生成实体目录副本。

### Grok 薄适配层

本机存在 `~/.grok` 时，脚本生成：

- `~/.grok/skills/<skill-name>/SKILL.md`

该文件必须包含 `user_invocable: true`，并指向真源 `SKILL.md`。

### 自动清理

每次执行 `link` 时，脚本同时处理历史遗留项：

1. 删除公共入口兼容客户端专属目录中指向同一真源的冗余链接；
2. 删除旧版脚本曾写入、当前已停止维护的宿主链接；
3. 删除同一宿主中指向同一真源、且规范名称已经存在的旧别名；
4. 集合安装时删除指向集合内已失效源目录的断裂链接和 Grok 适配层；
5. 保留真实目录、真实文件以及指向其他来源的链接，并报告冲突；
6. 不删除源 Skill。

---

## 核心原则

1. **一个公共入口。** 支持通用 Agents 目录的客户端统一读取 `~/.agents/skills`。
2. **必要时补专属入口。** 仅给当前仍依赖原生目录的客户端创建链接。
3. **用户无需选择模式。** 脚本不要求用户提供路由参数。
4. **公共兼容客户端只保留一份。** Codex 等客户端不能同时存在公共入口和专属入口。
5. **各宿主只使用链接。** Windows 使用目录 Junction，Unix-like 系统使用符号链接；Grok 是唯一使用薄适配层的宿主。
6. **不创建不存在的 Agent 主目录。** `~/.agents` 是公共安装入口，可以由脚本创建；其他 Agent 主目录不存在时直接跳过。
7. **不覆盖真实目录。** 目标位置已有真实目录或文件时，保留并报告；Windows 上提示它可能是旧版 MSYS 生成的实体副本。
8. **卸载只删派生产物。** `unlink` 只删除指向指定真源的符号链接或 Junction，以及本工具生成的 Grok 适配层。
9. **优先使用脚本。** 使用本 Skill 自带的 `scripts/install-skill.sh`，不要临场重写安装命令。

---

## 确定源 Skill

用户可能提供：

- Skill 名称：`dbs-diagnosis`；
- 相对路径：`skills/dbs-diagnosis`；
- 绝对路径：`/Users/.../dbskill/skills/dbs-diagnosis`；
- 外部 Skill：`/Users/.../external-skills/lark-doc`；
- Skill 集合目录：`/Users/.../dbskill/skills`；
- 当前上下文刚创建或刚修改的 Skill。

按以下优先级判断：

1. 用户给了绝对路径，直接使用；
2. 用户给了相对路径，先按当前工作目录解析，再按 dbskill 仓库根目录解析；
3. 用户只给 Skill 名称，先查当前工作目录，再查 dbskill 仓库 `skills/<name>`；
4. 用户只说“这个 Skill”，使用当前对话刚创建、改名或讨论的 Skill；
5. 仍不确定时，查看当前工作目录和仓库 `skills/` 下最近修改的 Skill；
6. 仍无法确定时，只问一句：`安装哪个 Skill？给我 Skill 名称或路径。`

源目录必须满足以下任一条件：

- 目录本身包含 `SKILL.md`；
- 目录的一级子目录中包含一个或多个 `SKILL.md`。

入口名优先读取真源 `SKILL.md` frontmatter 中的 `name`；只有 `name` 缺失时才退回源目录名。这样源目录可以使用分类前缀，各 Agent 仍保持稳定的历史触发名。

---

## 界面元数据闸门

`link` 和 `status` 执行前，脚本从源目录开始逐级向上查找 `AGENTS.md`。找到的 `AGENTS.md` 含有 `<!-- skill-interface-gate: required -->` 标记时，脚本用本 Skill 所在仓库的 `tools/check-skill-interface-metadata.py` 校验源目录：

- 校验失败时，脚本停止，不建立链接，也不查看状态；
- 校验器不存在时，脚本同样停止；
- 没有找到该标记时，脚本跳过这一步；
- `unlink` 不做这项校验。

校验失败时，把校验器的报错回报给用户，不绕过脚本手动建立链接。

---

## 执行安装

在 dbskill 仓库根目录运行：

```bash
skills/dbs-install-skill/scripts/install-skill.sh link <skill-name-or-path>
```

示例：

```bash
skills/dbs-install-skill/scripts/install-skill.sh link dbs-diagnosis
skills/dbs-install-skill/scripts/install-skill.sh link skills/my-custom-skill
skills/dbs-install-skill/scripts/install-skill.sh link skills
skills/dbs-install-skill/scripts/install-skill.sh link "/absolute/path/to/skill"
skills/dbs-install-skill/scripts/install-skill.sh link "/Users/me/external-skills"
```

执行完成后，根据脚本输出回报公共入口、专属入口、Grok 适配层和冗余清理结果。

---

## 查看状态

用户问“装好了吗”“有没有重复”“查看安装状态”时运行：

```bash
skills/dbs-install-skill/scripts/install-skill.sh status <skill-name-or-path>
```

状态正常时，脚本必须输出：

```text
✓ 未发现冗余入口
```

公共兼容客户端的专属目录中仍有同源链接时，状态返回失败并报告：

```text
✗ 发现冗余入口：<target> -> <source>
```

---

## 卸载 Skill

用户说“卸载 Skill”“取消安装”“unlink”时运行：

```bash
skills/dbs-install-skill/scripts/install-skill.sh unlink <skill-name-or-path>
```

完成后告诉用户：源 Skill 没有被删除，只移除了公共入口、专属入口和 Grok 适配层等派生产物。

---

## 输出规范

安装完成后简短回报：

```markdown
已安装 `<skill-name>`：

- 公共入口：`~/.agents/skills/<skill-name>`；
- 专属入口：仅写入本机已安装且仍需要专属目录的 Agent；
- Grok：`~/.grok/skills/<skill-name>/SKILL.md`（本机存在时）；
- 去重：已清理指向同一真源的历史冗余链接。
```

遇到真实目录或其他来源时：

```markdown
已保留 `<target-path>`，因为它是一个真实目录、真实文件或指向其他来源。需要你手动确认后再处理。
```

---

## 自检

每次执行前后确认：

- 源目录存在；
- 源目录包含 `SKILL.md`，或其一级子目录包含 `SKILL.md`；
- 入口名与真源 frontmatter `name` 一致；缺失 `name` 时才使用源目录名；
- 外部路径使用绝对路径，或能从当前工作目录解析；
- `~/.agents/skills/<name>` 是公共规范入口；
- Codex 等公共兼容客户端的专属目录中没有同源链接；
- 专属宿主目标位置若存在，必须是指向当前真源的符号链接或 Junction；
- Grok 目标位置若存在，必须是本工具生成的 Grok 适配层，且指向当前真源或原真源已不存在，才允许更新或移除；
- 真实目录、真实文件和其他来源链接没有被删除；
- 源目录没有被删除；
- `private/` 与 `.private/` 没有被读取、复制、暂存或安装。

---

完成当前任务后直接结束。用户的请求超出本 Skill 的范围、任务完成后用户的材料里出现明确的后续需求，或用户询问下一步时，用一句话说明还需要哪种能力，不点名其他 Skill；当前环境已经安装 `/dbs` 时，补一句「可以输入 `/dbs`，由它匹配对应的 Skill」。
