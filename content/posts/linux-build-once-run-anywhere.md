---
title: "Linux 软件构建一次到处运行"
date: 2023-12-17T23:47:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 简述

在 Linux 平台，使用包管理工具（如 apt、yum）来安装软件时，我们想要的软件包的版本在包管理工具里面找不到的问题。

比如：在遗留的 Debian8 操作系统中，只能安装 python3.4；node18 只能安装在 Debian10 及以上版本的操作系统上。

出现该情况最主要的原因是， Linux 平台的软件更新的版本，对动态链接库（特别是 glibc）的最低版本不断提高。而超过了维护周期的 Linux 发行版（如 Debian8），其动态链接库将得不到不到升级，从而导致较新版本的 Linux 软件无法再遗留的 Linux 发行版中运行（当然内核版本是另一个重要原因，本文重点关注 glibc 问题，关于内核版本不多讨论）。

为了解决这个问题，业界有一些解决方案，如：

* 在编程语言层面，如：在 Java 提供了一次编译到处运行；Golang 编译器原生支持交叉和静态编译。
* 容器技术，将依赖和应用组织成镜像，天然就解决了这个问题。

但是，设想如下场景：

一个 C/C++ 编写的项目，依赖 glibc 等动态链接库，我们希望这个项目的编译出来的产物，可以在任意的 Linux 发行版上运行。

要实现上述目标，可能得解决方案如下：

1. 如果该项目仅依赖 libc 而非 glibc，那可以搜索该项目是否可以使用支持静态编译的 libc 库，如 musl。
2. 如果找不到上面的方案，或者并不是官方支持的。还有一种通用方案就是，将所有动态链接库，包括 glibc 都打包到软件里面，该方案是 NixOS 的最重要的技术基石之一。

## 纯静态编译

