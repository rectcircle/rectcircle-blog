---
title: "Kubernetes 包管理器 Helm"
date: 2022-05-20T22:07:33+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> 版本: 3.8.2 | [官方文档](https://helm.sh/zh/docs/)

## 简述

Helm 是 Kubernetes 的包管理器，是 [CNCF](https://www.cncf.io/projects/) 的毕业项目之一。

和 传统的包管理器类似（apt / npm / maven），Helm 提供了一个 CLI 客户端，定义并提供了 Helm Chart [包管理仓库](https://artifacthub.io/) （Chart 指的是包）。

Helm 在 Kubernetes 看来和 Kubectl 类似，仅仅是一个 Client。因此 Helm 不需要 Kubernetes 做任何特殊了配置，即可在任何 Kubernetes 集群中使用。

Helm 的核心，定义了一套渲染 Kubernetes 声明式配置文件模板的规范，并通过模板引擎实现了该规范。

作为一个运行在 Kubernetes 的应用开发者，只需要为该应用编写一个 Chart：Kubernetes 声明式配置文件模板、模板参数和默认值 和 外部依赖（如 MySQL、Redis），即可一键在 Kubernetes 集群中将该应用和依赖启动起来，并可以根据通过 Chart 参数灵活的配置应用。

```
                +------------------------+
                |    Chart Repository    |
                +------------------------+
            +-->|     Dependency A       |---+
            +-->|     Dependency B       |---+
            |   +------------------------+   |
      (dependency)                           |
            |   +------------------------+   |
            |   |      Chart: App        |---+
            |   +------------------------+   |
            |   |      /templates        |   |
            |   |      Values.yaml       |   |
            +---|      Chart.yaml        |   |
                +------------------------+   |
                                             |
    Deploy                                   +---(Go template engine)---> Kubernetes Configurations ------> Kubernetes Clusters (Release)
(helm install)                               |
                                             |
                +------------------------+   |
                |     Release Values     |---+
                +------------------------+
                | --set-file Values.yaml |
                | --set foo=bar          |
                +------------------------+
```

上图所示的是，对一个 Chart 进行部署的流程。

* Chart App 定义了一个 Chart，其依赖两个在 Chart Repository 中的两个 Chart。
* 用户通过 `helm install` 命令进行一次部署，并通过 `--set-file` 和 `--set` 覆盖 Chart App 中的参数。
* Helm CLI 通过 Go 模板引擎将 Values 和 Templates 进行渲染，得到 Kubernetes 配置。
* 最后通过 Kubernetes API （类似于 kubectl apply） 将配置应用到 Kubernetes 集群中。
* Chart 在 Kubernetes 集群中的对应物被称为一个 Release。

## Helm 安装

## 示例仓库

## Chart 开发指南

本部分从两个方面介绍，如何编写 Chart。

* helm create 生成的脚手架。
* helm create 没有涉及的部分。
* Chart 开发的最佳实践。

### helm create 解读

#### 目录结构分析

#### Go Template 详解

### Chart 其他特性

#### 生命周期 和 Hook

### 最佳实践

## helm 命令详解

### Chart

### Repository

### Release

#### 生命周期

## 场景

### 动态依赖

### 等待依赖就绪

### 数据库初始化和迁移

pre-install
pre-upgrade
