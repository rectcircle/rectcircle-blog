---
title: "Containerd 详解"
date: 2023-04-29T12:55:23+08:00
draft: true
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

## 快速开始

### 安装

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

### 配置 service

```bash
wget https://raw.githubusercontent.com/containerd/containerd/v1.7.0/containerd.service
sudo mv containerd.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now containerd
```

### 启动容器

注意：这里使用了 ctr 命令行工具，该命令行工具仅用于调试使用，官方不建议在生产环境使用。

```bash
ctr --help
sudo ctr info
sudo ctr images pull docker.io/library/busybox:1.36
sudo ctr run -d docker.io/library/busybox:1.36 busybox sleep infinity
# sudo ctr task kill -s 9 busybox # 停止
# sudo ctr container rm busybox   # 删除
```

## 流程分析

### 进程分析

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

### 数据存储

> https://github.com/containerd/containerd/blob/v1.7.0/docs/ops.md
> https://github.com/containerd/containerd/blob/v1.7.0/docs/content-flow.md

### 容器启动

## API 简要说明

### 概念

### 原生 API

### CRI API

## 配置和运维

https://github.com/containerd/containerd/blob/v1.7.0/docs/ops.md

## Containerd 插件
