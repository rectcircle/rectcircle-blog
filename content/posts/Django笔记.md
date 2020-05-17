---
title: Django笔记
date: 2018-10-30T18:49:49+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/173
  - /detail/173/
tags:
  - 后端
---

> [参考1](https://www.runoob.com/django/django-tutorial.html)
> [参考2](https://django-intro-zh.readthedocs.io/zh_CN/latest/)
> [参考3](http://djangobook.py3k.cn/2.0/)

## 一、准备

***

### 1、简介

一个轻量级MVC的web框架，基于Python。支持如下特性

* 基于正则表达式的可配置路由
* 模板引擎
* 自带ORM框架
* 支持表单验证
* 内嵌后台
* 可配置

### 2、前置条件

* 安装Python（2或3都可以）
* 安装Pip

### 3、安装

```bash
sudo pip install Django
```

## 二、HelloWorld

### 1、常用指令

* 创建一个项目 `django-admin startproject projectname`
* 创建一个app（先进入项目根目录） `django-admin startapp appname`
* 创建表结构 `python manage.py migrate`
* 让 Django 知道我们在我们的模型有一些变更 `python manage.py makemigrations appname`
* 创建表结构 `python manage.py migrate appname`
* 启动服务 `python manage.py runserver [ip:port]`

### 2、步骤

#### （1）创建项目

`django-admin startproject helloworld`

目录结构如下：

```
.
├── helloworld
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── manage.py
```

说明：

* `helloworld` 具体项目目录
* `manage.py` 管理脚本，用于启动服务、创建模型等
* `settings.py` 配置文件
* `urls.py` 配置路由
* `wsgi.py` 通用网关接口相关

#### （2）定义服务函数（Controller）

在项目目录中添加python文件完成Controller

```python
from django.http import HttpResponse

from django.shortcuts import render


def helloTemplates(request):
    context = {}
    context['hello'] = 'Hello World!'
    return render(request, 'hello.html', context)


def hello(request):
    return HttpResponse("Hello World!")

```

#### （3）使用模板（可选）

在项目根目录创建模板文件目录`templates`，添加模板文件

```html
<h1>{{hello}}</h1>
```

在`settings.py`中配置模板位置

```python
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR+"/templates"],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]
```

#### （4）配置路由

在`urls.py`中

```python
from django.conf.urls import url
from django.contrib import admin
from . import view
from . import testdb

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^$', view.hello),
    url(r'^hello/', view.helloTemplates),
]
```

#### （5）启动服务

`python manage.py runserver`

## 三、ORM

***

Django内置了一个ORM框架，通过继承实现，可以通过链式调用来实现查询，支持自动建表。

### 1、ORM使用

#### （0）配置数据库和连接

安装数据库驱动`sudo pip install mysqlclient`或者

```python
sudo apt install python-mysql.connector
pip install mysql-connector-python mysql-connector
```

创建数据库：略

配置数据库连接：

在`settings.py`中配置

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',  # 或者使用 mysql.connector.django
        'NAME': 'test',
        'USER': 'test',
        'PASSWORD': 'test123',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}
```

通过日志查看输出：

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console':{
            'level':'DEBUG',
            'class':'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'propagate': True,
            'level':'DEBUG',
        },
    }
}
```

#### （1）创建一个app

`django-admin startapp appname`

#### （2）添加模型定义

在`models.py`中添加模型

```python
# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models

# Create your models here.


class Test(models.Model):
    name = models.CharField(max_length=20)

```

#### （3）在setting中注册这个app

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'TestModel',
]
```

#### （4）执行命令

创建表结构

```bash
python manage.py migrate   # 创建表结构
python manage.py makemigrations TestModel  # 让 Django 知道我们在我们的模型有一些变更
python manage.py migrate TestModel   # 创建表结构
```

当数据库中存在数据时，需改表结构若添加的字段为not null将报错

* 设置为允许为空
* 设置默认值

#### （5）进行数据库操作

```python
# -*- coding: utf-8 -*-

from django.http import HttpResponse

from TestModel.models import Test

# 数据库操作


def testdbInsert(request):
    test1 = Test(name='runoob')
    test1.save()
    return HttpResponse("<p>数据添加成功！</p>")


# 数据库操作
def testdbQuery(request):
    # 初始化
    response = ""
    response1 = ""

    # 通过objects这个模型管理器的all()获得所有数据行，相当于SQL中的SELECT * FROM
    list = Test.objects.all()

    # filter相当于SQL中的WHERE，可设置条件过滤结果
    response2 = Test.objects.filter(id=1)

    # 获取单个对象
    response3 = Test.objects.get(id=1)

    # 限制返回的数据 相当于 SQL 中的 OFFSET 0 LIMIT 2;
    Test.objects.order_by('name')[0:2]

    # 数据排序
    Test.objects.order_by("id")

    # 上面的方法可以连锁使用
    Test.objects.filter(name="runoob").order_by("id")

    # 输出所有数据
    for var in list:
        response1 += var.name + " "
    response = response1
    return HttpResponse("<p>" + response + "</p>")


def testdbUpdate(request):
    # 修改其中一个id=1的name字段，再save，相当于SQL中的UPDATE
    test1 = Test.objects.get(id=1)
    test1.name = 'Google'
    test1.save()

    # 另外一种方式
    # Test.objects.filter(id=1).update(name='Google')

    # 修改所有的列
    # Test.objects.all().update(name='Google')

    return HttpResponse("<p>修改成功</p>")


def testdbRemove(request):
    # 删除id=1的数据
    test1 = Test.objects.get(id=1)
    test1.delete()

    # 另外一种方式
    # Test.objects.filter(id=1).delete()

    # 删除所有数据
    # Test.objects.all().delete()

    return HttpResponse("<p>删除成功</p>")
```

### 2、模型字段类型与数据局映射关系

字符串类型：
name=models.CharField(max_length=32)

```python
EmailField(CharField)
IPAddressField(Field)
URLField(CharField)
SlugField(CharField)
UUIDField(Field)
FilePathField(Field)
FileField(Field)
ImageField(FileField)
CommaSeparatedIntegerField(CharField)
```

时间字段

```python
models.DateTimeField(null=True)
date=models.DateField()
```

数字字段

```python
num = models.IntegerField()
num = models.FloatField() 浮点
price=models.DecimalField(max_digits=8,decimal_places=3) 精确浮点
```

枚举字段

```python
choice=(
        (1,'男人'),
        (2,'女人'),
        (3,'其他')
    )
lover=models.IntegerField(choices=choice) #枚举类型
```

其他字段

```python
db_index = True 表示设置索引
unique(唯一的意思) = True 设置唯一索引

联合唯一索引
class Meta:
unique_together = (
 ('email','ctime'),
)
联合索引（不做限制）
index_together = (
('email','ctime'),
)
ManyToManyField(RelatedField)  #多对多操作
```

其他参见 [博客](https://www.cnblogs.com/sss4/p/7070942.html)

## 四、内置对象

* HttpResponse
* HttpRequest

其他参见源码与[教程](https://www.runoob.com/django/django-form.html)

## 五、模板

略

## 六、django-rest-framework

> [官网](https://www.django-rest-framework.org/)
> [官方教程](https://www.django-rest-framework.org/tutorial/1-serialization/)

### 1、djangorestframework安装

前置条件：

* Python
* Django

安装

```bash
pip install djangorestframework
pip install markdown       # Markdown support for the browsable API.
pip install django-filter  # Filtering support
```

### 2、djangorestframework使用

创建普通的Django项目`django-admin startproject helloworld_rest`

在settingts.py中应用

```python
INSTALLED_APPS = (
    ...
    'rest_framework',
)
```

启用验证

```python
#注意引入include函数
from django.conf.urls import url, include
from django.contrib import admin

urlpatterns = [
    #...
    url(r'^api-auth/', include('rest_framework.urls')),
]
```

启动后，访问`api-auth/login`，可以看到登录页面

#### （1）例子：用户信息读写API

接着上面的操作

配置Djangorest，位于`settings.py`的`REST_FRAMEWORK`字典

```python
REST_FRAMEWORK = {
    # Use Django's standard `django.contrib.auth` permissions,
    # or allow read-only access for unauthenticated users.
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.DjangoModelPermissionsOrAnonReadOnly'
    ]
}
```

简单起见所有代码都写在`urls.py`

```python
from django.conf.urls import url, include
from django.contrib.auth.models import User
from rest_framework import routers, serializers, viewsets

