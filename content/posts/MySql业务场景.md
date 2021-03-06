---
title: MySql业务场景
date: 2018-08-20T15:43:46+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/164
  - /detail/164/
tags:
  - 业务场景
---

### 1、根据时间并发更新问题

#### （1）需求描述

需要返回一个计数值：该数字从start开始计数，该数字每秒增加2到3。

#### （2）需求分析

定义：

* 计数值：`count = start`
* 更新时间：`time = now`
* 更新函数：`f(count, time) = count + random(2, 3) * (now - time)`

#### （3）业务实现

* 数据表：`t(count, time)`
* 实现
	* (c0, t0) = get();
	* (c1, t1) = (f(c0, t1), now)
	* rows = update t set count=c1, time=c1 where time=t0;
	* if(rows==0)
		* return c0 //一致性要求高的，再查询一次
	* else
		* return c1

#### （4）业务难点

并发更新问题：利用时间戳（版本）+where条件组成乐观锁

### 2、select检查后update类业务

> [参考1](https://blog.csdn.net/paopaopotter/article/details/79259686)
> [参考2](https://www.jb51.net/article/50103.htm)

在MySql的四种隔离级别，均可以解决第一类丢失更新（两个事务同时更新一个记录一个先提交，另一个后回滚，前一个提交的内容被丢弃了）

| 取款事务A | 转账事务B |
|----------|----------|
|开始事务||
||开始事务|
|查询账户余额为1000元    ||
||查询账户余额为1000元|
||汇入100元把余额改为1100元|
||提交|
|取出100元把余额改为900元||
|撤销事务||
|余额恢复为1000 元（丢失更新，事务B提交的数据也被回滚了）||

在MySql的前三种隔离级别（RU、RC、RR）级别，无法解决第二类丢失更新问题（多个先select检查后update的事务高并发时，可能出现更新被覆盖）

| 取款事务A | 转账事务B |
|----------|----------|
||开始事务|
|开始事务||
||查询账户余额为1000元|
|查询账户余额为1000元||
||取出100元把余额改为900元|
||提交|
|汇入100元||
|提交事务||
|把余额改为1100 元（丢失更新，A覆盖了B的修改）||

#### （1）需求描述

大多数业务都需要，先查询数据库检查条件，如果条件成立，则执行更新操作。比如我遇到的业务：

* 抽奖：
	* 先检查抽奖次数，是否存有次数，
	* 有的话进行抽奖，将抽奖次数减一
* 需要返回一个计数值：该数字从start开始计数，该数字每秒增加2到3。
	* 查询更新时间，是否在相距现在超过1秒
	* 如果超过了更新计数值和更新时间

#### （2）需求分析

* 要保证在更新时，没有别的事务更新过了

#### （3）业务实现

**方式1：复杂sql语句**

一条复杂的sql语句实现业务，因为一条sql语句可以保证原子性

**不推荐**

* 不易维护
* 破坏了分层，业务下沉到了dao层

**方式2：利用排他锁实现**

* 查询使用 `select for update`加x锁
* 更新`update where id=?`

**方式3：利用where条件加乐观锁**

* 查询仍然使用快照读`select`
* 更新使用where加更多的条件过滤`select where id=? and updateKey=? ...`
	* 如果没有记录被更新：已被修改，失败，直接返回
	* 如果有记录被更新：正常，没有发生竞争

方式2和方式3选择

* 竞争激烈的情况使用**方式2**（悲观锁）（少数情况）
* 竞争不激烈的情况使用**方式2**（乐观锁）（多数情况）

### 3、对第三方服务的依赖

#### （1）需求描述

本系统，给前端提供服务，并依赖一个后端服务。本不仅仅是一个代理，为了减轻后端服务的压力，需要在本系统中保存状态，对请求进行过滤。
