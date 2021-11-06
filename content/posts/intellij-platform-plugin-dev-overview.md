---
title: "Intellij 平台插件开发概览"
date: 2021-11-06T10:55:14+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 相关资源

* [官方文档](https://plugins.jetbrains.com/docs/intellij/basics.html)
* [官方 Demo](https://github.com/JetBrains/intellij-sdk-code-samples)
* [插件源码搜索浏览](https://plugins.jetbrains.com/intellij-platform-explorer)

## 插件能力

> [原文](https://plugins.jetbrains.com/docs/intellij/types-of-plugins.html)

最常见的插件能力可以分为如下几类：

* UI Themes - 定制图标、颜色、边框、编辑器方案、背景图片（[主题市场](https://plugins.jetbrains.com/search?headline=164-theme&tags=Theme)）
* 自定义语言支持 - 文件类型识别、词法分析、语法高亮、格式化、代码洞察和代码完成、检查和快速修复、Intention actions（小灯泡）（[官方手册](https://plugins.jetbrains.com/docs/intellij/custom-language-support-tutorial.html)）
* 框架集成 - 特定的代码洞察、直接访问特定于框架的功能（[Struct2 例子](https://github.com/JetBrains/intellij-plugins/tree/master/struts2) | [插件市场](https://plugins.jetbrains.com/search?orderBy=update%20date&shouldHaveSource=true&tags=Framework%20integration)）
* 工具集成 - 附加行为的实现、UI 组件、访问外部资源（[gerrit 例子](https://plugins.jetbrains.com/plugin/7272?pr=idea)）
* 添加自定义 UI 页面 - 不仅仅可以修改标准的 UI 页面，还支持添加自定义的 UI 界面

## 项目初步体验

> [Demo 库](https://github.com/rectcircle/learn-intellij-platform-plugin)

### 项目创建

> [官方文档](https://plugins.jetbrains.com/docs/intellij/github-template.html) | [github template](https://github.com/JetBrains/intellij-platform-plugin-template)

根据模板创建 github 仓库

打开 [github template](https://github.com/JetBrains/intellij-platform-plugin-template)，点击 `Use this template`

clone 到本地

```bash
git clone https://github.com/rectcircle/learn-intellij-platform-plugin.git
```

并使用 Intellej IDEA 打开 Clone 的项目（确保已安装 Java 11）

### Gradle 项目配置

> [官方文档](https://plugins.jetbrains.com/docs/intellij/gradle-prerequisites.html) | [Gradle 博客 1](https://www.jianshu.com/p/4bcdf07d4579) | [Gradle 多模块 2](https://developer.aliyun.com/article/25589) | [Gradle 多模块 3](https://www.jianshu.com/p/fabfb23274e6)

`settings.gradle.kts` Kotlin 脚本描述的 gradle Module 配置文件

```kts
// 根项目名，在 gradle 中，默认对应 maven 中的 ArtifactId 概念
rootProject.name = "learn-intellij-platform-plugin"
```

`gradle.properties` 项目属性配置文件，如插件唯一标识，需要构建的版本，平台版本，依赖的插件，Java 版本，gradle 版本等

```properties
# 插件唯一标识
pluginGroup = cn.rectcircle.learnintellijplatformplugin
pluginName = learn-intellij-platform-plugin
pluginVersion = 0.0.1

# 其他略
```

`build.gradle.kts` Kotlin 脚本描述的 gradle Build 配置文件，会读取 `gradle.properties`，进行配置

### 项目结构

```
.
├── .github/                Github 配置
├── .run/                   预定义的 Run/Debug 配置
├── gradle
│   └── wrapper/            Gradle Wrapper
├── build/                  编译输出目录
├── src                     插件源代码
│   └── main
│       ├── kotlin/         Kotlin 源码
│       ├── java/           Java 源码（需手动新建）
│       └── resources/      Resources - plugin.xml, 图标, 消息
│   └── test
│       ├── kotlin/         Kotlin 测试
│       ├── java/           Java 测试
│       └── testData/       测试数据
├── .gitignore              Git ignoring
├── build.gradle.kts        Gradle 构建配置
├── CHANGELOG.md            Full change history
├── gradle.properties       Gradle 配置属性
├── gradlew                 *nix Gradle Wrapper binary
├── gradlew.bat             Windows Gradle Wrapper binary
├── LICENSE                 License, MIT by default
├── qodana.yml              Qodana configuration file
├── README.md               README
└── settings.gradle.kts     Gradle 项目配置
```

### 插件配置文件

`src/main/resources/META-INF/plugin.xml` 插件贡献点/依赖注入配置文件

```xml
<!-- 插件配置文件. Read more: https://plugins.jetbrains.com/docs/intellij/plugin-configuration-file.html -->
<idea-plugin>
    <!-- 插件唯一标示符 -->
    <id>cn.rectcircle.learnintellijplatformplugin</id>
    <!-- 插件版本 -->
    <version>0.0.1</version>

    <!-- 插件展示名 -->
    <name>Demo 插件</name>
    <!-- 插件描述 -->
    <description><![CDATA[
        <p>这是插件描述这是插件描述这是插件描述这是插件描述这是插件描述这是插件描述</p>
        <p>这是插件描述这是插件描述这是插件描述这是插件描述这是插件描述这是插件描述</p>
    ]]></description>
    <!-- 供应商 / 作者 -->
    <vendor>rectcircle</vendor>

    <!-- 依赖的内置插件. Read more: https://plugins.jetbrains.com/docs/intellij/plugin-compatibility.html -->
    <depends>com.intellij.modules.platform</depends>

    <!-- 插件扩展声明. Read more: https://plugins.jetbrains.com/docs/intellij/plugin-extension-points.html -->
<!--    <extensionPoints></extensionPoints>-->

    <!-- 自定义扩展声明. Read more: https://plugins.jetbrains.com/docs/intellij/plugin-extensions.html#declaring-extensions -->
    <!-- 配置贡献点 -->
    <extensions defaultExtensionNs="com.intellij">
        <!-- https://plugins.jetbrains.com/docs/intellij/plugin-services.html#declaring-a-service -->
        <!-- 注册一个应用级别的 service （全局实例化一个）-->
        <applicationService serviceImplementation="com.github.rectcircle.learnintellijplatformplugin.services.MyApplicationService"/>
        <!-- 注册一个项目级别的 service（每个窗口实例化一个） -->
        <projectService serviceImplementation="com.github.rectcircle.learnintellijplatformplugin.services.MyProjectService"/>
    </extensions>

    <!-- 注册应用级别监听器. see: https://plugins.jetbrains.com/docs/intellij/plugin-listeners.html#defining-application-level-listeners -->
    <applicationListeners>
        <listener class="com.github.rectcircle.learnintellijplatformplugin.listeners.MyProjectManagerListener"
                  topic="com.intellij.openapi.project.ProjectManagerListener"/>
    </applicationListeners>
</idea-plugin>

```

### 源码概览

整体来看，Jetbrains 插件是一个 Gradle 驱动的 Java  / Kotlin 项目，UI 方面主要使用了 Swing 技术。

`src/main/kotlin/com/github/rectcircle/learnintellijplatformplugin`

```
.
├── MyBundle.kt                         提供对资源消息的访问的捆绑类（用于外部字符串）
├── listeners
│   └── MyProjectManagerListener.kt     项目粒度监听器
└── services
    ├── MyApplicationService.kt         应用粒度 Service
    └── MyProjectService.kt             项目粒度 Service
```

### 测试

参见：[此处](https://github.com/JetBrains/intellij-platform-plugin-template#testing)

### 调试运行插件

该模板已经默认配置了调试配置，选择 `Run Plugin` 即可。

此时，调试 IDE 的数据目录将存储在 `$buildDir/idea-sandbox/config` （`build/idea-sandbox/config`）下

## 调试运行最佳实践

如果插件需要运行在不同的平台（IDEA、GoLand）之中，且需要在不同的平台进行调试。设想如下场景

假设使用 IDEA 进行 插件开发，插件最终运行在 IDEA、Goland、PyCharm 之中。且开发者都是在 Mac 设备上开发，IDEA 通过 Toolbox 安装的。

此时可以按照如下方式进行配置：

编写 `build.gradle.kts`

```kts
// 通过 macos 的 defaults 命令获取 app 的路径
fun parseIdeDir(appName: String): String {
    val byteOut = ByteArrayOutputStream()
    val cmd = "defaults read '" + System.getProperties().getProperty("user.home")+ "/Applications/JetBrains Toolbox/"+ appName +".app/Contents/Info' JetBrainsToolboxApp"
    project.exec {
        commandLine("bash", "-c", cmd)
        standardOutput = byteOut
    }
    val ideDir = String(byteOut.toByteArray()).trim() + "/Contents"
    println("IdeDir is $ideDir")
    return ideDir
}

tasks {
    runIde {
        // 根据环境变量来启动不同的平台
        val runOn =System.getenv()["RUN_ON"]
        if (runOn != null && "" != runOn) {
            // https://github.com/JetBrains/gradle-intellij-plugin/issues/772
            systemProperty("idea.platform.prefix", runOn)
            // https://github.com/JetBrains/gradle-intellij-plugin/blob/master/README.md#running-dsl
            ideDir.set(file(parseIdeDir(runOn)))
        }
    }
}
```

添加 GoLand 的配置 `Run -> Edit Configuration` 选择 `Run Plugin` Copy 一份。修改表单

* Name 为 Run Plugin On Goland
* 添加环境变量 `RUN_ON=GoLand`
* 勾选 `Store as project file`

## 插件包目录结构分析

### 构建插件

> [官方文档](https://plugins.jetbrains.com/docs/intellij/deployment.html#building-distribution)

```
./gradlew buildPlugin
```

产物位于 `build/distributions` 目录下，为 zip 压缩包。里面包含 `lib` 目录，内部为一系列 jar 包

### 手动安装

`command + ,`，搜索 plugins，点击插件管理页的齿轮，点击从磁盘安装，选择上一步的 zip 包

### 安装目录

`~/Library/ApplicationSupport/JetBrains/IntelliJIdea2021.2/plugins/`，即直接将 zip 解压到此目录下

## 将外部资源打包到插件并访问

> 参考：[问答](https://intellij-support.jetbrains.com/hc/en-us/community/posts/360010217720-Looking-for-a-way-to-configure-the-gradle-to-add-bin-my-binary-exe-inside-the-plugin-zip-file)

设想一个场景，插件的功能依托于外部 cli 调用。因此，需要做到两件事

* 将这个 cli 打包到插件中
* 插件代码可以获取到安装后的插件路径

因此第一步，修改 `build.gradle.kts`

```kts
    // 在 prepareSandbox 最后一步进行资源拷贝
    prepareSandbox {
        doLast{
            copy {
                from(file("$projectDir/README.md"))
                into(file("$buildDir/idea-sandbox/plugins/${rootProject.name}/bin"))
            }
        }
    }
```

第二步，在代码里获取到插件所在路径 `src/main/kotlin/com/github/rectcircle/learnintellijplatformplugin/services/MyProjectService.kt`

```kt
    init {
        // jar:file:/Users/.../learn-intellij-platform-plugin/build/idea-sandbox/plugins/learn-intellij-platform-plugin/lib/learn-intellij-platform-plugin-0.0.1.jar!/com/github/rectcircle/learnintellijplatformplugin/services/MyProjectService.class
        // 通过获取代码所在 jar 包即可获取到插件路径，即可读取到外部资源
        println(this.javaClass.protectionDomain.codeSource.location)
    }
}
```

## 发布

### 发布到官方市场

参考：[官方文档](https://plugins.jetbrains.com/docs/intellij/deployment.html)

### 发布私有插件市场

参考：[官方文档](https://plugins.jetbrains.com/docs/intellij/update-plugins-format.html)
