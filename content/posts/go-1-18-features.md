---
title: "Go 1.18 新特性"
date: 2022-03-17T23:40:42+08:00
draft: false
toc: true
comments: true
tags:
  - go
---

> 官方文档：[Go 1.18 Release Notes](https://go.dev/doc/go1.18)

## 介绍

2022 年 3 月 15 日，Go 1.18 正式发布，Go 1.18 是一个非常重要的更新。Go 1.18 虽然发布了泛型、Fuzzing 测试和工作空间等重磅特性。但是仍提供了完全的 [Go 1 兼容性](https://go.dev/doc/go1compat)，也就是说，符合 [Go 1 兼容性](https://go.dev/doc/go1compat) 要求的代码均可直接使用 Go 1.18 编译。

本文整体参考如下官方文档，介绍与 Go 1.17 相比，Go 1.18 的新特性。

* [Go 1.18 Release Notes](https://go.dev/doc/go1.18)
* 泛型相关
    * [Tutorial: Getting started with generics](https://go.dev/doc/tutorial/generics)
    * [Type Parameters Proposal](https://go.googlesource.com/proposal/+/refs/heads/master/design/43651-type-parameters.md)
    * [Spec - Type parameter declarations](https://go.dev/ref/spec#Type_parameter_declarations)
    * [Spec - Type constraints](https://go.dev/ref/spec#Type_parameter_declarations)
    * [Spec - Interface types - General interfaces](https://go.dev/ref/spec#General_interfaces)
* Fuzzing 单元测试
    * [Tutorial: Getting started with fuzzing](https://go.dev/doc/tutorial/fuzz)
    * [Go Fuzzing](https://go.dev/doc/fuzz/)
    * [testing: add fuzz test support #44551](https://github.com/golang/go/issues/44551)
* 工作空间
    * [Tutorial: Getting started with multi-module workspaces](https://go.dev/doc/tutorial/workspaces)
    * [Go Modules Reference - Workspaces](https://go.dev/ref/mod#workspaces)
    * [Go Modules Reference - go work ... 命令](https://go.dev/ref/mod#go-work-init)
    * [Go cmd - Workspace maintenance](https://pkg.go.dev/cmd/go#hdr-Workspace_maintenance)
    * [Proposal: Multi-Module Workspaces in cmd/go](https://go.googlesource.com/proposal/+/master/design/45713-workspace.md#proposal-the-flag)

## 安装 Go 1.18

前往 [下载地址](https://go.dev/dl/) ，下载安装 Go 1.18。

## 实验代码

本文对应实验代码位于：[github rectcircle/go-1-18-feature](https://github.com/rectcircle/go-1-18-feature)

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
    * 需要传递类型参数，如果类型推断可以推断出类型时，可以忽略（类型推断）。
    * 普通参数的类型为类型参数时，只能使用类型符合该类型参数约束的变量调用该函数。
* 实例化`泛型类型`：需要传递类型参数。

### 类型参数

泛型的核心是类型参数的定义。和 C++ / Java 不同，Go 类型参数是通过方括号 `[]` 包裹的。

普通函数参数除了参数名外，还拥有类型声明类似。类型参数的构成也由两半部分组成：

* 类型参数名，一般为大写字母，如 `T`。
* 类型参数约束，必须是一个接口类型，更多关于类型参数约束，参见：[下文](#类型参数约束)。

在 Go 1.18 中，类型参数可以用于函数和类型定义中（注意，方法不支持）：

* 泛型函数 `func FunctionName[T Constraint](param T) { ... }`
* 泛型类型 `type TypeName[T Constraint] ...`

### 泛型函数

#### 定义泛型函数

包含类型参数列表的函数被称为泛型函数，下面有一些泛型函数的例子：

`01-generics/01-generic-function.go`

```go
package generics

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

注意，绝大多数情况下，Go 编译器可以通过函数参数推断出参数类型，则这个类型参数列表就可以省略（语法上 Java 的类型推断仍然需要些 `<>`，而 Go 语言不需要再写 `[]`），这种特性叫类型推断。

`01-generics/01-generic-function_test.go`

```go
package generics

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

和 Java / C++ 不同，在 Go 1.18 中，类型参数必须有一个显式的约束，且这个约束必须是一个接口类型 或者 类型约束字面量。

#### 允许任意类型的约束

很多场景，并不需要对泛型参数进行约束，换句话来说，这种约束就是允许任意类型。

因为类型参数约束必须是一个接口类型，所以这种允许任意类型的约束自然是可以通过空接口 `interface{}` 实现的。但是到处编写 `interface{}` 太过冗长，Go 1.18 添加了一个 `interface{}` 别名 [`any`](https://go.dev/ref/spec#Predeclared_identifiers)。可以简单的认为 `any` 和 `interface{}` 等价。

> 当然，`any` 的出现不仅仅对泛型编程有用，对简化冗长的 `interface{}` 非常有用。

关于 `any` 的使用，上文已给出例子，这里可用 `interface{}` 替代。

`01-generics/02-constraints.go`

```go
package generics

import (
	"fmt"
	"reflect"
)

// Print 打印切片的元素。
// Print 有一个类型参数 T，且有一个（非类型）普通参数 s，
// s 是一个为类型为类型参数 T 的切片。
func PrintInterface[T interface{}](s []T) {
	for _, v := range s {
		fmt.Println(v)
	}
}
```

`01-generics/02-constraints_test.go`

```go
package generics

import "fmt"

func ExamplePrintInterface() {
	// 使用一个 []int 参数调用 Print。
	// print有一个类型参数T，我们要传递一个[]int，
	// 所以通过 Print[int] 来向函数 Print 的类型参数 T 传递 int，作为其参数。
	// 此时函数 Print[int] 需要一个 []int 作为参数。
	PrintInterface([]int{1, 2, 3})
	// output:
	// 1
	// 2
	// 3
}
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
    * 【Go 1.18 新增】类型约束字面量
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

* **运行时接口**：只包含方法集的接口，这种接口可以作为类型参数的约束（`func F[T I](t I) ...`），也可以作为变量类型（`var a = I(nil)` 合法）。在语法上表现为，只使用 Go 1.17 语法的接口。换言之接口声明只包含如下元素：
    * 0 或 多个 方法声明
    * 0 或 多个 接口类型（嵌入的接口）
* **编译时接口**：专用于类型参数约束的接口，这种接口只可以作为类型参数的约束（`func F[T I](t I) ...`），不可以作为变量类型（`var a = I(nil)` 非法），即使用 Go 1.18 新增的语法特性的接口。换言之接口声明包含了如下类型约束字面量：
    * 约束为具体类型相同（嵌入的非接口类型）
    * 约束为底层类型相同（嵌入的使用新的前缀操作符 `~` 修饰的非接口类型）
    * 约束为类型联合（union）（非接口类型 或 使用新的前缀操作符 `~` 修饰的非接口类型 或不包含方法的编译时接口 的列表，该列表使用中缀操作符 `|` 分割)

不管是编译时接口还是运行时接口，都可以作为类型参数的约束。也就是说，在 Go 1.18 中，定义约束本质上定义的是接口。

#### 运行时接口约束

运行时接口就是 Go 1.17 就支持的普通接口，其可以作为类型参数的约束，参见下文示例：

`01-generics/02-constraints.go`

```go
package generics

// Stringer 是一个类型约束。约束为 Stringer 的类型参数意味着：该类型必须有一个 String 方法。
// 在泛型函数中，使用类型为该类型参数的参数，允许在该变量上调用 String 方法。
// （这定义了与标准库的 fmt.Stringer 类型相同的接口，实际代码可能会简单地使用 fmt.Stringer。）
type Stringer interface {
	String() string
}

// Stringify 在 s 的每个元素上调用 String 方法，
// 并返回结果
func Stringify[T Stringer](s []T) (ret []string) {
	for _, v := range s {
		ret = append(ret, v.String())
	}
	return ret
}
```

`01-generics/02-constraints_test.go`

```go
package generics

import (
	"fmt"
	"strings"
)

func ExampleStringify() {
	a, b, c := &strings.Builder{}, &strings.Builder{}, &strings.Builder{}
	a.WriteString("a")
	b.WriteString("b")
	c.WriteString("c")
	fmt.Println(Stringify([]*strings.Builder{a, b, c}))
	// output:
	// [a b c]
}

```

#### 编译时接口约束

##### 约束为具体类型

语法为：嵌入的非接口类型。

语义为：被约束的参数必须是该类型，即

* 允许：类型相同
* 允许：该具体类型的类型别名
* 不允许：类型不同，底层类型不同是

单独使用该语法，对于开发者而言基本上没有任何意义。

具体参见下方示例：

`01-generics/02-constraints.go`

```go
package generics

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

`01-generics/02-constraints_test.go`

```go
package generics

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
package generics

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

`01-generics/02-constraints.go`

```go
package generics

// MyUint 定义一个类型约束，表示被约束参数的底层类型必须是 uint
type MyUint interface {
	~uint
}

// IntAdd2 底层类型为 uint 的两个变量相加
func UintAdd2[T MyUint](x, y T) T {
	return x + y
}
```

`01-generics/02-constraints_test.go`

```go
package generics

import "fmt"

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

`01-generics/02-constraints.go`

```go
package generics

// MyIntWithAddAddOne 定义一个类型约束，表示被约束参数的底层类型必须是 int，且包含一个 Add 方法
type MyIntWithAdd interface {
	~int
	Add(int) int
}

func MyIntWithAddAddOne[T MyIntWithAdd](x T) int {
	return x.Add(1)
}
```

`01-generics/02-constraints_test.go`

```go
package generics

import "fmt"

type MyIntAddType int

func (a MyIntAddType) Add(b int) int {
	return int(a) + b
}

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

`01-generics/02-constraints.go`

```go
package generics

import (
	"fmt"
	"reflect"
)

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

`01-generics/02-constraints_test.go`

```go
package generics

import "fmt"

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

union 不允许是包含方法的接口类型

`01-generics/02-constraints.go`

```go
package generics

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

`01-generics/02-constraints.go`

```go
package generics

type MyInt interface {
	int
}

// 如下将报错

// cannot use interface MyInt in conversion (contains specific type constraints or is comparable)
// https://pkg.go.dev/golang.org/x/tools/internal/typesinternal?utm_source%3Dgopls#MisplacedConstraintIface
var MyInt1 = MyInt(1)
```

#### 类型约束字面量

> [Spec - Type parameter declarations](https://go.dev/ref/spec#Type_parameter_declarations)

类型约束除了上文提到的是一个定义好的接口之外，也可以直接使用，字面量的形式，例如：

```go
[P any]
[S interface{ ~[]byte|string }]
[S ~[]E, E any]
[P Constraint[int]]
[_ any]
```

注意类型约束字面量不允许使用 `type` 定义为一个类型，即如下非法

```go
type Constraint ~int         // illegal: ~int is not inside a type parameter list
```

#### comparable 预定义约束

Go 1.18 添加一个新的预定义标识符 `comparable`，该标识符是一个用作类型参数约束的编译时接口，因此该标识符只能在类型参数约束中使用，无法作为变量参数类型。

哪些类型满足该标识符，参见 [Spec - Comparison operators](https://go.dev/ref/spec#Comparison_operators)。

`01-generics/02-constraints.go`

```go
package generics

func Equals[T comparable](a, b T) bool {
	return a == b
}
```

`01-generics/02-constraints_test.go`

```go
package generics

import "fmt"

func ExampleEquals() {
	fmt.Println(Equals(1, 2))
	// fmt.Println(Equals([]int{1}, []int{2})) //  切片不可比较
	fmt.Println(Equals([1]int{1}, [1]int{2})) // 长度相同数组可比较
	// output:
	// false
	// false
}
```

#### 从逻辑组合角度看

（1）类型参数约束总的来看支持 `与` 和 `或` 两种逻辑运算来将具体约束元素进行组合。比如想实现一个约束 `comparable & (int | uint)`，此时语法为：

```go
type ComparableInt interface {
    comparable
    int | uint
}
```

因此，接口声明中的每一行通过 `与` 逻辑运算组合，`或` 运算通过在每一行中通过 `|` 标识符组合。

（2）约束元素，支持如下几种约束元素：

* 方法（不支持 `或` 运算）
* 具体非接口类型
* 非接口底层类型

（3）根据（1）（2）可以得知，Go 的类型约束的表达能力为（启用 `|&` 表示都可以与或都可以）：

```
方法0~n个相互与 & ( 具体非接口类型0~n个相互与or或 |& 非接口底层类型0~n个相互与or或)
```

### 函数体中使用被类型参数约束的参数

在函数体中，我们需要对函数体进行操作。普通函数参数的操作直接根据函数类型就可以判断出可以做哪些操作，比如：

* `(a int)` 就可以对 a 参数进行算数运算操作
* `(s fmt.Stringer)` 就可以调用 `s` 的 `String` 方法

对于通过类型参数约束的函数参数，也是类似，编译器会检查对该参数的操作是否满足类型参数的约束，换句话枚举泛型参数的所有可能性，该操作都不可能出现未定义的情况。

* `[T any](a T)`，此时 `a` 就相当于 `interface{}`，如果想操作，就只能通过 `any(a)` 或 `interface{}(a)` 转换为 `interface{}` 类型然后通过反射操作，当然下面的所有场景也都可以这么干，但是泛型的目的之一就是减少运行时反射，并不推荐这么做。
* `[T fmt.Stringer](a T)`，相当于 `(s fmt.Stringer)`，就可以调用 `s` 的 `String` 方法。
* `[T uint | int](a, b T)`，`a` 和 `b` 类型都为 `T`，显然 `a` 和 `b` 可以进行算数运算。针对 `|` 运算，要求对参数的操作必须同时满足这两者的约束。
* `[T1, T2 int64 | int](a T1, b T2)`，`a` 和 `b` 类型约束都为 `int64 | int`，但是两者类型不同，因此直接进行算数运算，需要转换同一类型进行运算 `int64(a) + int64(b)`
* `[T StructA](a T)`，假设 `StructA` 是个结构体，拥有方法 `A()`，在 Go 1.18 中，是无法调用 `a.A()` 的，参见下文：[限制章节](#go-118-限制)
* `[T A1 | A2](a T)` ，假设类型 `A1` 和 `A2` 都拥有方法 `A()`，Go 1.18 中，是无法调用的 `a.A()` 的，参见下文：[限制章节](#go-118-限制)：

`01-generics/02-constraints.go`

```go
type (
	A1 struct{}
	A2 struct{}
)

func (A1) String() string { return "A1" }
func (A2) String() string { return "A2" }

// AString A1 和 A2 都拥有 String 方法，但是在 Go 1.18 中编译仍然报错
func AString1[T A1 | A2](x T) string {
	return x.String() // Error: x.String undefined (type T has no field or method String) https://pkg.go.dev/golang.org/x/tools/internal/typesinternal?utm_source=gopls#MissingFieldOrMethod
}

// 显式的声明方法， x.String() 才不会报错
func AString1[T interface {
	A1 | A2
	String() string
	// fmt.Stringer // 这个写法也行
}](x T,
) string {
	return x.String()
}
```

### 泛型类型

除了函数支持类型参数外，Go 1.18 中，类型也支持类型参数，语法为 `type TypeName[...] ...`。

#### 定义泛型类型

本部分源码位于 `01-generics/03-generic-types.go`。

下面是定义一个泛型的简单的示例：

```go
package generics

// Vector 是任何元素类型的切片。
type Vector[T any] []T

// Push 将元素添加到 Vector 的末尾。
func (v *Vector[T]) Push(x T) {
	*v = append(*v, x)
}
```

泛型类型允许引用，例如：

```go
package generics

// List 一个通用的链表类型
type List[T any] struct {
	next *List[T] // 引用自身
	val  T
}
```

泛型类型定义支持任意类型的定义，如接口，甚至指针。例如：

```go
// Adder 泛型接口
type Adder[T any] interface {
	Add(a, b T) T
}

// Object 泛型指针
type Object[T any] *T
```

注意，泛型类型的类型参数不支持直接替换，如下例子将报错：

```go
type T[P any] P // Error: cannot use a type parameter as RHS in type declaration https://pkg.go.dev/golang.org/x/tools/internal/typesinternal#MisplacedTypeParam
```

类型参数在类型声明中可以作为一个已定义的类型使用。可以作为，切片的元素类型，结构体字段的类型（上文已演示），此外还可以 Map 的键或者值类型，例如：

```go
type MyMap[K comparable, V any] map[K]V
```

#### 泛型类型的实例化

泛型类型的实例化表示，为类型参数指定具体一个类型。语法为 `GenericType[TypeName]`。

下面列了一些场景，源码位于 `01-generics/03-generic-types_test.go`。

(1) 可以通过 `type` 将泛型类型实例化为一个普通类型。（和普通类型类似，方法无法调用）。

```go
package generics

type VectorBool Vector[bool]

func ExampleVector() {
	// v0 := VectorBool{}
	// v0.Push(true) // Error: v0.Push undefined (type VectorBool has no field or method Push) https://pkg.go.dev/golang.org/x/tools/internal/typesinternal?utm_source=gopls#MissingFieldOrMethod
}
```

(2) 和普通类型类似，通过 `:=` 或 `var` 可以定义一个变量，也可以将泛型类型实例也支持嵌入其他结构体，此外通过反射获取到的类型名就是 `GenericType[TypeName]`。

```go
package generics

import (
	"fmt"
	"reflect"
)

// ...
type MyVectorBool struct {
	Vector[bool]
}

func ExampleVector() {
    // ...

	// 使用 := 实例化 Vector 为 Vector[int]
	// 此时 v1 的类型就是 Vector[int] 等价于 type Vector[int] []int ，把 Vector[int] 看成一个标识符
	v1 := Vector[int]{}
	v1.Push(1)
	v1.Push(2)
	v1.Push(3)
	fmt.Println(v1)
	_ = []int(v1) // 底层类型相同，可以这样转换
	fmt.Printf("v1 reflect: type = %s, kind = %s\n", reflect.TypeOf(v1), reflect.ValueOf(v1).Kind())

	// 使用 var 实例化 Vector 为 Vector[string]
	var v2 Vector[string]
	v2.Push("a")
	v2.Push("b")
	v2.Push("c")
	fmt.Println(v2)
	fmt.Printf("v2 reflect: type = %s, kind = %s\n", reflect.TypeOf(v2), reflect.ValueOf(v2).Kind())

	// 嵌入结构体
	v3 := MyVectorBool{}
	v3.Push(true)
	v3.Push(false)
	v3.Push(true)
	fmt.Println(v3)
	fmt.Printf("v3 reflect: type = %s, kind = %s\n", reflect.TypeOf(v3), reflect.ValueOf(v3).Kind())
	// output:
	// [1 2 3]
	// v1 reflect: type = generics.Vector[int], kind = slice
	// [a b c]
	// v2 reflect: type = generics.Vector[string], kind = slice
	// {[true false true]}
	// v3 reflect: type = generics.MyVectorBool, kind = struct
}

```

### 反射

Go 语言引入的反射并没有对反射库进行任何修改。

从这一点可以看出，Go 的泛型完全发生在编译阶段。

### 标准库

在 Go 1.18 中，Go 标准库没有为泛型进行相关改造（泛型是 Go 1 发布依赖最大的语言特性，官方比较谨慎，参见[issue](https://github.com/golang/go/issues/48918)）。相关内容还在实验阶段，相关实验库参见：

* [golang.org/x/exp/constraints](https://pkg.go.dev/golang.org/x/exp/constraints)
* [golang.org/x/exp/slices](https://pkg.go.dev/golang.org/x/exp/slices)
* [golang.org/x/exp/maps](https://pkg.go.dev/golang.org/x/exp/maps)

### Go 1.18 限制

* a. 类型参数不支持在方法中使用，官方**希望**在 Go 1.19 中支持。
* b. 类型参数不支持 `real`、`imag` 和 `complex` ，官方**希望**在 Go 1.19 中支持。
* c. 类型为类型参数的函数函数，只能调用接口中显式声明的参数，无法调用结构体的方法，官方**希望**在 Go 1.19 中支持。
* d. 类型为类型参数的函数函数，无法调用结构体的字段，官方**可能**在 Go 1.19 中支持。
* e. 不允许将类型参数及其指针形式嵌入到结构类型中。同样，不允许在接口类型中嵌入类型参数。官方目前还**不清楚**这些是否会在未来被允许。
* f. `|` 的类型联合，不允许接收包含方法的接口。官方目前还**不清楚**这些是否会在未来被允许。

实例参加下文

`01-generics/04-limit.go`

```go
package generics

import "fmt"

type A struct {
	B int
}

func (A) Print() { fmt.Println("a") }

// a. Error: method must have no type parameters
// func (a A) Print[T any](a T)  {
// 	fmt.Println(a)
// }

// b. Error: complex (built-in) is not a type
// func PrintComplex[T complex](a T) {
// 	fmt.Println(a)
// }

// c. Error: a.Print undefined (type T has no field or method Print)
// func PrintA[T A](a T) {
// 	a.Print()
// }
// c. Go 1.18 处理方式为手动声明方法
func PrintA[T interface {
	A
	Print()
}](a T,
) {
	a.Print()
}

// d. Error: a.B undefined (type T has no field or method B)
// func PrintB[T A](a T) {
// 	fmt.Println(a.B)
// }
// d. Go 1.18 处理方式为通过 any 转换
func PrintB[T A](a T) {
	fmt.Println(any(a).(A).B)
}

// e. Error: embedded field type cannot be a (pointer to a) type parameter
// type EmbeddedType[T any] struct {
// 	T
// 	A int
// }

// f. Error: cannot use fmt.Stringer in union (fmt.Stringer contains methods)
// func PrintString[T string | fmt.Stringer](s T) {
// }
```

### 泛型的实例

提案中，给了很多可以有意义的实例，参见，[提案 - 例子](https://go.googlesource.com/proposal/+/refs/heads/master/design/43651-type-parameters.md#examples)

* [Map/Reduce/Filter](https://go.googlesource.com/proposal/+/refs/heads/master/design/43651-type-parameters.md#map_reduce_filter)
* [Map keys](https://go.googlesource.com/proposal/+/refs/heads/master/design/43651-type-parameters.md#map-keys)
* [Sets](https://go.googlesource.com/proposal/+/refs/heads/master/design/43651-type-parameters.md#sets)
* [Sort](https://go.googlesource.com/proposal/+/refs/heads/master/design/43651-type-parameters.md#sort)
* [Channels](https://go.googlesource.com/proposal/+/refs/heads/master/design/43651-type-parameters.md#channels)
* [Containers](https://go.googlesource.com/proposal/+/refs/heads/master/design/43651-type-parameters.md#containers)
* [Append](https://go.googlesource.com/proposal/+/refs/heads/master/design/43651-type-parameters.md#append)
* [Metrics](https://go.googlesource.com/proposal/+/refs/heads/master/design/43651-type-parameters.md#metrics)
* [List transform](https://go.googlesource.com/proposal/+/refs/heads/master/design/43651-type-parameters.md#list-transform)
* [Dot product](https://go.googlesource.com/proposal/+/refs/heads/master/design/43651-type-parameters.md#dot-product)
* [Absolute difference](https://go.googlesource.com/proposal/+/refs/heads/master/design/43651-type-parameters.md#absolute-difference)

## Fuzzing 单元测试

Fuzzing 单元测试，即 case 单元测试。官方有详细的文档：

* [Tutorial: Getting started with fuzzing](https://go.dev/doc/tutorial/fuzz)
* [Go Fuzzing](https://go.dev/doc/fuzz/)

假设我们要写一个字符串翻转的函数，并向对这个函数进行随机输入测试，此时就可以使用 Fuzzing 单元测试。

使用 Fuzzing 单元测试时需要注意，由于测试输入是随机的，因此我们没法枚举出输出，只能通过一些测试函数的特性来编写测试程序。

在这个例子中，字符串翻转函数可以通过如下特征编写测试函数：

* 连续调用两次 `Reverse` 函数的输出和输入一致。
* 反转后的字符串将其状态保留为有效的 UTF-8。

`02-fuzzing/fuzzing.go`

```go
package main

import (
	"errors"
	"fmt"
	"unicode/utf8"
)

func main() {
	input := "The quick brown fox jumped over the lazy dog"
	rev, revErr := Reverse(input)
	doubleRev, doubleRevErr := Reverse(rev)
	fmt.Printf("original: %q\n", input)
	fmt.Printf("reversed: %q, err: %v\n", rev, revErr)
	fmt.Printf("reversed again: %q, err: %v\n", doubleRev, doubleRevErr)
}

func Reverse(s string) (string, error) {
	if !utf8.ValidString(s) {
		return s, errors.New("input is not valid UTF-8")
	}
	r := []rune(s)
	for i, j := 0, len(r)-1; i < len(r)/2; i, j = i+1, j-1 {
		r[i], r[j] = r[j], r[i]
	}
	return string(r), nil
}
```

编写 Fuzz 测试函数：

* 函数名以 `Fuzz` 开头，函数签名为 `func (f *testing.F)`.
* 调用 `f.Add(...)` ，提供默认情况下的测试样例，并告诉驱动器参数的类型。
* 调用 `f.Fuzz` 传递一个函数，该函数的声明为 `func(t *testing.T, ...)`，其中 `...` 和 上一步 `f.Add(...)` 的类型一致。
* 编写测试 case 即可

`02-fuzzing/fuzzing_test.go`

```go
package main

import (
	"testing"
	"unicode/utf8"
)

// go test -fuzz=Fuzz -fuzztime 2s -run ^FuzzReverse$ ./02-fuzzing
func FuzzReverse(f *testing.F) {
	// 1. 提供默认情况下的测试样例
	// 2. 告诉驱动器参数的类型
	testcases := []string{"Hello, world", " ", "!12345"}
	for _, tc := range testcases {
		f.Add(tc) // Use f.Add to provide a seed corpus
	}
	f.Fuzz(func(t *testing.T, orig string) { // 2~n 个参数需要和上面 f.Add 类型一致
		rev, err1 := Reverse(orig)
		if err1 != nil {
			return
		}
		doubleRev, err2 := Reverse(rev)
		if err2 != nil {
			return
		}
		if orig != doubleRev {
			t.Errorf("Before: %q, after: %q", orig, doubleRev)
		}
		if utf8.ValidString(orig) && !utf8.ValidString(rev) {
			t.Errorf("Reverse produced invalid UTF-8 string %q", rev)
		}
	})
}
```

运行测试函数：

* 普通运行，即只使用 `f.Add` 提供的测试样例：`go test  -run ^FuzzReverse$ ./02-fuzzing`
* 随机 case 运行，使用随机 case 进行测试：`go test -fuzz=Fuzz -fuzztime 2s -run ^FuzzReverse$ ./02-fuzzing`

请注意，模糊测试会消耗大量内存，并可能会影响机器运行时的性能。另外，模糊引擎在运行时会将扩展测试覆盖率的值写入 $GOCACHE/fuzz 中的模糊缓存目录。目前对可以写入模糊缓存的文件数或总字节数没有限制，因此可能会占用大量存储空间（可能为数 GB）。

## 工作空间

### 官方文档

* [go work 命令](https://pkg.go.dev/cmd/go#hdr-Workspace_maintenance)
* [Tutorial: Getting started with multi-module workspaces](https://go.dev/doc/tutorial/workspaces)
* [Go Modules Reference - Workspaces](https://go.dev/ref/mod#workspaces)

### 背景

在小型 Go 项目开发中，项目由两个部分组成：

* 一个项目代码仓库：即一个 Go Module，一般存储在一个 git 仓库。作为项目代码，本项目开发人员需要在该代码仓库上开发代码。
* 多个项目依赖：多个外部 Go Module，声明在项目代码 `go.mod` 文件中。作为项目的依赖，本项目开发人员不需要修改这些外部模块的代码，只需要管理这些依赖的版本。

此时，在本项目的开发人员的设备中，其项目代码结构如下所示：

```
.
├── dir1
├── dir2
├── dir3
├── ...
├── go.mod
└── go.sum
```

以上这种项目结构，存在一些问题：

1. 假设，在设计中，我们要求目录 dir2 单向依赖目录 dir1。但是在同一个 module 中，Go 编译器不能提供这种保证。在小型项目中，这种约束可以通过研发人员的意识进行约束，但是在大型项目中，没有工具层面的约束，是无法保证以上约束的。
2. 在中大型项目中的设计中，项目可以按照项目的特点划分成多个相互独立的部分，这些部分之间的依赖关系是一张有向无环图，这些部分在 Go 语言中对应的概念就是模块 (module)。
3. 某个项目是需要部分公开的，部分闭源的，此时我们就需要将项目拆分为多个部分，这些部分在 Go 语言中对应的概念就是模块 (module)。

为了解决上述问题，项目就会被拆成多个 module，此时我们的项目变成如下两个部分组成：

* 多个项目 module：这些 module 可能处于同一个 git 仓库，也可能处于不同的 git 仓库。作为项目代码，本项目开发人员完成一个 feature 可能需要编辑多个 module。
* 多个项目依赖：多个外部 Go Module，声明在项目代码 `go.mod` 文件中。作为项目的依赖，本项目开发人员不需要修改这些外部模块的代码，只需要管理这些依赖的版本。

此时，在本项目的开发人员的设备中，则需要一个工作空间目录来管理这些项目 module：

```
.
├── module1
│   ├── dir1
│   ├── dir2
│   ├── ...
│   ├── go.mod
│   └── go.sum
├── module2
│   ├── dir1
│   ├── dir2
│   ├── ...
│   ├── main.go
│   ├── go.mod
│   └── go.sum
└── ...
```

此时又带来了一个问题：假设一个需求，我们需要同时更改多 module。以上文结构为例，module2 依赖 module1，我们修改了 module1，在 module2 中 go 命令是看不到的这些变更的，因为 module2 看到到仍然是 module1 在代码仓库中的旧版本。

为了解决这个问题，我们可以使用 `go mod replace` 语法，以上文结构为例，module2 依赖 module1，此时我们需要在 `module2/go.mod` 目录下添加如下内容：

```gomod
replace module1全名 => ../module1
```

此时，在 module2 中 go 命令就可以看到磁盘中的 module1 目录的变更了（module2 作为依赖被其他 module 依赖时， `replace` 语句会被忽略，因此这个改动不会破坏下游使用者的依赖图）

replace 并没有完美的解决了问题，还存在如下问题：

1. 由于 go module 机制会忽略依赖的 `replace`，因此本项目依赖图上的所有节点的 go mod 文件都需要对其直接依赖和间接依赖的父节点添加 `replace`，在项目模块多的项目，维护这些 `replace` 成本比较高。比如 `c -> b -> a`，`e -> d -> b -> a`，此时：
    * `b` 的 `go.mod` 需要 replace `a`
    * `c` 的 `go.mod` 需要 replace `a`、`b`
    * `d` 的 `go.mod` 需要 replace `a`、`b`
    * `e` 的 `go.mod` 需要 replace `a`、`b`、`d`
2. 由于 go 命令只能包含够 `go.mod` 的目录下识别当前 module。因此如果想要执行 module2 的 main 函数，还需要手动 `cd module2`，然后再执行 `go run ./`，这十分麻烦。

### 概述

为了解决如上两个问题， `Go 1.18` 带来了 worksace 的概念。在文件系统中，go workspace 是一个包含 `go.work` 的目录，这个目录中包含多个 module 的目录。

引入 workspace 后，上文的目录结构编程了如下结构：

```
.
├── go.work
├── module1
│   ├── dir1
│   ├── dir2
│   ├── ...
│   ├── go.mod
│   └── go.sum
├── module2
│   ├── dir1
│   ├── dir2
│   ├── ...
│   ├── main.go
│   ├── go.mod
│   └── go.sum
└── ...
```

go.work 的内容如下：

```gowork
go 1.18

use (
	./module1
	./module2
    // ...
)
```

同时，删掉 `module2/go.mod` 的相关 `replace` 语句。

此时，上文提到的两个问题都得到了解决。

1. 存在复杂的依赖关系时，不需要在每个 module 的 `go.mod` 文件中编写 `replace` 语句了，只要在 `go.work` 中将所有的项目模块通过 `use` 语句声明即可。比如，比如 `c -> b -> a`，`e -> d -> b -> a`，我们只需要在 `go.work` 中添加：

    ```gowork
    use (
        ./a模块在本地的路径
        ./b模块在本地的路径
        ./c模块在本地的路径
        ./d模块在本地的路径
        ./e模块在本地的路径
    )
    ```

2. 只要是在 workspace 目录及其子目录中执行 go 命令，go 命令都会首先向上递归查找 `go.work` 文件，如果找到了，则会加载本地文件系统中对应的 module 目录，然后执行相关操作。因此如果想要执行 module2 的 main 函数，只需在 workspace 目录执行 `go run module2全名` 即可。

### 说明

#### go.work 文件

当前目录或祖先目录包含 `go.work` 文件时，表示开启当前目录处在一个 workspace 中。`go.work` 文件包含如下几个部分：

* `go version `，go 版本声明，如 `go 1.18`。
* `use ...`，需要加载的本地 module 目录，这些目录必须包含 `go.mod` 文件，如 `./module1`。
* `replace ...`，和 `go.mod` 中的 `replace` 类似，配置的是这个工作空间的 replace，会应用到工作空间下的所有模块。

#### go work 命令

> 参见 `go help work`

* `go work init [moddirs]` 初始化一个 workspace，即创建一个 `go.work` 文件，并将 `moddirs` 添加到 `use` 子句 下。
* `go work use [-r] [moddirs]` 将 module 目录添加到 `use` 子句下，目录下不存在 `go.mod` 将忽略，如果 `-r` 参数被指定，则递归搜索该目录下的所有 module 目录。
* `go work edit [editing flags] [go.work]` 编辑 `go.work` 文件。
* `go work sync` 说明参见，[官方文档](https://go.dev/ref/mod#go-work-sync)（没太理解这个命令的意义）。
    * 按照官方文档的说法：该命令会计算 workspace 构建列表，并将其写入 workspace 下的每个 module 的 `go.mod` 文件。
    * 实验观察下来，可能会发生如下现象：某些情况下，可能会生成一个 `go.work.sum` 文件。
    * 经过实验，`go work sync` 的作用可能是： 类似于 go mod tidy，如果使用 `go get -u` 更新了一个依赖的版本，`go work sync` 会批量更新该 workspace 下的所有的 在 `use` 中声明的所有的相关 module 的 `go.mod` 文件。但是 `go.sum` 可能更新行为和 `go mod tidy` 不一致，因为部分 `sum` 会存储在 `go.work.sum` 中。该命令主要来更新间接 `go.mod` 的间接依赖 （`// indirect`）和 `go.sum`。

### IDE 支持

[VSCode Go v0.32.0 - 8 Mar, 2022](https://github.com/golang/vscode-go/blob/master/CHANGELOG.md#v0320---8-mar-2022) 已完整支持了 `go.work` 。

### 示例

有两个 module：`util` 和 `hello` ，`hello` 依赖 `util`，`hello` 和 `util` 属于同一个工作空间。

```bash
mkdir 03-workspace
mkdir util hello
cd hello && go mod init github.com/rectcircle/go-1-18-feature/03-workspace/hello  && cd ..
cd util && go mod init github.com/rectcircle/go-1-18-feature/03-workspace/util  && cd ..
go work init ./hello ./util
```

更新 `03-workspace/hello/go.mod` 依赖，添加如下内容

```gomod
require github.com/rectcircle/go-1-18-feature/03-workspace/util v1.2.0
```

此时实例 workspace 就搭建完成了，使用 VSCode 打开即可进行开发，且编译时 `hello` 使用的就是本地磁盘的 `util` 的代码。

执行 go 命令是，可以直接在 `03-workspace` 目录通过 `go run github.com/rectcircle/go-1-18-feature/03-workspace/hello` 即可运行 main 函数，而不需要去 `hello` 目录。

发布是需要为 `util` 添加 `03-workspace/hello/go.mod` 声明的 `tag`，如果 `tag` 不对，`hello` 的下游依赖这将出现错误。

```bash
# 规划好版本号，03-workspace/hello/go.mod 的 对 util 的依赖的版本。
# git add commit  ...
git push
git tag 03-workspace/util/v1.2.0
git push --tags
```

发布完成后，在进行下一步开发前，可以执行 `go work sync`，更新一下相关 module 的 `go.mod` 文件。

### 最佳实践

#### 多仓场景

每个项目建议采用 1 + n 个仓库，即 1 个 workspace 开发仓库 和 n 个 module 仓库。

```
.                     // workspace 仓库
├── .git
├── go.work
├── module1           // 单独的 git 仓库，在 workspace 中是一个 git submodule
│   ├── .git
│   ├── dir1
│   ├── dir2
│   ├── ...
│   ├── go.mod
│   └── go.sum
├── module2           // 单独的 git 仓库，在 workspace 中是一个 git submodule
│   ├── .git
│   ├── dir1
│   ├── dir2
│   ├── ...
│   ├── main.go
│   ├── go.mod
│   └── go.sum
└── ...
```

#### 单仓场景

即 monorepo 模式，使用每个项目对应一个仓库，仓库里有多个 module。

```
.                     // 项目仓库
├── .git
├── go.work
├── module1           // 子目录
│   ├── dir1
│   ├── dir2
│   ├── ...
│   ├── go.mod
│   └── go.sum
├── module2           // 子目录
│   ├── dir1
│   ├── dir2
│   ├── ...
│   ├── main.go
│   ├── go.mod
│   └── go.sum
└── ...
```

推荐使用这种模式，这种模式同时支持 library 和 binary 开发。

如果 monorepo 存在会被外部依赖的 module，建议使用 `git tag` 来管理版本，且所有 module 同步更新版本号，防止混乱。此时发布的流程是：

* 更新本 monorepo 所有 module 所依赖的本 monorepo 下的模块的版本号，为本次要发布的版本号，如 `cd modulex && go mod edit -require=module全名@x.x.x`。
* 提交代码到远端仓库，注意，此时尚未发布。
* 为本 monorepo 所有 module 打  `git tag` 为本次版本号，如 `git tag modulex/vx.x.x`。
* 提交 tag 到远端 `git push --tags`。

如上流程少有繁琐，不过流程固定，可以写一个脚本自动化的执行。

注意

* 以上流程基本上没有问题，但是相关 module 间接依赖，更新会存在延迟（因为，只有 module 发布了，才能运行 go work sync 更新这些 module 的 go.mod，是个先有鸡还是先有蛋的问题）。但是并不影响将这些 module 作为 library 依赖的下游 module。原理参见博客：[Go 提升 - Go module - 高级话题](/posts/go-improve/#8-高级话题)
* 不要把 `go.work` 添加到 gitignore 中（`go.work.sum` 是否需要不确定）

## 其他

### 编译优化

* 添加新的 `GOAMD64` 环境变量以使用更新的指令集版本，参见：[Go Wiki](https://golang.org/wiki/MinimumRequirements#amd64)

### Go 命令

* `go get` 目前只用来修改 `go.mod` 文件，如果想安装二进制工具，需使用 `go install`

更多参见：[发行文档 - Go Comaand](https://go.dev/doc/go1.18#go-command)

### 其他更新

其他开发人员可能感知不明显的特性，参见：[发行文档](https://go.dev/doc/go1.18)
