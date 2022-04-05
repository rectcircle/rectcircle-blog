---
title: "Web 后端视角浅谈 Web 前端技术"
date: 2021-08-29T00:14:15+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 说明

* 简单起见下文 Web 前端、Web 后端，简称 前端、后端。
* 本文指的 Web 前端指的是，编写可以在浏览器中运行的页面的相关技术的统称。
* 本文指的 Web 后端指的是，编写运行在服务器中运行的进程，最终以网络API的形式提供服务的相关技术的统称。
* 写这篇文章的目的是，希望后端可以了解一些前端技术，降低与前端沟通成本，尽量让后端的视角更加全局。

## 前端运行环境

要了解前端技术，就要先抓住问题的本质。即，代码最终在什么环境中运行。

先看后端，后端的代码会编译成一个可执行文件（可执行脚本或字节码文件），最终会作为一个进程直接运行在**服务器**上，以 HTTP 接口的方式交付给用户。再看前端，前端的代码最终会编译成 HTML、CSS、JavaScript 资源文件，通过网络加载下来，运行在用户的**浏览器**中，以网页的形式交付给用户。即

* 后端 - **服务器**
* 前端 - **浏览器**

了解了前端的本质后，再来逐一看一下 HTML、CSS、JavaScript

### HTML

### CSS

### JavaScript

## ECMAScript - JavaScript 标准

## Node - 跨时代 JavaScript 运行时

上一小节所讲的前端运行环境，相信多数后端应该都有所了解。

本小结，将用后端容易理解的话语体系介绍，10 多年来，前端的核心技术 —— NodeJS。阅读本小结，你将可以了解：

* 什么是 Node？
* Node 对前端的重要意义是什么？
* Node 中运行的 JavaScript 和 浏览器中运行的 JavaScript 异同？
* NodeJS 是前端还是后端？除了前端领域， Node还能做什么？ https://zhuanlan.zhihu.com/p/360005641

## npm & yarn - JavaScript 包管理

## 大前端

> https://juejin.cn/post/6844903781990137869

## JavaScript 编译器 - Babel

## 前端构建 - Webpack

## 有类型的 JavaScript - TypeScript

## 单测 - Mocha & Jest

### TypeScript 是什么

### TypeScript 的优势

### TypeScript 的编译

## 前端框架

## 前端开发环境搭建

## Example: 不使用任何框架使用 TypeScript 开发前端项目

最后小结，做一个实战，创建一个不使用任何前端框架的 TypeScript 前端项目，要求如下

* 使用 yarn 进行包管理
* 使用 TypeScript 作为开发语言
* 使用 Webpack 作为构建工具
* 使用 Jest 作为 单元测试 和 集成测试 工具
* 实现一个简单的页面，实现简单的加法功能

### 创建并初始化项目

```bash
mkdir web-frontend-core-technology
cd web-frontend-core-technology
yarn init -y
```

### 配置依赖

添加并配置开发依赖 webpack 和 typeScript 依赖

```bash
yarn add -D webpack webpack-cli typescript ts-loader
```

添加一个假设我们依赖的运行时库， lodash

```bash
# 添加运行时依赖包
yarn add lodash
# 添加 TypeScript 编译器依赖的类型声明文件
yarn add -D @types/lodash
```

### 配置 typescript 编译器

初始化配置文件

```bash
tsc --init
```

禁用间接引入的 node 库

```json
{
  "compilerOptions": {
    // ...
    // 默认会包含 ./node_modules/@types/, ../node_modules/@types/, ../../node_modules/@types/ 等等下的所有包
    "types": [],                                 /* Type declaration files to be included in compilation. */
    // ...
  }
}
```

### 配置 webpack
