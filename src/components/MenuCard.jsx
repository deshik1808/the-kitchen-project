export default function MenuCard({ item, currency = '₹', onAdd }) {
  const isVeg = item.type?.toLowerCase() === 'veg';

  return (
    <div className="menu-card">
      <div className="image-wrapper">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} loading="lazy" />
        ) : (
          <div className="image-placeholder">
            <span>🍽</span>
          </div>
        )}
        {/* Veg/Non-Veg badge on image */}
        <span className={`type-indicator ${isVeg ? 'veg' : 'non-veg'}`}>
          <span className="dot"></span>
        </span>
        {/* Floating Add button overlapping the image */}
        <button
          className="add-pill"
          onClick={(e) => { e.stopPropagation(); onAdd(item); }}
        >
          Add
        </button>
      </div>
      <div className="card-info">
        <p className="item-name">{item.name}</p>
        <p className="item-price">{currency}{item.price}</p>
      </div>

      <style jsx>{`
        .menu-card {
          background: var(--color-surface-lowest);
          border-radius: var(--radius-lg);
          overflow: visible;
          position: relative;
          transition: transform 0.2s;
        }
        .menu-card:active { transform: scale(0.98); }
        
        .image-wrapper {
          position: relative;
          border-radius: var(--radius-lg);
          overflow: hidden;
          aspect-ratio: 1 / 0.85;
          background: var(--color-surface-container);
        }
        .image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface-container);
          font-size: 2.5rem;
        }
        
        .type-indicator {
          position: absolute;
          top: 8px;
          left: 8px;
          width: 18px;
          height: 18px;
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .type-indicator.veg {
          border: 2px solid var(--color-secondary);
        }
        .type-indicator.non-veg {
          border: 2px solid var(--color-error);
        }
        .type-indicator .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }
        .type-indicator.veg .dot { background: var(--color-secondary); }
        .type-indicator.non-veg .dot { background: var(--color-error); }
        
        .add-pill {
          position: absolute;
          bottom: -14px;
          right: 12px;
          background: var(--color-primary);
          color: white;
          border: none;
          padding: 6px 20px;
          border-radius: var(--radius-full);
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.2s;
          z-index: 2;
          letter-spacing: 0.02em;
        }
        .add-pill:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
        }
        .add-pill:active { transform: translateY(0); }
        
        .card-info {
          padding: var(--space-3);
          padding-top: calc(var(--space-3) + 4px);
        }
        .item-name {
          font-family: var(--font-body);
          font-weight: 500;
          font-size: 0.95rem;
          color: var(--color-text);
          margin-bottom: 2px;
          line-height: 1.3;
        }
        .item-price {
          font-family: var(--font-body);
          font-size: 0.85rem;
          color: var(--color-text-variant);
          font-weight: 400;
        }
      `}</style>
    </div>
  );
}
