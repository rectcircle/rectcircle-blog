---
title: "Consul 详解"
date: 2022-08-18T18:35:09+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> Version: 1.31.1

## 概述

Consul 被官方定义为多网络工具，提供功能齐全的服务网格解决方案。Consul 提供了一种软件驱动的路由和分段方法。它还带来了额外的好处，例如故障处理、重试和网络可观察性。这些功能中的每一个都可以根据需要单独使用，也可以一起使用以构建完整的服务网格并实现零信任安全。

最早 Consul 的就是一个高可用的服务注册和发现的注册中心，近些年来，Consul 引入了服务网格（service mesh）。从其官方网站来开，官方希望 Consul 可以提供一整套服务网格的解决方案。

本文将，先从最小化安装和使用 Consul 开始（[快速开始](#快速开始)）；然后从如何部署运维 ([安装和部署](#安装和部署))、如何使用 ([核心特性](#核心特性))，两个角度详细介绍 Consul。

## 快速开始

https://hub.docker.com/_/consul

```
docker run -d --name=consul -p 8500:8500 -e CONSUL_BIND_INTERFACE=eth0 consul
```

```
curl http://10.227.8.141:8500/v1/health/service/consul?pretty
```

https://www.consul.io/api-docs/agent/service

注册

```bash
# 第一个实例
curl  \
    --request PUT \
    --data '
        {
            "ID": "test-service-1",
            "Name": "test-service",
            "Address": "127.0.0.1",
            "Port": 5000,
            "Check": {
                    "HTTP": "http://127.0.0.1:5000",
                    "Interval": "10s"
                }
        }
    ' \
    http://10.227.8.141:8500/v1/agent/service/register

# 第二个实例

curl  \
    --request PUT \
    --data '
        {
            "ID": "test-service-2",
            "Name": "test-service",
            "Address": "127.0.0.1",
            "Port": 8500,
            "Check": {
                    "HTTP": "http://127.0.0.1:8500/",
                    "Interval": "10s"
                }
        }
    ' \
    http://10.227.8.141:8500/v1/agent/service/register

# 第三个实例

curl  \
    --request PUT \
    --data '
        {
            "ID": "test-service-3",
            "Name": "test-service",
            "Address": "127.0.0.1",
            "Port": 9500
        }
    ' \
    http://10.227.8.141:8500/v1/agent/service/register
```

查询健康情况

```
curl --request GET http://10.227.8.141:8500/v1/agent/health/service/name/test-service
```

取消注册

```
curl --request PUT http://10.227.8.141:8500/v1/agent/service/deregister/test-service-success
```

### 单机运行

由于 Consul 是 Go 实现的，而具有 Go 优秀的跨平台特性，因此在任何平台安装和运行 Consul 非常容易，只需从其 [官方下载站点](https://www.consul.io/downloads) ，下载相应平台的 zip 包，解压后即可直接运行 `./consul` 命令即可运行（或加入 `PATH`），关于下载，更多参见：[Install Consul](https://learn.hashicorp.com/tutorials/consul/get-started-install)。

```bash
cd ~/Downloads
unzip consul_1.13.1_darwin_amd64.zip
sudo mv consul /usr/local/bin
```

安装完成后，通过如下命令，以 dev 模式运行：

```bash
consul agent -dev -node machine
```

核心输出如下：

```
==> Starting Consul agent...
           Version: '1.13.1'
        Build Date: '2022-08-11 19:07:00 +0000 UTC'
           Node ID: 'd4f7830e-00e8-9405-fa38-ec873c85b295'
         Node name: 'machine'
        Datacenter: 'dc1' (Segment: '<all>')
            Server: true (Bootstrap: false)
       Client Addr: [127.0.0.1] (HTTP: 8500, HTTPS: -1, gRPC: 8502, DNS: 8600)
      Cluster Addr: 127.0.0.1 (LAN: 8301, WAN: 8302)
           Encrypt: Gossip: false, TLS-Outgoing: false, TLS-Incoming: false, Auto-Encrypt-TLS: false
```

该模式将启用单个 Server Agent，并打印 Debug 日志，不能在真实生产环境使用，如何在生产模式部署，参见：[下文](#安装和部署)。

此时，通过浏览器打开 127.0.0.1:8500 即可打开 Consul 的 WebUI。

### 基本使用

## 安装和部署

### 部署架构

> [What is Consul?](https://learn.hashicorp.com/tutorials/consul/get-started?in=consul/getting-started)

Consul 是一个分布式系统，在 Consul 的概念中，一个 Consul 集群被称为数据中心 (datacenter)。

一个 Consul 数据中心由多个节点（被称为 Agent）组成，这些节点可以部署在物理机、虚拟机、或容器中。这些 Agent 可以分为如下两类：

* 3~5 台 Server Agent，包括一个 Leader 和多个 Follower。
* 0~n 台 Client Agent。

在 Consul 中，Server 还是 Client 只是 consul 这个二进制文件 agent 子命令的一个模式。区别在于：

* Server Agent
    * 跟踪可用服务、它们的 IP 地址以及它们当前的运行状况和状态。
    * 跟踪可用节点、它们的 IP 地址以及它们当前的运行状况和状态。
    * 构建一个了解服务和节点可用性的服务目录 (DNS)。
    * 维护和更新 K/V 存储。
    * 采用 gossip protocol 协议向所有 Agent 传达更新。
* Client Agent
    * 将请求通过 RPC 转发到 Server Agent，以及一些缓存策略。
    * 对通过该 Agent 注册的服务进行健康检查。

在使用者看来，不需要区分 Client 和 Server，不管连到 Client 还是 Server，都可以使用 Consul 的全部的功能。

另外，一个只有 Server 的 Consul 集群也是可以正常工作的，Client 的作用就是健康检查 + 转发 RPC 请求，但是 Consul 的推荐架构是为每个服务所在的节点 (k8s node) 部署一个 Client Agent 原因在于（来自：[网络](https://groups.google.com/g/consul-tool/c/VI1xd8wG-0w)）：

* Agent 可以减轻 Server 的健康检查的压力。
* 对应用层隐藏 Server Agent 的分布式复杂性：应用层只需要知道服务发现的地址永远是 localhost:8500。
* 当 Server Agent 故障时， Client Agent 可以利用缓存继续提供服务。
* Client Agent 的缓存机制，极大提高了集群的吞吐和性能。

因此一个推荐的单数据中心的 Consul 集群的架构如下图所示（图片来源：[一篇文章了解Consul服务发现实现原理](http://www.liuhaihua.cn/archives/546262.html)）：

![image](/image/single-dc-consul-arch.jpeg)

### 物理机或虚拟机部署

### 云原生部署

## 核心特性

### 服务发现

### 健康检查

### 服务网格

## 参考

* 代码库 [hashicorp/consul](https://github.com/hashicorp/consul)
* [官方网站](https://www.consul.io/)
* [一篇文章了解Consul服务发现实现原理](http://www.liuhaihua.cn/archives/546262.html)
* [Consul的client mode把请求转向server，那么client的作用是什么？](https://www.zhihu.com/question/68005259)
* [What is purpose and intent of Consul Agents running in Client mode?](https://groups.google.com/g/consul-tool/c/VI1xd8wG-0w)
