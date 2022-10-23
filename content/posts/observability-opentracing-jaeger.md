---
title: "可观测性之 Opentracing & Jaeger"
date: 2022-10-22T16:52:19+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 简介

OpenTracing 通过提供平台无关、厂商无关的 API，使得开发人员能够方便的添加（或更换）追踪系统的实现。在 2016 年 11 月, CNCF (云原生计算基金会) 技术委员会投票接受 OpenTracing 作为Hosted 项目，这是 CNCF 的第三个项目，第一个是 Kubernetes，第二个是 Prometheus。

2022 年 1 月 31 日，CNCF 正式宣布 OpenTracing 归档，OpenTracing 和 OpenCensus 一起合并到了 OpenTelemetry，并提供了 OpenTracing 的[兼容层](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/compatibility/opentracing.md)，更多参见： [CNCF 博客](https://www.cncf.io/blog/2022/01/31/cncf-archives-the-opentracing-project/) 和 [github issue](https://github.com/opentracing/specification/issues/163)。

> 💡 OpenTelemetry和 OpenCensus 相比不支持 metrics。

由于 OpenTracing 归档不久，因此应该有很多历史项目仍然在使用 OpenTracing，因此了解 OpenTracing 仍十分有必要。

OpenTracing 相关信息如下：

* [官方站点](https://opentracing.io/)
* [github](https://github.com/opentracing)
* v1.1 标准文档：[中文](https://opentracing-contrib.github.io/opentracing-specification-zh/) | [英文](https://opentracing.io/specification/)
* OpenTracing Server：[Uber 开源的 Jaeger](https://www.jaegertracing.io/)
* OpenTracing Go Client：[opentracing/opentracing-go](https://github.com/opentracing/opentracing-go)

## 示例

### 需求描述

假设我们在开发短信验证码登录需求，该需求包含两个接口：

* 验证码发送需求
* 验证码登录接口

假设我们的服务依赖关系如下所示：

```
                        ------> Redis
                       |
API 服务 ---(RPC)---> 认证服务 ---(MQ)---> 短信服务
```

其他说明：

* RPC 协议使用 HTTP。
* 示例代码使用 Go 和标准库实现。

### 可观测性目标

可以以用户接口请求为粒度，查询内部调用链路，时间信息、上下文信息、日志。

### 实验代码

### 部署测试

```
docker run --rm -it --name jaeger \
  -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 \
  -e COLLECTOR_OTLP_ENABLED=true \
  -p 6831:6831/udp \
  -p 6832:6832/udp \
  -p 5778:5778 \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  -p 14250:14250 \
  -p 14268:14268 \
  -p 14269:14269 \
  -p 9411:9411 \
  jaegertracing/all-in-one:1.38
```

## 不足

* 不支持 metrics
* [暂不支持外部日志](https://github.com/jaegertracing/jaeger/issues/649)
* OpenTelemetry 日志好像也没有完全统合 https://zhuanlan.zhihu.com/p/74930691
