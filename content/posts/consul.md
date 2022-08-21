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

* Node Name：是 Agent 的唯一名称。默认情况下，这是机器的主机名，但您可以使用 `-node` 标志对其进行自定义。
* Datacenter：配置代理运行的数据中心。对于单 DC 配置，代理将默认为 `dc1`，您可以使用 -datacenter 配置。 Consul 对多个数据中心具有一流的支持，但配置每个节点以报告其数据中心可提高代理效率。
* Server：表明 Agent 是在 Server 还是 Client 模式下运行。在服务器模式下运行代理需要额外的开销。这是因为它们参与了共识仲裁、存储集群状态并处理查询。服务器也可能处于  "bootstrap" 模式，这使服务器能够选举自己作为 Raft 领导者。多个服务器不能处于引导模式，因为它会使集群处于不一致的状态。
* Client Addr：这是用于 Client 连接的接口的地址。这包括 HTTP 和 DNS 接口的端口。默认情况下，这仅绑定到 localhost。如果更改此地址或端口，则在运行 consul members 等命令时指定 `-http-addr` 以指示如何访问代理。其他应用程序也可以使用 HTTP 地址和端口来控制 Consul。
* Cluster Addr：这是用于集群中 Consul Agent 之间通信的地址和端口集。并不要求集群中的所有 Consul Agent 都必须使用相同的端口，但所有其他节点必须可以访问此地址。

