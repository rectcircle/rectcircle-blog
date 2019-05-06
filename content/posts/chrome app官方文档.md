---
title: chrome app官方文档
date: 2017-04-10T12:22:35+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/59
  - /detail/59/
tags:
  - 前端
---

> https://developer.chrome.com/apps/about_apps


> **重要提示：**Chrome将会移除web app对Windows，Mac和Linux的支持。Chrome OS将继续支持Chrome应用。此外，Chrome和Web Store将继续支持在所有平台上的扩展。 [阅读公告](https://blog.chromium.org/2016/08/from-chrome-apps-to-web.html)并了解有关[迁移您的应用程序](https://developers.chrome.com/apps/migration)。

> 下一篇：[chrome app官方文档（二）](71)

## 目录
* [一、基础知识](#一、基础知识)
	* [1、什么是ChromeApp](#1、什么是ChromeApp)
	* [2、迁移你的webapp](#2、迁移你的webapp)
	* [3、创建你的第一个webapp](#3、创建你的第一个webapp)
	* [4、ChromeApps架构](#4、ChromeApps架构)
	* [5、ChromeApp生命周期](#5、ChromeApp生命周期)
	* [6、内容安全策略](#6、内容安全策略)
* [二、通过代码实验学习](#二、通过代码实验学习)
	* [0、构建一个TODO应用](#0、构建一个TODO应用)
	* [1、创建并运行Chrome App](#1、创建并运行Chrome App)
		* [（1）熟悉ChromeApp](#（1）熟悉ChromeApp)
		* [（2）在开发模式下安装Chrome应用](#（2）在开发模式下安装Chrome应用)
		* [（3）启动您完成的Hello World应用程序](#（3）启动您完成的Hello World应用程序)
		* [（4）用Chrome DevTools调试的Chrome应用](#（4）用Chrome DevTools调试的Chrome应用)
	* [2、导入现有的web应用程序](#2、导入现有的web应用程序)
		* [（1）导入现有的Todo应用程序](#（1）导入现有的Todo应用程序)
		* [（2）制作符合内容安全策略（CSP）的脚本](#（2）制作符合内容安全策略（CSP）的脚本)
		* [（3）将localStorage转换为chrome.storage.local](#（3）将localStorage转换为chrome.storage.local)
		* [（4）运行你最终完成的Todo应用](#（4）运行你最终完成的Todo应用)



## 一、基础知识
**************************************
### 1、什么是ChromeApp


### 2、迁移你的webapp
* 构建成web应用程序
* 建立一个扩展增强型网页
* 构建一个扩展
* 构建本机应用程序（使用 Electron 或 NW.js）

### 3、创建你的第一个webapp
A Chrome App contains these components:
一个chrome app 包含以下组件：
* `manifest.json`告诉chrome关于你的app是做什么的，如何启动，需要什么权限
* 后台脚本，用于创建活动页面负责管理应用程序的生命周期。
* 所有代码都必须包含在Chrome应用包。这包括HTML，JS，CSS和本机客户端模块。
* 所有图标和其他资产必须包含在软件包。

#### （1）创建`manifest.json`
```json
{
  "name": "Hello World!",
  "description": "My first Chrome App.",
  "version": "0.1",
  "manifest_version": 2,
  "app": {
    "background": {
      "scripts": ["background.js"]
    }
  },
  "icons": { "16": "calculator-16.png", "128": "calculator-128.png" }
}
```


#### （2）创建后台脚本
`background.js`文件
```js
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
    'outerBounds': {
      'width': 400,
      'height': 500
    }
  });
});
```

在上面的示例代码中，onLaunched事件 当用户开始该应用程序将被激发。然后，它会立即打开指定的宽度和高度的应用程序的窗口。你的后台脚本可能包含其他listener，窗口，发布消息，并启动数据，所有这一切都是由事件页面管理的应用。

#### （3）创建一个窗口页面
`window.html`文件
```html
<!DOCTYPE html>
<html>
  <head>
  </head>
  <body>
    <div>Hello, world!</div>
  </body>
</html>
```

#### （4）创建图表
将这些图标复制到您的项目文件夹中：
* [calculator-16.png](https://developers.chrome.com/static/images/calculator-16.png)
* [calculator-128.png](https://developers.chrome.com/static/images/calculator-128.png)


#### （5）运行您的app
**启用实验性api**
* 前往chrome://flags.
* 启用 实验性扩展程序 API
* 重启chrome

**运行你的app**
* 若要加载您的应用程序，通过点击设置图标，弹出的应用和扩展程序管理页面并选择`更多工具>扩展程序`
* 确保`开发者模式`**复选框**已被选中。
* 点击**加载已解压的扩展程序**按钮，浏览到您的应用程序的文件夹，然后单击确定。
* 点击新加入的app启动按钮


### 4、ChromeApps架构
Chrome Apps与用户的操作系统紧密集成。它们被设计为在浏览器标签之外运行，以便在离线和较差的的网络环境中也可以很好的运行，并且具有比典型的网络浏览环境中更强大的功能。App容器、编程和安全的模型来支持这些需求
	
#### （1）App容器
App容器指定义了可视化的外观和加载Chrome应用的行为。Chrome Apps 看起来和传统的web app不同是因为不会展示任何web页面的ui空间；他是一个简单的仅包含一个矩形的空白区域。这让一个app和系统原生的app相差无几。并且可以防止用户修改url弄乱程序逻辑

Chrome App的加载和web app 是不同的。虽然加载的内容的类型是相似的：HTML文档、CSS和JavaScript脚本，但是，Chrome App是在App容器中加载的，而不是浏览器标签。另外，app容器必须加载一个来自本地的main文档。这迫使Chrome App在离线的情况下至少要拥有最基本的功能，并且提供了一个执行严格安全的运行环境。



#### （2）编程模型
编程模型定义了chrome app的窗体行为和声明周期。类似与原生app，编程模型的目标是提供用户一个全程可空的app声明周期。chrome app的生命周期是依赖于浏览器窗体的行为和网络连接

"event page"通过响应用户操作和系统事件来管理Chrome应用程序生命周期。这个页面是不可见的，仅仅运行于后台，在系统关闭后自动关闭。它控制窗口在应用程序启动和关闭时如何打开关闭。


**app生命周期一览**
有关如何使用编程模型的详细说明，参见[Manage App Lifecycle](https://developers.chrome.com/apps/app_lifecycle)。以下是Chrome应用生命周期的简要总结，以帮助您快速开始：

|阶段|概述|
|----|----|
|Installation（安装）|用户选择安装应用程序并明确接受应用申请的[权限](https://developers.chrome.com/apps/declare_permissions)。|
|Startup（启动）|event page加载，'launch'事件触发，应用页面打开一个窗口，你可以[创建一个你的程序需要的窗体](https://developers.chrome.com/apps/app_lifecycle#eventpage)决定窗体的外观，如何与event page页面和其他窗口通讯|
|Termination（中止）|用户可以随时终止应用程序，应用程序可以快速恢复到以前的状态。[数据保护](https://developers.chrome.com/apps/app_lifecycle#local_settings)可防止数据丢失。|
|Update（更新）|随时可以更新应用程式；但是，Chrome应用程序正在运行的代码在Startup/Termination周期内无法更改。|
|Uninstallation（卸载）|用户可以主动卸载应用程序。卸载时，不会执行任何执行的代码或私人数据。|


#### （3）安全模型
Chrome Apps的安全模型通过确保用户信息以安全（safe）和安全（secure）的方式管理来保护用户。 [Comply with CSP](https://developers.chrome.com/apps/contentSecurityPolicy)包含有关如何遵守内容安全策略的详细信息。该策略阻止危险的脚本减少跨站脚本bug，并保护用户免受中间人攻击。

在本地加载Chrome App主页边提供了一个比web更安全性的环境。像Chrome扩展程序一样，用户必须明确同意在安装时信任Chrome App;他们授予应用程序权限以访问和使用其数据。您的应用程序使用的每个API都将有自己的权限。Chrome Apps安全模型还提供了在每个窗口基础上设置权限分离的功能。这样，您可以尽可能减少可以访问危险API的应用程序中的代码，同时仍然可以使用它们。

Chrome应用程序也使用和Chrome扩展一样的进程隔离，并更进一步的通过存储和外部内容。每个应用程序都有自己的私有存储区域，在浏览器中使用的网站的其他应用程序无法访问您的个人数据（如Cookie）。所有外部进程都与应用程序隔离。由于iframe的运行进程与周围的页面相同，所以它们只能用于加载其他应用页面。你能使用对象标签来[嵌入外部内容](https://developers.chrome.com/apps/app_external)，这样就会与应用程序的进程分离。

### 5、ChromeApp生命周期
app运行时和event page 将负责管理app的生命周期。app运行时管理app的安装，控制event page并可以在任何时候结束app。event page监听来自app运行时的事件并管理运行什么和如何运行


#### （1）生命周期如何工作
app运行时加载event page从用户桌面并且`onLaunch()`事件被触发。这个事件告诉eventpage窗口运行了和窗口的尺寸。声明周期图如下
![](/res/C9ReHdKB8an3vCJMK1l_kroO.png)

当eventpage内有要执行的Js，内有等待中的回调，且没有打开的窗口，运行时将卸载eventpage并关闭app。在卸载eventpage之前，`onSuspend()`事件将会触发。这将给eventpage一个在应用关闭前去做简单的清理任务的机会。


#### （2）创建event page和窗口
所有的app必须有一个event page。这个页面包含应用的顶层逻辑，他没有自己的UI，他的职责是创建窗口和其他的app页面

**创建event page**
要创建event page，定义在app manifest文件的`background`的`scripts`字段中。任何需要使用的库的脚本必须要添加到background中。
```js
"background": {
  "scripts": [
    "foo.js",
    "background.js"
  ]
}
```
你的event page必须包含`onLaunched()`函数。这个函数将会调用当你的app启动时。

```js
chrome.app.runtime.onLaunched.addListener(function() {
  // Tell your app what to launch and how.
});
```

**创建窗口**
	一个event page根据情况可能创建一个或多个窗口。在默认情况下，这些窗口是通过与event page的脚本连接创建的，并且可以由event page直接脚本化。

Chrome app 的 窗口与任何Chrome浏览器视窗无关。它们有一个带有标题栏和大小控件的可选框架，以及一个推荐的窗口ID。没有ID的Windows将无法恢复到重新启动后的大小和位置。

以下是从background.js创建窗口的示例：
```js
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('main.html', {
    id: 'MyWindowID',
    bounds: {
      width: 800,
      height: 600,
      left: 100,
      top: 100
    },
    minWidth: 800,
    minHeight: 600
  });
});
```

**包含启动数据**

根据应用程序的启动方式，您可能需要处理event page中的启动数据。默认情况下，应用启动器启动应用时，没有启动数据。对于文件处理的app来说，你必须处理`launchData.items`参数来允许他们使用文件启动

#### （3）监听app运行时事件
app运行时控制app安装更新卸载。您不需要做任何事情来设置应用程序运行时，此外您的event page可以监听`onInstalled()`事件以存储本地设置和`onSuspend()`事件，以便在事件页面卸载之前执行简单的清理任务。

**储存本地设置**

`chrome.runtime.onInstalled() `在你的app被安装的开始时或者在更新时调用。event page可以监听这个事件使用[torage API](https://developers.chrome.com/apps/storage)或者更新本地设置（可以转到 [Storage options](https://developers.chrome.com/apps/app_storage#options)）

```js
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.set(object items, function callback);
});
```

**防止数据丢失**
用户可能在任何时间卸载你的app。当卸载时，没有执行代码或私人数据会被遗留下来。这可能会导致数据丢失，因为用户可能会卸载具有本地编辑的不同步数据的应用程序。您应该隐藏数据以防止数据丢失。

至少应该存储用户设置，以便用户重新安装应用程序时，他们的信息仍然可以重用。使用Storage API([storage.sync](https://developers.chrome.com/apps/storage#property-sync))，用户数据可以自动与Chrome同步而同步。

**在app关闭前清理**

app运行时会在卸载event page前触发`onSuspend()`。您的活动页面可以侦听此事件并执行清理任务，并在应用关闭之前保存状态。

一旦这个事件被触发，app运行时开始关闭app的流程。如果app有打开的窗口，它可能会在将来通过`onRestarted`事件重新启动。在这种情况下，app应该保存当前状态为持久存储以便于可以在`onRestarted`中可以恢复到当前状态。app只有一点时间去保存状态，在他被关闭前，因此更好的方法时在app正常运行的时候保存状态。

在接收到`onSuspend`事件并没有进一步事件将传递给到app。除非因某种原因中止暂停。在这种情况下，onSuspendCanceled将被传递到应用程序，在这种情况下，`onSuspendCanceled`将被传递到应用程序，并且该应用程序将不会被关闭。
```js
chrome.runtime.onSuspend.addListener(function() {
  // Do some simple clean-up tasks.
});
```


### 6、内容安全策略
如果您不熟悉内容安全策略（CSP）,[容安全策略简介](http://www.html5rocks.com/en/tutorials/security/content-security-policy/)是一个好的开始。该文件涵盖CSP的更广泛的网络平台视图;Chrome App CSP没有那么灵活。您还应阅读[Chrome扩展内容安全性策略](https://developers.chrome.com/extensions/contentSecurityPolicy)，因为它是Chrome App CSP的基础。为了简洁起见，我们在这里不再重复相同的信息。

CSP是一种减轻跨站点脚本问题的策略，我们都知道跨站点脚本不好。我们不会试图说服你，CSP是一个温暖和模糊的新政策。有工作涉及你需要学习如何做不同的基本任务。

本文档的目的是告诉您CSP策略对于Chrome应用程序是什么，您需要做什么来遵守它，以及如何仍然以符合CSP的方式执行这些基本任务

#### （1）什么是Chrome应用的CSP？
Chrome应用的内容安全性政策会限制您执行以下操作：
* 您不能在Chrome应用程序页面中使用内联脚本。该限制禁止`<script>`块和事件处理程序（`<button onclick =“...”>`）。
* 您无法引用任何应用程序文件中的任何外部资源（视频和音频资源除外）。您无法将外部资源嵌入到iframe中。
* 不能使用像`eval()`和`new Function()`这样的字符串转为js函数

这是通过以下策略值实现的：
```
default-src 'self';
connect-src * data: blob: filesystem:;
style-src 'self' data: chrome-extension-resource: 'unsafe-inline';
img-src 'self' data: chrome-extension-resource:;
frame-src 'self' data: chrome-extension-resource:;
font-src 'self' data: chrome-extension-resource:;
media-src * data: blob: filesystem:;
```

你的Chrome App只能引用你的app内的脚本和队形，媒体文件除外（应用程序可以参考包装外的视频和音频）。Chrome扩展程序将让您放松默认的内容安全策略; Chrome App不会。

#### （2）如何遵守CSP
所有JavaScript和所有资源都应该是本地的（所有内容都会在您的Chrome应用程序中打包）。

#### （3）但是其他情况怎么办
很可能您正在使用模板库，其中许多不能与CSP一起使用。您可能还想访问应用程序中的外部资源（外部图像，来自网站的内容）。

**使用模板库**
使用一个提供预编译模板的库，您已经设置好了。您仍然可以使用一个不提供预编译的库，但是它将需要您的一些工作，并且有限制。

您将需要使用沙盒来隔离您想要做的“eval”事物的任何内容。沙箱将CSP提供给您指定的内容。如果您想在Chrome应用中使用非常强大的Chrome API，您的沙盒内容无法直接与这些API进行交互（转到 [Sandbox local content](https://developers.chrome.com/apps/app_external#sandboxing)）


**访问远程资源**
您可以通过XMLHttpRequest获取远程资源，并通过 `blob:`, `data:`, 或者 `filesystem:`URLs (转到[引用外部资源](https://developers.chrome.com/apps/app_external#external))。

视频和音频可以从远程服务加载，因为它们在脱机或点连接时具有良好的后备行为。

**嵌入网页内容**
而不是使用iframe，您可以使用webview标签调用外部URL (转到[嵌入外部网页](https://developers.chrome.com/apps/app_external#webview)).


## 二、通过代码实验学习
******************************************
### 0、构建一个TODO应用
欢迎来到Chrome App代码实验

接下来的每一步将学习关于构建Chrome app的基本块。在完成代码实验后，你将完成一个具有丰富功能的可以安装的离线TODO应用

完整的Todo应用程序可以[从Chrome网上应用店安装](http://goo.gl/qNNUX)。

在此过程中，你将学到：
* 在[步骤1]()，如何创建运行和调试Chrome App
* 在[步骤2]()，如何更新已经存在的ChromeApp，处理安全策略问题，添加本地存储的功能
* 在[步骤3]()，如何在中实现警报和通知。
* 在[步骤4]()，如何直接显示网页
* 在[步骤5]()，如何从外部来源加载资源（如图像）
* 在[步骤6]()，如何写入本机文件系统中的文件
* 在[步骤7]()，如何将您的应用发布到Chrome网上应用店

为代码实验你需要准备一下内容
* 使用最新版本的[Google Chrome](https://www.google.com/intl/en/chrome/browser/)
* 准备一个空的项目目录
* [下载参考代码](https://github.com/mangini/io13-codelab/archive/master.zip)或者在[github](https://github.com/mangini/io13-codelab/tree/master/cheat_code)上查看

每一步都建立在以前的基础之上。您可以跳过任何步骤，并在参考代码中使用之前的步骤解决方案。

让我们开始吧，跳到[步骤1、创建并运行Chrome App](#1、创建并运行Chrome App)


### 1、创建并运行Chrome App
在此步骤中，您将学习到：
* Chrome应用的基本构建块，包括清单文件和后台脚本。
* 如何安装，运行和调试Chrome应用程序。

*预计完成此步骤的时间：10分钟。*

要预览您将在此步骤中完成的内容，跳到[本步骤的底部](#（3）启动您完成的Hello World应用程序)

#### （1）熟悉ChromeApp
Chrome应用程序包含以下组件：
* manifest将指定app的元信息，manifest告诉Chrome你的app如何启动和去所需权限
* **event page**又称后台脚本，他负责管理app 的生命周期。背景脚本是您为特定应用程序事件（如启动和关闭应用程序的窗口）注册侦听器的地方。
* 所有代码文件必须打包在Chrome应用程序中。这包括HTML，CSS，JS和Native Client模块。
* 资源包括app图标也应该打包到app中

**创建manifest**
打开你的代码编辑器创建如下内容的manifest.json
```json
{
  "manifest_version": 2,
  "name": "Codelab",
  "version": "1",
  "icons": {
    "128": "icon_128.png"
  },
  "permissions": [],
  "app": {
    "background": {
      "scripts": ["background.js"]
    }
  },
  "minimum_chrome_version": "28"
}
```

注意这个清单如何描述一个名为background.js的后台脚本。您将创建该文件。
```json
"background": {
  "scripts": ["background.js"]
}
```

我们稍后将在此步骤中为您提供一个应用图标：
```json
"icons": {
  "128": "icon_128.png"
},
```

**创建一个后台脚本**
```js
/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    id: 'main',
    bounds: { width: 620, height: 500 }
  });
});
```

这个后台脚本只是等待应用程序的chrome.app.runtime.onLaunched启动事件并执行回调函数：

```js
chrome.app.runtime.onLaunched.addListener(function() {
  //...
});
```

当Chrome应用启动时，`chrome.app.window.create() `将使用基本的HTML页面（index.html）作为源来创建一个新窗口。您将在下一步中创建HTML视图。
```js
chrome.app.window.create('index.html', {
  id: 'main',
  bounds: { width: 620, height: 500 }
});
```

背景脚本可能包含其他侦听器，窗口，发布消息和启动数据 - 所有这些都由event page用于管理应用程序。

**创建一个HTML视图**

创建一个简单的网页，向屏幕显示一个“Hello World”消息，并将其保存为index.html：
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body>
  <h1>Hello, let's code!</h1>
</body>
</html>
```

就像任何其他网页一样，在这个HTML文件中，您可以包含其他打包的JavaScript，CSS或资源。

**添加应用app图标**
右键单击另存为，并将此128x128图像添加到项目文件夹中命名为icon_128.png：
![](/res/S2FFlGBk2RcqF9F9IPaEKGDr.png)

您将使用此PNG作为用户将在启动菜单中看到的应用程序的图标。

确认您已经创建了所有文件：
```
background.js
icon_128.png
index.html
manifest.json
```

#### （2）在开发模式下安装Chrome应用
使用开发人员模式可以快速加载和启动应用程序，而无需将应用程序定为分发包。
* 前往chrome://flags.
* 启用 实验性扩展程序 API
* 重启chrome
* 使用文件选择器对话框，导航到您的应用程序的项目文件夹，并选择它来加载您的应用程序。

#### （3）启动您完成的Hello World应用程序
将项目加载为解压缩的扩展名后，单击已安装应用程序旁边的启动。应该开辟一个新的独立窗口

恭喜，您刚刚创建了一个新的Chrome应用程序！


#### （4）用Chrome DevTools调试的Chrome应用
您可以像常规网页一样使用[Chrome开发者工具](https://developers.chrome.com/devtools)来检查，调试，审核和测试您的应用。

在您更改代码并重新加载应用程序之后（右键单击>刷新APP），检查DevTools控制台是否有任何错误（右键单击>检查元素）。

（我们将在步骤3中介绍带有报警的Inspect Background页面选项。）

DevTools JavaScript控制台可以访问与您应用程序相同的API。在将API调用添加到代码之前，您可以轻松测试API调用

#### 了解更多信息
有关此步骤中介绍的一些API的更多详细信息，请参阅：
* [Manifest文件格式](https://developers.chrome.com/apps/manifest)
* [Manifest图标](https://developers.chrome.com/apps/manifest/icons)
* [ChromeApp生命周期](#5、ChromeApp生命周期)
* [chrome.app.runtime.onLaunched](https://developers.chrome.com/apps/app_runtime#event-onLaunched)
* [chrome.app.window.create()](https://developers.chrome.com/apps/app_window#method-create)

准备继续下一步吗？ 转到[步骤2 - 导入现有的web应用程序](#2、导入现有的web应用程序)

### 2、导入现有的web应用程序
> 想从这里开始新鲜？你可以找到以前的代码在[参考代码zip压缩包](https://github.com/mangini/io13-codelab/archive/master.zip)下面的`cheat_code > solution_for_step1`

在此步骤中，您将学习到：

* 调整Chrome应用平台的现有网路应用程式。
* 如何使您的应用脚本与容安全策略（CSP）相兼容。
* 如何使用`chrome.storage.local`实现本地存储。

*预计完成此步骤的时间：20分钟。*

要预览您将在此步骤中完成的内容，[跳到底部](#)

#### （1）导入现有的Todo应用程序
在刚开始，导入基于TodoMVC的vanillaJs版，一个通用的基准测试应用程序。

我们已经包含了一个版本的TodoMVC App，在[参考代码zip压缩包](https://github.com/mangini/io13-codelab/archive/master.zip)里面的`todomvc`文件夹。将所有文件（包括文件夹）从`todomvc`复制到项目文件夹中（第一步的项目文件夹）。

您将被要求替换index.html。请点击替换

您应该在应用程序文件夹中具有以下文件结构：
```
bower_components/
js/
background.js
bower.json
icon_128.png
index.html
manifest.json
```

重新加载您的应用程序（右键单击>重新加载应用程序）。您应该会看到基本的UI，但是您将无法添加新的todos。

#### （2）制作符合内容安全策略（CSP）的脚本
打开DevTools控制台（右键单击>检查元素，然后选择控制台选项卡）。您将看到有关拒绝执行内联脚本的错误：
```
index.html:
Refused to execute inline script because it violates the following Content Security Policy directive: "default-src 'self' blob: filesystem: chrome-extension-resource:". Either the 'unsafe-inline' keyword, a hash ('sha256-RNJJ2QC+g0C8Zb1eWtKgVt3qRvz/TGhSINjoqQ886nc='), or a nonce ('nonce-...') is required to enable inline execution. Note also that 'script-src' was not explicitly set, so 'default-src' is used as a fallback.
```

我们来解决这个错误，使得应用符合[内容安全策略（CSP）](https://developers.chrome.com/apps/contentSecurityPolicy)。最常见的违反CSP是由内联JavaScript引起的。在这个例子中内联js作为dom的属性（例如：`<button onclick=''>`）和`<script>`标签使用在了HTML的内容里。

解决方案很简单：将内联内容移动到新文件。


* 在`index.html`底部，删除内联JavaScript代替为引入`js/bootstrap.js`

```html
  <script src="bower_components/director/build/director.js"></script>
  <script>
    // Bootstrap app data
    window.app = {};
  </script>
  <script src="js/helpers.js"></script>
  <script src="js/store.js"></script>
```
改为
```html
<script src="bower_components/director/build/director.js"></script>

<script src="js/bootstrap.js"></script>
<script src="js/helpers.js"></script>
<script src="js/store.js"></script>
```

* 在js文件夹中创建名为`bootstrap.js`的文件。将以前的内联代码移动到此文件中：

```js
// Bootstrap app data
window.app = {};
```

如果您现在重新加载应用程序，您仍然得到一个非工作的Todo应用程序，但是您离成功越来越近了。



#### （3）将localStorage转换为chrome.storage.local
如果现在打开DevTools控制台，以前的错误应该没有了。但是，有一个新的错误，关于window.localStorage不可用：
```
window.localStorage is not available in packaged apps. Use chrome.storage.local instead.
```
Chrome Apps不支持[`localStorage`](http://dev.w3.org/html5/webstorage/#the-localstorage-attribute)，因为`localStorage`是同步的。在单线程运行时同步访问阻塞资源（I/O）可能会使您的应用程序无响应。

Chrome应用程序具有可以异步存储对象的等效API。这将帮助你避免一些昂贵的 `object->string->object` 的序列化过程。

要解决我们的应用程序中的错误消息，您需要将`localStorage`转换为[`chrome.storage.local`](https://developers.chrome.com/apps/storage)。

**更新应用的权限**
为了使用`chrome.storage.local`，您需要请求`storage`权限。在`manifest.json`文件中，在permissions （权限）数组中添加"storage"：
```json
"permissions": ["storage"],
```

**了解`local.storage.set()`和`local.storage.get()`**
要保存并检索待办事项， 你需要了解chrome.storage API中的`set()`和`get()`方法。

`set()`方法接受键值对对象作为其第一个参数。可选的回调函数是第二个参数。例如：
```js
chrome.storage.local.set({secretMessage:'Psst!',timeSet:Date.now()}, function() {
  console.log("Secret message saved");
}); 
```

`get()`方法接受您希望检索的数据存储键的可选第一个参数。单个键可以作为字符串传递;多个键可以被排列成字符串或字典对象的数组
```js
chrome.storage.local.get(['secretMessage','timeSet'], function(data) {
  console.log("The secret message:", data.secretMessage, "saved at:", data.timeSet);
});
```

如果要`get()`当前在`chrome.storage.local`中的所有内容，请省略第一个参数：
```js
chrome.storage.local.get(function(data) {
  console.log(data);
}); 
```

与`localStorage`不同，您将无法使用DevTools资源面板检查本地存储的项目。但是，您可以从JavaScript控制台与chrome.storage进行交互

**预览所需的API更改**

对Todo应用程序的修正的大部分剩余步骤是对API调用的小小更改。这需要更改所有使用到localStorage的地方，尽管这耗时、容易出错，但这是必须的。

> 为了最大限度地发挥这个codelab的乐趣，重写来自zip中`cheat_code/solution_for_step_2`的`store.js`、`controller.js`和  `model.js`是最好的。

> 一旦你决定这么做，继续阅读，我们将逐个呈现每个变更。


`localStorage`和`chrome.storage`之间的关键区别来自于`chrome.storage`的异步性质：

* 您可以使用`chrome.storage.local.set()`和可选的回调函数，而不是使用简单的赋值写入`localStorage`。
```js
var data = { todos: [] };
localStorage[dbName] = JSON.stringify(data);
```
与
```js
var storage = {};
storage[dbName] = { todos: [] };
chrome.storage.local.set( storage, function() {
  // optional callback
});
```
* 不是直接访问`localStorage[myStorageName]`，您需要使用`chrome.storage.local.get(myStorageName，function（storage）{...})`，然后在回调函数中解析返回的存储对象。
```js
var todos = JSON.parse(localStorage[dbName]).todos;
```
与
```js
chrome.storage.local.get(dbName, function(storage) {
  var todos = storage[dbName].todos;
});
```
*  函数`.bind(this)`被用在所有的回调函数中来确保`this`引用的是`Store` prototype（原型）的`this`。（有关绑定函数的更多信息可以在MDN文档中找到：[`Function.prototype.bind()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)。）
```js
function Store() {
  this.scope = 'inside Store';
  chrome.storage.local.set( {}, function() {
    console.log(this.scope); // outputs: 'undefined'
  });
}
new Store();
```
与
```js
function Store() {
  this.scope = 'inside Store';
  chrome.storage.local.set( {}, function() {
    console.log(this.scope); // outputs: 'inside Store'
  }.bind(this));
}
new Store();
```

考虑到以下几个部分中的检索，保存和删除项目，请牢记以上这些关键差异。

**检索todo项**
我们更改Todo应用程序以检索todo项：

1\. Store构造函数负责加载所有来自本地的已存在的todo项来初始化TODO App。该方法首先检查数据存储是否存在。如果没有，它将创建一个空数组的todos并将其保存到数据存储区，因此就不会出现运行时读取错误。

在 `js/store.js`中，在构造函数方法中，将使用`localStorage` 更改为使用`chrome.storage.local`：

```js
function Store(name, callback) {
  var data;
  var dbName;

  callback = callback || function () {};
  
  dbName = this._dbName = name;

//去掉以下内容
  if (!localStorage[dbName]) {
    data = {
      todos: []
    };
    localStorage[dbName] = JSON.stringify(data);
  }
  callback.call(this, JSON.parse(localStorage[dbName]));

//添加以下内容
  chrome.storage.local.get(dbName, function(storage) {
    if ( dbName in storage ) {
      callback.call(this, storage[dbName].todos);
    } else {
      storage = {};
      storage[dbName] = { todos: [] };
      chrome.storage.local.set( storage, function() {
        callback.call(this, storage[dbName].todos);
      }.bind(this));
    }
  }.bind(this));
}
```

2\. `find()`方法在从model中读取todo时使用。它返回结果根据你是否使用 "All", "Active", 或者 "Completed"等过滤词来检索。

更改`find()`使用`chrome.storage.local`：
```js
Store.prototype.find = function (query, callback) {
  if (!callback) {
    return;
  }
//注释部分删除
//  var todos = JSON.parse(localStorage[this._dbName]).todos;

//  callback.call(this, todos.filter(function (todo) {
  chrome.storage.local.get(this._dbName, function(storage) {
    var todos = storage[this._dbName].todos.filter(function (todo) {  
      for (var q in query) {
            if(query[q] !== todo[q]){
              return false;
            }
            return true;
      }
      });
    callback.call(this, todos);
  }.bind(this));
// }));
};
```

3\. 类似的`find()`,`findAll()`从model中获取todo的方法，都要改为 `chrome.storage.local`：
```js
Store.prototype.findAll = function (callback) {
  callback = callback || function () {};
//  callback.call(this, JSON.parse(localStorage[this._dbName]).todos);
  chrome.storage.local.get(this._dbName, function(storage) {
    var todos = storage[this._dbName] && storage[this._dbName].todos || [];
    callback.call(this, todos);
  }.bind(this));
};
```

**保存todo条目**
当前的`save()`方法提出了挑战，这取决于每次在整个单一JSON存储上运行的两个异步操作（get和set）。对多个todo项目的任何批次更新，如“将所有todos标记为已完成”，将导致称为`写后读取` http://en.wikipedia.org/wiki/Hazard_(computer_architecture)#Read_After_Write_.28RAW.29 的数据危险。如果我们使用更合适的数据存储（如IndexedDB），但是我们正在尽量减少此codelab的转换工作量，则不会发生此问题。

有几种方法来解决它，所以我们将利用这个机会来轻轻地重构save()，通过将一系列todo
 id同时更新：
 
 1\. 要开始，使用`chrome.storage.local.get()`回调方法将save()中的所有内容都包装起来：
```js
Store.prototype.save = function (id, updateData, callback) {
  chrome.storage.local.get(this._dbName, function(storage) {
    var data = JSON.parse(localStorage[this._dbName]);
    // ...
    if (typeof id !== 'object') {
      // ...
    }else {
      // ...
    }
  }.bind(this));
};
```

2\. 使用`chrome.storage.local`转换所有`localStorage`实例：
```js
Store.prototype.save = function (id, updateData, callback) {
  chrome.storage.local.get(this._dbName, function(storage) {
//    var data = JSON.parse(localStorage[this._dbName]);
    var data = storage[this._dbName];
    var todos = data.todos;

    callback = callback || function () {};

    // If an ID was actually given, find the item and update each property
    if ( typeof id !== 'object' ) {
      // ...

//      localStorage[this._dbName] = JSON.stringify(data);
//      callback.call(this, JSON.parse(localStorage[this._dbName]).todos);
      chrome.storage.local.set(storage, function() {
        chrome.storage.local.get(this._dbName, function(storage) {
          callback.call(this, storage[this._dbName].todos);
        }.bind(this));
      }.bind(this));
    } else {
      callback = updateData;

      updateData = id;

      // Generate an ID
      updateData.id = new Date().getTime();

//      localStorage[this._dbName] = JSON.stringify(data);
//      callback.call(this, [updateData]);
      chrome.storage.local.set(storage, function() {
        callback.call(this, [updateData]);
      }.bind(this));
    }
  }.bind(this));
};
```


3\. 然后更新逻辑以对数组而不是单个项进行操作：
```js
Store.prototype.save = function (id, updateData, callback) {
  chrome.storage.local.get(this._dbName, function(storage) {
    var data = storage[this._dbName];
    var todos = data.todos;

    callback = callback || function () {};

    // If an ID was actually given, find the item and update each property
    if ( typeof id !== 'object' || Array.isArray(id) ) {
      var ids = [].concat( id );
      ids.forEach(function(id) {
        for (var i = 0; i < todos.length; i++) {
          if (todos[i].id == id) {
            for (var x in updateData) {
              todos[i][x] = updateData[x];
            }
          }
        }
      });

      chrome.storage.local.set(storage, function() {
        chrome.storage.local.get(this._dbName, function(storage) {
          callback.call(this, storage[this._dbName].todos);
        }.bind(this));
      }.bind(this));
    } else {
      callback = updateData;

      updateData = id;

      // Generate an ID
      updateData.id = new Date().getTime();

      todos.push(updateData);
      chrome.storage.local.set(storage, function() {
        callback.call(this, [updateData]);
      }.bind(this));
    }
  }.bind(this));
};
```

**标记TODO项为完成**
现在该应用程序在数组上运行，您需要更改应用程序如何处理用户单击 **Clear completed (#)** 按钮

1\. 在`controller.js`中，更新`toggleAll()`仅使用todos数组来调用`toggleComplete()`，而不是逐个标记一个todo。还要删除对`_filter()`的调用，因为您将调整`toggleComplete _filter()`。
```js
Controller.prototype.toggleAll = function (e) {
  var completed = e.target.checked ? 1 : 0;
  var query = 0;
  if (completed === 0) {
    query = 1;
  }
  this.model.read({ completed: query }, function (data) {
    var ids = [];
    data.forEach(function (item) {
      //this.toggleComplete(item.id, e.target, true);
      ids.push(item.id);
    }.bind(this));
    this.toggleComplete(ids, e.target, false);
  }.bind(this));

  //this._filter();
};
```

2\. 现在更新`toggleComplete()`来接受一个todo或一个todos数组。这包括将`filter()`移动到`update()`内部，而不是外部。
```js
//Controller.prototype.toggleComplete = function (id, checkbox, silent) {
Controller.prototype.toggleComplete = function (ids, checkbox, silent) {
  var completed = checkbox.checked ? 1 : 0;
//  this.model.update(id, { completed: completed }, function () {
  this.model.update(ids, { completed: completed }, function () {
    if ( ids.constructor != Array ) {
      ids = [ ids ];
    }
    ids.forEach( function(id) {
      var listItem = $$('[data-id="' + id + '"]');
      
      if (!listItem) {
        return;
      }
      
      listItem.className = completed ? 'completed' : '';
      
      // In case it was toggled from an event and not by clicking the checkbox
      listItem.querySelector('input').checked = completed;
    });

    if (!silent) {
      this._filter();
    }

  }.bind(this));

//  if (!silent) {
//    this._filter();
//  }
};
```

**对todo项计数**
切换到异步存储后，当获得todos的数量时，会显示一个小错误。您需要将计数操作包含在回调函数中：

1\. 在`model.js`中, 更新 `getCount()` 接受一个回调：
```js
  Model.prototype.getCount = function (callback) {
  var todos = {
    active: 0,
    completed: 0,
    total: 0
  };
  this.storage.findAll(function (data) {
    data.each(function (todo) {
      if (todo.completed === 1) {
        todos.completed++;
      } else {
        todos.active++;
      }
      todos.total++;
    });
    if (callback) callback(todos);
  });
  //return todos;
};
```

2\. 返回到`controller.js`中，更新`_updateCount()`以使用上一步中编辑的async `getCount()`：
```js
Controller.prototype._updateCount = function () {
  //var todos = this.model.getCount();
  this.model.getCount(function(todos) {
    this.$todoItemCounter.innerHTML = this.view.itemCounter(todos.active);
    
    this.$clearCompleted.innerHTML = this.view.clearCompletedButton(todos.completed);
    this.$clearCompleted.style.display = todos.completed > 0 ? 'block' : 'none';
    
    this.$toggleAll.checked = todos.completed === todos.total;
    
    this._toggleFrame(todos);
  }.bind(this));

};
```

你几乎在那里！如果您现在重新加载应用程序，您将能够插入新的todos而不会出现任何控制台错误。

**删除todos项目**
现在应用程序可以保存待办事项，您已经完成了！当您尝试删除待办事项时，仍然会收到错误：
1\. 在 `store.js`中，将所有`localStorage`实例转换为使用`chrome.storage.local`：

a) 使用`get()`回调将所有已经在`remove()`中的内容包装起来：
```js
Store.prototype.remove = function (id, callback) {
  chrome.storage.local.get(this._dbName, function(storage) {
    var data = JSON.parse(localStorage[this._dbName]);
    var todos = data.todos;
    
    for (var i = 0; i < todos.length; i++) {
      if (todos[i].id == id) {
        todos.splice(i, 1);
        break;
      }
    }
    
    localStorage[this._dbName] = JSON.stringify(data);
    callback.call(this, JSON.parse(localStorage[this._dbName]).todos);
  }.bind(this));
};
```

b)然后转换`get()`回调中的内容：
```js
Store.prototype.remove = function (id, callback) {
  chrome.storage.local.get(this._dbName, function(storage) {
 //   var data = JSON.parse(localStorage[this._dbName]);
    var data = storage[this._dbName];
    var todos = data.todos;

    for (var i = 0; i < todos.length; i++) {
      if (todos[i].id == id) {
        todos.splice(i, 1);
        break;
      }
    }

//    localStorage[this._dbName] = JSON.stringify(data);
//    callback.call(this, JSON.parse(localStorage[this._dbName]).todos);
    chrome.storage.local.set(storage, function() {
      callback.call(this, todos);
    }.bind(this));
  }.bind(this));
};
```

2\. 在删除项目时，`save()`方法中先前存在的相同的Read-After-Write数据危险问题也会出现，因此您需要更新多个位置以允许在托管ID列表上进行批处理操作。

a) 仍然在`store.js`，更新 `remove()`
```js
Store.prototype.remove = function (id, callback) {
  chrome.storage.local.get(this._dbName, function(storage) {
    var data = storage[this._dbName];
    var todos = data.todos;

    var ids = [].concat(id);
    ids.forEach( function(id) {
      for (var i = 0; i < todos.length; i++) {
        if (todos[i].id == id) {
          todos.splice(i, 1);
          break;
        }
      }
    });

    chrome.storage.local.set(storage, function() {
      callback.call(this, todos);
    }.bind(this));
  }.bind(this));
};
```

b) 在`controller.js`，，更改`removeCompletedItems()`，使其在所有ID上一次调用`removeItem()`：
```js
Controller.prototype.removeCompletedItems = function () {
  this.model.read({ completed: 1 }, function (data) {
    var ids = [];
    data.forEach(function (item) {
//      this.removeItem(item.id);
      ids.push(item.id);
    }.bind(this));
    this.removeItem(ids);
  }.bind(this));

  this._filter();
};
```

c) 最后，任然在`controller.js`，更改`removeItem()`以支持从DOM中一次删除多个项目，并将`_filter()`调用移动到回调内部：
```js
Controller.prototype.removeItem = function (id) {
  this.model.remove(id, function () {
    var ids = [].concat(id);
    ids.forEach( function(id) {
      this.$todoList.removeChild($$('[data-id="' + id + '"]'));
    }.bind(this));
    this._filter();
  }.bind(this));
//  this._filter();
};
```

**删除todo事项**
store.js中还有一种方法使用`localStorage`：
```js
Store.prototype.drop = function (callback) {
  localStorage[this._dbName] = JSON.stringify({todos: []});
  callback.call(this, JSON.parse(localStorage[this._dbName]).todos);
};
```
这个方法在当前的应用程序中没有被调用，所以如果你想要一个额外的挑战，尝试自己实现它。提示：转到[chrome.storage.local.clear()](https://developers.chrome.com/apps/storage#method-StorageArea-remove)。


#### （4）运行你最终完成的Todo应用
你完成了第2步！重新加载您的应用程序，您现在应该有一个完整的Chrome打包版本的TodoMVC。

> 故障排除 记住要始终检查DevTools控制台，看看是否有任何错误消息。

#### 了解更多信息
有关此步骤中介绍的一些API的更多详细信息，请参阅：
* [内容安全策略 ↑](##6、内容安全策略)
* [权限声明 ↑](https://developers.chrome.com/apps/declare_permissions)
* [chrome.storage ↑](https://developers.chrome.com/apps/storage)
* [chrome.storage.local.get() ↑](https://developers.chrome.com/apps/storage#method-StorageArea-get)
* [chrome.storage.local.set() ↑](https://developers.chrome.com/apps/storage#method-StorageArea-set)
* [chrome.storage.local.remove() ↑](https://developers.chrome.com/apps/storage#method-StorageArea-remove)
* [chrome.storage.local.clear() ↑](https://developers.chrome.com/apps/storage#method-StorageArea-remove)

