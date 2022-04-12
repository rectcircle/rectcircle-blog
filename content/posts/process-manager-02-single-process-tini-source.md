---
title: "进程管理器（二）单进程管理器 tini 源码分析"
date: 2022-04-05T18:11:53+08:00
draft: false
toc: true
comments: true
tags:
  - linux
---

## tini 简介

[tini](https://github.com/krallin/tini) 是一个超轻量级的 `init` （进程管理器），被设计作为容器的 1 号进程。

tini 只会做如下事情：

* 生成一个进程（tini 旨在在容器中运行），并一直等待它退出。
* 收割僵尸。
* 执行信号转发。

tini 并不是一个像 systemd 一样的全功能进程管理器，而是一个服务于容器的单进程管理器，只能管理一个进程。一般情况下，服务容器化要求一个容器尽量只做一件事情，即只有一个或一组进程，因此 tini 在容器化场景足够使用了。

tini 编译产物只有一个可执行文件，其静态编译版本，没有任何依赖（如 glibc），可以在任何 Linux 发行版中使用。

## tini 使用

> [README#using-tini](https://github.com/krallin/tini#using-tini)

tini 预装到了 docker ce 发行版中了，在 `docker run` 命令中，可以通过 [`--init`](https://docs.docker.com/engine/reference/commandline/run/) 参数即可无感的使用 tini。虽然此方式，无法使用 `tini` 的一些选项，但在绝大多数场景够用。

也可以吧 tini 直接打包到镜像中。然后配置 `ENTRYPOINT` 为： `["/path/to/tini", "--"]`。（可以添加 `tini` 的一些选项，但是需要在 `--` 的前面，如打印更详细的日志： `["/path/to/tini", "-vvv", "--"]` ）。

更多关于 tini 的选项，参见下文：[解析参数](#解析参数)。

## tini 优势

通过 tini 可以避免业务进程重复编写本该由 1 号进程该做的事情，可以帮传统的应用可以无感迁移到容器化部署。

1. 收割意外的产生僵尸进程（如果业务进程作为容器的 1 号进程，且没有 wait 子进程退出，则可能产生僵尸进程）。
2. 接收并转发信号，以实现优雅退出（如果业务进程作为容器的 1 号进程，且没有配置信号处理程序，因为 1 号进程的信号的默认行为为：什么都不做，这导致 docker stop 时，发送给该进程的 SIGTERM 信号无法让进程退出）。
3. 从不使用 tini，切换到使用 tini，是透明的，只需要 docker run 时添加 `--init` 选项，即：
    * 不需要改变镜像
    * 不需要 entrypoint 和 command

> shell 也可以做到如上第 1 点，但是无法做到第 2 点。shell 默认的信号处理行为是默认，在 1 号进程中就是忽略，并不会将信号转发给其子进程，因此无法实现 `TERM` 信号优雅退出。更多参见：[What is advantage of Tini?](https://github.com/krallin/tini/issues/8)

## tini 源码分析

> 版本： [v0.19.0](https://github.com/krallin/tini/blob/v0.19.0/src/tini.c)

### 项目结构

tini 是一个 cmake 项目。代码非常简短，只有一个不到 700 行的 `.c` 源代码文件（[tini.c](https://github.com/krallin/tini/blob/v0.19.0/src/tini.c)）。

一些功能可以通过一些宏控制是否编译到产物中，本文默认所有的宏均生效，即开启全部特性。

### 流程概述

tini 在运行时一共有两个进程：主进程和业务进程，由主进程启动业务进程。

```
              主进程                                      业务进程
======================================================================================================
初始化:       解析参数
                │
                │
                ↓ 
             配置信号
                │
                │
                ↓
    配置父进程退出时子进程触发的信号
                │
                │
                ↓
      将当前进程注册为僵尸收割者
                │
                │
                ↓
       检查当前进程是否是进程收割者
                │
                │
                ↓
           fork 业务进程
                │
                │───────────────────────────→   引导阶段: 隔离业务进程
                ↓                                             │
循环流程:   等待并转发信号 ─────────────────────                  │
             ↑    │                          ╲                ↓
             │    │                           ╲           恢复信号处理
             │    ↓                            ╲              │
           收割僵尸进程 ←─────────                ╲             │
                │               ╲                ╲            ↓
                │                ╲                 ──────→ 业务程序执行
                ↓                 ╲                           │
               结束                 ╲                          │
                                     ╲                        ↓
                                       ───────────────────── 退出

```

### 主进程初始化流程

#### 解析参数

主要解析，命令行参数和环境变量，在源代码中对应的函数分别是 [`parse_args`](https://github.com/krallin/tini/blob/v0.19.0/src/tini.c#L308) 和 [`parse_env`](https://github.com/krallin/tini/blob/v0.19.0/src/tini.c#L395)。

命令行参数的解析使用 [`getopt` 库函数](https://man7.org/linux/man-pages/man3/getopt.3.html)进行解析。

* `--version`：只有一个 `--version` 参数时，打印版本信息。
* `-v`、 `-vv`、 `-vvv` 影响 tini 打印日志的多少，即日志级别，这些日志到标准输出和标准出错里面。v 越多，打印的约详细。
    * 环境变量 `TINI_VERBOSITY=0`： `FATAL` 级别。
    * 默认： `WARNING` 级别。
    * `-v`： `INFO` 级别。
    * `-vv`： `DEBUG` 级别。
    * `-vvv`： `TRACE` 级别。
* `-h` 打印 usage。
* `-s` 开启子进程收割者，当前进程作为非 1 号进程时，开启了该特性后，该进程的子孙进程变为孤儿进程时，其父进程将变为当前主进程，而不是 1 号进程。
* `-p SIGNAL` 配置父进程结束后，要求内核发送给该进程。
* `-w` 是否打印收割非业务进程的日志。
* `-g` 将信号转发给业务进程组额不是只是业务进程。
* `-e EXIT_CODE` 配置当该业务进程的退出码为指定值时，tini 进程正常退出（退出码为 0），支持配置多个。
* `-l` 打印许可证
* 未知选项：打印 usage

环境变量的解析比较简单，通过 [`getenv` 库函数](https://man7.org/linux/man-pages/man3/getenv.3.html)进行解析，环境变量会覆盖命令参数。

* `TINI_SUBREAPER` 等价于 `-s`，值任意。
* `TINI_KILL_PROCESS_GROUP` 等价于 `-g`，值任意。
* `VERBOSITY_ENV_VAR` 等价于 `-v` (`2`)，`-vv` (`3`)，`-vvv` (`>=4`)，值为整数，`1` 是默认值，`<=0` 表示日志级别设置为 `FATAL`。

#### 配置信号

配置信号，在源码中对应的函数是 [`configure_signals`](https://github.com/krallin/tini/blob/v0.19.0/src/tini.c#L456)。

* 通过 [`sigfillset` 库函数](https://linux.die.net/man/3/sigfillset) 和 [`sigdelset` 库函数](https://man7.org/linux/man-pages/man3/sigdelset.3p.html)，设置一个信号集。这个信号集包含除了 `SIGFPE`, `SIGILL`, `SIGSEGV`, `SIGBUS`, `SIGABRT`, `SIGTRAP`, `SIGSYS`, `SIGTTIN`, `SIGTTOU` 之外的所有信号。
* 通过 [`sigprocmask` 系统调用](https://man7.org/linux/man-pages/man2/sigprocmask.2.html)，将主进程的信号屏蔽字设置上一步设置的信号集（这些被屏蔽的信号会在[主进程循环流程](#主进程循环流程)，以同步的方式处理），并保存旧的屏蔽字（在[恢复信号处理](#恢复信号处理)步骤会用到）。
* 通过 [`sigaction` 系统调用](https://man7.org/linux/man-pages/man2/sigaction.2.html)，特殊处理 `SIGTTIN` 和 `SIGTTOU` 这两个信号，将这两个信号处理函数设置为忽略，并保存旧的行为（在[恢复信号处理](#恢复信号处理)步骤会用到）。原因在于：
    * 主进程进程不在前台进程组，且主进程会打印一些日志到标准输出中，如果主进程所在的终端配置了 `TOSTOP`，且不禁用 `SIGTTOU` 的话将导致进程停止，这不是期望的行为。
    * 在业务进程中调用 [`tcgetpgrp` 库函数](https://man7.org/linux/man-pages/man3/tcgetpgrp.3.html)让业务进程组设置为前台进程组（下文将解释），此时如果 `SIGTTOU` 没被忽略，则业务进程会被停止。而在父进程中，`SIGTTOU` 被忽略被继承到业务进程中，从而不会出现这个问题。
    * 关于 `SIGTTIN` 的忽略，没有具体原因。可能是 `SIGTTIN` 和 `SIGTTOU` 这两个信号一般都是一起处理的。

#### 配置父进程退出时子进程触发的信号

当命令行参数包含 `-p SIGNAL` 时，使用 `-p` 指定的信号，配置父进程结束后，要求内核发送给主进程信号。源码位于 [643 行](https://github.com/krallin/tini/blob/v0.19.0/src/tini.c#L643)。

该特性，通过 [`prctl` 系统调用](https://man7.org/linux/man-pages/man2/prctl.2.html) 和 `PR_SET_PDEATHSIG` 选项实现。

#### 将当前进程注册为僵尸收割者

命令行参数包含 `-s` 是，则配置主进程称为，子进程收割者。即当，当前进程作为非 1 号进程时，开启了该特性后，该进程的子孙进程变为孤儿进程时，其父进程将变为当前主进程，而不是 1 号进程。在源码中对应的函数是 [`register_subreaper`](https://github.com/krallin/tini/blob/v0.19.0/src/tini.c#L416)。

该特性，通过 [`prctl` 系统调用](https://man7.org/linux/man-pages/man2/prctl.2.html) 和 `PR_SET_CHILD_SUBREAPER` 选项实现。

#### 检查当前进程是否是进程收割者

检查主进程是否是子进程收割者。如果检查不通过，只会打印警告信息，流程继续，而不会失败退出。如下两种情况检查通过：

* 主进程为 1 号进程，通过 [`getpid` 系统调用](https://man7.org/linux/man-pages/man2/getpid.2.html)获取。
* [将当前进程注册为僵尸收割者](#将当前进程注册为僵尸收割者)配置成功.

通过 [`prctl` 系统调用](https://man7.org/linux/man-pages/man2/prctl.2.html) 和 `PR_GET_CHILD_SUBREAPER` 选项可以进行检查。

#### fork 业务进程

经过上述准备，主进程可以 fork 业务进程了。在源码中对应的函数是： [`spawn`](https://github.com/krallin/tini/blob/v0.19.0/src/tini.c#L181)，通过 [fork 系统调用](https://man7.org/linux/man-pages/man2/fork.2.html)实现创建子进程，子进程启动后进入[引导阶段](#业务进程引导阶段流程)，主进程进入[循环流程](#主进程循环流程)。

### 业务进程引导阶段流程

#### 隔离业务进程

为了更好的管理业务进程，需要将业务进程和主进程进行隔离。在源码中对应的函数是： [isolate_child](https://github.com/krallin/tini/blob/v0.19.0/src/tini.c#L150)。主要做了两件事：

* 为业务进程创建一个进程组，当前业务进程为进程组组长。通过 [setpgid 系统调用](https://www.man7.org/linux/man-pages/man2/setpgid.2.html)实现。
* 将当前进程组设置为前台进程组。通过 [`tcsetpgrp` 库函数](https://man7.org/linux/man-pages/man3/tcgetpgrp.3.html) 和 [`getpgrp` 库函数](https://man7.org/linux/man-pages/man3/getpgrp.3p.html) 实现。值得注意的是，当当前会话没有 tty 时，仅仅打印 Debug 日志，而不是报错退出（比如 `docker run` 没有 `-t` 参数场景）。

#### 恢复信号处理

由于主进程对信号进行了操作，因此需要在执行业务程序之前进行恢复。在源码中对应的函数是：[restore_signals](https://github.com/krallin/tini/blob/v0.19.0/src/tini.c#L131)。

* 恢复信号屏蔽字。通过 [`sigprocmask` 系统调用](https://man7.org/linux/man-pages/man2/sigprocmask.2.html)实现。
* 恢复 `SIGTTIN` 和 `SIGTTOU` 的处理函数为之前的行为。通过 [`sigaction` 系统调用](https://man7.org/linux/man-pages/man2/sigaction.2.html)实现。

### 业务进程执行阶段

通过 [`execvp` 库函数](https://man7.org/linux/man-pages/man3/exec.3.html) 启动业务程序，进入执行阶段。

### 主进程循环流程

主进程进入一个死循环，主要做如下两件事情：

#### 等待并转发信号

等待并转发其他进程发送的信号（如 docker stop 发送 `SIGTERM` 信号，如业务进程退出信号 `SIGCHLD`），在源码中对应的函数是 [`wait_and_forward_signal`](https://github.com/krallin/tini/blob/v0.19.0/src/tini.c#L501)。

首先，通过 [`sigtimedwait` 系统调用](https://man7.org/linux/man-pages/man2/sigwaitinfo.2.html) 系统调用，非阻塞的递送未决状态的信号（超时 1 秒钟）。如果在此期间如果没有收到信号，则返回。否则：

* 如果收到的是 `SIGCHLD` 信号，则啥也不做，返回。
* 如果收到了其他信号，则将信号发送给业务进程组/进程，具体发送给进程组还是进程，由是否传递了命令行参数 `-g` 决定。返回。

#### 收割僵尸进程

收割僵尸进程，在源码中对应的函数是 [`reap_zombies`](https://github.com/krallin/tini/blob/v0.19.0/src/tini.c#L541))。

该函数，在一个死循环中。在该死循环中：

1. 通过 [`waitpid` 系统调用](https://man7.org/linux/man-pages/man2/wait.2.html)配合 `WNOHANG` 标志，非阻塞的收割僵尸进程。
2. 如果，主进程没有子进程，此时说明业务进程已经退出了，因此**子进程退出码**指针被设置了，结束循环，返回。
3. 如果，没有收割到僵尸进程，打印日志，结束循环并返回。
4. 如果，当收割到僵尸进程时：
    1. 当收割到的进程不是业务进程时，打印日志，继续死循环，跳转到步骤 1。
    2. 当收割到的进程是当前业务进程，指向完如下操作后，继续死循环，跳转到步骤 1：
       1. 通过 `WIFEXITED` 宏获取到子进程是否是自己退出的，如果是，则设置**子进程退出码指针**指向的的值为业务进程的退出吗（通过 `WEXITSTATUS` 宏获取）。
       2. 通过 `WIFSIGNALED` 宏获取到当前进程是否是因为默认行为为终止的信号而退出，如果是，设置**子进程退出码指针**指向的值设置为 `(128 + 触发信号) % 256`（触发的信号通过 `WTERMSIG` 宏获取）。如果用户命令行参数配置的 `-e EXIT_CODE` 和**子进程退出码指针**指向的值相同，则将 **子进程退出码指针**指向的值设置为 0。
       3. 其他情况，异常退出。

#### 主进程流程结束

收割僵尸进程函数存在一个传出参数 **子进程退出码指针** 如果被设置了，则流程结束，退出码为 **子进程退出码指针** 指向的值。
