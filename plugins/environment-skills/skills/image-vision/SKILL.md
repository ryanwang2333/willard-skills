---
name: image-vision
description: >
  See and understand images when the model has no native vision. Use WHENEVER
  you need to look at, read, describe, OCR, or reason about the contents of an
  image, screenshot, photo, diagram, chart, UI mockup, or scanned page —
  including when the user references a local image file (.jpg/.jpeg/.png/.gif/
  .webp/.bmp/.svg) and you cannot view it yourself. Also triggers on: 看图 /
  识图 / 截图 / 图片内容 / OCR 文字识别 / 这张图是什么 / 分析这张图.
  Also trigger proactively during tasks where image content matters — debugging /
  bug-hunting / troubleshooting from screenshots, UI or mockup review, verifying
  rendered output, reading charts or diagrams: if a relevant image file exists
  (error.png, screenshot*.png, *.png/*.jpg in the workspace or a referenced path),
  call analyze_image / ocr_image yourself without waiting for the user to point
  at the image. Delegates seeing to the mcp-vision MCP tools analyze_image / ocr_image.
---

# Image Vision (MCP 识图)

本环境是纯文本模型(DeepSeek),无法直接接收图片。看图的唯一通道是 MCP 视觉工具
`analyze_image(path, question)` 和 `ocr_image(path)`(由 mcp-vision 提供,后端为硅基流动 Qwen3-VL)。

## 何时使用

- 用户给出图片路径(含 `.jpg` / `.jpeg` / `.png` / `.gif` / `.webp` / `.bmp` / `.svg` 扩展名)要求看图。
- 用户用"看图 / 识图 / 截图 / 图片内容 / OCR / 这张图是什么 / 分析一下"等词提到图片。
- 任务需要图片内容:读截图诊断、分析 UI mockup / 线框图、从图表提取数据、图片与代码对比。

**主动调用 MCP 工具,不要回复"我看不了图片"。**

## 任务驱动触发(主动)

即使用户没明说"看图",当任务本身需要视觉信息时也要主动识图:
- **找 bug / 调试 / 排查报错**:若工作目录或相关路径有截图(`error*.png`、`screenshot*.png`、`*.png` 等),主动用 Glob/find 定位并调用 `analyze_image` 查看,用于对照现象。
- **UI / mockup 分析、验证渲染效果**:主动找设计图/截图,调用 `analyze_image` 或 `ocr_image`。
- **图表 / 架构图**:需要从图片提取数据或理解结构时主动调用。

原则:**需要看图就自己调工具,不要等用户指示,也不要绕过。**

## 标准流程

1. **定位图片**:用户给了路径直接用;没给时用 Glob/find 在工作目录或常见位置
   (`C:\Users\Willard\Pictures`、`Desktop`、`Downloads`、项目目录)找最近/最匹配的图片。
   找不到就明确问用户要路径。

2. **选模式与工具**(工具分流优先级:纯文字提取(报错/日志/文本截图)直接用 `ocr_image`,更快;画面理解(描述/评审/图表/识别)用 `analyze_image`;拿不准时先 `ocr_image` 取文字,仍需要整体理解再 `analyze_image`):
   - `analyze_image(path, question)` — 通用识图,按任务选 question 策略:
     - **describe**:"请用中文详细描述这张图片:主体、场景/背景、颜色风格、可见文字、显著物体、整体构图。"
     - **ui-review**:"以 UI/UX 评审视角分析这个界面:优点、问题、具体改进建议。"
     - **chart-data**:"提取图表中的全部数据:标题、坐标轴标签、各系列数据点/数值(如可读)、趋势总结。"
     - **object-detect**:"列出图中可辨认的所有物体/人物/活动,说明各自是什么及大致位置。"
   - `ocr_image(path)` — 仅提取图中文字(保持结构)。

3. **输出**:按模式组织回答(描述用散文;OCR 保留结构;UI 评审用结构化格式)。

## 粘贴图片的处理

用户粘贴图片时图片无法进入对话(后端拒收)。此时主动说:
"本环境无法直接接收粘贴的图片,请把它保存为文件(如 C:\Users\Willard\Pictures\xx.png),
告诉我路径,我用识图工具读取。"
不要假装看到了图片。

## 失败处理

- 工具报错(路径不对/格式不支持/超 15MB)→ 检查路径、确认图片格式,重试一次。
- 仍失败 → 说明原因,请用户确认图片路径。
- 不要臆造图片内容。
