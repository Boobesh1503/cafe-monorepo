'use client';

import React, { useState, useEffect } from 'react';
import { CartProvider, useCart } from '@/context/cart-context';
import { FoodieHeader } from '@/components/foodie-header';
import { FoodieHero } from '@/components/foodie-hero';
import { FoodieCategories } from '@/components/foodie-categories';
import { FoodieFavorites, type FoodDish } from '@/components/foodie-favorites';
import { FoodieFullMenu } from '@/components/foodie-full-menu';
import { FoodieFeatures } from '@/components/foodie-features';
import { FoodieFooter } from '@/components/foodie-footer';
import { CartDrawer } from '@/components/cart-drawer';
import { OrderTrackingModal, type TrackedOrderData } from '@/components/order-tracking-modal';
import { CustomizationModal } from '@/components/customization-modal';
import { ReservationModal } from '@/components/reservation-modal';
import { AuthModal } from '@/components/auth-modal';
import { FOODIE_MENU_ITEMS, type FoodieItem } from '@/data/foodie-menu';

function FoodieAppContent() {
  const { itemCount, setIsCartOpen, addToCart } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);
  const [activeTrackingOrderData, setActiveTrackingOrderData] = useState<TrackedOrderData | null>(null);
  const [customizingItem, setCustomizingItem] = useState<FoodieItem | null>(null);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role?: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('foodie_user');
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const handleFavoriteAddToCart = (dish: FoodDish, quantity: number) => {
    // Find matching item from full menu or construct
    const menuItem = FOODIE_MENU_ITEMS.find((it) => it.id === dish.id || it.name === dish.name) || {
      id: dish.id,
      name: dish.name,
      category: dish.category,
      categoryName: dish.category,
      price: dish.price,
      description: dish.description,
      image: dish.image,
      isVeg: dish.isVeg,
      rating: dish.rating,
      reviewCount: 1000,
      available: true,
    };

    addToCart(menuItem, { quantity });
    setToastMessage(`Added ${quantity}x "${dish.name}" to cart! 🛒`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const scrollToMenu = () => {
    const el = document.getElementById('full-menu');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <FoodieHeader
        cartCount={itemCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenReservations={() => setIsReservationOpen(true)}
        currentUser={currentUser}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectItem={(item) => setCustomizingItem(item)}
      />

      <main>
        {/* Exact Hero Section matching Image 2 */}
        <FoodieHero
          onExploreMenu={scrollToMenu}
          onOrderNow={() => setIsCartOpen(true)}
        />

        {/* 12 Popular Categories matching Image 2 & 3 */}
        <FoodieCategories
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
            scrollToMenu();
          }}
        />

        {/* Customer Favorites & Special Combo Banner matching Image 2 */}
        <FoodieFavorites
          onAddToCart={handleFavoriteAddToCart}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
        />

        {/* Complete Interactive 67-Item Menu matching Image 4 */}
        <FoodieFullMenu
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onCustomizeItem={(item) => setCustomizingItem(item)}
        />

        {/* 4 Trust Feature Pillars */}
        <FoodieFeatures />
      </main>

      <FoodieFooter />

      {/* Cart Drawer & Checkout Flow */}
      <CartDrawer
        onOpenOrderTracking={(orderId, orderData) => {
          setActiveTrackingOrderId(orderId);
          setActiveTrackingOrderData(orderData);
        }}
      />

      {/* Live Order Tracking Modal */}
      <OrderTrackingModal
        orderId={activeTrackingOrderId}
        orderData={activeTrackingOrderData}
        onClose={() => {
          setActiveTrackingOrderId(null);
          setActiveTrackingOrderData(null);
        }}
      />

      {/* Product Customization Modal */}
      <CustomizationModal
        item={customizingItem}
        onClose={() => setCustomizingItem(null)}
      />

      {/* Table Reservation Modal */}
      <ReservationModal
        isOpen={isReservationOpen}
        onClose={() => setIsReservationOpen(false)}
      />

      {/* Customer Auth / Profile Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="cart-toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}

export default function HomePage() {
  return (
    <CartProvider>
      <FoodieAppContent />
    </CartProvider>
  );
}
