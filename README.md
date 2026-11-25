# LR 手机版

LR mobile frontend demo（Cloudflare Workers + Assets）。

## 本地 / 部署

```bash
npm install
npx wrangler dev
# 或
npx wrangler deploy
```

可选密钥（Workers Secret）：`GEMINI_API_KEY`  
未配置时，AI Card Studio 仍会本地对齐牌面 / 路单 / 结算；配置后 `/api/ai-card/generate-video` 调用 Gemini 生成开牌视频并映射到 `LiveVideoArea`。

```bash
npx wrangler secret put GEMINI_API_KEY
```

## 百家乐 · AI 变牌同步

- 开奖倒计时末段 **封盘延迟**（默认 3 秒），停止接收下注。
- **AI Card Studio**：指定闲/庄点数或任意牌面 →「AI 一键变牌与同步开奖」。
- 同步链路：Gemini 开牌视频 → LiveVideoArea 替换播放 → 开牌框翻牌 → 点数/胜负/路单/结算一致。
