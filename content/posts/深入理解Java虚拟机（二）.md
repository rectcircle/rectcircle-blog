---
title: 深入理解Java虚拟机（二）
date: 2018-07-23T16:57:50+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/158
  - /detail/158/
tags:
  - Java
---

## 目录

* [八、虚拟机字节码执行引擎](#八、虚拟机字节码执行引擎)
	* [2、运行时栈帧结构](#2、运行时栈帧结构)
	* [3、方法调用](#3、方法调用)
	* [4、基于栈的字节码执行引擎](#4、基于栈的字节码执行引擎)




## 八、虚拟机字节码执行引擎
***
### 2、运行时栈帧结构

栈帧是用于支持虚拟机进行方法调用和方法执行的数据结构，他是虚拟机栈的元素。存储了
* 局部变量表（大小编译期确定）
	* 以槽为单位（最小32位，可能64位，看实现）
	* 为了提高内存利用率，允许槽复用
	* 局部变量必须手动初始化
* 操作数栈（大小编译期确定）
	* 由于字节码是基于操作数栈的体系结构，所以特有此结构，相当于寄存器
	* 为了提高内存使用率，两个栈帧的操作数和局部变量表可能重合（发生调用时进行传参时，直接复用）
* 动态链接
* 方法返回信息

### 3、方法调用
* 解析
	* 在类加载阶段会将一部分符号引用转换为直接引用（编译器可知、运行期不可变），这一部分为：
		* 静态方法
		* 私有方法和final方法（非虚方法）
* 分派
	* 静态分派：方法重载（因为在编译时，类型已知）
	* 动态分派：方法重写，方法重写的字节码解析（`Person.say()`）
		* 将调用重写方法的实际引用放入操作数栈顶，记做C
		* 在C中查找方法，并进行检查（父类检查、权限检查）
		* `invokevirtual`将间接引用转换为直接引用，并执行
		* 实现：类似虚方法表的方式（重写的指向自己的方法，未重写的指向父类方法）
	* Java是一门：
		* 静态多分派（根据方法接受者和方法参数两者，确定方法引用）
		* 动态单分派（仅根据方法接受者确定）
		* 的语言


方法宗量：方法的接受者和方法的参数的统称


**JDK7动态语言的支持**
* 动态类型语言：类型检查的主体过程在运行期而不是在编译期（变量无类型而变量值才有类型）
* JDK7加入的`java.lang.invoke`提供了动态确定目标方法的机制

```java
package cn.rectcircle.jvmlearn.ch07;

import java.lang.invoke.MethodHandle;
import java.lang.invoke.MethodHandles;
import java.lang.invoke.MethodType;

public class InvokeLearn {
	static class ClassA {
		public void println(String s){
			System.out.println(s);
		}
	}

	public static void main(String[] args) throws Throwable {
		Object obj = System.currentTimeMillis() % 2 == 0 ? System.out:new ClassA();
		MethodHandle mh =  getPrintlnMethodHandle(obj);
		mh.invokeExact("Hello World!");
	}

	private static MethodHandle getPrintlnMethodHandle(Object obj) throws NoSuchMethodException, IllegalAccessException {
		MethodType mt = MethodType.methodType(void.class, String.class);
		return MethodHandles.lookup().findVirtual(obj.getClass(), "println", mt).bindTo(obj);
	}

}
```

* invokedynamic指令，的分派逻辑不是有虚拟机决定的，而是由程序员决定的，若想要jvm运行其他动态语言，可以自已实现一个分派逻辑，嵌入到字节码中即可

### 4、基于栈的字节码执行引擎

字节码是基于栈的指令集
* 可移植性高
* 效率较低
* 编译器实现简单
* 代码紧凑
* 指令数目多

