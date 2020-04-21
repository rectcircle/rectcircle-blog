---
title: "后端-Java-Spring-企业内部系统项目规范"
date: 2020-04-04T14:00:00+08:00
draft: false
toc: true
comments: true
weight: 200
summary: 本项目规范适用于 使用 Java 和 Spring 开发的 后端 项目。为了简化描述和屏蔽技术栈的复杂性，本文以 企业内部系统 为蓝本，因此，本文的示例可直接在 企业内部系统 场景下多地。但对于 ToC 和 微服务相关的项目，需要进行相关的变换才可落地。
---

> 更新时间： 2020-04-04
>
> 本文可能疏于更新：最新情况请参考 [Github Repo](https://github.com/rectcircle/rectcircle-project-template)

前置文章：[通用规范](/series/项目规范/通用规范/)

## 版本选择与依赖管理

### 主编程语言Java

> [维基百科: Java Version History](https://en.wikipedia.org/wiki/Java_version_history)

选择 目前 Java 最新的 TLS 版本 Java11 （发布于 2018 年 9 月，下一个 Java TLS 版本为 Java17，预计于 2021 年 9 月发布）

相关 SDK 安装( [SDKMAN 方式](https://sdkman.io/install) )

```bash
curl -s "https://get.sdkman.io" | bash
# 重新打开终端
# 如果你的系统安装了Java，最好该Java交由SDK管理
sdk install java 8.0.191-local $JAVA_HOME
sdk install java 11.0.6.hs-adpt
# 仅当前shell生效
sdk use java 11.0.6.hs-adpt
sdk default java 11.0.6.hs-adpt
# 恢复 java8
# sdk default java 8.0.191-local
java -version
```

### Spring Boot

采用 最新的 `2.2.6.RELEASE` 版本

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot</artifactId>
    <version>2.2.6.RELEASE</version>
</dependency>
```

### 依赖管理

* 使用分模块的Maven项目
* 被大于一个模块使用过的依赖在根 `pom.xml` 中的 `dependencyManagement` 进行版本管理

### Maven Wrapper

为方便构建镜像，应使用 `./mvnw` 命令替代 `mvn` 命令，创建方式

```bash
mvn -N io.takari:maven:wrapper
```

将创建如文件和目录

* `.mvn/`
* `mvnw`
* `mvnw.cmd`

## 模块设计

依赖关系

```
template-dto        template-scala
    ^                ^
    |                |
    ------------------
            |
        template-core
            ^
            |
    ------------------
    |                |
template-web        template-batch
```

* template-web 负责提供web服务，主要包含如下模块
    * `controller`
    * `config`
    * `filter`
    * `security`
    * `utils`
* template-batch 负责执行某些定时/异步任务
* template-core 核心业务逻辑，主要包含如下模块（细节参见 [阿里Java开发手册](https://developer.aliyun.com/special/tech-java)）
    * DO
    * BO
    * DAO
    * Service
* template-dto 数据传输对象，service层的参数与返回值，单独抽出来的原因是该部分可能被复用，比如
    * OpenAPI 的 Client
    * RPC 的 Client
* template-scala 可选，当与其他 JVM 语言交互式，建议独立出一个模块

## 编码规范

以如下两个规范作为蓝本，根据情况进行定制化的选择

* [阿里Java开发手册](https://developer.aliyun.com/special/tech-java)
* [Google Java Style 指南](https://www.jianshu.com/p/c0e5a4a896be)

将结果配置到配置文件中，并在如下两个地方应用配置

* 配置 Maven Plugin 进行检查，调用 `mvn verify` 进行检查，该部分参见脚本管理
    * 应用在 `.git/hooks/pre_commit` 在提交之前进行严格的规范检查
    * 应用在 准入工作流
* 配置集成开发环境插件，进行实时检查

规范检查

```bash
./cli/verify.sh
```

配置方式参见：[Java 代码样式检查落地](/posts/java-code-style-check/)

## 文档设计

* `README.md`
* `docs/01.环境搭建`
* `docs/02.规范约定`
* `docs/03.技术方案`
* `docs/04.模块设计`

## 脚本管理

* `./cli/verify.sh` CI 的 代码规范检查 步骤
* `./cli/unit_test.sh` CI 的 单元测试 步骤
* `./cli/build.sh` 构建二进制包
* `./cli/pre_commit` 为 `.git/hooks/pre_commit` 软链或者调用的脚本

## 数据库migrations

所有数据库版本脚本均托管到 git 仓库中，建议手动管理（因为企业级系统一般均有DBA进行限制DDL操作），目录位于 `template-core/src/main/resources/db/migrations` 目录。

该目录下包含多个目录，每个目录就是一个数据库变更版本，这些目录的命名方式为 `YYYY-mm-DD-%d%d%d%d%d%d-name`，每个目录下包含两个文件 `up.sql` 和 `down.sql`（可选）如下

* `2020-04-02-000000-init`
    * `up.sql`
* `2020-04-02-000001-new-core`
    * `up.sql`

## 配置管理

### 配置文件约定

* 格式统一为 `*.yml`，语法参见 https://www.ruanyifeng.com/blog/2016/07/yaml.html
* 线上环境命名规则为 `application-prod-$region.yml`，例如
    * `application-prod-cn.yml`
    * `application-prod-jp.yml`
* 个人开发环境命名规则为 `application-dev-$username.yml`
* 所有自定义配置项在 `application.yml` 中有默认值
* 配置文件仅允许出现在 `template-web` 和 `template-batch` 模块下

## 配置项约定

所有自定义配置项（非框架配置项，都定义在 `template` 域的一个子域）

```yaml
template:
    region: cn
    xxx:
        id: xxx
        key: xxx
```

配置项禁止直接通过 `@Value` 注入，通过 `template-core` 下的 `TemplateConfiguration` 类 访问配置，该类添加 `@ConfigurationProperties(prefix = "template")` 注解；对于其他子域也创建相关类，并作为 `TemplateConfiguration` 的成员。
