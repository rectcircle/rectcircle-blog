---
title: "和 Trae AI 协作一周内开发实用 IDE 插件"
date: 2025-05-30T18:12:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## Showcase

> [源码](https://github.com/rectcircle/string-converter-vsc-ext)

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

下面将摘选一些和 AI 提效的一些示例讲述。

## 安装配置 Trae

打开 [官网](https://www.trae.com.cn/) ，点击下载 IDE 下载安装，并登录注册。

后续使用 DeepSeek-V3-0324 模型。

## 项目初始化

1. 询问 AI: `@Builder 在当前工作空间根目录。使用命令初始化一个 vscode extensions 项目`。

    AI 模型调用 `npm -g` 安装 yo、generator-code、并执行 `npx --yes yo code` 初始化 VSCode 扩展。

    在终端里面，选择 Web Extension，填写相关信息，最后选择了 esbuild 作为 bundler。

    问题: AI 没有在根目录直接创建项目，而是嵌套了一层。

    ![image](/image/trae-ai-init-project.png)

2. 按 F5 调试扩展，报错： “错误: problemMatcher 引用无效: $esbuild-watch”。

3. 询问 AI: `#Web vscode 插件 debug， 错误: problemMatcher 引用无效: $esbuild-watch`。

    AI 进行了网络搜索，建议安装 `connor4312.esbuild-problem-matchers` 插件。

    在 Trae 插件市场，安装此插件后。重新按 F5 启动调试，即可正常拉起 Trae 来调试扩展程序。

    输入 cmd+shift+p 输入 ">hello world" 按回车，即可弹出通知。

    ![image](/image/trae-ai-init-web-search.png)

4. 提交项目，打开 Trae 源代码管理， AI 可自动生成提交消息。

    ![image](/image/trae-ai-init-commit-msg.png)

## 代码 Token 提取技术调研

### 尝试使用 VSCode 原生能力

经过和 AI 多轮对话，获取到了如下几个可能 API，经过实验都无法满足需求:

* `vscode.provideDocumentSemanticTokens` 命令: 语义化 token 需要 LSP 支持，且并不是所有语言都支持的。
* `vscode.executeDocumentHighlights` 这个命令获取到的是，`菜单->选择->选择所有匹配项` 那些字符串的 range 列表，并不全。
* `editor.action.smartSelect.expand` 这个命令将会从光标位置开始智能扩选，一般比较准确，但是这个命令会操作用户的编辑器，没法后台调用。

### 调研使用开源语法高亮库

如下是使用 AI 进行技术调研的过程：

* 询问 AI: `#Web 帮我调研业界主流的前端语法高亮库，我想使用其将代码文本转换 token 序列或语法树，并且其中带有偏移量或者行号信息。尽量选取主流的支持语言多的库。`

    AI 给了 PrismJS、 Highlight.js、 Monaco Editor、Tree-sitter、Shiki 几种选择。

    据我了解 Monaco Editor 就是 VSCode 底层使用的编辑器，在这个场景使用不太合适。

* 询问 AI: `使用 PrismJS 库如何获取 Token 序列以及偏移量。`

    AI 给出了示例代码，经验证满足需求。

* 询问 AI: `使用 Highlight.js 库如何获取 Token 序列以及偏移量。`

    AI 给出示例代码，验证满足需求。但是其没有专门的 API，而是在内部变量中。

* 询问 AI: `#Web 如果我只想用 PrismJS 和 Highlight.js 这两个库，解析 token 序列，请从各个角度分析两者优劣，如 github stars 数，支持语言数目`。

    AI 只进行了一次网络搜索，给出的结论也不太准确。如： stars 过时了，支持语言数也不准确。

    ![image](/image/trae-ai-agent-technical-research.png)

    结合 AI 建议以及人工搜索，决定使用 PrismJS （性能、包大小、API 使用便捷度、支持语言数）。

有了方案，在 AI 协助下，很快实现了功能。

## 解析原始 Token 字符串字面量

### 实现代码框架和 TypeScript

上面已经可以获取当前光标位置的 Token 文本和类型了，下面让 AI 实现字符串字面量 Token，在单测生成方案，通过自定义 Rule 可以生成质量很高单测，下面是交互过程：

* 询问 AI: `@Builder 设计并实现一套面向不同编程语言的字符串解析机制，输入是 originText、 type、 和 languageId，输出是 text。如果类型不是字符串直接返回 originText。这套机制具有可扩展，每个编程语言都有自己的实现，新增一个编程语言时仅需添加一个文件，并在 index.ts 注册即可。代码在 service 里面新建一个 literalParser 实现包含 index.ts 和 各个编程语言的实现。先实现 typescript/javascript 的解析。`
* 询问 AI: `@Builder 不要依赖 TokenInfo 类型定义。`
* 询问 AI: `@Builder 重写： 根据 javascript 字符串、模板字符串语法规范解析字符串，关注性能，不要用查找替换，小心关注各种边界 case。`
* 询问 AI: `@Builder 给 #file:src/service/literalParser/typescript.ts 在 #file:src/web/test/suite/service/literalParser/typescript.test.ts 中生成单测，所有分支都要覆盖到。`
* 询问 AI: `@Builder 给 #file:sr生成了很好的单测。并测试出了手写的 buc/service/literalParser/index.ts parseLiteral 添加单测`

    AI 并不能很好的理解单测的目录结构，所以生成的单测位置不符合预期，这种场景可以使用 Trae 自定义规则告诉 AI 如何生成单测。

    ```markdown
    ## 生成单测规则

    * 该规则仅对 src 目录下的文件生效。
    * 本项目使用了 mocha 单测框架、 assert 断言库。
    * 使用  suite 代替 describe。
    * src/path/to/file.ts 对应的单测文件为 src/web/test/suite/path/to/file.test.ts。
    * 测试文件结构如下：

        ```ts
        suite('src/path/to/file.ts', () => {
            suite('待测函数...', () => {
                test('测试样例描述...', () => {
                    assert.equal(1, 1);
                });
            });
        });
        ```
    ```

    ![image](/image/trae-ai-agent-custom-rule.png)

* 询问 AI: `@Builder 修改当前文件所有 Text 的内容为 parseLiteral 函数的返回值。`
* 询问 AI: `@Builder 根据 typescript.test.ts 在 testdata/main.ts 中添加更多测试代码`

### 实现更多主流编程语言字符串 Token 解析

* 以 Rust 为例，各个编程语言的语法都不一样，需要以各个官方语言标准进行解析。因此可以利用 Trae docset 能力让 AI 严格按照语言规范实现。询问 AI: `@Builder 参考 #file:src/service/literalParser/typescript.ts，新建 rust.ts 实现 Rust 字符串解析，然后注册到 #file:src/service/literalParser/index.ts ，然后实现单测并在 #file:src/web/test/suite/service/literalParser/index.test.ts 中 import，然后在参考 #file:testdata/main.ts#folder:testdata 添加对应的人工测试文件。`

    AI 基本结构实现正常，但是解析逻辑完全仿写 typescript，没有按照 rust 语法实现。

    需要给 AI 更多引导，下载官方手册 [tokens.md](https://github.com/rust-lang-cn/reference-cn/blob/master/src/tokens.md)，然后导入到上下文，文档集。

    ![image](/image/trae-ai-agent-context-local-docset.png)

    然后删除之前错误实现，询问 AI: `严格按照 @Builder #doc:rust-token 字符串字面量规范，重点关注转义。不要参考其他语言的实现。从光标位置实现解析逻辑`。

    AI 基本正确实现，人工调整了一下细节。

    `F5` Debug，人工验证，无问题。让 AI 生成提交消息，提交代码到了 git。

* 后续编程语言字符串字面量解析，按照这个提示词 AI 可以很好的实现需求，极大的提效： `@Builder 参考 #file:src/service/literalParser/typescript.ts，新建 xxx.ts 实现 Xxx 字符串解析，然后注册到 #file:src/service/literalParser/index.ts ，然后实现单测并在 #file:src/web/test/suite/service/literalParser/index.test.ts 中 import，然后在参考 #file:testdata/main.ts#folder:testdata 添加对应的人工测试文件。`

    * JSON： `@Builder 参考 #file:src/service/literalParser/typescript.ts，新建 json.ts 实现 JSON 解析（直接使用 JSON.parse 实现），然后注册到 #file:src/service/literalParser/index.ts ，然后实现单测，然后在 #folder:testdata 添加对应的人工测试文件。`
    * Go： `@Builder 参考 #file:src/service/literalParser/typescript.ts，新建 go.ts 实现 Go 字符串解析，然后注册到 #file:src/service/literalParser/index.ts ，然后实现单测并在 #file:src/web/test/suite/service/literalParser/index.test.ts 中 import，然后在参考 #file:testdata/main.ts#folder:testdata 添加对应的人工测试文件。`
    * Java： `@Builder 参考 #file:src/service/literalParser/typescript.ts，新建 java.ts 实现 Java 字符串解析，然后注册到 #file:src/service/literalParser/index.ts ，然后实现单测并在 #file:src/web/test/suite/service/literalParser/index.test.ts 中 import，然后在参考 #file:testdata/main.ts#folder:testdata 添加对应的人工测试文件。`
    * Python： `@Builder 参考 #file:src/service/literalParser/typescript.ts 风格，根据 Python 语言规范，新建 python.ts 实现 Python 字符串解析，然后注册到 #file:src/service/literalParser/index.ts ，然后实现单测并在 #file:src/web/test/suite/service/literalParser/index.test.ts 中 import，然后在参考 #file:testdata/main.ts#folder:testdata 添加对应的人工测试文件。`

## 可扩展对字符串进行识别和转换的机制

* 首先让 AI 生成整体架构，询问 AI： `@Builder 定义一个字符串转换器接口，该接口包含如下内容：1. meta 字段，包含当前转换器 id，name，resultLanguageId. 2. match 函数，参数为 tokenInfo 和可选参数 options，返回 boolean。3. convert 函数，参数为 tokenInfo 和可选参数 options，返回字符串。`
* 以 JWT 为例，实现第一个转换器，询问 AI： `@Builder 在 stringConverter 目录添加一个 jwt StringConverter 的实现。`。
* 后续的转换器的实现按照这个提示词，AI 可以很好的实现需求，极大的提效： `@Builder 参考 #file:src/service/stringConverter/jwt.ts ，在 #folder:src/service/stringConverter 目录新建文件，实现 xxx 字符串解析和转换，match 支持 tokenInfo 为 xxx 两种类型。然后并在 #file:src/service/stringConverter.ts 中注册。生成完成后需生成单测。`
    * 时间戳解析： `@Builder 参考 #file:src/service/stringConverter/jwt.ts ，在 #folder:src/service/stringConverter 目录新建文件，实现时间戳（毫秒/秒）解析的支持，match 支持 tokenInfo 为 string 和 number 两种类型。`
    * Base64 解析： `@Builder 参考 #file:src/service/stringConverter/jwt.ts ，在 #folder:src/service/stringConverter 目录新建文件，实现对 base64 的解析，match 支持 tokenInfo 为 string 类型。`
    * JSON 格式化： `@Builder 参考 #file:src/service/stringConverter/jwt.ts ，在 #folder:src/service/stringConverter 目录新建文件，实现对 json 格式化的支持，match 支持 tokenInfo 为 string 类型。然后并在 #file:src/service/stringConverter.ts 中注册。生成完成后需生成单测。`
