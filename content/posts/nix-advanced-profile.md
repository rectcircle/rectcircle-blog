---
title: "Nix 高级话题之 profile"
date: 2024-07-17T21:48:00+08:00
draft: false
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

    这个脚本主要设置了 `PATH`、`MANPATH`、`XDG_DATA_DIRS` 环境变量，让命令，man 可以识别 nix 安装的包。

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
        nix-instantiate --strict --eval  ~/.nix-profile/manifest.nix --json
        # ["/nix/store/r8mfs49cp5q9l0q8zj2ab78h7gx2chfb-hello-2.12.1","/nix/store/af39xch7s21s36bd3j8gjssmcbhgm42y-nix-2.23.2"]
        nix-store --query --deriver /nix/store/r8mfs49cp5q9l0q8zj2ab78h7gx2chfb-hello-2.12.1
        # /nix/store/c9v5d926q8d2cdb0jq6k3ybnxqdl3nb2-hello-2.12.1.drv 
        nix derivation show /nix/store/c9v5d926q8d2cdb0jq6k3ybnxqdl3nb2-hello-2.12.1.drv --extra-experimental-features nix-command
        nix derivation show /nix/store/r8mfs49cp5q9l0q8zj2ab78h7gx2chfb-hello-2.12.1 --extra-experimental-features nix-command
        # 略
        ```

### derivation outputs 和 profile

> [Multiple-output packages](https://ryantm.github.io/nixpkgs/stdenv/multiple-output/)

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

可以看出，derivation outputs 目录 `out` 和 `man` 的 `bin/`、`share/man`  都被正确的安装到了 `~/.nix-profile/` 目录（默认是否安装到 profiles 中，是由 `meta.outputsToInstall` 属性控制的，默认应该是 `out`）。

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
cat ~/.nix-profile/manifest.nix
# [ { meta = { ...; outputsToInstall = [ "out" ]; ... }; name = "mariadb-connector-c-3.3.5"; ...; outputs = [ "out" ]; ... } ...]
nix-shell --pure -p libmysqlclient --run env | grep PATH
# stdenv=/nix/store/d3dzfy4amjl826fb8j00qp1d9887h7hm-stdenv-linux
# buildInputs=/nix/store/3j0l731cns49pzsffl3pfqini5yf4sqh-mariadb-connector-c-3.3.5-dev
# PATH=...:/nix/store/3j0l731cns49pzsffl3pfqini5yf4sqh-mariadb-connector-c-3.3.5-dev/bin:...
nix derivation show nixpkgs#libmysqlclient --extra-experimental-features 'nix-command flakes'
# {
#   "/nix/store/jnwpkqz0qx9cx7ljirsks5s4b5lxhmz7-mariadb-connector-c-3.3.5.drv": {
#     //...
#    "name": "mariadb-connector-c-3.3.5",
#    "inputDrvs": {
#      //...
#      "/nix/store/kjniqf3ladgc55nh4h41vrcwp3z7426b-zlib-1.3.1.drv": {
#        "dynamicOutputs": {},
#        "outputs": [
#          "dev"
#        ]
#      },
#      //...
#    }
#     "outputs": {
#       "dev": {
#         "path": "/nix/store/lzjh7kfbwhcslywmas0288w1k5k8zh93-mariadb-connector-c-3.3.5-dev"
#       },
#       "out": {
#         "path": "/nix/store/118ayny4nv1d687bgi4js46b40wg4md2-mariadb-connector-c-3.3.5"
#       }
#     },
#     //...
#   }
# }
nix-instantiate --eval --expr 'let pkgs = import <nixpkgs> {}; in pkgs.libmysqlclient.outputs'
# [ "out" "dev" ]
nix-instantiate --eval --expr 'let pkgs = import <nixpkgs> {}; in pkgs.zlib.outputs'
# [ "out" "dev" "static" ]

```

可以发现 libmysqlclient derivation outputs 是 `[ "out" "dev" ]`，但 `nix-env --install` 的 dev 目录的 `mariadb_config` 可执行文件并没有安装到 profiles 里面，也就是说安装的 `out` 输出。

