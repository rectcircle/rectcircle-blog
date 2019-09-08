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

scala 大版本之间不兼容（比如2.12和2.11的jar包不兼容，太坑了），所以被设计成每个项目都有一个scala sdk的副本（😂），所以全局可以不安装scala。

### 2、安装SBT

> 实验版本 1.2.8

[mac](https://www.scala-sbt.org/download.html)

```bash
brew install sbt@1
```

sbt 每次运行都需要执行如下阶段：

* 检查当前路径下的project目录下配置的sbt版本
  * 如果不存在将使用环境变量中的sbt运行包
* 检查 `~/.sbt` 下是否有该版本的sbt依赖
  * 如果没有则会进入sbt预加载阶段，标准输出为： `[info] [launcher] getting org.scala-sbt sbt x.x.x (this may take some time)`，还有一个日志文件可以用来追查问题： `~/.sbt/boot/update.log`
* 检查全局插件是否有安装或更新
  * 如果需要下载，标准输出为： `[info] Loading global plugins from /home/xxx/.sbt/1.0/plugins`，可能还存在日志文件在 `ls /tmp/sbt*`
* 然后执行你的命令，此刻才会下载项目的依赖

SBT国内是非常缓慢的，原因如下：

* 需要下载sbt依赖的scala运行库
* 需要下载sbt依赖的其他库
* 下载这些依赖之前需要下载大量类似于`pom.xml`的大量小文件，似乎sbt不支持http1.1的Pipelining机制
* 在国内访问国外网络众所周知的慢
* sbt工具本身又没有做多线程下载优化，所有下载都是串行的（猜测）
* 如果你配置了多个仓库，将会按照顺序依次尝试，前一个失败，后面再尝试，这样反而会延长下载时间
* 在sbt初始化自身时，不支持对302重定向，而国内现存唯一公开maven镜像仓库阿里云maven镜像使用的302方式的cdn，所以并无法加速，反而更慢。需要注意的是在下载项目依赖时，`coursier` 插件是支持的。

sbt自身依赖的jar包和sbt项目依赖的jar包都存放在 `~/.ivy2` 目录下。同时sbt相关的全局配置在 `~/.sbt` 目录下

### 3、初始化SBT

如果你能做到全局fq，请不要做任何配置，直连国外maven和ivy2仓库是最好的选择，针对这种情况，在下面的步骤会有说明

如果你没法做到全局fq，请按照如下步骤操作，这样能相对更快的完成sbt初始化（但是依旧很慢）。

#### （1）配置 coursier 插件

coursier 插件的作用： 解决sbt依赖串行下载的问题。该插件将使用并行冗余下载的方式提高速度，当你配置多个仓库是，会同时进行下载尝试，如果某一个下载成功，再杀掉其他的。但是需要注意的是：

* 下载sbt自身时，该插件不会启动此时，命令行显示：`[info] [launcher] getting org.scala-sbt sbt x.x.x (this may take some time)`
* 下载sbt插件时（包括coursier自身），该插件不会启动，命令行显示：`[info] Loading global plugins from /home/xxx/.sbt/1.0/plugins`

操作步骤： `vim ~/.sbt/1.0/plugins/coursier.sbt`

```scala
addSbtPlugin("io.get-coursier" % "sbt-coursier" % "latest.integration")
```

> 该步骤建议可以全局fq的用户也进行进行配置

#### （2）自定义代理仓库

```
[repositories]
  local
  maven-local: file:///$HOME/.m2/repository
  huawei-central: https://mirrors.huaweicloud.com/repository/maven/
  repox-maven: http://repox.gtan.com:8078/
  repox-ivy: http://repox.gtan.com:8078/, [organization]/[module]/(scala_[scalaVersion]/)(sbt_[sbtVersion]/)[revision]/[type]s/[artifact](-[classifier]).[ext]
  maven-central
  bintray-ivy: http://dl.bintray.com/typesafe/ivy-releases/, [organization]/[module]/(scala_[scalaVersion]/)(sbt_[sbtVersion]/)[revision]/[type]s/[artifact](-[classifier]).[ext], bootOnly
  typesafe: http://repo.typesafe.com/typesafe/ivy-releases/, [organization]/[module]/(scala_[scalaVersion]/)(sbt_[sbtVersion]/)[revision]/[type]s/[artifact](-[classifier]).[ext], bootOnly
  sonatype-oss-releases
  sonatype-oss-snapshots
```

* sbt 使用两个架构的代码仓库： maven 和 ivy2
* `local` 表示先查找本地 `ivy2` 路径，一般为 `$HOME/.ivy2/cache`，不需要明确配置
* maven-local 尝试查找本地的maven仓库，注意`$HOME`为你的家目录
* huawei-central 使用华为的maven仓库代理
  * 参见 https://mirrors.huaweicloud.com/
  * 为什么不使用 阿里云？原因是阿里云会302跳转到 http 的对象存储里面，参见： https://github.com/sbt/sbt/issues/5059
* repox-maven 和 repox-ivy 参见：http://centaur.github.io/repox/
* 剩下的为兜底

> 如果你有全局fq，可以忽略此步骤

#### （3）完成 sbt 自身及依赖下载

在命令行键入

```bash
sbt help
```

同时观察 `$HOME/.sbt/boot/update.log` 日志情况，可以根据情况调整 `repositories` 配置

### 4、测试新建项目

```bash
sbt new scala/hello-world.g8 --debug
```

* 最好加debug，因为此步骤特别长，不输出日志，让人抓狂

进入项目并测试

```bash
cd hello-world-template
sbt run
```

测试依赖较多的一个模板

```bash
sbt new akka/akka-quickstart-scala.g8
cd akka-quickstart-scala
sbt compile
```

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
