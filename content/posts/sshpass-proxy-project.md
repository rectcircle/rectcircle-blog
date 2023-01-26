---
title: "ssh pass proxy 项目"
date: 2023-01-27T00:02:56+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---


## 备忘

* SSH 底层连接默认是 TCP 协议。但是，在现实中，SSH 可以运行在任意提供可靠性保证的底层连接之上。如 OpenSSH Client 的 ProxyCommand 选项可以配置让 SSH 连接运行在任意底层连接。

