import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { MenuItem } from "@/data/menuData";

export interface CartItem extends MenuItem {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("cart");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const save = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem("cart", JSON.stringify(newItems));
  };

  const addItem = useCallback((item: MenuItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      const next = existing
        ? prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { ...item, quantity: 1 }];
      localStorage.setItem("cart", JSON.stringify(next));
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      localStorage.setItem("cart", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty < 1) return removeItem(id);
    setItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, quantity: qty } : i);
      localStorage.setItem("cart", JSON.stringify(next));
      return next;
    });
  }, [removeItem]);

  const clearCart = useCallback(() => save([]), []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
