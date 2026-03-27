export default function CategoryFilter({ categories, activeCategory, onSelect, vegOnly, onVegToggle }) {
  return (
    <div className="filter-bar">
      <div className="categories">
        <button
          className={`cat-pill ${activeCategory === 'All' ? 'active' : ''}`}
          onClick={() => onSelect('All')}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => onSelect(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="diet-filters">
        <button
          className={`diet-btn ${vegOnly === true ? 'active' : ''}`}
          onClick={() => onVegToggle(true)}
        >
          <span className="veg-dot"></span> Veg
        </button>
        <button
          className={`diet-btn non-veg ${vegOnly === false ? '' : ''}`}
          onClick={() => onVegToggle(false)}
        >
          <span className="non-veg-dot"></span> Non-Veg
        </button>
      </div>

      <style jsx>{`
        .filter-bar {
          position: sticky;
          top: 60px;
          z-index: 90;
          background: var(--color-surface-lowest);
          padding: var(--space-3) var(--space-6);
          padding-top: var(--space-2);
        }
        .categories {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: var(--space-3);
        }
        .categories::-webkit-scrollbar { display: none; }
        .cat-pill {
          flex-shrink: 0;
          padding: 8px 20px;
          border-radius: var(--radius-full);
          border: none;
          background: var(--color-surface-container-high);
          color: var(--color-text-variant);
          font-family: var(--font-body);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
        }
        .cat-pill.active {
          background: var(--color-primary);
          color: white;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(255, 82, 0, 0.3);
        }
        .diet-filters {
          display: flex;
          gap: var(--space-3);
          align-items: center;
        }
        .diet-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: var(--color-text-variant);
          font-family: var(--font-body);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          padding: 4px 0;
          transition: color 0.2s;
        }
        .diet-btn.active { color: var(--color-text); font-weight: 600; }
        .veg-dot {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid var(--color-secondary);
          border-radius: 2px;
          position: relative;
        }
        .veg-dot::after {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--color-secondary);
        }
        .non-veg-dot {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid var(--color-error);
          border-radius: 2px;
          position: relative;
        }
        .non-veg-dot::after {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 0; height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: 6px solid var(--color-error);
        }
      `}</style>
    </div>
  );
}
