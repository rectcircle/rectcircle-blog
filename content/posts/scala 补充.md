---
title: scala 补充
date: 2017-03-31T23:10:20+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/55
  - /detail/55/
tags:
  - scala
---

### 1、模式匹配之Extractor

***

#### （1）固定参数的模式定义

实现匹配Email地址

**定义1**

```scala
object EMail {
    def apply(user:String,domain:String) = user + "@" + domain
    def unapply(str:String) :Option[(String,String)] ={
        val parts = str split "@"
        if(parts.length==2) Some(parts(0),parts(1)) else None
    }
}
```

**使用**

```scala
"james.shen@guidebee.com" match{
    case EMail(user,domain) => println (user +" AT " + domain)
    case _ =>
}
```

#### （2）无参数和带一个参数的模式定义

**定义2**

```scala
object Twice {
    def apply(s:String) = s + s
    def unapply(s:String):Option[String] ={
        val length=s.length/2
        val half = s.substring(0,length)
        if(half == s.substring(length)) Some(half) else None
    }
}

object UpperCase {
    def unapply(s:String):Boolean = s.toUpperCase ==s
}
```

**使用**

```scala
"abcd" match{
	case Twice(x) => x
	case _ => "no match"
}
//no match

"abab" match{
	case Twice(x) => x
	case _ => "no match"
}
//abab

"ab" match{
	case x @ UpperCase() => x
	case _ => "no match"
}
//no match

"AB" match{
	case x @ UpperCase() => x
	case _ => "no match"
}
//AB

def userTwiceUpper(s:String) = s match{
    case EMail(Twice(x @ UpperCase()),domain) =>
        "match:" + x + " in domain " + domain
    case _ => "no match"
}

userTwiceUpper("DIDI@hotmail.com")
//res1: String = match:DI in domain hotmail.com

userTwiceUpper("DIDO@hotmail.com")
//res2: String = no match

userTwiceUpper("didi@hotmail.com")
//res2: String = no match

```

#### （3）可变参数的模式定义

**定义**

```scala
//单纯可变参数
object Domain{
    def apply(parts:String *) :String = parts.reverse.mkString(".")
    def unapplySeq(whole:String): Option[Seq[String]] =
        Some(whole.split("\\.").reverse)
}

//固定+可变
object ExpendedEMail{
    def unapplySeq(email: String)
        :Option[(String,Seq[String])] ={
        val parts = email split "@"
        if(parts.length==2)
            Some(parts(0),parts(1).split("\\.").reverse)
        else
            None
    }
}
```

**使用**

```scala
def isTomDotCom(s:String):Boolean =s match{
    case EMail("tom",Domain("com",_*)) => true
    case _ => false
}

isTomDotCom("tom@sun.com")

val s ="james.shen@mail.guidebee.com"
val ExpendedEMail(name,topdomain,subdoms @ _*) =s
//name: String = james.shen
//topdomain: String = com
//subdoms: Seq[String] = WrappedArray(guidebee, mail)

```

#### （4）样例——使用模式匹配实现四则运算

```scala
import scala.collection.mutable

trait BinaryOp{
	val op:String
	def apply(expr1:String,expr2:String) = expr1 + op + expr2
	def unapply(str:String) :Option[(String,String)] ={
		val index = str indexOf op
		if(index>0)
			Some(str substring(0,index),str substring(index+1))
		else None
	}
}

object Multiply  extends {val op="*"} with BinaryOp
object Divide  extends {val op="/"} with BinaryOp
object Add  extends {val op="+"} with BinaryOp
object Subtract  extends {val op="-"} with BinaryOp


object Bracket{
	def matchBracket(str:String):Option[(Int,Int)] ={
		val left = str.indexOf('(')
		if(left >=0) {
			val stack = mutable.Stack[Char]()
			val remaining = str substring (left+1)
			var index=0
			var right=0
			for(c <-remaining if right==0){
				index=index + 1
				c match{
					case '(' => stack push c
					case ')'  => if (stack.isEmpty)  right= left+index else stack.pop
					case _ =>
				}
			}

			Some(left,right)
		}else  None
	}

	def apply(part1:String,expr:String,part2:String) =part1+ "(" + expr + ")"+ part2
	def unapply(str:String) :Option[(String,String,String)] ={
		Bracket.matchBracket(str) match{
			case Some((left:Int,right:Int)) =>
				val part1 = if (left == 0) "" else str substring(0, left )
				val expr = str substring(left + 1, right)
				val part2 = if (right == str.length-1) "" else str substring (right+1)
				Some(part1, expr, part2)
			case _ => None
		}
	}
}

class Rational (n:Int, d:Int) {
	require(d!=0)
	private val g =gcd (n.abs,d.abs)
	val numerator =n/g
	val denominator =d/g
	override def toString =
		if(numerator % denominator == 0) (numerator / denominator).toString  else numerator + "/" +denominator

	def +(that:Rational)  =
		new Rational(
			numerator * that.denominator + that.numerator* denominator,
			denominator * that.denominator
		)

	def -(that:Rational)  =
		new Rational(
			numerator * that.denominator - that.numerator* denominator,
			denominator * that.denominator
		)

	def * (that:Rational) =
		new Rational( numerator * that.numerator, denominator * that.denominator)

	def / (that:Rational) =
		new Rational( numerator * that.denominator, denominator * that.numerator)

	def this(n:Int) = this(n,1)
	private def gcd(a:Int,b:Int):Int =
		if(b==0) a else gcd(b, a % b)
}

def eval(str:String):Rational = str match{
	case Bracket(part1, expr, part2) => eval(part1 + eval(expr) + part2)
	case Add(expr1,expr2) => eval(expr1) + eval(expr2)
	case Subtract(expr1,expr2) => eval(expr1) - eval(expr2)
	case Multiply(expr1,expr2) => eval(expr1) * eval(expr2)
	case Divide(expr1,expr2) => eval(expr1) / eval(expr2)
	case _ => new Rational (str.trim.toInt,1)
}

eval("1+5+7")
eval("4*5-2/2")
eval ("1+2+(3*5)+3+3*(3+(3+5))")
eval ("4*6+3*3+5/7")
```

