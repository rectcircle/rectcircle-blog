---
title: MongoDB笔记
date: 2017-02-25T16:14:02+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/43
  - /detail/43/
tags:
  - sql
---

## 一、简介

***

MongoDB 是一个介于关系数据库和非关系数据库之间的产品，是非关系数据库当中功能最丰富，最像关系数据库的。他支持的数据结构非常松散，是类似json的bson格式，因此可以存储比较复杂的数据类型。

面向集合的存储：
MongoDB 中，一个数据库包含多个集合，类似于MySql中一个数据库包含多个表；一个集合包含多个文档，类似于MySql中一个表包含多条数据。

启动服务

```bash
sudo service mongodb start
```

停止服务

```
mongod --shutdown
```

## 二、基本概念

***

### 2.1 数据库

* 一个mongoDB可以创建多个数据库
* 使用show dbs可以查看所有数据库的列表
* 执行db命令则可以查看当前数据库对象或者集合
* 运行use命令可以连接到指定的数据库

注意：数据库名可以是任何字符，但是不能有空格、点号和$字符

## 2.2 文档

文档是mongoDB的核心，类似于SQLite数据库（关系数据库）中的每一行数据。多个键及其关联的值放在一起就是文档。在mongodb中使用一种类json的bson存储数据，bson数据可以理解为在json的基础上添加了一些json中没有的数据类型。
例：

```json
{"company":"Chenshi keji"}
```

## 2.3 文档的逻辑联系

假设有两个文档：

```json
{
   "name": "Tom Hanks",
   "contact": "987654321",
   "dob": "01-01-1991"
}#user文档

{
   "building": "22 A, Indiana Apt",
   "pincode": 123456,
   "city": "chengdu",
   "state": "sichuan"
}#address文档
```

**关系1：**嵌入式关系：把address文档嵌入到user文档中

```json
{
   "name": "Tom Hanks",
   "contact": "987654321",
   "dob": "01-01-1991",
   "address":
   [{
   "building": "22 A, Indiana Apt",
   "pincode": 123456,
   "city": "chengdu",
   "state": "sichuan"
    },
    {
    "building": "170 A, Acropolis Apt",
    "pincode": 456789,
    "city": "beijing",
    "state": "beijing"
    }]
}#这就是嵌入式的关系
```

**关系2：**引用式关系：将两个文档分开，通过引用文档的_id字段来建立关系

```json
{
   "contact": "987654321",
   "dob": "01-01-1991",
   "name": "Tom Benzamin",
   "address_ids": [
      ObjectId("52ffc4a5d85242602e000000")    #对应address文档的id字段
   ]
}#这就是引用式关系
```

## 2.4 集合

集合就是一组文档的组合，就相当于是关系数据库中的表，在mongodb中可以存储不同的文档结构的文档 例:

```json
{"company":"Chenshi keji"} {"people":"man","name":"peter"}
```

上面两个文档就可以存储在同一个集合中

## 2.5 元数据

数据库的信息存储在集合中，他们统一使用系统的命名空间：DBNAME.system.* DBNAME可用db或数据库名替代

* DBNAME.system.namespaces ：列出所有名字空间
* DBNAME.system.indexs ：列出所有索引
* DBNAME.system.profile ：列出数据库概要信息
* DBNAME.system.users ：列出访问数据库的用户
* DBNAME.system.sources ：列出服务器信息

## 三、数据库基本操作

***

### 3.1 创建数据库

使用 use 命令创建，切换数据库：

```
use mydb
```

查看当前连接的数据库：

```
db
```

查看所有的数据库

```
show dbs
```

列出的所有数据库中看不到 mydb或者显示mydb(empty) ，因为 mydb 为空，里面没有任何东西，MongoDB不显示或显示mydb(empty)。

### 3.2 销毁数据库

使用 `db.dropDatabase()` 销毁数据库：

```
> use local
 switched to db local
> db.dropDatabase()
```

### 3.3 创建集合

在mydb中创建一个集合

```
> use mydb
switched to db mydb
> db.createCollection("users")
```

查看创建的集合：

```
> show collections
```

### 3.4 删除集合

