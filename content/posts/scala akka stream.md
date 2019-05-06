---
title: scala akka stream
date: 2017-11-16T20:22:54+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/116
  - /detail/116/
tags:
  - scala
---

> [参考1](http://blog.csdn.net/tiger_xc?viewmode=contents)

* [四、Stream](#四、Stream)
	*	[1、stream快速入门指南](#1、stream快速入门指南)
	*	[2、基础组件-Source,Flow,Sink](#2、基础组件-Source,Flow,Sink)
	*	[3、数据流图Graph](#3、数据流图Graph)
	*	[4、Streams Cookbook](#4、Streams Cookbook)

## 四、Stream
************************************
### 1、stream快速入门指南
#### （0）流式编程
Stream是一个抽象概念，能把程序数据输入过程和其它细节隐蔽起来，通过申明方式把数据处理过程描述出来，使整体程序逻辑更容易理解跟踪。当然，牺牲的是对一些运算细节的控制能力。

#### （1）引入依赖
```scala
"com.typesafe.akka" %% "akka-stream" % akkaVersion,
```

#### （2）在代码中import
```scala
//流支持
import akka.stream._
import akka.stream.scaladsl._
//其他支持
import akka.{ NotUsed, Done }
import akka.actor.ActorSystem
import akka.util.ByteString
import scala.concurrent._
import scala.concurrent.duration._
import java.nio.file.Paths
```

#### （3）几个例子

```scala
object StreamQuickStart extends App {

	//隐式值，以下需要用到
	implicit val system = ActorSystem("QuickStart")
	implicit val materializer = ActorMaterializer()
	implicit val ec = system.dispatcher

	//例子1：输出0~10
	val source: Source[Int, NotUsed] = Source(1 to 100)
	val done: Future[Done] = source.runForeach(i => println(i))(materializer)


	//例子2 生成一个数列（阶乘），a[0]=1; a[i] = i*a[i-1]，并将其写入文件
	val factorials = source.scan(BigInt(1))((acc, next) => acc * next)

	val result: Future[IOResult] =
		factorials
		  .map(num => ByteString(s"$num\n"))
		  .runWith(FileIO.toPath(Paths.get("factorials.txt")))


	//例子3 定义自己的Sink，字符串按行写入文件
	def lineSink(filename: String): Sink[String, Future[IOResult]] =
		Flow[String]
		  .map(s => ByteString(s + "\n"))
		  .toMat(FileIO.toPath(Paths.get(filename)))(Keep.right)
	factorials
	    .map(i => i.toString) //支持类似集合的流式操作
	    .runWith(lineSink("factorials2.txt"))

	//例子4 按时处理
	factorials
	  .zipWith(Source(0 to 100))((num, idx) => s"$idx! = $num")
	  .throttle(2, 1.second, 10, ThrottleMode.shaping) //对流进行减速，每秒1/2秒1个，第一次释放10个
	  .runForeach(println)

}
```


### 2、基础组件-Source,Flow,Sink
#### （1）Source：数据源
akka-stream属于push模式，所以Source也就是Publisher（数据发布方），Source的形状SourceShape代表只有一个输出端口的形状。Source可以从单值、集合、某种Publisher或另一个数据流产生数据流的元素（stream-element），如下
```scala
package akka.stream.scaladsl

def apply[T](iterable: immutable.Iterable[T]): Source[T, NotUsed]

def single[T](element: T): Source[T, NotUsed] =  
 
def fromIterator[T](f: () ⇒ Iterator[T]): Source[T, NotUsed]

def fromFuture[T](future: Future[T]): Source[T, NotUsed]

def fromPublisher[T](publisher: Publisher[T]): Source[T, NotUsed]

def fromGraph[T, M](g: Graph[SourceShape[T], M]): Source[T, M]
```


#### （2）Sink：数据终端
属于数据元素的使用方，主要作用是消耗数据流中的元素。SinkShape是有一个输入端的数据流形状。
akka-stream实际是在actor上进行运算的。


#### （3）Flow：数据处理节点
对通过输入端口输入数据流的元素进行转变处理（transform）后经过输出端口输出。FlowShape有一个输入端和一个输出端。

在akka-stream里数据流组件一般被称为数据流图（graph）。我们可以用许多数据流图组成更大的stream-graph。
akka-stream最简单的完整（或者闭合）线性数据流（linear-stream）就是直接把一个Source和一个Sink相接。这种方式代表一种对数据流所有元素的直接表现，如：`source.runWith(Sink.foreach(println))`。我们可以用Source.via来连接Flow，用Source.to连接Sink：

#### （4）基础组件的类型参数
```scala
Source[+Out, +Mat]       //Out代表元素类型，Mat为运算结果类型  
Flow[-In, +Out, +Mat]    //In,Out为数据流元素类型，Mat是运算结果类型  
Sink[-In, +Mat]          //In是数据元素类型，Mat是运算结果类型  
```

#### （5）线性流的简单例子
最后流结果返回值的类型设置可以根据`Keep`设置
```scala
package com.lightbend.akka.sample.stream

import akka.{Done, NotUsed}
import akka.actor.ActorSystem
import akka.stream.ActorMaterializer
import akka.stream.scaladsl.{Flow, Keep, RunnableGraph, Sink, Source}

import scala.concurrent.Future

object LinerFlowTest extends App {
	implicit val sys = ActorSystem("LinerFlowTest")
	implicit val mat = ActorMaterializer()
	implicit val ec = sys.dispatcher

	val s1: Source[Int, NotUsed] = Source(1 to 10) //创建流
	val sink: Sink[Any, Future[Done]] = Sink.foreach(println) //创建数据终端
	val rg1: RunnableGraph[NotUsed] = s1.to(sink) //将流与终端连接，并创建数据流图，结果默认为s1个结果
	val rg2: RunnableGraph[Future[Done]] = s1.toMat(sink)(Keep.right) //选择结果为sink（右边）的结果
	val res1: NotUsed = rg1.run()

	Thread.sleep(1000)

	val res2: Future[Done] = rg2.run()

	val seq = Seq[Int](1,2,3)
	def toIterator() = seq.iterator
	val flow1: Flow[Int,Int,NotUsed] = Flow[Int].map(_ + 2) //加2
	val flow2: Flow[Int,Int,NotUsed] = Flow[Int].map(_ * 3) //乘3
	val s2 = Source.fromIterator(toIterator) //创建了另一个流
	val s3 = s1 ++ s2 //将两个流合并在一起成为一个流

	//添加flat
	val s4: Source[Int,NotUsed] = s3.viaMat(flow1)(Keep.right)
	val s5: Source[Int,NotUsed] = s3.via(flow1).async.viaMat(flow2)(Keep.right)
	val s6: Source[Int,NotUsed] = s4.async.viaMat(flow2)(Keep.right)
	//执行终点
	s5.toMat(sink)(Keep.right).run()

	//一些语法糖
	s1.runForeach(println)
	val fres = s6.runFold(0)(_ + _)
	fres.onSuccess{case a => println(a)}
}
```


### 3、数据流图Graph
kka-stream的数据流可以由一些组件组合而成。这些组件统称数据流图Graph，它描述了数据流向和处理环节。Source,Flow,Sink是最基础的Graph。用基础Graph又可以组合更复杂的复合Graph。如果一个Graph的所有端口（输入、输出）都是连接的话就是一个闭合流图RunnableGraph，否则就属于·开放流图PartialGraph。一个完整的（可运算的）数据流就是一个RunnableGraph。Graph的输出出入端口可以用Shape来描述

#### （1）使用内置Shape
```scala
package com.lightbend.akka.sample.stream

import akka.actor._
import akka.stream._
import akka.stream.scaladsl._
import akka.stream.ActorAttributes._
import akka.stream.stage._

import scala.collection.immutable
import scala.util.control.NonFatal


object SimpleGraphsTest extends App {
	implicit val sys = ActorSystem("streamSys")
	implicit val ec = sys.dispatcher
	implicit val mat = ActorMaterializer()

	val source = Source(1 to 10) //源
	val sink = Sink.foreach(println) //终端

	//创建一个source图
	val sourceGraph = GraphDSL.create(){implicit builder =>
		import GraphDSL.Implicits._
		val src = source.filter(_ % 2 == 0) //对source执行过滤flow操作生成src
		val pipe = builder.add(Flow[Int])  //创建一个管道，并添加一个flow模板
		src ~> pipe.in //把刚才flow加入到管道
		SourceShape(pipe.out) //输出管道
	}

	//输出 2 4 6 8 10
	Source.fromGraph(sourceGraph).runWith(sink)

	//创建一个包含Flow模板的流图
	val flow = Flow[Int].map(_ * 2) //flow
	val flowGraph = GraphDSL.create(){implicit builder =>
		val pipe = builder.add(flow) //创建一个管道模板
		FlowShape(pipe.in,pipe.out)
	}

	val (_,fut) = Flow.fromGraph(flowGraph).runWith(source,sink)
	//输出2 4 6 8

	val sinkGraph = GraphDSL.create(){implicit builder =>
		import GraphDSL.Implicits._
		val pipe = builder.add(Flow[Int])
		pipe.out.map(_ * 3) ~> Sink.foreach(println)
		SinkShape(pipe.in) //暴露出in
	}
	val fut1 = Sink.fromGraph(sinkGraph).runWith(source)
	//输出3 6 9...

}
```

#### 4、Streams Cookbook
#### （1）Flow
**场景1：对流中的的元素的记录**
方式1
```scala
	implicit val sys = ActorSystem("streamSys")
	implicit val ec = sys.dispatcher
	implicit val mat = ActorMaterializer()

	val mySource = Source(1 to 10) //源

	val loggedSource = mySource.map { elem => println(elem); elem }
```

方式2
```scala
mySource.log("before-map")
	  .withAttributes(Attributes.logLevels(onElement = Logging.WarningLevel))
	//或者
	implicit val adapter = Logging(system, "customLogger")
	mySource.log("custom")
```

**场景2扁平化序列**
```scala
val myData: Source[List[Message], NotUsed] = someDataSource
val flattened: Source[Message, NotUsed] = myData.mapConcat(identity)
```

其他[参见](https://doc.akka.io/docs/akka/current/scala/stream/stream-cookbook.html)


