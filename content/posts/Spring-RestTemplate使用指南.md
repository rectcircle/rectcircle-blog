---
title: "Spring RestTemplate使用指南"
date: 2019-09-05T13:20:01+08:00
draft: false
toc: true
comments: true
tags:
  - Java
---

参考：

* 源码
* https://juejin.im/post/5bc75096f265da0aa94a4043
* https://docs.spring.io/spring/docs/current/javadoc-api/org/springframework/web/client/RestTemplate.html

## 〇、介绍

spring-web框架下的一个http客户端，提供了一种通用的接口。

HTTP请求方式可以选择：

* 原生的 `java.net.HttpURLConnection`
* Apache HttpClient
* ...

HTTP请求方式通过 `ClientHttpRequestFactory` 接口适配，默认使用 `SimpleClientHttpRequestFactory`

```
AbstractClientHttpRequestFactoryWrapper, BufferingClientHttpRequestFactory, HttpComponentsAsyncClientHttpRequestFactory, HttpComponentsClientHttpRequestFactory, InterceptingClientHttpRequestFactory, MockMvcClientHttpRequestFactory, Netty4ClientHttpRequestFactory, OkHttp3ClientHttpRequestFactory, SimpleClientHttpRequestFactory
```

提供开箱即用的请求和响应序列化和反序列化工具，且支持高度定制化。接口为 `HttpMessageConverter<>`

## 一、构造方式

```java
RestTemplate restTemplate = new RestTemplate();
```

* HTTP请求方式使用 SimpleClientHttpRequestFactory 及 `java.net.HttpURLConnection`
* 默认添加了众多消息处理器，参见：`RestTemplate#RestTemplate()`

当然spring还提供了其他的构造方式，例如：

```java
SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
requestFactory.setConnectTimeout(1000);
requestFactory.setReadTimeout(1000);
RestTemplate restTemplate1 = new RestTemplate(requestFactory);
```

## 二、相关配置

### 1、requestFactory

HTTP请求方式配置

```java
restTemplate.setRequestFactory(requestFactory);
```

支持介绍所描述的客户端，当然也可以自己实现 `ClientHttpRequestFactory` 接口

### 2、messageConverters

请求体与相应体的序列化、反序列化器

```java
restTemplate.setMessageConverters(messageConverters);
```

* `messageConverters` 类型为 `List<HttpMessageConverter<?>>`
* 比如Json请求体的序列化和反序列化

支持如下方法：

```
AbstractGenericHttpMessageConverter, AbstractHttpMessageConverter, AbstractJackson2HttpMessageConverter, AbstractJaxb2HttpMessageConverter, AbstractJsonHttpMessageConverter, AbstractWireFeedHttpMessageConverter, AbstractXmlHttpMessageConverter, AllEncompassingFormHttpMessageConverter, AtomFeedHttpMessageConverter, BufferedImageHttpMessageConverter, ByteArrayHttpMessageConverter, FormHttpMessageConverter, GsonHttpMessageConverter, Jaxb2CollectionHttpMessageConverter, Jaxb2RootElementHttpMessageConverter, JsonbHttpMessageConverter, MappingJackson2CborHttpMessageConverter, MappingJackson2HttpMessageConverter, MappingJackson2SmileHttpMessageConverter, MappingJackson2XmlHttpMessageConverter, MarshallingHttpMessageConverter, ObjectToStringHttpMessageConverter, ProtobufHttpMessageConverter, ProtobufJsonFormatHttpMessageConverter, ResourceHttpMessageConverter, ResourceRegionHttpMessageConverter, RssChannelHttpMessageConverter, SourceHttpMessageConverter, StringHttpMessageConverter
```

### 3、interceptors

拦截器：配置请求之前的过滤请求

```java
restTemplate.setInterceptors(interceptors);
```

* interceptors 类型为 `List<ClientHttpRequestInterceptor>`
* 用于实现请求之前的校验或者增强

### 4、errorHandler

异常处理器：用于处理请求响应码的异常。

```java
restTemplate.setErrorHandler(errorHandler);
```

* 只能处理http响应码的错误
* 一定不要读取ClientHttpResponse.getBody，因为inputsteam只能读一次
* 默认为 `DefaultResponseErrorHandler`
* 面对国内http状态码为200的错误，只能在 `messageConverter` 层处理

## 三、相关API

常用API如下：

```java
// get请求
getForObject
getForEntity
// post请求
postForXxx
// ...
```

* ForObject表示 返回 `T`
* ForEntity表示 返回 `ResponseEntity<T>`

通用API如下：

```java
exchange
execute
```

* 一般可以使用exchange进行封装，具有很高的灵活性

## 四、实例

### 1、处理url参数（get参数）

```java
String url = "http://localhost:8080/test/sendSms?phone={phone}&msg={phone}";
String result = restOperations.getForObject(url, String.class, "151xxxxxxxx", "测试短信内容");
```

**以下方式默认情况下不支持** （spring 5.x）

```java
String url = "http://localhost:8080/test/sendSms?phone={phone}&msg={phone}";

Map<String, Object> uriVariables = new HashMap<String, Object>();
uriVariables.put("phone", "151xxxxxxxx");
uriVariables.put("msg", "测试短信内容");

String result = restOperations.getForObject(url, String.class, uriVariables);
```

### 2、配置请求头

例如配置cookie

```java
HttpHeaders jsonHeaders = new HttpHeaders();// header参数
jsonHeaders.add(HttpHeaders.COOKIE, "sessionid=" + sessionid);
jsonHeaders.add(HttpHeaders.USER_AGENT, "dwauto");
jsonHeaders.add(HttpHeaders.ACCEPT, "application/json");
jsonHeaders.add(HttpHeaders.CONTENT_TYPE, "application/json");
// request 为 requestbody （任意对象）
HttpEntity<?> requestEntity = new HttpEntity<>(request, jsonHeaders);
ResponseEntity<T> response = restTemplate.exchange(buildUrl(path), HttpMethod.POST, requestEntity, responseType,
    uriVariables);
return response.getBody();
```

