---
title: "Nix 高级话题之 profile"
date: 2023-04-30T11:00:00+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---


> version: nix-2.23.2

## 简述

Nix profile （用户环境， user environments） 是 Nix 实现不同用户拥有不同的环境，实现环境回滚的底层机制。

和 Nix profile 有关命令的主要由 nix-env、 nix-collect-garbage、 nix-channel。

本文将介绍 Nix profile 的原理以及 nix-env、 nix-collect-garbage 详细用法和示例。

（ nix-channel 本文不做介绍，下一篇专门讨论）

## 原理

> [Nix 参考手册 - 6.1 Profiles](https://nix.dev/manual/nix/2.23/package-management/profiles)

### 基本结构和相关命令

![image](/image/nix-user-environments.png)

* nix 在使用 `sh <(curl -L https://nixos.org/nix/install) --no-daemon` 安装 Nix 时，会在用户的 shell profile （`~/.profile`） 中注入类似如下语句。

    ```bash
    if [ -e ~/.nix-profile/etc/profile.d/nix.sh ]; then . ~/.nix-profile/etc/profile.d/nix.sh; fi # added by Nix installer
    ```

* 执行 `nix-env -iA nixpkgs.hello` 安装一个包后，观察情况。
* 其中 `~/.nix-profile` 是一个软链，单用户模式，该软链指向 `~/.local/state/nix/profiles/profile`，而  `~/.local/state/nix/profiles/profile` 也是一个软链，指向同目录的 `profile-1-link`，而最终 `~/.local/state/nix/profiles/profile-1-link` 指向 nix store 中的一个 user-environments 目录，如 `/nix/store/197xfcwzc2xk6wkjyblc37grnpc3k4xk-user-environment` 。示意如下：

    ```
    ~/.nix-profile
      -> ~/.local/state/nix/profiles/profile
      -> ~/.local/state/nix/profiles/profile-2-link
      -> /nix/store/h1m8pdwqh0vj4xq6jr5cwlb21z9rprgb-user-environment
    ```

    * `~/.nix-profile` 是整个 nix profile 的入口文件，`nix-env --switch-profile` 命令的职责就是改变这个软链的指向，详见下文。
    * `~/.local/state/nix/profiles` 是单用户模式默认的 user profiles 的存储目录，包含一堆软链， `nix-env --install|--remove|--rollback|--switch-generation`、 `nix-channel` 等命令均会操作该目录，示意如下：

        ```
        channels -> channels-1-link
        channels-1-link -> /nix/store/197xfcwzc2xk6wkjyblc37grnpc3k4xk-user-environment
        profile -> profile-2-link
        profile-1-link -> /nix/store/mndsg7lyka8k7bsh3dxmrpk8rzcbkbr1-user-environment
        profile-2-link -> /nix/store/h1m8pdwqh0vj4xq6jr5cwlb21z9rprgb-user-environment
        ```

        * `nix-env --install|--remove` 完成安装卸载后，会生成一个新的 `/nix/store/xxx-user-environment`，然后创建一个 `~/.local/state/nix/profiles/profile-x-link` 软链，然后更新 `~/.local/state/nix/profiles/profile` 软链的指向。
        * `nix-env --rollback|--switch-generation` 执行后，将更新 `~/.local/state/nix/profiles/profile` 的指向。
        * `nix-channel` 命令和 `nix-env` 类似，会更新 `~/.local/state/nix/profiles/channels` 相关的文件，详见下一篇文章。

* 最终 `~/.nix-profile` 将指向 `/nix/store/xxx-user-environment`，该目录就是 nix 存储用户环境的路径。其目录和常规 Linux 的 `/usr/local` 结构类似，示例如下：

    ```
    /nix/store/h1m8pdwqh0vj4xq6jr5cwlb21z9rprgb-user-environment
    ├── bin
    │   ├── hello -> /nix/store/r8mfs49cp5q9l0q8zj2ab78h7gx2chfb-hello-2.12.1/bin/hello
    │   ├── nix -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/bin/nix
    │   ├── nix-build -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/bin/nix-build
    │   ├── nix-channel -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/bin/nix-channel
    │   ├── nix-collect-garbage -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/bin/nix-collect-garbage
    │   ├── nix-copy-closure -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/bin/nix-copy-closure
    │   ├── nix-daemon -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/bin/nix-daemon
    │   ├── nix-env -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/bin/nix-env
    │   ├── nix-hash -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/bin/nix-hash
    │   ├── nix-instantiate -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/bin/nix-instantiate
    │   ├── nix-prefetch-url -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/bin/nix-prefetch-url
    │   ├── nix-shell -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/bin/nix-shell
    │   └── nix-store -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/bin/nix-store
    ├── etc -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/etc
    ├── lib -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/lib
    ├── libexec -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/libexec
    ├── manifest.nix -> /nix/store/kbhbbkqbyq1ii3y5hclzsbzir82v87js-env-manifest.nix
    └── share
        ├── bash-completion -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/share/bash-completion
        ├── fish -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/share/fish
        ├── info -> /nix/store/r8mfs49cp5q9l0q8zj2ab78h7gx2chfb-hello-2.12.1/share/info
        ├── locale -> /nix/store/r8mfs49cp5q9l0q8zj2ab78h7gx2chfb-hello-2.12.1/share/locale
        ├── man
        └── zsh -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/share/zsh
    ```

    * 安装的 hello 可执行文件在 `bin/` 下存在一个软链。
    * `~/.profile` 中 source 的 `~/.nix-profile/etc/profile.d/nix.sh` 最终指向的就是该目录的 `etc/profile.d/nix.sh` 下。
    * [`manifest.nix`](https://nix.dev/manual/nix/2.23/command-ref/files/manifest.nix) 是一个 nix 代码文件，数据结构为 `derivation[]` （derivation 数组）， 记录了这个 profile 装的包列表的一些元信息，`nix-env --query --installed` 数据来源就是该文件，通过 `nix-instantiate --strict --eval  manifest.nix --json` 可以以 json 格式，获取到安装的包存储路径，从而可以获取更多信息，示例如下：

        ```bash
        nix-env -q --installed --json --out-path --drv-path --description --meta
        nix-instantiate --strict --eval  /nix/store/h1m8pdwqh0vj4xq6jr5cwlb21z9rprgb-user-environment/manifest.nix --json
        # ["/nix/store/r8mfs49cp5q9l0q8zj2ab78h7gx2chfb-hello-2.12.1","/nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2"]
        nix-store --query --deriver /nix/store/r8mfs49cp5q9l0q8zj2ab78h7gx2chfb-hello-2.12.1
        # /nix/store/c9v5d926q8d2cdb0jq6k3ybnxqdl3nb2-hello-2.12.1.drv 
        nix derivation show /nix/store/c9v5d926q8d2cdb0jq6k3ybnxqdl3nb2-hello-2.12.1.drv --extra-experimental-features nix-command
        # 略
        ```

### derivation outputs 和 profile

```bash
# 安装 gcc 标准编译器（nix wrapper）
nix-env -iA  nixpkgs.gcc13
# 观察 profiles 情况
tree -L 2  ~/.nix-profile/
# /home/rectcircle/.nix-profile/
# ├── bin
# │   ├── addr2line -> /nix/store/zansxqviinfh345skvpy5f0z58snr229-gcc-wrapper-13.3.0/bin/addr2line
# │   ├── ar -> /nix/store/zansxqviinfh345skvpy5f0z58snr229-gcc-wrapper-13.3.0/bin/ar
# │   ├── as -> /nix/store/zansxqviinfh345skvpy5f0z58snr229-gcc-wrapper-13.3.0/bin/as
# │   ├── c++ -> /nix/store/zansxqviinfh345skvpy5f0z58snr229-gcc-wrapper-13.3.0/bin/c++
# │   ├── cc -> /nix/store/zansxqviinfh345skvpy5f0z58snr229-gcc-wrapper-13.3.0/bin/cc
# │   ├── c++filt -> /nix/store/zansxqviinfh345skvpy5f0z58snr229-gcc-wrapper-13.3.0/bin/c++filt
# │   ├── cpp -> /nix/store/zansxqviinfh345skvpy5f0z58snr229-gcc-wrapper-13.3.0/bin/cpp
# │   ├── ...
# │   └── ...
# ├── etc -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/etc
# ├── lib -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/lib
# ├── libexec -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/libexec
# ├── manifest.nix -> /nix/store/0p5qf6srlcxp30vcyr9j7jcj4qhpjh9g-env-manifest.nix
# └── share
#     ├── bash-completion -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/share/bash-completion
#     ├── fish -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/share/fish
#     ├── info -> /nix/store/r8mfs49cp5q9l0q8zj2ab78h7gx2chfb-hello-2.12.1/share/info
#     ├── locale -> /nix/store/r8mfs49cp5q9l0q8zj2ab78h7gx2chfb-hello-2.12.1/share/locale
#     ├── man
#     └── zsh -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/share/zsh
nix-env -q --installed --out-path
# gcc-wrapper-13.3.0  man=/nix/store/l3nxj0c8zippk5aijmkndn0zh6j7h55s-gcc-wrapper-13.3.0-man;/nix/store/zansxqviinfh345skvpy5f0z58snr229-gcc-wrapper-13.3.0
# hello-2.12.1        /nix/store/r8mfs49cp5q9l0q8zj2ab78h7gx2chfb-hello-2.12.1
# nix-2.23.2          /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2
tree -L 3 /nix/store/l3nxj0c8zippk5aijmkndn0zh6j7h55s-gcc-wrapper-13.3.0-man
# /nix/store/l3nxj0c8zippk5aijmkndn0zh6j7h55s-gcc-wrapper-13.3.0-man
# └── share
#     └── man
#         ├── man1
#         └── man7
```

可以看出，derivation outputs 目录 `out` 和 `man` 的 `bin/`、`share/man`  都被正确的安装到了 `~/.nix-profile/` 目录。

```bash
nix-env -iA nixpkgs.libgcc
tree -L 2  ~/.nix-profile/
# 输出关键点如下
# /home/rectcircle/.nix-profile/
# ├── bin
# ├── ...
# ├── lib
# │   ├── libboost_context.so -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/lib/libboost_context.so
# │   ├── ...
# │   ├── libgcc_s.so -> /nix/store/pd8xxiyn2xi21fgg9qm7r0qghsk8715k-gcc-13.3.0-libgcc/lib/libgcc_s.so
# │   ├── libgcc_s.so.1 -> /nix/store/pd8xxiyn2xi21fgg9qm7r0qghsk8715k-gcc-13.3.0-libgcc/lib/libgcc_s.so.1
# │   ├── libnixcmd.so -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/lib/libnixcmd.so
# │   └── ...
# └── ...
```

可以看出，lib 目录变成了 nix 的 lib 以及 libgcc 的 lib 的聚合体。

最后，安装一下其他常见的 lib 库。

```bash
nix-env -iA nixpkgs.libz
nix-env -iA nixpkgs.libxcrypt
tree -L 2  ~/.nix-profile/
# 输出关键点如下
# /home/rectcircle/.nix-profile/
# ├── bin
# ├── ...
# ├── include
# │   ├── c++ -> /nix/store/zc0nsv23pakbafngjy32kvhfzb16as43-gcc-13.3.0/include/c++
# │   └── crypt.h -> /nix/store/gk0hrl9rngz3lfrnisql0h4xm65p036z-libxcrypt-4.4.36/include/crypt.h
# ├── lib
# │   ├── ...
# │   ├── libcrypt.so -> /nix/store/gk0hrl9rngz3lfrnisql0h4xm65p036z-libxcrypt-4.4.36/lib/libcrypt.so
# │   ├── libcrypt.so.2 -> /nix/store/gk0hrl9rngz3lfrnisql0h4xm65p036z-libxcrypt-4.4.36/lib/libcrypt.so.2
# │   ├── libcrypt.so.2.0.0 -> /nix/store/gk0hrl9rngz3lfrnisql0h4xm65p036z-libxcrypt-4.4.36/lib/libcrypt.so.2.0.0
# │   ├── ...
# │   ├── libz.so -> /nix/store/xnpg0ssr0hjrz8srf3saviy69w38rkhd-libz-1.2.8.2015.12.26-unstable-2018-03-31/lib/libz.so
# │   ├── libz.so.1 -> /nix/store/xnpg0ssr0hjrz8srf3saviy69w38rkhd-libz-1.2.8.2015.12.26-unstable-2018-03-31/lib/libz.so.1
# │   ├── libz.so.1.2.8 -> /nix/store/xnpg0ssr0hjrz8srf3saviy69w38rkhd-libz-1.2.8.2015.12.26-unstable-2018-03-31/lib/libz.so.1.2.8
# │   └── ...
# └── ...
```

可以看出，这些包的 include、lib 都安装到了正确的位置。

再验证一下已经安装了 gcc 的情况下再安装 clang。

```bash
nix-env -iA nixpkgs.clang_16
# 报错
# error: Unable to build profile. There is a conflict for the following files:

#          /nix/store/g2f50c20wy9ca6nd46d449v5gbzx4rwy-clang-wrapper-16.0.6/bin/addr2line
#          /nix/store/piz0jc0js7xnnka355n2yw07zj7p2hgq-gcc-wrapper-14.1.0/bin/addr2line
# error: builder for '/nix/store/1wqinfagy9lxqlanszck2fh5rsbkpxy4-user-environment.drv' failed with exit code 1
```

可以看出，如果两个包存在同名的二进制，将提示冲突。

总结，在执行 `nix-env --install` 时：

* derivation 的 outputs （实际上是 `meta.outputsToInstall`） 属性指向的目录，，会将其左右的子目录都正确的设置到 ~/.nix-profile/ 中。
* 多个包的 outputs 的子目录会进行合并合并逻辑为：如果安装的包的 outputs 的子目录没有没有重复的，则直接创建一个软链指向到这个子目录。如果存在存在重复的，则在 ~/.nix-profile/ 中创建这个目录，然后创建软链。

    ```bash
    # 安装了 nix，只有 nix 的 output 目录有 lib 目录，此时 lib 为：
    lib -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/lib

    # 安装了 nix 和 libgcc，这两个目录都有 lib 目录
    lib
    ├── libboost_context.so -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/lib/libboost_context.so
    ├── ...
    ├── libgcc_s.so -> /nix/store/pd8xxiyn2xi21fgg9qm7r0qghsk8715k-gcc-13.3.0-libgcc/lib/libgcc_s.so
    ├── libgcc_s.so.1 -> /nix/store/pd8xxiyn2xi21fgg9qm7r0qghsk8715k-gcc-13.3.0-libgcc/lib/libgcc_s.so.1
    ├── libnixcmd.so -> /nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2/lib/libnixcmd.so
    └── ...
    ```

* 如果最终存在冲突（比如：都需要安装 bin/addr2line），将报错。

最后再安装 libmysqlclient，来观察一下 outputs 包含 dev 的场景：

```bash
nix-env -iA nixpkgs.libmysqlclient
# ...
# copying path '/nix/store/p81agrmnhd2mm8hraqa52j3hl344bsjk-mariadb-connector-c-3.3.5' from 'https://cache.nixos.org' ...
# copying path '/nix/store/3j0l731cns49pzsffl3pfqini5yf4sqh-mariadb-connector-c-3.3.5-dev' from 'https://cache.nixos.org' ...
nix-env -q --installed --out-path
# ...
# mariadb-connector-c-3.3.5  /nix/store/p81agrmnhd2mm8hraqa52j3hl344bsjk-mariadb-connector-c-3.3.5
# ...
ls -al ~/.nix-profile/lib/
# ...
# mariadb -> /nix/store/p81agrmnhd2mm8hraqa52j3hl344bsjk-mariadb-connector-c-3.3.5/lib/mariadb
# ...
which mariadb_config
# mariadb_config not found
ls -al /nix/store/3j0l731cns49pzsffl3pfqini5yf4sqh-mariadb-connector-c-3.3.5-dev/bin
# mariadb_config
# mysql_config -> mariadb_config
ls -al ~/.nix-profile/bin/mariadb_config
# ls: cannot access '$HOME/.nix-profile/bin/mariadb_config': No such file or directory
```

可以发现 libmysqlclient derivation outputs 的 dev 目录的 `mariadb_config` 可执行文件并没有安装到 profiles 里面。从现象观察的结论是， `nix-env --install` 不会安装 derivation outputs 的 dev 目录。

如果想安装 dev 目录到 profile 中，需要强制指定 `nix-env -iA nixpkgs.libmysqlclient.dev nixpkgs.libmysqlclient.out` 都安装。

```bash
nix-env -iA nixpkgs.libmysqlclient.dev nixpkgs.libmysqlclient.out
nix-env -q --installed --out-path
# ...
# mariadb-connector-c-3.3.5  dev=/nix/store/3j0l731cns49pzsffl3pfqini5yf4sqh-mariadb-connector-c-3.3.5-dev
# mariadb-connector-c-3.3.5  /nix/store/p81agrmnhd2mm8hraqa52j3hl344bsjk-mariadb-connector-c-3.3.5
# ...
ls -al ~/.nix-profile/lib/
# ...
# mariadb -> /nix/store/p81agrmnhd2mm8hraqa52j3hl344bsjk-mariadb-connector-c-3.3.5/lib/mariadb
# ...
which mariadb_config
# /home/cloudide/.nix-profile/bin/mariadb_config
ls -al ~/.nix-profile/bin/mariadb_config
# $HOME/.nix-profile/bin/mariadb_config -> /nix/store/3j0l731cns49pzsffl3pfqini5yf4sqh-mariadb-connector-c-3.3.5-dev/bin/mariadb_config
```

### C 库 和 profile

> [Nix Wiki - C](https://nixos.wiki/wiki/C)

从上文可以看出，lib 和 include 已经正确的设置到 profile 中了，但是和 bin 不同。如果使用的不是 NixOS，而是在传统 Linux （如 debian） 中使用 Nix。上面的 profile 中的 lib include 将不会设置到系统中，因为如果设置了，会和系统的 lib 冲突，造成严重问题。

因此，如果想用 nix 管理 C/C++ 项目的依赖（即 include 头文件 和 lib 动态链接库 so），需要使用 Nix shell 声明依赖，并启动一个 shell，这个 shell 里面会设置 `NIX_CFLAGS_COMPILE` 以及 `NIX_LDFLAGS`。

然后使用 wrapper 的 C/C++ 编译器（如 `nixpkgs.gcc13`、 `nixpkgs.clang_16`），这样 C/C++ 编译器才能使用正确的识别 Nix 安装依赖。

详见： [Nix Wiki - C](https://nixos.wiki/wiki/C)。

## 命令详解

TODO
