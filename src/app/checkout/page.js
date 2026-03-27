"use client";

import { useEffect, useState } from 'react';
import { getCart, getCartSubtotal, getCartItemCount, clearCart } from '../../lib/cart';
import { useStore } from '../../lib/StoreContext';
import { placeOrder } from '../../lib/api';
import OrderSummary from '../../components/OrderSummary';
import DiscountInput from '../../components/DiscountInput';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  const { storeData, loading: storeLoading, showToast } = useStore();
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);

  const [formData, setFormData] = useState({
    name: '', phone: '',
    deliveryType: 'delivery', address: '',
    notes: '', paymentMethod: 'razorpay'
  });

  const [discount, setDiscount] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('checkoutData');
      if (saved) setFormData(prev => ({ ...prev, ...JSON.parse(saved), paymentMethod: 'razorpay' }));
    } catch(e) {}
  }, []);

  useEffect(() => {
    setCartItems(getCart());
    setSubtotal(getCartSubtotal());
  }, []);

  if (storeLoading) return null;

  const store = storeData?.store || {};
  const currency = store.currency || '₹';
  const deliveryFee = (formData.deliveryType === 'delivery' && store.deliveryFee) ? Number(store.deliveryFee) : 0;
  const minOrder = Number(store.minOrder || 0);
  const currentSubtotal = getCartSubtotal();
  const minOrderMet = currentSubtotal >= minOrder;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!minOrderMet) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      localStorage.setItem('checkoutData', JSON.stringify({ name: formData.name, phone: formData.phone, address: formData.address }));
    } catch(e) {}

    const orderData = {
      customer: { name: formData.name, phone: formData.phone },
      items: cartItems.map(item => ({ id: item.id, name: item.name, qty: item.qty, price: item.price, addons: item.addons })),
      discountCode: discount?.code || "",
      deliveryType: formData.deliveryType,
      address: formData.deliveryType === 'delivery' ? formData.address : "",
      notes: formData.notes,
      paymentMethod: formData.paymentMethod
    };

    const result = await placeOrder(orderData);
    setIsSubmitting(false);

    if (result?.success) {
      clearCart();
      router.push(`/confirmation?oid=${result.orderId}&wa=${encodeURIComponent(result.waLink || '')}&rzp=${encodeURIComponent(result.razorpayLink || '')}&upi=${encodeURIComponent(result.upiQrUrl || '')}`);
    } else {
      const msg = result?.message || 'Failed to place order. Please try again.';
      setSubmitError(msg);
      showToast(msg, 'error');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '3rem 2rem', textAlign: 'center' }}>
        <h2>Your Cart is Empty</h2>
        <Link href="/">Back to Menu</Link>
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
          <button className={`toggle-btn ${formData.deliveryType === 'delivery' ? 'active' : ''}`} onClick={() => setFormData(p => ({...p, deliveryType: 'delivery'}))}>Delivery</button>
        )}
        <button className={`toggle-btn ${formData.deliveryType === 'pickup' ? 'active' : ''}`} onClick={() => setFormData(p => ({...p, deliveryType: 'pickup'}))}>Pickup</button>
      </div>

      {submitError && <div className="error-banner">{submitError}</div>}

      <form onSubmit={handleSubmit} id="checkout-form">
        {/* Personal Details */}
        <div className="section-icon">👤</div>
        <h2 className="section-heading">Personal Details</h2>
        <div className="field">
          <label>FULL NAME</label>
          <input type="text" name="name" required placeholder="e.g. Julianne Moore" value={formData.name} onChange={handleChange} />
        </div>
        <div className="field">
          <label>PHONE NUMBER</label>
          <input type="tel" name="phone" required placeholder="10-digit mobile number" value={formData.phone} onChange={handleChange} />
        </div>

        {/* Delivery Address */}
        {formData.deliveryType === 'delivery' && (
          <>
            <div className="section-icon red">📍</div>
            <h2 className="section-heading">Delivery Address</h2>
            <div className="field">
              <textarea name="address" required rows="3" placeholder="Street name, building number, and apartment details..." value={formData.address} onChange={handleChange}></textarea>
            </div>
          </>
        )}

        {/* Special Notes */}
        <div className="field">
          <label>SPECIAL INSTRUCTIONS</label>
          <textarea name="notes" rows="2" placeholder="E.g., Extra spicy, ring the bell..." value={formData.notes} onChange={handleChange}></textarea>
        </div>

        {/* Discount */}
        <DiscountInput subtotal={subtotal} currency={currency} onApply={(d) => setDiscount(d)} onRemove={() => setDiscount(null)} appliedDiscount={discount} />

        {/* Order Summary */}
        <h2 className="section-heading" style={{ marginTop: 'var(--space-5)' }}>Order Summary</h2>
        <OrderSummary subtotal={subtotal} discount={discount ? discount.amount : 0} deliveryFee={deliveryFee} currency={currency} itemCount={getCartItemCount()} />

        {!minOrderMet && (
          <p className="min-warn">Min. order is {currency}{minOrder}. Add {currency}{minOrder - currentSubtotal} more.</p>
        )}

        <button type="submit" className="submit-btn gradient-primary" disabled={!minOrderMet || isSubmitting}>
          {isSubmitting ? 'Processing...' : '💬 Confirm on WhatsApp →'}
        </button>
      </form>

      <style jsx>{`
        .checkout-page { max-width: 480px; margin: 0 auto; padding: 0 var(--space-6) var(--space-6); }
        .page-top { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) 0; }
        .back-arrow { font-size: 1.3rem; color: var(--color-primary); padding: 8px; }
        h1 { font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; }
        
        .toggle-row { display: flex; background: var(--color-surface-container-low); border-radius: var(--radius-full); padding: 4px; margin-bottom: var(--space-5); }
        .toggle-btn { flex: 1; padding: 10px; border: none; background: transparent; border-radius: var(--radius-full); font-family: var(--font-body); font-weight: 500; font-size: 0.9rem; color: var(--color-text-variant); cursor: pointer; transition: all 0.25s; }
        .toggle-btn.active { background: var(--color-primary); color: white; font-weight: 600; box-shadow: 0 2px 8px rgba(255,82,0,0.25); }
        
        .error-banner { background: var(--color-error); color: white; padding: var(--space-3); border-radius: var(--radius-md); margin-bottom: var(--space-3); font-size: 0.9rem; }
        
        .section-icon { font-size: 1.1rem; margin-bottom: var(--space-1); }
        .section-icon.red { color: var(--color-primary); }
        .section-heading { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; margin-bottom: var(--space-3); }
        
        .field { margin-bottom: var(--space-3); }
        .field label { display: block; font-size: 0.7rem; font-weight: 500; color: var(--color-text-variant); letter-spacing: 0.08em; margin-bottom: var(--space-1); }
        .field input, .field textarea {
          width: 100%;
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
        .field input:focus, .field textarea:focus { border-bottom-color: var(--color-primary); }
        .field textarea { resize: none; border: 1.5px solid var(--color-outline-variant); border-radius: var(--radius-md); padding: var(--space-3); }
        .field textarea:focus { border-color: var(--color-primary); }
        
        .min-warn { color: var(--color-error); font-size: 0.85rem; font-weight: 500; text-align: center; margin: var(--space-2) 0; }
        
        .submit-btn {
          display: block;
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: var(--radius-lg);
          color: white;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.05rem;
          cursor: pointer;
          margin-top: var(--space-3);
          box-shadow: 0 4px 16px rgba(255,82,0,0.3);
          transition: transform 0.15s;
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
