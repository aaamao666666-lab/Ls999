# LR 手机版

LR mobile frontend demo（Cloudflare Workers + Assets）。

## 本地 / 部署

```bash
npm install
npx wrangler dev
# 或
npx wrangler deploy
```

可选密钥（Workers Secret / Cursor App Secret）：`GEMINI_API_KEY`  
- **无 Key**：浏览器用人物素材（`ai-dealer-ref.jpg`）现场合成开牌发牌视频 → 映射 `LiveVideoArea`。  
- **有 Key**：`/api/ai-card/generate-video` 调用 Gemini Omni `image_to_video`；失败时仍回退本地合成视频。

## 百家乐 · AI 变牌同步

- 开奖倒计时末段 **封盘延迟**（默认 3 秒），停止接收下注。
- **AI Card Studio**：指定闲/庄点数或任意牌面 →「AI 一键变牌与同步开奖」。
- 同步链路：**生成 AI 荷官开牌视频** → LiveVideoArea 播放 → 开牌框翻牌 → 点数/胜负/路单/结算一致。
