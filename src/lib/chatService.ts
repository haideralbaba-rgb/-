export interface ChatMessage { role: "user" | "assistant"; text: string; }
export interface MenuContextItem { id: string; name: string; price: number; variant?: string; }
export interface CartContextItem { id: string; name: string; price: number; quantity: number; variant?: string; }
export interface ChatAction { type: "add_to_cart" | "remove_from_cart" | "set_quantity" | "clear_cart" | "open_cart" | "checkout"; itemId?: string; quantity?: number; }
export interface ChatResult { reply?: string; actions?: ChatAction[]; error?: string; local?: boolean; }

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || "/api/chat";

const normalize = (value: string) => value.toLowerCase().replace(/[ًٌٍَُِّْـ]/g, "").replace(/[إأآ]/g, "ا").replace(/ة/g, "ه").trim();
const numberWords: Record<string, number> = { "واحد": 1, "وحده": 1, "اثنين": 2, "اثنينه": 2, "ثنتين": 2, "ثلاثه": 3, "ثلاث": 3, "اربعه": 4, "اربع": 4, "خمسه": 5, "خمس": 5, "ست": 6, "سته": 6, "سبع": 7, "سبعه": 7, "ثمان": 8, "ثمانيه": 8, "تسع": 9, "تسعه": 9, "عشر": 10 };

/** Deterministic ordering path. Explicit cart/order commands never need an LLM. */
export function localOrderingFallback(text: string, cart: CartContextItem[], menu: MenuContextItem[]): ChatResult | null {
  const q = normalize(text);
  if (!q) return null;

  if (/^(افتح|وري|شوف|اريد اشوف|شوفلي).*(سله|السله|طلب)/.test(q) || q.includes("افتح السله")) {
    return { reply: "تمام، فتحتلك السلة.", actions: [{ type: "open_cart" }], local: true };
  }
  if (/(افرغ|فضي|امسح).*(سله|السله)/.test(q)) {
    return { reply: "تمام، فرغت السلة.", actions: [{ type: "clear_cart" }], local: true };
  }
  if (/(خلص|تم|اريد اطلب|اريد اكمّل|اريد اكمل|كمل الطلب|اتمام الطلب|أكد الطلب|اكد الطلب)/.test(q) && cart.length) {
    return { reply: "تمام، نكمل للطلب.", actions: [{ type: "checkout" }], local: true };
  }

  const matched = menu
    .map((item) => ({ ...item, n: normalize(`${item.name} ${item.variant || ""}`) }))
    .filter((item) => item.n && q.includes(item.n))
    .sort((a, b) => b.n.length - a.n.length)[0];

  if (!matched) {
    if (/(شيل|احذف|حذف|شطب)/.test(q)) return { reply: "حددلي اسم الطبق اللي تريد أشيله من السلة.", local: true };
    return null;
  }

  const existing = cart.find((item) => item.id === matched.id);
  const numberMatch = q.match(/\b(\d{1,2})\b/);
  const wordNumber = Object.entries(numberWords).find(([word]) => q.includes(word));
  const requestedQuantity = numberMatch ? Number(numberMatch[1]) : wordNumber?.[1];

  if (/(شيل|احذف|حذف|شطب)/.test(q)) {
    return existing
      ? { reply: `تمام، شلت ${matched.name} من السلة.`, actions: [{ type: "remove_from_cart", itemId: matched.id }], local: true }
      : { reply: `${matched.name} مو موجود بالسلة.`, local: true };
  }

  if (/(خلي|خليهن|خليها|عدد|كمية|يصيرون|خليلي).*(واحد|اثنين|ثنتين|ثلاث|ثلاثه|اربعه|اربع|خمسه|خمس|ست|سته|سبع|سبعه|ثمان|ثمانيه|تسع|تسعه|عشر|\d)/.test(q) && requestedQuantity) {
    return { reply: `تمام، خليت ${matched.name} × ${requestedQuantity}.`, actions: [{ type: "set_quantity", itemId: matched.id, quantity: requestedQuantity }], local: true };
  }

  const quantity = requestedQuantity || 1;
  return { reply: `تم، ضفت ${matched.name} × ${quantity} للسلة.`, actions: [{ type: "add_to_cart", itemId: matched.id, quantity }], local: true };
}

export async function sendChatMessage(history: ChatMessage[], cart: CartContextItem[], menu: MenuContextItem[]): Promise<ChatResult> {
  const latest = history.at(-1)?.text || "";

  // Do not waste an AI request for deterministic ordering commands. This also makes
  // product ordering continue working when Gemini is rate-limited or unavailable.
  const local = localOrderingFallback(latest, cart, menu);
  if (local) return local;

  // Keep the request small and predictable. The cart is the source of truth; old chat
  // turns are only conversational context. There is intentionally no 10-message lock.
  const compactHistory = history.slice(-14);

  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 9000);
    const res = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: compactHistory, cart, menu }),
      signal: controller.signal,
    });
    window.clearTimeout(timeout);

    let data: ChatResult = {};
    try { data = await res.json(); } catch {}
    if (res.ok && data.reply) return { reply: data.reply, actions: Array.isArray(data.actions) ? data.actions : [] };

    return { error: "المساعد مشغول هسه، بس تگدر تكمل الطلب مباشرة من السلة." };
  } catch {
    return { error: "المساعد أخذ وقت أطول من اللازم. جرّب مرة ثانية، وطلبك بالسلة ما يضيع." };
  }
}
