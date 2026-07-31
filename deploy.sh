#!/usr/bin/env bash
# 火箭一飞冲天 · 部署辅助脚本
# 作用：
#   1) 自动 bump Service Worker 缓存版本号（CACHE_VERSION 改成时间戳），
#      使每次部署后用户无需手动硬刷新即可看到更新（配合 sw.js 的 network-first）。
#   2) 提交全部改动。
#   3) 如提供了 GitHub PAT，则直接推送；否则提示手动推送。
#
# 用法（在本仓库目录执行）：
#   bash deploy.sh                         # 仅 bump + 提交，之后手动 git push
#   bash deploy.sh ghp_xxxxxxxxx           # bump + 提交 + 用 token 推送
#
# 注意：打卡记录存在用户浏览器 localStorage，不在仓库里。本脚本不处理用户数据备份，
#       数据安全由 app 内的「自动备份 / GitHub 云同步 / 迁移前快照」负责。

set -e
cd "$(dirname "$0")"

TS="rocket-habit-$(date +%Y%m%d%H%M%S)"

# bump sw.js 里的 CACHE_VERSION
sed -i.bak -E "s/^const CACHE_VERSION = '[^']*';/const CACHE_VERSION = '$TS';/" sw.js && rm -f sw.js.bak

echo "SW 缓存版本已更新为: $TS"

git add -A
git commit -m "deploy: bump SW cache ($TS)" || echo "（无改动可提交，跳过）"

if [ -n "$1" ]; then
  echo "正在推送..."
  git push "https://$1@github.com/rocket0326/rocket-habit.git" main
  echo "✅ 已推送"
else
  echo "已提交。请手动推送： git push origin main"
fi
