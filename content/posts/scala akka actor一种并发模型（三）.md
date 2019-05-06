---
title: scala akka actor一种并发模型（三）
date: 2017-11-11T13:57:43+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/114
  - /detail/114/
tags:
  - scala
---

## 目录
* [三、Actors](#三、Actors)
	* [1、Actor](#1、Actor)
		* [（1）创建Actor](#（1）创建Actor)
		* [（2）Actor API](#（2）Actor API)
		* [（3）通过Actor Selection查找Actor](#（3）通过Actor Selection查找Actor)
		* [（4）消息和不可变性](#（4）消息和不可变性)
		* [（5）发送消息](#（5）发送消息)
		* [（6）接收消息](#[（6）接收消息)
		* [（7）回复消息](#（7）回复消息)
		* [（8）接收超时](#（8）接收超时)
		* [（9）定时器，计划消息](#（9）定时器，计划消息)
		* [（10）停止Actor](#（10）停止Actor)
		* [（11）Become/Unbecome](#（11）Become/Unbecome)
		* [（12）Stash特质](#（12）Stash特质)
		* [（13）Actors和exceptions](#（13）Actors和exceptions)
		* [（14）使用PartialFunction链扩展Actor](#（14）使用PartialFunction链扩展Actor)
		* [（15）初始化模式](#（15）初始化模式)
	* [2、Akka Typed](#2、Akka Typed)
	* [3、容错](#3、容错)
	* [4、调度器](#4、调度器)
	* [5、邮箱](#5、邮箱)




## 三、Actors
*********************************
### 1、Actor
#### （1）创建Actor

**定义一个Actor class**
参见[例子](112#（1）Akka 快速入门（使用scala） Helloworld项目)


**Props**
Props是一个配置类，用于指定用于创建actor的选项，将其视为一个不可变的因此可自由共享的用于创建actor的配方，包括相关的部署信息（例如，要使用哪个调度程序，请参阅下面的更多内容）。这里有一些如何创建一个Props实例的例子。
```scala
import akka.actor.Props

val props1 = Props[MyActor] //对于无惨构造函数来说，
val props2 = Props(new ActorWithArgs("arg")) // careful, see below
val props3 = Props(classOf[ActorWithArgs], "arg") // 这种方式不支持值类型的参数
```

**`Props.apply(clazz, args)`Actor不支持值类型**
```scala
case class MyValueClass(v: Int) extends AnyVal
class ValueActor(value: MyValueClass) extends Actor {
  def receive = {
    case multiplier: Long => sender() ! (value.v * multiplier)
  }
}
val valueClassProp = Props(classOf[ValueActor], MyValueClass(5)) // 不支持
```

**Actor不支持使用默认构造函数**
```scala
class DefaultValueActor(a: Int, b: Int = 5) extends Actor {
	def receive = {
		case x: Int => sender() ! ((a + x) * b)
	}
}

class DefaultValueActor2(b: Int = 5) extends Actor {
	def receive = {
		case x: Int => sender() ! (x * b)
	}
}

val defaultValueProp1 = Props(classOf[DefaultValueActor], 2.0,2.0) // 不支持
val defaultValueProp1_1 = Props(classOf[DefaultValueActor], 2.0) // 不支持
val defaultValueProp2 = Props[DefaultValueActor2] // 不支持
val defaultValueProp3 = Props(classOf[DefaultValueActor2]) // 不支持
```

**推荐做法**
* 在伴生对象中 定义一个签名为`props(...):Props`的工厂方法用于创建Props
* 在伴生对象中 定义该actor可以接收的消息


**用Props创建Actor**
* 顶层actor使用`system.actorOf(props:Props, name:String)`
* 子actor使用`context.actorOf(props:Props, name:String)`

**值类作为构造函数参数**
```scala
class Argument(val value: String) extends AnyVal
class ValueClassActor(arg: Argument) extends Actor {
  def receive = { case _ => () }
}

object ValueClassActor {
  def props1(arg: Argument) = Props(classOf[ValueClassActor], arg) // fails at runtime
  def props2(arg: Argument) = Props(classOf[ValueClassActor], arg.value) // ok
  def props3(arg: Argument) = Props(new ValueClassActor(arg)) // ok
}
```

**依赖注入**
```scala
import akka.actor.IndirectActorProducer

class DependencyInjector(applicationContext: AnyRef, beanName: String)
  extends IndirectActorProducer {

  override def actorClass = classOf[Actor]
  override def produce =
    new Echo(beanName)

  def this(beanName: String) = this("", beanName)
}

val actorRef = system.actorOf(
  Props(classOf[DependencyInjector], applicationContext, "hello"),
  "helloBean")
```

注意当时用依赖注入时，不要将bean的声明周期设为单例模式。

依赖注入技术和与依赖注入框架的集成在使用依赖注入指南和Akka Java Spring教程中有更深入的描述。



**The Inbox**：常用语测试actor
收件箱是从外部询问的类似演员的对象。它包含一个演员，其参照可以像往常一样传递给其他演员，并可以观看其他演员的生命周期。

```scala
val system = ActorSystem("testSystem")
val props8 = Props[EchoActor]
val echo = system.actorOf(props8, "echo")
implicit val i = Inbox.create(system)
i watch echo
i.send(echo, "Hello")

import scala.concurrent.duration._

val s = i.receive(1.second)
println(s.asInstanceOf[String])
```


#### （2）Actor API
*可以对照源码看*

Actor特征只定义了一个抽象方法：`receive`用于接收消息

如果当前的行为者行为与接收到的消息不匹配，则调用`unhandled`，默认情况下在actor系统的事件流上发布一个`akka.actor.UnhandledMessage(message, sender, recipient)`消息（将配置项akka.actor.debug.unhandled设置为on，将它们转换为实际的Debug消息）。

另外，它还提供：
* `self` actor的ActorRef引用
* `sender` 最后一个收到的消息的发送人的ActorRef引用
* `supervisorStrategy` 用户可重写定义用于监督子Actor的策略
* `context` 展现了actor和当前消息的上下文信息，比如：
	* 用于创建子actor的工厂方法
	* 该actor所属的系统
	* 家长监督者（parent supervisor）
	* 受监督的孩子（supervised children）
	* 生命周期监控
	* hotswap behavior stack as described in Actor.HotSwap

可以导入context成员，以避免频繁使用context前缀
`import context._`


剩下的可见方法是用户可覆盖的生命周期回调函数，如下所述：
```scala
def preStart(): Unit = ()

def postStop(): Unit = ()

def preRestart(reason: Throwable, message: Option[Any]): Unit = {
  context.children foreach { child ⇒
    context.unwatch(child)
    context.stop(child)
  }
  postStop()
}

def postRestart(reason: Throwable): Unit = {
  preStart()
}
```
上面显示的实现是Actor特征提供的默认值。

**Actor声明周期**

![](/res/96hvpAjKFyqhnMQZEIWzhtsU.png)

注意：
* `restart`和先`stop`再启动是不同的
	* 重新启动只交换由Props定义的Actor实例，但是incarnation和UID保持不变。只要incarnation是相同的，你可以继续使用相同的ActorRef。重新启动由Actor的父亲的监督策略处理
	* 一个incarnation的生命周期在演员停止时结束。在这一点上，适当的生命周期事件被调用，观察者被告知终止。在化身停止之后，可以通过使用actorOf（）创建一个actor来重新使用该路径。在这种情况下，新的化身名称将与前一个相同，但UID将有所不同。一个Actor可以被Actor本身，另一个Actor或者ActorSystem停止
* 需要注意的是，Actor不会在不再被引用时自动停止，所创建的每个Actor也必须被明确地销毁。停止一个父Actor也将递归地停止这个父代已经创建的所有子Actor。

ActorRef总是表示一个incarnation （路径和UID）不只是一个给定的路径。因此，如果一个Actor停下来并且创建一个同名的新actor，那么旧Actor的ActorRef将不会指向新的Actor。

另一方面，`ActorSelection`指向路径（如果使用通配符，则使用多个路径），并且完全不知道哪个incarnation正在占据它。`ActorSelection`因为这个原因不能被监视。通过向ActorSelection发送Identify消息，可以解决路径下的当前incarnation的ActorRef。这也可以通过ActorSelection的resolveOne方法来完成，该方法返回匹配ActorRef的Future。



**生命周期监视 aka DeathWatch**
为了在另一个演员stop（即永久停止，而不是暂时失败和重新启动）时被通知，一个Actor可以注册自己接收由另一个Actor终止的终止消息。这个服务由actor系统的DeathWatch组件提供。
```scala
import akka.actor.{ Actor, Props, Terminated }

class WatchActor extends Actor {
  val child = context.actorOf(Props.empty, "child")
  context.watch(child) // <-- this is the only call needed for registration
  var lastSender = context.system.deadLetters

  def receive = {
    case "kill" =>
      context.stop(child); lastSender = sender()
    case Terminated(`child`) => lastSender ! "finished"
  }
}


	val system = ActorSystem("testSystem")
	//测试监视
	val props9 = Props[WatchActor]
	val watchActor = system.actorOf(props9, "watchActor")
	val i = Inbox.create(system)
	i watch watchActor
	i.send(watchActor, "kill")
	import scala.concurrent.duration._
	println(i.receive(1.second))
//输出"finished"
```


**start回调**
**Restart回调**
**Stop回调**
参见[例子的实现](112#（1）Akka 快速入门（使用scala） Helloworld项目)


#### （3）通过Actor Selection查找Actor
使用路径查找
```scala
// will look up this absolute path
context.actorSelection("/user/serviceA/aggregator")
// will look up sibling beneath same supervisor
context.actorSelection("../joe")
```

注意：
* 总是最好使用ActorRef而不是依赖ActorSelection与其他Actor进行通信。除非：
	* 使用At-Least-Once Delivery工具发送消息
	* 发起与远程系统的首次联系
* 在所有其他情况下，可以在Actor创建或初始化期间提供ActorRefs，通过将它们的ActorRefs发送给消息内的其他Actor来将它们从父代传递到子代或引入Actors。

使用通配符
```scala
// will look all children to serviceB with names starting with worker
context.actorSelection("/user/serviceB/worker*")
// will look up all siblings beneath same supervisor
context.actorSelection("../*")
```

获取到ActorRef，例子如下
```scala
class Follower extends Actor {
	val identifyId = 1
	//超找到/user/another，并向此ActorSelection发送Identify(identifyId)消息，
	//这样本actor将收到 一条ActorIdentity(identifyId, Some(ref))的消息，
	//在receive对此消息做处理，提取出ref
	context.actorSelection("/user/another") ! Identify(identifyId)

	def receive = {
		case ActorIdentity(`identifyId`, Some(ref)) =>
			println("找到了another，开始观察他")
			context.watch(ref)
			context.become(active(ref))
		case ActorIdentity(`identifyId`, None) =>
			println("没有找到了another，自己即将stop")
			context.stop(self)

	}

	def active(another: ActorRef): Actor.Receive = {
		case Terminated(`another`) =>
			println("找到了another，他已经stop，自己即将stop")
			context.stop(self)
	}
}

//测试1
	val props10 = Props[Follower]
	val followerActor1 = system.actorOf(props10, "my")
	//输出 没有找到了another，自己即将stop
	
//测试2
	val props10 = Props[Follower]
	val followerActor = system.actorOf(props10, "another")
	val followerActor1 = system.actorOf(props10, "my")
	Thread.sleep(1000)
	followerActor ! PoisonPill
	/*输出
	找到了another，开始观察他
	找到了another，开始观察他
	找到了another，他已经stop，自己即将stop
	*/
```

	
#### （4）消息和不可变性
**保证消息不可变性**
```scala
case class User(name: String)

// define the case class
case class Register(user: User)
val user = User("Mike")
// create a new case class message
val message = Register(user)
```


#### （5）发送消息

> [第二参考](https://segmentfault.com/a/1190000006672829)

消息通过以下方法之一发送给角色。
* `!` 意味着“fire-and-forget（发送）”，例如异步发送消息并立即返回，也被称为`tell`
* `?` 发送一个异步消息并返回`Future`，它代表一个可能的答复，也被称为`ask`
* `target forward message` 转发消息

**`?`或`ask`说明**
使用ask会造成性能影响，因为当超时是，一些事情需要保持追踪。这需要一些东西来将一个Promise连接进入ActorRef，并且需要通过远程连接可到达的。所以总是使用tell更偏向性能,除非必须才用ask。

actor 本身是没有 ask 函数的，如果想用 ask 函数，需要引入 akka.pattern.ask 依赖。Akka 官方并不推荐使用 ask 函数，因为它意味着处理 message 的 actor (receiver) 需要把处理结果返回 sender，这就引入了 sender 和 receiver 之间的依赖关系，本来 actor 之间都是各个独立存在的实体，因为 ask 函数引入了依赖会使程序变得复杂。但是在某些场景下 ask 函数会带来极大的便利性，所以它的存在还是有必要的。最终 akka 对 ask 的设计就像我们看到的一样，没有把 ask 作为 actor 的成员函数，表明自己对 ask 的不推荐态度，但又以隐式转换的方式支持它，表示如果你真的要用，我们仍提供这种 capability。

例子1
```scala
import akka.pattern.{ ask, pipe } //必须引入否者，找不到函数，akka以隐式转换的形式提供此功能
import system.dispatcher // The ExecutionContext that will be used
final case class Result(x: Int, s: String, d: Double)
case object Request

implicit val timeout = Timeout(5 seconds) // needed for `?` below

val f: Future[Result] =
  for {
    x <- ask(actorA, Request).mapTo[Int] // 调用方式1
    s <- (actorB ask Request).mapTo[String] // 调用方式2
    d <- (actorC ? Request).mapTo[Double] // 调用方式3
  } yield Result(x, s, d)

f pipeTo actorD // .. or ..
pipe(f) to actorD
```

这个例子演示了`ask`与`pipeTo`模式在futures上一起使用的例子，因为这可能是一个共同的组合。请注意，以上所有内容完全是非阻塞和异步的： `ask`产生一个`Future`，其中三个使用for-comprehension组成一个新的Futrue。然后pipeTo将来会安装一个onComplete处理程序，将聚合结果提交给另一个actor处理。

使用`ask`发送消息给被问询的actor，这个actor必须使用`sender()! 回复消息`来填充Future的值。询问操作涉及创建一个内部参与者来处理这个回复，为了不泄漏资源，这个回应需要有一个超时之后才能被销毁。

为了防止问题，使用以下写法
```scala
try {
  val result = operation()
  sender() ! result
} catch {
  case e: Exception =>
    sender() ! akka.actor.Status.Failure(e)
    throw e
}
```

如果actor没有给future相应，future将在超时时间后过期，超时设定：
```
val future = myActor.ask("hello")(5 seconds) //方式1，直接传参，高优先级
implicit val timeout = Timeout(5 seconds) //方式2，隐式值，低优先级
```

`Future` 提供了 onComplete, onSuccess, or onFailure 注册回调函数，以避免阻塞（不要在回调中调用封闭演员的方法或访问可变状态）

例子二
```scala
class AskActor extends Actor {
	override def receive: Receive = {
		case num: Int => sender() ! num+1
		case msg => println(msg)
	}
}

//测试
	implicit val timeout = Timeout(3 second)
	val askActor = system.actorOf(Props[AskActor], "askActor")
	//引入支持
	import akka.pattern.ask
	import scala.concurrent.ExecutionContext.Implicits.global
	val future  = askActor ? "msg"
	future.onComplete(f =>
		println("是否失败："+f.isFailure)
	)
	askActor ? 1 foreach(println)
/*输出
msg
2
是否失败true
*/
```

**转发消息说明：**
转发消息不同于tell在于，发送者`sender()`不变


#### （6）接收消息
Actor必须实现接收方法来接收消息：

定义如下
```scala
type Receive = PartialFunction[Any, Unit]
def receive: Actor.Receive
```

一组case语句将会编译成为，`PartialFunction`偏函数，所以receive最佳写法是使用一组case

#### （7）回复消息
```scala
sender() ! replyMsg
```

#### （8）接收超时
设置接收消息的空闲时间超时，也就是说最后接收到的消息到现在的时间不允许超过某个值，最小单位是1ms，
设置方式`context.setReceiveTimeout(30 milliseconds)`，可多次设置，后者覆盖前者。
取消设置`context.setReceiveTimeout(Duration.Undefined)`

例子
```scala
import akka.actor.ReceiveTimeout
import scala.concurrent.duration._

class TimeoutActor extends Actor {
	// To set an initial delay
	context.setReceiveTimeout(30 milliseconds)
	def receive = {
		case "Hello" =>
			// To set in a response to a message
			context.setReceiveTimeout(100 milliseconds)
		case ReceiveTimeout =>
			// To turn it off
			println("超时")
			context.setReceiveTimeout(Duration.Undefined)
			context.stop(self)
			//throw new RuntimeException("Receive timed out")
	}
}

//测试
	val timeoutActor = system.actorOf(Props[TimeoutActor],"timeoutActor")
	Thread.sleep(40)
	val timeoutActor2 = system.actorOf(Props[TimeoutActor],"timeoutActor2")
	timeoutActor2 ! "hello"
	Thread.sleep(40)
	println("任然没有超时")
	Thread.sleep(80)
	println("100ms后才超时")
	
	/*输出
	超时
	任然没有超时
	超时
	100ms后才超时
	*/
	
```
#### （9）定时器，计划消息
通过直接使用调度器可以安排消息被安排在稍后的时间发送，但是当在一个参与者的周期或者单个消息中安排消息时，使用对定时器的支持更加方便和安全。计划消息的生命周期可能难以管理，当参与者重新启动并由定时器负责。

更新build.sbt依赖版本最新版`2.5.6`
```scala
object TimerActor {
	private case object TickKey
	private case object FirstTick
	private case object Tick
	private case object LaterTick
}

import akka.actor.Timers

class TimerActor extends Actor with Timers{
	import TimerActor._
	timers.startSingleTimer(TickKey, FirstTick, 500.millis)

	def receive:Receive = {
		case FirstTick =>
			// do something useful here
			println("收到FirstTick消息")
			timers.startPeriodicTimer(TickKey, Tick, 1.second)
		case Tick =>
			println("收到Tick消息")
		// do something useful here
	}
}

//测试
	val timerActor = system.actorOf(Props[TimerActor],"timerActor")
/*输出
收到FirstTick消息
收到Tick消息
收到Tick消息
收到Tick消息
.....
*/
```
混入`Timers`，可以实现延期，或者周期性定时给自己发消息



#### （10）停止Actor
几种方式：
* `context.stop(child | self)` 在父亲或者自身停止
* 发送`PoisonPill`消息
* 发送`Kill`来 Killing 一个Actor，与PoisonPill不同，这将导致actor抛出ActorKilledException，从而触发失败。Actor将暂停操作，其主管将被问及如何处理失败，这可能意味着恢复演员，重新启动或完全终止。

一般来说，在设计你的演员互动，不建议过度依赖PoisonPill或Kill。

**优雅的停止**
如果您需要等待终止或编写多个参与者的有序终止，那么gracefulStop是有用的

**协调关闭**


#### （11）Become/Unbecome
**动态绑定接收函数**
使用`become()`进行绑定，可以有两种选择一种是替换（默认），另一种是将接收函数放入行为栈的顶部`become(receive, discardOld = false)`。
```scala
class HotSwapActor extends Actor {
  import context._
  def angry: Receive = {
    case "foo" => sender() ! "I am already angry?"
    case "bar" => become(happy)
  }

  def happy: Receive = {
    case "bar" => sender() ! "I am already happy :-)"
    case "foo" => become(angry)
  }

  def receive = {
    case "foo" => become(angry)
    case "bar" => become(happy)
  }
}
```

**取消最后一次绑定的接收函数**
使用`unbecome()`取消最后一次绑定的接收函数，实际上是将行为栈顶部的函数弹出。
```scala
case object Swap
class Swapper extends Actor {
  import context._
  val log = Logging(system, this)

  def receive = {
    case Swap =>
      log.info("Hi")
      become({
        case Swap =>
          log.info("Ho")
          unbecome() // resets the latest 'become' (just for fun)
      }, discardOld = false) // push on top instead of replace
  }
}

object SwapperApp extends App {
  val system = ActorSystem("SwapperSystem")
  val swap = system.actorOf(Props[Swapper], name = "swapper")
  swap ! Swap // logs Hi
  swap ! Swap // logs Ho
  swap ! Swap // logs Hi
  swap ! Swap // logs Ho
  swap ! Swap // logs Hi
  swap ! Swap // logs Ho
}
```


#### （12）Stash特质
Stash特质使演员能够临时存储不能或不应该使用演员当前行为处理的消息。在更改演员的消息处理程序(使用context.become或context.unbecome)后，再将消息填充到actor的邮箱中，再处理这些消息，可以按照原来收到的信息的顺序处理信息。

这是一个Stash的例子：
```scala
import akka.actor.Stash
class StashActor extends Actor with Stash {
	def receive = {
		case "print" =>
			unstashAll() //释放隐藏的消息
			println("即将开始打印刚才发送的所有消息")
			context.become({
				case "stash" =>
					println("重新隐藏接收消息")
					context.unbecome() 
				case msg => println(msg)
			}, discardOld = false)
		case msg =>
			println("这个消息被隐藏了，没有发到邮箱中")
			stash() //将消息加入stash中暂存等待unstashAll()发送到到actor的邮箱中
	}
}

//测试
	val stashActor = system.actorOf(Props[StashActor], "stashActor")
	stashActor ! 1
	stashActor ! 2
	stashActor ! 3
	stashActor ! 4
	stashActor ! "print"
	stashActor ! "直接打印的消息"
	stashActor ! "stash"
	stashActor ! 1
	stashActor ! 2
	stashActor ! 3
	stashActor ! 4
	
/*输出
这个消息被隐藏了，没有发到邮箱中
这个消息被隐藏了，没有发到邮箱中
这个消息被隐藏了，没有发到邮箱中
这个消息被隐藏了，没有发到邮箱中
即将开始打印刚才发送的所有消息
1
2
3
4
直接打印的消息
重新隐藏接收消息
这个消息被隐藏了，没有发到邮箱中
这个消息被隐藏了，没有发到邮箱中
这个消息被隐藏了，没有发到邮箱中
这个消息被隐藏了，没有发到邮箱中
*/
```

* `stash()`：添加当前消息到（演员最后收到的消息）到actor’s stash。
* `unstashAll()`：将actor’s stash中的所有消息放按照收到的顺序放到actor的邮箱中，等待receive处理
* actor’s stash通过`scala.collection.immutable.Vector`实现

#### （13）Actors和exceptions
当一个演员正在处理一个消息时，可能发生某种异常，例如，一个数据库异常，那么这个actor和其组件会发生什么

**这个消息会怎样**
如果正在处理消息时抛出异常，那么这个消息将会丢失。理解它不会放在邮箱上很重要。所以如果你想重试一个消息的处理，你需要通过捕获这个异常来处理它，然后重试你的流程。因为你不想让系统活锁（所以消耗很多cpu周期而没有进展），所以确保你对重试次数进行了限制。

**信箱会怎样**
没有影响，如果演员重新启动，相同的邮箱将在那里。所以邮箱里的所有邮件也会在那里。

**actor会怎样**
这个actor被挂起，监督过程开始（见监督）。由其主管决定，acctor恢复（如同没有任何事情发生），重新启动（清除其内部状态并从头开始）或终止。


#### （14）使用PartialFunction链扩展Actor
一个简单的例子
```scala
//消费者共有的一些行为
trait ConsumerBehavior {
	this: Actor with ActorLogging =>

	val consumerBehavior: Receive = {
		case ref: ActorRef =>
			ref ! GiveMeThings

		case Give(thing) =>
			log.info("Got a thing! It's {}", thing)
	}
}

class Producer extends Actor with ProducerBehavior {
	def receive = producerBehavior
}

class Consumer extends Actor with ActorLogging with ConsumerBehavior {
	def receive = consumerBehavior
}

class ProducerConsumer extends Actor with ActorLogging
  with ProducerBehavior with ConsumerBehavior {

	def receive = producerBehavior.orElse[Any, Unit](consumerBehavior)
}

// protocol
case object GiveMeThings
final case class Give(thing: Any)
```

#### （15）初始化模式
* 使用生命周期回调函数
* 使用自定义消息实现初始化




### 2、Akka Typed
**警告：**该模块还未稳定，可能在没有警告或者废弃的情况下修改api

#### （1）添加依赖
```scala
"com.typesafe.akka" %% "akka-typed" % "2.5.6"
```


#### （2）介绍
有类型的Actor，和普通的actor类似
```scala
package com.lightbend.akka.sample

/**
  * @author Rectcircle
  */


import akka.actor.Scheduler
import akka.typed._
import akka.typed.scaladsl.Actor
import akka.typed.scaladsl.AskPattern._
import akka.util.Timeout

import scala.concurrent.Future
import scala.concurrent.duration._
import scala.concurrent.Await


object HelloWorld {
	final case class Greet(whom: String, replyTo: ActorRef[Greeted])
	final case class Greeted(whom: String)

	val greeter = Actor.immutable[Greet] { (_, msg) ⇒
		println(s"Hello ${msg.whom}!")
		msg.replyTo ! Greeted(msg.whom)
		Actor.same
	}
}

object TypedActorTest extends App {
	import HelloWorld._
	// using global pool since we want to run tasks after system.terminate
	import scala.concurrent.ExecutionContext.Implicits.global

	val system: ActorSystem[Greet] = ActorSystem(greeter, "hello")

	implicit val scheduler: Scheduler = system.scheduler
	implicit val timeout = Timeout(1 second)

	val future: Future[Greeted] = system ? (Greet("world", _))

	for {
		greeting ← future.recover { case ex ⇒ ex.getMessage }
		done ← { println(s"result: $greeting"); system.terminate() }
	} println("system terminated")

}
```

复杂一点的例子：聊天室
```scala

sealed trait Command //命令
final case class GetSession(screenName: String, replyTo: ActorRef[SessionEvent])
  extends Command //获取一个会话的命令，发送用户名和用户的actor引用


sealed trait SessionEvent  //会话事件
final case class SessionGranted(handle: ActorRef[PostMessage])
  extends SessionEvent //用于回复GetSession，授予一个会话
final case class SessionDenied(reason: String)
  extends SessionEvent //用于回复GetSession，会话被拒绝
final case class MessagePosted(screenName: String, message: String)
  extends SessionEvent //消息发布

//投递消息
final case class PostMessage(message: String)

object ChatRoom{
	//
	private final case class PostSessionMessage
		(screenName: String, message: String) extends Command

	//行为列表，处理命令的行为列表
	val behavior: Behavior[Command] =
		chatRoom(List.empty)

	private def chatRoom(sessions: List[ActorRef[SessionEvent]]): Behavior[Command] =
		Actor.immutable[Command] { (ctx, msg) ⇒
			msg match {
				case GetSession(screenName, client) ⇒ //收到客户端连接消息
					val wrapper = ctx.spawnAdapter { //对返回消息进行封装，指之带有ActorRef
						p: PostMessage ⇒ PostSessionMessage(screenName, p.message)
					}
					client ! SessionGranted(wrapper) //回复消息
					chatRoom(client :: sessions) //将客户端ActorRef保存，更新行为，可能类似于become
				case PostSessionMessage(screenName, message) ⇒ //接收到一条客户端发送的消息
					val mp = MessagePosted(screenName, message) //创建广播消息
					sessions foreach (_ ! mp) //依次发给所有客户端
					Actor.same //返回一个行为，可能返回自己
			}
		}
}

object ChatClient {
	import ChatRoom._

	//客户端Actor
	val gabbler =
		Actor.immutable[SessionEvent] { (_, msg) ⇒
			msg match {
				case SessionGranted(handle) ⇒ //接收到同意加入会话的消息
					handle ! PostMessage("Hello World!") //发送一条消息
					Actor.same
				case MessagePosted(screenName, message) ⇒ //接收到广播消息，
					//输出消息
					println(s"message has been posted by '$screenName': $message")
					Actor.stopped
			}
		}
}


//测试
	import scala.concurrent.ExecutionContext.Implicits.global

	implicit val scheduler: Scheduler = system.scheduler
	implicit val timeout = Timeout(1 second)
	
	
		//main actor
	val main: Behavior[akka.NotUsed] =
		Actor.deferred { ctx ⇒
		  //创建服务端和客户端
			val chatRoom = ctx.spawn(ChatRoom.behavior, "chatroom")
			val gabblerRef = ctx.spawn(ChatClient.gabbler, "gabbler")
			//观察客户端情况
			ctx.watch(gabblerRef)
			//客户端请求连接会话
			chatRoom ! GetSession("ol’ Gabbler", gabblerRef)

			Actor.immutable[akka.NotUsed] {
				(_, _) ⇒ Actor.unhandled
			} onSignal {
				case (ctx, Terminated(ref)) ⇒
					Actor.stopped
			}
		}

	//创建系统
	val system1 = ActorSystem(main, "ChatRoomDemo")
	//等一会
	Await.result(system1.whenTerminated, 3.seconds)
	
	
/*输出
message has been posted by 'ol’ Gabbler': Hello World!
system terminated
*/
```


### 3、容错
如Actor系统中所解释的，每个Actor都是其子女的监督者，因此每个Actor定义故障处理监督者策略。之后这个策略是不能改变的，因为它是行为体系结构的一个组成部分。

#### （1）实践中的故障处理
首先，让我们看一个示例，说明处理数据存储异常的一种方法，这是现实应用程序中典型的失败来源。当然，这取决于实际的应用程序，当数据存储不可用时可以做什么，但是在这个示例中，我们使用了尽力而为的重新连接方法。

#### （2）创建一个监管策略
```scala
import akka.actor.OneForOneStrategy
import akka.actor.SupervisorStrategy._
import scala.concurrent.duration._

override val supervisorStrategy =
  OneForOneStrategy(maxNrOfRetries = 10, withinTimeRange = 1 minute) {
    case _: ArithmeticException => Resume
    case _: NullPointerException => Restart
    case _: IllegalArgumentException => Stop
    case _: Exception => Escalate
  }
```

我们选择了一些众所周知的异常类型来演示监督中描述的故障处理指令的应用。

首先，这是一对一的策略，这意味着每个孩子都是分开对待的（一对一的战略运作非常类似，唯一的区别是，任何决定是适用于所有的监督子女，不仅失败的）。在上面的例子中，10和1分钟分别传递给maxNrOfRetries和withinTimeRange参数，这意味着当该策略重新启动一个孩子，每分钟最多重新启动10次。如果在withinTimeRange持续时间内重新启动次数超过maxNrOfRetries，则子actor将停止。

此外，这些参数还有特殊的值。如果您指定：
* `maxNrOfRetries=-1, withinTimeRange=Duration.inf`表示无限制重启
* `maxNrOfRetries=-1, withinTimeRange=有限的值` maxNrOfRetries总是=1，仅尝试重启一次
* `maxNrOfRetries=非负数, withinTimeRange=Duration.inf` withinTimeRange被视为无限持续时间（即），无论需要多长时间，一旦重新启动计数超过maxNrOfRetries，子actor就会停止

另一组参数是一个`PartialFunction[Throwable, Directive]`，对其进行匹配

**默认主管策略**
参见源码

**停止监管战略**
Closer to the Erlang way is the strategy to just stop children when they fail and then take corrective action in the supervisor when DeathWatch signals the loss of the child. This strategy is also provided pre-packaged as SupervisorStrategy.stoppingStrategy with an accompanying StoppingSupervisorStrategy configurator to be used when you want the "/user" guardian to apply it.

**Actor失败日志**
SupervisorStrategy默认情况下会记录失败，除非使用escalated。escalated失败应该被处理，并且可能被记录在层次结构中更高的级别上。

您可以通过在实例化时将loggingEnabled设置为false来禁用SupervisorStrategy的默认日志记录。定制日志可以在Decider内完成

您也可以通过重写logFailure方法来自定义SupervisorStrategy实现中的日志记录。


#### （3）顶级Actor的监管
顶层Actor指的是使用`system.actorOf()`，他们是`/user`监管者的孩子。在这种情况下没有特别的规则，监护人只是简单地应用配置的策略。

#### （4）测试
```scala
package com.lightbend.akka.sample

import akka.actor.{Actor, ActorRef, ActorSystem, Inbox, OneForOneStrategy, Props, SupervisorStrategy}
import akka.actor.SupervisorStrategy._
import scala.concurrent.duration._

class SupervisorActor extends Actor {
	override val supervisorStrategy:SupervisorStrategy =
		OneForOneStrategy(maxNrOfRetries = 10, withinTimeRange = 1.minute) {
			case _: ArithmeticException =>  println("恢复中..."); Resume
			case _: NullPointerException => println("重启..."); Restart
			case _: IllegalArgumentException => println("停止..."); Stop
			case _: Exception => println("交由上级处理..."); Escalate
		}
	def receive:Receive = {
		case p: Props => sender() ! context.actorOf(p)
	}
}

class ChildActor extends Actor {

	override def preStart(): Unit = {super.preStart(); println("preStart执行")}

	override def postStop(): Unit = {super.postStop();println("postStop执行")}

	override def preRestart(reason: Throwable, message: Option[Any]): Unit = {
		super.preRestart(reason, message)
		println("preRestart执行")
	}

	override def postRestart(reason: Throwable): Unit = {
		super.postRestart(reason)
		println("postRestart执行")
	}

	var state = 0
	override def receive:Receive = {
		case ex: Exception => throw ex
		case x: Int => state = x
		case "get" => sender() ! state
	}
}

object FaultToleranceTest extends App {
	val system = ActorSystem("FaultToleranceTest")
	val inbox = Inbox.create(system)

	val supervisorActor = system.actorOf(Props[SupervisorActor], "supervisorActor")
	inbox.watch(supervisorActor)
	inbox.send(supervisorActor, Props[ChildActor]) //发送一个消息创建一个孩子
	val childActor = inbox.receive(1.second).asInstanceOf[ActorRef]
	inbox.watch(childActor)

	childActor ! 42
	inbox.send(childActor, "get")
	println(inbox.receive(1.second))

	childActor ! new ArithmeticException // 父亲让其恢复
	inbox.send(childActor, "get")
	println(inbox.receive(1.second))

	childActor ! new NullPointerException // 父亲让其重启
	inbox.send(childActor, "get")
	println(inbox.receive(1.second))

	childActor ! new IllegalArgumentException // 父亲让其停止


	inbox.send(supervisorActor, Props[ChildActor])
	val childActor1 = inbox.receive(1.second).asInstanceOf[ActorRef]
	inbox.watch(childActor1)
	childActor1 ! 42
	childActor1 ! new Exception("其他异常") //父亲交由上层处理
	inbox.send(childActor1, "get")
	println(inbox.receive(1.second))
}
/*输出：由于线程调度，可能输出顺序和下面不一致
preStart执行
42
恢复中...
42
重启...
postStop执行
preRestart执行
preStart执行
postRestart执行
0
停止...
postStop执行
交由上级处理...
preStart执行
postStop执行
*/
```



### 4、调度器
Akka MessageDispatcher是什么使阿卡演员“tick”，可以这么说是机器的引擎。所有的MessageDispatcher实现也是一个ExecutionContext。这意味着它们可以用来执行任意代码，例如Futures。

调度器决定actor执行中如何分配线程，如何调度等等

#### （1）默认调度器
每个ActorSystem都会有一个默认的调度器，这个调度-器在没有其他配置给Actor的情况下使用。如果ActorSystem是通过ExecutionContext传入来创建的，则此ExecutionContext将用作此ActorSystem中所有程序的执行位置。如果没有给出ExecutionContext，它将回退到akka.actor.default-dispatcher.default-executor.fallback作为执行上下文。默认情况下，这是一个“fork-join-executor”，它在大多数情况下都有出色的性能。

#### （2）获取一个调度器
**编写配置**
```
# 配置一个调度器
my-dispatcher {
  # Dispatcher is the name of the event-based dispatcher
  type = Dispatcher
  # 使用哪种ExecutionService
  executor = "fork-join-executor"
  # 配置fork join池
  fork-join-executor {
    # 最小线程数
    parallelism-min = 2
    # Parallelism (threads) ... ceil(available processors * factor)
    parallelism-factor = 2.0
    # Max number of threads to cap factor-based parallelism number to
    parallelism-max = 10
  }
  # 吞吐量定义了最大的消息数量
  # 一个actor最多只能占用某线程100个消息的时间
  # 设置为1可以尽可能公平地
  throughput = 100
}
```

**在程序中查找到配置，并创建执行上下文**
```scala
// for use with Futures, Scheduler, etc.
implicit val executionContext = system.dispatchers.lookup("my-dispatcher")
```

[更多配置](https://doc.akka.io/docs/akka/current/scala/general/configuration.html)

**单独为一个Actor配置调度器**
```scala
import akka.actor.Props
val myActor =
  context.actorOf(Props[MyActor].withDispatcher("my-dispatcher"), "myactor1")
```

或者使用配置文件
代码正常编写
```scala
import akka.actor.Props
val myActor = context.actorOf(Props[MyActor], "myactor")
```

配置文件
```
akka.actor.deployment {
  /myactor {
    dispatcher = my-dispatcher
  }
}
```



#### （3）调度器的类型
有三种不同类型的消息调度器：
* `Dispatcher`：这是一个基于事件的调度程序，它将一组Actor分别绑定到一个线程池。如果没有指定，这是默认的调度程序。
	* 共享性：不限制
	* 邮箱：任何，为每个Actor创建一个
	* 用例：默认调度程序，Bulkheading
	* Driven by: `java.util.concurrent.ExecutorService`使用“fork-join-executor”，“thread-pool-executor”或akka.dispatcher.ExecutorServiceConfigurator的FQCN指定使用“executor”。
* `PinnedDispatcher` 这个调度器为每个使用它的演员分配一个独特的线程;即每个Actor将拥有自己的线程池，池中只有一个线程。
	* 共享性：不共享
	* 邮箱：任何，为每个Actor创建一个
	* 用例：Bulkheading
	* Driven by: Any akka.dispatch.ThreadPoolExecutorConfigurator. 默认使用 “thread-pool-executor”.
* `CallingThreadDispatcher`：该调度程序仅在当前线程上运行调用。这个调度程序不会创建任何新的线程，但可以同时为不同的线程使用同一个actor，主要用于测试
	* 共享性：不限制
	* 邮箱：按需，任何，每个线程创建一个
	* 用例：测试
	* Driven by: 直接创建线程
	
**更多的调度器配置示例**
配置固定线程池大小的调度程序，例如，用于执行阻塞IO的actor：
```
blocking-io-dispatcher {
  type = Dispatcher
  executor = "thread-pool-executor"
  thread-pool-executor {
    fixed-pool-size = 32
  }
  throughput = 1
}
```
然后使用它：
```scala
val myActor2 =
  context.actorOf(Props[MyActor].withDispatcher("blocking-io-dispatcher"), "myactor2")
```


另一个使用基于内核数量的线程池的例子（例如，用于CPU绑定的任务）
```
# 用于绑定CPU任务
my-thread-pool-dispatcher {
  # Dispatcher is the name of the event-based dispatcher
  type = Dispatcher
  # What kind of ExecutionService to use
  executor = "thread-pool-executor"
  # Configuration for the thread pool
  thread-pool-executor {
    # minimum number of threads to cap factor-based core number to
    core-pool-size-min = 2
    # No of core threads ... ceil(available processors * factor)
    core-pool-size-factor = 2.0
    # maximum number of threads to cap factor-based number to
    core-pool-size-max = 10
  }
  # Throughput defines the maximum number of messages to be
  # processed per actor before the thread jumps to the next actor.
  # Set to 1 for as fair as possible.
  throughput = 100
}
```

“亲和池”，保证同一个Actor在同一个线程执行，减少缓存拷贝
```
affinity-pool-dispatcher {
  # Dispatcher is the name of the event-based dispatcher
  type = Dispatcher
  # What kind of ExecutionService to use
  executor = "affinity-pool-executor"
  # Configuration for the thread pool
  affinity-pool-executor {
    # Min number of threads to cap factor-based parallelism number to
    parallelism-min = 8
    # Parallelism (threads) ... ceil(available processors * factor)
    parallelism-factor = 1
    # Max number of threads to cap factor-based parallelism number to
    parallelism-max = 16
  }
  # Throughput defines the maximum number of messages to be
  # processed per actor before the thread jumps to the next actor.
  # Set to 1 for as fair as possible.
  throughput = 100
}
```

配置PinnedDispatcher：
```conf
my-pinned-dispatcher {
  executor = "thread-pool-executor"
  type = PinnedDispatcher
}
```

使用
```scala
	val myActor3 =
		system.actorOf(Props[MyActor].withDispatcher("my-pinned-dispatcher"), "myactor3")
```

注意：要始终使用相同的线程，需要将`Thread-pool-executor.allow-core-timeout = off`添加到PinnedDispatcher的配置中。


#### （4）阻塞需求需求谨慎管理
在某些情况下，做阻塞操作是不可避免的，也就是说，让一个线程休眠一段时间，等待一个外部事件的发生。例如传统的关系数据库驱动和消息API，原因发生在网络IO延迟。

```scala
class BlockingActor extends Actor {
	def receive = {
		case i: Int =>
			Thread.sleep(5000) //睡眠5秒，模拟阻塞IO
			println(s"Blocking operation finished: ${i}")
	}
}
```
当面对这个问题时，你可能会试图将这个阻塞呼叫包裹在Future中，然后用它来工作，但是这个策略太简单了：当应用程序在增加的负载下运行时，您很可能发现瓶颈或内存或线程不足。
```scala
class BlockingFutureActor extends Actor {
  implicit val executionContext: ExecutionContext = context.dispatcher

  def receive = {
    case i: Int =>
      println(s"Calling blocking Future: ${i}")
      Future {
        Thread.sleep(5000) //block for 5 seconds
        println(s"Blocking future finished ${i}")
      }
  }
}
```

**问题：在默认调度器上阻塞**
关键在这一行
```scala
implicit val executionContext: ExecutionContext = context.dispatcher
```
使用context.dispatcher作为阻塞Future执行的调度器可能是一个问题，因为这个调度器默认用于所有其他的actor处理，除非你为actor设置了一个单独的调度器。

*如果所有可用的线程都被阻塞，那么同一个调度器上的所有参与者将饿死线程，并且将无法处理传入的消息。*

**注意**
* 如果可能的话，也应该避免阻塞API。尝试查找或构建反应式API，使阻塞最小化，或转移到专用调度程序。
* 通常在与现有的库或系统集成时，不可能避免阻塞API。以下解决方案说明如何正确处理阻止操作。
* 请注意，同样的提示也适用于管理Akka任何地方的阻塞操作，包括Streams，Http和其他构建于其上的反应式库。


**模拟出现的问题**
```scala
class PrintActor extends Actor {
	def receive = {
		case i: Int =>
			println(s"PrintActor: ${i}")
	}
}

	val actor1 = system.actorOf(Props(new BlockingFutureActor))
	val actor2 = system.actorOf(Props(new PrintActor))

	for (i <- 1 to 100) {
		actor1 ! i
		actor2 ! i
	}
```

观察输出：可以发现，尽管`PrintActor`不是阻塞的，但是，他任然在某刻停顿的一会。因为，所有的线程全部被Future用光了。


**解决方案：用于阻塞操作的专用调度程序**
隔离阻塞行为的最有效的方法之一是不影响系统的其余部分的是为所有这些阻塞操作准备和使用专用调度器。这种技术通常被称为“bulk-heading”或简称为“隔离阻塞”。

在application.conf中，专用于阻止行为的调度程序应按如下所示进行配置：
```conf
my-blocking-dispatcher {
  type = Dispatcher
  executor = "thread-pool-executor"
  thread-pool-executor {
    fixed-pool-size = 16
  }
  throughput = 1
}
```
编写阻塞actr程序
```scala
class SeparateDispatcherFutureActor extends Actor {
	//找到调度器（执行上下文）
	implicit val executionContext: ExecutionContext = context.system.dispatchers.lookup("my-blocking-dispatcher")

	def receive = {
		case i: Int =>
			println(s"Calling blocking Future: ${i}")
			Future {
				Thread.sleep(5000) //block for 5 seconds
				println(s"Blocking future finished ${i}")
			}
	}
}

	val actor1 = system.actorOf(Props(new SeparateDispatcherFutureActor))
	val actor2 = system.actorOf(Props(new PrintActor))

	for (i <- 1 to 100) {
		actor1 ! i
		actor2 ! i
	}
```
这样就不会阻塞其他actor的正常操作了

**解决阻塞操作的可用方案**
* 在一个actor（或者一个由路由器路由管理的actor）中进行阻塞调用，确保配置一个专用于此目的的线程池或足够大小的线程池。
* 在Future中进行阻塞调用，确保在任何时间点上调用这些调用的数量的上限（提交无限数量的这种性质的任务将耗尽你的内存或线程限制）。
* 在Future中执行阻塞调用，为线程池提供线程池的数量上限，该线程数适合运行应用程序的硬件，如本节所述。
* 将单个线程专用于管理一组阻塞资源（例如，驱动多个通道的NIO选择器），并在事件作为参与者消息发送时分派事件。

第一种可能性特别适合本质上是单线程的资源，比如数据库句柄，传统上一次只能执行一个未完成的查询，并使用内部同步来确保这一点。一个常见的模式是为N个参与者创建一个路由器，每个参与者包装一个数据库连接并处理发送给路由器的查询。然后必须调整数字N以获得最大的吞吐量，这将取决于在哪个硬件上部署了哪个DBMS。







