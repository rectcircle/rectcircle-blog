---
title: "博客迁移——Hugo使用整体概览"
date: 2019-05-01T19:21:36+08:00
draft: false
toc: true
comments: true
summary: 转眼间，大学本科生活即将结束，腾讯云的学生1元服务器很快将无法使用，博客迁迫在眉睫。
tags:
  - untagged
---

## 旧博客介绍

![旧博客](/image/old-blog-home.png)

博客系统是我在2016年11左右开发完成上线的。

实现功能如下：

* 一个比较炫酷的主页（关于我）
* 文章列表、文章内容详情、标签、主题、内容搜索
* 后台管理
* 使用markdown写作

存在的问题：

* 后台管理功能较弱
    * 标签一旦设置则无法修改
    * 主题功能难以使用，一直没有利用起来
    * 在线编辑，一旦刷新或关机，新编辑内容将完全消失
* 只支持一级目录
* 不支持超长文章（500错误）
* 文章搜索仅仅是简单MySql匹配
* 不支持评论
* 仅支持简单的访问次数，分析手段不够

## 新博客的预期

支持旧博客的所有功能，另外能解决旧博客存在的问题

在当时，写旧博客的初衷是用来练手，到我写此篇博文的时刻，没有必要再重新造轮子（博客系统）来提高自我了。因此，选择静态博客系统+github+免费静态站点托管来实现我的诉求。

## 选择Hugo

开始方向的选择是最重要的一步，选择合理，代表成功了一半。

经过一番搜索，目前主流的三大静态博客系统为 [^1][^2]：

* Jekyll
* Hugo
* Hexo

在体验了Hexo和Hugo之后，我选择了Hugo。

当我在在测试Hexo的永久链接（Permalinks）时，在Front-matter中指定的permalink结果并不是预期的覆盖，这很头痛。还有一些细节觉得很粗糙。

在文档方面，Hexo作者来自台湾，文档比较易读，且支持中文，入门很容易。但是文档内容并不丰富，深入下去想去实现某些功能不太容易。

Hugo 除了get started比较容易阅读外，其他文档需要在其他文档的理解基础之上才能看懂，而且没有中文，国内资料更是少得可怜。但是文档及其丰富。

## Hugo的特点

* 仅需要一个二进制发行包，无需其他依赖
* 构建速度最快
* 内置支持Markdown格式内容
* 丰富的主题
* 灵活性较高

一个静态站点生成器使用者主要有两类人员

* 内容创作者
* 技术人员

所以从逻辑上，静态站点生成器就要将内容与站点表现形式进行分离。在Hugo中，内容使用Markdown语言进行描述；站点的表现形式使用Go Template进行描述；两个的衔接使用Hugo的概念约定、配置文件和扩展Markdown的front matter描述。

Hugo 构建构成大概如下所示：

