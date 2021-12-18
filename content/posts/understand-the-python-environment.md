---
title: "一文彻底理解 Python 环境"
date: 2021-12-18T00:02:56+08:00
draft: false
toc: true
comments: true
tags:
  - python
---

## Python 编译产物分析

### 编译过程

> * 实验平台 （Debian 9 x86_64）
> * [官方文档](https://devguide.python.org/setup)

clone 代码

```bash
git clone https://github.com/python/cpython.git
cd cpython
git checkout 3.10
```

安装编译依赖

```bash
sudo apt-get update
sudo apt-get build-dep python3
sudo apt-get install pkg-config
sudo apt-get install build-essential gdb lcov pkg-config \
      libbz2-dev libffi-dev libgdbm-dev libgdbm-compat-dev liblzma-dev \
      libncurses5-dev libreadline6-dev libsqlite3-dev libssl-dev \
      lzma lzma-dev tk-dev uuid-dev zlib1g-dev
```

将 Python 编译并安装到指定目录

```bash
# 配置安装源码同级目录（仅测试不能用于生产）
./configure --prefix=$(dirname $(pwd))/python-release
make
# make test # 由于网络原因可能失败可以忽略
# sudo make install
make install # 由于不是安装奥系统路径可以不用 sudo
cd ../python-release
```

### 编译产物目录结构

（如果不手动编译，这些类似的文件，可以在 /usr/local 路径下找到）

```
.
├── bin                            // 可执行文件目录
│   ├── 2to3 -> 2to3-3.10          // 自动将 Python2 转换为 Python3 的迁移工具
│   ├── 2to3-3.10
│   ├── idle3 -> idle3.10          // 自带的 IDE
│   ├── idle3.10
│   ├── pip3                       // 包管理器
│   ├── pip3.10
│   ├── pydoc3 -> pydoc3.10        // 文档生成器
│   ├── pydoc3.10
│   ├── python3 -> python3.10      // Python3 解释器
│   ├── python3.10
│   ├── python3.10-config          // C 语言嵌入 Python 解释器，参见文档 https://helpmanual.io/man1/python3-config/
│   └── python3-config -> python3.10-config
├── include
│   └── python3.10                 // Python 头文件，C 语言可以使用，参见文档 https://docs.python.org/3/extending/index.html
├── lib
│   ├── libpython3.10.a            // 链接库
│   ├── pkgconfig                  // ??
│   └── python3.10                 // Python 包目录，根目录的为标准库，site-packages 为第三方库
└── share
    └── man
```

Python 的编译产物是标准的 Unix 目录结构（bin include lib share）。在默认情况下（编译期间不指定 --prefix），这些编译产物会被 copy 到系统的 `/usr/local` 目录下。

## Python 包搜索路径

通过 `./bin/python3 -c 'import sys; print(sys.path)'`，可以看到当前解释器的包搜索路径，大概可以看到如下内容：

* `''`
* `'/path/to/python-release/lib/python310.zip'`
* `'/path/to/python-release/lib/python3.10'`
* `'/path/to/python-release/lib/python3.10/lib-dynload'`
* `'$HOME/.local/lib/python3.10/site-packages'`
* `'/path/to/python-release/lib/python3.10/site-packages'`

在官方，并没有找到 Python 包搜索路径是如何初始化的。通过检索，找到这两个文章：[stackoverflow](https://stackoverflow.com/a/38403654) | [sys.path源码分析](https://cloud.tencent.com/developer/news/156311)。

Python 的包搜索路径是有一套复杂的约定性的规则。这个规则非常复杂，作为 Python 开发者只有理解了这套机制，才能更好的处理各种 ImportError 的错误，才能更好的在工程上应用 Python。

经过实验和上文提到的文章，梳理了一下 Linux 下 Python 包搜索路径 [sys.path](https://docs.python.org/zh-cn/3/library/sys.html#sys.path) 初始化的过程：

* 确认变量
    * [`sys.base_prefix`](https://docs.python.org/zh-cn/3/library/sys.html#sys.prefix)，存放与平台无关的文件，值为编译期间指定的 `--prefix`，默认为 `/usr/local` ，如果指定了 python home （PYTHONHOME 环境变量 或 `pyvenv.cfg` home 字段），则为 python home 值（since 3.3）。
    * [`sys.base_exec_prefix`](https://docs.python.org/zh-cn/3/library/sys.html#sys.base_exec_prefix)，存放与平台有关的文件，与平台有关的文件（如 `lib/pythonX.Y/config`，`lib/pythonX.Y/lib-dynload`），值为编译期间指定的 `--exec-prefix`，默认为 `--prefix` 或 `/usr/local`，如果指定了 python home（PYTHONHOME 环境变量 或 `pyvenv.cfg` home 字段），则为 python home 值（since 3.3）。
    * [`sys.executable`](https://docs.python.org/zh-cn/3/library/sys.html#sys.executable) 从操作系统读取，从操作系统获取当前运行的进程文件的绝对路径。
    * [`sys.prefix`](https://docs.python.org/zh-cn/3/library/sys.html#sys.prefix)，存放与平台无关的文件。
        * 递归搜索 `sys.executable` 及其祖宗目录，是否包含 `lib/pythonx.y/os.py` 文件，如果包含，则 `sys.prefix` 为该目录
        * 如果找不到则为 `sys.base_prefix`
    * [`sys.exec_prefix`](https://docs.python.org/zh-cn/3/library/sys.html#sys.exec_prefix)，与平台有关的文件（如 `lib/pythonX.Y/config`，`lib/pythonX.Y/lib-dynload`）
        * 递归搜索 `sys.executable` 及其祖宗目录，是否包含 `lib/pythonx.y/lib-dynload` 文件，如果包含，则 `sys.exec_prefix` 为该目录
        * 找不到则为 `sys.base_exec_prefix`
* 然后可以计算 `sys.path` （优先级由高到低）
    * site-packages 中 `*.pth` 文件指向的 egg 目录（可能是 `dist-packages`）
    * 解释器运行所在目录个 `''` （Work Dir）
    * PYTHONPATH 环境变量配置的路径
    * `'<sys.base_prefix>/lib/pythonxy.zip'`
    * `<sys.base_prefix>` 拼接 `lib/python3.10`、 `lib/pythonx.y/plat_linux2`、 `lib/pythonx.y/lib_tk`、 `lib/pythonx.y/lib_old` 之类的（由编译配置决定）
    * `<sys.base_exec_prefix>` 拼接 `lib/pythonx.y/lib-dynload` 之类的（由编译配置决定）
    * `$HOME/.local/lib/pythonx.y/site-packages`（还有可能是 `dist-packages`）
    * site-packages 路径： `<sys.prefix>` 、 `<sys.exec_prefix>` 分别拼接 `lib/pythonx.y/site-packages` 、`lib/site-packages`（可能是 `dist-packages`）
    * site-packages 中 `*.pth` 文件指向的非 egg 目录（可能是 `dist-packages`）

更多：

* 关于 `site-packages` 参见：[官方文档](https://docs.python.org/zh-cn/3/library/site.html)
* 关于 `*.pth` 文件，只能在 `site-packages` 路径下才能生效，参见 [stackoverflow](https://stackoverflow.com/questions/15208615/using-pth-files)

## Python 包管理工具

Python 历史悠久，因此，Python 经过了很多的中方案，目前实时标准是 pip，但是仍然非常混乱。具体可以参见：

* [Python 包管理工具解惑](https://blog.zengrong.net/post/python_packaging/)
* [官方文档](https://packaging.python.org/en/latest/)

## Python 环境定义和分类

Python 环境指的是一个 Python 解释器，以及解释器启动后可以搜索到的 Python 包（`sys.path`）的集合。一般可以分为如下几种场景。

* 全局环境。通过操作系统默认包管理器安装的 Python 或者 操作系统默认安装的 Python 的环境叫做全局 Python 环境。在一般的 Linux 发行版 和 MacOS 中， Python 解释器一般都作默认命令预装到操作系统中，注意不同操作系统、不同的版本预装的 Python 版本可能不同。不建议使用全局 Python 环境进行开发，原因在于 Python 的兼容性不太好，而不同项目依赖的 Python 解释器的版本可能不同，如果直接使用全局 Python 环境开发，极有可能出现环境混乱，不同项目间依赖相互干扰，甚至破坏其他系统软件的依赖，导致系统软件无法运行。
* 虚拟环境。为了解决全局环境的问题，Python 开发者一般会为项目创建虚拟环境，这个环境与全局环境以及其他虚拟环境相互隔离，因此虚拟环境是项目粒度的。
* Conda 环境。是指使用 conda 包管理器管理的 Python 环境（请参阅 [conda 入门](https://conda.io/projects/conda/en/latest/user-guide/getting-started.html) (conda.io)），与虚拟环境不同，Conda 可以很好地创建具有相互关联的依赖项以及二进制包的环境。与虚拟环境不同，conda 环境是全局粒度的。因此可以在系统安装多个 conda 环境，然后为不同的项目选择不同的 conda 环境。

## 常见的 Python 环境管理工具

环境管理管理工具大概可以分为两类

* Python 版本管理，主要来管理 Python 解释器本身的版本，解决如何实现和管理在系统中安装多个版本的 Python。此类工具如：
    * pyenv
* Python 包隔离，主要来隔离不同 Python 项目的依赖。
    * venv (pyvenv)
    * virtualenv

关于常见的环境管理工具参见： [stackoverflow](https://stackoverflow.com/questions/41573587/what-is-the-difference-between-venv-pyvenv-pyenv-virtualenv-virtualenvwrappe)。本文主要介绍 venv

### venv

> [官方文档](https://docs.python.org/3/library/venv.html)

python 3.3 引入的 官方环境管理工具。如果是 Python 3 的项目，建议使用该工具。

```bash
./bin/python3 -m venv ../python-venv-1
```

此时将看到 `../python-venv-1` 目录结构如下所示

```
.
├── bin
│   ├── activate                // 一系列 activate 文件，通过 source 激活
│   ├── activate.csh
│   ├── activate.fish
│   ├── Activate.ps1
│   ├── pip
│   ├── pip3
│   ├── pip3.10
│   ├── python -> python3
│   ├── python3 -> 真实的 Python 解析器
│   └── python3.10 -> python3
├── include
├── lib
│   └── python3.10
│       └── site-packages
│           ├── _distutils_hack
│           ├── distutils-precedence.pth
│           ├── pip
│           ├── pip-21.2.4.dist-info
│           ├── pkg_resources
│           ├── setuptools
│           └── setuptools-58.1.0.dist-info
├── lib64 -> lib
└── pyvenv.cfg
```

可以重点关注 `pyvenv.cfg` 文件

```cfg
home = /path/to/python-release/bin
include-system-site-packages = false
version = 3.10.1
```

通过 `../python-venv-1/bin/python3 -c 'import sys; print(sys.path)'` 可以看到如下输出

* `''`
* `'/path/to/python-release/lib/python310.zip'`
* `'/path/to/python-release/lib/python3.10'`
* `'/path/to/python-release/lib/python3.10/lib-dynload'`
* `'/path/to/python-venv-1/lib/python3.10/site-packages'`

`python3 -m venv -h` 常见选项

* `--system-site-packages` 默认为 false，设置为 true 时，会将执行该命令的 `site-packages` 添加到 `sys.path` 中，在此例子中为 `'/path/to/python-release/lib/python3.10/site-packages'`

### virtualenv

和 venv 基本一致，支持 Python2.7。只建议 Python2.7 的项目使用该工具。

更多参见：[官方文档](https://virtualenv.pypa.io/en/latest/installation.html#)

### conda

一般多为数据分析/人工智能领域使用。

更多参见：[官方文档](https://conda.io/docs/user-guide/tasks/manage-environments.html)
