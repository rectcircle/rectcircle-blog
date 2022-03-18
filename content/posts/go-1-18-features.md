---
title: "Go 1.18 新特性"
date: 2022-03-17T23:40:42+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> 官方文档：[Go 1.18 Release Notes](https://go.dev/doc/go1.18)

## 介绍

Go 1.18 是一个非常重要的更新。Go 1.18 虽然发布了泛型和工作空间等重磅特性。但是仍提供了完全的 [Go 1 兼容性](https://go.dev/doc/go1compat)，也就是说，符合 [Go 1 兼容性](https://go.dev/doc/go1compat) 要求的代码均可直接使用 Go 1.18 编译。

本文整体参考 [Go 1.18 Release Notes](https://go.dev/doc/go1.18) 文档。介绍与 Go 1.17 相比，Go 1.18 的新特性。

## 安装 Go 1.18

前往 [下载地址](https://go.dev/dl/) ，下载安装 Go 1.18。

## 泛型

> 官方提案：[Type Parameters Proposal](https://go.googlesource.com/proposal/+/refs/heads/master/design/43651-type-parameters.md)

### 概述

在语言特性方面，Go 1.18 带来了 Go 开发者期待已久的泛型。

* `泛型函数`：函数可以有一个使用方括号的附加的`类型参数列表`，这些`类型参数`可以被常规参数和函数体使用，包含`类型参数列表`的函数叫`泛型函数`。例如：`func F[T any](p T) { ... }`，从该例可以看出
    * 和 C++ / Java 不同，Go 类型参数是通过方括号 `[]` 包裹的。
    * 类型参数 `T` 被常规参数 `p` 使用，是 p 的类型。
* `泛型类型`：类型也可以有一个`类型参数列表`，包含`类型参数列表`的类型叫做`泛型类型`，例如：`type M[T any] []T`。
* `类型约束`：每个`类型参数`都有一个`类型约束`，类型约束必须是一个接口类型，如 `func F[T Constraint](p T) { ... }`。
* `any` 类型：新的预声明名称 `any` 表示，允许任何类型的类型约束。
* 被用作`类型约束`的接口类型：可以通过嵌入额外元素的方式，来限制某个`类型参数`必须是满足某些约束的集合，这些嵌入的元素可以是：
    * `T` 约束为具体类型 `T`
    * `~T` [底层类型](https://lingchao.xin/post/type-system-overview.html#%E6%A6%82%E5%BF%B5-%E5%BA%95%E5%B1%82%E7%B1%BB%E5%9E%8B)为 `T` 的所有类型
    * `T1 | T2 | ...` 表示为以 `|` 分割列出的的元素
* 调用`泛型函数`：
    * 需要传递类型参数，如果类型推断可以推断出类型时，可以忽略。
    * 普通参数的类型为类型参数时，只能使用类型符合该类型参数约束的变量调用该函数。
* 使用`泛型类型`：需要传递类型参数。

### 类型参数

泛型的核心是类型参数的定义。和 C++ / Java 不同，Go 类型参数是通过方括号 `[]` 包裹的。

普通函数参数除了参数名外，还拥有类型声明类似。类型参数的构成也由两半部分组成：

* 类型参数名，一般为大写字母，如 `T`。
* 类型参数约束，必须是一个接口类型，更多关于类型参数约束，参加[下文](#类型参数约束)。

在 Go 1.18 中，类型参数可以用于函数和类型定义中（注意，方法不支持）：

* 泛型函数 `func FunctionName[T Constraint](param T) { ... }`
* 泛型类型 `type TypeName[T Constraint] ...`

### 泛型函数

#### 定义泛型函数

包含类型参数列表的函数被称为泛型函数，下面有一些泛型函数的例子：

`01-generics/01-design/01-generics-function.go`

```go
package design

import "fmt"

// Print 打印切片的元素。
// Print 有一个类型参数 T，且有一个（非类型）普通参数 s，
// s 是一个元素类型为 T 的切片。
func Print[T any](s []T) {
	for _, v := range s {
		fmt.Println(v)
	}
}

// Print2 打印两个接片的元素
// Print 有两个类型参数 T1 和 T2，且有两个（非类型）普通参数 s1 和 s2，
// s1  是一个元素类型为 T1 的切片，s2  是一个元素类型为 T1 的切片。
func Print2[T1, T2 any](s1 []T1, s2 []T2) {
	Print(s1)
	Print(s2)
}


// Print2 打印两个接片的元素
// Print 有一个类型参数 T，且有两个（非类型）普通参数 s1 和 s2，
// s1, s2 都是一个元素类型为 T 的切片
func Print2Same[T any](s1 []T, s2 []T) {
	Print(s1)
	Print(s2)
}
```

#### 调用泛型函数

泛型函数的调用方式与普通函数的调用方式类似，区别在于在函数名后紧跟着一个类型参数列表。

注意，绝大多数情况下，Go 编译器可以通过函数参数推断出参数类型，则这个类型参数列表就可以省略（语法上 Java 的类型推断仍然需要些 `<>`，而 Go 语言不需要再写 `[]`）。

`01-generics/01-design/01-generics-function_test.go`

```go
package design

func ExamplePrint() {
	// 使用一个 []int 参数调用 Print。
	// print有一个类型参数T，我们要传递一个[]int，
	// 所以通过 Print[int] 来向函数 Print 的类型参数 T 传递 int，作为其参数。
	// 此时函数 Print[int] 需要一个 []int 作为参数。
	Print[int]([]int{1, 2, 3}) // 可以省略，int 类型参数。因为编译器可以从参数列表中推断
	// output:
	// 1
	// 2
	// 3
}

func ExamplePrint2() {
	Print2([]int{1, 2, 3}, []int{4, 5, 6})
	// output:
	// 1
	// 2
	// 3
	// 4
	// 5
	// 6
}

func ExamplePrint2Same() {
	Print2Same([]int{1, 2, 3}, []int{4, 5, 6})
	// output:
	// 1
	// 2
	// 3
	// 4
	// 5
	// 6
}
```

### 类型参数约束

和 Java / C++ 不同，在 Go 1.18 中，类型参数必须有一个显式的约束，且这个约束必须是一个接口类型。

https://pkg.go.dev/golang.org/x/tools/internal/typesinternal#MisplacedConstraintIface

#### 允许任意类型的约束

很多场景，并不需要对泛型参数进行约束，换句话来说，这种约束就是允许任意类型。

因为类型参数约束必须是一个接口类型，所以这种允许任意类型的约束自然是可以通过空接口 `interface{}` 实现的。但是到处编写 `interface{}` 太过冗长，Go 1.18 添加了一个 `interface{}` 别名 [`any`](https://go.dev/ref/spec#Predeclared_identifiers)。可以简单的认为 `any` 和 `interface{}` 等价。

> 当然，`any` 的出现不仅仅对泛型编程有用，对简化冗长的 `interface{}` 非常有用。

关于 `any` 的使用，上文已给出例子，这里可用用 interface{} 替代。

```go

```

#### 定义约束

在 Go 1.17 及之前，接口是**方法集合**的声明。由两个部分组成

* 0 或 多个 方法声明
* 0 或 多个 接口类型（嵌入的接口）

其 [EBNF](https://go.dev/ref/spec#Notation) 的[语法](https://go.googlesource.com/go/+/refs/tags/go1.17.8/doc/go_spec.html#1236)为：

```ebnf
InterfaceType      = "interface" "{" { ( MethodSpec | InterfaceTypeName ) ";" } "}" .
MethodSpec         = MethodName Signature .
MethodName         = identifier .
InterfaceTypeName  = TypeName .
```

在 Go 1.18，接口的语法和语义都得到的了扩充，即接口是**类型集合**的声明，由如下两个部分组成：

* 0 或 多个 方法声明
* 0 或 多个 类型集，可以分为两类
    * 嵌入的接口
    * 【Go 1.18 新增】类型约束
        * 嵌入的非接口类型
        * 嵌入的非接口类型的底层类型 (新操作符 `~`，参见下文)
        * 嵌入的任意类型（包含方法的接口除外）或 非接口类型的底层类型 的联合（union） (操作符 `|`，参见下文)

其 [EBNF](https://go.dev/ref/spec#Notation) 的[语法](https://go.googlesource.com/go/+/refs/tags/go1.18/doc/go_spec.html#1198)

```ebnf
InterfaceType  = "interface" "{" { InterfaceElem ";" } "}" .
InterfaceElem  = MethodElem | TypeElem .
MethodElem     = MethodName Signature .
MethodName     = identifier .
TypeElem       = TypeTerm { "|" TypeTerm } .
TypeTerm       = Type | UnderlyingType .
UnderlyingType = "~" Type .
```

Go 1.18 的接口，可以分为两类：

* **运行时接口**：只包含方法集的接口，这种接口可以作为类型参数的约束（`func F[T I](t I) ...`），也可以作为变量类型（`var a = I(nil)` 合法）。在语法上该类接口，只使用 Go 1.17 接口语法的接口。换言之接口声明只包含如下元素：
    * 0 或 多个 方法声明
    * 0 或 多个 接口类型（嵌入的接口）
* **编译时接口**：专用于类型参数约束的接口，这种接口只可以作为类型参数的约束（`func F[T I](t I) ...`），不可以作为变量类型（`var a = I(nil)` 非法），即使用 Go 1.18 新增的语法特性的接口。换言之接口声明包含了如下元素：
    * 约束为具体类型相同（嵌入的非接口类型）
    * 约束为底层类型相同（嵌入的使用新的前缀操作符 `~` 修饰的非接口类型）
    * 约束为类型联合（union）（非接口类型 或 使用新的前缀操作符 `~` 修饰的非接口类型 或不包含方法的编译时接口 的列表，该列表使用中缀操作符 `|` 分割)

不管是编译时接口还是运行时接口，都可以作为类型参数的约束。也就是说，在 Go 1.18 中，定义约束就是定义接口。

#### 运行时接口约束

运行时接口就是 Go 1.17 就支持的普通接口，其可以作为类型参数的约束，参见下文示例：

`01-generics/01-design/02-onstraints.go`

```go
package design

import "fmt"

// Print 打印切片的元素。
// Print 有一个类型参数 T，且有一个（非类型）普通参数 s，
// s 是一个为类型为类型参数 T 的切片。
func PrintInterface[T any](s []T) {
	for _, v := range s {
		fmt.Println(v)
	}
}
```

`01-generics/01-design/02-onstraints_test.go`

```go
package design

import "fmt"

// Print 打印切片的元素。
// Print 有一个类型参数 T，且有一个（非类型）普通参数 s，
// s 是一个为类型为类型参数 T 的切片。
func PrintInterface[T any](s []T) {
	for _, v := range s {
		fmt.Println(v)
	}
}
```

#### 编译时接口约束

##### 约束为具体类型

语法为：嵌入的非接口类型。

语义为：被约束的参数必须是该类型，即

* 允许：类型相同
* 允许：该具体类型的类型别名
* 不允许：类型不同，底层类型不同是

该语法在实现上，基本上没有任何意义。

具体参见下方示例：

`01-generics/01-design/02-onstraints.go`

```go
// MyInt 定义一个类型约束，表示必须是 int 类型
// 这约束就等价于 int，等于限定死类型参数必须是 int
type MyInt interface {
	int
}

// IntAdd2 两个 int 相加
// 这个函数声明完全等价于 func IntAdd2(x, y int) int
func IntAdd2[T MyInt](x, y T) T {
	return x + y
}
```

`01-generics/01-design/02-onstraints_test.go`

```go

func ExampleIntAdd2() {
	// 底层类型相同是不行的，如下两句会报错
	// type MyIntType int
	// fmt.Println(IntAdd2(MyIntType(1), MyIntType(2)))
	// 别名是可以的
	type MyIntAlias = int
	fmt.Println(IntAdd2(MyIntAlias(1), MyIntAlias(2)))
	fmt.Println(IntAdd2(1, 2))
	// output:
	// 3
	// 3
}
```

我们甚至可以构造出一种约束，这个约束不可能存在一个满足要求的类型。

```go
// MyIntString 定义一个需同时是 string 和 int 的类型约束
// 显然没有这种类型
type MyIntString interface {
	int
	string
}

// 这个函数不可能被调用，因为不可能存在既是 int 又是 string 的类型
func PrintMyIntString[T MyIntString](x T) {
	fmt.Println(x)
}

// MyIntWithAddOne 定义一个类型必须是 int 的类型约束，且包含一个 AddOne 方法
// 显然没有这种类型
type MyIntWithAddOne interface {
	int
	AddOne(int) int
}
```

##### 约束为底层类型相同

语法为：嵌入的使用新的前缀操作符 `~` 修饰的非接口类型。

语义为：被约束的参数和波浪线后面的类型的底层类型必须相同，即

* 允许：类型相同
* 允许：类型不同，底层类型不同是
* 允许：该具体类型的类型别名

关于底层类型概念，参见：[博客](https://lingchao.xin/post/type-system-overview.html#%E6%A6%82%E5%BF%B5-%E5%BA%95%E5%B1%82%E7%B1%BB%E5%9E%8B)

`01-generics/01-design/02-onstraints.go`

```go
// MyUint 定义一个类型约束，表示被约束参数的底层类型必须是 uint
type MyUint interface {
	~uint
}

// IntAdd2 底层类型为 uint 的两个变量相加
func UintAdd2[T MyUint](x, y T) T {
	return x + y
}
```

`01-generics/01-design/02-onstraints_test.go`

```go

func ExampleUintAdd2() {
	type MyIntType uint
	fmt.Println(UintAdd2(MyIntType(1), MyIntType(2)))
	type MyIntAlias = uint
	fmt.Println(UintAdd2(MyIntAlias(1), MyIntAlias(2)))
	fmt.Println(UintAdd2(uint(1), uint(2)))
	// output:
	// 3
	// 3
	// 3
}
```

该约束还是很有用的，设想一个库函数，这个函数要求传入一个参数，要求这个参数的底层类型为某个类型，且需要额外包含某些指定方法。

`01-generics/01-design/02-onstraints.go`

```go
// MyIntWithAddAddOne 定义一个类型约束，表示被约束参数的底层类型必须是 int，且包含一个 Add 方法
type MyIntWithAdd interface {
	~int
	Add(int) int
}

func MyIntWithAddAddOne[T MyIntWithAdd](x T) int {
	return x.Add(1)
}
```

`01-generics/01-design/02-onstraints_test.go`

```go

func ExampleMyIntWithAddAddOne() {
	fmt.Println(MyIntWithAddAddOne(MyIntAddType(1)))
	// output:
	// 2
}
```

##### 约束为类型联合（union）

语法为：一个使用中缀操作符 `|` 分割的列表，该列表每个元素是如下三种情况之一：

* 非接口类型
* 使用新的前缀操作符 `~` 修饰的非接口类型
* 不包含方法的编译时接口类型

语义为：被约束的参数需满足该被 `|` 分割的类型列表之一。

`01-generics/01-design/02-onstraints.go`

```go

// MyUnion 定义一个 Union 的类型约束，表示被约束参数的类型满足如下三者之一
// a) bool
// b) 底层类型和 int 相同
// c) MyUint，即 ~uint，底层类型和 uint 相同
type MyUnion interface {
	bool | ~int | MyUint
}

// PrintMyUnionAndType 打印 MyUnion 的类型和值
func PrintMyUnionAndType[T MyUnion](x T) {
	switch v := any(x).(type) {
	case bool:
		fmt.Printf("bool = %t\n", v)
	case int:
		fmt.Printf("int = %d\n", v)
	case uint:
		fmt.Printf("uint = %d\n", v)
	default:
		// 底层类型概念：https://lingchao.xin/post/type-system-overview.html#%E6%A6%82%E5%BF%B5-%E5%BA%95%E5%B1%82%E7%B1%BB%E5%9E%8B
		// 底层类型 issue： https://github.com/golang/go/issues/39574
		switch reflect.TypeOf(v).Kind() {
		case reflect.Int:
			fmt.Printf("~int = %d\n", v)
		case reflect.Uint:
			fmt.Printf("~uint = %d\n", v)
		default:
			fmt.Printf("dead code\n")
		}
	}
}
```

`01-generics/01-design/02-onstraints_test.go`

```go
func ExamplePrintMyUnionAndType() {
	type MyInt int
	type MyUint uint
	PrintMyUnionAndType(true)
	PrintMyUnionAndType(1)
	PrintMyUnionAndType(MyInt(1))
	PrintMyUnionAndType(uint(2))
	PrintMyUnionAndType(MyUint(1))
	// output:
	// bool = true
	// int = 1
	// ~int = 1
	// uint = 2
	// ~uint = 1
}
```

union 不允许是接口类型，也不允许是包含方法的编译时接口类型

`01-generics/01-design/02-onstraints.go`

```go
type MyIntWithAdd interface {
	~int
	Add(int) int
}

// 如下将报错

type MyUnionInvalidWithInterfaceHasMethod1 interface {
	// cannot use xxx.Stringer in union (fmt.Stringer contains methods)
	// https://pkg.go.dev/golang.org/x/tools/internal/typesinternal?utm_source%3Dgopls#InvalidUnion
	bool | fmt.Stringer
}

type MyUnionInvalidWithInterfaceHasMethod2 interface {
	// cannot use xxx.MyIntWithAdd in union (xxx.MyIntWithAdd contains methods)
	// https://pkg.go.dev/golang.org/x/tools/internal/typesinternal?utm_source%3Dgopls#InvalidUnion
	bool | MyIntWithAdd
}
```

##### 编译时接口的限制

编译时接口，仅能用于类型参数约束，不能作为变量参数类型。

`01-generics/01-design/02-onstraints.go`

```go
// type MyInt interface {
// 	int
// }

// 如下将报错

// cannot use interface MyInt in conversion (contains specific type constraints or is comparable)
// https://pkg.go.dev/golang.org/x/tools/internal/typesinternal?utm_source%3Dgopls#MisplacedConstraintIface
var MyInt1 = MyInt(1)
```

#### comparable 预定义约束

Go 1.18 添加一个新的预定义标识符 `comparable`，该标识符是一个用作类型参数约束的编译时接口，因此该标识符只能在类型参数约束中使用，无法作为变量参数类型。

哪些类型满足该标识符，参见 [Spec - Comparison operators](https://go.dev/ref/spec#Comparison_operators)。

`01-generics/01-design/02-onstraints.go`

```go
func Equals[T comparable](a, b T) bool {
	return a == b
}
```

`01-generics/01-design/02-onstraints_test.go`

```go

func ExampleEquals() {
	fmt.Println(Equals(1, 2))
	// fmt.Println(Equals([]int{1}, []int{2})) //  切片不可比较
	fmt.Println(Equals([1]int{1}, [1]int{2})) // 长度相同数组可比较
	// output:
	// false
	// false
}
```

### 泛型类型

Generic types

#### 定义泛型类型

#### 定义自引用的泛型类型

#### 泛型类型的实例化

### 类型推断

Type inference

### 类型参数**值**的使用

Using types that refer to themselves in constraints

Values of type parameters are not boxed

More on type sets

类型断言

### 反射

Reflection

### 限制

Methods may not take additional type arguments

https://cs.opensource.google/go/x/tools/+/master:internal/typesinternal/errorcode.go;drc=43f084e5936dab0669d82f29b31f5c4518e458ab;l=1426

### 实现推演

## 工作空间