```
内容创作者  --> `content/*.md`   ------
                                     |
                `配置等其他` ----------
                                     |
                                     v
技术人员   ---->  `layouts/**`------------> `/public`
```

* Hugo构建器会将 `content/` 中的文件（在Hugo中叫做内容），构建一个对象
    * 这个对象包含很多Hugo附加的属性和配置（Hugo中称为变量），并内置了一些函数，以提高灵活性
* Hugo将会按照一定规则选择一个或多个模板，将上一步生成的对象传递进模板，最终生成输出文件。
* 按照编程的角度理解，Hugo就是一个流处理器，content就是数据源。模板就是一个个处理函数。而数据源格式是markdown，编程语言是Go Template
* 对于一些资源Hugo提供了一些内置的处理器，比如SCSS/SASS预处理器（在Hugo叫做Pipes）

一个网站在宏观上进行划分可以分为两类：

* 列表页
* 内容页

不管多么复杂的网站都可以划分到这两个类别中。因此Hugo将页面分为这两种类型。

列表页在Hugo中可以再分为几类：

* 普通列表页（Section page）
* 分类类别页（Taxonomy list pages）
* 分类项目列表页（Taxonomy terms pages）
* RSS （RSS）

主页也是一种特殊的列表页，在Hugo中主页代表一种性质：全站唯一。

而内容页，在Hugo中叫做 single page，简称page

以上所有的类别Hugo中都有对应的模板，和默认的查找规则

用户还可以自定义页面类型和模板，并制定在何时调用（比如为netlify 生成 `_redirects` 文件）

主题在Hugo中是一些资源和模板的集合，简单来说就是没有内容（content）的Hugo项目。

## 迁移过程

### 下载安装并创建一个项目

参见 [Hugo 快速入门](/series/hugo/getting-started/quick-start/)

在 [Hugo主题网站](https://themes.gohugo.io/) 中，我选择了 https://themes.gohugo.io/hugo-theme-hello-friend-ng/

### 配置

基本的配置在此就不多赘述了。主要阐述一些比较隐晦或复杂的配置和设计。

#### 中文相关配置

Hugo的配置中，有几个关于语言相关选项，我的博客目前暂不考虑国际化问题，所以进行如下配置

```toml
languageCode = "zh" # html的lang属性值
DefaultContentLanguage = "zh" # 默认内容语言用于选择i18n语言模板
```

我选择的主题 `hello-friend-ng` 是支持国际化的，但是默认没有中文的语言包。所以需要添加中文语言包

```bash
mkdir i18n
cp themes/hello-friend-ng/i18n/en.toml i18n/zh.toml
```

然后修改 `i18n/zh.toml` 的值即可

#### 自定义样式

Hugo主题中 [404页](https://atlialp.com/404.html) 的样式存在问题，图标和文字不对齐，不居中等。在该主题中提供了对自定义CSS的配置。

```toml
[params]
  # 自定义CSS
  customCSS = ['/css/main.css']
```

新建`static`

```bash
mkdir static
touch static/main.css
```

#### Hugo自动生成目录存在的问题与修复

Hugo自动生成的目录，是一个嵌套的无序列表，存在如下问题

* 不论h1级标题是否存在，都会渲染一个级别的无需列表，按照惯例一个页面应该只有一个h1标签，这样会导致总目录第一层总是只有一个项目
* 习惯来说三级目录的层次（h2~h4）比较合适，但是Hugo的目录会生成h1~h6级别全部的目录

只有一种从github中找到了一种trick的方式解决这个问题

```bash
mkdir layout/partials
touch toc.html
```

`layouts/partials/toc.html`

```html
{{/* https://gist.github.com/skyzyx/a796d66f6a124f057f3374eff0b3f99a */}}
{{/* https://github.com/gohugoio/hugo/issues/1778 */}}

{{/* ignore empty links with + */}}
{{- $headers := findRE "<h[2-4].*?>(.|\n])+?</h[2-4]>" .Content -}}
{{ .Scratch.Set "last_level" -1 }}

{{/* at least one header to link to */}}
{{- $has_headers := ge (len $headers) 1 -}}
{{- if $has_headers -}}
    {{- range $headers -}}
        {{- $last_level := $.Scratch.Get "last_level" -}}
        {{- $header := . -}}
        {{- $base := ($.Page.File.LogicalName) -}}
        {{- $anchorId := ($header | plainify | htmlUnescape | anchorize) -}}
        {{- $href := delimit (slice $base $anchorId) "#" | string -}}
        {{- range findRE "[2-4]" . 1 -}}
            {{- $next_level := (int .) -}}
            {{- if eq $last_level -1 -}}
                <ul class="toc-h{{ . }}">
            {{- else if gt $next_level $last_level -}}
                {{- range seq (add $last_level 1) $next_level}}
                    <ul class="toc-h{{ . }}">
                {{- end -}}
            {{- else if lt $next_level $last_level -}}
                {{- range seq (add $next_level 1) $last_level}}
                    </ul>
                {{- end -}}
            {{- end -}}
            <li><a href="{{ relref $.Page $href }}">{{- $header | plainify | htmlUnescape -}}</a></li>
            {{ $.Scratch.Set "last_level" $next_level }}
        {{- end -}}
    {{- end -}}
{{- end -}}
```

复制 `themes/hello-friend-ng/layouts` 中所有使用过 `.TableOfContents` 的模板到 `layouts` 中，并修改

`layouts/posts/single.html`

```html
<div class="toc-title">{{ i18n "tableOfContents" }}</div>
    <!-- {{ .TableOfContents }} -->
    {{- partial "toc.html" . -}}
