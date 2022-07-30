---
title: "暴露边缘服务设计和示例实现"
date: 2022-07-23T22:10:05+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 需求说明

在典型的微后端场景中，项目会被拆成多个可以独立运行的微服务，这些服务会通过相关协议（如 http/protobuf/thrift）相互调用。在实现上，这些服务一般会通过暴露 TCP 端口的方式提供服务。

这在网络层面隐含了一个假设：服务间的网络必须是双向可通的，即这些服务需要在同一个内网。这个假设在一般的机房内部很容易实现，但是在很多场景中，服务不一定是部署在同一个机房中，这就涉及了跨网络调用的问题。

本文设想一个场景：一个项目包含多个服务，这些服务可以分为两种类型：

* 核心服务：部署于同一个数据中心的核心。
* 边缘服务：部署于任意网络环境中的边缘设备，简单起见，该服务只有一个实例。

在网络上，边缘服务可以单向访问核心服务，但是核心服务不能单向访问边缘服务（因为边缘服务没有公网 IP）。

希望达到的效果是：一旦边缘服务上线，核心服务可以直接调用运行在边缘设备上的边缘服务，就像两者运行在同一个内网上的微服务一样。

## 架构和实现

### 架构图

![image](/image/design-and-demo-of-expose-edge-service.svg)

上图描述了一种暴露边缘服务给核心服务的架构。

### 组件

包含如下几类组件，这些组件使用的技术如下所示：

| 组件 | 相关技术 |
|-----|-----|
|Exposer Server | Websocket Server、多路复用器 Client |
|Exposer Client | Websocket Client、多路复用器 Server |
|协议转换器       | Websocket Client |

### 具体流程

从按照时序上来说，包含：建立暴露边缘服务的长连接 和 访问边缘服务两个流程。

#### 建立暴露边缘服务的长连接

1. Exposer Client
    1. 读取配置（可能从本地配置文件或者相关服务），获取需要暴露的服务的元数据（设备 ID、服务 ID、协议类型、端口）。
    2. 为每个服务和 Exposer Server 的 Expose 端点，建立 Websocket 连接，并将服务的元数据通过 Header 传递给 Exposer Server（对应下文的 2.2）。
    3. 使用该 Websocket 连接，创建一个多路复用器 Server，记录当前多路复用器 Server 和服务元信息的映射关系，并 Accept 等待连接。
2. Exposer Server 集群（Expose 端点）
    1. 等待来自 Exposer Client 的 Websocket 的连接。
    2. 接收到 Websocket 连接后，校验 Header 中的服务元数据，校验通过后建立连接。并将路由信息记录到全局路由表中（redis）：key 为 服务 ID + 设备 ID，value 为当前实例的 IP Port。
    3. 使用该 Websocket 连接，创建一个多路复用器 Client。并将该多路复用 Client 存储到内存中的会话表中，key 为服务 ID + 设备 ID，value 为多路复用器 Client。

#### 访问边缘服务

微服务想要调用位于边缘设备中的边缘服务的接口（假设边缘服务协议为 HTTP）。

1. 微服务，像直接访问边缘服务一样访问 HTTP 协议转换器，并根据 HTTP 协议转换器的标准，通过 Header 传递需要访问的设备 ID 和服务 ID。
2. HTTP 协议转换器
    1. 根据 Header 中的设备 ID 和服务 ID，查找全局路由表（redis），获取需要连接的 Exposer Server 的 ip prot。
    2. 和上一步选取的 Exposer Server 实例的 Access 端点，建立一个 Websocket 连接，并根据 Exposer Server 协议转换器的标准，通过 Header 传递需要访问的设备 ID 和服务 ID。
    3. 使用 HTTP 反向代理库，将上一步建立的 Websocket 连接作为底层通道，对微服务的流量进行转发（即 http over websocket）。
3. Exposer Server 集群（Access 端点）
    1. 等待来自 协议转换器 的 Websocket 的连接。
    2. 接收到 Websocket 连接后，根据 Header 中的设备 ID 和服务 ID，查找内存中的会话表，拿到对应的多路复用器 Client，并打开一个连接。
    3. 将流量转发到该多路复用连接上。
4. Exposer Client
   1. 多路复用器的 Server Accept 到连接，根据当前多路复用器 Server 和服务元信息的映射关系，获取到边缘服务的协议类型和端口，发现协议类型是 HTTP，则与边缘服务所在端口建立 TCP 连接。
   2. 将流量准发到这个 TCP 连接上。

## 其他说明

### 为什么使用 Websocket

Expose Client 和 Expose Server 需要建立一个长连接。主流的可以选择的协议有：

* Websocket
* TCP
* QUIC

本方案选择 Websocket 的原因是普适性更强、开发成本更低。

* Websocket 可以服用目前 Web 后端领域的沉淀很久的基础设施，如 Nginx。
* Websocket 可以在握手阶段传递设备 ID 和服务 ID 等元信息，减少开发成本。

当然如果追求极致的性能，也可以选择 TCP 或 QUIC，自己实现一套握手协议即可。

### 多路复用器概念原理

类似于通讯领域，一条物理链路上可以建立多个 TCP 连接。

本文的多路复用器指的是软件上的多路复用器，即可以在一条底层连接，可以建立多条逻辑连接。

以 golang 的 [hashicorp/yamux](https://github.com/hashicorp/yamux) 为例，底层连接即：任意实现 net.Conn 接口的类型，如 TCP 连接等。

特别说明的是，多路复用器的 Server 和 Client 不需要和底层连接的 Server 和 Client 对应。

从上文可以看到：

* 在 Exposer Client 中，多路复用器的底层连接是一个 Websocket 的 Client 侧连接，但是建立的是多路复用器的 Server。
* 在 Exposer Server 中，多路复用器的底层连接是一个 Websocket 的 Server 侧连接，但是建立的是多路复用器的 Client。

## 示例代码

上述架构，通过 Golang 进行了简单的实现，具体参见：github [rectcircle/expose-edge-service-demo](https://github.com/rectcircle/expose-edge-service-demo)。

## 本文未讨论部分

* Exposer Server 的权限校验等相关能力可以进一步拆分出来成为一个网关。
* Exposer Client 和 Exposer Server 流量控制以及负载均衡需要更仔细的设计（比如：根据负载， Exposer Server 和 Exposer Client 建立多个 Expose 的 Websocket 连接）。
* 协议转换器和 Exposer Server 集群的通信协议，Websocket 不是必须的，可以使用任意性能更好的协议，只要是可靠的连接，并在握手阶段可以传递设备 ID 和服务 ID 即可。

## 具体应用场景

该场景核心就是所谓的内网穿透，本文给出的是一种支持横向扩容，可以云原生部署的方案。如下场景可以参考该设计：

* 远程/云端调用 IoT 设备
* 混合云控制面调用私有云上的组件
* 面向个人提供的基于内网穿透的应用
    * 内网端口暴露
    * 远程桌面
* 服务端推送给客户端推送消息
