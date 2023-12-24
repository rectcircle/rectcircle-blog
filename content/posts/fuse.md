---
title: "用户态文件系统 fuse"
date: 2023-12-09T20:25:00+08:00
draft: true
toc: true
comments: true
tags:
  - linux
---

## 简述

* POSIX 文件系统
* Linux VFS https://www.kernel.org/doc/html/next/filesystems/vfs.html
    * https://www.cnblogs.com/LuoboLiam/p/14321773.html
    * https://elixir.bootlin.com/linux/v5.7-rc4/source/include/linux/fs.h#L633
    * https://bean-li.github.io/vfs-inode-dentry/
    * https://zhuanlan.zhihu.com/p/107247475
    * inode
    * dentry
* 内核 VFS
* Fuse 用户态文件系统

## 架构

## 库

### libfuse

https://github.com/libfuse/libfuse

### hanwen/go-fuse

https://pkg.go.dev/github.com/hanwen/go-fuse/v2@v2.4.2/fs

## 实现

> https://en.wikipedia.org/wiki/Filesystem_in_Userspace#Remote/distributed_file_system_clients

* s3fs
* JuiceFS
* sshfs
* fuse-overlayfs
* ntfs-3g
