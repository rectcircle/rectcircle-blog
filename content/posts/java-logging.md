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

一般会继承如下两个方面的内容

* Level
* 日志输出目标

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

> http://logging.apache.org/log4j/1.2/

2015 年起 已停止维护

## LogBack

> http://www.logback.cn/
> http://logback.qos.ch/manual/index.html

### Hello World

依赖

```xml
        <!-- logback 使用的最少需要的三个包 -->
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-classic</artifactId>
            <version>1.2.3</version>
        </dependency>
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-core</artifactId>
            <version>1.2.3</version>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>1.7.30</version>
        </dependency>
```

测试代码

```java
        Logger logger = LoggerFactory.getLogger("chapters.introduction.HelloWorld1");
        logger.debug("hello world");

        // 打印内部的状态：方便调试 bug
        LoggerContext lc = (LoggerContext) LoggerFactory.getILoggerFactory();
        StatusPrinter.print(lc);
```

* Logback 没有找到 logback-test.xml 和 logback.xml 配置文件，所以通过默认的配置策略-添加一个基本的 ConsoleAppender 来进行配置。
* Appender 即 日志输出目标。

### 日志级别

一共五级：TRACE < DEBUG < INFO < WARN < ERROR

### 日志实例配置继承

和 JUL 类似，通过名字前缀确定继承树。继承内容如下

* Level
* Appender （additivity = true 的情况，默认为 true）

### 日志输出目标 Appender

> http://www.logback.cn/04%E7%AC%AC%E5%9B%9B%E7%AB%A0Appenders.html

appender 包括console、file、remote socket server、MySQL、PostgreSQL、Oracle 或者其它的数据库、JMS、remote UNIX Syslog daemons 等

接口为 `ch.qos.logback.core.Appender`，自定义建议继承 `AppenderBase`

常用的内置 Appender

* `ch.qos.logback.core.ConsoleAppender` 输出到命令行
* `ch.qos.logback.core.FileAppender` 输出到文件
* `ch.qos.logback.core.rolling.RollingFileAppender` 轮转输出到文件
* `ch.qos.logback.classic.net.SocketAppender` (`SSLSocketAppender`) 写到远端
* `ch.qos.logback.classic.net.server.ServerSocketAppender` `SSLServerSocketAppender`
* `ch.qos.logback.classic.net.SMTPAppender` 邮件方式
* `ch.qos.logback.classic.db.DBAppender` 写入到数据库

### 日志格式化 Encoder 与 Layout

> http://www.logback.cn/06%E7%AC%AC%E5%85%AD%E7%AB%A0Layouts.html

每个 Appender 可以指定一个 格式化方式，一般使用 `PatternLayout`，该方式可以通过规则字符串配置。

接口为 `ch.qos.logback.core.Layout`，自定义建议继承 `LayoutBase`

PatternLayout 模式 基本可以满足大多数需求。参见：

http://www.logback.cn/06%E7%AC%AC%E5%85%AD%E7%AB%A0Layouts.html

其他常用的 Layout

* `HTMLLayout`
* `ch.qos.logback.classic.log4j.XMLLayout`

Encoder 包裹 Layout，用于将 String 转换为 字节数组，控制何时写出。

一般使用的 是 `PatternLayoutEncoder` （默认就是）

### Filter

> http://www.logback.cn/07%E7%AC%AC%E4%B8%83%E7%AB%A0Filters.html

对日志进行过滤

### MDC

> http://www.logback.cn/07%E7%AC%AC%E4%B8%83%E7%AB%A0Filters.html

为了支持在 同一个线程中打出的日志 引用某个 信息，且这个信息在整个调用链中 唯一确定 。通过 slf4j 的 MDC 机制，可以实现这个一点。

以一个 Web 应用为例，目的为日志可以按照 会话 id 进行筛选，以方便后续 debug 和 分析

* 实现一个 filter
    * before 逻辑为 在 MDC 配置一个 session-id
    * after 逻辑为 清空 MDC 中的 session-id
* 在配置文件中的 `pattern` 中 使用 `%X{}` 取值 例如 `%X{req.remoteHost} %X{req.requestURI}%n%d - %m%n`

### 打印日志的流程

* 用户调用 logger 打条日志方法
* 使用过滤器链贩判断是否需要打印
* 比较日志级别确定是否需要打印
* 创建 LoggingEvent 对象
* 依次调用 appender
    * 调用 layout 格式化日志
    * 写出到目标

