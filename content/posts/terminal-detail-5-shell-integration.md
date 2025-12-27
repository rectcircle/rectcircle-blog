---
title: "终端详解（五）Shell 集成"
date: 2025-12-27T16:25:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> 本文源码: [rectcircle/implement-terminal-from-scratch](https://github.com/rectcircle/implement-terminal-from-scratch)

## 介绍

终端（Terminal）本质上是一个简单的字符流处理程序，它只负责显示由 Shell（如 Bash、Zsh）发送过来的文本，并处理基本的 ANSI 转义序列（如设置颜色、移动光标）。然而，终端本身并不知道“语义”层面的信息，例如：

* 哪里是提示符（Prompt）的开始和结束？
* 用户输入的命令是什么？
* 刚刚执行的命令是成功还是失败了？
* 当前的工作目录（CWD）是什么？

Shell 集成（Shell Integration）正是为了解决这个问题。它通过让 Shell 在特定的时机（如打印提示符前、执行命令前、命令结束后）向终端发送特殊的、不可见的转义序列，来告知终端当前的上下文状态。

一旦终端“理解”了这些信息，就能提供许多高级功能：

* **命令装饰（Decorations）**：在每一行命令左侧显示原点，蓝色代表执行中，绿色代表成功，红色代表失败。
* **命令导航**：通过快捷键（如 `Cmd/Ctrl + Up/Down`）快速在历史命令输出之间跳转。
* **当前目录跟踪**：新建终端标签页时自动保持在当前目录。
* **智能选取与重运行**：能够精准地选取某次命令的输出内容，或快速重新运行该命令。
* **Sticky Scroll**：当命令输出很长时，可以将该命令的提示符行固定在顶部，方便查看。

## 原理 （以 VSCode 为例）

VSCode 的终端是最早广泛应用 Shell 集成的现代编辑器之一。它主要通过 **脚本注入** 和 **自定义转义序列** 来实现。

### 1. 脚本注入 (Script Injection)

当你在 VSCode 中打开一个终端时，VSCode 并不会直接启动你的 Shell（如 `/bin/zsh`），而是会通过 **参数劫持** 和 **环境构造** 的方式，让 Shell 在启动时优先加载 VSCode 生成的临时初始化脚本。

**加载机制与用户配置兼容：**

为了确保用户原本的配置（如 `~/.bashrc` 或 `~/.zshrc`）依然生效，VSCode 采用了一种“代理加载”的策略：

1.  **劫持启动入口**：
    *   **Bash**: VSCode 会使用 `--init-file` 参数启动 Bash（例如 `bash --init-file /tmp/vscode-bash-init`），强行指定初始化文件。
    *   **Zsh**: VSCode 会设置 `ZDOTDIR` 环境变量指向一个临时目录（例如 `/tmp/vscode-zsh/`），该目录下包含一个生成的 `.zshrc`。

2.  **代理脚本 (Chaining)**：
    这个被强行加载的临时脚本（Proxy Script）负有双重责任：
    *   **加载用户配置**：它会首先检查并 `source` 用户原本的配置文件（如 `~/.bashrc`, `~/.zprofile`, `~/.zshrc` 等），确保用户的别名、环境变量等完全保留。
    *   **注入集成逻辑**：在用户配置加载完成后，接着加载 VSCode 的 Shell Integration 脚本。

**Shell 钩子注入：**

一旦脚本运行起来，它会利用 Shell 提供的钩子机制（Hooks）来监听状态：
* **Bash**: 利用 `PROMPT_COMMAND` 环境变量（对应 `precmd`），并通过 `trap DEBUG` 机制来模拟 `preexec` 钩子（在 Bash 4.4+ 中也可能利用 `PS0` 环境变量）。
* **Zsh**: 利用 `precmd` (提示符前) 和 `preexec` (执行命令前) 钩子。
* **Fish**: 利用 `fish_prompt` 和 `fish_preexec` 事件监听。

### 2. 通信协议 (OSC 633)

VSCode 定义了一套私有的转义序列协议，以 `OSC 633` 开头（即 `\x1b]633; ... \x07` 或 `\x1b]633; ... \x1b\\`）。脚本会在不同阶段输出这些序列：

* **`OSC 633 ; A ST` (Prompt Start)**: 标记提示符的开始。脚本会在打印 `PS1` 之前输出它。
* **`OSC 633 ; B ST` (Command Start)**: 标记提示符结束，用户开始输入命令的位置。
* **`OSC 633 ; C ST` (Command Executed)**: 标记用户按下了回车，命令即将开始执行（也是命令输出的起始点）。
* **`OSC 633 ; D [; <ExitCode>] ST` (Command Finished)**: 标记命令执行结束，并附带退出码（Exit Code）。
* **`OSC 633 ; P ; Cwd=<Path> ST` (Property - Cwd)**: 告知终端当前的工作目录发生了变化。

### 3. 工作流程示例

![image](/image/vscode-shell-integration.svg)


## Shell 集成 Demo

本部分将在 [《终端详解（三）实现 WebShell》](/posts/terminal-detail-3-webshell/) 基础上，实现 Shell 集成。

### 功能介绍

相比 WebShell 只“透传字节流”，Shell 集成会让前端“看懂”一次命令执行的边界与元信息：

- 识别一条命令的生命周期：开始输入 → 开始执行 → 执行结束
- 在不影响终端显示的前提下，额外拿到结构化信息：`command`、`cwd`、`exitCode`、`output`
- UI 增强：在页面下方追加 Command History，按条展示每次命令的输出与退出码（成功/失败高亮）

核心思路：让 Bash 在关键时刻输出“不可见的标记”，即自定义 OSC 序列 `ESC ] 729 ; ... BEL`，前端从服务端回传的字节流中识别并剥离这些序列，同时把事件/属性聚合成一条“命令记录”。

---

### Client

#### 1）新增页面布局：终端 + 历史区

`project-demo/03-shell-integration/client/index.html` 新增了容器与历史列表：

```html
<div id="container">
  <div id="app"></div>
  <div id="history">
    <h3>Command History</h3>
    <ul id="command-list"></ul>
  </div>
</div>
```

配套样式在 `project-demo/03-shell-integration/client/src/style.css`：将页面分成上下两块（上终端、下历史），并为历史条目做了排版（命令、cwd、exit code、输出区域等）。

#### 2）新增 ShellIntegration：从字节流中“抽取命令记录”

在 `project-demo/03-shell-integration/client/src/main.js` 中引入并使用 `ShellIntegration`，从 WebSocket 收到的数据不再直接 `terminal.write(event.data)`，而是：

- 先交给 `shellIntegration.process()` 解析并“吞掉”自定义 OSC 序列
- 返回给终端显示的只剩“干净的”输出
- 当识别到“命令结束”事件时，回调里拿到结构化的命令记录并渲染到历史区

关键点（节选）：

```js
// project-demo/03-shell-integration/client/src/main.js
import { ShellIntegration } from './shell-integration.js'

const shellIntegration = new ShellIntegration((data) => {
  addHistoryItem(data);
});

wsConn.onmessage = (event) => {
  const cleanData = shellIntegration.process(event.data);
  terminal.write(cleanData);
};
```

历史条目渲染同样在 `project-demo/03-shell-integration/client/src/main.js` 中新增：每条记录会创建一个“只读的 xterm 实例”来展示该命令的输出（`disableStdin: true`），并根据 `exitCode` 显示红/绿状态。

#### 3）ShellIntegration 的协议与状态机

`project-demo/03-shell-integration/client/src/shell-integration.js` 是本 Demo 的核心新增文件。

- **协议**：匹配 `OSC 729`，形如 `\x1b]729;<content>\x07`
- **content 类型**（由服务端注入的 bash 脚本产生）：
  - `A`：Prompt Start
  - `B`：Command Start（用户开始输入命令）
  - `C`：Command Executed（即将开始执行）
  - `D;<exitCode>`：Command Finished
  - `P;Cwd=<pwd>`：属性上报（当前工作目录）

解析入口（节选）：

```js
// project-demo/03-shell-integration/client/src/shell-integration.js
const oscRegex = /\x1b]729;(.*?)\x07/g;

while ((match = oscRegex.exec(this.buffer)) !== null) {
  const textBefore = this.buffer.substring(lastIndex, match.index);
  this.handleText(textBefore);
  outputForTerminal += textBefore;

  const content = match[1];
  this.handleOsc(content);

  lastIndex = oscRegex.lastIndex;
}
```

- `process()` 做两件事：
  1) 从输入流中找出完整的 OSC 片段并解析事件  
  2) 把 OSC 片段从输出中移除，保证真正写入 xterm 的内容不包含这些标记