2、删除集合

删除集合的方法如下：（删除 users 集合）

```
> show collections
> db.users.drop()
```

查看是否删除成功：

```
> show collections
```

### 3.5 向集合中插入数据

#### 3.5.1 使用`insert()`

插入数据时，如果 users 集合没有创建会自动创建。

```
> use mydb
switched to db mydb
> db.users.insert([
... { name : "jam",
... email : "jam@qq.com"
... },
... { name : "tom",
... email : "tom@qq.com"
... }
... ])
```

操作实例：

```
> userdoc1=({"user_id":1,"name":"cloud","state":"active","actor":"user","e-mail":"test@qq.com","VM_num":2,"time":[{"date":"2014-08-12","hour":"10:53 PM"}] })
> userdoc2=({"user_id":2,"name":"testadmin","state":"active","actor":"admin","e-mail":"test@qq.com","VM_num":2,"time":[{"date":"2014-08-11","hour":"06:34 AM"}] })
> doc1=({"name":"peter","position":"teacher"})        #先定义文档
> use Chenshi
switched to db Chenshi
> db.shiyanlou.insert(userdoc1)
WriteResult({"nInserted":1})
> db.shiyanlou.insert(userdoc2)
WriteResult({"nInserted":1})
> db.shiyanlou.insert(doc1)
WriteResult({"nInserted":1})
```

插入文档成功，当然也可以直接将文档的内容作为函数的参数直接替代document

#### 3.5.2 使用`save()`

插入数据时，如果 users 集合没有创建会自动创建。

```
> use mydb2
switched to db mydb2
> db.users.save([
... { name : "jam",
... email : "jam@qq.com"
... },
... { name : "tom",
... email : "tom@qq.com"
... }
... ])
```

### 3.6 查询语句

#### 3.6.1 `find()`语句

> find() 用法：db.COLLECTION_NAME.find()

**插入测试数据**

```
> use post
> db.post.insert([
{
   title: 'MongoDB Overview',
   description: 'MongoDB is no sql database',
   by: 'shiyanlou',
   url: 'http://www.shiyanlou.com',
   tags: ['mongodb', 'database', 'NoSQL'],
   likes: 100
},
{
   title: 'NoSQL Database',
   description: "NoSQL database doesn't have tables",
   by: 'shiyanlou',
   url: 'http://www.shiyanlou.com',
   tags: ['mongodb', 'database', 'NoSQL'],
   likes: 20,
   comments: [
      {
         user:'user1',
         message: 'My first comment',
         dateCreated: new Date(2013,11,10,2,35),
         like: 0
      }
   ]
}
])
```

**查询数据，不加任何参数默认返回所有数据记录：**

```
db.post.find()
```

**db.COLLECTION_NAME.find().pretty()美化输出结果**

```
db.post.find().pretty()
```

#### 3.6.2 `find()`语句参数

**AND条件**

当 find() 中传入多个键值对时，MongoDB就会将其作为 AND 查询处理。用法：`db.mycol.find({ key1: value1, key2: value2 }).pretty()`

```
db.post.find({"by":"shiyanlou","title": "MongoDB Overview"}).pretty()
```

**OR条件**

MongoDB中，OR 查询语句以 $or 作为关键词，用法如下：

```
db.post.find(
   {
      $or: [
         {key1: value1}, {key2:value2}
      ]
   }
).pretty()
```

操作示例：

```
db.post.find({
    $or:[
        {"by":"shiyanlou"},
        {"title": "MongoDB Overview"}
    ]
}).pretty()
```

**AND和OR同时使用**

```
db.post.find({
    "likes": {$gt:10},
    $or: [
        {"by": "shiyanlou"},
        {"title": "MongoDB Overview"}
    ]
}).pretty()
```

{$gt:10} 表示大于10，另外，$lt 表示小于，$lte 表示小于等于，$gte 表示大于等于，$ne 表示不等于。

### 3.7 创建集合`createCollection()`

语法

```
db.createCollection(name,options)
```

参数描述：

* name：创建的集合名称
* options：是一个作为初始化的文档(可选)

范例：

