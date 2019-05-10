---
title: UNIX高级编程（一）
date: 2018-06-12T23:33:17+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/153
  - /detail/153/
tags:
  - linux
---

## 第一讲 序言

### 1.1 系统调用的实现方式方式？

* 早期使用中断方式系统调用
  * Windows `0x2e` 号
  * Linux `0x80` 号
* 现代使用专门的指令
  * Intel32：`sysenter/sysexit`
  * Intel64|AMD64：`syscall/sysret`

### 1.2 系统调用和库函数API的关系？

API是对系统调用的封装

## 第二讲 文件的操作

### 2.1 open

```c
#include<fcntl.h>
int open(const char* pathname, int oflag, ...)
```

参数说明：

* `pathname` 文件路径
* `oflag`
  * 文件打开模式，三选一
    * `O_RDONLY`
    * `O_WRONLY`
    * `O_RDWR`
  * 其他可组合标志
    * `O_APPEND` 每次写的数据都添加到文件尾
    * `O_TRUNC` 截断打开（打开后文件清零）
    * `O_CREAT` 若文件不存在，则创建该文件，需指定第三个参数
    * `O_EXCL` 若同时指定了O_CREAT标志，而文件已经存在，则会出错。可用于测试文件是否存在
* `mode` 可选参数，创建文件的权限
* `@return`
  * 0 成功
  * -1 出错

#### 2.1.1 文件描述符的本质？

已打开文件的索引

#### 2.1.2 如何通过文件描述符找到需要访问的文件？

打开的文件会记录在`PCB:task_struct`的`files`结构中

每打开一个文件`files:files_struct`的`fd`数组就有一项指向`file`结构

`file`是一个对打开文件设置的标志和文件偏移量记录，通过`file`可以找到索引节点`inode`从而找到整个文件

`inode` 是一个文件的元数据，包含所有者所属组权限、时间、大小等

```
task_struct    files_struct    file            dentry      inode
PCB         -> files        -> fd[文件描述符] -> f_dentry -> d_inode
```

### 2.2 creat

```c
#include<fcntl.h>
int creat(const char *pathname, mode_t mode)
```

参数说明

* `pathname` 文件路径
* `mode` 可选参数，创建文件的权限
* `@return` 只写文件的描述符，若文件存在，则文件大小变为0

### 2.2.1 如何通过open实现creat

```c
open(pathname,
        O_WRONLY | O_CREAT | O_TRUNC,
        mode);
```

* 只写打开|创建文件|截断方式

### 2.2.1 creat不足？如何解决？或者 若要创建一个临时文件，并先写后读该文件 如何做？

必须以只写方式打开，若要创建一个临时文件，并先写后读该文件，需要close再打开。

直接使用：

```c
open(pathname,
      O_RDWR | O_CREAT | O_TRUNC,
      mode);
```

### 2.3 lseek

```c
#include<fcntl.h>
off_t lseek(int filedes, off_t offset, int whence)
```

参数说明

* `filedes` open/creat函数返回的文件描述符
* `offset`
  * 相对偏移量：需结合whence才能计算出真正的偏移量，
  * 类型off_t：通常情况下是32位数据类型
* `whence` 该参数取值是三个常量之一
  * `SEEK_SET` 相对于文件开头 `0+offset`
  * `SEEK_CUR` 相对于当前文件偏移量 `cur+offset`
  * `SEEK_END` 相对与文件末位 `end+offset`
* `@return int`
  * 非0 新的文件偏移量
  * -1 错误

### 2.3.1 如何获得当前的偏移量？

```c
off_t CurrentPosition;
CurrentPosition = lseek(fd, 0, SEEK_CUR);
```

lseek操作并不引起任何I/O操作，只是修改内核中的记录 `file.f_pos`

### 2.3.2 空洞文件，读空洞返回？空洞文件是否占用磁盘空间？

* 返回0
* 不占物理空间
* 作用，多线程下载

#### 2.3.3 O_APPEND打开文件后使用lseek改变游标后的读写效果？

* lseek 到已存在文件位置
  * 读，从修改后的位置读
  * 写，仍然在文件结尾写
* 原因：每次写操作之前，现将偏移量设置为文件的长度
* lseek 形成空洞
  * TODO 先写后读
  * TODO 添加实验一 实验代码2.5

### 2.4 read

```c
#include<fcntl.h>
ssize_t read(int fd, void *buff, size_t nbytes)
```

参数说明

* `fd` 文件描述符
* `buff` 指向缓冲区，用于存放从文件读出的数据
* `nbytes` unsigned int；需要从文件中读出的字节数，一般为 sizeof(buff)
* return int
  * `>0` 返回从文件中实际读到的字节数
  * `0` 当读到文件结尾时，则返回
  * `-1` 错误

### 2.5 write

```c
#include<fcntl.h>
ssize_t write(int fd, const void *buff, size_t nbytes);
```

参数说明

* `fd` 文件描述符
* `buff` 指向缓冲区，用于存放从文件读出的数据
* `nbytes` unsigned int；需要写入文件的字节数，一般为 sizeof(buff)
* `@return int`
  * `other` 返回实际写入文件的字节数
  * `-1` 错误

#### 2.5.1 write出错的原因

* 磁盘满
* 没有访问权限
* 超过了给定进程的文件长度限制

#### 2.5.2 当从文件中间某处写入数据时，是插入操作？覆盖操作？还是不能写

覆盖

### 2.5 close

关闭或将文件引用数-1

