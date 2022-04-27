---
title: "Docker 开启 Ipv6"
date: 2022-04-21T00:22:33+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 背景知识

### IPv6

参考：[通过和 IPv4 对比，学习 IPv6](/posts/learn-ipv6-by-ipv4-diff/)

### Docker 网络

在 Docker 中，网络是一个重要抽象。一个 Docker 可以有多个网络，每个容器可以连接到一个或多个中。

docker 安装完成后，会自动创建三个网络，分别是 bridge、host 和 none。通过 `docker network ls`  命令可以查看：

```
NETWORK ID          NAME                        DRIVER              SCOPE
11da7fc827b4        bridge                      bridge              local
4cd2eae9c4cd        host                        host                local
12730ca5beca        none                        null                local
```

其中名字为 bridge 的 bridge 类型网络，就是 docker 的默认网络（`docker run` 默认使用的网络）。

默认网络的实现是在宿主机环境创建一个名为 docker0 的 bridge 设备，并为其配置一个私有网段的网关 IP 地址。通过 `ip addr show docker0` 可以查看更该设备信息。

```
3: docker0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:xx:xx:xx:xx:xx brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
       valid_lft forever preferred_lft forever
    inet6 fe80::xxxx:xx:xx:xxxx/64 scope link
       valid_lft forever preferred_lft forever
```

docker bridge 网络，在 IPv4 场景下拓扑如下所示（来自于：[KVM + LinuxBridge 的网络虚拟化解决方案实践](https://www.cnblogs.com/jmilkfan-fanguiju/p/10589727.html)）：

```
+----------------------------------------------------------------+-----------------------------------------+-----------------------------------------+
|                          Host                                  |              Container 1                |              Container 2                |
|                                                                |                                         |                                         |
|       +------------------------------------------------+       |       +-------------------------+       |       +-------------------------+       |
|       |             Newwork Protocol Stack             |       |       |  Newwork Protocol Stack |       |       |  Newwork Protocol Stack |       |
|       +------------------------------------------------+       |       +-------------------------+       |       +-------------------------+       |
|            ↑             ↑                                     |                   ↑                     |                    ↑                    |
|............|.............|.....................................|...................|.....................|....................|....................|
|            ↓             ↓                                     |                   ↓                     |                    ↓                    |
|        +------+     +--------+                                 |               +-------+                 |                +-------+                |
|        |.3.101|     |  .9.1  |                                 |               |  .9.2 |                 |                |  .9.3 |                |
|        +------+     +--------+     +-------+                   |               +-------+                 |                +-------+                |
|        | eth0 |     |   br0  |<--->|  veth |                   |               | eth0  |                 |                | eth0  |                |
|        +------+     +--------+     +-------+                   |               +-------+                 |                +-------+                |
|            ↑             ↑             ↑                       |                   ↑                     |                    ↑                    |
|            |             |             +-------------------------------------------+                     |                    |                    |
|            |             ↓                                     |                                         |                    |                    |
|            |         +-------+                                 |                                         |                    |                    |
|            |         |  veth |                                 |                                         |                    |                    |
|            |         +-------+                                 |                                         |                    |                    |
|            |             ↑                                     |                                         |                    |                    |
|            |             +-------------------------------------------------------------------------------|--------------------+                    |
|            |                                                   |                                         |                                         |
|            |                                                   |                                         |                                         |
|            |                                                   |                                         |                                         |
+------------|---------------------------------------------------+-----------------------------------------+-----------------------------------------+
             ↓
     Physical Network  (192.168.3.0/24)

```

通过 `docker network inspect bridge` 可以查看某该默认网络配置：

```
[
    {
        "Name": "bridge",
        "Id": "11da7fc827b4dxxx",
        "Created": "2021-11-22T12:04:03.408536176+08:00",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "172.17.0.0/16",
                    "Gateway": "172.17.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "0d744147030829f0247xx": {
                "Name": "container1",
                "EndpointID": "6f539a054ae35cbxx",
                "MacAddress": "02:42:xx:xx:xx:xx",
                "IPv4Address": "172.17.0.14/16",
                "IPv6Address": ""
            },
        },
        "Options": {
            "com.docker.network.bridge.default_bridge": "true",
            "com.docker.network.bridge.enable_icc": "true",
            "com.docker.network.bridge.enable_ip_masquerade": "true",
            "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
            "com.docker.network.bridge.name": "docker0",
            "com.docker.network.driver.mtu": "1500"
        },
        "Labels": {}
    }
]
```

默认网络和自定义 bridge，有如下不同：

* 自定义 bridge 网络会使用 docker 内嵌的 [dns server 服务](https://docs.docker.com/config/containers/container-networking/#dns-services)，配置地址为 `127.0.0.11`，通过 iptables 转发到 `43747` 端口。因此可以直接通过 container name 访问同一个自定义网络下的其他容器网络。而默认网络则不支持。
* 自定义 bridge 有更好的隔离性。
* 一个容器可以在运行时动态的连接/断开一个自定义 bridge，默认网络只能重新创建。
* 自定义 bridge 可以在创建的时候配置 Linux bridge，如果要修改默认网络的 bridge 则需要重启 docker daemon。

因此，官方更推荐在生产环境使用自定义 bridge 而非默认网络。

## 默认网络支持 IPv6

## 自定义网络支持 IPv6

## 通过 IPv6NAT 方式支持 IPv6

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
