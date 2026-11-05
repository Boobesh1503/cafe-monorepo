'use client';

import React, { useState, useEffect } from 'react';

export interface TrackedOrderItem {
  id: string;
  quantity: number;
  menuItem: { name: string };
  totalPrice: number;
}

export interface TrackedOrderData {
  orderId: string;
  createdAt: string;
  selectedBranch: string;
  items: TrackedOrderItem[];
  paymentMode: string;
  totalAmount: number;
}

interface OrderTrackingModalProps {
  orderId: string | null;
  orderData: TrackedOrderData | null;
  onClose: () => void;
}

export function OrderTrackingModal({ orderId, orderData, onClose }: OrderTrackingModalProps) {
  const [step, setStep] = useState(1);
  const [etaMinutes, setEtaMinutes] = useState(25);

  useEffect(() => {
    if (!orderId) return;
    setStep(1);
    setEtaMinutes(25);

    // Simulate progress: Step 1 -> Step 2 after 5s -> Step 3 after 12s
    const t1 = setTimeout(() => {
      setStep(2);
      setEtaMinutes(18);
    }, 5000);

    const t2 = setTimeout(() => {
      setStep(3);
      setEtaMinutes(10);
    }, 15000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [orderId]);

  if (!orderId || !orderData) return null;

  const steps = [
    { num: 1, title: 'Order Confirmed', sub: 'Restaurant accepted your order', icon: '📝' },
    { num: 2, title: 'Preparing in Kitchen', sub: 'Chef is cooking your fresh meal', icon: '🍳' },
    { num: 3, title: 'Out for Delivery', sub: 'Delivery partner on the way', icon: '🛵' },
    { num: 4, title: 'Delivered', sub: 'Enjoy your delicious Foodie Café meal!', icon: '✨' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1c1410] border border-[#3a271d] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-[#fbf7f0]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#2a1a13] to-[#1c1410] border-b border-[#3a271d] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">
                Live Order Tracking
              </span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#f7e2a9] mt-1">
              Order #{orderData.orderId}
            </h2>
            <p className="text-xs text-[#a99080]">
              Placed at {orderData.createdAt} • {orderData.selectedBranch}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#34241c] hover:bg-[#473024] flex items-center justify-center text-[#d2baa7]"
          >
            ✕
          </button>
        </div>

        {/* ETA Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#c4aca0]">Estimated Arrival</p>
            <p className="text-2xl font-serif font-black text-amber-400">{etaMinutes} mins</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full text-xs font-semibold">
              {steps[step - 1].title}
            </span>
          </div>
        </div>

        {/* Step Progression Timeline */}
        <div className="p-6 space-y-4">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#34241c]">
            {steps.map((s) => {
              const isDone = s.num <= step;
              const isCurrent = s.num === step;
              return (
                <div key={s.num} className="relative flex items-start gap-4">
                  <div
                    className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isDone
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white ring-4 ring-orange-500/20'
                        : 'bg-[#2a1d17] text-[#6b584d] border border-[#3a271d]'
                    }`}
                  >
                    {isDone ? '✔' : s.num}
                  </div>
                  <div>
                    <h4
                      className={`font-semibold text-sm flex items-center gap-1.5 ${
                        isCurrent ? 'text-amber-400 font-bold' : isDone ? 'text-[#fbf7f0]' : 'text-[#705e54]'
                      }`}
                    >
                      <span>{s.icon}</span>
                      {s.title}
                    </h4>
                    <p className="text-xs text-[#a99080]">{s.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ordered Items Summary */}
          <div className="mt-6 pt-4 border-t border-[#3a271d] space-y-2">
            <h5 className="text-xs font-bold text-[#c4aca0] uppercase tracking-wider">
              Order Summary ({orderData.items.length} items)
            </h5>
            <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
              {orderData.items.map((it) => (
                <div key={it.id} className="flex justify-between items-center text-xs py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#a99080] font-bold">{it.quantity}x</span>
                    <span className="text-[#fbf7f0]">{it.menuItem.name}</span>
                  </div>
                  <span className="font-semibold text-amber-400">₹{it.totalPrice}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-[#3a271d] flex justify-between text-sm font-bold text-[#f7e2a9]">
              <span>Total Paid ({orderData.paymentMode.toUpperCase()})</span>
              <span>₹{orderData.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#241a15] border-t border-[#3a271d] flex gap-3">
          <a
            href="tel:+919876543210"
            className="flex-1 py-2.5 bg-[#34241c] hover:bg-[#473024] rounded-xl text-center text-xs font-semibold text-[#f7e2a9] transition"
          >
            📞 Call Cafe Branch
          </a>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
