---
title: spring指南——在Spring中使用JDBC访问数据库
date: 2017-04-19T23:15:58+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/69
  - /detail/69/
tags:
  - untagged
---

> 本指南将引导您了解使用Spring访问关系数据的过程。

### 1、你需要构建的什么

您将使用Spring的`JdbcTemplate`构建一个应用程序来访问存储在关系数据库中的数据。

### 2、你需要什么

* 15分钟事件
* 一个你喜欢的文本编辑器或者IDE
* JDK 1.8 或更新
* Gradle 2.3+ 或 Maven 3.0+
* 您还可以将代码直接导入到IDE中：
	* Spring Tool Suite (STS)
	* IntelliJ IDEA

### 3、如何完成本指南

与大多数[入门指南](https://spring.io/guides)一样，您可以从头开始，完成每一步，也可以绕过已经熟悉的基本设置步骤。无论哪种方式，你都会得到工作代码。

要从头开始，请转到 [4、使用Gradle构建](#4、使用Gradle构建)
要跳过基本操作，请执行以下操作：

* [下载](https://github.com/spring-guides/gs-relational-data-access/archive/master.zip)并解压本文档的源码，或者使用git克隆
`git clone https://github.com/spring-guides/gs-relational-data-access.git`
* `cd` 进入 `gs-relational-data-access/initial`
* 跳转到 [7、创建一个Customer对象](#7、创建一个Customer对象)

当你完成后，你可以对照`gs-relational-data-access/complete`检查你的代码

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

下面是[初始化的Gradle构建文件](https://github.com/spring-guides/gs-relational-data-access/blob/master/initial/build.gradle).
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
    baseName = 'gs-relational-data-access'
    version =  '0.1.0'
}

repositories {
    mavenCentral()
}

sourceCompatibility = 1.8
targetCompatibility = 1.8

dependencies {
    compile("org.springframework.boot:spring-boot-starter")
    compile("org.springframework:spring-jdbc")
    compile("com.h2database:h2")
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
    <artifactId>gs-relational-data-access</artifactId>
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
            <artifactId>spring-boot-starter-jdbc</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
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

### 7、创建一个Customer对象

您将使用的简单数据访问逻辑管理客户的名字和姓氏。要在应用程序级别表示此数据，请创建一个Customer类。

`src/main/java/hello/Customer.java`文件

```java
package hello;

public class Customer {
    private long id;
    private String firstName, lastName;

    public Customer(long id, String firstName, String lastName) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    @Override
    public String toString() {
        return String.format(
                "Customer[id=%d, firstName='%s', lastName='%s']",
                id, firstName, lastName);
    }

    // getters & setters omitted for brevity
}

```

**存储和检索数据**

Spring提供了一个名为`JdbcTemplate`的模板类，可以方便地使用SQL关系数据库和JDBC。大多数JDBC代码都实现资源获取，连接管理，异常处理和一般错误检查，这与业务逻辑的代码实现的完全无关。`JdbcTemplate`为您管理所有的这些。所有你需要做的是专注于手头的任务。

`src/main/java/hello/Application.java`文件

```java
package hello;


import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class Application implements CommandLineRunner {

	private static final Logger log = LoggerFactory.getLogger(Application.class);

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}

	@Autowired
	JdbcTemplate jdbcTemplate;

	@Override
	public void run(String... args) throws Exception {
		log.info("创建表");
		//删除已存在的表
		jdbcTemplate.execute("drop table customers if exists");
		//创建一个客户表
		jdbcTemplate.execute("CREATE TABLE customers(" +
                "id SERIAL, first_name VARCHAR(255), last_name VARCHAR(255))");

		//将整体名字的数组分割为姓和名的数组
		List<Object[]> splitUpNames = Arrays.asList("John Woo", "Jeff Dean", "Josh Bloch", "Josh Long")
				.stream().map(name -> name.split(" "))
				.collect(Collectors.toList());

		//使用Java 8流，打印列表的每个元组
		splitUpNames.forEach(
				name -> log.info(
						String.format("Inserting customer record for %s %s",
								name[0],
								name[1])
						));
		//使用JdbcTemplate的batchUpdate插入数据
		jdbcTemplate.batchUpdate("INSERT INTO customers(first_name, last_name) VALUES (?,?)", splitUpNames);

		//查询所有名字为Josh的用户记录
		log.info("查询所有名字为Josh的用户记录：");

		jdbcTemplate.query(
                "SELECT id, first_name, last_name FROM customers WHERE first_name = ?", new Object[] { "Josh" },
                (rs, rowNum) -> new Customer(rs.getLong("id"), rs.getString("first_name"), rs.getString("last_name"))
        ).forEach(customer -> log.info(customer.toString()));

	}

}

```

`@SpringBootApplication`是一个方便的注释，它添加以下所有内容：

* `@Configuration`将该类标记为应用程序上下文的bean定义的源。
* `@EnableAutoConfiguration`告诉Spring Boot根据类路径设置，其他bean和各种属性设置开始添加bean。
* 通常你会为Spring MVC应用添加`@EnableWebMvc`，但是，当Spring类在类路径上看到spring-webmvc时，Spring Boot会自动添加它。这将应用程序标记为Web应用程序，并激活诸如设置DispatcherServlet等关键行为。
* `@ComponentScan`告诉Spring在hello包中寻找其他组件，配置和服务，让它找到控制器。

`main()`方法使用Spring Boot的`SpringApplication.run()`方法启动应用程序。你注意到没有一行XML吗？没有web.xml文件。这个Web应用程序是100％纯Java，您无需处理配置任何管道或基础架构。

Spring Boot spots H2，一个内存型关系型数据库引擎，并自动创建一个连接。因为我们使用spring-jdbc，Spring Boot自动创建一个JdbcTemplate。 `@Autowired`注解`JdbcTemplate` 字段自动加载它并使其可用。

这个`Application`类实现了Spring Boot的`CommandLineRunner`接口，这就意味着将会执行`run()`方法，在Spring 上下文加载完成之后。

首先，使用`JdbcTemplate`的`execute`方法安装一些DDL。

其次，您将列出一个字符串并使用Java 8流操作，将其分为Java数组中的firstname / lastname对。

然后使用`JdbcTemplate`的`batchUpdate`方法在新创建的表中插入一些记录。方法调用的第一个参数是查询字符串，最后一个参数（对象数组s）要替换为"？"字符的查询中的变量。

> 对于单个insert语句，`JdbcTemplate`的`insert`方法是好的。但是对于多个插入，最好使用`batchUpdate`。
>
> 使用`?`通过指示JDBC绑定变量来避免SQL注入攻击的参数。

最后，您使用`query`方法来搜索表中符合条件的记录。您再次使用"?"参数创建查询的参数，在进行调用时传递实际值。最后一个参数是用于将使用Java 8 lambda使每个结果行转换为新的`Customer`对象的。

> Java 8 lambdas映射到单一方法接口，如Spring的`RowMapper`。如果您使用Java 7或更早版本，您可以轻松地插入匿名界面实现，并具有与lambda表达式的正文包含的方法正文相同的方式，并且它将与Spring无关。

### 8、构建一个可执行的JAR

您可以使用Gradle或Maven从命令行运行应用程序。或者，您可以构建一个包含所有必需依赖项，类和资源的单个可执行JAR文件，并运行该文件。这使得在整个开发生命周期，跨不同环境等方面，可以轻松地将服务作为应用程序进行发布，版本和部署。

如果您使用的是Gradle，则可以使用`./gradlew bootRun`运行该应用程序。或者，你可以使用`./gradlew build`来构建一个可执行的JAR
然后可以运行JAR文件：

```bash
java -jar build/libs/gs-relational-data-access-0.1.0.jar
```

如果你使用的是Maven，你可以使用`./mvnw spring-boot:run`运行程序。或者使用`./mvnw clean package`构建应用程序
然后可以运行JAR文件：

```bash
java -jar target/gs-relational-data-access-0.1.0.jar
```

> 上面的过程将创建一个可运行的JAR。您也可以选择构建一个经典的WAR文件。

您应该看到以下输出：

```
2015-06-19 10:58:31.152  INFO 67731 --- [           main] hello.Application                        : Creating tables
2015-06-19 10:58:31.219  INFO 67731 --- [           main] hello.Application                        : Inserting customer record for John Woo
2015-06-19 10:58:31.220  INFO 67731 --- [           main] hello.Application                        : Inserting customer record for Jeff Dean
2015-06-19 10:58:31.220  INFO 67731 --- [           main] hello.Application                        : Inserting customer record for Josh Bloch
2015-06-19 10:58:31.220  INFO 67731 --- [           main] hello.Application                        : Inserting customer record for Josh Long
2015-06-19 10:58:31.230  INFO 67731 --- [           main] hello.Application                        : Querying for customer records where first_name = 'Josh':
2015-06-19 10:58:31.242  INFO 67731 --- [           main] hello.Application                        : Customer[id=3, firstName='Josh', lastName='Bloch']
2015-06-19 10:58:31.242  INFO 67731 --- [           main] hello.Application                        : Customer[id=4, firstName='Josh', lastName='Long']
2015-06-19 10:58:31.244  INFO 67731 --- [           main] hello.Application                        : Started Application in 1.693 seconds (JVM running for 2.054)
```

### 9、总结

恭喜！您刚刚使用Spring来开发一个简单的JDBC客户端。

> Spring Boot有许多功能用于配置和自定义连接池，例如连接到外部数据库而不是内存的。有关详细信息，请参阅[用户指南](http://docs.spring.io/spring-boot/docs/1.5.2.RELEASE/reference/htmlsingle/#boot-features-configure-datasource)。

想去写一个新的指南或者为我们的指南做贡献？请检出我们的[contribution guidelines](#https://github.com/spring-guides/getting-started-guides/wiki)。

> 所有的指南使用 ASLv2开源协议 和 [Attribution, NoDerivatives creative commons license](https://creativecommons.org/licenses/by-nd/3.0/) 来发布
