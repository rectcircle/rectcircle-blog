---
title: MySql-InnoDB锁分析
date: 2018-08-07T11:09:22+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/162
  - /detail/162/
tags:
  - sql
---

> 转载整理自[MySQL 加锁处理分析](http://hedengcheng.com/?p=771)

## 一、背景

***

### 1、MVCC快照读和当前读

MySQL InnoDB存储引擎，实现的是基于多版本的并发控制协议——[MVCC](http://en.wikipedia.org/wiki/Multiversion_concurrency_control)。(注：与MVCC相对的，是基于锁的并发控制，Lock-Based Concurrency Control)。MVCC最大的好处，相信也是耳熟能详：读不加锁，读写不冲突。在读多写少的OLTP应用中，读写不冲突是非常重要的，极大的增加了系统的并发性能，这也是为什么现阶段，几乎所有的RDBMS，都支持了MVCC。

在MVCC并发控制中，读操作可以分成两类：快照读 (snapshot read)与当前读 (current read)。

* 快照读，读取的是记录的可见版本 (有可能是历史版本)，**不用加锁**。
* 当前读，读取的是记录的最新版本，并且，当前读返回的记录，**都会加上锁**，保证其他事务不会再并发修改这条记录。

在一个支持MVCC并发控制的系统中，哪些读操作是快照读？哪些操作又是当前读呢？以MySQL InnoDB为例：

* 快照读：简单的select操作，属于快照读，不加锁。(当然，也有例外，下面会分析)
	* `select * from table where ?;`
* 当前读：特殊的读操作，插入/更新/删除操作，属于当前读，需要加锁。
	* `select * from table where ? lock in share mode;` S锁 (共享锁)
	* `select * from table where ? for update;` X锁 (排它锁)
	* `insert into table values ();` X锁 (排它锁)
	* `update table set ? where ?;` X锁 (排它锁)
	* `delete from table where ?;` X锁 (排它锁)
	* 所有以上的语句，都属于当前读，读取记录的最新版本。并且，读取之后，还需要保证其他并发事务不能修改当前记录，对读取记录加锁。
	* 为什么将 插入/更新/删除 操作，都归为当前读？可以看看下面这个 更新 操作，在数据库中的执行流程：
		* 当Update SQL被发给MySQL后，
		* MySQL Server会根据where条件，读取第一条满足条件的记录，
		* 然后InnoDB引擎会将第一条记录返回，并加锁 (current read)。
		* 待MySQL Server收到这条加锁的记录之后，会再发起一个Update请求，更新这条记录。
		* 一条记录操作完成，再读取下一条记录，直至没有满足条件的记录为止。
		* 因此，Update操作内部，就包含了一个当前读。
		* 同理，Delete操作也一样。Insert操作会稍微有些不同，简单来说，就是Insert操作可能会触发Unique Key的冲突检查，也会进行一个当前读。

InnoDB与MySQL Server的交互，是一条一条进行的，因此，加锁也是一条一条进行的。先对一条满足条件的记录加锁，返回给MySQL Server，做一些DML操作；然后在读取下一条加锁，直至读取完毕。

### 2、Cluster Index：聚簇索引

和主键同义

* 会在建表中的 PRIMARY KEY 列作为聚集索引，要保证唯一非空
* 如果没有为表定义PRIMARY KEY，MySQL将找到第一个UNIQUE索引，其中所有键列都是NOT NULL，而InnoDB将它用作聚簇索引。
* 如果表没有PRIMARY KEY或合适的UNIQUE索引，InnoDB会在包含行ID值的合成列内部生成名为GEN_CLUST_INDEX的隐藏聚簇索引。这些行按InnoDB分配给此类表中的行的ID排序。行ID是一个6字节的字段，在插入新行时会单调增加。因此，由行ID排序的行在物理上处于插入顺序。

#### （1）聚簇索引如何加快查询速度？

通过聚簇索引访问行很快，因为索引搜索直接指向包含所有行数据的页面。如果表很大，则与使用与索引记录不同的页面存储行数据的存储组织相比，聚簇索引体系结构通常会保存磁盘I / O操作。

#### （2）二级指数如何与聚集指数相关联？

除聚集索引之外的所有索引都称为辅助索引。在InnoDB中，辅助索引中的每个记录都包含该行的主键列以及为辅助索引指定的列。 InnoDB使用此主键值来搜索聚簇索引中的行。

如果主键很长，则二级索引使用更多空间，因此使用短主键是有利的。

### 3、二阶段锁

传统RDBMS加锁的一个原则，就是2PL (二阶段锁)：Two-Phase Locking。相对而言，2PL比较容易理解，说的是锁操作分为两个阶段：加锁阶段与解锁阶段，并且保证加锁阶段与解锁阶段不相交。下面，仍旧以MySQL为例，

* 加锁阶段：只加锁，不放锁。（commit之前）
* 解锁阶段：只放锁，不加锁。（commit时）

### 4、隔离级别

MySQL/InnoDB定义的4种隔离级别：

* Read Uncommited 可以读取未提交记录。此隔离级别，不会使用，忽略。
* Read Committed (RC) 快照读忽略，本文不考虑。针对当前读，RC隔离级别保证对读取到的记录加锁 (记录锁)，存在幻读现象。
* Repeatable Read (RR) 快照读忽略，本文不考虑。针对当前读，RR隔离级别保证对读取到的记录加锁 (记录锁)，同时保证对读取的范围加锁，新的满足查询条件的记录不能够插入 (间隙锁)，不存在幻读现象。
* Serializable 从MVCC并发控制退化为基于锁的并发控制。不区别快照读与当前读，所有的读操作均为当前读，读加读锁 (S锁)，写加写锁 (X锁)。Serializable隔离级别下，读写冲突，因此并发度急剧下降，在MySQL/InnoDB下不建议使用。

## 二、一条简单SQL的加锁实现分析

***

针对以下语句进行分析

* `select * from t1 where id = 1;`
* `delete from t1 where id = 1;`

假设：有索引时，执行计划一定会选择使用索引进行过滤 (索引扫描)。但实际情况会复杂很多，真正的执行计划，还是需要根据MySQL输出的为准。

对于语句1：在RC，RR隔离级别下select操作均不加锁，采用的是快照读，因此在下面的讨论中就忽略了，主要讨论语句二：delete操作的加锁。

实验环境：

```sql
create database test;
use test;
```

### 1、组合一：id主键+RC

实验环境

```sql
DROP TABLE IF EXISTS t1;
create table t1(
	id int auto_increment primary key,
	name varchar(20)
);
insert t1(name) values("name1"),("name2"),("name3");

#select @@tx_isolation;
SET session TRANSACTION ISOLATION LEVEL Read committed; #改变隔离级别
#select @@tx_isolation;
```

实验现象

| 事务1 | 事务2 |
|-------|------|
|`begin;`|      |
|       |`begin;`|
|`delete from t1 where id = 1;` | |
|                               | `select * from t1 where id=2 LOCK IN SHARE MODE;` #测试加了什么锁|
|  |**执行**|
|                               | `select * from t1 where id=1 LOCK IN SHARE MODE;` #测试加了什么锁|
|       |**阻塞** |
|       |ctrl+c 强行终止|
|       |`select * from t1 where name="name1" LOCK IN SHARE MODE;` #测试加了什么锁|
|       |**阻塞** |
|       |ctrl+c 强行终止|
|`commit;`| |
|     |`commit;`|

结论：id是主键时，此delete只需要在id=1这条记录上加X锁即可。

### 2、组合二：id唯一索引+RC

```sql
DROP TABLE IF EXISTS t1;
create table t1(
	id int unique key,
	name varchar(20)  primary key
);
insert t1(id, name) values(1, "name1"),(2, "name2"),(3, "name3");

#select @@tx_isolation;
SET session TRANSACTION ISOLATION LEVEL Read committed; #改变隔离级别
#select @@tx_isolation;
```

实验现象

| 事务1 | 事务2 |
|-------|------|
|`begin;`|      |
|       |`begin;`|
|`delete from t1 where id = 1;` | |
|                               | `select * from t1 where id=2 LOCK IN SHARE MODE;` #测试加了什么锁|
|  |**执行**|
|                               | `select * from t1 where id=1 LOCK IN SHARE MODE;` #测试加了什么锁|
|       |**阻塞** |
|       |ctrl+c 强行终止|
|       |`select * from t1 where name="name1" LOCK IN SHARE MODE;` #测试加了什么锁|
|       |**阻塞** |
|       |ctrl+c 强行终止|
|`commit;`| |
|     |`commit;`|

结论：若id列是unique列，其上有unique索引。那么SQL需要加两个X锁，一个对应于id unique索引上的id = 10的记录，另一把锁对应于聚簇索引上的[name=’d’,id=10]的记录。

### 3、组合三：id非唯一索引+RC

实验环境

```sql
DROP TABLE IF EXISTS t1;
create table t1(
	id int ,
	name varchar(20)  primary key,
	index(id)
);
insert t1(id, name) values(1, "name1"), (1, "name1_1"),(2, "name2"),(3, "name3");

#select @@tx_isolation;
SET session TRANSACTION ISOLATION LEVEL Read committed; #改变隔离级别
#select @@tx_isolation;
```

结论：若id列上有非唯一索引，那么对应的所有满足SQL查询条件的记录，都会被加锁。同时，这些记录在主键索引上的记录，也会被加锁。

### 4、组合四：id无索引+RC

实验环境

```sql
DROP TABLE IF EXISTS t1;
create table t1(
	id int ,
	name varchar(20)  primary key
);
insert t1(id, name) values(1, "name1"), (1, "name1_1"),(2, "name2"),(3, "name3");

#select @@tx_isolation;
SET session TRANSACTION ISOLATION LEVEL Read committed; #改变隔离级别
#select @@tx_isolation;
```

实验现象

| 事务1 | 事务2 |
|-------|------|
|`begin;`|      |
|       |`begin;`|
|`delete from t1 where id = 1;` | |
|                               | `select * from t1 where id=2 LOCK IN SHARE MODE;` #测试加了什么锁|
|  |**阻塞**|
|  |ctrl+c 强行终止|
|                               | `select * from t1 where id=1 LOCK IN SHARE MODE;` #测试加了什么锁|
|       |**阻塞** |
|       |ctrl+c 强行终止|
|       |`select * from t1 where name="name1" LOCK IN SHARE MODE;` #测试加了什么锁|
|       |**阻塞** |
|       |ctrl+c 强行终止|
|`commit;`| |
|     |`commit;`|

结论：若id列上没有索引，SQL会走聚簇索引的全扫描进行过滤，由于过滤是由MySQL Server层面进行的。因此每条记录，无论是否满足条件，都会被加上X锁。但是，为了效率考量，MySQL做了优化，对于不满足条件的记录，会在判断后放锁，最终持有的，是满足条件的记录上的锁，但是不满足条件的记录上的加锁/放锁动作不会省略。同时，优化也违背了2PL的约束。

### 5、组合五：id主键+RR

实验环境

```sql
DROP TABLE IF EXISTS t1;
create table t1(
	id int auto_increment primary key,
	name varchar(20)
);
insert t1(name) values("name1"),("name2"),("name3");

#select @@tx_isolation;
SET session TRANSACTION ISOLATION LEVEL repeatable read; #改变隔离级别
#select @@tx_isolation;
```

实验现象

| 事务1 | 事务2 |
|-------|------|
|`begin;`|      |
|       |`begin;`|
|`delete from t1 where id = 1;` | |
|                               | `select * from t1 where id=2 LOCK IN SHARE MODE;` #测试加了什么锁|
|  |**执行**|
|                               | `select * from t1 where id=1 LOCK IN SHARE MODE;` #测试加了什么锁|
|       |**阻塞** |
|       |ctrl+c 强行终止|
|       |`select * from t1 where name="name1" LOCK IN SHARE MODE;` #测试加了什么锁|
|       |**阻塞** |
|       |ctrl+c 强行终止|
|`commit;`| |
|     |`commit;`|

结论：id是主键时，此delete只需要在id=1这条记录上加X锁即可。（和[1、组合一：id主键+RC](#1、组合一：id主键+RC)一致）

### 6、组合六：id唯一索引+RR

和[2、组合二：id唯一索引+RC](#2、组合二：id唯一索引+RC)一致

### 7、组合七：id非唯一索引+RR

与[3、组合三：id非唯一索引+RC](#3、组合三：id非唯一索引+RC)会使用间隙锁。Innodb和标准的隔离级别不同，是解决了幻读的。

实验环境

```sql
DROP TABLE IF EXISTS t1;
create table t1(
	id int ,
	name varchar(20)  primary key,
	index(id)
);
insert t1(id, name) values(1, "name1"), (1, "name1_1"),(2, "name2"),(3, "name3");

#select @@tx_isolation;
SET session TRANSACTION ISOLATION LEVEL repeatable read; #改变隔离级别
#select @@tx_isolation;
```

| 事务1 | 事务2 |
|-------|------|
|`begin;`|      |
|       |`begin;`|
|`delete from t1 where id = 1;` | |
|                               | `insert into t1(id, name) values(1, "name1_2");` #测试加了什么锁|
|  |**阻塞**|
|       |ctrl+c 强行终止|
|`commit;`| |
|     |`commit;`|

结论：Repeatable Read隔离级别下，id列上有一个非唯一索引，对应SQL：delete from t1 where id = 10; 首先，通过id索引定位到第一条满足查询条件的记录，加记录上的X锁，加GAP上的GAP锁，然后加主键聚簇索引上的记录X锁，然后返回；然后读取下一条，重复进行。直至进行到第一条不满足条件的记录[11,f]，此时，不需要加记录X锁，但是仍旧需要加GAP锁，最后返回结束。

### 8、组合八：id无索引+RR

实验环境

```sql
DROP TABLE IF EXISTS t1;
create table t1(
	id int ,
	name varchar(20)  primary key
);
insert t1(id, name) values(1, "name1"), (1, "name1_1"),(2, "name2"),(3, "name3");

#select @@tx_isolation;
SET session TRANSACTION ISOLATION LEVEL repeatable read; #改变隔离级别
#select @@tx_isolation;
```

实验现象

| 事务1 | 事务2 |
|-------|------|
|`begin;`|      |
|       |`begin;`|
|`delete from t1 where id = 1;` | |
|                               | `select * from t1 where id=2 LOCK IN SHARE MODE;` #测试加了什么锁|
|  |**阻塞**|
|  |ctrl+c 强行终止|
|                               | `select * from t1 where id=1 LOCK IN SHARE MODE;` #测试加了什么锁|
|       |**阻塞** |
|       |ctrl+c 强行终止|
|       |`select * from t1 where name="name1" LOCK IN SHARE MODE;` #测试加了什么锁|
|       |**阻塞** |
|       |ctrl+c 强行终止|
|       |`select * from t1 where id=100 LOCK IN SHARE MODE;` #测试加了什么锁|
|       |**阻塞** |
|       |ctrl+c 强行终止|
|`commit;`| |
|     |`commit;`|

只能执行快照读，当前读全部阻塞、相当于锁表

结论：若id列上没有索引，SQL会走聚簇索引的全扫描进行过滤，由于过滤是由MySQL Server层面进行的。因此每条记录，无论是否满足条件，都会被加上X锁。但是，为了效率考量，MySQL做了优化，对于不满足条件的记录，会在判断后放锁，最终持有的，是满足条件的记录上的锁，但是不满足条件的记录上的加锁/放锁动作不会省略。同时，优化也违背了2PL的约束。

结论：在Repeatable Read隔离级别下，如果进行全表扫描的当前读，那么会锁上表中的所有记录，同时会锁上聚簇索引内的所有GAP，杜绝所有的并发 更新/删除/插入 操作。当然，也可以通过触发semi-consistent read，来缓解加锁开销与并发影响，但是semi-consistent read本身也会带来其他问题，不建议使用。

### 9、组合九：Serializable

针对前面提到的简单的SQL，最后一个情况：Serializable隔离级别。对于SQL2：delete from t1 where id = 1; 来说，Serializable隔离级别与Repeatable Read隔离级别完全一致，因此不做介绍。

Serializable隔离级别，影响的是SQL1：select * from t1 where id = 10; 这条SQL，在RC，RR隔离级别下，都是快照读，不加锁。但是在Serializable隔离级别，SQL1会加读锁，也就是说快照读不复存在，MVCC并发控制降级为Lock-Based CC。

结论：在MySQL/InnoDB中，所谓的读不加锁，并不适用于所有的情况，而是隔离级别相关的。Serializable隔离级别，读不加锁就不再成立，所有的读操作，都是当前读。

## 三、一条复杂的SQL

***

实验环境

```sql
DROP TABLE IF EXISTS t1;
create table t1(
	id int primary key,
	userid varchar(20),
	blogid varchar(20),
	pubtime int,
	comment varchar(256),
	index idx_t1_pu(pubtime, userid)
);
insert
  t1(id, userid, blogid, pubtime, comment)
  values
    (1, "hdc","a", 10, null),
    (4, "yyy","b", 3, null),
    (6, "hdc","c", 100, null),
    (8, "hdc","d", 5, "good"),
    (10, "hdc","e", 1, null),
    (100, "bbb","f", 20, null);

#select @@tx_isolation;
SET session TRANSACTION ISOLATION LEVEL repeatable read; #改变隔离级别
#select @@tx_isolation;
```

待分析语句（RR级别）

```sql
delete from t1 where pubtime > 1 and pubtime < 20 and userid = 'dbc' and comment is not NULL;
```

where 语句执行情况

* Index key：pubtime > 1 and puptime < 20。此条件，用于确定SQL在idx_t1_pu索引上的查询范围。
* Index Filter：userid = ‘hdc’ 。此条件，可以在idx_t1_pu索引上进行过滤，但不属于Index Key。
* Table Filter：comment is not NULL。此条件，在idx_t1_pu索引上无法过滤，只能在聚簇索引上过滤。

所加的锁：

* Index key 加间隙锁
* Index Filter
	* 5.6之后支持ICP不满足IndexFilter的记录不加X锁
	* 其他情况加x锁
* Table Filter：在聚集索引中加锁

实验现象

| 事务1 | 事务2 |
|-------|------|
|`begin;`|      |
|       |`begin;`|
|`delete from t1 where pubtime > 1 and pubtime < 20 and userid = 'dbc' and comment is not NULL;` | |
|                               | `select * from t1 where comment is not NULL LOCK IN SHARE MODE;` #测试`comment is not NULL`加x锁 |
|  |**阻塞**|
|  |ctrl+c 强行终止|
|                               | `select * from t1 where userid = 'dbc' LOCK IN SHARE MODE;` #`userid = 'dbc'`加x锁|
|       |**阻塞** |
|       |ctrl+c 强行终止|
|       |`insert into t1(id, userid, blogid, pubtime, comment) values(3, "hdc","g", 4,"bad" );` #`pubtime > 1 and pubtime < 20`加了间隙锁 |
|       |**阻塞** |
|       |ctrl+c 强行终止|
|       |`select * from t1 where pubtime = 3  LOCK IN SHARE MODE;` #`pubtime=3`加了x锁|
|       |**阻塞** |
|       |ctrl+c 强行终止|
|`commit;`| |
|     |`commit;`|

## 四、死锁原理与分析

***

深入理解MySQL如何加锁，有两个比较重要的作用：

* 可以根据MySQL的加锁规则，写出不会发生死锁的SQL；
* 可以根据MySQL的加锁规则，定位出线上产生死锁的原因；

结论：死锁的发生与否，并不在于事务中有多少条SQL语句，死锁的关键在于：两个(或以上)的Session加锁的顺序不一致。而使用本文上面提到的，分析MySQL每条SQL语句的加锁规则，分析出每条语句的加锁顺序，然后检查多个并发SQL间是否存在以相反的顺序加锁的情况，就可以分析出各种潜在的死锁情况，也可以分析出线上死锁发生的原因。

## 五、总结

***

要做的完全掌握MySQL/InnoDB的加锁规则，甚至是其他任何数据库的加锁规则，需要具备以下的一些知识点：

* 了解数据库的一些基本理论知识：数据的存储格式 (堆组织表 vs 聚簇索引表)；并发控制协议 (MVCC vs Lock-Based CC)；Two-Phase Locking；数据库的隔离级别定义 (Isolation Level)；
* 了解SQL本身的执行计划 (主键扫描 vs 唯一键扫描 vs 范围扫描 vs 全表扫描)；
* 了解数据库本身的一些实现细节 (过滤条件提取；Index Condition Pushdown；Semi-Consistent Read)；
* 了解死锁产生的原因及分析的方法 (加锁顺序不一致；分析每个SQL的加锁顺序)
