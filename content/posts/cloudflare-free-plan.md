---
title: "Cloudflare 免费计划"
date: 2024-02-13T16:06:00+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 介绍

Cloudflare (https://www.cloudflare.com) 是全球最大 CDN 服务提供商。是当今世界上，最重要的互联网基础设施之一。

虽然 Cloudflare 是一家美国公司，但是在中国大陆也可以使用。

Cloudflare 很多产品都提供免费计划，免费计划对于学生、开发者、中小团队来说是足够的。

本文将主要介绍：

* 包含在 Cloudflare 免费计划中的产品以及可用的功能。
* 学生、开发者、中小团队如何利用这些产品特性节约成本、提升效率、解决实际问题。

## 注册

打开 [cloudflare 注册页](https://dash.cloudflare.com/sign-up)，输入一个电子邮件地址即可完成注册。

## 域名托管

### 添加站点

* 进入 [cloudflare 控制台](https://dash.cloudflare.com)。
* 点击右上角，将页面语言切换到简体中文。
* 点击 添加站点 按钮，输入你已经购买的或者正要购买的域名。
* 选择最下方的 Free 免费计划，点击继续。

至此，在 cloudflare 上的操作已经完成，剩下的步骤，需要去你的域名购买平台，修改 DNS 服务器为 cloudflare 控制台 -> 刚加入的站点 -> 概述页面，更新名称服务器：您的已分配的 Cloudflare 名称服务器下面的两个域名，示例下：

* `jo.ns.cloudflare.com`
* `kirk.ns.cloudflare.com`

更新完成后，等待 10 分钟左右，然后前往 cloudflare 控制台 -> 刚加入的站点 -> 概述页面，点击立即检查名称服务器，通过后，概述页面将会展示一些统计指标。

如果还未购买域名：

* 可以前往任意国内的公有云平台购买一个域名即可（在阿里云，可以购买一个 68 元 10 年的域名，支持的域名为主域为 6~8 位数字的后缀为 xyz 的域名，即 `\d{6,8}.xyz`）。
* 如果，担心隐私问题，可以前往海外域名注册商购买。

### DNS 配置

前往 cloudflare 控制台 -> 刚加入的站点 -> DNS -> 记录，点击添加记录，就可以添加一条 DNS 记录。DNS 记录有多种类型，定义该子域名对应内容的类型，常用的有：

* A 该子域名对应的是一个 IPv4 地址。
* AAAA 该子域名对应的是一个 IPv6 地址。
* CNAME 该子域名对应的内容委托给另一个子域名。
* TXT 该域名对应一串纯文本，可以用来做一些配置。

和其他云厂商 DNS 解析配置相比， A、AAAA、CNAME 记录类型，Cloudflare 有一个代理的选项（橙色云朵）：

* 如果不打开，则 cloudflare 就是常规的 DNS 解析服务提供商，此时客户端执行 DNS 查询时，获取到的就是配置的 IP 地址。
* 如果打开，cloudflare 就会变成一个 7 层（HTTP/HTTPS） 反向代理器（可以理解为一个 Nginx），此时客户端执行 DNS 查询时，获取到的将是 cloudflare 的边缘节点，此时流量路径如下所示：

    ```
    User ---> cloudflare global network ---> 源站 （DNS 记录指向地址/Tunnel）
    ```

    这里特别说明：

    * 源站必须是一个 HTTP/HTTPS 服务器，否则无法进行代理。
    * 源站如果是 HTTP 协议，则必须监听在 80 端口，如果是 HTTPS，则必须监听在 443 端口。
    * 对源站的配置参见下文： [SSL/TLS 配置](#ssltls-配置)。
    * 源站除了可以是一个具体的 IP 地址外，还可以是一个 Zero Trust 的 Tunnel，参见下文： [Tunnel](#tunnel)。
    * 支持 websocket，可在：控制台 -> 刚加入的站点 -> 网络，进行配置。
    * cloudflare 自动会为域名颁发，受信任的 CA 证书，参见： 控制台 -> 刚加入的站点 -> SSL/TLS -> 边缘证书。

### SSL/TLS 配置

> [官方文档](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/)

在 DNS 配置中，开启了代理后。

需要在  控制台 -> 刚加入的站点 -> SSL/TLS -> 概述， 配置用户到 cloudflare，cloudflare 到源站的流量类型：

* 关闭 (Off (no encryption))：全链路使用 HTTP（不建议）。
* 灵活 (Flexible)：用户到 cloudflare 可以采用 HTTPS，cloudflare 到源站采用 HTTP。
* 完全 (Full)：用户到 cloudflare 可以采用 HTTPS，cloudflare 到源站采用 HTTPS，但 cloudflare **不校验** 源站 SSL/TLS 证书是否合法。
* 完全（严格） (Full (strict))：用户到 cloudflare 可以采用 HTTPS，cloudflare 到源站采用 HTTPS，cloudflare 会校验 SSL/TLS 证书的合法性。这要求，源站的 SSL/TLS 证书必须是，受信任的 CA 证书或 Cloudflare Origin CA 证书。

需要注意的时，如上配置的主要是 cloudflare 到源站的流量情况，而用户到 cloudflare 是否强制使用 https，需要到：控制台 -> 刚加入的站点 -> SSL/TLS -> 边缘证书， 始终使用 HTTPS 进行配置（推荐打开）。

为了方便，可以直接使用灵活 (Flexible) 模式。

如果为了安全，建议使用：完全（严格） (Full (strict)) 模式，使用该模式，需要给服务器配置证书，有几种方式：

* （推荐） 签发一个 Cloudflare Origin CA 证书（优势是有效期很长）。前往： 控制台 -> 刚加入的站点 -> SSL/TLS -> 源服务器，创建一个证书，然后将该证书，下载、上传并配置到源站服务器上，以 Nginx 为例：

    ```nginx
    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name xxx.example.com;
        ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;
        ssl_prefer_server_ciphers on;
        ssl_certificate /etc/nginx/certificate/example.com.pem;
        ssl_certificate_key /etc/nginx/certificate/example.com.key;
        location / {
            # ...
            proxy_pass http://127.0.0.1:8080;
        }
    }
    ```

* 使用 acme.sh 签发受信任的 CA 证书。

## 页面托管、FaaS、AI 和 BaaS

略，和 [netlify](https://www.netlify.com/pricing) 类似。重点关注其免费计划的限制：

* [pages limits](https://developers.cloudflare.com/pages/platform/limits)。
* [worker limits](https://developers.cloudflare.com/workers/platform/limits)

## 零信任网络 （Zero Trust）

### 启用

Zero Trust 需要单独开启，开启步骤如下：

* 控制台 -> Zero Trust。
* 输入 组织名，点击 Next。
* 选择 Free 计划，进入付款页面，选择 paypal（没有的可以注册一个）。
* 再输入一次组织名，点击 Finish setup 即可。

后续，只需前往：控制台 -> [Zero Trust](https://one.dash.cloudflare.com/) 即可进入 Zero Trust 后台。

### 概念和配置

Cloudflare Zero Trust 本质提供的是面向组织的内网搭建服务，要想理解 Cloudflare Zero Trust 能做的事情，需要了解如下概念：

* 组织 (organization) /团队 (team)： 一个管理概念，对应一个虚拟的网络，一个组织包含多个用户，每个用户可以拥有多个设备，Zero Trust 售卖的服务和该概念绑定，免费计划最多允许注册 50 个用户。
* 用户 (User)： 可以连入组织网络的人，用户的设备可通过 `WARP` 客户端连入网络，在管理后台的 Settings -> WARP Client -> Device enrollment -> Device enrollment permissions -> Manage -> Add a rule 可以配置那些用户可以登录。

    配置某个用户可以在 WARP 客户端通过邮箱（验证码）登录 Zero Trust：

    * Rule name： 填写 my。
    * Rule action： 选择 Allow。
    * Include：
        * Selector： Emails。
        * Value： 填写邮箱地址。

    用户在 WARP 客户端登录过后，可以在 My Team -> Users 管理用户。

* Device：某个用户通过 WARP 客户端登录后将会存在一个设备，在 My Team -> Devices 可以查看和管理。用户设备自身是无法再 WARP 客户端配置的，而是由组织管理员在管理后台的 Settings -> WARP Client -> Device settings 中进行配置，系统预置了一个名为 Default 的默认配置。这里点击 Default 右侧三个点菜单，点击 Duplicate 创建一个新的配置，并进行编辑：
    * Name： 配置名，填写 my。
    * Build an expression：设置该配置关联的用户，和创建用户的规则类似。
        * Selector： 填写 User email
        * Operator： 填写 is
        * Value：填写邮箱地址。
    * Split Tunnels： 这个配置是非常重要的，定义的是，设备的流量的路由规则：
        * Include IPs and domains： **在**该名单里的的 IP 和域名会通过 Cloudflare Zero Trust 中转，其他流量直连。
        * Exclude IPs and domains： **不在**该名单里的的 IP 和域名会通过 Cloudflare Zero Trust 中转，其他流量直连。选择这个，并修改规则：
            * 删除 `100.64.0.0/10`。这个网段是 WARP 的分配的虚拟 IP。删除后，各个设备之间就可以通过该虚拟 IP 通讯了（还有一个配置参见下文 WARP to WARP）。
            * ~~添加各个常用的家用路由器默认网段：如 `192.168.0.0/24`，`192.168.1.0/24`，`192.168.31.0/24`。~~ （这一点应该不需要）

* Network： 通过管理后台的 Settings -> Network 可以配置组织的网络情况，这里修改 Firewall 如下：
    * Proxy 开启并勾选 TCP、UDP、ICMP 全部。
    * 开启 WARP to WARP。
* Tunnel： 通过一个可以连接公网的设备和 Cloudflare Zero Trust 建立一个安全 Tunnel （隧道）。

    可以实现：

    * public hostname： 将某个端口分配一个上文域名托管 DNS 子域名，实现端口暴露。
    * private network： 将整个网络加入到 Cloudflare Zero Trust 网络中，可以实现虚拟局域网（异地组网），通过 WARP 加入 Cloudflare Zero Trust 网络中的设备都可以直接通过内网 IP 访问这个局域网的任意 IP。

    更多参见下文： Tunnel 章节。

* 接入
    * WARP： 用户接入 Cloudflare Zero Trust 网络的客户端，基本使用，参见下文： WARP 章节。
    * cloudflared： 用于建立 Tunnel 的客户端，更多参见下文： Tunnel 章节。

### WARP

以安卓端为例，Google 搜索 `WARP apk 下载` 进行下载安装，安装完成后，打开 `1.1.1.1` App，登录方式如下：

* 点击右上角菜单 -> 账户 -> 登录到 Cloudflare Zero Trust -> 下一步 -> 接受。
* 输入组织名，调转到浏览器。
* 输入《概念和配置》小节配置的邮箱，点击发送验证码。
* 登录邮箱，获取验证码，并回到手机填入验证码，点击 Sign in。

WARP 客户端，下载地址 https://1.1.1.1/

登录完成后，进入 WARP 客户端后点击连接即可加入 Cloudflare Zero Trust 网络。

WARP 本质上就是一个 VPN 客户端。

### Tunnel

Tunnel 是在一台可连接公网的设备和 Cloudflare Zero Trust 网络之间建立的一条虚拟网络链路。通过这条隧道可以实现虚拟组网和端口暴露。

假设想将家庭局域网暴露加入 Cloudflare Zero Trust 网络，并实现远程访问，则需要在管理后台的 Networks -> Tunnels：

* 点击 `Create a tunnel`。
* 选择 Cloudflared，填写名字。
* 根据操作系统和架构，执行相关命令安装 Cloudflared 并创建一个 Tunnel，openwrt 详见 [openwrt wiki](https://openwrt.org/docs/guide-user/services/vpn/cloudfare_tunnel)：
    * 修改 `/etc/config/cloudflared`：
        * `enabled` 设为 true。
        * `token` 从页面复制填入。
    * 执行：
        * `/etc/init.d/cloudflared enable`。
        * `/etc/init.d/cloudflared start`。

回到管理后台的 Networks -> Tunnels： 等待 Tunnel 的 Status 变为 HEALTHY。

* 点击菜单（右侧三个点） 的 Configure。
* 点击 Private Network 私有网络，Add a provider network。
    * CIDR： 私有网段。
    * Description： my。

配置完成后，回到任意通过 WARP 连接到 Cloudflare Zero Trust 网络的设备上即可通过如上私有网络通讯。

### 其他说明

* WARP 在中国大陆地区没有节点，所有节点均在海外，这带来了一些好处和坏处：
    * 好处就像大家常用的，所有流量都经过一个海外 VPS 节点一样，在此就不多言了。
    * 坏处是：
        * 延迟高，访问大陆站点慢，不稳定。
        * 中国移动宽带/数据在晚高峰时期， WARP 拥堵严重（202400212）。
* 通过 IP 查询， 开启 WARP 后，显示的地理位置仍在中国大陆，这让一些基于 IP 地理位置的应用可以正常工作。（实际上出口 IP Geo 是 Cloudflare 伪造的）。

## 应用场景

### 一键开启 HTTPS

在有一台 VPS 的情况下，如果想为该服务器开启 HTTPS， 传统方法是：

* 购买一个 SSL 证书或使用 acme.sh 申请证书。
* 将证书配置到 VPS Nginx 中。
* 配置 DNS 解析。
* 举要记得证书是否过期，过期后还需重新申请。

上述操作很麻烦。如果使用 Cloudflare 免费计划，只需将配置 DNS 解析这一步即可。而证书过期续期全部由 Cloudflare 自动处理，十分方便。

### 零成本建站

如果想建立一个网站，传统的做法需要购买一个 VPS 自己搭建或者购买云厂商的相关服务，如果是大陆地区还需要备案等，非常麻烦。

很多时候，对于个人站点或流量不大的非商业性站点，上述流程成本偏高，很没必要。

现在，只需将服务部署到位于家庭宽带的个人设备（废旧手机/电脑）上，只需购买一个域名，通过 Zero Trust 的 cloudflared 建立一个 Tunnel，并在 Zero Trust 管理后台的 Networks -> Tunnels 页面，某 Tunnel 配置的 Public Hostname 配置上，暴露内网中的服务。

（一个限制是：目前不支持 UDP）

### 站点加速

由于 Cloudflare 是全球最大 CDN 服务提供商，因此接入 Cloudflare 的站点，在全球都有很好的访问速度。

因此通过 Cloudflare 的免费计划可以为站点加速，举个例子，如： 利用 Cloudflare 给托管到 netlify 的个人博客加速。

### 加速海外服务器访问

在中国大陆，访问自己的 VPS IP 会被众所周知的原因阻断。此时可以利用 Cloudflare 来给这个 VPS 重获新生，在大陆地区正常使用。

由于法律原因，具体示例在此就不多赘述了。

### 虚拟局域网（异地组网）

通过 Cloudflare Zero Trust 的 WARP 和 Tunnel 即可实现虚拟局域网（异地组网）。

和其他免费方案（如 zerotier）相比，体验最好，基础使用（SSH、VSCode Remote SSH 等）基本够用。

实现方式参见上文： TUnnel。

### 暴露 NAT 后服务的端口

和上文零成本建站原理类似，这里想表达的是可以利用一些免费的可以访问互联网的计算资源，在上面搭建一些服务，并暴露到互联网上自用或小范围使用。

这里有个利用 replit 资源的例子，脚本参见：

* 打开 https://replit.com/@rectcircle 。
* 点击 `v****-and-cloudflared` （由于法律原因， `****` 自行查看）。
* 打开 main.sh 查看原理，或 fork 直接执行。

注意：

* replit 的[出流量每月只有 10 G](https://blog.replit.com/announcing-outbound-data-transfer-limits)，非视频自用基本足够。
* 运行时不能关闭 replit 页面，因为页面关闭后 几秒钟后，资源会立即被 replit 回收，服务进程也会被 kill。

### 保护网站浏览记录隐私

HTTPS 虽然能保护浏览的内容不被中间人劫持，但是由于：

* DNS 是明文的，中间人可以获取到某出口 IP 的域名解析记录。
* HTTPS SNI 是明文的，中间人仍可以获取到某出口 IP 访问 HTTPS 站点的域名。

而使用 WARP 后，配置的流量都会通过加密的 wireguard 协议通过 Zero Trust 网络的出口 IP 出去。这样，除了 Cloudflare 外，将没人知道用户的浏览记录。
