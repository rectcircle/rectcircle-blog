---
title: linux速查
date: 2016-11-15T20:19:24+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/15
  - /detail/15/
tags:
  - linux
---

>  代码优于描述

## 目录
* [安装配置](#安装配置)
* [常见命令和选项](#常见命令和选项)
* [磁盘管理](#磁盘管理)
* [用户和用户组](#用户和用户组)
* [系统安全](#系统安全)
* [网络管理](#网络管理)
* [远程登录](#远程登录)
* [软件安装](#软件安装)
* [权限管理](#权限管理)
* [服务管理](#服务管理)
* [进程管理](#进程管理)
* [工作管理](#工作管理)
* [系统资源查看](#系统资源查看)

## 安装配置
***************************************
### 1、安装
### 2、分区
* 必须分区
	*	/（根分区）
	*	swap分区（虚拟内存）
*	推荐分区
	*	/boot


## 常见命令和选项
***************************************
### 0、实操汇总
```bash
echo $PATH	#输出环境变量

cat 文件
cat 文件 | more #空格翻页，查看长文本文件
tail -f -n 数字 文件

cd
mkdir -p 目录/目录
pwd
touch 文件名

rm -rf 文件目录
cp 源文件 目标文件
mv 源文件 目标文件

locate 文件名

命令 --help
命令1 | grep '查找字符串'

tar -zcvf 目标文件.tar.gz 目录 文件 文件 目录... //打包压缩成gz文件
tar -zxvf 包 //解压缩解包
zip
unzip

w 查看登录用户

#查看内存、进程等
free
top
ps -aux

#查看端口占用
netstat –apn
```


### 1、命令格式
```bash
命令 [选项] [参数]
```

### 2、文件目录处理命令
#### （1）目录介绍
* 个人文件存放：home或者root或者tmp
* usr 系统软件资源目录
* var 系统相关文档目录

#### （2）`ls` 查看文件和目录
```bash
ls 查看文件和目录
		-a：全部文件及隐藏文件
		-l：列出长数据串，包含文件属性
		-d：仅列出目录不列出文件
		-h：列出文件大小
		-i：列出inode位置
ll 等于 la -l
```

#### （3）`mkdir`建立目录
```bash
mkdir -p 目录名	#新建目录
		-p递归创建
```

#### （4）`cd` 切换目录

#### （5）`pwd`	打印当前目录

#### （6）`rmdir [目录名]`删除空目录

#### （7）`rm`删除目录文件
```bash
rm -rf [文件或目录]
		-r 删除目录
		-f 强制
```

#### （8）`cp`复制
```bash
cp [-adfilprsu] [源文件1 源文件2 源文件3...]  [目标文件]
	-a：相当于-pdr
	-d：若源文件为link文件，则复制link文件的属性而非文件本身
	-p：与文件属性一同复制而非使用默认属性
	-r：递归持续复制，用于目录的复制
	注：若源文件有两个及其以上则目标文件一定是目录
```

#### （9）`mv`移动和重命名
```bash
mv	[源文件1 源文件2 源文件3...]  [目标文件] //移动 重命名
```

#### （10）`ln`建立链接文件（快捷方式）
```bash
ln [-s] 源文件(-s必须为绝对路径) 目标文件 链接命令
		-s软链接
```
#### （11）`touch 文件名`新建文件


### 3、文件搜索
#### （1）`locate 文件名`文件索引搜索
```bash
#按数据库索引搜索，执行前更新数据库updatedb，模糊匹配
#配置忽略vim /etc/updatedb.conf
```

#### （2）`whereis 命令名` 搜索系统命令及帮助文件所在位置
```bash
whereis [-bm] 命令名	//搜索系统命令及帮助文件所在位置
		-b 只查看命令位置
		-m 只查看帮助文档位置
```

#### （3）`which 命令名`	查看命令和别名

#### （4）`find [搜索范围] [搜索条件]` 可使用通配符，精确搜索
```bash
find [搜索范围] [搜索条件]	//可使用通配符，精确搜索
	-name 文件名 //按文件名搜索
	-imame 文件名 //不区分大小写
	-user 用户名 //按所有者搜索
	-nouser //无所有者文件
	-mtime -+数字 //按修改时间查找修改文件
		-10	10天内修改文件
		10	当天修改文件
		+10	10天前修改的文件
		-atime 文件访问时间 -ctime 改变文件属性 -mtime 修改内容
		//单位k M区分大小写 不加单位按扇区数据块大小为单位

	-size +- 文件大小 //按文件大小搜索
		-25k <25k文件
		+25k >25k文件
		25k	=25k文件

	-inum 数字	//按文件id（i）节点号

	-a -o （and or）逻辑条件
		//例子
		-size +20k -a -size -50k
```

#### （4）`grep 匹配字符串 文件名` 文件匹配返回匹配行
```bash
grep [-iv] 字符串 文件名 //在文件中匹配符合条件的字符串，可以使用正则
	-i 忽略大小写
	-v 排除指定字符串
```

### 4、帮助命令
#### （1）`man`帮助命令
```bash
man [-f|数值|-k] 命令 //whatis == man -f
	-f 查看man的等级
	数值 查看指定等级的帮助
		1可执行程序和一般shell命令
		2系统调用函数
		3库函数
		4设备配置文件,通常在/dev下
		5配置文件,/ec下
		6游戏
		7协议及杂项
		8管理员命令
		9与内核相关

	-k 包含关键字的文档	apropos == man -k
```

#### （2）`help 命令` //查看shell命令

#### （3）`命令 --help` 命令的选项帮助

#### （4）`info 命令` 帮助文档

### 5、压缩打包命令
#### （1）`zip` 和 `unzip` 压缩和解压文件目录命令
```bash
zip [-r] 压缩文件名 源文件
	-r 压缩目录
unzip -o 压缩文件
	-o 覆盖不提醒
```


#### （2）gzip 压缩、解压文件
```bash
gzip 源文件 //压缩文件源文件会消失，对文件操作不会打包

gzip -c 源文件 > 输出文件	//压缩文件源文件不消失

gzip -d 压缩文件 //解压 == gunzip
	-r解压文件夹内所有压缩文件 
```

#### （3）`bzip2` 和 `bunzip2` 压缩和解压文件
```bash
bzip2 [-k] 源文件 //不能压缩目录
	-k 保留源文件
bunzip2 解压
```

#### （4）`tar`打包命令
```bash
tar -cvf 目标文件.tar 目录 //打包
tar -xvf 包 //解包

tar -zcvf 目标文件.tar.gz 目录 文件 文件 目录... //打包压缩成gz文件
tar -zxvf 包 //解压缩解包

tar -jcvf 目标文件.tar.gz 目录 文件 文件 目录... //打包压缩成bz2文件
tar -jxvf 包 //解压缩解包

tar 解压选项 源文件 -C 路径	//解压解包到指定目录

tar -ztvf
```


### 6、关机和重启
```bash
shutdown -r 时间	//重启 时间now立即
shutdown -c 	//取消重启命令
	-h 关机
	//安全关机
	
init 数字 用户级别

logout退出远程登录
```


### 7、其他常用命令
#### （1）挂载命令
```bash
mount //查询已挂载设备
mount -a //根据/etc/fastab内容自动挂载

mkdir /mnt/cdrom/	//建立挂载点
mount -t iso9660 /dev/cdrom /mnt/cdrom/	//挂载光盘
或者mount /dev/sr0 /mnt/cdrom/

umount /mnt/cdrom/	//卸载光盘

fdisk -l
mount -t vfat /dev/sdb1 /mnt/usb/	//挂载u盘 默认不支持ntfs 或安装ntfs-3g但仍不支持写入
```

#### （2）登录查看`w`、`who`、`last`、`lastlog`
```bash
w [用户名]	//查看已登录用户信息
who //类似于w
last 查询当期登录和过去登录的用户信息	//查看/var/log/wtmp 文件
lastlog 查看所有用户最后一次登录时间	//查看/var/log/lastlog 文件
```

### 8、查看命令
```bash
cat
tail -f
more 分页查看
```


## 磁盘管理
********************************
### 1、磁盘状态查看
#### （1）`df [-ln]` 查看磁盘分区使用状况
```bash
df [-lh]	//查看磁盘分区使用状况
		-l 仅限本地磁盘
		-a 显示所有文件系统磁盘使用情况
		-h 人性化单位1024
		-H 人性化单位1000
		-T 显示分区情况
		-t 显示指定类型文件系统的磁盘分区	//添加文件名
		-x 不显示指定类型文件系统的磁盘分区
```

#### （2）`du [-h]`	统计磁盘文件大小
```bash
du [-h]	//统计磁盘文件大小
		-s 目录名 //指定文件名
```
### 2、分区命令
#### （1）`fdisk` mbr分区命令
```bash
//mbr分区：主分区<=4，单分区最大2TB
fdisk /dev/sdb 	//进入分区模式MBR分区
	n //添加新分区
		p主分区 e拓展分区 //按提示进行
	完成扩展分区后必须进行逻辑分区
```

#### （2）`parted` GPT分区命令
```bash
//GPT分区：主分区<=128，单分区<=18EB
parted //进入分区模式
	select /dev/sdb //切换分区对象
	mklabel gpt //使用gpt模式分区
	print	//打印分区详情
	mkpart	//分区配置
	rm 分区编号
	unit GB	//使用GB作未分区单位
	quit //退出，操作立即生效
```

### 3、格式化
```bash
mkfs.ext3 /ext/sdb1	
	mkfs -t ext4 /ext/sdb2
		//格式化分区
```

### 4、挂载
```bash
mkdir -p /mnt/test
	mount /dev/sdb1 /mnt/test
	umount /mnt/test
	永久自动挂载
		/etc/fastab添加配置
		source /etc/fastab
```

### 5、swap交换分区
```bash
swap 交换分区
	http://www.imooc.com/video/4964
	建立普通的文件分区
	修改编码
	格式化
		mkswap /dev/sdb6
	启用
		swapon /dev/sdb6
```
阿里云centos 7新建swap分区
```bash
dd if=/dev/zero of=/home/swap bs=2048 count=1048576
mkswap /home/swap
#查看内核参数vm.swappiness中的数值是否为0，如果为0则根据实际需要调整成30或者60
vim /etc/sysctl.conf

swapon /home/swap   
echo "/home/swap swap swap defaults    0  0" >> /etc/fstab

#关闭分区
swapoff /home/swap   
swapoff -a >/dev/null
```

参考[慕课网linux课程](http://www.imooc.com/video/4964)


## 用户和用户组
********************************
### 1、几个文件
```
/etc/group	//存储当前系统中所有用户组信息
	root:x:0:
	组名:密码占位符:组编号:组中用户列表

/etc/gshadow //用户组的密码信息
	root:::
	组名:组密码:组管理者:组中用户列表

/etc/passwd //储存当前系统中所有用户的信息
	root:x:0:0:root:/root:/bin/bash
	用户名:密码:用户编号:用户组编号:用户注释:用户主目录:shell:类型

/etc/shadow //用户的密码信息
	root:mima:16935:0:99999:7:::
```

### 2、基本命令
#### （1）`groupadd 组名` 新建组
```bash
groupadd 组名 //新建组
	groupadd -g 888 组名	//组编号
```

#### （2）`groupmod -n 新组名 旧组名`	修改组
```bash
groupmod -n 新组名 旧组名	//修改组
	groupmod -g 新编号 旧组名	//修改组编号
```

#### （3）`groupdel 组名` 删除组

#### （4）`useradd -g 组名 用户名`	添加用户
```bash
useradd -g 组名 用户名	//添加用户
	useradd -d /home/xxx 用户名	//指定用户家目录，默认创建用户名同名用户组
	useradd -g 组名 用户名 -G 附属组,附属组... //添加用户
```

#### （4）`usermod -c 注释 用户名`	给用户添加注释
```bash
usermod -c 注释 用户名	//给用户添加注释
	usermod -l 新用户名 用户名 //更改用户名
	usermod -d /home/xxx 用户名 //用户家目录
	usermod -g 用户名 组名 //用户变更组
	
#例子：将用户加入sudo组
	sudo usermod -aG sudo 用户名
```

#### （5）`userdel 用户名`	删除用户
```bash
userdel 用户名	//删除用户
	userdel -r 用户名	//删除用户和家目录
```

#### （6）`touch /etc/nologin` 禁止除了root的其他用户登录

### 3、高级命令
```bash
passwd -l 用户名 //锁定用户 
	passwd -u 用户名 //解锁用户 
	passwd -d 用户名 //用户无命令登录
	passwd 用户名 //为用户设置密码

gpasswd -a 用户 用户组,用户组... //为用户添加附属组
	newgrp 用户组 //当前用户临时切换到其他附属组
	gpasswd -d 用户 用户组 //删除用户的附属组
	gpasswd 用户组 //为用户组设置密码

su //切换到root用户
	su 用户名	//切换用户

whoami	//查看当前用户
id 用户名	//查看用户
groups 用户名	//查看用户所在组
chfn 用户名	//设置用户资料
finger 用户名	//显示用户详细资料
```

### 4、配置用户ssh登录
```bash
vim /etc/ssh/sshd_config
# 一行指定多用户 ，用空格隔开。允许root用户只能在192.168.0.1地方登录，允许admin可以在任何地方登录
AllowUsers root@192.168.0.1 admin
```


## 系统安全
********************************
### 1、系统扫描
#### (1)、主机扫描
##### 例子
1. 使用tracert 主机获取ip
2. nmap 获取开放端口
3. 暴力破解密码，登录
4. 使用nc进行shell交互
5. 执行操作

##### 批量`fping`
```bash
#下载、解压、检查环境、编译、安装
cd 下载目录
wget http://www.fping.org/dist/fping-3.13.tar.gz
tar -xvf fping-3.13.tar.gz
./configure --prefix=/usr/local/fping-3.31
make
make install
ln -s /usr/local/fping-3.31/sbin/fping /usr/local/sbin/fping
fping -h
```

```bash
#用法
fping 
		fping 119.29.166.164 119.29.166.165 
	-h #获取帮助
	-a #只显示存活主机
		fping -a 119.29.166.164 119.29.166.165 
	-u #只显示不存活主机
	-g #ping一个网段
		fping -g 119.29.166.1 119.29.166.200
		fping -g 119.29.166.1/28
	-f 文件名 #ping文件的ip
```

##### 支持tcp/ip数据包分析组装`hping`，查看禁用ping的主机
```bash
#下载、解压、检查环境、编译、安装
cd 下载目录
wget https://github.com/antirez/hping/archive/master.zip
unzip master
cd hping-master/
yum install -y libpcap-devel #安装依赖包
yum install -y tcl-devel #安装依赖包
ln -sf /usr/include/pcap-bpf.h /usr/include/net/bpf.h
./configure --prefix=/usr/local/hping
make install
hping -h
```
```bash
#用法
hping
	-p 端口
	-S 设置TCP模式SYN包
	-a 伪造IP地址
		hping -p 22 -S 210.38.224.248 #tcp ping
		hping -p 22 -S 210.38.224.248 192.168.1.1 #伪造ip
```


#### (2)路由扫描
##### `traceroute`命令
```bash
traceroute
	-T 使用tcp包 -p 端口
		traceroute -T -p 80 -n 210.38.224.248
	-I 使用ICMP数据包
		traceroute -In 210.38.224.248
	-n 去掉主机解析
		traceroute -n 210.38.224.248
```

##### `mtr`命令
```bash
查看丢包率
mtr 210.38.224.248
```

#### (2)批量主机服务扫描（端口扫描）
##### `nmap`命令
```bash
#ICMP（ping）方式
nmap -sP 210.38.224.0/24

#TCP SYN扫描（半开放），仅发送第一个SYN包，默认0-1024和常用端口
nmap -sS 210.38.224.248
nmap -sS -p 0-30000 210.38.224.248 #指定端口范围

#TCP connect()扫描（全开放）
nmap -sT 210.38.224.114

#UDP扫描
nmap -sU 210.38.224.114

```

##### `ncat`命令
```bash
nc -v -z -w2 10.10.20.250 1-50
nc -u -v -z -w2 10.10.20.250 1-50
	w 超时时间
	z 输入输出模式
	v 显示详情
	u UDP
	文件传输 反弹shell zookeeper
```

### 2、防攻击
#### (1)防止syn攻击
```bash
#减少发送syn+ack包的重试次数
sysctl -w net.ipv4.tcp_synack_retries=3
sysctl -w net.ipv4.tcp_syn_retries=3

#syn cookies技术
sysctl -w net.ipv4.tcp_syncookies=1

#添加backlog队列
sysctl -w net.ipv4.tcp_max_syn_backlog=2048
```

#### (2)linux预防策略
```bash
#关闭ICMP协议请求
sysctl -w net.ipv4.icmp_echo_ignore_all=1
#通过iptables防止扫描
```


## 网络管理
**************************************
### 1、基本命令
#### （1）`netstat` 查看启用用端口
```bash
netstat -an或者-tuln //查看本机启用端口
	-a 查看所有
	-n 不显示域名和服务名
	-t 列出所有tcp端口
	-u 列出所有udp端口
	-l 仅列出在监听状态的网络服务
	-r 查看网关
#小技巧
netstat -an | grep ESTABLISHED | wc -l //查看所有ssh登录连接
```

#### （2）`ifconfig` 查看网卡信息、配置临时ip等
```bash
ifconfig #查看
ifconfig 网卡号 ip地址（192.168.2.2） netmask 子网掩码（255.255.255.0）
```

#### （3）`setup` 永久配置ip（centos7以前）

#### （4）`nmtui` 永久配置ip（centos7.x）
```bash
yum install NetworkManager-tui
systemctl start NetworkManager
nmtui #配置，似乎不需要重启网络服务，可配置多个，激活一个就行
```

#### （5）`ifdown 网卡名`	禁用网卡
#### （6）`ifup 网卡名`	启用网卡
#### （7）`route add default gw 网关地址` 添加临时网关
#### （8）`nslookup 主机或server` 查看dns服务器
#### （9）`ping 主机` 网络连通性测试
```bash
-c 次数
```

#### （10）`telnet 域名或ip 端口`	查看远程端口是否开放

#### （11）`traceroute 主机名` 路由追踪

#### （12）`wget 地址` 下载

#### （13）`tcpdump -i eth0 -nnX port 80 ` 抓包

### 2、网络相关配置文件
#### （1）网卡信息文件`/etc/sysconfig/network-scripts/ifcfg-网卡名`
```bash
TYPE=Ethernet #网络类型为以太网
BOOTPROTO=dhcp #dhcp是否使用，可选none|dhcp|static
DEFROUTE=yes #
PEERDNS=yes
PEERROUTES=yes
IPV4_FAILURE_FATAL=no
IPV6INIT=yes
IPV6_AUTOCONF=yes
IPV6_DEFROUTE=yes
IPV6_PEERDNS=yes
IPV6_PEERROUTES=yes
IPV6_FAILURE_FATAL=no
IPV6_ADDR_GEN_MODE=stable-privacy
NAME=enp0s31f6 #网卡设备名
UUID=33bf32ea-28a4-408f-bde5-0c044ce4e48d
DEVICE=enp0s31f6  #网卡设备名
ONBOOT=no #启用此网卡，应该为yes
#使用非dhcp，添加
IPADDR0=192.168.100.100  #地址
PREFIX0=24  #掩码
GATEWAY0=192.168.100.1   网关
DNS1=8.8.8.8  #dns
DNS2=8.8.4.4 #dns
```

#### （2）主机名文件

#### （3）dns配置文件`/etc/resolv.conf`
```bash
#添加：nameserver dns ip最多三条
nameserver 202.96.128.166
nameserver 202.38.224.68
nameserver 114.114.114.114
```



## 远程登录
***********************************
```bash
ssh root@42.96.149.159
scp [-r] 用户名@ip:文件目录 本地目录	//文件下载
scp [-r] 本地目录 用户名@ip:文件目录	//文件上传
	-r 上传下载目录
```

### 1、配置秘钥登录
```bash
cd ~/.ssh/                     # 若没有该目录，请先执行一次ssh localhost
ssh-keygen -t rsa              # 会有提示，都按回车就可以
cat ./id_rsa.pub >> ./authorized_keys  # 加入授权
```
### 2、将秘钥`id_rsa`拿回本地

### 3、配置禁止口令登录
```bash
#注意不是ssh_config，巨坑
vim /etc/ssh/sshd_config
```



## 软件安装
*****************************************
> 分为：源码包（tar.gz）、二进制包（rpm）

### 1、`rpm `安装
#### （1）库文件依赖查询
http://www.rpmfind.net

#### （2）安装
```bash
rpm -ivh 包全名
	-i 安装
	-v 显示详细信息
	-h 显示进度
	--nodeps 不检查依赖性，不能使用
```

#### （2）升级
```bash
rpm -Uvh 包全名	//升级
		-U 升级
```


#### （3）卸载
```bash
rpm -e 包名 //卸载
```

#### （4）查询是否安装
```bash
rpm -q 包名（httpd） //查询
```

#### （5）查看全部已安装的rpm包
```bash
rpm -qa //查询所有已安装rpm包
	rpm -qa | grep 查询名
```

#### （6）查询安装包的说明信息
```bash
rpm -qi 包名 //查询包说明信息
	-i（information）
	-p（package）查询未安装包信息
```

#### （7）查询安装包的默认安装位置
```bash
rpm -ql 包名 //查询包安装位置
	-l（list）
	默认安装位置
		/etc/ 配置文件
		/usr/bin/ 可执行命令位置
		/usr/lib/ 库文件
		/usr/share/doc/ 说明文档
		/usr/share/man	帮助文档
	-p（package）查询未安装包信息
```

#### （8）查询文件属于那个包
```bash
rpm -qf 系统文件名
```

#### （9）查询依赖
```bash
rpm -qR 包名 
	-R（requirs）查询软件依赖性
	-p（package）查询未安装包信息
```

#### （10）校验文件是否被修改
```bash
rpm -V 包名（httpd） 
```

#### （11）rpm包文件提取
```bash
rpm2cpio 包全名 | cpio -idv .文件的绝对路径
```

### 2、`yum`在线安装
```
yum list 列出所有可安装的包
yum search 关键字
yum -y install 包名 
	-y 自动回答yes
yum -y update 包名 //更新
yum -y remove 包名 //尽量不卸载

yum grouplist //软件组包	//LANG=en_US LANG=zh_CN.utf8 vi   /etc/sysconfig/i18n
yum groupinstall 组名 //软件组包
```

### 3、源码安装
> 位置：
> 源码包位置：/usr/local/src/包名称
> 安装位置：/usr/local/包名称

#### （1）安装步骤
* 下载源码包
*	安装编译器
*	`tar -zxvf` 源码包 //解压
*	`cd` 进入解压缩目录
*	`./configure --prefix=/usr/local/xxx`	//执行源码包定义功能选项、检查是否符合安装要求、生成Makefile
*	`make clean` //报错执行
*	`make install` //安装命令
*	源码包/INSTALL //查看安装说明，找到启动文件
*	mv /usr/local/包名称/ /usr/local/bin	//可选，方便启动

* 删除安装目录 //卸载

### 4、脚本安装
```bash
wget url && ./文件名
```

## 权限管理
************************************
> d rwx rwx rwx
> 文件类型 u所有者 g组 o其他人


### 1、`chmod`更改文件权限
```bash
chmod [-R] 模式 文件目录 //更改权限
	-R递归
	模式：u+x //所有者加执行权限
			g+w,o+w //给组、其他人写权限
			u-x	//取消权限

			u=rwx	//添加权限
			a=rwx //所有人权限

			r --- 4 w --- 2 x --- 1
			755 //rwxr-xr-x 一般可执行文件权限
			644 //rw-r--r-- 普通文件权限
			777 //最高权限
```

### 2、权限的作用
#### （1）权限对文件作用
r ：cat more head tail
w ：echo vim //不能删除，能否删除是目录的w决定的
x ：sh可执行

#### （2）权限对目录的作用（可给予的值0 5（rx） 7（rwx））
r ：ls
w ：touch rm mv cp
x ：cd

### 3、`chown`更改文件所属者
```bash
chown  用户名 文件目录 //改变文件所有者
chown  组号:用户名 文件目录 //改变文件所有者和所属组
```

### 4、`chgrp`改变文件所属组
```
chgrp 组名 文件目录
```

### 5、更改文件的默认权限
#### （1）`umask `临时修改文件的默认权限
```bash
umask 002 
	 文件 666转换为权限后 - 002转换为权限 结果
	 目录 777转换为权限后 - 002
	 -为按位减
```

#### （2）永久修改
```bash
vim /etc/profile
```

### 6、特殊权限
#### （1）ACL权限--指定用户设定的权限
```bash
df //查看分区
dumpe2fs -h /dev/分区号 //查看是否开启acl
	Default mount options:    user_xattr acl

若未开启：
临时开启acl
	mount -o remount,acl /	//为根分区重新挂载并指定开启acl权限管理

永久生效修改 vim /etc/fstab default,acl	//谨慎开启

setacl [] 文件名
	-m 设定acl //setfacl -m u:用户名:rx 目录 //-m g:组名:权限
	-x 删除指定acl权限  //setfacl -x u:用户名 目录 //-m g:组名
	-b 删除所有 //setfacl -b 目录
	-d 设定默认acl
//新建的子文件目录将会继承此权限，已存在的不会成效  -m d:u:用户名:rx
	-k 删除默认acl
	-R 递归设定 //会造成权限溢出 目录的x权限会继承到
对已经存在文件继承，新建的不会起作用

getfacl 文件目录

最大acl权限 mask：设定的acl权限与mask做逻辑与运算得到才是实际权限
设定mask
	setfacl -m m:rx 目录文件

```



#### （2）sudo权限--用户操纵命令的权限，让普通用户执行root命令
root用户 执行visudo 实际上修改/etc/sudoers
```
root ALL=(ALL) ALL
	需要赋予权限的用户 被管理的主机地址=(可以使用的身份) 授权命令绝对用户
%用户组 ALL=(ALL) ALL
	需要赋予权限的用户组 被管理的主机地址=(可以使用的身份) 授权命令绝对用户

例子：
	user1 ALL=(ALL) /sbin/shutdown -r now
	user1用户登录
	sudo -l //输入密码
	sudo 命令的绝对路径 //执行shutdown
	//输入密码，然后执行
```

#### （3）文件特殊权限（SetUID、SetGID、Sticky BIT）
尽量不要修改

## 服务管理
*********************************
### 1、运行级别
#### （1）说明
```bash
0 关机
1 单用户模式
2 不完全命令行，不含NFS服务
3 完全命令行（正常模式）
4 系统保留
5 图形模式
6 重启动
```
#### （2）`runlevel` 查看运行级别 
#### （3）`init 5` 修改运行级别 
#### （4）修改系统默认运行级别 
```bash
vim /etc/inittab
id:3:initdefault:
```

### 2、服务分类
* 独立服务（大多数）
* 基于xinetd

### 3、服务、程序自启动
#### （1）查看服务自启动
`chkconfig --list` //查看各个运行级别是否自启动（centos6 及以前）
`systemctl list-unit-files` //centos7.x
`setup`

#### （2）修改服务自启动
方式1
```bash
chkconfig [--level 2345] httpd on或者off //开启开机自启
			或者使用ntsysv
```
方式2
```bash
vim /etc/rc.d/rc.local //系统启动最后运行的命令 （软链接：/etc/rc.local）
			//添加一条启动服务的命令
chmod 744 /etc/rc.d/rc.local #centos 7兼容选项
```

### 4、源码包安装的服务
#### （1）启动`安装目录/服务名 start|stop`
#### （2）配置自启动
在/etc/rc.local添加命令

#### （3）将源码包添加到service管理
```bash
ln -s /usr/**启动命令 /etc/init.d/服务名
```

#### （4）将源码包安装的程序添加到自启动管理
```bash
#完成（3）将源码包添加到service管理
vim 服务启动脚本 #添加以下语句在第二行
#chkconfig: 345 86 76 #系统运行级别345 启动顺序86 关闭顺序76 顺序不能冲突
#description: 服务的描述

chkconfig --add 启动脚本名
```

### 5、systemctl命令（centos7新增）
使用介绍
https://linux.cn/article-5926-1.html
CentOS 7.x设置自定义开机启动,添加自定义系统服务
http://www.centoscn.com/CentOS/config/2015/0507/5374.html
将tomcat交由systemctl管理
http://blog.csdn.net/nimasike/article/details/51896100
http://blog.csdn.net/freewebsys/article/details/41646081


## 进程管理
***************************
### 1、查看进程
#### （1）`ps` 查看进程
```bash
ps aux或 ps -le //查看所有进程

pstree [-pu] //查看进程树
	-p 显示进程id
	-u 查看用户
```

#### （2）`top` 查看进程及计算机状态
```bash
top -b -n 1 > top.log //写入文件
	-d 间隔刷新时间默认3s
	-b 批处理
	-n 执行top次数

	进入top后的命令
		h //查看帮助

```

### 2、`kill` 结束进程
```bash
kill 杀死单一进程
	kill -1 pid 平滑重启（重新加载配置文件）
	kill -9 pid 强制中止
	kill -15 pid 默认中止

killall 杀死一组进程
	killall -i -9 进程名
		-i 交互式
		-I 忽略进程名的大小写

pkill -9 -t pts/1	//按照终端号踢用户
```


### 3、修改进程优先级
#### （1）查看优先级
```
ps -le
	PRI Priority
	NI Nice //可修改取值-20 ~ 19 越小优先级越高
	最终值 = PRI + NI

```
#### （2）修改优先级
```bash
nice -n -5 启动命令 //将优先级+（-5）并启动
renice -10 进程id //修改已存在进程的优先级
```




## 工作管理
***************************
> 只有当前终端才能管理，别的终端不能操作

### 1、后台运行
```bash
命令 &	//后台运行
命令 + ctrl + z //后台暂停
```

### 2、`jobs`查看后台运行程序
```bash
jobs [-l] 
	-l 查看显示后台pid
```

### 3、恢复运行
```bash
fg %工作号 //恢复到后台运行
bg %工作号
	//不加参数，执行最后一个后台任务

```

### 4、后台命令脱离工作终端运行
方法一：将后台命令放在/etc/rc.local文件
方法二：nohup命令
```bash
	nohup [命令] &
```





## 系统资源查看
****************************
> 缓存（cache）：加速硬盘读取
> 缓冲（buffer）：加速硬盘写入

### 1、常用命令
```bash
vmstat 1 3 //查看系统资源（刷新延时，刷新次数）
demesg //自检信息
free [-mg] //查看内存
	mg内存单位

cat /proc/cpuinfo //查看cpu信息
uptime //top第一行
uname -ars 
	-a //查看相关信息
	-r 查看内核信息
	-s 查看内核名称
file /bin/ls //操作系统位数
lsb_release -a //系统发行版本

lsof | more //查询系统中所有进程调用的文件
	略
		
```
