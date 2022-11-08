---
title: "可观测性（一）Metrics & Prometheus"
date: 2022-10-22T19:12:17+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> Prometheus v2.37.2

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

前往[下载页](https://prometheus.io/download/)，下载 prometheus 软件包。

```bash
tar xvfz prometheus-*.tar.gz
cd prometheus-*/
./prometheus --help  # Mac 需要打开系统偏好设置 -> 安全性和隐私，允许改程序运行。
```

### 配置 Prometheus

在软件包中，包含一个简单配置文件 `./prometheus.yml`，重要内容如下：

```yaml
# 全局配置
global:
  scrape_interval: 15s # 抓取数据的间隔时间，默认为 1 分钟。
  evaluation_interval: 15s # 每 15 秒重新加载并检查一次规则，参见 rule_files。 默认值为 1 分钟。
  # scrape_timeout: # 抓取数据的超时时间，默认为 10 秒.

# 报警配置
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          # - alertmanager:9093

# 规则配置文件，检查更新时间通过 global.evaluation_interval 配置
rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

# 数据抓取配置，该配置包含一个去抓取的端点：
# 这里是抓取 Prometheus 程序自身。
scrape_configs:
  # job_name 字段会作为 `job=<job_name>` 附加到抓取到数据的 labels 中。
  - job_name: "prometheus"

    # metrics_path: # 默认是 '/metrics'
    # scheme: # 默认是 'http'.

    static_configs:
      - targets: ["localhost:9090"]
```

配置文件的说明，参见：[官方文档](https://prometheus.io/docs/operating/configuration)。

### 启动 Prometheus

```bash
./prometheus --config.file=prometheus.yml
```

* 通过 `http://localhost:9090` 可以访问 Prometheus 的 WebUI。
* 通过 `http://localhost:9090/metrics` 可以获取到 Prometheus 自己暴露的指标。

### 使用 Prometheus 表达式 (PromQL) 查询

* 打开 `http://localhost:9090/graph`。
* 输入 `promhttp_metric_handler_requests_total` （这个指标数据类型为 `counter` 计数器，数据类型参见下文），可以获取到当前时刻，该指标在每种 labels 下的计数。
* 输入 `promhttp_metric_handler_requests_total{code="200"}`，可以获取到当前时刻，该指标满足 label `code="200"` 情况的计数。
* 输入 `count(promhttp_metric_handler_requests_total)`，可以获取到当前指标在所有 labels 组合的情况下的指标数。
* 输入 `rate(promhttp_metric_handler_requests_total{code="200"}[1m])` （在选中时间范围内，t 时刻的 counter 减去 1 分钟之前 counter 的差除以 60s 值） 可以查看计数器的变化率。
* 关于 Prometheus 表达式语法，参见下文或[官方文档](https://prometheus.io/docs/querying/basics/)。

## 数据类型

## 客户端数据上报

以 Go 为例，展示上面所有数据类型的上报

## 数据查询 PromQL

## 数据大盘 Grafana

## 报警接入

## 常见的 Exporter

> 参考：[官方文档](https://prometheus.io/docs/instrumenting/exporters/)。

### Node Exporter

https://prometheus.io/docs/guides/node-exporter/

### MySQL Exporter

### Redis exporter

### RocketMQ exporter