```c
#include<fcntl.h>
int close(int filedes)
```

参数说明

* `fd` 文件描述符
* `@return int`
  * `0` 成功
  * `-1` 错误

当进程退出时，会关闭当前所有已打开的文件描述符

#### 2.5.1 close做了那些工作

* 当clsoe函数关闭文件时，会释放进程加在该文件上的所有记录锁
* 内核会对进程打开文件表、文件对象、索引节点表项等结构进行修改，释放相关的资源

### 2.6 IO效率

#### 2.6.1 如何提高IO效率？

将BUFFSIZE设置为4096

#### 2.6.2 为何4096左右IO效率最高？

* Linux文件系统采用了某种预读技术
* 当检测到正在进行顺序读取时，系统就试图读入比应用程序所要求的更多数据
* 并假设应用程序很快就会读这些数据
* 当BUFFSIZE增加到一定程度后，预读就停止了

### 2.7 文件共享

#### 2.7.1 进程间文件共享的是什么情况？ 或 不同进程打开同一个文件发生什么？

两个独立进程各自打开同一个文件？

* 共享的是inode节点
* 每个进程都有自己的文件偏移量

父子进程对打开文件的共享情况

* 共享了file结构，所以共享了文件偏移量
* 文件操作存在竞争

#### 2.7.2 进程内共享文件

* 多个文件描述符指向同一个file结构
* 通常由dup、dup2函数调用产生

#### 2.7.3 dup与dup2的区别？

用于复制已存在文件描述符

```c
int dup(int filedes);
```

* `filedes` 文件描述符
* `@return` 成功返回新的文件描述符（最小可用的一个）

```c
int dup2(int filedes, int filedes2);
```

* `filedes` 文件描述符，从哪里复制，源
* `filedes2` 文件描述符，复制到哪里，目的
* `@return` 成功返回新的文件描述符
* 若`filedes2`已存在，先关闭，再复制
* 若`filedes2 == filedes`则直接返回`filedes`

原理：两个文件描述符指向同一个`file`结构

答案：

* dup 返回新的文件描述符（最小可用的一个）
* dup2 复制到指定位置
  * 若`filedes2`已存在，先关闭，再复制
  * 若`filedes2 == filedes`则直接返回`filedes`

#### 2.7.4 假设已打开文件描述符0、1、2？

* 调用dup2(1, 6)，dup2返回值是多少？
  * 6

* 然后再调用dup(6)，dup返回值是多少？
  * 3

### 2.8 其他IO函数

linux写入磁盘的策略：

* 通常Linux实现在内核中设有缓冲区高速缓存或页面高速缓存大多数的磁盘I/O都通过缓冲区进行
* 当将数据写入文件时，内核通常先将数据复制到某一个缓冲区中
* 如果该缓冲区满或者内核需要重用该缓冲区，则将该缓冲排入到输出队列
* 等到其达到队首时，才进行实际的磁盘读写操作
* 延迟写

```
用户缓冲区 -> 内核缓冲区 -> 输出队列 -> 发送给磁盘
```

* sync/fsync/fdatasync 用于刷缓冲
  * `void sync()` 将所有修改过的缓冲区排入写队列，然后就返回并**不等待**实际的写磁盘操作结束
  * `int fsync(int filedes);` 指定文件，并且**等待**写磁盘操作结束后才返回，包括文件数据和元数据
  * `int fdatasync(int filedes);` 和fsync类似，只影响文件的数据部分
* `int fcntl(int filedes, int cmd, .../* int arg */)` 用于改变已打开文件的模式
  * `filedes` 文件描述符
  * `cmd` 枚举值，以下五选一
    * `F_DUPFD` 复制现有文件描述符，此时第三个参数为复制的目的，若已打开，选择大于其最小的一个
    * `F_GETFD` 获取filedes对应的标志，作为返回值返回。仅有一个`FD_CLOEXEC`
    * `F_SETFD` 设置文件描述符filedes对应的标志
    * `F_GETFL` 返回文件描述符filedes对应的文件状态标志，包括如下内容
      * `O_RDONLY`
      * `O_WRONLY`
      * `O_RDWR`
      * `O_APPEND`
      * `O_NONBLOCK`		非阻塞方式
      * `O_SYNC`		等待写方式
      * `O_ASYNC`		异步方式(仅4.3+BSD)
    * `F_SETFL` 设置为文件状态标志
    * `F_GETOWN` 获取当前接收SIGIO和SIGURG信号的进程ID或进程组ID
    * `F_SETOWN` 设置接收SIGIO和SIGURG信号的进程ID或进程组ID
* `ioctl` I/O操作的杂物箱
  * 其实现的功能往往和具体的设备有关系
  * 设备可以自定义自己的ioctl命令
  * 操作系统提供了通用的ioctl命令
  * ioctl类似于windows的DeviceIoControl函数

#### 2.8.1 假设文件描述符0、1、2被占用

* fcntl(1, F_DUPFD, 5)返回什么？
  * 5
* fcntl(2, F_DUPFD, 1)返回什么？
  * 3

#### 2.8.2 fcntl的F_DUPFD实现类似dup、dup2效果？

* `dup(filedes)`等价于`fcntl(filedes, F_DUPFD, 0)`
* `dup2(filedes, filedes2)`不完全等价于 `close(filedes2);fcntl(filedes, F_DUPFD, filedes2);`，不完全等价的原因
  * dup2是原子操作但后者不是
  * 错误号不同

#### 2.8.3如何获取文件的打开标志？

