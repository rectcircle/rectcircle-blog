---
title: "Linux 动态链接库详解（四） 各编程语言情况"
date: 2024-08-01T11:00:00+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## Python

## Rust

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