libmysqlclient 这个包配置的 outputs 是 `[ "out" "dev" ]`，当执行 `nix-shell` shell 是，配置到 PATH 里的是 `/nix/store/3j0l731cns49pzsffl3pfqini5yf4sqh-mariadb-connector-c-3.3.5-dev/bin`，说明 `nix-shell` 引用的是 `dev` 输出。

如果想安装 dev 目录到 profile 中，需要强制指定 `nix-env -iA nixpkgs.libmysqlclient.dev nixpkgs.libmysqlclient.out` 都安装（特别提醒： **nix 似乎有 bug 一旦下面命令执行， profile 就损坏了！因此建议直接使用 nix-shell**）。

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
nix-env -iA nixpkgs.zlib
# 报错
# error: this derivation has bad 'meta.outputsToInstall'
cat ~/.nix-profile/manifest.nix
# [ { meta = { ...; outputsToInstall = [ "dev" ]; ... }; name = "mariadb-connector-c-3.3.5"; ...; outputs = [ "out" ]; ... } ...]
```


总结，在执行 `nix-env --install` 时：

* nixpkgs 声明的 derivation 都有一个 `meta.outputsToInstall` 属性（一般情况下为 `out` 或 `bin`），会将其指向的子目录都软链到 ~/.nix-profile/ 中。如果裸使用 `derivation`，没有配置 `meta.outputsToInstall`，nix-env 会安装所有的 outputs。
* 多个包的 outputs 的子目录会进行合并，合并是递归的进行：如果安装的包的 outputs 的子目录没有没有重复的，则直接创建一个软链指向到这个子目录。如果存在存在重复的，则在中创建这个目录，然后创建软链。

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

* 如果最终存在冲突（比如：gcc 和 clang 都需要安装 bin/addr2line），同时安装，将报错。有两点说明如下：
    * 默认情况， nix-env 安装的 pname 相同包时，旧的 pname 的包将被删除，并安装这个新的 pname 包（未找到相关文档，实测如此），执行 `nix-env --install` 时，可使用 `--preserve-installed` 阻止该行为，行为切换为报错冲突。
    * derivation 有一个 `meta.priority` 属性（[文档](https://nix.dev/manual/nix/2.22/command-ref/nix-env/install#description)），如果两个包的优先级相同，nix-env 安装存在冲突时，就会报错，如果安装一个优先级更高的包存在冲突时，这个包会覆盖之前安装的优先级地的包。`meta.priority` 的默认值为 `5`。另外，也可以通过 `nix-env --set-flag priority 数字` 调整已安装的包的优先级。
* nix-env --install 支持指定安装特定的 outputs，格式形如 `nixpkgs.libmysqlclient.dev`，但是，这样会破坏掉 profile ，导致后续安装任何的包都报错。原因是生成的 `manifest.nix` 中 `meta.outputsToInstall` 属性的值不包含在 `outputs` 属性中。
* 由于 nix 的包都是 nixpkgs 维护的，而关于 outputs 目录， nixpkgs 有如下如下约定：
    * 如果 outputs 有多个输出，`out` 目录一般放到最前面，例如 `[ "out" "dev" ]`。
    * `meta.outputsToInstall` 默认值规则为：如果 outputs 存在 bin 目录，则添加 bin；如果存在 out 目录，则添加 out；否则添加 outputs 的第一个。最后，如果存在 man，一定会 append man （详见：[源码](https://github.com/NixOS/nixpkgs/blob/4c68bf5473a8e87ffd94322cc3e79a449311325b/pkgs/stdenv/generic/check-meta.nix#L474)） 。
    * nixpkgs 的包维护者，可以按需选择 `outputs` 中的目录添加到 `meta.outputsToInstall` 中，一般情况下 dev 目录一般不会加到这个属性中。
    * 使用 nix-shell 或 nix-build 包的依赖是通过 `nixpkgs.lib.stdenv.mkDerivation` 的 buildInputs 声明时，如果这个依赖 outputs 包含 dev 时，实际依赖的是 dev 而非 out 目录。源码详见：[make-derivation.nix](https://github.com/NixOS/nixpkgs/blob/d2f01055afe920f3eb496dbc167b4918ebedfa21/pkgs/stdenv/generic/make-derivation.nix#L310) 和 [attrsets.nix](https://github.com/NixOS/nixpkgs/blob/master/lib/attrsets.nix#L1888)。
    * 关于 outputs 更多参见： [Nixpkgs Reference Manual - Multiple-output packages](https://nixos.org/manual/nixpkgs/stable/#chap-multiple-output) ，[博客 How to Learn Nix, Part 29: Derivations in detail](https://ianthehenry.com/posts/how-to-learn-nix/derivations-in-detail/)，[setenv.sh](https://github.com/NixOS/nixpkgs/blob/master/pkgs/stdenv/generic/setup.sh)。


### C 库 和 profile

> [Nix Wiki - C](https://nixos.wiki/wiki/C)

从上文可以看出，lib 和 include 已经正确的设置到 profile 中了，但是和 bin 不同。如果使用的不是 NixOS，而是在传统 Linux （如 debian） 中使用 Nix。上面的 profile 中的 lib include 将不会设置到系统中，因为如果设置了，会和系统的 lib 冲突，造成严重问题。

因此，如果想用 nix 管理 C/C++ 项目的依赖（即 include 头文件 和 lib 动态链接库 so），需要使用 Nix shell 声明依赖，并启动一个 shell，这个 shell 里面会设置 `NIX_CC_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu=1` 等 `NIX_CFLAGS_COMPILE` 以及 `NIX_LDFLAGS` （详见源码： [setup.sh](https://github.com/NixOS/nixpkgs/blob/63fb5880a4f67415f7baf4e2e789d326aa87bd95/pkgs/stdenv/generic/setup.sh)，[setup-hook.sh](https://github.com/NixOS/nixpkgs/blob/master/pkgs/build-support/cc-wrapper/setup-hook.sh)。

然后使用 wrapper 的 C/C++ 编译器（如 `nixpkgs.gcc13`、 `nixpkgs.clang_16`），这样 C/C++ 编译器才能使用正确的识别 Nix 安装依赖。

详见： [Nix Wiki - C](https://nixos.wiki/wiki/C)。

## 命令详解

> [Nix 参考手册 - 8.3.4 nix-env](https://nix.dev/manual/nix/2.22/command-ref/nix-env)

nix 通过 nix-env 命令来实现对 profile 的管理，本部分将详细介绍该命令的各种能力和细节。

### nix-env --delete-generations

删除 profile 的历史版本，示例如下：

* `nix-env delete-generations 1 2 3` 删除 profile 的 1、2、3 版本
* `nix-env --delete-generations old` 删除除了当前版本之外的所有的版本。
* `nix-env delete-generations 30d` 删除 30 天之前的版本。
* `nix-env delete-generations 5+` 保留当前版本之前的 5 个版本以及大于当前版本的版本，删除其他的版本。

### nix-env --install

安装一个或多个包 (derivation) 到 profile 中，语法如下：

```
nix-env {--install | -i} args… [{--prebuilt-only | -b}] [{--attr | -A}] [--from-expression] [-E] [--from-profile path] [--preserve-installed | -P] [--remove-all | -r]
```

安装包的各种写法如下：

```bash
# 最常见的写法（通过属性名安装 nixpkgs 的包）
nix-env -iA nixpkgs.python312
nix-env --install --attr nixpkgs.python312

