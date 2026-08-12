---
name: claude-vision-skill
description: >
  See and understand images when the model has no native vision. Use whenever you need to
  read, describe, OCR, or analyze an image — a local file path, a URL, or an image pasted
  into chat with no visible path. Delegates seeing to the bundled vision.js helper
  (SiliconFlow Qwen3.6-35B-A3B). Also triggers on: 识图 / 看图 / 截图 / OCR 文字识别 /
  这张图是什么 / 分析这张图 / 粘贴的图片。The current model (DeepSeek) has no vision —
  never claim you saw an image; always route through vision.js.
---

# Claude Vision Skill(识图)

本环境是纯文本模型(DeepSeek),无法直接接收图片。看图的唯一通道是 `scripts/vision.js`
(调用硅基流动 Qwen3.6-35B-A3B 视觉模型,按量付费)。**不要用 Read 工具读图片,也不要假装看到了图片**——一律经 vision.js 转成文字。

## 何时使用

- 用户给出图片路径(本地 `.jpg/.jpeg/.png/.gif/.webp/.bmp` 或网络 URL)要求看图 / OCR。
- 用户把图片粘贴进对话、但消息里看不到文件路径或 URL(粘贴的图此刻仍在系统剪贴板)。
- 任务本身需要视觉信息:读截图诊断 bug、UI / mockup 评审、从图表提取数据、图片与代码对比。

**主动调用 vision.js,不要回复"我看不了图片",也不要等用户手动存文件。**

## 用法

脚本路径用 `<SKILL_DIR>` 解析——即本 SKILL.md 所在目录,调用前先解析出绝对路径,不要写死。

本地图片:

```bash
node "<SKILL_DIR>/scripts/vision.js" "<图片绝对路径>" "<问题>"
```

网络图片:

```bash
node "<SKILL_DIR>/scripts/vision.js" --url "<图片URL>" "<问题>"
```

粘贴进对话的图片(从系统剪贴板读取):

```bash
node "<SKILL_DIR>/scripts/vision.js" --clipboard "<问题>"
```

Windows 剪贴板经 `clipboard.ps1`(PowerShell)读取,macOS 经 `clipboard.swift`。

## 自动回退(无需手动指定)

- 给了本地路径但文件不存在 → 自动改读系统剪贴板。
- 完全没给路径或 URL → 自动读剪贴板。
- 传 `--no-fallback` 可关闭回退,直接报错。

## 规则

- 一律用绝对路径调用 `vision.js`。
- 描述默认用中文(除非用户要求其他语言)。
- 配置在 `scripts/.env`(`DASHSCOPE_BASE_URL` / `DASHSCOPE_API_KEY` / `VISION_MODEL`),OpenAI 兼容服务均可。**不要把 API key 打印到输出,也不要提交到 git。**
- 调用失败:向用户报告错误,请其检查 key / 模型名 / base URL。
- 输出为空:先重试一次;仍为空说明 `VISION_MAX_TOKENS` 预算被思维链耗尽,在 `scripts/.env` 里调大它(默认 8192,即不设死预算),或改用非 thinking 模型。