### 配置

> http://www.logback.cn/03%E7%AC%AC%E4%B8%89%E7%AB%A0logback%E7%9A%84%E9%85%8D%E7%BD%AE.html

 logback 的初始化步骤：

* logback 会在类路径下寻找名为 logback-test.xml 的文件。
* 如果没有找到，logback 会继续寻找名为 logback.groovy 的文件。
* 如果没有找到，logback 会继续寻找名为 logback.xml 的文件。
* 如果没有找到，将会通过 JDK 提供的 ServiceLoader 工具在类路径下寻找文件 META-INFO/services/ch.qos.logback.classic.spi.Configurator，该文件的内容为实现了 Configurator 接口的实现类的全限定类名。
* 如果以上都没有成功，logback 会通过 BasicConfigurator 为自己进行配置，并且日志将会全部在控制台打印出来。

`logback.xml` 基本结构

```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <root level="debug">
        <appender-ref ref="STDOUT" />
    </root>
</configuration>
```

* configuration 属性
    * `scan="true"` 检测到文件变更后，是否自动更新日志对象
    * `scanPeriod="30 seconds"` 扫描间隔
    * `packagingData="true"` 展示异常链时附加所在jar包
* configuration 包含三个种类型的孩子
    * appender 0 个或多个
    * logger 0 个或多个
    * root 一个
* appender
    * `name` 属性：用于在 `<appender-ref ref="STDOUT" />` 中引用
    * `class` 属性：用于实体化的类名
    * `layout` 子元素：0个或1个，默认为 PatternLayout
        * `class` 属性：用于实体化的类名
    * `encoder` 子元素：0 或多个 元素，默认为 `PatternLayoutEncoder`
        * `class` 属性
        * `pattern` 子元素
    * `filter` 子元素：0个或多个
    * 其他配置子元素 例如
        * `file`
* logger 或 root
    * `level` 属性： 当前 logger 的 level
    * `additivity` 属性： 是否使用父 logger 的 appender，默认为 true
    * `<appender-ref ref="STDOUT" />` 子元素：0个或多个

XML 中支持通过 `${USER_NAME}` 进行变量替换

* 变量定义
    * 环境变量
    * `java -Dxxx`
    * `<property name="USER_NAME" value="/data/logs" />`
    * `<property file="F:\project\logback-examples\src\main\resources\variables1.properties"/>` 文件路径
    * `<property resource="resource1.properties" />` classpath 路径
* 变量查找顺序
    * 本地（local scope） ` <property name="nodeId" value="firstNode"/>` 默认作用域
    * 上下文（context scope）
    * 系统（system scope）
    * 配置方式 `<property scope="context" name="nodeId" value="firstNode"/>`
* 变量使用
    * `${name}`
    * `${aNme:-golden}` 默认值
    * `${id:-${userid}}` 多次嵌套默认值
    * `${${userid}.password}` 多次替换
* 系统变量
    * `HOSTNAME`
    * `CONTEXT_NAME`
* 动态定义属性 `<define>` 标签

条件表达式

```xml
<configuration debug="true">
    <if condition='property("HOSTNAME").contains("volong")'>
        <then>
            <appender name="CON" class="ch.qos.logback.core.ConsoleAppender">
                <encoder>
                    <pattern>%d %-5level %logger{35} - %msg %n</pattern>
                </encoder>
            </appender>
            <root>
                <appender-ref ref="CON" />
            </root>
        </then>
    </if>

    <appender name="FILE" class="ch.qos.logback.core.FileAppender">
        <file>${randomOutputDir}/conditional.log</file>
        <encoder>
            <pattern>${HOSTNAME} %d %-5level %logger{35} - %msg %n</pattern>
        </encoder>
    </appender>

    <root level="ERROR">
        <appender-ref ref="FILE" />
    </root>
</configuration>
```

引入文件

* file 文件路径
* resource classpath 中查找
* url 外部文件

```xml
<configuration>
    <include file="src/main/resources/includedConfig.xml" />

    <root level="DEBUG">
        <appender-ref ref="includedConsole" />
    </root>
</configuration>
```

Example：includedConfig.xml

```xml
<included>
    <appender name="includedConsole" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d - %m%n</pattern>
        </encoder>
    </appender>
</included>
```

## SLF4J

SLF4J 是使用最广泛的日志门面，定义了一套接口，为多个日志实现提供适配。支持如下后端

