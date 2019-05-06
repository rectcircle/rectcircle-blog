---
title: maven
date: 2018-05-08T14:43:06+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/142
  - /detail/142/
tags:
  - java
---

## 目录
* [一、安装配置](#一、安装配置)
	* [1、安装](#1、安装)
	* [2、配置](#2、配置)
* [二、生命周期和命令](#二、生命周期和命令)
	* [1、生命周期简述](#1、生命周期简述)
	* [2、常用命令](#2、常用命令)
* [三、项目配置](#三、项目配置)
	* [1、默认项目结构](#1、默认项目结构)
	* [2、项目配置文件pom.xml](#2、项目配置文件pom.xml)
* [四、依赖管理和多模块工程](#四、依赖管理和多模块工程)
	* [1、依赖管理](#1、依赖管理)
	* [2、多模块项目](#2、多模块项目)




## 一、安装配置
******************
### 1、安装
#### （1）通用安装
去官网下载zip包解压到任意目录，并将bin加入环境变量

#### （2）使用包管理工具
`sdk install maven`

### 2、配置
#### （1）全局配置文件
位置：`MAVEN_HOME/conf/settings.xml`

#### （2）修改远程仓库和本地仓库位置
```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd">
  <pluginGroups></pluginGroups>
  <proxies></proxies>
  <servers></servers>
  <mirrors>
    <mirror>
      <id>alimaven</id>
      <name>aliyun maven</name>
      <url>http://maven.aliyun.com/nexus/content/groups/public/</url>
      <mirrorOf>central</mirrorOf>        
    </mirror>
  </mirrors>
	<profiles>
		<profile>
				<id>jdk-1.8</id>
				<activation>
						<activeByDefault>true</activeByDefault>
						<jdk>1.8</jdk>
				</activation>
				<properties>
						<maven.compiler.source>1.8</maven.compiler.source>
						<maven.compiler.target>1.8</maven.compiler.target>
						<maven.compiler.compilerVersion>1.8</maven.compiler.compilerVersion>
				</properties>
		</profile>
  </profiles>
</settings>
```


## 二、生命周期和命令
**************
### 1、生命周期简述
|阶段 |	处理 |	描述 |
|----|----|--------|
|prepare-resources- |	资源拷贝 | 本阶段可以自定义需要拷贝的资源 |
|compile |	编译 |	本阶段完成源代码编译 |
|package |	打包 |	本阶段根据 pom.xml 中描述的打包配置创建 JAR / WAR 包 |
|1install |	安装 |	本阶段在本地 / 远程仓库中安装工程包 |


### 2、常用命令
* clean （清理后的目录）
* compile （编译）
* package （打包）
* install （安装）
* mvn dependency:list
* mvn dependency:tree

## 四、依赖管理和多模块工程
*****************
### 1、依赖管理
#### （1）依赖传递
* 假如有Maven项目A，项目B依赖A，项目C依赖B。那么我们可以说 C依赖A。也就是说，依赖的关系为：C—>B—>A。
* 那么我们执行项目C时，会自动把B、A都下载导入到C项目的jar包文件夹中。

#### （2）依赖排除
如上，C—>B—>A。加入现在不想执行C时把A下载进来，那么我们可以用`<exclusions>`标签。
```java
<dependencies>
    <dependency>
        <groupId>B</groupId>
        <artifactId>B</artifactId>
        <version>0.0.1</version>

         <exclusions>
            <exclusion>
              <!--被排除的依赖包坐标-->
              <groupId>A</groupId>
              <artifactId>A</artifactId>
              <version>0.0.1</version>
            </exclusion>
         </exclusions>
    </dependency>
</dependencies>
```

#### （3）依赖冲突与解决
依赖冲突：一个项目A，通过不同依赖传递路径依赖于X，若在不同路径下传递过来的X版本不同，那么A应该导入哪个版本的X包呢？

冲突解决方案：
* 如果依赖路径的长度不同，则“短路优先”：
	* A—>B—>C—>D—>E—>X(version 0.0.1)
	* A—>F—>X(version 0.0.2)
	* 则A依赖于X(version 0.0.2)。
* 依赖路径长度相同情况下，则“先声明优先”：
	* A—>E—>X(version 0.0.1)
	* A—>F—>X(version 0.0.2)
	* 则在项目A的`<depencies></depencies>`中，E、F那个在先则A依赖哪条路径的X。


## 三、项目配置
************************
### 1、默认项目结构
```
├── pom.xml                 maven配置文件
├── src                     源代码文件
│   ├── main                主要代码
│   │   ├── java            java源码
│   │   └── resources       资源文件（配置文件）
│   └── test                测试代码
│       └── java            java源码
└── target                  编译相关文件
    ├── classes             存放编译过程中产生的class文件
```

### 2、项目配置文件pom.xml
#### （1）基本实例
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion> <!-- maven模型的版本号，一般填4.0.0 -->

	<groupId>com.example</groupId>
	<artifactId>demo</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<packaging>jar</packaging>

	<name>demo</name>
	<description>Demo project for Spring Boot</description>

	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>2.0.1.RELEASE</version>
		<relativePath/> <!-- lookup parent from repository -->
	</parent>

	<properties>
		<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
		<java.version>1.8</java.version>
	</properties>

	<dependencies>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter</artifactId>
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

#### （2）定位模块的标示
```xml
<groupId>com.example</groupId>
<artifactId>demo</artifactId>
<version>0.0.1-SNAPSHOT</version>
```

#### （3）打包方式
```xml
<packaging>jar</packaging>
```

常用的打包方式：
* `jar` 打包成jar包，不会将相关依赖放入jar文件（使用springboot等插件除外）
* `war` 打成war包，将所有java源代码、声明的依赖及传递依赖、parent传递来的依赖web资源等内容统统放入war文件
* `pom` 仅仅声明依赖信息，给其他模块当父模块


#### （4）模块信息
	<name>demo</name>
	<description>Demo project for Spring Boot</description>


#### （5）相关属性
```xml
	<properties>
		<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
		<java.version>1.8</java.version>
	</properties>
```


#### （6）依赖管理
```xml
	<dependencies>
   <dependency>  
     <groupId>junit</groupId>  
     <artifactId>junit</artifactId>  
     <version>4.0</version>  
     <scope>test</scope>  
   </dependency>  
	</dependencies>
```
* dependency 一个依赖
	* groupId 定位信息之组织id
	* artifactId 定位信息之组件id
	* version 定位信息之版本
	* scope作用域
	* exclusions 排除传递依赖（参见上例）

**scope说明**
* compile，缺省值，适用于所有阶段，会随着项目一起发布。 
* provided，类似compile，期望JDK、容器或使用者会提供这个依赖。如servlet.jar。 
* runtime，只在运行时使用，如JDBC驱动，适用运行和测试阶段。 
* test，只在测试时使用，用于编译和运行测试代码。不会随项目发布。 
* system，类似provided，需要显式提供包含依赖的jar，Maven不会在Repository中查找它。




#### （8）构建信息
```xml
	<build>
		<plugins>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
			</plugin>
		</plugins>
	</build>
```
声明插件等

#### （9）其他略


### 2、多模块项目
#### （1）一个例子
**基本目录结构**
```
.
├── multimodule-manager
│   ├── multimodule-mapper
│   │   ├── pom.xml    （打包：jar）
│   │   ├── src
│   │   └── target
│   ├── multimodule-pojo
│   │   ├── pom.xml    （打包：jar）
│   │   ├── src
│   │   └── target
│   ├── multimodule-service
│   │   ├── pom.xml    （打包：jar）
│   │   ├── src
│   │   └── target
│   ├── multimodule-web
│   │   ├── pom.xml    （打包：war）
│   │   ├── src
│   │   └── target
│   ├── pom.xml        （打包：pom）
├── multimodule-parent （打包：pom）
│   ├── pom.xml
└── multimodule-utils  （打包：jar）
    ├── pom.xml
    ├── src
    └── target
```


**说明**
* multimodule-parent 所有web项目的公共依赖管理文件，定义了比如Spring的依赖等，
* multimodule-utils 全局通用的工具包，其parent=multimodule-parent
* multimodule-manager 具体业务的模块管理模块，其parent=multimodule-parent，并定义如下四个模块
	* multimodule-pojo 业务的POJO，其parent=multimodule-manager
	* multimodule-mapper 业务的DAO，其parent=multimodule-manager，依赖于multimodule-pojo
	* multimodule-service 业务的业务逻辑，其parent=multimodule-manager，依赖于multimodule-mapper
	* multimodule-web 业务的Controller层，其parent=multimodule-manager，依赖于multimodule-service

**父子关系（在子模块使用`<parent>`声明）**
* multimodule-parent
	* multimodule-utils
	* multimodule-manager
		* multimodule-pojo
		* multimodule-mapper
		* multimodule-service
		* multimodule-web

**依赖关系**
* multimodule-manager -> multimodule-utils
* multimodule-web -> multimodule-service -> multimodule-mapper -> multimodule-pojo
* 其他依赖通过parent传递


#### （2）多模块之间继承关系
* 父模块中的`<dependencyManagement>`，子模块父模块都不会引入，只是用于声明版本，在子模块中使用这些公共模块就不需要指明版本号
* 父模块中的`<dependencies>`，会被父模块引入，并被子模块直接继承



