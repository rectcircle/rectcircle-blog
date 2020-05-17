---
title: "Elasticsearch"
date: 2020-04-25T16:40:40+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

* [官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
* [阮一峰博客](http://www.ruanyifeng.com/blog/2017/08/elasticsearch.html)

## 介绍

主流的分布式全文搜索引擎，底层基于 Lucene。

使用场景

* 线上业务搜索服务
* 程序运行日志、metric查询分析

## 快速开始

* 安装运行 ES 集群
* 导入文件，并构建索引
* 使用 ES 查询语言搜索文档

### 本地安装运行

> 以Mac为例，其他参见： [官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/getting-started-install.html#run-elasticsearch-hosted)

下载

```bash
curl -L -O https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-7.6.2-darwin-x86_64.tar.gz
```

解压

```bash
tar -xvf elasticsearch-7.6.2-darwin-x86_64.tar.gz
```

运行

```bash
cd elasticsearch-7.6.2
./bin/elasticsearch
```

查看状态

```bash
curl -X GET "localhost:9200/_cat/health?v&pretty"
```

`status` 为 `green` 或者 `yellow` 表示运行正常
