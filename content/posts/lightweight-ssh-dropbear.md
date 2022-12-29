---
title: "轻量级 SSH 开源项目 Dropbear"
date: 2022-12-28T14:12:50+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 简介

[Dropbear](https://matt.ucc.asn.au/dropbear/dropbear.html) 是一个轻量级以 [MIT 许可证](https://github.com/mkj/dropbear)开源的 SSH2 ([rfc4253](https://www.rfc-editor.org/rfc/rfc4253)) 项目。具有如下特点：

* 小的内存和磁盘占用，在 x86 平台，使用 uClibc 的静态编译最小产物约 110kb。
* Dropbear ssh server 支持 openssh client 的 X11 forwarding， authentication-agent forwarding。
* Dropbear ssh server 兼容 OpenSSH 的 `~/.ssh/authorized_keys` 公钥认证。
* 服务器、客户端、密钥生成器和密钥转换器可以编译成单个二进制文件（如 busybox）。
* 编译时可以根据需求开启和关闭某些功能（[默认宏](https://github.com/mkj/dropbear/blob/master/default_options.h)，通过添加 `localoptions.h` 或者 `CFLAGS=-DXXX=xxx` 修改配置），以裁剪产物大小。
* ssh client 支持使用 SSH TCP forward，用单条命令，通过多个 SSH 主机建立隧道，实现多跳模式。如 `dbclient user1@hop1,user2@hop2,destination`。

支持静态编译。可以编译成如下可执行文件（当然类似 busybox，可以编译成 all-in-one 单独的可执行文件）：

* dropbear (ssh server)，参见：[手册](https://linux.die.net/man/8/dropbear)
* dbclient (ssh client)，参见：[手册](https://linux.die.net/man/1/dbclient)。
* dropbearkey 给 dropbear 创建 dropbear 格式的私钥，参见：[手册](https://linux.die.net/man/8/dropbearkey)
* dropbearconvert 将私钥格式在 dropbear 与 openssh 之间互相转换，参见：[手册](https://manpages.debian.org/testing/dropbear-bin/dropbearconvert.1.en.html)
* scp 基于 ssh 协议的文件拷贝。

相关文档如下：

* [项目主页](https://matt.ucc.asn.au/dropbear/dropbear.html)
* [项目代码和 README](https://github.com/mkj/dropbear)
* [编译安装文档](https://github.com/mkj/dropbear/blob/master/INSTALL)
* [all-in-one 编译文档](https://github.com/mkj/dropbear/blob/master/MULTI)
* [裁剪和尺寸优化文档](https://github.com/mkj/dropbear/blob/master/SMALL)
* [特性宏默认配置源代码](https://github.com/mkj/dropbear/blob/master/default_options.h)

注意：

* 本文将重点介绍 dropbear ssh server，编译安装，容器运行，以及如何对 dropbear 进行定制开发，以实现自定义鉴权的支持。
* 本文使用标准的 OpenSSH SSH Client 进行测试，以验证 dropbear ssh server 的兼容性。
* 本文测试的 dropbear 版本为 [`DROPBEAR_2022.83`](https://github.com/mkj/dropbear/blob/DROPBEAR_2022.83/INSTALL)。

## 编译安装

```bash
# 版本
export DROPBEAR_VERSION="DROPBEAR_2022.83"
export ZLIB_VERSION="1.2.13"

# 使用 musl-libc 编译
sudo apt update && sudo apt install -y musl-tools

# 下载编译 zlib 为静态链接库
wget https://zlib.net/zlib-$ZLIB_VERSION.tar.gz
tar -xzvf zlib-$ZLIB_VERSION.tar.gz
rm -rf zlib-$ZLIB_VERSION.tar.gz
cd zlib-$ZLIB_VERSION
./configure --help
CC=musl-gcc ./configure --static --prefix=`pwd`-built
make && make install 
# DESTDIR=`pwd`-built
cd ..

# 下载并编译 dropbear
git clone https://github.com/mkj/dropbear.git
cd dropbear
git checkout $DROPBEAR_VERSION
./configure \
    --enable-static \
    --with-zlib="../zlib-$ZLIB_VERSION-built" \
    CC="musl-gcc"
    # CFLAGS="-Wl,-static" \
    # LDFLAGS="-static"
make PROGRAMS="dropbear" && make PROGRAMS="dropbear" DESTDIR=`pwd`-built install
cd ../
```

执行 `tree dropbear-built` 检查编译产物，如下所示：

```
dropbear-built
└── usr
    └── local
        ├── sbin
        │   └── dropbear
        └── share
            └── man
                └── man8
                    └── dropbear.8

6 directories, 2 files
```

注意：

* `ls -alh dropbear-built/usr/local/sbin/dropbear` 可以发现 dropbear 空间占用极小，只有 491K 左右。
* `ldd dropbear-built/usr/local/sbin/dropbear` 可以看出如上方式是静态编译，在任意相同 CPU 架构的 Linux 平台均可以运行。

## 运行

在虚拟机运行 ssh server。

```bash
sudo mkdir -p /etc/dropbear
sudo ./dropbear-built/usr/local/sbin/dropbear -E -F -R -p 2222 
```

在其他机器使用 openssh client 进行连接。

```bash
ssh rectcircle@192.168.57.3 -p 2222
```

可以发现可以正常进入。

下面，通过 docker 使用 busybox 镜像启动，并登录。

```bash
docker run -it -v $(pwd)/dropbear-built/usr/local/sbin/dropbear:/sbin/dropbear -p 2222:2222 busybox:latest sh
mkdir /etc/dropbear
/sbin/dropbear -E -F -R -p 2222
```

在宿主机，通过 openssh client 进行连接。

```bash
ssh -p 2222 root@localhost
```

发现可以进入容器中，验证了上述静态编译的效果。

## 问题

在测试过程中发现如下问题：

* 目前 debian 11 已经将[默认密码散列算法](https://fedoraproject.org/wiki/Changes/yescrypt_as_default_hashing_method_for_shadow)修改成 [`yescrypt`](https://manpages.debian.org/unstable/libcrypt-dev/crypt.5.en.html#yescrypt)。而 [musl 加密算法](https://git.musl-libc.org/cgit/musl/tree/src/crypt/crypt_r.c)不支持该算法，因此上面使用 musl 编译的 dropbear，密码登录在 debian 中失败。解决办法就是使用 `chpasswd` 来配置密码，例如 `echo 'root:123456' | chpasswd -c SHA256`

## 实现自定义鉴权

从上述可以看出 dropbear 异常轻量级，且可以在同一 CPU 架构的任意 Linux 镜像环境中运行。因此 dropbear 可以作为通用能力注入到任意的 Linux 环境中，而不需要考虑不同 Linux 发行版兼容性问题。

在如上的场景，当多个用户对多个 Linux 环境拥有不同的访问权限时，如果使用密码或者公私钥的方式来进行鉴权存在很大不便和安全性问题。因此，需要一种中心化的方案，可以灵活的配置用户对 Linux 环境的权限。

可选的方案有如下几种：

* Kerberos (GSSAPI)，业界成熟的解决方案。缺点是历史悠久，机制比较复杂，缺乏中文资料，学习成本比较高，定制成本高。（dropbear 似乎不支持）
* 基于 `PasswordAuthentication` 验证方式进行定制。有两种实现方式：
    * 基于 LinuxPAM 实现，灵活性高。（dropbear 支持，但是如果启用该特性，则很难进程静态编译，没有走通）。
    * 直接修改源码中 Password 的部分，灵活性高。（dropbear 对应的源代码文件为 [`svr-authpasswd.c`](https://github.com/mkj/dropbear/blob/master/svr-authpasswd.c)，下文探索的方式）。

因此，如果想在 SSH Server 实现高度可定制的鉴权，且不破坏 SSH 协议标准，推荐的方案是使用 dropbear 作为 ssh server，通过修改 [`svr-authpasswd.c`](https://github.com/mkj/dropbear/blob/master/svr-authpasswd.c) 来进行自定义鉴权。流程大概如下：

1. 用户在鉴权中心页面，创建一个 Token。
2. 用户调用 ssh 命令连接到 dropbear ssh server，在提示输入密码时，填写 Token。
3. dropbear ssh server 在进行密码校验时，会调用修改过的 [`svr-authpasswd.c`](https://github.com/mkj/dropbear/blob/master/svr-authpasswd.c) 代码，该代码会调用一个外部命令，并将用户登录的操作系统用户，密码（Token）作为参数，传递给这个外部命令，如果该命令退出码为 0，则认为认证成功，否则认为认证失败。
4. 这个外部命令调用鉴权中心 API，参数为：Linux 环境标识（如主机名），登录的操作系统用户，密码（Token），返回：是否有权限。如果有权限，则 `exit 0`，否则 `exit 1`。

注意：

* 上述第 1 步的 Token 的生成只是个简单示例。可以通过一个 CLI 唤起一个网页与通过网页进行鉴权和 Token 生成，实现更好用户体验。
* 上述第 2 步是个手动操作示例。有两种方式可以实现 Token 输入自动化：
    * 通过一个类似 sshpass 的 CLI 包装 ssh 命令实现注入 Token。
    * 通过一个 CLI，这个 CLI 会配置到用户配置 `~/.ssh/config` 的 `ProxyCommand` 中，这 CLI 会作为中间人拦截认证过程。

下面，通过修改 [`svr-authpasswd.c`](https://github.com/mkj/dropbear/blob/master/svr-authpasswd.c) 源码，添加一些日志，来探索如何实现上述第 3 步。

修改 `svr-authpasswd.c` （[github commit](https://github.com/rectcircle/dropbear/commit/3533a7974765611c3212c64f1a6f84f73f774b25)）

```c
// 33 行
#include <stdio.h>

// 73 行
printf("user=%s uid=%u passwd=%s passwdcrypt=%s testcrypt=%s\n", ses.authstate.pw_name, ses.authstate.pw_uid, password, passwdcrypt, testcrypt);
```

重新编译运行后，使用 `ssh root@localhost -p 2222` 并输入密码 `123456`，可以看到 dropbear 打印如下日志。

```
user=root uid=0 passwd=123456 passwdcrypt=$5$KDM.1/A3kjHyuqm$.1la1CUeFr/aLLF2FOJTADfsE11PcegBbQl9v9DU6GA testcrypt=$5$KDM.1/A3kjHyuqm$.1la1CUeFr/aLLF2FOJTADfsE11PcegBbQl9v9DU6GA
```

因此，如果想实现自定义密码校验，只需在 [`svr-authpasswd.c` 的 126 行](https://github.com/mkj/dropbear/blob/DROPBEAR_2022.83/svr-authpasswd.c#L126)，fork 一个子进程将上述测试的变量通过环境变量传递过去，根据子进程的退出码决定是否发送成功消息 `send_msg_userauth_success()`。
