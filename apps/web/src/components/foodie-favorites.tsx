'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export interface FoodDish {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  rating: number;
  ratingCount: string;
  isVeg: boolean;
  isBestseller?: boolean;
  image: string;
}

export const FAVORITES_DATA: FoodDish[] = [
  {
    id: 'crispy-chicken-burger',
    name: 'Crispy Chicken Burger',
    category: 'burgers',
    description: 'Crispy chicken, fresh lettuce, cheese & our special sauce.',
    price: 149,
    rating: 4.7,
    ratingCount: '1.2k',
    isVeg: false,
    isBestseller: true,
    image: '/items/crispy-chicken-burger.jpg',
  },
  {
    id: 'loaded-cheese-pizza',
    name: 'Loaded Cheese Pizza',
    category: 'pizza',
    description: 'Rich cheese, fresh veggies and flavorful sauce.',
    price: 279,
    rating: 4.6,
    ratingCount: '980',
    isVeg: true,
    isBestseller: false,
    image: '/items/margherita-pizza.jpg',
  },
  {
    id: 'white-sauce-pasta',
    name: 'White Sauce Pasta',
    category: 'pasta',
    description: 'Creamy, cheesy and perfectly seasoned.',
    price: 179,
    rating: 4.5,
    ratingCount: '740',
    isVeg: true,
    isBestseller: false,
    image: '/items/white-sauce-pasta.jpg',
  },
  {
    id: 'oreo-milkshake',
    name: 'Oreo Milkshake',
    category: 'milkshakes',
    description: 'Thick, creamy and chocolatey delight.',
    price: 139,
    rating: 4.6,
    ratingCount: '1.1k',
    isVeg: true,
    isBestseller: false,
    image: '/items/oreo-milkshake.jpg',
  },
];

interface FoodieFavoritesProps {
  onAddToCart: (dish: FoodDish, quantity: number) => void;
  selectedCategory: string | null;
  searchQuery: string;
}

