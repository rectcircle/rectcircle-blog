---
title: "依赖注入"
date: 2021-10-03T16:10:30+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 简述

关于依赖注入，比较权威的讨论来源于 Martin Fowler 的 [Inversion of Control Containers and the Dependency Injection pattern](https://martinfowler.com/articles/injection.html) （[中文翻译](https://www.cnblogs.com/me-sa/archive/2008/07/30/iocdi.html)）一文。

该文以 “查询某导演执导的电影列表” 服务为例，描述了 “服务” 和 “组件” 的概念，控制反转的概念，依赖注入的形式，服务定位器模式 等内容。

## 推演

### 问题引出

编程语言作为人和硬件沟通的桥梁，其从面向机器、面向过程，到面向对象，面向接口的发展中，有了越来越好的抽象能力。

抽象意味着，一个程序，由将会拆分成多个相对独立而又相互依赖的组件。

因为进行了拆分，对应的，如何将各个组件按照其依赖关系组合起来，就是每一个程序，特别是大型程序，需要解决的问题。

### 问题转换

假设将 A 依赖 B，表示为 `A -> B`。那么，就可以用一个有向图的边来表示组件与组件之间的依赖关系。

因此问题就被转化为：构造一个依赖图，即组件为节点，依赖关系为有向边的有向图。

### 手动处理

假设所有组件都已经开完成了，开发人员可以按照组件依赖图的关系，从有向图的起点按照顺序，对组件进行组装。

最终将可以得到一个完成的程序。

### 依赖注入

手段处理，对于组件较多的场景，比较繁琐。考虑是否可以自动的执行手动处理的过程，答案是肯定的，这就是依赖注入。

因为问题本身就是构造一个有向图，因此只需知道每个节点和每个节点的入边，即可完备的表述出这个张图。

具体而言，假设有一个注入器，只需要个向这个注入器中声明每个组件以及每个组件的依赖组件，那么这个注入器即可自动的对组件进行组装。

最终将可以得到一个完成的程序。

## 实现

### 编译时 VS 运行时

* 编译时注入，依赖注入器工作在编译阶段，利用编程语言提供的编译时能力（比如代码生成/宏），在编译阶段直接生成代码。
    * 优点
        * 尽早的暴露问题，编译阶段即可发现问题
        * 无性能损失，和手动编写性能一致
    * 缺点
        * 灵活性较差
        * 使用是来相对不够方便
* 运行时注入，依赖注入器工作在运行阶段，利用编程语言提供的反射能力，在运行时构造组件，完成依赖注入
    * 优点
        * 灵活性好，扩展型好
        * 用起来相对方便
    * 缺点
        * 如果存在问题，需要运行时才能暴露出来
        * 有性能损失，初始化耗时将大大增加

目前主流的依赖注入库/框架为：运行时

### 构造函数注入 VS 属性注入

#### 构造函数注入

该方式用户需要提供一个包含所有依赖的构造函数，才能使用依赖注入。

优点

* 对使用者来说，基本无侵入

缺点

* 无法处理循环依赖，因此依赖图就退化成了有向无环图，某些特殊场景可能无法得到支持
* 需要编写一个构造函数，如果依赖比较多，构造函数的参数会过多会显得有些混乱，另外构造函数基本上都是一些样板代码

#### 属性注入

使用者需要提供分别提供一个，类型 T 和 依赖的组件类型列表 deps，其中 deps 可以通过注解或tag或配置文件进行声明。

优点

* 可以支持循环依赖的情况
* 无需编写大量样板的构造函数
* 对使用者来说更方便一些

缺点

* 注解和 tag 有一定的侵入性
* 可能破坏了私有依赖的不可见性

#### 如何选择

依赖注入器，可能会支持如上两种中的一种或者都支持。从使用者角度，优先使用支持属性依赖注入的依赖注入库或框架。

### 声明方式

* 配置文件
* 注解/Tag方式
* 编程方式

推荐使用编程方式+注解/tag方式

### 运行时依赖注入流程

依赖注入器使用者，在注册一个组件时，提供的的信息一般称为 `Provider`，该 `Provider` 的构造函数声明为 `new Provider(constructor: function, propertyDeps: []type)`

* 对于构造函数依赖注入 `new Provider(某个构造函数, null)`
* 对于属性依赖注入 `new Provider(空构造函数, 属性依赖列表)`
* 对于构造函数依赖注入 和 属性依赖注入同时使用 `new Provider(某个构造函数, 属性依赖列表)`

此时流程为（仅表述流程，具体实现应该有所优化）

* `Provider`
    * 有四种状态 （`registered`, `created`, `injected`, `error`）
    * 存在一个 `cache` 字段，记录构建出的组件
    * 存在一个 `passed` 字段，判断是否遍历过
* 用户通过多种方式声明 `Provider`，此时这些 `Provider` 的状态为 `registered`
* 用户需要提取某个组件时
    * 构造阶段，递归**后续**遍历该 `Provider`
        * 如果已经遍历过了，设置状态为 `error`（构造函数循环依赖），返回异常
        * 如果该 `Provider` 的状态为 `error` 直接抛出异常
        * 如果该 `Provider` 的状态为 `created`、`injected`，返回 `cache`
        * 如果该 `Provider` 的状态为 `registered`
            * 检查 `constructor` 的每个依赖项目
                * 如果发现其依赖项不存在 `Provider`，设置状态为 `error`（依赖不存在），返回异常
                * 如果发现其依赖项存在 `Provider`，**递归调用**，如果返回 `error`，设置状态为 `error`，返回异常
            * 使用依赖项返回值作为参数，调用该 `Provider` 的 `constructor` 并记录 `cache`，状态这是为 `created`
        * 返回 `cache`
    * 属性注入阶段，递归**后续**遍历
        * 如果该 `Provider` 的状态为 `error` 直接抛出异常
        * 如果该 `Provider` 的状态为 `injected` 返回 `cache`
        * 如果该 `Provider` 的状态为 `registered`，调用**构造阶段**函数，**不返回**
        * 如果该 `Provider` 的状态为 `created`
            * 先将该 `Provider` 的状态为 `injected`
            * 检查 `propertyDeps` 的每个依赖项目
                * 如果发现其依赖项不存在 `Provider`，设置状态为 `error`（依赖不存在），返回异常
                * 如果发现其依赖项存在 `Provider`，**递归调用**，如果返回 `error`，设置状态为 `error`，返回异常
            * 使用依赖项返回值作为参数，执行属性注入逻辑并记录 `cache`
        * 返回 `cache`

## 如何评价一个依赖注入库/框架

* 口碑
    * 维护组织
    * stars
* 不可兼得
    * 运行时（更佳）/编译时
    * 轻量级（更佳）/重量级
    * 库/框架
* Features
    * 构造器注入
    * 属性注入
    * 提供常量值
    * 接口绑定
    * 对象命名
    * 对象组（注入同类型多想多个组成一个切片）
    * 循环依赖
* 质量
    * 侵入性
    * 测试覆盖度
    * 文档丰富度
    * 社区活跃度
