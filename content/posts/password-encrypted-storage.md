---
title: "用户凭证及密码等本地加密存储"
date: 2021-01-23T19:38:17+08:00
draft: false
toc: true
comments: true
tags:
  - 安全
---

非密码学专业，工程角度分析

## 简述

在某些场景需要某个进程，在本地存储或管理一些及其敏感的信息，比如

* 用户生物识别 信息（指纹、人脸、虹膜等）
* 用户身份凭证（比如：浏览器 Cookie），用户密码等（下文称第二类信息）

针对 用户生物识别 信息，一般需要设计专门的硬件设备进行本地化管理和存储，不在本文讨论范围

而对第二类信息的存储管理），需要专门的机制来保证安全性。注意本文仅讨论数据存储在本地的场景。

## 需求

针对第二类信息的存储和管理的一般需求如下：

* 在设备断电后，数据不能丢失
* 有专门的进程来管理这些信息（下文称为管理进程）
* 其他进程永远无法直接读取这些信息，只能请求管理进程获取这些信息，且需要用户明确授权

## 案例调研

### 1Password

> [官方关于安全的介绍](https://1password.com/zh-cn/security/)

可以得知，1Password 的本地数据是通过 主密码 通过 AES-256 算法，进行加密的。

### Google Chrome Cookie 存储

> 参考： [博客](http://www.meilongkui.com/archives/1904)

* 存储在 [用户数据目录](https://blog.csdn.net/qq_32239417/article/details/79499043) 的Cookies 文件，该文件为 一个 SQLite3。Cookie 指 存储在 encrypted_value 字段中
* encrypted_value 是经过 AES-256 算法加密过的密文，其加密 key 存储在
    * Windows，当前用户的ProtectedData中；
    * Linux，固定的密钥或钥匙链；
    * Mac，钥匙链；

### Google Chrome 密码存储

类似于 Cookie 存储

## 核心技术 AES-256

AES 是一个非常著名的 对称加密 算法，可以参考 [维基百科](https://zh.wikipedia.org/wiki/%E9%AB%98%E7%BA%A7%E5%8A%A0%E5%AF%86%E6%A0%87%E5%87%86)

关于 AES-256 可能受 [美国的加密技术出口管制](https://zh.wikipedia.org/wiki/%E7%BE%8E%E5%9C%8B%E7%9A%84%E5%8A%A0%E5%AF%86%E6%8A%80%E8%A1%93%E5%87%BA%E5%8F%A3%E7%AE%A1%E5%88%B6) 的 管制。最著名的例子就是 [JDK 中 JCE 中 AES-256 的使用](https://www.javainterviewpoint.com/java-aes-256-gcm-encryption-and-decryption/)

## 实现

同样，我们按照 如上 案例中的 思路实现 一个管理进程即可：

* 信息使用用户提供的密码使用 AES256 存储在本地文件中
* 第一次其他进程向该进程请求该信息，确认是否授权，若是，进程将提示用户输入密码，解密并返回

## 防止暴力破解

为了防止暴力破解，可以使用不直接用 用户密码 加解密，而是通过 `耗时hash(salt(用户密码))` 作为加解密的 key。

耗时hash，术语称 密码 hash，参见[知乎文章](https://zhuanlan.zhihu.com/p/113971205)
