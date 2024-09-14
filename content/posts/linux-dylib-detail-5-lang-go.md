---
title: "Linux 动态链接库详解（四） 各编程语言情况"
date: 2024-09-14T11:20:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 标准库中的动态库

### 默认行为

在之前的文章 [《Go 静态编译 和 CGO》](/posts/go-static-compile-and-cgo/) 介绍过，Go 标准库的 `os/user` 和 `net` 包有部分函数的实现有 C 和纯 Go 两个版本，在构建时，编译期选择那个实现的默认行为如下：

* 当项目的标准库中没有引入这两个包时，且项目不包含任何 CGO 代码时，默认将静态编译，此时 lld 查看产物将看不到任何动态链接库信息。
* 当我们的项目的引入了如上两个包时，且当前环境包含 gcc 时，将会使用 C 的实现，此时 ldd 查看产物将看到存在动态链接库的依赖。

### 示例

#### 验证代码

下面是示例代码：

`04-lang/01-go/01-std-nonecgo/main.go`

```go
package main

import (
	"fmt"
)

func main() {
	fmt.Println("Hello, World")
}
```

`04-lang/01-go/02-std-cgo/main.go`

```go
package main

import (
	"fmt"
	"net"
	"os/user"
)

func main() {
	u, err := user.Lookup("root")
	if err != nil {
		panic(err)
	}
	fmt.Printf("root uid: %s\n", u.Uid)
	addrs, err := net.LookupHost("localhost")
	if err != nil {
		panic(err)
	}
	fmt.Printf("localhost addrs: %v\n", addrs)
}
```

#### 验证脚本

验证脚本 `04-lang/01-go/01-build-dep-std.sh`

```bash
#!/usr/bin/env bash

cd $(dirname $(readlink -f $0))

echo '=== 编译 01-std-nonecgo'
cd ./01-std-nonecgo
go build -o main ./
echo '--- ldd 输出如下'
ldd ./main
cd ../
echo

echo '=== 编译 02-std-cgo'
cd ./02-std-cgo
go clean -cache && go build -o main ./
echo '--- ldd 输出如下'
ldd ./main
echo '--- readelf -r 输出如下'
readelf -r ./main
cd ../
echo
```

#### 输出

