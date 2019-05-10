---
title: mysql提高
date: 2016-11-15T19:57:21+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/14
  - /detail/14/
tags:
  - sql
---

> 代码优于描述

## 数据库优化

***

### 1、优化的方面

* 硬件
* 系统配置
* 表结构
* sql和索引

### 2、sql优化

#### (1) 准备

* 下载例子数据库：http://dev.mysql.com/doc/index-other.html
* 开启慢查询日志

```sql
show variables like 'slow_query_log'; #查看是否开启
set global log_queries_not_using_indexes=on; #开启未使用索引查询日志记录
show variables like 'long_query_time'; #查看慢查询时间定义
set global long_query_time=0;#定义时间
# set global slow_query_log_file='/home/mysql/sql_log/mysql-slow.log';
set global slow_query_log=on; #开启慢查询日志
show variables like 'slow%'; #查看慢查询日志位置
```

* 慢查询分析工具

```bash
mysqldumpslow #自带
	mysqldumpslow -t 3 /var/run/mysqld/mysqld-slow.log

pt-query-digest
	#安装
	yum -y install perl perl-IO-Socket-SSL perl-DBD-MySQL perl-Time-HiRes
	wget ftp://ftp.pbone.net/mirror/ftp5.gwdg.de/pub/opensuse/repositories/home:/csbuild:/Perl/CentOS_CentOS-6/x86_64/perl-TermReadKey-2.30-2.4.x86_64.rpm
	rpm -ivh perl-TermReadKey-2.30-2.4.x86_64.rpm
	wget https://www.percona.com/downloads/percona-toolkit/2.2.19/RPM/percona-toolkit-2.2.19-1.noarch.rpm
	rpm -ivh percona-toolkit-2.2.19-1.noarch.rpm
	#使用
	pt-query-digest /var/run/mysqld/mysqld-slow.log
```

* 分析sql查询

```sql
#进入mysql
explain 语句
	explain select * from user; #输出
+----+-------------+-------+------+---------------+------+---------+------+------+-------+
| id | select_type | table | type | possible_keys | key  | key_len | ref  | rows | Extra |
+----+-------------+-------+------+---------------+------+---------+------+------+-------+
|  1 | SIMPLE      | user  | ALL  | NULL          | NULL | NULL    | NULL |    2 |       |
+----+-------------+-------+------+---------------+------+---------+------+------+-------+
table: 查询那张表
type: const（主键查找）、rq_reg、ref、range、index、ALL（性能最差）
possible_keys: 可能用到的索引。若为null，没有可能的索引
key： 实际上用到的索引
key_len：索引长度（越小越好）
ref：显示索引那一列被使用，常数最好
rows：扫描行数
using filesort：需要优化
using temp0rary：需要优化
```

#### (2)`count()`和`max()`优化

##### `max()`

```sql
explain select max(payment_date) from payment; #查看状态
#优化方法给payment_date添加索引
create index idx_paydate on payment(payment_date);
```

#### `count()`

```sql
select count(release_year='2006 or null) as '2006年的电影数量' from film
#对于count() null 不会计数
```

#### (3)子查询优化

#### 优化为表连接方式

例子

```sql
#库结构：表t包含id，t1包含tid
#查询t的记录，t的id包含在tid中
select * from t where t.id in ( select t1.id from t1 );
#优化
select t.id from t join t1 on t.id = t1.id; #不存在多对一关系
select distinct t.id from t join t1 on t.id = t1.id; #存在多对一关系，去重
```

#### (4)group by查询

```sql
explain select actor.first_name,actor.last_name,count(*)
from sakila.film_actor inner join sakila.actor using(actor_id)
group by film_actor.actor_id; #用到了临时表和文件排序

#优化后
 explain select actor.first_name,actor.last_name,c.cnt from
 sakila.actor inner join (select actor_id,count(*) as cnt from sakila.film_actor
 group by actor_id) as c using (actor_id);
```

#### (5)limit查询

```sql
#待优化
select film_id,description from sakila.film order by title limit 50,5;
#使用主键排序
select film_id,description from sakila.film order by film_id limit 50,5;
#记录上次返回的主键，在下次查询时使用主键过滤
select file_id,description from sakila.film where film_id>55 and
film_id <=60 order by film_id limit 1,5
#若主键不连续，可以创建连续自增的列来实现
```

原理：

* 子查询：直接查主键减少了磁盘IO，从而提高了时间
* 外部查询：使用了主索引，消耗时间很少

