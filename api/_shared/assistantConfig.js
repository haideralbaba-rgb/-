// أبو علي — production ordering agent
export const SYSTEM_PROMPT = `أنت "أبو علي"، مساعد الطلبات الذكي لمطعم "معلم الشاورما" في كربلاء المقدسة.
تتكلم باللهجة العراقية الطبيعية، قصيرة وواضحة.
أنت وكيل طلبات وليس chatbot فقط.

قواعد:
1. استخدم فقط MENU المرسل. لا تخترع منتجاً أو سعراً أو id.
2. افهم السياق والسلة الحالية: "واحدة ثانية"، "خلي وياها"، "شيلها"، "خليهن اثنين".
3. add_to_cart للإضافة، set_quantity لتحديد الكمية، remove_from_cart للحذف، clear_cart للتفريغ.
4. لا تقل إنك نفذت شيئاً إلا إذا أرسلت action فعلياً.
5. checkout فقط عندما يطلب الزبون إكمال الطلب بوضوح؛ لا تنشئ Order من الـAI.
6. إذا كان الطلب غير واضح اسأل سؤالاً واحداً فقط.
7. إذا كان الطلب مؤكداً فلا تدّعي أنك عدلته؛ التعديل بعد التأكيد يحتاج المطعم.
8. بعد التعديل أعطِ ملخصاً قصيراً.

أرجع JSON فقط:
{"reply":"رد عراقي قصير","actions":[]}
الأنواع: add_to_cart, remove_from_cart, set_quantity, clear_cart, open_cart, checkout.`;

// Current stable models. Explicit ordering is handled locally before this path,
// so temporary model capacity/quota never prevents a customer from ordering.
const MODELS = [
  process.env.GEMINI_PRIMARY_MODEL || "gemini-3.5-flash-lite",
  process.env.GEMINI_FALLBACK_MODEL || "gemini-3.6-flash",
  "gemini-3.7-flash",
];

function cleanJson(text) {
  const trimmed = String(text || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  try { return JSON.parse(candidate); } catch {}
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(candidate.slice(first, last + 1)); } catch {}
  }
  return null;
}

async function requestModel(model, contents, apiKey) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);
    const res = await fetch(`${endpoint}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 500, responseMimeType: "application/json", temperature: 0.25 },
      }),
    });
    clearTimeout(timeout);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, message: data?.error?.message || "AI request failed" };
    const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
    return { ok: true, raw };
  } catch (error) {
    return { ok: false, status: 502, message: error?.name === "AbortError" ? "AI request timeout" : "Network error" };
  }
}

export async function callGemini(history, cart = [], menu = []) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return { error: "لم يتم إعداد مفتاح AI على الخادم.", status: 500 };

  const contents = [
    { role: "user", parts: [{ text: `CURRENT CART:\n${JSON.stringify(cart)}\nMENU:\n${JSON.stringify(menu)}` }] },
    ...history.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] })),
  ];

  let lastError = null;
  for (const model of [...new Set(MODELS)]) {
    const result = await requestModel(model, contents, apiKey);
    if (!result.ok) {
      lastError = result;
      console.warn(`AI fallback: ${model}`, result.message);
      continue;
    }
    const parsed = cleanJson(result.raw);
    if (!parsed || typeof parsed.reply !== "string") {
      lastError = { status: 502, message: "Invalid AI response" };
      continue;
    }
    const allowed = new Set(["add_to_cart", "remove_from_cart", "set_quantity", "clear_cart", "open_cart", "checkout"]);
    const actions = Array.isArray(parsed.actions) ? parsed.actions.filter((a) => a && allowed.has(a.type) && (!a.itemId || typeof a.itemId === "string")) : [];
    return { text: parsed.reply.trim(), actions, model };
  }

  return { error: "خدمة المساعد مشغولة مؤقتاً. تگدر تكمل الطلب من السلة، وما راح يضيع شي.", status: lastError?.status || 503 };
}
