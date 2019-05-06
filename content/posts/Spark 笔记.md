---
title: Spark 笔记
date: 2018-12-28T10:56:52+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/184
  - /detail/184/
tags:
  - 大数据
---

## 目录

* [一、安装配置](#一、安装配置)
	* [1、前提条件](#1、前提条件)
	* [2、安装](#2、安装)

## 一、安装配置

***

[主参考](https://blog.csdn.net/thinktothings/article/details/85013203)
[参考1](https://blog.csdn.net/lbship/article/details/84622707)
[参考2](https://www.cnblogs.com/lijingchn/p/5573898.html)
[参考3](https://www.cnblogs.com/tijun/p/7561718.html)

### 1、前提条件

* JDK 1.8
* Hadoop 集群方式安装
* Scala 2.11.x

#### （1）安装Scala

下载[scala](https://www.scala-lang.org/download/2.11.12.html)，并安装
```bash
su
wget https://downloads.lightbend.com/scala/2.11.12/scala-2.11.12.tgz
tar zxvf scala-2.11.12.tgz
mkdir /usr/scala
mv scala-2.11.12 /usr/scala/
cd /usr/scala/
ln -s /usr/scala/scala-2.11.12 default
vim /etc/profile
# Scala
export SCALA_HOME=/usr/scala/default
export PATH="$SCALA_HOME/bin:$PATH"
```


### 2、安装

http://spark.apache.org/downloads.html

选择下载没有hadoop包的版本

#### （1）下载解压

```bash
# 重要：su 到hadoop运行的用户
wget https://archive.apache.org/dist/spark/spark-2.4.0/spark-2.4.0-bin-without-hadoop.tgz
sudo mkdir /usr/spark
sudo chown xxx:xxx /usr/spark
tar zxvf spark-2.4.0-bin-without-hadoop.tgz
mv spark-2.4.0-bin-without-hadoop /usr/spark/
cd /usr/spark/
ln -s /usr/spark/spark-2.4.0-bin-without-hadoop default
cd default/conf
```

#### （2）配置

环境变量`sudo vim /etc/profile`

```bash
# Spark
export SPARK_HOME=/home/spark/default
export PATH=$SPARK_HOME/bin:$PATH
```

编辑Spark环境`cp spark-env.sh.template spark-env.sh && vim spark-env.sh`

```bash
# 由于ssh执行脚本环境变量会失效，所以需要在此重新加载环境变量
export PATH=/usr/local/bin:/usr/bin
source /etc/profile
export SPARK_DIST_CLASSPATH=$(hadoop classpath)
export JAVA_HOME=/usr/java/default   #Java环境变量
export SCALA_HOME=/usr/scala/default #SCALA环境变量
export SPARK_WORKING_MEMORY=512m  #每一个worker节点上可用的最大内存

export SPARK_MASTER_HOST=hadoop-master #master节点主机名
SPARK_MASTER_PORT=7077            # master 通信端口,worker和master通信端口
SPARK_MASTER_WEBUI_PORT=8080      # master SParkUI用的端口

export HADOOP_HOME=/usr/hadoop/default  #Hadoop路径
export HADOOP_CONF_DIR=$HADOOP_HOME/etc/hadoop #Hadoop配置目录
export SPARK_WORKER_CORES=1           #每个节点多少核
export SPARK_WORKER_INSTANCES=1     #每台机器上开启的worker节点的数目
```

编辑集群情况`cp slaves.template slaves && vim slaves`

```bash
hadoop-slave1
hadoop-slave2
```

验证

```bash
spark-shell
```

#### （3）分发到slave节点

使用scp工具

#### （4）启动关闭spark

```bash
sbin/start-all.sh
sbin/stop-all.sh
```

#### （5）验证

在各个节点输入`jps`命令。可以看到`Master`或者`Worker`输出

访问Master节点8080端口`http://192.168.3.20:8080/`

将看到两个worker

