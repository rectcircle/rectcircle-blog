---
title: "理解和使用 GPG"
date: 2022-07-17T12:22:30+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> 参考：[GPG 官方网站](https://www.gnupg.org/)

## 基础知识

要理解 GPG 的设计和原理。需要具备加密算法的基本知识，参见： [理解 ssl/tls 协议: 从加密算法到 ssl/tls](/posts/understand-ssl-tls/)。

## GPG 简介

学术界发明了各种加密算法，这些算法最早军事和情报领域得以应用。

随着信息革命的不断深化，加密算法在工业界也逐步落地，上面提到的 ssl/tls 就是一种应用场景。

ssl/tls 面向的是是个人和组织间安全通讯的标准，即 C/S 架构。

GPG (GunPG) 提供的是一套基于加密算法实现的一套标准的安全工具包，该工具实现了 [IETF OpenPGP 标准](https://datatracker.ietf.org/wg/openpgp/documents/)。

该工具主要提供了如下两个核心能力：

* key 管理（公私钥管理）
* 数据签名和校验、数据加密和解密

该工具的应用场景如下所示：

* 电子邮件加密传输
* git commit 签名
* 管理 ssh key
* 文件加密存储

## 安装 GPG

Linux：常见的发行版已预装 GPG，如 Debian 系列、RHEL 系列 等.

MacOS：

```bash
brew install gpg
```

## 使用 GPG

### Key 管理

#### 核心概念

> 参考：[简明 GPG 概念](https://zhuanlan.zhihu.com/p/137801979)

Key 管理是 GPG 的核心功能，在 GPG Key 不能理解为非对称加密的 Private Key 或 Public Key 或 Key Pair。而是 GPG 的概念，由如下信息组成：

* Key ID: 该 GPG Key 的唯一标识，值为主公钥的指纹，支持多种格式(Fingerprint, Long key ID, Short key ID)，更多参见：[What is a OpenPGP/GnuPG key ID?](https://superuser.com/questions/769452/what-is-a-openpgp-gnupg-key-id)。
* UID: 1 个或多个，每个 UID 由 name、email、comment 组成，email 和 comment 可以为空。
* Expire: 过期时间，可以为永久。
* 多个具有不同用途的非对称加密算法中的 Key 的集合。

    * key 分类参见下表。

    | 类型   | 全名          | 缩写 | 用途 (Usage) | 说明 |
    | ------ | ------------- | ---- | ------------ | ---- |
    | 主私钥 | Secret Key    | sec  | SC           | 每个 GPG Key 有且只有一个 主私钥 |
    | 主公钥 | Public Key    | pub  | SC           | 每个 GPG Key 有且只有一个 主公钥 |
    | 子私钥 | Secret Subkey | ssb  | S/A/E        | 每个 GOG Key 可以有多个子私钥，每个子私钥可以选择一种或多种 Usage |
    | 子公钥 | Public Subkey | sub  | S/A/E        | 每个 GOG Key 可以有多个子公钥，每个子公钥可以选择一种或多种 Usage  |

    * 主秘钥和主公钥（Primary Key）、子秘钥和子公钥（Sub Key）都是成对出现的，其用途也是一致的。
    * 每一对都包含一个 key id 属性（为 public key 的指纹），其中主密钥/主公钥的 key id 就是当前 GPG Key 的 Key ID。
    * 上面提到的用途，如下表所示：

    | 缩写 | 全名 | 用途 |
    | --- | --- | --- |
    | C | Certificating | 认证，如子密钥或证书，类似根证书的作用。 |
    | S | Signing | 签名，如文件数字签名、邮件签名、Git 提交。 |
    | A | Authenticating | 身份验证，如登录。 |
    | E | Encrypting | 加密，如文件和文本。 |

    * 注意具有 `C` 的密钥是主密钥，只有这个密钥可以用于：
        * 添加或吊销子密钥的用途
        * 添加、更改或吊销密钥关联的身份（UID）
        * 添加或更改本身或其他子密钥的到期时间
        * 为了网络信任目的为其它密钥签名

* 在非对称加密中的的公钥，公钥是需要公开发布的。同样的 GPG Public Key 也需要公开发布，但 GPG Public Key 由如下内容组成：
    * 主公钥和所有子公钥的集合。
    * 有效期和吊销信息。
    * 当期那 GPG Key 的所有 UID。
* GPG Public Key 会使用 GPG 的主秘钥进行签名，以防止公钥被篡改。
* 删除和吊销 GPG Public Key 中的 Sub Key 和 UID。
    * 删除，针对已公开的 GPG Public Key，如果其他人已经加载了这个 GPG Public Key。则这个删除将不会生效（原因是：GPG 在更新一个 GPG Public Key 是合并操作，因此删除是无效的），如果没有公开过，则删除生效。
    * 吊销。标记 GPG Public Key 中 Public Subkey / UID，将添加一个“吊销”标记，这样如果其他人已经加载了这个 GPG Public Key，只要更新了，就会知道该 Public Subkey / UID 不可用了（参考： [GPG应用指南](https://zhuanlan.zhihu.com/p/21267738)）。

#### 生成 Primary Key

执行如下命令，交互式的生成一个新的 Primary Key：

```bash
gpg --full-gen-key
# 请选择您要使用的密钥类型，您的选择是？：选择 (1) RSA 和 RSA ，兼容性最好。
# 您想要使用的密钥长度？： 4096，安全性较好。
# 密钥的有效期限是？： (0) 永久。
# 构建用户标识以辨认您的密钥
#    真实姓名： rectcircle
#    电子邮件地址： rectcircle96@gmail.com
#    注释：
#    您选定了此用户标识：
#        “rectcircle <rectcircle96@gmail.com>”
# 输入 Primary Key 保护秘钥。
```

最后，输出如下：

```
gpg: ~/.gnupg/trustdb.gpg：建立了信任度数据库
gpg: 目录‘~/.gnupg/openpgp-revocs.d’已创建
gpg: 吊销证书已被存储为‘~/.gnupg/openpgp-revocs.d/89F61268D036DF3C3BA931C07C5D945596EE795B.rev’
公钥和私钥已经生成并被签名。

pub   rsa4096 2022-07-17 [SC]
      89F61268D036DF3C3BA931C07C5D945596EE795B
uid                      rectcircle <rectcircle96@gmail.com>
sub   rsa4096 2022-07-17 [E]
```

#### 列出 Key

列出所有公钥 `gpg --list-keys --keyid-format long`，输出如下：

```
~/.gnupg/pubring.kbx
-----------------------------------
pub   rsa4096/7C5D945596EE795B 2022-07-17 [SC]
      89F61268D036DF3C3BA931C07C5D945596EE795B
uid                   [ 绝对 ] rectcircle <rectcircle96@gmail.com>
sub   rsa4096/D50B14322C993EBE 2022-07-17 [E]
```

列出所有私钥 `gpg --list-secret-keys --keyid-format long`，输出如下：

```
~/.gnupg/pubring.kbx
-----------------------------------
sec   rsa4096/7C5D945596EE795B 2022-07-17 [SC]
      89F61268D036DF3C3BA931C07C5D945596EE795B
uid                   [ 绝对 ] rectcircle <rectcircle96@gmail.com>
ssb   rsa4096/D50B14322C993EBE 2022-07-17 [E]
```

可以看出，上文生成 Primary Key 的命令生成了：

* 主公钥(pub)和主私钥(sec): 用于加密和认证 (SC)
* 子公钥(sub)和子私钥(ssb)：用于加密 (E)

#### 更新 UID

进入编辑密钥，可以添加、设置主 UID、吊销和删除 UID。

```bash
gpg --edit-key 89F61268D036DF3C3BA931C07C5D945596EE795B
# 添加一个新的 UID
adduid
# 选中第一个 uid
uid 1
# 将选中的 uid 设置为主 uid
primary
# 取消选中第一个 uid
uid 1
# 选中第二个 uid
uid 2
# 吊销选中的 uid
revuid
# 删除选中的 uid
deluid
# 保存，不保存所有操作都不会生效
save
```

#### 添加 Sub Key

进入编辑密钥，可以 Sub Key。

```bash
# --expert 为专家模式，可以添加用于 Authenticate 的 SubKey
gpg --expert --edit-key 89F61268D036DF3C3BA931C07C5D945596EE795B
# 添加新的用于签名的 Sub Key，选择  (6) RSA（仅用于加密），其他和创建 Primary Key 一致
addkey
# 添加新的用于签名的 Sub Key，选择  (4) RSA（仅用于签名），其他和创建 Primary Key 一致
addkey
# 添加新的用于的 Sub Key，选择  (8) RSA（自定义用途），然后让，目前启用的功能只有，身份验证（Authenticate）
# 其他和创建 Primary Key 一致
addkey
# 保存，不保存所有操作都不会生效
save
```

最后，执行 `gpg --list-secret-keys --keyid-format long` 列出所有 Key，输出如下所示：

```
~/.gnupg/pubring.kbx
-----------------------------------
sec   rsa4096/7C5D945596EE795B 2022-07-17 [SC]
      89F61268D036DF3C3BA931C07C5D945596EE795B
uid                   [ 绝对 ] rectcircle <rectcircle96@gmail.com>
ssb   rsa4096/D50B14322C993EBE 2022-07-17 [E]
ssb   rsa4096/50235B5E033D3535 2022-07-17 [S]
ssb   rsa4096/CA45E598414ADA5F 2022-07-17 [A]
```

#### 删除 Sub Key

```bash
gpg --expert --edit-key 89F61268D036DF3C3BA931C07C5D945596EE795B
list
# 选中的 key
key 1
# 删除选中的 key
delkey
# 如果需要应用，需执行 save 命令。
# save
```

#### 吊销 Sub Key

```bash
gpg --expert --edit-key 89F61268D036DF3C3BA931C07C5D945596EE795B
list
# 选中的 key
key 1
# 删除选中的 key
revkey
# 如果需要应用，需执行 save 命令。
# save
```

#### 导出 GPG Public Key

导出

```bash
# 打印 GPG Public Key 到标准输出
gpg --armor --export 89F61268D036DF3C3BA931C07C5D945596EE795B
# 打印 GPG Public Key 文件
gpg --output my.pub --armor --export 89F61268D036DF3C3BA931C07C5D945596EE795B
```

#### 导出 GPG Private Key

```bash
# 保存 GPG Private Key (包含 主私钥和所有子私钥) 到文件
gpg --output all.pri --armor --export-secret-keys 89F61268D036DF3C3BA931C07C5D945596EE795B
# 保存 GPG 主私钥到文件 (注意后面的感叹号)
gpg --output primary.pri --armor --export-secret-key 7C5D945596EE795B!
# 保存 GPG 所有子私钥到文件
gpg --output all-subkey.pri --armor --export-secret-subkeys 89F61268D036DF3C3BA931C07C5D945596EE795B
```

#### 删除

```bash
# 删除私钥（交互式的选择删除那些秘钥）
gpg --delete-secret-keys UID 或 子秘钥 KeyID 或 主密钥 KeyID
# 删除公钥 (如果存在对应个私钥，需先删除；如果该公钥对应的私钥没有主私钥，只有子私钥，该操作也会直接删除对应的子私钥，因此可能会导致子秘钥丢失你)
gpg --delete-keys UID 或 子秘钥 KeyID 或 主密钥 KeyID
```

#### 导入

```bash
gpg --import 上文导出的文件
```

#### 公布 PGG Public Key

> 参考：[使用公钥服务器](https://wiki.archlinux.org/title/GnuPG_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E4%BD%BF%E7%94%A8%E5%85%AC%E9%92%A5%E6%9C%8D%E5%8A%A1%E5%99%A8)

该操作会将 GPG Public Key 公布到 GPG Key Server 上，以便其他人可以使用你的 GPG Public Key。目前默认的 GPG Key Server 地址是：`hkps://hkps.pool.sks-keyservers.net` （[源码](https://github.com/gpg/gnupg/blob/master/configure.ac#L1981)）。

```bash
gpg --send-keys 89F61268D036DF3C3BA931C07C5D945596EE795B
```

**注意：**一旦发布，则无法删除，公钥中包含 UID，如果包含多个 UID，则可能存在隐私泄漏的风险，关于安全风险，参见：[2021年，用更现代的方法使用PGP（下） - 安全风险和争议， 被玩坏的KeyServer](https://ulyc.github.io/2021/01/26/2021%E5%B9%B4-%E7%94%A8%E6%9B%B4%E7%8E%B0%E4%BB%A3%E7%9A%84%E6%96%B9%E6%B3%95%E4%BD%BF%E7%94%A8PGP-%E4%B8%8B/#%E5%AE%89%E5%85%A8%E9%A3%8E%E9%99%A9%E5%92%8C%E4%BA%89%E8%AE%AE-%E8%A2%AB%E7%8E%A9%E5%9D%8F%E7%9A%84keyserver)

### 文件加密解密

```bash
# 文件加密（使用公钥）
gpg --recipient D50B14322C993EBE --output input.txt.gpg --encrypt input.txt
# 文件解密（使用私钥）
gpg --output input2.txt --decrypt input.txt.gpg
```

### 文件签名验证

```bash
# 文件签名 (使用私钥)，文件内容也包含到输出文件中（二进制）
gpg --output input.txt.gpg --sign input.txt
# 签名验证 (使用公钥)，文件内容也包含到输出文件中（ascii）
gpg --output input2.txt --decrypt input.txt.gpg

# 文件签名 (使用私钥)，文件内容也包含到输出文件中（二进制）
gpg --output input.txt.gpg --clearsign input.txt
# 签名验证 (使用公钥)，文件内容也包含到输出文件中（ascii）
gpg --output input2.txt --decrypt input.txt.gpg

# 文件签名 (使用私钥)，只生成签名文件，不包含原始内容（推荐）
gpg --output input.txt.asc --armor --detach-sign input.txt
# 签名验证 (使用公钥)
gpg --verify input.txt.asc input.txt
```

### git commit 签名

> 参考： [github docs](https://docs.github.com/cn/authentication/managing-commit-signature-verification/telling-git-about-your-signing-key) | [gitlab docs](https://docs.gitlab.com/ee/user/project/repository/gpg_signed_commits/)

按照上文，[添加 Sub Key](#添加-sub-key)，添加一个仅用于签名的 RSA SubKey，进行如下配置：

* 将 gpg public key 配置到代码托管平台。执行 `gpg --armor --export 89F61268D036DF3C3BA931C07C5D945596EE795B`，将输出的文本，上传到 Github/Gitlab 用户配置页的 GPG 秘钥配置项。
* 执行 `gpg --list-secret-keys --keyid-format long` 选取一个具有 `[S]` 用途的 key id 作为签名 key（即上面创建的用于签名的 sub key），执行 `git config --global user.signingkey 50235B5E033D3535`，告知 git 用于加密的 key。
* 如果是 Mac，需执行如下操作（zsh）：

    ```bash
    if [ -r ~/.zshrc ]; then echo 'export GPG_TTY=$(tty)' >> ~/.zshrc; \
    else echo 'export GPG_TTY=$(tty)' >> ~/.zprofile; fi
    brew install pinentry-mac
    echo "pinentry-program $(which pinentry-mac)" >> ~/.gnupg/gpg-agent.conf
    killall gpg-agent
    ```

最后，如果想为 commit 签名，git commit 需添加 -S 参数，如 `git commit -S -m "feat: 测试 git gpg 签名"`。如果默认开启签名，通过 `git config --global commit.gpgsign true` 配置项配置。

### SSH 登录

* 按照上文，[添加 Sub Key](#添加-sub-key)，添加一个仅用于身份验证（Authenticate）的 RSA SubKey。
* 配置步骤，参见：[2021年，用更现代的方法使用PGP（中）](https://ulyc.github.io/2021/01/18/2021%E5%B9%B4-%E7%94%A8%E6%9B%B4%E7%8E%B0%E4%BB%A3%E7%9A%84%E6%96%B9%E6%B3%95%E4%BD%BF%E7%94%A8PGP-%E4%B8%AD/#%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6)。

### 邮件加密

目前，主流电子邮件提供商，已经开启了全量的 SSL 加密，因此 GPG 在电子邮件场景的进行加密显得有些上古了，再次不多阐述了。

## 最佳实践

### UID 规划

在 GPG 中一个 Key 可以包含多个 UID，这就意味着，一个 Key 可以表示一个人的多种身份，比如，一个开发者，只有一个 Key，该 Key 包含如下 UID：

* `<公司用户名> <公司 Email>`
* `<开源用户名> <个人 Email>`

这种做法，是符合 GPG 的最佳实践的。但是，在现实中，这种做法可能存在一定的风险。

* 隐私风险，GPG Public Key 是公开的，所有人都可以都可以从 GPG Public Key 中获取到 UID 列表，且不可撤销。
* 法律风险，从该公司离职了，要怎么做呢？吊销公司 UID，吊销公司用的 Public Key？

因此，建议拆分成两个 Key，公司和个人的 GPG Key 分离。公司的 GPG Key 仅用于公司相关场景。个人的 GPG Key 仅用于个人相关场景。

### Sub Key 规划

GPG Key 中的 Primary Key，默认情况下具有两个能力，S 和 C，但按照 GPG 的设计，Primary Key 的作用仅仅用于管理 SubKey，而不用于具体的加密、签名、身份验证等具体场景。此外，尽量一个 SubKey 只做一个事情。

以上文 [添加 Sub Key](#添加-sub-key) 为例：

```
~/.gnupg/pubring.kbx
-----------------------------------
sec   rsa4096/7C5D945596EE795B 2022-07-17 [SC]
      89F61268D036DF3C3BA931C07C5D945596EE795B
uid                   [ 绝对 ] rectcircle <rectcircle96@gmail.com>
ssb   rsa4096/D50B14322C993EBE 2022-07-17 [E]
ssb   rsa4096/50235B5E033D3535 2022-07-17 [S]
ssb   rsa4096/CA45E598414ADA5F 2022-07-17 [A]
```

最后，添加了三个 subkey，分别用于：加密、签名和身份认证。

### 安全性和隐私

> 本部分主要参考： [2021年，用更现代的方法使用PGP（中）](https://ulyc.github.io/2021/01/18/2021%E5%B9%B4-%E7%94%A8%E6%9B%B4%E7%8E%B0%E4%BB%A3%E7%9A%84%E6%96%B9%E6%B3%95%E4%BD%BF%E7%94%A8PGP-%E4%B8%AD/#%E5%A4%87%E4%BB%BD%E7%AD%96%E7%95%A5)

#### 生成设备

个人的 GPG Key 建议使用非公司的个人设备生成，并避免联网。

#### 吊销证书备份

在上文 [生成 Primary Key](#生成-primary-key) 中可以看到，其命令生成了一个吊销证书的文件。

上文可以看到，在 Primary Key 未丢失的情况下，可以使用 Primary Key 直接吊销 SubKey 和 UID。

但是 GPG 提供了一种额外的安全机制，可以通过一个称为吊销证书的文件，来实现在 Primary Key 丢失的情况下，吊销整个 Public Key。

因此从安全性角度来看，吊销证书的重要性是大于 Primary Key，是整个系统最后的保证兜底手段。因此，吊销证书应该存在在比 Primary Key 更安全的地方，并多存储一份。

#### 主密钥备份

主要考虑到主密钥设备是用来管理 SubKey 的，如果其泄漏了，真个 Key 将都不可用了，影响范围过大。所以，基于前文提到的 Primary Key 不做加密、签名、身份验证等具体场景。建议：

* Primary Key 只离线保留一份。也就是说，建议生成完成 SubKey 备份完成后，彻底将 Primary Key 设备中删除。

#### 主密钥子秘钥备份

为了安全性，在完成 SubKey 的生成后，应该将 Primary Key 导出到安全的外部设备，如加密的 U 盘，云盘、私有 github 仓库等个人认为安全的地方。

Subkey 也需要备份，但是其安全等级低于 Primary Key。如果一个用于解密邮件的 SubKey 丢失了，可以用 Primary Key 直接吊销 SubKey，重新生成即可，不会造成不可挽回的后果。

但是用于加密文件的 SubKey 丢失后果还是很严重的，将导致加密后的文件永远无法打开了。因此，SubKey 也至少备份一份。

#### 公布 GPG Public Key

按照上文说明，可以将 GPG Public Key 通过 Key Server 公布到网络上。也可以将 GPG Public Key 公布到个人博客中。

需要注意的是，某些 Key Server 一旦公布将不能撤销，因此需要注意 UID 是否会泄漏个人隐私。

## 参考

* [GPG入门教程](https://www.ruanyifeng.com/blog/2013/07/gpg.html)
* [GPG 入门教程](https://blog.zhanganzhi.com/zh-CN/2022/06/1c71f69657ed)
* [2021年，用更现代的方法使用PGP（上）](https://ulyc.github.io/2021/01/13/2021%E5%B9%B4-%E7%94%A8%E6%9B%B4%E7%8E%B0%E4%BB%A3%E7%9A%84%E6%96%B9%E6%B3%95%E4%BD%BF%E7%94%A8PGP-%E4%B8%8A/)
* [2021年，用更现代的方法使用PGP（中）](https://ulyc.github.io/2021/01/18/2021%E5%B9%B4-%E7%94%A8%E6%9B%B4%E7%8E%B0%E4%BB%A3%E7%9A%84%E6%96%B9%E6%B3%95%E4%BD%BF%E7%94%A8PGP-%E4%B8%AD/)
* [2021年，用更现代的方法使用PGP（下）](https://ulyc.github.io/2021/01/26/2021%E5%B9%B4-%E7%94%A8%E6%9B%B4%E7%8E%B0%E4%BB%A3%E7%9A%84%E6%96%B9%E6%B3%95%E4%BD%BF%E7%94%A8PGP-%E4%B8%8B/)
* [archlinux GnuPG (简体中文)](https://wiki.archlinux.org/title/GnuPG_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))
* [GnuPG2使用指北](https://emacsist.github.io/2019/01/01/gnupg2%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8C%97)
* [Github 将您的签名密钥告知 Git](https://docs.github.com/cn/authentication/managing-commit-signature-verification/telling-git-about-your-signing-key)
* [Signing commits with GPG](https://docs.gitlab.com/ee/user/project/repository/gpg_signed_commits/)
