"use client";

// Simple cart manager for localStorage
export const getCart = () => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('cart');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveCart = (cart) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  }
};

export const addToCart = (item) => {
  const cart = getCart();
  // Generate a unique ID for this cart entry (including exact add-ons)
  const cartItemId = `${item.id}-${Math.random().toString(36).substr(2, 9)}`;
  cart.push({ ...item, cartItemId });
  saveCart(cart);
};

export const removeFromCart = (cartItemId) => {
  let cart = getCart();
  cart = cart.filter(i => i.cartItemId !== cartItemId);
  saveCart(cart);
};

export const updateQuantity = (cartItemId, change) => {
  const cart = getCart();
  const index = cart.findIndex(i => i.cartItemId === cartItemId);
  if (index !== -1) {
    cart[index].qty += change;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }
    saveCart(cart);
  }
};

export const clearCart = () => {
  saveCart([]);
};

export const getCartSubtotal = () => {
  const cart = getCart();
  return cart.reduce((total, item) => {
    const addonsTotal = (item.addons || []).reduce((sum, addon) => sum + (addon.price || 0), 0);
    return total + ((item.price + addonsTotal) * item.qty);
  }, 0);
};

export const getCartItemCount = () => {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.qty, 0);
};
