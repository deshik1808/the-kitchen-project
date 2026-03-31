"use client";

import { useState, useEffect, useRef } from 'react';

export default function SearchDrawer({ open, onClose, onSearch, menu = [] }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const suggestions = query.length >= 1
    ? menu.filter(item => {
        const q = query.toLowerCase();
        return item.name?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
      }).slice(0, 8)
    : [];

  const popular = menu.slice(0, 6);

  const handleSelect = (itemName) => {
    onSearch(itemName);
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-handle" />

        <form onSubmit={handleSubmit} className="drawer-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="s-icon">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for items or more..."
            className="drawer-input"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="clear-btn" aria-label="Clear">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </form>

        <div className="drawer-body">
          {query.length >= 1 ? (
            suggestions.length > 0 ? (
              <div className="results">
                {suggestions.map(item => (
                  <button key={item.id} className="result-row" onClick={() => handleSelect(item.name)}>
                    <div className="result-info">
                      <span className={`type-dot ${item.type?.toLowerCase() === 'veg' ? 'veg' : 'nonveg'}`} />
                      <span className="result-name">{item.name}</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="arrow">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty">
                <p>No items found for "{query}"</p>
              </div>
            )
          ) : (
            <div className="popular">
              <p className="section-label">Popular items</p>
              <div className="popular-chips">
                {popular.map(item => (
                  <button key={item.id} className="chip" onClick={() => handleSelect(item.name)}>
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .drawer-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(0,0,0,0.4);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .drawer {
          background: var(--color-surface-lowest);
          border-radius: 20px 20px 0 0;
          max-height: 75vh;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding-bottom: env(safe-area-inset-bottom, 16px);
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .drawer-handle {
          width: 36px;
          height: 4px;
          border-radius: 2px;
          background: var(--color-surface-dim);
          margin: 10px auto 6px;
        }
        .drawer-search {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 8px 16px 0;
          padding: 12px 14px;
          background: var(--color-surface-container);
          border: 1.5px solid var(--color-surface-dim);
          border-radius: var(--radius-md);
        }
        .drawer-search:focus-within {
          border-color: var(--color-primary);
        }
        .s-icon { color: var(--color-text-variant); flex-shrink: 0; }
        .drawer-input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          font-family: var(--font-body);
          font-size: 0.95rem;
          color: var(--color-text);
        }
        .drawer-input::placeholder { color: var(--color-text-variant); }
        .clear-btn {
          background: none;
          border: none;
          color: var(--color-text-variant);
          cursor: pointer;
          padding: 2px;
          display: flex;
          flex-shrink: 0;
        }
        .drawer-body {
          overflow-y: auto;
          padding: 12px 16px 16px;
          min-height: 200px;
        }
        .results {
          display: flex;
          flex-direction: column;
        }
        .result-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 4px;
          border: none;
          background: none;
          cursor: pointer;
          border-bottom: 1px solid var(--color-surface-container);
          width: 100%;
          text-align: left;
        }
        .result-row:last-child { border-bottom: none; }
        .result-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .type-dot {
          width: 12px; height: 12px;
          border-radius: 2px;
          border: 2px solid;
          position: relative;
          flex-shrink: 0;
        }
        .type-dot.veg { border-color: var(--color-secondary); }
        .type-dot.veg::after {
          content: '';
          position: absolute;
          inset: 2px;
          border-radius: 50%;
          background: var(--color-secondary);
        }
        .type-dot.nonveg { border-color: var(--color-error); }
        .type-dot.nonveg::after {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 0; height: 0;
          border-left: 3px solid transparent;
          border-right: 3px solid transparent;
          border-bottom: 5px solid var(--color-error);
        }
        .result-name {
          font-family: var(--font-body);
          font-size: 0.9rem;
          color: var(--color-text);
        }
        .arrow { color: var(--color-text-variant); }
        .empty {
          text-align: center;
          padding: var(--space-6) 0;
          color: var(--color-text-variant);
          font-size: 0.9rem;
        }
        .section-label {
          font-family: var(--font-body);
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--color-text-variant);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 10px;
        }
        .popular-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .chip {
          padding: 8px 14px;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-surface-dim);
          background: var(--color-surface-container);
          color: var(--color-text);
          font-family: var(--font-body);
          font-size: 0.82rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .chip:active { background: var(--color-surface-container-high); }
      `}</style>
    </div>
  );
}
