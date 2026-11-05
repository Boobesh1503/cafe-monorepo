'use client';

import React from 'react';

export function FoodieFeatures() {
  const features = [
    {
      id: 'fast-delivery',
      title: 'Fast Delivery',
      subtitle: 'Get your food at your doorstep.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="2">
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
    },
    {
      id: 'safe-hygienic',
      title: 'Safe & Hygienic',
      subtitle: 'Prepared with highest food safety.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'quality-ingredients',
      title: 'Quality Ingredients',
      subtitle: 'Fresh and carefully selected.',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="2">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      ),
    },
    {
      id: 'support-247',
      title: 'Support 24/7',
      subtitle: "We're always here for you.",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="2">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="foodie-features-bar">
      <div className="features-container">
        {features.map((feat) => (
          <div key={feat.id} className="feature-block-item">
            <div className="feature-icon-wrapper">{feat.icon}</div>
            <div className="feature-text-wrapper">
              <h4 className="feature-item-title">{feat.title}</h4>
              <p className="feature-item-subtitle">{feat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
