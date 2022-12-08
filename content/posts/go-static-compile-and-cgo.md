---
title: "Go 静态编译 和 CGO"
date: 2022-12-08T22:00:00+08:00
draft: true
toc: true
comments: true
tags:
  - golang
---

## Linux C 静态编译

本部分，将复习一下学校里可能学过的 Linux C 编译相关的知识，以帮助更好的理解 Go 语言的静态编译和 CGO。

具体参见博客：[《Linux C 静态编译》](/posts/linux-c-static-compile/)。

## CGO

### 目的

Go 作为近些年来新晋的现代编程语言，而 C 语言是历史悠久，拥有很多优秀的函数库，和操作系统 API 集成更好。

因此，为了更好了使用 C 语言生态，Go 提供了调用 C 语言函数的能力，这个能力被称为 CGO。

### 写法

```go
package main

/*
#include <stdio.h>
#include <stdlib.h>

int add(int a, int b) {
    return a + b;
}

void println(char *s) {
    printf("%s\n", s);
}
*/
import "C"

import (
	"fmt"
	"unsafe"
)

func CAdd(a, b int) int {
	return int(C.add(C.int(1), C.int(2)))
}

func CPrintln(s string) {
	cs := C.CString(s)
    C.Go
	defer C.free(unsafe.Pointer(cs))
	C.println(cs)
}

func main() {
	fmt.Printf("CAdd(1, 2) = %d\n", CAdd(1, 2))
	CPrintln("abc")
}
```

