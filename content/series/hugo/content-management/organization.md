---
title: "内容组织"
date: 2019-05-01T01:13:42+08:00
draft: false
toc: true
weight: 10
summary: Hugo基于 内容的组织方式（content目录结构）和网站的呈现方式结构一致 的 假设
---

## Page Bundles

自Hugo 0.32开始，界面和其他资源都会打包到Page Bundles

[页面资源](../page-resources/) 和 [图像处理](../image-processing/) 和本节内容是相关的，阅读这些内容可以得到完整的理解

{{< figure src="../1-featured-content-bundles.png" alt="Hello Friend" position="center" caption="该图显示了3个Bundles。请注意，主页Bundles不能包含其他内容页，但允许包含其他内容（图像等），如果包含了其他内容页，在主页中拿不到相关参数" captionPosition="center">}}

更多参见 [Page Bundles](../page-bundles/)

## 内容的组织

在Hugo中，您的内容应以反映所呈现网站的方式进行组织。

虽然Hugo支持嵌套在任何级别的内容，但顶级（即 `content/<DIRECTORIES>`）在Hugo中是特殊的，并且被认为是用于确定布局等的内容类型。要阅读有关部分的更多信息，包括如何嵌套它们，请参阅 [section](../sections/)。

没有任何其他配置，以下也能工作：

```tree
.
└── content
    └── about
    |   └── _index.md  // <- https://example.com/about/
    ├── posts
    |   ├── firstpost.md   // <- https://example.com/posts/firstpost/
    |   ├── happy
    |   |   └── ness.md  // <- https://example.com/posts/happy/ness/
    |   └── secondpost.md  // <- https://example.com/posts/secondpost/
    └── quote
        ├── first.md       // <- https://example.com/quote/first/
        └── second.md      // <- https://example.com/quote/second/
```

## Hugo中路径分析

下面演示了Hugo网站呈现时内容组织与输出URL结构之间的关系。这些示例假设您使用的是 `pretty URLs`(https://gohugo.io/content-management/urls/#pretty-urls) ，这是Hugo的默认行为。这些示例还假设您 [站点的配置文件](../../getting-started/configuration/) 中存在 `baseurl ="https://example.com"` 键值。

### 索引页面：`_index.md`

`_index.md`在hugo中扮演着特殊的角色。它允许您将 front matter 和内容添加到 list 模板中。list 模板 又包括 [section templates](https://gohugo.io/templates/section-templates/), [taxonomy templates](https://gohugo.io/templates/taxonomy-templates/), [taxonomy terms templates](https://gohugo.io/templates/taxonomy-templates/), [homepage template](https://gohugo.io/templates/homepage/).

> **提示**：您可以使用[`.Site.GetPage`](https://gohugo.io/functions/getpage/)函数获取`_index.md`中的内容和元数据的引用。

您可以为主页保留一个 `_index.md`，在每个content section，taxonomies 和 taxonomies 中保留一个`_index.md`。下面显示了一个`_index.md`的典型位置，该位置包含Hugo网站上 post section 页面的内容和 ront matter 内容：

```
.         url
.       ⊢--^-⊣
.        path    slug
.       ⊢--^-⊣⊢---^---⊣
.           filepath
.       ⊢------^------⊣
content/posts/_index.md
```

在构建时，这将使用关联的值输出到以下目标：

```
                     url ("/posts/")
                    ⊢-^-⊣
       baseurl      section ("posts")
⊢--------^---------⊣⊢-^-⊣
        permalink
⊢----------^-------------⊣
https://example.com/posts/index.html
```

这些部分可以根据需要嵌套。要理解的重要部分是，为了使节树完全导航，至少最下面的部分需要一个内容文件。（即`_index.md`）。

### Sections 中的单个页面

每个Section中的单个内容文件将使用single模板渲染。以下是帖子中单个帖子的示例：

```
                   path ("posts/my-first-hugo-post.md")
.       ⊢-----------^------------⊣
.      section        slug
.       ⊢-^-⊣⊢--------^----------⊣
content/posts/my-first-hugo-post.md
```

在构建时，这将使用关联的值输出到以下目标：

```

                               url ("/posts/my-first-hugo-post/")
                   ⊢------------^----------⊣
       baseurl     section     slug
⊢--------^--------⊣⊢-^--⊣⊢-------^---------⊣
                 permalink
⊢--------------------^---------------------⊣
https://example.com/posts/my-first-hugo-post/index.html
```

## 路径解释

以下概念将在构建输出网站时更深入地了解项目组织与Hugo的默认行为之间的关系。

### `section`

默认内容类型由一段内容 section 确定。section由其在 content 目录中的位置决定。section 不能在 front matter 中进行覆盖

### `slug` [^1]

内容的slug的默认值 是 `name.extension` 或 `name/` 之一，slug的值由以下规则决定

* 内容文件的名称（例如，`lollapalooza.md`）或
* 在 `front matter` 中重写

### `path`

内容的路径由该section的文件路径决定。其中文件路径指：

* 基于在 content 目录中的相对路径 并
* 排除掉slug

### `url`

url是内容的相对URL。url：

* 基于内容在目录结构中的位置 或
* 在 `front matter` 中重写

## 通过Front Matter覆盖目标路径

hugo认为，您有目的地组织您的内容。用于组织源内容的相同结构用于组织呈现的站点。如上所示，源内容的组织将在目标中进行镜像。

有时您可能需要对内容进行更多控制。在这些情况下，可以在前面的内容中指定字段以确定特定内容的目的地。

出于特定原因，此顺序中定义了以下项目：列表中进一步说明的项目将覆盖之前的项目，并且并非所有这些项目都可以在前面的事项中定义：

### `filename`

这不在front matter中，而是文件的实际名称减去扩展名。这将是目标中文件的名称（例如，`content/posts/my-post.md`变为`example.com/posts/my-post/`）

### `slug`

当在front matter定义时，slug可以取代输出的文件名。

```md
---
title: New Post
slug: "new-post"
---
```

这将根据Hugo的默认行为将渲染到如下路径：

```
example.com/posts/new-post/
```

### `section`

section由内容在磁盘上的位置决定，不能在front matter中指定。有关更多信息，请参阅 [部分](../sections/)

### `type`

内容的类型也取决于它在磁盘上的位置，但与section不同，它可以在front matter中指定。参阅 [type](../types/)。当您希望使用不同的布局呈现内容时，这可以特别方便。在下面的示例中，您可以在 `layouts/new/mylayout.html` 中创建一个布局，Hugo将使用该布局来呈现此内容，即使在许多其他帖子中也是如此。

```md
---
title: My Post
type: new
layout: mylayout
---
```

### url

可以提供完整的URL。这将覆盖所有上述内容，因为它与最终输出关联。这必须是baseURL的路径（以/开头）。url将完全按照前面提供的内容使用，并忽略站点配置中的`--uglyURLs`设置：

```md
---
title: Old URL
url: /blog/new-url/
---
```

假设您的baseURL配置为 `https://example.com` ，则在前面添加url将使`old-url.md` 渲染到如下路径：

```
https://example.com/blog/new-url/
```

您可以在 [URL管理](../urls/) 中查看有关如何控制输出路径的更多信息。

[^1]: 译者注：经测试，`.Slug`始终为空字符串，版本:`Hugo Static Site Generator v0.55.4/extended darwin/amd64 BuildDate: unknown`。`.Slug` 指的应该是Front Matter中定义的`slug`。而此处指的是逻辑上的slug
