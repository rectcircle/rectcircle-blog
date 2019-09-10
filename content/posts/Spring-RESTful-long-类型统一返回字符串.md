---
title: "Spring RESTful Long 类型统一返回字符串"
date: 2019-09-10T19:03:03+08:00
draft: false
toc: true
comments: true
tags:
  - Java
---


改用 `fastjson` 依赖，并覆盖 `WebMvcConfigurationSupport` 配置

```java
// ...

@Configuration
@SpringBootApplication
public class YourApplication extends WebMvcConfigurationSupport {
    public static void main(String[] args) {
        SpringApplication.run(YourApplication.class, args);
    }

    @Override
    public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
        // 1、定义一个convert转换消息的对象
        FastJsonHttpMessageConverter fastConverter = new FastJsonHttpMessageConverter();
        // 2、添加fastjson的配置信息
        FastJsonConfig fastJsonConfig = new FastJsonConfig();
        SerializeConfig serializeConfig = SerializeConfig.globalInstance;
        serializeConfig.put(Long.class, ToStringSerializer.instance);
        serializeConfig.put(Long.TYPE, ToStringSerializer.instance);
        fastJsonConfig.setSerializerFeatures(SerializerFeature.PrettyFormat);
        // 3、在convert中添加配置信息
        fastConverter.setFastJsonConfig(fastJsonConfig);
        // 4、将convert添加到converters中
        converters.add(fastConverter);
        // 5、追加默认转换器
        super.addDefaultHttpMessageConverters(converters);
    }
}

```
