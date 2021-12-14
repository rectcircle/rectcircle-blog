---
title: "Go Swagger"
date: 2021-12-12T20:33:35+08:00
draft: false
toc: true
comments: true
tags:
  - golang
---

## 简述

> [官方文档](https://goswagger.io/)

[swagger/OpenAPI](https://swagger.io/)，是一套业界标准的 HTTP API 描述标准。

[go-swagger](https://goswagger.io/)，是 Swagger 2.0 的 Go 语言的实现，以 cli 或 library 的方式，提供了如下能力：

* 从 swagger 规范文件生成服务器
* 从 swagger 规范文件生成客户端
* 从 swagger 规范文件（alpha 阶段）生成 CLI（命令行工具）
* 支持 jsonschema 和 swagger 提供的大多数功能，包括多态性
* 从带注释的 go 代码生成 swagger 规范文件
* 使用 swagger 规范文件的其他工具
* 强大的自定义功能，带有供应商扩展和可自定义的模板

## 安装

```bash
go install github.com/go-swagger/go-swagger/cmd/swagger@latest
swagger version
```

其他安装方式，参见：[官方文档](https://goswagger.io/install.html)

## 样例说明

> Github 代码库

### 新建项目

```bash
mkdir go-swagger-learn
go mod init github.com/rectcircle/go-swagger-learn
```

### 场景

假设我们要开发一个根据 UserID 获取用户信息的接口

```http
GET /users/{id}

# response 200
{
    "code": 0,
    "message": "success",
    "data": {
        "id": 1,
        "name":"abc"
    }
}
```

希望使用 go-swagger 实现如下功能。

* 根据代码生成 swagger 规范文件
* 根据 swagger 规范文件生成 client 代码

## 从代码生成 swagger 规范文件

> [官方文档](https://goswagger.io/generate/spec.html) | [博客 1](https://www.zybuluo.com/daduizhang/note/1412629)

### 例子

#### 编写代码和注释

首先定义 domain （简化起见，我们吧 dto 和 接口定义在了一起）

`domain/user.go`

```go
package domain

import (
	"context"
)

// User 实体
// swagger:model User
type User struct {
	// User ID
	ID int `json:"id"`
	// 用户名
	Name string `json:"name"`
}

type UserService interface {
	// swagger:route GET /users/{id} users GetOneUser
	//
	// 通过 ID 获取 User 信息
	//
	// 这是接口的详细描述
	//
	//     Responses:
	//       200: GetUserResponse
	Get(ctx context.Context, id int) (*User, error)
}
```

定义 http 请求和返回的声明

`domain/user_http.go`

```go
package domain

// swagger:parameters GetOneUser
type GetUserRequest struct {
	// User ID 参数
	//
	// Required: true
	// in: path
	ID int `json:"id"`
}

type BaseResponseBodyForSwagger struct {
	// 错误码
	Code int `json:"code"`
	// 错误信息
	Message string `json:"message"`
}

// swagger:response GetUserResponse
type GetUserResponse struct {
	// in: body
	Body struct {
		BaseResponseBodyForSwagger
		Data User `json:"data"`
	}
	// Body GetUserResponseBody
}
```

最后，添加 `swagger:meta` 注解

`domain/doc.go`

```go
// Package domian go swagger learn
//
// 这是描述
//
// Terms Of Service:
//
// 这是服务条款
//
//      Host: localhost
//      Version: 0.0.1
//
// swagger:meta
package domain
```

#### 执行命令生成 swagger 规范文件

```bash
swagger generate spec -o ./api/swagger.json
```

#### 生成文件内容

```json
{
  "swagger": "2.0",
  "info": {
    "description": "这是描述",
    "title": "go swagger learn",
    "termsOfService": "这是服务条款",
    "version": "0.0.1"
  },
  "host": "localhost",
  "paths": {
    "/users/{id}": {
      "get": {
        "description": "这是接口的详细描述",
        "tags": [
          "users"
        ],
        "summary": "通过 ID 获取 User 信息",
        "operationId": "GetOneUser",
        "parameters": [
          {
            "type": "integer",
            "format": "int64",
            "x-go-name": "ID",
            "description": "User ID 参数",
            "name": "id",
            "in": "path",
            "required": true
          }
        ],
        "responses": {
          "200": {
            "$ref": "#/responses/GetUserResponse"
          }
        }
      }
    }
  },
  "definitions": {
    "User": {
      "description": "User 实体",
      "type": "object",
      "properties": {
        "id": {
          "description": "User ID",
          "type": "integer",
          "format": "int64",
          "x-go-name": "ID"
        },
        "name": {
          "description": "用户名",
          "type": "string",
          "x-go-name": "Name"
        }
      },
      "x-go-package": "github.com/rectcircle/go-swagger-learn/domain"
    }
  },
  "responses": {
    "GetUserResponse": {
      "description": "",
      "schema": {
        "type": "object",
        "properties": {
          "code": {
            "description": "错误码",
            "type": "integer",
            "format": "int64",
            "x-go-name": "Code"
          },
          "data": {
            "$ref": "#/definitions/User"
          },
          "message": {
            "description": "错误信息",
            "type": "string",
            "x-go-name": "Message"
          }
        }
      }
    }
  }
}
```

#### 启动 server 观察文档

```bash
swagger serve api/swagger.json
```

#### 简单说明

* 在代码中使用 `// swagger:` 表示接下来的注释是 swagger 的注释，会用来生成 swagger 规范文件。
* 一个 http 接口的声明包含三个部分，接口描述，接口请求描述，接口返回描述。
* 接口描述注释：`// swagger:route [method] [path pattern] [?tag1 tag2 tag3] [operation id]`，允许位于任何位置
* 接口请求注释：`// swagger:parameters [operationid1 operationid2]` 必须在一个结构体声明上方，在内部通过 `in: body` 声明哪个字段是 body，注意字段名需要通过 `json` 注解声明。
* 接口返回注释：`// swagger:response [?response name]` 必须在一个结构体声明上方，在内部通过 `in: body` 声明哪个字段是 body，需要在 `// swagger:route` 下方关联上 response name。

### 命令行使用

```
Usage:
  swagger [OPTIONS] generate spec [spec-OPTIONS]

generate a swagger spec document from a go application

Application Options:
  -q, --quiet                  silence logs
      --log-output=LOG-FILE    redirect logs to file

Help Options:
  -h, --help                   Show this help message

[spec command options]
      -w, --work-dir=          the base path to use (default: .)
      -t, --tags=              build tags
      -m, --scan-models        includes models that were annotated with 'swagger:model'
          --compact            when present, doesn't prettify the json
      -o, --output=            the file to write to
      -i, --input=             an input swagger file with which to merge
      -c, --include=           include packages matching pattern
      -x, --exclude=           exclude packages matching pattern
          --include-tag=       include routes having specified tags (can be specified many times)
          --exclude-tag=       exclude routes having specified tags (can be specified many times)
          --exclude-deps       exclude all dependencies of project
```

### 注释规范

参考：[官方文档](https://goswagger.io/use/spec.html)

## 从 swagger 规范文件生成 client 代码

> [官方文档](https://goswagger.io/generate/client.html)

### 例子

```bash
mkdir -p client/internal
# swagger generate client -f api/swagger.json   --client-package=client/internal/client --model-package=client/internal/domain
swagger generate client -f api/swagger.json  --target=client/internal
go mod tidy
```

注意，model 不能复用我们手写的 `domain` 下的代码文件，因为 go-swagger 生成代码依赖 model 实现序列化和反序列函数。手动写的的是不存在这些的。

生成到 client/internal 的原因是，某些场景希望再包装一层，提供更加优化的接口，再暴露给其他人使用（多数情况下，没有必要）。

### 命令行使用

```
Usage:
  swagger [OPTIONS] generate client [client-OPTIONS]

generate all the files for a client library

Application Options:
  -q, --quiet                                                                     silence logs
      --log-output=LOG-FILE                                                       redirect logs to file

Help Options:
  -h, --help                                                                      Show this help message

[client command options]
      -c, --client-package=                                                       the package to save the client specific code (default: client)
      -P, --principal=                                                            the model to use for the security principal
          --default-scheme=                                                       the default scheme for this API (default: http)
          --principal-is-interface                                                the security principal provided is an interface, not a struct
          --default-produces=                                                     the default mime type that API operations produce (default: application/json)
          --default-consumes=                                                     the default mime type that API operations consume (default: application/json)
          --skip-models                                                           no models will be generated when this flag is specified
          --skip-operations                                                       no operations will be generated when this flag is specified
      -A, --name=                                                                 the name of the application, defaults to a mangled value of info.title

    Options common to all code generation commands:
      -f, --spec=                                                                 the spec file to use (default swagger.{json,yml,yaml})
      -t, --target=                                                               the base directory for generating the files (default: ./)
          --template=[stratoscale]                                                load contributed templates
      -T, --template-dir=                                                         alternative template override directory
      -C, --config-file=                                                          configuration file to use for overriding template options
      -r, --copyright-file=                                                       copyright file used to add copyright header
          --additional-initialism=                                                consecutive capitals that should be considered intialisms
          --allow-template-override                                               allows overriding protected templates
          --skip-validation                                                       skips validation of spec prior to generation
          --dump-data                                                             when present dumps the json for the template generator instead of generating files
          --strict-responders                                                     Use strict type for the handler return value
          --with-expand                                                           expands all $ref's in spec prior to generation (shorthand to --with-flatten=expand)
          --with-flatten=[minimal|full|expand|verbose|noverbose|remove-unused]    flattens all $ref's in spec prior to generation (default: minimal, verbose)

    Options for model generation:
      -m, --model-package=                                                        the package to save the models (default: models)
      -M, --model=                                                                specify a model to include in generation, repeat for multiple (defaults to all)
          --existing-models=                                                      use pre-generated models e.g. github.com/foobar/model
          --strict-additional-properties                                          disallow extra properties when additionalProperties is set to false
          --keep-spec-order                                                       keep schema properties order identical to spec file
          --struct-tags=                                                          the struct tags to generate, repeat for multiple (defaults to json)

    Options for operation generation:
      -O, --operation=                                                            specify an operation to include, repeat for multiple (defaults to all)
          --tags=                                                                 the tags to include, if not specified defaults to all
      -a, --api-package=                                                          the package to save the operations (default: operations)
          --with-enum-ci                                                          allow case-insensitive enumerations
          --skip-tag-packages                                                     skips the generation of tag-based operation packages, resulting in a flat generation
```

### 更多参见

[官方文档](https://goswagger.io/generate/client.html)
