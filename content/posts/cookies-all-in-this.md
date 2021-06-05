---
title: "Cookies 技术详解"
date: 2021-02-06T18:26:45+08:00
draft: true
toc: true
comments: true
tags:
  - web
---

## 基本情况

* TODO
    * 交互流程
    * 属性和含义
    * 前端设置 cookie

			// https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
			cookieString = jwtTokenKey + "=" + jwtToken + ";path=/;max-age=" + 59 * 60
			if (location.protocol === "https:") {
				cookieString += ";SameSite=None;Secure"
			}

## Cookie 的 应用

* 鉴权，用户登录身份Token
* 广告追踪

## Cookie 与 跨域

> [阮一峰：同源策略](http://www.ruanyifeng.com/blog/2016/04/same-origin-policy.html)

## Cookie 与 安全

## Cookie 技术未来变化

> https://zhuanlan.zhihu.com/p/131256002
