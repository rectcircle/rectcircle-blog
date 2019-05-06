---
title: scala读书笔记（三）
date: 2016-12-10T21:14:59+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/32
  - /detail/32/
tags:
  - scala
---

>  代码优于描述

## 目录
* [十二、简单构建工具SBT](#十二、简单构建工具SBT)
* [十三、web服务](#十三、web服务)
* [十四、数据库和持久化](#十四、数据库和持久化)
* [十五、与java交互](#十五、与java交互)
* [十六、类型（泛型系统）](#十六、类型（泛型系统）)
* [十七、习惯用法](#十七、习惯用法)

## 十二、简单构建工具SBT
**************************************************
### 1、创建项目目录结构
#### （1）手动(脚本)创建
shell脚本如下
```bash
#!/bin/sh
mkdir -p src/{main,test}/{java,resources,scala}
mkdir lib project target
# create an initial build.sbt file
echo 'name := "MyProject"
version := "1.0"
scalaVersion := "2.10.0"' > build.sbt
```

目录结构如下
```
.
|-- build.sbt
|-- lib
|-- project
|-- src
| |-- main
| | |-- java
| | |-- resources
| | |-- scala
| |-- test
| |-- java
| |-- resources
| |-- scala
|-- target
```

#### （2）使用Giter8创建
##### 安装过程
**安装Conscript**
1、进入http://www.foundweekends.org/conscript/setup.html选择操作系统环境的安装脚本
2、 进入~/.conscript/foundweekends/conscript/cs目录修改文件launchconfig为，切换镜像源

```
[app]
  version: 0.5.1
  org: org.foundweekends.conscript
  name: conscript
  class: conscript.Conscript
[scala]
  version: 2.11.8
[repositories]
  local
  foundweekends-maven-releases: https://dl.bintray.com/foundweekends/maven-releases/
#  sonatype-releases: https://oss.sonatype.org/content/repositories/releases/
  sonatype-releases: http://maven.aliyun.com/nexus/content/groups/public/
  maven-central

[boot]
  directory: C:\Users\user\.conscript\boot
```

3、进入~/.conscript/bin/运行cs下载依赖

4、将~/.conscript/文件移动到想要的位置，修改环境变量

**安装g8**
1、`cs foundweekends/giter8`卡住中断，结束进程
2、修改conscript/foundweekends/giter8/g8/launchconfig仓库为阿里云
3、从新执行`cs foundweekends/giter8`


**生成项目模板**
由于国内墙的存在浏览器上git下载下来zip文件解压到文件夹
执行`g8 file://D:/IDE/scalag8temp/scalatra-sbt.g8-master`即可


### 2、sbt配置
#### （1）进入安装目录/conf
#### （2）编写`sbtconfig.txt`如下
```
# Set the java args to high
-Xmx512M
-XX:MaxPermSize=256m
-XX:ReservedCodeCacheSize=128m
# Set the extra SBT options
-Dsbt.log.format=true
#配置全局仓库位置，和仓库配置文件
-Dsbt.global.base=D:/IDE/sbt/.sbt
-Dsbt.ivy.home=D:/IDE/sbt/.ivy2
-Dsbt.repository.config=D:/IDE/sbt/conf/repo.properties
```

#### （3）添加文件`repo.properties`，配置仓库国内镜像
```
[repositories]
#local
public: http://maven.aliyun.com/nexus/content/groups/public/
typesafe:http://dl.bintray.com/typesafe/ivy-releases/ , [organization]/[module]/(scala_[scalaVersion]/)(sbt_[sbtVersion]/)[revision]/[type]s/[artifact](-[classifier]).[ext], bootOnly
ivy-sbt-plugin:http://dl.bintray.com/sbt/sbt-plugin-releases/, [organization]/[module]/(scala_[scalaVersion]/)(sbt_[sbtVersion]/)[revision]/[type]s/[artifact](-[classifier]).[ext]
sonatype-oss-releases
sonatype-oss-snapshots
```

### 3、sbt命令
#### （1）一般操作
进入项目根目录
sbt compile 编译
sbt run
sbt package
sbt clean
sbt clean package 
等等，类似于maven命令

#### （2）sbt shell
sbt进入sbt shell交互环境，可以直接执行以上命令

#### （3）sbt持续编译
```bash
sbt
~compile
```

### 4、使用sbt和ScalaTest运行测试
在`build.sbt`添加依赖
```
libraryDependencies += "org.scalatest" % "scalatest_2.12" % "3.0.1"
```

在`src\test\java`目录下编写测试用例
```scala
package com.alvinalexander.testproject
import org.scalatest.FunSuite
class HelloTests extends FunSuite {
	test("the name is set correctly in constructor") {
		val p = Person("Barney Rubble")
		assert(p.name == "Barney Rubble")
	}
	test("a Person's name can be changed") {
		val p = Person("Chad Johnson")
		p.name = "Ochocinco"
		assert(p.name == "Ochocinco")
	}
}
```

运行测试`sbt test`

### 5、使用sbt管理依赖
#### （1）完整的`build.sbt`文件结构示例
```
name := "BasicProjectWithScalaTest"
version := "1.0"
scalaVersion := "2.10.0"
libraryDependencies += "org.scalatest" %% "scalatest" % "1.9.1" % "test"
```

#### （2）依赖声明方式
方式1：`libraryDependencies += groupID % artifactID % revision`
```scala
libraryDependencies += "net.sourceforge.htmlcleaner" % "htmlcleaner" % "2.4"
```

方式2：`libraryDependencies += groupID % artifactID % revision % configuration`
```scala
libraryDependencies += "org.scalatest" %% "scalatest" % "1.9.1" % "test"

//%% 表示在artifactID后面添加scala版本信息
```

方式3：多个依赖
```scala
libraryDependencies ++= Seq(
 "net.sourceforge.htmlcleaner" % "htmlcleaner" % "2.4",
 "org.scalatest" % "scalatest_2.10" % "1.9.1" % "test",
 "org.foobar" %% "foobar" % "1.8"
)
```


#### （3）依赖版本声明
版本标签
```scala
libraryDependencies += "org.foobar" %% "foobar" % "latest.integration"
```

标签选项
* latest.integration
* latest.[any status], 例如 latest.milestone
* 在revision 结尾加上一个 + 字符，将选取最新版本


### 6、使用子项目
略

### 7、在eclipse中使用sbt
在`.sbt\plugins\`下添加sbteclipse.sbt文件
内容为
```scala
addSbtPlugin("com.typesafe.sbteclipse" % "sbteclipse-plugin" % "4.0.0")
```

建立如上所述的目录结构
键入`sbt eclipse`

在eclipse中导入，修改运行时依赖库即可

每次更新依赖等构建文件时，要执行`sbt eclipse`， 在eclipse中刷新项目


## 十三、web服务
**************************************************
### 1、Json与对象互转
#### （1）从简单scala对象创建Json字符串
方式一：Lift-JSON解决方法
```scala
package com.rectcircle.scala.web

import scala.collection.mutable._
import net.liftweb.json._
import net.liftweb.json.Serialization.write

case class Person(name: String, address: Address)

case class Address(city: String, state: String)

object LiftJsonTest extends App {
	val p = Person("Alvin Alexander", Address("Talkeetna", "AK"))
	implicit val formats = DefaultFormats
	val jsonString = write(p)
	println(jsonString)
}
```

#### （2）从包含集合的对象创建Json字符串
使用Lift-JSON
```scala
//通过元组的形式
package com.rectcircle.scala.web

import net.liftweb.json._
import net.liftweb.json.JsonDSL._

case class Person(name: String, address: Address) {
	var friends = List[Person]()
}

case class Address(city: String, state: String)

object LiftJsonListsVersion1 extends App {
	//引入类型隐式类型转换器
	implicit val formats = DefaultFormats
	
	//测试对象
	val merc = Person("Mercedes", Address("Somewhere", "KY"))
	val mel = Person("Mel", Address("Lake Zurich", "IL"))
	val friends = List(merc, mel)
	
	val p = Person("Alvin Alexander", Address("Talkeetna", "AK"))
	p.friends = friends

//写法一
	// 定义输出映射
	val json = 
		( 
			"person"→ (
				("name" → p.name)~
				("address"→("city"→p.address.city)~("state"→p.address.state))~
				("friends"→p.friends.map ( f => 
					("name"→f.name)~
					("address"→("city"→f.address.city)~("state"→f.address.state)) 
				))
			)
		)
	println(pretty(render(json)))
}

//写法二函数方式
def getAddressJson(p:Person)={
		("address"→("city"→p.address.city)~("state"→p.address.state))
	}
	
	def getFriendJson(p:Person)={
		("friends"→p.friends.map ( f => 
			("name"→f.name)~
			("address"→("city"→f.address.city)~("state"→f.address.state)) 
		))		
	}
	
	val personToJson = 
		(
			"person"→
				("name"→p.name)~
				getAddressJson(p)~
				getFriendJson(p)
		)
	println(pretty(render(personToJson)))
```

两次输出都为
```json
{
  "person":{
    "name":"Alvin Alexander",
    "address":{
      "city":"Talkeetna"
    },
    "state":"AK",
    "friends":[
      {
        "name":"Mercedes",
        "address":{
          "city":"Somewhere"
        },
        "state":"KY"
      },
      {
        "name":"Mel",
        "address":{
          "city":"Lake Zurich"
        },
        "state":"IL"
      }
    ]
  }
}
```

#### （3）将JSON解析成简单Scala对象
```scala
package com.rectcircle.scala.web
import net.liftweb.json._

case class MailServer(url: String, username: String, password: String)
object JsonParsingExample extends App {
	implicit val formats = DefaultFormats
	// 简单的json字符串
	val jsonString = """
{
"url": "imap.yahoo.com",
"username": "myusername",
"password": "mypassword"
}
"""
	// 将一个字符串转换为一个jvalue对象
	val jValue = parse(jsonString)
	// 通过泛型创建一个MailServer的字符串对象
	val mailServer = jValue.extract[MailServer]
	println(mailServer.url)
	println(mailServer.username)
	println(mailServer.password)
}

/*输出为：
imap.yahoo.com
myusername
mypassword
*/
```

#### （4）将JSON解析成包含对象的数组
```scala
package com.rectcircle.scala.web
import net.liftweb.json.DefaultFormats
import net.liftweb.json._

case class EmailAccount(
	accountName: String,
	url: String,
	username: String,
	password: String,
	minutesBetweenChecks: Int,
	usersOfInterest: List[String])
	

object ParseJsonArray extends App {
	implicit val formats = DefaultFormats
	// 测试字符串
	val jsonString = """
{
    "accounts": [
        {
            "emailAccount": {
                "accountName": "YMail",
                "username": "USERNAME",
                "password": "PASSWORD",
                "url": "imap.yahoo.com",
                "minutesBetweenChecks": 1,
                "usersOfInterest": [
                    "barney",
                    "betty",
                    "wilma"
                ]
            }
        },
        {
            "emailAccount": {
                "accountName": "Gmail",
                "username": "USER",
                "password": "PASS",
                "url": "imap.gmail.com",
                "minutesBetweenChecks": 1,
                "usersOfInterest": [
                    "pebbles",
                    "bam-bam"
                ]
            }
        }
    ]
}
"""
	// 解析字符串创建一个JValue的实例
	val json = parse(jsonString)
	//获得一个List，去处一层包裹
	val elements = (json \\ "emailAccount").children
	for (acct <- elements) {
		//转换为对象
		val m = acct.extract[EmailAccount]
		println(s"Account: ${m.url}, ${m.username}, ${m.password}")
		println(" Users: " + m.usersOfInterest.mkString(","))
	}
}

/*输出
Account: imap.yahoo.com, USERNAME, PASSWORD
 Users: barney,betty,wilma
Account: imap.gmail.com, USER, PASS
 Users: pebbles,bam-bam
*/
```

### 2、Scalatra web服务
#### (1)使用giter8创建项目模板
```bash
g8 file://D:/IDE/scalag8temp/scalatra-sbt.g8-master
cd 项目目录
sbt
jetty:start #启动服务器
~;jetty:stop;jetty:start #持续编译
```

#### （2）使用挂载替换`web.xml` servlet映射
在servlet包内添加继承自`MyScalatraWebAppStack`的类，相当于java的servlet
```scala
package com.example.app

class Test1Servlet extends MyScalatraServlet {
	get("/") {
		<p>Test1</p>
	}
}

class Test2Servlet extends MyScalatraServlet {
	get("/") {
		<p>Test2</p>
	}
}

```
在`class ScalatraBootstrap extends LifeCycle`添加新的映射相当于java的servlet映射
```scala
import com.example.app._
import org.scalatra._
import javax.servlet.ServletContext

class ScalatraBootstrap extends LifeCycle {
  override def init(context: ServletContext) {
    context.mount(new MyScalatraServlet, "/*")
    
    context.mount(new Test1Servlet, "/test1/*")
    context.mount(new Test2Servlet, "/test2/*")
  }
}
```

#### （3）获取get参数
传统get参数
```scala
class login1Servlet extends MyScalatraServlet {
	get("/") {
		val username = params("username")
		val password = params("password")
		
		<p>{username}-{password}</p>
		
	}
}
```

restful风格参数
```scala
get("/:username/:password") {
	val username = params("username")
	val password = params("password")

	<p>{username}-{password}</p>
}
```
其他详见scalatra文档

#### （4）获取post参数
常用方法
```scala
val username = params("username")
val jsonString = request.body
response.addHeader("ACK", "GOT IT")
```

### 3、play框架
#### （0）下载activator
下载解压
添加环境变量、
添加sbt配置文件conf/sbtconfig.txt配置仓库镜像

#### （1）开始创建
sbt方式
```bash
g8 file://D:\IDE\scalag8temp\play-scala-seed.g8-master
进入项目目录
sbt
eclipse
run
```
activator方式
```bash
activator ui #选择模板创建
```

#### （2）远程debug
```bash
activator -jvm-debug 9999
```



## 十四、数据库和持久化
**************************************************
### 1、使用JDBC连接数据库
#### （1）创建一个sbt项目

#### （2）加入jdbc依赖
```scala
libraryDependencies += "mysql" % "mysql-connector-java" % "5.1.38"
```

#### （3）编写测试用例
```scala
import java.sql.{ Connection, DriverManager }

object ScalaJdbcConnectSelect extends App {
	// connect to the database named "mysql" on port 8889 of localhost
	val url = "jdbc:mysql://localhost:3306/mysql"
	val driver = "com.mysql.jdbc.Driver"
	val username = "root"
	val password = "123456"
	var connection: Connection = _
	try {
		Class.forName(driver)
		connection = DriverManager.getConnection(url, username, password)
		val statement = connection.createStatement
		val rs = statement.executeQuery("SELECT host, user FROM user")
		while (rs.next) {
			val host = rs.getString("host")
			val user = rs.getString("user")
			println("host = %s, user = %s".format(host, user))
		}
	} catch {
		case e: Exception => e.printStackTrace
	}
	connection.close
}
```


### 2、使用Spring JDBCTemp连接数据库
#### （1）引入依赖
```scala
libraryDependencies ++= Seq(
 "mysql" % "mysql-connector-java" % "5.1.+",
 "commons-dbcp" % "commons-dbcp" % "1.4",
 "org.springframework" % "spring-core" % "3.1+",
 "org.springframework" % "spring-beans" % "3.1+",
 "org.springframework" % "spring-jdbc" % "3.1+",
 "org.springframework" % "spring-tx" % "3.1+"
)
```

#### （2）配置spring.xml配置文件
```scala
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE beans PUBLIC "-//SPRING//DTD BEAN//EN"
"http://www.springframework.org/dtd/spring-beans.dtd">
<beans>
	<bean id="testDao" class="com.rectcircle.test.dao.TestDao">
		<property name="dataSource" ref="basicDataSource" />
	</bean>
	<bean id="basicDataSource" class="org.apache.commons.dbcp.BasicDataSource">
		<property name="driverClassName" value="com.mysql.jdbc.Driver" />
		<property name="url" value="jdbc:mysql://localhost/mysql" />
		<property name="username" value="root" />
		<property name="password" value="123456" />
		<property name="initialSize" value="1" />
		<property name="maxActive" value="5" />
	</bean>
</beans>
```

#### （3）编写Dao.scala
```scala
package com.rectcircle.test.dao

import org.springframework.jdbc.core.simple.SimpleJdbcDaoSupport

class TestDao extends SimpleJdbcDaoSupport {
	def getNumUsers: Int = {
		val query = "select count(1) from user"
		return getJdbcTemplate.queryForInt(query)
	}

}
```

#### （4）编写测试
```scala
import org.springframework.context.support.ClassPathXmlApplicationContext
import com.rectcircle.test.dao.TestDao

object Main extends App {
	val ctx = new ClassPathXmlApplicationContext("spring.xml")
	val testDao = ctx.getBean("testDao").asInstanceOf[TestDao]
	val numUsers = testDao.getNumUsers
	println("You have this many users: " + numUsers)
}
```


## 十五、与java交互
**************************************************
### 1、集合转换
#### （1）java集合转为scala集合
一般情况下，java的集合不会有scala的特性
```scala
def nums = {
	var list = new java.util.ArrayList[Int]
	list.add(1)
	list.add(2)
	list.add(3)
	list
}                                         //> nums: => java.util.ArrayList[Int]

var list = nums                           //> list  : java.util.ArrayList[Int] = [1, 2, 3]
list.foreach(println) //报错
```

引入`import scala.collection.JavaConversions._`,scala将进行隐式转换
```scala
def nums = {
	var list = new java.util.ArrayList[Int]
	list.add(1)
	list.add(2)
	list.add(3)
	list
}                                         //> nums: => java.util.ArrayList[Int]

var list = nums                           //> list  : java.util.ArrayList[Int] = [1, 2, 3]
import scala.collection.JavaConversions.asScalaBuffer
list.foreach(println)                     //> 1
																								//| 2
																								//| 3
```

或者进行显示的转换
```
//...
import scala.collection.JavaConversions.asScalaBuffer
val list = asScalaBuffer(nums)            //> list  : scala.collection.mutable.Buffer[Int] = Buffer(1, 2, 3)
list.foreach { println }                  //> 1
																								//| 2
																								//| 3
```

#### （2）scala集合转化为java集合
```scala
import scala.collection.JavaConversions._
import scala.collection.mutable._
//显示转换
val sum1 = seqAsJavaList(Seq(1, 2, 3))    //> sum1  : java.util.List[Int] = [1, 2, 3]
val sum2 = bufferAsJavaList(ArrayBuffer(1,2,3))
																								//> sum2  : java.util.List[Int] = [1, 2, 3]
val sum3 = bufferAsJavaList(ListBuffer(1,2,3))
																								//> sum3  : java.util.List[Int] = [1, 2, 3]

def test( a:java.util.List[Int]):Int={
	1
}                                         //> test: (a: java.util.List[Int])Int
//隐式转换
val t = test(Seq(1, 2, 3))                //> t  : Int = 1

```

### 2、scala添加异常注解
scala没有受检异常，所以添加@throws在java中才会提示有异常
```scala
class Thrower {
	@throws(classOf[Exception])
	def exceptionThrower {
		throw new Exception("Exception!")
	}
}
```

### 3、使用@SerialVersionUID等注解
#### （1）java使用scala对象序列化需要使用@SerialVersionUID
```scala
@SerialVersionUID(1000L)
class Foo extends Serializable {
 // class code here
}
```

#### （2）其他为了适用于java交互的注解
| Scala | Java |
|-------|-------|
| scala.beans.BeanProperty | scala生成get/set方法 |
| scala.cloneable | java.lang.Cloneable |
| scala.deprecated | java.lang.Deprecated |
| scala.inline | 相当于c++内联函数 |
| scala.native | 相当于Java native关键字 |
| scala.remote | java.rmi.Remote | 
| scala.serializable | java.io.Serializable |
| scala.SerialVersionUID | serialVersionUID field. |
| scala.throws |java throws 关键字|
| scala.transient | transient 关键字 |
| scala.unchecked | 不进行额外的编译器检查 |
| scala.annotation.varargs | 用于方法生成一个Java风格的可变参数 |
| scala.volatile | volatile 关键字 |

### 4、强制类型转换
spring中使用.asInstanceOf[Animal]
```scala
package scalaspring
abstract class Animal(name: String) {
 def speak: Unit // asbtract
}
class Dog(name: String) extends Animal(name) {
 override def speak {
 println(name + " says Woof")
 }
}
class Cat(name: String) extends Animal(name) {
 override def speak {
 println(name + " says Meow")
 }
}


main
// instantiate the dog and cat objects from the application context
val dog = ctx.getBean("dog").asInstanceOf[Animal]
val cat = ctx.getBean("cat").asInstanceOf[Animal]
// let them speak
dog.speak
cat.speak
```
### 5、可变长参数
```scala
@varargs def printAll(args: String*) {
	args.foreach(print)
	println
}
```

### 6、创建符合javabean标准的类
```scala
import scala.beans.BeanProperty
class Person(@BeanProperty var firstName: String,
	@BeanProperty var lastName: String) {
	override def toString = s"Person: $firstName $lastName"
}


val p = new Person("firstname","lastName")//> p  : Test.Person = Person: firstname lastName


p.getFirstName();                         //> res0: String = firstname
p.setLastName("test")
```
如果字段为val类型，则只生成get方法，不会生成set方法

### 7、java无法继承包含实现的特质
解决方法使用包装类
```scala
// scala
package foo
// the original trait
trait MathTrait {
 def sum(x: Int, y: Int) = x + y
}
// the wrapper class
class MathTraitWrapper extends MathTrait
```
java使用
```java
// java
package foo;
public class JavaMath extends MathTraitWrapper {
 public static void main(String[] args) {
 new JavaMath();
 }
 public JavaMath() {
 System.out.println(sum(2,2));
 }
}

```


## 十六、类型（泛型系统）
**************************************************
**型变**
```scala
class Grandparent
class Parent extends Grandparent
class Child extends Parent
class InvariantClass[A]
class CovariantClass[+A]
class ContravariantClass[-A]
class VarianceExamples {
	def invarMethod(x: InvariantClass[Parent]) {}
	def covarMethod(x: CovariantClass[Parent]) {}
	def contraMethod(x: ContravariantClass[Parent]) {}
	
	invarMethod(new InvariantClass[Child]) // ERROR - won't compile
	invarMethod(new InvariantClass[Parent]) // success
	invarMethod(new InvariantClass[Grandparent]) // ERROR - won't compile
	
	covarMethod(new CovariantClass[Child]) // success
	covarMethod(new CovariantClass[Parent]) // success
	covarMethod(new CovariantClass[Grandparent]) // ERROR - won't compile
	
	contraMethod(new ContravariantClass[Child]) // ERROR - won't compile
	contraMethod(new ContravariantClass[Parent]) // success
	contraMethod(new ContravariantClass[Grandparent]) // success
}
```
方法参数为泛型时
[A] 不变 只接受A类型
[+A] 协变 只接受类型A和A的子类
[-A] 逆变 接受非A的子类

**边界**

|示例|名字|描述|
|---|----|----|
|A<:B|上界|A必须是B的子类型|
|A>:B|下界|A必须是B的父类型|
|A<:Upper >: Lower|同时有父子类型限制|

### 1、创建使用泛型的类
```scala
class LinkedList[A] {
	private class Node[A](elem: A) {
		var next: Node[A] = _
		override def toString = elem.toString
	}
	private var head: Node[A] = _
	def add(elem: A) {
		val n = new Node(elem)
		n.next = head
		head = n
	}

	def +=(elem:A) {
		add(elem)
	}

	private def printNodes(n: Node[A]) {
		if (n != null) {
			println(n)
			printNodes(n.next)
		}
	}
	def printAll() { printNodes(head) }
}

val list = new LinkedList[Int];           //> list  : Test.LinkedList[Int] = Test$LinkedList@5e8c92f4
list += 1
list add 2
list.add(3)
list printAll                             //> 3
																								//| 2
                                                  //| 1
```

### 2、创建一个接受简单泛型的方法
例子
```scala
def randomName(names: Seq[String]) = {
	val randomNum = util.Random.nextInt(names.length)
	names(randomNum)
}                                         //> randomName: (names: Seq[String])String

val names = Seq("Aleka", "Christina", "Tyler", "Molly")
																								//> names  : Seq[String] = List(Aleka, Christina, Tyler, Molly)
val winner = randomName(names)            //> winner  : String = Tyler
```



### 3、结构化模型

`def func[A <: {函数1声明}](obj:A){}`
表示A类型必须包含函数1的实现

```scala
def callSpeak[A <: { def speak(): Unit }](obj: A) {
	// code here ...
	obj.speak()
}                                         //> callSpeak: [A <: AnyRef{def speak(): Unit}](obj: A)Unit
class Dog { def speak() { println("woof") } }
class Klingon { def speak() { println("Qapla!") } }

callSpeak(new Dog)                        //> woof
callSpeak(new Klingon)                    //> Qapla!
```

### 4、让可变集合非变（Invariant）
声明方式
```scala
class Array[A] ...
class ArrayBuffer[A] ...
```
这样泛型方法的传递泛型实例的子类型将报错
**例子**
```scala
import scala.collection.mutable.ArrayBuffer

object Main extends App {

	trait Animal {
		def speak
	}
	class Dog(var name: String) extends Animal {
		def speak { println("woof") }
		override def toString = name
	}
	class SuperDog(name: String) extends Dog(name) {
		def useSuperPower { println("Using my superpower!") }
	}
	
	val fido = new Dog("Fido")
	
	val wonderDog = new SuperDog("Wonder Dog")
	val shaggy = new SuperDog("Shaggy")
	


	def makeDogsSpeak(dogs: ArrayBuffer[Dog]) {
		dogs.foreach(_.speak)
	}
	
	val dogs = ArrayBuffer[Dog]()
	dogs += fido
	dogs += wonderDog

	val dogs1 = ArrayBuffer[Dog]()
	dogs1 += fido
	
	makeDogsSpeak(dogs) //正确
	makeDogsSpeak(dogs1) //正确
	
	val superDogs = ArrayBuffer[SuperDog]()
	superDogs += shaggy
	superDogs += wonderDog
	makeDogsSpeak(superDogs) //报错
}
```

### 5、让不可变集合协变（Covariant）
声明方式
```scala
class List[+T]
class Vector[+A]
trait Seq[+A]
```
这样泛型方法的传递泛型实例的子类型将将正确

```scala
import scala.collection.mutable.ArrayBuffer

object Main extends App {

	trait Animal {
		def speak
	}
	class Dog(var name: String) extends Animal {
		def speak { println("woof") }
		override def toString = name
	}
	class SuperDog(name: String) extends Dog(name) {
		def useSuperPower { println("Using my superpower!") }
	}
	
	val fido = new Dog("Fido")
	
	val wonderDog = new SuperDog("Wonder Dog")
	val shaggy = new SuperDog("Shaggy")
	


	def makeDogsSpeak(dogs: List[Dog]) {
		dogs.foreach(_.speak)
	}
	
	val dogs = List[Dog](fido,wonderDog)
	makeDogsSpeak(dogs) //正确
	
	val superDogs = List[SuperDog](shaggy,wonderDog)
	makeDogsSpeak(superDogs) //正确
}
```
### 6、创建所有元素都是基本类型的集合
`class Crew[A <: CrewMember] extends ArrayBuffer[A]`
`class Crew[A <: CrewMember with StarfleetTrained] extends ArrayBuffer[A]`
对泛型进行限制
```scala
trait CrewMember
class Officer extends CrewMember
class RedShirt extends CrewMember
trait Captain
trait FirstOfficer
trait ShipsDoctor
trait StarfleetTrained
val kirk = new Officer with Captain               //> kirk  : Test.Officer with Test.Captain = Test$$anonfun$main$1$$anon$1@5e8c92
                                                  //| f4
val spock = new Officer with FirstOfficer         //> spock  : Test.Officer with Test.FirstOfficer = Test$$anonfun$main$1$$anon$2@
                                                  //| 6a5fc7f7
val bones = new Officer with ShipsDoctor          //> bones  : Test.Officer with Test.ShipsDoctor = Test$$anonfun$main$1$$anon$3@3
                                                  //| b6eb2ec

class Crew[A <: CrewMember] extends ArrayBuffer[A]

val officers = new Crew[Officer]()                //> officers  : Test.Crew[Test.Officer] = ArrayBuffer()
officers += kirk                                  //> res0: Test.officers.type = ArrayBuffer(Test$$anonfun$main$1$$anon$1@5e8c92f4
                                                  //| )
officers += spock                                 //> res1: Test.officers.type = ArrayBuffer(Test$$anonfun$main$1$$anon$1@5e8c92f4
                                                  //| , Test$$anonfun$main$1$$anon$2@6a5fc7f7)
officers += bones                                 //> res2: Test.officers.type = ArrayBuffer(Test$$anonfun$main$1$$anon$1@5e8c92f4
                                                  //| , Test$$anonfun$main$1$$anon$2@6a5fc7f7, Test$$anonfun$main$1$$anon$3@3b6eb2
                                                  //| ec)
```

### 7、给封闭类型添加新行为
例子：
给Dog添加行为，不给Cat添加行为
```scala
import scala.collection.mutable.ArrayBuffer

object Test {

	// 一个已经存在的封闭的类
	trait Animal
	final case class Dog(name: String) extends Animal
	final case class Cat(name: String) extends Animal

	object Humanish {
		// 这只一个类型类
		// 定义一个抽象方法speak
		trait HumanLike[A] {
			def speak(speaker: A): Unit
		}
		// 伴生对象
		object HumanLike {
			// 实现每个所需类型的行为。在这种情况下，只要为Dog定义
			//理解为只要传入的对象类型为Dog就会执行这个函数
			implicit object DogIsHumanLike extends HumanLike[Dog] {
				def speak(dog: Dog) { println(s"I'm a Dog, my name is ${dog.name}") }
			}
		}
	}

	import Humanish.HumanLike

	// 创建一个使动物说话的方法
	// 理解为传进来一个对象是A类型的，且A类型在HumanLike特质里面实现了一个类型转换方法，将编译成功
	// 并且会生成一个HumanLike[A]类型的对象在函数体中就可以调用
	def makeHumanLikeThingSpeak[A](animal: A)(implicit humanLike: HumanLike[A]) {
		humanLike.speak(animal)
	}                                         //> makeHumanLikeThingSpeak: [A](animal: A)(implicit humanLike: Test.Humanish.Hu
                                                  //| manLike[A])Unit
	// 因为HumanLike实现Dog的转换，所以它会工作
	makeHumanLikeThingSpeak(Dog("Rover"))     //> I'm a Dog, my name is Rover

	//makeHumanLikeThingSpeak(Cat("Morris")) //报错
}
```

实际应用
```scala
import scala.collection.mutable.ArrayBuffer

object Test {
	def add[A](x: A, y: A)(implicit numeric: Numeric[A]): A = numeric.plus(x, y)
                                                  //> add: [A](x: A, y: A)(implicit numeric: Numeric[A])A
	println(add(1, 1))                        //> 2
	println(add(1.0, 1.5))                    //> 2.5
	println(add(1, 1.5F))                     //> 2.5

}
```

### 8、定义类型，关键字
实现一个算法用时计时器
```scala
def timer[A](codeBlock: => A) = {
	val startTime = System.nanoTime
	val result = codeBlock
	val stopTime = System.nanoTime
	val delta = stopTime - startTime
	(result, delta / 1000000d)
}                                         //> timer: [A](codeBlock: => A)(A, Double)
timer{
	Thread.sleep(500)
}                                         //> res0: (Unit, Double) = ((),515.793197)
```


## 十七、习惯用法
**************************************************


