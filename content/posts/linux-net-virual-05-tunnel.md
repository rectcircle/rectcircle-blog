---
title: "Linux 网络虚拟化技术（五）隧道技术"
date: 2022-06-19T23:11:00+08:00
draft: false
toc: true
comments: true
tags:
  - linux
---

## tun/tap 虚拟设备

### 概述

TUN (network TUNnel) / TAP (network TAP) 是 Linux 提供的的两种虚拟网络设备（也是一个网络接口，因此需配置 ip 网段）。该设备一端连接内核网络网络协议栈，一端连接用户态进程的一个文件描述符。

在内核网络协议栈中处理该数据包时，根据目标 IP 和路由表判断，需要从该网络接口设备发出时，与该设备绑定的用户态进程的文件描述符将 read 系统调用将读到数据。

用户态进程调用 write 系统调用向与该设备绑定的文件描述符写数据时，该设备会将写入的数据流当做网络数据包发送到内核网络协议栈中。

一般情况下，用户态进程在读取到数据后，会通过一个 TCP/UDP socket 将数据发送到远端主机，远端主机接收到数据库在将数据转发到目标，这样在本机和远端主机之间通过 tun/tap 和 socket 建立了一个隧道。

下图是一个 VPN Client 侧的网络拓扑：

```
+----------------------------------------------------------------+
|                                                                |
|  +--------------------+      +--------------------+            |
|  | User Application A |      | User Application B |<-----+     |
|  +--------------------+      +--------------------+      |     |
|               | 1                    | 5                 |     |
|...............|......................|...................|.....|
|               ↓                      ↓                   |     |
|         +----------+           +----------+              |     |
|         | socket A |           | socket B |              |     |
|         +----------+           +----------+              |     |
|                 | 2               | 6                    |     |
|.................|.................|......................|.....|
|                 ↓                 ↓                      |     |
|             +------------------------+                 4 |     |
|             | Newwork Protocol Stack |                   |     |
|             +------------------------+                   |     |
|                | 7                 | 3                   |     |
|................|...................|.....................|.....|
|                ↓                   ↓                     |     |
|        +----------------+    +----------------+          |     |
|        |      eth0      |    |      tun0      |          |     |
|        +----------------+    +----------------+          |     |
|    10.32.0.11  |                   |   192.168.3.11      |     |
|                | 8                 +---------------------+     |
|                |                                               |
+----------------|-----------------------------------------------+
                 ↓
         Physical Network
```

简而言之，tun/tap 提供了一种在用户态进程，对数据包进行自定义处理的机制。一般用来实现 Tunnel/VPN。

tun 和 tap 两种设备的唯一区别在于数据包类型上：

* tun 处理的是 ip 数据包（三层）。
* tap 处理的是 以太网数据包（二层）。

### 系统调用

