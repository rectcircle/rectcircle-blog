---
title: "优质扩展总览"
date: 2020-04-11T14:50:53+08:00
draft: true
toc: true
comments: true
weight: 400
summary: 本文将列出个人在coding过程中使用过的比较优质的扩展列表，这些扩展的详细介绍，可以参考 《优质扩展》章节
---

## 约定

### 推荐等级

* 必备：如果从事该类别的工作，该扩展应该是必备扩展，使用该扩展可以极大的提高效率
* 推荐：建议安装，锦上添花，不适用也不影响效率
* 知悉：告知存在此类扩展，使用与否视情况而定

<!-- ### 分类原则

* 当某个扩展专为某个编程语言或者某类开发设计，则该扩展将直接划分到其类别
* 当某个扩展属于特殊功能组，则将该功能组提升到顶级分类中，比如【远程开发】
* 不属于以上两类的且属于通用工具的，划分在【通用】类别
* 不属于以上类别的，划分在【其他】类别 -->

## 远程开发

远程开发是 VSCode 最重大的特性，是其最具有竞争力的地方。因此，在推荐列表的第一部分，详细参见： [优质扩展/远程开发](/series/vscode/good-extensions/remote-development/)

| 扩展名                                    | 推荐级别 | 描述                                            |
| ----------------------------------------- | -------- | ----------------------------------------------- |
| Remote Development                        | 必备     | 远程开发扩展包，包含如下 4 个扩展               |
| Remote - SSH                              | 必备     | 远程开发，通过 SSH 隧道连接（同时包含如下扩展） |
| Remote - SSH: Editing Configuration Files | 必备     | 编辑 SSH Config 文件                            |
| Remote - Containers                       | 必备     | 远程开发，通过暴露端口和挂载实现                |
| Remote - WSL                              | 必备     | 远程开发，通过暴露端口和挂载实现                |
| Visual Studio Online                      | 知悉     | 远程开发                                        |

## 语言包与翻译

VSCode 的国际化支持是通过语言包扩展实现的，同时商店中有一个辅助翻译的扩展以帮助大家阅读英文注释和变量命名的含义

