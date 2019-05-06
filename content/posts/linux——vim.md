---
title: linux——vim
date: 2016-11-20T23:00:55+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/25
  - /detail/25/
tags:
  - linux
---

### 操作模式
* 命令模式
* 输入模式
* 底行模式


### 打开或新建文件
```bash
vim 文件名	//在行首
vim + 文件名	//在行尾
vim +3 文件名	//在第三行
vim +/string 文件名	//在string第一次出现的位置
vim 文件名1 文件名2 文件名3 //打开多个文件按下:n跳到下一个文件，按下:N跳到上一个文件
```



### 常用指令
```bash
:w 保存
:q 退出
:! 强制执行
:ls 列出当前编辑器打开所有文件
:n 跳到下一个文件
:N 跳到上一个文件
:15	快速定位到15行
:/string 从当前位置向后搜索string
:?string 从当前位置向前搜索string

hjkl 左下上右
ctrl + f(front) 向下翻页
ctrl + b(back) 向上翻页
ctrl + d(down) 向下翻半页
ctrl + u(up) 向上翻半页

dd 删除一行
o 在光标所在行下方插入一行并切换到输入模式
yy 复制当前行
p 在光标所在行下方粘贴
P 在光标所在行上方粘贴
```

### 配置
`~/.vimrc`文件
```
set nocompatible
set history=10000 "历史 
syntax on "语法高亮
filetype on "文件类型检测
set showmatch "高亮括号
set autoindent "继承前一行的缩进方式，特别适用于多行注释 
set smartindent "使用C样式的缩进 
set tabstop=4  "制表符为4 
set softtabstop=4
set shiftwidth=4
set noexpandtab "不要用空格代替制表符 
set number "设置启动行号
set showmatch "括号匹配
set vb t_vb= "当vim进行编辑时，如果命令错误，会发出一个响声，该设置去掉响声
```
