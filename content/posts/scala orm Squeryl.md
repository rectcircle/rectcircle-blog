---
title: scala orm Squeryl
date: 2016-12-26T13:59:56+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/34
  - /detail/34/
tags:
  - scala
---

## 目录

* [〇、相关链接](#〇、相关链接)
* [一、测试说明](#一、测试说明)
	* [1、测试约定——尽量模拟实际应用](#1、测试约定——尽量模拟实际应用)
	* [2、测试、应用注意事项](#2、测试、应用注意事项)
* [二、框架语法](#二、框架语法)
	* [1、使用框架步骤](#1、使用框架步骤)
	* [2、实体类与数据库表映射语法](#2、实体类与数据库表映射语法)
	* [3、增删改查dsl语法](#3、增删改查dsl语法)
	* [4、dsl语法总结](#4、dsl语法总结)

## 〇、相关链接

***

测试项目地址 https://git.oschina.net/null_834/ormSquerylTest.git
官方文档地址 http://squeryl.org/introduction.html

## 一、测试说明

***

### 1、测试约定——尽量模拟实际应用

#### （1）测试数据库library

模拟一个图书馆系统

包括4张表

* author——作者信息
* book——书籍信息
* Borrowal——借阅记录
* reader——读者信息

#### （2）测试包层次划分

* `com.rectcircle.config`
  * `DbConfig`方式数据库连接的配置，包括c3p0连接池
  * `LibraryDbSchema`数据库表和实体类的映射配置包括一对多多对一的配置
* `com.rectcircle.dao`数据持久化层，调用对数据的处理，包括调用数据库层和缓存层
* `com.rectcircle.db`数据库操作层包括增删改查
* `com.rectcircle.model`数据模型层所谓的实体类、poso类
* `Main`测试的逻辑，实际应用用该放在`service`层

### 2、测试、应用注意事项

#### （1）所有使用dsl操作的都要`import org.squeryl.PrimitiveTypeMode._`否则报错

例如:

```scala
import org.squeryl.PrimitiveTypeMode._
def findByEmail(email:String) = from(authors)(
	a⇒ where(a.email.get === email) select (a)
).single
```

#### （2）所有数据库操作前配置数据库连接信息

见`com.rectcircle.config.DbConfig.init`函数

#### （3）所有数据库操作前必须显示的绑定session到线程上

```scala
object Main extends App {
	//初始化数据库配置，测试在这，未来交由框架初始化函数调用
	DbConfig.init
	//绑定session，未来交由前端过滤器调用
	val session = SessionFactory.newSession
	session.bindToCurrentThread

	//数据库相关测试

	//解绑session，交由框架调用
	session.unbindFromCurrentThread


}
```

#### （4）打开生成sql的日志

```scala
org.squeryl.Session.currentSession.setLogger(println)
```

## 二、框架语法

***

详见参见http://squeryl.org/introduction.html

### 1、使用框架步骤

#### （1）创建sbt项目

#### （2）添加依赖

```scala
name := "ormSquerylTest"
version := "0.01"
scalaVersion := "2.11.8"


libraryDependencies += "org.scalatest" %% "scalatest" % "3.0.1"
libraryDependencies += "org.squeryl" %% "squeryl" % "0.9.5-7"
libraryDependencies += "mysql" % "mysql-connector-java" % "5.1.38"
libraryDependencies += "c3p0" % "c3p0" % "0.9.1.2"
libraryDependencies += "org.slf4j" % "slf4j-api" % "1.7.21"
```

#### （3）用eclipse或idea打开项目

#### （4）编写数据库配置信息`com.rectcircle.config.DbConfig`

```scala
package com.rectcircle.config

import org.squeryl.Session

import com.mchange.v2.c3p0.ComboPooledDataSource
import org.slf4j.LoggerFactory
import org.squeryl.adapters.MySQLAdapter

object DbConfig {

	val logger = LoggerFactory.getLogger(getClass)

	var cpds = new ComboPooledDataSource


	//配置连接数据库信息
	val url = "jdbc:mysql://localhost:3306/library"
	val driver = "com.mysql.jdbc.Driver"
	val username = "root"
	val password = "123456"

	def init = {
		//配置数据库连接池
		cpds.setDriverClass(driver)
		cpds.setJdbcUrl(url)
		cpds.setUser(username)
		cpds.setPassword(password)

		cpds.setMinPoolSize(1)
		cpds.setAcquireIncrement(1)
		cpds.setMaxPoolSize(50)

		//配置squeryl SessionFactory
		import org.squeryl.SessionFactory
		Class.forName(driver)
		if (SessionFactory.concreteFactory.isEmpty) {
			SessionFactory.concreteFactory = Some(() =>
				Session.create(cpds.getConnection, new MySQLAdapter))
		}
	}
}
```

#### （4）分析需求创建数据库对应实体类`com.rectcircle.model.Model.scala`

scala以写在一个文件中

```scala
package com.rectcircle.model

import org.squeryl.KeyedEntity
import org.squeryl.PrimitiveTypeMode._
import java.sql.Timestamp

import org.squeryl.annotations.Column
import java.util.Date

import org.squeryl.dsl.CompositeKey2

//模型类，尽量减少入侵
//这是一个每个实体类都需要的父类，包括了主键字段
class LibraryDbObject extends KeyedEntity[Long] {
	val id:Long = 0
}

case class Author ( firstName: String,
			   lastName: String,
			   email: Option[String]) extends LibraryDbObject {
	def this() = this("", "", Some(""))

	//this 是一的一方 所以 一对多
	//lazy val books:OneToMany[Book] = LibraryDbSchema.authorToBooks.left(this)
	var books:Vector[Book] = _
}

case class Book(title: String,
		   @Column("AUTHOR_ID")authorId: Long,
			coAuthorId: Option[Long]) extends LibraryDbObject {
	def this() = this("", 0, Some(0L))

	//此框架具有侵入性，可以手动指定，在Db层实现
	//this 是多的一方 所以是多对一
	//lazy val author:ManyToOne[Author] = LibraryDbSchema.authorToBooks.right(this)
	var author:Author = _
	//多对多
	//lazy val readers:ManyToMany[Reader, Borrowal] = LibraryDbSchema.borrowals.right(this)
	var readers:Vector[(Reader,Borrowal)] = _
}

////手动管理多对多关系
//case class Borrowal(bookId: Long,
//			    readerId: Long,
//			    scheduledToReturnOn: Date,
//			    returnedOn: Option[Timestamp],
//			    numberOfPhonecallsForNonReturn: Int) extends LibraryDbObject

//多对多映射管理
case class Borrowal(bookId: Long,
			    readerId: Long,
			    scheduledToReturnOn: Date,
			    returnedOn: Option[Timestamp],
			    numberOfPhonecallsForNonReturn: Int) extends  KeyedEntity[CompositeKey2[Long,Long]]{
	def id = compositeKey(bookId, readerId)
}

case class Reader( username:String,
			  password:String,
			  maxBorrowBooksCount:Int
			) extends LibraryDbObject {
	def this() = this("","",15)

	////侵入式写法
	//lazy val books:ManyToMany[Book,Borrowal] = LibraryDbSchema.borrowals.left(this)
	//非侵入式写法，将逻辑在Db层手写
	var books:Vector[(Book,Borrowal)] = _

}
```

#### （5）编写数据库表、字段与实体类的映射关系`com.rectcircle.config.LibraryDbSchema`

```scala
package com.rectcircle.config

import org.squeryl.PrimitiveTypeMode._
import org.squeryl.{ForeignKeyDeclaration, Schema}
import com.rectcircle.model.{Author, Book, Borrowal, Reader}

object LibraryDbSchema extends Schema  {

	def tx[A](a: => A): A = {
		inTransaction(a)
	}

	//当表名称与类名称不匹配时，在此处指定
	val authors = table[Author]("AUTHORS")
	val books = table[Book]
	//val borrowals = table[Borrowal]
	val readers = table[Reader]

	//定义一对多映射关系
	val authorToBooks = oneToManyRelation(authors,books).
	  via((a,b)=>a.id===b.authorId)

	//定义一个多对多关系
	val borrowals = manyToManyRelation(readers,books).
	  via[Borrowal]((r,b,bor)=>(r.id===bor.readerId, b.id===bor.bookId))


	//定义外键类型
	override def applyDefaultForeignKeyPolicy(foreignKeyDeclaration: ForeignKeyDeclaration) =
		foreignKeyDeclaration.constrainReference

//	//级联删除
//	//如果删除author，将删除相关的books
//	authorToBooks.foreignKeyDeclaration.constrainReference(onDelete cascade)
//	//如果删除book，将删除reader
//	borrowals.leftForeignKeyDeclaration.constrainReference(onDelete cascade)

	on(authors)(s ⇒ declare(
		s.id         is(primaryKey,autoIncremented),
		s.email      is(unique, indexed("idxEmailAddresses")) , //设置索引
		s.firstName  is(indexed),
		s.lastName   is(indexed, dbType("varchar(255)")), // 设置数据库列的类型
		columns(s.firstName, s.lastName) are(indexed)
	))

	on(books)(b⇒ declare(
		b.id is(primaryKey,autoIncremented)
	))

	on(borrowals)(b => declare(
		b.numberOfPhonecallsForNonReturn defaultsTo (0)
	))

	on(readers)(r=>declare(
		r.id is(primaryKey,autoIncremented),
		r.username is (indexed)
	))

	//删除数据表方法为了安全通常，不允许访问。测试打开它
	override def drop = super.drop

}
```

#### （6）创建XxxBb scala Object操作数据库

### 2、实体类与数据库表映射语法`com.rectcircle.config.LibraryDbSchema`

#### （1）创建一个scala object 继承 org.squeryl.Schema

```scala
package com.rectcircle.config

import org.squeryl.PrimitiveTypeMode._
import org.squeryl.{ForeignKeyDeclaration, Schema}
import com.rectcircle.model.{Author, Book, Borrowal, Reader}

object LibraryDbSchema extends Schema  {
//...
```

#### （2）添加与数据库操作的字段，与实体类一一对应

```scala
object LibraryDbSchema extends Schema  {
	//对数据库的操作主要依靠这些字段
	//当表名称与类名称不匹配时，在此处指定
	val authors = table[Author]("AUTHORS")
	val books = table[Book]
	//val borrowals = table[Borrowal]
	val readers = table[Reader]
	//...
}
```

#### （3）映射实体类字段与表的列名

所有实体类中构造函数的基本类型字段都会映射到数据库
函数体内部的基本类型字段也会被映射到数据库
经测试集合类型和自定义类型的字段不会被映射到数据库
Option[基本类型]会映射为可null类型，其他基本类型会映射为不可为null的类型
私有字段也会被映射。
都不能为空
基本类型：
![字段转换为基本类型](/res/GdPo4gCgfwBE48F3lkUBMpi1.png)

```scala
object LibraryDbSchema extends Schema  {
	//...
	on(authors)(s ⇒ declare(
		s.id         is(primaryKey,autoIncremented), //设置自动的递增
		s.email      is(unique, indexed("idxEmailAddresses")) , //设置索引
		s.firstName  is(indexed),
		s.lastName   is(indexed, dbType("varchar(255)")), // 设置数据库列的类型
		columns(s.firstName, s.lastName) are(indexed)//联合索引
	)) //未显示定义的字段的也会被映射按默认进行，说明在上
	//...
}
```

#### （4）一对多多对一关系

例如作者与书籍的关系
以下是定义一对多关系的配置

```scala
object LibraryDbSchema extends Schema  {
	//...
	//定义一对多映射关系
	val authorToBooks = oneToManyRelation(authors,books).
	  via((a,b)=>a.id===b.authorId) //关联字段
	//...
}
```

官方的用法为（具有侵入性）

```scala
case class Author ( firstName: String,
			   lastName: String,
			   email: Option[String]) extends LibraryDbObject {
	def this() = this("", "", Some(""))

	//this 是一的一方 所以 一对多
	lazy val books:OneToMany[Book] = LibraryDbSchema.authorToBooks.left(this)
	//这样就可以直接通过author.books获得作者著有什么书
}
//同理，在Book中也可以添加方法
case class Book(title: String,
		   @Column("AUTHOR_ID")authorId: Long,
			coAuthorId: Option[Long]) extends LibraryDbObject {
	def this() = this("", 0, Some(0L))

	//this 是多的一方 所以是多对一
	lazy val author:ManyToOne[Author] = LibraryDbSchema.authorToBooks.right(this)
}
```

本例中的做法，在db层中添加组装的方法（但是也破会了实体类的不可变性、同时使用了null）

```scala
//在实体类中添加一个books的集合类型
case class Author ( firstName: String,
			   lastName: String,
			   email: Option[String]) extends LibraryDbObject {
	def this() = this("", "", Some(""))

	var books:Vector[Book] = _
}

//在db层添加一个withBooks方法，附加上Books的内容
object AuthorDb {
	import com.rectcircle.config.LibraryDbSchema._
//...
	def withBook(author: Author) = {
		author.books = LibraryDbSchema.authorToBooks.left(author).toVector
		author
	}
//...
}
```

如何使用自己取舍

#### （5）多对多关系

类似于一对多多对一
不同之处：

* 需要一个中间表对应的实体类
* 中间表必须包含需要关联的实体对应的主键，还可以拥有其他字段
* 中间表实体类如果想要声明联合主键，必须继承`KeyedEntity[CompositeKey2[Long,Long]]`，并实现id方法

以读者与图书之间存在借阅表关联关系为例

```scala
case class Borrowal(bookId: Long, //对应书籍的Id
			    readerId: Long, //对应读者的Id
			    scheduledToReturnOn: Date, //其他字段
			    returnedOn: Option[Timestamp],
			    numberOfPhonecallsForNonReturn: Int) extends  KeyedEntity[CompositeKey2[Long,Long]]{
	def id = compositeKey(bookId, readerId) //声明联合主键
}

//声明关系
object LibraryDbSchema extends Schema  {
	//...
	//定义一个多对多关系，并绑定参数关系
	val borrowals = manyToManyRelation(readers,books).
	  via[Borrowal]((r,b,bor)=>(r.id===bor.readerId, b.id===bor.bookId))
			//三个类型为参数为Reader、Book、Borrowal
	//...
}

//reader实体类，非侵入式写法
case class Reader( username:String,
			  password:String,
			  maxBorrowBooksCount:Int
			) extends LibraryDbObject {
	def this() = this("","",15)

	////侵入式写法
	//lazy val books:ManyToMany[Book,Borrowal] = LibraryDbSchema.borrowals.left(this)
	//非侵入式写法，将逻辑在Db层手写
	var books:Vector[(Book,Borrowal)] = _

}

//在Db层使用，多对多关系拿数据
object ReaderDb{

	import com.rectcircle.config.LibraryDbSchema._

	def withBooks(readerWithId:Reader) = {
		readerWithId.books = borrowals.left(readerWithId).associationMap.toVector
		readerWithId
	}
}
```

### 3、增删改查dsl语法

> 所有操作放在db层

#### （1）插入

例子：新增一个读者

方式一

```scala
import com.rectcircle.config.LibraryDbSchema
import com.rectcircle.model.Author
import org.squeryl.PrimitiveTypeMode._

object AuthorDb {
	import com.rectcircle.config.LibraryDbSchema._

	def save(a: Author) = authors.insert(a) //实际上是LibraryDbSchema.insert(a)
}
```

方式二

```scala
//...
object AuthorDb {
	import com.rectcircle.config.LibraryDbSchema._
	//...
	def save2(a:Author) = a.save
	//...
}
```

批量保存

```scala
def saveLists(as:Iterable[Author]) = authors.insert(as);
```

#### （2）更新

例子：更新一个读者

全部更新

```scala
def updateById(a: Author) = authors.update(a)
```

部分更新
> 语法
> `update(table:Table[T])(t => where(条件) set(t.xx := 新的值,t.xx := ...))`

```scala
//更新读者的email地址
def updateEmailWhereEmail(newEmail:String, oldEmail:String) = update(authors)(
		au⇒where(au.email.get === oldEmail) set(au.email := Some(newEmail))
	)
```

更新表内的某一列所有数据

```scala
def updateAllLastName(lastName: String) = update(authors)(
	a ⇒ setAll(a.lastName := lastName)
)
```

#### （3）删除

根据条件删除

```scala
def remove(a:Author) = authors.deleteWhere(oldA ⇒ oldA.id === a.id)
```

#### （4）查找

> **a. 根据id查找**
> 语法：`table:Table[T].lookup(id)` return `Option[T]`

例子

```scala
def getById(id:Long) = authors.lookup(id)
```

> **b. 普通条件查询**
> 语法1:`from(table:Table[T])(t⇒ where(条件) select (需要查询出来的的内容))` return `Query[T]`
> 语法2：`table:Table[T].where(条件)` return `Query[T]`

方式1

```scala
def findByEmail(email:String) = from(authors)(
	a⇒ where(a.email.get === email) select (a)
)
```

方式2

```scala
def findByFirstName(firstName:String) = authors
	.where(_.firstName === firstName)
```

> **c. 子查询**
> 语法1：`from(table[T])(t=>where(字段 in	from ()()) select(b))` return `Query[T]`

例子

```scala
//子查询，通过作者名查询，他所著的书籍
def findByAuthorName(name:String) = {
	from(books)(b=>
		where(b.authorId in
				from (AuthorDb.findByFirstName(name))( //利用已存在查询
				a => select(a.id)
			)
		)
		select(b)
	)
}
```

> **d. 表连接**
> 语法1：`from(table[T],table[T])((t1,t2)=>) where(筛选条件 and 连接条件) select()` return `Query[T]`
> 语法2：`join(q: Queryable[A],q1: JoinedQueryable[B1])((t1,t2)=>where(筛选条件) select(查询内容) on(连接条件))` return `Query[C]`

语法1

```scala
def findWithAuthorByBookName(name:String) = {
	from(books, authors)((b,a)=>
			where(b.title === name and b.authorId === a.id)
		select((b,a))
	)
}
```

语法2

```scala
//表连接2，查询所有作者的所有书籍
def findAllAuthorBooksDetail = {
	join(authors, books.leftOuter)((a,b)=>
		//where(a.id === 1)
		select(a,b)
		on(a.id === b.map(_.authorId))
	)
}
```

> **e. groupby查询和聚合查询**

|方法|返回类型|
|----|-------|
| from(aTable)(t=> groupBy(t.aString,t.anInt)) |	Query[ Group[(String,Int)]] |
| from(aTable)(t=> groupBy(t.aString,t.anIntOption)) | Query[ Group[(String,Option[Int])]] |
| from(aTable)(t=> compute(min(t.aString),max(t.anInt))) | Query[ Measures[(Option[String],Option[Int])]] |
| from(aTable)(t=> groupBy(t.aString,t.anInt) compute(max(t.aString),avg(t.anInt))) |	Query[ GroupWithMeasures[(String,Int),(Option[String],Option[Float])]] |

#### （5）分页

语法1：`from()().page(offset,pageLength)`
语法2：`table:Table[T].where().page(offset,pageLength)`

例子

```scala
def findBooksByAuthorAndPage(author: Author, offset: Int, pageLength: Int) = {
	books.where(_.authorId===author.id).page(offset,pageLength)
}
```

#### （6）排序

语法：`from()(where() select() orderBy())`

```scala
		from(sysNotices)(
			sn=>where(sn.targetId === u.id)
			  select sn
			  orderBy(sn.createTime desc)
		).page(0,limit)
```

### 4、dsl语法总结

#### （1）注意事项

* `import org.squeryl.PrimitiveTypeMode._`
* 增删改函数执行要在一个`transaction`函数体或者`inTransaction`
* 保持session不关闭不解绑

#### （2）方法详解

```scala
from(Table[T]或者View[T]或者Query[T]) return Query[T]
```

#### （3）常用操作

```scala
table:Table[T].insert(T) //插入
table:Table[T].lookup(id) //按照id查找返回Option[T]
table:Table[T].get(id) //按照id查找不存在抛异常
table:Table[T].delete(T) //删除
table:Table[T].insertOrUpdate(T) //插入或更新
table:Table[T].where() //单表查询

from(Queryable[T])(t => QueryYield[T])
from()(t=>where(条件) select()) //单表查询写法
from()(t=>where(t.xx like xxx) select()) //单表查询
from()(t=>where(t.xx in from()() )) //子查询写法

```

#### （4）支持表达式

注意最好使用字符串避免歧义

* Boolean
  * not, isNull, isNotNull, between, ===, <, lt, >, gt, <=, lte, <=, gte, <>, exists, notExists, in, notIn
* 数学
  * plus, +, minus, -, times, *, div, /
* 字符串
  * || (concatenation), lower, upper, like, regex
* 聚合函数
  * max, min, sum, avg, sDevPopulation, sDevSample, varPopulation, varSample, count(cols*), countDistinct(cols*)
* &函数

```scala
// 在客户端执行
from(artists)(a =>
 select(a.id * 1000)
)

// 在数据库执行
```scala
from(artists)(a =>
 select(&(a.id * 1000))
)
```
