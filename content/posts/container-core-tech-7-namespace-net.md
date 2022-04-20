---
title: "容器核心技术（七） Network Namespace"
date: 2022-04-19T22:00:00+08:00
draft: true
toc: true
comments: true
tags:
  - 云原生
---

> 手册页面：[network namespaces](https://man7.org/linux/man-pages/man7/net_namespaces.7.html)。

## 背景知识

* ip setns 原理（重要） http://www.hyuuhit.com/2019/03/23/netns/#netns-%E5%88%9B%E5%BB%BA
    * https://www.hyuuhit.com/2018/04/05/network-device-list/#rtnetlink
    * http://www.hyuuhit.com/2018/08/22/netlink/
    * ip link 相关，将一个 veth 设备加入一个 namespace https://man7.org/linux/man-pages/man8/ip-link.8.html
* 核心概要文档：https://man7.org/linux/man-pages/man7/net_namespaces.7.html
* 核心设备和原理
    * veth https://man7.org/linux/man-pages/man4/veth.4.html
    * netfilter
        * https://zhuanlan.zhihu.com/p/223038075
        * https://opengers.github.io/openstack/openstack-base-netfilter-framework-overview/#bridge%E4%B8%8Enetfilter
* ip 命令 https://man7.org/linux/man-pages/man8/ip.8.html
* ip netns 相关 https://man7.org/linux/man-pages/man8/ip-netns.8.html
* ip table https://man7.org/linux/man-pages/man8/iptables.8.html
* 使用 ip 模拟 docker 网络
    * https://www.zhaohuabing.com/post/2020-03-12-linux-network-virtualization/
    * https://www.cnblogs.com/yezhh/p/11248897.html
    * https://zhuanlan.zhihu.com/p/199298498
* 书籍
    * https://github.com/xianlubird/mydocker/blob/master/run.go （网络初始化在父进程中执行）
    * https://weread.qq.com/web/reader/a8932240721e42b5a89f479ka5b325d0225a5bfc9e0772d
    * go 语言库 github.com/vishvananda/netlink

## 描述

## 实验

### 实验设计

### 源码

#### C 语言描述

#### Go 语言描述

#### Shell 描述

### 输出及分析

* bridge
* vlan
* tun/tap
* veth

https://leon-wtf.github.io/distributed%20system/2020/10/11/docker-kubernetes-network-model/
https://www.kubernetes.org.cn/6908.html
https://segmentfault.com/a/1190000040860373
