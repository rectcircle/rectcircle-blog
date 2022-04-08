---
title: "Go 语言开发"
date: 2021-11-29T22:27:00+08:00
draft: false
toc: true
comments: true
weight: 1400
summary: 阅读本章节，可以了解到如何使用 VSCode 开发 Go 语言项目，并可以获取到基本不输于 Goland 的体验。
---

## 导读

> VSCode Go  扩展版本 0.29.0

阅读本章节，可以了解到如何使用 VSCode 开发 Go 语言项目，并可以获取到基本不输于 Goland 的体验。

## 特性速览

* 智能感知（自动完成、Hover、函数签名）
* 代码导航（调转定义、查找引用、查找实现、调用层次）
* 代码编辑（代码片段、包导入、格式化）
* 重构和代码生成
* 构建、测试和运行调试
* 问题诊断
* 其他（Go Playground）

关于这些特性，介绍，参见 [VSCode 官方文档](https://code.visualstudio.com/docs/languages/go)

## 快速开始

> 参考：[官方文档](https://github.com/golang/vscode-go/blob/master/README.md#quick-start)

* 安装 Go，参见 [Go 官方文档](https://go.dev/doc/install)
* [安装 VSCode](https://code.visualstudio.com/download)，并在 VSCode 中，安装 [Go 扩展](https://marketplace.visualstudio.com/items?itemName=golang.Go)
* 使用 VSCode 打开包含一个 Go 项目目录 （包含 `go.mod` 的目录），按照提示安装依赖工具即可
* Enjoy it!

![image](/image/vscode/golang/installtools.gif)

## 使用指南

### 状态和环境管理

> 参考：[官方文档](https://github.com/golang/vscode-go/blob/master/docs/ui.md)

安装完 [Go 扩展](https://marketplace.visualstudio.com/items?itemName=golang.Go)，并打开一个 Go 项目后。可以通过左下角状态栏，观察到当前系统的 Go 环境和状态。例如 `Go 1.17.1 ⚡`，表示当前系统 Go 版本，`⚡` 代表已经使用 `gopls` 提供能力。

![image](/image/vscode/golang/statusbarmenu.png)

点击状态栏按钮，可以做如下事情

* 打印当前系统的详细状态信息（go env），以及安装的命令行工具。
* Choose Go Environment，可以快速选择或者安装其他版本的 Go。
* 显示 gopls 的日志

### 依赖的命令行工具

> 参考：[官方文档](https://github.com/golang/vscode-go/blob/master/docs/tools.md)

[Go 扩展](https://marketplace.visualstudio.com/items?itemName=golang.Go) 依赖一些社区开发的命令行工具。通过 `>Go: Install/Update Tools` 命令进行安装。

使用 gopls 模式的依赖工具如下表所示（默认）

| 命令名 | 说明 | 何时需要 | 手动安装命令 |
|-------|-----|---------|---------|
| [go](https://github.com/golang/vscode-go/blob/master/docs/tools.md#go)    | Go 语言   | 必装 | [Go 官方文档](https://go.dev/doc/install) |
| [gopls](https://github.com/golang/vscode-go/blob/master/docs/tools.md#gopls)  | Go 语言的 LSP 实现，提供智能感知、代码导航等核心能力     | 必装 | `GO111MODULE=on go get golang.org/x/tools/gopls`  |
| [dlv](https://github.com/golang/vscode-go/blob/master/docs/tools.md#dlv)    | 断点调试（legacy 模式）  | 必装 | go1.14 即之前的版本 `GO111MODULE=on go get github.com/go-delve/delve/cmd/dlv@v1.4.1`，新版本 `GO111MODULE=on go get github.com/go-delve/delve/cmd/dlv` |
| [dlv-dap](https://github.com/golang/vscode-go/blob/master/docs/tools.md#dlv-dap)    | 断点调试（默认）  | 必装 | `GO111MODULE=on GOBIN=/tmp/ go get github.com/go-delve/delve/cmd/dlv@master && mv /tmp/dlv $GOPATH/bin/dlv-dap` |
| [gopkgs](https://github.com/golang/vscode-go/blob/master/docs/tools.md#gopkgs) | 为未导入的包提供自动完成功能 | 必装 | `GO111MODULE=on go get github.com/uudashr/gopkgs/cmd/gopkgs@v2` |
| [go-outline](https://github.com/golang/vscode-go/blob/master/docs/tools.md#go-outline) | 为测试的 code lens 提供信息 | 必装 | `GO111MODULE=on go get github.com/ramya-rao-a/go-outline` |
| [goplay](https://github.com/golang/vscode-go/blob/master/docs/tools.md#goplay) | 为 `Go: Run on Go Playground ` 命令提供支持 | 可选 | `GO111MODULE=on go get github.com/haya14busa/goplay/cmd/goplay` |
| [gomodifytags](https://github.com/golang/vscode-go/blob/master/docs/tools.md#gomodifytags) | 为  `Go: Add Tags to Struct Fields` 和 `Go: Remove Tags From Struct Fields` 命令提供支持 | 可选 | `GO111MODULE=on go get github.com/fatih/gomodifytags` |
| [impl](https://github.com/golang/vscode-go/blob/master/docs/tools.md#impl) | 为 `Go: Generate Interface Stubs` 命令提供支持 | 可选 |`GO111MODULE=on go get github.com/josharian/impl`|
| [gotests](https://github.com/golang/vscode-go/blob/master/docs/tools.md#gotests) | 为 `Go: Generate Unit Tests` 命令提供支持 | 可选 | `go get github.com/cweill/gotests/...` |
| [staticcheck](https://github.com/golang/vscode-go/blob/master/docs/tools.md#staticcheck) | 默认的 lint 工具，可以通过 `"go.lintFlags"` 配置选项 | 可选 | 略 |
| [golangci-lint](https://github.com/golang/vscode-go/blob/master/docs/tools.md#staticcheck) | 可选的 lint 工具，通过 `"go.lintTool"` 配置项配置，可以通过 `"go.lintFlags"` 配置选项 | 可选 | 略 |
| [revive](https://github.com/golang/vscode-go/blob/master/docs/tools.md#staticcheck) | 可选的 lint 工具，通过 `"go.lintTool"` 配置项配置，可以通过 `"go.lintFlags"` 配置选项 | 可选 | 略 |
| [golint](https://github.com/golang/vscode-go/blob/master/docs/tools.md#staticcheck) | 可选的 lint 工具，通过 `"go.lintTool"` 配置项配置 | 可选 | 略 |

使用 legacy 模式的依赖工具如下表所示（通过 `"go.useLanguageServer": false` 启用该模式），不建议使用，具体参见：[官方文档](https://github.com/golang/vscode-go/blob/master/docs/tools.md#misc-tools-used-in-the-legacy-mode)

如果想把命令行工具安装到指定位置，可以通过 `"go.toolsGopath"` 配置项指定。更多关于安装位置，参见[官方文档](https://github.com/golang/vscode-go/blob/master/docs/advanced.md#configuring-the-installation-of-command-line-tools)

### 特性详解

> 参考：[官方文档](https://github.com/golang/vscode-go/blob/master/docs/features.md)

#### 智能感知

* 建议列表 `editor.action.triggerSuggest`，快捷键 `cmd + i`
* 显示悬浮文档 `editor.action.showHover`，快捷键 `cmd+k cmd+i`
* 显示参数和参数位置提示 `editor.action.triggerParameterHints`，快捷键 `cmd+shift+space`

![image](/image/vscode/golang/completion-signature-help.gif)

#### 代码导航

代码编辑器鼠标右击，打开上下文菜单，可以调转定义、查找引用、查找实现、调用层次

* 调转定义 `editor.action.revealDefinition` ，快捷键 `F12`

![image](/image/vscode/golang/gotodefinition.gif)

* 查找引用 `editor.action.goToReferences`，快捷键 `shift+F12`

![image](/image/vscode/golang/findallreferences.gif)

* 查找实现 `editor.action.goToImplementation`，快捷键 `cmd+F12`，光标在接口上

![image](/image/vscode/golang/implementations.gif)

* 查找工作空间所有符号

![image](/image/vscode/golang/workspace-symbols.gif)

* 调用层次 `references-view.showCallHierarchy`，快捷键 `shift+option+H`，命令名 `>Calls: Show Call Hierarchy`

![image](/image/vscode/golang/callhierarchy.gif)

* Explorer （资源管理器）的 Outline （大纲），可以看到当前编辑器打开文件的符号列表

![image](/image/vscode/golang/outline.png)

* `>Go: Toggle Test File` 命令可以快速切换到当前文件的测试文件

![image](/image/vscode/golang/toggletestfile.gif)

#### 代码编辑

![image](/image/vscode/golang/snippets-tys.gif)

##### 动态代码片段

在一个表达式后输入 `.`，有两种常用操作

* `.var!`，将该函数赋值给一个变量 `x, x := 表达式`
* `.print!`，将生成`fmt.Printf("c: %v\n", 表达式)`

##### 静态代码片段

> 完整列表，参见：[配置文件](https://github.com/golang/vscode-go/blob/master/snippets/go.json)

| 分类 | 代码片段 | 说明|
|------|------|------|
| package | pkgm  | main 包和 main 函数 |
| import | im  | `import "$"` |
|  | ims | `import ("$")` |
| 常量变量 | co | `const name = value` |
|       | cos | `const (name = value)` |
|      | var | `var name type` |
| type | tyf | `type name func() ` |
|      | tyi | `type name interface {}` |
|      | tys | `type name struct {}` |
| 流程控制 | switch | switch 块 |
|         | sel | select 块 |
|          | for | `for i := 0; i < count; i++ {}` |
|          | forr | for range 块 |
|          | if | if 块 |
|          | el | else 块 |
|          | ie | if else 块 |
|          | iferr | `if err != nil {}` |
| 内置变量类型 |  ch | `chan type` |
|  |  map | `map[type]type` |
|  |  in | `interface{}` |
| 打印 | fp | `fmt.Println("")` |
|  | ff | `fmt.Printf("", )` |
|  | ff | `fmt.Printf("", )` |
|  | lp | `log.Println("")` |
|  | lf | `log.Printf("", )` |
|  | lv | `log.Printf("var: %#+v\n", var)` |
|  | tl | `t.Log("")` |
|  | tlf | `t.Logf("", var)` |
|  | tlv | `t.Logf("var: %#+v\n", var)` |
| 构造 | make | `make(type, 0)` |
|  | new | `new(type)` |
| panic  | pn | `panic("")` |
| http | wr | `w http.ResponseWriter, r *http.Request` |
| | hf | `http.HandleFunc("/", handler)` |
| | hand | `func (w http.ResponseWriter, r *http.Request) {}` |
| | rd | `http.Redirect(w, r, "/", http.StatusFound)` |
| | herr | `http.Error(w, err.Error(), http.StatusInternalServerError)` |
| | las | `http.ListenAndServe(":8080", nil)` |
| | sv | `http.Serve(":8080", nil)` |
|  | helloweb | 一个简单的 http server |
| 协程 | go | `go func() {}()` |
| | gf | `go func()` |
| | df | `defer func()` |
| 快速函数 | func | `func ()  {}` |
|  | tf | `func Test(t *testing.T) {}` |
|  | tm | `func TestMain(m *testing.M) {os.Exit(m.Run())}` |
|  | bf | `func Benchmark(b *testing.B) { for i := 0; i < b.N; i++ {} }` |
|  | tdt | 生成表格驱动测试函数 |
|  | finit | `func init() {}` |
|  | fmain | `func main() {}` |
|  | meth | `func (receiver type) method()  {}` |
| 排序 | sort | 快速实现 Sort 接口 |

##### 包导入

* 默认保存的时候会自动导入 go.mod 中声明的包。如果，包没有在 go.md 中声明，将光标放到 `import` 语句位置，按 `cmd+.` 选择 `go get xxx`，即可快速导入。
* 通过 ` Go: Add Import` 命令，可以查找所有 GOPATH 和 Go module cache 中的包，并快速添加到 import 块中。

![image](/image/vscode/golang/addimport.gif)

##### 格式化

代码保存是将默认执行格式化。

#### 重构和代码生成

##### 符号重命名

Go 可以重命名工作空间的所有符号，将光标位于需要重命名的符号处，通过 Rename 命令，快捷键为 F2 触发。

![image](/image/vscode/golang/rename.gif)

##### 提取表达式

选中一段代码，按 `cmd+.` 可能触发两种重构行为

* 提取表达式到变量
* 提取代码块到函数

![image](/image/vscode/golang/extract-variable.gif)

##### 添加和删除结构体 tags

光标聚焦于结构体定义位置，执行命令 `Go: Add Tags to Struct Fields` 、`>Go: Remove Tags From Struct Fields` 可以给结构体批量添加或删除 tags。

![image](/image/vscode/golang/addtagstostructfields.gif)

tags 的格式，通过如下配置项配置，配置项的含义，参见 [gomodifytags](https://pkg.go.dev/github.com/fatih/gomodifytags#section-readme)

```json
{
    "go.addTags": {
        "tags": "json",
        "options": "json=omitempty",
        "promptForTags": false,
        "transform": "snakecase",
        "template": ""
    }
}
```

##### 为结构体实现方法

通过 `>Go: Generate Interface Stubs` 命令，并输入 `$接收者名 $结构体类型 $要实现的接口`，在光标处为该结构体生成相关接口的方法

![image](/image/vscode/golang/generateinterfaceimplementation.gif)

##### 生成测试

通过 `>Go: Generate Unit Tests for` 可以快速生成单元测试文件和表格驱动的单元测试函数。该能力由 [gotests](https://github.com/cweill/gotests/) 提供

![image](/image/vscode/golang/generateunittestsforfunction.gif)

##### 填充结构体类型实例化字段

光标位于结构体类型实例化语句内，通过 `cmd+.` 选择 `fill Xxx`，或者 `>Go: Fill struct` 命令，即可快速填充结构体字段

![image](/image/vscode/golang/fillstructliterals.gif)

#### 构建、测试和运行调试

##### 调试或运行项目

想调试、运行项目（main 函数），需要创建 VSCode 调试配置文件 `.vscode/launch.json` 文件并添加 Golang 配置。流程如下：

* `cmd + p` 输入 `debug `，选择添加配置，选择 `Go: Launch Package` 回车将创建并打开 `.vscode/launch.json` 文件
* 启动调试，有如下几种方式
    * `F5` 或者 `>Debug: start debugging` 以上次选中的调试配置启动调试
    * `cmd + p` 输入 `debug ` 并选择调试配置，并启动调试
    * 打开调试侧边栏，绿色三角号
    * 菜单 > Run > Start debugging
* 运行（不调试），有如下几种方式
    * `ctrl+F5` 或者 `>debug: start without debugging`
    * 菜单 > Run > start without debugging

关于调试运行配置，参见下文

##### 测试浏览器

![image](/image/vscode/golang/testexplorer.gif)

##### 测试、基准和覆盖度

* 测试启动可以通过如下方式运行或者调试
    * 点击测试函数上方的 [Code Lens](https://code.visualstudio.com/blogs/2017/02/12/code-lens-roundup)
    * 测试侧边栏，可以看到当前工作空间所有测试文件和函数鼠标点击
    * 通过命令如下命令启动
        * `>Go: Test Function At Cursor`
        * `>Go: Test File, Go: Test Package`
        * `>Go: Test All Packages in Workspace`
* 测试覆盖度
    * 测试覆盖度运行后，编辑器会通过绿色背景色来表示哪些代码被覆盖了，红色背景色表示哪些代码没有被覆盖
    * 通过如下命令触发
        * `Go: Apply Cover Profile`
        * `Go: Toggle Test Coverage in Current Package`
    * 一些配置如下
        * `"go.coverOnSave"` 可以在保存文件时自动执行覆盖度计算（注意性能）
        * `"go.coverOnSingleTest"` 可以在执行单测试函数时自动执行覆盖度计算
        * `"go.coverOnSingleTestFile"` 可以在执行某个测试文件时自动执行覆盖度计算
        * `"go.coverShowCounts"` 可以在覆盖度计算后再函数和条件语句后面显示命中次数
* `>Go: Toggle Test File` 命令可以快速切换到当前文件的测试文件

![image](/image/vscode/golang/toggletestfile.gif)

#### 问题诊断

问题诊断主要有3种

* 第一种为 编译级别错误。通过 `"go.buildOnSave"` 配置项配置保存时编译的范围，来控制检查的代码文件
* 第二种为 Vet 错误。通过 `"go.vetOnSave"` 配置项配置保存时执行 `go vet` 的范围，来控制检查的代码文件
* 第三种为 lint 工具提供的检查，可以通过 `"go.lintTool"` 配置项选择使用的 lint 工具，如果使用的是 staticcheck，可以通过 ` "gopls": { "ui.diagnostic.staticcheck": true }` 来让其运行在 gopls 中

#### 其他特性

##### Go Playground

`>Go: Run On Go Playground` 命令可以把当前文件快速上传到 `https://play.studygolang.com/` （大陆地区无法使用）

### 断点调试

> 本部分介绍的是基于 dlv-dap 模式调试程序，参考：[官方文档](https://github.com/golang/vscode-go/blob/master/docs/debugging.md)

![image](/image/vscode/golang/dlvdap-install.gif)

通过 `.vscode/launch.json` 配置文件的 `configurations` 字段，来配置调试器

![image](/image/vscode/golang/create-launch-json.gif)

简单的例子：当前打开的工作空间是一个 main 包

```json
{
    "name": "Launch Package",
    "type": "go",
    "request": "launch",
    "mode": "auto",
    "program": "${workspaceFolder}"
}
```

#### 配置字段

* `name` 配置名称，可以随意设置
* `type` 调试器类型，必须是调试 go 程序，必须是 go
* `request` 可选项为 `launch` 或 `attach`，`launch` 为调试器会启动一个新的进程，`attach` 为调试器会连接到已经存在的进程或远端端口
* `mode` 调试模式
    * 当 `request` 为 `launch` 可选项为：
        * `debug` 构建并 debug 一个 main 包
        * `test` 构建并 debug 一个 测试文件
        * `exec` 调试编译好的的二进制文件。二进制文件需要使用 `-gcflags=all="-N -l"` 标志来构建，以避免剥离调试信息
        * `auto` 根据打开的文件自动选择 `debug` 或 `test` 模式
        * `core` 调试核心转储文件
        * `replay` 没找到相关文档
    * 当 `request` 为 `attach` 可选项为：
        * `local` 连接到本机进程，对应执行 `dlv attach ...` 命令，需要填写 `processId` 字段
        * `remote` 连接到远程进程，需要填写 `host` 和 `port` 字段
* `request` 为 `launch` 时配置属性
    * `args` 命令行参数，默认为 `[]`
    * `backend` delve 使用的后端，传递到 dlv 的 `--backend` 标志，可选值为 `"default"`, `"native"`, `"lldb"`, `"rr"`
    * `buildFlags` 构建时使用的标志，传递到 dlv 的 `--build-flags` 标志，默认为 `[]`
    * `coreFilePath` 核心转储文件路径，传递到 dlv 仅当 `mode` 为 `core` 时有效
    * `cwd` 默认为当前包所在路径
    * `env` 传递给程序的环境变量
    * `envFile` 包含环境变量定义的文件的绝对路径。可以通过提供一组绝对路径来指定多个文件，默认为 `${workspaceFolder}/.env`
    * `output` 被调试者的二进制文件的输出路径。默认为 `"debug"`
* `debugAdapter` 调试适配器模式 `"legacy"`, `"dlv-dap"` （默认），关于两种模式说明参见下文
* `dlvFlags` dlv 的额外标志。有关受支持的完整列表，请参阅 `dlv help`。 `--log-output`、`--log`、`--log-dest`、`--api-version`、`--output`、`--backend` 等标志在调试配置中已经有相应的属性，并且 `--listen和` 和 `-headless` 在内部使用。如果它们在 `dlvFlags` 中指定，它们可能会被忽略或导致错误。
* `hideSystemGoroutines` 是否在调用栈视图中隐层系统 goroutine，默认为 `false`
* `host`
    * 当 `debugAdapter` 为 `"dlv-dap"` (which does not yet support remote-attach)，表示 host 所在机器上，必须有 `"dlv dap --listen=:"` 监听的端口
    * 当 `debugAdapter` 为 `"legacy"`，仅在 `request` 为 `attach` 且 `mode` 为 `remote` 时有效，表示该 host 所在机器上，必须有 `dlv ... --headless --listen=:` 监听的端口
* `port` 远端端口， 和 `host` 类似
* `logDest` dlv 的 `--log-dest` 标志。有关详细信息，请参阅 `dlv log`。不允许使用数字参数。仅在  `debugAdapter` 为 `"dlv-dap"` 且系统为 Linux 和 Mac OS 上受支持。
* `logOutput` 映射到 dlv 的 `--log-output` 标志。请参阅 `dlv log`，允许值为 `"debugger"`, `"gdbwire"`, `"lldbout"`, `"debuglineerr"`, `"rpc"`, `"dap"`。(默认为 `"debugger"`)
* `remotePath` 废弃
* `showGlobalVariables` 变量视图是否展示全局变量
* `showLog` 映射到 dlv 的 `--log` 选项（默认为 `false`）
* `showRegisters` 是否在变量视图显示寄存器变量（默认为 `false`）
* `stackTraceDepth` dlv 收集的最大栈深度（默认为 50）
* `stopOnEntry` 启动后自动暂停程序（默认为 `false`）
* `substitutePath` 从本地路径（编辑器）到远程路径（调试器）的映射数组。在使用符号链接的文件系统中工作、运行远程调试或调试外部编译的可执行文件时，此设置很有用。调试适配器将在所有调用中用远程路径替换本地路径。
    * `"from"`: 将路径传递给调试器时要替换的绝对本地路径（默认为 `""`）
    * `"to"`：将路径传回客户端时要替换的绝对远程路径（默认为 `""`）
* `processId` 仅 `request` 为 `attach` 且 `mode` 为 `local` 可用，可以填写如下内容
    * 非零数字，直接attach到对应 pid 的进程
    * 字符串，则认为是进程名，需要先找到对应进程，然后再 attach，如果存在多个则弹出选择框
    * 0，列出所有进程，然后再选择一个进程（默认）

![image](/image/vscode/golang/attach.gif)

* `trace` 调试控制台和 `"Go Debug"` 输出面变中，显示的各种级别的日志记录。当 `debugAdapter` 为 `"legacy"`，如果将日志设置为 `error` 以外的值，日志也将写入文件。可选值 `"verbose"`, `"trace"`, `"log"`, `"info"`, `"warn"`, `"error"`（默认值 `"error"`）
* `traceDirPath` Directory in which the record trace is located or to be created for a new output trace. For use on 'replay' mode only (Default: "")

#### 调试行为

![image](/image/vscode/golang/debug-toolbar.png)

* 继续/暂停 `F5`
* 单步跳过 `F10`
* 单步进入 `F11`
* 单步跳出 `⇧F11`
* 重启 `⇧⌘F5`
* 停止 (当 `request` 为 `launch` 时) `⇧F5`
* 断开连接 (当 `request` 为 `attach` 时) `⇧F5`
* Terminate (当 `request` 为 `attach` 时) `⌥⇧F5`

关于停止或者断开 debug 连接的行为为（大概的意思可能是：`local` 断开后，进程不会停止；`remote` 取决于远端 `dlv --headless` 的配置，原文如下）

* Disconnect: disconnect the client and
    * `local`: leave the target process running (dlv terminates).
    * `remote`: let dlv decide if it can continue running (`--accept-multiclient` mode only); if so, the target will stay in halted or running state it was in at disconnect.
        * `dlv debug/test/exec`: terminate the target process if dlv terminates.
        * `dlv attach`: leave the target process running even if dlv terminates.
* Stop: stop the attached server and the target process.

![image](/image/vscode/golang/attach-terminate.gif)

#### 断点

* 普通断点，点击编辑器左侧边框，在指定行添加断点，或者在光标所在位置按 `F9`

![image](/image/vscode/golang/invalid-breakpoint.png)

* 条件断点，右击编辑器左侧边框，选择条件断点
    * 表达式类型，输入一个结果为 bool 的表达式
    * 命中次数类型
        * 支持一个确定的整数
        * 支持比较运算符 (>, >=, <, <=, ==, !=) 加一个整数
        * 支持 `% n` 表示每命中 n 次断点一次

![image](/image/vscode/golang/conditional-breakpoint.gif)

* 函数断点，在测试侧边栏中，最下方断点视图，点击加号，输入当前打开文件的函数名

![image](/image/vscode/golang/function-breakpoint.gif)

* Logpoint，暂不支持

#### 数据检查

观察方式

* 通过将鼠标 hover 在要观察的变量上观察其变量值。

![image](/image/vscode/golang/variable-hover.png)

* 通过调试侧边栏，变量视图，观察当前调用函数内的局部变量值。注意 shadowed 的变量将通过 `(变量名)` 方式展示

![image](/image/vscode/golang/shadowed-variables.png)

* 通过调试侧边栏，监视视图，观察指定的局部变量和全局变量值。
* 通过 DEBUG CONSOLE，输入命令，详见 [Delve expression](https://github.com/go-delve/delve/blob/master/Documentation/cli/expr.md)，调用函数的语法为 `call <function_call_expression>`

默认情况下，变量视图不会展示全局变量，如果需要展示，需在调试配置里面添加 `showGlobalVariables`，或者配置 `go.delveConfig`

在变量和监视视图，变量右击可以做如下操作

* Set Value：只能更改简单的字符串、数字、指针值
* Copy Value：将值复制到剪贴板
* Copy as Expression：当您需要从 DEBUG CONSOLE 面板中的 REPL 进行查询时，这很有用

![image](/image/vscode/golang/debug-console.png)

* Add to Watch：这将自动将表达式添加到 WATCH 部分

#### 调用栈

可以在 在测试侧边栏，调用栈视图，观察所有 goroutines。并可以做如下操作

![image](/image/vscode/golang/callstack-section-annotated.gif)

1. Goroutine 栈的函数名和内部 ID
2. 当前的 goroutine 将使用 `*` 标识. 如果多个 goroutines 同时暂停（例如命中断点），Delve 将随机选择一个。也可能没有当前的 goroutine（例如，死锁、暂停或未运行 goroutine 的系统线程命中的内部断点）。
3. 单击 goroutine 调用堆栈，则会选择该 goroutine。效果是可以看到当前运行到的位置并检查变量
4. 可以选择所选 goroutine 的帧（某个函数调用层次）。 VARIABLE 和 WATCH 部分将相应更新，编辑器中的光标将移动到源代码中的相应位置。
5. 不可以检查的堆栈帧将变灰或折叠
6. 为调度的 goroutine 显示线程 ID
7. 暂停理由。 goroutine 被暂停的原因可能有多种，但目前只给出了一个原因。
8. 函数帧的的文件名和行号。
9. 您可以使用选定的 goroutine 触发调试操作。注意：当前不支持仅恢复或停止单个 goroutine（Go Issue [25578](https://github.com/golang/go/issues/25578)、[31132](https://github.com/golang/go/issues/31132)），因此该操作将导致所有 goroutine 被激活或暂停。
10. 帧的函数名称。

当程序由于异常、panic 或错误访问错误而停止时，CALL STACK 会显示停止原因，并且编辑器会用更多详细信息突出显示源位置。

![image](/image/vscode/golang/panicinfo.png)

#### legacy 和 dlv-dap 模式

> 扩展版本 0.29.0

VSCode Go 的调试协议发展了两个版本：legacy 和 dlv-dap。目前默认已经使用 dlv-dap 了。两者的原理如下所示

dlv-dap 模式的原理为：

```
VSCode DAP Client ---(dap协议)---> dlv-dap server ------> debugee
```

legacy 模式的原理为：

```
VSCode DAP Client ---(dap协议)---> Golang 扩展 JS 实现的 Legacy DAP Server ---(dlv私有协议)---> dlv server ------> debugee
```

官方对比如下图所示

![image](/image/vscode/golang/vscode-go-debug-arch.png)

可以看出 legacy 有一个中转层，而 dlv-dap 则更加直接。

但是注意，某些场景下目前仍需要使用 legacy 模式，如：Go 版本小于等于 Go 1.14

legacy 模式不再建议使用，如需了解，参见：[官方文档](https://github.com/golang/vscode-go/blob/master/docs/debugging-legacy.md)

#### dlv 全局配置

```json
{
    "go.delveConfig": {
        "debugAdapter": "dlv-dap", // 默认为 dlv-dap, 可选值为 dlv-dap, legacy
        // 仅列出两种模式均可用的配置项
        "dlvFlags": [], // dlv help，参见上文调试配置
        "hideSystemGoroutines": false, // 默认为 false，参见上文调试配置
        "logOutput": "debugger", // 默认为 debugger，参见上文调试配置
        "showGlobalVariables": false, // 默认为 false，参见上文调试配置
        "showLog": false, // 默认为 false，参见上文调试配置
        "showRegisters": false, // 默认为 false，参见上文调试配置
        "substitutePath": [], // 参见上文调试配置
    }
}
// 仅 legacy 模式可用配置
{
    "go.delveConfig": {
        "debugAdapter": "legacy",
        "apiVersion": 2, // 可选值为 1, 2 (默认为 2)
        "dlvLoadConfig": {
            "followPointers": true,
            "maxVariableRecurse": 1,
            "maxStringLen": 64,
            "maxArrayValues": 64,
            "maxStructFields": -1
        }
    }
}
```

当 `debugAdapter` 为 `dlv-dap` 同时配置了 `dlvLoadConfig`，将会弹出如下提示。

![image](/image/vscode/golang/dlv-load-config-warning.png)

#### 远程 Debug

##### 方式一：远程运行的是 headless dlv

远端执行如下命令

```bash
# 使用 -gcflags='all=-N -l' 编译出可执行文件
dlv debug /path/to/program --headless --listen=:12345
```

VSCode 调试配置如下

```json
{
    "name": "Connect to external session",
    "type": "go",
    "debugAdapter": "dlv-dap",
    "request": "attach",
    "mode": "remote",
    "port": 12345, // 远端端口
    "host": "xxx.xxx.xxx.xxx", // 远端 ip 或者 host
    "substitutePath": [
      { "from": "${workspaceFolder}", "to": "/path/to/remote/workspace" },
    //   ...
  ]
}
```

* 注意：远端如果使用 `--accept-multiclient` 参数启动，则可以支持断开连接后，远端的 dlv 不会停止

##### 方式二：远程运行的是 dlv-dap

远端执行如下命令

```bash
cd /path/to/remote/workspace # 目的是让 dlv-dap 可以自动编译程序
dlv-dap dap --listen=:12345
```

VSCode 调试配置如下

```json
{
    "name": "Connect and launch",
    "type": "go",
    "debugAdapter": "dlv-dap",
    "request": "launch",
    "port": 12345, // 远端端口
    "host": "xxx.xxx.xxx.xxx", // 远端 ip 或者 host
    "mode": "exec", // 这种模式需要手动前往 使用 -gcflags='all=-N -l' 编译出可执行文件
                    // 还支持 debug、test 模式，此时远端的 dlv-dap 将会先编译程序在启动调试
    "program": "/absolute/path/to/remote/workspace/program/executable",
    "substitutePath": [
        { "from": "${workspaceFolder}", "to": "/path/to/remote/workspace" },
    ]
}
```

注意：

* Delve DAP 不支持代码同步，因此 mode 为 `debug`、`test` 模式，编译的代码是远端的代码
* Delve DAP 1.7.3：Delve DAP 不支持 `--accept-multiclient` 或 `--continue` 标志，这意味着在调试会话结束后，`dlv-dap` 进程将始终退出。[1.7.3 之后已经支持](https://github.com/go-delve/delve/blob/master/CHANGELOG.md#173-2021-11-16)

#### 官方报告调试相关问题

参见：[官方文档](https://github.com/golang/vscode-go/blob/master/docs/debugging.md#developing)

### gopls 配置

> 参考：[官方文档](https://github.com/golang/tools/blob/master/gopls/doc/settings.md)

参见下文：[全部配置项](#全部配置项) 的 gopls 配置

### 全部命令列表

> 扩展版本 0.29.0，参考：[官方文档](https://github.com/golang/vscode-go/blob/master/docs/commands.md)

命令ID  | 命令名 | 说明
--------|-------|-----
go.gopath|Go: Current GOPATH| 显示当前识别到的 GOPATH
go.locate.tools|Go: Locate Configured Go Tools|打印命令行工具的相关信息
go.test.cursor|Go: Test Function At Cursor|执行当前光标所在的测试函数
go.test.cursorOrPrevious|Go: Test Function At Cursor or Test Previous|执行当前光标所在的测试函数，或者执行上一个测试函数
go.subtest.cursor|Go: Subtest At Cursor|执行当前光标所在的子测试，需要输入 `t.Run` 指示的名字
go.benchmark.cursor|Go: Benchmark Function At Cursor|运行光标处的基准函数
go.debug.cursor|Go: Debug Test At Cursor|调试光标处的测试函数
go.test.file|Go: Test File||运行当前文件的所有测试
go.test.package|Go: Test Package|运行当前文件所在的包的所有测试
go.benchmark.package|Go: Benchmark Package|运行当前文件所在的包的所有基准测试
go.benchmark.file|Go: Benchmark File|运行当前文件的所有基准测试
go.test.workspace|Go: Test All Packages In Workspace|运行当前工作空间的所有测试
go.test.previous|Go: Test Previous|运行上一个测试
go.debug.previous|Go: Debug Previous|调试上一个测试
go.test.coverage|Go: Toggle Test Coverage In Current Package|运行当前包的测试并计算覆盖度
go.test.generate.package|Go: Generate Unit Tests For Package|为当前包生成单元测试
go.test.generate.file|Go: Generate Unit Tests For File|为当前文件生成单元测试
go.test.generate.function|Go: Generate Unit Tests For Function|为当前函数生成单元测试
go.impl.cursor|Go: Generate Interface Stubs|为当前光标处的类型生成接口代码
go.extractServerChannel|Go: Extract Language Server Logs To Editor|将语言服务器的日志提取到编辑器中
go.welcome|Go: Welcome|显示欢迎信息
go.toggle.gc_details|Go: Toggle gc details|切换编译器优化选项的显示，打开后，将直接会在问题面板里面显示每个函数的优化情况
go.import.add|Go: Add Import|添加导入
go.add.package.workspace|Go: Add Package to Workspace| 添加包到工作空间，将光标放到 `import` 块，运行该命令会直接将当前包在 VSCode 中打开，在阅读源码的时候很有用
go.tools.install|Go: Install/Update Tools|安装或更新扩展依赖的命令行工具
go.toggle.test.file|Go: Toggle Test File|切换当前文件的测试文件
go.add.tags|Go: Add Tags To Struct Fields|为当前结构体的字段添加标签
go.remove.tags|Go: Remove Tags From Struct Fields|为当前结构体的字段移除标签
go.fill.struct|Go: Fill struct|为当前结构体的字段填充值
go.show.commands|Go: Show All Commands...|显示所有命令
go.browse.packages|Go: Browse Packages|浏览包
go.get.package|Go: Get Package|获取包，光标放到 `import` 块，运行该命令会执行 `go get`
go.playground|Go: Run on Go Playground|在 Go Playground 上运行当前文件
go.lint.package|Go: Lint Current Package|对当前包执行 lint
go.lint.workspace|Go: Lint Workspace|对工作空间执行 lint
go.vet.package|Go: Vet Current Package|对当前包执行 vet
go.vet.workspace|Go: Vet Workspace|对工作空间执行 vet
go.build.package|Go: Build Current Package|构建当前包
go.build.workspace|Go: Build Workspace|构建工作空间
go.install.package|Go: Install Current Package|安装当前包，光标放到 `import` 块，运行该命令会执行 `go get`
go.run.modinit|Go: Initialize go.mod|初始化 go.mod
go.test.cancel|Go: Cancel Running Tests|需要正在运行的测试
go.apply.coverprofile|Go: Apply Cover Profile|应用覆盖度文件
go.godoctor.extract|Go: Extract to function|提取函数
go.godoctor.var|Go: Extract to variable|提取变量
go.languageserver.restart|Go: Restart Language Server|重启语言服务器
go.environment.choose|Go: Choose Go Environment|选择 Go 环境
go.survey.showConfig|Go: Show Survey Configuration|配置 Go 扩展的问卷调查
go.survey.resetConfig|Go: Reset Survey Configuration|重置 Go 扩展的问卷调查
go.workspace.resetState|Go: Reset Workspace State|重置工作空间状态
go.global.resetState|Go: Reset Global State|重置全局状态

### 全部配置项

> 扩展版本 0.29.0，参考：[官方文档](https://github.com/golang/vscode-go/blob/master/docs/settings.md)

除非特殊说明，下文配置项的值为默认值。

```json
{
    "go.buildOnSave": "package", // 保存时自动构建的范围
    "go.buildFlags": [], // 如 ["-ldflags='-s'"] 在 build-on-save 或者运行测试时编译参数。如果 `gopls.build.buildFlags` 没指定，则使用该参数
    "go.buildTags": [], // 支持 -tags '' （条件编译） ，运行测试时，如果 go.testTags 没指定，则使用该参数。如果 `gopls.build.buildFlags` 没指定，则使用该参数
    "go.testTags": null, // 参见 go.buildTags
    "go.disableConcurrentTests": false, // 使用禁用并发测试，如果该配置为 true，则新的测试运行时，旧的测试将被取消
    "go.installDependenciesWhenBuilding": false, // go build 时传递 -i 参数，非 go mod 模式可能才需要配置
    "go.lintOnSave": "package", // 保存时自动 lint 的范围
    "go.lintTool": "staticcheck", // lint 工具
    "go.lintFlags": [], // lint 工具 flag，如 ["-min_confidence=.8"]
    "go.vetOnSave": "package", // 保存时自动 vet 的范围
    "go.vetFlags": [],  // go tool vet 参数，如 ["-all", "-shadow"]
    "go.gopath": null, // 指定 GOPATH，go.inferGopath 为 true 推导出的 GOPATH 优先级高于该配置（如果该配置在 .vscode/settings.json 中配置，仅当 "Go: Toggle Workspace Trust Flag" 为信任时才生效）
    "go.toolsGopath": null, // 扩展依赖的命令行工具编译安装时使用的 GOPATH，如果没有指定，则使用系统 GOPATH（如果该配置在 .vscode/settings.json 中配置，仅当 "Go: Toggle Workspace Trust Flag" 为信任时才生效）
    "go.goroot": null, // 指定 GOROOT（如果该配置在 .vscode/settings.json 中配置，仅当 "Go: Toggle Workspace Trust Flag" 为信任时才生效）
    "go.testOnSave": false, //	是否在保存时对当前包运行 'go test'
    "go.coverOnSave": false, // 是否在保存时对当前包运行 'go test -coverprofile'
    "go.coverOnTestPackage": true, // 在执行 Go: Test Package 是否计算覆盖度
    "go.coverOnSingleTest": false, // 在执行 Go: Test Function at cursor 时是否计算覆盖度
    "go.coverOnSingleTestFile": false, // 在执行 Go: Test Single File 时是否计算覆盖度
    "go.coverMode":	"default", // 覆盖度模式
    "go.coverShowCounts": false , // 运行覆盖度时，是否在编辑器中显示函数和条件的命中次数如 --374--
    "go.coverageOptions": "showBothCoveredAndUncoveredCode", // 覆盖度结果在编辑器中的显示样式
    "go.coverageDecorator": { // 覆盖度结果显示的样式
        "type": "highlight",
        "coveredHighlightColor": "rgba(64,128,128,0.5)",
        "uncoveredHighlightColor": "rgba(128,64,64,0.25)",
        "coveredBorderColor": "rgba(64,128,128,0.5)",
        "uncoveredBorderColor": "rgba(128,64,64,0.25)",
        "coveredGutterStyle": "blockblue",
        "uncoveredGutterStyle": "slashyellow"
    },
    "go.testTimeout": "30s", // 测试超时时间
    "go.testEnvVars": {}, // 测试运行时的环境变量
    "go.testEnvFile": "", // 测试时环境变量的绝对路径
    "go.testFlags": "", // 构建测试时的 flag，参见 go.buildFlags
    "go.testExplorer.enable": true, // 是否启用测试浏览器
    "go.testExplorer.packageDisplayMode": "flat", // Present packages in the test explorer flat or nested.	flat
    "go.testExplorer.alwaysRunBenchmarks": false, // 运行所有测试时，是否也运行基准测试
    "go.testExplorer.concatenateMessages": true, // Concatenate all test log messages for a given location into a single message
    "go.testExplorer.showDynamicSubtestsInEditor": false,	// 动态发现的子测试是否显示到测试浏览器中
    "go.testExplorer.showOutput": true, // 开始测试运行时打开测试输出终端 
    "go.generateTestsFlags": null, // 生成测试的命令行参数，去 https://github.com/cweill/gotests 查看
    "go.toolsEnvVars": {}, // 运行命令行工具时的环境变量
    "go.useLanguageServer": true, // 启用 gopls
    "go.languageServerFlags": [], // gopls 命令行参数 Flags like -rpc.trace and -logfile to be used while running the language server.	
    "go.languageServerExperimentalFeatures": { "diagnostics": true }, // 临时标志去 enable/disable gopls 的 diagnostics 能力.很快要废弃了. 请看 Issue 50: https://github.com/golang/vscode-go/issues/50
    "go.trace.server": "off", // 跟踪 VS Code 和 Go 语言服务器之间的通信。
    "go.logging.level": "error", // 扩展日志登记
    "go.toolsManagement.checkForUpdates": "proxy", // 指定是否提示新版本的 Go 以及扩展依赖的 Go 工具（目前只有 gopls） 
    "go.toolsManagement.autoUpdate": false, // 自动更新扩展依赖的命令行工具，不提示用户 
    "go.useGoProxyToCheckForToolUpdates": true, // 启用后，扩展程序会自动检查 Go 代理是否有可用于 Go 和它所依赖的 Go 工具（目前只有 gopls）的更新，并相应地提示用户
    "go.enableCodeLens": {
        "references": false, // 函数上的引用次数
        "runtest": true // 测试上面的运行/debug
    }, // 配置 CodeLen
    "go.addTags": {
        "tags": "json",
        "options": "json=omitempty",
        "promptForTags": false,
        "transform": "snakecase",
        "template": ""
    }, // 添加标签命令将使用此处配置的标签和选项将标签添加到结构字段。如果 promptForTags 为 true，则将提示用户输入标签和选项。默认添加json标签。 
    "go.removeTags": {
        "tags": "",
        "options": "",
        "promptForTags": false
    }, // 此处配置的标签和选项将被移除标签命令用于移除结构字段的标签。 如果 promptForTags 为 true，则将提示用户输入标签和选项。 默认情况下，所有标签和选项都将被删除。
    "go.playground": {
        "openbrowser": true,
        "share": true,
        "run": true
    }, // 此处配置的标志将传递给命令 `goplay`
    "go.survey.prompt": true, // 是否展示问卷调查
    "go.editorContextMenuCommands": {
        "toggleTestFile": true,
        "addTags": true,
        "removeTags": false,
        "fillStruct": false,
        "testAtCursor": true,
        "testFile": false,
        "testPackage": false,
        "generateTestForFunction": true,
        "generateTestForFile": false,
        "generateTestForPackage": false,
        "addImport": true,
        "testCoverage": true,
        "playground": true,
        "debugTestAtCursor": true,
        "benchmarkAtCursor": false
    }, // 实验性功能：从编辑器的上下文菜单中启用/禁用条目。
    "go.delveConfig": {}, // dlv 配置
    "go.alternateTools": {}, // 为每一个 go 扩展依赖的外部工具提供绝对路径，比如想包装一下你的工具，如 "gopls": "/path/to/gopls"
    "gopls": { // 配置 gopls，默认值为 {}，详见：https://github.com/golang/tools/blob/master/gopls/doc/settings.md
        // 构建
        "build.buildFlags": [], // 构建标志
        "build.env": {}, // 环境变量
        "build.directoryFilters": ["-node_modules"], // 目录过滤器，配置方法参见： https://github.com/golang/tools/blob/master/gopls/doc/settings.md#directoryfilters-string
        "build.templateExtensions": ["tmpl","gotmpl"], // go template 扩展名
        "build.memoryMode": "Normal", // <实验性> DegradeClosed ，在 DegradeClosed 模式下，gopls 将收集关于没有打开文件的包的较少信息。因此，诸如 Find References 和 Rename 之类的功能将错过此类包中的结果。
        "build.expandWorkspaceToModule": true, //  <实验性> expandWorkspaceToModule 指示 gopls 调整工作区的范围以找到最佳的可用模块根。 gopls 首先在工作区文件夹的任何父目录中查找 go.mod 文件，如果存在，则将范围扩展到该目录。如果找不到可行的父目录，gopls 将检查是否只有一个包含 go.mod 文件的子目录，如果存在，则将范围缩小到该目录。
        "build.experimentalWorkspaceModule": false, // <实验性>  选择用户加入对多模块工作区的实验支持。
        "build.experimentalPackageCacheKey": false, // <实验性> 控制是否对包类型信息使用更粗略的缓存键以增加缓存命中。此设置从缓存键中删除用户的环境、构建标志和工作目录，这应该是一个安全的更改，因为类型检查传递的所有相关输入都已散列到键中。这是由实验暂时保护的，因为缓存行为是微妙的，难以全面测试。
        "build.allowModfileModifications": false, // <实验性> 禁用 -mod=readonly，允许从范围外模块导入。此选项最终将被删除。
        "build.allowImplicitNetworkAccess": false, // <实验性> 禁用 GOPROXY=off，允许隐式模块下载而不需要用户操作。此选项最终将被删除。
        "build.experimentalUseInvalidMetadata": false, // <实验性> 如果 go 命令由于某种原因（例如无效的 go.mod 文件）无法加载包，则 ExperimentUseInvalidMetadata 使 gopls 能够回退到过时的包元数据以提供编辑器功能。这最终将成为默认行为，并且此设置将被删除。

        // 格式化
        "formatting.local": "", // local 相当于 goimports -local 标志，它将以该字符串开头的导入放在第三方包之后。它应该是导入应该单独分组的导入路径的前缀。
        "formatting.gofumpt": false, // gofumpt 指示我们是否应该运行 gofumpt 格式化。gofumpt 是比 go fmt 更严格的规范，https://github.com/mvdan/gofumpt

        // UI
        "ui.codelenses": { // 参见 https://github.com/golang/tools/blob/master/gopls/doc/settings.md#code-lenses
            "gc_details": false,
            "generate": true,
            "regenerate_cgo": true,
            "tidy": true,
            "upgrade_dependency": true,
            "vendor": true
        },
        "ui.semanticTokens": false, // 是否 gopls 把语义化令牌发到 UI 上，开启后，有更好的高亮效果
        "ui.completion.usePlaceholders": false, // 函数调用的自动完成是否填充参数列表
        "ui.completion.completionBudget": "100ms", // 此设置仅用于调试目的。完成请求的耗时预算。大多数请求在几毫秒内完成，但在某些情况下，深度完成可能需要更长的时间。当我们用完预算时，我们会动态缩小搜索范围，以确保及时返回结果。零意味着无限。
        "ui.completion.matcher": "Fuzzy", // 匹配算法，可以是 Fuzzy、CaseSensitive、CaseInsensitive
        "ui.completion.experimentalPostfixCompletions": true, // <实验性> 启用后缀补全，例如 "someSlice.sort!"
        "ui.diagnostic.analyses": {
            // 再次记录没有默认开启的分析器
            "fieldalignment": true, // 结构体排序检查，那种排列内存占用更小，但是没有提供自动修复的功能，不建议开启
            "nilness": true, // 对于 nil 的一些检查
            "shadow": true, // 检查变量覆盖
            "unusedparams": true, // 未使用的参数
            "unusedwrite": true, // 未使用的写入
        }, // 分析器配置，参见 https://github.com/golang/tools/blob/master/gopls/doc/analyzers.md
        "ui.diagnostic.staticcheck": false, // 启用 staticcheck 分析器，让 lint 在 gopls 中执行
        "ui.diagnostic.annotations": {"bounds":true,"escape":true,"inline":true,"nil":true}, // 注释指定应由 gc_details 命令报告的各种优化诊断。
        "ui.diagnostic.diagnosticsDelay": "250ms", // 参见 https://github.com/golang/tools/blob/master/gopls/doc/settings.md#diagnosticsdelay-timeduration
        "ui.diagnostic.experimentalWatchedFileDelay": "0s", // <实验性> 参见 https://github.com/golang/tools/blob/master/gopls/doc/settings.md#experimentalwatchedfiledelay-timeduration
        "ui.documentation.hoverKind": "FullDocumentation",  // hover 种类
        "ui.documentation.linkTarget": "pkg.go.dev", // link 目标
        "ui.documentation.linksInHover": true, // 在 hover 中显示链接
        "ui.navigation.importShortcut": "Both", // 导入块执行调转到定义的方式，可以是 Both、Definition、Link
        "ui.navigation.symbolMatcher": "Fuzzy", // 设置查找工作区符号时使用的算法，可以是 Fuzzy、FastFuzzy、CaseSensitive、CaseInsensitive
        "ui.navigation.symbolStyle": "Dynamic", // 控制符号唯一表示非风格，可以是 Dynamic、Full、Package
        "verboseOutput": false, // 输出 gopls 的详细信息
    },
}
// 非 gopls 模式才生效的配置
{
    "go.formatTool": "default", //  格式化工具
    "go.formatFlags": [], // Flags to pass to format tool (e.g. ["-s"])
    "go.inferGopath": false, // 从工作空间推断 gopath，优先级高于 go.gopath（如果该配置在 .vscode/settings.json 中配置，仅当 "Go: Toggle Workspace Trust Flag" 为信任时才生效）
    "go.gocodeFlags": null, //	gocode 命令行参数 如-builtin,-ignore-case,-unimported-packages
    "go.gocodeAutoBuild": false, //	Enable gocode's autobuild feature
    "go.gocodePackageLookupMode": "go", // Used to determine the Go package lookup rules for completions by gocode. Latest versions of the Go extension uses mdempsky/gocode by default.
    "go.useCodeSnippetsOnFunctionSuggest": false, // Complete functions with their parameter signature, including the variable type.
    "go.useCodeSnippetsOnFunctionSuggestWithoutType": false, // 完成函数的建议列表时，填充函数参数（不包括类型） 如果是 gopls，使用 `gopls.usePlaceholders` 可进行配置。
    "go.autocompleteUnimportedPackages": false, // 在自动完成建议中包含未导入的包 
    "go.docsTool": "godoc", //	选择 'godoc' or 'gogetdoc' 获取文档
    "go.gotoSymbol.includeImports": false, // If false, the import statements will be excluded while using the Go to Symbol in File feature.
    "go.gotoSymbol.includeGoroot": false, // If false, the standard library located at $GOROOT will be excluded while using the Go to Symbol in File feature.
    "go.liveErrors": {
        "enabled": false,
        "delay": 500
    }, // Use gotype on the file currently being edited and report any semantic or syntactic errors found after configured delay.
    "go.gotoSymbol.ignoreFolders": [], // Folder names (not paths) to ignore while using Go to Symbol in Workspace feature.
}

```

## 场景

### Go 扩展最佳配置

```json
{
    "go.disableConcurrentTests": true, // 禁用并发测试
    "go.testFlags": [
        "-v" // 测试打印标准输出
    ],
    "go.vetFlags": [
        "-all" // vet 执行所有规则
    ],
    "go.testTimeout": "30s", // 测试超时时间
    "go.testExplorer.showDynamicSubtestsInEditor": true, // 动态发现的子测试是否显示到测试浏览器中
    "go.toolsManagement.autoUpdate": true, // 自动更新扩展依赖的命令行工具，不提示用户 
    "go.enableCodeLens": { // 显示的 lens
        "references": true,
        "runtest": true
    },
    "go.addTags": { // 配置 add Tags 命令
        "tags": "json,yaml",
        "options": "json=omitempty",
        "promptForTags": true, // 询问添加的 tag
        "transform": "snakecase",
        "template": ""
    },
    "go.removeTags": { // 配置 remove Tags 命令
        "tags": "",
        "options": "",
        "promptForTags": true // 询问删除的 tag
    },
    // "go.delveConfig": { // dlv 配置，如果特殊场景需要看比较长的字符串时，可以打开该注释，启用该配置
    //     "debugAdapter": "legacy",
    //     "dlvLoadConfig": {
    //         "followPointers": true,
    //         "maxVariableRecurse": 1,
    //         "maxStringLen": 1000000,
    //         "maxArrayValues": 64,
    //         "maxStructFields": -1
    //     }
    // },
    "gopls": {
        "build.experimentalWorkspaceModule": true, // <实验性> 工作空间多模块支持（MonoRepo）
        "build.directoryFilters": ["-node_modules", "-output"], // 构建排除的目录，合理配置可以节省资源
        "formatting.gofumpt": true, // 使用 gofumpt 格式化代码
        "ui.semanticTokens": true,  // 是否 gopls 把语义化令牌发到 UI 上，开启后，有更好的高亮效果
        "ui.completion.usePlaceholders": true,  // 函数调用的自动完成是否填充参数列表
        "ui.diagnostic.analyses": { // 开启默认没有开启的且误报较少的分析器，参见 https://github.com/golang/tools/blob/master/gopls/doc/analyzers.md
            "nilness": true,
            "shadow": true,
            "unusedparams": true,
            "unusedwrite": true,
        },
    },
}
```

### 大型项目资源占用优化

参考如下，酌情进行配置，这些配置可能影响稳定性以及功能

```json
{
    "gopls": {
        "build.directoryFilters": ["-node_modules", "-output"], // 将工作空间不是 Go 代码的目录排除出去，配置方法参见： https://github.com/golang/tools/blob/master/gopls/doc/settings.md#directoryfilters-string
        "build.experimentalPackageCacheKey": true, // <实验性> 控制是否对包类型信息使用更粗略的缓存键以增加缓存命中。此设置从缓存键中删除用户的环境、构建标志和工作目录，这应该是一个安全的更改，因为类型检查传递的所有相关输入都已散列到键中。这是由实验暂时保护的，因为缓存行为是微妙的，难以全面测试。

        // 下方配置功能有损
        "build.memoryMode": "DegradeClosed", // <实验性> DegradeClosed ，在 DegradeClosed 模式下，gopls 将收集关于没有打开文件的包的较少信息。因此，诸如 Find References 和 Rename 之类的功能将错过此类包中的结果。
    }
}
```

### 关于调试的一些场景和问题

#### VSCode 打开符号链接上的项目如何调试

如果一个项目，真实路径为 `/path/to/actual/helloWorld`，同时可以通过一个符号链接访问 `/link/to/helloWorld`，此时调试配置如下

```json
{
    "name": "Launch with symlinks",
    "type": "go",
    "request": "launch",
    "mode": "debug",
    "program": "/path/to/actual/helloWorld",
    "substitutePath": [
		{
			"from": "/link/to/helloWorld",
			"to": "/path/to/actual/helloWorld",
		},
	],
}
```

#### 调试时字符串被截断

目前，默认启用了 `dlv-dap` 模式，因此无法配置 dlv 的字符串长度。这种情况下

* 通过变量视图，直接查看，最多只能看到 512 个字符
* 通过如下方式可以看到 4096 个字符
    * 右击 Copy Value
    * 右击 Copy as Expression，并在 DEBUG CONSOLE 输入
    * 鼠标 Hover 在变量上

如果是更长的字符串，在 `dlv-dap` 模式下，只能通过 fmt.Println 打印出来查看。

另外不推荐的方法是，切换回 `legacy` 模式。配置 `maxStringLen` 属性。

```json
{
    "go.delveConfig": {
        "debugAdapter": "legacy",
        "dlvLoadConfig": {
            "followPointers": true,
            "maxVariableRecurse": 1,
            "maxStringLen": 1000000,
            "maxArrayValues": 64,
            "maxStructFields": -1
        }
    }
}
```

#### debug 过程中添加断点后，会暂停一次

已知问题，官方正在处理，可以关注相关 [issue](https://github.com/golang/vscode-go/issues/1676)

#### 调试编译十分复杂的项目

在编译配置文件添加 debug 模式的构建，添加 `-gcflags='all=-N -l'` 选项。

配置任务和调试

```json
// .vscode/launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch external builded binary",
            "type": "go",
            "request": "launch",
            "mode": "exec",
            "preLaunchTask": "make debug",
            "program": "${workspaceRoot}/path/to/debug-binary",
        }
    ]
}
// .vscode/tasks.json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "make debug",
            "type": "shell",
            "command": "make debug"
        }
    ]
}
```

#### 如何调试 go 1.14 及之前版本的项目

最新版的 dlv 已经放弃了对 go 1.14 以及之前版本的支持。因此需要安装旧版 dlv，步骤如下所示

* 执行 `>Go: Locate Configured Go Tools` 命令，确认 dlv 安装位置
* 执行 `GOBIN=上面输出的dlv所在目录 GO111MODULE=on go get github.com/go-delve/delve/cmd/dlv@v1.4.1`，安装旧版本 dlv
* 确保关闭自动更新并启用 legacy 模式

```json
{
    "go.toolsManagement.autoUpdate": false,
    "go.delveConfig": {
        "debugAdapter": "legacy",
    }
}
```

#### 如何调试 core dump 文件

core dump 是 *nix 类操作系统提供的进程 crash 时刻的进程状态快照。在该文件中，包含进程 crash 时刻的所有堆栈和寄存器信息。利用调试器，可以查看 crash 时刻的各个线程的栈帧，变量。（以下仅在 Linux 测试通过）

假设，编写一个 go 程序，该程序会 sleep 1 小时。在 sleep 的时候通过 `ctrl + \` 发送一个 `SIGQUIT` 信号，制造一个 go 的 coredump 文件。在实验之前确保确保操作系统不限制 core dump 大小：执行 `ulimit -a`，观察 `-c` 一行是否为 `unlimited`。如果不是执行 `ulimit -c unlimited` （恢复方式为 `ulimit -c 原始值`）

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	a := 1
	fmt.Println(a)

	// ctrl + \
	time.Sleep(1 * time.Hour)

	b := 2

	fmt.Println(b)
}
```

编译成带有符号信息的可执行文件

```bash
go build -gcflags='all=-N -l' -o main ./
```

执行（注意环境变量），键盘输入 `ctrl + \`

```bash
GOTRACEBACK=crash ./main
```

执行 `cat /proc/sys/kernel/core_pattern` 获取 core dump 路径。

配置 VSCode 调试器 `.vscode/launch.json`

```json

{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch core dump",
            "type": "go",
            "request": "launch",
            "mode": "core",
            "coreFilePath": "上一步获取到 core dump 文件路径",
            "program": "${workspaceFolder}/main"
        }
    ]
}
```

按 F5 即可启动调试，此时观察下，调试视图的调用栈视图，即可观察各个栈帧的变量情况。

#### 一键同时调试多个进程

假设某个项目是同时包含客户端和服务端。调试时，希望一键启动客户端和服务端。配置如下：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Server",
      // ...
    },
    {
      "name": "Client",
      // ...
    }
  ],
  "compounds": [
    {
      "name": "Server/Client",
      "configurations": ["Server", "Client"],
      "preLaunchTask": "${defaultBuildTask}"
    }
  ]
}
```

更多参见：https://code.visualstudio.com/docs/editor/debugging#_compound-launch-configurations

#### VSCode Go 插件版本 v0.31.0 远程调试问题

v0.31.0 后，默认 Remote 调试协议已经替换为 `dap`，因此需要使用，如果远端仍然使用旧的模式，需要在 `launch.json` 添加 `"debugAdapter":"legacy"`：

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch: server",
            "type": "go",
            "request": "attach",
            "host": "127.0.0.1",
            "port": 2345,
            "debugAdapter":"legacy",
        }
    ]
}
```

### 如何高效进行项目源码阅读

* 参见本文的 [代码导航](#代码导航) 章节
* 阅读依赖包的源码，通过 `>Go: Add Package to Workspace`，将依赖包加入到工作空间

### 系统里装了多个版本的 Go SDK，如何管理

可以尝试 `>Go: Choose Go Environment` 命令，官方解决办法参见：[官方文档](https://github.com/golang/vscode-go/blob/master/docs/advanced.md#choosing-a-different-version-of-go)

### 多 module 项目 （Go workspace）

> 参见：[官方文档](https://github.com/golang/tools/blob/master/gopls/doc/workspace.md#multiple-modules)

形如：[Golang Multimodule Monorepos](https://irilivibi.medium.com/golang-multimodule-monorepo-tutorial-3f5cf10e9b9a) 的项目。

#### Go 1.17 及之前版本

开启如下配置即可开启该特性（目前处于实验阶段）

```json
{
    "gopls": {
        "experimentalWorkspaceModule": true
    }
}
```

注意，目前处于实验阶段，已知 issue 为：

* 该 feature 与 go mod vender 存在重复，开启后 go mod vender 的项目会报 `Inconsistent vendoring detected. Please re-run "go mod vendor". See https://github.com/golang/go/issues/39164 for more detail on this issue.` 错误。

其他信息

* [设计文档](https://github.com/golang/proposal/blob/master/design/37720-gopls-workspaces.md)
* [gopls 配置文档](https://github.com/golang/tools/blob/master/gopls/doc/settings.md#experimentalworkspacemodule-bool)
* [gopls/workspace-module milestone](https://github.com/golang/go/milestone/179)

#### Go 1.18 及更新版本

无需任何配置，在根目录添加 `go.work` 文件，更多参见：[Go 1.18 新特性](/posts/go-1-18-features/#工作空间)

### 如何使用 VSCode Go 扩展开发 Go 标准库

解决方法参见：[官方文档](https://github.com/golang/vscode-go/blob/master/docs/advanced.md#working-on-the-go-standard-library-and-the-go-tools)

### 存在多个格式化器时如何配置使用 Go 扩展

解决方法参见：[官方文档](https://github.com/golang/vscode-go/blob/master/docs/advanced.md#formatting-code-and-organizing-imports)

### 非 go mod 项目

GOPATH 迁移到 Go modudle 非常容易，建议花少量时间迁移到 Go modudle 模式。如果仍要使用 GOPATH 开发模式，可以参考：[官方文档](https://github.com/golang/vscode-go/blob/master/docs/gopath.md)

### 跨平台开发，如在 Mac 开发 Linux

添加如下 VSCode 配置，参考： [github issue](https://github.com/golang/go/issues/29202#issuecomment-488469829)

```json
{
    "gopls": {
        "build.env": {
            "GOOS": "linux",
            "GOARCH": "amd64"
        },
    },
}
```
