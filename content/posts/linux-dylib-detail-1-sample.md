---
title: "Linux 动态链接库详解（一）简单示例"
date: 2024-08-26T02:00:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> 示例代码： [rectcircle/linux-dylib-demo](https://github.com/rectcircle/linux-dylib-demo/tree/master/03-symbolversion)

## 构建库

lib 头文件 `01-sample/include/sample.h`

```h
#ifndef _SAMPLE_H
#define _SAMPLE_H 1
void print_hello();
#endif
```

lib 源代码 `01-sample/sample.c`

```c
#include <stdio.h>

void print_hello(){
    printf("Hello World!\n");
}
```

lib 构建脚本 `01-sample/01-build-lib.sh`

```bash
#!/usr/bin/env bash

cd $(dirname $(readlink -f $0))
rm -rf build/lib && mkdir -p build/lib
rm -rf build/include

cp -rf ./include ./build
gcc -I ./build/include -shared -fPIC -o ./build/lib/libsample.so.1.0.0 ./sample.c
ln -s libsample.so.1.0.0 ./build/lib/libsample.so
echo '--- 查看 build/lib 目录'
ls -al ./build/lib
echo '--- 查看 so 符号'
readelf -d ./build/lib/libsample.so.1.0.0 | grep .so
```

输出如下：

```
--- 查看 build/lib 目录
libsample.so -> libsample.so.1.0.0
libsample.so.1.0.0
--- 查看 so 符号
 0x0000000000000001 (NEEDED)             共享库：[libc.so.6]
```

## 使用库

可执行文件源代码 `01-sample/main.c`

```c
#include <sample.h>

int main(){
    print_hello();
    return 0;
}
```

编译运行可执行文件的脚本 `01-sample/02-use-lib.sh`

```bash
#!/usr/bin/env bash

cd $(dirname $(readlink -f $0))
rm -rf build/bin && mkdir -p build/bin


echo '=== 方式 1: 直接指定 so (绝对路径)'
# 写法 1.1: 一步完成
gcc -I ./build/include -o ./build/bin/main ./main.c ./build/lib/libsample.so
echo '--- ldd 输出'
ldd ./build/bin/main
echo '--- readelf -d 输出'
readelf -d ./build/bin/main | grep .so
./build/bin/main
# 写法 1.2: 分步骤编译
gcc -c -I ./build/include -o ./build/main.o ./main.c
gcc -o ./build/bin/main ./build/main.o ./build/lib/libsample.so
# ldd ./build/bin/main
# ./build/bin/main
echo

echo '=== 方式 2: 使用 -L 和 -l 指定动态库'
gcc -I ./build/include -o ./build/bin/main ./main.c -L ./build/lib -l sample
echo '--- ldd 输出'
ldd ./build/bin/main
echo '--- 指定 LD_LIBRARY_PATH ldd 输出'
LD_LIBRARY_PATH=./build/lib ldd ./build/bin/main
echo '--- readelf -d 输出'
readelf -d ./build/bin/main | grep .so
echo '--- 直接执行'
./build/bin/main
echo '--- 指定 LD_LIBRARY_PATH 执行'
LD_LIBRARY_PATH=./build/lib ./build/bin/main
echo


# 写法 3: 使用 -rpath 将动态库绝对路径写入链接器
echo '=== 方式 3: 使用 -L 和 -l 指定动态库，使用 -Wl,-rpath 配置运行时查找路径。'
gcc -I ./build/include -o ./build/bin/main ./main.c -L ./build/lib -l sample -Wl,-rpath,./build/lib
echo '--- ldd 输出'
ldd ./build/bin/main
echo '--- cd 到 build 目录 ldd 输出'
cd build && ldd ./bin/main
echo '--- cd 到 build 目录，指定 LD_LIBRARY_PATH 后 ldd 输出'
LD_LIBRARY_PATH=./lib ldd ./bin/main
cd ../
echo

echo '=== 有问题的写法: so 在 main.o 或 main.c 前面'
gcc -I ./build/include -o ./build/bin/main ./build/lib/libsample.so ./main.c
gcc -I ./build/include -L ./build/lib -lsample -o ./build/bin/main ./main.c
echo
```

输出如下：

```
=== 方式 1: 直接指定 so (绝对路径)
--- ldd 输出
        linux-vdso.so.1 (0x00007ffecf4f7000)
        ./build/lib/libsample.so (0x00007f61a64be000)
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f61a62d7000)
        /lib64/ld-linux-x86-64.so.2 (0x00007f61a64ca000)
--- readelf -d 输出
 0x0000000000000001 (NEEDED)             共享库：[./build/lib/libsample.so]
 0x0000000000000001 (NEEDED)             共享库：[libc.so.6]
Hello World!

=== 方式 2: 使用 -L 和 -l 指定动态库
--- ldd 输出
        linux-vdso.so.1 (0x00007fff9e7ad000)
        libsample.so => not found
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f4c7adee000)
        /lib64/ld-linux-x86-64.so.2 (0x00007f4c7afdc000)
--- readelf -d 输出
 0x0000000000000001 (NEEDED)             共享库：[libsample.so]
 0x0000000000000001 (NEEDED)             共享库：[libc.so.6]
--- 直接执行
./build/bin/main: error while loading shared libraries: libsample.so: cannot open shared object file: No such file or directory
--- 指定 LD_LIBRARY_PATH 执行
Hello World!

=== 有问题的写法: so 在 main.o 或 main.c 前面
/usr/bin/ld: /tmp/cc9RC5kK.o: in function `main':
main.c:(.text+0xa): undefined reference to `print_hello'
collect2: error: ld returned 1 exit status
/usr/bin/ld: /tmp/ccAH6tZo.o: in function `main':
main.c:(.text+0xa): undefined reference to `print_hello'
collect2: error: ld returned 1 exit status
```

## 分析

* 使用 `gcc` 构建构建一个动态链接库时，和构建可执行文件不同点在于需添加如下两个参数：
    * `-shared` 生成动态链接库。
    * `-fPIC` 生成位置无关代码。
* 使用 `ldd` 命令可以查看某个可执行文件运行过程查找的动态链接库的路径，可用于定位运行时动态链接库查找问题。
* 使用 `gcc` 构建一个可执行文件要依赖一个动态链接库时，有如下几种写法说明如下：

    | 方式  | 编译命令 | 运行时库查找说明 | ldd 输出 |
    |-------|--------|----------------|--------|
    | 方式 1 （不推荐） | `gcc ... main.c ./build/lib/libsample.so` | 直接加载 `./build/lib/libsample.so` 找不到立即报错 | `./build/lib/libsample.so` |
    | 方式 2 （推荐） | `gcc ... main.c -L ./build/lib -l sample` | 按照运行时查找规则查找（详见后续文章） | <li>未指定 LD_LIBRARY_PATH 输出为： `libsample.so => not found`</li><li> 指定了正确的 `LD_LIBRARY_PATH` 输出为： `libsample.so => ./build/lib/libsample.so`</li> |
    | 方式 3 （推荐） | `gcc ... main.c -L ./build/lib -l sample -Wl,-rpath,./build/lib` | 先按照 `-rpath` 指定的路径查找，然后按照运行时查找规则查找 | <li>运行时所在路径和编译时一样时，输出为：`libsample.so => ./build/lib/libsample.so`。</li><li>运行时所在路径和编译时不一样时，输出为：`libsample.so => not found`。</li><li>指定了正确的 LD_LIBRARY_PATH 时，输出为：`libsample.so => ./lib/libsample.so`。</li>|

* `gcc` 的 `-L <search-dir>` 参数用于指定编译时动态链接库查找路径，详见后续文章。
* `gcc` 的 `-l <link-name>` 参数用于指定动态链接库的名称，在构建（链接阶段）过程中，会在编译时动态链接库路径中查找：`lib<link-name>.so` 文件。
* 在 gcc 命令参数的顺序是有意义的，-L -l -Wl 相关参数会按照顺序传递给链接器 ld。链接器按照命令行中列出的顺序处理输入文件。当链接器遇到一个文件，它会在当前文件中尝试解析以前的所有未定义的引用。然后它会继续处理下一个文件。如果一个符号在它第一次被引用之前没有被定义（例如，库被列在源文件之前），该符号将保持未定义状态。因此，**`-L`、 `-l`、 `-Wl`、 `xxx.so` 一定要在 `xxx.c` 参数的后面**
