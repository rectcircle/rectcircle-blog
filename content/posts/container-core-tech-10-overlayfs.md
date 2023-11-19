---
title: "容器核心技术（十） OverlayFS"
date: 2023-11-19T22:48:00+08:00
draft: false
toc: true
comments: true
tags:
  - 云原生
---

> [Linux kernel 文档: Overlay Filesystem](https://docs.kernel.org/filesystems/overlayfs.html)

## 简介

OverlayFS 是一种写时复制的文件系统，是容器的默认文件系统。OverlayFS 只需指定 n 个 lowerdir 和 1 个 upperdir。在云原生领域容器引擎：会将包含多个层的镜像会解压到目录中，作为 OverlayFS 的 lowerdir，创建一个空目录作为 upperdir。当容器的进行修改镜像里的文件时会将文件复制到 upperdir 中然后进行修改。

```
          rootfs (overlayfs)                 image

              +-----------+
mount point   |  merged   |
              +-----------+
                    ^
               work | mount -t overlay overlay -olowerdir=lowern:lower...:lower1,upperdir=upper,workdir=work merged
                    |
              +-----------+
upperdir      |   upper   |
              +-----------+

              +-----------+              +------------------+
              |  lowern   |              | layer n tar.gz   |
              +-----------+    unpack    +------------------+
lowerdir      | lower...  |   <-------   | layer ... tar.gz |
              +-----------+              +------------------+
              |  lower1   |              | layer 1 tar.gz   |
              +-----------+              +------------------+
```

* 关于 oci image： [OCI 镜像格式规范](/posts/oci-image-spec/)
* 从镜像到 rootfs 生成过程： [Containerd 详解（四） OverlayFS snapshotter](/posts/containerd-4-overlayfs-snapshotter/)

下文将从几方面探索 overlayfs 的特性：

* 观察多个 lowers 生成的 merged 目录。
* 操作 merged 目录，观察 upper 目录的变化。
* 操作 upper 或 lower 目录，观察 merged 目录的变化。

## 实验代码库

本系列实验代码库位于：[rectcircle/container-core-tech-experiment](https://github.com/rectcircle/container-core-tech-experiment) 的 `src/shell/03-overlayfs`目录

## 观察 merged 目录

overlayfs 可以通过 mount 命令 (系统调用) 创建。其 lowerdir 选项允许多个，且是必须提供；而 upperdir 和 workdir 是可选的；如果 upperdir 和 workdir 两个选项不提供，则生成的 merged 目录则是只读的。

下面实现代码将两个 lowerdir 通过 overlayfs 生成到 merged 目录中。

```bash
#!/usr/bin/env bash
# sudo ./src/shell/03-overlayfs/00-lowers-to-merged.sh

# 创建并进入测试目录
exp_base_dir=/tmp/overlayfs-exp/00-lowers-to-merged
umount $exp_base_dir/merged >/dev/null 2>&1
rm -rf $exp_base_dir && mkdir -p $exp_base_dir
cd $exp_base_dir

# 准备 lower、merged 目录
mkdir -p lower1 lower2 merged
# lower1/
mkdir -p lower1/from-lower1-dir lower1/from-lower1-dir/subdir
echo 'from-lower1' > lower1/from-lower1-dir/file
echo 'from-lower1' > lower1/from-lower1-file
echo 'from-lower1' > lower1/from-lower1-lower2-file
mkdir -p lower1/from-lower1-lower2-dir lower1/from-lower1-lower2-dir/subdir
echo 'from-lower1' > lower1/from-lower1-lower2-dir/file
echo 'from-lower1' > lower1/from-lower1-lower2-dir/from-lower1-file
# lower2/
mkdir -p lower2/from-lower2-dir lower2/from-lower2-dir/subdir
echo 'from-lower2' > lower2/from-lower2-dir/file
echo 'from-lower2' > lower2/from-lower2-file
echo 'from-lower2' > lower2/from-lower1-lower2-file
mkdir -p lower2/from-lower1-lower2-dir lower2/from-lower1-lower2-dir/subdir
echo 'from-lower2' > lower2/from-lower1-lower2-dir/file
echo 'from-lower2' > lower2/from-lower1-lower2-dir/from-lower2-file
touch -t 197001010000 lower2/from-lower1-lower2-dir

# 生成 merged
mount -t overlay overlay -olowerdir=lower2:lower1 merged

# 观察情况
echo '>>> tree lower1/'
tree lower1
echo

echo '>>> tree lower2/'
tree lower2
echo

echo '>>> tree merged/'
tree merged/
echo

echo '>>> cat merged/from-lower1-lower2-file'
cat merged/from-lower1-lower2-file
echo

echo '>>> cat merged/from-lower1-lower2-dir/file'
cat merged/from-lower1-lower2-dir/file
echo

echo '>>> stat merged/from-lower1-lower2-dir'
stat merged/from-lower1-lower2-dir
echo
```

输出如下：

```
>>> tree lower1/
lower1
├── from-lower1-dir
│   ├── file
│   └── subdir
├── from-lower1-file
├── from-lower1-lower2-dir
│   ├── file
│   ├── from-lower1-file
│   └── subdir
└── from-lower1-lower2-file

4 directories, 5 files

>>> tree lower2/
lower2
├── from-lower1-lower2-dir
│   ├── file
│   ├── from-lower2-file
│   └── subdir
├── from-lower1-lower2-file
├── from-lower2-dir
│   ├── file
│   └── subdir
└── from-lower2-file

4 directories, 5 files

>>> tree merged/
merged/
├── from-lower1-dir
│   ├── file
│   └── subdir
├── from-lower1-file
├── from-lower1-lower2-dir
│   ├── file
│   ├── from-lower1-file
│   ├── from-lower2-file
│   └── subdir
├── from-lower1-lower2-file
├── from-lower2-dir
│   ├── file
│   └── subdir
└── from-lower2-file

6 directories, 8 files

>>> cat merged/from-lower1-lower2-file
from-lower2

>>> cat merged/from-lower1-lower2-dir/file
from-lower2

>>> stat merged/from-lower1-lower2-dir
  文件：merged/from-lower1-lower2-dir
  大小：4096            块：8          IO 块：4096   目录
设备：36h/54d   Inode：1625488     硬链接：1
权限：(0755/drwxr-xr-x)  Uid：(    0/    root)   Gid：(    0/    root)
最近访问：2023-11-18 21:52:10.813161498 +0800
最近更改：1970-01-01 00:00:00.000000000 +0800
最近改动：2023-11-18 21:52:10.809161535 +0800
创建时间：2023-11-18 21:52:10.809161535 +0800
```

可以得出如下结论：

* `lowerdir` 支持多个目录。这多个目录以 `:` 分割。
* `lowerdir` 的多个目录，左侧的位于上层。这些 lowerdir 如果存在同路径的文件，则在上层（左侧）目录中的文件将覆盖右侧的文件。
    * 读取 `merged/from-lower1-lower2-file` 相当于读取 `lower2/from-lower1-lower2-file`。
* `lowerdir` 的多个目录中，如果存在同名的目录，在 merged 目录看来，会包含这些 lowerdir 中的所有文件，而目录的元信息则取最左侧的目录的元信息。
    * 读取 `merged/from-lower1-lower2-dir` 目录项目，包含 `lower2/from-lower1-lower2-file` 和 `lower1/from-lower1-lower2-file` 目录的全部内容。
    * 读取 `merged/from-lower1-lower2-dir` 目录元信息，内容为 `lower2/from-lower1-lower2-file` 的元信息。
* 性能（无 cache 情况）：可以看出 overlayfs 和常规文件系统相比，其列出目录项的性能和 lowerdir 的数目有关，如果层数为 n，则 overlayfs 列出目录项的时间复杂度为 `O(n)`。

## 操作 merged 目录

下面实现代码将一个 lowerdir 通过 overlayfs 生成到 merged 目录中，并在 merged 目录中执行：新建、修改、删除、移动操作。

```bash
#!/usr/bin/env bash
# sudo apt install attr
# sudo ./src/shell/03-overlayfs/01-operate-merged.sh

# 创建并进入测试目录
exp_base_dir=/tmp/overlayfs-exp/01-operate-merged
umount $exp_base_dir/merged >/dev/null 2>&1
rm -rf $exp_base_dir && mkdir -p $exp_base_dir
cd $exp_base_dir

# 准备 lower、merged、upper、work 目录
mkdir -p lower1 merged upper work
mkdir -p lower1/from-lower1-dir lower1/from-lower1-dir2 lower1/from-lower1-dir3
mkdir -p lower1/from-lower1-dir/subdir
echo 'from-lower1' > lower1/from-lower1-dir/subdir/file
echo 'from-lower1' > lower1/from-lower1-dir/file
echo 'from-lower1' > lower1/from-lower1-file
echo 'from-lower1' > lower1/from-lower1-dir2/file1
echo 'from-lower1' > lower1/from-lower1-dir2/file2
echo 'from-lower1' > lower1/from-lower1-file2
echo 'from-lower1' > lower1/from-lower1-dir3/file1
echo 'from-lower1' > lower1/from-lower1-dir3/file2
echo 'from-lower1' > lower1/from-lower1-file3

# 生成 merged
mount -t overlay overlay -olowerdir=lower1,upperdir=upper,workdir=work merged

# 在 merged 新建
echo 'from-merged' > merged/from-merged-file
echo 'from-merged' > merged/from-lower1-dir/from-merged-file
mkdir -p merged/from-merged-dir/subdir
mkdir -p merged/from-lower1-dir/from-merged-dir/subdir

# 在 merged 修改
echo 'from-merged' >> merged/from-lower1-file
echo 'from-merged' >> merged/from-lower1-dir/file
touch -t 197001010000 merged/from-lower1-dir/subdir

# 在 merged 删除
rm -rf merged/from-lower1-dir2
rm -rf merged/from-lower1-file2

# 在 merged 移动
mv merged/from-lower1-file3 merged/from-lower1-file3-moved
mv merged/from-lower1-dir3 merged/from-lower1-dir3-moved

# 观察情况
echo '>>> tree merged/'
tree merged/
echo

echo '>>> tree upper/'
tree upper/
echo

echo '>>> cat upper/from-lower1-file'
cat upper/from-lower1-file
echo

echo '>>> cat upper/from-lower1-dir/file'
cat upper/from-lower1-dir/file
echo

echo '>>> stat upper/from-lower1-dir/subdir'
stat upper/from-lower1-dir/subdir
echo


echo '>>> stat upper/from-lower1-dir2'
stat upper/from-lower1-dir2
echo

echo '>>> attr -l upper/from-lower1-dir2'
attr -l upper/from-lower1-dir2
echo

echo '>>> stat upper/from-lower1-file2'
stat upper/from-lower1-file2
echo

echo '>>> attr -l upper/from-lower1-file2'
attr -l upper/from-lower1-file2
echo
```

输出如下：

```
>>> tree merged/
merged/
├── from-lower1-dir
│   ├── file
│   ├── from-merged-dir
│   │   └── subdir
│   ├── from-merged-file
│   └── subdir
│       └── file
├── from-lower1-dir3-moved
│   ├── file1
│   └── file2
├── from-lower1-file
├── from-lower1-file3-moved
├── from-merged-dir
│   └── subdir
└── from-merged-file

7 directories, 8 files

>>> tree upper/
upper/
├── from-lower1-dir
│   ├── file
│   ├── from-merged-dir
│   │   └── subdir
│   ├── from-merged-file
│   └── subdir
├── from-lower1-dir2
├── from-lower1-dir3
├── from-lower1-dir3-moved
│   ├── file1
│   └── file2
├── from-lower1-file
├── from-lower1-file2
├── from-lower1-file3
├── from-lower1-file3-moved
├── from-merged-dir
│   └── subdir
└── from-merged-file

7 directories, 11 files

>>> stat upper/from-lower1-dir2
  文件：upper/from-lower1-dir2
  大小：0               块：0          IO 块：4096   字符特殊文件
设备：fe01h/65025d      Inode：1625522     硬链接：4     设备类型：0,0
权限：(0000/c---------)  Uid：(    0/    root)   Gid：(    0/    root)
最近访问：2023-11-18 22:31:33.590898113 +0800
最近更改：2023-11-18 22:31:33.590898113 +0800
最近改动：2023-11-18 22:31:33.758896324 +0800
创建时间：2023-11-18 22:31:33.590898113 +0800

>>> attr -l upper/from-lower1-dir2

>>> stat upper/from-lower1-file2
  文件：upper/from-lower1-file2
  大小：0               块：0          IO 块：4096   字符特殊文件
设备：fe01h/65025d      Inode：1625522     硬链接：4     设备类型：0,0
权限：(0000/c---------)  Uid：(    0/    root)   Gid：(    0/    root)
最近访问：2023-11-18 22:31:33.590898113 +0800
最近更改：2023-11-18 22:31:33.590898113 +0800
最近改动：2023-11-18 22:31:33.758896324 +0800
创建时间：2023-11-18 22:31:33.590898113 +0800

>>> attr -l upper/from-lower1-file2

```

可以得出如下结论：

* 在 merged 中新增文件或目录，会在 upper 中创建并存储。
* 在 merged 中修改文件或目录。
    * 如果修改的是文件，则会将文件从 lower 中复制到 upper 中，并修改。
    * 如果修改的是目录，则会将在 upper 中创建同路径的目录，其他属性和 lower 最左侧的相同，时间属性不同。
* 在 merged 中删除文件或目录，会在 upper 中同级路径，创建一个设别号为 0/0 的字符设备。
* 在 merged 中移动文件或目录，会在 upper 中将原路径创建一个设别号为 0/0 的字符设备，在新路径中创建一个新的文件或目录。
* 性能（无 cache 情况）：
    * 新增，和常规文件系统相比类似。
    * 修改，和常规文件系统相比，会多出一个 copy 的耗时，对于大文件来说劣化严重。
    * 删除，和常规文件系统相比，行为不同，但是性能类似。
    * 移动，和常规文件系统相比，行为不同，但是性能类似。

## 操作 lower 目录

下面实现代码将一个 lower1 lower2 通过 overlayfs 生成到 merged 目录后，再在 lower2 目录中执行：新建、覆盖、隐藏操作。

注意，该操作（在线修改 overlayfs 的底层文件系统），在[内核文档](https://docs.kernel.org/filesystems/overlayfs.html#changes-to-underlying-filesystems)中，是未定义的，但文档也明确说明了该行为不会导致 crash 或死锁。

本部分就是探索在 Linux 的实现中，操作 lower 目录的行为到底是什么样的。

```bash
#!/usr/bin/env bash
# sudo apt install attr
# sudo ./src/shell/03-overlayfs/02-operate-lower.sh

# 创建并进入测试目录
exp_base_dir=/tmp/overlayfs-exp/02-operate-lower
umount $exp_base_dir/merged >/dev/null 2>&1
rm -rf $exp_base_dir && mkdir -p $exp_base_dir
cd $exp_base_dir

# 准备 lower、merged、upper、work 目录
mkdir -p lower1 lower2 merged upper work
mkdir -p lower1/from-lower1-dir lower1/from-lower1-dir2 lower1/from-lower1-lowner2-dir lower1/from-lower2-opaquedir
mkdir -p lower1/from-lower1-dir/subdir
echo 'from-lower1' > lower1/from-lower1-dir/file
echo 'from-lower1' > lower1/from-lower1-dir2/file
echo 'from-lower1' > lower1/from-lower1-lowner2-dir/file
echo 'from-lower1' > lower1/file1
echo 'from-lower1' > lower1/file2
echo 'from-lower1' > lower1/from-lower2-opaquedir/file1

# 生成 merged
mount -t overlay overlay -olowerdir=lower2:lower1,upperdir=upper,workdir=work merged
mkdir -p merged/from-merged-dir
echo 'from-merged' > merged/from-merged-dir/file1

# 操作之前
echo '=== before ==='
echo '>>> cat merged/file1'
cat merged/file1
echo
echo '>>> ls -al merged/from-lower1-lowner2-dir'
ls -al merged/from-lower1-lowner2-dir
echo
echo '>>> ls -al merged/from-lower2-opaquedir'
ls -al merged/from-lower2-opaquedir
echo

# lower2 新增文件
echo 'from-lower2' > lower2/from-lower2-file
mkdir -p lower2/from-lower2-dir
mkdir -p lower2/from-lower1-lowner2-dir
echo 'from-lower2' > lower2/from-lower1-lowner2-dir/from-lower2-file
mkdir -p lower2/from-lower1-lowner2-dir/subdir
echo 'from-lower2' > lower2/from-lower1-lowner2-dir/subdir/from-lower2-file
mkdir -p lower2/from-merged-dir
echo 'from-lower2' > lower2/from-merged-dir/file2
touch -t 197001010000 lower2/from-merged-dir

# lower2 覆盖文件
echo 'from-lower2' > lower2/file1
echo 'from-lower2' > lower2/file2
echo 'from-lower2' > lower2/from-lower1-lowner2-dir/file

# lower2 隐藏文件目录
mknod lower2/from-lower1-dir c 0 0
mkdir -p lower2/from-lower1-dir2
mknod lower2/from-lower1-dir2/file c 0 0

# lower2 opaque 目录
mkdir -p lower2/from-lower2-opaquedir
echo 'from-lower2' > lower2/from-lower2-opaquedir/file2
setfattr -n 'trusted.overlay.opaque' -v 'y' lower2/from-lower2-opaquedir  # 不能用 attr 命令，因为 attr 会自动添加 user. 前缀

# 操作之后
echo '=== after ==='
echo '>>> tree merged'
tree merged
echo
echo '>>> cat merged/file1'
cat merged/file1
echo
echo '>>> cat merged/file2'
cat merged/file2
echo
echo '>>> cat merged/from-lower1-lowner2-dir/file'
cat merged/from-lower1-lowner2-dir/file
echo


# 清理缓存后
echo 2 > /proc/sys/vm/drop_caches
echo '=== after clear cache ==='
echo '>>> tree merged'
tree merged
echo
echo '>>> cat merged/file1'
cat merged/file1
echo
echo '>>> cat merged/file2'
cat merged/file2
echo
echo '>>> cat merged/from-lower1-lowner2-dir/file'
cat merged/from-lower1-lowner2-dir/file
echo
```

输出如下：

```
=== before ===
>>> cat merged/file1
from-lower1

>>> ls -al merged/from-lower1-lowner2-dir
总用量 12
drwxr-xr-x 2 root root 4096 11月 19 02:57 .
drwxr-xr-x 1 root root 4096 11月 19 02:57 ..
-rw-r--r-- 1 root root   12 11月 19 02:57 file

>>> ls -al merged/from-lower2-opaquedir
总用量 12
drwxr-xr-x 2 root root 4096 11月 19 02:57 .
drwxr-xr-x 1 root root 4096 11月 19 02:57 ..
-rw-r--r-- 1 root root   12 11月 19 02:57 file1

=== after ===
>>> tree merged
merged
├── file1
├── file2
├── from-lower1-dir2
├── from-lower1-lowner2-dir
│   └── file
├── from-lower2-dir
├── from-lower2-file
├── from-lower2-opaquedir
│   └── file1
└── from-merged-dir
    └── file1

5 directories, 6 files

>>> cat merged/file1
from-lower1

>>> cat merged/file2
from-lower2

>>> cat merged/from-lower1-lowner2-dir/file
from-lower1

=== after clear cache ===
>>> tree merged
merged
├── file1
├── file2
├── from-lower1-dir2
├── from-lower1-lowner2-dir
│   ├── file
│   ├── from-lower2-file
│   └── subdir
│       └── from-lower2-file
├── from-lower2-dir
├── from-lower2-file
├── from-lower2-opaquedir
│   └── file2
└── from-merged-dir
    └── file1

6 directories, 8 files

>>> cat merged/file1
from-lower2

>>> cat merged/file2
from-lower2

>>> cat merged/from-lower1-lowner2-dir/file
from-lower2
```

在 lower2 上的操作，可以得出如下结论（内核版本： 5.10.0-20-amd64）：

* 总体上， overlayfs 在设计上存在一个假设，即 lowerdir 是不可变的。因此，overlay 会对 lowerdir 的 inode 进行 cache。
* 新增：当新增的文件或目录的所在目录，没被 cache 过（目录没被读取过），则在该目录下新建的文件在 merged 可见，否则不可见。
* 覆盖：当要覆盖的文件的所在目录，没被 cache 过（目录没被读取过），则在覆盖不生效，否则生效。
* 删除：创建设备号为 0,0 的字符设备可以实现，当要删除的文件所在目录，没被 cache 过（目录没被读取过），则在删除不生效，否则生效。
* 让下层变透明：通过设置 lower2 目录 `from-lower2-opaquedir` 的 [`trusted.overlay.opaque` 属性为 `y`](https://docs.kernel.org/filesystems/overlayfs.html#whiteouts-and-opaque-directories) 可以隐藏掉 lower1 目录 `from-lower2-opaquedir` 中的所有内容（让下层变透明，即表示查找当前层就停止，不要再向下遍历），如果该目录没被 cache 过（目录没被读取过），则在设置不生效，否则生效。
* 可以通过 `echo 2 > /proc/sys/vm/drop_caches` 清理目录项和 inode， lower2 的变更立即生效（就像重新 mount 一样）。
* 在 merged 新建一个在所有 lower 中都没有的目录后，再在 lower2 中创建这个目录，则 lower2 中目录的这个目录将被完全的遮蔽，即使清理缓存，重新挂载都不能被 merged 中看到。原因是： overlayfs 会尽量让 inode 和底层文件系统保持一致，而在本例中 lower2 和 upper 在同一个底层文件系统，overlayfs 在遍历过程中，会遍历并取 inode 最小的那个，并停止遍历，因此 `lower2/from-merged-dir/file2` 永远看不到。如果想让 file2 被看到，解决办法是：
    * 让 lower2 目录和 upper 目录处于不同的文件系统中，如 lower2 在 NFS，upper 在本地磁盘，这样 merged 的 inode 将不会复用底层文件系统的，而是从 0 开始生成。
    * 让 upper 目录的 inode 比 lower 目录的大（在 upper 目录，先 cp 备份，再 rm，mv 回来）。

## 操作 upper 目录

下面实现代码将一个 lower 通过 overlayfs 生成到 merged 目录后，再在 upper 目录中执行：新建、覆盖、删除、透明操作。

注意，该操作（在线修改 overlayfs 的底层文件系统），在[内核文档](https://docs.kernel.org/filesystems/overlayfs.html#changes-to-underlying-filesystems)中，是未定义的，但文档也明确说明了该行为不会导致 crash 或死锁。

本部分就是探索在 Linux 的实现中，操作 upper 目录的行为到底是什么样的。

```bash
#!/usr/bin/env bash
# sudo apt install attr
# sudo ./src/shell/03-overlayfs/03-operate-upper.sh

# 创建并进入测试目录
exp_base_dir=/tmp/overlayfs-exp/03-operate-upper
umount $exp_base_dir/merged >/dev/null 2>&1
rm -rf $exp_base_dir && mkdir -p $exp_base_dir
cd $exp_base_dir

# 准备 lower、merged、upper、work 目录
mkdir -p lower merged upper work
mkdir -p lower/from-lower-dir1
echo 'from-lower' > lower/from-lower-dir1/from-lower-file
mkdir -p lower/from-lower-dir2
echo 'from-lower' > lower/from-lower-dir2/from-lower-file
mkdir -p lower/from-lower-dir3
echo 'from-lower' > lower/from-lower-dir3/from-lower-file
mkdir -p lower/from-lower-dir4
echo 'from-lower' > lower/from-lower-dir4/from-lower-file
mkdir -p lower/from-lower-dir5
echo 'from-lower' > lower/from-lower-dir5/from-lower-file
echo 'from-lower' > lower/from-lower-file1
echo 'from-lower' > lower/from-lower-file2
echo 'from-lower' > lower/from-lower-file3

# 生成 merged
mount -t overlay overlay -olowerdir=lower,upperdir=upper,workdir=work merged

# 操作之前
echo '=== before ==='
echo '>>> cat merged/from-lower-file1'
cat merged/from-lower-file1
echo
echo '>>> ls merged/from-lower-dir1'
cat merged/from-lower-dir1
echo

# 新增
echo 'from-upper' > upper/from-upper-file
mkdir -p upper/from-lower-dir1
echo 'from-upper' > upper/from-lower-dir1/from-upper-file
mkdir -p upper/from-lower-dir2
echo 'from-upper' > upper/from-lower-dir2/from-upper-file
mkdir -p upper/from-upper-dir

# 覆盖
echo 'from-upper' > upper/from-lower-file1
echo 'from-upper' > upper/from-lower-file2
echo 'from-upper' > upper/from-lower-dir1/from-lower-file
echo 'from-upper' > upper/from-lower-dir2/from-lower-file

# 删除
mknod upper/from-lower-file3 c 0 0
mknod upper/from-lower-dir3 c 0 0
mkdir upper/from-lower-dir4
mknod upper/from-lower-dir4/from-lower-file c 0 0

# 透明
mkdir upper/from-lower-dir5
setfattr -n 'trusted.overlay.opaque' -v 'y' upper/from-lower-dir5  # 不能用 attr 命令，因为 attr 会自动添加 user. 前缀
echo 'from-upper' > upper/from-lower-dir5/from-upper-file


# 观察
# 操作后
echo '=== after ==='
echo '>>> tree merged/'
tree merged/
echo

echo '>>> cat merged/from-lower-file1'
cat merged/from-lower-file1
echo

echo '>>> cat merged/from-lower-file2'
cat merged/from-lower-file2
echo

echo '>>> cat merged/from-lower-dir1/from-lower-file'
cat merged/from-lower-dir1/from-lower-file
echo

echo '>>> cat merged/from-lower-dir2/from-lower-file'
cat merged/from-lower-dir2/from-lower-file
echo


# 清理缓存后
echo 2 > /proc/sys/vm/drop_caches
echo '=== after clear cache ==='
echo '>>> tree merged/'
tree merged/
echo

echo '>>> cat merged/from-lower-file1'
cat merged/from-lower-file1
echo

echo '>>> cat merged/from-lower-file2'
cat merged/from-lower-file2
echo

echo '>>> cat merged/from-lower-dir1/from-lower-file'
cat merged/from-lower-dir1/from-lower-file
echo

echo '>>> cat merged/from-lower-dir2/from-lower-file'
cat merged/from-lower-dir2/from-lower-file
echo
```

输出如下：

```
=== before ===
>>> cat merged/from-lower-file1
from-lower

>>> ls merged/from-lower-dir1
cat: merged/from-lower-dir1: 是一个目录

=== after ===
>>> tree merged/
merged/
├── from-lower-dir1
│   └── from-lower-file
├── from-lower-dir2
│   ├── from-lower-file
│   └── from-upper-file
├── from-lower-dir4
├── from-lower-dir5
│   └── from-upper-file
├── from-lower-file1
├── from-lower-file2
├── from-upper-dir
└── from-upper-file

5 directories, 7 files

>>> cat merged/from-lower-file1
from-lower

>>> cat merged/from-lower-file2
from-upper

>>> cat merged/from-lower-dir1/from-lower-file
from-lower

>>> cat merged/from-lower-dir2/from-lower-file
from-upper

=== after clear cache ===
>>> tree merged/
merged/
├── from-lower-dir1
│   ├── from-lower-file
│   └── from-upper-file
├── from-lower-dir2
│   ├── from-lower-file
│   └── from-upper-file
├── from-lower-dir4
├── from-lower-dir5
│   └── from-upper-file
├── from-lower-file1
├── from-lower-file2
├── from-upper-dir
└── from-upper-file

5 directories, 8 files

>>> cat merged/from-lower-file1
from-upper

>>> cat merged/from-lower-file2
from-upper

>>> cat merged/from-lower-dir1/from-lower-file
from-upper

>>> cat merged/from-lower-dir2/from-lower-file
from-upper
```

在 upper 上的操作，可以得出如下结论（内核版本： 5.10.0-20-amd64）：

* 总体上， overlayfs 假设 upper 目录只有 overlayfs 内核能力操作 。因此，overlay 会对 upper 的 inode 进行 cache。
* 如果在 merged 目录，对应的 upper 目录或文件被读取过，则对这些在 upper 目录中的文件或目录进行手动修改，在 merged 目录中是不可见的。
* 当 cache 失效或者手动执行 `echo 2 > /proc/sys/vm/drop_caches` 清理缓存，对 upper 目录的操作将会在 merged 目录中可见。
* 对 upper 目录的 新建、覆盖、删除、透明操作的行为，和对 lower 目录的操作一致，在此不多赘述。
