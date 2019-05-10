---
title: RESTful API
date: 2018-04-18T14:09:26+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/136
  - /detail/136/
tags:
  - Java
---

> [参考1](http://www.ruanyifeng.com/blog/2011/09/restful.html)
> [参考2](http://www.ruanyifeng.com/blog/2014/05/restful_api)

### 1、RESTful架构的理解

#### （1）名字含义

REST，即Representational State Transfer的缩写。意思为"资源的表现层状态转化"。

#### （2）资源

所谓"资源"，就是网络上的一个实体，或者说是网络上的一个具体信息。它可以是一段文本、一张图片、一首歌曲、一种服务，总之就是一个具体的实在。你可以用一个URI（统一资源定位符）指向它，每种资源对应一个特定的URI。

#### （3）表现层

我们把"资源"具体呈现出来的形式，叫做它的"表现层"（Representation）。

比如，文本可以用txt格式表现，也可以用HTML格式、XML格式、JSON格式表现，甚至可以采用二进制格式；图片可以用JPG格式表现，也可以用PNG格式表现。

严格地说，有些网址最后的".html"后缀名是不必要的，因为这个后缀名表示格式，属于"表现层"范畴，而URI应该只代表"资源"的位置。它的具体表现形式，应该在HTTP请求的头信息中用Accept和Content-Type字段指定，这两个字段才是对"表现层"的描述。

#### （4）状态转化

访问一个网站，就代表了客户端和服务器的一个互动过程。在这个过程中，势必涉及到数据和状态的变化。

互联网通信协议HTTP协议，是一个无状态协议。这意味着，所有的状态都保存在服务器端。因此，如果客户端想要操作服务器，必须通过某种手段，让服务器端发生"状态转化"（State Transfer）。而这种转化是建立在表现层之上的，所以就是"表现层状态转化"。

客户端用到的手段，只能是HTTP协议。具体来说，就是HTTP协议里面，四个表示操作方式的动词：GET、POST、PUT、DELETE。它们分别对应四种基本操作：GET用来获取资源，POST用来新建资源（也可以用于更新资源），PUT用来更新资源，DELETE用来删除资源。

#### （5）综述

* 每一个URI代表一种资源；
* 客户端和服务器之间，传递这种资源的某种表现层；
* 客户端通过四个HTTP动词，对服务器端资源进行操作，实现"表现层状态转化"。

#### （6）误区

* 最常见的一种设计错误，**就是URI包含动词**。因为"资源"表示一种实体，所以应该是名词，URI不应该有动词，动词应该放在HTTP协议中。

#### （7）相关约束

* **客户-服务器（Client-Server）** 通信只能由客户端单方面发起，表现为请求-响应的形式。
* **无状态（Stateless）** 通信的会话状态（Session State）应该全部由客户端负责维护。
* **缓存（Cache）** 响应内容可以在通信链的某处被缓存，以改善网络效率。
* **统一接口（Uniform Interface）** 通信链的组件之间通过统一的接口相互通信，以提高交互的可见性。
* **分层系统（Layered System）** 通过限制组件的行为（即，每个组件只能“看到”与其交互的紧邻层），将架构分解为若干等级的层。
* **按需代码（Code-On-Demand，可选）** 支持通过下载并执行一些代码（例如Java Applet、Flash或JavaScript），对客户端的功能进行扩展。

#### （8）统一接口

REST要求，必须通过统一的接口来对资源执行各种操作。对于每个资源只能执行一组有限的操作。以HTTP/1.1协议为例，HTTP/1.1协议定义了一个操作资源的统一接口，主要包括以下内容：

* 7个HTTP方法：GET/POST/PUT/DELETE/PATCH/HEAD/OPTIONS
* HTTP头信息（可自定义）
* HTTP响应状态代码（可自定义）
* 一套标准的内容协商机制
* 一套标准的缓存机制
* 一套标准的客户端身份认证机制

#### （9）RESTful概念的级别

RESTful是一种分布式的架构，并不是很虚的概念与RESTful同级的解决方案有：

* 分布式对象（Distributed Objects，简称DO）
	* 架构实例有CORBA/RMI/EJB/DCOM/.NET Remoting等等
	* 问题：绑定具体语言、结构复杂
* 远程过程调用（Remote Procedure Call，简称RPC）
	* 架构实例有SOAP/XML-RPC/Hessian/Flash AMF/DWR等等
	* 问题：RPC支持抽象的工具是过程，针对的是动词建模；没有统一接口的概念。不同的API，接口设计风格可以完全不同。
* 表述性状态转移（Representational State Transfer，简称REST）
	* 架构实例有HTTP/WebDAV
	* 优点：耦合度小，面向资源，面向各种开发语言

#### （10）RESTful的优点

简单性

采用REST架构风格，对于开发、测试、运维人员来说，都会更简单。可以充分利用大量HTTP服务器端和客户端开发库、Web功能测试/性能测试工具、HTTP缓存、HTTP代理服务器、防火墙。这些开发库和基础设施早已成为了日常用品，不需要什么火箭科技（例如神奇昂贵的应用服务器、中间件）就能解决大多数可伸缩性方面的问题。

可伸缩性

充分利用好通信链各个位置的HTTP缓存组件，可以带来更好的可伸缩性。其实很多时候，在Web前端做性能优化，产生的效果不亚于仅仅在服务器端做性能优化，但是HTTP协议层面的缓存常常被一些资深的架构师完全忽略掉。

松耦合

统一接口+超文本驱动，带来了最大限度的松耦合。允许服务器端和客户端程序在很大范围内，相对独立地进化。对于设计面向企业内网的API来说，松耦合并不是一个很重要的设计关注点。但是对于设计面向互联网的API来说，松耦合变成了一个必选项，不仅在设计时应该关注，而且应该放在最优先位置。

**缺点**

面向互联网应用

### 2、RESTful API设计

#### （1）原则

* 使用https
* URI不允许包含动词
* 尽量使用HTTP协议的内容及其语义表征（比如说HTTP动词、返回码表征、请求/响应头）
* URI代表一种资源

#### （2）域名

应该尽量将API部署在专用域名之下。
`https://api.example.com`

如果确定API很简单，不会有进一步扩展，可以考虑放在主域名下。
`https://example.org/api/`

#### （3）版本

应该将API的版本号放入URL。
`https://api.example.com/v1/`

另一种做法是，将版本号放在HTTP头信息中，但不如放入URL方便和直观。Github采用这种做法。

#### （4）路径

路径又称"终点"（endpoint），表示API的具体网址。

在RESTful架构中，每个网址代表一种资源（resource），所以网址中不能有动词，只能有名词，而且所用的名词往往与数据库的表格名对应。一般来说，数据库中的表都是同种记录的"集合"（collection），所以API中的名词也应该使用复数。

举例来说，有一个API提供动物园（zoo）的信息，还包括各种动物和雇员的信息，则它的路径应该设计成下面这样。

* `https://api.example.com/v1/zoos`
* `https://api.example.com/v1/animals`
* `https://api.example.com/v1/employees`

#### （5）HTTP动词

对于资源的具体操作类型，由HTTP动词表示。

常用的HTTP动词有下面五个（括号里是对应的SQL命令）。

* GET（SELECT）：从服务器取出资源（一项或多项）。
* POST（CREATE）：在服务器新建一个资源。
* PUT（UPDATE）：在服务器更新资源（客户端提供改变后的完整资源）。
* PATCH（UPDATE）：在服务器更新资源（客户端提供改变的属性）。
* DELETE（DELETE）：从服务器删除资源。

还有两个不常用的HTTP动词。

* HEAD：获取资源的元数据。
* OPTIONS：获取信息，关于资源的哪些属性是客户端可以改变的。

下面是一些例子。

```
GET /zoos：列出所有动物园
POST /zoos：新建一个动物园
GET /zoos/ID：获取某个指定动物园的信息
PUT /zoos/ID：更新某个指定动物园的信息（提供该动物园的全部信息）
PATCH /zoos/ID：更新某个指定动物园的信息（提供该动物园的部分信息）
DELETE /zoos/ID：删除某个动物园
GET /zoos/ID/animals：列出某个指定动物园的所有动物
DELETE /zoos/ID/animals/ID：删除某个指定动物园的指定动物
```

#### （6）过滤信息

如果记录数量很多，服务器不可能都将它们返回给用户。API应该提供参数，过滤返回结果。

下面是一些常见的参数。

```
?limit=10：指定返回记录的数量
?offset=10：指定返回记录的开始位置。
?page=2&per_page=100：指定第几页，以及每页的记录数。
?sortby=name&order=asc：指定返回结果按照哪个属性排序，以及排序顺序。
?animal_type_id=1：指定筛选条件
```

参数的设计允许存在冗余，即允许API路径和URL参数偶尔有重复。比如，GET /zoo/ID/animals 与 GET /animals?zoo_id=ID 的含义是相同的。

#### （7）状态码

* `200 OK - [GET]`：服务器成功返回用户请求的数据，该操作是幂等的（Idempotent）。
* `201 CREATED - [POST/PUT/PATCH]`：用户新建或修改数据成功。
* `202 Accepted - [*]`：表示一个请求已经进入后台排队（异步任务）
* `204 NO CONTENT - [DELETE]`：用户删除数据成功。
* `400 INVALID REQUEST - [POST/PUT/PATCH]`：用户发出的请求有错误，服务器没有进行新建或修改数据的操作，该操作是幂等的。
* `401 Unauthorized - [*]`：表示用户没有权限（令牌、用户名、密码错误）。
* `403 Forbidden - [*]` 表示用户得到授权（与401错误相对），但是访问是被禁止的。
* `404 NOT FOUND - [*]`：用户发出的请求针对的是不存在的记录，服务器没有进行操作，该操作是幂等的。
* `406 Not Acceptable - [GET]`：用户请求的格式不可得（比如用户请求JSON格式，但是只有XML格式）。
* `410 Gone -[GET]`：用户请求的资源被永久删除，且不会再得到的。
* `422 Unprocesable entity - [POST/PUT/PATCH]` 当创建一个对象时，发生一个验证错误。
* `500 INTERNAL SERVER ERROR - [*]`：服务器发生错误，用户将无法判断发出的请求是否成功。

#### （8）错误处理（Error handling）

如果状态码是4xx，就应该向用户返回出错信息。一般来说，返回的信息中将error作为键名，出错信息作为键值即可。

```json
{
    error: "Invalid API key"
}
```

#### （9）返回结果

针对不同操作，服务器向用户返回的结果应该符合以下规范。

* GET /collection：返回资源对象的列表（数组）
* GET /collection/resource：返回单个资源对象
* POST /collection：返回新生成的资源对象
* PUT /collection/resource：返回完整的资源对象
* PATCH /collection/resource：返回完整的资源对象
* DELETE /collection/resource：返回一个空文档

#### （10）其他

* API的身份认证应该使用OAuth 2.0框架。
* 服务器返回的数据格式，应该尽量使用JSON，避免使用XML。
