---
title: "Java JPA 更新丢失问题"
date: 2021-12-01T18:02:20+08:00
draft: false
toc: true
comments: true
tags:
  -  java
---

## 触发场景

* JPA (Hibernate) (Spring Boot 2)
* MySQL 隔离级别不为 Serializable
* 实体没有使用 `@DynamicUpdate` 注解
* 至少存在两个接口频繁执行：先查询再更新同一个实体的操作（不管更新的字段是否相同）

## 问题描述

导致第二类更新丢失。关于第二类更新丢失参见：[该文](https://juejin.cn/post/6844903854857781262)

## 解决办法

### 场景一：如果两个接口不是更新同一个字段

* 将 `entity.setXxx` 改为编写 HQL 的调用，指定更新有改动的字段
* 添加 `@DynamicUpdate` 注解，参考：[该文](https://www.baeldung.com/spring-data-jpa-dynamicupdate)

### 场景二：如果两个接口同时更新同一个字段

* 悲观锁 `select for update`
* 乐观锁 `update set xxx = ? where id = ? and xxx = select 到的数据`