```c
int fd = open(/*.......*/);
int val = fcntl(fd, F_GETFL);
int accmode = val & O_ACCMODE;

if(val & O_APPEND)
{
  //文件状态标志中包括O_APPEND
}
```

#### 2.8.4 如何删除或添加某文件的某个标志？

* 首先get
* 然后
  * 添加：`val |= flags;`
  * 删除：`val &= ~flags;`
* 然后set

```c
void set_fl(int fd, int flags)
{
    int     val;
    if ((val = fcntl(fd, F_GETFL, 0)) < 0)
        err_sys("fcntl F_GETFL error");

    val |= flags;

    if (fcntl(fd,F_SETFL,val) < 0)
        err_sys("fcntl F_SETFL error");
}
```

### 2.8 ext2文件系统在磁盘上的组织

**分区：**

* 分区被划分成一个个的块block,每个块均有编号
* block大小为1k或者4k

| 块0 | 块1 | 块2 |...|
|-----|----|-----|---|

**块组：**

* 若干块聚集在一起，形成一个块组
* 分区被划分成若干个块组
* 每个块组所包括的块个数相同

块组逻辑内容如下：

| 超级块 | 组描述符 | 块位图 | 索引节点位图 | 索引节点表 | 数据块 |
|-----|----|-----|---|----|----|

超级块

* 每个块组都包含有一个相同的超级块, 超级块重复的主要目的：灾难恢复
* 超级块用于存放文件系统的基本信息
* 内容如下
  * s_magic，文件系统版本，ext2文件系统标识0xef53
  * s_log_block_size：可由它得出块大小
  * 块组包括的块个数、包括的索引节点个数，总的块个数

组描述符

* 一个块组其他部分的指针
* 包含内容如下
  * bg_block_bitmap：指向块位图
  * bg_inode_bitmap：指向索引节点位图
  * bg_inode_table：指向索引节点表

块位图

* 表示`块`是否被占用

索引节点位图

* 表示`索引块`是否被占用

索引节点表

* 索引节点表由若干个索引节点组成
* 一个索引节点对应了一个文件（目录也是一种文件）
* 每个索引节点都有一个编号，这个编号是**全局**的，从1开始计数这个编号叫做`inode`
* 索引节点：
  * 文件的元信息包括权限所属组所有者等
  * 引用计数
  * i_block数据，指向文件内容块的指针

**目录**

* 目录也是一种文件
* 通过其索引节点中的i_block字段，可以找到存放目录文件内容的数据块
* 目录的内容具有固定的格式
* 目录文件按照固定的格式记录了目录包含了哪些文件
* 目录文件由目录项组成，内容如下
  * inode，文件的索引节点号
  * 文件类型
  * 文件名

#### 2.8.1 如何在ext2文件系统中找到一个文件？

假设查找文件/root/test，假设/root的索引节点号已知，为1400

* 根据索引节点号，访问磁盘，获取索引节点

(1400-1) / s_inodes_per_group = 1399 / 300 = 4 ... 199

所以在第4块组的第199个索引节点（编号：1400）

* 根据索引节点中的`块指针i_block`，查找数据块内容获取到目录文件，根据文件名获取到相关目录项
* 从test目录项中的索引节点号，获取索引节点
* 从索引节点中的`块指针i_block`获取到文件数据

### 2.9 stat、fstat、lstat函数

获取有关文件的信息结构

```c
int stat(const char* restrict pathname,
    struct stat* restrict buf);
```

* `pathname`：文件名，需要获取该文件的信息
* `buf：stat` 函数将pathname对应的文件信息，填入buf指向的stat结构中
* `@return`：
  * 0成功；
  * -1出错

`restrict` 关键字：

* 表明该指针是访问一个数据对象的唯一且初始的方式（也就是说，不能将该指针赋给其他指针变量）
* 只能用于限定指针
* 让编译器进行编译优化

其他类似函数

```c
int stat(const char* restrict pathname,
            struct stat* restrict buf);
int fstat(int filedes, struct stat *buf);
//lstat返回符号链接本身的信息
int lstat(const char* restrict pathname,
            struct stat* restrict buf);
```

stat结构

```c

struct stat {
  ino_t         	st_ino;      		/* inode number*/
  mode_t       	st_mode;     	/* file type & mode */
  nlink_t       	st_nlink;    	/* number of hard links */
  uid_t         	st_uid;      		/* user ID of owner */
  gid_t         	st_gid;      		/* group ID of owner */
  off_t         		st_size;     	/* total size, in bytes */
  unsigned long 	st_blksize;  	/* blocksize  */
  unsigned long 	st_blocks;   	/* number of blocks allocated
  time_t        	st_atime;    	/* time of last access */
  time_t        	st_mtime;    	/* time of last modification */
  time_t        	st_ctime;    	/* time of inode last change
};
```

### 2.10 文件的基本性质

主要是`stat`结构体的内容

* 文件类型
  * 普通文件
  * 目录文件
  * 字符特殊文件	提供对设备不带缓冲的访问
  * 块特殊文件		提供对设备带缓冲的访问
  * FIFO文件		用于进程间的通信，命名管道
  * 套接口文件		用于网络通信
  * 符号链接		使文件指向另一个文件
  * 判断文件类型的宏
    * 普通文件		S_ISREG()
    * 目录文件		S_ISDIR()
    * 字符特殊文件	S_ISCHR()
    * 块特殊文件		S_ISBLK()
    * FIFO文件		S_ISFIFO()
    * 套接口文件		S_ISSOCK()
    * 符号连接		S_ISLINK()
