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

* 本文执行引擎为 Bash（不同实现的 Shell 可能存在差异）
* [脚本说明](https://explainshell.com/)

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

#### 别名

```bash
alias	//查看系统
alias 别名='命令'	//设置别名临时生效
vim ~/.bashrc	//设置环境变量永久生效
	source .bashrc 立即生效
unalias 别名 //删除别名

```

#### 命令生效的优先级

```bash
绝对定位或相对定位(../ ./)执行的命令
	>
执行别名
	>
bash内置命令如cd
	>
$PATH顺序查找的第一个
```

#### 快捷键

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

命令 >> 文件 2>&1	//正确错误输出到同一文件，重定向
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

```bash
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

### 11、shell 和 C 系列通用编程语言比较

shell 虽然也是一种编程语言，但是其相对比较特殊，是用来串联操作系统的一些进行使用的。因此和 C 系列通用编程语言 有很大的不同。

* shell 被设计出来的目的是为了在操作系统中执行进程的脚本语言（这是 和 其他 C 系列通用编程语言 最大的不同）
* shell 中最基本的东西只有两样 命令 和 变量，因此 shell 中基本语法规则就两种：变量声明 `A=xx`，命令执行 `foo p1 p2`
* 命令（包括可执行程序）的执行的核心要素是
    * 命令名/路径
    * 参数 （args）
    * 环境变量
    * 标准输入
    * 标准输出
    * 标准出错
    * 退出码
* shell 流程控制是通过 shell 内置命令实现的，通过 `help <cmd>` 可以查看帮助
* 命令具体可以分为三类（通过 `type -a <cmd1> <cmd2> ...` 查看）
    * 任意编程语言编写的，可执行程序（bin）
    * shell 内置命令，比如 `cd` `test` 等
    * shell 函数
* shell 的变量本质上都是字符串，通过一些特殊的命令可以将一个字符串在逻辑上看作数字，数组
* shell 的 逻辑语句 和 其他编程语言不一样，其依靠的是 命令退出码：
    * 0 为 true
    * 非零为 false

### 12、shell 脚本的Shebang

* 推荐使用 env 启动 bash
* 推荐使用 bash 原因如下
    * 兼容性不错
    * 能力较强，比 sh 强不少

```bash
#!/usr/bin/env bash
```

### 13、配置 shell 属性

[set](http://www.ruanyifeng.com/blog/2017/11/bash-set.html)

### 14、bash 中的几种引号

* `""` 双引号
    * 换行会被替换为空格
    * 内部的 shell 特殊符号会进行相应，比如 `$var`  `$(cmd)`
* `''` 单引号
    * 换行会被替换为空格
    * 内部的 shell 特殊符号会不会进行相应

## 二、shell变量

* 默认变量类型为字符串
* 用户自定义变量、环境变量、预定义变量

### 1、变量类型

#### 全局变量

```bash
x=5 #等号两边不能有空格
```

如上方式定义变量的方式

* 作用域为当前的 Shell，声明后，在整个 shell 执行期间均有效
* 即使用在函数中，在函数调用结束后，变量仍然可见

#### 局部变量

```bash
foo(){
    local a=99
}
```

如上方式定义变量的方式

* 如上声明的 变量作用域为当前函数，超出当前函数后将无法访问

#### 环境变量

```bash
export 变量名=变量值
```

以上声明的变量不仅在当前 shell 中有效，所有启动子进程（包括子 shell），都可以访问。访问方式为通过进程的环境变量列表

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

### 7、将变量传递给命令（进程）

在 shell 给命令，传递变量方式如下：

* 导出的环境变量 `export A=xxx`，调用命令（比如 `env`），在进程中通过 环境变量 列表即可查看到变量的值。这样做 变量 A 会污染整个 shell 脚本的变量空间
* 导出的环境变量

### 8、作用域

### 9、操纵变量的几种方式

* set 查看全部类型变量，设置当前 shell 一些属性
* unset 取消一个变量
* `=` 符号，及其修饰符 `local` `export`，创建/修改一个变量
* declare 查看全部类型变量，创建全部类型变量，**修改变量的属性**
* env 查看所有 export 变量

## 三、shell 操作符

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

### 3、数组操作

* 下标从 0 开始（zsh 以 1 开始）
* 定义数组：使用小括号扩起来的，以空白字符分割的字符串

```bash
# 定义数组
arr1=("114.114.114.114" "8.8.8.8" "8.8.4.4")
arr2=(a b c)

# 修改元素
arr2[1]=bb

# 访问元素
echo ${arr2[0]}

# 删除元素
unset arr2[1]

# 数组长度
echo ${#arr2[@]}
```

### 4、变量默认值

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

### 5、逻辑运算符

* `;` 顺序多个命令，不管前后是否出错
* `命令1&&命令2` 短路与特性，两者同时执行或同时不执行
* `命令1||命令2` 前者不正确，后者才执行；前者执行，后者不执行
* 利用 `&&` 和 `||` 实现三目运算符 `命令1 && 命令2 || 命令3`

### 6、字符串运算符

参考： https://www.cnblogs.com/sparkdev/p/10006970.html

**字符串拼接**

```bash
c="$a$b"
```

**字符串长度**

```bash
string="abcde"
echo ${#string}
```

**字符串切片**

```bash
MyString=abcABC123ABCabc
echo ${MyString:3}       # ABC123ABCabc，注意：此时索引是从 0 开始的。
echo ${MyString:1:5}     # bcABC
```

**删除子串**

```bash
MyString=abcABC123ABCabc
MyPath="/path/to/file.tar.gz"

# ${string#substring} # 从 $string 的开头位置截掉最短匹配的 $substring。
# 截掉 'a' 到 'C' 之间最短的匹配字符串。
echo ${MyString#a*C} # 123ABCabc
ext=${MyPath#*.} # 获取后缀
echo ${ext}

# ${string##substring} # 从 $string 的开头位置截掉最长匹配的 $substring。
# 截掉 'a' 到 'C' 之间最长的匹配字符串。
echo ${MyString##a*C} # abc
filename=${MyPath##*/} # 获取文件名
echo $filename # file.tar.gz

# ${string%substring} # 从 $string 的结尾位置截掉最短匹配的 $substring。
# 从 $MyString 的结尾位置截掉 'b' 到 'c' 之间最短的匹配。
echo ${MyString%b*c} # abcABC123ABCa
dirPath=${MyPath%/*} # 获取文件所在目录
echo $dirPath # /path/to

# ${string%%substring} # 从 $string 的结尾位置截掉最长匹配的 $substring。
# 从 $MyString 的结尾位置截掉 'b' 到 'c' 之间最长的匹配。
echo ${MyString%%b*c} # a
filenameNoExt=${filename%%.*} # 获取不包含后缀的文件名
echo $filenameNoExt # file
```

**子串替换**

* `${string/substring/replacement}` 使用 `$replacement` 来替换第一个匹配的 `$substring`。
* `${string//substring/replacement}` 使用 `$replacement` 来替换所有匹配的 `$substring`。
* `${string/#substring/replacement}` 如果 `$substring` 匹配 `$string` 的开头部分，那么就用 `$replacement` 来替换 `$substring`。
* `${string/%substring/replacement}` 如果 `$substring` 匹配 `$string` 的结尾部分，那么就用 `$replacement` 来替换 `$substring`。

**字符串格式化**

shell 内置命令

```bash
printf '%s\n%s\n%s' a b c
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

### 1、if

```bash
if <logic_expr> ;then
    # stat
elif <logic_expr> ;then # optional
    # stat
else # optional
    # stat
fi
```

### 2、case

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
for i in <arr>
	do
		语句
	done
```

### 5、while

```bash
while <logic_expr>
	do
		语句
	done
```

### 6、until

`until <logic_expr>` 等价于 `while ! <logic_expr>`

```bash
until <logic_expr>
	do
		语句
	done
```

### 7、函数

基本结构

```bash
func_name(){
    # do sth
    return 0 # optional 默认返回 0
}
```

函数参数，参见 [4、位置参数变量](#4-位置参数变量)

函数返回值。通过 `return` 只能返回 数字，该数字只能用来进行逻辑判断。

如果想返回字符串，只能通过 在函数中 `echo` 然后通过 `$()` 调用函数获得

```bash
foo(){
    echo "$@"
}

ret= $(foo 1 2 3)
echo $ret # 输出 1 2 3
```

### 8、逻辑判断语句

下面所有例子都可以用于 if 等流程判断语句，所有语句都可以使用 `&&` `||` 进行连接

https://wangdoc.com/bash/condition.html

#### 核心

* if 等流程判断语句，通过检查进程的退出码来进行流程控制，因此任意一个语句都可以作为流程控制语句
* test 内置命令是流程判断语句的核心，`[]` `[[]]` `&&` `||` `(())` 都是 test 的语法糖

#### 字符串

```bash
# 存在（为空串"" 或者已定义）
[ "$var" ]
# 相等
[ "$var"x = "abc"x ]
[ "$var"x == "abc"x ]
# 不等
[ "$var"x != "abc"x ]
! [ "$var"x = "abc"x ]
# 前缀
[[ x"$var" = x"abc"* ]]
# 后缀
[[ *"$var"x = *"abc"x ]]
# 字典序比较
[ string1 '>' string2 ]
[ string1 '<' string2 ]
```

#### 数字

```bash
[ integer1 -eq integer2 ]
[ integer1 -ne integer2 ]
[ integer1 -le integer2 ]
[ integer1 -lt integer2 ]
[ integer1 -ge integer2 ]
[ integer1 -gt integer2 ]

((1 < 2))
((1 == 2))
((1 <= 2))
((1 >= 2))
((1 != 2))
```

#### 文件判断

* `test 选项 参数` 或者 `[ 选项 文件或目录 ]`

```bash
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
```

#### 命令是否存在

```bash
if type "vim" > /dev/null 2>&1; then
  echo "已安装"
else
  echo "未安装"
fi

if ! type "fasdfgasd" > /dev/null 2>&1; then
  echo "未安装"
else
  echo "已安装"
fi
```

#### 文件是否包含字符串

```bash
# grep -q 判断文件内容是否存在
if ! grep -q '待查找字符串' 文件名; then
	echo '字符串不存在'
fi
```

#### true

内置命令

## 七、常见场景

### 内置选项解析器getopts

基本用法

```bash
D=""
P=""
C="False"
while getopts "hd:p:c" opt; do
    case $opt in
    h)
        echo "Usage: xxx"
        echo "    Option:"
        echo "        -c open mysql cli"
        exit 0
        ;;
    d)
        D="$OPTARG"
        ;;
    p)
        P="$OPTARG"
        ;;
    c)
        C="True"
        ;;
    \?)
        echo "Invalid option: -$OPTARG" >&2
        ;;
    :)
        echo "Option -$OPTARG requires an argument." >&2
        exit 1
        ;;
    esac
done

echo D
echo P
echo C
```

### 动态执行字符串命令

```bash
CMD='ls -al'
eval $CMD
# 等价于 $() 或者 ``
```

### 多行文本处理

**定义多行文本变量**

```bash
# 方法 1
A=$(cat <<EOF
abc
def
EOF
)
echo $A
# 方法 2
nl=$'\n'
msg="Line 1${nl}Line 2"
echo $msg
```

**某命令输出的多行文本赋值到变量**

```bash
OUTPUT=$(python <<EOF
print 'hello'
EOF
)
```

**输出多行文本到标准输出或管道**

```bash
A=$(cat <<EOF
abc
def
EOF
)
LAST=$(echo -e "$A" | tail -1)
```

### 常见的循环操作

**数组遍历**

```bash
DNS_ARR=("114.114.114.114" "8.8.8.8" "8.8.4.4")
DNS=""

for ONE in ${DNS_ARR[@]}
do
  DNS="$DNS\nnameserver $ONE"
done
```

**目录遍历**

```bash
for p in ./gnome-shell-extendsion/*
do
	echo $p
done
```

### 获取用户输入

```bash
read -p 'tips' VAR
```

### 获取当前脚本所在目录

```bash
#!/usr/bin/env bash

case "`uname`" in
    Linux)
        ABS_PATH=$(readlink -f $(dirname $0))
        ;;
        *)
        ABS_PATH=`cd $(dirname $0); pwd`
        ;;
esac
```

### 如果字符串不存在则添加到文件中

```bash
# 添加到文件尾部
grep -q '[[ -r /etc/profile ]] && . /etc/profile' ~/.bashrc || echo '[[ -r /etc/profile ]] && . /etc/profile' >> ~/.bashrc
# 添加到文件首部
grep -q '[[ -r ~/.bashrc ]] && . ~/.bashrc' ~/.zshrc || printf '%s\n%s\n' '[[ -r ~/.bashrc ]] && . ~/.bashrc' "$(cat ~/.zshrc)" > ~/.zshrc
```

### 网络请求和json解析

* jq [教程](https://www.baeldung.com/linux/jq-command-json) | [官网](https://stedolan.github.io/jq/)

```bash
# 解析网络请求 json 返回体的 mgs 字段
msg=$(curl -fsSL https://xxx | jq -r '.msg')
```

### 文件下载

```bash
# 常用写法（自定义文件名+覆盖写入文件）
# https://linux.die.net/man/1/wget
# 没有 tty 配置
wget -q --show-progress --progress=bar:force <url> -O <写入文件>
# 有 tty 配置
wget -q --show-progress --progress=dot:mega <url> -O <写入文件>

# 静默下载
curl -fsSL <url> -o <写入文件>
```

### 执行一个网络上的脚本

```bash
curl -fsSL https://get.docker.com | sudo sh
```

## 八、zsh

### 0、安装配置参见

https://segmentfault.com/a/1190000022813972

### 1、自动完成脚本

* [blog](https://askql.wordpress.com/2011/01/11/zsh-writing-own-completion/)
* [Q&A](https://stackoverflow.com/questions/26121022/writing-own-oh-my-zsh-plugin)

创建一个目录，用于存放提示脚本 `~/.zsh.d`

将脚本加入到 `rpath` 环境变量 `vim ~/.zshrc`（注意如果安装了 `oh my zsh`，请将其**写入在文件的开头**）

```bash
fpath=(~/.zsh.d/ $fpath)
```

编写脚本，文件名命名必须以 `_` 开头，比如 `_hello`

```bash
#compdef hello

_arguments "1: :(World)"
```

更多参见： [blog](https://askql.wordpress.com/2011/01/11/zsh-writing-own-completion/)
