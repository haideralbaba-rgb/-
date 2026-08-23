export interface ChatMessage { role: "user" | "assistant"; text: string; }
export interface MenuContextItem { id: string; name: string; price: number; variant?: string; }
export interface CartContextItem { id: string; name: string; price: number; quantity: number; variant?: string; }
export interface ChatAction { type: "add_to_cart" | "remove_from_cart" | "set_quantity" | "clear_cart" | "open_cart" | "checkout"; itemId?: string; quantity?: number; }
export interface ChatResult { reply?: string; actions?: ChatAction[]; error?: string; }

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || "/api/chat";

const normalize = (value: string) => value.toLowerCase().replace(/[ًٌٍَُِّْـ]/g, "").replace(/[إأآ]/g, "ا").replace(/ة/g, "ه").trim();
const numberWords: Record<string, number> = { "واحد": 1, "وحده": 1, "اثنين": 2, "اثنينه": 2, "ثنتين": 2, "ثلاثه": 3, "ثلاث": 3, "اربعه": 4, "اربع": 4, "خمسه": 5, "خمس": 5 };

function localOrderingFallback(text: string, cart: CartContextItem[], menu: MenuContextItem[]): ChatResult | null {
  const q = normalize(text);
  if (!q) return null;

  if (/^(افتح|وري|شوف|اريد اشوف|شوفلي).*(سله|السله|طلب)/.test(q) || q.includes("افتح السله")) {
    return { reply: "تمام، فتحتلك السلة.", actions: [{ type: "open_cart" }] };
  }
  if (/(افرغ|فضي|امسح).*(سله|السله)/.test(q)) {
    return { reply: "تمام، فرغت السلة.", actions: [{ type: "clear_cart" }] };
  }
  if (/(خلص|تم|اريد اطلب|اريد اكمّل|اريد اكمل|كمل الطلب|اتمام الطلب|أكد الطلب|اكد الطلب)/.test(q) && cart.length) {
    return { reply: "تمام، نكمل للطلب.", actions: [{ type: "checkout" }] };
  }

  const matched = menu
    .map((item) => ({ ...item, n: normalize(`${item.name} ${item.variant || ""}`) }))
    .filter((item) => item.n && q.includes(item.n))
    .sort((a, b) => b.n.length - a.n.length)[0];

  if (!matched) {
    if (/(شيل|احذف|حذف|شطب)/.test(q)) return { reply: "حددلي اسم الطبق اللي تريد أشيله من السلة." };
    return null;
  }

  const existing = cart.find((item) => item.id === matched.id);
  const numberMatch = q.match(/\b(\d{1,2})\b/);
  const wordNumber = Object.entries(numberWords).find(([word]) => q.includes(word));
  const requestedQuantity = numberMatch ? Number(numberMatch[1]) : wordNumber?.[1];

  if (/(شيل|احذف|حذف|شطب)/.test(q)) {
    return existing
      ? { reply: `تمام، شلت ${matched.name} من السلة.`, actions: [{ type: "remove_from_cart", itemId: matched.id }] }
      : { reply: `${matched.name} مو موجود بالسلة.` };
  }

  if (/(خلي|خليهن|خليها|عدد|كمية|يصيرون|خليلي).*(اثنين|ثنتين|ثلاث|ثلاثه|اربعه|اربع|خمسه|خمس|\d)/.test(q) && requestedQuantity) {
    return { reply: `تمام، خليت ${matched.name} × ${requestedQuantity}.`, actions: [{ type: "set_quantity", itemId: matched.id, quantity: requestedQuantity }] };
  }

  const quantity = requestedQuantity || 1;
  return { reply: `تم، ضفت ${matched.name} × ${quantity} للسلة.`, actions: [{ type: "add_to_cart", itemId: matched.id, quantity }] };
}

export async function sendChatMessage(history: ChatMessage[], cart: CartContextItem[], menu: MenuContextItem[]): Promise<ChatResult> {
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    const res = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, cart, menu }),
      signal: controller.signal,
    });
    window.clearTimeout(timeout);

    let data: ChatResult = {};
    try { data = await res.json(); } catch {}
    if (res.ok && data.reply) return { reply: data.reply, actions: Array.isArray(data.actions) ? data.actions : [] };

    // Never leave a customer unable to order because the LLM is busy.
    const local = localOrderingFallback(history.at(-1)?.text || "", cart, menu);
    if (local) return local;
    return { error: "المساعد الذكي غير متاح للحظة، بس تكدر تكمل طلبك مباشرة من السلة." };
  } catch {
    const local = localOrderingFallback(history.at(-1)?.text || "", cart, menu);
    if (local) return local;
    return { error: "المساعد الذكي غير متاح للحظة، بس تكدر تكمل طلبك مباشرة من السلة." };
  }
}
