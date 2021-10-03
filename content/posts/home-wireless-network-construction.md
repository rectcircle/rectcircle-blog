---
title: "家庭无线组网"
date: 2021-09-30T10:51:17+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 技术和标准

### 互联网标准

#### IEEE 802

目前，工业界/民用的局域网标准是 [IEEE 802](https://en.wikipedia.org/wiki/IEEE_802)。

IEEE 802 定义了 [OSI 网络模型](https://zh.wikipedia.org/zh-hans/OSI%E6%A8%A1%E5%9E%8B)的最底两层：物理层和数据链路层。

目前仍在广泛在使用的协议是：

* IEEE 802.1 - Higher Layer LAN Protocols Working Group 主要包括局域网体系结构、网络互联、网络管理、性能测试
* IEEE 802.3 - [以太网](https://en.wikipedia.org/wiki/Ethernet)
* IEEE 802.11 - Wireless LAN (WLAN) & Mesh (Wi-Fi certification)

#### IETF 标准

IETF 即 互联网工程任务组，制定了一系列互联网相关标准。其最重要的贡献是 [TCP/IP 协议族](https://zh.wikipedia.org/wiki/TCP/IP%E5%8D%8F%E8%AE%AE%E6%97%8F)，其标准以 [RFC 方式](https://en.wikipedia.org/wiki/List_of_RFCs)在互联网上开放。

其关注 OSI 上层相关的定义。对于 OSI 最底两层（物理层和数据链路层），IETF 相关标准只感知到 MAC 地址。

### WIFI 技术

#### 概述

WIFI 是对 IEEE 802.11 相关协议的实现。目前在广泛使用的是，WIFI 4、5、6 三代技术标准。

过去， WIFI 联盟 使用 `IEEE 802.11 xxx` 技术标准来对相关设备进行认证。对与普通用户难以理解和认知。因此，2019 年起，WIFI 现在开始使用世代命令方法：

* WIFI 4 - IEEE 802.11n
* WIFI 5 - IEEE 802.11ac
* WIFI 6 - IEEE 802.11ax

#### WIFI 4 5 6 对比

|  | WIFI 4 | WIFI 5 | WIFI 6 |
|--|--------|--------|--------|
| 协议| IEEE 802.11n | IEEE 802.11ac | IEEE 802.11ax |
| 年份 | 2009 | Ware1 - 2013 / Ware2 - 2016 | 2018+ |
| 频段 | 2.4 GHz / 5 GHz |  5 GHz | 2.4 GHz / 5 GHz |
| 最大频宽 | 40 MHz | 80 MHz / 160 MHz | 160 MHz |
| MCS 范围 | 0-7 | 0-9 | 0 -11 |
| 最高调制 | 64QAM | 256QAM | 1024QAM |
| 单流带宽 | 150 Mbps | 433 / 867 Mbps | 1021 Mbps |
| 最大空间流 | 4*4 | 8*8 | 8*8 |
| MU-MIMO |  | 下行 | 上/下行 |
| OFDMA | | | 上/下行 |

MU-MIMO 和 OFDMA 参见： [文章](https://zhuanlan.zhihu.com/p/212162678)

#### IEEE 802.11k/v/r

用于实现无缝漫游

* 802.11k Radio Resource Measurment 无线资源管理，如果当前接入点的信号强度变弱时，AP 将发送“优化的频道列表”，设备将进行扫描来确定是否有此列表中的 AP。
* 802.11r Fast Basic Service Set Transition 快速BSS切换，用于简化握手协议，降低握手耗时
* 802.11v WNM (Wireless Network Management) 基于 802.11k，向终端发送更多负载均衡相关信息，以辅助终端进行切换

#### IEEE 802.11s

Hybrid WirelESS Mesh Protocol,HWMP 混合无线Mesh 协议。众多宣称支持 Mesh 的家用型路由器为该协议的实现。

## 术语/概念/黑话

* 路由器 - 三层网络设备，工作在 OSI 第三层（网络层）。普通的家用路由器，主要负责连接连接两个网段（子网）
* 路由器 LAN - 在家用级路由器中，一般存在多个 LAN 口，用来连接内网设备。广义上来说，通过 WIFI 连入该路由器的设备也是通过 LAN 口连接的（专有名词为 WLAN）
* 路由器 WAN - 在家用级路由器中，一般存在一个 WAN 口，用来上层网络/外网。
* 主路由 - 直接连接光猫，负责宽带配置、DHCP 以及和上层网络通讯的职责，通过 WAN 和上层网络连接
* 旁路由 - 又称旁路网关，负责一些而外的职责，将自己的 LAN 口（推荐）和主路由的 LAN 口连接，主要有两种类型的旁路由：
    * 设备自行选择网关设备（旁路由关闭 DHCP，更改自己的 IP 为主路由 DHCP 外的地址）
    * 所有设备通过旁路由联网（旁路由关闭 DHCP，更改自己的 IP 为主路由 DHCP 外的地址；主路由 DHCP 默认网关配置为旁路由）
* AP - Wireless Access Point 无线接入，一般语境下 AP 代指 WIFI 接入点
* AC - Wireless Access Point Controller 无线控制器，主要应用于对 AP 管理，一般是企业级无线组网的核心设备

## 无线组网方案

### 目标

* 全覆盖
* 无缝漫游（在不同 AP 间移动可以自动无感切换）
* 相同内网（不同AP接入进入统一个内网）
* 异地组网（暂不涉及）

### 桥接

https://fenghe.us/padavan-ap-wireless-isp-lan-bridge/

不推荐，该方案无法实现无缝漫游

#### AP Client & AP - WAN (Wireless ISP)

```
    外网
     |
     |
    路由 A (内网 A, SSID A, 开启 DHCP)
     |
     |
    路由 B (内网 B, SSID A, 开启 DHCP)
```

#### AP Client & AP - LAN Bridge

```
    外网
     |
     |
    路由 A (内网 A, SSID A, 开启 DHCP, 路由 B添加到静态路由表)
     |
     |
    路由 B (内网 A, SSID B, 关闭 DHCP)
```

### AC + AP

[参考](https://zhuanlan.zhihu.com/p/100999740)

历史相对比较悠久，设备之间通过有线连接，采用中心式的管理方式，AC 可能存在单点故障。一般为企业级私有协议实现。价格昂贵。

### Mesh

[参考](https://zhuanlan.zhihu.com/p/100999740)

分布式无线连接，效果上基本完全兼容 AC + AP。诞生时间较短，因此没有 AC + AP 成熟，是未来的趋势。有标准的协议支持（IEEE 802.11s）。价格比较亲民。

设备之间，既可以通过有线连接（有线回程），也可以通过无线连接（无线回程）。

## 无线组网实施

### 网络

直接购买各大品牌的支持 Mesh 的 WIFI6 路由器，并尽量采用有线回程。

### 第三方固件方案

* [集客OS](https://post.smzdm.com/p/a6l8r8wn/)，[集客OS 文章 2](https://new.qq.com/omn/20191114/20191114A0M76200.html)
* [OpenWrt 方案](https://post.smzdm.com/p/a992e0l5/)，[OpenWrt 方案 Easy Mesh](https://post.smzdm.com/p/aqxzgn6x/)
* [Padavan Mesh](https://blog.csdn.net/weixin_43868990/article/details/113820013)
