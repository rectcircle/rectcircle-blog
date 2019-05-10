---
title: Spring Cloud与Docker微服务架构实战（三）
date: 2018-06-02T12:53:01+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/149
  - /detail/149/
tags:
  - Java
  - 分布式
---

> 参考
> 《Spring Cloud与Docker微服务架构实战》
> [在线开源书](https://eacdy.gitbooks.io/spring-cloud-book/content/)
> [源码地址1](https://github.com/itmuch/spring-cloud-docker-microservice-book-code)
> [源码地址2](https://github.com/itmuch/spring-cloud-docker-microservice-book-code-docker)

## 十、使用SpringCloud Sleuth实现微服务跟踪

***

### 1、需要微服务跟踪的原因

分布式计算八大误区

* 网络可靠
* 延迟为零
* 带宽无限
* 网络绝对安全
* 网络拓扑不会改变
* 必须有一名管理员
* 传输成本为零
* 网络同质化

### 2、SpringCloud Sleuth简介

大量借鉴Google Dapper、Twitter Zipkin、Apache Htrace

相关术语：

* span（跨度）：基本工作单元。用一个64位id标识。还包含其他数据结构：描述、时间戳事件、键值对注解（标签）、父ID。第一个创建的span叫root span
* trace（追踪）：一组共享root span的span构成的树叫做trace。trace也有一个64位id
* Annotation（标注）：用来记录事件的存在，其中核心用来定义请求的开始与结束
	* CS（Client Sent客户端发送）：客户端发起了一个请求，改Annotation表述了span的开始
	* SR（Server Received服务端收到）：服务端获得请求并处理它。SR-CS=网络延迟
	* SS（Server Sent客户端发送）：
	* CR（Client Received客户端收到）

### 3、整合SpringCloud Sleuth

项目源码 [microservice-simple-provider-user-trace](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/trace/microservice-simple-provider-user-trace) 从 [microservice-simple-provider-user](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/microservice-simple-provider-user) 修改

#### （1）添加依赖

```xml
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-sleuth</artifactId>
    </dependency>
```

#### （2）修改application.yml，添加如下

```yml
spring:
  application:
    name: microservice-provider-user
logging:                                # 配置日志级别，让hibernate打印出执行的SQL
  level:
    root: INFO
    org.springframework.web.servlet.DispatcherServlet: DEBUG
```

#### （3）测试

* 启动 microservice-simple-provider-user-trace
* 访问`http://localhost:8000/1`
* 观察日志输出

### 4、SpringCloud Sleuth与ELK配合使用

ELK是一款日志分析系统

#### （1）安装ELK

https://www.elastic.co/guide/en/elastic-stack/current/installing-elastic-stack.html

* Kibana ELK的可视化工具，从Elasticsearch获取数据
* Elasticsearch ELK的日志聚合工具，从logstash获取数据，给Kibana提供输入
* logstash ELK日志处理工具，从读取程序的日志，进行过滤格式化，然后输出到Elasticsearch等地方

启动

* `service elasticsearch start`
* `service kibana start`

#### （2）项目

项目源码 [microservice-simple-provider-user-trace-elk](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/trace/microservice-simple-provider-user-trace-elk) 从 [microservice-simple-provider-user-trace](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/trace/microservice-simple-provider-user-trace) 修改

**添加依赖**

```xml
    <dependency>
      <groupId>net.logstash.logback</groupId>
      <artifactId>logstash-logback-encoder</artifactId>
      <version>4.6</version>
    </dependency>
```

**添加日志配置**

在资源目录添加[logback-spring.xml](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/blob/master/trace/microservice-simple-provider-user-trace-elk/src/main/resources/logback-spring.xml)

**编写bootstrap.yml**

```yml
spring:
  application:
    name: microservice-provider-user

# 注意：本例中的spring.application.name只能放在bootstrap.*文件中，不能放在application.*文件中，因为我们使用了自定义的logback-spring.xml。
# 如果放在application.*文件中，自定义的logback文件将无法正确读取属性。
# 详见：http://cloud.spring.io/spring-cloud-static/spring-cloud-sleuth/1.1.1.RELEASE/#_adding_to_the_project 上方的NOTE，内容如下：
# If you’re using a custom logback-spring.xml then you have to pass the spring.application.name in bootstrap instead of application property file. Otherwise your custom logback file won’t read the property properly.
```

**编写Logstash配置文件，logstash.conf**

```
input {
    file {
    	codec => json
        path => "/home/rectcircle/Project/Java/spring-cloud/ch10/microservice-simple-provider-user-trace-elk/build/*.json"
    }
}
filter {
    grok {
    	match=>{"message"=>"%{TIMESTAMP_ISO8601:timestamp}\s+%{LOGLEVEL:severity}\s+\[%{DATA:service},%{DATA:trace},%{DATA:span},%{DATA:exportable}\]\s+%{DATA:pid}---\s+\[%{DATA:thread}\]\s+%{DATA:class}\s+:\s+%{GREEDYDATA:rest}"}
    }
}
output {
	stdout{
	    codec=>rubydebug
	}
    elasticsearch {
    	hosts => "localhost:9200"
    }
}
```

**测试**

* 启动elk（使用logstash.conf启动logstash）`bin/logstash -f logstash.conf`
* 启动项目
* 多次访问产生一些日志
* 访问`http://localhost:8000/1`产生日志输出
* 访问`http://localhost:5601`查看Kibana

### 5、SpringCloud Sleuth与Zipkin配合使用

#### （1）编写zipkinserver

项目源码 [microservice-trace-zipkin-server](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/trace/microservice-trace-zipkin-server)

**依赖**

```xml
  <dependencies>
    <dependency>
      <groupId>io.zipkin.java</groupId>
      <artifactId>zipkin-autoconfigure-ui</artifactId>
    </dependency>
    <dependency>
      <groupId>io.zipkin.java</groupId>
      <artifactId>zipkin-server</artifactId>
    </dependency>
  </dependencies>
```

**启动类**

```java
package com.itmuch.cloud.study;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import zipkin.server.EnableZipkinServer;

@SpringBootApplication
@EnableZipkinServer
public class ZipkinServerApplication {
  public static void main(String[] args) {
    SpringApplication.run(ZipkinServerApplication.class, args);
  }
}
```

**配置**

```yml
server:
  port: 9411
```

**测试**

* 启动`microservice-trace-zipkin-server`
* 访问`localhost:9411`

#### （2）微服务整合Zipkin

项目源码 [microservice-simple-provider-user-trace-zipkin](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/trace/microservice-simple-provider-user-trace-zipkin) 从 [microservice-simple-provider-user-trace](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/trace/microservice-simple-provider-user-trace) 修改

**添加依赖**

```xml
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-sleuth-zipkin</artifactId>
    </dependency>
```

**添加配置**

```xml
spring:
  zipkin:
    base-url: http://localhost:9411 #指定zipkin地址
  sleuth:
    sampler:
      percentage: 1.0 #采样比例，默认为0.1
```

**测试**

* 启动
	* `microservice-trace-zipkin-server`
	* `microservice-simple-provider-user-trace-zipkin`
* 访问
	* 多次`http://localhost:8000/1`产生日志输出
	* `http://localhost:9411`

#### （3）使用消息中间件作为后端

项目源码  [microservice-trace-zipkin-server-stream](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/trace/microservice-trace-zipkin-server-stream) 从  [microservice-trace-zipkin-server](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/trace/microservice-trace-zipkin-server) 修改

**修改依赖**

```xml
  <dependencies>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-sleuth-zipkin-stream</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-sleuth</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-stream-binder-rabbit</artifactId>
    </dependency>
    <dependency>
      <groupId>io.zipkin.java</groupId>
      <artifactId>zipkin-autoconfigure-ui</artifactId>
    </dependency>
  </dependencies>
```

**修改启动类**

```java
package com.itmuch.cloud.study;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.sleuth.zipkin.stream.EnableZipkinStreamServer;

@SpringBootApplication
@EnableZipkinStreamServer
public class ZipkinServerApplication {
  public static void main(String[] args) {
    SpringApplication.run(ZipkinServerApplication.class, args);
  }
}

```

**修改配置**

```yml
server:
  port: 9411
spring:
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
```

**改造微服务**

项目源码 [microservice-simple-provider-user-trace-zipkin-stream](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/trace/microservice-simple-provider-user-trace-zipkin-stream) 从 [microservice-simple-provider-user-trace-zipkin](https://github.com/itmuch/spring-cloud-docker-microservice-book-code/tree/master/trace/microservice-simple-provider-user-trace-zipkin) 修改

**添加依赖**

```xml
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-sleuth-stream</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-sleuth</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-stream-binder-rabbit</artifactId>
    </dependency>
```

**修改配置**

```yml
spring:
  sleuth:
    sampler:
      percentage: 1.0
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
```

#### （4）储存追踪数据

略

## 十一、SpringCloud常见问题

***

### 1、Eureka常见问题

#### （1）注册慢

测试环境可以使用`eureka.instance.leaseRenewalIntervalInSeconds`更改心跳周期

生产环境建议使用默认

#### （2）已停止微服务注销慢或者不注销

* Server：关闭自我保护，并按需配置清理无效节点的时间间隔
	* `eureka.server.enable-self-preservation` 默认为true，设为false将会关闭自我保护功能
	* `eureka.server.eviction-interval-timer-in-ms` 默认为`60*1000`
* Client：配置开启健康检查，并按需配置续约更新时间和到期时间
	* `eureka.client.healthcheck.enable` 设为true开启健康检查需要`Actuator支持`
	* `eureka.instance.lease-renewal-interval-in-seconds` 默认30s，续约更新时间
	* `eureka.instance.lease-expiration-duration-in-seconds` 默认90s

#### （3）自定义InstanceID

默认值为：`${spring.cloud.client.hostname}:${spring.application.name}:${server.port}`

使用`eureka.instance.instance-id`配置

接口文档工具：`springFox`

### 2、Hystrix/Feign整合后首次请求失败

原因：Spring基于lazy load机制，首次访问慢。

解决方案：

* 延长Hystrix超时时间（`hystrix.command.default.execution.isolation.thread.timeoutInMilliseconds:5000`）
* 禁用Hystrix超时（`hystrix.command.default.execution.timeout.enabled:false`）
* 对于Feign禁用Hystrix（`feign.hystrix.enabled: false`）

### 3、Turbine聚合的数据不完整

设置：`turbine.combine-host-port=true`

### 4、SpringCloud各个组件的配置

参见[springc cloud官方文档](http://cloud.spring.io/spring-cloud-static/Edgware.SR3/multi/multi__appendix_compendium_of_configuration_properties.html)

### 5、SpringCloud定位问题思路总结

#### （1）排查配置问题

* 检查yaml缩进问题
* 配置属性是否正确
* 属性位置是否正确

#### （2）排查环境问题

* 环境变量
* 依赖下载是否完整 `mvn clean package`
* 网络问题

#### （3）排查代码

* 注解问题
* 通过SpringActuator查看bean

#### （4）排查SpringCloud自身问题

查看源码或github Issue

### 6、SpringCloud各个组件总结

#### （1）[微服务注册与发现：Eureka](143#四、微服务注册与发现)

**功能**

提供服务名到实际地址的映射，与环境解耦

**依赖**

```xml
<!-- 服务端依赖 -->
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-eureka-server</artifactId>
    </dependency>

<!-- 客户端依赖 -->
		<dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-eureka</artifactId>
    </dependency>
```

#### （2）[客户端侧负载均衡：Ribbon](143#五、使用Ribbon实现客户端侧负载均衡)

**功能**

负载均衡

**依赖**

```xml
		<dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-ribbon</artifactId>
    </dependency>
```

#### （3）[声明式Rest客户端：Feign](143#六、使用Feign实现声明式REST调用)

**功能**

方面远程服务调用

**依赖**

```xml
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-feign</artifactId>
    </dependency>
```

#### （4）[容错处理：Hystrix](147#七、使用Hystrix实现微服务容错处理)

**功能**

服务超时、快速失败

**依赖**

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-hystrix</artifactId>
</dependency>
```

#### （5）[服务网关：Zuul](147#八、使用Zuul构建微服务网关)

**功能**

代理对微服务的请求

**依赖**

```xml
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-zuul</artifactId>
    </dependency>
```

#### （6）[统一配置管理：Spring Cloud Config](147#九、使用SpringCloud%20Config统一管理微服务配置)

**功能**

统一管理微服务配置

**依赖**

```xml
<!-- 服务端依赖 -->
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-config-server</artifactId>
    </dependency>

<!-- 客户端依赖 -->
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-config</artifactId>
    </dependency>

```

#### （7）[微服务跟踪：SpringCloud Sleuth](149#十、使用SpringCloud%20Sleuth实现微服务跟踪)

**功能**

在日志上添加微服务请求处理响应等时间信息

**依赖**

```xml
    <dependency>
      <groupId>org.springframework.cloud</groupId>
      <artifactId>spring-cloud-starter-sleuth</artifactId>
    </dependency>
```

## 十二、Docker简介

***

[略](151)

## 十三、将微服务运行在Docker上

***

### 1、使用Dockerfile构建Docker镜像

创建目录`microservice-discovery-eureka-docker`

**编写Dockerfile文件**

```
# 基本镜像
FROM java:8

VOLUME /tmp

# 等价于ADD microservice-discovery-eureka-0.0.1-SNAPSHOT.jar /app.jar
ADD microservice-discovery-eureka-0.0.1-SNAPSHOT.jar app.jar
RUN bash -c 'touch /app.jar'

EXPOSE 8761

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app.jar"]
#ENTRYPOINT exec java $JAVA_OPTS -jar ch13.jar
# For Spring-Boot project, use the entrypoint below to reduce Tomcat startup time.
#ENTRYPOINT exec java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -jar ch13.jar
```

**构建镜像**

```bash
docker build -t rectcircle/microservice-discovery-eureka:0.0.1 .
```

**测试**

```bash
docker run -p 8761:8761 rectcircle/microservice-discovery-eureka:0.0.1
```

### 2、使用DockerRegistry管理Docker镜像

#### （1）发布到公有仓库

[略](151#3、简单使用)

```bash
docker push rectcircle/microservice-discovery-eureka:0.0.1
```

#### （2）使用私有仓库管理镜像

启动

```bash
docker run -d -p 5000:5000 --restart=always --name registry2 registry:2
```

推送

```bash
#修改镜像标签
docker tag rectcircle/microservice-discovery-eureka:0.0.1 localhost:5000/rectcircle/microservice-discovery-eureka:0.0.1
#推送
docker push localhost:5000/rectcircle/microservice-discovery-eureka:0.0.1
```

### 3、使用maven插件构建Docker镜像

[项目源码:microservice-discovery-eureka](https://github.com/itmuch/spring-cloud-docker-microservice-book-code-docker/tree/master/docker-1-simple/microservice-discovery-eureka)

#### （1）快速入门

`pom.xml`启用插件

```xml
      <plugin>
        <groupId>com.spotify</groupId>
        <artifactId>docker-maven-plugin</artifactId>
        <version>0.4.13</version>
        <configuration>
          <imageName>itmuch/${project.artifactId}:${project.version}</imageName>
          <baseImage>java</baseImage>
          <entryPoint>["java", "-jar", "/${project.build.finalName}.jar"]</entryPoint>
          <resources>
            <resource>
              <targetPath>/</targetPath>
              <directory>${project.build.directory}</directory>
              <include>${project.build.finalName}.jar</include>
            </resource>
          </resources>
        </configuration>
      </plugin>
```

构建镜像

```bash
mvn clean package docker:build
```

查看测试：略

#### （2）读取Dockerfile构建

在`scr/main/docker`创建Dockerfile

pom.xml配置如下

```xml
      <plugin>
        <groupId>com.spotify</groupId>
        <artifactId>docker-maven-plugin</artifactId>
        <version>0.4.13</version>
        <configuration>
          <imageName>itmuch/microservice-discovery-eureka:0.0.2</imageName>
          <dockerDirectory>${project.basedir}/src/main/docker</dockerDirectory>
          <resources>
            <resource>
              <targetPath>/</targetPath>
              <directory>${project.build.directory}</directory>
              <include>${project.build.finalName}.jar</include>
            </resource>
          </resources>
        </configuration>
      </plugin>
```

#### （3）将插件绑定到某mvn生命周期

```xml
      <plugin>
        <groupId>com.spotify</groupId>
        <artifactId>docker-maven-plugin</artifactId>
        <version>0.4.13</version>
        <executions>
          <execution>
            <id>build-image</id>
            <phase>package</phase>
            <goals>
              <goal>build</goal>
            </goals>
          </execution>
        </executions>
        <configuration>
          <imageName>itmuch/microservice-discovery-eureka:0.0.3</imageName>
          <baseImage>java</baseImage>
          <entryPoint>["java", "-jar", "/${project.build.finalName}.jar"]</entryPoint>
          <resources>
            <resource>
              <targetPath>/</targetPath>
              <directory>${project.build.directory}</directory>
              <include>${project.build.finalName}.jar</include>
            </resource>
          </resources>
        </configuration>
      </plugin>
```

#### （4）将镜像推送到公开仓库

```xml
      <plugin>
        <groupId>com.spotify</groupId>
        <artifactId>docker-maven-plugin</artifactId>
        <version>0.4.13</version>
        <configuration>
          <imageName>itmuch/microservice-discovery-eureka:0.0.4</imageName>
          <baseImage>java</baseImage>
          <entryPoint>["java", "-jar", "/${project.build.finalName}.jar"]</entryPoint>
          <resources>
            <resource>
              <targetPath>/</targetPath>
              <directory>${project.build.directory}</directory>
              <include>${project.build.finalName}.jar</include>
            </resource>
          </resources>

          <!-- 与maven配置文件settings.xml中配置的server.id一致，用于推送镜像 -->
          <serverId>docker-hub</serverId>
        </configuration>
      </plugin>
```

**全局maven setting中添加如下信息**

```xml
<server>
	<id>docker-hub</id>
	<username></username>
	<password></password>
	<configuration>
		<email></email>
	</configuration>
</server>
```

命令

```bash
mvn clean package docker:build -DpushImage
```

**imageTags指定标签**

**forceTags允许覆盖**

```xml
        <configuration>
          <imageName>itmuch/microservice-discovery-eureka</imageName>
          <!-- 使用imageTags指定标签名称 -->
          <imageTags>
            <imageTag>0.0.5</imageTag>
            <imageTag>latest</imageTag>
          </imageTags>
					<forceTags>true</forceTags>
        </configuration>
```

## 十四、使用Docker Compose编排微服务

***

### 1、Docker Compose相关内容

#### （1）简介下载安装

[略](151#五、Docker%20Compose)

#### （2）基本使用

**测试目录结构**

```
.
├── docker-compose.yml
├── Dockerfile
└── microservice-discovery-eureka-0.0.1-SNAPSHOT.jar
```

**`Dockerfile`内容如下**

```
# 基本镜像
FROM java:8

VOLUME /tmp

# 等价于ADD microservice-discovery-eureka-0.0.1-SNAPSHOT.jar /app.jar
ADD microservice-discovery-eureka-0.0.1-SNAPSHOT.jar app.jar
RUN bash -c 'touch /app.jar'

EXPOSE 8761

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app.jar"]
```

**`docker-compose.yml`内容如下**

```yml
version: '3'

services: #定义服务
  eureka: #服务名
    build: . #当前服务的镜像来自当前目录的Dockerfile
    ports:
      - "8761:8761" #指定端口映射
```

**运行**

```bash
sudo docker-compose up
```

#### （2）其他

[略](151#4、docker-compose.yml)

### 2、Docker Compose与微服务结合实战

[源码](https://github.com/itmuch/spring-cloud-docker-microservice-book-code-docker/tree/master/docker-1-simple)

#### （1）微服务列表如下

* microservice-consumer-movie-ribbon-hystrix
* microservice-discovery-eureka
* microservice-gateway-zuul
* microservice-hystrix-dashboard
* microservice-hystrix-turbine
* microservice-provider-user

#### （2）使用maven插件编配微服务

在所有的微服务项目中添加如下内容

```xml
      <!-- 添加docker-maven插件 -->
      <plugin>
        <groupId>com.spotify</groupId>
        <artifactId>docker-maven-plugin</artifactId>
        <version>0.4.13</version>
        <configuration>
          <imageName>itmuch/${project.artifactId}:${project.version}</imageName>
          <baseImage>java</baseImage>
          <entryPoint>["java", "-jar", "/${project.build.finalName}.jar"]</entryPoint>
          <resources>
            <resource>
              <targetPath>/</targetPath>
              <directory>${project.build.directory}</directory>
              <include>${project.build.finalName}.jar</include>
            </resource>
          </resources>
        </configuration>
      </plugin>
```

#### （3）修改微服务发现地址为将要配置的docker网络名

```yaml
eureka:
  client:
    service-url:
      defaultZone: http://discovery:8761/eureka/
```

#### （4）创建顶级pom.xml用于一键编译

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.itmuch.cloud</groupId>
  <artifactId>parent</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  <packaging>pom</packaging>

  <modules>
    <module>microservice-consumer-movie-ribbon-hystrix</module>
	<module>microservice-discovery-eureka</module>
	<module>microservice-gateway-zuul</module>
	<module>microservice-hystrix-dashboard</module>
	<module>microservice-hystrix-turbine</module>
	<module>microservice-provider-user</module>
  </modules>

  <build>
    <plugins>
      <!-- 添加docker-maven插件 -->
      <plugin>
        <groupId>com.spotify</groupId>
        <artifactId>docker-maven-plugin</artifactId>
        <version>0.4.13</version>
        <configuration>
          <imageName>itmuch/${project.artifactId}:${project.version}</imageName>
          <baseImage>java</baseImage>
          <entryPoint>["java", "-jar", "/${project.build.finalName}.jar"]</entryPoint>
          <resources>
            <resource>
              <targetPath>/</targetPath>
              <directory>${project.build.directory}</directory>
              <include>${project.build.finalName}.jar</include>
            </resource>
          </resources>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
```

#### （5）编写docker-compose.yml

```yaml
version: '2'        # 表示该docker-compose.yml文件使用的是Version 2 file format
services:           # Version 2 file format的固定写法，为project定义服务。
  microservice-discovery-eureka:                                  # 指定服务名称
    image: itmuch/microservice-discovery-eureka:0.0.1-SNAPSHOT    # 指定服务所使用的镜像
    ports:                                                        # 暴露端口信息
      - "8761:8761"
  microservice-provider-user:
    image: itmuch/microservice-provider-user:0.0.1-SNAPSHOT
    links:          # 链接到microservice-discovery-eureka，这边使用的是SERVICE:ALIAS的形式
      - microservice-discovery-eureka:discovery
  microservice-consumer-movie-ribbon-hystrix:
    image: itmuch/microservice-consumer-movie-ribbon-hystrix:0.0.1-SNAPSHOT
    links:
      - microservice-discovery-eureka:discovery
  microservice-gateway-zuul:
    image: itmuch/microservice-gateway-zuul:0.0.1-SNAPSHOT
    links:
      - microservice-discovery-eureka:discovery
  microservice-hystrix-dashboard:
    image: itmuch/microservice-hystrix-dashboard:0.0.1-SNAPSHOT
    links:
      - microservice-discovery-eureka:discovery
  microservice-hystrix-turbine:
    image: itmuch/microservice-hystrix-turbine:0.0.1-SNAPSHOT
    links:
      - microservice-discovery-eureka:discovery
```

#### （6）最终目录结构

```
.
├── docker-compose-easy.yml
├── docker-compose.yml
├── microservice-consumer-movie-ribbon-hystrix
├── microservice-discovery-eureka
├── microservice-gateway-zuul
├── microservice-hystrix-dashboard
├── microservice-hystrix-turbine
├── microservice-provider-user
└── pom.xml
```

#### （7）编译运行

```bash
#编译
mvn clean package docker:build
#运行
docker-compose up
```

#### （8）简化写法

由于同一个Compose工程共享一个隔离的网络，可以使用服务名作为主机名来发现其他服务

```yaml

version: '2'
services:
  discovery:
    image: itmuch/microservice-discovery-eureka:0.0.1-SNAPSHOT
    ports:
      - "8761:8761"
  microservice-provider-user:
    image: itmuch/microservice-provider-user:0.0.1-SNAPSHOT
  microservice-consumer-movie-ribbon-hystrix:
    image: itmuch/microservice-consumer-movie-ribbon-hystrix:0.0.1-SNAPSHOT
  microservice-gateway-zuul:
    image: itmuch/microservice-gateway-zuul:0.0.1-SNAPSHOT
  microservice-hystrix-dashboard:
    image: itmuch/microservice-hystrix-dashboard:0.0.1-SNAPSHOT
  microservice-hystrix-turbine:
    image: itmuch/microservice-hystrix-turbine:0.0.1-SNAPSHOT

# 最简单的配置方式，等价于docker-compose.yml。
```

#### （9）编排高可用Eureka Server

[源码](https://github.com/itmuch/spring-cloud-docker-microservice-book-code-docker/tree/master/docker-2-eureka-ha)

docker-compose.yml

```yaml
version: "2"
services:
  peer1:      # 默认情况下，其他服务可使用服务名称连接到该服务。对于peer2节点，它需连接http://peer1:8761/eureka/，因此，我们可配置该服务的名称为peer1。
    image: itmuch/microservice-discovery-eureka-ha:0.0.1-SNAPSHOT
    ports:
      - "8761:8761"
    environment:
      - spring.profiles.active=peer1
  peer2:
    image: itmuch/microservice-discovery-eureka-ha:0.0.1-SNAPSHOT
    hostname: peer2
    ports:
      - "8762:8762"
    environment:
      - spring.profiles.active=peer2

## 使用Compose编排高可用的Eureka Server。
```

#### （10）编排高可用集群

[源码](https://github.com/itmuch/spring-cloud-docker-microservice-book-code-docker/tree/master/docker-3-complex)

* microservice-consumer-movie-ribbon-hystrix
* microservice-discovery-eureka-ha
* microservice-gateway-zuul
* microservice-hystrix-turbine
* microservice-provider-user

**修改微服务的服务发现配置**

```yaml
eureka:
  client:
    service-url:
      defaultZone: http://peer1:8761/eureka/,http://peer2:8762/eureka/
  instance:
    prefer-ip-address: true
```

**docker-compose.yml配置**

```yaml
version: "2"
services:
  peer1:
    image: itmuch/microservice-discovery-eureka-ha:0.0.1-SNAPSHOT
    ports:
      - "8761:8761"
    environment:
      - spring.profiles.active=peer1
  peer2:
    image: itmuch/microservice-discovery-eureka-ha:0.0.1-SNAPSHOT
    hostname: peer2
    ports:
      - "8762:8762"
    environment:
      - spring.profiles.active=peer2
  microservice-provider-user:
    image: itmuch/microservice-provider-user:0.0.1-SNAPSHOT
  microservice-consumer-movie-ribbon-hystrix:
    image: itmuch/microservice-consumer-movie-ribbon-hystrix:0.0.1-SNAPSHOT
  microservice-gateway-zuul:
    image: itmuch/microservice-gateway-zuul:0.0.1-SNAPSHOT
  microservice-hystrix-turbine:
    image: itmuch/microservice-hystrix-turbine:0.0.1-SNAPSHOT

```
