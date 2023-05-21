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

### 拉取镜像

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
