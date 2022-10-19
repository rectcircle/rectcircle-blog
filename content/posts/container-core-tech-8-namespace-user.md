---
title: "容器核心技术（八） User Namespace"
date: 2022-10-15T00:15:42+08:00
draft: false
toc: true
comments: true
tags:
  - 云原生
---

## 背景知识

Linux 所有 Namespace 中最复杂的一部分，在了解 User Namespace 之前，最好前置阅读：[Linux 进程权限](/posts/linux-process-permission/)。

## 描述

User Namespace 实现了对进程权限的隔离，其特点如下所示：

* 关系： User Namespace 之间存在父子关系（换句话说，User Namespace 在宏观上可以看成一棵树，内核限制最多 32 层）。
* 和进程的关系：每一个进程都会关联一个 User Namespace。
* 初始： 在 Linux 系统启动时，内核会创建一个，初始 User Namespace（换句话说，在 Linux 中的普通进程和该初始 User Namespace 中关联）。
* 创建： 使用 `CLONE_NEWUSER` 标志调用 [`clone(2) 系统调用`](https://man7.org/linux/man-pages/man2/clone.2.html) 会创建一个新的 User Namespace （当然 [`unshare(2) 系统调用`](https://man7.org/linux/man-pages/man2/unshare.2.html) 也可以，在此不多赘述）。指的特别说明的是，和其他 Namespace 不同，创建 User Namespace 不需要任何特权（换句话说，任意的用户的进程都可以创建一个新的 User Namespace），该 User Namespace 和其创建时所在 User Namespace 构成父子关系。
* 和 Capabilities 关系：
    * Capabilities 是按 User Namespace 隔离的。
    * 新创建 User Namespace 的进程拥有当前内核所定义的全部的 Capabilities （具体而言，`cat /proc/新创建User Namespace的进程ID/status | grep Cap` 得到的输出是和 `cat /proc/1/status | grep Cap` 一样，其 `CapEff`、`CapPrm`、`CapBnd` 都是 `000001ffffffffff`）（需要特别注意的是，必须在执行 `execve(2)` 系统调用之前。由于 `unshare 命令` 会在创建名字空间后，执行了 execve，因此 `unshare` 命令创建的 shell 中执行 `cat /proc/$$/status | grep Cap`，看到只有 `CapBnd` 是 `000001ffffffffff`，其他均为 0）。
    * 只有拥有该 User Namespace 的 `CAP_SYS_ADMIN` 能力才能通过 [`setns(2) 系统调用`](https://man7.org/linux/man-pages/man2/setns.2.html) 加入该 User Namespace，加入后该进程将拥有当前内核所定义的全部的 Capabilities。
    * 在一个 User Namespace 中，[`execve(2) 系统调用`](https://man7.org/linux/man-pages/man2/execve.2.html) 会重新计算 Capabilities，参见：[Linux 进程权限](/posts/linux-process-permission/)。
    * 另一个 User Namespace 进程是否拥有某 User Namespace 的 Capabilities：
        * 如果一个进程在该 User Namespace 中拥有的 Capabilities，则同样拥有子孙 User Namespace 对应的 Capabilities （比如初始 User Namespace 的 root 进程同样拥有其他所有 User Namespace 的所有 Capabilities）。
        * 父 User Namespace 中创建该子 User Namespace 的有效用户 ID，会被设置为该子 User Namespace 的所有者，因此父 User Namespace 中具有同样有效用户 ID 的进程将具有该子 User Namespace 的全部的 Capabilities。
* 和其他 Namespace 的关系：
    * 其他 Namespace 会和其创建时的 User Namespace 关联（所有者），这意味着，拥有该 User Namespace 对应的 Capabilities 的进程就有权限操纵这些其他 Namespace 的资源。
    * 在使用 [`clone(2) 系统调用`](https://man7.org/linux/man-pages/man2/clone.2.html) 或 [`unshare(2) 系统调用`](https://man7.org/linux/man-pages/man2/unshare.2.html)  创建其他 Namespace 时，如果有 `CLONE_NEWUSER` 标志，则内核会先创建出 User Namespace，然后再创建其他的 Namespace。然后，这些其他的 Namespace 和这个刚刚创建的 User Namespace 关联。
* 非初始 User Namespace 进程的说明和限制：
    * 有些系统调用操作的资源并没有对应的 Namespace 进行隔离，因此只能在初始 User Namespace 中可以调用如：
        * 更改系统时间 （`CAP_SYS_TIME`）
        * 加载内核模块 （`CAP_SYS_MODULE`）
        * 创建块设备 （`CAP_MKNOD`）
    * 当一个非初始 User Namespace 关联了一个 Mount Namespace 时，该进程即使拥有 `CAP_SYS_ADMIN` 也只允许 mount 如下文件系统：
        * `/proc` (since Linux 3.8)
        * `/sys` (since Linux 3.8)
        * `devpts` (since Linux 3.9)
        * `tmpfs(5)` (since Linux 3.9)
        * `ramfs` (since Linux 3.9)
        * `mqueue` (since Linux 3.9)
        * `bpf` (since Linux 4.4)
        * `overlayfs` (since Linux 5.11)
    * 当一个非初始 User Namespace 关联了一个 Cgroup Namespace 时，该进程拥有 `CAP_SYS_ADMIN`，自 Linux 4.6 起，将允许 mount Cgroup v1 和 v2 的文件系统。
    * 当一个非初始 User Namespace 关联了一个 PID Namespace 时，该进程拥有 `CAP_SYS_ADMIN`，自 Linux 3.8 起，将允许 mount /proc 文件系统。
    * 注意，mount 基于块的文件系统时，只允许拥有 `CAP_SYS_ADMIN` 的初始 User Namespace 操作。
* User Namespace 之间的 ID 映射。
    * 新创建的 User Namespace 需要通过向 `/proc/[pid]/uid_map` 和 `/proc/[pid]/gid_map` 文件写入配置才能使用 [`setuid(2)`](https://man7.org/linux/man-pages/man2/setuid.2.html)、 [`setgid(2)`](https://man7.org/linux/man-pages/man2/setgid.2.html) 等与 id 相关的系统调用。顾名思义 `gid_map` 和 `uid_map` 时类似的，因此只介绍 `uid_map`。
    * `uid_map` 的格式为：
        * 每行包含三个用空格分隔的 32 位无符号整数，分别为（`to-user-id-start from-user-id-start range`）：
            * `to-user-id-start` 如果当前文件为 `/proc/[pid]/uid_map`，则该值为 `[pid]` 所在 User Namespace 的用户 ID
            * `from-user-id-start` 取决于读取 `/proc/[pid]/uid_map` 进程所在的 User Namespace（不同 User Namespace 进程读 `uid_map` 看到的第二列的内容是不一样的。）。
                * 如果和 `[pid]` 所在的 User Namespace 相同，则 `from-user-id-start` 表示映射到父 User Namespace 的用户 ID。
                * 如果和 `[pid]` 所在的 User Namespace 不同，则 `from-user-id-start` 表示映射读写 `/proc/[pid]/uid_map` 进程所在的 User Namespace 的用户 ID。
            * range 表示映射的范围，必须大于 0。
    * `uid_map` 写入说明
        * 只能写入一次，也就是说一旦确定则不能修改，刚创建时该文件是空的。
        * 写入必须以换行符结尾。包含多行，Linux 4.14 之前最多 5 行，Linux 4.15 起，最多 340 行，多行中的映射范围不允许有重叠，最少写入 1 行。
        * 写入的进程必须拥有该文件 User Namespace 的 `CAP_SETUID` (`CAP_SETGID`) 的 capability 且 写入的进程的 User Namespace 必须是当前 User Namespace 或者 父 User Namespace。
        * 写入的映射的用户 ID（组 ID）必须依次在父用户命名空间。
        * 如果想映射父进程的 0 (即 `xxx 0 xxx`)，除了满足上述要求外：还要求（Since Linux 5.12，解决一个安全漏洞）：
            * 如果是该 User Namespace 的进程写入，要求创建该 User Namespace 时的父进程必须有的 `CAP_SETFCAP` capability。
            * 如果是该 User Namespace 的父 User Namespace 的进程写入，要求该父进程必须有的 `CAP_SETFCAP` capability。
        * 以下两个 case 需要特别说明：
            * 当写入进程有父 User Namespace 的 `CAP_SETUID` (`CAP_SETGID`) capability 时，则没有其他限制（按照如上规则。此情况，只有父进程写入常见场景才满足）。
            * 否则，存在如下限制（子进程写入场景）：
                * 写入进程和创建该 User Namespace 的父进程有相同 effective user ID （EUID），且写入的内容必须包含一个映射到父进程的 EUID 的行。
                * 写入在 gid_map 之前，必须通过写入 `"deny"` 到 `/proc/[pid]/setgroups` 文件，来禁用 [`setgroups(2)`](https://man7.org/linux/man-pages/man2/setgroups.2.html) 系统调用。
        * 综上所述，推荐的模式是，父进程创建完 User Namespace 后，在父进程中写入 id map，然后通过进程通讯技术（如 pipe）通知位于新的 User Namespace 中的子进程。
    * 初始 User Namespace 没有父 User Namespace，但为了一致 `cat /proc/1/uid_map` 返回 `0          0 4294967295` （`4294967295 = 2^32-1`，`2^32` 即 `-1` 不被映射，原因是在一些系统调用中表示无用户）
    * `/proc/[pid]/setgroups`
        * 通过写入 `"deny"` 到 `/proc/[pid]/setgroups` 来禁用 [`setgroups(2)`](https://man7.org/linux/man-pages/man2/setgroups.2.html) 系统调用 （加入自：Linux 3.19，解决安全问题）。
        * `/proc/[pid]/setgroups` 的默认值：
            * 初始 User Namespace 其默认值为 `"allow"`。
            * 子 User Namespace 的默认值会继承父 User Namespace 的值。如果继承来的默认值为 `"deny"`，则无法再设置为 `"allow"`。
        * `/proc/[pid]/setgroups` 可以在写入 `/proc/[pid]/gid_map` 前写入多次。
    * `uid_map` 的作用
        * 进程身份：获取进程身份（如 [`getuid(2)`](https://man7.org/linux/man-pages/man2/getuid.2.html)、 [`getgid(2)`](https://man7.org/linux/man-pages/man2/getgid.2.html)） 和 获取文件信息（如 [`stat(2)`](https://man7.org/linux/man-pages/man2/stat.2.html)） 的系统调用获取到的 ID 都是映射到当前进程所在 User Namespace 的 ID（根据 uid_map 配置的字段进行映射。）。
        * 文件访问：当一个进程访问一个文件时，需要将该进程 id 映射到初始 User Namespace 中来确定是否有权限。当通过 [`stat(2)`](https://man7.org/linux/man-pages/man2/stat.2.html) 查看该文件的所有者 ID 时，则映射到当前 User Namespace。
        * 文件特权操作：除了 User Namespace 的进程需要拥有 `CAP_CHOWN`, `CAP_DAC_OVERRIDE`, `CAP_DAC_READ_SEARCH`, `CAP_FOWNER`, `CAP_FSETID` 这些权限外，还需要操作的文件的所属用户和所属组都必须已经映射到当前 User Namespace 中了（`CAP_FOWNER` 只要求所属用户映射即可，所属组可以不映射）。
        * 执行 Set-user-ID 或 set-group-ID 程序文件：如果该文件已经被映射，则以映射后的 User/Group ID 为准，如果没映射，则忽略 Set-user-ID 或 set-group-ID 位（即不改变 euid/egid，类似于 [mount(2)](https://man7.org/linux/man-pages/man2/mount.2.html) 使用了 `MS_NOSUID` 标志）。
        * Unix 套接字也会进行映射，参见 [unix(7)](https://man7.org/linux/man-pages/man7/unix.7.html) 的 SCM_CREDENTIALS。
        * 一个例子，父进程用户 id 是 1000，创建的当前进程绑定了一个新的 User Namespace，且配置的 `/proc/self/uid_map` 的内容为 `0 1000 500`，则：
            * 当前进程调用 [`getuid(2)`](https://man7.org/linux/man-pages/man2/getuid.2.html) 返回 `0`
            * 当前进程 对父进程的家目录调用 [`stat(2)`](https://man7.org/linux/man-pages/man2/stat.2.html) 看到的文件 owner 也为 `0` 即 root。
            * 当前进程可以通过 `chown` 修改父级成家目录文件的所有者（TODO 待确认）。
    * 未映射的 ID
        * 在各种情况（如 `stat(2)`、`getuid(2)`），均返回为溢出用户/组，定义在 `/proc/sys/kernel/overflowuid`、`/proc/sys/kernel/overflowgid` 一般为 `65534`。
        * 在某些情况，进程没有映射的其他 User Namespace 的进程，读 `uid_map`、`gid_map` 文件，第二个字段将返回 `4294967295` （`-1`）。

## 实验

### 实验设计

* 测试程序逻辑如下：
    * 进程 A：测试程序所在的进程为进程 A。
        * 观察自己的 Capabilities。
        * 创建一个测试文件 testFile。
        * 使用 `SIGCHLD | CLONE_NEWUSER | CLONE_NEWPID | CLONE_NEWNS` 标志，通过 `clone(2)` 系统调用创建一个进程 B。
        * 写入 `0 0 4294967295` 到进程 B 的 `uid_map` 和 `gid_map`，并通过 pipe 通知进程 B。
        * 等待进程 B 退出。
        * 删除测试文件 testFile。
    * 进程 B 引导阶段：即在执行 exec 之前。
        * 等待进程 B 写入 `uid_map` 和 `gid_map` 的完成通知。
        * 观察自己的 Capabilities。
        * 尝试通过 chown(2) 系统调用，修改 testFile 文件的 Owner。
        * 重新挂载 `/proc`。
        * 通过 `execve(2) 系统调用` 在进程 B 执行一段 shell 测试程序：
            * 观察自己的 Capabilities。
            * 观察自己身份。
            * 执行 `ps -ef`
            * 观察 `~` 和 `/` 目录。
            * 修改并查看测试文件 testFile 文件。
            * 通过 `sudo chown` 修改 testFile 文件的 owner
* 编译后，通过 `sudo setcap CAP_SETUID,CAP_SETGID,CAP_SETFCAP,CAP_DAC_OVERRIDE+ep a.out` 给程序添加相关 Caps。
* 使用普通用户（拥有免密 sudo 权限）执行如上测试程序。

### C 源码

由于 `execve(2) 系统调用` 会改变进程的 Capabilities，因此测试程序只能用 C 语言编写。

```c
// sudo apt install -y libcap2-bin
// gcc src/c/01-namespace/06-user/main.c && sudo setcap CAP_SETUID,CAP_SETGID,CAP_SETFCAP,CAP_DAC_OVERRIDE+ep a.out  && ./a.out
// sudo getcap a.out

#define _GNU_SOURCE	     // Required for enabling clone(2)
#include <sys/wait.h>    // For waitpid(2)
#include <sys/mount.h>   // For mount(2)
#include <sys/mman.h>    // For mmap(2)

#include <sched.h>	   // For clone(2)
#include <stdio.h>	   // For perror(3), printf(3), perror(3)
#include <unistd.h>    // For execv(3), sleep(3), read(2)
#include <stdlib.h>	   // For exit(3), system(3), free(3), realloc(3)
#include <errno.h>	   // For errno(3), strerror(3)
#include <string.h>	   // For strtok(3)
#include <fcntl.h>     // For open(2)

#define errExit(msg)    do { perror(msg); exit(EXIT_FAILURE); \
							   } while (0)

#define STACK_SIZE (1024 * 1024)

char *testFileName = "testFile";

// https://stackoverflow.com/a/44894946
/* Size of each input chunk to be
   read and allocate for. */

#define  READALL_CHUNK  4096
#define  READALL_OK          0  /* Success */
#define  READALL_INVALID    -1  /* Invalid parameters */
#define  READALL_ERROR      -2  /* Stream error */
#define  READALL_TOOMUCH    -3  /* Too much input */
#define  READALL_NOMEM      -4  /* Out of memory */

/* This function returns one of the READALL_ constants above.
   If the return value is zero == READALL_OK, then:
	 (*dataptr) points to a dynamically allocated buffer, with
	 (*sizeptr) chars read from the file.
	 The buffer is allocated for one extra char, which is NUL,
	 and automatically appended after the data.
   Initial values of (*dataptr) and (*sizeptr) are ignored.
*/
int readall(FILE *in, char **dataptr, size_t *sizeptr)
{
	char  *data = NULL, *temp;
	size_t size = 0;
	size_t used = 0;
	size_t n;

	/* None of the parameters can be NULL. */
	if (in == NULL || dataptr == NULL || sizeptr == NULL)
		return READALL_INVALID;

	/* A read error already occurred? */
	if (ferror(in))
		return READALL_ERROR;

	while (1) {

		if (used + READALL_CHUNK + 1 > size) {
			size = used + READALL_CHUNK + 1;

			/* Overflow check. Some ANSI C compilers
			   may optimize this away, though. */
			if (size <= used) {
				free(data);
				return READALL_TOOMUCH;
			}

			temp = realloc(data, size);
			if (temp == NULL) {
				free(data);
				return READALL_NOMEM;
			}
			data = temp;
		}

		n = fread(data + used, 1, READALL_CHUNK, in);
		if (n == 0)
			break;

		used += n;
	}

	if (ferror(in)) {
		free(data);
		return READALL_ERROR;
	}

	temp = realloc(data, used + 1);
	if (temp == NULL) {
		free(data);
		return READALL_NOMEM;
	}
	data = temp;
	data[used] = '\0';

	*dataptr = data;
	*sizeptr = used;

	return READALL_OK;
}



void print_caps() {
	FILE *f = fopen("/proc/self/status", "r");
	if (f == NULL)
		errExit("fopen");
	char *buf;
	size_t len;
	if (readall(f, &buf, &len) != READALL_OK)
		errExit("readall");
	fclose(f);

	char *delimiter = "\r\n";
	char *line = strtok(buf, delimiter);
	while (line != NULL) {
		char *pre = "Cap";
		if (strncmp(pre, line, strlen(pre)) == 0)
			printf("%s\n", line);
		line = strtok(NULL, delimiter);
	}
}

static void
update_map(char *mapping, char *map_file)
{
	int fd, j;
	size_t map_len = map_len = strlen(mapping);

	fd = open(map_file, O_RDWR);
	if (fd == -1)
	{
		fprintf(stderr, "open %s: %s\n", map_file, strerror(errno));
		exit(EXIT_FAILURE);
	}
	if (write(fd, mapping, map_len) != map_len)
	{
		fprintf(stderr, "write %s: %s\n", map_file, strerror(errno));
		exit(EXIT_FAILURE);
	}
	close(fd);
}

struct child_args {
	int pipe_fd[2]; /* Pipe used to synchronize parent and child */
};

char *const test_scripts[] = {
	"/bin/bash",
	"-c",
	"echo '>>>' 01.当前进程ID && echo $$ && echo \
	&& echo '>>>' 02.查看当前进程 Caps && cat /proc/self/status | grep Cap && echo \
	&& echo '>>>' 03.当前进程身份 && id && echo \
	&& echo '>>>' 04.执行 ps -ef && ps -ef && echo \
	&& echo '>>>' 05.执行 ls -al / && ls -al / && echo \
	&& echo '>>>' 06.执行 ls -al && ls -al && echo \
	&& echo '>>>' 07.执行 ls -al && ls -al && echo \
	&& echo '>>>' 08.写入 abc 到 testFile 并查看 && echo 'abc' > testFile && cat testFile && echo \
	&& echo '>>>' 09.sudo 更改 testFile owner 为 root && sudo chown root:root testFile && ls -al testFile && echo \
	",
	NULL};

int new_namespace_func(void *args) {
	struct child_args *typedArgs = (struct child_args *)args;

	char ch;
	close(typedArgs->pipe_fd[1]);
	if (read(typedArgs->pipe_fd[0], &ch, 1) != 0) {
        fprintf(stderr, "Failure in child: read from pipe returned != 0\n");
        exit(EXIT_FAILURE);
    }

	printf("时序 05: 打印进程 B 的 Caps、 进程 ID 和 用户 ID\n");
	print_caps();
	printf("pid: %d\n", getpid());
	printf("uid: %d\n", getuid());
	printf("\n");

	printf("时序 06: 尝试更改测试文件 owner\n");
	if (chown(testFileName, 0, 0) < 0)
		errExit("chown-root");
	if (chown(testFileName, getuid(), getuid()) < 0)
		errExit("chown-uid");
	printf("成功\n\n");

	printf("时序 07: 重新挂载 /proc\n\n");
	if (mount(NULL, "/", NULL, MS_SLAVE | MS_REC, NULL) == -1) // 阻止挂载事件传播到其他 Mount Namespace
		errExit("mount-MS_SLAVE");
	if (mount("proc", "/proc", "proc", 0, NULL) == -1)
		errExit("mount-proc");

	printf("时序 08: 执行测试脚本\n");
	execv(test_scripts[0], test_scripts);

	return 0;
}

int main(int argc, char *argv[]) {

	printf("时序 01: 打印进程 A 的 Caps 和 进程 ID\n");
	print_caps();
	printf("pid: %d\n", getpid());
	printf("\n");

	printf("时序 02: 创建一个测试文件\n\n");
	int f = open(testFileName, O_WRONLY | O_CREAT | O_TRUNC, 0644);
	if (f < 0)
		errExit("open-testFile");

	printf("时序 03: 创建一个新进程 B，这个进程位于新的 User、Mount、PID Namespace\n");
	struct child_args args;
	if ( pipe(args.pipe_fd) == -1)
		errExit("pipe");
	void *child_stack = mmap(NULL, STACK_SIZE,
							 PROT_READ | PROT_WRITE,
							 MAP_PRIVATE | MAP_ANONYMOUS | MAP_STACK,
							 -1, 0);
	if (child_stack == MAP_FAILED)
		errExit("mmap");
	pid_t pid = clone(new_namespace_func, child_stack + STACK_SIZE, SIGCHLD | CLONE_NEWUSER | CLONE_NEWPID | CLONE_NEWNS, &args);
	if (pid < 0)
		errExit("clone");
	printf("pid: %d\n\n", getpid());

	printf("时序 04: 配置子进程的 id map\n\n");

	char map_path[128];
	sprintf(map_path, "/proc/%d/uid_map", pid);
	update_map("0 0 4294967295", map_path);
	sprintf(map_path, "/proc/%d/gid_map", pid);
	update_map("0 0 4294967295", map_path);
	close(args.pipe_fd[1]);

	if (waitpid(pid, NULL, 0) < 0)
		errExit("pid");
	printf("时序 09: 子进程 B 退出，并清理现场\n\n");
	unlink(testFileName);
	return 0;
}
```

### 实验输出

```
时序 01: 打印进程 A 的 Caps 和 进程 ID
CapInh: 0000000000000000
CapPrm: 00000000800000c2
CapEff: 00000000800000c2
CapBnd: 000001ffffffffff
CapAmb: 0000000000000000
pid: 17255

时序 02: 创建一个测试文件

时序 03: 创建一个新进程 B，这个进程位于新的 User、Mount、PID Namespace
pid: 17255

时序 04: 配置子进程的 id map

时序 05: 打印进程 B 的 Caps、 进程 ID 和 用户 ID
CapInh: 0000000000000000
CapPrm: 000001ffffffffff
CapEff: 000001ffffffffff
CapBnd: 000001ffffffffff
CapAmb: 0000000000000000
pid: 1
uid: 1000

时序 06: 尝试更改测试文件 owner
成功

时序 07: 重新挂载 /proc

时序 08: 执行测试脚本
>>> 01.当前进程ID
1

>>> 02.查看当前进程 Caps
CapInh: 0000000000000000
CapPrm: 0000000000000000
CapEff: 0000000000000000
CapBnd: 000001ffffffffff
CapAmb: 0000000000000000

>>> 03.当前进程身份
用户id=1000(rectcircle) 组id=1000(rectcircle) 组=1000(rectcircle),24(cdrom),25(floppy),29(audio),30(dip),44(video),46(plugdev),109(netdev),112(bluetooth)

>>> 04.执行 ps -ef
UID          PID    PPID  C STIME TTY          TIME CMD
rectcir+       1       0  0 15:12 pts/4    00:00:00 /bin/bash -c echo '>>>' 01.当前进程ID
rectcir+       5       1  0 15:12 pts/4    00:00:00 ps -ef

>>> 05.执行 ls -al /
总用量 68
drwxr-xr-x  18 root root  4096  2月 13  2022 .
drwxr-xr-x  18 root root  4096  2月 13  2022 ..
lrwxrwxrwx   1 root root     7  2月 13  2022 bin -> usr/bin
drwxr-xr-x   3 root root  4096  2月 13  2022 boot
drwxr-xr-x  17 root root  3140 10月 13 19:49 dev
drwxr-xr-x  79 root root  4096 10月 15 11:36 etc
drwxr-xr-x   3 root root  4096  2月 13  2022 home
lrwxrwxrwx   1 root root    31  2月 13  2022 initrd.img -> boot/initrd.img-5.10.0-11-amd64
lrwxrwxrwx   1 root root    31  2月 13  2022 initrd.img.old -> boot/initrd.img-5.10.0-10-amd64
lrwxrwxrwx   1 root root     7  2月 13  2022 lib -> usr/lib
lrwxrwxrwx   1 root root     9  2月 13  2022 lib32 -> usr/lib32
lrwxrwxrwx   1 root root     9  2月 13  2022 lib64 -> usr/lib64
lrwxrwxrwx   1 root root    10  2月 13  2022 libx32 -> usr/libx32
drwx------   2 root root 16384  2月 13  2022 lost+found
drwxr-xr-x   3 root root  4096  2月 13  2022 media
drwxr-xr-x   2 root root  4096  2月 13  2022 mnt
drwxr-xr-x   2 root root  4096  2月 13  2022 opt
dr-xr-xr-x 155 root root     0 10月 15 15:12 proc
drwx------   5 root root  4096  9月 18 23:23 root
drwxr-xr-x  17 root root   580 10月 15 00:01 run
lrwxrwxrwx   1 root root     8  2月 13  2022 sbin -> usr/sbin
drwxr-xr-x   2 root root  4096  2月 13  2022 srv
dr-xr-xr-x  13 root root     0 10月 13 19:49 sys
drwxrwxrwt  14 root root  4096 10月 15 15:12 tmp
drwxr-xr-x  14 root root  4096  2月 13  2022 usr
drwxr-xr-x  12 root root  4096  3月 15  2022 var
lrwxrwxrwx   1 root root    28  2月 13  2022 vmlinuz -> boot/vmlinuz-5.10.0-11-amd64
lrwxrwxrwx   1 root root    28  2月 13  2022 vmlinuz.old -> boot/vmlinuz-5.10.0-10-amd64

>>> 06.执行 ls -al
总用量 60
drwxr-xr-x  5 rectcircle rectcircle 12288 10月 15 15:12 .
drwxr-xr-x 14 rectcircle rectcircle  4096 10月 15 15:00 ..
-rwxr-xr-x  1 rectcircle rectcircle 18520 10月 15 15:12 a.out
drwxr-xr-x  6 rectcircle rectcircle  4096  3月  8  2022 data
-rw-r--r--  1 rectcircle rectcircle   259  9月 18 23:18 go.mod
-rw-r--r--  1 rectcircle rectcircle   843  9月 18 23:18 go.sum
-rw-r--r--  1 rectcircle rectcircle   192  2月 23  2022 README.md
drwxr-xr-x  5 rectcircle rectcircle  4096  2月 27  2022 src
-rw-r--r--  1 rectcircle rectcircle     0 10月 15 15:12 testFile
drwxr-xr-x  2 rectcircle rectcircle  4096 10月 13 21:46 .vscode

>>> 07.执行 ls -al
总用量 60
drwxr-xr-x  5 rectcircle rectcircle 12288 10月 15 15:12 .
drwxr-xr-x 14 rectcircle rectcircle  4096 10月 15 15:00 ..
-rwxr-xr-x  1 rectcircle rectcircle 18520 10月 15 15:12 a.out
drwxr-xr-x  6 rectcircle rectcircle  4096  3月  8  2022 data
-rw-r--r--  1 rectcircle rectcircle   259  9月 18 23:18 go.mod
-rw-r--r--  1 rectcircle rectcircle   843  9月 18 23:18 go.sum
-rw-r--r--  1 rectcircle rectcircle   192  2月 23  2022 README.md
drwxr-xr-x  5 rectcircle rectcircle  4096  2月 27  2022 src
-rw-r--r--  1 rectcircle rectcircle     0 10月 15 15:12 testFile
drwxr-xr-x  2 rectcircle rectcircle  4096 10月 13 21:46 .vscode

>>> 08.写入 abc 到 testFile 并查看
abc

>>> 09.sudo 更改 testFile owner 为 root
-rw-r--r-- 1 root root 4 10月 15 15:12 testFile

时序 09: 子进程 B 退出，并清理现场

```

### /proc 问题

从文章 [Linux 进程权限](/posts/linux-process-permission/#实例：容器进程权限限制) 可以得知，docker 默认是有 `CAP_SETUID,CAP_SETGID,CAP_SETFCAP,CAP_DAC_OVERRIDE` 这四个权限。似乎上述代码可以在 Docker/k8s 中运行。但是实测，这个程序并不能在 默认的 Docker/k8s 容器中运行。

在 Linux 虚拟机中执行 `mount | grep /proc` 输出如下：

```
proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)
systemd-1 on /proc/sys/fs/binfmt_misc type autofs (rw,relatime,fd=30,pgrp=1,timeout=0,minproto=5,maxproto=5,direct,pipe_ino=10609)
```

在 docker 容器中执行 `mount | grep /proc` 输出如下：

```
proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)
proc on /proc/bus type proc (ro,relatime)
proc on /proc/fs type proc (ro,relatime)
proc on /proc/irq type proc (ro,relatime)
proc on /proc/sys type proc (ro,relatime)
proc on /proc/sysrq-trigger type proc (ro,relatime)
tmpfs on /proc/asound type tmpfs (ro,relatime)
tmpfs on /proc/acpi type tmpfs (ro,relatime)
tmpfs on /proc/kcore type tmpfs (rw,nosuid,size=65536k,mode=755)
tmpfs on /proc/keys type tmpfs (rw,nosuid,size=65536k,mode=755)
tmpfs on /proc/timer_list type tmpfs (rw,nosuid,size=65536k,mode=755)
tmpfs on /proc/sched_debug type tmpfs (rw,nosuid,size=65536k,mode=755)
```

通过查阅 docker 代码可以看出，这是有 `HostConfig` 的 [`MaskedPaths`](https://github.com/moby/moby/blob/8d193d81af9cbbe800475d4bb8c529d67a6d8f14/api/types/container/host_config.go#L458) 和 [`ReadonlyPaths`](https://github.com/moby/moby/blob/8d193d81af9cbbe800475d4bb8c529d67a6d8f14/api/types/container/host_config.go#L461) 字段配置的，默认值参见：[docker 源码](https://github.com/moby/moby/blob/968a0bcd636b3720d2178d5dfed691c00c68e4a1/oci/defaults.go#L87)。更多参见： runc 对应的是[实现源码](https://github.com/opencontainers/runc/blob/bd69483df53570df10040b6b21f4cf798b9f6d3d/libcontainer/rootfs_linux.go#L1022)。

通过 runc 的 [Issue](https://github.com/opencontainers/runc/issues/1658) 可以看出，这是 [Linux 内核的一个限制](https://github.com/opencontainers/runc/issues/1658#issuecomment-375750981)：当 `/proc` 存在被遮蔽的目录时，mount proc 将报错。因此，上面代码的 `mount("proc", "/proc", "proc", 0, NULL)` 行将报错：

```
Operation not permitted
```

有人提了一个 [PR](https://lists.linuxfoundation.org/pipermail/containers/2018-April/038840.html) 其修复该问题，但是并未合入。

如果需要解决该问题，有如下两种方案：

* 开启特权模式。
* 关闭 `/proc` 的遮蔽（未测试）：
    * k8s： `spec.containers[*].securityContext.procMount: "Unmasked"` (安装集群时，需配置开启该特性门 https://kubernetes.io/docs/reference/command-line-tools-reference/feature-gates/)
    * docker：需要配置 `MaskedPaths`，只能通过客户端配置， cli 不支持，参见：[源码](https://github.com/moby/moby/blob/8d193d81af9cbbe800475d4bb8c529d67a6d8f14/api/types/container/host_config.go#L458)。

上述方式都不是我们正常的容器使用方式，带来了额外的复杂度。因此：在默认配置的容器中创建 User + Mount + PID Namespace 的进程来进行一定的隔离是不可能的。

## Rootless

默认情况下 Docker 和 k8s 并没有使用 User Namespace。

在容器技术中，rootless 容器才会使用 User Namespace （如： [Docker rootless 模式](https://docs.docker.com.zh.xy2401.com/engine/security/rootless/)），其整体实现原理类似上述过程。

目前：Rootless 容器在挂载 /proc、网络和 OverlayFS 上存在一定的限制。

更多关于 rootless 容器，参见： https://rootlesscontaine.rs/ 。

## 参考

* [user_namespaces(7) — Linux manual page](https://man7.org/linux/man-pages/man7/user_namespaces.7.html)
* [实验源码参考：userns_child_exec.c](https://lwn.net/Articles/539940/)
* [User Namespace 子进程写入 id map 文件的例子：Linux namespace 简介 part 6 - USER](https://blog.lucode.net/linux/intro-Linux-namespace-6.html)
* [包含一系列 lwn.net 示例：Namespaces in operation part 5: User namespaces](https://www.361shipin.com/blog/1554013022308007936)
* [rootless container](https://rootlesscontaine.rs/)
* [docker rootless](https://docs.docker.com/engine/security/rootless/)
