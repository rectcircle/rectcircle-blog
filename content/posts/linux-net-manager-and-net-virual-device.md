---
title: "Linux 网络管理和网络虚拟设备"
date: 2022-04-21T00:24:21+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

https://www.cnblogs.com/jmilkfan-fanguiju/p/10589727.html （交换机？）
https://segmentfault.com/a/1190000009249039
https://segmentfault.com/a/1190000009251098
https://segmentfault.com/a/1190000009491002

ip_forward与路由转发  https://blog.51cto.com/13683137989/1880744

主要看 iptable（netfilter）、bridge、veth 原理。

实战按照 ip 命令（iproute2），c 语言库（https://man7.org/linux/man-pages/man7/netlink.7.html）， go 语言（github.com/vishvananda/netlink）库来操作这些设备。

https://morven.life/posts/networking-2-virtual-devices/

nat 端口转发和路由网关 https://blog.jmal.top/s/iptables-nat-port-forwarding-route-gateway
