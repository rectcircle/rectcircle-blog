---
title: "安装"
date: 2019-04-30T12:05:29+08:00
draft: false
toc: true
weight: 20
summary: 在macOS，Windows，Linux，OpenBSD，FreeBSD以及可以运行Go编译器工具链的任何机器上安装Hugo。
---

> 有很多关于“hugo由Go语言编写”的讨论，但你不需要安装Go就能使用Hugo。只需安装预编译的二进制文件！

Hugo是用 [Go](https://golang.org/) 编写的，支持多个平台。最新版本可以在 [Hugo Releases](https://github.com/gohugoio/hugo/releases) 上找到。

Hugo目前为以下内容提供预构建的二进制文件：

* macOS (Darwin) 的 x64, i386, ARM 架构
* Windows
* Linux
* OpenBSD
* FreeBSD

Hugo可以在任何可以运行Go工具链的平台编译Hugo；例如DragonFly BSD，OpenBSD，Plan 9，Solaris等。有关目标操作系统和编译体系结构的全套支持组合，请参阅 https://golang.org/doc/install/source 。

## 快速安装

### 二进制（跨平台）

从 [Hugo Releases](https://github.com/gohugoio/hugo/releases) 下载适用于您的平台的版本。下载后，二进制文件可以从任何地方运行。您无需将其安装到全局位置。这适用于您没有特权帐户的共享主机和其他系统。

### Homebrew (macOS)

如果您使用的是macOS并使用 [Homebrew](https://brew.sh/)，则可以使用以下一行命令安装Hugo：

```bash
brew install hugo
```

有关更详细的说明，请阅读以下安装指南，以便在macOS和Windows上进行安装。

### Chocolatey (Windows)

如果您使用的是Windows机器并使用Chocolatey进行包管理，则可以使用以下一行命令安装Hugo：

```bash
choco install hugo -confirm
```

### Scoop (Windows)

如果您使用的是Windows计算机并使用Scoop进行包管理，则可以使用以下一行命令安装Hugo：

```bash
scoop install hugo
```

### 源码

#### 必备工具

* [Git](http://git-scm.com/)
* [Go (1.11或更新版本)](https://golang.org/dl/)

#### 从GitHub获取

从Hugo 0.48起，Hugo使用Go 1.11内置的Go Modules支持来构建。最简单的入门方法是将Hugo克隆到GOPATH之外的目录中，如下例所示：

```bash
mkdir $HOME/src
cd $HOME/src
git clone https://github.com/gohugoio/hugo.git
cd hugo
go install --tags extended
```

如果您不需要/需要Sass/SCSS支持，请删除--tags扩展。

> 如果您是Windows用户，请使用`％USERPROFILE％`替换上面的`$HOME`环境变量。

## 其他内容

[参见](https://gohugo.io/getting-started/installing/#macos)
