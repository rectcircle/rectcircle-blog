---
title: "理解 ssl/tls 协议: 从加密算法到 ssl/tls"
date: 2022-07-16T19:16:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 加密算法

### 定义

一般语境下，加密算法是对加密和解密两个过程的概括：

* 加密过程，即通过 key (秘钥)，将 plaintext (明文) 转换 ciphertext (密文) 的过程。
* 解密过程，即通过 key，将 ciphertext 转换为明文数据 'plaintext 的过程。
* 在上述两个过程中，需保证，对任意 plaintext ，满足 `plaintext = 'plaintext`。

### 分类

加密算法根据加密和解密过程使用的 key 是否是同一个分为对称加密算法和非对称加密算法。

* key 是同一个的，为对称加密算法。
* key 是不同的两个的，为非对称加密算法。

#### 对称加密算法

对称算法的加密和解密使用的 key 同一个。即：

```
plaintext == decrypt(encrypt(plaintext, key)), key)
```

#### 非对称加密算法

非对称算法的加密和解密使用的 key 不是同一个。这两个 key 成对出现，被称为 key pair (秘钥对)。

假设一个 key pair 的两个 key ，分别为 `key1` 和 `key2`，则：

* 使用 `key1` 加密得到的 ciphertext，可以使用 `key2` 解密；
* 使用 `key2` 加密得到的 ciphertext，可以使用 `key1` 解密。

也就是说，`key1` 和 `key2` 是对等的 (对称的)，即：

```
plaintext == decrypt(encrypt(plaintext, key1)), key2)
plaintext == decrypt(encrypt(plaintext, key2)), key1)
```

虽然两个 key 是对等的，但在业界，为了性能和实际场景，会选取其中一个作为 private key (私钥)，另外一个作为 public key (公钥)。

其中，public key 是公开的，所有人都可以获得到。而 private key 是私有的，只有 key pair 所有者拥有，

### 安全通讯

在一次数据通讯过程，涉及两方；发送方和接收方。双方的数据通过通信信道传输。由于通信信道是基于公开的经典物理学原理，是不安全的，所以第三方可以很容易的做到如下几点：

* 窃听，第三方只要了解数据调制方法，就可以在通信信道，随意窃听通信内容。
* 冒充，第三方冒充发送者，通过通讯信道，给接收者发送消息。
* 篡改，第三方截获到发送者的数据，篡改后发送给接收者。

利用加密算法和合理的流程设计，可以实现安全的通讯，解决如上几个问题。

#### 对称加密实现安全通讯

加密算法的可以解决这些问题：发送方将 plaintext 加密后得到的 ciphertext，通过不安全的通讯信道发送给接收方；接收方解密后，即可获取到 'plaintext。在这整个过程中，即使数据在不安全的信道中被截获了，第三方也只能得到无法阅读的 ciphertext。

在非对称加密场景，流程为：

```
encrypt(plaintext, key) =============== ciphertext ===============> decrypt(ciphertext, key)
    发送方                                  信道                              接收方
```

以上流程解决了安全通讯的三个问题：

* （✅ 解决）窃听，第三方没有 key，通过窃听拿到 ciphertext，也无法获取到 plaintext；
* （✅ 解决）冒充，第三方没有 key，无法发送合法的 ciphertext；
* （✅ 解决）篡改，第三方没有 key，通过窃听拿到的 ciphertext，无法获取到 plaintext，也就无法篡改。

但是，以上场景存在一个严重问题，即：通讯双方如何知道通讯中使用的 key 呢？首先，不能明文传输，因为第三方可以窃听， key 泄漏了，加密形同虚设。因此在不使用非对称加密算法的情况下，最安全的方式是，通讯双方线下交换 key。

#### 非对称加密解决窃听问题

```
encrypt(plaintext, public_key_b) =============== ciphertext ===============> decrypt(ciphertext, private_key_b)
    A(发送方)                                         信道                              B(接收方)
```

上文提到，非对称算法的 public key 是公开的，所有人都可以获得到。而 private key 是私有的，只有 key pair 所有者拥有。评估如上流程：

* （✅ 解决）窃听，第三方没有接收方的 private key，通过窃听拿到 ciphertext，也无法获取到 plaintext；
* （❌ 未解决）冒充，第三方可以获取到接收方 public key，可以冒充发送者给接收者发送 ciphertext；
* （✅ 解决）篡改，第三方没有接收方的 private key，通过窃听拿到的 ciphertext，无法获取到 plaintext，也就无法篡改。

#### 非对称加密解决冒充问题

上文提到，任意一个第三方，都可以通过 public key 通过信道给接收方发送消息，接收方就需要一种机制识别发送者的身份，解决冒充问题。

此时，可以利用加密算法并配合 hash 算法实现一个数字签名算法，可实现对发送方身份的认证。

```
encrypt(hash(plaintext), private_key_a) =============== (plaintext, signature) ===============> hash(plaintext) == decrypt(signature, public_key_a) ?
        A(发送方)                                                信道                                      B(接收方)
```

