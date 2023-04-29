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

### 启动容器

## 流程分析

### 进程分析

### 数据存储

### 容器启动

## API 简要说明

### 原生 API

### CRI API

## Containerd 插件
