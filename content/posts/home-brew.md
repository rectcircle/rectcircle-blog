---
title: "Home Brew"
date: 2020-09-26T18:23:47+08:00
draft: true
toc: true
comments: true
tags:
  - untagged
---

```bash
cp -R "$(brew --repo)/Library/Taps/homebrew/homebrew-core" ./
cd homebrew
brew unlink openssl
git checkout 86a44a0a552c Formula/python@2.rb
brew reinstall Formula/python@2.rb
```
