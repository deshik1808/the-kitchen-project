export default function CategoryFilter({ categories, activeCategory, onSelect, vegOnly, onVegToggle, searchQuery, onSearch }) {
  return (
    <div className="filter-bar">

      {/* Row 1: Category pills */}
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

      {/* Row 2: Search + Diet filters */}
      <div className="search-diet-row">
        <div className="search-box">
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search Menu"
            className="search-input"
          />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>

        <div className="diet-pills">
          <button
            className={`diet-pill veg-pill ${vegOnly === true ? 'active' : ''}`}
            onClick={() => onVegToggle(true)}
          >
            <span className="veg-dot"></span>
            Veg
            {vegOnly === true && <span className="dismiss">✕</span>}
          </button>
          <button
            className={`diet-pill nonveg-pill ${vegOnly === false ? 'active' : ''}`}
            onClick={() => onVegToggle(false)}
          >
            <span className="non-veg-dot"></span>
            Non-Veg
            {vegOnly === false && <span className="dismiss">✕</span>}
          </button>
        </div>
      </div>

      <style jsx>{`
        .filter-bar {
          position: sticky;
          top: 60px;
          z-index: 90;
          background: var(--color-surface-lowest);
          padding: var(--space-2) var(--space-3) var(--space-3);
        }

        /* --- Category pills --- */
        .categories {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: var(--space-3);
        }
        .categories::-webkit-scrollbar { display: none; }
        .cat-pill {
          flex-shrink: 0;
          padding: 7px 18px;
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
          box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary), transparent 60%);
        }

        /* --- Search + Diet row --- */
        .search-diet-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .search-box {
          flex: 1;
          display: flex;
          align-items: center;
          background: var(--color-surface-container);
          border-radius: var(--radius-full);
          padding: 8px 14px;
          gap: 8px;
          border: 1.5px solid transparent;
          transition: border-color 0.2s;
        }
        .search-box:focus-within {
          border-color: var(--color-primary);
          background: var(--color-surface-lowest);
        }
        .search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-family: var(--font-body);
          font-size: 0.85rem;
          color: var(--color-text);
          min-width: 0;
        }
        .search-input::placeholder { color: var(--color-text-variant); }
        .search-icon { color: var(--color-text-variant); flex-shrink: 0; }

        /* --- Diet pills --- */
        .diet-pills {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }
        .diet-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border-radius: var(--radius-full);
          background: transparent;
          font-family: var(--font-body);
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .veg-pill {
          border: 1.5px solid var(--color-secondary);
          color: var(--color-secondary);
        }
        .veg-pill.active {
          background: color-mix(in srgb, var(--color-secondary), transparent 88%);
          font-weight: 600;
        }
        .nonveg-pill {
          border: 1.5px solid var(--color-error);
          color: var(--color-error);
        }
        .nonveg-pill.active {
          background: color-mix(in srgb, var(--color-error), transparent 88%);
          font-weight: 600;
        }
        .dismiss {
          font-size: 0.65rem;
          margin-left: 1px;
          opacity: 0.75;
        }

        /* --- Veg/Non-Veg icons --- */
        .veg-dot {
          display: inline-block;
          width: 13px; height: 13px;
          border: 2px solid var(--color-secondary);
          border-radius: 2px;
          position: relative;
          flex-shrink: 0;
        }
        .veg-dot::after {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--color-secondary);
        }
        .non-veg-dot {
          display: inline-block;
          width: 13px; height: 13px;
          border: 2px solid var(--color-error);
          border-radius: 2px;
          position: relative;
          flex-shrink: 0;
        }
        .non-veg-dot::after {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 0; height: 0;
          border-left: 3.5px solid transparent;
          border-right: 3.5px solid transparent;
          border-bottom: 5px solid var(--color-error);
        }
      `}</style>
    </div>
  );
}
