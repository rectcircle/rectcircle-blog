---
title: "Nix 详解（四-2） 实现一个 Nix Mirror 服务的方案"
date: 2024-04-30T13:17:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 简述

在第一篇文章，安装部分，在 `~/.config/nix/nix.conf` 配置的 `substituters = https://mirrors.tuna.tsinghua.edu.cn/nix-channels/store https://cache.nixos.org/` 就是配置两个二进制缓存地址。

* 第一个 `https://mirrors.tuna.tsinghua.edu.cn/nix-channels/store` 是清华大学提供的 nixpkgs 二进制缓存的 mirror。
* 第二个 `https://cache.nixos.org/` 是 nixpkgs 官方提供的二进制缓存，在中国大陆地区访问缓慢甚至难以访问。

以上这些配置，仍然无法保证安装速度原因如下：

* 清华 mirror 同步的并不全且不及时，很多缓存在 `https://cache.nixos.org/` 存在，但是在清华源并不存在。需要 failback 到官方缓存，速度巨慢。
* 对于非 nixpkgs 的包的二进制缓存，在大陆地区可能仍然无法访问，每加一个二进制缓存，都需要用户更改 `substituters` 配置。
* 有些场景我们需要安装旧版的 nix 包，这个时候我们需要使用 github nixpkgs 项目的 archive 链接指定 channel，github 的访问在国内异常缓慢。

为了解决如上问题，本文将设计一个 nix mirror 服务，这个服务可以实现：在 nix 使用的全生命周期的网络请求全覆盖，在无法访问任何 nix 官方的站点的情况下，仍能高速使用 nix。支持如下特性：

* 支持对 nix 安装脚本的 mirror，实现快速 nix 的安装。
* 支持对 nixpkgs 官方 channel 的 mirror，实现 channel 的快速加载。
* 支持对 nixpkgs github archive 的 mirror，实现安装旧版 nix 包时，实现 channel 的快速加载。
* 支持对 nix 二进制缓存的 mirror，实现 nix 二进制缓存的快速访问。

## 官方接口分析

### 安装脚本 `/nix/install`

```http
GET https://nixos.org/nix/install

# HTTP/1.1 302
# Location: https://releases.nixos.org/nix/nix-2.22.0/install
```

该接口返回一个 302 重定向，重定向到当前时刻最新稳定版的 release 文件服务的 install 脚本。

```http
GET https://releases.nixos.org/nix/nix-2.22.0/install

HTTP/1.1 200 OK
Content-Type: text/plain

# #!/bin/sh
# # Use this command-line option to fetch the tarballs using nar-serve or Cachix
# if # ...
# else
#     url=https://releases.nixos.org/nix/nix-2.22.0/nix-2.22.0-$system.tar.xz
# fi
```

这个安装脚本在之前的文章分析过，这里仅需关注 `url=https://releases.nixos.org/nix/nix-2.22.0/nix-2.22.0-$system.tar.xz` 这一行。这个安装脚本在执行过程中，会从该 URL 中下载 nix 的安装包。因此，在实现 nix mirror 服务时，对这个文件的不能直接原样缓存下来，而是需要把这个 url 替换为当前 mirror 服务的 url。

另外，如果修改了安装脚本，则还需要修改 `install.sha256` 的值为，这个新脚本的 sha256。

```http
GET https://releases.nixos.org/nix/nix-2.22.0/install.sha256

# HTTP/1.1 200 OK
# Content-Type: text/plain
# 
# 4fed7db867186c01ce2a2077da4a6950ed16232efbf78d0cd19700cff80559f9
```

### release 文件服务

```http
GET https://releases.nixos.org/

# nix-dev/    # 邮件组
# nix/        # 各个版本 nix 安装包、安装脚本
#     # ...
#     nix-2.22.0/                                # 2.22.0 版本
#         install                                # 安装脚本
#         install.sha256                         # 安装脚本的 sha256
#         nix-2.22.0-${arch}-${os}.tar.xz        # 安装包
#         nix-2.22.0-${arch}-${os}.tar.xz.sha256 # 安装包的 sha256
# nixops/     # ??
# nixos/      # 所有发行过的 nixos 版本的 iso 等文件（和 channel 文件服务的区别是，这里每个小版本都有）。
# nixpkgs/    # prerelease 的 nixpkgs。
# patchelf/   # 修改可执行文件的 ld.so 的路径的小工具的。
```

