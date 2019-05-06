---
title: linux使用mutt和msmtp发送邮件
date: 2017-10-19T10:21:06+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/103
  - /detail/103/
tags:
  - linux
---

### 1、解释
* msmtp：是一个发送邮件的应用，支持主流的协议
* mutt：是一个邮件管理应用，自身不支持发送邮件，需要发送邮件程序的支持如msmtp。mutt可以发送附件做备份
* 由于垃圾邮件问题，一般不应该直接使用25端口发送邮件，应该注册一个主流邮箱，开启： POP/SMTP服务、已开启： IMAP/SMTP服务。
	* 在msmtp中配置互联网邮箱的SMTP地址、用户名、密码、加密等
	* 在mutt配置使用msmtp发送邮件、并设置发送人信息等
	* 在shell脚本中、使用mutt命令发送邮件选择附件


### 2、msmtp
#### （1）使用源码安装
**安装依赖（若出错，可以一个一个安装，查看问题并检索）**
```bash
yum -y install ncurses-devel gcc gcc-c++ gnutls gnutls-devel gnutls-utils openssl openssl-devel libidn libidn-devel
```
**下载、解压源码文件**
```bash
wget http://downloads.sourceforge.net/msmtp/msmtp-1.4.30.tar.bz2?big_mirror=0 --no-check-certificate
tar jxvf msmtp-1.4.30.tar.bz2
```
**进入目录并检查**
```bash
cd msmtp-1.4.30
mkdir build
cd build
../configure --prefix=/usr/local/msmtp
```
最后输出，才能使用安全协议
```
TLS/SSL support ........ : yes (Library: GnuTLS)
```
**编译安装**
```bash
make
make install
```
**完成**

#### （2）配置
使用[腾讯企业邮免费版](https://exmail.qq.com)作为中转邮箱
**创建配置文件**
```bash
cd ~
vim .msmtprc
```
**编写配置文件`.msmtprc`**
不要出现中文，以下针对腾讯企业邮免费版
```python
logfile ~/.msmtp.log

account 账户名
host smtp.exmail.qq.com
port 465
from 邮箱
auth login
user 用户名
password 密码
tls on
tls_certcheck off
tls_starttls  off

account default: 账户名
```

#### （3）测试可用性
以下是交互式测试
```bash
/usr/local/msmtp/bin/msmtp -d -t
# 先输入发送目标
to: xx@xx.xx
# 再输入主题
subject: xxx
<Ctrl D>
# 出现一大堆提示
# 输入内容
xxxx
<Ctrl D>
# 登录邮箱查看是否收到
```
出错请搜索


### 3、mutt
#### （1）yum安装
```bash
yum install mutt
```

#### （2）源码包安装
```bash
wget ftp://ftp.mutt.org/pub/mutt/mutt-1.6.0.tar.gz
tar -xzvf mutt-1.6.0.tar.gz
mkdir build
cd build
../configure --prefix=/usr/local/mutt
make
make install
```

#### （3）配置
```bash
vim .muttrc
# 添加以下内容
set sendmail="/usr/local/msmtp/bin/msmtp"
set use_from=yes
set realname="发件人姓名"
set from="发件人邮箱（和前面msmtp配置一直）"
set envelope_from=yes
set editor="vim"
set copy=no #防止报错
```

#### （4）发送邮件测试
```bash
echo "正文" | /usr/local/mutt/bin/mutt -s "主题" 目标邮箱地址 -a 附件 -a 附件
```

### 4、应用：使用邮件做数据备份
创建`backup.sh`文件，内容如下
```bash
#!/bin/bash
#备份数据库
mysqldump -uroot -p123456  personalsite  > personalsite.sql
#将资源文件打包
tar -zcvf backup.tar.gz /root/mysite/personlsite/public/res personalsite.sql backup.sh
#发送邮件
echo "见附件" | /usr/local/mutt/bin/mutt -s "个人服务器数据备份" xxx@qq.com -a /root/shell/backup.tar.gz
```
