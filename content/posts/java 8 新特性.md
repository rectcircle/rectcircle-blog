---
title: Java 8 新特性
date: 2017-02-26T21:10:25+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/47
  - /detail/47/
tags:
  - Java
---

## 一、Lambda表达式

***

### 1.1 语法

一个Lambda表达式具有下面这样的语法特征。它由三个部分组成：第一部分为一个括号内用逗号分隔的形参，参数即函数式接口里面方法的参数；第二部分为一个箭头符号：->；第三部分为方法体，可以是表达式和代码块。语法如下：

```java
parameter -> expression body
```

下面列举了Lambda表达式的几个最重要的特征：

* 可选的类型声明：你不用去声明参数的类型。编译器可以从参数的值来推断它是什么类型。
* 可选的参数周围的括号：你可以不用在括号内声明单个参数。但是对于很多参数的情况，括号是必需的。
* 可选的大括号：如果表达式体里面只有一个语句，那么你不必用大括号括起来。
* 可选的返回关键字：如果表达式体只有单个表达式用于值的返回，那么编译器会自动完成这一步。若要指示表达式来返回某个值，则需要使用大括号。

> 函数式接口的重要属性是：我们能够使用 Lambda 实例化它们，Lambda 表达式让你能够将函数作为方法参数，或者将代码作为数据对待。Lambda 表达式的引入给开发者带来了不少优点：在 Java 8 之前，匿名内部类，监听器和事件处理器的使用都显得很冗长，代码可读性很差，Lambda 表达式的应用则使代码变得更加紧凑，可读性增强；Lambda 表达式使并行操作大集合变得很方便，可以充分发挥多核 CPU 的优势，更易于为多核处理器编写代码。引用自IBM - Java 8 新特性概述。

### 1.2 样例

```java
public class NewFeaturesTester {
    public static void main(String args[]){
        NewFeaturesTester tester = new NewFeaturesTester();

          // 带有类型声明的表达式
          MathOperation addition = (int a, int b) -> a + b;

          // 没有类型声明的表达式
          MathOperation subtraction = (a, b) -> a - b;

          // 带有大括号、带有返回语句的表达式
          MathOperation multiplication = (int a, int b) -> { return a * b; };

          // 没有大括号和return语句的表达式
          MathOperation division = (int a, int b) -> a / b;

          // 输出结果
          System.out.println("10 + 5 = " + tester.operate(100, 2, addition));
          System.out.println("10 - 5 = " + tester.operate(100, 2, subtraction));
          System.out.println("10 x 5 = " + tester.operate(100, 2, multiplication));
          System.out.println("10 / 5 = " + tester.operate(100, 2, division));

          // 没有括号的表达式
          GreetingService greetService1 = message ->
          System.out.println("Hello " + message);

          // 有括号的表达式
          GreetingService greetService2 = (message) ->
          System.out.println("Hello " + message);

          // 调用sayMessage方法输出结果
          greetService1.sayMessage("Shiyanlou");
          greetService2.sayMessage("Classmate");
       }

       // 下面是定义的一些接口和方法

       interface MathOperation {
          int operation(int a, int b);
       }

       interface GreetingService {
          void sayMessage(String message);
       }

       private int operate(int a, int b, MathOperation mathOperation){
          return mathOperation.operation(a, b);
       }
}
```

需要注意的是：

* Lambda表达式优先用于定义功能接口在行内的实现，即单个方法只有一个接口。在上面的例子中，我们用了多个类型的Lambda表达式来定义MathOperation接口的操作方法。然后我们定义了GreetingService的sayMessage的实现。
* Lambda表达式让匿名类不再需要，这位Java增添了简洁但实用的函数式编程能力。

使用步骤

* 创建一个单方法接口
* 实现函数体

```java
接口名 实例名 = (参数列表) -> {
	//方法体
	}
```

### 1.4 作用域

通过使用Lambda表达式，你可以引用final变量或者有效的final变量（只赋值一次）。如果一个变量被再次赋值，Lambda表达式将抛出一个编译错误。

我们可以通过下面这段代码来学习Lambda的作用域。请将代码修改至如下这些：

