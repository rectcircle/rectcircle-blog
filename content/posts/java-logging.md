---
title: "Java Logging"
date: 2020-07-04T01:19:26+08:00
draft: false
toc: true
comments: true
tags:
  - java
---

## 基本概念

### 日志级别

几乎所有日志系统都有日志级别这个一概念，用来标识该条日志记录的严重程度。

通过配置，日志系统可以只输出日志记录严重程度 在 某个级别之上的日志，而 在 某个级别之下的日志将被丢弃。

### 日志输出目标

每条日志可以输出到多个位置，比如 标准输出、文件、socket、消息队列、企业内部自定义消息系统。

### 日志格式化

除了 `logger.log(msg)` 用户传递的消息 `msg` 之外，日志系统还能拿到很多额外的辅助信息，比如 打日志的时间、所在类的类名、所在方法名、所在文件行号、环境变量、系统信息等。

这些 额外属性 和 `msg` 如何使用，通过各个 日志系统 的日志格式化的配置字符串可以进行配置。

### 日志配置

日志系统一般通过查找 classpath 配置文件的方式 进行自动配置。配置文件的格式一般为 `.properties` 、 `.yaml` 、`.json` 、 `.xml` 等。这种方式可以在不同环境使用不同的日志配置文件。比如

* 开发环境只需要输出到 标准输出，日志级别一般为 DEBUG
* 生产环境需要输出到 文件 或者 socket，日志级别一般为 INFO

日志系统一般有如下核心配置需要配置，这些配置一般支持全局和指定几个类。

* 日志级别
* 日志格式化
* 日志输出目标

### 日志实例配置继承

一般情况下每个 类 一个 Logger 实例，这个 Logger 实例命名为 该类 类名。

为了方面，大多数日志框架 会根据包名 进行配置继承，也就是说： `com.a.b`，会继承 `com.a` 的部分配置。

## JUL （JDK Logging）

