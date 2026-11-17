# 其他 computer use 方案

Cua Driver、agent-desktop 和 Agent 自带的 computer use 都不适合当前情况时读取本文件。下列方案没有放进默认流程，各自写明原因和适用情况。推荐其中任何一个，同样按 SKILL.md 第 2 步先说明、经用户同意再装。

| 方案 | 系统 | 为什么不默认用 | 什么情况可以考虑 |
| --- | --- | --- | --- |
| Claude in Chrome | 浏览器 | 直接在已登录的浏览器里操作，很容易导致账号被封 | 不使用，用户点名要求也不用 |
| Windows-MCP | Windows | 点击会移动真实鼠标，切窗口会把窗口提到前台 | 用户愿意让出电脑、在旁边看 Agent 操作时 |
| Anode、BgDesk | Windows | 项目很新、用户少；需要一次管理员权限，不支持 Windows 家庭版 | 用户想让 Agent 在独立会话里操作，自己同时继续用鼠标键盘 |
| computer-use-linux | Linux | 只支持 Linux | Cua 在纯 Wayland 桌面上用不了时 |
| Peekaboo、macOS-MCP | macOS | 只支持 macOS，能力与 Cua 重复 | Cua 和 agent-desktop 都装不上时 |
| Claude Code 内置 computer-use | macOS | 靠截图操作，只支持 macOS，需要 Pro／Max 账号，默认关闭 | 用户不想装任何第三方工具，在 Claude Code 里运行 `/mcp` 开启 |
| Playwright MCP、agent-browser | 浏览器 | 启动全新浏览器，没有用户的登录状态 | 测试自己开发的网站，或不需要登录的网页操作 |
| computer-use-mcp | 三个系统 | 只靠截图和坐标，窗口一移动就容易点错 | 不推荐 |

各方案的能力以其官方仓库为准；本表依据 2026 年 11 月的公开资料整理，多数没有实测。
