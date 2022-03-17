---
title: "Go 1.18 新特性"
date: 2022-03-17T23:40:42+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> 官方文档：[Go 1.18 Release Notes](https://go.dev/doc/go1.18)

## 介绍

Go 1.18 是一个非常重要的更新。Go 1.18 虽然发布了泛型和工作空间等重磅特性。但是仍提供了完全的 [Go 1 兼容性](https://go.dev/doc/go1compat)，也就是说，符合 [Go 1 兼容性](https://go.dev/doc/go1compat) 要求的代码均可直接使用 Go 1.18 编译。

本文整体参考 [Go 1.18 Release Notes](https://go.dev/doc/go1.18) 文档。介绍与 Go 1.17 相比，Go 1.18 的新特性。

## 安装 Go 1.18

前往 [下载地址](https://go.dev/dl/) ，下载安装 Go 1.18。

## 泛型

> 官方提案：[Type Parameters Proposal](https://go.googlesource.com/proposal/+/refs/heads/master/design/43651-type-parameters.md)

### 简述

在语言特性方面，Go 1.18 带来了 Go 开发者期待已久的泛型。

### 高层次的概述

* `泛型函数`：函数可以有一个使用方括号的附加的`类型参数列表`，这些`类型参数`可以被常规参数和函数体使用，包含`类型参数列表`的函数叫`泛型函数`。例如：`func F[T any](p T) { ... }`，从该例可以看出
    * 和 C++ / Java 不同，Go 泛型参数是通过方括号 `[]` 包裹的。
    * 类型参数 `T` 被常规参数 `p` 使用，是 p 的类型。
* `泛型类型`：类型也可以有一个`类型参数列表`，包含`类型参数列表`的类型叫做`泛型类型`，例如：`type M[T any] []T`。
* `类型约束`：每个`类型参数`都有一个`类型约束`，类型约束必须是一个接口类型，如 `func F[T Constraint](p T) { ... }`。
* `any` 类型：新的预声明名称 `any` 表示，允许任何类型的类型约束。
* 被用作`类型约束`的接口类型：可以通过嵌入额外元素的方式，来限制某个`类型参数`必须是满足某些约束的集合，这些嵌入的元素可以是：
    * `T` 约束为具体类型 `T`
    * `~T` [底层类型](https://lingchao.xin/post/type-system-overview.html#%E6%A6%82%E5%BF%B5-%E5%BA%95%E5%B1%82%E7%B1%BB%E5%9E%8B)为 `T` 的所有类型
    * `T1 | T2 | ...` 表示为以 `|` 分割列出的的元素
* 调用`泛型函数`：
    * 需要传递类型参数，如果类型推断可以推断出类型时，可以忽略。
    * 普通参数的类型为泛型参数时，只能使用类型符合该泛型参数约束的变量调用该函数。
* 使用`泛型类型`：需要传递类型参数。

## 工作空间
