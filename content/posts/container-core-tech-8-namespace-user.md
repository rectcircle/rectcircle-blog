---
title: "容器核心技术（八） User Namespace"
date: 2022-09-19T00:01:00+08:00
draft: true
toc: true
comments: true
tags:
  - 云原生
---

## 背景知识

Linux 所有 Namespace 中最复杂的一部分，在了解 User Namespace 之前，最好前置阅读：[Linux 进程权限](/posts/linux-process-permission/)。

## 描述

User Namespace 实现了对进程权限的隔离，其特点如下所示：

* 关系： User Namespace 之间存在父子关系（换句话说，User Namespace 在宏观上可以看成一棵树，内核限制最多 32 层）。
* 和进程的关系：每一个进程都会关联一个 User Namespace。
* 初始： 在 Linux 系统启动时，内核会创建一个，初始 User Namespace（换句话说，在 Linux 中的普通进程和该初始 User Namespace 中关联）。
* 创建： 使用 `CLONE_NEWUSER` 标志调用 [`clone(2) 系统调用`](https://man7.org/linux/man-pages/man2/clone.2.html) 会创建一个新的 User Namespace （当然 [`unshare(2) 系统调用`](https://man7.org/linux/man-pages/man2/unshare.2.html) 也可以，在此不多赘述）。指的特别说明的是，和其他 Namespace 不同，创建 User Namespace 不需要任何特权（换句话说，任意的用户的进程都可以创建一个新的 User Namespace），该 User Namespace 和其创建时所在 User Namespace 构成父子关系。
* 和 Capabilities 关系：
    * Capabilities 是按 User Namespace 隔离的。
    * 新创建 User Namespace 的进程拥有当前内核所定义的全部的 Capabilities （具体而言，`cat /proc/新创建User Namespace的进程ID/status | grep Cap` 得到的输出是和 `cat /proc/1/status | grep Cap` 一样，其 `CapEff` 都是 `000001ffffffffff`）。
    * 只有拥有该 User Namespace 的 `CAP_SYS_ADMIN` 能力才能通过 [`setns(2) 系统调用`](https://man7.org/linux/man-pages/man2/setns.2.html) 加入该 User Namespace，加入后该进程将拥有当前内核所定义的全部的 Capabilities。
    * 在一个 User Namespace 中，[`execve(2) 系统调用`](https://man7.org/linux/man-pages/man2/execve.2.html) 会重新计算 Capabilities，参见：[Linux 进程权限](/posts/linux-process-permission/)。
    * 另一个 User Namespace 进程是否拥有某 User Namespace 的 Capabilities：
        * 如果一个进程在该 User Namespace 中拥有的 Capabilities，则同样拥有子孙 User Namespace 对应的 Capabilities （比如初始 User Namespace 的 root 进程同样拥有其他所有 User Namespace 的所有 Capabilities）。
        * 父 User Namespace 中创建该子 User Namespace 的有效用户 ID，会被设置为该子 User Namespace 的所有者，因此父 User Namespace 中具有同样有效用户 ID 的进程将具有该子 User Namespace 的全部的 Capabilities。
* 和其他 Namespace 的关系：
    * 其他 Namespace 会和其创建时的 User Namespace 关联（所有者），这意味着，拥有该 User Namespace 对应的 Capabilities 的进程就有权限操纵这些其他 Namespace 的资源。
    * 在使用 [`clone(2) 系统调用`](https://man7.org/linux/man-pages/man2/clone.2.html) 或 [`unshare(2) 系统调用`](https://man7.org/linux/man-pages/man2/unshare.2.html)  创建其他 Namespace 时，如果有 `CLONE_NEWUSER` 标志，则内核会先创建出 User Namespace，然后再创建其他的 Namespace。然后，这些其他的 Namespace 和这个刚刚创建的 User Namespace 关联。
* 非初始 User Namespace 进程的说明和限制：
    * 有些系统调用操作的资源并没有对应的 Namespace 进行隔离，因此只能在初始 User Namespace 中可以调用如：
        * 更改系统时间 （`CAP_SYS_TIME`）
        * 加载内核模块 （`CAP_SYS_MODULE`）
        * 创建块设备 （`CAP_MKNOD`）
    * 当一个非初始 User Namespace 关联了一个 Mount Namespace 时，该进程即使拥有 `CAP_SYS_ADMIN` 也只允许 mount 如下文件系统：
        * `/proc` (since Linux 3.8)
        * `/sys` (since Linux 3.8)
        * `devpts` (since Linux 3.9)
        * `tmpfs(5)` (since Linux 3.9)
        * `ramfs` (since Linux 3.9)
        * `mqueue` (since Linux 3.9)
        * `bpf` (since Linux 4.4)
        * `overlayfs` (since Linux 5.11)
    * 当一个非初始 User Namespace 关联了一个 Cgroup Namespace 时，该进程拥有 `CAP_SYS_ADMIN`，自 Linux 4.6 起，将允许 mount Cgroup v1 和 v2 的文件系统。
    * 当一个非初始 User Namespace 关联了一个 PID Namespace 时，该进程拥有 `CAP_SYS_ADMIN`，自 Linux 3.8 起，将允许 mount /proc 文件系统。
    * 注意，mount 基于块的文件系统时，只允许拥有 `CAP_SYS_ADMIN` 的初始 User Namespace 操作。
* TODO 父子 User Namespace 身份 ID 映射

## 实验

### 实验设计

### Go 源码

### 输出分析

## 总结

### Linux User Namespace 关系图

进程是核心，User Namespace 之间、User Namespace 和 其他 Namespace、User Namespace 和 Caps、User Namespace 和 UserID、User Namespace 和 文件系统。

### Linux 系统调用权限校验流程

通过对 Linux 进程的用户身份、Capabilities 以及 User Namespace 的了解。

可以看出，Linux 内核判断某进程对某个系统调用是否有权限的逻辑如下所示：

## 应用场景

## 参考

https://www.junmajinlong.com/virtual/namespace/user_namespace/

rootless

* https://rootlesscontaine.rs/
* https://docs.docker.com/engine/security/rootless/
* https://developer.aliyun.com/article/700923
