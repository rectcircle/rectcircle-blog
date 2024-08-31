---
title: "Nix 高级话题之 动态链接库的处理"
date: 2024-08-31T19:57:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> version: nix-2.22.1

## 背景知识

详见：

* [Linux 动态链接库详解（一）简单示例](/posts/linux-dylib-detail-1-sample/)
* [Linux 动态链接库详解（二）版本管理](/posts/linux-dylib-detail-2-version/)
* [Linux 动态链接库详解（三）动态库查找](/posts/linux-dylib-detail-3-search/)

## 动态库组织

在 Linux 软件包可基本上可以分为两种：开发包（`-dev`）和运行包。

开发包主要包含头文件、动态链接库等，运行包主要包含可执行文件、文档、配置文件等。

常规的 Linux 发行版，这些软件包的文件会按照 FHS 约定被安装到系统的不同目录下。也就是说，软件包在文件系统的组织是先按照文件类型划分目录，然后这些目录里面包含各个软件包的部分文件：

```
/usr/bin
    gcc  # gcc 包的可执行文件
    python3  # python 包的可执行文件
/usr/lib
    libgcc_s.so.1  # gcc 包的动态链接库
    python3.12     # python 包的库
```

和常规 Linux 发行版不同，nix 管理的所有包，首先都存储在 `/nix/store/<包名>` 目录下。也就是说，软件包在文件系统的组织是先按照包名划分目录，然后这些目录里面包含各个软件包的部分目录：

```
/nix/store/xxx-gcc-x.y.z/  # gcc 包
    /bin/gcc
    /lib/libgcc_s.so.1
/nix/store/xxx-python-x.y.z/  # python 包
    /bin/python3
    /lib/python3.12
```

因此，Nix 在构建时，以及其构建出的可执行文件的无法像常规的 Linux 发型版那样到几个指定的路径查找动态链接库。

Nix 解决办法是，在构建（链接阶段）过程，通过 `-L` 参数指定链接过程中的库查找，通过 `-rpath` 参数，将改可执行文件依赖的所有动态链接库的包路径写入到可执行文件中。这样，在安装时根据依赖关系将依赖的包安装到 `/nix/store/` 目录下，可执行文件在这些指定的路径中查找动态链接库即可。

整体流程如下：

* 包定义和构建： nix 将世界上所有主流的软件包维护在名为 [`nixpkgs`](https://github.com/NixOS/nixpkgs) 的 github 仓库中。这个仓库使用 nix dsl 语言编写，提供了方便的构建函数 `stdenv.mkDerivation`，包发布者可以使用这些函数声明包的依赖以及构建过程，在这个函数内就实现了上述注入 `-rpath` 参数的过程，而无需包发布者手动指定。
* 包安装： 使用 nix 相关命令将这个包以及该包的依赖安装到 `/nix/store/` 下。
* 包执行： 在执行过程中 Linux 内核将读取可执行文件 ELF `.dynamic` 段的 `DT_RPATH` 或 `DT_RUNPATH` 在 `/nix/store/` 找到正确的动态链接库并加载。

`stdenv.mkDerivation` 特别说明：

* 在构建过程中，使用 gcc 等命令式经过一个 wrap 脚本，这个脚本会识别 `NIX_CFLAGS_COMPILE`、`NIX_LDFLAGS` 相关命令，将这些参数传递给编译器和链接器。另外可以通过 `NIX_DEBUG=1` 打印更多日志。
* `buildInputs = [ zlib ]` 参数会注入 `NIX_CFLAGS_COMPILE` 和 `NIX_LDFLAGS`。

    ```bash
    $ cat > shell.nix <<EOF ;nix-shell
    with import <nixpkgs> {};
    stdenv.mkDerivation {
    name = "myenv";
    buildInputs = [ zlib ];
    }
    EOF
    [nix-shell:~] $ echo $NIX_CFLAGS_COMPILE
    -isystem /nix/store/bjl5kk674rmdzzpmcsvmw73hvf35jwh8-zlib-1.2.11-dev/include -isystem /nix/store/bjl5kk674rmdzzpmcsvmw73hvf35jwh8-zlib-1.2.11-dev/include
    [nix-shell:~] $ echo $NIX_LDFLAGS
    -rpath /nix/store/d5dzr90q2wy2nlw0z7s0pgxkjfjv1jrj-myenv/lib64 -rpath /nix/store/d5dzr90q2wy2nlw0z7s0pgxkjfjv1jrj-myenv/lib -L/nix/store/5dphwv1xs46n0qbhynny2lbhmx4xh1fc-zlib-1.2.11/lib -L/nix/store/5dphwv1xs46n0qbhynny2lbhmx4xh1fc-zlib-1.2.11/lib
    ```

* 除了上述机制，改函数还提供了对其他主流 C 构建工具的支持：
    * `pkg-config`
    * `cmake`

更多详见： [NixOS Wiki - C](https://nixos.wiki/wiki/C)