* java.util.logging
* logback
* log4j
* log4j2

使用 SLF4J 需要引入 `slf4j-api.jar`

### 基本使用

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class HelloWorld {
  public static void main(String[] args) {
    Logger logger = LoggerFactory.getLogger(HelloWorld.class);
    logger.info("Hello World");
  }
}
```

其他语法：

* 占位符 `logger.debug("Temperature set to {}. Old temperature was {}.", t, oldT);`
* Java8 流畅写法 `logger.atDebug().addArgument(newT).addArgument(oldT).log("Temperature set to {}. Old temperature was {}.");`

### 常见的 SLF 绑定

* `slf4j-log4j12` 与 log4j version 1.2 绑定，此外需要引入 log4j.jar
* `slf4j-jdk14` 与 java.util.logging 绑定，又称为 JDK 1.4 logging
* `slf4j-nop` 绑定NOP，静默丢弃所有日志记录
* `slf4j-simple` 绑定 到 `System.err` 进行简单实现的绑定，它将所有事件输出到System.err。仅打印I​​NFO或更高级别的消息。在小型应用程序的上下文中，此绑定可能很有用。
* `slf4j-jcl` 绑定 到 Jakarta Commons Logging。此绑定会将所有SLF4J日志记录委派给JCL。
* `logback-classic` 绑定到 logback 需要 `logback-core`
* `log4j-slf4j-impl` 绑定到 log4j2

### 源码

slf4j-api 的 源码十分简单，主要包含

* `org.slf4j.LoggerFactory` 工具类，该类通过 捕捉 `NoClassDefFoundError` 异常 与 绑定 包 的 `org.slf4j.impl.StaticLoggerBinder` 绑定
* `ILoggerFactory` 绑定包 来实现 的 接口
* `org.slf4j.Logger` 接口，核心门面
* 其他工具比如 `MDC`

实现一个 slf4j 绑定及的方式

* 实现 类 `org.slf4j.impl.StaticLoggerBinder`
* 实现 接口 `org.slf4j.ILoggerFactory`
* 实现 接口 `org.slf4j.Logger`

## SpringBoot 集成

> Spring Boot Version: 2.x

参考

* [SpringBoot如何做文档](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto-logging)
* [SpringBoot特性文档](https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-logback-extensions)
* [博客](https://www.cnblogs.com/bigdataZJ/p/springboot-log.html)

### 依赖

不需要显示引入，因为 通过 `spring-boot-starter` 可以间接引入，包如下所示：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-logging</artifactId>
</dependency>
```

### Logback 配置

spring-boot-starter-logging 默认使用 `Logback` 作为日志后端，使用 `SLF4j` 作为日志门面。并提供了一系列常用配置：

* `logging.config` log 后端配置文件位置，比如 logback 为 `classpath:logback.xml`
* `logging.file.name` log 输出文件的文件名，默认为 `spring.log`
* `logging.file.path` log 输出文件的位置，默认为 null，即不输出文件
* `logging.level.root` 全局日志级别 默认为 `INFO`
* `logging.level.包名` 指定指定包名的日志级别
* `logging.pattern.console` 命令行输出的格式化模式串，默认为 `%clr(%d{${LOG_DATEFORMAT_PATTERN:-yyyy-MM-dd HH:mm:ss.SSS}}){faint} %clr(${LOG_LEVEL_PATTERN:-%5p}) %clr(${PID:- }){magenta} %clr(---){faint} %clr([%15.15t]){faint} %clr(%-40.40logger{39}){cyan} %clr(:){faint} %m%n${LOG_EXCEPTION_CONVERSION_WORD:-%wEx}`
* `logging.pattern.file` 文件输出的格式化模式串 `%d{${LOG_DATEFORMAT_PATTERN:-yyyy-MM-dd HH:mm:ss.SSS}} ${LOG_LEVEL_PATTERN:-%5p} ${PID:- } --- [%t] %-40.40logger{39} : %m%n${LOG_EXCEPTION_CONVERSION_WORD:-%wEx}`
* `logging.pattern.dateformat` 日期格式化
* `logging.file.*` 文件输出目标的一些列配置

完全自定义

* 在 classpath 下 创建 `logback.xml` 或者 `logback-spring.xml`
* `logback-spring.xml` 参加 [SpringBoot特性文档](https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-logback-extensions)
* [引用 Spring boot 配置文件变量](https://www.cnblogs.com/jianliang-Wu/p/8945343.html)
