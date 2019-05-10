---
title: tk.mybatis 使用
date: 2018-12-29T21:16:01+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/185
  - /detail/185/
tags:
  - Java
---

[官方文档](https://github.com/abel533/Mapper/wiki/1.integration)

注意事项

* Model仅支持包装类、不支持基本数据类型
* 驼峰下划线映射，不仅要配置`mapper.style=camelhump`还需要配置`mybatis.configuration.map-underscore-to-camel-case=true`手写sql可能报错
