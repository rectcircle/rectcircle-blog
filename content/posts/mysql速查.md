---
title: mysql速查
date: 2017-03-27T20:58:36+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/52
  - /detail/52/
tags:
  - sql
---

> 代码优于描述

## 目录

## 安装配置

***

### 1、安装

#### centos 6.5

```shell
yum -y install mysql  mysql-server  mysql-devel
```

#### Debain9

```bash
wget https://dev.mysql.com/get/mysql-apt-config_0.8.15-1_all.deb
sudo dpkg -i mysql-apt-config_0.8.15-1_all.deb
sudo apt-get update
sudo apt-get install mysql-server
vim /etc/mysql/conf.d/mysql.cnf
systemctl restart mysql.service
```

### 2、配置

#### 配置文件

```shell
vim /etc/my.cnf

#添加配置字符集和最大查询语句大小
[mysqld]
init_connect='SET collation_connection = utf8_unicode_ci'
init_connect='SET NAMES utf8'
character-set-server=utf8
collation-server=utf8_unicode_ci
skip-character-set-client-handshake

max_allowed_packet=20M
# MySQL 5.7 之后MySQL不能DISTINCT和ORDER BY同时使用
sql_mode=NO_ENGINE_SUBSTITUTION,STRICT_TRANS_TABLES
bind-address=0.0.0.0

[client]
default-character-set=utf8

[mysql]
default-character-set=utf8
```

#### 配置开启启动

```
chkconfig mysqld on
```

#### mysql服务启动、停止、重启、状态

```
service mysqld start
service mysqld stop
service mysqld restart
service mysqld status
```

#### 配置root密码

```
mysqladmin -u root password 123456
```

#### 登录mysql

```
mysql -uroot -p123456
```

#### MySQL8更改密码连接方式

```sql
use mysql;
select user,host from user;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'password' PASSWORD EXPIRE NEVER;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123456';
flush privileges;
```

#### 配置远程访问数据库

```sql
use mysql;
SELECT DISTINCT CONCAT('User: ''',user,'''@''',host,''';') AS query FROM mysql.user; #查看权限
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY '123456' WITH GRANT OPTION; #配置root以123456密码在任何ip远程登录，不要配置弱密码！！！
flush privileges; #应用配置
```

#### 用户

```sql
create user 'xxx'@'%' identified by '123';
show grants for 'yu'@'%';
DROP USER 'yu'@'localhost';
```

#### 配置查询语句大小限制

```sql
show VARIABLES like '%max_allowed_packet%'; #查看
set global max_allowed_packet = 2*1024*1024*10配置为20M
```

#### 常用命令

```sql
select version(); #显示版本
select now(); #显示当前时间
select user(); #显示当前时间
show warnings; #查看警告信息
```

#### MySQL8 重置密码

**关闭MySql服务**

```bash
brew services stop mysql
mysqld --skip-grant-tables # 跳过验证
```

**直接登录**

```bash
mysql -uroot -p # 让输入密码时，直接回车
```

```sql
UPDATE mysql.user SET authentication_string='' WHERE user='root' and host='localhost';
exit
```

**kill 掉 mysqld --skip-grant-tables**

重启服务

```bash
brew services start mysql
```

登录重设密码

```bash
mysql -uroot -p # 让输入密码时，直接回车
```

```sql
use mysql;
select user,host from user;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'password' PASSWORD EXPIRE NEVER;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '123456';
flush privileges;
```

## 数据类型

***

### 1、数值类型

| MySQL数据类型 |	含义（有符号）           |
|--------------|-------------------------|
| tinyint      |	1字节，范围（-128~127） |
| smallint      |	2字节，范围（-32768~32767） |
| mediumint	   |3字节，范围（-8388608~8388607） |
| int	         |4字节，范围（-2147483648~2147483647） |
| bigint	       |8字节，范围（+-9.22*10的18次方） |
| float(m, d)  |	4字节，单精度浮点型，m总个数，d小数位 |
| double(m, d) |	8字节，双精度浮点型，m总个数，d小数位 |
| decimal(m, d) |	decimal是存储为字符串的浮点数 |

### 2、字符串类型

| MySQL数据类型 |	含义（有符号）           |
|--------------|-------------------------|
| char(n)      |	固定长度，最多255个字符 |
| varchar(n)   |	可变长度，最多65535个字符 |
| tinytext     |	可变长度，最多255个字符 |
| text         |	可变长度，最多65535个字符 |
| mediumtext   |	可变长度，最多2的24次方-1个字符 |
| longtext     |	可变长度，最多2的32次方-1个字符 |

### 3、日期时间类型

| MySQL数据类型 |	含义（有符号）           |
|--------------|-------------------------|
| date |	3字节，日期，格式：2014-09-18 |
| time |	3字节，时间，格式：08:42:30 |
| datetime |	8字节，日期时间，格式：2014-09-18 08:42:30 |
| timestamp |	4字节，自动存储记录修改的时间 |
| year |	1字节，年份 |

