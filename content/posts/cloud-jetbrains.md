---
title: "云化 JetBrains 系列 IDE"
date: 2021-01-31T22:17:54+08:00
draft: false
toc: true
comments: true
tags:
  - IDE
---

## 缘由

发现 JetBrains 官方 开源项目 [JetBrains/projector-server](https://github.com/JetBrains/projector-server) 可以实现 JetBrains 在浏览器中运行

## 运行环境

仅支持 `Linux` （注意不是 `*nix`） JDK 11

## 实验过程

### Clone 编译 [JetBrains/projector-server](https://github.com/JetBrains/projector-server)

准备

```bash
git clone https://github.com/JetBrains/projector-server.git
# 编辑 如下文件 distributionUrl=https\://code.aliyun.com/kar/gradle-bin-zip/raw/master/gradle-6.4.1-bin.zip 加速下载速度
vim gradle/wrapper/gradle-wrapper.properties
```

编译

```bash
./gradlew :projector-server:distZip
```

编译产物位于 `projector-server/build/distributions/projector-server-1.0-SNAPSHOT.zip`

复制到实验区域，并解压

```bash
cp projector-server/build/distributions/projector-server-1.0-SNAPSHOT.zip ~/Workspace/software
cd ~/Workspace/software
unzip projector-server-1.0-SNAPSHOT.zip
rm projector-server-1.0-SNAPSHOT.zip
```

### 下载解压 IDEA Linux

[下载 IDEA Linux](https://www.jetbrains.com/idea/download/#section=linux)

```bash
cd ~/Workspace/software/
tar -xzvf ideaIC-2020.3.1.tar.gz
rm -rf ideaIC-2020.3.1.tar.gz
ls
# idea-IC-203.6682.168  projector-server-1.0-SNAPSHOT
```

### 启动

修改 `idea-IC-203.6682.168/bin/idea.sh`

```bash
# 代码尾部的修改为
"$JAVA_BIN" \
  -classpath "$CLASSPATH:/home/$USER/Workspace/software/projector-server-1.0-SNAPSHOT/lib/*" \
  ${VM_OPTIONS} \
  "-XX:ErrorFile=$HOME/java_error_in_idea_%p.log" \
  "-XX:HeapDumpPath=$HOME/java_error_in_idea_.hprof" \
  "-Didea.vendor.name=${PRODUCT_VENDOR}" \
  "-Didea.paths.selector=${PATHS_SELECTOR}" \
  "-Djb.vmOptionsFile=$VM_OPTIONS_FILE" \
  ${IDE_PROPERTIES_PROPERTY} \
  -Didea.platform.prefix=Idea -Didea.jre.check=true \
  -Dorg.jetbrains.projector.server.classToLaunch=com.intellij.idea.Main \
  org.jetbrains.projector.server.ProjectorLauncher \
  "$@"
```

启动

```bash
./idea-IC-203.6682.168/bin/idea.sh
```

### 常见问题解决

libXrender.so.1: 无法打开共享对象文件: 没有那个文件或目录 等 so 找不到

```bash
sudo apt install libxrender1
sudo apt install libxtst6
```

### 访问

http://实验机器IP:8887/

## 技术分析

### 基本情况

* 总体来看，是一种类似远程桌面的方案
* JetBrains 的 UI 是基于 Java Swing 实现的，Swing 的定义的是一套 UI 接口，以屏蔽不同操作系统的 UI 相关的 API
* JetBrains/projector-server 本质上实现 Java Swing 接口，将 Swing 渲染（翻译）到浏览器的 H5 的 Canvas API。服务端和浏览器端 通过 Websocket 通讯

### JetBrains 生态

#### 插件技术体系

[官方文档](https://jetbrains.org/intellij/sdk/docs/basics/getting_started.html)

* 语言 Kotlin / Java
* 如何将 VSCode 扩展迁移在 JetBrainsVscode ，目前似乎没有现成的技术方案，可能的方案是：
    * 编写一套 VSCode API 到 JetBrains 的 Adapter 层，理论上可行（因为 JetBrains 扩展开放的能力更强），成本非常高，这方面可以看 Theia 的实现过程，工作量以年记录，但是一旦完成，意义还是很重大的。
    * 核心逻辑通过 NodeJS 实现，JetBrains 再重新实现一遍 UI，通过跨语言函数调用方式实现，实现方式有几种：
        * https://github.com/eclipsesource/J2V8
        * Nashorn 不推荐
        * 手动实现Java 与 Node 的通讯，Node 作为一个 Server

## 体验总结（2021-01-06）

* 基本可用，核心的代码编辑能力较流畅
* 发现的问题
    * 大型 UI 渲染速度较慢
    * 快捷键问题
    * 内外部剪切板不互通
* 可能处于比较早期阶段，该项目第一次开源于 2020年6月9日 （第一次提交代码 9,643 行）

## 许可证

[GPLv2](https://github.com/JetBrains/projector-server/blob/master/LICENSE.txt)
