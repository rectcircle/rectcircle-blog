---
title: "Containerd 详解（四） overlayfs snapshotter"
date: 2023-04-29T12:55:23+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> version: [v1.7.0](https://github.com/containerd/containerd/tree/v1.7.0)

## overlayfs 插件分析

https://dev.to/napicella/what-is-a-containerd-snapshotters-3eo2

https://www.jianshu.com/p/86296691ca49

## 实现自己的 snapshot 插件
