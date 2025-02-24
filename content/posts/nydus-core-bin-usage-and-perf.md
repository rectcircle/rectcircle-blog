---
title: "Nydus 核心二进制使用和性能测评"
date: 2025-11-19T22:48:00+08:00
draft: true
toc: true
comments: true
tags:
  - 云原生
---

> [Github](https://github.com/dragonflyoss/nydus)

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

## 构建 Nydus 镜像

* [nydusify](https://github.com/dragonflyoss/nydus/blob/master/docs/nydusify.md)
    * 从目录构建
    * 从 OCI 构建
    * 构建并上传到 S3
    * 压缩选项
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
