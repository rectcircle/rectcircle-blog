---
title: scala akka actor一种并发模型（四）
date: 2017-11-14T20:36:52+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/115
  - /detail/115/
tags:
  - scala
---

## 三、Actors

***

### 5、邮箱

Akka邮箱包含发往Actor的消息。通常每个Actor都有自己的邮箱，但是并非总是如此，例如一个BalancingPool所有路由将共享一个邮箱实例。

邮箱仅仅是存放消息的容器

#### （1）actor配置邮箱

**为单独的Actor指定邮箱**

```scala
import akka.dispatch.RequiresMessageQueue
import akka.dispatch.BoundedMessageQueueSemantics

class MyBoundedActor extends MyActor
  with RequiresMessageQueue[BoundedMessageQueueSemantics]
```

RequiresMessageQueue特征的类型参数需要映射到配置中的邮箱，如下所示：

```conf

bounded-mailbox {
  mailbox-type = "akka.dispatch.BoundedMailbox"
  mailbox-capacity = 1000
  mailbox-push-timeout-time = 10s
}

akka.actor.mailbox.requirements {
  "akka.dispatch.BoundedMessageQueueSemantics" = bounded-mailbox
	}
```

现在，每当你创建一个MyBoundedActor类型的actor时，它将尝试获得一个有界的邮箱。如果参与者在部署中配置了不同的邮箱，则可以直接或通过具有指定邮箱类型的调度程序来重写此映射。

**注意**

为actor创建的邮箱中的队列类型将根据trait中所需的类型进行检查，如果队列未实现所需的类型，则actor创建将失败。

**为一个调度器指定邮箱**

```scala
my-dispatcher {
  mailbox-requirement = org.example.MyInterface
}
```

**Actor如何选择邮箱类型**

当一个actor被创建时，ActorRefProvider首先决定执行它的调度器。然后邮箱确定如下：

* 如果actor的部署配置选项包含邮箱key，则会指定描述要使用的邮箱类型的配置部分。
* 如果actor的Props包含一个邮箱选择，例如`withMailbox`被调用。那么它会命名一个描述要使用的邮箱类型的配置节。
* 如果调度器的配置部分包含对邮箱类型的配置的key，则将使用相同的部分来配置邮箱类型。
* 如果调度器需要如上所述的邮箱类型，则将使用该要求的映射来确定要使用的邮箱类型。
* 将使用默认邮箱`akka.actor.default`邮箱。

#### （2）默认邮箱

它是一个无限制的邮箱，使用`java.util.concurrent.ConcurrentLinkedQueue`实现。

SingleConsumerOnlyUnboundedMailbox是一个效率更高的邮箱，它可以用作默认邮箱，但不能与BalancingDispatcher一起使用。

将SingleConsumerOnlyUnboundedMailbox配置为默认邮箱：

```
akka.actor.default-mailbox {
  mailbox-type = "akka.dispatch.SingleConsumerOnlyUnboundedMailbox"
}
```

**将哪个配置传递给邮箱类型**

每个邮箱类型由扩展MailboxType的类实现，并带有两个构造函数参数：一个ActorSystem.Settings对象和一个Config部分。后者通过从actor系统的配置中获取命名的配置部分来计算，使用邮箱类型的配置路径覆盖它的id键，并将回退添加到默认邮箱配置部分。

#### （3）内建邮箱实现

* **UnboundedMailbox** (default)
	* 默认邮箱
	* 由`java.util.concurrent.ConcurrentLinkedQueue`支持
	* Blocking: No
	* Bounded: No
	* 配置名称："unbounded”或“akka.dispatch.UnboundedMailbox"
* **SingleConsumerOnlyUnboundedMailbox**根据您的使用情况，此队列可能会也可能不会比默认的更快，请务必正确进行基准测试！
	* 由多生产者单消费者队列支持，不能与BalancingDispatcher一起使用
	* Blocking: No
	* Bounded: No
	* 配置名称："akka.dispatch.SingleConsumerOnlyUnboundedMailbox"
* **NonBlockingBoundedMailbox**
	* 由一个非常有效的多生产者单消费者队列支持
	* Blocking: No （丢弃溢出的消息到deadLetters）
	* Bounded: Yes
	* 配置名称："akka.dispatch.NonBlockingBoundedMailbox"
* **UnboundedControlAwareMailbox**
	* 提供扩展akka.dispatch.ControlMessage具有更高优先级的消息
	* 由两个java.util.concurrent.ConcurrentLinkedQueue支持
	* Blocking: No
	* Bounded: No
	* 配置名称："akka.dispatch.UnboundedControlAwareMailbox"
* **UnboundedPriorityMailbox**
	* 由java.util.concurrent.PriorityBlockingQueue支持
	* 相同优先级消息的传递顺序是未定义的 - 与UnboundedStablePriorityMailbox相反
	* Blocking: No
	* Bounded: No
	* 配置名称："akka.dispatch.UnboundedPriorityMailbox"
* **UnboundedStablePriorityMailbox**
	* 由一个包含在akka.util.PriorityQueueStabilizer中的java.util.concurrent.PriorityBlockingQueue支持
	* 先进先出顺序被保留用于相同优先级的消息 - 与UnboundedPriorityMailbox相反
	* Blocking: No
	* Bounded: No
	* 配置名称："akka.dispatch.UnboundedStablePriorityMailbox"

其他有界的邮箱实现，如果达到容量并配置了非零的邮箱推送超时时间，它将阻止发件人。

* **BoundedMailbox**
	* 由java.util.concurrent.LinkedBlockingQueue支持
	* Blocking：如果使用非零的邮箱推送超时时间，则为“是”，否则为“否”
	* Bounded: Yes
	* 配置名称："bounded"或"akka.dispatch.BoundedMailbox"
* **BoundedPriorityMailbox**
	* 由包装在akka.util.BoundedBlockingQueue中的java.util.PriorityQueue支持
	* 相同优先级消息的传递顺序是未定义的 - 与BoundedStablePriorityMailbox相通
	* Blocking: 是，如果使用非零的 mailbox-push-timeout-time 时间，否则不
	* Bounded: Yes
	* 配置名称："akka.dispatch.BoundedPriorityMailbox"
