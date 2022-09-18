---
title: "Linux 网络虚拟化技术（一）概览"
date: 2022-04-21T00:24:21+08:00
draft: false
toc: true
comments: true
tags:
  - linux
---

## 概述

通过对 Linux 内核提供的关于网络虚拟化相关 API 的学习和实验代码的编写实验，从底层理解基于 Linux 的物理网络设备（路由器/交换机）、数据中心网络、云计算虚拟机网络、容器网络（Docker/K8S）的原理。

## 实验环境准备

> 参考：[容器核心技术（一） 实验环境准备 & Linux 概述](/posts/container-core-tech-1-experiment-preparation-and-linux-base/#实验环境准备)。

安装相关外部命令。

```
sudo apt update
sudo apt install -y iproute2 tcpdump
```

## 实验代码库

本系列实验代码库位于：[rectcircle/linux-network-virtualization-experiment](https://github.com/rectcircle/linux-network-virtualization-experiment)。

## 编程接口和工具

众所周知周知，在 Linux 上，编写普通的网络应用程序（tcp 客户端/服务端）依赖的编程接口是最早来自于 BSD 的 Socket 模型。

而对于内核网络的管理，在 Linux 的发展中，有两个阶段：

* net-tools 阶段，通过 `/proc` 文件系统和 `ioctl` 系统调用来实现对内核网络的管理。
* iproute2 阶段，在通过一种称为 `netlink` 的特殊类型的 `socket` 对象来实现对内核网络的管理。

`net-tools` 工具箱提供了 `netstat`、`route`、`ifconfig` 等命令（`dpkg -L net-tools | grep "[s]*bin"`），2001 起就停止维护了。

目前主流的 Linux 发行版，推荐使用 `iproute2` 工具箱来实现对内核网络的进行管理。该工具箱提供了 `ip` 等命令（`dpkg -L iproute2 | grep "[s]*bin"`）。

关于 `net-tools` 和 `iproute2` 区别和对比，参考：[网络管理工具变迁 - 从 net-tools 到 iproute2](http://www.jiatcool.com/?p=762)。

本系列实验，将使用使用如下编程接口和命令行工具：

* Shell 描述：使用 [iproute2 工具集](https://github.com/shemminger/iproute2)，基于 netlink socket 实现。
* Go 语言描述：使用 [vishvananda/netlink 库](https://github.com/vishvananda/netlink) （[runc 同款依赖](https://github.com/opencontainers/runc/blob/main/go.mod#L21)），基于 netlink socket 实现。

因此 netlink socket 是关键 (参见：[netlink(7) 手册](https://man7.org/linux/man-pages/man7/netlink.7.html)) ，netlink socket 有很多中类型。本章节主要介绍的是 NETLINK_ROUTE 类型（参见：[rtnetlink(7)](https://man7.org/linux/man-pages/man7/rtnetlink.7.html) 和 [rtnetlink(3)](https://man7.org/linux/man-pages/man3/rtnetlink.3.html)） 。

下面简要介绍 rtnetlink 的请求消息结构示例：

```
第一部分: netlink message header 长度 16 字节。
0                   1                   2                   3
0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+ 
|                       nlmsghdr.nlmsg_len                      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|      nlmsghdr.nlmsg_type      |     nlmsghdr.nlmsg_flags      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     nlmsghdr.nlmsg_seq                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     nlmsghdr.nlmsg_pid                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

第二部分: Messages ，其类型由 nlmsghdr.nlmsg_type 决定。
如下展示 nlmsghdr.nlmsg_type 为 RTM_NEWLINK, RTM_DELLINK, RTM_GETLINK 的请求体。
即 ifinfomsg interface information message (ifinfomsg, 下面简写为 ifim)。
0                   1                   2                   3
0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+ 
|ifim.ifi_family|ifim.__ifi_pad |         ifim.ifi_type         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        ifim.ifi_index                         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        ifim.ifi_flags                         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        ifim.ifi_change                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

第三部分：Routing attributes 列表，其包含的内容，由 ifim.ifi_type 决定。
每个 attribute 的组成为：
0                   1                   2                   3
0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+ 
|         rtattr.rta_len        |        rtattr.rta_type        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  data (len = rtattr.rta_len - 4)  ...
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-

attribute 支持任意级别的嵌套，比如一个请求包含属性 a1, b1。a1 内部包含 a2 a3。
0                   1                   2                   3
0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+ 
|         a1.rta_len = 20       |          a1.rta_type          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|         a2.rta_len = 6        |          a2.rta_type          | --
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+   |
|         a2.data               |              对齐              | --
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+   |---- a1 的 data
|         a3.rta_len = 8        |          a3.rta_type          | --
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+   |
|                           a3.data                             | --
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|         b1.rta_len = 12       |          b1.rta_type          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|         b2.data                                               |
|                               |              对齐              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

注意：

* 以上有三种类型的结构体，每个结构体和结构体之间按 4 字节对齐。
* 字节序取决于本机字节序。

直接操纵 netlink socket 的方式，过于原始，开发成本过高，本系列仅提供一个 C 语言编写的基于 netlink socket 的示例。参见： [veth 虚拟设备 - 实验 - C 语言描述](/posts/linux-net-virual-02-veth/#c-语言描述调用-netlink)。其他章节部分仅提供 Golang 和 Shell 示例。

如果想使用 C 语言编写 Linux 网络虚拟化相关程序，可以直接使用 [libnl 库](https://www.infradead.org/~tgr/libnl/)，而不是直接使用 netlink socket 这么底层的 API。

参考：

* [ip(8) — Linux manual page](https://man7.org/linux/man-pages/man8/ip.8.html)
* [获取网卡列表的几种方式](https://www.hyuuhit.com/2018/04/05/network-device-list/#rtnetlink)
* [Linux netlink socket 内核通信](http://www.hyuuhit.com/2018/08/22/netlink/)

## 网络设备概述

Linux 网络设备可以分为物理网络设备和虚拟网络设备，这些网络设备可以通过：`ip addr show` 可以查看。

最常见的物理网络设备为：

* `eth` 物理以太网设备（又称物理网卡），名字一般以 `eth` 开头，如 `eth0`（在 VirtualBox 虚拟机中以 `enp` 开头）。

本系列介绍的虚拟网络设备为：

* `bridge` 桥设备，即一个软件实现的交换机或者路由器，名字一般以 `br` 开头，如 `br0`。
* `veth` 虚拟以太网设备。
* `tun/tap` （network TUNnel / network TAP）。
* `ipvlan/macvlan` 虚拟设备。
* `vxlan` 虚拟设备。

## 术语和绘图说明

在学习 Linux 网络虚拟化相关技术时。经常会遇到一些术语，在此解释下这些术语的含义：

* Network Protocol Stack 网络协议栈，指的是位于内核的处理互联网协议的相关功能的统称，。
* Network interface 网络接口。网络接口指的是一个接收或发送网络数据的对象，一定会配置一个 Mac 地址，可选的配置一个 IP 地址，是逻辑上的抽象。网络接口会和 网络协议栈 相连。在中文语境下，网卡一般指的就是网络接口（有时指的是网卡设备）。
* Network device 网络设备。网络设备是指具有特定功能的对象，当使用网络设备术语时，强调的是该设备的特定功能，一个网络设备会拥有一个网络接口。

在绘制网络拓扑图时，为了简化：

* Network Protocol Stack 一般指网际层协议处理程序（IP 层）。
* 一般不会区分网络接口和网络设备，而是统一看成一个拥有网络接口的网络设备。

<!-- ## 路由表、arp 表和 fdb

TODO 添加，查看这几个表对应查看命令以及简述

https://yuerblog.cc/2019/11/18/%E7%AE%80%E8%BF%B0linux%E8%B7%AF%E7%94%B1%E8%A1%A8/

* 这几张表如何维护的
* 这个几个表在 IP 通讯过程中的过程作用 
* 添加相关 api 的权限说明（创建和管理必须有 CAP_NET_ADMIN 权限，docker 容器默认权限是不可以创建/修改网络设备）

-->

## IP 地址和网络接口关系

通过 `ip addr show` 查看到的 ip，看起来 ip 和 网络接口绑定在了一起。

* 接收数据时，直觉上看，似乎是到达该网络设备的流量的目标 IP 必须和该接口上的 IP 匹配上，数据包才会正常处理。实际上并非如此，在处理 IP 数据包时，Linux 内核并不管该数据包是从那个网络设备进入的，只要数据包目标 IP 地址和任一 `ip addr show` 显示的 IP 地址一致时，即可进行处理。因此在接收数据时，ip 地址是一个全局属性。（参见：[Harping on ARP](https://lwn.net/Articles/45373/)）
* 在发送数据时，Linux 会根据路由表来选择出网的网络接口，而网络接口的确认是根据网关地址自动选择的。因此在发送数据时，ip 地址是网络接口的一个属性。

路由表主要用来配置出流量从哪个网络接口出去，工作原理是根据目标 ip 匹配路由表中的网段，如果匹配，则从该路由表项目对应的网络接口出去，此外：

* 如果 socket 没有 bind 一个 ip，会使用路由表的 src 字段作为源 ip，参见：[ip-route-show-src-field](https://serverfault.com/questions/451601/ip-route-show-src-field)。
* 路由表的操作，参见：[ip route 文档页](http://linux-ip.net/html/tools-ip-route.html)。
