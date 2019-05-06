---
title: "基本用法"
date: 2019-04-30T12:37:24+08:00
draft: false
toc: true
weight: 30
summary: Hugo的CLI功能齐全，使用简单，对命令行工作经验非常有限的人也是如此。
---

以下是您在开发Hugo项目时将使用的最常用命令的说明。更多有关Hugo CLI的，请 [参阅命令行参考](https://gohugo.io/commands/)。

## 测试安装

[安装Hugo](installing) 后，请确保它位于PATH中。您可以通过`help`命令测试Hugo是否已正确安装：

```bash
hugo help
```

您在控制台中看到的输出应类似于以下内容：

```bash
hugo is the main command, used to build your Hugo site.

Hugo is a Fast and Flexible Static Site Generator
built with love by spf13 and friends in Go.

Complete documentation is available at http://gohugo.io/.

Usage:
  hugo [flags]
  hugo [command]

Available Commands:
  check       Contains some verification checks
  config      Print the site configuration
  convert     Convert your content to different formats
  env         Print Hugo version and environment info
  gen         A collection of several useful generators.
  help        Help about any command
  import      Import your site from others.
  list        Listing out various types of content
  new         Create new content for your site
  server      A high performance webserver
  version     Print the version number of Hugo

Flags:
  -b, --baseURL string         hostname (and path) to the root, e.g. http://spf13.com/
  -D, --buildDrafts            include content marked as draft
  -E, --buildExpired           include expired content
  -F, --buildFuture            include content with publishdate in the future
      --cacheDir string        filesystem path to cache directory. Defaults: $TMPDIR/hugo_cache/
      --cleanDestinationDir    remove files from destination not found in static directories
      --config string          config file (default is path/config.yaml|json|toml)
      --configDir string       config dir (default "config")
  -c, --contentDir string      filesystem path to content directory
      --debug                  debug output
  -d, --destination string     filesystem path to write files to
      --disableKinds strings   disable different kind of pages (home, RSS etc.)
      --enableGitInfo          add Git revision, date and author info to the pages
  -e, --environment string     build environment
      --forceSyncStatic        copy all files when static is changed.
      --gc                     enable to run some cleanup tasks (remove unused cache files) after the build
  -h, --help                   help for hugo
      --i18n-warnings          print missing translations
      --ignoreCache            ignores the cache directory
  -l, --layoutDir string       filesystem path to layout directory
      --log                    enable Logging
      --logFile string         log File path (if set, logging enabled automatically)
      --minify                 minify any supported output format (HTML, XML etc.)
      --noChmod                don't sync permission mode of files
      --noTimes                don't sync modification time of files
      --path-warnings          print warnings on duplicate target paths etc.
      --quiet                  build in quiet mode
      --renderToMemory         render to memory (only useful for benchmark testing)
  -s, --source string          filesystem path to read files relative from
      --templateMetrics        display metrics about template executions
      --templateMetricsHints   calculate some improvement hints when combined with --templateMetrics
  -t, --theme strings          themes to use (located in /themes/THEMENAME/)
      --themesDir string       filesystem path to themes directory
      --trace file             write trace to file (not useful in general)
  -v, --verbose                verbose output
      --verboseLog             verbose logging
  -w, --watch                  watch filesystem for changes and recreate as needed

Use "hugo [command] --help" for more information about a command.
```

## Hugo命令

最常见的用法就是直接运行 `hugo`，当前目录是输入目录。默认情况下，这会将您的网站生成到 `public/` 目录，当然可以通过更改 `publishDir` 字段的输出目录（[站点配置](configuration)）。

命令hugo将网站渲染到 `public/` 目录，并准备好部署到您的Web服务器：

```bash
hugo
0 draft content
0 future content
99 pages created
0 paginator pages created
16 tags created
0 groups created
in 90 ms
```

## Draft，Future和Expired内容

Hugo允许你在每篇内容的 [front matter](/content-management/front-matter) 设置 `draft` （是否是草稿）、 `publishdate` （发布时间）、 `expirydate` （过期时间）。默认情况下Hugo不会发布：

* `publishdate` 值在未来的内容
* `draft: true` 的内容
* `expirydate`值在过去的内容

通过在 `hugo` 和 `hugo server` 中分别添加以下标志，或者在 [配置](configuration) 中更改分配给同名字段（不带 -- ）的布尔值，可以在本地开发和部署期间覆盖所有这三个：

* `--buildFuture`
* `--buildDrafts`
* `--buildExpired`

## 自动重新载入（LiveReload）

Hugo内置了LiveReload。且不需要额外安装软件包。在开发网站时使用Hugo的一种常用方法是让Hugo使用 `hugo server` 命令运行服务器并监视更改：

```bash
hugo server
0 draft content
0 future content
99 pages created
0 paginator pages created
16 tags created
0 groups created
in 120 ms
Watching for changes in /Users/yourname/sites/yourhugosite/{data,content,layouts,static}
Serving pages from /Users/yourname/sites/yourhugosite/public
Web Server is available at http://localhost:1313/
Press Ctrl+C to stop
```

这将运行功能完备的Web服务器，同时在项目录的以下区域内监视文件系统的添加、删除或更改：

* `/static/*`
* `/content/*`
* `/data/*`
* `/i18n/*`
* `/layouts/*`
* `/themes/<CURRENT-THEME>/*`
* `config`

每当您进行更改时，Hugo将同时重建网站并继续提供内容。一旦构建完成，LiveReload就会告诉浏览器静默重新加载页面。

大多数Hugo构建都非常快，除非直接在浏览器中查看站点，否则您可能不会注意到更改。这意味着在第二台显示器（或当前显示器的另一半）上保持站点打开，可以让您查看最新版本的网站，而无需离开文本编辑器。

> Hugo在模板中 `</body>` 之前注入了LiveReload `<script>`，因此如果此标记不存在，则LiveReload将不起作用。

### 禁用LiveReload

LiveReload通过将JavaScript注入Hugo生成的页面来工作。该脚本创建从浏览器的Web套接字客户端到Hugo Web套接字服务器的连接。

LiveReload非常适合开发。但是，一些雨果用户可能会在生产中使用hugo服务器来即时显示更新的内容。以下方法可以轻松禁用LiveReload：

```bash
hugo server --watch=false
```

或者

```bash
hugo server --disableLiveReload
```

通过将以下键值分别添加到 `config.toml` 或 `config.yml` 文件中：

```toml
disableLiveReload = true
```

```yml
disableLiveReload: true
```

## 部署您的网站

在运行 `hugo server` 进行本地Web开发之后，最终的需要使用 `hugo` 命令（不要 `server` 部分）来重建您的站点。然后，您可以通过将 `public/` 目录复制到生产Web服务器来部署站点。

由于Hugo生成静态网站，您的网站可以使用任何Web服务器托管在任何地方。有关由Hugo社区提供的托管和自动化部署的方法，请参阅 [主机和部署](https://gohugo.io/hosting-and-deployment/) 。

> 运行hugo删除上次构建的文件。这意味着您应该在运行hugo命令之前删除您的 `/public`（或通过标志或配置文件指定的发布目录）。如果您不删除这些文件，则存在不应该出现的文件（例如，drafts或future的帖子），却留在生成的网站中的风险。

### 开发和部署输出目录

Hugo在构建之前不会删除生成的文件。一个简单的解决方法是针对开发和部署使用不同的输出目录。

要启动构建草稿内容的服务器（有助于编辑），您可以指定不同的目标;例如，`dev/` 目录：

```bash
hugo server -wDs ~/Code/hugo/docs -d dev
```

当内容准备好发布时，使用默认的 `public/` 目录：

```bash
hugo -s ~/Code/hugo/docs
```

这可以防止草稿内容意外变为可用。