* **用户ID和组ID**
  * 第一种ID：Linux是多用户操作系统中的ID概念，是登录系统的唯一表示
  * 第二种ID：文件所有者相关，文件的所有者所属组，用于控制文件的访问权限
  * 第三种ID：进程中概念——`实际用户ID`和`实际组ID`（不管是否使用sudo，该ID不变）
    * 进程的实际用户ID：运行该进程的用户的ID
    * 进程的实际组ID：运行该进程的用户所属的组ID
  * 第四种ID：进程中概念——`有效用户ID`和`有效组ID`（用于用户访问文件的权限检查）
    * sudo会改变这个ID
    * 通过`设置用户ID位`和`设置组ID位`，可执行文件的一种标记，当设置了之后，执行该文件时，进程的有效用户ID变为文件的所有者，比如root一些可执行文件`passwd`
  * 第五种ID：保存的设置用户ID，保存的设置组ID
    * 上述两者在执行一个程序时包含了有效用户ID和有效组ID的副本
* 文件访问权限
  * 分文件所有者权限、所属组权限、其他权限，每个权限组有读写执行三个项目
  * st_mode低11bits包含去所有权限
    * [8-6] 文件所有者
    * [5-3] 所属组
    * [2-0] 其他
    * 9 粘住位
    * 10 设置组ID
    * 11 设置用户ID
    * 目录必须有执行权限x才内进入（cd）
    * 目录创建文件，目录必须有wx
    * 目录删除文件，目录必须有wx，**对文件不需要读写权限**
* 新文件和目录的所有权
  * 新文件的所有者ID：即创建该文件的进程的`有效用户ID`
  * 新文件的组ID：两种方式（Linux取决于`设置组ID`是否被设置）
    * 创建该文件的进程的有效组ID
    * 新文件所在目录的组ID
* 文件时间
  * 文件数据的最后访问时间
  * 文件数据的最后修改时间
  * inode节点状态的最后更改时间

判断文件类型

```c
struct stat buf;
lstat( filename, &buf);
if (S_ISDIR(buf.st_mode))
  cout << “directory” << endl;
```

更改文件的访问时间、修改时间

```c
int utime(const char* pathname,
           const struct utimbuf *times);
```

* `pathname`：文件名，即需要修改时间属性的文件
* `times:utimbuf`：
  * `utimbuf.actime` 访问时间
  * `utimbuf.modtime` 修改时间
  * `times＝NULL`时表示，使用当前时间更改文件的最后访问时间、最后修改时间
* `@return`：
  * 0 成功
  * -1 出错

#### 2.10.1 进程操作文件的鉴权过程？

* 若进程为`有效用户ID`为0，直接允许（`root` 或者 `sudo`）
* 若进程的`有效用户ID`等于`文件的所有者ID`（即该进程拥有文件）
  * 检查`文件所有者存取许可权`是否允许
* 若进程的`有效组ID`或进程的`添加组ID`之一等于`文件组ID`：
  * 检查`文件所属组存取许可权`是否允许
* 检查`其他用户存取许可权`是否允许

#### 2.10.2 为什么需要设置用户/组ID？

比如说某些普通用户需要操作root拥有的文件，比如`passwd`命令需要修改`/etc/passwd`,该文件属于root，所以需要设置用户组ID

### 2.11 修改文件属性的函数

用于按实际用户ID和实际组ID进行存取许可权测试

```c
int access(const char* pathname, int mode);
```

* `pathname` 文件名
* `mode` 四种取值方式
  * `R_OK`		测试读许可权
  * `W_OK`		测试写许可权
  * `X_OK`	    测试执行许可权
  * `F_OK`		测试文件是否存在
* `@return int`
  * 0 成功
  * -1 出错

用于为进程设置文件方式创建屏蔽字，即参与指定文件的访问权限

```c
mode_t umask(mode_t cmask);
```

用于改变现有文件的存取许可权

```c
int chmod(const char* pathname, mode_t mode);
int fchmod(int filedes, mode_t mode);
```

chmod在下列条件下自动清除两个许可权位

* 如果试图设置普通文件的粘住位（S_ISVTX），而且又没有超级用户权限，则mode中的粘住位自动被关闭。这意味着只有超级用户才能设置普通文件的粘住位。

用于更改文件的用户ID和组ID

```c
int chown(const char* pathname, uid_t owner, gid_t group);
int fchown(int fd, uid_t owner, gid_t group);
int lchown(const char *pathname,
                 uid_t owner,
                 gid_t group); //更改符号链接本身的所有者，而不是符号链接所指向的文件
```

改变文件的长度

```c
int truncate(const char* pathname,
               off_t length);
int ftruncate(int fd, off_t length)
```

* 当`文件以前的长度>length`时，则超过length以外的数据将不复存在
* 当`文件以前的长度<length`时，在文件以前长度到length之间，将形成空洞，读该区域，将返回0
* `mode_t` 12种取值

#### 2.11.1 粘住位是什么？

如果一可执行程序文件的这一位被设置了，那么在该程序第一次执行并结束时，该程序正文被保存在交换区中，这使得下次执行该程序时能较快地将其装入内存

交换区中，文件所占用的数据块是连续存放的

#### 2.11.2 普通用户使用chown权限问题

* 有效用户id为root，可以更改文件的用户ID
* 非超级用户进程更改文件拥有者ID
  * 进程拥有该文件（有效用户ID等于文件的所有者ID）
  * owner等于文件的用户ID，group等于进程的有效组ID或进程的添加组ID之一

