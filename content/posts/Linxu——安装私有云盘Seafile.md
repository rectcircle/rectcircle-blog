---
title: Linxu——安装私有云盘Seafile
date: 2017-04-26T17:44:14+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/72
  - /detail/72/
tags:
  - linux
---

### 1、安装服务端

* 登录服务器
* 查看 https://www.seafile.com/download/ 获取下载链接
* `wget http://seafile-downloads.oss-cn-shanghai.aliyuncs.com/seafile-server_6.0.9_x86-64.tar.gz`
* 按照 https://manual-cn.seafile.com/deploy/using_mysql.html 步骤进行，即可。

### 2、安装各个版本客户端

参照https://www.seafile.com/download/

### 3、安装Linux命令行客户端

> 参照：https://copr.fedorainfracloud.org/coprs/pkerling/seafile/

```bash
wget -O /etc/yum.repos.d/copr-pkerling-seafile.repo https://copr.fedorainfracloud.org/coprs/pkerling/seafile/repo/epel-7/pkerling-seafile-epel-7.repo
yum install seafile
```

运行

```bash
seaf-cli -h
```

### 4、seaf-cli使用

> 参考 https://seacloud.cc/group/3/wiki/seafile-cli-manual

**初始化**

```bash
# choose a folder where to store the seafile client settings e.g ~/seafile-client
# 选择一个文件夹作为客户端的设置的储存位置
mkdir ~/seafile-client            # 创建一个设置文件夹
seaf-cli init -d ~/seafile-client  # 用这个文件夹初始化客户端
seaf-cli start # 启动客户端
```

**设置同步文件夹**

```bash
#seaf-cli sync -l <library-id资料库的id> -s <seahub-server-url远程服务器地址> -d <existing-folder本地文件夹> -u <username用户名> [-p <password密码>]
seaf-cli sync -l a42545f3-0ebf-450b-a924-b646032c27d8 -s http://127.0.0.1:8000 -d sharefile/ -u sunben960729@163.com -p 123456

# 说明：
# library-id：通过浏览器访问可以获取，在 http://file.rectcircle.cn:8000/#my-libs/lib/16588275-ce56-461a-a740-7ca9eabef5f6 的最后一串字符串
# seahub-server-url：你的服务器的地址，如果服务在本机，写127.0.0.1
# existing-folder：要同步的文件夹
# username：用户名
# password：密码
```

完成后，在其他设备更新该位置的文件，将同步到这个文件夹，这个文件夹的更改也会传到服务器上

**取消同步**

```bash
# seaf-cli desync -d <existing-folder>
seaf-cli desync -d sharefile/
# existing-folder：同步的文件夹
```

### 5、实现离线下载

* 安装`yum install rtorrent`
* 使用`rtorrent`或者`wget`下载文件，并`mv`到`seaf-cli`配置的同步文件夹
* 在本地操作系统安装seafile挂载盘客户端。即可打开

### 6、rtorrent操作指南

```bash
rtorrent
<Enter>
# 输入种子文件
上下键选中
< Ctrl + S > #开始下载
< Ctrl + d > #暂停
< Ctrl + d > #第二次取消
< Ctrl + q > #退出
```