</aside>
```

#### 实现系列文章

系列文章就是旧博客中的主题，这里称之为系列比较贴切。该类文章有如下特点：

* 允许任意层的嵌套
* 文章支持自定义排序
* 支持面包屑导航
* 每篇文章支持上一篇，下一篇

##### 任意层的嵌套实现

Hugo内容默认支持任意层的嵌套，但是需要模板的支持

将`themes/hello-friend-ng/layouts/_default/list.html` 复制到 `layouts/series`

编辑 `layouts/series/list.html`，添加对sections的输出

```html
        <div class="posts-group">
            <ul class="posts-list">
                {{ range .Sections}}
                <li class="post-item">
                    <a href="{{.Permalink}}">
                        <span class="post-title">{{.Title}}</span>
                        <span
                            class="post-day">{{ if .Site.Params.dateformShort }}{{ .Date.Format .Site.Params.dateformShort }}{{ else }}{{ .Date.Format "Jan 2"}}{{ end }}</span>
                    </a>
                </li>
                {{ end}}
            </ul>
        </div>
```

为了让系列文章与博客文章一致，将`themes/hello-friend-ng/layouts/posts/single.html` 复制到 `layouts/series`

##### 文章支持自定义排序

使用在内容front matter中定义weight，进行排序，weight越小，越靠前显示。

##### 面包屑导航实现

添加 `layouts/partials/breadcrumb.html`

```html
<ol class="breadcrumb">
  {{ template "breadcrumbnav" (dict "p1" . "p2" .) }}
</ol>
{{ define "breadcrumbnav" }}
{{ if .p1.Parent }}
{{ template "breadcrumbnav" (dict "p1" .p1.Parent "p2" .p2 )  }}
{{ else if not .p1.IsHome }}
{{ template "breadcrumbnav" (dict "p1" .p1.Site.Home "p2" .p2 )  }}
{{ end }}
<li{{ if eq .p1 .p2 }} class="active"{{ end }}>
  <a href="{{ .p1.Permalink }}">{{ .p1.Title }}</a>
</li>
{{ end }}
```

在需要的地方使用 `{{ partial "breadcrumb.html" . }}` 调用

同时添加如下样式 `static/css/main.css`

```css
.breadcrumb {
  padding: 8px 15px;
  margin-bottom: 40px;
  list-style: none;
  background-color: #0000000f;
  margin-left: 0px;
  border-radius: 4px;
}

.breadcrumb>li {
  display: inline-block;
}

.breadcrumb>li+li:before {
  padding: 0 5px;
  color: #ccc;
  content: ">\00a0";
}
```

##### 实现上一篇下一篇

Page页面提供了 `.NextInSection` 和 `.PrevInSection` 变量可以实现

定义一个partial `layouts/partials/prevnext.html`

```html
{{$prev := .PrevInSection}}
{{$next := .NextInSection}}

{{if or $prev $next}}
<div class="clearfix">
<ul class="prevnext">
{{if $prev}}
  <li>
  <a href="{{$prev.Permalink}}">
    上一篇：{{$prev.Title}}
  </a>
  </li>
{{end}}
{{if $next}}
  <li>
  <a href="{{$next.Permalink}}">
    下一篇：{{$next.Title}}
  </a>
  </li>
{{end}}
</ul>
</div>
<hr>
{{end}}
```

编写样式

```css
/*
清除浮动
*/
.clearfix {
  zoom: 1
}

.clearfix:after, .clearfix:before {
  content: "";
  display: table
}

.clearfix:after {
  clear: both
}


/* 上一页下一页 */