### 2.12 硬链接和符号连接

创建硬链接

```c
int link(const char* existingpath,
          const char* newpath);
```

删除硬链接或删除文件

```c
int  unlink ( const char *pathname);
int  remove( const char *pathname);
```

* 删除目录相
* unlink是系统调用，
* remove是库函数，remove的参数为：
  * 普通文件时等价于unlink，
  * 目录时等价于rmdir。

用于更名文件或目录

```c
int rename(const char *oldname,
             const char * newname);
```

符号链接

```bash
ln   -s   文件路径   链接名
```

该函数创建了一个指向actualpath的新目录项sympath

```c
int symlink(const char* actualpath,
              const char* sympath);
```

读符号链接本身

```c
int readlink(const char* pathname,
              char* buf, int bufsize);
```

* chown、remove、unlink等就直接处理符号连接文件

#### 2.12.1 硬链接共享的是什么？

共享文件索引节点，在目录中添加一个目录项，将文件索引节点的引用计数+1

#### 2.12.2 unlink和remove的关系

* unlink是系统调用，
* remove是库函数，remove的参数为：
  * 普通文件时等价于unlink，
  * 目录时等价于rmdir。

### 2.13 目录操作

创建目录

```c
int mkdir(const char *pathname,
            mode_t mode);
```

删除空目录

```c
int rmdir(const char *pathname);
```

读目录

```c
DIR* opendir(const char* pathname);
```

读取目录项

```c
struct dirent *readdir(DIR *dp);
```

dirent结构

```c
struct dirent{
   ino_t d_ino; //索引节点号
   char d_name[NAME_MAX + 1]; //文件名
   ................
}
```

用来设置目录流目前的读取位置为原来开头的读取位置

```c
void rewinddir(DIR *dp);
```

关闭目录

```c
int closedir(DIR *dp);
```

改变进程的当前工作目录

```c
int chdir(const char *pathname);
int fchdir(int filedes);
```

返回当前工作目录的绝对路径

```c
char *getcwd(char *buf, size_t size);
```

#### 2.13.1 获得目录下的所有文件

```c
DIR *dir;
struct  dirent  *ptr;
dir=opendir("/etc/rc.d");
while((ptr=readdir(dir))!=NULL)
{
   printf("d_name: %s\n", ptr->d_name);
}
```

## 第三讲 标准IO

假设库文件包含a.h、a1.cpp、a2.cpp

### 3.1 编写静态库

假设库文件包含a.h、a1.cpp、a2.cpp

创建库

```bash
g++ -c a1.cpp a2.cpp
ar -rc libtest.a a1.o a2.o
```

使用静态库

```bash
g++ -o statictest statictest.cpp –L. -ltest
# -o 输出文件名
# -L. 库文件所在目录
# -ltest 指定test库，实际上查找的是 libtest.a文件
```

### 3.2 动态库编写

创建库

```bash
g++ -fpic –shared –o libtest.so a1.cpp a2.cpp
# -fpic Position Independent Code 指生成为位置无关代码
# -shared 指生成动态库（共享库）
# -o 是定输出文件名
# 源文件名
```

### 3.3 动态库的使用

加载动态库

```c
#include<dlfcn.h>
void *dlopen(const char *file, int mode);
```

* `file` 文件路径
* `mode` 动态链接库的使用方式，例如RTLD_LAZY：动态的加入动态链接库中的函数
* `@return void*` 引用动态链接库的句柄；出错返回NULL

获取动态库中的符号指针

```c
#include<dlfcn.h>
void *dlsym(void *handle, const char *FuncName);
```

* `handle`：dlopen的返回值
* `FuncName`：动态链接库中的函数名
* `@return`：FuncName函数被加载后，在进程地址空间中的地址；出错返回NULL

查看出错原因

```c
#include<dlfcn.h>
char *dlerror();
```

* 当dlopen、dlsym等函数出错时，dlerror返回字符串说明这些函数出错的原因

卸载动态链接库

```c
#include<dlfcn.h>
int dlclose(void *handle);
```

* `handle`：dlopen的返回值

#### 3.3.1 动态库出错的情况？

使用C++编写动态库，函数名在编译时会按照一定规则修改，以实现函数重载（使用`nm libtest.so`参看符号）

这样在使用dlsym查找符号时就会出现未定义符号的问题

解决方案：使用`extern "C"` 导出符号

#### 3.3.2 库的编写的注意事项？

* 导出函数的名称一致
  * 使用`extern "C"`保证符号名不变
* 函数调用约定一致
  * C语言调用约定
    * 实现：
      * `void __cdecl f(int a, int b);`  VC环境
      * `void f(int a, int b) __attribute__((cdecl))` g++环境
    * 特点：
      * `f`被表示成`_f`
      * 从右至左，将参数压入堆栈
      * 函数调用者负责压入参数和堆栈平衡
  * 标准调用约定
    * 实现：
      * `void __stdcall f(int a, int b);`   VC环境
    * 特点：
      * `f`被表示成`_f@8`；8表示参数的字节数
      * 从右至左，将参数压入堆栈
      * 函数内负责堆栈平衡
  * 快速调用约定
    * 实现：
      * `void __fastcall f(int a, int b);`   VC环境
    * 特点：
      * 由寄存器传送参数，用ecx和edx传送参数列表中前两个双字或更小的参数，剩下的参数仍然从右至左压入堆栈
      * 函数内负责堆栈平衡
  * C++类成员调用约定
    * 特点：
      * C++类成员函数的调用约定：thiscall
      * this指针存放于ecx寄存器中
      * 参数从右至左压入堆栈
