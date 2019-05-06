---
title: scala概况
date: 2016-11-18T22:55:41+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/22
  - /detail/22/
tags:
  - scala
---

> 代码优于描述


## 一、下载、安装、
下载scala、sbt
安装以上

## 二、函数编程思想
没有副作用的函数
引用透明性、不可变性
函数是一等公民（类js）
高阶函数
闭包
**一切都是表达式**
表达式求值策略
递归函数
尾递归

## 三、语法基础
### 1、变量
* val 定义常量
* var 变量
* lazy val 惰性求值常量
* 类型可以自动推断

```scala
val x = 10                                      //> x  : Int = 10
val y:Int= 10                                   //> y  : Int = 10
lazy val z=x*y                                  //> z: => Int
z                                         //> res0: Int = 100
var a = 1                                 //> a  : Int = 1
a = 2
a     
```

### 2、数据类型
```scala
val a:Byte = 10                           //> a  : Byte = 10
val b:Short = 10                          //> b  : Short = 10
val c:Int = 10                            //> c  : Int = 10
val d:Long = 10                           //> d  : Long = 10
val e:Float = 10                          //> e  : Float = 10.0
val f:Double = 60                         //> f  : Double = 60.0

val x:Long = c                            //> x  : Long = 10
val t:Boolean = true                      //> t  : Boolean = true
val ch:Char = 'a'                         //> ch  : Char = a
val u:Unit=()                             //> u  : Unit = ()
45
val nu:Null = null                        //> nu  : Null = null
def foo() = throw new Exception("test")   //> foo: ()Nothing

val s1:String="s1"                        //> s1  : String = s1
val s2:String = s"this is ${s1}"          //> s2  : String = this is s1
```

### 3、代码块
也是表达式，其返回值是最后一个表达式 的值
```scala
{
//语句1
//语句2
}
```

### 4、定义函数表达式
> `def funcName(param: Type):returnType = {}`

```scala
def hello(name: String):String = {
		s"Hello, ${name}"
}                                         //> hello: (name: String)String
hello("rectcircle")                       //> res0: String = Hello, rectcircle

//返回值类型可省略
def hello2(name: String) = {
	s"Hello, ${name}"
}                                         //> hello2: (name: String)String
hello2("rectcircle")                      //> res0: String = Hello, rectcircle

def add(x:Int, y:Int) = x+y               //> add: (x: Int, y: Int)Int
add(1,2)                                  //> res1: Int = 3

```

### 5、if表达式
> `if(loaical_exp) valA else valB`

```scala
if(true) 1 else 2                         //> res0: Int = 1

val a = 1                                 //> a  : Int = 1
if(a==1) a                                //> res1: AnyVal = 1
if(a!=1) a                                //> res2: AnyVal = ()
if(a!=1) "test" else a                    //> res3: Any = 1
```

### 6、for 函数
```scala
val l = List("a","b","cccc");             //> l  : List[String] = List(a, b, cccc)

for(
	s<-l //generator
) println(s)                              //> a
																								//| b
																								//| cccc
for{
	s <- l
	if(s.length>=3) //filter
} println(s)                              //> cccc

var res = for {
	s <- l
	s1 = s.toUpperCase() //variable binding
	if(s1!="")
} yield(s1)                               //> res  : List[String] = List(A, B, CCCC)
```

**高级用法**
**1) This**
```scala
for(x <- c1; y <- c2; z <-c3) {...}
```
is translated into
```scala
c1.foreach(x => c2.foreach(y => c3.foreach(z => {...})))
```

**2) This**
```scala
for(x <- c1; y <- c2; z <- c3) yield {...}
```
is translated into
```scala
c1.flatMap(x => c2.flatMap(y => c3.map(z => {...})))
```

**3) This**
```scala
for(x <- c; if cond) yield {...}
```
is translated on Scala 2.7 into
```scala
c.filter(x => cond).map(x => {...})
```
or, on Scala 2.8, into
```scala
c.withFilter(x => cond).map(x => {...})
```

### 7、try表达式
> `try{}`
> `catch{}`
> `finally{}`

```scala
val res_try = try{
	Integer.parseInt("dog")
} catch {
	case _ => 0
} finally {
	println("always")
}                                         //> always
																								//| res_try  : Int = 0
```


