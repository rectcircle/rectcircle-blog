---
title: "Go HTTP Client 和 http_proxy 环境变量"
date: 2022-03-26T19:09:01+08:00
draft: false
toc: true
comments: true
tags:
  - golang
---

## 概述

在某个场景中，一个 Go 程序在运行时可能会存在 http_proxy、https_proxy、no_proxy 环境变量。而我们并不希望该 Go 程序中的 http client 走这些环境变量配置的代理。

## 实现

### 方式一：unset 环境变量

HTTP Client 位于 Go 标准库 http 包中，http 包导出了如下关于 http client 相关的默认变量：

* `http.DefaultClient *http.Client`，从 `http.Client.transport` 的实现可以看出 `http.DefaultClient` 会调用 `http.DefaultTransport`。
* `http.DefaultTransport *http.Transport` 的 Proxy 字段会被设置为 `ProxyFromEnvironment`，ProxyFromEnvironment 会读取 `http_proxy` 等相关环境变量。
  
可看出，这些环境变量会在第一次发起 http client 请求时被读取，然后就不会变了。

此外，我们需要让 unset 的调用在其他所有 init 之前执行（防止如果其他 init 函数调用了 http client 就会导致 `ProxyFromEnvironment` 得到调用，从而导致再 unset 也不生效）。

站在 package 的视角看，go 的初始化顺序为：

![image](/image/go-init-seq.png)

同一个包如果有多个文件，可以理解为，需要按照如下规则将拼装成单文件：

1. 将所有文件按照文件名按照 ascii 顺序排列
2. 抽取每个文件的 import 块按照第一步的顺序合并
3. 每个文件的剩下的部分按照第一步的顺序合并

因此我们需要按照如下方式操作，才能确保 unsetenv 在其他 init 函数之前执行：

1. 创建一个 `unsetenv` 包，并在 init 函数中执行  unsetenv 函数，`unsetenv/unsetenv.go`。

    ```go
    package unsetenv

    func init() {
        os.Unsetenv("HTTP_PROXY")
        os.Unsetenv("http_proxy")
        os.Unsetenv("HTTPS_PROXY")
        os.Unsetenv("https_proxy")
        os.Unsetenv("NO_PROXY")
        os.Unsetenv("no_proxy")
        os.Unsetenv("REQUEST_METHOD")
    }
    ```

2. 在 `main` 包，创建 `0.go` 文件。并导入 `unsetenv` 包

    ```go
    package main

    import (
        _ "xxx/xxx/unsetenv"
    )
    ```

说明：

1. 文件名必须是 `0.go`，`0` 在 ascii 码中排序小，才能保证其在 main 包中的所有的其他文件之前执行。
2. 如下所示的方法，直接在包含 main 函数的文件中，直接导入 `unsetenv` 是不可以的，因为 gofmt 会强制对 import 进行排序，无法保证 `unsetenv` 在其他包的 init 函数之前执行。

    ```go
    package main

    import (
        // ...
        _ "xxx/xxx/unsetenv"
        // ...
    )

    func main() {
        // ...
    }
    ```

### 方式二：手动配置 http.Client

配置所有的 http client 的 `*http.Transport.Proxy` 为 nil

```go
// 默认的 DefaultTransport 的 Proxy 设置为 nil
http.DefaultTransport.(*http.Transport).Proxy = nil
// 其他手动创建的 http.Transport （注意包含简介引用的地方）的 Proxy 设置为 nil
```

## 结语

从这个场景可以看出，依赖全局变量以及 `init()` 函数是一个非常不好的设计，因为开发者很难控制这些全局变量和 `init()` 的初始化顺序。因此我们在工程中，要尽量避免使用全局变量以及 `init()` 函数。

比如对 http client 的使用，需要避免使用 `http.DefaultClient` 和 `http.DefaultTransport`。

这样，我们就不需要通过如上方式一，如此不优雅的方式来实现该场景了。
