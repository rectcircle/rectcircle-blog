---
title: python开发工具
date: 2017-09-13T18:32:03+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/93
  - /detail/93/
tags:
  - python
---

## 目录
* [一、IPython](#一、IPython)
	* [1、常用的内建指令](#1、常用的内建指令)
	* [2、重新加载模块](#2、重新加载模块)
* [二、VSCode开发Python](#二、VSCode开发Python)


## 一、IPython
********************************
### 1、常用的内建指令
* `%doctest_mode`：自动去除示例代码中的`>>>`提示符，不用手动删除

### 2、重新加载模块
在进行代码试验中，修改代码后需要重新导入
```py
>>> import mymode
>>> from imp import reload  
>>> reload(mymode)  
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




