---
title: Linux——ssserver
date: 2016-11-20T23:04:27+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/26
  - /detail/26/
tags:
  - linux
---

> ss服务端安装教程（centos6.5）

### 1、打开xshell连接到服务器

### 2、pip install shadowsocks（安装python已安装）

若Python未安装执行

```bash
yum install python-setuptools && easy_install pip
```

### 3、vim /root/ss.json

```json
{
  "server":"0.0.0.0",
  "server_port":137,
  "local_port":1080,
  "password":"123456",
  "timeout":600,
  "method":"aes-256-cfb"
}
```

注意：psaaword是你的密码，其他不用改
按Esc  输入:wq回车

### 4、配置开机自启

vim /etc/rc.local
在最后一行添加
ssserver -c /root/ss.json -d start

### 5、启动服务

ssserver -c /root/ss.json -d start

### P.S

安装最新版server端

```bash
pip install https://github.com/shadowsocks/shadowsocks/archive/master.zip -U
```

协议选择：

https://github.com/shadowsocks/shadowsocks-windows/issues/1243#issuecomment-316714974