```
public class NewFeaturesTester {
    final static String salutation = "Hello "; //正确
		//static String salutation = "Hello "; //正确
		//String salutation = "Hello "; //报错
		//final salutation = "Hello "; //报错

    public static void main(String args[]){
		    //String salutation = "Hello "; //正确
				//int salutation = 1; //正确，可访问，Lambda内不可修改

        GreetingService greetService1 = message ->
        System.out.println(salutation + message);
        greetService1.sayMessage("Shiyanlou");
    }

    interface GreetingService {
       void sayMessage(String message);
    }
}
```

Lambda表达式可以访问的外部变量

* 可访问static 修饰的成员变量（普通成员变量将报错），可以修改
* 可访问普通局部变量（Lambda表达式所在方法内定义的变量的变量），不可修改
* 可访问 Lambda表达式所在方法 的参数，不可修改

### 1.5 方法引用

方法引用可以通过方法的名字来引用其本身。方法引用是通过::符号（双冒号）来描述的。

它可以用来引用下列类型的方法：

* **静态方法**
ContainingClass::staticMethodName
例子: String::valueOf，对应的Lambda：(s) -> String.valueOf(s)
比较容易理解，和静态方法调用相比，只是把.换为::

* **实例方法**
containingObject::instanceMethodName
例子: x::toString，对应的Lambda：() -> this.toString()
与引用静态方法相比，都换为实例的而已

* **引用特定类型的任意对象的实例方法**
ContainingType::methodName
例子: String::toString，对应的Lambda：(s) -> s.toString()
太难以理解了。难以理解的东西，也难以维护。建议还是不要用该种方法引用。
实例方法要通过对象来调用，方法引用对应Lambda，Lambda的第一个参数会成为调用实例方法的对象。

* **使用new操作符的构造器方法**
ClassName::new
例子: String::new，对应的Lambda：() -> new String()
构造函数本质上是静态方法，只是方法名字比较特殊。

### 1.5 方法应用的例子

```java
package com.rectcircle.lambda;

public class LambdaTest3 {

	public static void main(String[] args) {

		greetTo("铁蛋", name -> System.out.println("吃饭了么？" + name));

		greetTo("小明", LambdaTest3::sayGreetingByCN);

		// greetTo("Job",LambdaTest3::sayGreetingByEN); 报错

		LambdaTest3 lt = new LambdaTest3();
		greetTo("Tom", lt::sayGreetingByEN);

		t(String::toString);

	}

	interface GreetingService {
		void sayGreeting(String name);
	}

	static void t(GreetingService gs) {
		gs.sayGreeting("nihao"); // (String) -> void，函数体是执行 "nihao".toString();
	}

	public static void greetTo(String name, GreetingService gs) {
		gs.sayGreeting(name);
	}

	static void sayGreetingByCN(String name) {
		System.out.println("你好，" + name + "！");
	}

	public void sayGreetingByEN(String name) {
		System.out.println("Hello," + name + "!");
	}

}
```

## 二、函数式接口

***

函数式接口有一个单一的功能来表现。例如，带有单个compareTo方法的比较接口，被用于比较的场合。Java 8 定义了大量的函数式接口来广泛地用于lambda表达式。

> Java 8 引入的一个核心概念是函数式接口（Functional Interfaces）。通过在接口里面添加一个抽象方法，这些方法可以直接从接口中运行。如果一个接口定义个唯一一个抽象方法，那么这个接口就成为函数式接口。同时，引入了一个新的注解：@FunctionalInterface。可以把他它放在一个接口前，表示这个接口是一个函数式接口。这个注解是非必须的，只要接口只包含一个方法的接口，虚拟机会自动判断，不过最好在接口上使用注解 @FunctionalInterface 进行声明。在接口中添加了 @FunctionalInterface 的接口，只允许有一个抽象方法，否则编译器也会报错。

### 2.1 相关的接口及描述

下面是部分函数式接口的列表。

`BitConsumer<T,U>`
: 该接口代表了接收两个输入参数T、U，并且没有返回的操作。

`BiFunction<T,U,R>`
: 该接口代表提供接收两个参数T、U，并且产生一个结果R的方法。

`BinaryOperator<T>`
: 代表了基于两个相同类型的操作数，产生仍然是相同类型结果的操作。

