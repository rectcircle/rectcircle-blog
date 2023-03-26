---
title: "Nix 详解（五）在研发团队中落地设计"
date: 2023-03-27T00:44:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> version: nix-2.14.1

## 场景推演

从代码角度来看，一个软件项目的需求开发的工作流大致为：代码设计、代码开发环境搭建、代码编写、代码测试、代码编译、代码部署。

根据前面几篇文章的说明，推荐将 Nix 应用在研发团队的工作流程如下场景：

**场景一：实现声明式的开发、测试、编译环境。**

Nix 相较其他包管理工具，最大的优势是声明式的和可重现的。因此，自然的可以使用 Nix 来声明一个项目的开发、测试、编译环境。 开发、测试、编译环境的依赖一般情况下是一致的，因此针对该场景：

* 需为项目添加一个 `shell.nix` 文件，声明项目的开发、测试、编译依赖。
* 开发、测试、编译相关的行为通过 shell 脚本实现，通过 shebang 注释应用上面的声明。

    ```bash
    #!/usr/bin/env nix-shell
    #! nix-shell -i bash --pure shell.nix
    ```

**场景二：研发团队内部自研面向内部成员的 CLI 工具发布平台。**

针对 Unix 平台的 CLI 工具，可以使用 Nix 来构建和发布 CLI。针对该场景：

* 类似于 nixpkgs，在研发团队内建设一个类似的代码仓库，管理所有需要发布 CLI 工具的 derivation 声明。
* 研发团队内 CI/CD 平台，提供构建能力，并将构建产物同步到二进制缓存服务。

**场景三：使用 Nix 构建后端服务的部署镜像（环境）？**

目前，Nix 函数式可重现的特性存在一个比较严重的问题，即没有区分构建和运行依赖。

也就是说，一个软件包，即使其已经预构建好并存储在了二进制缓存服务中，但是在安装时，仍然会安装其编译依赖如编译器。

这就导致了，安装一个软件包的磁盘占用会异常的大。在云原生时代，一般部署环境对应一个镜像。

如果使用 Nix 来构建一个镜像，这就导致镜像大小比较大，且包含了没有必要的编译依赖。如果可以接受这一点，则即可使用 Nix 来构建部署镜像。

该问题，参见： [Issue](https://github.com/NixOS/nix/issues/8107)。

## 架构图

![image](/image/nix-in-org-arch.svg)

## Channel 聚合服务

该服务主要解决如下几个问题：

* 由于 nixpkgs channel 位于 github 网络不稳定，这里提供对于该 channel 每个 commit 的代理和缓存服务。
* 提供托管在研发团队内部代码 channel 的注册，并向外暴露唯一的 channel 包。研发团队内用户，如果想将自己的项目发布给研发团队内其他成员。通过该服务的一个管理页面，注册自己的项目，如 `myAbcPkg`。该服务会提供一个包含 `default.nix` 的 `tar.xz` 的 URL。这个 `default.nix` 最终返回的是一个属性集，这个属性集包含了所有注册的项目。

最终，用户的配置为：

```
nix-channel --add https://example.com/channel/nixpkgs-unstable nixpkgs
nix-channel --add https://example.com/channel/rdgrouppkgs rdgrouppkgs
nix-channel --update
```

这用，用户即可通过 `nix-env -iA nixpkgs.go` 安装 nixpkgs 的包；通过 `nix-env -iA rdgrouppkgs.myAbcPkg.xxx` 安装私有包。

## Nix 缓存聚合器

nix 缓存聚合器提供 Nix 构建产物的缓存，主要有如下能力：

* 提供对 nix 安装包、安装脚本的缓存。
* 提供对 nixpkgs 缓存的代理和缓存能力。
* 提供对研发团队内私有包的缓存上传缓存能力。

使用上：

* 用户使用该服务提供的私有安装脚本，即可快速的安装 nix。
* 用户只需，在 `~/.config/nix/nix.conf` 配置该缓存聚合器。则可以利用该缓存的快速安装包。
* 用户如想发布一个私有包，在研发团队内部现有的 CI/CD 流水线中，使用 `nix-build` 构建好私有包后，即可通过该服务提供的上传 URL 即可将构建缓存发布到该缓存聚合器中。
