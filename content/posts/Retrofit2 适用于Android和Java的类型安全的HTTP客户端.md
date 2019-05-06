---
title: Retrofit2 适用于Android和Java的类型安全的HTTP客户端
date: 2017-10-21T17:13:34+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/106
  - /detail/106/
tags:
  - java
---

> http://square.github.io/retrofit/
> 推荐： http://www.jianshu.com/p/308f3c54abdd

## 目录
* [一、入门](#一、入门)
	* [1、一般步骤](#1、一般步骤)
	* [2、Retrofit注解详解](#2、Retrofit注解详解)
	* [3、Converter与Gson](#3、Converter与Gson)
	* [4、CallAdapter与RxJava2](#4、CallAdapter与RxJava2)
* [二、高级用法](#二、高级用法)
	* [1、自定义Converter](#1、自定义Converter)
	* [2、自定义CallAdapter](#2、自定义CallAdapter)
	* [3、其他说明](#3、其他说明)

## 一、入门
***************************
### 1、一般步骤
#### （0）引入依赖
* [retrofit](http://mvnrepository.com/artifact/com.squareup.retrofit2/retrofit)

#### （1）创建一个Http请求服务的接口
假设需要从github上下载某个用户的同一个项目的一个json配置文件
```java
public interface RuquireUrlsService {
	@GET("{user}/BindingSearch/master/requireUrls.json")
	Observable<ResponseBody> getRequireUrls(@Path("user") String user);
}
```

#### （2）创建Retrofit实例
```java
		Retrofit retrofit = new Retrofit.Builder()
				.baseUrl("https://raw.githubusercontent.com/")
				.build();
```
创建Retrofit实例时需要通过Retrofit.Builder,并调用baseUrl方法设置URL。
Retrofit2 的baseUlr 必须以 /（斜线） 结束，不然会抛出一个IllegalArgumentException。

#### （3）创建请求的实例
```java
//创建一个请求接口的实例对象（内部通过反射产生）
		RuquireUrlsService  service= retrofit.create(RuquireUrlsService.class);
```

#### （4）获取Call对象并异步执行请求
```java
Call<ResponseBody> call = service.getRequireUrls("rectcircle");

		call.enqueue(new Callback<ResponseBody>() {
			@Override
			public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
				try {
					System.out.println(response.body().string());
				} catch (IOException e) {
					e.printStackTrace();
				}
			}

			@Override
			public void onFailure(Call<ResponseBody> call, Throwable t) {
				t.printStackTrace();
			}
		});
```

#### （5）输出
```json
{
  "version": "0.1",
  "requireUrls": [
    {
      "name": "百度",
      "url":"https://passport.baidu.com/v2/?regphonecheck&apiver=v3&phone={{phone}}",
      "loginUrl":"https://passport.baidu.com",
      "logoUrl":"https://www.baidu.com/favicon.ico",
      "prefix": "{{",
      "suffix": "}}",
      "isBind": "手机号已被注册",
      "noBind": "成功"
    }
  ]
}
```



### 2、Retrofit注解详解
#### （1）Http请求方法相关注解：
* GET
* POST
* PUT
* DELETE
* PATCH
* HEAD
* OPTIONS
* HTTP

HTTP注解具有三个属性，可以实现其他方法
* method
* path
* hasBody

URL参数必填，没有使用`"/"`，否者将报错

#### （2）标记注解
**@FormUrlEncoded**：请求表单
```java
@POST("/form")
@FormUrlEncoded
Call<ResponseBody> testFormUrlEncoded1(@Field("username") String name, @Field("age") int age);

/**
* Map的key作为表单的键
*/
@POST("/form")
@FormUrlEncoded
Call<ResponseBody> testFormUrlEncoded2(@FieldMap Map<String, Object> map);
```

**@Multipart**：用于上传文件
```java
/**
* {@link Part} 后面支持三种类型，{@link RequestBody}、{@link okhttp3.MultipartBody.Part} 、任意类型
* 除 {@link okhttp3.MultipartBody.Part} 以外，其它类型都必须带上表单字段({@link okhttp3.MultipartBody.Part} 中已经包含了表单字段的信息)，
*/
@POST("/form")
@Multipart
Call<ResponseBody> testFileUpload1(@Part("name") RequestBody name, @Part("age") RequestBody age, @Part MultipartBody.Part file);
```

**@Steaming**返回一个流

[例子](https://github.com/ikidou/Retrofit2Demo/blob/master/client/src/main/java/com/github/ikidou/Example03.java)




#### （3）参数注解
**@Headers**用于注解接口。配置请求头

以下作用于形参
* @Header，添加请求头
* @Body，非表单请求体
* 表单字段，配合@FormUrlEncoded使用
	* @Field
	* @FieldMap
* 文件上传
	* @Part
	* @PartMap
* 作用于URL
	* @Path
	* @Query
	* @QueryMap
	* @Url


注1：{占位符}和PATH尽量只用在URL的path部分，url中的参数使用Query和QueryMap 代替，保证接口定义的简洁
注2：Query、Field和Part这三者都支持数组和实现了Iterable接口的类型，如List，Set等，方便向后台传递数组。
```java
Call<ResponseBody> foo(@Query("ids[]") List<Integer> ids);
//结果：ids[]=0&ids[]=1&ids[]=2
```
[例子](https://github.com/ikidou/Retrofit2Demo/blob/master/client/src/main/java/com/github/ikidou/Example05.java)



### 3、Converter与Gson
使用转换器（Converter）将数据转换为java对象，将请求对象转换为参数
#### （1）引入依赖
* [Converter: Gson](http://mvnrepository.com/artifact/com.squareup.retrofit2/converter-gson)

#### （2）定义映射实体类
```java

class RequireUrls<T> {
	private  String version;

	private T requireUrls;

	public String getVersion() {
		return version;
	}

	public T getRequireUrls() {
		return requireUrls;
	}

	@Override
	public String toString() {
		return "RequireUrls{" +
				"version='" + version + '\'' +
				", requireUrls=" + requireUrls +
				'}';
	}
}

class RequireUrl {
	public String name;
	public String url;
	public String loginUrl;
	public String logoUrl;
	public String prefix;
	public String suffix;

	@Override
	public String toString() {
		return "RequireUrl{" +
				"name='" + name + '\'' +
				", url='" + url + '\'' +
				", loginUrl='" + loginUrl + '\'' +
				", logoUrl='" + logoUrl + '\'' +
				", prefix='" + prefix + '\'' +
				", suffix='" + suffix + '\'' +
				", isBind='" + isBind + '\'' +
				", noBind='" + noBind + '\'' +
				'}';
	}

	public String isBind;
	public String noBind;
}
```

#### （3）创建一个Http请求服务的接口
```java
	public interface RuquireUrlsService {
		@GET("{user}/BindingSearch/master/requireUrls.json")
		Call<RequireUrls<List<RequireUrl>>> getRequireUrls(@Path("user") String user); //泛型中直接使用了实体类
	}
```


#### （4）创建Retrofit实例
```java
		Retrofit retrofit = new Retrofit.Builder()
				.baseUrl("https://raw.githubusercontent.com/")
				.addConverterFactory(GsonConverterFactory.create()) //在此加入转换器
				.build();
```

#### （5）剩余步骤
```java
		//创建一个请求接口的实例对象（内部通过反射产生）
		RuquireUrlsService  service= retrofit.create(RuquireUrlsService.class);
		Call<RequireUrls<List<RequireUrl>>> call = service.getRequireUrls("rectcircle");

		call.enqueue(new Callback<RequireUrls<List<RequireUrl>>>() {
			@Override
			public void onResponse(Call<RequireUrls<List<RequireUrl>>> call, Response<RequireUrls<List<RequireUrl>>> response) {
				System.out.println(response.body().toString());
			}

			@Override
			public void onFailure(Call<RequireUrls<List<RequireUrl>>> call, Throwable t) {

			}
		});
```

#### （5）其他转换器（Converter）
参见[retrofit-converters](https://github.com/square/retrofit/tree/master/retrofit-converters)



### 4、CallAdapter与RxJava2
不直接使用Call对象，使用RxJava管理
#### （1）引入依赖
* 引入下面中的一个
	* 若使用rxjava2：[adapter-rxjava2](http://mvnrepository.com/artifact/com.squareup.retrofit2/adapter-rxjava2)
	* 若使用rxjava1：[adapter-rxjava](http://mvnrepository.com/artifact/com.squareup.retrofit2/adapter-rxjava)
* 在Android中使用还需引入如下之一：
	* 若使用rxjava2：[rxandroid](http://mvnrepository.com/artifact/io.reactivex.rxjava2/rxandroid)
	* 若使用rxjava1：[rxandroid](http://mvnrepository.com/artifact/io.reactivex/rxandroid)

#### （2）创建一个Http请求服务的接口
```java
	public interface RuquireUrlsService {
		@GET("{user}/BindingSearch/master/requireUrls.json")
		Observable<RequireUrls<List<RequireUrl>>> getRequireUrls(@Path("user") String user); //返回的是一个Observable
	}
```


#### （3）创建Retrofit实例
```java
		Retrofit retrofit = new Retrofit.Builder()
				.baseUrl("https://raw.githubusercontent.com/")
				.addConverterFactory(GsonConverterFactory.create())
				.addCallAdapterFactory(RxJava2CallAdapterFactory.create()) //引入了对Rxjava的支持
				.build();
```

#### （4）创建Observable对象
```java
//创建一个请求接口的实例对象（内部通过反射产生）
RuquireUrlsService  service= retrofit.create(RuquireUrlsService.class);

Observable<RequireUrls<List<RequireUrl>>> observable =  service.getRequireUrls("rectcircle");
```

#### （5）实现处理数据
参见[rxjava2](105)
```java
		observable
				.subscribeOn(Schedulers.io())
//				.observeOn(AndroidSchedulers.mainThread()); //安卓要启用这一行
				.subscribe(new Observer<RequireUrls<List<RequireUrl>>>(){
					@Override
					public void onSubscribe(Disposable d) {

					}

					@Override
					public void onNext(RequireUrls<List<RequireUrl>> s) {
						System.out.println((s.toString()));
						//在这里处理数据
					}

					@Override
					public void onError(Throwable e) {

					}

					@Override
					public void onComplete() {

					}
				});
				Thread.sleep(3000); //java main测试加入此行，安卓不需要
```

#### （6）直接获取字符串不使用实体类
例子：获取网站的首页内容（java环境测试）

使用scalar转换器，引入如下依赖
* [Converter: Java Scalars](http://mvnrepository.com/artifact/com.squareup.retrofit2/converter-scalars)

定义服务接口
```java
	public interface HomePageService {
		@GET("/")
		Observable<String> getHome();
	}
```

其他内容
```java
	public static void main(String[] args) throws InterruptedException {
		Retrofit retrofit = new Retrofit.Builder()
				.baseUrl("https://www.baidu.com/")
				.addConverterFactory(ScalarsConverterFactory.create()) //使用scalar转换器，否则报错
				.addCallAdapterFactory(RxJava2CallAdapterFactory.create())
				.build();

		retrofit.create(HomePageService.class)
				.getHome()
				.subscribe(System.out::println);
	}
```



## 二、高级用法
************************************
### 1、自定义Converter
#### （1）Converter接口及其作用：
```java
public interface Converter<F, T> {
	// 实现从 F(rom) 到 T(o)的转换
	T convert(F value) throws IOException;

	// 用于向Retrofit提供相应Converter的工厂
	abstract class Factory {
		// 这里创建从ResponseBody其它类型的Converter，如果不能处理返回null
		// 主要用于对响应体的处理
		public Converter<ResponseBody, ?> responseBodyConverter(Type type, Annotation[] annotations,
																														Retrofit retrofit) {
			return null;
		}

		// 在这里创建 从自定类型到ResponseBody 的Converter,不能处理就返回null，
		// 主要用于对Part、PartMap、Body注解的处理
		public Converter<?, RequestBody> requestBodyConverter(Type type,
																													Annotation[] parameterAnnotations, Annotation[] methodAnnotations, Retrofit retrofit) {
			return null;
		}

		// 这里用于对Field、FieldMap、Header、Path、Query、QueryMap注解的处理
		// Retrfofit对于上面的几个注解默认使用的是调用toString方法
		public Converter<?, String> stringConverter(Type type, Annotation[] annotations,
																								Retrofit retrofit) {
			return null;
		}

	}
}
```
[例子](https://github.com/ikidou/Retrofit2Demo/blob/master/client/src/main/java/com/github/ikidou/Example09.java)


### 2、自定义CallAdapter
[例子](https://github.com/ikidou/Retrofit2Demo/blob/master/client/src/main/java/com/github/ikidou/Example10.java)


### 3、其他说明
略
