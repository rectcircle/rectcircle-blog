---
title: "和 Trae AI 协作一周内开发实用 IDE 插件"
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

## 设计

既然要做，当然不能做只一个玩具项目，要做一个通用的架子，可以满足各种类似需求。回忆这些年来开发过程，类似的痛点还有：

* 时间戳格式化成人类能看懂的格式。
* 解析 JWT 里面的 json 内容。
* URL Query 串中类似于 `%xx` 格式的URL 编码的内容进行解码。
* 不同语言/项目有不同的命名风格，很容易一不小心写错了一个变量/函数名的风格，想一键修正。
* ...

对这些需求抽象，本质上这个插件要做的就是要：识别字符串的类型，将其转换为另一种格式字符串。

既然选择了 IDE 插件形式，那么则需要和 IDE 深度集成，最好的体验是这个能力无感的。

因此，该插件要做的是：

* 用户行为触发 IDE 事件，IDE 插件监听指定时间。
* IDE 根据事件信息，获取到原始字符串。然后识别字符串的类型，将其转换为另一种格式字符串。
* 通过 IDE 的能力将转换后的字符串以合适的方式展示出来，并支持后续的操作。

根据如上需求分析，可以看出，该插件可以用 MVC 架构抽象：

* 用户触发 IDE 事件：Controller 层。
* 字符串转换： Service/Model 层。
* 结果展示： View 层。

先看 IDE 事件的选择，VSCode 系 IDE 为插件提供了很多扩展点（IDE 事件），适合这个需求的有如下两个：

* HoverProvider: 用户鼠标停留在编辑器代码的位置，将触发该事件，事件中包含文档路径和行列号。回调函数需要返回一个 Markdown 文档，IDE 会把这个 Markdown 文档以浮窗的方式渲染在鼠标附近。
* CodeActionProvider: 用户切换了输入光标或选择停留后，触发该事件，事件中包含文档路径和光标或选择起始点的行列号。回调函数需要返回一个操作列表，即待调用的 VSCode 命令和参数列表。IDE 会展示一个小灯泡。用户点击小灯泡（`cmd+.`）后将展示这个操作列表。

再看业务逻辑的抽象。

从上文可以看出 IDE 提供的事件是文档路径和光标或选择起始点的行列号，因此首先需要根据文档路径和行列号信息提取对应位置的完整字符串。有两个要求：

* 在只提供光标位置的情况下，需要准确确认文本边界。
* 需要获取当前光标位置文本在改编程语言中是什么类型，如果是字符串字面量，还需要处理转义字符串。

因此流程上分为两步：

* 利用词法分析器，获取光标位置的文本内容和类型。
* 定义一个接口，每个编程语言均需实现该接口：解析字符串字面量的转义，转化为真正内容。

    ```typescript
    export interface StringLiteralParseResult {
        text: string;
        startMarker?: string,
        endMarker?: string,
    }

    export type StringLiteralParser = (originText: string, type: string) => StringLiteralParseResult;
    ```

上面已经获取到了文本内容，后面则需要对字符串的格式进行检测和转换。这个行为可以抽象为 `StringConverter` 接口，包含如下两个函数：

* `match` 探测当前字符串是否是指定格式，返回 true 或 false。
* `convert` 当 match 返回 true 时，才会调用此函数，将该字符串转换为指定格式。

需要识别和转换的类型都需要实现这个接口，如 jwt、 timestamp 等。

至此，已经获取了字符串的转换结果，后面就是对结果进行展示。可以将结果转换为 Markdown 格式，然后通过，如下方式展示：

* 如果是 Hover 触发的，直接将 Markdown 作为 HoverProvider 的返回值。
* 如果利用 VSCode 内置 Markdown 插件的预览能力，在编辑器中展示结构。

针对返回结果，有一些后续 Action ，如 Copy 到剪切板，触发重命名等等。这里和展示方式有关：

* Hover 浮窗，可以通过 `[$(copy)](command:xxx?参数)` 触发插件命令，如写入剪切板。
* Markdown 插件的预览，可以通过 Uri handler 机制触发命令，`[$(copy)](vscode://插件ID/path?参数)` 方式触发插件命令，如写入剪切板。

总结一下，整体流程如下：

```
IDE 事件 ----> 词法分析提取 Token 和类型 ----> 解决字符串字面量 ----> match&convert ----> Hover/Markdown
                                            (Go JS ...)       (jwt timestamp)            |
                                                                                         |
                                                              执行后续命令（如 copy）  <----+
```

如上设计在最初仅有一个大概。这个最终结构是和 Trae AI 一起编码过程中，细节才逐步确定的。

## 项目初始化
