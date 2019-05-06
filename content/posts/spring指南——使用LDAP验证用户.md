---
title: spring指南——使用LDAP验证用户
date: 2017-04-27T11:02:38+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/73
  - /detail/73/
tags:
  - untagged
---

> 本指南将指引你完成创建一个app并使用[Spring Security LDAP](http://http://projects.spring.io/spring-security/)进行保护


## 目录
* [1、你需要构建的什么](#1、你需要构建的什么)
* [2、你需要什么](#2、你需要什么)
* [3、如何完成本指南](#3、如何完成本指南)
* [4、使用Gradle构建](#4、使用Gradle构建)
* [5、使用Maven构建](#5、使用Maven构建)
* [6、使用你的IDE构建](#6、使用你的IDE构建)
* [7、创建一个简单的Web控制器](#7、创建一个简单的Web控制器)
* [8、构建不安全的Web应用程序](#8、构建不安全的Web应用程序)
* [9、设置Spring Security](#9、设置Spring Security)
* [10、设置用户数据](#10、设置用户数据)
* [11、总结](#11、总结)



### 1、你需要构建的什么
您将构建一个由Spring Security嵌入式基于Java的LDAP服务器保护的简单Web应用程序。您将使用包含一组用户的数据文件加载LDAP服务器。

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

* [下载](https://github.com/spring-guides/gs-authenticating-ldap/archive/master.zip)并解压本文档的源码，或者使用git克隆
`git clone https://github.com/spring-guides/gs-authenticating-ldap.git`
* `cd` 进入 `gs-rest-service/initial`
* 跳转到 [7、创建一个简单的Web控制器](#7、创建一个简单的Web控制器)

当你完成后，你可以对照`gs-authenticating-ldap/complete`检查你的代码



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
下面是[初始化的Gradle构建文件](https://github.com/spring-guides/gs-authenticating-ldap/blob/master/initial/build.gradle).
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
    baseName = 'gs-authenticating-ldap'
    version =  '0.1.0'
}

repositories {
    mavenCentral()
}

sourceCompatibility = 1.8
targetCompatibility = 1.8

// tag::security[]
dependencies {
    compile("org.springframework.boot:spring-boot-starter-web")
    testCompile("org.springframework.boot:spring-boot-starter-test")
}
// end::security[]
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
    <artifactId>gs-authenticating-ldap</artifactId>
    <version>0.1.0</version>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>1.5.2.RELEASE</version>
    </parent>

    <properties>
        <java.version>1.8</java.version>
    </properties>

    <!-- tag::security[] -->
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
    </dependencies>
    <!-- end::security[] -->

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


### 7、创建一个简单的Web控制器
在Spring中，REST端就是Spring MVC控制器。以下Spring MVC控制器通过返回一个简单的消息处理`GET /`请求：

`src/main/java/hello/HomeController.java`文件
```java
package hello;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/")
    public String index() {
        return "Welcome to the home page!";
    }
}
```

整个类被标记为`@RestController`，因此Spring MVC可以使用其内置扫描功能自动检测控制器，并自动配置Web路由。

该方法用`@RequestMapping`标记以标记路径和REST操作。在这种情况下，GET是默认行为;它返回一条消息，指示您在主页上。

`@RestController`还告诉Spring MVC将文本直接写入HTTP响应主体，因为没有任何视图。相反，当您访问该页面时，您将在浏览器中获得一个简单的消息，因为本指南的重点是使用LDAP保护页面。



### 8、构建不安全的Web应用程序
在您保护Web应用程序之前，请确认它是否正常工作。为此，您需要定义一些关键bean。为此，创建一个Application类。

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
java -jar build/libs/gs-authenticating-ldap-0.1.0.jar
```


如果你使用的是Maven，你可以使用`./mvnw spring-boot:run`运行程序。或者使用`./mvnw clean package`构建应用程序
然后可以运行JAR文件：
```bash
java -jar target/gs-authenticating-ldap-0.1.0.jar
```

> 上面的过程将创建一个可运行的JAR。您也可以选择构建一个[经典的WAR文件](65)。

如果您打开浏览器并访问  http://localhost:8080 ，您应该看到以下纯文本：
```
Welcome to the home page!
```






### 9、设置Spring Security
要配置Spring Security，您首先需要为构建添加一些额外的依赖关系。 

对于基于Gradle的版本：

`build.gradle`文件
```
dependencies {
    compile("org.springframework.boot:spring-boot-starter-web")
    compile("org.springframework.boot:spring-boot-starter-security")
    compile("org.springframework.ldap:spring-ldap-core")
    compile("org.springframework.security:spring-security-ldap")
    compile("org.springframework:spring-tx")
    compile("com.unboundid:unboundid-ldapsdk")
    testCompile("org.springframework.boot:spring-boot-starter-test")
    testCompile("org.springframework.security:spring-security-test")
}
```

> 由于Gradle a artifact resolution issue ,spring-tx必须被拉进来，否则一个旧的版本Gradle将不工作。

对于基于Maven的版本：

`pom.xml`文件
```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.ldap</groupId>
        <artifactId>spring-ldap-core</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.security</groupId>
        <artifactId>spring-security-ldap</artifactId>
    </dependency>
    <dependency>
        <groupId>com.unboundid</groupId>
        <artifactId>unboundid-ldapsdk</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.security</groupId>
        <artifactId>spring-security-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

这些依赖关系添加了Spring Security和UnboundId，一个开源的LDAP服务器。这样就可以使用纯Java来配置安全策略。

`src/main/java/hello/WebSecurityConfig.java`文件
```java
package hello;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.encoding.LdapShaPasswordEncoder;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.ldap.DefaultSpringSecurityContextSource;

@Configuration
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http
			.authorizeRequests()
				.anyRequest().fullyAuthenticated()
				.and()
			.formLogin();
	}

	@Override
	public void configure(AuthenticationManagerBuilder auth) throws Exception {
		auth
			.ldapAuthentication()
				.userDnPatterns("uid={0},ou=people")
				.groupSearchBase("ou=groups")
				.contextSource(contextSource())
				.passwordCompare()
					.passwordEncoder(new LdapShaPasswordEncoder())
					.passwordAttribute("userPassword");
	}

	@Bean
	public DefaultSpringSecurityContextSource contextSource() {
		return  new DefaultSpringSecurityContextSource(Arrays.asList("ldap://localhost:8389/"), "dc=springframework,dc=org");
	}

}
```
`@EnableWebSecurity`打开使用Spring Security所需的各种bean。

你也需要一个LDAP服务器， Spring Boot为嵌入式服务器提供自动配置，在本指南中使用纯java进行配置。`ldapAuthentication()`方法配置一些事情，登录表单中的用户名被插入 `{0}`，使其在 LDAP 服务器中搜索 `uid={0},ou=people,dc=springframework,dc=org`。此外，`passwordCompare()`方法配置编码器和密码属性的名称。


### 10、设置用户数据
`application.properties`文件
```
spring.ldap.embedded.ldif=classpath:test-server.ldif
spring.ldap.embedded.base-dn=dc=springframework,dc=org
spring.ldap.embedded.port=8389
```

LDAP服务器可以使用LDIF（LDAP数据交换格式）文件交换用户数据。`application.properties`中的`spring.ldap.embedded.ldif`属性允许Spring Boot拉入LDIF数据文件。这样可以轻松地预加载演示数据。

`src/main/resources/test-server.ldif`文件

```
dn: dc=springframework,dc=org
objectclass: top
objectclass: domain
objectclass: extensibleObject
dc: springframework

dn: ou=groups,dc=springframework,dc=org
objectclass: top
objectclass: organizationalUnit
ou: groups

dn: ou=subgroups,ou=groups,dc=springframework,dc=org
objectclass: top
objectclass: organizationalUnit
ou: subgroups

dn: ou=people,dc=springframework,dc=org
objectclass: top
objectclass: organizationalUnit
ou: people

dn: ou=space cadets,dc=springframework,dc=org
objectclass: top
objectclass: organizationalUnit
ou: space cadets

dn: ou=\"quoted people\",dc=springframework,dc=org
objectclass: top
objectclass: organizationalUnit
ou: "quoted people"

dn: ou=otherpeople,dc=springframework,dc=org
objectclass: top
objectclass: organizationalUnit
ou: otherpeople

dn: uid=ben,ou=people,dc=springframework,dc=org
objectclass: top
objectclass: person
objectclass: organizationalPerson
objectclass: inetOrgPerson
cn: Ben Alex
sn: Alex
uid: ben
userPassword: {SHA}nFCebWjxfaLbHHG1Qk5UU4trbvQ=

dn: uid=bob,ou=people,dc=springframework,dc=org
objectclass: top
objectclass: person
objectclass: organizationalPerson
objectclass: inetOrgPerson
cn: Bob Hamilton
sn: Hamilton
uid: bob
userPassword: bobspassword

dn: uid=joe,ou=otherpeople,dc=springframework,dc=org
objectclass: top
objectclass: person
objectclass: organizationalPerson
objectclass: inetOrgPerson
cn: Joe Smeth
sn: Smeth
uid: joe
userPassword: joespassword

dn: cn=mouse\, jerry,ou=people,dc=springframework,dc=org
objectclass: top
objectclass: person
objectclass: organizationalPerson
objectclass: inetOrgPerson
cn: Mouse, Jerry
sn: Mouse
uid: jerry
userPassword: jerryspassword

dn: cn=slash/guy,ou=people,dc=springframework,dc=org
objectclass: top
objectclass: person
objectclass: organizationalPerson
objectclass: inetOrgPerson
cn: slash/guy
sn: Slash
uid: slashguy
userPassword: slashguyspassword

dn: cn=quote\"guy,ou=\"quoted people\",dc=springframework,dc=org
objectclass: top
objectclass: person
objectclass: organizationalPerson
objectclass: inetOrgPerson
cn: quote\"guy
sn: Quote
uid: quoteguy
userPassword: quoteguyspassword

dn: uid=space cadet,ou=space cadets,dc=springframework,dc=org
objectclass: top
objectclass: person
objectclass: organizationalPerson
objectclass: inetOrgPerson
cn: Space Cadet
sn: Cadet
uid: space cadet
userPassword: spacecadetspassword



dn: cn=developers,ou=groups,dc=springframework,dc=org
objectclass: top
objectclass: groupOfUniqueNames
cn: developers
ou: developer
uniqueMember: uid=ben,ou=people,dc=springframework,dc=org
uniqueMember: uid=bob,ou=people,dc=springframework,dc=org

dn: cn=managers,ou=groups,dc=springframework,dc=org
objectclass: top
objectclass: groupOfUniqueNames
cn: managers
ou: manager
uniqueMember: uid=ben,ou=people,dc=springframework,dc=org
uniqueMember: cn=mouse\, jerry,ou=people,dc=springframework,dc=org

dn: cn=submanagers,ou=subgroups,ou=groups,dc=springframework,dc=org
objectclass: top
objectclass: groupOfUniqueNames
cn: submanagers
ou: submanager
uniqueMember: uid=ben,ou=people,dc=springframework,dc=org
```

> 使用LDIF文件不是生产系统的标准配置。但是，它对测试目的或指南非常有用。

如果您访问  http://localhost:8080 的站点，则应将其重定向到Spring Security提供的登录页面。

输入用户名**ben**和密码**benspassword**。您应该在浏览器中看到此消息：

```
Welcome to the home page!
```




### 11、总结
恭喜！您刚刚编写了一个Web应用程序，并使用[Spring Security](http://docs.spring.io/spring-security/site/docs/current/reference/htmlsingle/)保护它。在这个例子中，您使用了[基于LDAP的用户存储](http://docs.spring.io/spring-security/site/docs/current/reference/htmlsingle/#ldap)。

想去写一个新的指南或者为我们的指南做贡献？请检出我们的[contribution guidelines](#https://github.com/spring-guides/getting-started-guides/wiki)。

> 所有的指南使用 ASLv2开源协议 和 [Attribution, NoDerivatives creative commons license](https://creativecommons.org/licenses/by-nd/3.0/) 来发布


