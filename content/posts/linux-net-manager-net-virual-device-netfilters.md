---
title: "Linux 网络管理（虚拟网络设备 和 netfilter）"
date: 2022-04-21T00:24:21+08:00
draft: true
toc: true
comments: true
tags:
  - linux
---

## 概述

本文旨在介绍，物理网络设备（路由器/交换机）、虚拟机、容器所依赖的 Linux 网络管理和虚拟网络设备相关技术，以及相关编程接口，

## 实验环境准备

参考：[容器核心技术（一） 实验环境准备 & Linux 概述](posts/container-core-tech-1-experiment-preparation-and-linux-base/#实验环境准备)

## 实验代码库

TODO

## 网络设备概述

Linux 网络设备可以分为物理网络设备和虚拟网络设备，这些网络设备可以通过：`ip addr show` 可以查看：

最常见的物理网络设备为：

* `eth` 物理以太网设备（又称物理网卡），名字一般以 `eth` 开头，如 `eth0`（在 VirtualBox 虚拟机中以 `enp` 开头）。

常见的虚拟网络设备为：

* `lo` 本地回环设备，用于绑定 `127.0.0.1/8` 和 `::1/128`，是一种虚拟设备（本文不做介绍）。
* `bridge` 桥设备，即一个软件实现的交换机或者路由器，名字一般以 `br` 开头，如 `br0`。
* `veth` 虚拟以太网设备。
* `vlan` 虚拟 VLAN 设备。
* `tun/tap` （network TUNnel / network TAP）。

## veth 虚拟设备

TODO 描述

### 示例

#### 说明

#### shell 描述

#### C 语言描述

#### Go 语言描述

## bridge 虚拟设备

https://www.cnblogs.com/jmilkfan-fanguiju/p/10589727.html

## tun/tap 虚拟设备

https://www.kernel.org/doc/html/v5.8/networking/tuntap.html
https://en.wikipedia.org/wiki/TUN/TAP

## vlan 虚拟设备

https://www.linuxjournal.com/article/10821

https://wiki.archlinux.org/title/VLAN

https://pengpengxp.github.io/archive/before-2018-11-10/2017-01-23-Linux%E7%BD%91%E7%BB%9C%E8%AE%BE%E5%A4%87%E7%9B%B8%E5%85%B3%E7%9A%84%E5%A4%A7%E6%9D%82%E7%83%A9.html#orgfbca757

## netfilter 虚拟设备

* [Linux网络 - 数据包的接收过程](https://segmentfault.com/a/1190000008836467)
* [Linux网络 - 数据包的发送过程](https://segmentfault.com/a/1190000008926093)

https://segmentfault.com/a/1190000009249039
https://segmentfault.com/a/1190000009251098
https://segmentfault.com/a/1190000009491002

ip_forward与路由转发  https://blog.51cto.com/13683137989/1880744

主要看 iptable（netfilter）、bridge、veth 原理。

实战按照 ip 命令（iproute2），c 语言库（https://man7.org/linux/man-pages/man7/netlink.7.html）， go 语言（github.com/vishvananda/netlink）库来操作这些设备。

https://morven.life/posts/networking-2-virtual-devices/

nat 端口转发和路由网关 https://blog.jmal.top/s/iptables-nat-port-forwarding-route-gateway
