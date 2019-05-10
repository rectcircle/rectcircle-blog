---
title: scala akka http（二）
date: 2017-11-19T21:35:52+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/118
  - /detail/118/
tags:
  - scala
---

## 五、http

***

### 6、高级别服务端API

#### （7）Source Streaming

**以json流为例**

```scala
package com.lightbend.akka.sample.http

import org.scalatest.{Matchers, WordSpec}
import akka.http.scaladsl.model.{MediaRange, MediaTypes, StatusCodes}
import akka.http.scaladsl.testkit.ScalatestRouteTest
import akka.http.scaladsl.server._
import Directives._
import akka.NotUsed
import akka.http.scaladsl.common.{EntityStreamingSupport, JsonEntityStreamingSupport}
import akka.http.scaladsl.model.headers.Accept
import akka.stream.scaladsl.Source

class SourceStreamingTest extends WordSpec with Matchers with ScalatestRouteTest {

	//创建实体
	case class Tweet(uid: Int, txt: String)

	//创建json解析器
	object MyJsonProtocol
	  extends akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport
		with spray.json.DefaultJsonProtocol {
		implicit val tweetFormat = jsonFormat2(Tweet.apply)
	}

	//获取测试数据源
	def getTweets = Source(List(
		Tweet(1, "#Akka rocks!"),
		Tweet(2, "Streaming is so hot right now!"),
		Tweet(3, "You cannot enter the same river twice.")))

	// [1] 导入对象json序列化器
	import MyJsonProtocol._

	// [2] 添加json流支持
	// 注意默认渲染成json数组
	implicit val jsonStreamingSupport: JsonEntityStreamingSupport = EntityStreamingSupport.json()

	val route =
		path("tweets") {
			// [3] 完成请求，返回数据源
			val tweets: Source[Tweet, NotUsed] = getTweets
			complete(tweets)
		}

	// tests ------------------------------------------------------------
	val AcceptJson = Accept(MediaRange(MediaTypes.`application/json`))

	"The service" should {

		"return 一个 json数组" in {
			Get("/tweets").withHeaders(AcceptJson) ~> route ~> check {
				responseAs[String] shouldEqual
				  """[""" +
					"""{"uid":1,"txt":"#Akka rocks!"},""" +
					"""{"uid":2,"txt":"Streaming is so hot right now!"},""" +
					"""{"uid":3,"txt":"You cannot enter the same river twice."}""" +
					"""]"""
			}
		}
	}
}
```

**自定义流渲染器**

```scala
import MyJsonProtocol._

// Configure the EntityStreamingSupport to render the elements as:
// {"example":42}
// {"example":43}
// ...
// {"example":1000}
val start = ByteString.empty
val sep = ByteString("\n")
val end = ByteString.empty

implicit val jsonStreamingSupport = EntityStreamingSupport.json()
  .withFramingRenderer(Flow[ByteString].intersperse(start, sep, end))

val route =
  path("tweets") {
    // [3] simply complete a request with a source of tweets:
    val tweets: Source[Tweet, NotUsed] = getTweets
    complete(tweets)
  }

// tests ------------------------------------------------------------
val AcceptJson = Accept(MediaRange(MediaTypes.`application/json`))

Get("/tweets").withHeaders(AcceptJson) ~> route ~> check {
  responseAs[String] shouldEqual
    """{"uid":1,"txt":"#Akka rocks!"}""" + "\n" +
    """{"uid":2,"txt":"Streaming is so hot right now!"}""" + "\n" +
    """{"uid":3,"txt":"You cannot enter the same river twice."}"""
}
```

**json流渲染配置**

```scala
import MyJsonProtocol._
implicit val jsonStreamingSupport: JsonEntityStreamingSupport =
  EntityStreamingSupport.json()
    .withParallelMarshalling(parallelism = 8, unordered = false)

path("tweets") {
  val tweets: Source[Tweet, NotUsed] = getTweets
  complete(tweets)
}
```

**例子二：解析json流**

用户上传json数组

