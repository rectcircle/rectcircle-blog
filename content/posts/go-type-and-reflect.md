---
title: "深入理解 Go 类型系统和反射"
date: 2021-11-27T23:55:39+08:00
draft: false
toc: true
comments: true
tags:
  - golang
---

> 本文 Go 版本为 1.17

## 类型、值

在讨论一个 Go 语言的类型系统时一定要区分类型和值。

类型是通过 `type` 关键词创建的，是一种抽象性的描述，主要描述了内存布局、绑定的函数以及可访问性。

值是通过 `new`、`make`、`类型名{...}`、`类型名(...)` 创建的一种类型的具体实例，在运行时表现为一段连续的内存片段。

在纯静态语言中（如 C）、类型仅仅在编译时有效，编译后的运行时，所有类型信息均已丢失。

而在 Go 语言之类的有 Runtime / VM 的支持反射的语言中，类型信息在运行时也被保留了下来。在 Go 语言中，通过 `interface{}` 类型的值，可以获取到类型信息。

注意本文中的**值**的概念和传值传引用中的值不是一个概念，不要混淆。

## 涉及的源码位置

在 Go 的源码中，涉及到类型系统的部分有如下几个地方

* 反射包 `reflect`
* 运行时包 `runtime`

## 类型的数据结构

Go 语言的类型的数据结构由如下几个部分构成（源码位于：`runtime/type.go` 和 `reflect/type.go`）

1. `runtime._type` 所有类型都共有的属性，包含，内存大小
2. Determined by `runtime._type.kind` 由类型的类别决定
3. `runtime.uncommontype` 该类型的定义的包路径绑定的方法的指针和偏移量位置
4. func type of input and output, if runtime._type.kind is Func 当该类型类别为函数时，记录函数参数类型指针数组和返回类型指针数组
5. `[]runtime.method` （具体逻辑参考 `reflect.method`）该类型绑定的所有方法
   1. 前面为 Exported 方法
   2. 后面为 unExported 方法

## 类型的类别 (`Type.Kind`)

Go 语言中，所有的类型（包括自定义和内置类型）都可以划分为 26 种 Kind（在本文中翻译为类别）。定义在 `runtime/type.go` 和 `reflect/type.go`。

## 值的数据结构

Go 语言的不同类型的类别(`Type.Kind`)的数据结构是不同的，可以在 `reflect/value.go` 和 `runtime` 看到相关实现。在此仅列出几个简单的数据结构

```go
// reflect/value.go
type StringHeader struct {
	Data uintptr
	Len  int
}

type SliceHeader struct {
	Data uintptr
	Len  int
	Cap  int
}
```

## Go 常见类型及其值的实现

TODO [系列文章](https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzUyNTUwOTI4Ng==&action=getalbum&album_id=1937329367336943619&scene=173&from_msgid=2247484360&from_itemidx=1&count=3&nolastread=1#wechat_redirect)

### 数值类型 —— 以 int 为例

### 数组类型

### 字符串和切片类型

### map 类型

### 结构体类型

### 指针类型

### 函数类型

### 接口类型

## reflect API 详解

### reflect 类型 和 值

### reflect.TypeOf 和 reflect.ValueOf 原理

#### Go 语言函数传参数传递

在 Go 语言中，参数传递发生一次赋值或者类型转换操作（相关规则参见文章：[类型转换、赋值和值比较规则大全](https://gfw.go101.org/article/value-conversions-assignments-and-comparisons.html)）

#### 空接口值的数据结构

```go
// reflect/value.go
type emptyInterface struct {
	typ  *rtype          // 指向类型的数据结构
	word unsafe.Pointer  // 指向值的数据结构
}

// // 或者定义在 runtime/runtime2.go
// type eface struct {
// 	_type *_type
// 	data  unsafe.Pointer
// }
```

#### reflect.TypeOf 分析

```go
// reflect/type.go
func TypeOf(i interface{}) Type {
	eface := *(*emptyInterface)(unsafe.Pointer(&i))
	return toType(eface.typ)
}
```

* 调用 TypeOf 时，会将发生一个赋值操作，编译器会插入生成一个空接口值的逻辑，即 `emptyInterface` 的实例
* 获取到 `emptyInterface.typ` 并返回

#### reflect.ValueOf 分析

```go
// reflect/value.go
type Value struct {
	typ *rtype
	ptr unsafe.Pointer
	flag
}
type flag uintptr

func ValueOf(i interface{}) Value {}
```

* 调用 ValueOf 时，会将发生一个赋值操作，编译器会插入生成一个空接口值的逻辑，即 `emptyInterface` 的实例
* 构造 Value 结构体，前两个参数 `emptyInterface` 都有，然后根据情况构造 flag 即可

#### 接口赋值给空接口

设想这样一个例子：

```go
// https://play.studygolang.com/p/K3GkahbJ51E
package main

import (
    "reflect"
    "fmt"
)

type MyError struct {}
func (e MyError) Error() string {return "MyError"}

func main() {
    var e error = MyError{}
    fmt.Println(reflect.TypeOf(e)) 
    // output main.MyError
}
```

直觉上，应该返回 `error`。Go 的实现却是 `main.MyError`。也就是说 Go 的空接口指向的类型不可能是一个接口类型。

如果想获取到一个接口的反射类型或者值只能通过接口指针的方式获取：

```go
var ep *error = ...
reflect.TypeOf(ep)
reflect.ValueOf(ep)
```

### 类型 API

### 值 API
