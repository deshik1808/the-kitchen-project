"use client";

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../../lib/StoreContext';
import { placeOrder, confirmWhatsapp } from '../../lib/api';
import Link from 'next/link';

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti() {
  const items = Array.from({ length: 16 }, (_, i) => i);
  const colors = ['#FF5200', '#FF8A50', '#FFD166', '#22c55e', '#3b82f6', '#f97316'];
  return (
    <div className="cfg-wrap" aria-hidden="true">
      {items.map(i => (
        <span
          key={i}
          className="cfg-dot"
          style={{
            left: `${(i / 16) * 100}%`,
            background: colors[i % colors.length],
            width: `${6 + (i % 3) * 3}px`,
            height: `${6 + (i % 3) * 3}px`,
            animationDelay: `${(i * 0.07).toFixed(2)}s`,
            animationDuration: `${0.8 + (i % 4) * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Animated Check ───────────────────────────────────────────────────────────
function CheckIcon({ loading = false }) {
  if (loading) {
    return (
      <div className="icon-ring">
        <span className="spinner-ring" />
      </div>
    );
  }
  return (
    <div className="icon-ring success-ring">
      <svg viewBox="0 0 52 52" fill="none" width="52" height="52">
        <circle cx="26" cy="26" r="25" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.5" />
        <polyline className="tick-line" points="14,27 22,35 38,18" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Sk({ w = '100%', h = '1.2rem', r = '8px', style = {} }) {
  return <div className="sk" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

// ─── Step Badge ───────────────────────────────────────────────────────────────
function Badge({ label, bg = 'var(--color-primary)' }) {
  return <span className="badge" style={{ background: bg }}>{label}</span>;
}

// ─── Order Bill (e-receipt style) ─────────────────────────────────────────────
function OrderSummary({ order, serverTotal, orderId }) {
  const currency = '₹';
  const displayTotal = serverTotal !== undefined ? serverTotal : order.total;
  return (
    <div className="bill-card">
      <style jsx>{`
        .bill-card {
          background: #ffffff;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 2px 16px rgba(0,0,0,0.08);
          border: 1px solid #e5e7eb;
          font-family: 'Courier New', Courier, monospace;
        }
        .bill-header {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.9rem 1.15rem 0.75rem;
          border-bottom: 1.5px dashed #d1d5db;
        }
        .bill-icon { font-size: 1.1rem; }
        .bill-title { font-weight: 700; font-size: 0.92rem; color: #111; flex: 1; font-family: inherit; }
        .bill-count {
          font-size: 0.7rem; font-weight: 700; padding: 2px 9px;
          border-radius: 99px; font-family: inherit;
          background: rgba(128,0,128,0.1); color: var(--color-primary, #7c3aed);
        }
        .bill-dashes {
          height: 0; overflow: visible;
          border: none; border-top: 1.5px dashed #d1d5db;
          margin: 0 1.15rem; display: block;
        }
        .bill-dashes-full { margin: 0; }
        .bill-items {
          padding: 0.75rem 1.15rem 0.65rem;
          display: flex; flex-direction: column; gap: 0.6rem;
        }
        .bill-item { display: flex; flex-direction: column; gap: 2px; }
        .bill-item-row {
          display: flex; justify-content: space-between;
          align-items: baseline; font-size: 0.85rem;
        }
        .bill-item-name { color: #111; flex: 1; padding-right: 0.5rem; }
        .bill-item-qty { color: var(--color-primary, #7c3aed); font-weight: 700; }
        .bill-item-price { font-weight: 700; color: #111; white-space: nowrap; }
        .bill-addon {
          font-size: 0.72rem; color: #6b7280; padding-left: 1.2rem;
          display: flex; justify-content: space-between;
        }
        .bill-summary {
          padding: 0.55rem 1.15rem 0.45rem;
          display: flex; flex-direction: column; gap: 0.28rem;
        }
        .bill-row {
          display: flex; justify-content: space-between;
          font-size: 0.8rem; color: #6b7280;
        }
        .bill-discount { color: #16a34a; font-weight: 600; }
        .bill-total-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.75rem 1.15rem;
          background: rgba(128,0,128,0.05);
          border-top: 1.5px dashed #d1d5db;
        }
        .bill-total-label { font-weight: 800; font-size: 0.88rem; color: #111; font-family: inherit; }
        .bill-total-val {
          font-weight: 900; font-size: 1.15rem;
          color: var(--color-primary, #7c3aed); font-family: inherit;
        }
        .bill-adjusted { font-size: 0.72rem; color: #9333ea; text-align: right; padding: 0 1.15rem; }
        .bill-meta {
          display: flex; gap: 0.4rem; font-size: 0.78rem;
          color: #6b7280; padding: 0.35rem 1.15rem 0;
        }
        .bill-meta-last { padding-bottom: 0.85rem; }
        .bill-order-id {
          font-size: 0.7rem;
          color: #9ca3af;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 0.3rem 1.15rem 0.55rem;
        }
      `}</style>
      <div className="bill-header">
        <span className="bill-icon">🧾</span>
        <span className="bill-title">Your Order</span>
        <span className="bill-count">{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
      </div>
      {orderId && (
        <div className="bill-order-id">Order #{orderId}</div>
      )}

      <div className="bill-dashes bill-dashes-full" aria-hidden="true" />

      <div className="bill-items">
        {order.items.map((item, i) => {
          const addonsTotal = (item.addons || []).reduce((s, a) => s + (a.price || 0), 0);
          return (
            <div key={i} className="bill-item">
              <div className="bill-item-row">
                <span className="bill-item-name">
                  <span className="bill-item-qty">{item.qty}×</span> {item.name}
                </span>
                <span className="bill-item-price">{currency}{(item.price + addonsTotal) * item.qty}</span>
              </div>
              {(item.addons || []).map((a, j) => (
                <div key={j} className="bill-addon">↳ {a.name} <span>+{currency}{a.price || 0}</span></div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="bill-dashes" aria-hidden="true" />

      <div className="bill-summary">
        <div className="bill-row"><span>Subtotal</span><span>{currency}{order.subtotal}</span></div>
        {order.discountAmount > 0 && (
          <div className="bill-row bill-discount">
            <span>Discount {order.discountCode ? `(${order.discountCode})` : ''}</span>
            <span>− {currency}{order.discountAmount}</span>
          </div>
        )}
        {order.deliveryFee > 0 && (
          <div className="bill-row"><span>Delivery Fee</span><span>{currency}{order.deliveryFee}</span></div>
        )}
      </div>

      <div className="bill-total-row">
        <span className="bill-total-label">Total Payable</span>
        <span className="bill-total-val">{currency}{displayTotal}</span>
      </div>

      {serverTotal !== undefined && serverTotal !== order.total && (
        <p className="bill-adjusted">⚠️ Adjusted by store (estimate: {currency}{order.total})</p>
      )}

      {order.deliveryType === 'delivery' && order.address && (
        <div className="bill-meta bill-meta-last"><span>📍</span><span>{order.address}</span></div>
      )}
      {order.deliveryType === 'pickup' && (
        <div className="bill-meta bill-meta-last"><span>🏃</span><span>Self-Pickup</span></div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ConfirmationPage() {
  const { storeData } = useStore();
  const [phase, setPhase] = useState('loading'); // loading | success | failed | empty
  const [pendingOrder, setPendingOrder] = useState(null);
  const [waUrl, setWaUrl] = useState('');
  const [orderResult, setOrderResult] = useState(null);
  const [waSent, setWaSent] = useState('idle'); // idle | sending | done
  const [retrying, setRetrying] = useState(false);

  const upiQrUrl = orderResult?.upiQrUrl || storeData?.store?.upiQrUrl || '';
  const razorpayLink = orderResult?.razorpayLink || '';
  const orderId = orderResult?.orderId || pendingOrder?.orderId || '';
  const serverTotal = orderResult?.total;
  const storeName = storeData?.store?.name || 'our kitchen';

  // Run ONCE on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    let cancelled = false;
    const VER = 'v1';

    async function init() {
      try {
        let stored, wa, result, submitted;
        try {
          stored    = sessionStorage.getItem(`pendingOrderData:${VER}`);
          wa        = sessionStorage.getItem(`pendingWaUrl:${VER}`);
          result    = sessionStorage.getItem(`orderResult:${VER}`);
          submitted = sessionStorage.getItem(`orderSubmitted:${VER}`) === 'true';
        } catch (_) {}

        if (wa) setWaUrl(wa);

        // Already done — result was saved by checkout page background call
        if (submitted && result) {
          if (!cancelled) {
            setPendingOrder(stored ? JSON.parse(stored) : null);
            setOrderResult(JSON.parse(result));
            setPhase('success');
          }
          return;
        }

        // No pending data
        if (!stored) {
          if (!cancelled) setPhase('empty');
          return;
        }

        const pending = JSON.parse(stored);
        if (!cancelled) setPendingOrder(pending);

        // Poll sessionStorage for the background order to finish
        let attempts = 0;
        let fallbackFired = false;
        const timer = setInterval(() => {
          if (cancelled) { clearInterval(timer); return; }

          let res = null;
          try { res = sessionStorage.getItem(`orderResult:${VER}`); } catch (_) {}

          if (res) {
            clearInterval(timer);
            if (!cancelled) {
              setOrderResult(JSON.parse(res));
              setPhase('success');
            }
            return;
          }

          attempts++;

          // After 2 s of wait, fire as fallback
          if (attempts === 4 && !fallbackFired) {
            fallbackFired = true;
            try {
              if (!sessionStorage.getItem(`orderSubmitted:${VER}`)) {
                placeOrder(pending).then(r => {
                  if (!cancelled && r?.success) {
                    try {
                      sessionStorage.setItem(`orderResult:${VER}`, JSON.stringify(r));
                      sessionStorage.setItem(`orderSubmitted:${VER}`, 'true');
                    } catch (_) {}
                    setOrderResult(r);
                    setPhase('success');
                  }
                }).catch(console.error);
              }
            } catch (_) { console.error(_); }
          }

          if (attempts >= 30) {
            clearInterval(timer);
            if (!cancelled) setPhase('failed');
          }
        }, 500);

      } catch (err) {
        console.error('Confirmation init error:', err);
        if (!cancelled) setPhase('failed');
      }
    }

    init();
    return () => { cancelled = true; };
  }, []); // ← empty deps: run once on mount only

  const openWhatsApp = () => { if (waUrl) window.open(waUrl, '_blank'); };

  const handleSentWA = useCallback(async () => {
    if (waSent !== 'idle' || !orderId) return;
    setWaSent('sending');
    try { await confirmWhatsapp(orderId); } catch (_) {}
    setWaSent('done');
  }, [orderId, waSent]);

  const handleRetry = useCallback(async () => {
    if (retrying || !pendingOrder) return;
    setRetrying(true);
    try {
      const r = await placeOrder(pendingOrder);
      if (r?.success) {
        setOrderResult(r);
        setPhase('success');
      }
    } catch (_) {}
    setRetrying(false);
  }, [pendingOrder, retrying]);

  // ── Determine what to render ──────────────────────────────────────────────
  const isLoading  = phase === 'loading';
  const isSuccess  = phase === 'success';
  const isFailed   = phase === 'failed';
  const isEmpty    = phase === 'empty';
  const hasPayment = isSuccess && (upiQrUrl || razorpayLink);

  return (
    <div className="cp">

      {/* ── EMPTY ───────────────────────────────────────────────── */}
      {isEmpty && (
        <div className="empty-state">
          <div className="empty-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide-binoculars">
              <path d="M10 10h4"/><path d="M19 7V4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v3"/><path d="M20 21a2 2 0 0 0 2-2v-3.851c0-1.39-2-2.962-2-4.829V8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2z"/><path d="M 22 16 L 2 16"/><path d="M4 21a2 2 0 0 1-2-2v-3.851c0-1.39 2-2.962 2-4.829V8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2z"/><path d="M9 7V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v3"/>
            </svg>
          </div>
          <h2 className="empty-title">No Recent Order</h2>
          <Link href="/" className="order-now-btn">Order Now</Link>
        </div>
      )}

      {/* ── LOADING (no data yet) ────────────────────────────────── */}
      {isLoading && !pendingOrder && (
        <div className="load-shell">
          <CheckIcon loading />
          <div className="load-title-sk"><Sk w="200px" h="2rem" /></div>
          <Sk w="130px" h="1rem" style={{ margin: '0 auto' }} />
          <div className="steps-sk">
            <Sk h="72px" r="14px" />
            <Sk h="72px" r="14px" />
          </div>
        </div>
      )}

      {/* ── LOADING (has order ID) ────────────────────────────────── */}
      {isLoading && pendingOrder && (
        <div className="load-shell">
          <CheckIcon loading />
          <h2 className="load-h2">Placing Your Order…</h2>
          <p className="load-sub">#{pendingOrder.orderId}</p>
          <p className="load-hint">Hang tight, sending it to the kitchen</p>
          {waUrl && (
            <button onClick={openWhatsApp} className="step-row wa-row">
              <div className="step-left">
                <Badge label="WA" bg="#25D366" />
                <div className="step-text">
                  <span className="step-title">WhatsApp not opened?</span>
                  <span className="step-sub">Tap to re-send your order</span>
                </div>
              </div>
              <span className="step-arrow">→</span>
            </button>
          )}
          <div className="ticker"><span className="tick-dot" />Saving to kitchen system…</div>
        </div>
      )}

      {/* ── FAILED ───────────────────────────────────────────────── */}
      {isFailed && (
        <>
          <div className="hero-shell">
            <CheckIcon />
            <h1 className="hero-title">Message Sent ✅</h1>
            <p className="hero-id">#{pendingOrder?.orderId}</p>
            <p className="hero-tag">Your WhatsApp order is on its way</p>
          </div>
          <div className="notice">ℹ️ Brief system delay — please retry below. Your WhatsApp message was sent!</div>
          <div className="steps-shell">
            <button onClick={handleRetry} disabled={retrying} className="step-row primary-row">
              <div className="step-left">
                <Badge label="↺" bg="var(--color-primary)" />
                <div className="step-text">
                  <span className="step-title">{retrying ? 'Saving…' : 'Retry Save to Kitchen'}</span>
                  <span className="step-sub">Tap to re-send to our system</span>
                </div>
              </div>
            </button>
            {waUrl && (
              <button onClick={openWhatsApp} className="step-row wa-row">
                <div className="step-left">
                  <Badge label="WA" bg="#25D366" />
                  <div className="step-text">
                    <span className="step-title">Re-send on WhatsApp</span>
                    <span className="step-sub">Opens WhatsApp with your order</span>
                  </div>
                </div>
                <span className="step-arrow">→</span>
              </button>
            )}
          </div>
          <div className="footer"><Link href="/" className="back-link">← Back to Menu</Link></div>
        </>
      )}

      {/* ── SUCCESS ──────────────────────────────────────────────── */}
      {isSuccess && (
        <>
          <div className="hero-shell">
            <Confetti />
            <CheckIcon />
            <h1 className="hero-title">Order Confirmed!</h1>
            <p className="hero-id">#{orderId}</p>
            <p className="hero-tag">{storeName} will prepare your order soon 🍽️</p>
          </div>

          <div className="steps-shell">

            {/* Timeline Steps */}
            {waUrl && (
              <div className="timeline">
                <div className="tl-label">STEP 1 — CONFIRM YOUR ORDER</div>

                {/* WA action */}
                <div className="tl-item">
                  <div className="tl-node tl-node-wa">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </div>
                  <div className="tl-connector" />
                  <div className="tl-content">
                    <button onClick={openWhatsApp} className="tl-action-btn tl-wa-btn">
                      <div>
                        <span className="tl-action-title">Send Order on WhatsApp</span>
                        <span className="tl-action-sub">{waSent === 'done' ? 'Tap again if needed' : 'Tap to open WhatsApp'}</span>
                      </div>
                      <span className="tl-arrow">↗</span>
                    </button>
                  </div>
                </div>

                {/* Confirm sent */}
                <div className="tl-item">
                  <div className={`tl-node ${waSent === 'done' ? 'tl-node-done' : 'tl-node-idle'}`}>
                    {waSent === 'done' ? '✓' : '2'}
                  </div>
                  <div className="tl-content">
                    {waSent !== 'done' ? (
                      <button onClick={handleSentWA} disabled={waSent === 'sending'} className="tl-action-btn tl-confirm-btn">
                        <div>
                          <span className="tl-action-title">
                            {waSent === 'sending' && <span className="inline-spin" />}
                            {waSent === 'sending' ? 'Confirming…' : "I've Sent the Message"}
                          </span>
                          <span className="tl-action-sub">Tap after sending on WhatsApp</span>
                        </div>
                      </button>
                    ) : (
                      <div className="tl-done-chip">
                        <span className="tl-done-title">Kitchen Notified!</span>
                        <span className="tl-done-sub">Your order is being prepared 👨‍🍳</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {hasPayment && (
              <div className="timeline">
                <div className="tl-label">STEP 2 — COMPLETE PAYMENT</div>

                {upiQrUrl && (
                  <div className="tl-item">
                    <div className="tl-node tl-node-pay">₹</div>
                    <div className="tl-content">
                      <div className="tl-qr-card">
                        <span className="tl-action-title">Pay via UPI</span>
                        <span className="tl-action-sub">Scan with Google Pay, PhonePe, or any UPI app</span>
                        <div className="qr-img-wrap">
                          <img src={upiQrUrl} alt="UPI QR Code" className="qr-img" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {razorpayLink && (
                  <div className="tl-item">
                    <div className="tl-node tl-node-pay">💳</div>
                    <div className="tl-content">
                      <a href={razorpayLink} target="_blank" rel="noreferrer" className="tl-action-btn tl-pay-btn">
                        <div>
                          <span className="tl-action-title">Pay Online</span>
                          <span className="tl-action-sub">Pay ₹{serverTotal || pendingOrder?.total || ''} via Razorpay</span>
                        </div>
                        <span className="tl-arrow">↗</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Order Bill */}
            {pendingOrder && <OrderSummary order={pendingOrder} serverTotal={serverTotal} orderId={orderId} />}
          </div>

          <div className="footer">
            <p className="footer-thanks">Thank you for choosing <strong>{storeName}</strong>!</p>
            <Link href="/" className="back-link">← Back to Menu</Link>
          </div>
        </>
      )}

      {/* ── STYLES (inline = correct jsx scope) ─────────────────── */}
      <style jsx>{`
        /* Page */
        .cp { max-width: 480px; margin: 0 auto; padding-bottom: 3rem; min-height: 60vh; }

        /* Hero — extends 20px upward to fill behind header's rounded bottom corners */
        .hero-shell {
          position: relative;
          text-align: center;
          /* margin-top pulls hero up behind header rounded corners; padding-top compensates */
          margin-top: -20px;
          padding: calc(2rem + 20px) 1.5rem 3rem;
          overflow: hidden;
          background: var(--color-primary);
          border-radius: 0 0 2.25rem 2.25rem;
          color: white;
          margin-bottom: 1.5rem;
        }
        .hero-shell > *:not(.cfg-wrap) { position: relative; z-index: 2; }
        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(1.7rem, 7vw, 2.2rem);
          font-weight: 800;
          color: white;
          margin: 1rem 0 0.3rem;
        }
        .hero-id { font-size: 0.92rem; color: rgba(255,255,255,0.85); font-weight: 600; letter-spacing: 0.04em; }
        .hero-tag { font-size: 0.88rem; color: rgba(255,255,255,0.8); margin-top: 0.3rem; }

        /* Check Icon */
        .icon-ring {
          width: 80px; height: 80px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto;
          background: rgba(255,255,255,0.18);
          animation: pop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both;
        }
        .success-ring { background: rgba(255,255,255,0.2); }
        .tick-line {
          stroke-dasharray: 42;
          stroke-dashoffset: 42;
          animation: draw-tick 0.45s 0.35s cubic-bezier(0.65,0,0.35,1) forwards;
        }
        @keyframes draw-tick { to { stroke-dashoffset: 0; } }
        @keyframes pop { from { transform: scale(0.2); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        /* Loading shell */
        .load-shell {
          padding: 3rem 1.5rem 1rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }
        .load-h2 { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--color-text); margin: 0; }
        .load-sub { font-size: 0.9rem; color: var(--color-text-variant); font-weight: 600; margin: 0; }
        .load-hint { font-size: 0.82rem; color: var(--color-text-variant); margin: 0; }
        .load-title-sk { margin: 1.25rem 0 0; }
        .steps-sk { width: 100%; display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem; }

        /* Loading icon variant */
        .load-shell .icon-ring {
          background: var(--color-surface-container);
          animation: none;
        }

        /* Spinner */
        .spinner-ring {
          display: block;
          width: 34px; height: 34px;
          border: 3.5px solid var(--color-surface-container-high);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }
        .inline-spin {
          display: inline-block;
          width: 13px; height: 13px;
          border: 2px solid rgba(0,0,0,0.15);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 5px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Ticker */
        .ticker {
          display: flex; align-items: center; gap: 0.5rem;
          color: var(--color-text-variant);
          font-size: 0.82rem;
          margin-top: 0.5rem;
        }
        .tick-dot {
          display: block; width: 8px; height: 8px;
          border-radius: 50%; background: var(--color-primary);
          flex-shrink: 0;
          animation: pulse 1.1s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.65)} }

        /* Confetti */
        .cfg-wrap { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
        .cfg-dot { position: absolute; top: -10px; border-radius: 2px; animation: fall linear both; }
        @keyframes fall { from{transform:translateY(-10px) rotate(0deg);opacity:1} to{transform:translateY(180px) rotate(720deg);opacity:0} }

        /* Steps shell */
        .steps-shell { padding: 0 1.25rem; display: flex; flex-direction: column; gap: 1.25rem; }

        /* Timeline */
        .timeline { display: flex; flex-direction: column; gap: 0; }
        .tl-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-outline-variant); margin-bottom: 0.85rem; padding-left: 0.25rem; }
        .tl-item { display: flex; align-items: flex-start; gap: 0.85rem; position: relative; margin-bottom: 0.75rem; }
        .tl-item:last-child { margin-bottom: 0; }

        /* Timeline node dot */
        .tl-node {
          flex-shrink: 0;
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.85rem; font-weight: 800; color: white;
          position: relative; z-index: 1;
          margin-top: 0.15rem;
        }
        .tl-node-wa { background: #25D366; }
        .tl-node-idle { background: var(--color-surface-container-high); color: var(--color-text-variant); font-size: 0.8rem; }
        .tl-node-done { background: #22c55e; }
        .tl-node-pay { background: var(--color-primary); font-size: 0.9rem; }

        /* Vertical connector line */
        .tl-connector {
          display: none; /* connector via item margin instead */
        }

        /* Timeline content */
        .tl-content { flex: 1; min-width: 0; }

        /* Action buttons in timeline */
        .tl-action-btn {
          display: flex; align-items: center; justify-content: space-between;
          gap: 0.75rem; padding: 0.85rem 1rem;
          width: 100%; text-align: left; text-decoration: none;
          border-radius: 0.875rem;
          border: 1.5px solid var(--color-surface-container-low);
          background: var(--color-surface-lowest, #fff);
          cursor: pointer; font-family: var(--font-body);
          color: var(--color-text);
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
          transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
        }
        .tl-action-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.11); }
        .tl-action-btn:active:not(:disabled) { transform: scale(0.98); }
        .tl-action-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .tl-action-btn > div { display: flex; flex-direction: column; gap: 2px; }
        .tl-action-title { font-family: var(--font-display); font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 5px; }
        .tl-action-sub { font-size: 0.75rem; color: var(--color-text-variant); }
        .tl-arrow { font-size: 1rem; color: var(--color-primary); font-weight: 800; flex-shrink: 0; }

        /* Specific button variants */
        .tl-wa-btn { border-color: rgba(37,211,102,0.3); background: rgba(37,211,102,0.04); }
        .tl-confirm-btn { border-color: color-mix(in srgb, var(--color-primary) 30%, transparent); }
        .tl-pay-btn { border-color: color-mix(in srgb, var(--color-primary) 30%, transparent); }

        /* Done chip */
        .tl-done-chip {
          display: flex; flex-direction: column; gap: 2px;
          padding: 0.85rem 1rem;
          background: rgba(34,197,94,0.06);
          border: 1.5px solid rgba(34,197,94,0.25);
          border-radius: 0.875rem;
        }
        .tl-done-title { font-family: var(--font-display); font-weight: 700; font-size: 0.9rem; color: #16a34a; }
        .tl-done-sub { font-size: 0.75rem; color: #4ade80; color: #22c55e; }

        /* QR card in timeline */
        .tl-qr-card {
          display: flex; flex-direction: column; gap: 0.4rem;
          padding: 0.85rem 1rem;
          background: var(--color-surface-lowest, #fff);
          border: 1.5px solid var(--color-surface-container-low);
          border-radius: 0.875rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        }
        .qr-img-wrap { background: white; border-radius: 0.75rem; border: 1px solid var(--color-surface-container); padding: 0.75rem; display: flex; justify-content: center; margin-top: 0.35rem; }
        .qr-img { max-width: 190px; width: 100%; display: block; border-radius: 4px; }

        /* Skeleton */
        .sk { background: linear-gradient(90deg, var(--color-surface-container-low) 25%, var(--color-surface-container) 50%, var(--color-surface-container-low) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; display: block; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* Notice banner */
        .notice { display: flex; align-items: flex-start; gap: 0.5rem; margin: 1.5rem 1.25rem 0.5rem; padding: 0.85rem 1rem; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.25); border-radius: 0.75rem; font-size: 0.83rem; color: var(--color-text); line-height: 1.5; }

        /* bill-* styles are scoped inside OrderSummary component */

        /* Footer */
        .footer { text-align: center; padding: 2rem 1.5rem 1rem; }
        .footer-thanks { font-size: 0.92rem; color: var(--color-text-variant); margin-bottom: 0.75rem; }
        .footer-thanks strong { color: var(--color-text); font-weight: 700; }
        .back-link { display: inline-flex; align-items: center; gap: 0.2rem; color: var(--color-primary); font-weight: 700; font-size: 0.9rem; text-decoration: none; transition: gap 0.2s; }
        .back-link:hover { gap: 0.4rem; }

        /* Empty State */
        .empty-state { 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          text-align: center; 
          padding: 80px 24px; 
          min-height: 50vh;
        }
        .empty-icon-wrapper { 
          width: 140px;
          height: 140px;
          background: color-mix(in srgb, var(--color-primary) 8%, transparent);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          position: relative;
        }
        .empty-icon-wrapper::before,
        .empty-icon-wrapper::after {
          content: '+';
          position: absolute;
          color: var(--color-outline-variant);
          font-size: 1.2rem;
          line-height: 1;
        }
        .empty-icon-wrapper::before { top: 25%; left: 18%; }
        .empty-icon-wrapper::after { bottom: 30%; right: 18%; }
        .empty-title { 
          font-family: var(--font-display); 
          font-size: 1.15rem;
          font-weight: 400;
          color: var(--color-text); 
          margin-bottom: 24px; 
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
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        :global(.order-now-btn:active) {
          transform: scale(0.96);
          opacity: 0.9;
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .icon-ring, .tick-line, .cfg-dot, .spinner-ring, .tick-dot, .sk { animation: none; }
          .tick-line { stroke-dashoffset: 0; }
          .icon-ring { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
