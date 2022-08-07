---
title: "Go Test 详解"
date: 2022-08-06T23:41:09+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 概述

本文主要介绍：

* Go 标准库 [testing](https://pkg.go.dev/testing@go1.18) 包 和 go test 命令。
* Go 官方维护的库 [Mock](https://github.com/golang/mock)。
* Go 社区最主流的测试库 [Testify](https://github.com/stretchr/testify#mock-package)。

本文使用的 Go 版本为 1.18，示例代码位于 [rectcircle/go-test-demo](https://github.com/rectcircle/go-test-demo)。

## Go 标准库 testing 包 和 `go test` 命令

Go 通过标准库的 testing 包和 Go 命令行工具 test 相关命令，在语言层面，提供了一整套全面的测试工具器。

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

## Go 官方维护的库 Mock

TODO

## Go 社区最主流的测试库 Testify

TODO
