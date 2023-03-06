---
title: "Nix 详解（三） nix 领域特定语言"
date: 2023-02-25T20:48:49+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> version: nix-2.14.1

## 概述

为了更好的描述一个包，从源码到制品的过程，nix 设计了一套领域特定语言（DSL），来声明一个包。这个语言就叫做 nix 语言。

nix 是一种特定领域的、纯函数式的、惰性求值的、动态类型的编程语言。

该语言主要的应用场景为：

* 定义一个 nix channel，之前文章多次提到的 nixpkgs 收录的超过 8 万个包，就是通过 nix 语言声明的。
* 在 `shell.nix` 中使用，正如之前文章所讲，其可以为一个项目定义一个可重现的隔离的开发环境。
* 在 NixOS 中，来定义操作系统环境，本系列不多赘述。

## Hello World

`nix-lang-demo/01-hello.nix`

```nix
let
  msg = "hello world";
in msg
```

运行代码，`nix-instantiate --eval nix-lang-demo/01-hello.nix`，输出如下：

```
"hello world"
```

除了直接运行一个 `.nix` 代码文件外。通过实验性的 `nix repl` 命令，可以打开一个 nix 交互式 shell，来交互式的执行 nix 表达式。

## 程序结构

和常规的命令式通用编程语言不同，nix 是一种声明式的表达式语言。

常规的 Go、Java、C 等编程语言，一个程序的入口是一个 main 函数。

在 nix 中，没有一个 main 函数。一个 nix 的程序就是 nix 提供的几种基本结构组合而成的表达式。

在执行一个正确的 nix 程序时，解释器最终会推导出一个且必须推导出一个值出来。这个值，必须是 nix 支持的几种数据类型之一，参见下文。

## 数据类型

nix 的数据类型类似于 JSON，可以分为基本数据类型、列表和属性集。

### 基本数据类型

### 列表

### 属性集

## 命名

## 操作

## 函数

## 库

## 非纯函数

## 推导 (derivation)

https://www.zhihu.com/question/279855101/answer/2023496231

## nixpkgs 分析

## 自定义 channel
