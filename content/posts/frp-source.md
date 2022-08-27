---
title: "frp 源码浅析"
date: 2022-08-27T16:12:13+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## frp 介绍

frp 是一套通用的，基于 CS 架构的内网穿透软件。软件分为两个部分：client (frpc) 和 server (frps)。

该软件的基本使用流程：

* 部署：首先需要将 frps 部署到具有公网 IP 的主机上（远端主机）；
* 暴露端口：然后在需要暴露端口内网的设备上（本地主机），运行 frpc，并通过配置文件指定指定：
    * 要暴露的本地主机的本地端口；
    * 要暴露端口映射到的远端主机的远端端口；
* 访问端口：在任意一台设备，通过，远端主机公网 IP 和 暴露到远端端口即可访问到本地主机上的本地端口。

更详细的使用教程参见：[官方文档](https://gofrp.org/docs/)。

本文介绍 frp 版本为：[v0.44.0](https://github.com/fatedier/frp/tree/v0.44.0)。

## frp 架构图

![image](/image/frp-architecture.png)

（图片来源 [github](https://github.com/fatedier/frp/tree/v0.44.0#architecture)）

解读：该图主要描述的是访问端口的流量情况，用户流量经过部署在具有公网 ip 的主机上的 frps 中转，发送到位于任意内网主机上的 frpc，frpc 再将流量转发到内网主机上的端口。

下文，从 frps 的源码，本部分仅介绍暴露和访问 tcp 端口的流程，忽略鉴权和插件等细节。

## frps 启动流程

* [cmd/frps/main.go:27](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/cmd/frps/main.go#L27): frps main 函数，最终会调用 `rootCmd.RunE`。
* [`rootCmd.RunE`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/cmd/frps/root.go#L105):
    * 首先，读取从命令行和配置文件读取配置。
    * 最终，调用 `svr.Run`
* [`svr.Run`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/service.go#L305): 调用 `svr.HandleListener`，接收来自客户端的请求，支持多种协议：kcp、websocket、TCP(tls)、TCP，下文主要介绍的是基于 TCP 协议。
* [`svr.HandleListener`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/service.go#L382): Accept 等待客户端的连接。具体连接处理流程参见下文。

## frps 连接处理

该小结主要介绍 frpc 和 frps 之间进行端口暴露的流程。

### tcp_mux

当 frpc 启动后，会建立和 frps 建立一个连接。此时 [`svr.HandleListener`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/service.go#L382) Accept 会返回 `net.Conn`，并会启动一个协程来处理请求，处理流程分为两种情况：

* `common.tcp_mux` 配置如果为 true （[默认](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/pkg/config/server.go#L133)），该 `net.Conn` 将会通过 `yamux` 进行建立一个 **Server** 侧的 `yamux.Session`，并等待客户端的在该 Session 建立逻辑连接，`yamux.Session` 获取到 `net.Conn`  后，会启动一个协程调用 `svr.handleConnection` 进行处理。
* `common.tcp_mux` 配置如果为 false，该 `net.Conn` 会直接调用 `svr.handleConnection` 进行处理。

说明：这里很关键，如果 `tcp_mux` 位 true， frpc 和 frps 间每个暴露的端口，只建立一个物理连接。访问该端口的所有的逻辑连接的流量都在该物理连接上利用 `yamux` 多路复用起进行传输，也就是说，在操作系统层面，只能看到一个连接 TCP 连接。否则，每个请求 frpc 和 frps 之间会都会建立一个 tcp 连接。

### 连接类型

从 [svr.handleConnection](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/service.go#L319) 可以看出，每个链接建立后，客户端会发送一个握手消息，这个消息标识了，frpc 和 frps 间的三种连接类型：

* `msg.Login` 控制连接
* `msg.NewWorkConn` 工作连接
* `msg.NewVisitorConn` 访问连接

其中，访问连接应该是为了实现端到端加密场景使用的（[stcp、sudp](https://gofrp.org/docs/concepts/)），在此不多深究了。

### 控制连接

针对 `msg.Login` 控制连接，会进入 [`svr.RegisterControl`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/service.go#L436) 进行处理，主要流程为：

* 进行权限校验
* 构造并启动一个控制器 [`ctl.Start`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/control.go#L189)。
    * 回复 frpc 登录成功。
    * 通过该控制连接给 frpc 发送命令，让 frpc 建立多个工作连接（即工作连接池）。
    * 启动 `ctl.manager` 协程，该协程会读取 frpc 通过该控制连接发送给 frps 的一些消息，并处理，细节参见下文。
    * 启动 [`ctl.reader`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/control.go#L318) 协程，读取控制连接发送的原始数据流，解析成控制命令，并通过 chan 交由 `ctl.manager` 处理。
    * 启动 [`ctl.stoper`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/control.go#L347) 协程，等待关闭信号，用于关闭并清理资源。

在此，重点介绍 [`ctl.manager`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/control.go#L405) ，即控制器的核心逻辑，主要处理三种类型消息：

* `msg.NewProxy` 新建一个 Proxy，frpc 在接收到登录成功，会根据暴露端口的配置，告知 frps 创建一个指定类型的 proxy，逻辑位于 ctl.RegisterProxy，参见下文。
* `msg.CloseProxy` 关闭一个 Proxy。
* `msg.Ping` 心跳消息。

建立 proxy 的 [`ctl.RegisterProxy`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/control.go#L501) 主要流程如下：

* `proxy.NewProxy` 初始化一个 Proxy 对象，以 TCP 为例，将构造一个 [`proxy.TCPProxy`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/proxy/tcp.go#L25) 对象（其中核心参数为 [`ctl.GetWorkConn`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/control.go#L231)，后文有介绍）。
* 然后调用 `pxy.Run()` 以 [`proxy.TCPProxy`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/proxy/tcp.go#L32) 为例：会在 frps 所在主机上监听一个 TCP 端口，并启动一个协程该协程会连接到该端口的 TCP 连接。这个端口就是提供给用户访问的端口，处理逻辑参见：[访问端口](#访问端口).

### 工作连接

针对 `msg.NewWorkConn` 控制连接，会进入 [`svr.RegisterWorkConn`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/control.go#L208) 进行处理，主要流程为：

* 将该工作连接发送给 `ctl.workConnCh` 通道。
* `ctl.WorkConnCh` 通道的接受处理函数位于 [`ctl.GetWorkConn`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/control.go#L231)，细节参见：[访问端口](#访问端口)。

## 访问 frps 暴露的端口

上文 [连接处理](#连接处理) 介绍了 frpc 和 frps 之间进行暴露端口的流程。本部分将介绍，端口暴露到 frps 的主机后，用户访问该端口的流程（以 TCP 为例）。

如上文提到，这个端口的处理函数函数位于： [`pxy.startListenHandler`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/proxy/proxy.go#L151) 当用户建立连接后，会调用：[`HandleUserTCPConnection`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/proxy/proxy.go#L252) 进行处理：

* 调用 [`pxy.GetWorkConnFromPool`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/proxy/proxy.go#L96) 函数，获取一条和 frpc 之间的[工作连接](#工作连接)。上文可以得知，该函数的实现位于 [`ctl.GetWorkConn`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/control.go#L231)。
    * 从 `ctl.WorkConnCh` 获取 [工作连接](#工作连接) 该连接是由 [`svr.RegisterWorkConn`](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/server/control.go#L208) 发送的。
        * 如果能获取到，返回该工作连接。
        * 否则通过[控制连接](#控制连接)，让 frpc 建立一条 [工作连接](#工作连接)（默认需 10 秒钟内建立成功，配置项为 `common.user_conn_timeout`）。
    * 调用 [`frpIo.Join`](https://github.com/fatedier/golib/blob/dev/io/io.go) 相互拷贝两个连接，完成流量从 frps 转发到 frpc。

frpc 创建好[工作连接](#工作连接)后，会调用 [HandleTCPWorkConnection](https://github.com/fatedier/frp/blob/8888610d8339bb26bbfe788d4e8edfd6b3dc9ad6/client/proxy/proxy.go#L720) 函数，最终使用 `net.Dial` 打开一个访问 127.0.0.1 对应本地端口的本地连接。并调用 [`frpIo.Join`](https://github.com/fatedier/golib/blob/dev/io/io.go) 进行[工作连接](#工作连接)和该本地连接的进行相互拷贝。

至此流量就进入了本地的服务中了。

## 总结

![image](/image/frp-tcp-flow.svg)

上图介绍了一个 tcp 端口暴露到公网以及访问的主要流程，需要注意的是：

* 忽略鉴权和插件相关细节。
* 忽略个连接池相关部分。
* `2.3` 多条工作连接表示，在存在并发访问时，可能会创建多条工作连接，但一个请求只会用到一个工作连接。
* 如果开启了 `tcp_mux`（默认），控制连接和工作连接可能在物理上就是一条 TCP 连接，但逻辑上还是有这些连接的。

## 其他说明

* Go 的 io.Copy 只会单向拷贝，在双向拷贝的场景可以参考：[`frpIo.Join`](https://github.com/fatedier/golib/blob/dev/io/io.go)。
* `tcp_mux` 是多路复用，具体细节参见 [hashicorp/yamux](https://github.com/hashicorp/yamux) 实现。
* `tcp_mux` 可能存在无法跑满带宽的问题，具体参见：[issue](https://github.com/fatedier/frp/issues/2987)。
* 如何想把 websocket 连接作为 net.Conn 处理，建议使用 [`golang.org/x/net/websocket`](https://pkg.go.dev/golang.org/x/net/websocket) 库，而非 [github.com/gorilla/websocket](https://pkg.go.dev/github.com/gorilla/websocket)。
