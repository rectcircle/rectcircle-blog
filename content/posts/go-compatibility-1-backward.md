---
title: "Go 兼容性（一） 向后兼容（GODEBUG）"
date: 2023-09-17T17:24:00+08:00
draft: false
toc: true
comments: true
tags:
  - golang
---

> Go 1.21.0 | [示例代码](https://github.com/rectcircle/go-compatibility-example)

## 概述

Golang 作为一门现代编程语言，和上世纪的编程语言相比，一大优势就是提供了强有力的兼容性保证。

本文将重点介绍 Golang 1.21 带来新的兼容性保证和相关切实的机制，通过这些机制，可以切实提升 Go 开发者的 “升级率”：

* 消除了开发者对现存项目升级新版 Go 版本（编译器和语法）的顾虑，让开发者可以低成本的享受 Golang 的新特性，而不用担心升级带来的不兼容风险。
* 十分有利于 Go 的发展，避免出现类似于 Java TLS 都出 Java 17，大家还在使用 Java 8 的尴尬场面。

有了这些兼容性的机制，Go 1.21 的重要性不亚于 Golang 1.11 Go Module 带来依赖管理，具有里程碑意义。

本文将详细介绍这些机制，希望给 Go 开发者建立一个认知：现在可以将保持在 Go 1.16、Go 1.18 等旧版本的项目，升级 Go 1.21；并在之后 Go 版本发布后，始终让自己的 Go 项目可以保持跟随。

## 向后兼容概念

Golang 的向后兼容（Backward Compatibility）指的是，用新版的 Go 编译器编译，历史上的 Go 代码，仍能保证代码编译通过，且运行无误。如：即使 10 年前编写的 Go 代码，使用当前最新的 go1.21 编译器进行编译运行，也不会出现任何问题。

在 Golang 1.21 发布之前，Golang 官方通过 [Go 1 and the Future of Go Programs](https://go.dev/doc/go1compat) 规范定义了 Go 1 的兼容性。但是这篇规范有两个显著的问题：

* 暗示未来 Go 2 的到来，Go 1 的代码可能无法再 Go 2 中编译，就像 Python2 和 Python3 那样。这是令人难以接受。
* 某些特性的更新，不违反该规范 Go 1 兼容性承诺，但是仍然可能让旧的代码在新的 Go 编译器中编译后运行的行为会失败或不一致。

随着 Golang 1.21 的发布，Golang 官方通过 [Backward Compatibility, Go 1.21, and Go 2](https://go.dev/blog/compat) 博客，明确了上述两个问题：

* 承诺，上述意义的 Go 2 永远不会到来，即永远不会破坏向后兼容。实际上，在 Go 官方看来，自 2017 年来，Go 已经逐步到走向了 Go 2，也就是说现在的 Go 已经是 Go 2 了。
* 分析并归纳了那些 **不违反 Go 1 兼容性承诺但是仍然后可能破坏兼容性的变更** （输入更改、输出更改、协议变更），并通过规范 `GODEBUG` 的使用，来解决这种问题，参见下文：[GODEBUG](#godebug)。

## 环境准备

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

## GODEBUG

> 示例代码： [rectcircle/go-compatibility-example](https://github.com/rectcircle/go-compatibility-example)

自 Go 1.21 开始，go 编译器开始识别一个 GODEBUG 环境变量。当新的 Go 版本引入了一些 **不违反 Go 1 兼容性承诺但是仍然后可能破坏兼容性的变更** 时，会增加一个开关，通过这个 GODEBUG 来控制 Go 编译器的行为。

GODEBUG 是一个键值对列表，示例格式为： `GODEBUG=http2client=0,http2server=0`。

更重要的是， GODEBUG 的默认值是根据 `go.mod` 中的 `go line` 来自动生成的。基于这可以实现：升级到新版 Go 编译器后，只要开发者不明确修改 `go line`，那么在新的编译器编译产物的行为和之前一致（一些有明确废弃计划的开关除外，如 `x509sha1` 开关将于 go1.22 版本移除）。

GODEBUG 的默认只可以通过 `go list -f '{{.DefaultGODEBUG}}' my/main/package` 观察。

下面有个示例

在 go1.21，引入了一个 **不违反 Go 1 兼容性承诺但是仍然后可能破坏兼容性的变更**，即 `panic(nil)` 的行为：

* 在 go1.21 及其之后 `panic(nil)`，`recover` 将返回 [`*runtime.PanicNilError`](https://tip.golang.org/pkg/runtime/#PanicNilError)。
* 在 go1.21 之前 `panic(nil)`，`recover` 将返回 nil。

编写与一个简单的 go 程序如下：

```go
package main

import (
	"fmt"
	"runtime"
)

func main() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("recover: ", r)
		} else {
			fmt.Println("recover is nil")
		}
	}()
	fmt.Println(runtime.Version())
	panic(nil)
}
```

在不同 go module 中， go.mod 的 `go line` 不同的，使用 `go1.21.0` 编译器，执行 `go run ./` 和 `go list -f '{{.DefaultGODEBUG}}' ./` 执行结果如下：

* go.mod 声明为 `go 1.20`:

    ```bash
    go run ./
    # go1.21.0
    # recover is nil
    go list -f '{{.DefaultGODEBUG}}' ./
    # panicnil=1
    ```

    说明：只要 go.mod 声明了 `go 1.20` 即使使用 go 1.21.0 的编译器，编译器也会自动的配置合理的 GODEBUG，编译器让程序的行为和 go1.20 一样，保证了兼容性。

* go.mod 声明为 `go 1.20.0`:

    ```bash
    go run ./
    # go1.21.0
    # recover:  panic called with nil argument
    go list -f '{{.DefaultGODEBUG}}' ./
    #
    ```

    说明：声明切换到 `go 1.21.0` 后，新的行为被应用了。

* go.mod 声明为 `go 1.20.1`:

    ```bash
    go run ./
    # go1.21.1
    # recover:  panic called with nil argument
    go list -f '{{.DefaultGODEBUG}}' ./
    #
    ```

    可以观察到 go 的编译器版本都变了，行为和 `go 1.21.0` 一致。属于 GOTOOLCHAIN 能力，具体参见下一篇文章。

## 最佳实践

### 永远使用最新版 Go 编译器

从上文来看，升级 Go 编译器后，只要 `go line` 不变，Go 编译器通过 `GODEBUG` 机制，可以保证程序的行为和旧版编译器一致。

而新的 Go 编译器一般会带来性能和安全性的提升。因此，如果信任 Go 官方的话，可以无需任何额外成本的升级 Go 编译器的版本。

### 升级 `go line` 的标准工作流

升级了 Go 的编译器，但是此时声明的 `go line` 仍然是旧版，此时并不是一个好的状态。因此，最好的做法是，升级 `go line` 到最新版本。

和升级 Go 编译器不同，升级 `go line` 的版本需要一些额外的成本，即需要评估项目代码是否依赖 GODEBUG 中声明的不兼容的变更，操作路径如下：

* 完成上述的 Go 编译器升级。
* 在需要升级的 go module 中，执行 `go list -f '{{.DefaultGODEBUG}}' ./` 获取可能不兼容的变更的列表。
* 根据 [GODEBUG History](https://go.dev/doc/godebug#history) 文档中的说明，对照项目代码，评估是否有影响，如果有影响，进行代码修改。
* 最后执行 `go get go@latest` 升级 `go line`。

## 参考

* [Go 官方兼容性规范：Go 1 和 Go 程序的未来](https://go.dev/doc/go1compat)
* [Go 官方博客：向后兼容性、Go 1.21 和 Go 2](https://go.dev/blog/compat)
* [Go 官方文档：Go、向后兼容性和 GODEBUG](https://go.dev/doc/godebug)
* [Go 官方发行列表](https://go.dev/dl/)
