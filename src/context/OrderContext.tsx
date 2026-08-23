import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  image?: string;
}

interface CartContextValue {
  items: CartItem[];
  isCartOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  totalPrice: number;
  totalItems: number;
  lastAddedId: string | null;
  showCheckout: boolean;
  setShowCheckout: (v: boolean) => void;
}

const STORAGE_KEY = "ms_cart";
const MAX_ITEM_QUANTITY = 99;

function sanitizeCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is CartItem => !!item && typeof item === "object")
    .map((item) => ({
      id: String(item.id || ""),
      name: String(item.name || ""),
      price: Number.isFinite(Number(item.price)) ? Math.max(0, Number(item.price)) : 0,
      quantity: Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.floor(Number(item.quantity) || 1))),
      variant: item.variant ? String(item.variant) : undefined,
      image: item.image ? String(item.image) : undefined,
    }))
    .filter((item) => item.id && item.name);
}

function loadCart(): CartItem[] {
  try {
    return sanitizeCart(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Private browsing / storage quota should never break ordering.
  }
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => saveCart(items), [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    const safeQuantity = Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.floor(quantity || 1)));
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: Math.min(MAX_ITEM_QUANTITY, i.quantity + safeQuantity) }
            : i,
        );
      }
      return [...prev, { ...item, quantity: safeQuantity }];
    });
    setLastAddedId(item.id);
    window.setTimeout(() => setLastAddedId((cur) => (cur === item.id ? null : cur)), 900);
  }, []);

  const removeItem = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    const safeQuantity = Math.min(MAX_ITEM_QUANTITY, Math.floor(Number(quantity) || 0));
    if (safeQuantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: safeQuantity } : i)));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const totalPrice = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);
  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, isCartOpen, addItem, removeItem, updateQuantity, clearCart, openCart, closeCart, totalPrice, totalItems, lastAddedId, showCheckout, setShowCheckout }}>
      {children}
    </CartContext.Provider>
  );
}

export function useOrder() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useOrder must be used within OrderProvider");
  return ctx;
}
