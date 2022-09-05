---
title: "Openresty"
date: 2022-09-02T20:35:35+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## 简介

## 快速开始

### 安装

> 官方文档：[安装](https://openresty.org/cn/installation.html)

Mac(brew) 安装

```bash
brew install openresty/brew/openresty
```

其他平台参见：

* [OpenResty® Linux 包](https://openresty.org/cn/linux-packages.html)

以 Linux 平台为例，安装的内容 (`dpkg -L openresty`) 如下所示：

```
/usr/local/openresty/bin
/usr/local/openresty/luajit
/usr/local/openresty/lualib
/usr/local/openresty/nginx
/usr/local/openresty/nginx/conf
/usr/local/openresty/nginx/html
/usr/local/openresty/nginx/logs
/usr/local/openresty/nginx/sbin/nginx
/usr/local/openresty/site

/etc/init.d/openresty
/lib/systemd/system/openresty.service

/usr/share/doc/openresty
/etc/openresty
/usr/bin/openresty
```

通过 brew 在 Mac 上安装，目录结构和 Linux 类似，对应关系为：

* /usr/local/openresty 对应 /usr/local/Cellar/openresty/x.y.z
* /etc/openresty 对应 /usr/local/etc/openresty/
* /usr/bin/openresty 对应 /usr/local/bin/openresty
* /lib/systemd/system/openresty.service 对应 /usr/local/Cellar/openresty/x.y.z/homebrew.mxcl.openresty.plist

需要特别注意的是，默认的配置文件位于：`/usr/local/etc/openresty/nginx.conf` （Linux 为 `/etc/openresty/nginx.conf`）。

### 运行

手动启动

```bash
sudo openresty -g 'daemon off; master_process on;' # 可以通过 -c 指定 nginx 配置文件
```

Mac(brew) 开机自启

```bash
# 后台启动并设置开机自启
sudo brew services start openresty/brew/openresty
# 停止并取消后台启动
sudo brew services stop openresty/brew/openresty
```

Linux(systemd) 开机自启

```bash
# 设置开机自启
sudo systemctl enable openresty
# 取消开机自启
sudo systemctl disable openresty
# 启动服务
sudo systemctl start openresty
```

浏览器打开 http://127.0.0.1 即可看到默认页面。

### 配置

> 官方文档：[Getting Started](https://openresty.org/cn/getting-started.html)

修改 `/usr/local/etc/openresty/nginx.conf` (Linux 为 `/etc/openresty/nginx.conf`) 为如下内容：

```nginx
worker_processes 1;
error_log /dev/stderr;
events {
    worker_connections 1024;
}
http {
    server {
        listen 80;
        location / {
            default_type text/html;
            content_by_lua_block {
                ngx.say("<p>hello, world</p>")
            }
        }
    }
}
```

加载配置：

```bash
sudo openresty -s reload
```

执行 `curl http://127.0.0.1`，输出如下：

```html
<p>hello, world</p>
```
