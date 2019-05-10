---
title: scala akka 集群
date: 2017-11-19T21:42:07+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/119
  - /detail/119/
tags:
  - scala
---

## 六、集群

***

### 1、集群规范

Akka集群特性提供了容错的、去中心化的、基于集群成员关系点对点的，不存在单点问题、单点瓶颈的服务。其实现原理为闲聊协议和失败检查。

#### （1）集群概念

* 节点（node）：集群中的逻辑成员。允许一台物理机上有多个节点。由元组hostname:port:uid唯一确定。
* 集群（cluster）：由成员关系服务构建的一组节点。
* 领导（leader）：集群中唯一扮演领导角色的节点。
* 种子节点（seed node）：作为其他节点加入集群的连接点的节点。实际上，一个节点可以通过向集群中的任何一个节点发送Join（加入）命令加入集群。

#### （2）集群节点状态

![图8](/res/PYOpODB-ARMMJ77QTA38ggME.png)

状态

* joining：节点正在加入集群时的状态。
* weekly up：配置了akka.cluster.allow-weakly-up-members=on时，启用的状态。
* up：集群中节点的正常状态。
* leaving/exiting：优雅的删除节点时，节点的状态。
* down：标记为已下线的状态。
* removed：墓碑状态，表示已经不再是集群的成员。

动作

* join：加入集群。
* leave：告知节点优雅的离开集群。
* down：标记集群为已下线。

领导有以下职责：

* 将成员转入和转出集群
	* joining -> up
	* exiting -> removed

故障检测和不可达性

* **fd***  其中一个监控节点的故障检测器已经触发，导致被监控节点被标记为不可达
* **unreachable* ** 不可达不是一个真正的成员状态，但更多的是一个标志，除了状态信号，表明集群无法与该节点通话，在不可达之后，故障检测器可以检测到它再次可达，从而移除标志

### 2、简单例子——观察节点声明周期

#### （1）添加依赖

```scala
"com.typesafe.akka" %% "akka-cluster" % "2.5.6"
```

#### （2）创建配置文件

在根目录添加`cluster.conf`

```
akka {
  actor {
    provider = cluster
//    provider = "akka.cluster.ClusterActorRefProvider"
  }
  remote {
    log-remote-lifecycle-events = off
    netty.tcp {
      hostname = "127.0.0.1"
      port = 0
    }
  }

  # 对集群的配置
  cluster {
    # 配置种子节点，新创建的节点加入新节点的接入点地址
    seed-nodes = [
      "akka.tcp://ClusterSystem@127.0.0.1:2551",
      "akka.tcp://ClusterSystem@127.0.0.1:2552"]

    # 自动停机对于生产部署是不安全的。
    # 你可能想在开发过程中使用它，在文档中阅读更多关于它的信息。
    # 当检测到不可达状态10s后就自动终止
    auto-down-unreachable-after = 10s
  }
}
```

配置说明

* 首先任何一个集群都需要种子节点，作为基本的加入集群的连接点。本例中以本地的两个节点（分别监听2551和2552端口）作为种子节点。
* 无论配置了多少个种子节点，除了在seed-nodes中配置的第一个种子节点需要率先启动之外（否则其它种子节点无法初始化并且其它节点也无法加入），其余种子节点都是启动顺序无关的。
* 第一个节点需要率先启动的另一个原因是如果每个节点都可以率先启动，那么有可能造成一个集群出现几个种子节点都启动并且加入了自己的集群，此时整个集群实际上分裂为几个集群，造成孤岛。当你启动了超过2个以上的种子节点，那么第一个启动的种子节点是可以关闭下线的。
* 如果第一个种子节点重启了，它将不会在自己创建集群而是向其它种子节点发送Join消息加入已存在的集群。

#### （3）创建集群状态监听器Actor

```scala
package com.lightbend.akka.sample.cluster

import akka.actor.{Actor, ActorLogging, ActorSystem, Props}
import akka.cluster.Cluster
import akka.cluster.ClusterEvent._
import com.typesafe.config.ConfigFactory

class SimpleClusterListener extends Actor with ActorLogging {

	val cluster = Cluster(context.system)

	// 监听集群状态
	override def preStart(): Unit = {
		//订阅集群监听器
		cluster.subscribe(self, initialStateMode = InitialStateAsEvents,
			classOf[MemberEvent], classOf[UnreachableMember])
	}

	override def postStop(): Unit = cluster.unsubscribe(self)

	def receive:Receive = {
		case MemberJoined(member) =>
			log.info(" {} 成员处于Joining", member.address)
		case MemberUp(member) =>
			log.info(" {} 成员处于Up", member.address)
		case MemberLeft(member) =>
			log.info(" {} 成员处于Leaving", member.address)
		case UnreachableMember(member) =>
			log.info(" {} 成员被检测成unreachable", member)
		case MemberRemoved(member, previousStatus) =>
			log.info(
				"{} 成员正在Removed，之前的状态为 {}",
				member.address, previousStatus)
		case _: MemberEvent => // ignore
	}
}

object SimpleClusterApp {
	def main(args: Array[String]): Unit = {
		//启动时指定端口
		val port =
			if (args.isEmpty) "0"
			else args(0)

		//读取配置配置
		val config = ConfigFactory.parseString(s"akka.remote.netty.tcp.port = ${port}")
		  .withFallback(ConfigFactory.load("cluster.conf"))

		//创建Actor系统
		val system = ActorSystem(name="ClusterSystem",config=config)
		system.actorOf(Props[SimpleClusterListener],"clusterListener")

		//输出一些内容
		val cluster = Cluster(system)
		cluster.registerOnMemberRemoved(println("离开集群。 我应该清理..."))
		cluster.registerOnMemberUp(println("连接到集群。 做一些设置..."))
		println("actor system 已经启动!")
		scala.io.StdIn.readLine()

		system.terminate()
	}
}
```

#### （4）测试集群

**在三个终端运行sbt**

**启动种子节点**

进入第一个终端，启动种子节点

```
runMain com.lightbend.akka.sample.cluster.SimpleClusterApp 2551
```

这是集群的第一个节点，是种子节点。会看到以下输出（去除不必要内容）

