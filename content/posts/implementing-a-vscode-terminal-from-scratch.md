---
title: "从零开始实现一个 “VSCode Terminal”"
date: 2025-07-13T01:44:36+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> 本文源码: [rectcircle/implement-terminal-from-scratch](https://github.com/rectcircle/implement-terminal-from-scratch)

## 终端相关技术

### 终端设备历史

详见： [探索终端的历史渊源](/posts//terminal-history/)

### 终端 API 简述

> [PTY escape code](https://en.wikipedia.org/wiki/PTY_escape_code)

在支持图形化交互界面的系统上，软件开发人员可以通过标准的图形 API 来绘制图形。这些标准 API 有： OpenGL、DirectX、Vulkan 等等。

那么类比一下，在命令行交互界面的系统上，软件开发人员通过怎么的 API 来“绘制”命令行呢？也有对应的标准 API 吗？

这就要回到校园里最初学习的 ASCII 码了，我们都知道 ASCII 定义了英文世界的常用的字母和符号。但是这些字母和符号只占用了 95 个，这些编码被称之为可显示字符（可打印字符/Printable character），软件开发人员天天可以接触到。

ASCII 码一共有 128 个，那其他的 33 个字符，因为已经进入了图形化交互页面，在大学和工作中很少直接结束。这 33 个编码对应的字符，被称为控制字符（Control code），而控制字符就是 “绘制” 命令行界面的关键。

换个角度来看，因此 ASCII（准确的说是，任何兼容/扩展 ASCII 的编码，即 PTY 编码） 编码自身就是命令行界面的编程语言，而 ASCII 的控制字符就是命令行界面的 API。而符合一定标准的 ASCII (PTY) 序列就是命令行界面的绘制程序。

这套渲染命令行界面的标准被称为 [PTY escape code](https://en.wikipedia.org/wiki/PTY_escape_code)，和其他计算机标准演进一样：

* 先有需求和落地产品： 市场上各大终端硬件厂商准寻着不同的各自的私有协议（[VT52](https://en.wikipedia.org/wiki/VT52)/[Hazeltine 1500](https://en.wikipedia.org/wiki/Hazeltine_1500)），软件开发者不得不分别兼容。
* 标准化机构（[PTY](https://en.wikipedia.org/wiki/American_National_Standards_Institute)）出手： 定义了 ECMA-48 标准， 1976 年通过，随后这个标准进行了多次更新，目前使用的是 1991 的第五版，这个标准也被其他标准化机构收录，因此 ECMA-48、 PTY X3.64、 ISO 6429 是一个东西。
* 业界事实标准： 因为 1978 年发布的 [VT100/VT102](https://en.wikipedia.org/wiki/VT100) 等系列大获成功，因为其实现了 ECMA-48 标准，因此有时这个标准也叫 VT100/VT102 。

从层次划分上，PTY 序列对于终端而言更像是 GPU/CPU 的底层机器码，终端对 PTY 序列的处理是流式的。因为命令行界面和 PTY 序列对人类是非常友好的，因此基本上不需要再进行高层次的抽象。

需要说明的是。在上个世纪，命令行交互界面时代，终端就是一种真实存在的物理设备。终端作为一个集合了输入和输出的物理设备，PTY escape code 既是控制终端输出的协议，也是计算机软件读取用户输入的协议。

在现代计算机的交互已经进化到了图形化交互界面，已经不再需要一个真实的物理终端设备存在。但是在计算机软件开发领域，仍然需要命令行交互界面。因此，在现代，我们能接触到的终端设备，指的都是一种对终端设备的仿真软件（模拟器），即： 遵守 PTY escape code 规范，将 PTY escape code 序列，通过图形化交互 API 进行渲染的仿真软件。我们平常用到了各种终端软件都可以归于此类。

这里，介绍一个 Web 领域，最流行的终端 A 序列渲染库 [xterm.js](https://xtermjs.org/)，该库被众多 WebShell 所使用，也是 VSCode 终端的底层渲染库。下文，会通过该库探索 PTY escape code 标准。

### 终端输出 API

本小结将通过 xterm.js 介绍，如何通过 PTY escape code 控制终端的输出。

示例如下：

```js
const terminalASNIEscapeSeqDemo = 
`这是正常的 ASNI 编码的字符串 (UTF8)，在终端中会被原样渲染\r\n` +
`在终端里面必须使用\\r(回车)\\n(换行)进行换行操作\r\n` + 
"终端可以对文字进行修饰，此时就需要使用 escape code，如：\x1B[1;3;31m粗体斜体红色前景色\x1B[0m\r\n" + 
"    首先 escape code 是 \\x1B (ESC) 字符告诉终端接下来是一个逃逸指令\r\n" +
"    然后 [ 表示这是一个控制序列 (CSI) 后面需要跟随着参数\r\n" +
"    1;3;31 表示 1 是粗体，3 斜体，31 是 31 号颜色红色前景色\r\n" +
"    m 表示参数结束，告诉终端可以进行渲染了\r\n" +
"    后面可以跟随着任意的 UTF8 编码的字符串，会被渲染为红色前景色\r\n" +
"    最后 \\x1B[0m 也是一个 CSI 指令，0 表示重置所有参数\r\n" + 
"    总结来说: \\x1B[数字;数字;...m 用来设置如何渲染接下来的文本\r\n" +
"除了 CSI 指令，还有很多其他指令，如：\r\n" +
"    \\x1bc 清屏指令，实现类似于 clear 的效果\r\n" +
"    发送特殊字符如 \\x1bD (回车) \\x1bE (换行) 等\r\n" +
"    光标操作：\r\n" +
"        \\x1B[1A 上移一行\r\n" +
"        \\x1B[1B 下移一行\r\n" +
"        \\x1B[1C 右移一列\r\n" +
"        \\x1B[1D 左移一列 *\x1B[1B\x1B[1C" +
"这段文字应该打印在 * 号的右下角\r\n"+
"更多的指令可以参考 https://en.wikipedia.org/wiki/PTY_escape_code\r\n" +
"";
```

将如上 PTY 序列，发送给 xtermjs 的 terminal 渲染效果如下（下方按字渲染，是因为按照字符发送给 terminal，每发送一个字符 sleep 2 毫秒，可以看出流式处理的特点，源码详见 [github](https://github.com/rectcircle/implement-terminal-from-scratch/blob/master/demo/01-xterm-js-ansi-escape/src/main.js#L38)）：

<script>
function loadStyles(url){
	var link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = url;
    document.head.appendChild(link);
}
loadStyles('https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.min.css')
</script>

<script src="
https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.min.js
"></script>

<div id="terminal"></div>

<script>
const terminalASNIEscapeSeqDemo =
`这是正常的 ASNI 编码的字符串 (UTF8)，在终端中会被原样渲染\r\n` +
`在终端里面必须使用\\r(回车)\\n(换行)进行换行操作\r\n` +
"终端可以对文字进行修饰，此时就需要使用 escape code，如：\x1B[1;3;31m粗体斜体红色前景色\x1B[0m\r\n" +
"    首先 escape code 是 \\x1B (ESC) 字符告诉终端接下来是一个逃逸指令\r\n" +
"    然后 [ 表示这是一个控制序列 (CSI) 后面需要跟随着参数\r\n" +
"    1;3;31 表示 1 是粗体，3 斜体，31 是 31 号颜色红色前景色\r\n" +
"    m 表示参数结束，告诉终端可以进行渲染了\r\n" +
"    后面可以跟随着任意的 UTF8 编码的字符串，会被渲染为红色前景色\r\n" +
"    最后 \\x1B[0m 也是一个 CSI 指令，0 表示重置所有参数\r\n" +
"    总结来说: \\x1B[数字;数字;...m 用来设置如何渲染接下来的文本\r\n" +
"除了 CSI 指令，还有很多其他指令，如：\r\n" +
"    \\x1bc 清屏指令，实现类似于 clear 的效果\r\n" +
"    发送特殊字符如 \\x1bD (回车) \\x1bE (换行) 等\r\n" +
"    光标操作：\r\n" +
"        \\x1B[1A 上移一行\r\n" +
"        \\x1B[1B 下移一行\r\n" +
"        \\x1B[1C 右移一列\r\n" +
"        \\x1B[1D 左移一列 *\x1B[1B\x1B[1C" +
"这段文字应该打印在 * 号的右下角\r\n"+
"更多的指令可以参考 https://en.wikipedia.org/wiki/PTY_escape_code\r\n" +
"";

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const terminal = new Terminal();
    terminal.open(document.querySelector('#terminal'));
    // 遍历 terminalASNIEscapeSeqDemo
    for (const char of terminalASNIEscapeSeqDemo) {
        terminal.write(char);
        await sleep(2);
    }
}

main();
</script>

从如上示例可以看出，实现一个终端模拟器还是相对比较简单，即：流式的读取 PTY 序列，如果是可打印字符，按照终端状态中的属性在光标的下一个位置，按照属性表渲染出这个字符，如果是 escape code 则根据 PTY escape code 标准，读取指令参数，根据指令标准，进行设置属性、移动光标等操作即可。

### 终端键盘输入 API

本小结将介绍，用户在终端中的键盘输入，终端设备如何处理，会生成怎样的 PTY escape 序列。示例代码如下：

`index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <!-- ... -->
  <body>
    <div id="app">
      <div id="terminal"></div>
      <div id="xterm_js_on_data_container">
        <pre id="xterm_js_on_data_pre"><code id="xterm_js_on_data_code"></code></pre>
      </div>
    </div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

`src/main.js`

```js
import './style.css'
import '../node_modules/@xterm/xterm/css/xterm.css'
import { Terminal } from '@xterm/xterm'

const terminalASNIEscapeSeqDemo = `随意按键盘观察 xterm.js onData 的输出: `;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const terminal = new Terminal();
  terminal.open(document.querySelector('#terminal'));
  const xtermJsOnDataCode = document.querySelector('#xterm_js_on_data_code');

  terminal.onData((data) => {
    xtermJsOnDataCode.textContent += JSON.stringify(data) + " " + data.charCodeAt(0) + "\n";
  });

  for (const char of terminalASNIEscapeSeqDemo) {
    terminal.write(char);
    await sleep(100);
  }

}

main();
```

（源码详见 [github](https://github.com/rectcircle/implement-terminal-from-scratch/tree/master/demo/02-xterm-js-on-data)）

在 xterm.js 中，用户在终端中的输入，通过 `terminal.onData` API 可以获取到，本例中，会将终端用 json 格式化一下（转义一下控制字符，方便观察），然后展示到终端下方页面中。

点击如下终端，获取输入焦点，按键盘任意键即可观察，终端输入 PTY escape code 协议情况。

<div id="terminal2"></div>
<div id="xterm_js_on_data_container">
<pre id="xterm_js_on_data_pre"><code id="xterm_js_on_data_code"></code></pre>
</div>

<script>
(function(){
    const terminalASNIEscapeSeqDemo = `随意按键盘观察 xterm.js onData 的输出: `;

    async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function main() {
    const terminal = new Terminal();
    terminal.open(document.querySelector('#terminal2'));
    const xtermJsOnDataCode = document.querySelector('#xterm_js_on_data_code');

    terminal.onData((data) => {
        xtermJsOnDataCode.textContent += JSON.stringify(data) + " " + data.charCodeAt(0) + "\n";
    });

    for (const char of terminalASNIEscapeSeqDemo) {
        terminal.write(char);
        await sleep(100);
    }

    }

    main();
})()
</script>

这里介绍一些常见的键盘字符对应的 PTY escape code（可以自行在上方验证）：

* 可打印字符: 保持原样（英文、中文等均是）。
* 常见的不可打印字符:
    * ESC 键： `"\u001b"` （escape code 自身，这是是 json 的 unicode 格式，即上文的 `\x1B`）
    * 退格键：`"\u007f"` （由于 js 问题这个转义字符打印不出来，但是从编码可以看出来是这个字符）
    * 方向键：
        * 上： `"\u001b[A"`
        * 下： `"\u001b[B"`
        * 右： `"\u001b[C"`
        * 左： `"\u001b[D"`
    * F 功能键，F1~F12，分别是: `"\u001bOP", "\u001bOQ", "\u001bOR", "\u001bOS", "\u001b[15~", "\u001b[17~", "\u001b[18~", "\u001b[19~", "\u001b[20~", "\u001b[21~", "\u001b[23~", "\u001b[24~"`。
    * 常见快捷键：
        * `ctrl+a` 行首 (bash)： `"\u0001"`
        * `ctrl+b` 上一个字符 (bash)： `"\u0002"`
        * `ctrl+c` 中断运行中程序 (bash)： `"\u0003"`
        * `ctrl+d` 退出交互式命令自身 (python, node， bash)： `"\u0004"`
        * `ctrl+e` 行尾 (bash)： `"\u0005"`
        * `...`

### PTY 详解

上文，已经介绍了 xterm.js （终端模拟器）的输入输出是一对 PTY 字符流。在 Unix 系统中，这对 PTY 字符流并没有直接和应用程序的 stdio 对接。在系统内核中，对终端模拟器设备进行了抽象，提供了一种称为 PTY 的设备类型（硬件终端对应 TTY 设备，和 PTY 类似，本文不多介绍）。

每个 PTY 设备会产生两个设备文件描述符，一个（主设备）和终端模拟器连接，一个（从设备）和应用程序的 stdio 连接（一般为 shell 程序），这两个文件描述符中间存在一个被称为行规程（line discipline）的内核程序做一些适配逻辑。

```
    应用程序 (Shell: Bash/Zsh 等)
      stdin  stdout/stderr
        ^       |
        |       |
      /dev/pts/xxx (从设备 slave，文件描述符)
        |       |
        |       v
    line discipline (行规程)
        ^       |
        |       |
      /dev/ptmx   (主设备 master，文件描述符)
        |       |
        |       v
    终端模拟器
```

行规程会做如下工作：

* line buffer: 对终端模拟器中的字符输入，进行输入缓冲，直到按 `\r` （回车符），应用程序才能读到。
* line edit: 根据终端模拟器输入的一些特殊字符对行缓冲中的字符序列进行编辑，如退格等。
* echo: 回显。在[终端键盘输入 API](#终端键盘输入-api)小节中，在终端中输入的内容，终端中并没有显示，而这依赖回显功能实现。即行规程从终端接收到一个可打印字符后，会立即原样发送回终端
* job control: 作业控制，将一些快捷键转换为信号发送给应用程序（如 ctrl+c 等）。

下面使用一个 Go 程序验证行规程的行为（源码详见 [github](https://github.com/rectcircle/implement-terminal-from-scratch/tree/master/demo/03-pty-demo)）。

首先，准备一个模拟的应用程序，该程序只做两件事：

* 接收 SIGINT (2) 信号，接收到后，打印日志并退出。
* 读取 stdin，并将 stdin 转换为字符串，然后用 JSON 格式化一下并打印。

`demo/03-pty-demo/02-echo-stdin-json-str/main.go`

```go
package main

import (
	"encoding/json"
	"io"
	"os"
	"os/signal"
)

func main() {
	// 处理 ctrl+c 信号
	ctrlCCh := make(chan os.Signal, 1)
	signal.Notify(ctrlCCh, os.Interrupt)
	go func() {
		<-ctrlCCh
		os.Stdout.Write([]byte("[echo-stdin-json-str][signal]: SIGINT (2)\n"))
		os.Exit(0)
	}()

	// 读并打印 stdin 内容
	buf := make([]byte, 4*1024*1024)
	for {
		n, err := os.Stdin.Read(buf)
		if err != nil {
			if err == io.EOF {
				break
			}
			panic(err)
		}

		input := string(buf[:n])
		inputJsonStr, err := json.Marshal(input)
		if err != nil {
			panic(err)
		}
		os.Stdout.Write([]byte("[echo-stdin-json-str][stdin]: "))
		os.Stdout.Write(inputJsonStr)
		os.Stdout.Write([]byte("\n"))
	}

}
```

然后，使用实现一个验证程序，该程序：

* 启动上面的模拟应用程序，并将这个应用程序连接到 pty slave。
* 从 pty master 读取内容，然后原样打印。
* 然后发送一些 PTY 序列，观察输出，观测 pty 行规程的应为。

`demo/03-pty-demo/01-pty-host/main.go`

```go
package main

import (
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/creack/pty"
)

const ASNIEInputSeqDemo = "hello world\r" + // 第一行: 常规的 ascii 字符，应用程序原样接受
	"中文\r" + // 第二行：中文字符，行为和第一行一样，应用程序原样接受
	"  对于可打印字符(中英文)\r" +
	"    1.在应用程序接受之前已经打印了，这是行规程的回显功能\r" +
	"    2.行规程原样透传到应用程序\r" +
	"    3.行规程将 \\r 转换为 \\n 传递给应用程序\r" +
	"    4.行规程有一个行 buffer 遇到 \\r 才会将 buffer 的内容传递给应用程序\r" +
	"测试行编辑(按退格的效果\\u007f): hello world,\u007f!\r" +
	"  可以看出，\\u007f 删除了前面的逗号, 应用程序接受到的是 hello world!\r" +
	"测试行编辑(按方向键效果): world\u001b[D\u001b[D\u001b[D\u001b[D\u001b[Dhello \r" +
	"  可以看出，方向键不会影响行规程的行编辑\r" +
	"* 即将发送 ctrl+c 信号，应用程序将收到 SIGINT(2) 信号\r" +
	"\u0003" // 最后一行：ctrl+c 信号

func main() {
	binPath, err := filepath.Abs("./echo-stdin-json-str")
	if err != nil {
		panic(err)
	}
	cmd := exec.Command(binPath)

	ptyMaster, err := pty.Start(cmd)
	if err != nil {
		panic(err)
	}
	defer ptyMaster.Close()
	go func() {
		_, _ = io.Copy(os.Stdout, ptyMaster)
	}()
	for _, b := range []byte(ASNIEInputSeqDemo) {
		_, err = ptyMaster.Write([]byte{b})
		if err != nil {
			panic(err)
		}
		time.Sleep(10 * time.Millisecond)
	}
}
```

运行测试：

```bash
cd demo/03-pty-demo
go build -o echo-stdin-json-str ./02-echo-stdin-json-str
go run ./01-pty-host
```

输出如下（Mac 环境输出，Linux 应该也类似）：

```
hello world
[echo-stdin-json-str][stdin]: "hello world\n"
中文
[echo-stdin-json-str][stdin]: "中文\n"
  对于可打印字符(中英文)
[echo-stdin-json-str][stdin]: "  对于可打印字符(中英文)\n"
    1.在应用程序接受之前已经打印了，这是行规程的回显功能
[echo-stdin-json-str][stdin]: "    1.在应用程序接受之前已经打印了，这是行规程的回显功能\n"
    2.行规程原样透传到应用程序
[echo-stdin-json-str][stdin]: "    2.行规程原样透传到应用程序\n"
    3.行规程将 \r 转换为 \n 传递给应用程序
[echo-stdin-json-str][stdin]: "    3.行规程将 \\r 转换为 \\n 传递给应用程序\n"
    4.行规程有一个行 buffer 遇到 \r 才会将 buffer 的内容传递给应用程序
[echo-stdin-json-str][stdin]: "    4.行规程有一个行 buffer 遇到 \\r 才会将 buffer 的内容传递给应用程序\n"
测试行编辑(按退格的效果\u007f): hello world!
[echo-stdin-json-str][stdin]: "测试行编辑(按退格的效果\\u007f): hello world!\n"
  可以看出，\u007f 删除了前面的逗号, 应用程序接受到的是 hello world!
[echo-stdin-json-str][stdin]: "  可以看出，\\u007f 删除了前面的逗号, 应用程序接受到的是 hello world!\n"
测试行编辑(按方向键效果): world^[[D^[[D^[[D^[[D^[[Dhello 
[echo-stdin-json-str][stdin]: "测试行编辑(按方向键效果): world\u001b[D\u001b[D\u001b[D\u001b[D\u001b[Dhello \n"
  可以看出，方向键不会影响行规程的行编辑
[echo-stdin-json-str][stdin]: "  可以看出，方向键不会影响行规程的行编辑\n"
* 即将发送 ctrl+c ，应用程序将收到 SIGINT(2) 信号
[echo-stdin-json-str][stdin]: "* 即将发送 ctrl+c ，应用程序将收到 SIGINT(2) 信号\n"
^C[echo-stdin-json-str][signal]: SIGINT (2)
```

上文使用了 Go 的 github.com/creack/pty 库实现了 pty 的创建。该库实现了对各种操作系统 pty 创建过程的封装，屏蔽了各个操作系统的差异和创建和使用过程。

为了更好的了解 pty 的创建和使用过程，下面将使用 C 语言重新实现一遍能在 Linux 环境运行的上述 `pty-host`。

`demo/03-pty-demo/03-pty-host-linux-c/main.c`

```c
// #define _GNU_SOURCE
#include <stdio.h>       // printf, perror, snprintf
#include <stdlib.h>      // exit
#include <string.h>      // strlen
#include <unistd.h>      // fork, close, read, write, dup2, execl, setsid
#include <fcntl.h>       // open, O_RDWR, O_NOCTTY
#include <sys/wait.h>    // waitpid
// #include <pty.h>         // openpty, unlockpt, ptsname_r (POSIX PTY API)
#include <signal.h>      // kill, SIGTERM
#include <time.h>        // nanosleep, timespec
#include <sys/ioctl.h>   // ioctl, TIOCSPTLCK, TIOCGPTN, TIOCSCTTY

// 定义输入序列，与Go版本保持一致
const char* PTY_INPUT_SEQ_DEMO = 
    "hello world\r"  // 第一行: 常规的 ascii 字符，应用程序原样接受
    "中文\r"        // 第二行：中文字符，行为和第一行一样，应用程序原样接受
    "  对于可打印字符(中英文)\r"
    "    1.在应用程序接受之前已经打印了，这是行规程的回显功能\r"
    "    2.行规程原样透传到应用程序\r"
    "    3.行规程将 \\r 转换为 \\n 传递给应用程序\r"
    "    4.行规程有一个行 buffer 遇到 \\r 才会将 buffer 的内容传递给应用程序\r"
    "测试行编辑(按退格的效果\x7f): hello world,\x7f!\r"
    "  可以看出，\\x7f 删除了前面的逗号, 应用程序接受到的是 hello world!\r"
    "测试行编辑(按方向键效果): world\x1b[D\x1b[D\x1b[D\x1b[D\x1b[Dhello \r"
    "  可以看出，方向键不会影响行规程的行编辑\r"
    "* 即将发送 ctrl+c 信号，应用程序将收到 SIGINT(2) 信号\r"
    "\x03";  // 最后一行：ctrl+c 信号

void sleep_ms(int ms) {
    struct timespec ts;
    ts.tv_sec = ms / 1000;
    ts.tv_nsec = (ms % 1000) * 1000000;
    nanosleep(&ts, NULL);
}

int main() {
    int master_fd, slave_fd;
    pid_t pid;
    char slave_name[256];
    
    // 如下是 POSIX PTY API 实现
    // if (openpty(&master_fd, &slave_fd, slave_name, NULL, NULL) == -1) {
    //     perror("openpty failed");
    //     exit(1);
    // }
    
    // 如下是 Linux 原生方式创建PTY
    // 打开 master 端
    master_fd = open("/dev/ptmx", O_RDWR | O_NOCTTY);
    if (master_fd == -1) {
        perror("open /dev/ptmx failed");
        exit(1);
    }
    
    // 解锁 slave 端
    // if (unlockpt(master_fd) == -1) {
    //     perror("unlockpt failed");
    //     close(master_fd);
    //     exit(1);
    // }
    
    // 使用 ioctl 解锁 slave 端
    int unlock = 0;
    if (ioctl(master_fd, TIOCSPTLCK, &unlock) == -1) {
        perror("ioctl TIOCSPTLCK failed");
        close(master_fd);
        exit(1);
    }

    // 获取 slave 端名称
    // if (ptsname_r(master_fd, slave_name, sizeof(slave_name)) != 0) {
    //     perror("ptsname_r failed");
    //     close(master_fd);
    //     exit(1);
    // }

    // 使用ioctl获取PTY编号并构造slave名称
    unsigned int pty_num;
    if (ioctl(master_fd, TIOCGPTN, &pty_num) == -1) {
        perror("ioctl TIOCGPTN failed");
        close(master_fd);
        exit(1);
    }
    snprintf(slave_name, sizeof(slave_name), "/dev/pts/%u", pty_num);

    printf("pty slave path is: %s\n", slave_name);

    // 4. 打开slave端
    slave_fd = open(slave_name, O_RDWR | O_NOCTTY);
    if (slave_fd == -1) {
        perror("open slave failed");
        close(master_fd);
        exit(1);
    }
    
    printf("PTY slave file path: %s\n", slave_name);
    
    // Fork子进程
    pid = fork();
    if (pid == -1) {
        perror("fork failed");
        exit(1);
    }
    
    if (pid == 0) {
        // 子进程：设置为slave端并执行echo-stdin-json-str
        close(master_fd);
        
        // 创建新会话
        if (setsid() == -1) {
            perror("setsid failed");
            exit(1);
        }
        
        // 使用ioctl设置slave_fd为控制终端
        if (ioctl(slave_fd, TIOCSCTTY, 0) == -1) {
            perror("ioctl TIOCSCTTY failed");
            exit(1);
        }

        // 重定向标准输入输出到slave
        if (dup2(slave_fd, STDIN_FILENO) == -1 ||
            dup2(slave_fd, STDOUT_FILENO) == -1 ||
            dup2(slave_fd, STDERR_FILENO) == -1) {
            perror("dup2 failed");
            exit(1);
        }
        
        close(slave_fd);
        
        // 执行echo-stdin-json-str程序
        execl("./echo-stdin-json-str", NULL);
        perror("execl failed");
        exit(1);
    } else {
        // 父进程：作为 master 端
        close(slave_fd);
        
        // 创建子进程来读取 PTY 输出并打印到 stdout
        pid_t reader_pid = fork();
        if (reader_pid == 0) {
            // 读取子进程
            char buffer[1024];
            ssize_t bytes_read;
            
            while ((bytes_read = read(master_fd, buffer, sizeof(buffer))) > 0) {
                write(STDOUT_FILENO, buffer, bytes_read);
            }
            exit(0);
        }
        
        // 发送输入序列
        const char* input = PTY_INPUT_SEQ_DEMO;
        size_t len = strlen(input);
        
        for (size_t i = 0; i < len; i++) {
            if (write(master_fd, &input[i], 1) == -1) {
                perror("write to master failed");
                break;
            }
            sleep_ms(10);  // 10毫秒延迟，与Go版本一致
        }
        
        // 等待子进程结束
        int status;
        waitpid(pid, &status, 0);
        
        // 终止读取进程
        kill(reader_pid, SIGTERM);
        waitpid(reader_pid, NULL, 0);
        
        close(master_fd);
    }
    
    return 0;
}
```

在 C 语言中版本示例中，展示了创建 PTY 的更多细节：

* pty-host 进程：
    * 使用 open 系统调用，打开 `/dev/ptmx` 文件，获取到 pty master 的文件描述符。即，创建了一个 pty master，同步 pty slave 文件也在 `/dev/pts/xxx` 创建好了。
    * 使用 ioctl 通过 TIOCSPTLCK 操作 pty master 文件描述符吗，对其关联的 pty slave 进行解锁（关于 pty 锁定机制，详见下文）。
    * 使用 ioctl 通过 TIOCGPTN 获取 pty slave 的编号，即可获取到 pty slave 文件的路径。
    * 通过 open 系统调用，打开 `/dev/pts/xxx` 文件，获取到 pty slave 的文件描述符。
    * fork 子进程 echo-stdin-json-str（见下文 echo-stdin-json-str 子进程）。
    * 再 fork 一个子进程，读取 pty master，并打印到 stdout 中，观察效果（和 go 逻辑相同）。
    * 将测试的 PTY_INPUT_SEQ_DEMO 写入 pty master（和 go 逻辑相同）。
* echo-stdin-json-str 子进程：
    * 关闭无需使用的 pty master 文件描述符 。
    * 通过 setsid 创建一个新会话（同步创建一个进程组）。
    * 通过 ioctl 将这个 pty (pty slave) 设置为这个会话的控制终端，同时这个进程将拥有这个控制终端。设置为控制终端后，这个终端接收到例如 `ctrl+c` 的 PTY escape 序列后，pty 行规程才会将对应的信号发送给当前进程（准确的说是拥有控制终端的进程组）（关于控制终端相关，详见下文[高阶话题：终端和 Shell](#高阶话题终端和-shell)）。
    * 设置当前进程的 stdin、stdout、stdout 为这个 pty slave。
    * 加载执行 echo-stdin-json-str 程序。

关于 PTY 锁定机制（来源 Trae AI）：

> PTY 的锁定机制是一个历史遗留的安全特性，主要有以下几个方面的意义：
>
> 1. 权限和所有权设置的安全窗口保护 [1](https://unix.stackexchange.com/questions/477247/is-pseudo-terminals-unlockpt-tiocsptlck-a-security-feature)：
>    * 在早期系统中，从设备（slave device）的权限和所有权设置需要一定时间
>    * 锁定机制确保在权限和所有权正确设置之前，其他进程无法访问从设备
>
> 2. 权限控制 [2](https://man7.org/linux/man-pages/man3/grantpt.3.html)：
>    * 从设备的用户 ID 被设置为调用进程的真实 UID
>    * 从设备的组 ID 被设置为特定值（例如 tty）
>    * 从设备的访问模式被设置为 0620（crw--w----）
>
> 3. 初始化保护 [3](https://man7.org/linux/man-pages/man3/unlockpt.3.html)：
>    * `unlockpt()` 必须在打开从设备之前调用
>    * 这确保了从设备在完成所有必要的初始化和权限设置之前不会被访问
>
> 在现代 Linux 系统中，特别是使用 devpts 文件系统的系统上，这个锁定机制实际上已经变得不那么重要了。因为 devpts 文件系统可以在创建设备时就确保正确的权限和所有权，不存在权限设置的时间窗口问题。但是为了兼容性，这个机制仍然被保留下来。

### 完整实例：使用 xterm.js 和 Go 实现一个 WebShell

> 源码详见 [github](https://github.com/rectcircle/implement-terminal-from-scratch/tree/master/demo/02-webshell-demo)

接下来，简单实现一个 WebShell 服务：

* 客户端使用 web 技术和 xterm.js 库。
* 服务端使用 Go 通过 websocket 提供服务。

### 高阶话题：终端和 Shell

在Linux中，作业（Job）、进程组（Process Group）和会话（Session）是用于管理和控制进程的关键概念。作业是指由用户在shell中启动的一组相关的进程，这些进程可以被当作一个整体来管理。进程组是将多个进程关联起来，以便进行批量操作，如发送信号。会话则是一系列进程组的集合，通常与一个登录会话相关联。
1. 作业(Job):
作业是用户在shell中启动的一组进程，通常是用户通过管道、重定向等方式将多个命令组合在一起形成的。
作业可以被暂停、恢复、终止。
在shell中，可以使用 jobs 命令查看当前会话中的作业，使用 fg 命令将后台作业调回前台，使用 bg 命令将停止的作业在后台继续运行。
例如，command1 | command2 & 启动了一个后台作业，其中 command1 和 command2 是相关的进程。
作业与进程组的区别在于，如果作业中的某个进程创建了子进程，子进程不一定属于同一个作业。
2. 进程组(Process Group):
进程组是进程的集合，通常与作业相关联，可以接收来自同一终端的信号。
每个进程组有一个唯一的进程组ID（PGID），通常等于组长进程的进程ID。
每个进程组可以有一个组长进程，当组长进程终止时，该进程组仍然存在，除非进程组中的最后一个进程也终止。
进程组主要用于进程管理和信号分发。
例如，setpgid(pid, pgid) 可以将进程 pid 加入到进程组 pgid 中。
3. 会话(Session):
会话是一系列进程组的集合，通常与一个登录会话相关联。
每个会话有一个会话首进程（session leader），即创建会话的进程。
会话可以有一个控制终端，用户通过该终端与系统交互。
会话中的进程组可以分为前台进程组和后台进程组。
当用户断开终端连接时，会话会收到SIGHUP 信号。
例如，setsid() 可以创建一个新的会话。
总结:
作业是用户层面的进程管理，通过shell命令进行控制。
进程组是更底层的概念，用于将多个进程组织在一起，便于信号传递和管理。
会话是最高层面的概念，用于将进程组组织在一起，通常与一个登录会话对应。
理解这些概念有助于更好地理解和控制Linux系统中的进程和作业。

### 高阶话题：Vim UI 原理（备用设备、鼠标 API等）

TODO 终端窗口尺寸。

* `\x1b[?1049h\x1b[0m\x1b[2J\x1b[?1003h\x1b[?1015h\x1b[?1006h\x1b[?25l`

    * `\x1b[?1049h` ：启用备用屏幕缓冲区
    * `\x1b[0m` ：重置所有文本属性
    * `\x1b[2J` ：清除整个屏幕
    * `\x1b[?1003h` 、 `\x1b[?1015h` 、 `\x1b[?1006h` ：启用不同的鼠标报告模式
    * `\x1b[?25l` ：隐藏光标

1.光标控制：

* `\x1b[?25l` - 隐藏光标
* `\x1b[?25h` - 显示光标

2.屏幕清除：

* `\x1b[2J` - 清除整个屏幕
* `\x1b[H` - 将光标移动到左上角(1,1)位置

3.终端模式设置：

* `\x1b[?1049h` - 进入备用屏幕缓冲区
* `\x1b[?1049l` - 退出备用屏幕缓冲区

4.键盘输入模式：

* `\x1b[?1h` - 设置应用光标键模式
* `\x1b[?1l` - 重置光标键模式

---

Vim 在初始化终端界面时，会发送一系列 PTY escape codes（PTY 转义序列）来控制终端的行为，以便创建自己的文本用户界面（TUI）。这个过程通常包括清屏、隐藏光标、切换到备用屏幕缓冲区等操作。

以下是 `vim` 启动时发送给终端的一些典型的 PTY escape codes：

1. **进入备用屏幕缓冲区 (Enter Alternate Screen Buffer)**
    * Code: `\x1b[?1049h`
    * **作用**: 这个指令会保存当前的 shell 屏幕内容，并提供一个新的、空白的屏幕供 `vim` 使用。当你退出 `vim` 时，它会恢复之前的 shell 屏幕，看起来就像 `vim` 从未打开过一样。这是实现全屏应用（如 `vim`, `less`, `htop`）的关键。

2. **隐藏光标 (Hide Cursor)**
    * Code: `\x1b[?25l` (最后一个字符是小写的 'L')
    * **作用**: 在 `vim` 绘制其界面时，为了防止光标在屏幕上闪烁或乱跳，会先将光标隐藏。

3. **清空整个屏幕 (Clear Screen)**
    * Code: `\x1b[2J`
    * **作用**: 清除备用屏幕上的所有内容，为绘制 `vim` 的界面做准备。

4. **移动光标到左上角 (Move Cursor to Home Position)**
    * Code: `\x1b[H` 或 `\x1b[1;1H`
    * **作用**: 将光标定位在屏幕的左上角（第 1 行，第 1 列），这是绘制界面的起点。

5. **设置文本属性 (Set Text Attributes)**
    * Code: `\x1b[0m`
    * **作用**: 重置所有文本属性（如颜色、粗体、下划线等），确保 `vim` 在一个干净的样式环境中开始绘制。之后，`vim` 会根据你的配色方案（colorscheme）发送其他代码来设置前景和背景颜色。

在执行完这些初始设置后，`vim` 会开始发送大量的文本和夹杂在其中的其他转义序列来绘制界面，包括状态栏、命令行、文件内容区域（用 `~` 表示空行）等。

当所有内容绘制完毕，`vim` 会将光标移动到文件中的初始位置，并重新显示光标：

* **显示光标 (Show Cursor)**: `\x1b[?25h`

因此，`vim` 启动时发送给终端的原始字节流（简化后）可能看起来像这样：
`"\x1b[?1049h\x1b[?25l\x1b[2J\x1b[H\x1b[0m... (大量用于绘制UI的文本和代码) ...\x1b[?25h"`

当你退出 `vim` 时，它会发送相反的指令来恢复终端：
1. **清屏**: `\x1b[2J`
2. **显示光标**: `\x1b[?25h`
3. **退出备用屏幕缓冲区**: `\x1b[?1049l`

这个精确的控制序列使得 `vim` 能够在终端内提供一个独立的、功能丰富的编辑环境。

---

好的，您说得对。我之前的解释主要集中在屏幕和光标的初始化上。鼠标支持是 `vim` 利用的另一个层面的终端控制技术。

`vim` 支持鼠标并不是通过原生的图形界面（GUI）机制，而是通过指示终端（Terminal）本身将鼠标事件作为字符流来报告，就像报告键盘按键一样。这个过程同样是通过 PTY escape codes（PTY 转义序列）实现的。

工作原理如下：

1. **启用鼠标报告 (Enabling Mouse Reporting)**
    当您在 `vim` 中启用鼠标支持时（例如，在 `.vimrc` 中设置 `set mouse=a`），`vim` 会向终端发送一个特定的转义码。最常见的是用于“X10 兼容模式”或更现代的“SGR 模式”的转义码。

    * **启用普通鼠标报告**: `\x1b[?1000h`
        这会告诉终端报告鼠标的点击和释放事件。
    * **启用按钮移动鼠标报告**: `\x1b[?1002h`
        这会告诉终端在按住按钮并移动鼠标时（即拖动）也报告事件。
    * **启用 SGR 扩展鼠标模式**: `\x1b[?1006h`
        这是一种更新、更健壮的模式，它使用不同的格式来报告事件，避免了某些歧义，并支持超过 223 的坐标。大多数现代终端都支持此模式。

2. **终端将鼠标事件作为文本报告**
    一旦启用了鼠标报告，如果您在终端窗口中点击、滚动或拖动，终端模拟器不会执行其默认操作（如选择文本）。相反，它会将鼠标事件转换成一个字符序列，并将其发送到 `vim` 的标准输入，就好像您在键盘上输入了这些字符一样。

    例如，在启用 SGR 模式 (`1006`) 的情况下，在第 20 列、第 10 行进行一次左键单击，终端会向 `vim` 发送如下序列：
    `\x1b[<0;20;10M`

    * `\x1b[<`: SGR 鼠标报告的开始。
    * `0`: 按钮代码（0 代表左键按下，1 代表中键，2 代表右键；其他数字用于滚轮等）。
    * `20`: 列坐标。
    * `10`: 行坐标。
    * `M`: 表示按钮按下（小写的 `m` 表示按钮释放）。

3. **Vim 解析转义码**
    `vim` 会持续从其输入流中读取数据。当它看到这个特殊的序列时，它不会将其作为文本显示在屏幕上，而是会解析这个序列并理解其含义：“用户在第 10 行，第 20 列单击了左键。”

4. **Vim 执行相应操作**
    根据解析出的事件，`vim` 会执行相应的操作，例如：
    * 将光标移动到该位置。
    * 如果您拖动鼠标，则开始一个可视化选择。
    * 如果您中键单击，则粘贴文本。
    * 如果您使用滚轮，则向上或向下滚动视图。

5. **禁用鼠标报告**
    当您退出 `vim` 时，它会向终端发送相应的“禁用”代码，例如 `\x1b[?1000l`、`\x1b[?1002l` 或 `\x1b[?1006l`（注意最后的字符是 `l` 而不是 `h`）。这将使终端恢复其正常行为，即鼠标用于在终端缓冲区中选择文本，而不是向正在运行的应用程序发送事件。

总结来说，`vim` 通过告诉终端将鼠标操作转换为特殊的文本序列来“劫持”鼠标，然后 `vim` 拦截并解释这些序列，从而在其基于文本的界面中提供鼠标驱动的功能。

---

当 `vim` 退出时，它会发送一系列 PTY escape codes 来将终端恢复到其原始状态。这个过程基本上是启动时所做操作的逆向操作。

以下是 `vim` 退出时发送的一些关键 PTY escape codes：

1. **禁用鼠标报告 (Disable Mouse Reporting)**
    * Codes: `\x1b[?1000l`, `\x1b[?1002l`, `\x1b[?1006l` (注意最后的字符是小写的 'L')
    * **作用**: 如果在 `vim` 会话中启用了鼠标（例如 `set mouse=a`），`vim` 会发送这些指令来禁用它。这使得终端的鼠标功能恢复正常，例如，可以用鼠标选择和复制终端中的文本，而不是将点击事件发送给应用程序。

2. **显示光标 (Show Cursor)**
    * Code: `\x1b[?25h`
    * **作用**: 这个指令会使光标重新变得可见。`vim` 在启动时通常会用 `\x1b[?25l` 将其隐藏，以防止在绘制界面时出现闪烁。

3. **退出备用屏幕缓冲区 (Exit Alternate Screen Buffer)**
    * Code: `\x1b[?1049l`
    * **作用**: 这是最关键的一步。`vim` 在启动时使用 `\x1b[?1049h` 切换到了一个“备用屏幕”，以便拥有一个独立的全屏界面。退出时，发送这个 `l` 结尾的指令会**恢复之前的主屏幕缓冲区**。这意味着你之前在 shell 中的所有内容会重新出现，终端光标也会恢复到 `vim` 启动前的位置，就好像 `vim` 从未打开过一样。

4. **重置文本属性 (Reset Text Attributes / SGR)**
    * Code: `\x1b[0m`
    * **作用**: 清除所有特殊的文本格式（如颜色、粗体、下划线等），将终端的文本样式恢复到默认值。

因此，`vim` 退出时发送给终端的字节流（简化后）看起来像这样：
`"\x1b[?1006l\x1b[?25h\x1b[?1049l\x1b[0m"`

这个恢复过程确保了 `vim` 在关闭后不会留下任何“后遗症”，让用户可以无缝地回到他们的命令行工作中。

## VSCode 终端 和 Shell 集成分析

### 完整实例：在 WebShell 中记录命令执行情况的结构化数据

## VSCode 终端相关扩展 API

> 以示例讲解，写一个插件探测 VSCode 终端 Shell 集成情况。

### 完整实例：在 WebShell 提供可扩展的 API
