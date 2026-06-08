#!/bin/bash
# 双击此文件即可把 OfferScope 的最新改动提交并上传到 GitHub。
# 由 OfferScope 助手生成。

cd "$(dirname "$0")" || exit 1

echo "================================================"
echo "  OfferScope → GitHub 一键上传"
echo "================================================"
echo ""

# 清理可能残留的锁文件（保险起见）
find .git -name "*.lock" -delete 2>/dev/null

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
git push

echo ""
echo "================================================"
echo "  完成！可以去看： https://github.com/RichardLi87/offerscope"
echo "  按回车键关闭这个窗口。"
echo "================================================"
read
