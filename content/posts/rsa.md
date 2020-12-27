---
title: "Rsa模拟实现"
date: 2019-05-11T15:31:05+08:00
draft: false
toc: true
comments: true
tags:
  - 安全
---

> https://github.com/rectcircle/cryptographylearn

```java
package cn.rectcircle.cryptographylearn.rsa;

/**
 * Experiment
 */
public class Experiment {
	private int p; // 素数1
	private int q; // 素数2
	private int N; // p*q
	private int r; // φ(N) = (p-1)*(q-1)
	private int e; // e ⊥ r, 公钥(N, e), 找一个任意e
	private int d; // ed ≡ 1 (mod r), d为e关于r的乘法逆元, 私钥(N, e)

	public Experiment(int p, int q) {
		this.p = p;
		this.q = q;
		this.generateKey();
	}

	private void generateKey() {
		this.N = p * q;
		this.r = (p - 1) * (q - 1);
		// 选择公钥
		for (this.e = 3; Helper.gcd(this.e, r) != 1; this.e++)
			;
		System.out.println(Helper.gcd(r, e));
		// 计算私钥
		// 暴力求解
		// for (int z = 1;; z++) {
		// 	this.d = r * z + 1;
		// 	if (this.d % e == 0) {
		// 		this.d /= e;
		// 		break;
		// 	}
		// }
		// 乘法逆元extgcd法
		this.d = Helper.modReverse(e, r);
	}

	public String getPublicKey() {
		return String.format("public-key: %d, %d", this.N, this.e);
	}

	public String getPrivateKey() {
		return String.format("private-key: %d, %d", this.N, this.d);
	}

	/**
	 * m^e ≡ c (mod N)
	 * @param m 明文
	 * @return c 密文
	 */
	private int encrypt(byte m) {
		return Helper.powerMod(m, e, N);
	}

	public int[] encrypt(byte[] origin) {
		int[] result = new int[origin.length];
		for (int i = 0; i < origin.length; i++) {
			result[i] = this.encrypt(origin[i]);
		}
		return result;
	}

	/**
	 * c^d ≡ m (mod N)
	 *
	 * <p>
	 * 证明： 从<code>m^e ≡ c (mod N)</code>推导出<code>c^d ≡ m (mod N)</code>
	 *
	 * <pre>
	 * m^e ≡ c (mod N)
	 * m^e = c + k0N                (k0∈Z)
	 * c = m^e + k1N                (k1∈Z)
	 * c^d = (m^e + k1N)^d
	 *     = m^ed + k2N             (根据二项式定理展开：形如 (x+y)^n )
	 *     = m^(1+k3r) + k2N        (k3∈Z) (根据条件：ed ≡ 1 (mod r))
	 *     = m * m^(k3r) + k2N
	 *     = m * m^(k3r) + k2N
	 *     = m * ((m^φ(N))^k3) + k2N
	 *     = m * (1+k4N) + k2N      (k4∈Z)(根据费马欧拉定理替换：a^φ(N) ≡ 1 (mod N))
	 *     = m + k5N                (k5∈Z)
	 * 因此显然：c^d ≡ m (mod N)
	 * </pre>
	 * </p>
	 *
	 * @param c 密文
	 * @return m 明文
	 */
	private byte decrypt(int c) {
		return (byte) Helper.powerMod(c, d, N);
	}

	public byte[] decrypt(int[] encryption) {
		byte[] result = new byte[encryption.length];
		for (int i = 0; i < encryption.length; i++) {
			result[i] = this.decrypt(encryption[i]);
		}
		return result;
	}

	@Override
	public String toString() {
		return this.getPublicKey()+ "\n" + this.getPrivateKey();
	}

	public static void main(String[] args) {
		Experiment p = new Experiment(17, 19);
		System.out.println(p);
		byte[] origin = new byte[] { 2 };
		int[] encryption = p.encrypt(origin);
		System.out.println(encryption[0]);
		byte[] result = p.decrypt(encryption);
		System.out.println(result[0]);
		System.out.println(new String(p.decrypt(p.encrypt("abcdefg你好".getBytes()))));

	}
}
```

