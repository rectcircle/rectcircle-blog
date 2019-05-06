---
title: Django rest framework
date: 2018-11-06T18:16:26+08:00
draft: false
toc: false
comments: true
aliases:
  - /detail/174
  - /detail/174/
tags:
  - 后端
---

> [参考](https://www.django-rest-framework.org/)
> 源码
> [序列化相关](https://blog.csdn.net/l_vip/article/details/79156113)
> [视图mixns相关](https://blog.csdn.net/l_vip/article/details/79142105)
> [博客1](https://segmentfault.com/a/1190000004400540)

## 目录

*** 

* [1、简介](#1、简介)
* [2、层次说明](#2、层次说明)
* [3、视图层](#3、视图层)
* [4、序列化层](#4、序列化层)
* [5、异常处理](#5、异常处理)
* [6、定制化返回格式](#6、定制化返回格式)


### 1、简介

***

该框架是基于Django做的，顾名思义该框架遵循的原则是restful

* url代表资源，对于一般web应用就是数据库中的信息
* http方法代表操作方式，增删改查
* 返回数据是资源的一种表现形式

主要提供了以下功能：

* 数据校验
* 路由绑定
* 序列化
* 基于Django orm的存储

实现风格上大量使用mixins风格，层层封装。所以写业务时，一般通过集成实现，要从上到下考虑是否能实现，平滑降级处理。

### 2、层次说明

***

从时序视角出发：

* Django middleware
* UrlPattern
* **Router**
* **View**
* **Serializer**
* Model

中间为DRF增强或添加的部分

### 3、视图层

#### （1）常用类

从封装层次来说，从高层次到低层次为：
* viewsets 视图集：提供一个URL资源的众多方法组合的封装，通过as_view返回一个分发器调用list、create等方法，但是不会提供get、post方法、配合路由使用
	* `ModelViewSet` 提供全部增删改查操作
	* `ReadOnlyModelViewSet` 提供只读操作
	* `GenericViewSet` 不提供默认方法，需要手动实现get、post等方法（不推荐、为了框架一致性）、但是提供一些默认视图行为（get_object、get_queryset）
	* `ViewSet` 不提供默认方法，不提供属性注入
* generics  通用视图 提供通用的get、post等方法的实现（基于序列化器），实际上是调用mixins的方法
	* `GenericAPIView` 提供一系列`get_xxx`方法用于获取查询集、序列化类、过滤器等常用方法（`queryset`、`serializer_class`、`lookup_field`、`lookup_url_kwarg`）
		* 分页`pagination_class`默认是'rest_framework.pagination.PageNumberPagination'通过`DEFAULT_PAGINATION_CLASS`配置`pagination_class=None`将禁用分页
		* `filter_backends` 应该用于过滤查询集的过滤器后端类列表。默认值与DEFAULT_FILTER_BACKENDS设置的值相同。
	* `ListAPIView` 提供通用`get` all 方法
	* `RetrieveAPIView` 提供通用`get` one方法（通过主键）
	* `DestroyAPIView` 提供通用`delete`方法
	* `UpdateAPIView` 提供通用的`put`、`patch`方法
	* `ListCreateAPIView` 提供通用 `get` all和 `post` 方法
	* `RetrieveUpdateAPIView` 提供通用`get` one 、`put` 和 `patch` 方法
	* `RetrieveDestroyAPIView` 提供通用`get` one 和 `delete` 方法
	* `RetrieveUpdateDestroyAPIView` 提供通用的 `get` 、 `put`、`patch`、`delete`
* `mixins` （不推荐使用、要与GenericAPIView配合使用）通用方法的一真正实现的地方，为以上两个层次提供实现，命名上不是post、get这些，而是create、list这些
	* `CreateModelMixin`
	* `ListModelMixin`
	* `RetrieveModelMixin`
	* `UpdateModelMixin`
	* `DestroyModelMixin`
* APIView：rest框架根视图类，提供http方法分发到对应方法名的方法（使用上：定义get、post等方法），并提供：
	* 将request注入对象属性
	* 将headers注入对象
	* 将路径参数kwargs注入对象
	* 校验该url提供了那些方法
	* 分发请求到对应的方法
	* 若发生异常调用异常处理器
	* 生成符合Django的Response
	* 返回
	* 请求参数：
		* 路径参数（各个函数的kwargs，self.kwargs）
		* get参数（self.requst.query_params）
		* post参数（self.request.data），自动解析form、json、xml格式为dict
* View Django类...

基于函数的视图使用`@api_view`修饰即可
* `@api_view(http_method_names=['GET'])`
* `@throttle_classes([OncePerDayUserThrottle])` 限流阀：一天只能访问1次
* @renderer_classes(...)
* @parser_classes(...)
* @authentication_classes(...)
* @permission_classes(...)
* @schema(None) 去除html调试页面


#### （2）常用覆盖的方法

```python
    ### 视图集和generics的方法

    # 来自mixins.CreateModelMixin
    # 将影响POST（insert）行为
    def perform_create(self, serializer):
        return super(StudentViewSet, self).perform_create(serializer)

    # 来自mixins.RetrieveModelMixin
    # 将影响GET（get one）方法
    def retrieve(self, request, *args, **kwargs):
        return super(StudentViewSet, self).retrieve(request, *args, **kwargs)

    # 来自mixins.UpdateModelMixin
    # 将影响PUT（更新全部）方法
    def perform_update(self, serializer):
        return super(StudentViewSet, self).perform_update(serializer)

    # 来自mixins.UpdateModelMixin
    # 将影响patch（更新部分）方法
    def partial_update(self, request, *args, **kwargs):
        return super(StudentViewSet, self).partial_update(request, *args, **kwargs)

    # 来自mixins.DestroyModelMixin
    # 将影响delete（更新部分）方法
    def perform_destroy(self, instance):
        return super(StudentViewSet, self).perform_destroy(instance)

    # 来自mixins.ListModelMixin
    # 将影响GET（get list）方法
    def list(self, request, *args, **kwargs):
        return super(StudentViewSet, self).list(request, *args, **kwargs)

    ### generics和APIView常用的覆盖方法：get、post、put、patch、option、delete、trace
		
		def post(self, request, *args, **kwargs):
				 pass
				 
		# 可以使用的成员变量、和方法
		def method(self):
		    print self.request
				print self.allowed_methods
				print self.queryset
				print self.get_queryset()
				print self.get_serializer(self.queryset(), many=True)
				
```

**[Request](https://www.django-rest-framework.org/api-guide/requests/)**

* 对Django request的增强
* data属性包含了除了get之外的所有请求体，通过[解析器](https://www.django-rest-framework.org/api-guide/parsers/)解析获得
* query_params属性包含get后的查询参数
* user属性


**[Response](https://www.django-rest-framework.org/api-guide/responses/)**

* 提供内容协商，根据请求返回表征
* 签名` Response(data, status=None, template_name=None, headers=None, content_type=None)`
	* data: The serialized data for the response.
	* status: A status code for the response. Defaults to 200. See also status codes.
	* template_name: A template name to use if HTMLRenderer is selected.
	* headers: A dictionary of HTTP headers to use in the response.
	* content_type: The content type of the response. Typically, this will be set automatically by the renderer as determined by content negotiation, but there may be some cases where you need to specify the content type explicitly.



#### （3）视图集和generics常用的配置

```python
    # 结合django_filter
    filter_backends = (SchoolPermissionFilterBackend, filters.DjangoFilterBackend, filters.SearchFilter)
		# 认证器
		authentication_classes = (authentication.TokenAuthentication,)
		# 权限类
    permission_classes = (IsAuthenticated, ModulePermission)
		# 渲染器
		renderer_classes
    # 解释器
		parser_classes
		#？？ 流量控制
		throttle_classes
		# 内容协商
		content_negotiation_class

		# 查询集
    queryset = Course.objects.filter(is_active=True).order_by('-id')
		# 序列化类
	  serializer_class = Xxx
    filter_fields = ('term',)
    search_fields = ('name', 'teacher', 'school__name')
    module_perms = ['course.course']
```

**视图集获取信息**

视图提供了如下内容

* basename - the base to use for the URL names that are created.
* action - the name of the current action (e.g., list, create).
* detail - boolean indicating if the current action is configured for a list or detail view.
* suffix - the display suffix for the viewset type - mirrors the detail attribute.
* name - the display name for the viewset. This argument is mutually exclusive to suffix.
* description - the display description for the individual view of a viewset.

```python
def get_permissions(self):
    """
    Instantiates and returns the list of permissions that this view requires.
    """
    if self.action == 'list':
        permission_classes = [IsAuthenticated]
    else:
        permission_classes = [IsAdmin]
    return [permission() for permission in permission_classes]
```

**在视图添加额外的行为**

```python
from django.contrib.auth.models import User
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from myapp.serializers import UserSerializer, PasswordSerializer

class UserViewSet(viewsets.ModelViewSet):
    """
    A viewset that provides the standard actions
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=True, methods=['post'])
    def set_password(self, request, pk=None):
        user = self.get_object()
        serializer = PasswordSerializer(data=request.data)
        if serializer.is_valid():
            user.set_password(serializer.data['password'])
            user.save()
            return Response({'status': 'password set'})
        else:
            return Response(serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False)
    def recent_users(self, request):
        recent_users = User.objects.all().order_by('-last_login')

        page = self.paginate_queryset(recent_users)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(recent_users, many=True)
        return Response(serializer.data)
```

### 4、序列化层

DRF提供的有一个核心功能之一。该层次提供：

* 声明式的对用户提交数据的校验
* 自定义的对用户数据的校验
* 对数据库写入的封装
* 对数据库读取的封装
* 对返回数据格式的声明

#### （1）两个主要父类

**`serializers.Serializer`**
 
基础可用序列化类，提供基本的数据验证、序列化功能

**`serializers.ModelSerializer`**
 
继承自Serializer，额外提供如下功能：
从Model中读取字段信息
 
 
#### （2）使用方法

* 继承自两个主要父类之一
* 声明字段（ModelSerializer可以声明查询集、Meta）
* 根据业务覆写验证器、属性获取器


该对象的构建方式：

* 从`data`（用户输入）构建->执行验证（过滤字段：read_only）->输出 `validated_data` -> 存到数据库
* 从`query_set` （数据库）构建->执行验证（过滤字段：write_only）->输出`validated_data` -> 返回Json


#### （3）字段类型

字段是一种配置类，根上的父类是`serializers.Field`，规定了字段的众多属性

```python
    def __init__(self, read_only=False, write_only=False,
                 required=None, default=empty, initial=empty, source=None,
                 label=None, help_text=None, style=None,
                 error_messages=None, validators=None, allow_null=False):
        #...
```

字段定义的是接收那些用户参数、返回用户那些字段

* 读写的角度指的是api的用户是度还是写
	* read_only 指的是(required=False)：该字段只需要返回给用户、不需要用户输入（不强制、但是可以传过来、处理后的validated_data不存在），也就是说不会写入数据库
	* write_only 指的是(required=True)：该字段只需要用户给出、不需要（从数据库中）返回给用户（会出现在validated_data中）
	* 不指定(required=True): 两个方向打通
	* 两者不能同时指定
* required 默认为True，从模型中读根据模型是否为null是否有默认值决定，read_only指定时，必须为False，否则异常，write_only必须为False

例子

```python
class FieldTestSerializer(serializers.Serializer):
    read_field = serializers.CharField(read_only=True)
    write_field = serializers.CharField(write_only=True)
    normal_field =serializers.CharField()
		
fs = FieldTestSerializer(data={'read_field':'read', 'write_field':'write', 'normal_field':'nornal'})
fs.is_valid()
fs.validated_data

fs = FieldTestSerializer(data={'read_field':'read', 'write_field':'write'})
fs.is_valid()

fs = FieldTestSerializer(data={'read_field':'read', 'normal_field':'nornal'})
fs.is_valid()

fs = FieldTestSerializer(data={ 'write_field':'write', 'normal_field':'nornal'})
fs.is_valid()

```


**基本数据类型：**

CharField、BooleanField、IntegerField、DateTimeField等

HiddenField字段

```python
user = serializers.HiddenField(
    default=serializers.CurrentUserDefault())
```

**自定义Field：**

```python
class CustomDateTimeField(DateTimeField):
    def to_representation(self, value):
        if not value:
            return None
        value = timezone.localtime(value)
        value = int(value.timestamp())
        return value
```


#### （4）自定义验证

* 传入self和待验证的参数
* 若验证失败，返回异常
* 若验证成功，返回该字段
* 若需要增强该字段，返回新字段即可

**针对性验证**

定义函数：`validate_字段名(self, field)`
* field是待验证的字段

**联合验证**

定义函数：`validate(self, attrs)`

* attrs是待验证的参数集


#### （5）ModelSerializer特有功能

* 重载了create、update、save方法、配合视图集使用
* 字段声明、可以从Model中读取

**常用的配置字段和重写函数**

```python
class StudentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    password = serializers.CharField(source='user.password')
    class Meta:
        model = models.Student
        fields = ('username', 'password', 'name', 'class_name',)
        extra_kwargs = {
            'password': {'write_only': True, 'required': True, },
        }
    # 对应insert
    def create(self, validated_data):
        return super(StudentSerializer, self).create(validated_data)
    # 对应update
    def update(self, instance, validated_data):
        return super(StudentSerializer, self).update(instance, validated_data)
    # 对应updateOrinsert
    def save(self, **kwargs):
        return super(StudentSerializer, self).save(**kwargs)
```

**write_only字段去除：如验证码**

自定义validatedel

```python
    def validate(self, attrs):
        del attrs["code"]
        return attrs
```

**需要动态获取/计算的字段**

```python
    field = serializers.SerializerMethodField()
    # 方法写法：get_ + 字段
    def get_field(self, obj):
    # obj指这个model的对象
        return 1
```


**外键约束**

再次声明

```python
# 获取id
category = serializers.PrimaryKeyRelatedField(queryset=CourseCategory.objects.all(), required=True)
# 获取详细字段
category = CourseCategorySerializer()
# 反向获取
courses = CourseSerializer(many=True)
# 自引用外键
parent_category = models.ForeignKey('self', null=True, blank=True, 
                    verbose_name='父类目别',
                    related_name='sub_cat')
# 没有外键约束的情况
courses = SerializerMethodField()
def get_courses(self, obj):
    all_courses = Course.objects.filter(category__parent_category_id=obj.id)
    courses_serializer = CourseSerializer(all_course, many=True, 
                    context={'request': self.context['request']})
    return courses_serializer.data
```

### 5、异常处理

创建异常处理函数

```python
def exception_handler(exc, context):
    logging.exception(exc)

    if isinstance(exc, exceptions.PermissionDenied):
        return response.Response(status=exc.status_code, data=err_data, exception=True)

    elif isinstance(exc, exceptions.APIException):
        return response.Response(status=exc.status_code, data=exc, exception=True)

    elif isinstance(exc, PermissionDenied):
        return response.Response(status=status.HTTP_403_FORBIDDEN, data=err_data, exception=True)

    elif isinstance(exc, Http404):
        return response.Response(status=status.HTTP_404_NOT_FOUND, data=exc, exception=True)

    return response.Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR, data=exc, exception=True)
```

注册异常处理器

`settings.py`

```python
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'xxx.exception_handler',
}
```



### 6、定制化返回格式

大多数国内restful api的设计喜欢在respose body里面添加code和message之类的消息，将返回数据放在data里。

这里给出一个临时解决方案：一个Mixin的类

```python
def _return_wrapper_response_as_view(as_view):
    def wrapper(request, *args, **kwargs):
        response = as_view(request, *args, **kwargs)
        print type(response)
        if isinstance(response, Response) and response.accepted_media_type == u'application/json':
            response.data = OrderedDict(
                code=0, msg='success', data=response.data)
            return response
        return response
    return wrapper

class WrapResponse(APIView):

    @classmethod
    def as_view(cls, *args, **initkwargs):
        # 返回一个函数 该函数 为 request -> HttpResponse
        handle = super(WrapResponse, cls).as_view(*args, **initkwargs)
        return _return_wrapper_response_as_view(handle)
```

需要返回这种格式的类继承该类（放在继承链的第一个）

使用装饰器实现

```python

def wrap_response(wrap_class):
    # http://python.jobbole.com/85939/

    old_as_view = wrap_class.as_view

    def as_view(cls, *args, **initkwargs):
        # 返回一个函数 该函数 为 request -> HttpResponse
        handle = old_as_view(*args, **initkwargs)
        return _return_wrapper_response_as_view(handle)

    wrap_class.as_view = types.MethodType(as_view, wrap_class)

    return wrap_class
```

更好的方案重写`finalize_response`：

```python
    def finalize_response(self, request, response, *args, **kwargs):
        """override APIView.finalize_response, pack final data format with code/msg/data.
        """
        response = super(ResponseMixin, self).finalize_response(request, response, *args, **kwargs)

        if isinstance(response.data, Exception):
            exc = response.data
            data = dict(
                code=APIRspCode.ERROR, data=None,
                msg=exc.message or u'操作发生错误，请联系管理人员.'
            )

            if isinstance(exc, exceptions.ValidationError):
                data.update(msg=u'参数错误.', err_detail=exc.detail)

            elif isinstance(exc, exceptions.APIException):
                data.update(err_detail=exc.detail)
                if isinstance(exc.detail, (str, unicode)):
                    data.update(msg=exc.detail)
        elif isinstance(response.data, dict) and response.data.get('code') == APIRspCode.ERROR:
            data = response.data
        else:
            if response.status_code in [204]:
                response.status_code = 200
            status_text = u'success' if response.status_text in ['OK'] else response.status_text
            data = dict(code=APIRspCode.SUCCESS, msg=status_text, data=response.data)

        response.data = data
        return response
```

**将数据库实例转换为dict**

```python
    def to_representation(self, instance):
        ret = super(ScheduleSerializers, self).to_representation(instance)
        # Do sth e.g. 清理一些参数
        return ret
```

### 7、获取view对象和request

```
self.context['request']
self.context['view']
```
