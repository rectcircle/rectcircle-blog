---
title: "SSH 协议浅析 & Go Google SSH 库源码"
date: 2022-12-30T14:46:32+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 导读

SSH, The Secure Shell Protocol (安全 Shell 协议)，是一个使用广泛的网络协议。如果说 HTTP 协议是互联网革命中最重要的网络协议的话，那么对于开发者来说， SSH 排第二应该没有异议。因此，理解 SSH 协议的应用场景、协议流程对于开发者是很有必要的。

在中文互联网世界，关于 SSH 协议的介绍，往往都把重点放到了安全（Secure）方面的细节。这样的文章对于开发者来说，意义并不大，原因在于：

* 此类文章是以密码学为基础的。而密码学专业程度较高，对于开发者来说理解成本高。
* 其次，SSH 安全算法部分是 SSH 协议中最不可变的部分。即使完全理解了这部分，对于对 SSH 协议的二次开发，也没有什么帮助。

因此，本文不会仔细介绍 SSH 中 Secure 的细节。而是从整体和分层的角度尝试理解协议作者的设计考量。

和 HTTP 协议一样，SSH 协议是一个标准化的协议，由 [IETF](https://www.ietf.org/) 制定，主要的 RFC 有：

* [RFC 4251: The Secure Shell (SSH) Protocol Architecture](https://www.rfc-editor.org/rfc/rfc4251)
* [RFC 4252: The Secure Shell (SSH) Authentication Protocol](https://www.rfc-editor.org/rfc/rfc4252)
* [RFC 4253: The Secure Shell (SSH) Transport Layer Protocol](https://www.rfc-editor.org/rfc/rfc4253)
* [RFC 4254: The Secure Shell (SSH) Connection Protocol](https://www.rfc-editor.org/rfc/rfc4254)

当然，还有一些[其他 RFC](https://www.omnisecu.com/tcpip/important-rfc-related-with-ssh.php) 在实际场景中应用较窄，在此就不列举了。

RFC 文档是网络协议的完整定义，追求的是无歧义和准确性，这导致 RFC 文档对于初学者不够友好，比较晦涩，不符合人类的认知规律。因此，本文对 SSH 协议的介绍不会按照 RFC 的顺序和结构来进行，而是按照更符合人类认知的方式来进行。当然一些重要的部分，本文会给出对应的 RFC 章节的引用，以方便定位，尽量兼顾专业性和可读性。

本文假设读者使用过 SSH 客户端进行过远程登录。行文上，本文会以：从整体到局部，从低层到顶层，介绍 SSH 协议的包结构。然后以 SSH 登录一台主机执行一条命令的场景为例，通过追踪 Google 维护的 Go SSH 库 [`x/crypto/ssh`](https://pkg.go.dev/golang.org/x/crypto/ssh) 的源码，来实际感受 SSH 协议的整个流程。本文希望读者可以：真正理解 SSH 的整体流程，理解 SSH 协议的设计考量，初步具备对 SSH 协议进行二次开发的能力。

## SSH 协议

### SSH 协议分层

这 4 篇文档中，RFC4251 是 SSH 的架构概述，RFC4252、RFC4253、RFC4254 是 SSH 的三个子协议。

### SSH 传输层协议

### SSH 认证协议

### SSH 连接协议

## Go Google SSH 库

### 准备

### 编写示例代码

### 客户端流程追踪

### 服务端流程追踪

## 待梳理

### 设置连接

* 建立连接：
    * Client 请求建立 TCP（可以抽象成 reader/writer 即可） 连接。
    * Server Accept 完成 TCP 连接建立。
* 协议版本交换（[rfc](https://www.rfc-editor.org/rfc/rfc4253#section-4.2)）：。
    * Client 发送字符串 `SSH-2.0-Go\r\n`，必须以 `SSH-2.0-` 开头，以 `\r\n` 结尾。Go 部分可以是任意 ASCII 码 `> 32` 的字符。
    * Server 回复字符串 `SSH-2.0-dropbear_2022.83\r\n`，格式要求和 Client 一致。

### 包 (Packet) 格式说明

* 字节序：大端（网络字节序）
* 格式说明
    * `uint32`    packet_length = len(payload) + len(padding) + 1
    * `byte`      padding_length = len(padding)
    * `[]byte`    payload
    * `[]byte`    padding，随机字节数组。
    * `[]byte`    mac (Message Authentication Code - MAC)
* 加密。上述描述的是未加密的格式，加密方式如下所示：
    * packet_length 和 packet_length 作为整体加密：`crypto/cipher.Stream.XORKeyStream(byte[0:5], byte[0:5])`
    * payload 加密：`crypto/cipher.Stream.XORKeyStream(payload, payload)`
    * padding 加密
    * mac 不需要加密

### 消息 (Message) 格式说明

上面定义 SSH 最底层 Packet 格式说明，基于以上 Packet 格式，SSH 协议定义了一些为了实现 SSH 流程的消息 (Message)。这些消息，会作为 Package 的 payload，生成 Packet 然后通过 TCP 发送出去。

Message 的格式如下所示：

* `byte`      消息类型。
* `[]byte`    消息数据，具体定义由消息类型决定。

Message 的数据部分，可能包含多个字段，序列化方式如下：

* `string[]` 字符串数组。
    * len `uint32` data 的长度，网络字节序。
    * data `byte[]` 字符串数组通过逗号分隔拼接成的字节数组。

### 秘钥和算法协商

https://emous.github.io/2019/04/28/SSH/#%E5%AE%A2%E6%88%B7%E7%AB%AF%E8%AE%A4%E8%AF%81

https://emous.github.io/2019/04/28/SSH/

* Client 和 Server 立即发送 key 交换消息包。包格式为：
    * `packet_length` 无需加密。
    * `padding_length` 无需加密。
    * `payload` 无需加密，消息。
        * `byte`         值为 20 (`SSH_MSG_KEXINIT`)
        * `byte[16]`     cookie (random bytes)
        * `string[]`     kex_algorithms （Key Exchange 算法）
    * `padding` 无需加密。
    * `mac` nil。

### 问题

* 分组加密密文长度和明文不一样是怎么处理的呢？

## 备忘

ssh proxy

```
package main

import (
	"fmt"
	"io"
	"net"
	"os"
)

// ssh -o "ProxyCommand go run ./ %h:%p" -p 22 root@127.0.0.1
func main() {
	if len(os.Args) != 2 {
		fmt.Fprintf(os.Stderr, "Usage: %s <addr>\n", os.Args[0])
		os.Exit(1)
	}
	var (
		addr = os.Args[1]
		in   = os.Stdin
		out  = os.Stdout
	)
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "%v\n", err)
		os.Exit(1)
	}
	errc := make(chan error, 1)
	go func() {
		_, e := io.Copy(conn, in)
		errc <- e
	}()
	go func() {
		_, e := io.Copy(out, conn)
		errc <- e
	}()
	if err = <-errc; err != nil {
		fmt.Fprintf(os.Stderr, "%v\n", err)
		os.Exit(1)
	}
}
```