> [ioctl(2)](https://man7.org/linux/man-pages/man2/ioctl.2.html) | [netdevice(7)](https://man7.org/linux/man-pages/man7/netdevice.7.html)

```cpp
#include <fcntl.h>
#include <sys/ioctl.h>
#include <net/if.h>     // #define TUNSETIFF     _IOW('T', 202, int) 

int fd = open("/dev/net/tun", O_RDWR);    // ignore error
int ioctl(fd, SIOCSIFNETMASK, struct *ifreq ifr);
```

* 使用 `open` 系统调用，打开 `"/dev/net/tun"` 文件，将会获取一个可以读写的文件描述符。
* 通过 `ioctl` 系统调用，将文件描述符和一个 tun/tap 设备进行关联。
    * 如果 `struct *ifreq ifr` 指向的 tun/tap 设备已存在，则仅仅将文件描述符和虚拟网络设备关联，本进程退出后，该设备仍然存在。
    * 如果 `struct *ifreq ifr` 指向的 tun/tap 设备不存在，则内核创建一个 tun/tap 设备（通过： ip addr show 可以看到），并将文件描述符和虚拟网络设备关联，本进程退出后，该设备将自动被删除。

### 命令行创建

```bash
sudo ip tuntap add dev tun-sample mode tun
```

### Go 语言 SDK

github 有一个 star 为 `1.5k` 的 tun/tap 的第三方库 [`songgao/water`](https://github.com/songgao/water)。该库屏蔽了 tun/tap 在不同操作系统的差异。

上述库仅仅是 syscall 的简单封装，通过 Go 标准库的 syscall 包，同时参考上述项目源码，也可以很容易的 tun/tap。

### 实验和说明

> 参考： [Linux虚拟网络设备之tun/tap](https://segmentfault.com/a/1190000009249039) | [Universal TUN/TAP device driver](https://www.kernel.org/doc/html/v5.8/networking/tuntap.html)

编写一个简单的实验程序。该程序，会创建一个 tun 设备，配置该 tun 设备网络信息为 `172.16.2.1/16`，并打印从该 tun 设备中读取到的 ip 数据包的大小。

这种读写 tun/tap 的程序，被称为 tun/tap 驱动程序。

```cpp
// gcc ./src/c/05-tun-tap/01-sample-tun.c && sudo ./a.out
// 修改自：https://segmentfault.com/a/1190000009249039
#include <net/if.h>
#include <sys/ioctl.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <string.h>
#include <sys/types.h>
#include <linux/if_tun.h>
#include <stdlib.h>
#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include <arpa/inet.h>

const char *tun_name = "tun-sample";
const char *tun_ip = "172.16.2.1";
const char *tun_net_mask = "255.255.0.0";

int set_tun_if(char *if_name)
{
    // 简单起见，使用传统的 ioctl 系统调用，而非 netlink api。
    int sockfd, err;
    struct ifreq ifr;
    struct sockaddr_in *addr;

    sockfd = socket(AF_INET, SOCK_DGRAM, 0);
    if (sockfd < 0)
        return 0;

    memset(&ifr, 0, sizeof ifr);
    strncpy(ifr.ifr_name, if_name, IFNAMSIZ);

    // 设置 ip
    ifr.ifr_addr.sa_family = AF_INET;
    addr = (struct sockaddr_in *)&ifr.ifr_addr;
    inet_pton(AF_INET, tun_ip, &addr->sin_addr);
    if (err = ioctl(sockfd, SIOCSIFADDR, &ifr) < 0)
        return err;
    // 设置网络掩码
    ifr.ifr_netmask.sa_family = AF_INET;
    addr = (struct sockaddr_in *)&ifr.ifr_netmask;
    inet_pton(AF_INET, tun_net_mask, &addr->sin_addr);
    if (err = ioctl(sockfd, SIOCSIFNETMASK, &ifr) < 0)
        return err;

    // 启动接口
    ifr.ifr_flags |= IFF_UP;
    if (err = ioctl(sockfd, SIOCSIFFLAGS, &ifr) <0)
        return err;
    close(sockfd);
    return 0;
}


int tun_alloc(int flags)
{

    // 没有找到如何使用 netlink 创建 tun 设备的相关示例。
    // https://man7.org/linux/man-pages/man7/netdevice.7.html
    struct ifreq ifr;
    int fd, err;
    char *clonedev = "/dev/net/tun";

    // 打开 /dev/net/tun 文件，即创建一个用于收发 tun 虚拟网络设备的文件描述符
    // 该文件一般是 o666 权限，因此不需要特殊权限。
    if ((fd = open(clonedev, O_RDWR)) < 0)
    {
        return fd;
    }

    // 设置 tun 虚拟网络设备
    memset(&ifr, 0, sizeof(ifr));
    ifr.ifr_flags = flags;  // 设置设备标志
    strncpy(ifr.ifr_name, tun_name, IFNAMSIZ); // 设置设备名

    // 如果该 tun 设备不存在，内核创建一个 tun 设备（通过： ip addr show 可以看到），将文件描述符和虚拟网络设备关联。该进程退出后，该设备将自动被删除。
    // 如果该 tun 设备已经存在，则仅仅将文件描述符和虚拟网络设备关联。该进程退出后，设备仍然存在。
    // 该系统调用需要 CAP_NET_ADMIN 权限。
    if ((err = ioctl(fd, TUNSETIFF, (void *)&ifr)) < 0)
    {
        close(fd);
        return err;
    }

    printf("Open tun/tap device: %s for reading...\n", ifr.ifr_name);

    // 设置 ip、网络掩码 并 启动 tun 设备
    // 等价于执行：
    //   sudo ip addr add 172.16.2.1/8 dev tun-sample
    //   sudo ip link set tun-sample up
    // 会自动添加路由： 172.16.0.0/16 dev tun-sample proto kernel scope link src 172.16.2.1 （ip route show）
    if ((err = set_tun_if(ifr.ifr_name)) < 0)
    {
        close(fd);
        return err;
    }
    return fd;
}

int main()
{
    int tun_fd, nread;
    char buffer[1500];

    /* Flags: IFF_TUN   - TUN device (no Ethernet headers) 即 IP 包
     *        IFF_TAP   - TAP device 以太网包（包含 Ethernet headers）
     *        IFF_NO_PI - Do not provide packet information，不包含额外的报信息，即传递到 tun_fd 中数据是纯粹的 ip 包。
     *                    如果不设置该选项，传递到 tun_fd 中数据将包含 struct tun_pi { unsigned short flags; unsigned short proto; }
     *                              flags - 设置 TUN_PKT_STRIP 选项时，表示用户缓冲区大小
     *                              proto - 表示当前 IP 包的协议，https://en.wikipedia.org/wiki/List_of_IP_protocol_numbers
     */
    tun_fd = tun_alloc(IFF_TUN | IFF_NO_PI);

    if (tun_fd < 0)
    {
        perror("Allocating interface");
        exit(1);
    }

    // 该程序接收 tun 数据包后，仅打印收到的包长度，不做任何事情。
    while (1)
    {
        nread = read(tun_fd, buffer, sizeof(buffer));
        if (nread < 0)
        {
            perror("Reading from interface");
            close(tun_fd);
            exit(1);
        }

        printf("Read %d bytes from tun/tap device\n", nread);
    }
    return 0;
}
```

打开一个 shell A，编译并运行该程序 `gcc ./src/c/05-tun-tap/01-sample-tun.c && sudo ./a.out`，输出如下：

```bash
Open tun/tap device: tun-sample for reading...
Read 76 bytes from tun/tap device
Read 48 bytes from tun/tap device
Read 76 bytes from tun/tap device
Read 76 bytes from tun/tap device
Read 76 bytes from tun/tap device
Read 48 bytes from tun/tap device
Read 48 bytes from tun/tap device
Read 48 bytes from tun/tap device
```

注意：这些接收到数据可能是 arp 或 ICMPv6 (NDP) 相关协议的数据包。

打开一个 shell B。

观察路由表 `ip route show` ，内核自动为该 tun 设备添加了正确的路由（所有发往 `172.16.0.0/16` 网络的数据包，将会从 tun-sample 设备出）：

```
172.16.0.0/16 dev tun-sample proto kernel scope link src 172.16.2.1 
```

此时，通过 `ping 172.16.0.1`，观察 shell A 会发现有 86 字节的数据包接收到的日志。可以看出，发往 `172.16.0.1` 数据包可以被的测试程序的和该设备关联的文件描述符读取到。

```
Read 84 bytes from tun/tap device
Read 84 bytes from tun/tap device
Read 84 bytes from tun/tap device
Read 84 bytes from tun/tap device
Read 84 bytes from tun/tap device
...
```

### 实现简单的 vpn

#### VPN 简介

VPN (Virtual private network, 虚拟私有网络, 虚拟专用网络)，严谨定义参见： [wiki](https://en.wikipedia.org/wiki/Virtual_private_network)。

从技术层面看，VPN 的落脚点是 Private Network，即私有网络。在 IP 协议中，对应的是 Private Network 地址：

* IPv4: `10.0.0.0/8`、`172.16.0.0/12`、`192.168.0.0/24`。
* IPv6: `fd00::/8`。

Virtual 要解决的是，在地理上，跨越地域，来搭建一个逻辑上 Private Network。比如某个组织，中国和美国有两个机房，我们希望这两个机房，可以通过私有网络地址可以相互访问，就像在同一个机房一样，此外，在任何一个地方的 PC 设备都可以安全的连入该私有网络，就像在这个机房一样的访问私有网络。

因为 VPN 解决的是跨地域的私有网络搭建。因此两个区域的流量需要通过一个或多个链路进行连通，这个链路被称为 Tunnel （隧道），这是 VPN 技术的核心之一。在现实中，这个 Tunnel 都是基于广域网（俗称公网/互联网）实现的。

由于 VPN 的跨地域流量是通过公网实现的，因此安全性是最重要的指标，而 VPN 协议主要就是来解决流量安全传输问题而诞生的，这部分参见下文：[常见的 VPN 协议](#常见的-vpn-协议)。

#### sampletun 流程分析

[marywangran/simpletun](https://github.com/marywangran/simpletun) 是一个比较好的用来学习 tun 用法的开源项目。

该软件的用法为帮助信息如下所示：

```
Usage:
simpletun -i <ifacename> [-s|-c <serverIP>] [-p <port>] [-u|-a] [-d]
simpletun -h

-i <ifacename>: 绑定的网络接口名
-s: 以 server 模式运行
-c <serverIP>: 以 client 模式运行，并执行 server ip
-p <port>: 指定 server 绑定的端口默认是 55555
-u|-a: 使用 TUN (-u, 默认) 或 TAP (-a)
-d: 打印 debug 信息
-h: 打印这个帮助信息文本
```

该软件同时包含 client 和 server，client 和 server 之间会建立一个 tcp 连接，用来进行数据包转发。

需要注意的是：该软件 server 端只接收一个 client 的连接，也就是说只能服务一个 client。也就是说，该项目提供的是一对一的 tunnel。

该软件的整体流程如下所示：

| 步骤 | client | server |
|-----|--------|-----------|
| `getopt` | 解析命令行参数 | 同 Client |
| `tun_alloc` | 打开一个与 tun/tap 绑定的文件描述符 `tap_fd`，和[上文](#实验和说明)一致 | 同 Client |
| `socket` | 创建一个 TCP socket 对象 `sock_fd` | 同 Client |
| tunnel over tcp | 通过 `connect` 连接到 server 的 TCP socket 中, 该文件描述符为 `net_fd`  | `bind` 端口，`listen`，并 `accept` 等待 client 的 TCP 连接请求，该 client 的连接对应的文件描述符为 `net_fd` |
| io copy | `tap_fd` 和 `net_fd` 文件描述符数据拷贝（细节参见下文） | 同 client

在数据拷贝过程中，假设从 `tap_fd` 读取到的数据为 `data`，则发送到 `net_fd` 的数据将为 `len(data)` (1 字节) + `data`。

同理，从 `net_fd` 中读取数据发送到 `tap_fd`， 则先读取第一个字节的 `len(data)`，然后再读取剩余的 `data`。

#### sampletun 简单体验

实验规划和准备如下：

* 虚拟机 1：外部 IP 地址为 `192.168.57.3`，作为 Server，分配的虚拟地址为 `172.16.1.1/24`
* 虚拟机 2：外部 IP 地址为 `192.168.57.4`，作为 Client，分配的虚拟地址为 `172.16.1.2/24`
* 虚拟机 1 准备参见：[Linux 网络虚拟化技术（一）概览 - 实验环境准备](/posts/linux-net-virual-01-overview/#实验环境准备)
* 虚拟机 2 从虚拟机 1 复制，并配置静态 IP。

    ```
    # /etc/network/interfaces
    auto enp0s8
    iface enp0s8 inet static
    address 192.168.56.4/24
    gateway 192.168.56.1

    auto enp0s9
    iface enp0s9 inet static
    address 192.168.57.4/24
    gateway 192.168.57.1
    ```

执行如下命令准备测试

```bash
# 虚拟机 1 作为服务端
sudo ip tuntap add dev tun-server mode tun
sudo ip addr add 172.16.1.1/24 dev tun-server
sudo ip link set tun-server up
gcc ./src/c/05-tun-tap/simpletun.c && sudo ./a.out -d -i tun-server -s


# 虚拟机 2 作为客户端
sudo ip tuntap add dev tun-client mode tun
sudo ip addr add 172.16.1.2/24 dev tun-client
sudo ip link set tun-client up
gcc ./src/c/05-tun-tap/simpletun.c && sudo ./a.out -d -i tun-client -c 192.168.57.3
```

在虚拟机 2 上执行 `ping 172.16.1.1` 可以正常输出响应。

```bash
# ping 172.16.1.1  # 虚拟机 2
PING 172.16.1.1 (172.16.1.1) 56(84) bytes of data.
64 bytes from 172.16.1.1: icmp_seq=1 ttl=64 time=2.19 ms
64 bytes from 172.16.1.1: icmp_seq=2 ttl=64 time=1.01 ms
64 bytes from 172.16.1.1: icmp_seq=3 ttl=64 time=1.86 ms
64 bytes from 172.16.1.1: icmp_seq=4 ttl=64 time=44.8 ms
64 bytes from 172.16.1.1: icmp_seq=5 ttl=64 time=1.49 ms
# ...

# gcc ./src/c/05-tun-tap/simpletun.c && sudo ./a.out -d -i tun-client -c 192.168.57.3  # 虚拟机 2
# ...
TAP2NET 17: Read 84 bytes from the tap interface
TAP2NET 17: Written 84 bytes to the network
NET2TAP 17: Read 84 bytes from the network
NET2TAP 17: Written 84 bytes to the tap interface
TAP2NET 18: Read 84 bytes from the tap interface
TAP2NET 18: Written 84 bytes to the network
NET2TAP 18: Read 84 bytes from the network
NET2TAP 18: Written 84 bytes to the tap interface
NET2TAP 19: Read 48 bytes from the network
NET2TAP 19: Written 48 bytes to the tap interface
TAP2NET 19: Read 48 bytes from the tap interface
TAP2NET 19: Written 48 bytes to the network
# ...

# gcc ./src/c/05-tun-tap/simpletun.c && sudo ./a.out -d -i tun-server -s  # 虚拟机 1
# ...
NET2TAP 17: Written 84 bytes to the tap interface
TAP2NET 17: Read 84 bytes from the tap interface
TAP2NET 17: Written 84 bytes to the network
NET2TAP 18: Read 84 bytes from the network
NET2TAP 18: Written 84 bytes to the tap interface
TAP2NET 18: Read 84 bytes from the tap interface
TAP2NET 18: Written 84 bytes to the network
TAP2NET 19: Read 48 bytes from the tap interface
TAP2NET 19: Written 48 bytes to the network
NET2TAP 19: Read 48 bytes from the network
NET2TAP 19: Written 48 bytes to the tap interface
# ...
```

最后恢复现场：

```bash
# 虚拟机 1
sudo ip link delete tun-server
# 虚拟机 2
sudo ip link delete tun-client
```

#### 基于路由表的 VPN 的简单规划

通过 tun 和配置路由表规划一个简单 VPN（网段为 `172.16.0.0/16`）网络，规划如下：

* `172.16.0.0/24` 作为分配给 VPN Tunnel 的网段。
* `172.16.1.0/24` 分配给机房 A（位于北京），其中网关（路由器） `172.16.1.1` 拥有公网 IP `192.168.57.2` （仅做示例）。
* `172.16.2.0/24` 分配给机房 B（位于广州），其中网关（路由器） `172.16.2.1` 拥有公网 IP `192.168.57.3` （仅做示例）。

![image](/image/sample-vpn-route-table.svg)

整体上来看，VPN Server 是一个由软件实现的路由器（3 层），因此 VPN Server 中也有一张特殊的路由表。该路由表的核心字段为：

* key: 目标 IP 网段
* value: 对应的 VPN Server 的 公网 IP 和 UDP Port 以及可选的 UDP Connect。

基于此方案，机房之间会形成一个网状的 UDP Tunnel。此外，上图没有画出的是，需要一个中心化存储来存储网段规划信息和 VPN Server IP Port 信息。

以上是一种简化的画法，其实 VPN Server 可以和网关分离，位于独立的设备中，只要配置好路由表，都可以正常工作。

#### 基于 iptables 的 VPN 的简单规划

假设只有一个机房，需求上也只有雇员 PC 单向访问该机房的需求，此时可以通过 iptables 来实现 VPN Server，相关假设如下：

* 内网网段为 `172.16.1.0/24`
* 采用本方案，VPN Client 和 VPN Server 的网段不能和内网网段重合，假设为 `192.168.60.0/24`。
* VPN Server 拥有独立的公网 IP，假设为 `192.168.57.2`。

![image](/image/sample-vpn-iptables.svg)

上图可以看出，该方式可以支持 Client 全部流量通过 VPN Server 转发。

#### 额外说明

以上是作者根据路由表 / iptables 等计算机网络相关知识做的推演。是否可能，未在实际生产环境测试过，请勿直接使用在生产环境。如需搭建 VPN，建议直接使用企业级或开源的 VPN 应用。

### tun/tap 其他应用场景

tun/tap 除了在 VPN 场景使用之外。也是 qemu-kvm 虚拟化技术中，网络虚拟化的基石。

基本原理是：虚拟机中进程对物理网卡的读写，在宿主机看来，是对 tap/tun 设备的读写。从而实现了虚拟机网络的虚拟化。更多参见：[云计算底层技术-虚拟网络设备(tun/tap,veth)](https://opengers.github.io/openstack/openstack-base-virtual-network-devices-tuntap-veth/)。

## Linux Tunnel

上文介绍的 tun/tap 是在应用层实现自定义 tunnel 的方式，除了这种方式外， Linux 原生支持一些标准的 Tunnel 实现（内核态实现，通过 `ip tunnel help` 可以查看支持的协议）。例如 ipip，参见：[揭秘 IPIP 隧道](https://morven.life/posts/networking-3-ipip/)。

关于 Tunnel 和 VPN 的关系，可以说 VPN 是 Tunnel 的一个应用场景，或者说 VPN 是 基于 Tunnel 实现的，即： `VPN = 加密协议 + Tunnel`，参见：[问答](https://learningnetwork.cisco.com/s/question/0D53i00000Kt2skCAB/vpn-vs-tunneling)。

## 常见的 VPN 协议

从上文可以看到 VPN 协议主要解决的是 Tunnel 加密的问题，关于主流的 VPN 协议的可以阅读：

* [OpenVPN vs IKEv2 vs PPTP vs L2TP/IPSec vs SSTP - Ultimate Guide to VPN Encryption](https://proprivacy.com/vpn/guides/vpn-encryption-the-complete-guide#preliminaries)
* [思科业务VPN概述和最佳实践](https://www.cisco.com/c/zh_cn/support/docs/smb/routers/cisco-rv-series-small-business-routers/1399-tz-best-practices-vpn.html)
