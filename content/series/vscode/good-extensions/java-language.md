---
title: "Java 语言"
date: 2021-12-29T19:40:51+08:00
draft: false
toc: true
comments: true
weight: 1600
summary: 阅读本章节，可以了解到如何使用 VSCode 开发 Java 语言项目。
---

## 导读

VSCode 对 Java 的支持主要由 [Extension Pack for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack) 提供，该扩展包包含如下扩展：

* [Language Support for Java™ by Red Hat](https://marketplace.visualstudio.com/items?itemName=redhat.java) - [Eclipse Public License - v 2.0](https://marketplace.visualstudio.com/items/redhat.java/license)
* [Debugger for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-debug) - [MIT License](https://marketplace.visualstudio.com/items/vscjava.vscode-java-debug/license)
* [Test Runner for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-test) - [MIT License](https://marketplace.visualstudio.com/items/vscjava.vscode-java-test/license)
* [Maven for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-maven) - [MIT License](https://marketplace.visualstudio.com/items/vscjava.vscode-maven/license)
* [Project Manager for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-dependency) - [MIT License](https://marketplace.visualstudio.com/items/vscjava.vscode-java-dependency/license)
* [Visual Studio IntelliCode](https://marketplace.visualstudio.com/items?itemName=VisualStudioExptTeam.vscodeintellicode) - 闭源 [许可证](https://marketplace.visualstudio.com/items?itemName=VisualStudioExptTeam.vscodeintellicode)

社区还提供了如下常用的 Java 扩展：

* [Spring Boot Extension Pack](https://marketplace.visualstudio.com/items?itemName=Pivotal.vscode-boot-dev-pack) - [Eclipse Public License - v 1.0](https://github.com/spring-projects/sts4/blob/main/license.txt)
    * [Spring Boot Tools](https://marketplace.visualstudio.com/items?itemName=Pivotal.vscode-spring-boot) - [Eclipse Public License - v 1.0](https://marketplace.visualstudio.com/items/Pivotal.vscode-spring-boot/license)
    * [Spring Initializr Java Support](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-spring-initializr) - [MIT License](https://marketplace.visualstudio.com/items/vscjava.vscode-spring-initializr/license)
    * [Spring Boot Dashboard](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-spring-boot-dashboard) - [MIT License](https://marketplace.visualstudio.com/items/vscjava.vscode-spring-boot-dashboard/license)
* [Gradle for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-gradle) - [MIT License](https://marketplace.visualstudio.com/items/vscjava.vscode-gradle/license)
* [Bazel](https://marketplace.visualstudio.com/items?itemName=BazelBuild.vscode-bazel) - [Apache License 2.0](https://marketplace.visualstudio.com/items/BazelBuild.vscode-bazel/license)
* [Community Server Connectors](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-community-server-connector) (for Apache Felix, Karaf, Tomcat, Jetty, etc) - [Eclipse Public License - v 2.0](https://marketplace.visualstudio.com/items/redhat.vscode-community-server-connector/license)
* [Server Connector](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-server-connector) (for Red Hat Servers, e.g. Wildfly) - [Eclipse Public License - v 2.0](https://marketplace.visualstudio.com/items/redhat.vscode-server-connector/license)
* [Extension Pack for MicroProfile](https://marketplace.visualstudio.com/items?itemName=MicroProfile-Community.vscode-microprofile-pack) - [Apache License 2.0](https://marketplace.visualstudio.com/items/MicroProfile-Community.vscode-microprofile-pack/license)
    * [Tools for MicroProfile](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-microprofile) - [Apache License 2.0](https://marketplace.visualstudio.com/items/redhat.vscode-microprofile/license)
    * [MicroProfile Starter](https://marketplace.visualstudio.com/items?itemName=MicroProfile-Community.mp-starter-vscode-ext) - [Apache License 2.0](https://marketplace.visualstudio.com/items/MicroProfile-Community.mp-starter-vscode-ext/license)
    * [Generator for MicroProfile Rest Client](https://marketplace.visualstudio.com/items?itemName=MicroProfile-Community.mp-rest-client-generator-vscode-ext) - [Eclipse Public License - v 2.0](https://marketplace.visualstudio.com/items/MicroProfile-Community.mp-rest-client-generator-vscode-ext/license)
* [Quarkus](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-quarkus) - [Apache License 2.0](https://marketplace.visualstudio.com/items/redhat.vscode-quarkus/license)
* [CheckStyle](https://marketplace.visualstudio.com/items?itemName=shengchen.vscode-checkstyle) - [LGPL-3.0 License](https://marketplace.visualstudio.com/items/shengchen.vscode-checkstyle/license)
* [SonarLint](https://marketplace.visualstudio.com/items?itemName=SonarSource.sonarlint-vscode) - [LGPL-3.0 License](https://marketplace.visualstudio.com/items/SonarSource.sonarlint-vscode/license)
* [Lombok Annotations Support for VS Code](https://marketplace.visualstudio.com/items?itemName=GabrielBB.vscode-lombok) - [MIT License](https://marketplace.visualstudio.com/items/GabrielBB.vscode-lombok/license)
* [Java P3C Checker](https://marketplace.visualstudio.com/items?itemName=Rectcircle.vscode-p3c) - [MIT License](https://marketplace.visualstudio.com/items/Rectcircle.vscode-p3c/license)
* [Java Decompiler](https://marketplace.visualstudio.com/items?itemName=dgileadi.java-decompiler) - 无开源许可证
* [Java Properties](https://marketplace.visualstudio.com/items?itemName=ithildir.java-properties) - [MIT License](https://marketplace.visualstudio.com/items/ithildir.java-properties/license)

本文将介绍在使用 VSCode 开发 Java 项目时，如上扩展提供提供了那些能力、以及提供了那些配置项。

## 特性速览

* 帮助中心
* JDK 配置
* 项目管理
* 构建工具
* 代码浏览和编辑（自动完成、代码片段、符号搜索、调转定义、查找引用、查找实现、调用层次、类型层次）
* 重构、代码生成和快速修复
* 格式化和 Lint
* 运行和调试
* 测试
* 框架支持
    * Java EE Server
    * Spring Boot
    * Quarkus 和 MicroProfile
    * Lombok

## 快速开始

> [VSCode Docs - Language Java](https://code.visualstudio.com/docs/languages/java#_install-visual-studio-code-for-java)

* 未安装过 VSCode / JDK 的设备可以点击下方链接一键安装，VSCode、JDK 和 Java VSCode 扩展包
    * [Install the Coding Pack for Java - Windows](https://aka.ms/vscode-java-installer-win)
    * [Install the Coding Pack for Java - macOS](https://aka.ms/vscode-java-installer-mac)
* 手动安装
    * 安装 JDK 11 +，参见 [jdk.java.net](https://jdk.java.net/)
    * [安装 VSCode](https://code.visualstudio.com/download)
    * 打开 VSCode，安装 [Extension Pack for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack) 扩展包
* 使用 VSCode 打开一个 Maven / Gradle 项目
* Enjoy it!

## 使用指南

### 帮助中心

> 特性提供扩展：[Extension Pack for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack) （v0.20.0）

VSCode Java 提供了一个好用的可视化帮助中心，通过 `>Java: help center` 命令可以进入。该页面提供：

* 创建或打开一个项目
* 打开 Java Tour
* General 标签页，提供一些常用的环境行管的配置
* Spring 标签页，提供一些关于 Spring 的一些配置
* Student 标签页，提供一些教学资料

### JDK 配置

VSCode Java 支持 Java 1.5 到 Java 17 版本的 JDK。

在 VSCode Java 中， JDK 路径的查找规则为：

* `java.jdt.ls.java.home` 配置项
* `java.home` (deprecated, use java.jdt.ls.java.home instead)
* `JDK_HOME` 环境变量
* `JAVA_HOME` 环境变量
* `PATH` 环境变量（路径应以包含 bin 文件夹的父文件夹结尾。示例路径：如果 `/usr/lib/jvm/java-11/bin` 中存在 bin，则使用 `/usr/lib/jvm/java-11`）

此 JDK 将用于启动 Java Language Server。默认情况下，将用于编译项目。

如果需要针对不同的 JDK 版本编译项目，建议您在用户设置中配置 `java.configuration.runtimes` 属性，例如：

```json
{
    "java.configuration.runtimes": [
        {
            "name": "JavaSE-1.8",
            "path": "/path/to/jdk-8",
        },
        {
            "name": "JavaSE-11",
            "path": "/path/to/jdk-11",
        },
        {
            "name": "JavaSE-14",
            "path": "/path/to/jdk-14",
            "default": true // 打开独立 Java 文件时将使用默认运行时。
        },
    ]
}
```

⚠ 对于通用版本，仅仅在 `java.configuration.runtimes` 中定义 JavaSE-11 是不足以让 vscode-java 启动的，java.jdt.ls.java.home（或者它的任何替代环境变量）仍然需要指向一个有效的 JDK 11 位置。

更多参见：[Wiki](https://github.com/redhat-developer/vscode-java/wiki/JDK-Requirements)

### 项目管理

> [VSCode Docs - Java - Project Manager](https://code.visualstudio.com/docs/java/java-project)
>
> 特性提供扩展：[Project Manager for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-dependency) （v0.18.9） 和 [Extension Pack for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack) （v0.20.0）

#### 支持的项目类型

VSCode Java 支持如下几种类型的 Java 项目

* 无构建工具的项目
* Eclipse 项目
* Maven 项目
* Gradle 项目

#### Project View

打开一个 Java 项目后，在 Explorer 视图，可以看到 Java Projects 视图。

* 在该视图，是一个树结构，树的顶层是打开的工作空间包含的项目，每个项目包含如下内容
    * 项目源码
    * JDK 源码
    * 依赖的 Jar 包及其源码

![image](/image/vscode/java/projectmanager-overview.png)

在右上角的工具按钮栏提供了一些关于项目快捷操作。

* `+` 快速创建一个 Java 项目（命令为：`>Java: Create Java Project...`）

![image](/image/vscode/java/projectmanager-createproject.png)

* `|->` 导出到 Jar 文件，快速创建一个 Jar 包 （命令为：`>java: export jar...`）

![image](/image/vscode/java/exportjar.gif)

* `🔄` 刷新项目视图 （命令为：`>java: refresh`）
* `折叠` 折叠树
* `...` 溢出菜单
    * 切换层级展示/平行展示
    * 打开/关闭编辑器关联
    * 构建工作空间
    * 清理工作空间 （命令为：`>java: clean java language server workspace`）
    * Configure Java Runtime （命令为：`>Java: Configure Java Runtime`）
    * Configure Classpath （命令为：`>Java: Configure classpath`）

![image](/image/vscode/java/overflow-button.png)

右键项目/包/类型，可以呼出上下文菜单。

![image](/image/vscode/java/context-menu.png)

#### 配置项目运行时

通过 `java.configuration.runtimes` 配置项可以配置 VSCode Java 的运行时。

```json
{
    "java.configuration.runtimes": [
        {
            "name": "JavaSE-1.8",
            "path": "/usr/local/jdk1.8.0_201"
        },
        {
            "name": "JavaSE-11",
            "path": "/usr/local/jdk-11.0.3",
            "sources" : "/usr/local/jdk-11.0.3/lib/src.zip",
            "javadoc" : "https://docs.oracle.com/en/java/javase/11/docs/api",
            "default":  true
        },
        {
            "name": "JavaSE-12",
            "path": "/usr/local/jdk-12.0.2"
        },
        {
            "name": "JavaSE-13",
            "path": "/usr/local/jdk-13"
        }
    ]
}
```

其中 `"default": true` 表示该 JDK 将作为无构建工具项目的默认运行时。

另外，可以通过 `>Java: Configure Java Runtime` 命令查看和配置当前项目运行时。

![image](/image/vscode/java/configure-project-runtime.png)

通过 `>Java: Install New JDK` 可以快速下载一个 JDK 的安装包。

![image](/image/vscode/java/download-jdk.png)

通过 `>Java: Configure Classpath` 可以快速配置无构建工具的项目的 Classpath，如果是 Maven 或者 Gradle 的项目，则是只读的。

![image](/image/vscode/java/configure-classpath.png)

当 VSCode Java 出现问题时，可以通过 `>Java: Clean Java Language Server Workspace` 重新初始化工作空间。

#### 依赖管理

* 针对 Maven 项目，可以点击下图 `+` 快速搜索依赖，并添加到 pom.xml 文件中

![image](/image/vscode/java/add-maven-dependency.png)

* 针对 无构建工具项目，可以点击下图 `+` / `-` 快速添加删除本地磁盘的 jar 包到 classpath 中（本质上是修改 `java.project.referencedLibraries` 配置项）

![image](/image/vscode/java/manage-referenced-libraries.png)

* 关于 `java.project.referencedLibraries` 配置项的一些例子

```json
// 简单添加
"java.project.referencedLibraries": [
    "library/**/*.jar",
    "/home/username/lib/foo.jar"
]
// 包括和排除以及源代码路径
"java.project.referencedLibraries": {
    "include": [
        "library/**/*.jar",
        "/home/username/lib/foo.jar"
    ],
    "exclude": [
        "library/sources/**"
    ],
    "sources": {
        "library/bar.jar": "library/sources/bar-src.jar"
    }
}
```

#### 语言服务器模式

通过 `java.server.launchMode` 可以配置 VSCode Java 的语言服务器的模式

* `Hybrid` 混合模式 （默认）先以轻量级模式打开工作区。如果您的工作区包含未解析的 Java 项目，系统将询问您是否切换到标准模式。如果选择 “稍后”，它将保持轻量模式。您可以单击状态栏上的服务器模式图标手动切换到标准模式。
* `Standard` 标准模式
* `LightWeight` 轻量级模式（消耗资源小，但是能力有限）

#### 状态栏

状态栏使用不同的图标指示当前工作区处于哪种模式。

* 🚀 - 轻量级模式
* 🔄 - 正在以标准模式打开的工作区
* 👍 - 标准模式

切换到标准模式方法如下：

![image](/image/vscode/java/switch-to-standard.gif)

### 构建工具

#### 无构建工具项目

VSCode Java 支持无构建工具的 Java 项目，下方有一个例子（通过 `>Java: Create Java Project...` 命令）

```
.
├── .vscode
│   └── settings.json
├── README.md
├── bin
│   └── App.class
├── lib
└── src
    └── App.java
```

其中 `.vscode/settings.json` 内容为

```json
{
    "java.project.sourcePaths": ["src"],
    "java.project.outputPath": "bin"
}
```

#### Maven

> [VSCode Docs - Java - Build Tools](https://code.visualstudio.com/docs/java/java-build#_maven)
>
> 特性提供扩展：[Maven for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-maven) （v0.34.2）

* 使用 VSCode 直接打开包含 pom.xml 的目录，即可导入 Maven 项目，并激活 Maven 扩展
* Maven 项目中可以键入未在 POM 中声明的依赖的符号时，Hover 在符号上，点击 Resolve unknown type 可以快速搜索并将依赖添加到 POM 中

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/maven-resolve-unknown-type.mp4" type="video/mp4">
</video>

* 提供对 `pom.xml` 的智能提示和检查

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/maven-pom-editing.mp4" type="video/mp4">
</video>

* Effective POM （合并父 POM，含义参见：[stackoverflow](https://stackoverflow.com/questions/26114768/what-are-the-difference-between-pom-xml-and-effective-pom-in-apache-maven/26114868)）

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/maven-effective-pom.mp4" type="video/mp4">
</video>

* 通过 `>Maven: Add a Dependency` 命令，交互式的搜索添加依赖（同样可以同通过 Java Projects 视图，Maven Dependencies 子树 `+` 号按钮添加依赖）

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/maven-add-dependency.mp4" type="video/mp4">
</video>

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/maven-add-dependency-2.mp4" type="video/mp4">
</video>

* 通过资源管理器侧边栏 -> Maven 区域右击项目，可以快速展示依赖树视图

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/maven-dependency-tree.mp4" type="video/mp4">
</video>

* 执行 Maven 命令和目标：资源管理器侧边栏 -> Maven 区域，右击项目，可以运行目标和命令

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/maven-run.mp4" type="video/mp4">
</video>

* 可以通过如下方式查看 maven 命令的执行历史
    * `>Maven: History` 命令
    * 资源管理器侧边栏 -> Maven 区域，右击项目，选择 History 菜单项

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/maven-history.mp4" type="video/mp4">
</video>

* 通过 `maven.terminal.favorites` 配置项可以定义一些常用 maven 目标和命令的快捷方式。然后在，资源管理器侧边栏 -> Maven 区域，右击项目，选择 Favorites... 菜单项

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/maven-favorite-command.mp4" type="video/mp4">
</video>

* 资源管理器侧边栏 -> Maven 区域，展开项目，选择 Plugin，即可浏览所有 Plugin 提供的目标

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/maven-plugin-goal.mp4" type="video/mp4">
</video>

* 调试项目中 Maven Plugin，向工作空间同时加入普通项目和 Maven Plugin 项目，在 Maven Plugin 项目中添加断点，资源管理器侧边栏 -> Maven 区域，展开项目，选择 Plugin，右击选择 Debug，即可快速 Debug Maven Plugin 项目

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/debug-maven-plugin-goals.mp4" type="video/mp4">
</video>

* 根据 Maven Archetype 创建一个 Java 项目，入口有如下几个
    * 资源管理器侧边栏 -> Maven 区域，标题区域的 `+` 号
    * 通过 `>Java: Create Java Project` 命名
    * 资源管理器在一个目录上右击，选择： `Create Maven Project` 菜单项

![image](/image/vscode/java/create-maven-project.png)

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/maven-archetype-command.mp4" type="video/mp4">
</video>

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/maven-archetype-folder.mp4" type="video/mp4">
</video>

#### Gradle

> [VSCode Docs - Java - Build Tools](https://code.visualstudio.com/docs/java/java-build#_gradle)
>
> 特性提供扩展：[Gradle for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-gradle)（v3.9.0）

暂不包括 Android。该扩展为 Gradle 构建提供了一个可视化界面（侧边栏），可以使用此界面查看 Gradle 任务和项目依赖项，或者将 Gradle 任务作为 VSCode Task 运行。该扩展还提供了更好的 Gradle 构建配置文件编写体验，包括语法突出显示、错误报告和自动完成。

* 使用 VSCode 直接打开包含 Gradle 配置文件的目录，即可导入 Gradle 项目，并激活 Gradle 扩展，然后即可点击 Activity Bar 的 Gradle 图标打开 Gradle 界面

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/gradle-tasks.mp4" type="video/mp4">
</video>

* Gradle 界面提供了 Pinned Task 视图。通过在 Gradle 界面浏览视图，右击一个任务，选择 Pin Task 菜单项即可 Pin Task 到 Pinned Task 视图中

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/gradle-pinned-recent-tasks.mp4" type="video/mp4">
</video>

* Gradle 页面通过浏览视图可以查看依赖项

![image](/image/vscode/java/gradle-dependencies.png)

* Gradle 页面 还可以管理 Gradle Deamon

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/gradle-daemons.mp4" type="video/mp4">
</video>

* Gradle 扩展提供了 gradle 配置文件的语法高亮、大纲、错误报告、智能提示（包括依赖和版本列表的提示）的能力

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/gradle-auto-completion.mp4" type="video/mp4">
</video>

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/gradle-dependency-completion.mp4" type="video/mp4">
</video>

更多参见：[Wiki](https://github.com/redhat-developer/vscode-java/wiki/Gradle-Support)

#### Bazel

参见：[Bazel](https://marketplace.visualstudio.com/items?itemName=BazelBuild.vscode-bazel)

### 代码浏览和编辑

> [VSCode Docs - Java - Navigate and Edit](https://code.visualstudio.com/docs/java/java-editing)
>
> 特性提供扩展：[Language Support for Java™ by Red Hat](https://marketplace.visualstudio.com/items?itemName=redhat.java) （v1.2.0） 和 [Visual Studio IntelliCode](https://marketplace.visualstudio.com/items?itemName=VisualStudioExptTeam.vscodeintellicode) （v1.2.15）

* 搜索**工作空间**类/函数/变量等符号： `⌘T` 或 `⌘P` 输入 `#`

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/search-in-workspace.mp4" type="video/mp4">
</video>

* 搜索**当前文件**类/函数/变量等符号： `⌘P` 输入 `@`

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/search-in-file.mp4" type="video/mp4">
</video>

* Peek 定义： `⌥F12` 或 光标处右键点选 `Peek Definition`
* 跳转到定义： `F12` 或 光标处右键点选 `Go to Definition`，
* 快速跳转到函数的父类实现： 鼠标 hover 在函数上，点击 Go to Super Implementation

![image](/image/vscode/java/goto-super.png)

* Peek 调用层次： 函数上右击点选 `Peek > Peek Call Hierarchy`

![image](/image/vscode/java/call-hierarchy.png)

* 展示调用层次： 函数上右击点选 `Show Call Hierarchy`

![image](/image/vscode/java/call-hierarchy.gif)

* 类型层次： 类和接口上右击点选 `Show Type Hierarchy`

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/type-hierarchy.mp4" type="video/mp4">
</video>

* 通过命令查看类型关系信息
    * `>Types: Show supertypes` 查找当前类型的父类和实现的接口
    * `>Types: Show subtypes` 查找当前类型的的子类或者实现
    * `>Types: Show type hierarchy` 查看类型层次

* 折叠

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/folding-range.mp4" type="video/mp4">
</video>

* 智能选择
    * 扩大选择范围： `⌃⇧⌘→`
    * 缩小选择范围： `⌃⇧⌘←`

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/smart-selection.mp4" type="video/mp4">
</video>

* 语义化高亮（根据语义信息更好的对代码单词进行高亮），更多参见 [Wiki](https://github.com/redhat-developer/vscode-java/wiki/Semantic-Highlighting)

![image](/image/vscode/java/semantic-highlighting.png)

* 搜索 Spring boot 相关符号： `⌘P` 输入 （更多参见 [Spring](#Spring)）
    * `@/` 展示所有已定义的请求映射（映射路径、请求方法、源代码位置）
    * `@+` 展示所有定义的 bean （bean 名, bean 类型, 源代码位置）
    * `@>` shows all functions (prototype implementation)
    * `@` 展示代码中的所有 Spring 注解

![image](/image/vscode/java/spring-navigation.png)

* 自动完成

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/code-editing.mp4" type="video/mp4">
</video>

* 快速修复

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/quick-fix.mp4" type="video/mp4">
</video>

* 智能感知（能提供 Eclipse 同样级别的智能提示，配合 [Visual Studio IntelliCode](https://marketplace.visualstudio.com/items?itemName=VisualStudioExptTeam.vscodeintellicode)，可以提供基于 AI 的对智能提示进行排序的能力，优先展示可能性更大的选项）

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/intellicode.mp4" type="video/mp4">
</video>

* 创建文件

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/create-new-file.mp4" type="video/mp4">
</video>

* 代码片段

![image](/image/vscode/java/code-snippet.png)

### 重构、代码生成和快速修复

> [VSCode Docs - Java - Refactoring](https://code.visualstudio.com/docs/java/java-refactoring)
>
> 特性提供扩展：[Language Support for Java™ by Red Hat](https://marketplace.visualstudio.com/items?itemName=redhat.java) （v1.2.0）

#### 重构

编辑器右键，选择 Refactor... （重构）

* 赋值给变量

```java
// Before
Arrays.asList("apple", "lemon", "banana");
// After
List<String> fruits = Arrays.asList("apple", "lemon", "banana");
```

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/assign-to-field.mp4" type="video/mp4">
</video>

* 匿名类转换为内部类

```java
// Before
public class Clazz {
  public Interface method() {
    final boolean isValid = true;
    return new Interface() {
      public boolean isValid() {
        return isValid;
      }
    };
  }
}
// After
public class Clazz {
  private final class MyInterface extends Interface {
    private final boolean isValid;

    private MyInterface(boolean isValid) {
      this.isValid = isValid;
    }

    public boolean isValid() {
      return isValid;
    }
  }

  public Interface method() {
    final boolean isValid = true;
    return new MyInterface(isValid);
  }
}
```

* 转换为匿名类创建

```java
// Before
public void method() {
  Runnable runnable = () -> {
    // do something
  };
}
// After
public void method() {
  Runnable runnable = new Runnable() {
    @Override
    public void run() {
      // do something
    }
  };
}
```

* 转换为增强的 for 循环

```java
// Before
public void order(String[] books) {
  for (int i = 0; i < books.length; i++) {
    // do something
  }
}
// After
public void order(String[] books) {
  for (String book : books) {
    // do something
  }
}
```

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/convert-for-loop.mp4" type="video/mp4">
</video>

* 转换为 lambda 表达式

```java
// Before
public void method() {
  Runnable runnable = new Runnable(){
    @Override
    public void run() {
      // do something
    }
  };
}
// After
public void method() {
    Runnable runnable = () -> {
      // do something
    };
  }
```

* 转换为静态导入

```java
// Before
import org.junit.Assert;
// ...
public void test() {
  Assert.assertEquals(expected, actual);
}
// After
import static org.junit.Assert.assertEquals;
// ...
public void test() {
  assertEquals(expected, actual);
}
```

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/convert-static-imports.mp4" type="video/mp4">
</video>

* 提取到常数

```java
// Before
public double getArea(double r) {
  return 3.14 * r * r;
}
// After
private static final double PI = 3.14;

public double getArea(double r) {
  return PI * r * r;
}
```

* 提取到字段

```java
// Before
class Square {
  public void calculateArea() {
    int height = 1;
    int width = 2;
    int area = height * width;
  }
}
// After
class Square {
  private int area;

  public void calculateArea() {
    int height = 1;
    int width = 2;
    area = height * width;
  }
}
```

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/extract-field.mp4" type="video/mp4">
</video>

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/convert-field.mp4" type="video/mp4">
</video>

* 提取到方法

```java
// Before
public void method() {
  int height = 1;
  int width = 2;
  int area = height * width;
}
// After
public void method() {
  int height = 1;
  int width = 2;
  int area = getArea(height, width);
}

private int getArea(int height, int width) {
  return height * width;
}
```

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/refactor.mp4" type="video/mp4">
</video>

* 提取到函数局部变量

```java
// Before
public void method() {
  if (platform.equalsIgnoreCase("MAC")) {
    // do something
  }
}
// After
public void method() {
  boolean isMac = platform.equalsIgnoreCase("MAC");
  if (isMac) {
    // do something
  }
}
```

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/extract-local-variable.mp4" type="video/mp4">
</video>

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/extract-rename.mp4" type="video/mp4">
</video>

* 内联常量

```java
// Before
private static final double PI = 3.14;

public double getArea(double r) {
  return PI * r * r;
}
// After
private static final double PI = 3.14;

public double getArea(double r) {
  return 3.14 * r * r;
}
```

* 内联局部变量

```java
// Before
public void method() {
  boolean isMac = platform.equalsIgnoreCase("MAC");
  if (isMac) {
    // do something
  }
}
// After
public void method() {
  if (platform.equalsIgnoreCase("MAC")) {
    // do something
  }
}
```

* 内联方法

```java
// Before
public void method() {
  int height = 1;
  int width = 2;
  int area = getArea(height, width);
}

private int getArea(int height, int width) {
  return height * width;
}
// After
public void method() {
  int height = 1;
  int width = 2;
  int area = height * width;
}
```

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/inline.mp4" type="video/mp4">
</video>

* 条件翻转

```java
// Before
public void method(int value) {
  if (value > 5 && value < 15) {
    // do something
  }
}
// After
public void method(int value) {
  if (value <= 5 || value >= 15) {
    // do something
  }
}

```

* 反转 bool 表达式局部变量

```java
// Before
public void method(int value) {
  boolean valid = value > 5 && value < 15;
}
// After
public void method(int value) {
  boolean notValid = value <= 5 || value >= 15;
}
```

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/invert-variable.mp4" type="video/mp4">
</video>

* 移动
    * 将类移动到另一个包
    * 将静态或实例方法移动到另一个类
    * 将内部类移动到新文件

```java
// Before
public class Office {
  public static void main(String[] args) {
    print();
  }

  public static void print() {
    System.out.println("This is printer");
  }

  static class Printer { }
}
// After
public class Office {
  public static void main(String[] args) {
    Printer.print();
  }

  static class Printer {
    public static void print() {
      System.out.println("This is printer");
    }
  }
}
```

如果静态方法在另一个类中比在自己的类中使用得更多，则在静态方法上移动重构。

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/move-static-method.mp4" type="video/mp4">
</video>

将一个类移动到另一个包。目前，文件资源管理器不支持移动重构。

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/move-class.mp4" type="video/mp4">
</video>

将内部类移动到新文件。

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/move-inner-type.mp4" type="video/mp4">
</video>

* 重命名 `F2`

```java
// Before
public class Foo {
  // ...
}

public void myMethod() {
  Foo myClass = new Foo();
}
// After
public class Bar {
  // ...
}

public void myMethod() {
  Bar myClass = new Bar();
}
```

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/rename.mp4" type="video/mp4">
</video>

文件夹和文件的文件资源管理器也支持重命名重构。请求更改后，将提供受影响文件的预览，您可以决定如何应用这些更改。

![image](/image/vscode/java/rename-explorer.gif)

* 将具体的类型更改为 var 类型

```java
// Before
String s = "";
// After
var s = "";
```

* 将 var 类型更改为具体类型

```java
// Before
var s = "";
// After
String s = "";
```

#### Source Actions

* 生成构造函数

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/generate-constructor.mp4" type="video/mp4">
</video>

* 生成委托方法（生成对环境变量方法的包装方法）

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/generate-delegate-methods.mp4" type="video/mp4">
</video>

* 覆盖/实现方法

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/override-implement-methods.mp4" type="video/mp4">
</video>

* 组织导入

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/resolve-ambiguous-imports.mp4" type="video/mp4">
</video>

* 生成 Getters 和 Setters 方法

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/advancedgettersetter.mp4" type="video/mp4">
</video>

* 生成 `hashCode()` 和 `equals()` 方法
    * 如果使用的 Java 7+，可以将 `java.codeGeneration.hashCodeEquals.useJava7Objects` 设置为 `true` 以生成调用 Objects.hash 和 Objects.equals 的较短代码。
    * 还可以将 `java.codeGeneration.hashCodeEquals.useInstanceof` 设置为 `true` 以使用 `instanceOf` 运算符来检查对象类型，而不是调用 `Object.getClass()`。

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/generate-hashcode-equals.mp4" type="video/mp4">
</video>

* 生成 `toString()` 方法

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/generate-tostring.mp4" type="video/mp4">
</video>

* 尽可能将修饰符更改为 final

```java
// Before
public class Clazz {
  public void method(int value) {
    boolean notValid = value > 5;
    if (notValid) {
      // do something
    }
  }
}
// After
public class Clazz {
  public void method(final int value) {
    final boolean notValid = value > 5;
    if (notValid) {
      // do something
    }
  }
}
```

#### 其他

* 修复不可访问的引用

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/fix-non-access-reference.mp4" type="video/mp4">
</video>

* 创建不存在的包

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/create-non-exist-package.mp4" type="video/mp4">
</video>

* 更多
    * 创建无法解决的的类型
    * 删除 final 修饰符
    * 删除不必要的强制转换
    * 删除冗余接口
    * 在 switch 语句中添加缺少的 case 标签
    * Jump to definition on break/continue
    * Correct access to static elements

#### 代码生成模板配置

`cmd +,` 打开设置，输入 `java.template` 过滤配置，即可看到相关配置。

模板配置支持的变量列表参见：[Wiki](https://github.com/redhat-developer/vscode-java/wiki/Predefined-Variables-for-Java-Template-Snippets)

### 格式化和 Lint

> [VSCode Docs - Java - Linting](https://code.visualstudio.com/docs/java/java-linting)
>
> 特性提供扩展：[Language Support for Java™ by Red Hat](https://marketplace.visualstudio.com/items?itemName=redhat.java) （v1.2.0）、[Checkstyle for Java](https://marketplace.visualstudio.com/items?itemName=shengchen.vscode-checkstyle) （v1.4.1）、[SonarLint](https://marketplace.visualstudio.com/items?itemName=SonarSource.sonarlint-vscode) （v3.1.0）、[Extension Pack for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack) （v0.20.0）

#### 格式化

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/formatting.mp4" type="video/mp4">
</video>

* 通过 `"java.format.settings.url"` 配置项，配置 format profile (Eclipse Schema)

```json
"java.format.settings.url": "https://raw.githubusercontent.com/google/styleguide/gh-pages/eclipse-java-google-style.xml",
"java.format.settings.profile": "GoogleStyle",
```

* 通过 `>Java: Open Java Formatter Settings with Preview` 命令可以拉起 [Extension Pack for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack)  扩展提供了可视化的 VSCode 格式化配置页面。（将创建配置文件位于 `.vscode/java-formatter.xml` 文件），可以实时预览配置效果。支持 `cmd + z` 撤销上一步的更改，通过 `cmd + s` 保存配置到文件中。

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/formatting-editing.mp4" type="video/mp4">
</video>

更多参见：[Wiki](https://github.com/redhat-developer/vscode-java/wiki/Formatter-settings)

#### Lint

Java 比较主流的 Lint 工具在 VSCode 上有

* [Checkstyle for Java](https://marketplace.visualstudio.com/items?itemName=shengchen.vscode-checkstyle)
* [SonarLint](https://marketplace.visualstudio.com/items?itemName=SonarSource.sonarlint-vscode)
* [Java P3C Checker](https://marketplace.visualstudio.com/items?itemName=Rectcircle.vscode-p3c)

细节参见：

* [VSCode Docs - Java - Linting](https://code.visualstudio.com/docs/java/java-linting#_sonarlint)
* [Java 代码风格样式检查落地](/posts/java-code-style-check-implement)

### 运行和调试

> [VSCode Docs - Java - Debugging](https://code.visualstudio.com/docs/java/java-debugging)
>
> 特性提供扩展：[Debugger for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-debug) （v0.38.0）

#### 配置文件

默认情况下，调试器将通过自动查找主类并在内存中生成默认启动配置来启动您的应用程序，开箱即用地运行。如果想自定义和保留的启动配置，您可以在运行和调试视图中选择创建 launch.json 文件链接。

launch.json 文件位于工作区（项目根文件夹）中的 .vscode 文件夹中。

#### 启动调试和或运行

可以通过如下位置启动运行和调试。

* 代码文件 main 函数上方的 `Run | Debug` [CodeLens](https://code.visualstudio.com/blogs/2017/02/12/code-lens-roundup)

![image](/image/vscode/java/java-codelens.png)

* 从编辑器菜单运行，从编辑器顶部标题栏中选择 Run Java 或 Debug Java 菜单。

![image](/image/vscode/java/run-menu.png)

* 按 F5 快捷键启动，更多参见：[Debugging in VS Code](https://code.visualstudio.com/docs/editor/debugging)

#### 调试和运行单文件

除了支持调试由构建工具管理的 Java 项目外，VS Code 还支持在没有任何项目的情况下调试单个 Java 文件。

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/single-file-debugging.mp4" type="video/mp4">
</video>

#### 标准输入

默认 Java 调试不支持读取标准输入，如果需要读取标准输入，可以通过 `java.debug.settings.console` 配置项或者 `launch.json` 的 `console` 字段来设置。

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/launch-in-terminal.mp4" type="video/mp4">
</video>

#### 断点

VSCode Java 支持如下断点

* 常规行断点，通过 F9 或者点击源代码编辑器左侧的装订栏添加
* 条件断点，右击源代码编辑器左侧的装订栏，选择条件断点

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/conditional-bp.mp4" type="video/mp4">
</video>

* 数据改变断点，当变量更改其值时，您可以让调试器中断。数据断点只能在调试会话中设置。这意味着您需要启动应用程序并首先在常规断点处中断。然后，您可以在 VARIABLES 视图中选择一个字段并设置一个数据断点。

![image](/image/vscode/java/data-breakpoint.png)

* Logpoints，Java 调试器也支持日志点。日志点允许在不编辑代码的情况下将输出发送到调试控制台。它们与断点不同，因为它们不会停止应用程序的执行流程。

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/logpoints.mp4" type="video/mp4">
</video>

#### 表达式执行

在 Watch 视图可以观察单个表达式 或者 Debug Console 视图可以执行一些函数。

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/expression-evaluation.mp4" type="video/mp4">
</video>

#### 代码热替换

调试器支持的另一个高级功能是“热代码”替换。热代码替换 (HCR) 是一种调试技术，其中 Java 调试器通过调试通道将类更改传输到另一个 Java 虚拟机 (JVM)。 HCR 促进实验开发并促进迭代试错编码。使用这个新功能，您可以在开发环境中启动调试会话并更改 Java 文件，并且调试器将替换正在运行的 JVM 中的代码。不需要重新启动，这就是它被称为“热”的原因。下面是一个说明如何在 VS Code 中将 HCR 与 Debugger for Java 一起使用。

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/hcr.mp4" type="video/mp4">
</video>

您可以使用调试设置 `java.debug.settings.hotCodeReplace` 来控制如何触发热代码替换。可能的设置值为：

* `manual` - 单击工具栏以应用更改（默认）。
* `auto` - 编译后自动应用更改。
* `never` - 禁用热代码替换。

#### 步进过滤

扩展支持分步过滤器，以过滤掉您在调试时不希望看到或单步执行的类型。使用此功能，您可以将包配置为在您的 launch.json 中进行过滤（`stepFilters` 字段），以便在您逐步执行时跳过它们。

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/step-filter.mp4" type="video/mp4">
</video>

#### 调试会话配置

有许多选项和设置可用于配置调试器。例如，使用启动选项可以轻松配置 JVM 参数和环境变量。

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/launch-configuration.mp4" type="video/mp4">
</video>

配置的详细说明可以参见：[Github 文档](https://github.com/microsoft/vscode-java-debug/blob/main/Configuration.md)

##### Launch

* `mainClass` (required) - 类全限定名 (for example `[java module name/]com.xyz.MainApp`) 或者 Java Main 文件路径。
* `args` - 传递给进程的命令行参数。可以使用 `"${command:SpecifyProgramArgs}"` 调用一个外部命令，并将其返回值作为参数传递给进程。
* `sourcePaths` - 程序的额外源目录。默认情况下，调试器从项目设置中查找源代码。此选项允许调试器在额外的目录中查找源代码。
* `modulePaths` - 用于启动 JVM 的模块路径。如果未指定，调试器将自动从当前项目解析。
* `classPaths` - 用于启动 JVM 的类路径。如果未指定，调试器将自动从当前项目解析。
* `encoding` - JVM 的 `file.encoding`设置。如果未指定，将使用 "UTF-8"。可能的值可以在 [Supported Encodings](https://docs.oracle.com/javase/8/docs/technotes/guides/intl/encoding.doc.html) 中找到。
* `vmArgs` - JVM 的额外选项和系统属性（例如 `-Xms<size>` `-Xmx<size>` `-D<name>=<value>`），它接受字符串或字符串数组。
* `projectName` - 调试器在其中搜索类的首选项目。不同的项目中可能存在重复的类名。当调试器在启动程序时查找指定的主类时，此设置也有效。当工作区具有多个 Java 项目时，这是必需的，否则表达式计算和条件断点可能不起作用。
* `cwd` - 程序的工作目录。默认为 `${workspaceFolder}`。
* `env` - 程序的额外环境变量。
* `envFile` - 包含环境变量定义的文件的绝对路径。
* `stopOnEntry` - 启动后自动暂停程序。
* `console` - 用于启动程序的指定控制台。如果未指定，请使用由 `java.debug.settings.console` 用户设置指定的控制台。
    * `internalConsole` - VS 代码调试控制台（不支持输入流）。
    * `integratedTerminal` - VS 代码集成终端。
    * `externalTerminal` - 可在用户设置中配置的外部终端。
* `shortenCommandLine` - 当项目具有较长的类路径或较大的 VM 参数时，用于启动程序的命令行可能会超过操作系统允许的最大命令行字符串限制。此配置项目提供了多种缩短命令行的方法。默认为 `auto`。
    * `none` - 使用标准命令行 `java [options] classname [args]` 启动程序。.
    * `jarmanifest` - 将类路径参数生成到临时类路径.jar文件，并使用命令行 `java -cp classpath.jar类名 [args]` 启动程序。
    * `argfile` - 生成临时参数文件的类路径参数，并使用命令行 `java @argfile [args]` 启动程序。此值仅适用于 Java 9 及更高版本。
    * `auto` - 自动检测命令行长度并确定是否通过适当的方法缩短命令行。
* `stepFilters` - 单步执行时跳过指定的类或方法。
    * `classNameFilters` - \[**Deprecated** - replaced by `skipClasses`] 单步执行时跳过指定的类。类名应是完全限定的。支持通配符。
    * `skipClasses` - 单步执行时跳过指定的类。您可以使用内置变量（如 `$JDK` 和 `$Libraries`）跳过一组类，或添加特定的类名表达式，例如 `java.*`, `*.Foo`.
    * `skipSynthetics` - 步进时跳过合成方法（编译器生成）。
    * `skipStaticInitializers` - 单步执行时跳过静态初始值设定项方法。
    * `skipConstructors` - 单步执行时跳过构造函数方法。

##### Attach

* `hostName` (required) - 远程调试器的主机名或 IP 地址。
* `port` (required) - 远程调试器的调试端口。
* `processId` - 使用进程选取器选择要附加的进程，或使用进程 ID 作为整数。
    * `${command:PickJavaProcess}` - 使用进程选取器选择要附加的进程（默认）。
    * An integer PID - 附加到指定的本地进程。
* `timeout` - 重新连接前的超时值（以毫秒为单位）（默认值为 30000 毫秒）。
* `sourcePaths` - 程序的额外源目录。默认情况下，调试器从项目设置中查找源代码。此选项允许调试器在额外的目录中查找源代码。
* `projectName` - 调试器在其中搜索类的首选项目。不同的项目中可能存在重复的类名。当调试器在启动程序时查找指定的主类时，此设置也有效。当工作区具有多个 Java 项目时，这是必需的，否则表达式计算和条件断点可能不起作用。
* `stepFilters` - 单步执行时跳过指定的类或方法。
    * `classNameFilters` - \[**Deprecated** - replaced by `skipClasses`] 单步执行时跳过指定的类。类名应是完全限定的。支持通配符。
    * `skipClasses` - 单步执行时跳过指定的类。您可以使用内置变量（如 `$JDK` 和 `$Libraries`）跳过一组类，或添加特定的类名表达式，例如 `java.*`, `*.Foo`.
    * `skipSynthetics` - 步进时跳过合成方法（编译器生成）。
    * `skipStaticInitializers` - 单步执行时跳过静态初始值设定项方法。
    * `skipConstructors` - 单步执行时跳过构造函数方法。

#### 调试相关用户设置

* `java.debug.logLevel`: 发送到 VS Code 的调试器日志的最低级别默认为 `warn`.
* `java.debug.settings.showHex`: 在 **Variables** 视图中以十六进制格式显示数字，默认为 `false`。
* `java.debug.settings.showStaticVariables`: 在 **Variables** 视图中显示静态变量，默认为 `false`。
* `java.debug.settings.showQualifiedNames`: 在 **Variables** 视图中显示完全限定的类名，默认为  `false`。
* `java.debug.settings.showLogicalStructure`: 在 **Variables** 视图中显示集合和映射类的逻辑结构，默认为 `true`。
* `java.debug.settings.showToString`: 在 **Variables** 视图中显示所有的覆盖了 `toString` 方法的实例的 `toString()` 的值，默认为 `true`。
* `java.debug.settings.maxStringLength`: **Variables** 或 **Debug Console** 视图中显示的字符串的最大长度。长度超过此限制的字符串将被修剪。默认值为 `0`，表示不执行任何修剪。
* `java.debug.settings.hotCodeReplace`: 在调试期间重新加载更改的 Java 类，默认为 `manual`。 确保 [Java Language Support extension](https://github.com/redhat-developer/vscode-java) 扩展的 `java.autobuild.enabled` 配置没有禁用。更多参见《代码热替换》章节。
    * manual - 单击工具栏以应用更改。
    * auto - 编译后自动应用更改。
    * never - 禁用。
* `java.debug.settings.enableHotCodeReplace`: 是否启用代码热替换，默认为 true。确保 [Java Language Support extension](https://github.com/redhat-developer/vscode-java) 扩展的 `java.autobuild.enabled` 配置没有禁用。更多参见《代码热替换》章节。
* `java.debug.settings.enableRunDebugCodeLens`: 为主入口点上的运行和调试按钮启用 CodeLens 提供程序，默认为 `true`.
* `java.debug.settings.forceBuildBeforeLaunch`: 在启动 java 程序之前强制构建工作区，默认为 `true`。
* `java.debug.settings.console`: 用于启动 Java 程序的指定控制台，默认为 `integratedTerminal`。如果要为特定调试会话自定义控制台，请修改 `launch.json` 中的 `console` 配置。
    * `internalConsole` - VS 代码调试控制台（不支持输入流）。
    * `integratedTerminal` - VS 代码集成终端。
    * `externalTerminal` - 可在用户设置中配置的外部终端。
* `java.debug.settings.exceptionBreakpoint.skipClasses`: 出现异常时跳过指定的类。您可以使用内置变量（如 `$JDK` 和 `$Libraries`）跳过一组类，或添加特定的类名表达式，例如 `java.*`、`*.Foo`。
* `java.debug.settings.stepping.skipClasses`: 单步执行时跳过指定的类。您可以使用内置变量（如 `$JDK` 和 `$Libraries`）跳过一组类，或添加特定的类名表达式，例如 `java.*`、`*.Foo`。
* `java.debug.settings.stepping.skipSynthetics`: 步进时跳过合成方法（编译器生成的方法）。
* `java.debug.settings.stepping.skipStaticInitializers`: 单步执行时跳过静态初始值设定项方法。
* `java.debug.settings.stepping.skipConstructors`: 单步执行时跳过构造函数方法。
* `java.debug.settings.jdwp.limitOfVariablesPerJdwpRequest`: 一个 JDWP 请求中可以请求的最大变量或字段数。该值越高，在展开变量视图时请求调试对象的频率就越低。此外，较大的数字也可能导致 JDWP 请求超时。默认值为 100。
* `java.debug.settings.jdwp.requestTimeout`: 调试器与目标 JVM 通信时 JDWP 请求的超时 （ms）。默认值为 3000。
* `java.debug.settings.vmArgs`: 用于启动 Java 程序的缺省 VM 参数。例如，使用 `-Xmx1G -ea` 将堆大小增加到 1 GB 并启用断言。如果要自定义特定调试会话的 VM 参数，可以在 `launch.json` 中修改 `vmArgs` 配置。
* `java.silentNotification`: 控制是否可以使用通知弹窗来报告进度。如果为 true，则改为状态栏报告进度。默认为 `false`。

#### 调试相关 Troubleshooting

参见 [Troubleshooting](https://github.com/microsoft/vscode-java-debug/blob/main/Troubleshooting.md)，常见的问题为：

* Java Language Support extension fails to start.
* Build failed, do you want to continue?
* isn't on the classpath. Only syntax errors will be reported.
* Program Error: Could not find or load main class X.
* Program throws ClassNotFoundException.
* Failed to complete Hot Code Replace.
* Please specify the host name and the port of the remote debuggee in the launch.json.
* Failed to evaluate. Reason: Cannot evaluate because the thread is resumed.
* Cannot find a class with the main method.
* No delegateCommandHandler for vscode.java.startDebugSession when starting Debugger.
* Failed to resolve classpath.
* Request type "X" is not supported. Only "launch" and "attach" are supported.

### 测试

> [VSCode Docs - Java - Testing](https://code.visualstudio.com/docs/java/java-testing)
>
> 特性提供扩展：[Test Runner for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-test) （v0.34.0）

VSCode Java 支持如下几种测试框架

* [JUnit 4](https://junit.org/junit4/) (v4.8.0+)
* [JUnit 5](https://junit.org/junit5/) (v5.1.0+)
* [TestNG](https://testng.org/doc/) (v6.8.0+)

[Test Runner for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-test) 与 Red Hat 的 [Language Support for Java™](https://marketplace.visualstudio.com/items?itemName=redhat.java) 和 [Debugger for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-debug) 扩展一起使用，可提供以下功能：

* 运行/调试测试用例
* 自定义测试配置
* 查看测试报告
* 在测试资源管理器中查看测试

#### 项目配置

在项目中添加单侧依赖如下：

* JUnit4 `junit` `junit`
* JUnit5 参见：[junit5-sample repository](https://github.com/junit-team/junit5-samples)
* TestNG `org.testng` `testng`

#### 特性

* Run/Debug 测试用例，通过编辑器左侧装订栏的绿色三角号可以快速启动单侧。

![image](/image/vscode/java/editor-decoration.png)

* Test Explorer 测试资源管理器，是一个树形视图，用于显示工作区中的所有测试用例。您可以单击 VSCode 左侧活动栏上的烧杯按钮将其打开。您还可以运行/调试您的测试用例并从那里查看它们的测试结果。

![image](/image/vscode/java/test_explorer.png)

* 自定义测试配置，可以通过 `java.test.config` 以及 `java.test.defaultConfig` 配置项，配置测试的运行配置，更多细节参见：[vscode-java-test Wiki](https://github.com/Microsoft/vscode-java-test/wiki/Run-with-Configuration)。`java.test.config` 所有字段如下：
    * **args**: 命令行参数。
    * **classPaths**: 此设置中定义的类路径将附加到已解析的类路径中。
    * **env**: 通过键值对象运行测试时指定额外的环境变量。
    * **envFile**: 指定包含环境变量定义的文件的绝对路径。
    * **modulePaths**: 此设置中定义的模块路径将附加到已解析的模块路径中。
    * **name**: 指定配置项的名称。可以通过配置项 `java.test.defaultConfig` 来设置默认配置名称。
    * **preLaunchTask**: 指定 tasks.json 中指定的任务的标签（在工作区的 .vscode 文件夹中）。该任务将在测试开始之前启动。
    * **sourcePaths**: 调试测试时指定额外的源路径。
    * **vmArgs**: 指定 JVM 的额外选项和系统属性。
    * **workingDirectory**: 运行测试时指定工作目录。

![image](/image/vscode/java/configuration.png)

* 查看测试结果，运行/调试测试用例后，相关测试项的状态将在编辑器装饰和测试资源管理器中更新。还可以通过命令 `>Test: Peek Output` 来查看结果视图。可以选择堆栈跟踪中的链接以导航到源位置。

![image](/image/vscode/java/test_report.png)

* 生成测试，在编辑器右击，选 `Source Action...` -> `Generate Tests....`，分为如下两种场景
    * 从主要源代码触发生成测试
    * 从测试源代码触发生成测试

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/generate-tests-from-main.mp4" type="video/mp4">
</video>

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/generate-tests-from-test.mp4" type="video/mp4">
</video>

* 测试跳转，VSCode Java 提供了在测试和测试主题之间快速跳转的功能。如果源代码包含在 `src/main/java` 或 `src/test/java` 中，您可以在编辑器上下文菜单中找到名为 `Go to Test` 或 `Go to Test Subject` 的条目。另外还可以通过 `>Java: Go to Test` 命令跳转。

![image](/image/vscode/java/goto-test.png)

* 测试命令，通过 `>Test:` 可以看到所有的 Java 测试相关的命令

![image](/image/vscode/java/command_palette.png)

* VSCode 测试功能的通用配置，通过 `⌘,` 搜索 testing，查看。

![image](/image/vscode/java/settings.png)

* 运行调试测试命令，`Java: Run Tests` 运行测试，`Java: Debug Tests` 调试测试

#### 更多

* [Wiki](https://github.com/microsoft/vscode-java-test/wiki)  
* [FAQ](https://github.com/microsoft/vscode-java-test/wiki/FAQ)
* [issue List](https://github.com/microsoft/vscode-java-test/issues)

## 框架支持

### Java EE Server

> [VSCode Docs - Java - Application Servers](https://code.visualstudio.com/docs/java/java-spring-boot)
>
> 特性提供扩展：[Community Server Connectors](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-community-server-connector) （v0.25.2） 和 [Remote Server Protocol UIP](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-rsp-ui) （v0.23.11）

[Community Server Connectors](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-community-server-connector) 提供了连接到常见的开源的 Servlet 容器的能力：

* Apache Tomcat ( 5.5 | 6.0 | 7.0 | 8.0 | 8.5 | 9.0 )
* Apache Karaf ( 4.8 )
* Apache Felix ( 3.2 | 4.6 | 5.6 | 6.0 )
* Jetty ( 9.x )
* Glassfish ( 5.x )
* Websphere Liberty ( 21.x )

通过 `>Servers:` 可以查看所有的命令。更多参见：[github](https://github.com/redhat-developer/vscode-rsp-ui)

其他 Java EE Server 支持自行在 [VSCode 扩展市场](https://marketplace.visualstudio.com/) 搜索

### Spring Boot

> [VSCode Docs - Java - Spring Boot](https://code.visualstudio.com/docs/java/java-spring-boot)
>
> 特性提供扩展：[Spring Boot Tools](https://marketplace.visualstudio.com/items?itemName=Pivotal.vscode-spring-boot) （v1.29.0）和 [Spring Initializr](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-spring-initializr) （ v0.8.0） 和 [Spring Boot Dashboard](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-spring-boot-dashboard) （v0.2.0） （通过 [Spring Boot Extension Pack](https://marketplace.visualstudio.com/items?itemName=pivotal.vscode-boot-dev-pack) 一键安装）

#### 创建项目

通过 [Spring Initializr](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-spring-initializr) 项目，可以快速创建 Spring 项目骨架。通过 `>Spring Initializr: create` 命令触发。

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/spring-initializr.mp4" type="video/mp4">
</video>

#### 编辑项目

通过 [Spring Initializr](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-spring-initializr) 项目，可以为已存在的 Spring Boot 项目添加新的 starter。通过 `>Spring Initializr: add` 或者 `pom.xml` 文件编辑器（右击）上下文菜单，选择 `Add starters...` 添加。

#### 开发应用

通过 [Spring Boot Tools](https://marketplace.visualstudio.com/items?itemName=Pivotal.vscode-spring-boot) 扩展，提供了 Spring Boot 相关的特性，细节参见：[detailed usage guide](https://github.com/spring-projects/sts4/tree/main/vscode-extensions/vscode-spring-boot#usage)。包括：

* 快速导航到工作区中的 Spring 元素
* Spring 的 application 的 `.yml` 和 `.properties` 提供智能代码完成
* 快速访问正在运行的 Spring 应用程序
* 实时应用信息
* 代码模板

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/spring-live-info.mp4" type="video/mp4">
</video>

#### 运行应用

除了使用 F5 来运行应用程序之外，还有 [Spring Boot Dashboard](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-spring-boot-dashboard) 扩展，它允许您查看和管理工作区中所有可用的 Spring Boot 项目，以及快速启动、停止或调试您的项目。

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/spring-dashboard.mp4" type="video/mp4">
</video>

### Quarkus 和 MicroProfile

> 特性提供扩展：[Extension Pack for MicroProfile](https://marketplace.visualstudio.com/items?itemName=MicroProfile-Community.vscode-microprofile-pack)
 和 [Quarkus](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-quarkus)
Quarkus 可以理解为 MicroProfile 标准的一个实现，并原生支持 k8s 的全栈 Java 后端框架。

* [Extension Pack for MicroProfile](https://marketplace.visualstudio.com/items?itemName=MicroProfile-Community.vscode-microprofile-pack)
    * [MicroProfile Starter](https://marketplace.visualstudio.com/items?itemName=MicroProfile-Community.mp-starter-vscode-ext) - 提供快速生成 MicroProfile 的 Maven 项目
    * [Generator for MicroProfile Rest Client](https://marketplace.visualstudio.com/items?itemName=MicroProfile-Community.mp-rest-client-generator-vscode-ext) - 从 OpenAPI 文档快速生成 MicroProfile Rest Client 接口模板。
    * [Tools for MicroProfile](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-microprofile) - 通过 [Language Server for Eclipse MicroProfile](https://github.com/eclipse/lsp4mp) 对 MicroProfile API 和 properties 配置文件提供语言支持
* [Quarkus](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-quarkus)，对 Quarkus 提供创建项目、交互式添加 Extension、调试、构建可执行文件、部署到 OpenShift、对 properties/yml 配置文件提供语言支持、对相关 Java 文件提供支持。

### Lombok

> 特性提供扩展：[Lombok Annotations Support for VS Code](https://marketplace.visualstudio.com/items?itemName=GabrielBB.vscode-lombok)

参见：[README](https://marketplace.visualstudio.com/items?itemName=GabrielBB.vscode-lombok)

### GUI 应用

> [VSCode Docs - Java - GUI Applications](https://code.visualstudio.com/docs/java/java-gui)
>
> 特性提供扩展：[Extension Pack for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack) （v0.21.0）

#### JavaFX

**创建**

* 步骤 1: 安装 [Extension Pack for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack)
* 步骤 2: `⇧⌘P` 输入 `>Java: Create Java Project`
* 步骤 3: 选择 JavaFX

![image](/image/vscode/java/create-javafx.png)

**运行**

> 注意：以下指南仅适用于 Maven 管理的项目。

要运行 JavaFX 应用程序，您可以打开 Maven Explorer，展开 hellofx > Plugins > javafx 并运行 Maven 目标：javafx:run。

<video autoplay="" loop="" muted="" playsinline="" controls="">
  <source src="/image/vscode/java/run-javafx.mp4" type="video/mp4">
</video>

更多 JavaFX 例子，参见：[openjfx samples repository](https://github.com/openjfx/samples/tree/master/IDE/VSCode)

#### AWT

开发 AWT 需要开启该特性： `>Java: Help Center` 打开 `Student` 选择 `Enable AWT Development` （没找到配置的地方，好像已经默认支持了）。

#### Swing

默认支持 Swing 应用程序开发。您无需任何设置即可直接编写 Swing 应用程序代码。更多参见： [Oracle Swing documentation](https://docs.oracle.com/javase/tutorial/uiswing/examples/components/index.html)

## 扩展其他贡献

### [Project Manager for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-dependency)

#### 配置

名称 | 说明 | 默认值
--- | --- | ---
java.dependency.showMembers | 在资源管理器中显示成员 | false
java.dependency.syncWithFolderExplorer | 将 Java 项目资源管理器选择与文件夹资源管理器同步 | true
java.dependency.autoRefresh | 将 Java 项目资源管理器与更改同步 | true
java.dependency.refreshDelay | 检测到更改时调用自动刷新的延迟时间 (ms) | 2000
java.dependency.packagePresentation | 包装呈现方式：flat 或 hierarchical | flat
java.project.exportJar.targetPath | 指定导出 jar 的输出路径。 默认值为 `${workspaceFolder}/${workspaceFolderBasename}.jar`。 要在每次导出 jar 文件时手动选择输出位置，只需将其留空或将其设置为 askUser。 | `${workspaceFolder}/${workspaceFolderBasename}.jar`

#### 命令

> 仅展示可以只能通过 命令面板 （Cmd + Shift + P） 调用的命令

名称 | 说明 |
--- | --- |
java.project.refreshLibraries | 刷新 |

### [Language Support for Java™ by Red Hat](https://marketplace.visualstudio.com/items?itemName=redhat.java)

#### 代码片段

前缀 | 说明
---- | ----
main | 生成 main 函数
ctor | 生成公有构造函数
try_catch | 生成 try catch 块
try_resources | 生成 try resources 块
private_method| 生成私有方法
public_method | 生成公有方法
private_static_method | 生成私有静态方法
public_static_method | 生成公有静态方法
protected_method | 生成受保护方法
switch | 生成 switch 块
new | 生成 new 块
prf | 生成私有字段声明
sysout | 生成 System.out.println
syserr | 生成 System.err.println
fori | 生成 for int ...
foreach | 生成 `for (type var : iterable)` 语句
if | 生成 if 语句
ifelse | 生成 if else 语句
ifnull | 生成 if (condition == null)
ifnotnull | 生成 if (condition != null)
while | 生成 while 块
dowhile | 生成 do while 块

#### 配置

名称 | 说明 | 默认值
--- | --- | ---
java.home | 废弃，使用 `java.jdt.ls.java.home` 替代，用来启动后 Java Language Server 的 JDK 的绝对路径，需要 VSCode 重启生效 |
java.jdt.ls.vmargs | 运行 Java Language Server 的命令行参数，需要 VSCode 重启生效 |
java.errors.incompleteClasspath.severity | 指定 Java 文件的类路径不完整时消息的严重性。 支持的值是忽略、信息、警告、错误。| warn
java.trace.server |跟踪 VS Code 和 Java 语言服务器之间的通信。| off
java.configuration.updateBuildConfiguration  | 指定对构建文件的修改如何更新 Java 类路径/配置。 支持的值被禁用（没有任何反应）、交互（询问每次修改时的更新）、自动（自动触发更新）。 | interactive
java.configuration.maven.userSettings | Maven 用户 settings.xml 的路径。 |
java.configuration.checkProjectSettingsExclusions | 控制是否从文件资源管理器中排除扩展生成的项目设置文件（.project、.classpath、.factorypath、.settings/）| true
java.referencesCodeLens.enabled | Enable/disable 代码引用 code lenses. | false
java.implementationsCodeLens.enabled | Enable/disable 实现的 code lenses | false
java.signatureHelp.enabled | Enable/disable 函数签名智能提示（通过 `()` 触发） | false
java.contentProvider.preferred | 反编译器 ID (see 3rd party decompilers available in [vscode-java-decompiler](https://marketplace.visualstudio.com/items?itemName=dgileadi.java-decompiler)). | fernflower
java.import.exclusions | 通过 glob 模式从导入中排除文件夹。 利用 ! 否定模式以允许子文件夹导入。 您必须包含父目录。 顺序很重要。 |
java.import.gradle.enabled | Enable/disable Gradle 导入 | true
java.import.gradle.wrapper.enabled | 使用 `gradle-wrapper.properties` 文件中的 Gradle | true
java.import.gradle.version | 如果 Gradle Wrapper 丢失或禁用，使用特定版本的 Gradle。 |
java.import.gradle.home | 如果 Gradle 包装器丢失或禁用且未指定 `java.import.gradle.version`，则使用指定本地安装目录中的 Gradle 或 GRADLE_HOME。 |
java.import.gradle.arguments | Gradle 命令行参数 |
java.import.gradle.jvmArguments | Gradle JVM 命令行参数 |
java.import.gradle.user.home | setting for GRADLE_USER_HOME |
java.import.gradle.offline.enabled | Enable/disable Gradle offline 模式 | false
java.import.maven.enabled | Enable/disable Maven 导入 | true
java.autobuild.enabled | Enable/disable 'auto build' | true
java.maxConcurrentBuilds | 设置最大构建并发数 | 1
java.completion.enabled | Enable/disable 代码完成支持 | true
java.completion.overwrite | 设置为 true 时，代码完成将 overwrite 当前文本。 当设置为 false 时，只是简单地添加代码 | true
java.completion.guessMethodArguments | 当设置为 true 时，当从代码提示列表中选择方法时，会猜测方法参数。 | false
java.completion.filteredTypes | 定义类型过滤器。 在内容辅助或快速修复建议以及组织导入时，将忽略其完全限定名称与所选过滤器字符串匹配的所有类型。 例如，'java.awt.*' 将隐藏 awt 包中的所有类型。|
java.completion.favoriteStaticMembers | 定义静态成员列表或具有静态成员的类型。|
java.completion.importOrder | 定义导入语句的排序顺序。|
java.progressReports.enabled | 实验性 Enable/disable 进度报告 | false
java.format.enabled | Enable/disable Java 默认格式化器 | true
java.format.settings.url | 格式化详细配置 URL |
java.format.settings.profile | 来自 Eclipse 格式化程序设置的可选格式化程序配置文件名称 |
java.format.comments.enabled | 注释格式化 |  true
java.format.onType.enabled | Enable/disable on-type 格式化 (触发字符 `;,` 或 `<return>` 或 `}`).
java.foldingRange.enabled | Enable/disable 智能的折叠范围。如果禁用，它将使用 VS Code 提供的默认基于缩进的折叠范围 | true
java.maven.downloadSources | 作为导入 Maven 项目的一部分，启用/禁用 Maven 源代码的下载 | false
java.maven.updateSnapshots | 强制更新 Snapshots/Releases | false.
java.codeGeneration.hashCodeEquals.useInstanceof | 生成 hashCode 和 equals 方法时使用 `instanceof` 比较类型 | false.
java.codeGeneration.hashCodeEquals.useJava7Objects | 在生成 hashCode 和 equals 方法时使用 Objects.hash 和 Objects.equals。 此设置仅适用于 Java 7 及更高版本。 | false
java.codeGeneration.useBlocks | 生成方法时在 if 语句中使用块。| false
java.codeGeneration.generateComments | 生成方法时生成方法注释 | false
java.codeGeneration.toString.template | 用于生成 toString 方法的模板。| `${object.className} [${member.name()}=${member.value}, ${otherMembers}]`
java.codeGeneration.toString.codeStyle | 用于生成 toString 方法的代码样式。 |  STRING_CONCATENATION。
java.codeGeneration.toString.skipNullValues | 生成 toString 方法时跳过空值。| false
java.codeGeneration.toString.listArrayContents | 列出数组的内容，而不是使用本机 toString()。| true
java.codeGeneration.toString.limitElements | 限制要列出的 arrays/collections/maps 中的项目数，如果为 0，则列出所有。 | 0
java.selectionRange.enabled | Enable/disable Java 的智能选择支持。 禁用此选项不会影响 VSCode 内置的基于单词和基于括号的智能选择。 | true
java.showBuildStatusOnStart.enabled | 启动时自动显示构建状态，默认为通知，枚举值为 (notification、terminal、off) | notification
java.project.outputPath | 存储编译输出的工作区的相对路径。 仅在 WORKSPACE 范围内有效。 该设置不会影响 Maven 或 Gradle 项目。|
java.project.referencedLibraries | 配置 glob 模式以将本地库引用到 Java 项目。|
java.completion.maxResults | 完成结果的最大数量（不包括片段）。 0（默认值）禁用限制，返回所有结果。 如果出现性能问题，请考虑设置一个合理的限制。 | 0
java.configuration.runtimes | 将 Java 执行环境映射到本地 JDK |
java.server.launchMode | Language Server 启动模式 Standard、LightWeight、Hybrid | Hybrid
java.sources.organizeImports.starThreshold |指定在使用星形导入声明之前添加的导入数量 | 99
java.sources.organizeImports.staticStarThreshold |指定在使用星形导入声明之前添加的静态导入数量 | 99
java.imports.gradle.wrapper.checksums | 定义 Gradle Wrappers 的允许/禁止 SHA-256 校验和 |
java.project.importOnFirstTimeStartup |指定首次以混合模式打开文件夹时是否导入 Java 项目。 支持的值是 disabled（从不导入）、interactive（询问是否导入）、automatic（始终导入） | automatic
java.project.importHint | Enable/disable 服务器模式切换信息，当 Java 项目导入在启动时被跳过。 | true.
java.import.gradle.java.home | 指定用于运行 Gradle 守护程序的 JVM 的位置 |
java.project.resourceFilters | 将文件和文件夹排除在 Java 语言服务器刷新之外，这可以提高整体性能。 例如，`["node_modules",".git"]` 将排除所有名为 `'node_modules'` 或 `'.git'` 的路径 |  `["node_modules",".git"]`
java.templates.fileHeader | 指定新 Java 文件的文件头注释。 支持使用字符串数组配置多行注释，并使用 `${variable}` 引用预定义的变量。|
java.templates.typeComment | 指定新 Java 类型的类型注释。 支持使用字符串数组配置多行注释，并使用 `${variable}` 引用预定义的变量 |
java.references.includeAccessors | 查找引用时包括 getter、setter 和 builder/constructor。 | false
java.configuration.maven.globalSettings | Maven 全局 settings.xml 的路径。|
java.eclipse.downloadSources  | Enable/disable Eclipse 项目的 Maven 源工件的下载。|
java.recommendations.dependency.analytics.show | 显示推荐的依赖分析扩展 | true
java.references.includeDecompiledSources | 查找参考时包括反编译的源。 | true
java.project.sourcePaths | 配置源文件的工作空间的相对路径。 仅在 WORKSPACE 范围内有效。 该设置不会影响 Maven 或 Gradle 项目。|
java.typeHierarchy.lazyLoad | Enable/disable 延迟加载类型层次结构中的内容。 延迟加载可以节省大量加载时间，但每种类型都应手动扩展以加载其内容。 | false
java.codeGeneration.insertionLocation | 指定源操作生成的代码的插入位置。 | afterCursor。
java.settings.url |指定工作区 Java 设置的 url 或文件路径。 请参阅：[设置全局首选项](https://github.com/redhat-developer/vscode-java/wiki/Settings-Global-Preferences) |
java.quickfix.showAt | 在问题或行级别显示快速修复。| line
java.configuration.workspaceCacheLimit | 保留未使用的工作区缓存数据的天数（如果启用）。 超出此限制，缓存的工作区数据可能会被删除。 |
java.import.generatesMetadataFilesAtProjectRoot | 指定是否将在项目根目录生成项目元数据文件（.project、.classpath、.factorypath、.settings/）。 | false
java.jdt.ls.java.home | 用于启动 Java 语言服务器的 JDK 主文件夹的绝对路径。 此设置将替换 Java 扩展的嵌入式 JRE 以启动 Java 语言服务器。 需要重启 VS Code (1.3.0 新增) |

Eclipse 配置，参见：[Wiki](https://github.com/redhat-developer/vscode-java/wiki/Settings-Global-Preferences)

#### 命令

名称 | 说明
--- | ---
Switch to Standard Mode | 切换到标准模式 |
Java: Update Project (Shift+Alt+U) | 当编辑器专注于 Maven pom.xml 或 Gradle 文件时可用。 它根据项目构建描述符强制项目配置/类路径更新（例如依赖项更改或 Java 编译级别）。
Java: Import Java Projects into Workspace | 检测所有 Java 项目并将其导入 Java 语言服务器工作区。
Java: Open Java Language Server Log File | 打开 Java 语言服务器日志文件，这对于解决问题很有用。
Java: Open Java Extension Log File | 打开 Java 扩展日志文件，这对于解决问题很有用。
Java: Open All Log Files | 打开 Java 语言服务器日志文件和 Java 扩展日志文件。
Java: Force Java Compilation (Shift+Alt+B) | 强制触发工作区的编译。
Java: Open Java Formatter Settings | 打开 Eclipse 格式化程序设置。 如果不存在，则创建一个新的设置文件。
Java: Clean Java Language Server Workspace | 清理 Java 语言服务器工作区。
Java: Attach Source: attaches a jar/zip source to the currently opened binary class file | 此命令仅在编辑器上下文菜单中可用。
Java: Add Folder to Java Source Path | 将所选文件夹添加到其项目源代码路径。 此命令仅在文件资源管理器上下文菜单中可用，并且仅适用于非托管文件夹。
Java: Remove Folder from Java Source Path | 从其项目源路径中删除选定的文件夹。 此命令仅在文件资源管理器上下文菜单中可用，并且仅适用于非托管文件夹。
Java: List All Java Source Paths | 列出 Java 语言服务器工作区识别的所有 Java 源路径。
Java: Show Build Job Status | 在 Visual Studio Code 终端中显示 Java 语言服务器作业状态。
Java: Go to Super Implementation | 跳转到当前选中符号的超类实现

#### Wiki

https://github.com/redhat-developer/vscode-java/wiki

### [Maven for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-maven)

#### 配置

| 配置 | 描述 | Default Value |
| --- | --- | --- |
| `maven.excludedFolders` | 指定搜索 Maven 项目时要排除的文件夹的文件路径模式。指定搜索 Maven 项目时要排除的文件夹的文件路径模式。 | `[ "**/.*", "**/node_modules", "**/target", "**/bin", "**/archetype-resources" ]` |
| `maven.executable.preferMavenWrapper` | 指定您是否更喜欢使用 Maven 包装器。 如果为真，它会尝试通过遍历父文件夹来使用 `mvnw`。 如果为 false 或未找到 `mvnw`，则改为在 PATH 中尝试 `mvn`。 | `true` |
| `maven.executable.path` | 指定 `mvn` 可执行文件的绝对路径。 当此值为空时，它会根据 `maven.executable.preferMavenWrapper` 的值尝试使用 `mvn` 或 `mvnw`。 例如。 `/usr/local/apache-maven-3.6.0/bin/mvn`|  |
| `maven.executable.options` | 指定所有 mvn 命令的默认选项。 例如 `-o -DskipTests` |  |
| `maven.projectOpenBehavior` | 新建项目的默认打开方式 | `"Interactive"` |
| `maven.pomfile.autoUpdateEffectivePOM` | 指定是否在检测到更改时自动更新有效 pom。 | `false` |
| `maven.pomfile.globPattern` | 指定用于查找 pom.xml 文件的 glob 模式。 | `**/pom.xml` |
| `maven.terminal.useJavaHome` | 如果此值为 true，并且设置 java.home 有值，则在创建新终端窗口时，环境变量 JAVA\_HOME 将设置为 java.home 的值。 | `false` |
| `maven.terminal.customEnv` | 指定环境变量名称和值的数组。 这些环境变量值将在执行 Maven 之前添加。`environmentVariable`：要设置的环境变量的名称。`value`：要设置的环境变量的值。| `[]` |
| `maven.terminal.favorites` | 指定要执行的预定义收藏命令。`alias`：命令的简称。`command`: 收藏命令的内容。 | `[]` |
| `maven.view` |指定查看 Maven 项目的方式。 可能的值：`flat`、`hierarchical`。| `flat` |
| `maven.settingsFile` | 指定 Maven `settings.xml` 文件的绝对路径。 如果未指定，则使用 `~/.m2/settings.xml`。 | `null` |

## 场景和小技巧

### 快速创建项目

通过命令 `>Java: Create Java Project` 可以快速创建 Maven、Gradle、Spring Boot、MicroProfile、Quarkus、JavaFX 项目。

### 环境和依赖

#### JDK 相关

参见：[帮助中心](#JDK 配置) 和 [JDK 配置](#jdk-配置)

#### 快速添加依赖

* 搜索添加 Maven 依赖：执行命令 `>Maven: Add a Dependency`
* 搜索添加 Gradle 依赖，直接编写 `build.gradle` 等配置文件的 dependencies 时会自动提示
* 搜索添加 Spring Boot Starter 依赖：执行命令 `>spring initializr: add starters`

#### 查看项目依赖及依赖图

* Maven 通过资源管理器侧边栏 -> Maven 视图 -> 右击项目 -> 显示所有依赖，可以快速展示依赖树视图
* Gradle 暂不支持，通过命令查看： `gradle dependencies`

#### 彻底清理生成项目配置和缓存

Java Language Server 存在异常时，可以通过如下步骤从上到下尝试使用：

* 先尝试执行 `>java: clean java language server workspace` 命令
* 如果上述步骤无效，可以尝试彻底关闭 VSCode，清理 Language Server 生成的一些配置文件。

```bash
# cd 项目根目录
rm -rf .project、.classpath、.factorypath、.settings
```

### Maven/Gradle Wrapper 加速

相关 Jar 包下载配置 `.mvn/wrapper/maven-wrapper.properties`

```properties
distributionUrl=https://mirrors.huaweicloud.com/repository/maven/org/apache/maven/apache-maven/3.6.3/apache-maven-3.6.3-bin.zip
wrapperUrl=https://mirrors.huaweicloud.com/repository/maven/io/takari/maven-wrapper/0.5.6/maven-wrapper-0.5.6.jar
```

项目级别 maven settings `.mvn/wrapper/settings.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd">
  <mirrors>
    <mirror>
      <id>alimaven</id>
      <name>aliyun maven</name>
      <url>http://maven.aliyun.com/nexus/content/groups/public/</url>
      <mirrorOf>central</mirrorOf>
    </mirror>
  </mirrors>
  <profiles>
  </profiles>
</settings>
```

### 如何开发 Java 8 以及以下版本的项目

* [Language Support for Java™ by Red Hat](https://marketplace.visualstudio.com/items?itemName=redhat.java) 1.3.0 版本以上的平台特定版本免配置，即可自动支持（限制在 VSCode 中通过 微软官方扩展市场支持特定平台的版本扩展市场）（Open VSX 不支持）
* 旧版或者通用版本 Java 11 以上版本的 JRE 来启动 Language Server

```json
{
    // "java.home":"/path/to/jdk11", // 旧版本 Java Languange Server
    "java.jdt.ls.java.home": "/path/to/jdk11"
}
```

### 如何支持 Maven 项目动态生成的代码

> 参见：[Wiki](https://github.com/redhat-developer/vscode-java/wiki/Annotation-Processing-support-for-Maven-projects)

pom.xml 中添加 `build-helper-maven-plugin`，让 Java Language Server 识别生成的代码。

```xml
  <properties>
    <generatedSources>${project.build.directory}/generated-sources/java</generatedSources>
  </properties>
  <build>
    <plugins>
      <plugin>
        <groupId>org.codehaus.mojo</groupId>
        <artifactId>build-helper-maven-plugin</artifactId>
        <version>3.0.0</version>
        <executions>
          <execution>
            <!-- Need to ensure the generated source folder is added to the project classpath, in jdt.ls -->
            <id>add-source</id>
            <phase>generate-sources</phase>
            <goals>
              <goal>add-source</goal>
            </goals>
            <configuration>
              <sources>
                <source>${generatedSources}</source>
              </sources>
            </configuration>
          </execution>
        </executions>
      </plugin>
    </plugins>
  </build>
```

### VSCode Spring Boot Yaml 和 Properties 识别自定义配置类

添加如下依赖，生成项目的 Configuration Metadata，更多参见：[Spring 官方文档](https://docs.spring.io/spring-boot/docs/current/reference/html/configuration-metadata.html#configuration-metadata.annotation-processor) | [博客](https://www.baeldung.com/spring-boot-configuration-metadata)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-configuration-processor</artifactId>
    <optional>true</optional>
</dependency>
```

### 避免断点到 Spring 切面代码中

将相关不想断点进入的包路径，配置到 launch.json 的 Java 调试配置的 `stepFilters` 的 `skipClasses` 中。

示例如下：

```json
{
    "configurations": [
        {
            "type": "java",
            "name": "Launch DemoApplication",
            "request": "launch",
            "mainClass": "com.example.demo.DemoApplication",
            "projectName": "demo",
            "stepFilters": {
                "skipClasses": [
                    "$JDK",
                    "$Libraries",
                ],
                "skipSynthetics": true,
                "skipStaticInitializers": false,
                "skipConstructors": false
            }
        }
    ]
}
```

注意：上例中的配置将会禁止调试时进入 `JDK` 和 所有外部依赖库，可能会影响阅读和调试库代码。可以尝试使用：`xxx.xxx.ClassXxx` 或 `xxx.xxx.*`的方式进行细粒度的禁用（相对比较繁琐）。

## 故障排除 Troubleshooting

* [FAQ](https://code.visualstudio.com/docs/java/java-faq)
* 确认提供该 Feature 的扩展
* 查看各个扩展 Troubleshooting 手册
    * 调试相关 [Troubleshooting](https://github.com/microsoft/vscode-java-debug/blob/main/Troubleshooting.md)
    * Language Server [Troubleshooting](https://github.com/redhat-developer/vscode-java/wiki/Troubleshooting)
    * Language Server [证书问题](https://github.com/redhat-developer/vscode-java/wiki/Use-proper-cacerts-to-import-Java-projects)
    * Language Server [Proxy 问题](https://github.com/redhat-developer/vscode-java/wiki/Using-a-Proxy)

## Reference

* [VSCode Docs - Language Java](https://code.visualstudio.com/docs/languages/java#_install-visual-studio-code-for-java)
* [VSCode Docs - Java - Project Manager](https://code.visualstudio.com/docs/java/java-project)
* [VSCode Docs - Java - Navigate and Edit](https://code.visualstudio.com/docs/java/java-editing)
* [VSCode Docs - Java - Build Tools](https://code.visualstudio.com/docs/java/java-build#_maven)
* [VSCode Docs - Java - Navigate and Edit](https://code.visualstudio.com/docs/java/java-editing)
* [VSCode Docs - Java - Refactoring](https://code.visualstudio.com/docs/java/java-refactoring)
* [VSCode Docs - Java - Linting](https://code.visualstudio.com/docs/java/java-linting)
* [VSCode Docs - Java - Debugging](https://code.visualstudio.com/docs/java/java-debugging)
* [VSCode Docs - Java - Testing](https://code.visualstudio.com/docs/java/java-testing)
* [VSCode Docs - Java - Application Servers](https://code.visualstudio.com/docs/java/java-spring-boot)
* [VSCode Docs - Java - Spring Boot](https://code.visualstudio.com/docs/java/java-spring-boot)
* [VSCode Docs - Java - GUI Applications](https://code.visualstudio.com/docs/java/java-gui)
