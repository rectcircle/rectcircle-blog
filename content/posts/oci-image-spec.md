---
title: "OCI 镜像格式规范"
date: 2022-01-02T01:35:34+08:00
draft: false
toc: true
comments: true
tags:
  - 云原生
---

## 概览

[Image Format](https://github.com/opencontainers/image-spec) 定义了容器镜像的格式，平时讲的 Docker 镜像就是基于该标准定义打包的。该标准的具体形式表现为，镜像的文件和目录结构。目前版本为 [v1.0.2](https://opencontainers.org/release-notices/v1-0-2-image-spec/)。

## 理解 OCI Image 规范

OCI Image 规范原文追求的是严密无歧义，但对于读者来确是不易理解。本部分以符合人类对新知识认知的角度来概述 OCI Image 规范。部分内容为作者个人理解，如有错误欢迎指正。

### 观察 Nginx 镜像

通过例子入门一项新知识是比较好的方式。因此先观察一个符合 OCI 镜像标准的镜像。这里以 `nginx:1.21.6` 镜像为例。

#### 使用 skopeo 导出镜像

skopeo 是一个镜像处理工具，可以将镜像导出到符合 OCI 镜像规范的目录中。

通过如下方式编译安装 skopeo（更多参见：[官方安装文档](https://github.com/containers/skopeo/blob/main/install.md)）

```bash
sudo apt update
sudo apt install libgpgme-dev libassuan-dev libbtrfs-dev libdevmapper-dev pkg-config
git clone https://github.com/containers/skopeo $GOPATH/src/github.com/containers/skopeo
cd $GOPATH/src/github.com/containers/skopeo && make bin/skopeo
make bin/skopeo
sudo cp ./bin/skopeo /usr/local/bin
```

从公开的 docker hub 下载镜像，并以 OCI 标准镜像的格式保存到 `nginx-oci` 目录下。

```bash
skopeo --insecure-policy copy docker://nginx:1.21.6 oci:$(pwd)/nginx-oci:test1
```

#### 观察镜像布局

`cd nginx-oci`，观察镜像的目录结构。

```
.
├── blobs
│   └── sha256
│       ├── 091c283c6a66ad0edd2ab84cb10edacc00a1a7bc5277f5365c0d5c5457a75aff
│       ├── 1ae07ab881bd848493ad54c2ba32017f94d1d8dbfd0ba41b618f17e80f834a0f
│       ├── 3c1ab086329527de39b56d3ad05b2a5305217de87394aaecb1e2d54e76a76171
│       ├── 55de5851019b8f65ed6e28120c6300e35e556689d021e4b3411c7f4e90a9704b
│       ├── 5eb5b503b37671af16371272f9c5313a3e82f1d0756e14506704489ad9900803
│       ├── 78091884b7bea0fa918527207924e9993bcc21bf7f1c9687da40042ceca31ac9
│       ├── b559bad762bec166fd028483dd2a03f086d363ee827d8c98b7268112c508665a
│       └── f785f4dcb172012149aabfe31ac2bab3dce8e1e9b12b97883a02765e6e3be77a
├── index.json
└── oci-layout
```

#### `blobs` 目录

该目录存储的是镜像 manifest 文件、config 文件以及文件系统层文件。

* 该目录下的文件路径规则为：`${hash算法}/${该文件使用该算法的校验和}`，在工业界使用的一般是 `sha256/<sha256>`。
* `index.json`、manifest 文件、config 文件中的 `digest` 字段是一个引用标识符，其指向的内容就是 `blobs` 目录下和 `digest` 字段相对应的文件。

#### `oci-layout` 文件

`cat oci-layout` 镜像布局版本号，目前为 `1.0.0`。

```
{"imageLayoutVersion": "1.0.0"}
```

#### `index.json` 文件

`cat index.json` ，`index.json` 即下文原文翻译中的 [镜像索引](#镜像索引) 文件，主要包含了一个指向 Manifest 文件的引用的列表，格式化后内容为：

```json
{
    "schemaVersion": 2,
    "manifests": [
        {
            "mediaType": "application/vnd.oci.image.manifest.v1+json",
            "digest": "sha256:f785f4dcb172012149aabfe31ac2bab3dce8e1e9b12b97883a02765e6e3be77a",
            "size": 1183,
            "annotations": {
                 // 注意这个就是，在执行 skopeo 时，添加的 tag
                 // oci:$(pwd)/nginx-oci:test1
                "org.opencontainers.image.ref.name": "test1"
            }
        }
    ]
}
```

#### `manifest` 文件

从 `index.json` 文件，可以看到 `manifests` 的 `digest` 为 `sha256:f785f4dcb172012149aabfe31ac2bab3dce8e1e9b12b97883a02765e6e3be77a`，因此 `cat blobs/sha256/f785f4dcb172012149aabfe31ac2bab3dce8e1e9b12b97883a02765e6e3be77a` 即可看到 manifest 的内容。

[镜像 Manifest](#镜像-manifest) 文件，包含两个部分

1. 指向 [镜像配置](#镜像配置) 文件的引用
2. 指向 [文件系统层](#镜像层文件系统变更集) 文件的引用

格式化后内容为：

```json
{
    "schemaVersion": 2,
    "mediaType": "application/vnd.oci.image.manifest.v1+json",
    "config": {
        "mediaType": "application/vnd.oci.image.config.v1+json",
        "digest": "sha256:3c1ab086329527de39b56d3ad05b2a5305217de87394aaecb1e2d54e76a76171",
        "size": 6567
    },
    "layers": [
        {
            "mediaType": "application/vnd.oci.image.layer.v1.tar+gzip",
            "digest": "sha256:5eb5b503b37671af16371272f9c5313a3e82f1d0756e14506704489ad9900803",
            "size": 31366257
        },
        {
            "mediaType": "application/vnd.oci.image.layer.v1.tar+gzip",
            "digest": "sha256:1ae07ab881bd848493ad54c2ba32017f94d1d8dbfd0ba41b618f17e80f834a0f",
            "size": 25352768
        },
        {
            "mediaType": "application/vnd.oci.image.layer.v1.tar+gzip",
            "digest": "sha256:78091884b7bea0fa918527207924e9993bcc21bf7f1c9687da40042ceca31ac9",
            "size": 601
        },
        {
            "mediaType": "application/vnd.oci.image.layer.v1.tar+gzip",
            "digest": "sha256:091c283c6a66ad0edd2ab84cb10edacc00a1a7bc5277f5365c0d5c5457a75aff",
            "size": 893
        },
        {
            "mediaType": "application/vnd.oci.image.layer.v1.tar+gzip",
            "digest": "sha256:55de5851019b8f65ed6e28120c6300e35e556689d021e4b3411c7f4e90a9704b",
            "size": 666
        },
        {
            "mediaType": "application/vnd.oci.image.layer.v1.tar+gzip",
            "digest": "sha256:b559bad762bec166fd028483dd2a03f086d363ee827d8c98b7268112c508665a",
            "size": 1394
        }
    ]
}
```

#### 镜像配置文件

从 `manifest` 内容，可以看到 `config` 的 `digest` 为 `sha256:3c1ab086329527de39b56d3ad05b2a5305217de87394aaecb1e2d54e76a76171`，因此 `cat blobs/sha256/3c1ab086329527de39b56d3ad05b2a5305217de87394aaecb1e2d54e76a76171` 即可看到 `config` 文件的内容。

[镜像配置](#镜像配置) 文件，该文件的字段很容易理解，一般都可以和 Dockerfile 中的某一些字段对应。

格式化后内容为：

```json
{
    "created": "2022-01-26T08:58:35.041664322Z",
    "architecture": "amd64",
    "os": "linux",
    "config": {
        "ExposedPorts": {
            "80/tcp": {}
        },
        "Env": [
            "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
            "NGINX_VERSION=1.21.6",
            "NJS_VERSION=0.7.2",
            "PKG_RELEASE=1~bullseye"
        ],
        "Entrypoint": [
            "/docker-entrypoint.sh"
        ],
        "Cmd": [
            "nginx",
            "-g",
            "daemon off;"
        ],
        "Labels": {
            "maintainer": "NGINX Docker Maintainers \u003cdocker-maint@nginx.com\u003e"
        },
        "StopSignal": "SIGQUIT"
    },
    "rootfs": {
        "type": "layers",
        "diff_ids": [
            "sha256:7d0ebbe3f5d26c1b5ec4d5dbb6fe3205d7061f9735080b0162d550530328abd6",
            "sha256:9a3a6af98e18f06f2a233aa2b2374a5d83d3812e2784b0ab8db949f34cd1a7d6",
            "sha256:9a94c4a55fe4c8a5cfea7fbac1dde94c38973dbdab17a6314f0c8b35b68aba95",
            "sha256:6173b6fa63db8be9be756acf32a7beea0e8115f4e932d7de50b6071e7c55ee50",
            "sha256:235e04e3592ae74b04d0f29af65312be4c50c259b23b74698e35d42b2a4430ab",
            "sha256:762b147902c09d1860cccdaf4c5b28f5dea3760cb35c213c60ba2315950cbdaa"
        ]
    },
    "history": [
        {
            "created": "2022-01-26T01:40:35.769668496Z",
            "created_by": "/bin/sh -c #(nop) ADD file:90495c24c897ec47982e200f732f8be3109fcd791691ddffae0756898f91024f in / "
        },
        {
            "created": "2022-01-26T01:40:36.265271157Z",
            "created_by": "/bin/sh -c #(nop)  CMD [\"bash\"]",
            "empty_layer": true
        },
        {
            "created": "2022-01-26T08:57:35.353797681Z",
            "created_by": "/bin/sh -c #(nop)  LABEL maintainer=NGINX Docker Maintainers \u003cdocker-maint@nginx.com\u003e",
            "empty_layer": true
        },
        {
            "created": "2022-01-26T08:57:35.609113093Z",
            "created_by": "/bin/sh -c #(nop)  ENV NGINX_VERSION=1.21.6",
            "empty_layer": true
        },
        {
            "created": "2022-01-26T08:57:35.827389248Z",
            "created_by": "/bin/sh -c #(nop)  ENV NJS_VERSION=0.7.2",
            "empty_layer": true
        },
        {
            "created": "2022-01-26T08:57:36.065482015Z",
            "created_by": "/bin/sh -c #(nop)  ENV PKG_RELEASE=1~bullseye",
            "empty_layer": true
        },
        {
            "created": "2022-01-26T08:58:32.922897871Z",
            "created_by": "/bin/sh -c set -x     \u0026\u0026 addgroup --system --gid 101 nginx     \u0026\u0026 adduser --system --disabled-login --ingroup nginx --no-create-home --home /nonexistent --gecos \"nginx user\" --shell /bin/false --uid 101 nginx     \u0026\u0026 apt-get update     \u0026\u0026 apt-get install --no-install-recommends --no-install-suggests -y gnupg1 ca-certificates     \u0026\u0026     NGINX_GPGKEY=573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62;     found='';     for server in         hkp://keyserver.ubuntu.com:80         pgp.mit.edu     ; do         echo \"Fetching GPG key $NGINX_GPGKEY from $server\";         apt-key adv --keyserver \"$server\" --keyserver-options timeout=10 --recv-keys \"$NGINX_GPGKEY\" \u0026\u0026 found=yes \u0026\u0026 break;     done;     test -z \"$found\" \u0026\u0026 echo \u003e\u00262 \"error: failed to fetch GPG key $NGINX_GPGKEY\" \u0026\u0026 exit 1;     apt-get remove --purge --auto-remove -y gnupg1 \u0026\u0026 rm -rf /var/lib/apt/lists/*     \u0026\u0026 dpkgArch=\"$(dpkg --print-architecture)\"     \u0026\u0026 nginxPackages=\"         nginx=${NGINX_VERSION}-${PKG_RELEASE}         nginx-module-xslt=${NGINX_VERSION}-${PKG_RELEASE}         nginx-module-geoip=${NGINX_VERSION}-${PKG_RELEASE}         nginx-module-image-filter=${NGINX_VERSION}-${PKG_RELEASE}         nginx-module-njs=${NGINX_VERSION}+${NJS_VERSION}-${PKG_RELEASE}     \"     \u0026\u0026 case \"$dpkgArch\" in         amd64|arm64)             echo \"deb https://nginx.org/packages/mainline/debian/ bullseye nginx\" \u003e\u003e /etc/apt/sources.list.d/nginx.list             \u0026\u0026 apt-get update             ;;         *)             echo \"deb-src https://nginx.org/packages/mainline/debian/ bullseye nginx\" \u003e\u003e /etc/apt/sources.list.d/nginx.list                         \u0026\u0026 tempDir=\"$(mktemp -d)\"             \u0026\u0026 chmod 777 \"$tempDir\"                         \u0026\u0026 savedAptMark=\"$(apt-mark showmanual)\"                         \u0026\u0026 apt-get update             \u0026\u0026 apt-get build-dep -y $nginxPackages             \u0026\u0026 (                 cd \"$tempDir\"                 \u0026\u0026 DEB_BUILD_OPTIONS=\"nocheck parallel=$(nproc)\"                     apt-get source --compile $nginxPackages             )                         \u0026\u0026 apt-mark showmanual | xargs apt-mark auto \u003e /dev/null             \u0026\u0026 { [ -z \"$savedAptMark\" ] || apt-mark manual $savedAptMark; }                         \u0026\u0026 ls -lAFh \"$tempDir\"             \u0026\u0026 ( cd \"$tempDir\" \u0026\u0026 dpkg-scanpackages . \u003e Packages )             \u0026\u0026 grep '^Package: ' \"$tempDir/Packages\"             \u0026\u0026 echo \"deb [ trusted=yes ] file://$tempDir ./\" \u003e /etc/apt/sources.list.d/temp.list             \u0026\u0026 apt-get -o Acquire::GzipIndexes=false update             ;;     esac         \u0026\u0026 apt-get install --no-install-recommends --no-install-suggests -y                         $nginxPackages                         gettext-base                         curl     \u0026\u0026 apt-get remove --purge --auto-remove -y \u0026\u0026 rm -rf /var/lib/apt/lists/* /etc/apt/sources.list.d/nginx.list         \u0026\u0026 if [ -n \"$tempDir\" ]; then         apt-get purge -y --auto-remove         \u0026\u0026 rm -rf \"$tempDir\" /etc/apt/sources.list.d/temp.list;     fi     \u0026\u0026 ln -sf /dev/stdout /var/log/nginx/access.log     \u0026\u0026 ln -sf /dev/stderr /var/log/nginx/error.log     \u0026\u0026 mkdir /docker-entrypoint.d"
        },
        {
            "created": "2022-01-26T08:58:33.350372757Z",
            "created_by": "/bin/sh -c #(nop) COPY file:65504f71f5855ca017fb64d502ce873a31b2e0decd75297a8fb0a287f97acf92 in / "
        },
        {
            "created": "2022-01-26T08:58:33.610126307Z",
            "created_by": "/bin/sh -c #(nop) COPY file:0b866ff3fc1ef5b03c4e6c8c513ae014f691fb05d530257dfffd07035c1b75da in /docker-entrypoint.d "
        },
        {
            "created": "2022-01-26T08:58:33.859413094Z",
            "created_by": "/bin/sh -c #(nop) COPY file:0fd5fca330dcd6a7de297435e32af634f29f7132ed0550d342cad9fd20158258 in /docker-entrypoint.d "
        },
        {
            "created": "2022-01-26T08:58:34.141005346Z",
            "created_by": "/bin/sh -c #(nop) COPY file:09a214a3e07c919af2fb2d7c749ccbc446b8c10eb217366e5a65640ee9edcc25 in /docker-entrypoint.d "
        },
        {
            "created": "2022-01-26T08:58:34.342239735Z",
            "created_by": "/bin/sh -c #(nop)  ENTRYPOINT [\"/docker-entrypoint.sh\"]",
            "empty_layer": true
        },
        {
            "created": "2022-01-26T08:58:34.562322806Z",
            "created_by": "/bin/sh -c #(nop)  EXPOSE 80",
            "empty_layer": true
        },
        {
            "created": "2022-01-26T08:58:34.813995669Z",
            "created_by": "/bin/sh -c #(nop)  STOPSIGNAL SIGQUIT",
            "empty_layer": true
        },
        {
            "created": "2022-01-26T08:58:35.041664322Z",
            "created_by": "/bin/sh -c #(nop)  CMD [\"nginx\" \"-g\" \"daemon off;\"]",
            "empty_layer": true
        }
    ]
}
```

#### 文件系统层文件

从 `manifest` 内容，可以看到 `layers` 字段是个数组包含多个 `layer`，观察下第一个 `layer`，可以看出：

* 其 `digest` 为 `sha256:5eb5b503b37671af16371272f9c5313a3e82f1d0756e14506704489ad9900803`，所以对应的文件位置为 `blobs/sha256/5eb5b503b37671af16371272f9c5313a3e82f1d0756e14506704489ad9900803`
* 其 `mediaType` 为 `application/vnd.oci.image.layer.v1.tar+gzip` 看出该文件的格式为 `tar.gz`

解压此文件

```bash
mkdir layer0
tar -xzvf blobs/sha256/5eb5b503b37671af16371272f9c5313a3e82f1d0756e14506704489ad9900803 -C layer0
```

执行 `tree -L 1 layer0` 观察下内容

```
layer0
├── bin
├── boot
├── dev
├── etc
├── home
├── lib
├── lib64
├── media
├── mnt
├── opt
├── proc
├── root
├── run
├── sbin
├── srv
├── sys
├── tmp
├── usr
└── var
```

### Image 规范解决什么了问题

镜像作为云原生生态的核心底层基座技术，标准化以解决兼容问题。

镜像规范需要需要解决如下：

* 如何支持各种平台（操作系统和硬件架构）？
    * 为每种平台构建专门的镜像，并通过[镜像索引](#镜像索引)文件存储
* 镜像的内容如何组织如何存储，做到共享镜像的相同部分以少空间占用？
    * [文件系统层](#镜像层文件系统变更集)以及文件系统层可以做到
* 镜像的内容和配置的标识符如何生成，如何寻址？
    * 通过[可寻址存储机制](#内容描述符)（即对存储的内容进行摘要得到的 hash 值）
* 支持给镜像打标签，以标识镜像的版本等信息？
    * 通过[镜像索引](#镜像索引)文件的 `manifests[].annotations["org.opencontainers.image.ref.name"]` [注解](#注解)字段实现
* 镜像有关运行时的配置信息（如 Cmd、Entrypoint）如何存储？
    * 通过[镜像配置](#镜像配置)文件存储实现
* 某个特定平台的一个镜像的配置和内容如何描述？
    * 通过[镜像 Manifest](#镜像-Manifest) 文件解决
* 一套镜像（一个或多个支持多个平台的某个镜像，逻辑上属于一个镜像，但是不同的平台内容可能是不同的）的各个组成部分中如何组织？
    * 通过定义一套[镜像布局](#镜像布局)规范解决。
* 镜像配置如何转换为容器运行时的配置？
    * 通过定义[转换到 OCI 运行时配置](#转换到-oci-运行时配置) 规范解决

镜像规范不涉及的问题：

* 镜像如何分发（DockerHub）？
    * 由 [OCI Distribution Spec](https://github.com/opencontainers/distribution-spec) 专门来解决此问题，镜像规范的[媒体类型](#媒体类型)的定义以及[可寻址存储机制](#内容描述符)与此也有一定关系。
* 容器的文件系统和配置的具体是怎样的？
    * 由 [OCI Runtime Spec](https://github.com/opencontainers/runtime-spec) 专门来解决此问题，镜像规范的[转换到 OCI 运行时配置](#转换到-oci-运行时配置)与此有一定关系。
* 如何在本地存储管理镜像？
    * 该部分有各个中实现决定

### Image 组成部分

镜像的入口是：一个叫做 [镜像 Manifest](#镜像-manifest) 的JSON 格式文件，包含指向元数据（配置）和文件系统（内容）的引用（或者叫描述符/标识符）。

![image](/image/oci/media-types.png)

注意：如果某个镜像需要支持多种不同的平台（操作系统 & 指令集），则在 [镜像 Manifest](#镜像-manifest) 之上还有一个 [镜像索引](#镜像索引) 的JSON 格式文件，该文件其包含该镜像的支持所有平台的 [镜像 Manifest](#镜像-manifest) 列表。

#### 元数据（配置）

[镜像配置](#镜像配置) （JSON 格式文件）：

* 描述性信息，如：创建时间、作者、架构、操作系统等
* 运行时配置，如：运行的用户、工作目录等
* 根文件系统各层的对应的 tar 包（未压缩）的 hash 值（或者称为：标识符/描述符/校验和），用于校验文件系统。
* 镜像构建的历史

#### 文件系统（内容）

[文件系统层](#镜像层文件系统变更集)

一个完整的文件系统可以理解为操作系统的根目录即 `/`，因此又被称为根文件系统。

因此对文件系统存储，最简单的做法就是：将整个文件系统（根目录 `/`）打成一个 tar 包。这么做存在浪费存储空间的问题：

* 镜像和镜像之间一般都是存在继承关系的。如果直接存储，会存在大量的冗余
* 直接使用 tar 不压缩的话会占用大量存储空间。

因此本规范对文件系统存储做了如下改进：

* 将文件系统进行分层存储，每个层称为文件系统层（对应 Dockerfile 的大多数语句都会产生一个层）。
* 每一层仍使用 tar 进行打包，并可以通过 gzip 等压缩工具进行压缩。

这样，文件系统由多个文件系统层组成，每个层的内容的就仅仅是当前层文件系统和上一层文件系统的 diff 的内容。具体参见：[文件系统层](#镜像层文件系统变更集)

### 文件定位和类型

从上文可以看出，在本规范中，不管是镜像的内容还是配置都以文件的方式存在的。

因此镜像规范对这些文件的类型进行了定义，称为[媒体类型](#媒体类型) （MIME 格式）。

此外从上文可以看出，这些文件是存在相互引用的，如 [镜像 Manifest](#镜像-manifest) 引用了 [镜像配置](#镜像配置) 和 [文件系统层](#镜像层文件系统变更集)。

因此在镜像规范中，通过[内容描述符](#内容描述符)来表示这些内容。内容描述符简单来说就是文件的摘要值（如 SHA256 算法），利用摘要值的特性（同样的文件摘要值相同），有如下好处：

* 同样的文件只需要存储一份
* 文件内容可以重新导出摘要

内容摘要做为内容的标识符时，需要保证文件的内容是是稳定，这里的稳定指的是，两个不同的文件想表示的内容是一致的情况下，这两个文件逐字节比较应该是相等的（完全一致）。而从上文可以看出，一个镜像由多个文件组成，文件的内容有如下可能：

* tar
* tar.gz
* json

因此这就要求：

* tar: 打包相同的文件时，结构内容应该是相同的（按照一定的排序规则、避免在文件中存储时间当前相关的内容），规范推荐使用 [vbatts/tar-split](https://github.com/vbatts/tar-split)
* tar.gz: 要求压缩过程总不记录时间相关信息，规范没有提及相关工具
* json: 字段按照一定的规则排序，不添加空白字符，规范推荐 [github.com/docker/go](https://github.com/docker/go/)，实现的 [规范 JSON](http://wiki.laptop.org/go/Canonical_JSON)。

### rootfs.diff_ids vs layers

manifest layer 的 digest 和 config 的 diff_ids 有可能不一样。比如这里的 layer 文件格式是 `tar+gzip`，那么这里的 sha256 就是 `tar+gzip` 包的 `sha256`，而 `diff_ids` 是 `tar+gzip` 解压后 `tar` 文件的 sha256。

此外，layers 和 diff_ids 长度相等，一一对应，且数组的顺序和层应用的顺序一致（作者猜测）。

看起来有些重复，diff_ids 存在的目的（作者猜测）：试想将一个 layers 构建成 rootfs 文件系统的过程：首先会解压这些层为一个个目录，这些目录的目录名按照规范来说，就是目录的 sha256。但是 layer 的 sha256 是压缩文件（`tar.gz`），如果作为目录名就不合适。而一个目录的 sha256 可以理解为未压缩的归档文件 (`tar`) 的 sha256。此时就可以用到 diff_ids 中的 sha256 了，避免了一次多余的 sha256。另外，在比较严格场景下，可以用 `diff_ids` 对 layers 进行校验。

验证 manifest layer 的 digest，以 `sha256:5eb5b503b37671af16371272f9c5313a3e82f1d0756e14506704489ad9900803` 为例。

```bash
$ shasum -a 256 blobs/sha256/5eb5b503b37671af16371272f9c5313a3e82f1d0756e14506704489ad9900803
5eb5b503b37671af16371272f9c5313a3e82f1d0756e14506704489ad9900803  blobs/sha256/5eb5b503b37671af16371272f9c5313a3e82f1d0756e14506704489ad9900803
```

验证 manifest layer 对应的 diff_ids 是一致的 digest，例子为：
* layer `sha256:5eb5b503b37671af16371272f9c5313a3e82f1d0756e14506704489ad9900803`
* diff_ids `sha256:7d0ebbe3f5d26c1b5ec4d5dbb6fe3205d7061f9735080b0162d550530328abd6`

```bash
$ gzip -d < blobs/sha256/5eb5b503b37671af16371272f9c5313a3e82f1d0756e14506704489ad9900803 > test.tar
$ shasum -a 256 test.tar

7d0ebbe3f5d26c1b5ec4d5dbb6fe3205d7061f9735080b0162d550530328abd6  test.tar
```

### OCI Image 和 Docker 存储驱动关系

OCI Image 规范虽然定义了[镜像布局](#镜像布局)，但是这个镜像布局应该仅仅用于单个或者一组镜像的迁移（作者猜测）。Docker、Podman 等实现，可以自己决定如何组织镜像以及存储镜像的内容。

在 Docker 中，镜像通过 storage drivers 来统一存储镜像和容器。更多参见：[Docker Storage Driver](https://docs.docker.com/storage/storagedriver/) （通过 `docker info | grep 'Storage Driver'` 可以查看当前 docker 使用的驱动）

CoW 类的存储引擎存储在如下问题：第一次读写镜像层的文件比本机文件[慢](https://docs.docker.com/storage/storagedriver/overlayfs-driver/#modifying-files-or-directories)（比如递归 `chmod` 包含众多小文件的目录会非常慢，因为涉及到对层次文件系统镜像层的搜索和复制），目前 Docker 的驱动是：Overlay2，更多参见： [Docker存储驱动—Overlay/Overlay2「译」](https://arkingc.github.io/2017/05/05/2017-05-05-docker-filesystem-overlay/)）

## 实战

### 基于一个镜像手动构建一个新镜像

通过手动更改 OCI 镜像目录文件的方式，给 OCI 镜像的末尾添加新的一层。目标是给 debian:10 镜像根目录添加一个文件 `/test`，内容为 `test`。

#### 操作

概述：

* 使用 skopeo 以 OCI 布局的方式下载 debian:10 到一个目录
* 创建 test 文件，并使用
    * tar 命令构建一个 tar 包
    * gzip 命令创建一个 tar.gz 包
    * shasum 计算 tar 和 tar.gz 的 sha256
    * ws 统计 tar.gz 的字节数
* 拷贝 blobs
    * 将 tar.gz 拷贝到 `./blobs/sha256/` 目录中文件名为其 sha256
* 更改并重命名 Config 文件
    * 更改 Config 文件，在 rootfs.diff_ids 字段末尾添加 tar 包的 sha256
    * 更改 Config 文件，在 history 字段末尾添加说明
    * shasum 重新计算 Config 文件 sha256 并重命名，ws 重新统计 Config 的字节数
* 更改并重命名 Manifest 文件
    * 更改 Manifest 文件，在 layers 字段末尾添加该层
    * 更改 Manifest 文件的 config.digest 和 config.size 为上一步得到的内容
    * shasum 重新计算 Manifest 文件 sha256 并重命名，ws 重新统计 Manifest 的字节数
* 更改 index.json 中 Manifest 的 digest 和 size

即

```bash
skopeo --insecure-policy copy docker://debian:10 oci:$(pwd)/debian:10
skopeo --insecure-policy inspect oci:$(pwd)/debian

echo 'test' > test && tar -cvf test.tar test && rm -rf test
# tar 包
shasum -a 256 test.tar
# 输出 79bc992e2a3522971739b49f7447c5c2bd3e3e0bf3aaf4d1665a061d21fae227  test.tar

# tar.gz 包
gzip -c < test.tar > test.tar.gz
shasum -a 256 test.tar.gz
# 输出 ca76799e31911cd42039323215265e5542c5921777837ca08ae625d5f629d45b  test.tar.gz
wc -c test.tar.gz
# 输出 125 test.tar.gz

# tar.gz 拷贝到 blobs 中
cp test.tar.gz debian/blobs/sha256/ca76799e31911cd42039323215265e5542c5921777837ca08ae625d5f629d45b

# 修改 Manifest，的 layers 添加 ,{"mediaType":"application/vnd.oci.image.layer.v1.tar+gzip","digest":"sha256:ca76799e31911cd42039323215265e5542c5921777837ca08ae625d5f629d45b","size":125}
vim debian/blobs/sha256/96452e7eda6806d94705a8886614f77e594226850339f01f078e61b1cb193aa7

# 修改 Config，rootfs.diff_ids 添加 ,"sha256:79bc992e2a3522971739b49f7447c5c2bd3e3e0bf3aaf4d1665a061d21fae227"
# 修改 Config，history 添加 ,{"created":"2022-02-05T12:24:47.914021193Z","created_by":"/bin/sh -c #(nop)  manual add /test file","empty_layer":false}
vim debian/blobs/sha256/7a66498b7b706ee180f1d3e2c55c5c0ffbe94aa1a9676784d956d4f2bbed4708
# 计算 Config 文件 sha256
shasum -a 256 debian/blobs/sha256/7a66498b7b706ee180f1d3e2c55c5c0ffbe94aa1a9676784d956d4f2bbed4708
# 输出 a8690a78868d28aa9c8aea0fa5a6737df7f741da6b00da743d4c29b07ac36a3f  debian/blobs/sha256/7a66498b7b706ee180f1d3e2c55c5c0ffbe94aa1a9676784d956d4f2bbed4708
# 重命名
mv debian/blobs/sha256/7a66498b7b706ee180f1d3e2c55c5c0ffbe94aa1a9676784d956d4f2bbed4708 debian/blobs/sha256/a8690a78868d28aa9c8aea0fa5a6737df7f741da6b00da743d4c29b07ac36a3f
# 计算尺寸
wc -c debian/blobs/sha256/a8690a78868d28aa9c8aea0fa5a6737df7f741da6b00da743d4c29b07ac36a3f
# 输出 775 debian/blobs/sha256/a8690a78868d28aa9c8aea0fa5a6737df7f741da6b00da743d4c29b07ac36a3f

# 修改 Manifest 的 layers 添加 ,{"mediaType":"application/vnd.oci.image.layer.v1.tar+gzip","digest":"sha256:ca76799e31911cd42039323215265e5542c5921777837ca08ae625d5f629d45b","size":125}
# 修改 Manifest 的 config.digest 为 sha256:a8690a78868d28aa9c8aea0fa5a6737df7f741da6b00da743d4c29b07ac36a3f
# 修改 Manifest 的 config.size 为 775
vim debian/blobs/sha256/96452e7eda6806d94705a8886614f77e594226850339f01f078e61b1cb193aa7
# 计算 Manifest 文件 sha256
shasum -a 256 debian/blobs/sha256/96452e7eda6806d94705a8886614f77e594226850339f01f078e61b1cb193aa7
# 输出 a167596582b29afeaecf45bdc43881c7cb659cbdc15ffdc201ab7850c5568d99  debian/blobs/sha256/96452e7eda6806d94705a8886614f77e594226850339f01f078e61b1cb193aa7
# 重命名
mv debian/blobs/sha256/96452e7eda6806d94705a8886614f77e594226850339f01f078e61b1cb193aa7 debian/blobs/sha256/a167596582b29afeaecf45bdc43881c7cb659cbdc15ffdc201ab7850c5568d99
# 计算 Manifest 文件尺寸
wc -c debian/blobs/sha256/a167596582b29afeaecf45bdc43881c7cb659cbdc15ffdc201ab7850c5568d99
# 输出 561 debian/blobs/sha256/a167596582b29afeaecf45bdc43881c7cb659cbdc15ffdc201ab7850c5568d99

# 更改 index.json 中 Manifest 的 digest 和 size 分别为 sha256:a167596582b29afeaecf45bdc43881c7cb659cbdc15ffdc201ab7850c5568d99 和 561
vim debian/index.json
```

#### 验证

使用 skopeo 检查修改后的镜像信息（`skopeoskopeo --insecure-policy inspect oci:$(pwd)/debian`），输出为

```json
{
    "Digest": "sha256:96452e7eda6806d94705a8886614f77e594226850339f01f078e61b1cb193aa7",
    "RepoTags": [],
    "Created": "2022-01-26T01:40:47.914021193Z",
    "DockerVersion": "",
    "Labels": null,
    "Architecture": "amd64",
    "Os": "linux",
    "Layers": [
        "sha256:a024302f8a017855dd20a107ace079dd543c4bdfa8e7c11472771babbe298d2b"
    ],
    "Env": [
        "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
    ]
}
```

导入 docker 中

```bash
skopeo  --insecure-policy copy oci:$(pwd)/debian docker-daemon:debian-add-test:latest
```

查看导入的镜像 `docker images debian-add-test`，输出如下：

```
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
debian-add-test     latest              a8690a78868d        10 days ago         114MB
```

运行该镜像，查看 /test 文件存在

```bash
$ docker run -u root -it --entrypoint bash debian-add-test:latest  
root@a26dcc05ba35:/# cat test 
test
```

观察这两个镜像的层，手动改造的镜像共享了 `debian:10` 这一层

```bash
$ docker image inspect --format "{{json .RootFS.Layers}}" debian:10 debian-add-test:latest
["sha256:b14cb48b3aebbc58396d0b3c2d0880fd9c002c56bb7453af3ddfe6e119c06df2"]
["sha256:b14cb48b3aebbc58396d0b3c2d0880fd9c002c56bb7453af3ddfe6e119c06df2","sha256:79bc992e2a3522971739b49f7447c5c2bd3e3e0bf3aaf4d1665a061d21fae227"]
```

### 尝试利用分层文件系统提高时间和空间效率

假设我们有很多个镜像，都依赖同一个软件包（文件内容完全相同）层，检验什么时候会共享？

* 这个软件包层构成的层，在 OCI 规范层面是否是同样一个东西
    * 结论：是  
* 这个软件包层构成的层，在 DockerHub 存储上存储几份
    * 结论：存一份
* Docker Pull 这样的多个镜像到本地后，这个软件包是存储一份还是多份，还需要下载吗？结论分情况讨论：
    * 这个软件包层构成的层以及之前的层完全一样，则只存一份
    * 否则，仍然会存多份

#### 操作

假设有两个 Dockerfile，都是基于 `debian:10`，需要构建两个镜像，

* 镜像 debian-test-1，基于 `debian:10` 按顺序添加两层，分别为
    * 添加 `/a` 文件内容为 `a`
    * 添加 `/b` 文件内容为 `b`
* 镜像 debian-test-2，基于 `debian:10` 按顺序添加三层，分别为
    * 添加 `/c` 文件内容为 `c`
    * 添加 `/b` 文件内容为 `b`
    * 添加 `/a` 文件内容为 `a`

构建两个镜像时的 a、b 文件需保证修改时间一致，使用 [COPY](https://yeasy.gitbook.io/docker_practice/image/dockerfile/copy) 命令添加文件（可以保证文件的修改时间保留）。

```bash
echo a > a
echo b > b
echo c > c
echo 'FROM debian:10' > debian-test-1.Dockerfile
echo 'COPY ./a /a' >> debian-test-1.Dockerfile
echo 'COPY ./b /b' >> debian-test-1.Dockerfile

echo 'FROM debian:10' > debian-test-2.Dockerfile
echo 'COPY ./c /c' >> debian-test-2.Dockerfile
echo 'COPY ./b /b' >> debian-test-2.Dockerfile
echo 'COPY ./a /a' >> debian-test-2.Dockerfile
```

构建镜像

```bash
$ docker build . -t debian-test-1  -f debian-test-1.Dockerfile
Sending build context to Docker daemon  6.144kB
Step 1/3 : FROM debian:10
 ---> f66b71803fa0
Step 2/3 : COPY ./a /a
 ---> ba52439e84d5
Step 3/3 : COPY ./b /b
 ---> c1ec247c1970
Successfully built c1ec247c1970
Successfully tagged debian-test-1:latest

$ docker build . -t debian-test-2  -f debian-test-2.Dockerfile
Sending build context to Docker daemon  6.144kB
Step 1/4 : FROM debian:10
 ---> f66b71803fa0
Step 2/4 : COPY ./c /c
 ---> 031e90de101e
Step 3/4 : COPY ./b /b
 ---> bd87fa42a36a
Step 4/4 : COPY ./a /a
 ---> 7960f0dbc171
Successfully built 7960f0dbc171
Successfully tagged debian-test-2:latest
```

#### 观察镜像层

```bash
$ docker image inspect --format "{{json .RootFS.Layers}}" debian-test-1:latest debian-test-2:latest
["sha256:b14cb48b3aebbc58396d0b3c2d0880fd9c002c56bb7453af3ddfe6e119c06df2","sha256:19840e8fc4aaf4dda2dee6222b4d898580a8bcfcb0d3d1b56bfabe15e069aa7f","sha256:87e2618117301e71d0b159d190ade4d4b1c17054e02d925629f902de210ae3fe"]
["sha256:b14cb48b3aebbc58396d0b3c2d0880fd9c002c56bb7453af3ddfe6e119c06df2","sha256:a9ad1c3056bda459dde5bdd84b0493579801fdd06923701e9a9ec6956e5adb05","sha256:87e2618117301e71d0b159d190ade4d4b1c17054e02d925629f902de210ae3fe","sha256:19840e8fc4aaf4dda2dee6222b4d898580a8bcfcb0d3d1b56bfabe15e069aa7f"]
```

可以看出，两个镜像，添加 copy a 文件以及 copy b 文件的层的标识符都为：

* `sha256:19840e8fc4aaf4dda2dee6222b4d898580a8bcfcb0d3d1b56bfabe15e069aa7f`
* `sha256:87e2618117301e71d0b159d190ade4d4b1c17054e02d925629f902de210ae3fe`

这两个层在两个镜像中，进行了共享。

#### 观察 Docker 镜像存储图

（存储驱动为：overlay2）

```bash
docker image inspect --format "{{json .GraphDriver.Data}}" debian-test-1:latest debian-test-2:latest
{"LowerDir":"/data00/docker/overlay2/6ae962c93e0d8835ec15c6655b8b2df7e903d3db888c5e43a0ceb02b59e30fe0/diff:/data00/docker/overlay2/4fe096c15e0b13963a5ca43f0a9ec876379e4ffd73ae851710ef20f5b294bdef/diff","MergedDir":"/data00/docker/overlay2/9454cb3ce328b9dca22398d1092a60f5b23f6a29a6971a4e8c55d5f6aeade351/merged","UpperDir":"/data00/docker/overlay2/9454cb3ce328b9dca22398d1092a60f5b23f6a29a6971a4e8c55d5f6aeade351/diff","WorkDir":"/data00/docker/overlay2/9454cb3ce328b9dca22398d1092a60f5b23f6a29a6971a4e8c55d5f6aeade351/work"}
{"LowerDir":"/data00/docker/overlay2/b790f8dfa4a8a1fe607c3e27f0448117d81618a72d8fae2742ac55d749ab4818/diff:/data00/docker/overlay2/0da97c5204dbaf1616d25183f2eaf6cc4d294e50a15aeca455addb4c39d64cac/diff:/data00/docker/overlay2/4fe096c15e0b13963a5ca43f0a9ec876379e4ffd73ae851710ef20f5b294bdef/diff","MergedDir":"/data00/docker/overlay2/0c65b2ec627a8a35819103cd0237fc644ee1f7d4f7dba6051011314cd828813c/merged","UpperDir":"/data00/docker/overlay2/0c65b2ec627a8a35819103cd0237fc644ee1f7d4f7dba6051011314cd828813c/diff","WorkDir":"/data00/docker/overlay2/0c65b2ec627a8a35819103cd0237fc644ee1f7d4f7dba6051011314cd828813c/work"}
```

可以发现，都不相同

#### 观察是否可以免于下载

（存储驱动为：overlay2）

* [搭建一个本地私有镜像仓库](https://docs.docker.com/registry/deploying/#run-a-local-registry)
* 将两个镜像上传到镜像仓库中
* 彻底清理本地镜像
* 先 pull debian-test-2
* 再 pull debian-test-1，观察是否有下载过程
* [清理私有镜像仓库](https://docs.docker.com/registry/deploying/#stop-a-local-registry)

```bash
# 搭建一个本地私有镜像仓库
docker run -d -p 5000:5000 --restart=always --name registry registry:2

# 将两个镜像上传到镜像仓库中
docker tag debian-test-2 localhost:5000/debian-test-2
docker push localhost:5000/debian-test-2
docker tag debian-test-1 localhost:5000/debian-test-1
docker push localhost:5000/debian-test-1 # 可以发现没有上传过程了，因为所有层，在 debian-test-2 中都存在了

# 彻底清理本地镜像
docker image remove debian-test-2 debian-test-1 debian:10 localhost:5000/debian-test-2 localhost:5000/debian-test-1

# pull debian-test-2
docker pull localhost:5000/debian-test-2 > test2.log && cat test2.log
# 输出为：
# Using default tag: latest
# latest: Pulling from debian-test-2
# a024302f8a01: Already exists
# 50c71f18192a: Pulling fs layer
# 44bed4909bf5: Pulling fs layer
# 100a67ecf9c3: Pulling fs layer
# 50c71f18192a: Verifying Checksum
# 50c71f18192a: Download complete
# 44bed4909bf5: Verifying Checksum
# 44bed4909bf5: Download complete
# 100a67ecf9c3: Download complete
# 50c71f18192a: Pull complete
# 44bed4909bf5: Pull complete
# 100a67ecf9c3: Pull complete
# Digest: sha256:3a024c871ac137c92e18faf10a5aa3115f71cd3987855b2560b40c807bd74d6c
# Status: Downloaded newer image for localhost:5000/debian-test-2:latest
# localhost:5000/debian-test-2:latest

docker pull localhost:5000/debian-test-1 > test1.log && cat test1.log
# 输出为：
# Using default tag: latest
# latest: Pulling from debian-test-1
# a024302f8a01: Already exists
# 100a67ecf9c3: Pulling fs layer
# 44bed4909bf5: Pulling fs layer
# 100a67ecf9c3: Verifying Checksum
# 100a67ecf9c3: Download complete
# 44bed4909bf5: Verifying Checksum
# 44bed4909bf5: Download complete
# 100a67ecf9c3: Pull complete
# 44bed4909bf5: Pull complete
# Digest: sha256:4b0d097b5c51309e06a02fd506f6e2ef0f456106cc12846b7e87a706e39af0ee
# Status: Downloaded newer image for localhost:5000/debian-test-1:latest
# localhost:5000/debian-test-1:latest

# 清理私有镜像仓库
docker container stop registry && docker container rm -v registry
```

可以看出，两个镜像仅仅共享了 debian:10 这一层。对于其他层，虽然层的内容以及标识符都是相同的，但是还是需要需要重新下载的。

#### 结论

* OCI 镜像规范的文件系统层本质上是一个图（整体来看可以有环，单个镜像来看是个链表），因此在 DockerHub 层面，可以只存储 debian:10、a、b、c 这四层
* Docker 文件系统是一个树状结构，因此需要存储：
    * debian:10 （镜像 1、2 共享）
    * a -> debian:10 （镜像 1）
    * b -> a （镜像 1）
    * c -> debian:10 （镜像 2）
    * b -> a （镜像 2）
    * c -> b （镜像 2）

![image](/image/oci/oci-image-spec-combat2.png)

因此，想使用这种技巧，使用缓存加速镜像下载，并减少镜像空间占用，是不现实的。

关于 Docker 的详细存储原理，参见博客：[深入浅出容器镜像的一生🤔](https://blog.k8s.li/Exploring-container-image.html)

## 原文翻译

> 原文参见：[Github](https://github.com/opencontainers/image-spec/tree/v1.0.2)

### Spec

> [原文链接](https://github.com/opencontainers/image-spec/blob/v1.0.2/spec.md)
>
> 译者注：该部分是整篇规范的目录和概述

#### 介绍

该规范定义了由一个 manifest、镜像索引（可选）、 镜像层文件系统变更集 和 配置 组成的 OCI 镜像。

本规范的目标是创建一个可互操作的，用于构建、传输和准备要运行的容器镜像的工具。

#### 符号约定

关键词 "MUST" （必须）, "MUST NOT" （禁止）, "REQUIRED" （必要的）, "SHALL" （没有对应词）, "SHALL NOT"（没有对应词）, "SHOULD"（应该）, "SHOULD NOT"（不应该）, "RECOMMENDED" （建议）, "NOT RECOMMENDED" （不建议）, "MAY" （可能）, "OPTIONAL" （可选的） 将按照 [RFC 2119](http://tools.ietf.org/html/rfc2119) 中的描述进行解释。（参见：[RFC2119：表示要求的动词](http://www.ruanyifeng.com/blog/2007/03/rfc2119.html)）

#### 概览

站在高层级来看。镜像 Manifest 包含镜像内容和依赖的元数据，这些元数据主要包括一个或多个指向 filesystem layer 变更集的归档文件（其将被解包以构成最终可运行的文件系统）的可寻址标识符 （译者注：以及一个指向 Image 配置 的可寻址标识符）。Image 配置 包括应用参数、环境变量等信息。镜像索引 （译者注：可选的）是一个更高级别的 manifest，它主要包含一个，指向 manifest 的描述符的列表。通常情况下，镜像索引 可以提供的是操作系统或者硬件架构不同导致的镜像的不同实现（译者注：即为不同的平台定义不同的镜像）

> 译者注：
> * 可寻址表示符和描述符在本文中是同一事物，表示可以定位到内容的唯一标识符，这个标识符由内容本身的 hash 决定。
> * 这一段看不懂实属正常，可以先看下文，回头再来看这段总结。

![image](/image/oci/build-diagram.png)

构建好 OCI 镜像后，就可以通过名称来发现、下载、通过哈希验证、通过签名信任,，并解压到 OCI 运行时包中。

![image](/image/oci/run-diagram.png)

##### 理解这个标准

OCI Image 媒体类型 文档是理解规范整体结构的起点。

该规范的顶层组件包括：

* 镜像 Manifest - 描述构成容器镜像的组件
* 镜像索引 - 一个注解的 镜像 Manifest 的索引
* Image Layout - 描述一个镜像在文件系统中的布局情况
* Filesystem Layer - 描述容器文件系统的变更集
* Image 配置 - 转换为运行时 bundle 的镜像的层排序和配置
* Conversion - 转换应该如何发生
* Descriptor - 被引用内容的类型、元数据和内容地址的引用

本规范的未来版本可能包括以下可选功能：

* 基于签名镜像内容地址的签名
* 基于 DNS 联合且可委托的命名

### 媒体类型

> [原文链接](https://github.com/opencontainers/image-spec/blob/main/media-types.md)
>
> 译者注：媒体类型定义了一个组成一个镜像的各种文件的具体类型标识和文件格式

以下 媒体类型 标识此处描述的格式及其参考文档的链接：

* `application/vnd.oci.descriptor.v1+json`: [内容描述符](/opencontainers/image-spec/blob/v1.0.2/descriptor.md)
* `application/vnd.oci.layout.header.v1+json`: [OCI Layout file](/opencontainers/image-spec/blob/v1.0.2/image-layout.md#oci-layout-file) 声明使用的规范版本
* `application/vnd.oci.image.index.v1+json`: [镜像索引](/opencontainers/image-spec/blob/v1.0.2/image-index.md)
* `application/vnd.oci.image.manifest.v1+json`: [镜像 Manifest](/opencontainers/image-spec/blob/v1.0.2/manifest.md#image-manifest)
* `application/vnd.oci.image.config.v1+json`: [Image config](/opencontainers/image-spec/blob/v1.0.2/config.md)
* `application/vnd.oci.image.layer.v1.tar`: [tar 归档格式的 "Layer"](/opencontainers/image-spec/blob/v1.0.2/layer.md)
* `application/vnd.oci.image.layer.v1.tar+gzip`: [tar 归档格式的 "Layer"](/opencontainers/image-spec/blob/v1.0.2/layer.md#gzip-media-types) 并使用 [gzip](https://tools.ietf.org/html/rfc1952) 进行压缩
* `application/vnd.oci.image.layer.nondistributable.v1.tar`: [具有分发限制的 tar 归档的 "Layer"](/opencontainers/image-spec/blob/v1.0.2/layer.md#non-distributable-layers)
* `application/vnd.oci.image.layer.nondistributable.v1.tar+gzip`: [具有分发限制的 tar 归档的 "Layer"](/opencontainers/image-spec/blob/v1.0.2/layer.md#gzip-media-types) 并使用 [gzip](https://tools.ietf.org/html/rfc1952) 进行压缩

#### Media Type 冲突

该部分，主要描述了如果 HTTP 返回的 `Content-Type` 和真正的返回值不一致或者缺失应该如何处理。具体参见：[原文](https://github.com/opencontainers/image-spec/blob/v1.0.2/media-types.md#media-type-conflicts)

#### 兼容性 Matrix

该部分，主要描述了该规范和 Docker 实现的一些不同点。具体参见：[原文](https://github.com/opencontainers/image-spec/blob/v1.0.2/media-types.md#compatibility-matrix)

#### 关系

下图显示了上述 媒体类型 如何相互引用：

![image](/image/oci/media-types.png)

所有引用的引用都是通过描述符方式实现的。镜像索引 是一个 "fat manifest" ，其引用了每个目标平台的 镜像 Manifest 列表。一个 镜像 Manifest 引用一个 配置，一个或多个 Layers。

### 内容描述符

> [原文链接](https://github.com/opencontainers/image-spec/blob/v1.0.2/descriptor.md)
>
> 译者注：内容描述符定义了一个镜像中各个部分内容的标识符如何生成，如何引用，如何查找

* OCI 镜像由几个不同的组件组成，这些组件组成一个[有向无环图 (DAG)](https://en.wikipedia.org/wiki/Merkle_tree)。
* 图中组件之间的引用通过内容描述符表示。
* 内容描述符（或简称为描述符）描述了目标内容的位置。
* 内容描述符包括内容类型、内容标识符（Digest）和原始内容的字节大小。
* 描述符 SHOULD 嵌入到其他格式中以安全地引用外部内容。
* 其他格式应该使用描述符来安全地引用外部内容。

本节定义了 `application/vnd.oci.descriptor.v1+json` [媒体类型](#媒体类型)。

#### 描述符属性

描述符由一组封装在键值字段中的属性组成。

以下字段包含构成描述符的主要属性：

| 字段名      | 数据类型          | 描述                                                                                                                                                                                                                                |
| ----------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mediaType   | string            | 此 REQUIRED 属性包含引用内容的媒体类型。值必须符合 [RFC 6838](https://tools.ietf.org/html/rfc6838)，包括其[第 4.2 节](https://tools.ietf.org/html/rfc6838#section-4.2)中的命名要求。本规范的定义的媒体类型参见：[上文](#媒体类型)。 |
| digest      | string            | 此 REQUIRED 属性是目标内容的Digest，要求参见：[下文](#digest)。当通过不受信任的来源消费时，应根据此Digest验证检索到的内容。                                                                                                         |
| size        | int64             | 此 REQUIRED 属性指定原始内容的大小（以字节为单位）。存在此属性，以便客户端在处理之前具有预期的内容大小。如果检索到的内容的长度与指定的长度不匹配，则不应信任该内容。                                                                |
| urls        | array of strings  | 此 OPTIONAL 属性指定可从中下载此对象的 URI 列表。每项必须符合 [RFC 3986](https://tools.ietf.org/html/rfc3986)。条目应该使用 [RFC 7230](https://tools.ietf.org/html/rfc7230#section-2.7) 中所定义 http 和 https 方案                 |
| annotations | string-string map | 此 OPTIONAL 属性包含此描述符的任意元数据。此可选属性必须使用：注释规则。                                                                                                                                                            |

以下字段键是保留的，MUST NOT 被其他规范使用。

* `data` string 该键保留用于规范的未来版本。

所有其他字段可能包含在其他 OCI 规范中。在其他 OCI 规范中提出的扩展描述符字段添加应首先考虑添加到本规范中。

#### digest

描述符的 digest 属性扮演着内容标识符和内容寻址的角色。其通过对字节进行抗冲突散列来唯一标识内容。如果 digest 可以以安全的方式进行通信，则可以通过独立重新计算Digest来验证来自不安全来源的内容，确保内容未被修改。

digest 属性的值是一个由算法部分和编码部分组成的字符串。该算法指定用于 digest 的加密散列函数和编码；编码部分包含散列函数的编码结果。

digest 字符串必须符合以下语法：

```
digest                ::= algorithm ":" encoded
algorithm             ::= algorithm-component (algorithm-separator algorithm-component)*
algorithm-component   ::= [a-z0-9]+
algorithm-separator   ::= [+._-]
encoded               ::= [a-zA-Z0-9=_-]+
```

请注意：算法可以对编码部分的语法施加特定于算法的限制。另见下文：[已注册的算法](#已注册的算法)。

一些 digest 字符串例子如下：

| digest                                                                    | 算法                        | 是否注册 |
| ------------------------------------------------------------------------- | --------------------------- | -------- |
| `sha256:6c3c624b58dbbcd3c0dd82b4c53f04194d1247c6eebdaab7c610cf7d66709b3b` | [SHA-256](#sha-256)         | Yes      |
| `sha512:401b09eab3c013d4ca54922bb802bec8fd5318192b0a75f201d8b372742...`   | [SHA-512](#sha-512)         | Yes      |
| `multihash+base58:QmRZxt2b1FVZPNqd8hsiykDL3TdBDeTSPX9Kv46HmX4Gx8`         | Multihash                   | No       |
| `sha256+b64u:LCa0a2j_xo_5m0U8HTBBNBNCLXBkg7-g-YpeiGJm564`                 | SHA-256 with urlsafe base64 | No       |

有关已注册算法的列表，请参阅：[已注册的算法](#已注册的算法)。

如果符合上述语法，实现 SHOULD 允许使用无法识别的算法的 digest 通过验证。虽然 sha256 将仅使用十六进制编码的 digest，但算法中的分隔符和编码中的字母数字都包含在内以允许扩展。例如，我们可以将编码和算法参数化为 `multihash+base58:QmRZxt2b1FVZPNqd8hsiykDL3TdBDeTSPX9Kv46HmX4Gx8`，这将被视为有效但未被本规范注册。

##### 校验

在消费来自不受信任来源的描述符所针对的内容之前，应该根据 digest 字符串验证字节内容。在计算 digest 之前，应该验证内容的大小以减少哈希冲突空间。应该避免在计算散列之前进行繁重的处理。实现可以使用底层内容的规范化来确保稳定的内容标识符。

##### Digest 计算

Digest 由以下伪代码计算，其中 `H` 是选定的哈希算法，由字符串 `<alg>` 标识：

```
let ID(C) = Descriptor.digest
let C = <bytes>
let D = '<alg>:' + Encode(H(C))
let verified = ID(C) == D
```

上面，我们将内容标识符定义为 `ID(C)`，从 `Descriptor.digest` 字段中提取。内容 `C` 是一串字节。函数 `H` 以字节为单位返回 `C` 的哈希值，并传递给函数 `Encode` 并以算法为前缀以获得Digest。如果 `ID(C)` 等于 `D`，则验证结果为真，确认 `C` 是 `D` 标识的内容。 验证后，以下为真：

```
D == ID(C) == '<alg>:' + Encode(H(C))
```

通过独立计算 Digest，将 Digest 确认为内容标识符。

##### 已注册的算法

虽然 Digest 字符串的算法组件允许使用各种加密算法，但兼容的实现应该使用 [SHA-256](https://github.com/opencontainers/image-spec/blob/v1.0.2/descriptor.md#sha-256)。

本规范目前定义了以下算法标识符：

| 算法标识符 | 算法                |
| ---------- | ------------------- |
| `sha256`   | [SHA-256](#sha-256) |
| `sha512`   | [SHA-512](#sha-512) |

如果上表中没有包含有用的算法，则应该提交到本规范进行注册。

###### SHA-256

[SHA-256](https://tools.ietf.org/html/rfc4634#section-4.1) 是一种抗碰撞散列函数，选择它是因为它具有普遍性、合理的大小和安全特性。实现上 MUST 实现 SHA-256 Digest 来验证描述符。

当算法标识符为 sha256 时，编码部分必须匹配 `/[a-f0-9]{64}/`。请注意，此处不得使用 `[A-F]`。

###### SHA-512

[SHA-512](https://tools.ietf.org/html/rfc4634#section-4.2) 是一种抗碰撞散列函数，在某些 CPU 上可能比 SHA-256 性能更好。实现上 MAY 实现 SHA-512 Digest 来验证描述符。

当算法标识符为 sha512 时，编码部分必须匹配 `/[a-f0-9]{128}/`。请注意，此处不得使用 `[A-F]`。

#### 例子

以下示例描述了一个内容标识符为 `"sha256:5b0bcabd1ed22e9fb1310cf6c2dec7cdef19f0ad69efa1f392e94a4333501270"` 且大小为 7682 字节的 Manifest：

```json
{
  "mediaType": "application/vnd.oci.image.manifest.v1+json",
  "size": 7682,
  "digest": "sha256:5b0bcabd1ed22e9fb1310cf6c2dec7cdef19f0ad69efa1f392e94a4333501270"
}
```

在以下示例中，描述符指示可从特定 URL 检索（下载）引用的 Manifest：

```json
{
  "mediaType": "application/vnd.oci.image.manifest.v1+json",
  "size": 7682,
  "digest": "sha256:5b0bcabd1ed22e9fb1310cf6c2dec7cdef19f0ad69efa1f392e94a4333501270",
  "urls": [
    "https://example.com/example-manifest"
  ]
}
```

### 镜像布局

> [原文链接](https://github.com/opencontainers/image-spec/blob/v1.0.2/image-layout.md)
>
> 译者注：镜像布局定义的是一个 image 的标准目录结构。

* OCI 镜像布局是 OCI 内容可寻址 blob 和位置可寻址引用 (refs) 的目录结构。
* 此布局 MAY 用于各种不同的传输机制：存档格式（例如 tar、zip）、共享文件系统环境（例如 nfs）或网络文件获取（例如 http、ftp、rsync）。

给定镜像布局和参考，工具可以通过以下方式创建 [OCI 运行时规范 Bundle](https://github.com/opencontainers/runtime-spec/blob/v1.0.0/bundle.md)：

* 按照 ref 查找 [manifest](https://github.com/opencontainers/image-spec/blob/v1.0.2/manifest.md#image-manifest)，也可能通过 [镜像索引](https://github.com/opencontainers/image-spec/blob/v1.0.2/image-index.md)
* 按指定顺序[应用镜像层文件系统变更集](https://github.com/opencontainers/image-spec/blob/v1.0.2/layer.md#applying)
* 将[镜像配置](https://github.com/opencontainers/image-spec/blob/v1.0.2/config.md)转换为 [OCI 运行时规范 config.json](https://github.com/opencontainers/runtime-spec/blob/v1.0.0/config.md)

镜像布局如下：

* `blobs` 目录
    * 包含内容可寻址的 blob
    * 一个 blob 没有 Schema，SHOULD 被认为是不透明的
    * 目录必须存在并且可以为空
    * 更多参见 [blobs](#blobs) 章节
* `oci-layout` 文件
    * MUST 存在
    * 内容 MUST 是 JSON 对象
    * MUST 包含 `imageLayoutVersion` 字段
    * 更多参见 [oci-layout 文件](#oci-layout-文件) 章节
    * MAY 包含其他字段
* `index.json` file
    * MUST 存在
    * MUST 是一个 [image index](/opencontainers/image-spec/blob/main/image-index.md) JSON 对象
    * 更多参见 [index.json](#indexjson-文件) 章节

#### 布局示例

这是一个示例镜像布局：

```bash
$ cd example.com/app/
$ find . -type f
./index.json
./oci-layout
./blobs/sha256/3588d02542238316759cbf24502f4344ffcc8a60c803870022f335d1390c13b4
./blobs/sha256/4b0bc1c4050b03c95ef2a8e36e25feac42fd31283e8c30b3ee5df6b043155d3c
./blobs/sha256/7968321274dc6b6171697c33df7815310468e694ac5be0ec03ff053bb135e768
```

Blob 由它们的内容（的 Hash 值）命名：

```bash
$ shasum -a 256 ./blobs/sha256/afff3924849e458c5ef237db5f89539274d5e609db5db935ed3959c90f1f2d51
afff3924849e458c5ef237db5f89539274d5e609db5db935ed3959c90f1f2d51 ./blobs/sha256/afff3924849e458c5ef237db5f89539274d5e609db5db935ed3959c90f1f2d51
```

#### Blobs

* blobs 子目录中的对象名称由每个哈希算法的目录组成，其子目录将包含实际内容。
* `blobs/<alg>/<encoded>` 的内容必须匹配摘要 `<alg>:<encoded>`（每个描述符引用）。例如，blobs/`sha256/da39a3ee5e6b4b0d3255bfef95601890afd80709` 的内容 MUST 与摘要 `sha256:da39a3ee5e6b4b0d3255bfef95601890afd80709` 匹配。
* `<alg>` 和 `<encoded>` 的条目名称的字符集必须匹配描述符中描述的相应语法元素。
* blobs 目录 MAY 包含未被任何 [refs](#indexjson-文件) 引用的 blob。
* blobs 目录 MAY 缺少引用的 blob，在这种情况下，缺少的 blob 应该由外部 blob 存储来完成。

##### Blobs 示例

```bash
$ cat ./blobs/sha256/9b97579de92b1c195b85bb42a11011378ee549b02d7fe9c17bf2a6b35d5cb079 | jq
{
  "schemaVersion": 2,
  "manifests": [
    {
      "mediaType": "application/vnd.oci.image.manifest.v1+json",
      "size": 7143,
      "digest": "sha256:afff3924849e458c5ef237db5f89539274d5e609db5db935ed3959c90f1f2d51",
      "platform": {
        "architecture": "ppc64le",
        "os": "linux"
      }
    },
...
```

```bash
$ cat ./blobs/sha256/afff3924849e458c5ef237db5f89539274d5e609db5db935ed3959c90f1f2d51 | jq
{
  "schemaVersion": 2,
  "config": {
    "mediaType": "application/vnd.oci.image.config.v1+json",
    "size": 7023,
    "digest": "sha256:5b0bcabd1ed22e9fb1310cf6c2dec7cdef19f0ad69efa1f392e94a4333501270"
  },
  "layers": [
    {
      "mediaType": "application/vnd.oci.image.layer.v1.tar+gzip",
      "size": 32654,
      "digest": "sha256:9834876dcfb05cb167a5c24953eba58c4ac89b1adf57f28f2f9d09af107ee8f0"
    },
...
```

```bash
$ cat ./blobs/sha256/5b0bcabd1ed22e9fb1310cf6c2dec7cdef19f0ad69efa1f392e94a4333501270 | jq
{
  "architecture": "amd64",
  "author": "Alyssa P. Hacker <alyspdev@example.com>",
  "config": {
    "Hostname": "8dfe43d80430",
    "Domainname": "",
    "User": "",
    "AttachStdin": false,
    "AttachStdout": false,
    "AttachStderr": false,
    "Tty": false,
    "OpenStdin": false,
    "StdinOnce": false,
    "Env": [
      "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
    ],
    "Cmd": null,
    "Image": "sha256:6986ae504bbf843512d680cc959484452034965db15f75ee8bdd1b107f61500b",
...
```

```bash
$ cat ./blobs/sha256/9834876dcfb05cb167a5c24953eba58c4ac89b1adf57f28f2f9d09af107ee8f0
[gzipped tar stream]
```

#### oci-layout 文件

此 JSON 对象用作 Open Container Image Layout 基础的标记，并提供正在使用的镜像布局版本。在对布局进行更改时，imageLayoutVersion 值将与 OCI 镜像规范版本保持一致，并将固定给定版本，直到需要对镜像布局进行更改。oci-layout 定义了为 `application/vnd.oci.layout.header.v1+json` 的[媒体类型](#媒体类型)。

#### index.json 文件

这个 REQUIRED 文件是镜像布局的引用和描述符的入口点。[镜像索引](#镜像索引)是多描述符入口点。

该索引提供了一个已建立的路径 (/index.json) 以具有镜像布局的入口点并发现辅助描述符。

* 描述符的 `"org.opencontainers.image.ref.name"` 注释没有语义限制。
* 一般来说，manifests 字段中每个[描述符](#内容描述符)对象的 mediaType 将是 `application/vnd.oci.image.index.v1+json` 或 `application/vnd.oci.image.manifest.v1+json`。
* 该规范的未来版本 MAY 使用不同的媒体类型（即新的版本的格式）。
* 遇到的未知媒体类型 SHOULD 被安全地忽略。

实施者注：带有 `"org.opencontainers.image.ref.name"` 注释的描述符的常见用例是表示容器镜像的 "tag"。例如，一个镜像可能具有不同版本或软件构建的 "tag"。举个例子，您经常会看到的 "tag" ，例如 `"v1.0.0-vendor.0"`、`"2.0.0-debug"` 等。这些 "tag" 通常会在具有会对应到 `"org.opencontainers.image.ref.name"` 注释的 `"v1.0.0-vendor.0"`、`"2.0.0-debug"` 等。

##### 镜像索引示例

```json
{
  "schemaVersion": 2,
  "manifests": [
    {
      "mediaType": "application/vnd.oci.image.index.v1+json",
      "size": 7143,
      "digest": "sha256:0228f90e926ba6b96e4f39cf294b2586d38fbb5a1e385c05cd1ee40ea54fe7fd",
      "annotations": {
        "org.opencontainers.image.ref.name": "stable-release"
      }
    },
    {
      "mediaType": "application/vnd.oci.image.manifest.v1+json",
      "size": 7143,
      "digest": "sha256:e692418e4cbaf90ca69d05a66403747baa33ee08806650b51fab815ad7fc331f",
      "platform": {
        "architecture": "ppc64le",
        "os": "linux"
      },
      "annotations": {
        "org.opencontainers.image.ref.name": "v1.0"
      }
    },
    {
      "mediaType": "application/xml",
      "size": 7143,
      "digest": "sha256:b3d63d132d21c3ff4c35a061adf23cf43da8ae054247e32faa95494d904a007e",
      "annotations": {
        "org.freedesktop.specifications.metainfo.version": "1.0",
        "org.freedesktop.specifications.metainfo.type": "AppStream"
      }
    }
  ],
  "annotations": {
    "com.example.index.revision": "r124356"
  }
}
```

这展示了一个索引，该索引为此 image 布局提供两个命名引用和一个辅助媒体类型。

第一个命名引用（`stable-release`）指向另一个索引，该索引可能包含具有不同平台和注释的多个引用。请注意，[`org.opencontainers.image.ref.name` 注释](#注释) SHOULD 只在 index.json 上的描述符（`manifests` 字段）上被认为是有效的。

第二个命名引用 (v1.0) 指向特定于 linux/ppc64le 平台的 Manifest。

### 镜像索引

> [原文链接](https://github.com/opencontainers/image-spec/blob/v1.0.2/image-index.md)
>
> 译者注：描述了一组镜像，主要为了不同操作系统的分发不同的镜像

镜像索引是一个更高级别的清单，它指向特定的[镜像 Manifest](#镜像-manifest)，非常适合一个或多个平台。虽然镜像索引的使用对于镜像提供者来说是可选的，但镜像消费者应该准备好处理它们。

镜像索引定义了为 ` application/vnd.oci.image.index.v1+json` 的[媒体类型](#媒体类型)。

有关本文档兼容的媒体类型，请参阅 [兼容性 Matrix](#兼容性-matrix)。

#### 镜像索引属性

* **`schemaVersion`** _int_

    此 REQUIRED 属性指定镜像 Manifest Schema 版本。 对于这个版本的规范，这必须是 `2` 以确保与旧版本的 Docker 向后兼容。 该字段的值不会改变。 在规范的未来版本中，该字段可能会被删除。

* **`mediaType`** _string_

    这个属性 SHOULD 配合 [兼容性 Matrix](#兼容性-matrix) 使用以支持旧版本规范以及以及其他类似的外部格式。使用时，该字段值 MUST 是媒体类型 `application/vnd.oci.image.index.v1+json`。 此字段的使用与[描述符](#内容描述符)的 `mediaType` 是不同的.

* **`manifests`** _array of objects_  

    此 REQUIRED 属性包含特定平台的 [manifests](/opencontainers/image-spec/blob/main/manifest.md) 列表。虽然这个属性必须存在，但数组的大小可以为零。

    `manifests` 中的每个对象都包含一组[描述符属性](#描述符属性)，并具有以下附加属性和限制：

    * **`mediaType`** _string_
      [描述符属性](#描述符属性) 除了对 `manifests` 的限制外.

        * MUST 实现 [`application/vnd.oci.image.manifest.v1+json`](#镜像-manifest)
        * SHOULD 支持 `application/vnd.oci.image.index.v1+json` （嵌套索引）（目前仍正式未发布）

        与可移植性有关的镜像索引应该使用上述媒体类型之一。该规范的未来版本可能使用不同的媒体类型（即新的版本的格式规范）。必须忽略实现未知的遇到的媒体类型。
    * **`platform`** _object_

        此 OPTIONAL 属性描述了镜像的最低运行时要求。 如果它的目标是特定于平台的，那么这个属性应该存在。如果多个 Manifest 匹配客户端或运行时的要求，则应使用第一个匹配条目。

        * **`architecture`** _string_

            此 REQUIRED 属性指定 CPU 体系结构。 镜像索引应该使用，并且实现应该理解 Go 语言文档中列出的值 [`GOARCH`](https://golang.org/doc/install/source#environment)
        * **`os`** _string_

            此 REQUIRED 属性指定操作系统。 镜像索引应该使用，并且实现应该理解 Go 语言文档中列出的值 [`GOOS`](https://golang.org/doc/install/source#environment)
        * **`os.version`** _string_

            此 OPTIONAL 属性指定引用的 blob 所针对的操作系统的版本。 实现可以拒绝使用不知道 `os.version` 与主机操作系统版本一起工作的清单。 有效值是实现定义的。 例如 Windows 上的 `10.0.14393.1066`
        * **`os.features`** _array of strings_

            此 OPTIONAL 属性指定一个字符串数组，每个字符串指定一个强制性的操作系统功能。 当 `os` 是 `windows` 时，应该使用镜像索引，并且实现应该理解以下值：
            * `win32k`: 镜像需要主机上的“win32k.sys”（注意：Nano Server 上缺少“win32k.sys”）

            当 os 不是 windows 时，值是实现定义的，应该提交给这个规范进行标准化。
        * **`variant`** _string_

            此 OPTIONAL 属性指定 CPU 的变体。 镜像索引应该使用并且实现应该理解 [Platform Variants](#platform-variants) 表中列出的 `variant` 值。

        * **`features`** _array of strings_

            此属性为规范的未来版本保留。

* **`annotations`** _string-string map_

    此 OPTIONAL 属性包含镜像索引的任意元数据。 此可选属性必须使用 [注释规则](#注释规则)。

    参见 [Pre-Defined Annotation Keys](#预定义的注释).

#### Platform Variants

当 CPU 的变体未在表中列出时，值是实现定义的，应该提交给本规范进行标准化。

| ISA/ABI        | `architecture` | `variant` |
| -------------- | -------------- | --------- |
| ARM 32-bit, v6 | `arm`          | `v6`      |
| ARM 32-bit, v7 | `arm`          | `v7`      |
| ARM 32-bit, v8 | `arm`          | `v8`      |
| ARM 64-bit, v8 | `arm64`        | `v8`      |

#### 镜像索引示例

示例显示指向两个平台的镜像清单的简单镜像索引：

```json
{
  "schemaVersion": 2,
  "manifests": [
    {
      "mediaType": "application/vnd.oci.image.manifest.v1+json",
      "size": 7143,
      "digest": "sha256:e692418e4cbaf90ca69d05a66403747baa33ee08806650b51fab815ad7fc331f",
      "platform": {
        "architecture": "ppc64le",
        "os": "linux"
      }
    },
    {
      "mediaType": "application/vnd.oci.image.manifest.v1+json",
      "size": 7682,
      "digest": "sha256:5b0bcabd1ed22e9fb1310cf6c2dec7cdef19f0ad69efa1f392e94a4333501270",
      "platform": {
        "architecture": "amd64",
        "os": "linux"
      }
    }
  ],
  "annotations": {
    "com.example.key1": "value1",
    "com.example.key2": "value2"
  }
}
```

### 镜像 Manifest

> [原文链接](https://github.com/opencontainers/image-spec/blob/v1.0.2/manifest.md)
>
> 译者注：镜像 Manifest，描述了一个镜像配置和数据。

镜像 Manifest 规范有三个主要目标。第一个目标是内容可寻址镜像，通过支持镜像模型，该模型镜像的配置可以被 hash 以生成镜像及其组件的唯一 ID。第二个目标是通过 "fat manifest" 允许多架构镜像，该 "fat manifest" 引用特定平台版本的镜像 Manifest。在 OCI 中，这被定义在[镜像索引](#镜像索引)中。第三个目标是可[转换](#转换到-oci-运行时配置)为 [OCI 运行时规范](https://github.com/opencontainers/runtime-spec)。

本节定义 `application/vnd.oci.image.manifest.v1+json` [媒体类型](#媒体类型)。对于兼容的媒体类型，请参见 [Matrix](#兼容性-matrix)。

#### 镜像 Manifest 属性

* **`schemaVersion`** _int_

  此 REQUIRED 属性指定镜像清单架构版本。对于这个版本的规范，这必须是 2 以确保向后兼容旧版本的 Docker。该字段的值不会改变。在规范的未来版本中，该字段可能会被删除。

* **`mediaType`** _string_

    此 SHOULD 属性被使用并且与本规范的早期版本和其他类似的外部格式[保持兼容](#兼容性-matrix)。使用时，此字段必须包含媒体类型 `application/vnd.oci.image.manifest.v1+json`。此字段的使用与 mediaType 的[描述符](#内容描述符)使用不同。

* **`config`** _[内容描述符](#内容描述符)_

    此 REQUIRED 属性通过摘要引用容器的配置对象。除了[描述符要求](#描述符属性)之外，该值还有以下附加限制：

    * **`mediaType`** _string_

        config 字段对这个[描述符属性](#描述符属性) 有额外的限制。实现必须至少支持以下媒体类型：

        * [`application/vnd.oci.image.config.v1+json`](#镜像配置)

        与可移植性有关的 Manifest SHOULD 使用上述媒体类型之一。

* **`layers`** _array of objects_

    数组中的每个项目必须是一个[描述符](#内容描述符)。数组 MUST 在索引 0 处具有基础层。随后的层必须按照堆栈顺序（即从 `layers[0]` 到 `layers[len(layers)-1]`）。最终的文件系统布局必须与将层[应用](#应用变更集)到空目录的结果相匹配。初始空目录的所有权、模式和其他属性未指定。

    除了[描述符要求](#描述符属性)之外，该值还有以下附加限制：

    * **`mediaType`** _string_

        `layers[]` 对此[描述符属性](#描述符属性)对有额外的限制。实现必须至少支持以下媒体类型：

        * [`application/vnd.oci.image.layer.v1.tar`](#镜像层文件系统变更集)
        * [`application/vnd.oci.image.layer.v1.tar+gzip`](#gzip-媒体类型)
        * [`application/vnd.oci.image.layer.nondistributable.v1.tar`](#不可分发层)
        * [`application/vnd.oci.image.layer.nondistributable.v1.tar+gzip`](#gzip-媒体类型)

        与可移植性有关的镜像 Manifest 应该使用上述媒体类型之一。

        此字段中的条目将经常使用 `+gzip` 类型。

* **`annotations`** _string-string map_

    此 OPTIONAL 属性包含镜像 Manifest 的任意元数据。此可选属性必须使用[注释规则](#注释规则)。

    请参阅[预定义的注释](#预定义的注释)

#### 镜像 Manifest 示例

展示的是镜像 Manifest 的示例：

```json
{
  "schemaVersion": 2,
  "config": {
    "mediaType": "application/vnd.oci.image.config.v1+json",
    "size": 7023,
    "digest": "sha256:b5b2b2c507a0944348e0303114d8d93aaaa081732b86451d9bce1f432a537bc7"
  },
  "layers": [
    {
      "mediaType": "application/vnd.oci.image.layer.v1.tar+gzip",
      "size": 32654,
      "digest": "sha256:9834876dcfb05cb167a5c24953eba58c4ac89b1adf57f28f2f9d09af107ee8f0"
    },
    {
      "mediaType": "application/vnd.oci.image.layer.v1.tar+gzip",
      "size": 16724,
      "digest": "sha256:3c3a4604a545cdc127456d94e421cd355bca5b528f4a9c1905b15da2eb4a4c6b"
    },
    {
      "mediaType": "application/vnd.oci.image.layer.v1.tar+gzip",
      "size": 73109,
      "digest": "sha256:ec4b8955958665577945c89419d1af06b5f7636b4ac3da7f12184802ad867736"
    }
  ],
  "annotations": {
    "com.example.key1": "value1",
    "com.example.key2": "value2"
  }
}
```

### 镜像层文件系统变更集

> [原文链接](https://github.com/opencontainers/image-spec/blob/v1.0.2/layer.md)

本文档（译者注：本小结）描述了如何将文件系统和文件系统更改（如删除的文件）序列化到称为层的 blob 中。一个或多个层被应用在彼此之上以创建一个完整的文件系统。本文档将使用一个具体示例来说明如何创建和使用这些文件系统层。

本小结定义了 `application/vnd.oci.image.layer.v1.tar`, `application/vnd.oci.image.layer.v1.tar+gzip`, `application/vnd.oci.image.layer.nondistributable.v1.tar`, and `application/vnd.oci.image.layer.nondistributable.v1.tar+gzip` [媒体类型](#媒体类型)

#### `+gzip` 媒体类型

* 媒体类型 `application/vnd.oci.image.layer.v1.tar+gzip` 表示一个 `application/vnd.oci.image.layer.v1.tar` 被 [gzip][rfc1952_2] 压缩.
* 媒体类型 `application/vnd.oci.image.layer.nondistributable.v1.tar+gzip` 表示一个 `application/vnd.oci.image.layer.nondistributable.v1.tar` 被 [gzip][rfc1952_2] 压缩

#### 可分发格式

* [媒体类型](#媒体类型) `application/vnd.oci.image.layer.v1.tar` 的层变更集 MUST 打包在 [tar 存档][tar-archive]中。
* [媒体类型](#媒体类型) `application/vnd.oci.image.layer.v1.tar` 的层变更集 MUST NOT 生成的 tar 存档中包含文件路径的重复条目。

#### 变更类型

变更集中可能发生的变更类型有：

* Additions （新增）
* Modifications （修改）
* Removals （删除）

添加和修改在变更集 tar 存档中的表示方式相同。

删除使用 [`"whiteout"`](#whiteout) 文件项表示（请参阅：[变更的表示](#变更的表示)）。

##### 文件类型

在本文档部分中，"文件" 或 "条目" 一词的使用包括以下内容（如果支持）：

* regular files 普通文件
* directories 目录
* sockets sockets 文件
* symbolic links 符号链接
* block devices 块设备
* character devices 字符设备
* FIFOs 队列

##### 文件属性

在支持的情况下，必须包括添加和修改的文件属性，包括：

* Modification Time (mtime) 修改时间
* User ID (uid) 用户 id
    * User Name (uname) 相对于 uid 是次要的
* Group ID (gid) 组 id
    * Group Name (gname) 相对于 gid 是次要的
* Mode (mode) 模式
* Extended Attributes (xattrs) 扩展属性
* Symlink reference (linkname + symbolic link type) 符号链接引用
* Hardlink reference (linkname) 硬链接引用

SHOULD NOT 使用[稀疏文件](https://zh.wikipedia.org/wiki/%E7%A8%80%E7%96%8F%E6%96%87%E4%BB%B6)，因为它们缺乏跨 tar 实现的一致支持。

> 译者注：
> * 支持文件属性受限于 [tar 归档](https://en.wikipedia.org/wiki/Tar_(computing)#UStar_format)归档文件格式（即 POSIX IEEE P1003.1 1988 UStar format 格式， Linux 相关参见： [man tar Controlling the Archive Format](https://www.gnu.org/software/tar/manual/html_section/Formats.html) ）
> * 实现上使用 [vbatts/tar-split](https://github.com/vbatts/tar-split) 打包

###### Hardlinks

* 硬链接是一种 POSIX 概念，用于在同一设备上为同一文件提供一个或多个目录条目。
* 并非所有文件系统都支持硬链接（例如 [FAT](https://en.wikipedia.org/wiki/File_Allocation_Table)）。
* 除了目录之外的所有[文件类型](#文件类型)都可以使用硬链接。
* 当链接计数大于 1 时，非目录文件被视为 "硬链接"。
* 硬链接文件位于同一设备上（即比较主要：次要对）并且具有相同的 inode。
* 与 > 1 链接计数共享链接的相应文件可能位于生成变更集的目录之外，在这种情况下，链接名称不会记录在变更集中。
* 根据 GNU Basic Tar Format 和 libarchive tar(5)，硬链接存储在类型为 1 char 的 tar 存档中。
* 虽然派生新的或更改的硬链接的方法可能会有所不同，但可能的方法是：

```
SET LinkMap to map[< Major:Minor String >]map[< inode integer >]< path string >
SET LinkNames to map[< src path string >]< dest path string >
FOR each path in root path
  IF path type is directory
    CONTINUE
  ENDIF
  SET filestat to stat(path)
  IF filestat num of links == 1
    CONTINUE
  ENDIF
  IF LinkMap[filestat device][filestat inode] is not empty
    SET LinkNames[path] to LinkMap[filestat device][filestat inode]
  ELSE
    SET LinkMap[filestat device][filestat inode] to path
  ENDIF
END FOR
```

使用这种方法，可以将一个目录的链接映射和链接名称与另一个目录的链接名称进行比较，以得出对硬链接的添加和更改。

###### 特定于平台的属性

Windows 上的实现必须支持这些附加属性，在 [PAX 供应商扩展](https://github.com/libarchive/libarchive/wiki/ManPageTar5#pax-interchange-format)中编码如下：

* [Windows file attributes](https://msdn.microsoft.com/en-us/library/windows/desktop/gg258117(v=vs.85).aspx) (`MSWINDOWS.fileattr`)
* [Security descriptor](https://msdn.microsoft.com/en-us/library/cc230366.aspx) (`MSWINDOWS.rawsd`): base64-encoded self-relative binary security descriptor
* Mount points (`MSWINDOWS.mountpoint`): if present on a directory symbolic link, then the link should be created as a [directory junction](https://en.wikipedia.org/wiki/NTFS_junction_point)
* Creation time (`LIBARCHIVE.creationtime`)

#### 创建

##### 初始根文件系统

初始根文件系统是基础层或父层。

对于此示例，镜像根文件系统的初始状态为空目录。目录的名称与层本身无关，仅用于产生比较的目的。

这是变更集的初始空目录结构，具有唯一的目录名称 `rootfs-c9d-v1`。

```
rootfs-c9d-v1/
```

##### 填充初始文件系统

然后创建文件和目录：

```
rootfs-c9d-v1/
    etc/
        my-app-config
    bin/
        my-app-binary
        my-app-tool
```

然后将 rootfs-c9d-v1 目录创建为具有 rootfs-c9d-v1 的相对路径的普通 [tar 存档](https://en.wikipedia.org/wiki/Tar_(computing))。以下文件的条目：

```
./
./etc/
./etc/my-app-config
./bin/
./bin/my-app-binary
./bin/my-app-tools
```

##### 填充比较文件系统

创建一个新目录并使用先前根文件系统的副本或快照对其进行初始化。可以保留文件属性以制作此副本的示例命令是：

* [cp(1)](http://linux.die.net/man/1/cp): `cp -a rootfs-c9d-v1/ rootfs-c9d-v1.s1/`
* [rsync(1)](http://linux.die.net/man/1/rsync): `rsync -aHAX rootfs-c9d-v1/ rootfs-c9d-v1.s1/`
* [tar(1)](http://linux.die.net/man/1/tar): `mkdir rootfs-c9d-v1.s1 && tar --acls --xattrs -C rootfs-c9d-v1/ -c . | tar -C rootfs-c9d-v1.s1/ --acls --xattrs -x (including --selinux where supported)`

对快照的任何更改都不得更改或影响其拷贝自的目录（译者注：意识应该是，对 `rootfs-c9d-v1.s1` 的变更都不应该影响 `rootfs-c9d-v1/` 目录）。

例如 `rootfs-c9d-v1.s1` 是 `rootfs-c9d-v1` 的相同快照。这样，`rootfs-c9d-v1.s1` 就为更新和更改做好了准备。

实施者注：写时复制或联合文件系统（copy-on-write or union filesystem）可以有效地制作目录快照：

快照的初始布局：

```
rootfs-c9d-v1.s1/
    etc/
        my-app-config
    bin/
        my-app-binary
        my-app-tools
```

有关变更的更多详细信息，请参阅[变更类型](#变更类型)。

例如，在 `/etc/my-app.d` 中添加一个包含默认配置文件的目录，删除现有的配置文件。还对 `./bin/my-app-tools` 二进制文件进行更改（属性或文件内容）以处理配置布局更改。

```
rootfs-c9d-v1.s1/
    etc/
        my-app.d/
            default.cfg
    bin/
        my-app-binary
        my-app-tools
```

##### 确定变更

比较两个目录时，相对根目录是顶级目录。比较目录，查找[已添加、修改或删除](#变更类型)的文件。

对这个例子，`rootfs-c9d-v1/` 和 `rootfs-c9d-v1.s1/` 作为相对根路径进行递归比较。

找到以下变更集：

```
Added:      /etc/my-app.d/
Added:      /etc/my-app.d/default.cfg
Modified:   /bin/my-app-tools
Deleted:    /etc/my-app-config
```

这表示删除 `/etc/my-app-config` 并添加了 `/etc/my-app.d/default.cfg` 目录和文件。 `/bin/my-app-tools` 也已替换为更新版本。

##### 变更的表示

然后创建一个仅包含此变更集的 [tar 存档](https://en.wikipedia.org/wiki/Tar_(computing))：

* 添加和修改的文件和目录
* 已删除的文件或目录被标记为 [whiteout 文件](#whiteout)

生成的 `rootfs-c9d-v1.s1` 的 tar 存档具有以下条目：

```
./etc/my-app.d/
./etc/my-app.d/default.cfg
./bin/my-app-tools
./etc/.wh.my-app-config
```

为了表示在应用变更集时必须删除资源 `./etc/my-app-config`，条目的基本名称以 `.wh.` 为前缀。

#### 应用变更集

* [媒体类型](#媒体类型) `application/vnd.oci.image.layer.v1.tar` 的层变更集会被应用，而不是简单地提取 tar 归档。
* 应用层变更集需要特别考虑 [whiteout 文件](#whiteout)。
* 在层变更集中没有任何 [whiteout 文件](#whiteout) 的情况下，存档会像常规 tar 存档一样被提取。

##### 变更集应用在已存在的文件

如果目标路径已存在，此部分指定应用层变更集中的条目。

如果条目和现有路径都是目录，则现有路径的属性必须由变更集中条目的属性替换。在所有其他情况下，实现必须执行以下语义等效：

* 删除文件路径（例如 Linux 系统上的 [unlink(2)](http://linux.die.net/man/2/unlink)）
* 根据变更集条目的内容和属性重新创建文件路径

#### Whiteout

* whiteout 文件是具有特殊文件名的空文件，表示应删除路径。
* whiteout 文件的文件名（译者注：不包含路径前缀的名称）由前缀 `.wh.` 加上要删除的路径的基本名称（译者注：即不包含路径前缀的名称）。
* 作为以 `.wh.` 为前缀的文件。是特殊的 whiteout 标记，不可能创建一个文件系统，其文件或目录的名称以 `.wh.` 开头。
* 一旦应用了 whiteout，whiteout 本身也 MUST 被隐藏。
* whiteout 文件 MUST 仅能应用于 lower/parent 层。
* 与 whiteout 文件位于同一层的文件只能被后续层中的 whiteout 文件隐藏。

以下是具有多个资源的基础层：

```
a/
a/b/
a/b/c/
a/b/c/bar
```

创建下一层时，删除原来的 `a/b` 目录，用 `a/b/c/foo` 重新创建：

```
a/
a/.wh..wh..opq
a/b/
a/b/c/
a/b/c/foo
```

在处理第二层时，首先应用 `a/.wh..wh..opq`，然后再创建新版本的 `a/b`，而不管遇到 whiteout 文件的顺序如何。例如，下面的层等价于上面的层：

```
a/
a/b/
a/b/c/
a/b/c/foo
a/.wh..wh..opq
```

实现生成层时 SHOULD 让 without 文件位于同级目录的其他条目之前。

##### Opaque Whiteout

* 除了表示应该从较低层中删除单个条目之外，层还可以使用 Opaque Whiteout 来删除所有子项。
* 一个 Opaque Whiteout 是一个名为 `.wh..wh..opq` 的文件，表示所有兄弟姐妹都隐藏在较低层中。

我们以下面的基础层为例：

```
etc/
	my-app-config
bin/
	my-app-binary
	my-app-tools
	tools/
		my-app-tool-one
```

如果 bin/ 的所有子级都被删除，则下一层将具有以下内容：

```
bin/
	.wh..wh..opq
```

这称为 opaque whiteout 格式。一个 opaque whiteout 文件隐藏了 bin/ 的所有子目录，包括子目录和所有后代。如果使用显式 whiteout 文件，这将等效于以下内容：

```
bin/
	.wh.my-app-binary
	.wh.my-app-tools
	.wh.tools
```

在这种情况下，将为每个条目生成一个唯一的 without 文件 。如果基础层中有更多 bin/ 的子级，则每个子级都会有一个条目。请注意，此 opaque whiteout 将应用于所有子目录，包括子目录、其他资源和所有后代。

实现应该使用显式的 whiteout 文件生成层，但必须接受两者。

任何给定的镜像都是由几个镜像文件系统变更集 tar 档案几个组成。

[libarchive-tar]: https://github.com/libarchive/libarchive/wiki/ManPageTar5#POSIX_ustar_Archives
[gnu-tar-standard]: http://www.gnu.org/software/tar/manual/html_node/Standard.html
[rfc1952_2]: https://tools.ietf.org/html/rfc1952
[tar-archive]: https://en.wikipedia.org/wiki/Tar_(computing)

#### 不可分发层

由于法律要求，某些层可能无法定期分发。这种不可分发的层通常直接从分发者下载，但从不上传。

不可分发的层应该使用 `application/vnd.oci.image.layer.nondistributable.v1.tar` 的替代媒体类型进行标记。实现 SHOULD NOT 上传带有此媒体类型标签的图层；然而，这种媒体类型 SHOULD NOT 影响实现是否下载层。

[描述符](#内容描述符)不可分发层的描述符可能包含用于直接下载这些层的 `urls`；但是，不应该使用 `urls` 字段的是否存在来确定层是否是不可分发的。

### 镜像配置

> [原文链接](https://github.com/opencontainers/image-spec/blob/v1.0.2/config.md)

OCI 镜像是由 根文件系统更改的有序集合 以及 容器运行时中会使用的相应执行参数组成的。本规范使用 JSON 格式描述了用于运行时的镜像、执行工具以及它与文件系统变更集的关系（被描述在 [镜像层文件系统变更集](#镜像层文件系统变更集) 文档）

本节定义 `application/vnd.oci.image.config.v1+json` [媒体类型](#媒体类型)。

#### 术语

本部分使用以下术语：

#### [Layer](#镜像层文件系统变更集)

* 镜像文件系统由层组成。
* 每个层表示一组基于 tar 层格式的文件系统更改集合，记录其相对于其父层添加、更改或删除的文件。
* 层没有配置元数据，例如环境变量或默认参数——这些是镜像作为一个整体而不是任何特定层的属性。
* 使用基于层或联合文件系统（如 AUFS），或通过计算文件系统快照的差异，文件系统变更集可用于呈现一系列镜像层，就好像它们是一个内聚的文件系统一样。

#### Image JSON

* 每个镜像都有一个关联的 JSON 结构，该结构描述了有关镜像的一些基本信息，例如创建日期、作者以及执行/运行时配置，例如其入口点、默认参数、网络和卷。
* JSON 结构还引用镜像使用的每一层的加密哈希，并提供这些层的历史信息。
* 此 JSON 被认为是不可变的，因为更改它会更改计算的 [ImageID](#ImageID)。
* 更改它意味着创建一个新的派生镜像，而不是更改现有镜像。

#### Layer DiffID

层 DiffID 是层的未压缩 tar 存档上的摘要，并以描述符摘要格式序列化，例如 sha256:a9561eb1b190625c9adb5a9513e72c4dedafc1cb2d4c5236c9a6957ec7dfd5a9。层应该可重复地打包和解包以避免更改层 DiffID，例如通过使用 [tar-split](https://github.com/vbatts/tar-split) 来保存 tar 标头。

注意：不要将 DiffID 与层摘要混淆，层摘要通常在清单中引用，它们是压缩或未压缩内容的摘要。

#### Layer ChainID

为方便起见，有时用单个标识符来指代一个层的堆栈（译者注：stack，表示一系列有顺序的层）很有用。层的 DiffID 标识单个变更集，而 ChainID 标识这些变更集的应用。这确保我们拥有引用层本身的句柄，也拥有指向一系列变更集应用结果的句柄。与 `rootfs.diff_ids` 结合使用，当应用层到根文件系统时，可以唯一地、安全地识别结果。

##### 定义

一组应用层的 ChainID 使用以下递归定义：

```
ChainID(L₀) =  DiffID(L₀)
ChainID(L₀|...|Lₙ₋₁|Lₙ) = Digest(ChainID(L₀|...|Lₙ₋₁) + " " + DiffID(Lₙ))
```

为此，我们定义二进制 `|` 操作是将右操作数应用于左操作数的结果。例如，给定基础层 A 和变更集 B，我们将 B 应用于 A 的结果称为 `A|B`。

上面，我们将单层的 `ChainID(L₀)` 定义为等效于该层的 DiffID。而，一组层的应用 `(L₀|...|Lₙ₁|Lₙ)` 的 `ChainID` 定义为递归 `Digest(ChainID(L₀|...|Lₙ₁) + " " + DiffID(Lₙ))`。

##### 解释

假设我们有层 A、B、C，从下到上排序，其中 A 是底部，C 是顶部。定义 `|` 作为二进制应用程序运算符，根文件系统可能是 `A|B|C`。虽然暗示 `C` 仅在应用于 `A|B` 时才有用，但标识符 `C` 不足以识别此结果，因为等式 `C = A|B|C`，这是不正确的。

主要问题是当我们对 `C` 有两个定义时，`C = C` 和 `C = A|B|C`。如果这是真的（有些挥手），`C = x|C` 其中 `x = 任何应用程序`。这意味着如果攻击者可以定义 `x`，则依赖 `C` 并不能保证以任何顺序应用层。

`ChainID` 通过定义为复合散列来解决这个问题。**我们将变更集 `C` 与依赖于顺序的应用程序 `A|B|C` 区分开来，通过说生成的 `rootfs` 由 `ChainID(A|B|C)` 标识，可以通过 `ImageConfig.rootfs` 计算。**

让我们展开 `ChainID(A|B|C)` 的定义来探索它的内部结构：

```
ChainID(A) = DiffID(A)
ChainID(A|B) = Digest(ChainID(A) + " " + DiffID(B))
ChainID(A|B|C) = Digest(ChainID(A|B) + " " + DiffID(C))
```

我们可以替换每个定义并简化为一个等式：

```
ChainID(A|B|C) = Digest(Digest(DiffID(A) + " " + DiffID(B)) + " " + DiffID(C))
```

希望以上内容能够说明 `ChainID` 的实际内容。最重要的是，我们可以很容易地看到 `ChainID(C) != ChainID(A|B|C)`，否则作为基本情况的 `ChainID(C) = DiffID(C)` 不可能为真。

#### ImageID

每个镜像的 ID 由其[配置 JSON](#image-json) 的 SHA256 Hash 给出。它表示为 256 位的十六进制编码，例如 `sha256:a9561eb1b190625c9adb5a9513e72c4dedafc1cb2d4c5236c9a6957ec7dfd5a9`。由于获取 hash 的[配置 JSON](#image-json) 引用镜像中每一层的 hash，因此 ImageID 的这种描述使镜像内容可寻址（译者注：意思是镜像配置 JSON 包含的 `rootfs.diff_ids` 是内容的 hash，所以可以寻址到进行内容）。

#### 镜像配置属性

注意：任何 OPTIONAL 字段也可以设置为 null，相当于不存在。

* **created** _string_, OPTIONAL

    创建镜像的日期时间，格式为 [RFC 3339, section 5.6][rfc3339-s5.6].

* **author** _string_, OPTIONAL

    提供创建并负责维护镜像的个人或实体的姓名 and/or 电子邮件地址。

* **architecture** _string_, REQUIRED

    此镜像中的二进制文件是为在其上运行而构建的CPU架构。
    配置 SHOULD 用Go语言文件中列出的值，而实现应理解这些值 [`GOARCH`][go-environment].

* **os** _string_, REQUIRED

    镜像运行的操作系统的名称。
    配置 SHOULD 用Go语言文件中列出的值，而实现应理解这些值 [`GOOS`][go-environment].

* **config** _object_, OPTIONAL

    在使用该映像运行容器时应作为基础的执行参数。
    这个字段可以是 `null`，在这种情况下，任何执行参数都应该在创建容器时指定。

    * **User** _string_, OPTIONAL

        用户名或UID，这是一个平台特定的结构，允许具体控制进程以哪个用户身份运行。
        当创建容器时没有指定该值时，这将作为一个默认值使用。
        对于基于Linux的系统，以下所有的都是有效的。`user`, `uid`, `user:group`, `uid:gid`, `uid:group`, `user:gid`。
        如果没有指定`group` / `gid`，将应用容器中 `/etc/passwd` 中给定的 `user` / `uid` 的默认组和补充组。

    * **ExposedPorts** _object_, OPTIONAL

        一组要从运行此镜像的容器中公开的端口。
        它的键可以是以下格式。
        `port/tcp`, `port/udp`, `port`，如果没有指定，默认协议为`tcp`。
        这些值作为默认值，在创建容器时与任何指定的值合并。
        **注意：**这个JSON结构值是不寻常的，因为它是Go类型 `map[string]struct{}` 的直接JSON序列化，在JSON中表示为一个将其键映射到一个空对象的对象。

    * **Env** _array of strings_, OPTIONAL

        条目格式为：`VARNAME=VARVALUE'。
        这些值作为默认值，在创建容器时与任何指定的值合并。

    * **Entrypoint** _array of strings_, OPTIONAL

        一个参数列表，用作容器启动时要执行的命令。
        这些值作为默认值，可以由创建容器时指定的入口取代。

    * **Cmd** _array of strings_, OPTIONAL

        容器的 entrypoint 的默认参数。
        这些值作为默认值，可以由创建容器时指定的任何值来代替。
        如果没有指定 `Entrypoint` 值，那么 `Cmd` 数组的第一个条目就应该被解释为要运行的可执行文件。

    * **Volumes** _object_, OPTIONAL

        一组描述进程可能写入容器实例特定数据的目录。
        **注意：**这个JSON结构值是不寻常的，因为它是Go类型`map[string]struct{}`的直接JSON序列化，并在JSON中表示为将其键映射到一个空对象。

    * **WorkingDir** _string_, OPTIONAL

        设置容器中入口进程的当前工作目录。
        这个值作为默认值，可以由创建容器时指定的工作目录代替。

    * **Labels** _object_, OPTIONAL

        该字段包含容器的任意元数据。
        这个属性必须使用[注释规则](#注释规则)

    * **StopSignal** _string_, OPTIONAL
        该字段包含将被发送到容器中退出的系统调用信号。该信号可以是一个格式为 `SIGNAME` 的信号名称，例如 `SIGKILL` 或 `SIGRTMIN+3`。

* **rootfs** _object_, REQUIRED

    rootfs 键引用镜像所使用的层内容地址。
    这使得镜像配置的哈希值（译者注：即上文提到的 ImageID）依赖于文件系统的哈希值。

    * **type** _string_, REQUIRED

        必须被设置为`layers`。
        如果在验证或解压镜像时遇到一个未知的值，实现必须产生一个错误。

    * **diff_ids** _array of strings_, REQUIRED

        一个层内容哈希值（`DiffIDs'）的数组，按从头到尾的顺序排列。

* **history** _array of objects_, OPTIONAL

    描述了每个层的历史。
    数组从第一个到最后一个排序。
    该对象有以下字段。

    * **created** _string_, OPTIONAL

        创建的日期时间，格式为 [RFC 3339, section 5.6][rfc3339-s5.6].

    * **author** _string_, OPTIONAL

        构建点的作者。

    * **created_by** _string_, OPTIONAL

        创建该层的命令。

    * **comment** _string_, OPTIONAL

        创建层时设置的一个自定义信息。

    * **empty_layer** _boolean_, OPTIONAL

        这个字段用来标记历史项目是否创建了一个文件系统的差异。
        如果这个历史项目不对应于rootfs部分的实际层（例如，Dockerfile的[ENV](https://docs.docker.com/engine/reference/builder/#/env)命令导致文件系统没有变化），它被设置为true。

Image JSON结构中的任何额外字段都被认为是特定的实现，并且必须被任何无法解释它们的实现所忽略。

JSON 格式化（空白字符）是可选的，实现可以使用没有空白字符的紧凑JSON。

#### 镜像配置示例

下面是一个镜像配置JSON文档的例子。

```json
{
    "created": "2015-10-31T22:22:56.015925234Z",
    "author": "Alyssa P. Hacker <alyspdev@example.com>",
    "architecture": "amd64",
    "os": "linux",
    "config": {
        "User": "alice",
        "ExposedPorts": {
            "8080/tcp": {}
        },
        "Env": [
            "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
            "FOO=oci_is_a",
            "BAR=well_written_spec"
        ],
        "Entrypoint": [
            "/bin/my-app-binary"
        ],
        "Cmd": [
            "--foreground",
            "--config",
            "/etc/my-app.d/default.cfg"
        ],
        "Volumes": {
            "/var/job-result-data": {},
            "/var/log/my-app-logs": {}
        },
        "WorkingDir": "/home/alice",
        "Labels": {
            "com.example.project.git.url": "https://example.com/project.git",
            "com.example.project.git.commit": "45a939b2999782a3f005621a8d0f29aa387e1d6b"
        }
    },
    "rootfs": {
      "diff_ids": [
        "sha256:c6f988f4874bb0add23a778f753c65efe992244e148a1d2ec2a8b664fb66bbd1",
        "sha256:5f70bf18a086007016e948b04aed3b82103a36bea41755b6cddfaf10ace3c6ef"
      ],
      "type": "layers"
    },
    "history": [
      {
        "created": "2015-10-31T22:22:54.690851953Z",
        "created_by": "/bin/sh -c #(nop) ADD file:a3bc1e842b69636f9df5256c49c5374fb4eef1e281fe3f282c65fb853ee171c5 in /"
      },
      {
        "created": "2015-10-31T22:22:55.613815829Z",
        "created_by": "/bin/sh -c #(nop) CMD [\"sh\"]",
        "empty_layer": true
      }
    ]
}
```

[rfc3339-s5.6]: https://tools.ietf.org/html/rfc3339#section-5.6
[go-environment]: https://golang.org/doc/install/source#environment
[tar-split]: https://github.com/vbatts/tar-split

### 注解

> [原文链接](https://github.com/opencontainers/image-spec/blob/v1.0.2/annotations.md)

该规范的几个组件，如[镜像 Manifest](#镜像-manifest) 和[描述符](#内容描述符)，都具有可选的注释属性，其格式是通用的，并在本节中定义。

此属性包含任意元数据。

#### 注释规则

* 注释 MUST 是一个 Map，其中 Key 和 Value 都必须是字符串。
* 虽然 Value MUST 存在，但它 MAY 是一个空字符串。
* Key 在这个 Map 中 MUST 是唯一的，最佳做法是 Key 以名字空间方式命名。
* Key SHOULD 使用反向域名符号来命名 - 例如：`com.example.myKey`。
* 前缀`org.opencontainers`是为开放容器倡议（OCI）规范中定义的保留的 Key，其他规范和扩展不得使用。
* 使用`org.opencontainers.image`命名空间的 Key 是保留给OCI镜像规范使用的，决不能被其他规范和扩展使用，包括其他OCI规范。
* 如果没有注释，那么这个属性 MUST 不存在或为空 Map。
* 如果消费者遇到一个未知的注解 Key，不得生成一个错误。

#### 预定义的注释

本规范定义了以下注释 Key，用于但不限于[镜像索引](#镜像索引)和[镜像 manifest](#镜像-manifest)作者。

* **org.opencontainers.image.created** 建立镜像的日期时间（字符串，由[RFC 3339](https://tools.ietf.org/html/rfc3339#section-5.6)定义的日期-时间）。
* **org.opencontainers.image.author** 负责该镜像的人员或组织的详细联系方式（自由格式字符串）
* **org.opencontainers.image.url** 可以找到更多关于镜像的信息的URL（字符串）。
* **org.opencontainers.image.document** 获取镜像文档的URL（字符串）
* **org.opencontainers.image.source** 获取构建镜像的源代码的URL（字符串）
* **org.opencontainers.image.version** 打包软件的版本。
    * 该版本 MAY 与源代码库中的 Tag 或 Label 相匹配
    * 版本可能是[Semantic versioning-compatible](http://semver.org/)
* **org.opencontainers.image.revision** 被打包软件的源代码控制修订标识符。
* **org.opencontainers.image.vendor**发行实体、组织或个人的名称。
* **org.opencontainers.image.licenses** 包含的软件作为[SPDX License Expression[spdx-license-expression] 分发的许可证。
* **org.opencontainers.image.ref.name** 目标的参考名称（字符串）（译者注：即镜像 TAG）。
    * SHOULD 只有在 [镜像布局](#镜像布局) 内的 `index.json` 上的描述符时使用才应被视为有效。
    * 该值的字符集应符合 `A-Za-z0-9` 的字母和 `-._:@/+` 的分隔符集。
    * 引用必须符合以下[语法](#ebnf)。

        ```
        ref       ::= component ("/" component)*
        component ::= alphanum (separator alphanum)*
        alphanum  ::= [A-Za-z0-9]+
        separator ::= [-._:@+] | "--"
        ```

* **org.opencontainers.image.title** 人可读的镜像标题（字符串）。
* **org.opencontainers.image.description** 镜像中打包的软件的可读描述（字符串）。

[spdx-license-expression]: https://spdx.org/spdx-specification-21-web-version#h.jxpfx0ykyb60

#### 与 Label Schema 的向后兼容

[Label Schema](https://label-schema.org) 为容器镜像定义了许多常规标签，现在这些标签被带有以 **org.opencontainers.image** 开头的 Key 的注释所取代。

虽然鼓励用户使用 **org.opencontainers.image** 键，但工具可以选择使用 **org.label-schema** 前缀支持兼容注释，如下所示。

| `org.opencontainers.image` 前缀 | `org.label-schema` 前缀 | 兼容性说明                          |
| ------------------------------- | ----------------------- | ----------------------------------- |
| `created`                       | `build-date`            | Compatible                          |
| `url`                           | `url`                   | Compatible                          |
| `source`                        | `vcs-url`               | Compatible                          |
| `version`                       | `version`               | Compatible                          |
| `revision`                      | `vcs-ref`               | Compatible                          |
| `vendor`                        | `vendor`                | Compatible                          |
| `title`                         | `name`                  | Compatible                          |
| `description`                   | `description`           | Compatible                          |
| `documentation`                 | `usage`                 | 如果文档通过 URL 定位，则值是兼容的 |
| `authors`                       |                         | 在 Label Schema 中没有等价实现      |
| `licenses`                      |                         | 在 Label Schema 中没有等价实现      |
| `ref.name`                      |                         | 在 Label Schema 中没有等价实现      |
|                                 | `schema-version`        | 在 OCI Image Spec 中没有等价实现    |
|                                 | `docker.*`, `rkt.*`     | 在 OCI Image Spec 中没有等价实现    |

### 转换到 OCI 运行时配置

> [原文链接](https://github.com/opencontainers/image-spec/blob/v1.0.2/conversion.md#annotation-fields)

将 OCI 镜像提取到 [OCI 运行时 Bundle](#https://github.com/opencontainers/runtime-spec/blob/v1.0.0/bundle.md) 中时，关于提取在这两个正交组件中，是有相关性的：

* 从 [文件系统层集合](#镜像层文件系统变更集) 中提取出根文件系统。
* 将镜像配置 blob 转换为 OCI 运行时配置 blob。

本节定义如何将 `application/vnd.oci.image.config.v1+json` blob 转换为 [OCI 运行时配置 blob](https://github.com/opencontainers/runtime-spec/blob/v1.0.0/config.md)（即提取后的一个组件）。提取前的组件是前面定义的[文件系统层集合](#镜像层文件系统变更集)，其与 [OCI 运行时 Bundle](#https://github.com/opencontainers/runtime-spec/blob/v1.0.0/bundle.md) 的配置是正交的。本文件没有规定的运行时配置属性的值，其是由实现定义的。

转换器 MUST 依赖 OCI 镜像配置来构建 OCI 运行时配置，如本文档所述；这将创建 “默认生成的运行时配置”。

“默认生成的运行时配置” 可以被覆盖或与来自调用者的外部提供的输入相结合。此外，转换器可以有自己的实现定义的默认值和扩展，可以与 “默认生成的运行时配置” 结合使用。本文档中的限制仅涉及将实现定义的默认值与 “默认生成的运行时配置” 相结合。外部提供的输入被认为是对 `application/vnd.oci.image.config.v1+json` 的修改，并且这种修改没有限制。

例如，外部提供的输入可能会导致添加、删除或更改环境变量。但是，实现定义的默认值不应导致环境变量被删除或更改。

#### 单个值字段

某些镜像配置字段在运行时配置中具有相同的对应项。其中一些是纯粹注释的字段，在下文[单独的小节](#注释字段)中讲述。兼容的配置转换器 MUST 提取以下每一个字段到生成的运行时配置中的相应字段：

| 镜像字段            | 运行时字段     | 说明 |
| ------------------- | -------------- | ---- |
| `Config.WorkingDir` | `process.cwd`  |      |
| `Config.Env`        | `process.env`  | 1    |
| `Config.Entrypoint` | `process.args` | 2    |
| `Config.Cmd`        | `process.args` | 2    |

1. 转换器可以向 `process.env` 添加额外的条目，但不应该添加 `Config.Env` 中已经存在的变量名称的条目。
2. 如果同时指定了 `Config.Entrypoint` 和 `Config.Cmd`，转换器必须将 `Config.Cmd` 的值附加到`Config.Entrypoint` 的值上，并将 `process.args` 设置为该合并值。

##### 注释字段

These fields all affect the `annotations` of the runtime configuration, and are thus subject to [precedence](#注释转换).

| Image Field         | Runtime Field | Notes |
| ------------------- | ------------- | ----- |
| `author`            | `annotations` | 1,2   |
| `created`           | `annotations` | 1,3   |
| `Config.Labels`     | `annotations` |       |
| `Config.StopSignal` | `annotations` | 1,4   |

1. 如果用户用 `Config.Labels` 明确指定了这个注解，那么在这个字段中指定的值具有较低的[优先级](#注释转换)，转换器必须使用`Config.Labels`的值。
2. 这个字段的值必须被设置为在 `annotations` 中 `org.opencontainers.image.author` 的值。
3. 这个字段的值必须被设置为在 `annotations` 中 `org.opencontainers.image.created`的值。
4. 这个字段的值必须被设置为在 `annotations` 中`org.opencontainers.image.stopSignal` 的值。

#### 解析的字段

某些镜像配置字段具有必须首先翻译的对应项。
兼容的配置转换器应该解析所有这些字段并在生成的运行时配置中设置相应的字段：

| Image Field   | Runtime Field    |
| ------------- | ---------------- |
| `Config.User` | `process.user.*` |

解析上述镜像字段的方法将在以下章节中介绍。

##### `Config.User`

如果 `Config.User` 中的[`user`或`group`](#镜像配置属性)的值是数字（`uid`或`gid`），那么这些值必须被逐字复制到 `process.user.uid` 和 `process.user.gid`。
如果 `Config.User` 中的[`user`或`group`](#镜像配置属性)的值不是数字（`user`或`group`），那么转换器应该使用适合容器上下文的方法来解决用户信息。
对于类 Unix 系统，这可能涉及到通过 NSS 或从提取的容器的根文件系统解析 `/etc/passwd` 来确定 `process.user.uid` 和 `process.user.gid` 的值。

此外，转换器应将 `process.user.extraGids` 的值设置为与容器上下文中由 `Config.User` 描述的用户相对应的值。
对于类似 Unix 的系统，这可能涉及到通过 NSS 或解析 `/etc/group` 并确定 `process.user.uid` 中指定的用户的组成员资格来解决。
如果 `Config.User` 中的 [`user`](#镜像配置属性) 的值是数字，转换器不应该修改`process.user.extraGids`。

如果没有定义 `Config.User`，则转换后的 `process.user` 值是实现定义的。
如果 `Config.User` 不对应于容器上下文中的用户，转换器必须返回一个错误。

#### 可选字段

某些镜像配置字段并不适用于所有转换用例，因此对于配置转换器实施是可选的。
兼容的配置转换器 SHOULD 为用户提供一种将这些字段提取到生成的运行时配置中的方法：

| Image Field           | Runtime Field | Notes |
| --------------------- | ------------- | ----- |
| `Config.ExposedPorts` | `annotations` | 1     |
| `Config.Volumes`      | `mounts`      | 2     |

1. 运行时配置中没有这个镜像字段的对应字段。但是转换器 SHOULD 设置[`org.opencontainers.image.exposedPorts` 注释](#config.exposedports)。
2. 实现 SHOULD 为这些位置提供挂载，以便应用程序数据不被写入容器的根文件系统。如果转换器使用挂载点为这个字段实现转换，它 SHOULD 将挂载点的 `destination` 设置为 `Config.Volumes` 中指定的值。一个实施方案 MAY 会在同一位置用镜像中的数据对挂载的内容进行初始化（译者注：原文为：seed）。如果从基于此配置描述的镜像的容器中创建一个 _新_ 镜像，这些路径中的数据不应包括在 _新_ 镜像中。`mounts` 的其他的字段与平台和环境有关，因此是由实现定义的。请注意，`Config.Volumes` 的实现不需要使用mountpoints，因为它实际上是一个文件系统的 mask。

##### `Config.ExposedPorts`

OCI 运行时配置不提供表达 “容器暴露端口” 概念的方法。
但是，转换器 SHOULD 设置 **org.opencontainers.image.exposedPorts** 注释，除非这样做会[导致冲突](#注释转换)。

**org.opencontainers.image.exposedPorts** 是对应于 [为 `Config.ExposedPorts` 定义的键](#镜像配置) 的值列表（字符串，逗号分隔值）。

#### 注释转换

本规范中有三种注释 OCI 镜像的方法：

1. [镜像配置](#镜像配置) 的 `Config.Labels`
2. [镜像 Manifest](#镜像-manifest) 的 `annotations` .
3. [镜像索引](#镜像索引) `annotations`.

此外，还有本节定义的隐式 annotations，这些 annotations 是由图像配置的值决定的。
转换器不应试图从 [镜像 Manifest](#镜像-manifest) 或 [镜像索引](#镜像索引) 中提取注释。
如果隐式注释（或 [镜像 Manifest](#镜像-manifest) 或 [镜像索引](#镜像索引) 中的注释）与 `Config.Labels` 中明确指定的注释之间存在冲突（Key 相同但值不同），必须以 `Config.Labels` 中指定的值为准。

转换器 MAY 添加注释，这些注释的键没有在镜像中指定。
转换器 MUST NOT 修改镜像中指定的注释的值。

> 译者注：一句话来说就是以 [镜像配置](#镜像配置) 的 `Config.Labels` 为准，忽略其他地方的注释。

### 设计考量

> [原文链接](https://github.com/opencontainers/image-spec/blob/v1.0.2/considerations.md)

#### 可扩展性

正在读取/处理[镜像 Manifest](#镜像-manifest) 或[镜像索引](#镜像索引)的实现在遇到未知属性时不得产生错误。相反，他们 MUST 忽略未知属性。

#### 规范化

* OCI 镜像是[内容可寻址的](https://en.wikipedia.org/wiki/Content-addressable_storage)。有关更多信息，请参见[描述符](#内容描述符)。
* 内容可寻址存储的一个好处是易于重复数据删除。
* 很多镜像可能同时依赖于某一个层，但存储中只会有一个 blob。
* 使用不同的序列化，相同的层将具有不同的 Hash，并且如果引用该层的两个版本，则将有两个具有相同语义内容的 blob。
* 为了实现高效的存储，对 blob 的内容进行序列化的实现 SHOULD 使用规范的序列化。
* 这增加了不同实现可以将相同语义内容推送到存储而不创建冗余 blob 的机会。（译者注：原文为 This increases the chance that different implementations can push the same semantic content to the store without creating redundant blobs.）

##### JSON

JSON 内容应该被序列化为规范的 JSON。在 OCI 镜像格式规范媒体类型中，所有以 `+json` 结尾的类型都包含 JSON 内容。实现：

* [Go](https://golang.org/)：[github.com/docker/go](https://github.com/docker/go/)，声称实现了除 Unicode 规范化之外的[规范 JSON](http://wiki.laptop.org/go/Canonical_JSON)。

#### EBNF

对于本规范中描述的字段格式，我们使用 [Extended Backus-Naur Form](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form) 的有限子集，类似于 [XML 规范](https://www.w3.org/TR/REC-xml/#sec-notation)使用的。 OCI 规范中的语法是正则的，可以转换为单个正则表达式。但是，避免使用正则表达式以限制正则表达式语法之间的歧义。通过定义此处使用的 EBNF 子集，可以避免因链接到更大的规范而出现变化、误解或歧义的可能性。

语法由以下形式的规则组成：

```
symbol ::= expression
```

如果输入与表达式匹配，我们可以说我们有符号标识的产生式。规则定义中完全忽略空格。

```
literal ::= "matchthis"
```

上面的表达式定义了一个符号 `literal`，它与 `"matchthis"` 的精确输入相匹配。字符类由方括号 (`[]`) 描述，描述一组、范围或多个字符范围：

```
set := [abc]
range := [A-Z]
```

上述符号 `"set"` 将匹配 `"a"`、`"b"` 或 `"c"` 中的一个字符。符号 "范围" 将匹配任何字符，包括 "A" 到 "Z"。目前，仅定义了 7 位 ascii 文字和字符类的匹配，因为这就是本规范所要求的全部。可以在单个字符类中指定多个字符范围和显式字符，如下所示：

```
multipleranges := [a-zA-Z=-]
```

以上匹配范围 `A` 到 `Z`、`a` 到 `z` 中的字符以及单个字符 `-` 和 `=`。

表达式可以由一个或多个表达式组成，其中一个必须跟在另一个之后。这称为隐式连接运算符。例如，要满足以下规则，必须同时匹配 `A` 和 `B` 才能满足规则：

```
symbol ::= A B
```

每个表达式必须匹配一次且只能匹配一次，`A` 后跟 `B`。为了支持重复和可选匹配条件的描述，定义了后缀运算符 `*` 和 `+`。 `*` 表示前面的表达式可以匹配零次或多次。 `+` 表示前面的表达式必须匹配一次或多次。它们以下列形式出现：

```
zeroormore ::= expression*
oneormore ::= expression+
```

括号用于将表达式分组为更大的表达式：

```
group ::= (A B)
```

与上面更简单的表达式一样，运算符也可以应用于组。为了允许替换，我们还定义了中缀运算符 |。

```
oneof ::= A | B
```

以上表示表达式应匹配表达式 `A` 或 `B` 之一。

##### 优先级

运算符优先级按以下顺序排列：

* Terminals （文字和字符类）
* Grouping `()`
* 一元运算符 `+*`
* 级联
* 或 `|`

使用分组显示等价物可以更好地描述优先级。连接的优先级高于交替，例如 `A B | C D` 等价于 `(A B) | (C D)`。一元运算符的优先级高于或和级联，例如 `A+ | B+` 等价于 `(A+) | (B+)`。

##### 示例

下面结合前面的定义来匹配一个简单的相对路径名，描述各个组件：

``
path      ::= component ("/" component)*
component ::= [a-z]+
``

产生式 "component" 是一个或多个小写字母。那么，`"path"` 是至少一个 component，可能后跟零个或多个 /-component 对。上面可以转换成下面的正则表达式：

```
[a-z]+(?:/[a-z]+)*
```

### OCI Image 实现

> [原文链接](https://github.com/opencontainers/image-spec/blob/v1.0.2/implementations.md)

目前采用 OCI 镜像规范的项目或公司

* [projectatomic/skopeo](https://github.com/projectatomic/skopeo)
* [Amazon Elastic Container Registry (ECR)](https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-manifest-formats.html) ([announcement](https://aws.amazon.com/about-aws/whats-new/2017/01/amazon-ecr-supports-docker-image-manifest-v2-schema-2/))
* [openSUSE/umoci](https://github.com/openSUSE/umoci)
* [cloudfoundry/grootfs](https://github.com/cloudfoundry/grootfs) ([source](https://github.com/cloudfoundry/grootfs/blob/c3da26e1e463b51be1add289032f3dca6698b335/fetcher/remote/docker_src.go))
* [Mesos plans](https://issues.apache.org/jira/browse/MESOS-5011) ([design doc](https://docs.google.com/document/d/1Pus7D-inIBoLSIPyu3rl_apxvUhtp3rp0_b0Ttr2Xww/edit#heading=h.hrvk2wboog4p))
* [Docker](https://github.com/docker)
    * [docker/docker (`docker save/load` WIP)](https://github.com/docker/docker/pull/26369)
    * [docker/distribution (registry PR)](https://github.com/docker/distribution/pull/2076)
* [containerd/containerd](https://github.com/containerd/containerd)
* [Containers](https://github.com/containers/)
    * [containers/build](https://github.com/containers/build)
    * [containers/image](https://github.com/containers/image)
* [coreos/rkt](https://github.com/coreos/rkt)
* [box-builder/box](https://github.com/box-builder/box)
* [coolljt0725/docker2oci](https://github.com/coolljt0725/docker2oci)

_(要添加您的项目，请打开 [pull-request](https://github.com/opencontainers/image-spec/pulls))_

## 相关技术

* [tar (computing)](https://en.wikipedia.org/wiki/Tar_(computing))
* [SHA-2 (SHA256)](https://en.wikipedia.org/wiki/SHA-2) 和 [安全散列算法](https://en.wikipedia.org/wiki/Secure_Hash_Algorithms)
* [内容可寻址存储](https://en.wikipedia.org/wiki/Content-addressable_storage)
* [规范 JSON](http://wiki.laptop.org/go/Canonical_JSON)
* [Extended Backus-Naur Form](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form)
* [Docker Storage Driver](https://docs.docker.com/storage/storagedriver/)
