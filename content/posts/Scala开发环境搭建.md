---
title: "Scala开发环境搭建"
date: 2019-06-07T22:59:45+08:00
draft: false
toc: true
comments: true
tags:
  - scala
---

## 一、安装、配置及开发环境

### 1、安装scala（可选）

[mac](https://www.scala-lang.org/download/)

```bash
brew install scala
```

scala 版本之间不兼容，所以被设计成每个项目都有一个scala sdk的副本（😂），所以全局可以不安装scala。

### 2、安装SBT

> 实验版本 1.2.8

[mac](https://www.scala-sbt.org/download.html)

```bash
brew install sbt@1
```

### 3、新建HelloWorld项目

> 出现网络问题先看下一步

```bash
sbt new scala/hello-world.g8
```

国内网络问题可以先克隆下来再新建

```
git clone https://github.com/scala/hello-world.g8.git
sbt new file://$(pwd)/hello-world.g8
```

以上两种方案，第一次执行要等待10分钟以上（实测15分），除非你有一个好的VPN或者能fanqiang的路由器（可以缩短到5分钟完成😂，在我的美国的VPS上1分钟完成😭）。卡顿在 `[info] Set current project to xxx` 输出上。

### 4、国内网络问题

> 一定确保前3步顺利完成，否者将会一直卡顿。SBT是比NPM还难用的工具，一定要按步骤做。

配置国内镜像，`vim ~/.sbt/repositories`

```ini
[repositories]
  local
  aliyun: https://maven.aliyun.com/repository/public/
  aliyun-ivy: https://maven.aliyun.com/repository/public/, [organization]/[module]/(scala_[scalaVersion]/)(sbt_[sbtVersion]/)[revision]/[type]s/[artifact](-[classifier]).[ext]
```

添加 coursier 插件，`vim ~/.sbt/1.0/plugins/coursier.sbt`
这一步很重要，如果没有这个插件，速度会巨慢

```scala
addSbtPlugin("io.get-coursier" % "sbt-coursier" % "1.0.3")
```

测试akka项目

```bash
sbt new akka/akka-quickstart-scala.g8
cd akka-quickstart-scala
sbt
```

> 阿里云不宕机的情况下应该还是很快的(阿里云的镜像也会宕机)
> SBT真得难用！

### 5、命令行测试

```bash
cd hello-world-template
sbt
compile
run
```

### 6、VSCode 开发环境

#### （1）安装如下插件

* [Scala Syntax (official)](https://marketplace.visualstudio.com/items?itemName=scala-lang.scala)
* [Scala (Metals)](https://marketplace.visualstudio.com/items?itemName=scalameta.metals)

#### （2）配置使用本地sbt

```json
{
  "metals.sbtScript": "/usr/local/bin/sbt"
}
```

#### （3）使用VSCode打开项目

```bash
# 似乎使用自定义仓库将无法完成
mv ~/.sbt/repositories ~/.sbt/repositories.bak
code ./
```

点击 `Import build` 按钮，等待2~3分钟即可加载完成，当`build.sbt`更新后

特性：

* 支持提示跳转
* 不支持debug
