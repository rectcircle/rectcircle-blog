---
title: "Containerd 详解（二） 核心流程"
date: 2023-04-29T12:55:23+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> version: [v1.7.0](https://github.com/containerd/containerd/tree/v1.7.0)

## 概述

本部分将使用 Go 语言实现一个简单的示例程序，该程序通过对 containerd 的 go client：

* 拉取 `"docker.io/library/busybox:1.36"` 镜像。
* 使用 busybox 启动一个 container，运行 `sleep infinity` 命令。
* （可选） 睡眠 60 秒，在这期间，使用 ctr 命令查看镜像，container 以及 task。
* 程序退出前，删除 container。

本系列所有代码位于： github [rectcircle/learn-contaierd-experiment](https://github.com/rectcircle/learn-contaierd-experiment)。

## 示例程序

`01-core-process/main.go`

```go
// go build ./01-core-process/main.go && sudo ./main

package main

import (
	"context"
	"log"

	// "time"

	"github.com/containerd/containerd"
	"github.com/containerd/containerd/namespaces"
	"github.com/containerd/containerd/oci"
)

func main() {
	if err := busyboxExample(); err != nil {
		log.Fatal(err)
	}
}

func busyboxExample() error {
	client, err := containerd.New("/run/containerd/containerd.sock")
	if err != nil {
		return err
	}
	defer client.Close()

	ctx := namespaces.WithNamespace(context.Background(), "default")
	image, err := client.Pull(ctx, "docker.io/library/busybox:1.36", containerd.WithPullUnpack)
	if err != nil {
		return err
	}
	log.Printf("Successfully pulled %s image\n", image.Name())

	container, err := client.NewContainer(
		ctx,
		"busybox",
		containerd.WithNewSnapshot("busybox", image),
		containerd.WithNewSpec(
			oci.WithImageConfig(image),
			oci.WithProcessArgs("sleep", "infinity"),
		),
	)
	if err != nil {
		return err
	}
	defer container.Delete(ctx, containerd.WithSnapshotCleanup)
	log.Printf("Successfully created container with ID %s and snapshot with ID busybox", container.ID())
	// time.Sleep(60 * time.Second)
	return nil
}
```

## 源码分析

使用 VSCode 打开示例代码库，安装 Go 扩展，打开调试视图，选择 `Launch: 01-core-process`，启动调试，单步分析执行过程。

### 创建 client

`client, err = containerd.New("/run/containerd/containerd.sock")`

* 构建一个 containerd 的 client。
* 第一个参数为 containerd 的 sock 文件。
* 可选的一些 client 选项，一些默认值如下：
    * `timeout` 超时时间，为 `10` 秒。
    * `runtime` 运行时，为 `io.containerd.runc.v2`。
  
### 创建 namespace

建立在 containerd 的上层应用有很多，如 Kubernetes、Docker。为了支持同一个机器可以同时安装 Kubernetes、Docker 以及基于 containerd 的其他应用。

containerd 提供了 namespace 的概念对这些上层应用进行隔离。也就是说，docker 是 containerd 中是一个 namespace、Kubernetes 也是一个 namespace。

这两者相互之间无法看到对方创建的 Container。

在 Client 层面，namespace 使用 ctx 传递给 client 的所有接口，最终作为 GRPC 的 Header 透传到 containerd 的 deamon。

```go
ctx := namespaces.WithNamespace(context.Background(), "default")
```

### 拉取镜像

`image, err := client.Pull(ctx, "docker.io/library/busybox:1.36", containerd.WithPullUnpack)`

参数说明：

* 第一个参数 ctx 上下文，可以配置 namespace、租约等。
* 第二个参数为拉取的镜像应用字符串。
* 第三个参数为一个选项，表示下载下来镜像后，使用 snapshotter 进行解包。

客户端流程出下：

* 获取一个 pullCtx，类型为 `RemoteContext`，包含一个镜像 Resolver，默认为 Docker Registry Resolver，用来对接具体的镜像仓库的实现。
* 如果没有的话，申请一个租约，有效期为 24 小时。租约是一种对资源处于使用状态的一种标记。在有效期内的资源都不会被垃圾回收。更多参见： [docs](https://github.com/containerd/containerd/blob/main/docs/garbage-collection.md#what-is-a-lease)。
* 配置了 `WithPullUnpack`，因此需要获取 snapshotter，默认为 overlayfs。并构造一个 unpacker。
* 调用 fetch 函数，下载镜像。
    * 获取 ContentStore
    * 使用 pullCtx 的 Resolver 从镜像仓库获取要拉取的镜像的 `index.json` （docker 中媒体类型为 `"application/vnd.docker.distribution.manifest.list.v2+json"`）。
    * 构造一个处理函数链，在这个函数链中根据配置下载镜像内容。
    * 通过 `images.Dispatch` 调用这个处理函数链，下载到 `/var/lib/containerd/io.containerd.content.v1.content`。
    * 在一个协程中，进行 unpack，参见下文。
    * 需要特别说明的是：
        * 获取 `index.json` 以及后续所有内容的下载完全发生在客户端。
        * 客户端获取到文件流后，通过 GRPC 调用 containerd deamon 的 ContentStore 服务将文件内容写到指定位置中。
* 调用 unpacker 的 wait 等待 unpack 执行完成，unpack 逻辑如下，针对镜像的每一层：
    * 调用 `Snapshotter.Stat`，检查该层是否已经就绪，如果已经就绪，则什么都不做。否则执行后续操作。
    * 调用 `Snapshotter.Prepare`，创建用于存储该层的目录路径（类型 `[]Mount`），如 `"/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/18/fs"`。
    * 通过 GRPC 调用 containerd deamon 的 diff api 的 Apply 函数，将层的内容写入上一步的目录。
    * 调用 `Snapshotter.Commit`，提交该层的 snapshot，完成后该层的 Snapshot 创建完成。
* 调用镜像服务，创建该镜像，如果镜像存在则更新该镜像。

### 启动容器

## 核心概念

* Image
* Snapshot
* Container
* Task https://github.com/containerd/containerd/discussions/4458

## 插件体系

https://juejin.cn/post/6908619706211500039

## 示例代码

## 执行分析
