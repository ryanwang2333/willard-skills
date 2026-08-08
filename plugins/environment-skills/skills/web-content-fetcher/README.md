<div align="center">

# Web Content Fetcher

**网页正文提取 · 返回干净 Markdown · 支持微信公众号**

</div>

---

## 简介

Web Content Fetcher 把任意网页 URL 转成干净的 Markdown（保留标题、链接、图片、列表、代码块），
基于 Scrapling 实现，内置 fast / stealth 双模式自动降级。

**核心优势：**
- Scrapling fast（HTTP，~1-3s）优先，内容过少时自动降级 stealth（无头浏览器，~5-15s）
- 支持微信公众号、掘金、CSDN 等国内平台
- 返回标准 Markdown，便于后续处理
- 本仓库版本已做 Windows 本机适配（见下文"本机适配"）

## 安装

```bash
pip install scrapling html2text
```

> 在系统管理的 Python (macOS/Linux) 上，加 `--break-system-packages` 或使用 venv。

## 使用方式

### 在 Claude Code 中

直接告诉 AI 要读取的 URL，会自动选择最佳方案：

```
帮我读取这篇文章：https://mp.weixin.qq.com/s/EwVItQH4JUsONqv_Fmi4wQ
Extract the content from https://openai.com/blog/gpt-4o
```

### 命令行单独使用

```bash
# 基础用法（自动选择 fast 或 stealth 模式）
python3 scripts/fetch.py https://sspai.com/post/73145

# 强制 stealth 模式（用于 JS 渲染页面）
python3 scripts/fetch.py https://mp.weixin.qq.com/s/xxx --stealth

# 强制直连，不走本机系统代理
python3 scripts/fetch.py https://sspai.com/post/73145 --no-proxy

# 限制输出字符数（默认 30000）
python3 scripts/fetch.py https://example.com/article 15000

# JSON 输出（含 url, mode, selector, content_length）
python3 scripts/fetch.py https://example.com --json
```

## 提取策略

```
URL 输入
    │
    ▼
┌─────────────────────────────────────┐
│  Scrapling（fetch.py）               │
│     · fast 模式：~1-3s，大部分网站   │
│     · stealth 模式：~5-15s，JS 渲染  │
│     · 内容太少时自动 fast → stealth   │
└─────────────────────────────────────┘
```

### 域名路由

| 域名 | 模式 | 说明 |
|------|------|------|
| `mp.weixin.qq.com` | `--stealth` | JS 渲染内容 |
| `zhuanlan.zhihu.com` | `--stealth` | 反爬 + JS |
| `juejin.cn` | `--stealth` | JS 渲染 SPA |
| `sspai.com` | fast | 静态 HTML |
| `blog.csdn.net` | fast | 静态 HTML |
| `ruanyifeng.com` | fast | 静态博客 |
| `openai.com` | fast | 静态 HTML |
| `blog.google` | fast | 静态 HTML |
| 其他 | fast | 自动降级 |

### 支持平台

| 平台 | 模式 | 说明 |
|------|------|------|
| 微信公众号 (mp.weixin.qq.com) | stealth | JS 渲染 |
| 掘金 (juejin.cn) | stealth (auto) | 自动降级 |
| CSDN (blog.csdn.net) | fast | 正文提取 |
| 少数派 (sspai.com) | fast | article 选择器 |
| 知乎 (zhihu.com) | stealth | 需有效 URL |
| OpenAI Blog | fast | article 选择器 |
| Google Blog | fast | article 选择器 |
| arXiv | fast | 标题/作者/摘要 |
| MDN Web Docs | fast | main 选择器 |
| 阮一峰博客 | fast | 静态页 |

## 输出格式

返回标准 Markdown，自动保留：

- **标题层级**：`# ## ###`
- **超链接**：`[文字](url)`
- **图片**：`![alt](url)`（data-src 懒加载自动处理）
- **列表、代码块、引用块**

## 本机适配（Windows）

本仓库版本针对本机（企业 Windows）做了适配，细节见 `SKILL.md`：

- 无头浏览器一律用系统 Edge（`executable_path` 指向 msedge.exe），不执行被禁的 playwright chromium
- fast 模式直连优先、失败自动转系统代理 127.0.0.1:7890；stealth 走 Edge 系统代理
- 输出固定 UTF-8，中文不乱码

---

*改编自 [shirenchuang/web-content-fetcher](https://github.com/shirenchuang/web-content-fetcher)（MIT），做了本机化改造。*