```
[info] Running com.lightbend.akka.sample.cluster.SimpleClusterApp 2551
[INFO] [11/20/2017 13:56:43.976] [run-main-1] [akka.remote.Remoting] Starting remoting
[INFO] [11/20/2017 13:56:44.130] [run-main-1] [akka.remote.Remoting] Remoting started; listening on addresses :[akka.tcp://ClusterSystem@127.0.0.1:2551]

//...一个异常

actor system 已经启动!

//...其他信息

[INFO] [11/20/2017 13:56:49.274] [ClusterSystem-akka.actor.default-dispatcher-14][akka.cluster.Cluster(akka://ClusterSystem)] Cluster Node [akka.tcp://ClusterSystem@127.0.0.1:2551] - Leader is moving node [akka.tcp://ClusterSystem@127.0.0.1:2551] to [Up]
连接到集群。 做一些设置...
[INFO] [11/20/2017 13:56:49.282] [ClusterSystem-akka.actor.default-dispatcher-16] [akka.tcp://ClusterSystem@127.0.0.1:2551/user/clusterListener]  akka.tcp://ClusterSystem@127.0.0.1:2551 成员处于Up
```

输出说明

* `:2551`种子节点的启动
* `:2551`进入up状态

**启动普通节点**

进入第二个终端，启动普通节点

```
runMain com.lightbend.akka.sample.cluster.SimpleClusterApp 0
```

第二终端输出

```
[INFO] [11/20/2017 14:03:18.443] [run-main-0] [akka.remote.Remoting] Starting remoting
[INFO] [11/20/2017 14:03:18.666] [run-main-0] [akka.remote.Remoting] Remoting started; listening on addresses :[akka.tcp://ClusterSystem@127.0.0.1:3391]

//...

[INFO] [11/20/2017 14:03:19.364] [ClusterSystem-akka.actor.default-dispatcher-19] [akka.cluster.Cluster(akka://ClusterSystem)] Cluster Node [akka.tcp://ClusterSystem@127.0.0.1:3391] - Welcome from [akka.tcp://ClusterSystem@127.0.0.1:2551]
[INFO] [11/20/2017 14:03:19.386] [ClusterSystem-akka.actor.default-dispatcher-4] [akka.tcp://ClusterSystem@127.0.0.1:3391/user/clusterListener]  akka.tcp://ClusterSystem@127.0.0.1:2551 成员处于Up
[INFO] [11/20/2017 14:03:19.392] [ClusterSystem-akka.actor.default-dispatcher-4] [akka.tcp://ClusterSystem@127.0.0.1:3391/user/clusterListener]  akka.tcp://ClusterSystem@127.0.0.1:3391 成员处于Joining
[WARN] [11/20/2017 14:03:19.972] [New I/O boss #3] [NettyTransport(akka://ClusterSystem)] Remote connection to [null] failed with java.net.ConnectException: Connection refused: no further information: /127.0.0.1:2552
[INFO] [11/20/2017 14:03:20.264] [ClusterSystem-akka.actor.default-dispatcher-15] [akka.tcp://ClusterSystem@127.0.0.1:3391/user/clusterListener]  akka.tcp://ClusterSystem@127.0.0.1:3391 成员处于Up
```

输出说明

* `:3391` 普通节点启动
* `:3391` 根据`seed-nodes`配置尝试连接种子节点，收到来自`:2551`的welcome，因为`:2552`没有启动所以连接失败
* `:3391` 收到`:2551`的状态，应该向`:2551`发起join
* `:3391` 收到`:3391`正在请求joining状态
* `:2551` 收到`joining` 处理完毕。`:3391` 收到`:3391`正在请求up状态

同时终端1也会收到状态信息

**启动第二个种子节点**

```
runMain com.lightbend.akka.sample.cluster.SimpleClusterApp 2552
```

输出类似刚刚第二个终端的输出

**启动关闭普通节点**

在第二终端按回车

第二终端结束，第一第三终端输出

```
Member(address = akka.tcp://ClusterSystem@127.0.0.1:3391, status = Up) 成员被检测成unreachable
akka.tcp://ClusterSystem@127.0.0.1:3391 成员正在Removed，之前的状态为 Down
```

**在此启动普通节点**

进入第二个终端，启动普通节点

```
runMain com.lightbend.akka.sample.cluster.SimpleClusterApp 0
```

输出类似于第一次启动

**关闭:2551种子节点**

在第一终端按回车

**关闭再启动普通节点**

在第二终端按回车，然后

```
runMain com.lightbend.akka.sample.cluster.
```

此时就会向`:2552`发起join

**关闭:2552种子节点**

**关闭普通节点**

**启动普通节点**

此时没有其他节点运行，该普通节点不断尝试连接种子节点
此时即使启动2552，也是不行的。只有第一个种子节点被启动整个集群才会正常工作
当集群正常工作，关闭了第一个种子节点，普通节点还是可以正常启动的加入集群的只要指定的种子节点还有一个在线

#### （5）总结

* 集群中在运行时所有的节点的地位都是等价的
* 只有在启动时被指定加入集群的节点才会成为种子节点
* 整个集群的第一个节点（种子节点）的启动的地址端口也就是（`akka.remote.netty.tcp`）必须与集群配置的第一个种子节点（akka.cluster.seed-nodes[0]）相同，否者将会陷入不断寻找种子节点的尝试中
* 在运行中的集群任意一个节点都可以作为种子节点作为加入集群的入口

### 3、例子二——利用集群实现分布式计算

