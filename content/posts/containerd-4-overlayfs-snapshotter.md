---
title: "Containerd 详解（四） overlayfs snapshotter"
date: 2023-10-03T22:53:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> version: [v1.7.0](https://github.com/containerd/containerd/tree/v1.7.0)

## 概述

前面几篇也有提到了 snapshotter 的一些内容，但并未深入细节。

本文将介绍 overlayfs snapshotter 的注册、执行流程以及 Snapshotter 接口的设计考量。为下一篇介绍如何实现一个自定义的 Snapshotter、或魔改 Snapshotter 提供准备。

## 概念

**联合文件系统**

即 Union File System，是一种类型文件系统的统称，该类文件系统的特征是：将多个目录按照一定规则联合挂载到目标目录形成一个全新的文件系统，更多参见：[Wiki](https://en.wikipedia.org/wiki/UnionFS)。

最早的联合系统是 [UnionFS](https://unionfs.filesystems.org/)（因此此类文件系统都被叫了这个名字）。

Docker 作为 OCI 标准的参考实现，最早的使用的联合文件系统是 [AUFS](https://en.wikipedia.org/wiki/Aufs)，值得一提的是，对该文件系统的使用，在 OCI Image Spec 中可以看到相关遗产（如： [OCI Image Spec without 文件规范](/posts/oci-image-spec/#whiteout)）

随着 [OverlayFS](https://en.wikipedia.org/wiki/OverlayFS)，进入 Linux 内核，Docker 和衍生自 Docker 的 containerd 使用了该文件系统作为其快照系统的默认实现，因此本文选择该实现来做介绍。

**镜像**

俗称 Docker 镜像，本质上是对某个联合文件系统的打包，目的是实现可复现，易可分发。因此业界指定了 OCI Image Spec。该规范的本质实际上是对 AUFS 的文件系统底层目录的压缩打包和组织。更多参见：[OCI Image Spec](/posts/oci-image-spec/)。

**快照**

快照是本文的核心概念，在 containerd 中：

* 镜像中的每一层、每个容器都会对应一个快照。
* 快照可以存在一个 parent 指针，指向另一个快照。
* 镜像的层对应的快照的 ID 是根据镜像层链表生成的，即 [ChainID](/posts/oci-image-spec/#layer-chainid)。
* 每个快照必须能返回一个最终调用 mount 系统调用的参数集，这个参数集，主要在如下场景使用：
    * 拉取镜像时，从底到上的一层一层的的解压。
    * 运行容器时，构造容器的 rootfs。

## Snapshotter 接口

Snapshotter (`snapshots/snapshotter.go`) 接口本质上就是对快照管理的抽象，该接口在语义上，有两个方面的要求：

* 元数据 `snapshots.Info` 的管理。在内置的 snapshotter 实现中，一般使用 `storage.MetaStore` 来进行元数据管理（底层是 `"go.etcd.io/bbolt"` 一个简单的 kv 数据库）。
* 根据要实现的文件系统类型，对快照的文件目录进行管理。

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

## 插件注册

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

## 流程分析

该部分将介绍 containerd 各种操作对 overlayfs snapshotter 函数调用，以及内部细节，这些函数，除非特别说明均在 `snapshots/overlay/overlay.go` 文件中。

为了方便追踪，打开 `snapshots/overlay/overlay.go`，在将所有导出的函数添加断点。

### 拉新的镜像

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

上文和前篇文档都介绍到了，针对镜像的每一层，mount 完成后，都会调用 diff api 将镜像内容解压到指定路径上，这里来介绍下具体过程。

为了方便追踪，打开 `diff/apply/apply.go`，给 `Apply` 函数添加断点。并删除 `/var/lib/containerd` 并重启启动调试，执行 `sudo ctr images pull docker.io/library/nginx:1.25`。

观察到，流程如下：

* 构建一个面向 `"application/vnd.docker.image.rootfs.diff.tar.gzip"` 格式的解压处理器 `processor` 和镜像层文件流构造一个新的流 `io.Reader` 要求这个流的格式为 tar。
* 调用 `apply`。三个参数分别是：`ctx`、`snapshotter.Prepare` 返回的 `mounts`、上一步获取到的 `io.Reader`。该步骤在不同的操作系统平台的处理逻辑是不同的，这里仅介绍 Linux 平台的逻辑。在 Linux 平台中，针对不同的挂载模式也是不同的逻辑。以 overlay snapshotter 为例，第 1 层 mounts 是 bind、第 2~n 层是 overlay。
    * 针对 bind 类型 mount，调用 `mount.WithTempMount` 函数：创建一个临时目录 （如 `"/var/lib/containerd/tmpmounts/containerd-mount1544590108"`），执行 mount 命令，构造一个文件系统，然后，调用 `archive.Apply` 函数，参数为：
        * `root` 为临时的 mount 目录。
        * `r` 为第一步构建的流。
        * `opts` 为 nil。
    * 针对 overlay 类型 mount，实际上并不会执行该 mount，而是解析可写层 (upper) 路径和 lowers 路径，调用 `archive.Apply`。
        * `root`  upper 路径。
        * `r` 为第一步构建的流。
        * `opts` 有两个，分别为：
            * `archive.WithConvertWhiteout(archive.OverlayConvertWhiteout)`
            * `archive.WithParents(parents)`

最终，如上两种情况，都会调用 `applyNaive` （`archive/tar.go`）：

* 使用上面创建的流构建一个 go 标准库的 `tar.Reader` 对象。
* 遍历 tar 的每个目录和文件，将文件解压到指定目录。这里需要特别强调的是对 without 文件的处理： containerd 使用的 OCI 镜像标准是面相联合文件系统的（如 Overlayfs），因此镜像是分层的。该类文件系统规范都需要支持上层对下层文件的删除。此时，多数都是通过特殊的标记文件实现。OCI 镜像也是如此，OCI 镜像标准使用 `.wh.` 前缀（本质是 aufs 的规范）来标记（更多参见：[OCI 镜像格式规范](/posts/oci-image-spec/#whiteout)）。而 containerd 要支持多种文件系统，containerd 定义了一个函数 `type archive.ConvertWhiteout func(header *tar.Header, path string) (writeFile bool, false error)` 需要将 OCI 镜像的 `.wh.` 格式转换为对该文件系统的操作。
    * 该函数的语义是：
        * 参数：
            * header 该 tar item 的 header
            * path 该目标目录根目录 join 上 tar item 的 name
        * 行为
            * path 如果是一个删除标记，根据当期文件系统情况转换为该文件系统能识别的行为。并返回 `false, nil`。参见下文。
            * path 如果不是一个删除标记，返回 `true, nil`。
        * 返回
            * writeFile tar item 是否需要写入。
    * 几种实现为：
        * 默认实现 （位于 `archive/tar.go@applyNaive` 内）：如果是删除标记，这直接调用系统调用（如 `os.RemoveAll`）将对应位置的文件删除。
        * `OverlayConvertWhiteout` （位于 `archive/tar_opts_linux.go`），如果是删除目录，则给目录添加一个属性 `trusted.overlay.opaque:y`，如果是删除文件，则创建一个字符设备。

总结：

* 简单而言，diff api 实际上就是将 OCI 标准镜像层写入 snapshotter `Prepare` 函数返回的 `mounts` 构造的文件系统中。这里的写入并不是简单的解压到目录，而是需要处理 OCI 标准镜像的 without 规范，对标记删除的目录、文件进行删除。
* 针对联合文件系统（Overlayfs、aufs 等），做了特殊优化：不真正 mount，而是直接写入对应的 upper 层路径，并对将OCI 标准镜像的 without 规范，转化为对应文件系统的规范。

### 拉已存在的镜像

在上文拉新的镜像完成后，再次执行 `sudo ctr images pull docker.io/library/nginx:1.25`，流程如下为：针对每一层，调用 `Stat` 函数

* 参数 `key` 为 `"default/2/sha256:d310e774110ab038b30c6a5f7b7f7dd527dbe527854496bd30194b9ee6ea496e"`。逻辑如下：
* 逻辑为 调用 `storage.GetInfo` 获取到 snapshots.Info 并返回。

### 运行容器

在上述执行完成后，执行下述命令（对应源码为 `cmd/ctr/commands/run/run.go`）。

```bash
sudo ctr run --mount 'type=bind,src=/tmp,dst=/host-tmp,options=rbind:ro' docker.io/library/nginx:1.25 nginx
```

* `cmd/ctr/commands/run/run_unix.go@NewContainer` 阶段
    * 查询镜像状态（`image.go@IsUnpacked`）：调用 `Stat` 函数，参数 `key` 为 `"default/14/sha256:1c69f36a0d9b59b762eaba410fa9fd01b85140670a8d49199a7b37702cc956c0"`，查询该镜像最上层的状态。
    * 构建容器的 Rootfs (`container_opts.go@WithNewSnapshot`)：调用 `Prepare` 函数，参数 `key` 为 `"default/15/nginx"`、参数 `parent` 为 `"default/14/sha256:1c69f36a0d9b59b762eaba410fa9fd01b85140670a8d49199a7b37702cc956c0"`。和上述拉新镜像的过程一样返回一个 type 为 overlay 的 mount。
* `container.go@NewTask`
    * 调用 `Mounts`，参数 `key` 为 `"default/15/nginx"`，返回值和上述 `Prepare` 返回值一致，即 mounts。

### 其他行为

* `Update` 更新快照，只支持更新标签。如： `sudo ctr snapshot label labelkey=labelvalue nginx`。
* `Usage` 查询当前层，资源使用情况（只返回一层），即磁盘使用量和 inode。如果当前快照类型为 `Active` 将递归统计（如：`sudo ctr snapshot usage nginx`）；如果当前快照是 `Committed` 将从元数据存储中返回（如 `sudo ctr snapshot usage sha256:d310e774110ab038b30c6a5f7b7f7dd527dbe527854496bd30194b9ee6ea496e`）。
* `View` 从一个类型为 `committed` 的 Key 创建一个新的快照，这个快照，且这个快照是只读的，如： `sudo ctr snapshot view nginx-ro sha256:1c69f36a0d9b59b762eaba410fa9fd01b85140670a8d49199a7b37702cc956c0`
* `Remove` 删除某个快照元数据，删除的这个快照必须是最顶层，不能被其他快照的 Parent 直接或间接引用。在 snapshotter 这个层级，不感知该快照是否正在被使用（即某个快照正在被其他容器使用，也可以被删掉），不删除磁盘占用，磁盘空间需调用 `Cleanup` 清理，如：`sudo ctr snapshot rm nginx-ro`。
* `Walk` 遍历遍历所有的快照元信息，如 `sudo ctr snapshot ls`。
* `Cleanup` 清理未被使用的磁盘空间。
