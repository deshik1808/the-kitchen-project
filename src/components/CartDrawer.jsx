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
    <div className="cart-drawer-wrapper">
      <Link href="/cart" className="cart-drawer">
        <div className="drawer-left">
          <span className="item-count">{count} {count === 1 ? 'ITEM' : 'ITEMS'}</span>
          <span className="pipe">|</span>
          <span className="total-price">{currency}{subtotal}</span>
          <span className="plus-tax">plus taxes</span>
        </div>
        <div className="drawer-right">
          <span className="view-text">VIEW CART</span>
          <span className="arrow">›</span>
        </div>
      </Link>

      <style jsx>{`
        .cart-drawer-wrapper {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 95;
          padding: var(--space-3) var(--space-6);
          pointer-events: none;
          display: flex;
          justify-content: center;
        }
        .cart-drawer {
          pointer-events: auto;
          max-width: 480px;
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          border-radius: var(--radius-lg);
          background: linear-gradient(135deg, var(--color-primary-dim), var(--color-primary));
          color: white;
          text-decoration: none;
          box-shadow: var(--shadow-glass);
          backdrop-filter: blur(12px);
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .drawer-left {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .item-count {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }
        .pipe { opacity: 0.5; }
        .total-price {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.15rem;
        }
        .plus-tax {
          font-size: 0.7rem;
          opacity: 0.7;
          font-weight: 300;
        }
        .drawer-right {
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.03em;
        }
        .arrow { font-size: 1.2rem; }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
