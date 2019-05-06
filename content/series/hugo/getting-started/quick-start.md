---
title: "快速入门"
date: 2019-04-30T11:43:56+08:00
draft: false
toc: true
weight: 10
summary: 使用美丽的Ananke主题创建一个Hugo网站
---

> 这个快速入门在示例中使用了macOS。有关如何在其他操作系统上安装Hugo的说明，请参阅 [安装](https://gohugo.io/getting-started/installing)

## 第1步：安装Hugo

> Homebrew是macOS的包管理器，可以通过 [brew.sh](https://brew.sh/) 安装。如果您正在运行Windows等，请参阅 [安装](https://gohugo.io/getting-started/installing)

```bash
brew install hugo
```

验证

```bash
hugo version
```

## 第2步：创建一个新网站

```bash
hugo new site quickstart
```

以上将在名为quickstart的文件夹中创建一个新的Hugo网站项目

## 第3步：添加一个主题

请参阅 [themes.gohugo.io](https://themes.gohugo.io/) 以获取要考虑的主题列表。本快速入门使用了美丽的Ananke主题。

```bash
cd quickstart

# 下载主题
git init
git submodule add https://github.com/budparr/gohugo-theme-ananke.git themes/ananke
# 非git用户请注意：
#   - 如果您没有安装git，可以从 https://github.com/budparr/gohugo-theme-ananke/archive/master.zip 下载这个主题的最新版本的压缩包
#   - 解压缩这个 .zip 文件到 "gohugo-theme-ananke-master" 目录
#   - 重命名这个目录为 "ananke" ，并移动到 "themes" 目录

# 编辑config.toml配置文件
# 并添加Ananke主题
echo 'theme = "ananke"' >> config.toml
```

## 第4步：添加一些Content

```bash
hugo new posts/my-first-post.md
```

如果需要，编辑新创建的内容文件

## 第5步：启动Hugo服务器

使用启用草稿选项启动Hugo服务

```bash
▶ hugo server -D

                   | EN
+------------------+----+
  Pages            | 10
  Paginator pages  |  0
  Non-page files   |  0
  Static files     |  3
  Processed images |  0
  Aliases          |  1
  Sitemaps         |  1
  Cleaned          |  0

Total in 11 ms
Watching for changes in /Users/bep/quickstart/{content,data,layouts,static,themes}
Watching for config changes in /Users/bep/quickstart/config.toml
Environment: "development"
Serving pages from memory
Running in Fast Render Mode. For full rebuilds on change: hugo server --disableFastRender
Web Server is available at http://localhost:1313/ (bind address 127.0.0.1)
Press Ctrl+C to stop
```

**访问你的新网站： [http://localhost:1313/](http://localhost:1313/)**

## 第6步：自定义主题

您的新网站看起来很棒，但在向公众发布之前，您需要稍微调整一下

### 网站配置

在一个文本编辑器中打开 `config.toml`

```toml
baseURL = "https://example.org/"
languageCode = "en-us"
title = "My New Hugo Site"
theme = "ananke"
```

用更个性化的东西替换上面的标题。此外，如果您已准备好域名，请设置baseURL。请注意，运行本地开发服务器时不需要此值。

> 提示：在Hugo服务器运行时对站点配置或站点中的任何其他文件进行更改，您将立即看到浏览器中的更改，但您可能需要清除缓存。

有关主题特定的配置选项，请参阅 [主题网站](https://github.com/budparr/gohugo-theme-ananke)

**有关进一步的主题自定义，请参阅 [自定义主题](https://gohugo.io/themes/customizing/)。**
