'use client';

import React, { useRef } from 'react';
import Image from 'next/image';

export interface CategoryItem {
  id: string;
  name: string;
  image: string;
}

export const CATEGORIES_LIST: CategoryItem[] = [
  { id: 'burgers', name: 'Burgers', image: '/categories/card-burgers.jpg' },
  { id: 'pizza', name: 'Pizza', image: '/categories/card-pizza.jpg' },
  { id: 'sandwiches', name: 'Sandwiches', image: '/categories/card-sandwiches.jpg' },
  { id: 'pasta', name: 'Pasta', image: '/categories/card-pasta.jpg' },
  { id: 'starters', name: 'Starters', image: '/categories/card-starters.jpg' },
  { id: 'momos', name: 'Momos', image: '/categories/card-momos.jpg' },
  { id: 'indian-specials', name: 'Indian Specials', image: '/categories/card-indian-specials.jpg' },
  { id: 'desserts', name: 'Desserts', image: '/categories/card-desserts.jpg' },
  { id: 'milkshakes', name: 'Milkshakes', image: '/categories/card-milkshakes.jpg' },
  { id: 'beverages', name: 'Beverages', image: '/categories/card-beverages.jpg' },
  { id: 'juices', name: 'Juices', image: '/categories/card-juices.jpg' },
  { id: 'combos', name: 'Combos', image: '/categories/card-combos.jpg' },
];

interface FoodieCategoriesProps {
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

export function FoodieCategories({
  selectedCategory,
  onSelectCategory,
}: FoodieCategoriesProps) {
  const scrollTrackRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollTrackRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      scrollTrackRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section className="foodie-categories-section py-8 px-4 max-w-7xl mx-auto" id="categories">
      <div className="categories-header-wrap text-center mb-6">
        <p className="text-amber-600 text-xs font-bold tracking-[0.25em] uppercase mb-1">
          — EXPLORE OUR MENU —
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl font-black text-[#2e1c14] tracking-tight">
          Popular Categories
        </h2>
        <p className="text-[#7e6b60] text-sm mt-1">Something delicious for every craving.</p>
      </div>

      <div className="categories-slider-container relative flex items-center">
        {/* Scroll Left Button */}
        <button
          type="button"
          className="cat-scroll-arrow arrow-left absolute -left-2 z-10 w-9 h-9 rounded-full bg-white/90 border border-[#e2d5c8] shadow-md hover:bg-amber-500 hover:text-white flex items-center justify-center text-lg font-bold text-[#4a3528] transition hidden sm:flex"
          onClick={() => handleScroll('left')}
          aria-label="Scroll categories left"
        >
          ‹
        </button>

        {/* Scrollable track of category cards */}
        <div
          className="categories-track flex gap-3 overflow-x-auto pb-4 pt-1 px-2 scroll-smooth no-scrollbar w-full"
          ref={scrollTrackRef}
        >
          {CATEGORIES_LIST.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`category-card-pill shrink-0 flex flex-col items-center bg-white rounded-2xl p-2.5 border transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 w-28 sm:w-32 group ${
                  isSelected
                    ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/50 shadow-amber-500/10'
                    : 'border-[#ebdcd0] hover:border-amber-400'
                }`}
                onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                aria-pressed={isSelected}
              >
                <div className="cat-img-box relative w-full h-16 sm:h-20 rounded-xl overflow-hidden mb-2 bg-[#f4ebe1]">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="cat-thumbnail object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <span
                  className={`cat-name-label text-xs font-bold tracking-tight text-center truncate w-full ${
                    isSelected ? 'text-amber-700' : 'text-[#38261e] group-hover:text-amber-600'
                  }`}
                >
                  {cat.name}
                </span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Scroll Right Button */}
        <button
          type="button"
          className="cat-scroll-arrow arrow-right absolute -right-2 z-10 w-9 h-9 rounded-full bg-white/90 border border-[#e2d5c8] shadow-md hover:bg-amber-500 hover:text-white flex items-center justify-center text-lg font-bold text-[#4a3528] transition hidden sm:flex"
          onClick={() => handleScroll('right')}
          aria-label="Scroll categories right"
        >
          ›
        </button>
      </div>
    </section>
  );
}
