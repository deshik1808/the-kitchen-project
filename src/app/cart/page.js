"use client";

import { useEffect, useState, useRef, Fragment } from 'react';
import { getCart, updateQuantity, getCartSubtotal, getCartItemCount, clearCart } from '../../lib/cart';
import { validateDiscount } from '../../lib/api';
import { useStore } from '../../lib/StoreContext';
import { generateOrderId } from '../../lib/orderUtils';
import { buildWaUrl } from '../../lib/whatsapp';
import OrderSummary from '../../components/OrderSummary';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CircleArrowLeft, MapPinned, MapPin } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [orderType, setOrderType] = useState('delivery');
  const [pendingType, setPendingType] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [addrForm, setAddrForm] = useState({ type: 'Home', name: '', phone: '', house: '', landmark: '', city: 'Tirupati' });
  const [instructions, setInstructions] = useState('');
  const [instructionsFocused, setInstructionsFocused] = useState(false);
  const instructionsRef = useRef(null);
  const addrSheetRef = useRef(null);
  const [addrValidated, setAddrValidated] = useState(false);
  const [siteHeaderHeight, setSiteHeaderHeight] = useState(72);
  const [showPromoSheet, setShowPromoSheet] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoStatus, setPromoStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [promoError, setPromoError] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null); // {code, discount}
  const [tooltipCode, setTooltipCode] = useState(null);

  const openAddressSheet = () => {
    setShowAddressSheet(true);
  };

  const applyPromoCode = async (code) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setPromoInput(trimmed);
    setPromoStatus('loading');
    setPromoError('');
    try {
      const result = await validateDiscount(trimmed, subtotal);
      if (result?.valid) {
        const promo = { code: trimmed, discount: result.discountAmount };
        setAppliedPromo(promo);
        localStorage.setItem('appliedPromo', JSON.stringify(promo));
        setPromoStatus('success');
        setTimeout(() => setShowPromoSheet(false), 800);
      } else {
        setPromoStatus('error');
        setPromoError(result?.message || 'Invalid promo code');
      }
    } catch {
      setPromoStatus('error');
      setPromoError('Could not apply code. Try again.');
    }
  };

  const applyPromo = () => applyPromoCode(promoInput);

  const removePromo = () => {
    setAppliedPromo(null);
    localStorage.removeItem('appliedPromo');
    setPromoInput('');
    setPromoStatus(null);
    setPromoError('');
  };

  const phoneValid = addrForm.phone.length === 10;
  const canSaveAddress = phoneValid && addrForm.name.trim().length > 0;

  const saveAddress = () => {
    const parts = [addrForm.house, addrForm.landmark, addrForm.city].filter(Boolean);
    const formatted = parts.join(', ');
    setDeliveryAddress(formatted);
    localStorage.setItem('deliveryAddress', formatted);
    localStorage.setItem('deliveryAddrForm', JSON.stringify(addrForm));
    setAddrValidated(false);
    setShowAddressSheet(false);
  };

  const handleSaveAddress = () => {
    if (!canSaveAddress) {
      setAddrValidated(true);
      if (addrSheetRef.current) {
        addrSheetRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    saveAddress();
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

    const savedPromo = localStorage.getItem('appliedPromo');
    if (savedPromo) try { setAppliedPromo(JSON.parse(savedPromo)); } catch {}

    const savedInstructions = localStorage.getItem('cartInstructions');
    if (savedInstructions) setInstructions(savedInstructions);

    return () => window.removeEventListener('cartUpdated', update);
  }, []);

  useEffect(() => {
    const header = document.querySelector('.site-header');
    if (header) setSiteHeaderHeight(header.offsetHeight);
  }, []);

  if (loading) return null;

  const store = storeData?.store || {};
  const branding = storeData?.branding || {};
  const discounts = storeData?.discounts || [];
  const currency = store.currency || '₹';
  const mapsHref = branding.googleMapsUrl ||
    (store.address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.address)}` : null);

  const isStoreOpen = store.open === true || store.open === 'Y';
  const deliveryFee = orderType === 'delivery' ? Number(store.deliveryFee || 0) : 0;
  const discountAmount = appliedPromo?.discount || 0;
  const total = subtotal - discountAmount + deliveryFee;

  const handleWhatsAppOrder = () => {
    if (!canCheckout || isNavigating) return;

    // Validate address form fields for delivery
    if (orderType === 'delivery' && !canSaveAddress) {
      setAddrValidated(true);
      openAddressSheet();
      return;
    }

    setIsNavigating(true);

    const orderId = generateOrderId();

    const formData = {
      name: addrForm.name,
      phone: addrForm.phone,
      deliveryType: orderType,
      address: orderType === 'delivery' ? deliveryAddress : '',
      notes: instructions,
    };

    const totals = {
      subtotal,
      discountCode: appliedPromo?.code || '',
      discountAmount,
      deliveryFee,
      total,
    };

    const waUrl = buildWaUrl(cartItems, formData, store, orderId, totals);

    // Persist order for confirmation page
    const pendingOrderData = {
      orderId,
      customer: { name: addrForm.name, phone: addrForm.phone },
      items: cartItems.map(item => ({
        id: item.id, name: item.name, qty: item.qty,
        price: item.price, addons: item.addons || [],
      })),
      discountCode: appliedPromo?.code || '',
      discountAmount,
      deliveryType: orderType,
      address: orderType === 'delivery' ? deliveryAddress : '',
      notes: instructions,
      paymentMethod: 'razorpay',
      subtotal, deliveryFee, total,
    };

    const POLLING_VERSION = 'v1';
    try {
      sessionStorage.removeItem(`orderResult:${POLLING_VERSION}`);
      sessionStorage.removeItem(`orderSubmitted:${POLLING_VERSION}`);
      sessionStorage.setItem(`pendingOrderData:${POLLING_VERSION}`, JSON.stringify(pendingOrderData));
      sessionStorage.setItem(`pendingWaUrl:${POLLING_VERSION}`, waUrl);

      import('../../lib/api').then(api => {
        api.placeOrder(pendingOrderData).then(result => {
          if (result?.success) {
            try {
              sessionStorage.setItem(`orderResult:${POLLING_VERSION}`, JSON.stringify(result));
              sessionStorage.setItem(`orderSubmitted:${POLLING_VERSION}`, 'true');
            } catch (e) { console.error('Error saving order result:', e); }
          }
        });
      });
    } catch (e) { console.error('Error storing pending order:', e); }

    // Clear cart + persisted cart data
    clearCart();
    localStorage.removeItem('appliedPromo');
    localStorage.removeItem('cartInstructions');

    // Open WhatsApp (must be in user-gesture call stack)
    window.open(waUrl, '_blank');

    // Navigate to confirmation
    router.push('/confirmation');
  };

  if (cartItems.length === 0 && !isNavigating) {
    return (
      <div className="empty-cart">
        <div className="empty-cart-icon-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide-shopping-cart">
            <circle cx="8" cy="21" r="1"/>
            <circle cx="19" cy="21" r="1"/>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
          </svg>
        </div>
        <h2 className="empty-cart-title">Your Cart Is Empty</h2>
        <Link href="/" className="order-now-btn">Order Now</Link>
        <style jsx>{`
          .empty-cart { 
            max-width: 480px; 
            margin: 40px auto; 
            text-align: center; 
            padding: var(--space-8) var(--space-6); 
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 50vh;
          }
          .empty-cart-icon-wrapper { 
            width: 140px;
            height: 140px;
            background: color-mix(in srgb, var(--color-primary) 8%, transparent);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: var(--space-5);
            position: relative;
          }
          .empty-cart-icon-wrapper::before,
          .empty-cart-icon-wrapper::after {
            content: '+';
            position: absolute;
            color: var(--color-outline-variant);
            font-size: 1.2rem;
            line-height: 1;
          }
          .empty-cart-icon-wrapper::before { top: 25%; left: 18%; }
          .empty-cart-icon-wrapper::after { bottom: 30%; right: 18%; }
          .empty-cart-title { 
            font-family: var(--font-display); 
            font-size: 1.15rem;
            font-weight: 400;
            color: var(--color-text); 
            margin-bottom: var(--space-5); 
          }
          :global(.order-now-btn) { 
            display: inline-block; 
            padding: 10px 24px; 
            background-color: var(--color-primary) !important; 
            color: #ffffff !important; 
            border-radius: var(--radius-sm); 
            font-weight: 500; 
            font-size: 0.85rem;
            font-family: var(--font-display); 
            text-decoration: none;
            transition: opacity 0.2s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          :global(.order-now-btn:active) {
            opacity: 0.8;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="top-card">
      <div className="page-top">
        <Link href="/" className="back-arrow">
          <CircleArrowLeft size={26} strokeWidth={1.5} color="#484848" />
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
          <MapPin size={28} strokeWidth={1.5} style={{color: 'var(--color-primary)', flexShrink: 0}} />
          <div className="delivery-info">
            {deliveryAddress ? (
              <>
                <p className="pickup-label">Delivery Address:</p>
                <div className="pickup-address-wrap">
                  <div className="pickup-address-track">
                    <span>{deliveryAddress}</span>
                    <span>{deliveryAddress}</span>
                  </div>
                </div>
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
        <div className="addr-overlay" onClick={() => { setShowAddressSheet(false); setAddrValidated(false); }}>
          <div className="addr-sheet" ref={addrSheetRef} onClick={e => e.stopPropagation()}>
            <div className="addr-header">
              <button className="addr-back" onClick={() => { setShowAddressSheet(false); setAddrValidated(false); }}>
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
                { key: 'name',     label: 'Name',                       placeholder: 'Enter your name', required: true },
                { key: 'phone',    label: 'WhatsApp Number',             placeholder: '10-digit mobile number', type: 'tel', required: true },
                { key: 'house',    label: 'House / Flat / Block no.',   placeholder: 'Enter House / Flat / Block no.' },
                { key: 'landmark', label: 'Landmark / Locality',        placeholder: 'Enter landmark or locality' },
                { key: 'city',     label: 'City',                       placeholder: 'Enter city' },
              ].map(({ key, label, placeholder, type, required }) => {
                const isEmpty = required && addrValidated && (key === 'phone' ? addrForm.phone.length < 10 : !addrForm[key].trim());
                return (
                <Fragment key={key}>
                  <div className={`addr-field${isEmpty ? ' error' : ''}`}>
                    <div className="addr-field-top">
                      <label className="addr-field-label">
                        {label}{(key === 'phone' || key === 'name') && <span className="required-star"> *</span>}
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
              ); })}
            </div>

            <button className={`addr-save-btn${!canSaveAddress ? ' disabled' : ''}`} onClick={handleSaveAddress}>Save Address</button>
          </div>
        </div>
      )}

      {orderType === 'pickup' && (
        <div className="pickup-banner">
          <div className="pickup-icon">
            <MapPinned size={28} strokeWidth={1.5} style={{color: 'var(--color-primary)'}} />
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
          const isNonVeg = item.type?.toLowerCase() === 'non-veg';
          return (
            <div key={item.cartItemId} className="cart-item">
              <div className="veg-icon" title={isNonVeg ? 'Non-Veg' : 'Veg'}>
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke={isNonVeg ? '#c0392b' : '#27ae60'} strokeWidth="1.5"/>
                  {isNonVeg
                    ? <polygon points="8,3 13,13 3,13" fill="#c0392b"/>
                    : <circle cx="8" cy="8" r="4" fill="#27ae60"/>}
                </svg>
              </div>
              <div className="item-details">
                <div className="item-top-row">
                  <div>
                    <h3>{item.name}</h3>
                    {item.addons?.length > 0 && <p className="addons-label">Customizations ▾ &nbsp;{item.addons.map(a => a.name).join(', ')}</p>}
                  </div>
                </div>
                <div className="item-bottom-row">
                  <span className="item-price">{currency} {((item.price + addonsTotal) * item.qty).toFixed(0)}</span>
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
        <div className="instructions-row">
          <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-variant)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/></svg>
          <textarea
            ref={instructionsRef}
            className="instructions-input"
            placeholder="Mention your special instructions here..."
            value={instructions}
            rows={1}
            onChange={e => {
              setInstructions(e.target.value);
              const ta = e.target;
              ta.style.height = 'auto';
              ta.style.height = ta.scrollHeight + 'px';
            }}
            onFocus={() => setInstructionsFocused(true)}
            onBlur={() => setTimeout(() => setInstructionsFocused(false), 150)}
          />
        </div>
        {instructionsFocused && (
          <div className="instructions-footer">
            <span className="instructions-hint">The kitchen will try its best to follow your requests.</span>
            {instructions.trim() && (
              <button
                className="instructions-save-btn"
                onMouseDown={e => e.preventDefault()}
                onClick={() => {
                  localStorage.setItem('cartInstructions', instructions);
                  setInstructionsFocused(false);
                  instructionsRef.current?.blur();
                }}
              >Save</button>
            )}
          </div>
        )}
      </div>

      <div className="section-label">SAVINGS CORNER</div>

      <button className="promo-card" onClick={() => { setShowPromoSheet(true); setPromoStatus(null); setPromoError(''); }}>
        <div className="promo-icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="lucide-ticket-percent">
            <path d="M2 9a3 3 0 1 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 1 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
            <path d="M9 9h.01"/>
            <path d="m15 9-6 6"/>
            <path d="M15 15h.01"/>
          </svg>
        </div>
        {appliedPromo ? (
          <div className="promo-card-text">
            <span className="promo-applied-label">Promo Applied</span>
            <span className="promo-applied-code">{appliedPromo.code} · -{currency}{appliedPromo.discount}</span>
          </div>
        ) : (
          <span className="promo-card-label">Apply Promo</span>
        )}
        <svg className="promo-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>

      <div className="summary-card">
        <p className="bill-details-title">Bill Details</p>
        <OrderSummary
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          currency={currency}
          itemCount={getCartItemCount()}
          discount={appliedPromo?.discount || 0}
        />
      </div>

      {showPromoSheet && (
        <div className="promo-fullscreen" style={{ top: siteHeaderHeight }}>
          <div className="promo-fs-header">
            <button className="promo-fs-back" onClick={() => { setShowPromoSheet(false); setPromoStatus(null); setPromoError(''); }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#484848" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 8 8 12 12 16"/>
                <line x1="16" y1="12" x2="8" y2="12"/>
              </svg>
            </button>
            <div className="promo-fs-title-group">
              <span className="promo-fs-title">Apply Coupon</span>
              <span className="promo-fs-subtitle">Your Cart Value: {currency}{subtotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="promo-fs-body">
            <div className={`promo-fs-input-row${promoStatus === 'error' ? ' has-error' : promoStatus === 'success' ? ' has-success' : ''}`}>
              <input
                className="promo-fs-input"
                placeholder={discounts.length === 0 ? "No promo's available" : "Enter promo code"}
                value={promoInput}
                onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoStatus(null); setPromoError(''); }}
                onKeyDown={e => e.key === 'Enter' && applyPromo()}
                autoFocus
              />
              <button
                className={`promo-fs-apply-btn${!promoInput.trim() ? ' disabled' : ''}`}
                onClick={applyPromo}
                disabled={!promoInput.trim() || promoStatus === 'loading'}
              >
                {promoStatus === 'loading' ? '...' : 'Apply'}
              </button>
            </div>
            {promoStatus === 'error' && <p className="promo-msg error">{promoError}</p>}
            {promoStatus === 'success' && <p className="promo-msg success">Promo applied successfully!</p>}

            {tooltipCode && (
              <div className="promo-tooltip-backdrop" onClick={() => setTooltipCode(null)} />
            )}
            <div className="promo-fs-list">
              {discounts.filter(d => d.showInList !== 'N' && d.showInList !== false).length === 0 ? (
                <div className="promo-empty-state">
                  <span>No Promo(s) found!</span>
                </div>
              ) : (
                discounts.filter(d => d.showInList !== 'N' && d.showInList !== false).map((d, i) => (
                  <div key={i} className={`promo-coupon-card${appliedPromo?.code === d.code ? ' applied' : ''}`}>
                    <div className="promo-coupon-left">
                      <div className="promo-coupon-top-row">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-ticket-percent">
                          <path d="M2 9a3 3 0 1 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 1 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                          <path d="M9 9h.01"/>
                          <path d="m15 9-6 6"/>
                          <path d="M15 15h.01"/>
                        </svg>
                        <span className="promo-coupon-code">{d.code}</span>
                      </div>
                      <div className="promo-coupon-desc-row">
                        <span className="promo-coupon-desc">
                          {d.type === 'percent' ? `${d.value}% off` : `${currency}${d.value} off`}
                          {d.minOrder ? ` · Min order ${currency}${d.minOrder}` : ''}
                        </span>
                        {(d.maxDiscount || d.expiry) && (
                          <div className="promo-info-wrap">
                            <button
                              className="promo-info-btn"
                              onClick={e => { e.stopPropagation(); setTooltipCode(tooltipCode === d.code ? null : d.code); }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                              </svg>
                            </button>
                            {tooltipCode === d.code && (
                              <div className="promo-tooltip">
                                {d.maxDiscount && <span>Max discount: {currency}{d.maxDiscount}</span>}
                                {d.expiry && <span>Valid till: {d.expiry}</span>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {appliedPromo?.code === d.code ? (
                      <button className="promo-coupon-remove-btn" onClick={removePromo}>Remove</button>
                    ) : (
                      <button className="promo-coupon-apply-btn" onClick={() => applyPromoCode(d.code)}>
                        Apply
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {!isStoreOpen ? (
        <div className="store-closed-checkout">
          <div className="store-closed-checkout-icon">🌙</div>
          <div>
            <p className="store-closed-checkout-title">Store is currently closed</p>
            <p className="store-closed-checkout-sub">{store.closedMessage || 'Back soon with fresh food — check back later!'}</p>
          </div>
        </div>
      ) : canCheckout ? (
        <div className="wa-order-wrap">
          <button className="wa-order-btn" onClick={handleWhatsAppOrder} disabled={isNavigating}>
            <svg className="wa-icon" viewBox="0 0 24 24" width="22" height="22" fill="#fff">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp Order
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <p className="wa-order-hint">WhatsApp will open with your order details. Send the message to confirm.</p>
        </div>
      ) : (
        <button className="checkout-btn checkout-btn-disabled" onClick={orderType === 'delivery' ? openAddressSheet : undefined}>
          {orderType === 'delivery' ? 'Add Delivery Address to Continue' : 'Add Details to Continue'}
        </button>
      )}

      <style jsx>{`
        .cart-page { max-width: 480px; margin: 0 auto; padding: 0 16px var(--space-4); }
        .top-card {
          background: var(--color-surface-lowest);
          margin: 0 -16px var(--space-3);
          padding: 0 16px var(--space-1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border-radius: 0 0 var(--radius-lg) var(--radius-lg);
        }
        .page-top { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; }
        .back-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s;
        }
        .back-arrow:hover { transform: scale(1.05); }
        .top-spacer { width: 34px; flex-shrink: 0; }
        h1 { font-family: var(--font-display); font-size: 1rem; font-weight: 500; flex: 1; text-align: center; }
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
          padding: 9px 0;
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
          background: #3d3d3d;
          color: #fff;
          font-weight: 400;
        }
        .addr-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          z-index: 999;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .addr-sheet {
          width: 100%;
          max-width: 480px;
          max-height: calc(100dvh - 72px);
          overflow-y: auto;
          background: #fff;
          border-radius: 20px 20px 0 0;
          padding: 12px 16px calc(var(--space-4) + env(safe-area-inset-bottom));
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
          margin-bottom: 12px;
        }
        .addr-back { background: none; border: none; padding: 0; cursor: pointer; display: flex; }
        .addr-title { font-family: var(--font-display); font-size: 0.92rem; font-weight: 500; }
        .addr-section-label { font-size: 0.7rem; font-weight: 500; color: var(--color-text-variant); letter-spacing: 0.1em; margin-bottom: var(--space-2); }
        .addr-type-row { display: flex; gap: var(--space-2); margin-bottom: var(--space-3); }
        .addr-type-btn {
          flex: 1;
          padding: 8px 0;
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
        .addr-field { padding: 8px 0; border-bottom: 1px solid var(--color-outline-variant); transition: border-color 0.2s; }
        .addr-field:last-child { border-bottom: none; }
        .addr-field:focus-within { border-bottom-color: #484848; }
        .addr-field.error { border-bottom-color: #e53935; }
        .addr-field.error .addr-field-label { color: #e53935; opacity: 1; }
        .addr-field.error .required-star { color: #e53935; }
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
          font-size: 0.88rem;
          color: var(--color-text);
        }
        .addr-field-input::placeholder { color: var(--color-outline-variant); }
        .addr-save-btn {
          width: 100%;
          margin-top: var(--space-3);
          padding: 12px;
          border: none;
          border-radius: var(--radius-lg);
          background: var(--color-primary);
          color: #fff;
          font-family: var(--font-display);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .delivery-banner {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: 4px var(--space-2);
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
          gap: var(--space-2);
          padding: 4px var(--space-2);
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
        .section-label { font-size: 0.72rem; font-weight: 500; color: var(--color-text-variant); letter-spacing: 0.12em; margin-top: var(--space-5); margin-bottom: var(--space-2); }
        .section-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 600; margin-bottom: var(--space-4); }
        
        .cart-items {
          display: flex;
          flex-direction: column;
          background: var(--color-surface-lowest);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-ambient);
          overflow: hidden;
        }
        .cart-item {
          display: flex;
          gap: var(--space-3);
          padding: 10px var(--space-3) 10px var(--space-4);
          align-items: flex-start;
        }
        .cart-item + .cart-item {
          border-top: 1px solid var(--color-border, rgba(0,0,0,0.07));
        }
        .veg-icon { flex-shrink: 0; margin-top: 3px; }

        .item-details { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
        .item-top-row { display: flex; justify-content: space-between; align-items: flex-start; }
        .item-top-row h3 { font-family: var(--font-display); font-size: 0.9rem; font-weight: 500; margin-bottom: 2px; }
        .addons-label { font-size: 0.75rem; color: var(--color-text-variant); margin-top: 2px; }

        .instructions-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: 8px var(--space-4);
          border-top: 1px solid rgba(0,0,0,0.12);
        }
        .instructions-row svg { flex-shrink: 0; }
        .instructions-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-family: var(--font-body);
          font-size: 0.85rem;
          color: var(--color-text-variant);
          resize: none;
          line-height: 1.5;
          overflow: hidden;
        }
        .instructions-input::placeholder { color: rgba(0,0,0,0.3); }
        .instructions-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2px var(--space-4) var(--space-3);
          gap: var(--space-3);
        }
        .instructions-hint {
          font-size: 0.75rem;
          color: rgba(0,0,0,0.35);
          line-height: 1.4;
          flex: 1;
        }
        .instructions-save-btn {
          flex-shrink: 0;
          background: none;
          border: none;
          padding: 0;
          font-family: var(--font-display);
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-primary);
          cursor: pointer;
        }
        
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
          width: 27px; height: 27px;
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
        
        .summary-card { background: var(--color-surface-lowest); border-radius: var(--radius-lg); padding: 0 var(--space-3) var(--space-1); margin-top: var(--space-4); box-shadow: var(--shadow-ambient); }
        .bill-details-title { font-family: var(--font-display); font-size: 0.82rem; font-weight: 600; color: var(--color-text); margin: 0; padding: var(--space-2) 0 0; }

        .promo-card {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          width: 100%;
          margin-top: var(--space-2);
          padding: 12px var(--space-3);
          background: #fff;
          border: none;
          border-radius: 20px;
          box-shadow: var(--shadow-ambient);
          cursor: pointer;
          text-align: left;
        }
        .promo-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          background: transparent;
          border-radius: 50%;
        }
        .promo-icon-wrap img {
          width: 28px;
          height: 28px;
          filter: none;
        }
        .promo-icon-wrap svg {
          width: 28px;
          height: 28px;
          color: var(--color-primary);
        }
        .promo-card-label {
          flex: 1;
          font-family: var(--font-display);
          font-size: 0.92rem;
          font-weight: 500;
          color: var(--color-text);
        }
        .promo-card-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .promo-applied-label {
          font-size: 0.72rem;
          font-weight: 500;
          color: var(--color-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .promo-applied-code {
          font-family: var(--font-display);
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--color-text);
        }
        .promo-chevron { flex-shrink: 0; stroke-width: 3; }

        .promo-fullscreen {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999;
          background: var(--color-bg);
          display: flex;
          flex-direction: column;
          max-width: 480px;
          width: 100%;
          margin: 0 auto;
          overflow: hidden;
          animation: sheetUp 0.32s cubic-bezier(0.16,1,0.3,1);
        }
        .promo-fs-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: 8px 12px;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          flex-shrink: 0;
        }
        .promo-fs-back {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .promo-fs-title-group {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .promo-fs-title {
          font-family: var(--font-display);
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--color-text);
        }
        .promo-fs-subtitle {
          font-size: 0.78rem;
          color: var(--color-text-variant);
        }
        .promo-fs-body {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .promo-fs-input-row {
          display: flex;
          align-items: center;
          background: #fff;
          border-radius: var(--radius-lg);
          border: 1.5px solid transparent;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .promo-fs-input-row:focus-within {
          box-shadow: 0 4px 16px rgba(0,0,0,0.13);
        }
        .promo-fs-input-row.has-error { border-color: #e53935; }
        .promo-fs-input-row.has-success { border-color: #22c55e; }
        .promo-fs-input {
          flex: 1;
          min-width: 0;
          padding: 10px 12px;
          border: none;
          outline: none;
          font-family: var(--font-display);
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: var(--color-text);
          background: transparent;
        }
        .promo-fs-input::placeholder { font-weight: 400; letter-spacing: 0; color: var(--color-text-variant); }
        .promo-fs-apply-btn {
          padding: 0 var(--space-4);
          background: none;
          color: var(--color-primary);
          border: none;
          font-family: var(--font-display);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .promo-fs-apply-btn.disabled { opacity: 0.35; cursor: not-allowed; }
        .promo-msg {
          font-size: 0.8rem;
          margin-top: calc(-1 * var(--space-2));
          padding-left: 4px;
        }
        .promo-msg.error { color: #e53935; }
        .promo-msg.success { color: #22c55e; }
        .promo-fs-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin-top: var(--space-3);
        }
        .promo-empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px var(--space-4);
          font-family: var(--font-display);
          font-size: 1rem;
          color: var(--color-text-variant);
        }
        .promo-coupon-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: #fff;
          border-radius: var(--radius-lg);
          border: 1.5px dashed var(--color-outline-variant);
          gap: var(--space-3);
        }
        .promo-coupon-card.applied {
          border-color: var(--color-primary);
          border-style: solid;
          background: color-mix(in srgb, var(--color-primary) 5%, #fff);
        }
        .promo-coupon-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }
        .promo-coupon-top-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        .promo-coupon-code {
          font-family: var(--font-display);
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--color-text);
          letter-spacing: 0.04em;
        }
        .promo-coupon-desc-row {
          display: flex;
          align-items: center;
          gap: 4px;
          padding-left: 30px;
        }
        .promo-coupon-desc {
          font-size: 0.78rem;
          color: var(--color-text-variant);
        }
        .promo-info-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .promo-info-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          color: var(--color-text-variant);
          display: flex;
          align-items: center;
          flex-shrink: 0;
          opacity: 0.6;
        }
        .promo-tooltip {
          position: absolute;
          bottom: calc(100% + 6px);
          right: 0;
          background: #fff;
          color: var(--color-text);
          font-size: 0.72rem;
          border-radius: 8px;
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: max-content;
          max-width: 200px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          border: 1px solid rgba(0,0,0,0.08);
          z-index: 10;
        }
        .promo-tooltip-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9;
        }
        .promo-coupon-apply-btn {
          background: none;
          border: none;
          color: var(--color-primary);
          font-family: var(--font-display);
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          flex-shrink: 0;
          padding: 4px 0;
        }
        .promo-coupon-remove-btn {
          background: none;
          border: none;
          color: #e53935;
          font-family: var(--font-display);
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          flex-shrink: 0;
          padding: 4px 0;
        }
        
        .wa-order-wrap {
          margin-top: var(--space-3);
          text-align: center;
        }
        .wa-order-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: var(--radius-lg);
          background: #25D266;
          color: #fff;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 1.05rem;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(37, 210, 102, 0.3);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .wa-order-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37, 210, 102, 0.4); }
        .wa-order-btn:active { transform: translateY(0); }
        .wa-order-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .wa-icon { flex-shrink: 0; }
        .wa-order-hint {
          margin-top: 4px;
          font-size: 0.72rem;
          color: var(--color-text-variant);
          line-height: 1.4;
        }
        .checkout-btn-disabled {
          display: block;
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: var(--radius-lg);
          background: var(--color-primary);
          color: #fff;
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 400;
          opacity: 0.7;
          cursor: pointer;
          margin-top: var(--space-4);
          box-shadow: none;
        }
        .checkout-btn-disabled:hover { transform: none; opacity: 0.7; color: #fff; }

        .store-closed-checkout {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-top: var(--space-4);
          padding: var(--space-4);
          background: var(--color-surface-lowest);
          border: 1.5px solid var(--color-primary-light);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-card);
        }
        .store-closed-checkout-icon {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-primary-light);
          border-radius: var(--radius-lg);
          font-size: 1.4rem;
          line-height: 1;
        }
        .store-closed-checkout-title {
          font-family: var(--font-display);
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--color-primary);
          margin: 0 0 2px;
        }
        .store-closed-checkout-sub {
          font-size: 0.8rem;
          color: var(--color-text-variant);
          margin: 0;
          line-height: 1.4;
        }

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
