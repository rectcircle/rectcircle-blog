---
title: scala web scalatra（二）
date: 2017-01-02T22:10:01+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/36
  - /detail/36/
tags:
  - scala
---

## 五、资源

以下操作暂时未经验证，基于`addSbtPlugin("org.scalatra.sbt" % "scalatra-sbt" % "0.5.1")`无法配置。等待官方文档

### 1、CoffeScript支持

CoffeeScript是一个很棒的客户端脚本语言，修复了许多Javascript的缺点

#### （1）完整使用指南

因为CoffeeScript是一个外部项目，我们不会在这里尝试重现它的文档。转到[官方文档](http://coffee-script.org/)。

#### （2）在Scalatra中使用CoffeeScript

**a.  安装**

通过将依赖项添加到`project/plugins.sbt`中来安装插件

```scala
addSbtPlugin("com.bowlingx" %% "xsbt-wro4j-plugin" % "0.3.5")
```

**b. 启用**

将这些imports添加到build.sbt的最顶部：

```scala
import com.bowlingx.sbt.plugins.Wro4jPlugin._
import Wro4jKeys._
```

现在启用插件，通过添加这些行到您的build.sbt，所有的导入。不要尝试删除空白行！

```scala
seq(wro4jSettings: _*)

(webappResources in Compile) <+= (targetFolder in generateResources in Compile)
```

**c. 配置**

不幸的是，我们使用的插件需要一些配置。 创建文件src/main/webapp/WEB-INF/wro.xml，告诉编译器我们的CoffeeScript文件在哪里：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<groups
    xmlns="http://www.isdc.ro/wro"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.isdc.ro/wro wro.xsd"
    >

  <group name="scripts">
    <js>/coffee/*.coffee</js>
  </group>
</groups>
```

还需要创建文件`src/main/webapp/WEB-INF/wro.properties`, 请求CoffeeScript编译：

```
preProcessors = coffeeScript
postProcessors =
```

#### （3）例子

如上配置，你需要将文件放置到`src/main/webapp/coffee`，后缀名为`.coffee`

### 2、LESS CSS

### 3、wro4j

## 六、格式化

### 1、文件上传

默认情况下，文件上载支持包含在Scalatra中，利用Servlet 3.0 API内置的对多部分/表单数据请求的支持。有关工作示例，请参阅FileUploadExample.scala。

要启用文件上传支持，请混入FileUploadSupport来扩展应用程序，并使用对configureMultipartHandling的调用设置上传配置：

```scala
import org.scalatra.ScalatraServlet
import org.scalatra.servlet.{FileUploadSupport, MultipartConfig, SizeConstraintExceededException}

class MyApp extends ScalatraServlet with FileUploadSupport {
  configureMultipartHandling(MultipartConfig(maxFileSize = Some(3*1024*1024)))
  // ...
}
```

如果您更喜欢在MultipartConfig上使用`web.xml`，您还可以在`<servlet>`中放置`<multipart-config>`：

```scala
<servlet>
  <servlet-name>myapp</servlet-name>
  <servlet-class>com.me.MyApp</servlet-class>

  <multipart-config>
    <max-file-size>3145728</max-file-size>
  </multipart-config>
</servlet>
```

有关可配置属性的更多详细信息，请参阅[javax.servlet.annotation.MultipartConfig Javadoc。](http://docs.oracle.com/javaee/6/api/javax/servlet/annotation/MultipartConfig.html)

Jetty用户注意：web.xml中的MultipartConfig和`<multipart-config>`标记在版本8.1.3之前的Jetty中不能正常工作。

如果要嵌入Jetty，您必须在您的ScalatraBootstrap中安装servlet，或者必须通过ServletHolder进行配置：

```scala
  import org.scalatra.servlet.MultipartConfig
  // ...
  val holder = context.addServlet(classOf[YourScalatraServlet], "/*")
  holder.getRegistration.setMultipartConfig(
    MultipartConfig(
      maxFileSize = Some(3*1024*1024),
      fileSizeThreshold = Some(1*1024*1024)
    ).toMultipartConfigElement
  )
  // ...
}
```

确保您的表单是`multipart/form-data`类型：

```scala
get("/") {
  <form method="post" enctype="multipart/form-data">
    <input type="file" name="thefile" />
    <input type="submit" />
  </form>
}
```

要处理用户上传太大的文件的情况，您可以定义错误处理程序：

```scala
error {
  case e: SizeConstraintExceededException => RequestEntityTooLarge("too much!")
}
```

处理用户上传

```scala
post("/") {
	fileParams.get("file") match {
		case Some(file) =>

			file.write(new File("D:/Test/"+file.name))
//				println(file.name)
//				Ok(file.get(), Map(
//					"Content-Type"        -> (file.contentType.getOrElse("application/octet-stream")),
//					"Content-Disposition" -> ("attachment; filename=\"" + file.name + "\"")
//				))
			<p>上传成功</p>

		case None =>
			BadRequest(
				<p>
					Hey! You forgot to select a file.
				</p>
			)
	}
}
```

### 2、json处理

Scalatra使JSON处理快速和容易。通过添加几个库导入和几行代码，您可以获得自动JSON序列化和反序列化任何Scala case类。

#### （1）返回json

添加依赖

```scala
  "org.scalatra" %% "scalatra-json" % ScalatraVersion,
  "org.json4s"   %% "json4s-jackson" % "3.3.0",
```

重新启动sbt下载新的jars。

将以下导入添加到您的Controller文件的顶部，以便使新的JSON库可用：

```scala
// JSON相关库
import org.json4s.{DefaultFormats, Formats}

// 来自Scalatra的JSON处理支持
import org.scalatra.json._
```

现在我们可以添加一点魔法到Controller。将这行代码放在控制器类定义下面将允许您的控制器自动将Scalatra动作结果转换为JSON：

```scala
//设置自动case类到JSON输出序列化，需要JValueResult trait。
protected implicit lazy val jsonFormats: Formats = DefaultFormats
```

要将小数数字序列化为BigDecimal而不是Double，请使用DefaultFormats.withBigDecimal：

```scala
protected implicit lazy val jsonFormats: Formats = DefaultFormats.withBigDecimal
```

注意：在使用JacksonJsonSupport时，在受保护的隐式惰性val上的延迟是必要的，而不是可选的。

过滤器在所有请求之前运行。添加前置过滤器以设置此控制器的所有输出，以将所有操作结果的内容类型设置为JSON：

```scala
// 在每个操作运行之前，将内容类型设置为JSON格式。
before() {
	contentType = formats("json")
}
```

现在将JacksonJsonSupport混合到你的servlet中，这样控制器声明看起来像这样：

```scala
class JsonController extends ScalatratestStack with JacksonJsonSupport{
}
```

get/post方法等直接返回case对象或者case对象的集合

```scala
case class User(id:Long,username:String,password:String){
	def this(username:String, password:String) = {
		this(0, username,password)
	}
}

get("/caseClass"){
	User(1,"u1","123")
}

get("/caseClassList"){
	List(
		User(1,"u1","123"),
		User(2,"u2","456")
	)
}

get("/complexJson"){
	Map(
		"errcode" -> 0,
		"errmsg" -> "success",
		"data" -> Map(
			"userList" -> List(
				User(1,"u1","123"),
				User(2,"u2","456")
			),
			"status" -> 0
		)
	)
}
```

输出

```json
//get("/caseClass")
{
    "id": 1,
    "username": "u1",
    "password": "123"
}

//get("/caseClassList")
[
	{
		"id": 1,
		"username": "u1",
		"password": "123"
	},
	{
		"id": 2,
		"username": "u2",
		"password": "456"
	}
]

//get("/complexJson")
{
    "errcode": 0,
    "errmsg": "success",
    "data": {
        "userList": [
            {
                "id": 1,
                "username": "u1",
                "password": "123"
            },
            {
                "id": 2,
                "username": "u2",
                "password": "456"
            }
        ],
        "status": 0
    }
}
```

#### （2）接收json

```scala
	post("/create"){
		val u = parsedBody.extract[User]
		println(u)
		u
	}
```

参数必须和对象的一个构造函数匹配（大小写敏感）。
忽略非构造函数的参数

#### （3）操作JSON

您可以通过覆盖方法transformRequestBody在接收之前转换JSON AST

```scala
protected override def transformRequestBody(body: JValue): JValue = body.camelizeKeys
```

同样，您也可以通过覆盖方法transformResponseBody在发送之前转换JSON AST

```scala
protected override def transformResponseBody(body: JValue): JValue = body.underscoreKeys
```

### 3、命令和数据验证

***以下验证失败，仅供参考***

Scalatra包括一组非常复杂的验证命令。

这些允许您解析传入数据，实例化命令对象，并自动将验证应用于对象。这听起来像是可能是相当复杂，但一旦你有（很少）基础设施到位，它可以大大简化你的代码。

假设我们有一个Todolist（任务列表）应用程序，它包含一个用于持久性的简单Todo类：

```scala
//用作数据模型的Todo对象
case class Todo(id: Integer, name: String, done: Boolean = false)
```

使用命令，用于创建和保存新Todo对象的Controller操作可能如下所示：

```scala
post("/todos") {
	(command[CreateTodoCommand] >> (TodoData.create(_))).fold(
		errors => halt(400, errors),
		todo => redirect("/")
	)
}
```

您分别定义该命令，告诉它操作的类类型，并在命令中设置验证：

```scala
object CreateTodoCommand {
//将隐式转换放在create todos命令的伴随对象中，确保它是默认后备
//用于隐式解析。
  implicit def createTodoCommandAsTodo(cmd: CreateTodoCommand): Todo = Todo(~cmd.name.value)
}
class CreateTodoCommand extends TodosCommand[Todo] {

  val name: Field[String] = asType[String]("name").notBlank.minLength(3)

}
```

Several things happen when execute (>>) is called
`>>`被调用是发生一些事情
首先，验证运行，然后将该命令隐式转换为该函数接受的参数，或者仅作为命令传递到该函数中。该函数的结果是ModelValidation。

CreateTodoCommand可以自动读取传入的POST params或JSON等。运行验证以确保name属性为至少包含3个字符的非空String，然后，在这种情况下，保存Todo对象。

请注意，在这段代码中，传入的参数不会自动推送到Todo case类的新实例上。这是因为Scalatra用户习惯性地使用极不相同的方法来持久化框架，并且在涉及到数据验证时有非常不同的需求。

CreateTodoCommand对象给出的是一种方法，在应用程序的任何部分组件化和重用相同的Command对象，这需要创建一个Todo，并根据传入的参数轻松应用验证条件。

由于Scalatra中的验证命令与您选择的持久性库无关，因此命令和验证的概念与持久性的概念完全解耦。您可能希望使命令的execute方法触发持久性函数；同样容易，您可以序列化Todo对象并将其发送到队列，将其附加到另一个对象，或以某种方式对其进行转换。

这有一些好处：

* 数据验证和持久性被去耦合。
* 验证DSL使得设置验证条件非常容易。
* 验证在您的应用程序的前门处理。 坏数据永远不会深入你的堆栈。
* 错误处理和验证失败更方便，您可以使用Scala的模式匹配来确定适当的响应。

#### （1）TodoList应用实例

要看看Scalatra的命令如何工作，让我们创建一个TodoList应用程序。它将允许您使用Scalatra的命令支持来验证传入的数据和进行数据相关的工作。

**a. 使用g8创建项目**

**b. 设置模型和假数据存储区**

模型

```scala
//用作数据模型的Todo对象
case class Todo(id: Integer, name: String, done: Boolean = false)
```

模拟数据存储区

```scala
object TodoData {

	/** 一个计数器变量来伪造我们的自动递增主键 **/
	val idCounter = new AtomicInteger(3)

	/**
	  * 一些假数据，所以我们可以模拟检索。
	  */
	var all = List(
		Todo(1, "Shampoo the cat"),
		Todo(2, "Wax the floor"),
		Todo(3, "Scrub the rug"))

	/** 返回尚未完成的Todos数。 **/
	def remaining = {
		all.filterNot(_.done == true).length
	}

	/** 将一个新的Todo对象添加到todos的现有列表，然后对列表进行排序。
	  */
	def add(todo: Todo): List[Todo] = {
		all ::= todo
		all = all.sortBy(_.id)
		all
	}

	/** 使用自动递增的主键ID实例化一个新的`Todo`对象。 **/
	def newTodo(name: String) = Todo(idCounter.incrementAndGet, name)

}
```

**c. 检索控制器中的对象**

```scala
get("/:id") {
	TodoData.all find (_.id == params("id").toInt) match {
		case Some(todo) => todo
		case None => halt(404)
	}
}
```

**d. Scalatra的命令**

Scalatra的命令使用经典的Gang of Four（Gof）命令模式构建，有一些小的变化。在其最简单的形式中，命令对象具有一个方法execute，它调用另一个类（接收器）上的方法。命令对象可以携带数据，从方法传递到方法，最后告诉接收器在调用execute方法时做一些工作。这是一种增加灵活性和从接收器中分离调用方法的方法。

在Scalatra中，Command对象添加了一些不在传统的GoF命令模式中的东西。首先，他们能够自动读取传入的参数并使用数据填充自己。第二，他们还可以对参数运行验证，以确保数据正确性。

**e. 添加命令到持久化Todo对象**

添加依赖

```scala
"org.scalatra" %% "scalatra-commands" % "2.4.1",
```

添加包`org.scalatra.example.commands`

在包中添加文件

```scala
package org.scalatra.example.commands.commandsupport

