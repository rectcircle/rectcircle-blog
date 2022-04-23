---
title: "Docker 开启 Ipv6"
date: 2022-04-21T00:22:33+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## IPv6 基础知识

```
docker run -d --name ipv6nat --privileged --network host --restart unless-stopped -v /var/run/docker.sock:/var/run/docker.sock:ro -v /lib/modules:/lib/modules:ro robbertkl/ipv6nat
docker network create my-net-ipv6 --ipv6 --subnet="fd00:1::1/80" --gateway="fd00:1::1"
docker run -u root --network my-net-ipv6  -it --entrypoint bash debian:11
```

* ipv6nat
    * https://github.com/robbertkl/docker-ipv6nat
    * net create https://docs.docker.com/engine/reference/commandline/network_create/
    * 博客说明 https://medium.com/@skleeschulte/how-to-enable-ipv6-for-docker-containers-on-ubuntu-18-04-c68394a219a2
* 不适用 ipv6nat 的其他方案 https://blog.apnic.net/2021/07/06/docker-ipv6-networking-routing-and-ndp-proxying/  
* docker ipv6 规划 https://dker.ru/docs/docker-engine/user-guide/network-configuration/default-bridge-network/ipv6-with-docker/
    * 方式一：宿主机分配了一整个 ipv6 网段
    * 方式二 NDP：宿主机只分配了一个 ip，但允许该主机分配其他网络。
    * https://gdevillele.github.io/engine/userguide/networking/default_network/ipv6/
* 配置默认 bridge 方法
    * 官方文档 https://docs.docker.com/config/daemon/ipv6/ https://docs.docker.com/network/bridge/#use-ipv6
    * 原理 https://blog.csdn.net/taiyangdao/article/details/83066009
    * https://www.cxyzjd.com/article/taiyangdao/83066009
    * 官方的翻译 https://dev.to/joeneville_/build-a-docker-ipv6-network-dfj
    * https://ungleich.ch/u/blog/how-to-enable-ipv6-in-docker/
    * 中文 https://os.51cto.com/article/677069.html
* ipv6 基础
    * scope link
    * scope global