`BiPredicate<T,U>`
: 代表了对两个参数的断言操作（基于Boolean值的方法）。

`BooleanSupplier`
: 代表了一个给出Boolean值结果的方法。

`Consumer<T>`
: 代表了接受单一输入参数并且没有返回值的操作。

`DoubleBinaryOperator`
: 代表了基于两个Double类型操作数的操作，并且返回一个Double类型的返回值。

`DoubleConsumer`
: 代表了一个接受单个Double类型的参数并且没有返回的操作。

`DoubleFunction<R>`
: 代表了一个接受Double类型参数并且返回结果的方法。

`DoublePredicate`
: 代表了对一个Double类型的参数的断言操作。

`DoubleSupplier`
: 代表了一个给出Double类型值的方法。

`DoubleToIntFunction`
: 代表了接受单个Double类型参数但返回Int类型结果的方法。

`DoubleToLongFunction`
: 代表了接受单个Double类型参数但返回Long类型结果的方法。

`DoubleUnaryOperator`
: 代表了基于单个Double类型操作数且产生Double类型结果的操作。

`Function<T,R>`
: 代表了接受一个参数并且产生一个结果的方法。

`IntBinaryOperator`
: 代表了对两个Int类型操作数的操作，并且产生一个Int类型的结果。

`IntConsumer`
: 代表了接受单个Int类型参数的操作，没有返回结果。

`IntFunction<R>`
: 代表了接受Int类型参数并且给出返回值的方法。

`IntPredicate`
:代表了对单个Int类型参数的断言操作。

更多的接口可以参考Java 8官方API手册：java.lang.Annotation Type FunctionalInterface。在实际使用过程中，加有@FunctionalInterface注解的方法均是此类接口，位于java.util.Funtion包中。

### 2.2 例子

```java
package com.rectcircle.lambda;

import java.util.Arrays;
import java.util.List;
import java.util.function.Predicate;

public class LambdaTest4 {
   public static void main(String args[]){
      List<Integer> list = Arrays.asList(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);

      System.out.println("All of the numbers:");

      eval(list, n->true);

      System.out.println("Even numbers:");
      eval(list, n-> n%2 == 0 );

      System.out.println("Numbers that greater than  5:");
      eval(list, n -> n > 5 );
   }

   public static void eval(List<Integer> list, Predicate<Integer> predicate) {
      for(Integer n: list) {

         if(predicate.test(n)) {
            System.out.println(n + " ");
         }
      }
   }
}
```

## 三、默认方法

***

```java
package com.rectcircle.lambda;

public class DefaultMethod {
       public static void main(String args[]){
          Younger younger = new Student();
          younger.print();
       }
    }

    interface Younger {
       default void print(){
          System.out.println("I am a younger.");
       }

       static void sayHi(){
          System.out.println("Young is the capital.");
       }
    }

    interface Learner {
       default void print(){
          System.out.println("I am a learner.");
       }
    }

    class Student implements Younger, Learner {
       public void print(){
          Younger.super.print();
          Learner.super.print();
          Younger.sayHi();
          System.out.println("I am a student!");
       }
    }
```

输出

```
I am a younger.
I am a learner.
Young is the capital.
I am a student!
```

## 四、Optional类

***

```java
import java.util.Optional;

public class NewFeaturesTester {
   public static void main(String args[]){

      NewFeaturesTester tester = new NewFeaturesTester();
      Integer value1 = null;
      Integer value2 = new Integer(5);

      // ofNullable 允许传参时给出 null
      Optional<Integer> a = Optional.ofNullable(value1);

      // 如果传递的参数为null，那么 of 将抛出空指针异常（NullPointerException）
      Optional<Integer> b = Optional.of(value2);
      System.out.println(tester.sum(a,b));
   }

   public Integer sum(Optional<Integer> a, Optional<Integer> b){

      // isPresent 用于检查值是否存在

      System.out.println("First parameter is present: " + a.isPresent());
      System.out.println("Second parameter is present: " + b.isPresent());

      // 如果当前返回的是传入的默认值，orElse 将返回它
      Integer value1 = a.orElse(new Integer(0));

      // get 用于获得值，条件是这个值必须存在
      Integer value2 = b.get();
      return value1 + value2;
   }
}
```

