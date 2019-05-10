---
title: Redis速查
date: 2017-10-30T09:07:03+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/109
  - /detail/109/
tags:
  - sql
---

> [参考：runoob.com](http://www.runoob.com/redis/redis-tutorial.html)

## 一、入门

***

### 1、简介

Redis 是完全开源免费的，遵守BSD协议，是一个高性能的key-value数据库。

* Redis 与其他 key - value 缓存产品有以下三个特点：
* Redis支持数据的持久化，可以将内存中的数据保存在磁盘中，重启的时候可以再次加载进行使用。
* Redis不仅仅支持简单的key-value类型的数据，同时还提供list，set，zset，hash等数据结构的存储。
* Redis支持数据的备份，即master-slave模式的数据备份。

#### （1）Redis 优势

* 性能极高 – Redis能读的速度是110000次/s,写的速度是81000次/s 。
* 丰富的数据类型 – Redis支持二进制案例的 Strings, Lists, Hashes, Sets 及 Ordered Sets 数据类型操作。
* 原子 – Redis的所有操作都是原子性的，同时Redis还支持对几个操作全并后的原子性执行。
* 丰富的特性 – Redis还支持 publish/subscribe, 通知, key 过期等等特性。

#### （2）Redis与其他key-value存储有什么不同？

* Redis有着更为复杂的数据结构并且提供对他们的原子性操作，这是一个不同于其他数据库的进化路径。Redis的数据类型都是基于基本数据结构的同时对程序员透明，无需进行额外的抽象。
* Redis运行在内存中但是可以持久化到磁盘，所以在对不同数据集进行高速读写时需要权衡内存，因为数据量不能大于硬件内存。在内存数据库方面的另一个优点是，相比在磁盘上相同的复杂的数据结构，在内存中操作起来非常简单，这样Redis可以做很多内部复杂性很强的事情。同时，在磁盘格式方面他们是紧凑的以追加的方式产生的，因为他们并不需要进行随机访问。

### 2、安装

#### （1）windows安装

[下载地址](https://github.com/MicrosoftArchive/redis/releases)
下载`*.zip`文件，解压，添加到环境变量

启动服务器，进入cmd

```bash
redis-server
```

启动客户端，新建cmd

```bash
redis-cli.exe -h 127.0.0.1 -p 6379
```

测试输入：

```
set key value
get key
```

安装成服务

```bash
#安装
redis-server.exe --service-install redis.windows.conf --loglevel verbose
#卸载
redis-server --service-uninstall
```

可以启动客户端测试

#### （2）linux安装

> [参考](http://blog.csdn.net/ludonqin/article/details/47211109)

**下载安装**

```bash
wget http://download.redis.io/releases/redis-4.0.2.tar.gz
tar -zxvf redis-4.0.2.tar.gz
cd redis-4.0.2
make
make test
make install
```

**配置**

创建配置文件目录

```bash
mkdir /etc/redis
```

创建变量目录

```bash
cd /var/
mkdir redis
cd redis
mkdir data log run
```

将配置文件`redis.conf`拷贝到配置文件目录

```bash
cp redis.conf /etc/redis/
```

修改配置文件

```
pidfile /var/redis/run/redis.pid
dir /var/redis/data
logfile /var/redis/log/redis.log
daemonize yes #启动成守护进程
```

**启动**

```bash
redis-server /etc/redis/redis.conf
```

**停止**

```bash
redis-cli shutdown
```

**设置为服务和开机自启**

拷贝脚本、赋予权限

```bash
cp utils/redis_init_script /etc/init.d/redis
chmod +x /etc/init.d/redis
```

编辑脚本

```bash
#!/bin/sh
#
# chkconfig: 2345 90 10
#
# description: Redis is a persistent key-value database
# Simple Redis init.d script conceived to work on Linux systems
# as it does use of the /proc filesystem.

#PIDFILE=/var/run/redis_${REDISPORT}.pid
PIDFILE=/var/redis/run/redis.pid
#CONF="/etc/redis/${REDISPORT}.conf"
CONF="/etc/redis/redis.conf"
```

启动关闭服务

```bash
service redis start/stop
```

设置为开机自启

```bash
chkconfig redis on
```

### 3、配置

#### （1）配置文件

windows下为 `~/redis.windows.conf`

#### （2）使用客户端配置

获取配置信息`CONFIG GET 配置名`

```
# 获取所有配置信息
CONFIG GET *
```

配置配置信息`CONFIG SET loglevel "配置值"`

```
CONFIG GET loglevel
CONFIG SET loglevel "notice"
CONFIG GET loglevel
```

#### （2）配置文件常用配置项说明

* `bind 127.0.0.1` 绑定主机号
* `port 6379` 绑定的端口
* `timeout 0` 当 客户端闲置多长时间后关闭连接，如果指定为0，表示关闭该功能
* `loglevel verbose` 指定日志记录级别，Redis总共支持四个级别：debug、verbose、notice、warning，默认为verbose
* `logfile stdout` 设置数据库的数量，默认数据库为0，可以使用`SELECT <dbid>`命令在连接上指定数据库id
* `databases 16` 设置数据库的数量，默认数据库为0，可以使用`SELECT <dbid>`命令在连接上指定数据库id
* `save <seconds> <changes>` 指定在多长时间内，有多少次更新操作，就将数据同步到数据文件，可以多个条件配合
* `rdbcompression yes` 指定存储至本地数据库时是否压缩数据，默认为yes，Redis采用LZF压缩，如果为了节省CPU时间，可以关闭该选项，但会导致数据库文件变的巨大
* `dbfilename dump.rdb` 指定本地数据库文件名，默认值为dump.rdb
* `dir ./` 指定本地数据库存放目录
* `slaveof <masterip> <masterport>` 设置当本机为slav服务时，设置master服务的IP地址及端口，在Redis启动时，它会自动从master进行数据同步
* `masterauth <master-password>` 当master服务设置了密码保护时，slav服务连接master的密码
* `requirepass foobared` 设置Redis连接密码，如果配置了连接密码，客户端在连接Redis时需要通过`AUTH <password>`命令提供密码，默认关闭
* `maxclients 128` 设置同一时间最大客户端连接数，默认无限制，Redis可以同时打开的客户端连接数为Redis进程可以打开的最大文件描述符数，如果设置 maxclients 0，表示不作限制。当客户端连接数到达限制时，Redis会关闭新的连接并向客户端返回max number of clients reached错误信息
* `maxmemory<bytes>` 指定Redis最大内存限制，Redis在启动时会把数据加载到内存中，达到最大内存后，Redis会先尝试清除已到期或即将到期的Key，当此方法处理 后，仍然到达最大内存设置，将无法再进行写入操作，但仍然可以进行读取操作。Redis新的vm机制，会把Key存放内存，Value会存放在swap区
* `appendonly no` 指定是否在每次更新操作后进行日志记录，Redis在默认情况下是异步的把数据写入磁盘，如果不开启，可能会在断电时导致一段时间内的数据丢失。因为 redis本身同步数据文件是按上面save条件来同步的，所以有的数据会在一段时间内只存在于内存中。默认为no
* `appendfilename appendonly.aof` 指定更新日志文件名，默认为appendonly.aof
* `appendfsync everysec` 指定更新日志条件，共有3个可选值：
  * no：表示等操作系统进行数据缓存同步到磁盘（快）
  * always：表示每次更新操作后手动调用fsync()将数据写到磁盘（慢，安全）
  * everysec：表示每秒同步一次（折衷，默认值）
* `vm-enabled no`指定是否启用虚拟内存机制，默认值为no，简单的介绍一下，VM机制将数据分页存放，由Redis将访问量较少的页即冷数据swap到磁盘上，访问多的页面由磁盘自动换出到内存中
* `vm-swap-file /tmp/redis.swap` 虚拟内存文件路径，默认值为/tmp/redis.swap，不可多个Redis实例共享
* `vm-max-memory 0` 将所有大于vm-max-memory的数据存入虚拟内存,无论vm-max-memory设置多小,所有索引数据都是内存存储的(Redis的索引数据 就是keys),也就是说,当vm-max-memory设置为0的时候,其实是所有value都存在于磁盘。默认值为0
* `vm-page-size 32`Redis swap文件分成了很多的page，一个对象可以保存在多个page上面，但一个page上不能被多个对象共享，vm-page-size是要根据存储的 数据大小来设定的，作者建议如果存储很多小对象，page大小最好设置为32或者64bytes；如果存储很大大对象，则可以使用更大的page，如果不 确定，就使用默认值
* `vm-pages 134217728` 设置swap文件中的page数量，由于页表（一种表示页面空闲或使用的bitmap）是在放在内存中的，，在磁盘上每8个pages将消耗1byte的内存。
* `vm-max-threads 4`设置访问swap文件的线程数,最好不要超过机器的核数,如果设置为0,那么所有对swap文件的操作都是串行的，可能会造成比较长时间的延迟。默认值为4
* `glueoutputbuf yes` 设置在向客户端应答时，是否把较小的包合并为一个包发送，默认为开启
* `hash-max-zipmap-entries 64`和`hash-max-zipmap-value 512` 指定在超过一定的数量或者最大的元素超过某一临界值时，采用一种特殊的哈希算法
* `activerehashing yes` 指定是否激活重置哈希，默认为开启
* `include /path/to/local.conf` 指定包含其它的配置文件，可以在同一主机上多个Redis实例之间使用同一份配置文件，而同时各个实例又拥有自己的特定配置文件

### 4、数据类型

Redis支持五种数据类型：

* string（字符串），
* hash（哈希），
* list（列表），
* set（集合）及
* zset(sorted set：有序集合)。

#### （1）String（字符串）

string是redis最基本的类型，你可以理解成与Memcached一模一样的类型，一个key对应一个value。
string类型是二进制安全的。意思是redis的string可以包含任何数据。比如jpg图片或者序列化的对象 。
string类型是Redis最基本的数据类型，一个键最大能存储512MB。

**语法**

存`SET key value`
取`GET key`

**存取**

```
set name "rectcircle"
get name
```

#### （2）Hash（哈希）

Redis hash 是一个键名对集合。
Redis hash是一个string类型的field和value的映射表，hash特别适合用于存储对象。

**语法**

存`HMSET key field value [field value...]`
取`HGETALL key`或`HGET key field`

**存取**

```
HMSET user:1 username rectcircle password 123456
HGETALL user:1
HGET user:1 username
```

每个 hash 可以存储 232 -1 键值对（40多亿）

#### （3）List（列表）

Redis 列表是简单的字符串列表，按照插入顺序排序。你可以添加一个元素到列表的头部（左边）或者尾部（右边）。

**语法**

存`LPUSH key value [value...]`或者`RPUSH key value [value...]`
取`LRANGE key start stop` 包括start、stop

**存取**

```
LPUSH list a b c d
LRANGE list 0 10
LRANGE list 0 3
LRANGE list 0 2
```

#### （4）Set（集合）

Redis的Set是string类型的无序集合。
集合是通过哈希表实现的，所以添加，删除，查找的复杂度都是O(1)。

**语法**

存`sadd key member [member...]`
取`smembers key`

```
SADD set a
SADD set b
SADD set b
SADD set c
SMEMBERS set
```

#### （5）zset(sorted set：有序集合)

Redis zset 和 set 一样也是string类型元素的集合,且不允许重复的成员。
不同的是每个元素都会关联一个double类型的分数。redis正是通过分数来为集合中的成员进行从小到大的排序。
zset的成员是唯一的,但分数(score)却可以重复。

**语法**

存`ZADD key [NX|XX] [CH] [INCR] score member [score member ...]`
取`ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT offset count]`

```
zadd zset 0 a
zadd zset 0 b
zadd zset 0 c
zadd zset 1 d
ZRANGEBYSCORE zset 0 100
```

## 二、命令

***

### 1、客户端启动

```
redis-cli #无密码、本机、默认端口 6379
redis-cli -h 127.0.0.1 -p 6379 -a "mypass" #指定主机、端口、密码
```

### 2、基本命令

> https://redis.io/commands

#### （1）键命令key

例子

```
SET key redis
DEL key
```

**命令列表**

* `DEL key` 该命令用于在 key 存在时删除 key。
* `DUMP key` 序列化给定 key ，并返回被序列化的值。
* `EXISTS key` 检查给定 key 是否存在。
* `EXPIRE key seconds` 为给定 key 设置过期时间。
* `EXPIREAT key` timestamp EXPIREAT 的作用和 EXPIRE 类似，都用于为 key 设置过期时间。 不同在于 EXPIREAT 命令接受的时间参数是 UNIX 时间戳(unix timestamp)。
* `PEXPIRE key milliseconds` 设置 key 的过期时间以毫秒计。
* `PEXPIREAT key milliseconds-timestamp` 设置 key 过期时间的时间戳(unix timestamp) 以毫秒计
* `KEYS pattern` 查找所有符合给定模式( pattern)的 key 。
* `MOVE key` db` 将当前数据库的 key 移动到给定的数据库 db 当中。
* `PERSIST key` 移除 key 的过期时间，key 将持久保持。
* `PTTL key` 以毫秒为单位返回 key 的剩余的过期时间。
* `TTL key` 以秒为单位，返回给定 key 的剩余生存时间(TTL, time to live)。
* `RANDOMKEY` 从当前数据库中随机返回一个key 。
* `RENAME key newkey` 修改 key 的名称
* `RENAMENX key newkey` 仅当 newkey 不存在时，将 key 改名为 newkey 。
* `TYPE key` 返回 key 所储存的值的类型。

#### （2）字符串命令string

* `SET key value` 设置指定 key 的值
* `GET key` 获取指定 key 的值。
* `GETRANGE key start end` 返回 key 中字符串值的子字符
* `GETSET key value` 将给定 key 的值设为 value ，并返回 key 的旧值(old value)。
* `GETBIT key offset` 对 key 所储存的字符串值，获取指定偏移量上的位(bit)。
* `MGET key1 [key2..]` 获取所有(一个或多个)给定 key 的值。
* `SETBIT key offset value` 对 key 所储存的字符串值，设置或清除指定偏移量上的位(bit)。
* `SETEX key seconds value` 将值 value 关联到 key ，并将 key 的过期时间设为 seconds (以秒为单位)。
* `SETNX key value` 只有在 key 不存在时设置 key 的值。
* `SETRANGE key offset value` 用 value 参数覆写给定 key 所储存的字符串值，从偏移量 offset 开始。
* `STRLEN key` 返回 key 所储存的字符串值的长度。
* `MSET key value [key value ...]` 同时设置一个或多个 key-value 对。
* `MSETNX key value [key value ...]` 同时设置一个或多个 key-value 对，当且仅当所有给定 key 都不存在。
* `PSETEX key milliseconds value` 这个命令和 SETEX 命令相似，但它以毫秒为单位设置 key 的生存时间，而不是像 SETEX 命令那样，以秒为单位。
* `INCR key` 将 key 中储存的数字值增一。
* `INCRBY key increment` 将 key 所储存的值加上给定的增量值（increment） 。
* `INCRBYFLOAT key increment` 将 key 所储存的值加上给定的浮点增量值（increment） 。
* `DECR key` 将 key 中储存的数字值减一。
* `DECRBY key decrement key` 所储存的值减去给定的减量值（decrement） 。
* `APPEND key value` 如果 key 已经存在并且是一个字符串， APPEND 命令将 value 追加到 key 原来的值的末尾。

#### （3）哈希hash

* `HDEL key field1 [field2]` 删除一个或多个哈希表字段
* `HEXISTS key field` 查看哈希表 key 中，指定的字段是否存在。
* `HGET key field` 获取存储在哈希表中指定字段的值。
* `HGETALL key` 获取在哈希表中指定 key 的所有字段和值
* `HINCRBY key field increment` 为哈希表 key 中的指定字段的整数值加上增量 increment 。
* `HINCRBYFLOAT key field increment` 为哈希表 key 中的指定字段的浮点数值加上增量 increment 。
* `HKEYS key` 获取所有哈希表中的字段
* `HLEN key` 获取哈希表中字段的数量
* `HMGET key field1 [field2]` 获取所有给定字段的值
* `HMSET key field1 value1 [field2 value2 ]` 同时将多个 field-value (域-值)对设置到哈希表 key 中。
* `HSET key field value` 将哈希表 key 中的字段 field 的值设为 value 。
* `HSETNX key field value` 只有在字段 field 不存在时，设置哈希表字段的值。
* `HVALS key` 获取哈希表中所有值
* `HSCAN key cursor [ MATCH pattern ] [COUNT count]` 迭代哈希表中的键值对。

#### （4）列表(List)

* `BLPOP key1 [key2 ] timeout` 移出并获取列表的第一个元素， 如果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止。
* `BRPOP key1 [key2 ] timeout` 移出并获取列表的最后一个元素， 如果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止。
* `BRPOPLPUSH source destination timeout` 从列表中弹出一个值，将弹出的元素插入到另外一个列表中并返回它； 如果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止。
* `LINDEX key index` 通过索引获取列表中的元素
* `LINSERT key BEFORE|AFTER pivot value` 在列表的元素前或者后插入元素
* `LPUSH key value1 [value2]` 将一个或多个值插入到列表头部
* `LPUSHX key value` 将一个值插入到已存在的列表头部
* `LRANGE key start stop` 获取列表指定范围内的元素
* `LREM key count value` 移除列表元素
* `LSET key index value` 通过索引设置列表元素的值
* `LTRIM key start stop` 对一个列表进行修剪(trim)，就是说，让列表只保留指定区间内的元素，不在指定区间之内的元素都将被删除。
* `RPOPLPUSH source destination` 移除列表的最后一个元素，并将该元素添加到另一个列表并返回
* `RPUSH key value1 [value2]` 在列表中添加一个或多个值`RPUSHX key value 为已存在的列表添加值

#### （5）集合Set

* `SADD key member1 [member2]` 向集合添加一个或多个成员
* `SCARD key` 获取集合的成员数
* `SDIFF key1 [key2]` 返回给定所有集合的差集
* `SDIFFSTORE destination key1 [key2]` 返回给定所有集合的差集并存储在 destination 中
* `SINTER key1 [key2]` 返回给定所有集合的交集
* `SINTERSTORE destination key1 [key2]` 返回给定所有集合的交集并存储在 destination 中
* `SISMEMBER key member` 判断 member 元素是否是集合 key 的成员
* `SMEMBERS key` 返回集合中的所有成员
* `SMOVE source destination member` 将 member 元素从 source 集合移动到 destination 集合
* `SPOP key` 移除并返回集合中的一个随机元素
* `SRANDMEMBER key [count]` 返回集合中一个或多个随机数
* `SREM key member1 [member2]` 移除集合中一个或多个成员
* `SUNION key1 [key2]` 返回所有给定集合的并集
* `SUNIONSTORE destination key1 [key2]` 所有给定集合的并集存储在 destination 集合中
* `SSCAN key cursor [MATCH pattern] [COUNT count]` 迭代集合中的元素

#### （7）有序集合(sorted set)

* `ZADD key score1 member1 [score2 member2]` 向有序集合添加一个或多个成员，或者更新已存在成员的分数
* `ZCARD key` 获取有序集合的成员数
* `ZCOUNT key min max` 计算在有序集合中指定区间分数的成员数
* `ZINCRBY key increment member` 有序集合中对指定成员的分数加上增量 increment
* `ZINTERSTORE destination numkeys key [key ...]` 计算给定的一个或多个有序集的交集并将结果集存储在新的有序集合 key 中
* `ZLEXCOUNT key min max` 在有序集合中计算指定字典区间内成员数量
* `ZRANGE key start stop [WITHSCORES]` 通过索引区间返回有序集合成指定区间内的成员
* `ZRANGEBYLEX key min max [LIMIT offset count]` 通过字典区间返回有序集合的成员
* `ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT]` 通过分数返回有序集合指定区间内的成员
* `ZRANK key member` 返回有序集合中指定成员的索引
* `ZREM key member [member ...]` 移除有序集合中的一个或多个成员
* `ZREMRANGEBYLEX key min max` 移除有序集合中给定的字典区间的所有成员
* `ZREMRANGEBYRANK key start stop` 移除有序集合中给定的排名区间的所有成员
* `ZREMRANGEBYSCORE key min max` 移除有序集合中给定的分数区间的所有成员
* `ZREVRANGE key start stop [WITHSCORES]` 返回有序集中指定区间内的成员，通过索引，分数从高到底
* `ZREVRANGEBYSCORE key max min [WITHSCORES]` 返回有序集中指定分数区间内的成员，分数从高到低排序
* `ZREVRANK key member` 返回有序集合中指定成员的排名，有序集成员按分数值递减(从大到小)排序
* `ZSCORE key member` 返回有序集中，成员的分数值
* `ZUNIONSTORE destination numkeys key [key ...]` 计算给定的一个或多个有序集的并集，并存储在新的 key 中
* `ZSCAN key cursor [MATCH pattern] [COUNT count]` 迭代有序集合中的元素（包括元素成员和元素分值）

#### （8）HyperLogLog

Redis 在 2.8.9 版本添加了 HyperLogLog 结构。
Redis HyperLogLog 是用来做基数统计的算法，HyperLogLog 的优点是，在输入元素的数量或者体积非常非常大时，计算基数所需的空间总是固定 的、并且是很小的。
在 Redis 里面，每个 HyperLogLog 键只需要花费 12 KB 内存，就可以计算接近 2^64 个不同元素的基 数。这和计算基数时，元素越多耗费内存就越多的集合形成鲜明对比。
但是，因为 HyperLogLog 只会根据输入元素来计算基数，而不会储存输入元素本身，所以 HyperLogLog 不能像集合那样，返回输入的各个元素。

**什么是基数（不重复的元素的个数）**

比如数据集 {1, 3, 5, 7, 5, 7, 8}， 那么这个数据集的基数集为 {1, 3, 5 ,7, 8}, 基数(不重复元素)为5。 基数估计就是在误差可接受的范围内，快速计算基数。

例子

```
PFADD runoobkey "a"
PFADD runoobkey "b"
PFADD runoobkey "c"
PFADD runoobkey "c"
PFCOUNT runoobkey
```

* `PFADD key element [element ...]` 添加指定元素到 HyperLogLog 中。
* `PFCOUNT key [key ...]` 返回给定 HyperLogLog 的基数估算值。
* `PFMERGE destkey sourcekey [sourcekey ...]` 将多个 HyperLogLog 合并为一个 HyperLogLog

### 3、高级命令

#### （1）Redis发布订阅

实例

我们创建了订阅频道名为 redisChat:

```
SUBSCRIBE redisChat
```

打开另一个客户端

```
PUBLISH redisChat "Redis is a great caching technique"
PUBLISH redisChat "Learn redis by runoob.com"
```

另一个客户端显示为：

```
Reading messages... (press Ctrl-C to quit)
1) "subscribe"
2) "redisChat"
3) (integer) 1
4) "message"
5) "redisChat"
6) "Redis is a great caching technique"
7) "message"
8) "redisChat"
9) "Learn redis by runoob.com"
```

* `PSUBSCRIBE pattern [pattern ...]` 订阅一个或多个符合给定模式的频道。
* `PUBSUB subcommand [argument [argument ...]]` 查看订阅与发布系统状态。
* `PUBLISH channel message` 将信息发送到指定的频道。
* `PUNSUBSCRIBE [pattern [pattern ...]]` 退订所有给定模式的频道。
* `SUBSCRIBE channel [channel ...]` 订阅给定的一个或多个频道的信息。
* `UNSUBSCRIBE [channel [channel ...]]` 指退订给定的频道。

#### （2）事务

Redis 事务可以一次执行多个命令， 并且带有以下两个重要的保证：

* 事务是一个单独的隔离操作：事务中的所有命令都会序列化、按顺序地执行。事务在执行的过程中，不会被其他客户端发送来的命令请求所打断。
* 事务是一个原子操作：事务中的命令要么全部被执行，要么全部都不执行。

一个事务从开始到执行会经历以下三个阶段：

* 开始事务。
* 命令入队。
* 执行事务。

事务中出现错误

* 语法错误：所有的指令都不会执行
* 运行错误：仍会执行，**不会回滚**

例子， 它先以 MULTI 开始一个事务， 然后将多个命令入队到事务中， 最后由 EXEC 命令触发事务， 一并执行事务中的所有命令：

```
MULTI
SET book-name "Mastering C++ in 21 days"
GET book-name
SADD tag "C++" "Programming" "Mastering Series"
SMEMBERS tag
EXEC
```

* `DISCARD` 取消事务，放弃执行事务块内的所有命令。
* `EXEC` 执行所有事务块内的命令。
* `MULTI` 标记一个事务块的开始。
* `UNWATCH` 取消 WATCH 命令对所有 key 的监视。
* `WATCH key [key ...]` 监视一个(或多个) key ，如果在事务执行之前这个(或这些) key 被其他命令所改动，那么事务将被打断。
	* 也就是说当在当前连接中watch了一个key，当执行一个set时，别的连接修改了这个key，当前修改将失败（类似于CAS），返回nil成功返回ok
	* 执行玩exec之后自动unwatch

#### （3）Redis 脚本命令

略

#### （4）Redis 连接

* `AUTH password` 验证密码是否正确
* `ECHO message` 打印字符串
* `PING` 查看服务是否运行
* `QUIT` 关闭当前连接
* `SELECT index` 切换到指定的数据库

#### （5）Redis 服务器

* `BGREWRITEAOF 异步执行一个 AOF（AppendOnly File）` 文件重写操作
* `BGSAVE` 在后台异步保存当前数据库的数据到磁盘
* `CLIENT KILL [ip:port] [ID client-id]` 关闭客户端连接
* `CLIENT LIST` 获取连接到服务器的客户端连接列表
* `CLIENT GETNAME` 获取连接的名称
* `CLIENT PAUSE timeout` 在指定时间内终止运行来自客户端的命令
* `CLIENT SETNAME connection-name` 设置当前连接的名称
* `CLUSTER SLOTS` 获取集群节点的映射数组
* `COMMAND` 获取 Redis 命令详情数组
* `COMMAND COUNT` 获取 Redis 命令总数
* `COMMAND GETKEYS` 获取给定命令的所有键
* `TIME` 返回当前服务器时间
* `COMMAND INFO command-name [command-name ...]` 获取指定 Redis 命令描述的数组
* `CONFIG GET parameter` 获取指定配置参数的值
* `CONFIG REWRITE 对启动 Redis` 服务器时所指定的 redis.conf 配置文件进行改写
* `CONFIG SET parameter value` 修改 redis 配置参数，无需重启
* `CONFIG RESETSTAT` 重置 INFO 命令中的某些统计数据
* `DBSIZE` 返回当前数据库的 key 的数量
* `DEBUG OBJECT key` 获取 key 的调试信息
* `DEBUG SEGFAULT` 让 Redis 服务崩溃
* `FLUSHALL` 删除所有数据库的所有key
* `FLUSHDB` 删除当前数据库的所有key
* `INFO [section]` 获取 Redis 服务器的各种信息和统计数值
* `LASTSAVE` 返回最近一次 Redis 成功将数据保存到磁盘上的时间，以 UNIX 时间戳格式表示
* `MONITOR` 实时打印出 Redis 服务器接收到的命令，调试用
* `ROLE` 返回主从实例所属的角色
* `SAVE` 异步保存数据到硬盘
* `SHUTDOWN [NOSAVE] [SAVE]` 异步保存数据到硬盘，并关闭服务器
* `SLAVEOF host port` 将当前服务器转变为指定服务器的从属服务器(slave server)
* `SLOWLOG subcommand [argument]` 管理 redis 的慢日志
* `SYNC` 用于复制功能(replication)的内部命令

## 三、高级话题

***

### 1、Redis 数据备份与恢复

#### （1）保存

```
SAVE
Bgsave #后台保存
```

#### （2）恢复

如果需要恢复数据，只需将备份文件 (dump.rdb) 移动到 redis 安装目录并启动服务即可。获取 redis 目录可以使用 CONFIG 命令，如下所示：

```
CONFIG GET dir
```

### 2、Redis 安全

#### （1）查看是否设置密码

```
CONFIG get requirepass
```

#### （2）设置密码

```
CONFIG set requirepass "123456"
```

#### （3）登录

```
AUTH 123456
```

### 3、Redis 性能测试

#### （1）语法

```
redis-benchmark [option] [option value]
```

#### （2）例子

```
redis-benchmark -n 10000
```

### 4、Redis 客户端连接

略

### 5、Redis 管道技术

略

### 6、Redis 分区

略

## 四、Java 使用 Redis

***

### 1、直接使用

#### （1）引入

[jedis](http://mvnrepository.com/artifact/redis.clients/jedis)

#### （2）使用

```java
import redis.clients.jedis.Jedis;

public class RedisStringJava {
    public static void main(String[] args) {
        //连接本地的 Redis 服务
        Jedis jedis = new Jedis("localhost");
        System.out.println("连接成功");
        //设置 redis 字符串数据
        jedis.set("runoobkey", "www.runoob.com");
        // 获取存储的数据并输出
        System.out.println("redis 存储的字符串为: "+ jedis.get("runoobkey"));
    }
}
```

### 2、spring Boot使用Redis作为缓存

#### （1）引入依赖

```xml
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

#### （2）配置redis服务器相关信息

打开`application.properties`相关配置项以`spring.redis.`开头

```
# 配置redis
spring.redis.host=localhost
spring.redis.password=123456
```

#### （3）在启动类上或者配置类添加`@EnableCaching`注解

#### （4）对Redis进行详细配置（可选）

```java
package cn.rectcircle.ssm.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurerSupport;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.jedis.JedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 *
 * RedisTemplate< String, String >类型是自动spring boot创建的bean
 *
 * @author Rectcircle
 * @date 2017/11/2
 */
@Configuration
@EnableCaching
public class RedisConfig extends CachingConfigurerSupport {

//	/**
//	 * 自定义key. 这个可以不用
//	 * 此方法将会根据类名+方法名+所有参数的值生成唯一的一个key,即使@Cacheable中的value属性一样，key也会不一样。
//	 */
//	@Bean
//	@Override
//	public KeyGenerator keyGenerator() {
//		System.out.println("RedisCacheConfig.keyGenerator()");
//		return new KeyGenerator () {
//			@Override
//			public Object generate (Object o, Method method, Object...objects){
//				// This will generate a unique key of the class name, the method name
//				//and all method parameters appended.
//				StringBuilder sb = new StringBuilder();
//				sb.append(o.getClass().getName());
//				sb.append(method.getName());
//				for (Object obj : objects) {
//					sb.append(obj.toString());
//				}
//				System.out.println("keyGenerator=" + sb.toString());
//				return sb.toString();
//			}
//		} ;
//	}
//

	@Bean
	public CacheManager cacheManager(RedisTemplate objectRedisTemplate) {
		RedisCacheManager rcm = new RedisCacheManager(objectRedisTemplate);
       /* //设置缓存过期时间
        // rcm.setDefaultExpiration(60);//秒
        //设置value的过期时间
        Map<String,Long> map=new HashMap();
        map.put("test",60L);
        rcm.setExpires(map);*/
		return rcm;
	}

	/**
	 * 创建对Redis进行简单操作的Bean，方便操作
	 */
	@Bean
	ValueOperations<String, String> stringOperations(RedisTemplate<String, String> redisTemplate) {
		return redisTemplate.opsForValue();
	}

	/**
	 * 创建其他类型的RedisTemplate，此处创建RedisTemplate< String, Integer >
	 */
	@Bean
	RedisTemplate<String, Integer> integerRedisTemplate(JedisConnectionFactory connectionFactory) {
		RedisTemplate<String, Integer> redisTemplate = new RedisTemplate<>();
		redisTemplate.setConnectionFactory(connectionFactory);
		return redisTemplate;
	}

	/**
	 * 类似于strOperations
	 */
	@Bean
	ValueOperations<String, Integer> intOperations(RedisTemplate<String, Integer> integerRedisTemplate) {
		return integerRedisTemplate.opsForValue();
	}

	/**
	 * RedisTemplate对象默认使用jdkSerializer实现序列化，
	 * 如果想要更换序列化的实现方式，
	 * 例如使用json实现value的序列化，可以进行如下配置
	 */
	@Bean
	Jackson2JsonRedisSerializer<Object> jackson2JsonRedisSerializer(ObjectMapper objectMapper) {
		Jackson2JsonRedisSerializer<Object> jackson2JsonRedisSerializer = new Jackson2JsonRedisSerializer<>(
				Object.class);
		jackson2JsonRedisSerializer.setObjectMapper(objectMapper);
		return jackson2JsonRedisSerializer;
	}

	/**
	 * 创建对对象操作的RedisTemplate Bean
	 */
	@Bean
	RedisTemplate<String, Object> objectRedisTemplate(RedisConnectionFactory connectionFactory,
	                                               Jackson2JsonRedisSerializer<Object> jackson2JsonRedisSerializer) {
		RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
		redisTemplate.setConnectionFactory(connectionFactory);
		redisTemplate.setDefaultSerializer(jackson2JsonRedisSerializer);
		StringRedisSerializer stringRedisSerializer = new StringRedisSerializer();
		redisTemplate.setKeySerializer(stringRedisSerializer);
		redisTemplate.setHashKeySerializer(stringRedisSerializer);
		return redisTemplate;
	}

	/**
	 * 创建对对象操作的RedisTemplate Bean
	 */
	@Bean
	RedisTemplate<String, String> stringRedisTemplate(RedisConnectionFactory connectionFactory,
	                                               Jackson2JsonRedisSerializer<Object> jackson2JsonRedisSerializer) {
		RedisTemplate<String, String> redisTemplate = new RedisTemplate<>();
		redisTemplate.setConnectionFactory(connectionFactory);
		redisTemplate.setDefaultSerializer(jackson2JsonRedisSerializer);
		StringRedisSerializer stringRedisSerializer = new StringRedisSerializer();
		redisTemplate.setKeySerializer(stringRedisSerializer);
		redisTemplate.setHashKeySerializer(stringRedisSerializer);
		return redisTemplate;
	}
}

```

#### （5）直接使用

在Service中使用上面配置的Bean

#### （6）在方法上添加**`@Cacheable`**注解

**说明**

* @Cacheable可以标记在一个方法上，也可以标记在一个类上。
* 当标记在一个方法上时表示该方法是支持缓存的，
* 当标记在一个类上时则表示该类所有的方法都是支持缓存的

**注解属性**

* `value`属性是必须指定的，其表示当前方法的返回值是会被缓存在哪个Cache上的，对应Cache的名称。其可以是一个Cache也可以是多个Cache，当需要指定多个Cache时其是一个数组。
* `key`属性自定义key，支持`SpringEL`表达式，语法
	* `#参数名`
	* `#参数名.属性名`
	* `#p参数index`如`#p0.id`
	* `#root.methodName`当前方法名
	* `#root.method.name`当前方法
	* `#root.target`当前被调用的对象
	* `#root.targetClass`当前被调用的对象的class
	* `#root.args[0]`当前方法参数组成的数组
	* `#root.caches[0].name`当前被调用的方法使用的Cache
* `condition`指定发生的条件，支持SpringEL
	* 例子： `condition="#user.id%2==0"`

**执行过程**：

调用此方法时，spring生成Key，在缓存中查询是否存在，若不存再执行此方法，然后将返回值最为value将key-value写入缓存

#### （6）在方法上添加**`@CachePut`**注解

属性一致
执行过程：直接执行方法体，将返回值写入缓存

#### （7）**`@CacheEvict`**

当标记在一个类上时表示其中所有的方法的执行都会触发缓存的清除操作
属性有value、key、condition、allEntries和beforeInvocation
其中value、key和condition的语义与@Cacheable对应的属性类似

* allEntries 表示是否需要清除缓存中的所有元素。默认为false，表示不需要。当指定了allEntries为true时，Spring Cache将忽略指定的key
* beforeInvocation 清除操作默认是在对应方法成功执行之后触发的，即方法如果因为抛出异常而未能成功返回时也不会触发清除操作。使用beforeInvocation可以改变触发清除操作的时间，当我们指定该属性值为true时，Spring会在调用该方法之前清除缓存中的指定元素

#### （8）**`@Caching`**

@Caching注解可以让我们在一个方法或者类上同时指定多个Spring Cache相关的注解。其拥有三个属性：cacheable、put和evict，分别用于指定@Cacheable、@CachePut和@CacheEvict。

```java
   @Caching(cacheable = @Cacheable("users"), evict = { @CacheEvict("cache2"),

         @CacheEvict(value = "cache3", allEntries = true) })

   public User find(Integer id) {

      returnnull;

   }
```

### 3、Spring Boot使用Redis缓存Session

#### （1）[完成以上配置](#2、spring Boot使用Redis作为缓存)

#### （2）添加session依赖

```xml
		<dependency>
			<groupId>org.springframework.session</groupId>
			<artifactId>spring-session</artifactId>
		</dependency>
```

#### （3）配置session仓库

```
spring.session.store-type=redis
```

#### （4）在SpringMVC Controller方法中添加session参数
