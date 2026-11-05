'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { FoodieItem } from '../data/foodie-menu';

export interface CartItem {
  id: string; // unique cart line id (item.id + size + addOns)
  menuItem: FoodieItem;
  quantity: number;
  selectedSize?: string;
  selectedAddOns?: string[];
  unitPrice: number;
  totalPrice: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: FoodieItem, options?: { size?: string; addOns?: string[]; quantity?: number }) => void;
  removeFromCart: (cartLineId: string) => void;
  updateQuantity: (cartLineId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  grandTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Initialize with the 3 items shown in screenshot badge if empty on first load
  useEffect(() => {
    const saved = localStorage.getItem('foodie_cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
        return;
      } catch {
        // fallback to default
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('foodie_cart', JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addToCart = (
    item: FoodieItem,
    options?: { size?: string; addOns?: string[]; quantity?: number },
  ) => {
    const size = options?.size;
    const addOns = options?.addOns || [];
    const qty = options?.quantity || 1;

    let unitPrice = item.price;
    if (size && item.customizations?.sizes) {
      const sizeObj = item.customizations.sizes.find((s) => s.name === size);
      if (sizeObj) unitPrice += sizeObj.priceDelta;
    }
    if (addOns.length && item.customizations?.addOns) {
      for (const ao of addOns) {
        const found = item.customizations.addOns.find((a) => a.name === ao);
        if (found) unitPrice += found.price;
      }
    }

    const lineId = `${item.id}-${size || 'std'}-${addOns.sort().join('-')}`;

    setItems((prev) => {
      const existing = prev.find((i) => i.id === lineId);
      if (existing) {
        const newQty = existing.quantity + qty;
        return prev.map((i) =>
          i.id === lineId
            ? { ...i, quantity: newQty, totalPrice: newQty * unitPrice }
            : i,
        );
      }
      return [
        ...prev,
        {
          id: lineId,
          menuItem: item,
          quantity: qty,
          selectedSize: size,
          selectedAddOns: addOns,
          unitPrice,
          totalPrice: qty * unitPrice,
        },
      ];
    });
  };

  const removeFromCart = (cartLineId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartLineId));
  };

  const updateQuantity = (cartLineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartLineId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.id === cartLineId
          ? { ...i, quantity, totalPrice: quantity * i.unitPrice }
          : i,
      ),
    );
  };

  const clearCart = () => setItems([]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxAmount = Math.round(subtotal * 0.05); // 5% GST
  const deliveryFee = subtotal === 0 ? 0 : subtotal >= 299 ? 0 : 30;
  const grandTotal = subtotal + taxAmount + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        taxAmount,
        deliveryFee,
        grandTotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

