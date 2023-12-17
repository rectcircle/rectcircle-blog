---
title: "分布式存储之对象存储 (MinIO)"
date: 2023-12-16T18:39:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> 版本：TODO

## 简介

目前广泛使用对象存储的形态最早确定于 AWS S3

* 用于存储非结构化的数据（称为对象），如照片、音频、视频、二进制制品等（类似于文件系统的文件）。
* 对象通过唯一标识符访问（类似于文件系统的路径，但对象存储并不提供层次化的目录树的概念，是扁平的）。
* 对象在创建时除了指定唯一标识符外，还可以设置一些元数据（键值对格式）。
* 对象是不可变的，也就是说，一个对象一旦创建其元数据和内容不可改变，如需修改则只能覆盖。
* 对象标准的读写方式是一套标准的 HTTP API 协议进行，而 AWS S3 作为现代对象存储的缔造者，AWS S3 的 API 规范就是事实上的对象存储 API 标准。
* 对象存储由于业务简单；在存储容量，可以无限平行扩展，支持 EB 级甚至更高容量；采用分布式架构具有高可靠和高可用性。
* 所有主流的云厂商均提供对象存储服务，除了云厂商外，还有很多开源的项目可以自建对象存储服务如 MinIO。

本文，将重点介绍：

* 在单台 Linux 上部署一个单节点的 MinIO 。
* MinIO 的管理能力。
* AWS S3 核心 API。
* MinIO 的手动以及 Kubernetes 高可用部署。

## MinIO 单节点安装运行

```bash
# 安装
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# 运行
mkdir ~/minio
minio server ~/minio --console-address :9090
```

上述命令， minio 会暴露两个端口，分别是 9000 和 9090。其中 9000 是兼容 S3 的 API 接口，9090 是 minio 内置的管理控制台 UI。

minio 还提供了一个命令行工具 `mc`，可以通过如下命令安装配置。

```bash
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/mc

mc alias set local http://127.0.0.1:9000 minioadmin minioadmin
mc admin info local
```

## MinIO 管理

打开 http://127.0.0.1:9090， 输入 root 用户命和密码 (均为 `minioadmin`) 可以看到 MinIO Console 菜单向分为了三类：

* User 对象浏览、Access Token。
* Administrator bucket 管理、用户和权限管理等。
* Subscription 付费订阅的企业级能力，本文不做介绍。

### bucket 管理

对象存储系统使用 bucket 来组织对象，bucket 类似于一个文件系统， 上传的对象必然归属某个 bucket。

