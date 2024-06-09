---
title: "Nix 高级话题之 概念"
date: 2024-06-09T18:48:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> [Nix Reference Manual (v2.22) - Glossary](https://nix.dev/manual/nix/2.22/glossary.html?highlight=database#glossary)

## derivation（派生）

一个构建任务的描述。派生的结构是一个 store object（存储对象）。派生使用 Nix 表达式的 `derivation` 函数描述。派生会被转换为低级别的 store derivation（存储派生） （隐式的通过 `nix-build` 命令或显式的通过 `nix-instantiate` 命令）。

## store derivation（存储派生）

一个派生在 store（存储） 中被表达为 `.drv` 文件。就像其他存储对象一样，它有一个 store path（存储路径）（例如 `/nix/store/g946hcz4c8mdvq2g8vxx42z51qb71rvp-git-2.38.1.drv`）。它是 derivation（派生） 的实例化形式。另外，可以通过 [`nix derivation show`](https://nix.dev/manual/nix/2.22/command-ref/new-cli/nix3-derivation-show) 命令查看 derivation（派生） 的具体内容（例如： `nix derivation show /nix/store/g946hcz4c8mdvq2g8vxx42z51qb71rvp-git-2.38.1.drv --extra-experimental-features nix-command`）

## instantiate,instantiation（实例化）

将评估好的 derivation（派生） 保存为 Nix store（存储） 中的 store derivation（存储派生），更多参见，[`nix-instantiate` 命令](https://nix.dev/manual/nix/2.22/command-ref/nix-instantiate)。

## realise,realisation （实现）

获取或构建一个 store object（存储对象），给定一个合法的 nix store path（存储路径），将按照如下方式获取一个 store object（存储对象）：

* 获取从 substituter（替代商） 获取预构建的 store object（存储对象）。
* 按照对应 derivation（派生）中指定的方式运行可执行的[构建器](https://nix.dev/manual/nix/2.22/language/derivations#attr-builder)。
* 委托给[远程机器](https://nix.dev/manual/nix/2.22/command-ref/conf-file#conf-builders)并获取输出。

更多算法细节详见： [`nix-store --realise`](https://nix.dev/manual/nix/2.22/command-ref/nix-store/realise) 的描述。

## content-addressed derivation（内容寻址的派生）

[__contentAddressed](https://nix.dev/manual/nix/2.22/language/advanced-attributes#adv-attr-__contentAddressed) 属性设置为 true 的derivation（派生）。

默认情况下，derivation（派生）输出的 Nix store（存储） 的 store path（存储路径）是根据输入属性的哈希值计算的（`input-addressed`）。

修改 __contentAddressed 属性为 true 后，派生输出的 store path（存储路径） 将根据 derivation（派生） 输出内容的哈希值计算。

该特性是实验性的。

## fixed-output derivation（固定输出的派生）

包含 [outputHash](https://nix.dev/manual/nix/2.22/language/advanced-attributes#adv-attr-outputHash) 属性的 derivation（派生）。

在 Nix 实现中，通过 `fetchurl` 函数生成的 derivation（派生），属于该类型。

这种类型derivation（派生）输出的 Nix store（存储） 的 store path（存储路径）仅根据 `name` 和 `outputHash` 属性值计算，以避免更新下载地址后，依赖该 derivation（派生）的所有包都发生重新构建。

如下示例，变更后对应的 store path（存储路径）不会发生变化：

```nix
fetchurl {
    url = "http://ftp.gnu.org/pub/gnu/hello/hello-2.1.1.tar.gz";
    sha256 = "1md7jsfd8pa45z73bz1kszpp01yw6x5ljkjk2hx7wl800any6465";
}
# 变更为 =>
fetchurl {
    url = "ftp://ftp.nluug.nl/pub/gnu/hello/hello-2.1.1.tar.gz";
    sha256 = "1md7jsfd8pa45z73bz1kszpp01yw6x5ljkjk2hx7wl800any6465";
}
```

## store（存储）

store object（存储对象）的集合，以及操作该集合的操作。详见： [TODO Nix 高级话题之 Store](https://nix.dev/manual/nix/2.22/store/types/)。

store（存储） 类型有多种，详见： [TODO Nix 高级话题之 Store - 存储类型](https://nix.dev/manual/nix/2.22/store/types/)。

## binary cache（二进制缓存）

binary cache 二进制缓存是一种使用不同格式的 Nix store（存储）：其元数据和签名保存在 `.narinfo` 文件中，而不是保存在 `Nix database` 中。这种不同的格式简化了通过网络提供 store object（存储对象）的服务，但无法托管构建。二进制缓存的示例包括 S3 存储桶和 [NixOS 二进制缓存](https://cache.nixos.org/)。

## store path（存储路径）

文件系统中 store object（存储对象）的位置，即 Nix store 目录的直接子级。例如：

```
/nix/store/a040m110amc4h71lds2jmr8qrkj2jhxd-git-2.38.1
```

## file system object（文件系统对象）

Nix 数据模型，是对常规文件系统数据模型简化的满足 Nix 需求的最小子集。

详见： [TODO Nix 高级话题之 Store - 文件系统对象](https://nix.dev/manual/nix/2.22/store/file-system-object)。

## store object（存储对象）

组成 store（存储）集合的元素。

一个 store object（存储对象） 包含 file system object（文件系统对象），指向其他 file system object（文件系统对象）的 references（引用）

详见： [TODO Nix 高级话题之 Store - 存储对象](https://nix.dev/manual/nix/2.22/store/file-system-object)。

## IFD （Import From Derivation，从派生导入）

详见： [Import From Derivation](https://nix.dev/manual/nix/2.22/language/import-from-derivation)。

## input-addressed store object（输入寻址存储对象）

通过构建非 content-addressed derivation（内容寻址派生）、非 fixed-output derivation（固定输出派生）而生成的 store object 存储对象。

## content-addressed store object（内容寻址存储对象）

通过构建 content-addressed derivation（内容寻址派生）或  fixed-output derivation（固定输出派生）而生成的 store object 存储对象。

## substitute（替代）

substitute（替代）是存储在 Nix 数据库中的命令调用，它描述如何绕过正常的构建机制（即 derivation 派生）来构建一个 store object（存储对象）。通常，替代通过从某个服务器下载 store object（存储对象）的预构建版本来构建 store object（存储对象）。

以上来自[官方文档](https://nix.dev/manual/nix/2.22/glossary.html#gloss-substitute)，实际上，在 sqlite 表结构中，并没有看到相关字段：https://github.com/NixOS/nix/blob/2.22.1/src/libstore/unix/schema.sql 。

## substituter（替代器）

Nix 可以从额外的 store （存储）中获取 store object（存储对象） 而不是构建。通常 substituter （替代器）是二进制缓存，但任何 store（存储） 都充当substituter （替代器）。

详见： [Serving a Nix store via HTTP](https://nix.dev/manual/nix/2.22/package-management/binary-cache-substituter)。

## purity（纯）

Nix 总是假设同一个derivation（派生）在运行时总是产生相同的输出。虽然这通常无法得到保证（例如，构建者可以依赖外部输入，例如网络或系统时间），但 Nix 模型假设了这一点。

## impure derivation（不纯派生）

[一项实验性功能](https://nix.dev/manual/nix/2.22/glossary.html#./contributing/experimental-features.md#xp-feature-impure-derivations)，允许将 derivation（派生）显式标记为不纯，以便始终重新构建它们，并且它们的输出不会被后续调用重用，而是始终的 realise（实现）他们。

## Nix database（Nix 数据库）

用于跟踪 store object（存储对象）之间的引用的 SQlite 数据库。这是本地存储的实现细节。默认路径位于 /nix/var/nix/db 。

表结构详见： [github schema.sql](https://github.com/NixOS/nix/blob/2.22.1/src/libstore/unix/schema.sql) 。

## Nix expression（Nix 表达式）

1.通常，Nix expression 是软件包及其组合的高级描述。使用 Nix 部署软件需要为您的包编写 Nix 表达式。 Nix 表达式指定 derivation（派生），这些 derivation（派生）作为存储 derivation（派生）实例化到 Nix store（存储）中。然后可以 realised（实现）这些 derivation（派生）以产生输出。
2. Nix 语言在语法上的有效使用的代码片段。例如：`.nix` 文件的内容形成一个表达式。

## reference（引用）

如果到 P 的 store path（存储路径）出现在 O 的内容中，则称 store object（存储对象） O 具有对存储对象 P 的引用。

store object（存储对象）可以引用其他存储对象及其自身。从存储对象到其自身的引用称为自引用。自引用以外的引用不得形成循环。

## reachable（可达的）

如果 Q 位于 P 的引用关系的闭包中，则 store path（存储路径） Q 对另一存储路径 P 是 reachable（可达的）。

## closure（闭包）

store path （存储路径）的闭包是从该存储路径直接或间接 reachable（可达的）的存储路径的集合；也就是说，它是引用关系下路径的闭合。对于一个包来说，其 derivation（派生）的闭包相当于构建时依赖，而其输出路径的闭包相当于其运行时依赖。为了正确部署，有必要部署整个闭包，否则在运行时文件可能会丢失。命令 nix-store --query --requirements 打印出存储路径的闭包。

例如，如果 store path （存储路径） P 包含对存储路径 Q 的引用，则 Q 位于 P 的闭包中。此外，如果 Q 引用 R，则 R 也在 P 的闭包中。

```
P ---> Q ---> R
```

## output（输出）

由 derivation（派生）产生的 store object（存储对象）。详见 [derivation 函数的输出参数](https://nix.dev/manual/nix/2.22/language/derivations#attr-outputs)。

## output path （输出路径）

derivation（派生） 的 output（输出）的 store path（存储路径）。

## output closure （输出闭包）

output path （输出路径）的closure（闭包）。它仅包含输出中那些 reachable（可达的） 的内容。

## deriver （派生者）

产生 output path （输出路径）的 store derivation（存储派生）。

可以使用 [`nix-store --query`](https://nix.dev/manual/nix/2.22/command-ref/nix-store/query) 的 `--deriver` 选项来查询output path （输出路径）的 deriver （派生者）。

## validity （合法性）

A store path is valid if all store objects in its closure can be read from the store.

如果可以从 store（存储）中读取 closure（闭包）中的所有 store objects（存储对象），则 store path（存储路径）是有效的。

对于 [local store](https://nix.dev/manual/nix/2.22/store/types/local-store) 来说，这意味着：

* 在该 store （存储）中，store path（存储路径）指向的 store object（存储对象）存在。
* store path（存储路径）在 Nix database（Nix 数据库）中列为有效。
* store path（存储路径）闭包中的所有存储路径都是有效的。

## user environment（用户环境）

An automatically generated store object that consists of a set of symlinks to “active” applications, i.e., other store paths. These are generated automatically by nix-env. See profiles.

自动生成的 store object （存储对象），由一组指向“活动”应用程序的符号链接（即其他存储路径）组成。这些是由 nix-env 自动生成的。详见 [TODO Nix 高级话题之 profile](https://nix.dev/manual/nix/2.22/glossary.html#gloss-profile)。

## profile（配置集）

指向用户当前 user environment（用户环境）的符号链接，例如 `/nix/var/nix/profiles/default`。

## installable (可安装的)

可以在 Nix store （存储）中 realised （实现）的东西。

详见： [Installables 文档](https://nix.dev/manual/nix/2.22/command-ref/new-cli/nix#installables)。

## NAR （Nix 存档）

A Nix ARchive.

这是 Nix 存储中路径的序列化。它可以包含常规文件、目录和符号链接。 NAR 是使用 `nix-store --dump` 和 `nix-store --restore` 生成和解压的。

## ∅

空集符号。在配置文件历史记录的上下文中，这表示某个包不存在于配置文件的特定版本中。

## ε

epsilon 符号。在包的上下文中，这意味着版本是空的。更准确地说，派生没有版本属性。

## package（包）

* 一个软件包；文件和其他数据的集合。
* 一个 package attribute set（包属性集）。

## package attribute set（包属性集）

一个包含 `type = "derivation"` （`derivation` 是历史原因）以及其他属性的属性集，如：

* 引用包文件的属性，通常以派生输出的形式，
* 声明有关如何安装或使用包的属性，
* 其他元数据或任意属性。

## string interpolation（字符串插值）

详见：[官方文档](https://nix.dev/manual/nix/2.22/language/string-interpolation)。

## base directory（基础目录）

base directory（基础目录）是用于解决相对路径的路径。

* 对于 `.nix` 文件中的表达式，base directory（基础目录） 是包含该文件的目录。这类似于基本 URL 的目录。
* 对于使用 `--expr` 在命令行参数中编写的表达式，base directory（基础目录）是当前工作目录。

## experimental feature（实验性特性）

尚未稳定的功能由命名的实验功能标志保护。这些标志通过配置文件的 [`experimental-features`](https://nix.dev/manual/nix/2.22/command-ref/conf-file#conf-experimental-features) 设置项启用或禁用。

更多参见：[贡献指南 -实验功能的目的和生命周期](https://nix.dev/manual/nix/2.22/contributing/experimental-features)。
