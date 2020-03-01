---
title: "HTTP CSRF 攻击"
date: 2020-03-01T19:50:43+08:00
draft: false
toc: true
comments: true
tags:
  - 安全
---

一般出现在传统的Form表单的网页交互方式中，因为Form表单的交互不受同源策略（`CORS`）控制。

因此钓鱼网站可以利用此特性进行攻击

现代网站使用Ajax交互的情况下一般不会存在`CSRF`攻击，因为有 `CORS` 策略
