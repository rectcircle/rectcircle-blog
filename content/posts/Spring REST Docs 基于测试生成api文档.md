---
title: Spring REST Docs 基于测试生成api文档
date: 2017-11-05T15:17:35+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/111
  - /detail/111/
tags:
  - Java
---

## 一、Spring Test

***

### 1、加入Spring Test依赖

```xml
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-data-redis</artifactId>
		</dependency>
```

### 2、Spring Test相关注解

#### （1）测试类注解

**基本注解**

* `@RunWith(SpringRunner.class)` 告诉JUnit运行使用Spring的测试支持。SpringRunner是SpringJUnit4ClassRunner的新名字，这个名字只是让名字看起来简单些。
* `@SpringBootTest(classes=Application.class)` “带有Spring Boot支持的引导程序”（例如，加载应用程序、属性，为我们提供Spring Boot的所有精华部分）。
* `@TransactionConfiguration` 事务控制

**插件**

* `@AutoConfigureMockMvc` 主动注入mockMvc用于配置测试Controller
* `@AutoConfigureRestDocs(outputDir = "target/snippets")` 配置api文档输出位置

#### （2）测试方法注解

* `@Test` Junit注解，标明测试方法
* `@Rollback(false)` 是否回滚
* `@BeforeTransaction`和`@AfterTransaction`在事务开始之前和之后要执行的逻辑

#### （3）标准注解支持

* @Autowired
* @Qualifier
* @Resource (javax.annotation) if JSR-250 is present
* @Inject (javax.inject) if JSR-330 is present
* @Named (javax.inject) if JSR-330 is present
* @PersistenceContext (javax.persistence) if JPA is present
* @PersistenceUnit (javax.persistence) if JPA is present
* @Required
* @Transactional

### 3、测试Dao的例子

```java
package cn.rectcircle.ssm.mapper;

import cn.rectcircle.ssm.model.Authority;
import cn.rectcircle.ssm.model.Role;
import cn.rectcircle.ssm.model.User;
import org.apache.ibatis.session.SqlSession;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

@RunWith(SpringRunner.class)
@SpringBootTest
public class UserMapperTest {

	@Autowired
	private UserMapper userMapper;

	@Autowired
	private RoleMapper roleMapper;

	@Autowired
	private AuthorityMapper authorityMapper;

	@Autowired
	private SqlSession sqlSession;


	@Test
	public void testAll() throws Exception {
		userMapper.deleteAll();
		roleMapper.deleteAllRoleAuthority();
		roleMapper.deleteAll();
		authorityMapper.deleteAll();

		Assert.assertEquals(0, userMapper.getAll().size());

		User user1 = new User("aa", "a123456","a");
		User user2 = new User("bb", "b123456", "b");
		userMapper.insert(user1);
		userMapper.insert(user2);
		Assert.assertEquals(2, userMapper.getAll().size());

		user2.setUsername("cc");
		userMapper.update(user2);
		Assert.assertEquals("cc", userMapper.getOneById(user2.getId()).getUsername());

		Assert.assertEquals(true, userMapper.isExistByUsername("aa"));
		Assert.assertEquals(false, userMapper.isExistByUsername("dd"));

		userMapper.deleteById(user2.getId());
		Assert.assertEquals(null, userMapper.getOneById(user2.getId()));


		Role role1 = new Role("root", "拥有所有权限");
		Role role2 = new Role("manager", "用于部分权限");
		roleMapper.insert(role1);
		roleMapper.insert(role2);

		User user3 = new User("cc", "c123456", "c");
		user3.setRoleId(role1.getId());
		userMapper.insert(user3);

		Assert.assertEquals(role1.getId(), userMapper.getOneById(user3.getId()).getRoleId());

		user1.setRoleId(role2.getId());
		userMapper.update(user1);
		Assert.assertEquals(role2.getName(), userMapper.getOneByUsername(user1.getUsername()).getRole().getName());

		Authority authority1 = new Authority("读商品信息", "拥有读取商品信息的权限");
		Authority authority2 = new Authority("修改商品信息", "拥有修改商品信息的权限");
		authorityMapper.insert(authority1);
		authorityMapper.insert(authority2);
		roleMapper.addOneAuthority(role1.getId(), authority1.getId());
		roleMapper.addOneAuthority(role1.getId(), authority2.getId());
		roleMapper.addOneAuthority(role2.getId(), authority1.getId());

		role1 = roleMapper.getOneById(role1.getId());
		Assert.assertEquals(role1.getAuthorityList().size(),
				userMapper.getOneByUsername(user3.getUsername()).getAuthorityList().size());

		userMapper.deleteAll();
		roleMapper.deleteAllRoleAuthority();
		roleMapper.deleteAll();
		authorityMapper.deleteAll();
	}

}

```

