---
title: Java奇淫巧技（Java“新”特性）
date: 2018-04-11T08:14:13+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/135
  - /detail/135/
tags:
  - Java
---

## 一、泛型

***

### 1、逆变和协变

逆变和协变发生在带有泛型的类型引用的相互转换上。
比如说函数参数的的传递，引用的传递

#### （1）逆变

Java语法`? super X`

#### （2）协变

Java语法`? extends X`

#### （3）方法的参数和返回值

* 参数遵循逆变法则
* 返回值遵循协变法则

#### （4）Function的逆变和协变

原则：参数类型逆变，返回值类型协变

例子：

```java
class A{}
class B extends A{}

void foo(Function<? super A, ? extends A> func){
	Object o = func.apply(new B());
}

Function<Object,B> cb = o->new B();
Function<? super A, ? extends A> cb1 = (Object b) -> new B();
Function<? super A, ? extends A> cb2 = cb;
Object o = cb2.apply(new B());

foo(cb);
foo(cb1);
```

#### （5）常规用法

* 参数类型逆变，返回值类型协变
* 要从泛型类取数据时，用extends；（也就是返回值）
* 要往泛型类写数据时，用super；（也就是函数参数）

### 2、Either实现小例子

需求：某些函数可能需要返回正确数据或者错误信息，但又不想使用异常，因为错误信息，在上层也是正常的业务，所以需要一个容器来容纳错误对象或者正常返回对象

实现：Either容器：

* 允许可以存放两个中类型的对象，一个是`left:L`（错误对象），一个是`right:R`（正确返回的对象）
* 同一个实例只允许存放两种类型中的一个

```java
public class Either<L,R> {
	private final L left;
	private final R right;
	private final boolean isLeft;

	private Either(L left, R right, boolean isLeft){
		this.left = left;
		this.right = right;
		this.isLeft = isLeft;
	}

	public static <L,R> Either<L, R> left(L left){
		return new Either<>(left, null, true);
	}

	public static <L,R> Either<L, R> right(R right){
		return new Either<>(null, right, false);
	}

	public boolean isLeft() {
		return isLeft;
	}

	public boolean isRight() {
		return !isLeft;
	}

	public Optional<L> left(){
		return Optional.of(left);
	}

	public Optional<R> right(){
		return Optional.of(right);
	}

	public <T> Either<L, T> map(
			Function<? super R, ? extends T> rFunc){
		if(isLeft) {
			return new Either<>(left, null, true);
		} else {
			return new Either<>(null, rFunc.apply(right), false);
		}
	}

	public <T> T match(
			Function<? super L, ? extends T> lFunc,
			Function<? super R, ? extends T> rFunc){
		if(isLeft) {
			return lFunc.apply(left);
		} else {
			return rFunc.apply(right);
		}
	}

	public void apply(Consumer<? super R> rFunc){
		if(!isLeft){
			rFunc.accept(right);
		}
	}
}
```

## 三、一条语句初始化集合

***

### 1、单元素集合

```java
import java.util.Collections;

Set<Integer> singleton = Collections.singleton(1);
List<Integer> singletonList = Collections.singletonList(1);
Map<Integer, Integer> singletonMap = Collections.singletonMap(1, 1);
```

注意这种方式创建的都是不可变的集合

### 2、利用Arrays.asList初始化

```java
	private static Set<String> KEY_NAMES = new HashSet<String>(Arrays.asList("paths", "ignorePaths", "allowUsers", "reviewUsers","qcReviewUsers"));

```

### 3、利用匿名子类+动态代码块

```java
	private static Set<String> set = new HashSet<String>() {{
		add(1);
		add(2);
		add(3);
		add(4);
	}}
```
