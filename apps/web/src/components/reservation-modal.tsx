'use client';

import React, { useState } from 'react';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReservationModal({ isOpen, onClose }: ReservationModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [branch, setBranch] = useState('Anna Nagar Main Bistro');
  const [guests, setGuests] = useState('2');
  const [date, setDate] = useState('2026-11-06');
  const [time, setTime] = useState('19:30');
  const [occasion, setOccasion] = useState('Casual Dining');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1c1410] border border-[#3a271d] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-[#fbf7f0]">
        <div className="p-5 bg-gradient-to-r from-[#2e1d15] to-[#1c1410] border-b border-[#3a271d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🥂</span>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#f7e2a9]">Table Reservation</h3>
              <p className="text-xs text-[#a99080]">Book your premium dining table at Foodie Café</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#34241c] hover:bg-[#473024] flex items-center justify-center text-[#d2baa7]"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl">
              🎉
            </div>
            <h4 className="font-serif text-2xl font-bold text-[#f7e2a9]">Table Reserved!</h4>
            <p className="text-xs text-[#c4aca0] leading-relaxed">
              Thank you <strong>{name}</strong>! Your table for <strong>{guests} guests</strong> at{' '}
              <strong>{branch}</strong> has been reserved for <strong>{date} at {time}</strong>.
            </p>
            <div className="p-3 bg-[#241a15] rounded-xl border border-[#3a271d] text-xs text-amber-400 font-semibold">
              Booking Ref: #RES-{Date.now().toString().slice(-5)} (SMS confirmation sent to {phone})
            </div>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-bold"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
            <div>
              <label className="block text-[#a99080] font-medium mb-1">Select Branch</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full bg-[#241a15] border border-[#3a271d] rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
              >
                <option>Anna Nagar Main Bistro</option>
                <option>OMR IT Tech Park Branch</option>
                <option>T. Nagar Shopping Plaza</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[#a99080] font-medium mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#241a15] border border-[#3a271d] rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[#a99080] font-medium mb-1">Time Slot</label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[#241a15] border border-[#3a271d] rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="12:30">12:30 PM (Lunch)</option>
                  <option value="13:30">01:30 PM (Lunch)</option>
                  <option value="17:00">05:00 PM (High Tea)</option>
                  <option value="19:30">07:30 PM (Dinner)</option>
                  <option value="20:30">08:30 PM (Dinner)</option>
                  <option value="21:30">09:30 PM (Late Dinner)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[#a99080] font-medium mb-1">Guests</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full bg-[#241a15] border border-[#3a271d] rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="1">1 Person</option>
                  <option value="2">2 Persons (Couple)</option>
                  <option value="3-4">3 - 4 Persons</option>
                  <option value="5-8">5 - 8 Persons (Family)</option>
                  <option value="10+">10+ Persons (Party)</option>
                </select>
              </div>
              <div>
                <label className="block text-[#a99080] font-medium mb-1">Occasion</label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full bg-[#241a15] border border-[#3a271d] rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option>Casual Dining</option>
                  <option>Birthday Celebration</option>
                  <option>Anniversary Date</option>
                  <option>Business Meeting</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[#a99080] font-medium mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#241a15] border border-[#3a271d] rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[#a99080] font-medium mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#241a15] border border-[#3a271d] rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs shadow-lg transition"
              >
                Confirm Table Reservation 🥂
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

