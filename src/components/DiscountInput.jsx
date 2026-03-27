import { useState } from 'react';
import { useStore } from '../lib/StoreContext';
import { validateDiscount } from '../lib/api';

export default function DiscountInput({ subtotal, currency = '₹', onApply, onRemove, appliedDiscount }) {
  const { showToast } = useStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async (e) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await validateDiscount(code.trim(), subtotal);
      if (res.valid) {
        onApply({ code: code.trim(), amount: res.discountAmount });
        showToast(`${code.trim()} applied successfully!`, 'success');
        setCode('');
      } else {
        setError(res.message || 'Invalid discount code');
      }
    } catch (err) {
      setError('Failed to validate code.');
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  };

  if (appliedDiscount) {
    return (
      <div className="discount-applied">
        <div className="applied-left">
          <span className="tag-icon">🏷️</span>
          <span>Applied coupon '<strong>{appliedDiscount.code}</strong>'</span>
        </div>
        <button type="button" onClick={onRemove} className="remove-link">Remove</button>
        <style jsx>{`
          .discount-applied {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--space-3);
            background: rgba(25, 106, 0, 0.06);
            border-radius: var(--radius-md);
            margin: var(--space-3) 0;
          }
          .applied-left { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--color-secondary); }
          .remove-link { background: none; border: none; color: var(--color-error); text-decoration: underline; cursor: pointer; font-size: 0.8rem; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="discount-row">
      <div className="promo-form">
        <div className="promo-left">
          <span className="tag-icon">🏷️</span>
          <input type="text" placeholder="Promo code" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={handleKeyDown} disabled={loading} />
        </div>
        <button type="button" onClick={handleApply} disabled={loading || !code.trim()} className="apply-link">
          {loading ? '...' : 'Apply'}
        </button>
      </div>
      {error && <p className="promo-error">{error}</p>}
      <style jsx>{`
        .discount-row { margin: var(--space-3) 0; }
        .promo-form {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-2) 0;
          border-bottom: 1.5px solid var(--color-outline-variant);
        }
        .promo-left { display: flex; align-items: center; gap: 8px; flex: 1; }
        .tag-icon { font-size: 1rem; }
        .promo-left input {
          border: none;
          background: transparent;
          font-family: var(--font-body);
          font-size: 0.9rem;
          color: var(--color-text);
          outline: none;
          flex: 1;
        }
        .apply-link {
          background: none;
          border: none;
          color: var(--color-primary);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .apply-link:disabled { opacity: 0.4; cursor: not-allowed; }
        .promo-error { color: var(--color-error); font-size: 0.8rem; margin-top: 4px; }
      `}</style>
    </div>
  );
}
