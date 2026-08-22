// ============================================================
// Vercel Serverless Function — Proxy آمن بين الـ Front-end وYandexGPT
// ============================================================
// عند نشر المشروع على Vercel، يتم اكتشاف هذا الملف تلقائياً كمسار:
//   POST /api/chat
//
// الـ API_KEY لا يُرسل أبداً إلى المتصفح — يبقى فقط داخل بيئة الخادم
// (Environment Variables في لوحة تحكم Vercel، أو ملف .env محلياً).
// ============================================================

import { callYandexGPT } from "./_shared/assistantConfig.js";

export default async function handler(req, res) {
  // CORS (نفس المصدر عادة، لكن نسمح بأي مصدر لتسهيل الاختبار)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "الرسائل مفقودة" });
    }

    // نكتفي بآخر 12 رسالة لتفادي تضخم السياق
    const trimmedHistory = messages.slice(-12);

    const result = await callYandexGPT(trimmedHistory);

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    return res.status(200).json({ reply: result.text });
  } catch (err) {
    return res.status(500).json({ error: "حدث خطأ غير متوقع في الخادم." });
  }
}

