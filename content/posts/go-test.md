---
title: "Go Test 详解"
date: 2022-08-06T23:41:09+08:00
draft: false
toc: true
comments: true
tags:
  - golang
---

## 概述

本文主要介绍：

* Go 标准库 [testing](https://pkg.go.dev/testing@go1.18) 包 和 go test [命令](https://pkg.go.dev/cmd/go@go1.18)。
* Go 官方维护的 [Mock](https://github.com/golang/mock) 库。
* Go 社区最主流的测试库 [Testify](https://github.com/stretchr/testify#mock-package)。

本文使用的 Go 版本为 1.18，示例代码位于 [rectcircle/go-test-demo](https://github.com/rectcircle/go-test-demo)。

## Go 标准库 testing 包 和 `go test` 命令

Go 通过标准库的 testing 包和 Go 命令行工具 test 相关命令，在语言层面，提供了一整套全面的测试机制。

本小结主要介绍如何使用 testing 包编写各种类型的测试函数。

### 常规测试

一个被测函数位于 `01-testing/01-testfunc.go` 文件：

```go
package testingdemo

func IntAbs(a int) int {
	if a < 0 {
		return -a
	}
	return a
}
```

测试函数位于 `01-testing/01-testfunc_test.go` 文件。

```go
package testingdemo

import "testing"

func TestIntAbs(t *testing.T) {
	got := IntAbs(-1)
	if got != 1 {
		t.Errorf("Abs(-1) = %d; want 1", got)
	}
	got = IntAbs(1)
	if got != 1 {
		t.Errorf("Abs(1) = %d; want 1", got)
	}
}
```

测试函数编写的基本要求为：

* 测试源码的文件名以 `_test.go` 结尾。
* 测试函数的函数名以 `Test` 开头。
* 函数签名为 `func (t *testing.T)`。

通过 `go test -run ^TestIntAbs$ ./01-testing` 命令，可以运行测试函数。

[`*testing.T` 类型](https://pkg.go.dev/testing@go1.18#T)

* 常用方法如下：
    * `func (c *T) Fail()` 将测试函数标记为失败，但仍继续执行。
    * `func (c *T) FailNow()` 将测试函数标记为失败，并调用 `runtime.Goexit`，终止该协程。
    * `func (c *T) Log(args ...any)` 打印日志，类似于 Println，仅当运行测试添加 `-v` 标志，或者测试失败时，才打印日志。
    * `func (c *T) Logf(format string, args ...any)` 打印日志，类似于 `Printf`，仅当运行测试添加 `-v` 标志，或者测试失败时，才打印日志。
    * `func (c *T) Error(args ...any)` 等价于调用 `Log` 后跟 `Fail`。
    * `func (c *T) Errorf(format string, args ...any)` 等价于 `Logf` 后跟 `Fail`。
    * `func (c *T) Fatal(args ...any)` 等价于调用 `Log` 后跟 `FailNow`。
    * `func (c *T) Fatalf(format string, args ...any)` 等价于 `Logf` 后跟 `FailNow`。
    * `func (c *T) SkipNow()` 将测试标记为已被跳过，并通过调用 `runtime.Goexit` 停止执行。如果测试失败（参见 `Error`, `Errorf`, `Fail`）然后被跳过，它仍然被认为是失败的。另请参阅 `FailNow`。 `SkipNow` 必须从运行测试的 goroutine 调用，而不是从测试期间创建的其他 goroutine 调用。调用 `SkipNow` 不会停止其他 goroutine。
    * `func (c *T) Skip(args ...any)` 等价于 `Log` 后跟 `SkipNow`。
    * `func (c *T) Skipf(format string, args ...any)` 等价于 `Logf` 后跟 `SkipNow`。

    * `func (c *T) Cleanup(f func())` 注册清理函数，调用顺序为，后添加，先调用。
    * `func (t *T) Parallel()` 表示该测试将与（并且仅与）其他并行测试并行运行。（当使用 `-count` 或 `-cpu` 多次运行测试时，单个测试的多个实例永远不会彼此并行运行）
    * `func (t *T) Run(name string, f func(t*T)) bool` 运行 t 的子测试，名为 name ，测试函数 f 。它在单独的 goroutine 中运行 f 并阻塞，直到 f 返回或调用 `t.Parallel`。 Run 报告 f 是否成功（或者至少在调用 `t.Parallel` 之前没有失败）。可以从多个 goroutine 同时调用 Run，但所有此类调用都必须在外部测试函数 t 返回之前返回。
* 其他方法如下：
    * `func (c *T) Name() string` 返回当前测试/子测试函数的名称，如果存在同名的，将自动添加一个后缀。
    * `func (c *T) Skipped() bool` 是否被跳过。
    * `func (c *T) TempDir() string` 返回一个临时目录供测试使用。当测试及其所有子测试完成时，`Cleanup` 会自动删除该目录。对 `t.TempDir` 的每次后续调用都会返回一个唯一的目录；如果目录创建失败，TempDir 通过调用 `Fatal` 终止测试。
    * `func (c *T) Helper()` 标记该函数为辅助函数，在测试失败或打印日志时，将不会打印该函数的调用栈或日志。
    * `func (t *T) Deadline() (deadline time.Time, ok bool)` 返回运行测试时 `-timeout` 设置的时间，默认为 0 (永不超时)。
    * `func (t *T) Setenv(key, value string)` 调用 `os.Setenv(key, value)` 并使用 `Cleanup` 将环境变量恢复到测试后的原始值（这不能用于并行测试）。

### 基准测试

假设我们希望测试一个函数的性能，此时可以通过 Go 提供的基准测试来实现（基本原理为：多次循环调用待测函数，计算平均耗时等指标）。

`01-testing/02-benchmark_test.go`

```go
package testingdemo

import (
	"bytes"
	"html/template"
	"math/rand"
	"testing"
)

func BenchmarkRandInt(b *testing.B) {
	for i := 0; i < b.N; i++ {
		rand.Int()
	}
}

func BenchmarkTemplateParallel(b *testing.B) {
	templ := template.Must(template.New("test").Parse("Hello, {{.}}!"))
	b.RunParallel(func(pb *testing.PB) {
		var buf bytes.Buffer
		for pb.Next() {
			buf.Reset()
			templ.Execute(&buf, "World")
		}
	})
}
```

基准测试编写的基本要求为：

* 源码的文件名以 `_test.go` 结尾。
* 函数名以 `Benchmark` 开头。
* 函数签名为 `func (b *testing.B)`。

通过 `go test -run=^$ -benchmem -bench ^BenchmarkRandInt$ ./01-testing` 和 `go test -run=^$ -benchmem -bench ^BenchmarkTemplateParallel$ ./01-testing` 命令，可以运行如上两个基准测试函数。

和常规测试不同，基准测试的日志总是会被打印出来

第一个基准测试，输出如下（忽略设备信息）：

```
BenchmarkRandInt-8      77098495                15.57 ns/op            0 B/op          0 allocs/op
```

输出含义如下：

* BenchmarkRandInt-8 `测试名-GOMAXPROCS`。
* 77098495 表示一共执行了 77098495 次，即 `b.N` 的值。
* 15.57 ns/op 表示平均下来，for 循环每次花费了 15.57 ns。
* 0 B/op 表示平均下来，for 循环每次申请了 0 Byte 内存 （需启用 `-benchmem` 标志）。
* 0 allocs/op 表示平均下来，for 循环每次申请了 0 次内存（需启用 `-benchmem` 标志）。

[`*testing.B` 类型](https://pkg.go.dev/testing@go1.18#B)

* 导出的字段：
    * `N int` 迭代次数。和常规测试不同，基准测试会被调用多次，每次调用，需要迭代的次数记录在 `N` 中，`N` 从 1 开始，如果基准测试函数在 1 秒(默认值)内就完成，则 `N` 增加，并再次运行基准测试函数。
* 方法如下：
    * 上文 [`*testing.T` 类型](https://pkg.go.dev/testing@go1.18#T) `func (c *T) Xxx` 相关方法，如 `FailNow`, `Fatal`, `Fatalf`、`Error` 等。
    * `func (b *B) ReportAllocs()` 为此基准启用 malloc 统计信息。等价于设置 `-benchmem`，只对当前基准函数生效。
    * `func (b *B) ReportMetric(n float64, unit string)` 报告自定义指标，参见：[示例](https://pkg.go.dev/testing@go1.18#example-B.ReportMetric)。
    * `func (b *B) StartTimer()` StartTimer 开始计时测试。此函数在基准测试开始前自动调用，但也可用于在调用 StopTimer 后恢复计时。
    * `func (b *B) StopTimer()` StopTimer 停止计时测试。这可用于在执行您不想测量的复杂初始化时暂停计时器。
    * `func (b *B) ResetTimer()` ResetTimer 将经过的基准测试时间和内存分配计数器归零并删除用户报告的指标。它不影响计时器是否正在运行。
    * `func (b *B) Run(name string, f func(b *B)) bool` 运行一个子基准。注意，`b.Run` 仅在 `b.N` 为 1 时才会被调用真正调用，另外 `Run` 函数自身的耗时不会被统计。
    * `func (b *B) RunParallel(body func(*PB))` 并行运行基准测试。它创建多个 goroutine 并在它们之间分配 b.N 次迭代。 goroutine 的数量默认为 GOMAXPROCS。要增加非 CPU 绑定基准的并行度，请在 RunParallel 之前调用 SetParallelism。 RunParallel 通常与 go test -cpu 标志一起使用。body 函数将在独立的 goroutine 中运行。它应该设置任何 goroutine-local 状态，然后迭代直到 pb.Next 返回 false。它不应使用 StartTimer、StopTimer 或 ResetTimer 函数，因为它们具有全局效果。它也不应该调用 Run。参见：[示例](https://pkg.go.dev/testing@go1.18#example-B.RunParallel)。
    * `func (b *B) SetBytes(n int64)` SetBytes 记录单个操作中处理的字节数。如果调用它，基准将报告 ns/op 和 MB/s。
    * `func (b *B) SetParallelism(p int)` SetParallelism 将 RunParallel 使用的 goroutine 的数量设置为 p*GOMAXPROCS。对于受 CPU 限制的基准测试，通常不需要调用 SetParallelism。如果 p 小于 1，则此调用将无效。

### Example

假设一个包，导出了如下函数 `01-testing/03-example.go`：

```go
package testingdemo

import "fmt"

func Hello() {
	fmt.Println("hello")
}

func Salutations() {
	fmt.Println("hello, and")
	fmt.Println("goodbye")
}

type T struct{}

func (t *T) M() {
	fmt.Println("t.m()")
}
```

希望给这些类型编写一些示例代码，这些示例代码会打印一些内容，并校验这些文本的是否符合预期。

`01-testing/03-example_test.go`

```go
package testingdemo

import "fmt"

func Example() {
	fmt.Println("This is a package example")
	// Output: This is a package example
}

func Example_a01() {
	fmt.Println("This is a package example")
	// Output: This is a package example
}

func ExampleHello() {
	Hello()
	// Output: hello
}

func ExampleHello_a01() {
	Hello()
	// Output: hello
}

func ExampleSalutations() {
	Salutations()
	// Output:
	// hello, and
	// goodbye
}

func ExampleT_M() {
	t := T{}
	t.M()
	// Output: t.m()
}

func ExampleT_M_a01() {
	t := T{}
	t.M()
	// Output: t.m()
}
```

Example 编写的基本要求为：

* 源码的文件名以 `_test.go` 结尾。
* 函数名以 `Example` 开头：
    * 包 Example 为： `Example`。
    * 包多个 Example 为： `Example_suffix`。
    * 函数/类型 Example 为： `ExampleT`、`ExampleF`。
    * 函数/类型多个 Example 为： `ExampleT_suffix`、`ExampleF_suffix`。
    * 方法 Example 为： `ExampleT_M`。
    * 方法多个 Example 为： `ExampleT_M_suffix`。
* 函数签名为 `func ()`。
* 对 Example 的输出进行校验，在函数体的最后添加如下注释：
    * 一般输出

        ```go
        func ExampleHello() {
            fmt.Println("hello")
            // Output: hello
        }

        func ExampleSalutations() {
            fmt.Println("hello, and")
            fmt.Println("goodbye")
            // Output:
            // hello, and
            // goodbye
        }
        ```

    * 无序输出

        ```go
        func ExamplePerm() {
            for _, value := range Perm(5) {
                fmt.Println(value)
            }
            // Unordered output: 4
            // 2
            // 1
            // 3
            // 0
        }
        ```

通过类似于 `go test -run ^Example$ ./01-testing` 的命令可以运行 Exmaple。

注意：Example 函数除了可以用 `go test` 进行测试外，还可以通过 `go doc` 命令生成到 go doc 文档中。

### Fuzzing 测试

> 更多参见：[Go 1.18 新特性 - Fuzzing 单元测试](/posts/go-1-18-features#fuzzing-单元测试)。

假设有一个待测函数：字符串翻转，位于 `01-testing/04-fuzzing.go`。

```go
package testingdemo

import (
	"errors"
	"unicode/utf8"
)

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

通过 Go 1.18 提供的 Fuzzing 测试，可以进行随机输入测试，位于 `01-testing/04-fuzzing_test.go`。

```go
package testingdemo

import (
	"testing"
	"unicode/utf8"
)

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

Fuzz 测试编写的基本要求为：

* 源码的文件名以 `_test.go` 结尾。
* 函数名以 `Fuzz` 开头。
* 函数签名为 `func (f *testing.F)`。

通过 `go test -fuzz=^FuzzReverse$ -fuzztime 2s -run ^$ ./01-testing`  可以运行该测试，失败的 case 将写入 `testdata/fuzz` 目录中。

[`*testing.F` 类型](https://pkg.go.dev/testing@go1.18#F) 导出的方法：

* 上文 [`*testing.T` 类型](https://pkg.go.dev/testing@go1.18#T) `func (c *T) Xxx` 相关方法，如 `FailNow`, `Fatal`, `Fatalf`、`Error` 等。
* `func (f *F) Add(args ...any)` 将参数添加到种子语料库以进行模糊测试。如果在 fuzz 目标之后或内部调用，这将是一个空操作，并且 args 必须与 fuzz 目标的参数匹配。Go 还会自动的读取  `testdata/fuzz` 目录中的种子语料库。
* `func (f *F) Fuzz(ff any)` Fuzz 运行 fuzz 函数 ff 进行模糊测试。如果 ff 对于一组参数失败，这些参数将被添加到种子语料库中。
    * ff 必须是一个没有返回值的函数，其第一个参数是 `*T`。其余参数是要模糊测试的类型，例如：`f.Fuzz(func(t*testing.T, b []byte, i int) { ... })`。允许使用以下类型：`[]byte`、`string`、`bool`、`byte`、`rune`、`float32`、`float64`、`int`、`int8`、`int16`、`int32`、`int64`、`uint`、`uint8`、`uint16`、`uint32`、`uint64`。未来可能会支持更多类型。
    * ff 不得调用任何 `*F` 方法，例如 `(*F).Log`, `(*F).Error`, `(*F).Skip`。请改用相应的 `*T` 方法。 `(*F).Fuzz` 函数中唯一允许的 `*F` 方法是 `(*F).Failed` 和 `(*F).Name`。
    * ff 函数应该是快速和确定的，并且它的行为不应该依赖于共享状态。在模糊函数的执行之间不应保留可变的输入参数或指向它们的指针，因为支持它们的内存可能会在后续调用期间发生变化。 ff 不得修改模糊引擎提供的参数的基础数据。
    * 进行模糊测试时，F.Fuzz 直到发现问题、时间用完（使用 -fuzztime 设置）或测试过程被信号中断才返回。 F.Fuzz 应该只调用一次，除非事先调用了 F.Skip 或 F.Fail。

### Skipping 方法

通过调用 `*T` 或 `*B` 的 `Skip` 方法，可以在运行时跳过测试或基准测试：

```go
func TestTimeConsuming(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping test in short mode.")
    }
    ...
}
```

如果输入无效，`*T` 的 Skip 方法可用于模糊目标，但不应将其视为失败输入。例如：

```go
func FuzzJSONMarshalling(f *testing.F) {
    f.Fuzz(func(t *testing.T, b []byte) {
        var v interface{}
        if err := json.Unmarshal(b, &v); err != nil {
            t.Skip()
        }
        if _, err := json.Marshal(v); err != nil {
            t.Error("Marshal: %v", err)
        }
    })
}
```

### 子测试和子基准

可以通过 `Run` 函数，为常规测试和基准测试，添加一个子测试和子基准测试，示例参见 `01-testing/06-subtest_test.go` 文件。

```go
package testingdemo

import (
	"fmt"
	"testing"
	"time"
)

func TestFoo(t *testing.T) {
	// <setup code>
	t.Run("A=1", func(t *testing.T) {})
	t.Run("A=2", func(t *testing.T) {})
	t.Run("B=1", func(t *testing.T) {})
	// <tear-down code>
}

func TestGroupedParallel(t *testing.T) {
	tests := []struct {
		Name string
	}{
		{
			Name: "A=3",
		},
	}
	for _, tc := range tests {
		tc := tc // capture range variable
		t.Run(tc.Name, func(t *testing.T) {
			t.Parallel()
		})
	}
}

func TestTeardownParallel(t *testing.T) {
	// This Run will not return until the parallel tests finish.
	t.Run("group", func(t *testing.T) {
		t.Run("Test1", func(t *testing.T) {
			t.Parallel()
			time.Sleep(1)
			fmt.Println("Test1")
		})
		t.Run("Test2", func(t *testing.T) {
			t.Parallel()
			time.Sleep(1)
			fmt.Println("Test2")
		})
		t.Run("Test3", func(t *testing.T) {
			t.Parallel()
			time.Sleep(1)
			fmt.Println("Test3")
		})
	})
	// <tear-down code>
}
```

运行指定测试命令如下：

* `go test -run '' ./01-testing`       运行该包的所有测试。
* `go test -run Foo ./01-testing`      运行该包匹配 Foo 的顶级测试如 "TestFoo"。
* `go test -run Foo/A= ./01-testing`   运行该包匹配 Foo 的顶级测试，以及匹配 "A=" 的子测试。
* `go test -run /A=1 ./01-testing`     运行该包所有顶级测试，以及匹配 "A=1" 的子测试。
* `go test -fuzz FuzzFoo ./01-testing` Fuzz 匹配 "FuzzFoo" 的目标。
* `go test -run=FuzzFoo/9ddb952d9814`  -run 参数还可用于运行种子语料库中的特定值，以进行调试。

### TestMain

测试或基准程序有时需要在执行之前或之后进行额外的设置或拆卸。有时还需要控制哪些代码在主线程上运行。为了支持这些和其他情况，如果测试文件包含一个 `TestMain` 函数，`01-testing/07-testmain_test.go`：

```go
package testingdemo

import (
	"fmt"
	"os"
	"testing"
)

func TestMain(m *testing.M) {
	fmt.Println("+++ TestMain +++")
	os.Exit(m.Run())
}
```

TestMain 编写的基本要求为：

* 源码的文件名以 `_test.go` 结尾。
* 函数名固定为 `TestMain`。
* 函数签名为 `func (m *testing.M)`。
* 在 `m.Run()` 调用之前进行一些准备工作。
* 在 `m.Run()` 调用之后做一些回收工作。
* 最后调用 `os.Exit`，其参数为 `m.Run()` 的返回值。

TestMain 是一个低级原语，对于常规测试功能就足够了的临时测试需求，不应该是必需的。

### 其他说明

* `_test.go` 中定义的类型和函数，只能被同一个包中的文件引用，不允许跨包导入，参见：[issue](https://github.com/golang/go/issues/39565)。
* `_test.go` 文件的包名有两种选择
    * 测试源代码的包名和源代码文件的包名相同，如上文示例中的 `package testingdemo`，此时可以直接对**未导出**函数、方法进行测试。
    * 测试源代码的包名为源代码文件的包名加 `_test` 后缀，如上文示例中的 `testingdemo`，测试包可以为 `testingdemo_test`，此时，只能测试包和源代码属于不同的包，因此只能对**导出**函数、方法进行测试。该场景适合：
        * 不需要测试**未导出**函数、方法的场景
        * 可能导致循环引用的场景
* go test 运行时，测试函数和进程、协程的关系为（测试代码参见下文）：
    * 同一个包的所有测试函数，都在同一个进程中执行，不同包的测试函数在不同的进程中执行。
    * `TestMain` 在 1 号协程中执行，对于测试函数
        * 如果测试函数全都不是 `Parallel` 的，则串行的在 2 号协程中执行。
        * 如果是 `Parallel` 的，则测试函数会并根据 `Parallel` 的情况再不同的协程并行执行。

`01-testing/a/a_test.go`

```go
package a

import (
	"fmt"
	"os"
	"runtime"
	"testing"
)

func TestA1(t *testing.T) {
	fmt.Println("+++", "A1 Goroutine Num", runtime.NumGoroutine(), "A1 Pid", os.Getpid())
	fmt.Println()
}

func TestA2(t *testing.T) {
	fmt.Println("+++", "A2 Goroutine Num", runtime.NumGoroutine(), "A2 Pid", os.Getpid())
	fmt.Println()
}

func TestMain(m *testing.M) {
	fmt.Println("+++", "A TestMain Goroutine Num", runtime.NumGoroutine(), "A TestMain Pid", os.Getpid())
	os.Exit(m.Run())
}
```

`01-testing/b/b_test.go`

```go
package b

import (
	"fmt"
	"os"
	"runtime"
	"testing"
)

func TestB1(t *testing.T) {
	t.Parallel()
	fmt.Println("+++", "B1 Goroutine Num", runtime.NumGoroutine(), "B1 Pid", os.Getpid())
	fmt.Println()
}

func TestB2(t *testing.T) {
	t.Parallel()
	fmt.Println("+++", "B2 Goroutine Num", runtime.NumGoroutine(), "B2 Pid", os.Getpid())
	fmt.Println()
}

func TestMain(m *testing.M) {
	fmt.Println("+++", "B TestMain Goroutine Num", runtime.NumGoroutine(), "B TestMain Pid", os.Getpid())
	os.Exit(m.Run())
}
```

运行 `go test -run '' ./01-testing/a ./01-testing/b -v`，输出如下：

```
+++ A TestMain Goroutine Num 1 A TestMain Pid 98270
=== RUN   TestA1
+++ A1 Goroutine Num 2 A1 Pid 98270

--- PASS: TestA1 (0.00s)
=== RUN   TestA2
+++ A2 Goroutine Num 2 A2 Pid 98270

--- PASS: TestA2 (0.00s)
PASS
ok      github.com/rectcircle/go-test-demo/01-testing/a 1.174s
+++ B TestMain Goroutine Num 1 B TestMain Pid 98271
=== RUN   TestB1
=== PAUSE TestB1
=== RUN   TestB2
=== PAUSE TestB2
=== CONT  TestB1
+++ B1 Goroutine Num 3 B1 Pid 98271

--- PASS: TestB1 (0.00s)
=== CONT  TestB2
+++ B2 Goroutine Num 2 B2 Pid 98271

--- PASS: TestB2 (0.00s)
PASS
ok      github.com/rectcircle/go-test-demo/01-testing/b 1.698s
```

### `go test` 命令

`go test` 有如下两种模式：

* `cd packagexxx && go test` 本地目录模式，即直接运行当前目录下的包，即 `packagexxx` 目录下的包的测试。
* `go test ./packagexxx` 包列表模式，运行指定包下的测试，`./packagexxx` 可以指定多个（如 `./a /.b`），也可以可以使用 `./xxx/...`、`./...`，测试该目录下的所有包，在该模式下，`go test` 会使用缓存，可以通过 `go clean -testcache` 清理缓存，或者通过手动指定 `-count 1` 来禁用缓存。

`go test` 常见标志如下所示：

* 选择测试目标的标志
    * `-run regexp` 只运行与正则表达式匹配的常规测试、Example、Fuzz 的种子语料库。默认值为 `''`，即运行所有测试。regexp 会按照不带括号的 `/` 分割为多个正则表达式，并且测试标识符的每个部分都必须匹配序列中的相应元素。注意，对于 `-run=X/Y` 这种情况，如果 `X` 存在 `X/Y` 不存在，则 `X` 仍会被执行，因为必须运行 `X`，才能查找到到 `X/Y` 是否存在。
    * `-bench regexp` 仅运行与正则表达式匹配的基准。默认情况下，不运行任何基准测试。要运行所有基准测试，请使用 `'-bench .'` 或 `'-bench=.'`。 正则表达式由不带括号的斜杠 (/) 字符拆分为一系列正则表达式，并且基准标识符的每个部分都必须匹配序列中的相应元素（如果有）。 匹配的可能父项以 `b.N=1` 运行以识别子基准。 例如，给定 `-bench=X/Y`，匹配 `X` 的顶级基准以 `b.N=1` 运行，以找到匹配 Y 的任何子基准，然后完整运行。
    * `-fuzz regexp` 模糊测试的方式，运行 Fuzz 测试，默认情况下不进行模糊测试。指定时，命令行参数必须与主模块中的一个包完全匹配，而正则表达式必须与该包中的一个模糊测试完全匹配 ，模糊测试将在常规测试、基准测试、其他模糊测试的种子语料库和 Example 完成后进行。
    * `-list regexp` 列出所有符合正则表达式的顶层测试，不会运行任何测试。
* 通用参数
    * `-v` 输出测试细节，包括测试手动打的日志等
    * `-timeout d` 超时时间，默认为 10 分钟 (10m)。
    * `-short` 告诉长时间运行的测试以缩短它们的运行时间。它默认关闭，但在 all.bash 期间设置，以便安装 Go 树可以运行健全性检查，但不能花时间运行详尽的测试 (这一句不理解，这个 [all.bash](https://go.dev/src/all.bash)？) 。
    * `-vet list` 在测试前调用 `go vet`
    * `-failfast` 在第一次测试失败后不要开始新的测试，立即失败。
    * `-json` 以 JSON 格式记录详细输出和测试结果。这提出了与机器可读格式的 -v 标志相同的信息。
    * `-parallel n` 指 `t.Parallel` 调用后允许产生的做到并行运行的测试数目。 在进行模糊测试时，该标志的值是可以同时调用模糊函数的最大子进程数，而不管是否调用了 `t.Parallel`。 默认情况下，-parallel 设置为 GOMAXPROCS 的值。 将 -parallel 设置为高于 GOMAXPROCS 的值可能会由于 CPU 争用而导致性能下降，尤其是在模糊测试时。 请注意，-parallel 仅适用于单个测试二进制文件（包）。 根据 -p 标志的设置，`go test` 命令也可以并行运行不同包的测试（参见 `go help build`）。
    * `-shuffle off,on,N` 随机测试执行顺序，默认为 off，`N` 为指定一个随机数种子。
* 对 `-run`、`-bench` 匹配的测试的配置
    * `-count n`，对 `-fuzz` 不生效。默认为 1 并在包列表模式（测试缓存）。手动指定 1 将禁用测试缓存。该参数仅用来指定测试运行的次数，如果设置了 -cpu，则为每个 GOMAXPROCS 值运行 n 次。
    * `-cpu 1,2,4` 指定运行测试的 GOMAXPROCS 列表，默认值为当前 GOMAXPROCS 值，每个测试函数会针对每一个 cpu 值运行一次。
* 对 `-bench`  匹配的测试的配置
    * `-benchtime t` 对每个基准运行足够的迭代以获取指定的 t 作为 time.Duration（例如，`-benchtime 1h30s`）。默认值为 1 秒 (`1s`)。特殊语法 Nx 表示运行准 N 次（例如，`-benchtime 100x`）。
    * `-benchmem` 打印基准测试的内存分配统计信息。
* 对 `-fuzz` 匹配的测试的配置
    * `-fuzztime t` 和 `-benchtime t` 类似。
    * `-fuzzminimizetime t` 和 `-fuzztime t` 类似，表示最小值。
* 覆盖率相关
    * `-cover` 启用覆盖率统计
    * `-covermode set,count,atomic`  设置正在测试的包的覆盖率分析模式。默认值为 `set`，如果启用 `-race`，默认值为 `atomic`。
        * set: bool: 这个语句是否运行。
        * count: int: 这个语句运行了多少次。
        * atomic: int: count，但在多线程测试中是精确的；但是代价更高。
    * `-coverpkg pattern1,pattern2,pattern3` 在每个测试中对匹配模式的包应用覆盖率分析。默认情况下，每个测试只分析正在测试的包。有关包模式的描述，请参阅 `go help packages`。
    * `-coverprofile cover.out` 在所有测试通过后，将覆盖率配置文件写入的文件。
* 性能监控相关（参见：[原文](https://pkg.go.dev/cmd/go#hdr-Testing_flags)）
    * `-blockprofile block.out`
    * `-blockprofilerate n`
    * `-cpuprofile cpu.out`
    * `-memprofile mem.out`
    * `-memprofilerate n`
    * `-mutexprofile mutex.out`
    * `-mutexprofilefraction n`
    * `-outputdir directory`
    * `-trace trace.out`
* 编译构建相关标志
    * `go help build` 相关标志
    * `-args` 将命令行的其余部分（-args 之后的所有内容）传递给测试二进制文件，未经解释且未更改。 因为这个标志占用了命令行的剩余部分，所以包列表（如果存在）必须出现在这个标志之前。
    * `-c` 将测试二进制文件编译为 `pkg.test` 但不要运行它（其中 pkg 是包导入路径的最后一个元素）。 可以使用 -o 标志更改文件名。（一个例子 `go test ./01-testing -c`）
    * `-o file` 将测试二进制文件编译到指定文件。测试仍然运行（除非指定了 -c 或 -i）。
    * `-exec xprog` 使用 xprog 运行测试二进制文件，详见：`go help run`。
    * `-i` 略，已废弃。

## Go 官方维护的 Mock 库

> 版本：[v1.6.0](https://pkg.go.dev/github.com/mock/mockgen@v1.6.0)

### 示例场景

假设我们在开发一个博客后端的 article 模块，包含如下两层：

* service 业务逻，会调用 repository 层的函数，及 repository 是 service 的依赖。
* repository 数据操纵层，对数据库等外部数据存储的操作的封装。

模型和接口声明： `02-mock/domain/`

```go
// article.go
package domain

type Article struct {
	ID      int64
	Author  string
	Title   string
	Tags    []string
	Content string
}

type ArticleRepository interface {
	FindByID(id int64) (*Article, error)
	Create(*Article) (int64, error)
}

type ArticleService interface {
	Publish(author string, title string, tags []string, content string) (*Article, error)
	Get(id int64) (*Article, error)
}

// error.go
package domain

import "errors"

var (
	ErrRecordNotFound   = errors.New("record not found")
)
```

service 的实现：`02-mock/article/service.go`

```go
package article

import "github.com/rectcircle/go-test-demo/02-mock/domain"

type service struct {
	repository domain.ArticleRepository
}

func NewService(r domain.ArticleRepository) (domain.ArticleService, error) {
	return &service{
		repository: r,
	}, nil
}

func (s *service) Get(id int64) (*domain.Article, error) {
	return s.repository.FindByID(id)
}

func (s *service) Publish(author string, title string, tags []string, content string) (*domain.Article, error) {
	id, err := s.repository.Create(&domain.Article{
		ID:      0,
		Author:  author,
		Title:   title,
		Tags:    tags,
		Content: content,
	})
	if err != nil {
		return nil, err
	}
	return s.Get(id)
}

```

### 为什么需要 Mock

此时，假设想要编写测试用例，测试 service 层的函数，如果使用 repository 的实现的话，我们为每次测试，需要准备一个测试数据库，并编写 sql 将准备数据。这样做有如下问题：

* 数据库等外部依赖安装复杂，成本高，数据准备麻烦。
* 假设 service 调用外部函数，没有测试环境，或者无法做到无状态，此时 service 的测试就无法进行。
* 对 service 的测试必须依赖 repository 就绪才能进行，而 repository 的开发可能由其他人员负责，存在依赖关系。

针对这种情况，我们就需要 Mock（模拟） 待测函数的依赖。

### Mock 的前提条件

首先对待测函数的测试不能修改待测函数。这就要求，需要 Mock 的待测函数必须是可插拔的。

在上面的例子中，在 Go 语言中，这就要求 repository 必须是一个接口而不能是一个具体的类型。此时我们就可以写一个 repository 的 Mock 实现，在测试时准备阶段，使用 Mock 对象构造 service，然后就可以编写测试 case 了。

### Mock 库的核心能力

当然，可以手动编写一个 repository 接口的 Mock 实现，但是会存在如下问题：针对每一个 service 的 case，都需要定义一个 Mock 实现，在测时覆盖率足够高的情况下，Mock 的数量会非常多，这会产生大量的样板代码。

因此，为了消除样板代码，可以抽象出一个 Mock 工具库，该工具有如下能力：

* 根据接口生成且仅生成一个 Mock 实现的代码。
* 可以通过编程的方式，定制这个接口 Mock 实现的每个函数在什么样的参数下返回什么样的结果（打桩）。
* 可以通过编程的方式，断言这个接口 Mock 实现的每个函数在会调用多少次，是否会被调用。从被测函数的依赖函数的角度，测试被测函数的行为是否符合预期（打桩）。

[golang/mock](https://github.com/golang/mock) 就实现了如上能力。

### 使用 [golang/mock](https://github.com/golang/mock) 示例

#### 安装代码生成器

```
go install github.com/golang/mock/mockgen@v1.6.0
```

#### 生成 Mock 代码

通过 `go:generate` 注释，快速生成代码。

在 `02-mock/domain/article.go` 添加如下注释：

```
//go:generate mockgen -destination=./mock/mock_article_repository.go -package=mock github.com/rectcircle/go-test-demo/02-mock/domain ArticleRepository
```

执行 `mkdir -p 02-mock/domain/mock &&  go generate ./...` 生成代码。

代码将生成到 `02-mock/domain/mock/mock_article_repository.go` 文件中。

#### 编写测试 Case

`02-mock/article/service_test.go`

```go
package article

import (
	"reflect"
	"testing"

	"github.com/golang/mock/gomock"
	"github.com/rectcircle/go-test-demo/02-mock/domain"
	"github.com/rectcircle/go-test-demo/02-mock/domain/mock"
)

func Test_service_Get(t *testing.T) {
	want := domain.Article{
		ID:      1,
		Author:  "author",
		Title:   "title",
		Tags:    []string{"go"},
		Content: "content",
	}

	// 准备 Mock 控制器。
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	// 构造一个 Mock 的 ArticleRepository 接口的实现 m。
	//   该实现的代码由 mockgen 命令生成
	//   该实现的 mock 的函数的返回值通过 m.EXPECT() 方法构造
	m := mock.NewMockArticleRepository(ctrl)
	// 声明，使用 1 调用 m.FindByID 时，返回 want。
	m.EXPECT().FindByID(gomock.Eq(int64(1))).Return(&want, nil)
	// 声明，使用非 1 调用 m.FindByID 时，返回 没有发现错误。
	m.EXPECT().FindByID(gomock.Not(int64(1))).Return(nil, domain.ErrRecordNotFound)

	// 构造待测实例，将 mock 对象 m 传递给该实例
	s, _ := NewService(m)
	// 执行测试
	t.Run("success", func(t *testing.T) {
		got, err := s.Get(1)
		if err != nil {
			t.Fatalf("s.Get(1) err want nil, got %s", err)
		}
		if reflect.DeepEqual(got, want) {
			t.Fatalf("s.Get(1) want %+v, got %+v", want, got)
		}
	})
	t.Run("notFound", func(t *testing.T) {
		_, err := s.Get(2)
		if err == nil {
			t.Fatalf("s.Get(2) err want %s, got nil", domain.ErrRecordNotFound)
		}
	})
}

func Test_service_Publish(t *testing.T) {
	want := domain.Article{
		ID:      1,
		Author:  "author",
		Title:   "title",
		Tags:    []string{"go"},
		Content: "content",
	}

	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	m := mock.NewMockArticleRepository(ctrl)
	data := map[int64]domain.Article{}
	id := int64(1)
	m.EXPECT().FindByID(gomock.Any()).DoAndReturn(func(id int64) (*domain.Article, error) {
		if a, ok := data[id]; ok {
			return &a, nil
		} else {
			return nil, domain.ErrRecordNotFound
		}
	})
	m.EXPECT().Create(gomock.Any()).DoAndReturn(func(a *domain.Article) (int64, error) {
		a.ID = id
		id += 1
		data[a.ID] = *a
		return a.ID, nil
	})

	s, _ := NewService(m)
	t.Run("success", func(t *testing.T) {
		got, err := s.Publish(want.Author, want.Title, want.Tags, want.Content)
		if err != nil {
			t.Fatalf("s.Publish(1) err want nil, got %s", err)
		}
		want.ID = got.ID
		if reflect.DeepEqual(got, want) {
			t.Fatalf("s.Publish(1) want %+v, got %+v", want, got)
		}
	})
}
```

* `ctrl := gomock.NewController(t)` 用来实现：从被测函数的依赖函数的角度，测试被测函数的行为是否符合预期，也就是说如果 `m` 中的方法被调用次数和被调用的参数不符合 `m.EXPECT()` 的声明，`ctrl` 将调用 `t` 的相关方法，标记本测试失败。
* `m.EXPECT()` 返回一个配置对象，可以配置：某个方法期望调用的参数列表、返回值、调用次数等（打桩）。
* 以上准备完成后，编写 Case 即可。

### [golang/mock](https://github.com/golang/mock) 命令行说明

```
mockgen 有两种操作模式: source 和 reflect。

当使用 -source 标识时，启用 source 模式，该模式通过源代码文件来生成接口的 mock 实现。
-imports 和 -aux_files 可以在 Source 模式下使用。
示例：
        mockgen -source=foo.go [other options]


当传递两个非标示的参数时，启用 reflect 模式，该模式通过反射理解接口来生成接口的 mock 实现。
这两个参数分别是：导入路径和通过逗号分隔符号列表。
示例：
        mockgen database/sql/driver Conn,Driver

  -aux_files string
        (source 模式) 逗号分隔的 pkg=path 表示 auxiliary Go 源代码文件（每太理解，可以看：https://github.com/golang/mock/issues/181）。
  -build_flags string
        (reflect 模式) 额外的 go build 参数。
  -copyright_file string
        Copyright 文件将添加到生成的文件头。
  -debug_parser
        只打印解析器结果。
  -destination string
        输出到的文件；默认输出到 stdout。
  -exec_only string
        (reflect 模式) 如果设置，执行这个反射程序源码文件（参见：-prog_only）。
  -imports string
        (source 模式) 逗号分隔的 name=path 表示要使用的显式导入（不理解）。
  -mock_names string
        逗号分隔的 interfaceName=mockName 表示生成的结构体名。默认为 'Mock'+ 接口名。
  -package string
        生成代码的包名；默认为 'mock_' + 当前包名。
  -prog_only
        (reflect 模式) 只生成反射程序源码；把它写入 stdout 并退出。
  -self_package string
        The full package import path for the generated code. The purpose of this flag is to prevent import cycles in the generated code by trying to include its own package. This can happen if the mock's package is set to one of its inputs (usually the main one) and the output is stdio so mockgen cannot detect the final output package. Setting this flag will then tell mockgen which import to exclude.（不理解）
  -source string
        (source 模式) 输入的 Go 源代码文件；启用 source 模式。
  -version
        打印版本。
  -write_package_comment
        如果为 true，则写入包文档注释 (godoc)。 （默认为 true）。
```

* source 模式：利用 Go 标准库的 `"go/parser"`。
* 反射模式：先生成一个 main 函数源码，然后编译运行这个函数。这个函数会通过反射获取到接口的信息，并生成代码。

这里推荐优先使用 source 模式，如果有问题，可以回退到反射模式：

* source 模式性能高，生成速度快。
* source 模式生成的代码可以保留参数名信息，有利于编写桩代码。
* source 模式的缺点：
    * 从 [issue](https://github.com/golang/mock/issues) 来看，有挺多问题的。
    * 无法指定生成某个接口，-source 中如果包含多个接口，都会被生成。

### [golang/mock](https://github.com/golang/mock) API

* `MockXxx.EXPECT()` 返回 MockXxxRecorder 类型指针。
* `MockXxxRecorder.方法名(...)`
    * 参数为 nil、精确值 或者 [`gomock.Matcher`](https://pkg.go.dev/github.com/golang/mock@v1.6.0/gomock#Matcher)  参数匹配与断言，如果被测函数调用时，没有匹配到，将失败。
        * `All` 匹配所有条件
        * `AssignableToTypeOf` 匹配类型
        * `Eq` 精确值
        * `InAnyOrder` 任意顺序的集合
        * `Len` 数组长度
        * `Nil` 为 nil
        * `Not` 不为某个值
        * 修改失败 Got 和 Want 是的输出格式，参见： [README](https://github.com/golang/mock#modifying-failure-messages)
    * 返回值为 [`*gomock.Call`](https://pkg.go.dev/github.com/golang/mock@v1.6.0/gomock#Call) 声明函数被调用时的一些行为或者断言。
        * `After` 期望调用顺序。
        * `AnyTimes`、`Times`、`MaxTimes`、`MinTimes` 期望调用的次数的值、最大值、最小值、等。
        * `Return` 定义返回值。
        * `Do`、`DoAndReturn` 被调用时，执行函数并返回。
        * `SetArg` 修改函数调用的参数，应该发生在之后。
        * 通过源码可知，如果 `Return`、`DoAndReturn` 被调用了多次，则函数的返回值以最后一个的返回值为准。

## Go 社区主流的测试库 Testify

> 版本：[v1.8.0](https://pkg.go.dev/github.com/stretchr/testify@v1.8.0)

Testify 是 Go 社区主流的测试工具集。包含如下特性：

* 易用的断言
* Mock
* 测试套件接口和函数

### assert 包

提供了移动的断言函数，示例 `03-testify/assert_test.go` 如下：

```go
package testifydemo_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSomething(t *testing.T) {
	// 相等断言
	assert.Equal(t, 123, 123, "they should be equal")

	// 不等断言
	assert.NotEqual(t, 123, 456, "they should not be equal")

	// nil 断言
	assert.Nil(t, nil)

	// 非 nil 断言
	got2 := "Something"
	if assert.NotNil(t, got2) {
		// 现在 got2 不是 nil
		// 可以安全地进行进一步的断言而不会导致任何错误
		assert.Equal(t, "Something", got2)
	}
}
```

stretchr/testify 的 [assert 包](https://pkg.go.dev/github.com/stretchr/testify@v1.8.0/assert)，提供了一系列函数，封装了常见的断言逻辑，当断言失败时，这些函数会友好的打印出失败的原因，代码行数等辅助信息。如 `assert.Equal(t, 123, 124, "they should be equal")` 输出如下：

```
=== RUN   TestSomething
    /Users/xxx/Workspace/personal/go-test-demo/03-testify/assert_test.go:11:
        	Error Trace:	/Users/xxx/Workspace/personal/go-test-demo/03-testify/assert_test.go:11
        	Error:      	Not equal:
        	            	expected: 123
        	            	actual  : 124
        	Test:       	TestSomething
        	Messages:   	they should be equal
```

导出的断言函数如下：

| 函数 | 说明 |
|------|-----|
| `func ObjectsAreEqual(expected, actual interface{}) bool ` | 不要使用，这不是一个断言函数，参见：[issue](https://github.com/stretchr/testify/issues/1180) |
| `func ObjectsAreEqualValues(expected, actual interface{}) bool` | 不要使用，这不是一个断言函数，参见：[issue](https://github.com/stretchr/testify/issues/1180) |
| `func FailNow(t TestingT, failureMessage string, msgAndArgs ...interface{}) bool` | 友好的打印失败信息，标记失败并退出当前协程，一般不需要直接使用 |
| `func Fail(t TestingT, failureMessage string, msgAndArgs ...interface{}) bool` | 友好的打印失败信息，标记失败，一般不需要直接使用 |
| `func Implements(t TestingT, interfaceObject interface{}, object interface{}, msgAndArgs ...interface{}) bool` | 断言 `object` 是否实现了 `interfaceObject` 接口，如 `assert.Implements(t, (*MyInterface)(nil), new(MyObject))` |
| `func IsType(t TestingT, expectedType interface{}, object interface{}, msgAndArgs ...interface{}) bool ` | 断言 `object` 的类型和 `expectedType` 的类型是否相同 |
| `func Equal(t TestingT, expected, actual interface{}, msgAndArgs ...interface{}) bool` | 断言值是否相同，指针变量相等性是根据引用值的相等性确定的，函数类型总是失败，如 `assert.Equal(t, 123, 123)` |
| `func NotEqual(t TestingT, expected, actual interface{}, msgAndArgs ...interface{}) bool` | 参见：`Equal` |
| `func Same(t TestingT, expected, actual interface{}, msgAndArgs ...interface{}) bool` | 断言两个指针的类型相同，且指针地址相同 |
| `func NotSame(t TestingT, expected, actual interface{}, msgAndArgs ...interface{}) bool` | 参见：`Same` |
| `func EqualValues(t TestingT, expected, actual interface{}, msgAndArgs ...interface{}) bool ` | 断言相等，或可转换为相同类型且相等，如 `assert.EqualValues(t, uint32(123), int32(123))` 返回 true |
| `func NotEqualValues(t TestingT, expected, actual interface{}, msgAndArgs ...interface{}) bool` | 参见：`EqualValues` |
| `func Exactly(t TestingT, expected, actual interface{}, msgAndArgs ...interface{}) bool` | 断言值和类型都相同（精确相等），如 `assert.Exactly(t, int32(123), int64(123))` 返回 false |
| `func Nil(t TestingT, object interface{}, msgAndArgs ...interface{}) bool` | 断言对象是否为 nil |
| `func NotNil(t TestingT, object interface{}, msgAndArgs ...interface{}) bool` | 参见：`Nil` |
| `func Empty(t TestingT, object interface{}, msgAndArgs ...interface{}) bool` | 断言是 emtpy，例如 nil, "", false, 0 或者 len == 0 的切片或 chan 都是 empty |
| `func NotEmpty(t TestingT, object interface{}, msgAndArgs ...interface{}) bool` | 参见：`Empty` |
| `func Len(t TestingT, object interface{}, length int, msgAndArgs ...interface{}) bool` | 断言指定的对象具有特定的长度。 如果对象是无法 `len()` 的会失败，如 `assert.Len(t, mySlice, 3)` |
| `func True(t TestingT, value bool, msgAndArgs ...interface{}) bool` | 断言对象是否为 true |
| `func False(t TestingT, value bool, msgAndArgs ...interface{}) bool` | 断言对象是否为 false |
| `func Contains(t TestingT, s, contains interface{}, msgAndArgs ...interface{}) bool` | a) 断言字符串是否包含一个子串，如 `assert.Contains(t, "Hello World", "World")`；b) list(array, slice...) 是否包含一个元素，如 `assert.Contains(t, ["Hello", "World"], "World")`，c) map 是否包含一个元素 `assert.Contains(t, {"Hello": "World"}, "Hello")` |
| `func NotContains(t TestingT, s, contains interface{}, msgAndArgs ...interface{}) bool` | 参见：`Contains` |
| `func Subset(t TestingT, list, subset interface{}, msgAndArgs ...interface{}) (ok bool)` | 断言 subset 是否是 list(array, slice...) 的子集 |
| `func NotSubset(t TestingT, list, subset interface{}, msgAndArgs ...interface{}) (ok bool)` | 参见：`Subset` |
| `func ElementsMatch(t TestingT, listA, listB interface{}, msgAndArgs ...interface{}) (ok bool)` | 断言两个 list (array, slice...) 的元素是否完全相同（忽略顺序）， 如 `assert.ElementsMatch(t, [1, 3, 2, 3], [1, 3, 3, 2])` 为 true |
| `func Panics(t TestingT, f PanicTestFunc, msgAndArgs ...interface{}) bool` | 断言 f 函数是否 panic（原理是 f 通过 `recover()` 接收） |
| `func NotPanics(t TestingT, f PanicTestFunc, msgAndArgs ...interface{}) bool ` | 参见：`Panics` |
| `func PanicsWithValue(t TestingT, expected interface{}, f PanicTestFunc, msgAndArgs ...interface{}) bool` | 断言 f 函数是否发生 panic 且 painc 接收的值和 excepted 相同 (`==`)，如：`assert.PanicsWithValue(t, "crazy error", func(){ GoCrazy() })` |
| `func PanicsWithError(t TestingT, errString string, f PanicTestFunc, msgAndArgs ...interface{}) bool` | 断言 f 函数是否发生 panic 且 panic 接收的值为 error 且 `error.Error()` 的值和 errString 想通，如：`assert.PanicsWithError(t, "crazy error", func(){ GoCrazy() })` |
| `func WithinDuration(t TestingT, expected, actual time.Time, delta time.Duration, msgAndArgs ...interface{}) bool` |断言这两个时间相差时间是否在 delta 内，如 `assert.WithinDuration(t, time.Now(), time.Now(), 10*time.Second)` |
| `func WithinRange(t TestingT, actual, start, end time.Time, msgAndArgs ...interface{}) bool` | 断言 actual 是否在 start 和 end 之间（包括）， 如 `assert.WithinRange(t, time.Now(), time.Now().Add(-time.Second), time.Now().Add(time.Second))` |
| `func InDelta(t TestingT, expected, actual interface{}, delta float64, msgAndArgs ...interface{}) bool` | 断言这两个数字的差值的 delta 范围内，如 `assert.InDelta(t, math.Pi, 22/7.0, 0.01)` |
| `func InDeltaSlice(t TestingT, expected, actual interface{}, delta float64, msgAndArgs ...interface{}) bool` | 和 `InDelta` 类似，断言 expected, actual 切片的对应的两个数字元素的的差值在 delta 内  |
| `func InDeltaMapValues(t TestingT, expected, actual interface{}, delta float64, msgAndArgs ...interface{}) bool` | 和 `InDelta` 类似，断言 expected, actual Map 的对应的两个数字元素的的差值在 delta 内 |
| `func InEpsilon(t TestingT, expected, actual interface{}, epsilon float64, msgAndArgs ...interface{}) bool` | 断言 `(abs(expected - actual) / abc(expected)) <= epsilon` |
| `func InEpsilonSlice(t TestingT, expected, actual interface{}, epsilon float64, msgAndArgs ...interface{}) bool` | 和 `InEpsilon` 类似，断言 expected, actual 切片的对应的两个数字元素满足 `InEpsilon` |
| `func InEpsilonSlice(t TestingT, expected, actual interface{}, epsilon float64, msgAndArgs ...interface{}) bool` | 和 `InEpsilon` 类似，断言 expected, actual 切片的对应的两个数字元素满足 `InEpsilon` |
| `func Error(t TestingT, err error, msgAndArgs ...interface{}) bool` | 断言 err 是否不为 nil |
| `func NoError(t TestingT, err error, msgAndArgs ...interface{}) bool` | 参见：`NoError` |
| `func EqualError(t TestingT, theError error, errString string, msgAndArgs ...interface{}) bool` | 断言 `theError.Error()` 和 errorString 是否相等 |
| `func ErrorContains(t TestingT, theError error, contains string, msgAndArgs ...interface{}) bool` | 断言 `theError.Error()` 是否包含 `contains` 是否相等 |
| `func Regexp(t TestingT, rx interface{}, str interface{}, msgAndArgs ...interface{}) bool` | 断言字符串是否和正则表达式匹配，如 `assert.Regexp(t, regexp.MustCompile("start"), "it's starting")`、`assert.Regexp(t, "start...$", "it's not starting")` |
| `func NotRegexp(t TestingT, rx interface{}, str interface{}, msgAndArgs ...interface{}) bool` | 参见： `Regexp` |
| `func Zero(t TestingT, i interface{}, msgAndArgs ...interface{}) bool` | 断言 i 是否是零值 |
| `func NotZero(t TestingT, i interface{}, msgAndArgs ...interface{}) bool` | 参见：`Zero` |
| `func FileExists(t TestingT, path string, msgAndArgs ...interface{}) bool` | 断言文件是否存在，如果是目录将失败 |
| `func NoFileExists(t TestingT, path string, msgAndArgs ...interface{}) bool` | 参见： `FileExists` |
| `func DirExists(t TestingT, path string, msgAndArgs ...interface{}) bool` | 断言目录是否存在 |
| `func NoDirExists(t TestingT, path string, msgAndArgs ...interface{}) bool` | 参见： `DirExists` |
| `func JSONEq(t TestingT, expected string, actual string, msgAndArgs ...interface{}) bool` | 断言两个 JSON 字符窜是否相等，如 ```assert.JSONEq(t, `{"hello": "world", "foo": "bar"}`, `{"foo": "bar", "hello": "world"}`)``` |
| `func YAMLEq(t TestingT, expected string, actual string, msgAndArgs ...interface{}) bool` | 断言两个 YAML 字符窜是否相等 |
| `func Eventually(t TestingT, condition func() bool, waitFor time.Duration, tick time.Duration, msgAndArgs ...interface{}) bool` |  该函数每经过 tick 时间，调用一次 `condition` 函数，如果在 `waitFor` 时间内返回 true 则断言成功，如 `assert.Eventually(t, func() bool { return true; }, time.Second, 10*time.Millisecond)` |
| `func Never(t TestingT, condition func() bool, waitFor time.Duration, tick time.Duration, msgAndArgs ...interface{}) bool` | 参见： `Eventually`，即在 `waitFor` 间内 condition 没有返回 true |
| `func ErrorIs(t TestingT, err, target error, msgAndArgs ...interface{}) bool` | 通过 `errors.Is` 进行断言 |
| `func NotErrorIs(t TestingT, err, target error, msgAndArgs ...interface{}) bool` | 参见：`ErrorIs` |
| `func ErrorAs(t TestingT, err error, target interface{}, msgAndArgs ...interface{})` | 通过 `errors.As` 进行断言 |

### require 包

类似于 [assert 包](https://pkg.go.dev/github.com/stretchr/testify@v1.8.0/assert) ，不同点在于 [require](https://pkg.go.dev/github.com/stretchr/testify@v1.8.0/require) 包会在断言失败后立即退出。

### mock 包

能力和上文提到的 [golang/mock](https://github.com/golang/mock) 类似，在此不多介绍了。建议直接使用 golang/mock。

### suite 包

提供了类似面向对象语言的测试套件（如 junit），主流的 IDE （如 VSCode [Go 扩展](https://github.com/golang/vscode-go/blob/master/CHANGELOG.md#0684---29th-june-2018)）对该包提供了原生的支持。

示例 `03-testify/suite_test.go` 如下：

```go
package testifydemo_test

// Basic imports
import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// 定义测试套件结构体，嵌入一个 suite.Suite，该结构体包含一个 T() 方法可以返回原生的 *testing.T
type ExampleTestSuite struct {
	suite.Suite
}

// 运行套件内所有测试函数前，执行且只执行一次该函数。
func (suite *ExampleTestSuite) SetupSuite() {
	fmt.Println("+++SetupSuite+++")
}

// 运行套件内所有测试函数后，执行且只执行一次该函数。
func (suite *ExampleTestSuite) TearDownSuite() {
	fmt.Println("+++TearDownSuite+++")
}

// 运行套件内的每个测试前，都会执行一次该函数。
func (suite *ExampleTestSuite) SetupTest() {
	fmt.Println("+++SetupTest+++")
}

// 运行套件内的每个测试后，都会执行一次该函数。
func (suite *ExampleTestSuite) TearDownTest() {
	fmt.Println("+++TearDownTest+++")
}

// 运行套件内的每个测试前，都会执行一次该函数。
func (suite *ExampleTestSuite) BeforeTest(suiteName, testName string) {
	fmt.Printf("+++BeforeTest(suiteName=%s, testName=%s)+++\n", suiteName, testName)
}

// 运行套件内的每个测试后，都会执行一次该函数。
func (suite *ExampleTestSuite) AfterTest(suiteName, testName string) {
	fmt.Printf("+++AfterTest(suiteName=%s, testName=%s)+++\n", suiteName, testName)
}

// 运行套件内所有测试函数后，执行且只执行一次该函数，可以获取执行结果（起止时间、是否通过）相关信息。
func (suite *ExampleTestSuite) HandleStats(suiteName string, stats *suite.SuiteInformation) {
	fmt.Printf("+++HandleStats(suiteName=%s, stats=%+v)+++\n", suiteName, stats)
}

// 测试套件内，所有以 Test 开头的方法都会作为测试运行
func (suite *ExampleTestSuite) TestExample1() {
	fmt.Println("+++TestExample1+++")
	assert.True(suite.T(), true)
}

// 测试套件内，所有以 Test 开头的方法都会作为测试运行
// 注意：可以使用 suite.Suite 导出的断言函数，以方便测试
func (suite *ExampleTestSuite) TestExample2() {
	fmt.Println("+++TestExample1+++")
	suite.True(true)
}

// 为了让 go test 运行这个套件，我们需要创建一个正常的测试函数并将套件的指针传递给 suite.Run 函数
func TestExampleTestSuite(t *testing.T) {
	suite.Run(t, new(ExampleTestSuite))
}
```

使用 `go test -run ^TestExampleTestSuite$ github.com/rectcircle/go-test-demo/03-testify -v -testify.m ^TestExample1$` 命令可以运行该测试内的某个具体测试（通过 `-testify.m` 指定）。

使用 `go test -run ^TestExampleTestSuite$ github.com/rectcircle/go-test-demo/03-testify -v` 命令，可以运行该套件的所有测试，输出如下：

```
=== RUN   TestExampleTestSuite
+++SetupSuite+++
=== RUN   TestExampleTestSuite/TestExample1
+++SetupTest+++
+++BeforeTest(suiteName=ExampleTestSuite, testName=TestExample1)+++
+++TestExample1+++
+++AfterTest(suiteName=ExampleTestSuite, testName=TestExample1)+++
+++TearDownTest+++
=== RUN   TestExampleTestSuite/TestExample2
+++SetupTest+++
+++BeforeTest(suiteName=ExampleTestSuite, testName=TestExample2)+++
+++TestExample1+++
+++AfterTest(suiteName=ExampleTestSuite, testName=TestExample2)+++
+++TearDownTest+++
+++TearDownSuite+++
+++HandleStats(suiteName=ExampleTestSuite, stats=&{Start:2022-08-14 00:30:45.337556 +0800 CST m=+0.003622966 End:2022-08-14 00:30:45.338018 +0800 CST m=+0.004085457 TestStats:map[TestExample1:0xc000262140 TestExample2:0xc000262190]})+++
--- PASS: TestExampleTestSuite (0.00s)
    --- PASS: TestExampleTestSuite/TestExample1 (0.00s)
    --- PASS: TestExampleTestSuite/TestExample2 (0.00s)
PASS
ok      github.com/rectcircle/go-test-demo/03-testify   1.193s
```

通过如上示例可以看出：

* 生命周期函数以及生命周期为（定义在：[suite/interfaces.go](https://github.com/stretchr/testify/blob/master/suite/interfaces.go)）：

	```
	启动测试套件
		|
		v
	SetupSuite
		|
		v
	 SetupTest       ---+
	 	|               |
		v               |
	 BeforeTest      ---+
	    |               |
		v               |
	  TestXxx        ---+-->  每个测试仅按此循序执行
	  	|               |
		v               |
	 AfterTest       ---+
		|               |
		v               |
	TearDownTest     ---+
		|
		v
	TearDownSuite
		|
		v
	HandleStats
	```

* go test 通过 `-testify.m` 可以实现只测试某个测试函数。
* suite.Suite 也导出了一系列断言函数 `suite.Xxx(...)`，等价于  `assert.Xxx(suite.T(), ...)`
