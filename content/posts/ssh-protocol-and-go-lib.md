---
title: "SSH 协议 和 Go SSH 库源码浅析"
date: 2023-01-27T00:00:10+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 导读

SSH, The Secure Shell Protocol (安全 Shell 协议)，是一个使用广泛的网络协议。

在中文互联网世界，关于 SSH 协议的介绍，往往都把重点放到了安全（Secure）方面的细节。这样的文章对于开发者来说，意义并不大，原因在于：

* 此类文章是以密码学为基础的。而密码学专业程度较高，对于开发者来说理解成本高。
* 其次，SSH 安全算法部分是 SSH 协议中最不可变的部分。即使完全理解了这部分，对于对 SSH 协议的二次开发，也没有什么帮助。

因此，本文不会仔细介绍 SSH 中 Secure 的细节。而是从整体和分层的角度尝试理解协议作者的设计考量。

和 HTTP 协议一样，SSH 协议是一个标准化的协议，由 [IETF](https://www.ietf.org/) 制定，主要的 RFC 有：

* [RFC 4251: The Secure Shell (SSH) Protocol Architecture](https://www.rfc-editor.org/rfc/rfc4251)
* [RFC 4252: The Secure Shell (SSH) Authentication Protocol](https://www.rfc-editor.org/rfc/rfc4252)
* [RFC 4253: The Secure Shell (SSH) Transport Layer Protocol](https://www.rfc-editor.org/rfc/rfc4253)
* [RFC 4254: The Secure Shell (SSH) Connection Protocol](https://www.rfc-editor.org/rfc/rfc4254)

还有一些[其他 RFC](https://www.omnisecu.com/tcpip/important-rfc-related-with-ssh.php) 在实际场景中应用较窄，在此就不列举了。

RFC 文档是网络协议的完整定义，追求的是无歧义和准确性，这导致 RFC 文档对于初学者不够友好，比较晦涩。因此，本文对 SSH 协议的介绍不会按照 RFC 的顺序和结构来进行，而是按照更符合人类认知的方式来进行。对于一些重要的部分，本文会给出对应的 RFC 章节的引用，以方便定位。

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
    * Client 发送字符串，必须以 `SSH-2.0-` 开头，以 `\r\n` 结尾。这部分可以是任意 ASCII 码 `> 32` 的字符。如  `SSH-2.0-Go\r\n`，。
    * Server 发送字符串，格式要求和 Client 一致。如 `SSH-2.0-dropbear_2022.83\r\n`。
3. Key 交换算法协商，参见：[rfc4253#section-7.1](https://www.rfc-editor.org/rfc/rfc4253#section-7.1)，也可以参考下文具体编码示例。
4. Key 交换算法执行，比如 Diffie-Hellman Key Exchange 参见：[rfc4253#section-8](https://www.rfc-editor.org/rfc/rfc4253#section-8)，也可以参考下文具体编码示例。

解释：

* 上述第 2、3、4 步，是 SSH 协议中的仅有的明文传输的部分。
* 上述第 2 步，是 SSH 协议中唯一一个消息格式不符合上文包格式定义的流程。本文介绍的 SSH 协议实际上是 SSH 协议的第 2 版。和其他网络协议类似，SSH 协议也是先有了实现，再进行标准化。因此在这一步，使用了文本格式，以实现对历史上旧版本的识别和兼容。
* 上述第 2 步，Client 和 Server 发送的字符串，没有前后依赖关系，一般情况下，在建立底层连接后，Client、Server 会立即向对方发送版本信息。
* 上述第 3、4 步，是 SSH 协议号称安全的关键步骤。SSH 的核心目标就是在不安全的底层连接（如 TCP）之上，建立一个安全的连接，以实现远程登录，端口转发等特性。因此，自然而然的想法就是对传输的数据进行加密。但是，加密必然需要 Client 和 Server 拥有配对的特定秘钥（key），这就是秘钥分发问题。**非对称加密算法**天然不存在秘钥分发问题，一种办法是所有数据均使用**非对称加密算法**加密，但是**非对称加密算法**性能太差，加解密成本难以接受。因此实际上 SSH 协议采用了如下思路：真正的数据加密仍然使用**对称加密算法**，而对称加密算法的秘钥，由**非对称的加密算法**进行保护，此类算法在 SSH 协议中有很多种，被称为 Key 交换算法。因为 Key 交换算法是 SSH 安全性的基石。没人可以 100% 保证某个 Key 交换算法一定是安全的。因此 SSH 协议在执行 Key 交换算法之前，需先进行 Key 交换算法协商，来确定要使用哪种 Key 交换算法。
* 上述第 3、4 步，不仅仅只在第一次连接执行一次，在整个 SSH 连接期间，会根据一些策略，重新执行以生成新的 Key，以保证安全性。

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

* 客户端启动一个 Shell、执行一个命令、调用一个子系统，如下三种情况同一个 Channel 三选一。

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

    * 调用其他子系统（如 sftp）

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

## Go SSH 库

主要介绍的是 [golang/x/crypto](https://github.com/golang/crypto) 模块中的 SSH 库。

### 准备

fork [golang/x/crypto](https://github.com/golang/crypto)，并 clone 下来。

```bash
git clone https://github.com/rectcircle/crypto.git
```

使用 IDE (VSCode) 打开。

```bash
code crypto
```

### 核心 API

该库实现了 SSH 协议，全部 API 参见：[godoc](https://pkg.go.dev/golang.org/x/crypto/ssh)。

API 可以分为两个部分，分别是 Client 和 Server。下面将分别介绍。

#### Client

该库客户端能力通过 [`ssh.Client`](https://pkg.go.dev/golang.org/x/crypto/ssh#Client) 结构体提供。

该结构体的构造函数为： [`func ssh.Dial(network, addr string, config *ClientConfig) (*Client, error)`](https://pkg.go.dev/golang.org/x/crypto/ssh#Dial) 该函数流程如下：

* 使用 `func net.Dail` 建立底层链接，获得 `net.Conn`。
* 调用 `func ssh.NewClientConn` 完成 SSH 传输层协议和认证协议（具体参见上文）部分。
* 调用 `func ssh.NewClient` 返回 `ssh.Client`。

注意：如果想使用自定义的底层连接，可以自己构造一个实现了 `net.Conn` 的对象，然后参考上述的 `ssh.Dial` 的实现构造一个 `ssh.Client`。

上述构造函数第三个参数 [`ssh.ClientConfig`](https://pkg.go.dev/golang.org/x/crypto/ssh#ClientConfig) 结构体，用来配置 SSH Client。部分字段说明如下：

* `User string` 用户名，对应 ssh 命令的 `ssh 用户名@xxx` 用户名部分。
* `Auth []AuthMethod` 鉴权方法，支持：
    * 密码认证：[`ssh.Password()`](https://pkg.go.dev/golang.org/x/crypto/ssh#Password) 和 [`ssh.PasswordCallback()`](https://pkg.go.dev/golang.org/x/crypto/ssh#PasswordCallback)。
    * gss api 认证，即 kerberos 认证：[`ssh.GSSAPIWithMICAuthMethod()`](https://pkg.go.dev/golang.org/x/crypto/ssh#GSSAPIWithMICAuthMethod) 。
    * 公钥认证：[`ssh.PublicKeys()`](https://pkg.go.dev/golang.org/x/crypto/ssh#PublicKeys) 和 [`ssh.PublicKeysCallback()`](https://pkg.go.dev/golang.org/x/crypto/ssh#PublicKeysCallback)。
    * Keyboard 认证：[`ssh.KeyboardInteractiveChallenge()`](https://pkg.go.dev/golang.org/x/crypto/ssh#KeyboardInteractiveChallenge)。
    * 多种认证依次尝试（模拟 ssh 命令的行为）：[`ssh.RetryableAuthMethod()`](https://pkg.go.dev/golang.org/x/crypto/ssh#RetryableAuthMethod)。
* `HostKeyCallback HostKeyCallback` SSH Server Host Key 的校验，预防 SSH 中间人攻击，关于中间人攻击本文不多介绍，可以自行搜索。
* `BannerCallback BannerCallback`，在 SSH 认证协议部分，定义一种 Banner 消息类型，以允许服务端发送一些文本消息给客户端，具体参见 [rfc4252#section-5.4](https://www.rfc-editor.org/rfc/rfc4252#section-5.4)。

获取到 `*ssh.Client` 对象后，即可通过如下 API 使用 SSH 连接协议（具体参见上文）提供的能力。

* 交互式会话：[`func (c *Client) NewSession() (*Session, error)`](https://pkg.go.dev/golang.org/x/crypto/ssh#Client.NewSession)，将返回 `ssh.Session` 对象（交互式会话介绍，参见上文）。
    * 请求创建一个伪终端 [`func (s *Session) RequestPty(term string, h, w int, termmodes TerminalModes) error`](https://pkg.go.dev/golang.org/x/crypto/ssh#Session.RequestPty)
    * 请求设置环境变量 [`func (s *Session) Setenv(name, value string) error`](https://pkg.go.dev/golang.org/x/crypto/ssh#Session.Setenv)
    * 启动一个 Shell、执行一个命令、调用一个子系统：
        * 启动 Shell：[`func (s *Session) Shell() error`](https://pkg.go.dev/golang.org/x/crypto/ssh#Session.Shell)。
        * 执行命令（以下选择一个）：
            * [`func (s *Session) Start(cmd string) error`](https://pkg.go.dev/golang.org/x/crypto/ssh#Session.Start)，在远端启动一个命令。
            * [`func (s *Session) Wait() error`](https://pkg.go.dev/golang.org/x/crypto/ssh#Session.Wait)，等待远端执行完成。
            * [`func (s *Session) Run(cmd string) error`](https://pkg.go.dev/golang.org/x/crypto/ssh#Session.Run)，等价于先 Start 再 Wait。
            * [`func (s *Session) Output(cmd string) ([]byte, error)`](https://pkg.go.dev/golang.org/x/crypto/ssh#Session.Output)，在远端执行一个命令，并等待完成，并将标准输出作为字节数组返回。
            * [`func (s *Session) CombinedOutput(cmd string) ([]byte, error)`](https://pkg.go.dev/golang.org/x/crypto/ssh#Session.CombinedOutput)，执行一个命令，并等待完成，并将标准输出和标准出错合并作为字节数组返回。
        * 调用子系统：[`func (s *Session) RequestSubsystem(subsystem string) error`](https://pkg.go.dev/golang.org/x/crypto/ssh#Session.RequestSubsystem)。
    * 通过如下 API 获取到标准输入、标准输出、标准出错和远端进行交互。
        * [`func (s *Session) StdinPipe() (io.WriteCloser, error)`](https://pkg.go.dev/golang.org/x/crypto/ssh#Session.StdinPipe)
        * [`func (s *Session) StdoutPipe() (io.Reader, error)`](https://pkg.go.dev/golang.org/x/crypto/ssh#Session.StdoutPipe)
        * [`func (s *Session) StderrPipe() (io.Reader, error)`](https://pkg.go.dev/golang.org/x/crypto/ssh#Session.StderrPipe)
* 端口转发（本地转发和远端转发介绍，参见上文）：
    * 本地转发：[`func (c *Client) Dial(n, addr string) (net.Conn, error)`](https://pkg.go.dev/golang.org/x/crypto/ssh#Client.Dial) 除了支持 TCP/IP 外，还支持 openssh 扩展的转发 `unix domain socket` 中，即 n 参数支持："tcp", "tcp4", "tcp6", "unix"。
    * 本地转发：[`func (c *Client) DialTCP(n string, laddr, raddr *net.TCPAddr) (net.Conn, error)`](https://pkg.go.dev/golang.org/x/crypto/ssh#Client.DialTCP)，只支持 TCP/IP。
    * 远端转发：[`func (c *Client) Listen(n, addr string) (net.Listener, error)`](https://pkg.go.dev/golang.org/x/crypto/ssh#Client.Listen) 除了支持 TCP/IP 外，还支持 openssh 扩展的转发 `unix domain socket` 中，即 n 参数支持："tcp", "tcp4", "tcp6", "unix"。
    * 远端转发：[`func (c *Client) ListenTCP(n, addr string) (net.Listener, error)`](https://pkg.go.dev/golang.org/x/crypto/ssh#Client.ListenTCP) 只支持 TCP/IP。
    * 远端转发：[`func (c *Client) ListenUnix(socketPath string) (net.Listener, error)`](https://pkg.go.dev/golang.org/x/crypto/ssh#Client.ListenUnix) 支持 `unix domain socket`。

#### Server

该库 server 能力通过 [`func NewServerConn(c net.Conn, config *ServerConfig) (*ServerConn, <-chan NewChannel, <-chan *Request, error)`](https://pkg.go.dev/golang.org/x/crypto/ssh#NewServerConn) 函数提供。，该函数，完成了 SSH 传输层协议和认证协议（具体参见上文）部分。该函数的返回值说明如下：

* `*ssh.ServerConn` 对 `net.Conn` 的封装，主要用于远端转发，具体参见下文。
* `<-chan NewChannel` 获取由 ssh client 创建的 Channel，用来实现交互式会话、本地转发。
* `<-chan *Request` 主要用于远端转发，对应 `SSH_MSG_GLOBAL_REQUEST` 消息，具体参见下文。
* `error` 处理 SSH 传输层协议和认证协议出现错误，如认证失败。

[`ssh.NewChannel`](https://pkg.go.dev/golang.org/x/crypto/ssh#NewChannel) 接口对应一个 client 创建的 Channel 的消息（`SSH_MSG_CHANNEL_OPEN` 具体参见上文：[Channel 部分](#channel)），方法有如下几个：

* `ChannelType() string` channel 的类型，可选值为：'session', 'x11', 'forwarded-tcpip', 'direct-tcpip' 详见： [rfc4250#section-4.9.1](https://www.rfc-editor.org/rfc/rfc4250#section-4.9.1)
* `Accept() (Channel, <-chan *Request, error)` 同意建立该 Channel。
    * `ssh.Channel` 接口对应一个已经建立 Channel，在 server 端，该接口方法解释如下：
        * `Read(data []byte) (int, error)` 从 Channel 中读取数据，对应 client -> server 的 `SSH_MSG_CHANNEL_DATA` 消息（参见上文 [channel](#channel)），在 session 场景对应 stdin。
        * `Write(data []byte) (int, error)` 向 Channel 中写入数据，对应 server -> client 的 `SSH_MSG_CHANNEL_DATA` 消息（参见上文 [channel](#channel)），在 session 场景对应 stdout。
        * `Close() error` 关闭该 channel，对应 `SSH_MSG_CHANNEL_CLOSE` 消息 （参见上文 [channel](#channel)）。
        * `CloseWrite() error`
        * `SendRequest(name string, wantReply bool, payload []byte) (bool, error)` 对应 server -> client 在该 Channel 上的 `SSH_MSG_CHANNEL_REQUEST`（参见上文 [SSH 连接协议](#ssh-连接协议)），主要在 session channel 场景有如下几个类型：
            * `"window-change"`，发送 pty 的 window-change 信息。
            * `"exit-status"`，发送 cmd 的退出码消息。
    * `ssh.Request` 结构体对应 client -> server 在该 Channel 上的 `SSH_MSG_CHANNEL_REQUEST`（参见上文 [SSH 连接协议](#ssh-连接协议)）该结构体有如下几个字段和方法：
        * `Type string` 字段，在 session channel 场景有用，有如下几个类型：
            * `"pty-req"`
            * `"shell"`
            * `"subsystem"`
            * `"env"`
            * `"exec"`
        * `WantReply bool` 字段，是否需要回复。
        * `Payload []byte` 字段，type 特定数据，可以使用 [`ssh.Unmarshal()`](https://pkg.go.dev/golang.org/x/crypto/ssh#Unmarshal) 方法进行反序列化。
        * `func (r *Request) Reply(ok bool, payload []byte) error` 方法，对 `WantReply = true` 的方法，必须调用该函数进行回复。
* `Stderr() io.ReadWriter` server -> client，对应 `SSH_MSG_CHANNEL_EXTENDED_DATA`，参见上文 [交互式会话](#交互式会话)，在 session 场景对应 stderr。
* `Reject(reason RejectionReason, message string) error` 拒绝建立该 Channel。
* `ExtraData() []byte` 类型特定数据。

从 API 上来看，Go SSH 库 Server API 比 Client API 更加的底层，需要开发者理解 [SSH 连接协议](#ssh-连接协议) 消息相关细节才能很好的进行开发。而 Go SSH 库的 Client API 在比较高的层次，使用起来比较容易。

因此，如果想使用 Go 语言开发 SSH Server 相关需求，建议直接使用或者参考：[github.com/gliderlabs/ssh](https://github.com/gliderlabs/ssh) 库，该库提供了类似于 http.Server 的，更高层次的 API。如：

* 远端转发的[示例](https://github.com/gliderlabs/ssh/blob/master/_examples/ssh-remoteforward/portforward.go#L30)和[实现](https://github.com/gliderlabs/ssh/blob/master/tcpip.go#L97)，主要逻辑是对上文 `NewServerConn` 返回的：
    * `<-chan *Request`，接收到 `"tcpip-forward"` 监听端口，接收到 `"cancel-tcpip-forward"` 取消监听。
    * `*ssh.ServerConn`，用户请求上面监听的端口时，调用 `OpenChannel` 建立一个 server -> client 的 channel，并进行数据拷贝。

本文主要是探索 SSH 协议的相关结构，因此下文的示例的 server 仍然使用 Go SSH 库来实现。

#### 通用 API

* [`func Unmarshal(data []byte, out interface{}) error`](https://pkg.go.dev/golang.org/x/crypto/ssh#Unmarshal) ssh 协议消息字段反序列函数。主要用于 [`ssh.Request.Payload`](https://pkg.go.dev/golang.org/x/crypto/ssh#Request) 字段。
* [`func Marshal(msg interface{}) []byte`](https://pkg.go.dev/golang.org/x/crypto/ssh#Marshal) ssh 协议消息字段序列函数。主要用于：
    * [`ssh.Channel.SendRequest`](https://pkg.go.dev/golang.org/x/crypto/ssh#Channel.SendRequest) 函数。
    * [`ssh.Request.Reply`](https://pkg.go.dev/golang.org/x/crypto/ssh#Request.Reply) 函数。

### 编写示例代码

使用 Go SSH 库实现一个 Client 和 Server，实现在远程调用 env 命令。

`ssh/demo/client/main.go`

```go
package main

import (
	"fmt"
	"log"
	"net"
	"os/user"

	"golang.org/x/crypto/ssh"
)

func main() {
	u, err := user.Current()
	if err != nil {
		log.Fatal(err)
	}
	// 连接到 server： 用户为当前用户，使用密码鉴权方式，密码为测试的 123456，不校验 HostKey 是否合法。
	client, err := ssh.Dial("tcp", "127.0.0.1:2222", &ssh.ClientConfig{
		User: u.Username,
		Auth: []ssh.AuthMethod{
			ssh.Password("123456"),
		},
		HostKeyCallback: func(hostname string, remote net.Addr, key ssh.PublicKey) error { return nil },
	})
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()
	// 启动一个交互式会话
	session, err := client.NewSession()
	if err != nil {
		log.Fatal(err)
	}
	defer session.Close()
	// 设置会话的环境变量
	err = session.Setenv("A", "1")
	if err != nil {
		log.Fatal(err)
	}
	// 执行命令 env，并获得输出
	output, err := session.CombinedOutput("env")
	fmt.Printf("> env\n%s", string(output))
}
```

`ssh/demo/server/main.go`

```go
package main

import (
	"crypto/rand"
	"crypto/rsa"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"os/exec"

	"golang.org/x/crypto/ssh"
)

func handleSession(c ssh.Channel, rc <-chan *ssh.Request) {
	defer c.Close()
	envs := []string{}
	for r := range rc {
		switch r.Type {
		case "exec":
			var payload = struct{ Value string }{}
			err := ssh.Unmarshal(r.Payload, &payload)
			if err != nil {
				log.Printf("ssh session exec request unmarshal error: %v", err)
				r.Reply(false, nil)
				return
			}
			err = r.Reply(true, nil)
			if err != nil {
				log.Printf("ssh session exec reply error: %v", err)
				r.Reply(false, nil)
				return
			}
			go func() {
				cmd := exec.Command("sh", "-c", payload.Value)
				cmd.Env = envs
				stdout, err := cmd.StdoutPipe()
				if err != nil {
					panic(err)
				}
				stderr, err := cmd.StderrPipe()
				if err != nil {
					panic(err)
				}
				stdin, err := cmd.StdinPipe()
				if err != nil {
					panic(err)
				}
				cmd.Start()
				go io.Copy(stdin, c)
				go io.Copy(c.Stderr(), stderr)
				go io.Copy(c, stdout)
				status := struct{ Status uint32 }{uint32(0)}
				if err = cmd.Wait(); err != nil {
					if exiterr, ok := err.(*exec.ExitError); ok {
						status.Status = uint32(exiterr.ExitCode())
					} else {
						log.Printf("ssh session cmd wait error: %v", err)
						status.Status = 1
					}
				}
				_, err = c.SendRequest("exit-status", false, ssh.Marshal(&status))
				if err != nil {
					log.Printf("ssh session send exit status error: %v", err)
				}
				c.Close()
			}()
		case "env":
			var kv = struct{ Key, Value string }{}
			err := ssh.Unmarshal(r.Payload, &kv)
			if err != nil {
				log.Printf("ssh session env request unmarshal error: %v", err)
				r.Reply(false, nil)
			}
			envs = append(envs, fmt.Sprintf("%s=%s", kv.Key, kv.Value))
			r.Reply(true, nil)
		// case "shell":     // 本 demo 暂不涉及。
		// case "pty-req":   // 本 demo 暂不涉及。
		// case "subsystem": // 本 demo 暂不涉及。
		default:
		}
	}
}

func HandleConn(conn net.Conn, serverConfig *ssh.ServerConfig) {
	// 完成 SSH 传输层协议和认证协议。
	serverConn, chans, reqs, err := ssh.NewServerConn(conn, serverConfig)
	_ = serverConn
	if err != nil {
		log.Fatal(err)
	}
	// 拒绝所有 SSH_MSG_GLOBAL_REQUEST 消息，即，不支持远端转发（forwarded-tcpip）。
	// 如需支持远端转发，实现参见：https://github.com/gliderlabs/ssh/blob/30ec06db4e743ac9f827a69c8b8cfb84064a6dc7/tcpip.go#L97
	//    1. 将消息进行反序列化。
	//    2. 调用 net.Listen 监听对应端口
	//    3. listener 返回 conn 时，调用 serverConn.OpenChannel，消息类型为 forwarded-tcpip 向客户端请求创建一个 channel。
	//    4. 然后在 conn 和 channel 之间进行 io copy。
	// 本示例就不实现了。
	go ssh.DiscardRequests(reqs)
	for c := range chans {
		switch c.ChannelType() {
		case "session":
			c, r, err := c.Accept()
			if err != nil {
				log.Printf("accept session channel error: %v", err)
			}
			go handleSession(c, r)
		case "x11":
		// case "direct-tcpip": // 本示例暂不处理本地转发。
		// case "forwarded-tcpip": // 按照 rfc 说明 server 端不应该支持该类型。
		default:
			c.Reject(ssh.UnknownChannelType, "unsupported channel type")
		}
	}
}

// 创建一个用于 ssh server 握手用的配置
//   1. 采用密码校验
//   2. hostKey 随机生成一个
func newSSHSererConfig() (*ssh.ServerConfig, error) {
	config := &ssh.ServerConfig{
		PasswordCallback: func(conn ssh.ConnMetadata, password []byte) (*ssh.Permissions, error) {
			if string(password) == "123456" {
				return nil, nil
			}
			return nil, errors.New("password incorrect")
		},
	}
	priKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return nil, err
	}
	sshSigner, err := ssh.NewSignerFromKey(priKey)
	if err != nil {
		return nil, err
	}
	config.AddHostKey(sshSigner)
	return config, nil
}

func main() {
	// 构造 ssh server config
	serverConfig, err := newSSHSererConfig()
	if err != nil {
		log.Fatal(err)
	}
	// 监听 TCP 端口，并 accept 连接。
	listener, err := net.Listen("tcp", ":2222")
	if err != nil {
		log.Fatal(err)
	}
	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Fatal(err)
		}
		go HandleConn(conn, serverConfig)
	}
}
```

### 运行实例代码

* 先运行 server 端 `go run ./ssh/demo/server`。
* 再运行 client 端 `go run ./ssh/demo/client`，输出如下：

```
> env
A=1
PWD=/Users/xxx/Workspace/personal/go-x-crypto
SHLVL=1
_=/usr/bin/env
```

### 开启 debug 日志

Go SSH 库中有几个常量，可以打开 Debug 日志，以追踪源码流程，分别是：

* `ssh/handshake.go:20` 打印传输层协议的 Key 交换流程相关 Debug 日志。
* `ssh/mux.go:18` 打印连接协议相关的 Debug 日志。
* `ssh/transport.go:17` 打印传输层协议发送和接收到的 Packet 的类型。

本文重点观察传输层协议的部分。因此，只打开 `ssh/transport.go:17` 日志。

### 客户端流程追踪

#### 客户端传输层协议输出分析

重新按照上文 [运行实例代码](#运行实例代码) 方式运行，并观察 client 代码的输出。

`#` 号开头为说明。

```
# Go 源码：ssh/messages.go
# 消息编号：https://www.rfc-editor.org/rfc/rfc4250#section-4.1

# 连接层协议部分：https://www.rfc-editor.org/rfc/rfc4253
2023/01/26 22:43:43 write client 20   # SSH_MSG_KEXINIT, client -> server, key 交换初始化消息，算法协商。
2023/01/26 22:43:43 read client 20    # SSH_MSG_KEXINIT, server -> client, key 交换初始化消息，算法协商。
2023/01/26 22:43:43 write client 30   # client -> server, key 交换算法执行。
2023/01/26 22:43:43 read client 31    # server -> client, key 交换算法执行。
2023/01/26 22:43:43 write client 21   # SSH_MSG_NEWKEYS, client -> server, key 交换算法完成。
2023/01/26 22:43:43 read client 21    # SSH_MSG_NEWKEYS, server -> client, key 交换算法完成。
2023/01/26 22:43:43 read client 7     # server -> client, 与 SSH 协议扩展有关，参见：https://www.rfc-editor.org/rfc/rfc8308
2023/01/26 22:43:43 write client 5    # SSH_MSG_SERVICE_REQUEST, client -> server, 请求 ssh-userauth 服务。
2023/01/26 22:43:43 read client 6     # SSH_MSG_SERVICE_ACCEPT, server -> client, 接收鉴权服务请求。

# 认证协议部分：https://www.rfc-editor.org/rfc/rfc4252
2023/01/26 22:43:43 write client 50   # SSH_MSG_USERAUTH_REQUEST, client -> server, 请求鉴权
2023/01/26 22:43:43 read client 51    # SSH_MSG_USERAUTH_FAILURE, server -> client, 鉴权失败
2023/01/26 22:43:43 write client 50   # SSH_MSG_USERAUTH_REQUEST, client -> server, 请求鉴权
2023/01/26 22:43:43 read client 52    # SSH_MSG_USERAUTH_SUCCESS, server -> client, 鉴权成功

# 连接协议部分： https://www.rfc-editor.org/rfc/rfc4254
2023/01/26 22:43:43 write client 90   # SSH_MSG_CHANNEL_OPEN, client -> server, 打开 Channel
2023/01/26 22:43:43 read client 91    # SSH_MSG_CHANNEL_OPEN_CONFIRMATION, server -> client, 打开 Channel 成功
2023/01/26 22:43:43 write client 98   # SSH_MSG_CHANNEL_REQUEST, client -> server, Channel 请求，应该是设置环境变量
2023/01/26 22:43:43 read client 99    # SSH_MSG_CHANNEL_SUCCESS, server -> client, Channel 请求成功
2023/01/26 22:43:43 write client 98   # SSH_MSG_CHANNEL_REQUEST, client -> server, Channel 请求，应该是运行 env 命令
2023/01/26 22:43:43 read client 99    # SSH_MSG_CHANNEL_SUCCESS, server -> client, Channel 请求成功
2023/01/26 22:43:43 write client 96   # SSH_MSG_CHANNEL_EOF, client -> server, 关闭写通道。
2023/01/26 22:43:43 read client 94    # SSH_MSG_CHANNEL_DATA, server -> client, 服务端写回标准输出。
2023/01/26 22:43:43 write client 93   # SSH_MSG_CHANNEL_WINDOW_ADJUST, client -> server, 滑动窗口调整。
2023/01/26 22:43:43 read client 98    # SSH_MSG_CHANNEL_REQUEST, server -> client, 服务端告知命令退出码。
2023/01/26 22:43:43 read client 97    # SSH_MSG_CHANNEL_CLOSE, server -> client, 服务端关闭 Channel。
2023/01/26 22:43:43 write client 97   # SSH_MSG_CHANNEL_CLOSE, client -> server, 客户端关闭 Channel。
```

#### ssh.Dial 源码

* 进入 `ssh/demo/client/main.go:18` 函数 `ssh.Dial` 定义。
    * `ssh/client.go:177` 调用 `net.DialTimeout` 和服务端建立 TCP 连接。
    * `ssh/client.go:181` 调用 `NewClientConn`，该函数，完成了 SSH 传输层协议和认证协议的流程，并构造一个实现了连接层协议的 mux 对象。
        * `ssh/client.go:83` 调用 `conn.clientHandshake`，该函数，完成了 SSH 传输层协议和认证协议的流程。
            * `ssh/client.go:100` 函数 `exchangeVersions`，完成客户端和服务端的协议版本协商。
            * `ssh/client.go:105` 函数 `newClientTransport`。
                * `ssh/client.go:126` 调用 `newHandshakeTransport` 函数构造 `*handshakeTransport`。 特别注意的是：
                    * 在 `ssh/handshake.go:117` 将 `t.readBytesLeft` 初始化为一个较大值。
                    * 在 `ssh/handshake.go:118` 将 `t.writeBytesLeft` 初始化为一个较大值。
                    * 在 `ssh/handshake.go:121` 语句 `t.requestKex <- struct{}{}`，发起首次 key 交换流程。
                * 并启动两个协程，分别是：`go t.readLoop()` 和 `go t.kexLoop()`，具体流程参见下文。
                * 返回并赋值给 `c.transport`。
            * `ssh/client.go:108` 调用 `c.transport.waitSession()`，该函数会在上述两个协程，完成 SSH 传输层协议（即 Key 交换算法协商、Key 交换算法执行）后返回。
            * `ssh/client.go:113` 调用 `c.clientAuthenticate(config)`，执行 SSH 认证协议流程。
        * `ssh/client.go:87` 调用 `newMux` 构造一个实现了连接层协议的 mux 对象。
    * `ssh/client.go:185` 调用 `NewClient` 构造一个客户端结构体 `Client`，来提供高层次的 SSH 连接层协议 API。

#### 客户端传输层协议源码

`handshakeTransport` （`ssh/handshake.go`）结构体是传输层协议封装，该结构体说明如下：

* 两个协程 `go t.readLoop()`（`ssh/handshake.go:196`） 和 `go t.kexLoop()` （`ssh/handshake.go:261`）协作，在首次和 Key 老化后，在后台完成 Key 交换。下面按照时序介绍首次 Key 交换的流程：
    * 时序 1 `kexLoop` 函数：
        * `ssh/handshake.go:275` 进入 `case <-t.requestKex` 分支（前面的代码有写入，参见 [ssh.Dial 源码](#sshdial-源码) 部分的说明）。
        * `ssh/handshake.go:280` 调用 `t.sendKexInit()`，给服务端发送 `SSH_MSG_KEXINIT` 消息（20，[rfc4253#section-7.1](https://www.rfc-editor.org/rfc/rfc4253#section-7.1)）本次循环结束。
        * `ssh/handshake.go:270` 等待 `select` 返回。
    * 时序 2 `readLoop` 函数：
        * `ssh/handshake.go:376` 读取服务端 `KexInit` 消息。
        * `ssh/handshake.go:412` 将 `KexInit` 消息通过 `startKex` channel 告知 `kexLoop`。
        * `ssh/handshake.go:413` 等待 key 交换完成。
    * 时序 3 `kexLoop` 函数：
        * `ssh/handshake.go:271` 进入 `case request, ok = <-t.startKex` 分支，`request != nil`，跳出 268 行 for 循环。
        * `ssh/handshake.go:303` 进入 `enterKeyExchange` 函数，执行 Key 交换流程。
        * `ssh/handshake.go:328` 告知 `readLoop`。
    * 时序 4 `readLoop` 函数：
        * `ssh/handshake.go:413` 返回 `SSH_MSG_NEWKEYS` （21）。
        * `ssh/handshake.go:209` 将消息发送给 `t.incoming`。
    * 时序 5 `ssh/client.go:83` 的 `conn.clientHandshake` 函数：
        * `ssh/handshake.go:155` 函数 `waitSession` 返回，后续进入认证流程。
* 协程 `go t.readLoop()` 和 函数 `t.readPacket()`，按照传输层协议的包格式，解密出消息字节数组（上文 [数据包 (Packet) 结构](#数据包-packet-结构) 的 payload），等待上层认证协议和连接协议处理。
* 函数 `t.writePacket()` 将消息字节数组（上文 [数据包 (Packet) 结构](#数据包-packet-结构) 的 payload）加密并封装到数据包中，并发送到服务端。该函数由上层认证协议和连接协议调用。
* `go t.readLoop()`、 `t.readPacket()` 和 `t.writePacket()` 底层调用的是 `keyingTransport` 接口，其唯一的实现是 `transport` （`ssh/transport.go:42`）结构体，该结构体底层调用的是 `connectionState` (`ssh/transport.go:69`) 结构体的方法。
    * `connectionState` 的类似于 `io.ReadWriter`，有如下两个方法：
        * `writePacket(packet []byte) error`，这里的 packet 命名有问题，实际上是消息字节数组（上文 [数据包 (Packet) 结构](#数据包-packet-结构) 的 payload）。
        * `readPacket() ([]byte, error)`，返回消息字节数组（上文 [数据包 (Packet) 结构](#数据包-packet-结构) 的 payload）。
    * `connectionState` 依赖 `packetCipher` （`ssh/transport.go:55`）接口来 packet 的加解密。从上文可以知道：
        * 传输层协议的 key 交换流程的包是不需要加密的，对应的实现是 `noneCipher`。
        * 除了 key 交换流程的包都需要使用 key 交换获取到的 key 进行加解密。对应的实现有许多个，如：`streamPacketCipher` 等。

#### 客户端认证和连接协议源码

客户端认证和连接协议源码本文不再逐行分析源码了。下面记录一下相关源码的位置：

* 客户端认证，调用链为：
    * `ssh.Dial` 函数 `ssh/client.go:181` 对 `ssh.NewClientConn` 的调用。
    * `ssh/client.go:83` 对 `ssh.connection.clientHandshake` 的调用。
    * `ssh/client.go:13` 对 `ssh.connection.clientAuthenticate` 的调用。
* 客户端认证协议，源文件：`ssh/client_auth.go`。
* 客户端连接协议，源文件：`ssh/mux.go`

### 服务端流程追踪

服务端流程分析可以参考客户端的分析，在此不多赘述了。

### 和 OpenSSH 关系

业界对于 SSH 协议的标准实现是 OpenSSH。该实现不仅实现了标准 rfc 中的 ssh，还对 ssh 进行了扩展。具体参见 [openssh specs](https://www.openssh.com/specs.html)。

由于 OpenSSH 协议是事实上的标准，因此 Go 的 SSH 库也对 OpenSSH 的扩展进行了支持。从源码中搜索 `@openssh.com` 可以看到这部分的内容。

关于 SSH 协议的厂商扩展标准，参见： [rfc8308](https://www.rfc-editor.org/rfc/rfc8308)。

### scp 和 sftp

基于 SSH 的文件传输有 scp 和 sftp 两种方式：

* scp 是基于命令的标准 IO 实现的。本地 scp 命令会使用 SSH 连接协议，打开一个 session，通过 `SSH_MSG_CHANNEL_REQUEST` 的 exec 在远端执行 scp 命令。远端 scp 会读取文件，按照 scp 协议将文件写入标准输出，这个标准输出通过 SSH Channel 传递到本地的 scp 这个进程中，本地 scp 按照协议协议标准输出，并写入本地文件，即可完成文件书传输。更多参见：
    * go scp client 库：[bramvdbogaerde/go-scp](https://github.com/bramvdbogaerde/go-scp)。
    * scp 协议分析文章：[scp 原理](https://blog.singee.me/2021/01/02/d9e5fe31d708454fb99869a4c9d78f24/)
* sftp 是基于 SSH 连接协议的子系统实现的，对应的是 `SSH_MSG_CHANNEL_REQUEST` 的 subsystem。更多参见：
    * go sftp server 和 client 库：[pkg/sftp](https://github.com/pkg/sftp)。
