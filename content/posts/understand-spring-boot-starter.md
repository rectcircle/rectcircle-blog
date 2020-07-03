---
title: "深入理解 Spring Boot Starter"
date: 2020-07-03T00:48:16+08:00
draft: false
toc: true
comments: true
tags:
  - java
---

https://juejin.im/post/5e74971b518825492c05279e

关键点

* 在 ClassPath 中 查找 `META-INF/spring.factories`（通过 ClassLoader.getResources），获取加载自动配置类（key为 `EnableAutoConfiguration` 的值）
* Spring Boot 官方的自动配置 Jar 包为 `spring-boot-autoconfigure`，通过官方提供 starter 整合第三方组件的配置约定，可以通过阅读该包的对应源码进行理解（比 Google 搜更好）
