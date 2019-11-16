---
title: "Spark 使用指南"
date: 2019-10-30T15:31:01+08:00
draft: false
toc: true
comments: true
tags:
  - 大数据
---

> 参考 《Spark权威指南》
> [测试数据下载](https://github.com/databricks/Spark-The-Definitive-Guide)
> [API文档](https://spark.apache.org/docs/latest/api/scala/index.html)

## Spark 编程的核心概念

### 两套API

Spark 提供了两套编程API：

* 最底层API，非结构化API，RDD
* 结构化API
  * Datasets
  * DataFrames 特殊的RDD （RDD[InternalRow]）
  * SQL

### SparkSession

Spark 程序的入口（驱动），完成类名为 `org.apache.spark.sql.SparkSession`。

```scala
// spark.range(100) => org.apache.spark.sql.Dataset[Long]
val myRange = spark.range(100).toDF("number") // => org.apache.spark.sql.DataFrame = [number: bigint]
```

### DataFrames

Spark中最常用的数据结构，可以理解成传统关系型数据库数据表的抽象

### Partitions

Spark将数据分成块，称为分区，每个分区被一个Task处理。因此Partitions的划分影响并行度

### Transformations

转换，一个纯函数的概念，表示一个不可变数据集通过某些操作变换成另一种不可变数据集的过程，Transaction就是这个操作的过程。

在Spark中，Transaction是Lazy的，不会进行真正的执行，当遇到Action时才会执行。用户编写的Transaction实际上是构建一个数据流图，在最终执行过程中，会转换成流线型的物理计划，并尝试进行优化。

Transaction分为两类

* 窄依赖：一个分区只产生一个分区，不产生Shuffle，全部在内存中执行
* 宽依赖：产出分区数据来自多个源分区，产生shuffle。

### Actions

触发执行计算的操作，主要分三类

* 控制台查看
* 数据收集
* 输出到第三方系统

### 例子

配置和执行计划

```scala
spark.conf
val df = spark
  .read
  .option("inferSchema", "true")
  .option("header", "true")
  .cvs("/path/to/file") // 原书的 路径为 "data/flight-data/csv/2015-summary.csv"

df.conf.set("spark.sql.shuffle.partitions", "5")
df.sort("field").explain()
```

dataframe创建临时表，并使用sql操作

```scala
df.creteOrReplaceTempView("tablename")
val sqlWay = spark.sql("""
  select * from tablename
"""")
sqlWay.show()
```

## 数据源API

> [样例代码](https://github.com/databricks/Spark-The-Definitive-Guide/blob/master/code/Structured_APIs-Chapter_9_Data_Sources.scala)
> [博客](https://www.jianshu.com/p/06307d0e2359)

官方支持的数据源

* CSV
* JSON
* Parquet
* ORC
* JDBC/ODBC
* Plain-text files

社区维护的数据源格式

* Cassandra
* HBase
* MongoDB
* AWS Redshift
* XML
* ...

主要的两个对象

* reader构造器 `spark.read: org.apache.spark.sql.DataFrameReader` 核心函数如下
  * format
  * schema
  * option
  * load
* writer构造器 `df.write: org.apache.spark.sql.DataFrameWriter`

```scala
// 从数据源获取到df
val df = sparkSession //SparkSession
      .read
      .format("csv") //驱动类，类似JDBC的driver class
      .option(Map(....)) //你需要额外传递给驱动类的参数
      .load("hdfs:///...") //数据文件路径，最终建立连接
// 配置df的写目标
df.write.format("csv")
  .option("mode", "OVERWRITE")
  .option("dateFormat", "yyyy-MM-dd")
  .option("path", "path/to/file(s)")
  .save()
```

* [Reader相关API](https://spark.apache.org/docs/latest/api/scala/index.html#org.apache.spark.sql.DataFrameReader)
* [Writer相关API](https://spark.apache.org/docs/latest/api/scala/index.html#org.apache.spark.sql.DataFrameWriter)

## Spark 的结构化API

* Datasets
* DataFrames 特殊的RDD （RDD[InternalRow]）
* SQL tables 和 views

### DataFrame 和 Dataset

都是类似于表的集合，具有定义好的行和列，每个列必须与其他列有相同的行数，每一个都有一个类型信息，且是不可变的。

DataFrame 和 Dataset 的区别

* DataFrames 是弱类型的，运行时类型检测与转换（本质上是Row类型的Dataset，内部存在一个引擎 SQL 解析引擎catalyst）
* Dataset 是强类型，与Scala类型强绑定
* 本质上 `type DataFrame = Dataset[Row]`

### Columns 和 Rows

* Column 表示数据类型比如integer 或 string 、 array 或 map
* Row 表示数据的一行记录，DataFrame每条记录必须是Row类型 (`org.apache.spark.sql.Row`)

```scala
spark.range(2).toDF().collect()
```

### [Spark Types](http://spark.apache.org/docs/1.6.0/api/java/org/apache/spark/sql/types/package-summary.html)

```scala
// scala 中使用
import org.apache.spark.sql.types._
val b = ByteType // org.apache.spark.sql.types.ByteType.type
```

```java
// Java 中使用
import org.apache.spark.sql.types.DataTypes;
ByteType x = DataTypes.ByteType;
```

### 结构化API的执行过程

* 编写 DataFrame/Dataset/SQL代码
* 转化为逻辑计划
* 优化并转换为物理计划
* 执行物理计划（基于RDD操作）

#### 逻辑计划

只代表一组抽象的转换，不涉及Executor和Driver。会将用户代码转换为 unresolved logical plan。

分析器 analyer 会结合元数据 catalog 分析引用的列和类型是否合法，不合法将拒绝；合法将resolve这个unresolved logical plan，并将解析结果（Logical Plan）传给catalyst优化器

优化器 Optimizer 将 进行优化 并产生 Optimized Logical Plan

#### 物理计划

最终 Optimized Logical Plan 将创建多个物理计划，并通过成本模型选出最佳的一个进行执行

物理计划时一系列RDD转换过程。

#### 执行

Spark 运行所有RDD代码

### DataFrame

一个 DataFrame 包括一系列records，这些行的类型是Row，包含一系列colums，作用于数据及上的表达式实际上是作用于columns上的。分区确定了数据在物理机群中的分布。

详细参考： [API文档](https://spark.apache.org/docs/latest/api/scala/index.html#org.apache.spark.sql.Dataset)

#### 创建一个DataFrame

从文件中创建df

```scala
// spark.read => org.apache.spark.sql.DataFrameReader
// 支持多种文件格式：json、cvs、parquet等
val df = spark
  .read
  .format("json")
  .load("/path/to/file") // 原书路径为： data/flight-data/json/2015-summary.json
// df: org.apache.spark.sql.DataFrame = [DEST_COUNTRY_NAME: string, ORIGIN_COUNTRY_NAME: string ... 1 more field]

df.printSchema
// root
// |-- DEST_COUNTRY_NAME: string (nullable = true)
// |-- ORIGIN_COUNTRY_NAME: string (nullable = true)
// |-- count: long (nullable = true)

```

将DataFrame注册层临时视图，以便SQL中使用

```scala
df.createOrReplaceTempView("dfTable");
```

动态构造一个DF

```scala
import org.apache.spark.sql.Row
import org.apache.spark.sql.types.{StructField, StructType, StringType, LongType}

// 定义表schema
val myManualSchema = new StructType(Array(
  new StructField("some", StringType, true),
  new StructField("col", StringType, true),
  new StructField("names", LongType, false)))
// 声明数据
val myRows = Seq(Row("Hello", null, 1L))
// 创建RDD
val myRDD = spark.sparkContext.parallelize(myRows)
// 从RDD创建df
val myDf = spark.createDataFrame(myRDD, myManualSchema)
myDf.show()

// 在实验环境还可以通过 import spark.implicits._ 直接将Seq转换为df（自动推断类型、不能很好处理null类型）
val myDF = Seq(("Hello", 2, 1L)).toDF("col1", "col2", "col3")
```

#### Schema

```scala
// 查看Schema
df.schema
// res2: org.apache.spark.sql.types.StructType = StructType(StructField(DEST_COUNTRY_NAME,StringType,true), StructField(ORIGIN_COUNTRY_NAME,StringType,true), StructField(count,LongType,true))

// 手动定义Schema
import org.apache.spark.sql.types.{StructField, StructType, StringType, LongType}
import org.apache.spark.sql.types.Metadata

val myManualSchema = StructType(Array(
  StructField("DEST_COUNTRY_NAME", StringType, true),
  StructField("ORIGIN_COUNTRY_NAME", StringType, true),
  StructField("count", LongType, false,
    Metadata.fromJson("{\"hello\":\"world\"}"))
))

val df = spark.read.format("json").schema(myManualSchema)
  .load("/path/to/file") // data/flight-data/json/2015-summary.json
```

#### Column

在Spark中对DataFrame的操作可以是纯字符串方式的方式书写(expr函数，将解析并返回Col类型)，也可以利用Col类型利用Spark语言特性进行操作。

Col本质上就是一个表达式树的抽象和实现

列的定义是纯粹的的声明，是unresolved的，不会进行检查。

**列定义**

```scala
import org.apache.spark.sql.functions.{col, column}
// 定义列的种方式
col("someColumnName")
column("someColumnName")
$"myColumn"
// 'myColumn

// 表达式就是列
col("someCol") - 5  //等价于 expr("someCol - 5") 等价于 expr("someCol") - 5
df.col("count")
(((col("someCol") + 5) * 200) - 6) < col("otherCol")

// 等价于
import org.apache.spark.sql.functions.expr
expr("(((someCol + 5) * 200) - 6) < otherCol")
```

**查看df中存在的列名**

```scala
df.columns
// res14: Array[String] = Array(DEST_COUNTRY_NAME, ORIGIN_COUNTRY_NAME, count)
```

更多参见

* [API 文档](https://spark.apache.org/docs/latest/api/scala/index.html#org.apache.spark.sql.Column)

#### Row

Spark 中，DataFrame中每一行（Record）都是一个Row对象，并使用Expression操作Row，Row内部实现为字节数组

创建并操作一个Row

```scala
// in Scala
import org.apache.spark.sql.Row
val myRow = Row("Hello", null, 1, false)


// COMMAND ----------

// in Scala
myRow(0) // type Any
myRow(0).asInstanceOf[String] // String
myRow.getString(0) // String
myRow.getInt(2) // Int
```

#### DataFrame的Transaction API

DataFrame的操作大概可以分为如下几类

* 添加行或列
* 删除行或列
* 行列转换
* 根据列值对rows排序

select 和 selectExpr

```scala
// select 有两个主要重载：String 和 Column
// 使用 String
df.select("DEST_COUNTRY_NAME").show(2)
df.select("DEST_COUNTRY_NAME", "ORIGIN_COUNTRY_NAME").show(2)

// 使用Column
import org.apache.spark.sql.functions.{expr, col, column}
df.select(
    df.col("DEST_COUNTRY_NAME"),
    col("DEST_COUNTRY_NAME"),
    column("DEST_COUNTRY_NAME"),
    'DEST_COUNTRY_NAME,
    $"DEST_COUNTRY_NAME",
    expr("DEST_COUNTRY_NAME"))
  .show(2) // 相当于Limit，并查询出数据

// 使用expr
df.select(expr("DEST_COUNTRY_NAME AS destination")).show(2)
df.select(expr("DEST_COUNTRY_NAME as destination").alias("DEST_COUNTRY_NAME"))
  .show(2)

// selectExpr
df.selectExpr("DEST_COUNTRY_NAME as newColumnName", "DEST_COUNTRY_NAME").show(2)
df.selectExpr(
    "*", // include all original columns
    "(DEST_COUNTRY_NAME = ORIGIN_COUNTRY_NAME) as withinCountry")
  .show(2)
df.selectExpr("avg(count)", "count(distinct(DEST_COUNTRY_NAME))").show(2)
```

字面量转换

```scala
import org.apache.spark.sql.functions.lit
df.select(expr("*"), lit(1).as("One")).show(2)
```

添加列

```scala
df.withColumn("numberOne", lit(1)).show(2)
df.withColumn("withinCountry", expr("ORIGIN_COUNTRY_NAME == DEST_COUNTRY_NAME"))
  .show(2)
df.withColumn("Destination", expr("DEST_COUNTRY_NAME")).columns
```

列重命名

```scala
df.withColumnRenamed("DEST_COUNTRY_NAME", "dest").columns
```

转义字符

```scala
// spark 表达式支持任意字符，不过需要使用反引号
val dfWithLongColName = df.withColumn(
  "This Long Column-Name",
  expr("ORIGIN_COUNTRY_NAME"))

dfWithLongColName.selectExpr(
    "`This Long Column-Name`",
    "`This Long Column-Name` as `new col`")
  .show(2)
```

默认情况下Spark表达式是不区分大小写的

删除列

```scala
df.drop("ORIGIN_COUNTRY_NAME").columns
dfWithLongColName.drop("ORIGIN_COUNTRY_NAME", "DEST_COUNTRY_NAME")
```

更改类型cast

```scala
df.withColumn("count2", col("count").cast("long"))
```

过滤行

* 主要有两个函数 where 和 filter，where 只接收表达式和Column；filter还能接收自定义函数。

```scala
df.filter(col("count") < 2).show(2)
df.where("count < 2").show(2)
df.where(col("count") < 2).where(col("ORIGIN_COUNTRY_NAME") =!= "Croatia")
  .show(2)
```

去重

```scala
df.select("ORIGIN_COUNTRY_NAME", "DEST_COUNTRY_NAME").distinct().count()
df.select("ORIGIN_COUNTRY_NAME").distinct().count()
```

取样和分割

```scala
// 随机取样
val seed = 5
val withReplacement = false
val fraction = 0.5
df.sample(withReplacement, fraction, seed).count()

// 随机分割
// in Scala
val dataFrames = df.randomSplit(Array(0.25, 0.75), seed)
dataFrames(0).count() > dataFrames(1).count() // False
```

连接和附加行union

```scala
// 必须保证连个df的模式相同
import org.apache.spark.sql.Row
val schema = df.schema
val newRows = Seq(
  Row("New Country", "Other Country", 5L),
  Row("New Country 2", "Other Country 3", 1L)
)
val parallelizedRows = spark.sparkContext.parallelize(newRows)
val newDF = spark.createDataFrame(parallelizedRows, schema)
df.union(newDF)
  .where("count = 1")
  .where($"ORIGIN_COUNTRY_NAME" =!= "United States")
  .show() // get all of them and we'll see our new rows at the end
```

行排序，主要有两个函数 `sort` 和 `orderBy`

```scala
df.sort("count").show(5)
df.orderBy("count", "DEST_COUNTRY_NAME").show(5)
df.orderBy(col("count"), col("DEST_COUNTRY_NAME")).show(5)

// 指定升降序
import org.apache.spark.sql.functions.{desc, asc}
df.orderBy(expr("count desc")).show(2)
df.orderBy(desc("count"), asc("DEST_COUNTRY_NAME")).show(2)

// 其他排序
// 分区内排序
spark.read.format("json").load("/data/flight-data/json/*-summary.json")
  .sortWithinPartitions("count")
```

Limit

```scala
df.limit(5).show()
df.orderBy(expr("count desc")).limit(6).show()
```

重新分区和合并

```scala
df.rdd.getNumPartitions // 1
// 重新分区
df.repartition(5) // 此操作引发shuffle
df.repartition(col("DEST_COUNTRY_NAME")) // 按照某一列hash进行分区
df.repartition(5, col("DEST_COUNTRY_NAME"))  // 按照某一列hash进行分区同时指定分区数目
// 分区合并
df.repartition(5, col("DEST_COUNTRY_NAME")).coalesce(2) // 并不会导致全shuffle，只会进行数据搬移
```

收集Row到Driver中（谨慎操作，大数据量会导致driver异常退出）

* collect 获取DataFrame中所有数据
* take 选取前几行
* show 打印几行数据

```scala
val collectDF = df.limit(10)
collectDF.take(5) // take works with an Integer count
collectDF.show() // this prints it out nicely
collectDF.show(5, false)
collectDF.collect()
```

[API文档](https://spark.apache.org/docs/latest/api/scala/index.html#org.apache.spark.sql.Dataset)

#### Function

参见 [Function API](https://spark.apache.org/docs/latest/api/scala/index.html#org.apache.spark.sql.functions$)

Scala 类型可以通过 `import org.apache.spark.sql.functions.lit` 函数转换为 Spark 类型

使用函数有两种方式：

* 字符串表达式，SQL规范，会解析成为Column
* 直接调用 functions 包内的函数

#### 聚合相关API

> [示例代码](https://github.com/databricks/Spark-The-Definitive-Guide/blob/master/code/Structured_APIs-Chapter_7_Aggregations.scala)

主要分为两个部分

* Dataset API
  * groupBy
  * rollup
    * 相当于多个groupBy union all（ rollup(a, b, c) 等价于 groupBy a union all groupBy a, b groupBy a, b, c）
  * cube
    * 相当于多个groupBy union all（cube(a,b,c) 相当于abc 6种排列组合group by的聚合）
* Function API
  * sum/count/avg等聚合函数
* 窗口函数 `org.apache.spark.sql.expressions.Window`

[支持自定义UDF](https://github.com/databricks/Spark-The-Definitive-Guide/blob/master/code/Structured_APIs-Chapter_7_Aggregations.scala#L237)

#### Join相关API

> [示例代码](https://github.com/databricks/Spark-The-Definitive-Guide/blob/master/code/Structured_APIs-Chapter_8_Joins.scala)

Spark支持的Join类型

* Inner Join
* Outer Join
* Left Outer Join
* Right Outer Join
* Left semi join
  * left semi join是以左表为准，在右表中查找匹配的记录，如果查找成功，则仅返回左边的记录，否则返回null
  * 用于实现exists
* left anti join
  * left semi join是以左表为准，在右表中查找匹配的记录，如果查找成功，返回null，否者仅返回左边的记录
  * 用于实现not exists
* Natural join
  * 相当于找到两表中名称相同的字段做连接条件，然后做Inner Join
  * 不需要加on条件
* Cross join
  * 笛卡尔积
  * 不需要加on条件

### Spark SQL

相关概念

* Catalog 是数据库、表、视图、函数等元数据的抽象。
* Table 传统上的表，在Spark中逻辑上等价于DataFrame，通过DataFrame创建的表属于默认database。
  * 托管表
  * 外部表

SparkSQL 的元数据默认只能保存到内存，Spark的元数据持久化复用的Hive，所以持久化有两种方式

* [使用Spark内部的HiveContext直接连接HiveMeta数据库](https://www.cnblogs.com/itboys/p/9215594.html)
* [连接到Hive的MetaServer](https://blog.csdn.net/LHWorldBlog/article/details/79299957)

其他参见 [HiveSQL记录](/posts/hivesql记录/)

### Dateset

> [实例代码](https://github.com/databricks/Spark-The-Definitive-Guide/blob/master/code/Structured_APIs-Chapter_11_Datasets.scala)

Dataset 实际上是 DataFrame 的底层实现，即 `type DataFrame = Dataset[Row]`

一般情况下DataFrame足够使用，满足一下情况下建议使用Dataset

* 某些操作使用DataFrame无法实现时
* 需要编译期类型安全时

```scala
case class Flight(DEST_COUNTRY_NAME: String,
                  ORIGIN_COUNTRY_NAME: String, count: BigInt)


val flightsDF = spark.read
  .parquet("/data/flight-data/parquet/2010-summary.parquet/")
val flights = flightsDF.as[Flight]

flights.show(2)
flights.first.DEST_COUNTRY_NAME // United States
def originIsDestination(flight_row: Flight): Boolean = {
  return flight_row.ORIGIN_COUNTRY_NAME == flight_row.DEST_COUNTRY_NAME
}
flights.filter(flight_row => originIsDestination(flight_row)).first()
```

## Spark 的非结构化API

主要包含 RDD、SparkContext、分布式共享变量

### 分布式弹性数据集 RDD

> [样例代码](https://github.com/databricks/Spark-The-Definitive-Guide/blob/master/code/Low_Level_APIs-Chapter_12_RDD_Basics.scala)

本质上DataFrame构造完成后都会编译成RDD操作（转换）（众多子类），RDD没有row的概念

一个RDD主要包含如下五个主要属性

* 一个分区列表
* 一个计算方法没用于计算每一个数据分区
* 一个RDD的依赖列表
* 一个Partitioner分区器（可选）
* 一个数据分区计算的首选位置列表（可选）

RDD 的操作分为两类

* transformation（延迟计算）
* action（触发计算）

获取RDD

* 从DF中获取
* 通过SparkContext创建

```scala
// in Scala: converts a Dataset[Long] to RDD[Long]
spark.range(500).rdd
// in Scala
spark.range(10).toDF().rdd.map(rowObject => rowObject.getLong(0))
// in Scala
spark.range(10).rdd.toDF()
val myCollection = "Spark The Definitive Guide : Big Data Processing Made Simple"
  .split(" ")
val words = spark.sparkContext.parallelize(myCollection, 2)
spark.sparkContext.textFile("/some/path/withTextFiles")
spark.sparkContext.wholeTextFiles("/some/path/withTextFiles")
```

相关API参考

* [RDD](https://spark.apache.org/docs/latest/api/scala/index.html#org.apache.spark.rdd.RDD)
