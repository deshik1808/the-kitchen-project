"use client";

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../../lib/StoreContext';
import { placeOrder } from '../../lib/api';
import { confirmWhatsapp } from '../../lib/api';
import Link from 'next/link';

// ─── Skeleton Pulse ─────────────────────────────────────────────────────────
function Skeleton({ width = '100%', height = '1.2rem', radius = '6px', style = {} }) {
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
        <span>📋 Your Order ({order.items.length} item{order.items.length > 1 ? 's' : ''})</span>
        <span className="summary-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="summary-body">
          {order.items.map((item, i) => {
            const addonsTotal = (item.addons || []).reduce((s, a) => s + (a.price || 0), 0);
            const lineTotal = (item.price + addonsTotal) * item.qty;
            return (
              <div key={i} className="summary-item">
                <div className="summary-item-row">
                  <span>{item.name} × {item.qty}</span>
                  <span>{currency}{lineTotal}</span>
                </div>
                {(item.addons || []).map((addon, j) => (
                  <div key={j} className="summary-addon">
                    + {addon.name} (+{currency}{addon.price || 0})
                  </div>
                ))}
              </div>
            );
          })}

          <div className="summary-divider" />

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{currency}{order.subtotal}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="summary-row discount">
              <span>Discount{order.discountCode ? ` (${order.discountCode})` : ''}</span>
              <span>-{currency}{order.discountAmount}</span>
            </div>
          )}
          {order.deliveryFee > 0 && (
            <div className="summary-row">
              <span>{order.deliveryType === 'delivery' ? 'Delivery Fee' : 'No Delivery'}</span>
              <span>{currency}{order.deliveryFee}</span>
            </div>
          )}
          <div className="summary-row total-row">
            <span>Total</span>
            <span>{currency}{displayTotal}</span>
          </div>

          {serverTotal !== undefined && serverTotal !== order.total && (
            <p className="total-adjusted">
              ⚠️ Total adjusted by store (original estimate: {currency}{order.total})
            </p>
          )}

          <div className="summary-divider" />

          {order.deliveryType === 'delivery' && order.address && (
            <p className="summary-meta">📍 {order.address}</p>
          )}
          {order.deliveryType === 'pickup' && (
            <p className="summary-meta">🏃 Self-Pickup</p>
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
  const [orderResult, setOrderResult] = useState(null); // from n8n

  // "I Sent It" button state
  const [waSentState, setWaSentState] = useState('idle'); // 'idle' | 'sending' | 'done'

  const upiQrUrl = orderResult?.upiQrUrl || storeData?.store?.upiQrUrl || '';
  const razorpayLink = orderResult?.razorpayLink || '';
  const orderId = orderResult?.orderId || pendingOrder?.orderId || '';
  const serverTotal = orderResult?.total;

  // Fire placeOrder once on mount
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const storedPending = localStorage.getItem('pendingOrderData');
        const storedWa = localStorage.getItem('pendingWaUrl');
        const storedResult = localStorage.getItem('orderResult');
        const alreadySubmitted = localStorage.getItem('orderSubmitted') === 'true';

        if (storedWa) setWaUrl(storedWa);

        // Case: page refreshed after successful submission
        if (alreadySubmitted && storedResult) {
          const parsed = JSON.parse(storedResult);
          if (!cancelled) {
            setPendingOrder(storedPending ? JSON.parse(storedPending) : null);
            setOrderResult(parsed);
            setOrderState('success');
          }
          return;
        }

        // Case: no order data at all
        if (!storedPending) {
          if (!cancelled) setOrderState('empty');
          return;
        }

        const pending = JSON.parse(storedPending);
        if (!cancelled) setPendingOrder(pending);

        // Fire order to n8n in background
        const result = await placeOrder(pending);

        if (cancelled) return;

        if (result?.success) {
          localStorage.setItem('orderResult', JSON.stringify(result));
          localStorage.setItem('orderSubmitted', 'true');
          setOrderResult(result);
          setOrderState('success');
        } else {
          // n8n failed — but WA was already sent. Show graceful fallback.
          setOrderState('failed');
        }
      } catch (err) {
        console.error('Confirmation init error:', err);
        if (!cancelled) setOrderState('failed');
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const handleSentWhatsApp = useCallback(async () => {
    if (waSentState !== 'idle' || !orderId) return;
    setWaSentState('sending');
    await confirmWhatsapp(orderId);
    // Always transition to done — fail silently
    setWaSentState('done');
  }, [orderId, waSentState]);

  const openWhatsApp = () => {
    if (waUrl) window.open(waUrl, '_blank');
  };

  // ── EMPTY STATE ──
  if (orderState === 'empty') {
    return (
      <div className="confirm-page center-page">
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <h2>No Recent Order Found</h2>
        <p style={{ color: 'var(--color-text-variant)', margin: '0.5rem 0 1.5rem' }}>
          It looks like you haven&apos;t placed an order yet.
        </p>
        <Link href="/" className="back-link-btn">← Browse Menu</Link>
        <ConfirmStyles />
      </div>
    );
  }

  // ── LOADING STATE ──
  if (orderState === 'loading' && !pendingOrder) {
    return (
      <div className="confirm-page">
        <div className="success-hero">
          <div className="check-circle loading-circle">
            <span className="spinner" />
          </div>
          <Skeleton width="220px" height="2rem" style={{ margin: '0 auto 0.5rem' }} />
          <Skeleton width="140px" height="1rem" style={{ margin: '0 auto' }} />
        </div>
        <div className="actions">
          <Skeleton height="80px" radius="16px" />
          <Skeleton height="80px" radius="16px" />
        </div>
        <ConfirmStyles />
      </div>
    );
  }

  if (orderState === 'loading' && pendingOrder) {
    return (
      <div className="confirm-page">
        <div className="success-hero">
          <div className="check-circle loading-circle">
            <span className="spinner" />
          </div>
          <h1>Processing Your Order...</h1>
          <p className="order-id">#{pendingOrder.orderId}</p>
        </div>

        {waUrl && (
          <div className="actions">
            <button onClick={openWhatsApp} className="action-card wa-card">
              <div className="action-icon">💬</div>
              <div>
                <h3>WhatsApp not open?</h3>
                <p>Tap to re-send your order</p>
              </div>
              <span className="action-arrow">→</span>
            </button>
          </div>
        )}

        <div className="loading-note">
          <span className="dot-pulse" />
          Saving your order to our kitchen...
        </div>
        <ConfirmStyles />
      </div>
    );
  }

  // ── FAILED STATE ──
  if (orderState === 'failed') {
    return (
      <div className="confirm-page">
        <div className="success-hero">
          <div className="check-circle" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1>Order Sent! ✅</h1>
          <p className="order-id">#{pendingOrder?.orderId}</p>
        </div>

        <div className="info-banner">
          <p>Your order was sent via WhatsApp. The kitchen will confirm your order shortly.</p>
        </div>

        {waUrl && (
          <div className="actions">
            <button onClick={openWhatsApp} className="action-card wa-card">
              <div className="action-icon">💬</div>
              <div>
                <h3>Re-send on WhatsApp</h3>
                <p>Opens WhatsApp with your order details</p>
              </div>
              <span className="action-arrow">→</span>
            </button>
          </div>
        )}

        <div className="footer-note">
          <Link href="/" className="back-link">← Back to Menu</Link>
        </div>
        <ConfirmStyles />
      </div>
    );
  }

  // ── SUCCESS STATE ──
  return (
    <div className="confirm-page">
      <div className="success-hero">
        <div className="check-circle">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1>Order Confirmed!</h1>
        <p className="order-id">#{orderId}</p>
      </div>

      <div className="actions">
        {/* WhatsApp Re-send */}
        {waUrl && (
          <button onClick={openWhatsApp} className="action-card wa-card">
            <div className="action-icon">💬</div>
            <div>
              <h3>Send Order on WhatsApp</h3>
              <p>
                {waSentState === 'done'
                  ? 'Tap again if needed'
                  : 'Tap to open WhatsApp with your order'}
              </p>
            </div>
            <span className="action-arrow">→</span>
          </button>
        )}

        {/* "I Sent It" confirmation */}
        {waSentState !== 'done' ? (
          <button
            onClick={handleSentWhatsApp}
            className="action-card confirm-wa-card"
            disabled={waSentState === 'sending'}
          >
            {waSentState === 'sending' ? (
              <><span className="btn-spinner" /> <span>Confirming...</span></>
            ) : (
              <>
                <div className="action-icon">✅</div>
                <div>
                  <h3>I&apos;ve Sent the Message</h3>
                  <p>Tap after sending on WhatsApp</p>
                </div>
              </>
            )}
          </button>
        ) : (
          <div className="action-card sent-done-card">
            <div className="action-icon">🎉</div>
            <div>
              <h3>Order Confirmed!</h3>
              <p>The kitchen will prepare your order soon</p>
            </div>
          </div>
        )}

        {/* UPI QR Code */}
        {upiQrUrl && (
          <div className="action-card qr-card">
            <h3>Pay via UPI</h3>
            <img src={upiQrUrl} alt="UPI QR Code" className="qr-img" />
            <p className="qr-note">Scan with Google Pay, PhonePe, or any UPI app</p>
          </div>
        )}

        {/* Razorpay Pay Now — only when link available */}
        {razorpayLink && (
          <a href={razorpayLink} className="action-card pay-card" target="_blank" rel="noreferrer">
            <div className="action-icon">💳</div>
            <div>
              <h3>Pay Online</h3>
              <p>Pay ₹{serverTotal || pendingOrder?.total || ''} securely via Razorpay</p>
            </div>
            <span className="action-arrow">→</span>
          </a>
        )}
      </div>

      {/* Order Summary */}
      {pendingOrder && (
        <OrderSummaryCard order={pendingOrder} serverTotal={serverTotal} />
      )}

      <div className="footer-note">
        <p>Thank you for choosing <strong>{storeData?.store?.name || 'us'}</strong>!</p>
        <Link href="/" className="back-link">← Back to Menu</Link>
      </div>

      <ConfirmStyles />
    </div>
  );
}

// ─── Scoped Styles ────────────────────────────────────────────────────────────
function ConfirmStyles() {
  return (
    <style jsx>{`
      .confirm-page { max-width: 480px; margin: 0 auto; padding: var(--space-6); }
      .center-page { text-align: center; padding-top: 4rem; }

      /* Hero */
      .success-hero { text-align: center; margin-bottom: var(--space-6); }
      .check-circle {
        width: 72px; height: 72px;
        border-radius: var(--radius-full);
        background: linear-gradient(135deg, var(--color-primary-dim, #ff8a50), var(--color-primary));
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto var(--space-4);
        box-shadow: 0 8px 24px rgba(255, 82, 0, 0.3);
        animation: pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .loading-circle { animation: none; background: var(--color-surface-container-low); }
      h1 { font-family: var(--font-display); font-size: 1.6rem; margin-bottom: var(--space-1); }
      .order-id { font-family: var(--font-body); color: var(--color-text-variant); font-weight: 600; font-size: 1rem; }

      /* Skeleton */
      .skeleton { background: linear-gradient(90deg, var(--color-surface-container-low) 25%, var(--color-surface-container) 50%, var(--color-surface-container-low) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; display: block; }
      @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

      /* Spinner */
      .spinner {
        width: 28px; height: 28px;
        border: 3px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        display: inline-block;
      }
      .btn-spinner {
        width: 16px; height: 16px;
        border: 2px solid rgba(255,255,255,0.4);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        display: inline-block;
        margin-right: 8px;
        vertical-align: middle;
      }
      @keyframes spin { to { transform: rotate(360deg); } }

      /* Dot pulse */
      .loading-note { text-align: center; color: var(--color-text-variant); font-size: 0.85rem; margin-top: var(--space-4); }
      .dot-pulse { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--color-primary); animation: pulse 1s infinite; margin-right: 6px; vertical-align: middle; }
      @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }

      /* Actions */
      .actions { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-5); }
      .action-card {
        display: flex; align-items: center; gap: var(--space-3);
        padding: var(--space-4) var(--space-3);
        background: var(--color-surface-lowest, #fff);
        border-radius: var(--radius-lg);
        text-align: left; text-decoration: none;
        color: var(--color-text); border: none;
        box-shadow: var(--shadow-ambient, 0 2px 8px rgba(0,0,0,0.08));
        cursor: pointer; width: 100%;
        transition: transform 0.15s, box-shadow 0.15s;
        font-family: var(--font-body);
      }
      .action-card:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.12); }
      .action-card:disabled { opacity: 0.7; cursor: not-allowed; }
      .action-icon { font-size: 1.8rem; flex-shrink: 0; }
      .action-card h3 { font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin: 0 0 2px; }
      .action-card p { font-size: 0.8rem; color: var(--color-text-variant); margin: 0; }
      .action-arrow { margin-left: auto; font-size: 1.2rem; color: var(--color-primary); font-weight: 700; flex-shrink: 0; }

      .wa-card { border-left: 4px solid #25D366; }
      .pay-card { border-left: 4px solid #3b82f6; }
      .confirm-wa-card { border-left: 4px solid var(--color-primary); }
      .sent-done-card { border-left: 4px solid #22c55e; background: rgba(34, 197, 94, 0.05); cursor: default; }
      .sent-done-card:hover { transform: none !important; }

      /* QR Card */
      .qr-card { flex-direction: column; text-align: center; justify-content: center; }
      .qr-card h3 { margin-bottom: var(--space-2); }
      .qr-img { max-width: 200px; width: 100%; border-radius: var(--radius-md); margin: var(--space-2) 0; }
      .qr-note { font-size: 0.8rem; opacity: 0.7; margin: 0 !important; }

      /* Info Banner */
      .info-banner { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-4); }
      .info-banner p { font-size: 0.9rem; color: var(--color-text); margin: 0; line-height: 1.5; }

      /* Order Summary */
      .summary-card { background: var(--color-surface-lowest, #fff); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: var(--space-5); box-shadow: var(--shadow-ambient, 0 2px 8px rgba(0,0,0,0.06)); }
      .summary-toggle { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: var(--space-4); background: none; border: none; font-family: var(--font-display); font-size: 0.95rem; font-weight: 700; color: var(--color-text); cursor: pointer; }
      .summary-chevron { font-size: 0.75rem; color: var(--color-text-variant); }
      .summary-body { padding: 0 var(--space-4) var(--space-4); }
      .summary-item { margin-bottom: var(--space-2); }
      .summary-item-row { display: flex; justify-content: space-between; font-size: 0.9rem; }
      .summary-addon { font-size: 0.78rem; color: var(--color-text-variant); padding-left: 1rem; margin-top: 2px; }
      .summary-divider { height: 1px; background: var(--color-outline-variant); margin: var(--space-2) 0; }
      .summary-row { display: flex; justify-content: space-between; font-size: 0.88rem; padding: 2px 0; color: var(--color-text-variant); }
      .summary-row.discount { color: #22c55e; }
      .total-row { font-family: var(--font-display); font-weight: 700; color: var(--color-text); font-size: 1rem; margin-top: var(--space-1); }
      .total-adjusted { font-size: 0.75rem; color: var(--color-primary); margin: var(--space-1) 0 0; text-align: right; }
      .summary-meta { font-size: 0.82rem; color: var(--color-text-variant); margin: var(--space-2) 0 0; }

      /* Footer */
      .footer-note { text-align: center; margin-top: var(--space-3); }
      .footer-note p { font-size: 1rem; margin-bottom: var(--space-3); }
      .back-link { color: var(--color-primary); font-weight: 600; text-decoration: none; }
      .back-link-btn { display: inline-block; padding: 12px 24px; background: var(--color-primary); color: white; border-radius: var(--radius-lg); font-weight: 600; text-decoration: none; }

      @keyframes pop {
        0% { transform: scale(0.3); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
    `}</style>
  );
}

export default function ConfirmationPage() {
  return <ConfirmationContent />;
}
