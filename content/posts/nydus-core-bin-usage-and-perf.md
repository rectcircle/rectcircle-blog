---
title: "Nydus 核心二进制使用和性能测评"
date: 2025-11-19T22:48:00+08:00
draft: true
toc: true
comments: true
tags:
  - 云原生
---

> [官方网站](https://nydus.dev/) | [Github](https://github.com/dragonflyoss/nydus)

## 简介

Nydus 采用了一种创新的文件系统设计，将元数据（目录结构）与文件内容分离，从而实现了高效的只读文件系统格式。通过这种设计，用户只需预先下载元数据即可完成文件系统的挂载，而文件内容则在实际使用时按需加载。这种机制显著提升了远程文件系统挂载的速度。

Nydus 的主要应用场景是容器化环境，特别适用于加速 OCI 镜像（如 Docker 镜像）的挂载过程。社区提供了对 Kubernetes、Docker 等主流容器运行时的无缝集成支持，使其在容器生态中具有广泛的适用性。

本文将介绍如何利用 Nydus 提供的核心工具构建 Nydus 镜像，并在 Linux 系统中完成镜像的挂载操作。此外，本文还将深入解析 Nydus 的技术原理及其性能评估结论。

通过本文，方案设计者可以获取足够的信息来评估是否采用以及何时采用 Nydus 技术。需要注意的是，本文不涉及在 Kubernetes 等容器平台中深度集成 Nydus 的具体实现细节，如需了解相关内容，请参考[官方文档](https://github.com/dragonflyoss/nydus/tree/v2.3.0?tab=readme-ov-file#supported-platforms)。

## 测试环境

* AWS us-east-1 t2.micro:
    * CPU: 1 vCPU
    * RAM: 1 GiB
    * Disk: gp3, 16000 IOPS, 1000 MiB/s
* 操作系统: Amazon Linux 2023 (fedora)
* 用户: root
* Nydus 版本: v2.3.0
* 测试目录 `/root/nydus-demo`

## Nydus 核心工具安装

```bash
wget https://github.com/dragonflyoss/nydus/releases/download/v2.3.0/nydus-static-v2.3.0-linux-amd64.tgz
tar -zxvf nydus-static-v2.3.0-linux-amd64.tgz
chown -R 0:0 nydus-static
mv nydus-static/nydus* /usr/local/bin
rm -rf nydus-static nydus-static-v2.3.0-linux-amd64.tgz 
```

## 基本使用

准备 mock 的根目录

```bash
mkdir -p 01-basic
cd 01-basic
mkdir -p origin-root-dir
mkdir -p origin-root-dir/dir_1 origin-root-dir/dir_2
mkdir -p origin-root-dir/dir_1/subdir_a origin-root-dir/dir_1/subdir_b
echo 'file_a' > origin-root-dir/dir_1/subdir_a/file_a
echo 'file_b' > origin-root-dir/dir_2/file_b
echo 'file_c' > origin-root-dir/file_c
ln -s file_c origin-root-dir/file_c_ln
tree origin-root-dir
# origin-root-dir
# ├── dir_1
# │   ├── subdir_a
# │   │   └── file_a
# │   └── subdir_b
# ├── dir_2
# │   └── file_b
# ├── file_c
# └── file_c_ln -> file_c
```

从目录构建 Nydus 镜像

```bash
nydusify --debug build --name image-basic-01 --source-dir origin-root-dir --output-dir image-store/
# DEBU[2025-02-24T12:48:02Z]      Command: /usr/local/bin/nydus-image create --bootstrap image-store/image-basic-01.meta --log-level warn --whiteout-spec oci --output-json image-store/output.json --blob image-store/image-basic-01.blob --fs-version 6 --compressor zstd --chunk-size 0x100000 origin-root-dir 
mv image-store/image-basic-01.blob image-store/$(cat image-store/output.json | jq -r '.blobs[0]')
du -ah --max-depth 1 image-store/
# 16K     image-store/image-basic-01.meta
# 4.0K    image-store/output.json
# 8.0K    image-store/58048df580011d3a700076d8a1ec9ccaee6881f7feb8352aa298959ee8866f28
# 28K     image-store/
```

挂载本地的 Nydus 镜像

```bash
mkdir -p mnt-local
tee nydusd-config.localfs.json > /dev/null << EOF
{
  "device": {
    "backend": {
      "type": "localfs",
      "config": {
        "dir": "image-store"
      }
    },
    "cache": {
      "type": "blobcache",
      "config": {
        "work_dir": "cache"
      }
    }
  },
  "mode": "direct",
  "digest_validate": false,
  "iostats_files": false,
  "enable_xattr": true
}
EOF
nydusd --config nydusd-config.localfs.json --mountpoint mnt-local --bootstrap image-store/image-basic-01.meta --log-level info
# 打开新终端，切换到该目录，观察 mnt-local 目录
cd /root/nydus-demo/01-basic
tree mnt-local/
# mnt-local/
# ├── dir_1
# │   ├── subdir_a
# │   │   └── file_a
# │   └── subdir_b
# ├── dir_2
# │   └── file_b
# ├── file_c
# └── file_c_ln -> file_c
du -ah --max-depth 1 cache/
# 4.0K    cache/58048df580011d3a700076d8a1ec9ccaee6881f7feb8352aa298959ee8866f28.blob.data.chunk_map
# 0       cache/58048df580011d3a700076d8a1ec9ccaee6881f7feb8352aa298959ee8866f28.blob.data
# 8.0K    cache/58048df580011d3a700076d8a1ec9ccaee6881f7feb8352aa298959ee8866f28.blob.meta
# 28K     cache/
cat mnt-local/dir_1/subdir_a/file_a
# file_a
cat mnt-local/dir_2/file_b
# file_b
cat mnt-local/file_c
# file_c
cat mnt-local/file_c_ln
# file_c
du -ah --max-depth 1 cache/
8.0K    cache/58048df580011d3a700076d8a1ec9ccaee6881f7feb8352aa298959ee8866f28.blob.data.chunk_map
12K     cache/58048df580011d3a700076d8a1ec9ccaee6881f7feb8352aa298959ee8866f28.blob.data
8.0K    cache/58048df580011d3a700076d8a1ec9ccaee6881f7feb8352aa298959ee8866f28.blob.meta
44K     cache/
```

## 过程分析

* 镜像构建：
    * [`nydusify` 工具](https://github.com/dragonflyoss/nydus/blob/v2.3.0/docs/nydusify.md) 指定镜像名、源目录、输出目录。
    * `nydusify` 工具解析命令行参数，并调用 [`nydus-image` 工具](https://github.com/dragonflyoss/nydus/blob/v2.3.0/docs/nydus-image.md) `create` 子命令构建 Nydus 镜像，参数如下：
        * `--bootstrap`: 生成的 Nydus 镜像的元数据文件路径。
        * `--log-level`: 日志级别，可选值： `trace`, `debug`, `info`, `warn`, `error`。
        * `--whiteout-spec`: whiteout 规范，可选值为 `oci`, `overlayfs`, `none`。
        * `--output-json`: 输出 JSON 文件，包含构建一些元信息，比如 blob 文件 ID。
        * `--blob`：生成的 Nydus 镜像的 blob 文件路径。
        * `--fs-version`：Nydus 镜像的文件系统版本，默认值为 6，可选值： `5`, `6`。
        * `--compressor`: 压缩算法，可选值： `none`, `lz4_block`, `zstd`。
        * `--chunk-size`: 压缩块大小，默认值为 `0`，可选范围：`0` 或 `0x1000-0x1000000`。
        * `path/to/source`: 源目录路径。
    * `nydus-image` 会生成 3 个文件分别是 `--bootstrap`、`--output-json` 和 `--blob`。
    * `--bootstrap` 文件是 Nydus 镜像的元数据文件，包含了镜像的目录结构和文件信息。
* Nydus 定义了一套元数据（目录结构）与文件内容分离的，文件系统格式 Rafs，大致原理如下：
    ![image](/image/rafs-format.png)
    * Image MetaData 对应 `--bootstrap` 文件。
    * Share Data Layer 对应 `--blob` 文件。
    * 更多详见： [官方文档](https://github.com/dragonflyoss/nydus/blob/master/docs/nydus-design.md)
* 镜像挂载：通过 `nydusd` 工具通过 fuse 挂载 Nydus 镜像。
    * `--config`：指定 Nydus 镜像的 blob 存储位置（支持 oss、s3、本地文件）、 cache 配置、以及文件系统参数。
    * `--mountpoint`：指定挂载点，须确保目录存在。
    * `--bootstrap`：指定挂载的 Nydus 镜像的元数据文件路径。
    * `--log-level`：指定日志级别。
    * `--digest-validate`：是否开启校验。
    * `--iostats-files`：是否开启 IO 统计。
    * 除了 FUSE 方式外，还支持 EROFS、VirtioFS 方式挂载，详见下文。

## 使用场景

### 单层镜像构建和懒挂载

#### 构建单层镜像并上传到 s3

```bash
mkdir -p 01-basic
cd 01-basic
# https://github.com/dragonflyoss/nydus/blob/v2.3.0/contrib/nydusify/pkg/packer/backend.go#L60-L70
tee backend-config.s3.json > /dev/null << EOF
{
  "endpoint": "s3.us-east-1.amazonaws.com",
  "scheme": "https",
  "access_key_id": "xxx",
  "access_key_secret": "xxx",
  "bucket_name": "xxx",
  "meta_prefix": "nydus-demo/meta/",
  "blob_prefix": "nydus-demo/blob/",
  "region": "us-east-1"
}
EOF
nydusify --debug build --name image-basic-01-s3 --source-dir origin-root-dir --backend-push --backend-type s3 --backend-config-file backend-config.s3.json
# INFO[2025-02-26T08:51:53Z] found 'nydus-image' binary at /usr/local/bin/nydus-image 
# INFO[2025-02-26T08:51:53Z] start to build image from source directory "origin-root-dir" 
# DEBU[2025-02-26T08:51:53Z]      Command: /usr/local/bin/nydus-image create --bootstrap .nydus-build-output/image-basic-01-s3.meta --log-level warn --whiteout-spec oci --output-json .nydus-build-output/output.json --blob .nydus-build-output/image-basic-01-s3.blob --fs-version 6 --compressor zstd --chunk-size 0x100000 origin-root-dir 
# INFO[2025-02-26T08:51:53Z] rename blob file into sha256 csum            
# INFO[2025-02-26T08:51:53Z] start to push meta and blob to remote backend 
# INFO[2025-02-26T08:51:53Z] push blob 58048df580011d3a700076d8a1ec9ccaee6881f7feb8352aa298959ee8866f28 
# DEBU[2025-02-26T08:51:53Z] uploaded blob nydus-demo/blob/58048df580011d3a700076d8a1ec9ccaee6881f7feb8352aa298959ee8866f28 to s3 backend, costs 30.159619ms 
# DEBU[2025-02-26T08:51:53Z] uploaded blob nydus-demo/meta/image-basic-01-s3 to s3 backend, costs 60.856919ms 
# INFO[2025-02-26T08:51:53Z] successfully built Nydus image (bootstrap:'https://xxx.s3.us-east-1.amazonaws.com/nydus-demo/meta/image-basic-01-s3', blob:'https://xxx.s3.us-east-1.amazonaws.com/nydus-demo/blob/58048df580011d3a700076d8a1ec9ccaee6881f7feb8352aa298959ee8866f28') 
```

#### 懒挂载 S3 的单层镜像

```bash
tee nydusd-config.s3.json > /dev/null << EOF
{
  "device": {
    "backend": {
      "type": "s3",
      "config": {
        "endpoint": "s3.us-east-1.amazonaws.com",
        "scheme": "https",
        "access_key_id": "xxx",
        "access_key_secret": "xxx",
        "bucket_name": "xxx",
        "meta_prefix": "nydus-demo/meta/",
        "blob_prefix": "nydus-demo/blob/",
        "region": "us-east-1"
      }
    },
    "cache": {
      "type": "blobcache",
      "config": {
        "work_dir": "cache"
      }
    }
  },
  "mode": "direct",
  "digest_validate": false,
  "iostats_files": false,
  "enable_xattr": true
}
EOF
# 下载元数据
time wget https://xxx.s3.us-east-1.amazonaws.com/nydus-demo/meta/image-basic-01-s3
# real    0m0.162s
# user    0m0.073s
# sys     0m0.042s
# 挂载
mkdir -p mnt-s3
nydusd \
  --config nydusd-config.s3.json \
  --mountpoint mnt-s3 \
  --bootstrap image-basic-01-s3 \
  --log-level debug 
# 打开新终端，切换到该目录，观察 mnt-s3 目录
cd /root/nydus-demo/01-basic
tree mnt-s3/
# mnt-s3/
# ├── dir_1
# │   ├── subdir_a
# │   │   └── file_a
# │   └── subdir_b
# ├── dir_2
# │   └── file_b
# ├── file_c
# └── file_c_ln -> file_c
cat mnt-local/dir_1/subdir_a/file_a
# file_a
cat mnt-local/dir_2/file_b
# file_b
cat mnt-local/file_c
# file_c
cat mnt-local/file_c_ln
# file_c
```

## 构建 Nydus 镜像

本章节将介绍如何使用 `nydusify` 构建并推送 Nydus 镜像，并分析执行过程以及存储结构。

### 转化 OCI 镜像（多层）

* [nydusify](https://github.com/dragonflyoss/nydus/blob/master/docs/nydusify.md)
    * 从目录构建
    * 从 OCI 构建
    * 构建并上传到 S3
* 原理: [nydus-image](https://github.com/dragonflyoss/nydus/blob/master/docs/nydus-image.md)
    * 单层 （结构）
    * 多层
    * merge
* [design](https://github.com/dragonflyoss/nydus/blob/master/docs/nydus-design.md)

## 挂载 Nydus 镜像

* [nydusd](https://github.com/dragonflyoss/nydus/blob/master/docs/nydusd.md)
    * 从目录挂载
    * 从 S3 挂载
* erofs
    * 直接使用
    * [fscache-based EROFS](https://github.com/dragonflyoss/nydus/blob/master/docs/nydus-fscache.md)

## 性能测评

* fuse + 本地文件
* fuse + s3 + 首次
* fuse + s3 + 命中缓存
* erofs + 本地文件
* erofs + fscache-based + 首次
* erofs + fscache-based + 命中缓存
