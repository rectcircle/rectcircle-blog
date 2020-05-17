---
title: "核心机制"
date: 2020-04-11T14:50:50+08:00
draft: true
toc: true
comments: true
weight: 200
summary: 本文将阐述 VSCode 的一些技术细节，理解 VSCode 的工作原理
---

> 参考文章
>
> * [从 VSCode 看大型 IDE 技术架构](https://zhuanlan.zhihu.com/p/96041706)
> * [VSCode技术揭秘](https://codeteenager.github.io/vscode-analysis/)

## 基本情况

### 代码仓库

https://github.com/microsoft/vscode

### 技术栈

* 采用了 基于 Chromium 的 [Electron](https://www.electronjs.org/) 框架（JavaScript，HTML 和 CSS 构建跨平台的桌面应用程序）
* 编程语言上采用微软自家的 [TypeScript](https://www.typescriptlang.org/) （JavaScript 的超集，有类型，与JavaScript互操作兼容）
* 编辑器UI上采用 [Monaco](https://microsoft.github.io/monaco-editor/)

### 定位

位于 IDE 和 轻量级编辑器之间。更加偏向 编辑器 一侧。其核心是 编辑器 + 代码理解 + 调试。围绕这个关键路径做深做透，其他东西非常克制，产品保持轻量与高性能。

### 进程架构

![进程架构图](https://img.geek-docs.com/vscode/plugin-dev/plugin-dev-overview-1.png)

多进程架构。（可以通过帮助菜单 -> 打开进程管理器 查看，可以看到进程的父子关系等信息）

* 主进程：VSCode 的入口进程，负责一些类似窗口管理、进程间通信、自动更新等全局任务
* 渲染进程：负责一个 Web 页面的渲染
* 扩展宿主进程：扩展运行在 独立的扩展宿主进程中，不允许访问 UI
* Debug 进程：Debugger 相比普通扩展做了特殊化
* Search 进程：搜索是一类计算密集型的任务，单开进程保证软件整体体验与性能

VSCode 采用松散的架构，模块间的耦合很小。

## 扩展机制

* 扩展API 相对克制，仅暴露核心 API，不暴露编辑器 DOM UI，提供有限的 UI 组件API，这样做的好处
    * 对于扩展来说基本够用
    * 对于VSCode内核来说可以从容重构，不会太多受到扩展API的牵制
    * 对于用户来说，始终有统一的UI交互风格，降低心智成本
* 扩展与 编辑器 核心强隔离，耦合程度小，扩展运行在对立的扩展进程中，扩展API与内核通信的通过RPC服务进行
    * 保持编辑器的性能不受 扩展的影响
    * 为 Remote Develop 打下基础
* 不同编程语言的支持，通过语言服务器协议（LSP）实现，扩展和语言服务器之间通过 `JSON PRC` 进行通信
    * 更好的复用其他语言开发的相关工具
    * 保持开放，使一个语言服务器可以支持多种编辑器/开发环境

![lsp](https://code.visualstudio.com/assets/api/language-extensions/language-server-extension-guide/lsp-languages-editors.png)
