'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  FOODIE_CATEGORIES,
  FOODIE_MENU_ITEMS,
  type FoodieItem,
} from '../data/foodie-menu';
import { useCart } from '../context/cart-context';

interface FoodieFullMenuProps {
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  searchQuery: string;
  onCustomizeItem: (item: FoodieItem) => void;
}

export function FoodieFullMenu({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onCustomizeItem,
}: FoodieFullMenuProps) {
  const { addToCart } = useCart();
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc' | 'rating'>('recommended');
  const [addedItemNotice, setAddedItemNotice] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return FOODIE_MENU_ITEMS.filter((item) => {
      // Category match
      if (selectedCategory && item.category !== selectedCategory) {
        return false;
      }
      // Dietary match
      if (dietaryFilter === 'veg' && !item.isVeg) return false;
      if (dietaryFilter === 'nonveg' && item.isVeg) return false;
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCat = item.categoryName.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesDesc) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0);
    });
  }, [selectedCategory, dietaryFilter, searchQuery, sortBy]);

  const handleQuickAdd = (item: FoodieItem) => {
    addToCart(item, { quantity: 1 });
    setAddedItemNotice(item.name);
    setTimeout(() => setAddedItemNotice(null), 2500);
  };

  return (
    <section className="foodie-full-menu-section py-12 px-4 max-w-7xl mx-auto" id="full-menu">
      {/* Toast Notification on Add */}
      {addedItemNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1c1410] border border-amber-500/60 shadow-2xl rounded-full px-5 py-2.5 flex items-center gap-2.5 text-xs text-white animate-bounce">
          <span className="text-amber-400">✔</span>
          <span>Added <strong>{addedItemNotice}</strong> to your basket!</span>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ebdcd0] shadow-sm mb-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Section Heading */}
          <div>
            <h3 className="font-serif text-2xl font-black text-[#2e1c14] tracking-tight">
              {selectedCategory
                ? FOODIE_CATEGORIES.find((c) => c.id === selectedCategory)?.name || 'Menu'
                : 'All Foodie Delights'}
            </h3>
            <p className="text-xs text-[#7e6b60] mt-0.5">
              Showing {filteredItems.length} freshly crafted dishes
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* All items */}
            <button
              onClick={() => onSelectCategory(null)}
              className={`px-3.5 py-1.5 rounded-full font-semibold border transition ${
                selectedCategory === null
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-white text-[#523d32] border-[#ebdcd0] hover:border-amber-400'
              }`}
            >
              All Categories
            </button>

            {/* Veg toggle */}
            <button
              onClick={() => setDietaryFilter(dietaryFilter === 'veg' ? 'all' : 'veg')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold border transition ${
                dietaryFilter === 'veg'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Veg Only
            </button>

            {/* Non-veg toggle */}
            <button
              onClick={() => setDietaryFilter(dietaryFilter === 'nonveg' ? 'all' : 'nonveg')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold border transition ${
                dietaryFilter === 'nonveg'
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              Non-Veg
            </button>

            {/* Sorting selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recommended' | 'price-asc' | 'price-desc' | 'rating')}
              className="px-3 py-1.5 bg-white border border-[#ebdcd0] rounded-full text-[#523d32] font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="recommended">Sort: Popular</option>
              <option value="rating">Sort: High Rating</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Shortcut Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {FOODIE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCategory(c.id === selectedCategory ? null : c.id)}
              className={`px-3 py-1 rounded-lg shrink-0 font-medium transition ${
                selectedCategory === c.id
                  ? 'bg-[#2e1c14] text-amber-300 shadow-sm'
                  : 'bg-[#f5ece3] text-[#5e493e] hover:bg-[#ebdcd0]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#ebdcd0] space-y-3">
          <span className="text-4xl">🔍</span>
          <h4 className="font-serif text-lg font-bold text-[#2e1c14]">No dishes found</h4>
          <p className="text-xs text-[#7e6b60]">
            Try adjusting your search query or removing dietary filters.
          </p>
          <button
            onClick={() => {
              onSelectCategory(null);
              setDietaryFilter('all');
            }}
            className="px-5 py-2 bg-amber-500 text-white text-xs font-bold rounded-full shadow"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-[#ebdcd0] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col group"
            >
              {/* Product Image Stage */}
              <div className="relative h-44 w-full bg-[#f4ebe1] overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Dietary Badge */}
                <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center bg-white shadow-sm ${
                      item.isVeg ? 'border-emerald-600' : 'border-red-600'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.isVeg ? 'bg-emerald-600' : 'bg-red-600'
                      }`}
                    />
                  </span>
                  {item.isBestseller && (
                    <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-md shadow-sm uppercase tracking-wider flex items-center gap-1">
                      👑 Bestseller
                    </span>
                  )}
                </div>

                {/* Rating Badge */}
                <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 shadow">
                  <span className="text-amber-400">★</span>
                  <span>{item.rating}</span>
                  <span className="text-gray-300 text-[9px]">({item.reviewCount})</span>
                </div>
              </div>

              {/* Product Content */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-serif text-base font-bold text-[#2e1c14] group-hover:text-amber-600 transition-colors">
                      {item.name}
                    </h4>
                    <span className="font-serif font-black text-amber-600 text-base shrink-0">
                      ₹{item.price}
                    </span>
                  </div>
                  <p className="text-xs text-[#7e6b60] line-clamp-2 mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Action Row */}
                <div className="mt-4 pt-3 border-t border-[#f4ebe1] flex items-center gap-2">
                  <button
                    onClick={() => onCustomizeItem(item)}
                    className="flex-1 py-2 bg-[#f5ece3] hover:bg-[#ebdcd0] text-[#5e493e] rounded-xl text-xs font-semibold transition text-center"
                  >
                    Customize
                  </button>
                  <button
                    onClick={() => handleQuickAdd(item)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition flex items-center gap-1"
                  >
                    <span>+</span> Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