以 dropbear ssh 为例，参见博客： [轻量级 SSH 开源项目 Dropbear - 编译安装](/posts/lightweight-ssh-dropbear/#编译安装)

## 打包所有 so 依赖

本小结以在 Debian8 中，运行 node18 为例，介绍如何将 glibc 等动态链接库打包到软件包里面，来实现将一个只支持较新版本 glibc 的可执行文件，运行在任意 Linux 发行版中。

### 示例: 在任意 Linux 运行 node18

通过从 [nodejs/node BUILDING.md](https://github.com/nodejs/node/blob/v18.19.0/BUILDING.md) 可以看到，node18 依赖的 glibc 版本 >= 2.28。

也就是说直接从 nodejs 官方下载下来的 nodejs 是无法再旧版的 glibc 的 Linux 发行版中运行的，如 debian8/glibc2.19，会报错，验证如下：

```bash
# 在 debian8 中执行
wget https://nodejs.org/dist/v18.12.0/node-v18.12.0-linux-x64.tar.xz
tar -xvJf node-v18.12.0-linux-x64.tar.xz
cd node-v18.12.0-linux-x64
./node-v18.12.0-linux-x64/bin/node
# 报错如下:
# ./node-v18.12.0-linux-x64/bin/node: /lib/x86_64-linux-gnu/libm.so.6: version `GLIBC_2.27' not found (required by ./node-v18.12.0-linux-x64/bin/node)
# ./node-v18.12.0-linux-x64/bin/node: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.25' not found (required by ./node-v18.12.0-linux-x64/bin/node)
# ./node-v18.12.0-linux-x64/bin/node: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.28' not found (required by ./node-v18.12.0-linux-x64/bin/node)
# ./node-v18.12.0-linux-x64/bin/node: /usr/lib/x86_64-linux-gnu/libstdc++.so.6: version `CXXABI_1.3.9' not found (required by ./node-v18.12.0-linux-x64/bin/node)
# ./node-v18.12.0-linux-x64/bin/node: /usr/lib/x86_64-linux-gnu/libstdc++.so.6: version `GLIBCXX_3.4.21' not found (required by ./node-v18.12.0-linux-x64/bin/node)
```

虽然 nodejs 通过非官方构建提供了基于 glibc2.17 的版本，但是这个版本是实验性支持。因此，最好的做法是：将 glibc 的 so 打包到 nodejs 中。

#### 编译 glibc 以及其他 so

使用如下命令，编译一个 glibc 2.31，这些命令需要再较新版本的 Linux 中执行（如 debian 11）。

```bash
# 在 debian 11 中执行
wget http://ftp.gnu.org/gnu/glibc/glibc-2.31.tar.gz
tar -zxvf glibc-2.31.tar.gz
glibc_prefix=$(pwd)/glibc-2.31-target
cd glibc-2.31/
rm -rf build && mkdir -p build && cd build
sudo apt update && sudo apt install -y gcc make gdb texinfo gawk bison sed python3-dev python3-pip
../configure --prefix=$glibc_prefix
make -j4
make install
cd ../../
# nodejs 依赖 libstdc++.6 和 libgcc_s.so.1
# (最好重新编译，这里简单复制一下，要求该操作系统的 glibc 版本就是 2.31，debian11 满足需求)
cp /usr/lib/x86_64-linux-gnu/libstdc++.so.6.0.28 ./glibc-2.31-target/lib
ln -s libstdc++.so.6.0.28 ./glibc-2.31-target/lib/libstdc++.so.6
cp /lib/x86_64-linux-gnu/libgcc_s.so.1 ./glibc-2.31-target/lib

# 压缩
tar -czvf glibc-2.31-target.tar.gz glibc-2.31-target/
```

传输 glibc-2.31-target.tar.gz 到 debian 8 版本中验证。

如下命令在 debian 8 中执行。

```bash
# 在 debian 8 中执行
tar -zxvf glibc-2.31-target.tar.gz
```

#### 修改 ELF 动态链接库加载器

NixOS 提供了一个实用工具 [patchelf](https://github.com/NixOS/patchelf)，该工具可以修改可执行文件的动态链接库加载器路径（参考： [stackoverflow](https://stackoverflow.com/questions/847179/multiple-glibc-libraries-on-a-single-host)）。

```bash
# 在 debian 8 中执行
sudo apt install -y patchelf
patchelf --set-interpreter $(pwd)/glibc-2.31-target/lib/ld-linux-x86-64.so.2 ./node-v18.12.0-linux-x64/bin/node
# 也可以安装 github 上的静态编译版本
# wget https://github.com/NixOS/patchelf/releases/download/0.18.0/patchelf-0.18.0-x86_64.tar.gz
# tar -zxvf patchelf-0.18.0-x86_64.tar.gz -C patchelf/
```

#### 验证

```bash
# 在 debian 8 中执行
./node-v18.12.0-linux-x64/bin/node
# 可以正确进入解释器。
# Welcome to Node.js v18.12.0.
# Type ".help" for more information.
# > 
```

#### 其他说明

* 可执行文件在运行时， glibc 库所在的目录必须是 glibc 编译设置的 `--prefix` 目录一样，不能是其他路径，通过如下命令可以验证：

    ```bash
    # 在 debian 8 中执行
    mv glibc-2.31-target glibc-2.31-target-2
    patchelf --set-interpreter $(pwd)/glibc-2.31-target-2/lib/ld-linux-x86-64.so.2 ./node-v18.12.0-linux-x64/bin/node
    ./node-v18.12.0-linux-x64/bin/node
    # 报错
    # ./node-v18.12.0-linux-x64/bin/node: error while loading shared libraries: libdl.so.2: cannot open shared object file: No such file or directory

    # 恢复现场
    mv glibc-2.31-target-2  glibc-2.31-target
    patchelf --set-interpreter $(pwd)/glibc-2.31-target/lib/ld-linux-x86-64.so.2 ./node-v18.12.0-linux-x64/bin/node
    ```

* 实际上可执行文件依赖的是部分 `lib/*.so*`，可以按需裁剪。