### channel 文件服务

```http
GET https://channels.nixos.org/

nix-latest/
    install                    # 302 到 最新版本的安装脚本
nixpkgs-unstable/
    binary-cache-url            # 二进制缓存站点 url，如： https://cache.nixos.org
    git-revision                # 当前 channel 的 git commit id
    nixexprs.tar.xz             # 该 channel nix 表达式代码包
    packages.json.br            # 该 channel 所有包列表的 json 文件，按 Brotli 格式压缩后的文件
    src-url                     # 执行编译的源 url，如 https://hydra.nixos.org/eval/1805969
    store-paths.xz              # 使用 xz 算法压缩的纯文本文件，每行为一个路径，如： /nix/store/9kriq85qac7phcxgpdqbqr25vlr61ifw-go-1.22.2
nixpkgs-${version}-${os}/
nixos-unstable/
nixos-unstable-small/
nixos-${version}/
nixos-${version}-small/
nixos-${version}-aarch64/
```

关于 packages.json.br 格式如下：

```json
{
    "version": 2,
    "packages": {
        "AMB-plugins": {
            "meta": {
                "description": "A set of ambisonics ladspa plugins",
                "homepage": "http://kokkinizita.linuxaudio.org/linuxaudio/ladspa/index.html",
                "license": {
                    "fullName": "GNU General Public License v2.0 or later"
                },
                "longDescription": "Mono and stereo to B-format panning, horizontal rotator, square, hexagon and cube decoders.\n",
                "maintainers": [
                    {
                        "email": "bart@magnetophon.nl",
                        "github": "magnetophon",
                        "name": "Bart Brouns"
                    }
                ],
                "name": "AMB-plugins-0.8.1",
                "platforms": [
                    "x86_64-linux"
                ],
                "position": "pkgs/applications/audio/AMB-plugins/default.nix:24",
                "version": "0.8.1"
            },
            "name": "AMB-plugins-0.8.1",
            "pname": "AMB-plugins",
            "system": "x86_64-linux",
            "version": "0.8.1"
        }
    }
}
```

### github archive 接口

```http
GET https://github.com/NixOS/nixpkgs/archive/ed4fd067bc0925598221aea1d38887f3d0a26576.tar.gz
```

### 二进制缓存服务

#### `/nix-cache-info`

```http
GET https://cache.nixos.org/nix-cache-info

# HTTP/1.1 200 OK
# Content-Type: text/x-nix-cache-info
# 
# StoreDir: /nix/store
# WantMassQuery: 1
# Priority: 40
```

#### `/${pkg_hash}.narinfo`

```http
GET https://cache.nixos.org/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g.narinfo

# HTTP/1.1 200 OK
# Content-Type: text/x-nix-narinfo
# 
# StorePath: /nix/store/v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1
# URL: nar/0qjw94x5c54sk397xhz4l134mk4cvyiakvdbczmal08rgd975sp5.nar.xz
# Compression: xz
# FileHash: sha256:0qjw94x5c54sk397xhz4l134mk4cvyiakvdbczmal08rgd975sp5
# FileSize: 50160
# NarHash: sha256:1bkbsk4wkk92syg4s7wafy5cxrsprlinax35zgp54y9r0f7a44jz
# NarSize: 226504
# References: 76l4v99sk83ylfwkz8wmwrm4s8h73rhd-glibc-2.35-224 v02pl5dhayp8jnz8ahdvg5vi71s8xc6g-hello-2.12.1
# Deriver: 25i5yk3xxr0g54rab62jfmi2hpmcapiw-hello-2.12.1.drv
# Sig: cache.nixos.org-1:wNCGXAt+CyxXwRFKCama8lAYXI+nz0ON4AWKZ7wCL7ccoJ8UTf1FtQzFi5MXZ7DuebGr90POlbotF7NfcS+iCw==
```

#### `/nar/${file_hash}.nar.xz`

```http
GET https://cache.nixos.org/nar/0qjw94x5c54sk397xhz4l134mk4cvyiakvdbczmal08rgd975sp5.nar.xz
```

