---
title: "Kubernetes 包管理器 Helm"
date: 2022-05-20T22:07:33+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> 版本: 3.8.2 | [官方文档](https://helm.sh/zh/docs/)

## 简述

Helm 是 Kubernetes 的包管理器，是 [CNCF](https://www.cncf.io/projects/) 的毕业项目之一。

和 传统的包管理器类似（apt / npm / maven），Helm 提供了一个 CLI 客户端，定义并提供了 Helm Chart [包管理仓库](https://artifacthub.io/) （Chart 指的是包）。

Helm 在用户侧看来，和 Kubernetes 的 Kubectl 类似，仅仅是一个 Client。因此 Helm 不需要 Kubernetes 做任何特殊了配置，即可在任何 Kubernetes 集群中使用。

但是需要注意的是，Helm 还是需要将一些元信息存储到 Kubernetes 中的。本文介绍的 helm 3.x 不再需要在 Kubernetes 中再部署一个 Server 端。而是 Helm 每次 Release，Client 会直接通过 Kubernetes API 将元数据记录到 Kubernetes 的 Secret 中，更多参见：[Changes Since Helm 2 - Removal of Tiller](https://helm.sh/docs/faq/changes_since_helm2/#removal-of-tiller)。

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
    Deploy                                   +---(Go template engine)---> Kubernetes Configurations ------> Kubernetes Cluster Namespace (Release)
(helm install)                               |                                                                               |
                                             |                                                                               |
                +------------------------+   |                                      +-------------------------+              |
                |     Release Values     |---+                                      |Metadata Storage backends|    Record release metadata
                +------------------------+                                          +-------------------------+              |
                | --set-file values.yaml |                                          | On Released Kubernetes  |<-------------+
                | --set foo=bar          |                                          |    Namespace Secret     |
                +------------------------+                                          +-------------------------+
```

上图所示的是，对一个 Chart 进行部署的流程。

* Chart App 定义了一个 Chart，其依赖两个在 Chart Repository 中的两个 Chart。
* 用户通过 `helm install` 命令进行一次部署，并通过 `--set-file` 和 `--set` 覆盖 Chart App 中的参数。
* Helm CLI 通过 Go 模板引擎将 Values 和 Templates 进行渲染，得到 Kubernetes 配置。
* 最后通过 Kubernetes API （类似于 kubectl apply） 将配置应用到 Kubernetes 集群中。
* Chart 在 Kubernetes 集群中的对应物被称为一个 Release。
* 最后，将该 Release 的元信息记录到该 Release 所在 Namespace 的 Secret 对象中（也支持其他存储后端，参见：[Helm 高级技术 - 存储后端](https://helm.sh/zh/docs/topics/advanced/#%E5%90%8E%E7%AB%AF%E5%AD%98%E5%82%A8)）。

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

## IDE 支持 （VSCode）

* [Helm Intellisense](https://marketplace.visualstudio.com/items?itemName=Tim-Koehler.helm-intellisense)
* [Kubernetes](https://marketplace.visualstudio.com/items?itemName=ms-kubernetes-tools.vscode-kubernetes-tools)

## 示例仓库

参见： [rectcircle/helm-experiment](https://github.com/rectcircle/helm-experiment)

## Chart 开发指南

### helm create 创建脚手架

执行 `helm create` 命令

```bash
mkdir -p deploy/charts
helm create deploy/charts/myapp
```

### 目录结构简述

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

### Go Template 详解

> 参考：[Go 标准库 `text/template`](https://pkg.go.dev/text/template)

上文提到 `templates/` 目录下的文件最终都会使用 Go 标准库的 [`text/template` 模板引擎](https://pkg.go.dev/text/template)（即 Go Template）进行渲染。在此简单 Go Template 的语法。

在过去 Web 开发领域模板引擎非常常见，但经历过前后端分离后，模板引擎在 Web 开发领域逐渐淡出历史舞台。模板引擎可以理解 `模板 + 数据 = 输出`，即：

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

15. Action 和 函数
	在 Go 模板中 Action 和 全局函数，使用起来看似相同。但是 Action 不支持 Pipeline。
	除了 if 、else、range 这类流程控制的 Action 外，template 就是一个 Action，因此 template 不支持管道符。
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

15. Action 和 函数
        在 Go 模板中 Action 和 全局函数，使用起来看似相同。但是 Action 不支持 Pipeline。
        除了 if 、else、range 这类流程控制的 Action 外，template 就是一个 Action，因此 template 不支持管道符。

```

### Helm 自定义模板函数

Go Template 标准库提供了[全局模板函数](https://pkg.go.dev/text/template#hdr-Functions)比较有限，Helm 再此基础上更多常用的全局模板函数。主要包含两部分：

* Sprig 库 v3 提供的。[官方文档](http://masterminds.github.io/sprig/) 文档介绍的不全。全部可用参见：[源码](https://github.com/Masterminds/sprig/blob/3ac42c7bc5e4be6aa534e036fb19dde4a996da2e/functions.go#L97)。
* Helm 自定义的。参见：[源码](https://github.com/helm/helm/blob/a499b4b179307c267bdf3ec49b880e3dbd2a5591/pkg/engine/funcs.go#L44)。

官方有部分函数的介绍文档：

* [模板函数列表](https://helm.sh/zh/docs/chart_template_guide/function_list/)。
* [include](https://helm.sh/zh/docs/chart_template_guide/named_templates/)。

这里简单介绍下 include 函数。

在 Helm 中，利用 Go 模板引擎主要用来渲染 yaml 文件，因此处理缩进很重要。

但是，在 Go 模板引擎中的 `template` 是一个行为（即 Action 和 `if` 类似），不是一个函数。因此无法通过管道符来添加缩进（不能这么写 `{{ template "mychart.app" . | indent 4 }}`）

因此，Helm 自定义了一个函数 `include`，该函数的能力和 template 完全一致，因为其是一个函数，所以可以使用管道符（`{{ include "mychart.app" . | indent 4 }}`）。

### yaml 语法规范

参考官方文档：[附录： YAML技术](https://helm.sh/zh/docs/chart_template_guide/yaml_techniques/)

### Helm 模板数据变量

> 官方文档：[内置对象](https://helm.sh/zh/docs/chart_template_guide/builtin_objects/)

在编写模板时，可以通过 {{ .Xxx.Xxx }} 来访问 Helm Chart 中的相关数据：

* `.Release` 获取本次 Release 的相关信息，如 `{{ .Release.Name }}` release名称。
* `.Values` 从 `values.yaml` 文件和 `--set-file` 、`--set` 设置的变量，参见下文：[values.yaml 详解](#values-yaml-详解)。
* `.Chart` Chart.yaml文件内容，参见下文：[Chart.yaml 详解](#chart-yaml-详解)。
* `.Files` 访问 chart 内部的件的内容。（不能访问 `.helmignore` 忽略的文件 和 `/templates` 文件），更多参见：[在模板内部访问文件](https://helm.sh/zh/docs/chart_template_guide/accessing_files/)。
* `.Capabilities` 提供关于Kubernetes集群支持功能的信息。
* `.Template` 包含当前被执行的当前模板信息。

### 调试模板

> 参考官方文档：[调试模板](https://helm.sh/zh/docs/chart_template_guide/debugging/)

有多种方式可以调试模板：

* 场景 1：使用默认参数观察模板输出
    * 观察全部整体渲染结果
        * 命令行 `helm install release-name deploy/charts/myapp --dry-run --debug`
        * VSCode 命令 `>helm: preview template`
    * 观察某个模板
        * 命令行 `helm template hpa deploy/charts/myapp --show-only templates/deployment.yaml`
        * VSCode 命令 `>helm: preview template` （当前编辑器打开的）
* 场景 2：测试不同参数的不同行为
    * 观察全部整体渲染结果
        * 命令行 `helm install release-name deploy/charts/myapp --dry-run --debug --set xxx.xxx=xxx`
    * 观察某个模板
        * 命令行 `helm template hpa deploy/charts/myapp --show-only templates/deployment.yaml --set xxx.xxx=xxx`
* 场景 3：观察已经安装到 k8s 集群中的 release 的情况：
    * 命令行 `helm get manifest release-name`

下文的介绍会多次使用这些类似的命令。

### Chart.yaml 详解

> 参见官方文档：[Chart - Chart.yaml 文件](https://helm.sh/zh/docs/topics/charts/#chartyaml-%E6%96%87%E4%BB%B6)

通过 helm create 创建的 Chart.yaml 包含如下内容：

```yaml
apiVersion: v2
name: myapp
description: A Helm chart for Kubernetes
type: application
version: 0.1.0
appVersion: "1.16.0"
```

所有字段和说明，如下所示：

```yaml
apiVersion: chart API 版本 （必需）
name: chart名称 （必需）
version: 语义化2 版本（必需）
kubeVersion: 兼容Kubernetes版本的语义化版本（可选）
description: 一句话对这个项目的描述（可选）
type: chart类型 （可选）
keywords:
  - 关于项目的一组关键字（可选）
home: 项目home页面的URL （可选）
sources:
  - 项目源码的URL列表（可选）
dependencies: # chart 必要条件列表 （可选）
  - name: chart名称 (nginx)
    version: chart版本 ("1.2.3")
    repository: （可选）仓库URL ("https://example.com/charts") 或别名 ("@repo-name")
    condition: （可选） 解析为布尔值的yaml路径，用于启用/禁用chart (e.g. subchart1.enabled )
    tags: # （可选）
      - 用于一次启用/禁用 一组chart的tag
    import-values: # （可选）
      - ImportValue 保存源值到导入父键的映射。每项可以是字符串或者一对子/父列表项
    alias: （可选） chart中使用的别名。当你要多次添加相同的chart时会很有用
maintainers: # （可选）
  - name: 维护者名字 （每个维护者都需要）
    email: 维护者邮箱 （每个维护者可选）
    url: 维护者URL （每个维护者可选）
icon: 用做icon的SVG或PNG图片URL （可选）
appVersion: 包含的应用版本（可选）。不需要是语义化，建议使用引号
deprecated: 不被推荐的chart （可选，布尔值）
annotations:
  example: 按名称输入的批注列表 （可选）.
```

在此介绍几个可能比较难以理解的字段：

* type 该 Chart 的类型，有两种选择：
    * application （默认）
    * library 表示该 Chart 是给其他 chart 依赖的，因此 libaray 类型的 chart 一般都是一些通过 `define` 定义的命名模板，如果 library 包含 Kubernetes 声明式配置，则会被忽略，该特性用处应该不大。更多参见：[库类型Chart](https://helm.sh/zh/docs/topics/library_charts/)。
* dependencies[].condition 配置依赖启用/禁用的条件，假设某个应用，在 A 场景需要部署一个 MySQL 依赖，而在 B 场景不需要部署而是使用外部的 MySQL 实例，此时就可以通过该字段进行配置，配置方式如下：
    * Chart.yaml 添加： `dependencies[].condition: mysql.enabled`。
    * values.yaml 添加： `mysql.enabled: true` 默认开启。
    * helm install 时，通过 `--set mysql.enabled=true|false` 来决定是否启用 mysql。
    * 关于该特性的官方说明，参见：[依赖中的tag和条件字段](https://helm.sh/zh/docs/topics/charts/#%E4%BE%9D%E8%B5%96%E4%B8%AD%E7%9A%84tag%E5%92%8C%E6%9D%A1%E4%BB%B6%E5%AD%97%E6%AE%B5)。
* dependencies[].tags  用于实现一次性启用/禁用一组依赖的Chart，假设某应用可以分为前端部分和后端部分，每个部分都有多个依赖，此时希望一次性启用或禁用前端特性，就可以通过该字段，配置方式如下：
    * Chart.yaml 添加： `dependencies[].tags: ["front-end"]`。
    * values.yaml 添加： `tags.front-end: true` 默认开启。
    * helm install 时，通过 `--set tags.front-end=true|false` 来决定是否启用前端。
    * 注意如果 `dependencies[].tags` 存在多个，只要有一个 tag 为 true 就会启用（或关系）。
    * 关于该特性的官方说明，参见：[依赖中的tag和条件字段](https://helm.sh/zh/docs/topics/charts/#%E4%BE%9D%E8%B5%96%E4%B8%AD%E7%9A%84tag%E5%92%8C%E6%9D%A1%E4%BB%B6%E5%AD%97%E6%AE%B5)。
* dependencies[].import-values 将子 chart 的值导入到 父 chart `values.yaml` 作为父 `values.yaml` 的默认值
    * 方式 1：import  子 chart 的 exports 下的值
        * 假设子 chart 的 values.yaml 包含

            ```yaml
            exports:
              data:
                myint: 99
            ```

        * 此时父 chart 的 Chart.yaml

            ```yaml
            dependencies:
              - name: subchart
                repository: http://localhost:10191
                version: 0.1.0
                import-values:
                  - data
            ```

        * 此时运行  `helm install ... --debug --dry-run` 观察计算出的 values 将包含

            ```yaml
            myint: 99
            ```

    * 方式 2：import  子 chart 的非 exports 下的值
        * 假设子 chart 的 values.yaml 包含

            ```yaml
            default:
              data:
                myint: 999
                mybool: true
            ```

        * 假设父 chart 的 values.yaml

            ```yaml
            myimports:
              myint: 0
              mybool: false
              mystring: "helm rocks!"
            ```

        * 此时父 chart 的 Chart.yaml

            ```yaml
            dependencies:
              - name: subchart
                repository: http://localhost:10191
                version: 0.1.0
                import-values:
                  - child: default.data
                    parent: myimports
            ```

        * 此时运行  `helm install ... --debug --dry-run` 观察计算出的 values，子 chart 将覆盖父 chart，即：

            ```yaml
            myimports:
              myint: 999
              mybool: true
              mystring: "helm rocks!"
            ```

        * 此时运行  `helm install ... --set myimports.myint=1000  --debug --dry-run` 观察计算出的 values，可以发现 import 是单向的，手动改动父 chart 的 import 的值不会影响子 chart 的值：

            ```yaml
            myimports:
              myint: 1000
              mybool: true
              mystring: "helm rocks!"
            subchart:
              default:
                data:
                  mybool: true
                  myint: 999
            ```

        * 此时运行  `helm install ... --set subchart.default.myint=1001  --debug --dry-run` 观察计算出的 values，可以发现手动改动子 chart 的值会让 import 失效，父 chart 将保持其自身的默认值（行为很诡异，看起来像是 bug）：

            ```yaml
            myimports:
              mybool: false
              myint: 0
              mystring: helm rocks!
            subchart:
              default:
                data:
                  mybool: true
                  myint: 1001
            ```

    * 可以看出 export import 仅仅是为了方便获取子 chart 的默认值，而覆盖的场景行为很诡异，[官方文档](https://helm.sh/zh/docs/topics/charts/#%E9%80%9A%E8%BF%87%E4%BE%9D%E8%B5%96%E5%AF%BC%E5%85%A5%E5%AD%90value)也没有仔细覆盖场景的行为。
* appVersion，此字段仅供参考，对chart版本计算没有影响。比如 mysql 的 chart 该字段应该就是 mysql 的版本号。

### Chart 模板渲染结果 apply 顺序

Helm 对一个 包含依赖的 Chart 做一次 Release，比如 Chart A 依赖 Chart B。

这个 Chart 模板的渲染结果最终会 apply 到 Kubernetes 的某个 Namespace 中。直觉上理解可能是：

* 先渲染 Chart B，然后 apply B 的结果。
* 等待 B apply 成功，再渲染 Chart A，然后 apply A 的结果。

实际上，并非如此，Chart 底层会：

* 将 Chart A 和 Chart B 进行渲染。
* 然后将渲染结果先按照 Kubernetes 资源类型进行排序（排序规则参见：[源码](https://github.com/helm/helm/blob/484d43913f97292648c867b56768775a55e4bba6/pkg/releaseutil/kind_sorter.go)）。
* 在相同的资源类型 A 在前、B 在后。
* 然后一次性按照排序后的结果 apply 到 Kubernetes 中。

因此，如果想控制服务粒度的启动顺序的前后依赖（比如 App 依赖 MySQL）。则还需要利用 kubernetes 的 init-containers 机制来实现。

### values.yaml 详解

> 参见官方文档：[Values 文件](https://helm.sh/zh/docs/chart_template_guide/values_files/)

`values.yaml` 使用 yaml 语法定义了可以在模板中使用的变量。在模板中通过 `.Values` 来进行引用。

```yaml
replicaCount: 1

image:
  repository: nginx
  pullPolicy: IfNotPresent
  # Overrides the image tag whose default is the chart appVersion.
  tag: ""
```

比如 `replicaCount` 变量

* 其默认值是 1，其在 `templates/deployment.yaml` 文件中被引用：`  replicas: {{ .Values.replicaCount }}`。
* 如果想在部署时修改该变量，则可以通过 `--set-file xxx.yaml` 或者 `--set replicaCount=2` 来覆盖 `values.yaml` 中的默认值。

values.yaml 文件中，存在几个特殊的 key， helm 会对其做特殊处理：

* `exports` 作用参见上文： [Chart.yaml 详解](#chart-yaml-详解)。
* `子chart名` 给依赖的子 chart 赋值。
    * 假设父 chart 依赖一个子 chart，在父 Chart 的 Chart.yaml 文件中：

        ```yaml
        dependencies:
          - name: subchart
            version: "*.*.*"
        ```

    * 子 chart 的 values.yaml 部分内容为：

        ```yaml
        replicaCount: 1
        ```

    * 此时，通过 `helm upgrade release-name deploy/charts/myapp --install --debug --dry-run` 观察输出将得到

        ```yaml
        replicaCount: 1 # 这是父 chart 的 value
        subchart:
          replicaCount: 1 # 这是子 chart 的 value
        ```

    * 因此如果想覆盖子 chart 的值，需要通过：
        * 在父 chart 的 `values.yaml` 添加配置：

            ```yaml
            subchart:
              replicaCount: 2
            ```

        * `--set-file` 文件，结构和父 chart 的 `values.yaml` 一致
        * `--set 子chart名.xxx=xxx` 即 `--set subchart.replicaCount=2`

    * 更多参见官方文档：[子chart和全局值](https://helm.sh/zh/docs/chart_template_guide/subcharts_and_globals/)：
* `global` 全局值，上面说到，在父 chart 中如果想修改子 chart 的值则需要添加 `子chart名` 的前缀，因此通过 global key 可以声明一个全局的值，然后通过 `--set global.xxx` 即可同时修改父子的值。
    * 假设父 chart 依赖一个子 chart，在父 Chart 的 Chart.yaml 文件中：

        ```yaml
        dependencies:
          - name: subchart
            version: "*.*.*"
        ```

    * 子 chart 和 父 chart 的 values.yaml 都包含：

        ```yaml
        # 子 chart（子 chart 可以不声明也可以，但是父 chart 必须声明，建议同时声明）
        global:
          aaa: child
        # 父 chart
        global:
          aaa: parent
        ```

    * 此时，通过 `helm upgrade release-name deploy/charts/myapp --install --debug --dry-run` 观察输出将得到：

        ```yaml
        global:
          aaa: parent
        subchart:
          global:
            aaa: parent
        ```

        可以看出，父 chart 的值会覆盖子 chart 的值。

    * 此时，通过 `helm upgrade release-name deploy/charts/myapp --install --debug --dry-run --set global.aaa=override` 观察输出将得到：

        ```yaml
        global:
          aaa: override
        subchart:
          global:
            aaa: override
        ```

        可以看出，通过 global.aaa 同时改变了父子 chart 的值。

    * 更多参见官方文档：[子chart和全局值](https://helm.sh/zh/docs/chart_template_guide/subcharts_and_globals/)：

### templates/_helpers.tpl 详解

> 参见官方文档：[命名模板](https://helm.sh/zh/docs/chart_template_guide/named_templates/)

首先来看 `templates/_helpers.tpl` 文件名。

* `_` 开头是必须的，表示该文件不会被渲染为 Kubernetes 声明式配置。
* 文件名和后缀是不是强制的，是 helm 推荐的命名规则，也就是说，该文件名改为 `_xxx.abc` 不会有任何实际影响。

再看该文件的内容，下面摘抄了部分内容：

```
{{/*
Expand the name of the chart.
*/}}
{{- define "myapp.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}
```

可以看出，该文件是一些命名模板的定义位置，以上面这个 `myapp.name` 命名模板为例，该命名模板会返回该 Chart 的名字，逻辑为：

* 如果 value 中定义了 nameOverride，则使用 nameOverride；否则使用 Chart.yaml 中定义的 name。
* 获取到名字后，如果长度过长，则截断到 63 位。
* 删除可能的后缀一个或多个 `-`。

### templates/*.yaml 详解

templates/*.yaml 相关文件就是会被渲染成 Kubernetes 声明式配置 的模板文件。

其文件名可以是任何不以 `-` 开头的符合操作系统命名规则的字符串。

以 `templates/deployment.yaml` 文件，前面几行内容为例：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
```

* 前面 3 行都是会被原样输出的字符串
* 第 4 行调用了定义于 `templates/_helpers.tpl` 的 `myapp.fullname` 模板。
* 第 5 行调用了定义于 `templates/_helpers.tpl` 的 `myapp.labels` 模板，并使用 nindent 处理缩进。

通过 `helm upgrade release-name deploy/charts/myapp --install --debug --dry-run` 或者 VSCode 的 `cmd + shfit + p` 输入： `>helm: preview template` 即可观察最终渲染的结果：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: release-name-myapp
  labels:
    helm.sh/chart: myapp-0.1.0
    app.kubernetes.io/name: myapp
    app.kubernetes.io/instance: release-name
    app.kubernetes.io/version: "1.16.0"
    app.kubernetes.io/managed-by: Helm
```

其他 templates/*.yaml 文件类似，在此不再赘述。

### templates/NOTES.txt 简述

templates/NOTES.txt 的作用是，在执行完成 helm install 或 helm upgrade 后，输出的一些提示信息，比如告诉用户如何访问服务等。

更多参见官方文档：[创建一个NOTES.txt文件](https://helm.sh/zh/docs/chart_template_guide/notes_files/)

### .helmignore 简述

在运行 helm package 时会忽略该文件声明的路径的文件。该文件的语法和 `.gitignore` 还是有所不同：

* 不支持'**'语法。
* globbing库是Go的 'filepath.Match'，不是fnmatch(3)
* 末尾空格总会被忽略(不支持转义序列)
* 不支持'!'作为特殊的引导序列

### 生命周期 和 Hook

Helm Chart 在部署成一个 Release 的过程中的声明周期如下所示：

* 用户执行 `helm install foo`。
* Helm 库调用安装 API。
* 在一些验证之后，库会渲染 foo 模板。
* 库会加载模板渲染的结果，到 Kubernetes，并记录 Release 元信息到 Kubernetes 的 Secret 中。
* 库会返回发布对象（和其他数据）给客户端。
* 客户端退出。

### Chart 开发最佳实践

参见：[Chart 最佳实践指南](https://helm.sh/zh/docs/chart_best_practices/)

## helm 命令详解

### 配置和环境

> 参考官方文档：[Helm](https://helm.sh/zh/docs/helm/helm/) | [环境](https://helm.sh/zh/docs/helm/helm_env/)

若想 helm 命令正常使用，至少需要配置一个 kubeconfig。和 kubectl 类似，默认位于：`~/.kube/config`。

helm 命令的自身的配置，可通过环境变量进行配置，列表参见：[官方文档](https://helm.sh/zh/docs/helm/helm/)。

* [`helm env [flags]`](https://helm.sh/zh/docs/helm/helm_env/) 命令可以查看当前的环境变量。

最后 helm 也会在磁盘汇总存储一些信息，以 Linux 为例：

* 从 Repository 下载的 Chart 的 缓存路径： `$HOME/.cache/helm`。
* 关于 Repository 的配置会存储到 helm 的配置文件目录中：`$HOME/.config/helm	`。
* 数据目录：`$HOME/.local/share/helm`。

### Chart

#### 创建 Chart

* [helm create NAME [flags]](https://helm.sh/zh/docs/helm/helm_create/)  使用给定名称创建新的 chart，如 `helm create deploy/charts/myapp`。

#### 查看 Chart 信息

[`helm show`](https://helm.sh/zh/docs/helm/helm_show/)，查看 chart 信息。

* [`helm show all [CHART] [flags]`](https://helm.sh/zh/docs/helm/helm_show_all/) - 显示 chart 的所有信息。
* [`helm show chart [CHART] [flags]`](https://helm.sh/zh/docs/helm/helm_show_chart/) - 显示 chart 定义。
* [`helm show crds [CHART] [flags]`](https://helm.sh/zh/docs/helm/helm_show_crds/) - 显示 chart 的 CRD。
* [`helm show readme [CHART] [flags]`](https://helm.sh/zh/docs/helm/helm_show_readme/) - 显示 chart 的 README。
* [`helm show values [CHART] [flags]`](https://helm.sh/zh/docs/helm/helm_show_values/) - 显示 chart 的 values。

#### 管理 Chart 依赖

[`helm dependency`](https://helm.sh/zh/docs/helm/helm_dependency/)，管理chart依赖。

在 helm 中， `helm install` 和 `helm upgrade` 都是都是基于本地文件的内容来操作的。

因此，在执行这些命令之前，需要通过 `helm dependency` 相关命令把 `Chart.yaml` 声明的依赖下载下来。保存到上文提到的，每个 chart 都有一个 `charts/` 目录中。

* [`helm dependency build CHART [flags]`](https://helm.sh/zh/docs/helm/helm_dependency_build/) 基于 `Chart.lock` 文件构建 `charts/` 目录。
* [`helm dependency list CHART [flags]`](https://helm.sh/zh/docs/helm/helm_dependency_list/) 列出给定 Chart 的依赖。
* [`helm dependency update CHART [flags]`](https://helm.sh/zh/docs/helm/helm_dependency_update/) 基于 `Chart.yaml` 内容升级 `charts/`。

#### 将 Chart 进行打包

* [`helm package [CHART_PATH] [...] [flags]`](https://helm.sh/zh/docs/helm/helm_package/)

#### 调试 Chart

* [`helm template [RELEASE_NAME] [CHART] [flags]`](https://helm.sh/zh/docs/helm/helm_template/) 本地渲染模板并显示输出。可以通过 `--show-only templates/deployment.yaml` 命令只渲染单个模板
* 通过 `--debug` 和 `--dry-run` 可以查看 `helm install` 执行的内容。

#### 检查 Chart

* [`helm lint PATH [flags]`](https://helm.sh/zh/docs/helm/helm_lint/) 验证 chart 是否存在问题。

### Repository

#### Helm Repository 结构

> 参考官方文档：[Chart仓库指南](https://helm.sh/zh/docs/topics/chart_repository/)

Helm 没有提供一个中心化的 Chart Repository，而是定义了一套 Repository 规范，该规范非常简单：

* 一个 Repository 对应一个 http URL，该 URL 包含一个 index.yaml 文件以及多个 Chart 压缩包。
* 比如，https://example.com/charts Repository，存在
    * https://example.com/charts/index.yaml 索引文件（必须）
    * https://example.com/charts/name-x.y.z.tgz 索引文件对应的 Chart 的压缩包

这个 index.yaml 的一个 demo 为（注意，这个 index.yaml 不需要手动编写。可以通过 helm 命令自动生成）：

```yaml
apiVersion: v1
entries:
  alpine:
    - created: 2016-10-06T16:23:20.499814565-06:00
      description: Deploy a basic Alpine Linux pod
      digest: 99c76e403d752c84ead610644d4b1c2f2b453a74b921f422b9dcb8a7c8b559cd
      home: https://helm.sh/helm
      name: alpine
      sources:
      - https://github.com/helm/helm
      urls:
      - https://technosophos.github.io/tscharts/alpine-0.2.0.tgz
      version: 0.2.0
    - created: 2016-10-06T16:23:20.499543808-06:00
      description: Deploy a basic Alpine Linux pod
      digest: 515c58e5f79d8b2913a10cb400ebb6fa9c77fe813287afbacf1a0b897cd78727
      home: https://helm.sh/helm
      name: alpine
      sources:
      - https://github.com/helm/helm
      urls:
      - https://technosophos.github.io/tscharts/alpine-0.1.0.tgz
      version: 0.1.0
  nginx:
    - created: 2016-10-06T16:23:20.499543808-06:00
      description: Create a basic nginx HTTP server
      digest: aaff4545f79d8b2913a10cb400ebb6fa9c77fe813287afbacf1a0b897cdffffff
      home: https://helm.sh/helm
      name: nginx
      sources:
      - https://github.com/helm/charts
      urls:
      - https://technosophos.github.io/tscharts/nginx-1.1.0.tgz
      version: 1.1.0
generated: 2016-10-06T16:23:20.499029981-06:00
```

因此如果想的搭建一个 Repository 是非常容易的，有如下几种方式：

* 使用 Nigix / Apache 等，搭建一个静态站点服务器。
* 使用 gitHub 静态页面托管服务。
* 使用开源的 Helm Chart仓库服务器：[ChartMuseum](https://chartmuseum.com/)。
* 其他云厂商提供的服务，

如果想将这个仓库分享给其他人使用，有几种方式：

* 公开给给社区搜索，前往 https://artifacthub.io，将这个站点公开你的仓库，这样其他用户就可以使用了。
* 手动将仓库 URL 分享给相关人员，通过 helm repo 相关命令使用。

#### 通过 OCI Registry 分发

Helm 3.8.0 之后，已默认开启了对 OCI Registry 的支持。该方式的规范是基于如下两个 OCI 规范：

* [Image Format](https://github.com/opencontainers/image-spec)
* [Distribution Specification](https://github.com/opencontainers/distribution-spec)

相信这也是未来 Helm Chart 主流的发布方式。

更多参见官方文档：[注册中心](https://helm.sh/zh/docs/topics/registries/)。

#### 向 Repository 发布 Chart

> 参考官方文档：[Chart仓库指南](https://helm.sh/zh/docs/topics/chart_repository/) | [Helm来源和完整性](https://helm.sh/zh/docs/topics/provenance/) | [注册中心](https://helm.sh/zh/docs/topics/registries/)

* 参考 [Chart 开发指南](#chart-开发指南) 开发一个 Chart。
* 将 chart 打一个包： `helm package charts/alpine`（可选的：对包进行签名，参见：[Helm来源和完整性](https://helm.sh/zh/docs/topics/provenance/)）
* （如果不存在）创建一个仓库目录： `mkdir repository/`
* 场景 1：发布到采用 Helm Repository 结构的仓库：
    * 将包移动到仓库目录中： `mv alpine-0.1.0.tgz repository/`
    * 根据仓库信息重新生成 index.yaml 文件： `helm repo index repository/ --url https://example.com/charts`，如果是第二次生成，可以添加 `--merge` 参数。
    * 将 `repository/` 目录部署到 Web 服务中。
* 场景 2：发布到 OCI Registry，更多参见，[注册中心](https://helm.sh/zh/docs/topics/registries/)：
    * 登录 OCI Registry `helm registry login $oci-host`
    * 发布到 OCI Registry `helm push mychart-0.1.0.tgz oci://$oci-host/helm-charts`

#### 命令说明

* [`helm repo`](https://helm.sh/zh/docs/helm/helm_repo/) 可以用来管理（添加、列出、删除、更新和索引 chart 仓库）远程 Repository。
    * [`helm repo add [NAME] [URL] [flags]`](https://helm.sh/zh/docs/helm/helm_repo_add/) 添加chart仓库。例如 `helm repo add bitnami https://charts.bitnami.com/bitnami`。
    * [`helm repo index [DIR] [flags]`](https://helm.sh/zh/docs/helm/helm_repo_index/) 基于包含打包chart的目录，生成索引文件，具体参见上文。
    * [`helm repo list [flags]`](https://helm.sh/zh/docs/helm/helm_repo_list/) 列举chart仓库。
    * [`helm repo remove [REPO1 [REPO2 ...]] [flags]`](https://helm.sh/zh/docs/helm/helm_repo_remove/) 删除一个或多个仓库。
    * [`helm repo update [REPO1 [REPO2 ...]] [flags]`](https://helm.sh/zh/docs/helm/helm_repo_update/) 从chart仓库中更新本地可用chart的信息。例如：`helm repo update bitnami`。
* [`helm pull [chart URL | repo/chartname] [...] [flags]`](https://helm.sh/zh/docs/helm/helm_pull/) 从仓库下载并（可选）在本地目录解压，如 `helm pull bitnami/redis --untar`（`--untar` 表示解压）。
* [`helm push [chart] [remote] [flags]`](https://helm.sh/zh/docs/helm/helm_push/) 上传 chart 到 OCI Registry。
* [`helm verify PATH [flags]`](https://helm.sh/zh/docs/helm/helm_verify/) 验证给定路径的 chart 已经被签名且有效。
* [`helm search`](https://helm.sh/zh/docs/helm/helm_search/) 搜索 Chart。
    * [`helm search hub [KEYWORD] [flags]`](https://helm.sh/zh/docs/helm/helm_search_hub/) 搜索 [Artifact Hub](https://artifacthub.io)，和从网页上搜索效果类似。
    * [`helm search repo [keyword] [flags]`](https://helm.sh/zh/docs/helm/helm_search_repo/) 搜索本地通过 `helm repo add` 的 Repository。
* [`helm registry`](https://helm.sh/zh/docs/helm/helm_registry/) OCI Registry，参见上文。
    * [`helm registry login [host] [flags]`](https://helm.sh/zh/docs/helm/helm_registry_login/) 对 OCI Registry 进行身份验证。
    * [`helm registry logout [host] [flags]`](https://helm.sh/zh/docs/helm/helm_registry_logout/) 对 OCI Registry 移除认证信息。

### Release

#### 安装

* [helm install [NAME] [CHART] [flags]](https://helm.sh/zh/docs/helm/helm_install/) 安装一个 Chart 为一个 Release。

#### 升级

* [`helm upgrade [RELEASE] [CHART] [flags]`](https://helm.sh/zh/docs/helm/helm_upgrade/) 升级一个 Chart 的版本。

#### 测试

* [`helm test [RELEASE] [flags]`](https://helm.sh/zh/docs/helm/helm_test/) 对指定发布执行测试。

#### 回滚

* [helm rollback <RELEASE> [REVISION] [flags]](https://helm.sh/zh/docs/helm/helm_rollback/) 回滚 Release 到上一个版本。

#### 卸载

* [`helm uninstall RELEASE_NAME [...] [flags]`](https://helm.sh/zh/docs/helm/helm_uninstall/) 卸载一个 Release。

#### 查看

* [`helm list [flags]`](https://helm.sh/zh/docs/helm/helm_list/) 返回当前 namespace（`kubectl config get-contexts`）下的所有 Release。
* [`helm history RELEASE_NAME [flags]`](https://helm.sh/zh/docs/helm/helm_history/) 查看 Release 的历史版本。
* [`helm status RELEASE_NAME [flags]`](https://helm.sh/zh/docs/helm/helm_status/) 查看 Release 状态包括：
    * 最后部署时间
    * Release 版本所在的 k8s 命名空间
    * Release 状态（可选值： unknown, deployed, uninstalled, superseded, failed, uninstalling, pending-install, pending-upgrade 或 pending-rollback）
    * Release 版本 Revision
    * Release 版本描述（可以是完成信息或错误信息，需要用 `--show-desc` 启用）
    * 列举 Release 包含的资源，按类型排序
    * 最后一次测试套件运行的详细信息（如果使用）
    * Chart 中的 NOTE.txt 的渲染后的结果
* [`helm get`](https://helm.sh/zh/docs/helm/helm_get/) 获取 Release 的额外信息。
    * [`helm get all RELEASE_NAME [flags]`](https://helm.sh/zh/docs/helm/helm_get_all/) 打印一个具有可读性的信息集合，包括注释，钩子，提供的values，以及给定版本生成的清单文件。
    * [`helm get hooks RELEASE_NAME [flags]`](https://helm.sh/zh/docs/helm/helm_get_hooks/) 获取 Release 的钩子
    * [`helm get manifest RELEASE_NAME [flags]`](https://helm.sh/zh/docs/helm/helm_get_manifest/) 获取 Release 的 Kubernetes 声明式配置。
    * [`helm get notes RELEASE_NAME [flags]`](https://helm.sh/zh/docs/helm/helm_get_notes/) 获取 Release 的 NOTE.txt 渲染结果。
    * [`helm get values RELEASE_NAME [flags]`](https://helm.sh/zh/docs/helm/helm_get_values/) 获取 Release 的 values。

### 其他命令

* [`helm plugin`](https://helm.sh/zh/docs/helm/helm_plugin/) 安装、列举或卸载Helm插件。
    * [`helm plugin install [options] <path|url>... [flags]`](https://helm.sh/zh/docs/helm/helm_plugin_install/) 该命令允许您通过VCS仓库url或者本地路径安装插件。
    * [`helm plugin list [flags]`](https://helm.sh/zh/docs/helm/helm_plugin_list/) 列举已安装的Helm插件
    * [`helm plugin uninstall <plugin>... [flags]`](https://helm.sh/zh/docs/helm/helm_plugin_uninstall/) 卸载一个或多个Helm插件
    * [`helm plugin update <plugin>... [flags]`](https://helm.sh/zh/docs/helm/helm_plugin_update/) 升级一个或多个Helm插件。
* [`helm version`](https://helm.sh/zh/docs/helm/helm_version/) 打印 Helm CLI 版本。
* [`helm completion`](https://helm.sh/zh/docs/helm/helm_completion/) 为各种 shell 生成自动补全脚本。
    * [bash](https://helm.sh/zh/docs/helm/helm_completion_bash/)
    * [fish](https://helm.sh/zh/docs/helm/helm_completion_fish/)
    * [powershell](https://helm.sh/zh/docs/helm/helm_completion_powershell/)
    * [zsh](https://helm.sh/zh/docs/helm/helm_completion_zsh/)

## 场景

### 动态依赖

比如，不懂的部署场景，外部依赖不同，比如：

* 部署环境 1：直接使用外部 MySQL，而不需要在 Kubernetes 中部署。
* 部署环境 2：需要在 Kubernetes 中部署 MySQL。

这个场景的实现，参考：[Chart.yaml 详解 - dependencies 的 condition 和 tags 说明](#chart-yaml-详解)。

### 等待依赖就绪

如果想控制服务粒度的启动顺序的前后依赖（比如 App 依赖 MySQL）。

则需要利用 kubernetes 的 init-containers 机制来实现，参考：[Chart 模板渲染结果 apply 顺序](#chart-模板渲染结果-apply-顺序)

### 数据库初始化和迁移

利用 Kubernetes 的 init-container 或者 [helm hook](#生命周期-和-hook)，通过将 `.Chart.appVersion`、`.Release.IsUpgrade` 传递给 container 执行一些迁移/回滚命令。
