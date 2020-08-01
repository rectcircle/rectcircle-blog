---
title: "Java 微服务 RPC 客户端封装"
date: 2020-07-21T23:04:59+08:00
draft: false
toc: true
comments: true
tags:
  - java
---

> * 参考：[如何打造优雅的Thrift RPC封装库](http://www.wxpjimmy.com/2017/10/22/%E5%A6%82%E4%BD%95%E6%89%93%E9%80%A0%E4%BC%98%E9%9B%85%E7%9A%84Thrift%20RPC%E5%B0%81%E8%A3%85%E5%BA%93%20-%20Part1/)
> * 实现代码：https://github.com/rectcircle/ms-client

## 背景

### 微服务架构

> 参考：https://www.zhihu.com/question/65502802

微服务架构是目前互联网业务系统主流采用的一种技术架构，与之相对应的是传统的单体应用。

微服务架构，是按照业务将系统拆分成相对对立的小的服务。每个服务内部高度内聚，拥有自己完整的技术体系和数据存储。服务与服务之间的依赖通过 RPC 方式进行通信。

微服务解决的最大问题是：提高生产率，解决超大型项目的管理问题。根据《人月神话》可知，人员的增加与产出的关系并不是线性的关系。因此，需要将服务拆分成小的对立的可独立部署的服务，从而保持较高的产出率。

### RPC

RPC （Remote procedure call 远程方法调用），在微服务语境下，是对 微服务 之间通信的技术的描述，因此 RPC 包含 调用方（客户端）、通讯协议、服务提供者（服务端）

主流的 PRC 方案有如下几种：

* Thrift Facebook 开源
* gRPC Google 开源
* RESTful 基于 HTTP （Spring Cloud）
* Dubbo

### RPC Client

在微服务架构下，因为微服务之间通信不再是本机方法调用，各个微服务独立部署，因此存在如下问题：

* 远程方法调用相对于本机调用是不可靠的，因此可能出现各种故障
* 如何才能找远程服务的位置（网络地址）
* 复杂的服务调用结构，如何追查问题，如何监控服务稳定性
* 服务配置如何分发

为了应对这些问题，微服务架构需要提供如下基础组件

* 服务注册中心（解决如何找到服务的问题）
* 服务监控
* 熔断器
* 服务网关
* 配置中心
* 服务跟踪
* ......

而以上功能大多都需要在 RPC Client 侧加以配合才能实现。因此主流 的 微服务架构，都需要提供一个 重 SDK 嵌入 到 服务代码中。

这样就会存在这样一个问题：如果 微服务 需要支持多种编程语言，就需要为各种编程语言提供一套 SDK，而这些代码逻辑一致。从而带来巨大的维护成本。因此，需要 Service Mesh 来解决这个问题。

### Service Mesh

> 参考：https://dubbo.apache.org/zh-cn/blog/dubbo-mesh-in-thinking.html

为了解决 适配各种 编程语言的问题，会将 SDK 中逻辑部分抽离出来，作为 一个服务 进行独立部署（称之为 `Sidecar`），而各个编程语言的 SDK 只需维护非常轻量的 配置 和 与 `Sidecar` 通信的实现。

一般情况下，`Sidecar` 将作为一个后台进程部署在 每个 微服务运行的 容器中。

## 实验

模拟实现一个与 RPC 技术无关的 微服务 Client 包装。利用 Java 动态代理 实现

### 设计

* 用户核心接口：` <T> T getClient(Class<T> clientClazz, C clientConfig);`  给定原始 `Client` 类型 返回一个 提供了 微服务基础设施 的 代理类，且线程安全
* 支持 自定义服务发现 实现
* 支持 多种 RPC 协议的定制开发

### 实现

https://github.com/rectcircle/ms-client
