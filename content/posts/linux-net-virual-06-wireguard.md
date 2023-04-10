---
title: "Linux 网络虚拟化技术（六） Wireguard VPN"
date: 2023-04-09T01:50:00+08:00
draft: false
toc: true
comments: true
tags:
  - linux
---

> 声明：在中文语境下，VPN 被特化为突破互联网管控手段的代名词。本文介绍的 VPN 并非这个含义，而是其原意，面向组织的虚拟私有网络。

## 概述

本系列上一篇文章，我们介绍了使用 tun/tap 实现一个简单的 vpn 的示例。在工业界，有很多成熟的商业或开源的 VPN 协议和实现。

传统的 VPN 协议有 OpenVPN、IPSec/L2TP、PPTP，但是这些 VPN 协议相对笨重复杂。

而本文介绍的 Wireguard 是极简、快速、现代的 VPN。据其官网称，其比 IPsec 更快、更简单、更精简和更有用，比 OpenVPN 具有更高的性能。可以运行在嵌入式设备和超级计算机、跨平台支持 Linux、Windows、macOS、BSD、iOS、Android。

选择 Wireguard 作为 VPN 的代表来介绍的另外一个重要原因是，Wireguard 已于 Linux 5.6 (2020) 进入 Linux 内核。

Wireguard 一些关键技术点如下：

* 极简，专注于 VPN 的安全和路由，C 代码据称只有 4000 行 (2020 年)。配置分发管理（秘钥、IP） Wireguard 不关注。
* 工作在 IP 层，IP 数据包加密后通过 UDP 隧道在节点间传输。
* 安全上 Wireguard 在这个流程上每个环节有且只有一种算法，这极大的简化了代码量，符合 Unix 极简哲学，使用者无需关心复杂的安全算法的选择。加密流程类似于 SSH。

## 模型

Wireguard 搭建了一个是由 interface 组成的虚拟网络。在这个网络中所有 interface 的都是对等，对数据包采用相同的处理逻辑。

interface 通过一个 `ini` 格式的配置文件定义，包含：

* 一个 `[interface]` 配置，即当前 interface 自身的属性。
* 多个 `[peer]` 配置，即当前 interface 可以直接感知到的其他 interface。

可以将 Wireguard 网络可视化为一个有向图，则一个 `interface` 配置的 `[interface]` 定义了这个有向图的 node，`[peer]` 定义了这个有向图的边。

![image](/image/wireguard-vpn-base-model.svg)

## 配置

在 Linux 中，Wireguard 配置文件位于 `/etc/wireguard` 目录。配置文件为 `<interface-name>.conf`，如 `/etc/wireguard/wg0.conf`。

正如上文所述，一个 interface 的配置包含两类，`[interface]` 和 `[peer]`。

`[interface]` 核心字段如下：

