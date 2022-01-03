---
title: "OCI Image Format Spec"
date: 2022-01-02T01:35:34+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 概览

[Image Format](https://github.com/opencontainers/image-spec) 定义了容器镜像的格式，平时讲的 Docker 镜像就是基于该标准定义打包的。该标准的具体形式表现为，镜像的文件和目录结构。目前版本为 [v1.0.2](https://opencontainers.org/release-notices/v1-0-2-image-spec/)。

## 原文翻译

> 原文参见：[Github](https://github.com/opencontainers/image-spec/tree/v1.0.2)

### 介绍

该规范定义了由一个 manifest、镜像索引（可选）、 文件系统层 和 配置 组成的 OCI 镜像。

本规范的目标是创建一个可互操作的，用于构建、传输和准备要运行的容器镜像的工具。

### 符号约定

关键词 "MUST" （必须）, "MUST NOT" （禁止）, "REQUIRED" （必要的）, "SHALL" （没有对应词）, "SHALL NOT"（没有对应词）, "SHOULD"（应该）, "SHOULD NOT"（不应该）, "RECOMMENDED" （建议）, "NOT RECOMMENDED" （不建议）, "MAY" （可能）, "OPTIONAL" （可选的） 将按照 [RFC 2119](http://tools.ietf.org/html/rfc2119) 中的描述进行解释。（参见：[RFC2119：表示要求的动词](http://www.ruanyifeng.com/blog/2007/03/rfc2119.html)）

### 概览

站在高层级来看。镜像 Manifest 包含镜像内容和依赖的元数据，这些元数据主要包括一个或多个指向 filesystem layer 变更集的归档文件（其将被解包以构成最终可运行的文件系统）的可寻址标识符 （译者注：以及一个指向 Image 配置 的可寻址标识符）。Image 配置 包括应用参数、环境变量等信息。镜像索引 （译者注：可选的）是一个更高级别的 manifest，它主要包含一个，指向 manifest 的描述符的列表。通常情况下，镜像索引 可以提供的是操作系统或者硬件架构不同导致的镜像的不同实现（译者注：即为不同的平台定义不同的镜像）

> 译者注：
> * 可寻址表示符和描述符在本文中是同一事物，表示可以定位到内容的唯一标识符，这个标识符由内容本身的 hash 决定。
> * 这一段看不懂实属正常，可以先看下文，回头再来看这段总结。

![image](/image/oci/build-diagram.png)

构建好 OCI 镜像后，就可以通过名称来发现、下载、通过哈希验证、通过签名信任,，并解压到 OCI 运行时包中。

![image](/image/oci/run-diagram.png)

#### 理解这个标准

OCI Image 媒体类型 文档是理解规范整体结构的起点。

该规范的顶层组件包括：

* 镜像 Manifest - 描述构成容器镜像的组件
* 镜像索引 - 一个注解的 镜像 Manifest 的索引
* Image Layout - 描述一个镜像在文件系统中的布局情况
* Filesystem Layer - 描述容器文件系统的变更集
* Image 配置 - 转换为运行时 bundle 的图像的层排序和配置
* Conversion - 转换应该如何发生
* Descriptor - 被引用内容的类型、元数据和内容地址的引用

本规范的未来版本可能包括以下可选功能：

* 基于签名图像内容地址的签名
* 基于 DNS 联合且可委托的命名

#### 媒体类型

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

##### Media Type 冲突

该部分，主要描述了如果 HTTP 返回的 `Content-Type` 和真正的返回值不一致或者缺失应该如何处理。具体参见：[原文](https://github.com/opencontainers/image-spec/blob/v1.0.2/media-types.md#media-type-conflicts)

##### 兼容性 Matrix

该部分，主要描述了该规范和 Docker 实现的一些不同点。具体参见：[原文](https://github.com/opencontainers/image-spec/blob/v1.0.2/media-types.md#compatibility-matrix)

##### 关系

下图显示了上述 媒体类型 如何相互引用：

![image](/image/oci/media-types.png)

所有引用的引用都是通过描述符方式实现的。镜像索引 是一个 "fat manifest" ，其引用了每个目标平台的 镜像 Manifest 列表。一个 镜像 Manifest 引用一个 配置，一个或多个 Layers。

### 内容描述符

* OCI 图像由几个不同的组件组成，这些组件组成一个[有向无环图 (DAG)](https://en.wikipedia.org/wiki/Merkle_tree)。
* 图中组件之间的引用通过内容描述符表示。
* 内容描述符（或简称为描述符）描述了目标内容的位置。
* 内容描述符包括内容类型、内容标识符（Digest）和原始内容的字节大小。
* 描述符 SHOULD 嵌入到其他格式中以安全地引用外部内容。
* 其他格式应该使用描述符来安全地引用外部内容。

本节定义了 `application/vnd.oci.descriptor.v1+json` [媒体类型](#媒体类型)。

#### 属性

描述符由一组封装在键值字段中的属性组成。

以下字段包含构成描述符的主要属性：

| 字段名 | 数据类型 | 描述 |
|-------|--------|------|
| mediaType | string | 此 REQUIRED 属性包含引用内容的媒体类型。值必须符合 [RFC 6838](https://tools.ietf.org/html/rfc6838)，包括其[第 4.2 节](https://tools.ietf.org/html/rfc6838#section-4.2)中的命名要求。本规范的定义的媒体类型参见：[上文](#媒体类型)。|
| digest | string | 此 REQUIRED 属性是目标内容的Digest，要求参见：[下文](#digest)。当通过不受信任的来源消费时，应根据此Digest验证检索到的内容。|
| size | int64 | 此 REQUIRED 属性指定原始内容的大小（以字节为单位）。存在此属性，以便客户端在处理之前具有预期的内容大小。如果检索到的内容的长度与指定的长度不匹配，则不应信任该内容。|
| urls | array of strings | 此 OPTIONAL 属性指定可从中下载此对象的 URI 列表。每项必须符合 [RFC 3986](https://tools.ietf.org/html/rfc3986)。条目应该使用 [RFC 7230](https://tools.ietf.org/html/rfc7230#section-2.7) 中所定义 http 和 https 方案 |
| annotations | string-string map | 此 OPTIONAL 属性包含此描述符的任意元数据。此可选属性必须使用：注释规则。

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

| digest | 算法 | 是否注册 |
| --- | --- | --- |
| `sha256:6c3c624b58dbbcd3c0dd82b4c53f04194d1247c6eebdaab7c610cf7d66709b3b` | [SHA-256](#sha-256) | Yes |
| `sha512:401b09eab3c013d4ca54922bb802bec8fd5318192b0a75f201d8b372742...` | [SHA-512](#sha-512) | Yes |
| `multihash+base58:QmRZxt2b1FVZPNqd8hsiykDL3TdBDeTSPX9Kv46HmX4Gx8` | Multihash | No |
| `sha256+b64u:LCa0a2j_xo_5m0U8HTBBNBNCLXBkg7-g-YpeiGJm564` | SHA-256 with urlsafe base64 | No |

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

| 算法标识符 | 算法 |
| --- | --- |
| `sha256` | [SHA-256](#sha-256) |
| `sha512` | [SHA-512](#sha-512) |

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

### 镜像 Manifest

### 镜像索引

### 文件系统层

### 镜像配置

### 注解

### 转换

### 考虑因素

#### 可扩展性

#### 规范化

## 参考

https://blog.k8s.li/Exploring-container-image.html
