---
title: scala读书笔记（一）
date: 2016-11-22T16:38:07+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/28
  - /detail/28/
tags:
  - scala
---

>  代码优于描述

## 目录
* [一、类型和内置类型详解](#一、类型和内置类型详解)
* [二、流程控制结构](#二、流程控制结构)
* [三、类和对象](#三、类和对象)
* [四、包和引入](#四、包和引入)
* [五、特质](#五、特质)
* [六、函数式编程](#六、函数式编程)




## 一、类型和内置类型详解
***********************************************
### 1、String
#### （1）特点
* 本质上为java的String即`java.lang.String`
* 可以使用java String类的一切方法
* 可以使用scala扩展的函数

#### （2）scala特有拓展
```scala
/*==相当于equals*/
	val s1 ="123"                             //> s1  : String = 123
	val s2 ="123"                             //> s2  : String = 123
	s1==s2                                    //> res0: Boolean = true

/*创建多行字符串*/
	val multiLineStr = """this is
	a multiline
	String
	"""                                       //> multiLineStr  : String = "this is
                                                  //| 	a multiline
                                                  //| 	String
                                                  //| 	"
	//对齐美化
	val str = """123
							|456"""
                                                  //> str  : String = 123
                                                  //| 							|456
							
							
/*字符串分割，并去除前后空格*/
	"192.168. 1. 1".split("\\.").map(_.trim); //> res0: Array[String] = Array(192, 168, 1, 1)

/*字符串插值*/
	//s"字符串"
	val s1:String="s1"                        //> s1  : String = s1
	val s2:String = s"this is $s1"            //> s2  : String = this is s1

	val n = 1;                                //> n  : Int = 1
	val s3:String = s"this is 1: ${n==1}"     //> s3  : String = this is 1: true

	//f"字符串"， 格式化字符串
	val weight = 100.0;                       //> weight  : Double = 100.0
	println(f"weight:$weight%.2f");           //> weight:100.00

	//row"str" 将字符串中换行输出为\n
	raw"first\nsecond"                        //> res0: String = first\nsecond
	"first\nsecond"                           //> res1: String("first\nsecond") = first
                                                  //| second
	
/*处理字符串每个字符*/
	"hello,world".filter(_!='l').map(_.toUpper)
                                                  //> res0: String = HEO,WORD
	for(c<-"hello") println(c)                //> h
                                                  //| e
                                                  //| l
                                                  //| l
                                                  //| o
	for(c<-"hello") yield c.toUpper           //> res1: String = HELLO
	
/*字符串查找模式*/
	val numPattern = "[0-9]+".r  //numPattern: scala.util.matching.Regex = [0-9]+
	val opt = numPattern.findFirstIn("123 afdasf"); //opt: Option[String] = Some(123)
	opt.getOrElse("no match"); //res0: String = 123

	val its = numPattern.findAllIn("123 1231"); //val its = numPattern.findAllIn("123 1231");
its: scala.util.matching.Regex.MatchIterator = non-empty iterator
	its.foreach(println) //123
                        //1231

/*字符串替换模式*/
	val numPattern = "[0-9]+".r               //> numPattern  : scala.util.matching.Regex = [0-9]+
	val opt = numPattern.replaceAllIn("123 afd2324asf","x");
                                                  //> opt  : String = x afdxasf
	val opt1 = numPattern.replaceFirstIn("123 afd234asf","x");
                                                  //> opt1  : String = x afd234asf
	

/*抽取字符串模式匹配结果*/
	val pattern = "([0-9]+) ([A-Za-z]+)".r    //> pattern  : scala.util.matching.Regex = ([0-9]+) ([A-Za-z]+)
	val pattern(num, str) = "100 nihao"       //> num  : String = 100
                                                  //| str  : String = nihao
      
   "99 bottles" match {
     case pattern(num,item) => println("num => "+num +" item => " + item)
     case _ =>
   }                                              //> num => 99 item => bottles
	 
	 
/*访问一个字符相当于charAt*/
	"hello"(3)                                        //> res0: Char = l

/*向现有Stirng类添加自定义方法*/
	//定义一个隐式转换的类
	package com.rectcircle.util
	object StringUtil{
		implicit class StringImprovements(val s: String){
			def increment = s.map(c => (c+1).toChar)
			def plusOne = s.toInt + 1
		}
	}
	
	package com.rectcircle.test
	
	import com.rectcircle.util.StringUtil._
	
	object Main extends App{
		println("abc".increment)
	}
	
	//或者定义在包对象里
	package com.rectcircle
	package object util {
		implicit class StringImprovements(val s: String){
			def increment = s.map(c => (c+1).toChar)
		}
	}
	
	//使用时	import com.rectcircle.util._
	
```
### 2、数字类型
```scala
/*从字符串转数值*/
	"100".toInt                               //> res0: Int = 100
	"100".toDouble
	"100".toFloat
	"100".toLong
	"100".toShort
	"100".toByte
	"aaa".toInt //异常java.lang.NumberFormatException
	
	//处理进制，可以写成隐式转换包装
	Integer.parseInt("11", 2)                         //> res0: Int = 3
	//关于异常，scala没有受检异常，使用option/some/none
	
/*数值类型转化*/
	数值类型.toXxx //不会报错，会截断
	数值类型.isValidXxx
	
/*重载默认数值类型*/
	val a:Int = 1

/*不支持++ 和-- 操作符*/
	var a = 1
	a+=1

/*浮点数比较*/
	//定义一个隐式转换
	def ~=(x: Double, y:Double, precision:Double) = {
		if((x-y).abs < precision) true
		else false
	}                                         //> ~= : (x: Double, y: Double, precision: Double)Boolean
	
	println(~=(0.1d,0.1d,0.01d))              //> true

/*大数*/
	val a = BigInt("999999")                  //> a  : scala.math.BigInt = 999999
	val b = BigInt("1")                       //> b  : scala.math.BigInt = 1
	val c = BigDecimal("1.111111")            //> a  : scala.math.BigDecimal = 1.111111
	a+b                                       //> res0: scala.math.BigInt = 1000000
	和普通数值类型一样
	
/*生成随机数*/
	val r = scala.util.Random                 //> r  : util.Random.type = scala.util.Random$@1b4fb997
	r.nextDouble()                            //> res0: Double = 0.9011483551708958
	r.nextDouble()                            //> res1: Double = 0.5142255521939217
	
	for(i<- 1 to 10) yield r.nextPrintableChar()
                                                  //> res3: scala.collection.immutable.IndexedSeq[Char] = Vector(I, _, E, ', {, a,
                                                  //|  T, z, v, $)
																									
/*创建一个数值区间、列表、或者数组*/
	//数值区间
	val r1 = 1 to 10                          //> r1  : scala.collection.immutable.Range.Inclusive = Range(1, 2, 3, 4, 5, 6, 7,
                                                  //|  8, 9, 10)
	val r2 = 1 to 10 by 2                     //> r2  : scala.collection.immutable.Range = Range(1, 3, 5, 7, 9)
	val r3 = 1 until 5                        //> r3  : scala.collection.immutable.Range = Range(1, 2, 3, 4)
	
	
	//数组
	val a = 1 to 5 toArray                    //> a  : Array[Int] = Array(1, 2, 3, 4, 5)
	//列表
	val a = 1 to 5 toList                     //> a  : List[Int] = List(1, 2, 3, 4, 5)
	
/*格式化*/

```

## 二、流程控制结构
***********************************************
### 1、for与foreach
#### (1)遍历集合
```scala
	val a = Array("a","b","c")                //> a  : Array[String] = Array(a, b, c)
	for(e <- a) println(e)                    //> a
                                                  //| b
                                                  //| c
	for(e<- a){
		//TODO,muiltline
		val s =e.toUpperCase
		println(s)
	}                                         //> A
                                                  //| B
                                                  //| C
																									
	  val m = Map("job" -> "123",
    "tim" -> "321")                               //> m  : scala.collection.immutable.Map[String,String] = Map(job -> 123, tim -> 3
                                                  //| 21)

  for ((k, v) <- m) println(s"key:$k value:$v")   //> key:job value:123
                                                  //| key:tim value:321

```

#### (2)从集合中返回值，for表达式
```scala
	val a = Array("a","b","c")                //> a  : Array[String] = Array(a, b, c)
	for(e <- a) yield e.toUpperCase()         //> res0: Array[String] = Array(A, B, C)
	
	

```

#### (3)循环计数器
```scala
	val a = Array("a","b","c")                //> a  : Array[String] = Array(a, b, c)
	for(i <- 0 until a.length) {
		println(s"this is ${a(i)}")       //> this is a
                                                  //| this is b
                                                  //| this is c
	}
	//多个计数器
	for(i<- 1 to 2 ; j<-1 to 2 ){
		println(s"[$i,$j]")               //> [1,1]
                                                  //| [1,2]
                                                  //| [2,1]
                                                  //| [2,2]
	}
```

#### (4)生成器和卫语句
```scala
	for(i <- 1 to 3 if i!= 2) println(i)      //> 1
                                                  //| 3
																									
	for(i <- 1 to 3 if(i!=2&&i!=3)) println(i)//> 1
```

#### (5)实现break和continue
```scala
import scala.util.control.Breaks._

//实现break
breakable {
	for(i<- 0 to 10){
		if(i==3) break
		println(i)
	}
}                                         //> 0
																								//| 1
																								//| 2
//实现continue
for(i<- 1 to 3){
	breakable {
		if(i==2) break
		println(i)
	}                                 //> 1
																								//| 3
}

//有标签的break
```

### 2、没有就三元运算符，用if else代替
```scala
val i = 0                                 //> i  : Int = 0
if(i==0)"a" else "b"                      //> res0: String = a
```
### 3、匹配表达式
#### (1)基础用法像switch语句使用
```scala
val i = 1                                 //> i  : Int = 1
i match{
	case 1 => "January"
	case 2 => "February"
	case _ => "Invalid"
}                                         //> res0: String = January

//类型匹配
val i:Any = 1                             //> i  : Any = 1
i match{
	case s:String => "String"
	case i:Int => "Int"
	case _ => "Invalid"
}                                         //> res0: String = Int
```

#### (2)一条case匹配多个条件
```bash
val i = 1                                 //> i  : Int = 1
	i match{
		case 0|2|4 => "even"
		case 1|3|5 => "odd"
		case _ => "Invalid"
	}                                         //> res0: String = odd
```

#### (3)访问匹配表达式的缺省case值
```scala
val i = 3                                 //> i  : Int = 3
i match{
	case 0 => "even"
	case 1 => "odd"
	case default => default
}                                         //> res0: Any = 3
```
#### (4)使用模式匹配
支持
* 普通值匹配
* 序列匹配
* 元组匹配
* 构造器匹配
* 类型匹配
* 默认匹配


```scala
def echoWhatYouGaveMe(x: Any): String = x match {

    // constant patterns
    case 0 => "zero"
    case true => "true"
    case "hello" => "you said 'hello'"
    case Nil => "an empty List"

    // sequence patterns
    case List(0, _, _) => "a three-element list with 0 as the first element"
    case List(1, _*) => "a list beginning with 1, having any number of elements"
    case Vector(1, _*) => "a vector starting with 1, having any number of elements"

    // tuples
    case (a, b) => s"got $a and $b"
    case (a, b, c) => s"got $a, $b, and $c"

    // constructor patterns
    case Person(first, "Alexander") => s"found an Alexander, first name = $first"
    case Dog("Suka") => "found a dog named Suka"

    // typed patterns
    case s: String => s"you gave me this string: $s"
    case i: Int => s"thanks for the int: $i"
    case f: Float => s"thanks for the float: $f"
    case a: Array[Int] => s"an array of int: ${a.mkString(",")}"
    case as: Array[String] => s"an array of strings: ${as.mkString(",")}"
    case d: Dog => s"dog: ${d.name}"
    case list: List[_] => s"thanks for the List: $list"
    case m: Map[_, _] => m.toString

    // the default wildcard pattern
    case _ => "Unknown"
}
```

#### (4)匹配case类
```scala
	trait Animal
	case class Dog(name: String) extends Animal
	case class Cat(name: String) extends Animal
	
	case object Woodpecker extends Animal
	
	def determineType(x: Animal): String = x match {
        case Dog(moniker) => "Got a Dog, name = " + moniker
        case _:Cat => "Got a Cat (ignoring the name)"
        case Woodpecker => "That was a Woodpecker"
        case _ => "That was something else"
    }                                             //> determineType: (x: worksheet.Animal)String
    println(determineType(new Dog("Rocky")))      //> Got a Dog, name = Rocky
    println(determineType(new Cat("Rusty the Cat")))
                                                  //> Got a Cat (ignoring the name)
    println(determineType(Woodpecker))            //> That was a Woodpecker
```

#### (5)给case语句添加if表达式
```scala
val i = 2                                 //> i  : Int = 2
i match {
	case x if 0 to 9 contains x => x
}                                         //> res0: Int = 2
```

#### (6)使用此替代isInstanceOf方法
```scala
见（4）
```

#### (7)使用List
```scala
	//将list拼接成字符串
	val y = 1::2::3::Nil                      //> y  : List[Int] = List(1, 2, 3)
	
	def listToString(list: List[_]):String = list match {
		case s::rest =>s+" "+listToString(rest)
		case Nil => ""
	}                                         //> listToString: (list: List[_])String
	listToString(y)                           //> res0: String = "1 2 3 "

```


### 4、使用try/catch匹配异常
#### （1）匹配异常
```scala
	val s="abc"                               //> s  : String = abc
	try{
		s.toInt
	} catch {
		case e : Exception => "catch a exception"
	}                                         //> res0: Any = catch a exception
```

#### （2）在try外部定义变量

### 5、while操作符
```scala
var i = 0;                                //> i  : Int = 0
while(i<5){
	println(i)
	i+=1;
}                                         //> 0
																								//| 1
																								//| 2
																								//| 3

```


### 5、创建自定义控制结构
调用
```scala
import com.rectcircle.util.dsl._

object Greeting extends App {
  var i = 0 
  whilst(i<5){
    println(i)
    i += 1
  }
  
}
```

实现
```scala
package com.rectcircle.util
import scala.annotation.tailrec
case object dsl {
  //  def whilst(testCondition: => Boolean)(codeBlock: => Unit) {
  //    while (testCondition) {
  //      codeBlock
  //    }
  //  }

  @tailrec
  def whilst(testCondition: => Boolean)(codeBlock: => Unit) {
    if (testCondition) {
      codeBlock
      whilst(testCondition)(codeBlock)
    }
  }

}

```

## 三、类和对象
***********************************************
### 1、类和属性
#### （1）创建一个主构造函数
类似于js构造函数
```scala
 class Person(var firstName: String, var lastName: String) {
    println("the constructor begins")
    // 相当于java private  final
    private val HOME = System.getProperty("user.home")
    var age = 0
    // some methods
    override def toString = s"$firstName $lastName is $age years old"
    def printHome { println(s"HOME = $HOME") }
    def printFullName { println(this) } // uses toString
    printHome
    printFullName
    println("still in the constructor")
  }

	val p = new Person("adam","meyer")        //> the constructor begins
                                                  //| HOME = C:\Users\sunben960729
                                                  //| adam meyer is 0 years old
                                                  //| still in the constructor
                                                  //| p  : worksheet.Person = adam meyer is 0 years old

	p.firstName = "bb" //firstname是val可重新负值
 
```

java版Person
```java
public class Person {
	private String firstName;
	private String lastName;
	private final String HOME = System.getProperty("user.home");
	private int age;

	public Person(String firstName, String lastName) {
		super();
		this.firstName = firstName;
		this.lastName = lastName;
		System.out.println("the constructor begins");
		age = 0;
		printHome();
		printFullName();
		System.out.println("still in the constructor");
	}

	public String firstName() {
		return firstName;
	}

	public String lastName() {
		return lastName;
	}

	public int age() {
		return age;
	}

	public void firstName_$eq(String firstName) {
		this.firstName = firstName;
	}

	public void lastName_$eq(String lastName) {
		this.lastName = lastName;
	}

	public void age_$eq(int age) {
		this.age = age;
	}

	public String toString() {
		return firstName + " " + lastName + " is " + age + " years old";
	}

	public void printHome() {
		System.out.println(HOME);
	}

	public void printFullName() {
		System.out.println(this);
	}
}
```

说明
* _eq方法，var 定义变量的语法糖，自动添加set方法


#### （2）控制构造函数参数的可见性
* 被声明为var（包括字段：主构造函数定义的变量），会添加get/set方法、
* 是val，只生成get方法
* 没有val和var不会生成get/set
* val var被private修饰不会生成get/set
* 以上的get/set方法不会遵循javabean命名规范
* case类没有val和var，任然会编译成val


##### var声明字段
```scala
	class Person(var name:String)
	val p = new Person("nihao")               //> p  : worksheet.Person = worksheet$Person@5e8c92f4
	p.name                                    //> res0: String = nihao
	p.name="hehe"
	p.name                                    //> res1: String = hehe
```


##### 非var和非val字段
```scala
	class Person(name:String)
	val p = new Person("nihao")
	p.name //报错
	p.name="hehe" //报错
	p.name //报错
```
	
##### 添加private修饰
```scala
	class Person(private var name:String)
	val p = new Person("nihao")
	p.name //报错
	p.name="hehe" //报错
	p.name //报错
```

#### （3）辅助构造函数
* 参数列表必须不完全相同
* 必须调用一个已定义的构造函数


```scala
class Pizza(var crustSize: Int, var crustType: String) {
    // one-arg auxiliary constructor
    def this(crustSize: Int) {
      this(crustSize, Pizza.DEFAULT_CRUST_TYPE)
    }
		//……
}
```

##### 为case类生成构造函数
```scala
  case class Person(var name: String, var age: Int)
  // the companion object
  object Person {
    def apply() = new Person("<no name>", 0)
    def apply(name: String) = new Person(name, 0)
  }
  val a = Person() // corresponds to apply()      //> a  : worksheet.Person = Person(<no name>,0)
  val b = Person("Pam") // corresponds to apply(name: String)
                                                  //> b  : worksheet.Person = Person(Pam,0)
  val c = Person("William Shatner", 82)           //> c  : worksheet.Person = Person(William Shatner,82)
  println(a)                                      //> Person(<no name>,0)
  println(b)                                      //> Person(Pam,0)
  println(c)                                      //> Person(William Shatner,82)
  // verify the setter methods work
  a.name = "Leonard Nimoy"
  a.age = 82
  println(a)                                      //> Person(Leonard Nimoy,82)
```

#### （4）定义私有构造函数，单例
```scala
class Person private(name:String)
val p = new Person("fasd") //报错

//实现単例
class Person private(name:String)
object Person {
	val person = new Person("nihao")
	def getInstance = person
}

val p = Person.getInstance                      //> p  : worksheet.Person = worksheet$Person@5e8c92f4
  
```

> 伴生对象，在类的同一文件中与类有相同的名字，定义关键字为object。
> 伴生对象的任意方法将变成实例对象的静态方法
> apply方法


//使用伴生对象创建工具类
```scala
object FileUtils {
	def readFile(filename: String) = {
		// code here ...
	}
	def writeToFile(filename: String, contents: String) {
		// code here ...
	}
}
```

#### （5）构造函数参数的默认值
```scala
class Socket (val timeout: Int = 10000)
```

#### （6）覆盖默认getset方法
* name_=是scala语法糖


```scala
class Person(private var _name: String) {
	def name = _name // accessor
	def name_=(aName: String) { _name = aName } // mutator
}

val p = new Person("niahoa")              //> p  : worksheet.Person = worksheet$Person@5e8c92f4
p.name                                    //> res0: String = niahoa
p.name = "fasdf"
```

符合javabean的get、set
```scala
class Person(private var _name: String) {
	def name = _name // accessor
	def name_=(aName: String) { _name = aName } // mutator
	def getName = _name
	def setName(name:String) = _name = name
}

val p = new Person("niahoa")              //> p  : worksheet.Person = worksheet$Person@5e8c92f4
p.name                                    //> res0: String = niahoa
p.name = "fasdf"

p.getName                                 //> res1: String = fasdf
p.setName("ttwr")
p.getName                                 //> res2: String = ttwr
```

#### （7）阻止字段生成get/set
普通情况
```scala
class Person {
	var name:String =_
}

val p = new Person                        //> p  : worksheet.Person = worksheet$Person@5e8c92f4

p.name                                    //> res0: String = null
p.name = "123"
```
不生成get/set
```scala
class Person {
	private var name:String =_
}

val p = new Person

p.name //报错
p.name = "123" //报错
```

#### （8）将代码块或函数赋给字段

```scala
class Foo {
	// set 'text' equal to the result of the block of code
	//可以考虑lazy val
	val text = {
		var lines = ""
		try {
			lines = io.Source.fromFile("/etc/passwd").getLines.mkString
		} catch {
			case e: Exception => lines = "Error happened"
		}
		lines
	}
	println(text)
}

val f = new Foo                           //> Error happened
																								//| f  : worksheet.Foo = worksheet$Foo@5b464ce8
```

#### （9）设置为初始化var类型
不要使用null，使用Option
```scala
var i = 0 // Int
var d = 0.0 // Double
var b: Byte = 0
var c: Char = 0
var f: Float = 0
var l: Long = 0
var s: Short = 0
var age = 0
var firstName = ""
var lastName = ""
var address = None: Option[Address]
```

#### （10）在继承类时处理构造函数参数
* 在子类构造函数中，不要使用var或val定义要传给父类的参数


```scala
case class Address (city: String, state: String)

class Person(var name: String, var address: Address) {
	override def toString = if (address == null) name else s"$name @ $address"
}

class Employee(name: String, address: Address, var age: Int)
	extends Person(name, address) {
	// rest of the class
}

val teresa = new Employee("Teresa", Address("Louisville", "KY"), 25)
																								//> teresa  : worksheet.Employee = Teresa @ Address(Louisville,KY)
```

#### （11）调用父类的构造函数
##### 子类可以调用父类的任意一个构造函数
```scala
class Animal(var name: String, var age: Int) {
	def this(name: String) {
		this(name, 0)
	}
	override def toString = s"$name is $age years old"
}

class Dog(name: String) extends Animal(name) {
	println("Dog constructor called")
}

class Dog(name: String) extends Animal(name, 0) {
	println("Dog constructor called")
}
```
##### 子类的辅助构造函数
应为scala必须存在构造函数链，最后一定会执行主构造函数，所以辅助构造函数不用显示的调用父类构造函数
```scala
case class Address(city: String, state: String)
case class Role(role: String)

class Person(var name: String, var address: Address) {
	def this(name: String) {
		this(name, null)
		address = null
	}
	override def toString = if (address == null) name else s"$name @ $address"
}

class Employee(name: String, role: Role, address: Address)
	extends Person(name, address) {
	def this(name: String) {
		this(name, null, null)
	}
	def this(name: String, role: Role) {
		this(name, role, null)
	}
	def this(name: String, address: Address) {
		this(name, null, address)
	}
}
```

#### （12）何时使用抽象类
* 需要创建一个有构造函数参数的基类
* 需要被java调用

> scala中的特质（trait）
> * 不允许有构造函数参数
> * java无法调用带方法实现的scala trait
> * 使用abstract修饰类

```scala
abstract class BaseController(db: Database) {
	def save { db.save }
	def update { db.update }
	def delete { db.delete }
	// abstract
	def connect
	// an abstract method that returns a String
	def getStatus: String
	// an abstract method that takes a parameter
	def setServerName(serverName: String)
}
```

#### （13）在抽象类或者特质中定义属性
* 抽象类中的var属性会编译成scala的get/set方法
* 抽象类中的val属性会编译成scala的get方法
* 但是不会创建这么一个字段
* 子类需要重新定义属性

```scala
abstract class Pet(name: String) {
	val greeting: String
	var age: Int
	def sayHello { println(greeting) }
	override def toString = s"I say $greeting, and I'm $age"
}
class Dog(name: String) extends Pet(name) {
	val greeting = "Woof"
	var age = 2
}
class Cat(name: String) extends Pet(name) {
	val greeting = "Meow"
	var age = 5
}

val d = new Dog("dog")                    //> d  : worksheet.Dog = I say Woof, and I'm 2

```


#### （14）使用case类生成模板代码
> case class主要是为了创建不可变记录
> 定义一个case class scala会自动生成模板代码包括：
> * 生成apply方法，不用new
> * val（或者不写）成get， var生成get/set
> * 生成默认toString方法
> * 生成unapply，模式匹配好用
> * `equals()`和`hashCode()`
> * 一个`copy`方法

```scala
case class Person(name: String, relation: String)
val p = Person("name", "fsadfd")          //> p  : worksheet.Person = Person(name,fsadfd)
p.name                                    //> res0: String = name
//p.name = "fsadfd" //报错
```


#### （15）定义一个equals方法
> scala 对象的 == 会调用equals方法

```scala
val p1 = new Person("111",1)              //> p1  : worksheet.Person = worksheet$Person@c1f1
val p2 = new Person("111",1)              //> p2  : worksheet.Person = worksheet$Person@c1f1
p1 == p2                                  //> res0: Boolean = true
```


#### （16）创建内部类
```scala
class PandorasBox {
	case class Thing(name: String)
	var things = new collection.mutable.ArrayBuffer[Thing]()
	things += Thing("Evil Thing #1")
	things += Thing("Evil Thing #2")
	def addThing(name: String) { things += new Thing(name) }
}
```
eg.2
```scala
class OuterClass {
	class InnerClass {
		var x = 1
	}
}
val oc1 = new OuterClass                  //> oc1  : worksheet.OuterClass = worksheet$OuterClass@5e8c92f4
val oc2 = new OuterClass                  //> oc2  : worksheet.OuterClass = worksheet$OuterClass@6a5fc7f7
val ic1 = new oc1.InnerClass              //> ic1  : worksheet.oc1.InnerClass = worksheet$OuterClass$InnerClass@3b6eb2ec
val ic2 = new oc2.InnerClass              //> ic2  : worksheet.oc2.InnerClass = worksheet$OuterClass$InnerClass@1e643faf
ic1.x = 10
ic2.x = 20
println(s"ic1.x = ${ic1.x}")              //> ic1.x = 10
println(s"ic2.x = ${ic2.x}")              //> ic2.x = 20
```


### 2、方法
#### （1）控制方法作用域
> 默认为public
> 从严格到宽松
> * Object-private scope对象私有作用域
>  *  `private[this] def isFoo = true`
> * Private
>  * `private def ...`
> * Package
>  * `protected def`
> * Package-specific
>  * 		`private[model] def doX {}`
> * Public
>  * `def doX {}`

##### 对象私有作用域
```scala
class Foo {
	private[this] def isFoo = true

	def doSth(){
		if(isFoo){ //正确

		}
	}

	def doFoo(other: Foo) {
		if (other.isFoo) { // 报错
			// ...
		}
	}
}
```

#####  私有作用域
```
class Foo {
	private def isFoo = true
	def doFoo(other: Foo) {
		if (other.isFoo) { // 正确
			// ...
		}
	}
}
//子类不可访问
class Animal {
	private def heartBeat {}
}
class Dog extends Animal {
	heartBeat // 报错
}
```

##### 保护作用域——子类可见
```scala
class Animal {
	protected def breathe {}
}
class Dog extends Animal {
	breathe
}
```

##### 包作用域
```scala
package com.acme.coolapp.model {
	class Foo {
		private[model] def doX {}
		private def doY {}
	}
	class Bar {
		val f = new Foo
		f.doX // 可编译
		f.doY // 不能编译
	}
}
```

##### 开放作用域
```scala
package com.acme.coolapp.model {
	class Foo {
		def doX {}
	}
}
package org.xyz.bar {
	class Bar {
		val f = new com.acme.coolapp.model.Foo
		f.doX
	}
}
```


#### （2）调用父类方法
* `super.xXxx`
* `super[父类].xXxx`

一般形式
```scala
class FourLeggedAnimal {
	def walk { println("I'm walking") }
	def run { println("I'm running") }
}
class Dog extends FourLeggedAnimal {
	def walkThenRun {
		super.walk
		super.run
	}
}
```

调用特质方法(用with继承多个父类)
```scala
trait Human {
	def hello = "the Human trait"
}
trait Mother extends Human {
	override def hello = "Mother"
}
trait Father extends Human {
	override def hello = "Father"
}
class Child extends Human with Mother with Father {
	def printSuper = super.hello
	def printMother = super[Mother].hello
	def printFather = super[Father].hello
	def printHuman = super[Human].hello
}
val c = new Child                         //> c  : worksheet.Child = worksheet$Child@5e8c92f4
println(s"c.printSuper = ${c.printSuper}")//> c.printSuper = Father
println(s"c.printMother = ${c.printMother}")
																								//> c.printMother = Mother
println(s"c.printFather = ${c.printFather}")
																								//> c.printFather = Father
println(s"c.printHuman = ${c.printHuman}")//> c.printHuman = the Human trait
```

若间接继承特质，不可调用特质方法
```scala
trait Animal {
	def walk { println("Animal is walking") }
}
class FourLeggedAnimal extends Animal {
	override def walk { println("I'm walking on all fours") }
}
class Dog extends FourLeggedAnimal {
	def walkThenRun {
		super.walk 
		super[FourLeggedAnimal].walk 
		super[Animal].walk // error
	}
}
```


#### （3）方法参数的默认值
```scala
class Connection {
	def makeConnection(timeout: Int = 5000, protocol: String = "http") {
		println("timeout = %d, protocol = %s".format(timeout, protocol))
		// more code here
	}
}
val c = new Connection
c.makeConnection //报错
c.makeConnection()
c.makeConnection(2000)
c.makeConnection(3000, "https")

//可以带上变量名
c.makeConnection(timeout=10000)
c.makeConnection(protocol="https")
c.makeConnection(protocol="https", timeout=10000)
```

#### （4）使用参数名传参，参数顺序任意
`methodName(param1=value1, param2=value2, ...)`

#### （5）定义一个返回多个值的tuples（元组）方法，代替java临时包装类
```scala
def getStockInfo = ("NFLX", 100.00)               //> getStockInfo: => (String, Double)
val (symbol, currentPrice) = getStockInfo         //> symbol  : String = NFLX
                                                  //| currentPrice  : Double = 100.0
symbol                                            //> res0: String = NFLX
currentPrice                                      //> res1: Double = 100.0
```

#### （6）调用get/set方法不要使用括号
> 任意无副作用getter的声明不应该加括号

```scala
class Pizza {
	def crustSize = 12
}
val p = new Pizza

p.crustSize  //正确
p.crustSize() //报错
```

> 函数的副作用包括
> * IO输出
> * IO读
> * 又该一个参数的状态，或修改一个对象的某个属性值
> * 抛出异常，出错导致程序停止
> * 调用其他具有副作用的函数



#### （7）创建接受可变参数的方法
* 一个方法只允许拥有一个可变参数
* 可变参数必须在参数列表的最后一个
* `def printAll(strings: String*) {`
* 可变参数实际上是一个数组

```scala
def printAll(strings: String*) {
	strings.foreach(println)
}
def printAll(strings: String*, i: Int) { //报错
	strings.foreach(println)
}

//传入数组
val arr= Array("What's","up","doc?")
printAll(arr:_*)
```



#### （8）方法异常声明
`@throws(classOf[XxxException])`

* scala 不要求处理异常

```scala
@throws(classOf[Exception])
override def play {
 // exception throwing code here ...
}

@throws(classOf[IOException])
@throws(classOf[LineUnavailableException])
@throws(classOf[UnsupportedAudioFileException])
def playSoundFileWithJavaAudio {
 // exception throwing code here ...
}
```

#### （9）方法链式调用的支持
使用条件
* 如果类可能会被继承，那么使用this.type作为返回值
* 如果确定里不会被扩展，那么直接返回this，不用显示的指定返回类型为this.type

##### 会被继承
```scala
class Person {
	protected var fname = ""
	protected var lname = ""
	def setFirstName(firstName: String): this.type = {
		fname = firstName
		this
	}
	def setLastName(lastName: String): this.type = {
		lname = lastName
		this
	}
}
class Employee extends Person {
	protected var role = ""
	def setRole(role: String): this.type = {
		this.role = role
		this
	}
	override def toString = {
		"%s, %s, %s".format(fname, lname, role)
	}
}
 val employee = new Employee              //> employee  : worksheet.Employee = , , 

 employee.setFirstName("Al")
 .setLastName("Alexander")
 .setRole("Developer")                    //> res0: worksheet.employee.type = Al, Alexander, Developer

 println(employee)                        //> Al, Alexander, Developer
```

##### 不会被继承
```scala
final class Pizza {
	import scala.collection.mutable.ArrayBuffer
	private val toppings = ArrayBuffer[String]()
	private var crustSize = 0
	private var crustType = ""
	def addTopping(topping: String) = {
		toppings += topping
		this
	}
	def setCrustSize(crustSize: Int) = {
		this.crustSize = crustSize
		this
	}
	def setCrustType(crustType: String) = {
		this.crustType = crustType
		this
	}
	def print() {
		println(s"crust size: $crustSize")
		println(s"crust type: $crustType")
		println(s"toppings: $toppings")
	}
}
val p = new Pizza                         //> p  : worksheet.Pizza = worksheet$Pizza@26f0a63f
p.setCrustSize(14)
	.setCrustType("thin")
	.addTopping("cheese")
	.addTopping("green olives")
	.print()                          //> crust size: 14
																								//| crust type: thin
																								//| toppings: ArrayBuffer(cheese, green olives)
```

#### （10）函数柯里化
```scalal
//多参数列表方式
//定义
def curriedSum(x:Int)(y:Int) = x + y
//调用
curriedSum(1)(1)
//柯里化
val onePlus = curriedSum(1)_

等价于（单参数列表形式）
//定义
def sum(x:Int) = (y:Int) => x + y //返回一个函数类型
//调用
sum(1)(1)
//柯里化
def plusOne = sum(1)

```


#### （11）传名参数（创建新的控制结构）
> `f:=>Boolean`

单元测试框架
```scala
//定义
def test(desc:String)(f:=>Boolean) = 
	if(f) println(s"${desc}：成功")
	else println(s"${desc}：失败")
	
//调用
test("test1"){
	val a=1
	val b=1
	2 == a+b
}

```


### 3、对象
> 对象的含义
> * java的类实例
> * scala的关键字
>  * object
>  * package object
>  * 伴生object

#### （1）实例对象强制转换
```scala
object.asInstanceOf[类型]
```

#### （2）获取类的class对象（java.class）
```scala
 classOf[Xxx] //等价于java Xxx.class
```

#### （3）确定实例对象所属的类
```scala
val a = "asd"                             //> a  : String = asd
a.getClass                                //> res0: Class[?0] = class java.lang.String
```

#### （4）用object启动一个应用
方法一、实现一个继承App特质的object
```scala
object Hello extends App{
	if(args.length==1)
		println("${args(0)}")
	else
		println("Hello")
}
```

方法二、实现创建一个拥有main方法的object
```scala
object Hello {
	def main(args: Array[String]){
		println("Hello")
	}
}
```


#### （5）用object创建单例
> object可以理解为静态类，所有方法，通过objectName调用

#### （6）用伴生类创建静态成员
* 在同一文件中创建class和object且具有相同的名字
* 在object中定义静态成员
* 在class中定义实例方法
* object和class可以互相问私有成员

一般用法
```scala
class Pizza(var crustType: String) {
	override def toString = "Crust type is " + crustType
}

object Pizza {
	val CRUST_TYPE_THIN = "thin"
	val CRUST_TYPE_THICK = "thick"
	def getFoo = "Foo"
}
```

互相访问私有成员
```scala
class Foo {
	private val secret = 2
}
object Foo {
	def double(foo: Foo) = foo.secret * 2
}
object Driver extends App {
	val f = new Foo
	println(Foo.double(f)) // prints 4
}
```


#### （7）把通用代码放在包对象package object中
在不引入类和对象的情况下，让函数字段在其他代码在包级别可用

```scala
package com.alvinalexander.myapp
package object model {
	// 字段
	val MAGIC_NUM = 42
	// 方法
	def echo(a: Any) { println(a) }
	// 枚举
	object Margin extends Enumeration {
		type Margin = Value
		val TOP, BOTTOM, LEFT, RIGHT = Value
	}
	// 类型
	type MutableMap[K, V] = scala.collection.mutable.Map[K, V]
	val MutableMap = scala.collection.mutable.Map
}
```
> 上例子：
> * 放置在 com/alvinalexander/myapp/model文件夹内
> * 文件名为package.scala


#### （8）不使用new创建对象
* 为类创建伴生对象，并定义一个apply方法
* 将类定义为case类

apply方法
```scala
class Person {
	var name: String = _
}
object Person {
	def apply(name: String): Person = {
		var p = new Person
		p.name = name
		p
	}
}
val dawn = Person("Dawn")                 //> dawn  : worksheet.Person = worksheet$Person@5e8c92f4
val a = Array(Person("Dan"), Person("Elijah"))
																								//> a  : Array[worksheet.Person] = Array(worksheet$Person@2d6e8792, worksheet$Pe
																								//| rson@2812cbfa)
```

将类定义为case类
```scala
case class Person (var name: String)
```

#### （9）用apply实现工厂方法
```scala
trait Animal {
	def speak
}
object Animal {
	private class Dog extends Animal {
		override def speak { println("woof") }
	}
	private class Cat extends Animal {
		override def speak { println("meow") }
	}
	// the factory method
	def apply(s: String): Animal = {
		if (s == "dog") new Dog
		else new Cat
	}
}
val cat = Animal("cat") // returns a Cat
val dog = Animal("dog") // returns a Dog
```


## 四、包和引入
***********************************************
### 1、特点
* 随处可以使用import语句
* 导入类、包或对象
* 导入类是隐藏或者重命名
* 一个文件可以创建多个包类

### 2、创建
c#风格包标记法
```scala
package com.acme.store {
 class Foo { override def toString = "I am com.acme.store.Foo" }
}
```

java风格包定义
```scala
package com.acme.store
class Foo { override def toString = "I am com.acme.store.Foo" }
```

### 2、导入
引入单个类
```scala
import java.io.File
```

引入包内多个类
```scala
import java.io._
import java.io.{File, IOException, FileNotFoundException}
```

在块作用域内有效的import语句
```scala
package foo
import java.io.File
import java.io.PrintWriter
class Foo {
	import javax.swing.JFrame // only visible in this class
	// ...
}
```

导入时重命名类
```scala
import java.util.{ArrayList => JavaList}
import java.util.{Date => JDate, HashMap => JHashMap}
```

导入时隐藏类
```scala
import java.util.{Random => _, _}
import java.util.{List => _, Map => _, Set => _, _}
```


## 五、特质
***********************************************
### 1、特质用作接口
```scala
trait BaseSoundPlayer {
	def play
	def close
	def pause
	def stop
	def resume
}

trait Dog {
	def speak(whatToSay: String):Unit
	def wagTail(enabled: Boolean)
}

class Mp3SoundPlayer extends BaseSoundPlayer { ...
class Foo extends BaseClass with Trait1 with Trait2 { ...
class Foo extends Trait1 with Trait2 with Trait3 with Trait4 { ...

```

### 2、特质中定义抽象和实际字段
```scala
trait PizzaTrait {
	var numToppings: Int // abstract
	var size = 14 // concrete
	val maxNumToppings = 10 // concrete
}

class Pizza extends PizzaTrait {
	var numToppings = 0 // 'override' not needed
	size = 16 // 'var' and 'override' not needed
	override val maxNumToppings = 10 // 'override' 必须
}

```

### 3、像抽象类一样使用特质、
```scala
trait Pet {
	def speak { println("Yo") } // concrete implementation
	def comeToMaster // abstract method
}
class Dog extends Pet {
	// don't need to implement 'speak' if you don't need to
	def comeToMaster { ("I'm coming!") }
}
class Cat extends Pet {
	// override the speak method
	override def speak { ("meow") }
	def comeToMaster { ("That's not gonna happen.") }
}
```

### 4、简单混入 特质
使用`with`

### 5、通过继承限制特质的使用范围
`trait [TraitName] extends [SuperThing]` 该特质只能被继承了SuperThing的类使用
```scala
class StarfleetComponent
trait StarfleetWarpCore extends StarfleetComponent
class Starship extends StarfleetComponent with StarfleetWarpCore

class StarfleetComponent
trait StarfleetWarpCore extends StarfleetComponent
class RomulanStuff
// won't compile
class Warbird extends RomulanStuff with StarfleetWarpCore
```

### 6、限定特质只可用于指定类型的子类
```scala
//基本
trait MyTrait {
	this: BaseType =>
}
//特殊
trait WarpCore {
	this: Starship with WarpCoreEjector with FireExtinguisher =>
}

class Starship
trait WarpCoreEjector
trait FireExtinguisher

// this works
class Enterprise extends Starship
	with WarpCore
	with WarpCoreEjector
	with FireExtinguisher
```

### 7、保证特质只能添加到只有一个特定方法的类型
```scala
trait WarpCore {
	this: { def ejectWarpCore(password: String): Boolean } =>
}
class Starship {
	// code here ...
}
class Enterprise extends Starship with WarpCore {
	def ejectWarpCore(password: String): Boolean = {
		if (password == "password") {
			println("ejecting core")
			true
		} else {
			false
		}
	}
}
```


### 8、为object类型添加特质
```scala
object Test extends App {
	val hulk = new DavidBanner with Angry
}
```

### 9、像特质一样继承一个Java接口
```java
public interface Animal {
	public void speak();
}
public interface Wagging {
	public void wag();
}
public interface Running {
	public void run();
}
```

```scala
class Dog extends Animal with Wagging with Running {
	def speak { println("Woof") }
	def wag { println("Tail is wagging!") }
	def run { println("I'm running!") }
}
```

## 六、函数式编程
***********************************************
### 1、使用匿名函数（函数字面量）
匿名函数
```scala
(i: Int) => i % 2 == 0
```
匿名函数作为参数，简化过程
```scala
val x = List.range(1, 3)                          //> x  : List[Int] = List(1, 2)
x.foreach((i:Int) => println(i))                  //> 1
                                                  //| 2
x.foreach((i) => println(i))                      //> 1
                                                  //| 2
x.foreach(i => println(i))                        //> 1
                                                  //| 2
x.foreach(println(_))                             //> 1
                                                  //| 2
x.foreach(println)                                //> 1
                                                  //| 2
```

### 2、将函数赋给变量
#### （1）将匿名函数赋给变量
```scala
//完整形式
//val|var 变量名:函数签名 = (参数列表) => 函数体
//其中函数签名为 参数类型 => 返回值类型
val p:(Int) => Unit = (x) => {println(x)}         //> p  : Int => Unit = <function1>
//一个参数，函数体可以去掉括号
val p1:Int =>Unit = x => println(x)               //> p1  : Int => Unit = <function1>
//省略函数签名
val p2 = (x:Int) => {println(x)} //常用             //> p2  : Int => Unit = <function1>
//省略括号
val p3 = (x:Int) => println(x)                    //> p3  : Int => Unit = <function1>
```


#### （2）将已存在的函数赋给变量
```scala
val c = scala.math.cos _                          //> c  : Double => Double = <function1>
val c1 = scala.math.cos(_)                        //> c1  : Double => Double = <function1>

val p = scala.math.pow(_, _)                      //> p  : (Double, Double) => Double = <function2>

val sqrt = scala.math.pow(_:Double, 0.5)          //> sqrt  : Double => Double = <function1>
val sqrt = (x:Double) => scala.math.pow(x, 0.5)   //> sqrt  : Double => Double = <function1>

```

#### （3）定义接受回调函数的方法
```scala
def executeFunction(callback: () => Unit) {
	callback()
}                                         //> executeFunction: (callback: () => Unit)Unit

```

#### （4）闭包
注意代码中的$hello
```scala
def exec(f: (String) => Unit, name: String) {
	f(name)
}                                         //> exec: (f: String => Unit, name: String)Unit

var hello = "Hello"                       //> hello  : String = Hello
def sayHello(name: String) { println(s"$hello, $name") }
																								//> sayHello: (name: String)Unit

exec(sayHello, "Al")                      //> Hello, Al
hello = "Hola"
exec(sayHello, "Lorenzo")                 //> Hola, Lorenzo
```

#### （5）部分应用函数
```scala
val sqrt = scala.math.pow(_:Double, 0.5)          //> sqrt  : Double => Double = <function1>
```

#### （6）返回函数
```scala
def saySomething(prefix: String) = (s: String) => {
	prefix + " " + s
}                                         //> saySomething: (prefix: String)String => String

val sayHello = saySomething("Hello")      //> sayHello  : String => String = <function1>
```

#### （7）创建偏函数
普通实现
```scala
val divide = new PartialFunction[Int, Int] {
	def apply(x: Int) = 42 / x
	def isDefinedAt(x: Int) = x != 0
}                                         //> divide  : PartialFunction[Int,Int] = <function1>

divide.isDefinedAt(0)                     //> res0: Boolean = false
divide(2)                                 //> res1: Int = 21
```
case实现
```scala
val divide2: PartialFunction[Int, Int] = {
	case d: Int if d != 0 => 42 / d
}                                                 //> divide2  : PartialFunction[Int,Int] = <function1>
```
例三
```scala
// converts 1 to "one", etc., up to 5
val convertLowNumToString = new PartialFunction[Int, String] {
 val nums = Array("one", "two", "three", "four", "five")
 def apply(i: Int) = nums(i-1)
 def isDefinedAt(i: Int) = i > 0 && i < 6
}
```

使用orElse和andThen
```scala
val convert1to5 = new PartialFunction[Int, String] {
	val nums = Array("one", "two", "three", "four", "five")
	def apply(i: Int) = nums(i - 1)
	def isDefinedAt(i: Int) = i > 0 && i < 6
}                                         //> convert1to5  : PartialFunction[Int,String]{val nums: Array[String]} = <funct
																								//| ion1>
val convert6to10 = new PartialFunction[Int, String] {
	val nums = Array("six", "seven", "eight", "nine", "ten")
	def apply(i: Int) = nums(i - 6)
	def isDefinedAt(i: Int) = i > 5 && i < 11
}                                         //> convert6to10  : PartialFunction[Int,String]{val nums: Array[String]} = <func
																								//| tion1>

val handle1to10 = convert1to5 orElse convert6to10
																								//> handle1to10  : PartialFunction[Int,String] = <function1>

handle1to10(3)                            //> res0: String = three
handle1to10(8)                            //> res1: String = eight
```




