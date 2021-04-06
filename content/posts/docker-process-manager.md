---
title: "Docker Container 多进程管理"
date: 2021-04-04T16:48:27+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## Unix 进程相关知识

### PCB 进程控制块

进程在操作系统中内核中的数据结构一般称为 PCB。

操作系统会维护一个 PCB 表，以进行进程管理

### 进程生命周期

> 参考：[博客](https://blog.csdn.net/shmily_cml0603/article/details/70215824)

* 父进程调用 `fork` 创建一个（子）进程，此时子进程在逻辑上就是父进程的一个拷贝（副本、克隆体），不同的是主要是 PCB 的 pid 和 ppid
* 子进程调用 `exec` 系列函数，用新的可执行文件，覆盖从父进程复制（写时拷贝）过来的代码和内存
* 子进程执行可执行文件中的 `main` 函数
* 最终 `main` 函数结束 或 调用 `exit` 系列函数，此时 该进程 的内存等资源将被回收，但是其 PCB 仍在 PCB 表中
* 父进程将收到 `SIGCHLD` 信号，调用 `wait` 系列函数，子进程的 PCB 才会中 PCB 表 中移除

### 父子进程

由进程生命周期可知

* 进程存在父子关系，因此，所有进程可以组成一颗进程树
* 父进程负责子进程的创建和彻底销毁，也就是说
    * 父进程负责创建子进程
    * 子进程死后，父进程必须手动调用 `wait` 系列函数 感知到子进程的死亡状态后，子进程才算彻底死掉

### 孤儿进程

孤儿进程指：创建子进程的那个父进程先于子进程销毁。此时子进程将变为“孤儿进程”。

另一方面，变成孤儿进程的进程的父进程 id 将变成 `1` （注意不是祖父进程），即 `init` 进程

孤儿进程是比较中性的存在。

* 意外情况下（该进程的生命周期应由父进程管理）造成的孤儿进程，会造成资源泄漏问题，
* 某些情况（该进程自己管理自己的生命周期）是正常的进程状态，不会危害系统，某些情况为了防止出现僵尸进程，可能会故意将一个进程通过 fork 两次的方法设置成孤儿进程

### 僵尸进程

僵尸进程和孤儿进程没有任何关系。

僵尸进程指：子进程死掉了，但是父进程没有调用 `wait` 系列函数的进程。

注意，僵尸进程所占用的内存和文件资源已经被回收，僵尸进程占用的是 PCB 表的一个空间。一般情况下，僵尸进程会造成的后果比较有限：

* 占用 PCB 表，有很少的内存开销（可以忽略不计）
* 影响操作系统调度，占用 PCB 表，当 PCB 表到达上限后，将无法创建新进程

### 1 号进程

在 Unix 系统中，1 号进程是一个特殊的进程，是 Unix 系统启动后的，第一个用户进程。其和其他进程不同是：

* 其生命周期和操作系统一样长
* 其会作为所有创建子进程的那个父进程先于子进程销毁的进程的父进程，因此，作为 1 号进程，必须启动处理 `SIGCHLD` 处理孤儿进程变为的僵尸进程
* 1 号进程需要处理信号，将信号下发到子孙进程中，管理子进程的生命周期
* 1 号进程的默认信号处理逻辑为啥也不做

## Docker 容器与进程

### 最佳实践

Docker 的核心能力之一就是进程隔离。因此，通常最佳实践就是一个 Docker 容器只启动一个进程。

但是，现实没有那么理想，某些情况下，一个 Docker 容器需要启动多个进程。

### Docker 容器启动过程

> https://draveness.me/docker/

* 首先，Docker 容器启动会指定一个启动命令。
* Docker 利用 Linux 提供的资源隔离机制创建，为该进程创建隔离的
    * 文件系统（设置为镜像）
    * 网络空间
    * 进程空间（也就是 PCB 列表）
    * 等等
* 运行该进程，在该进程看来，其 进程ID 为 `1`，且各种资源都与外部隔离

### Docker 启动多进程

参考

* [文章 1](https://xcodest.me/docker-init-process.html)
* [文章 2](https://juejin.cn/post/6844903454549229576)
* [文章 3](https://shareinto.github.io/2019/01/30/docker-init%281%29/)

Docker 无法阻止用户在容器内启动多个进程。但是多进程存在一个比较致命的问题，因为 docker 运行指定的命令是运行在 `1` 号进程中的。而 `1` 号进程是一个特殊的进程，是所有孤儿进程的父进程，因此需要处理孤儿进程的僵尸进程。

但是用户指定的程序，不是为 `1` 号进程设计的，如果其产生了大量的子孙进程。此时，考虑如下场景：容器的某些子进程的父进程结束了，其子进程变成了孤儿进程（宿主机的 init 进程），此时该进程就不受 Docker 管理，也就是说即使 Docker rm 也无法杀掉该进程。这样做成十分严重的问题。

为了解决上述问题，Docker 1.11 & Linux 3.14 后，通过 `docker-containerd-shim` 来管理孤儿进程。

此外，如果用户的 `1` 号进程如果没有处理 `SIGCHLD` 信号，挂在 `1` 号进程的孤儿进程退出，在容器运行时产生僵尸进程（虽然会在容器销毁后消失）

另外 多进程 Docker 容器 还存在一个信号问题。当 `1` 号进程接收到信号时，其默认行为就是啥也不做。比如 docker 向 `1` 号进程发送 `SIGTERM`，且如果用户的 1 号进程没有处理该信号，则将什么都不做，导致退出需要在超时时候强制杀死。

### 问题总结

* Docker 1.11 & Linux 3.14 之前，如果 `1` 号进程退出，可能导致脱离 docker 管理的孤儿进程，造成严重的资源问题（应该是一个 bug）
* 孤儿进程挂在 `1` 号进程，然后正常退出，导致在**容器运行时**产生僵尸进程
* 因为 `1` 号进程 内核给予的默认行为为什么都不做和其他进程不一致，这可能导致异常应为

## Docker init 技术选型

* 超轻量级
    * [tini](https://github.com/krallin/tini)
    * [dumb-init](https://github.com/Yelp/dumb-init)
* 轻量级
    * [supervisord](https://github.com/ochinchina/supervisord)
    * [Monit](https://github.com/arnaudsj/monit)
* 重量级
    * systemd

### tini

> [github - star:5.9k](https://github.com/krallin/tini)

能力

* 产生**一个**孩子
* 等待孩子退出
* 消灭僵尸进程
* 信号转发

安装

* Docker 1.13 以上不需要安装
* 其他情况，可以在构建 image 的时候直接安装

使用

* Docker 1.13 以上，使用 --init 执行即可。容器内 ps 可以看出 `1` 号进程为 `/sbin/docker-init -- $要执行的命令`
* 其他情况，在 dockerfile 中指定 `ENTRYPOINT ["/tini", "--", "/docker-entrypoint.sh"]`
* 会话和进程组
    * 默认情况下只会给子进程发送信号
    * `-g` 可以给进程组所有进程发送信号，当编写类似如下命令时需要使用 `docker run krallin/ubuntu-tini sh -c 'sleep 10'`

建议

* 非常轻量级，适合单个启动命令的情况

### dumb-init

> [github - star:4.9k](https://github.com/Yelp/dumb-init)

会话处理

* 不使用 `dumb-init`，一个 sh 接收到信号，将只会有该 sh 退出，sh 的子进程还会继续运行
* 使用 `dumb-init` 后，将会给该会话的进程组内的所有进程发送信号
* 禁用该特性可以使用 `--single-child` 参数

更多参见 github

建议

* 和 tini 类似，二选一即可

### systemd

非常重量级，不是为 Docker 设计的，运行复杂，需要较高的权限，不建议在 Docker 中使用

### monit

> [github - star:389](https://github.com/arnaudsj/monit)

* 定位是，资源监控工具，进程监控只是其一个能力很小的一部分
* 在 Docker 中使用有点大材小用

其他略

### supervisord（推荐）

* [python 版 github - star:6.7k](https://github.com/Supervisor/supervisor)
* [go 版 github - star:2k](https://github.com/ochinchina/supervisord)

本部分以 Go 版本为准， Docker 场景 不推荐使用 Python 版。

#### 简介

* 定位是，轻量级的进程控制工具
* 历史悠久 04 年到如今，官方使用 Python 开发，可以使用无依赖 Go 版本

#### 通用特性

* 支持多配置文件方式配置，即 `[include]`
* 除了支持 CLI 方式管理外，还支持 WebUI 管理
* 支持按优先级方式控制启动顺序

#### Go 版本特性

* 针对后台进程（PID 的场景），Go 版本提供了 [pidproxy](https://github.com/ochinchina/supervisord/issues/170#issuecomment-569487652) 以提供支持
* Go 版本提供了，`depends_on` 以支持启动顺序

#### 更多

* 参考 [README.md](https://github.com/ochinchina/supervisord)
* [官方配置文件文档](http://supervisord.org/configuration.html)
* [博客 1](https://juejin.cn/post/6844903745587773448)
* [博客 2](https://my.oschina.net/u/1471116/blog/3050305)
