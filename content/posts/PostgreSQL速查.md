---
title: "PostgreSQL速查"
date: 2019-07-01T20:17:46+08:00
draft: false
toc: true
comments: true
tags:
  - sql
---

> 参考
> * https://cloud.tencent.com/developer/article/1412096
> * https://blog.csdn.net/u013719339/article/details/78414188
> * https://blog.csdn.net/why_not2007/article/details/79062351

## 安装配置

### 安装

Debian：

```bash
sudo apt install postgresql postgresql-contrib
# 检查安装是否成功
sudo -u postgres psql -c "SELECT version();"
```

### 配置

#### 进入交互终端

```bash
sudo -u postgres psql
```

#### 创建用户和数据库

```bash
sudo -u postgres psql
sudo su - postgres -c "createuser john"
sudo su - postgres -c "createdb johndb"
sudo -u postgres psql # 进入交互终端
  # 注意一定要有分号
  grant all privileges on database johndb to john; # 关联数据库和用户
  alter user john with password '123456'; # 更新用户密码
  # create database dbtest owner username; # 创建数据库指定所属者
  # grant all on database dbtest to username; -- 将dbtest所有权限赋值给username
```

#### 允许远程连接

`/etc/postgresql/9.x/main/pg_hba.conf` 添加

```conf
listen_addresses = '*'     # what IP address(es) to listen on;
```

#### 允许非SSL登录

`/etc/postgresql/9.x/main/pg_hba.conf` 添加

```conf
host    all             all              0.0.0.0/0              md5
```

#### python连接测试

```python
#!/usr/bin/python
import psycopg2
conn = psycopg2.connect(database="testdb", user="postgres", password="pass123", host="127.0.0.1", port="5432")
print "Opened database successfully"
```
