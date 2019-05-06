---
title: spring指南——将Spring Boot JAR应用转换为WAR包
date: 2017-04-14T21:10:51+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/65
  - /detail/65/
tags:
  - untagged
---

Spring Boot附带两个强大的插件：
* spring-boot-gradle-plugin
* spring-boot-maven-plugin

它们本质上具有特征奇偶校验，并提供从命令行运行Spring Boot应用程序以及捆绑可运行JAR的功能。在执行阶段，几乎每个指南都提到了这个问题。

一种流行的观点，许多人仍然希望生成WAR文件以部署在容器中。这两个插件都支持。实质上，你必须重新配置你的项目区生成一个WAR文件并将嵌入式容器依赖项声明为 "provided"。这确保相关的嵌入式容器依赖关系不包含在WAR文件中。

有关如何配置应用程序为容器创建WAR文件的详细步骤，请参阅：
### 1、使用Maven打包可执行的jar或war文件
> http://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#build-tool-plugins-maven-packaging

一旦`spring-boot-maven-plugin`加入到了`pom.xml`中，他将自动的尝试重写archives （档案？）使他们使用 `spring-boot:repackage` 目标可执行。You should configure your project to build a jar or war (as appropriate) using the usual packaging element:你应该配置你的项目通过修改`packaging`标签，去构建一个jar或者war（根据情况）
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <!-- ... -->
    <packaging>jar</packaging>
    <!-- ... -->
</project>
```

你现存的文档将被在`package`阶段通过spring boot增强。您要启动的主类可以使用配置选项指定，也可以通常以常规方式向manifest 添加`Main-Class`属性。如果你没有指定一个主类，那么插件将搜索带有`public static void main(String [] args)`方法的一个类。

要构建和运行项目工件，可以键入以下内容：
```bash
mvn package
java -jar target/mymodule-0.0.1-SNAPSHOT.jar
```

要构建一个可执行并可部署到外部容器的war文件，您需要将嵌入式容器依赖项标记为"provided"，例如：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <!-- ... -->
    <packaging>war</packaging>
    <!-- ... -->
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
		<!--可能不会出现以下依赖，那么忽略即可-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
            <scope>provided</scope>
        </dependency>
        <!-- ... -->
    </dependencies>
</project>
```

> 有关如何创建可部署的war文件的更多详细信息，请参见[Section 85.1, Create a deployable war file](http://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#howto-create-a-deployable-war-file)，关键内容如下

生成可部署的war文件的第一步是提供一个`SpringBootServletInitializer`子类，并覆盖其`configure`方法。这使得使用Spring Framework的Servlet 3.0支持，并允许您在应用程序由servlet容器启动时进行配置。通常，您更新应用程序的主类以扩展`SpringBootServletInitializer`。
```java
@SpringBootApplication
public class Application extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(Application.class);
    }

    public static void main(String[] args) throws Exception {
        SpringApplication.run(Application.class, args);
    }

}
```

更改`pom.xml`如下
```xml

<packaging>war</packaging>

<dependencies>
    <!-- … -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-tomcat</artifactId>
        <scope>provided</scope>
    </dependency>
    <!-- … -->
</dependencies>
```

执行package


### 2、使用Gradle打包可执行的jar或war文件
> http://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#build-tool-plugins-gradle-packaging

略


> Spring Boot在servlet 3.0规范容器上运行。

想去写一个新的指南或者为我们的指南做贡献？请检出我们的[contribution guidelines](#https://github.com/spring-guides/getting-started-guides/wiki)。

> 所有的指南使用 ASLv2开源协议 和 [Attribution, NoDerivatives creative commons license](https://creativecommons.org/licenses/by-nd/3.0/) 来发布


