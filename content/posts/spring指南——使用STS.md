---
title: spring指南——使用STS
date: 2017-04-11T22:06:12+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/61
  - /detail/61/
tags:
  - Java
---

> https://spring.io/guides/gs/sts/
> 本指南将引导您使用Spring Tool Suite（STS）构建的入门指南。
> STS就是一个基于eclipse开发的用于开发spring项目的IDE


## 目录
* [1、你需要构建的什么](#1、你需要构建的什么)
* [2、你需要什么](#2、你需要什么)
* [3、安装STS](#3、安装STS)
* [4、Importing a Getting Started guide](#4、Importing a Getting Started guide)
* [5、总结](#5、总结)


### 1、你需要构建的什么
您将选择一个Spring指南并将其导入到Spring Tool Suite中。然后，您可以阅读指南，编写代码并运行项目。

### 2、你需要什么
* 大约15分钟
* [Spring Tool Suite (STS)](https://spring.io/tools/sts/all)
* JDK 6 或更新

### 3、安装STS
如果您尚未安装STS，请访问上面的链接。下载、解压并运行（可以看做eclipse）

### 4、Importing a Getting Started guide
在STS启动并运行后，点击`File -> Import Spring Getting Started Content`。
弹出向导将为您提供从Spring网站搜索并选择已发布指南。您可以从列表中选择，也可以输入搜索词来即时过滤选项。

> 当提供即时搜索结果时，标准应用于标题和描述。支持通配符。

您可以选择Maven或Gradle作为使用的构建系统。

您还可以决定是否勾选 `initial` code set, `complete` code set。对于大多数项目，`initial` code set是一个空项目，使您可以根据指南通过复制粘贴来完善。`complete` code set是项目中已经包含指南中的所有代码，您可以将您的工作与指南进行比较，并查看差异。最后，您的STS将打开浏览器显示对应的指南页面。这将让您通过指导工作，而不必离开STS。

为了试验以上所述，我们将键入`rest `进入搜索框。然后选择 Consuming Rest， 选择使用 Maven 构建， 勾选  initial 和 complete code sets，最后选择打开指南页面

这样，STS将在您的工作空间中创建两个新项目，包含 Consuming Rest 的代码（因为你选择了initial 和 complete code sets）并打开了 [Consuming Rest](https://spring.io/guides/gs/consuming-rest)页面

到这里，您可以浏览指南和代码文件了。


### 5、总结
恭喜！您已经安装了Spring Tool Suite，并导入了Consuming Rest入门指南，并打开了一个浏览器选项卡来进行浏览。

想去写一个新的指南或者为我们的指南做贡献？请检出我们的[contribution guidelines](#https://github.com/spring-guides/getting-started-guides/wiki)。

> 所有的指南使用 ASLv2开源协议 和 [Attribution, NoDerivatives creative commons license](https://creativecommons.org/licenses/by-nd/3.0/) 来发布


