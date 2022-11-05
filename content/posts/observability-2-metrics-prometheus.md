---
title: "可观测性（一）Metrics & Prometheus"
date: 2022-10-22T19:12:17+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 概述

Metrics (指标) 是反应系统状态的具有明确定义的数值。比如一个 Web 服务的响应时间，请求量，数据库连接数等等。Metrics 是由一系列带有属性的随着时间变化的数值分组/聚合得来的，一般可以绘制成关于时间的图表。

因此 Metrics 是系统具有良好的可观测性的关键，基于 Metrics 可以制作：

* 定义系统异常报警规则。
* 系统监控仪表盘 (数据看板)。

基于以上手段，可以系统开发和运维人员提供系统内部情况，以：

* 保证系统稳定运行。
* 更好的发现系统可优化项。
* 量化系统优化效果。

提供 Metrics 的数据收集、数据存储、数据查询的系统一般称为系统监控系统平台。

Prometheus 就是目前最主流的开源的监控平台。是 CNCF 继 Kubenates 之后的第二个托管项目。

## 架构

> 图片来源：[Prometheus 官网](https://prometheus.io/docs/introduction/overview/)）

![iamge](/image/prometheus-architecture.png)

Prometheus 由如下组件组成：

* [Prometheus server](https://github.com/prometheus/prometheus) 系统核心，提供数据收集、数据存储、数据查询能力，主要由如下部分组成：
    * Retrieval 定时从被监控的应用程序拉取 (pull) 指标数据。
    * TSDB 时序数据库，存储指标数据。
    * HTTP Server 提供配置、数据查询能力。
* [client libraries](/docs/instrumenting/clientlibs/) 嵌入到被监控的应用程序，会启动一个符合 Prometheus 规范的 http 端点来暴露指标， Retrieval 会定时从该端点拉取指标数据。
* [push gateway](https://github.com/prometheus/pushgateway)  某些场景，被监控应用程序很短的，或者无法暴露端口，此时可以 push gateway 通过推送 (push) 的方式主动发送指标数据。该 push gateway 会暴露一个服符合 Prometheus 规范的 http 端点，让 Retrieval 来拉取 (pull) 应用程序的指标数据。
* [exporters](https://prometheus.io/docs/instrumenting/exporters/) 用来监控某个类应用程序的服务，这些服务，会通过 client libraries 暴露这些应用程序的内部指标。
* [alertmanager](https://github.com/prometheus/alertmanager) 报警管理器，用来对接各种报警系统，Prometheus server 会推送报警数据 (push) 到 alertmanager，alertmanager 在调用各种报警系统。

## 快速开始

### 下载运行 Prometheus

Prometheus 是由 Go 语言编写，因此只需下载一个静态编译的可执行文件即一键启动。
