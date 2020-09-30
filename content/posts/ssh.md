---
title: "SSH"
date: 2020-09-27T11:07:15+08:00
draft: false
toc: true
comments: true
tags:
  - linux
---

## 一、简介

SSH 是位于 TCP 之上的，对 TCP 数据传进行用户认证、加密数据传输的网络传输协议。

基本原理是利用 密码学 非对称加密和对称加密进行数据加密（非对称加密用于对称加密的秘钥传出，对称加密用于加密传输数据）

SSH 在应用上使用十分广泛，最常见的场景为 远程主机登录，此外还有如下功能：

* sftp（用于替代htp）
* scp 跨主机数据拷贝
* 基于端口转发的安全传输和自定义应用

## 二、原理

> https://blog.csdn.net/lihang656/article/details/69467162

### 1、概览

SSH 主要分为如下几个阶段

* 连接协议
* 用户认证协议
* 传输协议

### 2、主机密钥机制

* 手动分发
* 密钥分发中心 （如 kerberos）

### 3、工作过程

* 连接协议：
    * 协商版本号
    * 密钥和算法协商阶段
        * 服务器 -> 客户机: 服务器公钥(server-public-key), 会话id(session-id) 该阶段为明文传输，需要人工校验公钥指纹是否是伪造的防止中间人攻击
        * 客户机 -> 服务器: 生成会话秘钥(session-key), 发送 server-public-key加密 => 会话res(session-res=session-id^session-key)
        * 服务器: 服务器私钥(server-private-key)解密获取session-res, session-key=session-id^session-res
        *
* 用户认证协议, 主要有两种：密码口令认证和公私钥认证
    * 密码口令
        * 客户机 -> 服务器: session-key 加密 账号、认证方法、口令，将结果发送给服务器
        * 服务器 -> 客户机: 校验，返回成功失败
    * 公私钥认证（客户端存在 client-private-key，服务端存在 client-public-key）
        * 客户机 -> 服务器: 根据 client-private-key 生成 client-public-key, 并用 session-key 加密 账号、认证方法、client-public-key 发送
        * 服务器 -> 客户机: 用 session-key 解密得到 client-public-key 和 自己存的 client-public-key 校验，生成随机字符串 question，加密为session-key(client-public-key(question))
        * 客户机 -> 服务器: 用 client-private-key 和 session-key 解密，加密为 session-key(question)，发送
        * 服务器 -> 客户机: session-key 解密，校验，检验是否成功

## 三、安装配置

### 1、安装

略、Linux、Mac 自带

### 2、Server 配置

* 全局配置文件 `/etc/ssh/sshd_config` （有个 `d`）
* 用户配置目录 `~/.ssh` 权限必须为 `700`
    * `~/.ssh/authorized_keys` 客户机认证用公钥列表，权限必须为 `600`

### 3、客户端配置

* 全局配置文件 `/etc/ssh/ssh_config` （没有 `d`）
* 用户配置目录 `~/.ssh` 权限必须为 `700`
    * `~/.ssh/config` 客户端配置
    * `~/.ssh/id_rsa` 权限必须为 `600`，默认私钥文件
    * `~/.ssh/known_hosts` 服务器公钥列表

## 四、应用

> https://www.ruanyifeng.com/blog/2011/12/ssh_remote_login.html

### 1、SSH 登录

#### 口令认证

（密码登录）：无需配置默认

#### 公私钥认证

（秘钥登录）

```bash
# 在客户机执行
cd ~/.ssh/                     # 若没有该目录，请先执行一次ssh localhost
ssh-keygen -t rsa              # 按提示输入自己邮箱
ssh-copy-id user@host          # 将公钥追加到到 server 的 ~/.ssh/authorized_keys 文件中
```

`/etc/ssh/sshd_config` 配置

```
RSAAuthentication yes
PubkeyAuthentication yes
```

重启 ssh 服务

```bash
systemctl restart ssh
```

#### 服务端重用配置

`/etc/ssh/sshd_config`

```
# 关闭 dns 反向查询
UseDNS no
```

#### 客户端配置别名

`~/.ssh/config` 或者 `/etc/ssh/ssh_config` 常见的配置方式

```
host host_alias # 别名
    HostName ip_or_domain  # host
    Username login_username # 登录用户名
    IdentityFile private_key_path # 默认为 ~/.ssh/id_rsa ，其他在此自定义
```

配置完成后，直接使用 `ssh host_alias` 即可登录

#### 客户端其他常用配置

```
Host *
# 防止断连
ServerAliveInterval 5
# 端口转发时使用
ExitOnForwardFailure yes
```

#### 客户端秘钥管理 ssh-agent

当需要管理多台机器时，可能存在多个私钥，且如果私钥存在密码时，在进行登录时将十分麻烦，因此 ssh-agent 将用来管理这些 私钥。

配置

```bash
# 停止
ssh-agent -k
# 启动
eval "$(ssh-agent -s)"
# 添加
ssh-add -K path
# 列出
ssh-add -l path
```

mac 配置 `~/.ssh/config`

```
Host *
    AddKeysToAgent yes
    UseKeychain yes
    IdentityFile ~/.ssh/is_rsa
```

开机自启： 配置到 `.bashrc`

### 2、SFTP

略

### 3、SCP

和 `cp` 命令类似，支持双向复制

```bash
scp 本地路径 username@host:远端路径  # 远端路径相对路径为用户家目录支持绝对路径
scp username@host:远端路径 本地路径  # 远端路径相对路径为用户家目录支持绝对路径
```

### 4、端口转发

https://www.cnblogs.com/keerya/p/7612715.html

```bash
ssh -L localport:remotehost:remoteport sshserver  # 将远程端口映射到本地
```