在创建 bucket 的时候，可以配置 bucket 的一些特性配置，这些配置会对该 bucket 下的所有对象生效，如版本化（同一个对象保存多版本），对象锁（避免被删除），Quota（数据量限制），保留规则（版本化的旧版本自动删除）。这部分内容本文不做介绍，有兴趣详见：[官方文档](https://min.io/docs/minio/kubernetes/upstream/administration/object-management.html)。

打开 [Bucket 创建页面](http://127.0.0.1:9090/buckets/add-bucket)， 创建一个名为 `bucket-test` 所有特性开关保持默认全部关闭的 bucket。

这里特别说明的是，可以通过 [Anonymous 页面](http://127.0.0.1:9090/buckets/bucket-test/admin/prefix)，配置该 bucket 的那些对象的可以被匿名访问，本例中，开启匿名访问，Prefix 为 `/`，Access 为 `readonly`。至此，可以通过 `<minioServer>/<bucketName>/<objectName>` 方式访问，如： `http://127.0.0.1:9000/bucket-test/dir1/dir2/file3`。

### 用户和权限管理

MinIO 采用 PBAC （Policy-Based Access Control , 基于策略的访问控制），有如下概念：

* 策略，定义对那些资源拥有哪些行为。
* 用户，鉴权主体，默认使用用户名密码认证，可以关联多个策略。
* 组，一组策略的集合，用户可以选择加入多个组，组下的用户继承该组关联所有策略。
* 服务账号 (Service Accounts, Access Keys)，用户可以创建多服务账号，服务账号默认会继承该用户的所有策略（也可以配置用户策略的一个子集），这个服务账号包含 Access Key 和 Secret Key，服务账号用于给开发者编写的程序与对象存储系统进行认证鉴权的方式。

上一步我们创建一个名为 `bucket-test` 的 bucket。这里基于如上机制，创建一个用户和服务账号，且约束其只能操作 `bucket-test`这个 bucket，步骤如下：

1. 打开 [Policies 页面](http://127.0.0.1:9090/policies)，点击新建，Policy Name 填写 `bucket-test-rw`，Write Policy 内容如下：

    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:*"
                ],
                "Resource": [
                    "arn:aws:s3:::bucket-test/*"
                ]
            }
        ]
    }
    ```

    * Version 为版本号。
    * Statement 为策略表达式数组，其中值包含一个对象。
        * `"Effect": "Allow"` 表示允许对 `Resource` 做 `Action`。
        * `Action` 表示允许执行的动作，`"s3:*"` 表示所有 AWS S3 API 可以执行所有操作都允许执行。
        * `Resource` 表示允许操作的资源， `"arn:aws:s3:::bucket-test"` 表示只允许操作 bucket 名为 `bucket-test` 的 bucket
    * 更多关于策略 JSON 的编写，参见：[官方文档](https://min.io/docs/minio/kubernetes/upstream/administration/identity-access-management/policy-based-access-control.html#policy-document-structure)。

2. 打开 [Identity - Users 页面](http://127.0.0.1:9090/identity/users)，点击创建用户，填写用户名 `bucket-test-user` 密码 `12345678` （仅测试）， Assign Policies 选择 `bucket-test-rw`，点击保存。

3. 退出登录 root 用户，使用上述创建账号登录，这个用户能看到 Administrator 菜单项只有 Buckets，只能管理 `bucket-test` 这个 bucket 了。

4. 打开 [Access Keys](http://127.0.0.1:9090/access-keys)，点击 Create Access Key 即可创建一个服务账号，可以获取到 Access Key 和 Secret Key （如  Access Key: `1qJ4sGlF6HzTWIHsakYK`，Secret Key: `UwkpCLEMX2ODx5Cg9FfsxGGokIWXRofFwO8Chiq0`）。需要注意的是，创建服务的 Secret Key 只有首次创建的时候才能获取，后续将服务从后台拿到，需谨慎保管。

至此，就可以通过上面创建的服务账号通过 AWS S3 API 操作这个 `bucket-test` 这个 bucket 了。

## AWS S3 API

MinIO 实现 [AWS S3 API](https://docs.aws.amazon.com/pdfs/AmazonS3/latest/API/s3-api.pdf#Type_API_Reference) 规范的最大子集 （未实现部分参见：[Minio 官方文档](https://min.io/docs/minio/linux/operations/concepts/thresholds.html#s3-api-limits)）。

本节，将通过如下示例了解 AWS S3 API：

* 使用 Go SDK 将构造一个目录存储到上传到上述的测试 Bucket，并查看元信息，下载内容。
* 这里我们使用 `github.com/minio/minio-go/v7` 来连接 Minio Server。

示例代码库： [rectcircle/learn-aws-s3-api](https://github.com/rectcircle/learn-aws-s3-api)。

```go
package main

