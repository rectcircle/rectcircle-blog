---
title: "基本流程"
date: 2020-04-29T15:24:31+08:00
draft: false
toc: true
comments: true
weight: 300
summary: 本文介绍 VSCode 扩展开发的基本流程，如何创建、开发、调试、发布扩展
---

参考：[官方文档-快速开始](https://code.visualstudio.com/api/get-started/your-first-extension)

## 相关 context

* 运行环境：VScode 内部 Electron 依赖的 Node 版本
* 开发语言：TypeScript （官方推荐）、JavaScript 等
* 开发环境：VSCode
* 语言服务器LSP：支持任意编程语言

## 创建

VSCode 官方提供了 相关的 yo 模板，安装

```bash
# 安装模板生成器
npm install -g yo generator-code
yo code
```

## 开发调试

为了调试时启动速度，建议修改调试配置 `.vscode/launch.json`，添加 `"--disable-extensions"` 启动参数

```json
{
	"version": "0.2.0",
	"configurations": [
		{
			"name": "Run Extension",
			"type": "extensionHost",
			"request": "launch",
			"runtimeExecutable": "${execPath}",
			"args": [
				"--disable-extensions",
				"--extensionDevelopmentPath=${workspaceFolder}"
			],
			"outFiles": [
				"${workspaceFolder}/out/**/*.js"
			],
			"preLaunchTask": "${defaultBuildTask}"
        },
    ]
}
```

## 发布
