---
title: Spring Cloud与Docker微服务架构实战（二）
date: 2018-05-26T11:19:34+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/147
  - /detail/147/
tags:
  - Java
  - 分布式
---

> 参考
> 《Spring Cloud与Docker微服务架构实战》
> [在线开源书](https://eacdy.gitbooks.io/spring-cloud-book/content/)
> [源码地址1](https://github.com/itmuch/spring-cloud-docker-microservice-book-code)
> [源码地址2](https://github.com/itmuch/spring-cloud-docker-microservice-book-code-docker)

## 七、使用Hystrix实现微服务容错处理

***

### 1、实现容错的手段

当服务提供者非常缓慢，那么消费者的请求就会强制等待，直到提供者响应或超时。高负载情况下会导致服务消费者资源耗尽而崩溃。

#### （1）雪崩效应

“基础服务故障”导致“级联故障”的现象称为雪崩效应，这和缓存雪崩（缓存在某一时间段大量失效倒是DB压力陡增）不同。

也就是说：根上的服务挂了，整个系统也就挂了

#### （2）如何容错？

* 为网络设置超时（网络连接是非常占资源的事情）
* 使用断路器模式（功能和保险丝类似）：当某个服务提供则出现大量超时，可能说明该服务可能不可用，再发起请求没有意义。所以不需要发起访问。断路器可以理解成对导致错误的代理，统计一段时间内服务失败次数，并确定是否正常请求还是直接返回

断路器状态

* 正常情况下，断路器关闭，可正常请求依赖的服务
* 当失败率达到一定的阈值，断路器打开。快速失败，不去请求服务
* 断路器打开一段时间后，自动进入“半开”状态。此时断路器允许一个请求访问服务。如果成功关闭断路器，失败，断路器保持关闭

### 2、使用Hystrix实现容错

#### （1）特点

* 请求包裹：使用命令模式，包裹调用逻辑，每个命令在独立的线程中执行
* 跳闸机制：当某服务错误率超过一定阈值后，可手动或自动跳闸，停止访问
* 资源隔离：为每个依赖提供一个小型线程池（或信号量），当资源满了后，拒绝请求，不排队，从而加速失败判定
* 监控：监控运行失败成功状态
* 自我修复：“半开”

#### （2）通用方式整合Hystrix

项目源码[microservice-consumer-movie-ribbon-hystrix](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-ribbon-hystrix) 从 [microservice-consumer-movie-ribbon](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-ribbon) 修改

**添加依赖**

```xml
<dependency>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-starter-hystrix</artifactId>
</dependency>
```

**在启动类上添加注解**

```java
@EnableDiscoveryClient
@SpringBootApplication
@EnableCircuitBreaker //启动断路器
public class ConsumerMovieApplication {
  @Bean
  @LoadBalanced
  public RestTemplate restTemplate() {
    return new RestTemplate();
  }

  public static void main(String[] args) {
    SpringApplication.run(ConsumerMovieApplication.class, args);
  }
}
```

**修改Controller**

```java
  //启用Hystrix，并设置一个回退方法，该方法如下
  @HystrixCommand(fallbackMethod = "findByIdFallback")
  @GetMapping("/user/{id}")
  public User findById(@PathVariable Long id) {
    return this.restTemplate.getForObject("http://microservice-provider-user/" + id, User.class);
  }

  //回退方法，当发生超时或者断路器启动，调用此方法，并将返回值作为方法返回值
  public User findByIdFallback(Long id) {
    User user = new User();
    user.setId(-1L);
    user.setName("默认用户");
    return user;
  }
```

**`@HystrixCommand`配置**
https://github.com/Netflix/Hystrix/tree/master/hystrix-contrib/hystrix-javanica#configuration

**Hystrix配置**
https://github.com/Netflix/Hystrix/wiki

**测试**

* 启动服务发现
* 启动服务提供
* 启动该项目
* 访问 `:8010/user/1`
* 停止服务提供
* 再次访问 `:8010/user/1`

**监控信息测试**

略

**Hystrix线程隔离策略与传播上下文**

隔离策略

* THREAD线程隔离：HystrixCommand会在单独线程中执行，并发受到线程池大小的影响
* SEMAPHORE信号量隔离：HystrixCommand会在调用线程执行，开销较小，并发请求受到信号量个数的限制

默认使用THREAD，使用`execution.isolation.strategy`配置
当时用线程方式，可能发生线程上下文无法绑定问题：

* 某些框架可能会依赖于线程上下文比如Hibernate中的session
* SpringMVC中当使用@SessionScope和@RequestSession修饰bean时。因为在实现上，使用了ThreadLocal机制，与线程绑定

也可以通过注解配置

```java
@HystrixCommand(fallbackMethod = "findByIdFallback",
	commandProperties = {
		@HystrixProperty(name="execution.isolation.strategy", value="SEMAPHORE")
	}
)
```

总结

* 隔离默认为THREAD，一般默认即可
* 当发生找不到上下文，可以使用SEMAPHORE

#### （3）Feign整合Hystrix

项目源码[microservice-consumer-movie-feign-hystrix-fallback](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-feign-hystrix-fallback) 从 [microservice-consumer-movie-feign](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-feign) 修改

**添加依赖**

不需要，因为默认情况下，已经整合了Hystrix

**修改请求接口**

```java
/**
 * Feign的fallback测试
 * 使用@FeignClient的fallback属性指定回退类
 * @author 周立
 */
@FeignClient(name = "microservice-provider-user", fallback = FeignClientFallback.class)
public interface UserFeignClient {
  @RequestMapping(value = "/{id}", method = RequestMethod.GET)
  public User findById(@PathVariable("id") Long id);

}

/**
 * 回退类FeignClientFallback需实现Feign Client接口
 * FeignClientFallback也可以是public class，没有区别
 * @author 周立
 */
@Component
class FeignClientFallback implements UserFeignClient {
  @Override
  public User findById(Long id) {
    User user = new User();
    user.setId(-1L);
    user.setUsername("默认用户");
    return user;
  }
}
```

**测试略**

#### （4）检查回退原因

项目源码[microservice-consumer-movie-feign-hystrix-fallback-factory](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-feign-hystrix-fallback-factory) 从 [microservice-consumer-movie-feign](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-feign) 修改

**添加依赖**

不需要，因为默认情况下，已经整合了Hystrix

**修改请求接口**

```java
package com.itmuch.cloud.study.user.feign;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.netflix.feign.FeignClient;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import com.itmuch.cloud.study.user.entity.User;

import feign.hystrix.FallbackFactory;

@FeignClient(name = "microservice-provider-user", fallbackFactory = FeignClientFallbackFactory.class)
public interface UserFeignClient {
  @RequestMapping(value = "/{id}", method = RequestMethod.GET)
  public User findById(@PathVariable("id") Long id);
}

/**
 * UserFeignClient的fallbackFactory类，该类需实现FallbackFactory接口，并覆写create方法
 * The fallback factory must produce instances of fallback classes that
 * implement the interface annotated by {@link FeignClient}.
 * @author 周立
 */
@Component
class FeignClientFallbackFactory implements FallbackFactory<UserFeignClient> {
  private static final Logger LOGGER = LoggerFactory.getLogger(FeignClientFallbackFactory.class);

  @Override
  public UserFeignClient create(Throwable cause) {
    return new UserFeignClient() {
      @Override
      public User findById(Long id) {
        // 日志最好放在各个fallback方法中，而不要直接放在create方法中。
        // 否则在引用启动时，就会打印该日志。
        // 详见https://github.com/spring-cloud/spring-cloud-netflix/issues/1471
        FeignClientFallbackFactory.LOGGER.info("fallback; reason was:", cause);
        User user = new User();
        user.setId(-1L);
        user.setUsername("默认用户");
        return user;
      }
    };
  }
}
```

测试略

#### （3）Feign禁用Hystrix

当Hystrix加入到classpath内，所有的Feign请求将会被Hystrix包裹

通过指定配置类的方式禁用

```java
@Configuration
public class FeignDisableHystrixConfiguration{
	@Bean
	@Scope("prototype")
	public Feign.Builder feignBuilder(){
		return Feign.builder();
	}
}

//使用
@FeignClient(name = "microservice-provider-user", configuration = FeignDisableHystrixConfiguration.class)
```

全局禁用`feign.hystrix.enable = false`

### 3、Hystrix监控

`spring-cloud-starter-hystrix`，默认包含了监控信息模块`hystrix-metrics-event-stream`

测试启动[microservice-consumer-movie-ribbon-hystrix](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-ribbon-hystrix) 、服务提供者和服务发现

访问`:8010/hystrix.stream`可以看到相关数据

**Feign项目的监控**

需要显示的引入`spring-cloud-starter-hystrix`依赖

项目源码[microservice-consumer-movie-feign-hystrix-fallback-stream](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-feign-hystrix-fallback-stream) 从 [microservice-consumer-movie-feign-hystrix-fallback](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-feign-hystrix-fallback) 修改

* 添加`spring-cloud-starter-hystrix`依赖
* 启动器上添加`@EnableCircuitBreaker`
* 启动测试，访问`:8010/hystrix.stream`可以看到相关数据

### 4、使用Hystrix Bashboardke可视化监控

项目[microservice-hystrix-dashboard](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-hystrix-dashboard)

**依赖**

```xml
  <dependencies>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-hystrix-dashboard</artifactId>
    </dependency>
  </dependencies>
```

**启动类**

```java
package com.itmuch.cloud.study;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.hystrix.dashboard.EnableHystrixDashboard;

@SpringBootApplication
@EnableHystrixDashboard
public class HystrixDashboardApplication {
  public static void main(String[] args) {
    SpringApplication.run(HystrixDashboardApplication.class, args);
  }
}
```

**配置启动端口**

```yml
server:
  port: 8030
```

**测试**

* 测试启动以上测试
* 启动该项目

### 5、使用Turbine聚合监控数据

#### （1）使用Turbine

Turbine是一个聚合Hystrix监控数据的工具。他可以将所有相关端点的数据聚合到一个`/turbine.stream`中。

**创建[microservice-hystrix-turbine](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-hystrix-turbine)**

添加依赖

```xml
  <dependencies>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-turbine</artifactId>
    </dependency>
  </dependencies>
```

启动器

```java
@SpringBootApplication
@EnableTurbine
public class TurbineApplication {
  public static void main(String[] args) {
    SpringApplication.run(TurbineApplication.class, args);
  }
}
```

配置

```yml
server:
  port: 8031
spring:
  application:
    name: microservice-hystrix-turbine
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true
turbine:
  appConfig: microservice-consumer-movie,microservice-consumer-movie-feign-hystrix-fallback-stream
  clusterNameExpression: "'default'"
```

**测试**

* 启动服务发现`microservice-discovery-eureka`
* 启动服务提供者`microservice-provider-user`
* 启动服务消费者1`microservice-consumer-movie-ribbon-hystrix`
* 启动服务消费者2`microservice-consumer-movie-feign-hystrix-fallback-stream`
* 启动Turbine项目`microservice-hystrix-turbine`
* 启动Hystrix项目`microservice-hystrix-dashboard`
* 访问`:8010/user/1`
* 访问`:8020/user/1`
* 访问`:8030/hystrix.stream`填入`:8031/turbine.stream`

#### （2）使用消息中间件收集数据

当微服务与Turbine网络不通，可以借助消息中间件实现数据收集，微服务将Hystrix Command的监控数据发送到消息中间件，Turbine收集消息

一下以RabbitMQ为例：

**[安装RabbitMQ](148)**

**改造微服务**

项目源码[microservice-consumer-movie-ribbon-hystrix-turbine-mq](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-ribbon-hystrix-turbine-mq) 从 [microservice-consumer-movie-ribbon-hystrix](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-consumer-movie-ribbon-hystrix) 修改

添加依赖：

```xml
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-netflix-hystrix-stream</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-stream-rabbit</artifactId>
    </dependency>
```

配置文件

```yml
server:
  port: 8010
spring:
  application:
    name: microservice-consumer-movie
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true
```

**改造Turbine**

项目源码[microservice-hystrix-turbine-mq](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-hystrix-turbine-mq) 从 [microservice-hystrix-turbine](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-hystrix-turbine) 修改

修改依赖

```xml
  <dependencies>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-turbine-stream</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-stream-rabbit</artifactId>
    </dependency>
  </dependencies>
```

修改启动器

```java
@SpringBootApplication
@EnableTurbineStream
public class TurbineApplication {
  public static void main(String[] args) {
    SpringApplication.run(TurbineApplication.class, args);
  }
}
```

修改配置文件

```yml
server:
  port: 8031
spring:
  application:
    name: microservice-hystrix-turbine
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true
```

## 八、使用Zuul构建微服务网关

***

### 1、使用微服务网关的原因及Zuul简介

#### （1）使用微服务网关的原因

一个业务可能需要调用多个接口，才能完成。这样存在以下问题：

* 增加客户端复杂性
* 可能存在跨域，增加复杂性
* 认证复杂
* 难以重构
* 某些服务可能使用浏览器防火墙不友好协议，直接访问困难

服务网关作用：

客户端仅与服务网关交互，是一种代理，负责聚合服务组合成业务

服务网关优点：

* 易于监控
* 易于认证
* 减少服务端客户端交互降低延时

#### （2）Zuul简介

Zuul是Netflix开源服务网关服务，核心是一系列过滤器，完成一下功能

* 身份认证和安全
* 审查与监控
* 动态路由
* 压测
* 负载分配
* 静态响应处理
* 多区域弹性

SpringCloud对Zuul进行整合增强。Zuul默认使用Apache Http Client，也可以使用RestClient或okhttp3.OkHttpClient。设置如下

* `ribbon.restclient.enabled=true`
* `ribbon.okhttp.enabled=true`

[github](https://github.com/Netflix/zuul)

### 2、编写Zuul微服务网关

项目源码 [microservice-gateway-zuul](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-gateway-zuul)

#### （1）依赖

```xml
  <dependencies>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-zuul</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-eureka</artifactId>
    </dependency>
  </dependencies>
```

#### （2）启动类

`@EnableZuulProxy`声明一个Zuul代理，该代理使用Ribbon来定位注册在EurekaServer中的微服务；同时代理还整合了Hystrix，从而实现容错，所有经过Zuul的请求都会在Hystrix命令中执行

```java
package com.itmuch.cloud.study;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.zuul.EnableZuulProxy;

@SpringBootApplication
@EnableZuulProxy
public class ZuulApplication {
  public static void main(String[] args) {
    SpringApplication.run(ZuulApplication.class, args);
  }
}

```

#### （3）编写配置文件

```yml
server:
  port: 8040
spring:
  application:
    name: microservice-gateway-zuul
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true
```

#### （4）测试

* 启动
	* 服务发现`microservice-discovery-eureka`
	* 服务提供`microservice-provider-user`（多个）
	* 服务消费`microservice-consumer-movie-ribbon`
	* 服务网关`microservice-gateway-zuul`
* 访问
	* `:8040/microservice-consumer-movie/user/1`
	* `:8040/microservice-provider-user/1`
	* `:8040/hystrix.stream`

#### （5）默认映射规则

`http://ZuulHost:ZuulPort/微服务在Eureka上的ServiceId/**`会映射到对应的服务

#### （6）负载均衡

默认支持Ribbon负载均衡

#### （7）容错与监控

默认整合支持Hystrix

### 3、Zuul路由端点

访问`:8040/routes`可以获得路由映射信息

### 4、路由配置详解

#### （1）自定义微服务访问路径

将`microservice-provider-user`服务映射到`/user/**`

```yml
zuul:
  routes:
    microservice-provider-user: /user/**
```

#### （2）忽略指定微服务

```yml
zuul:
  ignored-services: microservice-provider-user,microservice-consumer-movie
```

#### （3）忽略所有微服务、指定某个微服务

```yml
zuul:
  ignored-services: '*'   # 使用'*'可忽略所有微服务
  routes:
    microservice-provider-user: /user/**
```

#### （4）同时指定微服务的serviceId和路径

```yml
zuul:
  routes:
    user-route:                   # 该配置方式中，user-route只是给路由一个名称，可以任意起名。
      service-id: microservice-provider-user
      path: /user/**              # service-id对应的路径
```

#### （5）同时指定path和url

```yml
zuul:
  routes:
    user-route:                   # 该配置方式中，user-route只是给路由一个名称，可以任意起名。
      url: http://localhost:8000/ # 指定的url
      path: /user/**              # url对应的路径。
```

这种方式配置的请求不会使用Hystrix和Ribbon（不会进行容错和负载均衡）

#### （6）指定path和url，并使用Hystrix和Ribbon

```yml
zuul:
  routes:
    user-route:
      path: /user/**
      service-id: microservice-provider-user
ribbon:
  eureka:
    enabled: false    # 禁用掉ribbon的eureka使用。详见：http://cloud.spring.io/spring-cloud-static/Camden.SR3/#_example_disable_eureka_use_in_ribbon
microservice-provider-user:
  ribbon:
    listOfServers: localhost:8000,localhost:8001
```

#### （7）使用正则表达式指定Zuul的路由匹配规则

创建一个bean

```java
public PatternServiceRouteMapper serviceRouteMapper(){
	//
}
```

#### （8）路由前缀

```yml
zuul:
  prefix: /api
  strip-prefix: false
  routes:
    microservice-provider-user: /user/**
logging:
  level:
    com.netflix: DEBUG

# 访问Zuul的/api/microservice-provider-user/1路径，请求将会被转发到microservice-provider-user的/api/1，，可以查看日志打印，有助于理解。
```

例子2

```yml
zuul:
  routes:
    microservice-provider-user:
      path: /user/**
      strip-prefix: false
logging:
  level:
    com.netflix: DEBUG

# 这样访问Zuul的/user/1路径，请求将会被转发到microservice-provider-user的/user/1，可以查看日志打印，有助于理解。
```

#### （9）忽略某些路径

```yml
zuul:
  ignoredPatterns: /**/admin/**   # 忽略所有包括/admin/的路径
  routes:
    microservice-provider-user: /user/**
```

### 5、Zuul安全与Header

#### （1）敏感Header设置

```yml
zuul:
	sensitive-headers:Cookie,Set-Cookie,Authorization #全局配置
  routes:
    microservice-provider-user:
			sensitive-headers:Cookie,Set-Cookie,Authorization #针对服务配置（优先级高）
```

敏感的Header将加入到忽略Header

#### （2）忽略Header

```yml
zuul:
	ignored-headers:Header1,Header2
```

默认情况下默认值为null，但是当SpringSecurity在classpath中，默认值为：
`zuul.ignored-headers:Pragma,Cache-Control,X-Frame-Options,X-XSS-Protection,Expires`

### 6、使用Zuul上传文件

项目源码 [microservice-gateway-zuul-file-upload](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-gateway-zuul-file-upload)

对于小文件可直接上传

对于大于10M文件需要使用zuul前缀

需要配置Zuul服务的Ribbon和hystrix超时时间

```yml
# 上传大文件得将超时时间设置长一些，否则会报超时异常。以下几行超时设置来自http://cloud.spring.io/spring-cloud-static/Camden.SR3/#_uploading_files_through_zuul
hystrix.command.default.execution.isolation.thread.timeoutInMilliseconds: 60000
ribbon:
  ConnectTimeout: 3000
  ReadTimeout: 60000
```

#### （1）编写文件上传微服务

项目源码 [microservice-file-upload](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/blob/master/microservice-file-upload)

**依赖**

```xml
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-eureka</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
```

**启动器**

```java
package com.itmuch.cloud.study;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;

@SpringBootApplication
@EnableEurekaClient
public class FileUploadApplication {
  public static void main(String[] args) {
    SpringApplication.run(FileUploadApplication.class, args);
  }
}
```

**创建上传文件的Controller**

```java
  /**
   * 上传文件
   * 测试方法：
   * 有界面的测试：http://localhost:8050/index.html
   * 使用命令：curl -F "file=@文件全名" localhost:8050/upload
   * ps.该示例比较简单，没有做IO异常、文件大小、文件非空等处理
   * @param file 待上传的文件
   * @return 文件在服务器上的绝对路径
   * @throws IOException IO异常
   */
  @RequestMapping(value = "/upload", method = RequestMethod.POST)
  public @ResponseBody String handleFileUpload(@RequestParam(value = "file", required = true) MultipartFile file) throws IOException {
    byte[] bytes = file.getBytes();
    File fileToSave = new File(file.getOriginalFilename());
    FileCopyUtils.copy(bytes, fileToSave);
    return fileToSave.getAbsolutePath();
  }
```

**配置**

```xml
server:
  port: 8050
eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true
spring:
  application:
    name: microservice-file-upload
  http:
    multipart:
      max-file-size: 2000Mb      # Max file size，默认1M
      max-request-size: 2500Mb   # Max request size，默认10M
```

**测试**

* 启动
	* 服务发现`microservice-discovery-eureka`
	* 文件上传服务`microservice-file-upload`
	* 服务网关`microservice-gateway-zuul-file-upload`
* 直接上传到服务`curl -F "file=@文件名" localhost:8050/upload`
* 通过服务网关上传到服务`curl -F "file=@文件名" localhost:8040/microservice-file-upload/upload`
* 大文件通过服务网关上传到服务，添加前缀`curl -F "file=@文件名" localhost:8040/zuul/microservice-file-upload/upload`

### 7、过滤器

#### （1）过滤器类型及生命周期

* PRE 请求被路由器前调用，用于实现身份验证、在集群中选择服务、记录调试信息
* ROUTING 路由到微服务
* POST 为响应添加Header、收集统计信息、将相应发送到客户端
* ERROR 错误发生时执行

#### （2）编写自定义过滤器

项目源码[microservice-gateway-zuul-filter](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-gateway-zuul-filter) 从 [microservice-gateway-zuul](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-gateway-zuul) 修改

**编写过滤器**

打印请求内容

```java
public class PreRequestLogFilter extends ZuulFilter {
  private static final Logger LOGGER = LoggerFactory.getLogger(PreRequestLogFilter.class);

  @Override
  public String filterType() {
    return "pre";
  }

  @Override
  public int filterOrder() {
    return 1;
  }

  @Override
  public boolean shouldFilter() {
    return true;
  }

  @Override
  public Object run() {
    RequestContext ctx = RequestContext.getCurrentContext();
    HttpServletRequest request = ctx.getRequest();
    PreRequestLogFilter.LOGGER.info(String.format("send %s request to %s", request.getMethod(), request.getRequestURL().toString()));
    return null;
  }
}
```

创建bean

```java
  @Bean
  public PreRequestLogFilter preRequestLogFilter() {
    return new PreRequestLogFilter();
  }
```

#### （3）禁用过滤器

设置`zuul.<类名>.<过滤器类型>.disable=true`
过滤器位置：
`spring-cloud-starter-zuul`下`org.springframework.cloud.netflix.zuul.filters`包内

### 8、Zuul容错回退与高可用

Zuul默认整合了Hystrix，监控的粒度是微服务而不是某个API。

#### （1）为Zuul实现容错回退

项目源码[microservice-gateway-zuul-fallback](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-gateway-zuul-fallback) 从 [microservice-gateway-zuul](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-gateway-zuul) 修改

编写回退类

```java
@Component
public class UserFallbackProvider implements ZuulFallbackProvider {
  @Override
  public String getRoute() {
    // 表明是为哪个微服务提供回退
    return "microservice-provider-user";
  }

  @Override
  public ClientHttpResponse fallbackResponse() {
    return new ClientHttpResponse() {
      @Override
      public HttpStatus getStatusCode() throws IOException {
        // fallback时的状态码
        return HttpStatus.OK;
      }

      @Override
      public int getRawStatusCode() throws IOException {
        // 数字类型的状态码，本例返回的其实就是200，详见HttpStatus
        return this.getStatusCode().value();
      }

      @Override
      public String getStatusText() throws IOException {
        // 状态文本，本例返回的其实就是OK，详见HttpStatus
        return this.getStatusCode().getReasonPhrase();
      }

      @Override
      public void close() {
      }

      @Override
      public InputStream getBody() throws IOException {
        // 响应体
        return new ByteArrayInputStream("用户微服务不可用，请稍后再试。".getBytes());
      }

      @Override
      public HttpHeaders getHeaders() {
        // headers设定
        HttpHeaders headers = new HttpHeaders();
        MediaType mt = new MediaType("application","json", Charset.forName("UTF-8"));
        headers.setContentType(mt);

        return headers;
      }
    };
  }
}
```

这样微服务不可用将返回`用户微服务不可用，请稍后再试。`

#### （2）Zuul的高可用

要解决的是：Zuul作为服务网关，可用性非常重要。所以更加需要集群，如何实现zuul集群负载均衡和高可用？

**将Zuul客户端注册到Eureka上**

这样Zuul就可以根据Eureka实现负载均衡和高可用

**使用额外的负载均衡器来实现Zuul负载均衡**

使用Nginx类似的负载均衡器将，用户请求转发到响应的Zuul上，实现负载均衡

### 9、使用Sidecar整合非JVM服务

Eureka支持，任何语言实现的RESTful的服务注册发现，下面一个node的例子

#### （1）编写一个node服务

项目源码 [node-service](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/node-service)

```js
var http = require('http');
var url = require('url');
var path = require('path');

// 创建server
var server = http.createServer(function(req, res) {
  // 获得请求的路径
  var pathname = url.parse(req.url).pathname;
  res.writeHead(200, { 'Content-Type' : 'application/json; charset=utf-8' });
  // 访问http://localhost:8060/，将会返回{"index":"欢迎来到首页"}
  if (pathname === '/') {
    res.end(JSON.stringify({ "index" : "欢迎来到首页" }));
  }
  // 访问http://localhost:8060/health，将会返回{"status":"UP"}
  else if (pathname === '/health.json') {
    res.end(JSON.stringify({ "status" : "UP" }));
  }
  // 其他情况返回404
  else {
    res.end("404");
  }
});
// 创建监听，并打印日志
server.listen(8060, function() {
  console.log('listening on localhost:8060');
});
```

**启动测试**

```bash
node node-service.js
```

访问

* `:8060`
* `:8060/health.js`

#### （2）编写Sidecar服务

项目源码 [microservice-sidecar](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-sidecar)

Sidecar的作用：类似于一个桥梁、用于沟通JVM服务和非JVM服务

* 非JVM可以通过Sidecar的Zuul访问JVM的服务
* JVM服务可以通过Sidecar的Eureka客户端，像JVM服务一样访问非JVM服务

**依赖**

```xml
  <dependencies>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-zuul</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-eureka</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-netflix-sidecar</artifactId>
    </dependency>
  </dependencies>
```

**启动类**
@EnableSidecar是一个组合注解

* @EnableCircuitBreaker
* @EnableDiscoveryClient
* @EnableZuulProxy

也就是说Sidecar整合了断路器、Zuul服务网关、服务发现客户端

```java
@SpringBootApplication
@EnableSidecar
public class SidecarApplication {
  public static void main(String[] args) {
    SpringApplication.run(SidecarApplication.class, args);
  }
}
```

**配置**

```yml
server:
  port: 8070
spring:
  application:
    name: microservice-sidecar-node-service
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true
sidecar:
  port: 8060                                      # Node.js微服务的端口
  health-uri: http://localhost:8060/health.json   # Node.js微服务的健康检查URL
```

在此配置了非JVM服务的信息，Sidecar会将这个信息注册到Eureka中，其他的微服务也可以通过`spring.application.name`访问node的服务

**测试**

* 启动
	* 服务发现`microservice-discovery-eureka`
	* node服务
	* microservice-sidecar
* 访问
	* 非jvm的微服务可以通过sidecar访问jvm微服务（当做zuul）
	* jvm的微服务可以通过服务名调用非jvm的微服务

**sidecar端点**

* /ping
* /health
* /hosts/服务名
* /
* /{serviceId}

**Sidecar与非JVM服务分离部署**

方法一

```yml
eureka:
  instance:
    hostname:非JVM微服务的主机名
```

方法二

```yml
sidecar
  hostname: 主机名
  ip-address: ip地址
```

### 10、使用Zuul聚合微服务

按照业务逻辑将多个微服务整合为一个业务接口

使用Rxjava（响应式）实现微服务请求聚合

项目源码[microservice-gateway-zuul-aggregation](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-gateway-zuul-aggregation) 从 [microservice-gateway-zuul](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-gateway-zuul) 修改

#### （1）修改启动器类

```java
@SpringBootApplication
@EnableZuulProxy
public class ZuulApplication {
  public static void main(String[] args) {
    SpringApplication.run(ZuulApplication.class, args);
  }

  @Bean
  @LoadBalanced
  public RestTemplate restTemplate() {
    return new RestTemplate();
  }
}
```

#### （2）创建实体类

```java
public class User {
  private Long id;
  private String username;
  private String name;
  private Integer age;
  private BigDecimal balance;
}
```

#### （3）实现逻辑

```java
@Service
public class AggregationService {
  @Autowired
  private RestTemplate restTemplate;

  @HystrixCommand(fallbackMethod = "fallback")
  public Observable<User> getUserById(Long id) {
    // 创建一个被观察者
    return Observable.create(observer -> {
      // 请求用户微服务的/{id}端点
      User user = restTemplate.getForObject("http://microservice-provider-user/{id}", User.class, id);
      observer.onNext(user);
      observer.onCompleted();
    });
  }

  @HystrixCommand(fallbackMethod = "fallback")
  public Observable<User> getMovieUserByUserId(Long id) {
    return Observable.create(observer -> {
      // 请求电影微服务的/user/{id}端点
      User movieUser = restTemplate.getForObject("http://microservice-consumer-movie/user/{id}", User.class, id);
      observer.onNext(movieUser);
      observer.onCompleted();
    });
  }

  public User fallback(Long id) {
    User user = new User();
    user.setId(-1L);
    return user;
  }
}
```

#### （4）实现Controller

```java
@RestController
public class AggregationController {
  public static final Logger LOGGER = LoggerFactory.getLogger(ZuulApplication.class);

  @Autowired
  private AggregationService aggregationService;

  @GetMapping("/aggregate/{id}")
  public DeferredResult<HashMap<String, User>> aggregate(@PathVariable Long id) {
    Observable<HashMap<String, User>> result = this.aggregateObservable(id);
    return this.toDeferredResult(result);
  }

  public Observable<HashMap<String, User>> aggregateObservable(Long id) {
    // 合并两个或者多个Observables发射出的数据项，根据指定的函数变换它们
    return Observable.zip(
            this.aggregationService.getUserById(id),
            this.aggregationService.getMovieUserByUserId(id),
            (user, movieUser) -> {
              HashMap<String, User> map = Maps.newHashMap();
              map.put("user", user);
              map.put("movieUser", movieUser);
              return map;
            }
    );
  }

  public DeferredResult<HashMap<String, User>> toDeferredResult(Observable<HashMap<String, User>> details) {
    DeferredResult<HashMap<String, User>> result = new DeferredResult<>();
    // 订阅
    details.subscribe(new Observer<HashMap<String, User>>() {
      @Override
      public void onCompleted() {
        LOGGER.info("完成...");
      }

      @Override
      public void onError(Throwable throwable) {
        LOGGER.error("发生错误...", throwable);
      }

      @Override
      public void onNext(HashMap<String, User> movieDetails) {
        result.setResult(movieDetails);
      }
    });
    return result;
  }
}
```

#### （5）运行测试

* 启动
	* 服务发现
	* 用户微服务
	* 电影微服务
	* microservice-gateway-zuul-aggregation
* 访问`:8040/aggressive/1`

## 九、使用SpringCloud Config统一管理微服务配置

***

### 1、SpringCloud Config简介

#### （1）需要统一管理配置微服务配置的原因

在微服务架构中，微服务配置管理一般具有一下需求

* 集中配置管理：微服务众多，集中更加方面
* 不同的环境要有不同配置（开发、测试、预发布、生产环境的配置一般是不同的）
* 运行期动态调整：根据微服务负载情况下动态调整连接池大小或熔断值大小，并且调整配置的过程中不停止为服务
* 修改后自动更新而不需要重启

#### （2）SpringCloud简介

[github](https://github.com/spring-cloud/spring-cloud-config)

* 提供Server端和Client端
* Server端默认使用Git存储配置
* Client用于操作储存在Server中的配置。当微服务启动后，Client将会获取服务端的配置信息

### 2、编写SpringCloud Config服务端和客户端

#### （1）服务端编写

**创建Git仓库**

[参见](https://gitee.com/itmuch/spring-cloud-config-repo)

配置文件如下

```
microservice-foo.properties
microservice-foo-dev.properties
microservice-foo-test.properties
microservice-foo-production.properties
```

**创建项目**

[microservice-config-server](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-config-server)

**依赖**

```xml
  <dependencies>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-config-server</artifactId>
    </dependency>
  </dependencies>
```

**启动器**

```java
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {
  public static void main(String[] args) {
    SpringApplication.run(ConfigServerApplication.class, args);
  }
}
```

**配置文件**

```yml
server:
  port: 8080
spring:
  application:
    name: microservice-config-server
  cloud:
    config:
      server:
        git:
          uri: https://git.oschina.net/itmuch/spring-cloud-config-repo      # 配置Git仓库的地址
          username:                                                         # Git仓库的账号
          password:                                                         # Git仓库的密码
```

**ConfigServer的端点**

* `/{application}/{profile}[/{label}]`
* `/{application}-{profile}.yml`
* `/{label}/{application}-{profile}.yml`
* `/{application}-{profile}.properties`
* `/{label}/{application}-{profile}.properties`

例如本例：可使用以下路径来访问microservice-foo-dev.properties：

* http://localhost:8080/microservice-foo-dev/dev //返回详细信息
* http://localhost:8080/microservice-foo-dev.properties //返回配置文件详情
* http://localhost:8080/config-label-v2.0/microservice-foo-dev.properties //返回分支config-label-v2.0的配置内容
* http://localhost:8080/microservice-foo-dev.yml

#### （2）编写Client端

项目源码 [microservice-config-client](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-config-client)

**依赖**

```xml
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-config</artifactId>
    </dependency>
  </dependencies>
```

**启动类**

```java
@SpringBootApplication
public class ConfigClientApplication {
  public static void main(String[] args) {
    SpringApplication.run(ConfigClientApplication.class, args);
  }
}
```

**配置文件**

`application.yml`

```yml
server:
  port: 8081
```

`bootstrap.yml`

```yml
spring:
  application:
    name: microservice-foo    # 对应config server所获取的配置文件的{application}
  cloud:
    config:
      uri: http://localhost:8080/
      profile: dev            # profile对应config server所获取的配置文件中的{profile}
      label: master           # 指定Git仓库的分支，对应config server所获取的配置文件的{label}
```

`bootstrap.yml`配置的优先级高于本地配置。所以不能被覆盖，可以使用`spring.cloud.bootstrap.enablded=false`

**Controller**

```java
package com.itmuch.cloud.study.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ConfigClientController {
  @Value("${profile}")
  private String profile;

  @GetMapping("/profile")
  public String hello() {
    return this.profile;
  }
}
```

#### （3）测试

* 启动
	* `microservice-config-server`
	* `microservice-config-client`
* 访问
	* `http://localhost:8081/profile`

### 3、SpringCloud Config的Git配置详解

#### （1）占位符支持

```yml
server:
  port: 8080
spring:
  application:
    name: microservice-config-server
  cloud:
    config:
      server:
        git:
          uri: https://git.oschina.net/itmuch/{application}
          username:                                                         # Git仓库的账号
          password:                                                         # Git仓库的密码
logging:
  level:
    org.springframework.cloud: DEBUG
    org.springframework.boot: DEBUG

## 测试：可以使用http://localhost:8080/spring-cloud-config-repo-default.yml 获取到http://localhost:8080/spring-cloud-config-repo下的application.properties
```

#### （2）默认匹配

```yml
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/spring-cloud-samples/config-repo
          repos:
            simple: https://github.com/simple/config-repo
            special:
              pattern: special*/dev*,*special*/dev*
              uri: https://github.com/special/config-repo
            local:
              pattern: local*
              uri: file:/home/configsvc/config-repo
logging:
  level:
    org.springframework.cloud: DEBUG
    org.springframework.boot: DEBUG

# 测试：
# 使用http://localhost:8080/foo-default.yml，可以访问到https://github.com/spring-cloud-samples/config-repo
# 使用http://localhost:8080/special/dev，观察日志及返回结果
```

#### （3）搜索目录

```yml
spring:
  cloud:
    config:
      server:
        git:
          uri: http://git.oschina.net/itmuch/spring-cloud-config-repo
          search-paths: foo,bar*
logging:
  level:
    org.springframework.cloud: DEBUG
    org.springframework.boot: DEBUG

# 测试：访问http://localhost:8080/application/default
```

#### （4）启动时加载配置文件

```yml
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/spring-cloud-samples/config-repo
          repos:
            team-a:
                pattern:  microservice-*
                clone-on-start: true
                uri: http://git.oschina.net/itmuch/spring-cloud-config-repo
logging:
  level:
    org.springframework.cloud: DEBUG
    org.springframework.boot: DEBUG

# 测试：
# 1.观察启动日志
# 2.访问http://localhost:8080/microservice-foo/dev
```

### 4、SpringCloud Config的健康指示器

项目源码 [microservice-config-server-health](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-config-server-health)

```yml
server:
  port: 8080
spring:
  application:
    name: microservice-config-server
  cloud:
    config:
      server:
        git:
          uri: https://git.oschina.net/itmuch/spring-cloud-config-repo/     # 配置Git仓库的地址
          username:                                                         # Git仓库的账号
          password:                                                         # Git仓库的密码
        health:
          repositories:
            a-foo:
              label: config-label-v2.0
              name: microservice-foo
              profiles: dev

```

禁用健康指示器`spring.cloud.config.server.heath.enabled=false`

### 5、配置内容的加密和解密

#### （1）JCE

下载[JCE](http://www.oracle.com/technetwork/java/javase/downloads/jce8-download-2133166.html)
解压到`JDK/jre/lib/security`

#### （2）Config Server的加密端点

* 加密`curl url/encrypt -d 明文`
* 解密`curl url/decrypt -d 密文`

#### （3）对称加密

项目源码 [microservice-config-server-encryption](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/blob/master/microservice-config-server-encryption) 从 [microservice-config-server](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/blob/master/microservice-config-server) 修改

**修改application.yml**

```yml
server:
  port: 8080
spring:
  application:
    name: microservice-config-server
  cloud:
    config:
      server:
        git:
          uri: https://git.oschina.net/itmuch/spring-cloud-config-repo      # 配置Git仓库的地址
          username:                                                         # Git仓库的账号
          password:                                                         # Git仓库的密码
encrypt:
  key: foo  # 设置对称密钥
```

**测试**

* 启动
* `curl http://localhost:8080/encrypt -d 123456`
* `curl http://localhost:8080/decrypt -d e5e48bf0633e8bdcc2a68e032928d4a6952016490536dca395d20cfe1f0d9baf`
* `http://localhost:8080/encryption-default.yml`

**禁止自行解密，直接返回密文本身**

`spring.cloud.config.server.encrypt.enabled=false`

#### （4）非对称加密

项目源码 [microservice-config-server-encryption-rsa](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/blob/master/microservice-config-server-encryption-rsa) 从 [microservice-config-server](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/blob/master/microservice-config-server) 修改

**创建Key Store**

略

**将生成的server.jks**

**修改`application.yml`**

```yml
encrypt:
  keyStore:
    location: classpath:/server.jks # jks文件的路径
    password: letmein               # storepass
    alias: mytestkey                # alias
    secret: changeme                # keypass
```

### 6、配置刷新

#### （1）使用`/refresh`端点手动刷新配置

项目源码 [microservice-config-client-refresh](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-config-client-refresh) 从 [microservice-config-client](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-config-client) 修改

**添加依赖**

```xml
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
```

**添加@RefreshScope注解**

```xml
@RestController
@RefreshScope
public class ConfigClientController {
  @Value("${profile}")
  private String profile;

  @GetMapping("/profile")
  public String hello() {
    return this.profile;
  }
}
```

**测试**

* 启动
	* `microservice-config-server`
	* `microservice-config-client-refresh`
* 访问`http://localhost:8081/profile`
* 修改git配置文件
* 再次访问`http://localhost:8081/profile`

#### （2）实现自动刷新

使用SpringCloudBus（消息总线），让微服务订阅更新事件，当发生配置更新，微服务将接收到消息

**安装消息队列`RibbonMQ`**

项目源码 [microservice-config-client-refresh-cloud-bus](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-config-client-refresh-cloud-bus) 从 [microservice-config-client-refresh](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-config-client-refresh) 修改

**添加依赖**

```xml
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-bus-amqp</artifactId>
    </dependency>
```

**bootstrap.yml**

```java
spring:
  application:
    name: microservice-foo    # 对应config server所获取的配置文件的{application}
  cloud:
    config:
      uri: http://localhost:8080/
      profile: dev            # profile对应config server所获取的配置文件中的{profile}
      label: master           # 指定Git仓库的分支，对应config server所获取的配置文件的{label}
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
```

**测试**

* 启动配置服务器`microservice-config-server`
* 启动客户端`microservice-config-client-refresh-cloud-bus`
* 启动客户端`microservice-config-client-refresh-cloud-bus` 端口设为8082
* 访问`http://localhost:8081/profile`和`http://localhost:8082/profile`
* 发送请求刷新`http://localhost:8081/bus/refresh`
* 再次访问`http://localhost:8081/profile`和`http://localhost:8082/profile`

**借助git仓库的WebHooks**

实现自动刷新

#### （3）局部刷新

使用`bus/refresh`端点的`destination`参数

例如`/bus/refresh?destination=cunstomers:9000` cunstomers:9000指的是微服务的ApplicationContext ID

ApplicationContext ID 等于`spring.application.name:server.port`

#### （4）将ConfigServer也加入消息总线

项目源码 [microservice-config-server-refresh-cloud-bus](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-config-server-refresh-cloud-bus)

#### （5）跟踪总线事件

设置`spring.cloud.bus.trace.enabled=true`

访问微服务的`trace`

### 7、SpringCloud Config与Eureka配合使用

将ConfigServer和ConfigClient都注册到EurekaServer上

项目源码 [microservice-config-client-eureka](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-config-client-eureka)  和 [microservice-config-server-eureka](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-config-server-eureka)

client的bootstrap.yml配置

```yml
spring:
  application:
    name: microservice-foo    # 对应config server所获取的配置文件的{application}
  cloud:
    config:
      profile: dev
      label: master
      discovery:
        enabled: true                                  # 表示使用服务发现组件中的Config Server，而不自己指定Config Server的uri，默认false
        service-id: microservice-config-server-eureka  # 指定Config Server在服务发现中的serviceId，默认是configserver
eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:8761/eureka/

# 参考文档：https://github.com/spring-cloud/spring-cloud-config/blob/master/docs/src/main/asciidoc/spring-cloud-config.adoc#discovery-first-bootstrap
```

**server的application.yml配置**

添加Eureka配置即可

```yml
server:
  port: 8080
spring:
  application:
    name: microservice-config-server-eureka
  cloud:
    config:
      server:
        git:
          uri: https://git.oschina.net/itmuch/spring-cloud-config-repo      # 配置Git仓库的地址
          username:                                                         # Git仓库的账号
          password:                                                         # Git仓库的密码
eureka:
  client:
    serviceUrl:
      defaultZone: http://localhost:8761/eureka/
```

### 8、SpringCloud Config认证

#### （1）服务端改造

项目源码 [microservice-config-server-authenticating](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-config-server-authenticating) 从 [microservice-config-server](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-config-server) 修改

**添加SpringSecurity依赖**

```xml
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
```

**配置认证**

```yml
security:
  basic:
    enabled: true               # 开启基于HTTP basic的认证
  user:
    name: user                  # 配置登录的账号是user
    password: password123       # 配置登录的密码是password123
```

此时配置服务器将要求提供验证信息

#### （2）客户端改造

项目源码 [microservice-config-client-authenticating](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-config-client-authenticating)

**使用url携带用户名**

```yml
spring:
  application:
    name: microservice-foo    # 对应config server所获取的配置文件的{application}
  cloud:
    config:
      uri: http://user:password123@localhost:8080/
      profile: dev            # profile对应config server所获取的配置文件中的{profile}
      label: master           # 指定Git仓库的分支，对应config server所获取的配置文件的{label}
```

**指定用户名密码**

```yml
spring:
  application:
    name: microservice-foo    # 对应config server所获取的配置文件的{application}
  cloud:
    config:
      uri: http://localhost:8080/
      username: user
      password: password123
      profile: dev            # profile对应config server所获取的配置文件中的{profile}
      label: master           # 指定Git仓库的分支，对应config server所获取的配置文件的{label}
```

### 9、ConfigServer高可用

#### （1）git仓库高可用

* 使用第三方高可用git服务如github等
* 使用开源git管理系统，自建git服务，如GitLab

#### （2）RabbitMQ高可用

使用集群

#### （3）ConfigServer自身高可用

建立ConfigServer集群

使用Eureka，将集群注册到其上，即可实现高可用
