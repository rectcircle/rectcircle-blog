---
title: SpringBoot
date: 2018-05-07T10:32:16+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/140
  - /detail/140/
tags:
  - java
---

> 参考：
> 《SpringBoot实战》

## 目录
* [一、入门](#一、入门)
	* [1、概述](#1、概述)
	* [2、使用SpringBoot](#2、使用SpringBoot)
* [二、开发第一个应用程序](#二、开发第一个应用程序)
	* [1、初始化项目](#1、初始化项目)
	* [2、SpringBoot起步依赖](#2、SpringBoot起步依赖)
	* [3、自动配置原理](#3、自动配置原理)
* [三、在SpringBoot中自定义配置](#三、在SpringBoot中自定义配置)
	* [1、例子：使用SpringSecurity](#1、例子：使用SpringSecurity)
	* [2、通过属性文件外置配置](#2、通过属性文件外置配置)
	* [3、定制应用程序错误页面](#3、定制应用程序错误页面)
* [四、测试](#四、测试)
	* [1、集成测试自动配置](#1、集成测试自动配置)
	* [2、测试web应用程序](#2、测试web应用程序)
	* [3、测试运行中的应用程序](#3、测试运行中的应用程序)
* [五、Groovy与SpringBootCLI](#五、Groovy与SpringBootCLI)
* [六、SpringBoot中使用Grail3](#六、SpringBoot中使用Grail3)
* [七、深入Actuator](#七、深入Actuator)
	* [1、揭秘Actuator的端点](#1、揭秘Actuator的端点)
	* [2、连接Actuator的远程shell](#2、连接Actuator的远程shell)
	* [3、通过JMX监控应用程序](#3、通过JMX监控应用程序)
	* [4、定制Actuator](#4、定制Actuator)
	* [5、保护Actuator端点](#5、保护Actuator端点)
* [八、部署SpringBoot应用程序](#八、部署SpringBoot应用程序)
	* [1、衡量多种部署方式](#1、衡量多种部署方式)
	* [2、部署到应用服务器](#2、部署到应用服务器)
	* [3、推上云端](#3、推上云端)
* [九、其他内容](#九、其他内容)
	* [1、开发者工具](#1、开发者工具)
	* [2、起步依赖](#2、起步依赖)
	* [3、配置属性](#3、配置属性)





## 一、入门
*************
### 1、概述
* 自动配置
* 起步依赖
* 命令行界面
* Actuator


### 2、使用SpringBoot
* 安装Spring Boot CLI，使用命令行创建SpringBoot项目
	* Unix类系统使用SDK包管理工具
* 使用IDEA
* 使用web页面创建




## 二、开发第一个应用程序
************
### 1、初始化项目
使用上述方式创建项目骨架：
* 创建一个启动配置类，包含main方法包含`@SpringBootApplication`注解：该注解由三个注解组成
	* @Configuration :标明该类使用Spring基于Java的配置
	* @ComponentScan :启用组件扫描
	* @EnableAutoConfiguration：启用SpringBoot自动配置
* 创建一个依赖管理配置文件，引入相关SpringBoot的起步依赖
* 创建了JavaWeb的目录结构和基本的测试文件
* 创建了application.properties配置文件


### 2、SpringBoot起步依赖
利用依赖管理工具的依赖传递、依赖继承特性。

排除特定依赖的方法
Gradle
```
compile("org.springframework.boot:spring-boot-starter-web") {
exclude group: 'com.fasterxml.jackson.core'
}
```
maven
```xml
<dependency>
<groupId>org.springframework.boot</groupId>
<artifactId>spring-boot-starter-web</artifactId>
<exclusions>
<exclusion>
<groupId>com.fasterxml.jackson.core</groupId>
</exclusion>
</exclusions>
</dependency>
```

覆盖已经引入的依赖版本
假设Web起步依赖引用了Jackson 2.3.4,但你需要使用2.4.3 1 。在Maven里,
你可以直接在pom.xml中表达诉求,就像这样:
```xml
<dependency>
<groupId>com.fasterxml.jackson.core</groupId>
<artifactId>jackson-databind</artifactId>
<version>2.4.3</version>
</dependency>
```

如果你用的是Gradle,可以在build.gradle文件里指明你要的Jackson的版本:
```
compile("com.fasterxml.jackson.core:jackson-databind:2.4.3")
```

因为这个依赖的版本比Spring Boot的Web起步依赖引入的要新,所以在Gradle里是生效的。但假如你要的不是新版本的Jackson,而是一个较早的版本呢?Gradle和Maven不太一样,Gradle倾向于使用库的最新版本。因此,如果你要使用老版本的Jackon,则不得不把老版本的依赖加入构建,并把Web起步依赖传递依赖的那个版本排除掉。




### 3、自动配置原理
* 扫描CLASSPATH，根据用户引入的Jar来自动生成相关的Bean
* 利用了Spring4及以后的条件配置（根据运行时的一些条件启动或者废弃一些配置），相关的注解为`@ConditionalXxx`





## 三、在SpringBoot中自定义配置
***************
### 1、例子：使用SpringSecurity
参见[SpringSecurity](141#一、一个简单的例子)

### 2、通过属性文件外置配置
#### （1）通过命令行在运行时指定
`$ java -jar readinglist-0.0.1-SNAPSHOT.jar --spring.main.show-banner=false`

#### （2）创建application.properties或application.yml
`spring.main.show-banner=false`

**位置** 优先级从高到低
* 外置,在相对于应用程序运行目录的/config子目录里。
* 外置,在应用程序运行的目录里。
* 内置,在config包内。
* 内置,在Classpath根目录。

application.yml里的属性会覆盖application.properties里的属性。

#### （3）将属性配置成环境变量
`$ export spring_main_show_banner=false`

#### （4）自动配置微调
* 禁用模板缓存`spring.thymeleaf.cache=false`
* 配置内嵌服务器`server.port=8000`
* 配置日志

```yml
logging.path=/var/logs/
logging.file=BookWorm.log
logging.level.root=WARN
logging.level.root.org.springframework.security=DEBUG
```

* 配置数据源

```yml
spring:
	datasource:
		url: jdbc:mysql://localhost/readinglist
		username: dbuser
		password: dbpass
```



#### （5）bean配置外置
一些第三方服务的key等内容使用这种方式

**配置内容为:**
```java
amazon.associateId=habuma-20
```
**注入配置**
```java
//方式1
@ConfigurationProperties(prefix="amazon")
public class ReadingListController {
	private String associateId;
}

//方式2：使用单独的类
@Component
@ConfigurationProperties("amazon")
public class AmazonProperties {
	private String associateId;
	public void setAssociateId(String associateId) {
		this.associateId = associateId;
	}
	public String getAssociateId() {
		return associateId;
	}
}
```

#### （6）使用 Profile 进行配置
根据运行时不同进行不同的配置比如：开发环境和生产环境
* 使用`@Profile("production")`注解，然后使用`spring.profiles.active=production`激活
* 使用特定配置文件`application-development.properties`或`application-production.properties`
* 激活方式：
	* `application.yml`等配置文件激活`spring.profiles.active=production`
	* 启动参数激活`java -jar XXX.jar --spring.profiles.active=production`
	* 环境变量激活`export SPRING_PROFILES_ACTIVE=production`



### 3、定制应用程序错误页面
创建错误页面`error.html`的模板




## 四、测试
*************
### 1、集成测试自动配置
基本形式
```java
//@RunWith(SpringJUnit4ClassRunner.class)
@RunWith(SpringRunner.class) //运行Spring上下文
@SpringBootTest //自动扫描Spring启动类并加载上下文
public class ReadListApplicationTests {
	
	@Autowired
	private YourBean yourBean;

	@Test
	public void testYourBean() { //测试你的bean
	}
}
```

### 2、测试web应用程序
#### （1）模拟SpringMVC
```
@RunWith(SpringRunner.class)
@SpringBootTest
public class ReadListApplicationTests {
	@Autowired
	WebApplicationContext webContext;
	private MockMvc mockMvc;

	@Before
	public void setupMockMvc() { //这种写法不考虑拦截器的问题（SpringSecurity没有启用）
		mockMvc = MockMvcBuilders
			.webAppContextSetup(webContext)
			.build();
	}
	
	 @Before
  public void setupMockMvc() { //启用SpringSecurity测试
    mockMvc = MockMvcBuilders
        .webAppContextSetup(webContext)
        .apply(springSecurity()) //添加拦截器，添加spring-security-test依赖
        .build();
  }

	@Test
	public void contextLoads() {
	}
}
```

更方便的是使用`@AutoConfigureMockMvc`自动配置
```java
@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureMockMvc
public class ReadListApplicationTests {
	 @Autowired
	 private MockMvc mockMvc;
}
```


#### （2）更多的SpringSecurity测试
添加spring-security-test依赖
**`@WithMockUser`注解**
```java
@Test
@WithMockUser(username="craig", //此种方式仅仅是创建User类型绕过了安全测试，当我们获取具体对象时就会有问题
password="password",
roles="READER")
public void homePage_authenticatedUser() throws Exception {

}
```

**`@WithUserDetails`注解**
这种情况必须自定义自己**userDetailsService**，否则永远是找不到用户
```java
	@Test
	@WithUserDetails("root")
	public void homePage_authenticatedUser1() throws Exception {

		mockMvc.perform(get("/")).andExpect(status().isOk());
	}
```



### 3、测试运行中的应用程序
最新SpringBoot2.0.1无法自动注入？

#### （1）使用方式
```java
@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
public class SimpleWebTest {
	RestTemplate rest = new RestTemplate();
	
	@Autowired
	private WebApplicationContext context;

	@Test
	public void exampleTest() {
		//使用
	}

}
```


#### （2）使用 Selenium 测试 HTML 页面
略


## 五、Groovy与SpringBootCLI
********
略

## 六、SpringBoot中使用Grail3
******
略


## 七、深入Actuator
**********
### 1、揭秘Actuator的端点
通过Actuator可以了解SpringBoot应用程序的运行情况

Actuator提供的端点：

|Http方法 |	路径 |	描述 |
|---------|-----|-------|
|get |	/autoconfig	| 提供了一份自动配置报告，记录哪些自动配置条件通过了，哪些没通过 |
|get |	/configprops |	描述配置属性（包含默认值）如何注入Bean |
|get |	/beans |	描述应用程序上下文里全部的Bean，以及它们的关系 |
|get |	/dump	| 获取线程活动的快照 |
|get |	/env |	获取全部环境属性 |
|get |	/env/{name} |	根据名称获取特定的环境属性值 |
|get |	/health |	报告应用程序的健康指标，这些值由 HealthIndicator 的实现类提供 |
|get |	/info |	获取应用程序的定制信息，这些信息由 info 打头的属性提供 |
|get |	/mappings |	描述全部的URI路径，以及它们和控制器（包含Actuator端点）的映射关系 |
|get |	/metrics |	报告各种应用程序度量信息，比如内存用量和HTTP请求计数 |
|get |	/metrics/{name} |	报告指定名称的应用程序度量值 |
|post |	/shutdown |	关闭应用程序，要求 endpoints.shutdown.enabled 设置为 true |
|get |	/trace |	提供基本的HTTP请求跟踪信息（时间戳、HTTP头等） |

依赖：
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

### 2、连接Actuator的远程shell
依赖
```xml
<dependency>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-remote-shell</artifactId>
</dependency>
```
* 命令行连接测试:`ssh user@localhost -p 2000`
* 输入控制台输出的密码
* 登录成功后, 就可是使用actuator下的各种名站名作为命令;
* 可以使用`endpoint list` 命令查看可以在shell中查看actuator站点的列表,列表中的端点用的是它们的Bean名称,而非URL路径
* 调用Actuator端点`endpoint invoke health`

|提供的命令 | 命令描述 |
|----------|---------|
|autoconfi | 生成自动配置说明报告,和/autoconfig端点输出的内容类似,只是把JSON换成了纯文本 |
| beans | 列出Spring应用程序上下文里的Bean,与/beans端点输出的内容类似 |
| endpoint | 调用Actuator端点 |
| metrics | 显示Spring Boot的度量信息,与/metrics端点类似,但显示的是实时更新的数据 | 



### 3、通过JMX监控应用程序
略

### 4、定制Actuator
定制大致可分五个方面
* 重命名端点。
* 启用和禁用端点。
* 自定义度量信息。
* 创建自定义仓库来存储跟踪数据。
* 插入自定义的健康指示器。

#### （1）修改端点 ID
在application配置文件添加属性`endpoints.默认端点名.id=kill` 
例子
```java
endpoints.shutdown.id=kill
```

#### （2）启用和隐藏端点
设置属性`endpoints.默认端点名.enabled=true|false`
例子全部关闭后再启用某些：
```yml
endpoints:
  enabled: false
  metrics:
    enabled: true
```

#### （3）添加自定义量度信息
在`/metrics`端点添加用户需要的信息

**实现计数或者记录一个double**
SpringActuator提供了`CounterService`和`GaugeService`接口的是实现，并自定义创建到了Spring上下文
* `CounterService`可以通过`increment(String metricName);`等方法实现一个度量的计数
* `GaugeService`可以通过`submit(String metricName, double value);`方法设定一个自定义度量的值

步骤
* 在需要使用的地方注入到代码中`@Autowired private CounterService counterService;`
* 使用其提供的方法实现逻辑
* 调用`/metrics`端点即可查看设定的值


**自定义复杂度量信息**
* 实现`PublicMetrics`接口，并使用`@Component`将其注册到Spring上下文中
* 例如实现一个记录SpringBoot启动时间、Bean及Bean定义的数量的端点

```java
package readinglist;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.endpoint.PublicMetrics;
import org.springframework.boot.actuate.metrics.Metric;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Controller;

@Component
public class ApplicationContextMetrics implements PublicMetrics {

  private ApplicationContext context;

  @Autowired
  public ApplicationContextMetrics(ApplicationContext context) {
    this.context = context;
  }
  
  @Override
  public Collection<Metric<?>> metrics() {
    List<Metric<?>> metrics = new ArrayList<Metric<?>>();
    metrics.add(new Metric<Long>("spring.context.startup-date", 
           context.getStartupDate())); //记录启动时间
    metrics.add(new Metric<Integer>("spring.beans.definitions", 
           context.getBeanDefinitionCount())); //记录Bean定义的数目
    metrics.add(new Metric<Integer>("spring.beans", 
           context.getBeanNamesForType(Object.class).length)); //记录Bean的数目
    metrics.add(new Metric<Integer>("spring.controllers",  
           context.getBeanNamesForAnnotation(Controller.class).length)); //记录Controller的数目
    return metrics;
  }
  
}
```

#### （4）创建自定义跟踪仓库
默认情况下`/trace`端点报告的跟踪信息都存储在内存仓库里,100个条目封顶。一旦仓库满了,就开始移除老的条目,给新的条目腾出空间。在开发阶段这没什么问题,但在生产环境中,大流量会造成跟踪信息还没来得及看就被丢弃。为了避免这个问题,你可以声明自己的 InMemoryTraceRepository Bean,将它的容量调整至100以上。如下配置类可以将容量调整至1000个条目:

```java
package readinglist;
import org.springframework.boot.actuate.trace.InMemoryTraceRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
@Configuration
public class ActuatorConfig {
	@Bean
	public InMemoryTraceRepository traceRepository() {
		InMemoryTraceRepository traceRepo = new InMemoryTraceRepository();
		traceRepo.setCapacity(1000);
		return traceRepo;
	}
}
```

**将请求放入数据库**
创建一个实现`TraceRepository`接口的Bean

例子将请求信息放入mongoDB
```java
package readinglist;

import java.util.Date;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.trace.Trace;
import org.springframework.boot.actuate.trace.TraceRepository;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.stereotype.Service;

//@Service
public class MongoTraceRepository implements TraceRepository {
  
  private MongoOperations mongoOps;

  @Autowired
  public MongoTraceRepository(MongoOperations mongoOps) {
    this.mongoOps = mongoOps;
  }
  
  @Override
  public void add(Map<String, Object> traceInfo) {
    mongoOps.save(new Trace(new Date(), traceInfo));
  }
  
  @Override
  public List<Trace> findAll() {
    return mongoOps.findAll(Trace.class);
  }

}
```

#### （5）插入自定义健康指示器
添加`/heath`端点的自定义内容

创建一个实现`HealthIndicator`的Bean

例如检测Amazon服务是否可用
```java
package readinglist;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class AmazonHealth implements HealthIndicator {

  @Override
  public Health health() {
    
    try {
      RestTemplate rest = new RestTemplate();
      rest.getForObject("http://www.amazon.com", String.class);
      return Health.up().build();
    } catch (Exception e) {
      return Health.down().withDetail("reason", e.getMessage()).build();
    }    
  }
  
}
```

### 5、保护Actuator端点
通过SpringSecurity配置即可
参见[SpringSecurity记录](141)

为了方面对相关端点的配置拦截，通过给端点添加前缀来实现`management.context-path=/mgmt`
此时SpringSecurity可以配置为：`.antMatchers("/mgmt/**").access("hasRole('ADMIN')")`
此时访问端点的路径为`/mgmt/端点`


## 八、部署SpringBoot应用程序
*******
### 1、衡量多种部署方式
#### （1）可选方式
* IDE中运行
* maven的spring-boot:run 或者 gradle的bootRun
* 使用maven或者gradle生成jar并在命令行运行
* 打包成war

#### （2）打包方式
* 可执行JAR
	* Maven、Gradle或Spring Boot CLI产生
	* 云环境,包括Cloud Foundry和Heroku,还有容器部署,比如Docker
* WAR 
	* Maven或Gradle 产生
	* Java应用服务器或云环境,比如Cloud Foundry


### 2、部署到应用服务器
#### （1）构建war文件
* 将打包方式更改为`war`
* 实现一个配置类

```java
package readinglist;

import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.web.SpringBootServletInitializer;

public class ReadingListServletInitializer 
       extends SpringBootServletInitializer {

  @Override
  protected SpringApplicationBuilder configure(
                                    SpringApplicationBuilder builder) {
    return builder.sources(ReadingListApplication.class); //在此指定SpringBoot启动类
  }
  
}
```

* 这样使用使用Maven、Gradle构建，就可以生成先关的war
* 如果没有删除SpringBoot的启动类，那么仍然可以独立运行`java -jar readinglist-0.0.1-SNAPSHOT.war`

#### （2）创建用于生产环境的Profile
在测试时可以使用H2内嵌数据库，在生产环境下要使用mysql等数据库

假设我们想使用运行localhost上的PostgreSQL数据库,数据库名字是readingList。下面的 @Bean 方法就能声明我们的 DataSource Bean:
```java
@Bean
@Profile("production")
public DataSource dataSource() {
	DataSource ds = new DataSource();
	ds.setDriverClassName("org.postgresql.Driver");
	ds.setUrl("jdbc:postgresql://localhost:5432/readinglist");
	ds.setUsername("habuma");
	ds.setPassword("password");
	return ds;
}
```

虽然这么做能达到目的,但是配置数据库细节的时候,最好还是不要显式地声明自己的DataSource Bean 。 在 不 替 换 自 动 配 置 的 Datasource Bean 的 情 况 下 , 我 们 还 能 通 过application.yml或application.properties来配置数据库的细节。

```yml
---
spring:
  profiles: production
  datasource:
    url: jdbc:postgresql://localhost:5432/readinglist
    username: habuma
    password: 
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
```

请注意,这个代码片段以 --- 开头,设置的第一个属性是 spring.profiles 。这说明随后的属性都只在 production Profile激活时才会生效。


**启用Profile**
通过环境变量`export SPRING_PROFILES_ACTIVE=production` 或者启动参数`java -jar XXX.jar --spring.profiles.active=production`

#### （3）开启数据库迁移
数据库迁移库：
* Flyway(http://flywaydb.org)
* Liquibase(http://www.liquibase.org)

作用
当项目迭代过程中，数据库结构发生变更，可以方便的进行升级并且不丢失数据

其他略

### 3、推上云端
#### （1）部署到Cloud Foundry
Cloud Foundry是Pivotal的PaaS平台：最吸引人的特点之一就是它既有开源版本,也有多个商业版本。
意味着：可以自己部署在私有云上

略

#### （2）部署到 Heroku
Heroku在应用程序部署上有一套独特的方法,不用部署完整的部署产物。Heroku为你的应用程序安排了一个Git仓库。每当你向仓库里提交代码时,它都会自动为你构建并部署应用程序。

略


## 九、其他内容
****************
### 1、开发者工具
依赖
```xml
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-devtools</artifactId>
</dependency>
```

#### （1）自动重启
加入以上依赖之后，自动重启功能就自动开启了。使用集成开发环境或者`mvn spring-boot:run`的方式启动后，当代码发生变更并编译之后，将自动加载：
* 静态资源自动生效（这不是devtools的功劳）
* 代码编译之后替换自动生效

**排除配置**
```yml
spring:
  devtools:
    restart:
      exclude: /static/**,/templates/**
```

**开关**
```yml
spring:
  devtools:
    restart:
      enabled: false
```

**触发更新的触发文件**
```yml
spring:
  devtools:
    restart:
      trigger-file: .trigger
```







#### （2）LiveReload
加入以上依赖之后，静态资源改变浏览器自动刷新功能就自动开启了。但是需要你自己装插件，进入Chrome应用商店搜索`LiveReload`


在调试页面点击LiveReload插件按钮即可

**开关**
```yml
spring:
  devtools:
    livereload:
      enabled: false
```


#### （3）远程开发
远程调试，运行指令如下
```
java -Xdebug -Xrunjdwp:server=y,transport=dt_socket,address=8000,suspend=n -jar  ***.jar
```


#### （4）默认的开发时属性
实际上,这就是说在开发者工具激活后,如下属性会设置为 false
* spring.thymeleaf.cache
* spring.freemarker.cache
* spring.velocity.cache
* spring.mustache.cache
* spring.groovy.template.cache


#### （5）全局配置开发者工具
在home目录添加名为`.spring-boot-devtools.properties`文件，编写关于devtools的配置。这样该机器的所有项目都会共享这一份配置。

如果想自定义，直接在项目的配置中覆盖即可


### 2、起步依赖
[官方文档](https://docs.spring.io/spring-boot/docs/current/reference/html/using-boot-build-systems.html#using-boot-starter)

### 3、配置属性

[官网文档](https://docs.spring.io/spring-boot/docs/current/reference/html/common-application-properties.html)