### 4、测试Controller的例子

```java
package cn.rectcircle.ssm.controller;

import cn.rectcircle.ssm.SsmApplication;
import cn.rectcircle.ssm.constant.MsgConsts;
import cn.rectcircle.ssm.mapper.UserMapper;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.restdocs.AutoConfigureRestDocs;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.http.ResponseEntity.status;
import static org.springframework.restdocs.mockmvc.MockMvcRestDocumentation.document;
import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.requestFields;
import static org.springframework.restdocs.payload.PayloadDocumentation.responseFields;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.requestParameters;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * @author Rectcircle
 * @date 2017/11/4
 */
@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureRestDocs(outputDir = "target/snippets")
//@TransactionConfiguration(transactionManager = "transactionManager", defaultRollback = true)
public class UserControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UserMapper userMapper;

	@Test
	public void testRegister() throws Exception {
		userMapper.deleteAll();
		String responseString = mockMvc.perform(post("/user/register.json")
					.param("username", "root")
					.param("name", "root")
					.param("password", "123456")
					.contentType(MediaType.APPLICATION_FORM_URLENCODED)
					.accept(MediaType.APPLICATION_JSON)
				)
				.andExpect(status().isOk())
				.andExpect(content().string(
						containsString(MsgConsts.getErrMsg(MsgConsts.ERRCODE_SUCCESS))))
				.andDo(document("userRegister",
						requestParameters(parameterWithName("username").description("用户名"),
								parameterWithName("name").description("姓名"),
								parameterWithName("password").description("密码（明文）")
						),
						responseFields(fieldWithPath("errcode").description("错误码").type(JsonFieldType.NUMBER),
								fieldWithPath("errmsg").description("错误描述").type(JsonFieldType.STRING),
								fieldWithPath("data").description("返回用户信息").type(JsonFieldType.OBJECT),
								fieldWithPath("data.username").description("用户刚刚注册的用户名"),
								fieldWithPath("data.name").description("用户刚刚注册的姓名")
						)
				))
				.andReturn().getResponse().getContentAsString();
		System.out.println(responseString);

		responseString = mockMvc.perform(post("/user/register.json")
					.param("username", "root")
					.param("name", "root")
					.param("password", "123456")
					.contentType(MediaType.APPLICATION_FORM_URLENCODED)
					.accept(MediaType.APPLICATION_JSON)
				)
				.andExpect(status().isOk())
				.andExpect(content().string(
						containsString(
								MsgConsts.getErrMsg(MsgConsts.ERROCODE_USER_EXIST))))
				.andDo(document("userRegisterError"))
				.andReturn().getResponse().getContentAsString();
		System.out.println(responseString);
	}

	@Test
	public void testLogin() throws Exception {
		userMapper.deleteAll();
		mockMvc.perform(post("/user/register.json")
				.param("username", "root")
				.param("name", "root")
				.param("password", "123456")
				.contentType(MediaType.APPLICATION_FORM_URLENCODED)
				.accept(MediaType.APPLICATION_JSON)
		);

		String responseString = mockMvc.perform(post("/user/login.json")
					.param("username", "root")
					.param("password", "123457")
					.contentType(MediaType.APPLICATION_FORM_URLENCODED)
					.accept(MediaType.APPLICATION_JSON)
				)
				.andExpect(status().isOk())
				.andExpect(content().string(containsString(
						MsgConsts.getErrMsg(MsgConsts.ERROCODE_LOGIN))))
				.andDo(document("userLoginError"))
				.andReturn().getResponse().getContentAsString();

		System.out.println(responseString);

		responseString = mockMvc.perform(post("/user/login.json")
					.param("username", "root")
					.param("password", "123456")
					.contentType(MediaType.APPLICATION_FORM_URLENCODED)
					.accept(MediaType.APPLICATION_JSON)
				)
				.andExpect(status().isOk())
				.andExpect(content().string(containsString(
						MsgConsts.getErrMsg(MsgConsts.ERRCODE_SUCCESS))))
				.andDo(document("userLogin"))
				.andReturn().getResponse().getContentAsString();
		System.out.println(responseString);
		userMapper.deleteAll();
	}

	@Test
	public void testGetUserInfo() throws Exception {
		String responseString = mockMvc.perform(post("/user/info.json"))
				.andExpect(status().isOk())
				.andDo(document("userInfoError"))
				.andReturn().getResponse().getContentAsString();
		System.out.println(responseString);
	}
}
```