# Serializrse define the API representation.
# 序列化配置：针对的模型是User，需要返回的信息在fields中声明
class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('url', 'username', 'email', 'is_staff')

# ViewSets define the view behavior.
# 定义视图行为：首先定义数据库查询的方式，然后指定序列化器
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


# Routers provide an easy way of automatically determining the URL conf.
# 路由规则
router = routers.DefaultRouter()
router.register(r'users', UserViewSet) # 将url与视图集绑定

# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.
urlpatterns = [
    url(r'^', include(router.urls)),
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework'))
]

```

执行`python manage.py migrate`创建表结构

启动服务器访问查看

### 3、djangorestframework教程

> [github](https://github.com/encode/rest-framework-tutorial)
> [文档](https://www.django-rest-framework.org/tutorial/1-serialization/)

额外安装一个库`pip install pygments`

#### （1）序列化

序列化器处理方向有两个：

* 接收用户提交的数据，验证后，生成数据模型并持久化到数据库
* 从数据库中拿到数据，生成数据字典传递给视图（JSON等）

**创建Django项目**

```bash
django-admin startproject rest_tutorial
cd rest_tutorial
```

**创建一个app**

```bash
python manage.py startapp snippets
```

添加到settings

```python
INSTALLED_APPS = (
    #...
    'rest_framework',
    'snippets.apps.SnippetsConfig',
)

