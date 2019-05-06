---
title: Java 反射笔记
date: 2017-05-17T20:06:44+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/77
  - /detail/77/
tags:
  - java
---

## 目录
* [1、classLoading](#1、classLoading)
* [2、反射相关类及方法](#2、反射相关类及方法)

### 1、classLoading
#### （0）JVM类加载机制
动态加载，用到时再加载。

#### （1）介绍
类加载器是负责加载类的对象。ClassLoader 类是一个抽象类。如果给定类的二进制名称，那么类加载器会试图查找或生成构成类定义的数据。一般策略是将名称转换为某个文件名，然后从文件系统读取该名称的“类文件”。 

每个 Class 对象都包含一个对定义它的 ClassLoader 的引用。 

数组类的 Class 对象不是由类加载器创建的，而是由 Java 运行时根据需要自动创建。数组类的类加载器由 Class.getClassLoader() 返回，该加载器与其元素类型的类加载器是相同的；如果该元素类型是基本类型，则该数组类没有类加载器。 

类加载器通常由安全管理器使用，用于指示安全域。

ClassLoader 类使用委托模型来搜索类和资源。每个 ClassLoader 实例都有一个相关的父类加载器。需要查找类或资源时，ClassLoader 实例会在试图亲自查找类或资源之前，将搜索类或资源的任务委托给其父类加载器。虚拟机的内置类加载器（称为 "bootstrap class loader"）本身没有父类加载器，但是可以将它用作 ClassLoader 实例的父类加载器。

通常情况下，Java 虚拟机以与平台有关的方式，从本地文件系统中加载类。例如，在 UNIX 系统中，虚拟机从 CLASSPATH 环境变量定义的目录中加载类。 

然而，有些类可能并非源自一个文件；它们可能源自其他来源（如网络），也可能是由应用程序构造的。defineClass 方法将一个 byte 数组转换为 Class 类的实例。这种新定义的类的实例可以使用 Class.newInstance 来创建。 

类加载器所创建对象的方法和构造方法可以引用其他类。为了确定引用的类，Java 虚拟机将调用最初创建该类的类加载器的 loadClass 方法。



#### （2）JDK内置的ClassLoader
* bootstrap class loader 通过本地语言实现，加载jdk核心类`java.lang.*`等
* extesion class loader java实现，加载来自`jre/lib/ext`内的类
* application class loader 加载用户定义的类
* 其他class loader
	* SecureClassLoader 
	* URLClassLoader 


#### （3）Class Loader层次关系
> bootstrap class loader <- extesion class loader <- application class loader <- other

为了安全性，在加载新的class将会委托父ClassLoader，询问是否已经加载了


### 2、反射相关类及方法
* `java.lang.Class` 类对象，由classLoader创建，包含类的相关信息（如字段方法等）
* `java.lang.reflect.Array` 类提供了动态创建和访问 Java 数组的方法。 
* `java.lang.reflect.Constructor<T>` 类的构造函数对象，通过其可以其可以动态创建对象
* `java.lang.reflect.Field` 类的属性或者说成员，通过其可以访问或者修改对象的Field
* `java.lang.reflect.Method` 类的方法对象，通过其可以动态调用对象的方法

#### （1）`java.lang.Class`
**获取Class方法的方法**
* `Class.forName("java.lang.String")`
* `String.class`
* `对象引用.getClass()`

**与反射相关的常用方法**
* 通过名字获取其他反射对象
	* `getConstructor` 获取该类的构造器对象（public）
	* `getDeclaredConstructor` 获取该类所有的构造器对象
	* `getField` 获取该类的字段（public）
	* `getDeclaredField` 获取该类所有的字段
	* `getMethod` 获取该类的方法（public）
	* `getDeclaredMethod` 获取该类的所有方法
* 获取所有其他反射对象（数组形式）
	* `getConstructors` 获取该类的构造器对象（public）
	* `getDeclaredConstructors` 获取该类所有的构造器对象
	* `getFields` 获取该类的字段（public）
	* `getDeclaredFields` 获取该类所有的字段
	* `getMethods` 获取该类的方法（public）
	* `getDeclaredMethods` 获取该类的所有方法

#### （2）`java.lang.reflect.Array`
**静态方法**
* `get(Object array, int index)` 返回指定数组对象中索引组件的值。
* `getXxx(Object array, int index)` 返回以 xxx 形式返回指定数组对象中索引组件的值。
* `set(Object array, int index, Object value)` 将指定数组对象中索引组件的值设置为指定的新值。
* `setXxx(Object array, int index, Object value)` 将指定数组对象中索引组件的值设置为指定的 xxx 值。

*以上xxx为八种基本数据类型*

**例子**
```java
	//提供了对数组的方法
	int arr[] = {1,2,3};
	String[] arr1 =  {"fasdf","fdsafs"};
	p(Array.get(arr1,1));
	Array.set(arr1,1,"change");
	p(arr1[1]);
	p(Array.getInt(arr,2));
```

#### （3）`java.lang.reflect.Constructor<T>`
**常用方法**
* `T newInstance(Object... initargs)` 动态构造一个对象

**例子**
```java
package com.rectcircle.javaapi.lang.reflect;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;

public class ConstructorTest {

	public static void p(Object o){System.out.println(o);}

	private int i;
	private String s;

	public ConstructorTest(){}
	public ConstructorTest(int i,String s){
		this.s = s;
		this.i = i;
	}

	@Override
	public String toString() {
		return "ConstructorTest{" +
				"i=" + i +
				", s='" + s + '\'' +
				'}';
	}

	public static void main(String[] args) throws ClassNotFoundException, IllegalAccessException, InstantiationException, NoSuchFieldException, NoSuchMethodException, InvocationTargetException {
	
		Class<ConstructorTest> clazz = ConstructorTest.class;
		Constructor<ConstructorTest> c1 = clazz.getConstructor();
		Constructor<ConstructorTest> c2 = clazz.getConstructor(int.class,String.class);

		//常用方法
		ConstructorTest obj1 = c1.newInstance();
		p(obj1);

		ConstructorTest obj2 = c2.newInstance(1,"string");
		p(obj2);
	}
}

```

#### （4）`java.lang.reflect.Field`
**常用方法**
* `void set(Object obj, Object value)` 将指定对象变量上此 Field 对象表示的字段设置为指定的新值。
* `void setXxx(Object obj, xxx v) ` 将字段的值设置为指定对象上的一个 xxx 值。 
* `Object get(Object obj)` Object get(Object obj)
* `xxx getBoolean(Object obj)` 获取一个静态或实例 xxx 字段的值。   

*以上xxx为八种基本数据类型*

**例子**
```java
package com.rectcircle.javaapi.lang.reflect;

import java.lang.reflect.Field;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.lang.reflect.TypeVariable;
import java.util.HashMap;
import java.util.Map;

public class FieldTest {

	public static void p(Object o) { System.out.println(o); }

	private int i;
	private String s;

	public Map<Integer,String> map = new HashMap<>();



	public FieldTest(){}

	public FieldTest(int i,String s){
		this.s = s;
		this.i = i;
	}

	@Override
	public String toString() {
		return "ConstructorTest{" +
				"i=" + i +
				", s='" + s + '\'' +
				'}';
	}

	public static void main(String[] args) throws ClassNotFoundException, IllegalAccessException, InstantiationException, NoSuchFieldException, NoSuchMethodException {
		Class<FieldTest> clazz = FieldTest.class;

		Field fi = clazz.getDeclaredField("i");
		Field fs = clazz.getDeclaredField("s");
		Field fmap = clazz.getField("map");

		FieldTest ft = new FieldTest(1,"test");

		//常用方法
		p(fi.get(ft));
		p(fs.get(ft));

		fi.set(ft,2);
		fs.set(ft,"change");

		p(ft);

		//获取泛型信息
		ParameterizedType mapMainType = (ParameterizedType) fmap.getGenericType();

		p(mapMainType.getRawType());

		Type[] types = mapMainType.getActualTypeArguments();
		for (int i = 0; i < types.length; i++) {
			System.out.println("第" + (i + 1) + "个泛型类型是：" + types[i]);
		}

	}

}

```

#### （5）`java.lang.reflect.Method`
**常用方法**
* `Object invoke(Object obj, Object... args)` 对带有指定参数的指定对象调用由此 Method 对象表示的底层方法。

**例子**
```java
package com.rectcircle.javaapi.lang.reflect;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/**
 * @author Rectcircle
 *         createTime 2017/5/17
 */
public class MethodTest {

	public static void p(Object o) { System.out.println(o); }

	private int i;
	private String s;


	public boolean sayHello(){
		System.out.println("Hello");
		return true;
	}

	public MethodTest(){}

	public MethodTest(int i, String s){
		this.s = s;
		this.i = i;
	}

	@Override
	public String toString() {
		return "ConstructorTest{" +
				"i=" + i +
				", s='" + s + '\'' +
				'}';
	}

	public static void main(String[] args) throws ClassNotFoundException, IllegalAccessException, InstantiationException, NoSuchFieldException, NoSuchMethodException, InvocationTargetException {
		Class<MethodTest> clazz = MethodTest.class;

		Method say = clazz.getMethod("sayHello");
		MethodTest mt = new MethodTest(1,"test");

		//常用方法
		boolean rt = (boolean) say.invoke(mt);
		p(rt);
	}

}

```
 



 



