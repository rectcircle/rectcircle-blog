---
title: "Linux 动态链接库详解（二）版本管理"
date: 2024-08-26T02:06:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> 示例代码： [rectcircle/linux-dylib-demo](https://github.com/rectcircle/linux-dylib-demo/tree/master/03-symbolversion)

## 语义化版本

动态链接库作为可执行文件的依赖，必然带来版本管理的问题，因此对于动态链接库的版本管理的实现基本上是符合[“语义化版本规范”](https://semver.org/) （动态链接库的出现远早于“语义化版本”的概念，可以合理推测[“语义化版本规范”](https://semver.org/)是在动态链接库版本管理的基础上发展出来的）。

安装动态库的时候，我们会看到如下三种文件：

* `libxxx.so.x.y.z` 这里的 `x` 是主版本号，`y` 是次版本号，`z` 是发布号（修订号），业界约定规则如下：
    * 主版本号变更，表示库有的重大升级，不同主版本号的库之间是不兼容的，依赖于旧的主版本号的程序需要改动相应的部分，并且重新编译，才可以在新版的共享库中运行；或者，系统必须保留旧版的共享库，使得那些依赖于旧版共享库的程序能够正常运行。
    * 次版本号表示库的增量升级，即增加一些新的接口符号，且保持原来的符号不变。在主版本号相同的情况下，高的次版本号的库向后兼容低的次版本号的库。一个依赖于旧的次版本号共享库的程序，可以在新的次版本号共享库中运行，因为新版中保留了原来所有的接口，并且不改变它们的定义和含义。比如系统中有个共享库为 libfoo.so.1.2.x，后来在升级过程中添加了一个函数，版本号变成了 1.3.x 。因为 1.2.x 的所有接口都被保留到 1.3.x 中了，所以 那些依赖于 1.1.x 或 1.2.x 的程序都可以在 1.3.x 中正常运行而无需重新编译。
    * 布版本号表示库的一些错误的修正、性能的改进等，并不添加任何新的接口，也不对接口进行更改。相同主版本号、次版本号的共享库，不同的发布版本号之间完全兼容，依赖 于某个发布版本号的程序可以在任何一个其他发布版本号中正常运行，而无须做任何修改。

* `libxxx.so.x -> libxxx.so.x.y.z`， `libxxx.so.x` 详见下文 soname。
* `libxxx.so -> libxxx.so.x.y.z`，编译时依赖通过 `-lxxx` 指定查找的文件，详见上文说明。

下文将介绍 Linux 环境下，动态库版本管理的细节。

## SO-NAME

### 原理

根据上面的概念，可以看出对于主版本号不变的库是先后兼容的（使用旧版本库编译的可执行文件，可以和新版本的动态链接库一起工作而不会有问题）。

因此 Linux 通过 SO-NAME 机制来实现这一点：

* gcc 编译一个动态链接库时，可以通过指定 `-Wl,-soname` 参数指定一个库的 SO-NAME，这个 SO-NAME 会写入 `.so` 文件（elf 的 `.dynamic` 的 `DT_SONAME`，通过 `readelf -d` 查看）。如 `-Wl,-soname,libfoo.so.1 -o libfoo.1.0.0`，在 `libfoo.1.0.0` 将看到 `libfoo.so.1` 的符号。
* 安装一个库到系统指定的运行时查找路径时，安装脚本会调用 `ldconfig` 会扫描具体版本的动态库文件，查找 SO-NAME 符号，生成或更新一个名为 SO-NAME 符号值的软链指向该文件。如扫描 `libfoo.so.1.0.0` 将生成 `libfoo.so.1 -> libfoo.so.1.0.0` 的软链。
* gcc 编译一个可执行文件时，使用 `-L` 和 `-l` 指定依赖一个动态库时，如果该动态库包含 SO-NAME 符号，会将 SO-NAME 作为该动态库的运行时查找库的名字，而非文件名。如： `gcc ... -L ... -l foo` 在构建（链接阶段）时，解析到 `libfoo.so` 文件包含 SO-NAME 为 `libfoo.so.1` 则在执行文件中使用 `libfoo.so.1` 作为运行时查找的名字而非 `libfoo.so`。
* 执行可执行文件时，会按照运行时查找规则查找名字为 SO-NAME 的动态链接库文件进行查找。如上例中，查找的是 `libfoo.so.1` 而非 `libfoo.so`。

### 示例

#### 头文件

lib 头文件 `02-soname/include/foo.h`

```h
#ifndef _FOO_H
#define _FOO_H 1
void print_foo();
void print_foo1_1();
#endif
```

#### 编译动态链接库

libfoo 的 1.0.0 版本源文件 `02-soname/1.0.0/foo.c`

```c
#include <stdio.h>

void print_foo(){
    printf("libfoo1.0.0\n");
}
```

libfoo 的 1.0.0 版本编译脚本 `02-soname/1.0.0/build-lib.sh`

```bash
#!/usr/bin/env bash

cd $(dirname $(readlink -f $0))
cd ../
mkdir -p build/lib
rm -rf build/include

cp -rf ./include ./build
gcc -Wl,-soname,libfoo.so.1 -I ./build/include -shared -fPIC -o ./build/lib/libfoo.so.1.0.0 ./1.0.0/foo.c
echo '--- 查看 so 符号'
readelf -d ./build/lib/libfoo.so.1.0.0 | grep .so
```

输出如下：

```
--- 查看 so 符号
 0x0000000000000001 (NEEDED)             共享库：[libc.so.6]
 0x000000000000000e (SONAME)             Library soname: [libfoo.so.1]
```

libfoo 的 1.1.0 版本源文件 `02-soname/1.1.0/foo.c`

```c
#include <stdio.h>


void print_foo1_1(){
    printf("libfoo1.1.0\n");
}


void print_foo(){
    print_foo1_1();
}
```

libfoo 的 1.1.0 版本编译脚本 `02-soname/1.1.0/build-lib.sh`

```bash
#!/usr/bin/env bash

cd $(dirname $(readlink -f $0))
cd ../
mkdir -p build/lib
rm -rf build/include

cp -rf ./include ./build
gcc -Wl,-soname,libfoo.so.1 -I ./build/include -shared -fPIC -o ./build/lib/libfoo.so.1.1.0 ./1.1.0/foo.c
echo '--- 查看 so 符号'
readelf -d ./build/lib/libfoo.so.1.1.0 | grep .so
```

输出如下：

```
--- 查看 so 符号
 0x0000000000000001 (NEEDED)             共享库：[libc.so.6]
 0x000000000000000e (SONAME)             Library soname: [libfoo.so.1]
```

#### 编译运行可执行文件

依赖 `1.0.0` 的可执行文件的源文件 `02-soname/main1_0.c`

```c
#include <foo.h>

int main() {
    print_foo();
    return 0;
}
```

编译 `1.0.0` 的可执行文件的编译脚本 `02-soname/use-lib1_0.sh`

```bash
#!/usr/bin/env bash

cd $(dirname $(readlink -f $0))
mkdir -p build/bin


echo '=== 步骤 1: 使用 1.0.0 版本编译'
echo '--- 创建软链 ./build/lib/libfoo.so -> libfoo.so.1.0.0'
rm -rf ./build/lib/libfoo.so ./build/lib/libfoo.so.1
ln -s libfoo.so.1.0.0 ./build/lib/libfoo.so
gcc -I ./build/include -o ./build/bin/main1_0 ./main1_0.c -L ./build/lib -l foo
echo '--- ldd 输出'
ldd ./build/bin/main1_0
echo '--- readelf -d 输出'
readelf -d ./build/bin/main1_0 | grep .so
echo


echo '=== 步骤 2: 运行'
echo '--- 直接运行'
./build/bin/main1_0

echo '--- 指定 LD_LIBRARY_PATH 只包含 libfoo.so -> libfoo.so.1.0.0'
rm -rf ./build/lib/libfoo.so ./build/lib/libfoo.so.1
ln -s libfoo.so.1.0.0 ./build/lib/libfoo.so
LD_LIBRARY_PATH=./build/lib ./build/bin/main1_0

echo '--- 指定 LD_LIBRARY_PATH 只包含 libfoo.so.1 -> libfoo.so.1.0.0'
rm -rf ./build/lib/libfoo.so ./build/lib/libfoo.so.1
ln -s libfoo.so.1.0.0 ./build/lib/libfoo.so.1
LD_LIBRARY_PATH=./build/lib ./build/bin/main1_0

echo '--- 指定 LD_LIBRARY_PATH 只包含 libfoo.so.1 -> libfoo.so.1.1.0'
rm -rf ./build/lib/libfoo.so ./build/lib/libfoo.so.1
ln -s libfoo.so.1.1.0 ./build/lib/libfoo.so.1
LD_LIBRARY_PATH=./build/lib ./build/bin/main1_0
echo


echo '=== 步骤 3: 使用 1.1.0 版本编译'
echo '--- 创建软链 ./build/lib/libfoo.so -> libfoo.so.1.1.0'
rm -rf ./build/lib/libfoo.so ./build/lib/libfoo.so.1
ln -s libfoo.so.1.1.0 ./build/lib/libfoo.so
gcc -I ./build/include -o ./build/bin/main1_0 ./main1_0.c -L ./build/lib -l foo
echo '--- ldd 输出'
ldd ./build/bin/main1_0
echo '--- readelf -d 输出'
readelf -d ./build/bin/main1_0 | grep .so
echo

echo '=== 步骤 4: 运行'
echo '--- 直接运行'
./build/bin/main1_0

echo '--- 指定 LD_LIBRARY_PATH 只包含 libfoo.so -> libfoo.so.1.0.0'
rm -rf ./build/lib/libfoo.so ./build/lib/libfoo.so.1
ln -s libfoo.so.1.0.0 ./build/lib/libfoo.so
LD_LIBRARY_PATH=./build/lib ./build/bin/main1_0

echo '--- 指定 LD_LIBRARY_PATH 只包含 libfoo.so.1 -> libfoo.so.1.0.0'
rm -rf ./build/lib/libfoo.so ./build/lib/libfoo.so.1
ln -s libfoo.so.1.0.0 ./build/lib/libfoo.so.1
LD_LIBRARY_PATH=./build/lib ./build/bin/main1_0

echo '--- 指定 LD_LIBRARY_PATH 只包含 libfoo.so.1 -> libfoo.so.1.1.0'
rm -rf ./build/lib/libfoo.so ./build/lib/libfoo.so.1
ln -s libfoo.so.1.1.0 ./build/lib/libfoo.so.1
LD_LIBRARY_PATH=./build/lib ./build/bin/main1_0
```

输出如下：

```
=== 步骤 1: 使用 1.0.0 版本编译
--- 创建软链 ./build/lib/libfoo.so -> libfoo.so.1.0.0
--- ldd 输出
        linux-vdso.so.1 (0x00007fff3a1f7000)
        libfoo.so.1 => not found
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f3e66d38000)
        /lib64/ld-linux-x86-64.so.2 (0x00007f3e66f26000)
--- readelf -d 输出
 0x0000000000000001 (NEEDED)             共享库：[libfoo.so.1]
 0x0000000000000001 (NEEDED)             共享库：[libc.so.6]

=== 步骤 2: 运行
--- 直接运行
./build/bin/main1_0: error while loading shared libraries: libfoo.so.1: cannot open shared object file: No such file or directory
--- 指定 LD_LIBRARY_PATH 只包含 libfoo.so -> libfoo.so.1.0.0
./build/bin/main1_0: error while loading shared libraries: libfoo.so.1: cannot open shared object file: No such file or directory
--- 指定 LD_LIBRARY_PATH 只包含 libfoo.so.1 -> libfoo.so.1.0.0
libfoo1.0.0
--- 指定 LD_LIBRARY_PATH 只包含 libfoo.so.1 -> libfoo.so.1.1.0
libfoo1.1.0

=== 步骤 3: 使用 1.1.0 版本编译
--- 创建软链 ./build/lib/libfoo.so -> libfoo.so.1.1.0
--- ldd 输出
        linux-vdso.so.1 (0x00007ffe1599b000)
        libfoo.so.1 => not found
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f865d698000)
        /lib64/ld-linux-x86-64.so.2 (0x00007f865d886000)
--- readelf -d 输出
 0x0000000000000001 (NEEDED)             共享库：[libfoo.so.1]
 0x0000000000000001 (NEEDED)             共享库：[libc.so.6]

=== 步骤 4: 运行
--- 直接运行
./build/bin/main1_0: error while loading shared libraries: libfoo.so.1: cannot open shared object file: No such file or directory
--- 指定 LD_LIBRARY_PATH 只包含 libfoo.so -> libfoo.so.1.0.0
./build/bin/main1_0: error while loading shared libraries: libfoo.so.1: cannot open shared object file: No such file or directory
--- 指定 LD_LIBRARY_PATH 只包含 libfoo.so.1 -> libfoo.so.1.0.0
libfoo1.0.0
--- 指定 LD_LIBRARY_PATH 只包含 libfoo.so.1 -> libfoo.so.1.1.0
libfoo1.1.0
```

依赖 `1.1.0` 的可执行文件的源文件 `02-soname/main1_1.c`

```c
#include <foo.h>
#include <stdio.h>

int main() {
    printf("Hello from main1_1.c\n");
    print_foo1_1();
    return 0;
}
```

编译 `1.1.0` 的可执行文件的编译脚本 `02-soname/use-lib1_1.sh`

```bash
#!/usr/bin/env bash

cd $(dirname $(readlink -f $0))
mkdir -p build/bin


echo '=== 步骤 1: 使用 1.0.0 版本编译'
echo '--- 创建软链 ./build/lib/libfoo.so -> libfoo.so.1.0.0'
rm -rf ./build/lib/libfoo.so ./build/lib/libfoo.so.1
ln -s libfoo.so.1.0.0 ./build/lib/libfoo.so
gcc -I ./build/include -o ./build/bin/main1_1 ./main1_1.c -L ./build/lib -l foo
echo


echo '=== 步骤 2: 使用 1.1.0 版本编译'
echo '--- 创建软链 ./build/lib/libfoo.so -> libfoo.so.1.1.0'
rm -rf ./build/lib/libfoo.so ./build/lib/libfoo.so.1
ln -s libfoo.so.1.1.0 ./build/lib/libfoo.so
gcc -I ./build/include -o ./build/bin/main1_1 ./main1_1.c -L ./build/lib -l foo
echo '--- ldd 输出'
ldd ./build/bin/main1_1
echo '--- readelf -d 输出'
readelf -d ./build/bin/main1_1 | grep .so
echo


echo '=== 步骤 3: 运行'
echo '--- 直接运行'
./build/bin/main1_1

echo '--- 指定 LD_LIBRARY_PATH 只包含 libfoo.so.1 -> libfoo.so.1.0.0'
rm -rf ./build/lib/libfoo.so ./build/lib/libfoo.so.1
ln -s libfoo.so.1.0.0 ./build/lib/libfoo.so.1
LD_LIBRARY_PATH=./build/lib ./build/bin/main1_1

echo '--- 指定 LD_LIBRARY_PATH 只包含 libfoo.so.1 -> libfoo.so.1.1.0'
rm -rf ./build/lib/libfoo.so ./build/lib/libfoo.so.1
ln -s libfoo.so.1.1.0 ./build/lib/libfoo.so.1
LD_LIBRARY_PATH=./build/lib ./build/bin/main1_1
```

输出如下：

```
=== 步骤 1: 使用 1.0.0 版本编译
--- 创建软链 ./build/lib/libfoo.so -> libfoo.so.1.0.0
/usr/bin/ld: /tmp/ccDIoZpM.o: in function `main':
main1_1.c:(.text+0x19): undefined reference to `print_foo1_1'
collect2: error: ld returned 1 exit status

=== 步骤 2: 使用 1.1.0 版本编译
--- 创建软链 ./build/lib/libfoo.so -> libfoo.so.1.1.0
--- ldd 输出
        linux-vdso.so.1 (0x00007fffba884000)
        libfoo.so.1 => not found
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007feb5820f000)
        /lib64/ld-linux-x86-64.so.2 (0x00007feb583fd000)
--- readelf -d 输出
 0x0000000000000001 (NEEDED)             共享库：[libfoo.so.1]
 0x0000000000000001 (NEEDED)             共享库：[libc.so.6]

=== 步骤 3: 运行
--- 直接运行
./build/bin/main1_1: error while loading shared libraries: libfoo.so.1: cannot open shared object file: No such file or directory
--- 指定 LD_LIBRARY_PATH 只包含 libfoo.so.1 -> libfoo.so.1.0.0
Hello from main1_1.c
./build/bin/main1_1: symbol lookup error: ./build/bin/main1_1: undefined symbol: print_foo1_1
--- 指定 LD_LIBRARY_PATH 只包含 libfoo.so.1 -> libfoo.so.1.1.0
Hello from main1_1.c
libfoo1.1.0
```

#### 结论

* 只依赖 1.0.0 版本库中符号的可执行文件源码。

    |               | 能否编译成功 | 使用 1.0.0 运行 | 使用 1.1.0 运行 |
    |---------------|---------------|---------------|---------------|
    | 使用 1.0.0 编译 |  ✅           |       ✅     |       ✅     |
    | 使用 1.1.0 编译 |  ✅           |      ✅      |       ✅     |

* 依赖了只在 1.1.0 有而 1.0.0 中没有的符号的库的可执行文件源码。

    |               | 能否编译成功 | 使用 1.0.0 运行 | 使用 1.1.0 运行 |
    |---------------|---------------|---------------|---------------|
    | 使用 1.0.0 编译 |  ❌           |  -            |  -          |
    | 使用 1.1.0 编译 |  ✅           | ❌ (**运行时**报错) |   ✅         |

### 问题

可以看出，在有了 SO-NAME 机制的情况下：

* 如果可执行文件依赖了某个库，那么后续，该库的次版本号的升级将不会破坏任何东西。
* 但是如果可执行文件依赖了较新的次版本库中符号，那么后续，在运行时，如果不小心使用了同一个主版本号的较旧的次版本号，那么操作系统将不会拒绝这个程序的运行，而是运行到调用时才能发现这个符号不存，在运行时直接崩溃。要解决这个问题有如下几个办法：
    * 库使用者：始终更新库到当前主版本号的最新的次版本。
    * 库开发者：使用 Linux 提供的符号版本机制，将报错提前到加载这个程序的阶段，详见下文。

## 符号版本

### ld version scripts

正如上文介绍的， SO-NAME 实现了可执行文件依赖某个主版本号的库，如果该库的主版本号不匹配则将在程序加载阶段报错。

但是，版本管理对于次版本的规定：只保证向后兼容（使用旧版本的库编译，可以在新版本的库运行），不保证向前兼容（不保证使用新版本的库编译，使用旧版本的库可以运行）。而只有 SO-NAME 情况下，在使用新版本的库编译，运行时使用旧版本的库的情况下，操作系统无法再程序加载阶段报错，而是在运行依赖这个符号时直接崩溃。

为了解决这个问题，Linux 提供了 ld version scripts 语法，可以通过编写一个脚本，这个脚本声明版本，每个版本中包含了在这个版本引入的符号。然后：

* 在使用 gcc 编译库时，通过 `-Wl,--version-script,xxx.map` 指定这个脚本，如下信息将编译到库中：
    * 每个符号版本，如 `print_bar_d@@BAR_1.1`（在 elf 的 `.dynsym` 段，通过 `readelf --dyn-syms` 查看）。
    * 声明的所有版本，如 `BAR_1.1`、`BAR_1.0`（在 elf 的 `.gnu.version_d` 段，通过 `readelf --version-info` 查看）。
* 在使用 gcc 构建（链接阶段）可执行文件时，收集调用该库中所有符号的版本列表，去重编译到库中，如，仅调用了 `print_bar_d` 函数，则将获取到依赖的版本列表为 `BAR_1.1`（在 elf 的 `.gnu.version_r` 段，通过 `readelf --version-info` 查看）。
* 在运行该可执行文件的加载阶段，会使用可执行文件中的 `.gnu.version_r` 和库中的 `.gnu.version_d`，进行匹配，如果发现找不到的符号，则直接加载失败。

示例如下：

1.0.0 版本的 `libbar.map` 如下（`...` 为省略）：

```
BAR_1.0 {
    ...
};

BARprivate {
    ...
};
```

1.1.0 版本的 `libbar.map` 如下（`...` 为省略）：

```
BAR_1.0 {
    ...
};

BARprivate {
    ...
};

BAR_1.1 {
    global:
    print_bar_d;
} BAR_1.0;
```

编译 `main_d.c` 使用了 1.1.0 版本的库，运行时使用 1.0.0 的库时将报错：

```
./build/bin/main_d: ./build/lib/libbar.so.1: version `BAR_1.1' not found (required by ./build/bin/main_d)
```

因此：依赖了只在 1.1.0 有而 1.0.0 中没有的符号的库的可执行文件源码。

|               | 能否编译成功 | 使用 1.0.0 运行 | 使用 1.1.0 运行 |
|---------------|---------------|---------------|---------------|
| 使用 1.0.0 编译 |  ❌           |  -            |  -          |
| 使用 1.1.0 编译 |  ✅           | ❌ (**加载时**报错) |   ✅         |

从而解决了该问题。

这里简单介绍一下 ld version scripts 的语法：

* 有多个 `NAME_X.Y {};` 或 `NAMEprivate {};` 块组成，声明多个版本，其中 `NAMEprivate` 表示这些符号时私有的，不保证未来是否会被删除，外部不应该依赖。
* 对于新的版本一般要继承上一个版本如 `BAR_1.1 {} BAR_1.0;`，表示 `BAR_1.1` 继承了 `BAR_1.0` 中的所有符号。
* 每个版本块 `{}` 内可以声明导出的符号：
    * `global:` 表示导出的全局符号列表。
    * `local:` 表述局部符号。
    * `:` 后面用来声明符号，每个符号使用 `;` 结尾。
    * 可以使用 `*` 通配符声明表示所有的符号。

### 符号重载

假设一个库函数 `print_bar_b` 在 1.0.0 版本有一个实现，但是 1.1.0 版本，库开发者想改变这个函数的语义，导致不兼容，按照语义化版本，这种场景需要升级大版本好到 2.0.0，但是如果仅仅为了这个小小的改动就升级大版本，有点小题大做。因此希望能做如下场景：

* 在 1.0.0 版本的库中，存在一个实现 `print_bar_b`。
* 在 1.1.0 版本的库中，存在一个新的实现 `__print_bar_b_1_1`，同时 1.0.0 的实现 `print_bar_b` 变为 `__print_bar_b_1_0` 仍然存在。
* 可执行文件调用了 `print_bar_b` 函数。
* 可执行文件是使用 1.0.0 版本的库编译的，在运行时：
    * 使用的 1.0.0 版本的库时，实际调用的是 `print_bar_b`。
    * 使用的 1.1.0 版本的库时，实际调用的是 `__print_bar_b_1_0` （即 1.0.0 的实现）。
* 可执行文件是使用 1.1.0 版本的库编译的，在运行时：
    * 使用的 1.0.0 版本的库时，将报错，因为没有 1.1.0 的实现。
    * 使用的 1.1.0 版本的库时，将调用 `__print_bar_b_1_1` （即 1.1.0 的实现）。

能实现如上场景的机制被称为符号多版本重载， Linux 通过 `asm` 指定实现了该机制，示例如下：

* 在使用该特性的情况下，必须要声明 ld version scripts，如下（`...` 为省略）：

    ```
    BAR_1.0 {
        global:
        ...
        print_bar_b;
        ...
    };

    BARprivate {
        global:
        ...
        __print_bar_b_1_0;
        __print_bar_b_1_1;
        ...
    };
    ...
    ```

* 在 1.0.0 版本的库中，相关代码如下：

    ```c
    void print_bar_b() {
        printf("libbar1.0.0 b\n");
    }
    ```

    * 完成编译后，通过 `readelf --dyn-syms` 查看，可以看到 `print_bar_b@@BAR_1.0`。

* 在 1.1.0 版本的库中，相关代码如下：

    ```c
    asm(".symver __print_bar_b_1_0,print_bar_b@BAR_1.0");
    void __print_bar_b_1_0() {
        printf("libbar1.0.0 b\n");
    }

    asm(".symver __print_bar_b_1_1,print_bar_b@@BAR_1.1");
    void __print_bar_b_1_1() {
        printf("libbar1.0.0 b\n");
    }
    ```

    * 完成编译后，通过 `readelf --dyn-syms` 查看，可以看到 `print_bar_b@@BAR_1.1` 和 `print_bar_b@BAR_1.0`。
    * `asm(".symver 实现的符号名,导出的符号名@版本号")` 导出一个带版本的符号，指向某个实现。
    * 上述的 `@@` 表示该导出符号的默认的实现，在编译时将使用该版本（编译到可执行文件中，可通过 `readelf --dyn-syms` 查看）。

### 示例代码

详见： [rectcircle/linux-dylib-demo/03-symbolversion](https://github.com/rectcircle/linux-dylib-demo/tree/master/03-symbolversion)

## glibc 情况

glibc 主要使用了上述符号版本机制，如果遇到可执行文件报各种关于 glibc 的错误，通过了解上述机制，应该可以快速的解决问题。

* [glibc 的 ld version scripts 示例](https://github.com/bminor/glibc/blob/master/string/Versions) 。

## 优缺点和使用场景

动态链接库的本质是对通用逻辑的复用。因此，动态链接库有如下优点：

* 节省磁盘和内存资源：将可以复用的代码编译成动态链接库，那么这些代码在一台设备中的磁盘中只需要保存一份，在运行时只需要将这些代码加载一份到内存中，从而节省磁盘和内存资源。
* 可执行文件和库的发布解耦：如果采用静态编译的方式，当库存在问题需要更新时，需要通知所有可执行文件开发者重新编译可执行文件。而采用动态链接库的方式，库开发者只需在满足兼容性的条件下，更新库即可，而无需通知可执行文件开发者。

基于以上优势，动态链接库主要的应用场景如下：

* 操作系统系统调用封装的函数库：如 libc 库的 POSIX 部分。
* 通用函数库：如 openssl、libz 等。

软件工程没有银弹，所有技术都是有代价的，动态链接库也存在很多问题：

* 隐式依赖： 一个可执行文件的能否运行隐式的依赖了某些动态链接库，这带来了运行环境搭建的成本。
* 依赖地狱（Dependency Hell）： 不同的应用程序可能需要同一个库的不同版本，某些极端场景无法协调这些版本，可能造成：
    * 某些可执行文件只能安装旧版本的而无法升级。
    * 需要维护多个版本的动态库，运行环境的维护会变得异常复杂。
* 故障半径大： 为某个可执行文件升级动态链接库可能导致其他可执行文件的崩溃。

为了解决如上问题，业界又引入很多复杂的技术，如：

* 容器化： 将可执行文件和其依赖的动态链接库打包到镜像中，将依赖固化下来，实现可重现的运行。
* Nix： 采用可寻址的包管理机制，支持一个操作系统系统中安装多个版本的动态链接库而互不干扰，可通过声明式的方式安装各个版本的包。

## 参考

* [《程序员的自我修养--链接、装载与库：第八章》](https://book.douban.com/subject/3652388/)
* [LD Version Scripts 官方文档](https://www.gnu.org/software/gnulib/manual/html_node/LD-Version-Scripts.html)
* [博客： 符号别名，编译指定版本，链接指定版本](https://blog.csdn.net/rubikchen/article/details/130218838)。
* [共享库及符号的版本控制实践](https://github.com/chenpengcong/blog/issues/16)
