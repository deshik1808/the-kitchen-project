"use client";

import { useState } from 'react';

export default function CouponList({ discounts = [] }) {
  const [copiedCode, setCopiedCode] = useState(null);

  const visible = (discounts || []).filter(d =>
    (d.Active === 'Y' || d.active === 'Y') &&
    (d['Show in Frontend'] === 'Y' || d.showInFrontend === 'Y')
  );

  if (visible.length === 0) return null;

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="coupon-section">
      <div className="coupon-header">
        <span className="coupon-star">✦</span>
        <h3 className="coupon-title">Available Coupons</h3>
      </div>

      <div className="coupon-list">
        {visible.map((d, i) => (
          <div key={d.Code || i} className="coupon-card">
            <div className="hole hole-left" />
            <div className="hole hole-right" />

            <div className="coupon-value">
              <span className="value-amount">
                {d.Type === 'percent' ? `${d.Value}%` : `₹${d.Value}`}
              </span>
              <span className="value-off">OFF</span>
              {d['Min Order'] && (
                <span className="min-order">Min. ₹{d['Min Order']}</span>
              )}
            </div>

            <div className="coupon-divider" />

            <button className="coupon-code-btn" onClick={() => handleCopy(d.Code)}>
              <span className="code-text">{d.Code}</span>
              <span className="copy-label">
                {copiedCode === d.Code ? '✓ Copied' : 'Tap to Copy'}
              </span>
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .coupon-section {
          padding: 0 var(--space-6) var(--space-4);
        }
        .coupon-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-3);
        }
        .coupon-star {
          color: var(--color-warning);
          font-size: 1rem;
        }
        .coupon-title {
          font-family: var(--font-display);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--color-text-variant);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .coupon-list {
          display: flex;
          gap: var(--space-3);
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: var(--space-2);
        }
        .coupon-list::-webkit-scrollbar { display: none; }
        .coupon-card {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          background: var(--color-surface-lowest);
          border: 1.5px dashed var(--color-primary-container);
          border-radius: var(--radius-lg);
          padding: var(--space-3) var(--space-4);
          gap: var(--space-3);
          position: relative;
          min-width: 220px;
        }
        .hole {
          position: absolute;
          width: 16px;
          height: 16px;
          background: var(--color-bg);
          border-radius: var(--radius-full);
          top: 50%;
          transform: translateY(-50%);
        }
        .hole-left { left: -8px; }
        .hole-right { right: -8px; }
        .coupon-value {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-width: 64px;
        }
        .value-amount {
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--color-primary);
          line-height: 1;
        }
        .value-off {
          font-family: var(--font-body);
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--color-text-variant);
          letter-spacing: 0.1em;
        }
        .min-order {
          font-size: 0.7rem;
          color: var(--color-text-variant);
          font-family: var(--font-body);
          margin-top: 2px;
        }
        .coupon-divider {
          width: 1px;
          height: 44px;
          background: var(--color-outline-variant);
          flex-shrink: 0;
        }
        .coupon-code-btn {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 0;
        }
        .code-text {
          font-family: monospace;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-text);
          background: var(--color-primary-light);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          letter-spacing: 0.1em;
        }
        .copy-label {
          font-size: 0.65rem;
          font-family: var(--font-body);
          color: var(--color-text-variant);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
