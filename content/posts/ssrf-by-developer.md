---
title: "开发者角度理解 SSRF 攻击"
date: 2021-08-16T20:33:37+08:00
draft: false
toc: true
comments: true
tags:
  - 安全
---

## SSRF 是什么

Server-Side Request Forgery 服务器端请求伪造。

指，攻击者让服务端发起一个绕过权限控制的 HTTP 请求，并获取到了相关数据。

说人就是话：后端需要发起请求，但请求URL来自用户

## 发生条件

服务端一定程度上承担了 HTTP Proxy 的角色，并让用户可以指定访问地址的情况。

## 发生后果

* 暴露攻击者本没有权限访问的资源（因为内网一般被认为是可信任的）
* 暴露内网状况

## 举例

* 一个接口，可以指定 URL 并代理下载相关资源

## 防范方式

* 服务端去其他资源的请求的参数不允许用户配置 URL