> 参考：[java.util.logging.Logger 使用详解](https://www.cnblogs.com/xingele0917/p/4120320.html)

JUK 指 Java JDK 自带的日志实现，是一套简单的日志实现。

优点

* 使用简单
* 开箱即用

缺点

* 市场占有率较低
* 功能相对较弱：
    * 格式化不支持配置文件配置

### 测试代码

`src/main/java/cn/rectcircle/learn/logging/JULUsage.java`

```java
package cn.rectcircle.learn.logging;

import java.io.IOException;
import java.util.logging.ConsoleHandler;
import java.util.logging.Handler;
import java.util.logging.Level;
import java.util.logging.LogManager;
import java.util.logging.Logger;

public class JULUsage {

    public static void main(String[] args) throws SecurityException, IOException {
        // 0. 读取配置文件
        // System.setProperty("java.util.logging.config.file", "my-jul.properties"); // 此方式只能是文件路径
        // LogManager.getLogManager().readConfiguration();
        LogManager.getLogManager().readConfiguration(JULUsage.class.getResourceAsStream("/my-jul.properties"));

        // 1. JUL 基本使用
        System.out.println(JULUsage.class.getName());
        Logger logger = Logger.getLogger(JULUsage.class.getName());
        logger.info("Hello World.");
        logger.fine("Hello World.");

        // 1.1 参数配置实验
        Handler console = new ConsoleHandler();
        console.setLevel(Level.SEVERE);
        logger.addHandler(console);
        System.out.println(logger.getHandlers().length);
        System.out.println(logger.getParent().getHandlers().length);
        System.out.println(logger.getParent().getParent().getHandlers().length);
        logger.setUseParentHandlers(false);
        logger.getParent().getParent().getHandlers()[0].setLevel(Level.ALL);

        // 2. JUL 七种 日志级别
        // SEVERE WARNING INFO CONFIG FINE FINER FINEST
        // 默认级别
        logger.setLevel(Level.ALL);
        logger.severe("严重");
        logger.warning("警告");
        logger.info("信息");
        logger.config("配置");
        logger.fine("良好");
        logger.finer("较好");
        logger.finest("最好");
    }


}
```

`src/main/resources/my-jul.properties`

```properties
# 指定以逗号分隔的日志处理器列表
handlers= java.util.logging.ConsoleHandler

# 根 Logger 的日志级别
.level= INFO

# 文件日志处理器配置
java.util.logging.FileHandler.pattern = %h/java%u.log
java.util.logging.FileHandler.limit = 50000
java.util.logging.FileHandler.count = 1
java.util.logging.FileHandler.formatter = java.util.logging.XMLFormatter

# 控制台日志处理器配置
java.util.logging.ConsoleHandler.level = FINE
java.util.logging.ConsoleHandler.formatter = java.util.logging.SimpleFormatter

# 指定某个特定 Logger 的
# cn.rectcircle.learn.logging.JULUsage.level = FINE
cn.rectcircle.learn.logging.level = FINE
```

### 配置

> 参考：[博客-JDK Logger指定配置文件](https://blog.csdn.net/zhangzeyuaaa/article/details/43204725)

默认情况下，JUC 将读取 `$JAVA_HOME/jre/lib/logging.properties` 配置文件进行初始化。

一般可以通过 `System.setProperty("java.util.logging.config.file", "/xxx/xxx/my-jul.properties");` 配置自定义的配置（该方式无法配置 jar 里面的配置文件，也无法通过 classpath 查找配置文件）。然后通过 `LogManager.getLogManager().readConfiguration()` 应用配置文件。

另外一种是通过命令行参数 `java -Djava.util.logging.config.file=<value>` 方式配置，该方式不需要手动调用 `LogManager.getLogManager().readConfiguration()`

class path 配置可以通过 `LogManager.getLogManager().readConfiguration(JULUsage.class.getResourceAsStream("/my-jul.properties"));` 方式配置

### 日志级别

* SEVERE（最高值）
* WARNING
* INFO （默认配置文件指定值）
* CONFIG
* FINE
* FINER
* FINEST（最低值）

可以在如下几个地方配置

* `.level` 根处理器的 level
* `$LoggerName.level` 某个特定的处理器的 level
* `java.util.logging.XxxHandler.level` 处理器内部的 level

某个日志消息最终是否会被写出，经过如下流程

* 当前 Logger 的 level 是什么？如果没有配置，将找到使用当前 Logger 的 Parent Logger 的 level，如果不满足直接丢弃
* 每个 Handler 自己的 Level 是否按满足，如果不足满足直接丢弃
* 最终写出

### 日志输出目标 Handler

* java.util.logging.ConsoleHandler 以System.err输出日志。
* java.util.logging.FileHandler 将信息输出到文件。（默认配置文件指定值）
* java.util.logging.StreamHandler 以指定的OutputStream实例输出日志。
* java.util.logging.SocketHandler 将信息通过Socket传送至远程主机。
* java.util.logging.MemoryHandler 将信息暂存在内存中。

### 日志格式化 Formatter

提供两个格式化对象

* `java.util.logging.SimpleFormatter`
* `java.util.logging.XMLFormatter`

如果需要定制格式化字符串，则继承 `java.util.logging.Formatter` 抽象类。不像其他日志库一样，可以通过配置解决。

### 日志实例配置继承

JDK Logger 实例，配置存在继承关系（通过 Logger 的 parent 字段）。每个 Logger 都存在一个 根 Logger，该 Logger 将绑定 `handlers` 配置的处理器，通过 `logger.setUseParentHandlers(false)` （默认为 true）来决定是否复用父 Logger 的 handlers

level 若未配置 将继承其 父亲 的 level。

继承关系，通过 Logger 的 name 来决定。`com.a.b` 是 `com.a.b.C`  的父亲。

如果配置了 `com.a.b.level = XXX`，同时在程序中创建了一个 Name 为 `com.a.b.C` 的 Logger，继承链为

```
    Logger<ROOT>
        ^
        |
    Logger<name=com.a.b>
        ^
        |
    Logger<name=com.a.b.C>
```

### 源码

> 参考：[Java Util Log](https://juejin.im/post/5edf9d7ae51d4578772eb868)

* Logger 面向用户获取日志的接口
* LoggerManager 负责管理所有 logger
* Handler 负责最终日志的输出, 例如 ConsoleHandler 输出到终端, FileHandler 输出到文件
* Formatter 用于格式化日志内容, 例如添加时间戳, 输出包名等
* Level 日志级别

## Log4J

## LogBack

## SLF4J