```
> db.createCollection("shiyanlou")            #无参数
{ "ok" : 1 }
> show collections
shiyanlou
system.indexes
> db.createCollection("shiyanlou2", { capped : 1, autoIndexID : 1, size : 6142800, max : 10000 } )            #带参数
{ "ok ": 1 }
```

参数描述：

* capped：类型为Boolean，如果为ture则创建一个固定大小的集合，当其条目达到最大时可以自动覆盖以前的条目。在设置其为ture时也要指定参数大小；
* autoIndexID：类型为Boolean，默认为false，如果设置为ture，则会在_id field.s上自动创建索引；
* size：如果capped为ture需要指定，指定参数的最大值，单位为byte；
* max：指定最大的文档数。 在mogodb中也可以不用创建集合，因为在创建文档的时候也会自动的创建集合

### 3.8 删除集合`db.COLLECTION.drop()`

```
> use Chenshi
switched to db Chenshi
> show collections
shiyanlou
shiyanlou2
system.indexes
> db.shiyanlou.drop()
ture
> show collections
shiyanlou2
system.indexes
```

删除成功

注意：当您要删除指定的集合时，用您想要删除的集合名称替代COLLECTION即可

### 3.9 更新文档`db.COLLECTION_NAME.update(SELECTION_CRITERIA,UPDATED_DATA)`

操作实例：

```
> db.shiyanlou.update({"user_id":"02","e-mail":"test@qq.com"},{$set:{"e-mail":"group@qq.com"}})
WriteResult({"nMatched":1,"nUpserted":1,"nModified":1})
> db.shiyanlou.find()
```

* 将user_id=2的文档的e-mail改为group@qq.com
* 第一个大括号内容标示查找条件，第二个大括号内容则表示更新后的数据
* 默认的update函数只对一个文档更新，如果想作用所有文档，则需要加入multi:ture

操作实例：

```
db.shiyanlou.update({"e-mail":"test@qq.com"},{$set:{"e-mail":"group@qq.com"}},{multi:true})
```

### 3.10 替换已存在的文档`db.COLLECTION_NAME.save({_id:ObjectId(),NEW_DATA})`

操作实例：

```
db.shiyanlou.save({"_id":ObjectId("53ea174ccb4c62646d9544f4"),"name":"Bob","position":"techer"})
WriteResult({"nMatched":1,"nUpserted":1,"nModified":1})
```

跟update差不多，但是update更好用

### 3.11 删除文档`db.COLLECTION_NAME.remove(DELECTION_CRITERIA)`

```
db.shiyanlou.remove({"name":"Bob"})
```

其实remove函数的参数跟update函数的第一个参数一样，相当于查找条件，注意，不要误删！

## 四、查询

***

### 4.1 查询语句

```
db.COLLECTION_NAME.find(Parameter)
```

### 4.2 查询条件操作符

#### 4.2.1 bool型操作符

* (>) 大于 - \$gt #greate
* (<) 小于 - \$lt #low
* (>=) 大于等于 - \$gte #equal
* (<= ) 小于等于 - \$lte

范例：

```
db.shiyanlou.find({user_id:{$gt:1}})
db.shiyanlou.find({user_id:{$lte:2,$gt:1}})
```

#### 4.2.2 类型操作符`$type`

语法：

```
$type
```

type的值：

* 双精度型-1
* 字符串-2
* 对象-3
* 数组-4
* 二进制数据-5
* 对象ID-7
* 布尔类型-8
* 数据-9
* 空-10
* 正则表达式-11
* JS代码-13
* 符号-14
* 有作用域的JS代码-15
* 32位整型数-16
* 时间戳-17
* 64位整型数-18
* Min key-255
* Max key-127

范例：

```
db.shiyanlou.find({"name":{$type:2}})
```

查找name是字符串的文档记录

### 4.3 分页条件`limit`与`skip`

读取指定数量的数据记录 `limit`

范例：

```
db.shiyanlou.find().limit(1)
```

读取一条记录，默认是排在最前面的那一条被读取

读取时跳过指定数量的数据记录 `skip`

范例：

```
db.shiyanlou.find().limit(1).skip(1) //返回第二条记录
```

