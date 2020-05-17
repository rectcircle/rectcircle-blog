---
title: "Nginx 部署单页应用（React）"
date: 2020-04-29T14:57:25+08:00
draft: false
toc: true
comments: true
tags:
  - 前端
---

## 思路

```
流量 ----> Nginx -------- /api/**  ------------> 后端
                    |
                    |----- path 带后缀的**.* ---> 指定目录的静态文件
                    |
                    |----- path不带后缀的 --->  rewrite 到 index.html
```

## Nginx 配置

```conf
user  nginx;
worker_processes  1;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;

    keepalive_timeout  65;

    server {
        listen       80;
        server_name  localhost;
        root /xxx/xxx/webui/static;

        location /api {
            proxy_pass 后端host;
        }

        location ~ ^/.*\.\w+$ {
            index  /index.html;
        }

        location / {
            rewrite .* /index.html break;
        }

        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root html;
        }
    }
}
```