#### （1）基本框架

```java
package xxx;

import xxx;

@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureRestDocs(outputDir = "target/snippets") //配置api文档信息
public class UserControllerTest {

	@Autowired //注入测试用的mockMvc
	private MockMvc mockMvc;

	@Test
	public void testRegister() throws Exception {
		userMapper.deleteAll();
		String responseString = mockMvc.perform(post("/user/register.json") //或者post
					.param("username", "root") //配置请求参数
					.param("name", "root")
					.param("password", "123456")
					.contentType(MediaType.APPLICATION_FORM_URLENCODED)
					.accept(MediaType.APPLICATION_JSON)
				)
				.andExpect(status().isOk()) //接收的返回信息定义，返回不一致则测试失败
				.andExpect(content().string(
						containsString(MsgConsts.getErrMsg(MsgConsts.ERRCODE_SUCCESS))))
				.andDo(document("userRegister"）) //做一些其他的事情
				.andReturn().getResponse().getContentAsString(); //获取返回信息
		System.out.println(responseString);
	}
}
```

## 二、Spring REST Docs

***

### 1、原理说明

为了简化http api文档的编写维护，Spring REST Docs在测试中将api信息写好、测试通过会将编写的信息生成几个adoc格式的文档输出到指定目录，然后通过asciidoctor-maven-plugin将adoc文档转换为最终的api html 文档。

需要做的事情

* 编写测试，在测试中说明请求参数、返回类型的信息
* 执行测试并通过测试
* 编写index.adoc，引用测试过程中生成的adoc文件
* 执行`mvn package`
* 查看target目录中的生成的文档

### 2、加入Spring REST Docs相关依赖

```xml
		<dependency>
			<groupId>org.springframework.restdocs</groupId>
			<artifactId>spring-restdocs-mockmvc</artifactId>
			<scope>test</scope>
		</dependency>
```

### 3、adoc语法说明说明