### 2、索引优化

#### （1） 如何选择合适的列建立索引

*	在where、group by、order by 和 on中出现的列
* 索引字段越小越好
* 离散度越大越好（重复的少）

#### （2）索引的维护和优化

```sql
#查看冗余索引
use schema_information;
select a.table_schema as '数据名',
       a.table_name as '表名',
       a.index_name as '索引1',
       b.index_name as ' 索引2',
       a.column_name as  '重复列名'
from statistics a join statistics b on a.table_schema=b.table_schema
and a.table_name=b.table_name and a.seq_in_index=b.seq_in_index and
a.column_name=b.column_name where a.seq_in_index=1 and a.index_name<>b.index_name;

#删除不使用索引

```

### 3、表结构优化

#### （1）选择合适数据类型

* 选择可以存下最小数据类型
* 使用简单数据类型，int比varchar处理简单
* 尽可能使用not null定义
* 尽量少使用text类型
* bigint存储ip，inet_aton('192.168.1.1'),inet_ntoa(bigint);
* int 存储时间函数：from_unixtime(int); unix_timestamp(time);

#### （2）范式化和反范式化

* 遵循第3范式
* 添加适当的冗余

#### （3）表的垂直拆分

* 将大字段的列和不常用的列拆分为一张表

#### （4）水平拆分

* 取模操作决定存到那张表
* 问题
	* 跨分区数据操作
	* 统计及后台报表的制作

### 4、系统配置优化

#### （1）网络配置优化

* 修改/etc/sysctl.conf文件
	* 增加tcp支持的队列数目
	* 减少断开连接时，资源回收

#### （2）操作系统限制

* /etc/security/limits.conf 修改文件打开限制
* 关闭防火墙

### 5、mysql配置优化

* `innodb_buffer_pool_size`
	* innodb缓冲池大小 若单独运行mysql innodb类型表配置为总内存的75%
* `innodb_log_buffer_size`
	* 数据日志大小，不用太大
* `innidb_flush_log_at_trx_commit`
	* 关键参数，commit提交磁盘刷新设置
	* 1：默认值，立即将变更刷新到磁盘
	* 0：每一秒是刷新一次
	* 2：将commit写入到缓冲区，每一秒刷新一次（建议）
* `innodb_read_io_threads`和`innodb_write_io_threads`
	* 读写进程数，cpu核数
* innodb_file_per_table
	* 建议为on
* innodb_stats_on_metadata
	* 什么情况下进行刷新表结构信息
* 第三方配置向导工具percona

### 6、硬件优化

* cpu核数不要超过32
* 磁盘阵列RAID常用raid1+0

## 事务

### 1、事务简介

* 核心：锁和并发
* 性能低
* 事务单元：Bob给Smith 100元
* ACID保证事务完整性
	* 原子性（Atomicity）、
	* 一致性（Consistency）、
	* 隔离性（Isolation）、
	* 持久性（Durability）

### 2、产生原因

Happen-before

* 读写
* 写读
* 读读
* 写写

### 3、事务的实现

* 排队法
* 写锁（排他锁）
	* A事务加了写锁后，其他事务不能对其加锁
* 读锁（共享锁）
	* A事务加了读锁后，B事务仍可以加读锁，但是不能加写锁
	* 读锁，可重复读使读读可以并行
	* 不加读锁，读写可以并行
* MVCC写读优化
	* copy on write

### 4、事务处理的常见处理

* 多个事务谁先谁后
	* 数据读写添加版本号
* 如何进行故障恢复
	* 记录反向操作，进行回滚
	* 出错情况：业务属性不匹配，系统崩溃
* 遇到死锁怎么办，添加事务日志
	* 原因：多个线程，同一个资源、不同方向同时加锁
	* 处理：碰撞检测、等锁超时

### 5、事务的ACID

