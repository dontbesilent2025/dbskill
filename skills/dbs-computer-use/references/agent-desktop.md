# agent-desktop 调用要点

第 1 步选中 agent-desktop 时读取本文件。agent-desktop 是命令行工具，通过 shell 调用；每条命令输出一个 JSON（`ok`、`data` 或 `error`）。命令自带的说明与本文件不一致时，以命令自带的说明为准，并在报告里写明。

## 第一次使用

1. 运行 `agent-desktop status`，看系统、权限和支持的界面类型；
2. 运行 `agent-desktop skills get desktop` 和 `agent-desktop skills get platform`，读取当前版本的用法；
3. 不清楚某条命令的参数时，运行 `agent-desktop <命令> --help`。

## 基本循环

```bash
agent-desktop snapshot --app "应用名" -i --compact          # 读窗口里能操作的元素
agent-desktop click @s1abc:e12                             # 按元素引用操作
agent-desktop snapshot --app "应用名" -i --compact          # 读回确认
```

- 应用多、界面大时，先加 `--skeleton` 读概览，再用 `--root` 只读某一块；
- 元素引用只在当前快照内有效，界面变化后重新读；
- 报 `STALE_REF` 时重新读一次再操作；报 `AMBIGUOUS_TARGET` 时用 `find --role --name --exact` 缩小范围；
- 应用名按系统语言填写，例如中文 macOS 上的「访达」；不确定时运行 `agent-desktop list-apps`。

## 不抢鼠标

默认在后台按元素操作，不移动鼠标、不切前台。以下命令或参数会占用用户的鼠标、键盘或前台窗口，没有用户同意不用：

- 全局参数 `--headed`；
- `focus-window`、`launch --activate`；
- `hover`、`drag`、`double-click`、`triple-click`、`mouse-*` 系列。

后台操作失败时，不自行改用 `--headed`，回到 SKILL.md 第 5 步问用户。

## 重试规则

动作结果里的 `disposition.retry` 为 `safe`（即 `delivery` 为 `not_delivered`）时才能重试。其他情况说明动作可能已经生效，重复执行可能点两次、发两次，先用 `get`、`is` 或重新快照读回实际状态，再决定下一步。

## macOS

- 需要给启动 agent-desktop 的 App（终端、Codex、Claude 等）开辅助功能权限；截图另外需要屏幕录制权限，读辅助功能树不需要；
- 权限没开时，请用户运行 `agent-desktop permissions --guide`，它会打开系统设置并提示要拖哪个 App 进列表；授权后不用重启；
- 访达等 App 对某些动作会返回成功但实际没生效，必须读回确认；
- 菜单栏操作用 `--surface menubar`。

## Windows

- 需要 Windows 10 1809 或更新版本，在已登录用户的桌面里运行；锁屏、UAC 弹窗和远程 SSH 会话里读不到界面；
- 没有授权弹窗。以管理员身份运行的窗口，普通权限的 agent-desktop 操作不了；
- 在 PowerShell 里，元素引用要加引号：`agent-desktop click '@s1abc:e12'`；
- 输入文字用 `set-value`；`type` 和 `right-click` 需要 `--headed`，会动真实键盘鼠标；
- 最小化的窗口操作不了，先运行 `agent-desktop restore --app <进程名>` 再读；不要顺手用 `focus-window`；
- Chrome、Electron 应用刚打开时界面树不完整，给 `snapshot` 加更长的 `--timeout-ms`；
- `alt+f4`、`win+d`、`alt+tab` 等系统快捷键默认被拒绝，不加 `--force`。

## Linux

- 需要 Ubuntu 24.04 或更新版本、已登录的图形会话和正在运行的 AT-SPI 辅助功能总线；
- 在目标 App 所在的桌面会话里运行；纯 SSH、TTY 登录或没有总线的容器里看不到任何 App；
- X11 和 Wayland 都能读界面和按元素操作，输入、截图和窗口控制两者有差别，遇到问题运行 `agent-desktop skills get linux` 查看。
