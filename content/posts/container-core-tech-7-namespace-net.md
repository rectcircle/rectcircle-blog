---
title: "容器核心技术（七） Network Namespace"
date: 2022-09-19T00:01:00+08:00
draft: false
toc: true
comments: true
tags:
  - 云原生
---

> 手册页面：[network namespaces](https://man7.org/linux/man-pages/man7/network_namespaces.7.html)。

## 背景知识

Linux 网络话题非常庞大，在阅读 Network Namespace 之前，建议阅读 Linux 网络相关的系列文章：

* [通过和 IPv4 对比，学习 IPv6](https://www.rectcircle.cn/posts/learn-ipv6-by-ipv4-diff/)
* [通过 Linux API 学习网络协议栈（一）概览](/posts/learn-net-proto-stack-by-linux-api-1-overview/)
* [通过 Linux API 学习网络协议栈（二）IP 协议](/posts/learn-net-proto-stack-by-linux-api-2-ip/)
* [Linux 网络虚拟化技术（一）概览](/posts/linux-net-virual-01-overview/)
* [Linux 网络虚拟化技术（二）veth 虚拟设备](/posts/linux-net-virual-02-veth/)
* [Linux 网络虚拟化技术（三）bridge 虚拟设备](/posts/linux-net-virual-03-bridge/)
* [Linux 网络虚拟化技术（四）iptables](/posts/linux-net-virual-04-iptables/)
* [Linux 网络虚拟化技术（五）隧道技术](/posts/linux-net-virual-05-tunnel/)

## 描述

网络名字空间提供了如下网络相关资源的隔离：

* 网络设备（veth、bridge 等）
* ipv4、ipv6 协议栈
* ip 路由表、防火墙规则 (netfilters/iptables)
* `/proc/net` 目录（指向 `/proc/PID/net` 的软链）、`/sys/class/net` 目录、`/proc/sys/net` 下的各种文件、端口号 (socket) 等等。
* UNIX domain abstract socket （注意是 abstract、是 Linux 特有的一种 Unix domain socket 类型，即绑定的路径不会再真正的文件系统中呈现， [ls 看不到](https://unix.stackexchange.com/questions/206386/what-does-the-symbol-denote-in-the-beginning-of-a-unix-domain-socket-path-in-l)，解决了 socket 文件可能被误删的问题）。

当一个网络名字空间释放后：

* 该网络名字空间中的**物理网络设备**将会被移动回初始的网络名字空间（而非父进程）。
* 该网络名字空间中的**虚拟网络设备**（[veth(4)](https://man7.org/linux/man-pages/man4/veth.4.html)）将会被销毁。

## 实验

### 实验设计

在业界的容器实现中，用到的网络模型，在容器内部和 docker bridge 网络模式类似。即：在容器内外通过一对 veth 相连。在容器外部的 veth 通过可插拔网络驱动（如 docker 的采用 bridge、k8s flannel 采用 vxlan 等）来实现定制化的网络拓扑模型。

在 [Linux 网络虚拟化技术（四）iptables - 实例：docker bridge 网络模拟实现](/posts/linux-net-virual-04-iptables/#实例-docker-bridge-网络模拟实现) ，已经进行了相关分析以及 shell 的示例代码。

本文将用 Go，实现一遍 docker bridge 网络模型。此外，因为本文重点关注的是网络名字空间，将忽略 docker bridge 网络模拟实现中的 bridge 以及 iptables 相关内容，仅介绍：

* 如何创建 Network Namespace。
* 如何将 veth 的一端加入一个 Network Namespace。
* 如何配置加入到 Network Namespace 中的 veth 的 ip 地址、网关等。

具体实现效果是：容器（新的网络名字空间）可以通过 veth ping 通宿主机（根网络名字空间）。

实现上述内容的需要的核心 api 为：

* 父进程通过 clone 系统调用一个子进程，并绑定一个新的 Network Namespace。
* 父进程通过 netlink api 创建一对 veth，并配置在父进程 Network Namespace 这一端的 ip、子网 等。
* 父进程通过 netlink api 将 veth 的一端加入到新的 Network Namespace
* 父进程通过 setns 系统调用，进入 Network Namespace。通过 netlink api 设置加入新的 Network Namespace 的这一端 veth 的 ip、子网、gateway等。

### 源码

#### Go 语言描述

```go
//go:build linux

// sudo go run src/go/01-namespace/05-network/main.go

package main

import (
	"fmt"
	"log"
	"net"
	"os"
	"os/exec"
	"runtime"
	"syscall"
	"time"

	"github.com/vishvananda/netlink"
	"github.com/vishvananda/netns"
)

const (
	sub = "sub"
)

func runTestScript(tip string, script string) error {
	fmt.Println(tip)
	cmd := exec.Command("/bin/bash", "-cx", script)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}

func newNamespaceProccess() (<-chan error, int) {
	cmd := exec.Command(os.Args[0], "sub")
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWNET,
	}
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	result := make(chan error)
	cmd.Start()
	go func() {
		result <- cmd.Wait()
	}()
	return result, cmd.Process.Pid
}

func newNamespaceProccessFunc() error {
	// 时序 1: 刚创建的 Network Namespace， ip addr 只能看到 lo 接口
	if err := runTestScript("(1) === new namespace process ===", "ip addr"); err != nil {
		return err
	}
	fmt.Println()
	time.Sleep(2 * time.Second)
	// 时序 3: 此时已经配置好了 veth，ip addr 可以看到 veth 接口
	if err := runTestScript("(3) === new namespace process ===", "ip addr && ip route"); err != nil {
		return err
	}
	fmt.Println()
	// 时序 4: ping veth 另一端
	if err := runTestScript("(4) === new namespace process ===", "ping -c 1 172.16.0.1"); err != nil {
		return err
	}
	fmt.Println()
	return nil
}

func oldNamespaceProccess(pid int) error {
	time.Sleep(1 * time.Second)
	// 时序 2: 配置 veth
	err := configVeth(pid)
	if err != nil {
		return err
	}
	if err := runTestScript("(2) === old namespace process ===", "ip addr show veth0"); err != nil {
		return err
	}
	fmt.Println()
	time.Sleep(2 * time.Second)
	return nil
}

func configVeth(pid int) error {
	const (
		vethName     = "veth0"
		vethPeerName = "veth0container"
		vethNet      = "172.16.0.1/16"
		gatewayIP    = "172.16.0.1"
		vethPeerNet  = "172.16.0.2/16"
	)
	// 1. 创建并配置位于根 Network Namespace 的一侧
	//    a. 创建 veth
	la := netlink.NewLinkAttrs()
	la.Name = vethName // 当前 veth 的命令
	// la.MasterIndex = br.Attrs().Index  // 如果是要和 bridge 连接，可以配置该属性
	if err := netlink.LinkAdd(&netlink.Veth{
		LinkAttrs: la,
		PeerName:  vethPeerName, // 当前 veth 另一端的名字
	}); err != nil {
		return err
	}
	ipNet, err := netlink.ParseIPNet(vethNet)
	if err != nil {
		return err
	}
	//    b. 给一侧 veth 设置 ip
	netlink.AddrAdd(netlink.NewLinkBond(netlink.LinkAttrs{Name: vethName}), &netlink.Addr{IPNet: ipNet})
	//    c. 启动一侧 veth
	netlink.LinkSetUp(netlink.NewLinkBond(netlink.LinkAttrs{Name: vethName}))

	// 2. 将 veth 的另一侧加入新的 Network Namespace
	//     a. 获取到要加入到新的 Network Namespace 的 veth 的另一侧
	peerLink, err := netlink.LinkByName(vethPeerName)
	if err != nil {
		return err
	}
	//     b. 获取到新的 Network Namespace 的 proc 上的引用
	f, err := os.OpenFile(fmt.Sprintf("/proc/%d/ns/net", pid), os.O_RDONLY, 0)
	if err != nil {
		return err
	}
	defer f.Close()
	//     c. 将 veth 的另一侧加入新的 Network Namespace
	if err = netlink.LinkSetNsFd(peerLink, int(f.Fd())); err != nil {
		return err
	}

	// 3. 让当前的进程 (父进程) 进入新的 Network Namespace
	//     a. 记录当前的 Network Namespace
	origns, err := netns.Get()
	if err != nil {
		return err
	}
	defer origns.Close()
	//     b. 后文 netns.Set 利用的是 setns 系统调用配置的线程，因此需要禁止 go 将当前协程调度到其他操作系统线程中。
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()
	//     c. 当前进程 (父进程) 加入到新的 Network Namespace 中。
	if err = netns.Set(netns.NsHandle(f.Fd())); err != nil {
		return err
	}
	//     d. 在当前函数执行完成后，恢复现场
	defer netns.Set(origns)

	// 4. 当前进程已经在新的 Network Namespace 中了，去配置已经在新的 Network Namespace 中的另一侧 veth
	//     a. veth 配置 ip、子网
	ipNet, err = netlink.ParseIPNet(vethPeerNet)
	if err != nil {
		return nil
	}
	if err = netlink.AddrAdd(netlink.NewLinkBond(netlink.LinkAttrs{Name: vethPeerName}), &netlink.Addr{IPNet: ipNet}); err != nil {
		return err
	}
	//     b. 启动 veth 和 lo 设备
	if err = netlink.LinkSetUp(netlink.NewLinkBond(netlink.LinkAttrs{Name: vethPeerName})); err != nil {
		return nil
	}
	if err = netlink.LinkSetUp(netlink.NewLinkBond(netlink.LinkAttrs{Name: "lo"})); err != nil {
		return nil
	}
	//     c. 配置新的 Network Namespace 的路由表
	_, cidr, _ := net.ParseCIDR("0.0.0.0/0")
	gwIP := net.ParseIP(gatewayIP)
	defaultRoute := &netlink.Route{
		LinkIndex: peerLink.Attrs().Index,
		Gw:        gwIP,
		Dst:       cidr,
	}
	if err = netlink.RouteAdd(defaultRoute); err != nil {
		return err
	}
	return nil
}

func main() {
	switch len(os.Args) {
	case 1:
		// 1. 执行 newNamespaceExec，启动一个具有新的 Network Namespace 的进程
		r1, pid := newNamespaceProccess()
		// 2. 在根 Network Namespace 中执行。
		err2 := oldNamespaceProccess(pid)
		if err2 != nil {
			panic(err2)
		}
		err1 := <-r1
		if err1 != nil {
			panic(err1)
		}
		if err := runTestScript("(5) === old namespace process ===", "ip addr show veth0 || true"); err != nil {
			panic(err)
		}
		return
	case 2:
		// 2. 该进程执行 newNamespaceProccessFunc，binding 文件系统，并执行测试脚本
		if os.Args[1] == sub {
			if err := newNamespaceProccessFunc(); err != nil {
				panic(err)
			}
			return
		}
	}
	log.Fatalf("usage: %s [sub]", os.Args[0])
}
```

### 输出及分析

```
(1) === new namespace process ===
+ ip addr
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00

(2) === old namespace process ===
+ ip addr show veth0
22: veth0@if21: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether 7a:2d:96:17:8d:bc brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.16.0.1/16 brd 172.16.255.255 scope global veth0
       valid_lft forever preferred_lft forever
    inet6 fe80::c85a:16ff:fe7a:26e3/64 scope link tentative 
       valid_lft forever preferred_lft forever

(3) === new namespace process ===
+ ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
21: veth0container@if22: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether 36:74:22:99:43:5a brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.16.0.2/16 brd 172.16.255.255 scope global veth0container
       valid_lft forever preferred_lft forever
    inet6 fe80::3474:22ff:fe99:435a/64 scope link tentative 
       valid_lft forever preferred_lft forever
+ ip route
default via 172.16.0.1 dev veth0container 
172.16.0.0/16 dev veth0container proto kernel scope link src 172.16.0.2 

(4) === new namespace process ===
+ ping -c 1 172.16.0.1
PING 172.16.0.1 (172.16.0.1) 56(84) bytes of data.
64 bytes from 172.16.0.1: icmp_seq=1 ttl=64 time=0.053 ms

--- 172.16.0.1 ping statistics ---
1 packets transmitted, 1 received, 0% packet loss, time 0ms
rtt min/avg/max/mdev = 0.053/0.053/0.053/0.000 ms

(5) === old namespace process ===
+ ip addr show veth0
Device "veth0" does not exist.
+ true
```

* 子进程刚进入 Network Namespace 时，该进程只有一个未启动 lo 设备。
* 父进程在完成了配置后，在父进程中可以看到 veth0。
* 子进程再看网络设备，可以看到 lo 设备和 veth0container 都配置正确。
* 子进程 ping 网关也可以 ping 通。
* 最后子程序退出后，veth 全部消失了，和 man 手册描述的一致。

## 参考

* [自己动手写 Docker - 第六章 容器网络](https://weread.qq.com/web/reader/a8932240721e42b5a89f479ka5b325d0225a5bfc9e0772d)
* [xianlubird/mydocker](https://github.com/xianlubird/mydocker/blob/master/network/network.go#L288)
* [Linux network namespace 简单解读](http://www.hyuuhit.com/2019/03/23/netns/)
* [Docker和Kubernetes网络模型](https://leon-wtf.github.io/distributed%20system/2020/10/11/docker-kubernetes-network-model/)
* [从零开始入门 K8s | 理解 CNI 和 CNI 插件](https://www.kubernetes.org.cn/6908.html)
* [15.kubernetes笔记 CNI网络插件(一) Flannel](https://segmentfault.com/a/1190000040860373)
