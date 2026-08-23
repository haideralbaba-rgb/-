export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export interface MenuContextItem {
  id: string;
  name: string;
  price: number;
  variant?: string;
}

export interface CartContextItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
}

export interface ChatAction {
  type: "add_to_cart" | "remove_from_cart" | "set_quantity" | "clear_cart" | "open_cart" | "checkout";
  itemId?: string;
  quantity?: number;
}

export interface ChatResult {
  reply?: string;
  actions?: ChatAction[];
  error?: string;
}

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || "/api/chat";

export async function sendChatMessage(
  history: ChatMessage[],
  cart: CartContextItem[],
  menu: MenuContextItem[]
): Promise<ChatResult> {
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000);

    const res = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history, cart, menu }),
      signal: controller.signal,
    });

    window.clearTimeout(timeout);

    let data: ChatResult = {};
    try {
      data = await res.json();
    } catch {
      // Non-JSON response.
    }

    if (!res.ok) return { error: data.error || "تعذر الوصول للخدمة حالياً." };
    if (!data.reply) return { error: "لم يصل رد من الخدمة." };

    return {
      reply: data.reply,
      actions: Array.isArray(data.actions) ? data.actions : [],
    };
  } catch {
    return { error: "تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت وحاول مرة أخرى." };
  }
}
