---
title: "轻量级 Linux 工具"
date: 2022-02-15T00:30:49+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

* busybox (`docker run -it busybox` /bin 路径下，全部是硬链接)
    * https://busybox.net/screenshot.html
* jq (静态链接版，`make LDFLAGS=-all-static`)
    * https://github.com/stedolan/jq
* dropbear 轻量级 SSH （静态链接版）
    * https://matt.ucc.asn.au/dropbear/dropbear.html
    * https://github.com/mkj/dropbear/blob/master/INSTALL
