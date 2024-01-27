---
title: "用户态文件系统 fuse"
date: 2023-12-29T18:10:00+08:00
draft: false
toc: true
comments: true
tags:
  - linux
---

## 简述

Linux 应用程序对文件系统操作的函数，是有一套标准的，这个标准就是 POSIX。

POSIX 文件系统接口本质上是一套 C 语言函数声明，如： `open`、`write`、`read`、`mkdir`、`unlink` 等函数。

也就是说 Linux 的所有文件系统都需要满足 POSIX 文件系统接口。

POSIX 作为面向使用者的接口，其设计重点考虑的是通用性和易用性，不会重点关注是否易于实现。站在 Linux 系统开发者的角度，如果不做任何抽象，就需要所有的文件系统的开发都需要实现这套 POSIX 标准，存在大量重复代码，处理各种细节，开发成本会非常高。

因此 Linux 系统提供了一套面相文件系统开发者的抽象： [VFS](https://www.kernel.org/doc/html/next/filesystems/vfs.html)，VFS 主要定义的就是就是围绕如下几个结构体的操作：

* `file_system_type` 文件系统类型，该结构体定义文件系统名，flag 参数，mount 参数，mount 系统调用回调函数等。
* [`superblock`](https://litux.nl/mirror/kerneldevelopment/0672327201/ch12lev1sec5.html) 记录某个 mount 了的文件系统的元信息，如顶级目录的 inode，挂载点，关联的设备，空间大小等。
* [`inode`](https://litux.nl/mirror/kerneldevelopment/0672327201/ch12lev1sec6.html) 文件系统中的每一个文件（包括目录）在读写时，都会对应一个内存中的 inode 结构体（硬链接会多对一），主要记录这个文件的元信息，如：inode 编号 (`i_ino`)，文件类型，文件大小，相关时间，文件权限和类型（`i_mode`）、所有者、所属组。
* [`dentry`](https://litux.nl/mirror/kerneldevelopment/0672327201/ch12lev1sec7.html) 目录项，POSIX 文件系统本质上是一个由目录组成树状结构，通过路径定位。`dentry` 代表着目录树节点，基于此还实现了 inode 缓存以及文件路径到 inode 的快速定位。`dentry` 主要包含了 inode 指针，文件的 basename，父 `dentry` 指针、子 `dentry` 列表。此外，还存在一个用于缓存 dentry 的 hash 表（hash key 由文件 basename 和父 `dentry` 的指针组成），在读取一个路径时，会按照目录结构依次从 hash 表中查找 `dentry`，如果找不到才会从文件系统中重新读取（参见：[知乎文章头图](https://zhuanlan.zhihu.com/p/261669249)，[博客](https://bean-li.github.io/vfs-inode-dentry/)）。

因此，要实现一个文件系统，需要编写一个内核模块，实现 Linux 定义的一系列对上述结构体的函数接口。

编写内核模块的成本和难度是比较高的。而 fuse 提供了一种，在用户态的普通应用程序，即可实现一个自定义文件系统的框架。

## 架构

fuse 框架主要包含如下几个部分：

* 位于内核的 fuse 内核模块，主流的 Linux 发行版（如 debian）均有启用 （`/lib/modules/*/kernel/fs/fuse/`）。
* 用于内核态和用户态通讯的设备文件 `/dev/fuse`，以及用于用户态和内核态通讯的一套通讯协议。
* fuse 命令行工具集 （以 debian 为例： [fuse3/filelist](https://packages.debian.org/buster/amd64/fuse3/filelist)）
    * `/bin/fusermount` (`/bin/fusermount3`)
    * `/sbin/mount.fuse` (`/sbin/mount.fuse3`)
* 用户程序库：
    * 官方提供的 C 语言的动态链接库 （[github](https://github.com/libfuse/libfuse) 、[debian 包](https://packages.debian.org/buster/libfuse3-3)）。
    * 其他编程语言三方库，如 Go 语言的 [hanwen/go-fuse](https://github.com/hanwen/go-fuse)。

通讯架构如下：

![image](/image/FUSE_structure.png)

（图片来源： [wikipedia](https://en.wikipedia.org/wiki/Filesystem_in_Userspace)）

更多参见：

* [Filesystem in Userspace - wikipedia](https://en.wikipedia.org/wiki/Filesystem_in_Userspace)
* [FUSE — The Linux Kernel documentation](https://www.kernel.org/doc/html/next/filesystems/fuse.html)

## 库

### libfuse

fuse 官方提供的编程框架就是 C 语言的动态链接库 [libfuse](https://github.com/libfuse/libfuse)。

作为 gopher，本部分不多介绍。

### hanwen/go-fuse

目前主流的 go native 实现的 fuse 库有两个： [hanwen/go-fuse](https://github.com/hanwen/go-fuse) 和 [bazil/fuse](https://github.com/bazil/fuse)。2023 年 12 月这个时点看来，[hanwen/go-fuse](https://github.com/hanwen/go-fuse) 这个库各方面综合表现更好一些。

该库官方 go docs 说明和示例相当丰富，参见：[go docs](https://pkg.go.dev/github.com/hanwen/go-fuse/v2@v2.4.2)。

### 核心包

```go
package main

import (
	"github.com/hanwen/go-fuse/v2/fuse" // fuse 协议相关实现，启动 fuse deamon 的相关参数。
	"github.com/hanwen/go-fuse/v2/fs"   // 面向 fuse 文件系统开发者的编程接口。
)
```

### 主流程

```go

// fuse 文件系统的 rootInode 的实现，推荐的写法是内嵌一个 fs.Inode。
type HelloRoot struct {
	fs.Inode
}

func main() {
	// 创建文件系统的 rootInode 该实现必须 fs.InodeEmbedder。
	var rootInode fs.InodeEmbedder = &HelloRoot{}
	// 和 /dev/fuse 通讯。并挂载文件系统。
	// 默认会使用 /bin/fusermount 来进行挂载，官方文档说会更新 /etc/mtab，如果这个可执行文件不存在则报错。
	// 可通过 fs.Options.MountOptions.DirectMount 直接使用 syscall.Mount 挂载而不是 /bin/fusermount。
	server, err := fs.Mount("/mount/to/target/dir",  rootInode, &fs.Options{})
	if err != nil {
		log.Fatalf("Mount fail: %v\n", err)
	}

	// 等待退出信号
	c := make(chan os.Signal)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM) // nolint
	go func() {
		// 接受到信号后，取消挂载，server.Wait 会返回
		<-c
		server.Unmount()
	}()
	// 等待 server 退出
	server.Wait()
}
```

### 示例实现

* [内存文件系统](https://pkg.go.dev/github.com/hanwen/go-fuse/v2@v2.4.2/fs#example-package)： 只包含一个文件的文件系统（根目录是只读的，文件是可写的），具体内存文件的读写实现参见： `fs.MemRegularFile` 。
* [loopback 到另一目录的文件系统](https://pkg.go.dev/github.com/hanwen/go-fuse/v2@v2.4.2/fs#example-package-Mount)：具体实现参见 `fs.NewLoopbackRoot`。

## 实现

> 参考: [wiki](https://en.wikipedia.org/wiki/Filesystem_in_Userspace#Remote/distributed_file_system_clients)

* [s3fs](https://github.com/s3fs-fuse/s3fs-fuse)
* [JuiceFS](https://github.com/juicedata/juicefs)
* [sshfs](https://github.com/libfuse/sshfs)
* [fuse-overlayfs](https://github.com/containers/fuse-overlayfs)
* [ntfs-3g](https://github.com/tuxera/ntfs-3g)
* ...
