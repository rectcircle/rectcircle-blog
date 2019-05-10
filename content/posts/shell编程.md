---
title: shell编程
date: 2016-11-20T22:58:21+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/24
  - /detail/24/
tags:
  - linux
---

## 一、Shell编程基础

### 1、简介

* linux默认的shell为bash
* 查看默认支持shell版本 `vim /ect/shells`

### 2、脚本执行方式

```bash
echo [-e] "输出信息" //输出命令
	-e 支持控制字符转义字符和十六进制\t\n\xff
	颜色显示 "\e[1;31m内容\e[0m"
```

### 3、hello world

```bash
#!/bin/bash
echo -e "\e[1;31mHello Shell\e[0m"

执行chmod 755 文件 //赋给文件执行
./文件名
```

### 4、bash基本功能

#### （1）命令别名和快捷键

##### 别名

```bash
alias	//查看系统
alias 别名='命令'	//设置别名临时生效
vim ~/.bashrc	//设置环境变量永久生效
	source .bashrc 立即生效
unalias 别名 //删除别名

```

##### 命令生效的优先级

```bash
绝对定位或相对定位(../ ./)执行的命令
	>
执行别名
	>
bash内置命令如cd
	>
$PATH顺序查找的第一个
```

##### 快捷键

```
ctrl + c强制退出
ctrl + l清屏
ctrl + u清除1行
ctrl + a回到行首
ctrl + e回到行位
ctrl + z将命令放到后台
ctrl + r在命令历史中搜索
```

### 5、历史命令

```bash
histroy	//输出所有历史命令
	-c 清空历史命令
	-w 把缓存的历史命令写入文件 ~/.bash_history
	修改默认缓存历史命令 /etc/profile HISTSIZE=?

!n //执行第n条历史命令
!! //执行上一条命令
!string //执行以string开头的命令
```

### 6、命令和文件补全

```
tab
tab tab
```

### 7、输入输出重定向

* 标准输入：键盘 /dev/stdin	文件描述符0
* 标准输出：显示器：/dev/sdtout	文件描述符1
* 错误输出：显示器：/dev/sdterr	文件描述符2

#### 输出重定向

```bash
命令 > 文件 //覆盖
命令 >> 文件 //追加，只能输出正确输出
命令 2>>文件 //输出错误输出

命令 >> 文件 2>&1	//正确错误输出到同一文件
命令 &>> 文件 //正确错误输出到同一文件
命令 >> 文件1 2>>文件2  //正确错误输出不同文件
```

#### 输入重定向

```bash
wc [选项] [文件名] //统计字符
	-c统计字节数
	-w统计单词数
	-l统计行数

wc < 文件
```

### 8、管道符

#### （1）多命令执行顺序

```bash
; //顺序不管前后是否出错
命令1&&命令2 //两者同时执行或同时不执行
命令1||命令2	//前者不正确，后者才执行；前者执行，后者不执行
	例子
		命令1 && 命令2 || 命令3 //相当于 ?:

命令1 | 命令2 //命令1的正确输出作为命令2的操作对象
	例子：ls -l / | more //分页显示ls结果
		netstat -an | grep ESTABLISHED | wc -l //统计有多少用户远程连接

```

### 9、通配符

```bash
*任意多个任意字符
?任意一个字符
[]中括号内部的一个
[a-z]
[^0-9]
```

### 10、其他特殊符号

```bash
'str' 单引号 str当做字符串
"str" 双引号 str特殊字符生效若$开头即为变量的值
`str` 反引号 执行命令返回结果
	例子： aa=`ls -al` ; echo $aa
$(str) 等价于`str`
#str 注释
$str 调用变量
\str 转移符
```

## 二、shell变量

* 默认变量类型为字符串
* 用户自定义变量、环境变量、预定义变量

### 1、定义变量

```bash
x=5 #等号两边不能有空格
```

### 2、调用变量

```bash
$变量名
例子：
	x=1
	y=2
	z=$x+$y
	echo $z //输出1+2

变量叠加（拼接）
	x=1
	x="$x"234 或者 x=${x}234
	echo $x //输出 1234

set //查看系统变量
set -u //配置当命令不存在时，报错
unset 变量 //不用加$删除变量
```

### 3、环境变量

#### 自定义环境变量

```bash
export 变量名=变量值
```

#### 查看环境变量

```bash
env
```

#### 系统环境变量

```bash
$PATH //命令搜索目录
	将目录添加到$PATH中：PATH="$PATH":路径
$PS1 //提示符变量
```

#### 系统当前语系

```bash
locale //查看当前语系 -a 查看所有支持语系
$LANG //当前语系
更改默认语系 vim /etc/sysconfig/i18n
```

### 4、位置参数变量

```bash
$n //$0 命令本身 $1为命令后面的第一个参数 ${10}
$* //返回参数做成的字符串
$@ //返回参数组成的数组
$# //返回参数的个数
```

### 5、预定义变量

```bash
$? //上次执行的命令是否正确 正确为0 不正确为非0
$$ //当前进程的PID
$! //后台运行的最后一个进程名
```

### 6、接受用户输入（询问方式）

```bash
read [options] [var name]
	-p "提示信息"	//等待用户输入输出提示信息
		//read -p "请输入你的名字" name
		//echo $name
	-t 等待秒数 //
	-n 字符数 //设定用户输入长度
	-s 隐藏输入数据如密码
```

## 三、shell运算符

### 1、声明变量

```bash
declare [+|-][选项] 变量名
	- //给变量设定类型属性
	+ //取消变量的类型属性
	-a //声明为数组类型
	-i //int
	-x //声明为环境变量
	-r //声明为只读变量
	-p //显示指定变量的被声明类型

例子：
	declare -i a=$b+$c

定义数组：
	a[0]=a0
	a[1]=a1
	declare -a a[2]=a2

	echo ${a}	//第一个值
	echo ${a[1]}	//指定值
	echo ${a[*]}	//所有值

声明环境变量：
	declare -x test=1

```

