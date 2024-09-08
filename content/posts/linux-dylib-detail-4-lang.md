---
title: "Linux 动态链接库详解（四） 各编程语言情况"
date: 2024-08-01T11:00:00+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 各编程语言情况

### C & C++

前文关于动态库的介绍都是基于 C & C++ 编程语言直接使用 gcc 或者 makefile 进行构建的。

这里介绍一下一些其他常见构建工具对动态库的处理情况。

#### pkg-config

真实的 C/C++ 项目的动态库依赖是十分复杂的，在调用 gcc 或编写 makefile 时，手动指定 `-L` 和 `-l` 是很比较麻烦的。

pkg-config 就可以解决这个问题，其通过 `.pc` 格式的文件能自动生成 `-L` 和 `-l` 参数。

一般的使用流程如下：

* 库开发者：发布库时会提供一个 `.pc` 文件，这个文件中包含了库的元信息（开源届主流的 C/C++ 库，如 [libcurl](https://github.com/curl/curl/blob/master/libcurl.pc.in)、[zlib](https://github.com/madler/zlib/blob/develop/zlib.pc.in)、[libevent](https://github.com/libevent/libevent/blob/master/libevent.pc.in) 等）。
* 项目开发者：使用 `pkg-config --cflags --libs xxx` 命令，生成 gcc 的 `-L` 或 `-l` 参数（可以与 gcc、makefile 或 Autotools、CMake 等集成）。例如：

    ```bash
    gcc -o example example.c $(pkg-config --cflags --libs gtk+-3.0)
    ```

* 项目使用者：使用包管理工具将项目发型的包、依赖的库都安装到系统中，按照上篇文章介绍的运行时查找方式来查找动态库。

#### 主流的构建工具

真实的 C/C++ 项目，不会手动使用 gcc 或 makefile 来构建项目，而是使用一些项目管理工具/构建工具，如：

* CMake
* Autotools
* Ninja
* Meson
* Bazel

这些项目最终也是使用 pkg-config 或者配置 `-L` `-l` 来管理动态链接库的，在此次不多赘述。

### Go

```bash
go build -o main  ./
ldd main
go clean -cache
readelf --version-info main
readelf -r main
go clean -cache
CGO_LDFLAGS='-Wl,-l,abcdef -Wl,--verbose -Wl,-L,/lib/x86_64-linux-gnu -Wl,-rpath=/lib/x86_64-linux-gnu -Wl,--dynamic-linker=/lib64/ld-linux-x86-64.so.2' go build -x -o main ./main.go > All-in-OneDig/e.log 2>&1

https://github.com/NixOS/nixpkgs/issues/52553
```

```
        linux-vdso.so.1 (0x00007ffd1c123000)
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007fd1042b0000)
        libpthread.so.0 => /lib/x86_64-linux-gnu/libpthread.so.0 (0x00007fd10428e000)
        /lib64/ld-linux-x86-64.so.2 (0x00007fd10448d000)


readelf --version-info main             

Version needs section '.gnu.version_r' contains 2 entries:
 Addr: 0x000000000052f480  Offset: 0x12f480  Link: 9 (.dynstr)
  000000: Version: 1  File: libpthread.so.0  Cnt: 2
  0x0010:   Name: GLIBC_2.3.2  Flags: none  Version: 2
  0x0020:   Name: GLIBC_2.2.5  Flags: none  Version: 3
  0x0030: Version: 1  File: libc.so.6  Cnt: 1
  0x0040:   Name: GLIBC_2.2.5  Flags: none  Version: 4

Version symbols section '.gnu.version' contains 47 entries:
 Addr: 0x000000000052f4e0  Offset: 0x12f4e0  Link: 10 (.dynsym)
  000:   0 (*local*)       1 (*global*)      1 (*global*)      1 (*global*)   
  004:   3 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)
  008:   4 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)
  00c:   4 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)
  010:   4 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)   3 (GLIBC_2.2.5)
  014:   2 (GLIBC_2.3.2)   3 (GLIBC_2.2.5)   3 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)
  018:   3 (GLIBC_2.2.5)   2 (GLIBC_2.3.2)   3 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)
  01c:   3 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)
  020:   3 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)   3 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)
  024:   4 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)
  028:   4 (GLIBC_2.2.5)   3 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)
  02c:   3 (GLIBC_2.2.5)   3 (GLIBC_2.2.5)   4 (GLIBC_2.2.5)

readelf -r main
```

### Python

### Rust

程序员的自我修养——链接、装载与库

* 动态链接库版本号 libXXX.so.x.y.z
* SO-NAME - ldconfig
* gcc -lXXX 等价于查找 `libXXX.so.x.y.z` XXX 为链接名
* 符号版本 （glibc）
* 运行时动态库查找由 /lib/ld-linux.so.X 实现
    * `$LD_LIBRARY_PATH` （优先级最高）
    * /etc/ld.so.conf (/etc/ld.so.cache by ldconfig)
    * /usr/lib
    * /lib
* `$LD_PRELOAD` （/etc/ld.so.preload） 不管需要与否都装载的库，都装载（可覆盖动态库中的个别函数或全局变量）。
* `$LD_DEBUG` 打印动态库过程，可选值如下：
    * `files` 打印动态库装载过程。
    * `libs` 打印查找过程。
    * `versions` 打印符号的版本依赖关系。
    * `reloc` 显示重定位过程。
    * `symbols` 显示符号表查找过程。
    * `statistics` 显示动态链接过程中的各种统计信息。
    * `all` 显示所有信息。
* 为什么是 libc.so.6 glibc 也主要关注Linux 下的开发，成为了Linux 平台的C标准库。
20世纪90年代初，在glibc成为Linux 下的C运行库之前，Linux的开发者们因为开发 的需要，从Linux内核代码里面分离出了一部分代码，形成了早期Linux 下的C运行库。这 个 C 运 行 库 又 被 称 为 L i n u x l i b c 。 这 个版 本 的 C 运 行 库 被 维 护 了很 多 年 ， 从 版 本 2 一 直 开 发 到版本5。如果你去看早期版本的Linux，会发现/ ib 目录下面有libc.so.5这样的文件，这个 文件就是第五个版本的Linuxlibc。1996 年FSF发布了glibc2.0，这个版本的glibc 开始支持 诸多特性，比如它完全支持POSIX标准、困际化、IPv6、64-位数据访问、多线程及改进了 代码的可移植性。在此时Linuxlibc的开发者也认识到单独地维护一份Linux 下专用的C运 行 库 是 没 有 必 要 的 ， 于 是 L i n u x 开 始 采 用 g l i b c 作 为 默 认 的 C 运 行 库 ，并 且 将 2 . x 版 本 的 g l i b c 看 作 是 L i n u x l i b c 的 后 继 版 本 。 于 是 我 们 可 以 看 到 ，g l i b c 在 n i b 目 录 下 的 . s 0 文 件 为 l i b c . s o . 6 ， 即第六个libc 版本，而且在各个Linux 发行版中，glibc往往被称为libc6。glibc 在Linux 平 台 下占据 了主导地位之后，它又被移植到 了其他操作系统和其他硬件平台，诸如FreeBSD、 NetBSD等，而且它支持
