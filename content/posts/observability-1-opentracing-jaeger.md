---
title: "可观测性（一）Opentracing & Jaeger"
date: 2022-10-30T21:45:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

> Opentracing Version: 1.1 | Jaeger version: 1.38

实验代码库： [rectcircle/learn-observability](https://github.com/rectcircle/learn-observability)。

## 业界背景

OpenTracing 通过提供平台无关、厂商无关的 API，使得开发人员能够方便的添加（或更换）追踪系统的实现。在 2016 年 11 月, CNCF (云原生计算基金会) 技术委员会投票接受 OpenTracing 作为Hosted 项目，这是 CNCF 的第三个项目，第一个是 Kubernetes，第二个是 Prometheus。

2022 年 1 月 31 日，CNCF 正式宣布 OpenTracing 归档，OpenTracing 和 OpenCensus 一起合并到了 OpenTelemetry，并提供了 OpenTracing 的[兼容层](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/compatibility/opentracing.md)，更多参见： [CNCF 博客](https://www.cncf.io/blog/2022/01/31/cncf-archives-the-opentracing-project/) 和 [github issue](https://github.com/opentracing/specification/issues/163)。

> 💡 OpenTelemetry和 OpenCensus 相比不支持 metrics。

由于 OpenTracing 归档不久，因此应该有很多历史项目仍然在使用 OpenTracing，因此了解 OpenTracing 仍十分有必要。

## 解决的问题

在单体应用中，用户请求只会由一个服务进行处理。在这种场景，只需要在上报日志和指标时，携带唯一的无状态的请求 ID，即方便的检索某个请求的日志和指标。

而随着微服务的到来，用户请求在后端会形成一个多个微服务之间的调用链。在这种场景，如何方便的检索某个请求涉及的所有微服务的请求日志和指标，是一个亟需解决的问题。

OpenTracing 就是一个解决该问题的业界标准，其定义了如下概念：

* Trace: 调用链，一般情况下，一个用户请求就会形成一个调用链，调用链是一个有向无环图。
* Span: 一次调用，在微服务场景一般定义为一次 RPC 调用。Span 时 Trace 这个有向无环图的节点。

有了这两个概念，就可以解决如上问题，流程如下所示：

* 用户的请求到达第一个服务的处理函数时，会生成一个 TraceID_1、SpanID_1。
    * 该服务上报日志、指标时，会携带 TraceID_1、SpanID_1 这两个参数。
    * 该服务调用其他微服务时，会将 TraceID_1、SpanID_1 作为隐含参数传递下去。
* 某服务的某个函数被调用时，会解析使用传递过来的 TraceID_1，并创建新的 SpanID_2。
    * 该服务上报日志、指标时，会携带 TraceID_1、SpanID_2、上一级的 SpanID_1、两个 Span 的关系。
    * 该服务调用其他微服务时，会将 TraceID_1、SpanID_2 作为隐含参数传递下去，依次类推。
* 在查询时，通过 TraceID_1 或者 SpanID_1、SpanID_2， 即可方便的检索某个请求涉及的所有微服务的请求日志和指标。
* 其他说明
    * 通过如上推演，日志和指标在上报和存储上，携带 `<TraceID, SpanID, PreviousSpanID, Relation>` 四元组即可。
    * 需要记录每个 `SpanID` 的起止时间，这样可以很方便分析整个 Trace 中哪个 Span 的耗时情况。
    * OpenTracing 标准只定义的上报用的客户端的概念和 API 标准，参见下文。而以上所有 TraceID 并不在 OpenTracing 标准中，也就是说 Trace 是隐式的，因为通过 Span 的关系即可获取到整个有向无环图。

以上就是 OpenTracing 的核心部分的概念和实现流程推演，除此之外，OpenTracing 值得一提的：

* 上面的 SpanID_1 和 SpanID_2 的关系是父子关系（`ChildOf`），父子关系一般是同步调用，父需要等待子的完成。OpenTracing 还定义了一种跟随关系 （`FollowsFrom`），跟随关系一般是异步调用，父不需要等待子的完成，在微服务场景，通过消息队列的异步处理可以使用 `FollowsFrom` 关系。
* Span 可以关联如下内容：
    * Tags 类型为 `map[string]字符串,bool,数字`。
    * Log 包含如下字段：
        * `map[string]any`
        * 可选的时间
* 从上文可以看出，如果想使用 OpenTracing，需要再 RPC 调用时，传递 TraceID 和 SpanID 这两个参数（被称为 SpanContext）。除了这两个参数外，OpenTracing 还可以在 RPC 调用过程中传递一个 `map[string]string` 类型的数据 baggage （注意该特性存在较大的开销）。

## OpenTracing 标准实现 Jaeger

[Uber 开源的 Jaeger](https://www.jaegertracing.io/) 是 OpenTracing 的一个标准的后端实现。关于的[架构](https://www.jaegertracing.io/docs/1.38/architecture/)和[部署](https://www.jaegertracing.io/docs/1.38/deployment/)，本文不过多介绍。

本部分将主要介绍，通过 Docker 一键启动一个 Jaeger 服务，以及 Jaeger 客户端的使用。

### 一键启动

> [Jaeger Getting Started](https://www.jaegertracing.io/docs/1.38/getting-started/)

```bash
docker run --rm -it --name jaeger \
  -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 \
  -e COLLECTOR_OTLP_ENABLED=true \
  -p 6831:6831/udp \
  -p 6832:6832/udp \
  -p 5778:5778 \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  -p 14250:14250 \
  -p 14268:14268 \
  -p 14269:14269 \
  -p 9411:9411 \
  jaegertracing/all-in-one:1.38
```

### 创建 Tracer

`Jaeger` 提供了多种语言的客户端，这里仅介绍 Go 语言的客户端库 [uber/jaeger-client-go](https://github.com/uber/jaeger-client-go)。通过该库可以创建一个实现了 [opentracing/opentracing-go](https://github.com/opentracing/opentracing-go) 接口的客户端。

`01-opentracing/tracing/tracing.go`

```go
package tracing

import (
	"fmt"

	"github.com/uber/jaeger-client-go/rpcmetrics"

	"github.com/opentracing/opentracing-go"
	"github.com/uber/jaeger-client-go/config"
)

// 创建一个 Jaeger opentracing.Tracer
func NewTracer(serviceName string) (opentracing.Tracer, error) {
	cfg := &config.Configuration{
		// 服务名
		ServiceName: serviceName,
		// 采样配置
		// 以创建 tracing 的节点的配置有效，如 A -> B -> C，则 A 采样策略生效，B、C 遵循 A 的决定。
		Sampler: &config.SamplerConfig{
			// 更多参见：https://www.jaegertracing.io/docs/1.38/sampling/#client-sampling-configuration
			// const: Param 为 1 表示全部采样（全部上报），为 0 关闭采样（永远不上报），
			Type:  "const",
			Param: 1,
		},
		Reporter: &config.ReporterConfig{
			// 将 span 提交日志，上报到外部日志服务
			LogSpans: true,
		},
	}
	_, err := cfg.FromEnv()
	if err != nil {
		return nil, fmt.Errorf("cannot parse Jaeger env vars: %s", err)
	}

	metricsFactory := NewJaegerMetricsFactory()
	tracer, _, err := cfg.NewTracer(
		// 用来记录 Jaeger 自身的一些错误以及 Span 提交（需启用 Reporter.LogSpans），到外部日志服务。
		config.Logger(NewJaegerLogger()),
		// 用来上报 Span 的一些统计指标到外部 Metrics 服务。
		config.Metrics(metricsFactory),
		// 用来观察 Span 创建的事件。
		config.Observer(rpcmetrics.NewObserver(metricsFactory, rpcmetrics.DefaultNameNormalizer)),
	)
	if err != nil {
		return nil, fmt.Errorf("cannot initialize Jaeger Tracer: %s", err)
	}
	return tracer, nil
}
```

Jaeger 创建 `opentracing.Tracer` 的配置可以分为如下两类：

* `Tracer` 的配置
    * 服务名
    * 采样器
* `Jaeger` 自身的监控
    * Span 提交日志
    * Span 相关的指标
    * Span 创建事件的回调函数

最终返回的 `opentracing.Tracer` 是 OpenTracing 标准定义的，参见下文。

## 编程接口 API

> [OpenTracing语义标准](https://opentracing-contrib.github.io/opentracing-specification-zh/specification.html) | [opentracing/opentracing-go](https://github.com/opentracing/opentracing-go)

示例参见：`01-opentracing/tracing/tracing_test.go`

### 创建和完成 Span

```go
func Service2B(tracer2 opentracing.Tracer, httpHeader http.Header) {
	// 准备 Span 一个，一般在中间件中实现，反序列化 SpanContext
	var BSpan opentracing.Span
	tags := opentracing.Tags{"b": 2}
	previousContext, err := tracer2.Extract(opentracing.HTTPHeaders, httpHeader)
	if err == nil {
		BSpan = tracer2.StartSpan("B", tags, opentracing.ChildOf(previousContext))
	} else {
		BSpan = tracer2.StartSpan("B", tags)
	}
	defer BSpan.Finish()

	// ...
}

func Service1A(tracer1, tracer2 opentracing.Tracer) {
	// 准备 Span 一个，一般在中间件中实现
	ASpan := tracer1.StartSpan("A", opentracing.Tags{"a": 1})
	defer ASpan.Finish()

	// ...
}
```

* 函数声明：
[`StartSpan(operationName string, opts ...StartSpanOption) Span`](https://pkg.go.dev/github.com/opentracing/opentracing-go@v1.2.0#Tracer)
* 可用 StartSpanOption：
    * [`opentracing.Tags`](https://pkg.go.dev/github.com/opentracing/opentracing-go@v1.2.0#Tags) 或 [`opentracing.Tag`](https://pkg.go.dev/github.com/opentracing/opentracing-go@v1.2.0#Tag) 配置该 Span 的 Tag。
    * [`opentracing.ChildOf`](https://pkg.go.dev/github.com/opentracing/opentracing-go@v1.2.0#ChildOf) 指定上一级的 SpanContext，且关系为 ChildOf。
    * [`opentracing.FollowsFrom`](https://pkg.go.dev/github.com/opentracing/opentracing-go@v1.2.0#FollowsFrom) 指定上一级的 SpanContext，且关系为 FollowsFrom。
    * [`opentracing.StartTime`](https://pkg.go.dev/github.com/opentracing/opentracing-go@v1.2.0#StartTime) 指定该 Span 的开始时间。
* 通过 `Span.Finish` 函数可以结束一个 Span。

### 记录 Span 日志

```go
func Service1A(tracer1, tracer2 opentracing.Tracer) {
	// ...
	ASpan.LogFields(log.String("message", "Service1A called"))
	// ...
}
```

* 函数声明参见：[`Span.LogFields(fields ...log.Field)`](https://pkg.go.dev/github.com/opentracing/opentracing-go@v1.2.0#Span) 或 [`Span.LogKV(alternatingKeyValues ...interface{})`](https://pkg.go.dev/github.com/opentracing/opentracing-go@v1.2.0#Span)。

### 设置和读取 Span 的 baggage

```go
func Service1A(tracer1, tracer2 opentracing.Tracer) {
	// ...
	ASpan.SetBaggageItem("BaggageA", "123")
	// ...
}

func Service2B(tracer2 opentracing.Tracer, httpHeader http.Header) {
	// ...
	// 业务逻辑
	BSpan.LogFields(
		log.String("message", "Service2B called"),
		log.String("BaggageA", BSpan.BaggageItem("BaggageA")),
	)
}
```

* 通过 [`Span.SetBaggageItem(restrictedKey, value string)`](https://pkg.go.dev/github.com/opentracing/opentracing-go@v1.2.0#Span) 可以设置 Baggage 一对 key、value，Baggage 会传递到与之关联的 Span 中。
* 通过 [`Span.BaggageItem(restrictedKey string) string`](https://pkg.go.dev/github.com/opentracing/opentracing-go@v1.2.0#Span) 可以读取 Baggage 一个 key 的数据，如果不存在则返回空字符串。
* 注意：在 jaeger 实现中，如果序列化的格式是 `opentracing.TextMap`、`opentracing.HTTPHeaders` 时，反序列化后 Baggage 的 key 将转换为全部小写。

### SpanContext 序列化和反序列化

```go
func TestExtractAndInject(t *testing.T) {
	tracer, err := NewTracer("test")
	if err != nil {
		t.Fatal(err)
	}
	rootSpan := tracer.StartSpan("root")
	rootSpan.SetBaggageItem("BaggageRoot", "456")

	textMapCarrier := opentracing.TextMapCarrier{}
	tracer.Inject(rootSpan.Context(), opentracing.TextMap, textMapCarrier)
	fmt.Printf("=== textMapCarrier: %v\n", textMapCarrier)
	httpHeaderCarrier := opentracing.HTTPHeadersCarrier(http.Header{})
	tracer.Inject(rootSpan.Context(), opentracing.HTTPHeaders, httpHeaderCarrier)
	fmt.Printf("=== httpHeaderCarrier: %v\n", httpHeaderCarrier)
	binaryCarrier := &bytes.Buffer{}
	tracer.Inject(rootSpan.Context(), opentracing.Binary, binaryCarrier)
	fmt.Printf("=== binaryCarrier: %v\n", binaryCarrier)

	root1SpanContext, err := tracer.Extract(opentracing.TextMap, textMapCarrier)
	if err != nil {
		panic(err)
	}
	root2SpanContext, err := tracer.Extract(opentracing.HTTPHeaders, httpHeaderCarrier)
	if err != nil {
		panic(err)
	}
	root3SpanContext, err := tracer.Extract(opentracing.Binary, binaryCarrier)
	if err != nil {
		panic(err)
	}
	child1Span := tracer.StartSpan("child", opentracing.ChildOf(root1SpanContext))
	fmt.Printf("=== child1Span BaggageRoot: %v\n", child1Span.BaggageItem(strings.ToLower("BaggageRoot"))) // 使用 opentracing.TextMap 像是个 bug，不区分大小写。
	child2Span := tracer.StartSpan("child", opentracing.ChildOf(root2SpanContext))
	fmt.Printf("=== child2Span BaggageRoot: %v\n", child2Span.BaggageItem(strings.ToLower("BaggageRoot"))) // 使用 opentracing.HTTPHeaders 像是个 bug，不区分大小写。
	child3Span := tracer.StartSpan("child", opentracing.ChildOf(root3SpanContext))
	fmt.Printf("=== child3Span BaggageRoot: %v\n", child3Span.BaggageItem("BaggageRoot"))
}
```

输出如下：

```
=== textMapCarrier: map[uber-trace-id:55d2ee3a9f8863f5:55d2ee3a9f8863f5:0000000000000000:1 uberctx-BaggageRoot:456]
=== httpHeaderCarrier: map[Uber-Trace-Id:[55d2ee3a9f8863f5:55d2ee3a9f8863f5:0000000000000000:1] Uberctx-Baggageroot:[456]]
=== child1Span BaggageRoot: 456
=== child2Span BaggageRoot: 456
=== child3Span BaggageRoot: 456
```

说明：

* [`Tracer.Inject(sm SpanContext, format interface{}, carrier interface{}) error`](https://pkg.go.dev/github.com/opentracing/opentracing-go@v1.2.0#Tracer) 将 SpanContext 安寨 format 格式序列化到 carrier 中。
* [`Tracer.Extract(format interface{}, carrier interface{}) (SpanContext, error)`](https://pkg.go.dev/github.com/opentracing/opentracing-go@v1.2.0#Tracer) 将 carrier 按照 format 格式反序列为 SpanContext。
* 原生支持的 format 为：
    * [`opentracing.TextMap`](https://pkg.go.dev/github.com/opentracing/opentracing-go@v1.2.0#BuiltinFormat)
    * [`opentracing.HTTPHeaders`](https://pkg.go.dev/github.com/opentracing/opentracing-go@v1.2.0#BuiltinFormat)
    * [`opentracing.Binary`](https://pkg.go.dev/github.com/opentracing/opentracing-go@v1.2.0#BuiltinFormat)

### 设置 Span 的属性

Tags 和 OperationName 除了可以在 Span 的时候设置外，还可以随时添加：

* [`Span.SetTag(key string, value interface{}) Span`](https://pkg.go.dev/github.com/opentracing/opentracing-go@v1.2.0#Span) 为了支持链式调用，将返回自身。
* [`Span.SetOperationName(operationName string) Span`](https://pkg.go.dev/github.com/opentracing/opentracing-go@v1.2.0#Span) 为了支持链式调用，将返回自身。

### 框架集成

#### 原理

从上文的编程接口可以看出，如果微服务想接入 OpenTracing，需要做如下事情：

* Server：从请求的参数获取序列化的 carrier，如果存在则通过 `Tracer.Extract` 反序列化为 SpanContext，并通过 `StartSpan` 函数创建 `Span`。并注入 `context.Context` 中，以给处理函数使用。
* Client：从 `context.Context` 中获取 `Span`，并通过 `Tracer.Inject` 序列化到 carrier 中，并在调用 Server 的时候传递。

#### HTTPServer

```go
func Middleware(tr opentracing.Tracer, h http.Handler, options ...MWOption) http.Handler
```

* 使用 Middleware 函数对 http.Handler 进行包装即可，更多参见：[go docs](https://pkg.go.dev/github.com/opentracing-contrib/go-stdlib@v1.0.0/nethttp#Middleware)。

#### HTTPClient

```go
package tracing

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"testing"

	"github.com/opentracing-contrib/go-stdlib/nethttp"
)

func TestHTTPClient(t *testing.T) {
	tracer, err := NewTracer("test")

	client := &http.Client{Transport: &nethttp.Transport{}}
	req, err := http.NewRequest("GET", "http://qq.com", nil)
	if err != nil {
		t.Fatal(err)
	}
	// req = req.WithContext(ctx) // extend existing trace, if any

	req, ht := nethttp.TraceRequest(tracer, req)
	defer ht.Finish()

	res, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	respBody, err := ioutil.ReadAll(res.Body)
	if err != nil {
		t.Fatal(err)
	}
	fmt.Println(string(respBody))
}
```

接入流程

* 使用 `nethttp.Transport` 创建 `http.Client`。
* 使用 `req = req.WithContext(ctx)` 注入 ctx。
* 使用 `req, ht := nethttp.TraceRequest(tracer, req)` 包装 request。
* 使用 `defer ht.Finish()` 设置结束函数调用。

## 实例

### 需求描述

假设我们在开发短信验证码登录需求，该需求包含如下接口：

* 验证码发送需求

假设我们的服务依赖关系如下所示：

```
                        ------> Redis
                       |
API 服务 ---(RPC)---> 认证服务 ---(MQ)---> 短信服务
```

其他说明：

* RPC 协议使用 HTTP。
* 示例代码使用 Go 和标准库实现。

### 实验代码

参见： [rectcircle/learn-observability](https://github.com/rectcircle/learn-observability/tree/master/01-opentracing)

### 部署测试

首先，参考：[Jaeger 一键启动](#一键启动)，启动 Jaeger 服务。

然后，启动测试服务。

```bash
# 第一个 shell
JAEGER_AGENT_HOST=localhost go run ./01-opentracing/api
# 第二个 shell
JAEGER_AGENT_HOST=localhost go run ./01-opentracing/auth
# 第三个 shell
JAEGER_AGENT_HOST=localhost go run ./01-opentracing/sms
```

发起请求：

```bash
curl -v 'localhost:8080/api/v1/SendSMSCode?PhoneNumber=123'
```

访问 http://localhost:16686 查看 tracing。

## 总结

通过接入 OpenTracing 可以实现：

* 从请求粒度追踪，某个请求对各个微服务调用链每个节点的起止时间和日志。

OpenTracing 不足和问题：

* 没有对自定义 metrics 的抽象、[暂不支持外部日志](https://github.com/jaegertracing/jaeger/issues/649) （[OpenTelemetry 日志好像也没有完全统合](https://zhuanlan.zhihu.com/p/74930691)）
* 官方已经归档，新项目建议迁移到 OpenTelemetry。

## 参考

* [官方站点](https://opentracing.io/)
* [github](https://github.com/opentracing)
* v1.1 标准文档：[中文](https://opentracing-contrib.github.io/opentracing-specification-zh/) | [英文](https://opentracing.io/specification/)
* OpenTracing Server：[Uber 开源的 Jaeger](https://www.jaegertracing.io/)
* OpenTracing Go Client：[opentracing/opentracing-go](https://github.com/opentracing/opentracing-go)
* OpenTracing Go HTTP 集成：[opentracing-contrib/go-stdlib](https://github.com/opentracing-contrib/go-stdlib)
