---
title: Mathjax与LaTex公式教程
date: 2017-04-19T12:27:26+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/68
  - /detail/68/
tags:
  - 机器学习
---

<script src="https://cdn.bootcss.com/mathjax/2.7.0/MathJax.js?config=default"></script>

> http://mlworks.cn/posts/introduction-to-mathjax-and-latex-expression/
> 以下的示例代码包含markdown的转义字符，即仅在markdown编辑器下才能正常显示

## 一、MathJax简介

***

[MathJax](http://www.mathjax.org/)是一款运行在浏览器中的开源的数学符号渲染引擎，使用MathJax可以方便的在浏览器中显示数学公式，不需要使用图片。目前，MathJax可以解析Latex、MathML和ASCIIMathML的标记语言。

## 二、基础

***

### 1、引入js

```html
<script type="text/javascript" src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=default"></script>

或者国内cdn

<script src="https://cdn.bootcss.com/mathjax/2.7.0/MathJax.js?config=default"></script>
```

### 2、块公式

#### （1）公式分隔符

```
$$公式内容$$
\[公式内容\]
```

注意：在markdown编辑器中，反斜杠`\`、下划线`_`、星号`*`需要使用`\`转义，以下的示例代码包含markdown的转义字符

#### （2）示例

`$$f(x)=3\times x$$`显示为：

$$f(x)=3\times x$$

`\\[f(x)=3\times x\\]`显示为：

\\[f(x)=3\times x\\]

### 2、内联公式

#### （1）公式分隔符

```
\(公式内容\)
```

#### （2）示例

`\\(f(x)=3\times x\\)`显示为：\\(f(x)=3\times x\\)

## 三、符号列表

***

### 1、希腊字母

|名称|大写|Tex代码|小写|Tex代码|
|----|---|------|-----|------|
|alpha |	A |	A | 	α |	\alpha |
|beta |	B |	B | 	β |	\beta |
|gamma |	Γ |	\Gamma |	γ |	\gamma |
|delta |	Δ |	\Delta |	δ |	\delta |
|epsilon |	E |	E | 	ϵ |	\epsilon |
|zeta |	Z |	Z | 	ζ |	\zeta |
|eta |	H |	H | 	η |	\eta |
|theta |	Θ |	\Theta |	θ |	\theta |
|iota |	I |	I | 	ι |	\iota |
|kappa |	K |	K | 	κ |	\kappa |
|lambda |	Λ |	\Lambda |	λ |	\lambda |
|mu |	M |	M	 |μ | 	\mu |
|nu |	N |	N	 |ν | 	\nu |
|xi |	Ξ |	\Xi |	ξ |	\xi |
|omicron |	O |	O | 	ο |	\omicron |
|pi |	Π |	\Pi |	π |	\pi |
|rho |	P |	P | 	ρ |	\rho |
|sigma |	Σ |	\Sigma |	σ |	\sigma |
|tau |	T |	T | 	τ |	\tau |
|upsilon |	Υ |	\Upsilon |	υ |	\upsilon |
|phi |	Φ |	\Phi |	ϕ |	\phi |
|chi |	X |	X | 	χ |	\chi |
|psi |	Ψ |	\Psi |	ψ |	\psi |
|omega |	Ω |	\Omega |	ω |	\omega |

### 2、上标下标顶部

**上标**：`^`号

`\\(x^2\\)`显示为：\\(x^2\\)
`\\(x^20\\)`显示为：\\(x^20\\)
`\\(x^{20}\\)`显示为：\\(x^{20}\\)
`\\(x^{5^6}\\)`显示为：\\(x^{5^6}\\)

**下标**：`_`

`\\(x\_i\\)`显示为：\\(x\_i\\)

**顶部符号**：

`$$\hat x \quad \overline {xyz} \quad \vec  a \quad \overrightarrow {x} \quad \dot x \quad \ddot x$$`：
$$\hat x \quad \overline {xyz} \quad \vec  a \quad \overrightarrow {x} \quad \dot x \quad \ddot x$$

### 3、括号

**小括号、中括号**：

`\\((2+3)[4+4]\\)`显示为：\\((2+3)[4+4]\\)

**大括号**需要转义、或者使用`\lbrace` 和`\rbrace`

`\\(\\{a\*b\\}\\)`显示为：\\(\\{a\*b\\}\\)

**尖括号**：`\langle` 和 `\rangle`

`\\(\langle x \rangle\\)`：\\(\langle x \rangle\\)

**上取整**：`\lceil` 和 `\rceil`

`\\(\lceil x \rceil\\)`：\\(\lceil x \rceil\\)

**下取整**：`\lfloor` 和 `\rfloor`

`\\(\lfloor x \rfloor\\)`：\\(\lfloor x \rfloor\\)

需要注意的是，原始符号并不会随着公式大小缩放。

`$$\lbrace\sum\_{i=0}^n i^2 = \frac{(n^2+n)(2n+1)}{6}\rbrace (1.1)$$`

$$\lbrace\sum\_{i=0}^n i^2 = \frac{(n^2+n)(2n+1)}{6}\rbrace (1.1)$$

`$$\left \lbrace \sum\_{i=0}^n i^2 = \frac{(n^2+n)(2n+1)}{6} \right\rbrace (1.2)$$`

$$\left \lbrace \sum\_{i=0}^n i^2 = \frac{(n^2+n)(2n+1)}{6} \right\rbrace (1.2)$$

可以看到，第二个中的括号是经过缩放的。

### 4、求和和积分

`\sum`表示求和

`\\(\sum\_1^n\\)`：\\(\sum\_1^n\\)

`\int`表示积分：

`\\(\int\_1^\infty\\)`：\\(\int\_1^\infty\\)

其他：

`\prod`：∏，

`\bigcup`:⋃，

`\bigcap`：⋂，

`\iint`：∬，

`\iint`：∭，

`\iiiint`：∬∬，

`\partial`：∂，

`\nabla`：∇，

`\infty`：∞，

`\oint`：∮，

`\triangle`：△

### 5、分式和根式

**分式**：`\frac{}` 或者 `{ \over }`

`\\(\frac ab\\)`：\\(\frac ab\\)

`\\(\frac {a}{bc}\\)`：\\(\frac {a}{bc}\\)

或者

`\\({a+1\over b+1}\\)`：\\({a+1\over b+1}\\)

**根式**：\sqrt

`\\(\sqrt[4]{\frac xy}\\)`：\\(\sqrt[4]{\frac xy}\\)

### 6、三角函数

* `\\(\sin x\\)`：\\(\sin x\\)
* `\\(\arctan x\\)`：\\(\arctan x\\)
* `\\(\lim\_{1\to\infty}\\)`：\\(\lim\_{1\to\infty}\\)

### 7、比较运算符

* `\\(\lt\\)`：\\(\lt\\)
* `\\(\gt\\)`：\\(\gt\\)
* `\\(\le\\)`：\\(\le\\)
* `\\(\ge\\)`：\\(\ge\\)
* `\\(\neq\\)`：`\\(\neq\\)
* 在前面加上\not表示否`\\(\not\lt\\)`：\\(\not\lt\\)

### 8、四则运算

* `\\(\times\\)`：\\(\times\\)
* `\\(\div\\)`：\\(\div\\)
* `\\(\pm\\)`：\\(\pm\\)
* `\\(\mp\\)`：\\(\mp\\)
* `\\(x \cdot b\\)`：\\(x \cdot b\\)

### 9、集合运算

* `\\(\cup\\)`: \\(\cup \\)
* `\\(\cap\\)`: \\(\cap \\)
* `\\(\setminus\\)`: \\(\setminus \\)
* `\\(\subset\\)`: \\(\subset \\)
* `\\(\subseteq\\)`: \\(\subseteq \\)
* `\\(\subsetneq\\)`或者`\\(\not \subseteq \\)`: \\(\not \subseteq \\)
* `\\(\supset\\)`: \\(\supset \\)
* `\\(\in\\)`: \\(\in \\)
* `\\(\notin\\)`: \\(\notin \\)
* `\\(\emptyset\\)`: \\(\emptyset \\)
* `\\(\varnothing\\)`：出错

### 10、箭头

* `\\(\to\\)`：\\(\to\\)
* `\\(\rightarrow\\)`：\\(\rightarrow\\)
* `\\(\leftarrow\\)`：\\(\leftarrow\\)
* `\\(\Rightarrow\\)`：\\(\Rightarrow\\)
* `\\(\Leftarrow\\)`：\\(\Leftarrow\\)
* `\\(\mapsto\\)`：\\(\mapsto\\)

### 11、逻辑运算符

* `\\(\land\\)`：\\(\land\\)
* `\\(\lor\\)`：\\(\lor\\)
* `\\(\lnot\\)`：\\(\lnot\\)
* `\\(\forall\\)`：\\(\forall\\)
* `\\(\exists\\)`：\\(\exists\\)
* `\\(\top\\)`：\\(\top\\)
* `\\(\bot\\)`：\\(\bot\\)
* `\\(\vdash\\)`：\\(\vdash\\)
* `\\(\vDash\\)`：出错

### 12、其他符号

* `\\(\star \ast \oplus \circ \bullet\\)`：\\(\star \ast \oplus \circ \bullet\\)
* `\\(\approx \sim \cong \equiv \prec \\)`：\\(\approx \sim \cong \equiv \prec \\)
* `\\(\infty \aleph_0 \nabla \partial \nabla \partial \Im \Re\\)`：\\(\infty \aleph_0 \nabla \partial \nabla \partial \Im \Re\\)
* 模运算`\\(a\equiv b\pmod n\\)`：\\(a\equiv b\pmod n\\)
* `\ldots`与`\cdots`：\\(\ldots \cdots\\)

### 13、空隙间隔

`\,`、`\quad` 与 `\qquad` 会增加更大的间隙`\quad` 与 `\qquad` 会增加更大的间隙：

$$a\qquad b$$
$$a \, b$$

### 14、转义字符

`\`反斜线

`$$\$ \\_ $$`
$$ \$ \\_ $$

## 四、表格

***

略

## 五、矩阵

***

### 1、矩阵基本用法

使用`$$\begin{matrix}…\end{matrix}$$`这样的形式来表示矩阵，在`\begin`与`\end`之间加入矩阵中的元素即可。矩阵的行之间使用`\\`分隔，列之间使用`&`分隔。

```latex
$$
\begin{matrix}
1 & x & x^2 \\\\
1 & y & y^2 \\\\
1 & z & z^2 \\\\
\end{matrix}
$$
```

$$
\begin{matrix}
1 & x & x^2 \\\\
1 & y & y^2 \\\\
1 & z & z^2 \\\\
\end{matrix}
$$

### 2、给矩阵加括号

```latex
$$
\begin{pmatrix}
1&2\\\\
3&4\\\\
\end{pmatrix}
$$
```

$$
\begin{pmatrix}
1&2\\\\
3&4\\\\
\end{pmatrix}
$$

```latex
$$
\begin{bmatrix}
1&2\\\\
3&4\\\\
\end{bmatrix}
$$
```

$$
\begin{bmatrix}
1&2\\\\
3&4\\\\
\end{bmatrix}
$$

```latex
$$
\begin{Bmatrix}
1&2\\\\
3&4\\\\
\end{Bmatrix}
$$
```

$$
\begin{Bmatrix}
1&2\\\\
3&4\\\\
\end{Bmatrix}
$$

```latex
$$
\begin{vmatrix}
1&2\\\\
3&4\\\\
\end{vmatrix}
$$
```

$$
\begin{vmatrix}
1&2\\\\
3&4\\\\
\end{vmatrix}
$$

```latex
$$
\begin{Vmatrix}
1&2\\\\
3&4\\\\
\end{Vmatrix}
$$
```

$$
\begin{Vmatrix}
1&2\\\\
3&4\\\\
\end{Vmatrix}
$$

### 3、省略号

* `\cdots` ⋯
* `\ddots` ⋱
* `\vdots` ⋮

### 4、增广矩阵

```latex
$$ \left[
      \begin{array}{cc|c}
        1&2&3\\\\
        4&5&6
      \end{array}
    \right]
$$
```

$$ \left[
      \begin{array}{cc|c}
        1&2&3\\\\
        4&5&6
      \end{array}
    \right]
$$

## 六、公式对齐

***

```latex
$$
\begin{align}
\sqrt{37} & = \sqrt{\frac{73^2-1}{12^2}} \\\\
 & = \sqrt{\frac{73^2}{12^2}\cdot\frac{73^2-1}{73^2}} \\\\
 & = \sqrt{\frac{73^2}{12^2}}\sqrt{\frac{73^2-1}{73^2}} \\\\
 & = \frac{73}{12}\sqrt{1 - \frac{1}{73^2}} \\\\
 & \approx \frac{73}{12}\left(1 - \frac{1}{2\cdot73^2}\right)
\end{align}
$$
```

$$
\begin{align}
\sqrt{37} & = \sqrt{\frac{73^2-1}{12^2}} \\\\
 & = \sqrt{\frac{73^2}{12^2}\cdot\frac{73^2-1}{73^2}} \\\\
 & = \sqrt{\frac{73^2}{12^2}}\sqrt{\frac{73^2-1}{73^2}} \\\\
 & = \frac{73}{12}\sqrt{1 - \frac{1}{73^2}} \\\\
 & \approx \frac{73}{12}\left(1 - \frac{1}{2\cdot73^2}\right)
\end{align}
$$

其中需要使用&来指示需要对齐的位置。请使用右键查看上述公式的代码。

## 七、分类表达式

***

定义函数的时候经常需要分情况给出表达式，可使用`\begin{cases}…\end{cases}`。其中，使用`\`来分类，使用`&`指示需要对齐的位置。如：

```latex
$$
f(n) =
\begin{cases}
n/2,  & \text{if $n$ is even} \\\\
3n+1, & \text{if $n$ is odd}  \\\\
\end{cases}
$$
```

$$
f(n) =
\begin{cases}
n/2,  & \text{if $n$ is even} \\\\
3n+1, & \text{if $n$ is odd}  \\\\
\end{cases}
$$

```latex
$$
\left.
\begin{array}{l}
\text{if $n$ is even:}&n/2\\\\
\text{if $n$ is odd:}&3n+1
\end{array}
\right\\}
=f(n)
$$
```

$$
\left.
\begin{array}{l}
\text{if $n$ is even:}&n/2\\\\
\text{if $n$ is odd:}&3n+1
\end{array}
\right\\}
=f(n)
$$

## 八、其他

***

### 1、惯用法

**不要在再指数或者积分中使用`\frac`而使用 `/`**

$$
\begin{array}{cc}
\mathrm{Bad} & \mathrm{Better} \\\\
\hline \\\\
e^{i\frac{\pi}2} \quad e^{\frac{i\pi}2}& e^{i\pi/2} \\\\
\int\_{-\frac\pi2}^\frac\pi2 \sin x\,dx & \int\_{-\pi/2}^{\pi/2}\sin x\,dx \\\\
\end{array}
$$

**使用 `\mid`代替 `|` 作为分隔符**

$$
\begin{array}{cc}
\mathrm{Bad} & \mathrm{Better} \\\\
\hline \\\\
\{x|x^2\in\Bbb Z\} & \{x\mid x^2\in\Bbb Z\} \\\\
\end{array}
$$

**对于多重积分，不要使用`\int\int`此类的表达，应该使用`\iint` `\iiint`等特殊形式。**

$$
\begin{array}{cc}
\mathrm{Bad} & \mathrm{Better} \\\\
\hline \\
\int\int_S f(x)\,dy\,dx & \iint\_S f(x)\,dy\,dx \\\\
\int\int\int_V f(x)\,dz\,dy\,dx & \iiint\_V f(x)\,dz\,dy\,dx
\end{array}
$$

**在微分前应该使用\,来增加些许空隙，否则TEXTEX会将微分紧凑地排列在一起。如下：**

$$
\begin{array}{cc}
\mathrm{Bad} & \mathrm{Better} \\\\
\hline \\\\
\iiint\_V f(x)dz dy dx & \iiint\_V f(x)\,dz\,dy\,dx
\end{array}
$$

### 2、连分数

书写连分数表达式时，请使用`\cfrac`代替`\frac`或者`\over`两者效果对比如下：

$$
x = a\_0 + \cfrac{1^2}{a\_1 + \cfrac{2^2}{a\_2 + \cfrac{3^2}{a\_3 + \cfrac{4^4}{a\_4 + \cdots}}}} \tag{\cfrac}
$$

$$
x = a\_0 + \frac{1^2}{a\_1 + \frac{2^2}{a\_2 + \frac{3^2}{a\_3 + \frac{4^4}{a\_4 + \cdots}}}} \tag{\frac}
$$

### 3、方程组

#### （1）使用`\begin{array} … \end{array}`与`\left{…\right`.配合，表示方程组，如：

```latex
$$
\left\\{
\begin{array}{c}
a\_1x+b\_1y+c\_1z=d\_1 \\\\
a\_2x+b\_2y+c\_2z=d\_2 \\\\
a\_3x+b\_3y+c\_3z=d\_3
\end{array}
\right.
$$
```

$$
\left\\{
\begin{array}{c}
a\_1x+b\_1y+c\_1z=d\_1 \\\\
a\_2x+b\_2y+c\_2z=d\_2 \\\\
a\_3x+b\_3y+c\_3z=d\_3
\end{array}
\right.
$$

#### （2）同时，还可以使用`\begin{cases}…\end{cases}`表达同样的方程组，如：

```latex
$$
\begin{cases}
a_1x+b\_1y+c\_1z=d\_1 \\\\
a_2x+b\_2y+c\_2z=d\_2 \\\\
a_3x+b\_3y+c\_3z=d\_3
\end{cases}
$$
```

$$
\begin{cases}
a_1x+b\_1y+c\_1z=d\_1 \\\\
a_2x+b\_2y+c\_2z=d\_2 \\\\
a_3x+b\_3y+c\_3z=d\_3
\end{cases}
$$

#### （3）对齐方程组中的 `=` 号，可以使用 `\being{aligned} .. \end{aligned}`，如：

```latex
$$
\left\\{
\begin{aligned}
a\_1x+b\_1y+c\_1z &=d\_1+e\_1 \\\\
a\_2x+b\_2y&=d\_2 \\\\
a\_3x+b\_3y+c\_3z &=d\_3
\end{aligned}
\right.
$$
```

$$
\left\\{
\begin{aligned}
a\_1x+b\_1y+c\_1z &=d\_1+e\_1 \\\\
a\_2x+b\_2y&=d\_2 \\\\
a\_3x+b\_3y+c\_3z &=d\_3
\end{aligned}
\right.
$$

#### （4）如果要对齐 `=` 号 和项，可以使用`\being{array}{列样式} .. \end{array}`，如：

```latex
$$
\left\\{
\begin{array}{ll}
a\_1x+b\_1y+c\_1z &=d\_1+e\_1 \\\\
a\_2x+b\_2y &=d\_2 \\\\
a\_3x+b\_3y+c\_3z &=d\_3
\end{array}
\right.
$$
```

$$
\left\\{
\begin{array}{ll}
a\_1x+b\_1y+c\_1z &=d\_1+e\_1 \\\\
a\_2x+b\_2y &=d\_2 \\\\
a\_3x+b\_3y+c\_3z &=d\_3
\end{array}
\right.
$$

### 4、颜色

```latex
$$
\begin{array}{|rc|}
\hline
\verb+\color{black}{text}+ & \color{black}{text} \\\\
\verb+\color{gray}{text}+ & \color{gray}{text} \\\\
\verb+\color{silver}{text}+ & \color{silver}{text} \\\\
\verb+\color{white}{text}+ & \color{white}{text} \\\\
\hline
\verb+\color{maroon}{text}+ & \color{maroon}{text} \\\\
\verb+\color{red}{text}+ & \color{red}{text} \\\\
\verb+\color{yellow}{text}+ & \color{yellow}{text} \\\\
\verb+\color{lime}{text}+ & \color{lime}{text} \\\\
\verb+\color{olive}{text}+ & \color{olive}{text} \\\\
\verb+\color{green}{text}+ & \color{green}{text} \\\\
\verb+\color{teal}{text}+ & \color{teal}{text} \\\\
\verb+\color{aqua}{text}+ & \color{aqua}{text} \\\\
\verb+\color{blue}{text}+ & \color{blue}{text} \\\\
\verb+\color{navy}{text}+ & \color{navy}{text} \\\\
\verb+\color{purple}{text}+ & \color{purple}{text} \\\\
\verb+\color{fuchsia}{text}+ & \color{magenta}{text} \\\\
\hline
\end{array}
$$
```

$$
\begin{array}{|rc|}
\hline
\verb+\color{black}{text}+ & \color{black}{text} \\\\
\verb+\color{gray}{text}+ & \color{gray}{text} \\\\
\verb+\color{silver}{text}+ & \color{silver}{text} \\\\
\verb+\color{white}{text}+ & \color{white}{text} \\\\
\hline
\verb+\color{maroon}{text}+ & \color{maroon}{text} \\\\
\verb+\color{red}{text}+ & \color{red}{text} \\\\
\verb+\color{yellow}{text}+ & \color{yellow}{text} \\\\
\verb+\color{lime}{text}+ & \color{lime}{text} \\\\
\verb+\color{olive}{text}+ & \color{olive}{text} \\\\
\verb+\color{green}{text}+ & \color{green}{text} \\\\
\verb+\color{teal}{text}+ & \color{teal}{text} \\\\
\verb+\color{aqua}{text}+ & \color{aqua}{text} \\\\
\verb+\color{blue}{text}+ & \color{blue}{text} \\\\
\verb+\color{navy}{text}+ & \color{navy}{text} \\\\
\verb+\color{purple}{text}+ & \color{purple}{text} \\\\
\verb+\color{fuchsia}{text}+ & \color{magenta}{text} \\\\
\hline
\end{array}
$$

```latex
$$
\begin{array}{|rrrrrrrr|}\hline
\verb+#000+ & \color{#000}{text} & & &
\verb+#00F+ & \color{#00F}{text} & & \\\\
& & \verb+#0F0+ & \color{#0F0}{text} &
& & \verb+#0FF+ & \color{#0FF}{text}\\\\
\verb+#F00+ & \color{#F00}{text} & & &
\verb+#F0F+ & \color{#F0F}{text} & & \\\\
& & \verb+#FF0+ & \color{#FF0}{text} &
& & \verb+#FFF+ & \color{#FFF}{text}\\\\
\hline
\end{array}
$$
```

$$
\begin{array}{|rrrrrrrr|}\hline
\verb+#000+ & \color{#000}{text} & & &
\verb+#00F+ & \color{#00F}{text} & & \\\\
& & \verb+#0F0+ & \color{#0F0}{text} &
& & \verb+#0FF+ & \color{#0FF}{text}\\\\
\verb+#F00+ & \color{#F00}{text} & & &
\verb+#F0F+ & \color{#F0F}{text} & & \\\\
& & \verb+#FF0+ & \color{#FF0}{text} &
& & \verb+#FFF+ & \color{#FFF}{text}\\\\
\hline
\end{array}
$$

### 5、引用标记

`\tag{yourtag}`

```latex
$$
a := x^2-y^3 \tag{\*}\label{\*}
$$
```

$$
a := x^2-y^3 \tag{\*}\label{\*}
$$
