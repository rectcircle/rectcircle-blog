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
>
> * 版本： 9.4
> * [官方手册](http://www.postgres.cn/docs/9.4/index.html)
> * https://cloud.tencent.com/developer/article/1412096
> * https://blog.csdn.net/u013719339/article/details/78414188
> * https://blog.csdn.net/why_not2007/article/details/79062351

## 安装配置

### 安装

#### Debian

```bash
sudo apt install postgresql postgresql-contrib
# 检查安装是否成功
sudo -u postgres psql -c "SELECT version();"
```

* 自动创建管理用户 `postgres`，其家目录为 `/var/lib/postgresql`
* 默认数据目录为 `/var/lib/postgresql/9.4/main/`
* 默认启动日志文件位置 `/var/log/postgresql/postgresql-9.4-main.log`
* 默认配置文件路径 `/etc/postgresql/9.4/main`

#### 源代码安装

```bash
# 编译依赖
sudo apt install libreadline-dev
# 编译
wget https://ftp.postgresql.org/pub/source/v9.4.22/postgresql-9.4.22.tar.gz
tar -zxvf postgresql-9.4.22.tar.gz
cd postgresql-9.4.22/
./configure --prefix=$HOME/test/pgsql # 放在一个特定目录
make # 编译
make install # 安装
# 创建用户 postgres
```

更多参见 http://www.postgres.cn/docs/9.4/installation.html

### 配置

#### 进入交互终端

```bash
sudo -u postgres psql # 使用postgres用户执行psql命令
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

### 说明

#### 常用命令

命令一般使用`postgres`用户执行，`db_name`不填默认为用户名默认为用户名

* `pg_ctl` 或 `pg_ctlcluster` 服务器管理命令，会调用initdb、postgres等命令
* `initdb -D /usr/local/pgsql/data` 初始化数据目录
* `postgres` 数据库server可执行文件
* `createdb [db_name]` 创建数据库
* `dropdb [db_name]` 删除数据库和相关文件
* `psql [db_name]` PostgreSQL交互式终端

#### 配置文件

一般在： `/etc/postgresql/9.4/main`

* `postgresql.conf` server主配置文件
* `pg_hba.conf` 认证配置

## 认证方式

配置方式： 编辑 `pg_hba.conf` 文件，常用的配置方式

* `trust` 无条件的信任表示，不需要任何认证即可登录（一般不使用）
* `md5` md5密码验证方式（一般用于与第三方程序交互）
* `peer` 从操作系统获得客户端的操作系统用户，校验用户名是否一致（一本用于本机登录）

## 主从同步

### 规划

#### 机器

系统信息

debian8

根据情况配置

* 主： x.x.x.10 hostname: master
* 备： x.x.x.11 hostname: slave1

#### 账号密码

备份账号

* 用户名 replica
* 密码 replica

postgres 用户

* 系统/数据库中密码均为 123456

#### 现状

主库已经在线上运行，为了高可用，使用流复制进行数据备份。

#### 目标

* 实现备库异步事实同步主库数据
* 备库可以作为读库使用
* 主库故障，备库可以提供服务，此时备库作为主库。当主库恢复后，主库作为备库。

### 主库配置

使用psql登录

```bash
sudo su postgres
psql
\password postgres # 设置为 123456
```

创建复制用户

```bash
CREATE ROLE replica login replication encrypted password 'replica';
\q
```

需改主库的认证配置文件 `/etc/postgresql/9.4/main/pg_hba.conf`

```bash
host    replication     replica          slave1/24         md5 #在最后一行添加
```

修改主配置文件 `/etc/postgresql/9.4/main/postgresql.conf`

```bash
# listen_addresses = '*'    # 监听所有IP
wal_level = hot_standby   # 流复制必须使用该配置
max_wal_senders = 3       # 流复制的最大连接数
wal_keep_segments = 32    # 流复制保留的最大xlog数
wal_sender_timeout = 60s  # 设置流复制主机发送数据的超时时间
# 下面的配置当发生切换时作为主库时需要使用
hot_standby = on # 说明这台机器不仅仅是用于数据归档，也用于数据查询
max_standby_streaming_delay = 30s # 数据流备份的最大延迟时间
wal_receiver_status_interval = 10s # 多久向主报告一次从的状态，当然从每次数据复制都会向主报告状态，这里只是设置最长的间隔时间
hot_standby_feedback = on # 如果有错误的数据复制，是否向主进行反馈
```

在数据目录下添加备份配置文件（不启用）

```bash
cp /usr/share/postgresql/9.4/recovery.conf.sample /var/lib/postgresql/9.4/main/recovery.done
vim /var/lib/postgresql/9.4/main/recovery.done

standby_mode = on
primary_conninfo = 'host=slave1 port=5432 user=replica password=replica'
trigger_file = '/var/lib/postgresql/9.4/main/trigger_file'
recovery_target_timeline = 'latest'
```

重启

```bash
exit # 退出 postgres 用户
sudo service postgresql restart
sudo tail -f /var/log/postgresql/postgresql-9.4-main.log
```

### 备库配置

安装postgresql

```bash
sudo apt-get install postgresql
sudo passwd postgres # 配置成 123456
sudo service postgresql stop
sudo su postgres
# 测试是否能连接到主库上
psql -h master -U postgres # 密码 123456
```

清空数据目录并执行首次备份

```bash
cd ~/9.4
mv main main.bak # 确保没有数据
mkdir main
chmod 700 main # 重要，否则启动失败
pg_basebackup -F p --progress -D /var/lib/postgresql/9.4/main -h master -p 5432 -U replica --password # 密码 replica
```

在数据目录下添加备份配置文件

```bash
cp /usr/share/postgresql/9.4/recovery.conf.sample /var/lib/postgresql/9.4/main/recovery.conf
vim /var/lib/postgresql/9.4/main/recovery.conf

standby_mode = on
primary_conninfo = 'host=master port=5432 user=replica password=replica'
trigger_file = '/var/lib/postgresql/9.4/main/trigger_file'
recovery_target_timeline = 'latest'
```

配置/etc/postgresql/9.4/main/postgresql.conf 使备库作为读库（方便测试）

```bash
listen_addresses = '*'    # 监听所有IP
wal_level = hot_standby
hot_standby = on # 说明这台机器不仅仅是用于数据归档，也用于数据查询
max_standby_streaming_delay = 30s # 数据流备份的最大延迟时间
wal_receiver_status_interval = 10s # 多久向主报告一次从的状态，当然从每次数据复制都会向主报告状态，这里只是设置最长的间隔时间
hot_standby_feedback = on # 如果有错误的数据复制，是否向主进行反馈
# 下面配置当主备切换时自动启用
max_wal_senders = 3       # 流复制的最大连接数
wal_keep_segments = 32    # 流复制保留的最大xlog数
wal_sender_timeout = 60s  # 设置流复制主机发送数据的超时时间
```

配置身份校验/etc/postgresql/9.4/main/pg_hba.conf
（为了方便切换时，可以直接使用）

```bash
host    all             all              0.0.0.0/0               md5
host    replication     replica          master/24         md5
```

重启

```bash
exit # 退出 postgres 用户
sudo service postgresql start
```

### 主备切换

当主库不可用时（例如在主库执行 `sudo service postgresql stop` ）

#### 备库操作

将备库转换成主库

```bash
sudo su postgres
touch /var/lib/postgresql/9.4/main/trigger_file # 此操作会导致：/var/lib/postgresql/9.4/main/recovery.conf 被重命名为 recovery.done；备库转换为主库模式，同时/var/lib/postgresql/9.4/main/trigger_file随即被删除
ps -ef | grep postgres # 主库存在postgres: wal sender process 备库存在postgres: wal receiver process
```

#### 主库操作

将主库切换为备库（当主库机器可访问后）

```bash
sudo su postgres
mv /var/lib/postgresql/9.4/main/recovery.done /var/lib/postgresql/9.4/main/recovery.conf
# 以下命令仅9.5以上支持所以无法使用，只能重新执行 pg_basebackup 重做备库
pg_rewind  --target-pgdata=/var/lib/postgresql/9.4/main --source-server='host=slave1 port=5432 user=postgres password=123456 dbname=postgres'
# 9.4 以下需要手动拷贝原从库数据目录下pg_xlog中数字最大的.history文件到原主库（需要登录到原从库中查看，下面只是示例）
scp postgres@slave1:/var/lib/postgresql/9.4/main/pg_xlog/00000005.history /var/lib/postgresql/9.4/main/pg_xlog/ # 密码为ies_dw
sudo service postgresql start
```