* **BoundedStablePriorityMailbox**
	* 由包装在akka.util.PriorityQueueStabilizer和akka.util.BoundedBlockingQueue中的java.util.PriorityQueue支持
	* 先进先出顺序保留给优先级相同的消息 - 与BoundedPriorityMailbox对比
	* Blocking: 是，如果使用非零的 mailbox-push-timeout-time 时间，否则不
	* Bounded: Yes
	* 配置名称："akka.dispatch.BoundedStablePriorityMailbox"
* **BoundedControlAwareMailbox**
	* 提供扩展akka.dispatch.ControlMessage具有更高优先级的消息
	* 由两个java.util.concurrent.ConcurrentLinkedQueue支持，如果已经达到容量，则阻塞入队
	* Blocking: 是，如果使用非零的 mailbox-push-timeout-time 时间，否则不
	* Bounded: Yes
	* 配置名称："akka.dispatch.BoundedControlAwareMailbox"

#### （4）邮箱配置示例

**PriorityMailbox（优先邮箱）**
如何创建PriorityMailbox：

```scala
// 在这种情况下，我们从UnboundedStablePriorityMailbox继承
// and seed it with the priority generator
class MyPrioMailbox(settings: ActorSystem.Settings, config: Config)
  extends UnboundedStablePriorityMailbox(
	  // 创建一个新的PriorityGenerator，更低的prio意味着更重要
	  PriorityGenerator {
		  // 'highpriority messages should be treated first if possible
		  case 'highpriority => 0

		  // 'lowpriority messages should be treated last if possible
		  case 'lowpriority => 2

		  // PoisonPill when no other left
		  case PoisonPill => 3

		  // We default to 1, which is in between high and low
		  case otherwise => 1
	  })


// We create a new Actor that just prints out what it processes
class Logger extends Actor {
	self ! 'lowpriority
	self ! 'lowpriority
	self ! 'highpriority
	self ! 'pigdog
	self ! 'pigdog2
	self ! 'pigdog3
	self ! 'highpriority
	self ! PoisonPill

	def receive = {
		case x => println(x.toString)
	}
}

	val a = system.actorOf(Props(classOf[Logger]).withDispatcher(
		"prio-dispatcher"))
	/*输出
'highpriority
'highpriority
'pigdog
'pigdog2
'pigdog3
'lowpriority
'lowpriority
	*/
```

配置邮箱

```
prio-dispatcher {
  type = Dispatcher
  executor = "fork-join-executor"
  fork-join-executor {
    parallelism-min = 2
    parallelism-factor = 2.0
    parallelism-max = 10
  }
  throughput = 100
  # 配置邮箱
  mailbox-type = "com.lightbend.akka.sample.MyPrioMailbox"
}
```

也可以像这样直接配置邮箱类型：

```
prio-mailbox {
  mailbox-type = "docs.dispatcher.DispatcherDocSpec$MyPrioMailbox"
  //Other mailbox configuration goes here
}

akka.actor.deployment {
  /priomailboxactor {
    mailbox = prio-mailbox
  }
}
```

```scala
import akka.actor.Props
val myActor = context.actorOf(Props[MyActor], "priomailboxactor")
```

**ControlAwareMailbox**
如果参与者需要能够立即接收控制消息，无论邮箱中已经有多少其他消息，ControlAwareMailbox会非常有用。

它可以像这样配置：

```
control-aware-dispatcher {
  mailbox-type = "akka.dispatch.UnboundedControlAwareMailbox"
  //Other dispatcher configuration goes here
}
```

控制消息需要扩展ControlMessage特征：

```scala
import akka.dispatch.ControlMessage
case object MyControlMessage extends ControlMessage
```

然后举一个例子说明如何使用它：

```scala
// We create a new Actor that just prints out what it processes
class Logger2 extends Actor {

	self ! 'foo
	self ! 'bar
	self ! MyControlMessage
	self ! PoisonPill

	def receive = {
		case x => println(x.toString)
	}
}

val a1 = system.actorOf(Props(classOf[Logger2]).withDispatcher(
		"control-aware-dispatcher"))
/*输出
MyControlMessage
'foo
'bar
*/
```

#### （5）创建您自己的邮箱类型

```scala
// 一个标记特质，被用来做mailbox requirements映射
trait MyUnboundedMessageQueueSemantics

import akka.actor.ActorRef
import akka.actor.ActorSystem
import akka.dispatch.Envelope
import akka.dispatch.MailboxType
import akka.dispatch.MessageQueue
import akka.dispatch.ProducesMessageQueue
import com.typesafe.config.Config
import java.util.concurrent.ConcurrentLinkedQueue

object MyUnboundedMailbox {
	// 消息队列的实现，需要混入 标记特质
	class MyMessageQueue extends MessageQueue
	  with MyUnboundedMessageQueueSemantics {

		private final val queue = new ConcurrentLinkedQueue[Envelope]()

		override def enqueue(receiver: ActorRef, handle: Envelope): Unit =
			queue.offer(handle)
		override def dequeue(): Envelope = queue.poll()
		override def numberOfMessages: Int = queue.size
		override def hasMessages: Boolean = !queue.isEmpty
		override def cleanUp(owner: ActorRef, deadLetters: MessageQueue) {
			while (hasMessages) {
				deadLetters.enqueue(owner, dequeue())
			}
		}
	}
}

// 这是邮箱消息队列的是创建工厂
class MyUnboundedMailbox extends MailboxType
  with ProducesMessageQueue[MyUnboundedMailbox.MyMessageQueue] {

	import MyUnboundedMailbox._

	// 这个构造函数签名必须存在，它将被Akka调用
	def this(settings: ActorSystem.Settings, config: Config) = {
		// 在这添加自己的初始化代码
		this()
	}

	// 创建消息队列的方法
	final override def create(
	                           owner: Option[ActorRef],
	                           system: Option[ActorSystem]): MessageQueue ={
		println("创建了一个消息队列")
		new MyMessageQueue()
	}
}
```

配置