* 在 `go1.23.1`、`gcc12`、`glibc2.36`、`debian12` 环境下上述脚本，输出如下：

    ```
    === 编译 01-std-nonecgo
    --- ldd 输出如下
            不是动态可执行文件

    === 编译 02-std-cgo
    --- ldd 输出如下
            linux-vdso.so.1 (0x00007fffe5f25000)
            libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f7f48fa9000)
            /lib64/ld-linux-x86-64.so.2 (0x00007f7f49192000)
    --- readelf -r 输出如下

    重定位节 '.rela' at offset 0x145288 contains 1 entry:
    偏移量          信息           类型           符号值        符号名称 + 加数
    0000005eb4e8  000e00000006 R_X86_64_GLOB_DAT 0000000000000000 stderr@GLIBC_2.2.5 + 0

    重定位节 '.rela.plt' at offset 0x1452a0 contains 42 entries:
    偏移量          信息           类型           符号值        符号名称 + 加数
    0000005eb398  000400000007 R_X86_64_JUMP_SLO 0000000000000000 __errno_location@GLIBC_2.2.5 + 0
    0000005eb3a0  000500000007 R_X86_64_JUMP_SLO 0000000000000000 getaddrinfo@GLIBC_2.2.5 + 0
    0000005eb3a8  000600000007 R_X86_64_JUMP_SLO 0000000000000000 free@GLIBC_2.2.5 + 0
    0000005eb3b0  000700000007 R_X86_64_JUMP_SLO 0000000000000000 freeaddrinfo@GLIBC_2.2.5 + 0
    0000005eb3b8  000800000007 R_X86_64_JUMP_SLO 0000000000000000 gai_strerror@GLIBC_2.2.5 + 0
    0000005eb3c0  000900000007 R_X86_64_JUMP_SLO 0000000000000000 getgrgid_r@GLIBC_2.2.5 + 0
    0000005eb3c8  000a00000007 R_X86_64_JUMP_SLO 0000000000000000 getgrnam_r@GLIBC_2.2.5 + 0
    0000005eb3d0  000b00000007 R_X86_64_JUMP_SLO 0000000000000000 getpwnam_r@GLIBC_2.2.5 + 0
    0000005eb3d8  000c00000007 R_X86_64_JUMP_SLO 0000000000000000 getpwuid_r@GLIBC_2.2.5 + 0
    0000005eb3e0  000d00000007 R_X86_64_JUMP_SLO 0000000000000000 sysconf@GLIBC_2.2.5 + 0
    0000005eb3e8  000f00000007 R_X86_64_JUMP_SLO 0000000000000000 fwrite@GLIBC_2.2.5 + 0
    0000005eb3f0  001000000007 R_X86_64_JUMP_SLO 0000000000000000 vfprintf@GLIBC_2.2.5 + 0
    0000005eb3f8  001100000007 R_X86_64_JUMP_SLO 0000000000000000 fputc@GLIBC_2.2.5 + 0
    0000005eb400  001200000007 R_X86_64_JUMP_SLO 0000000000000000 abort@GLIBC_2.2.5 + 0
    0000005eb408  001300000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_mutex_lock@GLIBC_2.2.5 + 0
    0000005eb410  001400000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_cond_wait@GLIBC_2.3.2 + 0
    0000005eb418  001500000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_mutex_unlock@GLIBC_2.2.5 + 0
    0000005eb420  001600000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_key_create@GLIBC_2.34 + 0
    0000005eb428  001700000007 R_X86_64_JUMP_SLO 0000000000000000 fprintf@GLIBC_2.2.5 + 0
    0000005eb430  001800000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_setspecific@GLIBC_2.34 + 0
    0000005eb438  001900000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_cond_broadcast@GLIBC_2.3.2 + 0
    0000005eb440  001a00000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_create@GLIBC_2.34 + 0
    0000005eb448  001b00000007 R_X86_64_JUMP_SLO 0000000000000000 nanosleep@GLIBC_2.2.5 + 0
    0000005eb450  001c00000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_detach@GLIBC_2.34 + 0
    0000005eb458  001d00000007 R_X86_64_JUMP_SLO 0000000000000000 strerror@GLIBC_2.2.5 + 0
    0000005eb460  001e00000007 R_X86_64_JUMP_SLO 0000000000000000 malloc@GLIBC_2.2.5 + 0
    0000005eb468  001f00000007 R_X86_64_JUMP_SLO 0000000000000000 sigfillset@GLIBC_2.2.5 + 0
    0000005eb470  002000000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_sigmask@GLIBC_2.32 + 0
    0000005eb478  002100000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_attr_init@GLIBC_2.2.5 + 0
    0000005eb480  002200000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_attr_gets[...]@GLIBC_2.34 + 0
    0000005eb488  002300000007 R_X86_64_JUMP_SLO 0000000000000000 mmap@GLIBC_2.2.5 + 0
    0000005eb490  002400000007 R_X86_64_JUMP_SLO 0000000000000000 munmap@GLIBC_2.2.5 + 0
    0000005eb498  002500000007 R_X86_64_JUMP_SLO 0000000000000000 setenv@GLIBC_2.2.5 + 0
    0000005eb4a0  002600000007 R_X86_64_JUMP_SLO 0000000000000000 unsetenv@GLIBC_2.2.5 + 0
    0000005eb4a8  002700000007 R_X86_64_JUMP_SLO 0000000000000000 sigemptyset@GLIBC_2.2.5 + 0
    0000005eb4b0  002800000007 R_X86_64_JUMP_SLO 0000000000000000 sigaddset@GLIBC_2.2.5 + 0
    0000005eb4b8  002900000007 R_X86_64_JUMP_SLO 0000000000000000 sigaction@GLIBC_2.2.5 + 0
    0000005eb4c0  002a00000007 R_X86_64_JUMP_SLO 0000000000000000 sigismember@GLIBC_2.2.5 + 0
    0000005eb4c8  002b00000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_self@GLIBC_2.2.5 + 0
    0000005eb4d0  002c00000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_getattr_np@GLIBC_2.32 + 0
    0000005eb4d8  002d00000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_attr_getstack@GLIBC_2.34 + 0
    0000005eb4e0  002e00000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_attr_destroy@GLIBC_2.2.5 + 0
    ```