### 3、form方式post请求

```java
HttpHeaders formHeaders = new HttpHeaders();// header参数
formHeaders.add(HttpHeaders.COOKIE, "sessionid=" + sessionid);
formHeaders.add(HttpHeaders.USER_AGENT, "dwauto");
formHeaders.add(HttpHeaders.ACCEPT, "application/json");
formHeaders.add(HttpHeaders.CONTENT_TYPE, "application/x-www-form-urlencoded");
// request 为Map<String, ?>
MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
for (Map.Entry<String, ?> entry : request.entrySet()) {
    body.add(entry.getKey(), entry.getValue().toString());
}
HttpEntity<?> requestEntity = new HttpEntity<>(body, formHeaders);
ResponseEntity<T> response = restTemplate.exchange(buildUrl(path), HttpMethod.POST, requestEntity, responseType, uriVariables);
return response.getBody();
```

### 3、定制json解析器

注意使用了Jackson：

* 定制日期序列化方式
* 使用java8的日期时间标准

```java
restTemplate = new RestTemplate();
// 配置JSON解析器
ObjectMapper objectMapper = new ObjectMapper();
JavaTimeModule javaTimeModule = new JavaTimeModule();
// 设置时间格式
javaTimeModule.addDeserializer(LocalDateTime.class,
    new LocalDateTimeDeserializer(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS")));
objectMapper.registerModule(new ParameterNamesModule())
    .registerModule(new Jdk8Module())
    .registerModule(javaTimeModule);
// 忽略不存在字段
objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
List<HttpMessageConverter<?>> messageConverters = restTemplate
    .getMessageConverters()
    .stream()
    .filter(c -> !(c instanceof MappingJackson2HttpMessageConverter))
    .collect(Collectors.toList());
MappingJackson2HttpMessageConverter jsonMessageConverter = new MappingJackson2HttpMessageConverter();
jsonMessageConverter.setObjectMapper(objectMapper);
messageConverters.add(new JsonHttpMessageConverterProxy(jsonMessageConverter));
restTemplate.setMessageConverters(messageConverters);
```

依赖如下

```xml
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.module</groupId>
            <artifactId>jackson-module-parameter-names</artifactId>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.datatype</groupId>
            <artifactId>jackson-datatype-jdk8</artifactId>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.datatype</groupId>
            <artifactId>jackson-datatype-jsr310</artifactId>
        </dependency>
```

### 4、定制200错误处理

例如如下情况：

正确返回

```http
http-status-code 200

{
  "code": 0,
  "data": {},
  "message": "success"
}
```

错误返回

```http
http-status-code 200

{
  "code": 1, // 非零
  "data": 11111, // 一个数字
  "message": "错误信息" // 错误信息
}
```

通过代理Jackson解析器实现

```java
/**
 * 写这个代理的原因：报错 返回200。但是data的值不是null而是 一个 数字。
 * 不写这个代理会抛出序列化异常，从而无法获取错误信息
 */
class JsonHttpMessageConverterProxy implements HttpMessageConverter<Object> {

    private HttpMessageConverter<Object> converter;

    public JsonHttpMessageConverterProxy(HttpMessageConverter<Object> converter) {
        this.converter = converter;
    }

    @Override
    public boolean canRead(Class<?> clazz, MediaType mediaType) {
        return converter.canRead(clazz, mediaType);
    }

    @Override
    public boolean canWrite(Class<?> clazz, MediaType mediaType) {
        return converter.canWrite(clazz, mediaType);
    }

    @Override
    public List<MediaType> getSupportedMediaTypes() {
        return converter.getSupportedMediaTypes();
    }

    @Override
    public Object read(Class<? extends Object> clazz, HttpInputMessage inputMessage)
        throws IOException, HttpMessageNotReadableException {
        String body = new BufferedReader(new InputStreamReader(inputMessage.getBody()))
            .lines().collect(Collectors.joining(System.lineSeparator())).toString();
        Map<String, Object> bodyMap = JSON.parseObject(body);
        Integer code = (Integer) bodyMap.get("code");
        if (code != null && code != 0) {
            bodyMap.put("data", null);
            body = JSON.toJSONString(bodyMap);
        }
        InputStream fixBodyInputStream = new ByteArrayInputStream(body.getBytes());
        return converter.read(clazz, new HttpInputMessage() {

            @Override
            public HttpHeaders getHeaders() {
                return inputMessage.getHeaders();
            }

            @Override
            public InputStream getBody() throws IOException {
                return fixBodyInputStream;
            }
        });
    }

    @Override
    public void write(Object t, MediaType contentType, HttpOutputMessage outputMessage)
        throws IOException, HttpMessageNotWritableException {
        converter.write(t, contentType, outputMessage);
    }
}
```

使用发方式

```java
restTemplate = new RestTemplate();
// 配置JSON解析器
ObjectMapper objectMapper = new ObjectMapper();
// 其他配置...
MappingJackson2HttpMessageConverter jsonMessageConverter = new MappingJackson2HttpMessageConverter();
jsonMessageConverter.setObjectMapper(objectMapper);
List<HttpMessageConverter<?>> messageConverters = restTemplate
                      .getMessageConverters()
                      .stream()
                      .filter(c -> !(c instanceof MappingJackson2HttpMessageConverter))
                      .collect(Collectors.toList());
// 使用这个代理
messageConverters.add(new JsonHttpMessageConverterProxy(jsonMessageConverter));
restTemplate.setMessageConverters(messageConverters);
```
