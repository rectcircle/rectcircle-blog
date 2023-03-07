---
title: "Nix 详解（一） 像传统包管理器一样使用 Nix"
date: 2023-02-25T20:48:49+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> version: nix-2.14.1

## 简述

Nix 是一个 `*nix` (Linux、MacOS 等) 操作系统的 DevOps 工具集，其核心是一套设计严密的包管理工具。

和 Debian 系的 apt、Redhat 系的 yum 不同。Nix 在设计上是跨平台的，可以在任何 `*nix` 平台使用（这可能就是 nix 命名的来源）。

Nix 自称其是一个纯函数式，Nix 的包（每个版本）被视为函数式编程领域的值。具体而言，每个包的每个版本都会计算 Hash，并将该软件的所有文件都存放到一个带有 Hash 值的目录中（因此其没有采用 [`FHS`](https://en.wikipedia.org/wiki/Filesystem_Hierarchy_Standard) 目录结构标准），如：

```
/nix/store/b6gvzjyb2pg0kjfwrjmg1vfhh54ad73z-firefox-33.1/
```

通过 Nix 可以实现系统软件环境的可重现的、声明式的和可靠性。

* 可重现：Nix 包的依赖只能使用其他的 Nix 包，且不存在没有声明的依赖。因此如果一个包在一台机器上工作，它也将在另一台机器上工作。
* 声明式：如果你在开发一个项目，Nix 可以根据配置文件，定制开发或编译环境，且这些开发环境可以在任何设备上复现。
* 可靠性：Nix 包的每个版本都存放在自己独立的目录中，因此在安装、升级过程中不会有文件覆盖的问题，这就保证了新版的安装不会影响到旧版本的任何内容，可以实现一键回滚。

从上面的介绍可以看出，nix 的能力和 Docker 的部分能力存在重叠，特别在环境可重现方面。但是两者存在本质的不同，nix 是一个包管理和配置工具，而 docker 是一个构建和部署容器的工具。因此两者应用场景存在不同：

* nix 一般用在项目开发、编译阶段，可以通过配置文件直接在当前系统中，给开发人员提供一个可重现的开发环境。这个开发环境本质上是通过 PATH 环境变量生成的，各个 IDE 可以零成本集成。
* docker 一般用在项目的构建和部署阶段。如果将 docker 应用在开发阶段，会存在如下问题：
    * IDE 集成困难，只能通过各个 IDE 提供的 Remote 特性才能进入容器，学习成本并不低。
    * 修改开发环境步骤过长(修改 Dockerfile、构建 Dockerfile、删除旧容器、运行新容器），不易测试。

包管理工具实际上是一个 Linux 发行版的核心。反过来讲，拥有了一个包管理工具，很容易的就可以创造一个 Linux 发行版。因此 Nix 项目组还提供了一个将 Nix 作为包管理工具的发行版 NixOS。

本系列主要介绍 Nix 工具集，而不会介绍 NixOS。阅读本系列文章可以了解：

* 如何安装配置和使用 Nix 包管理工具（类比 apt 那样使用）。
* 如何通过 Nix 为自己的项目配置一个可重现的开发环境（类比 Dockerfile）。
* 如何将已有的软件包发布为一个 Nix 包（类比构建一个 deb 包）。
* 介绍 Nix 各种机制的原理。
* 如何为自己的组织，私有化部署一套 Nix 基础设施（类似于建设一个 apt mirror 和一个私有 apt 源）。

本文，是本系列的第一篇，将主要从传统的包管理器视角，介绍 nix 作为操作系统包管理器的相关能力。

本节参考：

* [Will Nix Overtake Docker?](https://blog.replit.com/nix-vs-docker)
* [Nix Manual - Introduction](https://nixos.org/manual/nix/stable/introduction.html)
* [NixOS 首页](https://nixos.org/)
* [Welcome to nix.dev](https://nix.dev/)

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
    nix-channel --update # 下载 channel 并更新 ~/.local/state/nix
    ```

### 常用命令

以 Go 安装为例：

```bash
# 更新 channel 源 （类似于 apt update)
nix-channel --update
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

# 更新 nix 自身
nix-env -iA nixpkgs.nix nixpkgs.cacert
```

## Nix 包管理

### 概述

本章节介绍的是， 站在需要安装软件包的用户视角，如何使用 nix 获取、安装、升级、删除包。这些能力主要通过 nix-env 命令提供。

首先，一个包管理工具，必然有一个软件源（类似于 /etc/apt/source.list），在 Nix 中，被叫做 channel。因此，如上文快速开始所示，要使用 nix-env 之前，需要使用 `nix-channel` 子命令添加一个 channel。

然后即可使用 `nix-env` 对软件包进行管理。

* `nix-env -qaP 关键词` 查询软件包。
* `nix-env -iA 包属性名` 安装软件包（`-A` 表示，使用包属性名定位软件包，格式为 `channel名.包名`）。
* `nix-env -e 包名` 卸载包（注意这里是包名）。
* `nix-env -uA 包属性名` 升级软件包。
* `nix-env -u` 升级所有软件包。

### 用户 Profiles

nix 通过 profile 机制，将安装的软件包应用到用户 shell 环境中。其原理如下：

* nix 在安装时，会在用户的 shell profile 中注入类似如下语句。

    ```bash
    if [ -e ~/.nix-profile/etc/profile.d/nix.sh ]; then . ~/.nix-profile/etc/profile.d/nix.sh; fi # added by Nix installer
    ```

* 用户启动 shell 时，会执行 `. ~/.nix-profile/etc/profile.d/nix.sh` 脚本。该脚本的核心是给 PATH 添加 `~/.nix-profile/bin` 路径（通过 `echo $PATH` 可以看到)。观察 `~/.nix-profile`，可以看出：
    * `~/.nix-profile` 是一个软链，指向了 `/nix/var/nix/profiles/per-user/$username/profile`。
    * `/nix/var/nix/profiles/per-user/$username/profile` 同样是一个软链，指向了 `profile-20-link`
    * `/nix/var/nix/profiles/per-user/$username/profile-20-link` 同样是一个软链，指向了 `/nix/store/g92kgz15smykgwqlhcd6lbphphqsm0a2-user-environment`。
    * 最终，观察 `/nix/store/g92kgz15smykgwqlhcd6lbphphqsm0a2-user-environment/bin` （即 `~/.nix-profile/bin`），可以看到安装的软件的可执行文件的软链，如下所示：

        ```
        hello -> /nix/store/260q5867crm1xjs4khgqpl6vr9kywql1-hello-2.12.1/bin/hello
        nix -> /nix/store/n6vimgasfqxz4xbmbzyvh61llhrapya7-nix-2.14.1/bin/nix
        nix-build -> /nix/store/n6vimgasfqxz4xbmbzyvh61llhrapya7-nix-2.14.1/bin/nix-build
        nix-channel -> /nix/store/n6vimgasfqxz4xbmbzyvh61llhrapya7-nix-2.14.1/bin/nix-channel
        nix-collect-garbage -> /nix/store/n6vimgasfqxz4xbmbzyvh61llhrapya7-nix-2.14.1/bin/nix-collect-garbage
        nix-copy-closure -> /nix/store/n6vimgasfqxz4xbmbzyvh61llhrapya7-nix-2.14.1/bin/nix-copy-closure
        nix-daemon -> /nix/store/n6vimgasfqxz4xbmbzyvh61llhrapya7-nix-2.14.1/bin/nix-daemon
        nix-env -> /nix/store/n6vimgasfqxz4xbmbzyvh61llhrapya7-nix-2.14.1/bin/nix-env
        nix-hash -> /nix/store/n6vimgasfqxz4xbmbzyvh61llhrapya7-nix-2.14.1/bin/nix-hash
        nix-instantiate -> /nix/store/n6vimgasfqxz4xbmbzyvh61llhrapya7-nix-2.14.1/bin/nix-instantiate
        nix-prefetch-url -> /nix/store/n6vimgasfqxz4xbmbzyvh61llhrapya7-nix-2.14.1/bin/nix-prefetch-url
        nix-shell -> /nix/store/n6vimgasfqxz4xbmbzyvh61llhrapya7-nix-2.14.1/bin/nix-shell
        nix-store -> /nix/store/n6vimgasfqxz4xbmbzyvh61llhrapya7-nix-2.14.1/bin/nix-store
        ```

* 在使用 `nix-env` 管理软件包时，流程应该如下所示：

    * 安装时，从 binary server 下载依赖和软件包到 `/nix/store` 中（或者本地编译，存储到 `/nix/store`）。
    * 根据当前的 profile 即 `/nix/var/nix/profiles/per-user/$username/profile` 和安装、卸载的软件包的情况，生成一个新的 profile 目录，存放到 `/nix/store/$hash-user-environment`
    * 创建一个软链 `/nix/var/nix/profiles/per-user/$username/profile-$序号-link` 指向上一步的 profile。
    * 修改软链 `/nix/var/nix/profiles/per-user/$username/profile` 指向 `profile-$序号-link`，完成。

* 切换到历史上的其他版本。

    * `nix-env --list-generations` 查看历史所有环境列表
    * `nix-env --rollback` 回滚到上一个版本，即将 `/nix/var/nix/profiles/per-user/$username/profile` 指向上一版本的 `profile-$序号-link`。
    * `nix-env --switch-generation 43` 回滚到指定版本，即将 `/nix/var/nix/profiles/per-user/$username/profile` 指向上一版本的 `profile-43-link`。

* 上面介绍的是默认的基于用户的 profile，nix 提供了生成和应用自定义 profile，而非使用 `/nix/var/nix/profiles/per-user/$username` 的方式。
    * `nix-env -p /nix/var/nix/profiles/other-profile -iA nixpkgs.nix nixpkgs.cacert nixpkgs.go` -p 参数可以手动指定 profile 的生成位置（注意，nix 自身不会自动添加）。
    * `nix-env --switch-profile /nix/var/nix/profiles/other-profile` 将当前用户的 profile 切换到指定目录，即，修改 `~/.nix-profile` 软链的指向。

* 垃圾回收机制。`nix-env` 核心是生成 profile 以及修改软链，`nix-env` 不会删除 /nix/sotre 下的软件包。因此需要通过 `nix-collect-garbage -d` 删除所有历史上的 profile 以及当前 profile 没有引用的，存放在 /nix/sotre 下的软件包。其原理是保留 `/nix/var/nix/gcroots` 中的和当前系统运行的进程中的，存在指向 `/nix/sotre` 的软件包（`nix-store --gc --print-roots` 可以通过该命令看到），其他则删除。

### Channel 管理

在 Nix 中 Channel 类似于 apt source 的概念。可以通过如下命令，添加一个 Channel。

```bash
nix-channel --add https://nixos.org/channels/nixpkgs-unstable
# 清华 mirror
nix-channel --add https://mirrors.tuna.tsinghua.edu.cn/nix-channels/nixpkgs-unstable nixpkgs
```

该命令会将配写入 `~/.nix-channels`。

```
https://mirrors.tuna.tsinghua.edu.cn/nix-channels/nixpkgs-unstable nixpkgs
```

执行 `nix-channel --update` 将会从 url 中下载 channel 的内容，`nix-env` 会根据 `~/.nix-defexpr/channels` 获取到包信息，存储路径如下：

* `~/.nix-defexpr/channels` 指向 `~/.local/state/nix/profiles/channels`
* `~/.local/state/nix/profiles/channels` 指向 `channels-1-link`
* `~/.local/state/nix/profiles/channels-1-link` 指向 `/nix/store/$hash-user-environment`
* 因此 `~/.nix-defexpr/channels` 指向 `/nix/store/$hash-user-environment`，包含

    ```
    /nix/store/$hash-env-manifest.nix
    /nix/store/$hash-nixpkgs/nixpkgs
    ```

最后，可以通过 `nix-channel --remove nixpkgs` 删除 channel。

本部分，只介绍使用者如何配置 channel。关于 channel 的目录结构，如何自定义一个私有 Channel，参见后续文章分析。

### 安装旧版包

在 nix 中，官方的 Channel 是 [nixpkgs](https://github.com/NixOS/nixpkgs)，这个 Channel 是通过 git 管理的。

通过 `nix-env -qaP go` 可以看到，目前最新版本提交的 nixpkgs 的 Go 只有最新的三个版本 1.18、1.19 和 1.20。

上文对于 Go 的安装，使用的是最新 commit 的 nixpkgs （通过 nix-channel 配置）。

而 `nix-env` 还提供了基于某个特殊版本的 nixpkgs 的安装机制。如：

```bash
nix-env -iA go -f https://github.com/NixOS/nixpkgs/archive/d1c3fea7ecbed758168787fe4e4a3157e52bc808.tar.gz
```

很多时候，我们希望，安装更旧版本的依赖时，就需要获取到包含更旧 Go 的配置的 nixpkgs 那个 commit 的快照。

因此，现在的问题是，如何通过包名查询历史版本对应的 commit，然后通过上文的类似于 `https://github.com/NixOS/nixpkgs/archive/$commitID.tar.gz` 的方式即可安装旧版本的包。

nixpkgs 官方并未提供该能力，但是幸运的是 nix 社区有一个站点可以查询这些信息： https://lazamar.co.uk/nix-versions/ 。

其原理可以参见：[该站点作者博客](https://lazamar.github.io/download-specific-package-version-with-nix/)。

此外，该项目已开源，参见： [lazamar/nix-package-versions](https://github.com/lazamar/nix-package-versions)。

nixpkgs 官方关于安装旧版包的讨论参见：[No way to install/use a specific package version? #9682](https://github.com/NixOS/nixpkgs/issues/9682)。

注意：

* 中国大陆地区，建议先通过科学上网，clone 下整个 https://github.com/NixOS/nixpkgs 仓库（几个 G 大小），然后 checkout 到指定版本，然后在通过 `nix-env -f` 指定到 nixpkgs 根目录目录。
* 从多个历史 commit 的 nixpkgs 安装包会导致磁盘占用快速上升。

## 安装脚本分析

上文使用了 Nix 提供的安装脚本来安装 Nix（[官方](https://nixos.org/nix/install) | [清华源](https://mirrors.tuna.tsinghua.edu.cn/nix/latest/install)），其主要负责下载解压 nix 包，流程如下：

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
* 添加 `~/.local/state/nix` 目录。

因此如果想完全卸载单用户安装的 nix，直接删除掉上述文件和目录即可。
