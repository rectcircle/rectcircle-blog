---
title: "Nix 包管理器详解"
date: 2023-02-25T20:48:49+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> version: 2.13.2

## 简介

Nix 是一个 `*nix` (Linux、类 Unix) 操作系统的包（软件）管理工具。和各个

和 Debian 系的 apt、Redhat 系的 yum 不同。Nix 在设计上是跨平台的，可以在任何 `*nix` 平台使用（这可能就是 nix 命名的来源）。

Nix 自称其是一个纯函数式，Nix 的包（每个版本）被视为函数式编程领域的值。具体而言，每个包的每个版本都会根据文件内容，计算 Hash，并将该软件的所有文件都存放到一个带有 Hash 值的目录中（因此其没有采用 [`FHS`](https://en.wikipedia.org/wiki/Filesystem_Hierarchy_Standard) 目录结构标准），如：

```
/nix/store/b6gvzjyb2pg0kjfwrjmg1vfhh54ad73z-firefox-33.1/
```

通过 Nix 可以实现系统软件环境的可重现的、声明式的和可靠性。

* 可重现：Nix 包的依赖只能使用其他的 Nix 包，且不存在没有声明的依赖。因此如果一个包在一台机器上工作，它也将在另一台机器上工作。
* 声明式：如果你在开发一个项目，Nix 可以根据配置文件，定制开发或编译环境，且这些开发环境可以在任何设备上复现。
* 可靠性：Nix 包的每个版本都存放在自己独立的目录中，因此在安装、升级过程中不会有文件覆盖的问题，这就保证了新版的安装不会影响到旧版本的任何内容，可以实现一键回滚。

从上面的介绍可以看出，nix 的能力和 Docker 的部分能力存在重叠，特别在环境可重现方面。但是两者存在本质的不同，nix 是一个包管理和配置工具，而 docker 是一个构建和部署容器的工具。因此两者应用场景存在不同：

* nix 一般用在项目开发阶段，可以通过配置文件直接在当前系统中，给开发人员提供一个可重现的开发环境。这个开发环境本质上是通过 PATH 环境变量生成的，各个 IDE 可以零成本集成。
* docker 一般用在项目的构建和部署阶段。如果将 docker 应用在开发阶段，会存在如下问题：
    * IDE 集成困难，只能通过各个 IDE 提供的 Remote 特性才能进入容器，学习成本并不低。
    * 修改开发环境步骤过长(修改 Dockerfile、构建 Dockerfile、删除旧容器、运行新容器），不易测试。

包管理工具实际上是一个 Linux 发行版的核心。反过来讲，拥有了一个包管理工具，很容易的就可以创造一个 Linux 发行版。因此 Nix 项目组还提供了一个将 Nix 作为包管理工具的发行版 NixOS。

本文主要介绍 Nix 这个包管理工具，而不会介绍 NixOS。阅读本文可以了解：

* 如何安装配置和使用 Nix 包管理工具（类比 apt 那样使用）。
* 如何通过 Nix 为自己的项目配置一个可重现的开发环境（类比 Dockerfile）。
* 如何将已有的软件包发布为一个 Nix 包（类比构建一个 deb 包）。
* 介绍 Nix 各种机制的原理。
* 如何为自己的组织，私有化部署一套 Nix 基础设施（类似于建设一个 apt mirror 和一个私有 apt 源）。

本节参考：

* [Will Nix Overtake Docker?](https://blog.replit.com/nix-vs-docker)
* [Nix Manual - Introduction](https://nixos.org/manual/nix/stable/introduction.html)
* [NixOS 首页](https://nixos.org/)

## 快速开始

本节参考：

* [Nix Manual - 快速开始](https://nixos.org/manual/nix/stable/quick-start.html)
* [清华大学 Nix 源](https://mirrors.tuna.tsinghua.edu.cn/help/nix/)

### 安装 Nix

Nix 提供了两种安装方式，单用户安装和多用户安装。一般情况下单用户安装就足够了，因此本文介绍的是单用户安装。

```bash
# 非中国大陆地区或全局科学上网用户，可以直接使用如下官方命令一键安装。
bash <(curl -L https://nixos.org/nix/install)
```

大陆用户，建议使用清华源，步骤如下：

* 单用户安装且不自动添加包 channel。

    ```bash
    sh <(curl https://mirrors.tuna.tsinghua.edu.cn/nix/latest/install) --no-daemon --no-channel-add
    source ~/.nix-profile/etc/profile.d/nix.sh
    ```

* 配置官方包 channel nixpkgs 的二进制缓存服务。

    ```bash
    mkdir -p ~/.config/nix && echo 'substituters = https://mirrors.tuna.tsinghua.edu.cn/nix-channels/store https://cache.nixos.org/' > ~/.config/nix/nix.conf
    ```

* 配置官方包 channel nixpkgs 的 mirrors。

    ```bash
    # 如下命令本质上是，将包 channel 配置写入 ~/.nix-channels 文件
    nix-channel --add https://mirrors.tuna.tsinghua.edu.cn/nix-channels/nixpkgs-unstable nixpkgs
    nix-channel --update
    ```

### 软件包管理

以 Go 安装为例：

```bash
# 搜索
nix-env -qaP go
# nixpkgs.go_1_18  go-1.18.10
# nixpkgs.go       go-1.19.5
# nixpkgs.go_1_20  go-1.20.1

# 安装
nix-env -iA nixpkgs.go

# 查看安装
which go

# 卸载 go (软件包并未删除，而是从环境变量里面去除)
nix-env -e go
# 真正删除没有被使用的软件包
nix-collect-garbage -d
```

## 命令和全局配置

## 开发环境项目配置

## 编写发布 Nix 包

## Nix 原理分析

### 安装脚本分析

Nix 提供了安装脚本（[官方](https://nixos.org/nix/install) | [清华源](https://mirrors.tuna.tsinghua.edu.cn/nix/latest/install)），主要负责下载解压 nix 包，流程如下：

* 根据当前操作系统情况，通过 wget 或 curl 对应架构的 `tar.xz` 包（以清华源、Linux x64 为例，地址为： https://mirrors.tuna.tsinghua.edu.cn/nix//nix-2.13.2/nix-2.13.2-x86_64-linux.tar.xz）到临时目录，大小约为 21M。
* 使用 sha256 （shasum 命令）校验包完整性，并解压（`tar -xJf "$tarball" -C "$unpack"`）到临时目录。
* 执行解压后的软件包里面的安装脚本 `$unpack/*/install`，并把命令行参数传递给他。

先观察 nix 包主要包含各个平台的安装脚本和软件包存储存储目录 `store`，如下所示：

```
create-darwin-volume.sh
install
install-darwin-multi-user.sh
install-multi-user
install-systemd-multi-user.sh
.reginfo
store/
```

nix 包安装脚本 `install` 流程如下（单用户模式）：

* 设置环境变量（如 `nix=/nix/store/lsr79q5xqd9dv97wn87x12kzax8s8i1s-nix-2.13.2`），检查 nix 包目录、系统环境变量是否满足条件。
* 检查 `/nix` 目录是否存在，不存在则调用创建该目录并将该目录 owner 设置为当前执行安装脚本的用户，此刻需要用户输入 sudo 密码。
* 创建 `/nix/store` 和 `/nix/var/nix`。
* 将 `store/` 的全部目录复制到 `/nix/store` 目录中。
* 使用 `$nix/bin/nix-store --load-db` 命令加载数据库文件 `.reginfo`。
* 执行 `"$nix/bin/nix-env" -i "$nix"`，为当前用户创建 profile 文件，此步骤会创建 `~/.nix-profile/` 目录。
* 默认情况下，会执行 `"$nix/bin/nix-channel" --add https://nixos.org/channels/nixpkgs-unstable` 添加 nix 官方 channel nixpkgs，该步骤会创建 `~/.nix-channels` 文件（如上文所示，大陆地区使用 `--no-channel-add` 不添加，否则 update 阶段会很慢）。并执行 `"$nix/bin/nix-channel" --update nixpkgs`，该步骤会添加 `~/.nix-defexpr` 目录。
* 最后，会根据当前用户安装的 shell 情况，将类似于 `if [ -e ~/.nix-profile/etc/profile.d/nix.sh ]; then . ~/.nix-profile/etc/profile.d/nix.sh; fi # added by Nix installer` 的启用 nix 的语句添加到各个 shell 的配置文件中（目前支持：sh、bash、zsh、fish）。

总结一下，单用户模式安装，nix 对系统的影响如下：

* 添加 `/nix` 目录，约 100M。
* 添加 `~/.nix-profile` 软链。
* 添加 `~/.nix-channels` 文件。
* 添加 `~/.nix-defexpr` 目录。

因此如果想完全卸载单用户安装的 nix，直接删除掉上述文件和目录即可。

### 包 Channel

### 安装旧版包

### Nix 软件包安装分析

### Nix 二进制缓存服务

## 私有化部署

### 目标

### 架构设计

* 二进制缓存服务
* 私有包 channel 管理

### Helm 实现

TODO

## 参考

* [Nix 手册](https://nixos.org/manual/nix/stable/)
* [Nix github](https://github.com/NixOS/nix)
* [NixOS wiki](https://nixos.wiki/)
* [NixOS Learn](https://nixos.org/learn.html)
* [清华大学 Nix 源](https://mirrors.tuna.tsinghua.edu.cn/help/nix/)