### 8、match表达式相当于switch
> `exp match{`
> `	case p1 => val1`
> `	case p2 => val2`
> `	...`
> `	case _ => valn`
> `}`

```scala
val code=1                                //> code  : Int = 1
code match {
	case 1 =>"one"
	case 2 =>"two"
	case _ =>"others"
}                                         //> res0: String = one
```


### 9、求值策略
* call by value —— 对函数实参求值，且仅求一次
* call by name —— 函数实参用到时再求值
```scala
def foo(x: Int) = x //call by value
def foo1(x: => Int) = x //call by name
```

### 10、高阶函数(把函数作为形参或者返回值)
> 函数是第一等公民

* 函数可以作为函数的参数
* 把函数作为返回值
* 把函数赋值给变量
* 把函数存储在数据结构里
* 函数和普通变量一样具有函数的类型

函数类型
> `A => B`

#### 高阶函数
```scala
def operate(f: (Int, Int) => Int) = {
	f(4,4)
}

def greeting() = (name: String) => {"hello " + name + "!"}
                                                  //> greeting: ()String => String																					
```

#### 匿名函数（函数常量、函数字面量）
> (形参列表) => {函数体}

```scala
var add = (x: Int, y: Int) => {x + y}             //> add  : (Int, Int) => Int = <function2>
add(1,2)
```

#### 柯里化
> 把具有多个参数的函数转化为一个函数链，每个节点是单一参数

```scala
def add(x: Int)(y: Int) = {x + y}                 //> add: (x: Int)(y: Int)Int
add(1)(1)                                         //> res0: Int = 2
val addOne = add(1)_                              //> addOne  : Int => Int = <function1>
addOne(2)                                         //> res1: Int = 3
```

#### 递归函数
```scala
@annotation.tailrec
def factorial(n:Int): Int =
	if(n<=0) 1
	else n * factorial(n-1)                   //> factorial: (n: Int)Int
factorial(4)                                      //> res0: Int = 24

//尾递归
@annotation.tailrec
def factorial(n:Int, m:Int): Int =
	if(n<=0) m
	else factorial(n-1, m*n)

factorial(5,1)
```


#### 例子：求f(x)， x从a到b的值得和
```scala
def sum(func: Int => Int)(a: Int)(b: Int): Int = {

	@annotation.tailrec
	def loop(n: Int, acc: Int): Int = {
		if(n>b) acc
		else loop(n+1, acc + func(n))
	}

	loop(a, 0)
}

val ans1 = sum(x => x)(1)(10)
println(ans1)

val ans2 = sum(x => x*x)(1)(4)
println(ans2)
```


### 11、集合
#### （1）`List[T]`
```scala
val a = List(1,2,3,4)                             //> a  : List[Int] = List(1, 2, 3, 4)
val b = 0::a                                      //> b  : List[Int] = List(0, 1, 2, 3, 4)
//Nil空列表
val c = "x"::"y"::"z"::Nil                        //> c  : List[String] = List(x, y, z)
val d = a:::c                                     //> d  : List[Any] = List(1, 2, 3, 4, x, y, z)


/*方法*/
a.head                                            //> res0: Int = 1
//返回除了第一元素剩下的列表（尾列表）
a.tail                                            //> res1: List[Int] = List(2, 3, 4)
a.isEmpty                                         //> res2: Boolean = false
Nil.isEmpty                                       //> res3: Boolean = true


/*遍历函数*/
@annotation.tailrec
def each[T](func: T=>Unit)(l:List[T]): Unit = {
	if(!l.isEmpty) {
		func(l.head)
		each(func)(l.tail)
	}
}
each(println)(a)

/*高阶函数*/
//过滤器
a.filter((x:Int) => {x % 2 == 1})                 //> res4: List[Int] = List(1, 3)
a.filter(x => x % 2 == 1)                         //> res5: List[Int] = List(1, 3)
a.filter(_ % 2 == 1)                              //> res6: List[Int] = List(1, 3)

//String.toList
"99 Red Balloons".toList.filter { x => Character.isDigit(x) }
                                                  //> res7: List[Char] = List(9, 9)
//List.takeWhile()
"99 Red Balloons".toList.takeWhile { x => x!='B' }//> res8: List[Char] = List(9, 9,  , R, e, d,  )

//List.takeWhile()
c                                                 //> res9: List[String] = List(x, y, z)
c.map(x => x.toUpperCase())                       //> res10: List[String] = List(X, Y, Z)
c.map(_.toUpperCase())                            //> res11: List[String] = List(X, Y, Z)

//List.flatMap()，映射并打开1层list
val q = List(List(1,List(1)), List(1))            //> q  : List[List[Any]] = List(List(1, List(1)), List(1))
q.flatMap { x => x }                              //> res12: List[Any] = List(1, List(1), 1)

//List.reduceLeft，规约操作
/*
tmp = list[0] + list[1]
tmp = tmp + list[2]
......
tmp = tmp + list[n]
return tmp
*/
a.reduceLeft((x,y) => x+y)                        //> res13: Int = 10
a.reduceLeft(_+_)                                 //> res14: Int = 10

//List.foldLeft 类似于以上，添加初始值
a.foldLeft(1)(_+_)                                //> res15: Int = 11

```

