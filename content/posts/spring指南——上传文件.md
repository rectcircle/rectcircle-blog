---
title: spring指南——上传文件
date: 2017-04-24T13:54:44+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/70
  - /detail/70/
tags:
  - untagged
---

> 本指南将引导您完成创建一个可以接收HTTP multi-part文件上传的服务器应用程序

### 1、你需要构建的什么

您将创建一个接受文件上传的Spring Boot Web应用程序。您还将构建一个简单的HTML界面来上传测试文件。

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
`git clone https://github.com/spring-guides/gs-uploading-files.git`
* `cd` 进入 `gs-uploading-files/initial`
* 跳转到 [7、创建一个Application类](#7、创建一个Application类)

当你完成后，你可以对照`gs-uploading-files/complete`检查你的代码

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

下面是[初始化的Gradle构建文件](https://github.com/spring-guides/gs-uploading-files/blob/master/initial/build.gradle).
`build.gradle`文件

```gradle
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
apply plugin: 'org.springframework.boot'

jar {
    baseName = 'gs-uploading-files'
    version =  '0.1.0'
}

repositories {
    mavenCentral()
}

sourceCompatibility = 1.8
targetCompatibility = 1.8

dependencies {
    compile("org.springframework.boot:spring-boot-starter-thymeleaf")
    testCompile("org.springframework.boot:spring-boot-starter-test")
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
    <artifactId>gs-uploading-files</artifactId>
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
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
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

### 7、创建一个Application类

要启动Spring Boot MVC应用程序，我们首先需要一个启动器；这里，`spring-boot-starter-thymeleaf`和`spring-boot-starter-web`已经被添加到构建依赖里了。要使用Servlet容器上传文件，您需要注册一个`MultipartConfigElement`类（在web.xml中为`<multipart-config>`）。多亏Spring Boot，一切都为您自动配置！

开始创建以下`Application`类
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

### 8、创建一个文件上传Controller

初始应用程序已经包含几个类来处理在磁盘上存储和加载上传的文件；它们都位于hello.storage包中。我们只需要创建`FileUploadController`

`src/main/java/hello/FileUploadController.java`文件

```java
package hello;

import hello.storage.StorageFileNotFoundException;
import hello.storage.StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.IOException;
import java.util.stream.Collectors;

@Controller
public class FileUploadController {

    private final StorageService storageService;

    @Autowired
    public FileUploadController(StorageService storageService) {
        this.storageService = storageService;
    }

    @GetMapping("/")
    public String listUploadedFiles(Model model) throws IOException {

        model.addAttribute("files", storageService
                .loadAll()
                .map(path ->
                        MvcUriComponentsBuilder
                                .fromMethodName(FileUploadController.class, "serveFile", path.getFileName().toString())
                                .build().toString())
                .collect(Collectors.toList()));

        return "uploadForm";
    }

    @GetMapping("/files/{filename:.+}")
    @ResponseBody
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {

        Resource file = storageService.loadAsResource(filename);
        return ResponseEntity
                .ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\""+file.getFilename()+"\"")
                .body(file);
    }

    @PostMapping("/")
    public String handleFileUpload(@RequestParam("file") MultipartFile file,
                                   RedirectAttributes redirectAttributes) {

        storageService.store(file);
        redirectAttributes.addFlashAttribute("message",
                "You successfully uploaded " + file.getOriginalFilename() + "!");

        return "redirect:/";
    }

    @ExceptionHandler(StorageFileNotFoundException.class)
    public ResponseEntity handleStorageFileNotFound(StorageFileNotFoundException exc) {
        return ResponseEntity.notFound().build();
    }

}
```

这个类用`@Controller`注解，所以Spring MVC可以拿起它并寻找路由。每个方法都用`@GetMapping`或`@PostMapping`标记，以将路径和HTTP操作绑定到特定的Controller操作上。

在这种情况下：

* `GET /`从`StorageService`查找当前上传的文件列表，并将其加载到Thymeleaf模板中。它使用`MvcUriComponentsBuilder`计算到实际资源的链接
* `GET /files/{filename}`加载资源（如果存在），并使用`"Content-Disposition"`响应头将其发送到浏览器进行下载
* `POST /`适用于处理多部分消息`file`，并将其提供给`StorageService`进行保存

> 在生产场景中，您更有可能将文件存储在临时位置，数据库或NoSQL存储中例如[Mongo’s GridFS](http://docs.mongodb.org/manual/core/gridfs)。最好不要使用内容加载应用程序的文件系统。

### 9、创建一个简单的HTML模板

为了建立一些令人感兴趣的东西，以下Thymeleaf模板是上传文件以及显示上传内容的一个很好的例子。

`src/main/resources/templates/uploadForm.html`文件

```html
<html xmlns:th="http://www.thymeleaf.org">
<body>

	<div th:if="${message}">
		<h2 th:text="${message}"/>
	</div>

	<div>
		<form method="POST" enctype="multipart/form-data" action="/">
			<table>
				<tr><td>File to upload:</td><td><input type="file" name="file" /></td></tr>
				<tr><td></td><td><input type="submit" value="Upload" /></td></tr>
			</table>
		</form>
	</div>

	<div>
		<ul>
			<li th:each="file : ${files}">
				<a th:href="${file}" th:text="${file}" />
			</li>
		</ul>
	</div>

</body>
</html>
```

此模板有三个部分：

* 顶部的是Spring MVC写入一个[flash-scoped messages](http://docs.spring.io/spring/docs/current/spring-framework-reference/htmlsingle/#mvc-flash-attributes)的可选消息
* 允许用户上传文件的表单
* 从后端提供的文件列表

### 10、调整文件上传限制

配置文件上传时，设置文件大小的限制通常很有用。想象一下，试图处理一个5GB的文件上传！使用 Spring Boot，我们可以使用某些属性设置调整其自动配置的`MultipartConfigElement`。

将以下属性添加到现有属性设置中：

`src/main/resources/application.properties`文件

```
spring.http.multipart.max-file-size=128KB
spring.http.multipart.max-request-size=128KB
```

说明：

* `spring.http.multipart.max-file-size`设置为128KB，意味着总文件大小不能超过128KB。
* `spring.http.multipart.max-request-size`设置为128KB，意味着`multipart/form-data`的总请求大小不能超过128KB。

### 11、使应用程序可执行

尽管可以将此服务打包成传统[WAR](https://spring.io/understanding/WAR)文件，以部署到外部应用程序服务器。下面演示的更简单的方法创建了一个独立的应用程序。You package everything in a single, executable JAR file, driven by a good old Java main() method. 你可以将所有的东西打包成一个单独的可执行的JAR 文件，由一个好的传统的java Main()方法驱动。这样，你需要使用Spring支持的Tomcat servlet容器嵌入到HTTP运行时，而不是部署到外部实例。

`src/main/java/hello/Application.java`文件

```java
package hello;

import hello.storage.StorageProperties;
import hello.storage.StorageService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableConfigurationProperties(StorageProperties.class)
public class Application {

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}

	@Bean
	CommandLineRunner init(StorageService storageService) {
		return (args) -> {
            storageService.deleteAll();
            storageService.init();
		};
	}
}
```

`@SpringBootApplication`是一个方便的注释，它添加以下所有内容：

* `@Configuration`将该类标记为应用程序上下文的bean定义的源。
* `@EnableAutoConfiguration`告诉Spring Boot根据类路径设置，其他bean和各种属性设置开始添加bean。
* 通常你会为Spring MVC应用添加`@EnableWebMvc`，但是，当Spring类在类路径上看到spring-webmvc时，Spring Boot会自动添加它。这将应用程序标记为Web应用程序，并激活诸如设置DispatcherServlet等关键行为。
* `@ComponentScan`告诉Spring在hello包中寻找其他组件，配置和服务，让它找到控制器。

`main()`方法使用Spring Boot的`SpringApplication.run()`方法启动应用程序。你注意到没有一行XML吗？没有web.xml文件。这个Web应用程序是100％纯Java，您无需处理配置任何管道或基础架构。

您还需要一个目标文件夹来上传文件，所以有一个Java 8 lambda用于在启动时创建一个Boot CommandLineRunner，它创建该文件夹。

**构建一个可执行的JAR**
您可以使用Gradle或Maven从命令行运行应用程序。或者，您可以构建一个包含所有必需依赖项，类和资源的单个可执行JAR文件，并运行该文件。这使得在整个开发生命周期，跨不同环境等方面，可以轻松地将服务作为应用程序进行发布，版本和部署。

如果您使用的是Gradle，则可以使用`./gradlew bootRun`运行该应用程序。或者，你可以使用`./gradlew build`来构建一个可执行的JAR
然后可以运行JAR文件：

```bash
java -jar build/libs/gs-uploading-files-0.1.0.jar
```

如果你使用的是Maven，你可以使用`./mvnw spring-boot:run`运行程序。或者使用`./mvnw clean package`构建应用程序

然后可以运行JAR文件：

```bash
java -jar target/gs-uploading-files-0.1.0.jar
```

> 上面的过程将创建一个可运行的JAR。您也可以选择构建一个[经典的WAR文件](65)。

它运行接收文件上传的服务器端的部分。显示记录输出。该服务应该在几秒钟内启动并运行。

随着服务器的运行，您需要打开浏览器并访问  http://localhost:8080/ 查看上传表单。选择一个（小）文件，然后按"Upload"，您将看到控制器的成功页面。选择一个太大的文件，你会得到一个丑陋的错误页面。

您应该在浏览器窗口中看到这样的内容：

```
You successfully uploaded <name of your file>!
```

### 12、测试你的应用程序

在我们的应用程序中有多种方法来测试这个特定的功能。以下是使用`MockMvc`的一个示例，因此不需要启动Servlet容器：

`src/test/java/hello/FileUploadTests.java`文件

```java
package hello;

