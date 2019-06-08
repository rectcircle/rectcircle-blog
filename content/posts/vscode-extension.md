---
title: "VSCode 扩展开发指南"
date: 2019-05-14T11:32:11+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 一、快速开始

### 1、你的第一个扩展

安装脚手架工具

```bash
npm install -g yo generator-code
```

创建一个项目

```bash
yo code

# ? What type of extension do you want to create? New Extension (TypeScript)
# ? What's the name of your extension? HelloWorld
### Press <Enter> to choose default for all options below ###

# ? What's the identifier of your extension? helloworld
# ? What's the description of your extension? LEAVE BLANK
# ? Enable stricter TypeScript checking in 'tsconfig.json'? Yes
# ? Setup linting using 'tslint'? Yes
# ? Initialize a git repository? Yes
# ? Which package manager to use? npm

code ./helloworld
```

> 注意：官方推荐使用TypeScript构建一个扩展，推荐使用这种方式

按 `F5` 调试扩展