## 同步机制

| 类型        | 同步模式     | 源        |
| ----------- | ----------- | ----------- |
| 安装脚本 | 定时      | `nixos.org/nix/install` |
| Release | 触发      | `releases.nixos.org`     |
| 二进制缓存   | 触发       | `cache.nixos.org` |
| Nixpkgs Channel (具体版本) | 触发      | `channels.nixos.org/${nixos-or-nixpkgs}-${version}/**` |
| Nixpkgs Channel (unstable) | 定时      | `channels.nixos.org/${nixos-or-nixpkgs}-unstable/**`  |
| Nixpkg github commit archive  | 触发式       | `https://github.com/NixOS/nixpkgs/archive/${commit-id}.tar.gz`  |

同步模式说明：
* 触发：采用类似 CDN 回源的模式，当缓存中没有时，直接通过代理返回官方源的内容。然后创建一个后台同步任务，异步的将内容同步到缓存中。优势是及时性更好，只要官方有都能获取到，劣势是如果下载的是小众内容，第一次速度相对较慢（配置了专线，可以保证比直连快）。
* 定时：目前只有 unstable 的 channel 采用该模式，如 https://channels.nixos.org/nixpkgs/nixpkgs-unstable。同步频率 5 分钟检测一次。不采用触发模式的原因是，同一个 URL 对应的内容会随着时间变化内容会有所变化。

## 接口和存储设计

```

// release/install-real-path
// release/install-real-path.sync-lock

```

| 类型    | 接口    | 源链接   | 缓存存储路径 |
| ------- | ------- | -------- | -------- |
| 安装脚本    | `/install` | `https://nixos.org/nix/install` | `/release/install-real-path`、`/release/install-real-path.sync-lock`，详见下方说明 1 |
| Release    | `/release/**`  | `https://releases.nixos.org` | `/release/**` |
| 二进制缓存 | `/cache/**`  | `https://cache.nixos.org` | `/cache/**` |
| Nixpkgs Channel (具体版本) | `/channel/${nixos-or-nixpkgs}-${version}/**` | `https://channels.nixos.org/${nixos-or-nixpkgs}-${version}/**` | `/channel/${nixos-or-nixpkgs}-${version}/**` |
| Nixpkgs Channel (unstable) | `/channel/${nixos-or-nixpkgs}-unstable/**` | `https://channels.nixos.org/${nixos-or-nixpkgs}-unstable/**`  | `channel/${nixos-or-nixpkgs}-unstable/sync-lock`、`channel/${nixos-or-nixpkgs}-unstable/latest`、`channel/${nixos-or-nixpkgs}-unstable/commit/${git-revision}/**` 详见下方说明 2 |
| Nixpkg github commit archive  | `/channel/nixpkgs/commit/${commit-id}.tar.gz`   | `https://github.com/NixOS/nixpkgs/archive/${commit-id}.tar.gz` | `/nixpkgs/commit/${commit-id}.tar.gz`  |

1. 安装脚本存储说明。
    * `/release/install-real-path` 存储内容为 `https://nixos.org/nix/install` 302 返回的 location。
    * `/release/install-real-path.sync-lock` 存储内容为 `<instance-id> <last-active-time>`，其中 `instance-id` 为当前实例的唯一标识，`last-active-time` 为上次同步时间。目的是并发控制。
2. Nixpkgs Channel (unstable) 存储说明。
    * `channel/${nixos-or-nixpkgs}-unstable/sync-lock` 存储内容为 `<instance-id> <last-active-time>`，其中 `instance-id` 为当前实例的唯一标识，`last-active-time` 为上次同步时间。目的是并发控制。
    * `channel/${nixos-or-nixpkgs}-unstable/latest` 存储内容为上一次同步的 `https://channels.nixos.org/${nixos-or-nixpkgs}-unstable/git-revision` 的值。本质上是一个索引，用于定位指向 `channel/nixos-unstable/commit/${git-revision}/**`。
    * `channel/${nixos-or-nixpkgs}-unstable/commit/${git-revision}/**` 存储内容为上一次同步的 `https://channels.nixos.org/${nixos-or-nixpkgs}-unstable/**` 的内容。
3. 存储可以使用对象存储服务来实现。