```
## 自定义邮箱
custom-dispatcher {
  type = Dispatcher
  executor = "fork-join-executor"
  fork-join-executor {
    parallelism-min = 2
    parallelism-factor = 2.0
    parallelism-max = 10
  }
  throughput = 100
  # 配置邮箱
  mailbox-requirement =
    "com.lightbend.akka.sample.MyUnboundedMessageQueueSemantics"
}

# 配置邮箱类型
custom-dispatcher-mailbox {
  mailbox-type = "com.lightbend.akka.sample.MyUnboundedMailbox"
}

# MyUnboundedMessageQueueSemantics trait 的创建工厂为
# MyUnboundedMailbox ，他将 创建一个 消息队列 with MyUnboundedMessageQueueSemantics
akka.actor.mailbox.requirements {
  "com.lightbend.akka.sample.MyUnboundedMessageQueueSemantics" =
    custom-dispatcher-mailbox
}
```

使用

```scala
//定义Actor时指定
class MySpecialActor extends MyActor
  with RequiresMessageQueue[MyUnboundedMessageQueueSemantics] {
}

//创建Actor时指定，执行上下文方式
system.actorOf(Props[MyActor].withDispatcher("custom-dispatcher"))
system.actorOf(Props[MySpecialActor])
```

### 6、路由

消息可以通过路由器发送，以便有效地将其路由到目标参与者，即路由。路由器可以在一个角色内部或外部使用，你可以自己管理路由，也可以使用一个独立的具有配置能力的路由器角色。

根据您的应用需求，可以使用不同的路由策略。 Akka带来了几种有用的路由策略。但是，正如你将在本章中看到的那样，也可以创建自己的。

router即路由，消息传递到router后，router根据响应的策略将消息下发到其所管理的routees, routees可以看做是一系列Actor的集合，每个Actor当然既可以是本地的Actor也可以是远程的Actor。

router将消息下发给其管理的很多个routee中的一个，根据负载或者路由策略选择发送给哪一个。

Router又可分Pool和Group两种模式：

* 在Router-Pool模式中Router负责构建所有的Routee。如此所有Routee都是Router的直属子级Actor，可以实现Router对Routees的直接监管。由于这种直接的监管关系，Router-Pool又可以按运算负载自动增减Routee，能更有效地分配利用计算资源。
* Router-Group模式中的Routees由外界其它Actor产生，特点是能实现灵活的Routee构建和监控，可以用不同的监管策略来管理一个Router下的Routees，比如可以使用BackoffSupervisor。从另一方面来讲，Router-Group的缺点是Routees的构建和管理复杂化了，而且往往需要人为干预。

#### （1）一个简单的路由

以下示例说明如何使用路由器并管理actor中的路由。

```scala
package com.lightbend.akka.sample

import akka.actor.{Actor, ActorSystem, Props, Terminated}
import akka.routing.{ActorRefRoutee, RoundRobinRoutingLogic, Router}

object Worker {
	case object Work
}

class Worker extends Actor{
	import Worker._

	override def receive:Receive = {
		case Work => println("工作中")
	}
}

class Master extends Actor {
	var router:Router = {
		val routees = Vector.fill(5) {
			val r = context.actorOf(Props[Worker])
			context watch r
			ActorRefRoutee(r)
		}
		Router(RoundRobinRoutingLogic(), routees)
	}
	import Worker._

	override def receive:Receive = {
		case Work =>
			router.route(Work, sender())
		case Terminated(a) =>
			router = router.removeRoutee(a)
			val r = context.actorOf(Props[Worker])
			context watch r
			router = router.addRoutee(r)
	}
}

object RouterTest extends App {
	val system = ActorSystem("RouterTest")
	val master = system.actorOf(Props[Master], "master")
	master ! Worker.Work
	master ! Worker.Work
	master ! Worker.Work
}
```

我们创建一个路由器，并指定在将消息路由到路由时使用RoundRobinRoutingLogic。
Akka附带的路由策略是：

* `akka.routing.RoundRobinRoutingLogic`
* `akka.routing.RandomRoutingLogic`
* `akka.routing.SmallestMailboxRoutingLogic`
* `akka.routing.BroadcastRoutingLogic`
* `akka.routing.ScatterGatherFirstCompletedRoutingLogic`
* `akka.routing.TailChoppingRoutingLogic`
* `akka.routing.ConsistentHashingRoutingLogic`

我们创建了一系列routees，也就是使用ActorRefRoutee包装的普通Actor。我们看到另一个routee取代了终止的Actor。

通过路由器发送消息用路由方法完成，就像上面例子中的Work消息一样。

路由器是不可变的，路由逻辑是线程安全的;这意味着它们也可以在演员之外使用。

#### （2）一个路由器Actor

路由器也可以创建为一个独立的角色，管理路由本身，并从配置中加载路由逻辑和其他设置。

这种类型的路由器参与者有两种不同的风格：

* pool - router创建routees为子actor，并在路由器终止时将其从路由器中删除。
* 组 - routees actor在路由器外部创建，路由器使用参与者选择将消息发送到指定的路径，而不用观察终止。

路由器Actor的设置可以在配置中或以编程方式定义。为了使Actor能够使用外部可配置路由器，必须使用FromConfig props包装来表示参与者接受来自配置的路由设置。如果actor的道具不包含在FromConfig中，它将忽略部署配置的路由器部分。

您可以像普通Actor一样通过router发送消息给Actor，即通过ActorRef。router参与者将消息转发到其而不改变原始发送者。当路由器回复路由消息时，回复将被发送给原始发送者，而不是路由器Actor。

**Pool**

接下来的代码和配置片段展示如何创建一个round-robin路由器，将消息转发给五个工作者路由。
配置

```
akka.actor.deployment {
  /router1 {
    router = round-robin-pool
    nr-of-instances = 5
  }
}
```

代码

```scala
val router1: ActorRef =
  context.actorOf(FromConfig.props(Props[Worker]), "router1")
```

这里是相同的例子，但是以编程方式提供路由器配置而不是配置。

```scala
val router2: ActorRef =
  context.actorOf(RoundRobinPool(5).props(Props[Worker]), "router2")
```

**远程部署的路由**