* 结构体对齐
  * **对齐计算**
    * 确定 `#pragma pack(8)` 的值32位为默认为4，64位默认为8
    * 确认结构体中所有类型中最长的类型记为len
    * 确定槽大小 = min(pack, len)
    * 按照声明顺序填充槽，注意每个变量的偏移量可以被类型长度整除
* 谁分配谁释放

### 3.4 标准IO库

**fopen函数**

```c
#include<stdio.h>
FILE *fopen(const char *restrict pathname,
            const char *restrict type);
```

* `pathname`：要打开的文件名
* `type`：
  * r或rb           为读而打开
  * w或wb           使文件长度为0，或为写而创建
  * a或ab           添加；为在文件尾写而打开，或为写而创建
  * r+或r+b或rb+    为读和写而打开
  * w+或w+b或wb+    使文件长度为0，或为读和写而打开
  * a+或a+b或ab+    为在文件尾读和写而打开或创建
* `@return FILE` 结构指针包含如下内容

```c
typedef struct  {
//..............................
char            fd;                        /* File descriptor      */
short           bsize;                  /* Buffer size          */
unsigned char   *buffer;        /* Data transfer buffer */
//....................................
}       FILE;
```

|限制 | r | w | a | r+ | w+ | a+ |
|----|---|---|---|----|----|----|
|文件必须存在|√|||√|||
|删除文件以前内容||√|||√||
|流可以读|√|||√|√|√|
|流可以写||√|√|√|√|√|
|流只在尾端处写|||√|||√|

* `r` 表示读，文件不存在报错；适用于只读
* `w` 表示写，文件存在删除文件原有内容用；适用于覆盖只写
* `a` 表示追加，文件不存在则创建、存在追加；适用于追加（日志记录）
* `+` 表示在原来的基础上添加读或写（保证可读可写）
* `t` 默认文本模式打开
* `b` 表示以二进制方式打开文件

**标准I/O库缓冲**

* 标准I/O库提供缓冲的目的：尽可能减少使用read、write调用的次数，以提高I/O效率。
* 通过标准I/O库进行的读写操作，数据都会被放置在标准I/O库缓冲中中转。

**设置缓冲**

```c
void setbuf(FILE *fp, char *buf);
```

* `fp`：fopen函数的返回值
* `buf`：用户提供的文件缓冲区，其长度为BUFSIZ
  * 若buf为NULL，则为无缓冲
  * 若buf不为NULL，则为全缓冲

**设置缓冲类型**

```c
void setvbuf(FILE *fp, char *buf,
              int mode, size_t size);
```

* `fp`：fopen函数的返回值
* `buf`：用户提供的文件缓冲区，其长度为第四个参数`size`
  * 若buf为NULL，合适长度的系统缓存
  * 若buf不为NULL，长度为size的用户缓存
* `mode`：
  * `_IOFBF`：全缓冲
  * `_IOLBF`：行缓冲
  * `_IONBF`：无缓冲

**刷缓冲**

```c
int fflush(FILE *fp);
```

* `fp`
* `@return`
  * 0 成功
  * EOF 出错

**流的定向**

* 对于ASCII字符集，一个字符用一个字节表示
* 对于国际字符集，一个字符可用多个字节表示
* 流的定向决定了所读、写的字符是单字节还是多字节的

```c
int fwide(FILE *fp, int mode);
```

* `mode<0`，字节定向
* `mode>0`，宽定向
* `mode=0`，返回当前流的定向

在一个特定的流上打开一个指定的文件，如若该流已经打开了，则先关闭该流

```c
FILE *freopen(const char *pathname,
              const char *type, FILE *fp);
```

* `pathname`：要打开的文件名
* `type`：指定流的读写方式
* `fp`：特定的流
* `@return` 如果成功，则返回该指向该流的文件指针，否则返回为NULL。
* 原理应该就是简单修改`fp.fd`

例子：标准输入输出流重定向

```c
freopen("whatasha.in", "r", stdin);
freopen("whatasha.out", "w", stdout);
```

从文件描述符构造输入流

```c
FILE *fdopen(int filedes, const char *type);
```

* `filedes`：文件描述符
* `type`：指定流的读写方式
* `@return` 返回文件指针

关闭流

```c
int fclose(FILE *fp);
```

* `fp`：要关闭的流对应的文件指针
* `@return`：返回0，出错返回EOF
* 在该文件被关闭之前，刷新缓存中的输出数据。缓存中的输入数据被丢弃，如果标准I/O库已经为该流自动分配了一个缓存，则释放此缓存。

**定位流**

类似于lseek函数，即指定从文件的什么地方开始进行读写
通常有两种方法定位标准I/O流

* ftell、fseek函数。
* fgetpos、fsetpos函数。

后者是ANSI C引入的。程序要移植到非unix类操作系统，应使用后者。

用于获取当前文件偏移量

```c
long ftell(FILE *fp);
int fgetpos(FILE *fp, fpos_t *pos);
```

设置当前文件偏移量

```c
int fseek(FILE *fp, long offset, int whence)
int fsetpos(FILE *fp, fpos_t *pos);
```

第三个参数和`lseek`一致

文件偏移量设置到文件的起始位置

```c
void rewind(FILE *fp);
```

**读写流**