// 导入模型
import org.scalatra.example.commands.models._

// Scalatra命令处理器
import org.scalatra.commands._


abstract class TodosCommand[S] extends ParamsOnlyCommand

object CreateTodoCommand {
 //将隐式转换放在create todos命令的伴随对象中，确保它是默认后备
 //用于隐式解析。
  implicit def createTodoCommandAsTodo(cmd: CreateTodoCommand): Todo = Todo(~cmd.name.value)
}

/** 用于验证和创建Todo对象的命令。 */
class CreateTodoCommand extends TodosCommand[Todo] {

  val name: Field[String] = asType[String]("name").notBlank.minLength(3)

}
```

接下来是抽象类TodosCommand。 这为我们的所有命令设置了一个抽象的基类，所以我们不需要在每个命令中重复extends ModelCommand [T]。 它继承自两个其他类，它们都内置到Scalatra中：ModelCommand [S]和ParamsOnlyCommand。

ModelCommand [S]是Scalatra的基础Command对象的一个非常小的子类。它只是一个命令，它接受一个单一的类型参数，它是抽象的。它给了Command对象知道它操作的case类类型的能力。

ParamsOnlyCommand基本上是一个命令类型转换启用。它允许从传入的参数填充命令的字段。

最后，还有具体的CreateTodoCommand类。 这是我们将使用的第一个命令对象，它的工作将是验证Todo对象的传入参数。 完成后，我们将使用命令接收器的handle方法在我们的假数据存储中保存一个新的Todo对象。

**e. 验证**

CreateTodoCommand在类体中有一个有趣的val：

```scala
val name: Field[String] = asType[String]("name").notBlank.minLength(3)
```

这向命令指示Todo有一个名为name的字段，它需要是一个字符串。有两个验证：名称必须是notBlank（即它不能是空字符串或空值），并且它必须有一个minLength（3）（即它必须有一个最小长度为3个字符）。

可用验证的完整列表在[Validators API docs](http://scalatra.org/2.2/api/#org.scalatra.validation.Validators$)

这是命令设置。现在我们有一个可以创建Todos的命令，让我们在控制器动作中使用它来创建一个Todo对象。

**f. 在控制器操作中使用新命令**

回到TodosController，让我们添加一个新的路由，并设置它使用这个新的能力。

## 七、持久化

### 1、介绍

Scalatra的理念是保持简单和坚实。 在其核心，Scalatra基本上是一个领域特定语言（DSL），轻松地做出HTTP请求，和一种扩展核心HTTP路由器与任何你想要的库。 我们认为我们有一个伟大的DSL的HTTP - Sinatra风格打击我们作为或许是最简单，最自然的方式来表达HTTP路由。

数据不同。 每个应用程序都有自己的持久性需求，并且对于如何存储数据的问题，肯定没有一个大小适合的答案。 一些应用程序可以与NoSQL键值数据存储器配合使用; 其他人可能需要具有完全符合ACID的关系数据库。 还有一个ORMs和裸机访问数据的问题 - 再次，意见和编程风格各不相同。

鉴于此，Scalatra没有内置的与特定持久性框架的集成。 相反，我们已经让您轻松地编写自己的集成，通过在应用程序启动和关闭时暴露运行代码的钩子。 您可以将Scalatra钩到您选择的持久性框架，只需少量工作。

本指南将告诉您如何。

#### （2）集成持久性库

虽然细节取决于库，但是使用Scalatra获得所选的持久性库的一般步骤在库之间非常相似。

* 在`project/build.scala`中添加对库的引用
* 在应用程序启动时启动连接池
* 当应用程序停止时清理连接池
* 为控制器提供访问连接池的方法
* 写你的应用程序！

如果你看看现有的Scalatra持久性指南，你会注意到，几乎所有的人都遵循这种常见的模式。

### 2、Squeryl

Squeryl是一个Scala对象关系映射器和领域专用语言，以简洁和类型安全的方式与数据库通信。

我们将使用Squeryl与C3P0，一个“butt-simple”连接池库。

#### （1）添加依赖

```scala
  "org.squeryl" %% "squeryl" % "0.9.5-7",
  "mysql" % "mysql-connector-java" % "5.1.38",
  "c3p0" % "c3p0" % "0.9.1.2",
  "org.slf4j" % "slf4j-api" % "1.7.21",
