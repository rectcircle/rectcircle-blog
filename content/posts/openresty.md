---
title: "Openresty 使用"
date: 2022-09-02T20:35:35+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 简介

按照官方的介绍： OpenResty 是一个基于 Nginx 与 Lua 的高性能 Web 平台，其内部集成了大量精良的 Lua 库、第三方模块以及大多数的依赖项。用于方便地搭建能够处理超高并发、扩展性极高的动态 Web 应用、Web 服务和动态网关。

简单来讲， OpenResty = Nginx + LuaJIT + OpenResty Lua 内置模块 + 第三方 Lua 模块。首次安装好的 OpenResty 包含 Nginx + LuaJIT + OpenResty Lua 内置模块。如果官方的模块无法满足需求，可以自己实现或者安装第三方 Lua 模块，以实现更高自由度的扩展和定制。

关于 Lua 参见：[LuaJIT 和 Lua 5.1](/posts/luajit-and-lua5.1/)

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
error_log /dev/stderr info;
events {
    worker_connections 1024;
}
http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /dev/stdout main;
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

## 示例

> 以下示例仅供参考，未在生产环境验证。

### 基于 Redis 动态路由

> 参考：[官方文档](https://openresty.org/cn/dynamic-routing-based-on-redis.html)

修改 `/usr/local/etc/openresty/nginx.conf` (Linux 为 `/etc/openresty/nginx.conf`) 为如下内容：

```nginx
worker_processes 1;
error_log /dev/stderr info;
events {
    worker_connections 1024;
}
http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /dev/stdout main;
    # 模拟两个服务 8001 和 8002
    # 正常情况，这两个服务应该部署在自己的机器上
    server {
        listen 8001;
        location / {
            default_type text/html;
            content_by_lua_block {
                ngx.say("<p>service: 8001</p>")
            }
        }
    }
    server {
        listen 8002;
        location / {
            default_type text/html;
            content_by_lua_block {
                ngx.say("<p>service: 8002</p>")
            }
        }
    }
    # 将 redis get 命令转换为一个 http 请求
    server {
        listen 80;
        location = /redis {
            # 这里为了直观的可以看出的输出，先公开
            # 正常情况，应该放开注释的
            # internal;
            set_unescape_uri $key $arg_key;
            # redis2 相关指令，参见 redis2-nginx-module: https://github.com/openresty/redis2-nginx-module
            redis2_query get $key;
            redis2_pass 127.0.0.1:6379;
        }

        location / {
            set $target '';
            # access_by_lua_block 在访问的时候会被执行
            # 更多参见： https://github.com/openresty/lua-nginx-module#access_by_lua_block
            access_by_lua_block {
                local key = ngx.var.arg_key
                print("key: ", key)

                -- 调用 Nginx 内部路径
                local res = ngx.location.capture(
                    "/redis", { args = { key = key } }
                )

                if res.status ~= 200 then
                    ngx.log(ngx.ERR, "redis server returned bad status: ",
                        res.status)
                    ngx.exit(res.status)
                end

                if not res.body then
                    ngx.log(ngx.ERR, "redis returned empty body")
                    ngx.exit(500)
                end

                -- 解析 redis 返回
                local parser = require "redis.parser"
                local server, typ = parser.parse_reply(res.body)
                if typ ~= parser.BULK_REPLY or not server then
                    ngx.log(ngx.ERR, "bad redis response: ", res.body)
                    ngx.exit(500)
                end
                print("server: ", server)
                
                -- 将返回的 server 设置给变量 target
                ngx.var.target = server
            }

            proxy_pass http://$target;
        }
    }
}
```

加载配置

```bash
sudo openresty -s reload
```

写入路由到 redis 里面

```bash
echo "set service-8001 '127.0.0.1:8001'\nset service-8002 '127.0.0.1:8002'" | redis-cli
```

验证：

* `curl 'http://127.0.0.1/redis?key=service-8001'` 可以看到刚刚设置的到 redis 中的信息。

    ```
    $14
    127.0.0.1:8001
    ```

* `curl 'http://127.0.0.1/?key=service-8001'` 从输出 `<p>service: 8001</p>`，可以看到路由到了 8001 端口。
* `curl 'http://127.0.0.1/?key=service-8002'` 从输出 `<p>service: 8002</p>`，可以看到路由到了 8002 端口。

### 基于 Redis 进行服务发现和负载均衡

* 服务通过注册到 Redis 中的名为服务名的 hash 中，key 该实例的 host, value 为该实例的一些元信息，在本例中为一致性 hash 的权重。
* 每个请求过来后，在 Openresty 中，通过 Redis lua 库查询当前服务信息，并通过一定策略选取一个 host

修改 `/usr/local/etc/openresty/nginx.conf` (Linux 为 `/etc/openresty/nginx.conf`) 为如下内容：

```nginx
worker_processes 1;
error_log /dev/stderr info;
events {
    worker_connections 1024;
}
http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /dev/stdout main;
    # 模拟两个服务 8001 和 8002
    # 正常情况，这两个服务应该部署在自己的机器上
    server {
        listen 8001;
        location / {
            default_type text/html;
            content_by_lua_block {
                ngx.say("<p>service: 8001</p>")
            }
        }
    }

    server {
        listen 8002;
        location / {
            default_type text/html;
            content_by_lua_block {
                ngx.say("<p>service: 8002</p>")
            }
        }
    }

    server {
        listen 80;
        location / {
            set $target '';
            access_by_lua_block {
                local redis = require "resty.redis"

                local red = redis:new()
                local ok, err = red:connect("127.0.0.1", 6379)
                local res, err = red:hgetall('my-service')
                -- res 为一个数组
                -- i=1, v=127.0.0.1:8001
                -- i=2, v=1
                -- i=3, v=127.0.0.1:8002
                -- i=4, v=1
                red:set_keepalive(10000, 100)
                ngx.var.target = res[2 * math.random(#res / 2) - 1]
            }
            proxy_pass http://$target;
        }
    }
}
```

加载配置

```bash
sudo openresty -s reload
```

假设我们一个服务名为 my-service，包含两个实例 `127.0.0.1:8001` 和 `127.0.0.1:8002`，通过 redis-cli 注册这两个实例。

```bash
echo "HMSET my-service '127.0.0.1:8001' '1' '127.0.0.1:8002' '1'" | redis-cli
echo "HGETALL my-service" | redis-cli
```

验证：

* 多次执行 `curl 'http://127.0.0.1/` 发现随机返回 service: 8001 和 service: 8002。

说明：

* 本例中直接使用了底层的 [openresty/lua-resty-redis](https://github.com/openresty/lua-resty-redis)，而没有使用 [openresty/redis2-nginx-module](https://github.com/openresty/redis2-nginx-module)。
* 如果想使用 Nginx Upstream 相关的重试能力，进行如下优化：
    * 在 `access_by_lua_block`，如果有返回的是 host 不是 ip，还需要在此进行手动的 DNS（如 [Kong/lua-resty-dns-client](https://github.com/Kong/lua-resty-dns-client) 库），最后，将结果记录到 `ngx.ctx` 中。
    * 在 updstream 中通过 [balancer_by_lua_block](https://github.com/openresty/lua-nginx-module#balancer_by_lua_block) ，来设置 upstream。需要注意的是，对 Redis 的请求涉及到了 socket 请求，无法在 `balancer_by_lua_block` 中使用，更多参见：[issue](https://github.com/openresty/lua-resty-redis/issues/119)。
    * 具体参见下一个例子。

### 支持动态更新的一致性 hash 负载均衡

假设一个后端服务集群有多台实例，并使用 OpenResty (Nginx) 作为网关。该服务由一个特性，如果某一类请求能打到同一台实例，这项性能最优。此时可以通过 OpenResty 来实现这类要求的基本思路为：

* 这些后端服务会注册到某注册中心 (本例中为 redis)。
* 每次请求均查询 OpenResty，并通过一致性 Hash 来选择一台实例。

安装 `jojohappy/lua-resty-balancer`

```bash
git clone https://github.com/openresty/lua-resty-balancer.git
cd lua-resty-balancer
git checkout v0.04
make && sudo make install
cd ../ && rm -rf lua-resty-balancer
# 安装位置为
# /usr/local/lib/lua/librestychash.dylib  (linux 为 librestychash.so)
# /usr/local/lib/lua/resty
```

修改 `/usr/local/etc/openresty/nginx.conf` (Linux 为 `/etc/openresty/nginx.conf`) 为如下内容：

```nginx
worker_processes 1;
error_log /dev/stderr info;
events {
    worker_connections 1024;
}
http {

    # 添加搜索路径
    lua_package_path "/usr/local/lib/lua/?.lua;;";
    lua_package_cpath "/usr/local/lib/lua/?.dylib;;"; # Mac
    # lua_package_cpath "/usr/local/lib/lua/?.so;;"; # Linux

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /dev/stdout main;
    # 模拟两个服务 8001 和 8002
    # 正常情况，这两个服务应该部署在自己的机器上
    server {
        listen 8001;
        location / {
            default_type text/html;
            content_by_lua_block {
                ngx.say("<p>service: 8001</p>")
            }
        }
    }

    server {
        listen 8002;
        location / {
            default_type text/html;
            content_by_lua_block {
                ngx.say("<p>service: 8002</p>")
            }
        }
    }

    upstream myService {
        server 0.0.0.1;   # 一个无效的地址作为占位符
        balancer_by_lua_block {
            -- 调用一致性 hash 算法选取一个实例
            -- 参见: https://github.com/openresty/lua-resty-balancer#find
            local chash_up = package.loaded.my_chash_up
            local host = chash_up:find(ngx.var.arg_key)
            -- 调用 OpenResty 的 balancer 相关能力，设置一个目标 host
            -- 参见: https://github.com/openresty/lua-resty-core/blob/master/lib/ngx/balancer.md
            local b = require "ngx.balancer"
            assert(b.set_current_peer(host))
        }
    }

    server {
        listen 80;
        location / {
            access_by_lua_block {
                local resty_chash = require "resty.chash"

                local function discoveryService(serviceName)
                    local redis = require "resty.redis"
                    local red = redis:new()
                    local ok, err = red:connect("127.0.0.1", 6379)
                    local res, err = red:hgetall(serviceName)
                    -- res 为一个数组
                    -- i=1, v=127.0.0.1:8001
                    -- i=2, v=1
                    -- i=3, v=127.0.0.1:8002
                    -- i=4, v=1
                    local server_list = {}
                    for i = 1, #res, 2 do
                        server_list[res[i]] = res[i + 1]
                    end
                    table.sort(server_list)
                    return server_list
                end

                local function serviceChanged(a, b)
                    if a == nil or b == nil then
                        return true
                    end
                    if #a ~= #b then
                        return true
                    end
                    for k, value in pairs(a) do
                        if value ~= b[k] then
                            return true
                        end
                    end
                    return false
                end

                -- 发现服务
                local server_list = discoveryService("my-service")
                -- 服务是否有变化
                if not serviceChanged(server_list, package.loaded.my_servers) then
                    return
                end
                if not package.loaded.my_chash_up then
                    -- 如果是第一次执行，则创建 chash
                    package.loaded.my_chash_up = resty_chash:new(server_list)
                else
                    -- 如果是不是第一次执行，重新初始化
                    package.loaded.my_chash_up:reinit(server_list)
                end
                -- 保存服务列表
                package.loaded.my_servers = server_list
            }
            proxy_pass http://myService;
        }
    }
}
```

加载配置

```bash
sudo openresty -s reload
```

假设我们一个服务名为 my-service，包含两个实例 `127.0.0.1:8001` 和 `127.0.0.1:8002`，通过 redis-cli 注册这两个实例。

```bash
echo "del my-service\nHMSET my-service '127.0.0.1:8001' '1' '127.0.0.1:8002' '1'" | redis-cli
echo "HGETALL my-service" | redis-cli
```

验证：

* 多次执行 `curl 'http://127.0.0.1/?key=xxx` 可以发现当 key 不变的情况下，始终指向同一个实例。

说明：

* 和官方 [openresty/lua-resty-balancer](https://github.com/openresty/lua-resty-balancer#synopsis) 的示例不同，本例中对 `resty_chash` 的初始化放到了可 `access_by_lua_block` 块中，原因如下：
    * 希望可以动态的感知实例的变化，每次请求都执行一次服务发现。
    * `init_by_lua_block` 和 `balancer_by_lua_block` 无法调用 redis 相关函数，参见：[issue](https://github.com/openresty/lua-resty-redis/issues/119)。
* 本例忽略了对 redis 的压力，忽略了 Nginx 错误重试相关机制。
* Redis 如果返回的是 Host 而不是 IP，则还需要进行手动 DNS，如 [Kong/lua-resty-dns-client](https://github.com/Kong/lua-resty-dns-client) 库，Kong/lua-resty-dns-client 库是由 `luarocks` 管理，因此需要为 OpenResty 安装 luarocks（具体，参见：[博客](https://segmentfault.com/a/1190000008658146)）。
