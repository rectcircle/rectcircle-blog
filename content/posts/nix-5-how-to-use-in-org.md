---
title: "Nix 详解（五）在大型组织中落地设计"
date: 2023-02-25T20:48:49+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> version: nix-2.14.1

## 私有化部署

### 目标

### 架构设计

* 二进制缓存服务
* 私有包 channel 管理
* 构建钩子 https://nixos.org/manual/nix/stable/advanced-topics/post-build-hook.html
    * 识别到 `OUT_PATHS=/nix/store/2n080hnd7j34a4li4w7n4lg15pgnm116-user-environment` 为时，根据 manifest.nix 配置获取所有的包。
    * 几种策略
        * 检查 cache 服务是否存在相关包（包括依赖包），不存在则上传上去。（不安全，适合内网环境）
        * 将相关包名报告构建服务，构建服务发现包不存在，则重新根据名字重新到 channel 去拉重新构建并缓存。

### Helm 实现

TODO
