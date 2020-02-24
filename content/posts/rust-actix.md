---
title: "Rust Actix"
date: 2020-02-23T18:02:41+08:00
draft: false
toc: true
comments: true
tags:
  - 后端
---

> Rust 版本：1.41.0 (1.39.0 以上)
> 前序文章: [Rust Tokio](/posts/rust-tokio/)
> Actix 版本：2.0

参考：

* [官方网站](https://actix.rs/)

创建测试项目 `cargo new actix-learn`

## 一、介绍

actix 是 Rust 生态中的 Actor 系统。

actix-web 是 actix actor框架 和 Tokio异步IO系统 之上构建的高级Web框架。

`Cargo.toml` 配置依赖

```toml
[dependencies]
actix-web = "2.0"
```

开发者版本

```toml
[dependencies]
actix-web = { git = "https://github.com/actix/actix-web" }
```

运行例子程序

```bash
git clone https://github.com/actix/examples
cd examples/basics
cargo run
```

## 二、基本

### 1、Hello World

`Cargo.toml` 配置依赖

```toml
[dependencies]
actix-web = "2.0"
actix-rt = "1.0"
```

`src/main.rs`

```rs
use actix_web::{web, App, HttpResponse, HttpServer, Responder};

// curl http://localhost:8088/
async fn index() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

// curl http://localhost:8088/again
async fn index2() -> impl Responder {
    HttpResponse::Ok().body("Hello world again!")
}

use actix_web::get;

// curl http://localhost:8088/hello
// 使用宏解析
#[get("/hello")]
async fn index3() -> impl Responder {
    HttpResponse::Ok().body("Hey there!")
}

#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/", web::get().to(index))
            .route("/again", web::get().to(index2))
            .service(index3)
    })
    .bind("127.0.0.1:8088")?
    .run()
    .await
}
```

* `#[actix_rt::main]` 用于生成异步函数运行时，需要引入 `actix-rt = "1.0"` 依赖
* 处理函数应该是一个异步函数，返回一个 实现了 `Responder` 的类型
* `#[get("/hello")]` 可以方便的配置请求宏，参见：https://docs.rs/actix-web-codegen/
* 文件修改自动编译重载，参见：https://actix.rs/docs/autoreload/

### 2、App

`actix_web::App` 是 `actix_web` 的核心，所有的路由、服务、共享数据都围绕 `App` 构建。

在 `actix_web` 中，每个线程持有一个 App 实例。在创建 Server 时，需要传递一个 App 的 工厂函数

#### （1）统一前缀

一个 App 可以通过 [`scope`](https://docs.rs/actix-web/2/actix_web/struct.Scope.html)，为路由添加统一的前缀。

```rs
use actix_web::{web, App, HttpResponse, HttpServer, Responder};

// curl http://localhost:8088/
// curl http://localhost:8088/app/index.html
async fn index() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

use actix_web::get;

// curl http://localhost:8088/hello
// curl http://localhost:8088/app/hello
// 使用宏解析
#[get("/hello")]
async fn index3() -> impl Responder {
    HttpResponse::Ok().body("Hey there!")
}

#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(
                web::scope("/app")
                    .route("/index.html", web::get().to(index))
                    .service(index3)
            )
    })
    .bind("127.0.0.1:8088")?
    .run()
    .await
}
```

#### （2）共享状态

`actix_web` 提供了 `web::Data` API 用来在程序间共享状态

* 线程级别共享，共享的类型不用实现 线程交换安全，只能用于**只读**，如全局配置。通过 `.data(T)` 初始化
* 进程级别共享，共享的类型需要实现 线程交换安全，可用于读写场景，如计数器。通过 `.app_data(T)` 初始化

```rs
use actix_web::{web, App, HttpResponse, HttpServer, Responder};

struct AppState {
    app_name: String,
}

// curl http://localhost:8088/app_state
async fn app_state(data: web::Data<AppState>) -> impl Responder {
    HttpResponse::Ok().body(&data.app_name)
}

use std::sync::Mutex;

struct AppStateWithCounter {
    counter: Mutex<i32>, // <- Mutex is necessary to mutate safely across threads
}

// curl http://localhost:8088/counter
async fn counter(data: web::Data<AppStateWithCounter>) -> String {
    let mut counter = data.counter.lock().unwrap(); // <- get counter's MutexGuard
    *counter += 1; // <- access counter inside MutexGuard

    format!("Request number: {}", counter) // <- response with count
}

#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    let c = web::Data::new(AppStateWithCounter {
        counter: Mutex::new(0),
    });
    HttpServer::new(move || {
        App::new()
            // 由于 HttpServer::new 接收的是 App 工厂函数
            // 所以不同线程的 data 不是同一个实例，所以不是进程级别共享数据，而是线程级别的共享数据
            // 因此只能用于访问只读数据，如全局配置等
            .data(AppState {
                app_name: String::from("Actix-web"),
            })
            .app_data(c.clone())
            .route("/", web::get().to(index))
            .route("/again", web::get().to(index2))
            .service(index3)
            .service(
                web::scope("/app")
                    .route("/index.html", web::get().to(index))
                    .service(index3)
            )
            .route("/app_state", web::get().to(app_state))
            .route("/counter", web::get().to(counter))
    })
    .bind("127.0.0.1:8088")?
    .run()
    .await
}
```

#### （3）应用级别守卫

参见： https://docs.rs/actix-web/2/actix_web/guard/trait.Guard.html

#### （4）配置

actix_web 提供了 `configure` 用来传递一个配置函数，这样就可以将实现拆分到不同的模块中实现。

* 该配置函数 传递一个参数 [`ServiceConfig`](https://docs.rs/actix-web/2/actix_web/web/struct.ServiceConfig.html)，该参数可以配置自己的 `data`, `routes`, 和 `services`。

```rs
use actix_web::{web, App, HttpResponse, HttpServer, Responder};

// this function could be located in different module
// curl http://localhost:8088/app3/test
fn scoped_config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::resource("/test")
            .route(web::get().to(|| HttpResponse::Ok().body("test")))
            .route(web::head().to(|| HttpResponse::MethodNotAllowed())),
    );
}

// this function could be located in different module
// curl http://localhost:8088/app2
fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::resource("/app2")
            .route(web::get().to(|| HttpResponse::Ok().body("app2")))
            .route(web::head().to(|| HttpResponse::MethodNotAllowed())),
    );
}

#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    let c = web::Data::new(AppStateWithCounter {
        counter: Mutex::new(0),
    });
    HttpServer::new(move || {
        App::new()
            .configure(config)
            .service(
                web::scope("/app3")
                    .configure(scoped_config)
            )
    })
    .bind("127.0.0.1:8088")?
    .run()
    .await
}
```

### 3、Server

[HttpServer](https://docs.rs/actix-web/2/actix_web/struct.HttpServer.html) 负责 处理 HTTP 请求

`HttpServer` 的构造函数 以 `App` 工厂作为参数（必须实现`Send` + `Sync`），然后使用 `bind` 绑定端口，`run` 函数将启动 Http Server

默认情况下，HttpServer 以多线程方式 启动 Server，线程为等于当先系统的核心数。可以通过如下方式，指定线程数。

```rs
use actix_web::{web, App, HttpResponse, HttpServer};

#[actix_rt::main]
async fn main() {
    HttpServer::new(|| {
        App::new().route("/", web::get().to(|| HttpResponse::Ok()))
    })
    .workers(4); // <- Start 4 workers
}
```

由于 actix_web 是异步的，所以要防止阻塞的发生，阻塞将大大降低系统的吞吐量。所以，所有 IO 操作都需要使用对应的异步版本来实现。

默认情况下，actix_web 当收到 `SIGTERM` 信号时，将优雅关机，关机时间超时默认30s，可以通过` HttpServer::shutdown_timeout()` 配置

以下内容，参考 https://actix.rs/docs/server/

* SSL
* Keep-Alive

### 4、请求处理器

处理器是一个异步函数：`async fn(p: impl FromRequest) -> impl Responder`，其中参数p的数目支持`0~10`个

关于 `FromRequest` 参见下一节 提取器

actix-web 为某些标准类型（例如`＆'static str`、`String`等）提供 `Responder` 实现。

以下是关于不同 `Responder` 的实验

添加如下依赖

```toml
serde = "1.0"
serde_json = "1.0"
futures = "0.3"
```

`src/main.rs`

```rs
use actix_web::{web, App, HttpResponse, HttpServer, Responder, Error, HttpRequest, Either};

// curl http://localhost:8088/responder/str
async fn responder_str() -> &'static str {
    "responder_str"
}

// curl http://localhost:8088/responder/string
async fn responder_string() -> String {
    "responder_string".to_owned()
}

// curl http://localhost:8088/responder/impl_responder
async fn responder_impl_responder() -> impl Responder{
    web::Bytes::from_static(b"responder_string")
}

use serde::Serialize;
use futures::future::{ready, Ready};

// 自定义 Response
#[derive(Serialize)]
struct ResponseWrapper<T> {
    code: i32,
    msg: String,
    data: Option<T>,
}

// Responder
impl <T> Responder for ResponseWrapper<T> where T: Serialize {
    type Error = Error;
    type Future = Ready<Result<HttpResponse, Error>>;

    fn respond_to(self, _req: &HttpRequest) -> Self::Future {
        let body = serde_json::to_string(&self).unwrap();

        // Create response and set content type
        ready(Ok(HttpResponse::Ok()
            .content_type("application/json")
            .body(body)))
    }
}

// curl http://localhost:8088/responder/custom_responder
async fn responder_custom_responder() -> impl Responder {
    ResponseWrapper {
        code: 0,
        msg: "success".to_string(),
        data: Some("custom_responder".to_string()) }
}

use futures::stream::once;
use futures::future::ok;

// curl http://localhost:8088/responder/stream
async fn responder_stream_responder() -> HttpResponse {
    let body = once(ok::<_, Error>(web::Bytes::from_static(b"test")));

    HttpResponse::Ok()
        .content_type("application/json")
        .streaming(body)
}

type RegisterResult = Either<HttpResponse, Result<&'static str, Error>>;

// curl http://localhost:8088/responder/either
async fn responder_either_responder() -> RegisterResult {
    Either::A(HttpResponse::BadRequest().body("Bad data"))
    // Either::B(Ok("Hello!"))
}

#[actix_rt::main]
async fn main() -> std::io::Result<()> {

    let c = web::Data::new(AppStateWithCounter {
        counter: Mutex::new(0),
    });
    HttpServer::new(move || {
        App::new()
            .service(
                web::scope("/responder")
                    .route("/str", web::get().to(responder_str))
                    .route("/string", web::get().to(responder_string))
                    .route("/impl_responder", web::get().to(responder_impl_responder))
                    .route("/custom_responder", web::get().to(responder_custom_responder))
                    .route("/stream", web::get().to(responder_stream_responder))
                    .route("/either", web::get().to(responder_either_responder))
            )
    })
    .bind("127.0.0.1:8088")?
    .run()
    .await
}

```

### 5、提取器（Extractor）

提取器，即实现了 `FromRequest` 的类型，其可以作为 请求处理器 的参数

`actix-web` 提供了如下常用的提取器：

* `Path` 路径参数提取
* `Query`
* `Json`
* `Form`
* 其他
    * `Data` - 用于访问应用程序状态
    * `HttpRequest` - 核心请求体，包含所有请求信息
    * `String` - 将请求体转换为一个字符串
    * `bytes::Bytes` - 将请求体转换为一个字节流
    * `Payload` - 请求体的核心

除了这些专用提取器外，从1元组到10元组（元组的每个类型必须是 `FromRequest`）也实现了 `FromRequest` （代码参见 `extract.rs`），配合 `handler::Factory` 和 `handler::ExtractResponse` （代码参见 `handler.rs`），再配合 `actix_service::Service` 就实现了路由转发。

因此，本质上，在 `actix_web` 内部，就是通过 元组 和 宏实现的，如何实现通过元组调用一个多参数的函数，参见如下例子

```rs

trait CallFnWithTuple<T, R> {
    fn call_with_tuple(&self, param: T) -> R;
}

impl <Func, A, R> CallFnWithTuple<(A,), R> for Func where Func: Fn(A,) -> R {
    fn call_with_tuple(&self, param: (A,)) -> R {
        (self)(param.0,)
     }

}

impl <Func, A, B, R> CallFnWithTuple<(A, B,), R> for Func where Func: Fn(A, B,) -> R {
    fn call_with_tuple(&self, param: (A, B,)) -> R {
        (self)(param.0, param.1)
     }

}

fn proxy<T, R>(f: impl CallFnWithTuple<T, R>, p: T) -> R {
    f.call_with_tuple(p)
}

fn test_1(a: i32) -> i32 {
    a + 1
}
fn test_2(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    println!("{}", proxy(test_1, (1,)));
    println!("{}", proxy(test_2, (1,2)));
    println!("{}", test_2.call_with_tuple((1,2)));
}
```

`FromRequest` 定义如下

```rs
/// Request 提取器
///
/// 实现了该特质的类型可以作为 请求处理器 的参数使用
pub trait FromRequest: Sized {
    /// 发送错误时，返回的类型
    type Error: Into<Error>;

    /// 将 Self 转换为一个 Future
    type Future: Future<Output = Result<Self, Self::Error>>;

    /// 该提取器的配置
    type Config: Default + 'static;

    /// 将 request 转换为 Self
    fn from_request(req: &HttpRequest, payload: &mut Payload) -> Self::Future;

    /// 将 request 转换为 Self
    ///
    /// This method uses `Payload::None` as payload stream.
    fn extract(req: &HttpRequest) -> Self::Future {
        Self::from_request(req, &mut Payload::None)
    }

    /// 创建一个Config实例
    fn configure<F>(f: F) -> Self::Config
    where
        F: FnOnce(Self::Config) -> Self::Config,
    {
        f(Self::Config::default())
    }
}
```

下面就是actix_web内置的提取器的示例

```rs
use actix_web::{error, web, App, FromRequest, HttpResponse, HttpServer, Responder, Error, HttpRequest, Either};

use serde::Deserialize;

// 提取器 extractors
#[derive(Deserialize, Debug)]
struct QueryInfo {
    username: String,
}

// curl http://localhost:8088/extractor/multiple/p1/p2?username=xiaoming
async fn extractor_multiple(p: web::Path<(String, String)>, q: web::Query<QueryInfo>) -> String {
    format!("p={:?}, q={:?}", p, q)
}

#[derive(Deserialize, Debug)]
struct PathInfo {
    user_id: u32,
    friend: String,
}

// curl http://localhost:8088/extractor/path/123/friend_name
async fn extractor_path(p: web::Path<PathInfo>) -> String {
    format!("path-param={:?}", p)
}

// curl http://localhost:8088/extractor/manual_path/123/friend_name
async fn extractor_manual_path(req: HttpRequest) -> String {
    let friend: String =
        req.match_info().get("friend").unwrap().parse().unwrap();
    let user_id: i32 = req.match_info().query("user_id").parse().unwrap();

    format!("user_id={}, friend={}", user_id, friend)
}

// curl http://localhost:8088/extractor/query?username=xiaoming
async fn extractor_query(info: web::Query<QueryInfo>) -> String {
    format!("{:?}", info)
}

#[derive(Deserialize, Debug)]
struct JsonInfo {
    username: String,
}

// curl -i -H 'Content-Type: application/json' -d '{"username": "xiaoming"}' -X POST http://localhost:8088/extractor/json
// curl -i -H 'Content-Type: application/json' -d '{"username": 1}' -X POST http://localhost:8088/extractor/json
async fn extractor_json(info: web::Json<JsonInfo>) -> String {
    format!("{:?}", info)
}

#[derive(Deserialize, Debug)]
struct FormData {
    username: String,
}

/// 使用serde提取表单数据
/// 仅当内容类型为*x-www-form-urlencoded*时，才会调用此处理程序
/// 并且请求的内容可以反序列化为FormData结构
// curl -i -H 'Content-Type: application/x-www-form-urlencoded' -d 'username=xiaoming' -X POST http://localhost:8088/extractor/form
async fn extractor_form(form: web::Form<FormData>) -> String {
    format!("{:?}", form)
}

#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(move || {
        App::new()
            // 配置 Json Extractor
            .app_data(web::Json::<JsonInfo>::configure(|cfg| {
                    cfg.limit(4096).error_handler(|err, _req| {
                        error::InternalError::from_response(
                            err,
                            HttpResponse::Conflict().finish(),
                        )
                        .into()
                    })
                }))
            .service(
                web::scope("/extractor")
                    .route("/multiple/{p1}/{p2}", web::get().to(extractor_multiple))
                    .route("/path/{user_id}/{friend}", web::get().to(extractor_path))
                    .route("/manual_path/{user_id}/{friend}", web::get().to(extractor_manual_path))
                    .route("/query", web::get().to(extractor_query))
                    .route("/json", web::post().to(extractor_json))
                    .route("/form", web::post().to(extractor_form))
            )
    })
    .bind("127.0.0.1:8088")?
    .run()
    .await
}
```

## 三、进阶
