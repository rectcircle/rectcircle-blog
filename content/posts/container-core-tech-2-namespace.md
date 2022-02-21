---
title: "容器核心技术（二） Namespace"
date: 2022-02-11T20:38:01+08:00
draft: true
toc: true
comments: true
tags:
  - 云原生
---


## 概述

在编写程序时，多数场景都是在对操作系统提供的资源进行操作。这些资源按照隔离性，可以分为进程独占资源以及全局系统资源。

进程独占资源的例子有：页表以及虚拟内存、CPU 时间片、寄存器等。这些资源的特性就是，不同进程只能操作自身的资源，进程与进程之间是隔离的。

而全局系统资源恰恰相反，全局系统资源的特性是，不同进程间是共享的，不同进程的操作会影响到其他进程。全局系统资源的例子有：文件系统、网络接口等。

全局系统资源给进程带来相互通讯协调的能力，但是也带来一些问题，即进程间相互影响。

而 Namespace 就是 Linux 提供的一种对全局系统资源进程分组隔离的机制，即：同一个 Namespace 的进程看到的全局系统资源是共享的，而不同 Namespace 的进程全局系统资源是隔离的。截止到 Linux Kernel 5.6，Linux 提供了 7 种[全局资源的 Namespace](https://man7.org/linux/man-pages/man7/namespaces.7.html#DESCRIPTION) ：

```
       Namespace Flag            Page                  Isolates
       Cgroup    CLONE_NEWCGROUP cgroup_namespaces(7)  Cgroup root
                                                       directory
       IPC       CLONE_NEWIPC    ipc_namespaces(7)     System V IPC,
                                                       POSIX message
                                                       queues
       Network   CLONE_NEWNET    network_namespaces(7) Network
                                                       devices,
                                                       stacks, ports,
                                                       etc.
       Mount     CLONE_NEWNS     mount_namespaces(7)   Mount points
       PID       CLONE_NEWPID    pid_namespaces(7)     Process IDs
       Time      CLONE_NEWTIME   time_namespaces(7)    Boot and
                                                       monotonic
                                                       clocks
       User      CLONE_NEWUSER   user_namespaces(7)    User and group
                                                       IDs
       UTS       CLONE_NEWUTS    uts_namespaces(7)     Hostname and
                                                       NIS domain
                                                       name
```

Namespace 在 Linux 中是进程的属性和进程组紧密相关：一个进程的 Namespace 默认是和其父进程保持一致的。Linux 提供了几个系统调用，来创建、加入观察 Namespace：

* 创建：通过 [`clone` 系统调用](https://man7.org/linux/man-pages/man2/clone.2.html)的 flag 来为**新创建的进程**创建新的 Namespace
* 加入：通过 [`setns` 系统调用](https://man7.org/linux/man-pages/man2/setns.2.html)将**当前进程**加入某个其他进程的 Namespace（注意：当前进程的权限必须大于加入的进程的 Namespace 即不能发生越权），`docker exec` 就是通过这个系统调用实现的
* 创建：通过 [`unshare` 系统调用](https://man7.org/linux/man-pages/man2/unshare.2.html)为**当前进程**创建新的 Namespace
* 查看：通过 [`ioctl` 系统调用(ioctl_ns)](https://man7.org/linux/man-pages/man2/ioctl_ns.2.html)来查找有关命名空间的信息

下文，将以 Go 语言、 C 语言、Shell 命令三种形式，来介绍这些 Namespace，实验环境为 Debian 11 (Linux 5.10.0-11-amd64 x86_64)。

## UTS Namespace

## 备忘

Namespace C 语言描述 https://xigang.github.io/2018/10/14/namespace-md/
unshare / mount https://segmentfault.com/a/1190000006913509 。
