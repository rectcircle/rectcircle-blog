---
title: "Linux 网络虚拟化技术（三）bridge 虚拟设备"
date: 2022-05-15T00:24:21+08:00
draft: false
toc: true
comments: true
tags:
  - linux
---

> 参考：[Network bridge](https://wiki.archlinux.org/title/Network_bridge) | [Linux虚拟网络设备之bridge(桥)](https://segmentfault.com/a/1190000009491002)

## 简介

bridge 桥，是 Linux 中的一种虚拟网络设备，一般用于虚拟机或容器的网络流量管理。

bridge 具有现实中二层交换机的一切特性：判断包的类别（广播/单点），查找内部 MAC 端口映射表，定位目标端口号，将数据转发到目标端口或丢弃，自动更新内部 MAC 端口映射表以自我学习。

此外，bridge 设备自己有一个 Mac 地址，并可以绑定一个 IP 地址。换句话说 bridge 存在一个隐含的网络接口连接到本机的 Network Protocol Stack。

物理设备（如 eth）和虚拟设备（上篇提到的 veth 以及下文即将提到的 tap/tun）均可连接到 bridge 中，一个设备连接到 bridge 意味着：

* 该设备配置其主（master）设备为该 bridge，该设备自身变成从设备 （slave）（brport）。
* 换句话说。该设备变成了一根网线，Mac 地址变得没有意义。
    * 发送到该设备的数据，不做任何逻辑判断，直接到达 bridge。
    * bridge 发送该设备的数据，不做任何逻辑判断，直接到达该设备的另一端。
* 也就是说，这个设备的另一端看到的是 bridge 的 Mac 地址。如下图所示：
    * eth0 网线的另一端看到的是 br0 的 Mac 地址。
    * veth1 看到的是 br0 的 Mac 地址。

```
+----------------------------------------------------------------+
|                                                                |
|       +------------------------------------------------+       |
|       |             Network Protocol Stack             |       |
|       +------------------------------------------------+       |
|                         ↑                           ↑          |
|.........................|...........................|..........|
|                         ↓                           ↓          |
|        +------+     +--------+     +-------+    +-------+      |
|        |      |     |Mac Addr|     |       |    |       |      |
|        +------+     +--------+     +-------+    +-------+      |
|        | eth0 |<--->|   br0  |<--->| veth0 |    | veth1 |      |
|        +------+     +--------+     +-------+    +-------+      |
|            ↑                           ↑            ↑          |
|            |                           |            |          |
|            |                           +------------+          |
|            |                                                   |
+------------|---------------------------------------------------+
             ↓
     Physical Network
```

此外，当一个 bridge 连接了 1 个或多个从设备后，该 bridge 的 mac 地址将变成这些从设备的 mac 地址中的一个。

## 常见操作和命令

在 Linux 中，有很多命令行工具可以操作 bridge，如：

* `iproute2` 包：`ip`、`bridge`。
* `bridge-utils` 包：`brctl`（已废弃）。
* [`netctl` 包](https://wiki.archlinux.org/title/Bridge_with_netctl)。
* [systemd-networkd 包](https://wiki.archlinux.org/title/Systemd-networkd#Bridge_interface)。

本部分仅介绍 `iproute2` 包提供的命令。其他参见：[Network bridge](https://wiki.archlinux.org/title/Network_bridge)。

下文描述的 bridge 名为 `br0`。

### 创建并启动

```bash
sudo ip link add name br0 type bridge
sudo ip link set br0 up
```

### 连接/断开其他设备

```bash
# 连接
ip link set 设备名 master br0
# 断开
ip link set 设备名 nomaster
```

### 查看连接设备

```bash
sudo bridge link
```

### 分配 IP

```bash
ip address add dev bridge_name 192.168.66.66/24
```

### 删除

```bash
ip link delete bridge_name type bridge
```

## Go API

其 API 风格和 `ip` 命令类似，因此参考：[vishvananda/netlink docs](https://pkg.go.dev/github.com/vishvananda/netlink) ，调用对应函数即可实现。

## 实验和说明

首先创建，名为 br0 的 bridge，名为 veth0/veth0peer、veth1/veth1peer 的两对 veth。

并将物理网卡 enp0s9、veth0、veth1 连接到 br0 中。

然后分配 IP：

* 删除 enp0s9 的 IP。
* veth0peer 配置 IP `192.168.57.4`。
* veth1peer 配置 IP `192.168.57.5`。

然后，然后观察 br0、veth0peer、veth1peer 的 Mac 地址，使用 ping 观察连通性。

拓扑如下图所示：

最后，为 br0 配置 IP 地址为 `192.168.57.3`。再次使用 ping 观察连通性。

```

+-----------------------------------------------------------------------+
|                                                                       |
|       +------------------------------------------------+              |
|       |             Network Protocol Stack             |              |
|       +------------------------------------------------+              |
|                         ↑                           ↑                 |
|.........................|...........................|.................|
|                         ↓                           ↓                 |
|        +------+     +--------+     +-------+    +---------+           |
|        |      |     | .57.3  |     |       |    |.57.4    |           |
|        +------+     +--------+     +-------+    +---------+           |
|        |enp0s9|<--->|   br0  |<--->| veth0 |    |veth0peer|    veth.. |
|        +------+     +--------+     +-------+    +---------+           |
|            ↑                           ↑            ↑                 |
|            |                           |            |                 |
|            |                           +------------+                 |
|            |                                                          |
+------------|----------------------------------------------------------+
             ↓
     Physical Network
```

注意：如上拓扑仅仅为了介绍 Bridge 的特性。该模型，无法在生产环境使用。

### 实验准备

为待实验拟虚拟机（VirtualBox）添加一个新的网卡：

* 新建一个网络界面：vboxnet1，地址 `192.168.57.1/24`。
* 网卡 3：仅主机网络，界面名称 vboxnet1，启用混杂模式。
* 启动虚拟机
    * 修改 `/etc/network/interfaces` 添加

        ```
        auto enp0s9
        iface enp0s9 inet dhcp
        ```

    * 应用网络配置 `sudo systemctl restart networking.service`

此时，网络拓扑，如下图所示：

```
+----------------------------------------------------------------+
|                                                                |
|       +------------------------------------------------+       |
|       |             Network Protocol Stack             |       |
|       +------------------------------------------------+       |
|            ↑                                                   |
|............|...................................................|
|            ↓                                                   |
|        +------+                                                |
|        |.57.3 |                                                |
|        +------+                                                |
|        |enp0s9|                                                |
|        +------+                                                |
|            ↑                                                   |
|            |                                                   |
|            |                                                   |
|            |                                                   |
+------------|---------------------------------------------------+
             ↓
     Physical Network
```

执行 `ip addr show`，输出如下：

```
...
4: enp0s9: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:fd:98:73 brd ff:ff:ff:ff:ff:ff
    inet 192.168.57.3/24 brd 192.168.57.255 scope global dynamic enp0s9
       valid_lft 469sec preferred_lft 469sec
    inet6 fe80::a00:27ff:fefd:9873/64 scope link 
       valid_lft forever preferred_lft forever
```

### bridge 不配置 IP

操作过程如下：

```bash
# 创建两对 veth
sudo ip link add veth0 type veth peer name veth0peer
sudo ip link add veth1 type veth peer name veth1peer
# 给这两对 veth 的对侧配置 ip 地址
sudo ip addr add 192.168.57.4/24 dev veth0peer
sudo ip addr add 192.168.57.5/24 dev veth1peer
# 启动这两对网卡
sudo ip link set veth0 up
sudo ip link set veth1 up
sudo ip link set veth0peer up
sudo ip link set veth1peer up
# 允许从非 lo 设备进来的数据包的源 IP 地址是本机地址
sudo sysctl -w net.ipv4.conf.veth0.accept_local=1
sudo sysctl -w net.ipv4.conf.veth0peer.accept_local=1
sudo sysctl -w net.ipv4.conf.veth1.accept_local=1
sudo sysctl -w net.ipv4.conf.veth1peer.accept_local=1

# 删除物理网络接口 enp0s9 的 IP 地址
sudo ip addr del 192.168.57.3/24 dev enp0s9

# 创建设置并启动 br0
sudo ip link add name br0 type bridge
sudo ip link set dev veth0 master br0
sudo ip link set dev veth1 master br0
sudo ip link set dev enp0s9 master br0
sudo ip link set br0 up
```

此时网络拓扑如下图所示：

```

+-----------------------------------------------------------------------+
|                                                                       |
|       +------------------------------------------------+              |
|       |             Network Protocol Stack             |              |
|       +------------------------------------------------+              |
|                                                     ↑                 |
|.....................................................|.................|
|                                                     ↓                 |
|        +------+     +--------+     +-------+    +---------+           |
|        |      |     |        |     |       |    |.57.4    |   .57.5   |
|        +------+     +--------+     +-------+    +---------+           |
|        |enp0s9|<--->|   br0  |<--->| veth0 |    |veth0peer|    veth.. |
|        +------+     +--------+     +-------+    +---------+           |
|            ↑                           ↑            ↑                 |
|            |                           |            |                 |
|            |                           +------------+                 |
|            |                                                          |
+------------|----------------------------------------------------------+
             ↓
     Physical Network
```

#### 通过 veth0 ping veth0peer

```
ping -c 1 192.168.57.4 -I veth0
```

输出如下：

```
ping: Warning: source address might be selected on device other than: veth0
PING 192.168.57.4 (192.168.57.4) from 10.0.2.15 veth0: 56(84) bytes of data.

--- 192.168.57.4 ping statistics ---
1 packets transmitted, 0 received, 100% packet loss, time 0ms
```

可以看出，无法 ping 通。整个流量路径为：

* Network Protocol Stack 通过 veth0 发起 arp 请求（`sudo tcpdump -n -i veth0`）。
* veth0peer 收到请求，发送 arp 回复（`sudo tcpdump -n -i veth0peer`）。
* veth0 收到 arp 回复，直接**发送给 br0**（`sudo tcpdump -n -i veth0`）。
* br0 没有配置 ip，不会将 arp 回复到 Network Protocol Stack（`sudo tcpdump -n -i br0`），所以直接丢弃。

#### 通过 veth0peer ping veth1peer

```
ping -c 2 192.168.57.5 -I veth0peer
```

输出如下：

```
PING 192.168.57.5 (192.168.57.5) from 192.168.57.4 veth0peer: 56(84) bytes of data.
64 bytes from 192.168.57.5: icmp_seq=1 ttl=64 time=0.070 ms

--- 192.168.57.5 ping statistics ---
2 packets transmitted, 1 received, 50% packet loss, time 1026ms
rtt min/avg/max/mdev = 0.070/0.070/0.070/0.000 ms
```

可以看出第一次可以 ping 通，可以这么理解： 网络接口 veth0peer、veth1peer 和 二层交换机 br0 相连。

第二次无法 ping 通的原因，原因参见下文：[拓扑和流量分析](#拓扑和流量分析)。

#### 在虚拟机外部 ping

```
ping 192.168.57.5
```

经测试（Mac VirtualBox v 6.1.34），时通时不通，原因参见下文：[拓扑和流量分析](#拓扑和流量分析)。

### bridge 配置 IP

在上文 [bridge 不配置 IP](#bridge-不配置-ip) 的基础上，执行如下命令。

```
sudo ip addr add 192.168.57.3/24 dev br0
```

此时网络拓扑如下图所示：

```

+-----------------------------------------------------------------------+
|                                                                       |
|       +------------------------------------------------+              |
|       |             Network Protocol Stack             |              |
|       +------------------------------------------------+              |
|                                                     ↑                 |
|.....................................................|.................|
|                                                     ↓                 |
|        +------+     +--------+     +-------+    +---------+           |
|        |      |     |.57.3   |     |       |    |.57.4    |   .57.5   |
|        +------+     +--------+     +-------+    +---------+           |
|        |enp0s9|<--->|   br0  |<--->| veth0 |    |veth0peer|    veth.. |
|        +------+     +--------+     +-------+    +---------+           |
|            ↑                           ↑            ↑                 |
|            |                           |            |                 |
|            |                           +------------+                 |
|            |                                                          |
+------------|----------------------------------------------------------+
             ↓
     Physical Network
```

#### 通过 veth0 ping veth0peer

和不配置 ip 效果一致。

#### 通过 veth0peer ping veth1peer

和不配置 ip 效果一致。

#### 在虚拟机外部 ping

和不配置 ip 效果一致。

ping br0 的 ip 地址仍然是，时通时不通，原因参见下文：[拓扑和流量分析](#拓扑和流量分析)。

### 恢复现场

```
sudo ip link delete veth0
sudo ip link delete veth1
sudo ip link delete br0
sudo ip addr add 192.168.57.3/24 dev enp0s9
```

### 拓扑和流量分析

我们知道，bridge 对应的是物理设备的二层交换机，我们将上述实验拓扑图可以简化为下图：

* br0 bridge 的就是二层交换机。
* br0 是二层交换机自带的一个网络接口 ，和 Network Protocol Stack 相连。
* enp0s9、veth0、veth1 是二层交换机的接口。
* gateway （enp0s9 对应的物理网关）、veth0peer、veth1peer 是网络接口
    * 一端通过 link （物理或虚拟链路） 和二层交换机的接口相连。
    * 另一端和一个 Network Protocol Stack 相连，有如下几种情况：
        * 和 br0 处于同一 Network Protocol Stack（本实验的 vethxpeer 是这种）。
        * 和 br0 处于不同的 Network Protocol Stack（即不同的 network namespace，真正在生产环境常见的）。
        * 其他物理设备的 Network Protocol Stack （如路由器/虚拟机所在宿主机）（本实验的 enp0s9是这种）。

```
  Network Protocol Stack -----------------+
            |                             |
           br0                            |        network interface (default)
            |                             |
        br0 bridge                        |
            |                             |
    +--------------------+                |
    |       |            |                |
 enp0s9   veth0        veth1              |        bridge interface
    |       |            |                |        link
 gateway  veth0peer    veth1peer          |        network interface (others)
            |            |                |
            +------------+----------------+
```

#### 为什么 enp0s9 需要开启混杂模式？

按照如上实验，veth0peer、veth1peer、br0 网络接口处于同一个 Network Protocol Stack，具有独立的 Mac 地址。因此，当 gateway 需要访问，veth0、veth1 或 br0 时，在数据链路层目标 Mac 地址并非是 enp0s9 地址，而是 veth0、veth1 或 br0 的地址。

如果不开启混杂模式，enp0s9 将会直接丢弃这些二层数据包，导致无法访问。（因为在虚拟机中进行实验，所以需要在虚拟机配置页面配置开启混杂模式，而不是通过命令

#### 为什么上文实验时通时不通

通过执行如下命令，发现几个奇怪的点，但是并不确定这些是不是问题的原因。

* 抓取 网络接口 数据包
    * `sudo tcpdump -e -n -i br0`
    * `sudo tcpdump -e -n -i veth0peer`
    * `sudo tcpdump -e -n -i veth1peer`
    * `sudo tcpdump -e -n -i enp0s9`
* 查看 网络接口 地址 `ip addr show`
* 参看 bridge 的 fdb （Mac 地址表） `sudo bridge fdb show | grep br0`

**奇怪点一**

通过多次执行 `sudo bridge fdb show | grep br0` 发现，ping 不通的时候，veth0peer、veth1peer 的 mac 地址对应的二层交换机的接口并不是 veth0 和 veth1，而变成了 enp0s9。通过抓包，确实可以看到，enp0s9 收到了 ping 请求。

这一点是可以确定是 ping 不通的表面原因。但是为什么会出现 Mac 地址表错误记录。并没有定位到，可能的方向是：

* `ICMP6, router solicitation` 相关包导致的，经观察，当出现这些包时，Mac 地址表出现错误。
* 第一次 ping 基本上都能 ping 通，从第二次开始 ping 不通，经过多次抓包，发现 ARP 有些诡异。具体参见下文奇怪点二。

**奇怪点二**

假设通过 veth0peer ping veth1peer，此时 Network Protocol Stack 会通过 veth0peer 发起一个 arp 请求。因为 arp 请求在数据链路层是广播，会到达 br0、gateway、veth0peer、veth1peer，按照直觉来看，只有 veth1peer 回复了 arp。

但是，Linux 的处理是：veth0peer、veth1peer 都会回复 arp，从 br0 抓包来看，即回复了 veth1peer 的 mac 地址也回复了 veth0peer 的 mac，而且收到了 4 个回复包。

这一点，[Harping on ARP](https://lwn.net/Articles/45373/) 似乎有所讨论，但是不太理解。

### 其他说明

* 从上文可以看出， Bridge 和 连接到 Bridge 的 veth 网络接口（如 veth0peer、veth1peer）  处于同一 network namespace，则会出现 arp 问题。所以在生产环境：连接 bridge 的 veth 网络接口一般位于独立的 network namespace。
* 上文可以看出，外部网络通过 enp0s9 访问 veth0peer、veth1perr，mac 地址就不是物理网卡的 mac 地址，而是这两个网络接口的 mac 地址，因此如果 enp0s9 是一个 wifi 网络接口，则无法访问，因为 wifi 认证是绑定 mac 地址的，解决办法是（均为测试过）：
    * 方式一：将 veth0peer、veth1peer 等网络接口的地址配置的和 enp0s9 一致。
    * 方式二：参见 [wiki](https://wiki.archlinux.org/title/Network_bridge#Wireless_interface_on_a_bridge)。

## Bridge 生产环境实例

### 个人设备虚拟机

* bridge 通过 tun/tap 和虚拟机网络接口相连。
* bridge 物理网络接口 eth0 和外部网络相连。
* bridge 不配置 ip 地址。

```
+----------------------------------------------------------------+-----------------------------------------+-----------------------------------------+
|                          Host                                  |              VirtualMachine1            |              VirtualMachine2            |
|                                                                |                                         |                                         |
|       +------------------------------------------------+       |       +-------------------------+       |       +-------------------------+       |
|       |             Newwork Protocol Stack             |       |       |  Newwork Protocol Stack |       |       |  Newwork Protocol Stack |       |
|       +------------------------------------------------+       |       +-------------------------+       |       +-------------------------+       |
|                          ↑                                     |                   ↑                     |                    ↑                    |
|..........................|.....................................|...................|.....................|....................|....................|
|                          ↓                                     |                   ↓                     |                    ↓                    |
|                     +--------+                                 |               +-------+                 |                +-------+                |
|                     | .3.101 |                                 |               | .3.102|                 |                | .3.103|                |
|        +------+     +--------+     +-------+                   |               +-------+                 |                +-------+                |
|        | eth0 |<--->|   br0  |<--->|tun/tap|                   |               | eth0  |                 |                | eth0  |                |
|        +------+     +--------+     +-------+                   |               +-------+                 |                +-------+                |
|            ↑             ↑             ↑                       |                   ↑                     |                    ↑                    |
|            |             |             +-------------------------------------------+                     |                    |                    |
|            |             ↓                                     |                                         |                    |                    |
|            |         +-------+                                 |                                         |                    |                    |
|            |         |tun/tap|                                 |                                         |                    |                    |
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

该拓扑来自博客：[Linux虚拟网络设备之bridge(桥)](https://segmentfault.com/a/1190000009491002#item-6-1)，未经实验。

### Docker Bridge 网络

* bridge 内置网络接口和连接到该 bridge 的 veth 的网络接口，位于一个私有网段。
* bridge 内置网络接口 ip 是该私有网段的网关 ip。
* bridge 通过 veth 和位于独立 network namespace 的网络接口相连。
* 流量先到达内置网络接口（网关），然后通过 NAT 通过物理网络接口 eth0 与外界网络连通。

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

该拓扑来自博客：[Linux虚拟网络设备之bridge(桥)](https://segmentfault.com/a/1190000009491002#item-6-1)，是 Docker 的默认网络以及自定义 bridge 网络的模型。

在下一篇介绍 netfilter 中，将介绍实战搭建该网络模型。
