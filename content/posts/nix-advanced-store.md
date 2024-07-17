---
title: "Nix 高级话题之 nix store"
date: 2024-06-17T01:50:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> version: nix-2.22.1

## 前言

Nix 存储是 Nix 系统其他能力（如 profile、channel、build 等）的基石。

只有理解了 Nix 存储，才能更好的理解 Nix 的理念，才能更好的理解 Nix 的其他能力，才能了解 Nix 的原理。

因此，本文将从概念、实现以及 nix-store 命令这几个方面介绍 Nix 存储。

## 概念

### 文件系统对象

Nix 作为一个编译系统，明确定义了其对文件系统的要求。Nix 使用文件系统的简化模型，该模型由文件系统对象组成。每个文件系统对象都是以下对象之一：

* 文件
    * 内容的可能为空的字节序列。
    * 代表是否可执行权限的单个布尔值。
* 目录：将名称映射到子文件系统的对象。
* 符号链接：任意字符串。 Nix 不会为符号链接分配任何语义。

文件系统对象及其子对象形成一棵树。文件或符号链接可以是根文件系统对象。

Nix 不编码任何其他文件系统概念，例如硬链接、权限、时间戳或其他元数据。因此， `ls -al /nix/store` 看到目录项的时间都是 `1970-01-01`。

### 存储对象

Nix 存储是存储对象的集合，它们之间具有引用关系。存储对象包括：

* 数据： 文件系统对象。
* 引用关系（依赖）： 一组存储路径作为对其他存储对象的引用。

存储对象是不可变的：一旦创建，它们就不会改变，直到被删除。

### 存储路径

Nix 将存储对象的引用实现为存储路径。

将存储路径视为不透明的唯一标识符：获取存储路径的唯一方法是添加或构建存储对象。存储路径将始终引用一个存储对象。

存储路径由如下两部分组成：

* 20 字节的 digest 作为 id。
* 供人阅读的具有含义的名字。

例如：

* Digest: mzg3cka0bbr5jq96ysymwziw74fnk22m
* Name: go-1.22.1

为了使存储对象可供操作系统进程访问，存储必须通过文件系统暴露存储对象。

存储路径在文件系统路径，由如下部分组成：

* 存储目录 (通常为 `/nix/store`)
* 路径分隔符 (`/`)
* 使用 base32 编码的 digest
* 中划线 (`-`)
* 名字

例如：

```
  /nix/store/mzg3cka0bbr5jq96ysymwziw74fnk22m-go-1.22.1
  |--------| |------------------------------| |-------|
store directory            digest               name
```

