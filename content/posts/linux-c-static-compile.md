---
title: "Linux C 静态编译"
date: 2022-12-05T12:13:10+08:00
draft: false
toc: true
comments: true
tags:
  - linux
---

## Linux C 编译过程

Linux 又称 [GNU/Linux](https://www.gnu.org/gnu/linux-and-gnu.html) 。自然而然 Linux 提供的系统调用（API）通过 glibc 提供，通过 C 语言描述，因此 C 语言是离 Linux 内核最近的编程语言。

GCC 的编译一个可执行文件的过程，可以按照顺序分为如下 4 个阶段，这 4 个阶段前一个阶段是后一个阶段输入进行连接。

* 预处理。输入 `.c` (C 语言代码文件) 和 `.h` （头文件） 源代码文件。输出预编译文件 `.i`。该过程是对 C 语言宏的处理。
* 编译，输出汇编文件 `.s`。该过程将 C 代码转换为等价的汇编代码。
* 汇编，生成目标文件 `.o`。该过程将汇编代码转换为机器语言代码。
* 链接，生成可执行文件。该过程将 `.o` 依赖的外部全局变量和函数的定义链接到 `.o` 文件中，并生成可执行文件。

这里需要特别说明的是：

* 上文介绍的时 C 语言的可执行文件的编译过程。在 Linux 中，最终编译产物还是两种其他类：静态链接库 (`.so`) 和动态链接库 (`.a`)。要编译生成这两种类型的产物的前 3 个阶段和编译一个可执行文件的过程一样，都需要预处理、编译、汇编的过程。
* Go 语言编译成可执行文件的过程，在链接阶段和 GCC 的过程是类似的，因此我们需要重点看链接的过程。其他过程本文不多做介绍。

## 动态链接原理和优点

我们编写的代码，最终会编译成可执行文件，这个可执行文件会占用磁盘空间。可执行文件执行时，可执行文件本身会加载到内存中，占用内存资源。

编写一个 C 语言的程序，需要调用一些通用的函数（如 [ISO C](https://www.gnu.org/software/libc/manual/2.36/html_mono/libc.html#ISO-C)）以及一些操作系统提供的系统调用的封装函数。这些依赖，基本上是所有 Linux C 的应用程序所必备的。

在计算机发展早期，磁盘和内存的资源是及其昂贵的。如果每个程序，都需要将这些函数的实现编译到可执行文件中，这样就造成了磁盘和内存资源的浪费。

为此，操作系统，通过动态链接的能力，以节约，可执行文件自身占在用的磁盘空间，以及其在加载后占用内存资源。

Linux 动态链接的流程为：

* 将函数库，编译成动态链接库 (`.so`)。
* 可执行文件如果依赖该函数库的函数，在链接阶段将该函数库的名字 (标识) 声明在可执行文件中。此时，生成的可执行文件就不会包含动态链接库的内容，而只存在一个引用，从而节省了磁盘空间。
* 可执行文件在执行时，当调用位于动态链接库中的函数时，会首先查找该动态链接库是否加载过了，如果已经加载过了，则执行执行已加载的函数代码，否则去磁盘中查找对应的动态链接库，并加载。这就保证同一个动态链接库，在内存中只存在一份，从而节省了内存空间。

以上，是动态链接要解决的主要问题。除了上述流程外，Linux 还提供了另一种使用动态链接库的方法：在代码中动态的调用 `ldopen` 等系统调用来加载甚至替换一个外部函数库。利用这个特性，可以实现代码程序的热更新(参考： [Linux C/C++ 实现热更新](https://howardlau.me/programming/c-cpp-hot-reload.html))，不需要重启进程。

## 动态链接的缺点

没有什么好处是没有代价的，动态链接的本质是一种复用，复用意味着一种耦合。因此会带来如下问题：

* 应用程序存在外部依赖，这给程序的部署带来困难。
* 多个程序依赖不同版本的同一动态链接库时，存在的冲突的问题。

目前，随着磁盘和存储的成本不断地降低，动态链接的缺点带来的问题已经远大于其优点带来的收益了。为了解决这些问题，又提出了很多技术，如：

* 在移动端（如 Android），将应用程序的所有依赖打包到一个压缩包 (`.apk`)，包括 `.so`。
* 在服务端，将所有的程序和依赖 (`so`) 容打包成一个镜像，并以容器化方式运行 (mount namespace)。
* 各种编程语言通过如下方式解决这些问题：
    * 通过虚拟机封装操作系统的差异，如 Java。
    * 支持通过静态编译的方式生成无外部依赖的可执行文件，如 Go。

## C 语言的库 和 libc

C 语言虽然是一种高级语言，但是和其他的编程语言相比，有一个特殊的身份，即系统编程语言，具体而言就是：

* 多数操作系统是由 C 语言编写的，这要求其标准库是可选的，且需要能操作非常底层的硬件资源，需要具有巨大灵活性。
* 多数操作系统的系统调用 (API) 是通过 C 语言函数调用方式提供。

因此，C 语言函数库的可以分为标准的跨平台的部分、操作系统专有两个部分：

* 跨平台的部分主要的标准有：[ISO C](https://www.gnu.org/software/libc/manual/2.36/html_mono/libc.html#ISO-C)、[POSIX](https://www.gnu.org/software/libc/manual/2.36/html_mono/libc.html#POSIX)。
* 操作系统专有的库有：[BSD](https://www.gnu.org/software/libc/manual/2.36/html_mono/libc.html#Berkeley-Unix)、[SVID](https://www.gnu.org/software/libc/manual/2.36/html_mono/libc.html#SVID)、[XPG](https://www.gnu.org/software/libc/manual/2.36/html_mono/libc.html#XPG)、Linux。这些特殊特定函数，会通过宏来开启，如 Linux 的 [`_GNU_SOURCE`](http://musl.libc.org/doc/1.1.24/manual.html)。

这样 在编写 C 程序时，对于的选择就有了三种：

* 不使用标准库，在无操作系统的嵌入式领域或者操作系统领域。
* 仅使用跨平台的标准库，这样编写的 C 程序：
    * 只是用 ISO C 几乎可以在所有的操作系统中使用，包括 windows。
    * 使用了 POSIX，及基本上可以在类 Unix 跨平台编译。
* 使用了操作系统专有的库，则大概率只能在该操作系统进行运行。对于 Linux ，一些主流的开源 Unix 应该都是可以运行的。

libc 指 C 语言标准库。不同的 libc 对如上标准或库的情况也是不一样的。一般情况下，会实现标准的 [ISO C](https://www.gnu.org/software/libc/manual/2.36/html_mono/libc.html#ISO-C)、[POSIX](https://www.gnu.org/software/libc/manual/2.36/html_mono/libc.html#POSIX)，在加上该 libc 面向的操作系统的专有库。

下面介绍，在 Linux 中，[主流的 libc 库](http://www.etalabs.net/compare_libcs.html)：

* [glibc](https://www.gnu.org/software/libc/manual/2.36/html_mono/libc.html)，大而全的历史包袱很重的 libc 库，据说代码质量很差。为了实现 Linux 宣扬的其他类 Unix 操作系统可以在 Linux 中编译，因此支持上述的所有库。是 GNU 基金会下的产物，服务端领域主流的 Linux 版采用的 libc 实现，是 Linux 系统事实上的 libc 标准实现。采用 LGPL 协议（[静态编译不友好](https://www.zyxtech.org/2016/04/28/55/)），下文会专门介绍。
* [musl-libc](http://www.musl-libc.org/intro.html)，定位为下一代 Linux 设备，采用 MIT 协议，专为静态编译设计，支持主流的指令集。主要应用云原生和嵌入式领域。
* [uClibc-ng](https://uclibc-ng.org/)，面向嵌入式的 libc，采用 LGPL 协议（[静态编译不友好](https://www.zyxtech.org/2016/04/28/55/)）。

## glibc 的动态链接问题

> 参考：[glibc FAQ](https://sourceware.org/glibc/wiki/FAQ#Even_statically_linked_programs_need_some_shared_libraries_which_is_not_acceptable_for_me.__What_can_I_do.3F) | [stackoverflow](https://stackoverflow.com/questions/57476533/why-is-statically-linking-glibc-discouraged)

glibc 有一个比较大的问题，即默认情况下 glibc 不支持静态链接。主要原因是：

* glibc 的一些实现是依赖其他动态链接库实现的，比如 NSS, gconv, IDN 以及 thread cancellation（通过 dlopen 方式，所以 ldd 命令看不到，但是源码可以看出来，如：[libnss 相关](https://github.com/bminor/glibc/blob/master/nss/nss_module.c)）。
* 这些动态链接库又声明了对 glibc 的依赖，这样就造成了循环依赖。比如，静态编译了 glibc，由于 glibc 依赖了 `libnss3.so`（`sudo ldconfig -p | grep nss`），而 `ldd /usr/lib/x86_64-linux-gnu/libnss3.so`，此时我们的程序还是会加载一个 glibc 的动态链接库。
* 这就造成了两个问题：
    * 我们的程序间接依赖 `libnss3.so` 的动态链接库，且 ldd 也看不到，这与我们想要的静态链接，无 `.so` 依赖背道而驰。
    * 在运行时，同一个 glibc 函数/全局变量在两个地方都有是实现，一个是静态编译的，一个是通过类似 `libnss3.so`  间接引入的 `libc.so.6`（即 glibc），这可能带来并发问题。
* 因此，在发布于 2018 的 glibc 2.27 中，在编译阶段如果指定了静态链接，就会出现警告（只要使用到了 ldopen 之类的函数都会报该问题）。

比如，下面一份来自 Go 标准库中 `os/user` 的一份 cgo 代码的部分。

```c
#define _GNU_SOURCE
#include <pwd.h>

static int mygetpwuid_r(int uid, struct passwd *pwd,
	char *buf, size_t buflen, struct passwd **result) {
	return getpwuid_r(uid, pwd, buf, buflen, result);
}

void main()
{}
```

在 debian 11 中，通过 `gcc main.c  -static` 静态编译。将出现如下警告：

```
/usr/bin/ld: /tmp/ccB7Eh74.o: in function `mygetpwuid_r':
main.c:(.text+0x34): 警告：Using 'getpwuid_r' in statically linked applications requires at runtime the shared libraries from the glibc version used for linking
```

我们观察 a.out 的动态链接库情况 `ldd a.out` 可以发现输出如下：

```
        不是动态可执行文件
```

但是实际上，执行 `a.out` 会隐式的依赖 `libnss3.so` 和 `libc.so.6`（即 glibc）。实际上，这比动态链接编译的程序还要糟糕。因为该程序隐藏了其依赖。所以该警告必须要消除。

注意：glibc 的 FAQ 给出了一种解决方案是，在编译 glibc 时，通过 `--enable-static-nss` 将其依赖的 NSS 也静态编译，但是官方并不推荐。因此，本文并不介绍此做法。

## musl-libc 实现静态链接

解决上述 glibc 问题，最好的办法就是使用 musl-libc，因为上文提到了，musl-libc 就是专门为静态链接而设计的。

```bash
sudo apt update
sudo apt -y install musl-tools
musl-gcc main.c -static
```
