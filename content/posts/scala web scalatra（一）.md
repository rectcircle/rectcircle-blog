---
title: scala web scalatra（一）
date: 2016-12-29T18:54:44+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/35
  - /detail/35/
tags:
  - scala
---

> 官方文档选择性翻译+说明
> http://scalatra.org/guides/2.5/
> 更新时间2017-04-15

## 目录
* [一、快速开始](#一、快速开始)
	* [1、安装](#1、安装)
	* [2、第一个项目](#2、第一个项目)
	* [3、项目结构](#3、项目结构)
	* [4、debug](#4、debug)
* [二、HTTP相关](#二、HTTP相关)
	* [1、路由](#1、路由)
	* [2、Actions（操作）](#2、Actions（操作）)
	* [3、反向路由（重定向）](#3、反向路由（重定向）)
	* [4、请求和响应](#4、请求和响应)
	* [5、开启Gzip](#5、开启Gzip)
	* [6、认证框架Scentry](#6、认证框架Scentry)
* [三、异步支持](#三、异步支持)
	* [1、Akka](#1、Akka)
	* [2、Atmosphere](#2、Atmosphere)
* [四、视图](#四、视图)
	* [1、内联HTML]()
	* [2、Scalate模板引擎](#2、Scalate模板引擎)


## 一、快速开始
### 1、安装
开始使用新的Web框架听起来可能有点吓人。幸运的是，Scalatra很容易安装，因为它有相对较少的依赖。 它可以在Windows，Mac OS X，Linux或BSD上运行。
#### （1）安装JDK
Scalatra是用Scala编写的Web微框架，因此您需要安装Java开发工具包（JDK）。
Many systems come with a JDK pre-loaded.

许多系统可能已经预装了JDK

在终端（cmd或bash）运行 `java -version` 和 `javac -version` 查看是否已经预装JDK，命令的输出应该像下面这样：
```bash
$ java -version
java version "1.7.0_10"
OpenJDK Runtime Environment (IcedTea6 1.11.1) build 1.7.0_10-b18)
Java HotSpot(TM) 64-Bit Server VM (build 23.6-b094, mixed mode)
```

```bash
$ javac -version
javac 1.7.0_10
```
如果你需要的是Java 7，在这里会显示 version 1.7。

Scala中的Java 8支持在Scala 2.11.x版本中被归类为实验。如果你不确定这意味着什么，请使用Java 7版本。

如果您还没有安装Java，您可以在[Java 7安装页面](http://docs.oracle.com/javase/7/docs/webnotes/install/index.html)找到如何为您的系统安装它。确保你使用OpenJDK或Sun的JDK。有些Linux发行版预安装gcj，这将不起作用。


#### （2）安装giter8
中国用户参见[scala读书笔记（三）](https://www.rectcircle.cn/detail/32#十二、简单构建工具SBT)十二、简单构建工具SBT和十三、web服务。有针对墙的解决方案
翻译略


### 2、第一个项目
#### （1）生成了Scalatra项目模板骨架
进入工作空间
执行命令（国内可能报错，参见[scala读书笔记（三）](https://www.rectcircle.cn/detail/32#十二、简单构建工具SBT)）
```scala
$ g8 scalatra/scalatra-sbt 
organization [com.example]: 
name [My Scalatra Web App]: 
version [0.1.0-SNAPSHOT]: 
servlet_name [MyScalatraServlet]: 
package [com.example.app]: 
scala_version [2.11.7]: 
sbt_version [0.13.9]: 
scalatra_version [2.4.0]: 

Template applied in ./my-scalatra-web-app
```
选项解释说明翻译略参见http://www.scalatra.org/2.4/getting-started/first-project.html

#### （2）使用idea管理项目
* 安装Idea和sbt插件
* File > Open > 选择刚刚生成的项目，即可打开编码

#### （3）构建
点击idea左下右打开Terminal（终端）
输入
```bash
sbt
> jetty:start
```
在浏览器打开http://127.0.0.1:8080/ 即可看到页面

#### （4）自动编译重载
```bash
sbt
> ~;jetty:stop;jetty:start
```

### 3、项目结构
#### （1）路径
推荐的Scalatra项目构建方法如下。这是你使用giter8生成一个新项目时得到的：
```
project
|_build.properties      <= specifies what version of sbt to use
|_build.scala           <= dependencies and project config are set in here
|_plugins.sbt           <= sbt plugins can be added here

src
|_ main
|  |_ scala
|  |  |   |_ScalatraBootstrap.scala     <= mount servlets in here
|  |  |_org
|  |      |_ yourdomain
|  |         |_ projectname
|  |            |_ MyScalatraServlet.scala
|  |_ webapp
|     |_ WEB-INF
|        |_ views
|        |  |_ hello-scalate.scaml
|        |_ layouts
|        |  |_ default.scaml
|        |_ web.xml
|_ test
   |_ scala
      |_ org
         |_ yourdomain
            |_ projectname
               |_ MyScalatraServletSpec.scala
```
对于那些使用过Rails，Sinatra或Padrino应用程序的人来说，基本结构应该是相当熟悉的。你的视图在views文件夹，布局（包括包装视图）在layouts文件夹。

Scalatra giter8项目将Scala应用程序代码放入一系列命名空间目录中：在上面的例子中，是`org.yourdomain.projectname`。这完全是可选的。在Scala编程风格知道中建议这么做，但是这不是语言本身强制要求的。如果你想，你可以把所有的Scala代码放在同一个目录，以方便导航。

#### （2）静态资源文件
静态文件放置在webapps文件夹中，他是静态文件的根目录，与任何基于servlet的应用程序一样，此目录的内容都是公用的，除了WEB-INF目录中的文件外。

示例结构可以帮助理解这一点。

```
src
|_ main
   |_ scala
   |  |_ Web.scala
   |_ webapp
      |_ WEB-INF
      |  |_ secret.txt
      |  |_ views
      |  |  |_ default.jade
      |  |
      |  |_ layouts
      |  |  |_ default.jade
      |  |
      |  |_ web.xml
      |- stylesheets
      |  |_ default.css
      |- images
         |_ foo.jpg
```
在此应用程序中，唯一可公开访问的文件在 stylesheets/default.css 和 images/ foo.jpg。其他一切将受到Web应用程序容器的保护。


#### （3）ScalatraServlet 和 ScalatraFilter对比
有两个基类可以继承，以便使编写Scalatra应用程序：`ScalatraServlet` and `ScalatraFilter`。
```scala
class YourServlet extends ScalatraServlet with ScalateSupport {
  // your class here
}
```
vs
```scala
class YourFilter extends ScalatraFilter with ScalateSupport {
  // your class here
}
```

他们主要区别是找不到路由时的默认行为。ScalatraFilter将委派给链中的下一个过滤器或servlet（由web.xml配置），这允许您在同一WAR中的不同命名空间中安装多个servlet。

**如果使用ScalatraFilter：**
* 你需要在同一Url空间迁移旧版的webapp
* 您希望从WAR提供静态内容，而不是专用的Web服务器

**如果使用ScalatraServlet：**
* 您希望匹配前缀比上下文路径更深的路由。
* 您不确定要使用哪个！

#### （4）Scalatra的sbt依赖
project/build.scala文件定义您的应用程序将依赖的库，以便sbt可以为您下载并构建您的Scalatra项目。

这里有一个Scalatra 的 project/build.scala文件：
```scala
import sbt._
import Keys._
import org.scalatra.sbt._
import org.scalatra.sbt.PluginKeys._
import com.mojolly.scalate.ScalatePlugin._
import ScalateKeys._

object MyExampleBuild extends Build {
  val Organization = "com.example"
  val Name = "An Example Application"
  val Version = "0.1.0-SNAPSHOT"
  val ScalaVersion = "2.10.1"
  val ScalatraVersion = "2.4.1"

  lazy val project = Project (
    "scalatra-buildfile-example",
    file("."),
    settings = Defaults.defaultSettings ++ ScalatraPlugin.scalatraWithJRebel ++ scalateSettings ++ Seq(
      organization := Organization,
      name := Name,
      version := Version,
      scalaVersion := ScalaVersion,
      resolvers += "Sonatype OSS Snapshots" at "http://oss.sonatype.org/content/repositories/snapshots/",
      resolvers += "Akka Repo" at "http://repo.akka.io/repository",
      libraryDependencies ++= Seq(
        "org.scalatra" %% "scalatra" % ScalatraVersion,
        "org.scalatra" %% "scalatra-scalate" % ScalatraVersion,
        "org.scalatra" %% "scalatra-specs2" % ScalatraVersion % "test",
        "ch.qos.logback" % "logback-classic" % "1.1.3" % "runtime",
        "org.eclipse.jetty" % "jetty-webapp" % "9.2.10.v20150310" % "container",
        "org.eclipse.jetty.orbit" % "javax.servlet" % "3.1.0" % "container;provided;test" artifacts (Artifact("javax.servlet", "jar", "jar"))
      ),
      scalateTemplateConfig in Compile <<= (sourceDirectory in Compile){ base =>
        Seq(
          TemplateConfig(
            base / "webapp" / "WEB-INF" / "templates",
            Seq.empty,  /* default imports should be added here */
            Seq.empty,  /* add extra bindings here */
            Some("templates")
          )
        )
      }
    )
  )
}
```

### 4、debug
#### （1） 使用g8创建项目
参见[第一个项目](#2、第一个项目)

#### （2） 导入到idea
参见[第一个项目](#2、第一个项目)

#### （3）在`build.sbt`最后添加debug配置
```scala
//......
def debugJetty = Command.command("debugJetty") { state =>
  import com.earldouglas.xwp.ContainerPlugin.start
  val javaOpts =
    Seq(
      "-Xdebug",
      "-Xrunjdwp:server=y,transport=dt_socket,address=8000,suspend=n"
    )
  val state2 =
    Project.extract(state).append(
      Seq(javaOptions in Jetty ++= javaOpts),
      state
    )
  Project.extract(state2).runTask(start in Jetty, state2)
  state2
}

commands += debugJetty
```

#### （4）配置远程调试
* 回到idea
* Run -> Edit Configurations
* 点击`+`号
* 选择Remote
* 填写Name和port选项，其他默认
* 回到控制台进入sbt，输入`debugJetty`，会打印出`Listening for transport dt_socket at address: 8000`
* 回到idea选择刚刚配置好的选项点击debug
* 回到代码创建断点，断点红圈上面出现一个勾表示断点成功
* 打开浏览器进入要访问的页面
* 成功断点在断点处
* 回到控制台jetty:stop停止调试




## 二、HTTP相关
### 1、路由
——匹配url将请求交由一个方法处理，即url与scala代码的映射
#### （1）匹配http协议的方法
```scala
class Articles extends ScalatraServlet {
  get("/articles/:id") {  //  <= this is a route matcher
    // this is an action
    // this action would show the article which has the specified :id
  }

  post("/articles") {
    // submit/create an article
  }

  put("/articles/:id") {
    // update the article which has the specified :id
  }

  delete("/articles/:id") {
    // delete the article with the specified :id
  }
}
```

#### （2）命名参数
```scala
get("/hello/:name") {
  // Matches "GET /hello/foo" and "GET /hello/bar"
  // params("name") is "foo" or "bar"
  <p>Hello, {params("name")}</p>
}
```

#### （3）通配符
```scala
	get("/say/*/to/*") {
		// Matches "GET /say/hello/to/world"
		val split = multiParams("splat")
		<h1>
			say {split(0)} to {split(1)}
		</h1>
	}
	
	get("/download/*.*") {
		// Matches "GET /download/path/to/file.xml"
		multiParams("splat") // == Seq("path/to/file", "xml")
		val splat = multiParams("splat")
		<h1>
			you download is {splat(0)}.{splat(1)}
		</h1>
	}
```

#### （4）正则匹配
```scala
	get("""^\/f(.*)/b(.*)""".r) {
		// Matches "GET /foo/bar"
		multiParams("captures") // == Seq("oo", "ar")
	}
```

#### （5）条件
```scala
get("/foo", request.getRemoteHost == "127.0.0.1") {
	// Overrides "GET /foo" for local users
	<h1>from host 127.0.0.1</h1>
}

get("/foo", request.getRemoteHost == "127.0.0.1", request.getRemoteUser == "admin") {
  // Only matches if you're the admin, and you're localhost
}
```

#### 2.5新增：添加对PUT和DELETE的支持
Scalatra支持的HTTP动词是`GET`和`POST`，但是不支持`PUT`和`DELETE`

许多前端库使用非标准但简单的约定来表示他们希望将该请求视为`PUT`或`DELETE`而不是POST：例如，jQuery将`X-HTTP-METHOD-OVERRIDE`标头添加到请求中。

其他客户端和框架通常通过向POST主体添加`_method = put`或`_method = delete`参数来表示相同的事情。

Scalatra会在传入请求时查找这些约定，如果将`MethodOverride` trait添加到servlet或过滤器中，则会自动转换请求方法：
```
class MyFilter extends ScalatraFilter with MethodOverride {

  // POST to "/foo/bar" with params "id=2" and "_method=put" will hit this route:
  put("/foo/bar/:id") {
    // update your resource here
  }
}
```

#### （6）路由排序
这样总是调用下面的方法，排序简单的按照从下到上顺序，不是按照匹配精确度来排序
//访问/foo/abc返回还是下面
```scala
get("/foo/abc", request.getRemoteHost == "127.0.0.1") {
	// Overrides "GET /foo" for local users
	<h1>from host 127.0.0.1</h1>
}

get("/foo/*", request.getRemoteHost == "127.0.0.1") {
	// Overrides "GET /foo" for local users
	<h1>from host 127.0.0.1, 下边的</h1>
}
```

#### （7）参数处理
* multiParams
* params
	* params.getOrElse
	* params(key)

```scala
get("/articles/:id") {

	// /articles/52?foo=uno&bar=dos&baz=three&foo=anotherfoo
	params("id") // => "52"
	params("foo") // => "uno" (discarding the second "foo" parameter value)
	params("unknown") // => 抛出异常 NoSuchElementException
	params.get("unknown") // => None - this is what Scala does with unknown keys in a Map

	multiParams("id") // => Seq("52")
	multiParams("foo") // => Seq("uno", "anotherfoo")
	multiParams("unknown") // => an empty Seq

	<pre>
		params("id") {params("id")}
		params("foo") {params("foo")}
		params("unknown") 这会抛出异常
		params.get("unknown") {params.get("unknown")}

		multiParams("id") {multiParams("id")}
		multiParams("foo") {multiParams("foo")}
		multiParams("unknown") {multiParams("unknown") }
	</pre>

}
```

params("paramName") 找不到抛出异常，有多个返回第一个，类型为字符串
params.get("paramName") 返回一个Option
multiParams("param") 返回一个Seq，匹配不到没有为空Seq
	
	
使用params.getOrElse("author", halt(400))设置默认值

```scala
get("/articles-by/:author/:page") {
  val author:String = params.getOrElse("author", halt(400))
  val page:Int = params.getOrElse("page", "1").toInt
  // now do stuff with your params
}
//经测试不能实现
```

使用字节传递json数据不会被映射只能使用`request.body`获取，但这不推荐


#### （8）servlet过滤器
一般示例
```scala
before() {
	println("请求处理前执行")
}

after(){
	println("请求处理之后执行")
}
```

匹配url路径执行过滤器方法
```scala
before("/admin/*") {
  basicAuth
}

after("/admin/*") {
  user.logout
}
```

#### （9）servlet内方法actions, errors, and filters的调用顺序
1. `before` 过滤器
2. Routes and actions.
3. 如果在before过滤器或路由操作期间抛出异常，则会将其传递给errorHandler函数，并且其结果作为action的作结果。
4. `after` 过滤器


#### （10）重定向
`redirect`将发送一个301 response
```scala
get("/"){
	redirect("/someplace/else")
}
```

#### （11）设定返回状态码
```scala
halt(403)
halt(403, <h1>Go away!</h1>)

halt(status = 403,
     reason = "Forbidden",
     headers = Map("X-Your-Mother-Was-A" -> "hamster",
                   "X-And-Your-Father-Smelt-Of" -> "Elderberries"),
     body = <h1>Go away or I shall taunt you a second time!</h1>)
```

#### （12）passing方法
将请求交由另一个，处理由下到上，参数任然可以获得参数
```scala
get("/guess/*") {
  <h1>"You missed!"{params("who")}</h1>
}

get("/guess/:who") {
  params("who") match {
    case "Frank" => "You got me!"
    case _ => pass()
  }
}
```

#### （13）notFound 处理没有映射的请求
```scala
notFound {
  <h1>Not found. Bummer.</h1>
}
```


#### （14）匹配最后的斜线
```scala
//访问http://127.0.0.1:8080/guess
//http://127.0.0.1:8080/guess/
//都可以
get("foo/bar/?") {
  //...
}
```

### 2、Actions（操作）
Action是匹配到路由后执行的代码（也称为业务逻辑）
#### （1）默认的行为
每条路由后面都有一个动作。 Action可以返回任何值，然后根据以下规则将其渲染到响应中。

|返回类型|渲染方式|
|-------------|--------------|
| ActionResult | 设置状态码，返回体和http返回头。导入`org.scalatra.ActionResult._`后，您可以通过引用它们的描述返回200 OK，404 Not Found和其他响应。有关示例，请参阅ActionResult示例代码（如下）。 |
| Array[Byte] | 如果未设置 `content-type`，则将其设置为`application/octet-stream`。字节数组被写入响应的输出流。 |
| NodeSeq | 如果没有设置`content-type`，它被设置为`text/html`。节点序列将转换为字符串并写入响应的写入器。 |
| Unit | 这表示action完成整个响应，并且不采取进一步的action。 |
| Any | 对于任何其他值，如果未设置`content-type`，则将其设置为`text/plain`。该值将转换为字符串并写入响应的writer |


#### （2）自定义action行为
对于不在上表中的行为，可以通过重写`renderResponse`为这些或其他返回类型定制。

ActionResult示例
```scala
get("/file/:id") {
	params.get("id") match {
		case Some(file) => Ok(file)
		case None       => NotFound("Sorry, the file could not be found")
	}
```

在此示例中，ActionResult根据操作中发生的情况有条件地用于返回不同的响应代码。如果假设的fileService找到一个文件，则操作返回`Ok(file)`。这意味着响应成功，并且响应代码为200。

如果fileService没有找到一个文件，则操作返回NotFound和一条消息。 NotFound设置响应代码404。

在Scalatra中有几十个可能的响应，如果你想查看所有它们，并找出他们产生什么响应代码，最简单的方法是查看ActionResult源代码。


### 3、反向路由（重定向）
使用页面级别相对路由（比较违反常识）
```scala
get("/relative"){
	// 访问 http://127.0.0.1:8080/redirect/relative
	// 重定向到 http://127.0.0.1:8080/page-relative
	redirect(url("page-relative"))
}
```

使用上下文级相对路由
```scala
get("/context") {
	// 访问 http://127.0.0.1:8080/redirect/context
	// 重定向到 http://127.0.0.1:8080/redirect/en-to-es?one=uno&two=dos
	redirect( url("/en-to-es", Map("one" -> "uno", "two" -> "dos")) )
}
```

可以将路由保存为变量，以便它们具有方便的句柄：
```scala
class MyApp extends ScalatraServlet with UrlGeneratorSupport {
  // When you create a route, you can save it as a variable
  val viewUser = get("/user/:id") {
     // your user action would go here
   }

  post("/user/new") {
    // url method provided by UrlGeneratorSupport.  Pass it the route
    // and the params.
    redirect(url(viewUser, "id" -> newUser.id))
  }
}
```

### 4、请求和响应
#### （1）请求
Inside any action, the current request is available through the request variable. The underlying servlet request is implicitly extended with the following methods:
在任何操作中，当前的请求都可以通过request变量获得。底层的servlet request通过以下方法隐式拓展

body： 得到请求体的字符串
isAjax: 检测ajax请求
cookies: 请求的Cookie的Map视图
multiCookies: 请求的Cookie的Map视图

#### （2）响应
响应可以通过response变量获得


#### （3）ServletContext
servlet上下文可以通过`servletContext`变量获得



### 5、开启Gzip
混入`ContentEncodingSupport`特质
```scala
class GzipServlet extends ScalatratestStack with ContentEncodingSupport {
	get("/") {
		<html>
			<body>
				<h1>This is
					<a href="http://scalatra.org/2.2/guides/http/gzip.html">
						http/gzip
					</a>!
				</h1>
			</body>
		</html>
	}
}
```

### 6、认证框架Scentry
#### （1）介绍
使用此认证框架，要实现两个部分

* 定义身份认证策略类可以有多个，声明如下

```scala
class UserPasswordStrategy(protected val app: ScalatraBase)(implicit request: HttpServletRequest, response: HttpServletResponse) extends ScentryStrategy[User] {
	
}
```

* 定义一个特质，用于配置身份认证策略，声明如下

```scala
trait AuthenticationSupport extends ScalatraBase with ScentrySupport[User] {
  self: ScalatraBase =>
	
}
```

#### （2）使用样例创建步骤
> git地址https://git.oschina.net/null_834/ScalatraScentryAuthDemo.git


**a. 引入依赖**
```scala
val ScalatraVersion = "2.5.0"

libraryDependencies += "org.scalatra" %% "scalatra-auth" % ScalatraVersion
```

**b.新建包`com.xxx.xxx.auth`和`com.xxx.xxx.auth.strategies`创建一个用户实体类**
```scala
package com.constructiveproof.example.models
import org.slf4j.LoggerFactory

case class User(id:String)               {
  val logger = LoggerFactory.getLogger(getClass)
  def forgetMe = {
    logger.info("User: this is where you'd invalidate the saved token in you User model")
  }
}

```


**c. 编写两个用户身份验证策略**
密码登录
`class UserPasswordStrategy(protected val app: ScalatraBase)(implicit request: HttpServletRequest, response: HttpServletResponse)`
 
记住登录
`class RememberMeStrategy(protected val app: ScalatraBase)(implicit request: HttpServletRequest, response: HttpServletResponse) extends ScentryStrategy[User] `


**d. 编写身份验证的配置入口**
配置验证策略和其他一些常用函数
`trait AuthenticationSupport extends ScalatraBase with ScentrySupport[User] {self: ScalatraBase =>}`

**e. 配置一个特质用于Controller混入 **
`class SessionsController extends ScentryauthdemoStack with AuthenticationSupport `

**f. 需要身份验证的Controller混入e.步骤编写的特质**
```scala
class ProtectedController extends ScentryauthdemoStack with AuthenticationSupport {
  /**
   * 执行验证身份
   */
  before() {
    requireLogin()
  }

  get("/") {
    println(userOption)
    <h1>"这是一个受保护的控制器动作。如果你能看到它，你就登录了。欢迎你"</h1>
  }
}
```

#### （3）认证流程
情况一：第一次登录
* 用户访问被保护页面
* 后台收到请求before()过滤器 调用isAuthenticated方法放回false
* 重定向登录页面，访问登录页面
* 后台收到请求before()过滤器 调用isAuthenticated返回false，调用`RememberMe`验证策略，验证失败
* 浏览器接收到登录页面
* 填写登录信息，提交
* 后台执行所有的验证策略，成功
* 跳转到受保护页面，后台收到请求before()过滤器 调用isAuthenticated方法放回true
* 加载页面成


#### （4）验证策略详细写法
**必须实现的方法`authenticate()`**
```scala
override def authenticate()(implicit request: HttpServletRequest, response: HttpServletResponse): Option[User] = {
		//获取请求参数app.params.getOrElse("username", "")
		//查询验证身份逻辑
}
```

**定义策略名**
```scala
override def name: String = "UserLogin"
```

**执行`authenticate()`方法前执行，验证参数是否合理`isValid`**
```scala
override def isValid(implicit request: HttpServletRequest) = {
}
```

**`unauthenticated()`验证未通过执行的函数，一般跳转到登陆页面**
//...



#### （5）Controller常用方法
`isAuthenticated` 验证是否已经通过验证（这只是读取验证状态、不会执行验证策略，执行验证策略前，默认为false）
`scentry.authenticate("RememberMe")` 执行指定的验证策略
`scentry.authenticate()` 执行所有的验证策略
`scentry.logout()` 退出登录
`userOption` 获取用户实体对象通过调用fromSession获得

### 7、Flash重定向带参数
访问/toOther将重定向到other，用flash可以读取设置的参数
```scala
class FlashController extends ScalatratestStack with FlashMapSupport{
	get("/toOther"){
		flash("notice") = "dsf"
		redirect(url("/other"))
	}
	
	get("/other"){
		<h1>toOther的参数是：{flash.get("notice")}</h1>
	}
}
```

## 三、异步支持
### 1、Akka
#### （1）添加依赖
```scala
"com.typesafe.akka" %% "akka-actor" % "2.3.4",
"net.databinder.dispatch" %% "dispatch-core" % "0.11.3",
```

#### （2）初始化Actor系统
```scala
import _root_.akka.actor.{Props, ActorSystem}
import com.example.app._
import org.scalatra._
import javax.servlet.ServletContext


class ScalatraBootstrap extends LifeCycle {

  val system = ActorSystem()
  val myActor = system.actorOf(Props[MyActor])

  override def init(context: ServletContext) {
    context.mount(new PageRetriever(system), "/*")
    context.mount(new MyActorApp(system, myActor), "/actors/*")
  }

  override def destroy(context:ServletContext) {
    system.shutdown()
  }
}
```

#### （3）Controller混入FutureSupport特质
```scala
class AkkaController(system:ActorSystem, myActor:ActorRef) extends ScalatratestStack  with FutureSupport {
	implicit val timeout = new Timeout(2 seconds)
	protected implicit def executor: ExecutionContext = system.dispatcher
	
	// You'll see the output from this in the browser.
	get("/ask") {
		myActor ? "Do stuff and give me an answer"
	}
	
	// You'll see the output from this in your terminal.
	get("/tell") {
		myActor ! "Hey, you know what?"
		Accepted()
	}
	
}
```

### 2、Atmosphere
Atmosphere是Scalatra内建的一个异步的异步websocket/comet框架。Atmosphere允许您在服务器和用户的浏览器（或其他用户代理）之间保持持久连接，您可以随时向用户推送新信息，而无需刷新页面。

#### （1）Atmosphere样例——一个web聊天系统
> git地址https://git.oschina.net/null_834/Scalatra-Atmosphere-Example.git

**a. 使用g8创建项目骨架**
**b. 添加依赖**
```scala
"org.scalatra" %% "
" % "2.5.0",
"org.json4s" %% "json4s-jackson" % "3.5.0", //不必须，样例需要
```

**c. 创建Controller引入内容**
```scala
import java.util.Date

import org.json4s.JsonDSL._
import org.json4s._
import org.scalatra._
import org.scalatra.atmosphere._
import org.scalatra.json.{JValueResult, JacksonJsonSupport}
import org.scalatra.scalate.ScalateSupport

import scala.concurrent.ExecutionContext.Implicits.global
```

**d. 创建Controller**
```scala
class ChatController extends ScalatraServlet 
  with ScalateSupport with JValueResult 
  with JacksonJsonSupport with SessionSupport 
  with AtmosphereSupport {

  atmosphere("/the-chat") {
    new AtmosphereClient {
      def receive = {
          case Connected => //用户连接上服务器执行
          case Disconnected(disconnector, Some(error)) => //断开连接执行
          case Error(Some(error)) => //出现错误
          case TextMessage(text) => send("ECHO: " + text) //文本消息
          case JsonMessage(json) => broadcast(json) //json类型消息
        }
      }
    }
  }
```

**e. 客户端依赖
https://github.com/Atmosphere/atmosphere-javascript

**f.客户端程序**
```js
var socket = atmosphere; //获取socket
var author = null;
var transport = 'websocket';

//配置一个websocket请求，实现一系列方法
var request = {
		url: "/chat",
		contentType: "application/json",
		logLevel: 'debug',
		transport: transport,
		fallbackTransport: 'long-polling'
};

//打开连接执行的函数，初始化之后自动执行
request.onOpen = function(response) {
};

//重新连接执行的函数
request.onReconnect = function(rq, rs) {
};

//接受到一个服务端发送的消息
request.onMessage = function(rs) {
		var message = rs.responseBody;
};

request.onClose = function(rs) {
};

request.onError = function(rs) {
};

subSocket = socket.subscribe(request);

//发送消息
//subSocket.push(str);
```



## 四、视图
### 1、内联HTML
渲染视图的最简单的方法是使用内联HTML。

与大多数其他语言中的框架不同，Scalatra可以使用Scala的内置XML文字直接输出XML作为操作的返回值：
```scala
get("/inline"){
	contentType="text/html"

	<html>
		<head><title>Test</title></head>
		<body>contentType is {contentType}</body>
	</html>
}
```

注意在xml中使用{}可以执行scala代码

这对于为大型应用程序构建复杂视图是一种非常糟糕的方法，但如果您的模板需求非常简单（或者您只是想了解一个快速原型），这可能会非常有用。

通常你会想要更多的结构比内联HTML可以提供，以便您可以从您的控制器操作和路由分离您的视图。


### 2、Scalate模板引擎
如果你使用Scalatra构建一个web应用程序（而不是一个API），你可能会想渲染HTML布局，页面内容，可重复使用的碎片或部分。像许多其他框架一样，我们将HTML模板称为“视图”。

Scalatra可以以两种主要方式渲染视图：
1. 内联HTML，直接从操作返回。 
2. 使用内置在默认Scalatra g8模板中的ScalateSupport帮助程序trait。

#### （1）Scalate介绍
Scalatra使用了一个非常强大的模板引擎，Scalate。它支持多种模板样式。我们认为它是最好的模板引擎之一 - 它非常快速，灵活和功能丰富。

Scalate的亮点功能包括：
* Custom template evaluation scopes / bindings
* Ability to pass locals to template evaluation
* Support for passing a block to template evaluation for "yield"
* Backtraces with correct filenames and line numbers
* 模板文件缓存和重新加载

Scalate包括对多种模板样式的支持， 包括 SSP (类似于 Velocity 或者 ERB), SCAML (一种Scala HAML变体), Mustache, and Jade (另一种HAML变体)。除了Mustache之外，模板是强类型的。所以你的编译器可以通过告诉你在你的意见中犯了一个错误，你可以节省你的时间。

Scalate默认包含在scalatra中。默认情况下，Scalatra在应用程序根目录中的views目录中查找视图。

有两种使用Scalate的方法。您可以使用ScalateSupport帮助程序，或直接调用Scalate。无论哪种方式，您都需要使用ScalateSupport扩展您的servlet，如下所示：
```scala
class YourServlet extends ScalatraServlet with ScalateSupport {
  get("/") {
    // render your views in the action (see below)
  }
}
```


#### （2）ScalateSupport 帮助
使用Scalate的最简单的方法是使用Scalatra的ScalateSupport帮助程序。 每种可能的Scalate模板（mustache，scaml，jade，ssp）都有一个相应的助手，可以用来查找模板文件。 基本用法：
```scala
get("/") {
  contentType="text/html"
  ssp("/index") //默认查找模板目录
}
```
注意：当使用scalate helper方法时，它不需要有一个前导的`/`，所以`ssp（"index"）`会像`ssp（"/index:"）`一样工作。

你也可以使用一点点魔法来做同样的事情，使用一个名为layoutTemplate的方法。此方法允许您渲染任何类型的Scalate模板。您需要给出模板的完整路径，从WEB-INF目录开始：
```scala
get("/") {
  contentType="text/html"
  layoutTemplate("/WEB-INF/templates/views/index.ssp")
}
```
注意：当使用layoutTemplate时，必须在视图路径前添加相对`/`字符。所以，`layoutTemplate("/WEB-INF/templates/views/foo.ssp")`是正确的，`layoutTemplate("WEB-INF/templates/views/foo.ssp")`将出错。


#### （3）将参数传递给视图
如前所述，Scalate模板是强类型的（除了Mustache不是之外）。这使它们运行非常快，并通过让编译器告诉你什么时候出错，帮助你提高效率。这也意味着您想要在视图中访问的任何控制器变量都需要由控制器显式发送到视图。它们需要在视图中声明才能使用。

视图参数在模板文件的路径后使用Seq(String,Any）传递给视图。最简单的示例可能如下所示：
```scala
get("/") {
  contentType="text/html"
  ssp("/index", "foo" -> "uno", "bar" -> "dos")
}
```

```html
<html>
    <head>
        <title>ssptest</title>
    </head>
    <body>
        <%@ val foo: String %>
        <%@ val bar: String %>
        <p>Foo is <%= foo %></p>
        <p>Bar is <%= bar %></p>
    </body>
</html>
```

视图还可以从templateAttributes帮助器接收参数。如果您有多个步骤来创建参数，这允许您从路由操作之前的处理程序或内部全局传递参数，示例如下：
```scala
before(){
  if(isAuthenticated) {
    templateAttributes("user") = Some(user)
  }
}
```

#### （4）布局
Scalatra在webapp/layouts/目录中查找布局，并将当前操作的渲染视图插入到您指定的点的模板中。如果您使用SSP，您的布局可能如下所示：
```html
<%@ val body: String %>
<html>
	<head>..</head>
	<body>
		<%= unescape(body) %>
	</body>
</html>
```

您的操作的特定视图将在`<%= unescape(body) %>`语句中呈现。

#### （5）默认布局
按照惯例，Scalatra在`WEB-INF/layouts/default.xx`中使用默认布局（其中xx是scalate支持的模板类型之一）。如果你使用ssp，例如，你把一个`default.ssp`文件在`WEB-INF/layouts/default.ssp`。它会自动使用。在这种情况下，您可以简单地调用`ssp("/index")`，并且响应将在默认布局中呈现。

#### （6）指定布局
从您的操作传递的布局键有点特别，因为它被Scalate用于标识布局文件，它围绕当前操作的输出包装一个标准布局。
指定一个参数为"layout"->"WEB-INF/layouts/app.jade"
```scala
get("/") {
  contentType="text/html"

  jade("/index", "layout" -> "WEB-INF/layouts/app.jade", "foo" -> "uno", "bar" -> "dos")
}
```

#### （7）禁用布局
要禁用某些模板的布局，Scalate接受空布局参数：
```scala
get("/") {
  // This template will render without a layout.
  jade("/index", "layout" -> "", "foo" -> "uno", "bar" -> "dos")
}
```

#### （8）呈现404页面
当Scalatra找不到路由时，您可能需要呈现404网页。 你可以通过将notFound帮助器放入你的servlet来做到这一点。下面是它的外观，当使用ScalateSupport帮助程序来呈现页面。
```scala
notFound {
	//查找路径是否存在这个路径的模板，不存在就查找静态文件，找不到就返回默认NotFind
  findTemplate(requestPath) map { path =>
    contentType = "text/html"
    layoutTemplate(path)
  } orElse serveStaticResource() getOrElse resourceNotFound()
}
```

我的写法:
先查找静态文件，找不到，返回自定义的404页面
```scala
notFound {

	contentType = null
	serveStaticResource() getOrElse {
		contentType = "text/html;charset=utf-8"
		ssp("notfound","layout"->"","path"->requestPath)
	}
}
```

#### （9）关闭Scalate 错误页面（部署设定）
在混入ScalateSupport中，可以为任何未捕获的异常启用Scalate错误页面。此页面呈现模板源并突出显示错误。要禁用此行为，请覆盖isScalateErrorPageEnabled：
```scala
override def isScalateErrorPageEnabled = false
```

#### （10）乱码
若在`trait Xxx extends ScalatraServlet with ScalateSupport`里面实现notFound
需要显示的声明`contentType = "text/html;charset=UTF-8"`否则乱码


### 3、Ssp 模板语言
#### （1）取值表达式`${ }`或` <%= %>`
```ssp
<p>
		<%= List("hi", "there", "reader!").mkString(" ") %>
		${ "yo "+(3+4) }
</p>
```
输出
```html
<p>
  hi there reader!
  yo 7
</p>
```


#### （2）scala代码块`<% %>`或者  Velocity风格`#{ }#`
```ssp
<%
  var foo = "hello"
  foo += " there"
  foo += " you!"
%>
<p>${foo}</p>
```
输出
```html
<p>hello there you!</p>
```

#### （3）声明传递变量或者属性`<%@ %>`
如果属性映射不包含声明变量，则在渲染模板时抛出NoValueSetException。
使用默认值的形式（如下第二行）
```ssp
<%@ val foo: MyType %>
<%@ val bar: String = "this is the default value" %>
```

它的常见的基于单个对象的模板，谁的成员经常访问。在这种情况下，导入所有对象的成员非常方便。这可以通过在属性声明中添加import关键字来实现。

```ssp
<%@ import val model: Person %>
<p>Hello ${name}, what is the weather like in ${city}</p>
```
或者
```ssp
<%@ val model: Person %>
<% import model._ %>
<p>Hello ${name}, what is the weather like in ${city}</p>
```
等价于
```ssp
<%@ val model: Person %>
<p>Hello ${model.name}, what is the weather like in ${model.city}</p>
```

#### （4）Velocity风格的指令
执行逻辑分支或循环Scalate支持Velocity样式指令。

Velocity风格的指令都以＃开头，并且在括号中使用表达式，或者不使用。

例如，#if接受一个表达式，例如#if(x> 5)。如果需要，指令名称和括号之间可以有空格。所以你可以使用任何这些
* #if(x > 5)
* #if (x > 5)
* #if( x > 5 )

当指令不接受表达式时，您可以使用指令加括号的方式将其与文本更清楚地分开。
例如，如果你想在一行写if/else


**a. `#for`**
```ssp
<ul>
#for (i <- 1 to 5)
  <li>${i}</li>
#end
</ul>

//就像在Scala语言中，你可以使用序列推导执行多个嵌套循环。

<ul>
#for (x <- 1 to 2; y <- 1 to 2)
  <li>(${x}, ${y})</li>
#end
</ul>
```

输出
```html
<ul>
  <li>1</li>
  <li>2</li>
  <li>3</li>
  <li>4</li>
  <li>5</li>
</ul>

<ul>
  <li>(1, 1)</li>
  <li>(1, 2)</li>
  <li>(1, 1)</li>
  <li>(2, 1)</li>
</ul>
```

**b. `#if`**
```ssp
<p>
#if (customer.type == "Gold")
  Special stuff...
#end
</p>

<p>
#if (n == "James")
  Hey James
#elseif (n == "Hiram")
  Yo Hiram
#else
  Dunno
#end
</p>
```
输出
```html
<p>
  Special stuff...
</p>
<p>
  Hey James
</p>
```

**c. `#set`**
你经常想要一个模板的一部分，并将其分配给一个属性，然后你可以传递到布局或其他模板。

例如，您可能希望定义一个头部分，允许页面定义要进入HTML头元素的自定义输出...
```ssp
#set (head)
  ... some page specific JavaScript includes here...
#end
...rest of the page here...
```
layout文件
```ssp
<%@ var body: String %>
<%@ var title: String = "Some Default Title" %>
<%@ var head: String = "" %>
<html>
<head>
  <title>${title}</title>
  
  <%-- page specific head goes here --%>
  ${unescape(head)}
</head>
<body>
  <p>layout header goes here...</p>

  ${unescape(body)}
  
  <p>layout footer goes here...</p>
</body>
</html>
```

**d. `#match`**
您可以使用`#match`，`#case`，`#otherwise`和`#end`指令执行Scala样式模式匹配。
```ssp
<p>
#match (customer.type)
#case("Gold")
  Great stuff
#case("Silver")
  Good stuff
#otherwise
  No stuff
#end
</p>


<p>
#match (person)
#case(m: Manager)
  ${m.name} manages ${m.manages.size} people
#case(p: Person)
  ${p.name} is not a manager
#otherwise
  Not a person
#end
</p>
```


**e. `#do`**
用于调用模板内部可用的函数如：
layout("foo.ssp")
render("foo.ssp")
等

假设有foo.ssp
```ssp
<%@ val body: String = "Bar" %>
<table>
 <tr>
   <th>Some Header</th>
 </tr>
 <tr>
   <td><%= body %></td>
 </tr>
</table>

```

```ssp
<% render("foo.ssp", Map("body" -> "Foo")) %>
等价于
<% layout("foo.ssp") {%>
Foo
<%}%>
等价于
#do( layout("foo.ssp") )
Foo
#end
```

**f. `#import`等价于`<% import somePackage %>`**
```ssp
#import(java.util.Date)

<p>The time is now ${new Date}</p>
```


#### （5）注释`<%-- --%>`

#### （6）包含命令`${include(someUri)}`

#### （7）渲染模板
通常想要将大模板重构为更小的可重用部分。它容易使用render方法从另一个模板中渲染模板，如下所示
```ssp
<% render("foo.ssp") %>
<% render("/customers/contact.ssp") %>
<% render("/customers/contact.ssp", Map("customer" -> c, "title" -> "Customer")) %>
<% render("/customers/contact.ssp", Map('customer -> c, 'title -> "Customer")) %>
```

#### （8）布局
它很常见的想要以类似的方式来样式所有的页面;例如添加页眉和页脚，常用导航栏或包括一组常见的CSS样式表。

你可以使用Scalate中的布局支持来实现这一点。
/WEB-INF/scalate/layouts/default.ssp
```scala
<%@ var body: String %>
<%@ var title: String = "Some Default Title" %>
<html>
<head>
  <title>${title}</title>
</head>
<body>
  <p>layout header goes here...</p>

  ${unescape(body)}

  <p>layout footer goes here...</p>
</body>
</html>
```

更改标题或布局模板
```ssp
<% attributes("layout") = "/WEB-INF/layouts/custom.ssp" %>
<% attributes("title") = "This is the custom title" %>
<h3>Custom page</h3>
<p>This is some text</p>
```

禁用布局
```ssp
<% attributes("layout") = "" %>
<html>
<body>
  <h1>No Layout</h1>
  <p>This page does not use the layout</p>
</body>
</html>
```

显示的调用布局
假设有foo.ssp
```ssp
<%@ val body: String = "Bar" %>
<table>
 <tr>
   <th>Some Header</th>
 </tr>
 <tr>
   <td><%= body %></td>
 </tr>
</table>

```

```ssp
<% render("foo.ssp", Map("body" -> "Foo")) %>
等价于
<% layout("foo.ssp") {%>
Foo
<%}%>
等价于
#do( layout("foo.ssp") )
Foo
#end
```

#### （9）捕获输出
```ssp
<% val foo = capture { %>
  hello there ${user.name} how are you?
<%}%>
...
${foo}
...
${foo}
```

#### （10）调用scala函数
```scala
object Cheese {
  def foo(productId: Int) = 
    <a href={"/products/" + productId} title="Product link">My Product</a>
}
```
```ssp
<% import Cheese._  %>
${foo(123)}
```

#### （11）集合方法`collection`
对于每一个Person对象，进行渲染模板index，输出到此处，分隔符为`<hr>`
在index模板中使用约定的变量名获取变量为person
```ssp
<% val people = List(Person("James", "Strachan"), Person("Hiram", "Chirino")) %>
<% collection(people, "index", "<hr/>")  %>
```

#### （12）对象视图方法`view`
```ssp
<% val user = new User("foo") %>
<p>Something...</p>
<% view(user) %>
<p>... more stuff </p>
```
流程：
Scalate will then look for the template called packageDirectory.ClassName.viewName.(jade|mustache|ssp|scaml) and render that
Scalate然后将查找叫做`packageDirectory.ClassName.viewName.(jade|mustache|ssp|scaml)`然后渲染。
例如：`org.fusesource.scalate.sample.Person`将查找
`org/fusesource/scalate/sample/Person.index.ssp template`

但是使用scalatra未测试成功报错
No 'index' view template could be found for model object 'User(0,abc,111)' of type: com.rectcircle.scalatrateset.model.User


```ssp
<% val user = new User("foo") %>
${view(user, "edit")}
```