```scala
	case class Measurement(id: String, value: Int)

	object MyJsonProtocol
	  extends akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport
		with spray.json.DefaultJsonProtocol {
		//....
		implicit val measurementFormat = jsonFormat2(Measurement.apply)
	}

	val route1 =
		path("metrics") {
			// [3] extract Source[Measurement, _]
			entity(asSourceOf[Measurement]) { measurements =>
				// alternative syntax:
				// entity(as[Source[Measurement, NotUsed]]) { measurements =>
				val measurementsSubmitted: Future[Int] =
					measurements
					  .via(persistMetrics)
					  .runFold(0) { (cnt, _) => cnt + 1 }

				complete {
					measurementsSubmitted.map(n => Map("msg" -> s"""Total metrics received: $n"""))
				}
			}
		}

//测试
				"解析json流请求体" in {
			val data = HttpEntity(
				ContentTypes.`application/json`,
				"""
				  |{"id":"temp","value":32}
				  |{"id":"temp","value":31}
				  |
                """.stripMargin)

			Post("/metrics",  data) ~> route1 ~> check {
				status should ===(StatusCodes.OK)
				responseAs[String] should ===("""{"msg":"Total metrics received: 2"}""")
			}

```

#### （8）路由测试

**引入依赖**

```scala
"com.typesafe.akka" %% "akka-http-testkit" % "10.0.10"
```

**基本例子**

```scala
package com.lightbend.akka.sample.http

import org.scalatest.{ Matchers, WordSpec }
import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.testkit.ScalatestRouteTest
import akka.http.scaladsl.server._
import Directives._

class RouteTest  extends WordSpec with Matchers with ScalatestRouteTest {

	//创建路由
	val smallRoute =
		get {
			pathSingleSlash {
				complete {
					"Captain on the bridge!"
				}
			} ~
			  path("ping") {
				  complete("PONG!")
			  }
		}

	"The service" should {

		"return a greeting for GET requests to the root path" in {
			// tests:
			Get() ~> smallRoute ~> check {
				responseAs[String] shouldEqual "Captain on the bridge!"
			}
		}

		"return a 'PONG!' response for GET requests to /ping" in {
			// tests:
			Get("/ping") ~> smallRoute ~> check {
				responseAs[String] shouldEqual "PONG!"
			}
		}

		"leave GET requests to other paths unhandled" in {
			// tests:
			Get("/kermit") ~> smallRoute ~> check {
				handled shouldBe false
			}
		}

		"return a MethodNotAllowed error for PUT requests to the root path" in {
			// tests:
			Put() ~> Route.seal(smallRoute) ~> check {
				status shouldEqual StatusCodes.MethodNotAllowed
				responseAs[String] shouldEqual "HTTP method not allowed, supported methods: GET"
			}
		}
	}
}
```

**基本结构**

```scala
REQUEST ~> ROUTE ~> check {
  ASSERTIONS
}
```

