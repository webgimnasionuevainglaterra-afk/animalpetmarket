"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type CartItem = {
  productId: string;
  nombre: string;
  presentacion: string;
  precio: number;
  cantidad: number;
  imagen: string | null;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "cantidad">) => void;
  removeFromCart: (productId: string, presentacion: string) => void;
  updateCantidad: (productId: string, presentacion: string, cantidad: number) => void;
  getTotalItems: () => number;
  getTotalPrecio: () => number;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "petmarket-cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveCart(items);
  }, [items, mounted]);

  const addToCart = useCallback(
    (item: Omit<CartItem, "cantidad">) => {
      setItems((prev) => {
        const idx = prev.findIndex(
          (i) => i.productId === item.productId && i.presentacion === item.presentacion
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], cantidad: next[idx].cantidad + 1 };
          return next;
        }
        return [...prev, { ...item, cantidad: 1 }];
      });
    },
    []
  );

  const removeFromCart = useCallback(
    (productId: string, presentacion: string) => {
      setItems((prev) =>
        prev.filter(
          (i) => !(i.productId === productId && i.presentacion === presentacion)
        )
      );
    },
    []
  );

  const MAX_CANTIDAD = 999;

  const updateCantidad = useCallback(
    (productId: string, presentacion: string, cantidad: number) => {
      if (cantidad < 1) {
        removeFromCart(productId, presentacion);
        return;
      }
      const cant = Math.min(Math.floor(cantidad), MAX_CANTIDAD);
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId && i.presentacion === presentacion
            ? { ...i, cantidad: cant }
            : i
        )
      );
    },
    [removeFromCart]
  );

  const getTotalItems = useCallback(
    () => items.reduce((sum, i) => sum + i.cantidad, 0),
    [items]
  );

  const getTotalPrecio = useCallback(
    () => items.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
    [items]
  );

  const clearCart = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateCantidad,
        getTotalItems,
        getTotalPrecio,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
