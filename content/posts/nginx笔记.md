---
title: "Nginx笔记"
date: 2019-07-09T19:13:22+08:00
draft: true
toc: true
comments: true
tags:
  - 后端
---

> https://www.yiibai.com/nginx/beginners_guide.html

## 一、安装和基本配置

### 1、特点

web服务器、反向代理服务器、邮件服务器、负载均衡服务器

* 基于事件、异步、单线程服务器
* 占用资源少
* 并发性大

### 2、安装

参考 [官网](http://nginx.org/en/linux_packages.html)

### 3、基本配置

#### （1）静态web网站配置

创建测试用静态文件目录

```bash
mkdir -p /data/www
echo '<h1>Hello Nginx</h1>' > ~/www/index.html
mkdir -o /data/test
echo '<h1>alias</h1>' > ~/www/index.html
```

编辑 `/etc/nginx/conf.d/default.conf`

```nginx
server {
    listen       80;
    server_name  localhost;

    #charset koi8-r;
    #access_log  /var/log/nginx/host.access.log  main;

    location / {
#        root   /usr/share/nginx/html;
        root /data/www;
        index  index.html index.htm;
    }
    location /test/ {
        alias /data/test/;
        index index.html index.htm;
    }
#    location /test/ {
#        alias /data;
#        index index.html index.htm;
#    }
    #error_page  404              /404.html;

    # redirect server error pages to the static page /50x.html
    #
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }

    # proxy the PHP scripts to Apache listening on 127.0.0.1:80
    #
    #location ~ \.php$ {
    #    proxy_pass   http://127.0.0.1;
    #}

    # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
    #
    #location ~ \.php$ {
    #    root           html;
    #    fastcgi_pass   127.0.0.1:9000;
    #    fastcgi_index  index.php;
    #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
    #    include        fastcgi_params;
    #}

    # deny access to .htaccess files, if Apache's document root
    # concurs with nginx's one
    #
    #location ~ /\.ht {
    #    deny  all;
    #}
}
```

alias 与 root 的区别（[参考](https://www.e-learn.cn/content/nginx/835450)）

```nginx
    location /test/ {
        alias /data/test/;
        index index.html index.htm;
    }
```

* http://localhost/test/<mark>index.html</mark> -> /data/test/<mark>index.html</mark>
* `alias /data/test/;` 最后的反斜杠不能省略
* 子路径推荐使用

```nginx
    location /test/ {
        alias /data;
        index index.html index.htm;
    }
```

* http://localhost/<mark>test/index.html</mark> -> /data/<mark>test/index.html</mark>
* 根路径推荐使用

#### （2）反向代理

假设有一个web服务器监听在localhost的5000端口

```bash
mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak
cp /etc/nginx/conf.d/default.conf.bak /etc/nginx/conf.d/reverse-proxy.conf
```

编辑 `/etc/nginx/conf.d/reverse-proxy.conf`

```nginx
server {
    listen       80;
    server_name  localhost;

    #charset koi8-r;
    #access_log  /var/log/nginx/host.access.log  main;


    #error_page  404              /404.html;

    # redirect server error pages to the static page /50x.html
    #
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }

    # proxy the PHP scripts to Apache listening on 127.0.0.1:80
    #
    #location ~ \.php$ {
    #    proxy_pass   http://127.0.0.1;
    #}

    location / {
        proxy_pass http://localhost:5000;
    }

    location /test/ {
        proxy_pass http://localhost:5000;
    }

    # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
    #
    #location ~ \.php$ {
    #    root           html;
    #    fastcgi_pass   127.0.0.1:9000;
    #    fastcgi_index  index.php;
    #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
    #    include        fastcgi_params;
    #}

    # deny access to .htaccess files, if Apache's document root
    # concurs with nginx's one
    #
    #location ~ /\.ht {
    #    deny  all;
    #}
}
```

location 末尾是否加  `/` 的区别：

```nginx
    location /test/ {
        proxy_pass http://localhost:5000;
    }
```

* 以 `/` 结尾： localhost/test/a -> localhost:5000/a

```nginx
    location /test {
        proxy_pass http://localhost:5000;
    }
```

* 不以 `/` 结尾：localhost/test/a -> localhost:5000/test/a