### 4、枚举与集合

1. enum("member1", "member2", … "member65535")
2. set("member", "member2", … "member64")

## 增删改查

***

### 1、数据库操作

#### 创建

```sql
create database db_name;
create database if not exists db_name character set utf8; #存在不报错，字符集utf8

```

#### 查看

```sql
 show databases; #查看所有数据库
 show create database db_name; #查看数据库创建信息
 show global variables like '%datadir%'; #查看数据库数据文件位置
```

#### 修改

```sql
alter database dbname character set utf8 #修改数据库编码
```

#### 删除

```sql
drop database db_name;
drop database if exists db_name; #不存在不报错
```

### 2、表操作

#### 创建

```sql
use db_name;
# 最简写法
create table user(
	username varchar(20),
	age tinyint unsigned,
	salary float(8,2)
);

#带约束创建
create table user(
	id int unsigned auto_increment primary key, #主键约束 id自动递增
	username varchar(20) not null unique key, #唯一约束
	age tinyint unsigned null default 18, #默认值
	sex enum('1','2','3') default 3,
	salary float(8,2)
);

CREATE TABLE Course(
	Cno char(5) NOT NULL,
	Cname char(20) NOT NULL,
	Chour tinyint NULL,
	Creadit decimal(18, 2) NULL,
	constraint PK_Course PRIMARY KEY(Cno) #主键
);

CREATE TABLE TC(
	Tno char(6) NOT NULL,
	Cno char(5) NOT NULL,
	constraint PK_TC_ PRIMARY KEY (Tno ASC,	Cno ASC), #联合主键
	constraint FK_TNO foreign key (Tno) references Teacher(Tno), #外键
	constraint FK_CNO foreign key (Cno) references Course(Cno) ON DELETE RESTRICT ON UPDATE CASCADE, #外键带on delelte on update 默认为RESTRICT
	# 可选值：RESTRICT、CASCADE、SET NULL 、NO ACTION 表示拒绝、级联、设空、拒绝
);


#创建过程中插入
create table xxx(
	...
)
select ...


```

#### 查看

```sql
#查看所有数据表
show tables;
show tables from mysql;
#查看表结构
show columns from user;
#查看索引、约束名
show indexes from user;
#查看表外键
show create table user;
```

#### 修改

```sql
#添加列
alter table user add password varchar(20) not null after username;
#
alter table user add (
password varchar(20) not null after username,
truename varchar(20) null
);
#添加约束
alter table user add constraint keyname primary key (id); #主键
alter table user add constraint keyname unique (username); #非空
alter table user add constraint keyname foreign key (pid) references ptable(id); #外键
alter table user add alter age set default 18; #默认
#修改列定义
alter table user modify id int not null first; #属性
alter table user change id u_id int not null first; #修改列名和属性
#修改表名
alter table user rename user2;
rename table user2 to user;
```

#### 删除

```sql
#删除列
alter table user drop password;
alter table user drop password, age;
#删除约束
alter table user add alter age drop default; #删除默认
alter table user drop primary key; #删除主键
alter table user drop index username #删除唯一
alter table user drop foreign key fk_name; #删除外键

```

### 3、记录操作

#### 插入

```sql
#1
insert into user values(null,'tom', 25, 10245.25,md5('123456')), (default,'john', default, 10245.25,md5('123456')); #全部必须赋值
insert user(username, salary) values('jackson', 45666.5);
#2 可以使用子查询
insert user set username='tom', password=md5('123456');
#3 将select结果插入
insert user(username) select username from user1 where id=1;
```

#### 查找（重要）

```sql
#用法
SELECT select_expr [,select_expr...]
[
FROM tbl_references
[WHERE where_condition]
[GROUP BY {col_name | position} [ASC | DESC],...]
[HAVING where_condition]
[ORDER BY {col_name | expo | position}  [ASC | DESC],...]
[LIMIT {[offset,] row_count | row_count OFFSET offset}]
]
#例子
#1、
select * from user;
#2、
select user.id, user.name from user;
#3、字段别名
select id as userId, username as uname from user;
#4、where 条件表达式
select id, username from user where id = 1;
#5、group by 分组
select sex from user group by sex; #返回记录中出现的别的值
#6、having
select sex, age from user group by sex having age > 35; #报错，age必须在聚合函数中，或者在group by后面出现
select sex, avg(age) from user group by sex having age > 35; #正确
select sex from user group by sex having count(id) > 35; #正确
#7、order by 排序
select * from user order by id desc; #从大到小
select * from user order by id asc, age desc; #id从小到大，age从大到小
#8、limit 分页
select * from user limit 10,5; #[偏移量,]每页数目

#8、子查询（必须在小括号内），返回结果可以是标量、列、行或者子查询
select * from student where classId=(select id from class where name="计算机科学与技术");
select * from goods where price >= (select round(avg(price),2) from goods);
#any，any满足子查询的一个结果，all满足子查询全部结果
select * from goods where price >= any (select price from goods where type="笔记本");
select * from goods where typeId in (select id from goods where type="笔记本");

/*
9、表连接 join ... on ...
inner join 查询满足on的两表中交集，仅显示满足on件的记录，公共记录
left join 左表中的全部和左右表满足on的交集，对于左表中记录按照on连接右表，右表查不到记录的的为null
right join 类似上
full join mysql 不支持，相当于left + right并去重的结果
cross join 笛卡尔连接 左右叉乘
*/
select goods.name, category.name from goods inner join category where goods.category = category.id;
```

