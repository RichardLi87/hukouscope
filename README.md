# YiminScope · 移民雷达

AI 移民竞争力诊断 —— 10 个发达国家对比，先看清你最适合去哪、走哪条路，再决定怎么动。
免费测 + 一次性付费 AI 报告。架构与 OfferScope 同源（零依赖 Node 服务 + DeepSeek 代理 + ZPay 收款）。

> ⚠️ 本站提供的是基于自填信息的竞争力自评与信息参考，**评分代表"竞争力/匹配度"，不代表签证/永居获批概率**；不构成移民、法律或投资建议。最终以官方与持牌移民顾问/律师为准。

## 本地运行
```bash
node --env-file=.env server.js      # 需要 Node 18+
# 打开 http://localhost:3001
```
`.env` 已被 .gitignore 忽略（含 DeepSeek key 与 ZPay 商户密钥）。

## 覆盖的目的国（10）
加拿大 · 澳大利亚 · 美国 · 新西兰 · 英国 · 新加坡 · 中国香港 · 德国 · 葡萄牙 · 日本

## 路径
技术/工作移民 · 高端人才 · 投资移民 · 创业移民 · 留学转移民 · 亲属团聚

## 与 OfferScope 的关系
- **同架构**：server.js / lib/ai.js / lib/pay.js 结构一致，复用同一台服务器（本项目用端口 **3001**）与同一套 ZPay 商户。
- **不同视觉**：松林绿 + 陶土橙 + 米色暖底，衬线大标题，地球/罗盘 Logo，横向条形图（非雷达图）。
- **不同评分引擎**：按各国移民打分逻辑（加澳新 points、香港高才/优才、德国蓝卡、葡萄牙投资、日本 HSP 等）规则化计算竞争力与匹配档位。

## 部署（与 OfferScope 同机共存）
1. 服务器上 `git clone` 本仓库到新目录，放好 `.env`（PORT=3001，SITE_URL=https://yiminscope.com）。
2. `pm2 start "node --env-file=.env server.js" --name yiminscope`
3. nginx 新增一个 server 块，把 yiminscope 域名反代到 `127.0.0.1:3001`，配 HTTPS。
4. ZPay 回调用 `https://你的域名/api/pay/notify`（SITE_URL 决定）。

## 价格
诊断版 ¥39 · 全路径规划版 ¥99（在 `lib/pay.js` 调整）。
