---
title: "分布式定时调度器"
date: 2020-08-02T15:38:43+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 需求

* 通过 RESTful API 动态创建修改删除相关定时任务
* 定时任务被均匀的分布在多个实例中进行触发执行
* 扩缩容、滚动升级过程中，服务正常运行
* 保证定时任务被且仅被触发一次
* 组件依赖尽量简单

## 开源方案

https://zhuanlan.zhihu.com/p/129055463

相对较重。

## 设计

### 依赖

仅依赖数据库

### 核心设计

不分主从，所有 Worker 代码相同，数据存储在数据库中，利用数据库获知其他 Worker 信息从而进行任务分配，使用一致性 Hash 算法进行任务分配

任务使用 cron 表达式确定何时触发。

### 数据库核心表

`job` 任务表，每一行代表一个任务

```sql
CREATE TABLE `job` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `object_id` int(11) unsigned NOT NULL COMMENT '对象 id',
  `cron` varchar(128) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'cron 表达式',
  `pre_redundant_second` int(11) DEFAULT NULL COMMENT '触发时间范围：提前多久进入触发区间',
  `rear_redundant_second` int(11) DEFAULT NULL COMMENT '触发时间范围：延迟多久还算触发区间',
  `type` varchar(64) COLLATE utf8_unicode_ci NOT NULL COMMENT '作业类型',
  `param` text COLLATE utf8_unicode_ci COMMENT '作业的其他配置参数',
  `status` int(11) NOT NULL COMMENT '状态',
  PRIMARY KEY (`id`),
  KEY `idx_object_id` (`object_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='定时任务作业表';
```

`job_lock` 数据库实现的锁，用于实现任务分配，各个 Worker 间消息通知（简单起见使用 数据库 可以实现，当然可以使用 ZooKeeper）

```sql
CREATE TABLE `job_lock` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `expired_time` datetime NOT NULL COMMENT '过期时间'
  `lock_identifier` varchar(128) COLLATE utf8_unicode_ci NOT NULL COMMENT '锁标识符',
  `type` varchar(64) COLLATE utf8_unicode_ci NOT NULL COMMENT '锁类型，目前支持：consistent_hash',
  `data` text COLLATE utf8_unicode_ci COMMENT '锁存储的数据',
  PRIMARY KEY (`id`),
  KEY `idx_lock_identifier` (`lock_identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='数据库表锁';
```

`job_instance` 任务触发实例

```sql
CREATE TABLE `job_instance` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `job_id` int(11) unsigned DEFAULT NULL,
  `expect_time` datetime NOT NULL COMMENT '期望时间',
  `trigger_time` datetime NOT NULL COMMENT '触发时间',
  `status` int(11) NOT NULL COMMENT '状态：running|success|failure',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_job_id_expect_time` (`job_id`,`expect_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='定时任务触发实例表';
```

## 实现

### Worker 组件

每个 Worker 包含如下几个组件

* Heartbeat-Thread 心跳线程
    * 注册当前 Worker 到 `job_lock` 表中，并获取当前其他 Worker 的情况
    * 定时执行如下操作
        * 更新当前 Worker 对应的 `job_lock` 记录的超时时间
        * 重新获取并更新其他 Worker 的情况
* ScanJob-Thread 作业扫描线程，定时执行如下操作
    * 根据最大 `id`，定时扫描 `job` 表，并记录当前 的 最大 `id`，和全部任务 `id`
    * 根据当前 Worker 情况 和 一致性Hash 算法过滤出来需要当前 Worker 负责的任务 id
* Dispatcher-Thread 任务派发线程，针对每一个 job_id 执行
    * 根据当前时间 和 job 配置信息判断当前 job 是否触发（还有其他判断，比如任务是否被删除等）
    * 如果触发，则创建一条 `job_instance` 记录（利用 `insert if not exist` 乐观锁，加一下限制，是因为以上机制不能完全保证任务分配不交叉），如果创建成功，则提交任务到工作线程池执行相关代码逻辑
* Worker—Thread-Pool 任务执行线程
    * 负责执行触发了的任务代码

### RESTful API

利用任意 编程语言 实现 CURD 即可

### 注意事项

* `job` 的 `cron` 字段是不可变的，这样可以减小数据库的压力，提高性能
