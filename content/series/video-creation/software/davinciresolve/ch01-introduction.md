---
title: "Chapter 01. 达芬奇简介"
date: 2020-04-11T14:50:50+08:00
draft: true
toc: true
comments: true
weight: 100
summary: 本章节将阐述 达芬奇 的 功能简介，版本，安装，页面布局。建议自行探索各种按钮功能。
---

## 功能简介

达芬奇是 Blackmagic 公司出品的 一款提供 视频制作（剪辑） 一站式解决方案的软件。同时支持全平台。

主要提供如下视频制作过程中的如下功能

* 素材管理
* 剪辑
* 调色
* 视觉特效
* 动态图形
* 音频后期

在视频剪辑领域，达芬奇是主流的三款软件之一，另外两款分别是

* Mac 平台 Apple 出品的 Final Cut Pro X
* 全平台 Adobe 出品的 Premiere Pro

## 版本

按照付费与否 达芬奇 提供 两个版本

* DaVinci Resolve 免费版
* DaVinci Resolve Studio 付费版

按照更新情况，目前 DaVinci Resolve (Studio) 稳定版为 16， beta 版 17 已出。

## 安装

### MAC

Apple Store 搜索 davinci resolve 即可 安装 DaVinci Resolve (Studio) 16

## 界面和初始化操作

### 项目管理器

首次打开 达芬奇，第一个界面如下：

![project-page](/image/video-creator/davinciresolve/project-page.png)

* 最上方存在一个工具栏，有如下按钮
    * 数据库
    * 项目图标大小
    * 项目排序
    * 项目展示方式
    * 项目信息
    * 项目搜索
* 大片区域展示的是项目信息
* 最下方存在操作按钮

如果想更改项目数据存储（特别是 Windows 用户，不想将数据存储在 C 盘），点击数据库图标，新建数据库，选择这个数据库后，再执行如下操作。

点击新建项目，输入项目名称，点击创建，即可进入主界面

### 主界面

Mac特别注意：点击全屏按钮后，退出全屏 工作区 > Full Screen Window

![main-page](/image/video-creator/davinciresolve/main-page.png)

这个界面从上到下，分为三个区域

* 菜单栏
* 操作区
* 底栏

操作区的功能由底栏的图标进行切换，使用上和智能手机的交互逻辑类似

底栏包括如下图标/功能

* 工作流
    * 媒体：导入素材并进行分类
    * 快编：视频粗剪
    * 剪辑：精细剪辑
    * Fusion：效果制作
    * 调色：调色
    * Fairlight：音频调整
    * 交付：导出
* 其他
    * 项目管理器
    * 项目设置

### 媒体

> [开放版权素材](https://www.zhihu.com/question/22449745)

页面布局

![media-page](/image/video-creator/davinciresolve/media-page.png)

* 左上
    * 媒体浏览器
    * 素材监视器
* 左下
    * 媒体池
* 右侧（选择素材后，并点击右上角按钮）
    * 素材音频信息
    * 素材源元数据
    * 采集

一般工作流

* 在 媒体浏览器 查找素材
* 在 素材监视器 回看视频，并查看元数据
* 将素材加入到 媒体池 中

注意：在第一个视频加入 媒体池 中时，项目时间轴 分辨率 就需要决定，因为后续无法更改（仅测试似乎可以？）。右下角项目设置 -> 主设置 -> 时间轴分辨率

### 剪辑

和快剪可以相互替代，剪辑更常用

页面布局

![clip-page](/image/video-creator/davinciresolve/clip-page.png)

* 左上：媒体池
* 右上：素材和时间线监视器
* 右上：效果检查器（通过右上角 检查器 按钮打开）
* 左下：特效库（通过 左上角 特效库 按钮打开）
* 右下：时间线

一般工作流

* 媒体池 筛选 素材，双击选中
* 在素材监视器，通过 I O 键（或者 >| 和 |< 图标）打下出入点
* 将视频拖拽到已有或新建的时间轴，通过 检查器 > 视频 配置各种参数
* 重复以上步骤
* 选择特效库的某个特效，将其拖拽到时间轴的素材中，通过 检查器 配置参数

### 快剪

和剪辑可以相互替代，适合视频粗剪

布局

![quickclip-page](/image/video-creator/davinciresolve/quickclip-page.png)

* 左上：媒体池
* 右上：合并了 素材 和 时间线 监视器
* 下：时间轴上，添加了 时间线总览

### Fusion 效果制作

和 Adobe AE 类似，暂略

### 调色

布局

![color-page](/image/video-creator/davinciresolve/color-page.png)

* 左上：预设区（通过上方按钮调出）
* 中上：监视器
* 右上：节点区（通过上方按钮调出）
* 中：时间线（通过上方按钮调出）
* 下：调色功能面板

### Fairlight

布局

![fairlight-page](/image/video-creator/davinciresolve/fairlight-page.png)

* 左：音频特效库（上方 特效库 按钮调出）
* 中上：音频表
* 右上：监视器
* 中下：音频时间线
* 右下：调音台

### 交付

布局

![deliver](/image/video-creator/davinciresolve/deliver-page.png)

* 左上：渲染设置
* 中上：监视器
* 右上：渲染队列
* 下：时间线

互联网平台，一般选择

* MP4 封装
* H.264 编码