* `Address`，格式为带有子网后缀的 IP 地址，如 `192.168.96.1/24`，表示当前 interface 绑定的 IP 以及子网。这个字段是 `wg-quick` 识别的字段，用于生成 Linux interface，并配置一个默认路由。
* `PrivateKey`，当前 interface 的私钥，格式为一个 base64 字符串，由 `wg genkey` 命令生成。
* `ListenPort`，默认为 `51820`，监听的 UDP 端口，用于其他的 interface 和当前 interface 建立用于数据交换的 Tunnel。
* 其他字段参见： [wg-quick(8) — Linux manual page](https://man7.org/linux/man-pages/man8/wg-quick.8.html) | [WireGuard 教程：WireGuard 的搭建使用与配置详解 - 2、配置详解 - interface](https://icloudnative.io/posts/wireguard-docs-practice/#interface)

`[peer]` 核心字段如下：

* `PublicKey`，指向 interface 的公钥，格式为一个 base64 字符串，由 `wg pubkey < /path/to/pri-key` 命令生成。
* `AllowedIPs`，指向 interface 允许的 IP，网段格式，多个用逗号分隔，如 `192.168.96.2/32,192.168.31.0/24`。用来实现路由和流量过滤。即：
    * 出流量：经过本 interface 的出数据包的目标 ip 是否在该 IP 列表中，如果在，则出数据包将发到到该 peer 对应的远端 interface 中。
    * 入流量：来自该 peer 对应的 interface 的入数据包 的源 ip 是否在 IP 列表中，如果不在，将丢弃。
* `Endpoint` 可选，指向 interface 的隧道地址，格式为 `ip:port` 或 `domain:port`，域名解析发生在该接口启动的时刻。`port` 为指向 interface 的 `ListenPort` 字段值。
* `PersistentKeepalive` 配置了 `Endpoint` 时，可选配置，表示和 `Endpoint` 心跳间隔。
* 其他字段参见： [wg(8) — Linux manual page](https://man7.org/linux/man-pages/man8/wg.8.html) | [WireGuard 教程：WireGuard 的搭建使用与配置详解 - 2、配置详解 - peer](https://icloudnative.io/posts/wireguard-docs-practice/#peer)

## 流程

将上方模型图，扩充成一个目标为在网络的笔记本和手机可以访问家庭内网任意 ip 的场景：

* 家庭内网 `192.168.31.0/32`，网关 `openwrt`，没有公网 IP。
* 部署一个 VPN 网段 `192.168.96.0/24`。
* 具有公网 ip 的云服务器 `huawei`
* 两台移动设备，分别为笔记本电脑 `mac`，手机 `mi11`。

此时模型图变为：

![image](/image/wireguard-vpn-process.svg)

说明：

* 方块代表 interface， 红色字为 interface 的 Address 字段。
* 从方块出发的线表示该 interface 的 peer 配置，线上的字为 peer 的 `AllowedIPs`，即路由。
* 实线表示配置该 peer 配置了 `Endpoint`，换句话说，实线代表一个 tunnel，这些 interface 一旦 up，这些 tunnel 将根据双方的公私钥自动建立起安全 tunnel。
* 两个 interface 之间可以连通的充分必要条件是：
    * 存在两个相互指向的线（即，两个 interface 需要分别配置指向对方的 peer，目的是双方都配置好公私钥）。
    * 这两个线至少有一个实线（即，网络至少单向可通，需要建立一个 tunnel，用来传输数据）。
* 因为 huawei 设备具有公网 ip，所以 mi11、mac、openwrt 才能有一个实线指向 huawei。

下面分析如下几个场景的数据流：

* mi11 访问 openwrt，sip 为 192.168.96.3，dip 为 192.168.96.2。
    * ip 包从应用到达 `mi11` 的 wireguard interface，该 interface 查询 peer 列表，发现第一个 peer 的 AllowedIPs 的 `192.168.96.0/24` 能匹配上该数据包的 dip。因此数据通过 `m11 -> huawei` 的 UDP tunnel，发送到 `huawei` 的 wireguard interface。
    * ip 包到达 `huawei` 的 wireguard interface，该 interface 查询 peer 列表，发现第一个 peer 的 AllowedIPs 的 `192.168.96.2/32` 能匹配上该数据包的 dip。因此数据通过 `openwrt -> huawei` 的 UDP tunnel，发送到 `openwrt` 的 wireguard interface。这里值得提一下的是，在 tunnel 视角，这个 tunnel 的方向是 `openwrt -> huawei`，即 openwrt 侧发起建立的，但是 `huawei -> openwrt` 的 ip 数据包，是可以通过该 tunnel 从 `huawei` 发送到 `openwrt` 的。
    * ip 包到达 `openwrt` 的 wireguard interface，该 interface 发现目标 ip 就是当前 interface ip，说明该数据包的目标就是当前设备。于是，该数据包将传送到应用层。
    * 流程结束。
* mi11 访问 nas，sip 为 192.168.96.3，dip 为 192.168.31.5。
    * 前面的流程和第一个场景的 1、2 步一致，只是参数不同。
    * ip 包到达 `openwrt` 后，会查询当前设备的路由表，发现 dip 在当前 lan 局域网内，于是将 ip 包发送到 nas 设备。这里值得提一下的是，该流程和 wiredguard 没有关系，是 openwrt 自身对路由表的处理逻辑了。
* pc 访问 mac。sip 为 192.168.31.2，dip 为 192.168.96.4。
    * ip 包从应用到达 `pc` 的内核，内核通过默认路由发送到网关 `openwrt`，这里值得提一下的是，该流程和 wiredguard 没有关系，是局域网的自身配置决定的。
    * 后续的流程和第一个场景的 1、2 步一致，只是参数不同。

## 实施细节

本部分将上文流程部分示例进行落地实施，这个过程有很多细节值得关注。

### 生成 key

建议在 Linux 系统安装 wireguard 工具集（安装参见：[下文](#配置-huawei)），通过命令行生成所有设备 wireguard 配置 interface 需要的公私钥。

```bash
cd /etc/wireguard/
umask 0077
wg genkey > huawei.key
wg genkey > openwrt.key
wg genkey > mi11.key
wg genkey > mac.key
umask 0022
wg pubkey < huawei.key > huawei.key.pub
wg pubkey < openwrt.key > openwrt.key.pub
wg pubkey < mi11.key > mi11.key.pub
wg pubkey < mac.key > mac.key.pub
```

### 配置 huawei

该设备为 Ubuntu 22.04，内核版本为  5.15，因此不需要升级内核（如果内核小于 5.6 需先升级内核），可以直接安装（参考：[官方文档](https://www.wireguard.com/install/#ubuntu-module-tools)）。

```bash
sudo apt update
sudo apt install wireguard
```

配置文件 `vim /etc/wireguard/wg0.conf`。

```ini
[Interface]
# Name = huawei
Address = 192.168.96.1/24
PrivateKey = xxx # cat huawei.key 获取
ListenPort = 51820

[Peer]
# Name = openwrt
AllowedIPs = 192.168.96.2/32,192.168.31.0/24
PublicKey = xxx # cat openwrt.key.pub 获取

[Peer]
# Name = mi11
AllowedIPs = 192.168.96.3/32
PublicKey = xxx # cat mi11.key.pub 获取

[Peer]
# Name = mac
AllowedIPs = 192.168.96.4/32
PublicKey = xxx # cat mac.key.pub 获取
```

启动 wg0 接口 `wg-quick up wg0`。

内核需开启 forward 等内核参数：

```bash
# ipv4 包转发
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
# arp 代理
echo "net.ipv4.conf.all.proxy_arp = 1" >> /etc/sysctl.conf
# ipv6 包转发
echo "net.ipv6.conf.all.forwarding = 1" >> /etc/sysctl.conf
# 应用配置
sysctl -p /etc/sysctl.conf
```

如果需要通过该节点转发外网访问流程，需配置 iptables 开启 NAT。

```bash
iptables -A INPUT -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -i wg0 -o wg0 -m conntrack --ctstate NEW -j ACCEPT
# 192.168.96.0/24 为 VPN 网段，eth0 为公网出口网卡设备。
iptables -t nat -A POSTROUTING -s 192.168.96.0/24 -o eth0 -j MASQUERADE
```

测试路由是否正常：

```bash
ip route get 192.168.96.2
ip route get 192.168.31.1
```

最后，需要到云服务器管理后台开放 UDP 51820 端口入流量。

### 配置 openwrt

> openwrt 各种定制版层出不穷，本文介绍的官方编译版本，版本号为： 22.03 x86_64。

openwrt 提供了 GUI 方式配置 wiredguard 的包，打开 WebUI -> 系统 -> Sofeware。搜索安装： `luci-app-wireguard`、`wireguard-tools`、`luci-i18n-wireguard-zh-cn`，然后重启 Openwrt。

配置文件如下：

```ini
[Interface]
# Name = openwrt
Address = 192.168.96.2/32
PrivateKey = xxx # cat openwrt.key 获取

[Peer]
# Name = huawei
Endpoint = <huawei 公网IP>:51820
AllowedIPs = 192.168.96.0/24
PublicKey = xxx # cat huawei.key.pub 获取
PersistentKeepalive = 15
```

打开 WebUI -> 网络 -> 接口 -> 添加新接口，填写如下信息，点击创建接口。

* 名称： wg0
* 协议：WireGuard VPN

常规设置，导入配置文件，点击加载配置文件，将上面配置文件粘贴进来，点击导入配置。然后进行一些额外的配置

* 对端 -> 第一个条目 -> 编辑， 勾选路由允许的 IP。添加对 AllowedIPs 路由。这样才能实现局域网内的设备通过 VPN IP 访问其他设备。

然后，一直点保存、保存并应用。

目前，还有个问题，即在 `huawei` 上无法访问 `192.168.31.0/24` 上的 IP。原因是没有给 OpenWrt  wg0 配置防火墙，配置方法如下：

* 打开 OpenWrt WebUI -> 网络 -> 防火墙 -> 常规配置 -> Zone，点击添加，填写如下内容（该部分是试出来的，并不太理解）：
    * 名称： wg0
    * Input、Output、Forward： accept
    * Masquerading： 勾选
    * Covered network：选择 wg0、lan （如果没有 wg0 可以先创建出来后面再编辑）
    * Allow forward to destination zones： lan
    * Allow forward from source zones： lan
* 保存并应用后，重新配置 wg0 接口。
    * WebUI -> 网络 -> 接口 -> wg0，编辑。
    * 防火墙设置，创建分配防火墙区域，选择 wg0。
* 保存并应用即可。

此时可以进行如下测试：

```bash
# huawei 上执行
ping 192.168.96.2
ping 192.168.31.1
# openwrt 上执行
ping 192.168.96.1
# pc 上执行
ping 192.168.96.1
```

如上均可以 ping 通，说明配置正确。

### 配置 mi

前往 [f-droid](https://f-droid.org/en/packages/com.wireguard.android/) 下载安装最新版安卓客户端。

配置文件如下：

```ini
[Interface]
# Name = mi11
Address = 192.168.96.3/32
PrivateKey = xxx # cat mi11.key 获取

[Peer]
# Name = huawei
Endpoint = <huawei 公网IP>:51820
AllowedIPs = 192.168.96.0/24,192.168.31.0/24
PublicKey = xxx # cat huawei.key.pub 获取
PersistentKeepalive = 15
```

打开 Android App，点击加号，导入配置，或者手动填写配置，保存后，点击开关开启 VPN。

验证方法为：

* 在 `huawei`，`ping 192.168.96.3` 是否可以 ping 通
* 在 `mi11`，关闭 WIFI，使用数据流量，打开 VPN：
    * 打开浏览器，访问 OpenWrt 的 WebUI 的内网地址，本例中为 `192.168.31.254`，是否可以正常打开。
    * 打开 ES 文件浏览器，是否可以连接到 NAS 上的 Samba 服务器。

### 配置 mac

在中国大陆地区无法从 App Store 下载 [GUI 版本 wireguard](https://apps.apple.com/us/app/wireguard/id1451685025)，因此本部分将介绍 cli 方式。

```bash
brew install wireguard-tools
```

配置文件 `vim /etc/wireguard/wg0.conf`。

```ini
[Interface]
# Name = mac
Address = 192.168.96.4/32
PrivateKey = xxx # cat mac.key 获取

[Peer]
# Name = huawei
Endpoint = <huawei 公网IP>:51820
AllowedIPs = 192.168.96.0/24,192.168.31.0/24
PublicKey = xxx # cat huawei.key.pub 获取
PersistentKeepalive = 15
```

启动 wg0 接口 `wg-quick up wg0`。

## 用户态实现

在某些情况下，无法将内核升级到 5.6 之上，此时可以选择官方用户态实现（[官方代码仓库](https://www.wireguard.com/repositories/) 列表）：[wireguard-go](https://github.com/WireGuard/wireguard-go)。

```bash
# 依赖
apt update
apt install -y git libmnl-dev libelf-dev build-essential pkg-config
# 安装 Go
wget https://go.dev/dl/go1.20.3.linux-amd64.tar.gz
tar -zxvf go1.20.3.linux-amd64.tar.gz
rm -rf go1.20.3.linux-amd64.tar.gz
mv go /usr/local/
echo 'export PATH=/usr/local/go/bin:$PATH' >> /etc/profile
export PATH=$PATH:/usr/local/go/bin
# 编译安装 wireguard-go
git clone https://git.zx2c4.com/wireguard-go
cd wireguard-go
# 最新版似乎有 bug，卡在 [#] wg setconf utun2 /dev/fd/63
# https://bugs.freebsd.org/bugzilla/show_bug.cgi?id=253537
git checkout 0.0.20201118
go build -v -o "wireguard-go"
mv wireguard-go /usr/sbin/wireguard-go
cd ../
rm -rf wireguard-go
# 编译安装 WireGuard
git clone https://git.zx2c4.com/WireGuard
cd WireGuard/src/tools
make && make install
cd ../../../
rm -rf WireGuard
```

注意：该实现依赖 tun 内核模块，需开启，才能正常工作。

后续步骤和上文[配置 huawei](#配置-huawei) 一致。

设置开启自动启动：

```bash
systemctl enable wg-quick@wg0
```

## 基于 Wireguard VPN 的应用

从上面可以看出 Wireguard VPN 专注于 VPN 核心问题，解决流量加密和 Tunnel 问题。直接使用配置起来非常麻烦。因此，业界有基于 Wireguard 的面相普通用户更友好的商业产品： [tailscale](https://tailscale.com/) 比较适合小型组织。类似对开源届也实现了 tailscale 的开源替代 [headscale](https://github.com/juanfont/headscale)。当然面向大型组织，可以基于 Wireguard VPN 根据自身需求自研自己的 VPN 服务。

除了面向组织的 VPN 场景，Wireguard VPN 的另一个重要场景就是云原生领域。基于 Wireguard VPN 的 k8s 网络插件，实现搭建跨内网，跨云的 k8s 集群。这个网络插件 [Kilo](https://kilo.squat.ai/)。

## 参考

* [官网](https://www.wireguard.com/)
* [wg-quick(8) — Linux manual page](https://man7.org/linux/man-pages/man8/wg-quick.8.html)
* [wg(8) — Linux manual page](https://man7.org/linux/man-pages/man8/wg.8.html)
* [云原生实验室 #WireGuard#](https://icloudnative.io/tags/wireguard/page/2/)
