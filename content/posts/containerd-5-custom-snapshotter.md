---
title: "Containerd 详解（四） 自定义 snapshotter"
date: 2023-04-29T12:55:23+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> version: [v1.7.0](https://github.com/containerd/containerd/tree/v1.7.0)

实现一个可以自定义 append 一个 lower 层的 snapshotter
