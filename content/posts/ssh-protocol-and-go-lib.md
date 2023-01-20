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

### SSH 协议架构

> 本部分主要来自于： [rfc4251](https://www.rfc-editor.org/rfc/rfc4252)

```
high level
             +-------------------------+---------------------+
             | Authentication Protocol | Connection Protocol |
             +-------------------------+---------------------+
             |           Transport Layer Protocol            |
             +-----------------------------------------------+
             |              Underlying Connection            |
             +-----------------------------------------------+
low  level
```

SSH 协议由 3 个子协议构成。从底层到顶层分别是：

* 传输层协议（[rfc4253](https://www.rfc-editor.org/rfc/rfc4253)），定义了 SSH 协议数据包的格式以及 Key 交换算法。
* 认证协议（[rfc4252](https://www.rfc-editor.org/rfc/rfc4252)），定义了 SSH 协议支持的用户身份认证算法。
* 连接协议（[rfc4254](https://www.rfc-editor.org/rfc/rfc4254)），定义了 SSH 支持功能特性：交互式登录会话、TCP/IP 端口转发、X11 Forwarding。

需要特别说明的是：

* 传输层协议底层连接默认是 TCP 协议。但是，这并不是强制的，在现实中，SSH 可以运行在任意提供可靠性保证的底层连接之上。
* 从层次再看认证协议和连接协议可以认为处于同一层。从时序上来看，认证协议是连接协议的前置条件。

### SSH 传输层协议

#### 数据包 (Packet) 结构

* 字节序：大端（网络字节序）
* SSH 最小传输单元为数据包 (Packet)，两个方向的数据包格式是一致的。
* 数据包格式如下：
    * `uint32`    packet_length = len(payload) + len(padding) + 1。
    * `byte`      padding_length = len(padding)。
    * `[]byte`    payload。有效负载，消息 Message。
    * `[]byte`    padding，随机字节数组。
    * `[]byte`    mac (Message Authentication Code - MAC)
* 数据包字段加密方式如下所示：
    * packet_length 和 packet_length 作为整体加密：`crypto/cipher.Stream.XORKeyStream(byte[0:5], byte[0:5])`
    * payload 加密：`crypto/cipher.Stream.XORKeyStream(payload, payload)`
    * padding 加密：`crypto/cipher.Stream.XORKeyStream(padding, padding)`
    * mac 不需要加密

（更多参见：[rfc4253#section-6](https://www.rfc-editor.org/rfc/rfc4253#section-6)）

#### 消息结构

Packet 定义的是 SSH 协议的最小传输单元，SSH 协议真正的业务数据是放在 payload 部分中的。在 SSH 协议中，payload 部分被称为消息 Message。

消息的格式各不相同，总的来说是由消息的类型来决定的，因此从整体看消息的结构为：

* `byte`      消息类型编号。
* `[]byte`    消息数据，具体定义由消息类型决定。

消息数据部分，可能包含多个字段，不同的字段的序列化方式参见：[rfc4251#section-5](https://www.rfc-editor.org/rfc/rfc4251#section-5)。

SSH 协议对消息编号按照子协议类型进行了划分（[rfc4251#section-7](https://www.rfc-editor.org/rfc/rfc4251#section-7)）：

* 传输层协议：
    * 1~19 传输层通用消息，如 disconnect, ignore, debug 等等。
    * 20~29 Key 交换算法协商（参见下文：传输层协议流程）。
    * 30~49 Key 交换（同一个编号，在不同的 Key 交换算法中定义是不同的）。
* 认证协议：
    * 50~59 用户认证通用消息。
    * 60~79 给特定的用户认证方法使用（同一个编号，在不同的认证方法中定义是不同的）。
* 连接协议：
    * 80~89 连接协议通用消息。
    * 90~127 Channel 相关消息。
* 为客户端协议保留：128~191。
* 本地扩展：192~255。

#### 传输层协议流程

1. 建立底层连接（以 TCP 协议为例）：
    * Client 请求建立 TCP连接。
    * Server Accept 完成 TCP 连接建立。
2. 协议版本交换（[rfc4253#section-4.2](https://www.rfc-editor.org/rfc/rfc4253#section-4.2)）：。
    * Client 发送字符串，必须以 `SSH-2.0-` 开头，以 `\r\n` 结尾。Go 部分可以是任意 ASCII 码 `> 32` 的字符。如  `SSH-2.0-Go\r\n`，。
    * Server 发送字符串，格式要求和 Client 一致。如 `SSH-2.0-dropbear_2022.83\r\n`。
3. Key 交换算法协商，参见：[rfc4253#section-7.1](https://www.rfc-editor.org/rfc/rfc4253#section-7.1)，也可以参考下文具体编码示例。
4. Key 交换算法执行，比如 Diffie-Hellman Key Exchange 参见：[rfc4253#section-8](https://www.rfc-editor.org/rfc/rfc4253#section-8)，也可以参考下文具体编码示例。

解释：

* 上述第 2、3、4 步，是 SSH 协议中的仅有的明文传输的部分。
* 上述第 2 步，是 SSH 协议中唯一一个消息格式不符合上文包格式定义的流程。本文介绍的 SSH 协议实际上是 SSH 协议的第 2 版。和其他网络协议类似，SSH 协议也是先有了实现，再进行标准化。因此在这一步，使用了文本格式，以实现对历史上旧版本的识别和兼容。
* 上述第 2 步，Client 和 Server 发送的字符串，没有前后依赖关系，一般情况下，在建立底层连接后，Client、Server 会立即向对方发送版本信息。
* 上述第 3、4 步，是 SSH 协议号称安全的关键步骤。SSH 的核心目标就是在不安全的底层连接（如 TCP）之上，建立一个安全的连接，以实现远程登录，端口转发等特性。因此，自然而然的想法就是对传输的数据进行加密。但是，加密必然需要 Client 和 Server 拥有配对的特定秘钥（key），这就是秘钥分发问题。**非对称加密算法**特定天然不存在秘钥分发问题，一种办法是所有数据均使用**非对称加密算法**加密，但是**非对称加密算法**性能太差，加解密成本难以接受。因此实际上 SSH 协议采用了如下思路：真正的数据加密仍然使用**对称加密算法**，而对称加密算法的必要，由**非对称的加密算法**进行保护，此类算法在 SSH 协议中有很多种，被称为 Key 交换算法。因为 Key 交换算法是 SSH 安全性的基石。没人可以 100% 保证某个 Key 交换算法一定是安全的。因此 SSH 协议在执行 Key 交换算法之前，需先进行 Key 交换算法协商，来确定要使用哪种 Key 交换算法。
* 上述第 3、4 步，不仅仅只在连接之处执行一次，在整个 SSH 连接期间，会根据一些配置，重新执行以生成新的 Key，以保证安全性。

### SSH 认证协议

SSH 支持如下几种身份认证协议：

* `none`，服务端关闭身份认证，也就是说，任意用户都可以连接到该服务端（[rfc4252#section-5.2](https://www.rfc-editor.org/rfc/rfc4252#section-5.2)）。
* `publickey`，基于公钥的身份认证（[rfc4252#section-7](https://www.rfc-editor.org/rfc/rfc4252#section-7)）。
* `password`，基于密码的身份认证。（[rfc4252#section-8](https://www.rfc-editor.org/rfc/rfc4252#section-8)）
* `hostbased`，比较少见，略（[rfc4252#section-9](https://www.rfc-editor.org/rfc/rfc4252#section-9)）。
* `GSS-API`，校验 （[rfc4462](https://www.rfc-editor.org/rfc/rfc4252)）。

具体细节本部分就不多赘述了，想了解更多，可以参考上文 RFC 文档，也可以参见下文示例代码。

### SSH 连接协议

#### Channel

SSH 连接协议定义的交互式登录终端会话、TCP/IP 端口转发、X11 Forwarding 的这些功能，都工作在自己的通道 (Channel) 之上的。

在 SSH 协议中，Channel 实现了对底层连接的多路复用，就是一个虚拟连接，这就是该子协议叫做连接协议的原因。具体而言 Channel：

* 通过一个数字来进行标识和区分这些 Channel。
* 实现流控 （窗口）。

因此，SSH 连接协议实现的这些功能，都需先建立 Channel，流程如下：

* 服务端和客户端任意一方，发送类型为 `SSH_MSG_CHANNEL_OPEN` (90) 的消息，通知对方需要建立 Channel。

    ```
    byte      SSH_MSG_CHANNEL_OPEN (90)
    string    channel type, 可选值为: 'session', 'x11', 'forwarded-tcpip', 'direct-tcpip' 参见 https://www.rfc-editor.org/rfc/rfc4250#section-4.9.1
    uint32    sender channel 编号
    uint32    初始化窗口大小
    uint32    最大包大小
    ....      下面是 channel type 特定数据
    ```
* 另一方接收到消息后，回复类型为 `SSH_MSG_CHANNEL_OPEN_CONFIRMATION` (91) 或 `SSH_MSG_CHANNEL_OPEN_FAILURE` (92) 的消息来告知打开成功或者失败。
    成功定义如下：
    ```
    byte      SSH_MSG_CHANNEL_OPEN_CONFIRMATION (91)
    uint32    recipient channel 编号，这个是 SSH_MSG_CHANNEL_OPEN 中 sender channel 的值
    uint32    sender channel 编号
    uint32    初始化窗口大小
    uint32    最大包大小
    ....      下面是 channel type 特定数据
    ```
    失败定义如下：
    ```
    byte      SSH_MSG_CHANNEL_OPEN_FAILURE (92)
    uint32    recipient channel
    uint32    错误码 reason code
    string    描述，格式为 ISO-10646 UTF-8 encoding [RFC3629]
    string    language tag [RFC3066]
    ```
    预定义的错误码定义如下：
    ```
        Symbolic name                           reason code
        -------------                           -----------
    SSH_OPEN_ADMINISTRATIVELY_PROHIBITED          1
    SSH_OPEN_CONNECT_FAILED                       2
    SSH_OPEN_UNKNOWN_CHANNEL_TYPE                 3
    SSH_OPEN_RESOURCE_SHORTAGE                    4
    ```

上文介绍了 Channel 建立的过程，细节参见 [rfc4254#section-5.1](https://www.rfc-editor.org/rfc/rfc4254#section-5.1)。

Channel 建立完成后，在 Channel 中进行数据传输，主要有：

* 流量控制类消息，调节窗口大小。

    ```
    byte      SSH_MSG_CHANNEL_WINDOW_ADJUST
    uint32    recipient channel
    uint32    bytes to add
    ```

* 数据消息，消息的长度为 `min(数据长度, 窗口大小, 传输层协议的限制)`。

    * 普通数据，如交互式会话的标准输入、标准输出。

        ```
        byte      SSH_MSG_CHANNEL_DATA
        uint32    recipient channel
        string    data
        ```

    * 扩展数据，如交互式会话的标准出错，标准出错对应 data_type_code 为 1，是 `data_type_code` 唯一的预定义的值。

        ```
        byte      SSH_MSG_CHANNEL_EXTENDED_DATA
        uint32    recipient channel
        uint32    data_type_code
        string    data
        ```

Channel 关闭（[rfc4254#section-5.3](https://www.rfc-editor.org/rfc/rfc4254#section-5.3)），在此不多赘述了。

最后，在打开一个特定类型的 Channel 后，需要对这个 Channel 进行 Channel 粒度的配置。如，建立了一个 session 类型的 Channel 后，请求对方创建一个伪终端 (pty、pseudo terminal)。这类的请求叫做 Channel 特定请求（`Channel-Specific Requests`），这类场景使用相同的数据格式：

```
byte      SSH_MSG_CHANNEL_REQUEST (98)
uint32    recipient channel，对方的 sender channel 编号
string    request type in US-ASCII characters only 请求类型，参见：https://www.rfc-editor.org/rfc/rfc4250#section-4.9.3
boolean   want reply 是否需要对方回复
....      下面是 request type 特定数据
```

类似的，对于 `SSH_MSG_CHANNEL_REQUEST` 消息，如果  want reply 为 true，对方应使用 `SSH_MSG_CHANNEL_SUCCESS` (98)、`SSH_MSG_CHANNEL_FAILURE` (100) 进行回复。

#### 交互式会话

在 SSH 语境下，会话（Session）代表远程执行一个程序。这个程序可能是 Shell、应用。同时，它可能有也可能没有一个 tty、可能涉及也可能不涉及 x11 forward。

* 客户端打开一个类型为 `session` 的 Channel（为了安全 ssh 客户端应该拒绝创建 session 的请求）。

    ```
    byte      SSH_MSG_CHANNEL_OPEN (90)
    string    "session"
    uint32    sender channel
    uint32    initial window size
    uint32    maximum packet size
    ```

* 服务端回复一个类型为 `SSH_MSG_CHANNEL_OPEN_CONFIRMATION` 的消息。至此 Session 类型的 Channel 创建完成。
* 客户端可以请求创建一个伪终端（pty、Pseudo-Terminal）。

    ```
    byte      SSH_MSG_CHANNEL_REQUEST
    uint32    recipient channel
    string    "pty-req"
    boolean   want_reply
    string    TERM environment variable value (e.g., vt100)
    uint32    terminal width, characters (e.g., 80)
    uint32    terminal height, rows (e.g., 24)
    uint32    terminal width, pixels (e.g., 640)
    uint32    terminal height, pixels (e.g., 480)
    string    encoded terminal modes
    ```

* 关于 x11 forward 参见 [rfc4254#section-6.3](https://www.rfc-editor.org/rfc/rfc4254#section-6.3)。

* 客户端可以请求设置环境变量。

    ```
    byte      SSH_MSG_CHANNEL_REQUEST
    uint32    recipient channel
    string    "env"
    boolean   want reply
    string    variable name
    string    variable value
    ```

* 客户端启动一个 Shell 或命令，如下三种情况同一个 Channel 三选一。

    * 启动一个 Shell

        ```
        byte      SSH_MSG_CHANNEL_REQUEST
        uint32    recipient channel
        string    "shell"
        boolean   want reply
        ```

    * 执行一个命令

        ```
        byte      SSH_MSG_CHANNEL_REQUEST
        uint32    recipient channel
        string    "exec"
        boolean   want reply
        string    command
        ```

    * 调用其他子系统（如文件传输）

        ```
        byte      SSH_MSG_CHANNEL_REQUEST
        uint32    recipient channel
        string    "subsystem"
        boolean   want reply
        string    subsystem name
        ```

* 上述的启动的程序的输入输出通过如下类型的消息传输：

    * 标准输入、标准输出： `SSH_MSG_CHANNEL_DATA`，具体参见上文。
    * 标准出错：`SSH_MSG_CHANNEL_EXTENDED_DATA`，扩展类型为 `SSH_EXTENDED_DATA_STDERR`，具体参见上文。
    * 伪终端设置终端窗口大小指令(详见：[rfc4254#section-6.7](https://www.rfc-editor.org/rfc/rfc4254#section-6.7))：

        ```
        byte      SSH_MSG_CHANNEL_REQUEST
        uint32    recipient channel
        string    "window-change"
        boolean   FALSE
        uint32    terminal width, columns
        uint32    terminal height, rows
        uint32    terminal width, pixels
        uint32    terminal height, pixels
        ```

    * 信号（详见：[rfc4254#section-6.9](https://www.rfc-editor.org/rfc/rfc4254#section-6.9)）：

        ```
        byte      SSH_MSG_CHANNEL_REQUEST
        uint32    recipient channel
        string    "signal"
        boolean   FALSE
        string    signal name (without the "SIG" prefix)
        ```

    * 退出码（详见：[rfc4254#section-6.10](https://www.rfc-editor.org/rfc/rfc4254#section-6.10)）：

        ```
        byte      SSH_MSG_CHANNEL_REQUEST
        uint32    recipient channel
        string    "exit-status"
        boolean   FALSE
        uint32    exit_status
        ```

    * 退出信号（详见：[rfc4254#section-6.10](https://www.rfc-editor.org/rfc/rfc4254#section-6.10)）：

        ```
        byte      SSH_MSG_CHANNEL_REQUEST
        uint32    recipient channel
        string    "exit-signal"
        boolean   FALSE
        string    signal name (without the "SIG" prefix)
        boolean   core dumped
        string    error message in ISO-10646 UTF-8 encoding
        string    language tag [RFC3066]
        ``

#### TCP/IP 端口转发

SSH 协议本质上，是建立了在 client 到 server 端这两个设备之间建立了一条加密通讯链路。SSH 基于此实现了两个方向的端口转发：

* 本地转发（direct-tcpip）： 将 client 监听的 tcp 端口连接转发到 server 上。
* 远端转发（forwarded-tcpip）：将 server 监听的 tcp 端口连接转发到 client 上。

如上两者，在协议层面上，最大的区别在于（[forwarded-tcpip vs. direct-tcpip](https://groups.google.com/g/comp.security.ssh/c/qEss3K48wQY)）：

* 对于远端转发：流量入口端口位于 server 端，因此 SSH 协议需要提供一种机制，可以让 client 告知 server 监听的 tcp 端口。
* 而对于本地转发：流量入口位于 client，因此 client 程序自身就可以自助的监听 tcp 端口，而不涉及 client 和 server 端的通讯，因此 client 监听端口不是 SSH 协议需要关心的内容。

**direct-tcpip** 流程

* client 监听一个 tcp 端口，并 accept 连接（该步骤不属于 ssh 协议，属于 ssh 的实现部分）。
* client accept 返回后， client 发起建立一个类型为 `direct-tcpip` 的 Channel。

    ```
    byte      SSH_MSG_CHANNEL_OPEN
    string    "direct-tcpip"
    uint32    sender channel
    uint32    initial window size
    uint32    maximum packet size
    string    host to connect
    uint32    port to connect
    string    originator IP address
    uint32    originator port
    ```

* server 接收到消息后，和 `host to connect:port to connect` TCP 端口建立 TCP 连接。
* 至此，转发 Channel 建立完成，后续通过 `SSH_MSG_CHANNEL_DATA` 进行双向数据的转发。
* 该流程对应的 openssh client 命令为：

    ```bash
    ssh -L [LOCAL_IP:]LOCAL_PORT:DESTINATION:DESTINATION_PORT [USER@]SSH_SERVER
    ```

**forwarded-tcpip** 流程

* 准备阶段（具体参见： [rfc4254#section-7.1](https://www.rfc-editor.org/rfc/rfc4254#section-7.1)）： 
    * client 请求 server 监听 tcp 端口，作为流量入口。

        ```
        byte      SSH_MSG_GLOBAL_REQUEST
        string    "tcpip-forward"
        boolean   want reply
        string    address to bind (e.g., "0.0.0.0")
        uint32    port number to bind
        ```
    
    * server 根据请求信息，监听对应端口，并回复：

        ```
        byte     SSH_MSG_REQUEST_SUCCESS
        uint32   port that was bound on the server
        ```
* server accept 返回后， server 发起建立一个类型为 `direct-tcpip` 的 Channel。

    ```
    byte      SSH_MSG_CHANNEL_OPEN
    string    "forwarded-tcpip"
    uint32    sender channel
    uint32    initial window size
    uint32    maximum packet size
    string    address that was connected
    uint32    port that was connected
    string    originator IP address
    uint32    originator port
    ```

* client 接收到消息后，和 `address that was connected:port that was connected` TCP 端口建立 TCP 连接。
* 至此，转发 Channel 建立完成，后续通过 `SSH_MSG_CHANNEL_DATA` 进行双向数据的转发。
* 该流程对应的 openssh client 命令为：

    ```bash
    ssh -R [REMOTE:]REMOTE_PORT:DESTINATION:DESTINATION_PORT [USER@]SSH_SERVER
    ```

特别说明：

* 每个 TCP 连接，都会创建一个 Channel。
* 关于端口转发部分，参见：[rfc4254#section-7](https://www.rfc-editor.org/rfc/rfc4254#section-7)。

## Go Google SSH 库

### 准备

### 编写示例代码

### 客户端流程追踪

### 服务端流程追踪

## SSH 协议定制开发

* SSH 底层连接默认是 TCP 协议。但是，在现实中，SSH 可以运行在任意提供可靠性保证的底层连接之上。如 OpenSSH Client 的 ProxyCommand 选项可以配置让 SSH 连接运行在任意底层连接。

## 待梳理

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
