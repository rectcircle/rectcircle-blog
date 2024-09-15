---
title: "Linux 动态链接库详解（五） C/C++ 语言"
date: 2024-09-14T11:11:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 前言

前文关于动态库的介绍都是基于 C / C++ 编程语言直接使用 gcc 或者 makefile 进行构建的。

这里介绍一下一些其他常见构建工具对动态库的处理情况。

## pkg-config

真实的 C/C++ 项目的动态库依赖是十分复杂的，在调用 gcc 或编写 makefile 时，手动指定 `-L` 和 `-l` 是很比较麻烦的。

pkg-config 就可以解决这个问题，其通过 `.pc` 格式的文件能自动生成 `-L` 和 `-l` 参数。

一般的使用流程如下：

* 库开发者：发布库时会提供一个 `.pc` 文件，这个文件中包含了库的元信息（开源届主流的 C/C++ 库，如 [libcurl](https://github.com/curl/curl/blob/master/libcurl.pc.in)、[zlib](https://github.com/madler/zlib/blob/develop/zlib.pc.in)、[libevent](https://github.com/libevent/libevent/blob/master/libevent.pc.in) 等都有）。
* 项目开发者：使用 `pkg-config --cflags --libs xxx` 命令，生成 gcc 的 `-L` 或 `-l` 参数（可以与 gcc、makefile 或 Autotools、CMake 等集成）。例如：

    ```bash
    gcc -o example example.c $(pkg-config --cflags --libs gtk+-3.0)
    ```

* 项目使用者：使用包管理工具将项目发型的包、依赖的库都安装到系统中，按照上篇文章介绍的运行时查找方式来查找动态库。

## 主流的构建工具

真实的 C/C++ 项目，不会手动使用 gcc 或 makefile 来构建项目，而是使用一些项目管理工具/构建工具，如：

* CMake
* Autotools
* Ninja
* Meson
* Bazel

这些项目最终也是使用 pkg-config 或者配置 `-L`、 `-l` 来管理动态链接库的，在此次不多赘述。
