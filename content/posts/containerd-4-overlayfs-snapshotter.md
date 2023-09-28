---
title: "Containerd 详解（四） overlayfs snapshotter"
date: 2023-04-29T12:55:23+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> version: [v1.7.0](https://github.com/containerd/containerd/tree/v1.7.0)

## 概述

前面几篇也有提到了 snapshotter 的一些内容，但并未深入细节。

本文将介绍 overlayfs snapshotter 的注册、执行流程以及 Snapshotter 接口的设计考量。为下一篇介绍如何实现一个自定义的 Snapshotter、或魔改 Snapshotter 提供准备。

## 环境准备

参见：[Containerd 详解（三） containerd 源码框架 - 环境准备](/posts/containerd-3-containerd-source-framework/#环境准备)

要点如下：

```bash
# 清理环境 (Linux 测试机)
sudo systemctl stop containerd
sudo rm -rf /var/lib/containerd
# dlv 启动 (Linux 测试机)
sudo ~/go/bin/dlv exec ./bin/containerd --headless --listen 0.0.0.0:2345 --api-version 2
# 打开 VSCode F5 启动 (本地设备)
```

## 源码结构

overlayfs snapshotter 是 containerd 的内建插件，也是默认的 snapshotter。其实现位于 containerd 项目的 `snapshots/overlay` 目录，仅有 3 个代码文件（不包含测试）。

* `snapshots/overlay/plugin/plugin.go` 插件注册：containerd 在启动时会调用 import 该包，执行里面的 init 函数，注册插件。
* `snapshots/overlay/overlay.go` 插件实现：实现了 `snapshots/snapshotter.go@Snapshotter` 接口。
* `snapshots/overlay/overlayutils/check.go` 插件实现依赖的工具函数。

## 流程分析

### 插件注册

containerd 的插件注册是基于 go 的 init 函数机制实现的，调用链路为：`cmd/containerd/main.go` -> `cmd/containerd/builtins/builtins_linux.go` -> `snapshots/overlay/plugin/plugin.go`。

`snapshots/overlay/plugin/plugin.go` 中，注册了一个 ID 为 `"overlayfs"` Type 为 `""io.containerd.snapshotter.v1""` 的插件。在 `InitFn` 函数，最终调用 `overlay.NewSnapshotter`，参数值：

* `root`: `"/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs"`
* `opts`: `overlay.AsynchronousRemove`，即异步删除。

按照如上参数， `overlay.NewSnapshotter` 返回：

```go
&overlay.snapshotter{
	root:          "/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs",
	ms:            &storage.MetaStore{ 
		dbfile: "/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/metadata.db",
	},
	asyncRemove:   true,
	upperdirLabel: false,
	indexOff:      true, // /sys/module/overlay/parameters/index
	userxattr:     false,
}
```

### 拉新的镜像

打开 `snapshots/overlay/overlay.go`，在所有导出的函数添加断点。

删除 `/var/lib/containerd` 并重启启动调试，执行 `sudo ctr images pull docker.io/library/nginx:1.25`，流程如下：

* 处理镜像的第 1 层
    * `Prepare` 函数
        * 参数为：
            * `key`: `"default/1/extract-675469558-0Gcu sha256:d310e774110ab038b30c6a5f7b7f7dd527dbe527854496bd30194b9ee6ea496e"`
            * `parent`: `""`
            * `opts`: `{snapshots.WithLabels({...})}`
        * 逻辑如下：
            * 调用 `createSnapshot` 函数
                * 创建 `"/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/new-xxx/{fs,work}"` 临时目录。
                * 调用 `storage.CreateSnapshot` 创建一个元数据 `snapshots.Info`，并返回 `s := storage.Snapshot{ID: "1", Kind: KindActive(2), ParentIDs: nil}`。
                * 构造快照目录路径 `"/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/1"` （这里的 1 为 `s.ID`）。
                * 将 `"/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/new-xxx"` 重命名为 `"/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/1"`。
            * 调用 `mounts` 函数，参数为 `storage.Snapshot{ID: "1", Kind: KindActive(2), ParentIDs: nil}`，因为 ParentIDs 为 nil，所以返回： `[]mount.Mount{ { Source: "/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/1/fs", Type: "bind", Options: []string{"rw", "rbind"} } }`
    * 调用 diff api，解压并处理该层，观察 `/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/1/fs` 目录，里面已经存在镜像第一层内容。
    * `Commit` 函数
        * 参数为：
            * `name`: `"default/2/sha256:d310e774110ab038b30c6a5f7b7f7dd527dbe527854496bd30194b9ee6ea496e"`
            *`key`: `"default/1/extract-347006525-FddQ sha256:d310e774110ab038b30c6a5f7b7f7dd527dbe527854496bd30194b9ee6ea496e"`
            * `opts`: `{snapshots.WithLabels({...})}`
        * 逻辑如下：
            * 获取 `storage.Snapshot` 的 ID，并构造 upper 目录： `/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/1/fs`
            * 统计上述目录使用 inode 和 磁盘空间。
            * 调用 `storage.CommitActive(..., key, name, ...)` 标记该快照已提交 (`Kind: snapshots.KindCommitted(3)`)，实现为：根据 `key` 查询到 `storage.Snapshot`，填充相关参数，并保存到 id 为 `name` 的 bucket 中。
* 处理镜像的第 2~n 层 （以第 2 层为例）
    * `Prepare` 函数
        * 参数为：
            * `key`: `"default/3/extract-975267327-qRqB sha256:7e87866b23143eb30086086a669b2e902368a5836446a885b2411d3feef18bef"`
            * `parent`: `"default/2/sha256:d310e774110ab038b30c6a5f7b7f7dd527dbe527854496bd30194b9ee6ea496e"`
            * `opts`: `{snapshots.WithLabels({...})}`
        * 逻辑如下：
            * 调用 `createSnapshot` 函数
                * 创建 `"/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/new-xxx/{fs,work}"` 临时目录。
                * 调用 `storage.CreateSnapshot` 创建一个元数据 `snapshots.Info`，并返回 `s := storage.Snapshot{ID: "2", Kind: KindActive(2), ParentIDs: []string{"1"}}`，这里的 ParentIDs 如果有多个，是从顶层到底层排序的。
                * 修改 `"/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/new-xxx/fs"` 的权限和 `s.ParentIDs[0]` 一致（即 `/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/1/fs`）。
                * 构造快照目录路径 `"/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/2"` （这里的 2 为 `s.ID`）。
                * 将 `"/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/new-xxx"` 重命名为 `"/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/2"`。
            * 调用 `mounts` 函数，参数为 `storage.Snapshot{ID: "1", Kind: KindActive(2), ParentIDs: nil}`，因为 ParentIDs 不为 nil，所以返回： `[]mount.Mount{ { Source: "overlay", Type: "overlay", Options: []string{...} } }`，options 如下：
                * `"index=off"`
                * `"workdir=/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/2/work"`
                * `"upperdir=/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/2/fs"`
                * `"lowerdir=/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/1/fs"` 多个以 `:` 分隔。
    * 调用 diff api，解压并处理该层，观察 `/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/2/fs` 目录，里面已经存在镜像第 2 层内容。
    * `Commit` 函数，和第 1 层处理逻辑一致。

### diff api

TODO

### 拉已存在的镜像

在第一次拉镜像完成后，再次执行 `sudo ctr images pull docker.io/library/nginx:1.25`，流程如下：

针对每一层，调用 `Stat` 函数

* 参数 `key` 为 `"default/2/sha256:d310e774110ab038b30c6a5f7b7f7dd527dbe527854496bd30194b9ee6ea496e"`。逻辑如下：
* 逻辑为 调用 `storage.GetInfo` 获取到 snapshots.Info 并返回。

### TODO

```bash

sudo ctr run docker.io/library/nginx:1.25.2 nginx
# sudo ctr task kill -s 9 nginx  # 停止 task
# sudo ctr container rm nginx    # 删除 container
# sudo ctr snapshot delete nginx # 删除 snapshot
```

### 配置详解

## Snapshotter 接口

https://dev.to/napicella/what-is-a-containerd-snapshotters-3eo2

https://www.jianshu.com/p/86296691ca49