* 在 `go1.23.1`、`gcc10`、`glibc2.31`、`debian11` 环境下上述脚本，输出和上述区别如下：

    ```
    === 编译 02-std-cgo
    --- ldd 输出如下
            linux-vdso.so.1 (0x00007ffeedd67000)
            libresolv.so.2 => /lib/x86_64-linux-gnu/libresolv.so.2 (0x00007f65b8cca000)
            libpthread.so.0 => /lib/x86_64-linux-gnu/libpthread.so.0 (0x00007f65b8ca8000)
            libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f65b8ad4000)
            /lib64/ld-linux-x86-64.so.2 (0x00007f65b8ced000)
    --- readelf -r 输出如下

    # ...
    0000005c83c0  001a00000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_create@GLIBC_2.2.5 + 0
    #...
    0000005c8400  002200000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_attr_gets[...]@GLIBC_2.2.5 + 0
    #...
    0000005c8450  002c00000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_getattr_np@GLIBC_2.2.5 + 0
    0000005c8458  002d00000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_attr_getstack@GLIBC_2.2.5 + 0
    0000005c8460  002e00000007 R_X86_64_JUMP_SLO 0000000000000000 pthread_attr_destroy@GLIBC_2.2.5 + 0
    ```

#### 分析

* go 编译器对标准库的默认行为的和上文一致。
* 标准库的 cgo 依赖 `resolv`、 `pthread` 库相关函数。
* 启用标准库 cgo 后，go 的 glibc 2.31 和 2.36 的产物有如下区别：
    * pthread 相关函数的默认实现在 2.32 和 2.34 发生了变化。
    * 2.36 版本产物不再依赖 `libresolv.so.2` 和 `libpthread.so.0`。
    * 原因详见： [《Linux 动态链接库详解（二）版本管理 - glibc 情况》](/posts/linux-dylib-detail-2-version/#glibc-情况)
* 可以得出如下结论：依赖 go 标准库 cgo 实现的产物的 glibc 向前兼容性（使用新版本 glibc 编译，在旧版本的 glibc 环境下是否可以运行）如下：
    * `2.3.2` ~ `2.31`
    * `2.32` ~ `2.33`
    * `2.34` ~ ???

## Go 构建过程探索

验证代码 `04-lang/01-go/02-build-detail.sh` （使用 `-x` 打印详细信息）

```bash
#!/usr/bin/env bash

cd $(dirname $(readlink -f $0))

cd ./02-std-cgo
go clean -cache && CGO_LDFLAGS='-Wl,--verbose' go build -x -o main ./
```

核心输出示意如下：

```bash
# 将编译纯 go 包 internal/goarch 包为 .a 文件（静态链接库）。
echo '# import config' > $WORK/b006/importcfg # internal
/home/rectcircle/.gvm/gos/go1.23.1/pkg/tool/linux_amd64/compile -o $WORK/b006/_pkg_.a -trimpath "$WORK/b006=>" -p internal/goarch -lang=go1.23 -std -complete -buildid _I81RMeLWXI9j1YyfN8b/_I81RMeLWXI9j1YyfN8b -goversion go1.23.1 -c=2 -nolocalimports -importcfg $WORK/b006/importcfg -pack /home/rectcircle/.gvm/gos/go1.23.1/src/internal/goarch/goarch.go /home/rectcircle/.gvm/gos/go1.23.1/src/internal/goarch/goarch_amd64.go /home/rectcircle/.gvm/gos/go1.23.1/src/internal/goarch/zgoarch_amd64.go
/home/rectcircle/.gvm/gos/go1.23.1/pkg/tool/linux_amd64/buildid -w $WORK/b006/_pkg_.a # internal
# ...
# 将编译有依赖的纯 go 包  internal/abi
cat >/tmp/go-build1051277818/b005/importcfg << 'EOF' # internal
# import config
packagefile internal/goarch=/tmp/go-build1051277818/b006/_pkg_.a
EOF
/home/rectcircle/.gvm/gos/go1.23.1/pkg/tool/linux_amd64/compile -o $WORK/b005/_pkg_.a -trimpath "$WORK/b005=>" -p internal/abi -lang=go1.23 -std -buildid Nb65lMcIZuXoor9TVLLA/Nb65lMcIZuXoor9TVLLA -goversion go1.23.1 -symabis $WORK/b005/symabis -c=2 -nolocalimports -importcfg $WORK/b005/importcfg -pack -asmhdr $WORK/b005/go_asm.h /home/rectcircle/.gvm/gos/go1.23.1/src/internal/abi/abi.go /home/rectcircle/.gvm/gos/go1.23.1/src/internal/abi/abi_amd64.go /home/rectcircle/.gvm/gos/go1.23.1/src/internal/abi/compiletype.go /home/rectcircle/.gvm/gos/go1.23.1/src/internal/abi/escape.go /home/rectcircle/.gvm/gos/go1.23.1/src/internal/abi/funcpc.go /home/rectcircle/.gvm/gos/go1.23.1/src/internal/abi/iface.go /home/rectcircle/.gvm/gos/go1.23.1/src/internal/abi/map.go /home/rectcircle/.gvm/gos/go1.23.1/src/internal/abi/rangefuncconsts.go /home/rectcircle/.gvm/gos/go1.23.1/src/internal/abi/runtime.go /home/rectcircle/.gvm/gos/go1.23.1/src/internal/abi/stack.go /home/rectcircle/.gvm/gos/go1.23.1/src/internal/abi/switch.go /home/rectcircle/.gvm/gos/go1.23.1/src/internal/abi/symtab.go /home/rectcircle/.gvm/gos/go1.23.1/src/internal/abi/type.go
# 编译 go 汇编的 internal/cpu 包
/home/rectcircle/.gvm/gos/go1.23.1/pkg/tool/linux_amd64/asm -p internal/cpu -trimpath "$WORK/b011=>" -I $WORK/b011/ -I /home/rectcircle/.gvm/gos/go1.23.1/pkg/include -D GOOS_linux -D GOARCH_amd64 -D GOAMD64_v1 -o $WORK/b011/cpu.o ./cpu.s
/home/rectcircle/.gvm/gos/go1.23.1/pkg/tool/linux_amd64/asm -p internal/cpu -trimpath "$WORK/b011=>" -I $WORK/b011/ -I /home/rectcircle/.gvm/gos/go1.23.1/pkg/include -D GOOS_linux -D GOARCH_amd64 -D GOAMD64_v1 -o $WORK/b011/cpu_x86.o ./cpu_x86.s
/home/rectcircle/.gvm/gos/go1.23.1/pkg/tool/linux_amd64/pack r $WORK/b011/_pkg_.a $WORK/b011/cpu.o $WORK/b011/cpu_x86.o # internal
/home/rectcircle/.gvm/gos/go1.23.1/pkg/tool/linux_amd64/buildid -w $WORK/b011/_pkg_.a # internal
# ...
# 编译包含 cgo 源码的 os/user 包
mkdir -p $WORK/b067/
cd /home/rectcircle/.gvm/gos/go1.23.1/src/os/user
TERM='dumb' CGO_LDFLAGS='' /home/rectcircle/.gvm/gos/go1.23.1/pkg/tool/linux_amd64/cgo -objdir $WORK/b067/ -importpath os/user "-ldflags=\"-Wl,--verbose\"" -- -I $WORK/b067/ -O2 -g -fno-stack-protector ./cgo_lookup_cgo.go ./getgrouplist_unix.go
cd $WORK/b067
TERM='dumb' gcc -I /home/rectcircle/.gvm/gos/go1.23.1/src/os/user -fPIC -m64 -pthread -Wl,--no-gc-sections -fmessage-length=0 -ffile-prefix-map=$WORK/b067=/tmp/go-build -gno-record-gcc-switches -I $WORK/b067/ -O2 -g -fno-stack-protector -ffile-prefix-map=/home/rectcircle/.gvm/gos/go1.23.1=/_/GOROOT -frandom-seed=K0OFSSy7CbgIZxgL3TAR -o $WORK/b067/_x001.o -c _cgo_export.c
cd /home/rectcircle/omv/00-Important/Workspace/rectcircle/linux-dylib-demo/04-lang/01-go/02-std-cgo
TERM='dumb' gcc -I /home/rectcircle/.gvm/gos/go1.23.1/src/os/user -fPIC -m64 -pthread -Wl,--no-gc-sections -fmessage-length=0 -ffile-prefix-map=$WORK/b067=/tmp/go-build -gno-record-gcc-switches -o $WORK/b067/_cgo_.o $WORK/b067/_cgo_main.o $WORK/b067/_x001.o $WORK/b067/_x002.o $WORK/b067/_x003.o -Wl,--verbose
GNU ld (GNU Binutils for Debian) 2.40 # 发生了链接
/home/rectcircle/.gvm/gos/go1.23.1/pkg/tool/linux_amd64/compile -o $WORK/b067/_pkg_.a -trimpath "$WORK/b067=>" -p os/user -lang=go1.23 -std -buildid K0OFSSy7CbgIZxgL3TAR/K0OFSSy7CbgIZxgL3TAR -goversion go1.23.1 -c=2 -nolocalimports -importcfg $WORK/b067/importcfg -pack /home/rectcircle/.gvm/gos/go1.23.1/src/os/user/cgo_listgroups_unix.go /home/rectcircle/.gvm/gos/go1.23.1/src/os/user/cgo_lookup_unix.go /home/rectcircle/.gvm/gos/go1.23.1/src/os/user/lookup.go /home/rectcircle/.gvm/gos/go1.23.1/src/os/user/us
/home/rectcircle/.gvm/gos/go1.23.1/pkg/tool/linux_amd64/pack r $WORK/b067/_pkg_.a $WORK/b067/_x001.o $WORK/b067/_x002.o $WORK/b067/_x003.o # internal
# 链接为可执行文件
GOROOT='/home/rectcircle/.gvm/gos/go1.23.1' /home/rectcircle/.gvm/gos/go1.23.1/pkg/tool/linux_amd64/link -o $WORK/b001/exe/a.out -importcfg $WORK/b001/importcfg.link -buildmode=exe -buildid=IkkB1ptOifj-RaHtd9ta/OhOaSc7x9zXjEXRMwq10/ADNTTNgYXWDRapJgS5mC/IkkB1ptOifj-RaHtd9ta -extld=gcc $WORK/b001/_pkg_.a
```

过程如下（默认的 [buildmode](https://pkg.go.dev/cmd/go#hdr-Build_modes)）：

* 从 main 包开始，按照深度优先遍历包的依赖树，从叶子节点依次编译包。
    * 如果是纯 go 源码，构建命令为 `$GOROOT/pkg/tool/linux_amd64/compile`（如 `internal/goarch`）。参数说明（详见： [go cmd compile](https://pkg.go.dev/cmd/compile)）：
        * `-p` 指定包名。
        * `-pack` 指定 go 源代码文件。
        * `-importcfg` 指定依赖的其他包，该参数是一个文件，格式如下：

            ```
            # import config
            packagefile internal/goarch=/tmp/go-build1051277818/b006/_pkg_.a
            ```

    * 如果包中包含 `.s` go 汇编源码（如：`internal/cpu`）：
        * 先使用 `$GOROOT/pkg/tool/linux_amd64/asm` 命令将汇编文件编译为 `.o` 文件（详见： [go cmd asm](https://pkg.go.dev/cmd/asm)）。
        * 再使用 `$GOROOT/pkg/tool/linux_amd64/pack` 命令将 `.o` 打包为 `.a` 文件（详见： [go cmd pack](https://pkg.go.dev/cmd/pack)）。
    * 如果包中包含 `cgo` 源码（如： `os/user`）：
        * 先使用 `$GOROOT/pkg/tool/linux_amd64/cgo` 命令生成展开注释生成 `_cgo_export.c`、`_cgo_main.c`、`xxx.cgo2.c` 等代码文件（详见： [go cmd cgo](https://pkg.go.dev/cmd/cgo)），（`CGO_LDFLAGS` 作为 `cgo` 命令的 `-ldflags` 参数传递给 cgo）。
            * 使用 `gcc` 编译包中的 `.c`、`.S` 源码为 `.o` 文件。
            * 使用 `gcc` 编译 cgo 生成的代码为 `.o` 文件。
            * 最后使用 `gcc` 编译将所有的 `.o` 生成 `_cgo_.o`，这里的 `-ldflags` 将传递给该命令，在此阶段发生了链接，原因可能是是 `_cgo_main.c` 里面生成了 c 语言的 `main` 函数：

                ```c
                #include <stddef.h>
                int main() { return 0; }
                // ...
                ```

        * 再使用 `$GOROOT/pkg/tool/linux_amd64/cgo` 使用 `_cgo_.o` 生成 `_cgo_import.go`。
        * 然后使用 `$GOROOT/pkg/tool/linux_amd64/compile` 编译纯 go 的源码（`_cgo_import.go` 也作为参数），生成 `.o`。
        * 最后使用 `$GOROOT/pkg/tool/linux_amd64/pack` 命令将 `_cgo_.o` 以及 `compile` 生成的代码，打包为 `.a` 文件。
* 最后一步将所有 `.a` 文件链接为可执行文件，这里涉及到 `$GOROOT/pkg/tool/linux_amd64/link`（详见： [go cmd link](https://pkg.go.dev/cmd/link)） 命令的 `-linkmode` 参数：
    * 其默认值 `auto` （参考：[cmd/cgo/doc.go Implementation details](https://cs.opensource.google/go/go/+/refs/tags/go1.23.1:src/cmd/cgo/doc.go;l=542)）：
        * 如果是未启用 cgo 或者只使用了标准库的 CGO，则使用 `internal` 模式。
        * 否则为 `external` 模式。
    * `internal`： 使用 go 实现的原生链接器进行链接，因为上述的 cgo 过程已经进行过链接了，因此动态库的信息已经知晓了，因此在此阶段不需要再进行动态库查找了。直接生成 `a.out` 即可。
    * `external`： 使用外部的链接器进行链接，一般是 `gcc`。
        * 先将 `.a` 转换为链接器可识别的 `.o` 文件。
        * 使用 `gcc` 进行链接生成 `a.out`。

## 和动态库有关构建参数

根据上文的分析，可以总结出和动态链接库有关的命令行参数和环境变量在 go build 细节，以及这些参数透传过程，如下：

```bash
CC=$cc CGO_LDFLAGS=$cgo_ldflags CGO_ENABLED=$cgo_enabled go build -ldflags '-linkmode=$linkmode -extld=$extld -extldflags=$extldflags' -o $main ./
    # 项目以及依赖中包含 cgo 代码且 $cgo_enabled 不存在或非零
    go tool cgo -ldflags=$cgo_ldflags ...
        $cc -o xxx.o xxx.c
        $cc -o _cgo_.o xxx.o xxx.o xxx.o $cgo_ldflags
            ld 处理后的$cgo_ldflags
    go tool link -linkmode $linkmode -extld $extld -extldflags $extldflags ...
        # 项目中包含 cgo 代码且启用了 $cgo_enabled=1
        $extld -o a.out xxx.o xxx.o xxx.o xxx.o $cgo_ldflags $extldflags
            ld 处理后的$cgo_ldflags 处理后的$extldflags
    cp a.out $main
```

* `CGO_ENABLED=0` 时，如下场景将报错：
    * `-ldflags` 配置为 `-linkmode=external`，将报错 `-linkmode=external requires external (cgo) linking, but cgo is not enabled`。
    * 项目中只有 CGO 的实现时。

## 参考

* **[cmd/cgo/doc.go Implementation details](https://cs.opensource.google/go/go/+/refs/tags/go1.23.1:src/cmd/cgo/doc.go;l=542)**
* [go cmd go](https://pkg.go.dev/cmd/go)
* [go cmd compile](https://pkg.go.dev/cmd/compile)
* [go cmd cgo](https://pkg.go.dev/cmd/cgo)
* [go cmd link](https://pkg.go.dev/cmd/link)
* [go cmd pack](https://pkg.go.dev/cmd/pack)
* [Go语言高级编程 2.5 内部机制](https://chai2010.cn/advanced-go-programming-book/ch2-cgo/ch2-05-internal.html)
