---
title: "Linux 网络虚拟化技术（二）docker bridge 网络原理"
date: 2022-04-21T00:24:21+08:00
draft: true
toc: true
comments: true
tags:
  - linux
---

## veth 虚拟设备

> 参考： [Linux虚拟网络设备之veth](https://segmentfault.com/a/1190000009251098)

### 功能特性

veth 即 virtual ethernet device，是对物理一台网卡的模拟。功能和物理以太网设备类似。此外有如下特点：

* veth 的一端连接着内核网络协议栈。
* veth 设备是成对出现的，两个设备彼此相连（就位于两个主机的 eth 通过网线连接一样）。
* 一个设备收到协议栈的数据发送请求后，会将数据发送到另一个设备上去。

如上特点图示如下（Network Protocol Stack 指 3 层协议栈）：

```
+----------------------------------------------------------------+
|                                                                |
|       +------------------------------------------------+       |
|       |             Network Protocol Stack             |       |
|       +------------------------------------------------+       |
|              ↑               ↑               ↑                 |
|..............|...............|...............|.................|
|              ↓               ↓               ↓                 |
|        +----------+    +-----------+   +-----------+           |
|        |  enp0s3  |    |   veth0   |   | veth0peer |           |
|        +----------+    +-----------+   +-----------+           |
|10.0.2.15     ↑               ↑               ↑                 |
|              |               +---------------+                 |
|              |         192.168.4.2      192.168.4.3            |
+--------------|-------------------------------------------------+
               ↓
         Physical Network
```

### 实验

#### 实验设计

在一台虚拟机上实现上图所示的拓扑模型。并验证通过 `ping` 检查网络是否畅通。

#### Shell 描述

```bash
#!/usr/bin/env bash

# 观察网卡情况
echo '===初始状态网络设备'
ip addr show
echo

echo '===初始状态 arp 表'
cat /proc/net/arp
echo

echo '===创建并配置veth'
# 创建一对 veth
sudo ip link add veth0 type veth peer name veth0peer
# 给这一对 veth 配置 ip 地址
sudo ip addr add 192.168.4.2/24 dev veth0
sudo ip addr add 192.168.4.3/24 dev veth0peer
# 启动这两个网卡
sudo ip link set veth0 up
sudo ip link set veth0peer up
# 允许从非 lo 设备进来的数据包的源 IP 地址是本机地址
sudo sysctl -w net.ipv4.conf.veth0.accept_local 1
sudo sysctl -w net.ipv4.conf.veth0peer.accept_local 1
echo '完成创建并配置veth'
echo

# 观察 arp
echo '===配置完 veth 后网络设备'
ip addr show
echo

# 实验
echo '===尝试是否可以 ping 通'
ping -c 4 192.168.4.3 -I veth0
echo

echo '===ping 完成后 arp 表'
cat /proc/net/arp
echo

# 恢复现场
sudo ip link delete veth0
```

#### Go 语言描述

```go
package main

// sudo go ./src/go/01-veth/

import (
	"fmt"
	"net"
	"os"
	"os/exec"

	sysctl "github.com/lorenzosaino/go-sysctl"
	"github.com/vishvananda/netlink"
)

const (
	beforeScript = "echo '===初始状态网络设备' && ip addr show && echo" +
		" && echo '===初始状态 arp 表' && cat /proc/net/arp && echo"
	afterScript = "echo '===配置完 veth 后网络设备' && ip addr show && echo" +
		" && echo '===尝试是否可以 ping 通' && ping -c 4 192.168.4.3 -I veth0 && echo" +
		" && echo '===ping 完成后 arp 表' && cat /proc/net/arp && echo " +
		" && sudo ip link delete veth0"
)

func runtScript(script string) error {
	cmd := exec.Command("/bin/sh", "-c", script)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func panicIfErr(err error) {
	if err != nil {
		panic(err)
	}
}

func main() {
	// 输出初始化状态
	panicIfErr(runtScript(beforeScript))

	fmt.Println("===创建并配置veth")
	// 创建一对 veth
	panicIfErr(netlink.LinkAdd(&netlink.Veth{
		LinkAttrs: netlink.LinkAttrs{
			Name: "veth0",
		},
		PeerName: "veth0peer",
	}))
	// 配置 ip 地址
	ip, ipNet, err := net.ParseCIDR("192.168.4.2/24")
	ipNet.IP = ip
	if err != nil {
		panic(err)
	}
	panicIfErr(netlink.AddrAdd(netlink.NewLinkBond(netlink.LinkAttrs{Name: "veth0"}), &netlink.Addr{IPNet: ipNet}))

	ip, ipNet, err = net.ParseCIDR("192.168.4.3/24")
	ipNet.IP = ip
	if err != nil {
		panic(err)
	}
	panicIfErr(netlink.AddrAdd(netlink.NewLinkBond(netlink.LinkAttrs{Name: "veth0peer"}), &netlink.Addr{IPNet: ipNet}))

	netlink.LinkSetUp(netlink.NewLinkBond(netlink.LinkAttrs{Name: "veth0"}))
	netlink.LinkSetUp(netlink.NewLinkBond(netlink.LinkAttrs{Name: "veth0peer"}))

	panicIfErr(sysctl.Set(fmt.Sprintf("net.ipv4.conf.%s.accept_local", "veth0"), "1"))
	panicIfErr(sysctl.Set(fmt.Sprintf("net.ipv4.conf.%s.accept_local", "veth0peer"), "1"))
	fmt.Println("完成创建并配置veth")
	fmt.Println()

	// 实验
	panicIfErr(runtScript(afterScript))
}

```

#### 输出和解释

```
===初始状态网络设备
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:7d:99:1d brd ff:ff:ff:ff:ff:ff
    inet 10.0.2.15/24 brd 10.0.2.255 scope global dynamic enp0s3
       valid_lft 72349sec preferred_lft 72349sec
    inet6 fe80::a00:27ff:fe7d:991d/64 scope link 
       valid_lft forever preferred_lft forever
3: enp0s8: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:06:ff:a6 brd ff:ff:ff:ff:ff:ff
    inet 192.168.56.3/24 brd 192.168.56.255 scope global dynamic enp0s8
       valid_lft 466sec preferred_lft 466sec
    inet6 fe80::a00:27ff:fe06:ffa6/64 scope link 
       valid_lft forever preferred_lft forever

===初始状态 arp 表
IP address       HW type     Flags       HW address            Mask     Device
192.168.56.2     0x1         0x2         08:00:27:fa:d4:ec     *        enp0s8
169.254.169.254  0x1         0x0         00:00:00:00:00:00     *        enp0s3
10.0.2.2         0x1         0x2         52:54:00:12:35:02     *        enp0s3
192.168.56.1     0x1         0x2         0a:00:27:00:00:00     *        enp0s8

===创建并配置veth
net.ipv4.conf.veth0.accept_local = 1
net.ipv4.conf.veth0peer.accept_local = 1
完成创建并配置veth

===配置完 veth 后网络设备
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:7d:99:1d brd ff:ff:ff:ff:ff:ff
    inet 10.0.2.15/24 brd 10.0.2.255 scope global dynamic enp0s3
       valid_lft 72349sec preferred_lft 72349sec
    inet6 fe80::a00:27ff:fe7d:991d/64 scope link 
       valid_lft forever preferred_lft forever
3: enp0s8: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:06:ff:a6 brd ff:ff:ff:ff:ff:ff
    inet 192.168.56.3/24 brd 192.168.56.255 scope global dynamic enp0s8
       valid_lft 466sec preferred_lft 466sec
    inet6 fe80::a00:27ff:fe06:ffa6/64 scope link 
       valid_lft forever preferred_lft forever
14: veth0peer@veth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether ca:02:25:cf:ce:da brd ff:ff:ff:ff:ff:ff
    inet 192.168.4.3/24 scope global veth0peer
       valid_lft forever preferred_lft forever
    inet6 fe80::c802:25ff:fecf:ceda/64 scope link tentative 
       valid_lft forever preferred_lft forever
15: veth0@veth0peer: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether 7a:2d:96:17:8d:bc brd ff:ff:ff:ff:ff:ff
    inet 192.168.4.2/24 scope global veth0
       valid_lft forever preferred_lft forever
    inet6 fe80::782d:96ff:fe17:8dbc/64 scope link tentative 
       valid_lft forever preferred_lft forever

===尝试是否可以 ping 通
PING 192.168.4.3 (192.168.4.3) from 192.168.4.2 veth0: 56(84) bytes of data.
64 bytes from 192.168.4.3: icmp_seq=1 ttl=64 time=0.032 ms
64 bytes from 192.168.4.3: icmp_seq=2 ttl=64 time=0.084 ms
64 bytes from 192.168.4.3: icmp_seq=3 ttl=64 time=0.068 ms
64 bytes from 192.168.4.3: icmp_seq=4 ttl=64 time=0.086 ms

--- 192.168.4.3 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3068ms
rtt min/avg/max/mdev = 0.032/0.067/0.086/0.021 ms

===ping 完成后 arp 表
IP address       HW type     Flags       HW address            Mask     Device
192.168.56.2     0x1         0x2         08:00:27:fa:d4:ec     *        enp0s8
192.168.4.2      0x1         0x2         7a:2d:96:17:8d:bc     *        veth0peer
169.254.169.254  0x1         0x0         00:00:00:00:00:00     *        enp0s3
10.0.2.2         0x1         0x2         52:54:00:12:35:02     *        enp0s3
192.168.56.1     0x1         0x2         0a:00:27:00:00:00     *        enp0s8
192.168.4.3      0x1         0x2         ca:02:25:cf:ce:da     *        veth0
```

* 初始状态网络设备：在 VirtualBox 虚拟机上进行实验，有两张物理网卡分别是 `enp0s3` 和 `enp0s8`。
* 初始状态 arp 表：arp 表中只有关于这两种物理网卡的数据
* 创建并配置veth：
    * 创建了一对 veth 分别命名为 `veth0` 和 `veth0peer`。
    * 给这对 veth 分别分配两个 ip 地址： `192.168.4.2/24` 和 `192.168.4.3/24`
    * 启动这对 veth
    * 打开这两个设备 `accept_local` 选项（允许从非 lo 设备进来的数据包的源 IP 地址是本机地址）。
* 通过 ping 验证，其流量路径为：
    * 请求：
        * ping 配置了出口设备为 `veth0`，所以程序发送 ICMP echo 数据包的配置源 IP 地址为 `veth0` 绑定的地址，即 `192.168.4.2`（不配置 `veth0` 则 源 IP 地址为 `192.168.4.3`），目标 IP 地址为 `192.168.4.3`。
        * 由于配置了从 `veth0` 出口，因此需要 arp 流程，根据 local 路由表（`ip rule list`、`ip route list table local`），目标地址 `192.168.2.3` 和 `veth0` 地址处于同一网段，所以协议栈会先从 `veth0` 发送 ARP，询问 `192.168.2.3` 的 mac 地址。
        * 内核协议栈将请求发送，将以太网数据包，发送到 `veth0peer`，`veth0peer` 将数据包转交到内核协议栈。
        * 内核协议栈比对 目标 IP 地址和本地 IP 地址一致，构造 ICMP echo 数据包。
    * 响应
        * ICMP echo 数据包的目的地址是 `192.168.4.2`，是本地地址，所以会通过 lo 设备发送出去（`sudo tcpdump -n -i lo` 可以看到）（不需要 arp 流程）。
        * 内核收到该数据包，传递到 ping 的 socket 中，ping 的相关函数解析并打印到标准输出中。

ping local ip 的流量路径：

* `ping 192.168.4.3`：`socket ---内核协议栈--> lo ---内核协议栈回复---> lo ---内核协议栈--> socket`
* `ping 192.168.4.3 -I 192.168.4.2`：`socket ---内核协议栈--> lo ---内核协议栈回复---> lo ---内核协议栈--> socket`（猜测不会调用 socket.bind）
* `ping 192.168.4.3 -I veth0`：`socket ---内核协议栈--> veth0 ---> veth0peer ---内核协议栈回复---> lo ---内核协议栈--> socket`（猜测会调用 socket.bind）

#### C 语言描述（调用 netlink）

```cpp
// gcc ./src/c/01-veth/main.c && sudo ./a.out
// 忽略内存回收等问题，仅用来演示如何通过 netlink 创建一个 veth。
// 实现代码参考：
//   https://github.com/vishvananda/netlink/blob/main/link_linux.go
//   https://github.com/vishvananda/netlink/blob/main/nl/nl_linux.go
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>

#include <sys/types.h>
#include <unistd.h>
#include <asm/types.h>
#include <sys/socket.h>
#include <linux/netlink.h>
#include <linux/rtnetlink.h>
#include <linux/veth.h>
#include <sys/wait.h>

#define errExit(msg)    do { perror(msg); exit(EXIT_FAILURE); \
                               } while (0)

#define MY_NETLINK_DEBUG 1

int nextSeqNr = 0;

const short IFLA_ROOT = IFLA_MAX + 1;

struct rtattr_nest
{
    struct rtattr attr;
    size_t data_len;
    void *data_ptr;

    struct rtattr_nest *first_child;
    struct rtattr_nest *last_child;
    struct rtattr_nest *next_sibling;

#ifdef MY_NETLINK_DEBUG
    char *debug_info;
#endif
};

#ifdef MY_NETLINK_DEBUG

void nlmsghdr_print_debug(struct nlmsghdr *nh)
{
    printf("nlmsghdr(len=%d, type=%d, flags=%d, seq=%d, pid=%d)\n", nh->nlmsg_len, nh->nlmsg_type, nh->nlmsg_flags, nh->nlmsg_seq, nh->nlmsg_pid);
}

void ifinfomsg_print_debug(struct ifinfomsg *ifm)
{
    printf("ifinfomsg(family=%d, type=%d, index=%d, flags=%x, change=%x)\n", ifm->ifi_family, ifm->ifi_type, ifm->ifi_index, ifm->ifi_flags, ifm->ifi_change);
}

void rtattr_nest_print_debug(struct rtattr_nest *attr, int level)
{
    for (int i = 0; i < level * 2; i++) {
        printf(" ");
    }
    int child_num = 0;
    struct rtattr_nest *c = attr->first_child;
    while (c != NULL)
    {

        child_num += 1;
        c = c->next_sibling;
    }
    printf("%s (is_root=%d, data_len=%d, child_num=%d)\n", attr->debug_info, attr->attr.rta_type == IFLA_ROOT, attr->data_len, child_num);
    c = attr->first_child;
    while (c != NULL)
    {
        rtattr_nest_print_debug(c, level + 1);
        c = c->next_sibling;
    }
}
#endif

struct rtattr_nest *new_rtattr_nest(unsigned short rta_type, void *data_ptr, size_t data_len)
{
    struct rtattr_nest *attr = malloc(sizeof(struct rtattr_nest));
    memset(attr, 0, sizeof(struct rtattr_nest));
    attr->attr.rta_type = rta_type;
    attr->data_len = data_len;
    attr->data_ptr = data_ptr;
    return attr;
}

struct rtattr_nest *rtattr_nest_add(struct rtattr_nest *attr, unsigned short rta_type, void *data_ptr, size_t data_len)
{
    struct rtattr_nest *new_attr = new_rtattr_nest(rta_type, data_ptr, data_len);
    if (attr->first_child == NULL) 
    {
        attr->first_child = new_attr;
        attr->last_child = new_attr;
    } 
    else
    {
        attr->last_child->next_sibling = new_attr;
        attr->last_child = new_attr;
    }
    return new_attr;
}

int rtattr_nest_serialize(struct rtattr_nest *attr, char *buf, int offset)
{
    int next_offset = offset;
    if (attr->attr.rta_type != IFLA_ROOT)
    {
        // 先跳过 len
        next_offset += sizeof(attr->attr.rta_len);
        // 序列化 type
        memcpy(buf + next_offset, &attr->attr.rta_type, sizeof(attr->attr.rta_type));
        next_offset += sizeof(attr->attr.rta_type);
        // 序列化 data
        memcpy(buf + next_offset, attr->data_ptr, attr->data_len);
        next_offset += attr->data_len;
    }
    // 序列化孩子，并记录孩子总长度
    int children_len = 0;
    struct rtattr_nest *c = attr->first_child;
    while (c != NULL)
    {
        int l = NLMSG_ALIGN(rtattr_nest_serialize(c, buf, next_offset + children_len)); // NLMSG_ALIGN表示，进行 4 字节对齐
        children_len += l;
        c = c->next_sibling;
    }

    if (attr->attr.rta_type == IFLA_ROOT)
        return children_len;
    // 计算当前节点总长度，并序列化
    unsigned short len = NLMSG_ALIGN(RTA_LENGTH(children_len + attr->data_len)); // 最后一个可以不用 4 字节对齐？
    memcpy(buf + offset, &len, sizeof(len));
    // 返回长度
    return len;
}

void recvfrom_kernal(int rtnetlink_sock)
{
    char revice_buf[65536];
    struct nlmsghdr *rece_nh;
    struct sockaddr_nl from_addr;
    int sockaddr_nl_len = sizeof(from_addr);

    while (1)
    {

        int l = recvfrom(rtnetlink_sock, &revice_buf, 65536, 0, (struct sockaddr *)&from_addr, &sockaddr_nl_len);
        if (from_addr.nl_pid != 0)
        {
            fprintf(stderr, "Wrong sender portid %d, expected %d", from_addr.nl_pid, 0);
            return;
        }
        for (int offset = 0; l - offset >= NLMSG_HDRLEN; offset += rece_nh->nlmsg_len)
        {
            rece_nh = (struct nlmsghdr *)(revice_buf + offset);
            if (rece_nh->nlmsg_seq != nextSeqNr)
            {
                continue;
            }
            if (rece_nh->nlmsg_pid != getpid()) {
                continue;
            }
            if (rece_nh->nlmsg_type == NLMSG_DONE)
            {
                // 成功
                return;
            }
            if (rece_nh->nlmsg_type == NLMSG_ERROR)
            {
                errno = - *(int *)(revice_buf + offset + NLMSG_HDRLEN);
                if (errno == 0) {
                    // 成功
                    return;
                }
                errExit("recvfrom_kernal");
            }
            if (rece_nh->nlmsg_flags & NLM_F_MULTI == 0)
            {
                return;
            }
        }
    }
}

void link_add_veth()
{
    int rtnetlink_sock = socket(AF_NETLINK, SOCK_RAW | SOCK_CLOEXEC, NETLINK_ROUTE);
    struct
    {
        struct nlmsghdr nh;
        struct ifinfomsg ifm;
        char attrbuf[512];
    } req; //  route netlink socket 请求结构体
    unsigned int mtu = 1000;

    char *veth = "veth";
    char *veth0 = "veth0";
    char *veth0peer = "veth0peer";

    // 结构体设置为 0
    memset(&req, 0, sizeof(req));

    // 设置 netlink message header
    req.nh.nlmsg_len = NLMSG_LENGTH(sizeof(req.ifm)); //  len 字段，表示 req 结构体的总长度。
    printf("%d\n", req.nh.nlmsg_len);
    req.nh.nlmsg_type = RTM_NEWLINK;                                            //  新建一个 Link
    req.nh.nlmsg_flags = NLM_F_REQUEST | NLM_F_CREATE | NLM_F_EXCL | NLM_F_ACK; // 该请求包含本操作的全部请求内容
    req.nh.nlmsg_seq = ++nextSeqNr;

    // 设置 interface infomartion messsage
    req.ifm.ifi_family = AF_UNSPEC;  // 未指定的地质族（netlink 固定填写此字段）
    req.ifm.ifi_index = 0;           // interface （设备） index，创建时为 0
    req.ifm.ifi_flags = 0;           // interface flag
    req.ifm.ifi_change = 0xffffffff; // interface flag 掩码

    // 设置 req.attrbuf

    // 创建根属性
    struct rtattr_nest *root = new_rtattr_nest(IFLA_ROOT, NULL, 0);
    // 设置名字
    struct rtattr_nest *name = rtattr_nest_add(root, IFLA_IFNAME, veth0, strlen(veth0));
    // 设置 link info
    struct rtattr_nest *linkInfo = rtattr_nest_add(root, IFLA_LINKINFO, NULL, 0);
    // 设置 link 的类型
    struct rtattr_nest *linkKind = rtattr_nest_add(linkInfo, IFLA_INFO_KIND, veth, strlen(veth));
    // 设置 link 的数据
    struct rtattr_nest *data = rtattr_nest_add(linkInfo, IFLA_INFO_DATA, NULL, 0);
    // 设置 link 的 peer
    struct ifinfomsg peer_ifm;
    memset(&peer_ifm, 0, sizeof(peer_ifm));
    peer_ifm.ifi_family = AF_UNSPEC;
    struct rtattr_nest *peer = rtattr_nest_add(data, VETH_INFO_PEER, &peer_ifm, sizeof(peer_ifm));
    struct rtattr_nest *peerName = rtattr_nest_add(peer, IFLA_IFNAME, veth0peer, strlen(veth0peer));

    // 序列化属性
    int attrs_len = rtattr_nest_serialize(root, req.attrbuf, 0);

    // 更新总长度
    req.nh.nlmsg_len = NLMSG_ALIGN(attrs_len + req.nh.nlmsg_len);

#ifdef MY_NETLINK_DEBUG
    root->debug_info = "attrs";
    name->debug_info = "IFLA_IFNAME=veth0";
    linkInfo->debug_info = "IFLA_LINKINFO";
    linkKind->debug_info = "IFLA_INFO_KIND=veth";
    data->debug_info = "IFLA_INFO_DATA";
    peer->debug_info = "VETH_INFO_PEER data is `ifinfomsg`";
    peerName->debug_info = "IFLA_IFNAME=veth0peer";

    printf("===debug\n");
    nlmsghdr_print_debug(&req.nh);
    ifinfomsg_print_debug(&req.ifm);
    rtattr_nest_print_debug(root, 0);
    printf("\n");
#endif

    // 发送消息
    send(rtnetlink_sock, &req, req.nh.nlmsg_len, 0);
    // 等待响应
    recvfrom_kernal(rtnetlink_sock);
}

char *const before_scripts[] = {
    "/bin/sh",
    "-c",
    "echo '===初始状态网络设备' && \
    ip addr show && \
    echo && \
    echo '===初始状态 arp 表' && \
    cat /proc/net/arp && \
    echo \
    ",
    NULL};
char *const other_config_scripts[] = {
    "/bin/sh",
    "-c",
    "sudo ip addr add 192.168.4.2/24 dev veth0 && \
    sudo ip addr add 192.168.4.3/24 dev veth0peer && \
    sudo ip link set veth0 up && \
    sudo ip link set veth0peer up && \
    sudo sysctl -w net.ipv4.conf.veth0.accept_local=1 && \
    sudo sysctl -w net.ipv4.conf.veth0peer.accept_local=1 && \
    echo '完成创建并配置veth' && \
    echo \
    ",
    NULL};
char *const after_scripts[] = {
    "/bin/sh",
    "-c",
    "echo '===配置完 veth 后网络设备' && \
    ip addr show && \
    echo && \
    echo '===尝试是否可以 ping 通' && \
    ping -c 4 192.168.4.3 -I veth0 && \
    echo && \
    echo '===ping 完成后 arp 表' && \
    cat /proc/net/arp && \
    echo && \
    sudo ip link delete veth0 \
    ",
    NULL};

pid_t exec_shell(char *const args[])
{
    pid_t p = fork();
    if (p == 0)
    {
        execv(args[0], args);
        perror("exec");
        exit(EXIT_FAILURE);
    }
    return p;
}

int main()
{
    waitpid(exec_shell(before_scripts), NULL, 0);
    sleep(1);
    printf("===创建并配置veth\n");
    link_add_veth();
    waitpid(exec_shell(other_config_scripts), NULL, 0);
    waitpid(exec_shell(after_scripts), NULL, 0);
}
```

## bridge 虚拟设备

### 功能特性

https://www.cnblogs.com/jmilkfan-fanguiju/p/10589727.html

## tun/tap 虚拟设备

https://www.kernel.org/doc/html/v5.8/networking/tuntap.html
https://en.wikipedia.org/wiki/TUN/TAP

## vlan 虚拟设备

https://www.linuxjournal.com/article/10821

https://wiki.archlinux.org/title/VLAN

https://pengpengxp.github.io/archive/before-2018-11-10/2017-01-23-Linux%E7%BD%91%E7%BB%9C%E8%AE%BE%E5%A4%87%E7%9B%B8%E5%85%B3%E7%9A%84%E5%A4%A7%E6%9D%82%E7%83%A9.html#orgfbca757

## netfilter 虚拟设备

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