```

添加模型`snippets/models.py`

```python
# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from pygments.lexers import get_all_lexers
from pygments.styles import get_all_styles

# Create your models here.

# 获取到词法法解析器
LEXERS = [item for item in get_all_lexers() if item[1]]
# 获取到语言类型
LANGUAGE_CHOICES = sorted([(item[1][0], item[0]) for item in LEXERS])
# 获取到样式风格
STYLE_CHOICES = sorted((item, item) for item in get_all_styles())


class Snippet(models.Model):
    """代码片段模型"""
    created = models.DateTimeField(auto_now_add=True) # 创建时间
    title = models.CharField(max_length=100, blank=True, default='') # 标题
    code = models.TextField() # 代码文本
    linenos = models.BooleanField(default=False) #
    language = models.CharField(
        choices=LANGUAGE_CHOICES, default='python', max_length=100) # 语言选择
    style = models.CharField(choices=STYLE_CHOICES,
                             default='friendly', max_length=100) # 配色样式

    class Meta:
        ordering = ('created',)

```

**创建模型**

```bash
python manage.py makemigrations snippets
python manage.py migrate
```

创建序列化器`snippets/serializers.py`

```python
from rest_framework import serializers
from snippets.models import Snippet, LANGUAGE_CHOICES, STYLE_CHOICES


