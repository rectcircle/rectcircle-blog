---
title: "Nix 包管理器详解"
date: 2023-02-25T20:48:49+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 简介

Nix 是一个 `*nix` (Linux、类 Unix) 操作系统的包（软件）管理工具。和各个

和 Debian 系的 apt、Redhat 系的 yum 不同。Nix 在设计上是跨平台的，可以在任何 `*nix` 平台使用（这可能就是 nix 命名的来源）。

Nix 自称其是一个纯函数式，Nix 的包（每个版本）被视为函数式编程领域的值。具体而言，每个包的每个版本都会根据文件内容，计算 Hash，并将该软件的所有文件都存放到一个带有 Hash 值的目录中（因此其没有采用 [`FHS`](https://en.wikipedia.org/wiki/Filesystem_Hierarchy_Standard) 目录结构标准），如：

```
/nix/store/b6gvzjyb2pg0kjfwrjmg1vfhh54ad73z-firefox-33.1/
```

通过 Nix 可以实现系统软件环境的可重现的、声明式的和可靠性。

* 可重现：Nix 包的依赖只能使用其他的 Nix 包，且不存在没有声明的依赖。因此如果一个包在一台机器上工作，它也将在另一台机器上工作。
* 声明式：如果你在开发一个项目，Nix 可以根据配置文件，定制开发或编译环境，且这些开发环境可以在任何设备上复现。
* 可靠性：Nix 包的每个版本都存放在自己独立的目录中，因此在安装、升级过程中不会有文件覆盖的问题，这就保证了新版的安装不会影响到旧版本的任何内容，可以实现一键回滚。

从上面的介绍可以看出，nix 的能力和 Docker 的部分能力存在重叠，特别在环境可重现方面。但是两者存在本质的不同，nix 是一个包管理和配置工具，而 docker 是一个构建和部署容器的工具。因此两者应用场景存在不同：

* nix 一般用在项目开发阶段，可以通过配置文件直接在当前系统中，给开发人员提供一个可重现的开发环境。这个开发环境本质上是通过 PATH 环境变量生成的，各个 IDE 可以零成本集成。
* docker 一般用在项目的构建和部署阶段。如果将 docker 应用在开发阶段，会存在如下问题：
    * IDE 集成困难，只能通过各个 IDE 提供的 Remote 特性才能进入容器，学习成本并不低。
    * 修改开发环境步骤过长(修改 Dockerfile、构建 Dockerfile、删除旧容器、运行新容器），不易测试。

包管理工具实际上是一个 Linux 发行版的核心。反过来讲，拥有了一个包管理工具，很容易的就可以创造一个 Linux 发行版。因此 Nix 项目组还提供了一个将 Nix 作为包管理工具的发行版 NixOS。

本文主要介绍 Nix 这个包管理工具，而不会介绍 NixOS。阅读本文可以了解：

* 如何安装配置和使用 Nix 包管理工具（类比 apt 那样使用）。
* 如何通过 Nix 为自己的项目配置一个可重现的开发环境（类比 Dockerfile）。
* 如何将已有的软件包发布为一个 Nix 包（类比构建一个 deb 包）。
* 介绍 Nix 各种机制的原理。
* 如何为自己的组织，私有化部署一套 Nix 基础设施（类似于建设一个 apt mirror 和一个私有 apt 源）。

本节参考：

* [Will Nix Overtake Docker?](https://blog.replit.com/nix-vs-docker)
* [Nix Manual - Introduction](https://nixos.org/manual/nix/stable/introduction.html)
* [NixOS 首页](https://nixos.org/)

## 快速开始

### 安装 Nix

### 使用 Nix 安装软件包

### 发布一个 Nix 包

## 命令和全局配置

## 开发环境项目配置

## 编写发布 Nix 包

## Nix 原理分析

### 安装脚本分析

### 包 Channel

### 安装旧版包

### Nix 软件包安装分析

### Nix 二进制缓存服务

## 私有化部署

### 目标

### 架构设计

* 二进制缓存服务
* 私有包 channel 管理

### Helm 实现

TODO

## 参考

* [Nix 手册](https://nixos.org/manual/nix/stable/)
* [Nix github](https://github.com/NixOS/nix)
* [NixOS wiki](https://nixos.wiki/)
* [NixOS Learn](https://nixos.org/learn.html)
* [清华大学 Nix 源](https://mirrors.tuna.tsinghua.edu.cn/help/nix/)