#### （5）样例——实现List全排列

```scala
def permutations(l:List[Int]):List[List[Int]] = {
	l match {
		case Nil => List(List())
		case (head::tail) =>
			for(p0 <- permutations(tail); //p0 剩下元素的全排列的一个
				i<-0 to p0.length ; //0~p0.length
				(xs,ys) = p0 splitAt i) //分割
				yield
					xs:::List(head):::ys
	}
}

permutations(List(1,2,3)).mkString("\n")
```

### 2、scala使用正则表达式

***

#### （1）创建正则表达式

```scala
import scala.util.matching.Regex
import scala.util.matching.Regex

val Deciaml = new Regex("(-)?(\\d+)(\\.\\d*)?")
//或者 不要转移/
//val Deciaml = new Regex("""(-)?(\d+)(\.\d*)?""")
//或者 类似
//val Deciaml = """(-)?(\d+)(\.\d*)?""".r

//Deciaml: scala.util.matching.Regex = (-)?(\d+)(\.\d*)?

```

#### （2）使用正则查找字符串

* `regex findFirstIn Str` ：查找第一个匹配的字符串，返回 Option 类型。
* `regex findAllIn str` ：查找所有匹配的字符串，返回 Interator 类型。
* `regex findPrefixOf str`：从字符串开头检查是否匹配正则表达式，返回 Option 类型。

#### （3）使用正则分解数据

Scala 所有定义的正则表达式都定义了一个 Extractor，可以用来解析正规表达式中对应的分组。比如前面定义的 Decimal 定义了三个分组，可以直接用来解析一个浮点数：

```scala
val Decimal(sign,integerpart,decimalpart) = "-1.23"
//sign: String = -
//integerpart: String = 1
//decimalpart: String = .23
```

如果对应的分组查找不到，则返回 Null。比如：

```scala
val Decimal(sign,integerpart,decimalpart) = "1.0"
//sign: String = null
//integerpart: String = 1
//decimalpart: String = .0
```

这种分解方法同样可以应用到 for 表达式中，例如：

```scala
for(Decimal(s,i,d) <- Decimal findAllIn input)
    println ("sign: " +s + ",integer:" +
    i + ",deciaml:" +d)

//sign: -,integer:1,deciaml:.0
//sign: null,integer:99,deciaml:null
//sign: null,integer:3,deciaml:null
```

### 3、scala macro

### 4、自定义插值处理器

#### （1）系统提供的插值处理器

**s 字符串插值器**

```scala
val name="James"
println(s"Hello,$name")//Hello,James 此例中，$name嵌套在一个将被s字符串插值器处理的字符串中。插值器知道在这个字符串的这个地方应该插入这个name变量的值，以使输出字符串为Hello,James。使用s插值器，在这个字符串中可以使用任何在处理范围内的名字。
```

字符串插值器也可以处理任意的表达式。例如：

```scala
println(s"1+1=${1+1}") 将会输出字符串1+1=2。任何表达式都可以嵌入到${}中。
```

**f 插值器**

```scala
val height=1.9d
val name="James"
println(f"$name%s is $height%2.2f meters tall")//James is 1.90 meters tall f 插值器是类型安全的。如果试图向只支持 int 的格式化串传入一个double 值，编译器则会报错。例如：

// f"$height%4d"  //报错
```

**raw 插值器**

除了对字面值中的字符不做编码外，raw 插值器与 s 插值器在功能上是相同的。如下是个被处理过的字符串：

```scala
s"a\nb"
raw"a\nb"
```

#### （2）自定义插值

```scala
implicit class EmailHelper(val sc: StringContext) {
	def emails(args: Any*) = {
		println(sc.parts)
		for(arg <- args) yield arg.toString
	}
}

s"${1+2}"

var email ="sunben@163.com"
emails"测试${email}测试"
```

### 5、高级类型

> http://www.importnew.com/4307.html

#### （1）上下文边界和视图边界

