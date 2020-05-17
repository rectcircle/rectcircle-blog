---
title: "美化"
date: 2020-04-24T19:38:24+08:00
draft: false
toc: true
comments: true
weight: 200
summary: 优质扩展推荐——美化
---

## 前言

VSCode 基本页面布局目前无法通过扩展进行定制，但是官方提供了两种主题定制机制

* 颜色主题，可以定制定制
    * 页面各个部分的颜色
    * 编辑器各种语法高亮的颜色
* 图标主题
    * 定制各种文件的图标样式

以上这些主题可以通过 [商店](https://marketplace.visualstudio.com/search?sortBy=Installs&category=Themes&target=VSCode) 进行安装

## 颜色主题

### 切换方式

打开命令面板 `>Color Theme` 即可进行颜色主题切换

### 流行的颜色主题

* [Monokai Dark Soda](https://marketplace.visualstudio.com/items?itemName=AdamCaviness.theme-monokai-dark-soda)
* [Night Owl](https://marketplace.visualstudio.com/items?itemName=AdamCaviness.theme-monokai-dark-soda)
* [One Dark Pro](https://marketplace.visualstudio.com/items?itemName=zhuangtongfa.Material-theme)
* [One Monokai Theme](https://marketplace.visualstudio.com/items?itemName=azemoh.one-monokai)

## 图标主题

### 切换方式

打开命令面板 `>File Icon Theme` 即可进行颜色主题切换

### 流行的图标主题

* [Material Icon Theme](https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme)
* [vscode-icons](https://marketplace.visualstudio.com/items?itemName=vscode-icons-team.vscode-icons)
* [Material Theme Icons](https://marketplace.visualstudio.com/items?itemName=Equinusocio.vsc-material-theme-icons)

## Better Comments

[Better Comments](https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments) 是一个美化注释颜色的扩展，原生的注释的描述性文字颜色比较单一，而该扩展作用是根据特殊某些规则给注释文字染色以达到突出显示和美化的效果。内置5种高亮例子如下：

```java
/**
 * 正常注释
 * * 重要信息高亮
 * ! 危险信息提示
 * ? 疑问和不确定
 * TODO TODO 信息
 * // 被删除的注释
 */
class App {

}
```

该扩展同样支持通过 配置自定义颜色效果

```json
{
    "better-comments.tags":   {
        "tag": "!",
        "color": "#FF2D00",
        "strikethrough": false,
        "backgroundColor": "transparent"
    }
}
```

## Bracket Pair Colorizer 2

[Bracket Pair Colorizer 2](https://marketplace.visualstudio.com/items?itemName=CoenraadS.bracket-pair-colorizer-2) 是一个对括号匹配高亮的扩展，可以让我们一眼识别括号匹配情况。之前有一个V1的版本，V2版本提升了性能。
