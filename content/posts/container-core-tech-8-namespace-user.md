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

### 能力 (Capabilities)

### User Namespace 嵌套

### 非初始 User Namespace 能力的限制

### User Namespace 和其他 Namespace 的关系

其他的 Namespace 基本上都是相互独立的。而 User Namespace 不同，其他的 Namespace 在内核中，会关联一个 User Namespace。进程在调用相关系统调用时，内核会先检查 User Namespace 是否匹配，然后再检查进程 Capabilities。

### 父子 User Namespace 映射

## Linux 系统调用权限校验流程

通过对 Linux 进程的用户身份、Capabilities 以及 User Namespace 的了解。

可以看出，Linux 内核判断某进程对某个系统调用是否有权限的逻辑如下所示：

## 实验

### 实验设计

### Go 源码

### 输出分析

## 参考

https://www.junmajinlong.com/virtual/namespace/user_namespace/

rootless

* https://docs.docker.com/engine/security/rootless/
* https://developer.aliyun.com/article/700923