- `handleOsc()` 内部维护一个简单状态机（`PROMPT / INPUT / EXECUTION / UNKNOWN`），并在 `D`（命令结束）时触发 `finishCommand()`，把 `{command, output, exitCode, cwd}` 交给 UI。

#### 4）为什么要“用 xterm 解析命令文本”

用户输入并不等价于最终命令字符串：可能包含退格、左右移动、行编辑等控制序列。为此 `ShellIntegration` 里用了一个“看不见的 xterm”来还原最终命令文本：

```js
// project-demo/03-shell-integration/client/src/shell-integration.js
this.parserTerm = new Terminal({ rows: 1, cols: 1024, allowProposedApi: true });

this.parserTerm.reset();
this.parserTerm.write(raw, () => {
  const buffer = this.parserTerm.buffer.active;
  // 从 buffer 里取出最终渲染出的文本作为 command
});
```

这样即使用户在终端里编辑过命令，历史区展示的仍然是“执行时的真实命令”。

---

### Server

服务端仍然是“pty <-> websocket”桥接，但新增了一个关键能力：**启动 Bash 时注入初始化脚本，用来发出 Shell Integration 的 OSC 事件**。

#### 1）用 `--init-file` 注入 bash 脚本

`project-demo/03-shell-integration/server/main.go` 新增 `bashInitScript`，并在 `startShellByPty()` 中：

