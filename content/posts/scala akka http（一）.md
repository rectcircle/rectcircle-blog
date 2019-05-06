---
title: scala akka http（一）
date: 2017-11-16T23:10:08+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/117
  - /detail/117/
tags:
  - scala
---

> [参考1](http://blog.csdn.net/tiger_xc?viewmode=contents)

* [五、http](#五、http)
	*	[1、介绍](#1、介绍)
	*	[2、配置](#2、配置)
	*	[3、通用抽象（客户端和服务器端）](#3、通用抽象（客户端和服务器端）)
		*	[（1）Http模型](#（1）Http模型)
		*	[（2）URI模型](#（2）URI模型)
		*	[（3）Marshalling](#（3）Marshalling)
		*	[（4）Unmarshalling](#（4）Unmarshalling)
		*	[（5）编解码](#（5）编解码)
		*	[（6）JSON支持](#（6）JSON支持)
		*	[（7）XML支持](#[（7）XML支持)
		*	[（8）HTTP超时](#（8）HTTP超时)
	*	[4、请求/响应实体的流式性质的影响](#4、请求/响应实体的流式性质的影响)
	*	[5、低等级服务端API](#5、低等级服务端API)
	*	[6、高级别服务端API](#6、高级别服务端API)
		*	[（1）几个例子](#（7）几个例子)
		*	[（2）Routing DSL](#（2）Routing DSL)
		*	[（3）指令](#（3）指令)
		*	[（4）拒收](#（4）拒收)
		*	[（5）异常处理](#（5）异常处理)
		*	[（6）提取case class](#（6）提取case class)



## 五、http
************************************
### 1、介绍
Akka HTTP模块在akka-actor和akka-stream之上实现了完整的服务器端和客户端HTTP栈。这不是一个Web框架，而是提供和使用基于HTTP的服务的更一般的工具包。虽然与浏览器的交互当然也在范围内，但它并不是Akka HTTP的主要关注点。

Akka HTTP遵循相当开放的设计，并且多次提供几个不同的API级别来“做同样的事情”。您可以选择最适合您的应用程序的API抽象级别。这意味着，如果您在使用高级API实现某些功能时遇到困难，那么您很可能可以使用低级API来完成这一任务，这样可以提供更多的灵活性，但可能需要编写更多的应用程序代码。

#### （1）设计哲学
Akka HTTP一直致力于提供构建集成层而不是应用程序内核的工具。因此，它把自己看作是一套库，而不是一个框架。

正如我们想要的那样，框架为您提供了一个“框架”，您可以在其中构建应用程序。它提供了许多已经预先制定的决策，并提供了一个基础，包括支持结构，使您能够快速开始并交付结果。在某种程度上，框架就像是一个框架，为了让它生动起来，应用程序的“肉体”就放在这个框架上。如果您在开始应用程序开发之前选择了这些框架，并且尝试在框架“坚持”做事的方式时，这样的框架效果最佳。

如果您正在构建面向浏览器的Web应用程序，那么选择Web框架并在其上构建应用程序是有意义的，因为应用程序的“核心”是浏览器与Web服务器上的代码的交互。框架制造商已经选择了一种“经过验证”的设计方法并且让你“填补空白”或多或少灵活的“应用程序模板”。能够依靠这样的最佳实践架构可以成为快速完成任务的重要资产

但是，如果您的应用程序不主要是Web应用程序，因为它的核心不是浏览器交互 反而 一些专门的可能是复杂的业务服务，你只是试图通过REST / HTTP接口将它连接到世界上，一个web框架可能不是你所需要的。在这种情况下，应用程序体系结构应该由内核而不是接口层是有意义的。此外，您可能不会从可能存在的浏览器特定框架组件（如视图模板，资产管理，JavaScript和CSS生成/操作/缩小，本地化支持，AJAX支持等）中受益。

Akka HTTP被设计为“非框架”，不是因为我们不喜欢框架，而是框架不是正确选择的用例。Akka HTTP用于构建基于HTTP的集成层，并试图“保持观望”。因此，您通常不会在“Akka HTTP”之上构建您的应用程序，但是您可以根据需要构建应用程序，并仅使用Akka HTTP来满足HTTP集成需求。

另一方面，如果您更愿意在框架的指导下构建您的应用程序，则应该尝试使用Play Framework或Lagom，这两者都在内部使用Akka。

#### （2）使用Akka Http
引入依赖
```scala
// For Akka 2.4.x or 2.5.x
"com.typesafe.akka" %% "akka-http" % "10.0.10" 
// Only when running against Akka 2.5 explicitly depend on akka-streams in same version as akka-actor
"com.typesafe.akka" %% "akka-stream" % "2.5.4" // or whatever the latest version is
"com.typesafe.akka" %% "akka-actor"  % "2.5.4" // or whatever the latest version is
```

#### （3）Routing DSL for HTTP servers
高级Api提供了一套DSL来描述Http的路由及处理。每个路由由一个或多个级别的 `Directive` 组成，这些指令缩小到处理一个特定类型的请求。

例如，一个路由可能以匹配请求的路径开始，只有在匹配时才匹配“/hello”，然后将其缩小为只处理HTTP get请求，然后用字符串文本来完成这些请求，这些字符串文本将作为HTTP OK以字符串作为响应主体发回。

对请求和响应体在字符串和对象中的转换的使用与路由声明分开，使用marshallers，他是这是隐式使用“magnet”模式拉动。这意味着，只要在范围内有一个隐式编组器，你可以complete一个请求使用任何类型的对象

默认的marshallers提供了简单的对象如String或ByteString，你可以定义你自己的例子为JSON。另一个模块使用spray-json库提供JSON序列化

例子
```scala
package com.lightbend.akka.sample.http

import akka.Done
import akka.actor.{Actor, ActorLogging, ActorSystem, Props}
import akka.http.scaladsl.Http
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.model.{ContentTypes, HttpEntity, StatusCodes}
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.stream.ActorMaterializer
import akka.stream.scaladsl.Source
import akka.pattern.ask
import akka.util.{ByteString, Timeout}
import spray.json.DefaultJsonProtocol._
import spray.json.RootJsonFormat

import scala.concurrent.{ExecutionContextExecutor, Future}
import scala.concurrent.duration._
import scala.io.StdIn
import scala.util.Random




object WebServer extends App {

	//需要用到隐式值
	implicit val system:ActorSystem = ActorSystem("my-system")
	implicit val materializer:ActorMaterializer = ActorMaterializer()
	// future需要的 执行上下文
	implicit val executionContext: ExecutionContextExecutor = system.dispatcher

	// 主要模型
	final case class Item(name: String, id: Long)
	final case class Order(items: List[Item])

	// json序列化与反序列化
	implicit val itemFormat:RootJsonFormat[Item]= jsonFormat2(Item) //将对象转换为json字符串
	implicit val orderFormat:RootJsonFormat[Order] = jsonFormat1(Order) //将请求体json包装成对象

	// (fake) 异步数据库查询（模拟）
	def fetchItem(itemId: Long): Future[Option[Item]] = Future{ if(itemId==1) Some(Item("name", 1)) else None}
	def saveOrder(order: Order): Future[Done] = Future { Done }

	//使用流
	val numbers = Source.fromIterator(() =>
		Iterator.continually(Random.nextInt()))

	//使用actor
	object Auction { //模拟拍卖

		def props:Props = Props[Auction]

		case class Bid(userId: String, offer: Int) //出价
		case object GetBids //获取出价的命令
		case class Bids(bids: List[Bid])
	}
	class Auction extends Actor with ActorLogging {
		import Auction._

		var bids = List.empty[Bid]
		def receive:Receive = {
			case bid @ Bid(userId, offer) => //出价处理
				bids = bids :+ bid
				log.info(s"Bid complete: $userId, $offer")
			case GetBids => sender() ! Bids(bids) //返回出价
			case _ => log.info("Invalid message") //其他为非法消息
		}
	}
	val auction = system.actorOf(Auction.props, "auction")

	implicit val bidFormat:RootJsonFormat[Auction.Bid] = jsonFormat2(Auction.Bid)
	implicit val bidsFormat:RootJsonFormat[Auction.Bids] = jsonFormat1(Auction.Bids)

	//路由匹配
	val route =
		path("hello") { //路径匹配
			get { //http方法匹配
				complete(HttpEntity(ContentTypes.`text/html(UTF-8)`, "<h1>Say hello to akka-http</h1>")) //返回普通字符串
			}
		} ~
		get {
			pathPrefix("item" / LongNumber) { id => //路径解析
				// 一个给定的ID可能没有项目
				val maybeItem: Future[Option[Item]] = fetchItem(id)

				onSuccess(maybeItem) {
					case Some(item) => complete(item) //返回一个条目，json序列化
					case None       => complete(StatusCodes.NotFound) //返回404
				}
			}
		} ~
		post {
			path("create-order") {
				entity(as[Order]) { order => //json反序列化
					val saved: Future[Done] = saveOrder(order)
					onComplete(saved) { _ =>
						complete("order created")
					}
				}
			}
		} ~
		path("random") {
			get {
				complete(
					HttpEntity(
						ContentTypes.`text/plain(UTF-8)`,
						numbers.map(n => ByteString(s"$n\n")) //使用流
					))
			}
		} ~
		path("auction") {
			import Auction._
			put {
				parameter("bid".as[Int], "user") { (bid, user) =>
					// place a bid, fire-and-forget
					auction ! Bid(user, bid)
					complete((StatusCodes.Accepted, "bid placed"))
				}
			} ~
			  get {
				  implicit val timeout: Timeout = 5.seconds

				  // query the actor for the current auction state
				  val bids: Future[Bids] = (auction ? GetBids).mapTo[Bids]
				  complete(bids)
			  }
		}

	//创建绑定端口、ip的Future
	val bindingFuture = Http().bindAndHandle(route, "localhost", 8080)

	println(s"Server online at http://localhost:8080/\nPress RETURN to stop...")
	StdIn.readLine() // let it run until user presses return
	bindingFuture
	  .flatMap(_.unbind()) // trigger unbinding from the port
	  .onComplete(_ => system.terminate()) // and shutdown when done
}
```

#### （4）低级Api
```scala
package com.lightbend.akka.sample.http

import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import akka.http.scaladsl.model._
import akka.http.scaladsl.model.HttpMethods._
import akka.stream.ActorMaterializer

import scala.concurrent.ExecutionContextExecutor
import scala.io.StdIn


object LowLevelWebServer extends App {

	//需要用到隐式值
	implicit val system:ActorSystem = ActorSystem("my-system")
	implicit val materializer:ActorMaterializer = ActorMaterializer()
	// future需要的 执行上下文
	implicit val executionContext: ExecutionContextExecutor = system.dispatcher

	//低级Api
	val requestHandler: HttpRequest => HttpResponse = {
		case HttpRequest(GET, Uri.Path("/"), _, _, _) =>
			HttpResponse(entity = HttpEntity(
				ContentTypes.`text/html(UTF-8)`,
				"<html><body>Hello world!</body></html>"))

		case HttpRequest(GET, Uri.Path("/ping"), _, _, _) =>
			HttpResponse(entity = "PONG!")

		case HttpRequest(GET, Uri.Path("/crash"), _, _, _) =>
			sys.error("BOOM!")

		case r: HttpRequest =>
			r.discardEntityBytes() // important to drain incoming HTTP Entity stream
			HttpResponse(404, entity = "Unknown resource!")
	}

	val bindingFuture = Http().bindAndHandleSync(requestHandler, "localhost", 8080)

	println(s"Server online at http://localhost:8080/\nPress RETURN to stop...")
	StdIn.readLine() // let it run until user presses return
	bindingFuture
	  .flatMap(_.unbind()) // trigger unbinding from the port
	  .onComplete(_ => system.terminate()) // and shutdown when done
}
```

#### （5）Http客户端Api
```scala
package com.lightbend.akka.sample.http

import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import akka.http.scaladsl.model.{HttpRequest, HttpResponse}
import akka.stream.ActorMaterializer

import scala.concurrent.{ExecutionContextExecutor, Future}
import scala.util.Success

object HttpClient extends App {
	//需要用到隐式值
	implicit val system:ActorSystem = ActorSystem("my-system")
	implicit val materializer:ActorMaterializer = ActorMaterializer()
	// future需要的 执行上下文
	implicit val executionContext: ExecutionContextExecutor = system.dispatcher

	val responseFuture: Future[HttpResponse] =
		Http().singleRequest(HttpRequest(uri = "http://www.baidu.com"))

	responseFuture.onComplete{
		case Success(response) =>
			println(response.status)
	}
}
```

#### （6）Akka Http 模块
* akka-http http 高级服务端api
* akka-http-core 低级服务端api
* akka-http-testkit http测试
* akka-http-spray-json json序列化与反序列化
* akka-http-xml xml序列化和反序列化


### 2、配置
[参见](https://doc.akka.io/docs/akka-http/current/scala/http/configuration.html)


### 3、通用抽象（客户端和服务器端）
#### （1）Http模型
参考源码

**概貌**
* `import akka.http.scaladsl.model._` 引入了HttpRequest HttpResponse headers Uri, HttpMethods, MediaTypes, StatusCodes等http模型


**HttpRequest**
对http请求的抽象，包含请求方法、url、请求头、请求体、协议号等
例子：
```scala
package com.lightbend.akka.sample.http

import akka.http.scaladsl.model._
import akka.http.scaladsl.model.headers.BasicHttpCredentials
import akka.util.ByteString


object CommonAbstractions extends App {
	import HttpMethods._
	// construct a simple GET request to `homeUri`
	val homeUri = Uri("/abc")
	HttpRequest(GET, uri = homeUri)

	// construct simple GET request to "/index" (implicit string to Uri conversion)
	HttpRequest(GET, uri = "/index")

	// construct simple POST request containing entity
	val data = ByteString("abc")
	HttpRequest(POST, uri = "/receive", entity = data)

	// customize every detail of HTTP request
	import HttpProtocols._
	import MediaTypes._
	import HttpCharsets._
	val userData = ByteString("abc")
	val authorization = headers.Authorization(BasicHttpCredentials("user", "pass"))
	HttpRequest(
		PUT,
		uri = "/user",
		entity = HttpEntity(`text/plain` withCharset `UTF-8`, userData),
		headers = List(authorization),
		protocol = `HTTP/1.0`)
}
```

**HttpResponse**
包含
* 状态码
* 返回头序列
* 响应体
* 协议版本

例子
```scala
import StatusCodes._

// simple OK response without data created using the integer status code
HttpResponse(200)

// 404 response created using the named StatusCode constant
HttpResponse(NotFound)

// 404 response with a body explaining the error
HttpResponse(404, entity = "Unfortunately, the resource couldn't be found.")

// A redirecting response containing an extra header
val locationHeader = headers.Location("http://example.com/other")
HttpResponse(Found, headers = List(locationHeader))
```


**HttpEntity**
他将设置字节数据消息和Content-Type，如果知道还将设置 Content-Length

* `HttpEntity.Strict` 最简单的实体，当所有的实体在内存中已经可用时使用它。它包装一个普通的ByteString，并表示一个已知Content-Length
* `HttpEntity.Default` 
* `HttpEntity.Chunked`
* `HttpEntity.CloseDelimited`
* `HttpEntity.IndefiniteLength`


如何选择
* 如果数据量“很小”并且已经在内存中可用（例如作为String或ByteString），请使用Strict
* 如果数据是由流式数据源生成的，并且数据的大小已知，则使用`Default `
* 未知实体长度`Chunked`
* 如果客户端不支持分块传输编码，请使用CloseDelimited将响应作为Chunk的传统替代方法。否则使用`Chunked`
* 在`Multipart.Bodypart`中使用`IndefiniteLength`来表示未知长度的内容。

一个例子
```scala
val e1:HttpEntity.Strict = HttpEntity("123")
```


**Header模型**
Akka HTTP包含最常见HTTP标头的丰富模型。解析和渲染是自动完成的，所以应用程序不需要关心Header的实际语法。未明确建模的头文件表示为RawHeader（实质上是一个String / String名/值对）。
```scala
	import akka.http.scaladsl.model.headers._

	// create a ``Location`` header
	val loc = Location("http://example.com/other")

	// create an ``Authorization`` header with HTTP Basic authentication data
	val auth = Authorization(BasicHttpCredentials("joe", "josepp"))

	// custom type
	case class User(name: String, pass: String)

	// a method that extracts basic HTTP credentials from a request
	def credentialsOfRequest(req: HttpRequest): Option[User] =
		for {
			Authorization(BasicHttpCredentials(user, pass)) <- req.header[Authorization]
		} yield User(user, pass)
```

**HTTP Headers**
* `Content-Type`
* `Transfer-Encoding`

例子
```scala
	/**
	  * http header
	  */
	//定义
	val c1 = ContentTypes.`text/plain(UTF-8)`
	val c2 = MediaTypes.`text/plain` withCharset HttpCharsets.`UTF-8`
	val c3 = ContentType(MediaTypes.`application/json`)
```


其他[参见](https://doc.akka.io/docs/akka-http/current/scala/http/common/http-model.html#http-headers)


**自定义Headers**
```scala
	/**
	  * 自定义 header
	  */
	final class ApiTokenHeader(token: String) extends ModeledCustomHeader[ApiTokenHeader] {
		override def renderInRequests = false
		override def renderInResponses = false
		override val companion = ApiTokenHeader
		override def value: String = token
	}
	object ApiTokenHeader extends ModeledCustomHeaderCompanion[ApiTokenHeader] {
		override val name = "apiKey"
		override def parse(value: String) = Try(new ApiTokenHeader(value))
	}
	//使用
	val ApiTokenHeader(t1) = ApiTokenHeader("token")

	RawHeader.unapply(ApiTokenHeader("token"))

	val RawHeader(k2, v2) = ApiTokenHeader("token") //异常情况
	println(k2, v2)

	// will match, header keys are case insensitive
	val ApiTokenHeader(v3) = RawHeader("APIKEY", "token")
	println(v3)
```

其他[参见](https://doc.akka.io/docs/akka-http/current/scala/http/common/http-model.html)





#### （2）URI模型
**解析一个 URI 字符串**
```scala
	val uri1 = Uri("http://localhost")
	println(uri1)
	println(Uri("ftp://ftp.is.co.za/rfc/rfc1808.txt") ==
	  Uri.from(scheme = "ftp", host = "ftp.is.co.za", path = "/rfc/rfc1808.txt"))

	println(Uri("ldap://[2001:db8::7]/c=GB?objectClass?one") ==
	  Uri.from(scheme = "ldap", host = "[2001:db8::7]", path = "/c=GB", queryString = Some("objectClass?one")))
```

```
  foo://example.com:8042/over/there?name=ferret#nose
  \_/   \______________/\_________/ \_________/ \__/
   |           |            |            |        |
scheme     authority       path        query   fragment
   |   _____________________|__
  / \ /                        \
  urn:example:animal:ferret:nose
```

对于URI中的“特殊”字符，通常使用下面的百分比编码。在URI中的查询字符串部分更详细地讨论编码百分比。
```scala
Uri("%2520").path.head shouldEqual "%20"
Uri("/%2F%5C").path shouldEqual Path / """/\"""
```

处理查询字符串
```scala
	def strict(queryString: String): Query = Query(queryString, mode = Uri.ParsingMode.Strict)
	println(strict("a=b") == ("a", "b") +: Query.Empty)
	println(Uri("http://localhost?a=b").query() == Query("a=b"))
```


#### （3）Marshalling
Marshalling是一个过程：将较高级别（对象）结构转换为某种较低级别的表示，这称之为序列化或者pickling

在Akka HTTP中，编组意味着将类型T的对象转换为较低级别的目标类型，例如， MessageEntity（它构成HTTP请求或响应的“实体主体”）或完整的HttpRequest或HttpResponse。

**基本设计**
将类型A的实例编组到类型B的实例中由Marshaller [A，B]执行。Akka HTTP还预定了大量有用的别名，以便您可能最适合的marshailer类型：
```scala
type ToEntityMarshaller[T] = Marshaller[T, MessageEntity]
type ToByteStringMarshaller[T] = Marshaller[T, ByteString]
type ToHeadersAndEntityMarshaller[T] = Marshaller[T, (immutable.Seq[HttpHeader], MessageEntity)]
type ToResponseMarshaller[T] = Marshaller[T, HttpResponse]
type ToRequestMarshaller[T] = Marshaller[T, HttpRequest]
```



**测试：**
```scala
package com.lightbend.akka.sample.http

import akka.actor.ActorSystem
import akka.http.scaladsl.marshalling.Marshal
import akka.http.scaladsl.model._

import scala.concurrent.Await
import scala.concurrent.duration._

object MarshallerTest extends App {

	val system = ActorSystem("MarshallerTest")
	import system.dispatcher

	val string = "Yeah"
	val entityFuture = Marshal(string).to[MessageEntity]
	val entity = Await.result(entityFuture, 1.second) // don't block in non-test code!
	println(entity.contentType)

	val errorMsg = "Easy, pal!"
	val responseFuture = Marshal(420 -> errorMsg).to[HttpResponse]
	val response = Await.result(responseFuture, 1.second) // don't block in non-test code!
	println(response.status)
	println(response.entity.contentType)

	val request = HttpRequest(headers = List(headers.Accept(MediaTypes.`application/json`)))
	val responseText = "Plaintext"
	val respFuture = Marshal(responseText).toResponseFor(request) // with content negotiation!
	Await.result(respFuture, 1.second) // client requested JSON, we only have text/plain!

}

```

#### （4）Unmarshalling
解组（Unmarshalling）是将某种较低级别的表示转换为一个更高层次（对象）。其他流行的名称是“反序列化”或“Unpickling”。

在Akka HTTP中，“解组”是指转换较低级别的源对象，例如，一个MessageEntity（它构成一个HTTP请求或响应的“实体主体”）或一个完整的HttpRequest或HttpResponse，到一个T类型的实例中。


**例子**
```scala
	val intFuture = Unmarshal("42").to[Int]
	val int = Await.result(intFuture, 1.second) // don't block in non-test code!
	println(int)

	val boolFuture = Unmarshal("off").to[Boolean]
	val bool = Await.result(boolFuture, 1.second) // don't block in non-test code!
	println(bool)
```



#### （5）编解码
HTTP规范定义了一个Content-Encoding头，它表示一个HTTP消息的实体主体是否被“编码”，如果是的话，是用哪个算法表示的。唯一常用的内容编码是压缩算法。

目前，Akka HTTP支持使用gzip或deflate编码对HTTP请求和响应进行压缩和解压缩。这个核心逻辑位于akka.http.scaladsl.coding包中。

**例子**
```scala
package com.lightbend.akka.sample.http

import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import akka.http.scaladsl.coding.{Deflate, Gzip, NoCoding}
import akka.http.scaladsl.model._
import headers.HttpEncodings
import akka.stream.ActorMaterializer

import scala.concurrent.Future
import scala.concurrent.duration._

import scala.util.Success



object EncodingAndDecodingTest extends App {
	implicit val system = ActorSystem()
	implicit val materializer = ActorMaterializer()
	import system.dispatcher

	val http = Http()

	val requests: Seq[HttpRequest] = Seq(
		"http://www.baidu.com"
	).map(uri ⇒ HttpRequest(uri = uri))

	def decodeResponse(response: HttpResponse): HttpResponse = {
		val decoder = response.encoding match {
			case HttpEncodings.gzip ⇒
				Gzip
			case HttpEncodings.deflate ⇒
				Deflate
			case HttpEncodings.identity ⇒
				NoCoding
		}

		decoder.decodeMessage(response)
	}

	val futureResponses: Future[Seq[HttpResponse]] =
		Future.traverse(requests)(http.singleRequest(_).map(decodeResponse))

	futureResponses.onComplete {
		case Success(s) =>
			s.foreach(res =>
				res.entity.toStrict(1.second)
				  .map(_.data)
				  .map(_.utf8String)
				  .foreach(println))
	}

}
```


#### （6）JSON支持
Akka HTTP的编组和解组基础结构使得将应用程序域对象从JSON无缝地转换为JSON成为一件非常简单的事情。通过akka-http-spray-json模块开箱即可提供与spray-json的集成。与其他JSON库的集成是由社区支持的。

SprayJsonSupport trait为每个类型T提供了一个FromEntityUnmarshaller [T]和ToEntityMarshaller [T]，可以使用隐式的spray.json.RootJsonReader和/或spray.json.RootJsonWriter（分别）。

**引入**
```scala
"com.typesafe.akka" %% "akka-http-spray-json" % "10.0.10" 
```

**例子**
```scala
package com.lightbend.akka.sample.http

import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import akka.http.scaladsl.server.Directives
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport
import akka.stream.ActorMaterializer
import spray.json._

import scala.concurrent.ExecutionContextExecutor
import scala.io.StdIn

// 模型类
final case class Item(name: String, id: Long)
final case class Order(items: List[Item])

// 定义json支持Json特质
trait JsonSupport extends SprayJsonSupport with DefaultJsonProtocol {
	implicit val printer = PrettyPrinter //格式化支持
	implicit val itemFormat = jsonFormat2(Item)
	implicit val orderFormat = jsonFormat1(Order) // contains List[Item]
}

// 混入自己的服务类
object MyJsonService extends Directives with JsonSupport {

	// format: OFF
	val route =
		get {
			pathSingleSlash {
				complete(Item("thing", 42)) // will render as JSON
			}
		} ~
		  post {
			  entity(as[Order]) { order => // will unmarshal JSON to Order
				  val itemsCount = order.items.size
				  val itemNames = order.items.map(_.name).mkString(", ")
				  complete(s"Ordered $itemsCount items: $itemNames")
			  }
		  }
	// format: ON
}

object JSONSSupportTest extends App {
	//需要用到隐式值
	implicit val system:ActorSystem = ActorSystem("my-system")
	implicit val materializer:ActorMaterializer = ActorMaterializer()
	// future需要的 执行上下文
	implicit val executionContext: ExecutionContextExecutor = system.dispatcher

	//创建绑定端口、ip的Future
	val bindingFuture = Http().bindAndHandle(MyJsonService.route, "localhost", 8080)

	println(s"Server online at http://localhost:8080/\nPress RETURN to stop...")
	StdIn.readLine() // let it run until user presses return
	bindingFuture
	  .flatMap(_.unbind()) // trigger unbinding from the port
	  .onComplete(_ => system.terminate()) // and shutdown when done
}

```

**其他json解析库实现**
引入
```scala
	"de.heikoseeberger" %% "akka-http-json4s" % "1.18.0",
	"org.json4s" %% "json4s-jackson" % "3.5.3",
	"org.json4s" %% "json4s-ext" % "3.5.3",
```

```scala
package com.lightbend.akka.sample.http

import akka.actor.ActorSystem
import akka.http.scaladsl.marshalling.Marshal
import akka.http.scaladsl.model.MessageEntity
import akka.http.scaladsl.server.{HttpApp, Route}
import akka.stream.ActorMaterializer
import de.heikoseeberger.akkahttpjson4s.Json4sSupport
import org.json4s.jackson

import scala.collection.mutable.ArrayBuffer



object OtherJsonSupport extends App {

	implicit val system = ActorSystem("httpSystem")
	implicit val materializer = ActorMaterializer()
	implicit val dispatcher = system.dispatcher

	trait JsonCodec extends Json4sSupport {
		import org.json4s.DefaultFormats
		import org.json4s.ext.JodaTimeSerializers
		implicit val serialization = jackson.Serialization
		implicit val formats = DefaultFormats ++ JodaTimeSerializers.all
	}

	object JsConverters extends JsonCodec

	import JsConverters._

	case class User(id: Int, name: String)
	case class Message[T](errcode: Int, errmsg: String, data:T)
	class Item(id: Int, name: String, price: Double)
	object AnyPic {
		val area = 10
		val title = "a picture"
		val data = ArrayBuffer[Byte](1,2,3)
	}

	val john = Marshal(User(1,"John")).to[MessageEntity]
	val msg = Marshal(Message(0, "success",User(1,"John"))).to[MessageEntity]
	val fruit = Marshal(new Item(1,"banana", 3.5)).to[MessageEntity]
	val pic = Marshal(AnyPic).to[MessageEntity]


	// Server definition
	object WebServer extends HttpApp {
		override def routes: Route =
			get {
				path("items") {
					complete(new Item(1,"banana", 3.5))
				} ~
				  path("users") {
					  complete(User(1,"John"))
				  } ~
				  path("pic") {
					  complete(Marshal(AnyPic).to[MessageEntity])
				  } ~
				path("msg"){
					complete(Message(0, "success",User(1,"John")))
				}
			}
	}
	// Starting the server
	WebServer.startServer("localhost", 8080, system)
}
```

#### （7）XML支持
略

#### （8）HTTP超时
Akka HTTP带有各种内置的超时机制，以保护您的服务器免受恶意攻击或编程错误。其中一些只是配置选项（可能会在代码中被覆盖），而另一些则是流API，并且可以直接作为用户代码中的模式来实现。

**常见的超时**
`idle-timeout`（空闲超时）是一个全局设置，用于设置给定连接的最长不活动时间。换句话说，如果一个连接是打开的，但是没有超过空闲超时时间的请求/响应被写入，连接将被自动关闭。

这个设置对于所有的连接都是一样的，无论是服务器端还是客户端，并且可以独立使用以下键来配置：
```
akka.http.server.idle-timeout
akka.http.client.idle-timeout
akka.http.host-connection-pool.idle-timeout
akka.http.host-connection-pool.client.idle-timeout
```

**服务器超时**
请求超时
请求超时是限制从路由产生HttpResponse可能需要的最长时间的机制。如果没有达到最后期限，服务器将自动注入服务不可用的HTTP响应，并关闭连接，以防止漏洞无限期地停留（例如，如果编程错误，Future将永远不会完成，否则不会发送真正的响应）。超过请求超时时写入的默认HttpResponse如下所示：
```scala
HttpResponse(StatusCodes.ServiceUnavailable, entity = "The server was not able " +
  "to produce a timely response to your request.\r\nPlease try again in a short while!")
```

默认请求超时将全局应用于所有路由，并且可以使用`akka.http.server.request-timeout`设置（缺省值为20秒）进行配置。
```scala
package com.lightbend.akka.sample.http

import akka.Done
import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import akka.http.scaladsl.model.{ContentTypes, HttpEntity}
import akka.http.scaladsl.server.Directives._
import akka.stream.ActorMaterializer

import scala.concurrent.{ExecutionContextExecutor, Future}
import scala.io.StdIn


object TimeoutTest extends App {

	//需要用到隐式值
	implicit val system:ActorSystem = ActorSystem("my-system")
	implicit val materializer:ActorMaterializer = ActorMaterializer()
	// future需要的 执行上下文
	implicit val executionContext: ExecutionContextExecutor = system.dispatcher


	//路由匹配
	val route =
		pathPrefix("timeout") { //路径匹配
			println("timeout")
			path("response"){
				println("response")
				get{
					val f = Future {
						Thread.sleep(21000)
						Done
					}
					onSuccess(f) {
						case Done => complete(HttpEntity(ContentTypes.`text/html(UTF-8)`, "<h1>Success</h1>"))
					}
				}
			}
		}

	//创建绑定端口、ip的Future
	val bindingFuture = Http().bindAndHandle(route, "localhost", 8080)

	println(s"Server online at http://localhost:8080/\nPress RETURN to stop...")
	StdIn.readLine() // let it run until user presses return
	bindingFuture
	  .flatMap(_.unbind()) // trigger unbinding from the port
	  .onComplete(_ => system.terminate()) // and shutdown when done
}

```

绑定超时
绑定超时是TCP绑定进程必须完成的时间段（使用任何`Http().bind *`方法）。可以使用`akka.http.server.bind-timeout`设置进行配置。


延迟超时
延迟超时是HTTP服务器实现将所有数据传送到网络层后保持连接打开的时间段。此设置与SO_LINGER套接字选项类似，但不仅包括OS级套接字，还包含Akka IO / Akka Streams网络堆栈。该设置是一种额外的预防措施，可防止客户端从服务器端保持已经考虑完成的连接。

如果网络级缓冲区（包括Akka Stream / Akka IO网络堆栈缓冲区）包含的数据比在服务器端认为完成此连接的给定时间内可以传输给客户端的数据量多，客户端可能会遇到连接重置。

**客户端超时**
连接超时

连接超时是TCP连接过程必须完成的时间段。调整它应该很少是必需的，但它允许连接错误的情况下连接不能建立一段给定的时间。

可以使用akka.http.client.connecting-timeout设置进行配置。


#### 4、请求/响应实体的流式性质的影响
#### （1）客户端http实体流的处理

**处理http响应实体**

例子
```scala
import java.io.File

import akka.actor.ActorSystem
import akka.http.scaladsl.model._
import akka.stream.ActorMaterializer
import akka.stream.scaladsl.{ FileIO, Framing }
import akka.util.ByteString

implicit val system = ActorSystem()
implicit val dispatcher = system.dispatcher
implicit val materializer = ActorMaterializer()

val response: HttpResponse = ???

response.entity.dataBytes
  .via(Framing.delimiter(ByteString("\n"), maximumFrameLength = 256))
  .map(transformEachLine)
  .runWith(FileIO.toPath(new File("/tmp/example.out").toPath))

def transformEachLine(line: ByteString): ByteString = ???
```

或者使用`toStrict`
```scala
import scala.concurrent.Future
import scala.concurrent.duration._

import akka.actor.ActorSystem
import akka.http.scaladsl.model._
import akka.stream.ActorMaterializer
import akka.util.ByteString

implicit val system = ActorSystem()
implicit val dispatcher = system.dispatcher
implicit val materializer = ActorMaterializer()

case class ExamplePerson(name: String)
def parse(line: ByteString): ExamplePerson = ???

val response: HttpResponse = ???

// toStrict来强制所有数据从连接加载到内存中
val strictEntity: Future[HttpEntity.Strict] = response.entity.toStrict(3.seconds)

// while API remains the same to consume dataBytes, now they're in memory already:
val transformedData: Future[ExamplePerson] =
  strictEntity flatMap { e =>
    e.dataBytes
      .runFold(ByteString.empty) { case (acc, b) => acc ++ b }
      .map(parse)
  }
```

**丢弃http响应实体**
```scala
import akka.actor.ActorSystem
import akka.http.scaladsl.model.HttpMessage.DiscardedEntity
import akka.http.scaladsl.model._
import akka.stream.ActorMaterializer

implicit val system = ActorSystem()
implicit val dispatcher = system.dispatcher
implicit val materializer = ActorMaterializer()

val response1: HttpResponse = ??? // obtained from an HTTP call (see examples below)

val discarded: DiscardedEntity = response1.discardEntityBytes()
discarded.future.onComplete { done => println("Entity discarded completely!") }
```

或者使用低等级的api
```scala
val response1: HttpResponse = ??? // obtained from an HTTP call (see examples below)

val discardingComplete: Future[Done] = response1.entity.dataBytes.runWith(Sink.ignore)
discardingComplete.onComplete(done => println("Entity discarded completely!"))
```

#### （2）服务端http实体流的处理
**处理http实体**
```scala
import akka.actor.ActorSystem
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.stream.ActorMaterializer
import spray.json.DefaultJsonProtocol._

implicit val system = ActorSystem()
implicit val materializer = ActorMaterializer()
// needed for the future flatMap/onComplete in the end
implicit val executionContext = system.dispatcher

final case class Bid(userId: String, bid: Int)

// these are from spray-json
implicit val bidFormat = jsonFormat2(Bid)

val route =
  path("bid") {
    put {
      entity(as[Bid]) { bid =>
        // incoming entity is fully consumed and converted into a Bid
        complete("The bid was: " + bid)
      }
    }
  }
```

当然，你也可以访问原始的dataBytes，并运行底层的流，比如将它们管道化成一个FileIO接收器，一旦所有的数据都被写入文件，就会通过Future [IoResult]

```scala
import akka.actor.ActorSystem
import akka.stream.scaladsl.FileIO
import akka.http.scaladsl.server.Directives._
import akka.stream.ActorMaterializer
import java.io.File

implicit val system = ActorSystem()
implicit val materializer = ActorMaterializer()
// needed for the future flatMap/onComplete in the end
implicit val executionContext = system.dispatcher

val route =
  (put & path("lines")) {
    withoutSizeLimit {
      extractDataBytes { bytes =>
        val finishedWriting = bytes.runWith(FileIO.toPath(new File("/tmp/example.out").toPath))

        // we only want to respond once the incoming data has been handled:
        onComplete(finishedWriting) { ioResult =>
          complete("Finished writing data: " + ioResult)
        }
      }
    }
  }
```

**丢弃http响应实体**
```scala
import akka.actor.ActorSystem
import akka.http.scaladsl.server.Directives._
import akka.stream.ActorMaterializer
import akka.http.scaladsl.model.HttpRequest

implicit val system = ActorSystem()
implicit val materializer = ActorMaterializer()
// needed for the future flatMap/onComplete in the end
implicit val executionContext = system.dispatcher

val route =
  (put & path("lines")) {
    withoutSizeLimit {
      extractRequest { r: HttpRequest =>
        val finishedWriting = r.discardEntityBytes().future

        // we only want to respond once the incoming data has been handled:
        onComplete(finishedWriting) { done =>
          complete("Drained all data from connection... (" + done + ")")
        }
      }
    }
  }
```
或者
```scala
import akka.actor.ActorSystem
import akka.stream.scaladsl.Sink
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.model.headers.Connection
import akka.stream.ActorMaterializer

implicit val system = ActorSystem()
implicit val materializer = ActorMaterializer()
// needed for the future flatMap/onComplete in the end
implicit val executionContext = system.dispatcher

val route =
  (put & path("lines")) {
    withoutSizeLimit {
      extractDataBytes { data =>
        // Closing connections, method 1 (eager):
        // we deem this request as illegal, and close the connection right away:
        data.runWith(Sink.cancelled) // "brutally" closes the connection

        // Closing connections, method 2 (graceful):
        // consider draining connection and replying with `Connection: Close` header
        // if you want the client to close after this request/reply cycle instead:
        respondWithHeader(Connection("close"))
        complete(StatusCodes.Forbidden -> "Not allowed!")
      }
    }
  }
```


### 5、低等级服务端API
AkkaHttp提供http服务端的支持，支持以下特性
* 完全支持HTTP持久连接
* 完全支持HTTP流水线
* 完全支持异步HTTP流，包括通过惯用API访问的“分块”传输编码
* 可选的SSL / TLS加密
* WebSocket支持

低级别服务器的作用范围是明确关注HTTP / 1.1服务器的基本功能：
* 连接管理
* 分析和渲染消息和Header
* 超时管理
* 响应排序（用于透明流水线支持）

典型HTTP服务器的所有非核心功能（如请求路由，文件服务，压缩等）都留给较高层

#### （1）流和Http
Akka HTTP服务器是在Streams之上实现的，并且在其实现以及API的所有级别上大量使用它。

在连接级别上，Akka HTTP提供的基本类似于使用流式IO的接口类型：套接字绑定表示为传入连接流。应用程序从这个流源获取连接，并为它们中的每一个提供Flow [HttpRequest，HttpResponse，_]来将请求“翻译”成响应。

除了在服务器端将一个套接字绑定为Source [IncomingConnection]并将每个连接作为Source [HttpRequest]与一个Sink [HttpResponse]之外，流抽象也存在于单个HTTP消息中：HTTP请求和响应的实体通常被建模为Source[ByteString]。


#### （2）启动、处理和停止
在最基本的层次上，Akka HTTP服务器通过调用akka.http.scaladsl.Http扩展的bind方法来绑定：
总是输出Hello World
```scala
package com.lightbend.akka.sample.http

import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import akka.http.scaladsl.model.{ContentTypes, HttpEntity, HttpResponse}
import akka.stream.ActorMaterializer
import akka.stream.scaladsl._

import scala.concurrent.Future

object LowLevelServerSideAPITest extends App {
	implicit val system = ActorSystem()
	implicit val materializer = ActorMaterializer()
	implicit val executionContext = system.dispatcher

	//创建一个Http流
	val serverSource: Source[Http.IncomingConnection, Future[Http.ServerBinding]] =
		Http().bind(interface = "localhost", port = 8080)

	//对流进行处理
	val bindingFuture: Future[Http.ServerBinding] =
		serverSource.to(Sink.foreach { connection => // foreach materializes the source
			println("Accepted new connection from " + connection.remoteAddress)
			// ... and then a       ctually handle the connection
			val response = HttpResponse(entity = HttpEntity(ContentTypes.`text/html(UTF-8)`,"<html><body>Hello world!</body></html>"))
			connection.handleWithSyncHandler (_ => response)
		}).run()
}

```

#### （3）处理低级API中的HTTP服务器失败
```scala
import akka.actor.ActorSystem
import akka.actor.ActorRef
import akka.http.scaladsl.Http
import akka.stream.ActorMaterializer
import akka.stream.scaladsl.Flow

implicit val system = ActorSystem()
implicit val materializer = ActorMaterializer()
implicit val executionContext = system.dispatcher

import Http._
val (host, port) = ("localhost", 8080)
val serverSource = Http().bind(host, port)

val failureMonitor: ActorRef = system.actorOf(MyExampleMonitoringActor.props)

val reactToTopLevelFailures = Flow[IncomingConnection]
  .watchTermination()((_, termination) => termination.failed.foreach {
    cause => failureMonitor ! cause
  })

serverSource
  .via(reactToTopLevelFailures)
  .to(handleConnections) // Sink[Http.IncomingConnection, _]
  .run()
```

连接失败
```scala
import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import akka.http.scaladsl.model._
import akka.stream.ActorMaterializer
import akka.stream.scaladsl.Flow

implicit val system = ActorSystem()
implicit val materializer = ActorMaterializer()
implicit val executionContext = system.dispatcher

val (host, port) = ("localhost", 8080)
val serverSource = Http().bind(host, port)

val reactToConnectionFailure = Flow[HttpRequest]
  .recover[HttpRequest] {
    case ex =>
      // handle the failure somehow
      throw ex
  }

val httpEcho = Flow[HttpRequest]
  .via(reactToConnectionFailure)
  .map { request =>
    // simple streaming (!) "echo" response:
    HttpResponse(entity = HttpEntity(ContentTypes.`text/plain(UTF-8)`, request.entity.dataBytes))
  }

serverSource
  .runForeach { con =>
    con.handleWith(httpEcho)
  }
```

### 6、高级别服务端API
#### （1）几个例子
参见[1、介绍](#1、介绍)


#### （2）Routing DSL
**定义位置**：`import akka.http.scaladsl.server.Directives._`

**常用例子**
```scala
	//路由匹配
	val route =
		pathSingleSlash { //匹配主页或者单斜杠：""或者"/"
			get {
				complete(HttpEntity(ContentTypes.`text/html(UTF-8)`, "<h1>主页</h1>")) //返回普通字符串
			}
	 	} ~
		path("hello") { // "hello"
			path("1"){ //永远不能执行
				complete(HttpEntity(ContentTypes.`text/html(UTF-8)`, "/hello/1")) //返回普通字符串
			} ~
			get {
				complete(HttpEntity(ContentTypes.`text/html(UTF-8)`, "/hello"))
			}

		} ~
		pathPrefix("user"){ // "user*"
			path("1"){ //匹配："1"
				complete(HttpEntity(ContentTypes.`text/html(UTF-8)`, "/user/1")) //返回普通字符串
			} ~
			path("add"){ 
				//可以获取get查询
				parameter('name.as[String], 'password.as[String], 'id.as[Int]){ (a,b,c) =>
					complete("信息为" + a + b + c)
				}
			} ~
			get { //匹配其他
				complete(HttpEntity(ContentTypes.`text/html(UTF-8)`, "/user")) //返回普通字符串
			}
		} 
```

**路由树**
```scala
val route =
  a {
    b {
      c {
        ... // route 1
      } ~
      d {
        ... // route 2
      } ~
      ... // route 3
    } ~
    e {
      ... // route 4
    }
  }
```
* 只有在指令a，b和c都让请求通过的情况下才能到达路由1。
* 如果a和b通过，c拒绝和d通过，则路线2将运行。
* 如果a和b通过，则路线3将运行，但c和d拒绝。



#### （3）指令
**基本结构**
```scala
name(arguments) { extractions =>
  ... // inner route
}
```
例如
```scala
	val route1 =
		path("hello"){
			get{
				complete("hello")
			}
		}
```
解构
```scala
//同时查看源码
	val directive1:Directive[Unit] = path("hello")
	val directive2:Directive[Unit] = get
	val directive3:Route = complete("hello")
	val route2 = directive1(directive2(directive3))
```

**指令能做什么**
* 将传入的RequestContext转换到其内部路由之前转换（即修改请求）
* 根据某些逻辑过滤RequestContext，即只传递某些请求并拒绝其他请求
* 从RequestContext中提取值并将其作为“提取”提供给其内部路由
* 将一些逻辑链接到RouteResult未来的转换链中（即修改响应或拒绝）
* 完成请求

这意味着一个指令完全包装了其内部路由的功能，并可以在请求和响应端应用任意复杂的转换（或两者）

**编写指令**
```scala
	//编写指令
	// 指令类型Directive内置了 `/`， `/ IntNumber` 转换为数字 类似的对象还有Remaining LongNumber
	// ~ 表示两个路由连接到一起
	val route3: Route =
		path("order" / IntNumber) { id =>
			get {
				complete {
					"Received GET request for order " + id
				}
			} ~
			  put {
				  complete {
					  "Received PUT request for order " + id
				  }
			  }
		}

	def innerRoute(id: Int): Route =
		get {
			complete {
				"Received GET request for order " + id
			}
		} ~
		  put {
			  complete {
				  "Received PUT request for order " + id
			  }
		  }


	// 指令类型Directive内置了 `|`操作符，表示为或者
	val route4 = path("order" / IntNumber) { id =>
		(get | put) { ctx =>
			ctx.complete(s"Received ${ctx.request.method.name} request for order $id")
		}
	}

	val getOrPut = get | put
	val route5 =
		path("order" / IntNumber) { id =>
			getOrPut {
				extractMethod { m =>
					complete(s"Received ${m.name} request for order $id")
				}
			}
		}

	// 指令类型Directive内置了 `&`操作符，表示为且
	// extractMethod将返回一个Directive1[HttpMethod]的对象，可以捕捉到HttpMethod对象
	val route6 =
		(path("order" / IntNumber) & getOrPut & extractMethod) { (id, m) =>
			complete(s"Received ${m.name} request for order $id")
		}

	val orderGetOrPutWithMethod =
		path("order" / IntNumber) & (get | put) & extractMethod
	val route7 =
		orderGetOrPutWithMethod { (id, m) =>
			complete(s"Received ${m.name} request for order $id")
		}


	//concat 等价于~
	def innerRoute2(id: Int): Route =
		concat(get {
			complete {
				"Received GET request for order " + id
			}
		},
			put {
				complete {
					"Received PUT request for order " + id
				}
			})

	val route7: Route = path("order" / IntNumber) { id => innerRoute(id) }
	
	val route8: Route = path("order" / IntNumber) { id => innerRoute(id) }


	val route9 = path("test"){
		parameter('orderId.as[Int], 'other.as[Int]) { (orderId, other) =>
			complete("订单Id" + orderId)
		}
	}

```

**指令是类型安全**
可以在编译器指出错误
```scala
	val route9 = path("order" / IntNumber) | get // doesn't compile
	val route = path("order" / IntNumber) | path("order" / DoubleNumber)   // doesn't compile
	val route = path("order" / IntNumber) | parameter('order.as[Int])      // ok
	val order = path("order" / IntNumber) & parameters('oem, 'expired ?)
	val route =
		order { (orderId, oem, expired) =>
			...
		}
```

**自动元组提取（展平）**
```scala
val futureOfTuple2: Future[Tuple2[Int,Int]] = Future.successful( (1,2) )
val route =
  path("success") {
    onSuccess(futureOfTuple2) { //: Directive[Tuple2[Int,Int]]
      (i, j) => complete("Future was completed.")
    }
  }
```


**常用指令总结**
* 产生指令的方法
	* `path`、`pathPrefix`、内部使用 `/ IntNumber`等
	* `get`、`post`、`put`等http方法过滤
	* `parameter`等方法可以获取到get请求参数
	* `formField`等方法对form表单进行处理
	* `headerValueByName` 获取请求头
	* 其他请查看位于`import akka.http.scaladsl.server.directives`源码
* 所有指令只要类型参数数目和类型相同均可以使用如下操作符
	* `|` 或
	* `&` 且
* 对于Route可以使用以下操作符
	* `~` 连接多个路由


其他内置指令文档[参见1](https://doc.akka.io/docs/akka-http/current/scala/http/routing-dsl/directives/alphabetically.html)、[参见2](https://doc.akka.io/docs/akka-http/current/scala/http/routing-dsl/directives/by-trait.html)

**自定义指令**
[参见](https://doc.akka.io/docs/akka-http/current/scala/http/routing-dsl/directives/custom-directives.html)


#### （4）拒收
拒收含有失配的意思，表示当前路由失配，可能会继续执行其他路由路径

**拒绝处理**
一个例子
```scala
package com.lightbend.akka.sample.http

import akka.actor.ActorSystem
import akka.http.scaladsl.Http
import akka.http.scaladsl.model.StatusCodes._
import akka.http.scaladsl.model.{ContentTypes, HttpEntity, HttpResponse, StatusCodes}
import akka.http.scaladsl.server.Directives.{complete, get, path, _}
import akka.http.scaladsl.server._
import akka.stream.ActorMaterializer

import scala.concurrent.ExecutionContextExecutor
import scala.io.StdIn

object RejectionsTest extends App {

	implicit def myRejectionHandler =
		RejectionHandler.newBuilder()
		  .handle { case MissingCookieRejection(cookieName) =>
			  complete(HttpResponse(BadRequest, entity = s"没有 `${cookieName}` cookies, 无法提供服务!!!"))
		  }
		  .handle { case AuthorizationFailedRejection =>
			  complete((Forbidden, "AuthorizationFailedRejection"))
		  }
		  .handle { case ValidationRejection(msg, _) =>
			  complete((InternalServerError, "That wasn't valid! " + msg))
		  }
		  .handleAll[MethodRejection] { methodRejections =>
			val names = methodRejections.map(_.supported.name)
			complete((MethodNotAllowed, s"Can't do that! Supported: ${names mkString " or "}!"))
		}
		  .handleNotFound { complete((NotFound, "页面不存在")) }
		  .result()

	//需要用到隐式值
	implicit val system:ActorSystem = ActorSystem("my-system")
	implicit val materializer:ActorMaterializer = ActorMaterializer()
	// future需要的 执行上下文
	implicit val executionContext: ExecutionContextExecutor = system.dispatcher

	//路由匹配
	val route1 =
		pathSingleSlash { //路径匹配
			get { //http方法匹配
				complete(HttpEntity(ContentTypes.`text/html(UTF-8)`, "<h1>首页</h1>"))
			}
		} ~
		path("missingCookie") { ctx =>
			ctx.reject(MissingCookieRejection("sessionid"))
		}

	//创建绑定端口、ip的Future
	val bindingFuture = Http().bindAndHandle(route1, "localhost", 8080)

	println(s"Server online at http://localhost:8080/\nPress RETURN to stop...")
	StdIn.readLine() // let it run until user presses return
	bindingFuture
	  .flatMap(_.unbind()) // trigger unbinding from the port
	  .onComplete(_ => system.terminate()) // and shutdown when done
}
```

**说明**
* 访问`/`， 返回正常
* 访问`/fadsfads`，返回 `页面不存在`
* 访问`/missingCookie`，返回 `没有 sessionid cookies, 无法提供服务!!!`

**处理对拒绝响应做处理**
在`implicit def myRejectionHandler`函数最后添加
```scala
	implicit def myRejectionHandler =
//....省略
		  //将所有拒绝响应转换为正常200，json格式
		  .mapRejectionResponse {
			  case res @ HttpResponse(_, _, ent: HttpEntity.Strict, _) =>
				  // since all Akka default rejection responses are Strict this will handle all rejections
				  val message = ent.data.utf8String.replaceAll("\"", """\"""")

				  // we copy the response in order to keep all headers and status code, wrapping the message as hand rolled JSON
				  // you could the entity using your favourite marshalling library (e.g. spray json or anything else)
				  res.copy(status = OK, entity = HttpEntity(ContentTypes.`application/json`, s"""{"rejection": "$message"}"""))

			  case x => x // pass through all other types of responses
		  }
```

此时请求`/fadsfads`将返回200
```json
{"rejection": "页面不存在"}
```

#### （5）异常处理
异常的处理类似于拒绝的处理
```scala
//通过隐式转换
implicit def myExceptionHandler: ExceptionHandler =
  ExceptionHandler {
    case _: ArithmeticException =>
      extractUri { uri =>
        println(s"Request to $uri could not be handled normally")
        complete(HttpResponse(InternalServerError, entity = "Bad numbers, bad result!!!"))
      }
  }
	
val router2 = path("ArithmeticException"){
			throw new ArithmeticException
		}
		
		
//使用路由
val myExceptionHandler = ExceptionHandler {
  case _: ArithmeticException =>
    extractUri { uri =>
      println(s"Request to $uri could not be handled normally")
      complete(HttpResponse(InternalServerError, entity = "Bad numbers, bad result!!!"))
    }
}


  val route: Route =
    handleExceptions(myExceptionHandler) {
      // ... some route structure
      null // hide
    }
```
请求`/ArithmeticException` 返回 `Bad numbers, bad result!!!`


#### （6）提取case class
方式1：手动拼接
```scala
case class Color(red: Int, green: Int, blue: Int)

val route =
  path("color") {
    parameters('red.as[Int], 'green.as[Int], 'blue.as[Int]) { (red, green, blue) =>
      val color = Color(red, green, blue)
      // ... route working with the `color` instance
      null // hide
    }
  }
Get("/color?red=1&green=2&blue=3") ~> route ~> check { responseAs[String] shouldEqual "Color(1,2,3)" } // hide
```

手动提取+自动构造
```scala
case class Color(red: Int, green: Int, blue: Int)

val route =
  path("color") {
    parameters('red.as[Int], 'green.as[Int], 'blue.as[Int]).as(Color) { color =>
      // ... route working with the `color` instance
      null // hide
    }
  }
Get("/color?red=1&green=2&blue=3") ~> route ~> check { responseAs[String] shouldEqual "Color(1,2,3)" } // hide

//还有其他参数
case class Color(name: String, red: Int, green: Int, blue: Int)

val route =
  (path("color" / Segment) & parameters('r.as[Int], 'g.as[Int], 'b.as[Int]))
    .as(Color) { color =>
      // ... route working with the `color` instance
      null // hide
    }
Get("/color/abc?r=1&g=2&b=3") ~> route ~> check { responseAs[String] shouldEqual "Color(abc,1,2,3)" } // hide
```

**参数验证**
```scala
case class Color(name: String, red: Int, green: Int, blue: Int) {
  require(!name.isEmpty, "color name must not be empty")
  require(0 <= red && red <= 255, "red color component must be between 0 and 255")
  require(0 <= green && green <= 255, "green color component must be between 0 and 255")
  require(0 <= blue && blue <= 255, "blue color component must be between 0 and 255")
}
```