### 2、数值运算

```bash
a=1
b=2
c=$(expr $a + $b) //+两边存在空格
c=$(($a+$b))
c=$[$a+$b]
```

### 3、支持运算符

类似c语言

### 4、测试变量 //脚本优化

```bash
x=${y-2}	//为y设置未定义默认值
	如果y未定义 x=2
	如果y为空("") x=空
	如果y存在值 x=y

x=${y:-2}
	如果y未定义 x=2
	如果y为空("") x=2
	如果y存在值 x=y
```

## 四、环境变量配置文件

### 1、更新配置文件立即生效

```bash
source 配置文件
. 配置文件名
```

### 2、常用配置文件（用户登录直接执行）

```bash
/etc/profile  //第一个读取的配置文件
/etc/profile.d/*.sh

~/.bash_profile
~/.bashrc

/etc/bashrc
```

### 3、/etc/bashrc 作用

```bash
定义PS1
umask
PATH追加
调用/etc/profile.d/*sh
```

### 4、其他

```bash
~/.bash_logout //登出
~/.bash_history //历史记录存放位置
/etc/issue // shell本地登录信息
/etc/issue.net // shell远程登录信息
/etc/motd // shell登录后信息
```

## 五、shell使用正则表达式

`a\{2\} //a重复2次`

### 1、字符截取命令

```bash
cut //列提取命令
cut -f 2,4 文件名 //截取文件第二、四列
cut -f 2,4 -d ":"文件名 //截取文件第二、四列，以":"为分割符

printf '输出格式' 输出内容
	%i //整数
	%f
	%s

awk '条件1{动作1} 条件2{动作2}...' 文件名
	awk '{printf $2 "\t" $4 "\n"}' 文件名 //对文件每一行执行{}的命令
	awk 'BEGIN{print "所有命令执行前动作"} {print $1}' 文件名

	awk 'BEGIN{FS=":"} {print $1}' //以:为分割符获取第一列
	awk '$2>70{print $1}' //筛选第二列>70的第一列内容，并输出
```

### 2、文档操作

```bash
sed [options] '[action]' //文本替换命令
	-n 只显示被操作的行
	-e 允许对输入数据应用多条sed动作编辑
	-i 将修改写入硬盘

	动作
		-a：追加
		-c：行替换
		-i：插入
		-p：打印指定行
		-s：字符串替换

	例子
		sed -n '2p' 文件名 //输出指定行号
		sed '2d' 文件名 //删除文件第二行输出，文件本身不变
		sed '2,4d' 文件名 //删除文件2-4行输出，文件本身不变

		sed '2a 内容' 文件 //在第二行后面添加文件
		sed '2i 内容' 文件 //在第二行前面添加文件


		sed '2c 内容' 文件 //在第二行所有内容替换掉
		sed '2s/被替换字符串/要替换的字符串/g' 文件 //子串替换
		sed -e 's/xx//g; s/f//g' 文件 //全局执行两条命令


sort [] 文件名 //对文件每一行进行排序
	-f 忽略大小写
	-n 以数值型排序，默认是字符串
	-r 反向排序
	-t 指定分隔符，默认\t
	-k n[,m] 按照指定的字段范围排序。从第n字段开始，m字段结束（默认到行尾）

	sort -n -t ":" -k "3,3" /etc/passwd

wc [选项] [文件名] //统计字符
	-c统计字节数
	-w统计单词数
	-l统计行数
```

## 六、流程控制

### 1、`test [options] 文件或目录`

```bash
或者 [ 选项 文件或目录 ]

判断文件相关
	-d 判断文件是否为目录
	-e 判断文件是否存在
	-f 判断文件是否为普通文件
	-r 判断文件是否有写权限
	-w 判断文件是否有读权限
	-x 判断文件是否有执行权限

两个文件比较
	file1 -nt file2 1是否比2新
	file1 -ot file2 1是否比2旧
	file1 -et file2 1、2的Inode是否一致 //1、2是否为硬链接

整数比较
	int1 -eq int2 //==
	int1 -ne int2 //!=
	int1 -gt int2 //>
	int1 -lt int2 //<
	int1 -ge int2 //>=
	int1 -le int2 //<=

字符串判断
	-z 字符串 //""为真
	-n 字符串 //非空
	str1 == str2
	str1 != str1

逻辑
	判断1 -a 判断2 //&&
	判断1 -o 判断2 // ||
	! 判断1 //!
```

### 2、if

```bash
if ...
	if []
		then
			语句
	fi

if ... else ...

	if []
		then
			语句
		else
			语句
	fi


if ... else if  ...... else
	if []
		then

	elif []
		then

	......
	else
		then

	fi

```

### 3、case

```bash
case $变量 in
	"值1")
		语句1
		语句2
		;;
	"值2")
		语句1
		语句2
		;;
	*)
		语句
		;;
esac
```

### 4、for

```bash
for i in 1 2 3 4 5
	do
		语句
	done
```

### 5、while

```bash
while []
	do
		语句
	done
```

### 6、until

```bash
while []
	do
		语句
	done
```

### 8、使用样例

#### （1）字符串判等

```bash
if [ "$var"x = "abc"x ]
then
	#todo
fi
```

#### （2）数字判等

```bash
if [ $i -eq 1 ]
then
	#todo
fi
```

#### （3）遍历参数

```bash
for var in $*
do
	echo $var
done
```

#### （4）执行字符串命令

```bash
	cmd="mv -f"$opts" /tmp/trash""
	$($cmd)
```
