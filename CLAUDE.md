# skills-repo

本仓库是 skills 的唯一事实源。改 skill 只改这里，提交推送后两侧插件市场各自更新。

## 1. 写 skill
- 判断归属：环境绑定进 `environment-skills/skills/`，通用进 `general-skills/skills/`，游戏开发进 `phaser-skills/skills/`（Phaser 4 官方镜像）或 `game-design-skills/skills/`（设计通识/素材）。
- 一个 skill 一个目录，核心是 `SKILL.md`；frontmatter 的 `description` 写清触发场景与触发词。
- 加载带插件前缀：`<插件名>:<skill名>`，如 `general-skills:research`。

## 2. 发布流程
发布靠插件版本号驱动，每改必动：
1. 编辑 `plugins/<插件名>/.claude-plugin/plugin.json`，`version` 升一位（如 1.0.1 → 1.0.2）。版本不动，两侧缓存判定为已最新，不会重新拉取。
2. 提交推送：
```
git -C ~/.claude/skills-repo add .
git -C ~/.claude/skills-repo commit -m "改动描述"
git -C ~/.claude/skills-repo push
```
3. 同步本机镜像（本机嵌入式 Claude Code 的 `/plugin marketplace update` 不执行 git fetch，发布后必须手动对齐镜像，否则看不到新版本）：
```
python ~/.claude/skills-repo/scripts/sync-marketplace.py
```
4. 更新两侧：cowork 端 Customize → Plugins 点「更新」；code 端 `/plugin marketplace update`（先跑完第 3 步，update 才能读到新版本），然后重启 Claude Code。