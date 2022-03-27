---
title: "通过 Linux API 学习网络协议栈（二）IP 协议"
date: 2022-03-27T22:48:15+08:00
draft: true
toc: true
comments: true
tags:
  - linux
---

## 概述

本部分将从 协议 和 Socket 编程模型两方面学习/复习 IP 协议。

最后，通过手动实现 ICMP 协议来对本部分内容进行实战。

## IP 协议

> 在关于 IP 协议的标准文档，参见如下链接：
>
> * [RFC 791: INTERNET PROTOCOL IP 协议](https://datatracker.ietf.org/doc/html/rfc791) | [中文](https://python.iitter.com/other/229489.html)
> * [RFC 2460: Internet Protocol, Version 6 (IPv6) Specification IPv6 协议](https://datatracker.ietf.org/doc/html/rfc2460)
> * [Wiki: IPv4](https://en.wikipedia.org/wiki/IPv4) | [Wiki: IPv6](https://en.wikipedia.org/wiki/IPv6)
> * [RFC 1122: Requirements for Internet Hosts -- Communication Layers Internet 主机的要求——通信层](https://datatracker.ietf.org/doc/html/rfc1122)

IP 协议是互联网的基石，可以说 IP 协议定义互联网的基本结构。

IP 协议的核心目标是：实现超大规模的互联网中的任意两台主机之间可以相互通讯。

本部分仅介绍 IPv4 协议 的 Packet Header 格式，他请阅读 RFC 文档。

```
0                   1                   2                   3
0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|Version|  IHL  |Type of Service|          Total Length         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|         Identification        |Flags|      Fragment Offset    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Time to Live |    Protocol   |         Header Checksum       |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Source Address                          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Destination Address                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Options                    |    Padding    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

* 采用大端字节序 (Big-endian)([wiki](https://en.wikipedia.org/wiki/Endianness)|[博客](https://www.ruanyifeng.com/blog/2016/11/byte-order.html))
* Version：版本为 4
* IHL：协议头长度，以32位（四字节）为单位，指定用户数据的开始位置，协议头最小的长度为5，也就是20字节。
* Type of Service: 服务类型，用于控制该 Packet 的优先级，该字段组成如下所示

    ```
        0     1     2     3     4     5     6     7
    +-----+-----+-----+-----+-----+-----+-----+-----+
    |                 |     |     |     |     |     |
    |   PRECEDENCE    |  D  |  T  |  R  |  0  |  0  |
    |                 |     |     |     |     |     |
    +-----+-----+-----+-----+-----+-----+-----+-----+
    ```

    * PRECEDENCE 优先级
        * `000` 普通 (Routine)
        * `001` 优先的 (Priority)
        * `010` 立即的发送 (Immediate)
        * `011` 闪电式的 (Flash)
        * `100` 比闪电还闪电式的 (Flash Override)
        * `101` CRITIC/ECP
        * `110` 网间控制 (Internetwork Control)
        * `111` 网络控制 (Network Control)
    * D 时延: 0 - 普通；1 - 延迟尽量小
    * T 吞吐量: 0 - 普通；1 - 流量尽量大
    * R 可靠性: 0 - 普通；1 - 可靠性尽量大
    * 00 最后2位被保留，恒定为0
* Total Length：总长度包括报文头和数据部分，以字节为单位，这个字段允许报文最大长度为 65535 个字节（64k）。在工程中，IP 协议要求所有主机必须支持 576（512 + 64） 个字节长度的 Packet。
* Identification：报文发送方可以为每个报文设置一个数字，方便后续分段和组装报文。
* Flags: 多用途控制标志。

    ```
        0   1   2
    +---+---+---+
    |   | D | M |
    | 0 | F | F |
    +---+---+---+
    ```

    * 0: 保留，必须为零
    * DF: 0 - 可以分段；1 - 不分段。
    * MF: 0 - 最后一个分段，1 - 后续还有更多分段。

* Fragment Offset: 表示这个分段在报文中的位置。偏移量是以8个字节为单位，第一个分段的偏移量为 0。
* Time to Live: 这个字段表明在网络中报文的最大生命周期。如果这个字段的值为0 ，这个报文必须被删除。这个字段在头部处理过程中被修改。时间单位为秒，每个处理报文的模块最少减去一个秒，即使他处理的时间要少于一秒，TTL用来表明报文被删除的剩余时间。这个字段的目的就是删除网络上不能分发的报文。
* Protocol: 这个字段说明数据部分使用的协议，具体的协议列表在 [RFC 790 (ASSIGNED INTERNET PROTOCOL NUMBERS)](https://datatracker.ietf.org/doc/html/rfc790) 中有介绍。
* Header Checksum: 只对头部进行校验和运算。因为头部会变化（比如time to live），所以每个处理节点都需要重新计算校验和。校验和算法与TCP的校验和算法是一样的，这是一个简单的计算过程，但是经过验证这是可以使用的，这只是一个暂时的方案，未来版本可能会用CRC取代。算法如下：
    * 把 Header Checksum 字段以全 0 填充；
    * 对每 16 位（2 Byte）进行二进制反码求和（有进位则需要加到最低位）。
* Source Address: 源 IP 地址
* Destination Address: 目标 IP 地址
* Options: 可选的选项，长度可变。
    * 该字段有两种情况：
        * 只有一个 8 位长度的选项类型
        * 一个 8 位长度的选项类型，一个 8 位表示长度（这个 Option 字段的长度），其余表示内容。
    * 选型类型说明如下

    ```
    0   1   2   3   4   5   6   7
    +---+---+---+---+---+---+---+---+
    | C | CLASS | NUMBER            |
    | O |       |                   |
    | P |       |                   |
    | I |       |                   |
    | E |       |                   |
    | D |       |                   |
    +---+---+---+---+---+---+---+---+

    copied flag 表示这个选项会被复制到所有的数据报分段中

      0 = not copied
      1 = copied

    class 字段

      0 = control 控制类
      1 = reserved for future use 留作将来使用
      2 = debugging and measurement 调试和测量
      3 = reserved for future use 留作将来使用

    已经定义的选项参见下表

      CLASS NUMBER LENGTH DESCRIPTION
      ----- ------ ------ -----------
      0     0      -    选项列表结尾（End of Option List），只占一个字节，没有长度值。
      0     1      -    没有指定操作（No Operation），只占一个字节，没有长度值。
      0     2     11    安全（Security），用来表示安全，隔离，用户组（TCC），处理与DOD（https://www.oreilly.com/library/view/ccent-cisco-certified/9781118435250/chap02-sec001.html）模型的限制码兼容要求。
      0     3     var.  源地址松散路由（Loose Source Routing）。基于数据报的源地址进行路由（不必严格根据发送端提供的信息进行路径选择）。
      0     9     var.  源地址严格路由（Strict Source Routing），基于数据报的源地址进行路由（必须严格根据发送端提供的信息进行路径选择）。
      0     7     var.  记录路径（Record Route）。记录报文通过的路径。
      0     8      4    流id（Stream ID）.  标记流id.
      2     4     var.  网络时间戳（Internet Timestamp）.

    更多参见 RFC 791 Page 16: https://datatracker.ietf.org/doc/html/rfc791#page-16
    ```

## ICMP 协议

> 在关于 ICMP 协议的标准文档，参见如下链接：
>
> * [RFC 792](https://datatracker.ietf.org/doc/html/rfc792)

在使用 ping 命令来测试网络连通性时所使用的协议就是 ICMP。该协议就建立在 IP 协议之上。

因为该协议相对简单，因此后文，将以此协议的实现，来介绍如何使用 Raw Socket 编程接口进行 IP 层网络编程。

本节，简单介绍一下 ICMP 协议的内容，ICMP 协议的报文存放在 IP 协议 Packet 的 Data 部分。

为了清晰，我们将 IP Packet Header 也列出来，因此一个 ICMP 报文构成如下：

```
0                   1                   2                   3
0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+   IP Packet Header
|Version|  IHL  |Type of Service|          Total Length         |
|4      |  5    | 0             |          *                    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|         Identification        |Flags|      Fragment Offset    |
|         *                     |0b010|      0                  |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Time to Live |    Protocol   |         Header Checksum       |
|  0            |    1          |         *                     |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Source Address                          |
|                       *                                       |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Destination Address                        |
|                    *                                          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+   IP Packet Data: ICMP Message
|     Type      |     Code      |          Checksum             |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                   由 Type 和 Code 决定（长度为 32 位）           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  由 Type 和 Code 决定（长度不确定）   ...
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

关于 ICMP 报文的 IP Packet Header 部分：

* Protocol 参见：[RFC 790 (ASSIGNED INTERNET PROTOCOL NUMBERS)](https://datatracker.ietf.org/doc/html/rfc790) ，ICMP 协议为 1
* 忽略了 Option 字段
* `*` 表示不确定，由运行时决定

下面主要介绍 ICMP Echo / Echo Reply 部分

| 说明               | 方向     | Type (0~7 位) | Code (8~15 位) | Checksum (16~31 位)      | 32~63 位                                           | 64~...                       |
| ------------------ | -------- | ------------- | -------------- | ------------------------ | -------------------------------------------------- | ---------------------------- |
| 发送一个 Echo 消息 | Request  | 8             | 0              | 和 IP 校验和计算方式一致 | 前 16 位为 Identifier ，后 16 位为 Sequence Number | 任意数据，echo 的内容        |
| 回复一个 Echo 消息 | Reply    | 0             | 0              | 重新按照如上算法计算     | 内容和待回复的 Echo 消息一致                       | 内容和待回复的 Echo 消息一致 |

* Identifier，标识符，用来标示此发送的报文，类似与 TCP 的端口号，用于区分会话，用来实现同一个主机上运行多个 Ping 程序。
* Sequence Number 序列号，发送端发送的报文的顺序号。每发送一次顺序号就加1。
* Code 是错误码，用来标识错误的具体类型，在 Type 为 0 和 8 时都为 0，其他 Type 有具体定义，再次不赘述了。

扩展： Traceroute 利用的是 ICMP 的 IP 的 TTL （Time to Live） 参数和 ICMP 的 Destination Unreachable 类型消息（Type = 3）来实现路由追踪的。因为按照 IP 协议栈规定所有的主机都需要实现 ICMP 协议，并且任意的 IP 包无法送达下一跳而被丢弃时，都需要给源 IP 回复 ICMP  Destination Unreachable 消息，因此只需从 1 开始递增的设置 IP 协议的TTL 给目标 IP 发送 IP 报文，即可收到各个节点回复的 Destination Unreachable 消息，从这些消息的的 Source IP 即可获得路由信息，更多参见[知乎文章](https://zhuanlan.zhihu.com/p/101810847)。

## Raw socket

在 Linux 中。通过编程直接操作 IP 协议，参见如下链接：

* [ip(7) 手册](https://man7.org/linux/man-pages/man7/ip.7.html)
* [ip6(7) 手册](https://man7.org/linux/man-pages/man7/ipv6.7.html)
* [raw(7) 手册](https://man7.org/linux/man-pages/man7/raw.7.html)
* [packet(7) 手册](https://man7.org/linux/man-pages/man7/packet.7.html)
* [Wiki 原始套接字](https://zh.wikipedia.org/wiki/%E5%8E%9F%E5%A7%8B%E5%A5%97%E6%8E%A5%E5%AD%97)

### 发送

### 接收

### 运行
