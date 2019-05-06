---
title: spring指南——构建一个RESTful web服务
date: 2017-04-10T13:59:04+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/60
  - /detail/60/
tags:
  - java
---

> 本指南将引导您完成使用Spring创建“hello world”RESTful Web服务的过程。


## 目录
* [1、你需要构建的什么](#1、你需要构建的什么)
* [2、你需要什么](#2、你需要什么)
* [3、如何完成本指南](#3、如何完成本指南)
* [4、使用Gradle构建](#4、使用Gradle构建)
* [5、使用Maven构建](#5、使用Maven构建)
* [6、使用你的IDE构建](#6、使用你的IDE构建)
* [7、创建一个代表资源的类](#7、创建一个代表资源的类)
* [8、创建一个Controller](#8、创建一个Controller)
* [9、使应用可执行](#9、使应用可执行)
* [10、测试服务](#10、测试服务)
* [11、总结](#11、总结)



### 1、你需要构建的什么
您将构建一个将接受HTTP GET请求的服务：
```
http://localhost:8080/greeting
```
并回复一个greeting的`JSON`表示形式：
```json
{"id":1,"content":"Hello, World!"}
```
您可以使用查询字符串中的可选名称参数自定义问候语：
```
http://localhost:8080/greeting?name=User
```
name参数值将覆盖默认值“World”，并反映在响应中
```json
{"id":1,"content":"Hello, User!"}
```

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

要从头开始，请转到 [4、使用Gradle构建](#4、使用Gradle构建)
要跳过基本操作，请执行以下操作：

* 下载并解压本文档的源码，或者使用git克隆
`git clone https://github.com/spring-guides/gs-rest-service.git`
* `cd` 进入 `gs-rest-service/initial`
* 跳转到 [7、创建一个代表资源的类](#7、创建一个代表资源的类)

当你完成后，你可以对照`gs-rest-service/complete`检查你的代码



### 4、使用Gradle构建
首先你要设置一个基本的构建脚本。你可以使用任意一种你喜欢构建工具在构建Spring应用，此外Maven和 Gradle的构建方式在这里。如果你不熟悉他们请参考[Building Java Projects with Gradle](https://spring.io/guides/gs/gradle) 或者[ Building Java Projects with Maven](https://spring.io/guides/gs/maven).


#### （1）创建目录结构
在您选择的项目目录中，创建以下子目录结构;例如在类unix系统中用`mkdir -p src/main/java/hello`创建
```
└── src
    └── main
        └── java
            └── hello
```

#### （2）创建`Gradle`构建文件
下面是[初始化的Gradle构建文件](https://github.com/spring-guides/gs-rest-service/blob/master/initial/build.gradle).
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
    baseName = 'gs-rest-service'
    version =  '0.1.0'
}

repositories {
    mavenCentral()
}

sourceCompatibility = 1.8
targetCompatibility = 1.8

dependencies {
    compile("org.springframework.boot:spring-boot-starter-web")
    testCompile('org.springframework.boot:spring-boot-starter-test')
}
```
Spring BootGradle插件提供了许多方便的功能:
* 他收集所有的jar文件在classpath中并可以构建一个单独的（不依赖web容器）、可运行的，更方便执行和传输您的服务"über-jar"
* 它搜索`public static void main()`方法来标记为可运行类。
* 它提供了一个内嵌的依赖关系解析器，可以设置版本号与[Spring Boot的依赖](#https://github.com/spring-projects/spring-boot/blob/master/spring-boot-dependencies/pom.xml)相匹配。您可以覆盖任何您想要的版本，当然它将默认为Boot的所选版本集合

### 5、使用Maven构建
首先你要设置一个基本的构建脚本。你可以使用任意一种你喜欢构建工具在构建Spring应用，此外Maven和 Gradle的构建方式在这里。如果你不熟悉他们请参考[Building Java Projects with Gradle](https://spring.io/guides/gs/gradle) 或者[ Building Java Projects with Maven](https://spring.io/guides/gs/maven).


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
    <artifactId>gs-rest-service</artifactId>
    <version>0.1.0</version>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>1.5.2.RELEASE</version>
    </parent>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>com.jayway.jsonpath</groupId>
            <artifactId>json-path</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <properties>
        <java.version>1.8</java.version>
    </properties>


    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

    <repositories>
        <repository>
            <id>spring-releases</id>
            <url>https://repo.spring.io/libs-release</url>
        </repository>
    </repositories>
    <pluginRepositories>
        <pluginRepository>
            <id>spring-releases</id>
            <url>https://repo.spring.io/libs-release</url>
        </pluginRepository>
    </pluginRepositories>
</project>
```
Spring BootGradle插件提供了许多方便的功能:
* 他收集所有的jar文件在classpath中并可以构建一个单独的（不依赖web容器）、可运行的，更方便执行和传输您的服务"über-jar"
* 它搜索`public static void main()`方法来标记为可运行类。
* 它提供了一个内嵌的依赖关系解析器，可以设置版本号与[Spring Boot的依赖](https://github.com/spring-projects/spring-boot/blob/master/spring-boot-dependencies/pom.xml)相匹配。您可以覆盖任何您想要的版本，当然它将默认为Boot的所选版本集合

### 6、使用你的IDE构建
* 阅读如何直接通过 [Spring Tool Suite](61)来导出代码.
* 阅读如何通过[IntelliJ IDEA](63)来导出代码.


### 7、创建一个代表资源的类
现在您已经创建了项目并构建系统，您可以实现Web服务。

考虑服务互动开始流程。

The service will handle GET requests for /greeting, optionally with a name parameter in the query string. The GET request should return a 200 OK response with JSON in the body that represents a greeting. It should look something like this:
该服务将处理对于 `/greeting` 的 `GET` 请求 ，一个query有一个可选参数`name`。这个GET请求将返回 200 OK 的相应，响应体为对greeting的JSON格式的回应 ，响应这看起来像这样：
```json
{
    "id": 1,
    "content": "Hello, World!"
}
```

`id`字段是问候语的唯一标识符，`content`是问候语的文本表示。

为问候表示体建模，你需要创建一个表示资源的类。提供一个带有字段、构造器、对于`id`和`content`的set/set方法的`POJO`类

`src/main/java/hello/Greeting.java`文件
```java
package hello;

public class Greeting {
	private final long id;
	private final String content;
	
	public Greeting(long id, String content) {
		super();
		this.id = id;
		this.content = content;
	}
	public String getContent() {
		return content;
	}
	public long getId() {
		return id;
	}
	
}
```
> 为了安全创建不可变类，符合java最佳实践
> 正如接下来你将要看见的，Spring将使用[Jackson JSON](http://wiki.fasterxml.com/JacksonHome)类库自动将Greeting实例转换为JSON

Next you create the resource controller that will serve these greetings.
下一步，你将创建一个Controller用于为greetings服务




### 8、创建一个Controller
在Spring中用于创建RESTful服务和HTTP请求的方法是通过一个controller来处理。这些组件十分容易通过注解[`@RestController`](http://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/web/bind/annotation/RestController.html)来识别，以下`GreetingController`通过返回`Greeting`类的新实例来处理对 `/greeting` 的 `GET` 请求。

`src/main/java/hello/GreetingController.java`文件
```java
package hello;

import java.util.concurrent.atomic.AtomicLong;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GreetingController {
	
	private static final String template = "hello, %s";
	private final AtomicLong counter = new AtomicLong();
	
	@RequestMapping
	public Greeting greeting(
			@RequestParam(value="name", defaultValue="World")String name
			){
		return new Greeting(counter.incrementAndGet(), 
				String.format(template, name));
	}
}
```

这个控制器简洁而简单，但是还有很多事情已经发生了。让我们一步一步地解析它。

`@RequestMapping` 注解把HTTP请求`/greeting` 映射到 `greeting()` 方法

> 以上的例子并没有指定 `GET` 或 `PUT` 或 `POST`等等，因为`@RequestMapping`默认对所有HTTP Method都存在映射。可以使用 `@RequestMapping(method=RequestMethod.GET)` 来限制仅映射 `GET` 请求

`@RequestParam` 绑定 query字符串到 `greeting()` 方法的 `name` 参数，这个query字符串被显示的标记为可选的（默认`required=true`），如果请求没有此query字符串则使用默认值"World"。

方法体实现了创建并返回一个通过`counter`的下一个值生成的id和使用用户请求的`name`格式化 问候语`template`生成的 `content`构造的`Greeting`对象。

传统的MVC控制器和上面的RESTful Web服务控制器之间的关键区别就是创建HTTP响应主体的方式。这个RESTful Web服务控制器简单地填充并返回了一个`Greeting`对象，而不是依靠[视图技术](https://spring.io/understanding/view-templates)将Greeting数据在服务端填充到到HTML中。对象数据将作为JSON直接写入HTTP响应。

这段代码使用了Spring 4新增的 [`@RestController`](http://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/web/bind/annotation/RestController.html) 注解，它标记一个类作为Controller，其所有方法的返回作为一个domain对象而不是一个视图，是`@Controller`和` @ResponseBody`联合的速写。

`Greeting`对象必须转换为JSON。多亏了Spring的HTTP 消息转换器的支持，你没必要手动对此做转换。因为[`Jackson 2`](http://wiki.fasterxml.com/JacksonHome)已经加入在classpath中了，Spring的 `MappingJackson2HttpMessageConverter`将自动的`将Greeting`实例转换为JSON。


### 9、使应用可执行
尽管可以将此服务打包成传统[WAR](https://spring.io/understanding/WAR)文件，以部署到外部应用程序服务器。下面演示的更简单的方法创建了一个独立的应用程序。You package everything in a single, executable JAR file, driven by a good old Java main() method. 你可以将所有的东西打包成一个单独的可执行的JAR 文件，由一个好的传统的java Main()方法驱动。这样，你需要使用Spring支持的Tomcat servlet容器嵌入到HTTP运行时，而不是部署到外部实例。

`src/main/java/hello/Application.java`文件
```java
package hello;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}

}
```

`@SpringBootApplication`是一个方便的注释，它添加以下所有内容：
* `@Configuration`将该类标记为应用程序上下文的bean定义的源。
* `@EnableAutoConfiguration`告诉Spring Boot根据类路径设置，其他bean和各种属性设置开始添加bean。
* 通常你会为Spring MVC应用添加`@EnableWebMvc`，但是，当Spring类在类路径上看到spring-webmvc时，Spring Boot会自动添加它。这将应用程序标记为Web应用程序，并激活诸如设置DispatcherServlet等关键行为。
* `@ComponentScan`告诉Spring在hello包中寻找其他组件，配置和服务，让它找到控制器。

`main()`方法使用Spring Boot的`SpringApplication.run()`方法启动应用程序。你注意到没有一行XML吗？没有web.xml文件。这个Web应用程序是100％纯Java，您无需处理配置任何管道或基础架构。

**构建一个可执行的JAR**
您可以使用Gradle或Maven从命令行运行应用程序。或者，您可以构建一个包含所有必需依赖项，类和资源的单个可执行JAR文件，并运行该文件。这使得在整个开发生命周期，跨不同环境等方面，可以轻松地将服务作为应用程序进行发布，版本和部署。

如果您使用的是Gradle，则可以使用`./gradlew bootRun`运行该应用程序。或者，你可以使用`./gradlew build`来构建一个可执行的JAR
然后可以运行JAR文件：
```bash
java -jar build/libs/gs-rest-service-0.1.0.jar
```


如果你使用的是Maven，你可以使用`./mvnw spring-boot:run`运行程序。或者使用`./mvnw clean package`构建应用程序
然后可以运行JAR文件：
```bash
java -jar build/libs/gs-rest-service-0.1.0.jar
```

> 上面的过程将创建一个可运行的JAR。您也可以选择构建一个经典的WAR文件。

显示记录输出。该服务应该在几秒钟内启动并运行。




### 10、测试服务
现在服务已经启动，请访问http://localhost:8080/greeting ，你会看到：
```json
{"id":1,"content":"Hello, World!"}
```

提供一个 `name` query 字符串参数： http://localhost:8080/greeting?name=User 。注意`content`的值将从"Hello, World!" 变成 "Hello User!":
```json
{"id":2,"content":"Hello, User!"}
```

此更改表明`GreetingController`中的`@RequestParam`工作正常。`name`参数的默认值为"World"，但始终可以通过query 字符串进行显式覆盖。

还要注意`id`属性如何从`1`更改为`2`。这证明您正在跨多个请求处理相同的`GreetingController`实例，并且其`counter`字段正如预期在每个调用上递增。



### 11、总结
恭喜！您刚刚使用Spring开发了一个RESTful Web服务。

想去写一个新的指南或者为我们的指南做贡献？请检出我们的[contribution guidelines](#https://github.com/spring-guides/getting-started-guides/wiki)。

> 所有的指南使用 ASLv2开源协议 和 [Attribution, NoDerivatives creative commons license](https://creativecommons.org/licenses/by-nd/3.0/) 来发布


