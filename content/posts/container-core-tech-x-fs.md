---
title: "容器核心技术（二） 文件系统"
date: 2022-02-11T20:38:49+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## Linux VFS 概念

## Linux Mount 系统调用

## 容器 Volume 实现原理 —— binding

> k8s 和 docker 的 volume 均适用本章节描述。

## 容器 RootFS 实现原理 —— 联合文件系统

## 容器 Volume 实现容量限制

### 虚拟磁盘 loop

限制K8S Pod 磁盘容量使用的 3 种方法_u012516914的专栏-CSDN博客

### xfs 文件系统（不推荐）

> docker `overlay2.size` 配置基于此原理

https://blog.csdn.net/qq_34556414/article/details/108058302

https://www.xiaoheidiannao.com/28689.html

## 其他常见的文件系统
