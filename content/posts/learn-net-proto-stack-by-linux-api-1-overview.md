---
title: "通过 Linux API 学习网络协议栈（一）概览"
date: 2022-03-25T22:50:14+08:00
draft: false
toc: true
comments: true
tags:
  - linux
---

## 系列说明

本系列文章面对的读者是互联网应用后端开发者，互联网应用后端一般具有如下特点：

* 可以感知到的网络协议栈的最底层的一般是 IP 协议；
* 互联网应用后端程序一般运行在 Linux 中。

此外网络协议栈是分层的，每一层都是基于上一层之上的实现的。

因此，本系列将：

* 从 IP 协议开始学习/复习网络协议栈；
* 通过某协议的下层协议（对应的 Linux API），编写代码，实现某协议的方式实战化化的学习/复习网络协议栈；
* 介绍 Linux 平台上某协议的标准 API（系统调用/命令行工具/设备等），以及常见的应用场景和操作。

## 实验代码

github: [rectcircle/linux-internet-proto-learn](https://github.com/rectcircle/linux-internet-proto-learn)

## Linux Socket API 概述

> 手册： [socket(2)](https://man7.org/linux/man-pages/man2/socket.2.html)

在计算机网络方面，有多套模型：

* 实践上，Socket 编程模型；
* 理论上，TCP/IP 四层网络模型 和 OSI 七层网络模型。

本部分先介绍在 Linux 中 Socket 编程模型，最后再介绍，编程模型和网络模型的对应关系。

Linux 网络 API 采用的是 BSD 的 Socket 模型。Socket 模型支持 TCP/IP 模型的网络访问层（Mac 数据帧）、网际层（IP 数据包）、传输层（TCP / UDP）。

### 创建 Socket

```cpp
#include <sys/socket.h>

// 创建 socket https://man7.org/linux/man-pages/man2/socket.2.html
int socket(int domain, int type, int protocol);
```

参数说明

* domain，即 communication domain 通讯域，表示使用的协议族。从网络模型角度看，该参数用于选择网际层协议，即该 Socket 是通过 IPv4 还是 IPv6 等来进行通讯的。常见的可选值为：
    * `AF_UNIX`，Unix Domain Socket；
    * `AF_INET`，IPv4 Only；
    * `AF_INET6`，IPv6 Only 或 IPv4 / IPv6 双栈（默认值为 `/proc/sys/net/ipv6/bindv6only`，通过 `setsockopt` 手动修改）；
    * `AF_PACKET`，直接面向数据链路层 Packet 原始数据。（本系列可能不会涉及）
* type，即 Socket 的类型，表示收发数据的特点，会影响操作 Socket 时的系统调用，该参数有如下可能性：
    * 选择该 Socket 最终使用的网络模型的传输层协议：
        * `SOCK_STREAM` 流式，表示可靠的连接，对应的 protocol 为 TCP；
        * `SOCK_DGRAM` 数据报，表示不可靠消息，对应的 protocol 为 UDP。
    * 该参数也可以用于指定该 Socket 收发底层数据：
        * `SOCK_RAW` 提供原始网络协议访问；
        * ~~`SOCK_PACKET` 已过时，需使用 type = `AF_PACKET` 替代~~。
    * 该参数可以 `|` 原酸用来配置文件描述符的一些特性；
        * `SOCK_NONBLOCK` 设置该文件描述符是非阻塞 IO。
        * `SOCK_CLOEXEC` 表示该文件描述符在 fork-exec 后关闭
* protocol，即 Socket 的具体网络协议，一般情况下设置为 0，表示根据 type 选择一个默认协议。具体可选值说明参见：[protocols(5)](https://man7.org/linux/man-pages/man5/protocols.5.html)

最后，该函数将返回一个 socket 文件描述符。
  
### Socket 选项

```cpp
#include <sys/socket.h>

// 设置/获取 socket 的一些选项 https://man7.org/linux/man-pages/man2/setsockopt.2.html
int getsockopt(int sockfd, int level, int optname,
                void *restrict optval, socklen_t *restrict optlen);
int setsockopt(int sockfd, int level, int optname,
                const void *optval, socklen_t optlen);
```

比如手动指定一个 IPv6 TCP Socket 同时支持 IPv4：

```cpp
#include <sys/socket.h>

int tcp6_socket = socket(AF_INET6, SOCK_STREAM, 0);
int ipv6_only_flag = 0;
setsockopt(tcp6_socket, IPPROTO_IPV6, IPV6_V6ONLY, (void *)&ipv6_only_flag, sizeof(ipv6_only_flag));
```

### 操作 Socket

socket 创建出来后，我们就可以通过想过 API 将该 Socket 连接/绑定到一个地址，然后就可以收发数据了。

不同 type 的 socket 模型中，对应的操作 API 是不同的。

* `SOCK_STREAM` 即 TCP 协议 的 Socket，可以使用的常见的系统调用为：
    * `connect(2)` 连接到 server
    * `bind(2)` 绑定地址
    * `accept(2)` 等待连接
    * `write(2)`、`send(2)` 发送数据
    * `read(2)`、`recv(2)` 接收数据
* `SOCK_DGRAM` 即 UDP 协议 的 Socket 和 `SOCK_RAW` 即 原始 Socket，可以使用的常见的系统调用为：
    * `sendto(2)`
    * `recvfrom(2)`
* `SOCK_PACKET` 即 数据链路层 Socket，可用的系统调用参见： [packet(7)](https://man7.org/linux/man-pages/man7/packet.7.html)

### 对应表

| socket 模型                                                                                               | 操作 socket 的系统调用                                                             | 协议   | TCP/IP 四层模型 | OSI 七层模型   |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------ | --------------- | -------------- |
| 无                                                                                                        | 无                                                                                 | HTTP   | 应用层 (4)      | 应用层 (7)     |
| 无                                                                                                        | 无                                                                                 | Telent | 应用层 (4)      | 表示层 (6)     |
| 无                                                                                                        | 无                                                                                 | DNS    | 应用层 (4)      | 会话层 (5)     |
| [`socket(AF_INET, SOCK_STREAM, 0)`](https://man7.org/linux/man-pages/man7/tcp.7.html)                     | `connect(2)`、`bind(2)`、`accept(2)`、`write(2)`、`send(2)` 、`read(2)`、`recv(2)` | TCP    | 传输层 (3)      | 传输层 (4)     |
| [`socket(AF_INET, SOCK_DGRAM, 0)`](https://man7.org/linux/man-pages/man7/udp.7.html)                      | `sendto(2)`、  `recvfrom(2)`                                                       | UDP    | 传输层 (3)      | 传输层 (4)     |
| [`socket(AF_INET, SOCK_RAW, int protocol)`](https://man7.org/linux/man-pages/man7/raw.7.html)             | `sendto(2)`、  `recvfrom(2)`                                                       | IP     | 网际层 (2)      | 网络层 (3)     |
| [`socket(AF_PACKET, int socket_type, int protocol)`](https://man7.org/linux/man-pages/man7/packet.7.html) | 略                                                                                 |        | 数据链路层 (1)  | 数据链路层 (2) |
| 无                                                                                                        | 无                                                                                 |        | 数据链路层 (1)  | 物理层 (1)     |
