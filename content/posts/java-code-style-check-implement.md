---
title: "Java 代码风格样式检查落地"
date: 2020-04-21T23:10:35+08:00
draft: false
toc: true
comments: true
tags:
  - java
---

[落地：代码模板](https://github.com/rectcircle/rectcircle-project-template/tree/master/backend/java/spring/common-project)

## 背景

作为一个合格 Java 开发者，我们的要做的应该是 Programming 而不仅仅是 Coding，而一个项目的 Programming，必然需要严格的代码规范和统一的代码风格。

严格的代码规范和统一的代码风格有如下好处：

* 让开发者整洁的代码优雅一起共事，让开发者拥有好的心情
* 代码逻辑清理，风格统一，更利于代码阅读
* 减少错误的发生

## 目标

* 严格的代码规范和统一的代码风格
* 通过工具真正落地
    * 开发工具实时监测
    * 命令检测支持
    * git commit 检测
    * 准入流水线检测

## 思路与实施

* 调研主流的代码规范的可配置型及相关工具链的完善程度
* 根据团队特点定制化的进行配置
* 编写相关检验脚本和IDE配置教程

经过调研，发现 P3C 和 Java Google Style Guides 经过配置可以组成比较完善的代码规范和规则。

* Java Google Style Guides 是纯粹的代码样式规范，使用范围更广泛，工具链更成熟
* P3C 更适合 Java 业务开发，在国内知名度较高

## Java Google Style Guides 代码检查（Checkstyle实现）

[Java Google Style Guides](https://google.github.io/styleguide/javaguide.html) 是世界范围内使用最广泛 Java 规范。

### 命令行配置

通过 Maven 插件 [maven-checkstyle-plugin](https://checkstyle.org/) 通过配置即可实现

下载 [google_checks.xml](https://github.com/checkstyle/checkstyle/blob/master/src/main/resources/google_checks.xml) 文件保存为 `checkstyle.xml`，根据自身情况进行修改，如何修改可以参考 https://checkstyle.org/google_style.html

如果需要忽略路径，需要添加 `checkstyle-suppressions.xml` 文件

```xml
<?xml version="1.0" ?>

<!DOCTYPE suppressions PUBLIC "-//Checkstyle//DTD SuppressionFilter Configuration 1.2//EN" "https://checkstyle.org/dtds/suppressions_1_2.dtd">

<suppressions>
    <suppress checks=".*" files=".metals/.*"/>
    <suppress checks=".*" files=".mvn/.*" />
    <suppress checks=".*" files=".bloop/.*" />
</suppressions>
```

配置 maven 扩展 `pom.xml`

```xml
    <build>
        <!-- 插件依赖管理 -->
        <pluginManagement>
            <plugins>
                <!-- 代码样式检查 -->
                <!-- http://maven.apache.org/plugins/maven-checkstyle-plugin/ -->
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-checkstyle-plugin</artifactId>
                    <version>3.1.1</version>
                    <configuration>
                        <configLocation>checkstyle.xml</configLocation>
                        <encoding>UTF-8</encoding>
                        <consoleOutput>true</consoleOutput>
                        <failsOnError>true</failsOnError>
                        <!-- 警告信息也直接失败 -->
                        <violationSeverity>warning</violationSeverity>
                        <linkXRef>false</linkXRef>
                    </configuration>
                    <executions>
                        <execution>
                            <goals>
                                <!-- verify 阶段 -->
                                <goal>check</goal>
                            </goals>
                        </execution>
                    </executions>
                </plugin>
            </plugins>
        </pluginManagement>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-checkstyle-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
```

使用

```bash
mvn verify
```

编写脚本 `cli/verify.sh`

```bash
#!/usr/bin/env bash
#! 请在 Java 项目根目录下执行

# 原理为 ./mvnw verify 调用 checkstyle 和 pmd maven 插件

TMP_LOG_FILE=".mvn_verify.log"
SPLIT_STR="===================="

./mvnw verify | tee $TMP_LOG_FILE

VERIFY_STATUS=${PIPESTATUS[0]}
BASE_DIR=$(pwd)

echo
if [ $VERIFY_STATUS -eq 0 ]; then
    echo $SPLIT_STR
    echo "后端代码检查通过"
    echo $SPLIT_STR
    echo
else
    echo $SPLIT_STR
    echo "后端代码检查未通过："
    cat $TMP_LOG_FILE | grep -E "(PMD Failure|\[WARN\])"
    echo $SPLIT_STR
    echo
    exit 1
fi
```

使用

```bash
./cli/verify.sh
```

### VSCode 支持

安装 [Checkstyle for Java](https://marketplace.visualstudio.com/items?itemName=shengchen.vscode-checkstyle)

格式化支持

下载 [eclipse-java-google-style.xml](https://github.com/google/styleguide/blob/gh-pages/eclipse-java-google-style.xml) 到 `eclipse-java-google-style.xml` 文件。修改部分内容

配置 `.vscode/settings.json`

```json
{
    "java.checkstyle.configuration": "${workspaceFolder}/checkstyle.xml",
    "java.checkstyle.version": "8.30",
    "java.format.settings.url": "eclipse-java-google-style.xml"
}
```

## P3C 代码检查

P3C 即 阿里主导发布的 [《阿里巴巴Java开发手册》](https://github.com/alibaba/p3c)，在中国比较流行，适用于 业务开发。

P3C 检测工具，官方提供了 IntelliJ IDEA plugin 、 Eclipse plugin 及 PMD implementations。

### 命令行配置

使用其 PMD implementations，配合 [maven-pmd-plugin](http://maven.apache.org/plugins/maven-pmd-plugin/index.html) ，即可实现通过命令行实现代码风格检查。

`pom.xml`

```xml
    <build>
        <!-- 插件依赖管理 -->
        <pluginManagement>
            <plugins>
                <!-- 阿里代码规约检查 -->
                <!-- http://maven.apache.org/plugins/maven-pmd-plugin/index.html -->
                <!-- https://github.com/alibaba/p3c/tree/master/p3c-pmd -->
                <!-- https://github.com/alibaba/p3c/issues/467 -->
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-pmd-plugin</artifactId>
                    <version>3.13.0</version>
                    <configuration>
                        <rulesets>
                            <ruleset>${project.basedir}/p3c-ruleset.xml</ruleset>
                        </rulesets>
                        <!-- 测试报告聚合在父目录 -->
                        <aggregate>true</aggregate>
                        <!-- 打印错误 -->
                        <printFailingErrors>true</printFailingErrors>
                        <!-- 启用缓存加速 -->
                        <analysisCache>true</analysisCache>
                        <!-- 消除警告 -->
                        <linkXRef>false</linkXRef>
                    </configuration>
                    <executions>
                        <execution>
                            <goals>
                                <goal>check</goal>
                                <goal>pmd</goal>
                            </goals>
                        </execution>
                    </executions>
                    <dependencies>
                        <dependency>
                            <groupId>com.alibaba.p3c</groupId>
                            <artifactId>p3c-pmd</artifactId>
                            <version>2.0.1</version>
                        </dependency>
                    </dependencies>
                </plugin>
            </plugins>
        </pluginManagement>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-pmd-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
```

`p3c-ruleset.xml`

```xml
<?xml version="1.0" ?>
<ruleset name="CommonTemplateJavaRule" xmlns="http://pmd.sourceforge.net/ruleset/2.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://pmd.sourceforge.net/ruleset/2.0.0 http://pmd.sourceforge.net/ruleset_2_0_0.xsd">
    <!-- To See https://github.com/alibaba/p3c/tree/master/p3c-pmd/src/main/resources/rulesets/java -->
    <description>阿里巴巴开发手册规则配置</description>
    <exclude-pattern>.*/\.metals/.*</exclude-pattern>
    <exclude-pattern>.*/\.bloop/.*</exclude-pattern>
    <exclude-pattern>.*/\.mvn/.*</exclude-pattern>
    <exclude-pattern>.*/target/.*</exclude-pattern>
    <exclude-pattern>.*/src/test/.*</exclude-pattern>
    <rule ref="rulesets/java/ali-comment.xml">
        <exclude name="AbstractMethodOrInterfaceMethodMustUseJavadocRule" />
    </rule>
    <rule ref="rulesets/java/ali-concurrent.xml"></rule>
    <rule ref="rulesets/java/ali-constant.xml"></rule>
    <rule ref="rulesets/java/ali-exception.xml"></rule>
    <rule ref="rulesets/java/ali-flowcontrol.xml"></rule>
    <rule ref="rulesets/java/ali-naming.xml"></rule>
    <rule ref="rulesets/java/ali-oop.xml"></rule>
    <rule ref="rulesets/java/ali-orm.xml"></rule>
    <rule ref="rulesets/java/ali-other.xml"></rule>
    <rule ref="rulesets/java/ali-set.xml"></rule>
</ruleset>
```

这些规则的具体含义，参考： [p3c repo](https://github.com/alibaba/p3c/tree/master/p3c-pmd/src/main/resources/rulesets/java)

使用

```bash
mvn verify
```

编写脚本 `cli/verify.sh`

```bash
#!/usr/bin/env bash
#! 请在 Java 项目根目录下执行

# 原理为 ./mvnw verify 调用 checkstyle 和 pmd maven 插件

TMP_LOG_FILE=".mvn_verify.log"
SPLIT_STR="===================="

./mvnw verify | tee $TMP_LOG_FILE

VERIFY_STATUS=${PIPESTATUS[0]}
BASE_DIR=$(pwd)

echo
if [ $VERIFY_STATUS -eq 0 ]; then
    echo $SPLIT_STR
    echo "后端代码检查通过"
    echo $SPLIT_STR
    echo
else
    echo $SPLIT_STR
    echo "后端代码检查未通过："
    cat $TMP_LOG_FILE | grep -E "(PMD Failure|\[WARN\])"
    echo $SPLIT_STR
    echo
    exit 1
fi
```

使用

```bash
./cli/verify.sh
```

### VSCode 支持

安装 [Java P3C Checker](https://marketplace.visualstudio.com/items?itemName=Rectcircle.vscode-p3c)

格式化支持

下载 [eclipse-codestyle.xml](https://github.com/alibaba/p3c/blob/master/p3c-formatter/eclipse-codestyle.xml) 到 `eclipse-java-p3c-style.xml` 文件。

配置 `.vscode/settings.json`

```json
{
    "vscodeP3C.rulesets": [
        "p3c-ruleset.xml"
    ],
    "java.format.settings.url": "eclipse-java-p3c-style.xml"
}
```

执行检测 `>p3c: on workspace`

## 关于 VSCode 格式化 配置

如果要将 P3C 和 Google 结合起来，建议使用 P3C 并修改几个缩进空行配置

```xml
<setting id="org.eclipse.jdt.core.formatter.blank_lines_between_type_declarations" value="2" />
<setting id="org.eclipse.jdt.core.formatter.continuation_indentation" value="2" />
<setting id="org.eclipse.jdt.core.formatter.continuation_indentation_for_array_initializer" value="2" />
```

## 关于特定代码段禁用某些检查规则

* P3C 通过 `@SuppressWarnings({ "PMD.UndefineMagicConstantRule", "PMD.LowerCamelCaseVariableNamingRule" })` 注解
* Checkstyle 通过 `@SuppressWarnings("checkstyle:magicnumber")` 注解
