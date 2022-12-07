---
title: "Go 静态编译 和 CGO"
date: 2022-11-29T22:09:22+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## Linux C 静态编译

本部分，将复习一下学校里可能学过的 Linux C 编译相关的知识，以帮助更好的理解 Go 语言的静态编译和 CGO。

具体参见博客：[《Linux C 静态编译》](/posts/linux-c-static-compile/)。

## CGo

### 目的

### 写法

### 编译过程

### 注意事项

## Go 标准库 和 CGo

什么是 Go 的标准库。

### Go 条件编译

### os/user 包

### net 包

## Go 静态编译

### 介绍

什么是 Go 的静态编译。

### 默认编译参数情况

### Go 静态编译场景

|                  | 项目有 CGo 代码 且 **有**用到 dlopen (如 glibc)  | 项目有 CGo 代码 且 **未**用到 dlopen (如 glibc) |                                 项目无 CGo 代码 |
|------------------|-|-|-|
| 使用标准库 cgo 实现 | ① | ② | ③ |
| 使用标准库 go  实现 | ④ | ⑤ | ⑥ |

#### 场景 ①

#### 场景 ②

#### 场景 ③

#### 场景 ④

#### 场景 ⑤

#### 场景 ⑥

## 参考

https://stackoverflow.com/questions/2725255/create-statically-linked-binary-that-uses-getaddrinfo

https://groups.google.com/g/comp.os.linux.development.apps/c/9mT498GaSns

```
gcc glibc warning statically linked applications
libnss
https://sourceware.org/glibc/wiki/FAQ#Even_statically_linked_programs_need_some_shared_libraries_which_is_not_acceptable_for_me.__What_can_I_do.3F
https://abi-laboratory.pro/?view=changelog&l=glibc&v=2.27
原因是： glibc 调用了 dlopen 加载了 libnss， libnss 又会依赖 glibc，循环依赖。。。。而 glibc 禁止了静态链接应用。

https://www.cnblogs.com/tsecer/p/10485680.html
```

https://pkg.go.dev/net

环境变量 GODEBUG

https://pkg.go.dev/os/user

tags osusergo

https://tonybai.com/2017/06/27/an-intro-about-go-portability/

https://blog.haohtml.com/archives/31332

https://promacanthus.netlify.app/experience/golang/01-%E7%BC%96%E8%AF%91%E7%9A%84%E5%9D%91/

https://github.com/golang/go/issues/24787

https://breezetemple.github.io/2018/11/12/statically-linked-binary-that-uses-getaddrinfo/

https://coderfan.net/optimization-golang-compilation-with-statically-linked.html

https://zhuanlan.zhihu.com/p/338891206

https://packages.debian.org/buster/musl-tools

```
package main

import (
	"fmt"
	"os/user"
	"time"
)

// sudo apt-get install musl-tools
// GOOS=linux CC=musl-gcc go build -tags release -a -ldflags "-linkmode external -extldflags -static" -o ./tmp/main ./tmp

func main() {
	go func() {
		fmt.Println(user.Lookup("byteide"))
	}()

	time.Sleep(1 * time.Second)
}
```

```
1. 

CGO_ENABLED=1 go build -tags release -a -ldflags "-linkmode external -extldflags -static" -o ./main main.go

# command-line-arguments
/tmp/go-link-1654487192/000002.o：在函数‘mygetgrouplist’中：
/usr/local/lib/bytedance-go/src/os/user/getgrouplist_unix.go:18: 警告：Using 'getgrouplist' in statically linked applications requires at runtime the shared libraries from the glibc version used for linking
/tmp/go-link-1654487192/000001.o：在函数‘mygetgrgid_r’中：
/usr/local/lib/bytedance-go/src/os/user/cgo_lookup_unix.go:40: 警告：Using 'getgrgid_r' in statically linked applications requires at runtime the shared libraries from the glibc version used for linking
/tmp/go-link-1654487192/000001.o：在函数‘mygetgrnam_r’中：
/usr/local/lib/bytedance-go/src/os/user/cgo_lookup_unix.go:45: 警告：Using 'getgrnam_r' in statically linked applications requires at runtime the shared libraries from the glibc version used for linking
/tmp/go-link-1654487192/000001.o：在函数‘mygetpwnam_r’中：
/usr/local/lib/bytedance-go/src/os/user/cgo_lookup_unix.go:35: 警告：Using 'getpwnam_r' in statically linked applications requires at runtime the shared libraries from the glibc version used for linking
/tmp/go-link-1654487192/000001.o：在函数‘mygetpwuid_r’中：
/usr/local/lib/bytedance-go/src/os/user/cgo_lookup_unix.go:30: 警告：Using 'getpwuid_r' in statically linked applications requires at runtime the shared libraries from the glibc version used for linking

docker run -it -v $(pwd)/main:/main busybox  /main
docker run -it -v $(pwd)/main:/main alpine:latest /main

ldd main.go

	不是动态可执行文件

docker run -it -v $(pwd)/main:/main alpine:latest /main


2. 

CGO_ENABLED=0 go build -tags release -a -ldflags "-linkmode external -extldflags -static" -o ./main main.go

# command-line-arguments
loadinternal: cannot find runtime/cgo

3. 

CGO_ENABLED=1 go build -tags release -a -ldflags "-extldflags -static" -o ./main main.go

docker run -it -v $(pwd)/main:/main busybox  /main
standard_init_linux.go:211: exec user process caused "no such file or directory"

ldd main
	linux-vdso.so.1 (0x00007fff09bea000)
	libpthread.so.0 => /lib/x86_64-linux-gnu/libpthread.so.0 (0x00007f13f597d000)
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f13f55de000)
	/lib64/ld-linux-x86-64.so.2 (0x00007f13f5b9a000)

docker run -it -v $(pwd)/main:/main alpine:latest /main
standard_init_linux.go:211: exec user process caused "no such file or directory"

4. 

CGO_ENABLED=0 go build -tags release -a -ldflags "-extldflags -static" -o ./main main.go

docker run -it -v $(pwd)/main:/main busybox  /main
docker run -it -v $(pwd)/main:/main alpine:latest /main
```

GO_BUILDMODE_STATIC := -buildmode=pie
LDFLAGS_STATIC := -linkmode external -extldflags --static-pie

$(EXTRA_FLAGS) -tags "$(BUILDTAGS) netgo osusergo" \
