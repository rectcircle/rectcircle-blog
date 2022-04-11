---
title: "进程管理器（二）单进程管理器 tini 源码分析"
date: 2022-04-05T18:11:53+08:00
draft: true
toc: true
comments: true
tags:
  - linux
---

## tini 简介

[tini](https://github.com/krallin/tini) 是一个超轻量级的 `init` （进程管理器），用作容器的守护进程。

tini 只会做如下事情：

* 生成一个进程（tini 旨在在容器中运行），并一直等待它退出。
* 收割僵尸。
* 执行信号转发。

tini 编译产物只有一个可执行文件，其静态编译版本，没有任何依赖（如 glibc），可以在任何 Linux 发行版中使用。

tini 并不是一个像 systemd 一样的全功能进程管理器，而是一个服务于容器的单进程管理器。一般情况下，服务容器化要求一个容器尽量只做一件事情，即只有一个或一组进程，因此 tini 在容器化场景足够使用了。

## tini 使用

> [README#using-tini](https://github.com/krallin/tini#using-tini)

tini 预装到了 docker 中，在 `docker run` 命令中，可以通过 [`--init`](https://docs.docker.com/engine/reference/commandline/run/) 参数即可无感的使用 tini。通过这种方式，无法使用 `tini` 的一些选项，但在绝大多数场景够用。

也可以吧 tini 直接打包到镜像中。然后配置 `ENTRYPOINT` 为： `["/path/to/tini", "--"]`。（可以添加 `tini` 的一些选项，但是需要在 `--` 的前面，如 `["/path/to/tini", "-vvv", "--"]` 打印更详细的日志）。

更多关于 tini 的选项，参见其 [README](https://github.com/krallin/tini#options)。

## tini 优势

通过 tini 可以避免业务进程重复编写本该由 1 号进程该做的事情，可以帮传统的应用可以无感迁移到容器化部署。

1. 收割意外的产生僵尸进程（如果业务进程作为容器的 1 号进程，且没有 wait 子进程退出，则可能产生僵尸进程）。
2. 接收并转发信号，实现优雅退出（如果业务进程作为容器的 1 号进程，且没有配置信号处理程序，因为 1 号进程的信号的默认行为为：什么都不做，这导致 docker stop 时，发送给该进程的 TERM 信号无法让进程退出）。
3. 从不不使用 tini，切换到使用 tini，是透明的，只需要 docker run 时添加 `--init` 选项，即：
    * 不需要改变镜像
    * 不需要 entrypoint 和 command

> shell 也可以做到如上第一点，但是无法做到第二点。shell 默认的信号处理行为是默认，在 1 号进程中就是忽略，并不会将信号转发给其子进程，因此无法实现 `TERM` 信号优雅退出。更多参见：[What is advantage of Tini?](https://github.com/krallin/tini/issues/8)

## tini 源码分析

> 版本： [v0.19.0](https://github.com/krallin/tini/blob/v0.19.0/src/tini.c)

### 项目结构

tini 是一个 cmake 项目。代码非常简短，只有一个不到 700 行的 `.c` 源代码文件（[tini.c](https://github.com/krallin/tini/blob/v0.19.0/src/tini.c)）。

### 流程概述

tini 在运行时一共有两个进程：主进程和业务进程，由主进程启动业务进程。

TODO 一个流程图图

```
初始化
  |
  |---------------子进程初始化
  | 
主循环
```

### 主进程初始化流程

#### 解析参数

#### 配置信号

#### 配置父进程退出时子进程触发的信号（可选）

#### 将当前进程注册为僵尸收割者（可选）

#### 检查当前进程是否是进程收割者

#### fork 子进程

### 子进程引导阶段流程

### 主进程循环流程

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
