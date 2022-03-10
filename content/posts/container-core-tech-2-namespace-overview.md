---
title: "容器核心技术（二） Namespace 概览"
date: 2022-03-10T22:30:01+08:00
draft: false
toc: true
comments: true
tags:
  - 云原生
---

## 全局系统资源

操作系统的一个主要作用就是将硬件抽象成一个个可以操作的资源给上层应用使用。这些资源可以简单分为两类：

* 独占资源：如页表、内存空间（堆、栈）、寄存器、CPU 时间片等，这些资源的是按照进程隔离，在进程看来这些资源都是自己独占的。
* 全局资源：如网络、文件系统、设备等，这些资源的特性是在进程间共享的，不同进程的操作会影响到其他进程。

全局系统资源给进程带来相互通讯协调的能力，但是也带来一些问题，即进程间相互影响。

## Namespace 列表

而 Namespace 就是 Linux 提供的一种对全局系统资源进程分组隔离的机制，即：同一个 Namespace 的进程看到的全局系统资源是共享的，而不同 Namespace 的进程全局系统资源是隔离的。截止到 Linux Kernel 5.6，Linux 提供了 8 种[全局资源的 Namespace](https://man7.org/linux/man-pages/man7/namespaces.7.html#DESCRIPTION) ：

| Namespace | Flag | man 手册 | 内核版本 | 说明 |
|-----------|-----|----------|------|-----|
| Mount | CLONE_NEWNS | [mount_namespaces(7)](https://man7.org/linux/man-pages/man7/mount_namespaces.7.html) | Kernel 2.4.19, 2002 | 挂载命名空间（mount namespaces），隔离挂载点等信息，子挂载命名空间的挂载不会向上传递到父挂载命名空间，是 Linux 内核历史上第一个命名空间的概念。|
| UTS | CLONE_NEWUTS | [uts_namespaces(7)](https://man7.org/linux/man-pages/man7/uts_namespaces.7.html) | Kernel 2.6.19, 2006 | Unix 主机命名空间（UTS namespaces, UNIX Time-Sharing），隔离主机名与域名等信息，不同的 UTS 命名空间可以拥有不同的主机名，在网络上呈现为多个主机。|
| IPC |CLONE_NEWIPC | [ipc_namespaces(7)](https://man7.org/linux/man-pages/man7/ipc_namespaces.7.html) | Kernel 2.6.19, 2006 | 进程间通信命名空间（IPC namespaces, Inter-Process Communication），隔离 System V IPC，不同 IPC 命名空间中的进程不能使用传统的 System V 风格的进程间通信方式，如共享内存（SHM）等。 |
| PID | CLONE_NEWNET | [pid_namespaces(7)](https://man7.org/linux/man-pages/man7/pid_namespaces.7.html) | Kernel 2.6.24, 2008 | 进程 ID 命名空间（PID namespaces），隔离进程的 PID 空间，不同的 PID 命名空间中的 PID 可以重复，互不影响。|
| Network | CLONE_NEWNET | [network_namespaces(7)](https://man7.org/linux/man-pages/man7/network_namespaces.7.html) | Kernel 2.6.29, 2009 | 网络命名空间（network namespaces），虚拟化一个完整的网络栈，每个网络栈拥有一套完整的网络资源，包括网络设备（interfaces）、路由表与防火墙等。与其他命名空间不同，网络命名空间没有层次结构，所有的网络命名空间互相独立，每个进程只能属于一个网络命名空间，并且网络命名空间在没有进程属于它的时候不会自动消失。|
| User | CLONE_NEWUSER | [user_namespaces(7)](https://man7.org/linux/man-pages/man7/user_namespaces.7.html) | Kernel 3.8, 2013 | 用户命名空间（user namespaces），隔离用户与组信息，子用户命名空间中的每个用户和组（UID / GID）均映射到父用户命名空间中的一个用户和组，提供一种更好的权限隔离方式。通过将容器中的 root 用户映射到主机上的一个非特权用户，可以提升容器的安全性，这也是 LXC / LXD 实现「非特权容器」的方法。|
| Cgroup | CLONE_NEWCGROUP | [cgroup_namespaces(7)](https://man7.org/linux/man-pages/man7/cgroup_namespaces.7.html) | Kernel 4.6, 2016 |  Cgroup 命名空间，类似 chroot，隔离 cgroup 层次结构，子命名空间看到的根 cgroup 结构实际上是父命名空间的一个子树。|
| Time | CLONE_NEWTIME | [time_namespaces(7)](https://man7.org/linux/man-pages/man7/time_namespaces.7.html) | Kernel 5.6, 2020 | 系统时间命名空间，与 UTS 命名空间类似，允许不同的进程看到不同的系统时间。|

## 系统调用和命令

Namespace 在 Linux 中是进程的属性和进程组紧密相关：一个进程的 Namespace 默认是和其父进程保持一致的。Linux 提供了几个系统调用，来创建、加入观察 Namespace：

* 创建：通过 [`clone(2) 系统调用`](https://man7.org/linux/man-pages/man2/clone.2.html)的 flag 来为**新创建的进程**创建新的 Namespace
* 加入：通过 [`setns(2) 系统调用`](https://man7.org/linux/man-pages/man2/setns.2.html)将**当前线程**（注意当前进程不允许有多个线程）加入某个其他进程的 Namespace（注意：当前进程的权限必须大于加入的进程的 Namespace 即不能发生越权），`docker exec` 就是通过这个系统调用实现的（PID Namespace 是个例外，参见后续文章）
* 创建：通过 [`unshare(2) 系统调用`](https://man7.org/linux/man-pages/man2/unshare.2.html)为**当前进程**创建新的 Namespace（PID Namespace 是个例外，参见后续文章）
* 查看：通过 [`ioctl_ns(2) 系统调用`](https://man7.org/linux/man-pages/man2/ioctl_ns.2.html)来查看命名空间的关系（主要是 user namespace 和 pid namespace）

除了系统调用外，Linux 也提供了响应的命令来创建、加入 Namespace：

* 创建：通过 [`unshare(1) 命令`](https://man7.org/linux/man-pages/man1/unshare.1.html)启动一个进程，然后再为该进程，创建新的 Namespace（PID Namespace 是个例外，参见后续文章），该命令的实现为：先调用 [`unshare(2) 系统调用`](https://man7.org/linux/man-pages/man2/unshare.2.html)，然后 **`exec`** 执行命令
* 加入：通过 [`nsenter(1) 命令`](https://man7.org/linux/man-pages/man1/nsenter.1.html)启动一个进程，然后再将该进程，加入一个 Namespace（PID Namespace 是个例外，参见后续文章），该命令的实现为：先调用 [`setns(2) 系统调用`](https://man7.org/linux/man-pages/man2/unshare.2.html)，然后 **`fork-exec`** 执行命令

## 官方手册

关于 Namespace 的描述，Linux 手册非常详细的手册说明：

* [namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html) - 整体描述
* [mount_namespaces(7)](https://man7.org/linux/man-pages/man7/mount_namespaces.7.html)
* [uts_namespaces(7)](https://man7.org/linux/man-pages/man7/uts_namespaces.7.html)
* [ipc_namespaces(7)](https://man7.org/linux/man-pages/man7/ipc_namespaces.7.html)
* [pid_namespaces(7)](https://man7.org/linux/man-pages/man7/pid_namespaces.7.html)
* [network_namespaces(7)](https://man7.org/linux/man-pages/man7/network_namespaces.7.html)
* [user_namespaces(7)](https://man7.org/linux/man-pages/man7/user_namespaces.7.html)
* [cgroup_namespaces(7)](https://man7.org/linux/man-pages/man7/cgroup_namespaces.7.html)
* [time_namespaces(7)](https://man7.org/linux/man-pages/man7/time_namespaces.7.html)

## 实验说明

后续文章，将以 Go 语言、 C 语言、Shell 命令三种形式，来介绍这些 Namespace。实验环境说明参见：[容器核心技术（一） 实验环境准备 & Linux 基础知识](/posts/container-core-tech-1-experiment-preparation-and-linux-base)
