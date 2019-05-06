---
title: spring指南——接入网络上提供的RESTful Web服务
date: 2017-04-16T19:07:01+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/67
  - /detail/67/
tags:
  - untagged
---

> 本指南将引导您完成创建接入网络上提供的RESTful Web服务的应用程序的过程。

## 目录
* [1、你需要构建的什么](#1、你需要构建的什么)
* [2、你需要什么](#2、你需要什么)
* [3、如何完成本指南](#3、如何完成本指南)
* [4、使用Gradle构建](#4、使用Gradle构建)
* [5、使用Maven构建](#5、使用Maven构建)
* [6、使用你的IDE构建](#6、使用你的IDE构建)
* [7、获取REST资源](#7、获取REST资源)
* [8、使应用可执行](#8、使应用可执行)
* [9、使用Spring Boot管理应用程序生命周期](#9、使用Spring Boot管理应用程序生命周期)
* [10、总结](#10、总结)



### 1、你需要构建的什么
你将构建一个使用spring `RestTemplate`来取回一个Spring Boot quotation的应用，Spring Boot quotation来自这个web api：  http://gturnquist-quoters.cfapps.io/api/random

也就是说，你的app需要使用一些外部的RESTful web api，如微信api接口等，`restTemplate`可以完成从http请求到解析数据到填充实体类的全部过程


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
`git clone https://github.com/spring-guides/gs-consuming-rest.git`
* `cd` 进入 `gs-consuming-rest/initial`
* 跳转到 [获取REST资源](#7、获取REST资源)

当你完成后，你可以对照`gs-consuming-rest/complete`检查你的代码
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
    baseName = 'gs-consuming-rest'
    version =  '0.1.0'
}

repositories {
    mavenCentral()
}

sourceCompatibility = 1.8
targetCompatibility = 1.8

dependencies {
    compile("org.springframework.boot:spring-boot-starter")
    compile("org.springframework:spring-web")
    compile("com.fasterxml.jackson.core:jackson-databind")
    testCompile("junit:junit")
}
```
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
下面是[初始化的Gradle构建文件](https://github.com/spring-guides/gs-consuming-rest/blob/master/initial/build.gradle).
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
    <artifactId>gs-consuming-rest</artifactId>
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
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-web</artifactId>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
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


### 7、获取REST资源
完成项目设置后，您可以创建一个使用RESTful服务的简单应用程序。

测试的RESTful服务已经在 https://gturnquist-quoters.cfapps.io/api/random 上部署了。它随机提取有关Spring Boot的quotes ，并将其作为JSON文档返回。

如果您通过Web浏览器或curl请求该URL，您将收到一个如下所示的JSON文档：
```json
{
   type: "success",
   value: {
      id: 10,
      quote: "Really loving Spring Boot, makes stand alone Spring apps easy."
   }
}
```

足够简单，但是通过浏览器或通过curl获取不是非常有用的。

使用REST Web服务的更有用的方法是以编程方式。为了帮助您完成该任务，Spring提供了一个名为[`RestTemplate`](http://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/web/client/RestTemplate.html)的方便的模板类。`RestTemplate`使大多数RESTful服务像咒语一样一行完成。甚至可以将该数据绑定到自定义域类型。

首先，创建一个实体类以包含所需的数据。
`src/main/java/hello/Quote.java`
```java
package hello;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Quote {

    private String type;
    private Value value;

    public Quote() {
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Value getValue() {
        return value;
    }

    public void setValue(Value value) {
        this.value = value;
    }

    @Override
    public String toString() {
        return "Quote{" +
                "type='" + type + '\'' +
                ", value=" + value +
                '}';
    }
}
```

如您所见，这是一个简单的Java类，具有少量属性和匹配的getter方法。它使用Jackson JSON处理库中的`@JsonIgnoreProperties`进行注释，表明任何未绑定在此类型中的属性都应被忽略。

为了直接将数据绑定到您的自定义类型，您需要指定与从API返回的JSON文档中的键完全相同的变量名称。如果JSON文档中的变量名和键不匹配，您需要使用@JsonProperty注释来指定JSON文档的确切键。需要一个额外的类来嵌入内部引号本身。
`src/main/java/hello/Value.java`
```java
package hello;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Value {

    private Long id;
    private String quote;

    public Value() {
    }

    public Long getId() {
        return this.id;
    }

    public String getQuote() {
        return this.quote;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setQuote(String quote) {
        this.quote = quote;
    }

    @Override
    public String toString() {
        return "Value{" +
                "id=" + id +
                ", quote='" + quote + '\'' +
                '}';
    }
}
```

这使用相同的注解，但只是映射到其他数据字段。




### 8、使应用可执行
尽管可以将此服务打包成传统[WAR](https://spring.io/understanding/WAR)文件，以部署到外部应用程序服务器。下面演示的更简单的方法创建了一个独立的应用程序。You package everything in a single, executable JAR file, driven by a good old Java main() method. 你可以将所有的东西打包成一个单独的可执行的JAR 文件，由一个好的传统的java Main()方法驱动。这样，你需要使用Spring支持的Tomcat servlet容器嵌入到HTTP运行时，而不是部署到外部实例。

现在，您可以编写使用`RestTemplate`的Application类来获取数据来Spring Boot quotation服务，来填充实体类，以方便业务逻辑的使用

`src/main/java/hello/Application.java`文件
```java
public class Application {

    private static final Logger log = LoggerFactory.getLogger(Application.class);

    public static void main(String args[]) {
        RestTemplate restTemplate = new RestTemplate();
        Quote quote = restTemplate.getForObject("http://gturnquist-quoters.cfapps.io/api/random", Quote.class);
        log.info(quote.toString());
    }

}
```

因为Jackson JSON处理库已经加入是类路径中，`RestTemplate`将使用它（[通过消息转换器](http://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/http/converter/HttpMessageConverter.html)）将传入的JSON数据转换为`Quote`对象。从那里，Quote对象的内容将被记录到控制台。

在这里，您只使用RestTemplate进行HTTP GET请求。但是RestTemplate还支持其他HTTP动词，如POST，PUT和DELETE。

### 9、使用Spring Boot管理应用程序生命周期
到目前为止，我们在应用程序中没有使用Spring Boot，但是这样做有一些优势来做这些，这并不难做到。其中一个优点是我们可能希望让Spring Boot来管理`RestTemplate`中的消息转换器，这样定制很容易以声明方式添加。我们在主类上使用`@SpringBootApplication`，并转换main方法来启动它。最后我们将`RestTemplate`移动到一个`CommandLineRunner`回调，因此它在启动时由Spring Boot执行：

`src/main/java/hello/Application.java`文件
```java
package hello;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class Application {

	private static final Logger log = LoggerFactory.getLogger(Application.class);

	public static void main(String args[]) {
		SpringApplication.run(Application.class);
	}

	@Bean
	public RestTemplate restTemplate(RestTemplateBuilder builder) {
		return builder.build();
	}

	@Bean
	public CommandLineRunner run(RestTemplate restTemplate) throws Exception {
		return args -> {
			Quote quote = restTemplate.getForObject(
					"http://gturnquist-quoters.cfapps.io/api/random", Quote.class);
			log.info(quote.toString());
		};
	}
}
```

`RestTemplateBuilder`由Spring注入，如果您使用它来创建`RestTemplate`，那么您将受益于Spring引导中使用消息转换器和请求工厂的所有自动配置。我们还将`RestTemplate`解压缩成`@Bean`，使其更容易测试（这是可以被模仿的更简单的方式）

**构建可执行的JAR**
您可以使用Gradle或Maven从命令行运行应用程序。或者，您可以构建一个包含所有必需依赖项，类和资源的单个可执行JAR文件，并运行该文件。这使得在整个开发生命周期，跨不同环境等方面，可以轻松地将服务作为应用程序进行发布，版本和部署。

如果您使用Gradle，您可以使用`./gradlew bootRun`运行应用程序。或者您可以使用`./gradlew build`来构建JAR文件。然后可以运行JAR文件：
```bash
java -jar build/libs/gs-consuming-rest-0.1.0.jar
```

如果您使用Maven，则可以使用`./mvnw spring-boot:run`。或者您可以使用`./mvnw clean package`来构建JAR文件。然后可以运行JAR文件：
```bash
java -jar target/gs-consuming-rest-0.1.0.jar
```

> 上面的过程将创建一个可运行的JAR。您也可以选择[构建一个经典的WAR文件](65)。

你应该看到如下的输出，随机引用：
```
2015-09-23 14:22:26.415  INFO 23613 --- [main] hello.Application  : Quote{type='success', value=Value{id=12, quote='@springboot with @springframework is pure productivity! Who said in #java one has to write double the code than in other langs? #newFavLib'}}
```

> 如果你看到错误：`Could not extract response: no suitable HttpMessageConverter found for response type [class hello.Quote]`。您可能处于无法连接到后端服务的环境中（如果您能够访问该服务，则会发送JSON）。也许你是企业代理的背后？尝试将标准系统属性`http.proxyHost`和`http.proxyPort`设置为适合您的环境的值。

### 10、总结
恭喜！您刚刚使用Spring开发了一个RESTful Web服务。

想去写一个新的指南或者为我们的指南做贡献？请检出我们的[contribution guidelines](#https://github.com/spring-guides/getting-started-guides/wiki)。

> 所有的指南使用 ASLv2开源协议 和 [Attribution, NoDerivatives creative commons license](https://creativecommons.org/licenses/by-nd/3.0/) 来发布