class SnippetSerializer(serializers.Serializer):
    """代码片段序列化器"""
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(
        required=False, allow_blank=True, max_length=100)
    code = serializers.CharField(style={'base_template': 'textarea.html'})
    linenos = serializers.BooleanField(required=False)
    language = serializers.ChoiceField(
        choices=LANGUAGE_CHOICES, default='python')
    style = serializers.ChoiceField(choices=STYLE_CHOICES, default='friendly')

    def create(self, validated_data):
        """
        Create and return a new `Snippet` instance, given the validated data.
        """
        return Snippet.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """
        Update and return an existing `Snippet` instance, given the validated data.
        """
        instance.title = validated_data.get('title', instance.title)
        instance.code = validated_data.get('code', instance.code)
        instance.linenos = validated_data.get('linenos', instance.linenos)
        instance.language = validated_data.get('language', instance.language)
        instance.style = validated_data.get('style', instance.style)
        instance.save()
        return instance
```

**启动shell插入一些测试数据**

```bash
python manage.py shell

from snippets.models import Snippet
from snippets.serializers import SnippetSerializer
from rest_framework.renderers import JSONRenderer
from rest_framework.parsers import JSONParser

snippet = Snippet(code='foo = "bar"\n')
snippet.save()

snippet = Snippet(code='print "hello, world"\n')
snippet.save()

#创建序列化对象
serializer = SnippetSerializer(snippet)
serializer.data
# {'id': 2, 'title': u'', 'code': u'print "hello, world"\n', 'linenos': False, 'language': u'python', 'style': u'friendly'}

# 序列化微Json
content = JSONRenderer().render(serializer.data)
content
# '{"id": 2, "title": "", "code": "print \\"hello, world\\"\\n", "linenos": false, "language": "python", "style": "friendly"}'

#反序列化为对象
import io

stream = io.BytesIO(content)
data = JSONParser().parse(stream)

serializer = SnippetSerializer(data=data)
serializer.is_valid()
# True
serializer.validated_data
# OrderedDict([('title', ''), ('code', 'print "hello, world"\n'), ('linenos', False), ('language', 'python'), ('style', 'friendly')])
serializer.save()
# <Snippet: Snippet object>

#直接由结果集序列化
serializer = SnippetSerializer(Snippet.objects.all(), many=True)
serializer.data
```

**使用ModelSerializers**

```python
class SnippetSerializer(serializers.ModelSerializer):
    """直接从数据模型创建序列化器"""
    class Meta:
        model = Snippet
        fields = ('id', 'title', 'code', 'linenos', 'language', 'style')
```

测试

```
from snippets.serializers import SnippetSerializer
serializer = SnippetSerializer()
print(repr(serializer))
```

区别

* 自动确定字段集
* 自动创建简单的方法如create、update等

**在视图中使用序列化器**

编写`snippets/views.py`

```python
# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import render

# Create your views here.

from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.renderers import JSONRenderer
from rest_framework.parsers import JSONParser
from snippets.models import Snippet
from snippets.serializers import SnippetSerializer


@csrf_exempt
def snippet_list(request):
    """
    List all code snippets, or create a new snippet.
    """
    if request.method == 'GET':
        snippets = Snippet.objects.all()
        serializer = SnippetSerializer(snippets, many=True)
        return JsonResponse(serializer.data, safe=False)

    elif request.method == 'POST':
        data = JSONParser().parse(request)
        serializer = SnippetSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, status=201)
        return JsonResponse(serializer.errors, status=400)


@csrf_exempt
def snippet_detail(request, pk):
    """
    Retrieve, update or delete a code snippet.
    """
    try:
        snippet = Snippet.objects.get(pk=pk)
    except Snippet.DoesNotExist:
        return HttpResponse(status=404)

    if request.method == 'GET':
        serializer = SnippetSerializer(snippet)
        return JsonResponse(serializer.data)

    elif request.method == 'PUT':
        data = JSONParser().parse(request)
        serializer = SnippetSerializer(snippet, data=data)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data)
        return JsonResponse(serializer.errors, status=400)

    elif request.method == 'DELETE':
        snippet.delete()
        return HttpResponse(status=204)
```

**创建url映射**

创建`snippets/urls.py`

```python
from django.urls import path
from snippets import views

