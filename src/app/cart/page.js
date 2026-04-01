"use client";

import { useEffect, useState, Fragment } from 'react';
import { getCart, removeFromCart, updateQuantity, getCartSubtotal, getCartItemCount } from '../../lib/cart';
import { useStore } from '../../lib/StoreContext';
import OrderSummary from '../../components/OrderSummary';
import Link from 'next/link';
import { CircleArrowLeft, MapPinned, MapPin } from 'lucide-react';

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [orderType, setOrderType] = useState('delivery');
  const [pendingType, setPendingType] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [addrForm, setAddrForm] = useState({ type: 'Home', name: '', phone: '', house: '', landmark: '', city: 'Tirupati' });

  const openAddressSheet = () => {
    setShowAddressSheet(true);
  };

  const phoneValid = addrForm.phone.length === 10;

  const saveAddress = () => {
    if (!phoneValid) return;
    const parts = [addrForm.house, addrForm.landmark, addrForm.city].filter(Boolean);
    const formatted = parts.join(', ');
    setDeliveryAddress(formatted);
    localStorage.setItem('deliveryAddress', formatted);
    localStorage.setItem('deliveryAddrForm', JSON.stringify(addrForm));
    setShowAddressSheet(false);
  };

  const canCheckout = orderType === 'pickup' || (orderType === 'delivery' && deliveryAddress && addrForm.phone.length === 10);
  const { storeData, loading } = useStore();

  const handleToggle = (type) => {
    if (type === orderType) return;
    setPendingType(type);
  };

  const confirmSwitch = () => {
    setOrderType(pendingType);
    localStorage.setItem('deliveryOrderType', pendingType);
    setPendingType(null);
  };

  const cancelSwitch = () => {
    setPendingType(null);
  };

  useEffect(() => {
    const update = () => {
      setCartItems(getCart());
      setSubtotal(getCartSubtotal());
    };
    update();
    window.addEventListener('cartUpdated', update);

    const savedAddress = localStorage.getItem('deliveryAddress');
    if (savedAddress) setDeliveryAddress(savedAddress);

    const savedForm = localStorage.getItem('deliveryAddrForm');
    if (savedForm) try { setAddrForm(JSON.parse(savedForm)); } catch {}

    const savedType = localStorage.getItem('deliveryOrderType');
    if (savedType) setOrderType(savedType);

    return () => window.removeEventListener('cartUpdated', update);
  }, []);

  if (loading) return null;

  const store = storeData?.store || {};
  const branding = storeData?.branding || {};
  const currency = store.currency || '₹';
  const mapsHref = branding.googleMapsUrl ||
    (store.address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.address)}` : null);

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
          .browse-btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, var(--color-primary-dim), var(--color-primary)); color: white; border-radius: var(--radius-full); font-weight: 700; font-family: var(--font-display); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="top-card">
      <div className="page-top">
        <Link href="/" className="back-arrow">
          <CircleArrowLeft size={28} strokeWidth={1.5} color="#484848" />
        </Link>
        <h1>Your Cart</h1>
        <div className="top-spacer"></div>
      </div>

      <div className="order-type-toggle">
        <button
          className={`toggle-option${orderType === 'delivery' ? ' active' : ''}`}
          onClick={() => handleToggle('delivery')}
        >
          Delivery
        </button>
        <button
          className={`toggle-option${orderType === 'pickup' ? ' active' : ''}`}
          onClick={() => handleToggle('pickup')}
        >
          Pickup
        </button>
      </div>

      {orderType === 'delivery' && (
        <div className="delivery-banner">
          <MapPin size={32} strokeWidth={1.5} style={{color: 'var(--color-primary)', flexShrink: 0}} />
          <div className="delivery-info">
            {deliveryAddress ? (
              <>
                <p className="pickup-label">Delivery Address:</p>
                <p className="delivery-saved-address">{deliveryAddress}</p>
              </>
            ) : (
              <p className="delivery-placeholder">Add delivery address</p>
            )}
          </div>
          <button className="delivery-action-btn" onClick={openAddressSheet}>
            {deliveryAddress ? 'Edit' : 'Add'}
          </button>
        </div>
      )}

      {showAddressSheet && (
        <div className="addr-overlay" onClick={() => setShowAddressSheet(false)}>
          <div className="addr-sheet" onClick={e => e.stopPropagation()}>
            <div className="addr-header">
              <button className="addr-back" onClick={() => setShowAddressSheet(false)}>
                <CircleArrowLeft size={26} strokeWidth={1.5} color="#484848" />
              </button>
              <span className="addr-title">Confirm Address</span>
            </div>

            <p className="addr-section-label">CHOOSE ADDRESS TYPE</p>
            <div className="addr-type-row">
              {['Home', 'Work', 'Other'].map(t => (
                <button
                  key={t}
                  className={`addr-type-btn${addrForm.type === t ? ' active' : ''}`}
                  onClick={() => setAddrForm(f => ({ ...f, type: t }))}
                >{t}</button>
              ))}
            </div>

            <div className="addr-fields">
              {[
                { key: 'name',     label: 'Name',                       placeholder: 'Enter your name' },
                { key: 'phone',    label: 'WhatsApp Number',             placeholder: '10-digit mobile number', type: 'tel' },
                { key: 'house',    label: 'House / Flat / Block no.',   placeholder: 'Enter House / Flat / Block no.' },
                { key: 'landmark', label: 'Landmark / Locality',        placeholder: 'Enter landmark or locality' },
                { key: 'city',     label: 'City',                       placeholder: 'Enter city' },
              ].map(({ key, label, placeholder, type }) => (
                <Fragment key={key}>
                  <div className="addr-field">
                    <div className="addr-field-top">
                      <label className="addr-field-label">
                        {label}{key === 'phone' && <span className="required-star"> *</span>}
                      </label>
                      {key === 'phone' && addrForm.phone.length > 0 && (
                        <span className={`phone-hint ${addrForm.phone.length === 10 ? 'valid' : 'invalid'}`}>
                          {addrForm.phone.length === 10 ? '✓' : `${addrForm.phone.length}/10`}
                        </span>
                      )}
                      {key === 'phone' && addrForm.phone.length === 0 && (
                        <span className="phone-hint invalid">starts with 6–9</span>
                      )}
                    </div>
                    <input
                      className="addr-field-input"
                      type={type || 'text'}
                      placeholder={placeholder}
                      value={addrForm[key]}
                      inputMode={key === 'phone' ? 'numeric' : undefined}
                      maxLength={key === 'phone' ? 10 : undefined}
                      onChange={e => {
                        const val = key === 'phone'
                          ? e.target.value.replace(/\D/g, '').replace(/^[^6-9].*/, '').slice(0, 10)
                          : e.target.value;
                        setAddrForm(f => ({ ...f, [key]: val }));
                      }}
                    />
                  </div>
                  {key === 'phone' && addrForm.phone.length > 0 && (
                    <p className="phone-helper">Owner will WhatsApp you on this number</p>
                  )}
                </Fragment>
              ))}
            </div>

            <button className={`addr-save-btn${!phoneValid ? ' disabled' : ''}`} onClick={saveAddress} disabled={!phoneValid}>Save Address</button>
          </div>
        </div>
      )}

      {orderType === 'pickup' && (
        <div className="pickup-banner">
          <div className="pickup-icon">
            <MapPinned size={36} strokeWidth={1.5} style={{color: 'var(--color-primary)'}} />
          </div>
          <div className="pickup-info">
            <p className="pickup-label">Pickup your order from here</p>
            <div className="pickup-address-wrap">
              <div className="pickup-address-track">
                <span>{store.address || 'Address not available'}</span>
                <span>{store.address || 'Address not available'}</span>
              </div>
            </div>
          </div>
          {mapsHref && (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="pickup-directions"
            >
              Get Directions
            </a>
          )}
        </div>
      )}

      </div>{/* end top-card */}

      {pendingType && (
        <div className="confirm-overlay" onClick={cancelSwitch}>
          <div className="confirm-sheet" onClick={e => e.stopPropagation()}>
            <p className="confirm-title">Switch to {pendingType === 'delivery' ? 'Delivery' : 'Pickup'}?</p>
            <p className="confirm-sub">Your cart items will be kept.</p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={cancelSwitch}>Cancel</button>
              <button className="confirm-ok" onClick={confirmSwitch}>Yes, Switch</button>
            </div>
          </div>
        </div>
      )}

      <div className="section-label">ORDER SUMMARY</div>

      <div className="cart-items">
        {cartItems.map((item) => {
          const addonsTotal = (item.addons || []).reduce((sum, a) => sum + (a.price || 0), 0);
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

      {canCheckout ? (
        <Link href="/checkout" className="checkout-btn gradient-primary">
          Proceed to Checkout →
        </Link>
      ) : (
        <button className="checkout-btn checkout-btn-disabled" onClick={orderType === 'delivery' ? openAddressSheet : undefined}>
          {orderType === 'delivery' ? 'Add Delivery Address to Continue' : 'Proceed to Checkout →'}
        </button>
      )}

      <style jsx>{`
        .cart-page { max-width: 480px; margin: 0 auto; padding: 0 var(--space-6) var(--space-6); }
        .top-card {
          background: var(--color-surface-lowest);
          margin: 0 calc(-1 * var(--space-6)) var(--space-4);
          padding: 0 var(--space-6) var(--space-1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border-radius: 0 0 var(--radius-lg) var(--radius-lg);
        }
        .page-top { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) 0; }
        .back-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s;
        }
        .back-arrow:hover { transform: scale(1.05); }
        .top-spacer { width: 34px; flex-shrink: 0; }
        h1 { font-family: var(--font-display); font-size: 1.15rem; font-weight: 500; flex: 1; text-align: center; }
        .order-type-toggle {
          display: flex;
          background: var(--color-surface-lowest, #f3f3f3);
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin: 0 0 var(--space-2);
          box-shadow: 0 2px 10px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06);
        }
        .toggle-option {
          flex: 1;
          padding: 12px 0;
          border: none;
          background: transparent;
          font-family: var(--font-display);
          font-size: 0.9rem;
          font-weight: 400;
          color: var(--color-text-variant);
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .toggle-option.active {
          background: #484848;
          color: #fff;
          font-weight: 400;
        }
        .addr-overlay {
          position: fixed;
          top: 60px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.4);
          z-index: 300;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .addr-sheet {
          width: 100%;
          max-width: 480px;
          max-height: calc(100vh - 60px);
          overflow-y: auto;
          background: #fff;
          border-radius: 20px 20px 0 0;
          padding: var(--space-4) var(--space-5) calc(var(--space-6) + env(safe-area-inset-bottom));
          animation: sheetUp 0.3s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes sheetUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .addr-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }
        .addr-back { background: none; border: none; padding: 0; cursor: pointer; display: flex; }
        .addr-title { font-family: var(--font-display); font-size: 1.05rem; font-weight: 500; }
        .addr-section-label { font-size: 0.7rem; font-weight: 500; color: var(--color-text-variant); letter-spacing: 0.1em; margin-bottom: var(--space-3); }
        .addr-type-row { display: flex; gap: var(--space-2); margin-bottom: var(--space-5); }
        .addr-type-btn {
          flex: 1;
          padding: 10px 0;
          border-radius: var(--radius-full);
          border: 1.5px solid var(--color-outline-variant);
          background: transparent;
          font-family: var(--font-display);
          font-size: 0.88rem;
          font-weight: 400;
          color: var(--color-text-variant);
          cursor: pointer;
          transition: all 0.2s;
        }
        .addr-type-btn.active {
          border-color: transparent;
          background: color-mix(in srgb, var(--color-primary) 10%, transparent);
          color: var(--color-primary);
          font-weight: 500;
        }
        .addr-fields { display: flex; flex-direction: column; }
        .addr-field { padding: var(--space-3) 0; border-bottom: 1px solid var(--color-outline-variant); transition: border-color 0.2s; }
        .addr-field:last-child { border-bottom: none; }
        .addr-field:focus-within { border-bottom-color: #484848; }
        .addr-field-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .addr-field-label { font-size: 0.8rem; color: var(--color-text); opacity: 0.65; }
        .phone-hint { font-size: 0.75rem; font-weight: 500; }
        .phone-hint.valid { color: #22c55e; }
        .phone-hint.invalid { color: var(--color-text-variant); }
        .phone-helper { font-size: 0.75rem; color: var(--color-text-variant); margin-top: 4px; }
        .required-star { color: var(--color-primary); }
        .addr-save-btn.disabled { opacity: 0.4; cursor: not-allowed; }
        .addr-field-input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-family: var(--font-display);
          font-size: 0.95rem;
          color: var(--color-text);
        }
        .addr-field-input::placeholder { color: var(--color-outline-variant); }
        .addr-save-btn {
          width: 100%;
          margin-top: var(--space-5);
          padding: 16px;
          border: none;
          border-radius: var(--radius-lg);
          background: var(--color-primary);
          color: #fff;
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .delivery-banner {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-1) var(--space-3);
          background: transparent;
        }
        .delivery-info { flex: 1; min-width: 0; }
        .delivery-placeholder { font-size: 0.88rem; color: var(--color-text-variant); }
        .delivery-saved-address { font-size: 0.88rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .delivery-input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.88rem;
          font-family: var(--font-display);
          color: var(--color-text);
        }
        .delivery-action-btn {
          flex-shrink: 0;
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--color-primary);
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
        }
        .pickup-banner {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-1) var(--space-3);
          background: transparent;
        }
        .pickup-icon { flex-shrink: 0; }
        .pickup-info { flex: 1; min-width: 0; overflow: hidden; }
        .pickup-label { font-size: 0.75rem; color: var(--color-text-variant); margin-bottom: 2px; }
        .pickup-address-wrap { overflow: hidden; }
        .pickup-address-track {
          display: inline-flex;
          white-space: nowrap;
          animation: addressScroll 12s linear infinite;
        }
        .pickup-address-track span {
          font-size: 0.88rem;
          font-weight: 500;
          padding-right: 3rem;
        }
        @keyframes addressScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .pickup-directions {
          flex-shrink: 0;
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--color-primary);
          text-decoration: underline;
          white-space: nowrap;
        }
        .section-label { font-size: 0.7rem; font-weight: 500; color: var(--color-text-variant); letter-spacing: 0.1em; margin-top: var(--space-3); }
        .section-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 600; margin-bottom: var(--space-4); }
        
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
        .item-top-row h3 { font-family: var(--font-display); font-size: 0.95rem; font-weight: 500; margin-bottom: 2px; }
        .addons-label { font-size: 0.75rem; color: var(--color-text-variant); }
        .remove-x { background: none; border: none; color: var(--color-outline-variant); font-size: 0.8rem; cursor: pointer; padding: 4px; }
        
        .item-bottom-row { display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-2); }
        .item-price { font-weight: 500; font-size: 0.9rem; }
        .qty-stepper {
          display: flex;
          align-items: center;
          background: transparent;
          border-radius: var(--radius-sm);
          border: 1.5px solid #d0d0d0;
          overflow: hidden;
        }
        .qty-btn {
          width: 30px; height: 30px;
          border: none;
          background: transparent;
          color: var(--color-primary);
          font-size: 1.1rem;
          font-weight: 400;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .qty-btn:active { background: rgba(0,0,0,0.06); }
        .qty-btn.plus { background: transparent; color: var(--color-primary); }
        .qty-val { color: #1a1a1a; font-family: var(--font-body); font-size: 0.85rem; font-weight: 600; min-width: 22px; text-align: center; }
        
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
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          transition: transform 0.15s;
        }
        .checkout-btn:hover { transform: translateY(-1px); color: white; opacity: 1; }
        .checkout-btn-disabled {
          display: block;
          width: 100%;
          background: var(--color-primary);
          color: #fff;
          border: none;
          font-size: 1rem;
          font-weight: 400;
          opacity: 0.7;
          cursor: pointer;
          box-shadow: none;
        }
        .checkout-btn-disabled:hover { transform: none; opacity: 0.7; color: #fff; }

        .confirm-overlay {
          position: fixed;
          top: 60px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.35);
          z-index: 200;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .confirm-sheet {
          width: 100%;
          max-width: 480px;
          background: var(--color-surface-lowest);
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          padding: var(--space-5) var(--space-6) var(--space-6);
        }
        .confirm-title {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 500;
          margin-bottom: var(--space-1);
        }
        .confirm-sub {
          font-size: 0.85rem;
          color: var(--color-text-variant);
          margin-bottom: var(--space-5);
        }
        .confirm-actions {
          display: flex;
          gap: var(--space-3);
        }
        .confirm-cancel {
          flex: 1;
          padding: 12px 0;
          border: 1.5px solid var(--color-outline-variant);
          background: transparent;
          border-radius: var(--radius-lg);
          font-family: var(--font-display);
          font-size: 0.9rem;
          font-weight: 400;
          color: var(--color-text-variant);
          cursor: pointer;
        }
        .confirm-ok {
          flex: 1;
          padding: 12px 0;
          border: none;
          background: var(--color-primary);
          border-radius: var(--radius-lg);
          font-family: var(--font-display);
          font-size: 0.9rem;
          font-weight: 400;
          color: #fff;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
