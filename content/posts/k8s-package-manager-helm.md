---
title: "Kubernetes 包管理器 Helm"
date: 2022-05-20T22:07:33+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> 版本: 3.8.2 | [官方文档](https://helm.sh/zh/docs/)

## 简述

Helm 是 Kubernetes 的包管理器，是 [CNCF](https://www.cncf.io/projects/) 的毕业项目之一。

和 传统的包管理器类似（apt / npm / maven），Helm 提供了一个 CLI 客户端，定义并提供了 Helm Chart [包管理仓库](https://artifacthub.io/) （Chart 指的是包）。

Helm 在 Kubernetes 看来和 Kubectl 类似，仅仅是一个 Client。因此 Helm 不需要 Kubernetes 做任何特殊了配置，即可在任何 Kubernetes 集群中使用。

Helm 的核心，定义了一套渲染 Kubernetes 声明式配置 的模板规范，并通过模板引擎实现了该规范。

作为一个运行在 Kubernetes 的应用开发者，只需要为该应用编写一个 Chart：Kubernetes 声明式配置模板、模板参数和默认值 和 外部依赖（如 MySQL、Redis），即可一键在 Kubernetes 集群中将该应用和依赖启动起来，并可以根据通过 Chart 参数灵活的配置应用。

```
                +------------------------+
                |    Chart Repository    |
                +------------------------+
            +-->|     Dependency A       |---+
            +-->|     Dependency B       |---+
            |   +------------------------+   |
      (dependency)                           |
            |   +------------------------+   |
            |   |      Chart: App        |---+
            |   +------------------------+   |
            |   |      /templates        |   |
            |   |      values.yaml       |   |
            +---|      Chart.yaml        |   |
                +------------------------+   |
                                             |
    Deploy                                   +---(Go template engine)---> Kubernetes Configurations ------> Kubernetes Clusters (Release)
(helm install)                               |
                                             |
                +------------------------+   |
                |     Release Values     |---+
                +------------------------+
                | --set-file values.yaml |
                | --set foo=bar          |
                +------------------------+
```

上图所示的是，对一个 Chart 进行部署的流程。

* Chart App 定义了一个 Chart，其依赖两个在 Chart Repository 中的两个 Chart。
* 用户通过 `helm install` 命令进行一次部署，并通过 `--set-file` 和 `--set` 覆盖 Chart App 中的参数。
* Helm CLI 通过 Go 模板引擎将 Values 和 Templates 进行渲染，得到 Kubernetes 配置。
* 最后通过 Kubernetes API （类似于 kubectl apply） 将配置应用到 Kubernetes 集群中。
* Chart 在 Kubernetes 集群中的对应物被称为一个 Release。

## Helm CLI 安装

> 官方文档：[安装 Helm](https://helm.sh/zh/docs/intro/install/)

安装指定版本和系统架构，参见：[github release](https://github.com/helm/helm/releases)。

以 dockerfile 为例：

```dockerfile
RUN wget https://get.helm.sh/helm-v3.8.1-linux-amd64.tar.gz && \
    tar -zxvf helm-v3.8.1-linux-amd64.tar.gz &&  \
    mv linux-amd64/helm /usr/local/bin/helm &&  \
    rm -rf linux-amd64 helm-v3.8.1-linux-amd64.tar.gz
```

Mac OS 安装：

```bash
brew install helm
```

APT 安装：

```bash
curl https://baltocdn.com/helm/signing.asc | sudo apt-key add -
sudo apt-get install apt-transport-https --yes
echo "deb https://baltocdn.com/helm/stable/debian/ all main" | sudo tee /etc/apt/sources.list.d/helm-stable-debian.list
sudo apt-get update
sudo apt-get install helm
```

## 示例仓库

参见： [rectcircle/helm-experiment](https://github.com/rectcircle/helm-experiment)

## Chart 开发指南

本部分从两个方面介绍，如何编写 Chart。

* helm create 生成的脚手架。
* helm create 没有涉及的部分。
* Chart 开发的最佳实践。

### helm create 解读

执行 `helm create` 命令

```bash
mkdir -p deploy/charts
helm create deploy/charts/myapp
```

#### 目录结构简述

通过 `tree deploy/charts/myapp` 观察 `helm create` 目录结构。

```
deploy/charts/myapp
├── Chart.yaml
├── charts
├── templates
│   ├── NOTES.txt
│   ├── _helpers.tpl
│   ├── deployment.yaml
│   ├── hpa.yaml
│   ├── ingress.yaml
│   ├── service.yaml
│   ├── serviceaccount.yaml
│   └── tests
│       └── test-connection.yaml
└── values.yaml
```

* `Chart.yaml` 该 chart 的声明信息（类似于 npm 的 package.json、go 的 go.mod），包含命名、版本、依赖声明等信息。
* `charts/` 目录存放该 charts 的依赖（子 chart），有两种可能。
    * 子 chart 目录，如 `mysql/`。
    * 子 chart 压缩包如 `mysql-8.9.6.tgz`。
* `templates/` 模板目录，包含如下内容：配置文件模板、模板目录。
    * `test/` 测试用的 Kubernetes 声明式配置模板，一般会声明一个 Pod，来检测该 Chart 对应的 Release 正确性，通过 `helm test <RELEASE_NAME>` 触发，按照推荐可以放到 `test/` 目录下，但是这不是强制的。任意 `metadata.annotations` 包含 `helm.sh/hook: test` 的都会被视为一个测试模板。
    * `*.yaml`  Kubernetes 声明式配置模板，会渲染成 Kubernetes 声明式配置。
    * `NOTES.txt` 一个特殊的说明文件，会在 `helm install` 等之后输出该文件渲染后的内容，该文件内容不会被。
    * `_helpers.tpl` 用来定义命名模板，可以被其他文件引用，该文件不会被渲染为 Kubernetes 声明式配置（原因是，helm 规定，以 `_` 开头的文件，都不会被渲染到 Kubernetes 声明式配置 中）。
* `values.yaml` 模板变量的默认值，可以被 `templates/` 目录的文件引用。

除了以上目录文件，还有可能包含如下文件：

* `Chart.lock` 类似于 npm 的 package.lock，在运行 `helm dependency` 等命令后会出现。
* `values.schema.json` 可选: 一个使用 JSON Schema 文件，用来描述 values.yaml 文件的结构。
* `LICENSE` 可选: 包含 chart 许可证的纯文本文件
* `crds/` 可选：Kubernetes 自定义资源的定义文件，注意，不是模板，是配置文件本身。

#### Go Template 简述

> 参考：[Go 标准库 `text/template`](https://pkg.go.dev/text/template)

上文提到 `templates/` 目录下的文件最终都会使用 Go 标准库的 [`text/template` 模板引擎](https://pkg.go.dev/text/template)（即 Go Template）进行渲染。在此简单 Go Template 的语法。

在过去 Web 开发领域模板引擎非常常见，但经历过前后端分离后，模板引擎在 Web 开发淋浴逐渐淡出历史舞台。模板引擎可以理解 `模板 + 数据 = 输出`，即：

```go
func Render(tpl string, values interface{}) (output string, err error)
```

一个模板都会定义一套模板语法。这套模板语法就是一种简单的编程语言。模板语法一般包含如下能力：

* 引用数据（渲染数据）
* 流程控制（条件/循环渲染）
* 命名模板定义和使用（定义和引用定义的一个命名模板）
* 函数调用（调用注册在 Go 模板引擎对象中的 Go 函数）

Go Template 比较简单，通过如下 demo 对照输出，应该可以快速理解 Go Template 的语法和特性。

```go
package main

import (
	"fmt"
	"os"
	"text/template"
)

type Foo struct {
	Bar string
	Baz int
}

func (f *Foo) String() string {
	return fmt.Sprintf("Foo{ Bar: %s, Baz: %d }", f.Bar, f.Baz)
}

func (f *Foo) MethodHasParam(a, b string) string {
	return fmt.Sprintf("a: %s, b: %s", a, b)
}

func (f *Foo) Add(i int) *Foo {
	return &Foo{Bar: f.Bar, Baz: f.Baz + i}
}

var data = map[string]interface{}{
	"Foo": &Foo{
		Bar: "bar",
		Baz: 42,
	},
	"Field": "string",
	"List": []string{
		"a", "b", "c",
	},
	"EmptyList": []string{},
	"Cond":      true,
	"Func": func(p string) string {
		return "func called: " + p
	},
	"Map": map[string]string{
		"a": "1",
		"b": "2",
	},
	"Nil": map[string]string(nil),
}

var globalFuncs = template.FuncMap{
	"version": func() string { return "v1.2.3" },
	"add":     func(a, b int) int { return 1 + 1 },
}

const tpl = `1. 不使用 {{"{{}}"}} 包裹的字符串会被原样输出：
	没有两个 { 开头和两个 } 结尾包裹的字符串被原样渲染。

2. 使用 {{"{{}}"}} 包裹，可以使用模板引擎提供的动态渲染的能力：
	{{ "模板语法" }}

3. 前导和后续空白字符删除
	a. {{"{{- 模板语法 }}"}} ，会删除前导空白字符：

		abc

		{{- "前导空白字符会被删除"}}
		def

	b. {{"{{ 模板语法 -}}"}} ，会删除后续空白字符：

		abc
		{{ "后续空白字符会被删除" -}}

		def

	c. {{"{{- 模板语法 -}}"}} ，会删除前导和后续空白字符：

		abc

		{{- "前导和后续空白字符会被删除" -}}

		def

4. 注释语法 {{ "{{/* a comment */}}" }} 注释内容不会被渲染：
	abc {{/* a comment */}} def

5. 字面量：
	a. bool {{true}}
	b. 字符串 {{"abc"}}
	c. 字符 {{'a'}}
	d. int (位数取决于操作系统) {{ 1 }}
	e. float {{ 1.1 }}
	f. 虚数 {{ 1i }}
	g. 复数 {{ 1+1i }}


6. 渲染数据 {{ "{{ .Field }}" }}：
	a. . 是一个特殊的变量，默认指向的是 Execute 函数 data 参数：{{ . }}
	b. 渲染 Field 字段：{{ .Field }}
	c. 渲染 Foo 结构体的 Bar 字段：{{ .Foo.Bar }}
	d. 渲染并调用无参数方法：{{ .Foo.String }}
	d. 调用并渲染有参数方法：{{ .Foo.MethodHasParam "a" "b" }}
	e. 渲染 data 的 List 切片的 0 号元素：{{ index .List 0 }}
	f. 调用渲染 data 的 函数类型变量 Func：{{ call .Func "abc" }}
	g. 通过 key 渲染 map 的元素：{{ index .Map "a" }} 或 {{ .Map.a }}

7. 临时改变 . 的指向: 
	with: {{ with .Foo }} Bar = {{ .Bar }}, Baz = {{ .Baz }} {{ end }}
	with-else: {{ with .Nil }} {{.}} {{else}} . 是 nil {{ end }}

8. 流程控制
	a. 条件渲染：
		{{if .Cond}} .Cond is true {{end}}
		{{if not .Cond}} .Cond is false {{else}} .Cond is true {{end}} 
		{{if lt .Foo.Baz 10 }} .Foo.Baz < 10 {{ else if lt .Foo.Baz 100 }} 10 <= .Foo.Baz < 100 {{else}} .Foo.Baz >= 100 {{end}} 
	b. 遍历（只支持  array, slice, map, or channel）：
		遍历并改变 . 指向：
			range-end: {{range .List}} {{.}}, {{end}}
			range-else-end: {{range .EmptyList}} {{.}}, {{else}} is empty list {{end}}
			range-if-break-continue: {{range .List}} {{.}}, {{if eq . "a"}} {{continue}} {{else}} {{break}} {{end}}  {{end}}
		遍历不改变 . 指向，并获取索引：
			range-with-index: {{range $i, $e := .List}} {{$i}}: {{$e}}, {{end}}
		遍历 map：
			range-map: {{range $k, $v := .Map}} {{$k}}: {{$v}}, {{end}}

9. Arguments 概念，如下几种语法都叫做 Arguments：
	a. 上文提到的字面量: {{1}}
	b. nil 关键字：{{printf "%v" nil}}
	c. 数据指向数据的引用 . 以及对数据中的字段的引用(map 或 结构体) .Field: {{.Field}}
	d. $ 等对变量的引用，以及对变量的字段的引用（map 或结构体） $Xxx.Xxx，下文有阐述
	e. 数据或变量中，无参方法调用：{{.Foo.String}}
	f. 无参全局函数：{{version}}
	g. 上述之一的带括号的实例，用于分组。结果可以通过字段或映射键调用来访问。
		{{ printf ".List[0]=%s" (index .List 0) }}
		{{ (.Foo.Add 1).String }}

10. 全局函数调用
	语法为 {{ "{{函数名 Arguments1 Arguments2 ...}}" }}: {{ printf "%s" "hello" }}
	内置全局函数(参见 https://pkg.go.dev/text/template#hdr-Functions ）调用：{{ printf "%s" "hello" }}
	自定义全局函数，通过 func (*Template).Funcs(funcMap template.FuncMap) *template.Template 函数添加：{{add 1 2}}

11. Pipelines 能力，和 shell 中的 Pipelines 类似，如下元素可以通过 | 管道符连接。
	a. 语法为: Argument | 函数或方法（可选） | 函数或方法（可选） | ...
		Argument 就是上文定义的
		函数或方法可能是：
			.XXx.XxxMethod [Argument...] 保证最后一个是有参数有返回值的方法
			$Xxx.XxxMethod [Argument...] 保证最后一个是有参数有返回值的方法
			有参数有返回值的全局函数 Func [Argument...]
		函数或方法的写法，不应书写最后一个参数，因为最后一个参数从 Pipeline 中来
	d. 一个例子： {{"Pipeline" | printf "hello %s"}}

12. 变量
	a. 定义 $variable := pipeline: {{ $variable := "value" }} {{ $variable }}
	b. 赋值 $variable = pipeline: {{ $variable = "override" }} {{ $variable }}

13. 嵌套模板
	a. 定义: {{define "T1"}}ONE{{end}}
	b. 调用: {{template "T1" .}}
	c. 不要求定义一定发生在调用之前：{{template "T2" .}} {{define "T2"}}TWO{{end}}
	d. 同一个 tpl 不允许重复定义，但是多个模板可以重复定义，后 Parse 的将覆盖之前的嵌套模板
		{{template "T3" .}} {{define "T3"}}THREE{{end}}
	e. block 定义一个模板并立即调用，等价于 define 后立即 template 调用，用于实现给 template 提供一个默认值。
		{{block "T4" .}}T4 没有定义{{end}}
		{{block "T5" .}}T5 没有定义{{end}}

14. Parse 多个模板时，Execute 函数，只会渲染最后一个包含实际内容的模板（不包含实际内容的模板指的是该模板只包含 define 没有其他内容）。
`

const tpl2 = `{{define "T3"}}THREE 来自 tpl2{{end}}{{define "T5"}}T5 有定义{{end}}`

func main() {
	t, err := template.New("tpl").Funcs(globalFuncs).Parse(tpl)
	if err != nil {
		panic(err)
	}
	_, err = t.Parse(tpl2)
	if err != nil {
		panic(err)
	}

	err = t.Execute(os.Stdout, data)
	if err != nil {
		panic(err)
	}
}
```

输出如下：

```
1. 不使用 {{}} 包裹的字符串会被原样输出：
        没有两个 { 开头和两个 } 结尾包裹的字符串被原样渲染。

2. 使用 {{}} 包裹，可以使用模板引擎提供的动态渲染的能力：
        模板语法

3. 前导和后续空白字符删除
        a. {{- 模板语法 }} ，会删除前导空白字符：

                abc前导空白字符会被删除
                def

        b. {{ 模板语法 -}} ，会删除后续空白字符：

                abc
                后续空白字符会被删除def

        c. {{- 模板语法 -}} ，会删除前导和后续空白字符：

                abc前导和后续空白字符会被删除def

4. 注释语法 {{/* a comment */}} 注释内容不会被渲染：
        abc  def

5. 字面量：
        a. bool true
        b. 字符串 abc
        c. 字符 97
        d. int (位数取决于操作系统) 1
        e. float 1.1
        f. 虚数 (0+1i)
        g. 复数 (1+1i)


6. 渲染数据 {{ .Field }}：
        a. . 是一个特殊的变量，默认指向的是 Execute 函数 data 参数：map[Cond:true EmptyList:[] Field:string Foo:Foo{ Bar: bar, Baz: 42 } Func:0x10ee480 List:[a b c] Map:map[a:1 b:2] Nil:map[]]
        b. 渲染 Field 字段：string
        c. 渲染 Foo 结构体的 Bar 字段：bar
        d. 渲染并调用无参数方法：Foo{ Bar: bar, Baz: 42 }
        d. 调用并渲染有参数方法：a: a, b: b
        e. 渲染 data 的 List 切片的 0 号元素：a
        f. 调用渲染 data 的 函数类型变量 Func：func called: abc
        g. 通过 key 渲染 map 的元素：1 或 1

7. 临时改变 . 的指向: 
        with:  Bar = bar, Baz = 42 
        with-else:  . 是 nil 

8. 流程控制
        a. 条件渲染：
                 .Cond is true 
                 .Cond is true  
                 10 <= .Foo.Baz < 100  
        b. 遍历（只支持  array, slice, map, or channel）：
                遍历并改变 . 指向：
                        range-end:  a,  b,  c, 
                        range-else-end:  is empty list 
                        range-if-break-continue:  a,   b,  
                遍历不改变 . 指向，并获取索引：
                        range-with-index:  0: a,  1: b,  2: c, 
                遍历 map：
                        range-map:  a: 1,  b: 2, 

9. Arguments 概念，如下几种语法都叫做 Arguments：
        a. 上文提到的字面量: 1
        b. nil 关键字：<nil>
        c. 数据指向数据的引用 . 以及对数据中的字段的引用(map 或 结构体) .Field: string
        d. $ 等对变量的引用，以及对变量的字段的引用（map 或结构体） $Xxx.Xxx，下文有阐述
        e. 数据或变量中，无参方法调用：Foo{ Bar: bar, Baz: 42 }
        f. 无参全局函数：v1.2.3
        g. 上述之一的带括号的实例，用于分组。结果可以通过字段或映射键调用来访问。
                .List[0]=a
                Foo{ Bar: bar, Baz: 43 }

10. 全局函数调用
        语法为 {{函数名 Arguments1 Arguments2 ...}}: hello
        内置全局函数(参见 https://pkg.go.dev/text/template#hdr-Functions ）调用：hello
        自定义全局函数，通过 func (*Template).Funcs(funcMap template.FuncMap) *template.Template 函数添加：2

11. Pipelines 能力，和 shell 中的 Pipelines 类似，如下元素可以通过 | 管道符连接。
        a. 语法为: Argument | 函数或方法（可选） | 函数或方法（可选） | ...
                Argument 就是上文定义的
                函数或方法可能是：
                        .XXx.XxxMethod [Argument...] 保证最后一个是有参数有返回值的方法
                        $Xxx.XxxMethod [Argument...] 保证最后一个是有参数有返回值的方法
                        有参数有返回值的全局函数 Func [Argument...]
                函数或方法的写法，不应书写最后一个参数，因为最后一个参数从 Pipeline 中来
        d. 一个例子： hello Pipeline

12. 变量
        a. 定义 $variable := pipeline:  value
        b. 赋值 $variable = pipeline:  override

13. 嵌套模板
        a. 定义: 
        b. 调用: ONE
        c. 不要求定义一定发生在调用之前：TWO 
        d. 同一个 tpl 不允许重复定义，但是多个模板可以重复定义，后 Parse 的将覆盖之前的嵌套模板
                THREE 来自 tpl2 
        e. block 定义一个模板并立即调用，等价于 define 后立即 template 调用，用于实现给 template 提供一个默认值。
                T4 没有定义
                T5 有定义

14. Parse 多个模板时，Execute 函数，只会渲染最后一个包含实际内容的模板（不包含实际内容的模板指的是该模板只包含 define 没有其他内容）。
```

#### Helm 自定义模板函数

Go Template 标准库提供了[全局模板函数](https://pkg.go.dev/text/template#hdr-Functions)比较有限，Helm 再此基础上更多常用的全局模板函数。主要包含两部分：

* Sprig 库 v3 提供的。[官方文档](http://masterminds.github.io/sprig/) 文档介绍的不全。全部可用参见：[源码](https://github.com/Masterminds/sprig/blob/3ac42c7bc5e4be6aa534e036fb19dde4a996da2e/functions.go#L97)。
* Helm 自定义的，参见：[源码](https://github.com/helm/helm/blob/a499b4b179307c267bdf3ec49b880e3dbd2a5591/pkg/engine/funcs.go#L44)。

官方有部分函数的介绍文档：

* [模板函数列表](https://helm.sh/zh/docs/chart_template_guide/function_list/)。
* [include](https://helm.sh/zh/docs/chart_template_guide/named_templates/)。

### Chart 其他特性

#### 生命周期 和 Hook

### 最佳实践

## helm 命令详解

### Chart

### Repository

### Release

#### 生命周期

## 场景

### 动态依赖

### 等待依赖就绪

### 数据库初始化和迁移

pre-install
pre-upgrade
