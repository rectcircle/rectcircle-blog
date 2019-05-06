---
title: "Page Bundles"
date: 2019-05-01T01:41:26+08:00
draft: false
toc: true
weight: 20
summary: 使用Page Bundles组织内容
---

Page Bundles 是一种对 [页面资源](https://gohugo.io/content-management/page-resources/) 进行分组的方法

一个 Page Bundles 有两种类型：

* Leaf Bundle (叶子意味着没有孩子)
* Branch Bundle (主页、section、类别项、类别列表)

|     | Leaf Bundle | Branch Bundle |
| --- | --- | --- |
| 用法 | 单页内容和附件的集合 | section页面附件的集合 (home page, section, taxonomy terms, taxonomy list) |
| Index文件名 | `index.md` [^1] | `_index.md` [^1] |
| 允许的资源 | 页面或非页面类型 | 只允许非页面类型 |
| 资源在哪里可以使用？ | 包含leaf bundle 目录的任一目录层次 | 仅在branch bundle目录的目录级别，即包含_index.md（[ref](https://discourse.gohugo.io/t/question-about-content-folder-structure/11822/4?u=kaushalmodi)）的目录中|
| 布局类型 | `single` | `list` |
| 嵌套 | 不允许在其下嵌套更多的Bundle | 允许嵌套 leaf 或 branch bundles  |
| 例子 | `content/posts/my-post/index.md` | `content/posts/_index.md` |
| 非Index文件的内容的用途 | 仅作为页面资源访问 [^2] | 仅作为常规页面访问 [^3] |

## Leaf Bundles

Leaf Bundle是 `content/` 目录中任何层次结构的目录，只要包含index.md文件。

### Leaf Bundle 的组织方式的例子

```tree
content/
├── about
│   ├── index.md
├── posts
│   ├── my-post
│   │   ├── content1.md
│   │   ├── content2.md
│   │   ├── image1.jpg
│   │   ├── image2.png
│   │   └── index.md
│   └── my-other-post
│       └── index.md
│
└── another-section
    ├── ..
    └── not-a-leaf-bundle
        ├── ..
        └── another-leaf-bundle
            └── index.md
```

在上面的示例 `content/` 目录中，有四个leaf bundle：

about
: 位于root级别（直接位于内容目录下），并且只有index.md。

my-post
: 具有index.md，另外两个内容Markdown文件和两个图像文件。

my-other-post
: 只有index.md。

another-leaf-bundle
: 嵌套在几个目录下。该捆绑包也只有index.md。

> 创建leaf bundle的层次结构深度无关紧要，只要它不在另一个leaf bundle内

### 无头bundle

无头bundle 是一个配置为不在任何地方发布的 bundle：

* 它没有固定链接（Permalink），也不会渲染到 `public` 中
* 它不会是.Site.RegularPages等的一部分。

但你可以通过.Site.GetPage获得它。这是一个例子：

```html
{{ $headless := .Site.GetPage "/some-headless-bundle" }}
{{ $reusablePages := $headless.Resources.Match "author*" }}
<h2>Authors</h2>
{{ range $reusablePages }}
    <h3>{{ .Title }}</h3>
    {{ .Content }}
{{ end }}
```

在这个例子中，我们假设 `some-headless-bundle` 是一个 无头bundle，包含一个或多个`.Name` 与 `"author *"`页面资源。

上面例子的解释：

* 获取 `some-headless-bundle` Page `"object"`
* 使用 `.Resources.Match` 在此页面包中收集与 `"author *"` 匹配的资源片段
* 遍历该片段的嵌套页面，并输出它们的`.Title`和`.Content`

通过在Front Matter中添加以下内容（在index.md中），可以使叶子束无头：

```toml
headless = true
```

> 只有可以 Leaf Bundles 可以设置为无头

这种无头页面包很有用，比如：

* 共享媒体画廊
* 可重复使用的页面内"片段"

## Branch Bundles

分支包是 `content/` 目录中任何层次结构的任何目录，至少包含一个 `_index.md` 文件。

这个 `_index.md` 也可以直接在 `content/` 目录下。

> 这里以md（markdown）为例。您可以将任何文件类型用作内容资源，只要它是Hugo可识别的内容类型即可。

### Branch Bundle组织的示例

```tree
content/
├── branch-bundle-1
│   ├── branch-content1.md
│   ├── branch-content2.md
│   ├── image1.jpg
│   ├── image2.png
│   └── _index.md
└── branch-bundle-2
    ├── _index.md
    └── a-leaf-bundle
        └── index.md
```

在上面的示例 `content/` 目录中，有两个 Branch Bundle（和一个 Leaf Bundle）：

branch-bundle-1
: 此 Branch Bundle 具有_index.md，另外两个内容Markdown文件和两个图像文件。

branch-bundle-2
: 此 Branch Bundle 具有_index.md，内部嵌套了一个leaf bundle

> 创建Branch Bundle的层次结构深度无关紧要。

[^1]: `.md` 扩展名只是一个例子。扩展名可以是.html，.json或任何有效的MIME类型。
[^2]: 译者注：非Index的内容实际上也是可以作为普通页面资源访问的，这里的仅作为资源指的是，调用模板在处理index.md时， `.Pages` 是拿不到其他页面的，除非使用`.Resources`
[^3]: 译者注：非Index内容在Index内容可以通过 `.Pages` 获取到。因此 Leaf Bundle 和 Branch Bundle 区别体现在：非Index内容是当做`.Pages`还是`.Resources`