# 根据 derivation 的 name 安装（这种方式需要评估所有 nixpkgs 的包，性能很差，不推荐用在 nixpkgs 的包的安装）
nix-env --install python3-3.12.3

# -A 和 -f 结合 channel
nix-env -iA nixpkgs.python312 -f ~/.nix-defexpr/
nix-env -iA nixpkgs.python312 -f ~/.nix-defexpr/channels
nix-env -iA python312 -f ~/.nix-defexpr/channels/nixpkgs

# -f 自定义 nix 表达式
# -f 文件，最终是一个 derivation
cat > /tmp/single-python.nix <<EOF
let pkgs = import <nixpkgs> {}; in pkgs.python312
EOF
nix-env -i -f /tmp/single-python.nix 
# -f 文件，最终是一个 derivation 列表
cat > /tmp/list-python.nix <<EOF
let pkgs = import <nixpkgs> {}; in [pkgs.python312]
EOF
nix-env -i -f /tmp/list-python.nix
# -f 文件，最终是一个属性集
cat > /tmp/attrset-python.nix <<EOF
let pkgs = import <nixpkgs> {}; in { python312 = pkgs.python312; }
EOF
nix-env -iA python312 -f /tmp/attrset-python.nix
# -f 文件最终函数声明为 a: derivation ，这里的 a 是一个属性集。
cat > /tmp/func-single-python.nix <<EOF
{ pkgs ? import <nixpkgs> {} }: pkgs.python312
EOF
# 实测，改为如下是不行的
# _: let pkgs = import <nixpkgs> {}; in pkgs.python312
nix-env -i -f /tmp/func-single-python.nix
# -f 文件最终函数声明为 a: derivation列表，这里的 a 是一个属性集。
cat > /tmp/func-list-python.nix <<EOF
{ pkgs ? import <nixpkgs> {} }: pkgs.python312
EOF
nix-env -i -f /tmp/func-list-python.nix
# -f 文件最终函数声明为 a: {} 这里的 a 是一个属性集。 （和 nixpkgs 原理相同）
cat > /tmp/func-attrset-python.nix <<EOF
{ pkgs ? import <nixpkgs> {} }: { python312 = pkgs.python312; }
EOF
nix-env -i -f /tmp/func-attrset-python.nix '.*' # 方式 0：可以通过 .* 安装属性集中的所有包。
nix-env -iA python312 -f /tmp/func-attrset-python.nix  # 方式 1
nix-env -iA python312 --arg pkgs 'import <nixpkgs> {}' -f /tmp/func-attrset-python.nix  # 方式 2: 验证覆盖函数参数
nix-env -i -E 'a: let mypkgs = a{}; in mypkgs.python312' -f /tmp/func-attrset-python.nix # 方式 3: 使用表达式参数

