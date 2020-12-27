---
title: "常见 认证 (Authentication) 和 授权 (Authorization)"
date: 2020-09-16T11:46:48+08:00
draft: true
toc: true
comments: true
tags:
  - 安全
  - web
---

> https://blog.csdn.net/wang839305939/article/details/78713124/
> https://www.cnblogs.com/dcz2015/p/11725862.html
> https://blog.csdn.net/ovowovo/article/details/104502495
> https://www.cnblogs.com/jinhengyu/p/10257792.html

## 认证

OAUTH2 和 CAS 参见，[单点登录](/posts/单点登录/)

### JWT

#### 简介

JWT，即json web token。是一种比较常用服务认证方案，是一种无状态认证方案

#### 核心对象及持有资源

- 签发中心（认证服务）
    - 非对称秘钥（仅签发中心有，需绝对保密）
    - 非对称公钥（公开可见，或API提供）
    - 签发 JWT Token 的 API
- 接入的服务端（服务接入方）
    - 签发中心的非对称公钥

#### 流程

1. 用户访问一个接入JWT的站点
2. 前端调用签发中心RESTAPI获取JWT
     1. 签发中心，若发现没有登录，返回401，前端302到登录服务（一般有OATH2或CAS两种协议）
     2. 用户登录后，重新进入1.步
3. 签发中心，若发现已登录，生成具有一定有效期的JWT Token并返回，JWT格式和生成原理如下
     1. JWT Token 为一个以.分割的字符串，$Header.$Payload.$Signatures
     2. Header 为 json 字符串的 base64 编码，包含 Signatures的签名算法信息，为明文
     3. Payload为 json 字符串的 base64 编码，包含用户的基本信息，为明文
     4. Signatures = $Header的签名算法($Header.$Payload, 签发中心非对称私钥)
4. 前端请求服务，并带上JWT
5. 服务端接收到JWT
     1. 获取签发中心的非对称公钥
     2. 对 Signatures 进行 验签，得到 $Header.$Payload 并与 JWT 的 $Header.$Payload 进行校验，如果验证通过，则用户身份没有被篡改
     3. 此时可以解析 $Payload 获取用户数据即可

## 授权
