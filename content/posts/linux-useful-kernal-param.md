---
title: "Linux 有用的内核参数"
date: 2023-02-20T22:40:00+08:00
draft: false
toc: true
comments: true
tags:
  - linux
---

## 概述

Linux 提供了一些可以配置的内核参数，来配置内核的行为。

这些内核参数的读取和配置，底层都是通过 `/proc/sys` 虚拟文件文件系统提供的。

一般情况下，不需要直接操作 `/proc/sys` 虚拟文件系统，而是通过如下方式进行配置：

* 临时配置，通过 `sysctl` 命令读取和配置。
    * 读取，如 `sudo sysctl net.ipv4.ip_forward`。
    * 配置，如 `sudo sysctl -w net.ipv4.ip_forward = 1`。
* 永久配置，通过编写 `/etc/sysctl.conf` 或 `/etc/sysctl.d/*` 进行配置。
    * 手动执行 `sudo sysctl -p` 将立即生效。
    * 重启后将永久生效。

本文将介绍一些常见的参数。

## 文件系统 watch

### `fs.inotify.max_user_watches`

该参数限制了一个用户最多可以监视的文件或目录的数量（debian 11 默认为 8192）。在使用 VSCode、启动热编译 Server （主要是前端场景）等，需要通过 inotify 机制，监听大量文件变更的场景中，建议调大该参数，如 `fs.inotify.max_user_watches=524288`。

### `fs.inotify.max_user_instances`

该参数限制了一个用户可以创建的 inotify 实例的数量（debian 11 默认为 128）。在使用 VSCode、启动热编译 Server （主要是前端场景）等场景，调大了 `fs.inotify.max_user_watches` 参数，仍然报错时，可以尝试同时调大该参数。

## 网络相关

### `net.ipv4.ip_forward`

是否开启 ipv4 的 ip 转发特性（debian 11 默认为 0）。当需要转发到达该主机的外部的数据包到其他网络接口时需要开启，具体场景如下：

* 当前主机安装了虚拟机、 Docker、 Kubenates 等虚拟化容器平台时。
* 当前主机作为二层/三层交换机，处理局域网的流量时。

### `net.ipv6.conf.all.forwarding`

和 ipv4 的 `net.ipv4.ip_forward` 一致，该参数是对应的 ipv6 的版本。其他参见上文。

### `net.ipv4.ip_local_port_range`

在 TCP/IP 协议中，一次网络通讯是由 `<local_ip, local_port, remote_ip, remote_port, proto>` 五元组标识的。在使用 Socket API 创建一个 TCP/UDP Client 时，我们实际上只给出了 `remote_ip, remote_port, proto`。而 `local_ip, local_port` 是有内核决定的。

其中 `local_port` 是内核随机选择的一个，而可选的范围就是 `net.ipv4.ip_local_port_range` 参数决定的。

`net.ipv4.ip_local_port_range` 在 debian 11 中，默认值为 `32768 61000` （这里的 32768 刚好是 `2^15`）。

当系统上的应用程序（作为客户端）需要打开大量的网络连接时，可能会出现本地端口号不够用的情况。可以通过调整 `net.ipv4.ip_local_port_range` 参数的值来增加可供分配的本地端口号的数量，从而缓解该问题。

特别注意的是：

* Kubenates Serivice 的 NodePort 的可选范围是 `30000-32767`，如果修改 `net.ipv4.ip_local_port_range`，那么 k8s 也要进行对应的修改，防止两者存在交叉。
* 在系统上运行的 TCP/IP Server 应用程序监听端口时，不要选择 `net.ipv4.ip_local_port_range` 范围内的端口。否则，可能存在小概率的端口冲突问题。

综上，万不得已不建议修改该参数。
