"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCartItemCount, getCartSubtotal } from '../lib/cart';

export default function CartDrawer({ currency = '₹' }) {
  const [count, setCount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);

  useEffect(() => {
    const update = () => {
      setCount(getCartItemCount());
      setSubtotal(getCartSubtotal());
    };
    update();
    window.addEventListener('cartUpdated', update);
    return () => window.removeEventListener('cartUpdated', update);
  }, []);

  if (count === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 95,
      pointerEvents: 'none',
      display: 'flex',
      justifyContent: 'center',
      padding: '0 16px 12px',
      maxWidth: 480,
      margin: '0 auto',
    }}>
      <Link
        href="/cart"
        className="cart-bar-btn"
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '14px 20px',
          background: 'var(--color-primary)',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          animation: 'cartSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <span className="cart-bar-left">
          {currency}{subtotal}
          <span className="cart-bar-divider">|</span>
          {count} {count === 1 ? 'Item' : 'Items'}
        </span>
        <span className="cart-bar-right">
          View Cart
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      </Link>

      <style jsx>{`
        .cart-bar-btn:hover, .cart-bar-btn:active {
          opacity: 1 !important;
          background-color: var(--color-primary) !important;
        }
        .cart-bar-left {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 6px;
          font-size: 0.88rem;
          font-weight: 400;
          white-space: nowrap;
        }
        .cart-bar-divider {
          opacity: 0.5;
          font-weight: 300;
        }
        .cart-bar-right {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 6px;
          font-size: 0.88rem;
          font-weight: 400;
          white-space: nowrap;
        }
      `}</style>

      <style jsx global>{`
        @keyframes cartSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
