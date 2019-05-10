---
title: zsc第四届新生赛题解
date: 2016-12-18T22:55:21+08:00
draft: false
toc: true
comments: true
aliases:
  - /detail/33
  - /detail/33/
tags:
  - acm
---

## A题

[原题链接](http://acm.two.moe:808/JudgeOnline/problem.php?id=1578)

不解释

### 代码：

```cpp
#include <cstdio>
#include <algorithm>

using namespace std;

int main() {
#ifdef CDZSC_OFFLINE
	freopen("in.txt", "r", stdin);
#endif //CDZSC_OFFLINE

	int t;
	scanf("%d", &t);
	int a[3];
	while (t--) {
		scanf("%d%d%d", a + 0, a + 1, a + 2);
		sort(a, a + 3);
		printf("%d\n",a[1]);
	}

	return 0;
}
```

## B题

[原题链接](http://acm.two.moe:808/JudgeOnline/problem.php?id=1579)

### 题意：

给出一个区间，问这个区间有多少个不含4的数？

### 代码：

```cpp
#include <cstdio>
#include <cstring>

using namespace std;


bool judge(int n){
	while(n){
		if(n%10==4){
			return false;
		}
		n /= 10;
	}
	return true;
}

int main(){
#ifdef CDZSC_OFFLINE
	freopen("b.in","r",stdin);
	freopen("b.out","w",stdout);
#endif //CDZSC_OFFLINE
	int t ;
	scanf("%d",&t);
	int L,R;

	while(t--){
		int sum = 0;
		scanf("%d%d",&L,&R);
		for(int i=L; i<=R; i++){
			if(judge(i)){
				sum++;
			}
		}
		printf("%d\n",sum);
	}


	return 0;
}
```

## C题

[原题链接](http://acm.two.moe:808/JudgeOnline/problem.php?id=1580)

### 题意：

略

### 题解：

比较麻烦。。。

```cpp
if(d==1){
	//转化为分钟判断
} else {
	//判断第1天，几次
	//判断第d天，几次
	// += d-2
}
```

### 代码：

```cpp
#include <cstdio>

using namespace std;

int main() {
#ifdef CDZSC_OFFLINE
	freopen("in.txt", "r", stdin);
#endif //CDZSC_OFFLINE

	int t;
	scanf("%d", &t);

	int sh, sm, eh, em;
	int d;

	while (t--)
	{
		scanf("%d:%d %d %d:%d", &sh, &sm, &d, &eh, &em);
		int ans = 0;
		int s = sh * 60 + sm;
		int e = eh * 60 + em;
		if (d == 1) {

			if (s <= 5 * 60) {
				if (e>=18*60) {
					ans += 2;
				}
				else if (e >= 5 * 60) {
					ans++;
				}
			} else if (s <= 18 * 60) {
				if (e >= 18 * 60) {
					ans += 1;
				}
			}

		} else {
			if (s <= 5 * 60) {
				ans += 2;
			} else if (s <= 18 * 60) {
				ans += 1;
			}

			if (e >= 18 * 60) {
				ans += 2;
			} else if (e >= 5 * 60) {
				ans += 1;
			}
			ans += 2 * (d-2);
		}
		printf("%d\n", ans);
	}

	return 0;
}
```

## D题

[原题链接](http://acm.two.moe:808/JudgeOnline/problem.php?id=1581)

### 题意：

略

### 题解：

### 代码：

```cpp
//斯巴鲁买水果标程
#pragma comment(linker, "/STACK:102400000,102400000")
#include <cstdio>
#include <string>
#include <iostream>
#include <cstring>
#include <cctype>
#include <algorithm>
#include <functional>
#include <cstdlib>
#include <list>
#include <utility>
#include <vector>
#include <bitset>
#include <queue>
#include <cmath>
#include <set>
using namespace std;

typedef long long LL;
typedef pair<int, int> pii;
typedef pair<int, double> pid;
typedef pair<double, int> pdi;

const int inf = 0x3f3f3f3f;
const int maxn = 100 + 10;
const double eps = 1e-8;
int t, n;
pii a[maxn];

int Solve() {
    int ans = 0;
    for (int i = 0; i < n; ++i) {
        if (a[i].first % 50 == 0) {
            ans = max(ans, a[i].second);
        }
        for (int j = i + 1; j < n; ++j) {
            if ((a[i].first + a[j].first) % 50 == 0) {
                ans = max(ans, a[i].second + a[j].second);
            }
            for (int k = j + 1; k < n; ++k) {
                if ((a[i].first + a[j].first + a[k].first) % 50 == 0) {
                    ans = max(ans, a[i].second + a[j].second + a[k].second);
                }
            }
        }
    }
    return ans;
}

int main() {
    scanf("%d", &t);
    while (t--) {
        scanf("%d", &n);
        for (int i = 0; i < n; ++i) {
            double n1;
            scanf("%lf%d", &n1, &a[i].second);
            a[i].first = n1 * 10;
        }
        printf("%d\n", Solve());
    }
    return 0;
}
```

## E题

[原题链接](http://acm.two.moe:808/JudgeOnline/problem.php?id=1582)

### 题意：

求聚关灯的的摆放情况

### 题解：

* 水平方向判断一次，对每一行记录首尾的坐标，和这一行的人数，据此计算这一行的方案
* 垂直方向判断一次，类似水平处理

### 代码：

```cpp
#include <cstdio>
#include <cstring>
#include <algorithm>
#include <vector>

using namespace std;

const int MAXN = 1010;

int rowSum[MAXN], colSum[MAXN]; //行列人数统计
int rowSE[MAXN][2]; //行的开始和结束的人的位置
int colSE[MAXN][2]; //列的开始和结束的人的位置


void init(){
    memset(rowSum, 0, sizeof rowSum);
    memset(colSum, 0, sizeof colSum);
    memset(rowSE, 0, sizeof rowSE);
    memset(colSE, 0, sizeof colSE);

}

int solve(int se[][2], int sum[], int len, int size){
    int ans = 0;
    for(int i=0; i<size; i++){
        if(sum[i]==1){
            ans += (len-1);
        } else if(sum[i] > 1) {
            ans += (len - (se[i][1]-se[i][0]+1)) + 2 * (se[i][1] - se[i][0]+1-sum[i]);
        }
    }
    return ans;
}

int main(){
#ifdef CDZSC_OFFLINE
    freopen("in.txt","r",stdin);
#endif //CDZSC_OFFLINE

    int t, n, m, v;
    scanf("%d",&t);
    while (t--) {

        init();

        scanf("%d%d",&n, &m);
        for(int i=0; i<n; i++){
            for(int j=0; j<m; j++){
                scanf("%d",&v);
                if(v==1){
                    rowSum[i] += v; //更新行人数
                    if(rowSum[i] == 1){ //更新行的第一个人
                        rowSE[i][0] = j;
                    } else if(rowSum[i] > 1){
                        rowSE[i][1] = j;
                    }

                    colSum[j]+= v; //更新列人数
                    if(colSum[j] == 1){ //更新列的第一个人
                        colSE[j][0] = i;
                    } else if(colSum[j] > 1){
                        colSE[j][1] = i;
                    }
                }
            }
        }

        printf("%d\n",solve(rowSE,rowSum,m,n)+solve(colSE,colSum,n,m));
    }

    return 0;
}
```

## F题

[原题链接](http://acm.two.moe:808/JudgeOnline/problem.php?id=1583)

### 题意：

给出一个ip地址和一个简写方式的掩码，问网络号和主机号是多少

### 题解：

观察原题实例

```
3.128.255.255/25->00000011.10000000.11111111.11111111
                  00000011.10000000.11111111.10000000 ->3.128.255.128 这就是网络号
                  00000000.00000000.00000000.01111111 -> 0.0.0.127 这就是主机号
```

可以知道本题主要考察十进制和二进制相互转换，按照这个过程，完成程序即可通过

#### 处理方式：

以样例来看

1. `25/8 = 3` 所以网络号的前三位等于ip地址的前三位为：3.128.255.x
2. `25%8 = 1` 所以第四位为 `10000000(二进制) &(与运算) 11111111(二进制) = 10000000(二进制) = 128(十进制)`
3. 所以子网号为`3.128.255.128`
4. 观察易知：`主机号 = ip(点分十进制的各位) - 网络号(点分十进制) = (3-3).(128-128).(255-255).(255-128) = 0.0.0.127`

### 代码：

```cpp
#include <cstdio>
#include <cstring>

using namespace std;

int ip[4],n; //ip[]存放ip地址“点分十进制的”4个数字，n为掩码
int netIp[4]; //存放网络号
int hostIp[4]; //存放主机号

int calculate(int a, int n){
    int mask = 0;
    for(int i=0; i<n; i++){ //通过位运算计算掩码的的二进制形式
        mask = mask | (1<<(7-i));
    }
    return a & mask; //得出结果
}

void out(int a[]){
    printf("%d.%d.%d.%d",a[0],a[1],a[2],a[3]);
}

void solve(){
    memset(netIp, 0, sizeof netIp); //初始化网络号为0

    int s,e;
    for(int i=0; i<n; i++){ //对ip（点分十进制）的每一位（共四个数执行），计算网络号
        s = i*8+1;
        e = (i+1)*8;
        if(n>=e){ //如果当前的数对应的掩码的二进制全为1
            netIp[i] = ip[i];
        } else if(n<s) { //如果当前的数对应的掩码的二进制全为0
            netIp[i] = 0;
        } else { //不全为0也不全为1
            netIp[i] = calculate(ip[i],n-s+1);
        }
    }

    for(int i = 0; i<4; i++){ //直接获得主机号
        hostIp[i] = ip[i] - netIp[i];
    }

    out(netIp); //输出
    printf(" ");
    out(hostIp);
    printf("\n");


}

int main(){
#ifdef CDZSC_OFFLINE
    freopen("f.in","r",stdin);
    freopen("f.out","w",stdout);
#endif //CDZSC_OFFLINE
    int t ;
    scanf("%d",&t);

    while(t--){
        scanf("%d.%d.%d.%d/%d",ip+0,ip+1, ip+2,ip+3,&n);
        solve();
    }

    return 0;
}
```

## G题

[原题链接](http://acm.two.moe:808/JudgeOnline/problem.php?id=1584)

### 题意：

略

### 题解：

枚举第一个位置是否有地雷，由此递推到最后。在判断是否可行并输出

### 代码：

```cpp
//G艾米莉亚爱扫雷标程
//只要确定了第一个是否有地雷就可以推算出后面是否有地雷
//（要么为0，要么为1，如果不是这两个值就说明这个方案行不通），
//如果两种可能中有一种成功，只需要计算包含有多少个1和多少个0，
//如果两种可能都成功了，都为1的才是有雷，都为0的才是没有地雷。
#include <iostream>
#include <cstring>
#include <string>
#include <algorithm>
#include <cstdio>
#include <vector>
#include <queue>
#include <cmath>

using namespace std;

const int MAXN = 100010;

int f[MAXN];
int x[MAXN];

void out(int m, int n) {
	printf("%d", m);
	for (int i = 1;i <= n; i++) {
		if (x[i] == 1) {
			printf(" %d", i);
		}
	}
	printf("\n%d", n-m);
	for (int i = 1;i <= n; i++) {
		if (x[i] == 0) {
			printf(" %d", i);
		}
	}
	printf("\n");
}

int judge(int n) { //返回存在地雷的数目
	//n==1
	if (n == 1) {
		return x[1] == f[1] ? x[1] : -1;
	}
	//n>1
	int sum = x[1];
	for (int i = 2; i < n; i++) {
		x[i] = f[i - 1] - x[i - 1] - x[i - 2];
		if (x[i] != 1 && x[i] != 0) {
			return -1;
		}
			sum+= x[i];
	}
	x[n] = f[n] - x[n - 1];
	if (x[n] == 1 || x[n]==0) {
		return sum + x[n];
	} else {
		return -1;
	}
}

void solve(int n) {
	memset(x, 0, sizeof x);
	x[1] = 0;
	int m;
	if ((m = judge(n))!=-1) {
		out(m, n);
		return;
	}

	memset(x, 0, sizeof x);
	x[1] = 1;
	if ((m = judge(n)) != -1) {
		out(m, n);
		return;
	}

}

int main() {
#ifdef CDZSC_OFFLINE
	freopen("in.txt", "r", stdin);
#endif //CDZSC_OFFLINE

	int t;
	scanf("%d", &t);
	int n;

	while (t--) {
		scanf("%d", &n);
		for (int i = 1; i <= n; i++) {
			scanf("%d",f+i);
		}

		solve(n);
	}

	return 0;
}
```

## H题

[原题连接](http://acm.two.moe:808/JudgeOnline/problem.php?id=1585)

### 题意：

略

### 题解：

找到距离白王最近的八个方向的棋子的类型，在判断一下是否可以将军

### 代码：

```cpp
#include <cstring>
#include <cstdio>
#include <cmath>

using namespace std;

const int MAXN = 100010;

int x0, y00; //白王的坐标

struct node
{
	char c;
	int x, y;
};

node a[3][3]; //存放距离白王最近的八个方向棋子状态

int get1(int x) {
	if (x == 0) {
		return 0;
	} else {
		if (x > 0) {
			return 1;
		} else {
			return -1;
		}
	}
}

void add(char c, int dx, int dy) {
	int i, j;
	i = get1(dx);
	j = get1(dy);
	i++;
	j++;

	if (dx == 0 || dy == 0 || abs(dx) == abs(dy)) {
		if (a[i][j].c == 0) {
			a[i][j].c = c;
			a[i][j].x = dx;
			a[i][j].y = dy;
		} else if (abs(a[i][j].x) >= abs(dx) || abs(a[i][j].y) >= abs(dy)) {
			a[i][j].c = c;
			a[i][j].x = dx;
			a[i][j].y = dy;
		}
	}

}

bool judge() {
	for (int i = 0; i < 3; i++) {
		for (int j = 0; j < 3; j++) {
			if (a[i][j].c != 0) {
				int ii=i-1, jj=j-1;
				if (abs(ii) == abs(jj)) {
					if (a[i][j].c == 'B' || a[i][j].c == 'Q') {
						return true;
					}
				} else {
					if (a[i][j].c == 'R' || a[i][j].c == 'Q') {
						return true;
					}
				}
			}
		}
	}
	return false;
}

int main() {
#ifdef CDZSC_OFFLINE
	freopen("in.txt", "r", stdin);
#endif //CDZSC_OFFLINE

	int t;
	scanf("%d", &t);
	int n;

	char s[4];
	int x1, y1;

	while (t--) {
		memset(a, 0, sizeof a);
		scanf("%d", &n);
		scanf("%d%d", &x0, &y00);
		for (int i = 0; i < n; i++) {
			scanf("%s%d%d", s, &x1, &y1);
			add(s[0], x1 - x0, y1 - y00);
		}

		if (judge()) {
			printf("YES\n");
		} else {
			printf("NO\n");
		}
	}

	return 0;
}
```

## 声明

* 本套试题版权归作者所有
* A、H题作者刘穗*
* B、F题作者Rectcircle
* C、E题作者DID
* D、G题作者night_13
* A、B、C、E、F、G、H题源码作者Rectcircle
* C题源码作者night_13