对流有三种读写方式

* 每次读写一个字符
* 每次读写一行
* 每次读写任意长度的内容

每次读写一个字符

```c
//读
int getc(FILE *fp);
int fgetc(FILE *fp);
int getchar();

//写
int putc(int c, FILE *fp);
int fputc(int c, FILE *fp);
int putchar(int c);
```

* 返回值：成功返回欲读字符，若已处于文件尾或出错返回EOF
* getc通常是宏，fgetc是函数
* getchar()等同于getc(stdin)
* putchar(c)等同于putc(c, stdout)
* putc通常是宏，fputc是函数

每次读写一行

```c
//读
char* fgets(char *buf, int n, FILE *fp);

//写
char* fputs(const char *str, FILE *fp);
```

直接I/O

* 每次I/O操作读写某种数量的对象，而每个对象具有指定的长度
* 例如，可读写一个二进制数组、结构

```c
size_t fread(void *ptr, size_t size,
              size_t nobj, FILE *fp);
size_t fwrite(const void *ptr,
      size_t size, size_t nobj, FILE *fp);
```

例子：读写一个二进制数组或结构

```c
float data[10];
fwrite(data, sizeof(float), 4, fp);
struct{
   int a;
   int b;
}item;
fwrite(&item, sizeof(item), 1, fp);
```

**格式化IO**

* printf将格式化数据写到标准输出
* fprintf写至指定的流
* sprintf写入数组buf中

```c
//输出
int printf(const char* format, ....);
int fprintf(FILE *fp, const char *format, ...);
int sprintf(char *buf, const char *format, ...);
//输入
int scanf(const char* format, ....);
int fscanf(FILE *fp, const char *format, ...);
int sscanf(char *buf, const char *format, ...);
```

**临时文件**

```c
char  *tmpnam (char *ptr);
FILE  *tmpfile (void );     /* 返回文件指针*/
char  *tempnam (const char *directory, const char *prefix);
```

* 第一个函数产生一个与现在文件名不同的有效路径名字符串（每次调用均不同）。
* 第二个函数创建一个临时二进制文件（wb+），在关闭该文件或程序结束时，该文件自动删除。
* 第三个函数是第一个函数的变体，在产生路径名时，指定其目录和文件名前缀。

**标准IO的替代软件包**

sfio、uClibc、newlibc

#### 3.4.1 为什么要设计标准IO库？

* 直接使用API进行文件访问时，需要考虑许多细节问题
* 例如：read、write时，缓冲区的大小该如何确定，才能使效率最优
* 标准I/O库封装了诸多细节问题，包括缓冲区分配

#### 3.4.2 各种类型缓冲，何时进行实际的读写操作？

**全缓冲**

* 在填满标准I/O缓冲区后，才进行实际I/O操作（例如调用write函数）
* 调用fflush函数也能强制进行实际I/O操作

**行缓冲**

* 在输入和输出遇到换行符时，标准I/O库执行I/O操作
* 因为标准I/O库用来收集每一行的缓存的长度是固定的，所以，只要填满了缓存，即使没有遇到新行符，也进行I/O操作
* 终端（例如标准输入和标准输出），使用行缓冲

**不带缓冲**

* 标准I/O库不对字符进行缓冲存储
* 标准出错是不带缓冲的，为了让出错信息尽快显示出来

#### 3.4.3 fdopen函数作用？

* fdopen常用于由创建管道和网络通信通道函数返回的描述符。
* 这些特殊类型的文件，不能用fopen打开
* 因此必须先调用设备专用函数以获得一个文件描述符
* 然后再用fdopen使一个标准I/O流与该描述符相关联

#### 3.4.4 fdopen函数的type参数的含义？

* 对于fdopen函数，type参数的意义稍由区别
* 因为该描述符已被打开，所以fdopen为写而打开并不截短该文件
* 标准I/O添写方式，也不能用于创建该文件（因为如若一个描述符引用一个文件，则该文件一定已经存在）

#### 3.4.5 如何区分库函数的出错还是文件尾部

* 调用ferror或feof
  * `int ferror(FILE *fp);`
  * `int feof(FILE *fp);`
  * 当遇到文件结束符时，feof返回真，ferror返回假
  * 当出错时，feof返回假，ferror返回真
* `void clearerr(FILE *fp);`用于清除文件出错和结尾标记

#### 3.4.6 标准IO的问题

* 效率不高：使用每次一行函数fgets和fputs时，需要复制两次数据：
  * 复制到库缓冲
  * 从库缓冲复制到内核缓冲

### 3.5 Unix系统数据文件

* Unix系统中许多系统数据文件以文本文件的形式存在，如口令文件、主机信息文件、协议数据文件、网络服务文件等等。
* 系统提供了一系列读取这些数据文件的系统调用，方便对这些系统数据进行查询。

## 第四讲 进程

### 4.1 main函数和命令行参数

```c
int main(int argc, char *argv[]);
```

* `argc`：命令行参数的个数
* `argv`：指向命令行参数的各个指针所构成的数组

#### 4.1.1 `./test Hello World` argv和argc值为什么？

* argc: 3
* argv[0]: ./test
* argv[1]: Hello
* argv[2]: World

### 4.2 进程的启动与终止

**8种方式使进程终止**

正常终止

* 从main返回
* 调用exit
* 调用_exit或_Exit
* 最后一个线程从其启动例程返回
* 最后一个线程调用pthread_exit

异常终止

* 调用abort
* 接到一个信号并终止
* 最后一个线程对取消请求做出响应

