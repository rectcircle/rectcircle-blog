---
title: "和 Trae AI 一起一周内开发一款超实用 VSCode 插件"
date: 2025-05-25T23:42:00+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## Showcase

Hover 在代码字符串上，自动识别解析转换光标位置字符串。

功能 | 示例
----|----
字符串去除转义 | ![str-conv-lang-literal.png](/image/str-conv-lang-literal.png)
符号命名风格一键转换 | ![str-conv-symbol-style-rename.gif](/image/str-conv-symbol-style-rename.gif)
JWT 识别和解析 | ![str-conv-parse-jwt.png](/image/str-conv-parse-jwt.png)
时间戳转换 | ![str-conv-parse-timestamp.png](/image/str-conv-parse-timestamp.png)
URL 解码 | ![str-conv-parse-url.png](/image/str-conv-parse-url.png)
Base64 解码 |  ![str-conv-parse-base64-string.png](/image/str-conv-parse-base64-string.png) ![str-conv-parse-base64-binary.png](/image/str-conv-parse-base64-binary.png)
JSON 格式化 | ![str-conv-json-format.png](/image/str-conv-json-format.png)

可通过如下链接安装体验：

* [VSCode 官方市场](https://marketplace.visualstudio.com/items?itemName=Rectcircle.str-conv)
* [Openvsx 社区市场](https://open-vsx.org/extension/Rectcircle/str-conv)
<!-- * [字节内部插件市场](https://xxx.xxx.xxx/xxx/Rectcircle/str-conv) -->

## 缘由

<!--
作为 Trae ai-agent 的开发者，我在调试 PE 的时候，经常需要将文本内容和 JSON 字符串格式之间相互转换。
-->

最近在开发过程中，经常需要将文本内容和 JSON 字符串格式之间相互转换。

我尝试了一些解决办法，如在线网站、node/python REPL，体验都不好：在线网站还有各种广告，需要跳出 IDE，打断思路。都需要很多步操作，来回复制，很是繁琐。

既然问题存在，且没有看到解决办法。我是否可以写一个工具解决这个问题呢？

作为一个<!-- Cloud IDE 相关领域的-->软件开发者，答案当然是可以的，而且这个工具非常适合以 IDE 插件的方式和编码过程深度集成。

有了想法相当于已经完成了 50%，剩下差的就只是将想法落地的时间。当时正好临近五一假期，有了空闲时间。

再加上 Trae AI 的提效（从 5.30 ~ 5.5 总共六天断断续续，算人力最多 3 人天），这个 VSCode 插件得第一个版本在五一假期结束前顺利上线。

本文，将重点介绍如何使用 Trae AI （国内版） 配合 DeepSeek-V3-0324 模型，为真实项目进行提效。

## 需求分析

既然要做，当然不能做只一个玩具项目，要做一个通用的架子，可以满足各种类似需求。回忆这些年来开发过程，类似的痛点还有：

* 时间戳格式化成人类能看懂的格式。
* 解析 JWT 里面的 json 内容。
* URL Query 串中类似于 `%xx` 格式的URL 编码的内容进行解码。
* 不同语言/项目有不同的命名风格，很容易一不小心写错了一个变量/函数名的风格，想一键修正。
* ...

对这些需求抽象，本质上这个插件要做的就是要：识别字符串的类型，将其转换为另一种格式字符串。

和 IDE 深度集成，要怎么识别到用户字符串内： 用户主动选择 / 光标位置。

获取到结果后，用户会有什么动作呢？

## 代码架构设计

## 项目初始化
