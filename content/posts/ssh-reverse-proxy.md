---
title: "SSH 反向代理"
date: 2023-01-28T00:35:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---


## 概述

对于 HTTP 协议，存在很多通用的反向代理的软件和库，如：

* Nginx 软件。
* Go 标准库的 [`net/http/httputil.ReverseProxy`](https://pkg.go.dev/net/http/httputil#ReverseProxy)。

但是，在 SSH 协议方面，并没有找到类似的反向代理的软件和库。

因此，本文将探索，如何使用 Go 实现一个通用 SSH 反向代理库。

## 需求

SSH 通用反向代理库需满足如下需求：

* 认证拦截：client 和 proxy 之间，proxy 和 server 之间的认证是解耦的，可以灵活配置的。
* 功能透明：client 通过 proxy 连接到 server 所具备的能力需和 client 直连 server 所具备的能力对等。
* 可审计：proxy 需要可以拿到 SSH 数据包的明文数据，以支持功能过滤，访问记录。

## 设计

根据 [SSH 协议 和 Go SSH 库源码浅析 - ssh-协议](/posts/ssh-protocol-and-go-lib/#ssh-协议) 可以得知，SSH 协议从顶到低可以分为三层：

* 连接协议。
* 认证协议。
* 传输层协议。

根据需求和 SSH 协议特点，一个经过 proxy 的 SSH 连接流量如下图所示：

```
 client                               proxy                          server
                              server        client
+-----------+            +----------------------------+            +-----------+ 
|  连接协议  |  <------>  |   连接协议 <--2--> 连接协议   |  <------>  |  连接协议  |    
|  认证协议  |  <--1--->  |    认证协议        认证协议   |  <---3-->  |  认证协议  |    
| 传输层协议  |  <----->  |   传输层协议       传输层协议  |  <------>  | 传输层协议  |    
+-----------+            +----------------------------+            +-----------+ 
```

说明：

* proxy 包含两个部分，分别是一个 ssh server 和 ssh client。proxy ssh server 对接用户 ssh client，proxy ssh server 对接目标 ssh server。
* 上图 1，用户 ssh client 认证数据包对接 proxy ssh server。上图 3，proxy ssh client 认证数据包对接目标 ssh server。这两个部分为了支持 SSH 认证的拦截。
* 上图 2，是连接协议的数据包，是明文数据。
    * 对这些数据包，可以进行审计。
    * 对于审计通过的数据包，简单的进行 io copy 即可实现功能透明。

## 实现

从上面的设计可以得知，如果想实现一个通用的 SSH 反向代理，只需实现 SSH 的认证和传输层协议。而对于连接协议，Proxy 不需要按照协议流程进行处理，而是由用户 client 和目标 server 进行处理，Proxy 简单的 io copy 即可（也可能需要进行某些数据包进行审计）。

根据 [SSH 协议 和 Go SSH 库源码浅析 - ssh.Dial 源码](/posts/ssh-protocol-and-go-lib/#ssh-dial-源码)，可以得知，`ssh.connection.clientHandshake` 就已经实现了传输层协议和认证协议的流程。因此，基于只需基于 [golang.org/x/crypto](https://cs.opensource.google/go/x/crypto) 进行少量的二次开发即可实现。

但是，[golang.org/x/crypto](https://cs.opensource.google/go/x/crypto) 并没有将 SSH 传输层协议和认证协议的封装对象 API 暴露出来，因此不能通过 go mod 导入。解决的办法只能是将 `ssh.connection` 相关源码直接复制到项目里面，进行调用。

完成依赖的源码准备后，我们添加一个源文件，来讲 `ssh.connection` 能力暴露出去，[源码](https://github.com/rectcircle/sshpass_proxy)如下：

```go
package ssh

import (
	"errors"
	"fmt"
	"net"
)

type TrickTransport struct {
	c *connection
}

func (t *TrickTransport) WritePacket(p []byte) error {
	return t.c.transport.writePacket(p)
}
func (t *TrickTransport) ReadPacket() ([]byte, error) {
	return t.c.transport.readPacket()
}

func (t *TrickTransport) User() string {
	return t.c.User()
}

func NewServerTrickTransport(c net.Conn, config *ServerConfig) (*TrickTransport, error) {
	fullConf := *config
	fullConf.SetDefaults()
	if fullConf.MaxAuthTries == 0 {
		fullConf.MaxAuthTries = 6
	}
	// Check if the config contains any unsupported key exchanges
	for _, kex := range fullConf.KeyExchanges {
		if _, ok := serverForbiddenKexAlgos[kex]; ok {
			return nil, fmt.Errorf("ssh: unsupported key exchange %s for server", kex)
		}
	}

	s := &connection{
		sshConn: sshConn{conn: c},
	}
	_, err := s.serverHandshake(&fullConf)
	if err != nil {
		c.Close()
		return nil, err
	}
	return &TrickTransport{
		c: s,
	}, nil
}

func NewClientTrickTransport(c net.Conn, addr string, config *ClientConfig) (*TrickTransport, error) {
	fullConf := *config
	fullConf.SetDefaults()
	if fullConf.HostKeyCallback == nil {
		c.Close()
		return nil, errors.New("ssh: must specify HostKeyCallback")
	}

	conn := &connection{
		sshConn: sshConn{conn: c, user: fullConf.User},
	}

	if err := conn.clientHandshake(addr, &fullConf); err != nil {
		c.Close()
		return nil, fmt.Errorf("ssh: handshake failed: %v", err)
	}
	return &TrickTransport{
		c: conn,
	}, nil
}

func TrickTransportPacketCopy(a, b *TrickTransport) error {
	for {
		bytes, err := a.ReadPacket()
		if err != nil {
			return err
		}
		err = b.WritePacket(bytes)
		if err != nil {
			return err
		}
	}
}

func ErrIsDisconnectedByUser(err error) bool {
	if e, ok := err.(*disconnectMsg); ok && e.Reason == 11 {
		return true
	}
	return false
}
```

至此，proxy ssh server 和 proxy ssh client 实现完成。

## 应用

这里利用上述库，实现一个 sshpass_proxy 命令，该命令类似于 sshpass，详见：[sshpass_proxy README](https://github.com/rectcircle/sshpass_proxy/blob/master/README.md)。

大概逻辑如下所示：

```
          ssh                             sshpass_proxy                          server
                                       server        client
         +-----------+            +----------------------------+            +-----------+ 
         |  连接协议  |  <------>  |   连接协议 <--2--> 连接协议   |  <------>  |  连接协议  |    
         |  认证协议  |  <--1--->  |    认证协议        认证协议   |  <---3-->  |  认证协议  |    
         | 传输层协议  |  <----->  |   传输层协议       传输层协议  |  <------>  | 传输层协议  |    
         +-----------+            +----------------------------+            +-----------+ 

底层连接             <---- 4: stdio ---->                     <---- 5: tcp ---->
```

* 上图 1 采用 none 身份认证，即不要认证直接连接。
* 上图 2 不做任何审计，只进行简单的 io copy。
* 上图 3 采用密码认证。
* 上图 4 ssh 的 `ProxyCommand` 参数，配置的是 ssh 和 sshpass_proxy 之间的底层连接是 stdio。
* 上图 5 sshpass_proxy 和目标 server 之间的底层连接是 tcp。

核心[源码](https://github.com/rectcircle/sshpass_proxy/blob/master/sshpass_proxy.go)如下：

```go
package sshpass_proxy

import (
	"fmt"
	"net"

	"github.com/rectcircle/sshpass_proxy/crypto/ssh"
)

// SSHPassProxy 功能类似于 sshpass，但是原理完全不同。
//
// SSHPassProxy 通过一个 ssh 传输层协议 proxy，实现 openssh 的客户端，可以对使用密码鉴权的 ssh server 实现免密登录。
//
//                                                           SSHPassProxy
//  +--------+           +------------------------------------------------------------------------------+          +--------+
//  | client | ---> (clientConn) ssh transport server <--- Packet Copy ---> ssh transport client (serverConn) ---> | server |
//  +--------+           +------------------------------------------------------------------------------+          +--------+
func SSHPassProxy(
	clientConn, serverConn net.Conn,
	proxyServerHostPrivateKey ssh.Signer,
	serverAddr, serverPassword string,
) error {
	// 1. 使用 ssh server 对接来 client 连接，完成握手和免密鉴权，并获取到 ssh 传输层协议对象。
	proxyServerConfig := &ssh.ServerConfig{
		NoClientAuth: true,
	}
	proxyServerConfig.AddHostKey(proxyServerHostPrivateKey)
	proxyServerTransport, err := ssh.NewServerTrickTransport(clientConn, proxyServerConfig)
	if err != nil {
		return fmt.Errorf("failed handshake and authenticate with sshpass proxy server: %v", err)
	}
	serverUser := proxyServerTransport.User()
	// 2. 使用 ssh client 对接 server 连接，完成握手和密码鉴权，并获取到 ssh 传输层协议对象。
	proxyClientConfig := &ssh.ClientConfig{
		User: serverUser,
		Auth: []ssh.AuthMethod{
			ssh.Password(serverPassword),
		},
		HostKeyCallback: func(hostname string, remote net.Addr, key ssh.PublicKey) error { return nil },
	}
	proxyClientTransport, err := ssh.NewClientTrickTransport(serverConn, serverAddr, proxyClientConfig)
	if err != nil {
		return fmt.Errorf("failed handshake and authenticate with target server: %v", err)
	}
	// 转发
	errc := make(chan error, 1)
	go func() {
		errc <- ssh.TrickTransportPacketCopy(proxyServerTransport, proxyClientTransport)
	}()
	go func() {
		errc <- ssh.TrickTransportPacketCopy(proxyClientTransport, proxyServerTransport)
	}()
	if err = <-errc; err != nil && !ssh.ErrIsDisconnectedByUser(err) {
		return err
	}
	return nil
}
```
