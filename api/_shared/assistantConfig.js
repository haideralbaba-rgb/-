// ============================================================
// أبو علي — resilient AI ordering agent
// Primary: Gemini 3.7 Flash
// Fallbacks: Gemini 2.5 Flash -> Gemini 2.5 Flash-Lite
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
7. لا تنشئ الطلب النهائي بنفسك. checkout فقط عندما يقول الزبون بوضوح إنه يريد تأكيد الطلب، وبعد اكتمال السلة. إذا نقص عنوان التوصيل أو وسيلة الاستلام، اسأل أولاً.
8. بعد كل تعديل، اذكر باختصار ماذا تغير وما هو المجموع من CART.
9. اقترح إضافة واحدة فقط عند الحاجة، ولا تضغط على الزبون.
10. إذا كان كلام الزبون غامضاً بين منتجين، اسأل سؤالاً واحداً واضحاً بدلاً من التخمين.
11. إذا طلب الزبون تعديل طلب لم يتم تأكيده بعد، عدّل السلة فوراً. إذا كان الطلب مؤكداً بالفعل، أخبره أنه يحتاج التواصل مع المطعم ولا تدّعي أنك عدلته.

أرجع JSON فقط بهذا الشكل:
{
  "reply": "رد عراقي قصير",
  "actions": [
    {"type":"add_to_cart","itemId":"...","quantity":1}
  ]
}

الأنواع المسموحة: add_to_cart, remove_from_cart, set_quantity, clear_cart, open_cart, checkout.
كل action يجب أن يكون قابلاً للتنفيذ. لا تضف أي markdown أو شرح خارج JSON.`;

const MODELS = [
  "gemini-3.7-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];

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

function isTransient(status) {
  return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function requestModel(model, contents, apiKey) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(`${endpoint}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            maxOutputTokens: 600,
            responseMimeType: "application/json",
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
        return { ok: true, data, raw };
      }

      lastError = { status: res.status, message: data?.error?.message || "Gemini request failed" };
      if (!isTransient(res.status)) break;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 350));
    } catch (error) {
      lastError = { status: 502, message: error instanceof Error ? error.message : "Network error" };
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }

  return { ok: false, error: lastError };
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

  let lastError = null;

  for (const model of MODELS) {
    const result = await requestModel(model, contents, apiKey);
    if (!result.ok) {
      lastError = result.error;
      console.warn(`AI model ${model} unavailable; trying fallback.`, result.error);
      continue;
    }

    const parsed = cleanJson(result.raw);
    if (!parsed || typeof parsed.reply !== "string") {
      lastError = { status: 502, message: "Invalid structured AI response" };
      continue;
    }

    const allowed = new Set(["add_to_cart", "remove_from_cart", "set_quantity", "clear_cart", "open_cart", "checkout"]);
    const actions = Array.isArray(parsed.actions)
      ? parsed.actions.filter((a) => a && allowed.has(a.type) && (!a.itemId || typeof a.itemId === "string"))
      : [];

    return { text: parsed.reply.trim(), actions, model };
  }

  return {
    error: lastError?.message || "تعذر الوصول إلى خدمة الذكاء الاصطناعي حالياً.",
    status: lastError?.status || 503,
  };
}