#### 更新

```sql
update user set age = age+5 where id = 1; #单表更新
#多表更新，
update goods inner join category on goods.category = category.name set category = category.id;
```

#### 删除

```sql
delete from user where id = 1; #单表删除
#多表删除

```

## 约束

***

### 0、测试准备

```sql
create table provinces( #创建参考表
id int auto_increment primary key,
pname varchar(20) not null
);
```

### 1、外键约束

```sql
create table users(
id int unsigned primary key auto_increment,
username varchar(20) not null,
pid int,
foreign key (pid) references provinces (id) #添加外键约束
);

#参照操作
foreign key (pid) references provinces (id) [on delete cascade]
/*
cascade ： 父表删除更新，子表跟随
set null ： 父表删除更新，子表外键设为 null
restrict ： 拒绝对父表跟新
no action ： 类似restrict
*/

```

### 2、非空、主键、唯一、默认

略

## 函数

***

### 1、字符函数

```sql
select concat('姓','名');
select concat_ws('-','a','b','c'); #输出 a-b-c

select format(1234.567,2); #输出 1234.57

select lower('MySql'); #输出mysql
select upper('MySql'); #输出MYSQL

select left('MySql',2); #输出My
select right('MySql', 3); #输出Sql

select length("length"); #返回6

select ltrim(" 你好 "); #删除前导空格
select rtrim(" 你好 "); #删除后续空格
select trim(" 你好 "); #删除前后空格
select trim(leading '?' from '???你好?????'); #输出你好?????
select trim(trailing '?' from '???你好?????'); #???输出你好
select trim(both '?' from '???你好?????'); #输出你好

select substring('MySql', 1, 2); #输出My
select replace('??My??Sql??','?',!'); #输出!!My!!Sql!!

select 'MySql' like '_y%'; #输出1表示true,_任意1个字符，任意字符多个

```

### 2、数值运算符

```sql
select seil(3.01); #4
select seil(3.99); #3
select 3 div 4; #0整除，运算符
select 5 mod 4; #求余数，运算符
select power(2,3); #8，幂运算
select round(3.4); #四舍五入
select truncate(125.89, -1); #120数字截取
```

### 3、比较运算符与函数

```sql
select 35 between 1 and 35; #true，闭区间
select 35 in(1,23,35); #true
select null is null; #true，判断是否为空
```

### 4、日期时间函数

```sql
select now(); #日期时间
select curdate(); #日期
select curtime(); #时间
select date_add('2016-11-13',interval 365 day); #日期变化，增加1年
select date_add('2016-11-13',interval 1 year); #日期变化，增加1年

select datediff('2015-1-1','2016-1-1); #日期差值 -365
select date_format('2014-3-12','%m/%d%Y'); #03/12/2014
```

### 5、信息函数

```sql
select connect_id(); #输出线程id
select database(); #输出打开的数据库
select last_insert_id(); #最后插入记录的id
select user(); #当前用户
select version(); #数据库版本
select row_count(); #上条记录影响多少条记录
```

### 6、聚合函数（输出一个值）

```sql
select avg(id) from user; #输出id的平均值
select count(id) from user; #输出记录数目
select min(id) from user; #输出最小值
select max(id) from user; #输出最大值
select sum(id) from user; #求和
```

### 7、加密摘要算法

```sql
select md5('123456');
set password=password('123456'); #更改mysql数据库当前用户密码，修密码
```

### 8、自定义函数

略

## 存储过程

***

### 1、语法结构

```sql
create [define= {user | current_user}]
procedure sp_name([in | out | inout 参数名 类型[,...]])
[特性...] 过程体
/**
特性
 COMMENT 'string'
 {CONTAINS SQLNO SQLREADS SQL DATAMODIFIES SQL DATASQL SECURITY{DEFINERINVOKER}
 COMMENT:注释
 CONTAINS SQL:包含SQL语句, 但不包含读或写数据的语句
 NO SQL:不包含SQL语句
 READS SQL DATA:包含读数据的语句
 MODIFIES SQL DATA:包含写数据的语句
 SQL SECURITY {DEFINERINVOKER}指明谁有权限来执行
过程体
 (1)过程体由合法的SQL语句构成；
 (2)过程体可以是任意SQL语句;对表格进行增删，连接，但是不能创建数据表<br>
 (3)过程体如果为复合结构则使用BEGIN...END语句
 (4)复合结构可以使用条件、循环等控制语句
*/
```

