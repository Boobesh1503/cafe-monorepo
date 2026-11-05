'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useCart } from '../context/cart-context';
import type { TrackedOrderData } from './order-tracking-modal';

interface CartDrawerProps {
  onOpenOrderTracking: (orderId: string, orderData: TrackedOrderData) => void;
}

export function CartDrawer({ onOpenOrderTracking }: CartDrawerProps) {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    taxAmount,
    deliveryFee,
    grandTotal,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Checkout form fields
  const [orderType, setOrderType] = useState<'delivery' | 'pickup' | 'dinein'>('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('Anna Nagar Main Bistro');
  const [paymentMode, setPaymentMode] = useState<'upi' | 'cod' | 'card'>('upi');
  const [specialInstructions, setSpecialInstructions] = useState('');

  if (!isCartOpen) return null;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    if (promoCode.trim().toUpperCase() === 'FOODIE20') {
      const discountVal = Math.round(subtotal * 0.2);
      setDiscount(discountVal);
      setPromoApplied(true);
    } else {
      setPromoError('Invalid coupon. Try FOODIE20');
    }
  };

  const finalTotal = Math.max(0, grandTotal - discount);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || (orderType === 'delivery' && !deliveryAddress)) {
      alert('Please fill in your name, contact phone, and delivery address.');
      return;
    }

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const orderData = {
      orderId,
      items: [...items],
      customerName,
      customerPhone,
      deliveryAddress,
      orderType,
      selectedBranch,
      paymentMode,
      totalAmount: finalTotal,
      specialInstructions,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    clearCart();
    setIsCartOpen(false);
    setIsCheckingOut(false);
    onOpenOrderTracking(orderId, orderData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-[#1c1410] text-[#fbf7f0] border-l border-[#3a271d] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-[#3a271d] flex items-center justify-between bg-[#241a15]">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛒</span>
              <div>
                <h2 className="font-serif text-xl font-bold text-[#f7e2a9]">Your Food Basket</h2>
                <p className="text-xs text-[#a99080]">
                  {items.length} {items.length === 1 ? 'item' : 'items'} in order
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-full bg-[#34241c] hover:bg-[#473024] flex items-center justify-center text-[#d2baa7] hover:text-white transition"
              aria-label="Close cart"
            >
              ✕
            </button>
          </div>

          {/* Delivery threshold bar */}
          <div className="bg-[#2a1d17] px-5 py-2.5 border-b border-[#3a271d] text-xs">
            {subtotal >= 299 ? (
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <span>🎉</span>
                <span>Congratulations! You unlocked FREE Delivery!</span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-[#c4aca0]">
                  <span>Add ₹{299 - subtotal} more for FREE delivery</span>
                  <span className="font-semibold">{Math.round((subtotal / 299) * 100)}%</span>
                </div>
                <div className="w-full bg-[#1c1410] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotal / 299) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="text-5xl">🍔</div>
                <h3 className="font-serif text-lg font-bold text-[#f7e2a9]">Your cart is empty</h3>
                <p className="text-sm text-[#a99080] max-w-xs mx-auto">
                  Looks like you haven't added any delicious food yet! Explore our popular menu.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-4 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-full font-semibold text-sm shadow-lg hover:shadow-orange-500/20"
                >
                  Explore Menu
                </button>
              </div>
            ) : !isCheckingOut ? (
              // Cart items list
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#241a15] rounded-xl border border-[#3a271d] flex gap-3 items-center"
                  >
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-[#4a3528]">
                      <Image
                        src={item.menuItem.image}
                        alt={item.menuItem.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
                            item.menuItem.isVeg ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        />
                        <h4 className="font-semibold text-sm text-[#fbf7f0] truncate">
                          {item.menuItem.name}
                        </h4>
                      </div>
                      {item.selectedSize && (
                        <p className="text-xs text-amber-400">Size: {item.selectedSize}</p>
                      )}
                      {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                        <p className="text-xs text-[#a99080] truncate">
                          +{item.selectedAddOns.join(', ')}
                        </p>
                      )}
                      <p className="text-sm font-bold text-amber-400 mt-1">₹{item.totalPrice}</p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center bg-[#1c1410] border border-[#3a271d] rounded-lg overflow-hidden shrink-0">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-[#d2baa7] hover:bg-[#34241c] text-sm"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-[#fbf7f0]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-[#d2baa7] hover:bg-[#34241c] text-sm"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-[#887063] hover:text-red-400 text-sm p-1 ml-1"
                      title="Remove"
                    >
                      🗑
                    </button>
                  </div>
                ))}

                {/* Promo Code box */}
                <form onSubmit={handleApplyPromo} className="pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon code (FOODIE20)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 bg-[#241a15] border border-[#3a271d] rounded-lg px-3 py-2 text-xs text-white placeholder-[#887063] focus:outline-none focus:border-amber-500 uppercase"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#3a271d] hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Apply
                    </button>
                  </div>
                  {promoApplied && (
                    <p className="text-xs text-emerald-400 mt-1">✔ 20% Discount applied (-₹{discount})</p>
                  )}
                  {promoError && <p className="text-xs text-red-400 mt-1">{promoError}</p>}
                </form>
              </div>
            ) : (
              // Checkout Form
              <form onSubmit={handlePlaceOrder} id="checkout-form" className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#a99080] font-medium mb-1">Order Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['delivery', 'pickup', 'dinein'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setOrderType(mode)}
                        className={`py-2 rounded-lg font-semibold capitalize border transition ${
                          orderType === mode
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-[#241a15] border-[#3a271d] text-[#c4aca0]'
                        }`}
                      >
                        {mode === 'delivery' ? '🛵 Delivery' : mode === 'pickup' ? '🛍️ Takeaway' : '🍽️ Dine-in'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[#a99080] font-medium mb-1">Select Branch</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full bg-[#241a15] border border-[#3a271d] rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option>Anna Nagar Main Bistro (Central)</option>
                    <option>OMR IT Tech Park Branch</option>
                    <option>T. Nagar Shopping Plaza</option>
                    <option>Velachery Express Counter</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[#a99080] font-medium mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Chef Sanjay"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-[#241a15] border border-[#3a271d] rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[#a99080] font-medium mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-[#241a15] border border-[#3a271d] rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {orderType === 'delivery' && (
                  <div>
                    <label className="block text-[#a99080] font-medium mb-1">Delivery Address *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="House / Flat No., Street, Landmark, Pin code"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full bg-[#241a15] border border-[#3a271d] rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[#a99080] font-medium mb-1">Cooking Instructions (Optional)</label>
                  <input
                    type="text"
                    placeholder="Less spicy, extra napkins, cutlery etc."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full bg-[#241a15] border border-[#3a271d] rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[#a99080] font-medium mb-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'upi', label: '⚡ Instant UPI' },
                      { id: 'cod', label: '💵 Cash On Delivery' },
                      { id: 'card', label: '💳 Credit/Debit' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPaymentMode(p.id as 'upi' | 'cod' | 'card')}
                        className={`p-2 rounded-lg text-center font-medium border transition ${
                          paymentMode === p.id
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-[#241a15] border-[#3a271d] text-[#c4aca0]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Footer & Price Breakdown */}
          {items.length > 0 && (
            <div className="p-5 bg-[#241a15] border-t border-[#3a271d] space-y-3">
              <div className="space-y-1.5 text-xs text-[#c4aca0]">
                <div className="flex justify-between">
                  <span>Item Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Special Promo (FOODIE20)</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST & Restaurant Charges (5%)</span>
                  <span>₹{taxAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-400 font-bold">FREE</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#3a271d] flex justify-between text-base font-bold text-[#f7e2a9]">
                  <span>Total Amount</span>
                  <span>₹{finalTotal}</span>
                </div>
              </div>

              {!isCheckingOut ? (
                <button
                  onClick={() => setIsCheckingOut(true)}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl text-sm shadow-xl flex items-center justify-center gap-2 transition"
                >
                  Proceed to Checkout • ₹{finalTotal} →
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckingOut(false)}
                    className="px-4 py-3 bg-[#34241c] hover:bg-[#473024] text-[#d2baa7] rounded-xl text-xs font-semibold"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    form="checkout-form"
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-sm shadow-xl flex items-center justify-center gap-2 transition"
                  >
                    Confirm Order • Pay ₹{finalTotal} ✔
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
