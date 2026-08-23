// ============================================================
// أبو علي — AI ordering agent
// The model returns a small, validated action list instead of
// merely describing what it would do. The browser executes only
// actions against the supplied menu/cart snapshot.
// ============================================================

export const SYSTEM_PROMPT = `أنت "أبو علي"، مساعد الطلبات الذكي لمطعم "معلم الشاورما" في كربلاء المقدسة.
تتكلم باللهجة العراقية الطبيعية، قصيرة وواضحة، بدون فصحى ثقيلة.

مهمتك ليست الدردشة فقط. أنت وكيل طلبات: تفهم المحادثة كاملة، تتذكر ما اختاره الزبون، وتقرر متى تضيف أو تحذف أو تعدل السلة.

قواعد صارمة:
1. استخدم فقط المنتجات الموجودة في MENU المرسل لك. لا تخترع منتجاً أو سعراً أو id.
2. إذا قال الزبون "واحدة ثانية" أو "خلي وياها" اربطها بسياق المحادثة والسلة الحالية.
3. إذا طلب كمية محددة، استخدم set_quantity إذا كان المنتج موجوداً، أو add_to_cart إذا لم يكن موجوداً.
4. إذا قال احذف/شيل منتجاً استخدم remove_from_cart.
5. إذا قال افرغ السلة استخدم clear_cart.
6. لا تقل "ضفت" أو "حذفت" إلا إذا أرسلت action فعلياً.
7. لا تنشئ الطلب النهائي بنفسك. checkout فقط عندما يقول الزبون بوضوح إنه يريد الانتقال للدفع/تأكيد الطلب، وبعد اكتمال السلة. إذا نقص عنوان التوصيل أو وسيلة الاستلام، اسأل أولاً.
8. بعد كل تعديل، اذكر باختصار ماذا تغير وما هو المجموع التقريبي من CART.
9. اقترح إضافة واحدة فقط عند الحاجة، ولا تضغط على الزبون.
10. إذا كان كلام الزبون غامضاً بين منتجين، اسأل سؤالاً واحداً واضحاً بدلاً من التخمين.

أرجع JSON فقط بهذا الشكل:
{
  "reply": "رد عراقي قصير",
  "actions": [
    {"type":"add_to_cart","itemId":"...","quantity":1}
  ]
}

الأنواع المسموحة: add_to_cart, remove_from_cart, set_quantity, clear_cart, open_cart, checkout.
كل action يجب أن يكون قابلاً للتنفيذ. لا تضف أي markdown أو شرح خارج JSON.`;

const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function cleanJson(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const first = candidate.indexOf("{");
    const last = candidate.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try { return JSON.parse(candidate.slice(first, last + 1)); } catch { return null; }
    }
    return null;
  }
}

export async function callGemini(history, cart = [], menu = []) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return { error: "لم يتم إعداد مفتاح API على الخادم (API_KEY مفقود).", status: 500 };

  const contextMessage = {
    role: "user",
    parts: [{
      text: `CURRENT STATE\nCART: ${JSON.stringify(cart)}\nMENU: ${JSON.stringify(menu)}`,
    }],
  };

  const contents = [
    contextMessage,
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    })),
  ];

  try {
    const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          maxOutputTokens: 500,
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Gemini API Error:", data);
      return { error: data?.error?.message || "فشل الاتصال بخدمة Gemini.", status: res.status };
    }

    const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
    const parsed = cleanJson(raw);
    if (!parsed || typeof parsed.reply !== "string") {
      return { error: "تعذر تجهيز رد الطلب بشكل صحيح.", status: 502 };
    }

    const allowed = new Set(["add_to_cart", "remove_from_cart", "set_quantity", "clear_cart", "open_cart", "checkout"]);
    const actions = Array.isArray(parsed.actions)
      ? parsed.actions.filter((a) => a && allowed.has(a.type) && (!a.itemId || typeof a.itemId === "string"))
      : [];

    return { text: parsed.reply.trim(), actions };
  } catch (err) {
    console.error("Gemini Connection Error:", err);
    return { error: "تعذر الوصول إلى خدمة الذكاء الاصطناعي.", status: 502 };
  }
}