```

#### （2）设置C3P0连接池

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
		cpds.setDriverClass(driver)
		cpds.setJdbcUrl(url)
		cpds.setUser(username)
		cpds.setPassword(password)

		cpds.setMinPoolSize(1)
		cpds.setAcquireIncrement(1)
		cpds.setMaxPoolSize(50)

		import org.squeryl.SessionFactory
		Class.forName(driver)
		if (SessionFactory.concreteFactory.isEmpty) {
			SessionFactory.concreteFactory = Some(() =>
				Session.create(cpds.getConnection, new MySQLAdapter))
		}

	}
}
```

你可能希望通过读取配置文件来加载数据库凭据，但这取决于你。

#### （3）初始化session池

现在会话池被定义，它需要被初始化。最好的地方是做这个初始化工作是在你的应用程序的ScalatraBootstrap init方法。

打开`src/main/scala/ScalatraBootstrap.scala`，并导入您的`DbConfig trait`。

然后将DatabaseInit trait混合到ScalatraBootstrap中，因此它看起来像这样：

```scala

class ScalatraBootstrap extends LifeCycle with DbConfig{

  val system = ActorSystem()
  val myActor = system.actorOf(Props[MyActor])


  override def init(context: ServletContext) {
    initDbConnection
    context.mount(new MainServlet, "/*")
		//...
  }

  override def destroy(context:ServletContext) {
    closeDbConnection()
    system.terminate()
  }

}
```

