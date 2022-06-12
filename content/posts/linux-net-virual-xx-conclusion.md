---
title: "Linux 网络虚拟化技术（七）总结"
date: 2022-04-21T00:24:21+08:00
draft: true
toc: true
comments: true
tags:
  - linux
---

## 场景分析

路由器中的br0、eth0、wlan0、wlan1、vlan0、vlan1分别代表什么意思？ http://www.51cos.com/?p=1749
Openwrt 接口及基本设置 https://einverne.github.io/post/2017/03/openwrt-settings-and-tips.html
Openwrt常用接口简介 https://blog.csdn.net/toyijiu/article/details/115523906
KVM + LinuxBridge 的网络虚拟化解决方案实践  https://www.cnblogs.com/jmilkfan-fanguiju/p/10589727.html

什么？网卡也能虚拟化？ https://mp.weixin.qq.com/s?__biz=MzI1OTY2MzMxOQ==&mid=2247485246&idx=1&sn=c42a3618c357ebf5f6b7b7ce78ae568f&chksm=ea743386dd03ba90ad65940321385f68f9315fec16d82a08efa12c18501d8cadf95cf9e614a2&scene=21#wechat_redirect

Docker 网络模型之 macvlan 详解，图解，实验完整  https://www.cnblogs.com/bakari/p/10893589.html

docker 网络相关文档 https://docs.docker.com/network/ipvlan/#prerequisites

仔细阅读 https://www.cnblogs.com/bakari/