[参见](https://tech.meituan.com/innodb-lock.html)

#### （1）原子性（事务要么同时成功，要么同时失败）

使用undo日志

#### （2）一致性

加锁，体现在约束

#### （3）隔离性

以性能为理由，对一致性的破坏，以下一致性保证逐步降低
隔离级别：

* `READ UNCIMMITTED（读未提交）`：写事务阻止其他写事务，避免了更新遗失。但是没有阻止其他读事务。 可以读到别的事务没有提交的数据（脏读），避免了更新遗失
* `READ COMMITTED（读已提交）`：写事务会阻止其他读写事务。读事务不会阻止其他任何事务。会出现不可重复读
	* 例子：`A事务开始 -> 第一次读 -> B事务开始 -> 修改 -> B事务结束 -> 第二次读 -> A事务结束`，可能出现两次读（同一事务）的数据不一致
* `REPEATABLE READ（可重复读）`（Mysql默认）：读事务会阻止其他写事务（包括update和delete，不包括insert），但是不会阻止其他读事务。会出现幻读
	* 例子：`A事务开始 -> 第一次统计数目 -> B事务开始 -> 插入新数据 -> B事务结束 -> 第二次统计数目 -> A事务结束`，可能出现两次统计的数目不一致
	* **注意：**在innodb中，使用间隙锁是解决了幻读的了
* `SERIALIZABLE（可串行化）`：强制事务串行执行（注意是串行），性能较低

* 隔离性扩展（快照读、多版本控制、copy on write）
* 读写并行
* 写读并行

[参考](https://www.zhihu.com/question/23242151)

**READ UNCIMMITTED**

在另外的事务在做update的时候，插入完成就立刻释放锁，而不等到commit。当前事务是可以读到未提交的数据

**READ COMMITTED**

在另外的事务在做update的时候，插入完成，等到commit之后释放锁。如何实现，使用MVCC。
（在InnoDB中，会加行所，但是不会加间隙锁）

**REPEATABLE READ**

使用MVCC，第一次读的是最新版本，第二次读读到的是旧版本

**在REPEATABLE READ的隔离级别上仍然可能出现更新丢失**

[参见](https://blog.csdn.net/xiangyubobo/article/details/52265784)

第二类更新丢失（select - update情况）

|序号| A 事务| B事务|
|--|------|------|
|1| start||
|2| |start|
|3|select||
|4| |update|
|5| |commit|
|6|根据select update ||
|7|commit| |

结果B的update丢失了。

解决方案：

* `select for update`
* `select for lock in share`
* 乐观锁（update 加 where条件）

**MySql的四种隔离级别都不会出现第一类更新丢失（回滚丢失）**

#### （4）持久性

提交成功后，将数据固化到数据库

数据丢失情况：

* 磁盘损坏
* 内存数据丢失

### 5、事务的调优原则

* 减少锁的覆盖范围
* 增加锁上可并行的线程数
* 选择正确的锁类型
	* 悲观锁（资源争抢严重）
	* 乐观锁（资源争抢不严重）

### 6、Mysql中的各种锁

按照锁的粒度来分：

#### （1）行锁

锁定sql语句选中的行

**原理**

对索引加锁，所以会出现一下问题

* 只有使用索引才能使用行锁
* 可能锁的范围大于记录的范围（比如所有两个查询条件，第一个是索引，第二个不是索引，满足条件1的都加锁）

**何时触发**

只有通过索引条件检索数据，InnoDB才使用行级锁，否则，InnoDB将使用表锁！

#### （2）页锁

对一页加锁

#### （3）表锁

锁定整个表

**何时触发**

查询没有使用索引

按照功能来分：

#### （4）共享锁

**特性**

又称S锁，读锁；允许多个事务持有
不允许加排他锁

**何时会触发**

select ... lock in share mode

#### （5）排他锁

**特性**

又称X锁，写锁；仅允许1个事务持有该锁，别的事务无法对他进行读写任何操作

**何时会触发**

update,delete,insert
select ...for update

按照面对竞争的态度来分：

#### （6）悲观锁

略

#### （7）乐观锁

略

其他锁：

#### （8）间隙锁

对范围查询，所有的范围都加锁，即使没有数据，防止出现幻读

### 7、MVCC

#### （0）InnoDB的MVCC实现机制

InnoDB的MVCC，通过在每行记录后面保存两个隐藏的列来实现：一个保存了行的创建时间，一个保存行的过期时间（删除时间），当然，这里的时间并不是时间戳，而是系统版本号，每开始一个新的事务，系统版本号就会递增。在RR隔离级别下，MVCC的操作如下：

* select操作。
	* a. InnoDB只查找版本早于（包含等于）当前事务版本的数据行。可以确保事务读取的行，要么是事务开始前就已存在，或者事务自身插入或修改的记录。
	* b. 行的删除版本要么未定义，要么大于当前事务版本号。可以确保事务读取的行，在事务开始之前未删除。
* insert操作。将新插入的行保存当前版本号为行版本号。
* delete操作。将删除的行保存当前版本号为删除标识。
* update操作。变为insert和delete操作的组合，insert的行保存当前版本号为行版本号，delete则保存当前版本号到原来的行作为删除标识。

由于旧数据并不真正的删除，所以必须对这些数据进行清理，innodb会开启一个后台线程执行清理工作，具体的规则是将删除版本号小于当前系统版本的行删除，这个过程叫做purge。

#### （1）快照读

读取的是记录的可见版本 (有可能是历史版本)，不用加锁，例如 `select * from table where ?;`

#### （2）当前读

读取的是记录的最新版本，并且，当前读返回的记录，都会加上锁，保证其他事务不会再并发修改这条记录

* `select * from table where ? lock in share mode;` – 简单理解，相当于加了S锁
* `select * from table where ? for update;` – 简单理解，相当于加了X锁
* `insert into table values (…);`
* `update table set ? where ?;`
* `delete from table where ?;`

### 8、事务控制及锁相关语句

#### （1）LOCK TABLE 和 UNLOCK TABLE

例子

```sql
lock table table_name read; #给table_name加上读锁，其他事务可以查询、不能修改
```

#### （2）事务控制

默认情况下Mysql是默认自动提交的。

**设置是否自动提交**

* `SET AUTOCOMMIT=0` 禁用自动提交

**开始一个事务**

* `start transaction;` 如果在锁表期间,用 start transaction 命令开始一个新事务,会造成一个隐含的 unlocktables 被执行
* `begin`

**提交或则回滚一个事务**

* `COMMIT` 提交
* `ROLLBACK` 回滚
* `COMMIT AND CHAIN` 提交后自动开启下一个事务

**设置保存点**

* `savepoint test;`创建一个名为test的保存点
* `rollback to savepoint test;` 回滚到test保存点

## 开发技巧

### 1、join连接技巧

#### （1）更新使用过滤条件中包含自身的表

```sql
update user a join(
	select ...
) b on ...
set a.name="xxx";
```

#### （2）join优化子查询

> 见 数据库优化 2 (1)

#### （3）join优化聚合查询

#### （4）实现分组选择聚合

## 日志文件

### 1、错误日志

错误日志文件包含了当mysqld启动和停止时，以及服务器在运行过程中发生任何严重错误时的相关信息。

如果mysqld莫名其妙地死掉并且需要mysqld_safe重新启动它，那么mysqld_safe在错误日志中写入一条restarted mysqld消息。如果mysqld注意到需要自动检查或着修复一个表，则错误日志中将写入这条消息。

在一些操作系统中，如果mysqld死掉，错误日志会包含堆栈跟踪信息。跟踪信息可以用来确定mysqld死掉的地方。

可以用--log-error[=file_name]选项来指定mysqld保存错误日志文件的位置。如果没有给定file_name值，mysqld会在数据目录中使用日志名host_name.err 写入日志文件，如果你执行FLUSH LOGS，日志会使用-old重新命名后缀并且mysqld创建一个新的空日志文件。(如果未给出--log-error选项，则不会重新命名）。

如果不指定--log-error，或者(在Windows中)如果你使用--console选项，错误被写入标准错误输出stderr。通常标准输出为你的终端。

在Windows中，如果未给出--console选项，错误输出总是写入.err文件。

### 2、通用查询日志

如果你想要知道mysqld内部发生了什么，你应该用--log[=file_name]或-l [file_name]选项启动服务器。如果没有给定file_name的值， 默认名是host_name.log。所有连接和语句都会被记录到日志文件。当你怀疑在客户端发生了错误并想确切地知道该客户端发送给mysqld的语句时，该日志可能非常有用。 mysqld按照它接收的语句顺序记录查询日志，这可能与执行的顺序不同。这与更新日志和二进制日志不同，它们在执行后但是是在任何一个锁释放之前记录日志。(查询日志还包含所有语句，而二进制日志不包含只查询数据的语句）。

服务器重新启动和日志刷新不会产生新的通用查询日志文件(尽管刷新会关闭并重新打开一般查询日志文件)。在Unix中，你可以通过下面的命令重新命名文件并创建一个新的日志文件：

```bash
shell> mv hostname.log hostname-old.log
shell> mysqladmin flush-logs
shell> cp hostname-old.log to-backup-directory
shell> rm hostname-old.log
```

在Windows中，服务器打开日志文件期间你不能重新命名日志文件，你必须先停止服务器然后重新命名日志文件，然后重启服务器来创建新的日志文件。

### 3、二进制日志

二进制日志以一种更有效的格式，并且是事务安全的方式包含更新日志中可用的所有信息。

二进制日志包含了所有更新了数据或者已经潜在更新了数据（例如，没有匹配任何行的一个DELETE）的所有语句。语句以“事件”的形式保存，它描述数据更改。

注释：二进制日志已经代替了老的更新日志，更新日志在MySQL 5.1中不再使用。

二进制日志还包含关于每个更新数据库的语句的执行时间信息。它不包含没有修改任何数据的语句。如果你想要记录所有语句（例如，为了识别有问题的查询），你应使用一般查询日志。

二进制日志的主要目的是在恢复使能够最大可能地更新数据库，因为二进制日志包含备份后进行的所有更新。

二进制日志还用于在主复制服务器上记录所有将发送给从服务器的语句。

运行服务器时若启用二进制日志则性能大约慢1%。但是，二进制日志的好处即用于恢复并允许设置复制超过了这个小小的性能损失。

当用--log-bin[=file_name]选项启动服务器时，mysqld写入包含所有更新数据的SQL命令的日志文件。如果未给出file_name值， 默认名为-bin后面所跟的主机名。如果给出了文件名，但没有包含路径，则文件被写入数据目录。

如果你在日志名中提供了扩展名(例如，--log-bin=file_name.extension)，则扩展名被悄悄除掉并忽略。

mysqld在每个二进制日志名后面添加一个数字扩展名。每次你启动服务器或刷新日志时该数字则增加。如果当前的日志大小达到max_binlog_size时，还会自动创建新的二进制日志。如果你正使用大的事务，二进制日志大小还会超过max_binlog_size。（事务要全写入一个二进制日志中，绝对不要写入不同的二进制日志中。）

为了能够知道还使用了哪个不同的二进制日志文件，mysqld还创建一个二进制日志索引文件，包含所有使用的二进制日志文件的文件名。默认情况下与二进制日志文件的文件名相同，扩展名为'.index'。你可以用--log-bin-index[=file_name]选项更改二进制日志索引文件的文件名。当mysqld在运行时，不应手动编辑该文件；如果这样做将会使mysqld变得混乱。

可以用RESET MASTER语句删除所有二进制日志文件，或用PURGE MASTER LOGS只删除部分二进制文件。

二进制日志格式有一些已知限制，会影响从备份恢复。

可以使用下面的mysqld选项来影响记录到二进制日志内的内容：

* --binlog-do-db=db_name

 告诉主服务器，如果当前的数据库(即USE选定的数据库)是db_name，应将更新记录到二进制日志中。其它所有没有明显指定的数据库 被忽略。如果使用该选项，你应确保只对当前的数据库进行更新。

 对于CREATE DATABASE、ALTER DATABASE和DROP DATABASE语句，有一个例外，即通过操作的数据库来决定是否应记录语句，而不是用当前的数据库。

 一个不能按照期望执行的例子：如果用binlog-do-db=sales启动服务器，并且执行USE prices; UPDATE sales.january SET amount=amount+1000；，该语句不写入二进制日志。

* --binlog-ignore-db=db_name

 告诉主服务器，如果当前的数据库(即USE选定的数据库)是db_name，不应将更新保存到二进制日志中。如果你使用该选项，你应确保只对当前的数据库进行更新。

 一个不能按照你期望的执行的例子：如果服务器用binlog-ignore-db=sales选项启动，并且执行USE prices; UPDATE sales.january SET amount=amount+1000；，该语句不被写入二进制日志。

 类似于--binlog-do-db，对于CREATE DATABASE、ALTER DATABASE和DROP DATABASE语句，有一个例外，即通过操作的数据库来决定是否应记录语句，而不是用当前的数据库。

要想记录或忽视多个数据库，可以在启动服务器的时候使用多个选项，为每个数据库指定相应的选项。

服务器根据下面的规则对选项进行评估，以便将更新记录到二进制日志中或忽视。请注意对于CREATE/ALTER/DROP DATABASE语句有一个例外。在这些情况下，根据以下列出的不同情况，所创建、修改或删除的数据库将代替当前的数据库。

* 是否有binlog-do-db或binlog-ignore-db规则?

 没有：将语句写入二进制日志并退出。

 有：执行下一步。

* 有一些规则(binlog-do-db或binlog-ignore-db或二者都有)。当前有一个数据库(是否使用USE语句选择了数据库？)?

 没有：不要写入语句，并退出。

 有：执行下一步。

* 有一些binlog-ignore-db规则。当前的数据库是否匹配binlog-ignore-db规则?

 有：不要写入语句，并退出。

 没有：写入查询并退出。

例如，只用binlog-do-db=sales运行的服务器只将当前数据库为sales的语句写入二进制日志(换句话说，binlog-do-db有时可以表示“忽视其它数据库”)。

如果你正进行复制，应确保没有子服务器在使用旧的二进制日志文件时，方可删除它们。一种方法是每天一次执行mysqladmin flush-logs并删除三天前的所有日志。可以手动删除，或最好使用PURGE MASTER LOGS语句删除日志。

具有SUPER权限的客户端可以通过SET SQL_LOG_BIN=0语句禁止将自己的语句记入二进制记录。

你可以用mysqlbinlog实用工具检查二进制日志文件。如果你想要重新处理日志止的语句，这很有用。例如，可以从二进制日志更新MySQL服务器，方法如下：

```bash
shell> mysqlbinlog log-file | mysql -h server_name
```

如果你正使用事务，必须使用MySQL二进制日志进行备份，而不能使用旧的更新日志。

查询结束后、锁定被释放前或提交完成后则立即记入二进制日志。这样可以确保按执行顺序记入日志。

对非事务表的更新执行完毕后立即保存到二进制日志中。对于事务表，例如BDB或InnoDB表，所有更改表的更新(UPDATE、DELETE或INSERT)都会 被缓存起来，直到服务器接收到COMMIT语句。在执行完COMMIT之前，mysqld将整个事务写入二进制日志。当处理事务的线程启动时，它为缓冲查询分配binlog_cache_size大小的内存。如果语句大于该值，线程则打开临时文件来保存事务。线程结束后临时文件被删除。

Binlog_cache_use状态变量显示了使用该缓冲区(也可能是临时文件)保存语句的事务的数量。Binlog_cache_disk_use状态变量显示了这些事务中实际上有多少必须使用临时文件。这两个变量可以用于将binlog_cache_size调节到足够大的值，以避免使用临时文件。

max_binlog_cache_size(默认4GB)可以用来限制用来缓存多语句事务的缓冲区总大小。如果某个事务大于该值，将会失败并回滚。

如果你正使用更新日志或二进制日志，当使用CREATE ... SELECT or INSERT ... SELECT时，并行插入被转换为普通插入。这样通过在备份时使用日志可以确保重新创建表的备份。

默认情况下，并不是每次写入时都将二进制日志与硬盘同步。因此如果操作系统或机器(不仅仅是MySQL服务器)崩溃，有可能二进制日志中最后的语句丢失了。要想防止这种情况，你可以使用sync_binlog全局变量(设置该变量值为1是最安全的值，但也是最慢的)，使二进制日志在每N次二进制日志写入后与硬盘同步。

该选项可以提供更大程度的安全，还应对MySQL服务器进行配置，使每个事务的二进制日志(sync_binlog =1)和(默认情况为真)InnoDB日志与硬盘同步。该选项的效果是崩溃后重启时，在滚回事务后，MySQL服务器从二进制日志剪切 回滚的InnoDB事务。这样可以确保二进制日志反馈InnoDB表的确切数据等，并使从服务器保持与主服务器保持同步(不接收回滚的语句)。

请注意即使MySQL服务器更新其它存储引擎而不是InnoDB，也可以使用--innodb-safe-binlog选项启动服务。在InnoDB崩溃恢复时，只能从二进制日志中删除影响InnoDB表的语句或事务。如果崩溃恢复时MySQL服务器发现二进制日志变短了(即至少缺少一个成功提交的InnoDB事务)，如果sync_binlog =1并且硬盘或文件系统的确能根据需要进行同步(有些不需要)则不会发生，则输出错误消息 ("二进制日志<名>比期望的要小")。在这种情况下，二进制日志不准确，复制应从主服务器的数据快照开始。

写入二进制日志文件和二进制日志索引文件的方法与写入MyISAM表的相同。

### 4、慢速查询日志

用--log-slow-queries[=file_name]选项启动服务时，mysqld会写入一个包含所有执行时间超过long_query_time秒的SQL语句的日志文件。其中，获得初使表锁定的时间不算作执行时间。

如果没有给出file_name值，默认为主机名，后缀为-slow.log。如果给出了文件名，但不是绝对路径名，文件则写入数据目录。

语句执行完并且所有锁释放后记入慢查询日志。记录顺序可以与执行顺序不相同。

慢查询日志可以用来找到执行时间长的查询，可以用于优化。但是，检查又长又慢的查询日志会很困难。要想容易些，你可以使用mysqldumpslow命令获得日志中显示的查询摘要来处理慢查询日志。

在MySQL 5.1的慢查询日志中，不使用索引的慢查询同使用索引的查询一样记录。要想防止不使用索引的慢查询记入慢查询日志，使用--log-short-format选项。

在MySQL 5.1中,通过--log-slow-admin-statements服务器选项，你可以请求将慢管理语句，例如将OPTIMIZE TABLE、ANALYZE TABLE和ALTER TABLE语句写入慢查询日志。

用查询缓存处理的查询不加到慢查询日志中，因为表有零行或一行而不能从索引中受益的查询也不写入慢查询日志。

### 5、日志文件维护

MySQL服务器可以创建各种不同的日志文件，从而可以很容易地看见所进行的操作。

当启用日志使用MySQL时，你可能想要不时地备份并删除旧的日志文件，并告诉MySQL开始记入新文件。

在 Linux (Redhat)的安装上，你可为此使用mysql-log-rotate脚本。如果你在RPM上分发安装MySQL，脚本应该已经自动被安装。

在其它系统上，你必须自己安装短脚本，你可从镜像网站获得处理日志文件。

你可以通过mysqladmin flush-logs或SQL语句FLUSH LOGS来强制MySQL开始使用新的日志文件。

日志清空操作主要完成下列事情：

* 如果使用标准日志(--log)或慢查询日志(--log-slow-queries)，关闭并重新打开日志文件。(默认为mysql.log和`hostname-slow.log`)。
* 如果使用更新日志(--log-update)或二进制日志(--log-bin)，关闭日志并且打开有更高序列号的新日志文件。
* 如果你只使用更新日志，你只需要重新命名日志文件，然后在备份前清空日志。例如，你可以这样做：

```bash
 shell> cd mysql-data-directory
 shell> mv mysql.log mysql.old
 shell> mysqladmin flush-logs
```

然后备份并删除“mysql.old”。

## 存储引擎

***

### 1、MyISAM

MyISAM 不支持事务、也不支持外键,其优势是访问的速度快,对事务完整性没有要求或者以 SELECT、INSERT 为主的应用基本上都可以使用这个引擎来创建表。

### 2、InnoDB

提供事务功能

### 3、MEMORY

MEMORY 存储引擎使用存在内存中的内容来创建表。每个 MEMORY 表只实际对应一个磁盘文件,格式是.frm。MEMORY 类型的表访问非常得快,因为它的数据是放在内存中的,并且默认使用 HASH 索引,但是一旦服务关闭,表中的数据就会丢失掉。

### 4、如何选择存储引擎

* MyISAM:默认的 MySQL 插件式存储引擎。如果应用是以读操作和插入操作为主,只有很少的更新和删除操作,并且对事务的完整性、并发性要求不是很高,那么选择这个存储引擎是非常适合的。MyISAM 是在 Web、数据仓储和其他应用环境下最常使用的存储引擎之一。
* InnoDB:用于事务处理应用程序,支持外键。如果应用对事务的完整性有比较高的要求,在并发条件下要求数据的一致性,数据操作除了插入和查询以外,还包括很多的更新、删除操作,那么 InnoDB 存储引擎应该是比较合适的选择。InnoDB 存储引擎除了有效地降低由于删除和更新导致的锁定,还可以确保事务的完整提交(Commit)和回滚(Rollback),对于类似计费系统或者财务系统等对数据准确性要求比较高的系统,InnoDB 都是合适的选择。
* MEMORY:将所有数据保存在 RAM 中,在需要快速定位记录和其他类似数据的环境下,可提供极快的访问。MEMORY 的缺陷是对表的大小有限制,太大的表无法 CACHE 在内存中,其次是要确保表的数据可以恢复,数据库异常终止后表中的数据是可以恢复的。MEMORY 表通常用于更新不太频繁的小表,用以快速得到访问结果。

## 字符集

***

### 1、如何选择字符集

* 定长编码处理速度由于边长编码（适用于大量字符运算）
* 对于中文为主的情况优先使用GBK
* GBK完全兼容GB2312
* 整个系统使用统一的字符编码，避免编码转换损失
* 英文为主的内容优先使用UTF-8

### 2、查看MySql支持的字符集

`show character set;`

## 索引

***

### 0、一般概念

#### （1）聚集索引

数据的物理存储顺序和索引表明的顺序一致的索引，每张表只允许1个。
在Mysql中为主键索引

#### （2）非聚集索引

索引为单独的结构，与物理存储位置无关

* 普通索引
* 唯一索引
* 主键索引
* 组合索引
* 全文索引

### 1、索引的作用

* 主要用于提高提高查询效率

### 2、MySql索引的实现方式

* BTree（一般存储引擎）
* Hash（Memory存储引擎）

### 3、设计索引的原则

* 搜索的索引列
* 使用惟一索引
* 使用短索引
* 利用最左前缀：在创建一个 n 列的索引时,实际是创建了 MySQL 可利用的 n 个索引。多列索引可起几个索引的作用,因为可利用索引中最左边的列集来匹配行。这样的列集称为最左前缀。
* 不要过度索引：索引会降低写入效率
* 对于 InnoDB 存储引擎的表,记录默认会按照一定的顺序保存,如果有明确定义的主键,则按照主键顺序保存。如果没有主键,但是有唯一索引,那么就是按照唯一索引的顺序保存。如果既没有主键又没有唯一索引,那么表中会自动生成一个内部列,按照这个列的顺序保存。

### 4、BTREE 索引与 HASH 索引

**Hash索引的局限性**

* 只用于使用=或<=>操作符的等式比较。
* 优化器不能使用 HASH 索引来加速 ORDER BY 操作。
* MySQL 不能确定在两个值之间大约有多少行。如果将一个 MyISAM 表改为 HASH 索引的 MEMORY 表,会影响一些查询的执行效率。
* 只能使用整个关键字来搜索一行。

**原因**：想一下HashMap和查找树的区别

### 5、全文索引

`FULLTEXT`

#### （1）创建

```sql
CREATE TABLE article (
                  id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
                  title VARCHAR(200),
                  body TEXT,
                  FULLTEXT(title, body)
              )

ALTER TABLE `student` ADD FULLTEXT INDEX ft_stu_name  (`name`)
```

#### （2）使用

```sql
SELECT * FROM `student` WHERE MATCH(`name`) AGAINST('聪')
SELECT * FROM `student` WHERE MATCH(`name`,`address`) AGAINST('聪 广东')
```

#### （3）其他

[参见](https://blog.csdn.net/u011734144/article/details/52817766)

## MyISAM与InnoDB

***

> 参考：
> [博客1](https://www.cnblogs.com/zlcxbb/p/5757245.html)
> [博客2](https://www.jianshu.com/p/a957b18ba40d)

两者都是MySql常用的存储引擎。主要阐述其区别

### 1、区别

#### （1）索引结构

* MyISAM索引文件与数据文件是分离的，索引文件仅保存数据记录的地址。
	* 使用B+Tree作为其主键索引的索引结构，叶节点的data域存放的是数据记录的地址
	* 辅助索引和主键索引结构一致，只是可能允许重复
* InnoDB的主索引文件与数据文件是一个文件，即：在InnoDB中，表数据文件本身就是按B+Tree组织的一个索引结构，这棵树的叶节点data域保存了完整的数据记录。索引的key是数据表的主键
	* InnoDB的所有辅助索引都引用主键作为data域（主键值）

#### （2）事务

* MyISAM不支持事务
* InnoDB支持事务

#### （3）表锁差异

* MyISAM 只支持表锁
* InnoDB 支持更多的锁类型

#### （4）全文索引

* MyISAM：支持 FULLTEXT类型的全文索引
* InnoDB：不支持FULLTEXT类型的全文索引，但是innodb可以使用sphinx插件支持全文索引，并且效果更好。

#### （5）外键

* MyISAM 不支持
* InnoDB 支持

### 2、如何选择

#### （1） 采用MyISAM引擎

* R/W > 100:1 且update相对较少
* 并发不高
* 表数据量小
* 硬件资源有限

#### （2）采用InnoDB引擎

* R/W比较小，频繁更新大字段
* 表数据量超过1000万，并发高
* 安全性和可用性要求高
