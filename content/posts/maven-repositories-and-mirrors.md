---
title: "Maven Repositories 和 Mirrors"
date: 2022-03-02T20:25:37+08:00
draft: false
toc: true
comments: true
tags:
  - java
---

## 下载流程

Maven 下载依赖的过程中，有两个配置项：Repositories 和 Mirrors。Repositories 是可以在项目粒度的 `pom.xml` 中配置的，而 Mirrors 只能在 `settings.xml` 中配置。理解 Maven 下载流程，这两个配置的作用就不言自明了。

* Maven 收集项目 POM 中的 Dependency，发起下载 Dependency 的流程，并递归这个过程直至所有 Dependency 都下载完成
* 下载一个 Dependency 的首先根据配置和项目 POM，准备好两个列表：
    * Repositories 列表（最后总会添加默认的 id 为 central 的仓库 `https://repo.maven.apache.org/maven2`）
    * Mirrors 列表
* 遍历 Repositories 列表中的
    * 针对每一项 Repository
        * 遍历 Mirrors 中的每一项，并匹配 MirrorOf 属性（Repository ID 匹配 MirrorOf），返回第一个匹配的 Mirror
        * 如果存在匹配的 Mirror，则向 Mirror 配置的 URL 发起请求
        * 如果不存在匹配的 Mirror，则向 Repository 配置的 URL 发起请求
    * 如果 URL 下载成功，则完成 Dependency 的下载
    * 否则，继续遍历下一个 Repository
* 如果遍历所有的 Repositories 列表都没有下载成功，则直接失败

代码解析参见： https://www.cnblogs.com/ctxsdhy/p/8482725.html

## http block 问题

自 Maven 3.8.1 起，maven 禁止了对 Repository URL 为 http 协议的 Repository 进行下载。

禁止的原理就是利用 Mirror 特性实现的，在默认配置文件（`$MAVEN_HOME/conf/settings.xml`）添加了配置：

```xml
  <mirrors>
    <mirror>
      <id>maven-default-http-blocker</id>
      <mirrorOf>external:http:*</mirrorOf>
      <name>Pseudo repository to mirror external repositories initially using HTTP.</name>
      <url>http://0.0.0.0/</url>
      <blocked>true</blocked>
    </mirror>
  </mirrors>
```

根据上文提到的下载流程，可以看出，所有 http Repository 都会匹配到该 mirror，然而当前 mirror 又配置了 blocked 为 true，则直接下载失败。

解决的办法为：

1. 不使用 http，全部切换为 https
2. 每天添加一个 http 的 Repository，都需要在用户配置（`~/.m2/settings.xml` 该文件优先级高于默认配置文件） 中添加配置：

```xml
  <mirrors>
    <mirror>
      <id>xxx-mirror</id>
      <mirrorOf>xxx-repo</mirrorOf> <!-- mirrorOf 需要匹配 -->
      <url>http://maven.aliyun.com/repository/public</url>
      <!-- <url>https://repo.maven.apache.org/maven2</url> -->
    </mirror>
  </mirrors>
```

### 关于 `mirrorOf`

结合上文下载流程。常见的配置为：

* `*` 永远匹配，不建议使用
* `central` maven 中心仓库 `https://repo.maven.apache.org/maven2` （不包含各种安卓相关的依赖）

## 最佳配置

不建议使用 `mirror` ，`mirror` 很容易出问题。

### 场景 1：仅包含开源依赖

```xml
<settings>
    <profiles>
        <profile>
            <id>personal-repos</id>
            <repositories>
                <repository>
                    <id>aliyun-public</id>
                    <url>https://maven.aliyun.com/repository/public</url>
                </repository>
            </repositories>
            <!--  插件拉取地址  -->
            <pluginRepositories>
                <pluginRepository>
                    <id>aliyun-plugin</id>
                    <url>https://maven.aliyun.com/repository/public</url>
                </pluginRepository>
            </pluginRepositories>
        </profile>
    </profiles>

    <activeProfiles>
        <activeProfile>personal-repos</activeProfile>
    </activeProfiles>
</settings>
```

### 场景 2：内网私有仓库

假设某公司：

* 部署了一个有私有的 Maven 仓库，该私有仓库只包含公司内部的依赖，不包含公网开源的依赖。
* 主要研发人员位于国内

```xml
<settings>
    <profiles>
        <profile>
            <id>xxx-repos</id>
            <repositories>
                <repository>
                    <id>xxx-public</id>
                    <url>https://xxx/repository/public</url>
                    <!-- 如果是 http，则需要在配置 mirror -->
                    <!-- <url>http://xxx/repository/public</url> -->
                </repository>
                <repository>
                    <id>aliyun-public</id>
                    <url>https://maven.aliyun.com/repository/public</url>
                </repository>
            </repositories>
            <!--  插件拉取地址  -->
            <pluginRepositories>
                <pluginRepository>
                    <id>xxx-plugin</id>
                    <url>https://xxx/repository/public</url>
                </pluginRepository>
                <pluginRepository>
                    <id>aliyun-plugin</id>
                    <url>https://maven.aliyun.com/repository/public</url>
                </pluginRepository>
            </pluginRepositories>
        </profile>
    </profiles>

    <activeProfiles>
        <activeProfile>xxx-repos</activeProfile>
    </activeProfiles>

    <mirrors>
        <!-- 如果内网的 URL 只有 http 协议的话，需要添加这个配置 -->
        <!-- 其中 mirrorOf 为对应的 Repository 的 ID -->
        <!-- <mirror>
            <id>xxx-mirror</id>
            <mirrorOf>xxx-public</mirrorOf>
            <url>http://xxx/repository/public</url>
        </mirror> -->
  </mirrors>
</settings>
```
