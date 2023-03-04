---
title: "Nix 详解（五） 备忘单"
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

### nix-collect-garbage

释放磁盘空间

```bash
# 真正删除没有被使用的软件包
nix-collect-garbage -d
```

## 全局配置

## 参考

https://nix.dev/

* [Nix 手册](https://nixos.org/manual/nix/stable/)
* [Nix github](https://github.com/NixOS/nix)
* [NixOS wiki](https://nixos.wiki/)
* [NixOS Learn](https://nixos.org/learn.html)
* [清华大学 Nix 源](https://mirrors.tuna.tsinghua.edu.cn/help/nix/)