* 通过 `import "C"` 语句表示使用 CGO，C 的源码，通过该语句紧挨着上方的注释提供。
* 通过 `C.c函数名` 的方式，即可调用 C 语言的函数。函数的参数和返回值的类型只能使用 `C.xxx` 类型。如上所示：
    * `C.int` C 语言的 int，其他非指针基础类型类似。
    * `C.CString` 将一个 Go 语言的 string 转换为 C 语言的 `char*`，注意，使用完成后，需要调用 free。
    * `C.GoString` 将一个 C 语言的 `char*` 转化为 Go 语言的 string。
    * 更多参见：[Go语言高级编程 - CGO - 类型转换](https://chai2010.cn/advanced-go-programming-book/ch2-cgo/ch2-03-cgo-types.html)
* 本文重点是静态编译，对 CGO 有个概念即可，更多关于 CGO，参见：[Go语言高级编程 - CGO](https://chai2010.cn/advanced-go-programming-book/ch2-cgo/index.html)。

### 编译过程（默认）

通过 `go clean --cache && rm -rf main` 清理缓存后，通过 `go build -work -x main.go` 命令即可观察到，上述包含 CGO 的代码的编译过程，输出如下：

```
WORK=/tmp/go-build3000103738
mkdir -p $WORK/b001/
cd /home/rectcircle/learn-cgo
TERM='dumb' CGO_LDFLAGS='"-g" "-O2"' /usr/local/lib/go/pkg/tool/linux_amd64/cgo -objdir $WORK/b001/ -importpath command-line-arguments -- -I $WORK/b001/ -g -O2 ./main.go
cd $WORK
gcc -fno-caret-diagnostics -c -x c - -o /dev/null || true
gcc -Qunused-arguments -c -x c - -o /dev/null || true
gcc -fdebug-prefix-map=a=b -c -x c - -o /dev/null || true
gcc -gno-record-gcc-switches -c -x c - -o /dev/null || true
cd $WORK/b001
TERM='dumb' gcc -I /home/rectcircle/learn-cgo -fPIC -m64 -pthread -fmessage-length=0 -fdebug-prefix-map=$WORK/b001=/tmp/go-build -gno-record-gcc-switches -I ./ -g -O2 -o ./_x001.o -c _cgo_export.c
TERM='dumb' gcc -I /home/rectcircle/learn-cgo -fPIC -m64 -pthread -fmessage-length=0 -fdebug-prefix-map=$WORK/b001=/tmp/go-build -gno-record-gcc-switches -I ./ -g -O2 -o ./_x002.o -c main.cgo2.c
TERM='dumb' gcc -I /home/rectcircle/learn-cgo -fPIC -m64 -pthread -fmessage-length=0 -fdebug-prefix-map=$WORK/b001=/tmp/go-build -gno-record-gcc-switches -I ./ -g -O2 -o ./_cgo_main.o -c _cgo_main.c
cd /home/rectcircle/learn-cgo
TERM='dumb' gcc -I . -fPIC -m64 -pthread -fmessage-length=0 -fdebug-prefix-map=$WORK/b001=/tmp/go-build -gno-record-gcc-switches -o $WORK/b001/_cgo_.o $WORK/b001/_cgo_main.o $WORK/b001/_x001.o $WORK/b001/_x002.o -g -O2
TERM='dumb' /usr/local/lib/go/pkg/tool/linux_amd64/cgo -dynpackage main -dynimport $WORK/b001/_cgo_.o -dynout $WORK/b001/_cgo_import.go
cat >$WORK/b001/_gomod_.go << 'EOF' # internal
package main
import _ "unsafe"
//go:linkname __debug_modinfo__ runtime.modinfo
var __debug_modinfo__ = "0w\xaf\f\x92t\b\x02A\xe1\xc1\a\xe6\xd6\x18\xe6path\tcommand-line-arguments\nmod\tgithuh.com/rectcircle/learn-go-supervisord\t(devel)\t\n\xf92C1\x86\x18 r\x00\x82B\x10A\x16\xd8\xf2"
EOF
cat >$WORK/b001/importcfg << 'EOF' # internal
# import config
packagefile fmt=/usr/local/lib/go/pkg/linux_amd64/fmt.a
packagefile runtime/cgo=/usr/local/lib/go/pkg/linux_amd64/runtime/cgo.a
packagefile syscall=/usr/local/lib/go/pkg/linux_amd64/syscall.a
packagefile runtime=/usr/local/lib/go/pkg/linux_amd64/runtime.a
EOF
/usr/local/lib/go/pkg/tool/linux_amd64/compile -o $WORK/b001/_pkg_.a -trimpath "$WORK/b001=>" -p main -lang=go1.17 -buildid vq722mILkfSlVJkLngsl/vq722mILkfSlVJkLngsl -goversion go1.17.3 -D _/home/rectcircle/learn-cgo -importcfg $WORK/b001/importcfg -pack $WORK/b001/_cgo_gotypes.go $WORK/b001/main.cgo1.go $WORK/b001/_cgo_import.go $WORK/b001/_gomod_.go
/usr/local/lib/go/pkg/tool/linux_amd64/pack r $WORK/b001/_pkg_.a $WORK/b001/_x001.o $WORK/b001/_x002.o # internal
/usr/local/lib/go/pkg/tool/linux_amd64/buildid -w $WORK/b001/_pkg_.a # internal
cp $WORK/b001/_pkg_.a /home/rectcircle/.cache/go-build/7e/7e99e06a115dae258bf0ea0a07606e643c1cfd0c87a62ae41b9963d5438c0264-d # internal
cat >$WORK/b001/importcfg.link << 'EOF' # internal
packagefile command-line-arguments=$WORK/b001/_pkg_.a
packagefile fmt=/usr/local/lib/go/pkg/linux_amd64/fmt.a
packagefile runtime/cgo=/usr/local/lib/go/pkg/linux_amd64/runtime/cgo.a
packagefile syscall=/usr/local/lib/go/pkg/linux_amd64/syscall.a
packagefile runtime=/usr/local/lib/go/pkg/linux_amd64/runtime.a
packagefile errors=/usr/local/lib/go/pkg/linux_amd64/errors.a
packagefile internal/fmtsort=/usr/local/lib/go/pkg/linux_amd64/internal/fmtsort.a
packagefile io=/usr/local/lib/go/pkg/linux_amd64/io.a
packagefile math=/usr/local/lib/go/pkg/linux_amd64/math.a
packagefile os=/usr/local/lib/go/pkg/linux_amd64/os.a
packagefile reflect=/usr/local/lib/go/pkg/linux_amd64/reflect.a
packagefile strconv=/usr/local/lib/go/pkg/linux_amd64/strconv.a
packagefile sync=/usr/local/lib/go/pkg/linux_amd64/sync.a
packagefile unicode/utf8=/usr/local/lib/go/pkg/linux_amd64/unicode/utf8.a
packagefile sync/atomic=/usr/local/lib/go/pkg/linux_amd64/sync/atomic.a
packagefile internal/bytealg=/usr/local/lib/go/pkg/linux_amd64/internal/bytealg.a
packagefile internal/itoa=/usr/local/lib/go/pkg/linux_amd64/internal/itoa.a
packagefile internal/oserror=/usr/local/lib/go/pkg/linux_amd64/internal/oserror.a
packagefile internal/race=/usr/local/lib/go/pkg/linux_amd64/internal/race.a
packagefile internal/unsafeheader=/usr/local/lib/go/pkg/linux_amd64/internal/unsafeheader.a
packagefile internal/abi=/usr/local/lib/go/pkg/linux_amd64/internal/abi.a
packagefile internal/cpu=/usr/local/lib/go/pkg/linux_amd64/internal/cpu.a
packagefile internal/goexperiment=/usr/local/lib/go/pkg/linux_amd64/internal/goexperiment.a
packagefile runtime/internal/atomic=/usr/local/lib/go/pkg/linux_amd64/runtime/internal/atomic.a
packagefile runtime/internal/math=/usr/local/lib/go/pkg/linux_amd64/runtime/internal/math.a
packagefile runtime/internal/sys=/usr/local/lib/go/pkg/linux_amd64/runtime/internal/sys.a
packagefile internal/reflectlite=/usr/local/lib/go/pkg/linux_amd64/internal/reflectlite.a
packagefile sort=/usr/local/lib/go/pkg/linux_amd64/sort.a
packagefile math/bits=/usr/local/lib/go/pkg/linux_amd64/math/bits.a
packagefile internal/poll=/usr/local/lib/go/pkg/linux_amd64/internal/poll.a
packagefile internal/syscall/execenv=/usr/local/lib/go/pkg/linux_amd64/internal/syscall/execenv.a
packagefile internal/syscall/unix=/usr/local/lib/go/pkg/linux_amd64/internal/syscall/unix.a
packagefile internal/testlog=/usr/local/lib/go/pkg/linux_amd64/internal/testlog.a
packagefile io/fs=/usr/local/lib/go/pkg/linux_amd64/io/fs.a
packagefile time=/usr/local/lib/go/pkg/linux_amd64/time.a
packagefile unicode=/usr/local/lib/go/pkg/linux_amd64/unicode.a
packagefile path=/usr/local/lib/go/pkg/linux_amd64/path.a
EOF
mkdir -p $WORK/b001/exe/
cd .
/usr/local/lib/go/pkg/tool/linux_amd64/link -o $WORK/b001/exe/a.out -importcfg $WORK/b001/importcfg.link -buildmode=exe -buildid=hIqSnweqCct6EAyj-ie9/vq722mILkfSlVJkLngsl/sc8_MwUXPVexy5egmON-/hIqSnweqCct6EAyj-ie9 -extld=gcc $WORK/b001/_pkg_.a
/usr/local/lib/go/pkg/tool/linux_amd64/buildid -w $WORK/b001/exe/a.out # internal
mv $WORK/b001/exe/a.out main
```

当项目中包含，`import "C"` 语句时：

* 预处理：首先调用 `pkg/tool/linux_amd64/cgo` 对 go 源码进行预处理，生成中间源码文件，在上例中，位于 `/tmp/go-build3000103738/b001`，其中 `main.cgo2.c` 是 C 语言的源码部分。
* 编译 C 源码：调用系统默认的 C 语言编译器（可通过 `CC` 环境变量指定），在本例中为 gcc。
    * 将 c 源码文件编译成 `.o` 文件，如 `main.cgo2.c` 被编译成了 `_x002.o`。
    * 将所有 `.o` 生成 `_cgo_.o`。
* 生成动态链接库信息：调用 `pkg/tool/linux_amd64/cgo` 根据 `_cgo_.o` 生成包含动态链接信息的代码文件，位于 `_cgo_import.go`。
* 编译 Go 源码：`pkg/tool/linux_amd64/compile` 编译 go 源码生成 `_pkg_.a`。
* 打包 C 源码的 `.o`：`pkg/tool/linux_amd64/pack` 将 C 源码生成的 `.o` 打包到 `_pkg_.a` 中。
* 写入 buildid：`pkg/tool/linux_amd64/buildid` 将 buildid 写入 `_pkg_.a`。
* 生成可执行文件（链接阶段）：`pkg/tool/linux_amd64/link` 为 `_pkg_.a` 链接上 Go 源码引入的其他 go package，并生成可执行文件 `a.out`
* 复制产物：将 `a.out` 复制到目标位置。

通过 `ldd main` 查看，动态链接库情况可以看出，CGO 引入如下动态链接库：

```
        linux-vdso.so.1 (0x00007ffe875d2000)
        libpthread.so.0 => /lib/x86_64-linux-gnu/libpthread.so.0 (0x00007f058bbf5000)
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f058ba20000)
        /lib64/ld-linux-x86-64.so.2 (0x00007f058bc1f000)
```

### 编译过程（静态）

通过 `go clean --cache && rm -rf main` 清理缓存后，通过 `go build -work -x -ldflags "-linkmode external -extldflags -static" main.go` 命令即可观察到，上述包含 CGO 的代码的编译过程，和上面的默认编译相比，输出唯一的变化如下：

```
/usr/local/lib/go/pkg/tool/linux_amd64/link -o $WORK/b001/exe/a.out -importcfg $WORK/b001/importcfg.link -buildmode=exe -buildid=O0JDvIMHA7Jvz8sJWN7S/vq722mILkfSlVJkLngsl/sc8_MwUXPVexy5egmON-/O0JDvIMHA7Jvz8sJWN7S -linkmode external -extldflags -static -extld=gcc $WORK/b001/_pkg_.a
```

通过 `ldd main` 查看，动态链接库情况可以看出，静态链接后，没有了动态链接库：

```
        不是动态可执行文件
```

### CGO_ENABLED 环境变量

通过 `go clean --cache && rm -rf main` 清理缓存后，通过 `CGO_ENABLED=0 go build -work -x main.go` 命令即可观察到，输出如下：

```
WORK=/tmp/go-build3880112141
go: no Go source files
```

可以看出，当 `CGO_ENABLED=0`，go 编译器会忽略掉包含了 `import "C"` 的源代码文件，直接报错。

也就是说，默认情况下 `CGO_ENABLED=1`，且当使用了 CGO 时，必须保证 `CGO_ENABLED=1`，否则将无法进行编译。

### CGO 的跨平台问题

Go 语言的一大特色就是，一次编写，多次编译，到处运行。而 C 语言的跨平台特性非常差，因此使用 CGO，会让 Go 语言的跨平台特性劣化到 C 语言的水准。

其次，通过 `ldd main` （默认编译）的输出。可以看到，由于我们使用 CGO，而引入对外部动态链接库的依赖，而纯 Go 代码不会有此问题。

最后，Go 语言本身已经比较强大了，多数常规能力通过纯 Go 基本都可以实现（某些与操作系统特性紧密相连的场景，如 runc）。

因此，这里的建议是：能用 Go 实现的就用 Go 来实现。

## Go 标准库 和 CGO

Go 的标准库基本上所有的包都是通过 Go 语言来实现。

但是，对于如下的标注库中的包（可能出于性能考虑），除了提供 Go 语言的实现外，还提供了 CGO 的实现：

* `os/user`
* `net`

在默认情况下（Linux 平台，CGO_ENABLED=1），项目使用了如上包中的函数，在编译时，将使用 CGO 的实现。此时 ldd 查看可执行文件，将看到 `libc.so` 等动态链接库的依赖。如 `main.go`：

```go
package main

import (
	"fmt"
	"os/user"
)
func main() {
    fmt.Println(user.Lookup("root"))
}
```

`ldd main` 将输出：

```
        linux-vdso.so.1 (0x00007fff43bf0000)
        libpthread.so.0 => /lib/x86_64-linux-gnu/libpthread.so.0 (0x00007f7e3b1b1000)
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f7e3afdc000)
        /lib64/ld-linux-x86-64.so.2 (0x00007f7e3b1db000)
```

此时，通过两种方式可以实现使用标准库中纯 Go 的实现：

* 方式 1：设置 `CGO_ENABLED=0` 环境变量，禁用 CGO，命令为 `CGO_ENABLED=0 go build main.go`。
* 方式 2：使用标准库这两个包提供的条件编译标签，强制指定使用纯 Go 的实现。命令为 `go build -tags osusergo,netgo main.go`。

## Go 静态编译场景

这里的静态编译指的是，Go 项目编译出的可执行文件是没有任何动态链接库的依赖。

|                  | 项目有 CGO 代码 且 外部库**有**用到 dlopen (如 glibc)  | 项目有 CGO 代码 且 外部库**未**用到 dlopen (如  musl-libc) |                                 项目无 CGO 代码 |
|------------------|-|-|-|
| 使用标准库 cgo 实现 | ① | ② | ③ |
| 使用标准库 go  实现 | ④ | ⑤ | ⑥ |

下面的场景，在 Linux 平台，编译当前项目 `./cmd` 目录下的 `main` 包为例。

### 场景 ①

针对该场景，无法实现静态编译，如果强制使用如下命令，将警告，并在很多场景直接 panic。

```bash
# 使用 -ldflags 指定：
#   -linkmode external : 使用外部链接器
#   --extldflags -static : 告知 C 语言编译器使用静态编译。
go build -ldflags "-linkmode external -extldflags -static" ./cmd
```

编译时，将出现，类似如下警告：

```
Using 'xxx' in statically linked applications requires at runtime the shared libraries from the glibc version used for linking
```

### 场景 ②

```bash
# 安装 musl-libc 编译器
sudo apt-get install musl-tools
# 使用 CC 指定 C 语言编译器为 musl-gcc
# 使用 -ldflags 指定：
#   -linkmode external : 使用外部链接器
#   --extldflags -static : 告知 C 语言编译器使用静态编译。
CC=musl-gcc go build -ldflags "-linkmode external -extldflags -static" ./cmd
```

### 场景 ③

由于 Go 标准库的 CGO 实现，依赖 libc，因此，无法使用 glibc。所以解法和 **场景 ②** 一致。

### 场景 ④

无法实现，原因参见： **场景 ①**。

### 场景 ⑤

```bash
# 安装 musl-libc 编译器
sudo apt-get install musl-tools
# 使用 CC 指定 C 语言编译器为 musl-gcc
# 使用 -tags osusergo,netgo 指定：标准库使用纯 Go 实现。
# 使用 -ldflags 指定：
#   -linkmode external : 使用外部链接器
#   --extldflags -static : 告知 C 语言编译器使用静态编译。
CC=musl-gcc go build -tags osusergo,netgo -ldflags "-linkmode external -extldflags -static" ./cmd
```

### 场景 ⑥

```bash
# CGO_ENABLED=0 直接禁用 CGO 即可
CGO_ENABLED=0 go build ./cmd
```
