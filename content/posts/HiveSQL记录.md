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

## 一、基本知识

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

## 二、常用函数与语法

### `row_number() over` 组内编号 窗口函数

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

### `first_value` 或 `last_vale` 窗口函数

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

### `case-when-else-end` 多条件

语法

```sql
case
  when field = 1 then 1
  when field = 2 then 2
  else 0
end as alias,
```

### `if` 条件

```sql
if(exp, true, false)
```

### `nvl` 函数

```sql
NVL(expr1, expr2)
```

* 如果expr1为NULL，返回值为 expr2，否则返回expr1。
* 适用于数字型、字符型和日期型，但是 expr1和expr2的数据类型必须为同类型。

### `cast` 类型转换函数

```sql
cast(expr as type)
```

### `get_json_object(json:string, p:string)` 从json中提取对象

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

### `from_unixtime(unixtime:number, format:'yyyy-MM-dd')` 时间戳转

* unixtime 秒时间戳
* format
  * 默认为 `'yyyy-MM-dd HH:mm:ss'`
  * 可选 `'yyyy-MM-dd'`

```sql
select from_unixtime(1556803199);
select from_unixtime(1556803199, 'yyyy-MM-dd');
```

### `json_tuple` 提取json方式2

```sql
select b.key1,
       b.key2,
       b.key3
from db.table a lateral view json_tuple (a.value, 'key1', 'key2', 'key3') b as key1,
                 key2,
                 key3,
                 key4;
```

## 三、优化与注意点

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
