"use client";

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../../lib/StoreContext';
import { placeOrder } from '../../lib/api';
import { confirmWhatsapp } from '../../lib/api';
import Link from 'next/link';
import { CheckCircle, Loader2, MessageCircle, RotateCcw, QrCode, CreditCard, ArrowRight } from 'lucide-react';

// ─── Skeleton Pulse ─────────────────────────────────────────────────────────
function Skeleton({ width = '100%', height = '1.2rem', radius = '8px', style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

// ─── Order Summary Card ──────────────────────────────────────────────────────
function OrderSummaryCard({ order, serverTotal }) {
  const [open, setOpen] = useState(false);
  const currency = '₹';
  const displayTotal = serverTotal !== undefined ? serverTotal : order.total;

  return (
    <div className="summary-card">
      <button
        type="button"
        className="summary-toggle"
        onClick={() => setOpen(o => !o)}
      >
        <div className="summary-toggle-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <div className="summary-toggle-text">
          <span className="summary-toggle-title">Order Summary</span>
          <span className="summary-toggle-count">{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
        </div>
        <div className={`summary-chevron ${open ? 'open' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {open && (
        <div className="summary-body animate-slide-up">
          {order.items.map((item, i) => {
            const addonsTotal = (item.addons || []).reduce((s, a) => s + (a.price || 0), 0);
            const lineTotal = (item.price + addonsTotal) * item.qty;
            return (
              <div key={i} className="summary-item">
                <div className="summary-item-header">
                  <span className="summary-item-name">{item.name}</span>
                  <span className="summary-item-qty">× {item.qty}</span>
                </div>
                <div className="summary-item-price">{currency}{lineTotal}</div>
                {(item.addons || []).map((addon, j) => (
                  <div key={j} className="summary-addon">
                    <span className="addon-plus">+</span>
                    <span className="addon-name">{addon.name}</span>
                    <span className="addon-price">+{currency}{addon.price || 0}</span>
                  </div>
                ))}
              </div>
            );
          })}

          <div className="summary-divider" />

          <div className="summary-row">
            <span className="summary-label">Subtotal</span>
            <span className="summary-value">{currency}{order.subtotal}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="summary-row summary-row-discount">
              <span className="summary-label">
                Discount
                {order.discountCode && <span className="discount-code"> ({order.discountCode})</span>}
              </span>
              <span className="summary-value text-success">-{currency}{order.discountAmount}</span>
            </div>
          )}
          {order.deliveryFee > 0 && (
            <div className="summary-row">
              <span className="summary-label">
                {order.deliveryType === 'delivery' ? 'Delivery Fee' : 'Pickup'}
              </span>
              <span className="summary-value">{currency}{order.deliveryFee}</span>
            </div>
          )}
          <div className="summary-row summary-row-total">
            <span className="summary-label-total">Total</span>
            <span className="summary-value-total">{currency}{displayTotal}</span>
          </div>

          {serverTotal !== undefined && serverTotal !== order.total && (
            <div className="summary-adjusted">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>Total adjusted by store</span>
            </div>
          )}

          <div className="summary-divider" />

          {order.deliveryType === 'delivery' && order.address && (
            <div className="summary-meta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>{order.address}</span>
            </div>
          )}
          {order.deliveryType === 'pickup' && (
            <div className="summary-meta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H6"/>
                <path d="M8 16H4a2 2 0 1 0 0 4h4"/>
              </svg>
              <span>Self Pickup</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Confirmation Content ───────────────────────────────────────────────
function ConfirmationContent() {
  const { storeData } = useStore();

  // Order state: 'loading' | 'success' | 'failed' | 'empty'
  const [orderState, setOrderState] = useState('loading');
  const [pendingOrder, setPendingOrder] = useState(null);
  const [waUrl, setWaUrl] = useState('');
  const [orderResult, setOrderResult] = useState(null);

  // "I Sent It" button state
  const [waSentState, setWaSentState] = useState('idle');
  const [retryState, setRetryState] = useState('idle');

  const upiQrUrl = orderResult?.upiQrUrl || storeData?.store?.upiQrUrl || '';
  const razorpayLink = orderResult?.razorpayLink || '';
  const orderId = orderResult?.orderId || pendingOrder?.orderId || '';
  const serverTotal = orderResult?.total;

  // Fire placeOrder once on mount
  useEffect(() => {
    let cancelled = false;
    const POLLING_VERSION = 'v1';

    async function init() {
      try {
        let storedPending, storedWa, storedResult, alreadySubmitted;
        try {
          storedPending = sessionStorage.getItem(`pendingOrderData:${POLLING_VERSION}`);
          storedWa = sessionStorage.getItem(`pendingWaUrl:${POLLING_VERSION}`);
          storedResult = sessionStorage.getItem(`orderResult:${POLLING_VERSION}`);
          alreadySubmitted = sessionStorage.getItem(`orderSubmitted:${POLLING_VERSION}`) === 'true';
        } catch (e) {
          console.error('Session storage inaccessible:', e);
        }

        if (storedWa) setWaUrl(storedWa);

        if (alreadySubmitted && storedResult) {
          const parsed = JSON.parse(storedResult);
          if (!cancelled) {
            setPendingOrder(storedPending ? JSON.parse(storedPending) : null);
            setOrderResult(parsed);
            setOrderState('success');
          }
          return;
        }

        if (!storedPending) {
          if (!cancelled) setOrderState('empty');
          return;
        }

        const pending = JSON.parse(storedPending);
        if (!cancelled) setPendingOrder(pending);

        let attempts = 0;
        const maxAttempts = 30;
        let fallbackStarted = false;

        const pollInterval = setInterval(() => {
          if (cancelled) {
            clearInterval(pollInterval);
            return;
          }

          let resultStr = null;
          try {
            resultStr = sessionStorage.getItem(`orderResult:${POLLING_VERSION}`);
          } catch (e) {}

          if (resultStr) {
            clearInterval(pollInterval);
            const res = JSON.parse(resultStr);
            setOrderResult(res);
            setOrderState('success');
            return;
          }

          attempts++;

          if (attempts === 4 && !fallbackStarted) {
            try {
              if (!sessionStorage.getItem(`orderSubmitted:${POLLING_VERSION}`)) {
                console.log('Head-start order taking too long, firing fallback from confirmation...');
                fallbackStarted = true;
                fireFallbackOrder(pending);
              }
            } catch (e) {
              fallbackStarted = true;
              fireFallbackOrder(pending);
            }
          }

          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            if (!cancelled && orderState === 'loading') setOrderState('failed');
          }
        }, 500);

        async function fireFallbackOrder(p) {
          try {
            const result = await placeOrder(p);
            if (!cancelled && result?.success) {
              try {
                sessionStorage.setItem(`orderResult:${POLLING_VERSION}`, JSON.stringify(result));
                sessionStorage.setItem(`orderSubmitted:${POLLING_VERSION}`, 'true');
              } catch (e) {}
              setOrderResult(result);
              setOrderState('success');
            }
          } catch (e) {
            console.error('Fallback order failed:', e);
          }
        }

      } catch (err) {
        console.error('Confirmation init error:', err);
        if (!cancelled) setOrderState('failed');
      }
    }

    init();
    return () => { cancelled = true; };
  }, [orderState]);

  const handleSentWhatsApp = useCallback(async () => {
    if (waSentState !== 'idle' || !orderId) return;
    setWaSentState('sending');
    await confirmWhatsapp(orderId);
    setWaSentState('done');
  }, [orderId, waSentState]);

  const openWhatsApp = () => {
    if (waUrl) window.open(waUrl, '_blank');
  };

  const handleRetry = useCallback(async () => {
    if (retryState !== 'idle' || !pendingOrder) return;
    setRetryState('retrying');
    try {
      const result = await placeOrder(pendingOrder);
      if (result?.success) {
        sessionStorage.setItem('orderResult', JSON.stringify(result));
        sessionStorage.setItem('orderSubmitted', 'true');
        setOrderResult(result);
        setOrderState('success');
        setRetryState('done');
      } else {
        setRetryState('idle');
      }
    } catch {
      setRetryState('idle');
    }
  }, [pendingOrder, retryState]);

  // ── EMPTY STATE ──
  if (orderState === 'empty') {
    return (
      <div className="confirm-page confirm-page--empty">
        <div className="empty-state-container animate-fade-in">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <h1 className="empty-title">No Recent Order Found</h1>
          <p className="empty-description">
            It looks like you haven&apos;t placed an order yet.
          </p>
          <Link href="/" className="btn btn-primary">
            Browse Menu
          </Link>
        </div>
        <ConfirmStyles />
      </div>
    );
  }

  // ── LOADING STATE ──
  if (orderState === 'loading' && !pendingOrder) {
    return (
      <div className="confirm-page">
        <div className="hero hero--loading animate-fade-in">
          <div className="check-circle check-circle--loading">
            <Loader2 className="spinner spinner--large" />
          </div>
          <Skeleton width="200px" height="28px" style={{ margin: '0 auto 12px' }} />
          <Skeleton width="120px" height="16px" style={{ margin: '0 auto' }} />
        </div>
        <div className="actions-column">
          <Skeleton height="88px" radius="12px" />
          <Skeleton height="88px" radius="12px" />
        </div>
        <ConfirmStyles />
      </div>
    );
  }

  if (orderState === 'loading' && pendingOrder) {
    return (
      <div className="confirm-page">
        <div className="hero animate-fade-in">
          <div className="check-circle check-circle--loading">
            <Loader2 className="spinner spinner--large" />
          </div>
          <h1 className="hero-title">Processing Your Order...</h1>
          <p className="order-id order-id--subtitle">#{pendingOrder.orderId}</p>
        </div>

        {waUrl && (
          <div className="actions-column">
            <button onClick={openWhatsApp} className="action-card action-card--wa animate-slide-up delay-1">
              <div className="action-icon-wrapper action-icon-wrapper--wa">
                <MessageCircle size="22" />
              </div>
              <div className="action-content">
                <h3 className="action-title">WhatsApp not open?</h3>
                <p className="action-description">Tap to re-send your order</p>
              </div>
              <ArrowRight size="18" className="action-arrow-icon" />
            </button>
          </div>
        )}

        <div className="processing-note">
          <span className="dot-pulse" />
          <span>Saving your order to our kitchen...</span>
        </div>
        <ConfirmStyles />
      </div>
    );
  }

  // ── FAILED STATE ──
  if (orderState === 'failed') {
    return (
      <div className="confirm-page">
        <div className="hero hero--partial-success animate-fade-in">
          <div className="check-circle check-circle--success">
            <CheckCircle size="32" />
          </div>
          <h1 className="hero-title">Message Sent</h1>
          <span className="badge badge--success">WhatsApp ✅</span>
          <p className="order-id">#{pendingOrder?.orderId}</p>
        </div>

        <div className="info-banner info-banner--warning animate-slide-up">
          <div className="info-banner-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p>Your WhatsApp message was sent! We're having a brief delay saving to our system.</p>
        </div>

        <div className="actions-column">
          <button
            onClick={handleRetry}
            className="action-card action-card--retry animate-slide-up delay-1"
            disabled={retryState === 'retrying'}
          >
            {retryState === 'retrying' ? (
              <>
                <div className="action-icon-wrapper">
                  <Loader2 size="20" className="spinner" />
                </div>
                <div className="action-content">
                  <h3 className="action-title">Saving...</h3>
                  <p className="action-description">Please wait</p>
                </div>
              </>
            ) : (
              <>
                <div className="action-icon-wrapper action-icon-wrapper--retry">
                  <RotateCcw size="20" />
                </div>
                <div className="action-content">
                  <h3 className="action-title">Retry Save to Kitchen</h3>
                  <p className="action-description">Re-send order details</p>
                </div>
              </>
            )}
          </button>

          {waUrl && (
            <button onClick={openWhatsApp} className="action-card action-card--wa animate-slide-up delay-2">
              <div className="action-icon-wrapper action-icon-wrapper--wa">
                <MessageCircle size="22" />
              </div>
              <div className="action-content">
                <h3 className="action-title">Re-send on WhatsApp</h3>
                <p className="action-description">Opens WhatsApp with order</p>
              </div>
              <ArrowRight size="18" className="action-arrow-icon" />
            </button>
          )}
        </div>

        <div className="footer-note animate-fade-in delay-3">
          <Link href="/" className="back-link">
            <ArrowRight size="16" className="back-link-icon" />
            Back to Menu
          </Link>
        </div>
        <ConfirmStyles />
      </div>
    );
  }

  // ── SUCCESS STATE ──
  return (
    <div className="confirm-page">
      <div className="hero animate-fade-in">
        <div className="check-circle check-circle--success check-circle--large">
          <CheckCircle size="40" />
        </div>
        <h1 className="hero-title">Order Confirmed!</h1>
        <div className="order-badge">
          <span className="order-id-label">Order #</span>
          <span className="order-id-value">{orderId}</span>
        </div>
      </div>

      <div className="actions-column">
        {/* WhatsApp Re-send */}
        {waUrl && (
          <button onClick={openWhatsApp} className="action-card action-card--wa animate-slide-up delay-1">
            <div className="action-icon-wrapper action-icon-wrapper--wa">
              <MessageCircle size="22" />
            </div>
            <div className="action-content">
              <h3 className="action-title">Send on WhatsApp</h3>
              <p className="action-description">
                {waSentState === 'done' ? 'Tap again if needed' : 'Open WhatsApp with order'}
              </p>
            </div>
            <ArrowRight size="18" className="action-arrow-icon" />
          </button>
        )}

        {/* "I Sent It" confirmation */}
        {waSentState !== 'done' ? (
          <button
            onClick={handleSentWhatsApp}
            className="action-card action-card--confirmed animate-slide-up delay-2"
            disabled={waSentState === 'sending'}
          >
            {waSentState === 'sending' ? (
              <>
                <div className="action-icon-wrapper">
                  <Loader2 size="20" className="spinner" />
                </div>
                <div className="action-content">
                  <h3 className="action-title">Confirming...</h3>
                  <p className="action-description">Please wait</p>
                </div>
              </>
            ) : (
              <>
                <div className="action-icon-wrapper action-icon-wrapper--confirmed">
                  <CheckCircle size="20" />
                </div>
                <div className="action-content">
                  <h3 className="action-title">I&apos;ve Sent the Message</h3>
                  <p className="action-description">Tap after sending on WhatsApp</p>
                </div>
              </>
            )}
          </button>
        ) : (
          <div className="action-card action-card--done animate-slide-up delay-2">
            <div className="action-icon-wrapper action-icon-wrapper--done">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="action-content">
              <h3 className="action-title">Order Received!</h3>
              <p className="action-description">The kitchen will prepare your order</p>
            </div>
          </div>
        )}

        {/* UPI QR Code */}
        {upiQrUrl && (
          <div className="action-card action-card--qr animate-slide-up delay-3">
            <div className="qr-content">
              <div className="qr-icon-wrapper">
                <QrCode size="22" />
              </div>
              <div className="qr-info">
                <h3 className="action-title">Pay via UPI</h3>
                <p className="action-description">Scan with Google Pay, PhonePe</p>
              </div>
            </div>
            <img src={upiQrUrl} alt="UPI QR Code" className="qr-img" />
          </div>
        )}

        {/* Razorpay Pay Now */}
        {razorpayLink && (
          <a href={razorpayLink} className="action-card action-card--pay animate-slide-up delay-3" target="_blank" rel="noreferrer">
            <div className="action-icon-wrapper action-icon-wrapper--pay">
              <CreditCard size="20" />
            </div>
            <div className="action-content">
              <h3 className="action-title">Pay Online</h3>
              <p className="action-description">Secure payment via Razorpay</p>
              <span className="pay-amount">₹{serverTotal || pendingOrder?.total || ''}</span>
            </div>
            <ArrowRight size="18" className="action-arrow-icon" />
          </a>
        )}
      </div>

      {/* Order Summary */}
      {pendingOrder && (
        <div className="summary-section animate-slide-up delay-4">
          <OrderSummaryCard order={pendingOrder} serverTotal={serverTotal} />
        </div>
      )}

      <div className="footer-note animate-fade-in delay-5">
        <p className="thank-you-text">
          Thank you for choosing <strong>{storeData?.store?.name || 'us'}</strong>!
        </p>
        <Link href="/" className="back-link">
          <ArrowRight size="16" className="back-link-icon" />
          Back to Menu
        </Link>
      </div>

      <ConfirmStyles />
    </div>
  );
}

// ─── Scoped Styles ────────────────────────────────────────────────────────────
function ConfirmStyles() {
  return (
    <style jsx>{`
      .confirm-page {
        max-width: 480px;
        margin: 0 auto;
        padding: var(--space-6);
        min-height: 100vh;
      }

      .confirm-page--empty {
        padding-top: 6rem;
        padding-bottom: 2rem;
      }

      /* Empty State */
      .empty-state-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: var(--space-8) var(--space-6);
      }

      .empty-icon {
        width: 120px;
        height: 120px;
        background: color-mix(in srgb, var(--color-primary) 6%, transparent);
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: var(--space-6);
        color: var(--color-primary);
        opacity: 0.8;
      }

      .empty-title {
        font-family: var(--font-display);
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-text);
        margin: 0 0 var(--space-3);
      }

      .empty-description {
        font-family: var(--font-body);
        font-size: 1rem;
        color: var(--color-text-variant);
        margin: 0 0 var(--space-6);
        line-height: 1.6;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        padding: 12px 24px;
        border-radius: var(--radius-lg);
        font-family: var(--font-display);
        font-weight: 600;
        font-size: 0.95rem;
        text-decoration: none;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        border: none;
        cursor: pointer;
      }

      .btn-primary {
        background: var(--color-primary);
        color: white;
        box-shadow: 0 4px 16px rgba(255, 82, 0, 0.25);
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 24px rgba(255, 82, 0, 0.35);
      }

      /* Hero Section */
      .hero {
        text-align: center;
        margin-bottom: var(--space-8);
        padding-top: var(--space-6);
      }

      .hero--loading {
        padding-top: var(--space-8);
      }

      .hero--partial-success {
        padding-top: var(--space-4);
      }

      .check-circle {
        width: 80px;
        height: 80px;
        border-radius: var(--radius-full);
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto var(--space-5);
        box-shadow: 0 12px 32px rgba(255, 82, 0, 0.2);
      }

      .check-circle--large {
        width: 96px;
        height: 96px;
        box-shadow: 0 16px 40px rgba(255, 82, 0, 0.25);
      }

      .check-circle--loading {
        background: var(--color-surface-container);
        box-shadow: var(--shadow-ambient);
      }

      .check-circle--success {
        background: linear-gradient(135deg, #16a34a, #22c55e);
        box-shadow: 0 12px 32px rgba(34, 197, 94, 0.2);
      }

      .spinner {
        width: 36px;
        height: 36px;
        color: var(--color-primary);
        animation: spin 1s linear infinite;
      }

      .spinner--large {
        width: 44px;
        height: 44px;
      }

      .hero-title {
        font-family: var(--font-display);
        font-size: 1.75rem;
        font-weight: 800;
        color: var(--color-text);
        margin: 0 0 var(--space-3);
        letter-spacing: -0.02em;
      }

      .order-id {
        font-family: var(--font-body);
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-text-variant);
        margin: 0;
        letter-spacing: 0.05em;
      }

      .order-id--subtitle {
        margin-top: var(--space-1);
      }

      .order-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background: var(--color-surface-container);
        border-radius: var(--radius-full);
        margin-top: var(--space-2);
      }

      .order-id-label {
        font-family: var(--font-body);
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--color-text-variant);
      }

      .order-id-value {
        font-family: var(--font-display);
        font-size: 1rem;
        font-weight: 700;
        color: var(--color-primary);
        letter-spacing: 0.08em;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: var(--radius-full);
        font-size: 0.8rem;
        font-weight: 600;
        margin-top: var(--space-3);
      }

      .badge--success {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
      }

      /* Actions */
      .actions-column {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .action-card {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-4);
        background: var(--color-surface-lowest);
        border-radius: var(--radius-lg);
        text-decoration: none;
        color: var(--color-text);
        border: none;
        box-shadow: var(--shadow-ambient);
        cursor: pointer;
        width: 100%;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      .action-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--gradient-action, transparent);
        opacity: 0;
        transition: opacity 0.2s;
      }

      .action-card:hover:not(:disabled) {
        transform: translateY(-3px);
        box-shadow: 0 8px 24px rgba(42, 46, 65, 0.1);
      }

      .action-card:hover::before {
        opacity: 1;
      }

      .action-card:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .action-card:active:not(:disabled) {
        transform: translateY(-1px);
      }

      .action-icon-wrapper {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: white;
      }

      .action-icon-wrapper--wa {
        background: linear-gradient(135deg, #25D366, #20BA61);
        box-shadow: 0 4px 12px rgba(37, 211, 102, 0.25);
      }

      .action-icon-wrapper--confirmed {
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
        box-shadow: 0 4px 12px rgba(255, 82, 0, 0.25);
      }

      .action-icon-wrapper--retry {
        background: linear-gradient(135deg, #3b82f6, #6366f1);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
      }

      .action-icon-wrapper--pay {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
      }

      .action-icon-wrapper--done {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
      }

      .action-icon-wrapper .spinner {
        color: white;
      }

      .action-content {
        flex: 1;
        min-width: 0;
      }

      .action-title {
        font-family: var(--font-display);
        font-size: 1rem;
        font-weight: 700;
        color: var(--color-text);
        margin: 0 0 4px;
        letter-spacing: -0.01em;
      }

      .action-description {
        font-family: var(--font-body);
        font-size: 0.85rem;
        color: var(--color-text-variant);
        margin: 0;
        line-height: 1.4;
      }

      .action-arrow-icon {
        color: var(--color-primary);
        flex-shrink: 0;
        transition: transform 0.2s;
      }

      .action-card:hover .action-arrow-icon {
        transform: translateX(4px);
      }

      /* QR Card */
      .qr-card {
        flex-direction: column;
        align-items: stretch;
      }

      .qr-content {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-bottom: var(--space-3);
      }

      .qr-icon-wrapper {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-md);
        background: linear-gradient(135deg, #f59e0b, #eab308);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .qr-info {
        flex: 1;
        min-width: 0;
      }

      .qr-img {
        max-width: 200px;
        width: 100%;
        height: auto;
        border-radius: var(--radius-md);
        margin: 0 auto;
        box-shadow: var(--shadow-ambient);
      }

      /* Pay Card */
      .pay-amount {
        font-family: var(--font-display);
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--color-primary);
        margin-top: var(--space-1);
      }

      /* Info Banner */
      .info-banner {
        background: color-mix(in srgb, #22c55e 8%, transparent);
        border: 1px solid color-mix(in srgb, #22c55e 20%, transparent);
        border-radius: var(--radius-md);
        padding: var(--space-4);
        margin: 0 var(--space-6) var(--space-6);
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
      }

      .info-banner--warning {
        background: color-mix(in srgb, var(--color-warning) 8%, transparent);
        border-color: color-mix(in srgb, var(--color-warning) 20%, transparent);
      }

      .info-banner-icon {
        flex-shrink: 0;
        color: var(--color-warning);
        margin-top: 2px;
      }

      .info-banner p {
        font-family: var(--font-body);
        font-size: 0.9rem;
        color: var(--color-text);
        margin: 0;
        line-height: 1.6;
      }

      /* Processing Note */
      .processing-note {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        color: var(--color-text-variant);
        font-size: 0.85rem;
        margin-top: var(--space-4);
      }

      /* Order Summary */
      .summary-section {
        margin-bottom: var(--space-6);
      }

      .summary-card {
        background: var(--color-surface-lowest);
        border-radius: var(--radius-lg);
        overflow: hidden;
        box-shadow: var(--shadow-ambient);
        border: 1px solid var(--color-border);
      }

      .summary-toggle {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        width: 100%;
        padding: var(--space-4);
        background: transparent;
        border: none;
        font-family: var(--font-display);
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--color-text);
        cursor: pointer;
        transition: background 0.2s;
      }

      .summary-toggle:hover {
        background: color-mix(in srgb, var(--color-primary) 2%, transparent);
      }

      .summary-toggle-icon {
        width: 36px;
        height: 36px;
        border-radius: var(--radius-md);
        background: color-mix(in srgb, var(--color-primary) 6%, transparent);
        color: var(--color-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .summary-toggle-text {
        flex: 1;
        text-align: left;
      }

      .summary-toggle-title {
        display: block;
        font-weight: 700;
      }

      .summary-toggle-count {
        display: block;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--color-text-variant);
        margin-top: 2px;
      }

      .summary-chevron {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        color: var(--color-text-variant);
      }

      .summary-chevron.open {
        transform: rotate(180deg);
      }

      .summary-body {
        padding: 0 var(--space-4) var(--space-4);
        border-top: 1px solid var(--color-border);
        margin-top: 2px;
      }

      .summary-item {
        padding: var(--space-2) 0;
      }

      .summary-item-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 2px;
      }

      .summary-item-name {
        font-family: var(--font-body);
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--color-text);
      }

      .summary-item-qty {
        font-family: var(--font-display);
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--color-text-variant);
      }

      .summary-item-price {
        font-family: var(--font-display);
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--color-text);
        margin-left: auto;
        width: fit-content;
      }

      .summary-addon {
        display: flex;
        gap: 6px;
        font-size: 0.8rem;
        color: var(--color-text-variant);
        margin-top: 4px;
        padding-left: 0;
        align-items: baseline;
      }

      .addon-plus {
        color: var(--color-text-variant);
        opacity: 0.6;
      }

      .addon-name {
        flex: 1;
      }

      .addon-price {
        font-weight: 500;
        color: var(--color-text-variant);
      }

      .summary-divider {
        height: 1px;
        background: var(--color-border);
        margin: var(--space-3) 0;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        padding: var(--space-1) 0;
      }

      .summary-label {
        font-family: var(--font-body);
        font-size: 0.85rem;
        color: var(--color-text-variant);
      }

      .summary-value {
        font-family: var(--font-display);
        font-size: 0.88rem;
        font-weight: 600;
        color: var(--color-text);
      }

      .summary-row-discount .text-success {
        color: #22c55e;
      }

      .discount-code {
        font-size: 0.75rem;
        font-weight: 500;
        opacity: 0.8;
      }

      .summary-row-total {
        padding: var(--space-2) 0 0;
        margin-top: var(--space-2);
        border-top: 2px solid var(--color-border);
      }

      .summary-label-total {
        font-family: var(--font-display);
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--color-text);
      }

      .summary-value-total {
        font-family: var(--font-display);
        font-size: 1.2rem;
        font-weight: 800;
        color: var(--color-primary);
      }

      .summary-adjusted {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.75rem;
        color: var(--color-primary);
        margin-top: var(--space-2);
        padding: var(--space-1) var(--space-2);
        background: color-mix(in srgb, var(--color-primary) 5%, transparent);
        border-radius: var(--radius-sm);
        font-weight: 500;
      }

      .summary-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.82rem;
        color: var(--color-text-variant);
        margin-top: var(--space-2);
      }

      /* Footer */
      .footer-note {
        text-align: center;
        margin-top: var(--space-8);
        padding: var(--space-4) 0;
        border-top: 1px solid var(--color-border);
      }

      .thank-you-text {
        font-family: var(--font-body);
        font-size: 1rem;
        color: var(--color-text-variant);
        margin: 0 0 var(--space-4);
      }

      .thank-you-text strong {
        color: var(--color-text);
        font-weight: 600;
      }

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--color-primary);
        font-family: var(--font-display);
        font-weight: 600;
        text-decoration: none;
        font-size: 0.95rem;
        transition: gap 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .back-link:hover {
        gap: var(--space-3);
      }

      .back-link-icon {
        transition: transform 0.2s;
      }

      .back-link:hover .back-link-icon {
        transform: translateX(-2px);
      }

      /* Skeleton shimmer */
      .skeleton {
        background: linear-gradient(
          90deg,
          var(--color-surface-container-low) 25%,
          var(--color-surface-container) 50%,
          var(--color-surface-container-low) 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.4s infinite;
        display: block;
      }

      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.9); }
      }
    `}</style>
  );
}

export default function ConfirmationPage() {
  return <ConfirmationContent />;
}
