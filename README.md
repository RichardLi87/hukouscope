# 落户雷达 · HukouScope

AI 大城市落户竞争力诊断 —— 上海/北京/深圳/广州/杭州等城市对比，先测清你够不够落、走哪条路、还差什么。
免费测 + 一次性付费 AI 报告。架构与 OfferScope / YiminScope 同源（零依赖 Node + DeepSeek 代理 + ZPay）。

> ⚠️ 评分代表"竞争力/匹配度"，**不代表落户审批结果**；不构成落户、法律或政策建议。各地政策以官方为准。

## 本地运行
```bash
node --env-file=.env server.js      # Node 18+
# 打开 http://localhost:3002
```

## 覆盖城市（10）
上海 · 北京 · 深圳 · 广州 · 杭州 · 成都 · 苏州 · 南京 · 武汉 · 天津

## 落户方式
学历/人才引进 · 应届生 · 留学生 · 积分落户 · 居转户 · 投资纳税 · 投靠

## 与家族其它站
同架构、同服务器（本项目用端口 **3002**）、同 ZPay。视觉为"户口本红 + 暖米底"，城市天际线 Logo，与蓝(留学)、绿(移民)区分。价格 ¥19 / ¥49（lib/pay.js 可改）。

## 部署
1. 服务器 `git clone` 到新目录，放 `.env`（PORT=3002，SITE_URL=https://hukouscope.com）
2. `pm2 start "node --env-file=.env server.js" --name hukouscope`
3. nginx 新增 vhost 反代 hukouscope.com → 127.0.0.1:3002，certbot 配 HTTPS
