"use client";

import { useState } from 'react';
import SearchDrawer from './SearchDrawer';

export default function CategoryFilter({ categories, activeCategory, onSelect, vegOnly, onVegToggle, searchQuery, onSearch, menu }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

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

      {/* Row 2: Search trigger + Diet filters — all inline */}
      <div className="search-diet-row">
        <button className="search-trigger" onClick={() => setDrawerOpen(true)}>
          <span className="search-placeholder">
            {searchQuery || 'Search Menu'}
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>

        <button
          className={`diet-btn veg-btn ${vegOnly === true ? 'active' : ''}`}
          onClick={() => onVegToggle(true)}
        >
          <span className="veg-dot"></span>
          <span>Veg</span>
          {vegOnly === true && (
            <svg className="x-mark" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          )}
        </button>

        <button
          className={`diet-btn nonveg-btn ${vegOnly === false ? 'active' : ''}`}
          onClick={() => onVegToggle(false)}
        >
          <span className="non-veg-dot"></span>
          <span>Non-Veg</span>
          {vegOnly === false && (
            <svg className="x-mark" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          )}
        </button>
      </div>

      <SearchDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSearch={onSearch}
        menu={menu}
      />

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

        /* --- Search + Diet row (all inline, no overflow) --- */
        .search-diet-row {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }

        /* Search trigger — rectangular, subtle gray border */
        .search-trigger {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 9px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-surface-dim);
          background: var(--color-surface-lowest);
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .search-trigger:active {
          border-color: var(--color-text-variant);
        }
        .search-placeholder {
          font-family: var(--font-body);
          font-size: 0.82rem;
          color: var(--color-text-variant);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .search-icon { color: var(--color-text-variant); flex-shrink: 0; }

        /* --- Diet filter buttons — rectangular with subtle radius --- */
        .diet-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          padding: 8px 10px;
          border-radius: var(--radius-sm);
          font-family: var(--font-body);
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .veg-btn {
          border: 1.5px solid var(--color-surface-dim);
          background: var(--color-surface-lowest);
          color: var(--color-text-variant);
        }
        .veg-btn.active {
          border-color: var(--color-secondary);
          background: color-mix(in srgb, var(--color-secondary), transparent 92%);
          color: var(--color-secondary);
          font-weight: 600;
        }

        .nonveg-btn {
          border: 1.5px solid var(--color-surface-dim);
          background: var(--color-surface-lowest);
          color: var(--color-text-variant);
        }
        .nonveg-btn.active {
          border-color: var(--color-error);
          background: color-mix(in srgb, var(--color-error), transparent 92%);
          color: var(--color-error);
          font-weight: 600;
        }

        .x-mark {
          display: block;
          flex-shrink: 0;
          color: var(--color-text);
        }

        /* --- Veg/Non-Veg dot icons --- */
        .veg-dot {
          display: inline-block;
          width: 12px; height: 12px;
          border: 1.5px solid var(--color-secondary);
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
          width: 12px; height: 12px;
          border: 1.5px solid var(--color-error);
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
          border-left: 3px solid transparent;
          border-right: 3px solid transparent;
          border-bottom: 4.5px solid var(--color-error);
        }
      `}</style>
    </div>
  );
}
