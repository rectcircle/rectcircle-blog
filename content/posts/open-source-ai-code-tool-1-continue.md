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

## 免费模型简单测评

建立 websocket 连接，如果参数有问题，upgrade 请求，服务端将返回 4xx， body {"code": 非零, "msg": "xxx"}。使用 js 写一个在浏览器运行的封装函数，封装 websocket 的建连，如果服务端拒绝 upgrade，返回，能获取到失败的 body 中的 code 和 msg ，并通过 Error 抛出去。注意，实现上，先建立 websocket 连接，如果失败了再通过某种方式获取这个失败的 body。

## 功能

### Chat

### 自动完成

### Edit

### Actions