.prevnext {
  float: right;
  list-style: none;
  margin-right: 20px;
}
```

在`single.html`调用

```html
{{ partial "prevnext.html" . }}
```

> 在Hugo 0.55.4版本，存在 [bug](https://github.com/gohugoio/hugo/issues/5883)
> 0.55.5版本，已经修复该bug，且迁移博客本身存在上一篇下一篇

#### 实现标签

Hugo原生支持 taxonomy （分类），利用这一特性可以完美实现分类/标签。默认Hugo提供了两种名为 `tags` 和 `categories` 的分类器。如过需要自定义 分类器名称，需要在 `config.toml` 中添加 `taxonomies` （这将覆盖默认的 `tags` 和 `categories` ）

例如

```toml
[taxonomies]
  category = "categories"
  series = "series"
  tag = "tags"
```

本次博客迁移中，仅需要保留 `tags` 即可，所以禁用掉 `categories`

```toml
[taxonomies]
  tag = "tags"
```

在博文的front-matter中添加分类器分类

```md
---
tags:
  - Java
---
```

但是在原博客中还存在标签下存在的博文数目的勋章，所以需要自定义 taxonomy 模板

将 `themes/hello-friend-ng/layouts/_default/list.html` 复制到 `layouts/tags/terms.html.html` 修改

```html
{{- range .Pages }}
  <li class="post-item">
      <a href="{{.Permalink}}">
          <span
              class="post-title">{{.Title}}<span
                class="badge">{{ .Site.Taxonomies.tags.Count .Title}}</span></span>
          <span class="post-day">{{ if .Site.Params.dateformShort }}{{ .Date.Format .Site.Params.dateformShort }}{{ else }}{{ .Date.Format "Jan 2"}}{{ end }}</span>
      </a>
  </li>
{{- end }}
```

在 `static/css/main.css` 中添加样式

```css
.badge{
  display: inline-block;
  padding: 3px 7px;
  font-size: 12px;
  font-weight: bold;
  line-height: 1;
  color: #fff;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  background-color: #777;
  border-radius: 10px;
  margin-left: 0.5rem;
}
```

#### 实现旧URL无缝迁移

在旧博客中，文章的URL模式为 `/detail/${id}` 或者 `/detail/${id}/`，既然要迁移到是静态博客，URL的风格应该采取更好的方式，所以选择 `/posts/${filename}/` 的方式。但是也要保持旧URL可以正确跳转到新的URL。

Hugo提供了别名的机制可以为同一个页面设置多个URL，所有的别名默认通过 HTML 自动刷新机制跳转到新的页面，这种方式显然对SEO不理

幸运的是Hugo提供了自定义输出机制，配合将要托管的netlify平台提供了 `.htacess` 格式的重定向配置文件 `_redirects`。即可实现新旧URL无缝迁移。

具体步骤如下：

修改 `config.toml` 配置文件，禁用别名HTML文件的默认生成

```toml
disableAliases = true
```

定义自定输出和模板

`config.toml` 添加如下内容

```toml
[outputs]
home = [ "REDIR" ]

[mediaTypes]
  [mediaTypes."text/netlify"]
    delimiter = ""

[outputFormats]
  [outputFormats.REDIR]
    mediatype = "text/netlify"
    baseName = "_redirects"
    isPlainText = true
    notAlternative = true
```

创建 `layouts/index.redir` 文件，内容如下：

```toml
# Netlify redirects. See https://www.netlify.com/docs/redirects/
# https://github.com/gohugoio/hugo/blob/master/docs/themes/gohugoioTheme/layouts/index.redir
{{  range $p := .Site.Pages -}}
{{ range .Aliases }}
{{  . | printf "%-35s" }}  {{ $p.RelPermalink -}}
{{ end -}}
{{- end -}}
```

> 参考了 [Hugo 官方文档网站](https://github.com/gohugoio/hugo/blob/master/docs/config.toml) 的配置

#### 搜索实现

静态页面的搜索，可选的方案有两种。第一种就是选择一个开源的JS搜索库，在浏览器端实现搜索，第二种方案是接入第三方商业搜索服务。新博客优先使用开源方案，因此选择第一种。

浏览器端搜索原理如下：

* Hugo在构建时，创建一个JSON文件，这个JSON文件包含全部文章的索引
* 浏览器端用户输入搜索内容后，搜索库将会载入索引JSON文件，并进行搜索

npm中有众多开源的免费的JS搜索实现。在此时其中最热门的是 [Fuse.js](https://fusejs.io/) [^3]

Hugo也有一篇 [如何实现搜索的文档](https://gohugo.io/tools/search/)，其中包含一篇 [如何通过Fuse实现Hugo全站搜索的教程](https://gist.github.com/eddiewebb/735feb48f50f0ddd65ae5606a1cb41ae)

简单描述，操作如下：

将JSON加入自定义输出中，`config.toml`

```toml
[outputs]
  home = [ "HTML", "REDIR", "JSON"]
