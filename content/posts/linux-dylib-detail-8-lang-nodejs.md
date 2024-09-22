---
title: "Linux 动态链接库详解（八） Node.js 语言"
date: 2024-09-23T00:33:00+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 安装

> v20.17.0

```bash
# 安装 Linux x64 官方版本
mkdir -p ~/.local/share/nodejs
cd ~/.local/share/nodejs
wget https://nodejs.org/dist/v20.17.0/node-v20.17.0-linux-x64.tar.xz -O node-v20.17.0-linux-x64.tar.xz
tar -xf node-v20.17.0-linux-x64.tar.xz
rm -rf node-v20.17.0-linux-x64.tar.xz
# 安装非官方版本 Linux x64 glibc 2.17
wget https://unofficial-builds.nodejs.org/download/release/v20.17.0/node-v20.17.0-linux-x64-glibc-217.tar.xz -O node-v20.17.0-linux-x64-glibc-217.tar.xz
tar -xf node-v20.17.0-linux-x64-glibc-217.tar.xz
rm -rf node-v20.17.0-linux-x64-glibc-217.tar.xz
# 安装非官方构建版本 Linux x64 musl
wget https://unofficial-builds.nodejs.org/download/release/v20.17.0/node-v20.17.0-linux-x64-musl.tar.xz -O node-v20.17.0-linux-x64-musl.tar.xz
tar -xf node-v20.17.0-linux-x64-musl.tar.xz
rm -rf node-v20.17.0-linux-x64-musl.tar.xz
```

## node 命令

验证脚本：

```bash
#!/usr/bin/env bash

echo '=== 查看 node Linux x64 情况'
echo '--- 执行 node -v'
~/.local/share/nodejs/node-v20.17.0-linux-x64/bin/node -v
echo '--- lld 查看 node'
ldd ~/.local/share/nodejs/node-v20.17.0-linux-x64/bin/node
echo '--- readelf 查看 node 动态库'
readelf -d ~/.local/share/nodejs/node-v20.17.0-linux-x64/bin/node | grep so
echo '--- readelf 查看 node version'
readelf --version-info ~/.local/share/nodejs/node-v20.17.0-linux-x64/bin/node | grep -A 10000 '.gnu.version_r'
echo


echo '=== 查看 node Linux glibc 2.17 情况'
echo '--- 执行 node -v'
~/.local/share/nodejs/node-v20.17.0-linux-x64-glibc-217/bin/node -v
echo '--- lld 查看 node'
ldd ~/.local/share/nodejs/node-v20.17.0-linux-x64-glibc-217/bin/node
echo '--- readelf 查看 node 动态库'
readelf -d ~/.local/share/nodejs/node-v20.17.0-linux-x64-glibc-217/bin/node | grep so
echo '--- readelf 查看 node version'
readelf --version-info ~/.local/share/nodejs/node-v20.17.0-linux-x64-glibc-217/bin/node | grep -A 10000 '.gnu.version_r'
echo


echo '=== 查看 node Linux musl 情况'
echo '--- 执行 node -v'
~/.local/share/nodejs/node-v20.17.0-linux-x64-musl/bin/node -v
echo '--- lld 查看 node'
ldd ~/.local/share/nodejs/node-v20.17.0-linux-x64-musl/bin/node
echo '--- readelf 查看 node 动态库'
readelf -d ~/.local/share/nodejs/node-v20.17.0-linux-x64-musl/bin/node | grep so
echo '--- readelf 查看 node version'
readelf --version-info ~/.local/share/nodejs/node-v20.17.0-linux-x64-musl/bin/node | grep -A 10000 '.gnu.version_r'
echo
```

输出如下：