import hello.storage.StorageFileNotFoundException;
import hello.storage.StorageService;
import org.hamcrest.Matchers;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Paths;
import java.util.stream.Stream;

import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.fileUpload;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@RunWith(SpringRunner.class)
@AutoConfigureMockMvc
@SpringBootTest
public class FileUploadTests {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private StorageService storageService;

    @Test
    public void shouldListAllFiles() throws Exception {
        given(this.storageService.loadAll())
                .willReturn(Stream.of(Paths.get("first.txt"), Paths.get("second.txt")));

        this.mvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(model().attribute("files",
                        Matchers.contains("http://localhost/files/first.txt", "http://localhost/files/second.txt")));
    }

    @Test
    public void shouldSaveUploadedFile() throws Exception {
        MockMultipartFile multipartFile =
                new MockMultipartFile("file", "test.txt", "text/plain", "Spring Framework".getBytes());
        this.mvc.perform(fileUpload("/").file(multipartFile))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "/"));

        then(this.storageService).should().store(multipartFile);
    }

    @Test
    public void should404WhenMissingFile() throws Exception {
        given(this.storageService.loadAsResource("test.txt"))
                .willThrow(StorageFileNotFoundException.class);

        this.mvc.perform(get("/files/test.txt"))
                .andExpect(status().isNotFound());
    }

}
```

在这些测试中，我们使用各种`mocks`来设置与Controller和`StorageService`的交互，也可以使用`MockMultipartFile`与Servlet容器本身进行交互。

有关集成测试的示例，请查看`FileUploadIntegrationTests`类。

### 13、总结

恭喜！刚刚编写了一个使用Spring处理文件上传的Web应用程序。

想去写一个新的指南或者为我们的指南做贡献？请检出我们的[contribution guidelines](#https://github.com/spring-guides/getting-started-guides/wiki)。

> 所有的指南使用 ASLv2开源协议 和 [Attribution, NoDerivatives creative commons license](https://creativecommons.org/licenses/by-nd/3.0/) 来发布
