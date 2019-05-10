---
title: spring指南——计划任务
date: 2017-04-15T18:41:29+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/66
  - /detail/66/
tags:
  - untagged
---

> https://spring.io/guides/gs/scheduling-tasks/
> 本指南将引导您完成使用Spring计划任务的步骤。

### 1、你需要构建的什么

你将构建一个app，每5秒打印一次当前时间，使用Spring的`@Scheduled`注解来实现

### 2、你需要什么

* 15分钟时间
* 一个你喜欢的文本编辑器或者IDE
* JDK 1.8 或更新
* Gradle 2.3+ 或 Maven 3.0+
* 您还可以将代码直接导入到IDE中：
	* Spring Tool Suite (STS)
	* IntelliJ IDEA

### 3、如何完成本指南

与大多数“入门指南”指南一样，您可以从头开始，完成每一步，也可以绕过已经熟悉的基本设置步骤。无论哪种方式，你都会得到工作代码。

要从头开始，请转到 [4、使用Gradle构建](#4-使用Gradle构建)
要跳过基本操作，请执行以下操作：

* 下载并解压本文档的源码，或者使用git克隆
`git clone https://github.com/spring-guides/gs-scheduling-tasks.git`
* `cd` 进入 `gs-scheduling-tasks/initial`
* 跳转到 [创建一个计划任务](#7、创建一个计划任务)

当你完成后，你可以对照`gs-scheduling-tasks/complete`检查你的代码

### 4、使用Gradle构建

首先你要设置一个基本的构建脚本。你可以使用任意一种你喜欢构建工具在构建Spring应用，此外Maven和 Gradle的构建方式在这里。如果你不熟悉他们请参考[Building Java Projects with Gradle](https://spring.io/guides/gs/gradle) 或者[Building Java Projects with Maven](https://spring.io/guides/gs/maven).

#### （1）创建目录结构

在您选择的项目目录中，创建以下子目录结构;例如在类unix系统中用`mkdir -p src/main/java/hello`创建

```
└── src
    └── main
        └── java
            └── hello
```

#### （2）创建`Gradle`构建文件

下面是[初始化的Gradle构建文件](https://github.com/spring-guides/gs-scheduling-tasks/blob/master/initial/build.gradle).
`build.gradle`文件

```
buildscript {
    repositories {
        mavenCentral()
    }
    dependencies {
        classpath("org.springframework.boot:spring-boot-gradle-plugin:1.5.2.RELEASE")
    }
}

apply plugin: 'java'
apply plugin: 'eclipse'
apply plugin: 'idea'
apply plugin: 'org.springframework.boot'

jar {
    baseName = 'gs-scheduling-tasks'
    version =  '0.1.0'
}

repositories {
    mavenCentral()
}

sourceCompatibility = 1.8
targetCompatibility = 1.8

dependencies {
    compile("org.springframework.boot:spring-boot-starter")
    testCompile("junit:junit")
}
```

Spring BootGradle插件提供了许多方便的功能:

* 他收集所有的jar文件在classpath中并可以构建一个单独的（不依赖web容器）、可运行的，更方便执行和传输您的服务"über-jar"
* 它搜索`public static void main()`方法来标记为可运行类。
* 它提供了一个内嵌的依赖关系解析器，可以设置版本号与[Spring Boot的依赖](#https://github.com/spring-projects/spring-boot/blob/master/spring-boot-dependencies/pom.xml)相匹配。您可以覆盖任何您想要的版本，当然它将默认为Boot的所选版本集合

### 5、使用Maven构建

首先你要设置一个基本的构建脚本。你可以使用任意一种你喜欢构建工具在构建Spring应用，此外Maven和 Gradle的构建方式在这里。如果你不熟悉他们请参考[Building Java Projects with Gradle](https://spring.io/guides/gs/gradle) 或者[Building Java Projects with Maven](https://spring.io/guides/gs/maven).

#### （1）创建目录结构

在您选择的项目目录中，创建以下子目录结构;例如在类unix系统中用`mkdir -p src/main/java/hello`创建

```
└── src
    └── main
        └── java
            └── hello
```

#### （2）创建`Maven`构建文件

`pom.xml`文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>org.springframework</groupId>
    <artifactId>gs-scheduling-tasks</artifactId>
    <version>0.1.0</version>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>1.5.2.RELEASE</version>
    </parent>

    <properties>
        <java.version>1.8</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

</project>
```

Spring BootGradle插件提供了许多方便的功能:

* 他收集所有的jar文件在classpath中并可以构建一个单独的（不依赖web容器）、可运行的，更方便执行和传输您的服务"über-jar"
* 它搜索`public static void main()`方法来标记为可运行类。
* 它提供了一个内嵌的依赖关系解析器，可以设置版本号与[Spring Boot的依赖](https://github.com/spring-projects/spring-boot/blob/master/spring-boot-dependencies/pom.xml)相匹配。您可以覆盖任何您想要的版本，当然它将默认为Boot的所选版本集合

### 6、使用你的IDE构建

* 阅读如何直接通过 [Spring Tool Suite](61)来导出代码.
* 阅读如何通过[IntelliJ IDEA](63)来导出代码.

### 7、创建一个计划任务

现在您已经设置了项目，可以创建一个计划任务。

`src/main/java/hello/ScheduledTasks.java`文件

```java
package hello;

import java.text.SimpleDateFormat;
import java.util.Date;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ScheduledTasks {

    private static final Logger log = LoggerFactory.getLogger(ScheduledTasks.class);

    private static final SimpleDateFormat dateFormat = new SimpleDateFormat("HH:mm:ss");

    @Scheduled(fixedRate = 5000)
    public void reportCurrentTime() {
        log.info("The time is now {}", dateFormat.format(new Date()));
    }
}
```

`Scheduled`注解定义了何时运行特定方法。**注意：**这个例子使用的`fixedRate`属性指定两次调用此方法的间隔时间。还有[其他的选择](http://docs.spring.io/spring/docs/current/spring-framework-reference/html/scheduling.html#scheduling-annotation-support-scheduled)，如`fixedDelay`，他指定一个任务完成后到一个任务开始之间的间隔时间。你也可以[使用`@Scheduled(cron=". . .")`表达式来设定更复杂的计划任务](http://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/scheduling/support/CronSequenceGenerator.html)。

### 8、启用计划任务

虽然计划任务可以嵌入到Web应用程序和WAR文件中，下面演示的更简单的方法创建了一个独立的应用程序。您可以在一个可执行的JAR文件中打包所有内容，由一个好的Java `main()`方法驱动。

`src/main/java/hello/Application.java`文件

```java
package hello;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class Application {

    public static void main(String[] args) throws Exception {
        SpringApplication.run(Application.class);
    }
}
```

`@SpringBootApplication`是一个方便的注释，它添加以下所有内容：

* `@Configuration`将该类标记为应用程序上下文的bean定义的源。
* `@EnableAutoConfiguration`告诉Spring Boot根据类路径设置，其他bean和各种属性设置开始添加bean。
* 通常你会为Spring MVC应用添加`@EnableWebMvc`，但是，当Spring类在类路径上看到spring-webmvc时，Spring Boot会自动添加它。这将应用程序标记为Web应用程序，并激活诸如设置DispatcherServlet等关键行为。
* `@ComponentScan`告诉Spring在hello包中寻找其他组件，配置和服务，让它找到控制器。

`main()`方法使用Spring Boot的`SpringApplication.run()`方法启动应用程序。你注意到没有一行XML吗？没有web.xml文件。这个Web应用程序是100％纯Java，您无需处理配置任何管道或基础架构。

`@EnableScheduling` 确保后台任务被创建。没有他，计划任务将不会执行。

**构建一个可执行的JAR**

您可以使用Gradle或Maven从命令行运行应用程序。或者，您可以构建一个包含所有必需依赖项，类和资源的单个可执行JAR文件，并运行该文件。这使得在整个开发生命周期，跨不同环境等方面，可以轻松地将服务作为应用程序进行发布，版本和部署。

如果您使用的是Gradle，则可以使用`./gradlew bootRun`运行该应用程序。或者，你可以使用`./gradlew build`来构建一个可执行的JAR
然后可以运行JAR文件：

```bash
java -jar build/libs/gs-scheduling-tasks-0.1.0.jar
```

如果你使用的是Maven，你可以使用`./mvnw spring-boot:run`运行程序。或者使用`./mvnw clean package`构建应用程序
然后可以运行JAR文件：

```bash
java -jar target/gs-scheduling-tasks-0.1.0.jar
```

> 上面的过程将创建一个可运行的JAR。您也可以选择构建一个经典的WAR文件。

显示记录输出。该服务应该在几秒钟内启动并运行。

Logging output is displayed and you can see from the logs that it is on a background thread. You should see your scheduled task fire every 5 seconds:
你可以看到来自后台线程的日志输出。你应该可以看到你的后台任务每五秒被触发一次

```
[...]
2016-08-25 13:10:00.143  INFO 31565 --- [pool-1-thread-1] hello.ScheduledTasks : The time is now 13:10:00
2016-08-25 13:10:05.143  INFO 31565 --- [pool-1-thread-1] hello.ScheduledTasks : The time is now 13:10:05
2016-08-25 13:10:10.143  INFO 31565 --- [pool-1-thread-1] hello.ScheduledTasks : The time is now 13:10:10
2016-08-25 13:10:15.143  INFO 31565 --- [pool-1-thread-1] hello.ScheduledTasks : The time is now 13:10:15
```

### 9、总结

恭喜！您创建了一个计划任务的应用程序。哎，实际的代码比构建文件要短！该技术适用于任何类型的应用。

想去写一个新的指南或者为我们的指南做贡献？请检出我们的[contribution guidelines](#https://github.com/spring-guides/getting-started-guides/wiki)。

> 所有的指南使用 ASLv2开源协议 和 [Attribution, NoDerivatives creative commons license](https://creativecommons.org/licenses/by-nd/3.0/) 来发布
