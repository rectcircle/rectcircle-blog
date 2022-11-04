---
title: "Kitex 自定义底层连接"
date: 2022-11-04T15:53:55+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> [Kitex](https://www.cloudwego.io/zh/docs/kitex/): [v0.4.3](https://github.com/cloudwego/kitex/tree/v0.4.3)

## 背景

Kitex 是字节跳动开源的一款 Golang 微服务 RPC 框架。其默认使用的底层连接 （`net.Conn`） 是字节跳动自研的 [`netpoll`](https://github.com/cloudwego/netpoll) 网络库，而不是 Go 标准网络库。

但是，某些场景，我们可能有需求让 RPC 跑在其他的底层连接中，比如：

* Kitex Over Go 标准库实现的 TCP 连接。
* Kitex Over Websocket。
* Kitex Over Yamux （多路复用）实现反向请求。

此时，就没法使用 Kitex 默认的 netpoll 了，需要自定义底层连接。幸运的是， Kitex 提供了这个能力。

## 项目初始化

> 本文示例代码：[rectcircle/kitex-customize-underlying-connection](https://github.com/rectcircle/kitex-customize-underlying-connection)

* 安装代码生成器并初始化项目。

```bash
# 安装
go install github.com/cloudwego/kitex/tool/cmd/kitex@latest
go install github.com/cloudwego/thriftgo@latest
# 验证
kitex --version
thriftgo --version
# 创建 Go 项目
go mod init github.com/rectcircle/kitex-customize-underlying-connection
# 删除默认的 server 代码以及无用的脚本等内容
```

* 编写 `idl/echo.thrift`。

```thrift
namespace go api

struct Request {
    1: string message
}

struct Response {
    1: string message
}

service Echo {
    Response echo(1: Request req)
}
```

* 代码生成并配置依赖。

```bash
kitex -module github.com/rectcircle/kitex-customize-underlying-connection -service example ./idl/echo.thrift
go get github.com/cloudwego/kitex@latest
go mod tidy
```

* 编写 server 逻辑 `server/server.go`。

```go
package server

import (
	"context"

	"github.com/rectcircle/kitex-customize-underlying-connection/kitex_gen/api"
)

type EchoImpl struct{}

func (s *EchoImpl) Echo(ctx context.Context, req *api.Request) (resp *api.Response, err error) {
	resp = api.NewResponse()
	resp.Message = req.Message
	return
}
```

## 实现

### 使用默认的 Netpoll 网络库

* 编写 server `cmd/01-netpoll/server/main.go`。

```go
package main

import (
	"log"

	api "github.com/rectcircle/kitex-customize-underlying-connection/kitex_gen/api/echo"
	"github.com/rectcircle/kitex-customize-underlying-connection/server"
)

func main() {
	svr := api.NewServer(new(server.EchoImpl))

	err := svr.Run()
	if err != nil {
		log.Println(err.Error())
	}
}
```

* 编写 client `cmd/01-netpoll/client/main.go`。

```go
package main

import (
	"context"
	"log"
	"time"

	"github.com/cloudwego/kitex/client"
	"github.com/cloudwego/kitex/client/callopt"
	"github.com/rectcircle/kitex-customize-underlying-connection/kitex_gen/api"
	"github.com/rectcircle/kitex-customize-underlying-connection/kitex_gen/api/echo"
)

func main() {
	c, err := echo.NewClient("example", client.WithHostPorts("127.0.0.1:8888"))
	if err != nil {
		log.Fatal(err)
	}
	req := &api.Request{Message: "Say hello by netpoll"}
	resp, err := c.Echo(context.Background(), req, callopt.WithRPCTimeout(3*time.Second))
	if err != nil {
		log.Fatal(err)
	}
	log.Println(resp.Message)
}
```

* 测试运行。

```bash
# 第一个终端
go run ./cmd/01-netpoll/server 
# 第二个终端
go run ./cmd/01-netpoll/client
# 输出为： 2022/11/04 16:34:00 Say hello by netpoll
```

### 使用标准库网络库

> 本示例存在死循环导致的 CPU 占用过高问题，需要官方解决，参见 Issue : [gonet.gonetTransServerFactory has dead loop #701](https://github.com/cloudwego/kitex/issues/701)。

根据如下信息：

* [传输模块扩展文档](https://www.cloudwego.io/zh/docs/kitex/tutorials/framework-exten/transport/)，关于指定自定义的传输模块的说明。
* [Kitex v0.4.0 版本发布博客](https://www.cloudwego.io/zh/blog/2022/08/26/kitex-v0.4.0-%E7%89%88%E6%9C%AC%E5%8F%91%E5%B8%83/)，关于 gonet 的支持。
* [Kitex trans/gonet 相关源码](https://github.com/cloudwego/kitex/tree/develop/pkg/remote/trans/gonet)。

可以得知， Kitex 提供了标准的灵活替换底层网络库的能力（官方称为传输层），并在 v0.4.0 添加了对 gonet 的支持。

具体实现要点，参见下文源码中的 **改造点**。

* 编写 server `cmd/02-stdnet/server/main.go`。

```go
package main

import (
	"log"
	"net"

	"github.com/cloudwego/kitex/pkg/remote/trans/gonet"
	"github.com/cloudwego/kitex/server"
	api "github.com/rectcircle/kitex-customize-underlying-connection/kitex_gen/api/echo"
	serverImpl "github.com/rectcircle/kitex-customize-underlying-connection/server"
)

func main() {
	addr, err := net.ResolveTCPAddr("tcp", ":8889")
	if err != nil {
		panic(err)
	}
	svr := api.NewServer(new(serverImpl.EchoImpl),
		server.WithServiceAddr(addr),
		// 改造点：server 传输层使用 go 标准网络库
		server.WithTransServerFactory(gonet.NewTransServerFactory()),
		server.WithTransHandlerFactory(gonet.NewSvrTransHandlerFactory()),
	)
	err = svr.Run()
	if err != nil {
		log.Println(err.Error())
	}
}
```

* 编写 client `cmd/02-stdnet/client/main.go`。

```go
package main

import (
	"context"
	"log"
	"time"

	"github.com/cloudwego/kitex/client"
	"github.com/cloudwego/kitex/client/callopt"
	"github.com/cloudwego/kitex/pkg/remote/trans/gonet"
	"github.com/rectcircle/kitex-customize-underlying-connection/kitex_gen/api"
	"github.com/rectcircle/kitex-customize-underlying-connection/kitex_gen/api/echo"
)

func main() {
	c, err := echo.NewClient("example",
		client.WithHostPorts("127.0.0.1:8889"),
		// 改造点：client 传输层使用 go 标准网络库
		client.WithTransHandlerFactory(gonet.NewCliTransHandlerFactory()),
	)
	if err != nil {
		log.Fatal(err)
	}
	req := &api.Request{Message: "Say hello by go std net"}
	resp, err := c.Echo(context.Background(), req, callopt.WithRPCTimeout(3*time.Second))
	if err != nil {
		log.Fatal(err)
	}
	log.Println(resp.Message)
}
```

* 测试运行

```bash
# 第一个终端
go run ./cmd/02-stdnet/server
# 第二个终端
go run ./cmd/02-stdnet/client
# 输出为： 2022/11/04 17:41:07 Say hello by go std net
```

### 使用 Websocket

> 本示例存在死循环导致的 CPU 占用过高问题，需要官方解决，参见 Issue : [gonet.gonetTransServerFactory has dead loop #701](https://github.com/cloudwego/kitex/issues/701)。

某些场景，TCP 可能没法直接使用，但是 Websocket 可以使用，此时想实现 Kitex Over Websocket。

上面可以看出，Kitex 官方提供了 gonet 是基于 TCP 的 `net.Conn`，那么将 Websocket 封装成一个 `net.Conn` 是否就可以实现了呢？实测是可以的，基本思路是：

* Client
    * 使用 `client.WithDialer` 选项自定义一个 Websocket 的 Dialer，用来建立 Websocket 连接，并返回 `net.Conn`
    * 通过 `client.WithTransHandlerFactory(gonet.NewCliTransHandlerFactory())`，使用 gonet 传输层。
    * 代码 `cmd/03-websocket/client/main.go` 如下。

```go
package main

import (
	"context"
	"log"
	"net"
	"time"

	"github.com/cloudwego/kitex/client"
	"github.com/cloudwego/kitex/client/callopt"
	"github.com/cloudwego/kitex/pkg/remote"
	"github.com/cloudwego/kitex/pkg/remote/trans/gonet"
	"github.com/rectcircle/kitex-customize-underlying-connection/kitex_gen/api"
	"github.com/rectcircle/kitex-customize-underlying-connection/kitex_gen/api/echo"
	"golang.org/x/net/websocket"
)

type WebsocketKitexDialer struct {
	ServerURL string
}

func NewWebsocketKitexDialer(serverURL string) remote.Dialer {
	return &WebsocketKitexDialer{
		ServerURL: serverURL,
	}
}

// DialTimeout implements remote.Dialer
func (d *WebsocketKitexDialer) DialTimeout(network string, address string, timeout time.Duration) (net.Conn, error) {
	cfg, err := websocket.NewConfig(d.ServerURL, d.ServerURL)
	if err != nil {
		return nil, err
	}
	return websocket.DialConfig(cfg)
}

func main() {
	c, err := echo.NewClient("example",
		// 这只是一个 mock
		client.WithHostPorts("127.0.0.1:8890"),
		// 改造点：使用自定义 dialer 获取 net.Conn
		client.WithDialer(NewWebsocketKitexDialer("ws://127.0.0.1:8890/kitex-ws")),
		// 改造点：client 传输层使用 go 标准网络库
		client.WithTransHandlerFactory(gonet.NewCliTransHandlerFactory()),
	)
	if err != nil {
		log.Fatal(err)
	}
	req := &api.Request{Message: "Say hello by websocket"}
	resp, err := c.Echo(context.Background(), req, callopt.WithRPCTimeout(3*time.Second))
	if err != nil {
		log.Fatal(err)
	}
	log.Println(resp.Message)
}
```

* Server
    * 使用将 `http.Server` 封装成一个 `net.Listener`，通过 `server.WithListener(l)` 传递给 Server，这个 `net.Listener` 的逻辑是：接收到 Websocket 请求连接封装成 `net.Conn`，并通过 Accept 函数返回给 Kitex 框架。
    * 通过 `server.WithTransServerFactory(gonet.NewTransServerFactory())`、`server.WithTransHandlerFactory(gonet.NewSvrTransHandlerFactory())` 配置使用 gonet 传输层。
    * 代码 `cmd/03-websocket/server/main.go` 如下。

```go
package main

import (
	"log"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"

	"github.com/cloudwego/kitex/pkg/remote/trans/gonet"
	"github.com/cloudwego/kitex/server"
	api "github.com/rectcircle/kitex-customize-underlying-connection/kitex_gen/api/echo"
	serverImpl "github.com/rectcircle/kitex-customize-underlying-connection/server"
	"golang.org/x/net/websocket"
)

type WebsocketAddr struct {
	URL *url.URL
}

func ResolveWebsocketAddr(rawURL string) (*WebsocketAddr, error) {
	u, err := url.Parse(rawURL)
	if err != nil {
		return nil, err
	}
	return &WebsocketAddr{
		URL: u,
	}, nil
}

// Network implements net.Addr
func (a *WebsocketAddr) Network() string {
	return a.URL.Scheme
}

// String implements net.Addr
func (a *WebsocketAddr) String() string {
	return strings.TrimPrefix(a.URL.String(), a.URL.Scheme+"://")
}

type ClosedConnWrapper struct {
	net.Conn
	closed        chan struct{}
	closeChanOnce sync.Once
}

func NewClosedConnWrapper(c net.Conn) *ClosedConnWrapper {
	return &ClosedConnWrapper{
		Conn:   c,
		closed: make(chan struct{}),
	}
}

func (c *ClosedConnWrapper) Close() error {
	// fmt.Println("=====")
	c.closeChanOnce.Do(func() { close(c.closed) })
	return c.Conn.Close()
}

func (c *ClosedConnWrapper) CloseChan() <-chan struct{} {
	return c.closed
}

type WebsocketKitexServer struct {
	addr     *WebsocketAddr
	server   *http.Server
	connChan chan net.Conn
}

func NewWebsocketKitexServer(websocketURL string) (*WebsocketKitexServer, error) {
	a, err := ResolveWebsocketAddr(websocketURL)
	if err != nil {
		return nil, err
	}
	return &WebsocketKitexServer{
		addr:     a,
		connChan: make(chan net.Conn),
	}, nil
}

// Accept implements net.Listener
func (s *WebsocketKitexServer) Accept() (net.Conn, error) {
	return <-s.connChan, nil
}

// Addr implements net.Listener
func (s *WebsocketKitexServer) Addr() net.Addr {
	return s.addr
}

// Close implements net.Listener
func (s *WebsocketKitexServer) Close() error {
	return s.server.Close()
}

func (s *WebsocketKitexServer) websocketHandle(wsConn *websocket.Conn) {
	c := NewClosedConnWrapper(wsConn)
	s.connChan <- c
	<-c.CloseChan()
}

func (s *WebsocketKitexServer) Start() error {
	mux := http.NewServeMux()
	mux.Handle(s.addr.URL.Path, websocket.Handler(s.websocketHandle))

	server := &http.Server{Addr: s.addr.URL.Host, Handler: mux}
	go server.ListenAndServe() // nolint
	s.server = server
	return nil
}

func main() {
	l, err := NewWebsocketKitexServer("ws://[::]:8890/kitex-ws")
	if err != nil {
		panic(err)
	}
	l.Start()
	svr := api.NewServer(new(serverImpl.EchoImpl),
		server.WithListener(l),
		// 改造点：server 传输层使用 go 标准网络库
		server.WithTransServerFactory(gonet.NewTransServerFactory()),
		server.WithTransHandlerFactory(gonet.NewSvrTransHandlerFactory()),
	)
	err = svr.Run()
	if err != nil {
		log.Println(err.Error())
	}
}
```

* 测试运行

```bash
# 第一个终端
go run ./cmd/03-websocket/server
# 第二个终端
go run ./cmd/03-websocket/client 
# 输出为： 2022/11/04 20:32:51 Say hello by websocket
```

### 使用 Yamux 实现反向请求

> [hashicorp/yamux](http://github.com/hashicorp/yamux)

从上文 Websocket 的实现可以看出 Kitex 的 gonet 传输层，通过对 Dialer、Listener 的自定义，可以支持任意实现了 `net.Conn` 接口的底层。而，Yamux 是满足该模型的，因此 Yamux 多路复用器也很容易实现，在此就不多赘述了。