```
=== 查看 node Linux x64 情况
--- 执行 node -v
v20.17.0
--- lld 查看 node
        linux-vdso.so.1 (0x00007ffe88d7a000)
        libdl.so.2 => /lib/x86_64-linux-gnu/libdl.so.2 (0x00007f0d08070000)
        libstdc++.so.6 => /lib/x86_64-linux-gnu/libstdc++.so.6 (0x00007f0d07e00000)
        libm.so.6 => /lib/x86_64-linux-gnu/libm.so.6 (0x00007f0d07d21000)
        libgcc_s.so.1 => /lib/x86_64-linux-gnu/libgcc_s.so.1 (0x00007f0d08050000)
        libpthread.so.0 => /lib/x86_64-linux-gnu/libpthread.so.0 (0x00007f0d0804b000)
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f0d07b40000)
        /lib64/ld-linux-x86-64.so.2 (0x00007f0d0807d000)
--- readelf 查看 node 动态库
 0x0000000000000001 (NEEDED)             共享库：[libdl.so.2]
 0x0000000000000001 (NEEDED)             共享库：[libstdc++.so.6]
 0x0000000000000001 (NEEDED)             共享库：[libm.so.6]
 0x0000000000000001 (NEEDED)             共享库：[libgcc_s.so.1]
 0x0000000000000001 (NEEDED)             共享库：[libpthread.so.0]
 0x0000000000000001 (NEEDED)             共享库：[libc.so.6]
 0x0000000000000001 (NEEDED)             共享库：[ld-linux-x86-64.so.2]
--- readelf 查看 node version
Version needs section '.gnu.version_r' contains 7 entries:
 Addr: 0x0000000000b78048  Offset: 0x00778048  Link: 6 (.dynstr)
  000000: Version: 1  文件：ld-linux-x86-64.so.2  计数：1
  0x0010:   Name: GLIBC_2.2.5  标志：无  版本：38
  0x0020: Version: 1  文件：libgcc_s.so.1  计数：2
  0x0030:   Name: GCC_3.4  标志：无  版本：35
  0x0040:   Name: GCC_3.0  标志：无  版本：26
  0x0050: Version: 1  文件：libdl.so.2  计数：1
  0x0060:   Name: GLIBC_2.2.5  标志：无  版本：7
  0x0070: Version: 1  文件：libm.so.6  计数：2
  0x0080:   Name: GLIBC_2.27  标志：无  版本：28
  0x0090:   Name: GLIBC_2.2.5  标志：无  版本：6
  0x00a0: Version: 1  文件：libstdc++.so.6  计数：12
  0x00b0:   Name: GLIBCXX_3.4.14  标志：无  版本：29
  0x00c0:   Name: GLIBCXX_3.4.18  标志：无  版本：27
  0x00d0:   Name: CXXABI_1.3.5  标志：无  版本：25
  0x00e0:   Name: GLIBCXX_3.4.9  标志：无  版本：24
  0x00f0:   Name: CXXABI_1.3  标志：无  版本：23
  0x0100:   Name: CXXABI_1.3.7  标志：无  版本：20
  0x0110:   Name: GLIBCXX_3.4.15  标志：无  版本：19
  0x0120:   Name: GLIBCXX_3.4.20  标志：无  版本：13
  0x0130:   Name: CXXABI_1.3.9  标志：无  版本：11
  0x0140:   Name: GLIBCXX_3.4.11  标志：无  版本：10
  0x0150:   Name: GLIBCXX_3.4  标志：无  版本：8
  0x0160:   Name: GLIBCXX_3.4.21  标志：无  版本：4
  0x0170: Version: 1  文件：libpthread.so.0  计数：4
  0x0180:   Name: GLIBC_2.3.3  标志：无  版本：36
  0x0190:   Name: GLIBC_2.3.4  标志：无  版本：32
  0x01a0:   Name: GLIBC_2.3.2  标志：无  版本：21
  0x01b0:   Name: GLIBC_2.2.5  标志：无  版本：3
  0x01c0: Version: 1  文件：libc.so.6  计数：15
  0x01d0:   Name: GLIBC_2.12  标志：无  版本：37
  0x01e0:   Name: GLIBC_2.16  标志：无  版本：34
  0x01f0:   Name: GLIBC_2.9  标志：无  版本：33
  0x0200:   Name: GLIBC_2.6  标志：无  版本：31
  0x0210:   Name: GLIBC_2.14  标志：无  版本：30
  0x0220:   Name: GLIBC_2.17  标志：无  版本：22
  0x0230:   Name: GLIBC_2.3.4  标志：无  版本：18
  0x0240:   Name: GLIBC_2.3  标志：无  版本：17
  0x0250:   Name: GLIBC_2.10  标志：无  版本：16
  0x0260:   Name: GLIBC_2.28  标志：无  版本：15
  0x0270:   Name: GLIBC_2.4  标志：无  版本：14
  0x0280:   Name: GLIBC_2.3.2  标志：无  版本：12
  0x0290:   Name: GLIBC_2.7  标志：无  版本：9
  0x02a0:   Name: GLIBC_2.25  标志：无  版本：5
  0x02b0:   Name: GLIBC_2.2.5  标志：无  版本：2

=== 查看 node Linux glibc 2.17 情况
--- 执行 node -v
v20.17.0
--- lld 查看 node
        linux-vdso.so.1 (0x00007ffebbbfc000)
        libdl.so.2 => /lib/x86_64-linux-gnu/libdl.so.2 (0x00007f8e74b64000)
        libstdc++.so.6 => /lib/x86_64-linux-gnu/libstdc++.so.6 (0x00007f8e74800000)
        libm.so.6 => /lib/x86_64-linux-gnu/libm.so.6 (0x00007f8e74a85000)
        libgcc_s.so.1 => /lib/x86_64-linux-gnu/libgcc_s.so.1 (0x00007f8e74a65000)
        libpthread.so.0 => /lib/x86_64-linux-gnu/libpthread.so.0 (0x00007f8e74a60000)
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f8e7461f000)
        /lib64/ld-linux-x86-64.so.2 (0x00007f8e74b71000)
--- readelf 查看 node 动态库
 0x0000000000000001 (NEEDED)             共享库：[libdl.so.2]
 0x0000000000000001 (NEEDED)             共享库：[libstdc++.so.6]
 0x0000000000000001 (NEEDED)             共享库：[libm.so.6]
 0x0000000000000001 (NEEDED)             共享库：[libgcc_s.so.1]
 0x0000000000000001 (NEEDED)             共享库：[libpthread.so.0]
 0x0000000000000001 (NEEDED)             共享库：[libc.so.6]
 0x0000000000000001 (NEEDED)             共享库：[ld-linux-x86-64.so.2]
--- readelf 查看 node version
Version needs section '.gnu.version_r' contains 7 entries:
 Addr: 0x0000000000ba44c0  Offset: 0x007a44c0  Link: 6 (.dynstr)
  000000: Version: 1  文件：ld-linux-x86-64.so.2  计数：1
  0x0010:   Name: GLIBC_2.2.5  标志：无  版本：31
  0x0020: Version: 1  文件：libgcc_s.so.1  计数：2
  0x0030:   Name: GCC_3.4  标志：无  版本：27
  0x0040:   Name: GCC_3.0  标志：无  版本：26
  0x0050: Version: 1  文件：libm.so.6  计数：1
  0x0060:   Name: GLIBC_2.2.5  标志：无  版本：11
  0x0070: Version: 1  文件：libpthread.so.0  计数：4
  0x0080:   Name: GLIBC_2.3.3  标志：无  版本：28
  0x0090:   Name: GLIBC_2.3.4  标志：无  版本：20
  0x00a0:   Name: GLIBC_2.3.2  标志：无  版本：19
  0x00b0:   Name: GLIBC_2.2.5  标志：无  版本：9
  0x00c0: Version: 1  文件：libc.so.6  计数：13
  0x00d0:   Name: GLIBC_2.12  标志：无  版本：30
  0x00e0:   Name: GLIBC_2.16  标志：无  版本：25
  0x00f0:   Name: GLIBC_2.9  标志：无  版本：24
  0x0100:   Name: GLIBC_2.17  标志：无  版本：22
  0x0110:   Name: GLIBC_2.6  标志：无  版本：17
  0x0120:   Name: GLIBC_2.3.4  标志：无  版本：16
  0x0130:   Name: GLIBC_2.3  标志：无  版本：15
  0x0140:   Name: GLIBC_2.4  标志：无  版本：14
  0x0150:   Name: GLIBC_2.10  标志：无  版本：12
  0x0160:   Name: GLIBC_2.7  标志：无  版本：10
  0x0170:   Name: GLIBC_2.14  标志：无  版本：7
  0x0180:   Name: GLIBC_2.3.2  标志：无  版本：5
  0x0190:   Name: GLIBC_2.2.5  标志：无  版本：4
  0x01a0: Version: 1  文件：libdl.so.2  计数：1
  0x01b0:   Name: GLIBC_2.2.5  标志：无  版本：3
  0x01c0: Version: 1  文件：libstdc++.so.6  计数：9
  0x01d0:   Name: GLIBCXX_3.4.14  标志：无  版本：32
  0x01e0:   Name: GLIBCXX_3.4.18  标志：无  版本：29
  0x01f0:   Name: CXXABI_1.3.5  标志：无  版本：23
  0x0200:   Name: CXXABI_1.3.7  标志：无  版本：21
  0x0210:   Name: GLIBCXX_3.4.15  标志：无  版本：18
  0x0220:   Name: GLIBCXX_3.4.9  标志：无  版本：13
  0x0230:   Name: GLIBCXX_3.4.11  标志：无  版本：8
  0x0240:   Name: CXXABI_1.3  标志：无  版本：6
  0x0250:   Name: GLIBCXX_3.4  标志：无  版本：2

=== 查看 node Linux musl 情况
--- 执行 node -v
04-lang/04-nodejs/02-node-command.sh: 行 25: /home/rectcircle/.local/share/nodejs/node-v20.17.0-linux-x64-musl/bin/node: 无法执行：找不到需要的文
件
--- lld 查看 node
        linux-vdso.so.1 (0x00007ffe39ff2000)
        libstdc++.so.6 => /lib/x86_64-linux-gnu/libstdc++.so.6 (0x00007ffb2e800000)
        libgcc_s.so.1 => /lib/x86_64-linux-gnu/libgcc_s.so.1 (0x00007ffb34151000)
        libc.musl-x86_64.so.1 => not found
        libm.so.6 => /lib/x86_64-linux-gnu/libm.so.6 (0x00007ffb34072000)
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007ffb2ea1f000)
        /lib/ld-musl-x86_64.so.1 => /lib64/ld-linux-x86-64.so.2 (0x00007ffb34179000)
--- readelf 查看 node 动态库
 0x0000000000000001 (NEEDED)             共享库：[libstdc++.so.6]
 0x0000000000000001 (NEEDED)             共享库：[libgcc_s.so.1]
 0x0000000000000001 (NEEDED)             共享库：[libc.musl-x86_64.so.1]
--- readelf 查看 node version
Version needs section '.gnu.version_r' contains 1 entry:
 Addr: 0x00000000007787c8  Offset: 0x007787c8  Link: 5 (.dynstr)
  000000: Version: 1  文件：libgcc_s.so.1  计数：2
  0x0010:   Name: GCC_3.4  标志：无  版本：3
  0x0020:   Name: GCC_3.0  标志：无  版本：2
```

