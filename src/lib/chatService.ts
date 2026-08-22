export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export interface ChatResult {
  reply?: string;
  error?: string;
}

// يمكن تغيير هذا عبر VITE_CHAT_API_URL إذا كان الخادم يعمل على عنوان مختلف
// (مثلاً خادم Express محلي: http://localhost:8787/api/chat).
// افتراضياً يشير لمسار Vercel Serverless Function: /api/chat
const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || "/api/chat";

export async function sendChatMessage(history: ChatMessage[]): Promise<ChatResult> {
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);

    const res = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
      signal: controller.signal,
    });

    window.clearTimeout(timeout);

    let data: { reply?: string; error?: string } = {};
    try {
      data = await res.json();
    } catch {
      // Response wasn't JSON (e.g. 404 HTML page from a static host) — fall through to generic error
    }

    if (!res.ok) {
      return { error: data.error || "تعذر الوصول للخدمة حالياً." };
    }

    if (!data.reply) {
      return { error: "لم يصل رد من الخدمة." };
    }

    return { reply: data.reply };
  } catch (err) {
    return { error: "تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت وحاول مرة أخرى." };
  }
}