除了能够将本地Actor创建为路由之外，还可以指示Router将其创建的子项部署在一组远程主机上。Routees 将以 round-robin方式部署。为了远程部署routee，将router配置包装在RemoteRouterConfig中，附加要部署的节点的远程地址。远程部署需要将akka-remote模块包含在类路径中。

```scala
import akka.actor.{ Address, AddressFromURIString }
import akka.remote.routing.RemoteRouterConfig
val addresses = Seq(
  Address("akka.tcp", "remotesys", "otherhost", 1234),
  AddressFromURIString("akka.tcp://othersys@anotherhost:1234"))
val routerRemote = system.actorOf(
  RemoteRouterConfig(RoundRobinPool(5), addresses).props(Props[Echo]))
```

**Senders**

默认情况下，routee 发送消息，将隐式的设置发送者为自己

```scala
sender() ! x // replies will go to this actor
```

但是，routee将router设置为发送者通常很有用。手动指定发件人

```scala
sender().tell("reply", context.parent) // replies will go back to parent
sender().!("reply")(context.parent) // alternative syntax (beware of the parens!)
```

**监视**

对于pool类型的router，他的routee的监视者就是router自己。

router的监督策略的配置：pool的supervisorStrategy属性。如果没有提供配置，则路由器默认为始终escalate策略。这意味着错误传递给路由器的主管进行处理。路由器的主管将决定如何处理任何错误。

请注意，router的管理员会将错误视为router本身的错误。因此，停止或重新启动的指令将导致路由器本身停止或重新启动。反过来，路由器将导致其孩子停止并重新启动

应该提到的是，router的重启行为已被覆盖，以便重新启动，同时仍然重新创建子项，仍将保留池中相同数量的actor。

设置监管策略：

```scala
val escalator = OneForOneStrategy() {
  case e ⇒ testActor ! e; SupervisorStrategy.Escalate
}
val router = system.actorOf(RoundRobinPool(1, supervisorStrategy = escalator).props(
  routeeProps = Props[TestActor]))
```

**Group**

有时候，不应该使用router创建他的routees。希望的是routees的创建及使用分离。这时，可以通过配置routees的路径给router。消息将通过ActorSelection发送到这些路径。

配置

```scala
akka.actor.deployment {
  /router3 {
    router = round-robin-group
    routees.paths = ["/user/w1", "/user/w2", "/user/w3"]
  }
}
```

编码

```scala
	system.actorOf(Props[Worker], "w1")
	system.actorOf(Props[Worker], "w2")
	system.actorOf(Props[Worker], "w3")

	val router3: ActorRef =
		system.actorOf(FromConfig.props(), "router3")

	router3 ! Worker.Work
```

无配置方式

```scala
val router4: ActorRef =
  context.actorOf(RoundRobinGroup(paths).props(), "router4")
```

#### （3）路由器的使用

各种router的配置和使用样例

**RoundRobinPool**

配置

```
akka.actor.deployment {
  /parent/router1 {
    router = round-robin-pool
    nr-of-instances = 5
  }
}
```

使用

```scala
val router1: ActorRef =
  context.actorOf(FromConfig.props(Props[Worker]), "router1")

val router2: ActorRef =
  context.actorOf(RoundRobinPool(5).props(Props[Worker]), "router2")
```

**RoundRobinGroup**

```
akka.actor.deployment {
  /parent/router3 {
    router = round-robin-group
    routees.paths = ["/user/workers/w1", "/user/workers/w2", "/user/workers/w3"]
  }
}
```

```scala
val router3: ActorRef =
  context.actorOf(FromConfig.props(), "router3")

val paths = List("/user/workers/w1", "/user/workers/w2", "/user/workers/w3")
val router4: ActorRef =
  context.actorOf(RoundRobinGroup(paths).props(), "router4")
```

**RandomPool 和 RandomGroup**

```
akka.actor.deployment {
  /parent/router5 {
    router = random-pool
    nr-of-instances = 5
  }
}

akka.actor.deployment {
  /parent/router7 {
    router = random-group
    routees.paths = ["/user/workers/w1", "/user/workers/w2", "/user/workers/w3"]
  }
}
```

```scala
val router5: ActorRef =
  context.actorOf(FromConfig.props(Props[Worker]), "router5")

val router6: ActorRef =
  context.actorOf(RandomPool(5).props(Props[Worker]), "router6")

val router7: ActorRef =
  context.actorOf(FromConfig.props(), "router7")

val paths = List("/user/workers/w1", "/user/workers/w2", "/user/workers/w3")
val router8: ActorRef =
  context.actorOf(RandomGroup(paths).props(), "router8")
```

