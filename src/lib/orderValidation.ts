import type { CartItem } from "../context/OrderContext";

export function validateCart(items: CartItem[]) {
  if (!items.length) return "السلة فارغة";
  if (items.some((item) => !item.id || !item.name || !Number.isFinite(item.price) || item.price < 0 || item.quantity < 1)) return "يوجد منتج غير صالح في السلة";
  return null;
}

export function calculateSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function createSubmitGuard() {
  let busy = false;
  return {
    get isBusy() { return busy; },
    start() { if (busy) return false; busy = true; return true; },
    stop() { busy = false; },
  };
}
