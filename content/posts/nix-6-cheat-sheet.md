---
title: "Nix 详解（六） 备忘单"
date: 2023-02-25T20:48:49+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> version: nix-2.14.1

## 命令

本部分仅介绍常用的命令，其他细节参见：[官方手册](https://nixos.org/manual/nix/stable/command-ref/command-ref.html)。

### nix-channel

Channel 管理。

```bash
# 添加 Channel （官方）
nix-channel --add https://nixos.org/channels/nixpkgs-unstable
# 添加 Channel （清华 mirror）
nix-channel --add https://mirrors.tuna.tsinghua.edu.cn/nix-channels/nixpkgs-unstable nixpkgs
# 下载 Channel 内容
nix-channel --update
# 删除 Channel
nix-channel --remove nixpkgs
```

### nix-env

包管理命令，常见用法如下：

```bash
# 列出已配置 channel 中，所有可用的包
nix-env -qaP
# 列出 /path/to/nixpkgs channel 中，所有可安装的包
nix-env -qaPf /path/to/nixpkgs
# 按关键字查询
nix-env -qaP firefox
nix-env -qaP 'firefox.*' # 支持正则
# 列出已配置 channel 中，所有可安装的包，以及其状态。
nix-env -qaPs
# -PS  nixpkgs.bash                bash-3.0
# --S  nixpkgs.binutils            binutils-2.15
# IPS  nixpkgs.bison               bison-1.875d
# I 表示已应用到当前环境，P 表示已经安装到 /nix/store 中了，S 表示在缓存 server 是否存在二进制缓存。

# 安装包
nix-env -iA nixpkgs.go
# 升级包
nix-env -uA nixpkgs.go
# 升级所有包
nix-env -u
# 仅打印可以升级的包
nix-env -u --dry-run
# 卸载包（磁盘空间未释放，如需释放，参见垃圾回收）
nix-env -e go
# 安装旧版包 https://lazamar.co.uk/nix-versions/
nix-env -iA go -f https://github.com/NixOS/nixpkgs/archive/d1c3fea7ecbed758168787fe4e4a3157e52bc808.tar.gz

# nix 特色的环境版本管理（每次安装、升级、写在都会生成一个版本）
# 列出所有环境版本
nix-env --list-generations
# 回滚到上一个版本
nix-env --rollback 
# 回滚到指定版本
nix-env --switch-generation 43
```

常见选项说明：

* `-q` 查询操作。
* `-a` 只列出可以安装，但还未安装的包。
* `-P` 打印属性路径（唯一标识）。
* `-s` 获取软件包的状态。
* `-i` 安装软件包。
* `-A` 表示使用包属性名定位安装包
* `-f` 从指定 git commit 的 channel 中安装包（commit id 前往 https://github.com/NixOS/nixpkgs/commits/master 查询），支持 url、本地目录。中国大陆网络问题：
    * 方案1：前往，[清华源 Release 目录](https://mirrors.tuna.tsinghua.edu.cn/nix-channels/releases/?C=M&O=D)， 搜索最新的`nixpkgs-unstable@nixpkgs` 开头的最新，复制 nixexprs.tar.xz 路径。
    * 方案2：先通过科学上网，clone 下整个 https://github.com/NixOS/nixpkgs 仓库（几个 G 大小），然后 checkout 到指定版本，然后在通过 `nix-env -f` 指定到 nixpkgs 根目录目录，这样后续就不用处理网络问题了。

### nix-collect-garbage

释放磁盘空间

```bash
# 真正删除没有被使用的软件包
nix-collect-garbage -d
```

### nix-shell

```bash
# 打开一个 shell，并安装 `go_1_19`、`jq`、`curl`。
nix-shell -p go_1_19 jq curl
# 安装包的同时，不继承环境变量，使用固定版本的 nixpkgs 的配置。
nix-shell -p go_1_19 jq curl --pure -I nixpkgs=https://github.com/NixOS/nixpkgs/archive/794f34657e066a5e8cc4bb34491fee02240c6ac4.tar.gz
# nix-shell -p go_1_19 jq curl --pure -I nixpkgs=https://mirrors.tuna.tsinghua.edu.cn/nix-channels/releases/nixpkgs-unstable%40nixpkgs-23.05pre460011.f5ffd578778/nixexprs.tar.xz


# nix-shell 实现可重现脚本
#!/usr/bin/env nix-shell
#! nix-shell -i bash --pure
#! nix-shell -p bash go_1_19 jq curl which
#! nix-shell -I nixpkgs=https://mirrors.tuna.tsinghua.edu.cn/nix-channels/releases/nixpkgs-unstable%40nixpkgs-23.05pre460011.f5ffd578778/nixexprs.tar.xz

# nix-shell 可重现脚本使用 shell.nix 的配置
#!/usr/bin/env nix-shell
#! nix-shell -i bash --pure shell.nix
```

* `-p` 从 nixpkgs 中，指定安装的 package。
* `--pure` 指，不继承当前进程的环境变量。
* `-I` 从指定 git commit 的 channel 中安装包（commit id 前往 https://github.com/NixOS/nixpkgs/commits/master 查询），支持 url、本地目录。中国大陆网络问题：
    * 方案1：前往，[清华源 Release 目录](https://mirrors.tuna.tsinghua.edu.cn/nix-channels/releases/?C=M&O=D)， 搜索最新的`nixpkgs-unstable@nixpkgs` 开头的最新，复制 nixexprs.tar.xz 路径。
    * 方案2：先通过科学上网，clone 下整个 https://github.com/NixOS/nixpkgs 仓库（几个 G 大小），然后 checkout 到指定版本，然后在通过 `nix-env -f` 指定到 nixpkgs 根目录目录，这样后续就不用处理网络问题了。
* `-i` 指定 shell 交互式解释器。
* `<path>` 最后一个参数为一个 `.nix` 文件，默认为当前目录的 `shell.nix` 如果 `shell.nix` 不存在，则当前目录的 `default.nix`。注意，如果指定且写在 shell 的 shebang 中，则当前路径为为脚本所在目录，而不是 work dir。

## 全局配置

## 参考

* [nix.dev](https://nix.dev/)
* [Nix 手册](https://nixos.org/manual/nix/stable/)
* [Nix github](https://github.com/NixOS/nix)
* [NixOS wiki](https://nixos.wiki/)
    * [Development environment with nix-shell](https://nixos.wiki/wiki/Development_environment_with_nix-shell)
* [NixOS Learn](https://nixos.org/learn.html)
* [清华大学 Nix 源](https://mirrors.tuna.tsinghua.edu.cn/help/nix/)
* nixpkgs 相关
    * [nixpkgs github](https://github.com/NixOS/nixpkgs)
    * [nixpkgs 手册](https://nixos.org/manual/nixpkgs/stable/)
* 安装旧版本相关
    * [Nix package versions](https://lazamar.co.uk/nix-versions/)
    * [Searching and installing old versions of Nix packages](https://lazamar.github.io/download-specific-package-version-with-nix/)。
    * [github lazamar/nix-package-versions](https://github.com/lazamar/nix-package-versions)
    * [No way to install/use a specific package version? #9682](https://github.com/NixOS/nixpkgs/issues/9682)
* 其他
    * [VSCode 扩展 Nix Environment Selector](https://marketplace.visualstudio.com/items?itemName=arrterian.nix-env-selector) | [issue](https://github.com/arrterian/nix-env-selector/issues/66) | [issue](https://github.com/microsoft/vscode/issues/152806)
    * [使用Nix+direnv快速构建不同软件版本的开发环境](https://grass.show/post/create-environment-with-nix-and-direnv)
    * [如何使用 Nix 轻松获取依赖项](https://devpress.csdn.net/cicd/62ee0a19c6770329307f3202.html#devmenu9)
