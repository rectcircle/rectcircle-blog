---
title: "Linux 动态链接库详解（七） Python 语言"
date: 2024-09-17T01:16:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 概述

在 debian 12 中， 可通过 `apt install -y python3` 来安装 [Python3](https://packages.debian.org/bookworm/python3) （注意：安装后可以使用 `python3` 命令， python 命令不会导出）。

主要安装了如下目录和文件：

```
/usr/bin/
    python3 -> python3.11     # 软链 (python3-minimal)
    python3.11                # python 解释器 (python3.11-minimal)
/usr/lib/
    python3.11/               # python3 标准库 (libpython3.11-minimal)
        encodings/            # (libpython3.11-minimal)
        ssl.py                # (libpython3.11-minimal)
        random.py             # (libpython3.11-minimal)
        ...                   # (libpython3.11-minimal)
        json/                 # (libpython3.11-stdlib)
        ...                   # (libpython3.11-stdlib)
        lib-dynload/
            _hashlib.cpython-311-x86_64-linux-gnu.so   # (libpython3.11-minimal)
            _ssl.cpython-311-x86_64-linux-gnu.so       # (libpython3.11-minimal)
            ...
            _bz2.cpython-311-x86_64-linux-gnu.so       # (libpython3.11-stdlib)
            _json.cpython-311-x86_64-linux-gnu.so      # (libpython3.11-stdlib)
            ...
/lib/x86_64-linux-gnu/
    ld-linux-x86-64.so.2      # (libc6)
    libc.so.6                 # (libc6)
    libm.so.6                 # (libc6)
    ...                       # (libc6)
    libexpat.so.1             # XML 解析 C 库 - 运行时库 (libexpat1)
    libz.so.1                 # 压缩库 - 运行时 (zlib1g)
    libcrypto.so.3            # (libssl3)
    libssl.so.3               # (libssl3)
    # (libbz2-1.0)
    # (libcrypt1)
    # (libdb5.3)
    # (libffi8)
    # (liblzma5)
    # (libncursesw6)
    # (libnsl2)
    # (libreadline8)
    # (libsqlite3-0)
    # (libtinfo6)
    # (libtirpc3)
    # (libuuid1)
```

debian 12 上安装的 python 版本是 [cpython](https://github.com/python/cpython) 3.11，主要分为两个部分： 解释器 和 标准库。

本文将介绍 Python 的解释器和标准库的动态库情况以及第三方 python 包情况。

## python 解释器

验证脚本 `04-lang/03-python/01-python-interpreter.sh`

```bash
#!/usr/bin/env bash


echo '=== 观察 python 解释器情况'
echo '--- 使用 ldd 查看'
ldd $(which python3)
```

输出如下：

```
=== 观察 python 解释器情况
--- 使用 ldd 查看
        linux-vdso.so.1 (0x00007ffee66ab000)
        libm.so.6 => /lib/x86_64-linux-gnu/libm.so.6 (0x00007f451a3c4000)
        libz.so.1 => /lib/x86_64-linux-gnu/libz.so.1 (0x00007f451a3a5000)
        libexpat.so.1 => /lib/x86_64-linux-gnu/libexpat.so.1 (0x00007f451a37a000)
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f451a199000)
        /lib64/ld-linux-x86-64.so.2 (0x00007f451a4ab000)
```

可以得出如下结论，Python 解释本身动态库依赖如下：

* glibc 的 libc.so.6、libm.so.6。
* libexpat1 的 libexpat.so.1。
* zlib1g 的 libz.so.1。

## python 标准库

验证脚本 `04-lang/03-python/01-python-std.sh`

```bash
#!/usr/bin/env bash


echo '=== 观察 python 标准库情况'
python3 -c 'import os
pid = os.getpid()
print("--- 通过 /proc/%d/maps 查看动态库情况" % pid)
os.system("cat /proc/%d/maps | grep .so" % pid)
import ssl
import json
print("--- 导入 ssl 和 json 后 通过 /proc/%d/maps 查看动态库情况" % pid)
os.system("cat /proc/%d/maps | grep .so" % pid)
'
echo '---  通过 ldd 查看 _ssl.cpython-311-x86_64-linux-gnu.so 情况'
ldd /usr/lib/python3.11/lib-dynload/_ssl.cpython-311-x86_64-linux-gnu.so
```

输出如下：

```
=== 观察 python 标准库情况
--- 通过 /proc/2352681/maps 查看动态库情况
7f96e4fe2000-7f96e5008000 r--p 00000000 08:01 1740455                    /usr/lib/x86_64-linux-gnu/libc.so.6
7f96e5008000-7f96e515d000 r-xp 00026000 08:01 1740455                    /usr/lib/x86_64-linux-gnu/libc.so.6
7f96e515d000-7f96e51b0000 r--p 0017b000 08:01 1740455                    /usr/lib/x86_64-linux-gnu/libc.so.6
7f96e51b0000-7f96e51b4000 r--p 001ce000 08:01 1740455                    /usr/lib/x86_64-linux-gnu/libc.so.6
7f96e51b4000-7f96e51b6000 rw-p 001d2000 08:01 1740455                    /usr/lib/x86_64-linux-gnu/libc.so.6
7f96e51c3000-7f96e51c7000 r--p 00000000 08:01 1716378                    /usr/lib/x86_64-linux-gnu/libexpat.so.1.8.10
7f96e51c7000-7f96e51e3000 r-xp 00004000 08:01 1716378                    /usr/lib/x86_64-linux-gnu/libexpat.so.1.8.10
7f96e51e3000-7f96e51eb000 r--p 00020000 08:01 1716378                    /usr/lib/x86_64-linux-gnu/libexpat.so.1.8.10
7f96e51eb000-7f96e51ed000 r--p 00028000 08:01 1716378                    /usr/lib/x86_64-linux-gnu/libexpat.so.1.8.10
7f96e51ed000-7f96e51ee000 rw-p 0002a000 08:01 1716378                    /usr/lib/x86_64-linux-gnu/libexpat.so.1.8.10
7f96e51ee000-7f96e51f1000 r--p 00000000 08:01 1702832                    /usr/lib/x86_64-linux-gnu/libz.so.1.2.13
7f96e51f1000-7f96e5204000 r-xp 00003000 08:01 1702832                    /usr/lib/x86_64-linux-gnu/libz.so.1.2.13
7f96e5204000-7f96e520b000 r--p 00016000 08:01 1702832                    /usr/lib/x86_64-linux-gnu/libz.so.1.2.13
7f96e520b000-7f96e520c000 r--p 0001c000 08:01 1702832                    /usr/lib/x86_64-linux-gnu/libz.so.1.2.13
7f96e520c000-7f96e520d000 rw-p 0001d000 08:01 1702832                    /usr/lib/x86_64-linux-gnu/libz.so.1.2.13
7f96e520d000-7f96e521d000 r--p 00000000 08:01 1740458                    /usr/lib/x86_64-linux-gnu/libm.so.6
7f96e521d000-7f96e5290000 r-xp 00010000 08:01 1740458                    /usr/lib/x86_64-linux-gnu/libm.so.6
7f96e5290000-7f96e52ea000 r--p 00083000 08:01 1740458                    /usr/lib/x86_64-linux-gnu/libm.so.6
7f96e52ea000-7f96e52eb000 r--p 000dc000 08:01 1740458                    /usr/lib/x86_64-linux-gnu/libm.so.6
7f96e52eb000-7f96e52ec000 rw-p 000dd000 08:01 1740458                    /usr/lib/x86_64-linux-gnu/libm.so.6
7f96e52f4000-7f96e52f5000 r--p 00000000 08:01 1740452                    /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
7f96e52f5000-7f96e531a000 r-xp 00001000 08:01 1740452                    /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
7f96e531a000-7f96e5324000 r--p 00026000 08:01 1740452                    /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
7f96e5324000-7f96e5326000 r--p 00030000 08:01 1740452                    /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
7f96e5326000-7f96e5328000 rw-p 00032000 08:01 1740452                    /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
7ffdb8391000-7ffdb8393000 r-xp 00000000 00:00 0                          [vdso]
--- 导入 ssl 和 json 后 通过 /proc/2352681/maps 查看动态库情况
7f96e4400000-7f96e44c5000 r--p 00000000 08:01 1704973                    /usr/lib/x86_64-linux-gnu/libcrypto.so.3
7f96e44c5000-7f96e473e000 r-xp 000c5000 08:01 1704973                    /usr/lib/x86_64-linux-gnu/libcrypto.so.3
7f96e473e000-7f96e481b000 r--p 0033e000 08:01 1704973                    /usr/lib/x86_64-linux-gnu/libcrypto.so.3
7f96e481b000-7f96e487c000 r--p 0041b000 08:01 1704973                    /usr/lib/x86_64-linux-gnu/libcrypto.so.3
7f96e487c000-7f96e487f000 rw-p 0047c000 08:01 1704973                    /usr/lib/x86_64-linux-gnu/libcrypto.so.3
7f96e4956000-7f96e4975000 r--p 00000000 08:01 1704974                    /usr/lib/x86_64-linux-gnu/libssl.so.3
7f96e4975000-7f96e49d3000 r-xp 0001f000 08:01 1704974                    /usr/lib/x86_64-linux-gnu/libssl.so.3
7f96e49d3000-7f96e49f2000 r--p 0007d000 08:01 1704974                    /usr/lib/x86_64-linux-gnu/libssl.so.3
7f96e49f2000-7f96e49fc000 r--p 0009c000 08:01 1704974                    /usr/lib/x86_64-linux-gnu/libssl.so.3
7f96e49fc000-7f96e4a00000 rw-p 000a6000 08:01 1704974                    /usr/lib/x86_64-linux-gnu/libssl.so.3
7f96e4f35000-7f96e4f37000 r--p 00000000 08:01 1719467                    /usr/lib/python3.11/lib-dynload/_json.cpython-311-x86_64-linux-gnu.so
7f96e4f37000-7f96e4f3e000 r-xp 00002000 08:01 1719467                    /usr/lib/python3.11/lib-dynload/_json.cpython-311-x86_64-linux-gnu.so
7f96e4f3e000-7f96e4f40000 r--p 00009000 08:01 1719467                    /usr/lib/python3.11/lib-dynload/_json.cpython-311-x86_64-linux-gnu.so
7f96e4f40000-7f96e4f41000 r--p 0000a000 08:01 1719467                    /usr/lib/python3.11/lib-dynload/_json.cpython-311-x86_64-linux-gnu.so
7f96e4f41000-7f96e4f42000 rw-p 0000b000 08:01 1719467                    /usr/lib/python3.11/lib-dynload/_json.cpython-311-x86_64-linux-gnu.so
7f96e4f42000-7f96e4f54000 r--p 00000000 08:01 1718907                    /usr/lib/python3.11/lib-dynload/_ssl.cpython-311-x86_64-linux-gnu.so
7f96e4f54000-7f96e4f5f000 r-xp 00012000 08:01 1718907                    /usr/lib/python3.11/lib-dynload/_ssl.cpython-311-x86_64-linux-gnu.so
7f96e4f5f000-7f96e4f6d000 r--p 0001d000 08:01 1718907                    /usr/lib/python3.11/lib-dynload/_ssl.cpython-311-x86_64-linux-gnu.so
7f96e4f6d000-7f96e4f6e000 r--p 0002a000 08:01 1718907                    /usr/lib/python3.11/lib-dynload/_ssl.cpython-311-x86_64-linux-gnu.so
7f96e4f6e000-7f96e4f77000 rw-p 0002b000 08:01 1718907                    /usr/lib/python3.11/lib-dynload/_ssl.cpython-311-x86_64-linux-gnu.so
7f96e4fe2000-7f96e5008000 r--p 00000000 08:01 1740455                    /usr/lib/x86_64-linux-gnu/libc.so.6
7f96e5008000-7f96e515d000 r-xp 00026000 08:01 1740455                    /usr/lib/x86_64-linux-gnu/libc.so.6
7f96e515d000-7f96e51b0000 r--p 0017b000 08:01 1740455                    /usr/lib/x86_64-linux-gnu/libc.so.6
7f96e51b0000-7f96e51b4000 r--p 001ce000 08:01 1740455                    /usr/lib/x86_64-linux-gnu/libc.so.6
7f96e51b4000-7f96e51b6000 rw-p 001d2000 08:01 1740455                    /usr/lib/x86_64-linux-gnu/libc.so.6
7f96e51c3000-7f96e51c7000 r--p 00000000 08:01 1716378                    /usr/lib/x86_64-linux-gnu/libexpat.so.1.8.10
7f96e51c7000-7f96e51e3000 r-xp 00004000 08:01 1716378                    /usr/lib/x86_64-linux-gnu/libexpat.so.1.8.10
7f96e51e3000-7f96e51eb000 r--p 00020000 08:01 1716378                    /usr/lib/x86_64-linux-gnu/libexpat.so.1.8.10
7f96e51eb000-7f96e51ed000 r--p 00028000 08:01 1716378                    /usr/lib/x86_64-linux-gnu/libexpat.so.1.8.10
7f96e51ed000-7f96e51ee000 rw-p 0002a000 08:01 1716378                    /usr/lib/x86_64-linux-gnu/libexpat.so.1.8.10
7f96e51ee000-7f96e51f1000 r--p 00000000 08:01 1702832                    /usr/lib/x86_64-linux-gnu/libz.so.1.2.13
7f96e51f1000-7f96e5204000 r-xp 00003000 08:01 1702832                    /usr/lib/x86_64-linux-gnu/libz.so.1.2.13
7f96e5204000-7f96e520b000 r--p 00016000 08:01 1702832                    /usr/lib/x86_64-linux-gnu/libz.so.1.2.13
7f96e520b000-7f96e520c000 r--p 0001c000 08:01 1702832                    /usr/lib/x86_64-linux-gnu/libz.so.1.2.13
7f96e520c000-7f96e520d000 rw-p 0001d000 08:01 1702832                    /usr/lib/x86_64-linux-gnu/libz.so.1.2.13
7f96e520d000-7f96e521d000 r--p 00000000 08:01 1740458                    /usr/lib/x86_64-linux-gnu/libm.so.6
7f96e521d000-7f96e5290000 r-xp 00010000 08:01 1740458                    /usr/lib/x86_64-linux-gnu/libm.so.6
7f96e5290000-7f96e52ea000 r--p 00083000 08:01 1740458                    /usr/lib/x86_64-linux-gnu/libm.so.6
7f96e52ea000-7f96e52eb000 r--p 000dc000 08:01 1740458                    /usr/lib/x86_64-linux-gnu/libm.so.6
7f96e52eb000-7f96e52ec000 rw-p 000dd000 08:01 1740458                    /usr/lib/x86_64-linux-gnu/libm.so.6
7f96e52f4000-7f96e52f5000 r--p 00000000 08:01 1740452                    /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
7f96e52f5000-7f96e531a000 r-xp 00001000 08:01 1740452                    /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
7f96e531a000-7f96e5324000 r--p 00026000 08:01 1740452                    /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
7f96e5324000-7f96e5326000 r--p 00030000 08:01 1740452                    /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
7f96e5326000-7f96e5328000 rw-p 00032000 08:01 1740452                    /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
7ffdb8391000-7ffdb8393000 r-xp 00000000 00:00 0                          [vdso]
---  通过 ldd 查看 _ssl.cpython-311-x86_64-linux-gnu.so 情况
        linux-vdso.so.1 (0x00007ffc653e6000)
        libssl.so.3 => /lib/x86_64-linux-gnu/libssl.so.3 (0x00007ff53a2b3000)
        libcrypto.so.3 => /lib/x86_64-linux-gnu/libcrypto.so.3 (0x00007ff539e00000)
        libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007ff539c1f000)
        /lib64/ld-linux-x86-64.so.2 (0x00007ff53a39a000)
```

可以得出如下结论：

* python 的部分标准库是用 C 语言实现的，被编译成了动态链接库位于 `/usr/lib/python3.11/lib-dynload` 目录下。
* 在执行 import 导入由 C 语言实现的标准库时，python 才会去加载动态链接库（dlopen）。
* 如上例：
    * json 库的实现为 `/usr/lib/python3.11/lib-dynload/_json.cpython-311-x86_64-linux-gnu.so`。
    * ssl 库的实现为 `/usr/lib/python3.11/lib-dynload/_ssl.cpython-311-x86_64-linux-gnu.so`，并依赖 `libcrypto.so.3` 和 `libssl.so.3`

这种由 C 语言实现的标准库的包的机制在 cpython 中被称为 "扩展模块"，在标准库中实现的被称为 "内建模块"，源码位于： [python/cpython - Modules](https://github.com/python/cpython/tree/main/Modules)。

更多关于扩展模块的说明见下文。

## 第三方包情况

Python 作为脚本语言性能羸弱，为了性能，很多 Python 三方包使用 C 语言实现，如 [numpy](https://pypi.org/project/numpy/)。

这种使用 C 语言实现的 Python 包，正如上文所说，使用 C 语言实现的 Python 包被称为 "扩展模块"。

另外，很多软件供应商官方只提供 C 语言实现的动态链接库，如 [mariadb](https://pypi.org/project/mariadb/)，这种场景也只能使用 "扩展模块" 方式提供对应的 Python 包。

Cpython 定义了 C 语言的 ABI 接口和动态库命名规则，如 `PyObject *PyInit_modulename(void)`，在 C 语言中实现这个函数，然后将其编译成动态链接库，放到 Python Path 中。然后就可以在 Python 中 import 这个模块了。在导入时，Cpython 会使用 dlopen 加载动态链接库，然后调用相关的 ABI 函数进行初始化。之后，在 Python 中调用这个模块的相关函数时，解释器会将 Python 函数参数数据结构转换为 C ABI 约定的 C 的数据结构，然后再调用 C 函数，C 函数返回值后，解释器会将结果转换为 Python 数据结构。

实现一个 "扩展模块" 包的方式有很多，如：

* 不适用任何三方工具实现。
* 使用第三方工具，如 [cython](https://cython.org/)、 [cffi](https://cffi.readthedocs.io/)、[SWIG](https://www.swig.org/)、[Numba](https://numba.pydata.org/) 。

关于扩展模块的 so 动态库查找，规则如下：

* 查找路径为 Python Path （`sys.path`）。
* so 文件命令必须符合 [PEP 3149](https://peps.python.org/pep-3149/) （通过 `sysconfig.get_config_var('EXT_SUFFIX')` 可以查看）。
* 如果扩展模块的 so 还依赖其他 so，则按照 Linux 常规的动态库查找逻辑查找。

更多详见： [官方文档 - 扩展和嵌入 Python 解释器](https://docs.python.org/zh-cn/3/extending/index.html)。