> [参考](http://blog.csdn.net/TIGER_XC/article/details/73777106)

一个简单分布式计算，将加减乘除计算任务分别部署到不同的节点计算。

设计：前端负责承接任务，分发任务给后端进行计算

#### （1）手工进行集群的负载分配

**消息**

```scala
package com.lightbend.akka.sample.cluster.example2

/**
  * @author Rectcircle
  */
object Message {
	sealed trait MathOps //数学操作消息
	case class Add(x: Int, y: Int) extends MathOps
	case class Sub(x: Int, y: Int) extends MathOps
	case class Mul(x: Int, y: Int) extends MathOps
	case class Div(x: Int, y: Int) extends MathOps

	sealed trait ClusterMsg //集群消息
	case class RegisterBackendActor(role: String) extends ClusterMsg
}
```

**后端**

`CalculateActor.scala`承接具体运算

```scala
package com.lightbend.akka.sample.cluster.example2.backend

import akka.actor._
import com.lightbend.akka.sample.cluster.example2.Message._


//负责计算的Actor，应该分成4个，为了简化写成一个
object CalculateActor {
	def props = Props(new CalculateActor)
}
class CalculateActor extends Actor {
	override def receive: Receive = {
		case Add(x,y) =>
			println(s"$x + $y 由 ${self} 计算； 结果=${x+y}")
		case Sub(x,y) =>
			println(s"$x - $y 由 ${self} 计算； 结果=${x - y}")
		case Mul(x,y) =>
			println(s"$x * $y 由 ${self} 计算； 结果=${x * y}")
		case Div(x,y) =>
			println(s"$x / $y 由 ${self} 计算； 结果=${x / y}")
	}

	override def preRestart(reason: Throwable, message: Option[Any]): Unit = {
		println(s"重新启动 CalculateActor: ${reason.getMessage}")
		super.preRestart(reason, message)
	}
}
```

`CalculateSupervisor.scala`管理计算单元的异常

```scala
package com.lightbend.akka.sample.cluster.example2.backend

import akka.actor.{Actor, ActorRef, ActorSystem, OneForOneStrategy, Props, RootActorPath, SupervisorStrategy}
import akka.cluster.Cluster
import akka.cluster.ClusterEvent.MemberUp
import com.lightbend.akka.sample.cluster.example2.Message.RegisterBackendActor
import com.typesafe.config.ConfigFactory

import scala.concurrent.duration._

//监视计算actor的异常
object CalculateSupervisor{
	def props(role: String) = Props(new CalculateSupervisor(role))
}
class CalculateSupervisor(mathOps: String) extends Actor {
	//当发生ArithmeticException异常时直接恢复
	def decider: PartialFunction[Throwable,SupervisorStrategy.Directive] = {
		case _: ArithmeticException => SupervisorStrategy.Resume
	}

	//其他异常默认处理
	override def supervisorStrategy: SupervisorStrategy =
		OneForOneStrategy(maxNrOfRetries = 5, withinTimeRange = 5.seconds){
			decider.orElse(SupervisorStrategy.defaultDecider)
		}

	//创建计算actor
	val calcActor:ActorRef = context.actorOf(CalculateActor.props,"calculateActor")
	//创建集群对象
	val cluster = Cluster(context.system)

	//订阅集群成员Up消息
	override def preStart(): Unit = {
		cluster.subscribe(self,classOf[MemberUp])
		super.preStart()
	}
	override def postStop(): Unit ={
		cluster.unsubscribe(self)
		super.postStop()
	}

	override def receive: Receive = {
		case MemberUp(m) => //收到集群中有成员up消息
			if (m.hasRole("frontend")) { //如果这个成员是frontend（前端角色）
				//向该成员发送注册后端成员的消息，该成员的角色为mathOps
				context.actorSelection(RootActorPath(m.address)+"/user/frontend") !
				  RegisterBackendActor(mathOps)
			}
		//其他类型消息就向计算模块转发
		case msg@ _ => calcActor.forward(msg)
	}

}
```

`BackEnd.scala`后端入口

```scala
package com.lightbend.akka.sample.cluster.example2.backend

import akka.actor.ActorSystem
import com.lightbend.akka.sample.cluster.example2.backend.CalculateSupervisor.props
import com.typesafe.config.ConfigFactory

object BackEnd {
	def create(role: String): Unit = {
		//创建一个后端计算者实例
		val config = ConfigFactory.parseString("Backend.akka.cluster.roles = [\""+role+"\"]")
		  .withFallback(ConfigFactory.load("calculate.conf"))
		  .getConfig("Backend")
		val system = ActorSystem("calculateClusterSystem",config)
		system.actorOf(props(role),"calculator")
	}
}
```

**前端**

`CalculateRouter.scala`

```scala
package com.lightbend.akka.sample.cluster.example2.frontend

import akka.actor.{Props, _}
import com.lightbend.akka.sample.cluster.example2.Message._
import com.typesafe.config.ConfigFactory

//计算部件的前端
object CalculateRouter {
	def props:Props = Props[CalculateRouter]
}


class CalculateRouter extends Actor {

	//注册了的后台节点的容器
	var nodes: Map[String,ActorRef] = Map()

	override def receive: Receive = {
		//接收到后台注册信息
		case RegisterBackendActor(role) =>
			nodes += (role -> sender()) //将该节点容器
			context.watch(sender())
		//收到计算命令
		case add: Add => routeCommand("adder", add)
		case sub: Sub => routeCommand("substractor",sub)
		case mul: Mul => routeCommand("multiplier",mul)
		case div: Div => routeCommand("divider",div)

		//后台节点中止，从节点列表中移除
		case Terminated(ref) =>    //remove from register
			nodes = nodes.filter { case (_,r) => r != ref}

	}

	//下发计算消息
	def routeCommand(role: String, ops: MathOps): Unit = {
		nodes.get(role) match {
			case Some(ref) => ref ! ops
			case None =>
				println(s"$role 没有注册!")
		}
	}
}
```

`FrontEnd.scala`前端入口

```scala
package com.lightbend.akka.sample.cluster.example2.frontend

import akka.actor.{ActorRef, ActorSystem}
import com.typesafe.config.ConfigFactory

object FrontEnd {
	def create:ActorRef = {
		//必须在任何后端之前加载这个种子节点
		val config = ConfigFactory.load("calculate.conf")
		  .getConfig("Frontend")
		val system = ActorSystem("calculateClusterSystem", config)
		system.actorOf(CalculateRouter.props,"frontend")
	}
}
```

**配置文件**

`cluster.conf`

```scala
akka {
  actor {
    provider = cluster
//    provider = "akka.cluster.ClusterActorRefProvider"
  }
    remote {
    log-remote-lifecycle-events = off
    netty.tcp {
      hostname = "127.0.0.1"
      port = 0
    }
  }

  # 对集群的配置
    cluster {
    # 配置种子节点，新创建的节点加入新节点的接入点地址
    seed-nodes = [
      "akka.tcp://ClusterSystem@127.0.0.1:2551",
      "akka.tcp://ClusterSystem@127.0.0.1:2552"]

    # 自动停机对于生产部署是不安全的。
    # 你可能想在开发过程中使用它，在文档中阅读更多关于它的信息。
    # 当检测到不可达状态10s后就自动终止
    auto-down-unreachable-after = 10s
  }
}
```

**测试**

```scala
package com.lightbend.akka.sample.cluster.example2.frontend

import akka.actor.{ActorRef, ActorSystem}
import com.typesafe.config.ConfigFactory

object FrontEnd {
	def create:ActorRef = {
		//必须在任何后端之前加载这个种子节点
		val config = ConfigFactory.load("calculate.conf")
		  .getConfig("Frontend")
		val system = ActorSystem("calculateClusterSystem", config)
		system.actorOf(CalculateRouter.props,"frontend")
	}
}
```

**关键输出**

```scala
3 * 7 由 Actor[akka://calculateClusterSystem/user/calculator/calculateActor#-54638959] 计算； 结果=21
10 + 3 由 Actor[akka://calculateClusterSystem/user/calculator/calculateActor#-678012618] 计算； 结果=13
8 / 2 由 Actor[akka://calculateClusterSystem/user/calculator/calculateActor#728838763] 计算； 结果=4
45 - 3 由 Actor[akka://calculateClusterSystem/user/calculator/calculateActor#-927077090] 计算； 结果=42
[WARN] [11/20/2017 16:52:06.660] [calculateClusterSystem-akka.actor.default-dispatcher-2][akka://calculateClusterSystem/user/calculator/calculateActor] / by zero
```

#### （2）Routing方式来分配负载

使用akka提供的route自动的根据routing算法进行负载均衡。在此使用ConsistentHashing-Router模式

**修改消息类型**

使消息可序列化，并创建根据hash分类，去除了手动管理

```scala
package com.lightbend.akka.sample.cluster.example3

import akka.routing.ConsistentHashingRouter.ConsistentHashable

/**
  * @author Rectcircle
  */
object Message {

	class MathOps(hashKey: String) extends Serializable with ConsistentHashable {
		override def consistentHashKey: Any = hashKey
	}
	case class Add(x: Int, y: Int) extends MathOps("adder")
	case class Sub(x: Int, y: Int) extends MathOps("substractor")
	case class Mul(x: Int, y: Int) extends MathOps("multiplier")
	case class Div(x: Int, y: Int) extends MathOps("divider")

}
```

**后端相关代码**

```scala
package com.lightbend.akka.sample.cluster.example3.backend

import akka.actor.ActorSystem
import com.typesafe.config.ConfigFactory

object BackEnd {
	def create(port: Int): Unit = {
		//创建一个后端计算者节点2551为种子节点
		val config = ConfigFactory
		  //节点角色为backend
		  .parseString("akka.cluster.roles = [backend]")
		  .withFallback(ConfigFactory.parseString(s"akka.remote.netty.tcp.port=$port"))
		  .withFallback(ConfigFactory.load("calculate2.conf"))
		val system = ActorSystem("calculateClusterSystem",config)
		system.actorOf(CalculateSupervisor.props,"calculator")
	}
}

import akka.actor._
import com.lightbend.akka.sample.cluster.example3.Message._


//负责计算的Actor，应该分成4个，为了简化写成一个
object CalculateActor {
	def props:Props = Props[CalculateActor]
}
class CalculateActor extends Actor {
	override def receive: Receive = {
		case Add(x,y) =>
			println(s"$x + $y 由 ${self} 计算； 结果=${x+y}")
		case Sub(x,y) =>
			println(s"$x - $y 由 ${self} 计算； 结果=${x - y}")
		case Mul(x,y) =>
			println(s"$x * $y 由 ${self} 计算； 结果=${x * y}")
		case Div(x,y) =>
			println(s"$x / $y 由 ${self} 计算； 结果=${x / y}")
	}

	override def preRestart(reason: Throwable, message: Option[Any]): Unit = {
		println(s"重新启动 CalculateActor: ${reason.getMessage}")
		super.preRestart(reason, message)
	}
}


import akka.actor.{Actor, ActorRef, OneForOneStrategy, Props, SupervisorStrategy}

import scala.concurrent.duration._

//监视计算actor的异常
object CalculateSupervisor{
	def props = Props(new CalculateSupervisor)
}
class CalculateSupervisor extends Actor {
	//当发生ArithmeticException异常时直接恢复
	def decider: PartialFunction[Throwable,SupervisorStrategy.Directive] = {
		case _: ArithmeticException => SupervisorStrategy.Resume
	}

	//其他异常默认处理
	override def supervisorStrategy: SupervisorStrategy =
		OneForOneStrategy(maxNrOfRetries = 5, withinTimeRange = 5.seconds){
			decider.orElse(SupervisorStrategy.defaultDecider)
		}

	//创建计算actor
	val calcActor:ActorRef = context.actorOf(CalculateActor.props,"calculateActor")

	override def receive: Receive = {
		//其他类型消息就向计算模块转发
		case msg@ _ => calcActor.forward(msg)
	}

}
```

**前端**

```scala
package com.lightbend.akka.sample.cluster.example3.frontend

import akka.actor.{Props, _}
import akka.routing.FromConfig

//计算部件的前端
object CalculateRouter {
	def props:Props = Props[CalculateRouter]
}


class CalculateRouter extends Actor {

	// 从配置中读取路由配置并获取到该Actor
	val calculateRouter:ActorRef = context.actorOf(FromConfig.props(Props.empty),
		name = "calculateRouter")

	override def receive: Receive = {
		//收到计算命令，转发消息到路由
		case msg@ _ =>
			println("================CalculateRouter===============")
			calculateRouter forward msg
	}

}

import akka.actor.{ActorRef, ActorSystem}
import com.typesafe.config.ConfigFactory

object FrontEnd {
	def create:ActorRef = {
		//必须在任何后端之前加载这个种子节点
		val config = ConfigFactory.load("hashing.conf")
		val system = ActorSystem("calculateClusterSystem", config)
		system.actorOf(CalculateRouter.props,"frontend")
	}
}
```

**配置文件**

`calculate2.conf`

```
akka {
  actor {
    provider = cluster
  }
  remote {
    log-remote-lifecycle-events = off
    netty.tcp {
      hostname = "127.0.0.1"
      port = 0
    }
  }

  cluster {
    seed-nodes = [
      "akka.tcp://calculateClusterSystem@127.0.0.1:2551"]

    # auto downing is NOT safe for production deployments.
    # you may want to use it during development, read more about it in the docs.
    auto-down-unreachable-after = 10s
  }
}
```

`hashing.conf`

```
include "calculate2"
akka.cluster.roles = [frontend]
akka.actor.deployment {
  //路由的配置
  /frontend/calculateRouter {
    //hash组方式
    router = consistent-hashing-group
    //routees路径
    routees.paths = ["/user/calculator"]
    //集群配置
    cluster {
      enabled = on //开启集群
      allow-local-routees = on //允许本地
      use-role = backend //routees角色名称 backend
    }
  }
}
```

**测试代码`CalculateApp.scala`**

```scala
package com.lightbend.akka.sample.cluster.example3

import com.lightbend.akka.sample.cluster.example3.Message._
import com.lightbend.akka.sample.cluster.example3.backend.BackEnd
import com.lightbend.akka.sample.cluster.example3.frontend.FrontEnd

object CalculateApp extends App {

	BackEnd.create(2551)   //seed-node
	BackEnd.create(0)      //创建普通节点
	BackEnd.create(0)
	BackEnd.create(0)
	BackEnd.create(0)
	BackEnd.create(0)

	Thread.sleep(2000)

	//创建一个前端节点
	//该前端节点包含一个CalculateRouter actor
	//该actor包含一个从配置中获取到的router actor实例 叫做 calculateRouter，
	//该router配置在hashing.conf中定义
	//他将会在集群中查找所有角色为frontend，路径为/user/calculator的routees
	val router = FrontEnd.create


	Thread.sleep(5000)
	//根据消息的不同，运算会发送到不同的Actor中进行
	router ! Add(10,3)
	router ! Mul(3,7)
	router ! Div(8,2)
	router ! Sub(45, 3)
	router ! Div(8,0)

	Thread.sleep(2000)

	router ! Add(10,3)
	router ! Mul(3,7)
	router ! Div(8,2)
	router ! Sub(45, 3)
	router ! Div(8,0)
}
```

**关键输出**

```
45 - 3 由 Actor[akka://calculateClusterSystem/user/calculator/calculateActor#-641100062] 计算； 结果=42
10 + 3 由 Actor[akka://calculateClusterSystem/user/calculator/calculateActor#-1012567989] 计算； 结果=13
3 * 7 由 Actor[akka://calculateClusterSystem/user/calculator/calculateActor#-781704072] 计算； 结果=21
8 / 2 由 Actor[akka://calculateClusterSystem/user/calculator/calculateActor#-781704072] 计算； 结果=4
[WARN] [11/20/2017 20:28:10.342] [calculateClusterSystem-akka.actor.default-dispatcher-6] [akka://calculateClusterSystem/user/calculator/calculateActor] / by zero

10 + 3 由 Actor[akka://calculateClusterSystem/user/calculator/calculateActor#-1012567989] 计算； 结果=13
3 * 7 由 Actor[akka://calculateClusterSystem/user/calculator/calculateActor#-781704072] 计算； 结果=21
8 / 2 由 Actor[akka://calculateClusterSystem/user/calculator/calculateActor#-781704072] 计算； 结果=4
45 - 3 由 Actor[akka://calculateClusterSystem/user/calculator/calculateActor#-641100062] 计算； 结果=42
[WARN] [11/20/2017 20:28:12.314] [calculateClusterSystem-akka.actor.default-dispatcher-19] [akka://calculateClusterSystem/user/calculator/calculateActor] / by zero
```

#### （3）自动Routing模式

Akka-Cluster提供的Adaptive-Group是一种比较智能化的自动Routing模式，它是通过对各集群节点的具体负载情况来分配任务的。用户只需要定义adaptive-group的配置，按情况增减集群节点以及在不同的集群节点上构建部署Routee都是自动的。Adaptive-Group-Router可以在配置文件中设置
在（2）中添加

**配置`adaptive.conf`**

```
include "calculate2"

akka.cluster.min-nr-of-members = 3

akka.cluster.role {
  frontend.min-nr-of-members = 1
  backend.min-nr-of-members = 2
}

akka.actor.deployment {
  /frontend/adaptive/calculateRouter {
    # Router type provided by metrics extension.
    router = cluster-metrics-adaptive-group
    # Router parameter specific for metrics extension.
    # metrics-selector = heap
    # metrics-selector = load
    # metrics-selector = cpu
    metrics-selector = mix
    #
    nr-of-instances = 100
    routees.paths = ["/user/calculator"]
    cluster {
      enabled = on
      use-role = backend
      allow-local-routees = off
    }
  }
}
```

**测试**

`CalculateApp2.scala`

```scala
package com.lightbend.akka.sample.cluster.example3

import akka.actor.{Actor, ActorSystem, Props}
import akka.cluster.Cluster
import com.lightbend.akka.sample.cluster.example3.Message._
import com.lightbend.akka.sample.cluster.example3.backend.BackEnd
import com.lightbend.akka.sample.cluster.example3.frontend.{CalculateRouter, FrontEnd}
import com.typesafe.config.ConfigFactory

import scala.concurrent.duration._
import scala.util.Random

class RouterRunner extends Actor {
	val jobs = List(Add,Sub,Mul,Div)
	import context.dispatcher

	val calcRouter = context.actorOf(CalculateRouter.props,"adaptive")
	context.system.scheduler.schedule(3.seconds, 3.seconds, self, "DoRandomMath")

	override def receive: Receive = {
		case  _ => calcRouter ! anyMathJob
	}
	def anyMathJob: MathOps =
		jobs(Random.nextInt(4))(Random.nextInt(100), Random.nextInt(100))
}


object CalculateApp2 extends App {
	BackEnd.create(2551)   //seed-node
	BackEnd.create(0)      //创建普通节点

	Thread.sleep(2000)

	val config = ConfigFactory
	  .parseString("akka.cluster.roles = [frontend]")
	  .withFallback(ConfigFactory.load("adaptive"))

	val calcSystem = ActorSystem("calculateClusterSystem",config)
	Cluster(calcSystem) registerOnMemberUp {
		val _ = calcSystem.actorOf(Props[RouterRunner],"frontend")
	}
}
```

**添加依赖**

```scala
	"com.typesafe.akka" %% "akka-cluster-metrics" % akkaVersion,
```

### 4、Cluster Usage

#### （1）例子

参见 [2、简单例子——观察节点声明周期](#2、简单例子——观察节点声明周期)

#### （2）加入种子节点

一个新的节点准备加入集群所联系的节点称为种子节点。加入集群后，种子节点就不是特殊的。

当一个新的节点启动时，会向所有的种子节点发送消息，然后以最先回复的种子节点作为接入点加入集群，如果没有一个节点回复，他会一直重试。

种子节点的配置

```
akka.cluster.seed-nodes = [
  "akka.tcp://ClusterSystem@host1:2552",
  "akka.tcp://ClusterSystem@host2:2552"]
```

或者使用jvm参数

```
-Dakka.cluster.seed-nodes.0=akka.tcp://ClusterSystem@host1:2552
-Dakka.cluster.seed-nodes.1=akka.tcp://ClusterSystem@host2:2552
```

这种配置通常由外部工具动态创建。

种子节点可以以任何顺序启动，并且不需要运行所有的种子节点，但配置为种子节点配置列表中第一个元素的节点必须在最初启动集群时启动，否则其他种子节点将不会初始化，其他节点无法加入集群。否者可能一个集群可能分裂成几个孤岛。

一旦有两个以上的种子节点启动，关闭第一个种子节点也没有问题。如果第一个种子节点重新启动，它将首先尝试加入现有群集中的其他种子节点。请注意，如果您同时停止所有种子节点，并使用相同的种子节点配置重新启动它们，则它们将自行加入并形成新的群集，而不是加入现有群集的剩余节点。这可能是不希望的，应该通过列出几个节点作为冗余的种子节点来避免，并且不要同时停止所有节点。

您也可以使用`Cluster(system).joinSeedNodes`以编程方式加入，这在使用某些外部工具或API在启动时动态发现其他节点时很有吸引力。当使用joinSeedNodes时，除了应该是第一个种子节点的节点之外，不应该包含节点本身，而应该首先放入参数joinSeedNodes中。

在配置属性seed-node-timeout中定义的时间段之后，不成功尝试联系种子节点将自动重试。在配置的retry-unsuccessful-join-after之后，会自动重试尝试加入特定种子节点的尝试。重试意味着它试图联系所有的种子节点，然后加入首先回答的节点。如果种子节点列表中的第一个节点无法联系配置的种子节点超时内的任何其他种子节点，它们将自行加入。

给定种子节点的连接将默认无限期地重试，直到成功连接。如果配置超时失败，该进程可以中止。当中止时，它将运行Coordinated Shutdown（协调关闭），默认情况下会终止ActorSystem。 CoordinatedShutdown也可以配置为退出JVM。定义这个超时是非常有用的，如果种子节点是动态组装的，并且在尝试失败之后尝试使用新的种子节点重新开始。

```
akka.cluster.shutdown-after-unsuccessful-join-seed-nodes = 20s
akka.coordinated-shutdown.terminate-actor-system = on
```

您可以加入群集中的任何节点。它不必配置为种子节点。请注意，您只能加入到现有集群成员，这意味着为了第一个节点必须将种子设置成自己，然后以下节点可以加入它们以组成一个集群。

参与者系统只能加入一次集群。其他尝试将被忽略。成功加入后，必须重新启动才能加入另一个群集或再次加入同一个群集。重启后可以使用相同的主机名和端口，当它成为集群中已有成员的新化身，尝试加入时，现有的成员将被从集群中删除，然后它将被允许加入。

**注意：**ActorSystem的名称必须与群集的所有成员相同。这个名字是在你启动ActorSystem的时候给出的。

#### （3）Downing

当失败探测器认为成员不可达时，领导者不能去让其履行职责。这个成员必须可达，否者将其状态改变为：down。将状态更改为“down”可以自动或手动执行。

编程方式：

```scala
Cluster(system).down(address)
```

自动超时方式（不建议）

```scala
akka.cluster.auto-down-unreachable-after = 120s
```

#### （4）Leaving

有两种方法可以从群集中删除成员。

当成员不可达，可以手动关闭或超时关闭。

更优雅方式是告诉集群，要离开

```scala
val cluster = Cluster(system)
cluster.leave(cluster.selfAddress)
```

群集节点将其自身视为退出时，协调关闭将自动运行。使用Akka集群时，会自动添加适当离开集群的任务（包括集群单例和集群分片的正常关闭）

通常这是自动处理的，但是在这个过程中出现网络故障的情况下，可能仍然需要将节点的状态设置为`Down`以完成删除。

#### （5）WeaklyUp的成员

如果一个节点`unreachable`，那么 `gossip` 收敛是不可能的，因此任何 `leader` 的行动也是不可能的。但是，在这种情况下，我们仍然可能需要新节点加入群集。

加入成员将被提升为WeaklyUp，如果不能达成融合，则成为集群的一部分。一旦 `gossip` 趋于一致，领导者将把`WeaklyUp`成员移到`Up`。

此功能默认启用，但可以使用配置选项禁用：

```
akka.cluster.allow-weakly-up-members = off
```

你可以订阅 `WeaklyUp` 来了解该成员是否处于这种状态，但是在网络的另一端不会知道该成员的存在。您不应将WeaklyUp成员计入法定人数。

#### （6）订阅集群事件

```scala
cluster.subscribe(self, classOf[MemberEvent], classOf[UnreachableMember])
```

更多参见以上两个例子

下面还有一个例子：监听集群成员声明周期事件，实现后端节点在前端的注册

消息

```scala
final case class TransformationJob(text: String)
final case class TransformationResult(text: String)
final case class JobFailed(reason: String, job: TransformationJob)
case object BackendRegistration
```

后端工作actor

```scala
class TransformationBackend extends Actor {

  val cluster = Cluster(context.system)

  // subscribe to cluster changes, MemberUp
  // re-subscribe when restart
  override def preStart(): Unit = cluster.subscribe(self, classOf[MemberUp])
  override def postStop(): Unit = cluster.unsubscribe(self)

  def receive = {
    case TransformationJob(text) => sender() ! TransformationResult(text.toUpperCase)
    case state: CurrentClusterState =>
      state.members.filter(_.status == MemberStatus.Up) foreach register
    case MemberUp(m) => register(m)
  }

  def register(member: Member): Unit =
    if (member.hasRole("frontend"))
      context.actorSelection(RootActorPath(member.address) / "user" / "frontend") !
        BackendRegistration
}
```

前端负责任务分发的actor

```scala
class TransformationFrontend extends Actor {

  var backends = IndexedSeq.empty[ActorRef]
  var jobCounter = 0

  def receive = {
    case job: TransformationJob if backends.isEmpty =>
      sender() ! JobFailed("Service unavailable, try again later", job)

    case job: TransformationJob =>
      jobCounter += 1
      backends(jobCounter % backends.size) forward job

    case BackendRegistration if !backends.contains(sender()) =>
      context watch sender()
      backends = backends :+ sender()

    case Terminated(a) =>
      backends = backends.filterNot(_ == a)
  }
}
```

例子[github地址](https://github.com/akka/akka-samples/tree/2.5/akka-sample-cluster-scala)

#### （7）节点角色

并不是所有节点都需要执行相同的功能：可能有一个运行Web前端的子集，一个运行数据访问层，一个运行数据运算。部署Actor（例如通过集群感知路由器）可以考虑节点角色来实现这种责任分配。

一个节点的角色在名为akka.cluster.roles的配置属性中定义，通常在启动脚本中定义为系统属性或环境变量。

节点的角色是MemberEvent中可以订阅的成员信息的一部分。

#### （8）How To Startup when Cluster Size Reached

一个常见的用例是 在集群已经初始化，成员已经加入，集群达到了一定的规模 后启动Actor

使用配置选项，您可以在领导者将“joining”成员的成员状态更改为“Up”之前定义 **所需的成员数量**

```
akka.cluster.min-nr-of-members = 3
```

以类似的方式，您可以在领导者将“joining”成员的成员状态更改为“Up”之前，定义**所需角色成员的数量**

```
akka.cluster.role {
  frontend.min-nr-of-members = 1
  backend.min-nr-of-members = 2
}
```

你可以在一个registerOnMemberUp回调中启动Actor，当前成员状态改变为“Up”时将被调用，即该群集具有至少定义数量的成员。

这个回调可以用于除了开始角色以外的其他事情。

参见上面两个例子

#### （9）当成员被删除时如何清理

您可以在`registerOnMemberRemoved`回调中进行一些清理，当当前成员状态更改为“已删除”或群集已关闭时，将会调用该回调。

另一种方法是将任务注册到协调关闭。

#### （10）集群单例

参见集群[单例](https://doc.akka.io/docs/akka/current/scala/cluster-singleton.html)

#### （11）集群分片

将角色分布在集群中的多个节点上，并支持使用其逻辑标识符与角色进行交互，但不必关心集群中的物理位置。

参见[分片](https://doc.akka.io/docs/akka/current/scala/cluster-sharding.html)

#### [（12）分布式发布订阅](https://doc.akka.io/docs/akka/current/scala/distributed-pub-sub.html)

#### [（13）集群客户端](https://doc.akka.io/docs/akka/current/scala/cluster-client.html)

#### [（14）分布式数据](https://doc.akka.io/docs/akka/current/scala/distributed-data.html)

#### （15）故障检测器

在一个集群中，每个节点被其他节点的几个（默认最多5个）监视，当这些节点中的任何一个检测到节点不可达时，该信息将通过gossip传播到集群的其余部分。

故障检测器还将检测节点是否再次可达。当监控不可达节点的所有节点将其检测为可再次到达时，在八卦传播之后，将其视为可达。

如果系统消息无法传递到节点，则会被隔离，然后无法恢复。如果有太多未确认的系统消息，就会发生这种情况，后需要将节点移动到down或remove状态，隔离节点的角色系统必须重新启动才能重新加入集群。

群集中的节点通过发送心跳来相互监视，以检测节点是否与群集的其余部分不可达。心跳到达时间由Phi Accrual故障检测器的实现来解释。

怀疑的失败水平是由phi给出的。 phi故障检测器的基本思想是通过动态调整以反映当前网络状况的等级来表示phi的值。

phi的值计算如下：

```scala
phi = -log10(1 - F(timeSinceLastHeartbeat))
```

其中F是具有从历史心跳到达间隔时间估计的均值和标准差的正态分布的累积分布函数。

其他[参见](https://doc.akka.io/docs/akka/current/scala/cluster-usage.html#failure-detector)

#### （16）群集感知路由器

所有的路由器都可以感知到集群中的成员节点，即部署新的路由或在集群中的节点上查找路由。当节点变得不可达或离开集群时，该节点的路由将自动从路由器注销。当新节点加入集群时，根据配置将其他路由添加到路由器。当一个节点在不能到达之后再次可达时，也添加管理者。

如果启用了该功能，则群集感知型路由器将使用状态为WeaklyUp的成员。

有两种不同类型的路由器。

* **Group（组） - router， 使用actor selection将消息发送到指定路径的路由器** routee可以在集群中不同节点上运行的路由器之间共享。这种类型的路由器的用例的一个例子是在群集中的一些后端节点上运行的服务，并且由在群集中的前端节点上运行的路由器使用

* **Pool（池） - router 将routee创建为子actor的router，并将其部署在远程节点上** 每个路由器都有自己的routee实例。例如，如果您在10节点群集中的3个节点上启动路由器，如果路由器配置为每个节点使用一个实例，则总共有30个路由。不同routee创建的路由不会被路由器共享。这种类型的路由器的用例的一个例子是协调作业并将实际工作委托给在集群中的其他节点上运行的路由的单个主控器。

**Router with Group of Routees**
在使用组时，您必须启动集群成员节点上的routee actor。这不是由路由器完成的。一个组的配置看起来像这样::

```
akka.actor.deployment {
  /statsService/workerRouter {
      router = consistent-hashing-group
      routees.paths = ["/user/statsWorker"]
      cluster {
        enabled = on
        allow-local-routees = on
        use-roles = ["compute"]
      }
    }
}
```

以上配置了一个group-router actor，system将会创建这个actor，在编程中可以获得这个实例

在启动actor系统时，应该尽早启动routee参与者，因为一旦成员状态改变为“Up”，路由器就会尝试使用它们。

routees.paths中定义的没有地址信息的参与者路径用于选择路由器将消息转发到的参与者。消息将被转发到使用ActorSelection的路由，所以应该期望相同的传递语义。通过指定使用角色，可以将路由查找限制为特定 use-roles 成员节点。

`max-total-nr-of-instances`定义集群中routee的总数。默认情况下，max-total-nr-of-instances被设置为一个高值（10000），当节点加入集群时将导致新的路由添加到路由器中。如果要限制路线总数，请将其设置为较低的值。

也可以在代码中定义相同类型的路由器：

```scala
import akka.cluster.routing.{ ClusterRouterGroup, ClusterRouterGroupSettings }
import akka.routing.ConsistentHashingGroup

val workerRouter = context.actorOf(
  ClusterRouterGroup(ConsistentHashingGroup(Nil), ClusterRouterGroupSettings(
    totalInstances = 100, routeesPaths = List("/user/statsWorker"),
    allowLocalRoutees = true, useRoles = Set("compute"))).props(),
  name = "workerRouter2")
```

**[group router的例子](https://doc.akka.io/docs/akka/current/scala/cluster-usage.html#router-example-with-group-of-routees)**

**pool-route远程部署routee**
当使用在集群成员节点上创建和部署路由的池时，路由器的配置如下所示：

```
akka.actor.deployment {
  /statsService/singleton/workerRouter {
      router = consistent-hashing-pool
      cluster {
        enabled = on
        max-nr-of-instances-per-node = 3
        allow-local-routees = on
        use-roles = ["compute"]
      }
    }
}
```

通过指定使用角色，可以限制将路由部署到标有特定角色集的成员节点。

也可以在代码中定义相同类型的路由器：

```scala
import akka.cluster.routing.{ ClusterRouterPool, ClusterRouterPoolSettings }
import akka.routing.ConsistentHashingPool

val workerRouter = context.actorOf(
  ClusterRouterPool(ConsistentHashingPool(0), ClusterRouterPoolSettings(
    totalInstances = 100, maxInstancesPerNode = 3,
    allowLocalRoutees = false)).props(Props[StatsWorker]),
  name = "workerRouter3")
```

**[pool-router例子](https://doc.akka.io/docs/akka/current/scala/cluster-usage.html#router-example-with-pool-of-remote-deployed-routees)**

#### （17）群集度量

群集的成员节点可以收集系统健康度量标准，并借助群集度量将其发布到其他群集节点和系统事件总线上的已注册用户。

#### [（18）如何测试](https://doc.akka.io/docs/akka/current/scala/cluster-usage.html#how-to-test)

#### （19）管理

* http
* jmx

#### [（20）相关配置](https://doc.akka.io/docs/akka/current/scala/cluster-usage.html#configuration)

### 5、集群单例

在某些情况，需要某个Actor仅仅在集群中的的一处运行。

例如：

* 对某些整个集群一致决策负责的单一责任点，或整个集群系统内的行动协调
* 单一入口指向外部系统
* single master, many workers
* 集中命名服务或路由逻辑

集群单例不应该是设计的第一选择。因为他可能造成性能瓶颈。

集群单例模式由akka.cluster.singleton.ClusterSingletonManager实现。他使用一个特殊的角色标记管理单例Actor。他保证整个集群中最多有一个单例实例在运行。

#### （1）例子

假设我们需要单一入口点到外部系统。从JMS队列接收消息的actor，严格要求只有一个JMS消费者必须存在，以确保消息按顺序处理。

**定义消息**

```scala
object PointToPointChannel {
  case object UnregistrationOk
}
object Consumer {
  case object End
  case object GetCurrent
  case object Ping
  case object Pong
}
```

**注册集群节点**

```scala
system.actorOf(
  ClusterSingletonManager.props(
    singletonProps = Props(classOf[Consumer], queue, testActor),
    terminationMessage = End,
    settings = ClusterSingletonManagerSettings(system).withRole("worker")),
  name = "consumer")
```

**消息处理**

```scala
case End ⇒
  queue ! UnregisterConsumer
case UnregistrationOk ⇒
  stoppedBeforeUnregistration = false
  context stop self
case Ping ⇒
  sender() ! Pong
```

**获取集群单例**

```scala
val proxy = system.actorOf(
  ClusterSingletonProxy.props(
    singletonManagerPath = "/user/consumer",
    settings = ClusterSingletonProxySettings(system).withRole("worker")),
  name = "consumerProxy")
```

**依赖**

```
"com.typesafe.akka" %% "akka-cluster-tools" % "2.5.7"
```

**配置**

```scala
akka.cluster.singleton {
  # The actor name of the child singleton actor.
  singleton-name = "singleton"

  # Singleton among the nodes tagged with specified role.
  # If the role is not specified it's a singleton among all nodes in the cluster.
  role = ""

  # When a node is becoming oldest it sends hand-over request to previous oldest,
  # that might be leaving the cluster. This is retried with this interval until
  # the previous oldest confirms that the hand over has started or the previous
  # oldest member is removed from the cluster (+ akka.cluster.down-removal-margin).
  hand-over-retry-interval = 1s

  # The number of retries are derived from hand-over-retry-interval and
  # akka.cluster.down-removal-margin (or ClusterSingletonManagerSettings.removalMargin),
  # but it will never be less than this property.
  min-number-of-hand-over-retries = 10
}

akka.cluster.singleton-proxy {
  # The actor name of the singleton actor that is started by the ClusterSingletonManager
  singleton-name = ${akka.cluster.singleton.singleton-name}

  # The role of the cluster nodes where the singleton can be deployed.
  # If the role is not specified then any node will do.
  role = ""

  # Interval at which the proxy will try to resolve the singleton instance.
  singleton-identification-interval = 1s

  # If the location of the singleton is unknown the proxy will buffer this
  # number of messages and deliver them when the singleton is identified.
  # When the buffer is full old messages will be dropped when new messages are
  # sent via the proxy.
  # Use 0 to disable buffering, i.e. messages will be dropped immediately if
  # the location of the singleton is unknown.
  # Maximum allowed buffer size is 10000.
  buffer-size = 1000
}
```

### 6、在集群中分布式发布订阅

如何发送消息给不知道在集群中那个节点运行的actor？
如何发送消息给所有对此消息类型感兴趣的actor？

这种情况下，提供了一个中介actor akka.cluster.pubsub.DistributedPubSubMediator，它管理参与者引用的注册表，并将这些条目复制到所有群集节点或标记有特定角色的一组节点中的对等角色。

DistributedPubSubMediator Actor应该在集群中的所有节点或具有指定角色的所有节点上启动。中介可以使用DistributedPubSub扩展或作为普通的actor来启动。

具有状态WeaklyUp的群集成员将参与分布式发布预订，即，如果发布者和订阅者位于网络分区的同一侧，那么处于WeaklyUp状态的节点上的订阅者将收到发布的消息。

您可以通过任何节点上的中介器将消息发送到任何其他节点上的注册参与者。

有两种不同的消息传递模式，在下面的“发布和发送”部分进行了解释。

#### （1）Publish（发布）

这是真正的 pub/sub 模式。这种模式的典型用法是即时消息应用程序中的聊天室。

参与者被注册到一个指定的主题。这使得每个节点上的许多订户。该消息将被传递给该主题的所有订阅者。

其他略

### 7、集群客户端

略

### 8、集群分片

TODO
