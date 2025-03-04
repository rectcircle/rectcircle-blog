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
* Autocomplete - 利用大模型的 FIM completion 能力，提供代码自动补全。
* Edit - 提供需要编辑的文件列表，并给大模型代码编辑需求，大模型自动生成代码。
* Actions - 一些常用操作。如在 Chat 和 Edit 通过 `/` 附加上下文。在编辑器右键选择一些常用的操作等。

本文基于 VSCode 1.0.2 (2025.03.04) 版本进行介绍。目前 Continue 仍在高速迭代，后续版本可能会有所变化，请以官方为准。

## 安装

## 配置免费模型

### mistral

### openrouter

### siliconflow (硅基流动)

## 功能

### Chat

### 自动完成

### Edit

### Actions