```

添加索引文件输出模板 `layouts/index.json`

```
{{- $.Scratch.Add "index" slice -}}
{{- range .Site.RegularPages -}}
    {{- $.Scratch.Add "index" (dict "title" .Title "tags" .Params.tags "categories" .Params.categories "contents" .Plain "permalink" .Permalink "summary" .Summary "date" (.Date.Format "2006-01-02")) -}}
{{- end -}}
{{- $.Scratch.Get "index" | jsonify -}}
```

运行 `hugo` 后，将会输出一个 `public/index.json`的文件，结构如下：

```json
[
  {
    "categories": null,
    "contents": "xxx",
    "permalink": "http://localhost:1313/series/hugo/content-management/organization/",
    "summary": "Hugo基于 内容的组织方式（content目录结构）和网站的呈现方式结构一致 的 假设",
    "tags": null,
    "title": "内容组织"
  }
]
```

将 `fuse.js` 添加到HTML中，添加配置 `config.toml`

编写搜索页HTML模板，`layouts/_default/search.html`

```html
{{ define "main" }}
<main class="posts">

  <div class="search-box">
    <input type="text" id="searchBoxInput" placeholder="Search">
    <button id="searchBoxButton">
    <svg t="1556783211810" class="search-box-icon" class="icon" style="" viewBox="0 0 1024 1024" version="1.1"
      xmlns="http://www.w3.org/2000/svg" p-id="2078" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <style type="text/css"></style>
      </defs>
      <path
        d="M981.39652054 920.86314525L704.56522859 644.0318533a366.65501012 366.65501012 0 1 0-61.73503038 65.64040943L917.55859375 984.40065827z m-856.17925347-493.12920861a284.19142939 284.19142939 0 1 1 283.89101562 284.19142939A284.49184317 284.49184317 0 0 1 125.06706019 427.73393664z"
        fill="" p-id="2079" data-spm-anchor-id="a313x.7781069.0.i2"></path>
    </svg>
    </button>
  </div>
  <div class="posts-group">
    <ul id="searchResult" class="posts-list">
    </ul>
  </div>
  <span id="searchCount"></span>


