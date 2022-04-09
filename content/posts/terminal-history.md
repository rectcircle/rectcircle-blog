---
title: "终端为什么长现在这个样子？"
date: 2022-04-09T10:26:07+08:00
draft: false
toc: true
comments: true
tags:
  - linux
---

## 概述

电子计算机作为第三次工业革命的代表，其发明和迭代不是一蹴而就的，都是在历史技术的基础上一步一步演进而来的。

计算机技术发源于欧美，欧美上一代从业人员是见证了计算技术的诞生和早期发展阶段的，欧美当代从业人员可以从童年接触的老物件以及上一代从业人员，获取到关于计算机技术演进过程的历史线索。

中国没有参与过第一和第二次工业革命。而针对计算机技术，早期（五、六十年代）也是同步发展，但是中间由于特殊历史时期，中断了。当代计算机技术，是近 30 年，重新引入西方已经成熟的技术，才逐步跟上。

而对于国内从业人员来说，当代从业者面对的是当代引进的成熟技术，缺乏历史线索。因此，很多时候，我们面对的一些技术，我们虽然可以很清楚知道用法，知道实现原理，但是很少知道为什么是这样的。这对构建完整的知识体系，非常不利。

阅读本文可以得到：

* 从历史角度理解技术背后动因的思路。
* 解释各个操作系统都存在终端长现在这个样子的历史原因。
* 了解 `ed`、`vi` 诞生的技术支撑。
* 了解 ssh 远程登录，终端相关的原理。

## 背景

