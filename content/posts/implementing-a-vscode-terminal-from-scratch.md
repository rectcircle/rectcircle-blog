---
title: "从零开始实现一个 “VSCode Terminal”"
date: 2025-07-13T01:44:36+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 终端相关技术

### 终端设备历史

详见： [探索终端的历史渊源](/posts//terminal-history/)

### 终端渲染 API 简述

> [ANSI escape code](https://en.wikipedia.org/wiki/ANSI_escape_code)

在支持图形化交互界面的系统上，软件开发人员可以通过标准的图形 API 来绘制图形。这些标准 API 有： OpenGL、DirectX、Vulkan 等等。

那么类比一下，在命令行交互界面的系统上，软件开发人员通过怎么的 API 来“绘制”命令行呢？也有对应的标准 API 吗？

这就要回到校园里最初学习的 ASCII 码了，我们都知道 ASCII 定义了英文世界的常用的字母和符号。但是这些字母和符号只占用了 95 个，这些编码被称之为可显示字符（可打印字符/Printable character），软件开发人员天天可以接触到。

ASCII 码一共有 128 个，那其他的 33 个字符，因为已经进入了图形化交互页面，在大学和工作中很少直接结束。这 33 个编码对应的字符，被称为控制字符（Control code），而控制字符就是 “绘制” 命令行界面的关键。

换个角度来看，因此 ASCII（准确的说是，任何兼容/扩展 ASCII 的编码，即 ANSI 编码） 编码自身就是命令行界面的编程语言，而 ASCII 的控制字符就是命令行界面的 API。而符合一定标准的 ASCII 序列就是命令行界面的绘制程序。

这套渲染命令行界面的标准被称为 [ANSI escape code](https://en.wikipedia.org/wiki/ANSI_escape_code)，和其他计算机标准演进一样：

* 先有需求和落地产品： 市场上各大终端硬件厂商准寻着不同的各自的私有协议（[VT52](https://en.wikipedia.org/wiki/VT52)/[Hazeltine 1500](https://en.wikipedia.org/wiki/Hazeltine_1500)），软件开发者不得不分别兼容。
* 标准化机构（[ANSI](https://en.wikipedia.org/wiki/American_National_Standards_Institute)）出手： 定义了 ECMA-48 标准， 1976 年通过，随后这个标准进行了多次更新，目前使用的是 1991 的第五版，这个标准也被其他标准化机构收录，因此 ECMA-48、 ANSI X3.64、 ISO 6429 是一个东西。
* 业界事实标准： 因为 1978 年发布的 [VT100/VT102](https://en.wikipedia.org/wiki/VT100) 等系列大获成功，因为其实现了 ECMA-48 标准，因此有时这个标准也叫 VT100/VT102 。

### 通过 xterm.js 探索 ANSI escape 序列

在上个世纪，命令行交互界面时代，终端就是一种真实存在的物理设备。但是现代计算机的交互已经进化到了图形化交互界面，已经不再需要一个真实的物理终端设备存在。但是在计算机软件开发领域，仍然需要命令行交互界面。因此，在现代，我们能接触到的终端设备，指的都是一种对终端设备的仿真软件（模拟器），即： 遵守 ANSI escape code 规范，将 ANSI escape code 序列，通过图形化交互 API 进行渲染的仿真软件。我们平常用到了各种终端软件都可以归于此类。

这里，介绍一个 Web 领域，最流行的终端 A 序列渲染库 [xterm.js](https://xtermjs.org/)，该库被众多 WebShell 所使用，也是 VSCode 终端的底层渲染库。本小结，会通过该库探索 ANSI escape code 标准。

https://www.runoob.com/w3cnote/ascii.html

<!-- <link href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.min.css" rel="stylesheet"> -->

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
var term = new Terminal();
term.open(document.getElementById('terminal'));
term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ \r\nabc')
</script>

### 终端和 Shell

### 完整实例：使用 xterm.js 和 Go 实现一个 WebShell

## VSCode 终端 和 Shell 集成分析

### 完整实例：在 WebShell 中记录命令执行情况的结构化数据

## VSCode 终端相关扩展 API

> 以示例讲解，写一个插件探测 VSCode 终端 Shell 集成情况。

### 完整实例：在 WebShell 提供可扩展的 API
