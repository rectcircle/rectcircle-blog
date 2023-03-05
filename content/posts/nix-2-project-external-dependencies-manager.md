---
title: "Nix 详解（二） 项目外部依赖管理"
date: 2023-03-06T02:28:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> version: nix-2.14.1

## 场景概述

在开发一个项目过程中，总是需要搭建一个完整的开发环境。

比如开发一个 Go 项目（go1.19），这个项目会有些脚本，这些脚本依赖 jq、curl。

此时，该项目的每个开发人员，都需要在自己的工作电脑中根据文档或者口口相传安装这些外部依赖。操作可能如下：

* 前往 Go 官网，下载指定版本的 Go，如果同时开发多个项目，还要解决不同项目 Go 版本不一致的问题。
* 使用自己操作系统的包管理工具安装 jq、curl。

这种手动操作存在如下问题：

* 存在较高沟通和时间成本，搭建流程繁琐枯燥，尤其是大型项目。
* 不同的开发的设备配置可能不一致，在搭建开发环境的时候，极大概率可能会遇到各种奇奇怪怪的问题。
* 统一设备多个项目可能存在冲突。

为了解决开发环境搭建的问题，各个语言都有自己的解决方案，如 python venv。

而 nix ([nix-shell](https://nixos.org/manual/nix/stable/command-ref/nix-shell.html)) 提供了一种通用的优雅的，自动化的，可重现的，搭建隔离的开发环境的能力。

## 临时开发环境

> [nix.dev/临时开发环境](https://nix.dev/tutorials/ad-hoc-developer-environments)

```bash
nix-shell -p go_1_19 jq curl
```

如上命令作用是，打开一个 shell，并安装 `go_1_19`、`jq`、`curl` 这三个包。执行 `echo $PATH` 可以看到其被正确的配置了。

```
/nix/store/7xf4f4d9jip5rjkzwvxwxqgmyhzzvyqk-bash-interactive-5.2-p15/bin:...:/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games
```

执行 exit 后，将回到之前的 shell，一切将恢复如初，系统环境不会有任何影响。

需要特别说明的是，上述命令并非完全可重现，原因如下：

* 该命令仍然集成了当前 shell 的一些环境变量。在不同的设备中得到的 shell 环境可能有所差异。
* 在写这篇文章的时刻没有任何问题，但是随着时间的推移。如，两年后，这个命令可能就不生效。原因在于，该命令要安装的包来自 nixpkgs channel，而该 channel 随着时间的推移，会发生变化，比如未来 go_1_19 已经不再维护时，相关文件可能会直接被删除。

因此，如果想得到一个可重现的临时开发环境，命令如下：

```bash
nix-shell -p go_1_19 jq curl --pure -I nixpkgs=https://github.com/NixOS/nixpkgs/archive/794f34657e066a5e8cc4bb34491fee02240c6ac4.tar.gz
# nix-shell -p go_1_19 jq curl --pure -I nixpkgs=https://mirrors.tuna.tsinghua.edu.cn/nix-channels/releases/nixpkgs-unstable%40nixpkgs-23.05pre460011.f5ffd578778/nixexprs.tar.xz
```

* `--pure` 指，不继承当期 shell 环境变量。
* `-I` 从指定 channel 版本中安装包（commit id 前往 https://github.com/NixOS/nixpkgs/commits/master 查询）。
    * 中国大陆前往，[清华源 Release 目录](https://mirrors.tuna.tsinghua.edu.cn/nix-channels/releases/?C=M&O=D)， 搜索最新的`nixpkgs-unstable@nixpkgs` 开头的最新，复制 nixexprs.tar.xz 路径。

除了直接进入一个 shell 外，还可以通过 `--command`（交互式）、`--run`（非交互式） 仅在该环境中一个命令，然后立即退出。

这里使用到了官方 channel nixpkgs，要想了解 nixpkgs，需要先了解 nix 领域特定语言，因此关于 nixpkgs 的详细介绍，参见下一篇关于 nix 领域特定语言的介绍。

这种方式对于临时测试十分有用。

## 可重现 shell 脚本

> [nix.dev/可重现脚本](https://nix.dev/tutorials/reproducible-scripts) | [如何使用 Nix 轻松获取依赖项](https://devpress.csdn.net/cicd/62ee0a19c6770329307f3202.html)

从上文可以看出，nix-shell 和 bash 很像。自然的，我们可以通过 shell shebang 机制，使用 nix-shell 来为 bash 脚本配置执行环境，并执行脚本内容。

创建 `nix-package-demo/demo.sh` 文件，编写内容如下:

```bash
#!/usr/bin/env nix-shell
#! nix-shell -i bash --pure
#! nix-shell -p bash go_1_19 jq curl which
#! nix-shell -I nixpkgs=https://mirrors.tuna.tsinghua.edu.cn/nix-channels/releases/nixpkgs-unstable%40nixpkgs-23.05pre460011.f5ffd578778/nixexprs.tar.xz

echo $PATH
which go
which jq
which curl
```

`chmod +x nix-package-demo/demo.sh`，执行 `./nix-package-demo/demo.sh` 输出如下：

```bash
/nix/store/7xf4f4d9jip5rjkzwvxwxqgmyhzzvyqk-bash-interactive-5.2-p15/bin:...:/nix/store/s29xjzid62937vc17jx6zi785nhk0plk-file-5.44/bin
/nix/store/633qlvqjryvq0h43nwvzkd5vqxh2rh3c-go-1.19.6/bin/go
/nix/store/hagvhrwy8jzj97kc7nyy9vr18xkg7xvk-jq-1.6-bin/bin/jq
/nix/store/yl319c7cyd6jb3ssizbdaknwv0543986-curl-7.88.0-bin/bin/curl
```

说明：

* 第一行，表示使用 nix-shell 解释器执行该脚本文件。
* 第二到第四行，为 nix-shell 的配置，可以多行，也可以一行。
* 第二行表示，使用 bash 解释器，并不继承当前进程的环境变量。
* 第三行表示，安装 bash go_1_19 jq curl which 包。
* 第四行表示，从指定 channel 版本中安装包。

## 通过 shell.nix 配置环境

> [nix wiki 使用 nix-shell](配置开发环境 https://nixos.wiki/wiki/Development_environment_with_nix-shell)

nix-shell 除了支持通过命令行参数以及 shell shebang 方式配置依赖外。还支持通过 `shell.nix` 配置文件的方式来配置项目的依赖。

创建一个 `nix-package-demo/shell.nix` 文件，编写如下内容：

```nix
# { pkgs ? import <nixpkgs> { } }:
let 
  pkgs = import ( builtins.fetchTarball { 
    url = "https://mirrors.tuna.tsinghua.edu.cn/nix-channels/releases/nixpkgs-unstable%40nixpkgs-23.05pre460011.f5ffd578778/nixexprs.tar.xz"; 
  }) {};
in
pkgs.mkShell {
  buildInputs =
    [
      pkgs.curl
      pkgs.jq
      pkgs.go
      pkgs.which
    ];
  shellHook = ''
    export TEST_ENV_VAR=ABC
  '';
}
```

`cd nix-package-demo`，然后执行 `nix-shell --pure` 即可进入 `shell.nix` 配置的 shell 中。

此时可重现脚本可以改为（`nix-package-demo/demo2.sh`）：

```bash
#!/usr/bin/env nix-shell
#! nix-shell -i bash --pure shell.nix

echo $PATH
which go
which jq
which curl
```

注意，这里的 `shell.nix` 文件的查找，实测是基于脚本所在目录而不是进程 work dir。

`shell.nix` 语法是 nix 定义的一套领域特定语言，本文不会深入探讨，在本文场景中，只需将开发环境外部依赖添加到 buildInputs 对应部分即可。

如想了解 nix 语言，参见本系列下一篇文章。

## 与 direnv 结合使用

> [使用Nix+direnv快速构建不同软件版本的开发环境](https://grass.show/post/create-environment-with-nix-and-direnv)

通过上述配置，可以通过手动执行一个 nix-shell 获取到一个隔离的具有完整的依赖的 shell 环境。

但是这个过程不够自动化，仍需手动执行一下 nix-shell。此时可以通过 direnv 工具，实现 `cd` 到某个目录后，自动进入该 nix-shell，实施步骤如下：

1. 安装 direnv

    ```bash
    nix-env -iA nixpkgs.direnv
    ```

2. 配置 shell profile 文件，以 bash 为例，在 `~/.bashrc` 中添加（其他 shell 参见：[官方文档](https://direnv.net/docs/hook.html)）：

    ```bash
    eval "$(direnv hook bash)"
    ```

3. 在指定目录（一般为项目根目录），添加 `.envrc` 文件（`nix-package-demo/.envrc`），内容如下：

    ```
    use_nix
    ```

4. 打开一个新的 shell，通过 cd 进入如上目录，先执行一次 `direnv allow .` 对当前目录进行授权（防止网上 clone 下来的代码存在恶意脚本攻击）（每次修改 `.envrc` 都需要重新 allow 一下），之后再 `cd` 到该目录可自动应用 nix-shell 的配置。

## 与 IDE（VSCode） 集成

通过上文的说明，shell 已经可以很好和 nix-shell 创建的开发环境集成了。但是现实中，IDE 能够识别 nix-shell 创建的开发环境更为重要。

以 VSCode 为例，可以使用 [Nix Environment Selector](https://marketplace.visualstudio.com/items?itemName=arrterian.nix-env-selector) 扩展来实现：当 VSCode 打开一个包含 `shell.nix` 的目录时，通过该扩展的 `>Nix-Env: Select Environment` （cmd + shift + p） 命令，选择一个 `.nix` 配置文件，该扩展会调用 nix-shell 完成依赖下载，并提示 Reload，Reload VSCode 后，该扩展会将从 nix-shell 获取到的环境变量设置的 VSCode 的扩展主机进程，这样其他扩展将可以感知到这个环境。

但是需要注意的是，这个扩展存在如下问题：

* 某些场景，`.nix` 声明的依赖还未下载时，该扩展可能会阻塞 VSCode 加载其他的扩展。
* 由于某些场景，如果其他依赖开发环境的扩展比该扩展先激活，可能读取到的是配置前的环境变量，从而导致这些扩展找不到相关依赖（参见：[issue](https://github.com/arrterian/nix-env-selector/issues/66)），这个问题比较致命，受限于 VSCode 机制（参见：[issue](https://github.com/microsoft/vscode/issues/152806)），该问题通过常规办法可能难以解决。
* 该扩展不会自动配置 VSCode Terminal 的 Shell，因此仍然需要上文的 direnv。

## 安装旧版包

在 nix 中，官方的 Channel 是 [nixpkgs](https://github.com/NixOS/nixpkgs)，这个 Channel 是通过 git 管理的。

通过 `nix-env -qaP go` 可以看到，目前最新版本提交的 nixpkgs 的 Go 只有最新的三个版本 1.18、1.19 和 1.20。

很多时候，我们希望，安装更旧版本的依赖时，就需要获取到包含更旧 Go 的配置的 nixpkgs 那个 commit 的快照。

因此，现在的问题是，如何通过包名查询历史版本对应的 commit，然后通过上文的类似于 `https://github.com/NixOS/nixpkgs/archive/794f34657e066a5e8cc4bb34491fee02240c6ac4.tar.gz` 的方式即可安装旧版本的包。

nixpkgs 官方并未提供该能力，但是幸运的是 nix 社区有一个站点可以查询这些信息： https://lazamar.co.uk/nix-versions/ 。

其原理可以参见：[该站点作者博客](https://lazamar.github.io/download-specific-package-version-with-nix/)。

nixpkgs 官方关于安装旧版包的讨论参见：[No way to install/use a specific package version? #9682](https://github.com/NixOS/nixpkgs/issues/9682)。

注意：从多个历史 commit 的 nixpkgs 安装包会导致磁盘占用快速上升。
