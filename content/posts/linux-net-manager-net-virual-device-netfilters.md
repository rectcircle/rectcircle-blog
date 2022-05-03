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

安装相关外部命令。

```
sudo apt update
sudo apt install -y iproute2 tcpdump
```

## 实验代码库

本系列实验代码库位于：[rectcircle/linux-network-manage-experiment](https://github.com/rectcircle/linux-network-manage-experiment)

## 编程接口和工具

总所周知，在 Linux 上，编写普通的网络应用程序（tcp 客户端/服务端）依赖的编程接口是最早来自于 BSD 的 Socket 模型。

而对于内核网络的管理，在 Linux 的发展中，有两个阶段：

* net-tools 阶段，通过 `/proc` 文件系统和 `ioctl` 系统调用来实现对内核网络的管理。
* iproute2 阶段，在通过一种称为 `netlink` 的特殊类型的 `socket` 对象来实现对内核网络的管理。

`net-tools` 工具箱提供了 `netstat`、`route`、`ifconfig` 等命令（`dpkg -L net-tools | grep "[s]*bin"`），2001 起就停止维护了。

目前主流的 Linux 发行版，推荐使用 `iproute2` 工具箱来实现对内核网络的进行管理。该工具箱提供了 `ip` 等命令（`dpkg -L iproute2 | grep "[s]*bin"`）。

关于 `net-tools` 和 `iproute2` 区别和对比，参考：[网络管理工具变迁 - 从 net-tools 到 iproute2](http://www.jiatcool.com/?p=762)。

本文实验，将使用使用如下编程接口和命令行工具：

* Shell 描述：使用 [iproute2 工具集](https://github.com/shemminger/iproute2)，基于 netlink socket 实现。
* Go 语言描述：使用 [vishvananda/netlink 库](https://github.com/vishvananda/netlink) （[runc 同款依赖](https://github.com/opencontainers/runc/blob/main/go.mod#L21)），基于 netlink socket 实现。
* C 语言描述：直接使用 [netlink socket](https://man7.org/linux/man-pages/man7/netlink.7.html) 或 [libnl 库](https://www.infradead.org/~tgr/libnl/)（基于 netlink socket 实现）。

因此 `netlink` 是关键 (参见：[netlink(7) 手册](https://man7.org/linux/man-pages/man7/netlink.7.html)) 有很多中类型。本章节主要介绍的是 NETLINK_ROUTE 类型（参见：[rtnetlink(7)](https://man7.org/linux/man-pages/man7/rtnetlink.7.html) 和 [rtnetlink(3)](https://man7.org/linux/man-pages/man3/rtnetlink.3.html)） 。

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

直接操纵 netlink socket 的方式，过于原始，开发成本过高，因此本文仅提供一个 C 语言编写的基于 netlink socket 的示例。参见： [veth 虚拟设备 - 实验 - C 语言描述](#c-语言描述)。其他部分仅提供 Golang 和 Shell 示例。

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

> 参考： [Linux虚拟网络设备之veth](https://segmentfault.com/a/1190000009251098)

### 功能特性

veth 即 virtual ethernet device，是对物理一台网卡的模拟。功能和物理以太网设备类似。此外有如下特点：

* veth 的一端连接着内核网络协议栈。
* veth 设备是成对出现的，两个设备彼此相连（就位于两个主机的 eth 通过网线连接一样）。
* 一个设备收到协议栈的数据发送请求后，会将数据发送到另一个设备上去。

如上特点图示如下（Network Protocol Stack 指 3 层协议栈）：

```
+----------------------------------------------------------------+
|                                                                |
|       +------------------------------------------------+       |
|       |             Network Protocol Stack             |       |
|       +------------------------------------------------+       |
|              ↑               ↑               ↑                 |
|..............|...............|...............|.................|
|              ↓               ↓               ↓                 |
|        +----------+    +-----------+   +-----------+           |
|        |  enp0s3  |    |   veth0   |   | veth0peer |           |
|        +----------+    +-----------+   +-----------+           |
|10.0.2.15     ↑               ↑               ↑                 |
|              |               +---------------+                 |
|              |         192.168.4.2      192.168.4.3            |
+--------------|-------------------------------------------------+
               ↓
         Physical Network
```

### 实验

#### 实验设计

在一台虚拟机上实现上图所示的拓扑模型。并验证通过 `ping` 检查网络是否畅通。

#### Shell 描述

```bash
#!/usr/bin/env bash

# 观察网卡情况
echo '===初始状态网络设备'
ip addr show
echo

echo '===初始状态 arp 表'
cat /proc/net/arp
echo

echo '===创建并配置veth'
# 创建一对 veth
sudo ip link add veth0 type veth peer name veth0peer
# 给这一对 veth 配置 ip 地址
sudo ip addr add 192.168.4.2/24 dev veth0
sudo ip addr add 192.168.4.3/24 dev veth0peer
# 启动这两个网卡
sudo ip link set veth0 up
sudo ip link set veth0peer up
# 允许从非 lo 设备进来的数据包的源 IP 地址是本机地址
sudo sysctl -w net.ipv4.conf.veth0.accept_local 1
sudo sysctl -w net.ipv4.conf.veth0peer.accept_local 1
echo '完成创建并配置veth'
echo

# 观察 arp
echo '===配置完 veth 后网络设备'
ip addr show
echo

# 实验
echo '===尝试是否可以 ping 通'
ping -c 4 192.168.4.3 -I veth0
echo

echo '===ping 完成后 arp 表'
cat /proc/net/arp
echo

# 恢复现场
sudo ip link delete veth0
```

#### C 语言描述

#### Go 语言描述

```go
package main

// sudo go ./src/go/01-veth/

import (
	"fmt"
	"net"
	"os"
	"os/exec"

	sysctl "github.com/lorenzosaino/go-sysctl"
	"github.com/vishvananda/netlink"
)

const (
	beforeScript = "echo '===初始状态网络设备' && ip addr show && echo" +
		" && echo '===初始状态 arp 表' && cat /proc/net/arp && echo"
	afterScript = "echo '===配置完 veth 后网络设备' && ip addr show && echo" +
		" && echo '===尝试是否可以 ping 通' && ping -c 4 192.168.4.3 -I veth0 && echo" +
		" && echo '===ping 完成后 arp 表' && cat /proc/net/arp && echo " +
		" && sudo ip link delete veth0"
)

func runtScript(script string) error {
	cmd := exec.Command("/bin/sh", "-c", script)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func panicIfErr(err error) {
	if err != nil {
		panic(err)
	}
}

func main() {
	// 输出初始化状态
	panicIfErr(runtScript(beforeScript))

	fmt.Println("===创建并配置veth")
	// 创建一对 veth
	panicIfErr(netlink.LinkAdd(&netlink.Veth{
		LinkAttrs: netlink.LinkAttrs{
			Name: "veth0",
		},
		PeerName: "veth0peer",
	}))
	// 配置 ip 地址
	ip, ipNet, err := net.ParseCIDR("192.168.4.2/24")
	ipNet.IP = ip
	if err != nil {
		panic(err)
	}
	panicIfErr(netlink.AddrAdd(netlink.NewLinkBond(netlink.LinkAttrs{Name: "veth0"}), &netlink.Addr{IPNet: ipNet}))

	ip, ipNet, err = net.ParseCIDR("192.168.4.3/24")
	ipNet.IP = ip
	if err != nil {
		panic(err)
	}
	panicIfErr(netlink.AddrAdd(netlink.NewLinkBond(netlink.LinkAttrs{Name: "veth0peer"}), &netlink.Addr{IPNet: ipNet}))

	netlink.LinkSetUp(netlink.NewLinkBond(netlink.LinkAttrs{Name: "veth0"}))
	netlink.LinkSetUp(netlink.NewLinkBond(netlink.LinkAttrs{Name: "veth0peer"}))

	panicIfErr(sysctl.Set(fmt.Sprintf("net.ipv4.conf.%s.accept_local", "veth0"), "1"))
	panicIfErr(sysctl.Set(fmt.Sprintf("net.ipv4.conf.%s.accept_local", "veth0peer"), "1"))
	fmt.Println("完成创建并配置veth")
	fmt.Println()

	// 实验
	panicIfErr(runtScript(afterScript))
}

```

#### 输出和解释

```
===初始状态网络设备
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:7d:99:1d brd ff:ff:ff:ff:ff:ff
    inet 10.0.2.15/24 brd 10.0.2.255 scope global dynamic enp0s3
       valid_lft 72349sec preferred_lft 72349sec
    inet6 fe80::a00:27ff:fe7d:991d/64 scope link 
       valid_lft forever preferred_lft forever
3: enp0s8: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:06:ff:a6 brd ff:ff:ff:ff:ff:ff
    inet 192.168.56.3/24 brd 192.168.56.255 scope global dynamic enp0s8
       valid_lft 466sec preferred_lft 466sec
    inet6 fe80::a00:27ff:fe06:ffa6/64 scope link 
       valid_lft forever preferred_lft forever

===初始状态 arp 表
IP address       HW type     Flags       HW address            Mask     Device
192.168.56.2     0x1         0x2         08:00:27:fa:d4:ec     *        enp0s8
169.254.169.254  0x1         0x0         00:00:00:00:00:00     *        enp0s3
10.0.2.2         0x1         0x2         52:54:00:12:35:02     *        enp0s3
192.168.56.1     0x1         0x2         0a:00:27:00:00:00     *        enp0s8

===创建并配置veth
net.ipv4.conf.veth0.accept_local = 1
net.ipv4.conf.veth0peer.accept_local = 1
完成创建并配置veth

===配置完 veth 后网络设备
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:7d:99:1d brd ff:ff:ff:ff:ff:ff
    inet 10.0.2.15/24 brd 10.0.2.255 scope global dynamic enp0s3
       valid_lft 72349sec preferred_lft 72349sec
    inet6 fe80::a00:27ff:fe7d:991d/64 scope link 
       valid_lft forever preferred_lft forever
3: enp0s8: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:06:ff:a6 brd ff:ff:ff:ff:ff:ff
    inet 192.168.56.3/24 brd 192.168.56.255 scope global dynamic enp0s8
       valid_lft 466sec preferred_lft 466sec
    inet6 fe80::a00:27ff:fe06:ffa6/64 scope link 
       valid_lft forever preferred_lft forever
14: veth0peer@veth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether ca:02:25:cf:ce:da brd ff:ff:ff:ff:ff:ff
    inet 192.168.4.3/24 scope global veth0peer
       valid_lft forever preferred_lft forever
    inet6 fe80::c802:25ff:fecf:ceda/64 scope link tentative 
       valid_lft forever preferred_lft forever
15: veth0@veth0peer: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether 7a:2d:96:17:8d:bc brd ff:ff:ff:ff:ff:ff
    inet 192.168.4.2/24 scope global veth0
       valid_lft forever preferred_lft forever
    inet6 fe80::782d:96ff:fe17:8dbc/64 scope link tentative 
       valid_lft forever preferred_lft forever

===尝试是否可以 ping 通
PING 192.168.4.3 (192.168.4.3) from 192.168.4.2 veth0: 56(84) bytes of data.
64 bytes from 192.168.4.3: icmp_seq=1 ttl=64 time=0.032 ms
64 bytes from 192.168.4.3: icmp_seq=2 ttl=64 time=0.084 ms
64 bytes from 192.168.4.3: icmp_seq=3 ttl=64 time=0.068 ms
64 bytes from 192.168.4.3: icmp_seq=4 ttl=64 time=0.086 ms

--- 192.168.4.3 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3068ms
rtt min/avg/max/mdev = 0.032/0.067/0.086/0.021 ms

===ping 完成后 arp 表
IP address       HW type     Flags       HW address            Mask     Device
192.168.56.2     0x1         0x2         08:00:27:fa:d4:ec     *        enp0s8
192.168.4.2      0x1         0x2         7a:2d:96:17:8d:bc     *        veth0peer
169.254.169.254  0x1         0x0         00:00:00:00:00:00     *        enp0s3
10.0.2.2         0x1         0x2         52:54:00:12:35:02     *        enp0s3
192.168.56.1     0x1         0x2         0a:00:27:00:00:00     *        enp0s8
192.168.4.3      0x1         0x2         ca:02:25:cf:ce:da     *        veth0
```

* 初始状态网络设备：在 VirtualBox 虚拟机上进行实验，有两张物理网卡分别是 `enp0s3` 和 `enp0s8`。
* 初始状态 arp 表：arp 表中只有关于这两种物理网卡的数据
* 创建并配置veth：
    * 创建了一对 veth 分别命名为 `veth0` 和 `veth0peer`。
    * 给这对 veth 分别分配两个 ip 地址： `192.168.4.2/24` 和 `192.168.4.3/24`
    * 启动这对 veth
    * 打开这两个设备 `accept_local` 选项（允许从非 lo 设备进来的数据包的源 IP 地址是本机地址）。
* 通过 ping 验证，其流量路径为：
    * 请求：
        * ping 配置了出口设备为 `veth0`，所以程序发送 ICMP echo 数据包的配置源 IP 地址为 `veth0` 绑定的地址，即 `192.168.4.2`（不配置 `veth0` 则 源 IP 地址为 `192.168.4.3`），目标 IP 地址为 `192.168.4.3`。
        * 由于配置了从 `veth0` 出口，因此需要 arp 流程，根据 local 路由表（`ip rule list`、`ip route list table local`），目标地址 `192.168.2.3` 和 `veth0` 地址处于同一网段，所以协议栈会先从 `veth0` 发送 ARP，询问 `192.168.2.3` 的 mac 地址。
        * 内核协议栈将请求发送，将以太网数据包，发送到 `veth0peer`，`veth0peer` 将数据包转交到内核协议栈。
        * 内核协议栈比对 目标 IP 地址和本地 IP 地址一致，构造 ICMP echo 数据包。
    * 响应
        * ICMP echo 数据包的目的地址是 `192.168.4.2`，是本地地址，所以会通过 lo 设备发送出去（`sudo tcpdump -n -i lo` 可以看到）（不需要 arp 流程）。
        * 内核收到该数据包，传递到 ping 的 socket 中，ping 的相关函数解析并打印到标准输出中。

ping local ip 的流量路径：

* `ping 192.168.4.3`：`socket ---内核协议栈--> lo ---内核协议栈回复---> lo ---内核协议栈--> socket`
* `ping 192.168.4.3 -I 192.168.4.2`：`socket ---内核协议栈--> lo ---内核协议栈回复---> lo ---内核协议栈--> socket`（猜测不会调用 socket.bind）
* `ping 192.168.4.3 -I veth0`：`socket ---内核协议栈--> veth0 ---> veth0peer ---内核协议栈回复---> lo ---内核协议栈--> socket`（猜测会调用 socket.bind）

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