# 从表达式安装，这个表达式的必须是一个函数，声明为：
#   a: derivation { ... }
# 假设这个函数名为 f ，调用方式分为如下两种情况：
#   1. 不传递 -f 参数或者 -f 参数是一个 channel 的 user-environment 时：f { _combineChannels = [ ]; nixpkgs = import <nixpkgs>;  }
#   2. -f  参数传递的是一个包含 default.nix 的目录或压缩包下载链接，或者一个 .nix 源代码文件时：let a = import -f参数值; in f a
nix-env --install --from-expression 'a: let pkgs = a.nixpkgs{}; in pkgs.python312'
nix-env --install --from-expression 'a: let pkgs = a.nixpkgs{}; in pkgs.python312' -f ~/.nix-defexpr/channels
nix-env --install --from-expression 'nixpkgs: let pkgs = nixpkgs{}; in pkgs.python312' -f ~/.nix-defexpr/channels/nixpkgs/

# 直接通过 store path 或 store derivation path 安装。
nix-env -i $(nix-instantiate --expr 'let pkgs = import <nixpkgs> {}; in pkgs.python312')
```

默认情况， nix-env 安装的 pname 相同包时，旧的 pname 的包将被删除，并安装这个新的 pname 包，使用 `--preserve-installed` 参数检测这种情况并直接报错，示例如下：

```bash
nix-env -iA nixpkgs.python311
nix-env -iA nixpkgs.python312 --preserve-installed
# 报错: error: Unable to build profile. There is a conflict for the following files:
nix-env -iA nixpkgs.python312 
# replacing old 'python3-3.11.9'
# installing 'python3-3.12.3'
nix-env --query --installed
# 只会输出 python3-3.12.3，不会输出 python3.11
```

从其他 profile 中安装，可用于 copy 其他用户的 profile。

```bash
nix-env -iA python312 --from-profile /nix/store/xxx-user-environment
```

将包安装到其他的 nix-profile。

```bash
mkdir -p /tmp/myprofiles
nix-env -i -A nixpkgs.python312 nixpkgs.nix --profile /tmp/myprofiles/profile
ls -al /tmp/myprofiles
# profile -> profile-1-link
# profile-1-link -> /nix/store/3hb6nr0n05a2iwbxm0i50968mw2dd220-user-environment
```

重要参数总结，以及其他参数说明如下：

* `--prebuilt-only` / `-b` 只从 substitute 中安装与构建的包，永不从源码构建。
* `--remove-all` / `-r` 删除所有其他已安装的包，再执行安装，相当于首先运行 `nix-env --uninstall '.*'`，只不过一切都发生在单个事务中。
* `--file` / `-f` 从哪里获取 nix 表达式，有两种情况：
    * 不填，默认为 nix-channel 维护的 （[Nix 表达式搜索路径](https://nix.dev/manual/nix/2.22/command-ref/conf-file#conf-nix-path)） `~/.nix-defexpr/channels/`，详见后文 nix-channel 。
    * 可以是本地 nix 源代码文件，包含 default.nix 的目录或压缩包下载链接（如 github archive），要求其表达式类型推导最终的类型定义可以是如下六种情况：
        * `derivation`
        * `[]derivation` derivation 列表
        * `{}` 属性集。
        * `a: derivation` 函数，其中 a 是属性集。
        * `a: derivation[]` 函数，其中 a 是属性集。
        * `a: {}` 函数，其中 a 是属性集。
        * 以上 a 的一般写法为 `{ pkgs ? import <nixpkgs> {} }: ...` 包含默认值，如需自定义，可以使用 `--arg` 指定。
* `--from-expression` / `-E` 从表达式安装，这个表达式的必须是一个函数，声明为：
* `--attr` / `-A` 可以指定多个，用来指定要安装的包，这里的写法和 --file 参数有关。只有 `--file` / `-f` 的最终评估值是一个属性集时，才能使用该参数。
* `--profile` 安装到指定的 profile 必须是一个软链的路径。
* `--dry-run` 模拟执行。
* `-I` path，指定包搜索路径，可多次给出，也可以通过 `NIX_PATH` 环境变量配置，-I 优先级高于环境变量，默认为 `~/.nix-defexpr/channels/`，主要再如下场景使用：
    * nix 表达式语言的 `<nixpkgs>` 语法。
    * `nix-env --attr nixpkgs.python312` 语法。

    如上吗，底层都是用 [`builtins.findFile`](https://nix.dev/manual/nix/2.22/language/builtins#builtins-findFile)，原理是查找对应的目录，且该目录包含 `default.nix`。

### nix-env --list-generations

列出当前 profile 的所有版本。

### nix-env --query

查询包（derivation）信息，按 `name` 排序，语法如下：

```
nix-env {--query | -q} names… [--installed | --available | -a] [{--status | -s}] [{--attr-path | -P}] [--no-name] [{--compare-versions | -c}] [--system] [--drv-path] [--out-path] [--description] [--meta] [--xml] [--json] [{--prebuilt-only | -b}] [{--attr | -A} attribute-path]
```

有如下两种查询目标选择：

* `--installed` 查询已安装的包，该选项是默认的。
* `--available` 或 `-a` 查询 channel 中，可用的包的信息。

指定查询结构输出格式，默认为文本，可通过 `--xml`、`--json` 指定输出为 xml 或 json 格式。

```bash
nix-env --query --xml
# <?xml version='1.0' encoding='utf-8'?>
# <items>
#   <item attrPath="1" name="nix-2.24.0pre20240627_b44909ac" outputName="" pname="nix" system="x86_64-linux" version="2.24>
#     <output name="man" />
#     <output name="out" />
#   </item>
# ...
# </items>
nix-env --query --json
# {
#   "0": {
#     "name": "python3-3.12.3",
#     "outputName": "",
#     "outputs": {
#       "out": null
#     },
#     "pname": "python3",
#     "system": "x86_64-linux",
#     "version": "3.12.3"
#   },
#  ...
# }
```

其他选项说明如下：

* `--prebuilt-only` 或 `-b` 选项，只查询那些能从 substitute 中安装的包，永不从源码构建（主要和 `--available` 配合使用，主要为了过滤出那些可以快速安装的包）。
* `--status` 或 `-s` 选项，查询包的状态，状态包含 3 个字符
    * `I` 已安装到当前 profile。
    * `P` 已经保存到 store。
    * `S` 是否在 substitute 中有可用的预购建的产物。

    示例如下：

    ```bash
    nix-env --query --status
    #IPS  nix-2.24.0pre20240627_b44909ac
    #IPS  python3-3.12.3
    ```

* `--attr-path` 或 `-P` 选项，（仅能和 `--available` 一起使用）打印属性路径。
* `--no-name` 选项，不打印 `name`。
* `--compare-versions` 或 `-c` 选项，查询已安装的包的版本和 channel 中可用的包的版本的差异，主要用于检测是否有新版本，示例如下：

    ```bash
    nix-env --query --compare-versions
    # nix-2.24.0pre20240627_b44909ac  = 2.24.0pre20240627_b44909ac
    # python3-3.12.3                  < 3.13.0b3
    ```

* `--system` 选项，打印包的 system 字段。
* `--drv-path` 选项，打印 store derivation 路径。
* `--out-path` 选项，打印 derivation 的输出路径。
* `--description` 选项，打印 derivation 的 `meta.description` 属性。
* `meta` 选项，打印 derivation 的 `meta` 属性，该选项只能和 `--xml` 和 `--json` 一起使用。

### nix-env --rollback

将当前 profile 回滚到上一版本。

### nix-env --set-flag

修改已安装的包的 meta 下的属性，语法如下：

```bash
nix-env --set-flag name value drvnames
```

目前支持三个：

* `priority`，修改已安装包的 `meta.priority` 字段，影响安装存在冲突的包时的覆盖关系。

    ```bash
    nix-env -iA nixpkgs.gcc
    nix-env -iA nixpkgs.binutils
    nix-env --query binutils-wrapper --meta --json | grep priority
    #       "priority": 10,

    # 默认安装将失败
    nix-env -iA nixpkgs.gcc
    # error: Unable to build profile. There is a conflict for the following files:
    # 报错
    #          /nix/store/l46fjkzva0bhvy9p2r7p4vi68kr7a1db-binutils-wrapper-2.41/bin/addr2line
    #         /nix/store/mpm3i0sbqc9svfch6a17179fs64dz2kv-gcc-wrapper-13.3.0/bin/addr2line

    # 修改优先级后重新安装将成功
    nix-env --set-flag priority 1 binutils-wrapper
    nix-env --query binutils-wrapper --meta --json | grep priority
    #       "priority": "1",
    nix-env -iA nixpkgs.gcc
    nix-env --query gcc-wrapper-13.3.0 --meta --json | grep priority
    #      "priority": 10,
    ```

* `keep`，可以设置为 true 以防止包被升级或替换。如果您想保留旧版本的软件包，这非常有用。

    ```bash
    nix-env --set-flag keep true python3-3.12.3
    nix-env --query python3-3.12.3 --meta --json | grep keep
    ```

* `active`，可以设置为 false 以禁用该包。也就是说，不会生成包文件的符号链接，但它仍然是配置文件的一部分（因此不会被垃圾收集）。可以将其设置回 true 以重新启用该包。

    ```bash
    nix-env --install -A nixpkgs.python312
    which python
    # /home/rectcircle/.nix-profile/bin/python
    nix-env --set-flag active false python3-3.12.3
    which python
    # 找不到
    ```

### nix-env --set

设置 profile 指向一个特定的 derivation。

```
nix-env --set drvname
```

示例如下：

```bash
nix-env --set nix
nix-env --query
# 无输出
readlink -f 
# /nix/store/9b72q76kfi4v0vm08vrsdllw62wpb1ka-nix-2.24.0pre20240627_b44909ac

