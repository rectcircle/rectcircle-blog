---
title: "快速开始"
date: 2020-04-11T14:40:51+08:00
draft: false
toc: true
comments: true
weight: 100
summary: 本文将介绍VSCode的安装，基本功能的使用
---

## 安装

和普通软件安装方式一致，进入[官方网站](https://code.visualstudio.com/)后，点击 `Download for xxx`，安装即可，在此不做赘述。

详细文档参见 [setup](https://code.visualstudio.com/docs/setup/setup-overview)

## UI

更多参见 [User Interface](https://code.visualstudio.com/docs/getstarted/userinterface)

本质上，Visual Studio Code是代码编辑器。其基本布局如下：

![ui](https://code.visualstudio.com/assets/docs/getstarted/userinterface/hero.png)

* A - Activity Bar 最左侧为活动栏，由于切换 Side Bar
* B - Side Bar 侧边栏，包含诸如资源管理器之类的不同视图，可在您处理项目时为您提供帮助。
* C - Editor Group 编辑器组，最大的主要区域。您可以在垂直和水平方向上并排打开任意多个编辑器。
* D - Panel 面板，包含四种页面，问题、输出、调试控制台、终端
* E - Status Bar 最下方为状态栏，展示 打开的项目和编辑的文件的状态信息。

### 活动栏

* 右击活动栏，隐藏活动栏的图标
* 活动栏图标可以拖动

### 侧边栏

侧边栏基本UI元素为可折叠视图，拖动可折叠视图可以调整顺序，右击可以隐藏视图

#### 资源管理器

内置三个可折叠视图

* 打开的编辑器
* 文件夹
* 大纲

#### 搜索

搜索视图可以实现多文件查找替换

#### 源代码管理

支持对 git/svn 等代码仓库的管理

#### Run

运行/调试应用程序

#### 扩展商店

管理扩展

### 编辑器组

编辑器可以细分为如下部分

* 标签 位于最上方的
* 快捷操作按钮 位于最上方右侧
* 编辑区域
* 最右侧的小地图和滚动条

### 面板

* 问题：展示各种Lint扩展检查出的问题信息
* 输出：展示扩展的输出，一般用于扩展调试
* 调试控制台：用于代码调试过程中查看变量等操作
* 终端：执行一些命令

### 状态栏

展示状态信息

## 命令面板

### 执行命令

在 VSCode 中所有操作都对应一个命令，触发这些命令的方式主要有两种

* 键盘快捷键
* 命令面板手动触发

唤起命令面板的默认快捷键为 `command + shift + p`

如何查看所有的命名呢，一个技巧就是打开快捷键配置视图进行搜索 （ `command + shift + p` 输入键盘 `keyboard shortcuts` 选择 `首选项: 打开键盘快捷方式` ）

### 其他类型命令面板

VSCode 的命令面板以前缀来区分功能，具体可以通过如下方式列出

* `?` 列出所有前缀，`⌘P` 并输入 `?`

## 常用命令和快捷键

> 本部分仅列出常用的命令和默认快捷键，并提供命令名称，这样就可以在命令面板查看自己平台的快捷键和自定义配置快捷键

### 编辑器相关

#### 光标移动

* `上下左右` 方向键移动光标一个行/列
    * `cursorUp`
    * `cursorDown`
    * `cursorLeft`
    * `cursorRight`
* `command+上下左右` 光标移动到行尾行首列首列尾
    * `cursorEnd`
    * `cursorHome`
    * `cursorTop`
    * `cursorBottom`
* `option+左右` 光标移动一个单词
    * `cursorWordStartLeft`
    * `cursorWordEndRight`

#### 选择

在光标移动的基础上多按住 `shift` 键

* `command + a` 选择全部
* `control+shift+左右` 根据代码语义进行选择与去取消
    * `editor.action.smartSelect.shrink`
    * `editor.action.smartSelect.expand`

#### 多光标

* `option+command+上下` 在当前上面一行添加光标
* 一直添加光标到底部顶部
    * `editor.action.addCursorsToBottom`
    * `editor.action.addCursorsToTop`
* 根据单词匹配添加光标
    * 向下搜索 `editor.action.addSelectionToNextFindMatch`
    * 向上搜索 `editor.action.addSelectionToPreviousFindMatch`
* `option + shift + i` 在选中文文本的行尾部添加光标 `editor.action.insertCursorAtEndOfEachLineSelected`
* `option + enter` 在搜索窗口，选中命中的搜索目标

#### 行操作

* 删除行 `editor.action.deleteLines` Eclipse 建议配置成 `command + d`
* `option + 上下` 整行移动
    * `editor.action.moveLinesUpAction`
    * `editor.action.moveLinesDownAction`
* `option + shift + 上下` 整行复制
    * `editor.action.copyLinesUpAction`
    * `editor.action.copyLinesDownAction`
* `command + enter` 在下方加入一行 `editor.action.insertCursorAbove`
* `command + shift + enter` 在上方加入一行 `editor.action.insertLineBefore`

#### 智能编辑

* 智能提示（触发建议） `editor.action.triggerSuggest` Eclipse转来的用户建议配置成了 `option + /`
* `command + /` 切换注释 `editor.action.commentLine`
* `shift + tab` 去除缩进 `outdent`
* `command + .` 快速修复 `editor.action.quickFix`
* `command + option + .` 快速修复 `editor.action.autoFix`
* 显示悬停 `editor.action.showHover`，建议配置成 `command + h`（hover）
* `command + F2` 修改所有匹配项（相当于查找替换）
* 格式化文档，Eclipse 转来建议改成 `ctrl+shift+f`
    * `editor.action.formatDocument` 格式化整个文档
    * `editor.action.formatSelection` 格式化选中内容
* `option + shift + o` 组织导入 `editor.action.organizeImports`
* `ctrl + shift + r` 重构 `editor.action.refactor`
* `editor.action.rename` 重命名 `editor.action.refactor`

#### 跳转

* `F12` 跳转到定义 `editor.action.revealDefinition`
* `command + F12` 跳转到实现 `editor.action.goToImplementation`
* `shift + F12` 转到引用 `editor.action.goToReferences`
* `command + shift + \` 跳转到括号  `editor.action.jumpToBracket`
* `F7` 跳转到下一个匹配项 `editor.action.wordHighlight.next`
* `shift + F7` 跳转到上一个匹配项 `editor.action.wordHighlight.prev`
* `F8` 跳转到文件中下一个问题 `editor.action.marker.nextInFiles`
* `shift + F8` 跳转到文件中上一个问题 `editor.action.marker.prevInFiles`
* 符号跳转
    * `command+t` 搜索工作空间符号 `workbench.action.showAllSymbols`
    * `shift+command+o` 搜索文件符号 `workbench.action.gotoSymbol`
* 前进后退
    * `workbench.action.navigateForward` 前进 建议配置成 `ctrl + =`
    * `workbench.action.navigateBack` 后退 建议配置成 `ctrl + -`

#### 折叠

* 全部折叠 `editor.foldAll`
* 全部展开 `editor.unfoldAll`

### 窗口切换

* `command + n` 新建文件窗口 `workbench.action.files.newUntitledFile`
* `command + w` 关闭窗口 `workbench.action.closeWindow`
* `command + ,` 打开设置窗口 `workbench.action.openSettings`
* 编辑器窗口之间的切换
    * `alt+cmd+right` 下一个编辑器 `workbench.action.nextEditor`
    * `alt+cmd+left` 上一个编辑器 `workbench.action.previousEditor`
    * `ctrl + tab` 顺序切换 `workbench.action.quickOpenPreviousRecentlyUsedEditorInGroup`
* 编辑器与其他窗口切换
    * `ctrl + 反引号` 切换到终端 `workbench.action.terminal.toggleTerminal`
    * 切换到编辑器 `workbench.action.focusActiveEditorGroup` 建议配置成 `option + e`
    * `command + shift + e` 切换到资源管理器 `workbench.view.explorer`
* 终端
    * 新建终端  `workbench.action.terminal.new` 建议配置为 `command + t`
    * 上一个/下一个终端 `workbench.action.terminal.focusPrevious` 与 `workbench.action.terminal.focusNext` 建议配置为 `command+option+上下`

### 调试

* `F5` 启动调试/继续
    * `workbench.action.debug.start`
    * `workbench.action.debug.continue`
* `shift + F5` 停止调试 `workbench.action.debug.stop`
* `F6` 暂停 `workbench.action.debug.pause`
* `command + shift + F5` 重启调试 `workbench.action.debug.restart`
* `ctrl + F5` 运行，不调试 `workbench.action.debug.run`
* `F10` 单步跳过 `workbench.action.debug.stepOver`
* `F11` 单步进入 `workbench.action.debug.stepInto`
* `shift + F11` 单步跳出 `workbench.action.debug.stepOut`

### 终端相关

* `command + k` 清屏 (类似的有 `clear` 命令)
* `ctrl + a` 光标切换到行首
* `ctrl + e` 光标切换到行尾
* `ctrl + u` 或者 `command + 退格` 删除整行
* `option + 退格` 删除一个单词
* `command + 上/下` 滚动到上一条/下一条命令位置

## 配置

### 配置机制

使用 `command + ,` 或者 `command + shift + p` 搜索 `首选项` 打开配置面板。

VSCode 的配置是基于文件的配置（格式为JSON，允许包含注释），有三个级别的配置优先级从高到低排序分别为：

* 工作空间配置 位于 `.vscode/settings.json`
* 用户配置 位于安装目录
* 默认配置

优先级高的配置覆盖优先级低的配置。当然VSCode提供可视化的配置页面，通过如下方式可以打开

使用 `command + ,` 或者 `command + shift + p` 搜索 `首选项` 打开配置面板。

### 常见内置配置

本小结，将展示可能需要更改的配置。其他的配置建议保持默认即可

```json
{
    "files.autoSave": false,  // 自动保存，建议不要开启，经常 command + s 是好习惯
    "editor.fontSize": 16,  // 建议开启老年人字体😂
    "editor.fontFamily": "consolas, Menlo, Monaco, 'Courier New', monospace, '文泉驿等宽微米黑'",  // 更换为自己喜欢的字体
    "editor.renderWhitespace": "all",  // 显示空格和Tab键
    "editor.codeActionsOnSave": [  // 如果是新项目建议开启，老项目建议关闭，保存时自动进行导入，自动修复
        "source.organizeImports",
        "source.fixAll",
    ],
    "editor.smoothScrolling": true,  // 炫酷的平滑滚动，在性能较好的设备中建议启用
    "editor.cursorSmoothCaretAnimation": true, //  炫酷的光标平滑滚动，在性能较好的设备中建议启用
    "editor.formatOnPaste": true,  // 建议开启，不满足 直接 command + z 撤销即可
    "editor.formatOnSave": true,  // 建议开启，保存自动格式化
    "editor.formatOnType": true,  // 建议开启，在回车后自动格式化
    "diffEditor.ignoreTrimWhitespace": false,  // 建议开启空白字符diff
    "editor.quickSuggestions": {  // 在所有位置输入所有字符都显示提示
        "other": true,
        "comments": true,
        "strings": true,
    },
    "files.exclude": {  // 建议显示 .git 文件
        "**/.git": false,
    },
    "files.insertFinalNewline": true,  // 在保存时，自动插入一行
    "workbench.commandPalette.preserveInput": true,  // 再次打开命令面板恢复上次输入的内容
    "workbench.quickOpen.closeOnFocusLost": false,  // 失去焦点时，命令面板也不自动关闭
    "workbench.quickOpen.preserveInput": true,  // 再次打开快速打开板恢复上次输入的内容
    "workbench.colorTheme": "Monokai",  // 主题，在扩展商城挑选
    "workbench.iconTheme": "vscode-icons",  // 图标，在扩展商城挑选
    "breadcrumbs.enabled": true,  // 建议开启，是否显示编辑器顶部的导航路径
    "workbench.editor.tabSizing": "shrink",  // 编辑器 tab 紧凑模式
    "window.autoDetectColorScheme": false,  // 主题跟随系统变化
    "terminal.integrated.copyOnSelection": true,  // 将终端选中内容复制到剪切板
    "terminal.integrated.fontFamily": "Menlo, Monaco, 'Courier New', monospace,'Roboto Mono Medium for Powerline'",  // 配置终端字体
    "terminal.integrated.scrollback": 100000,  // 终端缓冲区大小，建议调大
    "terminal.integrated.shell.osx": "/bin/zsh",  // 配置 mac 的默认终端
    "terminal.integrated.shell.linux": "/bin/zsh",  // 配置 Linux 的默认终端
    "problems.showCurrentInStatus": true,  // 在状态连显示错误信息

}
```

## 扩展

以上部分仅介绍了 VSCode 的基本功能。VSCode真正强大之处在于他的扩展，因此一些优质扩展的安装是必不可少的。关于扩展相关内容，请参考

TODO 章节
