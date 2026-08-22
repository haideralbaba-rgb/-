// ============================================================
// خادم Express بديل (للاستضافة الذاتية بدل Vercel Functions)
// ============================================================
// التشغيل محلياً:
//   node server/index.js
//
// يشتغل على المنفذ المحدد في PORT (افتراضي 8787) ويعرض:
//   POST http://localhost:8787/api/chat
//
// اجعل الـ Front-end يشير لهذا العنوان عبر متغير البيئة:
//   VITE_CHAT_API_URL=http://localhost:8787/api/chat
// (يوضع داخل ملف .env في جذر مشروع الـ Front-end — راجع docs/AI_CHAT_SETUP.md)
// ============================================================

import "dotenv/config";
import express from "express";
import cors from "cors";
import { callYandexGPT } from "../api/_shared/assistantConfig.js";

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "الرسائل مفقودة" });
    }

    const trimmedHistory = messages.slice(-12);
    const result = await callYandexGPT(trimmedHistory);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    return res.status(200).json({ reply: result.text });
  } catch (err) {
    return res.status(500).json({ error: "حدث خطأ غير متوقع في الخادم." });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`✓ AI Chat proxy server running on http://localhost:${PORT}`);
});