* （❌ 未解决）窃听，未加密，第三发可以获取明文；
* （✅ 解决）冒充，第三方没有发送方的 private key，所以无法生成 signature，因此无法通过接收方的身份验证；
* （✅ 解决）篡改，第三方没有发送方的 private key，所以无法生成 signature，因此篡改了 plaintext，会导致 signature 失效，因此无法篡改。

#### 非对称加密实现安全通讯

结合上文的两个流程，即可利用非对称加密实现安全通讯。

```
encrypt(plaintext, public_key_b), encrypt(hash(plaintext), private_key_a) =============== (ciphertext, signature) ===============> plaintext = decrypt(ciphertext, private_key_b), hash(plaintext) == decrypt(signature, public_key_a) ?
        A(发送方)                                                                                 信道                                                 B(接收方)
```

评估如上流程

* （✅ 解决）窃听，第三方没有接收方的 private key，通过窃听拿到 ciphertext，也无法获取到 plaintext；
* （✅ 解决）冒充，第三方没有发送方的 private key，所以无法生成 signature，因此无法通过接收方的身份验证；
* （✅ 解决）篡改，第三方没有发送方的 private key，所以无法生成 signature；第三方没有接收方的 private key，通过窃听拿到的 ciphertext，无法获取到 plaintext，也就无法篡改。

## ssl/tls 协议

> 参考: [假如让你来设计SSL/TLS协议](https://bbs.huaweicloud.com/blogs/335979) | [浏览器如何验证HTTPS证书的合法性？](https://www.zhihu.com/question/37370216)

上文，[安全通讯 - 非对称加密实现安全通讯](#非对称加密实现安全通讯) 流程，存在两个问题：

* 性能问题。非对称加密算法的性能很差，无法满足大规模数据传输的要求。
* public key 分发问题。如果 public key 的分发是在建立连接时通过明文发送，那么一个第三方攻击者在通信信道上进行篡改，将 public key 篡改成攻击者的 public key，那么这个通讯链路对于攻击者来说就是非加密的（中间人攻击）。

### 性能问题

从上文的[对称加密实现安全通讯](#对称加密实现安全通讯) 可以看出，只要解决了 key 分发的问题，对称加密也是足够安全的。

因此，[非对称加密实现安全通讯](#非对称加密实现安全通讯) 仅用来传输对称加密的 key，即利用非对称加密来解决对称加密的 key 分发问题。

而对称加密的性能远好于非对称加密，这样，非对称加密实现安全通讯的性能问题就解决了，而安全性由对称加密保证。

### 公钥分发问题

为了解决公钥分发问题，需要一个通讯双方都信任的第三方来解决 public key 的信任问题，在 ssl/tls 协议中，这个第三方机构称为 CA。

ssl/tls 最常见的场景就是对 http 的支持，下文将以 http 为例，来讲解 ssl/tls 协议的如何解决公钥分发问题。

**服务端向申请 CA 证书**

服务端开发者注册一个域名如 `example.com`，并向 CA 机构申请一个 CA 证书，流程如下：

* 服务端准备好用于非对称加密的 key pair
* 服务端提供如下信息：
    * 域名，如 `www.example.com`
    * server 的 public key
* CA 机构
    * 通过某些机制，验证申请者是该域名的主人
    * 使用 CA 机构的 提供一个证书，这个这证书包含如下信息：
        * 证书所有者，即 `www.example.com`
        * 证书有效期
        * 颁发者即 CA 机构的名称
        * 服务端公钥
        * ...
        * 证书签名，由 CA 机构的 private key 生成

```
server_certificate = (domain, validity, issuer, public_key_server, ..., signature = (encrypt(hash(domain, validity, issuer, public_key_server, ...), private_key_ca)))
```

服务端获取到证书后，将证书和服务端的 private key 部署到服务器上，此时就可以对外提供服务。

**握手: 服务端将证书发送给客户端**

客户端（操作系统）内部会预设 CA 机构的 public key。

客户端请求该服务端时，服务端将证书发送给客户端，客户端接收到证书后，会使用 CA 机构的 public key 验证证书是否是伪造的：

```
server =================== server_certificate ===================> client: hash(domain, validity, issuer, public_key_server, ...) == decrypt(signature, public_key_ca) ?
```

**握手: 客户端随机生成对称加密的 key**

客户端随机生成对称加密的 key 并使用证书中服务端的 public key 对 key 进行加密，发送给服务端。此后双方通讯的数据均通过该对称加密的 key 进行传输。

```
client: encrypt(key, public_key_server) ==================== ciphertext ==================> server: decrypt(ciphertext, private_key_server)
```

### 其他说明

* 上文将介绍 ssl/tls 协议是如何解决如上问题的思路，真实的协议比上文描述的流程复杂一些。
* 上文介绍的是 ssl/tls 的单向认证，即 客户端对服务端的信任问题，实际上还有更严格的双向认证，参考：[HTTPS双向认证指南](https://www.jianshu.com/p/2b2d1f511959)。
* 上文描述的，客户端对服务端证书验证仅涉及单个证书，实际场景存在证书链的概念：[证书链-Digital Certificates](https://www.jianshu.com/p/46e48bc517d0)
