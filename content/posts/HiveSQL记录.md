---
title: "HiveSQL记录"
date: 2019-07-09T14:41:14+08:00
draft: false
toc: true
comments: true
tags:
  - 大数据
  - sql
---

> 《Hive编程指南》

## 一、基本知识

### 0、基本操作

#### （1）Hive命令

查看帮助

```bash
hive --help
```

查看版本

```bash
hive --version
```

全部服务

```bash
hive --[cli beeline help hiveburninclient hiveserver2 hiveserver hwi jar lineage metastore metatool orcfiledump rcfilecat schemaTool version]
```

查看各个服务的帮助

```bash
hive --help --service cli
```

#### （2）Hive变量

启动定义变量

```
hive
  --define key=value 指定变量, 使用`hivevar:key`访问变量 参见
  --hivevar key=value 指定变量, 使用`hivevar:key`访问变量
```

以键值对形式展现，key包含名字空间和名字以`:`隔开

内置的名字空间：

* hivevar
  * 读写
  * 通过--define或者--hivevar定义，前缀可省略
* hiveconf
  * 读写
* system
  * 读写
* env
  * 只读
  * 如`set env:HOME`

可以使用`${key}`的方式进行替换

```bash
hive --define test=test

set test;
set hivevar:test;
select '${test}';
```

在cli中定义变量

```sql
set test1=1;
set test1; -- 输出1
set hivevar:test1; -- 显示未定义

set hivevar:test2=1;
set test2; -- 输出1
set hivevar:test2; -- 输出1
```

查看变量

```sql
set; -- 打印全部变量
set -v; -- 打印全部变量（包含hadoop变量）
```

#### （3）一次性使用hive命令

```bash
hive -e "select 1;" # 一次性执行命令输出到控制台（包括日志和结果）
hive -S -e "select 1;" > test.txt # 一次性执行命令输出到控制台（只输出结果到标准输出，错误到标准出错），所以可保存到文件
cat test.txt
hive -S -e "set;" | grep warehouse # 查看配置
```

#### （4）从文件中执行Hive查询

```bash
hive -f /path/to/file/sql.hql
# 或者
hive
hive> source /path/to/file/sql.hql;
```

#### （5）hiverc文件

默认执行 `~/.hiverc`。或者通过 `hive -i` 指定

#### （6）执行Bash命令或Hadoop命令

```sql
! echo 'test';
dfs -ls /;
```

### 1、HiveSQL数据类型

#### （1）基本数据类型

* 整型
  * TINYINT - 微整型，只占用1个字节，只能存储0-255的整数。
  * SMALLINT - 小整型，占用2个字节，存储范围–32768 到 32767。
  * INT - 整型，占用4个字节，存储范围-2147483648到2147483647。
  * BIGINT - 长整型，占用8个字节，存储范围-2^63到2^63-1。
* 布尔型
  * BOOLEAN - TRUE/FALSE
* 浮点型
  * FLOAT - 单精度浮点数。
  * DOUBLE - 双精度浮点数。
* 字符串型
  * STRING - 不设定长度。
