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
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleSelect = (cat) => {
    onSelectCategory(cat);
    onClose();
  };

  // Count items per category from full menu (unfiltered)
  const categoryCounts = categories.map(cat => ({
    name: cat,
    count: menu.filter(item => item.category === cat).length,
  }));

  const pillBottom = cartCount > 0 ? 88 : 24;

  const content = (
    <>
      {/* Backdrop */}
      <div
        className={`menu-drawer-backdrop ${open ? 'visible' : ''}`}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className={`menu-drawer-sheet ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu categories">
        <div className="menu-drawer-handle" />
        <div className="menu-drawer-header">
          <span className="menu-drawer-title">Menu</span>
          <button className="menu-drawer-close" onClick={onClose} aria-label="Close menu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="menu-drawer-body">
          {categoryCounts.map(({ name, count }) => (
            <button
              key={name}
              className="menu-drawer-row"
              onClick={() => handleSelect(name)}
            >
              <span className="menu-drawer-cat-name">{name}</span>
              <span className="menu-drawer-cat-count">({count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Floating pill */}
      <button
        className="menu-pill"
        style={{ bottom: `${pillBottom}px` }}
        onClick={onOpen}
        aria-label="Open menu categories"
      >
        {/* Fork & knife icon — universally recognisable for food ordering */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Fork */}
          <line x1="7" y1="2" x2="7" y2="22" />
          <line x1="5" y1="2" x2="5" y2="8" />
          <line x1="9" y1="2" x2="9" y2="8" />
          <path d="M5 8 Q7 11 9 8" />
          {/* Knife */}
          <line x1="17" y1="2" x2="17" y2="22" />
          <path d="M17 2 Q21 5 21 10 L17 12" />
        </svg>
        <span>Menu</span>
      </button>

      <style>{`
        .menu-drawer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: 200;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.28s ease;
        }
        .menu-drawer-backdrop.visible {
          opacity: 1;
          pointer-events: auto;
        }

        .menu-drawer-sheet {
          position: fixed;
          left: 50%;
          transform: translateX(-50%) translateY(100%);
          bottom: 0;
          z-index: 201;
          background: #fff;
          border-radius: 20px 20px 0 0;
          max-height: 75vh;
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 -4px 32px rgba(0,0,0,0.12);
        }
        .menu-drawer-sheet.open {
          transform: translateX(-50%) translateY(0);
        }
        .menu-drawer-handle {
          width: 36px;
          height: 4px;
          border-radius: 2px;
          background: #e0e0e0;
          margin: 12px auto 0;
          flex-shrink: 0;
        }

        .menu-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px 12px;
          flex-shrink: 0;
        }

        .menu-drawer-title {
          font-size: 1rem;
          font-weight: 500;
          color: #111;
          letter-spacing: -0.01em;
        }

        .menu-drawer-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f0f0f0;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #555;
          transition: background 0.15s;
        }
        .menu-drawer-close:active {
          background: #e0e0e0;
        }

        .menu-drawer-body {
          overflow-y: auto;
          flex: 1;
          padding: 0 20px 24px;
          -webkit-overflow-scrolling: touch;
        }

        .menu-drawer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 18px 0;
          border: none;
          border-bottom: 1px solid #f2f2f2;
          background: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.12s;
        }
        .menu-drawer-row:last-child {
          border-bottom: none;
        }
        .menu-drawer-row:active {
          background: #f9f9f9;
          border-radius: 8px;
        }

        .menu-drawer-cat-name {
          font-size: 0.9rem;
          font-weight: 400;
          color: #333;
          letter-spacing: -0.01em;
        }

        .menu-drawer-cat-count {
          font-size: 0.8rem;
          color: #aaa;
          font-weight: 300;
          flex-shrink: 0;
          margin-left: 8px;
        }

        /* Floating pill */
        .menu-pill {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          z-index: 96;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          border-radius: 50px;
          background: #1a1a1a;
          color: #fff;
          border: none;
          cursor: pointer;
          font-size: 0.82rem;
          font-weight: 300;
          letter-spacing: 0.03em;
          box-shadow: 0 4px 20px rgba(0,0,0,0.28);
          transition: bottom 0.3s cubic-bezier(0.22, 1, 0.36, 1), transform 0.15s, background 0.15s;
          white-space: nowrap;
        }
        .menu-pill:active {
          background: #333;
          transform: translateX(-50%) scale(0.97);
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
