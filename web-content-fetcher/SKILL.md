---
name: web-content-fetcher
description: >
  Extract article content from any URL as clean Markdown.
  Uses Scrapling script (with auto fast→stealth fallback).
  Preserves headings, links, images, lists, and code blocks.
  Use this skill whenever the user wants to fetch, read, extract, scrape, or summarize
  content from a URL — including blog posts, news articles, WeChat articles (微信公众号),
  documentation pages, or any web page. Also trigger when the user says things like
  "帮我读一下这篇文章", "抓取这个网页", "提取正文", or "read this page for me".
---

# Web Content Fetcher

Given a URL, return its main content as clean Markdown — headings, links, images, lists, code blocks all preserved.

## Extraction Strategy

Always try **one method per URL** — don't cascade blindly. Pick the right one upfront.

```
URL
 │
 └─ Scrapling script (fetch.py)
       Run fetch.py — check the domain routing table to decide fast vs --stealth.
       Works for most sites. Returns clean Markdown directly.
       (Jina Reader fallback removed: r.jina.ai unreachable on this machine.)
```

### Scrapling script

```bash
python3 <SKILL_DIR>/scripts/fetch.py "<url>" [max_chars] [--stealth]
```

`<SKILL_DIR>` is the directory where this SKILL.md lives. Resolve it before calling the script.

The script has two modes built in:
- **Default (fast):** HTTP fetch, ~1-3s, works for most sites
- **`--stealth`:** Headless browser, ~5-15s, for JS-rendered or anti-scraping sites

When run without `--stealth`, the script automatically falls back to stealth if the fast result has too little content. So you rarely need to specify `--stealth` manually — the only reason to force it is when you already know the site needs it (see routing table), which saves the initial fast attempt.

## Domain Routing

Use this table to pick the right mode on the first call:

| Domain | Command | Why |
|--------|---------|-----|
| `mp.weixin.qq.com` | `fetch.py <url> --stealth` | JS-rendered content |
| `zhuanlan.zhihu.com` | `fetch.py <url> --stealth` | Anti-scraping + JS |
| `juejin.cn` | `fetch.py <url> --stealth` | JS-rendered SPA |
| `sspai.com` | `fetch.py <url>` | Static HTML |
| `blog.csdn.net` | `fetch.py <url>` | Static HTML |
| `ruanyifeng.com` | `fetch.py <url>` | Static blog |
| `openai.com` | `fetch.py <url>` | Static HTML |
| `blog.google` | `fetch.py <url>` | Static HTML |
| Everything else | `fetch.py <url>` | Auto-fallback handles it |

> 本机适配:stealth 用系统 Edge(不执行被禁的 playwright chromium),自动经系统代理
> 127.0.0.1:7890 访问被墙站;fast 模式直连优先、失败自动转代理。无需手动传代理。

## Script Options

```bash
# Basic — auto-selects fast or stealth
python3 <SKILL_DIR>/scripts/fetch.py "https://sspai.com/post/73145"

# Force stealth for known JS-heavy sites
python3 <SKILL_DIR>/scripts/fetch.py "https://mp.weixin.qq.com/s/xxx" --stealth

# 强制直连,不走本机系统代理 127.0.0.1:7890
python3 <SKILL_DIR>/scripts/fetch.py "https://sspai.com/post/73145" --no-proxy

# Limit output to 15000 characters (default: 30000)
python3 <SKILL_DIR>/scripts/fetch.py "https://example.com/article" 15000

# JSON output with metadata (url, mode, selector, content_length)
python3 <SKILL_DIR>/scripts/fetch.py "https://example.com" --json
```

## 本机浏览器环境(Windows)
- 无头浏览器一律用系统 Edge:stealth 模式已内置 `executable_path` 指向
  `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,不要改用或执行
  ms-playwright 的 chromium(本机安全策略禁止,launch 报 spawn UNKNOWN)。
- 代理策略:fast 直连优先、失败自动转系统代理 127.0.0.1:7890;stealth 走 Edge 系统代理。
  强制直连用 `--no-proxy`。
- 输出已固定 UTF-8(脚本内 reconfigure),中文不乱码。

## Install Dependencies

First use only — the script checks and tells you if anything is missing:

```bash
pip install scrapling html2text
```

If on system-managed Python (macOS/Linux), add `--break-system-packages` or use a venv.

## Failure Rules

- Same URL fails once → give up, tell the user "unable to extract content from this URL"
- Do not retry — each failed call wastes context tokens
