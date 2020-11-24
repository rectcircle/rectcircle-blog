---
title: go指南
date: 2018-05-03T22:51:51+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/139
  - /detail/139/
tags:
  - 其他编程语言
---

> 参考
> [go官方文档](https://go-zh.org/)
> [go官方指南](https://tour.go-zh.org/)
> [相关源码](https://github.com/Go-zh/tour)
> [实效go编程](https://go-zh.org/doc/effective_go.html)

## 〇、go概述

***

### 1、go的开发者

Google

### 2、go的安装

#### （1）Ubuntu

可以使用`sudo apt install golang`

#### （2）Mac

```bash
brew install go
```

### 3、go的语言特性

* 静态类型语言
* C语言的加强版
    * 安全的指针
    * 易用的结构体
    * 自动内存管理
* 支持函数式编程、闭包
* 语法级别轻量级并发支持
* 支持面向接口编程
* 大量使用 特定的约定 代替 语法关键字
    * 访问控制
    * 实现接口方法即实现接口

### 4、相关实践

* [操作系统进程与资源管理](https://github.com/rectcircle/process-manage)

### 5、开发环境最佳实践

软件环境

* GO SDK
* VSCode

#### （1）下载安装SDK

略

#### （2）配置环境变量

Go和其他语言不一样，Go自己内置一个依赖管理工具，依赖包本地仓库不区分全局和项目，统一放在GOPATH环境变量下（工作空间）。

最好的做法就是就是所有Go的代码都放在单个工作空间。

若想将工作空间和依赖代码分开，按照如下方法配置环境变量：

```bash
export GOROOT=/usr/local/go
GOLIB=/Users/sunben/Workspace/go-lib
GOLEARN=/Users/sunben/Workspace/learn/go
GOWORKSPACE=/Users/sunben/Workspace/project/go
export GOPATH=$GOLIB:$GOLEARN:$GOWORKSPACE
export PATH=$PATH:$GOROOT/bin:$GOLIB/bin:$GOLEARN/bin:$GOWORKSPACE/bin
```

* `GOLIB`为第三方依赖的存放位置
* `GOLEARN`和`GOWORKSPACE`为其他工作空间，可以有多个

#### （3）配置开发工具

* 下载VSCode
* 安装Go插件
* 使用VSCode打开上面工作空间

## 一、go基础

***

### 1、包、变量、类型和函数

#### （1）包与导入

**基本说明**

* go源代码文件以package的形式组织，源码码文件以`.go`结尾
* 每个源代码文件开头必须包含`package 包名`的声明
* 在其他文件中使用某个包的函数或结构必须先使用`import "包所在的目录"`，然后使用`包名.导出内容`使用
    * `"包所在的目录"`可以是相对环境变量`$GOROOT`或者`$GOPATH`的相对路径，也可以是类似于`./`或者`/path/to/`的绝对路径
    * 同一个目录下go源代码文件的`包声明`必须相同且`导出名`不允许相同，否则编译报错
    * 在不同的目录下可以包含同一个`包声明`的文件，若`导出名`冲突可以使用导入重命名
* 每个源文件允许包含一个`init`函数在`import`时调用
* 程序入口所在源文件的包名必须为`main`，入口函数为`main`

**语法**

声明包

```go
package 包名
```

导入包

```go
//单条语句
import "包所在路径1"
import 别名 "包所在路径2"
import . "包所在路径3"  //.表示导入的内容不使用包名前缀就可以直接使用
import _ "包所在路径4"  //_表示不导入包，仅执行init函数

//组合导入
import(
	"包所在路径1"
	别名 "包所在路径2"
	. "包所在路径3"
	import _ "包所在路径4"  //_表示不导入包，仅执行init函数
)
```

**导出名**

* go中没有访问控制符
* 所有首字母大写的内容（函数或结构）将会导出（public公有），外部可以导入后通过包名访问
* 所有首字母小写的内容（函数或结构）将不会导出（private私有），外部无法访问

**例子**

定义包与导入

```go
package main

import (
	"fmt"
	"math"
)

func main() {
	fmt.Printf("Now you have %g problems.", math.Sqrt(7))
}
```

导出名

```go
package main

import (
	"fmt"
	"math"
)

func main() {
	fmt.Println(math.pi) //报错
}
```

**最佳实践**

* 报名应该与包所在目录同名，否则容易造成误解
* 避免使用`.`导入，`.`可能导致命名冲突

**更多内容**

[如何使用Go编程](https://go-zh.org/doc/code.html)

#### （2）函数

**综述**

* 支持多值返回
* 支持返回命名
* 支持函数类型（函数是一等公民）
* 支持闭包

**语法**

```go
func function_name( [parameter list] ) [return_types] {
	//函数体
}
```

**例子**

```go
func add(x int, y int) int {
	return x + y
}

func add(x, y int) int { //参数简写
	return x + y
}

//多值返回
func swap(x, y string) (string, string) {
	return y, x
}

//返回命名
func split(sum int) (x, y int) { //返回的值在此声明，函数结束后自动返回其值
	x = sum * 4 / 9
	y = sum - x
	return
}

// 斐波纳契数闭包
// fib 返回一个函数，该函数返回连续的斐波纳契数。
func fib() func() int {
	a, b := 0, 1
	return func() int {
		a, b = b, a+b
		return a
	}
}
```

**最佳实践**

* 使用多值返回特性返回错误信息
* 使用多值返回返回下一个状态
* 使用命名返回提高代码可读性
* 使用Defer关闭资源，使相关代码更加集中

#### （3）变量与常量

**概述**

* 常量为编译期可知具体值的符号，且运行时不可修改
* 变量是运行时可知的符号，可修改
* 批量声明与初始化
* 未初始化的自动初始化为零值
* 自动类型推断
* `:=`函数局部变量，通过字面量自动类型推断的语法糖

**语法**

```go
//变量
var c, python, java bool //默认零值
var i, j int = 1, 2 //常规定义并初始化
k := 3 //等价与var k int = 3，只能在函数内使用
//块内
var (
	home   = os.Getenv("HOME")
	user   = os.Getenv("USER")
	gopath = os.Getenv("GOPATH")
)

//常量
//枚举常量
type ByteSize float64

const (
    // 通过赋予空白标识符来忽略第一个值
    _           = iota // ignore first value by assigning to blank identifier
    KB ByteSize = 1 << (10 * iota)
    MB
    GB
    TB
    PB
    EB
    ZB
    YB
)

const Pi = 3.14
```

#### （4）类型

**基本类型**

```go
bool

string

int  int8  int16  int32  int64
uint uint8 uint16 uint32 uint64 uintptr

byte // uint8 的别名

rune // int32 的别名
    // 表示一个 Unicode 码点

float32 float64

complex64 complex128
```

* int, uint 和 uintptr 在 32 位系统上通常为 32 位宽，在 64 位系统上则为 64 位宽。

**零值**

没有明确初始值的变量声明会被赋予它们的 零值。

零值是：

* 数值类型为 0，
* 布尔类型为 false，
* 字符串为 ""（空字符串）。

**类型转换**
不同于C，所有类型都需要类型转换

```go
var i int = 42
var f float64 = float64(i)
var u uint = uint(f)
```

**类型推导**

```go
var i int
j := i // j 也是一个 int

i := 42           // int
f := 3.142        // float64
g := 0.867 + 0.5i // complex128
```

#### （5）运算符

* 全功能C语言运算符

### 2、流程控制语句

#### （1）for循环

* 循环语句只有for一个关键字，可以完成C的for while功能
* 支持break，continue；同时支持break label，continue label（Java）
* 支持foreach
* 不支持do-while
* 大括号不可省略

**语法**

```go
//等价于C的for循环
for init; condition; post { }

//等价于C的while循环
for condition { }

//等价于C的for(;;){}
for {}

//foreach，遍历数组、字符串、slice、map
for key, value := range oldMap {
    newMap[key] = value
}
```

**例子**

```go
sum := 0
for i := 0; i < 10; i++ {
	sum += i
}

for key := range m {
	if key.expired() {
		delete(m, key)
	}
}

sum := 0
for _, value := range array {
	sum += value
}

//字符串遍历
for pos, char := range "日本\x80語" { // \x80 是个非法的UTF-8编码
	fmt.Printf("字符 %#U 始于字节位置 %d\n", char, pos)
}

// 反转 a
for i, j := 0, len(a)-1; i < j; i, j = i+1, j-1 {
	a[i], a[j] = a[j], a[i]
}
```

#### （2）if条件

* 具有C语言全功能的 `if - else if - else` 功能‘
* 支持初始化语句（类似于for的init部分）

**例子**

```go
func pow(x, n, lim float64) float64 {
	if v := math.Pow(x, n); v < lim {
		return v
	} else {
		fmt.Printf("%g >= %g\n", v, lim)
	}
	// 这里开始就不能使用 v 了
	return lim
}
```

**最佳实践**

* 在Go的库中，你会发现若 if 语句不会执行到下一条语句时，亦即其执行体 以 break、continue、goto 或 return 结束时，不必要的 else 会被省略。

```go
f, err := os.Open(name)
if err != nil {
	return err
}
d, err := f.Stat()
if err != nil {
	f.Close()
	return err
}
codeUsing(f, d)
```

#### （3）switch

* 功能上类似于C的switch
* 不需要为每条case写break，因为go默认是break的
* go的switch不需要一定是常量也不需要一定是整数
* 支持无条件的switch，功能类似于`if-elseif-else`但是更优雅
* 支持一个case语句多匹配
* 同样支持预赋值
* 支持类型选择

**例子**

```go
	switch os := runtime.GOOS; os {
	case "darwin":
		fmt.Println("OS X.")
	case "linux":
		fmt.Println("Linux.")
	default:
		// freebsd, openbsd,
		// plan9, windows...
		fmt.Printf("%s.", os)
	}

//无条件的switch
	switch {
	case t.Hour() < 12:
		fmt.Println("Good morning!")
	case t.Hour() < 17:
		fmt.Println("Good afternoon.")
	default:
		fmt.Println("Good evening.")
	}

//多值匹配
	switch c {
	case ' ', '?', '&', '=', '#', '+', '%':
		return true
	}
	return false

//类型选择
var t interface{}
t = functionOfSomeType()
switch t := t.(type) {
default:
	fmt.Printf("unexpected type %T", t)       // %T 输出 t 是什么类型
case bool:
	fmt.Printf("boolean %t\n", t)             // t 是 bool 类型
case int:
	fmt.Printf("integer %d\n", t)             // t 是 int 类型
case *bool:
	fmt.Printf("pointer to boolean %t\n", *t) // t 是 *bool 类型
case *int:
	fmt.Printf("pointer to integer %d\n", *t) // t 是 *int 类型
}
```

#### （4）defer

* 在函数中使用，修饰一条语句
* 那么这条语句将在函数返回之后，返回值赋值之前执行
* 可以使相关逻辑的语句更加内聚
* 多条defer语句将以栈顺序调用
* 多用于资源释放

**例子**

```go
package main

import "fmt"

func main() {
	defer fmt.Println("world")

	fmt.Println("hello")
}


package main

import "fmt"

func main() {
	fmt.Println("counting")

	for i := 0; i < 10; i++ {
		defer fmt.Println(i)
	}

	fmt.Println("done")
}

```

### 3、更多类型

#### （1）指针

* 类似与C语言的指针
* 安全的指针，不支持指针运算
* 支持多重指针
* 取址和解引用与C相似，但有时支持自动类型转换
* 一律使用`.`，不使用箭头`->`

**例子**

```go
//==普通指针==
var pointer *int;   //声明
pointer = new(int); //指向一个可用
*pointer = 3;
fmt.Println(*pointer);

//==多重指针==
var outer **int;
var inter *int;
inter = new(int);
*inter = 3;
outer = &inter;
// 地址一样
fmt.Println(inter);
fmt.Println(*outer);
// 值一样
fmt.Println(*inter);
fmt.Println(**outer);
```

**new**

* 常用于给指针进行初始化
    * 创建一块某类型可用内存并返回该内存的地址
    * 将指针指向改地址

```go
type SyncedBuffer struct {
	lock    sync.Mutex
	buffer  bytes.Buffer
}
p := new(SyncedBuffer)
```

#### （2）结构体

* 类似于C语言的结构体

**例子**

```go
type Vertex struct {
	X int
	Y int
}

var (
	v1 = Vertex{1, 2}  // has type Vertex
	v2 = Vertex{X: 1}  // Y:0 is implicit
	v3 = Vertex{}      // X:0 and Y:0
	p  = &Vertex{1, 2} // has type *Vertex
)

func main() {
	fmt.Println(Vertex{1, 2})

	v := Vertex{1, 2}
	v.X = 4
	fmt.Println(v.X)
}
```

**结构体与指针**

* 相对于C取消了`->`操作符或者说省略`*`，结构体指针使用`.`访问成员
* 针对指针类型参数，仍需要显示的取址符`&`
* 多重结构体指针任然需要`*`解引用
* 结构体的内存布局和C一致

```go
type Point struct{
    x int;
    y int;
};

func use_sturct( p *Point ){
    p.x = 100;
}

func main() {
	p := Point{1,2}
	use_sturct(&p)
	fmt.Println(p)

	fmt.Printf("%p\n", &p)
	fmt.Printf("%p\n", &p.x)
}
/*
输出：
{100 2}
0x10414020
0x10414020
*/
```

### （3）数组

* 传参时，按值传递（拷贝副本）
* 类似于Java，数组的长度是数组的一部分
* 最好使用切片
* 类型描述为：`[n]T`

**例子**

```go
	var a [2]string
	a[0] = "Hello"
	a[1] = "World"
	fmt.Println(a[0], a[1])
	fmt.Println(a)

	primes := [6]int{2, 3, 5, 7, 11, 13}
	fmt.Println(primes)
```

**数组与指针**

* 数组做参数时, 需要被检查长度.
* 变量名不等于数组开始指针!
* 不支持C中的`*(ar + sizeof(int))`方式的指针移动. 需要使用到unsafe包
* 如果p2array为指向数组的指针， `*p2array`不等于`p2array[0]`

例子1：编译报错

```go
func use_array(args [4]int){
    args[1] = 100;
}

func main() {
    var args = [5]int{1, 2, 3, 4, 5};
    use_array(args);
    fmt.Println(args);
}
```

例子2：数组是按值传递
输出 [1 2 3 4 5]

```go
func use_array(args [5]int){
    args[1] = 100;
}

func main() {
    var args = [5]int{1, 2, 3, 4, 5};
    use_array(args);
    fmt.Println(args);
}
```

例子3：数组名不是隐式指针
输出 [1 100 3 4]

```go
// 又长度检查, 也为地址传参
func use_array(args *[4]int){
    args[1] = 100;  //但是使用还是和C一致,不需要别加"*"操作符
}

func main() {
    var args = [4]int{1, 2, 3, 4};
    use_array(&args); // 数组名已经不是表示地址了, 需要使用"&"得到地址
    fmt.Println(args);
}
```

例子4：数组名指向的位置和数组首元素不一致
输出：
1040c128
10414020

```go
	var p2array *[3]int;
	p2array = new([3]int);
	fmt.Printf("%x\n", &p2array);
	fmt.Printf("%x\n", &p2array[0]);
```

#### （4）切片

* 类型描述为：`[]T`（类似于没有指定长度的数组）
* 切片保存了对底层数组的引用，修改可见
* 支持动态扩容，当前容量大小可以通过`cap([]T)`获得，表示底层数组的大小
* 有效元素的长度通过`len([]T)`获得
* 当对一个切点元素进行删减时，是进行了一次拷贝
* nil 切片的长度和容量为 0 且没有底层数组
* 可以通过make创建切片
    * `make([]T, len, cap)`
    * `make([]T, cap)` 等价于`make([]T, cap, cap)`
* 使用`append([]T, val, ...)`追加元素
* 使用`copy(dest []T, source []T)`创建拷贝
* 其他通过切片语法`[start:end]`和`s = append([]T, []T...)`实现

**例子**

```go
//通过数组获得
	primes := [6]int{2, 3, 5, 7, 11, 13}

	var s []int = primes[1:4]
	fmt.Println(s)
	fmt.Println(cap(s))
	fmt.Println(len(s))

//通过切片是对数组的引用
	arr := [4]int{1,2,3,4}
	fmt.Println(arr)

	a := arr[0:2]
	b := arr[1:3]
	fmt.Println(a, b)

	b[1] = 8888
	fmt.Println(a, b)
	fmt.Println(arr)
	c := append(a, 6,66,666)
	a[1] = 555
	fmt.Println(c)
	fmt.Println(a)
/* 输出
[1 2 3 4]
[1 2] [2 3]
[1 2] [2 8888]
[1 2 8888 4]
[1 2 6 66 666]
[1 555]
*/

//进行切片
	s := []int{2, 3, 5, 7, 11, 13}
	s = s[1:4]
	fmt.Println(s)
	s = s[:2]
	fmt.Println(s)
	s = s[1:]
	fmt.Println(s)
/*输出
[3 5 7]
[3 5]
[5]
*/

//通过make创建切片
	a := make([]int, 5)
	printSlice("a", a)

	b := make([]int, 0, 5)
	printSlice("b", b)

	c := b[:2]
	printSlice("c", c)

	d := c[2:5]
	printSlice("d", d)
/*输出
a len=5 cap=5 [0 0 0 0 0]
b len=0 cap=5 []
c len=2 cap=5 [0 0]
d len=3 cap=3 [0 0 0]
*/
```

#### （5）range

一般用于实现foreach

```go
var pow = []int{1, 2, 4, 8, 16, 32, 64, 128}

func main() {
	for i, v := range pow {
		fmt.Printf("2**%d = %d\n", i, v)
	}
}

func main() {
	pow := make([]int, 10)
	for i := range pow {
		pow[i] = 1 << uint(i) // == 2**i
	}
	for _, value := range pow {
		fmt.Printf("%d\n", value)
	}
}
```

#### （6）映射

例子

```go
//简介
type Vertex struct {
	Lat, Long float64
}

var m map[string]Vertex

func main() {
	m = make(map[string]Vertex)
	m["Bell Labs"] = Vertex{
		40.68433, -74.39967,
	}
	fmt.Println(m["Bell Labs"])
}

//文法

type Vertex struct {
	Lat, Long float64
}

var m = map[string]Vertex{
	"Bell Labs": Vertex{
		40.68433, -74.39967,
	},
	"Google": Vertex{
		37.42202, -122.08408,
	},
}

func main() {
	fmt.Println(m)
}

//===
type Vertex struct {
	Lat, Long float64
}

var m = map[string]Vertex{
	"Bell Labs": {40.68433, -74.39967},
	"Google":    {37.42202, -122.08408},
}

func main() {
	fmt.Println(m)
}

修改
func main() {
	m := make(map[string]int)

	m["Answer"] = 42
	fmt.Println("The value:", m["Answer"])

	m["Answer"] = 48
	fmt.Println("The value:", m["Answer"])

	delete(m, "Answer")
	fmt.Println("The value:", m["Answer"])

	v, ok := m["Answer"]
	fmt.Println("The value:", v, "Present?", ok)
}
```

#### （7）函数值

* 支持函数式编程的基础
* 函数可以作为参数值
* 函数可以返回值

```go
package main

import (
	"fmt"
	"math"
)

func compute(fn func(float64, float64) float64) float64 {
	return fn(3, 4)
}

func main() {
	hypot := func(x, y float64) float64 {
		return math.Sqrt(x*x + y*y)
	}
	fmt.Println(hypot(5, 12))

	fmt.Println(compute(hypot))
	fmt.Println(compute(math.Pow))
}
```

#### （8）闭包

**例子：斐波纳契闭包**

```go
package main

import "fmt"

// fib 返回一个函数，该函数返回连续的斐波纳契数。
func fib() func() int {
	a, b := 0, 1
	return func() int {
		a, b = b, a+b
		return a
	}
}

func main() {
	f := fib()
	// 函数调用按从左到右顺序求值。
	fmt.Println(f(), f(), f(), f(), f())
}
```

## 二、方法与接口

### 1、方法

* go没有类
* go使用方法（类似函数的语法），将自定义类型名（结构体或者别名）与函数绑定
* 这样就可以使用`类型变量.函数名调用`
* 方法就是函数，是一种语法糖
* 对于接收者参数，不管是指针还是值类型，调用时都使用`类型变量.函数名调用`，编译过程自动转换

#### （1）语法

```go
func (self T) method(args...) return_type... {
	//self.X ，访问self的成员
}
```

#### （2）例子

```go
//结构体
type Vertex struct {
	X, Y float64
}

func (v Vertex) Abs() float64 {
	return math.Sqrt(v.X*v.X + v.Y*v.Y)
}

func main() {
	v := Vertex{3, 4}
	fmt.Println(v.Abs())
}


//基础类型别名
type MyFloat float64

func (f MyFloat) Abs() float64 {
	if f < 0 {
		return float64(-f)
	}
	return float64(f)
}

func main() {
	f := MyFloat(-math.Sqrt2)
	fmt.Println(f.Abs())
}

//指针接收者
type Vertex struct {
	X, Y float64
}

func (v Vertex) Abs() float64 {
	return math.Sqrt(v.X*v.X + v.Y*v.Y)
}

func (v Vertex) Scale(f float64) {
	v.X = v.X * f
	v.Y = v.Y * f
}

func main() {
	v := Vertex{3, 4}
	v.Scale(10) //编译成(&v).Scale(10)
	p := &v
	p.Abs() //编译成(*v).Scale(10)
	fmt.Println(v.Abs())
}
```

### 2、接口

* 虽然go不支持类
* 但是支持面向接口编程
    * 声明一个接口类型，内部定义了一些函数声明
    * 针对一个类型，实现了接口定义的函数（方法）
    * 那么自然的说明该类型实现了该接口
        * 可以声明一个接口类型的变量，将具体类型赋给这个变量
        * 针对接口变量调用方法时，就会调用具体类型实现的方法
* 一种隐式实现，不需要关键字
* 若实现接口类型变量的值为nil，仍可以通过接口变量调用距离类型的方法，同样其值为nil（防止出现空指针异常）
* nil 接口值会引发运行时错误`panic`
* 空接口`interface{}`用于接收任意类型（类似于Java Object）

#### （1）语法

定义接口

```go
type I interface {
	M()
}
```

声明接口类型变量

```go
var i I
```

一个类型实现接口

```go
type T struct {
	S string
}

func (t *T) M() {
	fmt.Println(t.S)
}
```

使用接口变量调用该方法

```go
	i = &T{"Hello"}
	i.M()
```

#### （2）例子

```go
package main

import (
	"fmt"
	"math"
)

type I interface {
	M()
}

	type T struct {
		S string
	}

func (t *T) M() {
	if t == nil { //空指针检测
		fmt.Println("<nil>")
		return
	}
	fmt.Println(t.S)
}


type F float64

func (f F) M() {
	fmt.Println(f)
}

func main() {
	var i I

	i = &T{"Hello"}
	describe(i)
	i.M()

	i = F(math.Pi)
	describe(i)
	i.M()
}

func describe(i I) {
	fmt.Printf("(%v, %T)\n", i, i)
}
```

**空接口**

```go
func main() {
	var i interface{}
	describe(i)

	i = 42
	describe(i)

	i = "hello"
	describe(i)
}

func describe(i interface{}) {
	fmt.Printf("(%v, %T)\n", i, i)
}
```

#### （3）常用标准接口

**Stringer**

fmt 包中定义的 Stringer 是最普遍的接口之一。

```go
type Stringer interface {
    String() string
}
```

例子

```go
package main

import "fmt"

type Person struct {
	Name string
	Age  int
}

func (p Person) String() string {
	return fmt.Sprintf("%v (%v years)", p.Name, p.Age)
}

func main() {
	a := Person{"Arthur Dent", 42}
	z := Person{"Zaphod Beeblebrox", 9001}
	fmt.Println(a, z)
}
```

**error**

Go 程序使用 error 值来表示错误状态。

与 fmt.Stringer 类似，error 类型是一个内建接口：

```go
type error interface {
    Error() string
}
```

例子

```go
i, err := strconv.Atoi("42")
if err != nil {
    fmt.Printf("couldn't convert number: %v\n", err)
    return
}
fmt.Println("Converted integer:", i)
```

**Reader**

io 包指定了 io.Reader 接口，它表示从数据流的末尾进行读取。

```go
func (T) Read(b []byte) (n int, err error)
```

例子

```go
package main

import (
	"fmt"
	"io"
	"strings"
)

func main() {
	r := strings.NewReader("Hello, Reader!")

	b := make([]byte, 8)
	for {
		n, err := r.Read(b)
		fmt.Printf("n = %v err = %v b = %v\n", n, err, b)
		fmt.Printf("b[:n] = %q\n", b[:n])
		if err == io.EOF {
			break
		}
	}
}
```

**Image**

image 包定义了 Image 接口：

```go
package image

type Image interface {
    ColorModel() color.Model
    Bounds() Rectangle
    At(x, y int) color.Color
}
```

### 3、类型判断和转换

#### （1）类型断言

```go
t := i.(T)    //如果i是T类型，将i转换成T类型并赋给t，否则报错
t, ok := i.(T) //如果i是T类型，将i转换成T类型并赋给t，ok返回true；否则t=nil，ok=false
```

#### （2）类型选择

**语法**

```go
switch v := i.(type) {
case T:
    // v 的类型为 T
case S:
    // v 的类型为 S
default:
    // 没有匹配，v 与 i 的类型相同
}
```

**例子**

```go
package main

import "fmt"

func do(i interface{}) {
	switch v := i.(type) {
	case int:
		fmt.Printf("Twice %v is %v\n", v, v*2)
	case string:
		fmt.Printf("%q is %v bytes long\n", v, len(v))
	default:
		fmt.Printf("I don't know about type %T!\n", v)
	}
}

func main() {
	do(21)
	do("hello")
	do(true)
}
```

## 三、并发

***

### 1、Go程

Go 程（goroutine）是由 Go 运行时管理的轻量级线程。

#### （1）启动语法

```go
go f(x, y, z)
```

例子

```go
package main

import (
	"fmt"
	"time"
)

func say(s string) {
	for i := 0; i < 5; i++ {
		time.Sleep(100 * time.Millisecond)
		fmt.Println(s)
	}
}

func main() {
	go say("world")
	say("hello")
}
```

### 2、信道

通信方式，go提供了一种称为信道的通信方式，类似于消息队列

#### （1）语法

创建

```go
ch := make(chan int)
```

发送与接收

```go
ch <- v    // 将 v 发送至信道 ch。
v := <-ch  // 从 ch 接收值并赋予 v。
```

#### （2）特点

* 默认情况下，发送和接收操作在另一端准备好之前都会阻塞
* 可以使用带缓冲的信道，空取阻塞，满放阻塞
* 可以使用类似`v, ok := <-ch`的语法

#### （3）例子

```go
package main

import "fmt"

func sum(s []int, c chan int) {
	sum := 0
	for _, v := range s {
		sum += v
	}
	c <- sum // 将和送入 c
}

func main() {
	s := []int{7, 2, 8, -9, 4, 0}

	c := make(chan int)
	go sum(s[:len(s)/2], c)
	go sum(s[len(s)/2:], c)
	x, y := <-c, <-c // 从 c 中接收

	fmt.Println(x, y, x+y)
}
```

**带缓冲的信道**

```go
package main

import "fmt"

func main() {
	ch := make(chan int, 2)
	ch <- 1
	ch <- 2
	fmt.Println(<-ch)
	fmt.Println(<-ch)
}
```

### 3、Select、Range和Close

* 支持`v, ok := <-ch`语法，当ch关闭时，ok返回false
* 支持`for i := range c`语法，当i关闭时，跳出循环
* 支持使用select等待多个阻塞信道，当某个信道就绪，执行相关语句，并支持默认选项

#### （1）例子

```go
package main

import (
	"fmt"
)

func fibonacci(n int, c chan int) {
	x, y := 0, 1
	for i := 0; i < n; i++ {
		c <- x
		x, y = y, x+y
	}
	close(c)
}

func main() {
	c := make(chan int, 10)
	go fibonacci(cap(c), c)
	for i := range c {
		fmt.Println(i)
	}
}
```

select 语句

```go
package main

import "fmt"

func fibonacci(c, quit chan int) {
	x, y := 0, 1
	for {
		select {
		case c <- x:
			x, y = y, x+y
		case <-quit:
			fmt.Println("quit")
			return
		}
	}
}

func main() {
	c := make(chan int)
	quit := make(chan int)
	go func() {
		for i := 0; i < 10; i++ {
			fmt.Println(<-c)
		}
		quit <- 0
	}()
	fibonacci(c, quit)
}
```

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	tick := time.Tick(100 * time.Millisecond)
	boom := time.After(500 * time.Millisecond)
	for {
		select {
		case <-tick:
			fmt.Println("tick.")
		case <-boom:
			fmt.Println("BOOM!")
			return
		default:
			fmt.Println("    .")
			time.Sleep(50 * time.Millisecond)
		}
	}
}

```

### 4、锁

例子

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

// SafeCounter 的并发使用是安全的。
type SafeCounter struct {
	v   map[string]int
	mux sync.Mutex
}

// Inc 增加给定 key 的计数器的值。
func (c *SafeCounter) Inc(key string) {
	c.mux.Lock()
	// Lock 之后同一时刻只有一个 goroutine 能访问 c.v
	c.v[key]++
	c.mux.Unlock()
}

// Value 返回给定 key 的计数器的当前值。
func (c *SafeCounter) Value(key string) int {
	c.mux.Lock()
	// Lock 之后同一时刻只有一个 goroutine 能访问 c.v
	defer c.mux.Unlock()
	return c.v[key]
}

func main() {
	c := SafeCounter{v: make(map[string]int)}
	for i := 0; i < 1000; i++ {
		go c.Inc("somekey")
	}

	time.Sleep(time.Second)
	fmt.Println(c.Value("somekey"))
}

```

## 四、填坑

***

### 1、标准项目结构

参见[如何使用go编程](https://go-zh.org/doc/code.html)

### 2、关于类型别名的转换

当时用类型别名时，虽然底层表示的是同一类型，但是仍需要显示转换，使用`T(变量)`进行显示的转换

例子

```go
package main

import (
	"fmt"
)

type S1 string
type S2 S1

func main() {
	m := make(map[S2]string)
	s := "key"
	var s1 S1 = s //报错
	var s2 S2 = s1 //报错
	m[s] = "value" //报错
}

//修改后
package main

import (
	"fmt"
)

type S1 string
type S2 S1

func main() {
	m := make(map[S2]string)
	s := "key"
	var s1 S1 = S1(s)
	var s2 S2 = S2(s1)
	fmt.Println(s2)
	m[S2(s)] = "value"
}

```

### 3、跨平台编译（交叉编译）

#### （1）默认情况

编译结果为宿主机器相对应的可执行文件

#### （2）相关环境变量

* CGO_ENABLED 默认为1 CGO（在go中使用c语言）是否打开
    * 0 关闭
    * 1 打开
* GOOS 默认为宿主机操作系统 指定编译目标的操作系统
    * "linux"
    * "windows"
* GOARCH 默认为宿主机计算架构 宿主机计算架构
    * "386"
    * amd64

#### （3）查看环境变量

`go env`

[相关介绍](https://blog.csdn.net/u012210379/article/details/50443669)

#### （4）技巧——实现一个bash脚本

用于编译，防止在根目录

```bash
#!/usr/bin/env bash

package=main

export GOPATH=$(pwd)

export CGO_ENABLED=0

export GOOS=darwin
export GOARCH=386
go install $package

export GOOS=linux
export GOARCH=386
go install $package

export GOOS=windows
export GOARCH=386
go install $package

export GOOS=darwin
export GOARCH=amd64
go install $package

export GOOS=linux
export GOARCH=amd64
go install $package

export GOOS=windows
export GOARCH=amd64
go install $package
```

### 4、在线编译运行小工具

https://play.golang.org/