</main>
<script type="text/javascript" src='/js/fuse.min.js'></script>
<script type="text/javascript" src='/js/search.js'></script>
{{ end }}
```

编写JS逻辑，`static/js/search.js`

```js
document.addEventListener('DOMContentLoaded', async () => {
  const searchButton = document.querySelector('#searchBoxButton')
  const searchInput = document.querySelector('#searchBoxInput')
  const searchResult = document.querySelector('#searchResult')
  const searchCount = document.querySelector('#searchCount')

  function parseLocationSearch() {
    let locationSearch = location.search
    let result = {}
    if (locationSearch == '') {
      return result
    }
    locationSearch = locationSearch.substr(1)
    for (let kv of locationSearch.split('&')) {
      if (kv == '') {
        continue
      }
      const [k, v] = kv.split('=')
      result[k] = decodeURI(v)
    }
    return result
  }

  var fuseOptions = {
    shouldSort: true,
    includeMatches: true,
    threshold: 0.0,
    tokenize: true,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: [{
        name: "title",
        weight: 0.8
      },
      {
        name: "summary",
        weight: 0.5
      },
      {
        name: "contents",
        weight: 0.5
      },
      {
        name: "tags",
        weight: 0.3
      },
      {
        name: "categories",
        weight: 0.3
      },
      {
        name: "date",
        weight: 0.3
      },
    ]
  };

  let fuse = null

  async function getFuse() {
    if (fuse == null) {
      const resp = await fetch('/index.json', {
        method: 'get'
      })
      const indexData = await resp.json()
      console.log(indexData.length)
      fuse = new Fuse(indexData, fuseOptions);
    }
    return fuse
  }

  function render(items) {
    return items.map(item => {
      item = item.item
      return `<li class="post-item">
        <a href="${item.permalink}">
          <span class="post-title">${item.title}</span>
          <span
            class="post-day">${item.date}</span>
        </a>
      </li>`}).join('')
  }

  function updateDOM(html, number) {
    searchResult.innerHTML = html
    searchCount.innerHTML = `共有查询到${number}篇文章`
  }

  async function search() {
    const searchString = searchInput.value
    const fuse = await getFuse()
    const result = fuse.search(searchString)
    const html = render(result)
    updateDOM(html, result.length)
  }

  function doSearch() {
    const wd = parseLocationSearch()['wd'] || ''
    searchInput.value = wd
    if (wd) {
      search()
    }
  }

  function goSearch() {
    if (searchInput.value == parseLocationSearch()['wd']) {
      return
    }
    history.pushState('', '', location.pathname + '?wd=' + searchInput.value)
    searchInput.blur();
    doSearch()
  }

  searchButton.addEventListener('click', goSearch)
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      goSearch()
    }
  })

  doSearch()

  window.addEventListener('popstate', doSearch)

})
```

当然还有样式`static/css/main.css`

```css
.search-box {
  position: relative;
  margin-bottom: 20px;
}

#searchBoxInput {
  padding: 0.5rem 2rem 0.5rem 1rem;
  width: 16rem;
  background:#eaeaea;
  border-radius: 1rem;
  outline: 0;
  font-size: 1rem;
  color: inherit;
  border: 0px;
  box-sizing: border-box;
}

.dark-theme .search-box #searchBoxInput {
  background: #3b3d42;
}

#searchBoxButton {
  display: inline;
  background: none;
  position: absolute;
  left: 14rem;
  margin: 0rem;
  border-radius: 0rem 1rem 1rem 0rem;
  padding: 0.45rem 0.4rem 0.30rem 0.4rem;
}

.search-box-icon {
  color: inherit;
  fill: currentColor;
  width: 1.1rem;
  height: 1.1rem;
}

#searchCount {
  font-size: 0.8rem;
}
```

#### 接入评论

Hugo 默认对 [Disqus](https://disqus.com) 提供了支持

注册一个 Disqush 账号并创建一个评论，然后配置config.toml

```toml
disqusShortname = "yourdiscussshortname"
```

在我使用的主题中，在Front Matter中需要进行显示的打开才能使用

#### 接入分析

Hugo 默认支持 `Google analytics`(https://analytics.google.com/) 服务

注册一个GA分析账号，将其配置在 `config.toml` 中

```toml
googleAnalytics = 'UA-xxxx-xx'
```

### 数据迁移

旧博客的数据都是以Markdown的格式存在数据库中的。所以需要编写一个迁移脚本，将数据导出为markdown文件。Python是比较好的选择，迁移脚本如下：

```python
#! /usr/bin/env python
#-*- coding: utf-8 -*-

print u'mysql'

import MySQLdb
import re
# 打开数据库连接
db = MySQLdb.connect("localhost", "root", "123456", "personalsite", charset='utf8' )
cursor = db.cursor()
cursor.execute("select VERSION()")
data = cursor.fetchone()
print data


cursor.execute("""
    select * from Article
""")

articles = cursor.fetchall()
print len(articles)

# print articles[0]
article = articles[0]
cursor.execute('select tagId from TagArticle where articleId = 185')
tagIds = cursor.fetchall()
print tagIds

