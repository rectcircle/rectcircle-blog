---
title: "Consul"
date: 2022-08-18T18:35:09+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

## Docker 运行

https://hub.docker.com/_/consul

```
docker run -d --name=consul -p 8500:8500 -e CONSUL_BIND_INTERFACE=eth0 consul
```

```
curl http://10.227.8.141:8500/v1/health/service/consul?pretty
```

https://www.consul.io/api-docs/agent/service

注册

```bash
# 第一个实例
curl  \
    --request PUT \
    --data '
        {
            "ID": "test-service-1",
            "Name": "test-service",
            "Address": "127.0.0.1",
            "Port": 5000,
            "Check": {
                    "HTTP": "http://127.0.0.1:5000",
                    "Interval": "10s"
                }
        }
    ' \
    http://10.227.8.141:8500/v1/agent/service/register

# 第二个实例

curl  \
    --request PUT \
    --data '
        {
            "ID": "test-service-2",
            "Name": "test-service",
            "Address": "127.0.0.1",
            "Port": 8500,
            "Check": {
                    "HTTP": "http://127.0.0.1:8500/",
                    "Interval": "10s"
                }
        }
    ' \
    http://10.227.8.141:8500/v1/agent/service/register

# 第三个实例

curl  \
    --request PUT \
    --data '
        {
            "ID": "test-service-3",
            "Name": "test-service",
            "Address": "127.0.0.1",
            "Port": 9500
        }
    ' \
    http://10.227.8.141:8500/v1/agent/service/register
```

查询健康情况

```
curl --request GET http://10.227.8.141:8500/v1/agent/health/service/name/test-service
```

取消注册

```
curl --request PUT http://10.227.8.141:8500/v1/agent/service/deregister/test-service-success
```