### 2、实例

```sql
#无参数存储过程
create procedure getVersion() select version();
call getVersion();#调用

#有in参数存储过程
delimiter //
create procedure removeUserById(in uid int unsigned)
begin
delete from user where id = uid;
end
//
delimiter ;
call removeUserById(1);#调用

#带有in out的语句，删除并获取剩余总数
delimiter //
create procedure removeUserByIdAndGetUserNums(in uid int unsigned, out userNums int unsigned)
begin
delete from user where id = uid;
select count(id) from user into userNums;
end
//
delimiter ;
call removeUserByIdAndGetUserNums(1, @nums);#调用，用户变量
select @nums; #查看变量
```

### 3、删除

```sql
drop procedure getVersion;
```

## 存储引擎

***

```sql
show create table user; #查看表的存储引擎
```

### 1、简介

> MyISAM
> InnoDB
> Memory
> Archive

### 2、修改存储引擎

```
#配置默认的存储引擎
default-storage-engine = InnoDB
```

```sql
#创建表示指定存储引擎
create table user(
......
) engine = InnoDB;

#修改现有表的存储引擎
alter table user engine = InnoDB;

```

## 索引

***

### 1、创建索引

索引是一种与表有关的结构，它的作用相当于书的目录，可以根据目录中的页码快速找到所需的内容。

当表中有大量记录时，若要对表进行查询，没有索引的情况是全表搜索：将所有记录一一取出，和查询条件进行一一对比，然后返回满足条件的记录。这样做会消耗大量数据库系统时间，并造成大量磁盘 I/O 操作。

而如果在表中已建立索引，在索引中找到符合查询条件的索引值，通过索引值就可以快速找到表中的数据，可以大大加快查询速度。

对一张表中的某个列建立索引，有以下两种语句格式：

```sql
ALTER TABLE 表名字 ADD INDEX 索引名 (列名);
CREATE INDEX 索引名 ON 表名字 (列名);
```

我们用这两种语句分别建立索引：

```sql
ALTER TABLE employee ADD INDEX idx_id (id);  #在employee表的id列上建立名为idx_id的索引

CREATE INDEX idx_name ON employee (name);   #在employee表的name列上建立名为idx_name的索引
```

### 2、查看索引

```sql
SHOW INDEX FROM 表名字;
```

## 视图

***

视图是从一个或多个表中导出来的表，是一种虚拟存在的表。它就像一个窗口，通过这个窗口可以看到系统专门提供的数据，这样，用户可以不用看到整个数据库中的数据，而只关心对自己有用的数据。

注意理解视图是虚拟的表：

* 数据库中只存放了视图的定义，而没有存放视图中的数据，这些数据存放在原来的表中；
* 使用视图查询数据时，数据库系统会从原来的表中取出对应的数据；
* 视图中的数据依赖于原来表中的数据，一旦表中数据发生改变，显示在视图中的数据也会发生改变；
* 在使用视图的时候，可以把它当作一张表。

### 1、 创建视图

```sql
CREATE VIEW 视图名(列a,列b,列c) AS SELECT 列1,列2,列3 FROM 表名字;
```

可见创建视图的语句，后半句是一个SELECT查询语句，所以视图也可以建立在多张表上，只需在SELECT语句中使用子查询或连接查询，这些在之前的实验已经进行过。

### 2、修改视图

```sql
ALTER [ALGORITHM = {UNDEFINED | MERGE | TEMPTABLE}]
    VIEW view_name [(column_list)]
    AS select_statement
    [WITH [CASCADED | LOCAL] CHECK OPTION]
```

### 3、删除视图

```sql
DROP VIEW [IF EXISTS]
    view_name [, view_name] ...
    [RESTRICT | CASCADE]
```

## 导入导出

***

### 1、导入操作

导入操作，可以把一个文件里的数据保存进一张表。导入语句格式为：

```sql
LOAD DATA INFILE '文件路径' INTO TABLE 表名字
[FIELDS TERMINATED BY '分隔符']  [OPTIONALLY ENCLOSED BY '数据包裹符']
[LINES TERMINATED BY '记录分隔符\n']
(列名1,列名2);
```

### 2、导出操作

```sql
SELECT 列1，列2 INTO OUTFILE '文件路径和文件名'
[FIELDS TERMINATED BY '分隔符']  [OPTIONALLY ENCLOSED BY '数据包裹符']
 [LINES TERMINATED BY '记录分隔符\n']
FROM 表名字;
```

注意：语句中 “文件路径” 之下不能已经有同名文件。

## 备份恢复

***

### 1、备份

数据库中的数据或许十分重要，出于安全性考虑，在数据库的使用中，应该注意使用备份功能。

> 备份与导出的区别：导出的文件只是保存数据库中的数据；而备份，则是把数据库的结构，包括数据、约束、索引、视图等全部另存为一个文件。

