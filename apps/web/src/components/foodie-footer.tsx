'use client';

import React from 'react';
import Image from 'next/image';

export function FoodieFooter() {
  return (
    <footer className="foodie-footer-section" id="contact">
      <div className="footer-top-wrap">
        <div className="footer-brand-col">
          <div className="footer-logo-row">
            <Image
              src="/logo.jpg"
              alt="Foodie Café"
              width={48}
              height={48}
              className="footer-logo-img"
            />
            <div className="footer-logo-name">
              <span>Foodie</span>
              <small>CAFÉ</small>
            </div>
          </div>
          <p className="footer-brand-desc">
            Serving happiness one bite at a time. Craft burgers, artisanal pizzas, thick shakes &
            authentic comfort bites prepared with passion every day.
          </p>
          <div className="footer-social-links">
            <span className="social-pill">Instagram</span>
            <span className="social-pill">Facebook</span>
            <span className="social-pill">Twitter</span>
          </div>
        </div>

        <div className="footer-links-col">
          <h5>Quick Links</h5>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#menu">Popular Menu</a></li>
            <li><a href="#offers">Special Combos</a></li>
            <li><a href="#about">About Our Story</a></li>
          </ul>
        </div>

        <div className="footer-links-col">
          <h5>Categories</h5>
          <ul>
            <li><a href="#menu">Burgers & Wraps</a></li>
            <li><a href="#menu">Loaded Pizzas</a></li>
            <li><a href="#menu">Creamy Pastas</a></li>
            <li><a href="#menu">Thick Milkshakes</a></li>
          </ul>
        </div>

        <div className="footer-contact-col" id="about">
          <h5>Visit Foodie Café</h5>
          <p className="footer-address">
            📍 42 Gourmet Avenue, Hill Road<br />
            Bangalore / Chennai / Mumbai
          </p>
          <p className="footer-hours">
            🕒 Open Daily: 10:00 AM – 11:30 PM
          </p>
          <p className="footer-phone">
            📞 +91 98765 43210
          </p>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <p>© {new Date().getFullYear()} Foodie Café. All rights reserved. Made with love for food lovers.</p>
        <div className="footer-legal-tags">
          <span>Privacy Policy</span>
          <span>•</span>
          <span>Terms of Service</span>
          <span>•</span>
          <span>FSSAI License</span>
        </div>
      </div>
    </footer>
  );
}
