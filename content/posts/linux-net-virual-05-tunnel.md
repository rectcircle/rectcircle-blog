---
title: "Linux 网络虚拟化技术（五）隧道技术"
date: 2022-04-21T00:24:21+08:00
draft: true
toc: true
comments: true
tags:
  - linux
---

TODO 两个实例：

* VPN 实现
* 虚拟机网络模拟

## tun/tap 虚拟设备

### 概述

TUN (network TUNnel) / TAP (network TAP) 是 Linux 提供的的两种虚拟网络设备。该设备一端连接内核网络网络协议栈，一端连接用户态进程的一个文件描述符。

当数据包从内核到达该设备时，与该设备绑定的用户态进程的文件描述符将 read 系统调用将读到数据，

用户态进程调用 write 系统调用向与该设备绑定的文件描述符写数据时，该设备会将写入的数据流当做网络数据包发送到内核网络协议栈中。

一般情况下，用户态进程在读取到数据后，会通过一个 TCP/UDP socket 将数据发送到远端主机，远端主机接收到数据库在将数据转发到目标，这样在本机和远端主机之间通过 tun/tap 和 socket 建立了一个隧道。

下图是一个 VPN Client 侧的网络拓扑：

```
+----------------------------------------------------------------+
|                                                                |
|  +--------------------+      +--------------------+            |
|  | User Application A |      | User Application B |<-----+     |
|  +--------------------+      +--------------------+      |     |
|               | 1                    | 5                 |     |
|...............|......................|...................|.....|
|               ↓                      ↓                   |     |
|         +----------+           +----------+              |     |
|         | socket A |           | socket B |              |     |
|         +----------+           +----------+              |     |
|                 | 2               | 6                    |     |
|.................|.................|......................|.....|
|                 ↓                 ↓                      |     |
|             +------------------------+                 4 |     |
|             | Newwork Protocol Stack |                   |     |
|             +------------------------+                   |     |
|                | 7                 | 3                   |     |
|................|...................|.....................|.....|
|                ↓                   ↓                     |     |
|        +----------------+    +----------------+          |     |
|        |      eth0      |    |      tun0      |          |     |
|        +----------------+    +----------------+          |     |
|    10.32.0.11  |                   |   192.168.3.11      |     |
|                | 8                 +---------------------+     |
|                |                                               |
+----------------|-----------------------------------------------+
                 ↓
         Physical Network
```

简而言之，tun/tap 提供了一种在用户态进程，对数据包进行自定义处理的机制，是 Tunnel/VPN 应用的技术重要基石之一。

tun 和 tap 两种设备的唯一区别在于数据包类型上：

* tun 处理的是 ip 数据包（三层）。
* tap 处理的是 以太网数据包（二层）。

### 系统调用

> [ioctl(2)](https://man7.org/linux/man-pages/man2/ioctl.2.html) | [netdevice(7)](https://man7.org/linux/man-pages/man7/netdevice.7.html)

```cpp
#include <fcntl.h>
#include <sys/ioctl.h>
#include <net/if.h>     // #define TUNSETIFF     _IOW('T', 202, int) 

char *clonedev = "/dev/net/tun";
int fd = open(clonedev, O_RDWR);    // ignore error
int ioctl(fd, SIOCSIFNETMASK, struct *ifreq ifr);
```

TODO 说明

### 实验和说明

https://www.kernel.org/doc/html/v5.8/networking/tuntap.html
https://en.wikipedia.org/wiki/TUN/TAP
Linux虚拟网络设备之tun/tap https://segmentfault.com/a/1190000009249039
一文总结 Linux 虚拟网络设备 eth, tap/tun, veth-pair https://www.cnblogs.com/bakari/p/10494773.html
https://github.com/ICKelin/article/issues/9
https://blog.csdn.net/mrpre/article/details/113105456

go 版本 https://github.com/songgao/water

### 实现简单的 vpn

#### VPN 简介

虚拟专用网络

* 虚拟（区别于普通内网，是一个虚拟的内网而不是物理意义上的内网）
* 专用网络（内网）

强调安全性

#### 实现点对点连接

#### client 访问整个内网

#### 访问内网和互联网

渐进过程：

* 点对点 vpn https://github.com/gregnietsky/simpletun （两端链路）
* 访问整个内网
    * https://paper.seebug.org/1648/#0x04 （必须部署到网关上）
* 通过接入点访问整个内网和互联网
    * 方案 1：通过 iptables 和 SNAT 和 MASQUERADE tun 和 iptables https://www.cnblogs.com/blumia/p/Make-a-simple-udp-tunnel-program.html 和 https://github.com/BLumia/udptun
    * 方案 2：通过 raw socket 一种可能性 http://www.ccs.neu.edu/home/noubir/Courses/CS4700-5700/S12.old/problems/PS5.pdf

https://github.com/marywangran/simpletun

https://backreference.org/2010/03/26/tuntap-interface-tutorial/

https://www.junmajinlong.com/virtual/network/data_flow_about_openvpn/

https://paper.seebug.org/1648/#0x00

## Linux IP Tunnel

https://morven.life/posts/networking-3-ipip/
https://cloud.tencent.com/developer/article/1432489
https://www.361way.com/linux-tunnel/5199.html
https://sites.google.com/site/emmoblin/linux-network-1/linux-zhongip-sui-dao
https://www.wangan.com/p/7fygfgeb64839363#1.PPTP%E5%8D%8F%E8%AE%AE
https://zh.m.wikipedia.org/zh-hans/IP%E9%9A%A7%E9%81%93

Tunnel 和 VPN 的区别：https://learningnetwork.cisco.com/s/question/0D53i00000Kt2skCAB/vpn-vs-tunneling

## 常见的 VPN 协议

TODO  VPN 和 TUN/TCP

https://proprivacy.com/vpn/guides/vpn-encryption-the-complete-guide#preliminaries
https://www.cisco.com/c/zh_cn/support/docs/smb/routers/cisco-rv-series-small-business-routers/1399-tz-best-practices-vpn.html

OpenVPN
OpenConnect （anyconnect 协议）
