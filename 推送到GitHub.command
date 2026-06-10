#!/bin/bash
# 双击此文件即可把 YiminScope 的最新改动提交并上传到 GitHub。
# 由 YiminScope 助手生成。

cd "$(dirname "$0")" || exit 1

# ★ 远程仓库地址（若你的仓库名不同，改这一行即可）
REPO_URL="https://github.com/RichardLi87/yiminscope.git"

echo "================================================"
echo "  YiminScope → GitHub 一键上传"
echo "================================================"
echo ""

# 安全保险：强制把远程指向 yiminscope，避免误推到 offerscope
git remote set-url origin "$REPO_URL" 2>/dev/null || git remote add origin "$REPO_URL"
CURRENT="$(git remote get-url origin)"
echo "远程仓库：$CURRENT"
if [ "$CURRENT" != "$REPO_URL" ]; then
  echo "⚠️ 远程地址不对，已尝试修正。请确认后再推。"
fi
echo ""

# 清理可能残留的锁文件
find .git -name "*.lock" -delete 2>/dev/null

# 确保分支名是 main
git branch -M main 2>/dev/null

# 看看有没有改动
if [ -z "$(git status --porcelain)" ]; then
  echo "✅ 没有新的改动，仓库已经是最新的。"
else
  git add -A
  git commit -m "更新 $(date '+%Y-%m-%d %H:%M')"
  echo ""
  echo "已提交本次改动，正在上传到 GitHub ..."
fi

echo ""
# 首次推送用 -u 建立追踪；之后普通 push 也会走这里
git push -u origin main

echo ""
echo "================================================"
echo "  完成！可以去看： https://github.com/RichardLi87/yiminscope"
echo "  按回车键关闭这个窗口。"
echo "================================================"
read
