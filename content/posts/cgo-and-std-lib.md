---
title: "CGO 和 Go 标准库"
date: 2022-11-29T22:09:22+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---


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
