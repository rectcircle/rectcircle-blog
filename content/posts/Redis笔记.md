---
title: Redis笔记
date: 2017-02-26T14:52:55+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/44
  - /detail/44/
tags:
  - sql
---

> 已废弃 参见 [Redis速查](109)

## 目录

* [一、简介与安装](#一、简介与安装)
* [二、数据类型](#二、数据类型)
* [三、系统管理](#三、系统管理)
* [四、时间相关命令](#四、时间相关命令)
* [五、Redis设置相关命令](#五、Redis设置相关命令)
* [六、Redis的高级应用](#六、Redis的高级应用)




## 一、简介与安装

### 1.1 Redis是什么

REmote DIctionary Server(Redis) 是一个由Salvatore Sanfilippo写的key-value存储系统。Redis提供了一些丰富的数据结构，包括 lists, sets, ordered sets 以及 hashes ，当然还有和Memcached一样的 strings结构.Redis当然还包括了对这些数据结构的丰富操作。

Redis常被称作是一款数据结构服务器（data structure server）。Redis的键值可以包括字符串（strings）类型，同时它还包括哈希（hashes）、列表（lists）、集合（sets）和 有序集合（sorted sets）等数据类型。 对于这些数据类型，你可以执行原子操作。例如：对字符串进行附加操作（append）；递增哈希中的值；向列表中增加元素；计算集合的交集、并集与差集等。

### 1.2 Redis的优点

性能极高 – Redis能支持超过 100K+ 每秒的读写频率。

丰富的数据类型 – Redis支持二进制案例的 Strings, Lists, Hashes, Sets 及 Ordered Sets 数据类型操作。

原子 – Redis的所有操作都是原子性的，同时Redis还支持对几个操作全并后的原子性执行。

丰富的特性 – Redis还支持 publish/subscribe, 通知, key 过期等等特性。


### 1.3 Redis的安装步骤
#### 1.3.1 下载Redis的安装包
```bash
$ cd
$ wget http://labfile.oss.aliyuncs.com/files0422/redis-2.8.9.tar.gz
```

#### 1.3.2 在目录下，解压按照包，生成新的目录redis-2.8.9
```bash
$ tar xvfz redis-2.8.9.tar.gz
```

#### 1.3.3 进入解压之后的目录,进行编译
```bash
$ cd redis-2.8.9
$ make
$ make install
```

#### 1.3.4 在安装成功之后，可以运行测试，确认Redis的功能是否正常
```
$ make test
```

### 1.4  启动
#### 1.4.1 查看重要文件
在 Redis 安装完成后，注意一些重要的文件，可用 ls 命令查看。服务端：src/redis-server，客户端：src/redis-cli，默认配置文件：redis.conf
```bash
$ ls
$ cd src
$ ls
```


#### 1.4.2 然后将可执行文件放置在$PATH环境目录下，便于以后执行程序时可以不用输入完整的路径
```bash
$　cp redis-server /usr/local/bin/
$　cp redis-cli /usr/local/bin/
```

#### 1.4.3 启动Redis-server
```bash
$ redis-server
```


### 1.5 查看Redis
```bash
# 通过进程查看
$ ps -ef | grep redis
# 通过启动命令检查Redis服务器状态
$ netstat -nlt|grep 6379
```



## 二、数据类型
### 2.1 Redis strings
字符串是一种最基本的Redis值类型。Redis字符串是二进制安全的，这意味着一个Redis字符串能包含任意类型的数据，例如： 一张JPEG格式的图片或者一个序列化的Ruby对象。一个字符串类型的值最多能存储512M字节的内容。

我们继续上一个实验,启动redis-cli来看看Redis strings数据类型。
```
$ redis-cli
> set mykey somevalue
> get mykey
```

如上例所示，可以SET和GET命令来创建和检索strings。注意,set命令将取代现有的任何已经存在的key。SET命令还有一个提供附加参数的选项,我们能够让SET命令只有在没有相同key的情况下成功，反之亦然，可以让SET命令在有相同key值得情况下成功。
```
> set mykey newval nx
> set mykey newval xx
```


### 2.2 Redis Lists
Redis列表是简单的字符串列表，按照插入顺序排序。你可以添加一个元素导列表的头部（左边）或者尾部（右边） LPUSH 命令插入一个新的元素导头部, 而 RPUSH插入一个新元素导尾部.当一个这两个操作在一个空的Key上被执行的时候一个新的列表被创建。相似的，如果一个列表操作清空一个列表那么对应的key将被从key空间删除。这是非常方便的语义，因为他们被调用使用一个空列表完全就像他们被调用时使用一个不存在的键值（可以）做为参数。

PUSH一类的命令的返回值为list的长度。一些类表操作和结果的例子：
```
> rpush mylist A
> rpush mylist B
> lpush mylist first
> lrange mylist 0 -1
```


注意：LRANGE 利用了两个检索值，0表示list的开头第一个，-1表示list的倒数第一个，即最后一个。-2则便是list的倒数第二个，以此类推。

这些命令都是可变的命令，也就是说你可以一次加入多个元素放入list。

```
> rpush mylist 1 2 3 4 5 "foo bar"
> lrange mylist 0 -1
```


在Redis的命令操作中，还有一类重要的操作：POP，取出list元素。和PUSH操作类似，POP命令可以选择不同的方向取出元素.POP命令返回值为取出的元素。
```
> del mylist
> rpush mylist a b c
> rpop mylist
> lrange mylist 0 -1
> lpop mylist
 > lrange mylist 0 -1
```

### 2.3 Redis Hashes
Redis Hashes是字符串字段和字符串值之间的映射,因此他们是展现对象的完美数据类型。 (例如:一个有名，姓，年龄等等属性的用户):一个带有一些字段的hash仅仅需要一块很小的空间存储,因此你可以存储数以百万计的对象在一个小的Redis实例中。 哈希主要用来表现对象，他们有能力存储很多对象，因此你可以将哈希用于许多其他的任务。

```
> hmset user:1000 username antirez birthyear 1977 verified 1
> hget user:1000 username
> hget user:1000 birthyear
> hgetall user:1000
```

HMSET命令设置一个多域的hash表，HGET命令获取指定的单域，HGETALL命令获取指定key的所有信息。HMGET类似于HGET，只是返回一个value数组。
```
> hmget user:1000 username birthyear no-such-field
```

同样可以根据需要对hash表的表项进行单独的操作，例如 HINCRBY， （原本birthyear 为1977，见上一图）


### 2.4 Redis 无序集合
Redis 集合（Set）是一个无序的字符串集合. 你可以以O(1)的时间复杂度 (无论集合中有多少元素时间复杂度都是常量)完成添加，删除，以及测试元素是否存在。 Redis 集合拥有令人满意的不允许包含相同成员的属性。多次添加相同的元素，最终在集合里只会有一个元素。 实际上说这些就是意味着在添加元素的时候无须检测元素是否存在。 一个Redis集合的非常有趣的事情是他支持一些服务端的命令从现有的集合出发去进行集合运算，因此你可以在非常短的时间内进行合并（unions）, 求交集（intersections）,找出不同的元素（differences of sets）。
```
> sadd myset 1 2 3
> smembers myset
```
SADD命令产生一个无序集合，返回集合的元素个数。SMEMBER用于查看集合。

SISMEMBER用于查看集合是否存在，匹配项包括集合名和元素个数。匹配成功返回1，匹配失败返回0.
```
> sismember myset 3
> sismember myset 30
> sismember mys 3
```


### 2.5 Redis有序集合
Redis有序集合与普通集合非常相似，是一个没有重复元素的字符串集合。不同之处是有序集合的每一个成员都关联了一个评分，这个评分被用来按照从最低分到最高分的方式排序集合中的成员。集合的成员是唯一的，但是评分可以是重复了。 使用有序集合你可以以非常快的速度（O(log(N))）添加，删除和更新元素。因为元素是有序的, 所以你也可以很快的根据评分（score）或者次序（position）来获取一个范围的元素。访问有序集合的中间元素也是非常快的,因此你能够使用有序集合作为一个没有重复成员的智能列表。在有序集合中，你可以很快捷的访问一切你需要的东西：有序的元素，快速的存在性测试，快速访问集合的中间元素！ 简而言之使用有序集合你可以做完成许多对性能有极端要求的任务，而那些任务使用其他类型的数据库真的是很难完成的。

ZADD与SADD类似，但是在元素之前多了一个参数，这个参数便是用于排序的。形成一个有序的集合。
```
zadd hackers 1940 "Alan Kay"
zadd hackers 1957 "Sophie Wilson"
zadd hackers 1953 "Richard Stallman"
zadd hackers 1949 "Anita Borg"
zadd hackers 1965 "Yukihiro Matsumoto"
zadd hackers 1914 "Hedy Lamarr"
zadd hackers 1916 "Claude Shannon"
zadd hackers 1969 "Linus Torvalds"
zadd hackers 1912 "Alan Turing"
```

查看集合ZRANGE是查看正序的集合，ZREVRANGE是查看反序的集合。0表示集合第一个元素，-1表示集合的倒数第一个元素。
```
> zrange hackers 0 -1
> zrevrange hackers 0 -1
```
使用WITHSCORES 参数返回记录值。
```
> zrange hackers 0 -1 withscores
```



## 三、系统管理
### 3.1 适合全体类型的常用命令
#### 3.1.1 EXISTS and DEL
EXISTS key 判断一个key是否存在;存在返回 1;否则返回0; DEL key 删除某个key,或是一系列key;DEL key1 key2 key3 key4。成功返回1，失败返回0（key值不存在）。
```
> set mykey hello
> exists mykey
> del mykey
> exists mykey
```


#### 3.1.2 TYPE and KEYS
TYPE key：返回某个key元素的数据类型 ( none:不存在,string:字符,list,set,zset,hash)，key不存在返回空。 KEYS key—pattern ：返回匹配的key列表 (KEYS foo*:查找foo开头的keys)
```
> set mykey x
> type mykey
> keys my*
> del mykey
> keys my*
> type mykey
```


#### 3.1.3 RANDOMKEY and CLEAR
RANDOMKEY ： 随机获得一个已经存在的key，如果当前数据库为空，则返回空字符串
```
> randomkey
```
CLEAR ：清除界面。
```
> clear
```


#### 3.1.4 RENAME and RENAMENX
RENAME oldname newname：改key的名字，新键如果存在将被覆盖 RENAMENX oldname newname：更改key的名字，如果名字存在则更改失败

笔者randomkey结果为mylist，将此key值更名为newlist。

```
> randomkey
> rename mylist newlist
> exists mylist
> exists newlist
```


#### 3.1.5 DBSIZE
DBSIZE ：返回当前数据库的key的总数
```
> dbsize
```



## 四、时间相关命令
### 4.1 限定key生存时间
这同样是一个无视数据类型的命令，对于临时存储很有用处。避免进行大量的DEL操作。

EXPIRE：设置某个key的过期时间（秒）,(EXPIRE bruce 1000：设置bruce这个key1000秒后系统自动删除)注意：如果在还没有过期的时候，对值进行了改变，那么那个值会被清除。
```
> set key some-value
> expire key 10
> get key       (马上执行此命令)
> get key       (10s后执行此命令)
```


### 4.2 查询key剩余生存时间
限时操作可以再SET命令中实现，并且可用TTL命令查询key剩余生存时间。 TTL：查找某个key还有多长时间过期,返回时间秒
```
> set key 100 ex 30
> ttl key
> ttl key
```

### 4.3 清除key
FLUSHDB：清空当前数据库中的所有键

FLUSHALL：清空所有数据库中的所有键

```
>flushdb
>flushall
```

## 五、Redis设置相关命令
Redis有其配置文件，可以通过client-command窗口查看或者更改相关配置。相关命令介绍如下：

### 5.1 CONFIG GET and CONFIG SET
CONFIG GET：用来读取运行Redis服务器的配置参数。 CONFIG SET：用于更改运行Redis服务器的配置参数。 AUTH : 认证密码 下面针对Redis密码的示例：

```
> config get requirepass （查看密码）
> config set requirepass test123 （设置密码为test123 ）
> config get requirepass  （报错，没有认证）
> auth test123
> config get requirepass
```

由结果可知，刚开始时Reids并未设置密码，密码查询结果为空。然后设置密码为test123，再次查询报错。经过auth命令认证后，可正常查询。

可以经过修改Redis的配置文件redis.conf修改密码。

CONFIG GET命令是以list的key-value对显示的，如查询数据类型的最大条目：

```
> config get *max-*-entries*
```

### 5.2 重置报告
CONFIG RESETSTAT：重置数据统计报告，通常返回值为'OK"。

```
> CONFIG RESETSTAT
```


### 5.3 查询信息
INFO [section] ：查询Redis相关信息。 INFO命令可以查询Redis几乎所有的信息，其命令选项有如下：

1. server: Redis server的常规信息
1. clients: Client的连接选项
1. memory: 存储占用相关信息
1. persistence: RDB and AOF 相关信息
1. stats: 常规统计
1. replication: Master/slave请求信息
1. cpu: CPU 占用信息统计
1. cluster: Redis 集群信息
1. keyspace: 数据库信息统计
1. all: 返回所有信息
1. default: 返回常规设置信息


若命令参数为空，info命令返回所有信息。
```
> info keyspace
> info server
```

## 六、Redis的高级应用
### 6.1 安全性
设置在客户端连接是需要指定的密码（由于redis速度相当的快，一秒钟可以150K次的密码尝试，所以需要设置一个密码强度很大的密码）。

设置密码的方式有两种：

（1） 使用config set 命令的requirepass 参数，具体格式为config set requirepass “password”。 
（2） 配置redis.conf 中设置requirepass属性，后面为密码。

输入认证的方式也有两种：

（1） 登录时可以 redis-cli -a password
（2）登录后使用 auth password


### 6.2 设置密码

第一种密码设置方式在上一个实验中已经提到，（在CONFIG SET命令讲解的实例），此处我们来看看第二种方式设置密码。

首先需要进入Redis的安装目录，然后修改配置文件redis.conf。根据grep命令的结果，使用vi编辑器修改“# requirepass foobared” 为“requirepass test123”，然后保存退出。

```
$ grep -n requirepass /etc/redis/redis.conf
$ sudo vim /etc/redis/redis.conf
```


### 6.3 重启redis-server 与redis-cli

重启redis server。

```
$ sudo service redis-server restart
```

进入到redis-cli交互界面进行验证

```
$ redis-cli
> info
> auth test123
> info
> exit
```
结果表明第一次info命令失败，在auth认证之后info命令正常返回。最后退出redis-cli。

另外一种密码认证方式：

```
$ redis-cli -a test123
> info
```



### 6.4 主从复制
由于环境的原因，在此处笔者大致讲解主从复制的工作流程，不做实验。

Redis的主从复制配置和使用都比较简单，通过主从复制可以允许多个slave server拥有和master server相同的数据库副本。

从服务器只能读，不能写。

Redis主从复制特点：

1、master可以拥有多个slave。

2、多个slave可以连接同一个master外，还可以连接到其他的slave。（当master宕机后，相连的slave转变为master）

3、主从复制不会阻塞master，再同步数据时，master可以继续处理client请求。

4、提高了系统的可伸缩性。

Redis主从复制的过程：

1、Slave与master建立连接，发送sync同步命令。

2、 Master会启动一个后台进程，将数据库快照保存到文件中，同时Master主进程会开始收集新的写命令并缓存。

3、 后台完成保存后，就将此文件发送给Slave。

4、 Slave将此文件保存到磁盘上。


### 6.5 事务处理

Redis的事务处理比较简单。只能保证client发起的事务中的命令可以连续的执行，而且不会插入其他的client命令，当一个client在连接中发出multi命令时，这个连接就进入一个事务的上下文，该连接后续的命令不会执行，而是存放到一个队列中，当执行exec命令时，redis会顺序的执行队列中的所有命令。如果其中执行出现错误，执行正确的不会回滚，不同于关系型数据库的事务。

```
> multi
> set name a
> set name b
> exec
> get name
```

### 6.6 持久化机制

Redis是一个支持持久化的内存数据库，Redis需要经常将内存中的数据同步到磁盘来保证持久化。

Redis支持两种持久化方式：

1、snapshotting（快照），将数据存放到文件里，默认方式。

是将内存中的数据已快照的方式写入到二进制文件中，默认文件dump.rdb，可以通过配置设置自动做快照持久化的方式。可配置Redis在n秒内如果超过m个key被修改就自动保存快照。

save 900 1 #900秒内如果超过1个key被修改，则发起快照保存

save 300 10 #300秒内如果超过10个key被修改，则快照保存

2、 Append-only file（缩写为aof），将读写操作存放到文件中。

由于快照方式在一定间隔时间做一次，所以如果Redis意外down掉的话，就会丢失最后一次快照后的所有修改。

aof比快照方式有更好的持久化性，是由于使用aof时，redis会将每一个收到的写命令都通过write函数写入到文件中当redis启动时会通过重新执行文件中保存的写命令来在内存中重新建立整个数据库的内容。

由于os会在内核中缓存write做的修改，所以可能不是立即写到磁盘上，这样aof方式的持久化也还是有可能会丢失一部分数据。可以通过配置文件告诉redis我们想要通过fsync函数强制os写入到磁盘的时机。


配置文件中的可配置参数：

```
appendonly   yes     //启用aof持久化方式
#appendfsync  always //收到写命令就立即写入磁盘，最慢，但是保证了数据的完整持久化
appendfsync   everysec  //每秒中写入磁盘一次，在性能和持久化方面做了很好的折中
#appendfsync  no     //完全依赖os，性能最好，持久化没有保证
```
在redis-cli的命令中，SAVE命令是将数据写入磁盘中。

```
> help save
>save
```

### 6.7 虚拟内存的使用

虚拟内存管理在2.6及之上版本取消了，在安装实验中，选择的是2.8.9版本的redis ，所有实验中的配置文件中没有虚拟内存管理功能的配置选项。此处仅为讲解

Redis的虚拟内存是暂时把不经常访问的数据从内存交换到磁盘中，从而腾出内存空间用于其他的访问数据，尤其对于redis这样的内存数据库，内存总是不够用的。除了分隔到多个redis server外，提高数据库的容量的方法就是使用虚拟内存，把那些不常访问的数据交换到磁盘上。

通过配置vm相关的redis.config配置：

```
vm-enable  yes                   #开启vm功能
vm-swap-file    /tmp/redis.swap  #交换出来的value保存的文件路径
vm-max-memory    10000000        #redis使用的最大内存上线
vm-page-size   32       #每个页面的大小32字节
vm-pages     123217729    #最多使用多小个页面
vm-max-threads     4        #用于执行value对象换入的工作线程数量
```




