---
title: "SpringBoot单页App配置"
date: 2019-09-10T16:44:03+08:00
draft: true
toc: true
comments: true
tags:
  - Java
---

[参考链接](https://www.hiczp.com/2018/11/22/java/Spring-Boot%E4%B8%AD%E9%85%8D%E7%BD%AE%E5%8D%95%E9%A1%B5%E5%BA%94%E7%94%A8/)

## 场景

在开发某项目过程中，前端使用React、后端使用SpringBoot，前后端分离的方案。当在部署上，
在没有方便的前端独立部署的方案时，需要前端编译好的html放入SpringBoot作为静态文件。至于CSS、JS等资源，将上传到CDN中，不需要后端参与。

后端的相关内容如下：

* `server.servlet.context-path=/your_path`
* 所有的API都以 `/api/v1` 作为前缀（浏览器表现为 `/your_path/api/v1`）

React 是单页APP，在本项目中，使用到了react-router 4.0，选择通过history的方式进行路由。配置如下

* Router的basename配置为 `/your_path`

## 思路

在后端实现如下效果：

* 如果path前缀 `/your_path/api/v1` 则进入业务逻辑返回接口数据
* 如果path前缀不为 `/your_path/api/v1` 则优先到 `spring.resources.static-locations` 路径下寻找资源
* 如果找不到，则默认返回 `index.html` 文件

## 实现过程

### 通过 `ResourceHandlerRegistry` 配置静态资源 `Resolver`

```java
@Configuration
// ...
@Configuration
@SpringBootApplication
public class YourApplication extends WebMvcConfigurationSupport {
    @Autowired
    private ResourceProperties resourceProperties;
  
    @Override
    protected void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations(resourceProperties.getStaticLocations()) // 配置部署环境所在目录
                .setCacheControl(CacheControl.noCache())
                .resourceChain(true)
                .addResolver(new PathResourceResolver(){
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource result = super.getResource(resourcePath, location);
                        if (result == null) {
                            result = super.getResource("index.html", location);
                        }
                        return result;
                    }
                });
    }
}
```

application.yml 配置如下

```yaml
spring.resources.static-locations: file:/opt/static/
```

* 以上配置会导致访问 `/your_path/` 返回404，因为使用的是 `/**`
* 即使使用 `registry.addResourceHandler("/**", "/")` 也不会生效，因为 `"/"` 有特殊含义表示 `rootHandler` 因此不会走 配置的逻辑（源码有这个逻辑，参见 `org.springframework.web.servlet.resource.ResourceHttpRequestHandler#getResource` 如果path是`""`就会返回null从而报错）

非常不优雅的解决方法:

### 创建一个HomeController

```java

package xxx;

import java.io.IOException;

import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.web.ResourceProperties;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * HomeController
 */
@Controller
public class HomeController {

    @Autowired
    private ResourceProperties resourceProperties;

    private String cache;
    private long lastModifyTime;

    // 与前端结合点
    @RequestMapping("/")
    public void home(HttpServletResponse response) throws IOException {
        ResourceLoader loader = new DefaultResourceLoader();
        Resource res = loader.getResource(resourceProperties.getStaticLocations()[0] + "index.html");
        long nowModifyTime = res.getFile().lastModified();
        if (cache == null || nowModifyTime != this.lastModifyTime) {
            this.lastModifyTime = nowModifyTime;
            this.cache = FileUtils.readFileToString(res.getFile(), "utf-8");
        }
        response.setContentType(MediaType.TEXT_HTML_VALUE + ";charset=UTF-8");
        response.getWriter().write(this.cache);
    }
}
```
