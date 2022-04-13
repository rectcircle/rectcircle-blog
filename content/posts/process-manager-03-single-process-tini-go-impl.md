---
title: "进程管理器（三）通过 Go 语言实现 tini"
date: 2022-04-05T18:13:00+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> 参考的 tini 版本： [v0.19.0](https://github.com/krallin/tini/blob/v0.19.0/src/tini.c)

## 概述

本文将介绍如何使用 Go 语言，实现功能上和 C 语言编写的 tini 完全相同的一个命令行程序。

Go 语言和 C 语言是两种完全不兼容的，不同的语言，虽然 Go 存在 cgo 可以调用动态链接库，但是这样做比较繁琐，且依赖比较大。

因此，本文不以 cgo，而是以纯 Go 语言的方式来实现 tini。下文，着重于介绍，在实现过程，遇到的一些核心问题。

理解这些问题，足以了解如何将一个与操作系统紧密联系的 C 语言程序转写成一个纯 Go 语言的程序，以及如何将用 C 语言描述的 Linux Manuel 应用到 Go 语言中。对理解众多，用 Go 语言开发的开源的云原生基础设施的源码很有帮助，如 docker、k8s。

## Go 解析命令行参数

### POSIX 标准库函数 `getopt`

> [POSIX getopt](https://pubs.opengroup.org/onlinepubs/009696799/functions/getopt.html) | [getopt wiki](https://en.wikipedia.org/wiki/Getopt) | [gun getopt](https://www.gnu.org/software/gnuprologjava/api/gnu/getopt/Getopt.html) | [getopt(3) — Linux manual page](https://man7.org/linux/man-pages/man3/getopt_long.3.html)

`getopt` 参数风格又称：C 风格命令行参数解析器，Unix 风格命令参数。

`int getopt(int argc, char *const argv[], const char *optstring)` 是 POSIX 标准库中的一个函数，用于解析命令行参数中的短选项（短选项使用 `-` 开头，选项表示为单个字符，可选的传递参数。如 `-h`、`-a 1`）。

* getopt 第一个参数为命令行参数的长度，第二个参数为命令行参数数组。
* getopt 第三个参数，传递一个模式字符串，如 `"ha:c::"`，其中：
    * `h` 表示声明了一个无参数选项
    * `a:` 表示声明了一个有参数的选项。
    * `c::` 表示声明了一个可选参数的选项
    * `W;` （GUN 扩展，描述的很模糊），参见：[stackoverflow](https://stackoverflow.com/questions/14338223/what-is-the-w-option-of-gnu-getopt-used-for)
    * `+` 开头 （GUN 扩展，或者设置了 `POSIXLY_CORRECT` 环境变量），表示不对 argv 进行重新排列，即不支持 `ls / -al`，参见下文（这个 POSIX 标准一致）。
    * `-` 开头（GUN 扩展），表示非选项参数也作为选项处理，如 `ps aux` 等价于 `ps -aux`。
    * `:` 开头（或者 `:` 在 `+`、`-` 的后面），此时如果遇到选项缺少参数的错误，将返回 `':'` 而不是 `?`，
* getopt 返回值是解析到的选项的字符，如 `'h'`。
    * 如果是 `'?'`，表示有两种类型的错误
        * 未定义的选项，此时 `optopt` 表示不存在的选项的字符。
        * 选项缺少参数，此时 `optopt` 表示缺少参数的选项的字符（`optstring` 不以 `:` 开头）。
    * 如果是 `':'`，选项缺少参数，此时 `optopt` 表示缺少参数的选项的字符（`optstring` 以 `:` 开头）。
    * 如果返回 `-1`，表示接下来不是一个选项，解析结束，
        * 如 `cmd -h -a 1 subcmd`。检查到 `subcmd` 不是一个选项，将返回 -1，此时 `optind` 为 4。
        * 如 `cmd -h -a 1 -- subcmd`。检查到 `--` 是一个特殊标志（强制结束扫描），将返回 -1，此时 `optind` 为 5。
* getopt 还导出了几个全局变量
    * `extern char *optarg` 如果选项包含参数，则参数值将被设置到给参数中。当传递 `-a 1` 时，getopt 返回 `'a'` 时，为 `"1"`
    * `extern int optind` 为下一个需要解析的命令行参数的下标，初始化为 1，如果需要重新解析，需要将该值重设为 1。
    * `extern int opterr` 如果设置该全局变量为 0 （默认不为 0） 且 `optstring` 第一个字符为 `:`，`getopt()` 将不打印错误消息到 stderr，此时调用者可以通过 `'?'` 手动打印错误消息。
    * `extern int optopt` 出现错误时，错误的选项字符。
* getopt 在 GUN 实现中，有一个扩展：支持非选项参数放置在选项的前面。如 `ls / -a`。这种写法在其他 Unix 系统就会报错，如 MacOS。针对非选项参数放置在选项的前面的情况，getopt 会对命令行参数进行重新排列将非选项参数放到后面，即 `ls / -a` 变成 `ls -a /`，然后再解析。如果设置 `POSIXLY_CORRECT` 环境变量或者 `optstring` 参数以 `+` 开头，则禁用该特性。
* getopt 支持如下方式传递选项和选项的参数
    * `-a -b -c 1` 分别传递
    * `-abc 1` 合并传递，其中 `a` 和 `b` 不能包含参数， 最后一个 `c` 可以包含参数。
    * `-ffile` 如果 `f` 包含参数，等价于 `-f file`。
    * `-vvv` 一个选项可以出现多次，均可以识别到。

一般情况下，getopt 放在一个 while 循环中被调用。一般形式为：

```cpp
#include <unistd.h>


int
main(int argc, char *argv[ ])
{
    int c;
    int bflg, aflg, errflg;
    char *ifile;
    char *ofile;
    extern char *optarg;
    extern int optind, optopt;
    . . .
    while ((c = getopt(argc, argv, ":abf:o:")) != -1) {
        switch(c) {
        case 'a':
            if (bflg)
                errflg++;
            else
                aflg++;
            break;
        case 'b':
            if (aflg)
                errflg++;
            else {
                bflg++;
                bproc();
            }
            break;
        case 'f':
            ifile = optarg;
            break;
        case 'o':
            ofile = optarg;
            break;
        case ':':       /* -f or -o without operand */
                fprintf(stderr,
                        "Option -%c requires an operand\n", optopt);
                errflg++;
                break;
        case '?':
                    fprintf(stderr,
                            "Unrecognized option: -%c\n", optopt);
            errflg++;
        }
    }
    if (errflg) {
        fprintf(stderr, "usage: . . . ");
        exit(2);
    }
    for ( ; optind < argc; optind++) {
        if (access(argv[optind], R_OK)) {
    . . .
}
```

我们常用的 ls、ps 等实际上使用的是 `getopt` 的超集 `getopt_long`，该函数虽然不是 POSIX 标注，但是类 Unix 平台也都支持。

关于 `getopt_long` 参见：[getopt(3)](https://man7.org/linux/man-pages/man3/getopt_long.3.html)。在此就不多赘述了。

### Go 语言版本的 `getopt`

在 Go 语言中，标准库中的 `flag` 包也可以实现 `getopt` 类似的效果，但是其并不遵循 POSIX 标准，比如，其同时支持 `--` 和 `-` 没有区别。

经过搜寻，找到一个第三方的开源的符合 `POSIX/GUN` 标准的选项解析器： [pborman/getopt](https://github.com/pborman/getopt)。

在本次实现中，就使用了该库，源码参见：[parseArgs 函数](https://github.com/rectcircle/tini-go/blob/e0f3f7ac3cff8406c87472fef392bc5123b60933/main_linux.go#L122)。

## Go 使用 Linux 系统调用和库函数

现代高级编程语言的跨平台特性，是非常重要的。因此在高级编程语言的标准库中，提供了对主流操作系统能力的通用化封装，这意味着，某些特定操作系统的能力在标准库中并不存在。Go 语言也是如此。

Go 提供了针对操作系统平台的条件编译的能力。针对 Linux 平台，对于操作系统的底层能力，Go 将其封装到了 `syscall` 包中。

直接通过 `syscall` 包，调用 Linux 的系统调用太过原始。Go 将 unix 相关的系统调用封装到了官方的第三方模块 [`golang.org/x/sys/unix`](https://pkg.go.dev/golang.org/x/sys/unix) 中，glibc 中的函数多数函数均可在这个模块中找到。

## Go 语言信号处理

和无法在 Go 中创建操作系统级别的线程，而只能创建协程类似。Go 语言把信号处理相关内容封装到了运行时中，这就意味着，我们无法直接调用相关操作系统的系统调用来设置信号屏蔽字等原始的信号操作。而只能使用 `os/signal` 包提供的信号操作。

首先，需要了解 `os/signal` 包的使用，以及 Go 运行时对于信号的实现。才能设法通过 Go 语言实现和 tini 类似效果的。

### Go `os/signal` 包

https://pkg.go.dev/os/signal

### 信号在 Go runtime 的实现

https://golang.design/under-the-hood/zh-cn/part2runtime/ch06sched/signal/

### 一个 bug 或者说 特性

### tini 信号相关的设计

### Go 语言实现思路

## Go 语言程序实现子进程的引导阶段

### Linux 的 fork-exec

### Go `os/exec` 包

### Go 创建进程原理分析

### 方案一：syscall.SYS_FORK（错误）

### 方案二：通过一个特殊参数启动当前程序

## 源码

除如上核心问题外，其他部分和 tini C 语言版本差别不大。

Go 语言版本的 tini 已经开源在了 Github 上： [rectcircle/tini-go](https://github.com/rectcircle/tini-go)。

https://github.com/krallin/tini

* docker --init
    * https://docs.docker.com/engine/reference/run/#specify-an-init-process
    * /sbin/docker-init
* man signal https://man7.org/linux/man-pages/man7/signal.7.html
    * SIGTTIN
    * SIGTTOU
    * SIGURG docker bug https://docs.docker.com/engine/release-notes/#20107
* 信号处理函数
    * https://man7.org/linux/man-pages/man2/sigaction.2.html
    * https://www.jianshu.com/p/9b8281fe75c5
* 实时信号 https://www.icode9.com/content-3-763729.html
* 信号 mask
    * https://blog.51cto.com/u_1793109/606688
    * https://blog.csdn.net/u010709783/article/details/78390184
    * https://jason--liu.github.io/2019/04/15/use-sigprocmask/
    * https://www.cnblogs.com/my_life/articles/5146192.html
* 查看进程各种 id https://unix.stackexchange.com/questions/82724/ps-arguments-to-display-pid-ppid-pgid-and-sid-collectively
* Go 语言信号处理
    * https://pkg.go.dev/os/signal
    * https://juejin.cn/post/6875097644100763655
    * https://www.hitzhangjie.pro/blog/2021-05-25-go%E7%A8%8B%E5%BA%8F%E4%BF%A1%E5%8F%B7%E5%A4%84%E7%90%86%E8%BF%87%E7%A8%8B/#sigpipe%E4%BF%A1%E5%8F%B7%E5%A4%84%E7%90%86
    * https://books.studygolang.com/The-Golang-Standard-Library-by-Example/chapter16/16.03.html
    * https://golang.design/under-the-hood/zh-cn/part2runtime/ch06sched/signal/
    * CGO
        * https://stackoverflow.com/questions/47869988/how-does-cgo-handle-signals
        * https://github.com/golang/go/issues/7227
* 更改 session 的前台进程 https://man7.org/linux/man-pages/man3/tcgetpgrp.3.html#DESCRIPTION 和 SIGTTOU 信号未忽略，导致的阻塞问题
* Go bug reset 不处理 ignored 信号
    * https://github.com/golang/go/issues/46321
    * https://github.com/golang/go/issues/20479
* Go fork 多线程问题
* Go syscall 和 RawSyscall 区别
    * https://www.cnblogs.com/dream397/p/14301620.html
    * https://stackoverflow.com/questions/16977988/details-of-syscall-rawsyscall-syscall-syscall-in-go
* go unix 库 https://cs.opensource.google/go/x/sys/+/483a9cbc:unix/ioctl.go;l=28
* 终端颜色和环境变量 TERM，LS_COLORS
* 控制终端
    * http://shareinto.github.io/2016/11/17/linux-terminal/
    * https://blog.csdn.net/weixin_44966641/article/details/120585519
* 守护进程
    * https://www.kawabangga.com/posts/3849
    * https://www.cnblogs.com/yaodd/p/5558857.html
* Go fork 两种方式之 reexec 方式
    * https://jiajunhuang.com/articles/2018_03_08-golang_fork.md.html
    * https://github.com/moby/moby/blob/master/pkg/reexec/reexec.go
* Go fork 问题 https://stackoverflow.com/questions/28370646/how-do-i-fork-a-go-process
* Go 语言的 tcxx 相关函数实现 https://github.com/snabb/tcxpgrp
* GO 进程收割者 https://gist.github.com/williammartin/eb355f7d387791a9c225361e5d19ea40
* Go exec https://gobyexample.com/execing-processes
* APUE 进程管理作业管理
    * https://blog.csdn.net/qq_41453285/article/details/90484881
    * https://blog.csdn.net/TODD911/article/details/17011259
* 信号继承
    * https://blog.csdn.net/guozhiyingguo/article/details/53837424
    * https://www.freesion.com/article/2325480275/
* Go 设置父进程死亡信号通知 https://gist.github.com/corvuscrypto/cec8255687aa962c3562d0e5c548da37#file-main-go-L52