for article in articles:
    id, author, content, createTime, readTimes,satatus, title = article
    cursor.execute('select tagId from TagArticle where articleId = '+str(id))
    tagIds = cursor.fetchall()
    tags = ''
    for tagId in tagIds:
        cursor.execute('select tagName from Tag where tagId = ' + str(tagId[0]))
        tagName = cursor.fetchone()[0]
        tags = tags + '  - ' + tagName + '\n'
    print tags
    if tags == '':
        tags = '  - untagged\n'
    print tags
    tpl = u'''---
title: {title}
date: {date}
draft: false
toc: false
comments: true
aliases:
  - /detail/{id}
  - /detail/{id}/
tags:
{tags_string}---

{content}
'''
    filepath = '/root/blog-migration/output/posts/' + title + '.md'
    reg = re.compile(r'(?P<sharps>#{2,6})\s+\[(?P<header>.*?)\]\(\)')
    content = reg.subn(r'\g<sharps> \g<header>', content)[0]
    date = createTime.strftime('%Y-%m-%dT%H:%M:%S+08:00')
    md = tpl.format(title=title, date=date, tags_string=tags, content=content, id=id)
    print type(filepath)
#    f = open(filepath, 'w')
#    print f
    with  open(filepath, 'w') as f:
        f.write(md.encode(encoding='utf-8'))
```

### 部署到netlify

netlify 是一个静态博客网站部署平台，提供静态网站的免费CDN分发服务。

首先添加netlify的配置文件`netlify.toml`，并将博客push到github上

```toml
[build]
publish = "public"
command = "hugo --gc --minify"

[context.production.environment]
  HUGO_VERSION = "0.55.5"
```

然后在 [netlify](https://app.netlify.com) 上注册一个账号。然后在github中选择相应的代码库，即可完成。最后需要在 [domain设置页面](https://app.netlify.com/sites/rectcircle/settings/domain) 设置URL或者自定义域名即可完成部署（[建议使用 CNAME 记录](https://docs.netlify.com/domains-https/custom-domains/configure-external-dns/#configure-an-apex-domain)，使用 A 记录没法利用CDN非常慢）。

## 注意事项

* Hugo使用的Markdown解析器 `Blackfriday` 存在无法正确识别两个空格的无序列表的Bug https://github.com/russross/blackfriday/issues/329

[^1]: https://www.techiediaries.com/jekyll-hugo-hexo/
[^2]: https://stackshare.io/stackups/hexo-vs-hugo_2-vs-jekyll
[^3]: https://www.npmtrends.com/elasticlunr-vs-fuse.js-vs-fuzzy-vs-fuzzysearch-vs-lunr-vs-reds-vs-search-index

## 2020-05-10 使用 utterances 代替 Disqus

Disqus 有一个比较严重的问题，国内用户无法访问，因此考虑使用 utterances 进行替代

utterances 是一个基于 Github issues 的评论系统，开源可控。

### Github接入

打开 [utteranc#configuration](https://utteranc.es/#configuration)，按照步骤进行配置

* 选择公开的 [github仓库](https://github.com/rectcircle/rectcircle-blog/labels)，配置一个 Label，这列配置成 `comment`
* 在 https://github.com/apps/utterances 页面为 仓库安装 App
* 填写 配置信息，复制下方的 script 代码

### 编写 Hugo 模板

`layouts/partials/utterances.html` 填写刚才复制的内容

```html
<script src="https://utteranc.es/client.js"
        repo="rectcircle/rectcircle-blog"
        issue-term="pathname"
        label="comment"
        theme="github-dark"
        crossorigin="anonymous"
        async>
</script>
```

编写各处的 `single.html` 文件

```html
        {{ if .Params.comments }}
            {{ partial "utterances.html" . }}
        {{ end }}
```

添加 主题切换 跟随脚本 `static/js/main.js`

```js
(function () {
	function setUtterancesTheme() {
		let theme = window.localStorage.getItem("theme") || "light";
		let msg = {
			type: "set-theme",
			theme: "github-dark"
		};
		if (theme == "light") {
			msg.theme = "github-light"
		}
		document.querySelector('.utterances-frame').contentWindow.postMessage(msg, 'https://utteranc.es')
	}

	document.querySelector('.theme-toggle').addEventListener("click", () => {
		setTimeout(setUtterancesTheme, 500);
	})
	setTimeout(setUtterancesTheme, 2000);
})();
```

配置文件添加js脚本

```toml
customJS = ['/js/anchorforid.js', '/js/main.js']
```
