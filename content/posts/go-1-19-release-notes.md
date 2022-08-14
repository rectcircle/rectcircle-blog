---
title: "Go 1.19 发行说明"
date: 2022-08-06T10:24:40+08:00
draft: false
toc: true
comments: true
tags:
  - golang
---

## 值得开发者关注的特性

* 更新 [内存模型文档](https://go.dev/ref/mem)，是其更易读。阅读改文章，可以避免一些并发内存访问不当，导致的非预期问题。
* [sync/atomic](https://pkg.go.dev/sync/atomic#pkg-types) 新增了一些易用的类型，如 `atomic.Int64` 等。
* [文档注释](https://go.dev/doc/comment)，终于支持链接、列表，以及明确的标题语法。
* 软内存限制，通过 [`runtime/debug.SetMemoryLimit`](/pkg/runtime/debug/#SetMemoryLimit) 和 [`GOMEMLIMIT`](/pkg/runtime/#hdr-Environment_Variables) 环境变量配置。在某些不期望内存占用过多，期望提早 GC 以及释放内存给 OS 的场景可以使用。

## 语言层面改变

基本上没有变化，仅修复了一个 [bug](https://github.com/golang/go/issues/52038)。

## 内存模型更新

2022 年 6 月 6 日，[更新](https://github.com/golang/go/commit/865911424d509184d95d3f9fc6a8301927117fdc?diff=split)了 [Go 内存模型文档](https://go.dev/ref/mem)（参见：[讨论](https://github.com/golang/go/discussions/47141)），和 C、C++、Java、JavaScript、Rust 和 Swift 对齐。

Go 只提供[顺序一致](https://en.wikipedia.org/wiki/Sequential_consistency)原子操作 (sequentially consistent atomics)，而不是其他语言中的任何更宽松的形式（[浅谈Happens-Before：以Go Memory Model为例](https://www.yuque.com/gamergodot/kcfazr/ixxbyo)）。

在 Go 1.19，标准库的 [sync/atomic](https://go.dev/doc/go1.19#atomic_types) 包添加了新的 atomic 类型，如：[atomic.Int64](https://go.dev/pkg/sync/atomic/#Int64) 和 [atomic.Pointer[T]](https://go.dev/pkg/sync/atomic/#Pointer) 等。

## 端

* 支持 Linux [龙芯架构](https://loongson.github.io/LoongArch-Documentation/) (`GOOS=linux`, `GOARCH=loong64`)。实现的 ABI 是 LP64D。支持的最低内核版本为 5.19。
* riscv64 现在支持使用寄存器传递函数参数和结果。基准测试显示 riscv64 的典型性能提升 10% 或更多。

## 工具

### 文档注释

添加了对链接、列表和更清晰标题的支持，在 2022-06-01 新增了一篇关于文档注释的[官方文档](https://go.dev/doc/comment)。

* 外部链接，和 [markdown 引用链接](https://spec.commonmark.org/0.30/#shortcut-reference-link)类似。

    ```
    // Package json implements encoding and decoding of JSON as defined in
    // [RFC 7159]. The mapping between JSON and Go values is described
    // in the documentation for the Marshal and Unmarshal functions.
    //
    // For an introduction to this package, see the article
    // “[JSON and Go].”
    //
    // [RFC 7159]: https://tools.ietf.org/html/rfc7159
    // [JSON and Go]: https://golang.org/doc/articles/json_and_go.html
    package json
    ```

* 文档链接，形如 `[Name1]`、`[Name1.Name2]`、`[pkg]`， `[example.com/sys.File]`，为了避免和 map list 的歧义，文档链接前后必须有空格或表单符号等字符。
* 列表和 markdown 类似。

    * 无需列表，以 `*`, `+`, `-`, `•`; `U+002A`, `U+002B`, `U+002D`, `U+2022` 开头

        ```
        package url

        // PublicSuffixList provides the public suffix of a domain. For example:
        //   - the public suffix of "example.com" is "com",
        //   - the public suffix of "foo1.foo2.foo3.co.uk" is "co.uk", and
        //   - the public suffix of "bar.pvt.k12.ma.us" is "pvt.k12.ma.us".
        //
        // ...
        type PublicSuffixList interface {
            ...
        }
        ```

    * 有序列表，以数字开头

        ```
        package path

        // Clean returns the shortest path name equivalent to path
        // by purely lexical processing. It applies the following rules
        // iteratively until no further processing can be done:
        //
        //  1. Replace multiple slashes with a single slash.
        //  2. Eliminate each . path name element (the current directory).
        //  3. Eliminate each inner .. path name element (the parent directory)
        //     along with the non-.. element that precedes it.
        //  4. Eliminate .. elements that begin a rooted path:
        //     that is, replace "/.." by "/" at the beginning of a path.
        //
        // ...
        func Clean(path string) string {
            ...
        }
        ```

* 标题，以 `#` 开头，而不是之前的隐式的规则。

### 新的 unix 构建约束

现在可以在 `//go:build` 行中识别构建约束 `unix`。如果目标操作系统（也称为 GOOS）是 Unix 或类 Unix 系统，则满足约束。对于 1.19 版本，如果 GOOS 是 `aix`、`android`、`darwin`、`dragonfly`、`freebsd`、`hurd`、`illumos`、`ios`、`linux`、`netbsd`、`openbsd` 或 `solaris` 之一，则满足要求。在未来的版本中，unix 约束可能会匹配其他新支持的操作系统。

### Go command

参见：[原文](https://go.dev/doc/go1.19#atomic_types#go-command)。

### Vet

添加一个新的检查器，`errorsas`，当 `errors.As` 的第二个参数是 `*error` 类型时报错。

## 运行时

* 通过 [`runtime/debug.SetMemoryLimit`](/pkg/runtime/debug/#SetMemoryLimit) 和 [`GOMEMLIMIT`](/pkg/runtime/#hdr-Environment_Variables) 环境变量，可以配置软内存限制(soft memory limit)。Go 运行时会尽力维持内存消耗小于该限制，此功能不保证：
    * 过小的内存限制不会遵守，约几十m以下，参见：[issue](https://go.dev/issue/52433)。
    * 不能 100% 消除 OOM。
* import os 会自动增加 可打开的最大文件描述符数量 到 hard limits，参见：[issue](https://github.com/golang/go/issues/46279)。
* 除非 `GOTRACEBACK=system` 或 `crash`，否则不可恢复的致命错误（例如并发写 map 或解锁未锁定的 mutex）现在打印更简单的堆栈，不包括运行时元数据。无论 GOTRACEBACK 的值如何，运行时内部的致命错误回溯始终包含完整的元数据。
* 在 ARM64 上添加了对调试器注入函数调用的支持，使用户能够在使用经过更新以利用此功能的调试器时，在交互式调试会话中从其二进制文件调用函数（[dlv 已支持](https://github.com/go-delve/delve/blob/master/CHANGELOG.md#190-2022-07-06)）。

## 编译器

switch 字符串和数字使用[跳表](https://en.wikipedia.org/wiki/Branch_table)实现，性能提升 20%。

其他：[略](https://go.dev/doc/go1.19#compiler)

## 汇编器

[略](https://go.dev/doc/go1.19#assembler)

## 链接器

[略](https://go.dev/doc/go1.19#linker)

## 核心库

### 新的 atomic 类型

上文 [内存模型更新](#内存模型更新) 已介绍，更多参见： [go docs](https://pkg.go.dev/sync/atomic#pkg-types)。

### os/exec 可执行文件路径查找

出于[安全原因](https://go.dev/blog/path-security)，`exec.Command("prog")` 默认将不会查找 work directory。这个改变可能破坏了现有程序，更多参见：[os/exec go docs](https://pkg.go.dev/os/exec#hdr-Executables_in_the_current_directory)

### 小的改变

[略](https://go.dev/doc/go1.19#minor_library_changes)
