---
name: "worldbook"
description: "管理 SillyTavern 世界书(worldbook JSON)：查看/搜索/增删改条目、批量处理、质量审查(泛词/废话/格式)、蓝灯常驻与绿灯触发配置、导入导出与备份。用户提到「世界书/条目/触发词/蓝灯/绿灯/写卡/设定管理/兰斯世界观」时使用。"
---

# 世界书管理（Claude Code 版）

用 Claude Code 直接管理 SillyTavern 标准世界书：能读写 JSON 文件、批量处理全部条目、做质量审查、验证格式、导出备份，不受任何单文件工具的权限限制。

`<SKILL_DIR>` = 本 skill 所在目录（含 wb.js 引擎脚本），下同。

## 文件与约定

- 世界书是标准 ST 格式 JSON：`{name, description, scan_depth, token_budget, entries: {uid: {...}}}`
- **默认世界书**：`C:\Users\Willard\Desktop\Project\兰斯世界书\兰斯系列世界观.json`
- 处理其他世界书时路径由用户指定，本技能通用
- 配套引擎：`<SKILL_DIR>/wb.js`（node 运行）
- 兰斯专用辅助脚本（在 `C:\Users\Willard\Desktop\Project\兰斯世界书\` 下）：
  - `build-rance-worldbook.js`：`兰斯系列世界观.md` → 原始 JSON
  - `optimize-worldbook.js`：按秋青子方法论优化 JSON（内容减法/关键词清洗/标签包裹/蓝绿灯配置）
- 秋青子预设已归档到 `C:\Users\Willard\Documents\SillyTavern-Workflow\presets\qiuqingzi\`（兰斯研究资料在 `research\rance\`，分析报告在 `docs\`）

## 条目字段（ST 标准）

| 字段 | 含义 |
|---|---|
| uid | 条目 ID，如 "001" |
| keys | 触发关键词数组（全名/简称/地名；避免单字与高频泛词） |
| content | 正文 |
| comment | 条目标题/备注 |
| constant | true=蓝灯常驻；false=绿灯关键词触发 |
| position | 注入位置（ST: 1=角色定义前，2=角色定义后） |
| depth | 触发深度，默认 4 |
| order | 注入顺序，越小越靠前 |
| probability / useProbability / 其余 | 保持默认即可 |

## 常用流程

1. **看结构**：`node <SKILL_DIR>/wb.js stats <file>`、`node <SKILL_DIR>/wb.js list <file>`
2. **查内容**：`show <file> <uid或关键词>`、`search <file> <词>`
3. **改**：`edit <file> <uid> --field 值`（`--keys "a,b"`、`--content ...`、`--constant true`、`--position 1`、`--order ...`）；新增 `add <file> --uid --comment --keys --content ...`；删除 `delete <file> <uid>`
4. **审查**：先跑 `audit <file>` 看客观问题（单字泛词/空 keys/重复词/无标签），再亲自读内容做语义审查（见方法论）
5. **验证**：改完跑 `validate <file>` 确认 ST 格式合法
6. **备份**：批量改动前先 `backup <file>` 或 git commit

## 秋青子方法论（写/改条目的标准）

- **绝对零度**：只写客观事实，不写评价（写"有三个国家"，不写"强大的国家"）
- **白描**：去形容词堆砌、八股化描写、情绪化修饰
- **特征差异化**：只写模型不知道的、偏离默认认知的；模型已知的常识不写（如"日本是岛国"）
- **标签包裹**：世界观条目内容用 `<世界观_idN>` 包裹（id1=总纲、id2=背景设定、id3=势力详情），人物速览用 `<角色速览_id0>`——与秋青子预设「📋 标签规范」一致
- **关键词规范**：全名+简称+地名；多个词用数组分开；避免单字（"神""鬼"）与跨条目高频泛词（"人类""魔法"）

## 约束

- 改文件前先读原内容；批量改动前先备份
- 保持 ST JSON 合法，改完跑 validate
- 用中文交流；批量操作前先给用户看计划
- 兰斯世界书是秋青子方法论的成品，改动时保持方法论一致性