```java
package cn.rectcircle.cryptographylearn.rsa;

/**
 * Helper
 */
public class Helper {

	/**
	 * <p>欧几里得算法：</p>
	 * gcd(a, b) 表示 a, b的最大公约数; a, b不全为0
	 */
	static int gcd(int a, int b) {
		// gcd(a, b) => if(b=0) a else gcd(b, a%b)
		int r;
		while (b > 0) {
			r = a % b;
			a = b;
			b = r;
		}
		return a;
	}

	/**
	 * <p>
	 * 求解扩展欧几里得方程:
	 * </p>
	 * <p>
	 * gcd(a, b) = ax + by ; a, b不全为0
	 * </p>
	 * <p>
	 * 推导过程：
	 *
	 * <pre>
	 * (1) 终结条件：b=0, gcd（a, b）= a; 显然此时 x=1, y=0;
	 *(2) 递推条件：a>b>0
	 *     ax1 + by1 = gcd(a,b) ①
	 *     bx2 + (a % b)y2 = gcd(b,a % b) ②
	 *     gcd(a,b) = gcd(b,a % b) ③
	 *   整理: ax1 + by1 = bx2 + (a % b)y2
	 *        ax1 + by1 = bx2 + (a - (a/b) * b)y2
	 *        ax1 + by1 = ay2 + bx2 - (a/b)*b)y2
	 *        ax1 + by1 = ay2 + b(x2 - (a/b))y2
	 *   解得: x1 = y2, y1 = x2 - (a/b)y2 [递推公式]
	 *   说明: 以上 / 和 % 表示整除和求余
	 * </pre>
	 * </p>
	 * @return [gcd(a, b), x, y]
	 */
	static int[] extgcd(int a, int b) {
		if (a == 0 && b == 0)
			throw new IllegalArgumentException("a, b 能全为0");
		int x, y;
		if(b==0){
			x=1;
			y=0;
			return new int[]{a, x, y};
		}
		int[] result = extgcd(b, a%b);
		x = result[2];
		y = result[1] - (a / b) * result[2];
		result[1] = x;
		result[2] = y;
		return result;
	}

	/**
	 * <p>
	 * 求乘法逆元：ax ≡ 1 (mod b), a⊥b, 求 x 的最小正整数解值
	 * <pre>
	 *   ax ≡ 1 (mod b)
	 *(ax - 1) / b = y
	 *ax - 1 = by
	 *ax - by = 1
	 *即: ax + by = gcd(a, b)
	 *通过扩展gcd可以求出x0, 则 x = x0 + k*b/gcd(a, b) k∈Z
	 * </pre>
	 * <p>
	 *
	 * @see http://www.cnblogs.com/rir1715/p/7745110.html
	 */
	static int modReverse(int a, int b) {
		int result[] = extgcd(a, b);
		return (result[1] % b + b) % b;
	}

	/**
	 * 快速幂取模算法：
	 * <p>
	 * 公式如下：
	 * <pre>
	 * a^b % c = ((a^2)^(b/2) % c) b是偶数
	 * a^b % c = (a*(a^2)^(b/2) % c) b是计数
	 * </pre>
	 * </p>
	 */
	static int powerMod(int a, int b, int c) {
		int ans = 1;
		a = a % c;
		while (b > 0) {
			if ((b & 1) == 1) {
				ans = (ans * a) % c;
			}
			b >>= 1;
			a = (a * a) % c;
		}
		return ans;
	}
}
```

## 一些说明

### 非对称加密必须满足的条件

- 基本元素
    - 两把钥匙
    - 明文文和密文
- 使用一把钥匙进行加密即可获得密文，另一把钥匙进行解密即可获得明文
- 使用一把钥匙进行加密即可获得密文，在不得知另一把钥匙的情况下
    - 无法获取明文
    - 无法在常数时间内暴力破解到另一把钥匙，进而获取明文

### 非对称加密算法的一个误解（RSA）

- RSA，在数学原理上，没有公钥和私钥的区别；理论上，所谓的公钥私钥完全可以互换位置；公私钥表述的是在加密过程中所处位置的区别；[即对等性](https://v2ex.com/t/542814#r_6999643)

### 加密解密过程

一对、两把钥匙，分别为持有在A，B设备上，为钥匙1，钥匙2

- 加密：A 设备使用 钥匙1 + 明文 -> 密文
- 传输的数据：密文
- 解密：B 设备使用 钥匙2 + 密文 -> 明文' 可以保证 明文' = 明文

在一般场景下：

- 钥匙1 为 设备B 的公钥
- 钥匙2 为 设备B 的私钥

### 签名验签过程

一对、两把钥匙，分别为持有在A，B设备上，为钥匙3，钥匙4

- 签名：A 设备使用 钥匙3 + 明文 -> 密文
- 传输的数据：密文和明文
- 验签：B 设备使用 钥匙4 + 密文 -> 明文'，并验证 明文' ?= 明文

在一般场景下：

- 钥匙3 为 设备A 的私钥
- 钥匙4 为 设备A 的公钥
