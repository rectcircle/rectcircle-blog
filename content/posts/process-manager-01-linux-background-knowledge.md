---
title: "进程管理器（一） Linux 背景知识"
date: 2022-04-05T18:09:52+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 系列综述

本系列将从 Linux 基础知识起步，并参考 tini 源码，使用 Golang 探索实现一个简单有效的进程管理器。该进程管理器将作为容器的 entrypoint 进程，即容器的 1 号进程，来管理工作进程。

## 本节概述

在 Linux 中实现一个可用于生产环境的 1 号进程并不容易，主要需要考虑如下问题：

* 信号处理和转发
* 收割子进程
* 终端设备（tty）、会话和进程组管理
* 正确的设置工作进程的权限

本章节主要参考：

* 书籍 APUE （即《Unix 环境高级编程》） 第三版
* [Linux Manual 站点](https://man7.org/)

注意：本文主要以 Linux 为例阐述，不保证其他兼容 POSIX 标准的操作系统（Linux、MacOS 均是、Windows 不是）有同样的能力。

## 进程

### 进程和进程树

* 在 Linux 中，每个用户态进程都有一个父进程（1 号进程除外，1 号进程的父进程是 内核进程即 0 号进程），这样就构成了一颗根节点为 1 号进程的树。
* 当进程 a 创建了进程 b，此时进程 a 是进程 b 的父进程，进程 b 是进程 a 的子进程。
* 每一个进程都有一个唯一标识 ID （即 PID），该 ID 在进程退出之前永远不变。

### 进程的两个阶段

进程的创建是以 `fork` 系统调用返回 0 作为起始的，而程序的执行是以 `exec` 系统调用载入于一个程序开始。在本系列，我们将定义：

* `fork` 到当前进程的最后一次 `exec` 之间称为：引导阶段。
* 当前进程的最后一次 `exec` 之后称为：执行阶段。

```
进程

fork ---> exec ---> exec ... ---> exec --->  exit
 |                                |  |        |
  --------------------------------    ————————
                  |                       |
                  v                       v
               引导阶段                  执行阶段
```

编写普通程序时，一般是 fork 之后 立即 exec，因此，引导阶段什么都不做。

但是在编写一个进程管理器场景，区分这两个阶段非常重要。因为，进程管理器需要在引导阶段对当前进程进行一些配置工作。

### 进程和权限

在 Linux 操作系统中，多数发行版的进程管理器是 systemd，作为进程管理器，其一般以 root 权限运行。当我们使用安装一个 mysql server 后，其是以 mysql 用户运行的，systemd 是如何实现的呢？

Linux 提供了一个 `setuid/setgid` 的系统调用，当 root 权限（`CAP_SYS_ADMIN` 权限）的进程调用时，将会将该进程的 uid 和 gid 设置为指定的用户和组。因此就实现了权限降级，以实现最小化权限的要求。

**扩展知识（和本系列无关，仅做分享）：权限升级**

上文提到了权限通过 `setuid/setgid` 即可实现权限降级，但是如何实现权限升级呢？比如一个没有 root 的进程如何以 root 的身份执行一个程序（比如 sudo、su 命令可以创建一个拥有 root 权限的 shell 进程）。

Linux 在文件系统层面，为可执行文件提供了一种称为 设置用户/组 id 位的特性，当一个文件的属性中启用了 设置用户/组 id 位。那么一个进程使用 `exec` 系统调用执行该程序时，该程序的权限将变为这个可知执行文件的所属用户和所属组。

因此，一个具有 设置用户/组 id 位 的程序需要自行实现对用户的身份验证，以保证系统安全。

关于此，更多参见： 《APUE》第 4.4、8.11 章节

### 进程组

进程组是一个或多个进程的集合。对于一个进程组：

* 有一个进程组 ID（`pgid`），其值是是该进程组组长进程的进程 ID。

关于进程组的系统调用主要有：

* `pid_t getpgrp(void)` 系统调用获取当前进程所属的进程组 ID。
* `pid_t getpgid(pid_t pid)` 系统调用可以获取指定进程的进程组 ID `getpgid(0)` 等价于 `getpgrp()`。
* `int setpgid(pid_t pid, pid_t pgid)` 可以将一个进程加入一个现有的进程组，或者创建一个新的进程组且当前调用进程作为进程组组长（`setpgid(0, 0)`）。`pid` 参数只能是 0 （当前进程）、当前进程 id、子进程 id（孙子进程不行）。

进程组主要有如下几个作用：

* 通过 `kill` 系统调用，给一个进程组下的所有进程发送信号。
* 通过 `waitpid` 系统调用，等待该进程组中的孩子进程改变状态。
* 在一个会话中：
    * 前台进程组中的所有进程都可以读写终端（通过标准 IO）。
    * 终端产生的信号会发送到前台进程组中的所有进程。

进程管理器需要为其管理的进程，在其引导阶段，创建一个进程组，这样做的目的是：通过进程组可以将信号转发给该进程组中的所有信号。

### 会话

会话是一个或多个进程组的集合。对于一个会话：

* 有一个会话首进程，该进程是的进程 id 为 `sid`，属于为会话首进程 id，或会话 ID。
* 有一个前台进程组（关联终端后才有此概念）
* 有 0 个或多个后台进程组（关联终端后才有此概念）

关于会话的系统调用主要有：

* `pid_t setsid(void)` 系统调用 创建一个新的会话。调用的进程必须**不**是一个进程组的组长。调用后，将发生如下事情：
    * 创建一个新的会话，该进程是该会话中的第一个进程即会话首进程，其进程 id 为该会话的会话 id （`sid`）。
    * 同步为该进程创建一个进程组，该进程为该进程组的组长，该进程的进程 id 为该进程组的进程组 id。
    * 该进程和调用之前的终端的联系将被切断（即标准 IO 不再指向终端设备）。
* `pid_t getsid(pid_t pid)` 获取当前进程的 sid。
    * pid 为 0 时，获取当前进程的 sid。
    * pid 为非 0 时，只有 pid 在当前进程所在的 sid 中时才会返回正确结果。

会话主要最终要的作用是：和一个终端关联，即标准 IO 关联的终端是哪一个，这个与会话关联的终端称为该会话的控制终端。当然一个会话也可以不和终端关联，这种场景比较少见，一般传统的 Unix Daemon 程序 才会这么做。

进程管理器可以考虑为其管理的每个进程创建一个会话，并分配一个终端（伪终端），以更好的管理这些进程的日志（标准输出），这设计终端相关内容，参见下文终端小节。

### 扩展知识：孤儿进程组

定义为：某进程组存在一个进程的其进程的父进程不是改进程组的成员，也不是该会话的其他进程组的成员。

造成存在一个进程组变为孤儿进程组的原因一般是：进程组组长退出，而孩子还活着。

面对新晋孤儿进程组，内核会向该进程组的每一个处于停止状态的进程发送 SIGHUP 信号，然后再发送 SIGCONT 信号。

## 终端

终端 (tty, Teletype, Teletypewriter, Teleprinter) 是对一套输入输出设备的抽象，在 Linux 中，终端有字符终端和图形终端。在小节讨论的是字符终端，不会涉及图形终端相关内容。

关于终端历史演进，推荐阅读：[探索终端的历史渊源](/posts/terminal-history/)

我们通过 xterm、iterm2 以及 ssh 连接到 server 中，获取的一个 shell 时，这个 shell 进程就关联了一个终端，shell 运行的进程也可以在该终端中获取输入打印输出。因此，每一个终端是被多个进程共享的资源，因此为了让各个进程合理的使用终端，产生了会话、控制终端、会话首进程、前台进程组、后台进程组等概念。

* 在应用程序中，我们一般不会感知到终端的原因，Linux 已经把终端抽象成，我们熟知的标准 IO 了。
* 当我们使用 shell 执行命令时，此时 shell 和正在运行的命令所在进程都和这个终端关联，也就是说，一个终端可以关联多个进程。与同一个终端关联的进程组被称为个：**会话**。而这个和会话关联终端被称为会话的**控制终端**，创建了该会话的进程被称为**会话首进程**。
* 当我们通过快捷键发送特殊字符时，正在运行的进程可以收到相关信号，此外只有我们输入回车，正在运行的程序才能通过标准 IO 读取到输入的数据。这说明在用户输入内容并不是直接传递到进程中的标准 IO 中的，而是在用户输入流和进程标准 IO 之间存在一套处理逻辑，来实现上述内容，这个程序被称为：**终端行规程**，能接收这些信号进程组称为：**前台进程组**。
* 当我们通过 `命令 &` 方式可以创建一个进程，这个进程就会在后台运行，从而不能获取到标准输入，不会接收到信号，但是仍然会向终端输出内容。这种进程所在的进程组称为：**后台进程组**。

终端、会话、前后台进程组、会话首进程关系如下图所示（来自 APUE）。

![image](/image/pg-session-ctty.png)

在当代终端已经没有专门的物理设备了，一般通过伪终端（pty）相关系统调用通过编程创建一个虚拟终端。

```
用户 <------> 电传打字机/终端硬件设备产生的信号 <-----------> 终端设备驱动 <-------------------------------> 终端行规程（内核） <------> 进程的标准 IO
 ‖                        ‖                                   ‖                                          ‖                       ‖
 ‖                        ‖                                   ‖                                          ‖                       ‖
 ‖                        ‖                                   ‖                                          ‖                       ‖
 ‖                        ‖                                   ‖                                          ‖                       ‖
用户 <------> 任意可以转换为 IO 流的东西（如网络IO） <------> 伪终端主设备（进程 A）<---> 伪终端从设备 <------> 终端行规程（内核） <------> 进程的标准 IO（进程 B）
```

上述模型进程 A 和进程 B 的核心系统调用为：

* 进程 A
    * `int posix_openpt(int oflag)` 创建一个伪终端主设备，返回伪终端主设备文件描述符。
    * `int grantpt(int fd)` 更改从设备的权限（fd 参数为伪终端主设备文件描述符）
    * `int unlockpt(int fd)` 允许打开伪终端从设备（fd 参数为伪终端主设备文件描述符）
    * `char *ptsname(int fd)` 返回该伪终端从设备的文件名（fd 参数为伪终端主设备文件描述符）
    * `fork` 子进程 B
* 子进程 B
    * `int setsid()` 设置新的会话
    * `int open(char *name, int flag)` 使用普通的 IO 函数打开伪终端从设备
    * 可选的 `tcsetattr` 设置终端属性
    * 可选的 `ioctl` 设置终端窗口尺寸
    * `dup2` 将伪终端分配给标准输入、标准输出、标准出错文件描述符
    * `exec` 执行程序

关于终端和前后台进程组、会话首进程的系统调用主要有：

* `pid_t tcgetpgrp(int fd)` 返回 fd 指向终端的关联的前台进程组 id （fd 一般为 0 标准输入）。
* `int setpgrp(int fd, pid_t pgrpid)` 更改 fd 指向终端的关联的前台进程组 id 为 `pgrpid` （fd 一般为 0 标准输入，pgrpid 一般为 `getpgrp` 返回值，即当前进程所在进程组 id）。
* `pid_t tcgetsid(int fd)` 返回 fd 指向终端的会话首进程。

## 信号

### 信号概念

#### 信号处理的三种行为

#### 信号处理函数调用

真正的异步性（比多线程还早的一种异步性） 和 函数可重入（并发问题） 和 sleep 问题 和 中断系统调用（自动重启）

### 信号集

### 信号异步处理

#### Signal 函数

不可靠语义，有效一次（早期是这样的）

#### sigaction 函数

* 可靠语义，一直有效
* 可实现异步串行化

### 信号同步处理

* sigwait & sigtimedwait https://pubs.opengroup.org/onlinepubs/009604499/functions/sigwait.html
* sigsuspend

### 信号继承

### 常见信号说明

#### 作业控制信号

## shell 原理

https://github.com/krallin/tini/issues/8

## 备忘

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
