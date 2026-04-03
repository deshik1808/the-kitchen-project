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

// ─── Order Summary ────────────────────────────────────────────────────────────
function OrderSummary({ order, serverTotal }) {
  const [open, setOpen] = useState(false);
  const currency = '₹';
  const displayTotal = serverTotal !== undefined ? serverTotal : order.total;
  return (
    <div className="sum-card">
      <button type="button" className="sum-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span>🧾 Your Order ({order.items.length} item{order.items.length > 1 ? 's' : ''})</span>
        <svg className={`sum-chev${open ? ' open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="sum-body">
          {order.items.map((item, i) => {
            const addonsTotal = (item.addons || []).reduce((s, a) => s + (a.price || 0), 0);
            return (
              <div key={i} className="sum-item">
                <div className="sum-row-item">
                  <span>{item.name} <span className="sum-qty">× {item.qty}</span></span>
                  <span>{currency}{(item.price + addonsTotal) * item.qty}</span>
                </div>
                {(item.addons || []).map((a, j) => (
                  <div key={j} className="sum-addon">+ {a.name} (+{currency}{a.price || 0})</div>
                ))}
              </div>
            );
          })}
          <div className="sum-divider" />
          <div className="sum-row"><span>Subtotal</span><span>{currency}{order.subtotal}</span></div>
          {order.discountAmount > 0 && (
            <div className="sum-row sum-discount">
              <span>Discount{order.discountCode ? ` (${order.discountCode})` : ''}</span>
              <span>−{currency}{order.discountAmount}</span>
            </div>
          )}
          {order.deliveryFee > 0 && (
            <div className="sum-row"><span>{order.deliveryType === 'delivery' ? 'Delivery Fee' : ''}</span><span>{currency}{order.deliveryFee}</span></div>
          )}
          <div className="sum-row sum-total"><span>Total</span><span>{currency}{displayTotal}</span></div>
          {serverTotal !== undefined && serverTotal !== order.total && (
            <p className="sum-adjusted">⚠️ Adjusted by store (estimate: {currency}{order.total})</p>
          )}
          {order.deliveryType === 'delivery' && order.address && <p className="sum-meta">📍 {order.address}</p>}
          {order.deliveryType === 'pickup' && <p className="sum-meta">🏃 Self-Pickup</p>}
        </div>
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
          <span className="empty-icon">🔍</span>
          <h2>No Recent Order</h2>
          <p>It looks like you haven&apos;t placed an order yet.</p>
          <Link href="/" className="browse-btn">Browse Menu →</Link>
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
                <Badge label="💬" bg="#25D366" />
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
            <div className="hero-arc" aria-hidden="true" />
            <CheckIcon />
            <h1 className="hero-title">Message Sent ✅</h1>
            <p className="hero-id">#{pendingOrder?.orderId}</p>
            <p className="hero-tag">Your WhatsApp order is on its way</p>
          </div>
          <div className="notice">ℹ️ Brief system delay — please retry below. Your WhatsApp message was sent!</div>
          <div className="steps-shell">
            <button onClick={handleRetry} disabled={retrying} className="step-row primary-row">
              <div className="step-left">
                <Badge label="🔄" bg="var(--color-primary)" />
                <div className="step-text">
                  <span className="step-title">{retrying ? 'Saving…' : 'Retry Save to Kitchen'}</span>
                  <span className="step-sub">Tap to re-send to our system</span>
                </div>
              </div>
            </button>
            {waUrl && (
              <button onClick={openWhatsApp} className="step-row wa-row">
                <div className="step-left">
                  <Badge label="💬" bg="#25D366" />
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
            <div className="hero-arc" aria-hidden="true" />
            <Confetti />
            <CheckIcon />
            <h1 className="hero-title">Order Confirmed!</h1>
            <p className="hero-id">#{orderId}</p>
            <p className="hero-tag">{storeName} will prepare your order soon 🍽️</p>
          </div>

          <div className="steps-shell">

            {/* Step 1: WhatsApp */}
            {waUrl && (
              <div className="step-group">
                <p className="group-label">Step 1 — Confirm your order</p>

                <button onClick={openWhatsApp} className="step-row wa-row">
                  <div className="step-left">
                    <Badge label="1" bg="#25D366" />
                    <div className="step-text">
                      <span className="step-title">Send Order on WhatsApp</span>
                      <span className="step-sub">{waSent === 'done' ? 'Tap again if needed' : 'Tap to open WhatsApp with your order'}</span>
                    </div>
                  </div>
                  <span className="step-arrow">→</span>
                </button>

                {waSent !== 'done' ? (
                  <button onClick={handleSentWA} disabled={waSent === 'sending'} className="step-row confirm-row">
                    <div className="step-left">
                      <Badge label="✓" bg="var(--color-primary)" />
                      <div className="step-text">
                        <span className="step-title">
                          {waSent === 'sending' && <span className="inline-spin" />}
                          {waSent === 'sending' ? 'Confirming…' : "I've Sent the Message"}
                        </span>
                        <span className="step-sub">Tap after sending on WhatsApp</span>
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="step-row done-row">
                    <div className="step-left">
                      <Badge label="🎉" bg="#22c55e" />
                      <div className="step-text">
                        <span className="step-title">Kitchen Notified!</span>
                        <span className="step-sub">Your order is being prepared</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Payment */}
            {hasPayment && (
              <div className="step-group">
                <p className="group-label">Step 2 — Complete payment</p>

                {upiQrUrl && (
                  <div className="step-row qr-row">
                    <div className="qr-top">
                      <Badge label="₹" bg="#3b82f6" />
                      <div className="step-text">
                        <span className="step-title">Pay via UPI</span>
                        <span className="step-sub">Scan with Google Pay, PhonePe, or any UPI app</span>
                      </div>
                    </div>
                    <div className="qr-img-wrap">
                      <img src={upiQrUrl} alt="UPI QR Code" className="qr-img" />
                    </div>
                  </div>
                )}

                {razorpayLink && (
                  <a href={razorpayLink} target="_blank" rel="noreferrer" className="step-row pay-row">
                    <div className="step-left">
                      <Badge label="💳" bg="#3b82f6" />
                      <div className="step-text">
                        <span className="step-title">Pay Online</span>
                        <span className="step-sub">Pay ₹{serverTotal || pendingOrder?.total || ''} via Razorpay</span>
                      </div>
                    </div>
                    <span className="step-arrow">→</span>
                  </a>
                )}
              </div>
            )}

            {/* Order Summary */}
            {pendingOrder && <OrderSummary order={pendingOrder} serverTotal={serverTotal} />}
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

        /* Hero */
        .hero-shell {
          position: relative;
          text-align: center;
          padding: 3.5rem 1.5rem 3.5rem;
          overflow: hidden;
          background: linear-gradient(160deg, var(--color-primary-dim) 0%, var(--color-primary) 55%, var(--color-primary-container) 100%);
          border-radius: 0 0 2.5rem 2.5rem;
          color: white;
          margin-bottom: 0;
        }
        .hero-arc {
          position: absolute;
          bottom: -60px; left: 50%;
          transform: translateX(-50%);
          width: 140%; height: 120px;
          background: var(--color-bg);
          border-radius: 50% 50% 0 0;
          z-index: 1;
        }
        .hero-shell > *:not(.hero-arc):not(.cfg-wrap) { position: relative; z-index: 2; }
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

        /* Steps */
        .steps-shell { padding: 1.75rem 1.25rem 0; display: flex; flex-direction: column; gap: 0.75rem; }
        .step-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .group-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-outline); padding-left: 0.25rem; margin-bottom: 0.1rem; }

        /* Step Row */
        .step-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 0.9rem; padding: 1rem 1.1rem;
          background: var(--color-surface-lowest, #fff);
          border-radius: 1rem; border: none;
          cursor: pointer; width: 100%; text-align: left;
          text-decoration: none; color: var(--color-text);
          font-family: var(--font-body);
          box-shadow: 0 2px 12px rgba(42,46,65,0.07);
          transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
        }
        .step-row:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(42,46,65,0.13); }
        .step-row:active:not(:disabled) { transform: scale(0.98); }
        .step-row:disabled { opacity: 0.7; cursor: not-allowed; }
        .step-left { display: flex; align-items: center; gap: 0.85rem; flex: 1; min-width: 0; }
        .step-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .step-title { font-family: var(--font-display); font-weight: 700; font-size: 0.93rem; color: var(--color-text); display: flex; align-items: center; gap: 5px; }
        .step-sub { font-size: 0.77rem; color: var(--color-text-variant); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .step-arrow { font-size: 1.1rem; color: var(--color-primary); font-weight: 800; flex-shrink: 0; margin-left: auto; }

        /* Row variants */
        .wa-row      { border-left: 3px solid #25D366; }
        .confirm-row { border-left: 3px solid var(--color-primary); }
        .done-row    { border-left: 3px solid #22c55e; background: rgba(34,197,94,0.05); cursor: default; }
        .done-row:hover { transform: none !important; }
        .pay-row     { border-left: 3px solid #3b82f6; }
        .primary-row { border-left: 3px solid var(--color-primary); }
        .qr-row      { flex-direction: column; align-items: stretch; cursor: default; border-left: 3px solid #3b82f6; }
        .qr-row:hover { transform: none !important; }

        /* QR */
        .qr-top { display: flex; align-items: center; gap: 0.85rem; }
        .qr-img-wrap { background: white; border-radius: 0.75rem; border: 1px solid var(--color-surface-container); padding: 0.75rem; display: flex; justify-content: center; }
        .qr-img { max-width: 190px; width: 100%; display: block; border-radius: 4px; }

        /* Badge */
        .badge { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px; font-size: 1rem; font-weight: 800; color: white; font-family: var(--font-display); }

        /* Skeleton */
        .sk { background: linear-gradient(90deg, var(--color-surface-container-low) 25%, var(--color-surface-container) 50%, var(--color-surface-container-low) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; display: block; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* Notice banner */
        .notice { display: flex; align-items: flex-start; gap: 0.5rem; margin: 1.5rem 1.25rem 0.5rem; padding: 0.85rem 1rem; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.25); border-radius: 0.75rem; font-size: 0.83rem; color: var(--color-text); line-height: 1.5; }

        /* Order Summary */
        .sum-card { background: var(--color-surface-lowest,#fff); border-radius: 1rem; overflow: hidden; box-shadow: 0 2px 12px rgba(42,46,65,0.06); }
        .sum-toggle { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 1rem 1.1rem; background: none; border: none; font-family: var(--font-display); font-size: 0.9rem; font-weight: 700; color: var(--color-text); cursor: pointer; transition: background 0.15s; }
        .sum-toggle:hover { background: var(--color-surface-container-low); }
        .sum-chev { transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1); color: var(--color-text-variant); }
        .sum-chev.open { transform: rotate(180deg); }
        .sum-body { padding: 0 1.1rem 1rem; }
        .sum-item { margin-bottom: 0.6rem; }
        .sum-row-item { display: flex; justify-content: space-between; font-size: 0.87rem; }
        .sum-qty { color: var(--color-text-variant); font-weight: 400; }
        .sum-addon { font-size: 0.75rem; color: var(--color-text-variant); padding-left: 0.75rem; margin-top: 2px; }
        .sum-divider { height: 1px; background: var(--color-surface-container); margin: 0.6rem 0; }
        .sum-row { display: flex; justify-content: space-between; font-size: 0.84rem; color: var(--color-text-variant); padding: 2px 0; }
        .sum-discount { color: #22c55e; font-weight: 600; }
        .sum-total { font-family: var(--font-display); font-weight: 800; font-size: 1rem; color: var(--color-text); margin-top: 0.25rem; }
        .sum-adjusted { font-size: 0.74rem; color: var(--color-primary); margin-top: 0.35rem; text-align: right; }
        .sum-meta { font-size: 0.8rem; color: var(--color-text-variant); margin-top: 0.5rem; }

        /* Footer */
        .footer { text-align: center; padding: 2rem 1.5rem 1rem; }
        .footer-thanks { font-size: 0.92rem; color: var(--color-text-variant); margin-bottom: 0.75rem; }
        .footer-thanks strong { color: var(--color-text); font-weight: 700; }
        .back-link { display: inline-flex; align-items: center; gap: 0.2rem; color: var(--color-primary); font-weight: 700; font-size: 0.9rem; text-decoration: none; transition: gap 0.2s; }
        .back-link:hover { gap: 0.4rem; }

        /* Empty State */
        .empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 5rem 2rem 3rem; gap: 0.75rem; }
        .empty-icon { font-size: 3.5rem; }
        .empty-state h2 { font-family: var(--font-display); font-size: 1.4rem; color: var(--color-text); margin: 0; }
        .empty-state p { font-size: 0.9rem; color: var(--color-text-variant); max-width: 260px; line-height: 1.55; margin: 0; }
        .browse-btn { display: inline-block; margin-top: 0.5rem; padding: 0.75rem 1.75rem; background: var(--color-primary); color: white; border-radius: 9999px; font-weight: 700; font-size: 0.95rem; text-decoration: none; box-shadow: 0 4px 18px rgba(0,0,0,0.15); transition: transform 0.18s, box-shadow 0.18s; }
        .browse-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 26px rgba(0,0,0,0.2); }

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
