---
title: "Docker 开启 IPv6"
date: 2022-04-21T00:22:33+08:00
draft: false
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

其中名字为 bridge 的 [bridge 类型网络](https://docs.docker.com/network/bridge/)，就是 docker 的默认网络（`docker run` 默认使用的网络）。

默认网络的实现是在宿主机环境创建一个名为 docker0 的 bridge 设备，并为其配置一个私有网段的网关 IP 地址。通过 `ip addr show docker0` 可以查看更该设备信息。

```
3: docker0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:xx:xx:xx:xx:xx brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
       valid_lft forever preferred_lft forever
    inet6 fe80::xxxx:xx:xx:xxxx/64 scope link
       valid_lft forever preferred_lft forever
```

docker [bridge 网络](https://docs.docker.com/network/bridge/)，在 IPv4 场景下拓扑如下所示（来自于：[KVM + LinuxBridge 的网络虚拟化解决方案实践](https://www.cnblogs.com/jmilkfan-fanguiju/p/10589727.html)）：

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

可以通过 [docker network create 命令](https://docs.docker.com/engine/reference/commandline/network_create/)，创建一个自定义 bridge 网络。关于，默认网络和自定义 bridge，有如下不同：

* 自定义 bridge 网络会使用 docker 内嵌的 [dns server 服务](https://docs.docker.com/config/containers/container-networking/#dns-services)，配置地址为 `127.0.0.11`，通过 iptables 转发到 `43747` 端口。因此可以直接通过 container name 访问同一个自定义网络下的其他容器网络。而默认网络则不支持。
* 自定义 bridge 有更好的隔离性。
* 一个容器可以在运行时动态的连接/断开一个自定义 bridge，默认网络只能重新创建。
* 自定义 bridge 可以在创建的时候配置 Linux bridge，如果要修改默认网络的 bridge 则需要重启 docker daemon。

因此，官方更推荐在生产环境使用自定义 bridge 而非默认网络。

## 默认网络支持 IPv6

> 本章节介绍的是如何配置默认的 bridge 网络支持 ipv6。（未经过测试，仅供参考）

前置条件：确保自己的设备被分配了一个 IPv6。通过 `ip addr show` 查看当前设备的 IPv6。其输出的物理网卡存在包含 `inet6` 和 `scope global` 的行时，表示该网卡支持 IPv6。需要注意的是：其 IPv6 地址的前缀不能是 `/128`，如果是 `/128`，参见：[通过 IPv6NAT 方式支持 IPv6](#通过-ipv6nat-方式支持-ipv6)。

```
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
    link/ether fa:16:xx:xx:xx:xx brd ff:ff:ff:ff:ff:ff
    inet 10.227.8.141/22 brd 10.227.11.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 2xxx:xxxx::xxxx/64 scope global
       valid_lft forever preferred_lft forever
    inet6 fe80::xxxx:xxxx:xxxx:xxxx/64 scope link
       valid_lft forever preferred_lft forever
```

修改 `/etc/docker/daemon.json`，其中 `fixed-cidr-v6` 是上一步获取到的 IPv6 网段的子网（配置默认网络，前缀长度最大为 `/80`）（参考：[官方文档](https://docs.docker.com/config/daemon/ipv6/)）。

```
{
  "ipv6": true,
  "fixed-cidr-v6": "2xxx:xxxx::/80"
}
```

reload 配置，docker daemon 将会使用 IPv6 网络。

```
sudo systemctl reload docker
```

通过 `docker network inspect bridge` 命令检查是否生效。若生效，则 `EnableIPv6` 值为 `true`，`IPAM.Config[1].Subnet` 是上一步配置的 `fixed-cidr-v6`。

注意经测试，如下场景可能不会生效：

* `/etc/docker/daemon.json` 存在 `"live-restore": true` 字段。
* reload 时有容器仍然存在。

根据众多[博客](https://medium.com/@skleeschulte/how-to-enable-ipv6-for-docker-containers-on-ubuntu-18-04-c68394a219a2)的说法，还需如下两步（docker 官方文档没有提及）（网络拓扑参见：[IPv6 with Docker](https://dker.ru/docs/docker-engine/user-guide/network-configuration/default-bridge-network/ipv6-with-docker/)）：

* `/etc/sysctl.conf` 添加，并执行 `sysctl -f`，配置宿主机和 docker0 网卡支持 NDP proxy。

    ```
    # docker0 是 docker 默认的网桥 (bridge)
    net.ipv6.conf.docker0.proxy_ndp=1
    # eth0 表示物理网卡，注意替换为物理网卡
    net.ipv6.conf.eth0.proxy_ndp=1
    ```

* 默认的 ndp 邻居发现配置仅允许单个 IP 配置。需要安装 ndppd 服务来转发邻居发现消息（这一步还有一个替代方案：手动为每一个容器配置如：`ip -6 neigh add proxy 2xxx:xxxx::1 dev ens3`，其中，`2xxx:xxxx::1` 为容器的分配的 IPv6，ens3 为宿主机绑定 IPv6 的网卡）。

    ```
    apt-get update -y
    apt-get install -y ndppd
    cp /usr/share/doc/ndppd/ndppd.conf-dist /etc/ndppd.conf
    ```

    * 更改 `proxy eth0 {` 行到宿主机绑定 IPv6 的网卡，如： `proxy ens3 {`。
    * 更改 `rule 1111:: {` 行为需要暴露的网段 `2xxx:xxxx::/80 {`。

    最后执行 `systemctl restart ndppd`

**注意：**

* 本方法仅针对新装 Docker 场景，如果是将 IPv6 升级到 IPv4，参见：[自定义网络支持 IPv6](#自定义网络支持-ipv6)。
* [本章节](#默认网络支持-ipv6) 和 [自定义网络支持 IPv6](#自定义网络支持-ipv6) 配置的 IPv6 和 docker 默认 IPv4 是不同的。
    * 容器的 IPv6 用的不是私有网段，而是宿主机网络或者是宿主机网络的一个子网。因此，宿主机所在的网络的所有实例可以直接通过 IPv6 的地址。也就是说：**容器的所有端口对于 IPv6 来说都是公开的，而无需 public**。
    * 而容器的 IPv4 分配的是私有网段，因此，容器网段和宿主机网段是通过 NAT 转发数据的，因此宿主机所在网络的其他实例是无法直接访问容器。也就是说：**容器的所有端口对于 IPv4 来说都是私有的，需 public 到 host 网络才能被外部访问到**。

## 自定义网络支持 IPv6

> 本章节介绍的是如何创建一个支持 IPv6 的 bridge 网络。（未经过测试，仅供参考）

* 前置条件：确保自己的设备被分配了一个 IPv6，参见：[默认网络支持 IPv6](#默认网络支持-ipv6)。
* 创建一个支持 IPv6 的 bridge 网络。其中 `--subnet` 参数为上一步获取到的 IPv6 网段的子网（自定义 bridge 网络，前缀长度不限制，可以大于于 80）。

    ```bash
    docker network create my-net-ipv6 --ipv6 --subnet="2xxx:xxxx::/80"
    ```

* 通过 `docker network inspect my-net-ipv6` 命令检查是否生效。若生效，则 `EnableIPv6` 值为 `true`，`IPAM.Config[1].Subnet` 是上一步配置的 `fixed-cidr-v6`。
* 创建容器时，通过 `--network my-net-ipv6` 参数，给容器开启 IPv6 网络，如 `docker run --network my-net-ipv6 -it busybox ip addr show`，可以看到，网卡被分配了 IPv6 地址。
* 配置网卡支持 NDP proxy 和 转发邻居发现消息。参见：[默认网络支持 IPv6](#默认网络支持-ipv6)。

**注意事项：**参见[默认网络支持 IPv6](#默认网络支持-ipv6) 第二条。

## 通过 IPv6NAT 方式支持 IPv6

> 测试可行，推荐使用该方式。

上文也提到，上文展示的方案，容器获得的 IPv6 IP 并不是私有网络 IP，是和外部网络直接连通，而不会经过 NAT。在如下场景下，以上方式可能不能满足要求：

* 安全性，要求容器的网络是私有的，需要容器的网络行为和 Docker IPv4 的行为一致，只有特定端口才能访问。
* 宿主机处于一个很小范围的网段（前缀大于 `/80`），如 `xxx::xx/128`，没有多余的 IPv6 可以分给容器。

此时就需要，给容器配置一个私有 IPv6 网段，并启用 NAT。

但是 Docker 官方并没有内置 IPv6 的 NAT，如果想要使用 IPv6 NAT，需要安装外挂的 IPv6 启动，参见：[robbertkl/docker-ipv6nat](https://github.com/robbertkl/docker-ipv6nat)。

有这这些准备后，实施步骤如下所示：

* 使用如下命令，后台启动 IPv6 NAT（通过 `--restart always` 配置了开机自启）。

    ```
    docker run -d --name ipv6nat --privileged --network host --restart always -v /var/run/docker.sock:/var/run/docker.sock:ro -v /lib/modules:/lib/modules:ro robbertkl/ipv6nat
    ```

* 和 [自定义网络支持 IPv6](#自定义网络支持-ipv6) 类似，创建一个支持 IPv6 的 bridge 网络。其中 `--subnet` 参数为 `fe80::/10` 的一个子网。

    ```bash
    docker network create my-net-ipv6 --ipv6 --subnet="fd00:1::1/80" --gateway="fd00:1::1"
    ```

* 通过 `docker network inspect my-net-ipv6` 命令检查是否生效。若生效，则 `EnableIPv6` 值为 `true`，`IPAM.Config[1].Subnet` 是上一步配置的 `fixed-cidr-v6`。
* 创建容器时，通过 `--network my-net-ipv6` 参数，给容器开启 IPv6 网络，如 `docker run --network my-net-ipv6 -it busybox sh`：
    * `ip addr show` ，可以看到，网卡被分配了 IPv6 地址。
    * `wget https://ipv6.icanhazip.com  -O /dev/stdout 2>/dev/null` 可以看到出网 IPv6 地址。

## 参考

* [How to enable IPv6 for Docker containers on Ubuntu 18.04](https://medium.com/@skleeschulte/how-to-enable-ipv6-for-docker-containers-on-ubuntu-18-04-c68394a219a2)
* [Docker Docs: Use bridge networks](https://docs.docker.com/network/bridge/)
* [KVM + LinuxBridge 的网络虚拟化解决方案实践](https://www.cnblogs.com/jmilkfan-fanguiju/p/10589727.html)
* [Docker Docs: docker network create 命令](https://docs.docker.com/engine/reference/commandline/network_create/)
* [Docker Docs: dns server 服务](https://docs.docker.com/config/containers/container-networking/#dns-services)
* [Docker Docs: Enable IPv6 support](https://docs.docker.com/config/daemon/ipv6/)
* [IPv6 with Docker（网络拓扑视角）](https://dker.ru/docs/docker-engine/user-guide/network-configuration/default-bridge-network/ipv6-with-docker/)
* 本文未提及的 IPvlan 模式 [Build a Docker IPv6 Network](https://dev.to/joeneville_/build-a-docker-ipv6-network-dfj) | [Docker Docs: Use IPvlan networks](https://docs.docker.com/network/ipvlan/)
