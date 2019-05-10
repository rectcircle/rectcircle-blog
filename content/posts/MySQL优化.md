---
title: MySQL优化
date: 2018-04-21T22:11:04+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/138
  - /detail/138/
tags:
  - sql
---

> 参考： 《深入浅出MySql》

### 1、优化 SQL 语句的一般步骤

#### （1）通过show status命令了解各种SQL查询效率

```sql
show [session|global] status #默认为session级别
```

查看语句执行次数

```sql
show status like 'Com_%';
```

Com_xxx 表示每个 xxx 语句执行的次数

#### （2）定位执行效率较低的SQL语句

开启慢查询日志

#### （3）通过 explain 分析低效 SQL 的执行计划

**例子：**

对于表结构如下

```
+--------+-------+---------+
| name   | score | subject |
+--------+-------+---------+
| 小明   |  65.0 | 数学    |
| 小明   |  90.0 | 英语    |
| 小华   |  40.0 | 数学    |
| 小华   |  70.0 | 英语    |
+--------+-------+---------+
```

查询所有成绩都及格的学生的姓名的两种方式：

```sql
# 子查询
select distinct name from Student where name not in (select name from Student where score<60);
# group by + having
select name from Student group by name having min(score) >= 60;
```

查看第一个sql语句的执行计划

```sql
explain select distinct name from Student where name not in (select name from Student where score<60) \G
```

输出如下

```
*************************** 1. row ***************************
           id: 1
  select_type: PRIMARY
        table: Student
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 4
     filtered: 100.00
        Extra: Using where; Using temporary
*************************** 2. row ***************************
           id: 2
  select_type: SUBQUERY
        table: Student
   partitions: NULL
         type: ALL
possible_keys: NULL
          key: NULL
      key_len: NULL
          ref: NULL
         rows: 4
     filtered: 33.33
        Extra: Using where
2 rows in set, 1 warning (0.00 sec)
```

**说明**

* select_type:表示 SELECT 的类型,常见的取值有：
	* SIMPLE(简单表,即不使用表连接或者子查询)
	* PRIMARY(主查询,即外层的查询)
	* UNION(UNION 中的第二个或者后面的查询语句)
	* SUBQUERY(子查询中的第一个 SELECT)等。
* table:查的是那张表
* **type（重要）**:表示表的连接类型,性能由好到差的连接类型为
	* system(表中仅有一行,即常量表)
	* const(单表中最多有一个匹配行,例如 primary key 或者 unique index)
	* eq_ref(对于前面的每一行,在此表中只查询一条记录,简单来说,就是多表连接中使用 primary key 或者 unique index)
	* ref(与 eq_ref 类似,区别在于不是使用 primary key 或者 unique index,而是使用普通的索引)
	* ref_or_null(与 ref 类似,区别在于条件中包含对 NULL 的查询)
	* index_merge(索引合并优化)、
	* unique_subquery(in的后面是一个查询主键字段的子查询)
	* index_subquery (与 unique_subquery 类似,区别在于 in 的后面是查询非唯一索引字段的子查询)
	* range (单表中的范围查询)
	* index (对于前面的每一行,都通过查询索引来得到数据)
	* all (对于前面的每一行,都通过全表扫描来得到数据)。
