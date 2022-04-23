---
title: "通过和 IPv4 对比，学习 Ipv6 "
date: 2022-04-23T20:01:00+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 背景知识

### 网络分层

### 网络接口 和 Mac 地址

MAC 地址（单播、组播、广播地址分类） https://blog.csdn.net/zhagzheguo/article/details/90549369

### 同一个网络

## IPv6 和 IPv4 对比概述

https://datatracker.ietf.org/doc/html/rfc8200
https://datatracker.ietf.org/doc/html/rfc2460

https://en.wikipedia.org/wiki/IPv6
https://zh.wikipedia.org/wiki/IPv6

https://zhuanlan.zhihu.com/p/71684181
https://www.ibm.com/docs/zh/i/7.2?topic=6-comparison-ipv4-ipv6
http://www.ha97.com/2842.html

https://zhuanlan.zhihu.com/p/64598841
https://zhuanlan.zhihu.com/p/67843942
https://zhuanlan.zhihu.com/p/79633456

## 报文格式

https://zhuanlan.zhihu.com/p/39465282

https://zhuanlan.zhihu.com/p/108279511

## 组播

http://www.h3c.com/cn/d_200803/336046_30003_0.htm

* ipv4 组播 https://support.huawei.com/enterprise/zh/doc/EDOC1100105907
* ipv6 组播 https://blog.51cto.com/u_7658423/1337745 https://www.cnblogs.com/mysky007/p/11261559.html
* Mac 和 IP 组播地址转换 https://blog.csdn.net/Johan_Joe_King/article/details/105566111

## 地址解析

* IPv4 是 arp 协议，https://www.cnblogs.com/juankai/p/10315957.html，工作在数据链路层，基于 mac 地址广播。
* IPv6 是 NDP (ICMPv6) 协议，工作在网络层，原理是组播 https://blog.51cto.com/u_7658423/1337745。

https://zhuanlan.zhihu.com/p/451627391

https://zhuanlan.zhihu.com/p/79633456

##
