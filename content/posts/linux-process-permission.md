---
title: "Linux 进程权限"
date: 2022-09-24T19:25:59+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 实验代码

github: [rectcircle/learn-linux-process-permission](https://github.com/rectcircle/learn-linux-process-permission)。

## 进程的身份

> [credentials(7) — Linux manual page](https://man7.org/linux/man-pages/man7/credentials.7.html)

### 进程的用户、组和附属组

在 Linux 中，用来标识一个进程身份的属性为：用户 ID、组 ID、附属组 ID 列表。

* 用户 ID 和 组 ID，在进程中存在多种类型，如：
    * 真实用户（组） ID （ruid），表示进程的 Owner。
    * 有效用户（组） ID （euid），表示真正进行权限校验的 ID。
    * 保存的设置用户（组） ID （suid），参见下文。
    * 文件系统用户（组） ID （Linux 特有，本文不介绍）

    用户和组 ID 都存在这些类型，基本逻辑一致，因此本文将以，用户 ID 为例，介绍这些 ID 的作用。

* 这些 ID，控制的是进程对文件系统文件的操作权限（读、写、执行）。
* 一般情况下，ruid、euid、suid 都是一致的。

```c
#define _GNU_SOURCE
#include<sys/types.h>
#include<unistd.h>
#include<stdio.h>

void printTheProccessIdentifiers() {
    gid_t supplementaryGids[32]; // sysconf(_SC_NGROUPS_MAX)
    uid_t ruid, euid, suid;
    gid_t rgid, egid, sgid;

    // uid_t ruid = getuid();   // 获取真实用户 ID
    // uid_t euid = geteuid();  // 获取有效用户 ID
    // gid_t rgid = getgid();   // 获取真实组 ID
    // gid_t egid = getegid();  // 获取有效组 ID
    getresuid(&ruid, &euid, &suid);                               // 非 POSIX.1 标准
    getresgid(&rgid, &egid, &sgid);                               // 非  POSIX.1 标准
    int supplementaryGidsSize = getgroups(32, supplementaryGids); // 获取附属组 ID 列表

    printf("ruid: %d, euid: %d, suid: %d\n", ruid, euid, suid);
    printf("rgid: %d, egid: %d, sgid: %d\n", rgid, egid, sgid);
    printf("supplementary group ids: ");
    for (int i = 0; i < supplementaryGidsSize; i++)
    {
        printf("%d", supplementaryGids[i]);
        if (i != supplementaryGidsSize - 1)
        {
            printf(", ");
        }
    }
    printf("\n\n");
}


int main() {
    printTheProccessIdentifiers();
    return 0;
}
```

编译执行 `gcc 01-get-uid-gid.c && ./a.out && sudo ./a.out`，输出如下：

```
ruid: 1000, euid: 1000, suid: 1000
rgid: 1000, egid: 1000, sgid: 1000
supplementary group ids: 24, 25, 29, 30, 44, 46, 109, 112, 1000

ruid: 0, euid: 0, suid: 0
rgid: 0, egid: 0, sgid: 0
supplementary group ids: 0
```

### 进程身份的继承

Linux 通过 fork-exec 启动一个新进程：

* fork 阶段，子进程完全复制父进程的身份标识符。
* exec 阶段，多数情况（例外情况参见下文），身份标识（ruid、euid、suid 等）不会发生变化。

如下场景，子进程的的身份标识直接继承父进程的身份标识。

* 在交互式 Shell 中执行普通的应用程序，如 ls、cat 等。
* 在编程语言中（如C、Go、Java、Python 等等）中，不进行特殊配置的调用标准库的创建子进程的 API。

### root 进程创建普通进程

Linux 在启动过程，一定会使用 root 用户 (uid = 0) 启动 1 号进程（如 systemd），然后 1 号进程会根据配置（如 systemd 的 service 文件）启动各种后台服务进程，根据权限最小化原则，这些进程的所有者用户（ruid）不一定是 root。此外，ssh server 进程 sshd 是以 root 用户运行，而我们却可以通过普通用户登录，拿到普通用户运行的 shell。

在如上这些场景，我们需要从 root 进程创建一个进程，且这个进程的身份是普通的用户，此时可以通过 `setuid`、`setgid` 等系统调用来实现。

```c
#define _GNU_SOURCE
#include <sys/types.h>
#include <unistd.h>
#include <stdio.h>
#include <grp.h>

void printTheProccessIdentifiers() {
  // 参见上文
  // ...
}

int main()
{
    printf("before: \n");
    printTheProccessIdentifiers();

    // 子进程 fork 完成后，配置身份标识
    setgid(1000);
    initgroups("rectcircle", 1000); // 非 POSIX.1 标准，读取 /etc/group，并调用 setgroups 系统调用。
    setuid(1000); // uid 要最后设置，否则前面两个讲没有权限。
    printf("after: \n");
    printTheProccessIdentifiers();
    // 开始执行 exec
    // ...
    return 0;
}
```

编译执行 `gcc 02-set-uid-gid.c && sudo ./a.out`，输出如下：

```bash
before: 
ruid: 0, euid: 0, suid: 0
rgid: 0, egid: 0, sgid: 0
supplementary group ids: 0

after: 
ruid: 1000, euid: 1000, suid: 1000
rgid: 1000, egid: 1000, sgid: 1000
supplementary group ids: 24, 25, 29, 30, 44, 46, 109, 112, 1000
```

注意：

* set 用户身份相关系统调用，在该场景（例外参见下文），要求调用时用户身份必须为 root。
* 一旦通过 `setuid` 将进程从 root 切换为普通用户后，该进程将无法再通过 setuid 恢复为 root 进程。

### 从普通进程创建 root 进程

上文可以看出 Linux 定义了多种 uid，ruid、euid、suid，上文场景这几个值都是一样的。在本场景中，可以看出 Linux 定义这些 uid 的用意。

通过进程身份的继承、root 进程创建普通进程，可以满足绝大多数对进程身份的设置。但是某些场景并不能满足。如：

* 普通用户，想通过 passwd 命令设置当前用户的密码时，需要更新属于 /etc/passwd 或 /etc/shadow。
* 普通用户，通过 sudo 切换到以 root 或其他用户的身份执行启动进程。

因此，需要普通用户的进程在运行某个程序文件时，通过某些机制，可以创建一个身份为 root(或其他用户) 的进程。

在 Linux 中进程的可执行文件存储在文件系统中，Linux 文件系统中，每个文件都有一个 12 位的来控制文件的权限。

```
11 10 9 8 7 6 5 4 3 2 1 0
S  G  T r w x r w x r w x
```

* 大家熟悉的是其中的低 9 位的 `rwxrwxrwx`，分别为：所有者读、写、执行，组读、写、执行，其他人读、写、执行。
* 第 11 位 `S`，为设置用户 ID 位。
* 第 10 位 `G`，为设置组 ID 位。

当一个可执行文件属性，设置用户 ID 为被设置，当改程序被加载时（[execve](https://man7.org/linux/man-pages/man2/execve.2.html) 系统调用），该进程的 euid 将被设置为这个文件的所有者（设置组 ID 为同理）。

因此，当我们想让一个可执行文件可以以其他用户的身份运行时，则可以：

* 将该可执行文件的 owner 设置为指定用户如 root （`chown user filepath`）。
* 设置该可执行文件的 设置用户 ID 位 （`chmod u+s filepath`）。

一个示例：

```c
#define _GNU_SOURCE
#include <sys/types.h>
#include <unistd.h>
#include <stdio.h>
#include <grp.h>

int main() {
    uid_t oruid, oeuid, osuid;
    getresuid(&oruid, &oeuid, &osuid); // 非 POSIX.1 标准
    uid_t ruid, euid, suid;

    printf("origin\n");
    getresuid(&ruid, &euid, &suid); // 非 POSIX.1 标准
    printf("ruid: %d, euid: %d, suid: %d\n", ruid, euid, suid);
    printf("\n");

    printf("setuid(origin ruid = %d)\n", oruid);
    setuid(oruid);
    getresuid(&ruid, &euid, &suid); // 非 POSIX.1 标准
    printf("ruid: %d, euid: %d, suid: %d\n", ruid, euid, suid);
    printf("\n");

    printf("setuid(origin suid = %d)\n", osuid);
    setuid(osuid);
    getresuid(&ruid, &euid, &suid); // 非 POSIX.1 标准
    printf("ruid: %d, euid: %d, suid: %d\n", ruid, euid, suid);
    return 0;
}
```

首先进行编译 `sudo gcc 03-set-uid-bit.c`。

然后将开启该文件的设置用户 id 位，并将该可执行文件的 owner 设置为 root，并执行该测试程序 `sudo chown root:root a.out && sudo chmod u+s a.out && ./a.out`，输出如下。

```
origin
ruid: 1000, euid: 0, suid: 0

setuid(origin ruid = 1000)
ruid: 1000, euid: 1000, suid: 1000

setuid(origin suid = 0)
ruid: 1000, euid: 1000, suid: 1000
```

然后将开启该文件的设置用户 id 位，并将该可执行文件的 owner 设置为 普通用户，并执行该测试程序 `sudo chown root:root a.out && sudo chmod u+s a.out && ./a.out`，输出如下。

```
origin
ruid: 1000, euid: 1001, suid: 1001

setuid(origin ruid = 1000)
ruid: 1000, euid: 1000, suid: 1001

setuid(origin suid = 1001)
ruid: 1000, euid: 1001, suid: 1001
```

总结：

* 当可执行文件的开启了设置用户 id 位后，执行该文件后 （execve），该进程的 euid 和 suid 将被设置为该文件的 owner。
* 如果当前进程的 euid 是 root，则 setuid 会设置所有的 ruid、euid 和 suid。
* 如果当前进程的 euid 不是 root，则 setuid 只会设置 euid，且这个 euid 的可选值只能是 ruid 或 suid，也就是说，一个由开启了设置用户 id 位的可执行文件启动的进程，这个进程 euid 可以在 ruid 和 suid 之间来回切换。

## 进程的能力

> [capabilities(7) — Linux manual page](https://man7.org/linux/man-pages/man7/capabilities.7.html)

### 概述

另一方面，某些系统调用是很危险的，只有系统的管理员才能调用。而上述的进程身份，主要解决了进程对文件系统操作的权限控制，并不能解决该问题。

针对这个问题，在 Linux 中，我们熟悉的解决办法是：将系统调用分为两类，普通系统调用和特权系统调用，普通用户的进程只能调用普通系统调用，root 用户的进程才能调用特权系统调用。

但是，这种划分太过简单粗暴，不符合最小权限原则。比如某个进程，只需要某一个特权系统调用（如 Nginx 只需要一个绑定 80 端口特权系统调用），但是我们不得不以 root 权限运行这个成，给这个进程调用全部特权系统调用的权限。

为了解决这个问题，Linux 将特权系统调用进一步进行分类，划分为了 41 中能力（capabilities）（截止 Linux 5.13）。

和上文 进程的身份 的设置用户 ID 位类似，Linux 从两个方面提供了对一个进程有权的能力（capabilities）进行设置：

* 从文件系统角度，对于可执行文件，通过文件系统的扩展属性 `security.capability` 声明该可执行文件需要的特权能力列表（通过 [`setxattr(2)` 系统调用](https://man7.org/linux/man-pages/man2/setxattr.2.html) 或 [`setcap(8)` 命令](https://man7.org/linux/man-pages/man8/setcap.8.html) 可以进行设置），可以通过 [`getcap(8) 命令`](https://man7.org/linux/man-pages/man8/getcap.8.html) 可以查看一个可执行文件的特权能力列表（如：`sudo getcap $(which ping)` 和 `sudo getcap -r / 2>/dev/null`）。最终可执行过文件的这些配置，会在 [execve](https://man7.org/linux/man-pages/man2/execve.2.html) 系统调用执行阶段，根据一定规则应用到进程中。
* 从进程角度，可以通过相关系统调用来主动配置该进程的特权能力列表：[`capset(2) 系统调用`](https://man7.org/linux/man-pages/man2/capset.2.html) 、 [`capget(2) 系统调用`](https://man7.org/linux/man-pages/man2/capget.2.html)、[`cap_get_proc(3)` 系列库函数](https://man7.org/linux/man-pages/man3/cap_get_proc.3.html)、[prctl(2) 系统调用](https://man7.org/linux/man-pages/man2/prctl.2.html)。

通过如上的手段可以做到：

* 限制 root 用户进程的权限，让 root 用户进程按需使用权限。
* 让普通用户进程拥有部分特权，可以调用某些特权系统调用。

目前目前最大的应用场景是：（Docker）容器进程权限限制。下文将介绍该场景的实现示例。

Linux 进程 capabilities 的细节还是非常多的，本文不会全部涉及，想了解详细的细节，参见： [capabilities](https://man7.org/linux/man-pages/man7/capabilities.7.html)

### 进程和可执行文件 capabilities 相关属性

在 Linux 进程的 capabilities 由多种 capabilities 集合和标志位决定。

进程有如下五个与 capabilities 相关的属性：

* `P(permitted)` 类型为 capabilities 集合。控制 `capset` 系统调用可以的 `P(effective)` 或 `P(inheritable)` 的项目。
* `P(effective)` 类型为 capabilities 集合。进程在进行特权系统调用时，会依据该属性进行检查。
* `P(inheritable)` 类型为 capabilities 集合。控制接受哪些可执行文件配置的 `F(inheritable)`。
* `P(bounding)` 类型为 capabilities 集合。控制接受哪些可执行文件配置的 `F(permitted)`。
* `P(ambient)` 类型为 capabilities 集合，Linux 4.3 新增。

可执行文件有三个与 capabilities 相关的属性：

* `F(permitted)` 类型为 capabilities 集合。声明该程序需要的能力。
* `F(inheritable)` 类型为 capabilities 集合。声明该要从父进程继承的能力。
* `F(effective)` 类型为标志位。声明自动的将当前进程 `P(effective)` 设置为其计算出的 `P(permitted)`（不是父进程的）。

如上进程的相关 capabilities 的属性在在如下场景会发生变化：

* `setuid(2)` 和 `setresuid(2)` 系统调用被调用。
    * 如果 ruid、euid、suid 有一个是 0，被修改后这个值都是非 0，则 `P(permitted)`, `P(effective)`, `P(ambient)` 都将被清除。
    * 如果 euid 从 0 变为 非 0，则 `P(effective)` 将被清空。
    * 如果 euid 从非 0 变为 0，则 `P(effective)` 将被设置为 `P(effective)`。
* 通过 `capset(2)` 系统调用，通过编程的方式修改。
* `execve(2)` 系统调用执行后，可以用公式来表示，下文中 P 表示 execve 之前，P' 表示 execve 之后，F 表示可执行文件的属性。可以分为两种情况：
    * 一般情况：

        ```
        P'(ambient)     = (file is privileged) ? 0 : P(ambient)

        P'(permitted)   = (P(inheritable) & F(inheritable)) |
                            (F(permitted) & P(bounding)) | P'(ambient)

        P'(effective)   = F(effective) ? P'(permitted) : P'(ambient)

        P'(inheritable) = P(inheritable)    [i.e., unchanged]

        P'(bounding)    = P(bounding)       [i.e., unchanged]
        ```

        file is privileged 表示如下情况之一的：

        * 这个可执行文件有配置 capabilities 相关属性。
        * 这个可执行文件的 set-user-ID 或 set-group-ID 启用。
    * 兼容 UNIX 规范情况，即当前进程的 euid 为 0 （当前进程为 root 或，可执行文件的 owner 为 root 且启用了设置用户 ID 位（参见上文））:

        ```
        P'(permitted)   = P(inheritable) | P(bounding)

        P'(effective)   = P'(permitted)
        ```

        只有如上两个属性和一般情况不同，其他属性和一般情况相同。

        该场景具体实例：

        * root 进程 fork-exec 了新的进程。
        * 类似于 `sudo` 的命令执行。

通过 `cat /proc/1/status | grep Cap` 和 `sudo -u root sh -c 'cat /proc/$$/status | grep Cap'`， 观察 1 号进程和普通 root 进程的 capabilities 相关属性（可以通过 `sudo capsh --decode=00000000a80425fb` 解码、`sudo apt-get install libcap2-bin`）：

```
CapInh: 0000000000000000
CapPrm: 000001ffffffffff
CapEff: 000001ffffffffff
CapBnd: 000001ffffffffff
CapAmb: 0000000000000000
```

通过 `sudo -u nobody sh -c 'cat /proc/$$/status | grep Cap'`， 观察普通用户进程的 capabilities 相关属性：

```bash
CapInh: 0000000000000000
CapPrm: 0000000000000000
CapEff: 0000000000000000
CapBnd: 000001ffffffffff
CapAmb: 0000000000000000
```

通过如上输出，可以看出：

* root 进程的 `P(permitted)`、`P(bounding)`、`P(effective)` 均为拥有全部能力。
* 普通进程，`P(bounding)` 拥有全部能力，其他均为 0。
* 在 sudo 时，按照如上公式，确实做到了普通进程在 execve 后，变成了 root。

### 相关编程接口和命令行工具

* 系统调用：Linux glibc 并没有提供对 cap 的封装，需要使用 `syscall` 调用，更多参考：[capget(2) 和 capset(2)](https://man7.org/linux/man-pages/man2/capset.2.html)。
* C 语言函数库：参见 [libcap(3)](https://man7.org/linux/man-pages/man3/libcap.3.html)，默认没有安装，可通过 `sudo apt-get install libcap-dev` 安装，源码参见：[git](https://git.kernel.org/pub/scm/libs/libcap/libcap.git/tree/)。
* Go 语言函数库： [syndtr/gocapability](https://github.com/syndtr/gocapability)，[runc](https://github.com/opencontainers/runc) 使用的库。
* 命令工具：[capsh](https://man7.org/linux/man-pages/man1/capsh.1.html) 等，可通过 `sudo apt-get install libcap2-bin` 安装。

## 实例：容器进程权限限制

按照如上类似的命令，观察 docker 容器按照默认方式启动容器，其 1 号进程的 capabilities 相关属性：

* root 权限 `docker run --user=root -it busybox sh -c 'cat /proc/1/status | grep Cap'`

    ```
    CapInh:	00000000a80425fb
    CapPrm:	00000000a80425fb
    CapEff:	00000000a80425fb
    CapBnd:	00000000a80425fb
    CapAmb:	0000000000000000
    ```

* 非 root 权限 `docker run --user=nobody -it busybox sh -c 'cat /proc/1/status | grep Cap'`

    ```
    CapInh:	00000000a80425fb
    CapPrm:	0000000000000000
    CapEff:	0000000000000000
    CapBnd:	00000000a80425fb
    CapAmb:	0000000000000000
    ```

结合 [docker 源码](https://github.com/moby/moby/blob/master/oci/caps/defaults.go#L6-L19)可以看出，docker 的进程开放了如下能力：

```go
func DefaultCapabilities() []string {
	return []string{
		"CAP_CHOWN",
		"CAP_DAC_OVERRIDE",
		"CAP_FSETID",
		"CAP_FOWNER",
		"CAP_MKNOD",
		"CAP_NET_RAW",
		"CAP_SETGID",
		"CAP_SETUID",
		"CAP_SETFCAP",
		"CAP_SETPCAP",
		"CAP_NET_BIND_SERVICE",
		"CAP_SYS_CHROOT",
		"CAP_KILL",
		"CAP_AUDIT_WRITE",
	}
}
```

根据上文内容可以推测出 docker 启动容器进程过程中，关于 capabilities 的相关配置：

* root 权限，fork 进程。
* root 权限，子进程调用 capset 系统调用，清除危险的能力，默认情况只开启部分必要的不危险的权限。
* 如果启动的用户不是 root，通过 setuid 等命令，切换到普通用户/组/附属组。

go 语言模拟上述后面两个步骤，如下所示：

```go
package main

import (
	"fmt"
	"syscall"

	"github.com/syndtr/gocapability/capability"
)

func main() {
	fmt.Printf("the kernal support %d caps: ", len(capability.List()))
	for _, c := range capability.List() {
		fmt.Printf("%s, ", c)
	}
	fmt.Println()

	caps, err := capability.NewPid2(0)
	if err != nil {
		panic(err)
	}
	err = caps.Load()
	if err != nil {
		panic(err)
	}
	fmt.Println("the origin root proc caps: ", caps.String())
	// 设置当前进程的 caps
	caps.Clear(capability.EFFECTIVE | capability.PERMITTED | capability.BOUNDING | capability.INHERITABLE | capability.AMBIENT)
	caps.Set(capability.EFFECTIVE|capability.PERMITTED|capability.BOUNDING|capability.INHERITABLE,
		capability.CAP_CHOWN,
		capability.CAP_DAC_OVERRIDE,
		capability.CAP_FSETID,
		capability.CAP_FOWNER,
		capability.CAP_MKNOD,
		capability.CAP_NET_RAW,
		capability.CAP_SETGID,
		capability.CAP_SETUID,
		capability.CAP_SETFCAP,
		capability.CAP_SETPCAP,
		capability.CAP_NET_BIND_SERVICE,
		capability.CAP_SYS_CHROOT,
		capability.CAP_KILL,
		capability.CAP_AUDIT_WRITE,
	)
	err = caps.Apply(capability.EFFECTIVE | capability.PERMITTED | capability.BOUNDING | capability.INHERITABLE | capability.AMBIENT)
	if err != nil {
		panic(err)
	}
	fmt.Println("the root proc new caps: ", caps.String())
	// 切换到普通用户
	syscall.Setuid(1000)
	err = caps.Load() // 重新加载
	if err != nil {
		panic(err)
	}
	fmt.Println("the nonroot proc new caps: ", caps.String())
}
```

编译并执行 `sudo go run ./05-mock-docker-cap/`，输出如下

```
the kernal support 41 caps: chown, dac_override, dac_read_search, fowner, fsetid, kill, setgid, setuid, setpcap, linux_immutable, net_bind_service, net_broadcast, net_admin, net_raw, ipc_lock, ipc_owner, sys_module, sys_rawio, sys_chroot, sys_ptrace, sys_pacct, sys_admin, sys_boot, sys_nice, sys_resource, sys_time, sys_tty_config, mknod, lease, audit_write, audit_control, setfcap, mac_override, mac_admin, syslog, wake_alarm, block_suspend, audit_read, perfmon, bpf, checkpoint_restore, 
the origin root proc caps:  { effective="full" permitted="full" inheritable="empty" bounding="full" }
the root proc new caps:  { effective="chown, dac_override, fowner, fsetid, kill, setgid, setuid, setpcap, net_bind_service, net_raw, sys_chroot, mknod, audit_write, setfcap" permitted="chown, dac_override, fowner, fsetid, kill, setgid, setuid, setpcap, net_bind_service, net_raw, sys_chroot, mknod, audit_write, setfcap" inheritable="chown, dac_override, fowner, fsetid, kill, setgid, setuid, setpcap, net_bind_service, net_raw, sys_chroot, mknod, audit_write, setfcap" bounding="chown, dac_override, fowner, fsetid, kill, setgid, setuid, setpcap, net_bind_service, net_raw, sys_chroot, mknod, audit_write, setfcap" }
the nonroot proc new caps:  { effective="empty" permitted="empty" inheritable="chown, dac_override, fowner, fsetid, kill, setgid, setuid, setpcap, net_bind_service, net_raw, sys_chroot, mknod, audit_write, setfcap" bounding="chown, dac_override, fowner, fsetid, kill, setgid, setuid, setpcap, net_bind_service, net_raw, sys_chroot, mknod, audit_write, setfcap" }
```

## 参考

* [Unix 环境高级编程中文第三版（APUE）](http://www.apuebook.com/)，4.4 设置用户 ID 和设置组 ID，8.11 更改用户 ID 和更改组 ID。
* [Linux Capabilites 机制详细介绍](https://gohalo.me/post/linux-capabilities-introduce.html) 该文有 C 语言的示例程序。
* [Linux Capabilities 入门教程：概念篇](https://icloudnative.io/posts/linux-capabilities-why-they-exist-and-how-they-work/)。
* [Linux Capabilities 入门教程：基础实战篇](https://icloudnative.io/posts/linux-capabilities-in-practice-1/)。
* [Linux Capabilities 入门教程：进阶实战篇](https://icloudnative.io/posts/linux-capabilities-in-practice-2/)。
* [Docker解析：配置与权限管理](https://hustcat.github.io/docker-config-capabilities/)。
