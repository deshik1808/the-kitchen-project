"use client";

import { useState, useEffect } from 'react';
import { getCart, addToCart, updateQuantity, removeFromCart } from '../lib/cart';

export default function MenuCard({ item, currency = '₹', onAdd }) {
  const isVeg = item.type?.toLowerCase() === 'veg';
  const getItemEntries = () => getCart().filter(e => e.id === item.id);
  const getTotalQty = () => getItemEntries().reduce((s, e) => s + e.qty, 0);

  const [qty, setQty] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const DESC_LIMIT = 60;
  const isLong = item.description && item.description.length > DESC_LIMIT;

  useEffect(() => {
    setQty(getTotalQty());
    const sync = () => setQty(getTotalQty());
    window.addEventListener('cartUpdated', sync);
    return () => window.removeEventListener('cartUpdated', sync);
  }, [item.id]);


  const handleAdd = () => onAdd(item);

  const handleIncrease = () => {
    const entries = getItemEntries();
    if (entries.length === 0) {
      addToCart({ ...item, qty: 1, addons: [] });
    } else {
      updateQuantity(entries[entries.length - 1].cartItemId, 1);
    }
  };

  const handleDecrease = () => {
    const entries = getItemEntries();
    if (entries.length === 0) return;
    const last = entries[entries.length - 1];
    if (last.qty > 1) {
      updateQuantity(last.cartItemId, -1);
    } else {
      removeFromCart(last.cartItemId);
    }
  };

  return (
    <div className="menu-card">
      <div className="card-left">
        <span className={`type-dot ${isVeg ? 'veg' : 'nonveg'}`} />
        <p className="item-name">{item.name}</p>
        {item.description && (
          <p className="item-desc">
            {!expanded && isLong
              ? <>{item.description.slice(0, DESC_LIMIT)}... <button className="toggle-btn" onClick={e => { e.stopPropagation(); setExpanded(true); }}>more</button></>
              : <>{item.description}{isLong && <> <button className="toggle-btn" onClick={e => { e.stopPropagation(); setExpanded(false); }}>less</button></>}</>
            }
          </p>
        )}
        <p className="item-price">{currency}{item.price}</p>
      </div>

      <div className="card-right">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="card-img" loading="lazy" />
        ) : (
          <div className="card-img-placeholder">🍽</div>
        )}

        {qty === 0 ? (
          <button className="add-btn" onClick={handleAdd}>Add +</button>
        ) : (
          <div className="stepper">
            <button className="step-btn" onClick={handleDecrease}>−</button>
            <span className="step-qty">{qty}</span>
            <button className="step-btn" onClick={handleIncrease}>+</button>
          </div>
        )}
      </div>

      <style jsx>{`
        .menu-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid var(--color-surface-container);
        }
        .menu-card:last-child { border-bottom: none; }

        .card-left {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .type-dot {
          width: 14px; height: 14px;
          border-radius: 3px;
          border: 2px solid;
          position: relative;
          flex-shrink: 0;
          margin-bottom: 2px;
        }
        .type-dot.veg { border-color: var(--color-secondary); }
        .type-dot.veg::after {
          content: '';
          position: absolute;
          inset: 2px;
          border-radius: 50%;
          background: var(--color-secondary);
        }
        .type-dot.nonveg { border-color: var(--color-error); }
        .type-dot.nonveg::after {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 0; height: 0;
          border-left: 3px solid transparent;
          border-right: 3px solid transparent;
          border-bottom: 5px solid var(--color-error);
        }

        .item-name {
          font-family: var(--font-body);
          font-size: 0.95rem;
          font-weight: 400;
          color: var(--color-text);
          line-height: 1.3;
        }
        .item-desc {
          font-family: var(--font-body);
          font-size: 0.78rem;
          color: var(--color-text-variant);
          line-height: 1.4;
        }
        .toggle-btn {
          background: none;
          border: none;
          padding: 0;
          font-family: var(--font-body);
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--color-text-variant);
          cursor: pointer;
        }
        .item-price {
          font-family: var(--font-body);
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--color-text);
        }

        .card-right {
          flex-shrink: 0;
          position: relative;
          width: 100px;
        }
        .card-img {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: var(--radius-md);
          display: block;
        }
        .card-img-placeholder {
          width: 100px;
          height: 100px;
          border-radius: var(--radius-md);
          background: var(--color-surface-container);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
        }

        .add-btn {
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--color-surface-lowest);
          color: var(--color-primary);
          border: 1px solid var(--color-primary);
          padding: 5px 18px;
          border-radius: var(--radius-sm);
          font-family: var(--font-body);
          font-size: 0.75rem;
          font-weight: 400;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .add-btn:active { background: var(--color-primary-light); }

        .stepper {
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          background: var(--color-primary);
          border-radius: var(--radius-sm);
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          white-space: nowrap;
        }
        .step-btn {
          width: 28px;
          height: 28px;
          background: transparent;
          border: none;
          color: white;
          font-size: 1rem;
          font-weight: 400;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .step-btn:active { background: rgba(0,0,0,0.15); }
        .step-qty {
          min-width: 22px;
          text-align: center;
          color: white;
          font-family: var(--font-body);
          font-size: 0.82rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
