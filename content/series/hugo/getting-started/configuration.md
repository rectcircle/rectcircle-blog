---
title: "配置 Hugo"
date: 2019-04-30T14:31:49+08:00
draft: false
toc: true
weight: 50
summary: 如何配置您的Hugo站点
---

## 配置文件

Hugo使用 `config.toml`，`config.yaml`或`config.json`（如果在站点根目录中找到）作为默认站点配置文件。

用户可以使用命令行 `--config` 开关选择使用一个或多个站点配置文件覆盖该默认值。

例子

```bash
hugo --config debugconfig.toml
hugo --config a.toml,b.toml,c.toml
```

> 可以将多个站点配置文件指定为--config开关的逗号分隔字符串。

## 配置目录

除了使用单个站点配置文件之外，还可以使用 `configDir`目录（默认为 `config/` ）来维护更轻松的组织和环境特定设置。

* 每个文件代表一个配置根对象，例如`Params`，`Menus`，`Languages`等......
* 每个目录包含一组包含环境特有的设置的文件。
* 文件可以本地化为特定于语言。

```tree
config
├── _default
│   ├── config.toml
│   ├── languages.toml
│   ├── menus.en.toml
│   ├── menus.zh.toml
│   └── params.toml
├── staging
│   ├── config.toml
│   └── params.toml
└── production
    ├── config.toml
    └── params.toml
```

考虑到上面的结构，当运行 `hugo --environment staging` 时，Hugo将使用`config/_default` 中的每个设置并在这些设置之上合并 `staging`。

> `hugo server` 的默认环境是 `development`，`hugo` 的默认环境是 `production`

## 所有配置设置

以下是Hugo定义的变量的完整列表，其默认值在括号中。用户可以选择在其站点配置文件中覆盖这些值。

`archetypeDir ("archetypes")`
: 内容模板目录配置

