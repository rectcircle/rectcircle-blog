---
title: Python开发工具
date: 2017-09-13T18:32:03+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/93
  - /detail/93/
tags:
  - python
---

## 一、IPython

***

### 0、安装

Python2的安装，使用如下命令（只能安装5.x版本），因为Python2被废弃了

```bash
# python2
pip install ipython==5.8.0

# python3
pip install ipython
```

### 1、常用的内建指令

* `%doctest_mode`：自动去除示例代码中的`>>>`提示符，不用手动删除

### 2、重新加载模块

在进行代码试验中，修改代码后需要重新导入

```py
>>> import mymode
>>> from imp import reload  
>>> reload(mymode)  
```

### 3、自动重新载入已修改文件

```py
%load_ext autoreload
%autoreload 2
```

自动执行

```bash
ipython profile create
~/.ipython/profile_default/ipython_config.py
```

```
c.InteractiveShellApp.exec_lines = [ '%load_ext autoreload', '%autoreload 2' ]
```

## 二、VSCode开发Python

### 安装python插件包

https://marketplace.visualstudio.com/items?itemName=donjayamanne.python-extension-pack

#### 安装`pylint`及`pylint-django`

```bash
# python3
pip install pylint pylint-django
# python2
pip install pylint pylint-django==0.11.1
```

### 基本配置（settings.json）

```json
    "[python]":{
        "editor.insertSpaces": true,
        "editor.tabSize": 4,
    },
		"python.pythonPath": "/usr/local/bin/python",
		"python.linting.pylintEnabled": true,
    "python.linting.pylintArgs": [
        "--load-plugins=pylint_django",
        "--disable=all",
        "--enable=F,E,unreachable,duplicate-key,unnecessary-semicolon,global-variable-not-assigned,unused-variable,binary-op-exception,bad-format-string,anomalous-backslash-in-string,bad-open-mode",
        //http://pylint-messages.wikidot.com/all-codes
        "--disable=C0301", // Line too long
				"python.jediEnabled": false,
    ],
```

### 项目结构

```
.
├── README.md
├── logs
├── manage.py
├── xxx
│   ├── __init__.py
│   ├── __init__.pyc
│   ├── common
│   ├── conf
│   ├── middlewares
│   ├── utils
│   └── website
├── requirements.txt
└── venv


```

### 注意事项

* 工作空间目录不要有`__init__.py`文件，**如果有的话pylint将报错**
* python代码写在工作空间中的一个目录（包）中

## 三、virtualenv

```bash
# 创建一个环境 （使用系统包）
virtualenv --system-site-packages venv
# 激活环境
source venv/bin/activate
# 退出环境
deactivate
# 指定 python 版本
virtualenv -p /usr/bin/python2.7
```

Mac Python2 和 Python3 共存： https://www.jianshu.com/p/3b12ca94ef0c
