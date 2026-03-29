"use client";

import { useEffect, useState } from 'react';
import { getCart, getCartSubtotal, getCartItemCount, clearCart } from '../../lib/cart';
import { useStore } from '../../lib/StoreContext';
import { generateOrderId } from '../../lib/orderUtils';
import { buildWaUrl } from '../../lib/whatsapp';
import OrderSummary from '../../components/OrderSummary';
import DiscountInput from '../../components/DiscountInput';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Phone validation: 10 digits, starts with 6–9
const PHONE_RE = /^[6-9]\d{9}$/;

export default function CheckoutPage() {
  const router = useRouter();
  const { storeData, loading: storeLoading } = useStore();
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);

  const [formData, setFormData] = useState({
    name: '', phone: '',
    deliveryType: 'delivery', address: '',
    notes: '',
  });

  const [discount, setDiscount] = useState(null);
  const [phoneValid, setPhoneValid] = useState(null); // null=untouched, true, false
  const [validationErrors, setValidationErrors] = useState({});
  const [isNavigating, setIsNavigating] = useState(false);

  // Restore saved checkout data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('checkoutData');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) {}
    setCartItems(getCart());
    setSubtotal(getCartSubtotal());
  }, []);

  if (storeLoading) return null;

  const store = storeData?.store || {};
  const currency = store.currency || '₹';
  const deliveryFee = (formData.deliveryType === 'delivery' && store.deliveryFee)
    ? Number(store.deliveryFee) : 0;
  const minOrder = Number(store.minOrder || 0);
  const currentSubtotal = getCartSubtotal();
  const discountAmount = discount?.amount || 0;
  const total = currentSubtotal - discountAmount + deliveryFee;
  const minOrderMet = currentSubtotal >= minOrder;
  const phoneIsValid = PHONE_RE.test(formData.phone);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'phone') {
      setPhoneValid(value.length > 0 ? PHONE_RE.test(value) : null);
    }
    // Clear error on change
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Please enter your full name (at least 2 characters)';
    }
    if (!phoneIsValid) {
      errors.phone = 'Enter a valid 10-digit Indian mobile number';
    }
    if (formData.deliveryType === 'delivery' && !formData.address.trim()) {
      errors.address = 'Delivery address is required';
    }
    return errors;
  };

  const handleWhatsAppOrder = (e) => {
    e.preventDefault();
    if (!minOrderMet || isNavigating) return;

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Scroll to first error
      const firstErrorField = document.querySelector('.field-error');
      if (firstErrorField) firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsNavigating(true);

    // Save form data for next visit
    try {
      localStorage.setItem('checkoutData', JSON.stringify({
        name: formData.name, phone: formData.phone, address: formData.address
      }));
    } catch (e) {}

    // Generate Order ID client-side
    const orderId = generateOrderId();

    // Build totals for WA message
    const totals = {
      subtotal: currentSubtotal,
      discountCode: discount?.code || '',
      discountAmount,
      deliveryFee,
      total,
    };

    // Build WhatsApp URL
    const waUrl = buildWaUrl(cartItems, formData, store, orderId, totals);

    // Persist full order data for confirmation page
    const pendingOrderData = {
      orderId,
      customer: { name: formData.name, phone: formData.phone },
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        qty: item.qty,
        price: item.price,
        addons: item.addons || [],
      })),
      discountCode: discount?.code || '',
      discountAmount,
      deliveryType: formData.deliveryType,
      address: formData.deliveryType === 'delivery' ? formData.address : '',
      notes: formData.notes,
      paymentMethod: 'razorpay', // default, user picks action on confirmation page
      subtotal: currentSubtotal,
      deliveryFee,
      total,
    };

    try {
      // Clear any stale previous order state
      sessionStorage.removeItem('orderResult');
      sessionStorage.removeItem('orderSubmitted');
      sessionStorage.setItem('pendingOrderData', JSON.stringify(pendingOrderData));
      sessionStorage.setItem('pendingWaUrl', waUrl);
      
      // Fire the order to the backend in parallel (non-blocking)
      import('../../lib/api').then(api => {
        api.placeOrder(pendingOrderData).then(result => {
          if (result?.success) {
            sessionStorage.setItem('orderResult', JSON.stringify(result));
            sessionStorage.setItem('orderSubmitted', 'true');
          }
        });
      });
    } catch (e) {
      console.error('Error storing pending order:', e);
    }

    // Clear cart
    clearCart();

    // Open WhatsApp (must happen in user-gesture call stack)
    window.open(waUrl, '_blank');

    // Navigate to confirmation
    router.push('/confirmation');
  };

  if (cartItems.length === 0 && !isNavigating) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
        <h2 style={{ marginBottom: '1rem' }}>Your Cart is Empty</h2>
        <p style={{ color: 'var(--color-text-variant)', marginBottom: '1.5rem' }}>
          Add some delicious items before checking out!
        </p>
        <Link href="/" className="btn-primary-link">Browse Menu</Link>
        <style jsx>{`
          .btn-primary-link {
            display: inline-block;
            padding: 12px 24px;
            background: var(--color-primary);
            color: white;
            border-radius: var(--radius-lg);
            font-weight: 600;
            text-decoration: none;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="page-top">
        <Link href="/cart" className="back-arrow">←</Link>
        <h1>Checkout</h1>
        <div></div>
      </div>

      {/* Delivery / Pickup Toggle */}
      <div className="toggle-row">
        {store.deliveryAvailable !== false && (
          <button
            type="button"
            className={`toggle-btn ${formData.deliveryType === 'delivery' ? 'active' : ''}`}
            onClick={() => setFormData(p => ({ ...p, deliveryType: 'delivery' }))}
          >
            🚚 Delivery
          </button>
        )}
        <button
          type="button"
          className={`toggle-btn ${formData.deliveryType === 'pickup' ? 'active' : ''}`}
          onClick={() => setFormData(p => ({ ...p, deliveryType: 'pickup' }))}
        >
          🏃 Pickup
        </button>
      </div>

      <form onSubmit={handleWhatsAppOrder} id="checkout-form" noValidate>
        {/* Personal Details */}
        <div className="section-icon">👤</div>
        <h2 className="section-heading">Personal Details</h2>

        <div className="field">
          <label>FULL NAME</label>
          <input
            type="text"
            name="name"
            placeholder="e.g. Rahul Sharma"
            value={formData.name}
            onChange={handleChange}
            autoComplete="name"
          />
          {validationErrors.name && (
            <span className="field-error">{validationErrors.name}</span>
          )}
        </div>

        <div className="field">
          <label>WHATSAPP NUMBER</label>
          <div className="phone-wrap">
            <input
              type="tel"
              name="phone"
              placeholder="10-digit mobile number"
              value={formData.phone}
              onChange={handleChange}
              maxLength={10}
              autoComplete="tel"
              className={phoneValid === true ? 'valid' : phoneValid === false ? 'invalid' : ''}
            />
            {phoneValid === true && <span className="phone-indicator valid-icon">✅</span>}
            {phoneValid === false && <span className="phone-indicator invalid-icon">❌</span>}
          </div>
          {validationErrors.phone && (
            <span className="field-error">{validationErrors.phone}</span>
          )}
          <span className="field-hint">Owner will WhatsApp you on this number</span>
        </div>

        {/* Delivery Address */}
        {formData.deliveryType === 'delivery' && (
          <>
            <div className="section-icon red">📍</div>
            <h2 className="section-heading">Delivery Address</h2>
            <div className="field">
              <textarea
                name="address"
                rows="3"
                placeholder="Street name, building number, apartment, landmark..."
                value={formData.address}
                onChange={handleChange}
              />
              {validationErrors.address && (
                <span className="field-error">{validationErrors.address}</span>
              )}
            </div>
          </>
        )}

        {/* Special Notes */}
        <div className="field">
          <label>SPECIAL INSTRUCTIONS (optional)</label>
          <textarea
            name="notes"
            rows="2"
            placeholder="E.g., Extra spicy, no onions, ring the bell..."
            value={formData.notes}
            onChange={handleChange}
          />
        </div>

        {/* Discount */}
        <DiscountInput
          subtotal={subtotal}
          currency={currency}
          onApply={(d) => setDiscount(d)}
          onRemove={() => setDiscount(null)}
          appliedDiscount={discount}
        />

        {/* Order Summary */}
        <h2 className="section-heading" style={{ marginTop: 'var(--space-5)' }}>Order Summary</h2>
        <OrderSummary
          subtotal={subtotal}
          discount={discountAmount}
          deliveryFee={deliveryFee}
          currency={currency}
          itemCount={getCartItemCount()}
        />

        {!minOrderMet && (
          <p className="min-warn">
            Min. order is {currency}{minOrder}. Add {currency}{minOrder - currentSubtotal} more.
          </p>
        )}

        <button
          type="submit"
          className="submit-btn gradient-primary"
          disabled={!minOrderMet || !phoneIsValid || isNavigating}
        >
          {isNavigating ? '✅ Opening WhatsApp...' : '📲 WhatsApp Order →'}
        </button>

        <p className="wa-note">
          WhatsApp will open with your order details. Send the message to confirm!
        </p>
      </form>

      <style jsx>{`
        .checkout-page { max-width: 480px; margin: 0 auto; padding: 0 var(--space-6) var(--space-6); }
        .page-top { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) 0; }
        .back-arrow { font-size: 1.3rem; color: var(--color-primary); padding: 8px; }
        h1 { font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; }

        .toggle-row { display: flex; background: var(--color-surface-container-low); border-radius: var(--radius-full); padding: 4px; margin-bottom: var(--space-5); gap: 4px; }
        .toggle-btn { flex: 1; padding: 10px; border: none; background: transparent; border-radius: var(--radius-full); font-family: var(--font-body); font-weight: 500; font-size: 0.9rem; color: var(--color-text-variant); cursor: pointer; transition: all 0.25s; }
        .toggle-btn.active { background: var(--color-primary); color: white; font-weight: 600; box-shadow: 0 2px 8px rgba(255,82,0,0.25); }

        .section-icon { font-size: 1.1rem; margin-bottom: var(--space-1); }
        .section-icon.red { color: var(--color-primary); }
        .section-heading { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; margin-bottom: var(--space-3); }

        .field { margin-bottom: var(--space-4); }
        .field label { display: block; font-size: 0.7rem; font-weight: 600; color: var(--color-text-variant); letter-spacing: 0.08em; margin-bottom: var(--space-1); }
        .field input, .field textarea {
          width: 100%; box-sizing: border-box;
          padding: 14px var(--space-3);
          border: none;
          border-bottom: 1.5px solid var(--color-outline-variant);
          background: transparent;
          font-family: var(--font-body);
          font-size: 0.95rem;
          color: var(--color-text);
          outline: none;
          transition: border-color 0.2s;
        }
        .field input:focus { border-bottom-color: var(--color-primary); }
        .field input.valid { border-bottom-color: #22c55e; }
        .field input.invalid { border-bottom-color: var(--color-error, #ef4444); }
        .field textarea { resize: none; border: 1.5px solid var(--color-outline-variant); border-radius: var(--radius-md); padding: var(--space-3); }
        .field textarea:focus { border-color: var(--color-primary); }

        .phone-wrap { position: relative; }
        .phone-wrap input { padding-right: 2.5rem; }
        .phone-indicator { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 1rem; pointer-events: none; }

        .field-error { display: block; font-size: 0.78rem; color: var(--color-error, #ef4444); margin-top: 4px; font-weight: 500; }
        .field-hint { display: block; font-size: 0.75rem; color: var(--color-text-variant); margin-top: 4px; opacity: 0.8; }

        .min-warn { color: var(--color-error, #ef4444); font-size: 0.85rem; font-weight: 500; text-align: center; margin: var(--space-2) 0; }

        .submit-btn {
          display: block; width: 100%; padding: 16px;
          border: none; border-radius: var(--radius-lg);
          color: white; font-family: var(--font-display);
          font-weight: 700; font-size: 1.05rem;
          cursor: pointer; margin-top: var(--space-3);
          box-shadow: 0 4px 16px rgba(255,82,0,0.3);
          transition: transform 0.15s, opacity 0.15s;
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .wa-note { text-align: center; font-size: 0.78rem; color: var(--color-text-variant); margin-top: var(--space-2); opacity: 0.8; }
      `}</style>
    </div>
  );
}
