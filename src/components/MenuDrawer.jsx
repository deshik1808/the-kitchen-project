"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getCartItemCount } from '../lib/cart';

function MenuDrawerPortal({ open, onOpen, onClose, categories, menu, onSelectCategory }) {
  const [cartCount, setCartCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => setCartCount(getCartItemCount());
    update();
    window.addEventListener('cartUpdated', update);
    return () => window.removeEventListener('cartUpdated', update);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleSelect = (cat) => {
    onSelectCategory(cat);
    onClose();
  };

  const categoryCounts = categories.map(cat => ({
    name: cat,
    count: menu.filter(item => item.category === cat).length,
  }));

  const pillBottom = cartCount > 0 ? 88 : 24;

  const content = (
    <>
      {/* Backdrop — dark film, fades in/out */}
      <div className={`menu-panel-backdrop ${open ? 'visible' : ''}`} onClick={onClose} />

      <div className="menu-pill-wrapper" style={{ bottom: `${pillBottom}px` }}>
        {/* Floating category panel — anchored above the pill */}
        <div className={`menu-panel ${open ? 'open' : ''}`} role="dialog" aria-label="Menu categories">
          {categoryCounts.map(({ name, count }) => (
            <button
              key={name}
              className="menu-panel-row"
              onClick={() => handleSelect(name)}
            >
              <span className="menu-panel-cat-name">{name}</span>
              <span className="menu-panel-cat-count">{count}</span>
            </button>
          ))}
        </div>

        {/* Pill — toggles between Menu and Close */}
        <button
          className={`menu-pill ${open ? 'is-open' : ''}`}
          onClick={open ? onClose : onOpen}
          aria-label={open ? 'Close menu' : 'Open menu categories'}
        >
          {open ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span>Close</span>
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="5" y1="2" x2="5" y2="8" />
                <line x1="9" y1="2" x2="9" y2="8" />
                <path d="M5 8 Q7 11 9 8" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <path d="M17 2 Q21 5 21 10 L17 12" />
              </svg>
              <span>Menu</span>
            </>
          )}
        </button>
      </div>

      <style>{`
        /* Backdrop — dark film like Zomato */
        .menu-panel-backdrop {
          position: fixed;
          inset: 0;
          z-index: 97;
          background: rgba(0, 0, 0, 0.55);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .menu-panel-backdrop.visible {
          opacity: 1;
          pointer-events: auto;
        }

        /* Pill wrapper — mirrors the 480px centered layout */
        .menu-pill-wrapper {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 480px;
          z-index: 98;
          pointer-events: none;
        }

        /* Floating category panel — pops up above the pill */
        .menu-panel {
          position: absolute;
          right: 20px;
          bottom: 46px;
          width: 80%;
          max-height: 300px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.16);
          pointer-events: none;
          opacity: 0;
          transform: scale(0.85) translateY(16px);
          transform-origin: bottom right;
          transition: opacity 0.28s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .menu-panel.open {
          opacity: 1;
          transform: scale(1) translateY(0);
          pointer-events: auto;
        }

        .menu-panel-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 14px 16px;
          border: none;
          border-bottom: 1px solid #f2f2f2;
          background: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.1s;
        }
        .menu-panel-row:last-child {
          border-bottom: none;
        }
        .menu-panel-row:active {
          background: #f6f6f6;
        }

        .menu-panel-cat-name {
          font-size: 0.82rem;
          font-weight: 300;
          color: #222;
        }

        .menu-panel-cat-count {
          font-size: 0.78rem;
          color: #aaa;
          font-weight: 300;
          flex-shrink: 0;
          margin-left: 8px;
        }

        /* Pill */
        .menu-pill {
          position: absolute;
          right: 20px;
          bottom: 0;
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          border-radius: 10px;
          background: #3d3d3d;
          color: #fff;
          border: none;
          cursor: pointer;
          font-size: 0.82rem;
          font-weight: 300;
          letter-spacing: 0.03em;
          box-shadow: 0 4px 20px rgba(0,0,0,0.28);
          transition: transform 0.15s, background 0.15s;
          white-space: nowrap;
        }
        .menu-pill.is-open {
          background: #222;
        }
        .menu-pill:active {
          background: #555;
          transform: scale(0.97);
        }
      `}</style>
    </>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}

export default function MenuDrawer({ categories, menu, onSelectCategory }) {
  const [open, setOpen] = useState(false);

  return (
    <MenuDrawerPortal
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      categories={categories}
      menu={menu}
      onSelectCategory={onSelectCategory}
    />
  );
}
