---
title: Jupyter Notebook使用教程
date: 2017-09-19T16:27:50+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/96
  - /detail/96/
tags:
  - python
---

>[在服务器端升级python并安装Jupyter]( http://www.qiuqingyu.cn/2017/05/15/%E5%9C%A8%E6%9C%8D%E5%8A%A1%E5%99%A8%E7%AB%AF%E5%8D%87%E7%BA%A7python%E5%B9%B6%E5%AE%89%E8%A3%85Jupyter/)
> [Jupyter 官网](http://jupyter.org/)

## 一、安装

***

### 1、使用Anaconda的conda安装

[详细参见](/detail/95)

完成后，Jupyter自动安装完毕

### 2、pip安装

```bash
pip3 install --upgrade pip
pip3 install jupyter
```

## 二、服务器安全配置

### 1、默认运行和命令行参数

#### （1）运行

如果是本地使用，直接运行

```bash
jupyter notebook
```

他会在默认浏览器打开 `http://localhost:8888`

**持久化运行**

```bash
nohup jupyter notebook &
```

关闭

```bash
ps -ef|grep jupyter
kill -9 +进程号
```

#### （2）命令行参数

```bash
jupyter notebook --port 9999 #指定运行端口
jupyter notebook --no-browser #后台运行不开浏览器
jupyter notebook --help #获得帮助
```

### 2、配置登录密码和证书

> centos6.5环境

#### （1）生成配置文件

```bash
jupyter notebook --generate-config
```

#### （2）生成密码信息

```bash
ipython
from notebook.auth import passwd
passwd()
# 输出类似于 sha1:67c9e60bb8b6:9ffede0825894254b2e042ea597d771089e11aed 字符串
```

将其记录

#### （3）获取证书

没有ssl证书临时生成

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:1024 -keyout mykey.key -out mycert.pem
```

或者去云服务平台申请免费证书，例如[腾讯云ssl](https://console.qcloud.com/ssl)

#### （4）编辑配置文件

```py
# 配置密码
c.NotebookApp.password = u'sha1:67c9e60bb8b6:9ffede0825894254b2e042ea597d771089e11aed'

# 配置证书目录
c.NotebookApp.certfile = u'/absolute/path/to/your/certificate/mycert.pem'
c.NotebookApp.keyfile = u'/absolute/path/to/your/certificate/mykey.key'

# 登录ip全部允许
c.NotebookApp.ip = '*'
c.NotebookApp.open_browser = False #开启服务不打开服务器

# 设置访问端口
c.NotebookApp.port = 9999
```

## 三、其他配置

***

### （1）安装Jupyter插件管理器

```bash
conda install -c conda-forge jupyter_contrib_nbextensions
```

### （2）安装jupyterlab

```bash
conda install -c conda-forge jupyterlab
```

运行

```bash
jupyter lab
```

### （3）修改默认工作空间

```bash
# 打开配置文件
c.NotebookApp.notebook_dir = ''
```

## 四、使用指南

***

### 1、快捷键

* `Shift-Enter`: run cell
* `Ctrl-Enter`: run cell in-place
* `Alt-Enter`: run cell, insert below
* `Esc` and `Enter`: Command mode and edit mode

### 2、更换主题字体

#### （1）更换主题

安装主题插件

```bash
pip install --upgrade jupyterthemes -i https://pypi.tuna.tsinghua.edu.cn/simple
```

查看主题列表

```bash
jt -l
```

更换主题

```bash
jt -t onedork -T -N
```

重启

```bash
ps aux | grep jupyter
kill -9 xxx
nohup /root/anaconda3/bin/jupyter notebook --allow-root &
```

#### （2）更换字体

```bash
vim ~/.jupyter/custom/custom.css
```

输入以下命令：替换所有行第一个monospace为consolas

```bash
:1，$s/monospace/consolas
```

### 3、安装其他内核

```bash
ipython kernel install --name python2
```
