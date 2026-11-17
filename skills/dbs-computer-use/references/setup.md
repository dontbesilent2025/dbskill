# 安装与授权

SKILL.md 第 2 步需要推荐安装、或第 3 步需要给授权步骤时读取本文件。所有安装命令都会从官方地址下载并运行脚本：先把命令和它会做什么告诉用户，用户同意后再执行。系统授权弹窗由用户自己点。命令以各工具官方文档为准，执行前发现与官方文档不一致时，按官方文档并告诉用户。

## 推荐哪一个

| 情况 | 推荐 | 理由 |
| --- | --- | --- |
| 什么都没装 | Cua Driver | 据其他团队测试完成率更高；macOS、Windows、Linux 都能后台操作；一条命令能注册到这台电脑上的多个 Agent |
| 用户不想运行安装脚本，或只想先试试 | agent-desktop | 只需要 npm；任何能运行 shell 的 Agent 都能用 |
| 当前 Agent 不能接 MCP，但能运行 shell | agent-desktop | Cua 的完整能力需要 MCP；agent-desktop 是命令行，直接可用 |
| 网页任务需要用户已登录的浏览器，Cua 接管不了 | OpenCode Browse | 通过浏览器扩展使用用户自己的浏览器和登录状态，在后台标签页里操作 |

## Cua Driver

| 系统 | 安装 | 授权和启动 | 验证 |
| --- | --- | --- | --- |
| macOS（14 及以上） | `/bin/bash -c "$(curl -fsSL https://cua.ai/driver/install.sh)"` | 运行 `cua-driver permissions grant`，两个弹窗都点「Open System Settings」，在系统设置里打开 CuaDriver 的辅助功能和屏幕录制开关 | `cua-driver permissions status` |
| Windows 10／11 | PowerShell：`irm https://cua.ai/driver/install.ps1 \| iex`（不需要管理员） | `cua-driver autostart kick`；自启没注册成功时，在桌面里开一个终端运行 `cua-driver serve` 并保持开着 | `cua-driver doctor` |
| Linux（X11 或 XWayland，需要 AT-SPI 2） | `/bin/bash -c "$(curl -fsSL https://cua.ai/driver/install.sh)"`；精简版 Debian／Ubuntu 先运行 `sudo apt install libxi6 at-spi2-core` | 在桌面会话里运行 `cua-driver serve`；GNOME 另需运行 `~/.cua-driver/packages/current/wayland-helper/install.sh` 并注销重登一次 | `cua-driver doctor` |

接入 Agent：

- macOS、Linux 一次注册到这台电脑上的所有 Agent：`curl -fsSL https://cua.ai/install.sh | sh -s -- --select cua-driver`；
- 连接已安装的 Claude Code、Codex、Cursor：`cua-driver connect`，可以重复运行；
- 只给某一个 Agent 注册：运行 `cua-driver mcp-config --client claude`（或 `codex`、`openclaw`），它会打印注册命令，让用户确认后运行；
- Hermes：`hermes computer-use install`，再 `hermes tools enable computer_use --platform cli`；
- 注册后重启 Agent 或重新加载 MCP，工具才会出现在清单里。

## agent-desktop

| 系统 | 安装 | 授权 | 验证 |
| --- | --- | --- | --- |
| macOS（13 及以上） | `npm install -g agent-desktop` | 运行 `agent-desktop permissions --guide`，把启动它的 App（终端、Codex、Claude 等）加进辅助功能列表；截图另需屏幕录制 | `agent-desktop status` |
| Windows 10 1809 及以上 | `npm install -g agent-desktop` | 没有授权弹窗；以管理员身份运行的窗口操作不了 | `agent-desktop status` |
| Linux（Ubuntu 24.04 及以上） | `npm install -g agent-desktop` | 需要图形会话和 AT-SPI 总线 | `agent-desktop status` |

装好后不需要注册，Agent 直接通过 shell 调用；第一次使用前读 [agent-desktop.md](agent-desktop.md)。

## OpenCode Browse（可选，网页登录场景）

| 系统 | 安装 |
| --- | --- |
| macOS、Linux | `curl -fsSL https://opencode.ai/browse/install \| bash` |
| Windows | PowerShell：`irm https://opencode.ai/browse/install.ps1 \| iex` |

然后：

1. 运行 `browse install -a claude codex`（按用户实际用的 Agent 填写），把 MCP 写进对应 Agent 的配置；
2. 用户从浏览器扩展商店安装 Browse 扩展，在扩展设置里输入 `browse pair` 给出的配对码；
3. 重启 Agent，调用 Browse 的 `status` 确认已配对。

注意：浏览器顶部会一直显示「正在调试」提示条；Browse 的 `eval` 能以页面身份做任何事，非必要不用。
