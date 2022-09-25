---
title: "Linux 进程权限"
date: 2022-09-24T19:25:59+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

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

当一个可执行文件属性，设置用户 ID 为被设置，当改程序被加载时（exec 系统调用），该进程的 euid 将被设置为这个文件的所有者（设置组 ID 为同理）。

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

* 当可执行文件的开启了设置用户 id 位后，执行该文件后 （exec），该进程的 euid 和 suid 将被设置为该文件的 owner。
* 如果当前进程的 euid 是 root，则 setuid 会设置所有的 ruid、euid 和 suid。
* 如果当前进程的 euid 不是 root，则 setuid 只会设置 euid，且这个 euid 的可选值只能是 ruid 或 suid，也就是说，一个由开启了设置用户 id 位的可执行文件启动的进程，这个进程 euid 可以在 ruid 和 suid 之间来回切换。

## 进程的能力

主要强调非文件系统的其他系统调用的权限
root 权限
普通用户的权限。
