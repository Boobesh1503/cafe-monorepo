'use client';

import React from 'react';
import Image from 'next/image';

interface FoodieHeroProps {
  onExploreMenu: () => void;
  onOrderNow: () => void;
}

export function FoodieHero({ onExploreMenu, onOrderNow }: FoodieHeroProps) {
  return (
    <section className="foodie-hero-section" id="home">
      {/* Background ambient lighting glows */}
      <div className="hero-ambient-glow glow-1" />
      <div className="hero-ambient-glow glow-2" />

      <div className="hero-inner-container">
        {/* Left Column: Copy & CTAs */}
        <div className="hero-content-col">
          {/* Freshly Made Pill Tag */}
          <div className="fresh-pill-badge animate-fade-in-up">
            <span className="pill-dot" />
            <span className="pill-text">FRESHLY MADE • ALWAYS DELICIOUS</span>
          </div>

          {/* Hero Main Heading with Mood Accent Rays */}
          <h1 className="hero-title animate-fade-in-up delay-100">
            Good Food.
            <br />
            <span className="mood-highlight">
              Great Mood.
              <span className="mood-rays" aria-hidden="true">
                <span className="ray ray-1" />
                <span className="ray ray-2" />
                <span className="ray ray-3" />
              </span>
            </span>
          </h1>

          {/* Subtitle Description */}
          <p className="hero-subtitle animate-fade-in-up delay-200">
            Your cravings deserve something special. Discover freshly prepared meals, delicious
            bites and refreshing drinks at Foodie Café.
          </p>

          {/* CTA Buttons */}
          <div className="hero-cta-group animate-fade-in-up delay-300">
            <button
              type="button"
              className="btn-primary-explore"
              onClick={onExploreMenu}
              aria-label="Explore Menu"
            >
              <span>Explore Menu</span>
              <svg
                className="btn-arrow-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                width="18"
                height="18"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            <button
              type="button"
              className="btn-secondary-order"
              onClick={onOrderNow}
              aria-label="Order Now"
            >
              <svg
                className="order-cart-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                width="18"
                height="18"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <span>Order Now</span>
            </button>
          </div>

          {/* 3 Trust Badges */}
          <div className="hero-trust-row animate-fade-in-up delay-400">
            <div className="trust-item">
              <span className="trust-icon-leaf">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#68D391" strokeWidth="2">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </span>
              <span className="trust-text">Fresh Ingredients</span>
            </div>

            <div className="trust-item">
              <span className="trust-icon-chef">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F6AD55" strokeWidth="2">
                  <path d="M6 13.8V4a2 2 0 1 1 4 0v9.8M14 13.8V4a2 2 0 1 1 4 0v9.8M10 14h4M6 18h12a2 2 0 0 1 2 2v1H4v-1a2 2 0 0 1 2-2Z" />
                </svg>
              </span>
              <span className="trust-text">Made with Care</span>
            </div>

            <div className="trust-item">
              <span className="trust-icon-bike">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F6AD55" strokeWidth="2">
                  <circle cx="5.5" cy="17.5" r="3.5" />
                  <circle cx="18.5" cy="17.5" r="3.5" />
                  <path d="M15 6h4l2 5-3 2M9 17l3-6 4 1M5.5 17.5H9" />
                </svg>
              </span>
              <span className="trust-text">Quick Delivery</span>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Food Visual Presentation */}
        <div className="hero-visual-col animate-fade-in delay-200">
          <div className="hero-food-stage">
            {/* Ambient Backlight glow */}
            <div className="food-backlight-radial" />

            {/* Main Hero Food Composition */}
            <div className="hero-food-card-wrapper animate-float">
              <Image
                src="/hero-food.jpg"
                alt="Foodie Café Specialties: Gourmet Burger, Loaded Pizza, French Fries & Milkshake"
                width={614}
                height={360}
                className="hero-food-main-img"
                priority
              />
            </div>

            {/* Floating Floating Rating Tag */}
            <div className="floating-badge badge-top-right animate-float-slow">
              <span className="badge-star">★</span>
              <div className="badge-text-col">
                <strong>4.9 Rating</strong>
                <small>2.5k+ Foodies</small>
              </div>
            </div>

            {/* Floating Chef Recommendation Tag */}
            <div className="floating-badge badge-bottom-left animate-float-reverse">
              <span className="badge-emoji">🔥</span>
              <div className="badge-text-col">
                <strong>Hot & Crispy</strong>
                <small>Fresh out the oven</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Wavy Transition to Warm Cream Body */}
      <div className="hero-wavy-divider" aria-hidden="true">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="wave-svg"
        >
          <path
            d="M0 40C240 70 480 15 720 45C960 75 1200 20 1440 50V80H0V40Z"
            fill="#FAF7F2"
          />
        </svg>
      </div>
    </section>
  );
}
