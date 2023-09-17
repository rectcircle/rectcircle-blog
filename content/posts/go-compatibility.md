---
title: "Go 兼容性（GODEBUG 和 GOTOOLCHAIN）"
date: 2023-09-17T22:33:00+08:00
draft: true
toc: true
comments: true
tags:
  - golang
---

## 概述

Golang 作为一门现代编程语言，和上世纪的编程语言相比，一大优势就是提供了强有力的兼容性保证。

本文将重点介绍 Golang 1.21 带来新的兼容性保证和相关切实的机制，通过这些机制，可以切实提升 Go 开发者的 “升级率”：

* 消除了开发者对现存项目升级新版 Go 版本（编译器和语法）的顾虑，让开发者可以低成本的享受 Golang 的新特性，而不用担心升级带来的风险。
* 十分有利于 Go 的发展，不会出现类似于 Java TLS 都出 Java 17，大家还在使用 Java 8 的尴尬场面。

有了这些兼容性的机制，Go 1.21 的重要性不亚于 Golang 1.11 Go Module 带来依赖管理，具有里程碑意义。

本文将详细介绍这些机制，希望给 Go 开发者建立一个认知：现在可以将保持在 Go 1.16、Go 1.18 等旧版本的项目，升级 Go 1.21；并在之后 Go 版本发布后，始终让自己的 Go 项目可以保持跟随。

## 概念

### 向后兼容

Golang 的向后兼容指的是，用新版的 Go 编译器编译，历史上的 Go 代码，仍能保证代码编译通过，且运行无误。如：即使 10 年前编写的 Go 代码，使用当前最新的 go1.21 编译器进行编译运行，也不会出现任何问题。

在 Golang 1.21 发布之前，Golang 官方通过 [Go 1 and the Future of Go Programs](https://go.dev/doc/go1compat) 规范定义了 Go 1 的兼容性。但是这篇规范有两个显著的问题：

* 暗示未来 Go 2 的到来，Go 1 的代码可能无法再 Go 2 中编译，就像 Python2 和 Python3 那样。这是令人难以接受。
* 某些特性的更新，并不违反该规范 Go 1 兼容性承诺，但是仍然可能让旧的代码在新的 Go 编译器中编译后运行的行为会失败或不一致。

随着 Golang 1.21 的发布，Golang 官方通过 [Backward Compatibility, Go 1.21, and Go 2](https://go.dev/blog/compat) 博客，明确了上述两个问题：

* 承诺，上述意义的 Go 2 永远不会到来，即永远不会破坏向后兼容。实际上，在 Go 官方看来，自 2017 年来，Go 已经逐步到走向了 Go 2，也就是说现在的 Go 已经是 Go 2 了。
* 分析并归纳了那些不违反 Go 1 兼容性承诺但是仍然后可能破坏兼容性的场景（输入更改、输出更改、协议变更），并通过规范 `GODEBUG` 的使用，来解决这种问题，参见下文：[措施 - GODEBUG](#godebug)。

### 向前兼容

## 措施

### GODEBUG

### GOTOOLCHAIN

## 最佳实践

### 永远使用最新版 Go 编译器

### 升级 `go line` 的标准工作流

[Title](https://go.dev/doc/godebug#history)
[Title](https://go.dev/dl/)
[Title](https://tonybai.com/2023/08/20/some-changes-in-go-1-21/)
[toolchain](https://tip.golang.org/doc/toolchain)
[gopls](https://github.com/golang/tools/blob/master/gopls/README.md)
[Title](https://github.com/golang/vscode-go)
[Title](https://go.dev/blog/compat)
[Title](https://go.dev/doc/go1compat)
[Title](https://tonybai.com/2023/09/10/understand-go-forward-compatibility-and-toolchain-rule/)
