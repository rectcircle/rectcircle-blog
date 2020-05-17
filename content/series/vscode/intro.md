---
title: "介绍"
date: 2020-04-15T00:34:41+08:00
draft: false
toc: true
comments: true
weight: 50
summary: 本文将介绍个人更换开发工具的过程和 VSCode 相对其他工具的优势，及相关资源站点
---

### 历程

从开始学习 Coding 开始，我深入使用过如下几种通用的编辑器/IDE （至于其他专有的IDE比如 Dev C++，不做讨论）

* Eclipse
* Visual Studio
* IntelliJ 系列 (IDEA 等 包括 Android Studio)
* Sublime
* VSCode

根据个人体验上来说，最完美的就是 VSCode。

目前在工作/生活中，所有的与文本文件编辑相关的内容，均采用 VSCode 进行，包括但不限于如下场景：

* 工作计划/每日TODO
* 博客撰写
* Java 项目开发
* React 前端项目开发
* Python 开发
* Scala 开发
* Spark SQL 开发
* Rust 开发（学习阶段）

### 优势

接下来按照如下几个维度来对 VSCode 的优势进行分析

* 市场指标
* 开源
* 性能
* 外观
* 核心功能

#### 市场指标

> 截止: 2020年4月

在 https://pypl.github.io/IDE.html 榜单中，VSCode 排名在第 4。较去年2019年4月份上涨 2.2 %。

从趋势上看 自 2015 年发布起，VSCode 持续增长，且增长势头良好。

在VSCode 的 github 仓库，star 数量达到 `94.3k`。

Sublime 属于个人开发的收费软件。

在 [Stack Overflow Developer Survey Results 2019](https://insights.stackoverflow.com/survey/2019) 中 VSCode 在 [Most Popular Development Environments](https://insights.stackoverflow.com/survey/2019#technology-_-most-popular-development-environments) 榜单中排名第一

#### 开源

完全开源，开源协议为 MIT，与之类似的就只有 Eclipse了。

IntelliJ 属于部分开源，其专业版属于收费软件。

VSCode 的主要贡献团队 是微软，近几年微软在开源项目上的投入有目共睹。

团队负责人：[Erich Gamma](https://zh.wikipedia.org/zh/%E5%9F%83%E9%87%8C%E5%B8%8C%C2%B7%E4%BC%BD%E7%91%AA) JUnit 作者之一，《设计模式》作者之一， Eclipse 架构师。2011 加入微软，在瑞士苏黎世组建团队开发基于 web 技术的编辑器，也就是后来的 monaco-editor。VSCode 开发团队从 10 来个人开始，早期成员大多有 Eclipse 开发团队的背景。

#### 性能

**启动速度**

VSCode 从设计上之处就追求极致的性能，本质上是一个轻量级 编辑器，因此可以在性能较弱的设备中实现秒级打开。不同于 Atom，其扩展机制保证了在安装大量扩展的情况下，VSCode仍然有较快的启动速度。在启动速度上可能只有 Sublime 可以与之相提并论。

相较于 Eclipse 、 Visual Studio 和 IntelliJ 之类的重量级 IDE来说，其启动速度是绝对的领先。

**空间占用**

目前（2020-04-11），Mac端的Zip文件大小仅 82.9MB，app文件大小，200MB左右。在空间方面，只有 Sublime 可以与之相提并论。

相较于 Eclipse 、 Visual Studio 和 IntelliJ 之类的重量级 IDE来说可谓非常小

**响应速度**

由于轻量级的特性（基于 Electron），响应速度上非常快。而基于 Java 开发的 UI（Eclipse、IntelliJ 系列），响应缓慢，有时会遇到卡顿。

#### 外观

VSCode 在 UI 上相对来说比较现代化，各种第三方主题几乎可以满足所有 程序员对 UI 上的执念。

扩展虽然无法修改 VSCode 的 UI 结构（仅可以更改主题，未来，正在预览阶段的 [Custom text editors](https://code.visualstudio.com/api/extension-guides/custom-editors) 可以做更深层次的定制），看似定制程度低，但从另一方面看，这显著降低了用户在UI认知上的心智成本，也就是说，一旦梳理了VSCode交互的套路，所有扩展程序的表现都是可以预测的。

#### 核心功能

VSCode 的核心竞争力是设计优良架构和扩展机制

* 极强的扩展能力，几乎编辑器的所有方面都可以进行扩展
* 丰富的扩展商店，你想要的几乎都有，即使没有自己动手实现一个呗
* 扩展与编辑器内核的松耦合（通过RPC进行通信），因此可以实现独一份的 [Remote Develop](https://code.visualstudio.com/docs/remote/remote-overview)
* 扩展几乎不会拖慢启动速度
* UI 基于 Electron
    * 原则上支持所有平台
    * 因为 Electron 本质上是基于 Chromium，因此可以实现 在浏览器上进行开发的 [Visual Studio Online](https://code.visualstudio.com/docs/remote/vsonline)

在扩展开发技术栈方面，原生支持 通过 JavaScript（TypeScript）开发，因此可以享受 前端生态的红利。对于其他开发语言，可以通过语言服务器的方式进行扩展开发。

#### 总结

* 性能优秀
* 外观现代化，定制化程度高
* 丰富强大扩展机制
* 独有的全功能的远程开发与浏览器开发能力

### 站点

* [官方网站](https://code.visualstudio.com/)
* [官方文档](https://code.visualstudio.com/docs)
* [扩展商店](https://marketplace.visualstudio.com/VSCode)
* [极客教程-VSCode](https://geek-docs.com/vscode) （推荐）
