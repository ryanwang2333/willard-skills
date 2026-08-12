---
name: see-image
description: >
  看图 / 识图 / 描述图片。模型无视觉，处理一切需要读取图片的任务——本地图片路径、
  网络图片 URL、粘贴进对话的截图。触发词：识图 / 看图 / 描述图片 / 图片里是什么 /
  这张图是什么 / 截图 / OCR / 读取图片 / 分析这张图。优先调用 MCP server vision 的
  see_image / see_clipboard 工具，不要假装看到了图片。
---

# 看图片（MCP 版）

本环境模型无视觉，看图的正确通道是 MCP server `vision` 的工具（底层调硅基流动的千问视觉模型）。
**不要用 Read 工具读图片文件，也不要假装看到了图片**——一律经 MCP 工具转成文字。

## 何时使用

- 用户给出图片路径（本地 `.jpg/.jpeg/.png/.gif/.webp/.bmp` 或 `http(s)://` URL）要求描述 / OCR / 分析。
- 任务运行中产生截图、需要读取其内容：读 bug 截图诊断、评审 UI / mockup、从图表提取数据。
- 用户把图片粘贴进对话但消息里没有路径：用 `see_clipboard` 读系统剪贴板。

## 调用方式

工具名（在 Claude Code 中以 `mcp__vision__` 前缀暴露）：

- `mcp__vision__see_image` — 按路径或 URL 识图
- `mcp__vision__see_clipboard` — 读取系统剪贴板中的图片（图片对象或刚复制的图片文件）识图

### see_image 参数

| 参数 | 必填 | 说明 |
|---|---|---|
| `image` | 是 | 本地文件**绝对路径**（Windows 例：`D:\folder\a.png`）或 `http(s)://` 开头的网络图片链接 |
| `prompt` | 否 | 要问图片的问题，如 `"图里有什么文字？"` `"画面主体是什么？"`；省略则默认详细描述整张图 |

### 示例

```
mcp__vision__see_image(image="D:\screenshots\bug.png", prompt="这段报错是什么问题？")
mcp__vision__see_image(image="https://example.com/art.png")
mcp__vision__see_clipboard(prompt="描述这张图")
```

## 规则

- 一律传图片的**绝对路径**，不要传相对路径。
- 描述默认用中文（除非用户要求其他语言）。
- 若工具返回 isError 或文本以"识图失败"开头，如实向用户报告错误内容（通常是文件不存在 / API 配置问题），不要编造图片内容。
- 若 MCP server `vision` 未连接（工具不可用），退而用命令行脚本兜底：
  `node "C:\Users\Willard\.claude\mcp\vision-mcp\vision-cli.cjs" "<图片绝对路径>" "<问题>"`（也支持 `--url` 和 `--clipboard`）