export function FoodieFavorites({
  onAddToCart,
  selectedCategory,
  searchQuery,
}: FoodieFavoritesProps) {
  // Local quantity counters for each dish
  const [quantities, setQuantities] = useState<Record<string, number>>({
    'crispy-chicken-burger': 1,
    'loaded-cheese-pizza': 1,
    'white-sauce-pasta': 1,
    'oreo-milkshake': 1,
  });

  // Active combo slide
  const [comboIndex, setComboIndex] = useState(0);

  const updateQuantity = (id: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 1;
      const next = Math.max(1, Math.min(20, current + delta));
      return { ...prev, [id]: next };
    });
  };

  // Filter items based on category and search
  const filteredDishes = FAVORITES_DATA.filter((dish) => {
    const matchesCategory = !selectedCategory || dish.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="foodie-favorites-section" id="offers">
      <div className="favorites-header-bar">
        <div className="fav-title-wrap">
          <h2 className="fav-main-title">Customer Favorites</h2>
          <p className="fav-subtitle">The delicious picks everyone keeps coming back for.</p>
        </div>
        <a href="#menu" className="view-all-link">
          <span>View All</span>
          <span className="arrow-icon" aria-hidden="true">→</span>
        </a>
      </div>

      <div className="favorites-layout-grid">
        {/* Dishes Column / Subgrid */}
        <div className="dishes-subgrid">
          {filteredDishes.length > 0 ? (
            filteredDishes.map((dish) => {
              const qty = quantities[dish.id] || 1;
              return (
                <div key={dish.id} className="food-dish-card">
                  {/* Card Badges Row */}
                  <div className="dish-badge-row">
                    {dish.isBestseller ? (
                      <span className="bestseller-badge">
                        <span className="crown-icon">👑</span> Bestseller
                      </span>
                    ) : <span />}

                    {/* Veg / Non-Veg Indicator Icon */}
                    <span
                      className={`dietary-dot-indicator ${dish.isVeg ? 'veg-indicator' : 'nonveg-indicator'}`}
                      title={dish.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                      aria-label={dish.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                    >
                      <span className="dot-circle" />
                    </span>
                  </div>

                  {/* Dish Thumbnail */}
                  <div className="dish-img-stage">
                    <Image
                      src={dish.image}
                      alt={dish.name}
                      width={140}
                      height={90}
                      className="dish-thumbnail-img"
                    />
                  </div>

                  {/* Dish Information */}
                  <div className="dish-info-content">
                    <h3 className="dish-title">{dish.name}</h3>
                    <p className="dish-description">{dish.description}</p>

                    {/* Price and Rating Row */}
                    <div className="price-rating-row">
                      <div className="dish-price-tag">
                        <span className="currency-symbol">₹</span>
                        <span className="price-val">{dish.price}</span>
                      </div>
                      <div className="rating-pill">
                        <span className="star-icon">★</span>
                        <span className="rating-number">{dish.rating}</span>
                        <span className="rating-count">({dish.ratingCount})</span>
                      </div>
                    </div>

                    {/* Counter & Add to Cart Controls */}
                    <div className="dish-actions-row">
                      <div className="quantity-counter">
                        <button
                          type="button"
                          className="counter-btn minus-btn"
                          onClick={() => updateQuantity(dish.id, -1)}
                          aria-label={`Decrease ${dish.name} quantity`}
                        >
                          −
                        </button>
                        <span className="counter-val">{qty}</span>
                        <button
                          type="button"
                          className="counter-btn plus-btn"
                          onClick={() => updateQuantity(dish.id, 1)}
                          aria-label={`Increase ${dish.name} quantity`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="add-to-cart-btn"
                        onClick={() => onAddToCart(dish, qty)}
                        aria-label={`Add ${dish.name} to cart`}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-matches-box">
              <p>No dishes found matching &quot;{searchQuery || selectedCategory}&quot;.</p>
              <button
                type="button"
                className="reset-filter-btn"
                onClick={() => window.location.reload()}
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        {/* Special Combo Promo Card (Right Side Banner) */}
        <div className="combo-promo-card">
          <div className="combo-card-header">
            <div className="combo-tag-pill">
              <span className="tag-icon">🏷️</span>
              <span>Special Combo Offers</span>
            </div>
            <h3 className="combo-card-title">More Food, More Happiness.</h3>
          </div>

          <div className="combo-image-stage">
            <div className="combo-save-ribbon">
              <span>Save ₹70</span>
            </div>
            <Image
              src="/items/burger-fries-drink.jpg"
              alt="Burger + Fries + Drink Combo"
              width={260}
              height={140}
              className="combo-img animate-float-slow object-cover rounded-xl"
            />
          </div>

          <div className="combo-details-bottom">
            <p className="combo-combo-label">Burger + Fries + Drink Combo</p>
            <div className="combo-price-action-row">
              <div className="combo-prices">
                <span className="combo-strikethrough">₹319</span>
                <span className="combo-final-price">₹249</span>
              </div>
              <button
                type="button"
                className="grab-offer-btn"
                onClick={() =>
                  onAddToCart(
                    {
                      id: 'special-burger-combo',
                      name: 'Burger + Fries + Drink Combo',
                      category: 'combos',
                      description: 'Special weekend saver combo pack.',
                      price: 249,
                      rating: 4.9,
                      ratingCount: '2k',
                      isVeg: false,
                      image: '/fav-combo.png',
                    },
                    1,
                  )
                }
              >
                <span>Grab the Offer</span>
                <span className="btn-arrow" aria-hidden="true">→</span>
              </button>
            </div>

            {/* Slider Dots Indicator */}
            <div className="combo-carousel-dots" aria-hidden="true">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`dot-pill ${comboIndex === idx ? 'dot-active' : ''}`}
                  onClick={() => setComboIndex(idx)}
                  aria-label={`Combo slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
