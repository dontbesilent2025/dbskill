# Cua Driver 调用要点

SKILL.md 第 1 步选中 Cua Driver 时读取本文件。内容以 Cua Driver 工具自带的说明为准；工具说明与本文件不一致时，以工具说明为准，并在报告里写明。

## 通用约定

- 每个支持 `session` 参数的调用都带同一个简短标签，例如 `session: "cu"`；
- 调用报「session has ended」时，换一个新标签（例如 `cu2`）继续，不反复用已结束的标签；
- 工具只列了名字、尚未加载时，先用宿主的工具加载机制一次性加载要用的几个：`check_permissions`、`list_windows`、`get_window_state`、`run_steps`、`get_browser_state`、`browser_prepare`、`browser_navigate`、`browser_click`、`browser_type`；
- 看不懂某个工具的用法时，调用 `get_guide`（主题：`overview`、`browser`、`permissions`、`batching`、`menus`、`drag`）。

## 权限检查

`check_permissions({prompt: false})`：只读，返回 `accessibility` 和 `screen_recording`。macOS 上任一为 `false` 就停下，请用户运行 `cua-driver permissions grant`，或去「系统设置 → 隐私与安全性」打开。不传 `prompt: true`，不替用户点批准。

Windows 和 Linux 没有这两项系统授权；连不上时请用户在桌面会话里运行 `cua-driver serve` 并保持窗口开着（Windows 也可以运行 `cua-driver autostart kick`），再用 `cua-driver doctor` 检查。Windows 上的 Cua 仍是预览版，部分 App 只接受前台输入。

## 网页（Chrome、Edge、Brave）

1. `list_windows({app: "Chrome"})`，取 `pid` 和 `window_id`；
2. `get_browser_state({pid, window_id})` 绑定窗口；
3. 如果返回拒绝，错误码为 `browser_consent_required` 或 `browser_requires_setup`：按返回里 `detail.next_call` 调用一次 `browser_prepare`，参数为 `pid`、`window_id`、`session` 和 `strategy: {"kind": "existing_profile"}`；
   - 返回 `authorization_required: true`（报错里提到 `--grant existing-profile`）：这是 Cua 守护进程默认没开「接管已有浏览器配置」的授权，用户点确认、改用前台方式都解决不了。不再重试，直接改走下面的「辅助功能树路线」；报告里告诉用户：想用完整的浏览器工具，需要在 Cua 启动参数里加 `--grant existing-profile`；
   - 返回 `background_unavailable`：接管会把浏览器带到前台（macOS 上 Chrome 会在前台弹出远程调试确认）。先问用户，同意后用 `delivery_mode: "foreground"` 重试一次，前台会自动切回原来的应用；不同意就走辅助功能树路线；
   - 其他拒绝：照抄原因，改走辅助功能树路线，不绕过；
4. 接管成功后，再次 `get_browser_state` 拿到 `target_id` 和 `tab_id`，用 `browser_navigate` 打开网址；
5. 读页面：`get_browser_state({target_id, tab_id, snapshot_format: "semantic_v2"})`，需要时加 `query` 缩小范围；
6. 操作：`browser_click`、`browser_type`；悬停、拖动用 `browser_pointer`。网页上不使用桌面的鼠标工具，它们会移动用户的鼠标；
7. 跳转后旧的元素引用会失效，重新读一次再操作。

### 辅助功能树路线（接管失败时）

Chrome、Edge、Brave 的网页内容在辅助功能树里完整可读，按元素点击也能生效，全程在后台进行，不动鼠标：

1. 浏览器没开时，用 `launch_app({bundle_id, urls: ["目标网址"]})` 在后台启动并打开网址；已开着时，按需在地址栏操作；
2. `get_window_state({pid, window_id})` 读页面；内容多时用 `query`（例如 `"AXStaticText"`）和 `max_depth` 缩小范围，避免读进整个菜单栏；
3. 用 `run_steps` 按元素点击，可以按角色和名称指定目标（例如 `role: "AXRadioButton"`、`name: "商家名"`，同名用 `nth`），并加 `expect` 等页面上出现预期文字；
4. 点击后读回地址栏或页面文字，确认已经切换。页面刚加载时元素可能是 `enabled=false`，稍等再读；
5. 浏览器窗口被最小化或隐藏时，网页元素的 `actions=[press]` 会消失，按元素点击报成功但页面没变化，后台像素点击会被拒绝并报 `minimized_or_hidden_window`。遇到任一情况不要反复重试：请用户把窗口放回屏幕上（不必放到最前面），或问一次能否切到前台；用户同意切前台后，可以在 `run_steps` 上加 `foreground_fallback: true`。

## 其他浏览器（Dia、Safari、Arc 等）

`get_browser_state` 会拒绝，报「不是可识别的浏览器进程」。此时：

- 用 `get_window_state` 读辅助功能树和截图，只汇报当前页面上已显示的内容；
- 网页里的按钮和列表，按元素点击或后台像素点击常常没有反应，要读回确认，不能默认已生效；
- 需要操作时，回到 SKILL.md 第 4 步，让用户选「改用 Chrome」或「切到前台」。

## 桌面 App

1. `list_windows({app: "应用名"})` 拿到 `pid` 和 `window_id`。中文系统里的应用名可能是中文，例如「访达」；
2. `get_window_state({pid, window_id, query: "关键词"})`，先窄读；不需要看图时加 `include_screenshot: false`；
3. 用 `run_steps` 执行动作，按元素操作时用 `element_token`（格式为 `快照编号:行号`），末尾带 `observe: {}` 读回变化；
4. 再读时用 `since: "latest"`，只看变化部分；
5. 关键节点用 `verify_state` 确认。结果为 `unknown` 或 `effect: "unverifiable"` 时不算成功。

## 逐级升级

1. 按元素操作（`element_token`），在后台进行，不动鼠标；
2. 后台像素点击（`x`、`y`，坐标来自最近一次截图）；
3. `delivery_mode: "foreground"`：会短暂切到前台，用完切回。先问用户一次。

三级都失败时停下，报告失败的元素和返回信息。