[其他参见](https://doc.akka.io/docs/akka/current/scala/routing.html#router-usage)

#### （4）特别消息处理

大多数发送给路由器参与者的消息将根据路由器的路由逻辑进行转发。但是有几种类型的消息具有特殊的行为。

**Broadcast Messages（广播消息）**

```scala
import akka.routing.Broadcast
router4 ! Broadcast(Worker.Work)
```

各个routee将收到`Worker.Work`消息

**PoisonPill Messages**

```scala
import akka.actor.PoisonPill
router ! PoisonPill
```

此消息是关闭router本身的消息，不会转发到routee，若要关闭routee

```scala
import akka.actor.PoisonPill
import akka.routing.Broadcast
router ! Broadcast(PoisonPill)
```

**Kill Messages**

类似于上一个

**管理消息**

* 将akka.routing.GetRoutees发送给路由器参与者将使其在akka.routing.Routees消息中发回其当前使用的路由。
* 将akka.routing.AddRoutee发送给路由器actor会将该routee添加到其路由集合中。
* 发送akka.routing.RemoveRoutee到路由器的演员将删除该路由器的路由集合。
* 将akka.routing.AdjustPoolSize发送到池路由器actor将添加或删除路由数量到其路由集合。

#### （5）动态可调整大小的池

大多数池可以使用固定数量的路由，也可以使用调整策略来动态调整路由数量。

有两种类型的调整器：默认调整器和OptimalSizeExploringResizer。

**Default Resizer**

默认的调整器会根据压力来调整池的大小，以池中繁忙路由的百分比来衡量。如果压力高于某个阈值，则会增加池的大小，如果压力低于某个阈值则会回退。两个阈值都是可配置的。

```
akka.actor.deployment {
  /parent/router29 {
    router = round-robin-pool
    resizer {
      lower-bound = 2
      upper-bound = 15
      messages-per-resize = 100
    }
  }
}
```

```scala
val router29: ActorRef =
  context.actorOf(FromConfig.props(Props[Worker]), "router29")
```

或者

```scala
val resizer = DefaultResizer(lowerBound = 2, upperBound = 15)
val router30: ActorRef =
  context.actorOf(
    RoundRobinPool(5, Some(resizer)).props(Props[Worker]),
    "router30")
```

**Optimal Size Exploring Resizer**
OptimalSizeExploringResizer将池的大小调整为提供最多消息吞吐量的最佳大小。

例子

```
akka.actor.deployment {
  /parent/router31 {
    router = round-robin-pool
    optimal-size-exploring-resizer {
      enabled = on
      action-interval = 5s
      downsize-after-underutilized-for = 72h
    }
  }
}
```

#### （6）在Akk内路由是如何设计的

在表面上，路由器看起来像普通的演员，但实际上它们的实现方式不同。路由器被设计为在接收消息并将其快速传递给路由时非常高效。

普通的actor可以用来路由消息，但是actor的单线程处理可能成为瓶颈。路由器可以通过优化通常的消息处理管道来实现更高的吞吐量，从而允许并发路由。这是通过将路由器的路由逻辑直接嵌入到他们的ActorRef中而不是路由器中来实现的。发送到路由器的ActorRef消息可以立即路由到routee，完全绕过单线程路由器actor。

当然，这样做的代价是路由代码的内部比用普通的角色实现路由器更复杂。幸运的是，所有这些复杂性对于路由API的消费者是不可见的。但是，在实现自己的路由器时需要注意一些事情。

#### （7）定制路由器

略

[参见](https://doc.akka.io/docs/akka/current/scala/routing.html#custom-router)

#### （8）配置调度器

配置一个调度器为路由服务

调度器根据Props中的信息创建孩子池

为了方便定义routees池的调度器，您可以在配置的部署部分内联定义调度程序。

```
akka.actor.deployment {
  /poolWithDispatcher {
    router = random-pool
    nr-of-instances = 5
    pool-dispatcher {
      fork-join-executor.parallelism-min = 5
      fork-join-executor.parallelism-max = 5
    }
  }
}
```

这是你唯一需要做的事情，为一个池启用一个专门的调度器。

```scala
val router: ActorRef = system.actorOf(
  // “head” router actor will run on "router-dispatcher" dispatcher
  // Worker routees will run on "pool-dispatcher" dispatcher
  RandomPool(5, routerDispatcher = "router-dispatcher").props(Props[Worker]),
  name = "poolWithDispatcher")
```

### 7、FSM

FSM（有限状态机）和Akka Actor混合使用，FSM描述参见[Erlang design principles](#http://www.erlang.org/documentation/doc-4.8.2/doc/design_principles/fsm.html)

一个FSM可以被描述为一组关系的形式：

```
State(S) x Event(E) -> Actions (A), State(S’)
```

这些关系被解释为：
如果我们处于状态S并且事件E发生，那么我们应该执行动作A并转换到状态S'。

#### （1）一个简单的例子

为了演示FSM特征的大部分特征，考虑在突发到达时将接收并排队消息，并在突发结束或接收到刷新请求之后将其发送的参与者。

首先，考虑下面的所有内容来使用这些导入语句：

```scala
import akka.actor.{ ActorRef, FSM }
import scala.concurrent.duration._
```

我们的“Buncher”Actor的协议是接受或产生以下信息：

```scala
// Buncher 接收可以接收的消息 events
final case class SetTarget(ref: ActorRef)
final case class Queue(obj: Any)
case object Flush

// Buncher 发送的消息 events
final case class Batch(obj: collection.immutable.Seq[Any])
```

`SetTarget`是启动它所需要的，设置要传递的 `Batches` 的目的地； `Queue` 将添加到内部队列中，`Flush` 将标志着突发的结束。

```scala
// Buncher 内部状态
sealed trait State
case object Idle extends State //空闲
case object Active extends State //激活

// Buncher 内部数据
case object Uninitialized extends Data //未初始化状态的数据
sealed trait Data
final case class Todo(target: ActorRef, queue: collection.immutable.Seq[Any]) extends Data //能接受的数据
```

这个Actor可以有两种状态：没有消息排队（又名`Idle`（空闲））或一些消息排队（又名`Active`（活动））。只要消息持续到达，并且不需要刷新，它将一直处于`Active`状态。Actor的内部状态数据由发送批次的目标参与者引用和消息的实际队列组成。

现在让我们来看看我们的FSM Actor的骨架：

```scala
class Buncher extends FSM[State, Data] {

	startWith(Idle, Uninitialized) //初始化状态

	//在空闲状态的处理
	when(Idle) {
		case Event(SetTarget(ref), Uninitialized) =>
			stay using Todo(ref, Vector.empty) //创建一个数据
	}

	//当状态变换时
	onTransition {
		case Active -> Idle =>
			stateData match {
				case Todo(ref, queue) => ref ! Batch(queue)
				case _ => // nothing to do
			}
	}

	//激活状态的处理，超时时间为1秒
	when(Active, stateTimeout = 1.second) {
		case Event(Flush | StateTimeout, t: Todo) => //超时或者传递Flush命令时
			goto(Idle) using t.copy(queue = Vector.empty) //清空队列
	}

	//when无法处理的状态
	whenUnhandled {
		// common code for both states
		case Event(Queue(obj), t @ Todo(_, v)) =>
			goto(Active) using t.copy(queue = v :+ obj)

		case Event(e, s) =>
			log.warning("received unhandled request {} in state {}/{}", e, stateName, s)
			stay
	}

	initialize()
}
```

基本策略是声明参与者，混合FSM特征并将可能的状态和数据值指定为类型参数。在演员身体内，DSL用于声明状态机：

* `startWith`定义初始状态和初始数据
* `when(<state>) { ... }` 声明每个状态的处理
* 最后使用 `initialize` 启动它，执行转换到初始状态并设置定时器（如果需要的话）。

在这个例子中，
起始状态为 `Idle` 和 `Uninitialized`，此时只处理`SetTarget`消息；
`stay`准备结束该事件的处理以便不离开当前状态，当`using`修饰符 使用新的包含目标actor的`Todo()`对象 来 FSM替换内部状态（在此时是`Uninitialized`）
`Active`状态声明了一个状态超时，这意味着如果在1秒内没有收到消息，就会产生一个`FSM.StateTimeout`消息。
超时与 `Active`状态 下接收`Flush`命令具有相同的效果，即转换回 `Idle` 状态并将内部队列重置为空向量。
但是，消息如何排队呢？由于这两个状态的工作原理是相同的，所以我们利用这个事实：任何不是由`when()`块处理的消息传递给`whenUnhandled()`块处理：

**测试**

```scala
class ParentActor extends Actor {

	val buncherActor = context.actorOf(Props[Buncher], "buncher")
	var i = 0

	override def receive:Receive = {
		case "init" => buncherActor ! SetTarget(self)
		case "add" => buncherActor ! Queue(i); i+=1
		case "flush" => buncherActor ! Flush
		case Batch(queue) => println(queue)
	}
}


object FSMTest extends App{
	val system = ActorSystem("FSMTest")
	val p = system.actorOf(Props[ParentActor], "father")

	p ! "init"
	p ! "add"
	p ! "add"
	p ! "add"
	p ! "add"
	p ! "flush"
	p ! "add"
	p ! "add"
	p ! "add"
	p ! "flush"
}
```

#### （2）参考

FSM特质直接继承自Actor，当你扩展FSM时，你必须意识到一个actor是实际创建的：

FSM特质包含两个类型参数

* 所有状态名类型的超类型，通常是一个密封的特质并使用object继承他
* FSM模块自身跟踪的状态数据的类型

状态数据与状态名一起描述状态机的内部状态；

**定义状态**

```
when(<name>[, stateTimeout = <timeout>])(stateFunction)
```

给定的`name`必须是与FSM特征的第一个类型参数类型兼容的对象。这个对象被用作hash key，所以你必须确保它正确地实现了equals和hashCode。尤其注意的是，它必须是不可变的，最适合的类型是case objects

tateFunction参数是一个`PartialFunction[Event，State]`

**定义初始化状态**

```scala
startWith(state, data[, timeout])
```

**未处理状态**

```scala
whenUnhandled {
  case Event(x: X, data) =>
    log.info("Received unhandled event: " + x)
    stay
  case Event(msg, _) =>
    log.warning("Received unknown event: " + msg)
    goto(Error)
}
```

**初始化状态转化**

```scala
when(SomeState) {
  case Event(msg, _) =>
    goto(Processing) using (newData) forMax (5 seconds) replying (WillDo)
}
```

**监视状态转换**

```scala
onTransition(handler)
```

**转换状态**

**定时器**

```scala
setTimer(name, msg, interval, repeat)
cancelTimer(name)
isTimerActive(name)
	stop([reason[, data]])
```

其他[参见](https://doc.akka.io/docs/akka/current/scala/fsm.html)

### 8、持久化

通过Akka持久化，有状态的actor可以持久化内部状态，以便于在actor启动、或者崩溃、管理员重启或者在集群中迁移时恢复内部状态。Akka持久性背后的关键概念是，只有对actor的内部状态的改变才会被持久化。这些更改只能附加到存储上，没有任何变化，这允许非常高的事务率和高效的复制。

#### （1）依赖

```scala
"com.typesafe.akka" %% "akka-persistence" % "2.5.6"
```

Akka持久性扩展带有一些内置的持久性插件，包括基于内存堆的日志，基于本地文件系统的快照存储和基于LevelDB的日志

基于LevelDB的插件将需要下面的附加依赖声明：

```scala
"org.iq80.leveldb"            % "leveldb"          % "0.9"
"org.fusesource.leveldbjni"   % "leveldbjni-all"   % "1.8"
```

其他[参见](https://doc.akka.io/docs/akka/current/scala/persistence.html)

#### （2）架构

* `PersistentActor`：是一个持久的，有状态的Actor。它能够将事件持久化到日志中，并以线程安全的方式对它们做出反应。它可以用来实现命令以及事件源Actor。当一个持续的actor被启动或重新启动时，日志消息会被重放给这个actor，这样它就可以从这些消息中恢复内部状态。
* `AtLeastOnceDelivery`：使用至少一次的传递语义将消息发送到目的地，同样在发送者和接收者JVM崩溃的情况下。
* `AsyncWriteJournal`：日志存储发送给持久行为者的消息序列。一个应用程序可以控制哪些消息被记录，哪些消息被持续的演员接收而不被记录。日志维护每个消息中增加的highestSequenceNr。日志的存储后端是可插入的。持久性扩展带有一个“leveldb”日志插件，写入本地文件系统。
* `Snapshot store`：快照存储持续存在持续角色内部状态的快照。快照用于优化恢复时间。快照存储的后端存储是可插入的。持久扩展带有一个“本地”快照存储插件，写入本地文件系统。
* `Event sourcing`：基于上述构建模块，Akka持久性为事件源应用程序的开发提供了抽象（参见“事件源”部分）。复制快照存储可用作社区插件。

#### （3）事件源

事件源背后的基本理念非常简单。如果一个持久的actor可以应用到当前状态，那么它将接收一个首先验证的（非持久性）命令。如果验证成功，则从命令生成事件，表示命令的效果。然后这些事件被持续存在，并且在成功的持久化之后被用来改变演员的状态。当执行者需要恢复时，只有持续的事件被重放，我们知道他们可以被成功应用。换句话说，与命令相比，事件在重放到持续的角色时不会失败。当执行者需要恢复时，只有持续的事件被重放，我们知道他们可以被成功应用。换句话说，与命令相比，事件在重放到持续的角色时不会失败。事件源Actor当然也可以处理不改变应用状态的命令，例如查询命令。

Akka持久化使用PersistentActor特质 支持事件源。扩展这个特性的actor使用持久化方法来保存和处理事件。PersistentActor的行为是通过实现receiveRecover和receiveCommand来定义的。以下示例演示了这一点。

```scala
package com.lightbend.akka.sample.persistence

//#persistent-actor-example
import akka.actor._
import akka.persistence._
import com.typesafe.config.ConfigFactory

case class Cmd(data: String) //命令
case class Evt(data: String) //事件

//例子状态：持有事件列表
case class ExampleState(events: List[String] = Nil) {
	//更新事件列表
	def updated(evt: Evt): ExampleState = copy(evt.data :: events)
	//事件尺寸
	def size: Int = events.length
	override def toString: String = events.reverse.toString
}

class ExamplePersistentActor extends PersistentActor {
	//持久化id
	override def persistenceId = "sample-id-1"
	//内部维持的状态
	var state = ExampleState()
	//更新状态
	def updateState(event: Evt): Unit =
		state = state.updated(event)
	//状态内部事件列表的尺寸
	def numEvents =
		state.size

	//接收到回复状态的事件
	override val receiveRecover: Receive = {
		case evt: Evt => updateState(evt)
		case SnapshotOffer(_, snapshot: ExampleState) => state = snapshot
	}

	//接收到命令
	override val receiveCommand: Receive = {
		case Cmd(data) =>
			//持久化事件
			persist(Evt(s"${data}-${numEvents}"))(updateState)
			persist(Evt(s"${data}-${numEvents + 1}")) { event =>
				updateState(event)
				context.system.eventStream.publish(event)
			}
		case "snap" => saveSnapshot(state)
		case "print" => println(state)
	}

}

//#persistent-actor-example

object PersistentActorExample extends App {

	val config = ConfigFactory.load("persistence.conf")
	val system = ActorSystem("example",config)
	val persistentActor = system.actorOf(Props[ExamplePersistentActor], "persistentActor-4-scala")

	persistentActor ! Cmd("foo")
	persistentActor ! Cmd("baz")
	persistentActor ! Cmd("bar")
	persistentActor ! "snap"
	persistentActor ! Cmd("buzz")
	persistentActor ! "print"

	Thread.sleep(10000)
	system.terminate()
}

```

配置文件`persistence.conf`

```
akka.persistence.journal.plugin = "akka.persistence.journal.leveldb"
akka.persistence.snapshot-store.plugin = "akka.persistence.snapshot-store.local"

akka.persistence.journal.leveldb.dir = "target/example/journal"
akka.persistence.snapshot-store.local.dir = "target/example/snapshots"

# DO NOT USE THIS IN PRODUCTION !!!
# See also https://github.com/typesafehub/activator/issues/287
akka.persistence.journal.leveldb.native = false
```

依赖

```scala
  "com.typesafe.akka"          %% "akka-persistence" % "2.5.4",
  "org.iq80.leveldb"            % "leveldb"          % "0.7",
  "org.fusesource.leveldbjni"   % "leveldbjni-all"   % "1.8"
```

**第一次运行**

```
List(foo-0, foo-1, baz-2, baz-3, bar-4, bar-5, buzz-6, buzz-7)
```

**第二次运行**

```
List(foo-0, foo-1, baz-2, baz-3, bar-4, bar-5, buzz-6, buzz-7, foo-8, foo-9, baz-10, baz-11, bar-12, bar-13, buzz-14, buzz-15)
```

**说明**

该示例定义了两种数据类型，Cmd和Evt分别表示命令和事件。 ExamplePersistentActor的状态是包含在ExampleState中的持久化事件数据的列表。

持久化actor的 receiveRecover 方法定义 在恢复期间，如何 处理 Evt 和 SnapshotOffer 来更新状态。持久化actor的 receiveCommand 方法是一个命令处理程序。在这个例子中，一个命令是通过生成一个事件来处理的，然后这个事件被持久化和处理。事件的持久化通过调用 persist 方法，该方法的第一个参数是一个事件，第二个参数是事件处理程序。

persist方法异步持久化事件，事件处理程序为成功持久化事件后执行。成功持久化事件后，将会将事件传递给事件处理器。在事件处理器中也可以回复消息，这样将直接发送到原始发送者。

事件处理程序的主要职责是使用事件数据更改 持久化actor的状态，并通过发布消息向其他人通知成功的状态更改。

当使用`persist`正在持久化事件时。将保证actor将不会收到进一步的指令，在调用相关事件处理程序时。（保证actor的单线程）

如果事件的持久性失败，onPersistFailure将被调用（默认记录错误日志），演员将无条件停止。如果事件的持久性在被存储之前被拒绝，例如由于序列化错误，onPersistRejected将被调用（默认情况下会记录一个警告），并且actor继续下一条消息。

**持久化id**

**恢复**

默认情况下，持久化actor将会自动恢复，在启动和重启时通过重放日志消息。在恢复过程中发送给持久化actor的新消息不会干扰重放的消息。在恢复阶段结束之后，他们被一个持久化actor持久化并接收。

在系统中可以配置最大并发恢复数：

```
akka.persistence.max-concurrent-recoveries = 50
```

**自定义恢复**

默认情况下，首先找到快照进行恢复一部分，然后在使用事件进行恢复

禁用使用快照恢复

```scala
override def recovery =
  Recovery(fromSnapshot = SnapshotSelectionCriteria.None)
```

恢复前457个

```scala
override def recovery = Recovery(toSequenceNr = 457L)
```

禁用使用恢复

```scala
override def recovery = Recovery.none
```

**[持久化与stash](https://doc.akka.io/docs/akka/current/persistence.html?language=scala#internal-stash)**

**宽松的本地一致性要求和高吞吐量的使用情况**
使用`persistAsync(cmd)(...)`
[参见](https://doc.akka.io/docs/akka/current/persistence.html?language=scala#relaxed-local-consistency-requirements-and-high-throughput-use-cases)

其他略

#### （4）快照（Snapshots）

[参见](https://doc.akka.io/docs/akka/current/persistence.html?language=scala#snapshots)

### 9、测试Actor系统

Akka配备了专门的模块akka-testkit来支持测试（添加akka-testkit依赖到项目）

#### （1）异步测试：TestKit

Testkit允许你在一个受控的但是现实的环境中测试你的Actor。当然，环境的定义很大程度上取决于您手头的问题以及您打算测试的级别，从简单的检查到完整的系统测试。

测试的最小设置包括测试程序，测试程序提供期望值，被测试的Acto和接收回复消息的Actor。

TestKit类包含一系列工具，使这个常见任务变得简单。

```scala
package com.lightbend.akka.sample

import akka.actor.ActorSystem
import akka.testkit.{ImplicitSender, TestActors, TestKit}
import org.scalatest.{BeforeAndAfterAll, Matchers, WordSpecLike}

class TestKitTest()
	extends TestKit(ActorSystem("MySpec"))
	with ImplicitSender
	with WordSpecLike with Matchers with BeforeAndAfterAll {

	override def afterAll {
		TestKit.shutdownActorSystem(system)
	}

	"An Echo actor" must {

		"send back messages unchanged" in {
			val echo = system.actorOf(TestActors.echoActorProps)
			echo ! "hello world"
			expectMsg("hello world")
		}

	}
}

```

TestKit包含一个名为testActor的actor，它是使用下面详述的各种expectMsg ...断言来检查消息的入口点。当在特征ImplicitSender中混合时，当从测试过程分派消息时，这个测试参与者被隐式地用作发送者参考。testActor也可以像往常一样传递给其他参与者，通常将其订阅为通知监听器。有一套完整的检查方法，例如接收符合某些标准的所有连续的消息，接收整个固定的消息或类的序列，一段时间内什么都不接收。

传递给TestKit构造函数的ActorSystem可以通过系统成员访问。

记住，在测试结束后（也是在失败的情况下）关闭角色系统，以便所有角色（包括测试角色）都停止。

**内置断言**

上面提到的expectMsg并不是唯一的关于接收消息的断言的方法，全套是这样的：

```scala
val hello: String = expectMsg("hello")
val any: String = expectMsgAnyOf("hello", "world")
val all: immutable.Seq[String] = expectMsgAllOf("hello", "world")
val i: Int = expectMsgType[Int]
expectNoMsg(200.millis)
val two: immutable.Seq[AnyRef] = receiveN(2)
```

所有断言是一个阻塞方法，等待到超时为止，若等待到期望的消息，将所有消息从收件箱中去除。继续执行，否则断言失败。所有断言的返回值都是他所测试过的消息，具体断言函数如下

* `expectMsg[T](d: Duration, msg: T): T` 给定的消息对象必须在指定的时间内被接收;该对象将被返回。
* `expectMsgPF[T](d: Duration)(pf: PartialFunction[Any, T]): T` 给定消息匹配pf项，有匹配通过否者失败
* `expectMsgClass[T](d: Duration, c: Class[T])` 断言给定消息的Class对象
* `expectMsgType[T: Manifest](d: Duration)` 断言消息的类型（与上面比可以包含类型参数）
* `expectMsgAnyOf[T](d: Duration, obj: T*): T` 断言消息是obj中的一个（使用==比较）
* `expectMsgAnyClassOf[T](d: Duration, obj: Class[_ <: T]*): T` 断言消息Class对象为指定中的一个
* `expectMsgAllOf[T](d: Duration, obj: Class[_ <: T]*): T` 期望接收多个消息，内容全部为该断言参数，但是顺序不限
* `expectMsgAllClassOf[T](d: Duration, c: Class[_ <: T]*): Seq[T]` 期望多个消息，内容的Class对象分别为以下内容，一旦全部匹配，立刻返回，其他消息在收件箱
* `expectMsgAllConformingOf[T](d: Duration, c: Class[_ <: T]*): Seq[T]`  在给定超时时间内，期待长度和参数列表长度一致的消息，消息的Class和参数一直
* `expectNoMsg(d: Duration)` 超时时间内，没有消息到来，断言通过
* `receiveN(n: Int, d: Duration): Seq[AnyRef]`必须在给定的时间内收到n封邮件。收到的消息被返回。
* `fishForMessage(max: Duration, hint: String)(pf: PartialFunction[Any, Boolean]): Any`

例子

```scala
package com.lightbend.akka.sample

import akka.actor.ActorSystem
import akka.testkit.{ImplicitSender, TestActors, TestKit}
import org.scalatest.{BeforeAndAfterAll, Matchers, WordSpecLike}

class TestKitTest()
	extends TestKit(ActorSystem("MySpec"))
	with ImplicitSender //混入隐式发送者，直接通过!发送消息，将隐式设置发送者
	with WordSpecLike with Matchers with BeforeAndAfterAll {

	override def afterAll {
		TestKit.shutdownActorSystem(system)
	}

	"An Echo actor" must {

		"send back messages unchanged" in {
			val echo = system.actorOf(TestActors.echoActorProps)
			echo ! "hello world"
			val ret1 = expectMsg("hello world")
			println(ret1)

			echo ! "hello"

			val ret2 = expectMsgPF(){
				case "hello" => "hello"
			}
			println(ret2)



			echo ! "123"
			val ret3 = expectMsgClass(classOf[String])
			println(ret3)

			echo ! Vector(1, 2, 3)
			val ret4 = expectMsgType[Vector[Int]]
			println(ret4)

			echo ! "345"
			val ret5 = expectMsgAnyOf("123","345")
			println(ret5)

			echo ! 1
			val ret6 = expectMsgAnyClassOf(classOf[Int], classOf[String])
			println(ret6)

			echo ! "123"
			echo ! "345"
			echo ! "456"
			val ret7 = expectMsgAllOf("123","345")
			println(ret7)

			echo ! 3
			val ret8 = expectMsgAllClassOf(classOf[String], classOf[Int])
			println(ret8)

			echo ! 1
			echo ! "Stt"
			val ret9 = expectMsgAllConformingOf(classOf[String], classOf[Int])
			println(ret9)

			echo ! 10
			echo ! 11
			val ret10 = receiveN(2)
			println(ret10)
		}

	}
}

```

其他[参见](https://doc.akka.io/docs/akka/current/scala/testing.html)
