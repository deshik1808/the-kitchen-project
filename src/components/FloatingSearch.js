"use client";

import { useState, useEffect, useRef } from 'react';

export default function FloatingSearch({ onSearch }) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    onSearch(query);
  }, [query, onSearch]);

  const handleIconClick = () => {
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleClear = () => {
    setQuery('');
    setExpanded(false);
  };

  return (
    <div className="search-wrap">
      {!expanded ? (
        <button className="search-icon-btn" onClick={handleIconClick} aria-label="Search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      ) : (
        <div className="search-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onBlur={() => { if (!query) setExpanded(false); }}
            placeholder="Search items or description"
            className="search-input"
          />
          {query && (
            <button onClick={handleClear} className="clear-btn" aria-label="Clear search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .search-wrap {
          padding: var(--space-2) var(--space-6) 0;
          max-width: 480px;
          margin: 0 auto;
        }
        .search-icon-btn {
          background: none;
          border: none;
          color: var(--color-text-variant);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }
        .search-bar {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: var(--color-surface-container-low);
          border-radius: var(--radius-full);
          padding: 10px 16px;
          border: 1.5px solid var(--color-outline-variant);
          transition: border-color 0.2s;
        }
        .search-bar:focus-within {
          border-color: var(--color-primary);
        }
        .search-icon {
          color: var(--color-text-variant);
          flex-shrink: 0;
        }
        .search-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-family: var(--font-body);
          font-size: 0.9rem;
          color: var(--color-text);
        }
        .search-input::placeholder {
          color: var(--color-outline);
        }
        .clear-btn {
          background: none;
          border: none;
          color: var(--color-text-variant);
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