#### （2）`Range`
```scala
(1 to 10)                                         //> res0: scala.collection.immutable.Range.Inclusive = Range(1, 2, 3, 4, 5, 6, 7,
                                                  //|  8, 9, 10)
(1 to 10 by 2)                                    //> res1: scala.collection.immutable.Range = Range(1, 3, 5, 7, 9)
(1 until 10)                                      //> res2: scala.collection.immutable.Range = Range(1, 2, 3, 4, 5, 6, 7, 8, 9)
(1 to 10 by 2).toList                             //> res3: List[Int] = List(1, 3, 5, 7, 9)
```

#### （3）`Stream` is lazy List
```scala
val a =  1 #:: 2#:: 3 #::Stream.empty             //> a  : scala.collection.immutable.Stream[Int] = Stream(1, ?)
a.head                                            //> res0: Int = 1
a.tail                                            //> res1: scala.collection.immutable.Stream[Int] = Stream(2, ?)
```

#### （4）`Tuple` 元组 相当于数据库的一个记录
```scala
#定义
(1, 2)                                            //> res0: (Int, Int) = (1,2)
1 -> 2  //第一个pair                                          //> res1: (Int, Int) = (1,2)
(1,"rectcircle","Math",99.9)                      //> res2: (Int, String, String, Double) = (1,rectcircle,Math,99.9)

#访问
t._1                                              //> res2: Int = 1
t._2                                              //> res3: String = rectcircle

//作用，返回多组数据，相当于匿名pojo对象，例
//求list元素数目，和，平方和
val a = List(1,2,3)                               //> a  : List[Int] = List(1, 2, 3)
def sumSq(in:List[Int]): (Int, Int, Int) ={
	in.foldLeft((0,0,0))((t,v)=>(t._1+1, t._2+v, t._3+v*v))
}                                                 //> sumSq: (in: List[Int])(Int, Int, Int)

sumSq(a)                                          //> res4: (Int, Int, Int) = (3,6,14)

```

#### （5）`Map[K,V]`
```scala
val p =Map(1->"David", 9->"John")                 //> p  : scala.collection.immutable.Map[Int,String] = Map(1 -> David, 9 -> John)
                                                  //| 
p(1)                                              //> res0: String = David
p(9)                                              //> res1: String = John

p.contains(1)                                     //> res2: Boolean = true
p.contains(2)                                     //> res3: Boolean = false
p.keys                                            //> res4: Iterable[Int] = Set(1, 9)
p.values                                          //> res5: Iterable[String] = MapLike(David, John)

//添加、去除1个元素
p + (3->"Job")                                    //> res6: scala.collection.immutable.Map[Int,String] = Map(1 -> David, 9 -> John
                                                  //| , 3 -> Job)
p - 1                                             //> res7: scala.collection.immutable.Map[Int,String] = Map(9 -> John)

//添加、去除一组元素
p ++ List(2-> "Bob", 3->"Tim")                    //> res8: scala.collection.immutable.Map[Int,String] = Map(1 -> David, 9 -> John
                                                  //| , 2 -> Bob, 3 -> Tim)
p -- List(1,9)   
```
#### 例子scala实现快速排序
```scala
  def qSort(a:List[Int]): List[Int] = {
    if(a.length < 2) a
    else qSort(a.filter(a.head > _)) ++
      a.filter(a.head == _) ++
      qSort(a.filter(a.head < _))
  }
  println(qSort(List(8,7,6,5,4,3,2,1)))
```
