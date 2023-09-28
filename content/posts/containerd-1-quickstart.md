---
title: "Containerd 详解（一） 快速开始"
date: 2023-05-05T16:10:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> version: [v1.7.0](https://github.com/containerd/containerd/tree/v1.7.0)

## 简述

Containerd 是一个云原生（容器）领域行业标准容器运行时。以操作系统守护进程方式提供服务，管理一台机器上每个容器生命周期，包括：

* 镜像下载和存储。
* 容器 rootfs （根文件系统）的生成。
* 容器的启动和守护。
* 容器的低级存储和附加网络。

Containerd 是 CNCF 毕业项目，是 Kubernetes 和 Docker 的默认容器运行时。

Containerd 守护进程默认提供了两套 API：

* Containerd 原生 GRPC API （[源码](https://github.com/containerd/containerd/blob/v1.7.0/api/README.md)），并提供了 Go SDK （参见：[源码](https://github.com/containerd/containerd/blob/v1.7.0/client.go)），Docker 以该方式集成 Containerd。
* Kubernetes 的 CRI GRPC API（[源码](https://github.com/containerd/containerd/blob/main/pkg/cri/cri.go)），形态上通过 Containerd Plugin 的方式提供服务（原生插件，打包到了 Containerd 二进制中），架构参见：[docs](https://github.com/containerd/containerd/blob/v1.7.0/docs/cri/architecture.md)。Kubernetes 以该方式集成 Containerd。

在底层容器运行时方面，Containerd 采用 [OCI-runtime](https://github.com/opencontainers/runtime-spec) 标准，默认使用 runc 作为运行时。

简单概述典型场景中 Kubernetes、Containerd、Runc 的 层级关系如下：

* Kubernetes 负责集群（多节点）的调度和管理，在单个节点，通过 Kubelet 组件通过 CRI GRPC 接口调用 Containerd。
* Containerd 提供单个节点的容器生命周期管理，包括镜像、存储、rootfs、网络，启动容器是 Containerd 通过 [OCI-runtime](https://github.com/opencontainers/runtime-spec) 标准调用 runc。
* Runc 容器引导器，负责根据一个容器的具体配置，在指定 rootfs 上引导启动一个容器进程。

## 安装

> [Getting started with containerd - Installing containerd
](https://github.com/containerd/containerd/blob/v1.7.0/docs/getting-started.md#installing-containerd)

官方提供了三种安装方式，本文只介绍第一种：从官方二进制方式安装。

* 下载安装 containerd 二进制可执行文件（假设系统为 x86_64 使用 glibc 的现代 Linux）。

    ```bash
    wget https://github.com/containerd/containerd/releases/download/v1.7.0/containerd-1.7.0-linux-amd64.tar.gz
    sudo tar Cxzvf /usr/local containerd-1.7.0-linux-amd64.tar.gz
    # 安装内容如下：
    # bin/
    # bin/containerd-shim-runc-v1
    # bin/containerd
    # bin/containerd-shim-runc-v2
    # bin/containerd-shim
    # bin/ctr
    # bin/containerd-stress
    ```

* 安装 runc，前往 [runc release 页](https://github.com/opencontainers/runc/releases)，下载安装。

    ```bash
    wget https://github.com/opencontainers/runc/releases/download/v1.1.7/runc.amd64
    sudo install -m 755 runc.amd64 /usr/local/sbin/runc
    ```

* 安装 CNI plugins，前往 [CNI plugins release 页](https://github.com/containernetworking/plugins/releases) 下载安装。

    ```bash
    wget https://github.com/containernetworking/plugins/releases/download/v1.2.0/cni-plugins-linux-amd64-v1.2.0.tgz
    sudo mkdir -p /opt/cni/bin
    sudo tar Cxzvf /opt/cni/bin cni-plugins-linux-amd64-v1.2.0.tgz
    ```

## 配置 service

```bash
wget https://raw.githubusercontent.com/containerd/containerd/v1.7.0/containerd.service
sudo mv containerd.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now containerd
```

## 启动容器

注意：这里使用了 ctr 命令行工具，该命令行工具仅用于调试使用，官方不建议在生产环境使用。

```bash
ctr --help
sudo ctr info
sudo ctr images pull docker.io/library/busybox:1.36
sudo ctr run -d docker.io/library/busybox:1.36 busybox sleep infinity
# sudo ctr task kill -s 9 busybox  # 停止 task
# sudo ctr container rm busybox    # 删除 container
# sudo ctr snapshot delete busybox # 删除 snapshot
```

## 进程分析

执行 `ps xao pid,ppid,uid,cmd` 与 containerd 有关的进程输出入如下：

```
    PID    PPID   UID CMD
 934457       1     0 /usr/local/bin/containerd
 935161       1     0 /usr/local/bin/containerd-shim-runc-v2 -namespace default -id busybox -address /run/containerd/containerd.sock
 935181  935161     0 sleep infinity
```

* `/usr/local/bin/containerd` containerd 守护进程，通过 `/run/containerd/containerd.sock` 对外提供 gRPC 接口。
* `/usr/local/bin/containerd-shim-runc-v2` 每个容器对应一个，shim （垫片）进程，负责管理容器（主进程）的生命周期。本例中为上文 busybox 容器的 shim 进程（详见：[博客](https://container42.com/2022/01/10/shim-shiminey-shim-shiminey/)）。
    * shim 需实现如下两个层面的接口：
        * 命令行接口：
            * `start` 子命令：containerd 会按照给定标准，调用该 `start` 子命令，在该退出之前，必须通过将 shim grpc server 的 unix socket 地址写入 stdout，这个 unix socket 位于 `/run/containerd/s/` 目录。（可通过 `sudo lsof -p 935161 | grep unix` 查看，[源码](https://github.com/containerd/containerd/blob/v1.7.0/runtime/v2/shim/util_unix.go#L68)），在 `containerd-shim-runc-v2` 的实现为：
                * 调用 [`shim.SocketAddress`](https://github.com/containerd/containerd/blob/v1.7.0/runtime/v2/shim/util_unix.go#L68) 生成用于提供 shim grpc server 服务的 unix socket addr，并监听该 socket。
                * 通过 `cmd.ExtraFiles` 将这个 socket 传递给子进程，然后将这个 addr 通过 stdout 告知 containerd 进程，start 命令退出。
                * 启动 shim grpc server 进程，该进程会获取到上文传递的 socket 文件描述符，参见：[源码](https://github.com/containerd/containerd/blob/v1.7.0/runtime/v2/shim/shim_unix.go#L58)。
            * `delete` 子命令，略。

            更多参见： [runtime v2 - README - Shim Authoring](https://github.com/containerd/containerd/blob/v1.7.0/runtime/v2/README.md)。

        * shim grpc server 接口的实现，接口定义参见：[shim.proto](https://github.com/containerd/containerd/blob/v1.7.0/api/runtime/task/v2/shim.proto)。
    * 主要职责为：
        * 执行 runC 命令启动容器；
        * 监控容器进程状态，当容器执行完成后，通过 exit fifo 文件报告容器进程结束状态；
        * 当容器 1 号进程被杀死后，reaper 掉其所有其子进程。该职责通过 [`prctl` 系统调用](https://man7.org/linux/man-pages/man2/prctl.2.html) 和 `PR_SET_CHILD_SUBREAPER` 选项实现。

* `sleep infinity` 容器主进程，由 `runc` 引导启动。本例中为上文 busybox 容器的 1 号进程。

## 存储分析

> 参考： [ops.md](https://github.com/containerd/containerd/blob/v1.7.0/docs/ops.md) | [content-flow.md](https://github.com/containerd/containerd/blob/v1.7.0/docs/content-flow.md)

### /var/lib/containerd/

containerd `root` 目录。用于存储持久化的数据，默认为 `/var/lib/containerd`，可以通过 `--root` 选项配置。

containerd 本身是插件化的，因此 containerd 自身并不会在该目录存储任何内容。该目录的内容都是由 containerd 插件创建和维护的。

```
/var/lib/containerd/
├── io.containerd.content.v1.content
│   ├── blobs
│   └── ingest
├── io.containerd.metadata.v1.bolt
│   └── meta.db
├── io.containerd.runtime.v2.task
│   ├── default
│   └── example
├── io.containerd.snapshotter.v1.btrfs
└── io.containerd.snapshotter.v1.overlayfs
    ├── metadata.db
    └── snapshots
```

* `io.containerd.content.v1.content` 目录 OCI image （即 docker 镜像） 内存存储，更多参见：[oci image spec](/posts/oci-image-spec/)。
* `io.containerd.metadata.v1.bolt` 存储 containerd 管理的镜像、容器、快照的元数据，存储的内容参见：[源码](https://github.com/containerd/containerd/blob/v1.7.0/metadata/buckets.go)。
* `io.containerd.snapshotter.v1.<type>` Snapshotter 快照目录，参见：[Snapshotters 文档](https://github.com/containerd/containerd/blob/v1.7.0/docs/snapshotters/README.md)。
    * `io.containerd.snapshotter.v1.btrfs` 使用 btrfs 文件系统创建容器快照的目录，目前仍处于早期阶段，默认不启用。
    * `io.containerd.snapshotter.v1.overlayfs` 默认的 snapshotter。采用 overlayfs2 创建快照。

上文我们多次提到了 snapshotter 、快照之类的概念。containerd 的主要职责就是，从一个镜像加上运行配置，最终启动一个容器。我们知道，容器的是有独立于宿主机的根文件系统的（rootfs）。containerd 将镜像转换为一个 rootfs 的语义抽象为一种插件： snapshotter 。开发者可以自由的利用不同的底层技术，来构造 rootfs。

containerd 默认提供了多种 snapshotter 实现，目前广泛使用的是 overlayfs。而 `io.containerd.snapshotter.v1.overlayfs` 目录就是 overlayfs snapshotter 的数据目录，这里重点介绍一下其结构和原理。

执行 `mount | grep busybox` 观察 busybox 的 rootfs：

```
overlay on /run/containerd/io.containerd.runtime.v2.task/default/busybox/rootfs type overlay (rw,relatime,lowerdir=/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/1/fs,upperdir=/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/3/fs,workdir=/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/3/work)
```

可以看出关键信息如下：

* `lowerdir` 为 `/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/1/fs`。
* `upperdir` 为 `/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/3/fs`。
* `workdir` 为 `/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/3/work`。
* 挂载点为 `/run/containerd/io.containerd.runtime.v2.task/default/busybox/rootfs`

因此 `overlayfs` snapshotter 插件的准备一个容器的 rootfs 的执行过程如下：

* 将 `io.containerd.content.v1.content` 目录的 layer blobs 解压到 `io.containerd.snapshotter.v1.overlayfs/snapshots/<id>/fs` 中，并创建 `work` 目录，并记录到 `metadata.db` 中。
* 创建一个 `upperdir` 目录，存储到 `io.containerd.snapshotter.v1.overlayfs/snapshots/<id>/fs` 并创建 `work` 目录，并记录到  `metadata.db` 中。
* 调用构造 mount 命令参数，创建 rootfs 挂载到 `/run/containerd/io.containerd.runtime.v2.task/<namespace>/<name>/rootfs`

### /run/containerd/

containerd `state` 目录。用于存储临时数据，默认为 `/run/containerd`，可以通过 `--state` 选项配置。

```
/run/containerd
├── containerd.sock
├── containerd.sock.ttrpc
├── fifo
│   └── 2043724491
│       ├── busybox-stderr
│       ├── busybox-stdin
│       └── busybox-stdout
├── io.containerd.runtime.v1.linux
├── io.containerd.runtime.v2.task
│   └── default
│       └── busybox
│           ├── address
│           ├── config.json
│           ├── init.pid
│           ├── log
│           ├── log.json
│           ├── options.json
│           ├── rootfs
│           ├── runtime
│           ├── shim-binary-path
│           └── work -> /var/lib/containerd/io.containerd.runtime.v2.task/default/busybox
├── runc
│   └── default
│       └── busybox
│           └── state.json
└── s
    └── 3646bf529360b2d2555bc0d946ef2fb07e38596749e16cccbd778773b61a6f3c
```

* `containerd.sock` containerd 主服务，GRPC 服务。
* `containerd.sock.ttrpc` 用于低内存环境 GRPC 服务。
* `fifo` 容器进程（task）的 stdin、stdout、stderr 对接到目录的 fifo 文件中。kubectl attach 等命令原理就是对接到这个目录下的 fifo 文件。
* `io.containerd.runtime.v1.linux` ??
* `io.containerd.runtime.v2.task/<namespace>/<name>` 容器数据。
    * `address` 连接到 shim 进程的地址，本例中文件内容为 `unix:///run/containerd/s/3646bf529360b2d2555bc0d946ef2fb07e38596749e16cccbd778773b61a6f3c`。
    * `config.json` oci runtime spec 配置文件 (runc 配置)。
    * `init.pid` 容器 1 号进程在宿主机名字空间的 pid。
    * `log` 日志??
    * `log.json` 日志??
    * `options.json` 选项??
    * `rootfs` 容器 rootfs，overlayfs 挂载点。
    * `runtime` ??
    * `shim-binary-path` shim 可执行文件路径。
    * `work` 指向 `/var/lib/containerd/io.containerd.runtime.v2.task/default/busybox`
* `runc/<default>/<name>/state.json` runc 容器状态文件。
* `s/xxx` 与 shim 通讯的 domain socket 文件。
