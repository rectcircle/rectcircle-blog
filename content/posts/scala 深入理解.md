---
title: scala 深入理解
date: 2017-04-06T22:37:17+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/58
  - /detail/58/
tags:
  - scala
---

> 《深入理解Scala （Scala IN DEPTH）》读书笔记
> https://github.com/jsuereth/scala-in-depth-source

## 一、隐式转换

***

### 1、隐式参数

#### （1）绑定优先级

> 同名标识符的查找优先级

优先级由高到低：

* 本地的、继承的、或者通过定义所在的源代码文件里的package语句所导入的、定义和声明——具有最高优先级
* 显示导入具有此优先级
* 通配导入具有次高优先级
* 非定义所在的源文件里的package语句引入的定义优先级最低

`externalbindings.scala`文件

```scala
package test

object x {
	override def toString = "非定义所在的源文件里的package语句引入的定义优先级最低"
}
```

`testbindings.scala`文件

```scala
package test

object Test {

	object Explicit {
		def x = "显示导入具有此优先级"
	}

	def testSamePackage() {
		println(x)
	}

	object Wildcard {
		def x = "通配导入具有次高优先级"
	}

	def testWildcardImport() {
		import Wildcard._
		println(x)
	}


	def testExplicitImport() {
		import Explicit.x
		import Wildcard._
		println(x)
	}

	def testInlineDefinition() {
		val x = "本地的、继承的、或者通过定义所在的源代码文件里的package语句所导入的、定义和声明——具有最高优先级"
		import Explicit.x
		import Wildcard._
		println(x)
	}

	def main(arg : Array[String]) : Unit = {
		testSamePackage()
		testWildcardImport()
		testExplicitImport()
		testInlineDefinition()
	}
}
```

输出

```
非定义所在的源文件里的package语句引入的定义优先级最低
通配导入具有次高优先级
显示导入具有此优先级
本地的、继承的、或者通过定义所在的源代码文件里的package语句所导入的、定义和声明——具有最高优先级
```

#### （2）隐式解析

scala查找标记为implicit的实体规则：

