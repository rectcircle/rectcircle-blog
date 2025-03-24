---
title: "开源 AI 编程工具（一） Continue"
date: 2025-03-24T12:45:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> [官网](https://www.continue.dev/) | [VSCode 扩展](https://marketplace.visualstudio.com/items?itemName=Continue.continue) | [github](https://github.com/continuedev/continue)

## 简介

Continue 是一个开源的 AI 编程工具，以 IDE 插件形式提供给用户，支持 VSCode 和 Jetbrains 系列 IDE。

Continue 的 Slogan 是：“Amplified developers, AI-enhanced development” （赋能开发者，AI 增强开发）。

因此，Continue 是一个利用大模型提升开发者效率的工具（对应自动驾驶 L1、L2），而不是让 AI 自动化的完全替代开发者（对应自动驾驶 L3、L4、L5）。

Continue 是开源的，且不和某个大模型绑定，而是支持和主流的大模型提供商（如 OpenAI、anthropic、Mistral、OpenRouter、SiliconFlow 等）。

Continue 提供了如下能力：

* Chat - 询问大模型各种编程开发问题，可携带各种项目上下文。
* Autocomplete - 利用大模型的 FIM completion 能力（关于 FIM completion，可以参考 [What is FIM and why does it matter in LLM-based AI](https://medium.com/@SymeCloud/what-is-fim-and-why-does-it-matter-in-llm-based-ai-53f33385585b)），提供代码自动补全。
* Edit - 提供需要编辑的文件列表，并给大模型代码编辑需求，大模型自动生成代码。
* Actions - 一些常用操作。如在 Chat 和 Edit 通过 `/` 附加上下文。在编辑器右键选择一些常用的操作等。

本文基于 VSCode 1.0.2 (2025.03.04) 版本，将介绍如何配置云上的免费大模型，使用 Continue 的上述功能。

注意，目前 Continue 仍在高速迭代，后续版本可能会有所变化，本文仅做参考，请以事实为准。

## 安装

VSCode 插件市场搜索 `Continue`，点击安装 [`Continue - Codestral, Claude, and more`](https://marketplace.visualstudio.com/items?itemName=Continue.continue)。

安装完成后，建议将 Continue 侧边连拖拽到编辑器右侧，以方便使用。

![image](/image/continue-move-to-right-sidebar.gif)

## 配置免费模型

Continue 有两种使用方式：

1. 登录 Continue 官方账号登录，使用官方提供的模型，创建或添加助手。这种方式免费额度有限，超过限制需要付费。
2. 通过本地配置，配置使用模型提供商。支持 OpenAI, Open Router, Anthropic, siliconflow (硅基流动) 等云上 API 提供商，还对接支持 Ollama, llama.cpp 这种本地部署的大模型。

本文介绍第二种方式，如何通过本地配置，配置使用云上模型提供商的免费模型。

配置方式：
1. 打开 Continue 侧边栏，点击齿轮图标，打开设置。
2. 选择 `Configuration` 下面的 `Local Config`，点击 `Open Config File`，打开 JSON 配置文件，位于 `~/.continue/config.json`。
    * 在 `models` 字段中添加 Chat、 Edit 和 Actions 功能可使用的模型。该字段是个数组可以配置多个。
    * 在 `tabAutocompleteModel` 字段中配置，自动完成功能使用的模型（自动完成的模型依赖大模型以及其 API 支持 FIM completion）。

### mistral （自动完成）

对于自动完成，[官方推荐](https://docs.continue.dev/autocomplete/model-setup) Mistral 的 [Codestral 模型](https://mistral.ai/news/codestral-2501)。目前 （25-03-05），Codestral 模型的个人使用仍然是免费的，本小结将介绍如何申请和配置使用 Codestral 模型实现 Continue 的自动完成功能。

1. 申请 API Key。打开 https://mistral.ai/，点击 `Sign Up`，注册一个账号，注册完成后，点击 `Sign In`，登录账号，登录完成后。[点此](https://console.mistral.ai/codestral)打开控制台的 Codestral 配置页，点击申请早期使用按钮后，即可免费申请一个 API key，复制 API key。
2. 配置 `~/.continue/config.json` 文件的 `tabAutocompleteModel`，字段，其中 `apiKey` 替换为第一步获取到的 API key：

    ```json
    {
        "tabAutocompleteModel": {
            "title": "Codestral",
            "provider": "mistral",
            "model": "codestral-latest",
            "apiKey": "xxx",
            "apiBase": "https://codestral.mistral.ai/v1",
        }
    }
    ```

注意：codestral 模型的 apiBase 是特殊的，如果使用 mistral 的其他模型，无需配置 apiBase。详见： [continue 官方文档](https://docs.continue.dev/customize/model-providers/mistral)。

配置完成后，在 VSCode 任意编辑器中编写代码，Continue 将在光标处进行自动完成，按 Tab 键即可接收自动完成的代码。

### openrouter

openrouter 是一个大模型 API 中间商，支持多个大模型提供商，可以使用一个 API Key 和统一的 API 调用多个大模型，支持业界主流的开源和闭源大模型。该平台还提供了几十个免费的大模型，可以直接使用。

1. 访问 [openrouter](https://openrouter.ai/) 官网，注册一个账号，获取 API Key。
2. 打开 [模型页](https://openrouter.ai/models)，搜索 free，选择模型，如 [DeepSeek R1](https://openrouter.ai/deepseek/deepseek-r1:free)，复制标题下方的模型 ID，如 `deepseek/deepseek-r1:free`。
3. 配置 `~/.continue/config.json` 文件，在 `models` 数组中添加以下配置，其中 `apiKey` 替换为第一步获取到的 API key：

    ```
    {
      "title": "[openrouter] DeepSeek: R1 (free)",
      "provider": "openrouter",
      "model": "deepseek/deepseek-r1:free",
      "apiKey": "xxx"
    },
    ```

配置完成后，Continue Chat 页面即可选择 `[openrouter] DeepSeek: R1 (free)` 模型，进行交互。

### siliconflow (硅基流动)

siliconflow 和 openrouter 类似，也是一个大模型 API 中间商，中国大陆的的公司，主要提供国产模型，也提供了一些免费模型，可以直接使用。

1. 访问 [siliconflow](https://siliconflow.cn/zh-cn/) 官网，注册一个账号，获取 API Key。
2. 打开 [模型页](https://cloud.siliconflow.cn/models)，选择左侧价格免费选项，选择模型，如 [DeepSeek-R1-Distill-Qwen-7B (Free)](https://cloud.siliconflow.cn/models?target=deepseek-ai/DeepSeek-R1-Distill-Qwen-7B)，复制标题模型 ID，如 `deepseek-ai/DeepSeek-R1-Distill-Qwen-7B`。
3. 配置 `~/.continue/config.json` 文件，在 `models` 数组中添加以下配置，其中 `apiKey` 替换为第一步获取到的 API key：

    ```
    {
      "title": "[siliconflow] DeepSeek-R1-Distill-Qwen-7B (Free)",
      "provider": "siliconflow",
      "model": "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
      "apiKey": "xxx"
    }
    ```

配置完成后，Continue Chat 页面即可选择 `[siliconflow] DeepSeek-R1-Distill-Qwen-7B (Free)` 模型，进行交互。

## 功能

### Chat

* 如下几种方式打开 Chat 方式：
    * 打开 VSCode 侧边栏，点击 continue 图标，点击加号。
    * `cmd+l` 快捷键（可选中代码将代码上下文发送给模型）。
    * 选中代码，右键 -> continue -> Add Highlighted Code to Chat （`cmd+shift+l`）。
* 在输入框中输入问题，按回车即可发送问题给模型，获取大模型的回答。
* 除了文字之外，还可以通过 `@` 提供上下文给模型。
    * `@File` 选择某个文件，将文件作为上下文送给模型。
    * `@Codebase` 对代码库构建索引，并根据输入内容，查询索引，并将这些上下文发送给模型，原理详见：[官方文档 - @Codebase](https://docs.continue.dev/customize/deep-dives/codebase)。
    * `@Code` 将某个代码符号（函数、类、变量等）作为上下文发送给模型。
    * `@Git Diff` 将当前文件的 git diff 信息作为上下文发送给模型（如： `根据 @Git Diff 生成当前变更的变更内容总结，尽量简短，一句话总结。`）。
    * `@Terminal` 将最后一个终端命令作为上下文发送给模型。
    * `@Problems` 将当前文件的问题（如 eslint 等）作为上下文发送给模型。
    * `@Folder` 使用与 `@CodeBase` 相同的检索机制，但仅在一个文件夹中进行。
    * 更多详见： [官方文档 - Context providers](https://docs.continue.dev/customize/context-providers)。

注意：需配置模型，详见 [配置免费模型章节](#配置免费模型)。

### 自动完成

在编辑器中输入任何字符都会触发自动完成，按 Tab 可接受，按 Esc 可取消。按 `ctrl + →` 可部分接受。

注意：自动完成，基于大模型的 FIM 能力，需配置支持 FIM 的模型模型，详见 [mistral （自动完成）](#mistral-自动完成)。

### Edit

* 如下几种方式打开 Eidt 模式：
    * 在编辑器中按 `cmd+i`。
* 在 Edit 模式，输入要求，按回车，即可生成代码，并将 diff 展示到编辑器中。
    * 按 `cmd+opt+y` 即可接受单个变更，按 `cmd+opt+n` 可取消单个变更。
    * 按 `cmd+shift+回车` 即可接受所有变更，按 `cmd+shift+退格` 可取消所有变更。

注意：需配置模型，详见 [配置免费模型章节](#配置免费模型)。

### Actions

* 斜线命令，在 Chat 模式下，输入 `/` 可触发，实现下来，在自定义模型下，仅 `/cmd` 命令基本可用：
    * 内建斜线命令，详见： [官方文档 - Slash commands](https://docs.continue.dev/customize/slash-commands)。
    * 通过提示词文件自定义斜线命令，详见： [官方文档](https://docs.continue.dev/customize/deep-dives/prompt-files)
* VSCode 特定的 Actions 集成。
    * Quick actions：通过 VSCode 命令 `continue.enableQuickActions` 启用。
    * 右击上下文菜单： 选中代码，右击，选择 `Continue`，即可看到常用的动作（注意：需使用 anthropic 模型）。
    * Debug action：输入 `cmd+shift+r`，即可将终端最后一个命令和输出发送到 Chat。
    * Quick fixes：在代码出现问题的地方（波浪线），可以选择 `Ask Continue` 来获取帮助。

### MCP 工具支持

需使用 anthropic 模型，本文不多介绍。
