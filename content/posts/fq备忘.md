---
title: "FQ备忘"
date: 2019-06-30T17:03:19+08:00
draft: true
toc: true
comments: true
tags:
  - linux
---

### V2ray

### Mac 安装

`brew install v2ray`

### 参考链接

* [v2ray通俗易懂的介绍](https://toutyrater.github.io/)
* [官方网站](https://www.v2ray.com/)
* [v2ray-mac安装](https://github.com/v2ray/homebrew-v2ray)
* [v2ray ws+tls+web](https://toutyrater.github.io/advanced/wss_and_web.html)
* [v2ray-使用Cloudflare中转V2Ray流量](https://github.com/233boy/v2ray/wiki/%E4%BD%BF%E7%94%A8Cloudflare%E4%B8%AD%E8%BD%ACV2Ray%E6%B5%81%E9%87%8F)
* [v2ray-issues](https://github.com/v2ray/v2ray-core/issues/833)
* [proxifier 官方网站](https://www.proxifier.com/)
* [proxifier mac 注册码](https://www.jianshu.com/p/7fb184d58713)

### 配置文件位置

mac homebrew-v2ray `vim /usr/local/etc/v2ray/config.json`

```bash
# 手动运行查看问题
cat /usr/local/opt/v2ray/homebrew.mxcl.v2ray-core.plist
# 重启
brew services restart v2ray
```

### cloudflare(CDN)+ws+tls

假设

* 已经拥有freenom账号
* 已经拥有cloudflare账号

参考

* https://github.com/233boy/v2ray/wiki/%E4%BD%BF%E7%94%A8Cloudflare%E4%B8%AD%E8%BD%ACV2Ray%E6%B5%81%E9%87%8F
* https://toutyrater.github.io/advanced/tls.html

#### 第一步：申请域名并配置解析到cloudflare

https://www.freenom.com/

#### 第二步：cloudflare DNS配置到你的机器

（只支持IPv4）

cloudflare -> DNS 标签，添加一个记录，先禁用代理（灰色小云朵）

#### 第三步：申请证书

登录到主机，使用 `acme.sh` 申请证书

```bash
curl https://get.acme.sh | sh # 安装申请脚本
your_addr=xxx.xx # 域名
~/.acme.sh/acme.sh --issue -d ${your_addr} --standalone -k ec-256 # 申请证书（保证80端口可用）
~/.acme.sh/acme.sh --installcert -d ${your_addr} --fullchainpath /etc/v2ray/v2ray.crt --keypath /etc/v2ray/v2ray.key --ecc # 安装证书
```

#### 第四步：配置v2ray服务端

```json
{
  "log": {
    // By default, V2Ray writes access log to stdout.
    "access": "/var/log/v2ray/access.log", // 这是 Linux 的路径
    // By default, V2Ray write error log to stdout.
    "error": "/var/log/v2ray/error.log",
    // Log level, one of "debug", "info", "warning", "error", "none"
    "loglevel": "warning"
  },
  "inbounds": [
    //...
    {
      "port": 443, // 建议使用 443 端口
      "protocol": "vmess",
      "settings": {
        "clients": [
          {
            "id": "xxxx",
            "alterId": 64
          }
        ]
      },
      "streamSettings": {
        "network": "ws",
        "wsSettings": {
          "path": "/ray"
        },
        "security": "tls", // security 要设置为 tls 才会启用 TLS
        "tlsSettings": {
          "certificates": [
            {
              "certificateFile": "/etc/v2ray/v2ray.crt", // 证书文件
              "keyFile": "/etc/v2ray/v2ray.key" // 密钥文件
            }
          ]
        }
      }
    }
    //...
  ],
  "outbounds": [{
    "protocol": "freedom",
    "settings": {}
  },{
    "protocol": "blackhole",
    "settings": {},
    "tag": "blocked"
  }],
  "routing": {
    "rules": [
      {
        "type": "field",
        "ip": ["geoip:private"],
        "outboundTag": "blocked"
      }
    ]
  }
}
```

#### 第五步：cloudflare开启代理配置SSL

* DNS -> 点亮云朵
* SSL/TLS -> 选择 Full

#### 第六步：客户端配置

```json
// Config file of V2Ray. This file follows standard JSON format, with comments support.
// Uncomment entries below to satisfy your needs. Also read our manual for more detail at
// https://www.v2ray.com/
{
  "log": {
    // By default, V2Ray writes access log to stdout.
    "access": "/var/log/v2ray/access.log", // 这是 Linux 的路径

    // By default, V2Ray write error log to stdout.
    "error": "/var/log/v2ray/error.log",

    // Log level, one of "debug", "info", "warning", "error", "none"
    "loglevel": "warning"
  },
  // List of inbound proxy configurations.
  "inbounds": [
    {
      // ipv4: 入口2->走ws+tls的代理：
      // Port to listen on. You may need root access if the value is less than 1024.
      "port": 1081,

      // IP address to listen on. Change to "0.0.0.0" to listen on all network interfaces.
      "listen": "127.0.0.1",

      // Tag of the inbound proxy. May be used for routing.
      "tag": "ipv4-in",

      // Protocol name of inbound proxy.
      "protocol": "socks",

      // Settings of the protocol. Varies based on protocol.
      "settings": {
        "auth": "noauth",
        "udp": false,
        "ip": "127.0.0.1"
      },

      // Enable sniffing on TCP connection.
      "sniffing": {
        "enabled": true,
        // Target domain will be overriden to the one carried by the connection, if the connection is HTTP or HTTPS.
        "destOverride": ["http", "tls"]
      }
    }
  ],
  // List of outbound proxy configurations.
  "outbounds": [
    {
      // ipv4: 走 ws + tls
      "protocol": "vmess",
      "tag": "ipv4-out",
      "settings": {
        "vnext": [{
          "address": "i18n.rcfree.gq", // tls 需要域名，所以这里应该填自己的域名
          "port": 443,
          "users": [{
            "id": "xxx",
            "alterId": 64
          }]
        }]
      },
      "streamSettings": {
        // "network": "tcp",
        "network": "ws",
        "security": "tls", // 客户端的 security 也要设置为 tls
        "wsSettings": {
          "path": "/ray"
        }
      }
    },
    {
      // 直连
      // Protocol name of the outbound proxy.
      "protocol": "freedom",

      // Settings of the protocol. Varies based on protocol.
      "settings": {},

      // Tag of the outbound. May be used for routing.
      "tag": "direct"
    },
    {
      // 阻断
      "protocol": "blackhole",
      "settings": {},
      "tag": "blocked"
    }
  ],
  // Transport is for global transport settings. If you have multiple transports with same settings
  // (say mKCP), you may put it here, instead of in each individual inbound/outbounds.
  //"transport": {},

  // Routing controls how traffic from inbounds are sent to outbounds.
  "routing": {
    "domainStrategy": "IPOnDemand",
    "rules":[
      // 阻断私有地址
      {
        // Blocks access to private IPs. Remove this if you want to access your router.
        "type": "field",
        "ip": ["geoip:private"],
        "outboundTag": "blocked"
      },
      // 拦截广告
      {
        // Blocks major ads.
        "type": "field",
        "domain": ["geosite:category-ads"],
        "outboundTag": "blocked"
      },
      {
        "type": "field",
        "inboundTag": ["ipv4-in"],
        "outboundTag": "ipv4-out"
      },
      {
        "type": "field",
        "inboundTag": ["ipv6-in"],
        "outboundTag": "ipv6-out"
      }
    ]
  },

  // Dns settings for domain resolution.
  "dns": {
    // Static hosts, similar to hosts file.
    "hosts": {
      // Match v2ray.com to another domain on CloudFlare. This domain will be used when querying IPs for v2ray.com.
      "domain:v2ray.com": "www.vicemc.net",

      // The following settings help to eliminate DNS poisoning in mainland China.
      // It is safe to comment these out if this is not the case for you.
      "domain:github.io": "pages.github.com",
      "domain:wikipedia.org": "www.wikimedia.org",
      "domain:shadowsocks.org": "electronicsrealm.com"
    },
    "servers": [
      "1.1.1.1",
      {
        "address": "114.114.114.114",
        "port": 53,
        // List of domains that use this DNS first.
        "domains": [
          "geosite:cn"
        ]
      },
      "8.8.8.8",
      "localhost"
    ]
  },

  // Policy controls some internal behavior of how V2Ray handles connections.
  // It may be on connection level by user levels in 'levels', or global settings in 'system.'
  "policy": {
    // Connection policys by user levels
    "levels": {
      "0": {
        "uplinkOnly": 0,
        "downlinkOnly": 0
      }
    },
    "system": {
      "statsInboundUplink": false,
      "statsInboundDownlink": false
    }
  },

  // Stats enables internal stats counter.
  // This setting can be used together with Policy and Api.
  //"stats":{},

  // Api enables gRPC APIs for external programs to communicate with V2Ray instance.
  //"api": {
    //"tag": "api",
    //"services": [
    //  "HandlerService",
    //  "LoggerService",
    //  "StatsService"
    //]
  //},

  // You may add other entries to the configuration, but they will not be recognized by V2Ray.
  "other": {}
}

```

#### 第七步、浏览器代理或者全局代理

* Chrome SwitchyOmega
* Mac Proxifier
* Linux iptable

### OpenWRT

可以使用 v2raya 简化配置，参考： https://github.com/v2rayA/v2raya-openwrt?tab=readme-ov-file 。
