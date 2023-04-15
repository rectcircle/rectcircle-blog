---
title: "NixOS 指南"
date: 2023-04-16T00:00:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> version: [22.11](https://nixos.org/manual/nixos/stable/release-notes.html#sec-release-22.11)

## 安装

前往 NixOS ISO [下载页](https://nixos.org/download.html#nixos-iso)，建议下载 Graphical ISO image（该镜像也可以选择最小化安装）。

参考网络上制作 Linux USB 启动盘的教程制作 USB 启动盘。然后使用该 ISO 引导启动需要安装 NixOS 的设备。然后按照图形化安装程序的步骤一键安装即可，注意：

* 键盘布局建议选择 English (US) - Default。
* 可以选择不安装桌面环境。

安装完成后，重启系统即可进入 NixOS。

## 快速配置

假设按照章节说明，选了 Minimal Installation （不安装桌面环境），需要进行一些配置才能更好的使用，大概配置如下内容。

* 使用清华源二进制缓存加速下载
* 最小化安装的 NixOS 的只提供了 nano 编辑器，Linux 用户应该更熟悉 vim，因此，安装 vim。
* NixOS 图形化安装程序并没有对 hostname 配置，在这里配置一下。
* 最小化安装的 NixOS 默认并没有开启 SSH，为了更方便的使用 NixOS，下面来开启 SSH。

和其他 Linux 发行版不同，NixOS 通过 `/etc/nixos/configuration.nix` 配置文件来配置系统的一切，使用 `sudo nano /etc/nixos/configuration.nix` 来修改该配置文件：

```nix
  # 在配置文件花括号里面，添加如下行
  nix.settings.substituters = [ "https://mirrors.tuna.tsinghua.edu.cn/nix-channels/store" ];

  # 如下部分默认配置文件均有对应的说明，搜索即可
  networking.hostName = "pve-vm-nixos"; # Define your hostname.
  environment.systemPackages = with pkgs; [
    vim # Do not forget to add an editor to edit configuration.nix! The Nano editor is also installed by default.
    wget
  ];
  services.openssh.enable = true;
```

大陆地区，从清华源获取 Channel。

```bash
sudo nix-channel --add https://mirrors.tuna.tsinghua.edu.cn/nix-channels/nixos-22.11 nixos
sudo nix-channel --update
```

将 `/etc/nixos/configuration.nix` 应用到系统中。

```bash
sudo nixos-rebuild switch
```

至此，一个最小化的 NixOS 配置完成，可通过 ssh 远程登录 NixOS。

## NixOS 初探

常规的 Linux 发行版，配置一个 Linux 系统的方式是：

* 安装一个 Linux 标准的发行版。
* 执行一个 shell 脚本：
    * 利用该发行版的包管理工具安装依赖软件包（如 apt、yum）。
    * 修改配置文件（service、shell profile、软件包配置等）。
    * 清理安装过程产生的垃圾。
* 如果想将该系统分享给其他人，需要还需制作一个镜像，只能以镜像的方式来分享该环境。

在容器场景，如上流程仍然没有什么变化，只是如上这些通过 Dockerfile 来描述。

而 NixOS 基于 Nix 包管理器，整个 NixOS 的完全可以通过 `/etc/nixos/configuration.nix` 配置文件，自动生成。也就是说，NixOS，通过分享 `/etc/nixos/configuration.nix` 配置文件，即可在任意设备上重现当前 NixOS 的整个系统的环境，而不需制作镜像。

这就是 NixOS 最重要的特性：可重现性。

下面初步通过观察文件系统、shell、环境变量等，来介绍 NixOS 的结构，阐述其如何实现可重现性。

### 目录结构

NixOS 作为 Linux 发行版，其目录结构整体上是符合 [`FHS`](https://en.wikipedia.org/wiki/Filesystem_Hierarchy_Standard) 的。

为了支持可重现，系统的软件包和配置均通过 `/etc/nixos/configuration.nix` 配置文件来定义，通过 nix-rebuild 命令：

* 通过 nix 能力，将软件包下载或编译到 `/nix/store` 目录下。
* 生成 Linux 系统配置，通过 nix 能力，存储到 `/nix/store` 目录中。
* 根据 FHS 规范，修改对应位置软链的指向正确的 `/nix/store` 子目录或文件。

因此 NixOS 的目录结构：

* 整体符合 FHS 规范。
* 配置文件、软件包通过软链指向 `/nix/store` 子目录或文件。

```
/
├── bin
│   └── sh -> /nix/store/gmz9kyy7m7dvbp34wjpmqjyir58z0xch-bash-interactive-5.1-p16/bin/sh
├── boot
│   ├── background.png
│   ├── converted-font.pf2
│   └── grub
├── dev
├── etc
│   ├── bashrc -> /etc/static/bashrc
│   ├── profile -> /etc/static/profile
│   ├── services -> /etc/static/services
│   ├── set-environment -> /etc/static/set-environment
│   ├── static -> /nix/store/x4837ykhq2wvvvdgf16vyp1aac106slz-etc/etc
│   └── ...
├── home
│   └── rectcircle
│       ├── .bash_history
│       ├── .lesshst
│       ├── .ssh
│       └── .viminfo
├── lost+found
├── nix
│   ├── store
│   └── var
├── proc
├── root
│   ├── .bash_history
│   ├── .cache
│   ├── .lesshst
│   ├── .nix-channels
│   ├── .nix-defexpr
│   ├── .nix-profile -> /nix/var/nix/profiles/default
│   ├── result -> /nix/store/pwj4sf18l55bx8s1b8f9mjssnz9z1ffj-nixos-system-pve-vm-nixos-22.11.3567.0040164e473
│   └── sh
├── run
├── srv
├── sys
├── tmp
├── usr
│   └── bin
│       └── env -> /nix/store/98rnm10cy6liayss4gbhksmpvmykl6kd-coreutils-9.1/bin/env
└── var
```

### /etc 目录

本小结重点介绍 NixOS 的配置文件结构，从上面目录结构可以看出：

* `/etc` 下的文件或目录（如 `profile`、`hostname`）多数都是软链，指向 `/etc/static` 目录下的同名项目。
* `/etc/static` 也是一个软链，是一个指向 `/nix/store/x4837ykhq2wvvvdgf16vyp1aac106slz-etc/etc` 的软链。
* `/nix/store/x4837ykhq2wvvvdgf16vyp1aac106slz-etc/etc` 目录下包含的就是操作系统的会用到的配置文件，这些配置就是根据 `/etc/nixos/configuration.nix` 生成的。

### shell 环境

举个具体的例子，bash 初始化流程：执行 `/etc/profile` (`/nix/store/x4837ykhq2wvvvdgf16vyp1aac106slz-etc/etc/profile`)，改文件里会 source `/etc/bashrc` (`/nix/store/x4837ykhq2wvvvdgf16vyp1aac106slz-etc/etc/bashrc`)。而 `/etc/bashrc` 会进行 bash 的初始化。在上述文件开头的注释说明了，不要修改：`DO NOT EDIT -- this file has been generated automatically.`。

最终在 shell 中执行 `echo $PATH` 输出如下：

```
/run/wrappers/bin:/home/rectcircle/.nix-profile/bin:/etc/profiles/per-user/rectcircle/bin:/nix/var/nix/profiles/default/bin:/run/current-system/sw/bin
```

这里可以看出，NixOS 的 可执行文件查找目录和常规的 Linux 发行版不同，`ls` 观察下这些目录，这些目录的项目均是指向 `/nix/store/xxx/bin/xxx` 的软链。

下面介绍这几个目录的不同之处：

* `/nix/var/nix/profiles/default/bin` 是由 `/etc/nixos/configuration.nix` 配置文件生成的。
* `/run/current-system/sw/bin` 是 root 用户手动通过 `nix-env -iA xxx` 手动安装保存的位置，注意这种方式安装的包不受配置文件管理。
* `/home/rectcircle/.nix-profile/bin` 和 `/etc/profiles/per-user/rectcircle/bin` 是当前用户安装的包的位置。
* `/run/wrappers/bin` 包含一些需要特殊权限（如设置用户 id 位）的软件包，如 `sudo` 的可执行文件。

观察 `ls /bin /usr/bin`，输出如下：

```
/bin:
sh

/usr/bin:
env
```

可以看出，某些软件包，包含的 shell 脚本使用的 shebang 是直接指向解释器的，可能会失败，需要做适配才能在 NixOS 中运行，如： `#!/bin/bash`，此类改造为 `#!/usr/bin/env bash` 即可。（NixOS 为了保证系统的整洁性，至今仍没有将 `/bin/bash` 添加其系统中，参见：[讨论](https://discourse.nixos.org/t/add-bin-bash-to-avoid-unnecessary-pain/5673)）。

## 配置文件说明

NixOS 是通过 `/etc/nixos/configuration.nix` 配置文件配置的。

本部分将介绍如果利用该配置文件，在其他 Linux 系统中需要执行一堆命令才能完成的系统配置。

由于 `/etc/nixos/configuration.nix` 配置项过多，本部分仅介绍一些常见的场景。对于其他场景以及全部配置项，请查阅：

* [NixOS Manual - II. Configuration](https://nixos.org/manual/nixos/stable/index.html#ch-configuration)。
* [NixOS Manual - Appendix A. Configuration Options](https://nixos.org/manual/nixos/stable/options.html)。

### 配置语法

`/etc/nixos/configuration.nix` 配置文件是一个 nix 表达式，可以使用 nix 语言的所有特性，关于 nix 语言，参见本系列：[Nix 详解（三） nix 领域特定语言](/posts/nix-3-nix-dsl/)。

该表达式必须是一个 nix 函数结构如下：

```nix
{ config, pkgs, ... }:
{
  # option definitions
}
```

下文具体场景配置的位置上如无说明，均位于 `# option definitions` 附近。

### Nix 配置

如：

```
  nix.settings.substituters = [ "https://mirrors.tuna.tsinghua.edu.cn/nix-channels/store" ];
```

更多参见：[NixOS options search](https://search.nixos.org/options?channel=22.11&show=nix.settings.substituters&from=0&size=50&sort=relevance&type=packages&query=nix.settings)。

### 包安装

所有可用包，前往 https://search.nixos.org/packages 搜索，并配置到配置文件，例如：

```nix
  environment.systemPackages = with pkgs; [
    vim
    wget
  ];
```

### Shell Profile

很多时候，我们想给 shell 配置一些 alias 导出一些自己的环境变量，此时可以通过如下方式配置：

```nix
  environment.interactiveShellInit = ''
    alias l='ls -alh'
    alias k='kubectl'
    alias ll='ls -l'
  '';
  environment.variables = {
    A = "1";
  };
```

更多参见：[NixOS options search](https://search.nixos.org/options?channel=22.11&from=0&size=50&sort=relevance&type=packages&query=interactiveShellInit)。

### 用户配置

可以为某个用户配置用户粒度的包、环境变量等。

前往 [NixOS options search](https://search.nixos.org/options)，搜索 `users.users.<name>`。

### 安装服务

如果想安装一些服务，如 MySQL，Redis 等，可以前往 [NixOS options search](https://search.nixos.org/options)，搜索 `services.xxx` 搜索配置项，按照说明配置即可。

### 配置原理

上文介绍了 `/etc/nixos/configuration.nix` 配置文件的基本结构和常见场景的用法。这里介绍下 NixOS 是如何根据这个配置文件生成这个系统的最终配置项，最终应用到系统中的过程。

回顾一下 `/etc/nixos/configuration.nix` 语法，其本质上是一个 nix 函数，这类函数在 NixOS 中被称为 NixOS Module。

* 该函数接收包含至少包含 `config`、`pkgs` 属性的属性集。可以通过 `nix repl --expr  '{ nixos = import <nixpkgs/nixos> { configuration = {}; }; }'` 命令，进入 nix repl，输入 nixos 即可查看该属性集的属性，注意该命令只能在 NixOS 系统中执行，不能在只装了 nix 的其他 Linux 发行版中运行：
    * `config` 属性集，属性为 NixOS 模块的选项的配置，据官网称，超过 10000 个，可以通过 [官方搜索站点](https://search.nixos.org/options) 或 [NixOS Manual - Appendix A. Configuration Options](https://nixos.org/manual/nixos/stable/options.html) 查找包含属性和默认值。也可以通过在上述 repl 中输入 `nixos.config.x` 按 Tab 可以看到包含的属性。
    * `pkgs` 属性集，即 nixpkgs 声明的 nix package，据官网称，超过 80000 个，可以通过 [官方搜索站点](https://search.nixos.org/packages) 查找。也可以通过在上述 repl 中输入 `nixos.pkgs.x` 按 Tab 查看。
    * `options` 是对 `config` 选项的定义，包括数据类型，数据校验，默认值，描述说明等。
    * `system`  ???
    * `vm` ???
    * `vmWithBootLoader` ???
* 该函数返回 NixOS Module 配置的属性集，有两个选择：
    * 速记模式语法，即 `/etc/nixos/configuration.nix` 使用的模式，这个属性集本身代表就是一个 `config`，这种模式，在实现中会转换为标准语法，参见：[源码](https://github.com/NixOS/nixpkgs/blob/22.11/lib/modules.nix#L418)。
    * 标准语法，一般在定义 Module 时使用，返回一个包含 `config`、`options`、`imports` 等属性的属性集，例如： [sshd 服务模块源码](https://github.com/NixOS/nixpkgs/blob/22.11/nixos/modules/services/networking/ssh/sshd.nix)。

NixOS 配置相关源码也位于 [`NixOS/nixpkgs`](https://github.com/NixOS/nixpkgs) 代码库，结合代码可以得知 NixOS 加载配置的过程如下：

* 读取 `NIXOS_CONFIG` 环境变量指向的文件，或 `<nixos-config>` 文件（`/etc/nixos/configuration.nix`），获取用户配置的 NixOS Module （[nixpkgs/nixos/default.nix](https://github.com/NixOS/nixpkgs/blob/22.11/nixos/default.nix)）。
* 加载所有的 nixpkgs 所有的 NixOS Module (官方 Module) （[nixpkgs/nixos/modules/module-list.nix](https://github.com/NixOS/nixpkgs/blob/22.11/nixos/modules/module-list.nix)）。
* 根据如上两步获取的 Module 列表对 config 的配置，options 中声明的默认值，imports 中声明的依赖关系，生成最终的 `config` （[`nixpkgs/lib/modules.nix`](https://github.com/NixOS/nixpkgs/blob/22.11/lib/modules.nix)）。

最后 nixos-rebuild 会根据最终的 `config` 配置，配置操作系统，该步骤参见： [NixOS Manual - Chapter 69. What happens during a system switch?](https://nixos.org/manual/nixos/stable/index.html#sec-switching-systems)。

## nixos-rebuild 使用说明

nixos-rebuild 用于根据 `/etc/nixos/configuration.nix` 配置文件，应用到系统，常用的子命令如下：

* `switch` 使用最新的配置应用到系统中，并保证重启后保持。
* `test` 对配置进行构建，并立即应用到当前系统，下次启动后将回滚到之前的状态。
* `boot` 对配置进行构建，但是不立即应用到系统中，下次启动后再生效。
* `build` 只进行构建，并产生一个 result 软链指向最新的构建，但是不会对当前系统造成任何影响。

回滚通过如下选项触发：

* `--rollback` 如 `nixos-rebuild --rollback switch`。

如果想切换到任意版本，步骤如下：

* 使用 `sudo nix-env --list-generations --profile /nix/var/nix/profiles/system` 列出系统的所有版本。
* 使用如下命令切换版本（参见： [issue](https://github.com/NixOS/nixpkgs/issues/24374)）：

  ```bash
  sudo nix-env --switch-generation 12345 -p /nix/var/nix/profiles/system
  sudo /nix/var/nix/profiles/system/bin/switch-to-configuration switch
  ```

软件和系统更新：

```bash
# 只更新软件包。
sudo nixos-rebuild switch --upgrade
# 更新大版本：如有新版本替换如下链接（注意如果 Nix 数据库架构变更，可能升级后无法轻易撤销）。
sudo nix-channel --add https://nixos.org/channels/nixos-22.11 nixos
sudo nixos-rebuild switch --upgrade
# 自动更新配置
# system.autoUpgrade.enable = true;
# system.autoUpgrade.allowReboot = true;
# system.autoUpgrade.channel = https://nixos.org/channels/nixos-22.11;
```

## 相关站点

* [NixOS Manual](https://nixos.org/manual/nixos/stable/index.html)
* [NixOS Options Search](https://search.nixos.org/options)
* [github NixOS/nixpkgs -  nixpkgs/nixos](https://github.com/NixOS/nixpkgs/tree/master/nixos)
