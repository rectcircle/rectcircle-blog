---
title: "创建一个主题"
date: 2019-04-30T20:07:29+08:00
draft: false
toc: true
weight: 30
summary: hugo new theme 命令将为您提供一个新主题的脚手架，以帮助您顺利前进。
---

> 如果您正在创建一个主题，并计划在Hugo主题网站上分享，请注意以下事项：
>
> * 如果使用内联样式，则需要使用绝对URL，以便正确提供链接资产，例如：`<div style ="background：url（'{{"images/background.jpg"| absURL}}'）">`
> * 确保不要在URL的开头使用正斜杠`/`因为它将指向主机根。您的主题演示将在Hugo网站的子目录中提供，在这种情况下，Hugo将不会为主题资产生成正确的URL
> * 如果使用CDN中的外部CSS和JS，请确保通过https加载这些资产。请不要在主题模板中使用相对协议URL。

Hugo可以使用`hugo new`命令在现有主题中初始化一个新的空白主题目录：

```bash
hugo new theme [name]
```

## 主题文件夹

主题组件可以提供以下一个或多个标准Hugo文件夹中的文件：

`layouts`
: 用于在Hugo中呈现内容的模板。另请 [参阅模板查找顺序](https://gohugo.io/templates/lookup-order/)。

`static`
: 静态文件例如：logos、CSS、JavaScript

`i18n`
: 语言包

`data`
: 数据文件

`archetypes`
: `hugo new` 中使用的内容模板

## 主题配置文件

主题组件还可以提供其自己的配置文件，例如，config.toml。可以在主题组件中配置的内容有一些限制，并且无法覆盖项目中的设置。

可以设置的内容如下

* `params`（全局和每种语言）
* `menu`（全局和每种语言）
* `outputformats` and `mediatypes`

## 主题描述文件

除了配置文件之外，主题还可以提供描述主题，作者和原点等的theme.toml文件。请参阅 [将您的Hugo主题添加到Showcase](https://gohugo.io/contribute/themes/)

> [.Hugo.Generator](https://gohugo.io/variables/hugo/) 标签包含在[Hugo Themes Showcase](http://themes.gohugo.io/) 中的所有主题中。我们要求您在Hugo创建的所有网站和主题中包含生成器标签，以帮助核心团队跟踪Hugo的使用情况和受欢迎程度。