* possible_keys:表示查询时,可能使用的索引。
* key:表示实际使用的索引。
* key_len:索引字段的长度。
* ref:如果是使用的常数等值查询，这里会显示const，如果是连接查询，被驱动表的执行计划这里会显示驱动表的关联字段，如果是条件使用了表达式或者函数，或者条件列发生了内部隐式转换，这里可能显示为func
* rows:这里是执行计划中估算的扫描行数，不是精确值。
* filtered:返回结果的行占需要读到的行(rows列的值)的百分比，5.7之后的版本默认就有这个字段
* Extra:执行情况的说明和描述：这个列可以显示的信息非常多，有几十种，常用的有
	* A：distinct：在select部分使用了distinc关键字
	* B：no tables used：不带from字句的查询或者From dual查询
	* C：使用not in()形式子查询或not exists运算符的连接查询，这种叫做反连接。即，一般连接查询是先查询内表，再查询外表，反连接就是先查询外表，再查询内表。
	* D：using filesort：排序时无法使用到索引时，就会出现这个。常见于order by和group by语句中
	* E：using index：查询时不需要回表查询，直接通过索引就可以获取查询的数据。
	* F：using join buffer（block nested loop），using join buffer（batched key accss）：5.6.x之后的版本优化关联查询的BNL，BKA特性。主要是减少内表的循环数量以及比较顺序地扫描查询。
	* G：using sort_union，using_union，using intersect，using sort_intersection：
		* using intersect：表示使用and的各个索引的条件时，该信息表示是从处理结果获取交集
		* using union：表示使用or连接各个使用索引的条件时，该信息表示从处理结果获取并集
		* using sort_union和using sort_intersection：与前面两个对应的类似，只是他们是出现在用and和or查询信息量大时，先查询主键，然后进行排序合并后，才能读取记录并返回。
	* H：using temporary：表示使用了临时表存储中间结果。临时表可以是内存临时表和磁盘临时表，执行计划中看不出来，需要查看status变量，used_tmp_table，used_tmp_disk_table才能看出来。
	* I：using where：表示存储引擎返回的记录并不是所有的都满足查询条件，需要在server层进行过滤。查询条件中分为限制条件和检查条件，5.6之前，存储引擎只能根据限制条件扫描数据并返回，然后server层根据检查条件进行过滤再返回真正符合查询的数据。5.6.x之后支持ICP特性，可以把检查条件也下推到存储引擎层，不符合检查条件和限制条件的数据，直接不读取，这样就大大减少了存储引擎扫描的记录数量。extra列显示using index condition
	* J：firstmatch(tb_name)：5.6.x开始引入的优化子查询的新特性之一，常见于where字句含有in()类型的子查询。如果内表的数据量比较大，就可能出现这个
	* K：loosescan(m..n)：5.6.x之后引入的优化子查询的新特性之一，在in()类型的子查询中，子查询返回的可能有重复记录时，就可能出现这个
	* 除了这些之外，还有很多查询数据字典库，执行计划过程中就发现不可能存在结果的一些提示信息

#### （4）确定问题并采取相应的优化措施

* 创建索引

### 2、索引问题

* 查询要使用索引最主要的条件是查询条件中需要使用索引关键字
* 如果是多列索引,那么只有查询条件使用了多列关键字最左边的前缀时,才可以使用索引,否则将不能使用索引。
* 对于like查询，只有%号不在第一个字符才可能使用索引
* 对于大文本使用全文索引
* 注意对与长字符串使用索引，可以截取前n个字符做索引

#### （1）使用索引的情况

* 对于创建的多列索引,只要查询的条件中用到了最左边的列,索引一般就会被使用
* 对于使用 like 的查询,后面如果是常量并且只有%号不在第一个字符,索引才可能会被使用
* 如果对大的文本进行搜索,使用全文索引而不用使用 like ‘%...%’。
* 如果列名是索引,使用 column_name is null 将使用索引。如下例中查询 name 为 null的记录就用到了索引:

#### （2）存在索引但不使用索引

在下列情况下,虽然存在索引,但是 MySQL 并不会使：

* 如果 MySQL 估计使用索引比全表扫描更慢,则不使用索引。例如如果列key_part1 均匀分布在 1 和 100 之间,下列查询中使用索引就不是很好
* 如果使用 MEMORY/HEAP 表并且 where 条件中不使用“=”进行索引列,那么不会用到索引。heap 表只有在“=”的条件下才会使用索引。
* 用 or 分割开的条件,如果 or 前的条件中的列有索引,而后面的列中没有索引,那么涉及到的索引都不会被用到
* 如果不是符合索引列的第一部分
* 如果 like 是以%开始

#### （3）查看索引使用情况

`show status like 'Handler_read%';`

```
+-----------------------+-------+
| Variable_name         | Value |
+-----------------------+-------+
| Handler_read_first    | 20    |
| Handler_read_key      | 28    |
| Handler_read_last     | 0     |
| Handler_read_next     | 0     |
| Handler_read_prev     | 0     |
| Handler_read_rnd      | 1     |
| Handler_read_rnd_next | 133   |
+-----------------------+-------+
```

