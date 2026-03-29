"use client";

import { useEffect, useState } from 'react';
import { getCart, removeFromCart, updateQuantity, getCartSubtotal, getCartItemCount } from '../../lib/cart';
import { useStore } from '../../lib/StoreContext';
import OrderSummary from '../../components/OrderSummary';
import Link from 'next/link';

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const { storeData, loading } = useStore();

  useEffect(() => {
    const update = () => {
      setCartItems(getCart());
      setSubtotal(getCartSubtotal());
    };
    update();
    window.addEventListener('cartUpdated', update);
    return () => window.removeEventListener('cartUpdated', update);
  }, []);

  if (loading) return null;

  const store = storeData?.store || {};
  const currency = store.currency || '₹';

  if (cartItems.length === 0) {
    return (
      <div className="empty-cart">
        <span className="empty-icon">🛒</span>
        <h2>Your Cart is Empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <Link href="/" className="browse-btn">Browse Menu</Link>
        <style jsx>{`
          .empty-cart { max-width: 480px; margin: 0 auto; text-align: center; padding: var(--space-8) var(--space-6); }
          .empty-icon { font-size: 3rem; display: block; margin-bottom: var(--space-3); }
          h2 { font-family: var(--font-display); margin-bottom: var(--space-2); }
          p { color: var(--color-text-variant); margin-bottom: var(--space-5); }
          .browse-btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, var(--color-primary-dim), var(--color-primary)); color: white; border-radius: var(--radius-full); font-weight: 700; font-family: var(--font-display); box-shadow: 0 4px 16px rgba(255,82,0,0.3); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="page-top">
        <Link href="/" className="back-arrow">←</Link>
        <h1>Your Cart</h1>
        <div></div>
      </div>

      <div className="section-label">ORDER SUMMARY</div>
      <h2 className="section-title">Confirm Items</h2>

      <div className="cart-items">
        {cartItems.map((item) => {
          const addonsTotal = (item.addons || []).reduce((sum, a) => sum + (a.price || 0), 0);
          const itemTotal = (item.price + addonsTotal) * item.qty;
          return (
            <div key={item.cartItemId} className="cart-item">
              <div className="item-img">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <span className="img-placeholder">🍽</span>}
              </div>
              <div className="item-details">
                <div className="item-top-row">
                  <div>
                    <h3>{item.name}</h3>
                    {item.addons?.length > 0 && <p className="addons-label">{item.addons.map(a => a.name).join(', ')}</p>}
                  </div>
                  <button className="remove-x" onClick={() => removeFromCart(item.cartItemId)}>✕</button>
                </div>
                <div className="item-bottom-row">
                  <span className="item-price">{currency}{(item.price + addonsTotal).toFixed(2)}</span>
                  <div className="qty-stepper">
                    <button className="qty-btn" onClick={() => updateQuantity(item.cartItemId, -1)}>−</button>
                    <span className="qty-val">{item.qty}</span>
                    <button className="qty-btn plus" onClick={() => updateQuantity(item.cartItemId, 1)}>+</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="summary-card">
        <OrderSummary
          subtotal={subtotal}
          deliveryFee={Number(store.deliveryFee || 0)}
          currency={currency}
          itemCount={getCartItemCount()}
        />
      </div>

      <Link href="/checkout" className="checkout-btn gradient-primary">
        Proceed to Checkout →
      </Link>

      <style jsx>{`
        .cart-page { max-width: 480px; margin: 0 auto; padding: 0 var(--space-6) var(--space-6); }
        .page-top { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) 0; }
        .back-arrow { font-size: 1.3rem; color: var(--color-text); padding: 8px; }
        h1 { font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; }
        .section-label { font-size: 0.7rem; font-weight: 500; color: var(--color-text-variant); letter-spacing: 0.1em; margin-top: var(--space-3); }
        .section-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; margin-bottom: var(--space-4); }
        
        .cart-items { display: flex; flex-direction: column; gap: var(--space-4); }
        .cart-item {
          display: flex;
          gap: var(--space-3);
          padding: var(--space-3);
          background: var(--color-surface-lowest);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-ambient);
        }
        .item-img {
          width: 72px; height: 72px;
          border-radius: var(--radius-md);
          overflow: hidden;
          flex-shrink: 0;
          background: var(--color-surface-container);
        }
        .item-img img { width: 100%; height: 100%; object-fit: cover; }
        .img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
        
        .item-details { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
        .item-top-row { display: flex; justify-content: space-between; align-items: flex-start; }
        .item-top-row h3 { font-family: var(--font-display); font-size: 0.95rem; font-weight: 600; margin-bottom: 2px; }
        .addons-label { font-size: 0.75rem; color: var(--color-text-variant); }
        .remove-x { background: none; border: none; color: var(--color-outline-variant); font-size: 0.8rem; cursor: pointer; padding: 4px; }
        
        .item-bottom-row { display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-2); }
        .item-price { font-weight: 500; font-size: 0.9rem; }
        .qty-stepper { display: flex; align-items: center; }
        .qty-btn {
          width: 30px; height: 30px;
          border-radius: var(--radius-full);
          border: 1.5px solid var(--color-primary);
          background: transparent;
          color: var(--color-primary);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qty-btn.plus { background: var(--color-primary); color: white; }
        .qty-val { font-family: var(--font-display); font-weight: 700; min-width: 28px; text-align: center; }
        
        .summary-card { background: var(--color-surface-lowest); border-radius: var(--radius-lg); padding: 0 var(--space-3); margin-top: var(--space-4); }
        
        .checkout-btn {
          display: block;
          text-align: center;
          padding: 16px;
          border-radius: var(--radius-lg);
          color: white;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.05rem;
          margin-top: var(--space-4);
          box-shadow: 0 4px 16px rgba(255, 82, 0, 0.3);
          transition: transform 0.15s;
        }
        .checkout-btn:hover { transform: translateY(-1px); color: white; opacity: 1; }
      `}</style>
    </div>
  );
}