* **规则1**：隐式实体在查找发生的地点可见（不能有前缀，如foo.x）
* **规则2**：如果按照以上没有找到，那么会在隐式参数的类型的隐式作用域所包含的所有隐式实体里查找
	* 对于`T`类型的隐式作用域指与`T`类型`关联`的所有类型的伴生对象的集合
	* `关联`的含义如下:
		* `T`的全部组成类型（`subtype`）的伴生对象。若T定义为`A with B with C`，则`A B C T`的伴生对象都会被搜索
		* `T`若是参数化类型，则参数类型伴生对象也会被搜索，`List[String]`则`List`、`String`的伴生对象都会被搜索——***通过类型参数获得隐式作用域***（详见[第（3）点](#（3）通过类型参数获得隐式作用域)）
		 若T是一个单例类型`p.T`，那么类型`p`的部分也包含在`T`的部分里。也就是说，`p`也会被搜索——***通过嵌套获取隐式作用域***（详见[第（4）点](#（4）通过嵌套获取隐式作用域)）
		* `T`是`S#T`类型那么`T S`都会被搜索

**规则1实例**

```scala
def findAtInt(implicit x: Int) = x
implicit val test = 5
findAtInt
//res0: Int = 5
```

**规则2实例**

> 以下方式用于提供默认实现，供用户覆盖

**例1**

```scala
object holder { //包装对象
	trait Foo
	object Foo {
		implicit val x = new Foo {
			override def toString: String = "Foo的伴随对象"
		}
	}
}

import holder.Foo
def method(implicit foo: Foo) = println(foo)
method
```

**例2**

```scala
object holder { //包装对象
	trait Foo
	object Foo {
		implicit val x = new Bar {
			override def toString: String = "Bar的伴随对象"
		}
	}
	class Bar extends Foo
}

import holder.Foo
def method(implicit foo: Foo) = println(foo)
method
```

**例3**

```scala
object holder { //包装对象
	trait Foo
	object Foo {
		implicit val x = new Foo {
			override def toString: String = "Foo的伴随对象"
		}
	}

	class Bar extends Foo
	object Bar {
		implicit val x = new Bar {
			override def toString: String = "Bar的伴随对象"
		}
	}
}

import holder.Bar
def method(implicit bar: Bar) = println(bar)
method
//Bar的伴随对象
```

#### （3）通过类型参数获得隐式作用域

```scala
object holder { //包装对象
	trait Foo
	object Foo {
		implicit val list = List(new Foo {
			override def toString: String = "Foo的实现"
		})
	}
}
//defined module holder

implicitly[List[holder.Foo]]
//res0: List[holder.Foo] = List(Foo的实现)

```

> `implicitly[T]`将会查找T的隐式作用域

#### （4）通过嵌套获取隐式作用域

```scala
object Foo{
	trait Bar
	implicit def newBar = new Bar{
		override def toString: String = "隐式的Bar"
	}
}

implicitly[Foo.Bar]
//res0: Foo.Bar = 隐式的Bar
```

### 2、隐式视图

> 包装java类，使之适用于scala的习惯、或增强
> 如scala的String

#### （1）简单示例

```scala
def foo(msg:String) = println(msg)

foo(5) //报错
```

定义一个隐式转换方法（`隐式视图`）

```scala
def foo(msg:String) = println(msg)
//隐式视图
implicit def int2String(x:Int):String = x.toString
foo(5) //正确
```

#### （2）隐式视图使用场景

* 表达式的类型不符合类型要求，编译器会试图找到一个隐式视图是表达式正确
* 给定`e.t`（`t`为`e`的方法或者成员），若`e`中没有成员`t`，则编译器会查找能应用到`e`类型并返回类型包含`t`类型的隐式视图。举例：

```scala
implicit def str2Foo(x:String) = new {
	def foo() = println(s"foo from:${x}")
}

"f".foo
//输出foo from:f
```

#### （3）隐式视图的隐式作用域

```scala
object test{
	trait Foo
	trait Bar
	object Foo {
		implicit def foo2Bar(foo:Foo):Bar = new Bar {}
	}
}

import test._

def bar(x:Bar) = println("bar")
val x = new Foo {}
//回去Foo的隐式作用域寻找合适的隐式转换函数
bar(x)
```

#### （4）样例

假设为java.io.File 提供一个 操作符 `/` 来创建新的文件对象

```scala
class FileWrapper(val file:java.io.File){
	def / (next:String) = new FileWrapper(new java.io.File(file,next))
	override def toString: String = file.getCanonicalPath
}

object FileWrapper{
	implicit def wrap(file:java.io.File):FileWrapper = new FileWrapper(file)
	implicit def unwrap(fileWrapper: FileWrapper):java.io.File = fileWrapper.file
}

import FileWrapper.wrap

val cur = new java.io.File(".")
val wrapper = cur / "temp" //将原始类型转换为包装类型需要显示引入隐式转换

def useFile(file:java.io.File) = println(file.getCanonicalPath)
useFile(wrapper) //将包装类型转换为原始类型，会自动查找隐式作用域（伴生对象），不需要显示引入隐式转换
```

### 3、隐式参数结合默认参数

实现一组方法实现矩阵乘法运算，默认选择当先单线程，使用多线程方式

```scala
import scala.collection.mutable.ArrayBuffer

//矩阵对象
class Matrix (private val repr:Array[Array[Double]]){
	def row(idx:Int):Seq[Double] = {
		repr(idx)
	}
	def col(idx:Int):Seq[Double] = {
		repr.foldLeft(ArrayBuffer[Double]()){
			(buffer,currentRow) =>
				buffer.append(currentRow(idx))
				buffer
		}.toArray
	}

	lazy val rowRank = repr.length
	lazy val colRank = if(rowRank > 0) repr(0).length else 0


	override def toString = "Matrix" + repr.foldLeft(""){
		(msg, row) => msg + row.mkString("\n|"," | ", "|")
	}
}

//多线程接口
trait ThreadStrategy {
	def execute[A](func:()=>A):()=>A
}

//实现一个在当前线程计算的ThreadStrategy（默认的）
object SameThreadStrategy extends ThreadStrategy{
	def execute[A](func:()=>A) = func
}

//矩阵工具对象
object MatrixUtils{
	//计算乘法实现
	def mutiply(a:Matrix, b:Matrix)(implicit threading:ThreadStrategy=SameThreadStrategy) = {
		assert(a.colRank == b.rowRank)
		val buffer = new Array[Array[Double]](a.rowRank)

		for (i <- 0 until a.rowRank) {
			buffer(i) = new Array[Double](b.colRank)
		}

		def computeValue(row: Int, col: Int) = {
			val pairwiseElements = a.row(row).zip(b.col(col))
			val products = for (
				(x, y) <- pairwiseElements
			) yield x * y

			buffer(row)(col) = products.sum
		}

		val computations = for {
			i <- 0 until a.rowRank
			j <- 0 until b.colRank
		} yield threading.execute(()=>computeValue(i,j))
		computations.foreach(_())
		new Matrix(buffer)
	}
}

//以下为用户代码
//测试
val x = new Matrix(Array(Array(1,2,3),Array(4,5,6)))
val y = new Matrix(Array(Array(1),Array(1),Array(1)))

MatrixUtils.mutiply(x,y)

//实现一个并发计算策略（用户实现的）
import java.util.concurrent.{Executors,Callable}
object ThreadPoolStrategy extends ThreadStrategy{
	val pool = Executors.newFixedThreadPool(
		java.lang.Runtime.getRuntime.availableProcessors
	)

	def execute[A](func:()=>A) = {
		val future = pool.submit(new Callable[A] {
			def call():A = {
				Console.println(s"在${Thread.currentThread.getName}线程执行")
				func()
			}
		})
		()=>future.get
	}
}


implicit val ts = ThreadPoolStrategy
MatrixUtils.mutiply(x,y)
```

### 4、限制隐式系统的作用域

隐式绑定可能出现的位置

* 关联类型的伴生对象
* scala.Predef
* 作用域内又有导入语句

#### （1）为导入创建隐式转换

在定义期望被显示导入的隐式视图或者隐式参数要确保

* 隐式视图或参数和其他隐式值没有冲突
* 参数名不能和scala.Predef中的冲突
* 隐式视图或参数用户可发现的，用户可以找到库或者模块的位置和用法，通常把可导入的的隐式转化对象放在以下位置
	* 包对象
	* 带有Implicits后缀的object

`to`冲突演示

```scala
object Time {
	case class TimeRange(start : Long, end : Long)
	implicit def longWrapper(start : Long) = new {
		def to(end : Long) = TimeRange(start, end)
	}
}

object Test {
	println(1L to 10L)
	import Time._
	println(1L to 10L)
	def x() = {
		import scala.Predef.longWrapper
		println(1L to 10L)
		def y() = {
			import Time.longWrapper
			println(1L to 10L)
		}
		y()
	}
	x()
}
```

#### （2）没有导入税的隐式转换

样例实现复数运算

```scala
//complexmath/ComplexNumber.scala
package complexmath

case class ComplexNumber(real:Double, imaginary:Double){
	def *(other : ComplexNumber) = ComplexNumber( (real*other.real) + (imaginary * other.imaginary),
		(real*other.imaginary) + (imaginary * other.real) )
	def +(other : ComplexNumber) = ComplexNumber( real + other.real, imaginary + other.imaginary )

	override def toString: String = this match {
			case ComplexNumber(0,0) => "0"
			case ComplexNumber(0,i) => s"${i}i"
			case ComplexNumber(r,0) => s"${r}"
			case ComplexNumber(r,i) => if(i>0) s"${r} + ${i}i" else s"${r} - ${-i}i"
	}
}


//complexmath/package.scala
import complexmath.ComplexNumber

package object complexmath {
	implicit def real2Complex(r:Double) = new ComplexNumber(r,0.0)
	val i = ComplexNumber(0.0,1.0)
}


//main/Test.scala
package main
import complexmath.i

object Test extends App{

	val x = i * 5.0 + 1.0
	val y = 5.0 * i + 1.0
	val z = 1.0 + 5.0*i
}
```

## 二、类型系统

***

### 1、类型

通过关键字定义一个类型（`class`、`trait`、`object`类型）

```scala
class ClassName
trait TraitName
object ObjectName

def foo(x:ClassName) = x
def bar(x:TraitName) = x
def baz(x:ObjectName.type) = x
```

**注**：使用对象做参数，定义DSL

```scala
//定义领域专用语言DSL语法
object  Now
object simulate{
	def once(behavior:()=>Unit) = new {
		def right(now:Now.type ):Unit = {}
	}
}

simulate once{()=>{}} right Now
```

#### （1）类型和路径

```scala
//类型和路径
class Outer{
	trait Inner
	def in = new Inner {}
	def foo(x:this.Inner) = null
	def bar(x:Outer#Inner) = null
}

//测试
val x = new Outer
val y = new Outer

x.in
x.foo(x.in)
//x.foo(y.in) //报错，类型不匹配
x.bar(x.in)
x.bar(y.in)
```

#### （2）type关键字

**`type`用于构造类型**

* 可以定义具体类型
	* 通过引用具体已存在的类型或则“结构化类型”来构造
* 可以定义抽象类型
	* 用作占位符，以便子类型重定义
* type只能在某种具体的上下文中定义（明确的说就是类、特质或对象中）
* type写法包含：关键字本身和标识符和（可选的类型约束，提供了表示定义了一个具体类型）

**语法**

```scala
type AbstarctType //抽象类型
type ConcreteType = SomeFooType //
type ConcreteType = SomeFooType with SomeBarType //
```

#### （3）结构化类型

**资源处理工具**

```scala
object Resources{
	type Resource = { //定义类型
		def close():Unit //包含方法close
	}
	def closeResource(r:Resource) = r.close //引用类型上的方法
	//对于所有包含close():Unit的对象都可以作为此方法的参数
}

Resources.closeResource(System.in) //关闭System.in流对象
```

**嵌套结构化类型**

```scala
type T = {
	type X = Int //定义类型别名
	def x:X
	type Y  //定义了抽象类型
	def y:Y
}
//x和y方法的类型依赖于当前路径this

object Foo {
	type X = Int
	def x:X = 5
	type Y = String
	def y:Y = "Hello,World!"
}

def test(t:T) = t.x
test(Foo)
//res0: Foo.X = 5

def test1(t:T):t.X = t.x
test1(Foo)
//res1: Foo.X = 5

def test2(t:T):T#X = t.x
test2(Foo)
//res2: Int = 5

def test3(t:T):T#Y = t.y
test3(Foo)
//res3: AnyRef{type X = Int; def x: this.X; type Y; def y: this.Y}#Y = Hello,World!

def test4(t:T):t.Y = t.y
test4(Foo)
//res4: Foo.Y = Hello,World!

def test5(t:T) = t.y
test5(Foo)
//res5: Foo.Y = Hello,World!
```

**路径依赖和结构化类型**

```scala
object Foo{
	type T = {
		type U
		def Bar:U
	}
	val baz:T = new {
		type U = String
		def Bar = "Hello World!"
	}

}

def test(f:Foo.baz.U) = f

test(Foo.baz.Bar)
//res0: Foo.baz.U = Hello World!
```

**实现观察者模式（事件模型）**

```scala
trait Observable { //创建可观察的接口
	type Handle //处理器类型
	//处理器集合
	protected var callbacks = Map[Handle, this.type => Unit]()

	//注册事件回调函数
	def observe(callback : this.type => Unit) : Handle = {
		val handle = createHandle(callback)
		callbacks += (handle -> callback)
		handle
	}

	//取消订阅此事件的某回调函数
	def unobserve(handle : Handle) : Unit = {
		callbacks -= handle
	}

	//执行回调函数，（通知监听器）
	protected def notifyListeners() : Unit =
		for(callback <- callbacks.values) callback(this)

	//Subclasses override this to provide their own callback disambiguation scheme.
	//子类覆此方法；来提供他们的自己的回调来消除歧义，用到类型依赖，必须是本类型的才可以
	protected def createHandle(callback : this.type => Unit) : Handle

}

//实现handle的默认实现
trait DefaultHandles extends Observable {
	type Handle = (this.type => Unit) //类型为函数类型
	protected def createHandle(callback : this.type => Unit) : Handle = callback
}

//具体的事件源
class IntStore(private var value:Int) extends Observable with DefaultHandles{
	def get:Int = value
	def set(newValue:Int) : Unit = {
		value = newValue
		notifyListeners
	}

	override def toString: String = s"IntStore(${value})"
}


//测试事件系统=================
val x = new IntStore(5)

val handlex = x.observe( obj=> println(s"值发生改变为：${obj.get}") )
val handle = x.observe(println)
//订阅事件

x.set(2)
//值发生改变为：2
//IntStore(2)

x.unobserve(handle) //取消订阅

x.set(4)
//值发生改变为：4

//测试路径依赖=================
//回调函数
val cb = println(_:Any)

val y = new IntStore(2)
val z = new IntStore(3)

val handley = y.observe(cb)
val handlez = z.observe(cb)

handley==handlez
//res3: Boolean = true
//两个类型虽然相等，当时但是依赖路径不同

//z.unobserve(handley) //报错，类型不匹配，路径依赖保护了代码
z.unobserve(handlez)
```

### 2、类型约束

* 下界（子类型约束）`>:`
* 上界（超类型约束，也称一致性约束） `<:`

**下界**

所选类型必须是等于下界或者下界的父类型

```scala
class A {
	type B >: List[Int]
	def foo(a:B) = a
}

val x = new A{ type B = Traversable[Int]}

val y = new A{type B = Set[Int]} //报错，违反下界约束
```

**上界**

```scala
class A {
	type B <: Traversable[Int]
	def count(b:B) = b.foldLeft(0)(_+_)
}

val x = new A{ type B = List[Int]}
x.count(List(1,2))
//x.count(Set(1,2)) //报错

//val y = new A{type B = Set[Int]} //报错，违反下界约束
y.count(Set(1,2))
```

> 最大上界是`Any`
> 最大下界是`Nothing`

### 3、类型参数和高阶类型

#### （1）类型参数的约束

相当于泛型

```scala
def randomElement[A](x:Seq[A]):A = x.last

randomElement[Int](List(1,2,3))

//randomElement[Int](List("1","2","3")) //报错

```

#### （2）高阶类型

使用type关键字构造高阶类型

**用于简化类型签名**

```scala
type Callback[T] = Function1[T,Unit]
val x:Callback[Int] = y => println(y+2)

x(1)
```

**使复杂类型符合想调用的方法所要求的简单类型签名**

```scala
def foo[M[_]](f:M[Int]) = f

foo[Callback](x)
//foo[Function1](x) //报错
```

**类型lambda**

```scala
foo[Callback](x)
等价于
foo[({type X[Y] = Function1[Y,Unit]})#X]((x:Int)=>println(x))
```

### 4、型变

#### （1）简介

**分类**

* 不变（Invariance）默认规则
* 协变（Covariance）
* 逆变（Contravariance）

**术语**

如果能把高阶类型`T[B]`赋值给`T[A]`，就说**T[A]顺应T[B]**

#### （2）不变

若T[A]顺应于T[B]，那么A就一定等于B

#### （3）协变

指的是可以将类型参数替换为其父类的能力，
类似于父类引用可以接收子类对象
若`T[A]`顺应`T[B]`，那么`A`是`B`的父类，`A`也用该顺应`B`

一般用于**方法的返回值**

```scala
class T[+A]{}

class A
class B extends A

val x = new T[B]
val y:T[A] = x

val z = new T[A]
//val s:T[B] = z //报错
```

声明为协变的类型参数不能用于**方法的参数**

```scala
trait T[+A]{
	def thisWilNotWork(a:A)=a //报错
}
```

#### （4）逆变

若`T[A]`顺应`T[B]`，那么`A`是`B`的子类，`B`应该顺应`A`
一般用于**方法的参数**

```scala
class T[-A]{}

class A
class B extends A

val x = new T[B]
//val y:T[A] = x //报错

val z = new T[A]
val s:T[B] = z
```

方法中的隐式型变

```scala
def foo(x:Any):Unit = println("foo 接收 Any类型参数")

def bar(x:String):Unit = foo(x)

bar("this")
```

#### （5）综合样例

定义一个函数对象

**版本1**

```scala
trait Function[Arg,Return]

val x = new Function[Any,String]{}

//val y:Function[String,Any] = x // 报错
//val y:Function[Any,Any] = x //报错
```

**版本2**

```scala
trait Function[Arg,+Return]

val x = new Function[Any,String]{}

//val y:Function[String,Any] = x // 报错
val y:Function[Any,Any] = x
```

**版本3**

```scala
trait Function[-Arg,+Return]

val x = new Function[Any,String]{}

val y:Function[String,Any] = y // 报错
val z:Function[Any,Any] = x
```

**完整版本**

```scala
trait Function[-Arg,+Return]{
	def apply(arg:Arg):Return
}

val foo = new Function[Any,String]{
	override def apply(arg: Any): String = s"你好，我收到了一个参数${arg}"
}

val bar:Function[String, Any] = foo

bar("test") //输出：你好，我收到了一个参数test
```

比较

```scala
def foo(x:Any):String = s"你好，我收到了一个参数${x}"

def bar(x:String):Any = foo(x)

bar("this") //输出：你好，我收到了一个参数test
```

#### （6）总结

* 逆变不能用于函数的返回值类型或高阶类型，逆变会推导子类型
* 协变不能用于函数参数的类型或高阶类型，协变会推导父类型

#### （7）高级型变注解

```scala
trait List[+ItemType] {
	def ++[otherItemType>:ItemType](other:List[otherItemType]):List[otherItemType]
}

class ListImpl[ItemType] extends List[ItemType]{
	def ++[otherItemType>:ItemType](other:List[otherItemType]):List[otherItemType]
		= other
}

val strings = new ListImpl[String]

val ints = new ListImpl[Int]

val anyRefs = new ListImpl[AnyRef]

strings ++ ints
strings ++ anyRefs
strings ++ strings
```

对于上例，编译器会自动查找父类型，并保留下来。

当遇到协变逆变故障时，可以通过引入一个新的类型参数类解决，把故障类型作为上界或者下界

### 5、存在类型

为了和java没有使用泛型的集合交互，scala使用存在类型

在java中定义

```java
public class Test{
	public static List makeList(){
		return new ArrayList(); //没有使用泛型
	}
}
```

在scala中调用

```scala
Test.makeList
//返回类型为res0: java.util.List[_] = []

//不能再里面添加元素
```

#### （1）正式语法

```
T forSome(Q) //Q为一组类型的声明
```

简写与正式语法对比

```scala
val y:List[_] = List()
val x:List[X forSome {type X}] = y

val y:List[_ <: AnyRef] = List()
val x:List[X forSome {type X <: AnyRef }] = y
```

#### （2）使用存在类型改进事件系统

参见 （3）结构化类型

我们希望维护一个包含所有事件回调函数的列表叫做`Dependencies`

```scala
trait Dependencies{
	type Ref = x.Handle forSome {val x:Observable}
	var handles = List[Ref]()

	//一些操作函数
	def add(h:Ref) = handles :+ h
	//......
	//直接在此完成订阅事件，并加入处理函数列表
	def observe[T<:Observable](event:T)(handle:T=>Unit) ={
		val ref = event.observe(handle)
		add(ref) //使用 -feature
		ref
	}
}

val zz = new IntStore(2)
val d = new  Dependencies {}

d.observe(zz)(cb)
```

## 三、隐式转换和类型系统结合

***

### 1、上下文边界和视图边界

**视图边界**

要求必须存在一个隐式类型来转换类型

```scala
class B
def foo[A <% B](x:A) = x
```

等价形式——显示隐式参数列表

```scala
class B
def foo[A](x:A)(implicit $ev0:A=>B) =x
```

**上下文边界**

```scala
class B[A]
def foo[A : B](x:A) = x
```

等价形式——显示隐式参数列表

```scala
class B[A]
def foo[A](x:A)(implicit $ev0:B[A])
```

以上两种形式如何选择，以下情况使用视图边界\上下文边界

* 方法代码不需要直接访问隐式参数，但是依赖隐式解析机制（也就是说需要隐式转换的结），也就是说你需要隐式参数以便另一个操作自动调用
* 类型参数的表达力更强的时候

#### （1）何时使用隐式类型约束

在使用多态时，尽量减少类型信息的丢失

要求方法的参数可以被序列化

```scala
trait Receiver[A]{
	def send(x:A) = println(x)
}

def sendMsgToMsg[A:Serializable](receivers:Seq[Receiver[A]], a:A) = {
	receivers foreach (_.send(a))
}
```

### 2、用隐式转换来捕捉类型

#### （1）捕获类型用于运行时

* `Manifest`（TypeTag）：保存了类型`T`的反射实例和所有类型参数的类型信息
* `OptManifest`：
* `ClassManifest`（ClassTag）：对于ClassTag[T[A]]只保留类型`T`，不保留A类型

#### （2）使用Manifest

```scala
import scala.reflect.ClassTag

def first[A](s:Seq[A]) = Seq(s(0))

//def first1[A](s:Array[A]) = Array(s(0)) //报错
//ClassManifest已废弃
def first2[A:ClassTag](s:Array[A]) = Array(s(0))
//等价于
def first3[A](s: Array[A])(implicit evidence$2: ClassTag[A]) = Array(s(0))
```

#### （3）捕获输入类型

自动类型推断右边的依赖左边的推断结果

```scala
def foo[A](col:List[A])(f:A=>Boolean) = null
foo(List("string"))(_.isEmpty)

//def foo[A](col:List[A], f:A=>Boolean) = null
//foo(List("string"),_.isEmpty) //报错
```

推断类型参数的类型参数的推断失败

```scala
def peek[A, C <: Traversable[A]] (col:C) = (col.head,col)
//peek(List(1,2,3)) //报错，无法推断出A的类型
```

使用`<:<`

```scala
def peek[A, C] (col:C)(implicit ev: C <:< Traversable[A]) = (col.head,col)
peek(List(1,2,3))
```

`<:<`的定义

```scala
sealed abstract class <:<[-From, +To]() extends scala.AnyRef with scala.Function1[From, To] with scala.Serializable {

}

implicit def $conforms[A] : Predef.<:<[A, A] = {
	def apply(x:A) = x
}
```

`A <:< B` 含义，用于使用`<:`无法推断出类型，表示A必须是B的子类

#### （4）特定方法

使用隐式转换，限制某些方法的使用，仅某些类型参数可以使用

```scala
//在List中实现了一个“特定方法”，仅对于实现了Numeric[B]的参数可用
def sum[B >: A](implicit num: Numeric[B]): B = foldLeft(num.zero)(num.plus)

//用户实现的类型
implicit object stringNumber extends Numeric[String] {
	override def plus(x: String, y: String): String = x + y
	override def zero: String = ""
}

List("1","2","3").sum
```

执行流程

* List检查`sum`方法，发现没有提供隐式参数
* 进行隐式搜索，在当前隐式作用域中查找`Numeric[T]`类型（`T>:String`）的隐式变量
* 将隐式变量注入隐式参数列表
