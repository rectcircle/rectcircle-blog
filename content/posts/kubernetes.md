---
title: "Kubernetes"
date: 2020-08-04T21:43:22+08:00
draft: false
toc: true
comments: true
tags:
  - devops
  - 后端
---

<!-- 
TODO 本文件保留目录索引，内容迁移到一个新的系列文章中：

使用者 / 维护者 两种角色

* 系列概述
* 单节点集群安装
* 组件和集群管理工具 kubeadm
* 抽象和标准对象（使用者）
    * https://kubernetes.io/zh/docs/concepts/overview/working-with-objects/
* 对象管理工具 kubectl（使用者）
* Helm 包管理器（使用者）
* API 和 SDK
* 扩展接口

-->

> [官方文档](https://kubernetes.io/zh/docs/home/)

## 快速开始

### 安装启动开发环境

官方提供了两种方式安装方式

* Minikube 在虚拟机上运行一个单节点的 Kubernetes 集群
* Kind 使用Docker容器“节点”运行本地 Kubernetes 集群

[Minikube 安装](https://kubernetes.io/zh/docs/tasks/tools/install-minikube/)，命令如下（Mac）

```bash
# 安装 kubectl https://kubernetes.io/zh/docs/tasks/tools/install-kubectl/
brew install kubernetes-cli
# 安装 Hypervisor ( VirtualBox https://www.virtualbox.org/wiki/Downloads)
# 检查 是否支持 VMX
sysctl -a | grep -E --color 'machdep.cpu.features|VMX'
# 安装 minikube
brew install minikube
# 验证
minikube help
```

[启动和管理](https://kubernetes.io/zh/docs/setup/learning-environment/minikube/)

```bash
# 启动（指定虚拟机和镜像仓库地址）
minikube start --vm-driver=virtualbox --image-repository=registry.cn-hangzhou.aliyuncs.com/google_containers
# 停止
minikube stop
# 删除
minikube delete
# 连接 虚拟机内部的 docker daemon
eval $(minikube docker-env)
docker ps
# 启动 k8s dashboard
minikube dashboard
```

### 创建服务

```bash
# 创建一个 deployment 名为 hello-minikube 使用镜像为 k8s.gcr.io/echoserver:1.10
kubectl create deployment hello-minikube --image=k8s.gcr.io/echoserver:1.10
# 将其作为 Service 公开
kubectl expose deployment hello-minikube --type=NodePort --port=8080
# 查看 Pod 是否启动
kubectl get pod
# 获取暴露 Service 的 URL 以查看 Service 的详细信息
minikube service hello-minikube --url
# 删除 Service
kubectl delete services hello-minikube
# 删除 hello-minikube Deployment：
kubectl delete deployment hello-minikube
```

## 概念

### k8s 是什么

> [官方文档](https://kubernetes.io/zh/docs/concepts/overview/what-is-kubernetes/)

k8s 是一种主流的 容器管理 工具，用来 方便的 编排、管理 运行在 容器 中的 服务

### k8s 组件

#### 控制面

* kube-apiserver API 服务，支持水平扩缩
* etcd 后端存储，本身就是分布式的，支持扩容，[原理参见](https://draveness.me/etcd-introduction/)
* kube-scheduler 调度器，负责资源调度，决定 pod 在那些节点中启动
* kube-controller-manager 控制器，编译到同一个 二进制文件，包含如下模块
    * 节点控制器（Node Controller）: 负责在节点出现故障时进行通知和响应。
    * 副本控制器（Replication Controller）: 负责为系统中的每个副本控制器对象维护正确数量的 Pod。
    * 端点控制器（Endpoints Controller）: 填充端点(Endpoints)对象(即加入 Service 与 Pod)。
    * 服务帐户和令牌控制器（Service Account & Token Controllers）: 为新的命名空间创建默认帐户和 API 访问令牌.
* cloud-controller-manager （略）

#### 节点组件

* kubelet 每个节点包含1个代理，用于管理（启动、停止等）、监控该节点的Pod，并监控该节点的资源情况
* kube-proxy 每个节点上运行的网络代理，负责管理控制网络通信，实现用户配置的网络通信
* 容器运行时（Container Runtime），真正负责启动容器的实现，例如 Docker

#### 插件

特殊 的 服务，实现特定的功能，位于 `kube-system` 名字空间中

* DNS 可以自动注册 服务 到 DNS 中
* Web 界面（仪表盘）
* 容器资源监控
* 集群层面日志

### k8s 交互界面

#### 声明式API

> 什么是声明式编程：[博客](https://www.cnblogs.com/sirkevin/p/8283110.html)

以数据结构的形式来表达程序执行的逻辑。它的主要思想是告诉计算机应该做什么，但不指定具体要怎么做。

k8s 的核心就是这样一套 高度抽象的 声明式 API（嵌套的数据结构）。可以理解为 配置 式的方式，用户需要按照 k8s 提供的配置方式 告诉 k8s 你要什么样子的状态，k8s 在后台就会维持到相应的状态。

k8s 将 相关概念抽象成多个核心对象，这些对象可能存在包含引用关系。

k8s 中 用户配置的内容称之为 规约 `Spec` （用户期望的状态），现实系统的状态 称之为 `Status` （系统当前的状态）。在任何时刻，Kubernetes 控制面 都一直积极地管理着对象的实际状态，以使之与期望状态相匹配。

#### 声明方式

k8s 通过 yaml 文件来进行声明（配置）。

一个 yaml 文件 必须包含 如下 属性：

```yaml
apiVersion: apps/v1  # api 版本
kind: Deployment     # 对象类型
metadata:            # 元数据
spec:                # 规约，配置的核心
```

#### 对象共有属性

每种 对象 （通过 `kind` 区分）都拥有如下共有属性

* `name` （`metadata.name`） 在同一 `namespace` 下 同一种 类型 的 对象不允许重名，不同 类型 的 对象允许重名。`name` 根据 对象类型 可能需要满足如下3中约束之一
    * DNS 子域名
        * 不能超过253个字符
        * 只能包含字母数字，以及'-' 和 '.'
        * 须以字母数字开头
        * 须以字母数字结尾
    * DNS 标签名
        * 最多63个字符
        * 只能包含字母数字，以及'-'
        * 须以字母数字开头
        * 须以字母数字结尾
    * 路径分段名称
        * 某些资源类型要求名称能被安全地用作路径中的片段。 换句话说，其名称不能是 .、..，也不可以包含 / 或 % 这些字符。
* `UIDs` 唯一标识，不需要配置，k8s 系统自动生成

#### 更多

> 详细参见 [对象 API 文档](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.18/)

## k8s 核心对象（概念）

* [Service](https://kubernetes.io/zh/docs/concepts/services-networking/service/)
* Pod
* Container

### Contianer

本质上是相互之间 名字空间 隔离的进程组，Contianer 间可以实现资源的完全隔离（隔离性相对 VM 弱一点），性能几乎无损。

Contrainer 支持 Docker 中全功能的配置，包括暴露网络端口。

### Pod

Pod 又称为容器组，是 k8s 的最小调度单元，一个 Pod 中可以包含 1 个 或 多个 Container （端口不能冲突），同一个 Pod 的 Container 将会调度到同一个宿主机内，同一个 Pod 内的 Contrainer [共享内容](https://www.cnblogs.com/rexcheny/p/11017146.html) 如下：

* 网络：也就是说 同 Pod 的 Contrainer 可以通过 localhost 相互通讯，端口不能冲突
* UTS（主机名和域名）名称空间：`hostname` 将返回同样的主机名
* IPC名称空间：也就是说 同 Pod 的 Contrainer 可以通过 信号量、队列和共享内存 相互通讯
* PID名称空间（默认不共享，通过shareProcessNamespace配置）：也就是说 同 Pod 的 Contrainer 可以相互看到对方的 PID （`ps` 命令可以看到对方）

除了通过以上方式实现 同 Pod 的 Contrainer 相互通讯外，还可以通过 [共享卷](https://kubernetes.io/zh/docs/tasks/access-application-cluster/communicate-containers-same-pod-shared-volume/) 通讯

支持多 Contrainer 的 Pod 的原因：Pod 能有多个容器的主要原因是为了支持辅助应用（helper applications），以协助主应用（primary application）。 辅助应用的典型例子是数据抽取，数据推送和代理。辅助应用和主应用经常需要相互通信。

支持多 Contrainer 的 Pod 的应用场景：

* Service Mesh 的 sidecar 进程
* 利用 共享卷 实现资源部署

更多：https://www.cnblogs.com/momenglin/p/12008248.html

关于 [**Deployment**](https://kubernetes.io/zh/docs/concepts/workloads/controllers/deployment/)

deployment是pod版本管理的工具 用来区分不同版本的pod，deployment可以配置 Pod 的副本数目，用来管理 Pod 的 扩缩容、升级、回滚。

一般 Pod 定义在 Deployment 之中，而不是单独定义 Pod。

### Service

是对外提供服务的单元，主要提供负载均衡和服务发现功能。Service 和 Pod 是多对多的关系，且一个 Pod 也不一定必须属于一个 Service。

#### Service 4种类型（`spec.type`）

**ClusterIP** 类型（仅 k8s 内部访问）

一个 Service 的创建会分配一个固定的 IP（称为 VIP），k8s 内的所有 Container 可以通过环境变量或者 DNS 发现这些 Service 的 IP 和 Port（宿主机和 k8s 外部无法访问）。

* 环境变量：当 Pod 运行在 Node 上，kubelet 会为每个活跃的 Service 添加一组环境变量。
    * 例如：一个名称为 "redis-master" 的 Service 暴露了 TCP 端口 6379，同时给它分配了 Cluster IP 地址 10.0.0.11，这个 Service 生成了如下环境变量：

```bash
REDIS_MASTER_SERVICE_HOST=10.0.0.11
REDIS_MASTER_SERVICE_PORT=6379
REDIS_MASTER_PORT=tcp://10.0.0.11:6379
REDIS_MASTER_PORT_6379_TCP=tcp://10.0.0.11:6379
REDIS_MASTER_PORT_6379_TCP_PROTO=tcp
REDIS_MASTER_PORT_6379_TCP_PORT=6379
REDIS_MASTER_PORT_6379_TCP_ADDR=10.0.0.11
```

* DNS：推荐方式，通过附加组件实现该特性
    * 例如：命名空间 "my-ns" 中有一个名为 "my-service" 的服务，且具有名为 "http"　的端口，且协议设置为 TCP 则
        * 则 k8s 内的所有 Pod 中的 Container 均可以通过 `my-service.my-ns` 查找到其 IP
        * 此外，`_http._tcp.my-service.my-ns` 可以查找到 该 的端口

`spec.clusterIP` 有几种配置

* 不填，自动分配
* 填写一个固定值
* `None` 为 Headless Services，不会进行服务发现

**NodePort** 类型（支持 k8s 外部通过宿主机访问）

* `.spec.ports[*].nodePort` 配置绑定的宿主机（Node）端口，注意所有宿主机都会暴露该该端口

**LoadBalancer** 类型（支持 k8s 外部通过宿主机访问）

云主机提供商绑定

**ExternalName** （支持 k8s 外部通过宿主机访问）要求kube-dns的版本>= 1.7

#### Ingress

一个 k8s 生态内的负载均衡器，官方为维护的为 ingress-nginx

更多参见 [博客1](https://segmentfault.com/a/1190000019908991) 和 [博客2](https://blog.csdn.net/yucaifu1989/article/details/106898901/)

## kubectl 命令

TODO kubectl 命令简介

### 命令式 和 声明式

> [文档](https://kubernetes.io/zh/docs/concepts/overview/working-with-objects/object-management/)

TODO
