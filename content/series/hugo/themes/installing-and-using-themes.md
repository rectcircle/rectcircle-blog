---
title: "安装并使用主题"
date: 2019-04-30T19:28:44+08:00
draft: false
toc: true
weight: 10
summary: 通过CLI轻松安装和使用Hugo主题网站中展示中的主题。
---

Hugo目前没有附带“默认”主题。这个决定是故意的。我们由您决定哪个主题最适合您的Hugo项目。

## 假设

* 您已在开发计算机上[安装Hugo](../../getting-started/installing)
* 您已在计算机上安装了git，并且熟悉基本的git用法

## 安装所有主题

您可以通过在工作目录中克隆GitHub上的整个Hugo Theme存储库来安装所有可用的Hugo主题。根据您的互联网连接，所有主题的下载可能需要一段时间。

```bash
git clone --depth 1 --recursive https://github.com/gohugoio/hugoThemes.git themes
```

在你使用主题之前，请删除主题目录根目录下的`.git`目录。如果不，使用git部署将报错

## 安装单个主题

cd 到themes目录下载指定主题

```bash
cd themes
git clone URL_TO_THEME
```

以下示例显示如何使用“Hyde”主题，其主题源位于https://github.com/spf13/hyde：

```bash
cd themes
git clone https://github.com/spf13/hyde
```

或者，您可以将主题下载为.zip文件，解压缩主题内容，然后将解压缩的源移动到主题目录中。

> 始终查看主题附带的README.md文件。通常，这些文件包含主题设置所需的进一步说明；例如，从示例配置文件复制值。

## 主题放置

请确保您已在 `/themes` 目录中安装了要使用的主题。这是Hugo使用的默认目录。Hugo具有通过您的站点配置中的 `themesDir` 变量更改主题目录的功能，但不建议这样做。

## 使用主题

Hugo首先应用已确定的主题，然后应用本地目录中的任何内容。这样可以更轻松地进行自定义，同时保持与主题上游版本的兼容性。要了解更多信息，请转到 [自定义主题](../customizing/)。

### 命令行

在Hugo网站上使用主题有两种不同的方法：通过Hugo CLI或作为[站点配置文件](../../getting-started/configuration/)的一部分。

要通过Hugo CLI更改主题，您可以在构建站点时传递-t标志：

```bash
hugo -t themename
```

可能，您需要在运行Hugo本地服务器时添加主题，特别是如果您要自定义主题：

```bash
hugo server -t themename
```

### `config` 文件

如果您已经确定了网站的主题并且不想使用命令行，则可以将主题直接添加到站点配置文件中：

```toml
theme: themename
```

> 上面示例中的`themename`必须与`/themes`中的特定主题目录的名称相匹配；即目录名称，而不是主题展示站点中显示的主题名称。
