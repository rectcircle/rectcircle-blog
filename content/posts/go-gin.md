---
title: "Go Gin Web 框架"
date: 2020-11-15T20:46:35+08:00
draft: false
toc: true
comments: true
tags:
  - web
  - golang
---

## 快速开始

### 参考

* [官网](https://gin-gonic.com/zh-cn/)
* [本文例子](https://github.com/rectcircle/gin-learn)

### 官方表述

* **快** 基于 Radix 树的路由，小内存占用。没有反射。可预测的 API 性能。
* **支持中间件** 传入的 HTTP 请求可以由一系列中间件和最终操作来处理。 例如：Logger，Authorization，GZIP，最终操作 DB。
* **Crash-free** Gin 可以 catch 一个发生在 HTTP 请求中的 panic 并 recover 它。这样，你的服务器将始终可用。例如，你可以向 Sentry 报告这个 panic！
* **JSON 校验** Gin 可以解析并验证请求的 JSON，例如检查所需值的存在。
* **路由组** 更好地组织路由。是否需要授权，不同的 API 版本…… 此外，这些组可以无限制地嵌套而不会降低性能。
* **错误管理** Gin 提供了一种方便的方法来收集 HTTP 请求期间发生的所有错误。最终，中间件可以将它们写入日志文件，数据库并通过网络发送。
* **支持内建渲染** Gin 为 JSON，XML 和 HTML 渲染提供了易于使用的 API。
* **可扩展** 创建新的中间件非常容易，只需查看 [示例代码](https://gin-gonic.com/zh-cn/docs/examples/using-middleware/) 即可。

### Hello World

> go version 1.15+ , gin version 1.6.3

创建项目

```go
mkdir gin-learn
cd gin-learn
go mod init github.com/rectcircle/gin-learn
```

`main.go`

```go
package main

import "github.com/gin-gonic/gin"

func main() {
	r := gin.Default()
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})
	r.Run() // 监听并在 0.0.0.0:8080 上启动服务
}
```

## 功能特性

### 基本用法

* 路由为 `"/ping"` ，则 `/ping/` 将重定向到 `/ping`
* 路由为 `"/ping/"` ，则 `/ping` 将重定向到 `/ping/`

```go
    // 创建 gin 引擎
    r := gin.Default()
    // r.http方法("路由", 处理函数)
    // 处理函数/中间件函数: func(*gin.Context)
    // http://127.0.0.1:8080/ping
    // http://127.0.0.1:8080/ping/ 将重定向到 上一个
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})
```

### 路由注册 和 HTTP 方法

> [HTTP 方法](https://gin-gonic.com/zh-cn/docs/examples/http-method/)

```go
func handler(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "ok",
	})
}

func routerMethod(r *gin.Engine) {
	r.GET("router/method", handler)
	r.POST("router/method", handler)
	r.PUT("router/method", handler)
	r.PATCH("router/method", handler)
	r.DELETE("router/method", handler)
	r.HEAD("router/method", handler)
	r.OPTIONS("router/method", handler)
	r.Any("router/any", handler)  // 匹配所有方法
	// r.Handle // 最终调用的函数
}
```

### 请求参数

#### 路径参数

* `router/request/path/require/:requirePathParam` 语法 `:requirePathParam` 匹配一个路径参数，必须存在
    * 使用 `*gin.Context.Param("requirePathParam")` 提取
    * 可以匹配 `router/request/path/require/1` `router/request/path/require/1/`，`*gin.Context.Param("requirePathParam")` 将返回 `1`
    * 无法可以匹配 `router/request/path/require/` `router/request/path/require`
* `router/request/path/remain/*remainPathParam` 语法 `*remainPathParam` 将匹配剩余全部
    * 使用 `*gin.Context.Param("requirePathParam")` 提取
    * 可以匹配 `router/request/path/remain/1` `router/request/path/remain/1/` 提取将返回 `/1`
    * 可以匹配 `router/request/path/remain/` `router/request/path/remain` 提取将返回 `/`

```go
	// 可以匹配 router/request/path/require/1 router/request/path/require/1/
	// 无法可以匹配 router/request/path/require/ router/request/path/require
	r.GET("router/request/path/require/:requirePathParam", func(c *gin.Context) {
		c.String(http.StatusOK, "requirePathParam = %s", c.Param("requirePathParam"))
	})
	// 可以匹配 router/request/path/remain/1 router/request/path/remain/1/
	// 可以匹配 router/request/path/remain/ router/request/path/remain
	r.GET("router/request/path/remain/*remainPathParam", func(c *gin.Context) {
		c.String(http.StatusOK, "remainPathParam = %s", c.Param("remainPathParam"))
	})
```

#### Query 参数

* `*gin.Context.Query(key)` 获取 query 不存在返回空串，多个返回第一个
* `*gin.Context.GetQuery(key)` 类似于 `Query`，返回 `(string, bool)`
* `*gin.Context.DefaultQuery(key, default)` 获取 query 不存在返回default，多个返回第一个
* `*gin.Context.QueryArray(key)` 获取 query，支持多个，返回切片
* `*gin.Context.GetQueryArray(key)` 类似于 `QueryArray`
* `*gin.Context.QueryMap(key)` 获取 query，类似 `map[key]` 的方式传参，返回map
* `*gin.Context.GetQueryMap(key)` 类似于 `QueryMap`

```go
	// Query 参数
	// http://127.0.0.1:8080/router/request/query?queryParam=123&queryParam=321&queryArr=1&queryArr=2&queryMap[a]=1&queryMap[b]=2
	// 返回 queryParam = 123, queryParamWithDefault = default, queryArr = [1 2], queryMap = map[a:1 b:2]
	r.GET("router/request/query", func(c *gin.Context) {
		c.String(http.StatusOK, "queryParam = %s, queryParamWithDefault = %s, queryArr = %s, queryMap = %s",
			c.Query("queryParam"),
			c.DefaultQuery("queryParamWithDefault", "default"),
			c.QueryArray("queryArr"),
			c.QueryMap("queryMap"),
		)
	})
```

#### Form 参数

> Context-Type 为 application/x-www-form-urlencoded 或 multipart/form-data

类似于 Query 参数，方法名中的 Query 替换为 Form 即可，例如

* `*gin.Context.Form(key)`
* `*gin.Context.GetForm(key)`
* `*gin.Context.DefaultForm(key)`
* 等

#### 文件上传

> Context-Type 为 multipart/form-data

配置最大 内存 （默认 32 M）

* `*gin.Engine.MaxMultipartMemory = 8 << 20  // 8 MiB`

API

* `file, _ := *gin.Context.FormFile(key)` 获取文件信息
* `*gin.Context.SaveUploadedFile(file, dst)` 保存到磁盘

参考

* [单文件](https://gin-gonic.com/zh-cn/docs/examples/upload-file/single-file/)
* [多文件](https://gin-gonic.com/zh-cn/docs/examples/upload-file/multiple-file/)

#### Header 和 Cookie

#### 请求绑定到自定义结构体

https://gin-gonic.com/zh-cn/docs/examples/binding-and-validation/

Gin 内建支持将各种请求参数绑定到一个自定义结构。

支持的类型的请求参数的绑定：

* JSON (`json:`)
* XML (`xml:`)
* YAML (`yaml:`)
* FORM 和 Query (`form:`)
* Header (`header:`)
* 路径参数 (`uri:`)
* 其他参见： [Go Doc](https://pkg.go.dev/github.com/gin-gonic/gin@v1.6.3/binding#pkg-variables)

相关 API

* `*gin.Context.MustBindWith(interface{}, binding.Binding)` 如果校验失败，返回 400，并将失败写入 Response，并返回 `error`
* `*gin.Context.Bind(interface{})` 根据 `Content-Type` 选择 `binding.Binding` 的实现者，然后调用 `MustBindWith`
* `*gin.Context.BindXxx(interface{})` 系列快捷方法，比如 `JSON`、`XML` 等，最终调用 `MustBindWith`
* `*gin.Context.ShouldBindWith(interface{}, binding.Binding)` 校验失败，仅返回 `error`
* `*gin.Context.ShouldBind(interface{}, binding.Binding)` 根据 `Content-Type` 选择 `binding.Binding` 的实现者，然后调用 `ShouldBindWith`
* `*gin.Context.ShouldBindXxx(interface{})` 系列快捷方法，比如 `JSON`、`XML` 等，最终调用 `ShouldBindWith`

结构体示例

```go
type User struct {
    User     string `json:"user"`
    Password string
    Accept string
}
```

* 没有 Tag 的，HTTP 请求中需要绑定的 key 必须和 字段名 完全相等（大小写敏感）才能绑定成功
* 有 Tag 的，以 Tag 为准
* 字段绑定 tag，格式为 `$type:"字段名"`，支持多个，常用的 `$type` 参见 上文的 **支持的类型的请求参数的绑定**
* 字段校验，参见下一小节

例子

```go
	r.GET("router/request/bind", func(c *gin.Context) {
		// curl http://127.0.0.1:8080/router/request/bind\?User\=xiaoming\&password\=312
		// user = {xiaoming  */*}
		user := struct {
			User     string `json:"user"`
			Password string
			Accept string
		} {}
		c.BindHeader(&user)
		c.Bind(&user)
		c.String(http.StatusOK, "user = %s", user)
	})
```

#### 请求参数校验

Gin 提供了内建的参数校验功能，该功能需要与参数绑定结合使用。使用方式如下

* 定义结构体
* 添加 `binding:"参数校验器"` 全部参见 [`go-playground/validator.v8`](https://godoc.org/gopkg.in/go-playground/validator.v8#hdr-Baked_In_Validators_and_Tags)
* 使用 Bind 系列函数，返回 `err != nil` 说明校验失败

#### 参数绑定和参数校验补充说明

* 自定义参数绑定（不建议）：实现 `binding.Binding` 接口
* 自定义参数校验器：[官方示例](https://gin-gonic.com/zh-cn/docs/examples/custom-validators/)
* 其他的参数绑定 tag 的用法：[官方单元测试](https://github.com/gin-gonic/gin/blob/master/binding/binding_test.go)

### 返回消息

#### 常用API

假设 `var c *gin.Context`

* 返回 JSON `c.JSON(状态码, 结构体)` （特殊 HTML 字符将会被转义为 Unicode 转义字符）
* 返回 AsciiJSON 非 ASCII 码将使用 Unicode 转义字符串表示 `c.AsciiJSON(状态码, 结构体)`
* 返回 PureJSON `c.PureJSON(状态码, 结构体)` （不做任何转义）
* 返回 安全 JSON `c.SecureJSON(状态码, 结构体)` 用于防止 json 劫持，在JSON基础上添加 `while(1),` 前缀
* 返回 JSONP `c.JSONP(状态码, 结构体)` `?callback=x` 将返回：`x({\"foo\":\"bar\"})`
* 返回 格式化 JSON（仅用于开发） `c.IndentedJSON(状态码, 结构体)`
* 返回 YAML `c.YAML(状态码, 结构体)`
* 返回 XML `c.XML(状态码, 结构体)`
* 返回 字符串 `c.String(code int, format string, values ...interface{})`
* 返回 ProtoBuf `c.ProtoBuf(状态码, 结构体)`
* 重定向 `c.Redirect(状态码, 重定向地址)`
* 返回 字节数组 `c.Data(code int, contentType string, data []byte)`
* 从 Reader 中返回数据 `c.DataFromReader(code int, contentLength int64, contentType string, reader io.Reader, extraHeaders map[string]string)`
* 文件返回等参见 [Doc](https://pkg.go.dev/github.com/gin-gonic/gin@v1.6.3#Context)

#### 例子

```go
	responseStruct := struct {
		Name  string
		Email string
	}{
		Name:  "xiaoming",
		Email: "xiaoming@example.com",
	}

	r.GET("router/response/json", func(c *gin.Context) {
		c.JSON(http.StatusOK, responseStruct)
	})
	r.GET("router/response/yaml", func(c *gin.Context) {
		c.YAML(http.StatusOK, responseStruct)
	})
	r.GET("router/response/xml", func(c *gin.Context) {
		c.XML(http.StatusOK, responseStruct)
	})
```

### 路由组

* `func (*gin.RouterGroup).Group(relativePath string, handlers ...gin.HandlerFunc) *gin.RouterGroup`
* 支持多级路由组

```go
func routerGroup(r *gin.Engine) {
	handler := func(c *gin.Context) {
		c.String(http.StatusOK, "Hello")
	}
	// 简单的路由组: v1
	v1 := r.Group("/router/group/v1")
	{
		v1.GET("/hello", handler)
	}

	// 简单的路由组: v2
	v2 := r.Group("/router/group/v2")
	{
		v2.GET("/hello", handler)
	}
	// curl http://127.0.0.1:8080/router/group/v1/hello
	// curl http://127.0.0.1:8080/router/group/v2/hello
}
```

### 中间件

`gin.Default()` 将默认注册两个中间件

* `gin.Logger()`
* `gin.Recovery()`

不使用以上默认中间件：使用 `gin.New()` 创建

在 Gin 中，中间件本质上是一个函数，该函数和业务函数声明是一致的。均为 `type gin.HandlerFunc func(*gin.Context)`

一般一个中间件的逻辑以  `gin.Context.Next()` 为分割点，在该函数调用前为请求前的处理，调用后为请求后的处理。

注意：当在中间件或 handler 中启动新的 Goroutine 时，不能使用原始的上下文，必须使用只读副本（`*gin.Context.Copy()`）。

注册方式

* 全局使用 `*gin.Engine.Use(middleware ...gin.HandlerFunc)`
* 路由组使用 `*gin.RouterGroup.Use(middleware ...gin.HandlerFunc)`
* 单个路由使用 `*gin.RouterGroup.GET等(relativePath string, handlers ...HandlerFunc)` handlers 可以是中间件

例子

```go
func MyLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		t := time.Now()

		// 设置 example 变量
		c.Set("example", "12345")

		// 请求前

		c.Next()

		// 请求后
		latency := time.Since(t)

		// 获取发送的 status
		status := c.Writer.Status()

		log.Printf("latency=%s, status=%d", latency, status)
	}
}

func routerWithMiddleware(r *gin.Engine) {
	group := r.Group("router/group/middleware")
	group.Use(MyLogger())
	group.GET("/hello", func(c *gin.Context) {
		example := c.MustGet("example").(string)
		c.String(http.StatusOK, "example = %s", example)
	})
	// curl http://127.0.0.1:8080/router/group/middleware/hello
}
```

### 模板

* `*gin.Context.HTML(code int, name string, obj interface{})` 支持 `template/html` 模板，[参见](https://gin-gonic.com/zh-cn/docs/examples/html-rendering/)，name 为相对路径，查找基于 `pwd`
* [多模板参见](https://gin-gonic.com/zh-cn/docs/examples/multiple-template/)

### 静态资源与静态资源嵌入

* [官方文档参见](https://gin-gonic.com/zh-cn/docs/examples/serving-static-files/)
* [静态资源嵌入参见](https://gin-gonic.com/zh-cn/docs/examples/bind-single-binary-with-template/)

### 运行多个服务

[参见](https://gin-gonic.com/zh-cn/docs/examples/run-multiple-service/)

## 官方例子

[例子代码库](https://github.com/gin-gonic/examples)

## 测试

[官方文档](https://gin-gonic.com/zh-cn/docs/testing/)

```go
package main

func setupRouter() *gin.Engine {
	r := gin.Default()
	r.GET("/ping", func(c *gin.Context) {
		c.String(200, "pong")
	})
	return r
}

func main() {
	r := setupRouter()
	r.Run(":8080")
}
```

测试代码

```go
package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestPingRoute(t *testing.T) {
	router := setupRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/ping", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	assert.Equal(t, "pong", w.Body.String())
}
```

## 常见中间件

https://github.com/gin-contrib

## 最佳实践

### 项目结构

TODO
