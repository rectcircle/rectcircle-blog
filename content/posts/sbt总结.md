---
title: "Sbt总结"
date: 2019-07-09T11:13:57+08:00
draft: false
toc: true
comments: true
tags:
  - scala
---

## 一、基本使用

参见 [Scala开发环境搭建](scala开发环境搭建/)

## 二、基本结构

### 1、sbt项目结构

* project 目录
  * build.properties 一般包含sbt的版本信息 比如 `sbt.version=1.2.8`
  * xxx.sbt 插件安装 比如 `addSbtPlugin("io.get-coursier" % "sbt-coursier" % "1.0.3")`
* build.sbt 核心配置文件

### 2、build.sbt基本内容

```sbt
// Scala 版本
scalaVersion := "2.12.8"

// 名字空间
name := "hello-world"
organization := "ch.epfl.scala"
version := "1.0"

// 依赖
libraryDependencies += "org.typelevel" %% "cats-core" % "1.6.0"
libraryDependencies += "org.apache.derby" % "derby" % "10.4.1.3"
libraryDependencies ++= Seq(
  "com.typesafe.akka" %% "akka-actor" % "2.5.23",
  "com.typesafe.akka" %% "akka-testkit" % "2.5.23" % Test
)
```

## 三、配置相关语法

### 1、自定义仓库（解决者Resolver）

两个Key：

* `resolvers := Seq()` 或者 `resolvers += ...` 此操作将不会覆盖全局配置的resolver
* `externalResolvers := Seq()` 此操作将会覆盖全局配置的resolver

```scala
// 例子：使用阿里云仓库
externalResolvers := Seq(
	"nexus" at "https://maven.aliyun.com/repository/public/",
	Resolver.url("nexus-ivy", url("https://maven.aliyun.com/repository/public/"))(Resolver.ivyStylePatterns)
)
```

### 2、依赖管理

基本语法

```scala
// 针对Scala的库 需要使用 %% 自动填充scala版本信息
libraryDependencies += groupID %% artifactID % version % scope config
// 针对Java的库 使用 %
libraryDependencies += groupID % artifactID % version % scope config

// 排除某些传递依赖
libraryDependencies += "com.alibaba.otter" % "canal.client" % "1.0.12" excludeAll(
	ExclusionRule(organization = "javax.jms", name = "jsm"),
	ExclusionRule(organization = "com.sun.jdmk", name = "jmxtools"),
	ExclusionRule(organization = "com.sun.jmx", name = "jmxri"),
	ExclusionRule(organization = "org.springframework", name = "spring"),
	ExclusionRule(organization = "org.apache.zookeeper", name = "zookeeper"),
	ExclusionRule(organization = "com.github.sgroschupf", name = "zkclient"),
	ExclusionRule(organization = "commons-io", name = "commons-io"),
	ExclusionRule(organization = "commons-lang", name = "commons-lang"),
	ExclusionRule(organization = "com.google.guava", name = "guava"),
	ExclusionRule(organization = "org.slf4j", name = "slf4j-api"),
	ExclusionRule(organization = "org.slf4j", name = "jcl-over-slf4j")
)
```
