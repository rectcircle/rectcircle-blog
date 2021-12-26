---
title: "服务端可观测性——Metrics解决方案"
date: 2021-12-26T15:23:33+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 概述

服务端可观测性方面的基础设施中，与服务端开发需要理解的主要有两种，分别是：

* logging 日志服务
* metrics （量度）打点服务

基于以上基础设施，我们可以构建出一个观测系统，该系统可以为开发人员提供如下能力：

* 日志查询服务
* 量度可视化图表看板
* 调用链追踪（日志、量度）
* 报警

最近一些年，在微服务领域，又诞生了混沌工程相关技术，在此就不多阐述。

https://xie.infoq.cn/article/e6d5ca7e6390ffbbce16792f9

本文主要站在服务端开发的角度，描述，在开源的云原生领域下，metrics 相关的技术。

TODO

时序数据库模型

几种常用的方案

* 主讲 Prometheus
    * https://yunlzheng.gitbook.io/prometheus-book/parti-prometheus-ji-chu/quickstart
    * https://cloud.tencent.com/document/product/1416
    * https://juejin.cn/post/6844903862348808206
* 主讲 Grafana
* OpenTSDB 和 bosun https://polaris_wang.gitbooks.io/bosun/content/exp_lang.html
* InfluxDB
