---
title: "Python 语言"
date: 2021-12-15T21:50:51+08:00
draft: false
toc: true
comments: true
weight: 1500
summary: 阅读本章节，可以了解到如何使用 VSCode 开发 Python 语言项目。
---

## 导读

> VSCode Python 扩展版本 v2021.12.1559732655

阅读本章节，可以了解到如何使用 VSCode 开发 Python 语言项目，主要介绍如下几款 VSCode Python 扩展：

* [Python](https://marketplace.visualstudio.com/items?itemName=ms-python.python) - [MIT 许可证](https://marketplace.visualstudio.com/items/ms-python.python/license)
* [Jupyter](https://marketplace.visualstudio.com/items?itemName=ms-toolsai.jupyter) - [MIT 许可证](https://marketplace.visualstudio.com/items/ms-toolsai.jupyter/license) （仅交互式 Python 涉及部分）
* [Pylance](https://marketplace.visualstudio.com/items?itemName=ms-python.vscode-pylance) - 闭源 [Microsoft proprietary license](https://marketplace.visualstudio.com/items/ms-python.vscode-pylance/license)
* [Visual Studio IntelliCode](https://marketplace.visualstudio.com/items?itemName=VisualStudioExptTeam.vscodeintellicode) - 闭源 [许可证](https://marketplace.visualstudio.com/items?itemName=VisualStudioExptTeam.vscodeintellicode)

## 特性速览

> [VSCode Docs - Language Python](https://code.visualstudio.com/docs/languages/python)

* 环境管理
* 代码编辑（自动完成、快速修复、格式化、重构、代码生成、代码片段）
* 代码浏览（调转定义、查找引用、查找实现、调用层次、类型层次）
* 问题诊断（类型检查、Lint）
* 代码运行和调试
* 测试
* 数据分析（本文暂不涉及，后续有专门文章讲解描述）
* 交互式 Python
* 场景
    * Django 支持
    * Flask 支持
    * VSCode Web 支持

## 快速开始

> [VSCode Docs - Python Tutorial](https://code.visualstudio.com/docs/python/python-tutorial)

* 安装 Python，参见 [Python 官方文档](https://www.python.org/downloads/)
* [安装 VSCode](https://code.visualstudio.com/download)
* 在 VSCode 中，安装如下几个扩展
    * [Python](https://marketplace.visualstudio.com/items?itemName=ms-python.python) - [MIT 许可证](https://marketplace.visualstudio.com/items/ms-python.python/license)
    * [Jupyter](https://marketplace.visualstudio.com/items?itemName=ms-toolsai.jupyter) - [MIT 许可证](https://marketplace.visualstudio.com/items/ms-toolsai.jupyter/license)
    * [Pylance](https://marketplace.visualstudio.com/items?itemName=ms-python.vscode-pylance) - 闭源 [Microsoft proprietary license](https://marketplace.visualstudio.com/items/ms-python.vscode-pylance/license)
    * [Visual Studio IntelliCode](https://marketplace.visualstudio.com/items?itemName=VisualStudioExptTeam.vscodeintellicode) - 闭源 [许可证](https://marketplace.visualstudio.com/items?itemName=VisualStudioExptTeam.vscodeintellicode)
* 使用 VSCode 打开 Python 文件或者 Python 项目
* Enjoy it!

## 使用指南

### 环境管理

> [VSCode Docs - Python Environments](https://code.visualstudio.com/docs/python/environments)

一台设备可以装多个 Python 解析器，这些 Python 解释器会关联一些了 Python 包。因此某个和 Python 解释器和其关联的 Python 包的集合称为一个 Python 环境。更多关于 Python 环境，可以参见另一篇文章：[一文彻底理解 Python 环境](/posts/understand-the-python-environment/)

VSCode Python 支持管理各种的 Python 环境，可以通过状态栏观察当前工作空间绑定的 Python 环境。

![image](/image/vscode/python/python-status-bar.png)

点击上图状态栏，可以快速浏览当前系统所有可用的 Python 环境，如下图所示：

![image](/image/vscode/python/interpreters-list.png)

选择一个，即可快速和工作空间关联。通过 `"python.defaultInterpreterPath"` 可以给所有工作空间配置一个默认的 Python 环境。（该配置支持引用环境变量，语法为 `${env:环境变量名}`，例如 `"python.defaultInterpreterPath": "${env:PYTHON_INSTALL_LOC}"`）

Python 环境列表除了通过状态唤起外，还支持通过 `>python: select interpreter` 命令唤起，该列表默认按照如下逻辑去查找系统内的 Python 环境：

* 操作系统 PATH 环境变量指向的路径（`echo $PATH` 查看，查找路径）
* 当前工作空间目录的虚拟环境目录（一般为 .venv）
* `python.venvPath` 配置指向的路径，该路径可以包含多个虚拟环境目录
* [virtualenvwrapper](https://virtualenvwrapper.readthedocs.io/) 支持的 `~/.virtualenvs` 文件夹中的虚拟环境
* 由 [pyenv](https://github.com/pyenv/pyenv)、[Pipenv](https://pypi.org/project/pipenv/) 和 [Poetry](https://poetry.eustace.io/) 安装的解释器
* 位于 `WORKON_HOME` 环境变量指向目录中的虚拟环境
* 包含 Python 解释器的 Conda 环境（不显示不包含解释器的 conda 环境）
* [direnv](https://direnv.net/) 安装的 `.direnv` 目录

此外

* 还可以手动指定 Python 解释器，此外如果在工作空间目录中发现 [pipenv](https://pipenv.readthedocs.io/) 环境，则不会显示其他的 Python 环境，因此 pipenv 会管理这一切。
* Python 扩展还会加载由 `python.envFile` 配置指向的环境变量文件。默认值为 `${workspaceFolder}/.env`

VSCode 选择一个 Python 环境后，其作用范围如下所示：

* 打开终端，会自动选中的 Python 环境，可用通过 `"python.terminal.activateEnvironment": false` 配置关闭该特性。
* 智能感知、Lint 等特性都会使用该 Python 环境。
* 断点调试时，默认使用该 Python 环境启动调试器（可以通过调试器的 `python` 字段覆盖默认配置）

默认情况下 Python 扩展会读取 `${workspaceFolder}/.env` 文件中定义的环境变量（可以通过 `python.envFile` 配置自定义）。该文件语法非常简单：

* 通过 `environment_variable=value` 定义变量
* 使用 `#` 注释
* 支持 `${env:EXISTING_VARIABLE}` 进行变量替换，不支持嵌套

在该文件中定义的环境变量将影响 Language Server 和调试器的行为（如 `PYTHONPATH`）

### 代码编辑

#### 智能感知

编写代码中会自动触发建议列表、参数及其位置提示，鼠标 Hover 到代码出会显示对应位置的符号的文档。

* 建议列表 `editor.action.triggerSuggest`，手动唤起默认快捷键为 `cmd + i`。
* 显示参数和参数位置提示 `editor.action.triggerParameterHints`，手动唤起默认快捷键为 `cmd+shift+space`。
* 显示悬浮文档 `editor.action.showHover`，手动唤起默认快捷键为 `cmd+k cmd+i`。

![image](/image/vscode/python/hello-world.gif)

注意：由于 Python 是弱类型语言，在没有启用类型注解的情况下，智能感知的能力是有限的。

Python 的智能感知能力由如下 Language Server 提供，通过 `python.languageServer` 进行配置

* Default （默认），当安装了 [Pylance](https://marketplace.visualstudio.com/items?itemName=ms-python.vscode-pylance) 时，将使用 Pylance，否则使用 Jedi。
* Jedi 使用 [jedi](https://github.com/davidhalter/jedi)
* None 关闭智能感知

通过 `>Python: show language server output` 可以输出，关于 Pylance 和 Jedi 参见下文。

智能感知支持添加自定义 Python 包，通过 `python.autoComplete.extraPaths` 进行配置，如：

```json
"python.autoComplete.extraPaths": [
    "~/.local/lib/Google/google_appengine",
    "~/.local/lib/Google/google_appengine/lib/flask-0.12" ]
```

#### 快速修复和重构

* 自动导入（需在当前环境中安装相关包）

![image](/image/vscode/python/quickFix.gif)

* 提取变量、提取函数函数

![image](/image/vscode/python/refactorExtractVar.gif)

![image](/image/vscode/python/refactorExtractMethod.gif)

* 符号重命名和模块重命名

![image](/image/vscode/python/refactorRenameModule.gif)

* 导入排序 (`>Python Refactor: Sort Imports` 命令唤起)，可以通过 `"python.sortImports.args": ["-rc", "--atomic"],` 配置项进行配置。排序脚本参见 [isort](https://pycqa.github.io/isort/docs/configuration/config_files.html)

![image](/image/vscode/python/sortImports.gif)

#### 格式化

通过 `python.formatting.provider` 配置项可以配置 Python 格式化器，默认为 `"autopep8"`，选项为 `"autopep8"`、`"yapf"`或`"black"`。使用这些格式化器时，需要如下配置

* `autopep8`，`pip install pep8 & pip install --upgrade autopep8`，特殊的配置项 `python.formatting.autopep8Args`，`python.formatting.autopep8Path`
* `black`，`pip install black`，特殊的配置项 `python.formatting.blackArgs`，`python.formatting.blackPath` （只支持运行在 Python 3 环境）
* `yapf`，`pip install yapf`，特殊的配置项 `python.formatting.yapfArgs`，`python.formatting.yapfPath`

下面有一些配置例子

```json
"python.formatting.autopep8Args": ["--max-line-length", "120", "--experimental"],
"python.formatting.yapfArgs": ["--style", "{based_on_style: chromium, indent_width: 20}"],
"python.formatting.blackArgs": ["--line-length", "100"]
```

### 代码浏览

代码编辑器鼠标右击，打开上下文菜单，可以调转定义、查找引用、查找实现、调用层次

* 调转定义 `editor.action.revealDefinition` ，快捷键 `F12`
* 查找引用 `editor.action.goToReferences`，快捷键 `shift+F12`
* 查找实现 `editor.action.goToImplementation`，快捷键 `cmd+F12`，光标在接口上
* 查找工作空间所有符号
* 调用层次 `references-view.showCallHierarchy`，快捷键 `shift+option+H`，命令名 `>Calls: Show Call Hierarchy`
* Explorer （资源管理器）的 Outline （大纲），可以看到当前编辑器打开文件的符号列表

### 问题诊断

默认情况下，针对语法问题，VSCode Python 默认会通过 Language Server 对项目进行语法检查。但在 Python 这种弱类型的编程语言的项目路中，如果想在工程中使用，光靠语法检查是不够的，静态代码检查（如代码风格）是必不可少的。因此 VSCode Python 支持与多种 Python 业界主流的 Lint 工具集成。

* 启用或禁用 Lint
    * 方式 1：通过 `>Python: Select Linter` 命令启用或者禁用 Lint 工具（默认启用 pylint）
    * 方式 2：通过 `"python.linting.<linter>Enabled": true` 配置启用或禁用 Lint 工具
* 触发 Lint 运行
    * 检查单文件：保存文件时自动触发
    * 检查整个项目：通过 `>Python: Run Linting` 命令手动触发
* Lint 输出，在编辑器会以波浪线方式展示，并问题面板可以浏览所有问题

![image](/image/vscode/python/lint-messages.png)

* Lint 相关配置
    * `python.linting.enabled` 是否启用 Lint，默认 true
    * `python.linting.lintOnSave` 在保存文件时执行 Lint，默认 true
    * `python.linting.maxNumberOfProblems` 最大问题数量，默认 100
    * `python.linting.ignorePatterns` 忽略检查的目录或文件，默认为 `[".vscode/*.py", "**/site-packages/**/*.py"]`

* 不同 Lint 工具集成有不同的配置，需要安装不同的依赖和配置项，所有支持的 Lint 参见下表

| Linter | 包名 (`pip install`) | 启用配置  (python.linting.) | 参数设置  (python.linting.) | 自定义路径  (python.linting.) |
| --- | --- | --- | --- | --- |
| Pylint | [pylint](https://pypi.org/project/pylint/) | pylintEnabled | pylintArgs | pylintPath |
| Flake8 | [flake8](https://pypi.org/project/flake8/) | flake8Enabled | flake8Args | flake8Path |
| mypy | [mypy](https://pypi.org/project/mypy/) | mypyEnabled | mypyArgs | mypyPath |
| pycodestyle (pep8) | [pycodestyle](https://pypi.org/project/pycodestyle/) | pycodestyleEnabled | pycodestyleArgs | pycodestylePath |
| prospector | [prospector](https://pypi.org/project/prospector/) | prospectorEnabled | prospectorArgs | prospectorPath |
| pylama | [pylama](https://pypi.org/project/pylama/) | pylamaEnabled | pylamaArgs | pylamaPath |
| bandit | [bandit](https://pypi.org/project/bandit/) | banditEnabled | banditArgs | banditPath |

* 命令行参数例子

```json
"python.linting.pylintArgs": ["--reports", "12", "--disable", "I0011"],
"python.linting.flake8Args": ["--ignore=E24,W504", "--verbose"]
"python.linting.pydocstyleArgs": ["--ignore=D400", "--ignore=D4"]
```

* 不同 Lint 工具配置参见下方链接
    * [Pylint](https://code.visualstudio.com/docs/python/linting#_pylint)
    * [pydocstyle](https://code.visualstudio.com/docs/python/linting#_pydocstyle)
    * [pycodestyle (pep8)](https://code.visualstudio.com/docs/python/linting#_pycodestyle-pep8)
    * [prospector](https://code.visualstudio.com/docs/python/linting#_prospector)
    * [Flake8](https://code.visualstudio.com/docs/python/linting#_flake8)
    * [mypy](https://code.visualstudio.com/docs/python/linting#_mypy)
    * [pylama](https://pypi.org/project/pylama/)
    * [bandit](https://pypi.org/project/bandit/)

### 代码运行和调试

#### 交互式运行

* `>Python: Run Selection/Line in Python Terminal` 通过该命令，可以快速启动一个 Python REPL，并将选中代码发送到 该 REPL 中运行。
* `>Python: Start REPL` 快速启动一个 Python 解释器。
* `>Python: run selection/line in Django shell` 针对 Django 项目，可以选择在 Django Shell 中运行。
* 还可以田健 `#%%` 注释，快速在交互式窗口运行，参见下文：交互式 Python

#### 使用默认配置快速运行或调试

VSCode Python 支持免配置的快速启动调试

* 按 `F5` 快速调试当前文件，按 `Ctrl + F5` 快速调试当前文件
* 点击调试视图的【运行和调试】按钮
* 点击编辑器标题栏右上角图标快速运行调试当前 Python 文件
    * 点击三角号运行当前文件
    * 点击右侧展开按钮可以调试当前文件

![image](/image/vscode/python/quick-run-or-debug-pythonfile.png)

#### 创建或添加调试配置

打开调试视图

* 在没有调试配置时，点击 create a launch.json file
    * 根据情况选择调试的调试配置模板
    * 将创建并打开 `.vscode/launch.json` 文件
* 在有调试配置时，按可通过如下方式添加一个新的调试配置

![image](/image/vscode/python/add-configuration.png)

调试 Python 文件默认生成的文件配置的例子

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Python: 当前文件",
            "type": "python",
            "request": "launch",
            "program": "${file}",
            "console": "integratedTerminal"
        }
    ]
}
```

#### 状态栏调试信息

当存在调试配置时，可以通过状态栏观察当前选中的调试配置，点击可快速选择并启动调试

![image](/image/vscode/python/debug-status-bar.png)

#### 调试能力详解

在此仅介绍断点能力

* 普通断点，点击编辑器左侧边框，在指定行添加断点，或者在光标所在位置按 `F9`
* 条件断点，右击编辑器左侧边框，选择条件断点
    * 表达式类型，输入一个结果为 bool 的表达式
    * 命中次数类型
        * 支持一个确定的整数
        * 支持比较运算符 (>, >=, <, <=, ==, !=) 加一个整数
        * 支持 `% n` 表示每命中 n 次断点一次
    * Logpoint，命中断点后再调试控制台输出日志
* 函数断点，在测试侧边栏中，最下方断点视图，点击加号，输入当前打开文件的函数名
* 通过代码添加断点
    * `import debugpy`
    * `debugpy.breakpoint()`

其他调试 VSCode Debug 视图和通用能力，参见：[VSCode Docs - User Guide Debugging](https://code.visualstudio.com/docs/editor/debugging)

#### 选择一个配置启动调试

* `cmd + p` 输入 `debug `，选择添加配置，选择 `Go: Launch Package` 回车将创建并打开 `.vscode/launch.json` 文件
* 启动调试，有如下几种方式
    * `F5` 或者 `>Debug: start debugging` 以上次选中的调试配置启动调试
    * `cmd + p` 输入 `debug ` 并选择调试配置，并启动调试
    * 菜单 > Run > Start debugging
    * 打开调试侧边栏，绿色三角号

![image](/image/vscode/python/debug-start-button.png)

* 运行（不调试），有如下几种方式
    * `ctrl+F5` 或者 `>debug: start without debugging`
    * 菜单 > Run > start without debugging

#### 调试配置详解

本部分描述 `.vscode/launch.json` Python 调试配置支持的全部字段

* `name` 调试配置名，可以自定义
* `type` 调试类型，写死 `python`
* `request` 可选值为 `launch` 或者 `attach`
* `request` 为 `launch` 相关配置，配置 debug 的程序如何启动
    * `pragram` 启动的 Python 文件的绝对路径，可以使用魔法变量如（`${file}`、`${workspaceFolder}`，更多参见：[变量手册](https://code.visualstudio.com/docs/editor/variables-reference)）
    * `module` 提供指定要调试的模块名称的功能，类似于在命令行运行时的 -m 参数。有关更多信息，请参阅 [Python.org](https://docs.python.org/3/using/cmdline.html#cmdoption-m)
    * `python` Python 解释器路径。如果未指定，则此设置默认为为您的工作区选择的解释器，相当于使用 `${command:python.interpreterPath}`
    * `pythonArgs` 传递给 Python 解释器的命令行参数
    * `console` 启动用户程序的终端
        * `integratedTerminal` 集成终端，即在 VSCode 终端中启动（可以处理标准输入）（推荐）（默认）
        * `internalConsole` 调试控制台，即在 VSCode 调试控制台启动（不能向进程里面输入标准输入）
        * `externalTerminal` 外部终端，不建议（调用操作系统中的终端程序）
    * `internalConsoleOptions` 控制是否如何打开调试控制台
        * `neverOpen` 从不打开
        * `openOnFirstSessionStart"` 仅第一次调试时打来
        * `openOnSessionStart` 每次调试都打开
    * `env` 环境变量
    * `envFile` 环境变量文件
    * `args` 命令行参数
    * `stopOnEntry` 当设置为 true 时，在被调试程序的第一行中断调试器。如果省略（默认）或设置为 false，调试器将程序运行到第一个断点。
    * `autoReload` 允许在调试器执行达到断点后对代码进行更改时自动重新加载调试器。要启用此功能，请设置 `{"enable": true}` （注意：当调试器执行重新加载时，导入时运行的代码可能会再次执行。为避免这种情况，请尝试仅在模块中使用导入、常量和定义，将所有代码放入函数中。或者，您也可以使用 `if __name__=="__main__"` 检查。）
    * `purpose` 该配置覆盖一些按钮的默认行为
        * `debug-test`，该配置用于调试测试
        * `debug-in-terminal`，该配置应用与于 `Debug Python File in Terminal`
    * `subProcess` 调试子进程，默认为 false，更多参见：[multi-target debugging](https://code.visualstudio.com/docs/editor/debugging#_multitarget-debugging)
    * `cwd` 调试进程的 WorkDir，默认为 `${workspaceFolder}`
    * `redirectOutput` 当设置为 true（internalConsole 的默认值）时，会导致调试器将程序的所有输出打印到 VSCode 调试控制台窗口中。如果设置为 false（integratedTerminal 和 externalTerminal 的默认值），则程序输出不会显示在调试器输出窗口中。
    * `justMyCode` 默认为 true，将调试仅限于用户编写的代码。设置为 false 还可以启用标准库函数的调试。（建议修改为 `false`）
    * `django` 默认为 false，当设置为 true 时，将启用 django 特性，支持 django 模板的调试
    * `sudo` 默认为 false，当设置为 true 时，会在启动程序是通过 sudo 启动，可以输入密码
    * `pyramid` 默认为 false，当设置为 true 时，将启用 pyramid 特性
    * `gevent` 启用 gevent，参见 https://www.gevent.org/intro.html
    * `jinja` 默认为 false，当设置为 true 时，会启用 Jinja templating engine 的支持
* `request` 为 `attach` 相关配置，配置 debug 如何连接到远端
    * `connect` 配置远端 host 和 port
    * `pathMappings` 远端代码和本地代码的映射
* `logToFile` Enable logging of debugger events to a log file.
* `showReturnValue` 默认为 true，是否展示返回值
* 平台特性配置
    * `windows`
    * `linux`
    * `osx`

### 测试

VSCode Python 支持 [unittest](https://docs.python.org/3/library/unittest.html) 和 [pytest](https://docs.pytest.org/)

#### 相关代码

假设我们待测是模块为 `inc_dec.py`，代码如下：

```py
def increment(x):
    return x + 1

def decrement(x):
    return x - 1
```

添加 pytest 测试代码 `test_pytest.py`

```py
import inc_dec    # The code to test


def test_increment():
    assert inc_dec.increment(3) == 4


def test_decrement():
    assert inc_dec.decrement(3) == 4
```

添加 unittest 测试代码 `test_unittest.py`

```py
import inc_dec    # The code to test
import unittest   # The test framework


class Test_TestIncrementDecrement(unittest.TestCase):
    def test_increment(self):
        self.assertEqual(inc_dec.increment(3), 4)

    def test_decrement(self):
        self.assertEqual(inc_dec.decrement(3), 4)


if __name__ == '__main__':
    unittest.main()
```

#### 快速启用测试特性

* 打开测试浏览器，点击 `Configuare Python Tests`，可以快速配置测试。或者通过 `>Python: Configure Tests` 命令，也可以配置测试

![image](/image/vscode/python/test-explorer-no-tests.png)

* 以上选择，都会应用到 `python.testing.unittestEnabled` 和 `python.testing.pytestEnabled` 配置项，如果两个框架都启用，那么 Python 扩展将只运行 pytest。当启用测试框架时，如果当前激活的环境中尚不存在框架包，VS Code 会提示您安装该框架包：

![image](/image/vscode/python/install-framework.png)

#### 运行或调试测试

有很多中运行测试的方法

* 打开测试文件后，选择测试定义行旁边的装订线中显示的绿色运行图标。点击可以直接运行，右击可以选择调试

![image](/image/vscode/python/run-tests-gutter.png)

* 通过如下命令运行测试
    * `>Test: Run All Tests` 运行所有测试
    * `>Test: Run Tests in Current File` 运行当前文件的所有测试
    * `>Test: Run Test at Cursor` 运行光标位置处的测试
* 通过如下命令调试测试
    * `>Test: Debug All Tests` 调试所有测试
    * `>Test: Debug Tests in Current File` 调试当前文件的所有测试
    * `>Test: Debug Test at Cursor` 调试    光标位置处的测试
* 从测试浏览器启动运行
    * 要运行所有发现的测试，请选择测试资源管理器顶部的播放按钮：
    * 要运行一组特定的测试或单个测试，请选择文件、类或测试，然后选择该项目右侧的播放按钮
    * 还可以通过测试资源管理器运行一系列测试。为此，请在要运行的测试上按 Ctrl+单击（或在 macOS 上为 Cmd+单击），右键单击其中一个，然后选择运行测试。

![image](/image/vscode/python/test-explorer-run-all-tests.png)
![image](/image/vscode/python/test-explorer-run-scoped-tests.png)

* 从测试浏览器启动调试
    * 要调试所有发现的测试，请选择测试资源管理器顶部的小虫子按钮：
    * 要运行一组特定的测试或单个测试，请选择文件、类或测试，然后选择该项目右侧的小虫子按钮
    * 您还可以通过测试资源管理器运行一系列测试。为此，请在要运行的测试上按 Ctrl+单击（或在 macOS 上为 Cmd+单击），右键单击其中一个，然后选择运行测试。

![image](/image/vscode/python/debug-test-in-explorer.png)

测试运行后，VS Code 将结果直接在编辑器中显示为装订线装饰。失败的测试也将在编辑器中突出显示，带有显示测试运行错误消息和所有测试运行历史记录的查看视图。您可以按 Escape 关闭视图，可通过 `testing.automaticallyOpenPeekView` 配置项设置。

![image](/image/vscode/python/test-results.png)

另外，关于测试运行的输出，可以在 Python Test Log 输出面板找到。

![image](/image/vscode/python/python-test-log-output.png)

通过 `pytest-xdist` 可以支持并发测试，更多参见：[官方文档](https://code.visualstudio.com/docs/python/testing#_run-tests)

通过 `purpose` 字段设置为 `"debug-test"` 可以为测试的调试添加调试配置，例如

```json
{
    "name": "Python: Current File",
    "type": "python",
    "request": "launch",
    "program": "${file}",
    "purpose": ["debug-test"],
    "console": "integratedTerminal",
    "justMyCode": false
}
```

#### 发现项目的测试

VSCode Python 默认开启了自动测试发现特性（可通过 `python.testing.autoTestDiscoverOnSaveEnabled` 配置关闭）。

也可以通过测试浏览器的刷新按钮手动刷刷新测试。

![image](/image/vscode/python/test-explorer.png)

如果测试找不到，可能是测试目录没有 `__init__.py`，没有被识别成 Python 包。

如果有发现失败，可以通过 Python 输出面板查看具体原因

![image](/image/vscode/python/test-discovery-error.png)

#### 全部测试命令

| 命令名 | 描述 |
| --- | --- |
| **Python: Configure Tests** | 配置要与 Python 扩展一起使用的测试框架 |
| **Test: Clear All Results** | 清除所有测试状态，因为 UI 会在会话之间保留测试结果。 |
| **Test: Debug Failed Tests** | 调试在最近一次测试运行中失败的测试。 |
| **Test: Debug Last Run** | 调试在最近测试运行中执行的测试。 |
| **Test: Debug Test at Cursor** | 调试将光标集中在编辑器上的测试方法。类似于 **Python：调试测试方法...**在 2021.9 之前的版本上。 |
| **Test: Debug Tests in Current File** | 当前以编辑器为焦点的文件中的调试测试。 |
| **Test: Go to Next Test Failure** | 如果错误速览视图已打开，请打开并移动到资源管理器中失败的下一个测试的扫视视图。 |
| **Test: Go to Previous Test Failure** | 如果错误速览视图处于打开状态，请打开并移动到资源管理器中失败时上一个测试的扫视视图。 |
| **Test: Peek Output** | 打开失败的测试方法的错误速览视图。 |
| **Test: Refresh Tests** | 执行测试发现并更新测试资源管理器以反映任何测试更改、添加或删除。类似于**Python：在2021.9之前的版本上发现测试**。 |
| **Test: Rerun Failed Tests** | 运行在最近一次测试运行中失败的测试。类似于**Python：在2021.9之前的版本上运行失败的测试**。 |
| **Test: Rerun Last Run** | 调试在最近测试运行中执行的测试。 |
| **Test: Run All Tests** | 运行所有发现的测试。等效于 **Python：在 2021.9 之前的版本上运行所有测试**。 |
| **Test: Run Test at Cursor** | 运行测试方法，将光标聚焦在编辑器上。类似于**Python：在2021.9之前的版本上运行测试方法...**。 |
| **Test: Run Test in Current File** | 在当前以编辑器为焦点的文件中运行测试。等效于 **Python：在 2021.9 之前的版本上运行当前测试文件**。 |
| **Test: Show Output** | 打开包含所有测试运行详细信息的输出。类似于 **Python：在 2021.9 之前的版本上显示测试输出**。|
| **Testing: Focus on Test Explorer View** | 打开"测试资源管理器"视图。类似于 2021.9 之前版本的**测试：专注于 Python View**。|
| **Test: Stop Refreshing Tests** | 取消测试发现。|

#### 全部测试配置

VSCode 测试通用配置，按 `cmd + ,`，搜索 `Testing`

Python 扩展通用配置

| Setting  (python.testing.) | 默认值 | 描述 |
| --- | --- | --- |
| autoTestDiscoverOnSaveEnabled | `true` | 指定在保存测试文件时是启用还是禁用自动运行测试发现。更改此设置后，可能需要重新加载窗口才能应用该窗口。|
| cwd | null | 指定测试的可选工作目录。 |
| debugPort | `3000` | 用于调试单元测试的端口号。 |
| promptToConfigure | `true` | 指定在发现潜在测试时 VS Code 是否提示配置测试框架。 |

unittest 配置

| Setting (python.testing.) | 默认值 | 描述 |
| --- | --- | --- |
| unittestEnabled | `false` | 指定是否启用单元测试作为测试框架。应禁用 pytest 的等效设置。 |
| unittestArgs | `["-v", "-s", ".", "-p", "*test*.py"]` | 传递给 unittest 的参数，其中由空格分隔的每个元素都是列表中的单独项。有关默认值的说明，请参阅下文。 |

unittest 的默认参数如下：

* `-v` 设置 verbosity 级别的输出。删除此参数以获得更简单的输出。
* `-s .` 指定用于发现测试的起始目录。如果 `"test"` 文件夹中有测试，请将参数更改为 `-s test`（在参数数组中表示`"-s", "test"`）。
* `"-p *test*.py"` 是用于查找测试的发现模式。在本例中，它是包含单词 `test` 的任何 `.py` 文件。如果以不同的方式命名测试文件，例如将 `_test` 附加到每个文件名，请在数组的相应参数中使用类似 `"*_test.py"` 的模式。

若要在第一次失败时停止测试运行，请将快速失败选项 `"-f"` 添加到参数数组中。

关于 unittestArgs 更多参见 [unittest command-line interface](https://docs.python.org/3/library/unittest.html#command-line-interface)

pytest 配置

| Setting  (python.testing.) | 默认值 | 描述 |
| --- | --- | --- |
| pytestEnabled | `false` | 指定是否将 pytest 启用为测试框架。应禁用单元测试的等效设置。|
| pytestPath | `"pytest"` | 通往 pytest 的路径。如果 pytest 位于当前环境之外，请使用完整路径。|
| pytestArgs | `[]` | 传递给 pytest 的参数，其中由空格分隔的每个元素都是列表中的单独项。请参阅 [pytest 命令行选项](https://docs.pytest.org/en/latest/reference/reference.html#command-line-flags)。|

可以通过 `pytest.ini` 文件配置，更多参见 [pytest Configuration](https://docs.pytest.org/en/latest/reference/customize.html).

注意：如果安装了 `pytest-cov` 覆盖模块，则 VSCode 在调试时不会在断点处停止，因为 pytest-cov 使用相同的技术来访问正在运行的源代码。为防止此行为，请在调试测试时在 pytestArgs 中包含 `--no-cov`，或者通过将 `"env": {"PYTEST_ADDOPTS": "--no-cov"}` 添加到您的调试配置中。 （有关更多信息，请参阅 pytest-cov 文档中的[调试器和 PyCharm](https://pytest-cov.readthedocs.io/en/latest/debuggers.html)）

### 交互式 Python

VSCode 支持一个普通的 Python 文件提供 Jupyter Cell 一样的交互式能力。（本文关注的是与 Python 源代码文件有关的特性，更多关于  [Jupyter](https://marketplace.visualstudio.com/items?itemName=ms-toolsai.jupyter) 详细说明，后续会在数据分析专题中讲述）

#### Python 交互式文件

* 在后缀为 `py` 的文件，通过特殊注释进行单元格区分 `# %%`，那么这个文件就会被识别为 Python 交互式文件。

![image](/image/vscode/python/code-cells-01.png)

* 点击 Run Cell 会创建一个 Python 交互式窗口

![image](/image/vscode/python/code-cells-02.png)

* 识别为 Python 交互式文件可以支持如下快捷键，常见的为
    * `Ctrl+Enter` Run Cell
    * `Shift+Enter` Run Cell 并聚焦到下一个单元格，如果不存在将创建一个

* 更多快捷键，参见下表

| 命令 | 快捷键 |
| --- | --- |
| Python: Go to Next Cell | Ctrl+Alt+\] |
| Python: Go to Previous Cell | Ctrl+Alt+\[ |
| Python: Extend Selection by Cell Above | Ctrl+Shift+Alt+\[ |
| Python: Extend Selection by Cell Below | Ctrl+Shift+Alt+\] |
| Python: Move Selected Cells Up | Ctrl+; U |
| Python: Move Selected Cells Down | Ctrl+; D |
| Python: Insert Cell Above | Ctrl+; A |
| Python: Insert Cell Below | Ctrl+; B |
| Python: Insert Cell Below Position | Ctrl+; S |
| Python: Delete Selected Cells | Ctrl+; X |
| Python: Change Cell to Code | Ctrl+; C |
| Python: Change Cell to Markdown | Ctrl+; M |

#### Python 交互式窗

除了通过上文的方式创建交互是窗口，还可以通过 `>Jupyter: Create Interactive Window` 命令创建一个交互式窗口。该窗口支持能力

* 自动完成

![image](/image/vscode/python/interactive-window-intellisense.gif)

* Plot Viewer

![image](/image/vscode/python/plot-viewer.gif)

#### 变量和数据检查

* 变量浏览器

![image](/image/vscode/python/jupyter-variable-explorer.png)

* 变量数据视图

![image](/image/vscode/python/jupyter-data-viewer.png)

#### 其他 feature

* 连接到远端 Jupyter，通过 `Jupyter: Specify local or remote Jupyter server for connections` 命令选择，参见：[官方文档](https://code.visualstudio.com/docs/python/jupyter-support-py#_connect-to-a-remote-jupyter-server)
* Jupyter notebooks 和 Python 文件相互转换，参见：[官方文档](https://code.visualstudio.com/docs/python/jupyter-support-py#_connect-to-a-remote-jupyter-server)
* [Debug Jupyter notebook](https://code.visualstudio.com/docs/python/jupyter-support-py#_debug-a-jupyter-notebook)
* [Export a Jupyter notebook](https://code.visualstudio.com/docs/python/jupyter-support-py#_export-a-jupyter-notebook)

### 全部命令

|名称 | 说明 |
|----|-----|
`python.analysis.restartLanguageServer`| 重启 Language Server|
`python.clearPersistentStorage`| 清空扩展内部缓存 |
`python.clearWorkspaceInterpreter`| 清空工作区解释器配置 |
`python.configureTests` | 开始配置测试 |
`python.createTerminal`| 创建一个终端|
`python.enableLinting` | 启用 Lint |
`python.enableSourceMapSupport` | Enable Source Map Support For Extension Debugging|
`python.execInTerminal` | 在终端中运行 Python 文件 |
`python.debugInTerminal` | 调试 Python 文件 |
`python.execSelectionInDjangoShell` | 在 Django Shell 中执行选中内容 |
`python.execSelectionInTerminal` | 在 Python 中运行 Select/Line |
`python.goToPythonObject` | 转到 Python 对象|
`python.launchTensorBoard` | 启动 TensorBoard |
`python.refreshTensorBoard` | 刷新 TensorBoard |
`python.refreshTests` | Refresh Tests |
`python.refreshingTests` | 刷新测试|
`python.stopRefreshingTests` | 停止刷新测试|
`python.reportIssue` | Report Issue... |
`testing.reRunFailTests` | 重新运行失败的测试|
`python.runLinting` | Run Linting |
`python.setInterpreter` | 设置 Python 解释器|
`python.setLinter` | 选择 Lint |
`python.sortImports` | 对导入排序 |
`python.startREPL` | 开始 REPL |
`python.switchOffInsidersChannel` | 关闭 Insider|
`python.switchToDailyChannel` | 切换到预览体验成员每日频道|
`python.switchToWeeklyChannel` | 切换到预览体验成员每周频道|
`python.viewLanguageServerOutput` | Show Language Server Output |
`python.viewOutput` | 显示输出|

### 全部配置

> [VSCode Docs - Python settings reference](https://code.visualstudio.com/docs/python/settings-reference)

#### 通用配置

| Setting  (python.) | 默认值 | 描述 |
| --- | --- | --- |
| condaPath | `"conda"` | `conda` 可执行文件的路径。 |
| defaultInterpreterPath | `"python"` | Python 扩展首次为工作区加载时要使用的默认 Python 解释器的路径，或者包含 Python 解释器的文件夹的路径。可以使用 `"${workspaceFolder}"` 和 `"${workspaceFolder}/.venv"` 等变量。使用文件夹的路径允许使用项目的任何人在 `".venv"` 文件夹中创建适合其操作系统的环境，而不必指定与平台完全相关的路径。然后，`"settings.json"` 文件可以包含在源代码存储库中。**注意**：Python 扩展将不会应用或考虑为工作区选择解释器后对此设置所做的更改。同样，Python扩展不会自动添加或更改此设置。 |
| pipenvPath | `"pipenv"` | 用于激活的 pipenv 可执行文件的路径。 |
| disableInstallationCheck | `false` | 如果设置为 `"true"`，则在未安装 Python 解释器时禁用来自扩展的警告。在 macOS 上，还会禁用一条警告，如果您使用的是操作系统安装的 Python 解释器，则会显示该警告。通常建议在 macOS 上安装单独的解释器。 |
| venvFolders | `[]` | 创建的虚拟环境文件夹的路径。根据所使用的虚拟化工具，它可以是项目本身：`"${workspaceFolder}"`，也可以是并排放置的所有虚拟环境的单独文件夹：`"./envs"`、`"~/.virtualenvs"` 等。 |
| envFile | `"${workspaceFolder}/.env"` | 包含环境变量定义的文件的绝对路径。 |
| globalModuleInstallation | `false` | false 时使用 `"--user"` 命令行参数来安装包，true 是为全局环境中的所有用户安装包。使用虚拟环境时忽略。有关 --user 参数的详细信息，请参阅 [pip - 用户安装](https://pip.pypa.io/en/stable/user_guide/#user-installs)。 |
| poetryPath | `"poetry"` | 指定 [Poetry 依赖项管理器](https://poetry.eustace.io/) 可执行文件（如果已安装）的位置。默认假定可执行文件位于当前路径中。Python 扩展使用此设置在 Poetry 可用且工作区文件夹中有一个 `"poetry.lock"` 文件时安装包。 |
| terminal.launchArgs | `[]` | 执行 `>Python: Run Python File in Terminal` 等命令运行文件时提供给 Python 解释器的参数。注意，VSCode 在调试时会忽略此设置，调试是通过 `"launch.json"` 中的 `purpose` 为 `debug-in-terminal` 的配置的 |
| terminal.executeInFileDir | `false` |  执行 `>Python: Run Python File in Terminal` 是 WorkDir 是否在文件所在目录，默认 false 为在工作空间目录 |
| terminal.activateEnvironment | `true` | 创建新的终端时是否自动执行 `source xxx/bin/activate` |
| terminal.activateEnvInCurrentTerminal | `false` | 指定在激活 Python 扩展时，在已经创建的终端中执行 `source xxx/bin/activate` |
| logging.level | `error` | 指定扩展要执行的日志记录级别。在提供的信息级别不断增加的情况下，日志记录的可能级别为 off, error, warn, info, and debug |
| insidersChannel | `off` | 是否安装 insider 版本 |

#### 代码分析设置

Language Server 提供者设置

| Setting  (python.) | 默认 | 描述 |
| --- | --- | --- |
| languageServer | Default | Default （默认），当安装了 [Pylance](https://marketplace.visualstudio.com/items?itemName=ms-python.vscode-pylance) 时，将使用 Pylance，否则使用 Jedi；Jedi 使用 [jedi](https://github.com/davidhalter/jedi)；None 关闭智能感知|

#### Pylance 具体设置

| Setting  (python.analysis.)  | 默认 | 描述 |
| --- | --- | --- |
| typeCheckingMode | off | 指定要执行的类型检查分析的级别。可用值包括 off、basic 和 strict。当设置为 off 时，不进行类型检查分析；产生未解决的导入/变量诊断。当设置为基本非类型检查相关规则时（所有规则都关闭），以及使用基本类型检查规则。当设置为严格时，将使用最高错误严重性的所有类型检查规则（包括关闭和基本类别中的所有规则）。如果项目强制使类型[标注](https://docs.python.org/zh-cn/3/library/typing.html)，建议使用强 strict，否则使用 basic|
| diagnosticMode | openFilesOnly | 指定语言服务器针对问题分析哪些代码文件。可用的值为workspace 和openFilesOnly。 |
| stubPath | ./typings | 指定包含自定义类型 stub 的目录的路径。每个包的类型 stub 文件都应位于其自己的子目录中。 |
| autoSearchPaths | true | 指示是否根据一些预定义的名称（如 src）自动添加搜索路径。可用值为 true 和 false。 |
| extraPaths | \[\] | 为导入解析指定额外的搜索路径。路径应指定为字符串，当有多个路径时必须用逗号分隔。 `["path 1","path 2"]` |
| completeFunctionParens | false | 为函数调用自动完成添加括号。 |
| useLibraryCodeForTypes | true | 当未找到类型 stub 时，解析包的源代码类型。 |
| autoImportCompletions | true | 控制在完成中提供自动导入。 |
| diagnosticSeverityOverrides | {} | 允许用户覆盖单个诊断的严重性级别。对于每个规则，可用的严重性级别为错误（红色波浪线）、警告（黄色波浪线）、信息（蓝色波浪线）和无（规则禁用）。有关用于诊断严重性规则的键的信息，请参阅下面的诊断严重性规则部分。 |

> **Note:** 对于 Pylance 内测版，可以使用 `pylance.insidersChannel` 配置项进行体验

**诊断严重性规则**

本节详细介绍了可以使用 `"python.analysis.diagnosticSeverityOverrides"` 设置自定义的所有可用规则，如以下示例所示。

一个例子：

```
{
  "python.analysis.diagnosticSeverityOverrides": {
    "reportUnboundVariable": "information",
    "reportImplicitStringConcatenation": "warning"
  }
}
```

| 诊断规则 | 描述 |
| --- | --- |
| reportGeneralTypeIssues | 对一般类型不一致、不受支持的操作、参数/参数不匹配等的诊断。这涵盖了其他规则未涵盖的所有基本类型检查规则。它不包括语法错误。 |
| reportPropertyTypeMismatch | 对传递给 setter 的值的类型和 getter 返回的值的类型进行诊断。这种不匹配违反了属性的预期用途，这些属性的作用类似于变量。 |
| reportFunctionMemberAccess | 成员访问函数的诊断。 |
| reportMissingImports | 对没有相应导入的 python 文件或类型 stub 文件的导入进行诊断。 |
| reportMissingModuleSource | 没有相应源文件的导入的诊断。当找到类型 stub ，但找不到模块源文件时，会发生这种情况，这表明使用此执行环境时代码可能会在运行时失败。类型检查将使用类型 stub 完成。 |
| reportMissingTypeStubs | 对没有相应类型 stub 文件（类型化文件或自定义类型存根）的导入进行诊断。类型检查器需要类型存根以在分析中发挥最佳作用。 |
| reportImportCycles | 循环导入。这不是 Python 中的错误，但它们确实会减慢类型分析的速度，并且经常暗示架构分层问题。通常，应避免使用它们。 |
| reportUnusedImport | 未使用的导入。 |
| reportUnusedClass | 未使用的类。 |
| reportUnusedFunction | 未使用的函数。 |
| reportUnusedVariable | 未使用的变量。 |
| reportDuplicateImport | 重复导入。 |
| reportWildcardImportFromLibrary | 从外部库导入使用了通配符的诊断。 |
| reportOptionalSubscript | 尝试使用可选类型下标（索引）变量的诊断。 |
| reportOptionalMemberAccess | 尝试访问具有可选类型的变量成员的诊断。 |
| reportOptionalCall | 尝试调用具有可选类型的变量的诊断。 |
| reportOptionalIterable | 尝试使用可选类型作为可迭代值（例如，在 for 语句中）的诊断。 |
| reportOptionalContextManager | 尝试将 Optional 类型用作上下文管理器（作为 with 语句的参数）的诊断。 |
| reportOptionalOperand | 尝试使用可选类型作为二进制或一元运算符（如"+"、"=="、"or"、"not"）的操作数的诊断。 |
| reportUntypedFunctionDecorator | 诊断没有类型批注的函数修饰器。这些功能模糊了函数类型，破坏了许多类型分析特征。 |
| reportUntypedClassDecorator | 没有类型批注的类修饰器的诊断。这些会模糊类类型，破坏许多类型分析功能。 |
| reportUntypedBaseClass | 无法静态确定其类型的基类的诊断。这些会模糊类类型，破坏许多类型分析功能。 |
| reportUntypedNamedTuple | 使用"namedtuple"而不是"NamedTuple"时的诊断。前者不包含类型信息，而后者则包含类型信息。 |
| reportPrivateUsage | 诊断是否不正确地使用了私有或受保护的变量或函数。受保护的类成员以单个下划线"_"开头，只能由子类访问。私有类成员以双下划线开头，但不以双下划线结尾，并且只能在声明类中访问。如果在类外部声明的变量和函数的名称以单下划线或双下划线开头，并且无法在声明模块外部访问它们，则将其视为私有变量和函数。 |
| reportConstantRedefinition | 尝试重新定义名称为全大写且带有下划线和数字的变量的诊断。 |
| reportIncompatibleMethodOverride | 以不兼容的方式（参数数错误、参数类型不兼容或不兼容的返回类型）重写基类中同名方法的方法的诊断。 |
| reportIncompatibleVariableOverride | 对类变量声明的诊断，这些声明覆盖了与基类符号类型不兼容的基类中同名符号。 |
| reportInvalidStringEscapeSequence | 对字符串文本中使用的无效转义序列的诊断。Python 规范指示此类序列将在将来的版本中生成语法错误。 |
| reportUnknownParameterType | 对具有未知类型的函数或方法的输入或返回参数的诊断。 |
| reportUnknownArgumentType | 具有未知类型的函数或方法的调用参数的诊断。 |
| reportUnknownLambdaType | 对具有未知类型的 lambda 的输入或返回参数进行诊断。 |
| reportUnknownVariableType | 具有未知类型的变量的诊断。 |
| reportUnknownMemberType | 具有未知类型的类或实例变量的诊断。 |
| reportMissingTypeArgument | 诊断何时使用泛型类而不提供显式或隐式类型参数。 |
| reportInvalidTypeVarUse | 诊断函数签名中未正确使用类型变量。 |
| reportCallInDefaultInitializer | 对默认值初始化表达式中的函数调用进行诊断。此类调用可能会掩盖在模块初始化时执行的代价高昂的操作。 |
| reportUnnecessaryIsInstance | 诊断没有必要的 "isinstance" 或 "issubclass" 调用，此类调用通常表示编程错误。 |
| reportUnnecessaryCast | 诊断没有必要的类型转换 cast ，此类调用有时表示编程错误。 |
| reportAssertAlwaysTrue | 诊断 assert 始终为 true 语句。这可能表示编程错误。 |
| reportSelfClsParameterName | 诊断实例方法中缺少或命名错误的"self"参数和类方法中的"cls"参数。允许元类（从"类型"派生的类）中的实例方法对实例方法使用"cls"。 |
| reportImplicitStringConcatenation | Diagnostics for two or more string literals that follow each other, indicating an implicit concatenation. This is considered a bad practice and often masks bugs such as missing commas. |
| reportUndefinedVariable | 未定义变量的诊断。 |
| reportUnboundVariable | 未绑定和可能未绑定变量的诊断。 |
| reportInvalidStubStatement | 诊断不应出现在 stub 文件中的语句。 |
| reportUnusedCallResult | 其结果未被使用的调用表达式的诊断。 |
| reportUnsupportedDunderAll | 对 `__all__` 上执行的不受支持的操作的诊断。 |
| reportUnusedCoroutine | 对返回协程且其结果未被使用的调用表达式的诊断。 |

#### 自动完成配置

| Setting  (python.autoComplete.) | 默认值 | 描述 |
| --- | --- | --- |
| extraPaths | `[]` | 指定要为其加载自动完成数据的附加包的位置。 |

#### 格式化设置

| Setting (python.formatting.) | 默认值 | 描述 |
| --- | --- | --- |
| provider | `"autopep8"` | 指定要使用的格式化程序，`"autopep8"`、`"black"` 或 `"yapf"`。|
| autopep8Path | `"autopep8"` |  autopep8 路径|
| autopep8Args | `[]` | autopep8 参数|
| blackPath | `"black"` | blackPath 路径 |
| blackArgs | `[]` | blackArgs 参数|
| yapfPath | `"yapf"` | yapf 路径 |
| yapfArgs | `[]` | yapf 参数|

#### 重构之导入排序

| Setting (python.sortImports.) | 默认值 | 描述 |
| --- | --- | --- |
| path | `""` | isort script 路径|
| args | `[]` | isort 参数 |

#### Linting 设置

通用

| Setting (python.linting.) | 默认值 | 描述 |
| --- | --- | --- |
| enabled | `true` | 是否启用 Lint |
| lintOnSave | `true` | 是否保存文件时执行 Lint. |
| maxNumberOfProblems | `100` | 问题数限制 |
| ignorePatterns | `[".vscode/*.py", "**/site-packages/**/*.py"]` | 执行 Lint 时忽略的路径模式 |

Pylint

| Setting  (python.linting.) | 默认值 | 描述 |
| --- | --- | --- |
| pylintEnabled | `true` | 启用 Pylint |
| pylintArgs | `[]` | Pylint 命令行参数 |
| pylintPath | `"pylint"` | Pylint 路径 |
| pylintCategorySeverity.convention | `"Information"` | Pylint convention 类型消息映射到 VSCode 问题的类型|
| pylintCategorySeverity.refactor | `"Hint"` | Pylint refactor 类型消息映射到 VSCode 问题的类型|
| pylintCategorySeverity.warning | `"Warning"` | Pylint warning 类型消息映射到 VSCode 问题的类型 |
| pylintCategorySeverity.error | `"Error"` | Pylint error 类型消息映射到 VSCode 问题的类型 |
| pylintCategorySeverity.fatal | `"Error"` | Pylint fatal 类型消息映射到 VSCode 问题的类型 |

pycodestyle (pep8)

| Setting  (python.linting.) |  默认值 | 描述 |
| --- | --- | --- |
| pycodestyleEnabled | `false` | 启用 pycodestyle |
| pycodestyleArgs | `[]` | pycodestyle 命令行参数 |
| pycodestylePath | `"pycodestyle"` | pycodestyle 路径 |
| pycodestyleCategorySeverity.W | `"Warning"` | pycodestyle W 类型消息映射到 VSCode 问题的类型  |
| pycodestyleCategorySeverity.E | `"Error"` | pycodestyle E 类型消息映射到 VSCode 问题的类型  |

Flake8

| Setting  (python.linting.) | 默认值 | 描述 |
| --- | --- | --- |
| flake8Enabled | `false` | 启用 flake8 |
| flake8Args | `[]` | flake8 命令行参数 |
| flake8Path | `"flake8"` | flake8 路径 |
| flake8CategorySeverity.F | `"Error"` | flake8 F 类型消息映射到 VSCode 问题的类型  |
| flake8CategorySeverity.E | `"Error"` | flake8 E 类型消息映射到 VSCode 问题的类型  |
| flake8CategorySeverity.W | `"Warning"` |flake8 W 类型消息映射到 VSCode 问题的类型  |

mypy

| Setting  (python.linting.) | 默认值 | 描述 |
| --- | --- | --- |
| mypyEnabled | `false` | 启用 mypy |
| mypyArgs | `["--ignore-missing-imports", "--follow-imports=silent"]` | mypy 命令行参数 |
| mypyPath | `"mypy"` | mypy 路径|
| mypyCategorySeverity.error | `"Error"` | mypy error 类型消息映射到 VSCode 问题的类型  |
| mypyCategorySeverity.note | `"Information"` | mypy note 类型消息映射到 VSCode 问题的类型  |

pydocstyle

| Setting  (python.linting.) | 默认值 | 描述 |
| --- | --- | --- |
| pydocstyleEnabled | `false` | 启用 pydocstyle |
| pydocstyleArgs | `[]` | pydocstyle 命令行参数|
| pydocstylePath | `"pydocstyle"` |pydocstyle 路径 |

prospector

| Setting  (python.linting.) | 默认值 | 描述 |
| --- | --- | --- | --- |
| prospectorEnabled | `false` | 启用 prospector|
| prospectorArgs | `[]` | prospector 命令行参数|
| prospectorPath | `"prospector"` | prospector 路径|

pylama

| Setting  (python.linting.) | 默认值 | 描述 |
| --- | --- | --- |
| pylamaEnabled | `false` | 启用 pylama   |
| pylamaArgs | `[]` | pylama 命令行参数 |
| pylamaPath | `"pylama"` | pylama 路径|

#### 测试设置

通用测试

| Setting  (python.testing.) |  默认值 | 描述 |
| --- | --- | --- |
| cwd | null | 指定测试的可选工作目录。 |
| promptToConfigure | `true` | 指定在发现潜在测试时 VS Code 是否提示配置测试框架。 |
| debugPort | `3000` |用于调试单元测试的端口号。|
| autoTestDiscoverOnSaveEnabled | `true` | 指定在保存测试文件时是启用还是禁用自动运行测试发现。 |

unittest 配置

| Setting  (python.testing.) | 默认值 | 描述 |
| --- | --- | --- |
| unittestEnabled | `false` | 是否启用 unittest |
| unittestArgs | `["-v", "-s", ".", "-p", "*test*.py"]` | 命令行参数 |

pytest 配置

| Setting  (python.testing.) | 默认值 | 描述 |
| --- | --- | --- |
| pytestEnabled | `false` | 是否启用 pytest|
| pytestPath | `"pytest"` | pytest 路径|
| pytestArgs | `[]` | pytest 命令行参数 |

#### 预定义变量

Python 扩展设置支持预定义的变量。与常规 VS Code 设置类似，变量使用 `${变量名称}` 语法。具体而言，该扩展支持以下变量：

* **`${cwd}`** - 启动时任务运行者的当前工作目录
* **`${workspaceFolder}`** - 在 VS 代码中打开的文件夹的路径
* **`${workspaceRootFolderName}`** - 在 VSCode 中打开的文件夹的名称，不带任何斜杠 （/）
* **`${workspaceFolderBasename}`** - 在 VSCode 中打开的文件夹的名称，不带任何斜杠 （/）
* **`${file}`** - 当前打开的文件
* **`${relativeFile}`** - 当前打开的文件相对于 `"${workspaceFolder}"` 的相对路径
* **`${relativeFileDirname}`** - 当前打开的文件所在目录相对于 `"${workspaceFolder}"` 的相对路径
* **`${fileBasename}`** - the current opened file's basename
* **`${fileBasenameNoExtension}`** - 当前打开的文件去掉文件扩展名后的名字
* **`${fileDirname}`** - 当前打开的文件的目录名称
* **`${fileExtname}`** - 当前打开的文件扩展名
* **`${lineNumber}`** - 活动文件中当前选定的行号
* **`${selectedText}`** - 活动文件中当前选定的文本
* **`${execPath}`** - the path to the running VSCode executable

有关预定义变量和示例用法的其他信息，请参阅 [VSCode 官方文档](/docs/editor/variables-reference)。

### Pylance

具体参见： [Pylance](https://marketplace.visualstudio.com/items?itemName=ms-python.vscode-pylance)

### Jedi

[不支持 Python 2.7](https://code.visualstudio.com/docs/python/environments#_limited-support-for-python-27)，更多参见：[Github](https://github.com/davidhalter/jedi)

## 场景和说明

### VSCode Python 最佳配置

VSCode Python 多数情况下使用默认配置即可，如下两个配置可以酌情选择

```json
{
    // Python 配置
    "python.analysis.typeCheckingMode": "basic",  // 指定要执行的类型检查分析的级别。未强制要求类型标注的项目使用 basic ；对项目代码质量有要求的使用 strict
    "python.analysis.completeFunctionParens": true,  // 为函数调用自动完成添加括号
}
```

### 开发 Django 项目

开发 Django 项目和普通 Python 主要区别在于调试配置，`"django": true`，对 HTML 模板调试的支持。

`.vscode/launch.json`

```json
{
    "name": "Python: Django",
    "type": "python",
    "request": "launch",
    "program": "${workspaceFolder}/manage.py",
    "args": [
        "runserver",
    ],
    "django": true
},
```

此外，VSCode Python 还提供了 `python.execSelectionInDjangoShell` 命令，直接在 Django Shell 中执行选中内容

更多关于 Django 开发手册，参见：[VSCode 官方文档](https://code.visualstudio.com/docs/python/tutorial-django)

### 开发 Flask 项目

开发 Flask 项目和普通 Python 主要区别在于调试配置，`"jinja": true`，对 HTML 模板调试的支持，以及使用 flask module 启动项目。

`.vscode/launch.json`

```json
{
    "name": "Python: Flask",
    "type": "python",
    "request": "launch",
    "module": "flask",
    "env": {
        "FLASK_APP": "app.py",
        "FLASK_ENV": "development",
        "FLASK_DEBUG": "0"
    },
    "args": [
        "run",
        "--no-debugger",
        "--no-reload"
    ],
    "jinja": true
},
```

更多关于  Flask 开发手册，参见：[VSCode 官方文档](https://code.visualstudio.com/docs/python/tutorial-flask)

### 远程调试

远端，通过 `python -m debugpy --listen 5678 ./myscript.py` 命令启动调试器

VSCode 添加如下配置

```json
{
  "name": "Python: Attach",
  "type": "python",
  "request": "attach",
  "connect": { // 根据情况替换
    "host": "localhost",
    "port": 5678
  }
}
```

详见：

* [VSCode Docs - Python Debugging - Command Line Debugging](https://code.visualstudio.com/docs/python/debugging#_command-line-debugging)
* [VSCode Docs - Python Debugging - Debugging by attaching over a network connection](https://code.visualstudio.com/docs/python/debugging#_command-line-debugging)

### 调试时依赖库断点不命中

调试配置添加： `"justMyCode": false`

### Pyright、Pylance、Python三个VSCode扩展关系

在 VSCode 中，默认情况下为：

* Python 的 Language Server 的实现依赖 Pylance
* Pylance 自身有自己的特性，并依赖 Pyright 库（注意不是 Pyright 扩展）

### 为快速运行调试打开的文件以及测试添浏览器添加自定义配置

针对如下情况也可以添加自定义配置

* 1、通过如下方式快速运行调试打开的文件

![image](/image/vscode/python/quick-run-or-debug-pythonfile.png)

* 2、通过 `python.execInTerminal` 以及 `python.debugInTerminal` 运行或调试当前文件
* 3、通过测试浏览器运行或调试测试

![image](/image/vscode/python/test-explorer-run-all-tests.png)

这几种情况，可以通过如下方式进行自定义配置

* 1 和 2 的运行情况，通过 `python.terminal.executeInFileDir` 以及 `python.terminal.launchArgs` 指定 `cwd` 以及 `args`；通过 `python.envFile` 配置环境变量
* 1 和 2 的调试情况，通过 `.vscode/launch.json` 中添加调试配置，并通过 `purpose` 字段添加 `debug-in-terminal` 将该配置项应用到调试中
* 3 的情况，通过 `.vscode/launch.json` 中添加调试配置，并通过 `purpose` 字段添加 `debug-test` 将该配置项应用到调试中

### Jedi 和 Pyright 能力对比

暂时未找到相关内容

### 如何开发 Python 2.7 项目

只要不使用 Jedi，即可很好的支持 Python 2.7 项目

### 如何让 IDE 更了解你的项目

在项目中强制使用标注（[typing](https://docs.python.org/zh-cn/3/library/typing.html)），同时启用强类型检查：

```json
{
    "python.analysis.typeCheckingMode": "strict",
}
```

更多参见

* https://github.com/python/typing
* https://github.com/python/typeshed

### 如何解决 ImportError

参见：[一文彻底理解 Python 环境](/posts/understand-the-python-environment/)。

### 完全开源的 VSCode Python 开发方案

目前 VSCode 使用了 Pylance 作为其默认 Language Server，但是 Pylance 是闭源的。因此，无法在非官方 VSCode 中使用 Pylance。

#### 只开发 Python3 项目

安装扩展

* [Python](https://marketplace.visualstudio.com/items?itemName=ms-python.python) - [MIT 许可证](https://marketplace.visualstudio.com/items/ms-python.python/license)
* [Jupyter](https://marketplace.visualstudio.com/items?itemName=ms-toolsai.jupyter) - [MIT 许可证](https://marketplace.visualstudio.com/items/ms-toolsai.jupyter/license)

VSCode 配置添加配置，兼用默认（如果安装了 Pylance，需禁用之）

```json
"python.languageServer": "Jedi"
```

#### 同时支持 Python2 和 Python3 项目（推荐）

> 该方案使用 Pyright 替换 Pylance，可以获得 Pylance 类似的体验

安装扩展

* [Python](https://marketplace.visualstudio.com/items?itemName=ms-python.python) - [MIT 许可证](https://marketplace.visualstudio.com/items/ms-python.python/license)
* [Jupyter](https://marketplace.visualstudio.com/items?itemName=ms-toolsai.jupyter) - [MIT 许可证](https://marketplace.visualstudio.com/items/ms-toolsai.jupyter/license)
* [Pyright](https://marketplace.visualstudio.com/items?itemName=ms-pyright.pyright) - [MIT 许可证](https://github.com/microsoft/pyright/blob/main/LICENSE.txt)

VSCode 配置添加配置，兼用默认（如果安装了 Pylance，需禁用之）

```json
"python.languageServer": "None"
```

## Reference

* [VSCode Docs - Language Python](https://code.visualstudio.com/docs/languages/python)
* [VSCode Docs - Python Tutorial](https://code.visualstudio.com/docs/python/python-tutorial)
* [VSCode Docs - Python Editing Code](https://code.visualstudio.com/docs/python/editing)
* [VSCode Docs - Python Linting](https://code.visualstudio.com/docs/python/linting)
* [VSCode Docs - Python Debugging](https://code.visualstudio.com/docs/python/debugging)
* [VSCode Docs - Python Environments](https://code.visualstudio.com/docs/python/environments)
* [VSCode Docs - Python Testing](https://code.visualstudio.com/docs/python/testing)
* [VSCode Docs - Python Interactive](https://code.visualstudio.com/docs/python/jupyter-support-py)
* [VSCode Docs - Python Django Tutorial](https://code.visualstudio.com/docs/python/tutorial-django)
* [VSCode Docs - Python Flask Tutorial](https://code.visualstudio.com/docs/python/tutorial-flask)
* [VSCode Docs - Python Settings reference](https://code.visualstudio.com/docs/python/settings-reference)
