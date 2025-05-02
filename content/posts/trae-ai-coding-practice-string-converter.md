---
title: "Trae AI 编程实战 —— 开发字符串转换器"
date: 2025-04-30T00:35:00+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 概述

> 使用 DeepSeek-V3-0324 模型。

在开发的过程中，我们经常需要将各种字符串格式的数据进行转换：如去除 JSON 转义字符、JSON 格式化，解析 JWT 内容，格式化时间戳等等。

遇到有如上需求的场景，常见的做法，是去各种广告一大堆的在线网站进行解析，非常不便。

针对这个场景，希望可以实现一个 VSCode 扩展，其可以自动探测选中或当前光标所在未知字符串的格式，并提供对该字符串常见操作，并通过 Quick Action (小灯泡) 供用户选择。

最近国产 AI IDE Trae CN 已经上线，本文将借此项目，对 AI Agent 编程进行深度体验。

## 安装配置 Trae

打开 [官网](https://www.trae.com.cn/) ，点击下载 IDE 下载安装，并登录注册。

## 初始化项目

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

代码详见： [chore: 初始化项目基础结构](https://github.com/rectcircle/string-converter-vsc-ext/commit/02a27188546e813dc80b549230d850a257e9991b)。

## 最小化可验证 Code Action

* 询问 AI: `@Builder 这个扩展将在 code action （VSCode 的小灯泡） 菜单添加一项。用户点击这一项将弹窗展示光标处选中的文本，如果未选中则展示光标附近的关键字或者字符串的内容。`

    AI 只实现了 `string-converter.showText` 命令，并没有实现 Code Action 功能。

* 继续询问 AI: `@Builder 添加到代码操作菜单中。`

    AI 继续实现了 Code Action 能力。

* `F5` Debug，发现断点命中不了，在运行中的扩展中也找不到。询问 AI： `@Builder debug 启动，但是断点好像没有被激活。这个插件在运行中的插件列表中也找不到。`

    AI 修改了 package.json ，但是只在执行命令的时候激活，我想要的是永远激活。手动改为 `*`。

* 让 AI 生成提交消息，并提交代码到 git。

代码详见： [feat(extension): 添加显示选中文本的命令](https://github.com/rectcircle/string-converter-vsc-ext/commit/eb94420eb04dcf7400e5e67c2ca86a0d68d4ab69)。

## 实现提取文本

### 重构代码将相关回调抽到单独的函数中

* 询问 AI: `@Builder 重构代码，将命令和 CodeAction 回调抽到 src/handler/strconv.ts 中。`

    AI 将函数调用完全移动到了 strconv.ts 。我想要的是只把回调移动过去，注册逻辑仍然在 extension.ts

* 询问 AI: `#file:src/handler/strconv.ts 去除 vscode 注册相关的 api，保留回调函数，vscode 注册相关调用在 #file:src/web/extension.ts 中实现，并引用 #file:src/handler/strconv.ts 中的函数。` （提示词调试了很多次）。

    AI 勉强实现了要求，有很多语法错误，通过 AI Fix 能力可以很好的修复。

    ![image](/image/trae-ai-refactor-ai-fix.png)

* `F5` Debug，验证无明显问题。让 AI 生成提交消息，并提交代码到 git。

代码详见： [refactor: 将字符串转换功能提取到独立模块](https://github.com/rectcircle/string-converter-vsc-ext/commit/12234893092f8c43c29516c03f380e280bede8cb)。

### 删除代码模板中的代码

* 询问 AI: `@Builder 删除 hello world 命令相关的所有代码。`

    注意，关闭所有打开的文件，AI 才能更好的工作，否则会影响上下文召回，导致删除不全。

    编辑器打开了 `src/handler/strconv.ts` 效果：

    ![image](/image/trae-ai-delete-code-active.png)

    编辑器未打开任何文件的效果：

    ![image](/image/trae-ai-delete-code-clear.png)

    最终 AI 还是漏了一个导入代码的删除。使用 AI Fix 可快速解决。

* `F5` Debug，验证无明显问题。让 AI 生成提交消息，并提交代码到 git。

代码详见： [refactor: 移除不再使用的helloWorld命令及其相关代码](https://github.com/rectcircle/string-converter-vsc-ext/commit/eea7d11840863e5875227158f4cbd6239c556c5b)。

### 尝试使用 VSCode 现有能力优化光标处文本提取

VSCode 触发 CodeAction 的行为有两种，分别是选中代码和光标变更。在选中场景，很好处理，直接以用户选中的内容当做字符串进行后续处理即可。

但是，在光标变更场景，需要从光标所在位置前后找到这个字符串的终点和起点。然后将这个识别到的字符串进行后续处理。

* 询问 AI: `通过 vscode api 以及 vscode 内置命令，如何获取从光标所在位置的字符串，如果是符号，则获取到这个符号，如果是字符串字面量。则获取到这个字符串字面量的全部内容（包含引号）。不要手写字符串匹配逻辑，如果有的话，尽量利用 VSCode 语法解析、词法解析的来获取，这样才能更准确。`

    AI 回答提到： `'vscode.provideDocumentSemanticTokens'`，如果找不到会 fail back 到获取单词。但是据我了解，只有少数语言才支持语义化 Token。

    另外，让 AI 生成测试代码，发现 SemanticTokens 只会识别符号，不会识别字符串字面量。

* 询问 AI: `vscode 高亮原理`。

    AI 回答： `...VS Code 使用 TextMate 语法规则（.tmLanguage 文件）来定义不同语言的语法高亮规则。...`。

* 询问 AI: `VSCode api 获取 TextMate 语法分析结果`、`vscode api 获取当前光标位置的高亮信息`、 `vscode api 获取当前光标位置的符号` 等。

    试了好多次都无法生成符合预期的代码。

搜索 VSCode 源码找到相关的命令：

* `'vscode.executeDocumentHighlights'`，这个命令获取到的是，`菜单->选择->选择所有匹配项` 那些字符串的 range 列表，并不全。
* `'editor.action.smartSelect.expand'`，这个命令将会从光标位置开始智能扩选，一遍比较准确，但是这个命令会操作用户的编辑器，没法后台调用。

先，让 AI 生成代码，优化光标处文本选取的初步实现：

* 询问 AI: `@Builder showTextCommandCallback 函数中，使用 vscode.executeDocumentHighlights 命令获取当前光标位置的高亮情况，展示到消息中。`

    AI 生成了基本符合预期的代码。

* 询问 AI: `@Builder 如果  highlights 长度不为 0，获取 highlights[0].range 对应的文本内容。`

    AI 生成了正确的代码。

* `F5` Debug，验证无明显问题。让 AI 生成提交消息，并提交代码到 git。
* 代码详见： [feat(handler): 在showTextCommandCallback中添加高亮文本显示](https://github.com/rectcircle/string-converter-vsc-ext/commit/c9bbaea092cbba5867c080657b1c1c991fde6512)。

然后，利用 CodeAction 机制将 `'editor.action.smartSelect.expand'` 也加进来（CodeAction 触发后调用），但是这要分为如下几部两步：

* 第一步： 将现有的获取 text 的代码抽到一个单独的函数 `quickGetActiveText` 里面。
    * 询问 AI: `@Builder 重构 showTextCommandCallback ，如果用户没有选中内容， text 优先取 vscode.executeDocumentHighlights 内容。`
    * 询问 AI: `@Builder 最后输出消息不需要再展示 highlightInfo 信息了。`
    * 询问 AI: `@Builder 重构 showTextCommandCallback 简化代码逻辑。`
    * 询问 AI: `@Builder 将 showTextCommandCallback 中获取 text 的逻辑提取到单独的函数 quickGetActiveText，这个函数同样无参，返回 string 或 undefined。`
    * 已经改的差不多了，手动调整下代码风格。
    * 手动将 showTextCommandCallback 添加一个可选参数 text。
* 第二步： 重构 getCodeActionProviderCallback：
    * 询问 AI: `@Builder 重构 getCodeActionProviderCallback provideCodeActions 先调用 quickGetActiveText 尝试获取 text，然后返回里面包含一个 text，在此不需要调用 command 。然后实现一个 resolveCodeAction 函数，在里面消费 text，然后声明对  string-converter.showText 命令的调用，并将 text 作为参数传递过去`。
    * 询问 AI: `@Builder CodeActionProvider<T extends CodeAction = CodeAction>\nCodeActionProvider 声明如上，代码 data 有类型错误，修复这个问题。`。
    * 询问 AI: `@Builder 重构 getCodeActionProviderCallback 将重复的类型声明提取出来。`。
    * 已经改的差不多了，手动调整下代码风格，以及错误。
* 第三步： showTextCommandCallback 函数添加 `editor.action.smartSelect.expand` 命令调用。然后判断是否以引号开头结尾。
    * 询问 AI: `@Builder 在 showTextCommandCallback 中 quickGetActiveText 后面，如果 text 还是空。且是当前编辑器语言是 ts，则循环调用 editor.action.smartSelect.expand 命令三次，然后每次都检测首尾是否是几种 ts 的字符串引号，如果是则取选中的文本赋值给 text。最后需要恢复光标位置和状态`
* `F5` Debug，验证无明显问题。让 AI 生成提交消息，并提交代码到 git。

    ![image](/image/trae-ai-agent-quick-finish.png)
    ![image](/image/trae-ai-agent-quick-resolve.png)

* 代码详见： [refactor(handler): 重构字符串处理逻辑以提高效率，支持通过自动扩展选择范围并尝试获取字符串](https://github.com/rectcircle/string-converter-vsc-ext/commit/e48baa53b00718ef270a9aab649b193cdd311551)。

### 使用开源语法高亮库提取文本

如上使用 VSCode 现有能力有如下问题：

* 大多数场景在触发 QuickAction 的时候，提取不出文本，无法进行前置分析，体验很差。
* 使用 VSCode 智能扩选在很多场景拿到的字符串也不准（如 Python 字符串）。
* 使用 VSCode 智能扩选这个做法很不优雅，很魔法，而且用户会看到光标闪动。

因为 VSCode 没有暴露 TextMate 高亮引擎相关 API。因此，需调研开源的语法高亮库是否可以返回解析过的 Token 序列或 ast。

#### 技术调研

如下是使用 AI 进行技术调研的过程：

* 询问 AI: `#Web 帮我调研业界主流的前端语法高亮库，我想使用其将代码文本转换 token 序列或语法树，并且其中带有偏移量或者行号信息。尽量选取主流的支持语言多的库。`

    AI 给了 PrismJS、 Highlight.js、 Monaco Editor、Tree-sitter、Shiki 几种选择。

    据我了解 Monaco Editor 就是 VSCode 底层使用的编辑器，在这个场景使用不太合适。

* 询问 AI: `使用 PrismJS 库如何获取 Token 序列以及偏移量。`

    AI 给出了示例代码，经验证满足需求。

* 询问 AI: `使用 Highlight.js 库如何获取 Token 序列以及偏移量。`

    AI 给出可示例代码，经验证满足需求。但是其没有专门的 API 在内部变量中。

* 询问 AI: `#Web 如果我只想用 PrismJS 和 Highlight.js 这两个库，解析 token 序列，请从各个角度分析两者优劣，如 github stars 数，支持语言数目`。

    AI 只进行了一次网络搜索，给出的结论也不太准确。如： stars 过时了，支持语言数也不准确。

    ![image](/image/trae-ai-agent-technical-research.png)

    结合 AI 建议以及人工搜索，决定使用 PrismJS （性能、包大小、API 使用边界度、支持语言数）。

#### 实现文本提取业务逻辑

* 询问 AI: `@Builder #Folder:src/service 目录添加代码解析文件 。里面实现一个名为提取指定位置代码 Token 的函数。该函数有几个参数，第一个参数为代码内容，类型为 string，第二个参数为代码的语言标识符，第三个参数为光标位置（line 和 character），第四个参数可选为光标结束的位置，如果传递第四个参数说明用户选择了一段代码。这个函数返回一个 TokenInfo 结构体，包含 OriginText、 Text、 Type 字段。`
* 询问 AI: `@Builder extractCodeToken 函数最后添加一个可选参数 selectionText。`
* 询问 AI: `@Builder 将 extractCodeToken 函数的实现替换为：\n1. 判断 Prism.languages 对应的语言是否存在，如果不存在： a. 如果 selectionText 存在，则返回 OriginText = Text = selectionText， Type = unknown b. 如果 selectionText 不存在，则返回 undefined。\n2. 否则，调用 Prism.tokenize 函数获取 tokens。 a. 如果 endPosition 存在，则从 tokens 中获取过滤出 position 和 endPosition 之间的的文本的 tokens 列表。如果只有一个 token，则返回 OriginText selectionText， Text 为解决转义字符后的字符串， Type = token 的类型。如果选中内容跨 token 了（在多个 token 中），返回  OriginText = Text = selectionText，Type = multi。b. 如果 endPosition 不存在，则从 tokens 中提取，光标位置的 token，OriginText 为 token 原始内容， Text 为解决转义字符后的字符串，Type = token 的类型。`

    AI 实现的大体框架没有问题，但是细节错漏很多， 写提示词也很累，还不如手写。

    只保留符合预期的部分，同时修改返回值类型为 `TokenInfo[]`。

* 询问 AI: `@Builder 根据注释要求，从光标位置续写。`。

    注释内容为：

    ```
        // 过滤 position，endPosition? 范围内的 token。
        // tokens 类型为 (string | Prism.Token)[]， Prism.Token 是一个展平的结构。
    ```

    思路为，删除有问题的代码，添加注释，让 AI 从光标所在位置续写。 （extra: 这里有个问题，如果忘记保存文件了，会修改文件失败）。

    AI 代码写的问题很多，最终还是手写了这个函数。

* 询问 AI: `@Builder 在 #file:service.test.ts basic 位置添加单测，测试 #file:codeParser.ts 的 extractCodeToken 函数。`

    AI 正确生成了单测。

* 询问 AI: `@Builder 续写光标位置单测，测试 extractCodeToken，偏移量设置为 tsCode 中几个 hello 后面。`

    ![image](/image/trae-ai-agent-ut-gen.png)

    AI 生成的单测正确的单测框架，但是断言有问题，需要手动修复。

代码详见： [feat(代码解析): 添加基于 PrismJS 的代码解析功能](https://github.com/rectcircle/string-converter-vsc-ext/commit/967eb8f6db3764b69615695b7b93cfa7dd068cd2)。

#### QuickAction 接入上述实现

* 询问 AI: `@Builder 修改该 provideCodeActions 实现，调用 extractCodeTokens 然后将每一个 token 转换为一个 action 并返回，action 的标题为 token 的 text。`

    问题: 在输入框输入了很多内容，点击新建会话，输入的内容会丢失。

    AI 基本实现了需求，但是有一些问题。

* 询问 AI: `@Builder extractCodeTokens 调用传递的 position 和 endPosition 有问题，需要将 vscode 的 selection 转换为偏移量。`

    AI 实现了需求。

* 手动删除一些无用代码。
* `F5` Debug，验证，并修正一些小问题。让 AI 生成提交消息，并提交代码到 git。

代码详见： [refactor(handler): 重构字符串处理逻辑以使用新的代码解析器](https://github.com/rectcircle/string-converter-vsc-ext/commit/5cca60d1b7631f2cf84f64fff3896cf9f02c0fbc)。

#### 根据 token 上下文推测 unknown 类型 （低优）

### 解析原始字符串字面量

> 根据编程语言，将 string、 template-string 等类型的 OriginText 解析成 Text （去除转义等）。

* 询问 AI: `@Builder 设计并实现一套面向不同编程语言的字符串解析机制，输入是 originText、 type、 和 languageId，输出是 text。如果类型不是字符串直接返回 originText。这套机制具有可扩展，每个编程语言都有自己的实现，新增一个编程语言时仅需添加一个文件，并在 index.ts 注册即可。代码在 service 里面新建一个 literalParser 实现包含 index.ts 和 各个编程语言的实现。先实现 typescript/javascript 的解析。`

    AI 目录结构和代码框架实现的较好。

    但是具体的 typescript 解析，仅仅去除引号，没有处理转义字符。

    另外，代码依赖上层的 TokenInfo 类型定义。

* 询问 AI: `@Builder 不要依赖 TokenInfo 类型定义。`

    AI 完美的解决了这个问题。

* 询问 AI: `@Builder 重写： 根据 javascript 字符串、模板字符串语法规范解析字符串，关注性能，不要用查找替换，小心关注各种边界 case。`

    AI 使用了循环逐个字符串处理。但是总是有一些 bug。最终还是手写帮 AI 修 bug。

* 询问 AI: `@Builder 给 #file:src/service/literalParser/typescript.ts 在 #file:src/web/test/suite/service/literalParser/typescript.test.ts 中生成单测，所有分支都要覆盖到。`

    AI 生成了很好的单测。并测试出了手写的 bug。

* 询问 AI: `@Builder 给 #file:src/service/literalParser/index.ts parseLiteral 添加单测`

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

    打开 src/service/codeParser.ts 文件。

    AI 最终按照要求完成了修改，但是又忘记了了导入。

* 询问 AI: `@Builder 根据 typescript.test.ts 在 testdata/main.ts 中添加更多测试代码`

   最终 AI 生成更多的人工测试 case。

* `F5` Debug，人工验证，无问题。让 AI 生成提交消息，并提交代码到 git。

代码详见： [feat: 添加字面量解析器及相关测试](https://github.com/rectcircle/string-converter-vsc-ext/commit/ae860ec43e3dbe07dad92b0aa8ac1948e28e0546)。

### 实现可扩展机制来识别字符串类型

> 优先实现识别 jwt、时间戳、base64、url、json、yaml。
