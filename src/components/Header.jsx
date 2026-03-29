"use client";

import Link from 'next/link';
import { useStore } from '../lib/StoreContext';
import { useEffect, useState } from 'react';
import { getCartItemCount } from '../lib/cart';

export default function Header() {
  const { storeData, loading } = useStore();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => setCartCount(getCartItemCount());
    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, []);

  if (loading) {
    return (
      <header className="header-skel">
        <div className="skel-bar"></div>
        <style jsx>{`
          .header-skel { height: 60px; background: var(--color-surface-lowest); }
          .skel-bar { width: 120px; height: 20px; margin: 20px auto; background: var(--color-surface-container); border-radius: var(--radius-sm); animation: pulse 1.5s infinite; }
          @keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        `}</style>
      </header>
    );
  }

  const store = storeData?.store || { name: 'Your Kitchen' };
  const branding = storeData?.branding || {};

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="logo-link">
          <div className="logo-container">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={store.name} className="logo-img" />
            ) : (
              <span className="logo-icon">🍽</span>
            )}
            <span className="logo-name">{store.name}</span>
          </div>
        </Link>

        <Link href="/cart" className="cart-btn" aria-label="View Cart">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </Link>
      </div>

      <style jsx>{`
        .site-header {
          background: var(--color-surface-lowest);
          position: sticky;
          top: 0;
          z-index: 100;
          padding: var(--space-3) var(--space-6);
        }
        .header-inner {
          max-width: 480px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo-link { display: flex; align-items: center; text-decoration: none; }
        .logo-container { display: flex; align-items: center; gap: 10px; }
        .logo-img { max-height: 32px; width: auto; border-radius: 4px; object-fit: contain; }
        .logo-icon { font-size: 1.5rem; }
        .logo-name {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.25rem;
          color: var(--color-text);
          letter-spacing: -0.02em;
        }
        .cart-btn {
          position: relative;
          color: var(--color-text);
          padding: 8px;
          border-radius: var(--radius-md);
          transition: background 0.2s;
        }
        .cart-btn:hover { background: var(--color-surface-container); }
        .cart-badge {
          position: absolute;
          top: 2px;
          right: 0;
          background: var(--color-primary);
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          border-radius: var(--radius-full);
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }
      `}</style>
    </header>
  );
}
