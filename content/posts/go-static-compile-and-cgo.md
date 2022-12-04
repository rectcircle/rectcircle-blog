---
title: "Go 静态编译 和 CGO"
date: 2022-11-29T22:09:22+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## Linux C 相关背景知识

本部分，将复习一下学校里可能学过的 C 语言和操作系统的基础知识，以帮助更好的理解 Go 语言的静态编译和 CGO。

### 编译过程

Linux 又称 [GNU/Linux](https://www.gnu.org/gnu/linux-and-gnu.html) 。自然而然 Linux 提供的系统调用（API）通过 glibc 提供，通过 C 语言描述，因此 C 语言是离 Linux 内核最近的编程语言。

而 GCC 是 Linux 上应用程序默认的编译器。因此，了解 GCC 语言的编译过程，才能更好的理解 Go 语言的静态编译和 CGO 的机制。

GCC 的编译一个可执行文件的过程，可以按照顺序分为如下 4 个阶段，这 4 个阶段前一个阶段是后一个阶段输入进行连接。

* 预处理。输入 `.c` (C 语言代码文件) 和 `.h` （头文件） 源代码文件。输出预编译文件 `.i`。该过程是对 C 语言宏的处理。
* 编译，输出汇编文件 `.s`。该过程将 C 代码转换为等价的汇编代码。
* 汇编，生成目标文件 `.o`。该过程将汇编代码转换为机器语言代码。
* 链接，生成可执行文件。该过程将 `.o` 依赖的外部全局变量和函数的定义链接到 `.o` 文件中，并生成可执行文件。

这里需要特别说明的是：

* 上文介绍的时 C 语言的可执行文件的编译过程。在 Linux 中，最终编译产物还是两种其他类：静态链接库 (`.so`) 和动态链接库 (`.a`)。要编译生成这两种类型的产物的前 3 个阶段和编译一个可执行文件的过程一样，都需要预处理、编译、汇编的过程。
* Go 语言编译成可执行文件的过程，在链接阶段和 GCC 的过程是类似的，因此我们需要重点看链接的过程。其他过程本文不多做介绍。

### 动态链接原理和优点

我们编写的代码，最终会编译成可执行文件，这个可执行文件会占用磁盘空间。可执行文件执行时，可执行文件本身会加载到内存中，占用内存资源。

编写一个 C 语言的程序，需要调用一些通用的函数（如 [ISO C](https://www.gnu.org/software/libc/manual/2.36/html_mono/libc.html#ISO-C)）以及一些操作系统提供的系统调用的封装函数。这些依赖，基本上是所有 Linux C 的应用程序所必备的。

在计算机发展早期，磁盘和内存的资源是及其昂贵的。如果每个程序，都需要将这些函数的实现编译到可执行文件中，这样就造成了磁盘和内存资源的浪费。

为此，操作系统，通过动态链接的能力，以节约，可执行文件自身占在用的磁盘空间，以及其在加载后占用内存资源。

Linux 动态链接的流程为：

* 将函数库，编译成动态链接库 (`.so`)。
* 可执行文件如果依赖该函数库的函数，在链接阶段将该函数库的名字 (标识) 声明在可执行文件中。此时，生成的可执行文件就不会包含动态链接库的内容，而只存在一个引用，从而节省了磁盘空间。
* 可执行文件在执行时，当调用位于动态链接库中的函数时，会首先查找该动态链接库是否加载过了，如果已经加载过了，则执行执行已加载的函数代码，否则去磁盘中查找对应的动态链接库，并加载。这就保证同一个动态链接库，在内存中只存在一份，从而节省了内存空间。

以上，是动态链接要解决的主要问题。除了上述流程外，Linux 还提供了另一种使用动态链接库的方法：在代码中动态的调用 `ldopen` 等系统调用来加载甚至替换一个外部函数库。利用这个特性，可以实现代码程序的热更新(参考： [Linux C/C++ 实现热更新](https://howardlau.me/programming/c-cpp-hot-reload.html))，不需要重启进程。

### 动态链接的缺点

没有什么好处是没有代价的，动态链接的本质是一种复用，复用意味着一种耦合。因此会带来如下问题：

* 应用程序存在外部依赖，这给程序的部署带来困难。
* 多个程序依赖不同版本的同一动态链接库时，存在的冲突的问题。

目前，随着磁盘和存储的成本不断地降低，动态链接的缺点带来的问题已经远大于其优点带来的收益了。为了解决这些问题，又提出了很多技术，如：

* 在移动端（如 Android），将应用程序的所有依赖打包到一个压缩包 (`.apk`)，包括 `.so`。
* 在服务端，将所有的程序和依赖 (`so`) 容打包成一个镜像，并以容器化方式运行 (mount namespace)。
* 各种编程语言通过如下方式解决这些问题：
    * 通过虚拟机封装操作系统的差异，如 Java。
    * 支持通过静态编译的方式生成无外部依赖的可执行文件，如 Go。

### C 语言的库 和 libc

C 语言虽然是一种高级语言，但是和其他的编程语言相比，有一个特殊的身份，即系统编程语言，具体而言就是：

* 多数操作系统是由 C 语言编写的，这要求其标准库是可选的，且需要能操作非常底层的硬件资源，需要具有巨大灵活性。
* 多数操作系统的系统调用 (API) 是通过 C 语言函数调用方式提供。

因此，C 语言函数库的可以分为标准的跨平台的部分、操作系统专有两个部分：

* 跨平台的部分主要的标准有：[ISO C](https://www.gnu.org/software/libc/manual/2.36/html_mono/libc.html#ISO-C)、[POSIX](https://www.gnu.org/software/libc/manual/2.36/html_mono/libc.html#POSIX)。
* 操作系统专有的库有：[BSD](https://www.gnu.org/software/libc/manual/2.36/html_mono/libc.html#Berkeley-Unix)、[SVID](https://www.gnu.org/software/libc/manual/2.36/html_mono/libc.html#SVID)、[XPG](https://www.gnu.org/software/libc/manual/2.36/html_mono/libc.html#XPG)、Linux。这些特殊特定函数，会通过宏来开启，如 Linux 的 [`_GNU_SOURCE`](http://musl.libc.org/doc/1.1.24/manual.html)。

这样 在编写 C 程序时，对于的选择就有了三种：

* 不适用标准库，在无操作系统的嵌入式领域或者操作系统领域。
* 仅使用跨平台的标准库，这样编写的 C 程序：
    * 只是用 ISO C 几乎可以在所有的操作系统中使用，包括 windows。
    * 使用了 POSIX，及基本上可以在类 Unix 跨平台编译。
* 使用了操作系统专有的库，则大概率只能在该操作系统进行运行。对于 Linux ，一些主流的开源 Unix 应该都是可以运行的。

libc 指 C 语言标准库。不同的 libc 对如上标准或库的情况也是不一样的。一般情况下，会实现标准的 [ISO C](https://www.gnu.org/software/libc/manual/2.36/html_mono/libc.html#ISO-C)、[POSIX](https://www.gnu.org/software/libc/manual/2.36/html_mono/libc.html#POSIX)，在加上该 libc 面向的操作系统的专有库。

下面介绍，在 Linux 中，[主流的 libc 库](http://www.etalabs.net/compare_libcs.html)：

* [glibc](https://www.gnu.org/software/libc/manual/2.36/html_mono/libc.html)，大而全的历史包袱很重的 libc 库，据说代码质量很差。为了实现 Linux 宣扬的其他类 Unix 操作系统可以在 Linux 中编译，因此支持上述的所有库。是 GNU 基金会下的产物，服务端领域主流的 Linux 版采用的 libc 实现。采用 LGPL 协议（[静态编译不友好](https://www.zyxtech.org/2016/04/28/55/)），下文会专门介绍。
* [musl-libc](http://www.musl-libc.org/intro.html)，定位为下一代 Linux 设备，采用 MIT 协议，专为静态编译设计，支持主流的指令集。主要应用云原生和嵌入式领域。
* [uClibc-ng](https://uclibc-ng.org/)，面向嵌入式的 libc，采用 LGPL 协议（[静态编译不友好](https://www.zyxtech.org/2016/04/28/55/)）。

### glibc 的动态链接问题

只节省代码段占用的内存（内存布局）。 https://qtdebug.com/qtbook-lib-global-variable/

ldd glibc 看到的 https://blog.csdn.net/wang_xya/article/details/43985241

https://stackoverflow.com/questions/57476533/why-is-statically-linking-glibc-discouraged

https://github.com/bminor/glibc/blob/master/nss/nss_module.c

```

https://www.gnu.org/software/libc/manual/html_node/glibc-iconv-Implementation.html 
sudo ldconfig -p | grep libresolv

```

### musl-libc 实现静态链接

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