urlpatterns = [
    path('snippets/', views.snippet_list),
    path('snippets/<int:pk>/', views.snippet_detail),
]

#py2
from django.conf.urls import url
from snippets import views

urlpatterns = [
    url(r'^snippets/$', views.snippet_list),
    url('^snippets/(?P<pk>\d+)/$', views.snippet_detail),
]
```

**添加到项目**

```python
from django.urls import path, include

urlpatterns = [
    path('', include('snippets.urls')),
]

#py2
from django.conf.urls import url, include
from django.contrib import admin

urlpatterns = [
    url('^', include('snippets.urls')),
]
```

**测试**

```python
python manage.py runserver
```

#### （2）Response

rest提供了一个Response，其提供了对原生Response的封装，自动将对象转回为请求体

```python

from rest_framework.response import Response

return Response(serializer.data)
return Response(serializer.data, status=status.HTTP_201_CREATED)
return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

```

#### （3）基于class的视图

rest提供了针对基于Class的视图的再一次的封装

**APIView**

将讲求分发到get/post等方法，覆写get/post方法即可针对性的放回（类似servlet的层次）

```python
from rest_framework.views import APIView

class SnippetList(APIView):
    """
    List all snippets, or create a new snippet.
    """

    def get(self, request, format=None):
        snippets = Snippet.objects.all()
        serializer = SnippetSerializer(snippets, many=True)
        return Response(serializer.data)

    def post(self, request, format=None):
        serializer = SnippetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

**rest_framework.mixins.XxxMixin**

同时还提供了一些用于混入的类，方便实现某些方法

```python
from rest_framework import mixins
from rest_framework import generics


class SnippetList(mixins.ListModelMixin,
                  mixins.CreateModelMixin,
                  generics.GenericAPIView):
    queryset = Snippet.objects.all()
    serializer_class = SnippetSerializer

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

```

**rest_framework.generics.XxxAPIView**

通用视图，进一步进行封装。只要提供序列化对象和结果集获取方法即可自动实现

#### （4）身份验证和权限

模型修改参见[指南](https://www.django-rest-framework.org/tutorial/4-authentication-and-permissions/#adding-information-to-our-model)

一般鉴权组件使用步骤：

* 配置过滤器之类的东西
* 编写鉴权规则
* 给定登录登出端点

```python
# 1 配置过滤器：使用django自带
# 2 鉴权规则：在view层配置
class SnippetDetail(generics.RetrieveUpdateDestroyAPIView):
    # ...
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

# 3 登录登出端点：在url层配置
urlpatterns += [
    url(r'^api-auth/', include('rest_framework.urls')),
]
```

**自定义权限规则**

实现自定义策略

```python
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the snippet.
        return obj.owner == request.user
```

在视图层应用规则

```python
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,
                          IsOwnerOrReadOnly,)
```

#### （5）关系和超链接api

reverse函数可以根据url的name查找到url的详情

```python

@api_view(['GET'])
def api_root(request, format=None):
    return Response({
        'users': reverse('user-list', request=request, format=format),
        'snippets': reverse('snippet-list', request=request, format=format)
    })
```

允许使用url的name声明序列化的字段

```python
class UserSerializer(serializers.ModelSerializer):
    # snippets = serializers.PrimaryKeyRelatedField(
    #     many=True, queryset=Snippet.objects.all())
    # 改为基于链接（视图名）的引入
    snippets = serializers.HyperlinkedRelatedField(
        many=True, view_name='snippet-detail', read_only=True)
```

#### （6）视图集和路由

定义好视图集后，自动创建支持rest风格的url映射

```python
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    This viewset automatically provides `list` and `detail` actions.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer


# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'snippets', views.SnippetViewSet)
router.register(r'users', views.UserViewSet)

# The API URLs are now determined automatically by the router.
# Additionally, we include the login URLs for the browsable API.
urlpatterns = [
    url(r'^', include(router.urls))
]
```
