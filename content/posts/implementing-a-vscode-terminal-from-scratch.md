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

### 终端渲染 API 简述

> [ANSI escape code](https://en.wikipedia.org/wiki/ANSI_escape_code)

在支持图形化交互界面的系统上，软件开发人员可以通过标准的图形 API 来绘制图形。这些标准 API 有： OpenGL、DirectX、Vulkan 等等。

那么类比一下，在命令行交互界面的系统上，软件开发人员通过怎么的 API 来“绘制”命令行呢？也有对应的标准 API 吗？

这就要回到校园里最初学习的 ASCII 码了，我们都知道 ASCII 定义了英文世界的常用的字母和符号。但是这些字母和符号只占用了 95 个，这些编码被称之为可显示字符（可打印字符/Printable character），软件开发人员天天可以接触到。

ASCII 码一共有 128 个，那其他的 33 个字符，因为已经进入了图形化交互页面，在大学和工作中很少直接结束。这 33 个编码对应的字符，被称为控制字符（Control code），而控制字符就是 “绘制” 命令行界面的关键。

换个角度来看，因此 ASCII（准确的说是，任何兼容/扩展 ASCII 的编码，即 ANSI 编码） 编码自身就是命令行界面的编程语言，而 ASCII 的控制字符就是命令行界面的 API。而符合一定标准的 ASCII (ANSI) 序列就是命令行界面的绘制程序。

这套渲染命令行界面的标准被称为 [ANSI escape code](https://en.wikipedia.org/wiki/ANSI_escape_code)，和其他计算机标准演进一样：

* 先有需求和落地产品： 市场上各大终端硬件厂商准寻着不同的各自的私有协议（[VT52](https://en.wikipedia.org/wiki/VT52)/[Hazeltine 1500](https://en.wikipedia.org/wiki/Hazeltine_1500)），软件开发者不得不分别兼容。
* 标准化机构（[ANSI](https://en.wikipedia.org/wiki/American_National_Standards_Institute)）出手： 定义了 ECMA-48 标准， 1976 年通过，随后这个标准进行了多次更新，目前使用的是 1991 的第五版，这个标准也被其他标准化机构收录，因此 ECMA-48、 ANSI X3.64、 ISO 6429 是一个东西。
* 业界事实标准： 因为 1978 年发布的 [VT100/VT102](https://en.wikipedia.org/wiki/VT100) 等系列大获成功，因为其实现了 ECMA-48 标准，因此有时这个标准也叫 VT100/VT102 。

从层次划分上，ANSI 序列对于终端而言更像是 GPU/CPU 的底层机器码，终端对 ANSI 序列的处理是流式的。因为命令行界面和 ANSI 序列对人类是非常友好的，因此基本上不需要再进行高层次的抽象。

### 通过 xterm.js 探索 ANSI escape 序列

在上个世纪，命令行交互界面时代，终端就是一种真实存在的物理设备。但是现代计算机的交互已经进化到了图形化交互界面，已经不再需要一个真实的物理终端设备存在。但是在计算机软件开发领域，仍然需要命令行交互界面。因此，在现代，我们能接触到的终端设备，指的都是一种对终端设备的仿真软件（模拟器），即： 遵守 ANSI escape code 规范，将 ANSI escape code 序列，通过图形化交互 API 进行渲染的仿真软件。我们平常用到了各种终端软件都可以归于此类。

这里，介绍一个 Web 领域，最流行的终端 A 序列渲染库 [xterm.js](https://xtermjs.org/)，该库被众多 WebShell 所使用，也是 VSCode 终端的底层渲染库。本小结，会通过该库探索 ANSI escape code 标准。

<!-- <link href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.min.css" rel="stylesheet"> -->

示例：

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
"更多的指令可以参考 https://en.wikipedia.org/wiki/ANSI_escape_code\r\n" +
"";
```

将如上 ANSI 序列，发送给 xtermjs 的 terminal 渲染效果如下（下方按字渲染，是因为按照字符发送给 terminal，每发送一个字符 sleep 2 毫秒，可以看出流式处理的特点，源码详见 [github](https://github.com/rectcircle/implement-terminal-from-scratch/blob/master/demo/01-xterm-js-ansi-escape/src/main.js#L38)）：

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
"更多的指令可以参考 https://en.wikipedia.org/wiki/ANSI_escape_code\r\n" +
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

从如上示例可以看出，实现一个终端模拟器还是相对比较简单，即：流式的读取 ANSI 序列，如果是可打印字符，按照终端状态中的属性在光标的下一个位置，按照属性表渲染出这个字符，如果是 escape code 则根据 ANSI escape code 标准，读取指令参数，根据指令标准，进行设置属性、移动光标等操作即可。

### 终端输入 API 简述

### 通过 xterm.js 探索 终端输入

### pty 介绍

### 完整实例：使用 xterm.js 和 Go 实现一个 WebShell

> 源码详见 [github](https://github.com/rectcircle/implement-terminal-from-scratch/tree/master/demo/02-webshell-demo)

接下来，简单实现一个 WebShell 服务：

* 客户端使用 web 技术和 xterm.js 库。
* 服务端使用 Go 通过 websocket 提供服务。

### 终端和 Shell

## VSCode 终端 和 Shell 集成分析

### 完整实例：在 WebShell 中记录命令执行情况的结构化数据

## VSCode 终端相关扩展 API

> 以示例讲解，写一个插件探测 VSCode 终端 Shell 集成情况。

### 完整实例：在 WebShell 提供可扩展的 API
