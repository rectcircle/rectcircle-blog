---
title: "Go 提升"
date: 2020-10-18T18:26:26+08:00
draft: false
toc: true
comments: true
tags:
  - golang
---

> [实验代码](https://github.com/rectcircle/go-improve)

参考和书籍：

* [Go 语言设计与实现](https://draveness.me/golang/)
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

之前存在的问题（不使用第三方工具和 vender）

* 没有模块版本管理
* 依赖关系无法声明，拉下来代码后需要手动 一个一个 go get

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
go get -u rsc.io/sampler
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

* Module 是 Golang 的最小发布单元，一般与代码仓库一一对应，一般包含多个Package，包含版本概念
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

### 8、高级话题

#### （1）理解 go module 的兼容性

我们应该从两种场景看 `go.mod` 文件。

* 场景 1：当前 module 作为主项目进行编译开发开发时，比如我们需要开发一个可执行文件（binary）。这种情况下 `go.mod` 就记录了主项目的所有依赖情况，即给 go 编译器提供完整的依赖信息。此时，如果信息不完整，就会编译失败。
* 场景 2：当前 module 作为一个外部依赖提供给其他项目是，比如我们需要开发一个库（library）。这种情况下 go 对该 `go.mod` 的处理就很不一样了。

我们重点看下场景 2。众所周知，Go module 在 Go 1.11 才正式推出，而在 Go 1.11 之前的基于 GOPATH 的项目 Go module 仍需要支持。所以 Go module 做了大量的兼容逻辑。

因此，当 module 作为一个外部依赖时，go 不会假设 `go.mod` 完整的描述了整个项目的依赖情况。因此，go 可以接受如下场景（执行 `go get` 或 `go mod tidy` 时）：

* 该 module 没有 `go.mod`，此时 go 会扫描代码中的 import 语句，分析出依赖，并下载依赖。然后依赖添加到当前 module 的 `go.mod` 的 `require` 子句中，并添加 `// indirect` 注释。
* 该 module 有 `go.mod`，此时 go 会根据 `go.mod` 文件中的依赖信息，下载依赖。同时仍会扫描代码中的 import 语句，如果 `go.mod` 不完整，会自动补充这些缺失的依赖，然后添加到当前 module 的 `go.mod` 的 `require` 子句中，并添加 `// indirect` 注释。

因此，可以看出，当 module 作为一个外部依赖时，`go.mod` 的作用只是用来约束其依赖的版本，如果缺失，也不会影响下游的正常编译。

#### （2）间接依赖和依赖图修剪

我们经常会在 `go.mod` 中看到带有 `// indirect` 注释的 `require` 子句，字面意义上是间接依赖的意思。

间接依赖指的是当前 module 没有直接 import 该依赖的代码，而是我们直接依赖的 module 中，依赖了该 module。此时，当前可能会出现带有 `// indirect` 的依赖。

在 Go 1.17 之前，当前 module 的 `go.mod` 并不会包含所有间接依赖。换句话来说因此在 Go 1.17 之前， `// indirect` 的语义并不是间接依赖，而是在整个用 `go.mod` 构建的依赖图中，没有被明确 `require` 的那些依赖。举个例子，假设有一个 module a，其事实的依赖关系为 `a -> b -> c,d`，此时设想如下场景

* 场景 1：`b` 的 `go.mod` 明确声明了 `require c; require d`。此时 `a` 的 `go.mod` 就不会出现  `require c // indirect`、 `require d // indirect`，而只有 `require b`。
* 场景 2：`b` 的 `go.mod` 只明确声明了 `require c`，缺失了 `d`。此时 `a` 的 `go.mod` 为 `require b` 和 `require d // indirect`。
* 场景 3：`b` 不存在 `go.mod` 文件。此时 `a` 的 `go.mod` 为 `require b`、`require c // indirect`、`require d // indirect`。

这和网上文章 [【Go 专家编程】go.mod 文件中的indirect准确含义](https://my.oschina.net/renhc/blog/3162751) 的结论一致。

我们可以观察 [gin](https://github.com/gin-gonic/gin/blob/v1.7.7/go.mod) 项目的的依赖，确实很干净，没有 `// indirect`。

```gomod
module github.com/gin-gonic/gin

go 1.13

require (
	github.com/gin-contrib/sse v0.1.0
	github.com/go-playground/validator/v10 v10.4.1
	github.com/golang/protobuf v1.3.3
	github.com/json-iterator/go v1.1.9
	github.com/mattn/go-isatty v0.0.12
	github.com/stretchr/testify v1.4.0
	github.com/ugorji/go/codec v1.1.7
	gopkg.in/yaml.v2 v2.2.8
)

retract v1.7.5
```

但是在 Go 1.17 之后，情况发生了变化，Go 1.17 带来了依赖图修剪的功能，此时 `// indirect` 的语义就真正变成了间接依赖。也就是说，在 Go 1.17 之后， 项目中的所有间接依赖都会以 `// indirect` 方式声明在 `go.mod` 中。

以 [gin](https://github.com/gin-gonic/gin) 为例，我们将其 `go.mod` 中的 go 版本修改为 `1.17`，此时 `go mod tidy` 执行完后， `go.mod` 中的内容如下：

```gomod
module github.com/gin-gonic/gin

go 1.17

require (
        github.com/gin-contrib/sse v0.1.0
        github.com/go-playground/validator/v10 v10.10.0
        github.com/goccy/go-json v0.9.5
        github.com/json-iterator/go v1.1.12
        github.com/mattn/go-isatty v0.0.14
        github.com/stretchr/testify v1.7.0
        github.com/ugorji/go/codec v1.2.6
        golang.org/x/net v0.0.0-20210226172049-e18ecbb05110
        google.golang.org/protobuf v1.27.1
        gopkg.in/yaml.v2 v2.4.0
)

require (
        github.com/davecgh/go-spew v1.1.1 // indirect
        github.com/go-playground/locales v0.14.0 // indirect
        github.com/go-playground/universal-translator v0.18.0 // indirect
        github.com/leodido/go-urn v1.2.1 // indirect
        github.com/modern-go/concurrent v0.0.0-20180228061459-e0a39a4cb421 // indirect
        github.com/modern-go/reflect2 v1.0.2 // indirect
        github.com/pmezard/go-difflib v1.0.0 // indirect
        golang.org/x/crypto v0.0.0-20210711020723-a769d52b0f97 // indirect
        golang.org/x/sys v0.0.0-20210806184541-e5e7981a1069 // indirect
        golang.org/x/text v0.3.6 // indirect
        gopkg.in/yaml.v3 v3.0.0-20210107192922-496545a6307b // indirect
)
```

依赖图修剪指的是 Go 只会处理编译依赖的 module，某些 module 按照 module 粒度分析可能存在，但是编译时其实并不会使用，就会被修剪掉。更多参见：[博客](https://tonybai.com/2021/08/19/go-module-changes-in-go-1-17/)

#### （3）多 Module 代码仓库

Go 支持一个仓库内部有多个 module，且这个 module 可以在任意目录，此时我们如果需要使用 `git tag` 来标识 module 版本时，tag 的的名字就位， `该module相对仓库根目录的路径/版本号`。以 [`https://github.com/golang/tools/tree/master/gopls`](https://github.com/golang/tools/tree/master/gopls) 为例，其 `git tag` 的一个例子为 `gopls/v0.8.1`。

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

### 6、interface

* [深度解密Go语言之关于 interface 的10个问题](https://www.cnblogs.com/qcrao-2018/p/10766091.html)

#### （1）接口与指针接收者

将 一个变量 `var a TypeA` 赋值给 接口类型变量 `var b InterfaceB` 时（`b = a`），需要满足如下规则：

* `TypeA` 实现的 `InterfaceB` 方法 全部为 非指针接收者时，则 `a` 允许为 `TypeA` 或者 `*TypeA`
* `TypeA` 实现的 `InterfaceB` 方法 存在 指针接收者时，则 `a` 只能为 `*TypeA`

例子1

```go
package typesystem

import "fmt"

type I1 interface {
	// PtrReceiver(a int32)
	NonPtrReceiver()
}

type S1 struct {
	a int32
}

// func (s *S1) PtrReceiver(a int32) {
// 	s.a = a
// }

func (s S1) NonPtrReceiver() {
	fmt.Println(s.a)
}

func NonPtrOrPtrReceiver() {
	var a S1 = S1{1}
	var b I1 = &a
	var c I1 = a
	// b.PtrReceiver(2)
	b.NonPtrReceiver()
	c.NonPtrReceiver()
}

```

例子2

```go
package typesystem

import "fmt"

type I1 interface {
	PtrReceiver(a int32)
	NonPtrReceiver()
}

type S1 struct {
	a int32
}

func (s *S1) PtrReceiver(a int32) {
	s.a = a
}

func (s S1) NonPtrReceiver() {
	fmt.Println(s.a)
}

func NonPtrOrPtrReceiver() {
	var a S1 = S1{1}
	var b I1 = &a
	// var c I1 = a
	b.PtrReceiver(2)
	b.NonPtrReceiver()
	// c.NonPtrReceiver()
}
```

#### （2）实现接口

任何类型都实现了 `interface{}`，只要某类型关联的方法实现了 某接口的所有方法，则认为该类型实现了该方法，则该类型变量可以赋值给该接口变量

```go
package typesystem

import "fmt"

type I0 interface {
	NonPtrReceiver()
}

type I1 interface {
	PtrReceiver(a int32)
	NonPtrReceiver()
}

type S1 struct {
	a int32
}

func (s *S1) PtrReceiver(a int32) {
	s.a = a
}

func (s S1) NonPtrReceiver() {
	fmt.Println(s.a)
}

func NonPtrOrPtrReceiver() {
	var a S1 = S1{1}
	var b I1 = &a
    var c I0 = b  // 接口也可以赋值给接口
	c.NonPtrReceiver()
}
```

#### （3）接口判nil

接口类型变量只有显示以 `nil` 赋值（包括函数返回值），`== nil` 才返回 `true` ； 如果使用一个 `nil` 指针变量赋值，则返回 `false`

```go
func InterfaceNil() {
	var a interface{} = nil
	fmt.Println(a)  // <nil>
	fmt.Println(a == nil)  // true
	var b *int32 = nil
	a = b
	fmt.Println(a)  // <nil>
	fmt.Println(a == nil)  // false
}
```

#### （4）避免接口被无意被实现

> [参考](https://blog.csdn.net/rbin_2009/article/details/109132180)

* 接口定义一个特殊命名的方法 （例如 `runtime.Error`）
* 定义一个私有方法（例如 `testing.TB`）
    * 接口只能包内部使用，包外部无法直接创建满足该接口的结构体
    * 通过结构体嵌入匿名类型可以绕过

#### （5）接口原理

参见 [五、语言基础-3、接口](2-接口)

### 7、struct

待补充

### 8、嵌入（嵌套）

#### （1）结构体匿名嵌套

一个结构体 A 允许匿名嵌入其他多个结构体 B、C，此时 结构体 A 变量 `a` 时

* 直接通过 `a.xxx` 调用 B、C 的任意方法、任意成员
* 当B、C存在命名冲突时，后声明的将覆盖前面声明的
* 当A声明符号与B、C存在冲突，将覆盖B、C存在的变量
* 当调用 B 中的方法 `b()`，且 `b()` 中调用了方法 `a()`，且这个 `a()` 在 A 和 B 中都定义了，此时会调用 `B.a()`
    * 因此 结构体匿名嵌套：无法形成运行时多态，无法实现其他语言利用继承实现的多态效果（父类方法调用子类实现），因此不能理解为继承
* A 中 的 方法是可以调用 B 中的方法的
* B、C 除了支持任意类型，包括 `interface`

例子

```go
type I2 interface {
	NeedCallB()
	B()
}

type S3 struct {}

func (self *S3) NeedCallB() {
	self.B()
}

func (self *S3) B() {
	fmt.Println("S3.B()")
}

type S3Child1 struct {
	S3
}

func (self *S3Child1) B() {
	fmt.Println("S3Child1.B()")
}

func StructNested() {
	var a I2 = &S3Child1{}
	a.NeedCallB()
	a.B()
}
```

#### （2）接口嵌套

一个接口允许嵌套多个其他接口，此时，相当于本接口声明了被嵌套的那些接口的全部方法（可以理解为其他语言的接口继承）

```go

type ParentI1 interface {
	A()
}

type ParentI2 interface {
	B()
}

type ChildI1 interface {
	ParentI1
	ParentI2
}

type S2 struct{
	a int32
}

func (f S2) A(){
	fmt.Println("a")
}

func (f S2) B(){
	fmt.Println("b")
}

func InterfaceNested() {
	var a S2 = S2{1}
	var b ChildI1 = a
	b.A()
	b.B()
}
```

## 四、内置类型

### 1、数组

在 Go 语言中，数组是长度固定的一段连续内存，包含如下属性

* 长度
* 元素的类型及类型长度

数组初始化的两种方法

```go
arr1 := [3]int{1, 2, 3}
arr2 := [...]int{1, 2, 3}
```

对于一个由字面量组成的数组，根据数组元素数量的不同，编译器会在负责初始化字面量的 cmd/compile/internal/gc.anylit 函数中做两种不同的优化：

* 当元素数量小于或者等于 4 个时，会直接将数组中的元素放置在栈上；
* 当元素数量大于 4 个时，会将数组中的元素放置到静态区并在运行时取出

例子

```go
// 长度小于等于4的数组字面量等价于
var arr [3]int
arr[0] = 1
arr[1] = 2
arr[2] = 3
// 长度小于或者等于4的数组字面量等价于
var arr [5]int
statictmp_0[0] = 1
statictmp_0[1] = 2
statictmp_0[2] = 3
statictmp_0[3] = 4
statictmp_0[4] = 5
arr = statictmp_0
```

访问和赋值会做边界检查，分为运行时和编译时，同时编译器会做 [边界检查消除](https://gfw.go101.org/article/bounds-check-elimination.html)

* 如果编译时可以确定边界，数组元素的访问相当于直接访问那一段内存，效率无损
* 如果编译时无法确认索引是否越界，则 使用 `PanicBounds` 在运行时检查，此时会造成额外的运行时开销

### 2、切片

> [博客1](https://www.flysnow.org/2018/12/21/golang-sliceheader.html)
> [Go 语言设计与实现 - 3.2 切片](https://draveness.me/golang/docs/part2-foundation/ch03-datastructure/golang-array-and-slice/)
> [Go 切片的扩容机制](https://www.jianshu.com/p/54be5b08a21c)

切片本质上是一个动态数组，包含三个属性：

* 长度 `len()` 函数可查看
* 容量 `cap()` 函数可查看
* 数据指针

在运行时，切片的在 `reflect.SliceHeader`

```go
import (
	"fmt"
	"reflect"
	"unsafe"
)
func SliceExperiment() {

	// slice 运行时底层类型
	// type SliceHeader struct {
	// 	Data uintptr
	// 	Len  int
	// 	Cap  int
	// }

    s3 := []int32{1, 2, 3}
    fmt.Println(len(s3), cap(s3))
	sh1 := (*reflect.SliceHeader)(unsafe.Pointer(&s3))
	fmt.Println(sh1)
}
```

扩容机制

* 当 `cap` 满了后，go runtime 重新申请一段内存空间，并将数据指针执行新的内存域
* 当需要的容量超过原切片容量的两倍时，会使用需要的容量作为新容量。
* 否则
    * 当原切片长度小于1024时，新切片的容量会直接翻倍。
    * 当原切片的容量大于等于1024时，会反复地增加25%，直到新容量超过所需要的容量。

初始化的几种方式

* 从数组或者切片中进行切片（假设 `oldArr` 的长度为4）
    * 完整写法 `s := oldArrOrSlice[startIndex:endIndex:capIndex]`
        * startIndex 为切片起始位置，包含该位置
        * endIndex 为切片结束位置，不包括该位置，因此切片长度 `len(s) = endIndex - startIndex`
        * capIndex 为切片容量的结束位置，不包括该位置，因此切片的长度 `cap = capIndex - startIndex`
        * 约束为 `0 <= startIndex <= endIndex <= capIndex <= len(oldArrOrSlice)`
    * `s := oldArr[0:2]` 等价于 `s := oldArr[0:2:2]`
    * `s := oldArr[:]` 等价于 `s := oldArr[0:4]`
    * `s := oldArr[:2]` 等价于 `s := oldArr[0:2]`
    * `s := oldArr[:2:4]` 等价于 `s := oldArr[0:2:4]`
    * `s := oldArr[2:]` 等价于 `s := oldArr[2:4:4]`
* 字面量初始化 `s := []int32{1, 2, 3}` 此时 `len = cap = 3`
* `make` 创建
    * `s4 := make([]int32, 10)` 此时 `len = cap = 10`
    * `s4 := make([]int32, 10, 20)` 此时 `len = 10`，`cap = 20`

访问、修改、添加、删除切片元素，拷贝切片

* 访问元素 `s[index]` 要求 `index < len(s)` 不满足将抛出 panic
* 修改元素 `s[index] = newValue` 要求 `index < len(s)` 不满足将抛出 panic
* 添加元素 利用 `append` 函数 `newS = append(s, 1, 2, 3)`，流程如下
    * 浅拷贝 `s` 创建新的 `reflect.SliceHeader` 结构 `newS`
    * 如果 `s` 发生了扩容，则 `newS` 的数据指针指向新的内存，并执行拷贝
    * 如果未扩容 `s` 和 `newS` 指向同一块内存（**此时添加的元素 `s` 也可见**）
    * 数据赋值
* 删除切片未提供直接方法
    * 利用 `append` 进行删除中间的元素
    * 利用切片语法删除头尾元素
* 拷贝切片 `copy(dst, source)`

注意，切片和数组、切片和切片之间可能共享数据指针指向的内存空间这样可能造成如下问题

* 一个切片指向了一个大数组，造成大数组无法被垃圾回收，导致内存泄漏，严重导致OOM
* 共享数据时，修改了一个导致数据也发生影响，不注意可能发生 Bug

解决方法：利用 copy 手动深拷贝切片

全部例子

```go
package innertype

import (
	"fmt"
	"reflect"
	"unsafe"
)

func SliceExperiment() {
	// 基本使用
	a := [...]int32 {1, 2, 3}
	// 创建的三种方式
	// 方式1：从数组创建
	s1 := a[0:3]
	s2 := s1[1:2:3]
	// 方式2：字面量创建
	s3 := []int32{1, 2, 3}
	// 方式3：make 创建
	s4 := make([]int32, 10)
	fmt.Println(s1, s2, s3, s4)

	// 访问、修改、删除切片元素，拷贝切片
	s1[1] = -2
	s1[100] = 1
	// 可以发现从数组和切片创建的切片数据在没有append操作之前共享底层数据
	fmt.Println(a, s1, s2)
	// append 之后 且 超过容量后，会脱离共享
	s1_2 := append(s1, int32(-3))
	fmt.Println(a, s1, s1_2, s2)
	// append 之后 但 不超过容量，不会脱离共享
	fmt.Println(len(s2), cap(s2))
	s2_2 := append(s2, int32(-3))
	fmt.Println(a, s1, s1_2, s2, s2_2)
	// 删除元素，利用append + slice 实现
	s3_2 := append(s3[:1], s3[2:]...)
	fmt.Println(s3, s3_2)
	// 拷贝切片 dest 与 source 将脱离共享
	var s5 []int32 = make([]int32, 3, 3)
	copy(s5, a[:])
	s5[1] = 12
	fmt.Println(a, s5)

	// slice 运行时底层类型
	// type SliceHeader struct {
	// 	Data uintptr
	// 	Len  int
	// 	Cap  int
	// }

	fmt.Println(len(s3), cap(s3))
	sh1 := (*reflect.SliceHeader)(unsafe.Pointer(&s3))
	fmt.Println(sh1)
}
```

### 3、字符串

* Go 字符串是不可变的
* 本质上是一个字节数组和该字节数组的长度
* 默认编码为 UTF8

字符串字面量

```go
func StringExperiment() {
	// 单行字符串
	s1 := "123`中文❤😁\"\n\tabc"
	fmt.Println(s1)
	// 多行字符串，不支持转移字符 (Raw string)
	s2 := `123中文❤😁"
	abc`
	fmt.Println(s2)
}
```

字符串格式化与模板

* C 风格的字符串格式化 `%`，位于 [`fmt` 包](https://golang.org/pkg/fmt/)
    * `fmt.Sprintf(格式化样式, 参数列表...)`
    * `fmt.Printf(格式化样式, 参数列表...)`
* Go 提供了完善的模板引擎，位于 [`text/template` 包](https://golang.org/pkg/text/template/)

字符串拼接

* `+` 底层实现为 `runtime.concatstrings`，存在 Copy 性能问题
* `Go 1.10+` 使用 [`string.Builder`](http://golang.org/pkg/io/#Writer)
* `Go 1.10` 之前，使用 [`bytes.Buffer`](http://golang.org/pkg/bytes/#Buffer)

底层结构

```go
// reflect.StringHeader
type StringHeader struct {
	Data uintptr
	Len  int
}
```

相关操作

* 字节数组 和 字符串 相互转换，存在内存拷贝
    * 字符串转字节数组 `b1 := []byte(s1);`
    * 字节数组转字符串 `s3 := string(b1)`
* 字符串 和 数字类型 的转换在 `strconv` 包
* 字符串相关属性
    * 字符串的字节长度 `len(s)`，时间复杂度 `O(1)`
    * 字符串的字符长度 `utf8.RuneCountInString(s2)` 时间复杂度 `O(n)`
* 字符串遍历
    * 字节遍历 `s[i]`
    * 字符遍历 `for idx, c := range s {}`

例子

```go
package innertype

import (
	"fmt"
	"reflect"
	"unsafe"
)

func SliceExperiment() {
	// 基本使用
	a := [...]int32 {1, 2, 3}
	// 创建的三种方式
	// 方式1：从数组创建
	s1 := a[0:3]
	s2 := s1[1:2:3]
	// 方式2：字面量创建
	s3 := []int32{1, 2, 3}
	// 方式3：make 创建
	s4 := make([]int32, 10)
	fmt.Println(s1, s2, s3, s4)

	// 访问、修改、删除切片元素，拷贝切片
	s1[1] = -2
	s1[100] = 1
	// 可以发现从数组和切片创建的切片数据在没有append操作之前共享底层数据
	fmt.Println(a, s1, s2)
	// append 之后 且 超过容量后，会脱离共享
	s1_2 := append(s1, int32(-3))
	fmt.Println(a, s1, s1_2, s2)
	// append 之后 但 不超过容量，不会脱离共享
	fmt.Println(len(s2), cap(s2))
	s2_2 := append(s2, int32(-3))
	fmt.Println(a, s1, s1_2, s2, s2_2)
	// 删除元素，利用append + slice 实现
	s3_2 := append(s3[:1], s3[2:]...)
	fmt.Println(s3, s3_2)
	// 拷贝切片 dest 与 source 将脱离共享
	var s5 []int32 = make([]int32, 3, 3)
	copy(s5, a[:])
	s5[1] = 12
	fmt.Println(a, s5)

	// slice 运行时底层类型
	// type SliceHeader struct {
	// 	Data uintptr
	// 	Len  int
	// 	Cap  int
	// }

	fmt.Println(len(s3), cap(s3))
	sh1 := (*reflect.SliceHeader)(unsafe.Pointer(&s3))
	fmt.Println(sh1)
}
```

### 4、map

原理参见：[Go 语言设计与实现 - 3.3 哈希表](https://draveness.me/golang/docs/part2-foundation/ch03-datastructure/golang-hashmap/)

创建

```go
	h1 := map[string]int{
		"1": 2,
		"3": 4,
		"5": 6,
	}
	fmt.Println(h1)

	// 创建并指定容量
	h2 := make(map[string]int, 3)
	h2["1"] = 2
	h2["3"] = 4
	h2["5"] = 6
```

读、写、删除

```go
	// 访问
	fmt.Println(h2["1"])  // 不存在将返回零值
	fmt.Println(h2["2"])  // 不存在将返回零值
	// 访问并判断是否存在
	if e, ok := h2["1"]; ok {
		fmt.Println(ok, e)
	}
	// 写入
	h2["7"] = 8
	fmt.Println(h2)
	// 删除
	delete(h2, "7")
	fmt.Println(h2)
```

遍历

```go
	// 遍历 https://golang.org/ref/spec#For_statements
	for k, v := range h2 {
		fmt.Println(k, v)
		// 迭代中删除、创建、修改都是是安全的
		delete(h2, k)
	}
	fmt.Println(h2)
```

线层安全 map `sync.Map`

## 五、语言基础

### 1、函数

特点

* 支持多返回值，所有返回值必须接收，不需要需使用占位符 `_`
* 支持可变参数，`func func1(params ...int)`
* 某些内建函数包含编译器魔法，也就是说某些内建的特性，自定义函数无法实现

语法

* 调用，基本语法 `functionName(param1, param2, ...)`
* 调用，将数组传递到可变参数里 `functionName(param1, arr...)`

调用惯例

* C 语言同时使用寄存器和栈传递参数，使用 eax 寄存器传递返回值；
* 而 Go 语言使用栈传递参数和返回值

传值方式

* 均为拷贝传值的方式
    * 针对指针，拷贝指针值
    * 针对类型，拷贝其内存

### 2、接口

Go 语言中接口是一种类型，在底层表示为两种结构

* `iface` 有声明方法的接口
* `efact` 空接口

声明详情

```go
// $GOROOT/src/runtime/runtime2.go

type eface struct {
    _type *_type
    data  unsafe.Pointer
}

type iface struct {
    tab  *itab
    data unsafe.Pointer
}

// $GOROOT/src/runtime/type.go

type _type struct {
    size       uintptr
    ptrdata    uintptr // size of memory prefix holding all pointers
    hash       uint32
    tflag      tflag
    align      uint8
    fieldalign uint8
    kind       uint8
    alg        *typeAlg
    // gcdata stores the GC type data for the garbage collector.
    // If the KindGCProg bit is set in kind, gcdata is a GC program.
    // Otherwise it is a ptrmask bitmap. See mbitmap.go for details.
    gcdata    *byte
    str       nameOff
    ptrToThis typeOff
}

// $GOROOT/src/runtime/runtime2.go

type itab struct {
    inter *interfacetype
    _type *_type
    hash  uint32 // copy of _type.hash. Used for type switches.
    _     [4]byte
    fun   [1]uintptr // variable sized. fun[0]==0 means _type does not implement inter.
}
```

接口的引入主要作用是实现动态派发，使Go语言有一定的动态性，在某些基准测试

* 针对指针
    * 在关闭编译器优化的情况下，从上面的数据来看，动态派发生成的指令会带来 ~18% 左右的额外性能开销
    * 开启编译器优化后，动态派发的额外开销会降低至 ~5%
* 针对非指针
    * 动态派发调用方法相比直接调用额外消耗了 ~125% 的时间

更多细节参见 [1](https://zhuanlan.zhihu.com/p/86420182)，[2](https://draveness.me/golang/docs/part2-foundation/ch04-basic/golang-interface/)

### 3、反射

三大法则（功能）

* 从 `interface{}` 变量可以反射出反射对象；
* 从反射对象可以获取 `interface{}` 变量；
* 要修改反射对象，其值必须可设置；

法则1：从 `interface{}` 变量可以反射出反射对象

* 反射入口的两个函数声明如下，接收的参数为 `interface{}` 返回反射对象，也就是说，使用反射入口函数时发生了函数参数类型转换——转换为了 `interface{}`
    * `reflect.TypeOf(interface{}) Type`
    * `reflect.ValueOf(interface{}) Value`
* 本质上是： 变量 -> `interface {}` -> 反射对象

```go
	var a int32 = 1
	var ai interface{} = a
	at := reflect.TypeOf(a)
	apt := reflect.TypeOf(&a)
	ait := reflect.TypeOf(ai)
	fmt.Println("TypeOf(a) = ", at, "TypeOf(&a) = ", apt, "TypeOf(&ait) = ", ait)
	av := reflect.ValueOf(a)
	apv := reflect.ValueOf(&a)
	fmt.Println("ValueOf(a) = ", av, "ValueOf(&a) = ", apv)
```

法则2：从反射对象可以获取 `interface{}` 变量

* `Value` 可以获取 `Type`
* `Value` 可以获取 `interface{}` 对象

法则1和法则2可以总结为下图

```
    ---显示或隐式转换---     ---reflect.Value()----------
    |                |    |                           |
    |                v    |                           v
variable           interface{} <--- .Interface() --- Reflect.Value
    ^                |    |                          |
    |                |    | reflect.Type()           | .Type()
    ---- .(type) -----    |                          v
                          -------------------------> Reflect.Type
```

法则3：要修改反射对象，其值必须可设置

想要修改原对象，必须通过指针获取 Value，具体步骤如下：

* 调用 `reflect.ValueOf` 函数获取变量指针；
* 调用 `reflect.Value.Elem` 方法获取指针指向的变量；
* 调用 `reflect.Value.SetInt` 方法更新变量的值：
* 且不能修改自由变量

反射核心能力，运行时：

* 读取类型和值的元数据
* 设置指针的值
* 构造新类型（[结构体嵌入，不支持方法](https://github.com/golang/go/issues/15924)）

常用 API

* `reflect.Type` 参见：https://pkg.go.dev/reflect#Type
* `reflect.Value` 参见：https://pkg.go.dev/reflect#Value

更多参见 [博客](https://draveness.me/golang/docs/part2-foundation/ch04-basic/golang-reflect/)

## 六、常用关键字

### 1、for 和 range

Go 的 `for range` 和 其他编程语言的实现不太一样，不是基于迭代器，而是一种编译器魔法，会转换为经典循环（`for Ninit; Left; Right { NBody}`），最终编译成汇编的 带 jump 的语句。

for range 的几种特殊行为

* 循环永动机不存在，即边循环数组和切片，边append不会死循环，因为编译成经典循环后，len 会在进入循环前被计算固定了
* 遍历元素为非指针的切片时 v 是一份拷贝
* 遍历数组同时赋零值时会优化成 批量内存操作的汇编指令
* map 遍历具有随机性，为了提醒开发者不要依赖 map 的顺序，特意在 map 遍历时添加了随机性
* map 遍历过程中，删除未遍历的元素，将不会被遍历到
* map 遍历过程中，添加元素是否会被遍历到：不确定，取决于元素是否会添加到未被遍历过的桶之中，[参见](https://segmentfault.com/q/1010000012242735)
* string 遍历过程中，将string当成 utf8 编码，返回每个字符的 Unicode 码点。如果是 ASCII 则本次迭代只会吞掉1个字节，具体需要了解 utf8 编码规则，如果字符串不符合编码规则将吞掉该字节，返回编码错误字符码点 `0xFFFD`（显示为 `�`），然后继续遍历

例子

```go
func ForExperiment() {
	{
		// 只会迭代 3 次
		arr := []int{1, 2, 3}
		for _, v := range arr {
			arr = append(arr, v)
		}
		// 返回 [1 2 3 1 2 3]
		fmt.Println(arr)
	}
	{
		// 永远输出3
		arr := []int{1, 2, 3}
		newArr := []*int{}
		for _, v := range arr {
			newArr = append(newArr, &v)
		}
		for _, v := range newArr {
			fmt.Println(*v)
		}
	}
	{
		// 优化为 runtime.memclrNoHeapPointers 调用
		arr := []int{1, 2, 3}
		for i := range arr {
			arr[i] = 0
		}
	}
	{
		// map 遍历具有随机性
		hash := map[string]int{
			"1": 1,
			"2": 2,
			"3": 3,
		}
		for k, v := range hash {
			println(k, v)
		}
		for k, v := range hash {
			println(k, v)
		}
	}
	{
		// 删除未遍历的元素，不会被遍历到
		fmt.Println("map 删除未遍历的元素")
		hash := map[string]int{
			"1": 1,
			"2": 2,
		}
		for k := range hash {
			fmt.Println(k)
			if k == "1" {
				delete(hash, "2")
			} else {
				delete(hash, "1")
			}
		}
	}
	{
		// 边遍历变添加元素是否会被遍历到：不确定，取决于元素是否会添加到未被遍历过的桶之中
		// https://segmentfault.com/q/1010000012242735
		fmt.Println("map 边遍历变添加元素是否会被遍历到")
		hash := map[string]int{
			"1": 1,
			"2": 2,
			"3": 3,
			"4": 4,
		}
		for k := range hash {
			fmt.Println(k)
			for i := 4; i < 1000; i++ {
				hash[strconv.Itoa(i)] = i
			}
		}
		fmt.Println("len(hash) = ", len(hash))
	}
}
```

map 遍历编译后生成类似于如下代码

```go
ha := a
hit := hiter(n.Type)
th := hit.Type
mapiterinit(typename(t), ha, &hit)
for ; hit.key != nil; mapiternext(&hit) {
    key := *hit.key
    val := *hit.val
}
```

string 遍历编译后生成类似于如下代码

```go
ha := s
for hv1 := 0; hv1 < len(ha); {
    hv1t := hv1
    hv2 := rune(ha[hv1])
    if hv2 < utf8.RuneSelf {
        hv1++
    } else {
        hv2, hv1 = decoderune(ha, hv1)
    }
    v1, v2 = hv1t, hv2
}
```

channel 遍历编译后生成类似于如下代码

```go
ha := a
hv1, hb := <-ha
for ; hb != false; hv1, hb = <-ha {
    v1 := hv1
    hv1 = nil
    ...
}
```

### 2、select

建议先阅读 [七、并发章节](#七-并发)

select 功能

* select 能在 Channel 上进行非阻塞的收发操作（利用 `default` 子句）
    * 非阻塞在 go 的实现上经历了一系列演变，参考[非阻塞收发](https://draveness.me/golang/docs/part2-foundation/ch05-keyword/golang-select/#%E9%9D%9E%E9%98%BB%E5%A1%9E%E7%9A%84%E6%94%B6%E5%8F%91)，（搜索：`以下是与非阻塞收发的相关提交`）
* select 在遇到多个 Channel 同时响应时会随机挑选 case 执行

数据结构

select 在 Go 语言的源代码中不存在对应的结构体，case 的结构体为 [runtime.scase](https://draveness.me/golang/tree/runtime.scase)

```go
type scase struct {
	c           *hchan  // 用来存储channel
	elem        unsafe.Pointer  // 接收或者发送数据的变量地址
    kind        uint16  //  case 类型，可选值如下
    // const (
    //     caseNil = iota
    //     caseRecv
    //     caseSend
    //     caseDefault
    // )
	pc          uintptr
	releasetime int64
}
```

针对不同select语句块编译器有不同的处理

* select 不存在任何的 case 及 `select {}` 直接转换为 `runtime.block` 阻塞语句，导致 Goroutine 进入无法被唤醒的永久休眠状态。
* select 只存在一个 case，将转换为类似于 `v, ok := <-ch` 形式
* select 存在两个 case，其中一个 case 是 default；则认为试一次非阻塞操作，将调用 [`cmd/compile/internal/gc.walkselectcases`](https://draveness.me/golang/tree/cmd/compile/internal/gc.walkselectcases) 进行处理
* select 存在多个 case；将进入默认流程
    * 将所有的 case 转换成包含 Channel 以及类型等信息的 runtime.scase 结构体；
    * 调用运行时函数 `runtime.selectgo` 从多个准备就绪的 Channel 中选择一个可执行的 runtime.scase 结构体；该函数是核心，参见 [博客](https://draveness.me/golang/docs/part2-foundation/ch05-keyword/golang-select/#%E5%B8%B8%E8%A7%81%E6%B5%81%E7%A8%8B)
    * 通过 for 循环生成一组 if 语句，在语句中判断自己是不是被选中的 case

### 3、defer

defer 的最常见场景就是在函数调用结束后完成一些收尾工作，比如：回滚数据库事务、关闭文件描述符、关闭数据库连接以及解锁资源

defer 现象

* defer 的执行顺序是先入后出的栈的顺序，在函数退出之前执行
* defer 会对函数中引用的外部参数进行拷贝，解决方式是使用闭包（匿名函数包装一层）

例子

```go
func deferInFor() {
	// defer 执行顺序为栈的顺序
	// 不建议在 for 中使用，因为性能较弱
	for i := 0; i < 5; i++ {
		defer fmt.Println(i)
	}
	// 输出 43210
}

func deferSeq() {
	{
		defer fmt.Println("defer runs")
		fmt.Println("block ends")
	}

	fmt.Println("main ends")
	// 输出
	// block ends
	// main ends
	// defer runs
}

func deferParamPrecompute() {
	startedAt := time.Now()
	defer fmt.Println(time.Since(startedAt))
	// 输出远远小于1秒，说明defer 函数的参数已经被拷贝了
	time.Sleep(time.Second)
}

func deferParamPrecompute2() {
	startedAt := time.Now()
	defer func() { fmt.Println(time.Since(startedAt)) }()
	// 输出1秒左右
	time.Sleep(time.Second)
}
```

[defer 原理](https://draveness.me/golang/docs/part2-foundation/ch05-keyword/golang-defer/)

defer 的使用 会创建一个结构体，该结构体的分配如下

* 堆上分配 1.1 ~ 1.12
    * 编译期将 defer 关键字被转换 runtime.deferproc 并在调用 defer 关键字的函数返回之前插入 runtime.deferreturn；
    * 运行时调用 runtime.deferproc 会将一个新的 runtime._defer 结构体追加到当前 Goroutine 的链表头；
    * 运行时调用 runtime.deferreturn 会从 Goroutine 的链表中取出 runtime._defer 结构并依次执行；
* 栈上分配 1.13
    * 当该关键字在函数体中最多执行一次时，编译期间的 cmd/compile/internal/gc.state.call 会将结构体分配到栈上并调用 runtime.deferprocStack；
* 开放编码 1.14 ~ 现在
    * 编译期间判断 defer 关键字、return 语句的个数确定是否开启开放编码优化；
    * 通过 deferBits 和 cmd/compile/internal/gc.openDeferInfo 存储 defer 关键字的相关信息；
    * 如果 defer 关键字的执行可以在编译期间确定，会在函数返回前直接插入相应的代码，否则会由运行时的 runtime.deferreturn 处理；

性能

* 堆上分配，性能最差，在新版go运行时中基本不会使用
* 栈上分配，性能相较堆上分配，性能提升 30% 左右
* 开发编码，性能极大提升，成本几乎可以忽略不计

开发编码触发条件

* 函数的 defer 数量少于或者等于 8 个；
* 函数的 defer 关键字不能在循环中执行；
* 函数的 return 语句与 defer 语句的乘积小于或者等于 15 个。

### 4、panic 和 recover

现象

* panic 只会触发当前 Goroutine 的延迟函数调用；
    * panic 会触发 defer 函数调用
    * 如果某个协程 panic，在主协程是无法捕捉到这个 panic 的，会导致整个协程退出
    * 要求每个协程都要有自己的捕捉 panic 的代码
* recover 只有在 defer 函数中调用才会生效；
* panic 允许在 defer 中嵌套多次调用；

现象例子

```go
package keyword

import (
	"fmt"
	"time"
)

func GoroutineWithPanic() {
	defer println("main goroutine")
	go func() {
		defer println("in sub goroutine")
		panic("")
	}()
	time.Sleep(1 * time.Second)

	// 只会输出 in sub goroutine
	// main 协程直接退出
}

func RecoverNotInDefer() {
	defer fmt.Println("main goroutine")
	if err := recover(); err != nil {
		fmt.Println(err)
	}
	panic("unknown err")
	// 只会输出 main goroutine
}

func PanicNested() {
	defer fmt.Println("in main")
	defer func() {
		defer func() {
			panic("panic again and again")
		}()
		panic("panic again")
	}()

	panic("panic once")
// in main
// --- FAIL: TestPanicNested (0.00s)
// panic: panic once
// 	panic: panic again
// 	panic: panic again and again [recovered]
// 	panic: panic again and again
}
```

panic 数据结构 [runtime._panic](https://draveness.me/golang/tree/runtime._panic)

```go
type _panic struct {
	argp      unsafe.Pointer  // 是指向 defer 调用时参数的指针；
	arg       interface{}  // 是调用 panic 时传入的参数；
	link      *_panic  // 指向了更早调用的 runtime._panic 结构；
	recovered bool  // 表示当前 runtime._panic 是否被 recover 恢复；
	aborted   bool  // 表示当前的 panic 是否被强行终止；

	pc        uintptr
	sp        unsafe.Pointer
	goexit    bool
}
```

panic 函数是如何终止程序的。编译器会将关键字 panic 转换成 `runtime.gopanic`，该函数的执行过程包含以下几个步骤：

* 创建新的 `runtime._panic` 结构并添加到所在 Goroutine _panic 链表的最前面；
* 在循环中不断从当前 Goroutine 的 _defer 中链表获取 `runtime._defer` 并调用 `runtime.reflectcall` 运行延迟调用函数；
* 调用 `runtime.fatalpanic` 中止整个程序；

需要注意的是，我们在上述函数中省略了三部分比较重要的代码：

* 恢复程序的 recover 分支中的代码；
* 通过内联优化 defer 调用性能的代码4；[runtime: make defers low-cost through inline code and extra funcdata](https://github.com/golang/go/commit/be64a19d99918c843f8555aad580221207ea35bc)
* 修复 [`runtime.Goexit`](https://draveness.me/golang/tree/runtime.Goexit) 异常情况的代码；[runtime: ensure that Goexit cannot be aborted by a recursive panic/recover](https://github.com/golang/go/commit/7dcd343ed641d3b70c09153d3b041ca3fe83b25e)

崩溃恢复现象

* 返回参数
    * 如果使用命名返回，则返回设定值
    * 否则返回零值
* recover 只能在 defer 一层函数中调用，否则不生效

```go
func PanicRecoverWithNameReturn() (a int32) {
	a = 1
	defer func() {
		recover()
	}()
	panic("")
}

func PanicRecoverWithReturn() (int32, string, *string) {
	defer func() {
		recover()
	}()
	s := "123"
	if true {
		panic("")
	}
	return 1, "123", &s
}

func RecoverExperiment() {
	a := PanicRecoverWithNameReturn()
	// 返回 1
	fmt.Println("return PanicRecoverWithNameReturn() = ", a)
	b1, b2, b3 := PanicRecoverWithReturn()
	// 返回 0, "", nil
	fmt.Println("return PanicRecoverWithReturn() = ", b1, b2, b3)
}
```

defer 原理

* 编译器会将关键字 recover 转换成 [`runtime.gorecover`](https://draveness.me/golang/tree/runtime.gorecover)
* 如果当前 Goroutine 没有调用 panic，那么该函数会直接返回 nil
* 如果存在 panic，它会修改 `runtime._panic` 结构体的 `recovered` 字段，[`runtime.gorecover`](https://draveness.me/golang/tree/runtime.gorecover) 函数本身不包含恢复程序的逻辑，程序的恢复也是由 [`runtime.gopanic`](https://draveness.me/golang/tree/runtime.gopanic)

总结程序崩溃和恢复的过程：

* 编译器会负责做转换关键字的工作；
    * 将 panic 和 recover 分别转换成 runtime.gopanic 和 runtime.gorecover；
    * 将 defer 转换成 deferproc 函数；
    * 在调用 defer 的函数末尾调用 deferreturn 函数；
* 在运行过程中遇到 gopanic 方法时，会从 Goroutine 的链表依次取出 _defer 结构体并执行；
* 如果调用延迟执行函数时遇到了 gorecover 就会将 _panic.recovered 标记成 true 并返回 panic 的参数；
    * 在这次调用结束之后，gopanic 会从 _defer 结构体中取出程序计数器 pc 和栈指针 sp 并调用 recovery 函数进行恢复程序；
    * recovery 会根据传入的 pc 和 sp 跳转回 deferproc；
    * 编译器自动生成的代码会发现 deferproc 的返回值不为 0，这时会跳回 deferreturn 并恢复到正常的执行流程；
* 如果没有遇到 gorecover 就会依次遍历所有的 _defer 结构，并在最后调用 fatalpanic 中止程序、打印 panic 的参数并返回错误码 2；

### 5、make 和 new

当我们想要在 Go 语言中初始化一个结构时，可能会用到两个不同的关键字 — make 和 new。

* make 的作用是初始化内置的数据结构，也就是切片、哈希表和 Channel；
* new 的作用是根据传入的类型分配一片内存空间并返回指向这片内存空间的**指针**；

以下两者等价

```go
i := new(int)

var v int
i := &v
```

其他参见：[博客](https://draveness.me/golang/docs/part2-foundation/ch05-keyword/golang-make-and-new/)

## 七、并发

### 1、Go 协程

Go 函数运行在 Go 协程中（称为 `goroutines`）。

协程是轻量级线程，与操作系统中线程是 多对1 的关系，相对于操作系统线程有如下优势：

* 切换成本低
* 内存占用小

Go 协程的特点

* 协程是 Go 语言的核心，Go 语言的命名来自于此
* 使用 `go` 关键词即可让任意一个函数在一个新的协程中运行
* Go 的 main 协程退出后，不会等待其他协程，进程直接退出（无法设置为 domain，需通过 chain 实现）
* [抢占式调度](https://zhuanlan.zhihu.com/p/30353139)
* [有栈协程实现](https://zhuanlan.zhihu.com/p/94018082)

例子

```go
package concurrent

import (
	"fmt"
	"time"
)

func fn1(p string) {
	fmt.Printf("fn1 p = %s\n", p)
}

func GoroutineExperiment() {
	go fn1("first")
	fmt.Println("main")
	go fn1("second")
	time.Sleep(200 * time.Millisecond) // 如果不 sleep fn1 没有得到运行
}
```

### 2、Go channel

channel 是 Go 提供的语言级协程通讯方式，是 Go 推荐的多协程协调通讯方式。

* 可以理解成阻塞消息队列
* channel 是并发安全的，支持多生产多消费

#### （1）通道初始化方式

* `ch := make(chan 消息类型)` 无缓冲通道
* `ch := make(chan 消息类型, 缓冲大小)` 有缓冲通道

#### （2）通道的读写

* 读
    * `data := <-ch` 阻塞读出（等待直到通道有数据）
    * `data, ok := <-ch` 阻塞读出 ok 表示通道是否关闭
        * 通道未关闭时 `ok = true` `data != 零值`
        * 通道关闭时 `ok = false` `data = 零值`
    * 多路复用 `select`
    * 利用 `select` + `time.Timer` 实现读超时
    * 利用 `select` + `default` 实现非阻塞读
    * 语法糖：循环读 `for data := range ch` 通道关闭退出循环
    * 读取并丢弃 `<- ch`
* 写
    * `ch <- data` 阻塞写入（直到通道有空间）
    * 多路复用 `select`
    * 利用 `select` + `time.Timer` 实现写超时
    * 利用 `select` + `default` 实现非阻塞写

注意：读写 `nil channel` 将永远阻塞

#### （3）单向通道与双向通道

* `var readOnlyChannel <-chan 消息类型 = ch` 只读通道，向只写通道读将抛出编译错误
* `var writeOnlyChannel chan<- 消息类型 = ch` 只写通道，向只读通道写将抛出编译错误

#### （4）关闭通道

* `close(ch)` 只能执行一次，再次关闭将触发 `panic`
* 获取是否关闭 `data, ok := <-ch` 阻塞读出 ok 表示通道是否关闭
    * 通道未关闭时 `ok = true` `data != 零值`
    * 通道关闭时 `ok = false` `data = 零值`
* 写入关闭的 `channel` 将触发 `panic`
* 读取关闭的 `channel` 立即返回零值
* `for range ch` 将推出循环

#### （5）无缓冲通道和缓冲通道

* 无缓冲通道
    * 创建方式 `ch := make(chan 消息类型)` 或 `ch := make(chan 消息类型, 0)`
    * 特点，对于一个未关闭的通道
        * 某协程向该通道发送一个消息将阻塞到，另一个协程取出该消息
        * 某协程从该通道读取一个消息将阻塞到，另一个协程发送一个消息
    * `cap` 和 `len` 函数返回均为 0
* 缓冲通道
    * 创建方式 `ch := make(chan 消息类型, 缓冲大小)` 且 缓冲大小 > 0
    * 特点，对于一个未关闭的通道
        * 某协程向该通道发送一个消息
            * 若该通道缓冲区已满，将阻塞到缓冲区有空间为止
            * 否则，直接返回
        * 某协程从该通道接收一个消息
            * 若该通道缓冲区是空的，将阻塞到缓冲区有数据为止
            * 否则，返回数据
    * `cap` 和 `len` 函数可以获取 缓冲通道的容量和数据长度

```go
	a3 := make(chan string, 2)
	a3 <- ""
	fmt.Println(cap(a3), len(a3))
```

#### （6）实现超时和非阻塞

* 通过 `select` 和 `time.Timer` 实现
* 通过 `select` 和 `default` 实现

#### （7）通道多路复用 select

go channel 类似于阻塞 IO，也存在阻塞，操作系统提供了 IO 多路复用功能，类似的 Go 语言为 channel 提供了多路复用功能

（多路复用：将多个 阻塞 聚合在一个阻塞点）

基本语法

```go
select {
case 读写channel:
    操作
case 读写channel:
    操作
default: // 可选
    操作
}
```

select 只会执行一次，如果需要多次，一般需要使用 for 循环包裹

```go
for {
    select {
    // ...
    }
}
```

如果 `select` 包含 `default` 分支，则实现非阻塞效果，即，当其他 `case` 分支没有数据时，执行 `default` 分支

```go
select {
case ad := <- a:
    fmt.Println(ad)
default:
    fmt.Println("default")
}
```

如果 `select`中同时有多个 channel 就绪，则只会处理最上面就绪的那一个（可以理解成 每个 `case` 都加了 `break`）

```go
func selectMultiChannel(a <-chan string, b <-chan string){
	for i := 0; i< 10; i++ {
		select {
		case ad := <- a:
			fmt.Println(i, ad)
		case bd := <- b:
			fmt.Println(i, bd)
		}
	}
}
func Chanvar() {
	a := make(chan string, 1)
	b := make(chan string, 1)
	b <- "b"
	a <- "a"
    go selectMultiChannel(a, b)
	// 输出
	// 0 a
	// 1 b
	time.Sleep(1000 * time.Microsecond)
}
```

利用 `time.Timer` 可以实现等待超时效果

```go
func channelTimeout(a <-chan string) {
	select {
	case ad := <- a:
		fmt.Println(ad)
	case <- time.After(500 * time.Millisecond):
		fmt.Println("Timeout")
	}
}
func Chanvar() {
	a2 := make(chan string, 1)
	go channelTimeout(a2)
	time.Sleep(600 * time.Millisecond)
	// 输出 Timeout
	a2 <- "message a"
	time.Sleep(100 * time.Millisecond)
}
```

select 还允许 多路复用 写入消息

```go
func selectWriteChannel(a chan<- string) {
	select {
	case a <- "从 select中写入 a":
		fmt.Println("写入 a 成功")
	default:
		fmt.Println("Default 写入 a 失败")
	}
}

	a3 := make(chan string, 2)
	go selectWriteChannel(a3)
	time.Sleep(100 *time.Millisecond)
	fmt.Println(cap(a3), len(a3))
	go selectWriteChannel(a3)
	time.Sleep(100 *time.Millisecond)
	fmt.Println(cap(a3), len(a3))
	go selectWriteChannel(a3)
	time.Sleep(100 *time.Millisecond)
	fmt.Println(cap(a3), len(a3))
	// 输出
	// 写入 a 成功
	// 2 1
	// 写入 a 成功
	// 2 2
	// Default 写入 a 失败
	// 2 2
```

#### （8）实现原理

> [Go 语言设计与实现 - 6.4 Channel](https://draveness.me/golang/docs/part3-runtime/ch06-concurrency/golang-channel/)

* 对于有缓冲的 Channel，数据队列是通过数组实现的循环队列，内存预分配 （`mallocgc` 分配内存）

### 3、标准库提供并发工具

> 主要位于 `sync` 和 `atomic` 包

Go 提供了静态条件检查器，通过 `-race` 开启检查，go build，go run，go test 支持

#### （1）锁系列

优先考虑使用 Channel ，Channel 无法实现时，才需要使用如下的锁。

锁一般用于共享内存的保护，Go 会遵循 Happen Before 原则，但 Go 没有 `volatile`，因此必须为共享变量添加锁保护，这样 Go 才能生成正确的内存屏障代码

`sync.Mutex`

* 互斥锁，不可重入
* 核心 API 为
    * `Lock()`
    * `Unlock()`
* 开发模式，`Lock()` 后，紧接着 `defer Unlock()`，需要注意防止锁粒度过大（可以抽成一个函数）

`sync.RMutex` 读写锁

* 读写锁
* 核心 API 为
    * `RLock()` 加一个读锁，存在读锁时，阻塞，否则加锁成功
    * `RUnlock()` 解锁一个读锁
    * `Lock()` 加一个写锁，存在读锁或写锁时，阻塞，否则加锁成功
    * `Unlock()` 解一个写锁
    * `RLocker()` 返回满足 `Locker` 接口的读锁（用来分离一个读锁对象）

#### （2）`sync.Once`

保证 一个函数只被执行一次，可以用于延迟加载和单例（所有只允许执行一次的场景）。核心API为：

* `Do(func)`

```go
package concurrent

import (
	"fmt"
	"sync"
)

var i int32 = 0
var iOnce sync.Once

func InitI() {
	i = 1
	fmt.Println("init I = 1")
}

func SyncOnce() {
    // InitI 被执行1次
	iOnce.Do(InitI)
	fmt.Println(i)
	iOnce.Do(InitI)
	iOnce.Do(InitI)
	iOnce.Do(InitI)
}
```

注意：不要在在 `Once.Do(func)` 的 func 中对 Once 进行赋值

```go
package main

import (
	"sync"
)

var once sync.Once

func main() {
    once.Do(func() {
        once = sync.Once{}
    })
}
```

#### （3）`sync.WaitGroup`

WaitGroup 用于等待一组 goroutine 结束，核心 API

* `Add(int)` 等待 goroutine 的个数
* `Done()` 一个 goroutine 完成了
* `Wait()` 阻塞等待所有 goroutine 完成

例子

```go
func SyncWaitGroup() {
	var wg sync.WaitGroup
	wg.Add(10)
	for i := 0; i < 10; i++ {
		go func(i int) {
			fmt.Println(i)
			time.Sleep(10 * time.Millisecond)
			wg.Done()
		}(i)
	}
	wg.Wait()
	fmt.Println("wait finish")
}
```

#### （4）`sync.Cond` 条件变量

一个协程在 某个条件变量 处阻塞等待；另一个协程在满足某些条件下，可以唤醒等待在该条件变量处的协程

条件变量会关联一个 `Locker`，当调用 `Wait` 时 必须加锁

API 如下

* `func NewCond(l Locker) *Cond`
* `func (c *Cond) Broadcast()` 唤醒所有等待的协程，可以加锁，也可以不加锁。
* `func (c *Cond) Signal()` 唤醒一个协程，可以加锁，也可以不加锁。Signal()通知的顺序是根据原来加入通知列表 `Wait()` 的先入先出
* `func (c *Cond) Wait()` 阻塞等待通知，调用前必须加锁，调用后阻塞后锁会释放，被唤醒后，锁会重新获得

为什么需要 `Broadcast` ？会唤醒全部，谁可以执行取决于对锁的竞争，而`Signal` 按照 FIFO 顺序唤醒

#### （5）`sync.Pool` 临时对象池

参考：

* https://my.oschina.net/u/115763/blog/282376
* https://www.cnblogs.com/qcrao-2018/p/12736031.html#gc

一个sync.Pool对象就是一组临时对象的集合。Pool是协程安全的。

* 用于池化无状态大对象（不适合连接池），比如大字节数组，可以比每次使用都申请一个提升效率
* 持有的对象是弱引用，如果只有Pool中有该对象的引用，则可能在 GC 使被销毁

API

* 创建一个 Pool `var bufPool = sync.Pool{New: func() interface{} { return new(bytes.Buffer) },}` 这个 New 就是构造函数
* `func (p *Pool) Get() interface{}` 获取一个对象，如果没有则调用 `New` 函数创建一个，该对象的引用将从 Pool 中移除
* `func (p *Pool) Put(x interface{})` 将对象放回 `Pool` 中，以供下次使用

例子

```go
func SyncPool() {
	var bytePool = sync.Pool{
		New: func() interface{} {
			fmt.Println("New")
			return make([]byte, 1024)
		},
	}

	bytePool.Get()
	ba := bytePool.Get()
	bytePool.Put(ba)
	bytePool.Get()
	// 输出
	// New
	// New
}
```

#### （6）atomic 包

atomic是最轻量级的锁（位于标准库 ``），比如 CAS 指令提供对常用变量的原子操作，包括如下几类

* 增或减
* 比较并交换
* 载入
* 存储
* 交换

例子

```go
func Atomic(){
	var a int32 = 1
	atomic.AddInt32(&a, 1)
	fmt.Println(a)
}
```

### 4、Context 控制协程

> [博客1](https://www.flysnow.org/2017/05/12/go-in-action-go-context.html)
> [Go 语言设计与实现 - 6.1 上下文 Context](https://draveness.me/golang/docs/part3-runtime/ch06-concurrency/golang-context/)

`context.Context` 是 Go 中用来控制协程树的接口，具有如下功能

* 使用 `withXxx(parent)` 系列函数可以构造一颗 `Context` 树
* 在对某个 `Context` 调用 `cancel` 函数，则可以结束当前 `Context` 及子孙 `Context`
* 可以在创建 `Context` 时，为该 `Context` 绑定一对 KV （少用），所有子孙 `Context` 可以通过 Key 查询自己及祖宗节点的 Value
* 标准库提供，存在多种单一功能的 Context，通过 `withXxx(parent)` 创建
    * 具有超时或者定时取消功能的 `Context`
    * 绑定一对 KV

`context.Context` 相关API

* 根 Context
    * `context.Background()` 是上下文的默认值，所有其他的上下文都应该从它衍生（Derived）出来
    * `context.TODO()` 应该只在不确定应该使用哪种上下文时使用
* 传递一个 父 Context 创建一个新的 `Context`
    * `func WithCancel(parent Context) (ctx Context, cancel CancelFunc)` 创建一个可取消的 `Context` 调用 `cancel` 返回值即可取消子孙 Context
    * `func WithDeadline(parent Context, deadline time.Time) (Context, CancelFunc)` 创建一个可取消的 `Context`，调用 `cancel` 返回值即可取消子孙 Context，同时在 deadline 时刻自动取消
    * `func WithTimeout(parent Context, timeout time.Duration) (Context, CancelFunc)` 创建一个可取消的 `Context`，调用 `cancel` 返回值即可取消子孙 Context，同时在 timeout 后自动取消
    * `func WithValue(parent Context, key, val interface{}) Context` 创建一个 `Context` 附加一个值
* `context.Context` 接口函数语义
    * `Deadline() (deadline time.Time, ok bool)` 获取设置的截止时间（如果当前 Context 和 祖宗 Context 设置了）。
        * 如果设置了截止时间，第一个返回值是截止时间，到了这个时间点，Context会自动发起取消请求；第二个返回值 `ok == true`
        * 如果没有设置截止时间，返回零值（`ok == false`）
    * `Done() <-chan struct{}` 获取一个只读 Channel，调用多次返回一样的值，如果当前 Context 或 祖宗 Context 取消了，则该 Channel 将被关闭，直接返回（结合 select 即可实现协程树控制）
    * `Err() error` 返回当前 Context 或 祖宗 Context 是否取消
        * 未取消：返回 nil
        * 到达Deadline而取消：返回 `context deadline exceeded`
        * 手动调用 Cancel：返回 `context canceled`
    * `Value(key interface{}) interface{}` 当前 Context 或 祖宗 Context 上绑定的值

### 5、协程调度器

Go 协程与线程是一对多的关系，目前

* Go 会启动和 CPU 数目一致的线程
* 每个协程固定属于一个线程，每个线程有多个协程，每个线程有一个处理器，持有线程和协程（即 G-M-P 模型 GMP）
    * G 协程
    * M 线程
    * P 处理器 调度器的内部实现
* 目前 Go 协程支持一定程度的[抢占调度](https://draveness.me/golang/docs/part3-runtime/ch06-concurrency/golang-goroutine/#%E6%8A%A2%E5%8D%A0%E5%BC%8F%E8%B0%83%E5%BA%A6%E5%99%A8)
    * `v1.2 ~ v1.13`，原理是通过在函数调用前插入检查和切换代码（基于协作的抢占式调度），如果没有函数调用可能发生无法进行抢占切换。
    * `v1.14` 及之后，通过在 G 结构体中添加一系列变量并注册了信号量，在触发垃圾回收时，触发信号量进行检查和调度（基于信号的抢占式调度）
    * 未来，[参考](https://draveness.me/golang/docs/part3-runtime/ch06-concurrency/golang-goroutine/#%E9%9D%9E%E5%9D%87%E5%8C%80%E5%86%85%E5%AD%98%E8%AE%BF%E9%97%AE%E8%B0%83%E5%BA%A6%E5%99%A8)
* 调度时间点
    * 主动挂起 — runtime.gopark -> runtime.park_m
    * 系统调用 — runtime.exitsyscall -> runtime.exitsyscall0
    * 协作式调度 — runtime.Gosched -> runtime.gosched_m -> runtime.goschedImpl
    * 系统监控 — runtime.sysmon -> runtime.retake -> runtime.preemptone

更多[参见](https://draveness.me/golang/docs/part3-runtime/ch06-concurrency/golang-goroutine/)

### 6、IO

* go 封装了非阻塞 IO + 多路复用器（epoll）实现IO操作实现，被封装到 `runtime.netpoll` 下（包括文件 I/O、网络 I/O 和计时器）

### 7、系统监控

* Go 存在一个 sysmon 系统监控 死循环运行在后台，独占一个系统线程（也就是说 一个 Golang 程序最少启动两个操作系统线程，一个 sysmon 线程 ，一个用户代码线程）
* sysmon 可能会启动更多的线程，用户配置的 `GOMAXPROCS` 只是 GMP 的数目，sysmon 有可能会启动更多的线程
* sysmon 的功能
    * checkdead ?
    * 运行计时器 — 获取下一个需要被触发的计时器；（可能启动新的线程）
    * 轮询网络 — 获取需要处理的到期文件描述符；
    * 抢占处理器 — 抢占运行时间较长的或者处于系统调用的 Goroutine；
    * 垃圾回收 — 在满足条件时触发垃圾收集回收内存；

参见 [博客](https://draveness.me/golang/docs/part3-runtime/ch06-concurrency/golang-sysmon/)

## 八、内存管理

> [可视化Go内存管理](https://tonybai.com/2020/03/10/visualizing-memory-management-in-golang/)

### 1、内存分配器

> [Go 语言设计与实现 - 7.1 内存分配器](https://draveness.me/golang/docs/part3-runtime/ch07-memory/golang-memory-allocator/)
> 内存分配器，不需要考虑垃圾回收的内容，内存分配器即使在 C/C++ 这样的底层语言同样存在

#### （1）虚拟内存和物理内存

> 详见《操作系统》

内存是计算机中最重要的资源之一。决定计算机内存大小的上限的是内存地址的位数。

内存地址是定位内存中一个字节数据存储位置的唯一标识。

如果把内存理解为一个字节数组，而内存地址就是这个字节数组的下标。可以计算得出，如果内存地址的位数为 32 则，该内存最大容量为 `2^32` 字节，即 `4G`。类似的目前主流的内存地址位数为 `64` 因此内存的最大容量为 `2^64` 字节，及 `4 * 2^32 G`。

任何编程语言编写程序在最终都会以机器码的形式在 CPU 中运行。对内存的访问都需要给予明确的内存地址。

但是一般设备的内存大小都不能达到理论最大内存。因此如果程序对内存的访问直接访问物理内存，则可能带来的结果是，当内存发生变化时，需要重新编译程序。

为了方便程序的运行，操作系统配合硬件，为程序的内存访问提供了一个抽象层——虚拟内存空间。

这个虚拟内存空间的内存范围为固定的 `0 ~ 2^位数`。这样所有的程序都可以以一个统一的标准生成机器代码，有了更好的兼容性，减少了复杂度，就好像每个程序的进程独占整个机器一样。

而虚拟内存地址如何对应到物理内存之间，就是操作系统所关心的事情了。

因此可以得到一个结论：在运行在现代操作系统中的程序中，对内存的访问实际上访问的都是虚拟内存空间

#### （2）进程内存区域的布局

根据上文提到的，进程[内存区域的布局](https://blog.csdn.net/qq_38600065/article/details/104864413)指的是虚拟内存的布局。

* 代码段 通常存放程序中的代码和常量（低地址）
* 数据段 通常存放程序中的初始化后的全局变量和静态变量。
* BSS段 通常存放程序中的未初始化的全局变量和静态变量
* 栈    通常用来存放程序运行时的栈帧，包含局部变量、函数形参、数组、函数返回值、返回地址等等（由低地址向高地址申请使用）
* 文件映射
* 未定义
* 栈   通常用来存放程序中进行运行时被动态分配的内存段（由高地址向低地址申请使用）
* 内核空间 （高地址）

#### （3）用户程序向操作系统申请内存

由于虚拟地址空间的存在，因此申请和释放内存是需要进行 系统调用 实现的。

运行时，栈（线程栈）的最大大小在运行时一般是固定，在运行时管理也比较简单，因此内存分配主要是堆内存的管理

堆内存的申请在操作系统层面的系统调用会落实到 `brk` 或 `mmap` 系统调用。该系统调用仅仅是移动下堆指针的值（`mm_struct.brk`，也就是说堆内存只能线性扩大缩小）

更多参见： [Linux内存分配小结--malloc、brk、mmap](https://blog.csdn.net/gfgdsg/article/details/42709943)

#### （4）编程语言的内存管理

在 Linux 中系统调用一般是相对昂贵的操作，且 `brk` 系统调用无法满足复杂的堆内存管理功能。因此一个编程语言在其标准库（C 语言的 glibc 的 [ptmalloc](https://blog.csdn.net/z_ryan/article/details/79950737)）或者运行时（Go 运行时的[内存管理器](https://draveness.me/golang/docs/part3-runtime/ch07-memory/golang-memory-allocator/)），必须提供堆内存管理的能力。

更多参见

* [Linux内存的工作（malloc，brk系统调用和mmap系统调用）](https://blog.csdn.net/qq_41754573/article/details/104439527)
* [内存管理器](https://draveness.me/golang/docs/part3-runtime/ch07-memory/golang-memory-allocator/)

内存屏障和可见性

### 2、垃圾回收

TODO

### 3、栈空间管理

> [Go语言的栈空间管理](https://zhuanlan.zhihu.com/p/28484133)

* 每个协程最小分配 2KB 空间
* 当栈空间不够时，自动扩容（创建一个新的空间然后数据拷贝过去）
* 因此 Go 的协程栈的栈低指针会发生变化，和 C 语言线程栈栈低指针不变完全不同
* 协程栈和线程栈不同，协程栈是在堆中模拟实现的栈

逃逸分析

* 函数中的变量，Go 编译时会根据其在函数结束后是否继续被使用，而选择分配在栈上还是堆上
    * 如果是，则说明发生了逃逸，分配到堆上
    * 否则，说明没有逃逸，分配到栈上

其他TODO

## 九、Docs、编译、devops和常见命令

### 0、导入路径（import path）

> [官方文档](https://golang.org/cmd/go/#hdr-Import_path_syntax)

在Go源码中 `import "xxx"` 中的 `xxx` 称为导入路径。

* 导入路径核心功能
    * 指示 go get 如何从网络上下载软件包
    * 下载下来存放在 `$GOPATH/src` 中的什么位置
* 导入路径语法
    * 相对路径（不推荐），以 `./` 或 `../` 开头
    * 远端导入路径 `host/path1/path2/path3...`
        * `host/path1` 必须存在 `path1` 一般是 namespace 或者 org
        * `path2` 是可选的一般是仓库名
        * `path3` 是可选的仓库中的目录

go get 如何从 远端导入路径 下载包大概流程（不考虑go module 模式）

* 访问 `https://导入路径前缀`
* 获取 `<meta name="go-import" content="import-prefix vcs repo-root"`，例如 `<meta name="go-import" content="gorm.io/gorm git https://github.com/go-gorm/gorm">`
* 使用 vsc 去 repo-root 去拉代码，并保存在 `$GOPATH/src/导入路径前缀` 中

实现 导入路径 和 git 路径不同

* 参考 `https://gorm.io/gorm` 的 `<meta name="go-import" content="gorm.io/gorm git https://github.com/go-gorm/gorm">`

go module 中的 goproxy

* 参考 `go help goproxy`

### 1、常见命令

> [官方文档](https://golang.org/cmd/go/)
> [极客（版本较老）](https://wiki.jikexueyuan.com/project/go-command-tutorial/0.1.html)

包含在 `go` 的子命令中，格式一般为

```bash
go subcommand [arg]
```

go 命令路径

* go 命令的相对路径 如 `go build github.com/rectcircle/go-improve` 是相对于 `GOPATH` 和 `GOROOT`，不是常规的 `pwd`
* go 命令的绝对路径 如 `go build ./basic` 相当于 `$(pwd)/./basic`
* 路径可以是一个 go 文件，也可以是一个 go package（目录）
* 对整个项目实施命令 `./...`

module-aware mode 指 go mod 模式，在 module-aware mode 启用和禁用时 go 的命令的行为会有不同。

module-aware mode 开启的情况如下

|                           | 当前目录或祖宗目录包含 go.mod | 当前目录或祖宗目录**不**包含 go.mod |
| ------------------------- | ----------------------------- | ----------------------------------- |
| GO111MODULE= "" 或 "auto" | ✅                             | ❌                                   |
| GO111MODULE= "off"        | ❌                             | ❌                                   |
| GO111MODULE= "on"         | ✅                             | ✅                                   |

#### go env

* 查看 Go 环境变量 `go env`
* 设置 Go 环境变量 `go env -w name=value`

#### go run

运行一个main包的main函数

#### go test

> 详见：[Go Test 详解](/posts/go-test#go-test命令)

基本用法

```bash
go test 路径
```

常用参数

* `-v` 输出测试细节，包括测试手动打的日志等
* `-timeout 30s` 超时时间
* `-run ^Test_parseArgs$` 指定运行的测试函数名的正则表达式
* `-bench regexp` 通过正则表达式执行基准测试，默认不执行基准测试。可以使用 `-bench .` 或 `-bench=.` 执行所有基准测试。
* `-benchtime t` 每个基准测试迭代的时间默认 `1s
* `-count n` 运行每个测试和基准测试的次数（默认 1），如果 -cpu 指定了，则每个 GOMAXPROCS 值执行 n 次
* `-cover` 开启覆盖分析，开启覆盖分析可能会在编译或测试失败时，代码行数不对。
* `-covermode set,count,atomic` 覆盖分析的模式，默认是 set，如果设置 -race，将会变为 atomic
    * set，bool，这个语句运行吗？
    * count，int，该语句运行多少次？
    * atomic，int，数量，在多线程正确使用，但是耗资源的。
* `-coverpkg pkg1,pkg2,pkg3` 指定分析哪个包，默认值只分析被测试的包，包为导入的路径。

常见用法

```bash
# 运行当前目录下的全部包的全部单元测试
go test ./...
# 运行 $GOPATH 下的全部单元测试
go test ...
# This should run all tests with import path prefixed with foo/:
go test foo/...
# This should run all tests import path prefixed with foo
go test foo...
```

#### go build install

* `go build` 用于测试编译包，在项目目录下生成可执行文件（必须有main包）。
* `go install` 主要用来生成库和工具
    * 一是编译包文件（无main包），将编译后的包文件放到 pkg 目录下（$GOPATH/pkg）需满足：**项目目录必须在 GOPATH 下**。
    * 二是编译生成可执行文件（有main包），将可执行文件放到 bin 目录（$GOPATH/bin）。

go build 常见参数

* `-o` 指定编译输出的路径及名称
* `-i` 安装依赖包到 `$GOPATH/pkg`，默认不会
* `-a` 强制重新构建，不使用缓存的 pkg 文件（强行对所有涉及到的代码包（包含标准库中的代码包）进行重新构建，即使它们已经是最新的了。）
* `-v` 打印出那些被编译的代码包的名字。
* `-n` 打印编译期间所用到的其它命令，但是并不真正执行它们。
* `-p n` 指定编译过程中执行各任务的并行数量（确切地说应该是并发数量）。在默认情况下，该数量等于CPU的逻辑核数。
* `-race` 开启竞态条件的检测。不过此标记目前仅在linux/amd64、freebsd/amd64、darwin/amd64和windows/amd64平台下受到支持。
* `-work` 打印出编译时生成的临时工作目录的路径，并在编译结束时保留它。在默认情况下，编译结束时会删除该目录。
* `-x` 打印编译期间所用到的其它命令。注意它与-n标记的区别。

go build 常用用法

```bash
# 构建当前目录下的 main 包下的 main 函数，在当前目录(pwd)生成可执行文件，文件名为目录名，
go build  # 等价于 go build ./
# 构建某目录下的 main 包下的 main 函数，在当前目录(pwd)生成可执行文件，文件名为目录名
go build dirpath #  package path
# 构建某些源代码文件，在当前目录(pwd)生成可执行文件，文件名为包含main函数的源代码文件名
# 主要用来构建一些小脚本文件
# 限制：源代码文件必须包含一个 main 函数，必须是 main 包，所有main函数依赖的函数所在的文件必须手动写在命令里，所有文件必须在同一路径下
go build filepath1 filepath2
```

go install 命令只比 go build 命令多做了一件事，即：安装编译后的结果文件（静态链接文件安装到 GOPATH 的 `pkg` 目录，**项目目录必须在 GOPATH 下**）到指定目录。

参数和 go build 常见参数 类似

```bash
# 那么命令将试图编译当前目录所对应的代码包
go install  # 等价于 go install ./
# 强制重新编译，并输出编译的包内容
go install -a -v -work
```

#### go get

禁用 module-aware mode 模式（传统 Legacy GOPATH）

帮助：`go help gopath-get`

基本使用：`go get [-d] [-f] [-t] [-u] [-v] [-fix] [-insecure] [build flags] [packages]`

使用效果：

* 将源代码下载到 `$GOPATH/src`
* 如果 `packages` 是 main 包，且包含 main 函数，将会 编译安装可执行文件到 `$GOPAHT/bin` 下，文件名为 `packages` 的目录名

标志：

* go get 特有标志
    * `-d` 下载软件包后停止；也就是说，它指示不要安装软件
    * `-u` 检查更新软件包。默认情况下，只会下载，不会更新
    * `-f` ？？？
    * `-fix` 让命令程序在下载代码包后先执行修正动作，而后再进行编译和安装。
    * `-insecure` 允许命令程序使用非安全的scheme（如HTTP）去下载指定的代码包。如果你用的代码仓库（如公司内部的Gitlab）没有HTTPS支持，可以添加此标记。请在确定安全的情况下使用它。
    * `-t` 让命令程序同时下载并安装指定的代码包中的测试源码文件中依赖的代码包。
* 通用标志
    * -`v` 启用详细进度和调试输出。

启用 module-aware mode 模式（Go mod 模式），类似于上面，差别在于

* 按照 Go Module 规则选择要下载的版本
* 代码下载到 `$GOPATH/pkg/mod` 下

#### go fmt vet fix

检查与格式化系列命令

格式化文档：`usage: go fmt [-n] [-x] [packages]`

* `-n` 仅打印出内部要执行的go fmt的命令
* `-x` 命令既打印出go fmt命令又执行它，如果需要更细化的配置，需要直接执行 gofmt 命令

例子

```bash
# 格式化整个项目，并输出格式化了那些文件
go fmt -x ./...
```

当 Go 版本升级后，API发生变更后，提示修复问题：`go fix [packages]` 对源代码进行更新

代码静态检查：`go vet [-n] [-x] [-vettool prog] [build flags] [vet flags] [packages]`

#### go clean

remove object files and cached files

#### go list

列出软件包或模块，[参考](https://wiki.jikexueyuan.com/project/go-command-tutorial/0.8.html)

* `go list -m all` 查看主模块和其依赖

#### go mod

* `go mod init` 创建 `go.mod` 文件到当前目录
* `go mod tidy` 下载项目依赖的第三方库，同时会去掉不相关的库
* `go mod graph` 打印依赖图
* `go mod why` explain why packages or modules are needed
* `go mod vendor` make vendored copy of dependencies

#### go tool

其他常用工具

TODO

#### 其他命令

TODO

golint

### 2、条件编译

### 3、交叉编译

### 4、文档注释

https://blog.golang.org/godoc

https://github.com/fluhus/godoc-tricks

### 5、特殊注释

https://blog.jbowen.dev/2019/09/the-magic-of-go-comments/

### 6、元编程之代码生成

### 7、编写测试

> 详见：[Go Test 详解](/posts/go-test#go-标准库-testing-包-和-go-test-命令)

* 需要测试的文件为 `main.go`
* 在源文件所在目录创建 `main_test.go` 文件

#### （1）单元测试

若要为 `func Add(a, b int) int` 创建单元测试，函数声明为 `func TestAdd(t *testing.T)`，`t.Errorf` 等方法可以报告失败

```go
package xxx

import "testing"

func TestAdd(t *testing.T) {
	type args struct {
		a int
		b int
	}
	tests := []struct {
		name string
		args args
		want int
	}{
		{
			"case1",
			args{
				1,
				1,
			},
			2,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := Add(tt.args.a, tt.args.b); got != tt.want {
				t.Errorf("Add() = %v, want %v", got, tt.want)
			}
		})
	}
}
```

#### （2）基准测试

若要为 `func Add(a, b int) int` 创建基准测试，函数声明为 `func BenchmarkAdd(b *testing.B)`

```go
func BenchmarkAdd(b *testing.B) {
	for i := 0; i < b.N; i++ {
		Add(1, i)
	}
}
```

输出

```go
pkg: github.com/rectcircle/go-improve/gocmd
BenchmarkAdd
BenchmarkAdd-4   	1000000000	         0.292 ns/op	       0 B/op	       0 allocs/op
```

* 表示循环了 1000000000 次（10亿）
* 每次循环凭据花费 0.292 纳秒
* allocs/op 表示每个操作发生了多少个不同的内存分配(单次迭代)。
* B/op 是每个操作分配了多少字节

## 十、Go 标准库

### 0、常用工具库

### 1、Socket和IO

https://tiancaiamao.gitbooks.io/go-internals/content/zh/08.1.html

### 2、HTTP

http

注意事项

```
    resp, err := http.Get(url)
    if err != nil {
       return "", err
    }
    defer resp.Body.Close()
```

### 3、JSON

### 4、SQL

### 5、子进程 和 Terminal 编程

## 十一、项目结构

### 1、开源项目项目结构

https://github.com/golang-standards/project-layout/blob/master/README_zh.md

### 2、企业级后端项目结构

### 3、RESTful 项目结构

> [RESTful 项目结构](https://github.com/bxcodec/go-clean-arch)

暂时记录一下：[一站式解决方案（并未强调项目结构）](https://github.com/ribice/gorsk)

[Robert C. Martin 的 The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) 的一些规则

* 独立于框架。该体系结构不依赖于某些功能丰富的软件库的存在。这使您可以将这些框架用作工具，而不必将系统塞入有限的约束中。
* 可测试性。可以在不使用UI，数据库，Web服务器或任何其他外部元素的情况下测试业务规则。
* 独立于UI。UI可以轻松更改，而无需更改系统的其余部分。例如，可以在不更改业务规则的情况下用控制台UI替换Web UI。
* 独立于数据库。您可以将Oracle或SQL Server换成Mongo，BigTable，CouchDB或其他东西。您的业务规则未绑定到数据库。
* 独立于任何外部机构。实际上，您的业务规则根本对外界一无所知。

现阶段，代码结构划分，最终都只会落地到分文件和分目录上。其中目录是最重要的划分方式。而目录的划分是一维而非多维的。这就引出一个问题，代码目录结构是先分业务还是先分层

例子一个简化的博客系统有 `user` 业务和 `article` 业务。分层 按照 controller、service、repository、model进行

若 先业务再分层，则，结构可能是

* `user`
    * `controller`
    * `service`
    * `repository`
    * `model`
* `article`
    * `controller`
    * `service`
    * `repository`
    * `model`

若 先分层再业务，则，结构可能是

* `controller`
    * `user`
    * `article`
* `service`
    * `user`
    * `article`
* `repository`
    * `user`
    * `article`
* `model`
    * `user`
    * `article`

在目前流行的微服务体系来看 `先分实体再分层` 可能更适合微服务

#### 代码目录划分推荐方案

更好的方案可能是结合两者的优缺点，结合来进行分层

* `domain` （`model`）
    * `mocks`
    * `user`
    * `article`
* `user`
    * `delivery`（`controller`）
        * `http`
    * `usecase` （`service`）
    * `repository`
        * `mysql`
* `article`
    * `delivery`（`controller`）
        * `http`
    * `service`
    * `repository`
        * `mysql`

说明

* 层次
    * `domain` 层：主要是传统的 `model`，除了包含传统的 `model` 信息外，还包含，`service` 和 `repository` 的接口声明，这样做的好处是，更加内聚，看这个一个文件即可理解业务的大部分内容
        * `mocks` 针对接口的 mock
    * `delivery` 层：就是传统的 `controller`，表示交付
        * `http` 为 HTTP 交付所需要的组件包含 Router （Controller）和 中间件等
    * `usecase` 层：就是传统的 `service`，表示用例，业务逻辑的核心
    * `repository` 层：与数据库交互
        * `mysql`  MySQL 的实现
* `domain` 为先层次再按业务划分，原因是，其他层次都需要依赖该层
* 其他都是，先业务再按分层，这样可以使逻辑更内聚，减少阅读代码时的反复跳转

#### 如何进行组合

为了实现各个模块各个层次的可测试性

* 所有层次的代码都必须 声明接口，并在 struct 上实现，struct 的成员必须是 其依赖的 下一层次的 接口
* 组合有两种方案
    * 方式1：每个层次导出一个实例化全局单例对象，在 init 中进行初始化（比较推荐）
        * 优点：main 函数比较简单
        * 缺点：切换某实现，需要更改多个文件
    * 方式2：所有的逻辑都在 main 函数入口中进行组合和构建，并提供一个 NewXxx 函数
        * 优点：可以无感的替换实现（比如无感切换 SQL 数据库实现）
        * 缺点：main 函数比较复杂
