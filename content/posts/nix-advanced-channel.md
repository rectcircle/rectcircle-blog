---
title: "Nix 高级话题之 channel"
date: 2024-07-21T19:31:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> version: nix-2.22.1

## 概述

Nix channel 类似于 apt 的 source，即软件源。

Nix 可以配置多个 channel，每个 channel 都是一个 `<channel-name>` 和 `<channel-url>` 的映射。

Nix 通过 `nix-channel` 命令管理 channel 的配置，语法如下：

```
nix-channel {--add url [name] | --remove name | --list | --update [names…] | --list-generations | --rollback [generation] }
```


配置完成 nix-channel 后，可以通过 `nix-env -iA <channel-name>.xxx`，安装软件包。

## 配置文件

> [Nix 参考手册 - 8.6.3 Channels](https://nix.dev/manual/nix/2.22/command-ref/files/channels)

Nix channel 的配置文件位于 `~/.nix-channels`，其格式为：

```
<url> <name>
...
```

可以手动修改该配置文件，也可以通过，如下命令修改：

* `nix-channel --add url [name]` 添加有个 channel， 如果 name 为空，name 默认为 url 的最后一个 `/` 后面的字符串，并去除后缀 `-stable` 或 `-unstable`。
* `nix-channel --remove name` 删除一个 channel。
* `nix-channel --list` 列出 channel。

## 更新 channel

上述步骤更新了配置文件，还是需要手动执行 `nix-channel --update  [names…]` 更新 channel （这里的 `[name…] 是选填的` ）。

通过如下过程观察 `nix-channel` 执行过程：

```bash
# 卸载 nix
sudo rm -rf /nix ~/.nix-* ~/.local/state/nix ~/.config/nix
# 安装 nix
sh <(curl -L https://nixos.org/nix/install) --no-daemon --no-channel-add
. /home/rectcircle/.nix-profile/etc/profile.d/nix.sh
# 添加 channel 将配置添加到  ~/.nix-channels
nix-channel --add https://channels.nixos.org/nixpkgs-unstable nixpkgs
sudo apt update
sudo apt install -y cpulimit
# 限制 cpu 执行更新 channel 
cpulimit -l 1 -- nix-channel --update -vvv
# did not find cache entry for 'file:{"name":"nixpkgs-unstable","store":"/nix/store","url":"https://channels.nixos.org/nixpkgs-unstable"}'
# downloading 'https://channels.nixos.org/nixpkgs-unstable'...
# starting download of https://channels.nixos.org/nixpkgs-unstable
# finished download of 'https://channels.nixos.org/nixpkgs-unstable'; curl status = 0, HTTP status = 200, body = 1856 bytes
# acquiring write lock on '/nix/var/nix/temproots/7531'
# locking path '/nix/store/bb5kbdycl7k6fdg5ain3w4jxxh887jl7-nixpkgs-unstable'
# lock acquired on '/nix/store/bb5kbdycl7k6fdg5ain3w4jxxh887jl7-nixpkgs-unstable.lock'
# lock released on '/nix/store/bb5kbdycl7k6fdg5ain3w4jxxh887jl7-nixpkgs-unstable.lock'
# did not find cache entry for 'file:{"name":"nixexprs.tar.xz","store":"/nix/store","url":"https://releases.nixos.org/nixpkgs/nixpkgs-24.11pre642175.90338afd6177/nixexprs.tar.xz"}'
# downloading 'https://releases.nixos.org/nixpkgs/nixpkgs-24.11pre642175.90338afd6177/nixexprs.tar.xz'...
# starting download of https://releases.nixos.org/nixpkgs/nixpkgs-24.11pre642175.90338afd6177/nixexprs.tar.xz
# finished download of 'https://releases.nixos.org/nixpkgs/nixpkgs-24.11pre642175.90338afd6177/nixexprs.tar.xz'; curl status = 0, HTTP status = 200, body = 29240136 bytes
# locking path '/nix/store/s7c3bxnz9j8r2n17vwzg8ssgl6wl10pn-nixexprs.tar.xz'
# lock acquired on '/nix/store/s7c3bxnz9j8r2n17vwzg8ssgl6wl10pn-nixexprs.tar.xz.lock'
# lock released on '/nix/store/s7c3bxnz9j8r2n17vwzg8ssgl6wl10pn-nixexprs.tar.xz.lock'
# unpacking 1 channels...
# download thread shutting down

# 在上一步执行过程中，在另一个终端执行
ps -ef -w w | grep nix
# /nix/store/4z2dxs69kmhhkynyygxc4h5g28axhxjm-nix-2.23.0/bin/nix-env --profile /home/rectcircle/.local/state/nix/profiles/channels --file /tmp/nix.zaPRJ1 --install --remove-all --from-expression 'f: f { name = "nixpkgs"; channelName = "nixpkgs"; src = builtins.storePath "/nix/store/s7c3bxnz9j8r2n17vwzg8ssgl6wl10pn-nixexprs.tar.xz";  }' --quiet
# 在上一步执行过程中，在另一个终端执行 
# https://github.com/NixOS/nix/blob/2.22.1/src/libstore/unix/build/local-derivation-goal.cc#L2171
# https://github.com/NixOS/nix/blob/2.22.1/src/libstore/unix/builtins/unpack-channel.cc
cat /tmp/nix.*
#
# { name, channelName, src }:
#
# derivation {
#   builder = "builtin:unpack-channel";
#
#   system = "builtin";
#
#   inherit name channelName src;
#
#   # No point in doing this remotely.
#   preferLocalBuild = true;
# }
ls -al ~/.nix-defexpr
# channels -> /home/rectcircle/.local/state/nix/profiles/channels
# channels_root -> /nix/var/nix/profiles/per-user/root/channels
ls -al /home/rectcircle/.local/state/nix/profiles/channels
# /home/rectcircle/.local/state/nix/profiles/channels -> channels-1-link
ls -al /home/rectcircle/.local/state/nix/profiles/channels-1-link
# /home/rectcircle/.local/state/nix/profiles/channels-1-link -> /nix/store/9lryg21ajp4yx4d8qavg3jwy0crbp80f-user-environment
ls -al /nix/store/9lryg21ajp4yx4d8qavg3jwy0crbp80f-user-environment
# manifest.nix -> /nix/store/zzgjar0372zvbc1xazyf5p35aw92pspd-env-manifest.nix
# nixpkgs -> /nix/store/j13ha7fdr5n95kgk5q7nnn89h2bq6mr2-nixpkgs/nixpkgs
cat /nix/store/zzgjar0372zvbc1xazyf5p35aw92pspd-env-manifest.nix
# [ { meta = { }; name = "nixpkgs"; out = { outPath = "/nix/store/j13ha7fdr5n95kgk5q7nnn89h2bq6mr2-nixpkgs"; }; outPath = "/nix/store/j13ha7fdr5n95kgk5q7nnn89h2bq6mr2-nixpkgs"; outputs = [ "out" ]; system = "builtin"; type = "derivation"; } ]
ls -al /nix/store/j13ha7fdr5n95kgk5q7nnn89h2bq6mr2-nixpkgs/nixpkgs
# CONTRIBUTING.md
# COPYING
# default.nix
# doc
# .editorconfig
# flake.nix
# .gitattributes
# .git-blame-ignore-revs
# .github
# .gitignore
# .git-revision
# lib
# .mailmap
# maintainers
# nixos
# pkgs
# README.md
# .version -> lib/.version
# .version-suffix
(p=/nix/store/j13ha7fdr5n95kgk5q7nnn89h2bq6mr2-nixpkgs; find $p -type f; find $p -type d) | wc -l
# 70552
```

因此总结一下，`nix-channel --update` 执行过程如下：

* 读取 nix channel 的配置文件  `~/.nix-channels` 获取到 channel 列表，名依次执行如下操作。
* 尝试请求 `url`，如果是重定向，则获取到重定向后的地址，然后拼接 `/nixexprs.tar.xz`，并下载该到 `/nix/store/xxx-nixexprs.tar.xz` 中。
* 解压 `/nix/store/xxx-nixexprs.tar.xz` 到 `/nix/store/xxx-<channel-name>` 中。
* 构造一个 `/nix/store/xxx-user-environment`，包含如下文件。

    ```
    /nix/store/xxx-user-environment
    ├── manifest.nix -> /nix/store/xxx-env-manifest.nix       # 源信息
    ├── nixpkgs -> /nix/store/xxx-nixpkgs/nixpkgs             # 解压的 channel 的 nixexprs.tar.xz
    └── ...                                                   # ...
    ```

    `/nix/store/xxx-env-manifest.nix` 是一个 `[]derivation`，示例内容如下：

    ```
    [ { meta = { }; name = "nixpkgs"; out = { outPath = "/nix/store/alvsn668jlsllk18p29b6jqadg9qsa44-nixpkgs"; }; outPath = "/nix/store/alvsn668jlsllk18p29b6jqadg9qsa44-nixpkgs"; outputs = [ "out" ]; system = "builtin"; type = "derivation"; } ... ]
    ```

* 读取 `~/.nix-defexpr/channels` 软链的指向的软链（`~/.local/state/nix/profiles/channels`）所在目录（即 `~/.local/state/nix/profiles`）创建一个 `channels-x-link` 软链，指向 `/nix/store/xxx-user-environment`。然后更新 `~/.nix-defexpr/channels` 软链的指向的软链（`~/.local/state/nix/profiles/channels`）到 `channels-x-link` （和 nix-profile 类似，但是无法自定义，详见下文）。

## 其他说明

### 国内源使用固定版本问题

通过 [Nix channels](https://channels.nixos.org/) 站点可以查询到所有固定版本的 channels，但是这些版本会随着时间而变化，而更新，如：

* `https://channels.nixos.org/nixos-24.05` 在当前时刻会重定向到 `https://releases.nixos.org/nixos/24.05/nixos-24.05.3103.0c53b6b8c2a3`，随着时间的推移，重定向的目标会变化。

因此如果真的想强保证，使用一个固定的版本，应该使用真是的 URL。比如我们项使用 nixos-24.05 的 `24.05.3103.0c53b6b8c2a3` 子版本，则应该重定向后的 url。

```bash
# https://releases.nixos.org/nixos/24.05/nixos-24.05.675.805a384895c6
nix-channel --add https://mirrors.tuna.tsinghua.edu.cn/nix-channels/releases/nixos-24.05@nixos-24.05.675.805a384895c6 nixpkgs_24_05
nix-channel --update
# error: path 'bvdwdkhfgid51xir705v9rh4gg8hcbbn-nixos-24.05@nixos-24.05.675.805a384895c6' is not a valid store path: name 'nixos-24.05@nixos-24.05.675.805a384895c6' contains illegal character '@'
nix-channel --remove nixpkgs_24_05
nix-channel --add https://mirrors.tuna.tsinghua.edu.cn/nix-channels/releases/nixos-24.05%40nixos-24.05.675.805a384895c6 nixpkgs_24_05
nix-channel --update
# error: path 'sciazysgcwzs52ig7afsa59fbx6dqw6n-nixos-24.05%40nixos-24.05.675.805a384895c6' is not a valid store path: name 'nixos-24.05%40nixos-24.05.675.805a384895c6' contains illegal character '%'
nix-channel --remove nixpkgs_24_05
```

因为国内源的最后一段使用了 @ 特殊字符，导致 `nix-channel --update` 失败，目前官方仍未有任何回应，相关 issue 如下：

* [清华源 issue](https://github.com/tuna/issues/issues/1976)。
* [Nix issue](https://github.com/NixOS/nix/issues/10831)。

目前仍未得到解决，临时的解决办法是使用短链接服务（如 [bitly](https://bitly.com)），做一个转换。

```bash
nix-channel --add https://bit.ly/3Y80c55 nixpkgs_24_05
nix-channel --update
```

### 无法像切换 profile 存储位置

有些场景，希望将 `nix-channel --update` 的结果的引用存储到一个地方，实现随时切换（类似 `nix-env --switch-profile` 那样的需求）。

但是，目前 nix 不支持，验证如下：

```bash
mkdir -p /tmp/test-channels
readlink ~/.nix-defexpr/channels
# /home/rectcircle/.local/state/nix/profiles/channels
rm -rf ~/.nix-defexpr/channels
ln -s /tmp/test-channels/channels ~/.nix-defexpr/channels
ls -al ~/.nix-defexpr/channels
#  /home/rectcircle/.nix-defexpr/channels -> /tmp/test-channels/channels
nix-channel --update
ls -al ~/.nix-defexpr/channels
# /home/rectcircle/.nix-defexpr/channels -> /home/rectcircle/.local/state/nix/profiles/channels
```

可以看出，手动配置 ~/.nix-defexpr/channels 软链是无效的。下面尝试通过 nix-env 切换 profile，观察 channel 的配置是否发生变化。

```bash
nix_path=$(readlink -f $(which nix))
# /nix/store/xxx-nix-xxx/bin/nix
readlink ~/.nix-defexpr/channels
# /home/rectcircle/.local/state/nix/profiles/channels
mkdir -p /tmp/test-profiles
nix-env --switch-profile /tmp/test-profiles/profile
readlink ~/.nix-defexpr/channels
# /home/rectcircle/.local/state/nix/profiles/channels
${nix_path}-channel --update
readlink ~/.nix-defexpr/channels
# /home/rectcircle/.local/state/nix/profiles/channels
rm -rf ~/.nix-defexpr/channels
ln -s /tmp/test-channels/channels ~/.nix-defexpr/channels
${nix_path}-channel --update
readlink ~/.nix-defexpr/channels
# /home/rectcircle/.local/state/nix/profiles/channels
${nix_path}-env --switch-profile ~/.local/state/nix/profiles/profile # 恢复
```

虽然 `nix-channel --update` 的存储位置和 profile 类似，但是在目前版本，存储位置是强制写死到了 `~/.local/state/nix/profiles/channels`，无法通过任何办法自定义。

如果项实现类似  `nix-env --switch-profile` 的能力，只能通过手动维护 `~/.local/state/nix/profiles/channels-x-link` 的元信息，在需要的时候，手动修改 `~/.local/state/nix/profiles/channels` 软链指向特定的 `~/.local/state/nix/profiles/channels-x-link` 来实现。