nix-env -iA nixpkgs.python312
which nix
# 无输出
```

可以看出：

* `--set` 参数实际上可以是 pname 也可以是 name。
* `--set` 执行 后直接把 profile 指向了 nix 这个包，并没有生成 user environments。
* 后续再执行 `--install`，上面的 `--set` 的包会丢失。

没有想到这个命令的用途，官方的示例是：

```bash
nix-env --profile /nix/var/nix/profiles/browser --set firefox
```

可能在 NixOS 场景有用吧。

### nix-env --switch-generation

将当前 profile 切换到指定的版本。语法如下：

```
nix-env {--switch-generation | -G} generation
```

本质上是修改 profile 软链指向软链的指向，即 `~/.nix-profile` 指向的文件 `~/.local/state/nix/profiles/profile` 指向新的 `profile-xxx-link`。

### nix-env --switch-profile

切换用户环境 profile，语法如下：

```
nix-env {--switch-profile | -S} path
```

`~/.nix-profile` 是整个 nix profile 的入口文件，该命令的职责就是改变这个软链的指向，详见下文。

### nix-env --uninstall

卸载包，语法如下：

```
nix-env {--uninstall | -e} drvnames…
```

示例如下：

```bash
nix-env --uninstall gcc-wrapper
# uninstalling 'gcc-wrapper-13.3.0'
# building '/nix/store/xmn76h44mpyh7s50slmfaqj1l89cmznw-user-environment.drv'...
nix-env -iA nixpkgs.gcc
nix-env --uninstall gcc-wrapper-13.3.0
# uninstalling 'gcc-wrapper-13.3.0'
# building '/nix/store/xmn76h44mpyh7s50slmfaqj1l89cmznw-user-environment.drv'...
```

可以看出：

* `--uninstall` 参数实际上可以是 pname 也可以是 name。
* 卸载操作也会生成一个新的版本，可用以 `--rollback` 回滚。

### nix-env --upgrade

升级一个包，语法如下：

```
nix-env {--upgrade | -u} args [--lt | --leq | --eq | --always] [{--prebuilt-only | -b}] [{--attr | -A}] [--from-expression] [-E] [--from-profile path] [--preserve-installed | -P]
```

可选择如下 4 种升级策略中一种：

* `--lt` 选项，默认值。将包升级到 channel 中 pname 相同的更新的版本，如果 channel 降级了，或版本号不变，则啥也不做。
* `--leq` 选项，channel 中同名 pname 的版本号大于等于该包，则升级到 channel 中这个版本。
* `--eq` 选项，channel 中同名 pname 的版本号等于该包，则升级到 channel 中这个版本，这种情况主要用来处理这个包本身没有变化，但是依赖有变化的场景。
* `--always` 选项，不管 channel 中同名 pname 的版本号是否变化，总是重新升级。

其他参数：

* `--prebuilt-only` 或 `-b` 选项，只升级那些能从 substitute 中安装的包，永不从源码构建。
* `--preserve-installed` 或 `-P` 选项，不清楚这个选项的意义，原文如下：Do not remove derivations with a name matching one of the derivations being installed. Usually, trying to have two versions of the same package installed in the same generation of a profile will lead to an error in building the generation, due to file name clashes between the two versions. However, this is not the case for all packages.

示例如下：

```bash
# 升级 gcc，指定了属性名（推荐，无需计算所有包，速度很快推荐）。
nix-env --upgrade --attr nixpkgs.gcc
# 升级 gcc，使用 panme （很慢，要计算 channel 中所有的包的 pname，然后匹配，和下面升级所有包速度一样慢）
nix-env --upgrade gcc-wrapper
# 升级所有包（很慢，要计算 channel 中所有的包）。
nix-env --upgrade --always
```