> http://asciidoctor.org/
> http://asciidoctor.org/docs
> 下载[AsciidocFx](https://github.com/asciidocfx/AsciidocFX/releases)

#### （1）表格

在测试中对参数和返回信息的进行说明将会生成表格形式的文档

```
|===
|Parameter|Description

|`username`
|用户名

|`name`
|姓名

|`password`
|密码（明文）

|===
```

生成的表格

|Parameter|Description|
|---------|-----------|
|`username`|用户名|
|`name`|姓名|
|`password`|密码（明文）|

#### （2）标题

```
= 文档标题，一个文档一般只允许有一个（相当于H1） (Level 0)

== 1级标题

=== 2级标题

==== 3级标题

===== 4级标题

====== 5级标题
```

#### （3）一些提示图标

```
NOTE: 警告段引起读者的注意 辅助信息。
它的目的是由标签决定的 在段落的开头。

TIP: 专业小贴士...

IMPORTANT: 别忘了...

WARNING: 当心...

CAUTION: 确保这件事...
```

或者定义一个段

```
[NOTE]
====
An admonition block may contain complex content.

.A list
- one
- two
- three

Another paragraph.
====
```

#### （4）代码段

```
[source,ruby]
----
require 'sinatra' // <1>

get '/hi' do // <2>
  "Hello World!" // <3>
end
----
<1> Library import
<2> URL mapping
<3> HTTP response body


[source,ruby]
.app.rb
----
require 'sinatra'
get '/hi' do
 "Hello World!"
end
----
```

#### （5）一些效果

* `*加粗*`或者`**加粗**`：**粗体**
* `_斜体_` 或则 `__斜体__`：_斜体_
* `*_斜体加粗_*`:**_斜体加粗_**
* \`内联代码\`：`内联代码`
* `^上标^和~下标~`
* `#字体背景为黄色#`

#### （6）列表

无序列表

```
* level 1
** level 2
*** level 3
**** level 4
***** level 5
* level 1
```

有序列表

```
. Step 1
. Step 2
. Step 3
```

清单

```
清单

* [*] checked
* [x] also checked
* [ ] not checked
*     normal list item
```

定义列表

```
first term:: definition of first term
second term:: definition of second term
```

Q&A

```
[qanda]
What is Asciidoctor?::
  An implementation of the AsciiDoc processor in Ruby.
What is the answer to the Ultimate Question?:: 42
```

#### （7）链接与图片

```
http://asciidoctor.org[Asciidoctor]
```

效果：[Asciidoctor](http://asciidoctor.org)

图片

```
image::http://asciidoctor.org/images/octocat.jpg[GitHub mascot]
```

### 4、编写测试类

```java
@RunWith(SpringRunner.class)
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureRestDocs(outputDir = "target/snippets")
public class UserControllerTest {
	@Autowired
	private MockMvc mockMvc;

	public void testRegister() throws Exception {
		mockMvc.perform(/*请求的url信息*/)
			.andExpect(/**/)
			.andDo(document("userRegister")) //document 就是生成文档的相关的api
	}
}
```

这样执行测试在`target/snippets/userRegister`目录下就会生成如下文档

```
curl-request.adoc
http-request.adoc
http-response.adoc
httpie-request.adoc
```

`http-request.adoc`内容如下

```
[source,http,options="nowrap"]
----
POST /user/register.json HTTP/1.1
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
Accept: application/json
Host: localhost:8080

username=root&name=root&password=123456
----
```

### 5、spring-boot-maven-plugin

#### （1）添加maven插件

spring-boot-maven-plugin的作用是将adoc类型的文档编译成html或者pdf等类型的文档

```xml
			<plugin>
				<groupId>org.asciidoctor</groupId>
				<artifactId>asciidoctor-maven-plugin</artifactId>
				<!-- 全局配置 -->
				<configuration>
					<!--配置index.adoc的获取路径-->
					<sourceDocumentName>index.adoc</sourceDocumentName>
					<attributes>
						<doctype>book</doctype>
						<toc>left</toc>
						<toclevels>3</toclevels>
					</attributes>
				</configuration>
				<executions>
					<execution>
						<id>generate-docs</id>
						<phase>prepare-package</phase>
						<goals>
							<goal>process-asciidoc</goal>
						</goals>
						<configuration>
							<sourceDocumentName>index.adoc</sourceDocumentName>
							<backend>html</backend>
							<attributes>
								<snippets>${project.build.directory}/snippets</snippets>
							</attributes>
						</configuration>
					</execution>
				</executions>
			</plugin>
```

#### （2）配置说明

> 参考：[官方文档](https://github.com/asciidoctor/asciidoctor-maven-plugin/blob/master/README_zh-CN.adoc)

**执行任务配置`<execution>`**

```xml
<plugin>
    ...
    <executions>
        <execution>
            <id>output-html</id>
            <phase>generate-resources</phase>
            <goals>
                <goal>process-asciidoc</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

* `<id>` 这是执行唯一ID。
* `<phase>`指定在maven生命的循环中那个阶段执行
	* `prepare-package`打包前执行
	* `generate-resources`
* `<goal>`Asciidoctor Maven 插件在此时的执行目标。

**配置选项`<configuration>`**

* `<sourceDirectory>` 源文件目录 默认`${basedir}/src/main/asciidoc`
* `<sourceDocumentName>` 源文件名默认指向 ${sourceDirectory} 中的所有文件
* `<sourceDocumentExtensions>`（在 v1.5.3 及其以下版本中被命名为 extensions) 一系列需要渲染的不标准的文件扩展名。目前，ad、adoc 和 asciidoc 默认就会被渲染。
* `<outputDirectory>` 源文件编译后输出的目录`${project.build.directory}/generated-docs`
* `<baseDir>`（不是 Maven 的 basedir）设置资源（例如被包含的文件）的根目录，默认指向 `${sourceDirectory}`。
* `<skip>` 跳过生成则设置为 true， 默认`false`。
* `<preserveDirectories>` 指明是否渲染成和源文件相同的目录结构。默认为 false。 当为 true 时，不在将所有文件都生成到同一个目录中，而是将输出文件生成到相同的目录结构中。看下面的例子。
			├── docs                          ├── docs
			│   ├── examples.adoc             │   ├── examples.html
			│   └── examples            =>    │   └── examples
			│       ├── html.adoc             │       ├── html.html
			│       └── docbook.adoc          │       └── docbook.html
			└── index.adoc                    └── index.html
* `<relativeBaseDir>`只有在 baseDir 没有指明的情况下才使用。启用则指明每一个 AsciiDoc 文件都必须从同一个目录下搜索它的资源文件（例如被包含的文件）。在内部，对于每一个 AsciiDoc 源文件，设置 baseDir 与源文件相同的路径。默认为 false。
* `<imagesDir>`默认指向 images，它是相对于源码目录的相对路径
* `<backend>`输出文件的类型
* `<doctype>`文档类型
* ...
* `<attributes>`包含传递给 Asciidoctor 的属性的 `Map<String,Object>`，默认为 null，在此填写属性，在adoc文档中可以通过`{属性名}`引用。例子
	添加属性

```xml
<attributes>
	<snippets>${project.build.directory}/snippets</snippets>
</attributes>
```

在adoc文件中

```
include::{snippets}/userLogin/http-request.adoc[]
```

**小技巧**

为每个版本在不同目录中生成文档

```xml
<configuration>
    ...
    <outputDirectory>target/generated-docs/${project.version}</outputDirectory>
    ...
</configuration>
```

启用章节数值

```xml
<attributes>
	<doctype>book</doctype>
	<toc>left</toc>
	<toclevels>3</toclevels>
	<sectnums>true</sectnums>
</attributes>
```

### 6、编写index文档

```
= 简单商品管理系统Api文档
Rectcircle <sunben960729@163.com>
v1.0, 2017-11-04

This is an example output for a service running at http://localhost:8080

== 用户接口
=== 用户注册

.curl
include::{snippets}/userRegister/curl-request.adoc[]

.request
include::{snippets}/userRegister/http-request.adoc[]

正确返回

.response
include::{snippets}/userRegister/http-response.adoc[]

错误返回

.response
include::{snippets}/userRegisterError/http-response.adoc[]
```

根据`asciidoctor-maven-plugin`配置的`<phase>`执行maven 命令最后在配置的输出位置看到生成的文档

### 7、Spring REST Docs详细说明

> [Spring REST Docs官方文档](https://docs.spring.io/spring-restdocs/docs/current/reference/html5/#documenting-your-api-request-response-payloads)

#### （1）基本方式

```java
this.mockMvc.perform(get("/").accept(MediaType.APPLICATION_JSON))
	.andExpect(status().isOk())
	.andDo(document("index"));
```

#### （2）对json类型的请求和响应体进行解释

```java
document("index",
				requestFields(
						fieldWithPath("xxx").description("xxx"),
				),
				responseFields(
						fieldWithPath("contact.email").description("The user's email address"),
						fieldWithPath("contact.name").description("The user's name")))
```

responseFields对应的数据必须为以下结构

```json
{
	"contact": {
		"name": "Jane Doe",
		"email": "jane.doe@example.com"
	}
}
```

**说明**

* 进行测试时，进行描述的结构必须存在否则测试失败
	* 不能出现有的结构但是没有在`fieldWithPath`中进行解释的
	* 不能出先没有的但是在`fieldWithPath`中进行解释的（没有执行optional()）

**fieldWithPath**的相关用法

```java
fieldWithPath("errcode") //生成一个表述器，参数为字段的路径
	.description("错误码") //描述
	.type(JsonFieldType.NUMBER) //类型
	.optional() //可选参数，是否存在
	.ignored(); //不添加到生成文档中
```

```json
{
	"a":{
		"b":[
			{
				"c":"one"
			},
			{
				"c":"two"
			},
			{
				"d":"three"
			}
		],
		"e.dot" : "four"
	}
}
```

**对于以上格式的字段路径说明**

* `a` 一个包含b的对象
* `a.b`或者`['a']['b']`或者 `a['b']` 或者 `['a'].b` 或者 `a.b[]` 一个包含三个对象的数组
* `a.b[].c` 包含字符串"one"和"two"的数组
* `a.b[].d` 字符串"three"
* `a['e.dot']` 或者 `['a']['e.dot']` "four"字符串
* 对于顶层是`[]`json 例如`[{"id":1}]`
	* `[].id`

**预定义**

对于以下结构

```json
[{
	"title": "Pride and Prejudice",
	"author": "Jane Austen"
},
{
	"title": "To Kill a Mockingbird",
	"author": "Harper Lee"
}]
```

定义

```java
FieldDescriptor[] book = new FieldDescriptor[] {
		fieldWithPath("title").description("Title of the book"),
		fieldWithPath("author").description("Author of the book") };
```

使用

```java
//只有一个对象
document("book", responseFields(book))
//对于以上结构
document("book",
				responseFields(
						fieldWithPath("[]").description("An array of books"))
								.andWithPrefix("[].", book))
```

**子文档**

```json
{
	"weather": {
		"wind": {
			"speed": 15.3,
			"direction": 287.0
		},
		"temperature": {
			"high": 21.2,
			"low": 14.8
		}
	}
}
```

写法

```java
document("location",
				responseFields(beneathPath("weather.temperature"),
												fieldWithPath("high").description("The forecast high in degrees celcius"),
												fieldWithPath("low").description("The forecast low in degrees celcius")
												)
				)
```

#### （3）请求post form参数、或者get查询解释

简单实例

```java
this.mockMvc.perform(get("/users?page=2&per_page=100"))
	.andExpect(status().isOk())
	.andDo(document("users", requestParameters(
			parameterWithName("page").description("The page to retrieve"),
			parameterWithName("per_page").description("Entries per page")
	)));
```

#### （4）路径参数

```java
this.mockMvc.perform(get("/locations/{latitude}/{longitude}", 51.5072, 0.1275))
	.andExpect(status().isOk())
	.andDo(document("locations", pathParameters(
			parameterWithName("latitude").description("The location's latitude"),
			parameterWithName("longitude").description("The location's longitude")
	)));
```

#### （5）请求 parts

```java
this.mockMvc.perform(fileUpload("/upload").file("file", "example".getBytes()))
	.andExpect(status().isOk())
	.andDo(document("upload", requestParts(
			partWithName("file").description("The file to upload"))
));
```

#### （6）Documenting a request part’s fields

```java
MockMultipartFile image = new MockMultipartFile("image", "image.png", "image/png",
		"<<png data>>".getBytes());
MockMultipartFile metadata = new MockMultipartFile("metadata", "",
		"application/json", "{ \"version\": \"1.0\"}".getBytes());

this.mockMvc.perform(fileUpload("/images").file(image).file(metadata)
			.accept(MediaType.APPLICATION_JSON))
	.andExpect(status().isOk())
	.andDo(document("image-upload", requestPartFields("metadata",
			fieldWithPath("version").description("The version of the image"))));
```

#### （7）HTTP 头

```java
this.mockMvc
	.perform(get("/people").header("Authorization", "Basic dXNlcjpzZWNyZXQ="))
	.andExpect(status().isOk())
	.andDo(document("headers",
			requestHeaders(
					headerWithName("Authorization").description(
							"Basic auth credentials")),
			responseHeaders(
					headerWithName("X-RateLimit-Limit").description(
							"The total number of requests permitted per period"),
					headerWithName("X-RateLimit-Remaining").description(
							"Remaining requests permitted in current period"),
					headerWithName("X-RateLimit-Reset").description(
							"Time at which the rate limit period will reset"))));
```

#### （8）重复利用生成片段

```java
protected final LinksSnippet pagingLinks = links(
		linkWithRel("first").optional().description("The first page of results"),
		linkWithRel("last").optional().description("The last page of results"),
		linkWithRel("next").optional().description("The next page of results"),
		linkWithRel("prev").optional().description("The previous page of results"));


this.mockMvc.perform(get("/").accept(MediaType.APPLICATION_JSON))
	.andExpect(status().isOk())
	.andDo(document("example", this.pagingLinks.and(
			linkWithRel("alpha").description("Link to the alpha resource"),
			linkWithRel("bravo").description("Link to the bravo resource"))));
```

#### （9）记录约束

```java
public void example() {
	ConstraintDescriptions userConstraints = new ConstraintDescriptions(UserInput.class);
	List<String> descriptions = userConstraints.descriptionsForProperty("name");
}

static class UserInput {

	@NotNull
	@Size(min = 1)
	String name;

	@NotNull
	@Size(min = 8)
	String password;
}
```