node 命令动态库依赖情况如下：

* node Linux x64 官方版：
    * 依赖 glibc 2.28 及以上版本 （libm.so.6、libpthread.so.0、libc.so.6、libdl.so.2）。
    * 依赖 gcc 3.4 及以上版本 （libgcc_s.so.1）。
    * 依赖 GLIBCXX_3.4.21、CXXABI_1.3.9（libstdc++.so.6）
    * 更多详见 [nodejs/node - BUILDING.md](https://github.com/nodejs/node/blob/v20.17.0/BUILDING.md)

* node Linux x64 glibc 2.17 版：
    * 依赖 glibc 2.17 及以上版本 （libm.so.6、libpthread.so.0、libc.so.6、libdl.so.2）。
    * 依赖 gcc 3.4 及以上版本 （libgcc_s.so.1）。
    * 依赖 GLIBCXX_3.4.18、CXXABI_1.3.7（libstdc++.so.6）
    * 详见 [Node.js 非官方构建](https://github.com/nodejs/unofficial-builds/)

* node Linux x64 musl 版：
    * 依赖 （libc.musl-x86_64.so.1）。
    * 依赖 gcc 3.4 及以上版本 （libgcc_s.so.1）。
    * 依赖 （libstdc++.so.6）。
    * lld 查看包含的 libc.so.6、 libm.so.6 是因为 libgcc_s.so.1、 libstdc++.so.6 时 gnu 版本间接引入的，在使用 musl 作为 libc 的环境中，不会如此。
    * 详见 [Node.js 非官方构建](https://github.com/nodejs/unofficial-builds/)

## 参考

* [Node.js 官方下载页面](https://nodejs.org/zh-cn/download/package-manager)
* [nodejs/node - BUILDING.md](https://github.com/nodejs/node/blob/v20.17.0/BUILDING.md)
* [Node.js 非官方构建](https://github.com/nodejs/unofficial-builds/)
