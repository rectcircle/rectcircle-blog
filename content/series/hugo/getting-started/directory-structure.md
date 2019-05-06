---
title: "目录结构"
date: 2019-04-30T14:07:51+08:00
draft: false
toc: true
weight: 40
summary: Hugo的CLI支持项目目录结构，然后获取该单个目录并将其用作创建完整网站的输入。
---

## 新网站脚手架

运行 `hugo new site` 命令 将创建一个包含以下元素的目录结构：

```tree
.
├── archetypes
├── assets
├── config
├── content
├── data
├── layouts
├── static
└── themes
```

## 目录结构解释

以下是每个目录的高级概述，其中包含指向Hugo文档中各个部分的链接

**[archetypes](/content-management/archetypes/)**

您可以使用`hugo new`命令在Hugo中创建新的内容文件。默认情况下，Hugo将创建至少包含 `data` (日期)，`title` （标题（从文件名推断））和 `draft=true` 的新内容文件。You can create your own archetypes with custom preconfigured front matter fields as well.你可以自定义front matter来创建自己的archetypes。

**[assets](https://gohugo.io/hugo-pipes/introduction/#asset-directory)**

存储Hugo Pipes需要处理的所有文件。只有使用`.Permalink`或`.RelPermalink`的文件才会发布到公共目录。

**[config](getting-started/configuration)**

Hugo附带了大量配置项。config目录是存储格式为JSON，YAML或TOML配置文件的位置。Every root setting object can stand as its own file and structured by environments。如果只需要使用一套配置，可以直接使用项目根目录的单个 `config.toml` 配置文件

许多站点可能几乎不需要任何配置，但Hugo附带了大量 [配置指令]((getting-started/configuration))，可以更详细地说明您希望Hugo如何构建您的网站。

**[content](/content-management/organization)**

您网站的所有内容都将位于此目录中。content中的所有顶级目录都被叫做 [content section](https://gohugo.io/content-management/sections/) 例如，如果您的网站有三个 content section 分别是 `content/blog`, `content/articles`, 和 `content/tutorials`。 Hugo使用sections来分配 [默认内容类型](/content-management/types/)

**[static](/content-management/static-files)**

存储所有静态内容：图像，CSS，JavaScript等。当Hugo构建您的站点时，静态目录中的所有资源都将按原样复制。使用静态文件夹的一个很好的示例是在Google Search Console上验证网站所有权，您希望Hugo在其中复制整个HTML文件而不修改其内容。

从Hugo 0.31开始，您可以拥有多个静态目录。
