---
title: java 参数传递
date: 2017-07-12T20:15:31+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/84
  - /detail/84/
tags:
  - java
---

### 示例代码
```java
class A {
	
	public int id;
	
	public static void main(String[] args) {
		
		A a = new A();
		a.id = 1;
		
		int aa = 1;
		a.changeInt(aa);
		System.out.println("int类型的值为："+aa);
		
		String ss = "a";
		a.changeString(ss);
		System.out.println("String类型的值为："+ss);
		
		
		a.changeObject(a);
		System.out.println("对象类型的值为："+a.id);
		
		a.changeObjectValue(a);
		System.out.println("对象类型的值为："+a.id);
		
	}
	
	public void changeInt(int a){
		a = 2;	
	}
	
	public void changeString(String s){
		s = "b";
	}
	
	public void changeObject(A a){
		a = new A();
		a.id = 2;
	}
	
	public void changeObjectValue(A a){
		a.id = 2;
	}
}
```

### 输出：
```
int类型的值为：1
String类型的值为：a
对象类型的值为：1
对象类型的值为：2
```

### 说明
* Java只有一种参数传递方式——按值传递（Java栈内的值）
* Java的栈存放8种基本数据类型的值和引用类型（简单这么理解、实际更复杂）
* 参数传递就是在栈内开辟一个新的空间将实参的值拷贝在这个空间内
* 所以：
	* 改变实参本身，不会影响实参
	* 改变实参所指向的值会影响实参

