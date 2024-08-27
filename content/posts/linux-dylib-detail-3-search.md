---
title: "Linux 动态链接库详解（三）动态库查找"
date: 2024-08-01T11:00:00+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

> 示例代码： [rectcircle/linux-dylib-demo](https://github.com/rectcircle/linux-dylib-demo/tree/master/03-symbolversion)

本篇将介绍在构建时（链接阶段）以及运行时的动态库的查找过程。

## 构建时查找

在构建过程中，动态库的查找发生在链接阶段，即由 gcc 或 clang 等命令间接调用 `ld` 命令进行链接时，搜索动态链接库。

使用 [gcc](https://gcc.gnu.org/onlinedocs/gcc/Environment-Variables.html#index-LIBRARY_005fPATH) 或 clang 构建依赖动态链接库的代码时，可以通过如下，如下方式设置额外的搜索路径：

* `LIBRARY_PATH` 环境变量（注意不是 `LD_LIBRARY_PATH`，`LD_LIBRARY_PATH` 不识别），多个以 `:` 分割。
* `-L` 命令行参数，可以配置多，如 `gcc ... -L /path/to/dir-a -L /path/to/dir-b`。

除了以上自定义的搜索路径外，还会搜索 linker script 配置的默认搜索路径，以 debian 11 为例，通过 `ld --verbose | grep SEARCH_DIR | tr -s ' ;' \\012` 可以查看，其值为：

* `/usr/local/lib/x86_64-linux-gnu`
* `/lib/x86_64-linux-gnu`
* `/usr/lib/x86_64-linux-gnu`
* `/usr/local/lib64`
* `/lib64`
* `/usr/lib64`
* `/usr/local/lib`
* `/lib`
* `/usr/lib`
* `/usr/x86_64-linux-gnu/lib64`
* `/usr/x86_64-linux-gnu/lib`

注意 `/etc/ld.so.conf` 配置的路径不会在构建（链接阶段）搜索（该配置文件影响运行阶段的搜索，详见下文）。

如上配置的搜索优先级顺序为：

* 命令行 `-L` 参数指定的路径（TODO）。
* 环境变量 `LIBRARY_PATH` 指定的路径（TODO）。
* 链接器 linker script 配置的默认搜索路径。

最后，在编译真实的项目时，一般使用 Makefile 来定义编译过程，Makefile 识别如下环境变量，可以用来配置自定义搜索路径：

* [`LDFLAGS`](https://www.gnu.org/software/make/manual/html_node/Implicit-Variables.html#index-LDFLAGS) 环境变量，可以用来配置 `-L` 参数。
* [`LDLIBS`](https://www.gnu.org/software/make/manual/html_node/Implicit-Variables.html#index-LDLIBS) 环境变量，可以用来配置 `-l` 参数。

验证如下：`01-sample/03-build-stage-search.sh`

```bash
#!/usr/bin/env bash

cd $(dirname $(readlink -f $0))
rm -rf build/bin && mkdir -p build/bin


echo '=== 方式 1: 找不到库情况'
gcc -I ./build/include -o ./build/bin/main ./main.c && echo '构建成功' || echo '构建失败'
echo

echo '=== 方式 2: 使用 LD_LIBRARY_PATH 指定查找路径'
LD_LIBRARY_PATH=./build/lib gcc -I ./build/include -o ./build/bin/main ./main.c -l sample && echo '构建成功' || echo '构建失败'
echo

echo '=== 方式 3: 使用 -L 指定查找路径'
gcc -I ./build/include -o ./build/bin/main ./main.c -L ./build/lib -l sample && echo '构建成功' || echo '构建失败'
echo

echo '=== 方式 4: 使用 LIBRARY_PATH 指定查找路径'
LIBRARY_PATH=./build/lib gcc -I ./build/include -o ./build/bin/main ./main.c -l sample && echo '构建成功' || echo '构建失败'
echo

echo '=== 方式 5: 使用 -L LIBRARY_PATH 指定错误的路径观察查找路径'
mkdir -p /tmp/by_LIBRARY_PATH /tmp/by_-l
LIBRARY_PATH=/tmp/by_LIBRARY_PATH gcc -I ./build/include -o ./build/bin/main ./main.c -L /tmp/by_-l -l sample -Wl,-verbose | grep sample && echo '构建成功' || echo '构建失败'
echo
```

输出如下：

```
TODO
```

## 运行时查找

在可执行文件执行过程中，动态库的查找发生在程序装载阶段，由操作系统内核调用 `ld.so` （`/lib64/ld-linux-x86-64.so.2`） 这个 so 内的代码实现。

默认情况下， `ld.so` 查找 `/etc/ld.so.conf` （引用了 `/etc/ld.so.conf.d/*.conf`） 配置的默认搜索路径，以 debian 11 为例，其默认值为：

* `/usr/local/lib`
* `/usr/local/lib/x86_64-linux-gnu`
* `/lib/x86_64-linux-gnu`
* `/usr/lib/x86_64-linux-gnu`

可以通过修改 `/etc/ld.so.conf` （并执行 `sudo ldconfig` 来更新缓存 `/etc/ld.so.cache`，通过 `ldconfig -p` 可查看发现的所有库文件） 配置文件来修改系统的运行动态库搜索路径。

除了上述方式外，还可以通过如下方式添加动态库搜索路径：

* `LD_LIBRARY_PATH` 环境变量。
* 在构建（链接阶段）时，通过 `-rpath` 参数指定动态库搜索路径（写入到了可执行文件 ELF `.dynamic` 段的 `DT_RPATH` 或 `DT_RUNPATH`，通过 `readelf -d` 可查询）。
* `LD_AUDIT` 环境变量指定一个 `xxx.so` 文件，可以使用 C 语言实现更加智能灵活的动态库搜索。

如上配置的搜索优先级顺序为：

* 可执行文件中 ELF `.dynamic` 段 `DT_RPATH` 或 `DT_RUNPATH` 指定的路径（TODO）。
* 环境变量 `LD_LIBRARY_PATH` 指定的路径（TODO）。
* `/etc/ld.so.conf` 配置的哪些。

验证如下：`01-sample/04-runtime-stage-search.sh`

```bash
# 
```

输出如下：

```
TODO
```