`assetDir ("assets")`
: 参见 [Hugo Pipes](https://gohugo.io/hugo-pipes/).

`baseURL`
: 网站根URL, e.g. `http://bep.is/`

`blackfriday`
: Markdown解析器配置参见 [Configure Blackfriday](https://gohugo.io/getting-started/configuration/#configure-blackfriday)

`buildDrafts(false)`
: 构建时包含草稿(`draft: true`)

`buildExpired (false)`
: 构建时包含已过期(`expirydate` 在过去)的内容

`buildFuture (false)`
: 构建时包含 `publishdate` 时间在未来的内容

`caches`
: 参见 [Configure File Caches](https://gohugo.io/getting-started/configuration/#configure-file-caches)

`canonifyURLs (false)`
: 启用将相对URL转换为绝对URL

`contentDir ("content")`
: 内容目录设置

`dataDir ("data")`
: 数据目录设置

`defaultContentLanguage ("en")`
: 内容的默认语言

`defaultContentLanguageInSubdir (false)`
: 在子目录中渲染默认语言的内容，例如 `/` 重定向到 `/en/`

`disableAliases (false)`
: 将禁用别名重定向的生成。请注意，即使设置了disableAliases，也会在页面上保留别名本身。这样做的动机是能够使用自定义输出格式在.htacess，Netlify _redirects文件或类似文件中生成301重定向。

`disableHugoGeneratorInject (false)`
: 禁用hugo生成器头

`disableKinds ([])`
: 启用禁用指定种类的所有页面，允许列表如下 `["page", "home", "section", "taxonomy", "taxonomyTerm", "RSS", "sitemap", "robotsTXT", "404"]`

`disableLiveReload (false)`
: 禁用浏览器窗口的自动实时重新加载。

`disablePathToLower (false)`
: 不要将`url/path`转换为小写。

`enableEmoji (false)`
: 启用 [Emoji](https://www.webpagefx.com/tools/emoji-cheat-sheet/)

`enableGitInfo (false)`
: 为每个页面启用.GitInfo对象（如果Hugo站点由Git进行版本控制）。然后，这将使用该内容文件的最后一个git提交日期更新每个页面的Lastmod参数。

`enableInlineShortcodes`
: 参见 [Inline Shortcodes](https://gohugo.io/templates/shortcode-templates/#inline-shortcodes).

`enableMissingTranslationPlaceholders (false)`
: 如果缺少翻译，则显示占位符而不是默认值或空字符串

`enableRobotsTXT (false)`
: 启用robots.txt文件的生成

`frontmatter`
: 参见 [Front matter Configuration](#configure-front-matter)

`footnoteAnchorPrefix ("")`
: 脚注锚点的前缀

`footnoteReturnLinkContents ("")`
: 脚注返回链接显示的文本。

`googleAnalytics ("")`
: Google Analytics跟踪ID

`hasCJKLanguage (false)`
: 如果为true，则在内容中自动检测中文/日文/韩文语言。这将使.Summary和.WordCount在CJK语言中正常运行。

`imaging`
: 参见 [Image Processing Config](https://gohugo.io/content-management/image-processing/#image-processing-config)

`languages`
: 参见 [Configure Languages](https://gohugo.io/content-management/multilingual/#configure-languages)

`languageCode ("")`
: 设置站点语言代码

`languageName ("")`
: 设置站点语言名

`disableLanguages`
: 参见 [https://gohugo.io/content-management/multilingual/#disable-a-language](https://gohugo.io/content-management/multilingual/#disable-a-language)

`layoutDir ("layouts")`
: 布局（模板）目录

`log (false)`
: 使能日志

`logFile ("")`
: 配置日志文件

`menu`
: 参见 [Add Non-content Entries to a Menu](https://gohugo.io/content-management/menus/#add-non-content-entries-to-a-menu)

`metaDataFormat ("toml")`
: Front matter格式. 允许值为: "toml", "yaml", or "json".

`newContentEditor ("")`
: 创建新内容时使用的编辑器。

`noChmod (false)`
: 不要同步文件的权限模式

`noTimes (false)`
: 不要同步文件的修改时间

`paginate (10)`
:配置分页数 [pagination](https://gohugo.io/templates/pagination/)

`paginatePath ("page")`
: 分页路径 (例如`https://example.com/page/2`).

`permalinks`
: 参见 [Content Management](https://gohugo.io/content-management/urls/#permalinks)

`pluralizeListTitles (true)`
: 如果某个目录没有_index.md，此列表页页面标题将会转换为复数形式（针对英语）

`publishDir ("public")`
: Hugo将编写最终静态站点（HTML文件等）的目录。

`pygmentsCodeFencesGuessSyntax (false)`
: 在没有指定语言的情况下为代码栅栏启用语法猜测。

`pygmentsStyle ("monokai")`
: 用于语法突出显示的颜色主题或样式。请参阅[Pygments Color Themes](https://help.farbox.com/pygments.html)

`pygmentsUseClasses (false)`
: 启用外部CSS以进行语法突出显示。

`related`
: 请参阅 [Related Content](https://gohugo.io/content-management/related/#configure-related-content)

`relativeURLs (false)`
: 启用此选项可使所有相对URL相对于内容根目录。请注意，这不会影响绝对URL

`refLinksErrorLevel ("ERROR")`
: 使用ref或relref解析页面链接并且无法解析链接时，将使用此logg级别记录该链接。有效值为ERROR（默认值）或WARNING。任何ERROR都将使构建失败（退出-1）。

`refLinksNotFoundURL`
: 使用ref或relref解析页面链接并且无法解析链接时，将使用此logg级别记录该链接。有效值为ERROR（默认值）或WARNING。任何ERROR都将使构建失败（退出-1）

`rssLimit (unlimited)`
: RSS源中的最大项目数

`sectionPagesMenu ("")`
: 参见 [Section Menu for Lazy Bloggers](https://gohugo.io/templates/menu-templates/#section-menu-for-lazy-bloggers).

`sitemap`
: 参见 [sitemap configuration](https://gohugo.io/templates/sitemap-template/#configure-sitemap-xml)

`staticDir ("static")`
: 静态文件目录 参见 [静态文件](https://gohugo.io/content-management/static-files/)

`stepAnalysis (false)`
: 显示程序的不同步骤的存储器和时序

`summaryLength (70)`
: 摘要长度

`taxonomies`
: 分类，参阅 [Configure Taxonomies](https://gohugo.io/content-management/taxonomies#configure-taxonomies)

`theme ("")`
: 主题 要使用的主题（默认位于/themes/THEMENAME/）

`themesDir ("themes")`
: 主题目录

`timeout (10000)`
:生成页面内容的超时，以毫秒为单位（默认为10秒）。注意：这用于避免递归内容生成，如果您的页面生成缓慢（例如，因为它们需要大型图像处理或依赖于远程内容），您可能需要提高此限制。

`title ("")`
: 站点标题

`uglyURLs (false)`
: 启用后，创建格式为`/filename.html`而不是`/filename/`的URL。

`verbose (false)`
: 启用详细输出

`verboseLog (false)`
: 启用详细日志输出

`watch (false)`
: 监视文件系统以进行更改并根据需要重新创建

> 如果您在* nix机器上开发站点，这是从命令行查找配置选项的便捷快捷方式：

```bash
cd ~/sites/yourhugosite
hugo config | grep emoji
```

输出类似如下

```
enableemoji: true
```

## 配置环境变量

`HUGO_NUMWORKERMULTIPLIER`
: 可以设置为增加或减少Hugo中并行处理中使用的工作者数量。如果未设置，将使用逻辑CPU的数量。

## 配置查找顺序

与模板查找顺序类似，Hugo有一组默认规则，用于在网站源目录的根目录中搜索配置文件，作为默认行为：

* `./config.toml`
* `./config.yaml`
* `./config.json`

在您的配置文件中，您可以指导Hugo了解您希望网站呈现的方式，控制网站的菜单，以及任意定义特定于项目的网站范围参数。

## 示例配置

```toml
baseURL = "https://yoursite.example.com/"
footnoteReturnLinkContents = "↩"
title = "My Hugo Site"

[params]
  AuthorName = "Jon Doe"
  GitHubUser = "spf13"
  ListOfFoo = ["foo1", "foo2"]
  SidebarRecentLimit = 5
  Subtitle = "Hugo is Absurdly Fast!"

[permalinks]
  posts = "/:year/:month/:title/"
```

## 使用环境变量配置

除了已经提到的3个配置选项之外，还可以通过操作系统环境变量定义配置键值。

例如，以下命令将在类Unix系统上有效地设置网站标题：

```bash
env HUGO_TITLE="Some Title" hugo
```

如果您使用Netlify等服务部署您的站点，这非常有用。查看 [Netlify configuration file] 示例。

> 名称必须以HUGO_为前缀，并且在设置操作系统环境变量时必须将配置键设置为大写。

## 渲染时忽略文件

`./config.toml`中的以下语句将导致Hugo在呈现时忽略以`.foo`和`.boo`结尾的文件：

```toml
ignoreFiles = [ "\\.foo$", "\\.boo$" ]
```

以上是正则表达式列表。请注意，在此示例中对反斜杠（\）字符进行了转义，以使TOML能够理解。

## 配置Front Matter

### 配置日期

日期在Hugo中非常重要，您可以配置Hugo如何为您的内容页面分配日期。您可以通过向config.toml添加frontmatter部分来完成此操作。

默认配置如下

```toml
[frontmatter]
date = ["date", "publishDate", "lastmod"]
lastmod = [":git", "lastmod", "date", "publishDate"]
publishDate = ["publishDate", "date"]
expiryDate = ["expiryDate"]
```

例如，如果您在某些内容中包含非标准日期参数，则可以覆盖日期设置：

```toml
[frontmatter]
date = ["myDate", ":default"]
```

`:default`是默认设置的快捷方式。如果`myDate`存在，上面将设置`.Date`为`myDate`中的日期值，如果不存在，我们将查看 `["date", "publishDate", "lastmod"]` 并选择第一个有效日期。

在列表中，以`":"`开头的值是具有特殊含义的日期处理程序（见下文）。其他只是前端配置中日期参数的名称（不区分大小写）。另请注意，Hugo上面有一些内置别名：lastmod => modified，publishDate => pubdate，published和expiryDate => unpublishdate。以此为例，默认情况下，将pubDate用作前面的日期，将分配给.PublishDate。

特殊日期处理程序是：

**`:fileModTime`**

从内容文件的上次修改时间戳中获取日期。

一个例子：

```toml
[frontmatter]
lastmod = ["lastmod", ":fileModTime", ":default"]
```

上面将首先尝试从`front matter`参数中的 `lastmod` 提取.Lastmod的值，然后是内容文件的修改时间戳。最后，在这里不需要默认，但Hugo最终会在：git，date和publishDate中寻找有效的日期。

**`:filename`**

从内容文件的文件名中获取日期。例如，`2018-02-22-mypage.md`将提取日期`2018-02-22`。此外，如果未设置slug，`mypage`将用作.Slug的值。

一个例子：

```toml
[frontmatter]
date  = [":filename", ":default"]
```

上面将首先尝试从文件名中提取.Date的值，然后它将查看前面的参数date，publishDate和last last last。

**`:git`**

这是此内容文件的最新修订版的Git作者日期。只有在设置了`--enableGitInfo`或在站点配置中设置了`enableGitInfo = true`时才会设置此项。

## 配置Blackfriday

[Blackfriday](https://github.com/russross/blackfriday) 是Hugo内置的Markdown渲染引擎。

Hugo通常使用理智的默认值配置Blackfriday，这些默认值应该适合大多数用例。

但是，如果您对Markdown有特殊需求，Hugo会公开其部分Blackfriday行为选项供您更改。下表列出了这些Hugo选项，与Blackfriday的源代码（ [html.go](https://github.com/russross/blackfriday/blob/master/html.go) 和 [markdown.go](https://github.com/russross/blackfriday/blob/master/html.go) ）中的相应标志配对。

### Blackfriday选项

[参见](https://gohugo.io/getting-started/configuration/#configure-blackfriday)

## 配置其他输出格式

Hugo v0.20引入了将内容呈现为多种输出格式（例如，JSON，AMP html或CSV）的功能。有关如何将这些值添加到Hugo项目的配置文件的信息，请参阅 [输出格式](https://gohugo.io/templates/output-formats/)。

### 配置文件缓存

从Hugo 0.52开始，您可以配置的不仅仅是 `cacheDir`。这是默认配置：

```toml
[caches]
[caches.getjson]
dir = ":cacheDir/:project"
maxAge = -1
[caches.getcsv]
dir = ":cacheDir/:project"
maxAge = -1
[caches.images]
dir = ":resourceDir/_gen"
maxAge = -1
[caches.assets]
dir = ":resourceDir/_gen"
maxAge = -1
```

您可以在自己的config.toml中覆盖任何这些缓存设置。

#### 关键词解释

`:cacheDir`
: 这是cacheDir配置选项的值（如果已设置）（也可以通过OS env变量HUGO_CACHEDIR设置）。它将回退到Netlify上的 `/opt/build/cache/ hugo_cache/`，或其他人的OS temp dir下面的hugo_cache目录。这意味着如果在Netlify上运行构建，则将在下一个构建中保存和恢复所有配置有：cacheDir的缓存。对于其他CI供应商，请阅读他们的文档。对于CircleCI示例，请参阅此配置。

`:project`
: 当前Hugo项目的基本目录名称。这意味着，在其默认设置中，每个项目都将具有单独的文件缓存，这意味着当您执行hugo --gc时，您将不会触摸与在同一台PC上运行的其他Hugo项目相关的文件。

`:resourceDir`
: 这是resourceDir配置选项的值。

`maxAge`
: 这是缓存条目被逐出之前的持续时间，-1表示永远，0有效地关闭该特定缓存。使用Go的time.Duration，因此有效值为“10s”（10秒），“10m”（10分钟）和“10h”（10小时）。

`dir`
: 将存储此缓存的文件的绝对路径。允许的起始占位符是：cacheDir和：resourceDir（见上文）。

## 配置文件语法

* [TOML Spec](https://github.com/toml-lang/toml)
* [YAML Spec](http://yaml.org/spec/)
* [JSON Spec](https://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf "Specification for JSON, JavaScript Object Notation")
