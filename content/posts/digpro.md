---
title: "digpro 设计"
date: 2021-10-17T18:53:24+08:00
draft: false
toc: true
comments: true
tags:
  - golang
---

## 缘由

在 [Go 依赖注入](/posts/go-dependency-injection/) 调研过程中，发现主流的 go 依赖注入库，功能均有所确实。

经过调研发现，[uber-go/fx](fx-github) 也是基于 [uber-go/dig][dig-github]，通过仔细阅读器文档阅读和源码。可以看出 [uber-go/dig][dig-github] 是一个比较优质的开源库，且有较好的扩展性。

因此，决定对 [uber-go/dig][dig-github] 项目进行的封装，这就有了 [digpro][digpro-github] 项目

## 渐进使用

[digpro][digpro-github] 基于 [uber-go/dig][dig-github]。因此希望用户可以直接在已经使用 [uber-go/dig][dig-github] 的项目零成本的使用 [digpro][digpro-github] 提供的能力。

这就要求，[digpro][digpro-github] 仅仅把 [uber-go/dig][dig-github] 作为一个依赖库，而 fork 魔改

但是 [uber-go/dig][dig-github] 作为一个基础库，很多高级的用法没法进行兼容，因此如果用户想更好的使用 [digpro][digpro-github]，需要使用 [digpro][digpro-github] 导出的类型。

另外 [digpro][digpro-github] 导出的类型，需嵌入 dig 的对象，这样就可以继承 dig 的全部能力了。

基于以上分析， [digpro][digpro-github] 在处理和 [uber-go/dig][dig-github] 的关系上做了如下决定

* [uber-go/dig][dig-github] 作为一个依赖库，而 fork 魔改
* 导出两套 API
    * Lower Level API 可以直接用于 [uber-go/dig][dig-github]，可获得 [digpro][digpro-github] 部分能力
    * High Level API 是对 [uber-go/dig][dig-github] 的一个 wrap 类型，可获得 [digpro][digpro-github] 全部能力

## dig API 分析

> v1.13.0

### New

```go
func dig.New(opts ...dig.Option) *dig.Container
```

创建一个 dig.Container 结构体，dig 依赖注入的功能基于该能力实现。

opts 有如下几种

* `dig.DeferAcyclicVerification()` 配置延后循环依赖检查，默认在执行 `Provide` 就进行检查
* `dig.DryRun(dry bool)` 默认为 false。当为 true 时，在调用 `Invoke` 时，将不会报缺少依赖错误，而是创建一个零值直接调用

### Container.Provide

```go
func (*dig.Container).Provide(constructor interface{}, opts ...dig.ProvideOption) error
```

向容器里面注册一个构造函数 constructor。constructor 是一个函数类型，且其返回值必须包含一个非 error 的返回值。

调用该函数，只是注册该 constructor，并解析出其输入输出，并不会实际执行构造函数。

opts 有如下几种

* `dig.Name(name string)` 给 constructor 返回值添加一个名字，在 Provide 多个返回相同类型的 constructor 很有用。
* `dig.Group(group string)` 将 constructor 返回值构造一个切片。注意，该选项不能和 `Name` 和 `As` 同时使用。
* `dig.FillProvideInfo(info *ProvideInfo)` 将 constructor 的输入输出信息写入 info 中。
* `dig.As(i ...interface{})` 将 constructor 转换为 i 类型，i 必须为一个接口指针类型如 `new(io.Reader)`
* `dig.LocationForPC(pc uintptr)` 添加调用信息，如果 constructor 是通过反射构造出来的函数，可以使用该配置优化错误输出

### Container.Invoke

```go
func (*dig.Container).Invoke(function interface{}, opts ...dig.InvokeOption) error
```

分析 function 的依赖，并构造出这些依赖，然后执行 function 函数。

调用该函数时，如果会递归的一层一层的调用 Provide 注册的 constructor，如果 constructor 已经没调用过了，将直接使用环境。

该函数目前还没 opts

### dig.In 和 dig.Out 类型

