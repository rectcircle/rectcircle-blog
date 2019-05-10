---
title: Flask
date: 2018-11-13T14:59:10+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/178
  - /detail/178/
tags:
  - 后端
---

> 参考：[官方网站](http://flask.pocoo.org)

## 一、Flask介绍

***

### 1、简介

Flask 官方称是一个“微”框架。内核微小，orm、表单验证、权限身份验证本身不提供。可以通过插件方式添加。

### 2、HelloWorld

创建`hello.py`

```python
from flask import Flask

app = Flask(__name__)

@app.route('/')
def index():
    return 'Index Page'
```

运行

```bash
pip install flask
export FLASK_APP=hello.py
flask run
```

## 二、部分文档

***

### 1、最小化应用

代码参见上面：

* 安装flask包
* 引入flask
* 创建一个对象
* 编写函数并使用装饰器注解

运行使用

flask命令，一些选项通过环境变量设置

### 2、debug模式

方式1：`export FLASK_ENV=development`

* 激活调试器
* 使能自动加载器（当文件发生变化时）
* 开启debug模式（显示异常堆栈）

方式2：`FLASK_DEBUG=1`

* 仅开启debug模式（显示异常堆栈）

### 3、路由

#### （1）普通方式

```python
@app.route('/')
def index():
    return 'Index Page'

@app.route('/hello')
def hello():
    return 'Hello, World'
```

#### （2）路径参数

```python
@app.route('/user/<username>')
def show_user_profile(username):
    # show the user profile for that user
    return 'User %s' % username

@app.route('/post/<int:post_id>')
def show_post(post_id):
    # show the post with the given id, the id is an integer
    return 'Post %d' % post_id

@app.route('/path/<path:subpath>')
def show_subpath(subpath):
    # show the subpath after /path/
    return 'Subpath %s' % subpath
```

将url中的内容提取称变量传递到参数中，支持类型为：

* string	(default) accepts any text without a slash
* int	accepts positive integers
* float	accepts positive floating point values
* path	like string but also accepts slashes
* uuid	accepts UUID strings

#### （3）末尾`/`的行为

```python
@app.route('/projects/')
def projects():
    return 'The project page'

@app.route('/about')
def about():
    return 'The about page'
```

末尾为`/`的行为

* 不以`/`自动重定向到带`/`的路径

末尾不以`/`结尾的行为

* 访问带`/`的路径将404

#### （4）url构建

为了和url解耦，flask实现一个函数`url_for(name, ...)`，根据函数名来获取url路径

* 第一个参数为函数名
* 剩下参数可变，用来填充路径参数

例子

```python
from flask import Flask, url_for

app = Flask(__name__)

@app.route('/')
def index():
    return 'index'

@app.route('/login')
def login():
    return 'login'

@app.route('/user/<username>')
def profile(username):
    return '{}\'s profile'.format(username)

with app.test_request_context():
    print(url_for('index'))
    print(url_for('login'))
    print(url_for('login', next='/'))
    print(url_for('profile', username='John Doe'))

# 输出
# /
# /login
# /login?next=/
# /user/John%20Doe
```

#### （5）HTTP方法匹配

```python
from flask import request

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        return do_the_login()
    else:
        return show_the_login_form()
```

自动生成option

### 4、静态文件

在启动脚本所在包创建`/static`目录用来存放静态文件如js、css等

`url_for` 第一个参数为`"static"`即为生成静态文件目录

### 5、渲染模板

flask默认的模板引擎为`Jinja2`

```python
from flask import render_template

@app.route('/hello/')
@app.route('/hello/<name>')
def hello(name=None):
    return render_template('hello.html', name=name)

```

flask将会在模块或包的根目录查找路径如

```
/application.py
/templates
    /hello.html
```

```
/application
    /__init__.py
    /templates
        /hello.html
```

### 6、获取请求数据

很诡异的是flash将request 放在了 ThreadLocal里

#### （1）request 对象的使用

首先要引入request

```python
from flask import request
```

然后皆就可以直接使用了

```python
@app.route('/login', methods=['POST', 'GET'])
def login():
    error = None
    if request.method == 'POST':
        if valid_login(request.form['username'],
                       request.form['password']):
            return log_the_user_in(request.form['username'])
        else:
            error = 'Invalid username/password'
    # the code below is executed if the request method
    # was GET or the credentials were invalid
    return render_template('login.html', error=error)
```

获取url参数（get参数或者说查询）

```python
searchword = request.args.get('key', '')
```

详细参见[api文档](http://flask.pocoo.org/docs/1.0/api/#flask.Request)

#### （2）文件上传

```python
from flask import request

@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        f = request.files['the_file']
        f.save('/var/www/uploads/uploaded_file.txt')
    ...
```

安全文件名

```python
from flask import request
from werkzeug.utils import secure_filename

@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        f = request.files['the_file']
        f.save('/var/www/uploads/' + secure_filename(f.filename))

```

#### （3）Cookies

```python
@app.route('/')
def index():
    username = request.cookies.get('username')
    # use cookies.get(key) instead of cookies[key] to not get a
    # KeyError if the cookie is missing.
```

设置cookies

```python
@app.route('/')
def index():
    resp = make_response(render_template(...))
    resp.set_cookie('username', 'the username')
    return resp
```

#### （4）重定向和错误

```python
from flask import abort, redirect, url_for

@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route('/login')
def login():
    abort(401)
    this_is_never_executed()
```

异常返回定制

```python
from flask import render_template

@app.errorhandler(404)
def page_not_found(error):
    return render_template('page_not_found.html'), 404
```

更多查看 [异常处理](http://flask.pocoo.org/docs/1.0/errorhandling/#error-handlers)

### 7、响应

* 如果返回的是响应对象，则直接从视图返回
* 如果返回的是字符串则用该数据和默认参数创建响应对象
* 如果返回时元组，则元组必须是`<响应, 状态, 头部>`或`<响应, 状态>`
* 否则假定返回对象是一个有效的WSGI程序，并将其转换为响应对象

例子：

```python
@app.errorhandler(404)
def not_found(error):
    return render_template('error.html'), 404

@app.errorhandler(404)
def not_found(error):
    resp = make_response(render_template('error.html'), 404)
    resp.headers['X-Something'] = 'A value'
    return resp
```

### 8、session

使用Session必须设置一个密钥，这样用户就只能查看而不能修改

```python
from flask import Flask, session, redirect, url_for, escape, request

app = Flask(__name__)

# Set the secret key to some random bytes. Keep this really secret!
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'

@app.route('/')
def index():
    if 'username' in session:
        return 'Logged in as %s' % escape(session['username'])
    return 'You are not logged in'

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        session['username'] = request.form['username']
        return redirect(url_for('index'))
    return '''
        <form method="post">
            <p><input type=text name=username>
            <p><input type=submit value=Login>
        </form>
    '''

@app.route('/logout')
def logout():
    # remove the username from the session if it's there
    session.pop('username', None)
    return redirect(url_for('index'))
```

类似于request，session也采用ThreadLocal的方式存储

更好的生成秘钥：`python -c 'import os; print(os.urandom(16))'`

### 其他

* [Message Flashing](http://flask.pocoo.org/docs/1.0/patterns/flashing/#message-flashing-pattern)
* 日志

```python
app.logger.debug('A value for debugging')
app.logger.warning('A warning occurred (%d apples)', 42)
app.logger.error('An error occurred')
```

本质上调用的是python标准的日志对象

* 嵌入WSGI中间件

```python
from werkzeug.contrib.fixers import LighttpdCGIRootFix
app.wsgi_app = LighttpdCGIRootFix(app.wsgi_app)
```

* [扩展](#http://flask.pocoo.org/docs/1.0/extensions/#extensions)
* [部署](http://flask.pocoo.org/docs/1.0/deploying/#deployment)
