---
title: "Python Django Command Mysql Gone Away"
date: 2020-09-11T10:54:48+08:00
draft: false
toc: true
comments: true
tags:
  - python
---

## 场景

某些情况，需要使用 Django 的 自定义 Command 的方式来持续运行后台任务，如果这个后台任务需要操作 MySQL，可能出现 gone away 错误。

## 异常原因

MySQL server 有一个配置：`show variables like 'wait_timeout'`;

- 社区 MySQL 默认为 8 小时
- 该字段表示，当一个 MySQL 连接空闲（没有请求）超过该值时，Server 将主动断开

Django 的 MySQL Collection 管理并不是连接池方式，而是 thread local 的。也就说，每个线程，针对每一个数据源，都有一个相互独立 的 Collection。

当一个脚本间隔 超过 wait_timeout 时间没有操作过 数据库时，当前的连接将被 Server 关闭，从而导致 gone away 异常

## 解决方案

在合适的地方调用 close_old_connections

```python
from django.db import close_old_connections

# ...
close_old_connections()
```

- close_old_connections 将会关闭当前线程关联的 mysql connection
- 因此 需要 在 出现 gone away 的 线程中执行 close_old_connections
