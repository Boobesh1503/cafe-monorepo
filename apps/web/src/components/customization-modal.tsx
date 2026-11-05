'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { FoodieItem } from '../data/foodie-menu';
import { useCart } from '../context/cart-context';

interface CustomizationModalProps {
  item: FoodieItem | null;
  onClose: () => void;
}

export function CustomizationModal({ item, onClose }: CustomizationModalProps) {
  const { addToCart } = useCart();

  const [selectedSize, setSelectedSize] = useState<string>(
    item?.customizations?.sizes?.[0]?.name || '',
  );
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedSpice, setSelectedSpice] = useState<string>(
    item?.customizations?.spiceLevels?.[0] || '',
  );
  const [quantity, setQuantity] = useState(1);

  if (!item) return null;

  // Compute live price
  let currentPrice = item.price;
  if (selectedSize && item.customizations?.sizes) {
    const s = item.customizations.sizes.find((x) => x.name === selectedSize);
    if (s) currentPrice += s.priceDelta;
  }
  if (selectedAddOns.length && item.customizations?.addOns) {
    for (const ao of selectedAddOns) {
      const a = item.customizations.addOns.find((x) => x.name === ao);
      if (a) currentPrice += a.price;
    }
  }
  const totalItemPrice = currentPrice * quantity;

  const toggleAddOn = (name: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const handleConfirmAddToCart = () => {
    addToCart(item, {
      size: selectedSize || undefined,
      addOns: selectedAddOns,
      quantity,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1c1410] border border-[#3a271d] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-[#fbf7f0] flex flex-col max-h-[90vh]">
        {/* Item Header Image */}
        <div className="relative h-48 w-full shrink-0">
          <Image src={item.image} alt={item.name} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1410] via-transparent to-black/40" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition"
          >
            ✕
          </button>
          <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-3 h-3 rounded-full ${
                    item.isVeg ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                />
                <h3 className="font-serif text-xl font-bold text-white">{item.name}</h3>
              </div>
              <p className="text-xs text-[#d2baa7] line-clamp-1 mt-0.5">{item.description}</p>
            </div>
            <span className="text-lg font-black text-amber-400">₹{item.price}</span>
          </div>
        </div>

        {/* Scrollable Customization Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Sizes */}
          {item.customizations?.sizes && item.customizations.sizes.length > 0 && (
            <div>
              <h4 className="font-bold text-[#f7e2a9] uppercase tracking-wider mb-2">
                Choose Portion Size
              </h4>
              <div className="space-y-1.5">
                {item.customizations.sizes.map((s) => (
                  <label
                    key={s.name}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                      selectedSize === s.name
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                        : 'bg-[#241a15] border-[#3a271d] text-[#c4aca0]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="item-size"
                        checked={selectedSize === s.name}
                        onChange={() => setSelectedSize(s.name)}
                        className="accent-amber-500"
                      />
                      <span>{s.name}</span>
                    </div>
                    <span>{s.priceDelta > 0 ? `+₹${s.priceDelta}` : 'Default'}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Spice Levels */}
          {item.customizations?.spiceLevels && (
            <div>
              <h4 className="font-bold text-[#f7e2a9] uppercase tracking-wider mb-2">Spice Level</h4>
              <div className="grid grid-cols-3 gap-2">
                {item.customizations.spiceLevels.map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => setSelectedSpice(sp)}
                    className={`py-2 rounded-lg font-medium border transition ${
                      selectedSpice === sp
                        ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                        : 'bg-[#241a15] border-[#3a271d] text-[#c4aca0]'
                    }`}
                  >
                    {sp === 'Spicy' ? '🌶️ Spicy' : sp === 'Mild' ? '🌱 Mild' : '🔥 Medium'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {item.customizations?.addOns && item.customizations.addOns.length > 0 && (
            <div>
              <h4 className="font-bold text-[#f7e2a9] uppercase tracking-wider mb-2">
                Extra Add-ons & Toppings
              </h4>
              <div className="space-y-1.5">
                {item.customizations.addOns.map((ao) => {
                  const isChecked = selectedAddOns.includes(ao.name);
                  return (
                    <label
                      key={ao.name}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                          : 'bg-[#241a15] border-[#3a271d] text-[#c4aca0]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAddOn(ao.name)}
                          className="accent-amber-500 rounded"
                        />
                        <span>{ao.name}</span>
                      </div>
                      <span className="font-semibold">+₹{ao.price}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Quantity & Add Button */}
        <div className="p-4 bg-[#241a15] border-t border-[#3a271d] flex items-center justify-between gap-4">
          <div className="flex items-center bg-[#1c1410] border border-[#3a271d] rounded-xl overflow-hidden">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-9 h-9 flex items-center justify-center text-[#d2baa7] hover:bg-[#34241c] text-base"
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-bold text-white">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-9 h-9 flex items-center justify-center text-[#d2baa7] hover:bg-[#34241c] text-base"
            >
              +
            </button>
          </div>

          <button
            onClick={handleConfirmAddToCart}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl text-sm shadow-xl flex items-center justify-center gap-2 transition"
          >
            Add to Order • ₹{totalItemPrice}
          </button>
        </div>
      </div>
    </div>
  );
}

