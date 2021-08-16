---
title: "开发者角度理解 XSS 攻击"
date: 2021-08-16T21:05:19+08:00
draft: false
toc: true
comments: true
tags:
  - 安全
---

## 什么是 XSS

Cross-site scripting 跨站脚本攻击。

攻击者输入的内容，会被渲染到其他用户页面的 HTML 中，导致攻击代码被执行。

## 发生条件

* 攻击者输入的内容，会被渲染到其他用户页面的 HTML 中。

## 发生后果

* 盗取用户身份信息，如 Cookie
* 破坏正常功能

## 举例

* 留言板 / 论坛，直接将用户发布的内容未经校验，直接渲染到页面中去了。
* 允许上产 svg 文件，并直接渲染到页面中
* 浏览器重定向， `a` 标签的 `href`、 `location.href` 的内容由用户输入，可以执行任意脚本，比如 `location.href=javascript:alert('abc')`

## 更多参见

[美团博客](https://tech.meituan.com/2018/09/27/fe-security.html)
