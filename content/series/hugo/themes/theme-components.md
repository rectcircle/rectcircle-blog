---
title: "主题组件"
date: 2019-04-30T19:46:40+08:00
draft: false
toc: true
weight: 20
summary: Hugo通过主题组件提供高级主题支持。
---

从Hugo 0.42开始，项目可以将主题配置为您需要的主题组件的组合：

```toml
theme = ["my-shortcodes", "base-theme", "hyde"]
```

你甚至可以嵌套它，让主题组件config.toml中的theme指向自己（主题继承）[^1]

config.toml中的主题定义示例创建了一个主题，其中包含3个主题组件，从左到右依次为优先级。

对于任何给定的文件，数据输入等，Hugo将首先查看项目，然后是`my-shortcode`，`base-theme`，最后是`hyde`。

Hugo使用两种不同的算法来合并文件系统，具体取决于文件类型：

* 对于`i18n`和`data`文件，Hugo使用文件中的翻译ID和数据键深入合并
* 对于静态，布局（模板）和原型文件，这些文件在文件级别合并。因此，将选择最左侧的文件。

这里定义的主题列表必须与`/your-site/themes`中的目录名严格匹配

还要注意，作为主题一部分的组件可以具有其自己的配置文件，例如，config.toml。目前，主题组件可以配置一些限制：

* `params`（全局和每种语言）
* `menu`（全局和每种语言）
* `outputformats` and `mediatypes`

这里适用相同的规则：具有相同ID的最左边的参数/菜单等将获胜。上面有一些隐藏的和实验性的命名空间支持，我们将来会努力改进它们，但是鼓励主题作者创建自己的命名空间以避免命名冲突。

[^1]: 对于在 [Hugo Themes Showcase](https://themes.gohugo.io/) 上托管的主题，需要将组件添加为指向目录`exampleSite/themes`的git子模块
