'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { FOODIE_MENU_ITEMS, type FoodieItem } from '../data/foodie-menu';

interface FoodieHeaderProps {
  cartCount: number;
  onOpenCart?: () => void;
  onOpenAuth?: () => void;
  onOpenReservations?: () => void;
  currentUser?: { name: string; email: string; role?: string } | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectItem?: (item: FoodieItem) => void;
}

export function FoodieHeader({
  cartCount,
  onOpenCart,
  onOpenAuth,
  onOpenReservations,
  currentUser,
  searchQuery,
  setSearchQuery,
  onSelectItem,
}: FoodieHeaderProps) {
  const [activeNav, setActiveNav] = useState('Home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Menu', href: '#menu' },
    { name: 'Offers', href: '#offers' },
    { name: 'Reservations', href: '#reservations', action: onOpenReservations },
    { name: 'About Us', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  // Quick live filtered search results
  const searchResults = searchQuery.trim()
    ? FOODIE_MENU_ITEMS.filter(
        (it) =>
          it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          it.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          it.description.toLowerCase().includes(searchQuery.toLowerCase()),
      ).slice(0, 5)
    : [];

  return (
    <header className="foodie-header sticky top-0 z-40 bg-[#140e0b]/95 backdrop-blur-md border-b border-[#2e1f18]">
      <div className="header-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Logo */}
        <a href="#home" className="header-logo-link flex items-center gap-3 shrink-0 group">
          <div className="logo-badge-wrapper relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500/60 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
            <Image
              src="/logo.jpg"
              alt="Foodie Café Logo"
              width={48}
              height={48}
              className="header-logo-img object-cover"
              priority
            />
          </div>
          <div className="header-logo-text flex flex-col">
            <span className="logo-main-text font-serif text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#ffe4a0] via-[#f7c867] to-[#e5a035]">
              Foodie
            </span>
            <span className="logo-sub-text text-[10px] tracking-[0.3em] font-bold text-amber-500/90 -mt-1">
              CAFÉ
            </span>
          </div>
        </a>

        {/* Navigation Links */}
        <nav className="desktop-nav hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`nav-link px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition relative ${
                activeNav === link.name
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-[#d6c2b4] hover:text-[#fbf7f0] hover:bg-white/5'
              }`}
              onClick={(e) => {
                if (link.action) {
                  e.preventDefault();
                  link.action();
                } else {
                  setActiveNav(link.name);
                }
              }}
            >
              {link.name}
              {activeNav === link.name && (
                <span className="nav-active-pill absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-500 rounded-full" />
              )}
            </a>
          ))}
        </nav>

        {/* Search Bar with Live Quick-Results */}
        <div className="header-search-wrap relative flex-1 max-w-xs lg:max-w-sm hidden sm:block">
          <div className="search-icon-box absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8073]">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            className="search-input w-full bg-[#201611] border border-[#38261e] focus:border-amber-500 rounded-full pl-9 pr-8 py-2 text-xs text-[#fbf7f0] placeholder-[#8a7266] focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition shadow-inner"
            placeholder="Search food, drinks, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8073] hover:text-white text-sm"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}

          {/* Quick Search Dropdown */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#1c1410] border border-[#3a271d] rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-2 border-b border-[#2d1e17] text-[10px] uppercase font-bold text-[#a99080]">
                Quick Matches
              </div>
              {searchResults.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => {
                    if (onSelectItem) onSelectItem(it);
                    setSearchQuery('');
                  }}
                  className="w-full p-2.5 flex items-center justify-between gap-3 hover:bg-[#281b15] transition text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-9 h-9 rounded-md overflow-hidden shrink-0 border border-[#443024]">
                      <Image src={it.image} alt={it.name} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white truncate">{it.name}</p>
                      <p className="text-[10px] text-[#a99080]">{it.categoryName}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-400 shrink-0">₹{it.price}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Header Right Actions */}
        <div className="header-actions flex items-center gap-2.5 shrink-0">
          {/* Sign In / Profile Button */}
          <button
            type="button"
            onClick={onOpenAuth}
            className="signin-btn flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#3a271d] hover:border-amber-500/60 bg-[#241a15] hover:bg-[#2e2019] text-[#fbf7f0] text-xs font-medium transition shadow-sm"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="15" height="15">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="hidden sm:inline">
              {currentUser ? currentUser.name.split(' ')[0] : 'Sign In'}
            </span>
          </button>

          {/* Cart Button with Glowing Animated Badge */}
          <button
            type="button"
            className="cart-btn relative w-10 h-10 rounded-full border border-[#3a271d] hover:border-amber-500/60 bg-[#241a15] hover:bg-[#2e2019] flex items-center justify-center text-[#fbf7f0] transition shadow-md group"
            onClick={onOpenCart}
            aria-label={`Shopping cart with ${cartCount} items`}
          >
            <svg
              className="group-hover:scale-110 transition-transform"
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
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {cartCount > 0 && (
              <span className="cart-badge-count absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40 ring-2 ring-[#140e0b] animate-bounce">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            className="mobile-menu-toggle md:hidden w-10 h-10 rounded-full bg-[#241a15] border border-[#3a271d] flex items-center justify-center text-[#d2baa7]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer md:hidden bg-[#1c1410] border-b border-[#3a271d] px-4 py-4 space-y-3">
          <div className="mobile-search relative">
            <input
              type="text"
              placeholder="Search food, drinks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#241a15] border border-[#3a271d] rounded-lg p-2.5 text-xs text-white"
            />
          </div>
          <nav className="mobile-nav flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="mobile-nav-link p-2 rounded-lg text-xs font-semibold text-[#d6c2b4] hover:bg-white/5 hover:text-white"
                onClick={(e) => {
                  if (link.action) {
                    e.preventDefault();
                    link.action();
                  } else {
                    setActiveNav(link.name);
                  }
                  setIsMobileMenuOpen(false);
                }}
              >
                {link.name}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