- 写入临时文件
- 用 `/bin/bash --init-file <tmp>` 启动 shell（替代原来的 `bash -il`）

```go
// project-demo/03-shell-integration/server/main.go
cmd := exec.Command("/bin/bash", "--init-file", tmpFile.Name())
return pty.Start(cmd)
```

#### 2）在 Prompt / 执行前 / 执行后打点

`bashInitScript` 里定义了自定义 OSC 通道：

- `__rectcircle_shell_integration_demo_osc_start="\033]729;"`
- `__rectcircle_shell_integration_demo_osc_end="\007"`

并在几个关键 hook 上输出事件：

- `PROMPT_COMMAND`：每次显示 prompt 前调用（这里用来发送 `D` + `P` + `A`）
- `trap '...' DEBUG`：每条命令执行前触发（这里发送 `C`）
- `PS1`：在 prompt 字符串中插入不可见序列（这里发送 `B`，标记“命令输入开始”）

关键片段（节选）：

```bash
# project-demo/03-shell-integration/server/main.go (bashInitScript)
__rectcircle_shell_integration_demo_precmd() {
  local ret=$?
  printf "${start}D;${ret}${end}"
  printf "${start}P;Cwd=${PWD}${end}"
  printf "${start}A${end}"
}
PROMPT_COMMAND="__rectcircle_shell_integration_demo_precmd"

trap '__rectcircle_shell_integration_demo_preexec' DEBUG

PS1="$PS1\[${start}B${end}\]"
```

最终效果：Bash 在“同一条字节流”里同时输出给人看的终端内容，以及给前端解析用的“隐形结构化事件”。

---

### 运行示例

- 启动 Server：

```bash
cd project-demo/03-shell-integration/server
go run .
```

- 启动 Client：

```bash
cd project-demo/03-shell-integration/client
npm i
npm run dev
```

- 打开页面后在上方终端执行几条命令，例如：

```bash
ls -al
false
echo "ok"
echo 'abc
123'
```

可以在下方 Command History 看到每条命令的：

- 命令文本（已还原行编辑后的最终内容）
- `cwd`
- `exitCode`（成功为 0 绿色，失败非 0 红色）
- 该命令对应的输出（以只读 xterm 呈现），可以看到颜色效果
- 多行命令也能正确的识别