最近，在学习 [tini](https://github.com/krallin/tini) （容器的进程管理器）源码时，发现很多之前似懂非懂的感念，如：信号、会话、终端、控制终端、前台进程组、后台进程组。于是，翻开保留的唯一一本本科教材 [《Unix 环境高级编程 第三版》（APUE）](http://www.apuebook.com/)，上述概念在书中都有比较详细的描述，但是关于终端部分，始终不太理解。而这些概念都是相互关联的，缺少这一环，对于 [tini](https://github.com/krallin/tini) 源码的理解就无法达到融汇贯通的层次，简直如鲠在喉。

于是，经过一番检索，在了解了 Terminal 的历史发展过程，再结合书中的概念，终于豁然开朗。

## 理解终端的意义

终端（命令行交互页面）是人机交互发展史非常重要的一环。虽然目前普通用户使用的都是图形化的人机交互界面，而对于计算机从业人员而言：

* 对于研发人员而言，命令行交互界面仍然是研发最常用的交互手段，理解了终端可以帮助研发人员更好命令行交互的程序。
* 对于产品/设计人员而言，可以从中看到交互设计和硬件演变相互促进的过程，对图形化人机交互设计，以及面向未来的新硬件的人机交互（VR/AR），应该有所启发。

## 历史

> 本小结的阶段指的是计算机终端发展史。
> 主要参考：[What Are Teletypes, and Why Were They Used with Computers?](https://www.howtogeek.com/727213/what-are-teletypes-and-why-were-they-used-with-computers/) 和 [Computer terminal Wiki](https://en.wikipedia.org/wiki/Computer_terminal)

### 史前阶段

> 参考：[Teleprinter wiki](https://en.wikipedia.org/wiki/Teleprinter)

先聊一聊计算机诞生之前，应用于电报的一种设备，电传打字机 Teleprinter。

电报是一种点对点的文本信息系统。在 1840 年代被发明出来，并不断演进，如今已被移动通讯系统逐步取代。

由于，中国没有参与第二次工业革命，我们印象中的电报指的就是，使用滴答声音和[莫尔斯码](https://en.wikipedia.org/wiki/Morse_code)的电报（使用 [Telegraph key](https://en.wikipedia.org/wiki/Telegraph_key) 和 [Telegraph sounder](https://en.wikipedia.org/wiki/Telegraph_sounder)，作为输入和输出）。

上述的方式输入和输入成本都非常高，原因是需要人来进行翻译：输入，需要将文本翻译为莫尔斯码；输出，需要将莫尔斯码翻译为文本。

因此，在欧美国家，电报获得了更一步的发展最终通过电传打字机和路由自动化技术，最终诞生了电报互联网 [Telex](https://en.wikipedia.org/wiki/Telex)。

电传打字机，这种设备可能很少出现在中国的家庭中，但是在欧美国家应该比较常见。

电传打字机就是一个负责输入和输出的设备，包含两个部分，键盘和打字机，通过该设备，人们可以无需学习任何电报编码表，即可收发电报。其核心能力就两个：

* 将接收到的电信号转化为机械运动驱动打印机将字母打印到纸上。
* 将在键盘上的输入信号编码转换为电信号发送出去

这里有几个来自 Youtube 的关于电传打字机的老视频（更多可以在 Youtube 搜索：[Teleprinter](https://www.youtube.com/results?search_query=Teleprinter)）。

<iframe  width="760" height="500"  src="https://www.youtube.com/embed/n-eFFd5BmpU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

<iframe  width="760" height="500"  src="https://www.youtube.com/embed/-2gXC-ZPKCM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### 早期阶段

在计算机刚刚发明的时期，计算机面临这人机交互的问题。而电传打字机是一个很好的选择。起初，电传打字机会将输入转换为[穿孔卡片](https://en.wikipedia.org/wiki/Punched_card)再输入计算机，计算机输出到穿孔卡片连接到电传打印到纸上。后面随着技术发展，电传打字机可以通过线缆直接连接到计算机上。

最著名的电传打字机的型号是 [Teletype Model 33](https://en.wikipedia.org/wiki/Teletype_Model_33)，是最早使用 ASCII 码的产品之一。

[Unix](https://en.wikipedia.org/wiki/Unix) 在 1970 年左右被开发出来，并运行在 PDP-11 上，使用了 [Teletype Model 33](https://en.wikipedia.org/wiki/Teletype_Model_33) 作为其核心用户界面，这极大的影响了后面计算机终端的发展。

> 在计算机领域，由于 Teletype 这家公司太过出名，Teletype 就是电传打字机的代名词，因此其直接被翻译为了电传打字机，在类 Unix 系统中，tty 就是次单词的缩写。其中最著名的是 Teletype Model 33 型，其历史影响参见：[wiki](https://en.wikipedia.org/wiki/Teletype_Model_33#Historical_impact) （这里提一下许多场景推荐的最大行长度限制 72，猜测主要自于 Teletype Model 33 的每行打印字母数）

下面有一些视频，可以看到电传打字机和计算机连接的场景。

<iframe  width="760" height="500"  src="https://www.youtube.com/embed/E4IztV7M3jI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

<iframe  width="760" height="500"  src="https://www.youtube.com/embed/ObgXrIYKQjc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

<iframe  width="760" height="500"  src="https://www.youtube.com/embed/_eShaxVcLo8?start=99" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

<iframe  width="760" height="500"  src="https://www.youtube.com/embed/39ZCb65plIQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

受限于电传打字机的物理特性，影响到了 Unix 的用户交互界面的设计以及一些其他特性：

* 逐行依次输出文本，因为电传打字机是无法修改已经打印到纸上的字符的。
* 各种 shell 都提供命令提示符，用来区分需要区分用户的输入和机器的输出，因为电传打字机是黑白，只能通过命令提示符来区分。
* 回车和换行符是两个，因为电传打字机切换行时是需要先将打字头回到开头，然后纸筒滚动一行。
* 由于电传打字机的键盘是计算机的唯一的输入端，因此通过 ctrl 加字符打印出一些特殊字符，以给正在运行程序发送信号。
* 多数库函数的打印日志均采用 `print` 单词，原因在于，在当时看，就是物理意义上打印到纸上。

时至今日，目前的类 Unix 系统仍然可以使用电传打字机作为用户界面使用，下面有一个使用 1930 年的电传打字机操作 Linux 的案例。

<iframe width="760" height="500"  src="//player.bilibili.com/player.html?aid=582863800&bvid=BV1U64y1T7xR&cid=178411950&page=1&t=660.5" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>

在最初的 Unix 中，附带了几个著名的程序，均可以很好的在电传打字机交互界面中使用：

* [ed 文本编辑器](https://en.wikipedia.org/wiki/Ed_(text_editor))
* [Thompson shell 以及之后衍生的众多 shell](https://en.wikipedia.org/wiki/Thompson_shell)

在计算机领域内 [终端（Terminal） 概念](https://en.wikipedia.org/wiki/Computer_terminal)就是对电传打字机这类负责计算机和人类交互的输入输出设备的统称。

在早期，可以说 Terminal 就是 Teletype，但是随着计算机的发展 Terminal 有了其他的形态，但是电传打字机奠定目前仍在使用的终端的基本形式和基本架构。

```
用户 <------> 电传打字机/终端硬件 <------> 终端设备驱动 <-------> 终端行规程（内核） <------> 进程的标准 IO
```

* 终端设备驱动，维护输入和输出队列，负责开关回显功能
* [终端行规程](https://en.wikipedia.org/wiki/Line_discipline)（参见：[博客](https://www.php.cn/linux-382655.html)），在输入时，它处理特殊字符，例如中断字符（通常是 Control-C）和擦除和终止字符（通常分别是退格或删除和 Control-U），在输出时，它用一个替换所有 LF 字符CR/LF 序列等等。
* 进程的标准 IO，抽象成标准 IO，让程序可以使用标准的 IO 接口读写终端。

### 中期阶段

随着显示技术（CRT 技术）的发展，视频终端的成本逐年下降，电传打字机逐渐退出了历史舞台。视频技术带来了电传打字机难以实现的效果：

* 更多的字符集支持。
* 光标可寻址，即可以修改整个屏幕任意光标位置的字符
    * vi/vim（取代了 ed 命令） 更加直观。
    * 基于此诞生了最早的由文本绘制的图形交互界面。
* [字符颜色](https://man7.org/linux/man-pages/man4/console_codes.4.html)/字重/字样的支持。

在 1980 年代，[DEC VT-100](https://en.wikipedia.org/wiki/VT100) 是最具代表性的产品。该产品是第一个遵循 [ANSI escape codes 标准](https://en.wikipedia.org/wiki/ANSI_escape_code) 的产品，事实上推动了该标准的落地。该设备带来了如下影响。

* 目前 [Linux 终端](https://man7.org/linux/man-pages/man7/term.7.html)仍然支持 vt100。
* 24 行 80 字符宽，许多场景推荐的最大行长度限制 79/80 个字符（也可能来源于 IBM 穿孔卡片 或者 [A4 纸打印等宽字符](https://www.dongwm.com/post/pep8-max-line-length/)）。

<iframe width="760" height="500" src="https://www.youtube.com/embed/6zBvYs5Zej0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

此后推出的 [DEC VT220](https://en.wikipedia.org/wiki/VT220) 的键盘布局极大的影响了 [IBM Model M 键盘](https://en.wikipedia.org/wiki/Model_M_keyboard) 布局，从而影响到整个当代全键盘的样式。

到了这个阶段，我们当代从业人员使用的终端的标准已经确定了下来。也就是说，当代计算机行业从业人员，穿越到使用视频终端和 `vi` 的年代，我们也可以无成本的从事老本行。

> [“智能终端”("Intelligent" terminals)](https://en.wikipedia.org/wiki/Computer_terminal#%22Intelligent%22_terminals)和[哑终端 (dumb terminal)](https://zh.wikipedia.org/wiki/%E5%93%91%E7%BB%88%E7%AB%AF)：上文提到的 VT100 等设备因为能正确识别并处理光标移动等控制字符处理在当时被称为智能终端，在当时，此类设备价格昂贵。因此，很多相对廉价的视频终端的能力和传统的电传打字机一样，无法支持光标移动，此类终端称为哑终端。

### 当代阶段

随着视频设备的和个人 PC 的发展，专门的终端硬件设备已经退出了历史舞台，终端的硬件被独立的显示器和键盘取代。而终端能力在当代被抽象为图形化交互界面下，一类叫做虚拟终端的软件，如：

* [类 Unix 系统的 xterm](https://invisible-island.net/xterm/)
* [MacOS 的 iterm2](https://iterm2.com/)
* [Windows terminal](https://github.com/microsoft/terminal)
* [浏览器的 xterm.js](https://xtermjs.org/)

在此阶段，通过伪终端和编程的方式，实现对终端设备的模拟，此时终端模型变为：

```
用户 <------> 电传打字机/终端硬件设备产生的信号 <-----------> 终端设备驱动 <-------------------------------> 终端行规程（内核） <------> 进程的标准 IO
 ‖                        ‖                                   ‖                                          ‖                       ‖
 ‖                        ‖                                   ‖                                          ‖                       ‖
 ‖                        ‖                                   ‖                                          ‖                       ‖
 ‖                        ‖                                   ‖                                          ‖                       ‖
用户 <------> 任意可以转换为 IO 流的东西（如网络IO） <------> 伪终端主设备（进程 A）<---> 伪终端从设备 <------> 终端行规程（内核） <------> 进程的标准 IO（进程 B）
```

具体而言，SSH 远程登录 shell 的模型如下所示：

```
  -------------客户端-------------                                 -----------------------------服务端-----------------------------
 |                               |                               |                                                               |
 |                               |                               |                                                               |
用户 <---> 客户端虚拟终端 <---> ssh 客户端进程 <-----(TCP)----> ssh 服务端进程（伪终端主设备） <---> 伪终端从设备 <---> 终端行规程（内核） <---> shell 进程（标准 IO）
```

* 注意，ssh 客户端进程需关闭终端行规程的所有默认处理（即 raw mode 参见 [libssh](https://api.libssh.org/master/libssh_tutor_shell.html#write_data)），所有行为交由服务端的终端行规程处理。