关于 digest 计算的算法，详见： [Nix 参考手册 - 10.3 Complete Store Path Calculation](https://nix.dev/manual/nix/2.22/protocols/store-path)

### 存储目录

每个 Nix 存储都有一个存储目录 (通常为 `/nix/store`)。

并非每个存储都可以通过文件系统访问。但是，如果存储具有文件系统表示形式，则存储目录包含，可以通过存储路径来寻址的存储的文件系统对象。

这意味着，存储路径不仅源自引用的存储对象本身，而且取决于存储对象所在的存储的存储路径 (通常为 `/nix/store`)。

给定存储对象属于哪个存储非常重要：存储对象中的文件可以包含存储路径，并且进程可以读取这些路径（如动态链接库路径）。 Nix 仅当存储路径不跨越存储边界时才能保证引用完整性。

因此，只有满足以下情况下之一的，才可以将存储对象复制到另一存储：

* 源存储和目标存储的存储目录匹配。
* 该存储对象没有引用，即不包含存储路径。

无法将存储对象复制到具有不同存储目录的存储。相反，它必须连同其所有依赖项一起重建。不使用替换文件内容中的存储目录字符串的原因是：这么做这可能会导致可执行文件的内部偏移量或校验和无效而无法使用。

### 关系

在 [《Nix 高级话题之 概念》](/posts/nix-advanced-glossary/) 文章中介绍了更多的概念/术语中，很多都与 Nix store 有关。这些术语的关系如下所示：

![image](/image/nix-store-glossary.svg)

## 存储类型

Nix 提供了多种 Nix 的实现，即多种存储类型，本部分将介绍其中常用的几种。

### Local Store

该类型是使用单用户模式 `--no-daemon` 安装 nix 时的默认存储类型（[nix.conf 的 store 为 auto](https://nix.dev/manual/nix/2.22/command-ref/conf-file.html#conf-store)）。

该类型的配置 URL 格式为（如下两种是等价的）：

* `local?root=/tmp/root`。
* `/tmp/root` （即一个绝对路径，作为 `root` 参数）。

注意，如上例，如果 `root` 参数配置为非 `/` 非空串时：

* nix 系统会使用 chroot （仅支持启用了 mount namespace 和 user namespace 的 Linux）来构建和运行程序。
* 物理的存储位置为 `/tmp/root/nix/store`。
* 元数据存储为之为 `/tmp/root/nix/var/nix/db`。

也可以通过 `store` 参数配置逻辑的存储目录为非 `/nix/store`，但是非常不建议这么做。如果这么做了，因为存储路径不同，将无法使用官方提供的 HTTP Binary Cache Store `https://cache.nixos.org/`，所有的依赖都要被重新构建。

更多详见： [Nix 参考手册 - 4.4.8 Local Store](https://nix.dev/manual/nix/2.22/store/types/local-store)。

### Local Daemon Store

该类型是使用多用户模式 `--daemon` 安装 nix 时的默认存储类型（[nix.conf 的 store 为 auto](https://nix.dev/manual/nix/2.22/command-ref/conf-file.html#conf-store)）。

该类型的配置 URL 格式示例如下：

* `unix:///nix/var/nix/daemon-socket/socket?root=`。

更多详见： [Nix 参考手册 - 4.4.7 Local Daemon Store](https://nix.dev/manual/nix/2.22/store/types/local-daemon-store)。

### Dummy Store

该类型主要用于调试 nix 表达式。

该类型的配置 URL 格式为： `dummy://`

用法例如： `nix eval --store dummy:// --expr '1 + 2'`。

更多详见： [Nix 参考手册 - 4.4.1 Dummy Store](https://nix.dev/manual/nix/2.22/store/types/dummy-store)。

### HTTP Binary Cache Store

该类型主要用于作为 [nix.conf 的 substituter 配置项](https://nix.dev/manual/nix/2.22/command-ref/conf-file.html#conf-substituters)，用来加速安装。

该类型的配置 URL 格式为： `http://...` 或 `https://...`

更多详见： [Nix 参考手册 - 4.4.5 HTTP Binary Cache Store](https://nix.dev/manual/nix/2.22/store/types/http-binary-cache-store)。

### Local Overlay Store （实验性）

该类型由 [replit](https://replit.com/) 贡献，主要用于基于分布式文件系统的 store 作为 overlayfs 的 lower，实现 nix 软件包秒安装。

配置示例如下 `~/.config/nix/nix.conf`：

```
substituters = https://cache.nixos.org/
sandbox = false
store = local-overlay://?lower-store=%2Fnix-lower%3Fread-only%3Dtrue&upper-layer=/nix-store-upper&check-mount=false
extra-experimental-features = nix-command flakes local-overlay-store read-only-local-store
gc-reserved-space = 0
```

* store 的 `local-overlay://` 表示使用 Local Overlay Store，配置参数说明入选。
    * lower-store 作为 overlayfs /nix/store 的 lowerdir 所在的 nix store 的配置字符串，这里配置为 `/nix-lower?read-only=true`，即 lower-store 为一个 local store，其 root 参数为 `/nix-lower`，参见上文。
    * upper-layer 作为 overlayfs /nix/store 的 upperdir 所在的目录，这里配置为 `/nix-store-upper`。
    * check-mount 配置为 false，表示不检查 mount 是否成功。
* extra-experimental-features 中必须添加 `local-overlay-store`，因为该类型为实现性特性。

下面是一个 docker 模拟的示例：

* 在宿主机上采用单用户模式安装 nix，并通过 nix-env 安装了 go。
* 在宿主机构造一个 overlayfs，其 lowerdir 为 `/nix/store`，upperdir 为宿主机的一个空目录，并经这个 overlayfs mount 到容器的 `/nix/store`。
* 将宿主机的 `/nix` 整个目录挂载到容器的 `/nix-lower`，配置容器中 nix 存储类型为 Local Overlay Store，将 `/nix-lower` 配置到 `lower-store` 参数中。
* docker exec 进入容器后，通过 nix-env 安装 go，可实现秒装。

相关命令如下：

```bash
# 在宿主机安装 nix，并 nix-env 安装 go，参考：
bash <(curl -L https://nixos.org/nix/install) --no-daemon
nix-env -iA nixpkgs.go

# 准备要挂载到 /nix/store 的 overlayfs
# 使用 root 执行
rm -rf /tmp/nix-local-overlay/nix-store-upper
mkdir -p /tmp/nix-local-overlay/nix-store-upper /tmp/nix-local-overlay/nix-store-work /tmp/nix-local-overlay/nix-store-merged
mount -t overlay overlay -o lowerdir=/nix/store,upperdir=/tmp/nix-local-overlay/nix-store-upper,workdir=/tmp/nix-local-overlay/nix-store-work /tmp/nix-local-overlay/nix-store-merged

# 创建容器
docker rm -f nix-local-overlay
# 在宿主机安装 nix，并通过 nix-env 安装 go
# docker 使用 busybox:latest 镜像，启动 nix-local-overlay 镜像
# --security-opt 必须加，否则会报错 error: Operation not permitted
docker run --security-opt seccomp=unconfined --user root -d --name nix-local-overlay -v /nix:/nix-lower/nix:ro -v /tmp/nix-local-overlay/nix-store-upper:/nix-store-upper -v /tmp/nix-local-overlay/nix-store-merged:/nix/store busybox:latest tail -f /dev/null

# 进入容器验证
docker exec -it nix-local-overlay sh
# 添加用户（-u 指定的 uid 必须和宿主机的一致）
adduser -u 1000 nix # 输入密码
chown nix:nix /nix /nix/store
su nix
cd ~
touch ~/.profile
# 安装
wget https://nixos.org/nix/install
sh install --no-daemon
source ~/.profile
which nix
# 配置
mkdir -p ~/.config/nix && cat > ~/.config/nix/nix.conf <<EOF
substituters = https://cache.nixos.org/
sandbox = false
store = local-overlay://?lower-store=%2Fnix-lower%3Fread-only%3Dtrue&upper-layer=/nix-store-upper&check-mount=false
extra-experimental-features = nix-command flakes local-overlay-store read-only-local-store
gc-reserved-space = 0
EOF
# 验证 nix 相关命令
nix eval  --expr '1 + 2'
nix-channel --update
nix-env -iA nixpkgs.go # 秒装
# 去宿主机看，upper 层没有 go，直接复用 lower 的
ls -al /tmp/nix-local-overlay/nix-store-upper
```

## `nix-store 命令`

> [Nix 参考手册 - 8.3.3 nix-store](https://nix.dev/manual/nix/2.22/command-ref/nix-store)

nix-store 命令是 Nix 的主要命令之一，它提供了对 Nix 存储的访问。

该命令是相对底层原始的操作，对于一般用户来说，这个命令一般不需要使用，而是由如 nix-env、nix-channel 等命令间接调用。

### `nix-store --add-fixed`

```bash
nix-store --add-fixed [--recursive] algorithm paths…
```

`--add-fixed` 操作将指定路径添加到 Nix 存储。与 `--add` 不同，路径是使用指定的哈希算法注册的，从而产生与 ixed-output derivation（固定输出派生）相同的输出路径。这可用于无法从公共 URL 获取，或在编写下载表达式后损坏的源。

* `algorithm` 可选值 'md5', 'sha1', 'sha256', or 'sha512'。
* `--recursive` 使用递归（序列化为 nar 后再序列化）而不是平面（）散列模式，在将目录添加到存储时使用。

示例如下：

```bash
echo abcd > abc.txt
nix-store --add-fixed --recursive sha256 abc.txt
# 输出: /nix/store/6g0r26al9a8bg84ny9v7d42xcamyjrhx-abc.txt
# 等价于: 
# nix-store --add abc.txt
# nix --extra-experimental-features nix-command store add abc.txt
# nix --extra-experimental-features nix-command store add abc.txt --mode nar --hash-algo sha256
```

### `nix-store --add`

```bash
nix-store --add paths…
```

等价于 `nix-store --add-fixed --recursive sha256 paths…`

### `nix-store --delete`

```bash
nix-store --delete [--ignore-liveness] paths…
```

`--delete` 操作从 Nix 存储中删除存储路径，但前提是这样做是安全的；也就是说，当从垃圾收集器的根无法到达该路径时。这意味着您只能删除也会被 `nix-store --gc` 删除的路径。因此，`--delete` 是 `--gc` 的更有针对性的版本。

使用选项 `--ignore-liveness`，会忽略来自根的可达性。但是，如果存储中有其他路径引用该路径（即依赖于它），该路径仍然不会被删除。

示例如下：

```bash
nix-store --delete /nix/store/6g0r26al9a8bg84ny9v7d42xcamyjrhx-abc.txt
```

### `nix-store --gc`

```bash
nix-store --gc
```

运行垃圾回收，详见： [官方文档](https://nix.dev/manual/nix/2.22/command-ref/nix-store/gc)。

### `nix-store --dump-db`

```bash
nix-store --dump-db [paths…]
```

导出指定存储路径的 Nix database 到标准输出。

* 如果 `paths...` 参数不给出，则备份整个数据库。
* 如果 `paths...` 给出，则备份每个 `path` 的元信息以及直接依赖（注意不是全部依赖，即不是闭包，如果想导出整个闭包的关系，则需要用户把这个闭包的所有 `paths...` 给出）。

示例如下：

```bash
# 导出 nix 命令所在存储对象的元信息（直接依赖关系）
nix-store --dump-db $(which nix) > nix-single.reginfo
cat nix-single.reginfo
# 导出 nix 命令所在存储对象整个闭包的元信息（直接依赖关系）（nix 安装包里面的 `.reginfo` 文件就是类似的方式导出的）
nix-store --dump-db $(nix-store --query --requisites $(which nix)) > nix-closure.reginfo
cat nix-closure.reginfo
```

每个 path 的元信包含如下内容：

* 存储路径，如： `/nix/store/6sfq258683sg0idsm9c5877pfm3q4y27-nix-2.22.1`
* 存储路径对应 nar 文件的 hash 值，如： `6cde735c35b3b6a49591f938102bbcf287efd77039191d8b857457e5d8377db0`
* 存储路径对应 nar 文件的文件大小，如： `19398944`。
* 空行
* 引用（直接依赖）的数量，如： `18`
* 所有引用（直接依赖）的存储路径，每个一行，如： `/nix/store/1rkhjf55x59w6qm1pbhf80ks2wjpg973-libcpuid-0.6.4` 等。

### `nix-store --load-db`

```bash
nix-store --load-db < nix-closure.reginfo
```

`--load-db` 操作从标准输入读取 `--dump-db` 创建的 Nix 数据库转储并将其加载到 Nix 数据库中。

nix 安装包中的安装脚本 database 的初始化就是通过该命令实现的。

### `nix-store --dump`

```bash
nix-store --dump path
```

`--dump` 操作生成一个 NAR (Nix ARchive) 文件，其中包含以 `path` 参数为根的文件系统树的内容。存档被写入标准输出。

NAR 类似于 tar，但是其是根据上文[文件系统对象](#文件系统对象)协议优化过的格式，并且会对目录项进行排序，因此同一个目录 `--dump` 生成的 NAR 的文件的内容是完全相同，事实上，存储在 Nix 数据库中的存储路径的哈希值（请参阅 `nix-store --query --hash`）是每个存储路径的 NAR 转储的 SHA-256 哈希值。

示例如下：

```bash
nix-store --dump $(readlink $(which nix))/../.. > nix.nar
```

NAR 文件格式，详见：[Nix Archive (NAR) format](https://nix.dev/manual/nix/2.22/protocols/nix-archive)。

### `nix-store --restore`

```bash
nix-store --restore path
```

`--restore` 操作将 NAR 存档解包到 `path`，该路径必须不存在。存档是从标准输入读取的。

示例如下：

```bash
nix-store --restore nix-nar-unpack < nix.nar
tree -L 1 nix-nar-unpack # 输出如下：
# nix-nar-unpack
# ├── bin
# ├── etc
# ├── lib
# ├── libexec
# └── share
```

### `nix-store --export`

```
nix-store --export paths…
```

`--export` 操作，将指定存储路径的序列化写入标准输出，其格式可以使用 `nix-store --import` 导入到另一个 Nix 存储中（包含数据和引用关系）。

这类似于 `nix-store --dump`，和 `nix-store --dump` 不同的是：

* `nix-store --dump` 命令生成的 NAR 存档只数据，不包含允许将其导入另一个 Nix 存储（即路径引用集）所需的元信息（引用关系、nar 的 hash 等）。
* `nix-store --export` 命令生成的序列化，包含数据和元信息。

也就是说 `nix-store --export` 是将每个 `--dump-db` 和 `--dump` 的职责合二为一了，生成的一种序列化格式。

示例如下：

```bash
# 导出 nix 命令所在存储对象的数据内容以及元信息
nix-store --export $(which nix) > nix-single-export.storeobject
# 导出 nix 命令所在存储对象的所有闭包存储路径的数据内容以及元信息
nix-store --export $(nix-store --query --requisites $(which nix)) > nix-closure-export.storeobject
```

### `nix-store --import`

```bash
nix-store --import
```

`--import` 操作从标准输入读取 nix-store --export 生成的一组存储路径的序列化，并将这些存储路径添加到 Nix 存储中。 Nix 存储中已存在的路径将被忽略。如果一个路径引用 Nix 存储中不存在的另一个路径，则导入失败。

示例如下：

```bash
# 导入 nix 命令所在存储对象的数据内容以及元信息
nix-store --import < nix-closure-export.storeobject
```

### `nix-store --generate-binary-cache-key`

```bash
nix-store --generate-binary-cache-key key-name secret-key-file public-key-file
```

生成用于二进制缓存的密钥对，详见：

* [官方文档](https://nix.dev/manual/nix/2.22/command-ref/nix-store/generate-binary-cache-key)。
* [Wiki](https://nixos.wiki/wiki/Binary_Cache)。

### `nix-store --optimise`

```bash
nix-store --optimise
```

`--optimise` 操作通过在存储中查找相同的文件并将它们彼此硬链接来减少 Nix 存储磁盘空间的使用。它通常会将存储的规模缩小 25-35% 左右。只有常规文件和符号链接才能以这种方式进行硬链接。当文件具有相同的 NAR 存档序列化时，文件被视为相同：也就是说，常规文件必须具有相同的内容和权限（可执行或不可执行），并且符号链接必须具有相同的内容。

完成后或命令中断时，将在标准错误上打印有关所实现节省的报告。

使用 -vv 或 -vvv 获取一些进度指示。

示例如下：

```bash
nix-store --optimise # 输出如下
# 14.74 MiB freed by hard-linking 1622 files
```

### `nix-store --print-env`

```bash
nix-store --print-env drvpath
```

操作 --print-env 以 shell 可以评估的格式打印出派生的环境。构建器的命令行参数放置在变量 `_args` 中。

```bash
nix-instantiate -A hello  ~/.nix-defexpr/channels/nixpkgs  # 输出如下
# /nix/store/amplsdcav0g3qp9srkkfnqlkr8zc3sn8-hello-2.12.1.drv
nix-store --print-env $(nix-instantiate -A hello ~/.nix-defexpr/channels/nixpkgs) # 输出类似如下：
# export __structuredAttrs; __structuredAttrs=''

# export buildInputs; buildInputs=''

# export builder; builder='/nix/store/a1s263pmsci9zykm5xcdf7x9rv26w6d5-bash-5.2p26/bin/bash'

# export cmakeFlags; cmakeFlags=''

# ...

# export system; system='x86_64-linux'

# export version; version='2.12.1'

# export _args; _args=''-e' '/nix/store/v6x3cs394jgqfbi0a42pam708flxaphh-default-builder.sh''
```

### `nix-store --realise`

```bash
nix-store {--realise | -r} paths… [--dry-run]
```

构建或获取存储对象。

每个路径的处理如下：
* 如果路径指向存储派生：
    * 如果无效（不存在），则从 substituter（如二进制缓存） 获取存储派生文件本身。
    * 实现其输出路径：
        * 尝试从 substituter（如二进制缓存） 获取与存储派生闭包中的输出路径关联的存储对象。
            * 使用内容寻址派生（实验性）：通过查询 Nix 数据库中的内容寻址实现条目来确定要实现的输出路径。
        * 对于任何 substituter 中找不到的存储路径，则通过构建生成所需的存储对象：
            * Realise 推导依赖项的所有输出
            * 运行派生的 `builder` 生成可执行文件
* 否则，如果路径无效：尝试从 substituter 中获取路径闭包中关联的存储对象。

如果没有可用的 substitutes 并且没有给出存储推导，则失败。

生成的路径打印在标准输出上。对于非派生参数，将打印参数本身。

错误码详见：[文档](https://nix.dev/manual/nix/2.22/command-ref/nix-store/realise#special-exit-codes-for-build-failure)。

示例如下：

```bash
nix-instantiate -A hello  ~/.nix-defexpr/channels/nixpkgs  # 输出如下
# /nix/store/amplsdcav0g3qp9srkkfnqlkr8zc3sn8-hello-2.12.1.drv
nix-store --realise $(nix-instantiate -A hello  ~/.nix-defexpr/channels/nixpkgs)
```

### `nix-store --read-log`

```bash
nix-store {--read-log | -l} paths…
```

`--read-log` 操作将在标准输出上打印指定存储路径的构建日志。构建日志是派生构建者写入标准输出和标准错误的任何内容。如果存储路径不是派生，则使用存储路径的派生者。

构建日志保存在 /nix/var/log/nix/drvs 中。但是，不能保证构建日志可用于任何特定的存储路径。例如，如果路径是通过替代品作为预构建的二进制文件下载的，则日志不可用。

示例如下：

```bash
nix-store --read-log $(nix-store --realise $(nix-instantiate -A hello  ~/.nix-defexpr/channels/nixpkgs))
# error: build log of derivation '/nix/store/dbghhbq1x39yxgkv3vkgfwbxrmw9nfzi-hello-2.12.1' is not available
```

### `nix-store --verify-path`

```bash
nix-store --verify-path paths…
```

`--verify-path` 操作将给定存储路径的内容与存储在 Nix 数据库中的加密哈希值进行比较。对于每个更改的路径，它都会打印一条警告消息。如果路径没有更改，则退出状态为 0，否则为 1。

### `nix-store --repair-path`

```bash
nix-store --repair-path paths…
```

从 substituter 重新下载路径。

操作 `--repair-path` 尝试通过使用可用的替代程序重新下载指定的路径来“修复”它们。如果没有可用的替代品，则无法进行修复。

示例如下：

```bash
hellow_out_path=$(nix-store --realise $(nix-instantiate -A hello  ~/.nix-defexpr/channels/nixpkgs))
nix-store --verify-path $hellow_out_path
```

### `nix-store --verify`

```bash
nix-store --verify [--check-contents] [--repair]
```

`--verify` 操作验证 Nix 数据库的内部一致性，以及 Nix 数据库和 Nix 存储之间的一致性。遇到的任何不一致都会自动修复。不一致通常是由非 Nix 工具修改 Nix 存储或数据库或 Nix 本身的错误造成的。

该操作有以下选项：
* `--check-contents` 通过计算内容的 SHA-256 哈希并将其与构建时存储在 Nix 数据库中的哈希进行比较，检查每个有效存储路径的内容是否未被更改。打印出已修改的路径。对于大型存储来说，`--check-contents` 显然相当慢。
* `--repair` 如果存储中缺少任何有效路径，或者（如果给出了 `--check-contents`）有效路径的内容已被修改，则尝试通过重新下载来修复路径。详见上文 `nix-store --repair-path`。

### `nix-store --serve`

```bash
nix-store --serve [--write]
```

操作 `--serve` 通过 stdin 和 stdout 提供对 Nix 存储的访问，旨在用作向受限 ssh 用户提供 Nix 存储访问的一种方法。

* `--write` 允许连接的客户端请求实现派生。实际上，这可以用来使主机充当远程构建器。

详见： [SSH Store](https://nix.dev/manual/nix/2.22/store/types/ssh-store)

### `nix-store --query`

```bash
nix-store {--query | -q} {--outputs | --requisites | -R | --references | --referrers | --referrers-closure | --deriver | -d | --valid-derivers | --graph | --tree | --binding name | -b name | --hash | --size | --roots} [--use-output] [-u] [--force-realise] [-f] paths…
```

`--query` 操作显示有关存储路径的各种信息。查询描述如下。最多可以指定一个查询。默认查询是 `--outputs`。

示例准备工作

```bash
### 准备
PAGER=
hellow_drv_path=$(nix-instantiate -A hello  ~/.nix-defexpr/channels/nixpkgs)
echo $hellow_drv_path
# /nix/store/amplsdcav0g3qp9srkkfnqlkr8zc3sn8-hello-2.12.1.drv
hellow_out_path=$(nix-store --realise $hellow_drv_path)
echo $hellow_out_path
# /nix/store/dbghhbq1x39yxgkv3vkgfwbxrmw9nfzi-hello-2.12.1
```

#### 查询输出路径

`--outputs`

```bash
nix-store --query --outputs $hellow_drv_path
# /nix/store/dbghhbq1x39yxgkv3vkgfwbxrmw9nfzi-hello-2.12.1
nix-store --query --outputs $hellow_out_path
# /nix/store/dbghhbq1x39yxgkv3vkgfwbxrmw9nfzi-hello-2.12.1
```

#### 查询闭包

`--requisites`

```bash
nix-store --query --requisites $hellow_drv_path
# /nix/store/001gp43bjqzx60cg345n2slzg7131za8-nix-nss-open-files.patch
# /nix/store/00qr10y7z2fcvrp9b2m46710nkjvj55z-update-autotools-gnu-config-scripts.sh
# ...
# /nix/store/lbskcsypzh48m1mv2nbz23k0c2s0k451-hello-2.12.1.tar.gz.drv
# /nix/store/amplsdcav0g3qp9srkkfnqlkr8zc3sn8-hello-2.12.1.drv
nix-store --query --requisites $hellow_out_path
# /nix/store/7n0mbqydcipkpbxm24fab066lxk68aqk-libunistring-1.1
# /nix/store/rxganm4ibf31qngal3j3psp20mak37yy-xgcc-13.2.0-libgcc
# /nix/store/s32cldbh9pfzd9z82izi12mdlrw0yf8q-libidn2-2.3.7
# /nix/store/ddwyrxif62r8n6xclvskjyy6szdhvj60-glibc-2.39-5
# /nix/store/dbghhbq1x39yxgkv3vkgfwbxrmw9nfzi-hello-2.12.1
```

#### 查询引用

`--references`

直接依赖

```bash
nix-store --query --references $hellow_drv_path
# /nix/store/v6x3cs394jgqfbi0a42pam708flxaphh-default-builder.sh
# /nix/store/qkh75fn6sickg70qhdn7j1486ydzfb9i-bash-5.2p26.drv
# /nix/store/0c983id41frc440gzr45y3sm5hfpx4lb-stdenv-linux.drv
# /nix/store/lbskcsypzh48m1mv2nbz23k0c2s0k451-hello-2.12.1.tar.gz.drv
nix-store --query --references $hellow_out_path
# /nix/store/ddwyrxif62r8n6xclvskjyy6szdhvj60-glibc-2.39-5
# /nix/store/dbghhbq1x39yxgkv3vkgfwbxrmw9nfzi-hello-2.12.1
```

#### 查询被引用者

`--referrers`

打印存储路径的引用者集，即 Nix 存储中当前存在的引用其中一个路径的存储路径。请注意，与引用相反，引用者集不是恒定的；它可以随着存储路径的添加或删除而改变。

```bash
nix-store --query --referrers $hellow_drv_path
# 无输出
nix-store --query --referrers $hellow_out_path
# 无输出
```

#### 查询被引用者闭包

`--referrers-closure`

```bash
nix-store --query --referrers-closure $hellow_drv_path
# 无输出
nix-store --query --referrers-closure $hellow_out_path
# 无输出
```

#### 查询派生者

`--deriver; -d`

打印用于构建存储路径的派生程序。如果路径没有派生者（例如，如果它是源文件），或者如果派生者未知（例如，在仅二进制部署的情况下），则打印字符串unknown-deriver。不保证返回的派生程序存在于本地存储中，例如当从二进制缓存替换路径时。使用 `--valid-derivers` 来仅获取有效路径。

```bash
nix-store --query --deriver $hellow_drv_path
# unknown-deriver
nix-store --query --deriver $hellow_out_path
# /nix/store/4h712p20bpisada9lir5nyd073ybs7nw-hello-2.12.1.drv
```

#### 查询验证的派生者

`--valid-derivers`

打印一组派生文件 (.drv)，这些文件在实现时应该生成所述路径。可能不打印任何内容，例如源路径或从二进制缓存替换的路径。

```bash
nix-store --query --valid-derivers $hellow_drv_path
# 无输出
nix-store --query --valid-derivers $hellow_out_path
# /nix/store/amplsdcav0g3qp9srkkfnqlkr8zc3sn8-hello-2.12.1.drv
```

#### 查询输出 Graphviz 依赖图

`--graph`

以 [AT&T Graphviz 包](http://www.graphviz.org/)的 dot 工具的格式打印存储路径的引用图。这可用于可视化依赖图。要获取构建时依赖图，请将其应用于存储派生。要获取运行时依赖关系图，请将其应用于输出路径。

```bash
nix-store --query --graph $hellow_drv_path
# dot 绘图文件源码
nix-store --query --graph $hellow_out_path
# dot 绘图文件源码，渲染出，如下图所示
```

![image](/image/nix-hello-graphviz.svg)

#### 查询打印依赖树

`--tree`

将存储路径的引用图打印为嵌套 ASCII 树。参考文献按闭合尺寸降序排列；这往往会使树变平，使其更具可读性。查询仅在第一次遇到时递归到存储路径；这可以防止图的树表示的放大。

```bash
nix-store --query --tree $hellow_drv_path
# 略
nix-store --query --tree $hellow_out_path
# /nix/store/dbghhbq1x39yxgkv3vkgfwbxrmw9nfzi-hello-2.12.1
# ├───/nix/store/ddwyrxif62r8n6xclvskjyy6szdhvj60-glibc-2.39-5
# │   ├───/nix/store/rxganm4ibf31qngal3j3psp20mak37yy-xgcc-13.2.0-libgcc
# │   ├───/nix/store/s32cldbh9pfzd9z82izi12mdlrw0yf8q-libidn2-2.3.7
# │   │   ├───/nix/store/7n0mbqydcipkpbxm24fab066lxk68aqk-libunistring-1.1
# │   │   │   └───/nix/store/7n0mbqydcipkpbxm24fab066lxk68aqk-libunistring-1.1 [...]
# │   │   └───/nix/store/s32cldbh9pfzd9z82izi12mdlrw0yf8q-libidn2-2.3.7 [...]
# │   └───/nix/store/ddwyrxif62r8n6xclvskjyy6szdhvj60-glibc-2.39-5 [...]
# └───/nix/store/dbghhbq1x39yxgkv3vkgfwbxrmw9nfzi-hello-2.12.1 [...]
```

#### 查询打印 GraphML 依赖图

`--graphml`

以 [GraphML](http://graphml.graphdrawing.org/) 文件格式打印存储路径的引用图。这可用于可视化依赖图。要获取构建时依赖图，请将其应用于存储派生。要获取运行时依赖关系图，请将其应用于输出路径。

#### `--binding name`

`--binding name; -b name`

Prints the value of the attribute name (i.e., environment variable) of the store derivations paths. It is an error for a derivation to not have the specified attribute.

（没懂）

#### 查询对应 nar 的 hash

`--hash`

打印存储路径路径内容的 SHA-256 哈希值（即给定路径上 `nix-store --dump` 输出的哈希值）。由于哈希值存储在 Nix 数据库中，因此这是一个快速操作。

```bash
nix-store --query --hash $hellow_drv_path
# sha256:01ddskg72jfsxr3lzmb7d3zv6fn489zp4jvwgar7bn3z5bgznava
nix-store --query --hash $hellow_out_path
# sha256:0alzbhjxdcsmr1pk7z0bdh46r2xpq3xs3k9y82bi4bx5pklcvw5x
```

#### 查询对应 nar 的大小

`--size`

打印存储路径 paths 内容的大小（以字节为单位）——准确地说，是给定路径上 `nix-store --dump` 的输出大小。请注意，存储路径所需的实际磁盘空间可能更高，尤其是在具有较大簇大小的文件系统上。

```bash
nix-store --query --size $hellow_drv_path
# 1584
nix-store --query --size $hellow_out_path
# 226560
```

#### 查询相关的垃圾回收根

`--roots`

打印直接或间接指向存储路径的垃圾收集器根。

```bash
nix-store --query --roots $hellow_drv_path
# 无输出
nix-store --query --roots $hellow_out_path
# 无输出
```
