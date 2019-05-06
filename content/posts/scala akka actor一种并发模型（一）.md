---
title: scala akka actor一种并发模型（一）
date: 2017-11-06T15:11:42+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/112
  - /detail/112/
tags:
  - scala
---

> [官方文档](https://doc.akka.io/docs/akka/current/scala/guide/index.html)
> 2017.11.06
> version 2.5.6

## 目录
* [一、Getting Started Guide](#一、Getting Started Guide)
	* [1、介绍](#1、介绍)
	* [2、为什么现代系统需要一个新的编程模型](#为什么现代系统需要一个新的编程模型)
	* [3、Actor模型如何满足现代分布式系统的需求](#3、Actor模型如何满足现代分布式系统的需求)
	* [4、Akka库和模块概述](#4、Akka库和模块概述)
	* [5、示例介绍](#5、示例介绍)
		* [（1）Akka 快速入门（使用scala） Helloworld项目](#（1）Akka 快速入门（使用scala） Helloworld项目)
		* [（2）另一个例子，实现一个物联网系统](#（2）另一个例子，实现一个物联网系统)
			* [第1部分：Actor架构](#第1部分：Actor架构)
			* [第2部分：创建第一个Actor](#第2部分：创建第一个Actor)
			* [第3部分：Working with Device Actors](#第3部分：Working with Device Actors)
			* [第4部分：使用设备组](#第4部分：使用设备组)
			* [第5部分：查询设备组](113#第5部分：查询设备组)
			* [例子总结](113#例子总结)


## 一、Getting Started Guide
**************************
### 1、介绍
Akka是用于 设计 多核异步和网络分布式可扩展性弹性系统 的开源库。让用户专注于业务不必编写并发控制相关的低级代码

传统的异步编程（基于线程）模型，不能满足高等级的需求，可能出现各种崩溃

Aka提供：
* 多线程不使用原子操作和锁的，甚至不用考虑内存可见性
* 系统及其组件之间远程通信的透明 - 使您免于编写和维护困难的网络代码。
* 一个集群化，高可用性的体系结构，可根据需求进行扩展或扩展，使您能够提供真正的响应式系统。

Akka对actor模型的使用提供了一个抽象层次，使得编写正确的并行和分布式系统变得更加容易。actor适用于整个Akka，并提供了一致的使用方式，因此，Akka提供了一个深度的整合，用户不需要挑选各种库拼凑成一个系统

通过学习Akka以及如何使用actor模型，您将获得大量深入的工具，以统一的编程模型解决困难的分布式/并行系统问题。

### 2、为什么现代系统需要一个新的编程模型
> 参见[Why modern systems need a new programming model](https://doc.akka.io/docs/akka/current/scala/guide/actors-intro.html)

### 3、Actor模型如何满足现代分布式系统的需求
> 参见[How the Actor Model Meets the Needs of Modern, Distributed Systems](https://doc.akka.io/docs/akka/current/scala/guide/actors-intro.html)

#### 4、Akka库和模块概述
> 参见[actor-library](https://doc.akka.io/docs/akka/current/scala/guide/modules.html#actor-library)

Akka OSS（开源软件包）包含以下功能，稍后会在此页面中介绍：
* Actor library 核心库
* Remoting 使actor运行与不同的计算机、进行分布式管理
* Cluster 集群、大多数情况，您想要使用群集模块而不是直接使用Remoting。
* Cluster Sharding 解决在Akka集群成员中分配actor的问题。
* Cluster Singleton 集群单例
* Cluster Publish-Subscribe 集群发布订阅，将消息发给所有节点，订阅的节点进行相应
* Persistence 持久化
* Distributed Data 分布式数据，集群中共享数据
* Streams 流式处理
* HTTP 分布式通讯的是通过http协议，提供http的支持

### 5、示例介绍
#### （1）Akka 快速入门（使用scala） Helloworld项目
**下载例子**
[下载地址](https://developer.lightbend.com/start/?group=akka)

**打开**
使用idea打开项目

**项目说明**
引入模块
```scala
libraryDependencies ++= Seq(
  "com.typesafe.akka" %% "akka-actor" % akkaVersion,
  "com.typesafe.akka" %% "akka-testkit" % akkaVersion,
  "org.scalatest" %% "scalatest" % "3.0.1" % "test"
)
```

这是一个模拟打招呼的例子
```scala
package com.lightbend.akka.sample

import akka.actor.{ Actor, ActorLogging, ActorRef, ActorSystem, Props }
import scala.io.StdIn

// 问候actor 的伴生对象
object Greeter {
  //辅助方法，生成一个Props对象
  def props(message: String, printerActor: ActorRef): Props = Props(new Greeter(message, printerActor))
  //消息对象
  final case class WhoToGreet(who: String)
  case object Greet
}

// 问候actor
class Greeter(message: String, printerActor: ActorRef) extends Actor {
  import Greeter._
  import Printer._

  var greeting = ""

	//处理发送的消息
  def receive = {
    case WhoToGreet(who) => //接收到WhoToGreet消息，设置问候语
      greeting = s"$message, $who"
    case Greet           => //接收到问候的消息，将消息发给打印Actor
      printerActor ! Greeting(greeting)
  }
}


// 打印者actor 伴生对象
object Printer {
  // 辅助初始化函数
  def props: Props = Props[Printer]
  // 问候消息
  final case class Greeting(greeting: String)
}



// 打印者actor
class Printer extends Actor with ActorLogging {
  import Printer._

  def receive = {
    case Greeting(greeting) => //接收到问候的消息，使用日志打印出来
      log.info(s"Greeting received (from ${sender()}): $greeting")
  }
}


//#main-class
object AkkaQuickstart extends App {
  import Greeter._

  // 创建actor系统
  val system: ActorSystem = ActorSystem("helloAkka")

  try {
    // 创建actor实例，并注册到系统中
    // 创建打印者actor
    val printer: ActorRef = system.actorOf(Printer.props, "printerActor")

    // 创建几个问候actor
    val howdyGreeter: ActorRef =
      system.actorOf(Greeter.props("Howdy", printer), "howdyGreeter")
    val helloGreeter: ActorRef =
      system.actorOf(Greeter.props("Hello", printer), "helloGreeter")
    val goodDayGreeter: ActorRef =
      system.actorOf(Greeter.props("Good day", printer), "goodDayGreeter")


    // 发消息
    howdyGreeter ! WhoToGreet("Akka")
    howdyGreeter ! Greet

    howdyGreeter ! WhoToGreet("Lightbend")
    howdyGreeter ! Greet

    helloGreeter ! WhoToGreet("Scala")
    helloGreeter ! Greet

    goodDayGreeter ! WhoToGreet("Play")
    goodDayGreeter ! Greet
    //#main-send-messages

    println(">>> Press ENTER to exit <<<")
    StdIn.readLine()
  } finally {
    system.terminate()
  }
}
```
示意图如下
![](/res/lJLKOTWejKHglmbKaWH2t5mF.png)
![](/res/V3fpFz2nIF_anfq4LQyobXLg.png)

**编程风格**
* 每个actor伴随着一个伴生对象，提供一下内容
	* 提供一些静态方法、如创建Props
	* 提供消息类或者object，便于更好的封装


**使用Actor模型的好处**
* 事件驱动的模型 - 参与者根据消息执行工作。 Actor之间的通信是异步的，允许Actor发送消息并继续自己的工作，而不会阻塞等待答复。
* 强大的隔离原则 - 与Scala中的常规对象不同，Actor没有可调用的方法的公共API。相反，它的公共API是通过actor处理的消息来定义的。这阻止了Actor之间的任何状态共享;观察另一个actor的状态的唯一方法是通过发送一个消息来询问它。
* 位置透明度 - 系统从工厂构造Actors并返回对实例的引用。由于位置无关紧要，因此Actor实例可以启动，停止，移动和重新启动以缩放以及从意外故障中恢复。
* 轻量级 - 每个实例只消耗几百个字节，这实际上允许数百万个并发的Actor存在于一个应用程序中。

#### （2）另一个例子，实现一个物联网系统
在本教程中，我们将使用Akka构建物联网（IoT）系统的一部分，该系统报告来自安装在客户家中的传感器设备的数据。这个例子着重于温度读数。本例的目标是消费者可以登录并查看家中不同位置传感器最后一次报告的温度。你可以想象，这样的传感器也可以收集相对湿度或其他有趣的数据，一个应用程序可能会支持读取和更改设备配置，甚至可能提醒家庭业主，当传感器状态超出特定范围。

在真实的系统中，应用程序将通过移动应用程序或浏览器暴露给客户。 本指南仅关注用于存储将通过网络协议（如HTTP）调用的温度的核心逻辑。 它还包括编写测试，以帮助您测试actor舒适和熟练。

应用程序由两个主要组件组成：
* 设备数据收集： - 维护远程设备的本地表示。家中的多个传感器设备被组织到一个设备组中。
* 用户仪表板： - 定期从设备收集登录用户家中的数据，并将结果作为报告呈现。

下图说明了示例应用程序体系结构。由于我们对每个传感器设备的状态感兴趣，因此我们将设备作为参与者进行建模。
![](/res/ejXYBdOjqKZUD04Qb-eZa45I.png)

构建过程如下5部分

#### 第1部分：Actor架构
**akka actor层次结构**
在akka中，actor总是有一个parent，通常通过`context.actorOf()`创建actor而不是new出来的。这将新的actor作为一个孩子注入已经存在的树中：创建者actor成为新创建的actor的父亲。你可能会问，谁是你创造的第一个演员的parent？

通过`system.actorOf()`创建。

创建一个actor会返回一个`akka://`格式的url路径
例如：`system.actorOf(…, "someActor")`,返回路径为 `/user/someActor`

![](/res/wXfezUOlgeeisWfr3gStj2GJ.png)

实际上，在你创建代码之前，Akka已经在系统中创建了三个Actor。
这些内置的Actor的名字包含监护人，因为他们监督每一个小孩演员的路径。监护人包括：
* `/` 所谓的根监护人。这是系统中所有actor的父亲，系统本身终止时最后一个actor。
* `/user` 监护人。这是所有用户创建的演员的父演员。不要让名称用户迷惑你，它与最终用户无关，也不与用户处理。 使用Akka库创建的每个演员都将拥有固定的路径 `/user/` 前缀。
* `/system` 系统监护人

说明
* 使用`system.actorOf()`创建的actor称之为顶层actor
* 使用`context.actorOf()`创建的actor非顶层actor
* 两者方法签名相同

查看层级结构最简单的方式是打印

在helloworld中创建一个新的文件`com.lightbend.akka.sample.ActorHierarchyExperiments.scala`
```scala
package com.lightbend.akka.sample

import akka.actor.{ Actor, Props, ActorSystem }
import scala.io.StdIn

class PrintMyActorRefActor extends Actor {
  override def receive: Receive = {
    case "printit" =>
      val secondRef = context.actorOf(Props.empty, "second-actor")
      println(s"Second: $secondRef")
  }
}

object ActorHierarchyExperiments extends App {
  val system = ActorSystem("testSystem")

  val firstRef = system.actorOf(Props[PrintMyActorRefActor], "first-actor")
  println(s"First: $firstRef")
  firstRef ! "printit"

  println(">>> Press ENTER to exit <<<")
  try StdIn.readLine()
  finally system.terminate()
}

/* 输出
First: Actor[akka://testSystem/user/first-actor#-366292829]
>>> Press ENTER to exit <<<
Second: Actor[akka://testSystem/user/first-actor/second-actor#-874163146]
*/
```

层次结构的作用：层次结构的一个重要角色是安全地管理演员的生命周期。接下来我们来考虑一下，看看这些知识如何帮助我们编写更好的代码。

**actor的声明周期**
每当一个actor停下来时，他的所有的孩子也都会递归地停下来。这种行为极大地简化了资源清理，并有助于避免由于打开套接字和文件造成的资源泄漏。实际上，在处理低级多线程代码时，一个普遍被忽视的难点是各种并发资源的生命周期管理。

要停止actor，推荐的模式是在内部调用`context.stop(self)`停止自己，通常在接收到停止消息后执行此函数。此外，通过调用`context.stop(actorRef)`来阻止另一个actor，但以这种方式被认为是**不好的做法**：应该使用 `PoisonPill`消息或者自停止 代替

Akka actor API公开了许多生命周期的方法，你可以在一个actor实现中重载。最常用的是`preStart()`和`postStop()`。
* `preStart()` 在第一个消息被处理之前执行
* `postStop()`在停止之前执行

将以下内容添加到`ActorHierarchyExperiments.scala`文件
```scala
class StartStopActor1 extends Actor {
  override def preStart(): Unit = {
    println("first started")
    context.actorOf(Props[StartStopActor2], "second")
  }
  override def postStop(): Unit = println("first stopped")

  override def receive: Receive = {
    case "stop" => context.stop(self)
  }
}

class StartStopActor2 extends Actor {
  override def preStart(): Unit = println("second started")
  override def postStop(): Unit = println("second stopped")

  // Actor.emptyBehavior is a useful placeholder when we don't
  // want to handle any messages in the actor.
  override def receive: Receive = Actor.emptyBehavior
}

//main中添加
val first = system.actorOf(Props[StartStopActor1], "first")
first ! "stop"

/*输出
first started
second started
second stopped
first stopped
*/
```

**失败处理**
父母和孩子在整个生命周期中都有联系。每当一个参与者失败（抛出一个异常或一个未处理的异常从接收中冒出），它就暂时被暂停。如前所述，故障信息传播给父节点，父节点然后决定如何处理由该子节点引起的异常。这样，父母就像他们的孩子一样负责监督。默认的主管策略是停止并重新启动孩子。如果不更改默认策略，则所有失败都会导致重新启动。

让我们在一个简单的实验中观察默认策略。将以下类添加到您的项目`ActorHierarchyExperiments.scala`文件中：
```scala
class SupervisingActor extends Actor {
  val child = context.actorOf(Props[SupervisedActor], "supervised-actor")

  override def receive: Receive = {
    case "failChild" => child ! "fail"
  }
}

class SupervisedActor extends Actor {
  override def preStart(): Unit = println("supervised actor started")
  override def postStop(): Unit = println("supervised actor stopped")

  override def receive: Receive = {
    case "fail" =>
      println("supervised actor fails now")
      throw new Exception("I failed!")
  }
}

//main中添加
val supervisingActor = system.actorOf(Props[SupervisingActor], "supervising-actor")
supervisingActor ! "failChild"

/* 输出
supervised actor started
supervised actor fails now
supervised actor stopped
supervised actor started
first stopped
[ERROR] [11/06/2017 19:53:43.523] [testSystem-akka.actor.default-dispatcher-8] [akka://testSystem/user/supervising-actor/supervised-actor] I failed!
java.lang.Exception: I failed!
	at com.lightbend.akka.sample.SupervisedActor$$anonfun$receive$4.applyOrElse(ActorHierarchyExperiments.scala:51)
	at akka.actor.Actor.aroundReceive(Actor.scala:513)
	at akka.actor.Actor.aroundReceive$(Actor.scala:511)
	..........
*/
```

我们看到，失败后，受监督的演员被停止并立即重新启动。




#### 第2部分：创建第一个Actor
结构设计
![](/res/-OeqsY3oScmO7Jl5bAyEPlwZ.png)
添加`IotSupervisor` 源文件 在 `com.lightbend.akka.sample`包内容如下
```scala
package com.lightbend.akka.sample

import akka.actor.{ Actor, ActorLogging, Props }

object IotSupervisor {
  def props(): Props = Props(new IotSupervisor)
}

class IotSupervisor extends Actor with ActorLogging {
  override def preStart(): Unit = log.info("IoT Application started")
  override def postStop(): Unit = log.info("IoT Application stopped")

  // No need to handle any messages
  override def receive = Actor.emptyBehavior

}
```

添加`IotApp` 源文件 在 `com.lightbend.akka.sample`包内容如下
app入口负责启动
```scala
package com.lightbend.akka.sample

import akka.actor.ActorSystem
import scala.io.StdIn

object IotApp {

	def main(args: Array[String]): Unit = {
		val system = ActorSystem("iot-system")

		try {
			// 创建顶层级别的actor
			val supervisor = system.actorOf(IotSupervisor.props(), "iot-supervisor")
			// 键入回车后退出
			StdIn.readLine()
		} finally {
			system.terminate()
		}
	}

}
```

#### 第3部分：Working with Device Actors
如果是面向对象编程，通常我们将API设计为接口，这是一组抽象方法，由实际的实现来填充。

在Actor的世界中，协议取代了接口。虽然在编程语言中不能形式化（ formalize general protocols ）通用协议，但是我们可以编写它们最基本的元素，即消息。因此，我们将首先确定要发送给设备参与者的消息。

**识别设备的消息**
设备actor的任务很简单：
* 收集温度测量值 
* 当被询问时，报告最后的测量温度

但是，设备可能在启动时不会立即进行温度测量。因此，我们需要考虑温度不存在的情况。这要求我们测试查询时，要考虑到结果为空的情况

从设备Actor获取当前温度的协议很简单：
* 等待当前温度的请求。
* 回应请求，回复如下：
	* 包含当前的温度，
	* 表示温度尚不可用

我们需要两条消息，一条用于请求，另一条用于答复。我们的第一次尝试可能如下所示：
```scala
final case object ReadTemperature
final case class RespondTemperature(value: Option[Double])
```

这两条消息似乎涵盖了所需的功能。但是，我们选择的方法必须考虑到应用程序的分布式特性。虽然本地JVM上的actor进行通信的方式与远程角色进行通信的基本相同，但我们需要牢记以下几点：
* 由于网络链路带宽和消息大小等因素也会发挥作用，因此本地和远程消息之间的传输延迟将有明显的差异。
* 可靠性是一个问题，因为远程消息发送涉及更多的步骤，这意味着更多可能出错。
* 本地发送只会在同一个JVM中传递对消息的引用，而不会对发送的底层对象有任何限制，而远程传输将限制消息大小。

另外，在同一个JVM里面发送显然更可靠，如果一个actor在处理消息时由于程序员错误而失败，那么效果基本上与由于远程主机在处理消息时崩溃而导致远程网络请求失败相同。即使在这两种情况下，服务都会在一段时间后恢复（actor由其supervisor重新启动，host 由操作员或监控系统重新启动），个别请求在崩溃期间丢失。因此在写actor时应该悲观的认为每个消息丢失都应该是安全的。

但为了进一步理解协议中灵活性的需求，将有助于考虑Akka消息排序和消息传递保证。 Akka为消息发送提供以下行为：
* 最多发送一次，也就是说没有保证消息可达性
* 消息发送的顺序是有发送者接受者维护

**消息传递**

消息传递子系统提供的传递语义通常分为以下几类：
* 最多交付一次 - 每个消息传递零次或一次;在更多的因果关系中，这意味着消息可能会丢失，但不会重复。
* 至少一次交付 - 可能多次尝试传递每个消息，直到至少一次成功;再次，更多的因果关系，这意味着消息可以重复，但永远不会丢失。
* 准确的一次交付 - 每封邮件只发送给收件人一次;该消息既不能丢失也不能被复制。

第一种方式，是Akka使用的方式，它是性能最好的。它具有最少的实现开销，因为它可以在发送端或传输机制中保持状态的情况下以“即忘即逝”的方式完成。（类似UDP）
第二种方式，增加了保持发送端的状态和在接收端具有确认机制的开销（类似TCP）
最后一种是最昂贵的（效率最低）除了由至少一次交付添加的开销之外，它还要求将状态保存在接收端以便过滤掉重复的交付

In an actor system, we need to determine exact meaning of a guarantee — at which point does the system consider the delivery as accomplished:

在actor系统中，我们需要保证 - 系统在哪一节点上认为交付已经完成：
* 当消息在网络上发送出去？
* 当消息被目标actor的host收到时？
* 当消息被放入目标actor的“邮箱”？
* 当消息目标开始处理消息？
* 当目标actor成功处理消息？

声称保证交付的大多数框架和协议，实际上提供类似于点4和5的保证。虽然这听起来很合理，但实际上有用吗？要理解这个含义，请考虑一个简单实用的例子：一个用户试图下订单，一旦它实际上在订单数据库中的磁盘上，我们就声明它已经成功处理。

如果我们依靠消息的成功处理，只要订单已经提交给有责任验证它的内部API，处理它并将其放入数据库，actor就会报告成功。不幸的是，在API被调用之后，可能会发生以下任何情况：
* 主机可能会崩溃
* 反序列化可能会失败
* 验证可能会失败
* 数据库可能不可用
* 编程错误可能会发生

这说明交付的保证没有转化为域名保证（domain level guarantee）。一旦订单实际完全处理完毕，我们只想报告成功。**唯一可报告成功的实体是应用程序本身，因为只有它对所需的域保证有任何理解。没有一个通用的框架能够弄清楚某个特定领域的具体情况以及该领域的成功。**

在这个特定的例子中，我们只想在成功的数据库写入之后发出成功信号，数据库确认现在已经安全地存储了订单。由于这些原因，**Akka将担保的责任提升到应用程序本身，即您必须自己执行。这给你完全控制你想要提供的保证。**现在，让我们考虑一下Akka提供的消息顺序，以便轻松推理应用程序逻辑。

**消息顺序**
在Akka中，对于一对给定的actor，直接从第一个到第二个发送的消息将不会被无序地接收。 The word directly emphasizes that this guarantee only applies when sending with the tell operator directly to the final destination, but not when employing mediators.

如果
* Actor A1 发送消息 M1, M2, M3 给 A2.
* Actor A3 发送消息 M4, M5, M6 给 A2.

这意味着，对于Akka消息：
* M1必须在M2和M3之前交付
* M2必须在M3之前交付
* M4必须在M3之前交付 M5 和 M6.
* M5必须在M6之前交付
* A2可以看到与来自A3的消息和A1的消息交错到达
* 由于没有保证的交付，任何消息都可能被丢弃，即没有到达A2。

这些保证取得了良好的平衡：来自一个演员的消息按顺序到达便于构建可轻易推理的系统，而另一方面允许来自不同参与者的消息交错到达，则为演员系统的有效实现提供了充分的自由。

**为设备消息添加灵活性**

我们的第一个查询协议是正确的，但没有考虑分布式应用程序的执行。如果我们想在查询设备actor的actor中执行重发（因为超时请求），或者如果我们想查询多个actor，我们需要能够关联请求和响应。因此，我们在消息中添加了一个字段，以便请求者可以提供一个ID（我们将在稍后的步骤中将此代码添加到我们的应用程序中）：

```scala
final case class ReadTemperature(requestId: Long)
final case class RespondTemperature(requestId: Long, value: Option[Double])
```

**定义设备参与者及其读取协议**
将消息定义在接受者的伴生对象中，并实现相应消息，添加`Device.scala`到`com.lightbend.akka.sample`
```scala
package com.lightbend.akka.sample

import akka.actor.{ Actor, ActorLogging, Props }

//设备的伴生对象
object Device {
	//创建一个对象
	def props(groupId: String, deviceId: String): Props = Props(new Device(groupId, deviceId))

	//请求读温度的消息
	final case class ReadTemperature(requestId: Long)
	//返回温度的消息
	final case class RespondTemperature(requestId: Long, value: Option[Double])
}

//设备actor
class Device(groupId: String, deviceId: String) extends Actor with ActorLogging {
	import Device._

	//存储温度
	var lastTemperatureReading: Option[Double] = None

	override def preStart(): Unit = log.info("Device actor {}-{} started", groupId, deviceId)
	override def postStop(): Unit = log.info("Device actor {}-{} stopped", groupId, deviceId)

	//当接收到温度的请求，返回温度信息
	override def receive: Receive = {
		case ReadTemperature(id) =>
			sender() ! RespondTemperature(id, lastTemperatureReading)
	}

}
```

在代码中注意：
* 伴随对象定义了如何构建Device actor。props 参数包括设备的ID和它所属的组，我们将在稍后使用。
* 伴随对象包括我们以前推理的消息的定义。
* 在Device类中，lastTemperatureReading的值最初设置为None，如果查询，actor将简单地报告它。


**测试Actor**

添加`DeviceSpec.scala`测试到test下的`com.lightbend.akka.sample`
```scala
package com.lightbend.akka.sample

import akka.actor.ActorSystem
import akka.testkit.{TestKit, TestProbe}
import org.scalatest.{BeforeAndAfterAll, FlatSpecLike, Matchers}

class DeviceSpec (_system: ActorSystem) extends TestKit(_system)
	with Matchers with FlatSpecLike	with BeforeAndAfterAll {

	def this() = this(ActorSystem("DeviceSpec"))

	override def afterAll: Unit = {
		shutdown(system)
	}

	"if no temperature is known" should "reply with empty reading " in {
		val probe = TestProbe()
		val deviceActor = system.actorOf(Device.props("group", "device"))

		deviceActor.tell(Device.ReadTemperature(requestId = 42), probe.ref)
		val response = probe.expectMsgType[Device.RespondTemperature]
		response.requestId should ===(42)
		response.value should ===(None)
	}
}
```
进入命令行：执行`sbt test`

**添加写入温度的协议**
```scala
//在 Device 伴生对象中添加
  final case class RecordTemperature(requestId: Long, value: Double)
  final case class TemperatureRecorded(requestId: Long)

//修改 receive
	override def receive: Receive = {
		case RecordTemperature(id, value) =>
			log.info("Recorded temperature reading {} with {}", value, id)
			lastTemperatureReading = Some(value)
			sender() ! TemperatureRecorded(id)
		case ReadTemperature(id) =>
			sender() ! RespondTemperature(id, lastTemperatureReading)
	}
```

修改测试为
```scala
		val probe = TestProbe()
		val deviceActor = system.actorOf(Device.props("group", "device"))

		deviceActor.tell(Device.ReadTemperature(requestId = 42), probe.ref)
		val response = probe.expectMsgType[Device.RespondTemperature]
		response.requestId should ===(42)
		response.value should ===(None)

		deviceActor.tell(Device.RecordTemperature(requestId = 1, 24.0), probe.ref)
		probe.expectMsg(Device.TemperatureRecorded(requestId = 1))

		deviceActor.tell(Device.ReadTemperature(requestId = 2), probe.ref)
		val response1 = probe.expectMsgType[Device.RespondTemperature]
		response1.requestId should ===(2)
		response1.value should ===(Some(24.0))

		deviceActor.tell(Device.RecordTemperature(requestId = 3, 55.0), probe.ref)
		probe.expectMsg(Device.TemperatureRecorded(requestId = 3))

		deviceActor.tell(Device.ReadTemperature(requestId = 4), probe.ref)
		val response2 = probe.expectMsgType[Device.RespondTemperature]
		response2.requestId should ===(4)
		response2.value should ===(Some(55.0))
```
进入命令行：执行`sbt test`


#### 第4部分：使用设备组
让我们仔细看看我们的用例所要求的主要功能。在完整的用于监测家庭温度的物联网系统中，将设备传感器连接到我们的系统的步骤可能如下所示：
* 家中的传感器设备通过某种协议连接。
* 管理网络连接的组件并接受连接。
* 传感器提供其组和设备ID以注册到我们系统的设备管理器组件。
* 设备管理器组件通过查找或创建负责保持传感器状态的参与者来处理注册。
* actor回应一个确认，揭露其ActorRef。
* 网络组件现在使用ActorRef在传感器和设备参与者之间进行通信，而无需通过设备管理器。

接下来将完成3~6步，我们应该用多少层次来表示设备组和设备传感器？
Akka程序员面临的主要设计挑战之一是为演员选择最佳粒度。在实践中，根据参与者之间相互作用的特点，通常有几种组织系统的有效方法。例如，在我们的用例中，可能有一个单独的角色维护所有的组和设备 - 也许使用哈希映射。他为每个组跟踪同一家庭中所有设备的状态也是合理的。

以下指南帮助我们选择最合适的**actor层次**：
* 通常来说，粗粒度的比细粒度的的，引出的问题比解决的问题多
* 当系统需要时添加更精细的粒度：
	* 更高的并发性
	* 复杂的actor之间有更多的状态
	* 足够多的状态
	* 多重无关的责任。使用单独的actor可以使个人失败，恢复并对其他人产生更少的影响。

**设备管理器层级**
考虑到上一节中概述的原则，我们将设备管理器组件模型化为具有三个级别的actor树：
* manager，最高层级，这也是查找和创建设备组和设备参与者的切入点。
* 下一层，group actor监督同一groupId的设备，提供查询组内可用设备的温度读数
* 最下层，device actor管理与实际设备传感器的所有交互，例如存储温度读数。

我们选择这个三层架构是出于以下原因：
* 设计group actors
	* 隔离group中发生的故障
	* 简化查询属于某个组的所有设备的问题
	* 增加系统并发性
* 将传感器建模为单个设备参与者：
	* 从组中的其余设备中隔离一个设备参与者的故障。
	* 增加收集温度读数的并行度。来自不同传感器的网络连接直接与其各自的设备参与者进行通信，减少争用点。

在此架构下，我们可以开始处理传感器：

**注册协议**
第一，我们需要设计协议，用于注册device以及创建将对其负责的group和device actor。这个协议将由DeviceManager组件本身提供，因为这是唯一已知和可用的actor：设备组和设备actor是按需创建的。

更详细地看注册，我们可以概述必要的功能：
* 当DeviceManager收到组和设备ID的请求时：
	* 如果管理员已经拥有设备组的角色，则会将请求转发给它。
	* 否则，它会创建一个新的设备组参与者，然后转发请求。
* DeviceGroup actor接收到为给定设备注册参与者的请求：
	* 如果该组已经具有该设备的角色，则组角色将该请求转发给设备角色。
	* 否则，DeviceGroup actor首先创建一个设备参与者，然后转发请求。
* Device actor接收请求并向原始发送者发送确认。由于Device actor确认接收（而不是Group actor确认接收），所以传感器现在将具有ActorRef直接向其actor发送消息。

添加`DeviceManager.scala`在`package com.lightbend.akka.sample`
```scala
package com.lightbend.akka.sample

object DeviceManager {
	//跟踪设备的请求消息
	final case class RequestTrackDevice(groupId: String, deviceId: String)
	//设备已经注册消息
	case object DeviceRegistered
}
```

修改`Device.scala`
```scala
//添加对跟踪设备的处理
		//接收到跟踪信号，是找自己的，返回响应
		case DeviceManager.RequestTrackDevice(`groupId`, `deviceId`) =>
			sender() ! DeviceManager.DeviceRegistered
		//接收到跟踪信号，不是找自己的，记录日志，不响应
		case DeviceManager.RequestTrackDevice(groupId, deviceId) =>
			log.warning(
				"Ignoring TrackDevice request for {}-{}.This actor is responsible for {}-{}.",
				groupId, deviceId, this.groupId, this.deviceId)
```

添加测试`DeviceManagerSpec`到测试文件夹下的`com.lightbend.akka.sample`
```scala
package com.lightbend.akka.sample

import akka.actor.ActorSystem
import akka.testkit.{TestKit, TestProbe}
import org.scalatest.{BeforeAndAfterAll, FlatSpecLike, Matchers}

import scala.concurrent.duration._

class DeviceManagerSpec(_system: ActorSystem) extends TestKit(_system)
	with Matchers with FlatSpecLike	with BeforeAndAfterAll {

	def this() = this(ActorSystem("DeviceManagerSpec"))

	override def afterAll: Unit = {
		shutdown(system)
	}

	"reply to registration requests" should "right deviceActor" in {
		val probe = TestProbe()
		val deviceActor = system.actorOf(Device.props("group", "device"))

		deviceActor.tell(DeviceManager.RequestTrackDevice("group", "device"), probe.ref)
		probe.expectMsg(DeviceManager.DeviceRegistered)
		probe.lastSender should ===(deviceActor)
	}

	"ignore wrong registration requests" should "no replay" in {
		val probe = TestProbe()
		val deviceActor = system.actorOf(Device.props("group", "device"))

		deviceActor.tell(DeviceManager.RequestTrackDevice("wrongGroup", "device"), probe.ref)
		probe.expectNoMsg(500.milliseconds)

		deviceActor.tell(DeviceManager.RequestTrackDevice("group", "Wrongdevice"), probe.ref)
		probe.expectNoMsg(500.milliseconds)
	}
}
```

**添加DeviceGroup actor**
添加`DeviceGroup.scala`到`com.lightbend.akka.sample`

DeviceGroup actor应该实现以下功能
* 接收到上层DeviceManager发送的RequestTrackDevice（追踪设备）的消息
	* `groupId`不一致忽略
	* `groupId`一致
		* 存在该设备，转发消息，发送者还是原来的
		* 不存在，先创建，再转发
* 接收到获取设备id列表的请求，直接返回该设备组中所有设备的id
* 当某设备关闭后，清理缓存

```scala
package com.lightbend.akka.sample

import akka.actor.{Actor, ActorLogging, ActorRef, Props, Terminated}
import com.lightbend.akka.sample.DeviceManager.RequestTrackDevice

//设备组 伴生对象
object DeviceGroup {
	def props(groupId: String): Props = Props(new DeviceGroup(groupId))

	//请求设备列表消息
	final case class RequestDeviceList(requestId: Long)
	//回复一个设备列表
	final case class ReplyDeviceList(requestId: Long, ids: Set[String])
}

//设备组actor
class DeviceGroup(groupId: String) extends Actor with ActorLogging {
	var deviceIdToActor = Map.empty[String, ActorRef]
	var actorToDeviceId = Map.empty[ActorRef, String]

	override def preStart(): Unit = log.info("DeviceGroup {} started", groupId)

	override def postStop(): Unit = log.info("DeviceGroup {} stopped", groupId)

	import DeviceGroup._

	override def receive: Receive = {
		//接收到 跟踪设备的请求消息 消息，是发给该设备组的
		case trackMsg @ RequestTrackDevice(`groupId`, _) =>
			//得到该设备的actor
			deviceIdToActor.get(trackMsg.deviceId) match {
				case Some(deviceActor) => //该设备存在
					//转发消息并将发送人设为原始发信人
					deviceActor forward trackMsg
				case None => //该设备不存在，创建设备
					log.info("Creating device actor for {}", trackMsg.deviceId)
					val deviceActor = context.actorOf(Device.props(groupId, trackMsg.deviceId), s"device-${trackMsg.deviceId}")
					context.watch(deviceActor) //观察此deviceActor的状态，当该deviceActor关闭（比如收到PoisonPill消息），本actor将收到Terminated(deviceActor)消息，以便作清理工作
					actorToDeviceId += deviceActor -> trackMsg.deviceId
					deviceIdToActor += trackMsg.deviceId -> deviceActor
					deviceActor forward trackMsg
			}
		//接收到 跟踪设备的请求消息 消息，不是发给该设备组的，忽略消息
		case RequestTrackDevice(groupId, deviceId) =>
			log.warning(
				"Ignoring TrackDevice request for {}. This actor is responsible for {}.",
				groupId, this.groupId)

		//接收到获取设备id列表的请求，返回消息
		case RequestDeviceList(requestId) =>
			sender() ! ReplyDeviceList(requestId, deviceIdToActor.keySet)

		case Terminated(deviceActor) => //清理关闭的deviceActor
			val deviceId = actorToDeviceId(deviceActor)
			log.info("Device actor for {} has been terminated", deviceId)
			actorToDeviceId -= deviceActor
			deviceIdToActor -= deviceId
	}
}
```

添加测试`DeviceGroupSpec`到测试文件夹的`com.lightbend.akka.sample`
```scala
package com.lightbend.akka.sample

import akka.actor.{ActorSystem, PoisonPill}
import akka.testkit.{TestKit, TestProbe}
import org.scalatest.{BeforeAndAfterAll, FlatSpecLike, Matchers}

import scala.concurrent.duration._

class DeviceGroupSpec(_system: ActorSystem) extends TestKit(_system)
	with Matchers with FlatSpecLike	with BeforeAndAfterAll {

	def this() = this(ActorSystem("DeviceGroupSpec"))

	override def afterAll: Unit = {
		shutdown(system)
	}


	"DeviceGroup" should "register a device actor" in {
		val probe = TestProbe()
		val groupActor = system.actorOf(DeviceGroup.props("group"))

		groupActor.tell(DeviceManager.RequestTrackDevice("group", "device1"), probe.ref)
		probe.expectMsg(DeviceManager.DeviceRegistered)
		val deviceActor1 = probe.lastSender

		groupActor.tell(DeviceManager.RequestTrackDevice("group", "device2"), probe.ref)
		probe.expectMsg(DeviceManager.DeviceRegistered)
		val deviceActor2 = probe.lastSender
		deviceActor1 should !==(deviceActor2)

		// Check that the device actors are working
		deviceActor1.tell(Device.RecordTemperature(requestId = 0, 1.0), probe.ref)
		probe.expectMsg(Device.TemperatureRecorded(requestId = 0))
		deviceActor2.tell(Device.RecordTemperature(requestId = 1, 2.0), probe.ref)
		probe.expectMsg(Device.TemperatureRecorded(requestId = 1))
	}

	"DeviceGroup" should "ignore requests for wrong groupId" in {
		val probe = TestProbe()
		val groupActor = system.actorOf(DeviceGroup.props("group"))

		groupActor.tell(DeviceManager.RequestTrackDevice("wrongGroup", "device1"), probe.ref)
		probe.expectNoMsg(500.milliseconds)
	}

	"Group" should "return same actor for same deviceId" in {
		val probe = TestProbe()
		val groupActor = system.actorOf(DeviceGroup.props("group"))

		groupActor.tell(DeviceManager.RequestTrackDevice("group", "device1"), probe.ref)
		probe.expectMsg(DeviceManager.DeviceRegistered)
		val deviceActor1 = probe.lastSender

		groupActor.tell(DeviceManager.RequestTrackDevice("group", "device1"), probe.ref)
		probe.expectMsg(DeviceManager.DeviceRegistered)
		val deviceActor2 = probe.lastSender

		deviceActor1 should ===(deviceActor2)
	}

	"Group" should "return list active devices" in {
		val probe = TestProbe()
		val groupActor = system.actorOf(DeviceGroup.props("group"))

		groupActor.tell(DeviceManager.RequestTrackDevice("group", "device1"), probe.ref)
		probe.expectMsg(DeviceManager.DeviceRegistered)

		groupActor.tell(DeviceManager.RequestTrackDevice("group", "device2"), probe.ref)
		probe.expectMsg(DeviceManager.DeviceRegistered)

		groupActor.tell(DeviceGroup.RequestDeviceList(requestId = 0), probe.ref)
		probe.expectMsg(DeviceGroup.ReplyDeviceList(requestId = 0, Set("device1", "device2")))
	}

	"Group" should "return list active devices after one shuts down" in {
		val probe = TestProbe()
		val groupActor = system.actorOf(DeviceGroup.props("group"))

		groupActor.tell(DeviceManager.RequestTrackDevice("group", "device1"), probe.ref)
		probe.expectMsg(DeviceManager.DeviceRegistered)
		val toShutDown = probe.lastSender

		groupActor.tell(DeviceManager.RequestTrackDevice("group", "device2"), probe.ref)
		probe.expectMsg(DeviceManager.DeviceRegistered)

		groupActor.tell(DeviceGroup.RequestDeviceList(requestId = 0), probe.ref)
		probe.expectMsg(DeviceGroup.ReplyDeviceList(requestId = 0, Set("device1", "device2")))

		probe.watch(toShutDown)
		toShutDown ! PoisonPill
		probe.expectTerminated(toShutDown)

		// using awaitAssert to retry because it might take longer for the groupActor
		// to see the Terminated, that order is undefined
		probe.awaitAssert {
			groupActor.tell(DeviceGroup.RequestDeviceList(requestId = 1), probe.ref)
			probe.expectMsg(DeviceGroup.ReplyDeviceList(requestId = 1, Set("device2")))
		}
	}

}
```

**完成设备管理者actor**
修改`DeviceManager.scala`
```scala
package com.lightbend.akka.sample

import akka.actor.{Actor, ActorLogging, ActorRef, Props, Terminated}
import com.lightbend.akka.sample.DeviceManager.RequestTrackDevice

object DeviceManager {
	def props(): Props = Props(new DeviceManager)

	//跟踪设备的请求消息
	final case class RequestTrackDevice(groupId: String, deviceId: String)
	//设备已经注册消息
	case object DeviceRegistered
}

class DeviceManager extends Actor with ActorLogging {
	var groupIdToActor = Map.empty[String, ActorRef]
	var actorToGroupId = Map.empty[ActorRef, String]

	override def preStart(): Unit = log.info("DeviceManager started")

	override def postStop(): Unit = log.info("DeviceManager stopped")

	override def receive:Receive = {
		//接收到追踪消息
		case trackMsg@RequestTrackDevice(groupId, _) =>
			//获取根据组Id，获取组actor
			groupIdToActor.get(groupId) match {
				case Some(ref) => //存在，转发消息
					ref forward trackMsg
				case None => //不存在则创建
					log.info("Creating device group actor for {}", groupId)
					val groupActor = context.actorOf(DeviceGroup.props(groupId), "group-" + groupId)
					context.watch(groupActor) //观察关闭信号
					groupActor forward trackMsg
					groupIdToActor += groupId -> groupActor
					actorToGroupId += groupActor -> groupId
			}

		case Terminated(groupActor) => //清理关闭的组
			val groupId = actorToGroupId(groupActor)
			log.info("Device group actor for {} has been terminated", groupId)
			actorToGroupId -= groupActor
			groupIdToActor -= groupId

	}
}
```



