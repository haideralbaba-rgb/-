import { callGemini } from "./_shared/assistantConfig.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messages, cart, menu } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "الرسائل مفقودة" });
    }

    const trimmedHistory = messages.slice(-20);
    const safeCart = Array.isArray(cart) ? cart.slice(0, 50) : [];
    const safeMenu = Array.isArray(menu) ? menu.slice(0, 150) : [];
    const result = await callGemini(trimmedHistory, safeCart, safeMenu);

    if (result.error) return res.status(result.status || 500).json({ error: result.error });
    return res.status(200).json({ reply: result.text, actions: result.actions || [] });
  } catch (err) {
    console.error("Chat API Error:", err);
    return res.status(500).json({ error: "حدث خطأ غير متوقع في الخادم." });
  }
}
