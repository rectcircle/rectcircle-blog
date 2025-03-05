---
title: "开源 AI 编程工具（一） Continue"
date: 2025-03-01T15:00:00+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

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

本文基于 VSCode 1.0.2 (2025.03.04) 版本进行介绍。目前 Continue 仍在高速迭代，后续版本可能会有所变化，请以官方为准。

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

### mistral

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

### siliconflow (硅基流动)

## 免费模型简单测评

建立 websocket 连接，如果参数有问题，upgrade 请求，服务端将返回 4xx， body {"code": 非零, "msg": "xxx"}。使用 js 写一个在浏览器运行的封装函数，封装 websocket 的建连，如果服务端拒绝 upgrade，返回，能获取到失败的 body 中的 code 和 msg ，并通过 Error 抛出去。注意，实现上，先建立 websocket 连接，如果失败了再通过某种方式获取这个失败的 body。

## 功能

### Chat

### 自动完成

### Edit

### Actions
