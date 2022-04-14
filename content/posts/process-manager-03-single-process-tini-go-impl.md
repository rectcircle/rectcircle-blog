---
title: "进程管理器（三）通过 Go 语言实现 tini"
date: 2022-04-05T18:13:00+08:00
draft: false
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

> [os/signal](https://pkg.go.dev/os/signal)

在 Go 语言中，信号的默认行为和 Linux(POSIX) 大致相同，但是存在如下区别：

* `SIGBUS`（总线错误）, `SIGFPE`（算术错误）, `SIGSEGV`（段错误）称为同步信号，它们在程序执行错误时触发，而不是通过 `os.Process.Kill` 之类的触发。在 Linux 中是产生 core 文件的，在 Go 中是产生 panic 的。
* `SIGPROF`，在 Linux 中默认行为为终止， Go 运行时使用该信号实现 `runtime.CPUProfile`。
* `SIGPIPE`，默认行为和 Linux 不同：
    * 写入文件描述符 1 或 2 上的损坏管道（标准输出或标准错误），将导致程序触发 SIGPIPE 信号，此时其默认行为为退出。
    * 其他场景（如往一个关闭的 socket 或 pipe 写数据时），传统 Linux 程序会触发  `SIGPIPE` 信号，而 Go 只会返回 `EPIPE` 错误，也会出触发 SIGPIPE 信号，但此时其默认行为为什么都不做。

在 Go 中，信号接收被抽象成了 Go 语言的 channel 特性。

```go
import (
	"fmt"
	"os"
	"os/signal"
)

func main() {
    // 构造一个 channel，用于接收信号
    // 如果在发送信号时我们还没有准备好接收，我们必须使用缓冲通道，否则可能会丢失信号。
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)

    // 阻塞等待，直到收到信号。
	s := <-c
	fmt.Println("Got signal:", s)
}
```

其他函数为：

* `signal.Ignore` 和 Linux 不同，在 Go 语言中忽略一个信号通过该专门的函实现的
* `signal.Ignored` 检查一个信号是否被忽略。
* `signal.Reset` 将信号处理函数恢复为默认行为（这里的默认行为是 Go 定义的默认行为）。
* `signal.Stop` 不再将转发信号到信号中，但是不会将信号恢复为默认行为：

### 信号在 Go runtime 的实现

> [Go 语言原本](https://golang.design/under-the-hood/zh-cn/part2runtime/ch06sched/signal/) | [源码：Linux 下对信号的配置](https://github.com/golang/go/blob/f229e7031a6efb2f23241b5da000c3b3203081d6/src/runtime/sigtab_linux_generic.go#L9) | [源码：](https://github.com/golang/go/blob/9839668b5619f45e293dd40339bf0ac614ea6bee/src/runtime/signal_unix.go#L608)

Go 存在一个运行时，在 Runtime 启动之处的主线程 M0，会对信号进程初始化（只会在 M0 初始化 1 次），大致步骤为：

* 记录启动之初的信号屏蔽字，原因是，后续步骤会对信号屏蔽字进行更改，需要保存下来，以再创建新的进程时（`os/exec`）进行恢复。
* 初始化信号栈，原因是， Go 的协程栈的特殊性，Go 的信号处理函数需要在单独的栈中运行。
* 初始化信号屏蔽字，原因是，在 Go Runtime 启动时从父进程继承的信号屏蔽字可能屏蔽了一些信号，Go 为了一致性和 Go runtime 的正确性，需要将其恢复。（比如 Go 承诺 `ctrl + c` 可以终止进程，如果不恢复，`ctrl + c` 就失效了）
* for 循环，为大多数信号（从父进程继承下来的 Ignore 情况等除外）注册信号处理函数。注意，会使用 `SA_ONSTACK` 标志，理由和第二点一致。这个处理函数实现了 `os/signal` 描述的默认行为，以及将信号发送给 `os/signal` 的 `Notify` 注册的 Channel 中。

### 一个 bug 或者说 特性

从源码来看 `signal.Reset` 只能将 `signal.Notify` 的对应的信号的行为恢复为默认，对于 `signal.Igonre` 的信号则不会生效。

### tini 信号相关的设计

在 tini 中，对信号信号处理的安排如下：

* 主进程:
    * SIGFPE, SIGILL, SIGSEGV, SIGBUS, SIGABRT, SIGTRAP, SIGSYS 保持默认行为
    * SIGTTIN, SIGTTOU 行为设置为忽略
    * 其他信号转发给工作进程
* 子进程:
    * 和主进程从父进程继承下来的配置一致

### Go 语言实现思路

在 Go 中，虽然不能实现通过信号屏蔽字实现如上效果，但是可以通过 Go 提供的 `os/signal` 实现类似的效果：

* 主进程
    * 使用 `os/signal` 的 `Notify` 注册除出了 SIGFPE, SIGILL, SIGSEGV, SIGBUS, SIGABRT, SIGTRAP, SIGSYS, SIGTTIN, SIGTTOU 信号处理函数，并启动一个协程转发信号。
    * 使用 `os/signal` 的 `Ignored` 记录 SIGTTIN, SIGTTOU 信号的初始状态。
    * 使用 `os/signal` 的 `Ignore` 忽略 SIGTTIN, SIGTTOU 信号。
    * fork 子进程，将 SIGTTIN, SIGTTOU 的初始状态通过命令行参数传递给子进程（参见下文）。
* 业务进程（子进程）
    * 在引导阶段，恢复信号
        * 如果 SIGTTIN, SIGTTOU 的默认状态为 Ignore，什么都不做，因为从父进程继承了 Ignore 的状态。
        * 否则，使用 `os/signal` 的 `Notify` 以及 `Reset` 将 SIGTTIN（先 `Notify` 再 `Reset` 的原因参见上文所述 bug）, SIGTTOU 恢复为默认行为。

## Go 语言程序实现子进程的引导阶段

上文我们看到。我们需要在子进程中的引导阶段（fork 和 exec 调用之间）插入一段逻辑，来恢复信号。

### Linux 的 fork-exec

在 Linux fork 一个进程，分为两步，fork 和 exec。在 fork 后，子进程进行一些初始化操作后（引导阶段），调用 exec 执行新的进程。

### Go `os/exec` 包及其原理

Go 语言的启动一个新的进程，被封装到了 `os/exec` 下，看起来没有 Linux 中的 fork exec 两步，源码位于：[syscall.forkExec](https://github.com/golang/go/blob/a2baae6851a157d662dff7cc508659f66249698a/src/syscall/exec_unix.go#L141)。

### 方案一：syscall.SYS_FORK（错误）

不适用使用 Go 标准库的 `os/exec` 而是直接使用 `syscall.SYS_FORK` 来 fork，然后加入一部分逻辑，然后再执行 `syscall.Exec` 启动业务进程。

但是这样做是错误的，原因在于：`fork` 在多线程场景的局限性。即：不管当前进程有多少个线程，fork 后创建的子进程，也只会有一个线程，其他线程都将不复存在。

因此在 Go 语言中，经测试 fork 系统调用后， `os/signal` 将会失效，原因猜测是，fork 后，由于线程的丢失，在 runtime 中，与信号处理相关的逻辑将失效。

### 方案二：通过一个特殊参数启动当前程序

fork 子进程仍然通过 `os/exec` 方式启动，但是启动的程序和主进程保持一致，指向完引导逻辑后，调用 `syscall.Exec` 指向其他程序（注意，第三个参数为 `os.Environ()` 以继承环境变量）。

在 Linux 中，大致实现如下：

```go
// 父进程
cmd := &exec.Cmd{
    Path:   "/proc/self/exe", // 先只支持 Linux
    Args:   []string{"tini-go-bootstrap", ...},
    Stdin:  os.Stdin,
    Stdout: os.Stdout,
    Stderr: os.Stderr,
}
err := cmd.Start()

// 子进程
func main() {
    if os.Args[0] == "tini-go-bootstrap" {
        // 引导逻辑
        // ...
        err := syscall.Exec(childPath, os.Args[1:], os.Environ())
        return 
    }
}
```

## 源码

除如上核心问题外，其他部分和 tini C 语言版本差别不大。

Go 语言版本的 tini 已经开源在了 Github 上： [rectcircle/tini-go](https://github.com/rectcircle/tini-go)。
