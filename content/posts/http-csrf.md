---
title: "HTTP CSRF 攻击"
date: 2020-03-01T19:50:43+08:00
draft: false
toc: true
comments: true
tags:
  - 安全
---

## 理解 HTML 的 Form 和 JavaScript 的 Ajax

1998 年前后几年，HTML4.01 和 Ajax 相继出现。

在 2005 左右 Ajax 才成为一种比较主流的技术。在此之前，主流网站的交互式大多数是通过 Form 表单来实现。

Web 交互主要是依靠这两种技术进行的。下面介绍下 Web 交互的技术演进

### Web 交互技术演进

#### 原始 Form

Form 是 HTML 的一个特殊的标签，在用户点击了 Form 表单内部的 submit 按钮后，浏览器会，并将 Form 用户输入的值作为参数，发起一次 HTTP 请求。

Server 端接收到请求后，根据情况返回新的 HTML 页面即可，浏览器会自动渲染页面。

此时阶段的技术特点是

* 以页面为粒度进行开发
* 采用模板引擎技术

#### Form Ajax 混合模式

由于 Form 表单存在的固有问题，每次交互都需要刷新页面，重新渲染整个页面，对于复杂交互的系统，基本无法实现。

因此 许多复杂 系统开始逐渐采用 Ajax 技术，动态请求数据。但是由于旧开发模式的历史惯性和并没有真正意义上的前端开发人员，所以此阶段的技术特点是

* 仍以页面为粒度进行开发
* 采用模板引擎技术
* 页面上部分功能采用 Ajax 技术

#### Web APP 模式

随着 Web 技术的演进，现在复杂 Web 系统的架构均采用前后端分离的模式，纯粹以 Ajax 技术进行交互。此时的技术特点为

* 后端以接口/API粒度进行开发
* 仅需要返回数据而不用返回 HTML
* 完全使用 Ajax 技术

### Ajax 请求 和 Form 请求的关系

* Form 支持的请求称为 **简单请求**
* Ajax 和 Form 存在交集，交集的部分为：**简单请求**，为了兼容，Ajax 的简单请求和 Form 基本一致
* Ajax 支持更复杂的请求类型，其行为是 JavaScript 标准
* Form 请求行为是 HTML 标准

## Form 表单中的 CSRF 漏洞

参见：[阮一峰博客](http://www.ruanyifeng.com/blog/2016/04/cors.html)

几个要点

* 因为 Ajax 可以理解为 Form

才漏洞主要场景是：钓鱼网站，恶意链接

## 额外说明

以上描述的 Web APP 模式下，完全使用 Ajax 交互技术的站点中，如果满足如下条件，则不会出现 CSRF 问题：

* 不使用 GET 操纵数据
* 其他方法不接受，`Content-Type` 为 `application/x-www-form-urlencoded`、`multipart/form-data`、`text/plain` 的请求（即不允许使用简单请求）
* `CORS` 没有向恶意站点开启

## CORS

CORS 和 CSRF 存在一定的相关性。

冠以 CORS，参见：[阮一峰博客](http://www.ruanyifeng.com/blog/2016/04/cors.html)
