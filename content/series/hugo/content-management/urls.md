---
title: "URL 管理"
date: 2019-05-01T16:46:35+08:00
draft: false
toc: true
weight: 150
summary: Hugo支持永久链接，别名，链接规范化以及处理相对URL和绝对URL等多个选择。
---

## 固定链接

您构建的网站的默认Hugo输出目录是 `public/`。但是，您可以通过在 [站点配置](../../getting-started/configuration) 中指定其他`publishDir`来更改此值。在构建时为节创建的目录反映了内容文件夹中内容目录的位置以及与contentdir层次结构中的布局匹配的命名空间。

[站点配置](../../getting-started/configuration) 中的 `permalinks` 选项允许您基于每个部分调整目录路径（即URL）。这将更改文件写入的位置，并将更改页面的内部“规范”位置，以便对 `.RelPermalink` 的模板引用将遵循由此选项中的映射所做的调整。

> 这些示例使用`publishDir`和`contentDir`的默认值；即，分别是 `public` 和 `content`。您可以覆盖 [站点配置文件](../../getting-started/configuration) 中的默认值。

例如，如果您的某个 `sections` 被称为帖子，并且您希望根据年份，月份和帖子标题将规范路径调整为分层，则可以分别在YAML和TOML中设置以下配置。

### 永久链接配置示例

```toml
[permalinks]
  posts = "/:year/:month/:title/"
```

只有 `posts/` 下的内容才会有新的URL结构。例如，文件内容 `/posts/ sample-entry.md` 中 front matter 的`data`为：`2017-02-27T19:20:00-05:00`，则这个内容在构建中将渲染到 `public/2017/02/ sample-entry/index.html` 中，因此可以通过`https://example.com/2017/02/sample-entry/`访问。

您还可以使用相同的语法配置按照分类来配置的永久链接来取代默认的section，您可能只想使用配置值 `:slug` 或 `:title`。

### 永久链接配置值

以下是可在站点配置文件中的`permalink`定义中使用的值列表。所有对时间的引用都取决于内容的日期。

`:year`
: 4位年

`:month`
: 2位月

`:monthname`
: 英文月

`:day`
: 2位天

`:weekday`
: 1位周 (Sunday = 0)

`:weekdayname`
: 英文周

`:yearday`
: 1到3位，今年中的第几天

`:section`
: 所在目录

`:sections`
: content到文件所有层次的目录

`:title`
: 内容标题

`:slug`
: 内容的slug

`:filename`
: 文件名不带扩展名

## 别名

别名可用于从其他URL创建重定向到您的页面。别名有两种形式：

* 以`/`开头，表示相对于`BaseURL`，例如 `/posts/my-blogpost/`
* 相对路径，相对于这个Page，例如`../blog/my-blogpost`  Hugo 0.55 新增

### 别名的例子

假设您在 `content/posts/my-awesome-blog-post.md` 中创建了一段新内容。该内容是您在 `previous/posts/my-original-url.md` 上发布的上一篇文章的修订版。您可以在新 `my-awesome-blog-post.md` 的 front matter 中创建别名字段，您可以在其中添加以前的路径。以下示例分别显示如何在TOML和YAML前端内容中创建此字段。

```md
+++
aliases = [
    "/posts/my-original-url/",
    "/2010/01/01/even-earlier-url.html"
]
+++
```

```md
---
aliases:
    - /posts/my-original-url/
    - /2010/01/01/even-earlier-url.html
---
```

现在，当您访问别名中指定的任何位置时，即假设相同的站点域 —— 您将被重定向到指定的页面。例如，`example.com/posts/my-original-url/` 的访问者将立即重定向到`example.com/posts/my-awesome-post/`。

### 多语言中的别名的例子

在 [多语言网站](../multilingual/) 上，帖子的每个翻译都可以有唯一的别名。要在多种语言中使用相同的别名，请在其前面加上语言代码。在`/posts/my-new-post.es.md`中：

在`/posts/my-new-post.es.md`中：

```md
---
aliases:
    - /es/posts/my-original-post/
---
```

从Hugo 0.55其，你也可以有页面相对别名，所以`/es/posts/my-original-post/`可以简化为更便携的 `my-original-post/`

## Hugo别名如何运作

指定别名时，Hugo会创建一个与别名条目匹配的目录。在目录中，Hugo创建了一个.html文件，指定页面的规范URL和新的重定向目标。

例如，`posts/my-intended-url.md` 中的内容文件，front matter有以下内容：

```md
---
title: My New post
aliases: [/posts/my-old-url/]
---
```

假设`example.com`为baseURL，在`https://example.com/posts/my-old-url/`上找到的自动生成的别名.html的内容将包含以下内容：

```html
<!DOCTYPE html>
<html>
  <head>
    <title>https://example.com/posts/my-intended-url</title>
    <link rel="canonical" href="https://example.com/posts/my-intended-url"/>
    <meta name="robots" content="noindex">
    <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
    <meta http-equiv="refresh" content="0; url=https://example.com/posts/my-intended-url"/>
  </head>
</html>
```

`http-equiv="refresh"`是执行重定向的代码，在这种情况下为0秒。如果您网站的最终用户访问`https://example.com/posts/my-old-url`，他们现在会自动重定向到更新，更正确的网址。添加`<meta name ="robots" content ="noindex">`可让搜索引擎机器人知道他们不应抓取您的新别名页并将其编入索引。

### 自定义

您可以通过在站点的layouts文件夹中创建alias.html模板来自定义此别名页面（即`layouts/alias.html`）。在这种情况下，传递给模板的数据是：

Permalink
: 指向别名的页面的链接

Page
: 该别名指向的页面的数据

### 别名的重要行为

* hugo对别名没有任何假设。它们也不会根据您的UglyURL设置进行更改。您需要提供Web根目录的完整路径以及完整的文件名或目录。
* 别名在渲染任何其他内容之前渲染，因此将被具有相同位置的任何内容覆盖。
