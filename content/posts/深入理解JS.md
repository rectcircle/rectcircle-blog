---
title: 深入理解JS
date: 2018-05-19T19:21:57+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/144
  - /detail/144/
tags:
  - 前端
---

> 纯属个人理解：以google v8引擎为例
> 仅讨论理论等价模型，实际上为了优化，可能实现并非如此，比如对基本数据类型做了本地处理

## 目录
* [1、JS原理与理念](#1、JS原理与理念)
* [2、JS对象如何产生](#2、JS对象如何产生)
* [3、内置类型与内置构造器](#3、内置类型与内置构造器)
* [4、对象属性查找过程](#4、对象属性查找过程)
* [5、实现面向对象的效果](#5、实现面向对象的效果)
* [6、this](#6、this)
* [7、GetterSetter](#7、GetterSetter)


### 1、JS原理与理念
* 在js中，一切实体都是`对象`（这个`对象`可以理解为类似与`{}`的键值对的结构）
* 一切对象都是由`构造函数`产生的（`new`操作），特别的：`构造函数`也是由`构造函数`产生的（基本类型构造函数除外）
* 其他所有语法概念都是以上两点的`语法糖`，也就是说，可以用以上方式模拟出来


### 2、JS对象如何产生
主要是new操作的执行过程（基本数据类型也类似这样，只是存在字面量而已）：
* 在内存中创建一个对象（在此记为`{}`）
* 执行构造函数（记为：`Constructor`），向`{}`填充值（对象变为`{key:value}`）
* 在这个对象中添加一个键值对`__proto__:Constructor.prototype`

最终对象结构如下：
```js
//执行
var obj = new Constructor(/*...*/)
//执行结构如下
var obj = {
	//构造函数设定的值
	__proto__:Constructor.prototype
}
```

#### （1）对于基本数据类型的创建效果上与上面一致
```js
//执行此语句
var n = 1
//等价于（基本等价，当然 === 返回false）
var n = new Number(1)
//结果
var n = {
	//值
	__proto__:Number.prototype
}
```

### 3、内置类型与内置构造器
以下展示的基本类型都是其构造函数，构造函数的基本结构为：
```js
Constructor = {
	//无法通过属性访问的代码
	prototype:{
		constructor:Constructor, //指向自己
		__proto__: afunc.prototype | null //除了Object为null之外，所有的都为某个函数的prototype
	},
	__proto__:Function.prototype //因为函数也是一个对象，所以也有一个__proto__，为构造出该类型的prototype，因为函数肯定是由函数构造出来的所以，为Function.prototype
}
```


#### （1）Object
**最重要的类型**
```js
Object = {
	//函数的内容，本地代码，用户不可见
	prototype:{
		constructor:Object,
		//众多方法
		__proto__:null //唯一 __proto__为null的函数
	},
	__proto__:Function.prototype
}
```

#### （2）Function
**最重要的类型之二**
```js
Function = {
	//函数的内容，本地代码，用户不可见
	prototype:{
		constructor:Function,
		//众多方法
		__proto__:Object //唯一 __proto__为null的函数
	},
	__proto__:Function.prototype
}
```


#### （3）Number
Number构造器如下
```js
Number = {
	//函数的内容，本地代码，用户不可见
	prototype:{
		constructor:ƒ Number()
		toExponential:ƒ toExponential()
		toFixed:ƒ toFixed()
		toLocaleString:ƒ toLocaleString()
		toPrecision:ƒ toPrecision()
		toString:ƒ toString()
		valueOf:ƒ valueOf()
		__proto__:Object.prototype
		[[PrimitiveValue]]:0
	},
	__proto__:Function.prototype
}
```

#### （4）String
String构造器如下
```js
String = {
	//函数的内容，本地代码，用户不可见
	prototype:{
		//众多方法
		__proto__:Object.prototype
		[[PrimitiveValue]]:""
	},
	__proto__:Function.prototype
}
```

#### （5）Boolean
略

#### （6）Undefined
略


### 4、对象属性查找过程
#### （1）一个例子
```js
var f = new Function('a','b','return a+b;');

f.toString()
```
f的内容
```js
f = {
	//内容
	prototype:{
		constructor:f
	}
	__proto__:{ //Function.prototype
		__proto__:{ //Object.prototype
			//...
			toString:f
		}
	}
}
```

* 首先搜索对象f的内容，是否存在toString成员
* 不存在，再搜索`__proto__`的属性，
* 不存在，再搜索`__proto__.__proto__`的属性
* 依次类推，直到null为止


### 5、实现面向对象的效果
#### （1）实现一个类
**要求**
* 每个对象，都有自己独立的成员变量
* 所有对象，共享成员函数和类变量

**实现**
```js
//类定义
function Person(firstname, lastname, age, eyecolor) {
    this.firstname = firstname;
    this.lastname = lastname;
    this.age = age;
    this.eyecolor = eyecolor;
}

Person.prototype.description = "人类，一种哺乳动物" //这种方式就可以实现一个所有对象共享的属性（静态变量）
Person.prototype.sayHello = function () { //这种方式就可以实现一个成员函数
    console.log("Hello, My name is "+this.firstname); 
}

//生成实例
var bill = new Person("Bill", "Gates", 56, "blue");
var steve = new Person("Steve", "Jobs", 48, "green");
console.log(bill.description === steve.description); //true
bill.sayHello(); //Hello, My name is Bill
console.log(bill.sayHello === steve.sayHello); //true
```

**结构**
```js
Person = {
	//代码
	prototype : {
		description:"人类，一种哺乳动物",
		constructor:Person,
		__proto__:Object.prototype
	},
	__proto__:Function.prototype
}

bill = {
	age:56,
	eyecolor:"blue",
	firstname:"Bill",
	lastname:"Gates",
	__proto__:Person.prototype
}
```

#### （2）实现继承
* 子类可以访问父类的成员函数、成员变量

```js
//继承
function Animal(type) {
    this.type = type;
}

Animal.prototype.sayType = function () {
    console.log("I'm a "+this.type);
}

function Cat(name, color) {
    Animal.apply(this, ["cat"]);
    this.name = name
    this.color = color;
}

// Cat.prototype.__proto__ = Animal.prototype //不推荐，这并不是标准，下面是等价实现

var F = function () {};
F.prototype = Animal.prototype;
Cat.prototype = new F();
Cat.prototype.constructor = Cat;


Cat.prototype.sayName = function () {
    console.log("My name is "+this.name);
}

var c = new Cat("hua", "blank");
c.sayType();
c.sayName();
```

结构如下：
```js
c = {
	color:"blank",
	name:"hua",
	type:"cat",
	__proto__:{ //是上面的F.prototype=Animal.prototype，如下
		constructor:Cat,
		sayName:f,
		__proto__:{ //Animal.prototype;
			constructor:Animal,
			sayType:f,
			__proto__:Object.prototype
		}
	}
}
```


### 6、this
this指向调用者对象
#### （1）纯粹函数调用
```js
x = 0
function test() {
    this.x = 1;
    console.log(this.x);
}

test(); // 1
console.log(x); //1
```
因此this就代表全局对象Global。

#### （2）作为对象方法的调用
```js
var o = {};
o.x = 0;
o.m = test;
o.m(); // 1
console.log(o.x); // 1
```
函数还可以作为某个对象的方法调用，这时this就指这个上级对象。

#### （3）作为构造函数调用
```js
var o = new test();
console.log(o.x); // 1
```

#### （4）`apply()`调用
apply()的参数为空时，默认调用全局对象，否则apply的第一个参数为this的指向
```js
var o = {};
o.x = 0;
test.apply(o)
console.log(o.x);
```


### 7、GetterSetter
* ES5新增 对象的get set
* 这样对属性的访问变为：
	* 先查找是否定义get、set访问器
	* 如果存在使用访问器
	* 如果不存在，直接找到对应的属性
* 可以将一个属性理解成一对默认的getset函数。读取，调用get；写入调用set，如果有同名，自定义的优先

例子
```js
var p = {
    name: "chen",
    work: function () {
        console.log("wording...");
    },
    age:10, //被覆盖，无法访问
    _age: 18, //按约定使用_开头，
    get age() {
        //return this.age; //无限递归，报错
        return this._age; 
    },
    set age(val) {
        if (val < 0 || val > 100) { //如果年龄大于100就抛出错误
            throw new Error("invalid value")
        } else {
            this._age = val;
        }
    }
};
console.log(p.name);
```