## 五、流式操作

***

Stream是Java 8中的一个新的抽象层。通过使用Stream，你能以类似于SQL语句的声明式方式处理数据。

例如一个典型的SQL语句能够自动地返回某些信息，而不用在开发者这一端做任何的计算工作。同样，通过使用Java的集合框架，开发者能够利用循环做重复的检查。另外一个关注点是效率，就像多核处理器能够提升效率一样，开发者也可以通过并行化编程来改进工作流程，但是这样很容易出错。

因此，Stream的引入是为了解决上述痛点。开发者可以通行声明式数据处理，以及简单地利用多核处理体系而不用写特定的代码。

说了这么久，Stream究竟是什么呢？Stream代表了来自某个源的对象的序列，这些序列支持聚集操作。下面是Stream的一些特性：

* 元素序列：Stream以序列的形式提供了特定类型的元素的集合。根据需求，它可以获得和计算元素，但不会储存任何元素。
* 源：Stream可以将集合、数组和I/O资源作为输入源。
* 聚集操作：Stream支持诸如filter、map、limit、reduce等的聚集操作。
* 流水技术：许多Stream操作返回了流本身，故它们的返回值可以以流水的行式存在。这些操作称之为中间操作，并且它们的功能就是负责输入、处理和向目标输出。collect()方法是一个终结操作，通常存在于流水线操作的末端，来标记流的结束。
* 自动跌代：Stream的操作可以基于已提供的源元素进行内部的迭代，而集合则需要显式的迭代。

### 5.1 产生流

在Java 8 中，集合的接口有两个方法来产生流：

* `stream()`：该方法返回一个将集合视为源的连续流。
* `parallelStream()`：该方法返回一个将集合视为源的并行流。

### 5.2 相关方法

* `forEach`：该方法用于对Stream中的每个元素进行迭代操作。下面的代码段演示了如何使用forEach方法输出10个随机数。

```java
Random random = new Random();
random.ints().limit(10).forEach(System.out::println); //输出10个随机数
```

* `map`：该方法用于将每个元素映射到对应的结果上。下面的代码段演示了怎样用map方法输出唯一的某个数的平方。

```java
List<Integer> numbers = Arrays.asList(2, 3, 3, 2, 5, 2, 7);
//get list of unique squares
List<Integer> squaresList = numbers.stream().map( i -> i*i).distinct().collect(Collectors.toList());
```

* `filter`：该方法用于过滤满足条件的元素。下面的代码段演示了怎样输出使用了过滤方法的空字符串数量。（过滤filter(true)的元素）

```java
List<String>strings = Arrays.asList("efg", "", "abc", "bc", "ghij","", "lmn");
//get count of empty string
int count = strings.stream().filter(string -> string.isEmpty()).count();
```

* `limit`：该方法用于减少Stream的大小。下面的代码段演示了怎样有限制地输出10个随机数。
* `sorted`：该方法用于对Stream排序。下面的代码段演示了怎样以有序的形式输出10个随机数。

```java
Random random1 = new Random();
random1.ints().limit(10).sorted().forEach(System.out::println);
```

### 5.3 并行处理

ParallelStream是Stream用于并行处理的一种替代方案。下面的代码段演示了如何使用它来输出空字符串的数量。

```java
List<String> strings = Arrays.asList("efg", "", "abc", "bc", "ghij","", "lmn");

// 获得空字符串的计数
int count = strings.parallelStream().filter(string -> string.isEmpty()).count();
```

### 5.4 Collector（合并）

Collector用于合并Stream的元素处理结果。它可以用于返回一个字符串列表

```java
List<String>strings = Arrays.asList("efg", "", "abc", "bc", "ghij","", "lmn");
List<String> filtered = strings.stream().filter(string -> !string.isEmpty()).collect(Collectors.toList());

System.out.println("Filtered List: " + filtered);
String mergedString = strings.stream().filter(string -> !string.isEmpty()).collect(Collectors.joining(", "));
System.out.println("Merged String: " + mergedString);
```

输出

```
Filtered List: [efg, abc, bc, ghij, lmn]
Merged String: efg, abc, bc, ghij, lmn
```

## 六、新的Data/Time API

***

略
