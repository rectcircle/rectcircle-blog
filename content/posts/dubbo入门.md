---
title: dubbo入门
date: 2018-09-11T16:10:36+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/168
  - /detail/168/
tags:
  - 分布式
---

> 参考：
> [官方文档](http://dubbo.apache.org/zh-cn/docs/user/quick-start.html)
> [github](https://github.com/apache/incubator-dubbo.git)
> [samples](https://github.com/dubbo/dubbo-samples)

## 〇、介绍

***

### 1、后端系统的演进

* 单一应用架构
	* 当网站流量很小时，只需一个应用，将所有功能都部署在一起，以减少部署节点和成本。此时，用于简化增删改查工作量的数据访问框架(ORM)是关键。
* 垂直应用架构
	* 当访问量逐渐增大，单一应用增加机器带来的加速度越来越小，将应用拆成互不相干的几个应用，以提升效率。此时，用于加速前端页面开发的Web框架(MVC)是关键。
* 分布式服务架构
	* 垂直应用越来越多，应用之间交互不可避免，将核心业务抽取出来，作为独立的服务，逐渐形成稳定的服务中心，使前端应用能更快速的响应多变的市场需求。此时，用于提高业务复用及整合的分布式服务框架(RPC)是关键。
* 流动计算架构
	* 当服务越来越多，容量的评估，小服务资源的浪费等问题逐渐显现，此时需增加一个调度中心基于访问压力实时管理集群容量，提高集群利用率。此时，用于提高机器利用率的资源调度和治理中心(SOA)是关键。

### 2、dubbo解决的问题

* 服务发现
	* 使服务调用位置透明，省去URL配置
	* 实现软负载均衡
* 理清服务间依赖关系
* 服务健康检测，动态分配计算资源

### 3、架构和组件

![架构图](http://dubbo.apache.org/docs/zh-cn/user/sources/images/dubbo-architecture.jpg)

角色说明

* Provider	暴露服务的服务提供方
* Consumer	调用远程服务的服务消费方
* Registry	服务注册与发现的注册中心
* Monitor	统计服务的调用次数和调用时间的监控中心
* Container	服务运行容器

调用说明

1. 服务容器负责启动，加载，运行服务提供者。
2. 服务提供者在启动时，向注册中心注册自己提供的服务。
3. 服务消费者在启动时，向注册中心订阅自己所需的服务。
4. 注册中心返回服务提供者地址列表给消费者，如果有变更，注册中心将基于长连接推送变更数据给消费者。
5. 服务消费者，从提供者地址列表中，基于软负载均衡算法，选一台提供者进行调用，如果调用失败，再选另一台调用。
6. 服务消费者和提供者，在内存中累计调用次数和调用时间，定时每分钟发送一次统计数据到监控中心。

### 4、与SpringCloud比较

## 一、HelloWorld

***

### 0、HelloWorld说明

* 使用mvn构建，使用多模块组织
* 实现`sayHello`的远程方法调用

**基本步骤**

* 创建服务接口（api）
* 创建服务提供者（provider），依赖服务接口
	* 配置注册中心
	* 声明提供的实现
	* 编写服务实现
* 创建服务消费者（consumer），依赖服务接口
	* 配置注册中心
	* 获取服务代理对象
	* 调用服务获取结果

### 1、API方式配置

**特别说明：**使用组播方式进行服务发现

项目结构

```
.
├── dubbo-demo-api
│   ├── pom.xml
│   ├── src
│   └── target
├── dubbo-demo-consumer
│   ├── pom.xml
│   ├── src
│   └── target
├── dubbo-demo-provider
│   ├── pom.xml
│   ├── src
│   └── target
└── pom.xml
```

#### （1）配置父project

* 依赖项如下
	* dubbo
	* netty

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">
	<modelVersion>4.0.0</modelVersion>
		
	<groupId>cn.rectcircle</groupId>
	<artifactId>dubbo-learn-api-demo</artifactId>
	<version>1.0.0-SNAPSHOT</version>

	<packaging>pom</packaging>

	<name>${project.artifactId}</name>
	<description>The demo module of dubbo project</description>

	<modules>
		<module>dubbo-demo-api</module>
		<module>dubbo-demo-provider</module>
		<module>dubbo-demo-consumer</module>
	</modules>


	<properties>
		<source.level>1.8</source.level>
		<target.level>1.8</target.level>
		<dubbo.version>2.6.2</dubbo.version>
		<curator.version>2.12.0</curator.version>
	</properties>

	<dependencyManagement>
		<dependencies>
			<dependency>
				<groupId>com.alibaba</groupId>
				<artifactId>dubbo</artifactId>
				<version>${dubbo.version}</version>
			</dependency>
			<dependency>
				<groupId>org.apache.curator</groupId>
				<artifactId>curator-framework</artifactId>
				<version>${curator.version}</version>
			</dependency>
		</dependencies>
	</dependencyManagement>

	<dependencies>
		<dependency>
			<groupId>org.apache.curator</groupId>
			<artifactId>curator-framework</artifactId>
			<exclusions>
				<exclusion>
					<groupId>io.netty</groupId>
					<artifactId>netty</artifactId>
				</exclusion>
			</exclusions>
		</dependency>
		<dependency>
			<groupId>com.alibaba</groupId>
			<artifactId>dubbo</artifactId>
		</dependency>
	</dependencies>
</project>
```

#### （2）api模块

没有依赖，仅声明接口

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <groupId>cn.rectcircle</groupId>
        <artifactId>dubbo-learn-api-demo</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <artifactId>dubbo-demo-api</artifactId>
		
    <build>
        <plugins>
            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>exec-maven-plugin</artifactId>
                <version>1.6.0</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>java</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

源文件

```java

package com.alibaba.dubbo.samples.api;

public interface GreetingsService {
    String sayHello(String name);
}

```

#### （3）服务提供者

依赖api层，隐式依赖`dubbo`、`netty`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <groupId>cn.rectcircle</groupId>
        <artifactId>dubbo-learn-api-demo</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <artifactId>dubbo-demo-provider</artifactId>

    <dependencies>
        <dependency>
            <groupId>cn.rectcircle</groupId>
            <artifactId>dubbo-demo-api</artifactId>
            <version>1.0.0-SNAPSHOT</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>exec-maven-plugin</artifactId>
                <version>1.6.0</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>java</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

源码

```java

package com.alibaba.dubbo.samples.provider;

import com.alibaba.dubbo.samples.api.GreetingsService;

public class GreetingsServiceImpl implements GreetingsService {
    @Override
    public String sayHello(String name) {
        return "Hello " + name;
    }
}

/*=============================================*/

package com.alibaba.dubbo.samples.provider;

import com.alibaba.dubbo.config.ApplicationConfig;
import com.alibaba.dubbo.config.RegistryConfig;
import com.alibaba.dubbo.config.ServiceConfig;
import com.alibaba.dubbo.samples.api.GreetingsService;

import java.io.IOException;

public class Application {
    public static void main(String[] args) throws IOException {
        ServiceConfig<GreetingsService> service = new ServiceConfig<>();
        service.setApplication(new ApplicationConfig("first-dubbo-provider"));
        service.setRegistry(new RegistryConfig("multicast://224.5.6.7:1234"));
        service.setInterface(GreetingsService.class);
        service.setRef(new GreetingsServiceImpl());
        service.export();
        System.out.println("first-dubbo-provider is running.");
        System.in.read();
    }
}
```

#### （4）服务消费者

依赖api层，隐式依赖	`dubbo`、`netty`

```xml
<?xml version="1.0" encoding="UTF-8"?>

<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <groupId>cn.rectcircle</groupId>
        <artifactId>dubbo-learn-api-demo</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>

    <artifactId>dubbo-demo-consumer</artifactId>

    <dependencies>
        <dependency>
            <groupId>cn.rectcircle</groupId>
            <artifactId>dubbo-demo-api</artifactId>
            <version>1.0.0-SNAPSHOT</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>exec-maven-plugin</artifactId>
                <version>1.6.0</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>java</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

源码

```java
package com.alibaba.dubbo.samples.consumer;

import com.alibaba.dubbo.config.ApplicationConfig;
import com.alibaba.dubbo.config.ReferenceConfig;
import com.alibaba.dubbo.config.RegistryConfig;
import com.alibaba.dubbo.samples.api.GreetingsService;

public class Application {
    public static void main(String[] args) {
        ReferenceConfig<GreetingsService> reference = new ReferenceConfig<>();
        reference.setApplication(new ApplicationConfig("first-dubbo-consumer"));
        reference.setRegistry(new RegistryConfig("multicast://224.5.6.7:1234"));
        reference.setInterface(GreetingsService.class);
        GreetingsService greetingsService = reference.get();
        String message = greetingsService.sayHello("dubbo");
        System.out.println(message);
    }
}

```

#### （5）运行

在根目录运行

```bash
mvn install
```

在提供者目录

```bash
mvn -Djava.net.preferIPv4Stack=true -Dexec.mainClass=com.alibaba.dubbo.samples.provider.Application exec:java
```

在消费者目录

```bash
mvn -Djava.net.preferIPv4Stack=true -Dexec.mainClass=com.alibaba.dubbo.samples.consumer.Application exec:java
```

### 2、SpringXML方式

**特别说明：**

* 使用ZooKeeper方式进行服务发现
* 基本目录结构与上相似
* zookeeper服务与服务提供者在同一个应用内，生产环境将应该分别部署

#### （1）接口

略

#### （2）服务提供者

**创建嵌入式的Zookeeper服务类**
略

**创建服务实现**
同上

**创建main类**

```java
package com.alibaba.dubbo.samples.provider;

import java.io.IOException;

import org.springframework.context.support.ClassPathXmlApplicationContext;

public class Application {
    public static void main(String[] args) throws IOException {
        new EmbeddedZooKeeper(2181, false).start();
        ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext(new String[]{"spring/dubbo-demo-provider.xml"});
        context.start();

        System.in.read(); // press any key to exit
    }
}
```

**spring配置文件**
`spring/dubbo-demo-provider.xml`

```xml
<beans xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xmlns="http://www.springframework.org/schema/beans"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd
       http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">

    <!-- 服务提供者应用名, 用于跟踪依赖关系 -->
    <dubbo:application name="demo-provider"/>

    <!-- 使用zookeeper暴露服务 -->
    <dubbo:registry group="aaa" address="zookeeper://127.0.0.1:2181"/>
    <dubbo:registry address="zookeeper://127.0.0.1:2181"/>
    <!--<dubbo:registry address="zookeeper://11.163.250.27:2181"/>-->

    <!-- 使用dubbo协议在20880端口导出服务 -->
    <dubbo:protocol name="dubbo" port="20890"/>

    <!-- 声明服务提供者Bean和普通的bean没有任何区别 -->
    <bean id="greetingsService" class="com.alibaba.dubbo.samples.provider.GreetingsServiceImpl"/>

    <!-- 声明要导出的服务接口并指定其实现的bean -->
    <dubbo:service interface="com.alibaba.dubbo.samples.api.GreetingsService" ref="greetingsService"/>

</beans>
```

#### （3）服务消费者

**创建main类**

```java
package com.alibaba.dubbo.samples.consumer;

import com.alibaba.dubbo.samples.api.GreetingsService;

import org.springframework.context.support.ClassPathXmlApplicationContext;

public class Application {
    public static void main(String[] args) {
        ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext(
                new String[] { "spring/dubbo-demo-consumer.xml" });
        context.start();
        GreetingsService greetingsService = (GreetingsService) context.getBean("demoService"); // get remote service
                                                                                               // proxy
        try {
            while (true) {
                Thread.sleep(1000);
                String hello = greetingsService.sayHello("world"); // call remote method
                System.out.println(hello); // get result
            }
        } catch (Throwable throwable) {
            throwable.printStackTrace();
        } finally {
            context.close();
        }
    }
}
```

**spring配置文件**

```xml
<beans xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:dubbo="http://dubbo.apache.org/schema/dubbo"
       xmlns="http://www.springframework.org/schema/beans"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd
       http://dubbo.apache.org/schema/dubbo http://dubbo.apache.org/schema/dubbo/dubbo.xsd">

    <!-- 使用者的应用程序名称，用于跟踪依赖关系（不是匹配条件），不要和提供者设置的一样 -->
    <dubbo:application name="demo-consumer"/>

    <!-- 使用zookeeper发现服务 -->
    <dubbo:registry group="aaa" address="zookeeper://127.0.0.1:2181"/>

    <!-- 为远程服务生成代理，然后可以像使用本地接口一样使用demoService接口 -->
    <dubbo:reference id="greetingsService" check="false" interface="com.alibaba.dubbo.samples.api.GreetingsService"/>

</beans>
```

#### （5）运行

在根目录运行

```bash
mvn install
```

在提供者目录

```bash
mvn -Djava.net.preferIPv4Stack=true -Dexec.mainClass=com.alibaba.dubbo.samples.provider.Application exec:java
```

在消费者目录

```bash
mvn -Djava.net.preferIPv4Stack=true -Dexec.mainClass=com.alibaba.dubbo.samples.consumer.Application exec:java
```

### 3、Spring注解方式

**特别说明：**

* 使用ZooKeeper方式进行服务发现
* 基本目录结构与上相似
* zookeeper服务与服务提供者在同一个应用内，生产环境将应该分别部署

#### （1）接口

略

#### （2）服务提供者

**创建嵌入式的Zookeeper服务类**

略

**创建服务实现**

添加Service注解

```java
package com.alibaba.dubbo.samples.provider;

import com.alibaba.dubbo.config.annotation.Service;
import com.alibaba.dubbo.samples.api.GreetingsService;

@Service
public class GreetingsServiceImpl implements GreetingsService {
    @Override
    public String sayHello(String name) {
        return "Hello " + name;
    }
}
```

**创建main类**

```java
package com.alibaba.dubbo.samples.provider;

import java.io.IOException;

import com.alibaba.dubbo.config.ApplicationConfig;
import com.alibaba.dubbo.config.ProtocolConfig;
import com.alibaba.dubbo.config.ProviderConfig;
import com.alibaba.dubbo.config.RegistryConfig;
import com.alibaba.dubbo.config.spring.context.annotation.EnableDubbo;

import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

public class Application {
    public static void main(String[] args) throws IOException {
        new EmbeddedZooKeeper(2181, false).start();
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(
                ProviderConfiguration.class);
        // AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(
        //         ProviderConfiguration1.class);
        context.start();
        System.in.read();
        context.close();
    }

    /**
     * 方式1：使用JavaBean进行配置
     */
    @Configuration
    @EnableDubbo(scanBasePackages = "com.alibaba.dubbo.samples.provider")
    static class ProviderConfiguration {
        @Bean
        public ProviderConfig providerConfig() {
            ProviderConfig providerConfig = new ProviderConfig();
            providerConfig.setTimeout(1000);
            return providerConfig;
        }

        @Bean
        public ApplicationConfig applicationConfig() {
            ApplicationConfig applicationConfig = new ApplicationConfig();
            applicationConfig.setName("dubbo-annotation-provider");
            return applicationConfig;
        }

        @Bean
        public RegistryConfig registryConfig() {
            RegistryConfig registryConfig = new RegistryConfig();
            registryConfig.setProtocol("zookeeper");
            registryConfig.setAddress("localhost");
            registryConfig.setPort(2181);
            return registryConfig;
        }

        @Bean
        public ProtocolConfig protocolConfig() {
            ProtocolConfig protocolConfig = new ProtocolConfig();
            protocolConfig.setName("dubbo");
            protocolConfig.setPort(20880);
            return protocolConfig;
        }
    }

    /**
     * 方式2：使用注解+属性文件进行配置
     */
    //@Configuration
    //@EnableDubbo(scanBasePackages = "com.alibaba.dubbo.samples.provider")
    //@PropertySource("classpath:/spring/dubbo-provider.properties")
    //static class ProviderConfiguration1 {
    //}

}
```

**spring属性配置文件**

`spring/dubbo-provider.properties`

```properties
dubbo.application.name=externalized-configuration-provider
dubbo.registry.address=zookeeper://127.0.0.1:2181
dubbo.protocol.name=dubbo
dubbo.protocol.port=20880
```

#### （3）服务消费者

**创建main类**

```java
package com.alibaba.dubbo.samples.consumer;

import java.io.IOException;

import com.alibaba.dubbo.config.ApplicationConfig;
import com.alibaba.dubbo.config.ConsumerConfig;
import com.alibaba.dubbo.config.RegistryConfig;
import com.alibaba.dubbo.config.spring.context.annotation.EnableDubbo;

import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

public class Application {
    public static void main(String[] args) throws IOException {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(
                ConsumerConfiguration.class);
        // AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(
        //         ConsumerConfiguration1.class);
        context.start();
        GreetingServiceConsumer greetingServiceConsumer = context.getBean(GreetingServiceConsumer.class);
        String hello = greetingServiceConsumer.doSayHello("annotation");
        System.out.println("result: " + hello);
        System.in.read();
        context.close();
    }

    /**
     * 使用JavaBean配置
     */
    @Configuration
    @EnableDubbo(scanBasePackages = "com.alibaba.dubbo.samples.consumer")
    @ComponentScan(value = { "com.alibaba.dubbo.samples.consumer" })
    static class ConsumerConfiguration {
        @Bean
        public ApplicationConfig applicationConfig() {
            ApplicationConfig applicationConfig = new ApplicationConfig();
            applicationConfig.setName("dubbo-annotation-consumer");
            return applicationConfig;
        }

        @Bean
        public ConsumerConfig consumerConfig() {
            ConsumerConfig consumerConfig = new ConsumerConfig();
            consumerConfig.setTimeout(3000);
            return consumerConfig;
        }

        @Bean
        public RegistryConfig registryConfig() {
            RegistryConfig registryConfig = new RegistryConfig();
            registryConfig.setProtocol("zookeeper");
            registryConfig.setAddress("localhost");
            registryConfig.setPort(2181);
            return registryConfig;
        }
    }

    /**
     * 使用注解+属性文件配置
     */
    // @Configuration
    // @EnableDubbo(scanBasePackages = "com.alibaba.dubbo.samples.consumer")
    // @PropertySource("classpath:/spring/dubbo-consumer.properties")
    // @ComponentScan(value = { "com.alibaba.dubbo.samples.action" })
    // static class ConsumerConfiguration1 {
    // }
}
```

**测试用的Bean**

```java
package com.alibaba.dubbo.samples.consumer;

import com.alibaba.dubbo.config.annotation.Reference;
import com.alibaba.dubbo.samples.api.GreetingsService;

import org.springframework.stereotype.Component;

@Component("annotatedConsumer")
public class GreetingServiceConsumer {

    @Reference
    private GreetingsService greetingService;

    public String doSayHello(String name) {
        return greetingService.sayHello(name);
    }

}
```

**spring属性配置文件**

`spring/dubbo-consumer.properties`

```properties
dubbo.application.name=externalized-configuration-consumer
dubbo.registry.address=zookeeper://127.0.0.1:2181
dubbo.consumer.timeout=3000
```

#### （5）运行

在根目录运行

```bash
mvn install
```

在提供者目录

```bash
mvn -Djava.net.preferIPv4Stack=true -Dexec.mainClass=com.alibaba.dubbo.samples.provider.Application exec:java
```

在消费者目录

```bash
mvn -Djava.net.preferIPv4Stack=true -Dexec.mainClass=com.alibaba.dubbo.samples.consumer.Application exec:java
```

### 4、SpringBoot配置方式
