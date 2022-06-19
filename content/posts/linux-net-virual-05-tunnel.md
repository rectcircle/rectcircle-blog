---
title: "Linux 网络虚拟化技术（五）隧道技术"
date: 2022-04-21T00:24:21+08:00
draft: true
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

https://en.wikipedia.org/wiki/TUN/TAP
Linux虚拟网络设备之tun/tap https://segmentfault.com/a/1190000009249039
一文总结 Linux 虚拟网络设备 eth, tap/tun, veth-pair https://www.cnblogs.com/bakari/p/10494773.html
https://github.com/ICKelin/article/issues/9
https://blog.csdn.net/mrpre/article/details/113105456

go 版本 https://github.com/songgao/water

#### VPN 简介

虚拟专用网络

* 虚拟（区别于普通内网，是一个虚拟的内网而不是物理意义上的内网）
* 专用网络（内网）

强调安全性

#### 实现点对点连接

#### client 访问整个内网

#### 访问内网和互联网

渐进过程：

* 点对点 vpn https://github.com/gregnietsky/simpletun （两端链路）
* 访问整个内网
    * https://paper.seebug.org/1648/#0x04 （必须部署到网关上）
* 通过接入点访问整个内网和互联网
    * 方案 1：通过 iptables 和 SNAT 和 MASQUERADE tun 和 iptables https://www.cnblogs.com/blumia/p/Make-a-simple-udp-tunnel-program.html 和 https://github.com/BLumia/udptun
    * 方案 2：通过 raw socket 一种可能性 http://www.ccs.neu.edu/home/noubir/Courses/CS4700-5700/S12.old/problems/PS5.pdf

https://github.com/marywangran/simpletun

https://backreference.org/2010/03/26/tuntap-interface-tutorial/

https://www.junmajinlong.com/virtual/network/data_flow_about_openvpn/

https://paper.seebug.org/1648/#0x00

## Linux Tunnel

https://morven.life/posts/networking-3-ipip/
https://cloud.tencent.com/developer/article/1432489
https://www.361way.com/linux-tunnel/5199.html
https://sites.google.com/site/emmoblin/linux-network-1/linux-zhongip-sui-dao
https://www.wangan.com/p/7fygfgeb64839363#1.PPTP%E5%8D%8F%E8%AE%AE
https://zh.m.wikipedia.org/zh-hans/IP%E9%9A%A7%E9%81%93

Tunnel 和 VPN 的区别：https://learningnetwork.cisco.com/s/question/0D53i00000Kt2skCAB/vpn-vs-tunneling

Tunnel 概念更广泛， VPN 也是一种 Tunnel。

（vxlan 也是一种基于隧道的技术）

## 常见的 VPN 协议

TODO  VPN 和 TUN/TCP

https://proprivacy.com/vpn/guides/vpn-encryption-the-complete-guide#preliminaries
https://www.cisco.com/c/zh_cn/support/docs/smb/routers/cisco-rv-series-small-business-routers/1399-tz-best-practices-vpn.html

OpenVPN
OpenConnect （anyconnect 协议）

TODO 两个实例：

* VPN 实现
* 虚拟机网络模拟
