---
title: Maven构建web项目使用本地jar包
date: 2017-10-31T15:58:32+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/110
  - /detail/110/
tags:
  - java
---

### 1、需求
* 有时可能会使用本地的jar包
* 或者在idea中，使用idea管理各种框架


### 2、maven构建和idea构建
在idea中构建项目是自己一套独立的构建系统，可以智能的从maven项目中智能生成、并和maven保持一致
#### （1）使用idea构建
新建项目后 在 file -> Project Structure 菜单中配置，配置idea对项目的理解
* project 配置jdk环境编译输出等信息
* modules 配置模块的各种资源，编译输出路径信息、依赖信息
* Libraries 依赖的库，若使用maven也会使用这里，本地库可以手动添加
* Facets ？
* Artifacts 编译输出打包的配置，build、运行、调试功能依赖此内容，重要、在**使用maven时会自动创建不用手动修改，此时构建运行效果和maven一致**

**新建项目后，最好检查此配置，若出现fix按钮一定要点击**

#### （2）maven构建
根据pom.xml文件进行编译

### 3、配置maven使之支持lib下的jar包
```xml
	<build>
		<finalName>
			${project.artifactId}
		</finalName>
		<plugins>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-compiler-plugin</artifactId>
				<configuration>
					<compilerArguments>
						<verbose />
						<bootclasspath>${java.home}/lib/rt.jar</bootclasspath>
						<extdirs>${project.basedir}/lib</extdirs>
					</compilerArguments>
				</configuration>
			</plugin>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-war-plugin</artifactId>
				<configuration>
					<webResources>
						<resource>
							<directory>lib</directory>
							<targetPath>WEB-INF/lib</targetPath>
						</resource>
					</webResources>
				</configuration>
			</plugin>
		</plugins>
	</build>
```
**分析：**
* 第一阶段：编译，配置`maven-compiler-plugin`插件，在编译时添加jar的支持
* 第二阶段：打包，配置`maven-war-plugin`插件，使之在打包阶段将lib下的jar复制到WEB-INF/lib下

### 4、Maven Web项目基本结构
**源代码**
```
src
	main
		java
		resources 
		webapp 
			WEB-INF
	test
		java
		resources
target
pom.xml
```

**编译输出目录**
```
META-INF
WEB-INF
	classes
		src/main/resources的输出
	lib
	web.xml
其他目录或文件，直接可以访问
```


### 5、使用Idea构建Spring MVC的常见的四种方式
#### （1）使用SpringBoot构建器
file -> new -> project -> 选择Spring initializr -> 选择相应的模块 -> finish

#### （2）spring项目 -> Maven框架支持
* file -> new -> project -> 选择Spring -> 选择相应的模块
* 右击项目选择Add Framework Support 选择maven
* 完善目录结构、修正webapp的位置并配置 file -> Project Structure -> Facets 关于web的项目
* 在idea构建方式加入lib
	* 配置  file -> Project Structure -> Artifacts 选择war exploded 依赖库将库加入到 WEB-INF/lib
* 在maven构建中加入lib
	* 在pom.xml加入`3、配置maven使之支持lib下的jar包`中的内容
* 说明：此时Idea构建和Maven构建没有关联性
	* Idea输出在out
	* Maven输出在target
	* **不推荐使用**


#### （3）maven web项目 -> 引入Spring MVC依赖
* file -> new -> project -> maven 选择webapp骨架 -> ... -> finish
* 完善目录结构，配置 file -> Project Structure/modules
* 在pom.xml中加入相应的依赖

#### （4）maven web项目 -> Spring MVC 框架支持
* file -> new -> project -> maven 选择webapp骨架 -> ... -> finish
* 完善目录结构，配置 file -> Project Structure -> modules
* 右击项目选择Add Framework Support 选择springmvc
* 在maven构建中加入lib
	* 在pom.xml加入`3、配置maven使之支持lib下的jar包`中的内容
* ~~在idea构建方式加入lib~~
	* ~~配置  file -> Project Structure -> Artifacts 选择war exploded 依赖库将库加入到 WEB-INF/lib~~
	* Idea的构建将会读取maven的配置，所以**不要更改Artifacts**


### 6、Idea导入Maven项目
如果target目录没有web.xml
* 修改`Project Structure -> facets` 删除web，在创建一个web，重新配置web.xml和webapp


