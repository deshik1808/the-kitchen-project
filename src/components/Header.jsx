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
  const storePhone = storeData?.store?.phone || storeData?.store?.['Store Phone'] || "";
  const waLink = storePhone ? `https://wa.me/${storePhone.replace(/[\s+]/g, '')}?text=Hi! I have a query about my order.` : null;

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

        <div className="header-actions">
          {waLink ? (
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="action-btn wa-btn" aria-label="Contact on WhatsApp">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          ) : (
            <span className="action-btn wa-btn wa-btn-disabled" aria-label="WhatsApp not configured">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </span>
          )}

          <Link href="/cart" aria-label="View Cart" style={{ display: 'flex', textDecoration: 'none' }}>
            <div className="action-btn cart-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </div>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .site-header {
          background: var(--color-primary);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          border-radius: 0 0 15px 15px;
          position: sticky;
          top: 0;
          z-index: 1000;
          padding: var(--space-3) var(--space-3);
        }
        .header-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo-link { 
          display: flex; 
          align-items: center; 
          text-decoration: none; 
          -webkit-tap-highlight-color: transparent;
        }
        .logo-container { display: flex; align-items: center; gap: 10px; }
        .logo-img {
          max-height: 36px;
          width: auto;
          border-radius: 6px;
          object-fit: contain;
        }
        .logo-icon { font-size: 1.5rem; }
        .logo-name {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.2rem;
          color: #ffffff;
          letter-spacing: 0.02em;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .header-actions { display: flex; align-items: center; gap: 8px; }
        .action-btn {
          position: relative;
          color: rgba(255, 255, 255, 0.9);
          padding: 8px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.18);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          -webkit-tap-highlight-color: transparent;
        }
        .action-btn:hover {
          background: rgba(255, 255, 255, 0.24);
          border-color: rgba(255, 255, 255, 0.35);
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .wa-btn, .cart-btn {
          color: rgba(255, 255, 255, 0.9);
          border-radius: var(--radius-full);
          width: 40px;
          height: 40px;
          padding: 0;
        }
        .wa-btn-disabled { opacity: 0.35; cursor: default; }
        .wa-btn-disabled:hover { background: rgba(255,255,255,0.12); transform: none; box-shadow: none; }
        .cart-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ffffff;
          color: var(--color-primary);
          font-size: 0.62rem;
          font-weight: 800;
          border-radius: var(--radius-full);
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </header>
  );
}
