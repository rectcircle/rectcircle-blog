---
title: "Linux 网络虚拟化技术（四）iptable"
date: 2022-04-21T00:24:21+08:00
draft: true
toc: true
comments: true
tags:
  - linux
---

> 参考：[zsythink iptable 系列博客](https://www.zsythink.net/archives/category/%e8%bf%90%e7%bb%b4%e7%9b%b8%e5%85%b3/iptables/) | [iptable manual](https://linux.die.net/man/8/iptables)

## iptable 简述

iptable 是一套针对 Linux 的，对 ipv4（ipv6 也存在对应的工具 ip6table） 数据包（流量）管理工具。在常见的 Linux 发行版均已预装，提供了如：包过滤、端口转发、NAT、流量审计等功能。

## 准备

确保系统已经安装 iptables。

```bash
sudo apt install iptables
```

## 测试程序

使用 C 语言。编写与一个简单的 TCP Server 测试程序，监听在 1234 端口。

该程序将，接收 TCP 请求，并响应一个字符串。该字符串包含如下信息：

* 本次 TCP 请求的 Source IP、Source Port。
* 本次 TCP 请求的 Destination IP、Destination Port。
* 通过 `getsockopt` 配合 `SO_ORIGINAL_DST` 拿到的原始 Destination IP 和 Destination Port，如果报错将显示错误信息。

响应完成后，将关闭该 TCP 连接。

```cpp
// 必须安装 iptables 否则会报错：getsockopt error: Protocol not available
// 运行： gcc ./src/c/03-iptable/test-iptable-server.c && sudo ./a.out
// 测试命令： nc localhost 1234
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <stdio.h>
#include <unistd.h>
#include <string.h>
#include <stdlib.h>
#include <errno.h>

#include<linux/netfilter_ipv4.h>

#define BUFFER_SIZE 1024
#define BACKLOG 5

int main(int argc, char *argv[])
{
    int sfd = 0;
    int cfd = 0;
    int n = 0;
    int port = 1234;
    struct sockaddr_in server_addr;
    sfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sfd < 0)
    {
        perror("socket error");
        exit(-1);
    }
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = htonl(INADDR_ANY);
    server_addr.sin_port = htons(port);
    n = bind(sfd, (struct sockaddr *)&server_addr, sizeof(server_addr));
    if (n < 0)
    {
        perror("bind error");
        exit(-1);
    }
    n = listen(sfd, BACKLOG);
    if (n < 0)
    {
        perror("listen error");
        exit(-1);
    }
    struct sockaddr_in source_addr;
    memset(&source_addr, 0, sizeof(source_addr));
    socklen_t client_addr_len;
    client_addr_len = sizeof(source_addr);

    struct sockaddr_in dest_addr;
    memset(&dest_addr, 0, sizeof(dest_addr));
    socklen_t dest_addr_len;
    dest_addr_len = sizeof(dest_addr);

    struct sockaddr_in original_dest_addr;
    memset(&original_dest_addr, 0, sizeof(original_dest_addr));
    socklen_t original_dest_addr_len;
    original_dest_addr_len = sizeof(original_dest_addr);

    while (1)
    {
        cfd = accept(sfd, (struct sockaddr *)&source_addr, &client_addr_len);
        if (cfd < 0)
        {
            perror("accept error!");
            exit(-1);
        }

        // 获取到的是接收到的数据包中的 dest ip 和 port
        n = getsockname(cfd, (struct sockaddr *)&dest_addr, &dest_addr_len);
        if (n < 0)
        {
            perror("getsockname error");
            exit(-1);
        }

        // 获取到的是 nat 之前的原始的 dest ip 和 port
        n = getsockopt(cfd, SOL_IP, SO_ORIGINAL_DST, &original_dest_addr, &original_dest_addr_len);
        // 将信息发送给客户端
        char send_buff[BUFFER_SIZE];
        memset(send_buff, 0, sizeof(send_buff));
        sprintf(send_buff, "source{ip: %s, port: %d};  dest{ip: %s, port: %d}; original dest{%s: %s, %s: %d}\n",
                inet_ntoa(source_addr.sin_addr), ntohs(source_addr.sin_port),
                inet_ntoa(dest_addr.sin_addr), ntohs(dest_addr.sin_port),
                n < 0 ? "strerror" : "ip",
                n < 0 ? strerror(errno) : inet_ntoa(original_dest_addr.sin_addr), // 如果上一步报错返回错误信息
                n < 0 ? "errno" : "port",
                n < 0 ? errno : ntohs(original_dest_addr.sin_port));
        send(cfd, send_buff, strlen(send_buff), 0);
        // 关闭 TCP 连接
        close(cfd);
    }
}
```

通过 `gcc ./src/c/03-iptable/test-iptable-server.c && sudo ./a.out` 命令编译运行。

通过 nc 命令访问该 server，可以看到该测试程序的返回打印出来：

```
source{ip: 127.0.0.1, port: 55958};  dest{ip: 127.0.0.1, port: 1234}; original dest{strerror: Protocol not available, errno: 92}
```

此时是正常访问，可以看出：

* 源 IP Port 为 `127.0.0.1:55958`。
* 目的 IP Port 为 `127.0.0.1:1234`。
* 由于没有进行 NAT 所以无法获取原始目标 IP Port，所以返回 `Protocol not available` 错误信息。

## iptable 使用场景

* 写一个简单 socket 程序用来测试。
* 重点画出，ip/tcp 包的内容变化。

### 包过滤（防火强）

* 入网  https://www.cnblogs.com/ym123/p/4567180.html https://www.jmjc.tech/less/143
    * 屏蔽源 IP
    * DDos 攻击防护
* 出网
    * 特殊网站禁用访问

### 转发到本地端口（REDIRECT）

```
sudo iptables -t nat -A PREROUTING -p tcp --dport 12345 -j REDIRECT --to-ports 1234
sudo iptables -t nat -I OUTPUT -p tcp -o lo --dport 12345 -j REDIRECT --to-ports 1234 # 支持本地回环
```

istio/envoy 的原理之一

本质上REDIRECT就是一个特殊的DNAT规则

https://www.ichenfu.com/2019/04/09/istio-inbond-interception-and-linux-transparent-proxy/

实现透明代理： https://comwrg.github.io/2018/11/17/v2ray-and-iptables-implement-global-proxy-under-linux/#V2Ray

https://xtls.github.io/document/level-2/transparent_proxy/transparent_proxy.html#%E9%A6%96%E5%85%88-%E6%88%91%E4%BB%AC%E5%85%88%E8%AF%95%E8%AF%95%E5%81%9A%E5%88%B0%E7%AC%AC%E4%B8%80%E9%98%B6%E6%AE%B5

需测试，原理 https://github.com/lazytiger/trojan-rs/blob/master/PRINCIPLE.md#tcp

（不会修改包的目的地址，可以通过 `getsockopt` 中的 `SO_ORIGINAL_DST` 读到该包的目标地址。）

[不支持来自 localhost 的请求](https://serverfault.com/questions/211536/iptables-port-redirect-not-working-for-localhost)

写个简单 tcp 测试程序，观察 source & dest ip port。

### 转发到任意 IP 端口（DNAT）

和 REDIRECT 区别：dest ip 变了。

https://www.cnblogs.com/dongzhiquan/p/11427461.html

和 LVS 对别
和 Nginx 对比。
和 本地端口转发的区别

和 TCP 层编写代理程序的区别：source ip 没有改变。

测试是否可以实现公网 ip 的代理。

写个简单 tcp 测试程序，观察 source & dest ip port。

### 网络地址转换（SNAT/MASQUERADE）

https://yeasy.gitbook.io/docker_practice/advanced_network/port_mapping

仅简单介绍，实战放在 最后 docker 实例中。

### 其他特性

* 访问日志
* 流量统计

## iptable 原理

### netfilter 框架

Linux 在内核层面实现 TCP/IP 协议栈，因此应用开发者只需要感知 Socket 网络编程模型即可实现常规的通过网络提供服务的程序。

但是，在有些场景，管理员需要，对 TCP/IP 数据包层面进行过滤修改，如上文提到的防火墙、NAT 等，在应用层是无法实现的。而需要在 TCP/IP 协议栈的流程中注入一些特殊的逻辑，才能实现。

因此 Linux 提供了 netfilter 框架，该框架定义了一套编程接口，允许实现该接口的程序（下文称为 Netfilter 程序）在 TCP/IP 协议栈的流程中注入自定义的逻辑（Hook）。

而 iptable 就是一套基于 netfilter 框架实现的程序，实现了管理员常用的防火墙和 NAT 等能力。（除了 iptable 之外，还有 [LVS](http://www.linuxvirtualserver.org/) 负载均衡器等）

和其他领域一样，通用的标准/接口是为了服务与某些特定现实需求的，因此 netfilter 的诞生实际上就是为起初的 iptable 提供服务的。iptable 和 netfilter 是用一个项目组下的项目。

更多参见： [netfilter.org](https://www.netfilter.org/)。

### iptable 架构

iptable 的由两个部分组成：

* 用户态空间提供的 iptable 命令行程序。
* 注册在内核中 netfilter 钩子上的内核模块。

可以看出 iptable 功能是在内核态实现的（原生的）。因此其性能优于逻辑实现在用户态的相关网络应用。

### iptable 概念

> 参考： [iptables概念](https://www.zsythink.net/archives/1199)

netfilter 的是内核提供的通用编程接口，iptable 是基于通用编程接口实现的具有特定功能的工具。

iptable 工具对其要实现的功能进行了抽象，产生了如下一些概念。如果理解了这些概念，可以更好的使用 iptable。

#### 链

上文提到了，netfilter 提供的是在 TCP/IP 协议栈的流程中注入自定义的逻辑的能力。netfilter 在整个 TCP/IP 协议栈的流程中，提供了多个注入点（Hook），在 iptable 中，这些注入点称为链（Chain）。iptable 提供了 5 种链，分别是：

* PREROUTING （Pre Routing 路由前）
* INPUT （输入）
* OUTPUT （输出）
* FORWARD （转发）
* POSTROUTING （Post Routing）

数据包经过这些注入点的流程如下：

![iptable chain](/image/iptable-chain.svg)

#### 规则

有了链（注入点）概念后，iptable 定义在这个注入上，每个 ip 数据包，满足什么样的条件后，做什么事情。此处的，满足什么样的条件后，做什么事情就是一条规则。

因此，一条规则有如下三个核心属性：

* 链：该规则应用在哪个链上（哪个注入点）
* 匹配条件：该规则需要匹配那些数据包，条件是什么样的，如果存在多个条件，则所有都满足才算匹配（与关系）（参见：[iptables匹配条件总结之一](https://www.zsythink.net/archives/1544)）。
    * `-s` 源 ip 地址
    * `-d` 目标 ip 地址
    * `-p` 协议
    * `-i` 源网络接口
    * `-o` 目标网络接口
    * 扩展匹配条件（参见：[常用扩展模块](https://www.zsythink.net/archives/1564)）
        * `-m tcp --sport` TCP 源端口
        * `-m tcp --dport` TCP 目标端口
        * `-m tcp -m multiport --sports 22,36,80,8000:8999` 多个 TCP 源端口之一的
        * `-m tcp -m multiport --dports 22,36,80,8000:8999` 多个 TCP 目标端口之一的
        * 以上的 udp 都存在
        * `-m iprange --src-range 192.168.1.127-192.168.1.146 --dst-range xxx` iprange 扩展模块，匹配一段范围 ip。
        * `-m string --algo bm --string "xxxx"` string扩展模块，可以指定要匹配的字符串，如果报文中包含对应的字符串，则符合匹配条件。
        * `-m time --timestart 09:00:00 --timestop 18:00:00` time扩展模块，根据时间段区匹配报文，如果报文到达的时间在指定的时间范围以内，则符合匹配条件。
        * `-m connlimit --connlimit-above 2` 限制每个IP地址同时链接到server端的链接数量，如果不用指定IP，其默认就是针对每个客户端IP，即对单IP的并发连接数限制。
        * `-m limit` limit模块，定义报文到达速率进行限制。
* 动作（Target）：满足该规则的数据包，需要对该数据包做那些事情。
    * 基础动作（参见：[iptables动作总结之一](https://www.zsythink.net/archives/1684) | [iptables动作总结之二](https://www.zsythink.net/archives/1764)）
        * ACCEPT，接受数据包，进入后续流程，该规则后面的规则不会继续检测。
        * REJECT（可以使用 `--reject-with` 设置原因） 发送拒绝报文，该规则后面的规则不会继续检测。
        * LOG 记录日志，记录完成后，该规则后面的规则会继续检测。
        * DROP 丢弃该数据包，不会进入后续处理流程，发送者会一直等待到超时，该规则后面的规则不会继续检测。
        * RETURN 结束在目前规则链中的过滤程序。
            * 如果是在自定义链中 return，则会继续匹配主链中的规则
            * 如果是在主链（默认链）中 return，将使用当前链的默认行为。
        * REDIRECT 本地重定向，参见上文。
        * MASQUERADE 网络地址转换，参见上文。
        * SNAT 参见上文。
        * DNAT 参见上文。
        * QUEUE、MIRROR、MARK 略

#### 表

有了链和规则概念 iptable 就可以支撑 iptable 的功能了，但是多数场景都需要多个链上的规则共同配合才能实现。因此 iptable 按照场景定义几张表。

* `filter` 表： 实现过滤功能，防火墙。对应内核模块为 `iptables_filter`。
* `nat` 表：network address translation，网络地址转换。对应内核模块为 `iptable_nat`。
* `mangle` 表：拆解报文，做出修改，并重新封装。对应内核模块为 `iptable_mangle`。
* `raw` 表：关闭 nat 表上启用的连接追踪机制。对应的内核模块为 `iptable_raw`。

关于表：

* 每个表都对应一些具体的场景。
* 每个表可以为指定的几条链配置规则。
* 不同的表能配置的链是不同的，也就是说某些表无法配置某些链。
* 不通的表在同一个链上做的具体处理逻辑，也是不同的，对应的规则可能也是不同。

表链关系如下所示：

| 表 \ 链 | PREROUTING | INPUT | FORWARD | OUTPUT | POSTROUTING |
| ------- | ---------- | ----- | ------- | ------ | ----------- |
| raw     | ✅          |       |         | ✅      |             |
| mangle  | ✅          | ✅     | ✅       | ✅      | ✅           |
| nat     | ✅          | ✅     |         | ✅      | ✅           |
| filter  |            | ✅     | ✅       | ✅      |             |

在每个链上执行规则过程的优先为（从高到低）：raw -> mangle -> nat -> filter。

#### 自定义链

> 参考：[iptables自定义链](https://www.zsythink.net/archives/1625)

很多时候，实现某个需求时，需要在某个链中配置配置多条规则，如果直接将规则添加到指定链中，会造成管理复杂的问题。

因此 iptable 提供了自定义链的能力，自定义链是一组规则的集合。通过自定义链可以一次性的启用/停用/删除这些规则。

自定义链如果想要工作，最终要和一个默认链关联（被引用），同样一个自定义链也可以和其他自定义链关联。

如此一来，在默认链看来，规则被组织成了一个树形结构，如：

```

INPUT
    规则 1
    规则 2
    自定义链 1
        规则 a
        规则 b
        自定义链 c
            规则 i
            规则 ii
    自定义链 2
    规则 3

```

上文提到的 RETURN，将会跳出该自定义链的后续匹配规则，返回上一次层的匹配规则。

### 整体流程

![iptable process](/image/iptable-process.svg)

## iptable 命令详解

### 命令行样式

https://www.cnblogs.com/ym123/p/4567125.html

### 常用命令

https://blog.51cto.com/wenzhongxiang/1265510

## Go iptable SDK

参考 ipv6nat

## 实例：docker bridge 网络模拟实现

https://thiscute.world/posts/iptables-and-container-networks/#%E4%BA%8C%E5%AE%B9%E5%99%A8%E7%BD%91%E7%BB%9C%E5%AE%9E%E7%8E%B0%E5%8E%9F%E7%90%86---iptables--bridge--veth

http://www.adminsehow.com/2011/09/iptables-packet-traverse-map/

https://opengers.github.io/openstack/openstack-base-virtual-network-devices-bridge-and-vlan/

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