import (
	"bytes"
	"context"
	"fmt"
	"io"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

func main() {
	// 配置参数
	ctx := context.Background()
	endpoint := "127.0.0.1:9000"
	accessKeyID := "1qJ4sGlF6HzTWIHsakYK"
	secretAccessKey := "UwkpCLEMX2ODx5Cg9FfsxGGokIWXRofFwO8Chiq0"
	useSSL := false

	// 初始化 minio 客户端
	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		panic(err)
	}

	// bucket 配置
	bucketName := "bucket-test"
	// location := "us-east-1"  // minio 部署的时候可以配置，默认测试的服务的默认值是 "us-east-1"

	// 测试数据
	// "dir1/file1" 为 object name，格式一般写法为类似于文件系统的路径，
	//              以 / 分割，但最前面不需要有 /，即使有也会被忽略 TrimPrefix 掉。
	testData := [][2]string{
		{"dir1/file1", "abcdef"},
		{"dir1/file2", "abcdef"},
		{"dir1/dir2/file3", "abcdef"},
		{"file2", "abcdef"},
	}

	// 上传文件
	for _, item := range testData {
		filePath := item[0]
		fileContent := item[1]

		info, err := minioClient.PutObject(ctx, bucketName, filePath, bytes.NewBufferString(fileContent), int64(len(fileContent)),
			minio.PutObjectOptions{
				ContentType: "text/plain", // 给对象设置 MIME 媒体类型，会影响匿名开发下载链接返回的媒体类型。
			})
		if err != nil {
			panic(err)
		}
		fmt.Printf("upload %s success\n", info.Key)
	}

	// 读取某个文件
	obj, err := minioClient.GetObject(ctx, bucketName, "file2", minio.GetObjectOptions{})
	if err != nil {
		panic(err)
	}
	content, err := io.ReadAll(obj)
	if err != nil {
		panic(err)
	}
	fmt.Printf("GetObject file2, content is %s\n", string(content))

	// 遍历读取文件
	// 特别说明的是，object name 仅仅是个字符串，没有目录的那种层级关系。因此：
	// 1. 要想类似于文件系统目录方式检索对象，其实现是基于字符串前缀的方式。
	// 2. 没有空目录的概念，如果想实现需要通过将目录元信息编码为一个对象。
	dir1RecursiveItemsChan := minioClient.ListObjects(ctx, bucketName, minio.ListObjectsOptions{
		Prefix:    "dir1",
		Recursive: true,
	})
	for item := range dir1RecursiveItemsChan {
		obj, err := minioClient.GetObject(ctx, bucketName, item.Key, minio.GetObjectOptions{})
		if err != nil {
			panic(err)
		}
		content, err := io.ReadAll(obj)
		if err != nil {
			panic(err)
		}
		fmt.Printf("ListObjects dir1, objectName is %s, content is %s\n", item.Key, string(content))
	}

	// 由于此 bucket 这设置了匿名访问，所以可以通过如下链接直接下载内容
	// curl http://127.0.0.1:9000/bucket-test/dir1/dir2/file3
}
```

输出如下：

```
upload dir1/file1 success
upload dir1/file2 success
upload dir1/dir2/file3 success
upload file2 success
GetObject file2, content is abcdef
ListObjects dir1, objectName is dir1/dir2/file3, content is abcdef
ListObjects dir1, objectName is dir1/file1, content is abcdef
ListObjects dir1, objectName is dir1/file2, content is abcdef
```

## MinIO 架构简述

上面我们部署的是一个单节点的 MinIO，这种部署方式只能用作学习和测试使用，不能在生产场景使用。本小结将简要介绍的 MinIO 在生产场景的架构特点。

和常规的分布式存储相比， MinIO 是去中心化的，也就是说:

* MinIO 没有 Master 节点。
* 所有 MinIO 节点都是对等的。
* 所有 MinIO 节点配置都相同。
* 所有 MinIO 节点都有集群的完整全貌。
* 任意一个 MinIO 节点都可以对外提供 HTTP 服务。

因此：

* 在部署之前需要规划好每个节点的磁盘数和配置，一旦确定后期将无法在线更改。
* MinIO 集群需要外部负载均衡器（如 Nginx）将流量均衡的打到 MinIO 节点。

值得特别说明的是：由于 MinIO server 是 Go 编写的，因此安装配置 MinIO 非常容易，只需要下载一个二进制文件，通过启动参数或环境变量给出整个集群的全貌配置以及磁盘配置即可。如：

```bash
minio server https://minio{1...4}.example.net/mnt/disk{1...4} https://minio{5...8}.example.net/mnt/disk{1...4}
```

关于扩容：

在过去 MinIO 提供了一种联邦集群的模式来进行扩容，但是这种需要引入一个中心化的存储，和 MinIO 的极简架构设计违背。因此，现在 MinIO 提供一种基于 Server Pool 的机制来给集群扩容。需要特别注意的是，目前的这种扩容会造成秒级的服务不可用（添加新的 Server Pool 后需要更改旧的节点的配置，将新的 Server Pool 加到配置里面，并在重启或启动所有节点，[官方文档](https://min.io/docs/minio/linux/operations/install-deploy-manage/expand-minio-deployment.html#expansion-is-non-disruptive)特别强调，不能滚动重启）。

关于 MinIO 架构，更多参见官方文档：

* [部署架构](https://min.io/docs/minio/linux/operations/concepts/architecture.html)
* [核心运维概念](https://min.io/docs/minio/linux/operations/concepts.html)
* [对已存在集群进行扩容](https://min.io/docs/minio/linux/operations/install-deploy-manage/expand-minio-deployment.html)
