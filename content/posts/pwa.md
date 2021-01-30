---
title: "PWA"
date: 2021-01-31T00:34:29+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 简介

> [InfoQ 文章](https://www.infoq.cn/article/js2oc7ugfjdjdgjldars)

PWA 全称 Progressive Web App， 即渐进式 Web 应用

PWA 的出现可以解决 传统 Web APP 的如下核心问题

* 传统 Web APP 在标准上不支持独立的图标和窗口和 Native APP 比算是二等公民，PWA 在标准上提供了 独立的图标 和 窗口，在表现上和 Native APP 几乎相同
* 传统 Web APP 必须在有网络的环境才能使用，PWA 提供了一套完善的资源缓存机制，可以实现无网络使用
* 传统 Web APP 只有在用户打开页面的情况才能执行业务代码，PWA 可以在后台一致运行一个生命周期更长的 线程，称为 worker service，以实现推送等能力

称为 渐进式 的原因有几点

* PWA 不像 Native APP 开发一样是一套独立的技术栈，而是完全建立在 Web 现有技术之上的，可以理解为 PWA 是 Web 技术的超集。
* 开发者可以根据需求， 渐进的 利用 PWA 的特性，来实现比 Web App 更好的体验

假设你有了一个现成的 Web App，将其转换为 PWA 开发步骤一般如下

* 提供一个描述文件，描述 APP 的图标标题等内容，使该 APP 可以安装到系统中，并以独立的窗口运行（完成这一步的 Web App 就是一个 PWA 了），其他的行为和 Web App 几乎一样
* 现有 业务 JS 中，注册 worker service 代码文件
* 在 worker service 线程中实现很多特殊功能，利用如下能力，优化体验
    * 提供缓存 API，DB 等 API，将数据资源存储在本地
    * worker service 可以拦截该网站的所有网络请求，并直接返回本地中的资源以实现无网络运行
    * 提供和 业务 JS 通信双向通信的 API
    * 窗口关闭后，该线程仍然存在，可以实现后台消息推送能力

## 核心技术

主要就两个内容

* [Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
* [worker service API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## 相关资源

* MDN 文档 [中文](https://developer.mozilla.org/zh-CN/docs/Web/Progressive_web_apps) | [英文](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) 中文可能有所滞后，但概念还是挺清晰的
    * [Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
    * [worker service API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
* [很棒的一个教程](https://pwa.alienzhou.com/)

## 特别提醒

### 前置条件

PWA 必须基于 HTTPS 协议，否则无法安装

### 如何安装

> [微博 Lite](https://m.weibo.cn/) 实现了 PWA，可以前往体验

HTML 页面中 包含一个 `<link rel="manifest" ...>` 标签时（例如 `<link rel="manifest" href="js13kpwa.webmanifest">`）。

* 方式 1：地址栏将出现一个 `⊕` 符号，点击安装即可
* 方式 2：在 溢出菜单 中，会出现 安装 xxx app 的字样 的字样

安装完成后，页面将以 独立 窗口打开

### 第二次如何打开

* 方式 1：直接在 window 开始菜单 / Mac 启动台 打开
* 方式 2：在浏览器中打开网址后，点击地址栏中的打开新窗口图标

### Worker service 的生命周期

参见：[Google 的 文档](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle)

#### PWA Worker service 脚本更新规则

* 如下条件将触发更新检查
    * 打开了某 PWA 作用域内的 页面
    * 24 小时内没有检查过更新且触发了 push 和 sync 事件
    * 调用 `.register` 注册了一个完全不同 URL
* 代码存在变更时（包括引用的代码），将重新加载 worker service
* 新的 worker service 与 main js 一起启动，并触发自己的安装事件。
* 新的 worker service 存在异常则直接被丢弃，旧的任然正常工作
* 成功安装后，新的 worker service 将等待，已经存在的 client 归零。（请注意，客户端在刷新期间会重叠）
* `self.skipWaiting()` 避免了等待，这意味着服务工作者在完成安装后立即激活。

### Desktop Chrome PWA 的一些行为

#### PWA 窗口 跳转到外部链接（非新窗口/新页面）

* 在本窗口中直接打开新页面，窗口 Title 下方出现一个地址和标题栏，点击其上的 叉号 将换返回之前的页面
* 若存在多次调转，比如 本窗口 -> 外部网址 A -> 外部网址 B，点击叉号则直接返回 本窗口，不会有历史记录，想回退，只能使用快捷键 Command + 左右

#### PWA 窗口 调转到 本 App 的内部链接

* 和 Native APP 一样直接在本窗口渲染新的内容

#### PWA 窗口 调转到 其他 PWA App 的内部链接

* 和 PWA 窗口 跳转到外部链接（非新窗口/新页面），行为一致

#### PWA 窗口 实现打开新的本 PWA 窗口

```js
// 一定要有第三个参数
window.open('https://m.weibo.cn/','system', 'directories=0');
```

或者

```html
<!-- 一定要有第三个参数 -->
<a href="https://m.weibo.cn/" target="bd" onclick="window.open('','bd','directories=0');" >Home</a>
```

#### PWA 窗口 实现打开新的其他 PWA 窗口

无法实现

#### PWA 窗口直接打开浏览器窗口

```html
<!-- 不能有第三个参数 -->
<a href="https://m.weibo.cn/" target="bd" onclick="window.open('','bd');" >浏览器窗口打开</a>
```
