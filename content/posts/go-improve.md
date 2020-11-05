---
title: "Go 提升"
date: 2020-10-18T18:26:26+08:00
draft: false
toc: true
comments: true
tags:
  - 其他编程语言
---

> [实验代码](https://github.com/rectcircle/go-improve)

参考和书籍：

* [Golang 新手可能会踩的 50 个坑](https://segmentfault.com/a/1190000013739000)
* [Go 程序设计语言](https://docs.hundan.org/gopl-zh/)
* 《Go语言核心编程》

## 一、VSCode 开发环境

### 1、安装和配置

扩展商店，搜索 [golang.go](https://marketplace.visualstudio.com/items?itemName=golang.go) 并安装

配置 go 扩展依赖的工具链的 GOPATH，建议全局配置防止安装不同的 GOPATH 重复安装

```json
{
    "go.toolsGopath": "/path/to/gopath",
    "go.toolsEnvVars": {
        "GOBIN": "/path/to/gopath/bin",
    },
}
```

安装工具链 `>go: install/update Tools`，如果安装失败，请执行如下命名

```bash
# https://github.com/golang/vscode-go/blob/master/docs/tools.md
cd /path/to/gopath
export GOPATH=$(pwd)
go get -u -v github.com/mdempsky/gocode
go get -u -v github.com/uudashr/gopkgs/cmd/gopkgs
go get -u -v github.com/ramya-rao-a/go-outline
go get -u -v github.com/acroca/go-symbols
go get -u -v golang.org/x/tools/cmd/guru
go get -u -v golang.org/x/tools/cmd/gorename
go get -u -v github.com/cweill/gotests/...
go get -u -v github.com/fatih/gomodifytags
go get -u -v github.com/josharian/impl
go get -u -v github.com/davidrjenni/reftools/cmd/fillstruct
go get -u -v github.com/haya14busa/goplay/cmd/goplay
go get -u -v github.com/godoctor/godoctor
go get -u -v github.com/derekparker/delve/cmd/dlv
go get -u -v github.com/stamblerre/gocode
go get -u -v github.com/rogpeppe/godef
go get -u -v github.com/sqs/goreturns
go get -u -v golang.org/x/lint/golint
go get -u -v golang.org/x/tools/gopls
go get -u -v golang.org/x/tools/cmd/goimports
```

建议全局配置

```json
{
    "go.inferGopath": true, // 通过打开的项目目录推断 GOPATH，递归查找包含src的目录 （基于GOPATH模式生效，Go Module 无效）
    "go.useLanguageServer": true, // 启用 gopls 语言服务器，以支持 Go Module 模式项目
}
```

[其他配置](https://github.com/golang/vscode-go/blob/master/docs/settings.md)

* `go.gopath` 若不同项目有不同的 `GOPATH`，可用通过在工作空间的 `.vscode/settings.json` 配置，（不建议使用此配置，建议使用 `go.inferGopath` 配置）
* `go.addTags` 快速给结构体添加标签（比如 json 序列化时使用）一般默认即可
* `go.alternateTools` 特殊指定某个 该扩展 依赖的工具链 文件的路径
* `go.autocompleteUnimportedPackages` 默认值 false 在自动完成建议中包括未导入的软件包。
* `go.buildFlags` 构建参数，`go build` 或 `go test` 时的构建参数 (e.g. `["-ldflags='-s'"]`)
* `go.buildOnSave` 保存时构建
* `go.buildTags` 构建标签
* 代码覆盖率相关
    * `go.coverMode` 生成测试代码覆盖率时
    * `go.coverOnSave` 默认 false 是否在保存时运行测试代码覆盖率
    * `go.coverOnSingleTest` 默认 false， 如果为true，则在运行Go：光标命令的测试功能时显示测试覆盖率。
    * 略
* `go.delveConfig` delve 调试器相关选项
* `go.editorContextMenuCommands` 配置编辑器文件上下文菜单显示的命令
* `go.enableCodeLens` codelen配置
* 格式化相关选项 略
* 符号跳转相关配置 略
* 其他略

### 2、基于 GOPATH 的项目

* 设置 `go.inferGopath` 为 true
* 打开 git 目录即可（不用一定是 gopath）

[官方说明](https://github.com/golang/vscode-go/blob/master/docs/gopath.md)

### 3、基于 GO Modules 的项目

* 设置 `go.useLanguageServer` 为 true
* 设置 `go.formatTool` 为 `"goimports"`

[官方说明](https://github.com/golang/vscode-go/blob/master/docs/modules.md)

[语言服务器说明](https://github.com/golang/vscode-go/blob/master/docs/gopls.md)

### 4、功能特性

[参见](https://github.com/golang/vscode-go/blob/master/docs/features.md)

[调试](https://github.com/golang/vscode-go/blob/master/docs/debugging.md) 和 [调试适配器](https://github.com/golang/vscode-go/blob/master/docs/debug-adapter.md)

[常用命令](https://github.com/golang/vscode-go/blob/master/docs/commands.md)

## 二、Go Modules

> 版本：>= 1.11

Go Modules 是 Go1.11 版本引入的包管理技术。再此之前，Golang 官方没有提供包的版本管理，管理版本冲突的能力。在Go1.11引入，Go1.13稳定后，解决了此问题。

### 1、使用 Go Modules

> [参考](https://blog.golang.org/using-go-modules)

#### （1）创建

进入一个 Go 的工作目录 （该目录必须有src目录，不能使 `GOPATH`），并进入 src。执行如下命名初始化项目

```bash
mkdir -p github.com/rectcircle/go-improve
cd github.com/rectcircle/go-improve
go mod init github.com/rectcircle/go-improve
```

此时 `GOPATH` 的目录结构为

```
.
└── src
    └── github.com
        └── rectcircle
            └── go-improve
                └── go.mod
```

`src/github.com/rectcircle/go-improve/go.mod` 内容为

```go
module github.com/rectcircle/go-improve

go 1.15
```

#### （2）编写代码

使用 vscode 打开当前目录 `src/github.com/rectcircle/go-improve` 编写代码

创建一个 `util` 包位于 `src/github.com/rectcircle/go-improve/util` 路径。

编写代码 `util/stringutil.go`

```go
package util

import (
	"github.com/golang/example/stringutil"
)

// Reverse 返回一个翻转的字符串翻转字符串
func Reverse(str string) string {
	return stringutil.Reverse(str)
}
```

编写测试代码 `util/stringutil_test.go`

```go
package util

import "testing"

func TestReverse(t *testing.T) {
    input := "abc"
    want := "cba"
    if got := Reverse(input); got != want {
        t.Errorf("Reverse() = %s, want %s", got, want)
    }
}
```

编写 main 包

```go
package main

import (
	"github.com/rectcircle/go-improve/util"
	quote "rsc.io/quote"
	quotev2 "rsc.io/quote/v2"
	quotev3 "rsc.io/quote/v3"
)

func main() {
	println(util.Reverse("abc"))
	println(quote.Hello())
	println(quotev2.HelloV2())
	println(quotev3.HelloV3())
}
```

此时 `src/github.com/rectcircle/go-improve` 的目录结构为

```
.
├── go.mod
├── go.sum
├── main.go
└── util
    ├── stringutil.go
    └── stringutil_test.go
```

#### （3）测试运行代码

测试

```bash
go test ./util
```

运行

```bash
go run main.go
```

此时 生成了 `go.mod` 文件自动添加了 `github.com/golang/example` module 的依赖

```go
module github.com/rectcircle/go-improve

go 1.15

require github.com/golang/example v0.0.0-20170904185048-46695d81d1fa

```

并创建了 `go.sum` 文件

```
github.com/golang/example v0.0.0-20170904185048-46695d81d1fa h1:iqCQC2Z53KkwGgTN9szyL4q0OQHmuNjeoNnMT6lk66k=
github.com/golang/example v0.0.0-20170904185048-46695d81d1fa/go.mod h1:tO/5UvQ/uKigUjQBPqzstj6uxd3fUIjddi19DxGJeWg=
```

此时 Go 的工作目录的目录结构变为

```
.
├── pkg
│   ├── mod
│   │   ├── cache
│   │   │   ├── download
│   │   │   └── lock
│   │   ├── github.com
│   │   │   ├── !burnt!sushi
│   │   │   ├── golang
│   │   │   ├── google
│   │   │   └── sergi
│   │   ├── golang.org
│   │   │   └── x
│   │   ├── honnef.co
│   │   │   └── go
│   │   └── mvdan.cc
│   │       ├── gofumpt@v0.0.0-20200802201014-ab5a8192947d
│   │       └── xurls
│   └── sumdb
│       └── sum.golang.org
│           └── latest
└── src
    └── github.com
        └── rectcircle
            └── go-improve
```

可见依赖放置与 `pkg/mod` 目录下

#### （4）Go test 等命令简单分析

在 Go Modules 模式下（发现当前目录或者祖先目录下有 `go.mod` 文件），`go test`、`go run` 等命令将会自动的解决依赖，流程如下

* 解析源代码，检查导入的包所在的 module 在 `go.mod` 中是否有声明，若没有
    * go 命令将自动下载相关最新稳定版软件包，到 `pkg/mod` 目录下，通过 `GOPROXY` 下载
    * 更新 `go.mod` 和 `go.sum` 文件
* 运行响应的命令

`go list -m all` 将可以列出当前 go module 的所有依赖关系，在其输出中 `github.com/golang/example v0.0.0-20170904185048-46695d81d1fa` 为伪版本 模块，它是go命令对一个特定的无标记提交的版本语法。（也就是说，该模块没有 `go.mod`，为了兼容 `GOPATH` 方式的模块）

`go.sum` 是校验和

#### （5）更新依赖

```bash
# 查看模块版本列表
go list -m -versions rsc.io/sampler
# 安装最新版本模块
go get rsc.io/sampler
# 安装指定版本模块
go get rsc.io/sampler@v1.3.1
```

### 2、Module 版本

Go Module 版本采用[语义化版本号](https://semver.org/spec/v2.0.0.html)，格式为 `MAJOR.MINOR.PATCH`，例如 `v1.2.3`

* `MAJOR` 主版本号，允许存在不兼容
* `MINOR` 次要版本号，以向后兼容的方式添加功能时的版本
* `PATCH` 补丁版本号，向后兼容的 bug 修复

在 Go Module 中，代码交由 git 托管平台管理（github gitlab 等），因此其版本号与 git 中的一些概念对应，参见例子：[rsc.io/quote](https://github.com/rsc/quote)

* Go Module 中的版本号，对应 git 中的 tag，[例子](https://github.com/rsc/quote/tags)
* Go Module 中的 `MAJOR` 版本号因为不要求向前兼容，因此有如下规则
    * Go Module 中的 `MAJOR` 版本号对应 git 支持如下两种之一的
        * `master` 分支的 `vMARJOR` 目录，推荐使用该方式，该方式的支持给GOPATH方式项目依赖，[例子](https://github.com/rsc/quote/tree/master/v3)
        * `vMARJOR` 分支，[例子](https://github.com/rsc/quote/tree/v2)
    * Go Module 中的 `MAJOR` 为非 `v1` 版本的，必须修改 `go.mod` 中的 `module` 添加 vMARJOR 路径，例如
        * `v1` 的 `go.mod` 为 [`module rsc.io/quote`](https://github.com/rsc/quote/blob/master/go.mod)
        * `v2` 的 `go.mod` 为 [`module rsc.io/quote/v2`](https://github.com/rsc/quote/blob/v2/go.mod)

### 3、`pkg.go.dev` 等站点

类似 Java 的 Maven 中央仓库，目前处于 [MVP](https://en.wikipedia.org/wiki/Minimum_viable_product) 状态。

Go Module 引入了版本管理，但是 Golong 直接使用了 git 等托管代码，因此需要一个中央站点计算这些托管在各个代码仓库中的 Module，`pkg.go.dev` 就是这样的站点，有如下功能：

* 搜索、展示 Go Module 的元信息
* 提供 一个 代理服务器（`https://proxy.golang.org`） 来下载 Go Module
* 注册 Go Module、从代码仓库中解析 Go Module 的版本、校验和、Docs等元信息

除了 `pkg.go.dev` 外，为了支持 Go Module ， GO 提供了一系列环境变量和站点（[参考](https://zhuanlan.zhihu.com/p/111722890)）

* `GOPROXY=https://proxy.golang.org,direct`，`go get` 主要用于命令下载Module，此外，该站点是其他站点的核心：只要任意一个人通过 `go get` 等命令下载了该 Go Module，这个 Module 将会自动注册到 `pkg.go.dev`，各种元信息将被自动计算
    * 国内建议使用 https://goproxy.cn/，配置方式 `go env -w GOPROXY=https://goproxy.cn,direct`
* `GOPRIVATE` 表示那些站点的 Module 不走 `GOPROXY` 下载
* `GOSUMDB="sum.golang.org"` 校验和站点，用于保证不同环境下同一版本代码的一致性

更多参见

* https://studygolang.com/articles/26694?fr=sidebar
* https://zhuanlan.zhihu.com/p/86631181
* https://juejin.im/post/6844903954879348750#heading-29
* https://golang.org/cmd/go/#hdr-Remote_import_paths

### 4、Module、Package 和 File

* Module 是 Golang 的最小发布单元，与代码仓库一一对应，一般包含多个Package，包含版本概念
    * Module 的命名有一个强制的规则为 `{组织域名}/{group}/{project}` 例如 `github.com/rectcircle/go-improve`，go 会根据这个 module 名前往互联网下载代码
* Package 是 Golang 的功能集合，与目录一一对应，一般包含多个 File，注意其中包含的其他目录（其他 Package）和当前 Package 没有任何关系，是 import 的主要实例
* File 及代码文件，必须属于一个 Package，同一个目录下的 File 属于同一个 Package

### 5、Go Module 的核心文件 `go.mod`

`go.mod` 位于某个 Module 的根目录中，该文件一般由 `go` 命令自动更新不需要手动更改。可以配置如下几种属性

* `module` 当前模块名，一般格式为 `代码仓库域/名字空间/项目名`
* `go` 指定 `go` 版本
* `require` 依赖的其他 Module
* `exclude` 仅在当前module为main module时有效，明确声明不使用某个版本的Module
* `replace` 仅在当前module为main module时有效，依赖的模块重命名，如果 代码中 `be.replaced.com/golang/example` 使用的是，实际存放的位置是 `github.com/golang/example`，则：
    * `require be.replaced.com/golang/example v0.0.0-20170904185048-46695d81d1fa`
    * `replace be.replaced.com/golang/example v0.0.0-20170904185048-46695d81d1fa => github.com/golang/example v0.0.0-20170904185048-46695d81d1fa`

其他说明

* `go.mod` 和 `go.sum` 需要提交到 git 仓库
* `// indirect` 间接依赖注释，必须写上，否则 每次执行 命令 会被删除（比如 `go tidy`）

### 6、相关命令

[官方文档](http://golang.org/cmd/go)

* `go build`
* `go test`
* `go run`
* `go get` 更改依赖版本或者添加新的依赖
* `go mod tidy` 扫描代码，清理不需要的运行依赖，拉取缺少的以阿里
* `go mod graph` 打印依赖图，[插件](https://marketplace.visualstudio.com/items?itemName=xmtt.go-mod-grapher)（需 graphviz 和 dot 命令 `brew install graphviz`）
* `go mod why`
* `go list -m -json all` 依赖详情
* `go list -m all` 依赖详情简单模式
* `go list -m -version <pkg>` 查看包可用版本

### 7、Go Module 与 GOPATH

Go Module 和之前的 GOPATH 方式的依赖管理是兼容的。注意以下 `go env`

* `GO111MODULE` 默认为 `""` 及 `"auto"`，一个项目存在 `go.mod` 且 不在 `GOPATH` 路径下，则这个项目开启 GO Module 模式
* `GOPATH` 仍然需要，在 Go Module 模式下主要用来生成 `GOMODCACHE` 环境变量
* `GOMODCACHE` Go Module 下包下载缓存路径，默认为 `$GOPATH/pkg/mod`，Module 路径为 `{organization}/{group}/{project}@{version}`

因此建议配置 `GOPATH` 加入到系统环境变量

```bash
export GOPATH=xxx
export PATH=$PATH:$GOPATH/bin
```

## 三、Go 类型系统

> [博客1](https://blog.csdn.net/wohu1104/article/details/106202792)

### 1、命名类型和未命名类型

> [博客2](https://learnku.com/articles/38824)

Go 语言的变量的类型分为两种：命名类型和未命名类型（Named Type and Unnamed Type）

#### （1）命名类型

指有明确标识符的类型，又称为，包括

* 预声明类型（预声明类型、简单类型），共20个，包括布尔类型、整型（指针）、浮点型、复数、字符串、error接口
* 自定义类型，通过 `type newType oldType` 定义的类型，其中 `oldType` 可以是 预声明类型、未命名类型、自定义类型之一

例子

```go
func NamedType() {
	var a int32
	var b string
	fmt.Println(reflect.TypeOf(a), reflect.TypeOf(a).Kind())
	fmt.Println(reflect.TypeOf(b), reflect.TypeOf(b).Kind())
}
```

#### （2）未命名类型

又称为 符合类型、类型字面量、未命名类型，包括在

* `array`
* `slice`
* `map`
* `ptr`
* `channel`
* `struct`
* `interface`
* `function`

```go
func UnnamedType() {
	var a [2]int
	var b []int
	var c map[string]string
	var d *int32
	var e chan int
	var f struct { a int}
	// var g interface { }
	var h func() int
	fmt.Println(reflect.TypeOf(a), reflect.TypeOf(a).Kind())
	fmt.Println(reflect.TypeOf(b), reflect.TypeOf(b).Kind())
	fmt.Println(reflect.TypeOf(c), reflect.TypeOf(c).Kind())
	fmt.Println(reflect.TypeOf(d), reflect.TypeOf(d).Kind())
	fmt.Println(reflect.TypeOf(e), reflect.TypeOf(e).Kind())
	fmt.Println(reflect.TypeOf(f), reflect.TypeOf(f).Kind())
	// fmt.Println(reflect.TypeOf(g), reflect.TypeOf(g).Kind())
	fmt.Println(reflect.TypeOf(h), reflect.TypeOf(h).Kind())
}
```

### 2、潜在类型（底层类型）

underlying type，Go 中的所有类型存在一个潜在类型的属性，规则如下（目前[无法通过反射包查看](https://github.com/golang/go/issues/39574#issuecomment-655664772)，`type.Type.Kind()` 只能返回 潜在类型所属的大类，缺失了细节）：

* 简单类型（预声明类型）和复合类型（未命名）的底层类型是它们自身
* 自定义类型 `type newtype oldtype` 中 `newtype` 的底层类型是逐层递归向下查找的，直到查到的 `oldtype` 是简单类型或复合类型为止。

例子

```go
func UnderlyingType() {
	type T1 string  // string
	type T2 T1  // string
	type T3 []string  // []string
	type T4 T3  // []string
	type T5 []T1  // []string
	type T6 T5  // []string

	var a = struct { a int32 } { a: 12 }  // struct { a int32 }
	var b S = a  // struct { a int32 }
	var c S = S(a)  // struct { a int32 }
	fmt.Println(reflect.TypeOf(a), reflect.TypeOf(a).Kind())
	fmt.Println(reflect.TypeOf(b), reflect.TypeOf(b).Kind())
	fmt.Println(reflect.TypeOf(c), reflect.TypeOf(c).Kind())
}
```

### 3、赋值

> [参考知乎](https://zhuanlan.zhihu.com/p/56453921)

两个变量 `var a TypeA` 和 `var b TypeB`，Go语言支持直接 `a = b`，需要满足如下情况之一的

* `TypeA` 和 `TypeB` 类型完全一致
* `TypeA` 和 `TypeB` 潜在类型完全一致，且 `TypeA` 和 `TypeB` 存在一个为未命名类型
* `TypeA` 为 接口类型，且 `TypeB` 实现了 `TypeA` 的所有方法（注意：如果接收者为指针方式的实现，则 TypeA必须是指针类型才行）
* `TypeA` 为单向通道，`TypeB` 为双向通道
* 赋空值
* untyped constant 无类型常量

```go
type InterfaceType interface { f() }
type MyStructType struct { a int32 }
type MyStructType2 struct { a int32 }

func Assignability() {
	var a1 int32 = 1
	var b1 int32 = a1
	fmt.Println(b1)

	var a2 = struct {a int32} {a: 1}
	var b2 MyStructType = a2
	var c2 struct {a int32} = b2
	fmt.Println(c2)

	var a3 InterfaceType
	var b3 interface{ f() } = a3
	var c3 InterfaceType = b3
	fmt.Println(c3)
}
```

### 4、类型转换和类型断言

#### （1）类型转换

Type Conversion

两个变量 `var a TypeA` 和 `var b TypeB`，Go语言支持类型转换 `a = TypeA(b)`，需要满足如下情况之一的（就是说两者类型兼容）

* `TypeA` 和 `TypeB` 底层类型相同
* `TypeA` 和 `TypeB` 都是整型，或者都是浮点型
* `TypeA` 是 `[]rune` ， `[]byte` ； `TypeB` 是 `string` （`string` 转换为数字需要使用标准库 `strconv`）
* `TypeA` 是 `string` ； `TypeB` 是 整数值 或 `[]byte` 或 `[]rune`

其他说明

* 类型转换必须满足如上条件，否则将触发编译错误

例子

```go
type MyStructType struct { a int32 }
type MyStructType2 struct { a int32 }

func TypeConvert() {

	var a = "123"
	var b = []rune(a)
	var c = []byte(a)
	// var d = int32(a)
	var e = string(int32(65))
	var f = string(b)
	var g = string(c)
	fmt.Println(b)
	fmt.Println(c)
	// fmt.Println(d)
	fmt.Println(e)
	fmt.Println(f)
	fmt.Println(g)

	var s1 = MyStructType { a: 1}
	var s2 MyStructType2 = MyStructType2(s1)
	fmt.Println(s2)
}
```

#### （2）类型断言

Type Assertion

类型断言是，Go 语言对接口类型变量（包括命名接口和空接口）进行类型转换的语法。类型断言和类型转换完全没有关系，类型断言发生在运行时，断言失败可能发生 `painc`，支持三种语法

* `newVar := interfaceVar.(NewType)` 断言失败会触发 `painc`
* `newVar, ok := interfaceVar.(NewType)` 断言失败则
    * `ok == false`
    * `newVar` 为零值
* `switch newVar := interfaceVar.(type) { case NewType: xxx }`

其他说明

* 类型断言会进行一定的类型检查，`NewType` 必须实现了 `interfaceVar` 的接口
* 如果断言成功分配的变量，会形成一份拷贝，而不是引用

```go
package typesystem

import "fmt"

type InterfaceType interface { f() }
type MyStructType struct { a int32 }
type MyStructType2 struct { a int32 }
func (self MyStructType) f() { fmt.Println(self.a) }
func (self MyStructType2) f() { fmt.Println(self.a) }

func TypeAssertion() {
	var a = MyStructType { a: 1 }
	var b InterfaceType = a

	c := b.(MyStructType)
	c.a = 3
	c.f()
	b.f() // 仍然打印 1 说明 上面 c 是 b 的一份拷贝

	if c, ok := b.(MyStructType); ok {
		fmt.Println("b.(MyStructType) success")
		c.f()
	} else {
		fmt.Println("b.(MyStructType) fail")
	}

	b.f()

	if c, ok := b.(MyStructType2); ok {
		fmt.Println("b.(MyStructType2) success")
		c.f()
	} else {
		fmt.Println(c)
		fmt.Println("b.(MyStructType2) fail")
	}

	switch c := b.(type) {
	case MyStructType: fmt.Println(c); fmt.Println("b is MyStructType")
	case MyStructType2: fmt.Println(c); fmt.Println("b is MyStructType2")
	default: fmt.Println(c); fmt.Println("b is Unknown")
	}
}
```

### 5、理解 type 语法

> [文章](https://fenggolang.github.io/2018/09/golang%E4%B8%AD%E7%B1%BB%E5%9E%8B%E5%88%AB%E5%90%8D%E4%B8%8E%E7%B1%BB%E5%9E%8B%E5%86%8D%E5%AE%9A%E4%B9%89/)

#### （1）类型定义

`type newType oldType`

在 Go 中，`type` 语法是声明自定义命名类型的唯一方法。`type` 的主要作用有两个：其一是为类型命名，其二和方法绑定

* 方法是和 `newType` 这个名字绑定的
* 因此不会继承 `oldType` 声明的方法
* 可以为 `newType`  声明方法

`oldType` 可以是如下几种情况：

* 预声明类型 （int32等）
* 未命名类型 （struct map 等）
* 其他命名的自定义类型

例子

```go
package typesystem

import "fmt"

type MyInt int32

func (a MyInt) add(b MyInt) int32 {
	return int32(a) + int32(b)
}

type MyInt2 MyInt

func (a MyInt2) subtract(b MyInt2) int32 {
	return int32(a) - int32(b)
}

func TypeSyntax() {
	var a MyInt = 1
	fmt.Println(a + a)
	fmt.Println(a.add(a))

	var b MyInt2 = 2
	fmt.Println(b + b)
	// fmt.Println(b.add(b))
	fmt.Println(b.subtract(b))
}
```

#### （2）类型别名

> go1.9 特性
> [参考](https://github.com/qcrao/Go-Questions/blob/master/interface/%E7%B1%BB%E5%9E%8B%E8%BD%AC%E6%8D%A2%E5%92%8C%E6%96%AD%E8%A8%80%E7%9A%84%E5%8C%BA%E5%88%AB.md)

`type newType = oldType`

此语法为定义类型别名，并不会创建一个新的类型

* `newType` 和 `oldType` 是别名的关系
* 对 `newType` 声明方法，相当于对 `oldType` 声明方法，`oldType` 也可以使用，也就是说两者方法完全一项
* 若 `newType` 是导出的（首字母大写），则 `newType` 可以被导出使用

例子

```go
package typesystem

import "fmt"

type MyInt int32

func (a MyInt) add(b MyInt) int32 {
	return int32(a) + int32(b)
}

type MyInt3 = MyInt

func (a MyInt3) Multiply(b MyInt3) int32 {
	return int32(a) * int32(b)
}

type MyInt4 = int32

// 以下等价于：func (a int32) Divide(b int32) int32 {
// 因此报错 invalid receiver int32 (basic or unnamed type)compiler
// func (a MyInt4) Divide(b MyInt4) int32 {
// 	return a / b
// }

func TypeSyntax() {
	var a MyInt = 1
	fmt.Println(a + a)
	fmt.Println(a.add(a))

	var c MyInt3 = a
	fmt.Println(c.add(c))
	fmt.Println(c.Multiply(c))
	fmt.Println(a.Multiply(a))
	fmt.Println(a.add(a))
}
```

### 6、interface 注意点

#### （1）接口判nil

#### （2）接口与指针接收者

## 四、Go 标准库
