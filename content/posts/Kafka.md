---
title: "Kafka"
date: 2019-11-30T23:18:54+08:00
draft: false
toc: true
comments: true
tags:
  - 分布式
---

https://www.cnblogs.com/ExMan/p/10261095.html

> [中文官网](http://kafka.apachecn.org/)
> [官网](http://kafka.apache.org/)

### 1、介绍

#### （1）是什么

* 一种分布式消息队列产品
    * 未来发展方向为流式平台
* 适合如下场景
    * 业务消息队列，针对吞吐量极高的场景
    * 日志/埋点收集器，大数据数据收集管道、中间存储系统
    * 数据流应用的中间存储

#### （2）核心API

* 生产者API（Producter API）
* 消费者API（Consumer API）
* 流API（Stream API） 基于以上两个API
* （Connector API） 基于以上两个API
    * 用于连接异构数据源

#### （3）核心概念

**Topic**

* Topic及数据主题，每个生产者和消费者必须指定Topic，不同的Topic之间相互隔离。

**分区**

* Topic可以配置分区数目，每个分区存储这个Topic的一部分数据
* 每个分区内的数据是严格有序的
* 每个分区对应一个日志文件（物理上一主多备）

**日志**

* Kafka日志文件是一个顺序文件，写入和读取的的时间复杂度为O(1)，不会随数据量增大而变大。
* 物理上日志文件存储上为一主多备，消费者和生产者都只读写主，备份作为容灾使用
* 每个日志文件（分区）中的每条记录都有一个offset号对应
* 日志文件可以设置生命周期

**生产者**

* 生产者可以将数据发布到所选择的topic（主题）中。
* 生产者负责将记录分配到topic的哪一个 partition（分区）中。
* 可以使用循环的方式来简单地实现负载均衡，也可以根据某些语义分区函数(例如：记录中的key)来完成。

**消费者与消费者组**

* 消费者除了要指定Topic外还要指定消费者组
* 不同消费者组之间相互独立；也就是说，不同消费者组可以独立消费同一份数据
* 同一个消费者组里的消费者只会消费指定的一个或多个分区的数据，不会交叉消费，也就是说，**同一个消费者组**中：
    * 消费者数目 = 1，这个消费者将消费所有的分区
    * 消费者数目 < 分区数，每个消费者消费指定的1个或多个分区，消费者间消费的分区不会交叉
    * 消费者数目 = 分区数，每个消费者消费1个分区
    * 消费者数目 > 分区数，分区数个消费者消费1个分区，剩余的消费者空闲
* Kafka 会记录每个分区消费到的offset数，消费者可以随意改变这个值，从任意位置重新消费

#### （4）保证

high-level Kafka给予以下保证:

* 生产者发送到特定topic partition 的消息将按照发送的顺序处理。 也就是说，如果记录M1和记录M2由相同的生产者发送，并先发送M1记录，那么M1的偏移比M2小，并在日志中较早出现
* 一个消费者实例按照日志中的顺序查看记录.
* 对于具有N个副本的主题，我们最多容忍N-1个服务器故障，从而保证不会丢失任何提交到日志中的记录

#### （5）设计理念

* 递延迟（时间复杂读O(1)，TB级以上数据访问速度不变，毫秒级）
* 高吞吐（廉价商用机器可以做到单机支持10万条/s以上）
* 水平扩展（分布式、在线扩展）
* 顺序性（局部顺序性Partition级别）
* 多场景（离线和实时）
* 持久化高可用

细节

* 批量写
* 压缩存储
* ISR
* 只追加
* 页缓存
* 零拷贝

### 2、架构和原理

```
Producter（client: App web mysql others） --> Broker（Server） --> Comsumer（Client: Hadoop Spark Stream Flink Others Kafka）
                                                 |
                                             ZooKeeper
```

* client 私有RPC协议发送接收消息

#### （1）数据组织方式

* Record
    * 包含KV结构、时间戳
    * 消费和生产的最小单元，表示一条记录
* Topic
    * Record逻辑上的划分
    * 一个消费者、生产者、Record只能属于一个Topic
* Partition
    * Record存储上逻辑的划分
    * 一个Partition只能属于一个Topic
    * 一个Topic被划分为多个Partition
    * Record被分发到那个Partition可以通过key进行路由或者自定义路由规则
    * Partition提供高可用，在高可用集群中一主多备
* Segment
    * 一个Partition在物理上存储为多个文件
    * 每一个Segment对应两个文件分别是数据文件`.log`和索引文件`.index`
        * 文件名为Segment起始offset
        * `.index` 为一个稀疏索引，key为`offset-起始offset`，value为数据在`.index`中的偏移量
        * `.log` 为一个顺序数据文件

#### （2）Kafka 消费者 Rebalance 机制

当某个消费者组中加入或者离开一个消费者，该消费者组的所有消费者将会进行一次 Rebalance 重新分配自己消费的Partition

#### （3）Kafka 高可用

* 主从机制
* 集群维护一个叫做ISR的结构，里面包含所有可用的主从实例
* 只要一个Partition中的从实例大于等于1个，分区都将处于可用状态
* 当生产者发送一个消息，ISR中所有的实例全部Commit，消费者才认为生产成功
    * 当某个实例太慢将会从ISR中移除
    * 当某实例加入ISR，会将自己未Commit的数据删除，并同步完成数据，此时才能加入ISR

当某一时刻 ISR 中所有的备份实例都不可用，如何恢复和选择

* 策略1：等待ISR中的任意实例恢复并作为Leader
    * 降低可用性
    * 数据不会丢失
* 策略2：等待任意实例（不管是否在ISR中）实例恢复作为Leader（默认）
    * 可用性高
    * 数据存在丢失

### 3、使用

#### （1）如何实现Exactly Once

* 使用两阶段提交
* 下游系统保证幂等性
    * 例如插入到MySQL中
    * Kafka使用At Least Once
    * MySQL中使用唯一索引进行保证
* 使用支持事务的系统辅助记录offset
    * 例如使用MySQL创建一个事务记录Offset
    * 当遇到失败是回滚Offset的变更

At Least Once 实现

* 先消费，确保消费成功后，再commit offset

At Least Once 实现

* 拿数据的同时Commit offset，再处理数据

> 其他参见：http://kafka.apachecn.org/
