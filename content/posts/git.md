---
title: git
date: 2016-11-21T22:38:53+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/27
  - /detail/27/
tags:
  - untagged
---

## 0、提交更改的一系列命令综合
```bash
cd 工作目录
git clone git地址
git add .
git commit -a -m "提交信息"
git checkout master
git push
git status
```


## 1、创建用户名邮箱标识机器
```bash
	git config --global user.name "Your Name"
	git config --global user.email "email@example.com"
```
	
## 2、创建版本库
新建目录并进入
打开git bash
	git init
新建文件如README.txt
将文件添加到仓库
	git add README.txt
将文件添加到仓库
	git commit README.txt -m "create readme.txt"

提交修改文件 git commit -m "提交信息"

## 3、查看记录
	git log
	
## 4、查看历史文件
	git show 文件版本产生的hash值


## 5、比较差异
	git diff 文件版本产生的hash值1 \
			文件版本产生的hash值2
			
## 6、文件删除
	git rm 文件名
	git commit -m "提交信息"


## 7、重命名使用 rm和add组合命令


## 8、创建本地版本库副本
	返回到版本库所在文件夹
	git clone 版本库名 副本版本库名
	
## 9、从网路仓库clone到本地仓库
	git clone 网络仓库url 仓库名
	
	
## 10、配置文件

## 11、分支
创建分支
	git branch 分支名 [起始提交位置hash值或标签]
	//只会创建分支在版本库中，而不会更换工作空间
	//注意分支名可以带/ 入 bug/pr-1

检出分支到工作目录
	git checkout 分支名
	
列出分支名
	git branch
	
查看详细分支信息
	git show-branch
	
检出分支（切换当前工作目录的分支）
	git checkout 分支名
	//当存在未提交的更改是git将禁止切换分支必须先commit

将当前工作目录的改变合并到新检出分支上
	git checkout -m 分支名 

## 12、合并
	git checkout branch
	git status
	
将other_branch分支合并到当前工作目录的分支
	git merge other_branch
	//注意git merge 操作区分上下文信息当前工作目录的分支始终作为目标分支
	
有冲突的合并
	//当提示Merge conflict in file使用
	git diff
	git status
	//遇到问题自行检索
	

## 13、git submodule
编辑`.gitmodules`子模块
```
[submodule "frontend/tomcat"]
	path = frontend/tomcat
	url = ssh://xxxx/tomcat.git
[submodule "backend/tomcat"]
	path = backend/tomcat
	url = ssh://xxxx/tomcat.git
```

初始化并克隆
```bash
git submodule init;  git submodule update
```
