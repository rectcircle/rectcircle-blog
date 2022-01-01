---
title: "OCI 概览"
date: 2021-12-26T17:44:58+08:00
draft: false
toc: true
comments: true
tags:
  - 云原生
---

## 概述

OCI 全称 [Open Container Initiative](https://www.opencontainers.org/)，即开放容器倡议。是一个对容器技术进行标准化的组织。

该组织在 Linux 基金会的支持下成立，核心成员主要包括：Docker、Redhat、IBM、微软、Google 等。

特别说明：目前 OCI 的标准基本上都是来源于 Docker，也就是说 Docker 的核心组件是符合 OCI 标准的，是 OCI 的一个参考实现。

该组织的主要工作内容是对容器化核心技术进行标准化，标准化有助于：

* 避免容器化技术被某一非中立实体掌控
* 统一容器化技术底座，提高兼容性，避免容器生态分裂
* 为不同场景的实现提供参考标准

## 标准和提案

截止，2021-12-31， OCI 一共发布了如下几个标准：

* [Image Format](https://github.com/opencontainers/image-spec) [v1.0.2](https://opencontainers.org/release-notices/v1-0-2-image-spec/) 定义了容器镜像的格式，平时讲的 Docker 镜像就是基于该标准定义打包的。该标准的具体形式表现为，镜像的文件和目录结构。
* [Runtime Specification](https://github.com/opencontainers/runtime-spec) [v1.0.2](https://opencontainers.org/release-notices/v1-0-2-runtime-spec) 定义了容器的配置、执行环境和生命周期，平时通过 `docker run` 运行的一个 Docker 容器就是该标准的一个实现。
* [Distribution Specification](https://github.com/opencontainers/distribution-spec) [v1.0.1](https://opencontainers.org/release-notices/v1-0-1-distribution-spec/) 定义了如何管理和分发，符合 [Image Format](https://github.com/opencontainers/image-spec)  的镜像 和 [OCI Artifacts](https://github.com/opencontainers/artifacts)。该标准的具体形式表现为，一套 Registry HTTP API 文档。

其他相关提案可以参见： [opencontainers/tob](https://github.com/opencontainers/tob/tree/main/proposals)。

更多内容可以前往： [官网](https://www.opencontainers.org/) 和 [github](https://github.com/opencontainers) 查看。

## 标准实现

> 参考：[博客](https://xuanwo.io/2019/08/06/oci-intro/#image-build)

### Image

| 项目 | stars | 简介 | 在 container 中运行 |
| ---- | ---- | --- | ---- |
| [moby/buildkit](https://github.com/moby/buildkit) | ![stars](https://img.shields.io/github/stars/moby/buildkit.svg) | 从 docker build 拆分出来的项目，支持自动 GC，多种输入和输出格式，并发依赖解析，分布式 Worker 和 Rootless | 参见：[博客](https://blog.frognew.com/2021/06/relearning-container-13.html) 和 [官方例子](https://github.com/moby/buildkit/blob/master/examples/kubernetes/README.md)。注意：rootless 模式需要宿主机[特殊配置](https://github.com/moby/buildkit/blob/master/docs/rootless.md) |
| [genuinetools/img](https://github.com/genuinetools/img) | ![stars](https://img.shields.io/github/stars/genuinetools/img.svg) | 对 buildkit 的一层封装，单独的二进制，没有 daemon，支持 Rootless 执行，会自动创建 SUBUID，比 buildkit 使用起来更加容易 | 参考 moby/buildkit 说明 |
| [uber/makisu](https://github.com/uber/makisu) | ![stars](https://img.shields.io/github/stars/uber/makisu.svg)  |uber 开源的内部镜像构建工具，目标是在 Mesos 或 Kubernetes 上进行 Rootless 构建，支持的 Dockerfile 有些许不兼容，在非容器环境下运行会有问题，比如 [Image failed to build without modifyfs](https://github.com/uber/makisu/issues/233) | 项目已经归档，不建议使用 |
| [GoogleContainerTools/kaniko](https://github.com/GoogleContainerTools/kaniko) | ![stars](https://img.shields.io/github/stars/GoogleContainerTools/kaniko.svg) | Google 出品，目标是 Daemon free build on Kubernetes，要求运行镜像 `gcr.io/kaniko-project/executor` 进行构建，直接在别的镜像中使用二进制可能会不工作，原生支持 rootless | 原生支持，且只能在官方提供的 image 中使用 |
| [containers/buildah](https://github.com/containers/buildah) | ![stars](https://img.shields.io/github/stars/containers/buildah.svg)| 开源组织 [Containers](https://github.com/containers) 推出的项目，目标是构建 OCI 容器镜像，Daemon free，支持 Rootless，与 [podman](https://xie.infoq.cn/article/a7254c5d64fcb3be8d6822415) 生态紧密结合 | 参见：[文章](https://insujang.github.io/2020-11-09/building-container-image-inside-container-using-buildah/) 。注意 rootless 需要二选一：a) 性能高，运行容器时需要添加 fuse 设备，`docker run --device /dev/fuse:rw ...`（[k8s 方案](https://zhuanlan.zhihu.com/p/83015668)）；b) 性能差，每一层都需要复制全量数据，通过 `buildah --storage-driver=vfs` 命令实现 |

由于 moby/buildkit 和 containers/buildah 对宿主机存在依赖。云原生场景，建议直接使用 GoogleContainerTools/kaniko。

### Runtime

* [opencontainers/runc](https://github.com/opencontainers/runc)：是 OCI Runtime 的参考实现。
* [kata-containers/runtime](https://github.com/kata-containers/runtime)：容器标准反攻虚拟机，前身是 [clearcontainers/runtime](https://github.com/clearcontainers/runtime) 与 [hyperhq/runv](https://github.com/hyperhq/runv)，通过 [virtcontainers](https://github.com/kata-containers/runtime/tree/master/virtcontainers) 提供高性能 OCI 标准兼容的硬件虚拟化容器，Linux Only，且需要特定硬件。
* [google/gvisor](https://github.com/google/gvisor)：gVisor 是一个 Go 实现的用户态内核，包含了一个 OCI 兼容的 Runtime 实现，目标是提供一个可运行非受信代码的容器运行时沙盒，目前是 Linux Only，其他架构可能会支持。

### Distribution

* [distribution/distribution](https://github.com/distribution/distribution)，OCI Distribution Specification 的参考 标准实现。
* [goharbor/harbor](https://github.com/goharbor/harbor)，CNCF 旗下的兼容 OCI Distribution Specification 的实现。

关于两者区别，参见博客：[为什么有了Docker registry还需要Harbor？](https://cloud.tencent.com/developer/article/1080444)

## 辅助工具

### 镜像迁移工具

* [containers/skopeo](https://github.com/containers/skopeo)

## 容器化解决方案

### 单机

* Docker 商业公司
* Podman 完全开源

### 集群

* Kubernetes

## Reference

* [发布记录](https://opencontainers.org/release-notices/overview/)
* [开放容器标准(OCI) 内部分享](https://xuanwo.io/2019/08/06/oci-intro/)
* [OCI的全链路生态](https://zhuanlan.zhihu.com/p/415819214)
