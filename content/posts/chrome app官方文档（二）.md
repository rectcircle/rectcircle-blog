---
title: chrome app官方文档（二）
date: 2017-04-24T21:21:34+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/71
  - /detail/71/
tags:
  - 前端
---

> https://developer.chrome.com/apps/about_apps


> **重要提示：**Chrome将会移除web app对Windows，Mac和Linux的支持。Chrome OS将继续支持Chrome应用。此外，Chrome和Web Store将继续支持在所有平台上的扩展。 [阅读公告](https://blog.chromium.org/2016/08/from-chrome-apps-to-web.html)并了解有关[迁移您的应用程序](https://developers.chrome.com/apps/migration)。

> 上一篇：[chrome app官方文档](59)

## 目录
* [二、通过代码实验学习](#二、通过代码实验学习)
	* [3、添加警报和通知](#3、添加警报和通知)
		* [（1）给你的Todoapp添加提醒功能](#（1）给你的Todoapp添加提醒功能)
		* [（2）添加警告](#（2）添加警告)
		* [（3）添加通知](#（3）添加通知)
		* [（4）运行你添加了警报的最终完成的Todo应用](#（4）运行你添加了警报的最终完成的Todo应用)


## 二、通过代码实验学习
******************************************
### 3、添加警报和通知
> 想从这里开始新鲜？ 在[参考代码zip压缩包](https://github.com/mangini/io13-codelab/archive/master.zip)下面的`cheat_code> solution_for_step2`下找到参考代码zip中的上一步代码。

在这一步，你将学到
* 如何以指定的间隔唤醒应用程序来执行后台任务。
* 如何使用屏幕上的通知来吸引注意事项。

*完成此步骤大约需要花费20分钟*
要预览您将在此步骤中完成的内容，[跳到底部](#（4）运行你添加了警报的最终完成的Todo应用)

#### （1）给你的Todoapp添加提醒功能
添加一个功能，如果用户有未完成的todo，不管todo应用是否关闭，都要提醒用户

首先，您需要为应用程序添加一种方法来定期检查未完成的标签。 接下来，应用程序需要向用户显示消息，即使Todo应用程序窗口关闭。 要完成此操作，您需要了解Chrome应用程序中警报和通知的工作原理。



### （2）添加警告
使用[chrome.alarms](https://developers.chrome.com/apps/alarms.html)设置唤醒间隔。只要Chrome正在运行，警报侦听器就会以大约设置的间隔来调用。

**更新应用权限**
在`manifest.json`中，请求"警报"权限：
```json
"permissions": ["storage", "alarms"],
```
**更新后台脚本**
在`background.js`中，添加一个[onAlarm](https://developers.chrome.com/apps/alarms#event-onAlarm)侦听器。现在，只要有一个todo项，回调函数就会将一个消息记录到控制台上：
```js
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    id: 'main',
    bounds: { width: 620, height: 500 }
  });
});
chrome.alarms.onAlarm.addListener(function( alarm ) {
  console.log("Got an alarm!", alarm);
});
```


**更新HTML视图**
在index.html中，添加`Activate alarm`按钮：
```html
<footer id="info">
  <button id="toggleAlarm">Activate alarm</button>
  ...
</footer>
```

您现在需要为此新按钮编写JavaScript事件处理程序。从第2步回顾一下，最常见的CSP不一致性是由内联JavaScript引起的。在index.html中，添加此行以导入将在以下步骤中创建的一个新的alerts.js文件：
```html
  </footer>
  ...
  <script src="js/app.js"></script>
  <script src="js/alarms.js"></script>
</body> 
```

**创建alarms脚本**
```js
(function () {
  'use strict';
   var alarmName = 'remindme';
   function checkAlarm(callback) {
     chrome.alarms.getAll(function(alarms) {
       var hasAlarm = alarms.some(function(a) {
         return a.name == alarmName;
       });
       var newLabel;
       if (hasAlarm) {
         newLabel = 'Cancel alarm';
       } else {
         newLabel = 'Activate alarm';
       }
       document.getElementById('toggleAlarm').innerText = newLabel;
       if (callback) callback(hasAlarm);
     })
   }
   function createAlarm() {
     chrome.alarms.create(alarmName, {
       delayInMinutes: 0.1, periodInMinutes: 0.1});
   }
   function cancelAlarm() {
     chrome.alarms.clear(alarmName);
   }
   function doToggleAlarm() {
     checkAlarm( function(hasAlarm) {
       if (hasAlarm) {
         cancelAlarm();
       } else {
         createAlarm();
       }
       checkAlarm();
     });
   }
  $$('#toggleAlarm').addEventListener('click', doToggleAlarm);
  checkAlarm();
})();
```

重新加载您的应用程序，并花费几分钟等待激活（并停用）闹钟。
由于日志消息通过事件页面（也称为后台脚本）发送到控制台，因此需要右键单击“检查后台”页面以查看日志消息

你应该注意到：
* 即使您关闭了Todo应用程序窗口，警报也会继续。
* 在Chrome OS以外的平台上，如果您完全关闭所有Chrome浏览器实例，则不会触发闹钟

我们来看一下使用`chrome.alarms`方法的alerts.js中的一些片段。

**创建alarms**
在 `createAlarm()`, 使用 [chrome.alarms.create()](https://developers.chrome.com/apps/alarms#method-create) API 来创建一个alarm当alarm 被激活。
```js
chrome.alarms.create(alarmName, {delayInMinutes: 0.1, periodInMinutes: 0.1});
```
第一个参数是一个可选的字符串，用于标识报警的唯一名称，例如`remindme`。 （注意：您需要设置闹钟名称才能以名称取消闹钟名称。）

第二个参数是alarmInfo对象。alarmInfo的有效属性包括when或delayInMinutes和periodInMinutes。为了减轻用户机器的负载，Chrome将闹钟限制为每分钟一次。我们正在使用小的值（0.1分钟），仅供演示用途。

**清除alarms**

在 `cancelAlarm()`中，[chrome.alarms.clear()](https://developers.chrome.com/apps/alarms#method-clear) API 来取消alarms
```js
chrome.alarms.clear(alarmName);
```

第一个参数应该是在`chrome.alarms.create()`中用作警报名称的识别字符串。 第二个（可选）参数是一个回调函数，它应该采用以下格式：
```js
function(boolean wasCleared) {...};
```

**获取alarms**
在 `checkAlarm()` 中，使用[chrome.alarms.getAll()](https://developers.chrome.com/apps/alarms#method-getAll) API来获取所有创建的警报的数组，以更新切换按钮的UI状态。

`getAll()`接受一个通过`Alarm`对象数组的回调函数。要查看报警中的内容，可以在DevTools控制台中检查运行的报警，如下所示：
```js
chrome.alarms.getAll(function(alarms) {
  console.log(alarms);
  console.log(alarms[0]);
});
```

这将输出一个对象，如：
```js
{name: "remindme", periodInMinutes: 0.1, scheduledTime: 1397587981166.858}
```

**对下一节的准备**
现在alarms 定期轮询应用程序，使用它作为添加视觉通知的基础。

### （3）添加通知
我们将闹钟通知更改为用户可以轻松注意的内容。使用[chrome.notifications](https://developers.chrome.com/apps/notifications)显示桌面通知：
当用户点击通知时，Todo应用程序窗口应该会被看到。

**更新应用权限**
在`manifest.json`文件中添加`notifications`权限
```json
"permissions": ["storage", "alarms", "notifications"],
```

**更新后台脚本**
在`background.js`中，重构`chrome.app.window.create()`的回调函数为独立的方法：
```js
//chrome.app.runtime.onLaunched.addListener(function() {
function launch() {
  chrome.app.window.create('index.html', {
    id: 'main',
    bounds: { width: 620, height: 500 }
  });
}
//});
chrome.app.runtime.onLaunched.addListener(launch);
...
```

**更新alarm监听器**
在`background.js`的顶部，为报警监听器中使用的数据库名称添加一个变量：
```js
var dbName = 'todos-vanillajs';
```
dbName的值要等于`js/app.js`第十七行设置的一样
```js
var todo = new Todo('todos-vanillajs');
```

**创建通知**

Instead of simply logging a new alarm to the Console, update the onAlarm listener to get stored data via chrome.storage.local.get() and call a showNotification() method:

不再是简单的在一个新的alarm来的时候在控制台打印日志，而是要在 `onAlarm`的监听器中通过`chrome.storage.local.get()`获取储存的数据，并表用  `showNotification()` 方法

```js
chrome.alarms.onAlarm.addListener(function( alarm ) {
  //console.log("Got an alarm!", alarm);
  chrome.storage.local.get(dbName, showNotification);
});
```

添加 `showNotification()`方法到background.js:
```js
function launch(){
  ...
}

function showNotification(storedData) {
  var openTodos = 0;
  if ( storedData[dbName].todos ) {
    storedData[dbName].todos.forEach(function(todo) {
      if ( !todo.completed ) {
        openTodos++;
      }
    });
  }
  if (openTodos>0) {
    // Now create the notification
    chrome.notifications.create('reminder', {
        type: 'basic',
        iconUrl: 'icon_128.png',
        title: 'Don\'t forget!',
        message: 'You have '+openTodos+' things to do. Wake up, dude!'
     }, function(notificationId) {});
  }
}

chrome.app.runtime.onLaunched.addListener(launch);
...
```

`showNotification() `将检查未完成的TODO项目。如果存在未完成的项目将通过 [chrome.notifications.create()](https://developers.chrome.com/apps/notifications#method-create)创建一个弹出通知。

第一个参数是唯一标识通知名称。您必须设置一个ID，以清除或处理与该特定通知的交互。如果id与现有通知相匹配，则create（）首先在发出新通知之前清除该通知。

第二个参数是[NotificationOptions](https://developers.chrome.com/apps/notifications#type-NotificationOptions)对象。呈现通知弹出式窗口有很多选项。这里我们使用一个带有图标，标题和消息的“基本”通知。呈现通知弹出式窗口有很多选项。这里我们使用一个带有图标，标题和消息的“基本”通知。其他通知类型包括图像，列表和进度指示器。当您完成步骤3并尝试其他通知功能后，请随时返回本节。

第三个（可选）参数是一个回调方法，应该采用以下格式：
```js
function(string notificationId) {...};
```

**处理通知交互**
当用户点击通知时，打开Todo应用程序。在`background.js`的最后，创建一个`chrome.notifications.onClicked`事件处理程序：
```js
chrome.notifications.onClicked.addListener(function() {
  launch();
});
```
件处理程序回调只需调用launch（）方法。 chrome.app.window.create（）可能会创建一个新的Chrome App窗口（如果尚未存在），或者将当前打开的窗口的窗口id设为main。


#### （4）运行你添加了警报的最终完成的Todo应用
你完成了第3步！现在用提醒重新载入你的Todo应用程序。

检查这些行为是否按预期工作：
* 如果您没有任何未完成的待办事项，则没有弹出通知。
* 如果您在应用程式关闭时点击通知，Todo应用程式将会开启或成为焦点。

**故障排除**
你最后的background.js文件应该是[这样的](https://github.com/mangini/io13-codelab/blob/master/cheat_code/solution_for_step3/background.js)。如果没有显示通知，请确认您的Chrome是28或更高版本。如果仍然显示通知，请在主窗口中检查DevTools控制台中的错误消息（右键单击>检查元素）和背景页面（右键单击>检查背景页面）。

#### （5）了解更多信息
有关此步骤中介绍的一些API的更多详细信息，请参阅：
* [声明权限 ↑](https://developers.chrome.com/apps/declare_permissions)
* [chrome.alarms ↑](https://developers.chrome.com/apps/alarms.html)
* [chrome.alarms.onAlarm ↑](https://developers.chrome.com/apps/alarms#event-onAlarm)
* [chrome.alarms.create() ↑](https://developers.chrome.com/apps/alarms#method-create)
* [chrome.alarms.clear() ↑](https://developers.chrome.com/apps/alarms#method-clear)
* [chrome.alarms.getAll() ↑](https://developers.chrome.com/apps/alarms#method-getAll)
* [chrome.notifications ↑](https://developers.chrome.com/apps/notifications)
* [chrome.notifications.create() ↑](https://developers.chrome.com/apps/notifications#method-create)
* [NotificationOptions ↑](https://developers.chrome.com/apps/notifications#type-NotificationOptions)
* [chrome.notifications.onClicked ↑](https://developers.chrome.com/apps/notifications#event-onClicked)

