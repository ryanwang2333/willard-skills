#!/usr/bin/env python3
"""发布后同步本机 marketplace 镜像到远程最新。

背景: 本机嵌入式 Claude Code 的 /plugin marketplace update 不执行 git fetch,
镜像(known_marketplaces.json 里的 installLocation)会停在旧 commit, 导致远程
新版本不可见。此脚本手动 fetch + reset 对齐, 让 update 能读到新版本。

用法:
  python sync-marketplace.py                    # 同步所有 git 源 marketplace
  python sync-marketplace.py willard-skills     # 只同步指定的 marketplace
"""
import json
import os
import subprocess
import sys

# Windows 终端默认 GBK, 强制 UTF-8 输出, 避免中文乱码
if sys.stdout and sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

KNOWN = os.path.expanduser("~/.claude/plugins/known_marketplaces.json")


def load():
    with open(KNOWN, encoding="utf-8") as f:
        return json.load(f)


def sync(name, path):
    if not os.path.isdir(os.path.join(path, ".git")):
        print(f"跳过 {name}: 不是 git 镜像目录 {path}")
        return False
    print(f"==> 同步 marketplace: {name} ({path})")
    subprocess.run(["git", "-C", path, "fetch", "origin", "main"], check=True)
    subprocess.run(["git", "-C", path, "reset", "--hard", "origin/main"], check=True)
    head = subprocess.run(
        ["git", "-C", path, "log", "--oneline", "-1"],
        capture_output=True, text=True, encoding="utf-8", errors="replace", check=True,
    )
    print(f"    已对齐到: {head.stdout.strip()}")
    return True


def main():
    markets = load()
    targets = sys.argv[1:] or [
        n for n, m in markets.items() if m.get("source", {}).get("source") == "git"
    ]
    done = 0
    for name in targets:
        m = markets.get(name)
        if not m:
            print(f"跳过 {name}: 不在 known_marketplaces.json")
            continue
        if sync(name, m["installLocation"]):
            done += 1
    print(f"\n同步完成 ({done} 个)。之后在 Claude Code 执行 /plugin marketplace update 并重启生效。")


if __name__ == "__main__":
    main()
