---
title: "Nix 详解（六） 备忘单"
date: 2023-03-27T02:00:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> version: nix-2.14.1

## 命令

本部分仅记录本系列使用过的，以及一些常用的命令，更多细节参见：[官方手册 - 命令参考](https://nixos.org/manual/nix/stable/command-ref/command-ref.html)。

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

### nix repl

启动一个 nix 语言的交互式环境。

### nix-instantiate

执行一个 `.nix` 文件。

```bash
# 执行一个 nix 文件，并不会递归求值。
nix-instantiate --eval nix-lang-demo/01-hello.nix
# 执行一个 nix 文件，并递归求值，并将值以 json 格式打印，注意如果包含函数这种没法序列化为 json 的将报错。
nix-instantiate --eval nix-lang-demo/02-primitives-data-type.nix --strict --json
# 执行一个 nix 文件，要求该函数返回一个 derivation 类型，或者返回值为 derivation 类型的函数。
# 然后将 derivation 序列化到 /nix/store/$hash-$name.drv 文件。
nix-instantiate nix-lang-demo/12-derivation.nix
```

### nix show-derivation

```bash
# 将一个 /nix/store/$hash-$name.drv 转换为 json 格式，并输出。
nix --extra-experimental-features nix-command show-derivation $(nix-instantiate path/to/file.nix)
```

### nix-build

构建 derivation 并在当前目录创建指向 /nix/store 中 out 的软链 `result`。

该命令是 `nix-instantiate` 和 `nix-store --realise` 的一个包装器。

```bash
# 构建 nixpkgs 中属性为名为 go_1_19 的 derivation
nix-build '<nixpkgs>' -A go_1_19
# ls -l result
# lrwxrwxrwx  ...  result -> /nix/store/d18hyl92g30l...-go-1.19.3

# nix 表达式可以通过 -E 直接给出
nix-build -E 'with import <nixpkgs> { }; runCommand "foo" { } "echo bar > $out"'

# 可以从指定 url 的 channel 构建
nix-build https://github.com/NixOS/nixpkgs/archive/master.tar.gz -A hello
```

### nix-store

```bash
# 构建一个 /nix/store/$hash-$name.drv 文件。
nix-store -r $(nix-instantiate path/to/file.nix)
# 打印 /nix/store/$hash-$name.drv 构建过程日志。
nix-store --read-log $(nix-instantiate path/to/file.nix)

# 将一个 derivation 输出打包成 nar 包
nix-store --dump /nix/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1 > test.nar
# 将 test.nar 压缩为 test.nar.xz
# xz test.nar
# 将一个 derivation 的 nar 包导入当前机器
nix-store --import v02pl5dhayp8jnz8ahdvg5vi71s8xc6g.nar
# 查询一个 derivation 输出的 nar 包的 hash
nix-store -q --hash /nix/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1
# 查询一个 derivation 输出的 nar 包的 size
nix-store -q --size /nix/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1
# 查询一个 derivation 输出的直接依赖
nix-store -q --references /nix/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1
# 查询一个 derivation 输出的所有依赖（闭包）
nix-store -q --requisites /nix/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1
# 查询一个 derivation 输出对应的 drv文件
nix-store -q --deriver /nix/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1
# 生成签名用的 key
nix-store --generate-binary-cache-key binarycache.example.com cache-priv-key.pem cache-pub-key.pem

# 将一个 derivation 输出及其所有依赖导出到文件
nix-store --export $(nix-store -qR /nix/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1) > hello.closure
# 将一个 derivation 输出及其所有依赖导入到当前机器
nix-store --import < hello.closure
```

### nix-hash

生成 `nar` 和 `nar.xz` 等文件的 hash。

```bash
nix-hash --type sha256 --flat --base32 test.nar
```

### nix-copy-closure

将某个 `/nix/store/xxx` 目录及其依赖通过 ssh 协议拷贝到另一台机器。

```bash
nix-copy-closure --to alice@itchy.example.org /nix/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1
```

## 配置文件

单用户安装，路径 ~/.config/nix/nix.conf ，详见：[官方手册 - 配置文件](https://nixos.org/manual/nix/stable/command-ref/conf-file.html)。

```
# 二进制缓存服务
substituters = https://mirrors.tuna.tsinghua.edu.cn/nix-channels/store https://cache.nixos.org/
```

## 实验性特性

目前 (2023-04) nix 有一些实现性特性，本系列暂不介绍，仅在此列出，后续正式推出后再视情况整理介绍：

* `nix` 命令集，用来替代 `nix-xxx` 的命令，详见：[Nix manual - Nix](https://nixos.org/manual/nix/stable/command-ref/new-cli/nix.html)
* Flakes 以声明的方式指定位于代码仓库的依赖，详见：[NixOS Wiki - Flakes](https://nixos.wiki/wiki/Flakes)

## 参考

* [Awesome Nix](https://nix-community.github.io/awesome-nix/)
* [Nix Pills](https://nixos.org/guides/nix-pills)
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
* 二进制缓存
    * [Nix Wiki - Binary Cache](https://nixos.wiki/wiki/Binary_Cache)
    * [Nix Reference Manual - Sharing Packages Between Machines](https://nixos.org/manual/nix/stable/package-management/sharing-packages.html)
* 论文
    * [The Purely Functional Software Deployment Model](https://edolstra.github.io/pubs/phd-thesis.pdf)
    * [NixOS: A Purely Functional Linux Distribution](https://edolstra.github.io/pubs/nixos-icfp2008-final.pdf)