当然，还可以添加find的查找条件的参数，以便进行更精确的查找

### 4.4 排序`sort()`

与sqlite中的排序一样有升序和降序，其中升序用1表示，降序用-1表示 语法：

```
db.COLLECTION_NAME.find().sort({KEY:1|-1})
```

范例：

```
db.shiyanlou.find().sort({"time":1})
```

## 五、索引`ensureIndex()`

索引通常能够极大的提高查询的效率，如果没有索引，MongoDB在读取数据时必须扫描集合中的每个文件并选取那些符合查询条件的记录。这种扫描全集合的查询效率是非常低的，特别在处理大量的数据时，查询可以要花费几十秒甚至几分钟，无疑对网站的性能是非常致命的。

索引是特殊的数据结构，索引存储在一个易于遍历读取的数据集合中，索引是对数据库集合中一个文档或多个文档的值进行排序的一种结构。
语法：

```
db.COLLECTION_NAME.ensureIndex({KEY:1|-1})
```

同样1代表升序，-1代表降序

范例：

```
db.shiyanlou.ensureIndex({"name":1})
```

ensureIndex()的可选参数：

|参数 |	类型 |	描述 |
|----|------|-------|
|background |	Boolean |	建立索引要不要阻塞其他数据库操作，默认为false |
|unique|	Boolean|	建立的索引是否唯一，默认false|
|name|	string	|索引的名称，若未指定，系统自动生成|
|dropDups|	Boolean|	建立唯一索引时，是否删除重复记录，默认flase|
|sparse|	Boolean|	对文档不存在的字段数据不启用索引，默认false|
|expireAfterSeconds|	integer|	设置集合的生存时间，单位为秒|
|v	|index version|	索引的版本号|
|weights	|document|	索引权重值，范围为1到99999|
|default-language|	string|	默认为英语|
|language_override	|string	|默认值为 language|

范例：

```
db.shiyanlou.ensureIndex({"user_id":1,"name":1},{background:1})
```

## 六、聚合`aggregate()`

***

语法：

```
db.COLLECTION_NAME.aggregate({
$match:{x:1},
{limit:NUM},
$group:{_id:$age}
})
```

这些参数都可选

* $match:查询，跟find一样；
* $limit：限制显示结果数量；
* $skip：忽略结果数量；
* $sort：排序；
* $group：按照给定表达式组合结果。
范例：

```
db.shiyanlou.aggregate([{$group:{_id:"$name", user:{$sum:"$user_id"}}}])
```

$name意为取得name的值

### 6.1 聚合表达式

|名称|	描述|
|----|----|
|$sum	|计算总和|
|$avg	|计算平均值|
|\$min和$max|	计算最小和最大值|
|$push|	在结果文档中插入值到一个数组|
|$addToSet|	在结果文档中插入值到一个数组，但不创建副本|
|$first|	根据资源文档的排序获取第一个文档数据|
|$last|	根据资源文档的排序获取最后一个文档数据|

### 6.2 管道

MongoDB的聚合管道将MongoDB文档在一个管道处理完毕后将结果传递给下一个管道处理。管道操作是可以重复的。

表达式：处理输入文档并输出。表达式是无状态的，只能用于计算当前聚合管道的文档，不能处理其它的文档。 聚合框架中常用的几个操作：

* $project：修改输入文档的结构。可以用来重命名、增加或删除域，也可以用于创建计算结果以及嵌套文档。
* \$match：用于过滤数据，只输出符合条件的文档。$match使用MongoDB的标准查询操作。
* $limit：用来限制MongoDB聚合管道返回的文档数。
* $skip：在聚合管道中跳过指定数量的文档，并返回余下的文档。
* $unwind：将文档中的某一个数组类型字段拆分成多条，每条包含数组中的一个值。
* $group：将集合中的文档分组，可用于统计结果。
* $sort：将输入文档排序后输出。
* $geoNear：输出接近某一地理位置的有序文档。

范例：

```
db.shiyanlou.aggregate([{$match:{user_id:{$gt:0,$lte:2}}},{$group:{_id:"user",count:{$sum:1}}}])
```
