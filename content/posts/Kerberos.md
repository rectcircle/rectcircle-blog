---
title: "Kerberos"
date: 2019-05-11T16:44:36+08:00
draft: false
toc: true
comments: true
tags:
  - 安全
---

> 参考 https://blog.csdn.net/wulantian/article/details/42418231
> https://www.jianshu.com/p/fc2d2dbd510b

## 介绍

Kerberos是一种计算机网络授权协议，核心原则是避免密码或者密码加密的文本在网络上传输。适用于适用于client/server模型，支持双向认证。

## 原理

### 核心原则

* 尽量不在互联网上传输密码，或者被密码加密的文本（在以下描述为 `master-key` 或 `Long-term Key` ）
* 使用有效期很短的密码（在以下描述为 `session-key` 或 `Short-term Key` ）进行认证

### 三个角色

* Client 资源请求者，可以理解为普通用户
* Server 资源拥有者，可以理解为用户需要操作的资源
* KDC （Kerberos Distribution Center） 密钥分发中心，存储了 Client 和 Server 的 `master-key` Kerberos的核心，在下文中表示为
  * `server-master-key`
  * `client-master-key`
  * `KDC-master-key` KDC自身的`master-key`

### 相关术语及表示法

* `key` 密码或秘钥
* `master-key` 长期不变的密码（秘钥），比如用户密码
* `session-key` 存在有效期的秘钥，用于认证使用
* `SKDC-Client` 用于KDC和Client间的 `session-key`
* `SKDC-Server` 用于KDC和Server间的 `session-key`
* `ticket` 票据，本质上是使用 `key` 进行加密过的 信息，
* `xx_key(info)` 使用 `xxx_key` 对 `info` 进行加密
* `TGT` Ticket Granting Ticket 表示 Ticket的认购权证，用于代替client或者server的 `master-key`

### User2User Sub-Protocol参与后的协议流程

```
    Server --------------------
    |    |                     \
    |    |                      \
    |    |                       \
    |    |                        \
   (2)  (4)                       (2-1)
    |    |                           \
    |    |                            \
    |    |                             \
    |    |                              \
    Client -----------(1)--------------- KDC
      \                                   /
       ---------------(3)----------------
```

* (1) As Exchange
	* client -> KDC: 请求 `client-TGT`
	* KDC: 不进行任何验证，直接返回数据，也不做缓存，发完即丢
	* KDC -> client:
		* `client-master-key(SKDC-clinet)`
		* `client-TGT = KDC-master-key(SKDC-client + client-info)`
	* client:
		* 用户输入 `client-master-key` 解密获得 `SKDC-clinet`
		* 缓存 `SKDC-clinet`
		* 缓存 `client-TGT`
* (2) 请求 Server 获取 `server-TGT`
	* client -> server: 请求 `server-TGT`
	* server: 查看缓存是否存在，不存在执行 (2-1)，然后返回，不做任何验证
	* server -> client:
		* `server-TGT = KDC-master-key(SKDC-server + server-info)`
	* client:
		* 缓存 `server-TGT`
* (2-1)
	* server -> KDC: 请求 `server-TGT`
	* KDC: 不进行任何验证，直接返回数据，也不做缓存，发完即丢
	* KDC -> client:
		* `server-master-key(SKDC-clinet)`
		* `server-TGT = KDC-master-key(SKDC-server + server-info)`
	* server:
		* 用户输入 `client-master-key` 解密获得 `SKDC-server`
		* 缓存 `SKDC-server`
		* 缓存 `server-TGT`
* (3) TGS Exchange
	* client -> KDC: 请求 `Ticket`
		* `client-TGT = KDC-master-key(SKDC-client + client-info)`
		* `server-TGT = KDC-master-key(SKDC-server + server-info)`
		* `SKDC-client(client-info)`
	* KDC: 进行验证（验证逻辑如下），验证通过返回数据，发完即丢
		* 使用 `KDC-master-key` 解密 `client-TGT` 获得 `SKDC-client` 和 `client-info`
		* 使用 `SKDC-client` 解密 `SKDC-client(client-info)` 再次获得 `client-info`
		* 如果过前两步获取的 `client-info` 一致则验证通过
		* 使用 `KDC-master-key` 解密 `server-TGT` 获得 `SKDC-server`
		* 使用 `SKDC-server` 加密`session-key`
	* KDC -> client:
		* `SKDC-client(session-key)`
		* `Ticket = SKDC-server(session-key + client-info)`
	* client:
		* 使用第(1)步缓存的 `SKDC-client` 解密获取 `session-key`
		* 缓存 `session-key`
		* 缓存 `Ticket`
* (4) C/S Exchange
	* client -> Server: 请求真正的资源
		* `session-key(client-info + timestamp)`
		* `Ticket = SKDC-server(session-key + client-info)`
	* Server: 进行验证（验证逻辑如下），验证通过返回数据，发完即丢
		* 使用第(2-1)步缓存的 `SKDC-server` 解密 `Ticket` 获取 `session-key` 和 `client-info`
		* 使用 `session-key` 解密 `session-key(client-info + timestamp)` 获得 `client-info` 和 `timestamp`
		* 验证时间戳是否过期
		* 验证两个 `client-info` 是否一致
		* 验证通过执行用户请求
	* KDC -> client: (如果开启双向验证)
		* `session-key(timestamp)`
	* client: (如果开启双向验证)
		* 使用第(3)步 缓存的 `session-key` 解密 `session-key(timestamp)` 验证服务端