[其他参见](https://doc.akka.io/docs/akka-http/current/scala/http/routing-dsl/testkit.html)

#### （9）http应用Bootstrap

akkahttp的入口，**实验性特性**

**最小化的例子**

```scala
package com.lightbend.akka.sample.http

import akka.http.scaladsl.model.{ ContentTypes, HttpEntity }
import akka.http.scaladsl.server.HttpApp
import akka.http.scaladsl.server.Route

object WebServer1 extends App {
	// Server definition
	object WebServer extends HttpApp {
		override def routes: Route =
			path("hello") {
				get {
					complete(HttpEntity(ContentTypes.`text/html(UTF-8)`, "<h1>Say hello to akka-http</h1>"))
				}
			}
	}

	// Starting the server
	WebServer.startServer("localhost", 8080)
}
```

**端口绑定失败的回调**

```scala
object WebServer extends HttpApp {
//...
  override protected def postHttpBindingFailure(cause: Throwable): Unit = {
    println(s"The server could not be started due to $cause")
  }
}
```

**提供您自己的服务器设置**

```scala
// Creating own settings
val settings = ServerSettings(ConfigFactory.load).withVerboseErrorMessages(true)
WebServer.startServer("localhost", 8080, settings)
```

**提供您自己的Actor系统**

```scala
val system = ActorSystem("ownActorSystem")
WebServer.startServer("localhost", 8080, system)
system.terminate()
```

**提供您自己的Actor系统和设置**

```scala
val system = ActorSystem("ownActorSystem")
val settings = ServerSettings(ConfigFactory.load).withVerboseErrorMessages(true)
WebServer.startServer("localhost", 8080, settings, system)
system.terminate()
```

**重写服务器中止信号**

```scala
object WebServer extends HttpApp {
//...
  override def waitForShutdownSignal(actorSystem: ActorSystem)(implicit executionContext: ExecutionContext): Future[Done] = {
    pattern.after(5 seconds, actorSystem.scheduler)(Future.successful(Done))
  }
}
```

**获取服务器关闭的通知**

```scala
object WebServer extends HttpApp {
//...
  override def postServerShutdown(attempt: Try[Done], system: ActorSystem): Unit = {
    cleanUpResources()
  }
}
```

### 7、服务端WebSocket支持

WebSocket是一种在浏览器和Web服务器之间提供双向通道的协议，通常通过升级的HTTP（S）连接来运行。数据通过消息交换，消息可以是二进制数据或Unicode文本。

Akka HTTP提供了一个基于流的WebSocket协议实现，隐藏底层二进制框架有线协议的底层细节，并提供一个简单的API来实现使用WebSocket的服务。

#### （1）模型

WebSocket协议中的基本数据交换单元是一个消息。消息可以是二进制消息，即八位字节序列或文本消息，即一个Unicode代码点序列。

在数据模型中，两种消息（二进制和文本消息）由来自公共超类消息的两个类BinaryMessage和TextMessage表示。BinaryMessage和TextMessage子类包含访问数据的方法。以TextMessage的API为例（BinaryMessage与ByteString替换的String非常相似）：

#### （2）低级api使用示例

```scala
		import akka.actor.ActorSystem
		import akka.http.scaladsl.Http
		import akka.http.scaladsl.model.HttpMethods._
		import akka.http.scaladsl.model.ws.{Message, TextMessage, UpgradeToWebSocket}
		import akka.http.scaladsl.model.{HttpRequest, HttpResponse, Uri}
		import akka.stream.ActorMaterializer
		import akka.stream.scaladsl.{Flow, Source}

		implicit val system = ActorSystem()
		implicit val materializer = ActorMaterializer()

		//#websocket-handler
		// The Greeter WebSocket Service expects a "name" per message and
		// returns a greeting message for that name
		val greeterWebSocketService =
		Flow[Message]
		  .mapConcat {
			  // we match but don't actually consume the text message here,
			  // rather we simply stream it back as the tail of the response
			  // this means we might start sending the response even before the
			  // end of the incoming message has been received
			  case tm: TextMessage => TextMessage(Source.single("Hello ") ++ tm.textStream) :: Nil
			  case bm: BinaryMessage =>
				  // ignore binary messages but drain content to avoid the stream being clogged
				  bm.dataStream.runWith(Sink.ignore)
				  Nil
		  }
		//#websocket-handler

		//#websocket-request-handling
		val requestHandler: HttpRequest => HttpResponse = {
			case req @ HttpRequest(GET, Uri.Path("/greeter"), _, _, _) =>
				req.header[UpgradeToWebSocket] match {
					case Some(upgrade) => upgrade.handleMessages(greeterWebSocketService)
					case None          => HttpResponse(400, entity = "Not a valid websocket request!")
				}
			case r: HttpRequest =>
				r.discardEntityBytes() // important to drain incoming HTTP Entity stream
				HttpResponse(404, entity = "Unknown resource!")
		}
		//#websocket-request-handling

		val bindingFuture =
			Http().bindAndHandleSync(requestHandler, interface = "localhost", port = 8080)

		println(s"Server online at http://localhost:8080/\nPress RETURN to stop...")
		StdIn.readLine()

		// future需要的 执行上下文
		implicit val executionContext: ExecutionContextExecutor = system.dispatcher
		bindingFuture
		  .flatMap(_.unbind())(executionContext) // trigger unbinding from the port
		  .onComplete(_ => system.terminate())(executionContext) // and shutdown when done
```

#### （3）高级api使用示例

路由支持

```scala
package com.lightbend.akka.sample.http

import akka.http.scaladsl.model.ws.BinaryMessage
import akka.http.scaladsl.testkit.{ScalatestRouteTest, WSProbe}
import akka.util.ByteString
import org.scalatest.{Matchers, WordSpec}

import scala.concurrent.duration._

class WebSocketExampleSpec extends WordSpec with Matchers with ScalatestRouteTest {
	"routing-example" in {
		import akka.actor.ActorSystem
		import akka.http.scaladsl.model.ws.{Message, TextMessage}
		import akka.http.scaladsl.server.Directives
		import akka.stream.ActorMaterializer
		import akka.stream.scaladsl.{Flow, Source}

		implicit val system = ActorSystem()
		implicit val materializer = ActorMaterializer()

		import Directives._

		// The Greeter WebSocket Service expects a "name" per message and
		// returns a greeting message for that name
		val greeterWebSocketService =
		Flow[Message]
		  .collect {
			  case tm: TextMessage => TextMessage(Source.single("Hello ") ++ tm.textStream ++ Source.single("!"))
			  // ignore binary messages
			  // TODO #20096 in case a Streamed message comes in, we should runWith(Sink.ignore) its data
		  }

		//#websocket-routing
		val route =
			path("greeter") {
				get {
					handleWebSocketMessages(greeterWebSocketService)
				}
			}
		//#websocket-routing

		// tests:
		// create a testing probe representing the client-side
		val wsClient = WSProbe()

		// WS creates a WebSocket request for testing
		WS("/greeter", wsClient.flow) ~> route ~>
		  check {
			  // check response for WS Upgrade headers
			  isWebSocketUpgrade shouldEqual true

			  // manually run a WS conversation
			  wsClient.sendMessage("Peter")
			  wsClient.expectMessage("Hello Peter!")

			  wsClient.sendMessage(BinaryMessage(ByteString("abcdef")))
			  wsClient.expectNoMessage(100.millis)

			  wsClient.sendMessage("John")
			  wsClient.expectMessage("Hello John!")

			  wsClient.sendCompletion()
			  wsClient.expectCompletion()
		  }

	}
}
```

### 8、服务端https支持

Akka HTTP支持服务器端和客户端的TLS加密。

配置加密的核心工具是HttpsConnectionContext，它可以使用静态方法ConnectionContext.https来创建，定义如下：

```scala
// ConnectionContext
def https(
  sslContext:          SSLContext,
  sslConfig:           Option[AkkaSSLConfig]         = None,
  enabledCipherSuites: Option[immutable.Seq[String]] = None,
  enabledProtocols:    Option[immutable.Seq[String]] = None,
  clientAuth:          Option[TLSClientAuth]         = None,
  sslParameters:       Option[SSLParameters]         = None) =
  new HttpsConnectionContext(sslContext, sslConfig, enabledCipherSuites, enabledProtocols, clientAuth, sslParameters)
```

在服务器端，akka.http.scaladsl.Http扩展的bind和bindAndHandleXXX方法定义一个可选的httpsContext参数，该参数可以以HttpsContext实例的形式接收HTTPS配置。如果在所有接受的连接上启用了定义的加密。否则它被禁用（这是默认的）。

#### （1）SSL配置

Akka HTTP严重依赖并将任何SSL / TLS相关选项的大多数配置委托给Lightbend SSL-Config，Lightbend SSL-Config是专门提供默认安全的SSLContext和相关选项的库。

有关所有可用设置的详细文档，请参阅[Lightbend SSL-Config](http://typesafehub.github.io/ssl-config/)文档。

Akka HTTP（以及Streaming TCP）使用的SSL配置设置位于akka.ssl-config命名空间下。

为了在Akka中使用SSL-Config，所以它记录到正确的ActorSystem-wise记录器等，AkkaSSLConfig扩展提供。获得它如下简单：

```scala
implicit val system = ActorSystem()
val sslConfig = AkkaSSLConfig()
```

典型的用法，例如配置http客户端设置将通过在application.conf中配置ssl-config来全局应用，可以在修改任何可能需要更改的配置时获取扩展并将其复制，然后在建立连接时使用特定的AkkaSSLConfig实例，而不必在客户端或服务器端进行连接。

#### （2）获取SSL / TLS证书

为了运行HTTPS服务器，必须提供一个证书，通常是从签名机构获取证书或者为了本地或分段环境的目的而自己创建证书。

签名机构通常会提供有关如何创建Java密钥库（通常参考Tomcat配置）的说明。如果要生成自己的证书，可以在[此处](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/keytool.html)找到有关如何使用JDK keytool实用程序生成密钥库的官方Oracle文档。

SSL-Config为生成证书提供了更具针对性的指南，因此我们建议您从[生成X.509证书的](http://typesafehub.github.io/ssl-config/CertificateGeneration.html)指南开始。

#### （3）使用https

一旦你获得了服务器证书，使用它就像准备一个HttpsConnectionContext一样简单，并将其设置为由给定的Http扩展启动的所有服务器使用的缺省值，或者在绑定服务器时显式传递它。

以下示例显示了如何设置HTTPS的工作原理。首先，创建并配置一个HttpsConnectionContext实例：

```scala
import java.io.InputStream
import java.security.{ SecureRandom, KeyStore }
import javax.net.ssl.{ SSLContext, TrustManagerFactory, KeyManagerFactory }

import akka.actor.ActorSystem
import akka.http.scaladsl.server.{ Route, Directives }
import akka.http.scaladsl.{ ConnectionContext, HttpsConnectionContext, Http }
import akka.stream.ActorMaterializer
import com.typesafe.sslconfig.akka.AkkaSSLConfig
implicit val system = ActorSystem()
implicit val mat = ActorMaterializer()
implicit val dispatcher = system.dispatcher

// Manual HTTPS configuration

val password: Array[Char] = "change me".toCharArray // do not store passwords in code, read them from somewhere safe!

val ks: KeyStore = KeyStore.getInstance("PKCS12")
val keystore: InputStream = getClass.getClassLoader.getResourceAsStream("server.p12")

require(keystore != null, "Keystore required!")
ks.load(keystore, password)

val keyManagerFactory: KeyManagerFactory = KeyManagerFactory.getInstance("SunX509")
keyManagerFactory.init(ks, password)

val tmf: TrustManagerFactory = TrustManagerFactory.getInstance("SunX509")
tmf.init(ks)

val sslContext: SSLContext = SSLContext.getInstance("TLS")
sslContext.init(keyManagerFactory.getKeyManagers, tmf.getTrustManagers, new SecureRandom)
val https: HttpsConnectionContext = ConnectionContext.https(sslContext)
```

一旦配置了HTTPS上下文，就可以将其设置为默认值：

```scala
// sets default context to HTTPS – all Http() bound servers for this ActorSystem will use HTTPS from now on
Http().setDefaultServerHttpContext(https)
Http().bindAndHandle(routes, "127.0.0.1", 9090, connectionContext = https)
```

还可以将上下文传递给特定的`bind...`（或客户端）调用，如下所示：

```scala
Http().bind("127.0.0.1", connectionContext = https)

// or using the high level routing DSL:
val routes: Route = get { complete("Hello world!") }
Http().bindAndHandle(routes, "127.0.0.1", 8080, connectionContext = https)
```

#### （4）同时运行http和https

如果要在单个应用程序中运行HTTP和HTTPS服务器，可以两次调用bind ...方法，一个用于HTTPS，另一个用于HTTP。

```scala
// you can run both HTTP and HTTPS in the same application as follows:
val commonRoutes: Route = get { complete("Hello world!") }
Http().bindAndHandle(commonRoutes, "127.0.0.1", 443, connectionContext = https)
Http().bindAndHandle(commonRoutes, "127.0.0.1", 80)
```

#### （5）相互验证、进一步阅读

[参见](https://doc.akka.io/docs/akka-http/10.0.10/scala/http/server-side/server-https-support.html#mutual-authentication)

### 9、服务端http2预览

参见[http2](https://doc.akka.io/docs/akka-http/10.0.10/scala/http/server-side/http2.html)

### 10、Server-Sent Events支持

参见[sse](https://doc.akka.io/docs/akka-http/10.0.10/scala/http/sse-support.html)

### 11、http服务客户端支持

参见[客户端](https://doc.akka.io/docs/akka-http/10.0.10/scala/http/client-side/index.html)

### 12、处理Akka HTTP中的阻塞操作

当处理耗时操作，应该使用独特的线程池，具体参见 [actor](114#4、调度器)结尾
