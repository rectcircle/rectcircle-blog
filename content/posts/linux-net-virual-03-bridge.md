---
title: "Linux 网络虚拟化技术（三）bridge 虚拟设备"
date: 2022-04-21T00:24:21+08:00
draft: true
toc: true
comments: true
tags:
  - linux
---

## bridge 虚拟设备

### 功能特性

https://www.cnblogs.com/jmilkfan-fanguiju/p/10589727.html

Linux虚拟网络设备之bridge(桥) https://segmentfault.com/a/1190000009491002
11、网络--Linux Bridge（网桥基础） 原创 https://blog.51cto.com/hostman/2106155

## netfilter 模块

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

Linux 虚拟网络设备详解之 Bridge 网桥  https://www.cnblogs.com/bakari/p/10529575.html
一文总结 Linux 虚拟网络设备 eth, tap/tun, veth-pair https://www.cnblogs.com/bakari/p/10494773.html

简述linux路由表 https://yuerblog.cc/2019/11/18/%E7%AE%80%E8%BF%B0linux%E8%B7%AF%E7%94%B1%E8%A1%A8/
