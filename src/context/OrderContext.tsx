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

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => saveCart(items), [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    const safeQuantity = Math.max(1, Math.floor(quantity));
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + safeQuantity } : i
        );
      }
      return [...prev, { ...item, quantity: safeQuantity }];
    });
    setLastAddedId(item.id);
    window.setTimeout(() => setLastAddedId((cur) => (cur === item.id ? null : cur)), 900);
  }, []);

  const removeItem = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(id);
        return;
      }
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.floor(quantity) } : i)));
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const totalPrice = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);
  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        totalPrice,
        totalItems,
        lastAddedId,
        showCheckout,
        setShowCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useOrder() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useOrder must be used within OrderProvider");
  return ctx;
}
