---
title: "Linux 网络虚拟化技术（四）iptables"
date: 2022-04-21T00:24:21+08:00
draft: true
toc: true
comments: true
tags:
  - linux
---

> 参考：[zsythink iptables 系列博客](https://www.zsythink.net/archives/category/%e8%bf%90%e7%bb%b4%e7%9b%b8%e5%85%b3/iptables/) | [iptables manual](https://linux.die.net/man/8/iptables)

## iptables 简述

iptables 是一套针对 Linux 的，对 ipv4（ipv6 也存在对应的工具 ip6table） 数据包（流量）管理工具。在常见的 Linux 发行版均已预装，提供了如：包过滤、端口转发、NAT、流量审计等功能。

## 准备

确保系统已经安装 iptables。

```bash
sudo apt install iptables
```

确保测试虚拟机的网络接口配置为（`ip addr show`）：

* enp0s3 网卡1 - 选择 NAT，IP 地址为 `10.0.2.15/24`（不固定），用于访问公网。
* enp0s8 网卡2 - 选择 仅主机网络，IP 地址为 `192.168.56.3/24`，用于 SSH 连接
* enp0s9 网卡3 - 选择 仅主机网络，IP 地址为 `192.168.57.3/24`，用于测试 iptables 规则。

配置方式参见：

* [容器核心技术（一） 实验环境准备 & Linux 概述](/posts/container-core-tech-1-experiment-preparation-and-linux-base/#实验环境准备)
* [Linux 网络虚拟化技术（三）bridge 虚拟设备](/posts/linux-net-virual-03-bridge/#实验准备)

## 测试程序

使用 C 语言。编写与一个简单的 TCP Server 测试程序，监听在 1234 端口。

该程序将，接收 TCP 请求，并响应一个字符串。该字符串包含如下信息：

* 本次 TCP 请求的 Source IP、Source Port。
* 本次 TCP 请求的 Destination IP、Destination Port。
* 通过 `getsockopt` 配合 `SO_ORIGINAL_DST` 拿到的原始 Destination IP 和 Destination Port，如果报错将显示错误信息。

响应完成后，将关闭该 TCP 连接。

```cpp
// 必须安装 iptables 否则会报错：getsockopt error: Protocol not available
// 运行： gcc ./src/c/03-iptables/test-iptables-server.c && sudo ./a.out
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

        // 不能一次性调用 sprintf ，原因是 inet_ntoa 共享一个 cache。
        // https://stackoverflow.com/questions/48799606/inet-ntoa-gives-the-same-result-when-called-with-two-different-addresses
        memset(send_buff, 0, sizeof(send_buff));
        sprintf(send_buff, "source{ip: %s, port: %d}; ",
                inet_ntoa(source_addr.sin_addr), ntohs(source_addr.sin_port));
        send(cfd, send_buff, strlen(send_buff), 0);
        memset(send_buff, 0, sizeof(send_buff));
        sprintf(send_buff, "dest{ip: %s, port: %d}; ",
                inet_ntoa(dest_addr.sin_addr), ntohs(dest_addr.sin_port));
        send(cfd, send_buff, strlen(send_buff), 0);
        memset(send_buff, 0, sizeof(send_buff));
        sprintf(send_buff, "original dest{%s: %s, %s: %d}\n",
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

通过 `gcc ./src/c/03-iptables/test-iptables-server.c && sudo ./a.out` 命令编译运行。

通过 nc 命令访问该 server，`nc localhost 1234`，可以看到该测试程序的返回打印出来：

```
source{ip: 127.0.0.1, port: 55958}; dest{ip: 127.0.0.1, port: 1234}; original dest{strerror: Protocol not available, errno: 92}
```

此时是正常访问，可以看出：

* 源 IP Port 为 `127.0.0.1:55958`。
* 目的 IP Port 为 `127.0.0.1:1234`。
* 由于没有进行 NAT 所以无法获取原始目标 IP Port，所以返回 `Protocol not available` 错误信息。

## iptables 使用场景

* 写一个简单 socket 程序用来测试。
* 重点画出，ip/tcp 包的内容变化。

### 查看规则

> 参考：[iptables详解（2）：iptables实际操作之规则查询](https://www.zsythink.net/archives/1493)

```bash
sudo iptables --line-numbers -t filter -nvL INPUT
```

* `-t filter` 查看 `filter` 表（不填写时默认为 `filter`）。表的概念参见下文：[iptables 概念 - 表](#表)。
* `--line-numbers` 展示规则在该链中的序号，可以简写为 `--line`。
* `-n` 不对 IP 地址进行名称反解，以提高性能。
* `-v` 展示更多详细信息。
* `-L` 列出规则。
* `INPUT` 展示某个链的规则列表（不填写展示全部的链）。

输出如下所示：

```
Chain INPUT (policy ACCEPT 1352 packets, 252K bytes)
num   pkts bytes target     prot opt in     out     source               destination
```

* 第一行为下面表格的标题，展示当前列表是哪个链上的规则，括号里面的内容为该链的默认规则的流量细信息。
    * `packets` 表示当前链（上例为 INPUT 链）默认策略匹配到的包的数量。
    * `bytes` 表示当前链默认策略匹配到的所有包的大小总和（通过 `-x` 可以展示精确数字）。
* 第二行为表格的表头，第三行开始为表格的内容。该表格的包含如下列：
    * `num` 规则序号，从 1 开始，序号越小优先级越高。
    * `pkts` 对应规则匹配到的报文的个数。
    * `bytes` 对应匹配到的报文包的大小总和（通过 `-x` 可以展示精确数字）。
    * `target` 规则对应的target，往往表示规则对应的动作，即规则匹配成功后需要采取的措施。
    * `prot` 表示规则对应的协议，是否只针对某些协议应用此规则。
    * `opt` 表示规则对应的选项。
    * `in` 表示数据包由哪个接口(网卡)流入，即从哪个网卡来。
    * `out` 表示数据包将由哪个接口(网卡)流出，即到哪个网卡去。
    * `source` 表示规则对应的源头地址，可以是一个IP，也可以是一个网段。
    * `destination` 表示规则对应的目标地址。可以是一个IP，也可以是一个网段。

### 主机防火强

> 参考：[iptables详解（3）：iptables规则管理](https://www.zsythink.net/archives/1517)

#### 描述

iptables 最核心的功能就是防火墙，防火墙的实现方式是按照配置的规则对 IP 数据包进行过滤，如果包符合规则，则允许通过，否则不允许通过。

主机防火箱指的是对该主机的出入流量的包过滤能力，在 iptables 中通过 `filter` 表实现，按照数据包的方向可以分为如下两类：

* INPUT - 入流量数据包过滤，一般在如下场景中使用：
    * 屏蔽指定源 IP 的数据包（封禁 DDos 攻击 IP）。
    * 仅开放某些 IP 的某些特殊端口的访问（如 22 号 ssh 端口），而屏蔽其他 IP 的访问。
* OUTPUT - 出流量数据包过滤，一般在如下场景中使用：
    * 屏蔽某些特殊目的 IP 的访问（站点）。

#### 示例说明

添加一条屏蔽来自 192.168.57.1 的数据包的规则的命令如下：

```bash
sudo iptables -t filter -I INPUT -s 192.168.57.1 -j DROP
```

* `-t filter` 将规则写入 `filter` 表，表示该规则是一个包过滤类型的规则。表的概念参见下文：[iptables 概念 - 表](#表)。
* `-I INPUIT` 将规则应用在 `INPUT` 链中，表示是一条入流量过滤规则，默认情况下将该规则添加到规则链的最上方（即优先级最高），如果想将该规则放在某个序号的位置该参数应该写为：`-I INPUT 1`（此处的 `1` 的取值范围为 `1 ~ MaxNumber+1`）。链的概念参见下文：[iptables 概念 - 链](#链)。
* `-s 192.168.57.1` 表示该规则的匹配条件是：匹配源 IP 为 `192.168.57.1` 的数据包（在本实验中为宿主机）。其他可用的匹配条件，参见下文：[iptables 概念 - 规则](#规则)。
* `-j DROP` 表示该规则匹配后的执行动作是：丢弃该数据包，发送者将会一直等待到超时。其他可用的执行动作，参见下文：[iptables 概念 - 规则](#规则)。

通过 `sudo iptables --line -nvL INPUT` 命令，可以看到刚刚配置的规则：

```
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
num   pkts bytes target     prot opt in     out     source               destination         
1        0     0 DROP       all  --  *      *       192.168.57.1         0.0.0.0/0
```

此时，在宿主机执行 `nc 192.168.57.3 1234`，发现长时间获得不到输出，将卡住。

最后，通过如下命令可以删除规则：

```bash
# 方式 1：通过规则的序号删除（上一步的 num 值）
sudo iptables -t filter -D INPUT 1
# 方式 2：通过规则的匹配条件和动作删除（即将添加规则的 -I 更改为 -D）
sudo iptables -t filter -D INPUT -s 192.168.57.1 -j DROP
# 方式 3：清空某张表某条链上的全部规则
sudo iptables -t filter -F INPUT
# 方式 3：清空某张表的全部规则
sudo iptables -t filter -F
```

此时，再在宿主机执行 `nc 192.168.57.3 1234`，将获得如下输出：

```
source{ip: 192.168.57.1, port: 50262}; dest{ip: 192.168.57.3, port: 1234}; original dest{strerror: Protocol not available, errno: 92}
```

#### 默认动作

> 参考： [iptables详解（9）：iptables的黑白名单机制](https://www.zsythink.net/archives/1604)

通过 `sudo iptables -nvL INPUT` 输出的 `policy ACCEPT` 部分的 `ACCEPT` 表示该链的默认动作为 `ACCEPT`：

```
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination   
```

默认动作的执行表示在没有匹配项的规则时执行的动作，因此，通过默认动作可以配置某一个链是白名单还是黑名单：

* `policy ACCEPT` 默认放行，即链规则为黑名单制。
* `policy DROP` 默认丢弃，即链规则为白名单制。

可以通过如下命令，修改某个链的默认动作：

```bash
sudo iptables -t filter -P INPUT DROP
```

### 网络防火箱

> 参考： [iptables详解（11）：iptables之网络防火墙](https://www.zsythink.net/archives/1663)

和主机防火墙不同，网络防火墙指的是位于一个网络（多台主机）的入口位置（网关/路由器），对包转发进行包过滤的能力。在 iptables 中可以通过 filter 表的 `FORWARD` 链实现。

此外，网络防火强本事就是一个网关，因此需要开启 Linux 内核的 Forward 特性（`sysctl -w net.ipv4.ip_forward=1`），开启该特性后，该主机才会像路由器一样进行包转发。

一个配置示例如下所示：

```bash
# 开启内核的 ip forward 特性
cat /proc/sys/net/ipv4/ip_forward
sysctl -w net.ipv4.ip_forward=1

# 只允许网络内主机，访问网络外主机的 80 与 22 端口。
iptables -A FORWARD -j REJECT
iptables -I FORWARD -s 网段 -p tcp --dport 80 -j ACCEPT
iptables -I FORWARD -d 网段 -p tcp --sport 80 -j ACCEPT
iptables -I FORWARD -s 网段 -p tcp --dport 22 -j ACCEPT
iptables -I FORWARD -d 网段 -p tcp --sport 22 -j ACCEPT
```

### 转发到本地某端口（REDIRECT）

> 参考：[iptables详解（13）：iptables动作总结之二](https://www.zsythink.net/archives/1764)

将端口转发到另一个端口，比如将 12345 端口转发到本机的 1234 端口。

```bash
sudo iptables -t nat -I PREROUTING -p tcp --dport 12345 -j REDIRECT --to-ports 1234
sudo iptables -t nat -I OUTPUT -p tcp -o lo --dport 12345 -j REDIRECT --to-ports 1234
```

* 第一行实现的是目标端口为 12345 的 外部 TCP 入流量将转发到本地的 1234 端口。
* 第二行实现的是目标端口为 12345 的 loopback TCP 入流量将转发到本地的 1234 端口（参考：[iptables port redirect not working for localhost](https://serverfault.com/questions/211536/iptables-port-redirect-not-working-for-localhost)）。

在虚拟机上执行完成上述命令后：

* 在虚拟机上执行 `nc localhost 12345` 输出如下：

    ```
    source{ip: 127.0.0.1, port: 46246}; dest{ip: 127.0.0.1, port: 1234}; original dest{ip: 127.0.0.1, port: 12345}
    ```

* 在宿主机上执行 `nc 192.168.57.3 12345` 输出如下：

    ```
    source{ip: 192.168.57.1, port: 60332}; dest{ip: 192.168.57.3, port: 1234}; original dest{ip: 192.168.57.3, port: 12345}
    ```

可以看出，客户端向 12345 端口发送数据时，服务端看到的 dest port 是经过转发的 1234。通过 `getsockopt` 可以从内核中获取到原始的 dest port 是 12345。

以宿主机 192.168.57.1 向虚拟机 192.168.57.3:12345 发送请求为例，流量过程如下所示：

* 请求
    * 宿主机构造 TCP 数据包：`source{ip: 192.168.57.1, port: 60332}; dest{ip: 192.168.57.3, port: 12345}`。
    * 虚拟机内核 iptables PREROUTING 链：
        * 修改数据包为：`source{ip: 192.168.57.1, port: 60332}; dest{ip: 192.168.57.3, port: 1234}`。
        * 更新 NAT 连接表（个人推测）：
            * key: `source{ip: 192.168.57.1, port: 60332}`
            * value:
                * `dest{ip: 192.168.57.3, port: 1234}`
                * `original dest{ip: 192.168.57.3, port: 12345}`
    * 用户测试程序：
        * `accept` 系统调用获取到： `source{ip: 192.168.57.1, port: 60332}`。
        * `getsockname` 系统调用获取到： `dest{ip: 192.168.57.3, port: 1234}`。
        * `getsockopt` 获取到 iptables 记录的原始目标地址：`original dest{ip: 192.168.57.3, port: 12345}`。
* 响应
    * 用户测试程序，构造响应 TCP 数据包：`source{ip: 192.168.57.3, port: 1234}; dest{ip: 192.168.57.1, port: 60332}`。
    * 虚拟机内核 iptables 处理（个人推测）：
        * 根据 `dest{ip: 192.168.57.1, port: 60332}` 查找 NAT 连接表，获取原始目标地址。
        * 修改数据包为：`source{ip: 192.168.57.3, port: 12345}; dest{ip: 192.168.57.1, port: 60332}`。
    * 宿主机接收到响应并打印输出。

上述流程如下图所示：

```
          sip: 192.168.57.1, sport: 60332                          sip: 192.168.57.1, sport: 60332
                            +------------+                                           +------------+
          dip: 192.168.57.3,|dport: 12345|                         dip: 192.168.57.3,|dport: 1234 |
                            +------------+                                           +------------+
        ---------------------------------------> NAT (REDIRECT)  --------------------------------------->
Client                                                                                                      Server
        <--------------------------------------- NAT (REDIRECT)  <---------------------------------------
                            +------------+                                           +------------+
          sip: 192.168.57.3,|sport: 12345|                         sip: 192.168.57.3,|sport: 1234 |
                            +------------+                                           +------------+
          dip: 192.168.57.1, dport: 60332                          dip: 192.168.57.1, dport: 60332
```

从流量图可以看出，在一次请求/响应过程中（DNAT 也类似，后文将不再赘述）：
* 虽然 REDIRECT 只是在 `PREROUTING` 配置的动作，从而导致，在请求过程中修改了数据包的 dest port。
* 但是 iptables 会自动的在响应过程中将 source port 复原回来。

从上述说明可以看出 REDIRECT 和 自己在应用层实现一个端口转发服务效果看起来是类似的，但是 REDIRECT 有应用层端口无法提供的如下优点：

* 性能更高：由于 iptables 在内核层实现，性能更高，整体上只需经过一次协议栈。而应用层实现服务需要至少经过两次协议栈。
* 对应用透明：由于 iptables 的 REDIRECT 是在协议栈层面实现的，因此对应用来说，感知到的源地址就是真实的源地址；而应用层实现感知到的源地址是端口转发服务的源地址，导致源地址信息丢失。

最后，执行如下命令，删除规则，恢复现场：

```bash
sudo iptables -t nat -D PREROUTING -p tcp --dport 12345 -j REDIRECT --to-ports 1234
sudo iptables -t nat -D OUTPUT -p tcp -o lo --dport 12345 -j REDIRECT --to-ports 1234
```

### 出入流量劫持（REDIRECT）

> 参考：[v2ray - Dokodemo-door](https://www.v2ray.com/chapter_02/protocols/dokodemo.html)。
* 对所有的出入站流量进行拦截，转到到本地的 proxy 中，从而实现 service mesh。参考： [Service Mesh中的 iptables 流量劫持](http://rui0.cn/archives/1619) 、 [Istio 中的 Sidecar 注入、透明流量劫持及流量路由过程详解](https://jimmysong.io/blog/sidecar-injection-iptables-and-traffic-routing/#iptables-%E6%B5%81%E9%87%8F%E5%8A%AB%E6%8C%81%E8%BF%87%E7%A8%8B%E8%AF%A6%E8%A7%A3) 、 [Istio的流量劫持和Linux下透明代理实现](https://www.ichenfu.com/2019/04/09/istio-inbond-interception-and-linux-transparent-proxy/)

利用 iptables 的 REDIRECT 可以实现对符合某些规则的出入站流量进行拦截。因此可以实现：

* 将所有出流量进行拦截，转发到本地的一个代理入口端口，该代理入口会解析目标 IP Port，将流量通过隧道从代理服务器侧发出，从而实现透明代理。参考：[v2ray - Dokodemo-door](https://www.v2ray.com/chapter_02/protocols/dokodemo.html)。
* 对所有的出入站流量进行拦截，转到到本地的 proxy 中，从而实现 service mesh。参考： [Service Mesh中的 iptables 流量劫持](http://rui0.cn/archives/1619) 、 [Istio 中的 Sidecar 注入、透明流量劫持及流量路由过程详解](https://jimmysong.io/blog/sidecar-injection-iptables-and-traffic-routing/#iptables-%E6%B5%81%E9%87%8F%E5%8A%AB%E6%8C%81%E8%BF%87%E7%A8%8B%E8%AF%A6%E8%A7%A3) 、 [Istio的流量劫持和Linux下透明代理实现](https://www.ichenfu.com/2019/04/09/istio-inbond-interception-and-linux-transparent-proxy/)。

### 转发到本地某端口（DNAT）

> 参考：[iptables详解（13）：iptables动作总结之二](https://www.zsythink.net/archives/1764)

将端口转发到另一个端口，比如将 12345 端口转发到本机的 1234 端口。

```bash
sudo iptables -t nat -I PREROUTING -p tcp --dport 12346 -j DNAT --to-destination 127.0.0.1:1234
sudo sysctl -w net.ipv4.conf.enp0s9.route_localnet=1
sudo iptables -t nat -I OUTPUT -p tcp -o lo --dport 12346 -j DNAT --to-destination 127.0.0.1:1234
# sudo sysctl -w net.ipv4.ip_forward=1
```

* 第一行实现的是目标端口为 12346 的 外部 TCP 入流量将转发到本地的 1234 端口。
* 第二行：因为第一行会将请求到 12346 的数据包的 dest ip 修改为 127.0.0.1，而默认情况下 Linux 协议栈会丢弃所有不是从 lo 接口的接收到的目标 IP 是 127.0.0.1 的数据包。因此，此处通过 `net.ipv4.conf.enp0s9.route_localnet=1` 开启 `enp0s9` 可以接受目标 IP 是 127.0.0.1 的数据包（参考： [redirect external request to localhost with iptables](https://unix.stackexchange.com/questions/570194/redirect-external-request-to-localhost-with-iptables)）。
* 第三行实现的是目标端口为 12346 的 loopback TCP 入流量将转发到本地的 1234 端口（参考：[iptables port redirect not working for localhost](https://serverfault.com/questions/211536/iptables-port-redirect-not-working-for-localhost)）。
* 最后一行：如果 `--to-destination` 指向的是其他主机的 ip，则需要通过该命令开启 forward 特性。

在虚拟机上执行完成上述命令后：

* 在虚拟机上执行 `nc localhost 12346` 输出如下：

    ```
    source{ip: 127.0.0.1, port: 57626}; dest{ip: 127.0.0.1, port: 1234}; original dest{ip: 127.0.0.1, port: 12346}
    ```

* 在宿主机上执行 `nc 192.168.57.3 12346` 输出如下：

    ```
    source{ip: 192.168.57.1, port: 58624}; dest{ip: 127.0.0.1, port: 1234}; original dest{ip: 192.168.57.3, port: 12346}
    ```

`nc 192.168.57.3 12346` 的过程如下图所示：

```
          sip: 192.168.57.1, sport: 60332                          sip: 192.168.57.1, sport: 60332
         +-------------------------------+                        +-------------------------------+
         |dip: 192.168.57.3, dport: 12346|                        |dip: 127.0.0.1,    dport: 1234 |
         +-------------------------------+                        +-------------------------------+
        ---------------------------------------> NAT (DNAT)  --------------------------------------->
Client                                                                                                      Server
        <--------------------------------------- NAT (DNAT)  <---------------------------------------
         +-------------------------------+                        +-------------------------------+
         |sip: 192.168.57.3, sport: 12346|                        |sip: 127.0.0.1,    sport: 1234 |
         +-------------------------------+                        +-------------------------------+
          dip: 192.168.57.1, dport: 60332                          dip: 192.168.57.1, dport: 60332
```

可以看出，通过 DNAT 可以实现和 REDIRECT 一样的效果，但是和 REDIRECT 相比：**DNAT 除了修改了数据包的 port 还修改了 ip**。

最后，执行如下命令，删除规则，恢复现场：

```bash
sudo iptables -t nat -D PREROUTING -p tcp --dport 12346 -j DNAT --to-destination 127.0.0.1:1234
sudo sysctl -w net.ipv4.conf.enp0s9.route_localnet=0
sudo iptables -t nat -D OUTPUT -p tcp -o lo --dport 12346 -j DNAT --to-destination 127.0.0.1:1234
```

注意：转发到本地某端口仅仅为了展示 DNAT 对数据包的修改情况，如果真的需要转发到本地某端口，应该直接使用：[转发到本地某端口（REDIRECT）](#转发到本地某端口redirect)（DNAT 需要配置网卡 `route_localnet` 很不优雅）

### 源网络地址转换（SNAT/MASQUERADE）

> 参考：[iptables详解（13）：iptables动作总结之二](https://www.zsythink.net/archives/1764)

在从上文（[准备](#准备)） 可以看到，实验用的虚拟机有三张网卡：

* enp0s3 网卡1 - 选择 NAT，IP 地址为 `10.0.2.15/24`（不固定），用于访问公网。
* enp0s8 网卡2 - 选择 仅主机网络，IP 地址为 `192.168.56.3/24`，用于 SSH 连接
* enp0s9 网卡3 - 选择 仅主机网络，IP 地址为 `192.168.57.3/24`，用于测试 iptables 规则。

为了方便演示，现在通过如下命令为 `enp0s9` 网卡添加一个 E 类地址（保留为研究测试使用的 IP 地址） `240.0.0.3/24`（注意不直接使用 `192.168.57.3/24` 的原因是，VirtualBox 虚拟机的网关会自动对将私有网络做一次 SNAT，这样就没法实现下述的效果了）：

```bash
sudo ip addr add 240.0.0.3/24 dev enp0s9
```

因此在虚拟机中，访问公网地址时，默认会通过 `enp0s3` 出去，源地址会被设置为 `10.0.2.15`（通过 `sudo tcpdump -e -n -i enp0s3` 观察）。比如执行 `curl qq.com` 将正常返回 html 文本。

此时手动指定源 IP 为 `240.0.0.3`， 比如执行 `curl --dns-interface enp0s3 --interface 240.0.0.3 qq.com` 将永远得不到返回。

此时，通过 iptables 的 SNAT 或者 MASQUERADE 动作可以实现，源 IP 为 `240.0.0.3`也可以访问公网。

```bash
sudo iptables -t nat -I POSTROUTING -p tcp -s 240.0.0.3/24 ! -d 240.0.0.3/24 -j SNAT --to-source 10.0.2.15
# sudo  iptables -t nat -I POSTROUTING -p tcp -s 240.0.0.3/24 ! -d 240.0.0.3/24 -o enp0s3 -j MASQUERADE
# sudo sysctl -w net.ipv4.ip_forward=1
```

* 第一行为：满足 IP 是 `240.0.0.3/24` 目标 IP 不是 `240.0.0.3/24` 的 TCP 数据包，将修改其源 IP 为 `10.0.2.15`。
* 第二行为：本例的另一种写法，满足 IP 是 `240.0.0.3/24` 目标 IP 不是 `240.0.0.3/24` 的 TCP 数据包，将修改其源 IP 为 enp0s3 绑定的 IP 地址（即 `10.0.2.15`）。
* 第三行为：本例中不需要，因为数据包来自本机。

此时再执行 `curl --dns-interface enp0s3 --interface enp0s9 qq.com`，将正常返回 html 文本。

SNAT 整个流程（通过 `sudo tcpdump -e -n -i enp0s3` 可以观察到修改后的数据包）：

```
         +-------------------------------+                       +-------------------------------+
         |sip: 240.0.0.3,    sport: 54321|                       |sip: 10.0.2.15,    sport: 49254|
         +-------------------------------+                       +-------------------------------+
          dip: qq.com addr,  dport: 80                            dip: qq.com addr,  dport: 80 
        ---------------------------------------> NAT (SNAT)  --------------------------------------->
Client                                                                                                      Server
        <--------------------------------------- NAT (SNAT)  <---------------------------------------
          sip: qq.com addr,  sport: 80                             sip: qq.com addr,  sport: 80 
         +-------------------------------+                        +-------------------------------+
         |dip: 240.0.0.3,    dport: 54321|                        |dip: 10.0.2.15,    dport: 49254|
         +-------------------------------+                        +-------------------------------+
```

最后，执行如下命令恢复现场：

```
sudo ip addr delete 240.0.0.3/24 dev enp0s9
sudo iptables -t nat -D POSTROUTING -p tcp -s 240.0.0.3/24 ! -d 240.0.0.3/24 -j SNAT --to-source 10.0.2.15
# sudo  iptables -t nat -D POSTROUTING -p tcp -s 240.0.0.3/24 ! -d 240.0.0.3/24 -o enp0s3 -j MASQUERADE
# sudo sysctl -w net.ipv4.ip_forward=0
```

### 转发到内网IP某端口（DNAT）

> 参考：[iptables详解（13）：iptables动作总结之二](https://www.zsythink.net/archives/1764)

以该 [博客模型](https://www.zsythink.net/archives/1764#wznav_3) 为例：

如果希望：主机 A 可以访问 主机 C 的 8080 端口，此时则需要在 主机 B 上执行如下命令：

```bash
sudo sysctl -w net.ipv4.ip_forward=1
sudo iptables -t nat -I PREROUTING -p tcp --dport 80 -j DNAT --to-destination 10.1.0.1:8080
```

此时流量过程为：

```
          sip: 192.168.1.147,sport: 54321                         sip: 192.168.1.147,sport: 54321
         +-------------------------------+                       +-------------------------------+
         |dip: 192.168.1.146,  dport: 80 |                       |dip: 10.1.0.1,     dport: 8080 |
         +-------------------------------+                       +-------------------------------+
        ---------------------------------------> NAT (DNAT)  --------------------------------------->
A                                                     B                                                 C
        <--------------------------------------- NAT (DNAT)  <---------------------------------------
         +-------------------------------+                        +-------------------------------+
         |sip: 192.168.1.146,  sport: 80 |                        |sip: 10.1.0.1,     sport: 8080 |
         +-------------------------------+                        +-------------------------------+
          dip: 192.168.1.147,dport: 54321                          dip: 192.168.1.147,dport: 54321
```

[博客 DNAT 章节](https://www.zsythink.net/archives/1764#wznav_5) 的说法不太正确，在此处只需要配置 DNAT 即可，不需要配置 SNAT（前提是 `10.1.0.1` 主机，有前往 `192.168.1.147` 的路由）。

最后，执行如下命令恢复现场：

```
sudo sysctl -w net.ipv4.ip_forward=0
sudo iptables -t nat -D PREROUTING -p tcp --dport 80 -j DNAT --to-destination 10.1.0.1:8080
```

测试是否可以实现公网 ip 的代理。

Docker 端口暴露原理：https://yeasy.gitbook.io/docker_practice/advanced_network/port_mapping

写个简单 tcp 测试程序，观察 source & dest ip port。

### 转发到公网IP某端口（DNAT&SNAT）

这里再描述一个复杂一点的例子，以我们实验的这个台虚拟机为例，从网络角度看：

```
公网 <---> 10.0.2.15/24 (拥有公网出口的内网) <---> 192.168.57.3/24 (内网)
                     |                                |
                      --------------------------------
                                    |
                                    v
                                测试虚拟机
```

此时如果想，192.168.57.3/24 网络上的机器，可以通过 `192.168.57.3:80` 访问 `qq.com:12347` （IP 从 `nslookup qq.com` 选取一个，本例中为 `183.3.226.35`）端口。

这次先分析下如何修改数据包才能实现该效果，假设我们只配置一个 DNAT：

```
          sip: 192.168.57.1,sport: 54321                          sip: 192.168.1.147,sport: 54321 
         +-------------------------------+                       +-------------------------------+
         |dip: 192.168.57.3, dport:12347 |                       |dip: 183.3.226.35, dport: 80   |
         +-------------------------------+                       +-------------------------------+
        ---------------------------------------> NAT (DNAT)  --------------------------------------->
宿主机                                               虚拟机                                                 qq.com
        <--------------------------------------- NAT (DNAT)  <---------------------------------------
                                                                  +-------------------------------+
                                                                  |sip: 183.3.226.35,   sport: 80 |
                                                                  +-------------------------------+
                                                                   dip:192.168.1.147, sport: 54321   # 回复消息的 dip 是个内网 IP 不可能，路由到我们的虚拟机中。
```

因此，我们还需要配置一个 SNAT，最总整体包修改流程如下图所示：

```
                                                                 +-------------------------------+                    +-------------------------------+
          sip: 192.168.57.1,sport: 54321                         |sip: 192.168.57.1, sport: 54321|                    |sip: 10.0.2.15,    sport: 43210|
         +-------------------------------+                       +-------------------------------+                    +-------------------------------+
         |dip: 192.168.57.3, dport:12347 |                       |dip: 183.3.226.35, dport: 80   |                     dip: 183.3.226.35, dport: 80
         +-------------------------------+                       +-------------------------------+                    
        ---------------------------------------> NAT (DNAT)  --------------------------------------->  NAT (SNAT)  --------------------------------------->
宿主机                                               虚拟机                                                虚拟机                                                宿主机 & 路由器 多级 SNAT  <--->   qq.com
        <--------------------------------------- NAT (DNAT)  <---------------------------------------  NAT (SNAT)  <---------------------------------------
         +-------------------------------+                       +-------------------------------+
         |sip: 192.168.57.3,sport: 12347 |                       |sip: 183.3.226.35,   sport: 80 |                     sip: 183.3.226.35, sport: 80
         +-------------------------------+                       +-------------------------------+                    +-------------------------------+
          dip: 192.168.57.1, dport: 54321                        |dip: 192.168.57.1, dport: 54321|                    |dip: 10.0.2.15,    dport: 43210|
                                                                 +-------------------------------+
```

命令如下：

```
sudo iptables -t nat -I PREROUTING -p tcp --dport 12347 -j DNAT --to-destination 183.3.226.35:80
sudo iptables -t nat -I POSTROUTING -p tcp -s 192.168.57.0/24 -d 183.3.226.35 -j SNAT --to-source 10.0.2.15
sudo sysctl -w net.ipv4.ip_forward=1
```

最终访问在宿主机执行 `curl 192.168.57.3:12347 -H  'Host: qq.com'` 将正常输出 html 文本。（注意，本例仅用于理解 SNAT 和 DNAT，实际上这种做法，在虚拟机内部是无法访问通的）

最后，执行如下命令恢复现场：

```bash
sudo iptables -t nat -D PREROUTING -p tcp --dport 12347 -j DNAT --to-destination 183.3.226.35:80
sudo iptables -t nat -D POSTROUTING -p tcp -s 192.168.57.0/24 -d 183.3.226.35 -j SNAT --to-source 10.0.2.15
sudo sysctl -w net.ipv4.ip_forward=0
```

### 访问日志

参考：[iptables详解（12）：iptables动作总结之一](https://www.zsythink.net/archives/1684)

```bash
sudo iptables -I INPUT -p TCP --dport 22 -j LOG
```

如上命令将会将 ssh 连接的数据包日志，记录到 /var/log/messages 文件中。（可通过 `etc/syslog.conf` 配置）。

注意和其他动作不同，LOG 行为不会终止后续规则的执行，也不会对数据包做任何修改。

## 总结

本部分主要介绍了，包过滤、 NAT 和数据包日志三个 iptables 的特性。

为了更好的理解 NAT，需要定义连接的概念。

以 TCP/UDP 为例，连接表示两方 A、B 的相互通讯，一个连接由四元组标识：`ipA, portA, ipB, portB`。

每个连接有两种类型的数据包，分别为：

* A -> B: sip = ipA, sport = portA, dip = ipB, dport = portB
* B -> A: sip = ipB, sport = portB, dip = ipA, dport = portA

假设 A 发送第一个数据包，则称 A 为客户端。B 为服务端。

有了如上的定义，我们可以这么理解 SNAT 和 DNAT：

* SNAT 用于按照配置修改，客户端到服务端的数据包的 sip 和 sport。而接收到服务端到客户端的数据包时，自动的修正 dip 和 dport。
* DNAT 用于按照配置修改，客户端到服务端的数据包的 dip 和 dport。而接收到服务端到客户端的数据包时，自动的修正 sip 和 sport。

因此，可以看出 NAT 是面向连接的，在上面的例子中：

* SNAT 将 A <-> B 的通讯修改为：
    * 在 A 看来：A <-> B
    * 在 B 看来：A' <-> B
* DNAT 将 A <-> B 的通讯修改为：
    * 在 A 看来：A <-> B'
    * 在 B 看来：A <-> B

## iptables 原理

### netfilter 框架

Linux 在内核层面实现 TCP/IP 协议栈，因此应用开发者只需要感知 Socket 网络编程模型即可实现常规的通过网络提供服务的程序。

但是，在有些场景，管理员需要，对 TCP/IP 数据包层面进行过滤修改，如上文提到的防火墙、NAT 等，在应用层是无法实现的。而需要在 TCP/IP 协议栈的流程中注入一些特殊的逻辑，才能实现。

因此 Linux 提供了 netfilter 框架，该框架定义了一套编程接口，允许实现该接口的程序（下文称为 Netfilter 程序）在 TCP/IP 协议栈的流程中注入自定义的逻辑（Hook）。

而 iptables 就是一套基于 netfilter 框架实现的程序，实现了管理员常用的防火墙和 NAT 等能力。（除了 iptables 之外，还有 [LVS](http://www.linuxvirtualserver.org/) 负载均衡器等）

和其他领域一样，通用的标准/接口是为了服务与某些特定现实需求的，因此 netfilter 的诞生实际上就是为起初的 iptables 提供服务的。iptables 和 netfilter 是用一个项目组下的项目。

更多参见： [netfilter.org](https://www.netfilter.org/)。

### iptables 架构

iptables 的由两个部分组成：

* 用户态空间提供的 iptables 命令行程序。
* 注册在内核中 netfilter 钩子上的内核模块。

可以看出 iptables 功能是在内核态实现的（原生的）。因此其性能优于逻辑实现在用户态的相关网络应用。

### iptables 概念

> 参考： [iptables概念](https://www.zsythink.net/archives/1199)

netfilter 的是内核提供的通用编程接口，iptables 是基于通用编程接口实现的具有特定功能的工具。

iptables 工具对其要实现的功能进行了抽象，产生了如下一些概念。如果理解了这些概念，可以更好的使用 iptables。

#### 链

上文提到了，netfilter 提供的是在 TCP/IP 协议栈的流程中注入自定义的逻辑的能力。netfilter 在整个 TCP/IP 协议栈的流程中，提供了多个注入点（Hook），在 iptables 中，这些注入点称为链（Chain）。iptables 提供了 5 种链，分别是：

* PREROUTING （Pre Routing 路由前）
* INPUT （输入）
* OUTPUT （输出）
* FORWARD （转发）
* POSTROUTING （Post Routing）

数据包经过这些注入点的流程如下：

![iptables chain](/image/iptables-chain.svg)

**注意：** localhost （127.0.0.1 / loopback） 的数据包只会经过 IPNUT 和 OUTPUT 链，不会经过 PREROUTING、FORWARD、POSTROUTING 链。

#### 规则

有了链（注入点）概念后，iptables 定义在这个注入上，每个 ip 数据包，满足什么样的条件后，做什么事情。此处的，满足什么样的条件后，做什么事情就是一条规则。

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
        * `-m tcp --tcp-flags SYN,ACK,FIN,RST,URG,PSH SYN,ACK` 用于匹配报文的tcp头的标志位，更多参见：[iptables详解（6）：iptables扩展匹配条件之 'tcp-flags'](https://www.zsythink.net/archives/1578)
        * `-m icmp --icmp-type 8/0` 匹配 icmp 报文 type = 8，code = 0 的报文，更多参见：[iptables详解（7）：iptables扩展之udp扩展与icmp扩展](https://www.zsythink.net/archives/1588)。
        * `-m iprange --src-range 192.168.1.127-192.168.1.146 --dst-range xxx` iprange 扩展模块，匹配一段范围 ip。
        * `-m string --algo bm --string "xxxx"` string扩展模块，可以指定要匹配的字符串，如果报文中包含对应的字符串，则符合匹配条件。
        * `-m time --timestart 09:00:00 --timestop 18:00:00` time扩展模块，根据时间段区匹配报文，如果报文到达的时间在指定的时间范围以内，则符合匹配条件。
        * `-m connlimit --connlimit-above 2` 限制每个IP地址同时链接到server端的链接数量，如果不用指定IP，其默认就是针对每个客户端IP，即对单IP的并发连接数限制。
        * `-m limit` limit模块，定义报文到达速率进行限制。
        * `-m state --state RELATED,ESTABLISHED` 匹配所有已经建立了连接的数据包（表示只允许主机访问外部，不允许外部访问主机），更多参见：[iptables详解（8）：iptables扩展模块之state扩展](https://www.zsythink.net/archives/1597)。
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

有了链和规则概念 iptables 就可以支撑 iptables 的功能了，但是多数场景都需要多个链上的规则共同配合才能实现。因此 iptables 按照场景定义几张表。

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

因此 iptables 提供了自定义链的能力，自定义链是一组规则的集合。通过自定义链可以一次性的启用/停用/删除这些规则。

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

自定义链的常见操作示例如下：

```bash
# 新增自定义链
sudo iptables -t filter -N MY_CHAIN
# 给自定义链添加规则
sudo iptables -t filter -I MY_CHAIN -s 192.168.57.1 -j DROP
# 在某个链中引用自定义链（和添加规则类似）
sudo iptables -t filter -I INPUT -j MY_CHAIN
# 取消某个自定义链的引用
sudo iptables -t filter -D INPUT -j MY_CHAIN
# 删除自定义链（保证引用数为 0 并且不包含任何规则的）
sudo iptables -X MY_CHAIN
# 重命名自定义链
iptables -E MY_CHAIN MY_CHAIN2
```

### 整体流程

![iptables process](/image/iptables-process.svg)

## iptables 命令

> 参见： [iptables(8) — Linux manual page](https://man7.org/linux/man-pages/man8/iptables.8.html)

```bash
### 新增规则 ###
# 方式 1：将规则添加到某个链的最上方（优先级最高、编号最小）
sudo iptables -t 表名 -I 链名 规则的匹配条件 规则的动作
# 方式 2：将规则添加到某个链的最下方（优先级最低、编号最大）
sudo iptables -t 表名 -A 链名 规则的匹配条件 规则的动作
# 方式 3：将规则添加到指定的编号位置（规则编号的取值范围为：1 ~ MaxNumber+1）
sudo iptables -t 表名 -I INPUT 规则编号 规则的匹配条件 规则的动作

### 查看规则 ###
sudo iptables --line-numbers -t 表名 -nvL 链名

### 删除规则 ###
# 方式 1：通过规则的序号删除
sudo iptables -t 表名 -D 链名 规则编号
# 方式 2：通过规则的匹配条件和动作删除（即将添加规则的 -I 更改为 -D）
sudo iptables -t 表名 -D 链名 规则的匹配条件 规则的动作
# 方式 3：清空某张表某条链上的全部规则
sudo iptables -t 表名 -F 链名
# 方式 3：清空某张表的全部规则
sudo iptables -t 表名 -F

### 修改规则（覆盖更新） ###
sudo iptables -t 表名 -R 链名 规则编号 规则的匹配条件 规则的动作  # 注意：规则的匹配条件和动作都不可省略

### 修改某个链的默认动作 ### 
sudp iptables -t 表名 -P 链名 动作

### 自定义链相关 ###
# 新增自定义链
sudo iptables -t 表名 -N 自定义链名
# 给自定义链添加规则
sudo iptables -t 表名 -I 自定义链名 规则的匹配条件 规则的动作
# 在某个链中引用自定义链
sudo iptables -t 表名 -I 链名 -j 自定义链名
# 取消某个自定义链的引用
sudo iptables -t 表名 -D 链名 -j 自定义链名
# 删除自定义链（保证引用数为 0 并且不包含任何规则的）
sudo iptables -X 自定义链名
# 重命名自定义链
iptables -E 自定义链名 新自定义链名
```

## 启动自动加载规则

安装 iptables 开机自动加载服务 `iptables-persistent`：

```bash
sudo apt install iptables-persistent
```

在安装过程中，会询问是否将当先的规则保存下来，可以选择是。

该服务（`sudo systemctl status iptables.service`）会在开机时自动加载如下 iptables 配置：

* `/etc/iptables/rules.v4`
* `/etc/iptables/rules.v6`

如果想将当前的规则配置到开机自动加载的文件，可以通过如下命令实现：

```bash
sudo sh -c 'iptables-save > /etc/iptables/rules.v4'
sudo sh -c 'ip6tables-save > /etc/iptables/rules.v6'
```

如果想手动从配置文件中加载配置，可以通过如下命令实现：

```bash
sudo iptables-restore < /etc/iptables/rules.v4
sudo ip6tables-restore < /etc/iptables/rules.v6
```

## Go iptables SDK

参考 ipv6nat

## 实例：docker bridge 网络模拟实现

https://blog.51cto.com/wenzhongxiang/1265510

目标：

* 可以访问外部网络
* 互相之间可访问
* 可以实现端口映射

https://thiscute.world/posts/iptables-and-container-networks/#%E4%BA%8C%E5%AE%B9%E5%99%A8%E7%BD%91%E7%BB%9C%E5%AE%9E%E7%8E%B0%E5%8E%9F%E7%90%86---iptables--bridge--veth

http://www.adminsehow.com/2011/09/iptables-packet-traverse-map/

https://opengers.github.io/openstack/openstack-base-virtual-network-devices-bridge-and-vlan/

* [Linux网络 - 数据包的接收过程](https://segmentfault.com/a/1190000008836467)
* [Linux网络 - 数据包的发送过程](https://segmentfault.com/a/1190000008926093)

https://segmentfault.com/a/1190000009249039
https://segmentfault.com/a/1190000009251098
https://segmentfault.com/a/1190000009491002

ip_forward与路由转发  https://blog.51cto.com/13683137989/1880744

主要看 iptables（netfilter）、bridge、veth 原理。

实战按照 ip 命令（iproute2），c 语言库（https://man7.org/linux/man-pages/man7/netlink.7.html）， go 语言（github.com/vishvananda/netlink）库来操作这些设备。

https://morven.life/posts/networking-2-virtual-devices/

nat 端口转发和路由网关 https://blog.jmal.top/s/iptables-nat-port-forwarding-route-gateway

Linux 虚拟网络设备详解之 Bridge 网桥  https://www.cnblogs.com/bakari/p/10529575.html
一文总结 Linux 虚拟网络设备 eth, tap/tun, veth-pair https://www.cnblogs.com/bakari/p/10494773.html

简述linux路由表 https://yuerblog.cc/2019/11/18/%E7%AE%80%E8%BF%B0linux%E8%B7%AF%E7%94%B1%E8%A1%A8/

<!-- TODO:  xtables-legacy vs xtables-nft-multi https://upload.wikimedia.org/wikipedia/commons/3/37/Netfilter-packet-flow.svg -->
