---
title: Redis业务场景
date: 2018-07-23T11:37:24+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/157
  - /detail/157/
tags:
  - 业务场景
---

> 参考《Redis实战》

## 目录

* [1、登录和Cookie缓存](#1、登录和Cookie缓存)
* [2、用户浏览记录](#2、用户浏览记录)
* [3、实现购物车](#3、实现购物车)

### 1、登录和Cookie缓存

#### （1）流程

* 在登录验证成功后，
* 生成一个令牌字符串taken，
* 在`login:` hash中添加一个`<token, user>`记录，记录用户登录信息
* 在`recent:` zset中添加`<token, 使用时间>`记录，记录用户最近一次使用token的时间
* 在Set-Cookie中添加token

定时任务：定时清理过期或超过最大会话数的最旧的session

#### （2）数据结构

**`login:`**

* 类型：hash
* key：token
* value：user

**`recent:`**

* 类型：zset
* key：token
* value：使用时间

### 2、用户浏览记录

#### （1）流程

* 用户访问资源
* 获取到用户id
* 在`'viewed:'+userId` zset中添加一个`<item, 时间戳>`
* 如果每个用户只保存最近访问的n条记录，则进行删除超过的最旧的记录

#### （2）数据结构

**`'viewed:'+userId`**

* 类型：zset
* key：item，访问的资源标识
* value：访问事件

### 3、实现购物车
