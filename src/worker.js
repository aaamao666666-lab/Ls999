/**
 * LR Cloudflare Worker — static assets + AI Card Studio APIs.
 * GEMINI_API_KEY is optional; without it, card sync still works client-side.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = ["S", "H", "C", "D"];
const SUIT_SYM = { S: "♠", H: "♥", C: "♣", D: "♦" };

function cardValue(rank) {
  if (rank === "A") return 1;
  if (["10", "J", "Q", "K"].includes(rank)) return 0;
  return Number(rank);
}

function handPoint(cards) {
  return cards.reduce((a, c) => a + cardValue(c.rank), 0) % 10;
}

function normalizeCard(c) {
  if (!c || !RANKS.includes(c.rank) || !SUITS.includes(c.suit)) return null;
  return {
    rank: c.rank,
    suit: c.suit,
    s: SUIT_SYM[c.suit],
    red: c.suit === "H" || c.suit === "D",
  };
}

function settle(player, banker) {
  const pCards = player.map(normalizeCard);
  const bCards = banker.map(normalizeCard);
  if (pCards.some((x) => !x) || bCards.some((x) => !x)) {
    throw new Error("牌面参数无效，请使用 A-K 与花色 S/H/C/D");
  }
  if (pCards.length < 2 || pCards.length > 3 || bCards.length < 2 || bCards.length > 3) {
    throw new Error("闲/庄各需 2 或 3 张牌");
  }
  const p = handPoint(pCards);
  const b = handPoint(bCards);
  const result = p > b ? "p" : b > p ? "b" : "t";
  const label = { p: "闲", b: "庄", t: "和" }[result];
  return {
    player: pCards,
    banker: bCards,
    playerPoint: p,
    bankerPoint: b,
    result,
    winner: label,
    summary: `${label}胜 · ${p}:${b}`,
  };
}

function buildPrompt(settlement) {
  const fmt = (cards) => cards.map((c) => `${c.rank}${c.s}`).join(", ");
  return [
    "Animate the exact woman in the reference image as a live baccarat dealer.",
    "Vertical 9:16 cinematic clip: she deals face-down then reveals cards on a navy felt table,",
    "soft casino lighting brightens as cards open, keep her face, hair, royal-blue gold dress identical.",
    `Reveal Player hand ${fmt(settlement.player)} on the left and Banker hand ${fmt(settlement.banker)} on the right.`,
    `End holding on the table after ${settlement.summary}. No on-screen text, logos, or watermarks.`,
  ].join(" ");
}

function extractVideoPart(payload) {
  let videoB64 = null;
  let uri = null;
  let mime = "video/mp4";
  for (const step of payload.steps || []) {
    for (const part of step.content || []) {
      if (part.type === "video") {
        if (part.data) {
          videoB64 = part.data;
          mime = part.mime_type || mime;
        }
        if (part.uri) uri = part.uri;
      }
    }
  }
  return { videoB64, uri, mime };
}

async function generateVideo(env, settlement, referenceImageUrl) {
  const key = env.GEMINI_API_KEY;
  if (!key) {
    return {
      ok: false,
      demo: true,
      videoUrl: null,
      message: "未配置 GEMINI_API_KEY，将使用本地 AI 荷官开牌视频合成。",
    };
  }

  const input = [{ type: "text", text: buildPrompt(settlement) }];
  if (referenceImageUrl) {
    try {
      const imgRes = await fetch(referenceImageUrl);
      if (imgRes.ok) {
        const buf = new Uint8Array(await imgRes.arrayBuffer());
        if (buf.byteLength <= 900000) {
          let binary = "";
          const chunk = 0x8000;
          for (let i = 0; i < buf.length; i += chunk) {
            binary += String.fromCharCode(...buf.subarray(i, i + chunk));
          }
          const mime = imgRes.headers.get("content-type") || "image/jpeg";
          input.push({ type: "image", mime_type: mime, data: btoa(binary) });
        }
      }
    } catch {
      /* reference optional */
    }
  }

  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key,
    },
    body: JSON.stringify({
      model: "gemini-omni-1.2-flash",
      input,
      response_modalities: ["video"],
      response_format: {
        type: "video",
        duration: "6s",
        aspect_ratio: "9:16",
        resolution: "720p",
        delivery: "uri",
      },
      video_config: { task: "image_to_video" },
    }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      demo: true,
      videoUrl: null,
      message: payload?.error?.message || `Gemini 视频生成失败 (${res.status})，已回退本地 AI 开牌视频。`,
      rawStatus: res.status,
    };
  }

  /* Keep Worker latency short; client already synthesizes a local AI deal clip. */
  let { videoB64, uri, mime } = extractVideoPart(payload);
  if (!videoB64 && !uri && payload.id) {
    await new Promise((r) => setTimeout(r, 2500));
    const poll = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/interactions/${payload.id}`,
      { headers: { "x-goog-api-key": key } },
    );
    const body = await poll.json().catch(() => ({}));
    const part = extractVideoPart(body);
    videoB64 = part.videoB64 || videoB64;
    uri = part.uri || uri;
    mime = part.mime || mime;
  }

  if (videoB64) {
    return {
      ok: true,
      demo: false,
      videoUrl: `data:${mime};base64,${videoB64}`,
      interactionId: payload.id || null,
      message: "Gemini AI 荷官开牌视频已生成并映射到 LiveVideoArea。",
    };
  }

  if (uri) {
    return {
      ok: true,
      demo: false,
      videoUrl: uri,
      interactionId: payload.id || null,
      message: "Gemini AI 荷官开牌视频已生成并映射到 LiveVideoArea。",
    };
  }

  return {
    ok: false,
    demo: true,
    videoUrl: null,
    message: "Gemini 未返回视频，已回退本地 AI 荷官开牌视频合成。",
    interactionId: payload.id || null,
  };
}

async function handleSync(request) {
  try {
    const body = await request.json();
    const settlement = settle(body.player || [], body.banker || []);
    return json({ success: true, settlement, sealedDelaySec: Number(body.sealedDelaySec) || 3 });
  } catch (err) {
    return json({ success: false, error: String(err.message || err) }, 400);
  }
}

async function handleGenerate(request, env) {
  try {
    const body = await request.json();
    const settlement = settle(body.player || [], body.banker || []);
    const origin = new URL(request.url).origin;
    const ref =
      body.referenceImageUrl ||
      `${origin}/ai-dealer-ref.jpg`;
    const video = await generateVideo(env, settlement, ref);
    return json({
      success: true,
      settlement,
      video,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    return json({ success: false, error: String(err.message || err) }, 400);
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    const url = new URL(request.url);
    if (url.pathname === "/api/ai-card/sync" && request.method === "POST") {
      return handleSync(request);
    }
    if (url.pathname === "/api/ai-card/generate-video" && request.method === "POST") {
      return handleGenerate(request, env);
    }
    if (url.pathname.startsWith("/api/")) {
      return json({ error: "not found" }, 404);
    }
    return env.ASSETS.fetch(request);
  },
};