#### （4）设置数据库session支持

让我们做一个数据库会话支持trait，可以在您的控制器中使用。一个完整的导入可以看起来像这样：

```scala
package com.rectcircle.scalatrateset.db

import org.scalatra.ScalatraBase
import org.squeryl.{Session, SessionFactory}

/**
  * @author Rectcircle
  *         createTime 2017/1/7
  */
object DatabaseSessionSupport {
	val key = {
		val n = getClass.getName
		if (n.endsWith("$")) n.dropRight(1) else n
	}
}


trait DatabaseSessionSupport { this:ScalatraBase =>
	import DatabaseSessionSupport._

	def dbSession = request.get(key).orNull.asInstanceOf[Session]

	before() {
		request(key) = SessionFactory.newSession
		dbSession.bindToCurrentThread
	}

	after() {
		dbSession.close
		dbSession.unbindFromCurrentThread
	}
}
```

这里的关键是前后过滤器，每个请求打开一个新的数据库会话，并在请求完成后关闭它。

#### （5）将数据库session支持混合到您的servlet中

现在它已经定义，你可以将你的新DatabaseSessionSupport trait混合到你的任何控制器，例如。

```scala
class ArticlesController extends ScalatraServlet with DatabaseSessionSupport
```

任何具有此特性的控制器现在可以使用Squeryl模型。

