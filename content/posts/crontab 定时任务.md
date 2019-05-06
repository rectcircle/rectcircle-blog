---
title: crontab 定时任务
date: 2017-03-29T20:25:03+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/53
  - /detail/53/
tags:
  - linux
---

### 0、其他定时任务方式
#### （1）`at` //执行一次
```bash
at now +2 minutus //然后输入命令 ctrl + d 保存退出
```

#### （2）`atq` //查询排队的的命令

#### （3）`atrm` [工作号]  //删除定时任务

### 1、安装
```bash
service crond status
yum install vixie-cron
yum install crontabs
```

### 2、编辑任务列表
```bash
crontab -e
```
语法
```bash
	* * * * *  命令
	第 分钟(0-59) 小时(0-23) 日期(1-31) 月份(1-12) 星期(0-7)

	* 通配符
	1,2 1或者2
	1-10 1到10
	*/2 每隔2个单位
```
### 3、系统定时任务
在/etc/crontab添加
```bash
		* * * * *  用户身份 命令 
```
将命令放在/etc/cron.{daily, weekly,monthly}目录 //优先使用

### 4、anacron 
	检测遗漏定时任务
	