* `dig.In` 参见 [参数对象](https://pkg.go.dev/go.uber.org/dig@v1.13.0#hdr-Parameter_Objects)
* `dig.Out` 参见 [结果对象](https://pkg.go.dev/go.uber.org/dig@v1.13.0#hdr-Result_Objects)

## 功能设计

| 特性 | 状态 | Lower Level API |  High Level API |
|---|---|---|---|
|值 Provider | 发布 | ✅ |✅ |
|属性依赖注入 | 发布 | ✅ |✅ |
|从容器里提取对象 | 发布 | ✅ | ✅|
|Override 已存在的 Provider | 发布 | ❌| ✅|
|循环引用 | TODO |❌ | ✅|

### 值 Provider

如果想直接注册一个创建好的对象，使用 dig，需要如下的写法。

```go
c.Provide(func() string {return "abc"})
```

可以看出，这种写法相对比较繁琐。因此，如果有如下的 API 会简化不少

```go
c.Supply("abc")
```

这样，其声明为

```go
func (*digpro.ContainerWrapper).Supply(value interface{}, opts ...dig.ProvideOption) error
```

利用 `dig.Provide` 方法 和反射的 `reflect.ValueOf`、 `reflect.FuncOf`、`reflect.MakeFunc` 即可轻松实现该特性，伪代码为（忽略一些细节）

```go
func Supply[T](value T) func() T {
    // 假设支持泛型的伪代码（可以使用反射实现类似效果）
	return func() T {return T}
}
func (c *digpro.ContainerWrapper) Supply[T](value T, opts ...dig.ProvideOption) error {
	return c.Provide(Supply(value), opts...)
}
```

### 属性依赖注入

如果有一个结构体

```go
type Foo struct {
    A string `name:"a"`
    B int
    c bool `digpro:"ignore"`
}
```

用户希望可以只提供该结构体的类型信息或者一个模板，依赖注入器即可自动根据该类型创建该对象，并能将根据其字段类型和 tag，向依赖注入容器中查找合适的对象，并设置到该对象的字段中。用类似于

```go
c.Supply("a", dig.Name("a"))
c.Supply(1)
c.Struct(Foo{c: true}) 
// 这样我们就能重容器中拿到 Foo {A: "a", B: 1, c: true} 对象
```

这样其声明为

```go
func (c *digpro.ContainerWrapper) Struct(structOrStructPtr interface{}, opts ...dig.ProvideOption) error
```

利用 `dig.Provide`、`dig.In` 类型，方法和反射的 `reflect.ValueOf`、 `reflect.FuncOf`、`reflect.MakeFunc`、`reflect.MakeFunc`、`reflect.StructField`、`reflect.StructOf` 即可轻松实现该特性，伪代码为（忽略一些细节）

```go
func Struct[T](structOrStructPtr T) T {
    return func(in struct {
        dig.In
        // structOrStructPtr 的所有字段不包含 `digpro:"ignore"` 标志的字段，未导出的字段转化为导出对象
    }) T {
        // 遍历 in 的所有字段，并赋值给给 structOrStructPtr 相应的字段
        return  T
    }
}

func (c *ContainerWrapper) Struct[T](structOrStructPtr T, opts ...dig.ProvideOption) error {
    return c.Provide(Struct(value), opts...)
}
```

### 从容器里提取对象

仍以 [属性依赖注入](#属性依赖注入) 为例，假设用户想从容器中提取 Foo 对象出来，大概用法大致如下

```go
foo, _ := c.Extract(Foo{})
// 此时 foo.(Foo) 为 Foo {A: "a", B: 1, c: true}
```

这样其声明为

```go
func (c *digpro.ContainerWrapper) Extract(typ interface{}, opts ...ExtractOption) (interface{}, error) {
}
```

opts 和 Provide 类似，可以配置 Name、Group 字段来提取指定的对象

利用 `dig.Invoke`、`dig.In`  类型，方法和反射的 `reflect.ValueOf`、 `reflect.FuncOf`、`reflect.MakeFunc` 即可轻松实现该特性，伪代码为

```go
func MakeExtractFunc[T](t *T, opts ...ExtractOption) func(T) {
    return func(in struct{
        dig.In
        Value T `name:"xxx"` // 或者 `group:"xxx"`
    }) {
        *t = in.Value 
    }
}

func (c *digpro.ContainerWrapper) Extract[T](typ T, opts ...ExtractOption) (T, error) {
    t := new(T)
    return t, c.Invoke(t, opts...)
}
// 如果底层类型是接口类型，函数声明应该为
func (c *digpro.ContainerWrapper) Extract[T](typ *T, opts ...ExtractOption) (T, error) {
    t := new(T)
    return t, c.Invoke(t, opts...)
}
```

### Override 已存在的 Provider

针对 Provider 类型的 API

* `Provide`
* `Supply`
* `Struct`

希望可以覆盖已经注册的一个 constructor，用户可能按照如下方法使用

```go
c.Supply(1)
c.Supply(2, digpro.Override()) // 不报错
// 此时提取 int 类型将获取 2
```

伪代码如下（忽略一些细节）

```go
type ContainerWrapper struct {
	dig.Container
	provideInfos []internal.ProvideInfosWrapper
}

// 所有 Provider 类型的 API 最终均通过 `Provide` 函数实现
func (c *ContainerWrapper) Supply(...) {
    // ...
    return c.Provide(...)
}
func (c *ContainerWrapper) Struct(...) {
    // ...
    return c.Provide(...)
}

// 代理对 Provide 的调用
func (c *ContainerWrapper) Provide(constructor interface{}, opts ...dig.ProvideOption) error {
    if hasOverrideOpt {
        return c.Container.Provide(...)
    }

    // 获取该构造函数的 dig.ProvideInfo 信息
    info := dig.ProvideInfo{}
    dig.New().Provide(constructor, opts..., dig.FillProvideInfo(&info))
    // 遍历 c.provideInfos 检查是否已经注册过了
    // ...
    // 如果已经注册过了，先通过反射删除掉 c.Container 中的数据，然后
	return return c.Container.Provide(...)
    // 否则没有找到
    return error
}

```

* 在 `digpro.Provide` 将代理对 `dig.Provide` 的调用，做如下事情
    * 将 `digpro.Provide(...)` 的调用转换为 `digpro.Provide(..., )`

### 循环引用

对于 `digpro.Struct(...)` API，如果参数是一个指针，且字段也是一个指针或者接口，则允许出现循环引用的情况。

假设存在如下两个结构体

```go
type D1 struct {
	D2 *D2
}
type D2 struct {
	D1 *D1
}
```

希望用户按照如下的写法也不会报错

```go
c.Struct(&D1{})
c.Struct(&D2{})
// 提取 D2 时，或者调用 Invoke 是可以拿到正确的结果
```

为了实现这个需求，需要对多个函数进行改造

#### ContainerWrapper 变化

添加一个 Provider 结果类型

```go
type ContainerWrapper struct {
	// 添加一个记录需要注入属性的字段的 map
    propertyInjects map[ProvideOutput]PropertyInfo
}

```

#### Struct 变化

```go
func Struct[T](structOrStructPtr T) T {
    return func(in struct {
        dig.In
        // ...
        // T 如果 T 是指针，那么其的指针/接口类型字段将被忽略（如果存在忽略的字段，则说明需要属性依赖注入）
    }) T {
        // ...
        return  T
    }
}

func (c *ContainerWrapper) Struct[T](structOrStructPtr T, opts ...dig.ProvideOption) error {
    // 如果需要需要属性依赖注入，则记录到 c.propertyInjects 中
    return c.Provide(Struct(value), opts...)
}
```

#### Extract 使用代理 Invoke

```go
func (c *digpro.ContainerWrapper) Extract(typ interface{}, opts ...ExtractOption) (interface{}, error) {
    // ...
    c.Invoke(...)
    // ...
}
```

#### 代理 Invoke

```go
func (c *ContainerWrapper) proxyInvokeFunction[A](function func(A)) func(A) {
    return func(a A) {
        // 注意 in 类型需要遍历内部
        if a 在 c.propertyInjects 中 && a 没有执行过属性注入 {
            将 a 标记为已经执行过属性注入
            for a 的每个依赖项 dep {
                dep = 执行 c.Extract(dep) 
                a.dep = dep
            }
            如果存在错误
            将 a 恢复为未执行过属性注入
        }
        function(a)
    }
}

func (c *ContainerWrapper) Invoke[A](function func(A), opts ...dig.InvokeOption) error {
    return c.Invoke(proxyInvokeFunction(function), opts...)
}
```

[fx-github]: https://github.com/uber-go/fx
[dig-github]: https://github.com/uber-go/dig
[digpro-github]: https://github.com/rectcircle/digpro