* [时间日期类型](https://www.jianshu.com/p/e18a7fd2de5c)
  * String - 格式为 `yyyy-MM-dd` 或者 `yyyy-MM-dd hh:mm:ss`
  * Date - 格式为 `yyyy-MM-dd`
  * Timestamp - 格式为 `yyyy-MM-dd hh:mm:ss`
  * 比较
    * 日期级别：是可以直接比较的，但是Date和Timestamp之间需要强转 `a_table join b_table on (a_table.timestamp_column = cast(b_table.date_column as timestamp));`
    * 时间级别：String 与 Timestamp 表达的时间相同时是可以直接比较的，Date 不能表示带时分秒的信息。
  * 插入
    * String -> String： 原样
    * String -> Date：仅包含日期
    * String -> Timestamp：补上时分秒

#### （2）复杂数据类型

* Structs：一组由任意数据类型组成的结构。比如，定义一个字段C的类型为STRUCT {a INT; b STRING}，则可以使用a和C.b来获取其中的元素值；
* Maps：和Java中的Map相同，即存储K-V对的；
* Arrays：数组；

例子

```sql
CREATE TABLE complex(
  col1 ARRAY<INT>,
  col2 MAP<STRING, INT>,
  col3 STRUCT<a:STRING, b:INT, c:DOUBLE>
)
```

### 2、Hive的严格模式

推荐开启

查看当前模式： `hive> set hive.mapred.mode;`

严格模式会：

* 对分区表的查询必须使用到分区相关的字段
* order by必须带limit
* 禁止笛卡尔积查询：join必须有on连接

### 3、NULL值处理

* NULL与任何值做运算结果都为NULL
* 判断是否是NULL：`field is NULL`

### 4、DDL语法

https://cwiki.apache.org/confluence/display/Hive/LanguageManual+DDL

https://www.cnblogs.com/fanzhenyong/p/9746796.html

#### （1）数据库

```sql
-- 创建
-- CREATE (DATABASE|SCHEMA) [IF NOT EXISTS] database_name
--   [COMMENT database_comment]
--   [LOCATION hdfs_path]
--   [WITH DBPROPERTIES (property_name=property_value, ...)];
create database if not exists `database_name`; -- 默认创建在 set hive.metastore.warehouse.dir;
create database `database_name` location '/path'; -- 指定数据库文件存放位置
create database `database_name` commit '描述'; -- 添加注释
create database `database_name` with dbproperties('creator'='rectcircle'); -- 添加附加信息

-- 查询数据库列表
show databases;
show databases like 'ori.*';
-- show databases rlike 'mu.*';

-- 使用某个数据库
use `database_name`;

-- 删除
-- DROP (DATABASE|SCHEMA) [IF EXISTS] database_name [RESTRICT|CASCADE];
drop database if exists `database_name`; -- 不允许删除包含包含表的库
drop database if exists `database_name` cascade; -- 先删除数据库中的表

-- 修改
alter database `database_name` set dbproperties('editor-by'='rectcircle', 'comment'='xxx')
-- ALTER (DATABASE|SCHEMA) database_name SET DBPROPERTIES (property_name=property_value, ...);   -- (Note: SCHEMA added in Hive 0.14.0)
-- ALTER (DATABASE|SCHEMA) database_name SET OWNER [USER|ROLE] user_or_role;   -- (Note: Hive 0.13.0 and later; SCHEMA added in Hive 0.14.0)
-- ALTER (DATABASE|SCHEMA) database_name SET LOCATION hdfs_path; -- (Note: Hive 2.2.1, 2.4.0 and later)
```

* 以上`database`关键字都可以由`schema`替换

#### （2）表

```sql
-- 创建
create [temporary] [external] table [if not exists] [db_name.]table_name -- (Note: TEMPORARY available in Hive 0.14.0 and later)
  [(col_name data_type [COMMENT col_comment], ... [constraint_specification])] -- 字段声明
  [COMMENT table_comment] -- 表注释
  [PARTITIONED BY (col_name data_type [COMMENT col_comment], ...)] -- 分区字段
  [CLUSTERED BY (col_name, col_name, ...) [SORTED BY (col_name [ASC|DESC], ...)] INTO num_buckets BUCKETS] -- 分桶
  [SKEWED BY (col_name, col_name, ...) ON ((col_value, col_value, ...), (col_value, col_value, ...), ...) [STORED AS DIRECTORIES] -- (Note: Available in Hive 0.10.0 and later)] 倾斜
  [
   [ROW FORMAT row_format]
   [STORED AS file_format]
     | STORED BY 'storage.handler.class.name' [WITH SERDEPROPERTIES (...)]  -- (Note: Available in Hive 0.6.0 and later)
  ] -- 存储格式
  [LOCATION hdfs_path] -- 存储路径
  [TBLPROPERTIES (property_name=property_value, ...)]   -- (Note: Available in Hive 0.6.0 and later) 附加信息
  [AS select_statement];   -- (Note: Available in Hive 0.5.0 and later; not supported for external tables) 使用查询信息填充表

CREATE [TEMPORARY] [EXTERNAL] TABLE [IF NOT EXISTS] [db_name.]table_name -- 通过拷贝的方式创建
  LIKE existing_table_or_view_name
  [LOCATION hdfs_path];

file_format:
  : SEQUENCEFILE
  | TEXTFILE    -- (Default, depending on hive.default.fileformat configuration)
  | RCFILE
  | ORC
  | PARQUET
  | AVRO
  | JSONFILE    -- (Note: Available in Hive 4.0.0 and later)
  | INPUTFORMAT input_format_classname OUTPUTFORMAT output_format_classname

constraint_specification:
  : [, PRIMARY KEY (col_name, ...) DISABLE NOVALIDATE ]
    [, CONSTRAINT constraint_name FOREIGN KEY (col_name, ...) REFERENCES table_name(col_name, ...) DISABLE NOVALIDATE
```

* temporary 临时表：仅对当前session有效，session结束后自动删除
* PARTITIONED BY 用于指定分区字段（将数据以目录层级结构存储）
* external 外部表，不声明则表示为内部表
  * 内部表LOAD数据时，会将数据移动到数据仓库指向的路径。外部表不会
  * 内部表删除时，同时删除数据。外部表仅删除元数据
* TBLPROPERTIES包含其他属性，其中 last_modified_user和last_modified_time 由hive管理，其他预定义属性：
  * TBLPROPERTIES ("comment"="table_comment")
  * TBLPROPERTIES ("hbase.table.name"="table_name") – 见集成HBASE.
  * TBLPROPERTIES ("immutable"="true") 或("immutable"="false")– 见通过查询查插入数据到Hive表.
  * TBLPROPERTIES ("orc.compress"="ZLIB") 或("orc.compress"="SNAPPY") 或 ("orc.compress"="NONE") 和其他ORC属性– 见ORC文件.
  * TBLPROPERTIES ("transactional"="true")或 ("transactional"="false")– 见Hive事务.
  * TBLPROPERTIES ("NO\_AUTO\_COMPACTION"="true") 或 ("NO\_AUTO\_COMPACTION"="false"), 缺省是 "false" – 见Hive事务.
  * TBLPROPERTIES ("compactor.mapreduce.map.memory.mb"="mapper_memory") – 见Hive事务.
  * TBLPROPERTIES ("compactorthreshold.hive.compactor.delta.num.threshold"="threshold_num") –见Hive事务.
  * TBLPROPERTIES ("compactorthreshold.hive.compactor.delta.pct.threshold"="threshold_pct") – 见Hive事务.
  * TBLPROPERTIES ("auto.purge"="true") 或 ("auto.purge"="false") – 见删除表、删除分区、截断表和覆盖式插入数据.
  * TBLPROPERTIES ("EXTERNAL"="TRUE")–修改托管表为外部表，反之亦然为“FALSE”.
    * 在Hive2.4.0中（HIVE-16324）属性“EXTERNAL”的值被解析为布尔型（不区分大小写的true或false），而不是比较时区分大小写字符串。
* CREATE TABLE AS SELECT（CTAS）
  * 表也可以通过一个CREATE-TABLE-AS-SELECT(CTAS)语句中的查询结果来创建和填充。CTAS创建的表是原子的，这意味着在填充所有查询结果之前，其他用户不会看到该表。因此，其他用户要么会看到具有完整查询结果的表，要么根本不会看到该表。
  * CTAS有以下限制：
    * 目标表不能是分区表。
    * 目标表不能是外部表。
    * 目标表不能是列表桶表。
* `create table like` 复制表元数据

```sql
-- 查看数据库列表
use db_name;
show tables;
show tables in db_name; -- 明确指定数据库
show tables 'test.*'; -- 正则匹配

-- 查看表的结构信息
describe extended `table_name`;
describe formatted `table_name`;
describe 'db.table.field'
desc `table_name`;
show create table `table_name`;

-- 删除表
drop table if exists `table_name`;

-- 表重命名
alter table `old_table_name` rename to `new_table_name`;

-- 查看分区列表
show partitions `table_name`;
-- 添加表分区
alter table `table_name` add if not exists
  partition (date='yyyymmdd') location ''
  partition (date='yyyymmdd') location '';
-- 修改表分区位置（不会删除数据）
alter table `table_name` partition (date='yyyymmdd') set location '';
-- 删除表分区（内部表同时删除数据）
alter table `table_name` drop if exists partition (date='yyyymmdd');

-- 删除表中的数据
TRUNCATE TABLE table_name [PARTITION partition_spec];
partition_spec:
  : (partition_column = partition_col_value, partition_column = partition_col_value, ...)

-- 修改列信息（修改类型只会更改元数据，不会更改数据，所以可能导致元数据与真实数据对不上的问题）
alter table `table_name`
change column `old_field_name` `new_field_name` type comment '' after xxx;
-- 添加列
alter table `table_name` add columns ();
-- 替换列 完全替换
alter table `table_name` replace columns ();
-- 修改表属性
alter table `table_name` set tblproperties ('key'='value');
-- 修改存储方式
alter table `table_name`
[partition()]
set fileformat  file_format

-- 执行钩子 （不会创建表或分区）
alter table `table_name` touch
partition();
-- 归档
alter table `table_name` archive
partition();
-- 反归档
alter table `table_name` unarchive
partition();
-- 分区保护
alter table `table_name` [partition()] enable|disable NO_DROP;
alter table `table_name` [partition()] enable|disable OFFLINE;
```

### 5、加载/插入/导出数据

```sql
-- 向管理表中加载数据
load data [local] inpath 'filepath' [overwrite]
into table [partition()];
```

* `local` 表示操作系统文件路径
* `overwrite` 是否覆盖重写
* 支持相对路径：
  * `local` 模式下相对于启动cli的用户家目录
  * 非 `local` 模式下hadoop用户的路径

```sql
-- 通过查询插入数据
insert overwrite table `table_name`
partition ()
select_statement;

-- 一次插入多个表或多个分区
from table `origin_table`
insert overwrite table `table_name`
  partition()
  select xxx where xxx
insert overwrite table `table_name`
  partition()
  select xxx where xxx;

-- 动态分区插入
insert overwrite table `table_name`
partition(country, state)
select ..., se.cnty, se.st
from `origin_table` as se;
```

* 动态分区是根据位置匹配的而不是命名
* 动态分区默认不开启，开启后以严格模式运行（必须有一个静态分区）

```sql
-- ctas方式创建库并插入数据
create table `table_name`
as select xxx from `origin_table`;
```

导出数据

```bash
# 直接使用hadoop cp导出（数据格式一致的话）
hadoop fs -cp source_path target_path

```

使用`insert select`

```sql
-- 数据将转换为文本格式
insert overwrite local directory `local_path`
select xxx from xxx where;
```

## 二、查询

### 1、基本语法

```sql
[WITH CommonTableExpression (, CommonTableExpression)*]    (Note: Only available starting with Hive 0.13.0)

select
  [ALL | DISTINCT] select_expr, select_expr ...
from table_reference
[WHERE where_condition]
[GROUP BY col_list]
[ORDER BY col_list]
[CLUSTER BY col_list
  | [DISTRIBUTE BY col_list] [SORT BY col_list]
]
[LIMIT [offset,] rows];
```

#### （1）select_expr

* 支持select列名
* 取map的某个键的值 `column_name["key"]`
* 取Strut中的一个元素 `column_name.field_name`
* 支持使用正则表达式 ``price.*``
* 支持加减乘除算数运算
* 支持数学函数
* 支持聚合函数
* 支持表生成函数（一个函数生成多个列，例如`parse_url_tuple(url, 'HOST', 'PATH', 'QUERY') as (host, path, query)`），常见的如下（也支持使用`lateral view`）
  * explode
  * json_tuple
  * stack
* 其他常用内置函数
* 可以通过 `as` 指定列别名
* 支持`case when then`子句

#### （2）Limit子句

只返回少量几行

#### （3）table_reference

* 支持表名
* 支持子查询

#### （5）where_condition

* 支持 `and` `or`
* 支持常见谓词，特殊的如下
  * `<=>` 类似于 `=`，如果左右都为null，也返回true
  * `<>`、`!=`
  * `[not] between and`
  * `is null`
  * `is not null`
  * `[not] like`
  * `rlike`、`regexp`正则匹配

#### （6）group by子句

* 支持 `group by 字段列表`
* 和 `having 条件`
* 另外额外支持
  * with cube
  * with rollup
  * grouping sets

#### （7）join

* 默认为`inner join`
* Hive 不支持非等值连接（on条件不是等于的）
* Hive 不支持 `OR`
* 大多数情况下为每一个Join将会启动一次MR（多张表连接到一张表，使用相同的连接键，将只会产生一个）
* Hive假定最后一个表为大表，并尝试将左边表（驱动表）放入内存中（也就是说应该将大表放在右边，小表放在左边）
* 可以使用注释显示标注 `SELECT /*+ STREAMTABLE(a) */ a.val, b.val, c.val FROM a JOIN b ON (a.key = b.key1) JOIN c ON (c.key = b.key1)` 这表示，表a表将不尝试加载在内存中
* 同时支持 `left join` 和 `right join`
* 支持 `left semi join` 和 `left join` 不同，但是类似于`inner join`，只返回满足on条件的左边表的记录（引用右表将报错）
* map-side JOIN 小表load进内存，不用产生一个reduce
  * 可以通过 `set hive.auto.convert.join=true` 开启此优化
  * 可以配置小表阈值 `hive.mapjoin.smalltable,filesize=250000000`
  * 右外连接、全外连接不支持
* `bucketJoin` 优化（支持分桶join）

#### （8）order by 和 sort by

* order by 全局排序 慢（严格模式下必须使用limit）
* sort by （保证每个reducer有序）

#### (9) distribute by

表示MR的Shuffle阶段按照那个字段进行分发到reducer，通常与sort by一起使用。这样能保证reducer间不会重复

```sql
distribute by t.a
sort by t.a
```

#### （10）cluster by

等价于`distribute by t.a sort by t.a`

#### （11）数据抽样

```sql
select
from
table_name tablesample(bucket x out of y [on column_name])
```

* 按照任意表进行取样
* 将数据按照 `column_name` 进行分桶，分桶数为y，取编号为x的桶的值，分区方法为hash
* `column_name` 还可以是 `rand()` 函数，表示每一行给一个随机数，按照这个随机数进行划分分桶
* 对于特定分桶表则不用扫全表而是去特定桶即可，其他表需要扫全表

```sql
select
from
table_name tablesample(x percent)
```

* 数据块抽样
* x为抽取的最少比例，取值为0~1，抽取的最小范围是hdfs的一个块大小

#### （12）UNION ALL

将两次查询结果取并集，前提条件是列数相同，每列的数据类型相同

### 2、常用函数与语法

#### `cast()` 类型转换

`case(t.a as string)`

#### `row_number() over` 组内编号 窗口函数

语法详解

```sql
select
  t.*
  row_number() over (partition by col1 order by col2) as no
from db.table t;
```

* 按照col1进行分组，以col2进行排序获取到的组内编号为结果，编号以1开始，以1递增

例子：比如有学生表 stu，存在如下列

* 学号 stu_no
* 班级名 class_name
* 姓名 name

现在想要学生在每个班级内部的编号 class_no, 按照学号排序

```sql
select t.*,
       row_number() over (partition by class_name order by stu_no) as class_no
from db.table t;
```

#### `first_value` 或 `last_vale` 窗口函数

```sql
first_value(field, true) over (partition by col1 order by col2) as col3,
last_value(field, true) over (partition by col1 order by col2 rows between unbounded preceding and unbounded following) as col3
```

参考：

* https://www.jianshu.com/p/acc8b158daef
* http://shzhangji.com/cnblogs/2017/09/05/hive-window-and-analytical-functions/
* https://saboloh.com/2016/11/09/hive-languagemanual-windowingandanalytics/
* https://cwiki.apache.org/confluence/display/Hive/LanguageManual+WindowingAndAnalytics

注意对于窗口函数，都允许下使用 窗口帧（窗口规则）来约束，当前行计算范围，语法如下：

```sql
(rows | range) between (unbounded | [num]) preceding and ([num] preceding | current row | (unbounded | [num]) following)
(rows | range) between current row and (current row | (unbounded | [num]) following)
(rows | range) between [num] following and (unbounded | [num]) following
```

rows 和 range 的区别

* rows就是行号
* range是order by后面的列的值的取值范围

关于默认值

当ORDER BY后面缺少窗口从句条件，窗口规范默认是：（区间起始到当前行）

```sql
range between unbounded preceding and current row
```

当ORDER BY和窗口从句都缺失，窗口规范默认是：（整个区间范围）

```sql
row between unbounded preceding and unbounded following
```

对于last_value一般都会跟着order by所以一般不要使用默认值

#### `case-when-else-end` 多条件

语法

```sql
case
  when field = 1 then 1
  when field = 2 then 2
  else 0
end as alias,
```

#### `if` 条件

```sql
if(exp, true, false)
```

#### `nvl` 函数

```sql
NVL(expr1, expr2)
```

* 如果expr1为NULL，返回值为 expr2，否则返回expr1。
* 适用于数字型、字符型和日期型，但是 expr1和expr2的数据类型必须为同类型。

#### `cast` 类型转换函数

```sql
cast(expr as type)
```

#### `get_json_object(json:string, p:string)` 从json中提取对象

```sql
set hivevar:msg='{
  "message":"2015/12/08 09:14:4",
  "client": "10.108.24.253",
  "server": "passport.suning.com",
  "request": "POST /ids/needVerifyCode HTTP/1.1",
  "server": "passport.sing.co",
  "version":"1",
  "timestamp":"2015-12-08T01:14:43.273Z",
  "type":"B2C","center":"JSZC",
  "system":"WAF","clientip":"192.168.61.4",
  "host":"wafprdweb03",
  "path":"/usr/local/logs/waf.error.log",
  "redis":"192.168.24.46"
}'

select get_json_object('${hivevar:msg}','$.server');
```

#### `from_unixtime(unixtime:number, format:'yyyy-MM-dd')` 时间戳转

* unixtime 秒时间戳
* format
  * 默认为 `'yyyy-MM-dd HH:mm:ss'`
  * 可选 `'yyyy-MM-dd'`

```sql
select from_unixtime(1556803199);
select from_unixtime(1556803199, 'yyyy-MM-dd');
```

#### `json_tuple` 提取json方式2

```sql
select b.key1,
       b.key2,
       b.key3
from db.table a lateral view json_tuple (a.value, 'key1', 'key2', 'key3') b as key1,
                 key2,
                 key3,
                 key4;
```

### 3、视图

语法

```sql
create view [if not exists] view_name(colunm_name...)
[comment '']
[tblproperties ('xxx'='xxx')]
as
select_statement

drop table [if exists] view_name
```

* 不支持插入
* 必须拥有视图所依赖的表的权限

### 4、索引

略

## END、优化与注意点

### 1、对于重复语句可以使用with语法

```sql
with 别名 as (
  -- 查询
),
别名 as (
  -- 查询
)
select xx
from 别名
```

### 2、将两个查询结果放到一列

#### 方案1 使用Union all + max 或case when

```sql
select
  max(t.a) as a,
  max(t.b) as b
from
(
  select t1.a as a, null as b
  from (
    select 1 as a -- 这是查询1
  ) t1
  union all
  select null as a, t2.b as b
  from (
    select -1 as b -- 这是查询2
  ) t2
) t;
```

方案2 使用join

```sql
select
  t1.a as a,
  t2.b as b
from (
  select 1 as a, 0 as o -- 这是查询结果1（需要额外添加一个字段，用于join）
) t1
join (
  select -1 as b, 0 as o -- 这是查询结果2（需要额外添加一个字段，用于join）
) t2 on t1.o = t2.o;
```

### 3、Hive设计模式

* 按天划分表： 使用分区表实现
* 唯一键和标准化： 大数据场景一般反范式化
* 同一份数据多种处理
* 使用分桶表存储
* 使用列式存储（如Parquet）
* 总是使用压缩

### 4、Hive引擎调优

* 使用`explain`或者`explain extended`获取执行计划
* 使用limit
* join优化：使用map-side机制
* 本地模式
* 扩大并行度
* 严格模式
* 调整mr数目
* JVM重用
* 推测执行
