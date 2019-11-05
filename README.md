# Rectcircle 个人博客

[![Netlify Status](https://api.netlify.com/api/v1/badges/9a948925-95c9-4287-a9f6-f6c9cdfd5948/deploy-status)](https://app.netlify.com/sites/rectcircle/deploys)

## 步骤

### 前置依赖

[Hugo 安装](https://gohugo.io/getting-started/installing/)

### 克隆项目

```bash
https://github.com/rectcircle/rectcircle-blog.git
cd rectcircle-blog
git submodule init
git submodule update
```

### 运行预览

```bash
hugo server -w -D
```

### 编译

```bash
hugo --gc --minify
```

### 浏览器查看效果

http://localhost:1313/
