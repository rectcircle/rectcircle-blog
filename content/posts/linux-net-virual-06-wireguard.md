---
title: "Linux 网络虚拟化技术（五） Wireguard VPN"
date: 2022-06-19T23:11:00+08:00
draft: true
toc: true
comments: true
tags:
  - linux
---

> 声明：在中文语境下，VPN 被用作突破互联网管控手段的代名词。本文介绍的 VPN 并非这个含义，而是其原意，面向组织的虚拟私有网络。

## 概述

本系列上一篇文章，我们介绍了使用 tun/tap 实现一个简单的 vpn 的示例。在工业界，有很多成熟的商业或开源的 VPN 协议和实现。

传统的 VPN 协议有 OpenVPN、IPSec/L2TP、PPTP，但是这些 VPN 协议相对笨重复杂。

而本文介绍的 Wireguard 是极简、快速、现代的 VPN。据其官网称，其比 IPsec 更快、更简单、更精简和更有用，比 OpenVPN 具有更高的性能。可以运行在嵌入式设备和超级计算机、跨平台支持 Linux、Windows、macOS、BSD、iOS、Android。

选择 Wireguard 作为 VPN 的代表来介绍的另外一个重要原因是，Wireguard 已于 Linux 5.6 (2020) 进入 Linux 内核。

Wireguard 一些关键技术点如下：

* 极简，专注于 VPN 的安全和路由，C 代码据称只有 4000 行 (2020 年)。配置分发管理（秘钥、IP） Wireguard 不关注。
* 工作在 IP 层，IP 数据包加密后通过 UDP 隧道在节点间传输。
* 安全上 Wireguard 在这个流程上每个环节有且只有一种算法，这极大的简化了代码量，符合 Unix 极简哲学，使用者无需关心复杂的安全算法的选择。加密流程类似于 SSH。

## 模型

Wireguard 搭建了一个是由 interface 组成的虚拟网络。在这个网络中所有 interface 的都是对等，对数据包采用相同的处理逻辑。

interface 通过一个 `ini` 格式的配置文件定义，包含：

* 一个 `[interface]` 配置，即当前 interface 自身的属性。
* 多个 `[peer]` 配置，即当前 interface 可以直接感知到的其他 interface。

可以将 Wireguard 网络可视化为一个有向图，则一个 `interface` 配置的 `[interface]` 定义了这个有向图的 node，`[peer]` 定义了这个有向图的边。

![image](/image/wireguard-vpn-base-model.svg)

## 配置

在 Linux 中，Wireguard 配置文件位于 `/etc/wireguard` 目录。配置文件为 `<interface-name>.conf`，如 `/etc/wireguard/wg0.conf`。

正如上文所述，一个 interface 的配置包含两类，`[interface]` 和 `[peer]`。

`[interface]` 核心字段如下：

* `Address`，格式为带有子网后缀的 IP 地址，如 `192.168.96.1/24`，表示当前 interface 绑定的 IP 以及子网。这个字段是 `wg-quick` 识别的字段，用于生成 Linux interface，并配置一个默认路由。
* `PrivateKey`，当前 interface 的私钥，格式为一个 base64 字符串，由 `wg genkey` 命令生成。
* `ListenPort`，默认为 `51820`，监听的 UDP 端口，用于其他的 interface 和当前 interface 建立用于数据交换的 Tunnel。
* 其他字段参见： [wg-quick(8) — Linux manual page](https://man7.org/linux/man-pages/man8/wg-quick.8.html) | [WireGuard 教程：WireGuard 的搭建使用与配置详解 - 2、配置详解 - interface](https://icloudnative.io/posts/wireguard-docs-practice/#interface)

`[peer]` 核心字段如下：

* `PublicKey`，指向 interface 的公钥，格式为一个 base64 字符串，由 `wg pubkey < /path/to/pri-key` 命令生成。
* `AllowedIPs`，指向 interface 允许的 IP，网段格式，多个用逗号分隔，如 `192.168.96.2/32,192.168.31.0/24`。用来实现路由和流量过滤。即：
    * 出流量：经过本 interface 的出数据包的目标 ip 是否在该 IP 列表中，如果在，则出数据包将发到到该 peer 对应的远端 interface 中。
    * 入流量：来自该 peer 对应的 interface 的入数据包 的源 ip 是否在 IP 列表中，如果不在，将丢弃。
* `Endpoint` 可选，指向 interface 的隧道地址，格式为 `ip:port` 或 `domain:port`，域名解析发生在该接口启动的时刻。`port` 为指向 interface 的 `ListenPort` 字段值。
* `PersistentKeepalive` 配置了 `Endpoint` 时，可选配置，表示和 `Endpoint` 心跳间隔。
* 其他字段参见： [wg(8) — Linux manual page](https://man7.org/linux/man-pages/man8/wg.8.html) | [WireGuard 教程：WireGuard 的搭建使用与配置详解 - 2、配置详解 - peer](https://icloudnative.io/posts/wireguard-docs-practice/#peer)

## 流程

将上方模型图，扩充成一个目标为在网络的笔记本和手机可以访问家庭内网任意 ip 的场景：

* 家庭内网 `192.168.31.0/32`，网关 `openwrt`，没有公网 IP。
* 部署一个 VPN 网段 `192.168.96.0/24`。
* 具有公网 ip 的云服务器 `huawei`
* 两台移动设备，分别为笔记本电脑 `mac`，手机 `mi11`。

此时模型图变为：

![image](/image/wireguard-vpn-process.svg)

说明：

* 方块代表 interface， 红色字为 interface 的 Address 字段。
* 从方块出发的线表示该 interface 的 peer 配置，线上的字为 peer 的 `AllowedIPs`，即路由。
* 实线表示配置该 peer 配置了 `Endpoint`，换句话说，实线代表一个 tunnel，这些 interface 一旦 up，这些 tunnel 将根据双方的公私钥自动建立起安全 tunnel。
* 两个 interface 之间可以连通的充分必要条件是：
    * 存在两个相互指向的线（即，两个 interface 需要分别配置指向对方的 peer，目的是双方都配置好公私钥）。
    * 这两个线至少有一个实线（即，网络至少单向可通，需要建立一个 tunnel，用来传输数据）。
* 因为 huawei 设备具有公网 ip，所以 mi11、mac、openwrt 才能有一个实线指向 huawei。

下面分析如下几个场景的数据流：

* mi11 访问 openwrt。
* mi11 访问 nas。
* pc 访问 mac。

## 相关技术

本文至今，并未提到 NAT 穿透等相关技术，因为在 Wireguard 并不关心 NAT。

## 参考

* [官网](https://www.wireguard.com/)
* [wg-quick(8) — Linux manual page](https://man7.org/linux/man-pages/man8/wg-quick.8.html)
* [wg(8) — Linux manual page](https://man7.org/linux/man-pages/man8/wg.8.html)
* [云原生实验室 #WireGuard#](https://icloudnative.io/tags/wireguard/page/2/)
