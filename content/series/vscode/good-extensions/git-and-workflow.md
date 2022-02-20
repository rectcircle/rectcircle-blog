---
title: "Git 和 工作流"
date: 2020-05-26T23:27:41+08:00
draft: false
toc: true
comments: true
weight: 300
summary: 优质扩展推荐——Git和工作流
---

## 前言

如果熟悉 git 命令，使用命令操作可能更高效且知识的迁移性更高。

另一方面，以下扩展如果熟练使用的话可能更直观快捷，如下扩展在功能上可能存在重复，可以对比选择使用。

## Git Graph

[Git Graph](https://marketplace.visualstudio.com/items?itemName=mhutchie.git-graph) 专注于可视化 git 的 分支图。通过该扩展可以直观的看到分支合并情况，代码变更与比较

使用方式

* 通过 `>git graph: View Git Graph` 命令
* 通过 状态栏 的 `Git Graph` 按钮

## GitHub Pull Requests and Issue

[GitHub Pull Requests and Issues](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github) 微软 Github 官方的 Github 管理工具，用于托管在 Github 上的 项目的工作流管理。

## GitLab Workflow

[GitLab Workflow](https://marketplace.visualstudio.com/items?itemName=fatihacet.gitlab-workflow)

类似于 GitHub Pull Requests and Issue 扩展。

Gitlab 一般用于企业级 项目管理，因此此扩展在日常搬砖过程中非常有用。

### 基本配置

* 前往 profile/personal_access_tokens 页面生成 Token 勾选如下权限，然后点击生成，然后复制备用
    * `api`
    * `read_user`
* 打开 VSCode，输入 命令 `>GitLab: Set GitLab Personal Access Token`
    * 首先输入 Gitlab 的首页
    * 然后输入 粘贴 刚刚复制的 token

如果是私有部署的Gitlab，需要在设置中配置

```json
{
    "gitlab.instanceUrl": "https://my-gitlab-domain.com"
}
```

### 功能

* 状态栏显示流水线/MR数目和基本状态
* 活动栏查看 Issue / MR 列表
* 一些命令，通过 `>Gitlab:` 前缀可以查看，这里展示几个常用的
    * `>gitlab create snippet` 快速创建 代码片段
    * `>gitlab create new issue on current project` 快速打开创建 issue 页面
    * `>gitlab create new merge request on current project` 快速为当前分支创建 MR
    * `>gitlab open` 快速打开系列

## Git History

[Git History](https://marketplace.visualstudio.com/items?itemName=donjayamanne.githistory)

类似于 Git Graph，可以通过 命令 `> Git: View History` 打开，或者通过 源代码管理 侧边栏的标题上的图标进入

## Project Manager

[Project Manager](https://marketplace.visualstudio.com/items?itemName=alefragnani.project-manager)

工作空间管理，在项目非常多的情况可以使用。类似于项目收藏夹的功能，可以快速一键打开项目。具体功能如下

* 通过 `> Project Manager:` 前缀 可以列出所有命令列表
* 提供一个侧边栏，通过活动栏的按钮打开侧边栏
* 项目管理主要通过JSON配置文件的方式进行管理，可以通过 `>project manager: edit projects` 打开
    * 目前仅 `name`, `rootPath`, and `enabled` 字段被使用
    * `$home` 将会替换为用户家目录

```json
    {
        "name": "Numbered Bookmarks",
        "rootPath": "$home\\Documents\\GitHub\\vscode-numbered-bookmarks",
        "paths": [],
        "group": "",
        "enabled": true
    }
```

## GitLens — Git supercharged

[GitLens — Git supercharged](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)

GitLens 功能十分强大，基本特性如下

* 在当前行尾以浅色字体显示
    * 当前行的作者，最后提交时间，提交消息
* 在文件头部显示作者，最新更新时间，点击作者可以打开 File blame annotation 视图
* 提供一个功能丰富的侧边栏
    * 代码仓库视图
    * 文件历史视图
    * 行历史视图
    * 自定义搜索视图
    * 比较视图
* 👍File blame annotation 视图，展示文件每一行的提交信息
    * 通过 `>gitlens.toggleFileBlame` 命令或者左上角 图标打开
* 👍文件热度图
    * 通过 `>gitlens.toggleFileHeatmap` 命令打开
    * 通过 `"gitlens.heatmap.toggleMode": "window"` 配置命令适用于整个窗口
* 👍高亮显示当前文件最后一次更改内容
    * 通过 `>gitlens.toggleFileRecentChanges` 命令打开
    * 通过 `"gitlens.recentChanges.toggleMode": "window"` 配置命令适用于整个窗口

配置说明： https://github.com/eamodio/vscode-gitlens#gitlens-settings-

## gitignore

[gitignore](https://marketplace.visualstudio.com/items?itemName=codezombiech.gitignore)

一个很有用的小扩展，根据类型给你的 项目添加 gitignore `>add gitignore`

## Open in GitHub, Bitbucket, Gitlab, VisualStudio.com

[Open in GitHub, Bitbucket, Gitlab, VisualStudio.com !](https://marketplace.visualstudio.com/items?itemName=ziyasal.vscode-open-in-github)

通过 命令 `> open in` 快速打开当前文件在 github 类网站的页面
