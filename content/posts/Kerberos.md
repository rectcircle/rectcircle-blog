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
        * `client-master-key(SKDC-client)`
        * `client-TGT = KDC-master-key(SKDC-client + client-info)`
    * client:
        * 用户输入 `client-master-key` 解密获得 `SKDC-client`
        * 缓存 `SKDC-client`
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
        * `server-master-key(SKDC-client)`
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

## 应用

### KDC Server 安装 配置

参考

* http://www.out1kiss.me/?p=538
* https://www.thegeekstuff.com/2014/05/install-kerberos-server/
* https://www.doudianyun.com/2018/11/mit-kerberos-%E4%B8%8E-openssh-%E9%85%8D%E7%BD%AE/
* https://www.cnblogs.com/lsdb/p/11309245.html
* https://www.cnblogs.com/hit-zb/p/12534426.html#autoid-3-2-0

```bash
sudo apt-get install krb5-admin-server krb5-kdc
```

* krb5-admin-server: kdc管理员程序，可以让使用者远程管理kdc数据库
* krb5-kdc: kdc server主程序
* 配置文件在: /etc/krb5.conf

### 客户端/服务端配置

安装软件包

```bash
# debian
sudo apt install krb5-user
# centos
sudo yum install krb5-libs krb5-workstation
```

添加配置文件 `/etc/krb5.conf`

服务端需要生成 `/etc/krb5.keytab` 秘钥文件，并注册到服务中（该服务器的密码）

```bash
# idc server 执行
kadmin
addprinc -randkey host/HOST_OR_IP@EXAMPLE.COM
ktadd -k HOST_OR_IP.keytab host/HOST_OR_IP@EXAMPLE.COM
# scp 到 ssh server 的 /etc/krb5.keytab
```

### SSH 登录

> https://www.cnblogs.com/lsdb/p/11309245.html

#### 服务端

配置 `/etc/ssh/sshd_config`

```
GSSAPIAuthentication yes
GSSAPIKeyExchange yes
GSSAPICleanupCredentials yes
UsePAM yes
```

重启

```bash
sudo systemctl restart sshd
```

#### 客户端

`~/.ssh/config` 或 `/etc/ssh/ssh_config` 配置开启

```
Host *
    StrictHostKeyChecking no
    GSSAPIAuthentication yes
    GSSAPIDelegateCredentials yes
```

登录前使用 kinit

#### 客户端免密登录

生成 用户的 秘钥文件

```bash
ktutil
add_entry -password -p USERNAME@EXAMPLE.COM -k 1 -e aes256-cts
# 输入密码
write_kt USERNAME.keytab
```

使用秘钥进行 kinit（可以配置到crontab中）

```bash
kinit -r 24:00 USERNAME@EXAMPLE.COM -k -t USERNAME.keytab
```

### Hadoop生态

略
