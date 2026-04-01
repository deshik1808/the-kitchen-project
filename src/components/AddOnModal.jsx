import { useState } from 'react';

export default function AddOnModal({ item, currency = '₹', onClose, onConfirm }) {
  const [qty, setQty] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);

  const addons = item?.addons || [];

  const handleToggle = (addon) => {
    if (selectedAddons.find(a => a.name === addon.name)) {
      setSelectedAddons(selectedAddons.filter(a => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);
  const totalPrice = (item.price + addonsTotal) * qty;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="drag-handle"></div>
        
        <div className="modal-head">
          <div>
            <h3>{item.name}</h3>
            <p className="base-price">{currency}{item.price}</p>
          </div>
          <button className="close-x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {addons.length > 0 && (
          <div className="addons-section">
            <h4>Customize</h4>
            <div className="addon-list">
              {addons.map((addon, idx) => (
                <label key={idx} className={`addon-row ${selectedAddons.find(a => a.name === addon.name) ? 'selected' : ''}`}>
                  <div className="addon-check">
                    <input
                      type="checkbox"
                      checked={!!selectedAddons.find(a => a.name === addon.name)}
                      onChange={() => handleToggle(addon)}
                    />
                    <span className="checkmark"></span>
                  </div>
                  <span className="addon-name">{addon.name}</span>
                  <span className={`addon-price ${addon.price === 0 ? 'free' : ''}`}>
                    {addon.price > 0 ? `+${currency}${addon.price}` : 'FREE'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="qty-section">
          <span className="qty-label">Quantity</span>
          <div className="qty-stepper">
            <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}>−</button>
            <span className="qty-value">{qty}</span>
            <button className="qty-btn plus" onClick={() => setQty(qty + 1)}>+</button>
          </div>
        </div>

        <button className="confirm-btn" onClick={() => onConfirm({ ...item, qty, addons: selectedAddons })}>
          Add to Cart — {currency}{totalPrice}
        </button>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(42, 46, 65, 0.45);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.25s;
        }
        .modal-sheet {
          background: var(--color-surface-lowest);
          width: 100%;
          max-width: 480px;
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
          padding: var(--space-2) var(--space-4) var(--space-4);
          animation: sheetUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          max-height: 85vh;
          overflow-y: auto;
        }
        .drag-handle {
          width: 32px; height: 3px;
          background: var(--color-outline-variant);
          border-radius: var(--radius-full);
          margin: 0 auto 14px;
        }
        .modal-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 14px;
        }
        .modal-head h3 {
          font-size: 1.1rem;
          font-weight: 400;
          margin-bottom: 2px;
        }
        .base-price {
          color: var(--color-primary);
          font-weight: 600;
          font-size: 0.9rem;
        }
        .close-x {
          background: var(--color-surface-container);
          border: none;
          border-radius: var(--radius-full);
          width: 28px; height: 28px;
          font-size: 0.75rem;
          color: var(--color-text-variant);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .addons-section h4 {
          font-family: var(--font-display);
          font-size: 0.78rem;
          font-weight: 500;
          margin-bottom: 8px;
          color: var(--color-text-variant);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .addon-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .addon-row {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          background: var(--color-surface-container-low);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background 0.2s;
        }
        .addon-row.selected {
          background: var(--color-primary-light);
        }
        .addon-check { position: relative; margin-right: 10px; }
        .addon-check input { opacity: 0; position: absolute; }
        .checkmark {
          width: 17px; height: 17px;
          border: 1.5px solid var(--color-outline-variant);
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .addon-row.selected .checkmark {
          background: var(--color-primary);
          border-color: var(--color-primary);
        }
        .addon-row.selected .checkmark::after {
          content: '✓';
          color: white;
          font-size: 0.65rem;
          font-weight: 600;
        }
        .addon-name { flex: 1; font-weight: 400; font-size: 0.85rem; }
        .addon-price { font-weight: 400; font-size: 0.8rem; color: var(--color-text-variant); }
        .addon-price.free { color: var(--color-secondary); font-weight: 500; }

        .qty-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 14px 0;
          padding: 10px 0;
        }
        .qty-label { font-weight: 500; font-size: 0.88rem; }
        .qty-stepper {
          display: flex;
          align-items: center;
          gap: 0;
          border: 1px solid var(--color-surface-dim);
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: var(--color-surface-lowest);
        }
        .qty-btn {
          width: 30px; height: 30px;
          background: transparent;
          border: none;
          font-size: 1rem;
          color: var(--color-primary);
          font-weight: 400;
          cursor: pointer;
          transition: background 0.2s;
        }
        .qty-btn:hover { background: var(--color-surface-container); }
        .qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .qty-btn.plus { color: var(--color-primary); }
        .qty-value {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 0.9rem;
          min-width: 24px;
          text-align: center;
        }

        .confirm-btn {
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: var(--radius-md);
          background: var(--color-primary);
          color: white;
          font-family: var(--font-display);
          font-weight: 500;
          font-size: 0.92rem;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .confirm-btn:active { opacity: 0.85; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
}
