---
title: "Kubernetes 工作进程高负载退出场景"
date: 2023-05-28T21:40:00+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 场景描述

在 Kubernetes 中，高负载可以分为高 CPU 占用和高内存占用，而 CPU 属于可压缩资源，因此 CPU 占用高并不会影响工作进程的稳定性，而内存属于不可压缩资源，高内存占用可能导致工作进程重启的问题。因此本文不讨论高 CPU 占用的问题，只讨论内存占用高的问题。

此外在云原生领域，一般一个 container 只运行一个工作进程。但是为了更深入的讨论在高负载场景情况，本文假设 pod：

* 包含两个 container：c1 和 c2。
* c1 是主容器，包含2个进程 p1 和 p2，p1 为 1 号进程。该容器的内存资源规格为：
    * request: 1g
    * limit: 2g
* c2 是 sidecar 容器，包含 1 个进程 p3。
    * request: 0.25g
    * limit: 0.5g

## node 空闲且 c1 内存超过 limit

* 常规 runc
    * 分场景
        * p1 > p2 oom kill p1，containerd 重启：p1、p2 均重启。退出码/信号多少？
        * p1 < p2 oom kill p2，p1 仍运行。退出码/信号多少？
    * pod 无异常（ip 不会变化、数据不丢失）。c2 仍运行。
* kata
    * 卡死？

## node 负载高发生驱逐