注意：如果使用 systemd 运行 Consul 且配置了 -join 时，service 配置文件需配置 [Type=notify](https://askubuntu.com/questions/1120023/how-to-use-systemd-notify)。

该模式将启用单个 Server Agent，并打印 Debug 日志，不能在真实生产环境使用，如何在生产模式部署，参见：[下文](#安装和部署)。

此时，通过浏览器打开 http://127.0.0.1:8500 即可打开 Consul 的 WebUI。

下文将，通过 http://localhost:8500 端口的 HTTP API 注册和查询服务。需要注意的是：

* 注册和取消服务，需使用 `/v1/agent` 接口。
* 发现服务，需使用 `/v1/catalog` 和 `/v1/health` 接口。

### 基本使用

本部分主要介绍如何通过 HTTP API 进行 Consul 的服务注册和发现的基本使用方法。

假设我们有两个服务，分别是 `test-service-1` 和 `test-service-2`。

`test-service-1` 包含两个实例，一个是健康的 (`9000`)，一个是未启动的 (`9001`)。`test-service-2` 有两个健康实例 (`9010` 和 `9011`)，使用 nc 命令模拟这两个服务。

* `while true; do echo -e "HTTP/1.1 200 OK\n\ntest-service-1 (instance1): $(date)" | nc -l 9000; if [ $? -ne 0 ]; then break; fi; done`
* `while true; do echo -e "HTTP/1.1 200 OK\n\ntest-service-2 (instance1): $(date)" | nc -l 9010; if [ $? -ne 0 ]; then break; fi; done`
* `while true; do echo -e "HTTP/1.1 200 OK\n\ntest-service-2 (instance2): $(date)" | nc -l 9011; if [ $? -ne 0 ]; then break; fi; done`

#### 注册服务

> 参见： [Service - Agent HTTP API](https://www.consul.io/api-docs/agent/service#register-service)

```bash
# 注册第 1 个服务的第 1 个实例
curl  \
    --request PUT \
    --data '
        {
            "ID": "test-service-1-instance-1",
            "Name": "test-service-1",
            "Address": "127.0.0.1",
            "Port": 9000,
            "Check": {
                "HTTP": "http://127.0.0.1:9000",
                "Interval": "10s"
            }
        }
    ' \
    http://localhost:8500/v1/agent/service/register

# 注册第 1 个服务的第 2 个实例
curl  \
    --request PUT \
    --data '
        {
            "ID": "test-service-1-instance-2",
            "Name": "test-service-1",
            "Address": "127.0.0.1",
            "Port": 9001,
            "Check": {
                "HTTP": "http://127.0.0.1:9001",
                "Interval": "10s"
            }
        }
    ' \
    http://localhost:8500/v1/agent/service/register

# 注册第 2 个服务的第 1 个实例
curl  \
    --request PUT \
    --data '
        {
            "ID": "test-service-2-instance-1",
            "Name": "test-service-2",
            "Address": "127.0.0.1",
            "Port": 9010,
            "Check": {
                "HTTP": "http://127.0.0.1:9010",
                "Interval": "10s"
            }
        }
    ' \
    http://localhost:8500/v1/agent/service/register

# 注册第 2 个服务的第 2 个实例
curl  \
    --request PUT \
    --data '
        {
            "ID": "test-service-2-instance-2",
            "Name": "test-service-2",
            "Address": "127.0.0.1",
            "Port": 9011,
            "Check": {
                "HTTP": "http://127.0.0.1:9011",
                "Interval": "10s"
            }
        }
    ' \
    http://localhost:8500/v1/agent/service/register
```

#### 发现服务

> 参见：[Query services](https://learn.hashicorp.com/tutorials/consul/get-started-service-discovery?in=consul/getting-started#query-services)

**方式 1：通过 DNS**

只返回健康的实例。

```bash
dig @127.0.0.1 -p 8600 test-service-1.service.consul SRV
```

输出如下：

```
; <<>> DiG 9.10.6 <<>> @127.0.0.1 -p 8600 test-service-1.service.consul SRV
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 9930
;; flags: qr aa rd; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 3
;; WARNING: recursion requested but not available

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;test-service-1.service.consul. IN      SRV

;; ANSWER SECTION:
test-service-1.service.consul. 0 IN     SRV     1 1 9000 7f000001.addr.dc1.consul.

;; ADDITIONAL SECTION:
7f000001.addr.dc1.consul. 0     IN      A       127.0.0.1
machine.node.dc1.consul. 0      IN      TXT     "consul-network-segment="

;; Query time: 0 msec
;; SERVER: 127.0.0.1#8600(127.0.0.1)
;; WHEN: Sun Aug 21 14:58:43 CST 2022
;; MSG SIZE  rcvd: 167
```

**方式 2：catalog HTTP API**

返回所有实例（细节参见：[List Nodes for Service](https://www.consul.io/api-docs/catalog#list-nodes-for-service) | [Filtering](https://www.consul.io/api-docs/features/filtering)）。

```bash
curl http://localhost:8500/v1/catalog/service/test-service-1
```

输出部分内容如下所示：

```json
[
    {
        "ID": "3033c057-b976-28bb-1666-02fbf3dd00d2",
        "Node": "machine",
        "Address": "127.0.0.1",
        "Datacenter": "dc1",
        "ServiceID": "test-service-1-instance-1",
        "ServiceName": "test-service-1",
        "ServiceTags": [],
        "ServicePort": 9000,
        // ...
    },
    {
        "ID": "3033c057-b976-28bb-1666-02fbf3dd00d2",
        "Node": "machine",
        "Address": "127.0.0.1",
        "Datacenter": "dc1",
        "ServiceID": "test-service-1-instance-2",
        "ServiceName": "test-service-1",
        "ServiceTags": [],
        "ServicePort": 9001,
        // ...
    }
]
```

**方式 3：health HTTP API**

返回所有实例，并可以获取到健康检查的状态（细节参见：[List Nodes for Service](https://www.consul.io/api-docs/catalog#list-nodes-for-service) | [Filtering](https://www.consul.io/api-docs/features/filtering)）。

```bash
curl http://127.0.0.1:8500/v1/health/service/test-service-1
```

输出部分内容如下所示：

```json
[
    {
        "Node": {
            "ID": "3033c057-b976-28bb-1666-02fbf3dd00d2",
            "Node": "machine",
            "Address": "127.0.0.1",
            "Datacenter": "dc1",
            // ...
        },
        "Service": {
            "ID": "test-service-1-instance-1",
            "Service": "test-service-1",
            "Tags": [],
            "Address": "127.0.0.1",
            "Port": 9000,
        },
        "Checks": [
            {
                "Node": "machine",
                "CheckID": "serfHealth",
                "Name": "Serf Health Status",
                "Status": "passing",
                // ...
            },
            {
                "Node": "machine",
                "CheckID": "service:test-service-1-instance-1",
                "Name": "Service 'test-service-1' check",
                "Status": "passing",
                // ...
            }
        ]
    },
    {
        "Node": {
            "ID": "3033c057-b976-28bb-1666-02fbf3dd00d2",
            "Node": "machine",
            "Address": "127.0.0.1",
            "Datacenter": "dc1",
            // ...
        },
        "Service": {
            "ID": "test-service-1-instance-2",
            "Service": "test-service-1",
            "Tags": [],
            "Address": "127.0.0.1",
            "Port": 9001,
        },
        "Checks": [
            {
                "Node": "machine",
                "CheckID": "serfHealth",
                "Name": "Serf Health Status",
                "Status": "passing",
                // ...
            },
            {
                "Node": "machine",
                "CheckID": "service:test-service-1-instance-2",
                "Name": "Service 'test-service-1' check",
                "Status": "critical",
                // ...
            }
        ]
    }
]
```

#### 取消注册

```bash
curl --request PUT http://127.0.0.1:8500/v1/agent/service/deregister/test-service-1-instance-1
curl --request PUT http://127.0.0.1:8500/v1/agent/service/deregister/test-service-1-instance-2
curl --request PUT http://127.0.0.1:8500/v1/agent/service/deregister/test-service-2-instance-1
curl --request PUT http://127.0.0.1:8500/v1/agent/service/deregister/test-service-2-instance-2
```

## 安装和部署

> 参考： [数据中心部署](https://learn.hashicorp.com/tutorials/consul/deployment-overview?in=consul/production-deploy)

### 架构和说明

> [What is Consul?](https://learn.hashicorp.com/tutorials/consul/get-started?in=consul/getting-started) | [部署架构](https://learn.hashicorp.com/tutorials/consul/reference-architecture?in=consul/production-deploy)

Consul 是一个分布式系统，在 Consul 的概念中，一个 Consul 集群被称为数据中心 (datacenter)。

一个 Consul 数据中心由多个节点（被称为 Agent）组成，这些节点可以部署在物理机、虚拟机、或容器中。这些 Agent 可以分为如下两类：

* 3~5 台 Server Agent，包括一个 Leader 和多个 Follower，部署独立的性能强劲的机器上。
* 0~n 台 Client Agent，部署在每一台需要部署业务应用的机器上。

在 Consul 中，Server 还是 Client 只是 consul 这个二进制文件 agent 子命令的一个模式。区别在于：

* Server Agent
    * 跟踪可用服务、它们的 IP 地址以及它们当前的运行状况和状态。
    * 跟踪可用节点、它们的 IP 地址以及它们当前的运行状况和状态。
    * 构建一个了解服务和节点可用性的服务目录 (DNS)。
    * 维护和更新 K/V 存储。
    * 采用 gossip protocol 协议向所有 Agent 传达更新。
    * 对通过该 Agent 注册的服务进行健康检查。
* Client Agent
    * 将请求通过 RPC 转发到 Server Agent，以及一些缓存策略。
    * 对通过该 Agent 注册的服务进行健康检查。

也就是说，Client Agent 的健康检查和 Server Agent 能力是相同的，其他的 API 请求都会转发到 ServerAgent 中。

在 API 层面。在使用者看来，不需要区分 Client 和 Server，不管连到 Client 还是 Server，都可以使用 Consul 的全部的功能。

另外，一个只有 Server 的 Consul 集群也是可以正常工作的，但是 Consul 的推荐架构是为每个服务所在的节点 (如 k8s node) 部署一个 Client Agent 原因在于（来自：[网络](https://groups.google.com/g/consul-tool/c/VI1xd8wG-0w)）：

* Agent 可以减轻 Server 的健康检查的压力。
* 对应用层隐藏 Server Agent 的分布式复杂性：应用层只需要知道服务发现的地址永远是 localhost:8500。
* 当 Server Agent 故障时， Client Agent 可以利用缓存继续提供服务。
* Client Agent 的缓存机制，极大提高了集群的吞吐和性能。

因此一个推荐的单数据中心的 Consul 集群的架构如下图所示（图片来源：[一篇文章了解Consul服务发现实现原理](http://www.liuhaihua.cn/archives/546262.html)）：

![image](/image/single-dc-consul-arch.jpeg)

Consul Agent 会暴露很多个服务地址，可以分为两类 Client 和 Cluster，默认端口为(详见：[Required Ports](https://www.consul.io/docs/install/ports))：

* Client （给应用程序使用）
    * 8500(tcp): HTTP api 和 WebUI
    * 8600(tcp/udp): DNS 服务
    * 8501(tcp): HTTPS（默认不开启）
    * 8502(tcp): gRPC API（默认不开启）
* Cluster （集群 Agent 使用，通过 [serf](https://github.com/hashicorp/serf) 库实现）
    * 8300(tcp)： Server RPC 地址。
    * 8301(tcp/udp)：集群内部 Client & Server Agent 间相互通讯协调的端口。
    * 8302(tcp/udp)：跨集群（跨数据中心） 的 Server Agent 间相互通讯协调的端口。

consul agent 的配置可以通过 [命令行参数](https://www.consul.io/docs/agent/config/cli-flags) (`consul agent --help`) 和 [配置文件](https://www.consul.io/docs/agent/config/config-files)。本部分仅介绍部分常用的命令行参数：

| 参数 | 默认值 | 说明 |
| [`-datacenter=<value>`](https://www.consul.io/docs/agent/config/cli-flags#_datacenter)  | dc1 | 同一个集群的数据中心名应该是一致的 |
| [`-server`](https://www.consul.io/docs/agent/config/cli-flags#_server)  |  |  agent 模式是否为 server |
| [`-bootstrap-expect=<value>`](https://www.consul.io/docs/agent/config/cli-flags#_bootstrap_expect)  |  | server 模式有效，当 server agent 达到该数值后，集群开始引导启动，需要注意的是，这个集群中所有 server agent 的该参数的值必须一致 |
| [`-node=<value>`](https://www.consul.io/docs/agent/config/cli-flags#_node) | 主机的 hostname | 此节点的名称。 在集群中必须是唯一的。 |
| [`-bind=<value>`](https://www.consul.io/docs/agent/config/cli-flags#_bind) | `0.0.0.0` | Cluster 端口绑定的地址，可以通过 [go-sockaddr](https://godoc.org/github.com/hashicorp/go-sockaddr/template) 语法运行时获取。如果为默认值，通告地址（指的是别的节点访问本节点时的 ip 地址）将为该机器的私有地址，因此如果有多个私有地址将报错 |
| [`-retry-join`](https://www.consul.io/docs/agent/config/cli-flags#_ui) | | 需要加入的集群中的其他节点的地址，会一致重试直到成功，可以通过 [go-sockaddr](https://godoc.org/github.com/hashicorp/go-sockaddr/template) 语法运行时获取，支持域名，可以指定多次。 |
| [`-data-dir=<value>`](https://www.consul.io/docs/agent/config/cli-flags#_data_dir) |       | 数据持久化目录，需要保证在 agent 挂掉数据仍然是持久化。 client 和 server 模式都需要，client 用来实现停止后重新注册服务。 |
| [`-client=<value>`](https://www.consul.io/docs/agent/config/cli-flags#_client) | `127.0.0.1` | Client 端口绑定的地址，可以通过 [go-sockaddr](https://godoc.org/github.com/hashicorp/go-sockaddr/template) 语法运行时获取。|
| [`-ui`](https://www.consul.io/docs/agent/config/cli-flags#_ui) | | 是否启用 webui |
| [`-domain`](https://www.consul.io/docs/agent/config/cli-flags#_domain) | `consul.` | 通过 DNS 做服务发现时的域名。 |

### 手动部署

上文 [快速开始 - 单机运行](#单机运行) 介绍了如何启动一个开发模式（单 Server Agent 节点）的 Consul 集群。本部分，介绍如何手动部署一个 Consul 集群。集群规划如下：

* 3 台机器：搭建一个包含 3 个 Server Agent 节点的 Consul 集群。
* 2 台机器：模拟用于部署服务的节点，在这两台机器上部署 Client Agent 进程。

需要特别说明的是，Consul 所有 Agent 节点必须是相互可通的同一内网。

简单起见，使用 Docker 容器模拟这 5 台机器。

#### 创建网络

```bash
docker network create consul-cluster
```

#### 部署 Server Agent

```bash
# 启动第 1 个 server
docker run --network=consul-cluster --hostname=consul-server-1 --name=consul-server-1 -d \
    consul agent -server -bootstrap-expect=3 -retry-join=consul-server-1 -retry-join=consul-server-2 -retry-join=consul-server-3
# 启动第 2 个 server
docker run --network=consul-cluster --hostname=consul-server-2 --name=consul-server-2 -d \
    consul agent -server -bootstrap-expect=3 -retry-join=consul-server-1 -retry-join=consul-server-2 -retry-join=consul-server-3
# 启动第 3 个 server
docker run --network=consul-cluster --hostname=consul-server-3 --name=consul-server-3 -d \
    consul agent -server -bootstrap-expect=3 -retry-join=consul-server-1 -retry-join=consul-server-2 -retry-join=consul-server-3
```

注意：

* 可以添加 `-client 0.0.0.0 -ui` 简单起见使用默认值。
* 生产环境一定要指定 `-data-dir` 持久化数据。

#### 部署 Client Agent

```bash
# 启动第 1 个 client (为了方便观察，启用 webui、并将 http api 和 DNS 暴露到宿主机)
docker run --network=consul-cluster --hostname=consul-client-1 --name=consul-client-1 -p 8500:8500 -p 8600:8600 -d \
    consul agent -retry-join=consul-server-1 -retry-join=consul-server-2 -retry-join=consul-server-3 -client=0.0.0.0 -ui
# 启动第 2 个 client
docker run --network=consul-cluster --hostname=consul-client-2 --name=consul-client-2 -d \
    consul agent -retry-join=consul-server-1 -retry-join=consul-server-2 -retry-join=consul-server-3
```

#### 观察测试

* 打开 client 1 的 webui ( http://localhost:8500 ) 可以看到
    * Services 面板： 3 个 server 组成了 consul 服务。
    * Node 面板： 5 个 agent 全部健康。
* 在 client 1 上注册一个测试服务。

    ```bash
    # 不健康的服务
    curl  \
        --request PUT \
        --data '
            {
                "ID": "test-service-1-instance-1",
                "Name": "test-service-1",
                "Address": "127.0.0.1",
                "Port": 9000,
                "Check": {
                    "HTTP": "http://127.0.0.1:9000",
                    "Interval": "10s"
                }
            }
        ' \
        http://localhost:8500/v1/agent/service/register
    # 健康的服务（不启用健康检查）
    curl  \
        --request PUT \
        --data '
            {
                "ID": "test-service-1-instance-2",
                "Name": "test-service-1",
                "Address": "127.0.0.1",
                "Port": 9001
            }
        ' \
        http://localhost:8500/v1/agent/service/register
    ```

* 服务发现
    * 通过 DNS： `dig @127.0.0.1 +tcp -p 8600 test-service-1.service.consul SRV`（注意 `+tcp`），可以返回 9001 的服务。
    * 通过 Catalog API： `curl http://localhost:8500/v1/catalog/service/test-service-1`，返回全部两个服务。
    * 通过 Health API： `curl http://localhost:8500/v1/health/service/test-service-1`，返回全部两个服务以及状态。
* 服务发现 (在其他 client 中)
    * 进入 client2 `docker exec -it consul-client-2 sh`
    * 通过 Catalog API： `curl http://localhost:8500/v1/catalog/service/test-service-1`，返回全部两个服务。
    * 通过 Health API： `curl http://localhost:8500/v1/health/service/test-service-1`，返回全部两个服务以及状态。
    * 通过 [Service Local Health API](https://www.consul.io/api-docs/agent/service#get-local-service-health)：`curl http://localhost:8500/v1/agent/health/service/name/test-service-1` 找不到，可以看出该 API 只能查找到注册到当前 Node 上的服务。
* Client Agent 正常退出
    * 停止 client1 `docker stop consul-client-1`
    * 进入 client2 `docker exec -it consul-client-2 sh`
    * 通过 Health API： `curl http://localhost:8500/v1/health/service/test-service-1`，观察状态可知，服务已经被取消注册了。
    * 重新启动 client1 `docker stop consul-client-1`
    * 进入 client2 `docker exec -it consul-client-2 sh`
    * 通过 Health API： `curl http://localhost:8500/v1/health/service/test-service-1`，观察状态可知，服务已经又被重新注册了。
* Client Agent 异常退出
    * 停止 client1 `docker kill -9 consul-client-1`
    * 进入 client2 `docker exec -it consul-client-2 sh`
    * 通过 Health API： `curl http://localhost:8500/v1/health/service/test-service-1`，观察状态可知，服务仍然存在，但是 Checks 状态可以看出 Node 退出了。
    * 重新启动 client1 `docker start consul-client-1`
    * 进入 client2 `docker exec -it consul-client-2 sh`
    * 通过 Health API： `curl http://localhost:8500/v1/health/service/test-service-1`，观察状态可知，服务已经又被重新注册了。
* Server Agent (Leader) 异常退出
    * 停止 server1 (从 webui 中找到 leader)： `docker kill consul-server-1`
    * 打开 webui，经过一段时间后，可以看出 Consul 集群 2 个 server 仍然正常工作
    * 重新启动 server2：`docker start consul-server-1`
    * 打开 webui，经过一段时间后，可以看出 Consul 集群 3 个 server 仍然正常工作
* Server Agent (Leader) 退出
    * 停止 server2 (从 webui 中找到 leader)： `docker stop consul-server-2`
    * 打开 webui 可以看出 Consul 集群 2 个 server 仍然正常工作
    * 重新启动 server2：`docker start consul-server-2`
    * 打开 webui 可以看出 Consul 集群 3 个 server 仍然正常工作
* Server Agent (follower) 退出
    * 停止 server3 (从 webui 中找到非 leader)： `docker stop consul-server-3`
    * 打开 webui 可以看出 Consul 集群 2 个 server 仍然正常工作
    * 重新启动 server2：`docker start consul-server-3`
    * 打开 webui 可以看出 Consul 集群 3 个 server 仍然正常工作

#### 清理现场

```bash
docker rm -f consul-client-1 consul-client-2 consul-server-1 consul-server-2 consul-server-3
```

### 云原生部署

deamonset & statefulset

CONSUL_HTTP_ADDR

https://www.consul.io/commands#consul_http_addr

https://stackoverflow.com/questions/64770593/hashicorp-consul-agent-client-access

https://wqblogs.com/2021/01/27/k8s%E9%83%A8%E7%BD%B2conusl/
https://1335402049.github.io/2021/02/01/Kubernetes%E9%83%A8%E7%BD%B2Consul%E9%9B%86%E7%BE%A4/
https://www.cnblogs.com/tylerzhou/p/11161634.html
https://zhangguanzhang.github.io/2019/10/24/deployment-consul-in-k8s/

https://blog.baeke.info/2020/05/05/getting-started-with-consul-on-kubernetes/ (HotsIP)

https://learn.hashicorp.com/tutorials/consul/kubernetes-reference-architecture

### 多数据中心

## 核心特性

### 高可用

故障恢复 https://www.consul.io/docs/agent#failures-and-crashes

### API 设计

https://discuss.hashicorp.com/t/what-is-the-different-between-catalog-service-and-agent-service/37155

### 服务发现

### 健康检查

### 服务网格

## 参考

* 代码库 [hashicorp/consul](https://github.com/hashicorp/consul)
* [官方网站](https://www.consul.io/)
* [一篇文章了解Consul服务发现实现原理](http://www.liuhaihua.cn/archives/546262.html)
* [Consul的client mode把请求转向server，那么client的作用是什么？](https://www.zhihu.com/question/68005259)
* [What is purpose and intent of Consul Agents running in Client mode?](https://groups.google.com/g/consul-tool/c/VI1xd8wG-0w)