有关Squeryl的更多介绍，请参见[scala orm Squeryl](https://www.rectcircle.cn/detail/34)。

## 八、web服务

### 1、CORS（跨源资源共享）

如果您需要执行跨源资源共享，Scalatra允许您将CorsSupport trait混合到您的servlet中。

解决ajax跨域问题

添加CorsSupport默认情况下允许来自任何地方的所有请求。不过，您需要向servlet添加一个选项路由，以便您的servlet响应预检请求：

```scala
import org.scalatra.CorsSupport

class YourServlet extends ScalatraBase with CorsSupport {

  options("/*"){
    response.setHeader("Access-Control-Allow-Headers", request.getHeader("Access-Control-Request-Headers"));
  }

}
```

### 2、HTTP client

未写

### 3、OpenID

未写

### 4、OAuth

未写

## 九、测试

### 1、ScalaTest

ScalaTest支持三种主要的测试样式：测试驱动开发（TDD），行为驱动开发（BDD）和验收测试。 ScalaTest还支持在Scala中编写JUnit和TestNG测试。

Scalatra有一个集成，使使用ScalaTest更方便。
为许多套件实现提供了便利特性：

* ScalatraSpec
* ScalatraFlatSpec
* ScalatraFreeSpec
* ScalatraWordSpec
* ScalatraFunSuite
* ScalatraFeatureSpec
* ScalatraJUnit3Suite
* ScalatraJUnitSuite (JUnit 4)
* ScalatraTestNGSuite

#### （1）依赖

```scala
"org.scalatra" %% "scalatra-scalatest" % "2.4.1" % "test"
```

#### （2）例子

使用您的首选`org.scalatest.Suite`实现扩展`ScalatraSuite`。你可以免费获得`ShouldMatchers`和`MustMatchers`。

```scala
import org.scalatra.test.scalatest._
import org.scalatest.FunSuiteLike

class HelloWorldServletTests extends ScalatraSuite with FunSuiteLike {
  // `HelloWorldServlet` is your app which extends ScalatraServlet
  addServlet(classOf[HelloWorldServlet], "/*")

  test("simple get") {
    get("/path/to/something") {
      status should equal (200)
      body should include ("hi!")
    }
  }
}
```

这里使用`addServlet`方法与`classOf[HelloWorldServlet]`一起将HelloWorld servlet安装到ScalaTest测试中。

如果你有一个servlet使用构造函数参数，你需要在测试中使用不同的addServlet方法重载来挂载servlet，例如：

```scala
 implicit val myImplicitHere = new ImplicitConstructorParam
  addServlet(new HelloWorldServlet, "/*")

```

### 2、Specs2

Specs2是用于编写可执行软件规范的库。使用specs2，您可以编写一个类（单元规格）或完整系统（接受规范）的软件规格。
Specs2支持两种基本样式：单位和验收。两者都得到了Scalatra的支持。

#### （1）依赖

```scala
"org.scalatra" %% "scalatra-specs2" % "2.4.1" % "test"
```

#### （2）单元测试

摘自从[Specs2快速入门](http://etorreborre.github.io/specs2/)：

> unit specifications where the specification text is interleaved with the specification code. It is generally used to specify a single class.（单元规格，其中规格文本与规格代码交错。它通常用于指定单个类。）

```scala
import org.scalatra.test.specs2._

class HelloWorldMutableServletSpec extends MutableScalatraSpec {
  addServlet(classOf[HelloWorldServlet], "/*")

  "GET / on HelloWorldServlet" should {
    "return status 200" in {
      get("/") {
        status must_== 200
      }
    }
  }
}
```

#### （3）验收测试

摘自从[Specs2快速入门](http://etorreborre.github.io/specs2/)：

> 验收规范，其中所有规范文本代表一个，实现代码在其他地方。它通常用于接受或集成场景

```scala
import org.scalatra.test.specs2._

class HelloWorldServletSpec extends ScalatraSpec { def is = s2"""
  GET / on HelloWorldServlet
    returns status 200           $getRoot200
"""

  addServlet(classOf[HelloWorldServlet], "/*")

  def getRoot200 = get("/") {
    status must_== 200
  }
}
```

这里使用addServlet方法与`classOf[HelloWorldServlet]`一起将HelloWorld servlet安装到Specs2测试中。

如果你有一个servlet使用构造函数参数，你需要在测试中使用不同的addServlet方法重载来挂载servlet，例如：

```scala
  implicit val myImplicitHere = new ImplicitConstructorParam
  addServlet(new HelloWorldServlet, "/*")
```

#### （4）测试文件上传

存在测试文件上传的便利方法。

```scala
class FileUploadSpec extends MutableScalatraSpec {
  addServlet(classOf[FileUploadServlet], "/*")

  "POST /files" should {
    "return status 200" in {
      // You can also pass headers after the files Map
      post("/files", Map("private" -> "true"), Map("kitten" -> new File("kitten.png"))) {
        status must_== 200
      }
    }
  }

  "PUT /files/:id" should {
    "return status 200" in {
      put("/files/10", Map("private" -> "false"), Map("kitten" -> new File("kitten.png"))) {
        status must_== 200
      }
    }
  }
}
```

### 3、ScalaCheck

未写

## 十、国际化

未写

## 十一、Swagger支持

### 1、什么是Swagger

Swagger是一个规范，它允许您使用JSON文档快速定义REST API的功能。但它不仅仅是一个规范。它提供自动生成交互式API文档，以多种语言生成客户端代码，以及在Java和Scala中生成服务器端代码。

这不容易描述，但一旦你看到它很容易理解。现在看看Swagger演示应用程序：

http://petstore.swagger.io

本指南将引导您完成一个简单的Scalatra应用程序并添加Swagger的过程，以便您的可运行文档自动保持与您的API同步。

有关包含本指南中示例的最小和独立项目，请参见swagger-example。

### 2、应用程序设置

#### （1）控制器和数据存储

```scala
package com.rectcircle.scalatrateset.controller

import org.json4s.{DefaultFormats, Formats}
import org.scalatra.json.JacksonJsonSupport

/**
  * @author Rectcircle
  *         createTime 2017/1/13
  */
class SwaggerController extends ScalatratestStack with JacksonJsonSupport{

	//设置自动case类到JSON输出序列化，需要JValueResult trait。
	protected implicit lazy val jsonFormats: Formats = DefaultFormats

	// 在每个操作运行之前，将内容类型设置为JSON格式。
	before() {
		contentType = formats("json")
	}

	/*
	* 检索花的列表
	*/
	get("/"){
		params.get("name") match {
			case Some(name) => FlowerData.all filter (_.name.toLowerCase contains name.toLowerCase())
			case None => FlowerData.all
		}
	}

	/**
	  * Find a flower using its slug.
	  */
	get("/:slug") {
		FlowerData.all find (_.slug == params("slug")) match {
			case Some(b) => b
			case None => halt(404)
		}
	}


}

// 一个Flower对象用作测试的数据模型

case class Flower(slug: String, name: String)

// 一个测试数据源
object FlowerData {

	/**
	  * 一些假的花数据，我们可以模拟反演。
	  */
	var all = List(
		Flower("yellow-tulip", "黄金郁金香"),
		Flower("red-rose", "红玫瑰"),
		Flower("black-rose", "黑玫瑰"))
}
```

```scala
class ScalatraBootstrap extends LifeCycle{
  override def init(context: ServletContext) {
    context.mount(new SwaggerController, "/swagger")
  }
}
```

#### （2）Swagger：一个快速介绍

使API的方法，参数和响应变得显而易见，易于理解的方式呈现，可以转换构建REST API的过程。

如果你想，你可以手工写一个Swagger JSON描述文件。我们的FlowersController的Swagger资源描述可能如下所示：

```json
{"basePath":"http://localhost:8080","swaggerVersion":"1.0","apiVersion":"1","apis":[{"path":"/api-docs/flowers.{format}","description":"The flowershop API. It exposes operations for browing and searching lists of flowers"}]}
```

此文件描述了我们提供的API。每个API都有自己的JSON描述符文件，详细说明了它提供的资源，这些资源的路径，必需的和可选的参数以及其他信息。

我们的`flower`资源的描述符可能看起来像这样。我们将看到如何自动化实现这一点：

```json
{"resourcePath":"/","listingPath":"/api-docs/flowers","description":"The flowershop API. It exposes operations for browing and searching lists of flowers","apis":[{"path":"/","description":"","secured":true,"operations":[{"httpMethod":"GET","responseClass":"List[Flower]","summary":"Show all flowers","notes":"Shows all the flowers in the flower shop. You can search it too.","deprecated":false,"nickname":"getFlowers","parameters":[{"name":"name","description":"A name to search for","required":false,"paramType":"query","allowMultiple":false,"dataType":"string"}],"errorResponses":[]}]},{"path":"/{slug}","description":"","secured":true,"operations":[{"httpMethod":"GET","responseClass":"Flower","summary":"Find by slug","notes":"Returns the flower for the provided slug, if a matching flower exists.","deprecated":false,"nickname":"findBySlug","parameters":[{"name":"slug","description":"Slug of flower that needs to be fetched","required":true,"paramType":"path","allowMultiple":false,"dataType":"string"}],"errorResponses":[]}]}],"models":{"Flower":{"id":"Flower","description":"Flower","properties":{"name":{"description":null,"enum":[],"required":true,"type":"string"},"slug":{"description":null,"enum":[],"required":true,"type":"string"}}}},"basePath":"http://localhost:8080","swaggerVersion":"1.0","apiVersion":"1"}
```

然后，可以将这些JSON文件提供给标准的HTML/CSS/JavaScript客户端（称为swagger-ui），以方便用户浏览文档。如果你用手写，你可以简单地把它们放在任何HTTP服务器上，指向sw​​agger-ui客户端，并开始查看runnable文档。

#### （3）生成API客户端

您还可以使用swagger-codegen项目来生成多种语言的客户端和服务器代码。

可以为Flash，Java，JavaScript，Objective-C，PHP，Python，Python3，Ruby或Scala生成客户端代码。

您可能需要花一点时间查看[Swagger Pet Store](http://petstore.swagger.io/)示例。单击路由定义以查看每个资源可用的操作。您可以使用网络界面向API发送实时测试查询，并查看API对每个查询的响应。

点击每个API说明旁边的“原始”链接，您将看到API的Swagger规范文件。

#### （4）Scalatra和Swagger整合

Scalatra的Swagger集成允许您在RESTful API中注释代码，以便自动生成Swagger规范文件。这意味着，一旦你注释你的API方法，你可以免费获得文档和客户端代码生成。

**添加依赖**

```scala
"org.scalatra" %% "scalatra-swagger"  % "2.4.1",
"org.json4s"   %% "json4s-native" % "3.5.0",
```

**您现在需要将Scalatra的Swagger支持导入到您的Controller：**

```scala
import org.scalatra.swagger._
```

**自动生成resources.json spec文件**

Any Scalatra application which uses Swagger support must implement a Swagger controller. Those JSON specification files, which we'd otherwise need to write by hand, need to be served by something, after all. Let's add a standard Swagger controller to our application. Drop this code into a new file next to your FlowersController.scala. You can call it FlowersSwagger.scala:

任何使用Swagger的Scalatra应用必须实现一个Swagger控制器。这些本来需要我们手写的JSON规范文件？？让我们为控制器添加一个对应的Swagger.scala:

```scala
package com.rectcircle.scalatrateset.controller

import org.scalatra.ScalatraServlet
import org.scalatra.swagger.{ApiInfo, NativeSwaggerBase, Swagger}

class ResourcesApp(implicit val swagger: Swagger) extends ScalatraServlet with NativeSwaggerBase

object FlowersSwagger{
	val Info = ApiInfo(
		"The Flowershop API",
		"Docs for the Flowers API",
		"http://scalatra.org",
		"apiteam@scalatra.org",
		"MIT",
		"http://opensource.org/licenses/MIT")
}
class FlowersSwagger extends Swagger(Swagger.SpecVersion, "1.0.0", FlowersSwagger.Info)
```

此控制器将为应用程序中的每个注释API方法自动生成符合Swagger的JSON规范。

你的应用程序的其余部分不知道它，虽然。为了正确设置一切，您需要更改ScalatraBootstrap文件，以便容器知道这个新的servlet。目前看起来像这样：

```scala
import org.scalatra.example.swagger._
import org.scalatra.LifeCycle
import javax.servlet.ServletContext

class ScalatraBootstrap extends LifeCycle {

	//必须写重要
  implicit val swagger = new FlowersSwagger

  override def init(context: ServletContext) {
    context.mount(new FlowersController, "/flowers", "flowers")
    context.mount (new ResourcesApp, "/api-docs")
  }
}

```

注意，`context.mount(new FlowersController, "/flowers", "flowers")`有第二个参数：在Scalatra 2.3.x中，Swagger需要一个name参数，以便它可以正确地生成它的文档
名称应始终与控制器的安装路径相同，减去前导`/`。

**向FlowersController添加SwaggerSupport**

让我们将SwaggerSupport trait添加到FlowersController，并使它在其构造函数中知道Swagger。并实现方法

```scala
class FlowersController(implicit val swagger: Swagger) extends ScalatraServlet
  with NativeJsonSupport with SwaggerSupport {
	protected val applicationDescription = "The flowershop API. It exposes operations for browsing and searching lists of flowers, and retrieving single flowers."
}
```

这是为Swagger设置。现在我们可以开始记录我们的API的方法。

**注解API方法**

Swagger注解很简单。你用一些信息装饰每个路由，Scalatra为你的路由生成spec文件。
让我们为"/"路由
现在，看起来像这样：

```scala
	val getFlowers =
		(apiOperation[List[Flower]]("getFlowers")
		  summary "展示所有花"
		  notes "显示花店里的所有花。您也可以搜索它。"
		  parameter queryParam[Option[String]]("name").description("通过名字搜索"))


	/*
	* 检索花的列表
	*/
	get("/", operation(getFlowers)) {
		params.get("name") match {
			case Some(name) => FlowerData.all filter (_.name.toLowerCase contains name.toLowerCase)
			case None => FlowerData.all
		}
	}
```

在尝试将其用作路由定义的一部分之前，请确保初始化您的apiOperation为val。否则，当您尝试点击路线时，您会收到503错误。

让我们看看注解的细节：
summary和notes：是人性化可读的开发者api客户端文档，summary是一个简短的描述，而说明应提供更长的描述，并包括nodes是任何值得注意的特点，有人可能会错过。

nickname 旨在作为机器可读的密钥，客户端代码可以使用该密钥来标识此API操作 - 例如，swagger-ui将使用该密钥来生成JavaScript方法名称。你可以调用它任何你想要的，但确保你不包括任何空格，或客户端代码生成可能会失败 - 所以`"getFlowers"`或`"get_flowers"`是正确的，`"get flowers"`不是。

responseClass本质上是一个类型注释，所以客户端知道什么数据类型期望回来。在这种情况下，客户端应该期望一个Flower对象列表。

parameters 详细说明可传递到此路由中的任何参数,以及它们是否应该是路径，后置参数或查询字符串参数的一部分.在这种情况下，我们定义一个名为name的可选查询字符串参数，它与我们的操作期望的匹配。

endpoint 注释定义此方法的任何特殊参数替换或附加路由信息。这个特定的路线很简单，所以我们可以留空。

```scala
	val findBySlug =
		(apiOperation[Flower]("findBySlug")
		  summary "精确查找"
		  parameters (
		  pathParam[String]("slug").description("需要被提取的花的键值")
		  ))

	get("/:slug", operation(findBySlug)) {
		FlowerData.all find (_.slug == params("slug")) match {
			case Some(b) => b
			case None => halt(404)
		}
	}
```

这里的Swagger注释大致类似于`get（"/"）`路由的注释。有几件事要注意。

这里的`endpoint`被定义为{slug}。大括号告诉Swagger它应该将名为{slug}的路径参数的内容替换为任何生成的路由（参见下面的示例）。还要注意，这次我们定义了一个ParamType.Path，因此我们将slug参数作为路径的一部分而不是查询字符串。因此我们将slug参数作为路径的一部分，而不是作为查询字符串。因为我们没有将slug参数设置为required = false，正如我们对其他路由中的name参数所做的那样，Swagger将假设需要slugs。

现在让我们看看我们已经获得了什么。

在我们的应用程序中添加Swagger支持，为FlowersController添加Swagger注释，这意味着我们可以使用一些新功能。请在浏览器中检查以下网址：
http://localhost:8080/api-docs

您应该会看到可用API的自动生成的Swagger描述（在这种情况下，只有一个，但可以有多个API由我们的应用程序定义，他们都会在这里注释）：

```json
{"apiVersion":"1.0.0","swaggerVersion":"1.2","apis":[{"path":"/flowers","description":"flowershop API。它暴露了用于浏览和搜索花的列表以及检索单花的操作。"}],"authorizations":{},"info":{"title":"The Flowershop API","description":"Docs for the Flowers API","termsOfServiceUrl":"http://scalatra.org","contact":"apiteam@scalatra.org","license":"MIT","licenseUrl":"http://opensource.org/licenses/MIT"}}
```

**使用swagger-ui浏览您的API**

打开 http://petstore.swagger.io/
输入在url输入 http://localhost:8080/api-docs

**关于js跨域问题**

它的原因是Scalatra的跨源资源共享（CORS）支持混合到其SwaggerSupport特质中，允许跨源JavaScript请求默认情况下所有请求域。

## 十二、监测

### 1、Metrics

此功能从Scalatra 2.4开始支持

#### （1）使用

**添加依赖**

```scala
"org.scalatra" %% "scalatra-metrics" % "2.4.0-SNAPSHOT"
```

**将MetricsBootstrap特质混入ScalatraBootstrap**

```scala
class ScalatraBootstrap extends LifeCycle with MetricsBootstrap {
  override def init(context: ServletContext) =
  {
    // ...
  }
}
```

**添加导入**

```scala
import org.scalatra.metrics.MetricsBootstrap
import org.scalatra.metrics.MetricsSupportExtensions._
```

混合在MetricsBootstrap将为您的应用程序提供MetricRegistry和HealthCheckRegistry的默认实例。如果默认值不适合您的目的，您还可以选择覆盖一个或两个。

```scala
class ScalatraBootstrap extends LifeCycle with MetricsBootstrap {
  override val metricRegistry = ???
  override val healthCheckRegistry = ???
  override def init(context: ServletContext) =
  {
  }
}
```

**添加Metrics控制器**

```scala
class ScalatraBootstrap extends LifeCycle with MetricsBootstrap {
  override def init(context: ServletContext) =
  {
    context.mountMetricsAdminServlet("/metrics-admin")
    context.mountHealthCheckServlet("/health")
    context.mountMetricsServlet("/metrics")
    context.mountThreadDumpServlet("/thread-dump")
    context.installInstrumentedFilter("/test/*")
  }
}
```

有关每个servlet的详细信息，请参阅[Metrics Servlets文档](http://metrics.dropwizard.io/3.1.0/manual/servlets/)

**Metrics Filter**

还提供了方便的方法来安装servlet过滤器以聚合响应代码计数和定时。传递的参数将指定应用过滤器的位置。要在全局应用它，请使用/*

```scala
class ScalatraBootstrap extends LifeCycle with MetricsBootstrap {
  override def init(context: ServletContext) =
  {
    context.installInstrumentedFilter("/test/*")
  }
}
```

在当前状态下，此过滤器不会正确处理AsyncContext，如果您使用Futures，将不准确。

**检测Controller（servlet）**

为了在您的servlet中记录指标，混合MetricsSupport trait并调用提供的方法：

```scala
class TestController extends ScalatratestStack with MetricsSupport{
	get("/") {
		timer("timer") {
			// Code that's timed by a timer named "timer"
		}

		// Increments a counter called "counter"
		counter("counter") += 1

		// Increments a histogram called "histogram"
		histogram("histogram") += 1

		// Sets a gauge called "gauge"
		gauge("gauge") {
			"gauge"
		}

		// Sets a meter named "meter"
		meter("meter").mark(1)
	}
}
```

**健康检查**

```scala
package com.rectcircle.scalatrateset.controller

import org.scalatra.metrics.{HealthChecksSupport, MetricsSupport}

/**
  * @author Rectcircle
  *         createTime 2017/1/15
  */
class TestController extends ScalatratestStack with HealthChecksSupport{
	get("/health") {
		healthCheck("basic") {
			true
		}

		healthCheck("withMessage", unhealthyMessage = "DEADBEEF") {
			true
		}
	}
}

```

**高级功能**

除了提供的方便方法，可以导入完整的metrics-core，metrics-servlet，metrics-servlet和metrics-scala库。默认注册表显示为隐式值，因此可以根据需要直接访问。

### [2、日志](#2、日志)

默认情况下，Scalatra使用Logback进行日志记录。
添加依赖

```scala
"ch.qos.logback" % "logback-classic" % "1.1.3" % "runtime"
```

编写日志代码片段特质

```scala
import grizzled.slf4j.Logger

trait Logging {
	@transient lazy val logger: Logger = Logger(getClass)
}
```

需要使用日志的地方with混入即可

```scala
trait ScalatratestStack extends ScalatraServlet with ScalateSupport with Logging {
}
```

在logback.xml配置日志

## [十三、部署](#十三、部署)

### 1、独立部署

http://www.scalatra.org/2.4/guides/deployment/standalone.html

### 2、部署到web容器

http://www.scalatra.org/2.4/guides/deployment/servlet-container.html

### 3、项目配置

#### （1）使用ScalatraBootstrap文件配置您的web应用

**步骤**

web.xml添加scalatra监听器

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://java.sun.com/xml/ns/javaee"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="http://java.sun.com/xml/ns/javaee http://java.sun.com/xml/ns/javaee/web-app_3_0.xsd"
      version="3.0">
    <listener>
      <listener-class>org.scalatra.servlet.ScalatraListener</listener-class>
    </listener>
</web-app>
```

在`src/main/scala`添加`ScalatraBootstrap.scala`项目配置文件

```scala
import org.scalatra.LifeCycle
import javax.servlet.ServletContext
import org.yourdomain.projectname._

class ScalatraBootstrap extends LifeCycle {

  override def init(context: ServletContext) {

    // mount servlets like this:
    context mount (new ArticlesServlet, "/articles/*")
  }
}
```

**安装多个servlet（或过滤器）**

override def init(context: ServletContext) {

  // mount a first servlet like this:
  context mount (new ArticlesServlet, "/articles/*")

  // mount a second servlet like this:
  context mount (new CommentsServlet, "/comments/*")

}

**配置初始参数**

您可以在Scalatra引导程序文件中设置init参数。例如，您可以设置org.scalatra.environment init参数以设置应用程序环境

```scala
override def init(context: ServletContext) {

  // mount a first servlet like this:
  context mount (new ArticlesServlet, "/articles/*")

  // Let's set the environment
  context.initParameters("org.scalatra.environment") = "production"

}
```

每个初始化参数可以通过两种方式设置
`context.setInitParameter(org.scalatra.EnvironmentKey, "production")`
`context.initParameters("org.scalatra.environment") = "production"`
默认是development.

如果环境以“dev”开头，则isDevelopmentMode返回true。

在开发模式下，有几件事情发生。

* 在ScalatraServlet中，notFound处理程序已增强，以便转储有效的请求路径和尝试匹配的路由列表。这不会发生在ScalatraFilter中，当没有路由匹配时，它只是委托给filterChain。
* 启用了有意义的错误页（例如，在404，500）。
* 启用S​​calate控制台。

**容器初始化参数**

`context.setInitParameter(ScalatraBase.HostNameKey, "myapp.local")` 或`context.initParameters("org.scalatra.HostName") = "myapp.local"`

`context.setInitParameter(ScalatraBase.PortKey, 443)`或`context.initParameters("org.scalatra.Port") = 443`

`context.setInitParameter(ScalatraBase.ForceHttpsKey, "true")` 或`context.initParameters("org.scalatra.ForceHttps") = "true"`

默认情况下，主机名，端口和SSL设置的值从servlet容器的设置继承。如果要覆盖您的网站所在的域或端口，或强制使用https，您可以设置这些初始参数。

**跨域初始化参数配置**

* `context.setInitParameter(CorsSupport.AllowedOriginsKey, "www.other.com,www.foo.com")`
* `context.setInitParameter(CorsSupport.AllowedMethodsKey, "GET,PUT")`
* `context.setInitParameter(CorsSupport.AllowedHeadersKey, "Content-Type")`
* `context.setInitParameter(CorsSupport.AllowCredentialsKey, "true")`
* `context.setInitParameter(CorsSupport.PreflightMaxAgeKey, 1800)`

**异步初始化参数**

`context.setAttribute(AsyncSupport.ExecutionContextKey, executionContext)`或`context.initParameters("org.scalatra.ExecutionContext") = executionContext`

此键设置Scalatra在创建Akka Future时应使用的ExecutionContext。

**运行初始化代码配置**

```scala
import org.scalatra.LifeCycle
import javax.servlet.ServletContext

// Import the trait:
import com.yourdomain.yourapp.DatabaseInit

// Mixing in the trait:
class ScalatraBootstrap extends LifeCycle with DatabaseInit {

  override def init(context: ServletContext) {

    // call a method that comes from inside our DatabaseInit trait:
    configureDb()

    // Mount our servlets as normal:
    context mount (new Articles, "/articles/*")
    context mount (new Users, "/users/*")
  }
}
```

#### （2）使用web.xml配置web应用

略