参见[上下文边界和视图边界](https://www.rectcircle.cn/detail/58#1、上下文边界和视图边界)

#### （2）其他类型边界

* `A =:= B`	A必须等于B
* `A <:< B`	A必须是B的子类
* `A <% B`	A必须看作是B，存在从A=>B的隐式转换

对于`C[A]`类型，某种方法中定义了`A=:=Int`，那么该方法只能在`C[Int]`类型的实例才内使用，否者编译报错

```scala
class Container[A](value: A) {
	def addIt(implicit evidence: A =:= Int) =
		123 + value
}

new Container(123).addIt
//new Container("123").addIt //报错
```

视图边界

```scala
class Container[A](value: A) {
	def addIt(implicit evi:A => Int):Int = 123 + value
}

implicit val evi : String=>Int = Integer.parseInt
new Container("123").addIt
```

**注意不要出现递归调用隐式转换**

```scala
class Container[A](value: A) {
	def addIt(implicit evi:A => Int):Int = 123 + value
}

implicit val evi : String=>Int = _.toInt
new Container("123").addIt
```

* `_.toInt` 需要String=>Int的隐式转换，如此递归调用造成java.lang.StackOverflowError

### （3）通过视图来进行泛型编程

**Seq[A]定义的min方法**

```scala
def min[B >: A](implicit cmp: Ordering[B]): A = {
  if (isEmpty)
    throw new UnsupportedOperationException("empty.min")

  reduceLeft((x, y) => if (cmp.lteq(x, y)) x else y)
}
```

调用此方法

```scala
Seq(1,2,3).min

Seq(1,2,3).min(new Ordering[Int]{
	override def compare(a:Int, b:Int) = b compare a
})
```

优点：

* 集合中的元素不需要去实现Ordered，但是依然可以使用Ordered进行静态类型检测
* 你可以直接定义你自己的排序，而不需要额外的类库支持

### （3）高度类型化的类型&临时多态

例如，假设你需要多个类型的container来处理多个类型的数据。你可能会定义一个Container接口，然后它会被多个container类型实现：一个Option，一个List,等等。你想要定义一个Container接口，并且你需要使用其中的值，但是你不想要确定值的实际类型。

```scala
trait Container[M[_]] {
	def put[A](x: A): M[A]
	def get[A](m: M[A]): A
}

implicit val listContainer = new Container[List] {
	def put[A](x: A) = List(x)
	def get[A](m: List[A]) = m.head
}

implicit val optionContainer = new Container[Some] {
	def put[A](x: A) = Some(x)
	def get[A](m: Some[A]) = m.get
}

def tupleize[M[_]: Container, A, B](fst: M[A], snd: M[B]) = {
	val c = implicitly[Container[M]] //进行隐式查找
	c.put(c.get(fst), c.get(snd))
}

tupleize(Some(1), Some(2))
tupleize(List(1), List(2))
```

#### （4）F-bounded多态

自身是自身的类型参数

```scala
trait Container[A <: Container[A]] extends Ordered[A]


class MyContainer extends Container[MyContainer] {
	def compare(that: MyContainer): Int = 0
}

List(new MyContainer, new MyContainer, new MyContainer)

class YourContainer extends Container[YourContainer] {
	def compare(that: YourContainer) = 0
}

List(new MyContainer, new MyContainer, new MyContainer, new YourContainer)
//List(new MyContainer, new MyContainer, new MyContainer, new YourContainer).min //报错
```

#### （5）结构化类型

参见[结构化类型](https://www.rectcircle.cn/detail/58#（3）结构化类型)

#### （6）类型擦除和Manifest

Manifest参见

* [scala反射](#6、scala反射)
* [用隐式转换来捕捉类型](#https://www.rectcircle.cn/detail/58#2、用隐式转换来捕捉类型)

#### （7）twitter范例

https://github.com/twitter/finagle

```scala
trait Service[-Req, +Rep] extends (Req => Future[Rep])

trait Filter[-ReqIn, +RepOut, +ReqOut, -RepIn]
  extends ((ReqIn, Service[ReqOut, RepIn]) => Future[RepOut])
{
  def andThen[Req2, Rep2](next: Filter[ReqOut, RepIn, Req2, Rep2]) =
    new Filter[ReqIn, RepOut, Req2, Rep2] {
      def apply(request: ReqIn, service: Service[Req2, Rep2]) = {
        Filter.this.apply(request, new Service[ReqOut, RepIn] {
          def apply(request: ReqOut): Future[RepIn] = next(request, service)
          override def release() = service.release()
          override def isAvailable = service.isAvailable
        })
      }
    }

  def andThen(service: Service[ReqOut, RepIn]) = new Service[ReqIn, RepOut] {
    private[this] val refcounted = new RefcountedService(service)

    def apply(request: ReqIn) = Filter.this.apply(request, refcounted)
    override def release() = refcounted.release()
    override def isAvailable = refcounted.isAvailable
  }
}
```

一个服务可以通过一个filter来验证请求。

```scala
trait RequestWithCredentials extends Request {
  def credentials: Credentials
}

class CredentialsFilter(credentialsParser: CredentialsParser)
  extends Filter[Request, Response, RequestWithCredentials, Response]
{
  def apply(request: Request, service: Service[RequestWithCredentials, Response]): Future[Response] = {
    val requestWithCredentials = new RequestWrapper with RequestWithCredentials {
      val underlying = request
      val credentials = credentialsParser(request) getOrElse NullCredentials
    }

    service(requestWithCredentials)
  }
}
```

### 6、scala反射

#### （1）获取运行时类型信息

使用`typeTag`获取运行时类型信息TypeTag对象（`TypeTag`封装了`Type`）,其包括了泛型信息
使用`typeOf`获取运行时类型信息Type对象,其包括了泛型信息
使用`classTag`获取运行时类型信息`ClassTag`对象，不包括泛型信息
使用`classOf`获取运行时类型信息`Class`对象，不包括泛型信息

```scala
//1
import scala.reflect.runtime.universe._
val tt = typeTag[List[Int]]
val t = tt.tpe
//2
val t1 = typeOf[List[Int]]

//3
import scala.reflect._
val clsTag = classTag[List[Int]]
val cc = clsTag.runtimeClass
//4
val c1 = classOf[List[Int]]
```

获取具体类型的类型信息的实现

```scala
import scala.reflect.runtime.universe._
def getTypeTag[T: TypeTag](obj: T) = typeTag[T]

getTypeTag(List(1,2,3))
```

通过`Type`获取类型的成员

```scala
val theType = getTypeTag(List(1,2,3)).tpe

//获取这种类型作用域下的直接声明的成员信息
val decls = theType.decls
```

#### （2）运行时创建对象

```scala
case class Person(id: Int, name: String)

import scala.reflect.runtime.universe._

//获取类加载器镜像
val m:Mirror = runtimeMirror(getClass.getClassLoader)

//类符号量
val classPerson = typeOf[Person].typeSymbol.asClass
//加载器镜像(类符号) => 获取类的镜像
val cm = m.reflectClass(classPerson)
//获取构造函数符号量
val ctor = typeOf[Person].decl(termNames.CONSTRUCTOR).asMethod

//类的镜像(构造函数符号量) => 构造函数镜像
val ctorm = cm.reflectConstructor(ctor)

//创建一个对象
val p = ctorm(1, "Mike")
```

要想通过Type对象获取相关信息，必须借助Mirror，Mirror是按层级划分的，有

* ClassLoaderMirror
* ClassMirror
* InstanceMirror
* ModuleMirror
* MethodMirror
* FieldMirror

通过ClassLoaderMirror可以创建

* ClassMirror
* InstanceMirror
* ModuleMirror
* MethodMirror
* FieldMirror

通过ClassMirror、 InstanceMirror可以创建

* MethodMirror
* FieldMirror

ModuleMirror用于处理单例对象，通常是由object定义的。

#### （3）运行时类成员访问

```scala
case class Person(id: Int, name: String)

import scala.reflect.runtime.universe._

//获取类加载器镜像
val m:Mirror = runtimeMirror(getClass.getClassLoader)
//创建一个对象
val p = Person(1, "Mike")
//获取名为name的成员的符号量
val nameTermSymb = typeOf[Person].decl(TermName("name")).asTerm

//获取类符号量
val classPerson = typeOf[Person].typeSymbol.asClass
//加载器(对象实例) => 实例镜像
val im = m.reflect(p)
//实例镜像(成员的符号量) => 字段镜像
val nameFieldMirror = im.reflectField(nameTermSymb)

//获取该变量的值
nameFieldMirror.get
//设置该变量的值
nameFieldMirror.set("Jim")
p
```

#### （4）反射官方文档——overview

> http://docs.scala-lang.org/overviews/reflection/overview

**运行时反射**

什么是运行时反射？给定运行时某些对象的类型或实例，反射有以下能力：

* 检查该对象的类型，包括通用类型，
* 实例化新对象，
* 或访问或调用该对象的成员。

**例子**

检查运行时类型（在运行时包括通用类型）
与其他JVM语言一样，Scala的类型在编译时被擦除。这意味着如果要检查某些实例的运行时类型，则可能无法访问Scala编译器在编译时可用的所有类型信息。

`TypeTag`可以被认为是将编译时可用的所有类型信息携带到运行时的对象。虽然，请注意，TypeTags始终由编译器生成。当需要使用TypeTag的隐式参数或上下文被使用时，就会触发这一生成器。这意味着，通常，只能使用隐式参数或上下文边界获取TypeTag。

例如，使用上下文边界：

```scala
import scala.reflect.runtime.{universe => ru}
//import scala.reflect.runtime.{universe=>ru}

val l = List(1,2,3)
//l: List[Int] = List(1, 2, 3)

def getTypeTag[T: ru.TypeTag](obj: T) = ru.typeTag[T]
//getTypeTag: [T](obj: T)(implicit evidence$1: ru.TypeTag[T])ru.TypeTag[T]

val theType = getTypeTag(l).tpe
//theType: ru.Type = List[Int]
```

首先我们引入了`scala.reflect.runtime.universe`，我们创建了一个`List[Int]`类型`l`。然后我们创建了一个方法`getTypeTag`，他有一个用于上下文绑定的类型参数`T`（正如REPL所示，这个方法的等价形式定义了一个隐式参数，它让编译器生为T成了一个TypeTag对象）。最后，我们调用我们的方法，以`l`作为参数，并调用`tpe`方法，返回一个TypeTag所包含的类型。正如我们看到的，我们精确的获取了编译类型（同时包含了List的类型参数）`List[Int]`。

一旦我们获得了所需的类型实例，我们可以检查它，例如：

```scala
val decls = theType.declarations.take(10)
//decls: Iterable[ru.Symbol] = List(constructor List, method companion, method isEmpty, method head, method tail, method ::, method :::, method reverse_:::, method mapConserve, method ++)
```

**运行时实例化对象**

通过反射获得的类型可以通过使用适当的“调用者”mirror调用其构造函数来实例化（mirror 在下面展示）。

```scala
case class Person(name: String)
//defined class Person

val m = ru.runtimeMirror(getClass.getClassLoader)
//m: scala.reflect.runtime.universe.Mirror = JavaMirror with ...
```

在第一步中，我们获得一个mirror `m`，它使所有类和类型可用，由当前类加载器加载，包括类Person。

```scala
val classPerson = ru.typeOf[Person].typeSymbol.asClass
//classPerson: scala.reflect.runtime.universe.ClassSymbol = class Person

val cm = m.reflectClass(classPerson)
//cm: scala.reflect.runtime.universe.ClassMirror = class mirror for Person (bound to null)
```

第二步是使用reflectClass方法获取Class Person的ClassMirror。 ClassMirror提供对Person类的构造函数的访问。

```scala
val ctor = ru.typeOf[Person].declaration(ru.nme.CONSTRUCTOR).asMethod
//ctor: scala.reflect.runtime.universe.MethodSymbol = constructor Person
```

Person的构造器symbol可以通过scala.reflect.runtime.universe获取Person的type中查找到

```scala
val ctorm = cm.reflectConstructor(ctor)
//ctorm: scala.reflect.runtime.universe.MethodMirror = constructor mirror for Person.<init>(name: String): Person (bound to null)

val p = ctorm("Mike")
//p: Any = Person(Mike)
```

通过Class Person的ClassMirror和Person的构造器symbol获取一个构造器 Mirror

**访问和调用运行时类型的成员**

一般来说，使用适当的“调用者”Mirror来访问运行时类型的成员（Mirror在下面展示）。

```scala
case class Purchase(name: String, orderNumber: Int, var shipped: Boolean)
//defined class Purchase

val p = Purchase("Jeff Lebowski", 23819, false)
//p: Purchase = Purchase(Jeff Lebowski,23819,false)
```

在这个例子中，我们将试图通过反映来获取和设置采购订单p的发货字段。

```scala
import scala.reflect.runtime.{universe => ru}
//import scala.reflect.runtime.{universe=>ru}

val m = ru.runtimeMirror(p.getClass.getClassLoader)
//m: scala.reflect.runtime.universe.Mirror = JavaMirror with ...
```

正如我们在前面的例子中所做的那样，我们将从获得一个Mirror `m`开始，这样所有类和类型都可以由类加载器加载p（Purchase）类，我们需要这些类和类型来访问会员发货。

```scala
val shippingTermSymb = ru.typeOf[Purchase].declaration(ru.TermName("shipped")).asTerm
//shippingTermSymb: scala.reflect.runtime.universe.TermSymbol = method shipped
```

我们现在查看发货字段的声明，这给我们提供了一个TermSymbol（一种Symbol）。我们稍后需要使用此符号来获取镜像，使我们能够访问该字段的值（对于某些实例）。

```scala
val im = m.reflect(p)
//im: scala.reflect.runtime.universe.InstanceMirror = instance mirror for Purchase(Jeff Lebowski,23819,false)

val shippingFieldMirror = im.reflectField(shippingTermSymb)
//shippingFieldMirror: scala.reflect.runtime.universe.FieldMirror = field mirror for Purchase.shipped (bound to Purchase(Jeff Lebowski,23819,false))
```

为了访问特定实例的已发送成员，我们需要一个镜像，用于我们的特定实例，p的实例镜像，im。给定我们的实例镜像，我们可以为任何表示p类型的字段的TermSymbol获取FieldMirror。

现在我们有一个FieldMirror为我们的特定字段，我们可以使用方法get和set来获取/设置我们的特定实例的已发货的成员。我们将发货的状态更改为true。

```scala
shippingFieldMirror.get
//res7: Any = false

shippingFieldMirror.set(true)
shippingFieldMirror.get
//res9: Any = true
```

#### （5）反射官方文档——Environment, Universes, and Mirrors

**Environment**

反射环境不同在于反射任务是在运行时还是在编译时完成。在运行时或编译时使用的环境之间的区别被封装在所谓的Universe中。反射环境的另一个重要方面是我们具有反思性访问权的一组实体。这组实体由所谓的mirror决定。

例如，可通过运行时反射访问的实体由ClassloaderMirror提供。此镜像仅提供对特定类加载器加载的实体（包，类型和成员）的访问。

Mirror不仅可以确定可以反射访问的实体集。他们还提供对这些实体进行反射操作。例如，在运行时反射中，可以使用调用者镜像来调用类的方法或构造函数。

**Universes**

有两种主要类型的Universe - 由于存在运行时和编译时反射能力，必须使用与任何任务相对应的Universe。或者：

* scala.reflect.runtime.universe 运行时反射
* scala.reflect.macros.Universe 编译时反射

universe 为反射中使用的所有主要概念提供了一个界面，例如“Types”，“Trees”和“Annotations”。

**Mirrors**

反射镜提供的所有信息都可通过Mirrors访问，根据要获得的信息类型或要采取的反射动作，必须使用不同类型的Mirrors。类加载器mirrors可以用于获取类型和成员的表示。从类加载器Mirrors，可以获得更特殊的Mirrors，它实现反射调用，如方法或构造函数调用和字段访问。

概要：

* “Classloader” mirrors ：这些mirrors将名称转换为symbols （通过staticClass/staticModule/staticPackage方法）
* “Invoker” mirrors：这些mirrors实现了反射调用（通过MethodMirror.apply, FieldMirror.get等方法）。这些“Invoker” mirrors是最常用的mirrors类型。

**运行时Mirrors**

运行时使用Mirror的入口点通过 `scala.reflect.runtime.universe.runtimeMirror(<classloader>)`获得

`scala.reflect.api.JavaMirrors#runtimeMirror`调用传递一个symbols将返回一个classloader mirror对象（`scala.reflect.api.Mirrors#ReflectiveMirror`)

一个classloader mirror可以创建invoker mirrors 包括：

* scala.reflect.api.Mirrors#InstanceMirror
* scala.reflect.api.Mirrors#MethodMirror
* scala.reflect.api.Mirrors#FieldMirror
* scala.reflect.api.Mirrors#ClassMirror
* scala.reflect.api.Mirrors#ModuleMirror

这两种镜像相互作用的例子如下。

**Mirrors的类型，使用样例和例子**
`import scala.reflect.runtime.{universe => ru}`例子前置条件

`ReflectiveMirror`用于通过名称加载symbols ，并将其作为入口点加载到调用者mirrors中。入口点：`val m = ru.runtimeMirror(<classloader>)`

```scala
val ru = scala.reflect.runtime.universe
//ru: scala.reflect.api.JavaUniverse = ...

val m = ru.runtimeMirror(getClass.getClassLoader)
//m: scala.reflect.runtime.universe.Mirror = JavaMirror ..
```

`InstanceMirror`用于为方法和字段以及内部类和内部对象（模块）创建调用者mirrors。入口点：`val im = m.reflect(<value>)`。

```scala
class C { def x = 2 }
//defined class C

val im = m.reflect(new C)
//im: scala.reflect.runtime.universe.InstanceMirror = instance mirror for C@3442299e
```

`MethodMirror`用于调用实例方法（Scala只有实例方法 - 对象的方法是通过ModuleMirror.instance获取的对象实例的实例方法）。入口点：`val mm = im.reflectMethod(<method symbol>)`

```scala
val methodX = ru.typeOf[C].declaration(ru.TermName("x")).asMethod
//methodX: scala.reflect.runtime.universe.MethodSymbol = method x

val mm = im.reflectMethod(methodX)
//mm: scala.reflect.runtime.universe.MethodMirror = method mirror for C.x: scala.Int (bound to C@3442299e)

mm()
//res0: Any = 2
```

`FieldMirror`用于获取/设置实例字段（如方法，Scala只有实例字段，见上文）。入口点：`val fm = im.reflectField(<field或accessor symbol>)`。例：

```scala
class C { val x = 2; var y = 3 }
//defined class C

val m = ru.runtimeMirror(getClass.getClassLoader)
//m: scala.reflect.runtime.universe.Mirror = JavaMirror ...

val im = m.reflect(new C)
//im: scala.reflect.runtime.universe.InstanceMirror = instance mirror for C@5f0c8ac1

val fieldX = ru.typeOf[C].declaration(ru.TermName("x")).asTerm.accessed.asTerm
//fieldX: scala.reflect.runtime.universe.TermSymbol = value x

val fmX = im.reflectField(fieldX)
//fmX: scala.reflect.runtime.universe.FieldMirror = field mirror for C.x (bound to C@5f0c8ac1)

fmX.get
//res0: Any = 2

fmX.set(3)

val fieldY = ru.typeOf[C].declaration(ru.TermName("y")).asTerm.accessed.asTerm
//fieldY: scala.reflect.runtime.universe.TermSymbol = variable y

val fmY = im.reflectField(fieldY)
//fmY: scala.reflect.runtime.universe.FieldMirror = field mirror for C.y (bound to C@5f0c8ac1)

fmY.get
//res1: Any = 3

fmY.set(4)

fmY.get
//res2: Any = 4
```

`ClassMirror`用于为构造函数创建调用者镜像。入口点：静态类 `val cm1 = m.reflectClass(<class symbol>)`

```scala
case class C(x: Int)
//defined class C

val m = ru.runtimeMirror(getClass.getClassLoader)
//m: scala.reflect.runtime.universe.Mirror = JavaMirror ...

val classC = ru.typeOf[C].typeSymbol.asClass
//classC: scala.reflect.runtime.universe.Symbol = class C

val cm = m.reflectClass(classC)
//cm: scala.reflect.runtime.universe.ClassMirror = class mirror for C (bound to null)

val ctorC = ru.typeOf[C].declaration(ru.nme.CONSTRUCTOR).asMethod
//ctorC: scala.reflect.runtime.universe.MethodSymbol = constructor C

val ctorm = cm.reflectConstructor(ctorC)
//ctorm: scala.reflect.runtime.universe.MethodMirror = constructor mirror for C.<init>(x: scala.Int): C (bound to null)

ctorm(2)
//res0: Any = C(2)
```

`ModuleMirror`用于访问单例对象的实例。入口点：`val mm1 = m.reflectModule(<module symbol>)`

```scala
object C { def x = 2 }
//defined module C

val m = ru.runtimeMirror(getClass.getClassLoader)
//m: scala.reflect.runtime.universe.Mirror = JavaMirror ...

val objectC = ru.typeOf[C.type].termSymbol.asModule
//objectC: scala.reflect.runtime.universe.ModuleSymbol = object C

val mm = m.reflectModule(objectC)
//mm: scala.reflect.runtime.universe.ModuleMirror = module mirror for C (bound to null)

val obj = mm.instance
//obj: Any = C$@1005ec04
```

**Mirrors总结**

|类型|入口点|作用|
|:---|:--|:--|
|`ReflectiveMirror`|`val m = ru.runtimeMirror(<classloader>)`|用于获取`ModuleMirror`、`ClassMirror`和`InstanceMirror`|
|`InstanceMirror`|`val im = m.reflect(<value>)`|用于获取`MethodMirror`、`FieldMirror`|
|`MethodMirror`|`val mm = im.reflectMethod(<method symbol>)`|用于调用实例方法|
|`FieldMirror`|`val fm = im.reflectField(<field或accessor symbol>)`|获取和设置实例的成员变量|
|`ClassMirror`|`val cm1 = m.reflectClass(<class symbol>)`|用于获取构造函数`MethodMirror`|
|`ModuleMirror`|`val mm1 = m.reflectModule(<module symbol>)`|用于访问单例对象|

**编译时Mirrors**

http://docs.scala-lang.org/overviews/reflection/environment-universes-mirrors#compile-time-mirrors

#### （6）反射官方文档——Symbols, Trees, and Types

**Symbols**

使用符号来建立名称与引用的实体之间的绑定，例如类或方法。你定义的任何东西都可以在Scala中给出一个名称，它们有一个关联的符号。

Symbols 包含有关实体声明的所有可用信息（class/object/trait etc）或者一个成员（vals/vars/defs 等）因此，它们是运行时反映和编译时反射中心的整体抽象。

符号可以提供丰富的信息，从所有符号上可用的基本名称方法到其他更多涉及的概念，例如从ClassSymbol获取baseClasses。符号的其他常见用例包括检查成员的签名，获取类的类型参数，获取方法的参数类型或查找字段的类型

**Symbols所有者层次结构**

Symbols以层次结构组织。例如，表示方法参数的符号由相应的方法符号拥有，方法符号由其包围的类，特征或对象拥有，类由包含的包所有，依此类推。

例如，如果一个符号没有所有者，因为它是指一个顶级的实体，比如顶级的包，那么它的所有者就是特殊的NoSymbol单例对象。代表缺失的符号，API中通常使用NoSymbol来表示空值或默认值。访问NoSymbol的所有者会引发异常。请参阅API文档中的类型为Symbol的通用接口

**TypeSymbol**

TypeSymbol表示类型，类和特质声明，以及类型参数。不适用于更具体的ClassSymbols的有趣的成员包括isAbstractType，isContravariant和isCovariant。

* ClassSymbol:提供对类或特征声明中包含的所有信息的访问，例如name，修饰符（isFinal，isPrivate，isProtected，isAbstractClass等），baseClasses和typeParams

**TermSymbol**

表示val，var，def和对象声明以及包和值参数的术语Symbols的类型。

* MethodSymbol：表示def声明的方法符号的类型（TermSymbol的子类）。它支持查询，例如检查方法是（主）构造函数，还是方法是否支持可变长度的参数列表。
* ModuleSymbol：表示对象声明的模块符号的类型。它允许通过成员moduleClass查找与对象定义相关联的类。相反的查询也是可能的。通过检查其selfType.termSymbol，可以从模块类返回到相关的模块符号。

**Symbol 转换**

可能会有一种情况，其中一种使用返回一般Symbol类型实例的方法。在这样的情况下，可以将获得的更一般的符号类型转换为所需的特定的，更专用的符号类型。

符号转换（如asClass或asMethod）被用于适当地转换为更具体的Symbol类型（例如，如果要使用MethodSymbol接口）。

```scala
import scala.reflect.runtime.universe._
//import scala.reflect.runtime.universe._

class C[T] { def test[U](x: T)(y: U): Int = ??? }
//defined class C

val testMember = typeOf[C[Int]].member(TermName("test"))
//testMember: scala.reflect.runtime.universe.Symbol = method test
```

在这种情况下，成员可以返回一个Symbol的实例，而不是MethodSymbol。因此，我们必须使用asMethod来确保我们获得一个MethodSymbol

```scala
testMember.asMethod
//res0: scala.reflect.runtime.universe.MethodSymbol = method test
```

**Free symbols**

The two symbol types FreeTermSymbol and FreeTypeSymbol have a special status, in the sense that they refer to symbols whose available information is not complete. These symbols are generated in some cases during reification (see the corresponding section about reifying trees for more background). Whenever reification cannot locate a symbol (meaning that the symbol is not available in the corresponding class file, for example, because the symbol refers to a local class), it reifies it as a so-called “free type”, a synthetic dummy symbol that remembers the original name and owner and has a surrogate type signature that closely follows the original. You can check whether a symbol is a free type by calling sym.isFreeType. You can also get a list of all free types referenced by a tree and its children by calling tree.freeTypes. Finally, you can get warnings when reification produces free types by using -Xlog-free-types.

**Types**

顾名思义，类型的实例表示有关对应符号类型的信息。这包括其直接或继承的成员（方法，字段，类型别名，抽象类型，嵌套类，特征等），其基类型，其擦除等。类型还提供了测试类型一致性或等同性的操作。

创建Types：

* 通过scala.reflect.api.TypeTags.typeOf
* 标准类型，如Int，Boolean，Any或Unit可通过可用的Universe进行访问。
* 使用工厂方法（例如scala.reflect.api.Types上的typeRef或polyType）进行手动实例化（不推荐）。

typeOf

```scala
import scala.reflect.runtime.universe._
//import scala.reflect.runtime.universe._

typeOf[List[Int]]
//res0: scala.reflect.runtime.universe.Type = scala.List[Int]


def getType[T: TypeTag](obj: T) = typeOf[T]
//getType: [T](obj: T)(implicit evidence$1: scala.reflect.runtime.universe.TypeTag[T])scala.reflect.runtime.universe.Type

getType(List(1,2,3))
//res1: scala.reflect.runtime.universe.Type = List[Int]

class Animal; class Cat extends Animal
//defined class Animal
defined class Cat

val a = new Animal
//a: Animal = Animal@21c17f5a

getType(a)
//res2: scala.reflect.runtime.universe.Type = Animal

val c = new Cat
//c: Cat = Cat@2302d72d

getType(c)
//res3: scala.reflect.runtime.universe.Type = Cat
```

标准 Types

```scala
import scala.reflect.runtime.universe
//import scala.reflect.runtime.universe

val intTpe = universe.definitions.IntTpe
//intTpe: scala.reflect.runtime.universe.Type = Int
```

**Types的 常见操作**

类型通常用于类型一致性测试或查询成员。对类型执行的三个主要操作类型有：

* 检查两种类型之间的子类型关系。
* 检查两种类型之间的相等性。
* 查询某些成员或内部类型的给定类型。

子类型关系

```scala
import scala.reflect.runtime.universe._
//import scala.reflect.runtime.universe._

class A; class B extends A
//defined class A
//defined class B

typeOf[A] <:< typeOf[B]
//res0: Boolean = false

typeOf[B] <:< typeOf[A]
//res1: Boolean = true
```

类型判等

```scala

import scala.reflect.runtime.universe._
//import scala.reflect.runtime.universe._

def getType[T: TypeTag](obj: T) = typeOf[T]
//getType: [T](obj: T)(implicit evidence$1: scala.reflect.runtime.universe.TypeTag[T])scala.reflect.runtime.universe.Type

class A
//defined class A

val a1 = new A; val a2 = new A
//a1: A = A@cddb2e7
//a2: A = A@2f0c624a

getType(a1) =:= getType(a2)
res0: Boolean = true
```

查询成员和声明的类型

方法签名如下

```scala
/** The member with given name, either directly declared or inherited, an
  * OverloadedSymbol if several exist, NoSymbol if none exist. */
def member(name: Universe.Name): Universe.Symbol
/** The defined or declared members with name name in this type; an
  * OverloadedSymbol if several exist, NoSymbol if none exist. */
def declaration(name: Universe.Name): Universe.Symbol
/** A Scope containing all members of this type
  * (directly declared or inherited). */
def members: Universe.MemberScope // MemberScope is a type of
                                  // Traversable, use higher-order
                                  // functions such as map,
                                  // filter, foreach to query!
/** A Scope containing the members declared directly on this type. */
def declarations: Universe.MemberScope // MemberScope is a type of
                                       // Traversable, use higher-order
                                       // functions such as map,
                                       // filter, foreach to query!
```

例子

```scala
import scala.reflect.runtime.universe._
//import scala.reflect.runtime.universe._

typeOf[List[_]].member("map": TermName)
//res0: scala.reflect.runtime.universe.Symbol = method map

typeOf[List[_]].member("Self": TypeName)
//res1: scala.reflect.runtime.universe.Symbol = type Self

typeOf[List[Int]].members.filter(_.isPrivate).foreach(println _)
//method super$sameElements
//method occCounts
//class CombinationsItr
//class PermutationsItr
//method sequential
//method iterateUntilEmpty
```

### 7、隐式类

#### （1）介绍

Scala 2.10引入了一种叫做隐式类的新特性。隐式类指的是用implicit关键字修饰的类。在对应的作用域内，带有这个关键字的类的主构造函数可用于隐式转换。

#### （2）用法

```scala
package cn.rectcircle.scalaoverview

object Helpers {
	implicit class IntWithTimes(x: Int) {
		def times[A](f: => A): Unit = {
			def loop(current: Int): Unit =
				if(current > 0) {
					f
					loop(current - 1)
				}
			loop(x)
		}
	}
}

object ImplicitClass extends App {
	import Helpers._
	5 times println("HI")
}
/*输出
HI
HI
HI
HI
HI
*/
```

##### （3）限制条件

* 只能在别的trait/类/对象内部定义。

```scala
object Helpers {
	 implicit class RichInt(x: Int) // 正确！
}
implicit class RichDouble(x: Double) // 错误！
```

* 构造函数只能携带一个非隐式参数。

```scala
implicit class RichDate(date: java.util.Date) // 正确！
implicit class Indexer[T](collecton: Seq[T], index: Int) // 错误！
implicit class Indexer[T](collecton: Seq[T])(implicit index: Index) // 正确！
```

* 在同一作用域内，不能有任何方法、成员或对象与隐式类同名

```scala
object Bar
implicit class Bar(x: Int) // 错误！
val x = 5
implicit class x(y: Int) // 错误！
implicit case class Baz(x: Int) // 错误！
```

### 8、future和promise

#### （1）Future

所谓Future，是一种用于指代某个尚未就绪的值的对象。而这个值，往往是某个计算过程的结果：

* 若该计算过程尚未完成，我们就说该Future未就位；
* 若该计算过程正常结束，或中途抛出异常，我们就说该Future已就位。

Future的就位分为两种情况：

* 当Future带着某个值就位时，我们就说该Future携带计算结果成功就位。
* 当Future因对应计算过程抛出异常而就绪，我们就说这个Future因该异常而失败。

Future的一个重要属性在于它只能被赋值一次。一旦给定了某个值或某个异常，future对象就变成了不可变对象——无法再被改写。

例子总和

```scala
package cn.rectcircle.scalaoverview
import scala.concurrent._
import scala.util.{Failure, Success}
//导入默认的全局执行上下文(global execution context)
import ExecutionContext.Implicits.global

object FutureTest extends App {
	val f:Future[Int] = Future {
		Thread.sleep(100)
		println("当前线程名",Thread.currentThread().getName)
		println("Future即将完成",Thread.currentThread().getName)
		1
	}
	println("当前线程名",Thread.currentThread().getName)

	f onComplete{ //完成执行的回调，不在main进程
		case Success(ret) =>
			println("当前线程名",Thread.currentThread().getName)
			println(ret)
		case Failure(e) => println(e)
	}

	f onComplete{ //完成执行的回调
		case Success(ret) => println("第二个回调"+ret)
		case Failure(e) => println("第二个回调"+e)
	}
	Thread.sleep(200)


	//具有先后顺序的组合
	val f1 = Future {
		println("前置准备")
	}
	val f2 = f1 map { _ =>
		println("第二段逻辑")
	}
	Thread.sleep(10)

	//组合结果
	val f3 = Future {
		println("f3")
		1
	}
	val f4 = Future {
		println("f4")
		2
	}
	val f5 = for{
		a <- f3
		b <- f4
	} yield a+b
	f5 onComplete{
		case Success(ret) => println(ret)
	}
	Thread.sleep(10)

	//类似的
	Future{
		1
	} flatMap { a =>
		Future{
			2
		}.map(b => a+b)
	} onComplete{case Success(c) => println(c)}
	Thread.sleep(10)

	//异常恢复
	Future{
		throw new NullPointerException()
		1
	} recover {
		case _:NullPointerException => 0
	} onComplete{case Success(ret) => println(ret)}
	Thread.sleep(10)


	Future {
		1
	} andThen {
		case Success(ret) => println(ret); ret+1 //这个返回值无效
	} andThen {
		case Success(ret) => println(ret)
	}
	Thread.sleep(10)

	//投影
	val f6 = Future {
		2 / 0
	}
	for (exc <- f6.failed) println(exc)
	Thread.sleep(10)


	//Promise使用，相当消息传递着，是一个承诺
	val p = Promise[Int]()
	val f7 = p.future
	//生产者
	val producer = Future {
		p success 1
	}
	//消费者
	val consumer = Future {
		f7 onComplete  {
			r => println(r.get)
		}
	}

  	//时序工具
	import scala.concurrent.duration._
	val t1 = 1.second

	Thread.sleep(2000)
}
/*输出
(当前线程名,main)
(当前线程名,scala-execution-context-global-11)
(Future即将完成,scala-execution-context-global-11)
第二个回调1
(当前线程名,scala-execution-context-global-11)
1
前置准备
第二段逻辑
f3
f4
3
0
1
1
3
java.lang.ArithmeticException: / by zero
1
*/
```