`mysqldump` 是 MySQL 用于备份数据库的实用程序。它主要产生一个 SQL 脚本文件，其中包含从头重新创建数据库所必需的命令CREATE TABLE INSERT 等。

使用 mysqldump 备份的语句：

```sql
mysqldump -u root 数据库名>备份文件名;   #备份整个数据库

mysqldump -u root 数据库名 表名字>备份文件名;  #备份整个表
```

### 2、恢复

```sql
mysql -u root -p 密码
source /tmp/SQL6/MySQL-06.sql
```

### 3、备份策略

我们都知道必须按计划定期进行备份。可以用一些工具(某个时间点的数据快照)完全备份MySQL。例如，InnoDB Hot Backup为InnoDB数据文件提供在线非数据块物理备份，mysqldump提供在线逻辑备份。

假定我们在星期日下午1点进行了备份，此时负荷较低。下面的命令可以完全备份所有数据库中的所有InnoDB表：

```bash
mysqldump --single-transaction --all-databases backup_sunday_1_PM.sql
```

以上方法是在线非数据块备份，不会干扰对表的读写。我们假定我们以前的表为InnoDB表，因此--single-transaction一致性地表，并且保证mysqldump所看见的数据不会更改。(其它客户端对InnoDB表进行的更改不会被mysqldump进程看见）。如果我们还有其它类型的表，我们必须假定在备份过程中它们不会更改。例如，对于mysql数据库中的MyISAM表，我们必须假定在备份过程中没有对MySQL账户进行管理更改。

`mysqldump`命令产生的`.sql`文件包含一系列`SQL INSERT`语句，可以用来重载转储的表。

进行完全备份的时候有时不方便，因为会产生大的备份文件并需要花时间来生成。从某个角度来看，完全备份并不理想，因为每个成功的完全备份都包括所有数据，甚至包括自从上一次完全备份以来没有被更改的部分。完成了初始完全备份后，进行增量备份会更有效。这样备份文件要小得多，备份时间也较短。缺点是，恢复时不能只重载完全备份来恢复数据。还必须要用增量备份来恢复增量更改。

要想进行增量备份，我们需要保存增量更改。应使用--log-bin选项启动MySQL服务器，以便更新数据时将这些更改保存到文件中。该选项启用二进制日志，因此服务器会将每个更新数据的SQL语句写入到MySQL二进制日志。让我们看看用--log-bin选项启动的已经运行多日的MySQL服务器的数据目录。找到以下MySQL二进制日志文件：

每次重启，MySQL服务器都会使用以上序列中的下一个编号创建一个新的二进制日志文件。当服务器运行时，你还可以通过执行FLUSH LOGS SQL语句或mysqladmin flush-logs命令，告诉服务器关闭当前的二进制日志文件并创建一个新文件。mysqldump也有一个选项来清空日志。数据目录中的.index文件包含该目录下所有MySQL二进制日志的清单，该文件用于复制。

恢复时MySQL二进制日志很重要，因为它们是增量备份。如果进行完全备份时确保清空了日志，则后面创建的二进制日志文件包含了备份后的所有数据更改。让我们稍稍修改前面的mysqldump命令，让它在完全备份时能够清空 MySQL二进制日志，以便转储文件包含包含新的当前二进制日志：

```bash
mysqldump --single-transaction --flush-logs --master-data=2
           --all-databases > backup_sunday_1_PM.sql
```

执行该命令后，数据目录则包含新的二进制日志文件。产生的.sql文件包含下列行：

```
-- Position to start replication or point-in-time recovery from
-- CHANGE MASTER TO MASTER_LOG_FILE='gbichot2-bin.000007',MASTER_LOG_POS=4;
```

* 因为mysqldump命令可以执行完全备份，以上行代表两件事情：
.sql文件包含所有写入gbichot2-bin.000007二进制日志文件或最新的文件之前的更改。
* 备份后所记录的所有数据更改不出现在.sql中，但会出现在gbichot2-bin.000007二进制日志文件或最新的文件中。

在星期一下午1点，我们可以清空日志并开始根据新的二进制日志文件来创建增量备份。例如，执行mysqladmin flush-logs命令创建gbichot2-bin.000008。星期日下午1点的完全备份和星期一下午1点之间的所有更改为文件gbichot2-bin.000007。该增量备份很重要，因此最好将它复制到安全的地方。（例如，备份到磁带或DVD上，或复制到另一台机器上）。在星期二下午1点，执行另一个mysqladmin flush-logs命令，这样星期一下午1点和星期二下午1点之间的所有更改为文件gbichot2-bin.000008(也应复制到某个安全的地方)。

MySQL二进制日志占据硬盘空间。要想释放空间，应随时清空。操作方法是删掉不再使用的二进制日志，例如进行完全备份时输入以下命令：

```bash
mysqldump --single-transaction --flush-logs --master-data=2
       --all-databases --delete-master-logs > backup_sunday_1_PM.sql
```

注释：如果你的服务器为复制主服务器，用mysqldump方法中的 --delete-master-logs选项删掉MySQL二进制日志很危险，因为从服务器可能还没有完全处理该二进制日志的内容。关于这一点，PURGE MASTER LOGS语句的描述中解释了为什么在删掉MySQL二进制日志之前应进行确认一下。

### 4、为恢复进行备份

现在假设在星期三上午8点出现了灾难性崩溃，需要使用备份文件进行恢复。恢复时，我们首先恢复最后的完全备份(从星期日下午1点开始)。完全备份文件是一系列SQL语句，因此恢复它很容易：

```bash
mysql < backup_sunday_1_PM.sql
```

接下来使得数据恢复到星期日下午1点的状态。要想恢复从那时起的更改，我们必须使用增量备份，也就是gbichot2-bin.000007和gbichot2-bin.000008这两个二进制日志文件。根据需要从备份处取得这些文件，然后按下述方式处理：

```bash
mysqlbinlog gbichot2-bin.000007 gbichot2-bin.000008 | mysql
```

我们现在将数据恢复到星期二下午1点的状态，但是从该时刻到崩溃之间的数据仍然有丢失；要实现恢复，我们需要MySQL服务器将MySQL二进制日志保存到安全的位置(RAID disks, SAN, ...)，应为与数据文件的保存位置不同的地方，保证这些日志不在被毁坏的硬盘上。(也就是，我们可以用--log-bin选项启动服务器，指定一个其它物理设备上的与数据目录不同的位置。这样，即使包含该目录的设备丢失，日志也不会丢失）。如果我们执行了这些操作，我们手头上会有gbichot2-bin.000009文件，我们可以用它来恢复大部分最新的数据更改，而不会丢失星期二下午1点到崩溃时刻之间的数据。

### 5、备份策略摘要

出现操作系统崩溃或电源故障时，InnoDB自己可以完成所有数据恢复工作。但为了确保你可以睡好觉，应遵从下面的指导：

* 一定用--log-bin或甚至--log-bin=log_name选项启动MySQL服务器，其中日志文件名位于某个安全媒介上，不同于数据目录所在驱动器。如果你有这样的安全媒介，最好进行硬盘负载均衡(这样能够提高性能)。

* 定期进行完全备份，使用mysqldump命令进行在线非数据块备份。

* 用FLUSH LOGS或mysqladmin flush-logs清空日志进行定期增量备份。

### 6、自动恢复

```bash
vi /etc/mysql/my.cnf
#打开log bin行
```

修改后然后保存my.cnf文件，重启mysql服务器，并查看日志是否启动：

```bash
shell> service mysql restart --log-bin
shell> mysql -u root
sql> show variables like 'log_%'; #查看log_bin是否启动
```

继续~

要想确定当前的二进制日志文件的文件名，在命令行中加入下面的MySQL语句：

```bash
shell> mysql -u root -e 'SHOW BINLOG EVENTS \G'
```

#### （1）指定恢复时间

对于MySQL 5，可以在mysqlbinlog语句中通过--start-date和--stop-date选项指定DATETIME格式的起止时间。举例说明，假设在今天上午10:00(今天是2015年8月6日)，执行SQL语句来删除一个大表。要想恢复表和数据，你可以恢复前一晚上的备份，并从命令行输入以下命令：

```bash
shell> mysqlbinlog --stop-date="2015-8-6 10:01:00" /var/log/mysql/bin.123456 \
     | mysql -u root -p mypwd
```

该命令将恢复截止到在--stop-date选项中以DATETIME格式给出的日期和时间的所有数据。

在以上行中，从上午10:01登录的SQL语句将运行。结合执行前夜的转储文件和mysqlbinlog的两行命令可以将所有数据恢复到上午10:00前一秒钟。你应检查日志以确保时间确切。下一节介绍如何实现。

#### （2）指定恢复位置

也可以不指定日期和时间，而使用mysqlbinlog的选项--start-position和--stop-position来指定日志位置。它们的作用与起止日选项相同，不同的是给出了从日志起的位置号。使用日志位置是更准确的恢复方法，特别是当由于破坏性SQL语句同时发生许多事务的时候。要想确定位置号，可以运行mysqlbinlog寻找执行了不期望的事务的时间范围，但应将结果重新指向文本文件以便进行检查。操作方法为：

```bash
shell> mysqlbinlog --start-date="2014-10-29 9:55:00" --stop-date="2014-10-29 10:05:00" \
      /var/log/mysql/bin.123456 > /tmp/mysql_restore.sql
```

该命令将在/tmp目录创建小的文本文件，将显示执行了错误的SQL语句时的SQL语句。你可以用文本编辑器打开该文件，寻找你不要想重复的语句。如果二进制日志中的位置号用于停止和继续恢复操作，应进行注释。用`log_pos加一个数字来标记位置。使用位置号恢复了以前的备份文件后，你应从命令行输入下面内容：

```bash
shell> mysqlbinlog --stop-position="368312" /var/log/mysql/bin.123456 \
    | mysql -u root -pmypwd

shell> mysqlbinlog --start-position="368315" /var/log/mysql/bin.123456 \
    | mysql -u root -pmypwd \
```

上面的第1行将恢复到停止位置为止的所有事务。第二行将恢复从给定的起始位置直到二进制日志结束的所有事务。因为mysqlbinlog的输出包括每个SQL语句记录之前的SET TIMESTAMP语句，恢复的数据和相关MySQL日志将反映事务执行的原时间。

## 用户管理

***

### 1、添加用户

可以用两种方式创建MySQL账户：

* 使用`GRANT`语句
* 直接操作MySQL授权表

#### （1）使用`GRANT`语句

最好的方法是使用GRANT语句，因为这样更精确，错误少。

创建账户的其它方法是使用MySQL账户管理功能的第三方程序。phpMyAdmin即是一个第三方程序。

下面的示例说明如何使用MySQL客户端程序来设置新用户。

首先，在启动mysql服务后，使用MySQL程序以MySQL的root用户来连接服务器：

```bash
shell> mysql -u root
```

以root连接到服务器上后，可以添加新账户。下面的语句表示使用GRANT来设置四个新账户：

```sql
GRANT ALL PRIVILEGES ON *.* TO 'monty'@'localhost' IDENTIFIED BY 'some_pass' WITH GRANT OPTION;

GRANT ALL PRIVILEGES ON *.* TO 'monty'@'%' IDENTIFIED BY 'some_pass' WITH GRANT OPTION;

GRANT RELOAD,PROCESS ON *.* TO 'admin'@'localhost';

GRANT USAGE ON *.* TO 'dummy'@'localhost';

FLUSH PRIVILEGES;
```

**GRANT命令说明：**

`ALL PRIVILEGES` 是表示所有权限，你也可以使用`select、update`等权限。

`ON` 用来指定权限针对哪些库和表。

`*.*` 中前面的*号用来指定数据库名，后面的*号用来指定表名。

`TO` 表示将权限赋予某个用户。

`'monty'@'localhost'` 表示monty用户，@ 后面接限制的主机，可以是IP、IP段、域名以及%，%表示任何地方。（注意：这里%有的版本不包括本地，以前碰到过给某个用户设置了%允许任何地方登录，但是在本地登录不了，这个和版本有关系，遇到这个问题再加一个localhost的用户就可以了。）

`IDENTIFIED BY`指定用户的登录密码。

`WITH GRANT OPTION` 这个选项表示该用户可以将自己拥有的权限授权给别人。（注意：经常有人在创建操作用户的时候不指定WITH GRANT OPTION选项导致后来该用户不能使用GRANT命令创建用户或者给其他用户授权。）

备注：可以使用GRANT重复给用户添加权限，权限叠加，比如你先给用户添加了一个SELECT权限，然后又给用户添加了一个INSERT权限，那么该用户就同时拥有了SELECT和INSERT权限。

除了GRANT语句，你可以直接用INSERT语句创建相同的账户，然后使用`FLUSH PRIVILEGES`刷新权限来告诉服务器重载授权表

**上述用GRANT语句创建的账户具有以下属性：**

其中两个账户有相同的用户名monty和密码some_pass。两个账户均为超级用户账户，具有完全的权限可以做任何事情。一个账户 ('monty'@'localhost')只用于从本机连接。另一个账户('monty'@'%')可用于从其它主机连接。请注意monty的两个账户必须能从任何主机以monty连接。当不具有localhost账户的用户monty从本机连接时，mysql_install_db创建的localhost匿名用户账户将具有优先权限。结果是，monty将被视为匿名用户。原因是在user表中匿名用户账户的Host列值比monty'@'%账户更具体（%相当于空HOST），这样在user表中排序是排在前面。

第三个账户有用户名admin，但没有密码。该账户只能用于本机连接。上面第三条语句中授予admin用户RELOAD和PROCESS管理权限；这些权限允许admin用户执行mysqladmin reload、mysqladmin refresh和mysqladmin flush-xxx以及mysqladmin processlist命令；但是它未被授予访问数据库的权限；你可以通过GRANT语句添加此类权限。

第四个账户有用户名dummy，但是也没有密码，该账户只用于本机连接，通过GRANT语句中赋予的USAGE权限，你可以创建账户而不授予任何权限；它可以将所有全局权限设为'N'。假定你将在以后将具体权限授予该账户。

#### （2）直接操作用户表

略

### 2、移除用户

要想移除账户，应使用`DROP USER`语句。

### 3、限制账户资源

限制MySQL服务器资源使用的一个方法是将max_user_connections系统变量设置为非零值。但是，该方法严格限于全局，不允许管理具体的账户。并且，它只限制使用单一账户同时连接的数量，而不是客户端连接后的操作。许多MySQL管理员对两种类型的控制均感兴趣，特别是Internet服务提供者。

在MySQL 5.1中,你可以为具体账户限制下面的服务器资源：

* 账户每小时可以发出的查询数
* 账户每小时可以发出的更新数
* 账户每小时可以连接服务器的次数

客户端可以执行的语句根据查询限制来记数。只有修改数据库或表的语句根据更新限制来记数。

还可以限制每个账户的同时连接服务器的连接数。

本文中的账户为user表中的单个记录。根据User和Host列值唯一识别每个账户。

作为使用该特性的先决条件，mysql数据库的user表必须包含资源相关的列。资源限制保存在max_questions、max_updates、max_connections和max_user_connections列内。如果user表没有这些列，则必须对它进行升级。

要想用GRANT语句设置资源限制，使WITH子句来命名每个要限制的资源和根据每小时记数的限制值。例如，要想只以限制方式创建可以访问customer数据库的新账户，执行该语句：

```sql
GRANT ALL ON customer.* TO 'francis'@'localhost'
IDENTIFIED BY 'frank'
WITH MAX_QUERIES_PER_HOUR 20
MAX_UPDATES_PER_HOUR 10
MAX_CONNECTIONS_PER_HOUR 5
MAX_USER_CONNECTIONS 2;
```

限制类型不需要全部在WITH子句中命名，但已经命名的可以按任何顺序。每个每小时限制值均应为整数，代表每小时的记数。如果GRANT语句没有WITH子句，则每个限制值设置为默认值零（即没有限制）。对于MAX_USER_CONNECTIONS，限制为整数，表示账户一次可以同时连接的最大连接数。如果限制设置为 默认值零，则根据MAX_USER_CONNECTIONS系统变量确定该账户可以同时连接的数量。

要想设置或更改已有账户的限制，在全局级别使用GRANT USAGE语句（ON .）。下面的语句可以将francis的查询限制更改为100：

```sql
GRANT USAGE ON *.* TO 'francis'@'localhost'
    WITH MAX_QUERIES_PER_HOUR 100;
```

该语句没有改变账户的已有权限，只修改了指定的限制值。

要想取消已有限制，将该值设置为零。例如，要想取消francis每小时可以连接的次数的限制，使用该语句：

```sql
GRANT USAGE ON *.* TO 'francis'@'localhost'
    WITH MAX_CONNECTIONS_PER_HOUR 0;
```

在账户使用资源时如果有非零限制，则对资源使用进行记数。

服务器运行时，它统计每个账户使用资源的次数。如果账户在最后一个小时的连接次数达到限制，该账户的进一步的连接被拒绝。类似地，如果账户达到查询或更新次数的限制，进一步的查询或更新被拒绝。在这种情况下，会给出相关错误消息。

根据每个账户进行资源计算，而不是根据每个客户端。例如，如果你的账户的查询次数限制为50，你不能通过两个客户端同时连接服务器将连接次数限制增加到100。两个连接的查询会被一起计算。

可以为所有账户从全局重设当前的每小时资源使用记数，或单独重设给定的账户：

* 要想将所有账户当前的记数重设为零，可以执行FLUSH USER_RESOURCES语句。还可以通过重载授权表来重设记数(例如，使用FLUSH PRIVILEGES语句或mysqladmin reload命令)。

* 将具体账户的限制重新授予任何值，可以将它设置为零。要想实现，按照前面语句所述使用GRANT USAGE，并将限制值指定为该账户当前的限制值。

计数器重设不影响MAX_USER_CONNECTIONS限制。

当服务器启动时所有记数从零开始。

### 4、设置用户密码

可以用mysqladmin命令在命令行指定密码：

```bash
mysqladmin -u user_name -h host_name password "newpwd"
```

该命令为Host为host_name，User为user_name账户添加密码newpwd。

为账户赋予密码的另一种方法是执行SET PASSWORD语句：

```sql
SET PASSWORD FOR 'jeffrey'@'%' = PASSWORD('biscuit');
```

只有root等可以更新mysql数据库的用户可以更改其它用户的密码。如果你没有以匿名用户连接，省略FOR子句便可以更改自己的密码：

```sql
SET PASSWORD = PASSWORD('biscuit');
```

你还可以在全局级别使用GRANT USAGE语句(ON .)来指定某个账户的密码而不影响账户当前的权限：

```sql
GRANT USAGE ON *.* TO 'jeffrey'@'%' IDENTIFIED BY 'biscuit';
```

修改user表修改密码 略

### 5、修改root密码（忘记root密码）

```bash
# 停止 mysql 服务
sudo service mysql stop

# 使用 mysql_safe 方式启动 mysql 服务
sudo mysqld_safe --skip-grant-tables&

#进入数据库
mysql -uroot mysql

> UPDATE user SET password=PASSWORD("shiyanlou") WHERE user='root';
> FLUSH PRIVILEGES;
```

## 排错

* 查看数据配置文件，查找`my.cnf`获取错误日志的位置
* 查看错误日志
