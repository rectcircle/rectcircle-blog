---
title: Anaconda用于科学计算的Python发行版
date: 2017-09-19T13:42:19+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/95
  - /detail/95/
tags:
  - python
---

### 1、centos6.5安装

#### （0）python升级到3.6.x

下载

```bash
wget https://www.python.org/ftp/python/3.6.2/Python-3.6.2.tgz
# 使用国内源
wget http://mirrors.sohu.com/python/3.6.2/Python-3.6.2.tgz
```

解压

```bash
tar -vxf Python-3.6.2.tgz
cd Python-3.6.2
```

准备工作

```bash
yum install zlib-devel openssl-devel sqlite-devel
vi ./Modules/Setup
```

找到`#zlib zlibmodule.c -I$(prefix)/include -L$(exec_prefix)/lib -lz`去掉注释

编译安装

```bash
make && make install
```

替换原来的软链接

```bash
mv /usr/bin/python /usr/bin/python2
ln -s /opt/python3.6.2/bin/python3 /usr/bin/python
ln -s /opt/python3.6.2/bin/pip3 /usr/bin/pip
ln -s /opt/python3.6.2/bin/easy_install-3.6 /usr/bin/easy_install
```

修复yum

```python
vim /usr/bin/yum
```

#### （1）下载地址

https://www.anaconda.com/download/

#### （2）安装

```bash
wget https://repo.continuum.io/archive/Anaconda3-4.4.0-Linux-x86_64.sh
chmod 766 Anaconda3-4.4.0-Linux-x86_64.sh
./Anaconda3-4.4.0-Linux-x86_64.sh
```

### 2、配置

#### （1）检查安装

```bash
echo 'export PATH="~/anaconda3/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

检查是否正确

```bash
conda --version
```

#### （2）配置国内镜像

```bash
# 添加Anaconda的TUNA镜像
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/free/
# TUNA的help中镜像地址加有引号，需要去掉

# 设置搜索时显示通道地址
conda config --set show_channel_urls yes
```

### 3、Conda环境管理

#### （1）创建python环境

```bash
conda create --name python35 python=3.5
```

#### （2）激活环境

```bash
activate python35 # for Windows
source activate python35 # for Linux & Mac
```

#### （3）查看所有环境

```bash
conda info -e
```

#### （4）取消激活

```py
deactivate python35 # for Windows
source deactivate python35 # for Linux & Mac
```

#### （5）删除已有环境

```py
# 删除一个已有的环境
conda remove --name python35 --all
```

### 4、Conda的包管理

```py
# 安装scipy
conda install scipy
# conda会从从远程搜索scipy的相关信息和依赖项目，对于python 3.4，conda会同时安装numpy和mkl（运算加速的库）

# 查看已经安装的packages
conda list
# 最新版的conda是从site-packages文件夹中搜索已经安装的包，不依赖于pip，因此可以显示出通过各种方式安装的包

# 查看某个指定环境的已安装包
conda list -n python34

# 查找package信息
conda search numpy

# 安装package
conda install -n python34 numpy
# 如果不用-n指定环境名称，则被安装在当前活跃环境
# 也可以通过-c指定通过某个channel安装

# 更新package
conda update -n python34 numpy

# 删除package
conda remove -n python34 numpy

# 更新conda，保持conda最新
conda update conda

# 更新anaconda
conda update anaconda

# 更新python
conda update python
# 假设当前环境是python 3.4, conda会将python升级为3.4.x系列的当前最新版本
```
