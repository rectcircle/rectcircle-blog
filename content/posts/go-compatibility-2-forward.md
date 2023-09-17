---
title: "Go 兼容性（二） 向前兼容（GOTOOLCHAIN 工具链管理）"
date: 2023-09-17T20:08:00+08:00
draft: false
toc: true
comments: true
tags:
  - golang
---

> Go 1.21.0 | [示例代码](https://github.com/rectcircle/go-compatibility-example)

## 概述

Golang 作为一门现代编程语言，Golang 工具链自身的版本管理一直是缺失的。以至于，有一些第三方 Go 工具链版本管理工具，弥补这一空白，如 [gvm](https://github.com/moovweb/gvm)。但是 gvm 只是一种外部的传统的 Go 工具链版本管理工具，并没有很好的和 Go 项目进行集成。

在 Go 1.21，Go 终于引入了，工具链版本管理机制。利用该机制和 Go Module、Go Workspace 等深度集成，可以有效的避免之前没有定义的向前兼容的问题。

## 向前兼容

> 本文中的编译器和工具链均代指 Go 工具链，不关心两者细微差异。

Golang 的向前兼容（Forward Compatibility）指的是，用旧版的 Go 编译器编译，面向新版本的 Go 代码，是否仍能保证代码编译通过，且运行无误。如：即使 1 年前发布的 Go 编译器，编译今天面向 Go 1.21 的的项目。

显然，基本上任意一门编程语言都可能满足这个需求，因为新的编程语言的能力必然是就得编程语言的超级，除非这个编程语言不发展了，才有这种可能性。而 Go 自身显然是做不到的。

虽然，Go 没有这个能力，在 Go 1.21 之前，Go 并没有对这种情况做强约束。也就是说，某些在 `go line` 中声明的版本比 go 编译器的版本新，go 编译器不会拒绝编译，仍然会尝试编译，知道遇到当前旧编译器不认识的语法。举个例子，一个 go 1.18 的项目，使用 go 1.17 的编译器编译：

* 如果项目中没有使用泛型等 go 1.18 新特性，则编译通过。
* 如果项目使用了泛型等 go 1.18 新特性，则编译不通过，报错是语法错误。

这样的行为很不一致，很让人困惑。另外出现了问题，用户还需要手动安装新版的 Go 编译器。

在 Go 1.21 及其之后， go 编译器通过如下手段解决了这个问题，在默认情况：

* go 编译器会分析项目依赖树的 `go line` 中的最大版本。
* 检查 go 编译器的版本是否大于等于这个 `go line` 的版本。
    * 如果是，则使用该编译器进行编译。
    * 如果不是，则在系统查找或者网络中下载安装 `go line` 指定的这个版本的 go 工具链，并之中这个版本的工具链进行编译。

通过如上机制，Go 编译器解决了上述的问题。此外，这个能力相当于在 Go 工具链自身实现了一个 Go 工具链版本管理的能力，但开发者又无需感知工具链版本管理的复杂性，这非常符合 Go 极简的哲学。

上述过程细节参见下文： [Go 工具链](#go-工具链)。

## 环境准备

> 上一篇执行过，可以忽略。

目前 Golang 已发布到 1.21.1。但为了方便后续验证，在 Linux amd64 操作系统， 安装 `1.21.0` 版本。

```bash
wget https://go.dev/dl/go1.21.0.linux-amd64.tar.gz
sudo mkdir -p /opt/go
sudo tar -xzvf go1.21.0.linux-amd64.tar.gz -C /opt/go
sudo mv /opt/go/go /opt/go/go1.21.0
echo 'export GOROOT=/opt/go/go1.21.0' >> ~/.bashrc
echo 'export PATH=/opt/go/go1.21.0/bin:$PATH' >> ~/.bashrc
rm -rf go1.21.0.linux-amd64.tar.gz
go env -w GOPROXY='https://goproxy.cn|direct'
```

## Go 工具链

### go line 和 toolchain line

在 Go 1.21 及其之后，如果项目的 go module 的 `go line` 版本小于其直接或间接依赖的 module 的最大值，进行编译会报错，举例如下：

* 项目 `go line` 版本为 `go 1.21.0` （示例代码 `./02-gotoolchain/02-goline-old-require-new`）
* 项目依赖的 module 的 `go line` 版本为 `go 1.21.1` （示例代码 `./02-gotoolchain/01-goline-new`）

此时，分两种情况讨论：

* Go 编译器版本为 `go1.21.0` 时，执行编译（`GOTOOLCHAIN=go1.21.0 go run ./`）将报错 `go: module ../01-goline-new requires go >= 1.21.1 (running go 1.21.0)`。
* Go 编译器版本为 `go1.21.1` 时，执行编译（`GOTOOLCHAIN=go1.21.1 go run ./`）将报错 `go: updates to go.mod needed; to update it: go mod tidy`。
    * 执行 `go mod tidy` 后， `go line` 将变更为 `go 1.21.1`。

总结：在 Go 1.21 及其之后，编译器保证，项目的 `go line` 版本必须大于等于依赖的  `go line` 版本（`go.work` 和 `go.mod` 均需满足）。

此外，`go.mod` 或 `go.work` 中新增了 `toolchain <tname>` 语法，下文称该语法为 `toolchain line`，可以用来配置工具链版本，处理逻辑和 `go line` 类似。

通过 ` go get go@1.22.1` 或 `go get toolchain@1.24rc1` 可以配置 `go.mod` 或 `go.work` 中的 `go line` 或 `toolchain line`。

此外，`go work use` 可会检查 `go.work` 中的 `go line` 或 `toolchain line`。

### Go 版本

引入工具链版本管理后，Go 有了两个版本名：`go line` 版本，go 工具链版本。这两个版本名的规则如下：

* `go line` 版本，格式为 `1.N.P` 或 `1.N`。
* go 工具链版本，格式为 `go1.N.P-suffix` （或 `go1.N-suffix` go1.21 之前）。

为了兼容，这里有一些小细节是：

* 在 go1.21 之前，go 工具链版本和 `go line` 版本可以一一对应。
* 在 go1.21 及其之后，`go line` 版本仍然支持 `1.N`，而 go 工具链版本不再支持 `go1.N-suffix` 格式。

这连个版本的比较规则如下：

* go 工具链版本去除前导的 `go` 和后缀 `-suffix`，得到 `V2`； 和 `go line` 版本 `V1` 进行比较。
* 在 Go 1.21 之前，排序规则为： `1.20rc1 < 1.20rc2 < 1.20rc3 < 1.20 < 1.20.1`
* 在 Go 1.21 及其之后，排序规则为： `1.21 < 1.21rc1 < 1.21rc2 < 1.21.0 < 1.21.1 < 1.21.2`

也就是说：

* 在 1.21 之前，`go line` 声明为 `1.N` 则只能使用稳定版进行编译。
* 在 Go 1.21 及其之后，`go line` 声明为 `1.N` 可以使用 rc 版进行编译。

### GOTOOLCHAIN 配置

在向前兼容章节描述了默认情况下 Go 对工具链的管理，对应的时 `GOTOOLCHAIN=auto`。

GOTOOLCHAIN 是 go 1.21 新增的一个环境变量，和 GOPROXY 等类似，可以通过 `export`、`go env -w` 等方式配置。

该参数控制了 Go 工具链的选择，该变量值的格式有如下几种格式（命令均在 `./02-gotoolchain/01-goline-new` 中执行）：

* `local` 或 `<name>`：使用指定的固定 Go 版本，如果该版本小于 go.mod 或 go.work 中声明 （`go line` 或 `toolchain line`） 的版本，将报错。如： 运行 `GOTOOLCHAIN=local go run ./`，将报错 `go: go.mod requires go >= 1.21.1 (running go 1.21.0; GOTOOLCHAIN=local)`。
* `auto` 或 `local+auto` 或 `<name>+auto`： go.mod 或 go.work 中声明 （`go line` 或 `toolchain line`） 的版本确定工具链的版本（pwd 不再模块或工作空间，将会用 `local` 或 `<name>` 作为默认值），依次从 `~/go/pkg/mod/golang.org`、`GOPROXY` 指向的网络位置去查找工具链。
* `local+path` 或 `<name>+path`。go.mod 或 go.work 中声明 （`go line` 或 `toolchain line`） 的版本确定工具链的版本（pwd 不再模块或工作空间，将会用 `local` 或 `<name>` 作为默认值），从 PATH 环境变量中查找工具链。

总结一下：

* 强制使用某个固定版本：使用 `local` 或 `<name>`。
* 自动切换推导出的工具链版本（这里前缀的 `local` 或 `<name>` 仅表示默认值）：
    * `~/go/pkg/mod/golang.org`、`GOPROXY` 指向的网络位置去查找工具链：`auto` 或 `local+auto` 或 `<name>+auto`。
    * 从系统环境变量 `$PATH` 中找： `local+path` 或 `<name>+path`。。

## IDE 集成

VSCode golang (gopls) 已可以正确识别 `go line` 和 `toolchain line` 配置的工具链。

## 参考

* [Go 官方文档：toolchain](https://golang.org/doc/toolchain)
