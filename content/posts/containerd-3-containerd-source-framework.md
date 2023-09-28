---
title: "Containerd 详解（三） containerd 源码框架"
date: 2023-05-28T21:40:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> version: [v1.7.0](https://github.com/containerd/containerd/tree/v1.7.0)

## 概述

Containerd [项目源码](https://github.com/containerd/containerd) 根目录有几十个目录和文件，想要了解该项目的源码，需要先了解该项目的整体框架。

从前文可知， containerd 的安装实际上是在操作系统中启动了一个 deamon 进程，该进程的可执行文件为 `bin/containerd`，对应的 main 函数为 [`cmd/containerd/main.go`](https://github.com/containerd/containerd/blob/v1.7.0/cmd/containerd/main.go)。

本文将从 containerd deamon 的视角，从 `cmd/containerd/main.go` 源码文件入手，探索该项目源码的框架结构。

## 环境准备

为了更好的跟踪流程，本文通过 VSCode Golang 扩展 + dlv 提供的可视化 debug 能力，观测整体流程。特别说明的时，下文：

* 编译安装、dlv 启动：在 Linux 测试机执行
* vscode attach：在本地设备执行

### 编译安装

> [BUILDING.md](https://github.com/containerd/containerd/blob/v1.7.0/BUILDING.md)

* Linux amd64 系统环境
* Go v1.20+

```bash
# 1. clone 代码并检出指定版本
git clone https://github.com/containerd/containerd.git
cd containerd
git checkout v1.7.0
# 2. 安装 protobuild 等命令
script/setup/install-dev-tools
# 安装 runc cni 等 （第一篇已经安装了可以忽略）
# make install-deps
# 3. 带调试符号的构建
make GODEBUG=1
```

### dlv 启动

```bash
# 第一篇如果已经启动了 containerd 需停止
sudo systemctl stop containerd
# 安装 dlv 调试器
go install github.com/go-delve/delve/cmd/dlv@latest
# 使用 dlv 启动
sudo ~/go/bin/dlv exec ./bin/containerd --headless --listen 0.0.0.0:2345 --api-version 2
```

### vscode attach

> 在本地设备执行

clone 代码，并用 vscode 打开

```bash
git clone https://github.com/containerd/containerd.git
cd containerd
git checkout v1.7.0
code ./
```

配置调试器

`.vscode/launch.json`

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Connect to server",
            "type": "go",
            "request": "attach",
            "mode": "remote",
            "remotePath": "/home/rectcircle/test/containerd", // 远端 Linux 编译路径
            "port": 2345,
            "host": "192.168.31.7", // 远端 Linux IP
        }
    ]
}
```

按 F5 连接

## 启动流程

`cmd/containerd/main.go` 流程如下：

```
cmd/containerd/main.go                     # 程序入口文件
  +-> cmd/containerd/builtins/             # 内建插件注册 (插件，参见下文)
  +-> init()                               # 初始化随机数种子，设置 SHA256 hasher
  +-> main()                               # main 函数
        +-> cmd/containerd/command/main.go   # 构建 App
              +-> metrics/                   # 初始化 metrics
              +-> init()                     # 初始化日志和版本打印函数
              +-> App()                      # 初始化 app 对象，配置全局命令行参数，子命令
        +-> app.Run()                      # 启动 app
              +-> cmd/containerd/command/main.go@App().Action  # 调用该命令的 Action 函数，参见下文
```

`cmd/containerd/command/main.go@App().Action` 流程如下（忽略 metrics server、ttrpc 相关外围逻辑）：

* 通过命令行参数 `--config` 获取配置文件参数路径（默认为 /etc/containerd/config.toml），并解析配置文件，并进行参数校验。
* 调用 `services/server/server.go@CreateTopLevelDirectories` 创建 containerd 数据和状态存储目录，默认参见 `defaults/defaults_unix.go`。
* 注册信号处理函数，以实现优雅退出。
* 创建临时挂载目录 `/var/lib/containerd/tmpmounts`，并清空当前目录下的所有挂载点。
* 创建并初始化一个 Server， `services/server/server.go@New`。
    * 如果配置了的话，注册 `snapshot` 及 `content` 类型的插件。 （插件，参见下文）
    * 如果配置了的话，注册二进制流处理程序（主要用来处理镜像内容流，一般不需要配置）。
    * 创建 GRPC 的配置 options，并创建 grpcServer。
    * 获取所有注册的插件，执行插件初始化，并获取到插件的 service instance。
    * 针对每个插件的 service instance，调用将 grpcServer 作为参数传递给 Register 函数，将服务注册到 grpcServer 中。
    * 返回 `services/server/server.go@Server` 结构体。
* 在协程中调用 grpcServer.Serve 函数 （`services/server/server.go@ServeGRPC`），启动 grpc 服务。
* 等待信号处理函数关闭 done channel。

## 插件体系

上文介绍了 containerd 的启动流程，其核心逻辑是初始化并启动一个 grpc 服务。而 containerd 的业务逻辑是通过 containerd 定义的一套插件体系实现的初始化和依赖注入的。

* 一个插件实现完成后，通过  `plugin.Register` （源码位于：`plugin/plugin.go@Register`）函数，传递 `plugin.Registration` 结构体指针 （源码位于：`plugin/plugin.go@Registration`）参数，来进行注册，该函数一般在 init 函数中调用。
* 注册的插件在 `services/server/server.go@New` 进行初始化、其中 GPRC 类型的插件注册到 grpcServer 中。
* 在 containerd 中，插件按照业务域进行划分，其的能力一般通过 pb （gprc）进行声明（源码位于：`api/services` 目录）。

下面以 `containers` 为例，其会注册两种类型的插件 `plugin.ServicePlugin` 和 `plugin.GRPCPlugin` （源码位于 `services/containers` 目录）：

* gprc 声明位于 `api/services/containers/v1/containers.proto`。
* service 实现位于 `services/containers/local.go`。
* `plugin.ServicePlugin` 插件注册位于 `services/containers/local.go@init`
* `plugin.GRPCPlugin` 插件注册位于 `services/containers/service.go@init`。

`plugin.Registration` 结构体字段说明如下：

* `Type` 插件类型，如 `"io.containerd.service.v1"`、`"io.containerd.grpc.v1"`、`"io.containerd.snapshotter.v1"` （源码位于：`plugin/plugin.go#L52`）。
* `ID` 插件 ID，如 `containers-service`。
* `Config` 插件的默认配置，在初始化时，会反序列化配置文件的 `[plugins]` 段对应的配置，填充到该结构体中。
* `Requires` 该插件依赖插件类型。
* `InitFn` 初始化函数，传递 `InitContext` 参数（源码位于：`plugin/context.go`），返回一个插件实例对象，类型为 `interface{}`。
* `Disable` 是否禁用插件。

了解了这些信息后，再看初始化流程中关于插件的流程：

* `cmd/containerd/main.go` import 段中的 `_ "github.com/containerd/containerd/cmd/containerd/builtins"` 调用，实际上调用的一系列 init 函数，进行插件注册。
* 在 `services/server/server.go@New` 中：
    * `plugins, err := LoadPlugins(ctx, config)`
        * 注册 `"io.containerd.content.v1"` 插件。
        * 注册配置文件中的配置的 ProxyPlugin `"io.containerd.content.v1"`、`"io.containerd.snapshotter.v1"`。
        * 调用 `plugin.Graph`，对插件按照 `Requires` 声明的依赖关系进行排序，并返回 `[]*plugin.Registration`。
    * `for _, p := range plugins {` 遍历插件列表，针对每个插件，这里的 p 是 `*plugin.Registration` 类型：
        * 构造 `plugin.InitContext`。
        * 反序列化 `/etc/containerd/config.toml` 配置文件中 `[plugins]`，填充 `plugin.Registration` 的 Config 字段。
        * `result := p.Init(initContext)`，该函数会调用 `p.InitFn`，构造并返回 `*plugin.Plugin`， `result.instance` 字段为 `p.InitFn` 的返回值。
        * 如果插件类型是 grpc 类型，那么 `result.instance` 一定实现了 `grpcService` 接口，则将 `result.instance` 添加到 `grpcServices` 数组中。
    * `for _, service := range grpcServices {` 调用 `service.Register(grpcServer)` 注册 grpc 服务。

## snapshot 和 ProxyPlugin

上文提到了如果配置文件配置了 `"io.containerd.content.v1"`、`"io.containerd.snapshotter.v1"` 类型的 ProxyPlugin。初始化流程会初始化这些插件。

ProxyPlugin 是 Containerd 提供的一种扩展机制，可以实现在不修改 containerd 源码的情况下定制 snapshot 的实现，cotainerd 和这些 ProxyPlugin 的通讯方式为 gprc 调用。文档具体参见：[docs](https://github.com/containerd/containerd/tree/v1.7.0/docs/snapshotters)。

这里介绍一下，在源码角度 snapshot 相关 api 的调用过程。

* containerd client
    * 调用 `GetLabel` 获取当前 namespace 下 `"containerd.io/defaults/snapshotter"` 标签的值，该值为具体要使用的 snapshot 的插件的 ID，如果不存在则返回默认实现 `overlayfs`。
    * 调用使用 `snapshots/proxy/proxy.go@NewSnapshotter` 获取到一个 `snapshots.Snapshotter` 客户端。
    * 调用 `snapshots.Snapshotter` 相关 函数，如 `Stat`，会调用 containerd 的 `api/services/snapshots/v1/snapshots.proto`，将第一步获取到 snapshotter 值填充到 req 的 `Snapshotter` 字段。
* containerd deamon
    * 流量会先到达 grpc 插件，这些插件的依赖关系是：
        * 注册于 `services/snapshots/service.go`，插件类型为 `"io.containerd.grpc.v1"` ID 为 `snapshots`，该插件依赖：
        * 注册于 `services/snapshots/snapshotters.go`，类型为 `"io.containerd.service.v1"` ID 为 `snapshots-service` 的插件，instance 类型为 `map[string]snapshots.Snapshotter`，该插件依赖：
        * 注册于 `metadata/plugin/plugin.go`，类型为 `"io.containerd.metadata.v1"` ID 为 `bolt` 的插件，该插件依赖：
        * 类型为 `"io.containerd.snapshotter.v1"` 的插件，有多个，注册于：
            * `vendor/github.com/containerd/aufs/plugin/plugin.go`
            * `snapshots/btrfs/plugin/plugin.go`
            * `snapshots/native/plugin/plugin.go`
            * `snapshots/overlay/plugin/plugin.go`
            * `services/server/server.go@LoadPlugins` 配置于 `/etc/containerd/config.toml` 的 `[proxy_plugins]` 段，类型为 `snapshot` 的 snapshotter。
    * 初始化：
        * `services/snapshots/service.go` 初始化阶段获取 `services/snapshots/snapshotters.go` 返回的 `map[string]snapshots.Snapshotter`。
        * `services/snapshots/snapshotters.go` 初始化阶段调用 `metadata/plugin/plugin.go` 的 `Snapshotters()` 函数。
        * `metadata/plugin/plugin.go` 获取到所有的 `"io.containerd.snapshotter.v1"` 插件，并记录到 `map[string]snapshots.Snapshotter` 中。
    * `services/snapshots/service.go` 所有的函数流程均如下：
        * 从 req 中获取到 `Snapshotter` 字段，从 `map[string]snapshots.Snapshotter` 中获取到对应的 `"io.containerd.snapshotter.v1"` 插件。
        * 根据 req 构造 `snapshots.Snapshotter` 中对应的函数的参数并调用。
        * 将 resp 转换为 grpc 的 resp，并返回。
