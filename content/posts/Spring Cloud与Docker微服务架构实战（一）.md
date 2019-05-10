---
title: Spring Cloud与Docker微服务架构实战（一）
date: 2018-05-09T20:18:56+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/143
  - /detail/143/
tags:
  - Java
  - 分布式
---

> 参考
> 《Spring Cloud与Docker微服务架构实战》
> [在线开源书](https://eacdy.gitbooks.io/spring-cloud-book/content/)
> [源码地址1](https://github.com/itmuch/spring-cloud-docker-microservice-book-code)
> [源码地址2](https://github.com/itmuch/spring-cloud-docker-microservice-book-code-docker)

## 一、微服务架构概述

***

### 1、单体应用架构存在的问题

初期易于部署测试，随着需求增加，人员流动，代码库飞快膨胀，臃肿，可维护性、灵活性逐渐降低，维护成本越来越高

* 复杂性高
	* 模块过多，边界模糊，依赖不清，质量参差不齐，难以修复问题
* 技术债务高
* 部署频率低，因为都需要全量部署
* 可靠性差，一个Bug导致整个程序崩溃
* 扩展能力受限
* 阻碍技术创新，更改架构代价高

### 2、如何解决单体架构存在的问题

* 使用微服务

### 3、什么是微服务

* 将单个应用程序开发为一组小型服务的方法，每个服务都运行在自己的进程，服务间使用轻量级通信机制（通常使用http资源api）。
* 这些服务围绕业务能力构建并且可通过全自动部署机制独立部署。
* 这些服务共用一个最小型的集中式的管理，服务可用不同的语言开发，使用不同的数据数据存储技术

**特性**

* 每个微服务可独立运行在自己的进程里
* 一系列独立运行的微服务共同构建起整个系统
* 每个服务为独立的业务开发，一个微服务只关注某个特定的功能，如订单管理、用户管理
* 轻量级通信，如RESTful API
* 可以使用不同语言与数据存储技术
* 全自动部署

### 4、微服务架构的优点与挑战

**优点**

* 易于开发和维护
* 单个微服务启动较快
* 局部修改容易部署
* 技术栈不受限
* 按需收缩

**挑战**

* 运维要求高
* 分布式固有的复杂性
* 接口调试成本高
* 重复代码难以利用

### 5、微服务设计原则

* 单一职责原则
* 服务自治原则
* 轻量级通讯机制（REST、AMQP、STOMP、MQTT）
* 粒度合理：服务的粒度划分不应以代码量为标准，应该以业务边界为准（使用领域驱动设计的界限上下文）、要考虑团队现状

[康威定理](https://yq.aliyun.com/articles/8611)

* 组织沟通方式决定系统设计
* 时间再多一件事情也不可能做的完美，但总有时间做完一件事情
* 线型系统和线型组织架构间有潜在的异质同态特性
* 大的系统组织总是比小系统更倾向于分解

### 6、如何实现微服务架构

需要开发框架支持、自动部署工具支持、以及Iaas、Paas、Caas

* IaaS：基础设施服务，Infrastructure-as-a-service
* PaaS：平台服务，Platform-as-a-service
* SaaS：软件服务，Software-as-a-service

* 开发框架选择——Spring Cloud
* 运行平台——docker

## 二、微服务开发框架——SpringCloud

***

### 1、SpringCloud简介

SpringCloud开发的程序部署到Docker或者Paas平台，叫做云原生应用。

扩展：云原生应用最佳实践[《十二要素应用宣言》](https://blog.csdn.net/tiger0709/article/details/77505859)

### 2、SpringCloud特点

* 约定优于配置
* 适用各种环境
* 隐藏了组件的复杂性，并提供声明式、无xml的配置方式
* 开箱即用，快速启动
* 组件轻量、丰富、功能齐全
* 选型中立丰富
* 灵活

### 3、SpringCloud版本

略

## 三、开始使用SpringCloud实战微服务

***

### 1、SpringCloud实战前提

#### （1）技术选型

* SpringBoot构建，版本1.4.3.RELEASE
* Maven管理依赖，版本3.3.9
* SpringCloud，版本Camdem SR4

尽量选择与学习一致的版本，**学习需要成本**，使用相同的版本可以避免踩坑

### 2、服务提供者与服务消费者

#### （1）几个定义

* 服务提供者：服务的被调用方（为其他服务提供服务的服务）
* 服务消费者：服务被调用方（依赖其他服务的服务）

#### （2）实例

实现一个购票系统（和普通的web项目没区别）

```
用户 ----购票----> 电影微服务 ----查询用户信息----> 用户微服务
```

### 3、编写服务提供者

#### （1）依赖

* SpringBoot:1.4.3.RELEASE
* spring-boot-starter-web
* spring-boot-starter-data-jpa
* h2数据库
* org.springframework.cloud:Camden.SR4

#### （2）数据库与实体

* [数据库和表格建立语句](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/blob/master/microservice-simple-provider-user/src/main/resources/schema.sql)
* [向数据库中插入测试数据](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/blob/master/microservice-simple-provider-user/src/main/resources/data.sql)
* [用户实体](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/blob/master/microservice-simple-provider-user/src/main/java/com/itmuch/cloud/study/entity/User.java)
* [DAO](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/blob/master/microservice-simple-provider-user/src/main/java/com/itmuch/cloud/study/repository/UserRepository.java)

#### （3）[创建Controller](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/blob/master/microservice-simple-provider-user/src/main/java/com/itmuch/cloud/study/controller/UserController.java)

#### （4）[启动类](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/blob/master/microservice-simple-provider-user/src/main/java/com/itmuch/cloud/study/ProviderUserApplication.java)

#### （5）[配置文件](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/blob/master/microservice-simple-provider-user/src/main/resources/application.yml)

#### （6）运行

```bash
mvn spring-boot:run
```

#### （7）测试

```
http://localhost:8000/1
```

### 4、编写服务消费者

#### （1）项目结构

* 只要包含一个实体对象和Controller即可
* 也是一个普通的SpringBoot项目

#### （2）[源码](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-simple-consumer-movie)

#### （3）启动测试

```bash
#先启动服务提供者
#启动本项目
mvn spring-boot:run
#访问http://localhost:8010/user/1
```

### 5、为项目整合SpringBootActuator

SpringBootActuator是服务器健康监控工具

#### （1）依赖

添加相关依赖

```java
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
```

#### （2）介绍

详细内容参见[SpringBoot手册](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#production-ready)

#### （3）使用

```
访问:
http://localhost:8000/health
http://localhost:8000/info
```

### 6、硬编码的问题

这样就简单实现了一个简单的微服务系统，和传统的单体应用很相似

但是我们将服务提供者的接口信息硬编码到了代码中，这样存在以下问题

* 使用场景有限，当ip端口变了之后代码或者配置就要大幅修改
* 无法动态伸缩，难以实现负载均衡

解决这些问题的思路就是解耦，使用一些工具解耦

* 微服务的注册及发现工具

## 四、微服务注册与发现

***

### 1、服务注册与发现简介

#### （1）功能

当服务部署的环境发生改变，服务的配置基本不用发生改变

服务提供者、服务消费者、服务发现组件的关系

* 各个微服务在启动时将自己的网络信息发送到服务发现组件中，服务发现组件会储存这些信息
* 服务消费者从服务发现组件中查询服务提供者的网络地址，并使用该地址调用服务提供的接口
* 各个微服务与服务发现组件见存在一定的通信机制（如心跳）。若发现组件长时间无法与微服务实例间通信，就会注销该实例
* 微服务的地址发生变更，会重新注册到服务发现组件中

功能如下

* 服务注册表
* 服务注册与发现
* 服务检查

#### （2）Spring的支持

Spring Cloud提供了多种服务发现的实现方式，例如：Eureka、Consul、Zookeeper。
Spring Cloud支持得最好的是Eureka，其次是Consul，最次是Zookeeper。

### 2、Eureka

#### （1）简介

Eureka是Netflix开发的服务发现框架,本身是一个基于REST的服务。包括Client和Server。集成在Spring Cloud Netflix中
[文档](https://github.com/Netflix/eureka/wiki)

#### （2）原理

**Amazon Web Service**

* Region 相当于一个地理位置（一个数据中心）
* Availability Zone可以理解为一个机房

![Eureka架构图](/res/RWUElu3UcQy131zYzJDbEq0-.png)

* application service 相当于服务提供者
* application Client 相当于服务消费者
* make remote call 相当于调用RESTful API
* us-east-1c、us-east-1d等都是zone，都属于us-east-1这个region

Eureka包含连个组件 Eureka server和Eureka client

* Eureka server提供服务注册发现能力，当微服务启动后会向Eureka server注册自己的信息（ip、端口、服务名称），Eureka server会存储下来
* Eureka client是一个Java客户端用于简化与Eureka server的交互
* 微服务启动后会周期性的（默认30s）向Eureka server发送心跳续约自己的租期
* 若Eureka server一段时间内没有收到心跳（默认90s）就会注销该实例
* 默认情况下Eureka server也是Eureka client。
* 多个Eureka server互相通过复制同步数据
* Eureka client会缓存服务信息

### 3、Eureka简单使用

#### （1）编写Eureka Server

**依赖**

* springboot
* spring-cloud-starter-eureka-server

**启动类**

```java
@SpringBootApplication
@EnableEurekaServer
public class EurekaApplication {
  public static void main(String[] args) {
    SpringApplication.run(EurekaApplication.class, args);
  }
}
```

**配置文件**

```yml
server:
  port: 8761                    # 指定该Eureka实例的端口
server:
  port: 8761                    # 指定该Eureka实例的端口
eureka:
  client:
    registerWithEureka: false #是否将自己注册到EurekaServer
    fetchRegistry: false      #是否从EurekaServer获取注册信息
    serviceUrl:               #设置与EurekaServer交互的地址
      defaultZone: http://localhost:8761/eureka/

# 参考文档：http://projects.spring.io/spring-cloud/docs/1.0.3/spring-cloud.html#_standalone_mode
# 参考文档：http://my.oschina.net/buwei/blog/618756
```

**启动**

```bash
mvn spring-boot:run
```

**查看信息**

访问`http://localhost:8761/`可以看到服务信息

[源码](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-discovery-eureka)

#### （2）将微服务注册到EurekaServer

**修改服务提供者：用户微服务**
添加依赖`spring-cloud-starter-eureka-server`
添加配置eureka的配置：

```yml
eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true
```

在启动类上添加`@EnableDiscoveryClient`注解表明该服务是一个EurekaClient

[源码](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-provider-user)

**类似的修改服务消费者：电影模块**
[源码](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie)

#### （3）启动测试

分别启动

* microservice-discovery-eureka
* microservice-provider-user
* microservice-consumer-movie

观察控制台输出可以看到服务已被发现

访问`http://localhost:8761/`可以看到服务信息

### 4、EurekaServer高可用

上面例子的单节点的EurekaServer不适合生产环境
因为，EurekaServer挂了之后，整个服务都不可用。
一般情况下会部署一个EurekaServer集群
EurekaServer可以通过运行多个实例并通过互相注册的方式实现高可用部署

**实现**

* 修改microservice-discovery-eureka为[microservice-discovery-eureka-ha](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-discovery-eureka-ha)
* 修改hosts文件`127.0.0.1 peer1 peer2`
* 修改microservice-discovery-eureka-ha配置

```yml
spring:
  application:
    name: microservice-discovery-eureka-ha
---
spring:
  profiles: peer1                                 # 指定profile=peer1
server:
  port: 8761
eureka:
  instance:
    hostname: peer1                               # 指定当profile=peer1时，主机名是peer1
  client:
    serviceUrl:
      defaultZone: http://peer2:8762/eureka/      # 将自己注册到peer2这个Eureka上面去

---
spring:
  profiles: peer2
server:
  port: 8762
eureka:
  instance:
    hostname: peer2
  client:
    serviceUrl:
      defaultZone: http://peer1:8761/eureka/
```

修改服务EurekaClient的注册配置`defaultZone: http://peer1:8761/eureka/,http://peer2:8762/eureka/`

**启动测试**

```bash
java -jar target/microservice-discovery-eureka-ha-0.0.1-SNAPSHOT.jar --spring.profiles.active=peer1
java -jar target/microservice-discovery-eureka-ha-0.0.1-SNAPSHOT.jar --spring.profiles.active=peer2
#启动两个服务
```

访问`http://localhost:8761/`和访问`http://localhost:8762/`可以看到服务信息

### 5、EurekaServer添加用户验证

#### （1）修改EurekaServer

* 修改`microservice-discovery-eureka`为[microservice-discovery-eureka-authenticating](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-discovery-eureka-authenticating)
* 添加spring-boot-starter-security依赖
* 修改配置文件

```yml
security:
  basic:
    enabled: true               # 开启基于HTTP basic的认证
  user:
    name: user                  # 配置登录的账号是user
    password: password123       # 配置登录的密码是password123
server:
  port: 8761                    # 指定该Eureka实例的端口
eureka:
  client:
    registerWithEureka: false
    fetchRegistry: false
    serviceUrl:
      defaultZone: http://localhost:8761/eureka/
```

#### （2）修改微服务让其可以注册到待认证EurekaServer中

修改配置`defaultZone: http://user:password123@localhost:8761/eureka/`

#### （3）启动测试

略

### 6、Eureka元数据

#### （1）相关源码

* [microservice-provider-user-my-metadata](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-provider-user-my-metadata)
* [microservice-consumer-movie-understanding-metadata](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-understanding-metadata)
* [microservice-discovery-eureka](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-discovery-eureka)

**重要代码**

在服务消费者的Controller中通过如下方式获取信息

```java

  @Autowired
  private DiscoveryClient discoveryClient;

  /**
   * 查询microservice-provider-user服务的信息并返回
   * @return microservice-provider-user服务的信息
   */
  @GetMapping("/user-instance")
  public List<ServiceInstance> showInfo() {
    return this.discoveryClient.getInstances("microservice-provider-user");
  }
```

#### （2）介绍

Eureka可以储存分发微服务自定义的数据

* 服务提供者配置了一些常量（键值对）
* 服务消费者就可以获取到这个数据并做出相应的选择

#### （3）测试

* 启动三个程序
* 访问`http://localhost:8761/eureka/apps`或者`http://localhost:8010/user-instance`可以查看自定义的元数据

### 7、Eureka的RESTful端点

Eureka提供了一系列RESTful风格的api接口，用于注册发现服务等。[接口文档](https://github.com/Netflix/eureka/wiki/Eureka-REST-operations)

#### （1）测试一部分端点

启动`microservice-discovery-eureka`
编写用于REST请求的请求体文件[rest-api-test.xml](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/blob/master/eureka-rest-api-test.xml)

内容如下

```xml
<instance>
    <instanceId>itmuch:rest-api-test:9000</instanceId>
    <hostName>itmuch</hostName>
    <app>REST-API-TEST</app>
    <ipAddr>127.0.0.1</ipAddr>
    <vipAddress>rest-api-test</vipAddress>
    <secureVipAddress>rest-api-test</secureVipAddress>
    <status>UP</status>
    <port enabled="true">9000</port>
    <securePort enabled="false">443</securePort>
    <homePageUrl>http://127.0.0.1:9000/</homePageUrl>
    <statusPageUrl>http://127.0.0.1:9000/info</statusPageUrl>
    <healthCheckUrl>http://127.0.0.1:9000/health</healthCheckUrl>
    <dataCenterInfo class="com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo">
        <name>MyOwn</name>
    </dataCenterInfo>
</instance>

```

**注册服务**

发起请求

```bash
cat ./rest-api-test.xml | curl -v -X POST -H "Content-Type: application/xml" -d @- http://localhost:8761/eureka/apps/rest-api-test
```

查看`http://localhost:8761/`将可以看到服务

**注销**

```bash
curl -v -X DELETE http://localhost:8761/eureka/apps/rest-api-test/itmuch:rest-api-test:9000
```

### 8、Eureka的自我保护模式

当某个EurekaServer短时间内丢失大量客户端，将进入保护模式，在此期间

* 不会过期注销任何微服务
* 当网络回恢复后，退出自我保护模式

关闭方法：`eureka.server.enable-self-preservation=false`

### 9、多网卡环境下IP选择

略

[源码](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-provider-user-ip)
[源码分析](http://www.itmuch.com/spring-cloud-code-read/spring-cloud-code-read-eureka-registry-ip/)

### 10、Eureka健康检查

通过Eureka首页查看

配置Eureka查看微服务的健康状态配置：`eureka.client.healthcheck.enable=true`（只能配置在`application.yml`）
更细粒度查看通过实现com.netflix.appinfo.HealthCheckHandler接口

## 五、使用Ribbon实现客户端侧负载均衡

***

### 1、Ribbon简介

[Ribbon Github](https://github.com/Netflix/ribbon)

在SpringCloud中Ribbon与Eureka配合使用，Ribbon可自动的获取服务提供者地址列表，并基于一个负载均衡算法选择一个服务提供者实例

### 2、为服务消费者整合Ribbon

项目源码[microservice-consumer-movie-ribbon](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-ribbon) 从 [microservice-consumer-movie](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie) 修改

#### （1）相关代码

**依赖**

依赖为`spring-cloud-starter-ribbon`，但是`spring-cloud-starter-eureka`隐式引入，不需要显示声明

**代码**

为RestTemplate Bean创建函数添加`@LoadBalanced`注解

```java
  @Bean
  @LoadBalanced
  public RestTemplate restTemplate() {
    return new RestTemplate();
  }
```

修改调用服务提供者的代码

```java
  @Autowired
  private RestTemplate restTemplate;
  @Autowired
  private LoadBalancerClient loadBalancerClient;

  @GetMapping("/user/{id}")
  public User findById(@PathVariable Long id) {
    return this.restTemplate.getForObject("http://microservice-provider-user/" + id, User.class);
  }

  @GetMapping("/log-user-instance")
  public void logUserInstance() {
    ServiceInstance serviceInstance = this.loadBalancerClient.choose("microservice-provider-user");
    // 打印当前选择的是哪个节点
    MovieController.LOGGER.info("{}:{}:{}", serviceInstance.getServiceId(), serviceInstance.getHost(), serviceInstance.getPort());
  }
```

说明

* 使用虚拟主机名`microservice-provider-user`代替`ip:port`
* 默认情况下虚拟主机名和服务名称一致，也可以通过配置更改`eureka.instance.virtual-host-name`或者`eureka.instance.secure-virtual-host-name`
* 虚拟主机名不能包含下划线`_`
* 不能将`restTemplate.getForObject`和`loadBalancerClient.choose`写在同一个方法

#### （2）测试

* 启动`microservice-discovery-eureka`
* 启动多个`microservice-provider-user`（注意使用`--server.port=8001`指定端口）
* 启动`microservice-consumer-movie-ribbon`
* 查看`http://localhost:8761/`
* 多次访问`http://localhost:8010/user/1`，观察命令行输出
* 多次访问`http://localhost:8010/log-user-instance`，观察命令行输出

### 3、使用Java代码自定义Ribbon的配置

#### （1）默认配置

BeanType beanName:ClassName

* IClientConfig ribbonClientConfig:DefaultClientConfigImpl
* IRule ribbonRule:ZoneAvoidanceRule
* IPing ribbonPing:NoOpPing
* ServerList ribbonServerList:ConfigurationBasedServerList
* ServerListFilter ribbonServerListFilter:ZonePerferenceServerListFilter
* ILoadBalancer ribbonLoadBalancer:ZoneAwareLoadBalancer

SpringCloud的内部配置样例

```java
@Bean
@ConditionalOnMissingBean
public IRule ribbonRule(IClientConfig config){
	ZoneAvoidanceRule rule = new ZoneAvoidanceRule();
	rule.initWithNiwsConfig(congfig);
	return rule;
}

//来自/org/springframework/cloud/netflix/ribbon/RibbonClientConfiguration.java
```

#### （2）自定义配置样例

项目源码[microservice-consumer-movie-ribbon-customizing](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-ribbon-customizing) 从 [microservice-consumer-movie-ribbon](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-ribbon)

针对单个服务提供者的配置，其他服务提供者还是默认配置

**主要代码**

创建Ribbon的配置类

```java
package com.itmuch.cloud.config;
/**
 * 该类为Ribbon的配置类
 * 注意：该类不应该在主应用程序上下文的@ComponentScan 中。
 * @author 周立
 */
@Configuration
public class RibbonConfiguration {
  @Bean
  public IRule ribbonRule() {
    // 负载均衡规则，改为随机
    return new RandomRule();
  }
}
```

创建一个空类

```java
package com.itmuch.cloud.study.config;
/**
 * 使用RibbonClient，为特定name的Ribbon Client自定义配置.
 * 使用@RibbonClient的configuration属性，指定Ribbon的配置类.
 * 可参考的示例：
 * http://spring.io/guides/gs/client-side-load-balancing/
 * @author 周立
 */
@Configuration
@RibbonClient(name = "microservice-provider-user", configuration = RibbonConfiguration.class)
public class TestConfiguration {
}
```

说明：

* RibbonConfiguration不应该包含在主启动类的包和子包内的@ComponentScan中，否则类中的配置信息将对所有的服务提供者生效
* 所以才需要指定一个空类`TestConfiguration`（在@ComponentScan内）

**测试**

类似上，略

### 4、使用属性自定义Ribbon的配置

使用`application.yml`配置

配置前缀`<clientName>.ribbon.`

* `NFLoadBalancerClassName`：配置IloadBalancer实现类
* `NFLoadBalancerRuleClassName`：配置IRule实现类
* `NFLoadBalancerPingClassName`：配置IPing实现类
* `NIWSServerListClassName`：配置ServerList实现类
* `NIWSServerListFilterClassName`：配置ServerListFilter实现类

#### （1）使用属性自定义配置样例

项目源码[microservice-consumer-movie-ribbon-customizing-properties](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-ribbon-customizing-properties) 从 [microservice-consumer-movie-ribbon](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-ribbon) 修改

针对单个服务提供者的配置，其他服务提供者还是默认配置

**主要代码**

在`application.yml`添加

```yml
microservice-provider-user:
  ribbon:
    NFLoadBalancerRuleClassName: com.netflix.loadbalancer.RandomRule
```

#### （2）测试

类似上，略

### 5、脱离Eureka使用Ribbon

Ribbon可以脱离Eureka独立使用

#### （1）实验

项目源码[microservice-consumer-movie-without-eureka](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-without-eureka) 从 [microservice-consumer-movie-ribbon](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-ribbon) 修改

**主要代码**

去除Eureka依赖，添加Ribbon依赖

```xml
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-ribbon</artifactId>
    </dependency>
```

去除启动类上的`@EnableDiscoveryClient`注解

修改`application.yml`

```yml
server:
  port: 8010
spring:
  application:
    name: microservice-consumer-movie
microservice-provider-user:
  ribbon:
    listOfServers: localhost:8000,localhost:8001
```

#### （2）测试略

## 六、使用Feign实现声明式REST调用

***

### 1、Feign简介

一个声明式的模板化的**HTTP客户端**，可以更优雅的调用HTTP API。

在SpringCloud中，创建一个接口，添加注解，既可以实现HTTP API调用

支持多种注解

自动使用负载均衡其Ribbon

Feign是一个声明式的web service客户端，它使得编写web service客户端更为容易。创建接口，为接口添加注解，即可使用Feign。Feign可以使用Feign注解或者JAX-RS注解，还支持热插拔的编码器和解码器。Spring Cloud为Feign添加了Spring MVC的注解支持，并整合了Ribbon和Eureka来为使用Feign时提供负载均衡。

[github](https://github.com/OpenFeign/feign)

### 2、为服务者消费者整合Feign

项目源码[microservice-consumer-movie-feign](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-feign) 从 [microservice-consumer-movie](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie) 修改

#### （1）关键代码

**依赖**

```xml
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-feign</artifactId>
    </dependency>
```

**创建接口**

```java
//表明这是一个Feign客户端，用于创建Ribbon负载均衡器，由于使用了Eureka所以Ribbon会把microservice-provider-user解析成服务注册表中的服务
//如果不使用Eureka，则需要指明microservice-provider-user.ribbon.listOfServers=url
//当然，也可以显示的指明使用的url
//@FeignClient(name = "microservice-provider-user", url = "http://localhost:8000/")
@FeignClient(name = "microservice-provider-user")
public interface UserFeignClient {
	//和Controller一致
  @RequestMapping(value = "/{id}", method = RequestMethod.GET)
  public User findById(@PathVariable("id") Long id);
}
```

**修改Controller代码使用UserFeignClient**

```java
@RestController
public class MovieController {
  @Autowired
  private UserFeignClient userFeignClient;

  @GetMapping("/user/{id}")
  public User findById(@PathVariable Long id) {
    return this.userFeignClient.findById(id);
  }
}
```

修改启动类，添加相关支持`@EnableFeignClients`

```java
@EnableDiscoveryClient
@SpringBootApplication
@EnableFeignClients
public class ConsumerMovieApplication {
  public static void main(String[] args) {
    SpringApplication.run(ConsumerMovieApplication.class, args);
  }
}
```

#### （2）测试

* 启动`microservice-discovery-eureka`
* 启动多个`microservice-provider-user`（注意使用`--server.port=8001`指定端口）
* 启动microservice-consumer-movie-feign
* 查看`http://localhost:8761/`
* 多次访问`http://localhost:8010/user/1`，观察命令行输出

可以看出不但实现了声明式的RESTfulAPI调用还实现了客户端侧的负载均衡

### 3、自定义Feign配置

SpringCloud中Feign的默认配置为FeignClientsConfiguration

Spring Cloud Netflix 提供了一下的beans作为feign的默认位置(BeanType beanName: ClassName):

* Decoder feignDecoder: ResponseEntityDecoder (which wraps a SpringDecoder)
* Encoder feignEncoder: SpringEncoder
* Logger feignLogger: Slf4jLogger
* Contract feignContract: SpringMvcContract
* Feign.Builder feignBuilder: HystrixFeign.Builder
* Client feignClient: if Ribbon is enabled it is a LoadBalancerFeignClient, otherwise the default feign client is used.

The OkHttpClient and ApacheHttpClient feign clients can be used by setting feign.okhttp.enabled or feign.httpclient.enabled to true, respectively, and having them on the classpath. You can customize the HTTP client used by providing a bean of either ClosableHttpClient when using Apache or OkHttpClient whe using OK HTTP.

Spring Cloud Netflix does not provide the following beans by default for feign, but still looks up beans of these types from the application context to create the feign client:

* Logger.Level
* Retryer
* ErrorDecoder
* Request.Options
* `Collection<RequestInterceptor>`
* SetterFactory

由此可知Feign默认使用SpringMVC的注解作为契约

#### （1）例子——使用Feign自带注解

项目源码[microservice-consumer-movie-feign-customizing](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-feign-customizing) 从 [microservice-consumer-movie-feign](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-feign) 修改

**关键代码**

创建配置类

```java
package com.itmuch.cloud.config;

/**
 * 该类为Feign的配置类
 * 注意：该不应该在主应用程序上下文的@ComponentScan中。
 * @author 周立
 */
@Configuration
public class FeignConfiguration {
  /**
   * 将契约改为feign原生的默认契约。这样就可以使用feign自带的注解了。
   * @return 默认的feign契约
   */
  @Bean
  public Contract feignContract() {
    return new feign.Contract.Default();
  }
}
```

修改请求接口

```java
package com.itmuch.cloud.study.user.feign;

/**
 * 使用@FeignClient的configuration属性，指定feign的配置类。
 * @author 周立
 */
@FeignClient(name = "microservice-provider-user", configuration = FeignConfiguration.class)
public interface UserFeignClient {
  /**
   * 使用feign自带的注解@RequestLine
   * @see https://github.com/OpenFeign/feign
   * @param id 用户id
   * @return 用户信息
   */
  @RequestLine("GET /{id}")
  public User findById(@Param("id") Long id);
}
```

**测试**

略

**说明**

* 类似于Ribbon废纸
* FeignConfiguration不应该包含在主启动类的包和子包内的@ComponentScan中，否则类中的配置信息将对所有的服务提供者生效

### 4、手动创建Feign

针对某些复杂的应用场景必须手动创建Feign客户端才能满足要求
例如：以下场景

* 用户微服务的接口必须需要登录之后才能调用，并对于相同的API，不同的角色具有不同的行为
* 让电影微服务中的同一个Feign接口，使用不同的账号登录，并调用用户微服务接口

#### （1）修改用户微服务

项目源码[microservice-provider-user-with-auth](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-provider-user-with-auth) 从 [microservice-provider-user](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-provider-user) 修改

**关键代码**

添加SpringSecurity依赖

```xml
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
```

创建SpringSecurity配置
[代码：WebSecurityConfig.java](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/blob/master/microservice-provider-user-with-auth/src/main/java/com/itmuch/cloud/study/security/WebSecurityConfig.java)

* 包含两个用户user和admin其角色分别为user-role和admin-role

修改Controller

```java
  @GetMapping("/{id}")
  public User findById(@PathVariable Long id) {
    Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    if (principal instanceof UserDetails) {
      UserDetails user = (UserDetails) principal;
      Collection<? extends GrantedAuthority> collection = user.getAuthorities();
      for (GrantedAuthority c : collection) {
        // 打印当前登录用户的信息
        UserController.LOGGER.info("当前用户是{}，角色是{}", user.getUsername(), c.getAuthority());
      }
    } else {
      // do other things
    }
    User findOne = this.userRepository.findOne(id);
    return findOne;
  }
```

**测试代码**

* 启动该服务
* 访问`http://localhost:8000/1`将弹出登录框
* 查看后台输出

#### （2）修改电影微服务

项目源码[microservice-consumer-movie-feign-manual](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-feign-manual) 从 [microservice-consumer-movie-feign](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-feign) 修改

**主要代码**

* 去掉UserFeignClient上的注解@FeignClient
* 去掉启动类上的@EnableFeignClients
* 修改Controller如下

```java
@Import(FeignClientsConfiguration.class)
@RestController
public class MovieController {
  private UserFeignClient userUserFeignClient;

  private UserFeignClient adminUserFeignClient;
  @Autowired
  public MovieController(Decoder decoder, Encoder encoder, Client client, Contract contract) {
    // 这边的decoder、encoder、client、contract，可以debug看看是什么实例。
    this.userUserFeignClient = Feign.builder()
        .client(client)
        .encoder(encoder)
        .decoder(decoder)
        .contract(contract)
        .requestInterceptor(new BasicAuthRequestInterceptor("user", "password1"))
        .target(UserFeignClient.class, "http://microservice-provider-user/");
    this.adminUserFeignClient = Feign.builder()
        .client(client)
        .encoder(encoder)
        .decoder(decoder)
        .contract(contract)
        .requestInterceptor(new BasicAuthRequestInterceptor("admin", "password2"))
        .target(UserFeignClient.class, "http://microservice-provider-user/");
  }
  @GetMapping("/user-user/{id}")
  public User findByIdUser(@PathVariable Long id) {
    return this.userUserFeignClient.findById(id);
  }

  @GetMapping("/user-admin/{id}")
  public User findByIdAdmin(@PathVariable Long id) {
    return this.adminUserFeignClient.findById(id);
  }
}
```

#### （3）测试

略

### 5、Feign对继承的支持

#### （1）实例

Feign支持继承，Feign支持从一个接口继承，例子如下：

**基础接口：UserService.java** —— 服务端客户端通用接口

```java
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

public interface UserService{
    @RequestMapping(method=RequestMethod.GET, value="/user/{id}")
    User getUser(@PathVariable long id);
}
```

**服务提供者实现**

```java
@RestController
public class UserResource implements UserService{
	@Override
	public User getUser(long id) {
        // 业务逻辑
	}
}
```

**服务消费者的实现**

```java
@FeignClient
public class UserClient implements UserService{
	//实现
}
```

#### （2）说明

**官方说明**

Feign继承简化了我们的开发，但官方不建议服务端和客户端共享接口，这样造成客户端和服务端的紧耦合。并且本身Feign不使用SpringMVC的工作方式（方法参数不被映射）

**提示**

应客观看待耦合性与方便性，要衡量利弊后取舍——放弃开发方便性或接收代码紧密耦合

### 6、Feign对压缩的支持

```java
feign.compression.request.enabled=true
feign.compression.response.enabled=true

feign.compression.request.enabled=true
feign.compression.request.mime-type=text/xml,application/xml,application/json
feign.compression.request.min-request-size=2048
```

### 7、Feign日志

项目源码[microservice-consumer-movie-feign-logging](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-feign-manual) 从 [microservice-consumer-movie-feign](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-feign) 修改

#### （1）主要代码

**配置类**

设定配置日志等级，这个日志级别表示在全局设定的DEBUG模式下打印的内容多少

```java
package com.itmuch.cloud.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import feign.Logger;

@Configuration
public class FeignLogConfiguration {
  @Bean
  Logger.Level feignLoggerLevel() {
    return Logger.Level.BASIC;
  }
}

```

**修改接口**

指定相关配置类

```java
@FeignClient(name = "microservice-provider-user", configuration = FeignLogConfiguration.class)
public interface UserFeignClient {
  @RequestMapping(value = "/{id}", method = RequestMethod.GET)
  public User findById(@PathVariable("id") Long id);
}
```

**修改配置文件**

```yml
logging:
  level:
    com.itmuch.cloud.study.user.feign.UserFeignClient: DEBUG # 将Feign接口的日志级别设置成DEBUG，因为Feign的Logger.Level只对DEBUG作出响应。
```

### 8、使用Feign构造多参数请求

#### （1）GET 方式 多参数请求

假设URL包含多个参数，比如：
`http://microservice-provider-user/get?id=1&username=张三`

**错误写法**

以下写法，任然以POST方式请求？

```java
@RequestMapping(value = "/get", method = RequestMethod.GET)
public User get0(User user);
```

**正确写法**

方式1

```java
@RequestMapping(value = "/get", method = RequestMethod.GET)
public User get1(@RequestParam Long id, @RequestParam String username);
```

方式2

```java
@RequestMapping(value = "/get", method = RequestMethod.GET)
public User get1(@RequestParam Map<String, Object> map);
```

#### （2）POST 方式 多参数请求

```java
@PostMapping(value = "/post", method = RequestMethod.POST)
public User post(@RequestBody User user);
```