| 扩展名                                                                                                                                                  | 推荐级别 | 描述                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------- |
| [Chinese (Simplified) Language Pack for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=MS-CEINTL.vscode-language-pack-zh-hans) | 必备     | 简体中文语言包         |
| [Comment Translate](https://marketplace.visualstudio.com/items?itemName=intellsmi.comment-translate)                                                    | 必备     | 国人开发的辅助翻译工具 |

说明

* 更多语言包参见 [扩展商店](https://marketplace.visualstudio.com/search?target=VSCode&category=Extension%20Packs&sortBy=Installs)
* 语言切换方式 `>configure display language`
* Comment Translate 的使用方式：鼠标选中需要翻译的文本上，针对注释，直接放置在注释上即可
    * 命令前缀 `>Comment Translate:`
    * 快速选择 目标语言，点击状态栏的地球图标

## 来自其他编辑器

如果真心想将 VSCode 作为开发主力，建议还是接受 VSCode 的快捷键逻辑；针对部分是在用惯的快捷键，可以通过 快捷键配置 来进行 自定义。最好不要使用如下扩展，全部映射。

| 扩展名                                                                                                                         | 推荐级别 | 描述                            |
| ------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------- |
| [Vim](https://marketplace.visualstudio.com/items?itemName=vscodevim.vim)                                                       | 知悉     | VSCode 上实现大部分 vim 特性    |
| [Sublime Text Keymap and Settings Importer](https://marketplace.visualstudio.com/items?itemName=ms-vscode.sublime-keybindings) | 知悉     | VSCode Sublime 快捷键绑定       |
| [Atom Keymap](https://marketplace.visualstudio.com/items?itemName=ms-vscode.atom-keybindings)                                  | 知悉     | VSCode Atom 快捷键绑定          |
| [Eclipse Keymap](https://marketplace.visualstudio.com/items?itemName=alphabotsec.vscode-eclipse-keybindings)                   | 知悉     | VSCode Eclipse 快捷键绑定       |
| [IntelliJ IDEA Keybindings](https://marketplace.visualstudio.com/items?itemName=k--kato.intellij-idea-keybindings)             | 知悉     | VSCode IntelliJ 家族 快捷键绑定 |

更多快捷键绑定参见： [商店](https://marketplace.visualstudio.com/search?sortBy=Installs&category=Keymaps&target=VSCode)

关于 VIM 扩展的额外说明：

* 特有命令
    * `gd` 相当于vim中的`ctrl+]` 跳转到定义
    * `gb` 多光标模式，找到下一个和当前单词匹配的单词并添加光标
    * `gh` 显示当前位置的悬浮提示框
* 打通系统剪切板 配置  "vim.useSystemClipboard": true,`
* 输入法
    * [安装 `im-select`](https://github.com/daipeihust/im-select#installation)
          *MAC 安装 `curl -Ls https://raw.githubusercontent.com/daipeihust/im-select/master/install_mac.sh | sh`
    * 配置如下（中文）

```json
{
    "vim.autoSwitchInputMethod.defaultIM": "com.apple.keylayout.ABC",
    "vim.autoSwitchInputMethod.obtainIMCmd": "/usr/local/bin/im-select",
    "vim.autoSwitchInputMethod.switchIMCmd": "/usr/local/bin/im-select {im}",
    "vim.autoSwitchInputMethod.enable": true,
}
```

## 美化

详细参见： [优质扩展/美化](/series/vscode/good-extensions/beautify/)

| 扩展名                   | 推荐级别 | 描述     |
| ------------------------ | -------- | -------- |
| Monokai Dark Soda        | 推荐     | 颜色主题 |
| Night Owl                | 推荐     | 颜色主题 |
| One Dark Pro             | 推荐     | 颜色主题 |
| One Monokai Theme        | 推荐     | 颜色主题 |
| Material Icon Theme      | 推荐     | 图标主题 |
| vscode-icons             | 推荐     | 图标主题 |
| Material Theme Icons     | 推荐     | 图标主题 |
| Better Comments          | 必备     | 注释美化 |
| Bracket Pair Colorizer 2 | 必备     | 括号美化 |

## Git/CI&CD/Devops

* Git Extension Pack
* Git Graph
* Travis CI Status
* GitHub Pull Requests
* GitHub Issues
* Salesforce CLI Integration

## 通用

* Bookmarks
* Code Runner
* Code Spell Checker
* Comment Translate
* EditorConfig for VS Code
* i18n Ally
* LeetCode
* New File by Type
* Open in GitHub, Bitbucket, Gitlab, VisualStudio.com !
* Path Intellisense
* Project Manager
* REST Client
* SonarLint
* Settings Sync
* TabNine
* TODO Highlight
* Todo Tree
* Visual Studio IntelliCode
* CodeQL
* Reference Search View
* Archiver
* Zip Preview

## SQL

* SQLTools - Database tools
* PostgreSQL

## 协作

* CodeTour
* CodeStream
* Live Share
* Live Share Audio

## 容器/云厂商

* Azure Account
* Cloudfoundry Manifest YML Support
* Concourse CI Pipeline Editor
* Kubernetes
* Docker Extension Pack
* Spark & Hive Tools
* Docker Explorer
* Azure Virtual Machines
* Azure CLI Tools

## Web前端开发&NodeJS

* Debugger for Chrome
* ESLint
* JavaScript Booster
* npm
* npm Intellisense
* open in browser
* TSLint
* yo
* Node Debug

## C/C++

* C/C++

## Java

* Java P3C Checker
* Java Properties
* Java Extension Pack
* Language Support for Java(TM) by Red Hat
* Lombok Annotations Support for VS Code
* Checkstyle for Java
* Debugger for Java
* Java Decompiler
* Java Dependency Viewer
* Java Extension Pack
* Java Test Runner
* Jetty for Java
* Maven for Java
* Spring Boot Dashboard
* Spring Boot Extension Pack
* Spring Boot Tools
* Spring Initializr Java Support
* Tomcat for Java

## Python

* MagicPython
* Python

## Rust

* CodeLLDB
* Rust (rls)
* rust-analyzer
* crates
* Rust Test Explorer

## Go

* Go

## Dart&Flutter

* Dart
* Flutter

## 文档&绘图&数据

* Excel Viewer
* Data Preview
* PlantUML
* Markdown Extension Pack
* Markdown All in One
* Markdown Emoji
* Markdown PDF
* Markdown Preview Enhanced
* Markdown TOC
* Markdown+Math
* markdownlint

## Scala

* Scala Syntax (official)
* Dotty Language Server
* Scala (Metals)
* Scala (sbt)
* Scala Language Server

## Shell

| 扩展名              | 推荐级别 | 描述                                                                   |
| ------------------- | -------- | ---------------------------------------------------------------------- |
| BASH Extension Pack | 必备     | BASH 优质扩展全家桶                                                    |
| Bash Debug          | 必备     | Bash Debug 工具 https://itnext.io/upgrading-bash-on-macos-7138bd1066ba |
| Bash IDE            | 必备     | Bash 语言服务器                                                        |

* Shebang Snippets
* shell-format
* shellcheck
* shellman

## 其他语言配置文件支持

| 扩展名                        | 推荐级别 | 描述                                                               |
| ----------------------------- | -------- | ------------------------------------------------------------------ |
| ANTLR4 grammar syntax support | 必备     | ANTLR4 语言服务器。语法描述文件高亮、智能提示、可视化、CLI工具封装 |

* Better TOML
* FreeMarker
* SSH Tooling
* systemd-unit-file
* Thrift
* vscode-proto3
* XML
* XML Tools
* YAML
* DotENV
* LaTeX Workshop
* SVG Viewer
* Output Colorizer