**三个终止函数**

```c
void exit(int status);
void _Exit(int status);
void _exit(int status);
```

* `exit`函数执行一个标准I/O库的清理关闭操作（为所有打开流调用fclose函数）后，进入内核
* `_Exit`、`_exit`函数立即进入内核
* `status`：进程的终止状态

**注册用户提供的终止处理函数**

```c
int atexit(void (*func)(void));
```

* 注意：先注册的函数，后被运行。（对战顺序）
* 调用_exit函数并不会触发终止处理函数
* exit会调用这一系列函数

### 4.3 环境表和环境变量

每个进程都会收到一张环境变量表

添加、设置、删除环境变量

```c
int putenv(char *str);
int setenv(const char* name,
             const char* value,
             int rewrite);
int unsetenv(const char* name);
```

#### 4.3.1 如何获取环境变量表

* 直接使用`extern char **environ;`
* 使用`getenv`和`putenv`等函数
* 通过main函数的第三个参数`int main(int argc,char　* argv[],char * envp[])`

#### 4.3.2 设置环境变量的两个函数，都给出了自己的缓冲区存放环境变量。在环境表中是否直接使用这些缓冲区，还是环境表自己分配了缓冲区？

经测试，

* putenv 直接指向了用户缓冲区
* setenv 它会将name和value指向的内容复制一份并为其分配内存，形成 "name=value" 的字符串，并将其地址写入到环境表中。

### 4.4 储存空间分布

**C程序存储空间布局**

* High address
  * 命令行参数和环境变量
  * 栈
  * v
  * ^
  * 堆
  * 未初始化的数据（未初始化的全局变量，初始化为0）
  * 初始化的数据 （初始化的全局变量和static变量）
  * 正文（CPU执行的机器指令部分，正文段通常是共享、只读的）
* Low address

**Linxu地址空间**

查看进程的地址空间

* `cat /proc/进程ID/maps`
* /proc目录中的文件并不是真正的磁盘文件，而是由内核虚拟出来的文件系统，当前系统中运行的每个进程在/proc下都有一个子目录，目录名就是进程的id，查看目录下的文件可以得到该进程的相关信息。

**存储器分配与释放**

* `malloc`：分配指定字节数的存储区，此存储区中的初始值不确定
* `calloc`：为指定数量指定长度的对象分配存储空间，该空间中的每一位都初始化为0
* `realloc`：更改（增加或者减少）以前分配区的长度
* C++中使用new
* `free`：用于释放内存

```c
void *malloc(size_t size);
void *calloc(size_t nobj, size_t size);
void *realloc(void *ptr, size_t newsize);
void free(void *ptr);
```

**setjmp和longjmp函数**

用于实现函数间跳转

* setjmp函数用于设置跳转的目的位置
* longjmp函数进行跳转

```c
int setjmp(jmp_buf env);
void longjmp(jmp_buf env, int val);
```

* `env`：保留了需要返回的位置的堆栈情况
* setjmp的返回值：直接调用该函数，则返回0；若由longjmp的调用，导致setjmp被调用，则返回val（longjmp的第二个参数）

尽量不要使用，对于错误传递问题可以使用C++异常机制

#### 4.4.1 逻辑地址、线性地址、物理地址？

逻辑地址：

* 面向程序员和编译器的地址
* 是编译器计算产生的
* 实质上是段内的偏移量

线性地址

* =DS数据段的基地址+逻辑地址
* 在linux中线性地址=逻辑地址，因为Linux所有的段（用户代码段、用户数据段、内核代码段、内核数据段）的线性地址都是从 0x00000000 开始
* 如果没有使用分页机制，线性地址=物理地址

物理地址

* 经过页表转换之后，将线性地址转换为逻辑地址

#### 4.4.2 分配了内存，但是没有释放，是内存泄露吗？

不是

内存泄漏（Memory Leak）是指程序中己动态分配的堆内存由于某种原因程序未释放或无法释放，造成系统内存的浪费，导致程序运行速度减慢甚至系统崩溃等严重后果。

#### 4.4.3 当调用longjmp函数后，在main中的各类变量的值是否改变回原来的值呢？

不加优化选项编译`g++ -o test test.cpp`
以下变量变成了原来的值

* 寄存器变量

以下变量没有恢复

* 全局变量
* 自动（局部）变量
* 静态变量
* volitie变量

加优化选项编译`g++ -O -o test test.cpp`
以下变量变成了原来的值

* 寄存器变量
* 自动（局部）变量

以下变量没有恢复

* 全局变量
* 静态变量
* volitie变量

也就是说寄存器中的变量被回滚了

#### 4.4.4 局部变量带来的问题，参见如下代码：

```c
#include        <stdio.h>
#define DATAFILE        "datafile"
FILE * open_data(void)
{
        FILE    *fp;
        char    databuf[BUFSIZ];  /* setvbuf makes this the stdio buffer */
        if ( (fp = fopen(DATAFILE, "r")) == NULL)
                return(NULL);
        if (setvbuf(fp, databuf, BUFSIZ, _IOLBF) != 0)
                return(NULL);
        return(fp);             /* error */
}
```

* 问题：
  * open_data函数返回后，它在栈上所使用的空间将由下一个被调用函数所占用
  * 但是标准I/O库仍使用位于栈上的databuf缓冲区
  * 存在冲突和混乱
* 解决办法：
  * 使用全局存储空间
  * 使用静态存储空间
  * 从堆中分配