* 如果索引正在工作,Handler_read_key 的值将很高,这个值代表了一个行被索引值读的次数,很低的值表明增加索引得到的性能改善不高,因为索引并不经常使用。
* Handler_read_rnd_next 的值高则意味着查询运行低效,并且应该建立索引补救。这个值的含义是在数据文件中读下一行的请求数。如果正进行大量的表扫描,Handler_read_rnd_next 的值较高,则通常说明表索引不正确或写入的查询没有利用索引

### 3、常用的SQL优化

#### （1）大批量导入数据

针对MyISAM引擎

```sql
ALTER TABLE tbl_name DISABLE KEYS;
loading the data
ALTER TABLE tbl_name ENABLE KEYS;
```

针对InnoDB引擎

* 将导入的数据按照主键的顺序排列
* 在导入数据前执行 SET UNIQUE_CHECKS=0,关闭唯一性校验,在导入结束后执行SET UNIQUE_CHECKS=1,恢复唯一性校验,可以提高导入的效率。
* 如果应用使用自动提交的方式,建议在导入前执行 SET AUTOCOMMIT=0,关闭自动提交,导入结束后再执行 SET AUTOCOMMIT=1,打开自动提交,也可以提高导入的效率。

#### （2）优化Insert语句

* 使用多值插入
* 使用`INSERT DELAYED`
* 将索引文件和数据文件分在不同的磁盘上存放(利用建表中的选项);
* 如果进行批量插入,可以增加 bulk_insert_buffer_size 变量值的方法来提高速度,但是,这只能对 MyISAM 表使用;
* 当从一个文本文件装载一个表时,使用 LOAD DATA INFILE。这通常比使用很多 INSERT 语句快 20 倍。

#### （3）优化 GROUP BY 语句

* 默认情况下,MySQL 对所有 GROUP BY col1,col2....的字段进行排序。想要避免排序结果的消耗,则可以指定 ORDER BY NULL禁止排序

#### （4）优化 ORDER BY 语句

尽量按索引列排序

#### （5）优化嵌套查询

某些情况下使用Join代替

#### （6）使用OR

对于含有 OR 的查询子句,如果要利用索引,则 OR 之间的每个条件列都必须用到索引（原理：分别查询再使用union）

#### （7）使用 SQL 提示

* USE INDEX
* IGNORE INDEX
* FORCE INDEX

### 4、优化数据库对象

#### （1）优化表的数据类型

* 使用`PROCEDURE ANALYSE()`进行分析

```sql
SELECT * FROM tbl_name PROCEDURE ANALYSE();
SELECT * FROM tbl_name PROCEDURE ANALYSE(16,256);
```

#### （2）通过拆分提高表的访问效率

**垂直拆分**

列拆分，适用于一张表中部分列常用、部分列不常用。
缺点：需要冗余字段（主键），全量查询需要使用join

**水平拆分**

在一下几种情况下使用

* 表很大,分割后可以降低在查询时需要读的数据和索引的页数,同时也降低了索引的层数,提高查询速度。
* 表中的数据本来就有独立性,例如,表中分别记录各个地区的数据或不同时期的数据,特别是有些数据常用,而另外一些数据不常用。
* 需要把数据存放到多个介质上。

水平拆分会给应用增加复杂度,它通常在查询时需要多个表名,查询所有数据需要 UNION 操作。在许多数据库应用中,这种复杂性会超过它带来的优点,因为只要索引关键字不大,则在索引用于查询时,表中增加 2 至 3 倍数据量,查询时也就增加读一个索引层的磁盘次数,所以水平拆分要考虑数据量的增长速度,根据实际情况决定是否需要对表进行水平拆分。

#### （3）逆规范化

范式化带来的是更多的关系，更多的表连接，更低的效率

常用的反规范技术：

* 增加冗余列:指在多个表中具有相同的列,它常用来在查询时避免连接操作。
* 增加派生列:指增加的列来自其他表中的数据,由其他表中的数据经过计算生成。增加的派生列其作用是在查询时减少连接操作,避免使用集函数。
* 重新组表:指如果许多用户需要查看两个表连接出来的结果数据,则把这两个表重新组成一个表来减少连接而提高性能。
* 分割表

另外,逆规范技术需要维护数据的完整性。无论使用何种反规范技术,都需要一定的管理来维护数据的完整性,常用的方法是批处理维护、应用逻辑和触发器。

#### （4）使用中间表提高统计查询速度

主要针对统计任务
