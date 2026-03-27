"use client";

import { useState } from 'react';
import { useStore } from '../lib/StoreContext';
import { addToCart } from '../lib/cart';
import CategoryFilter from '../components/CategoryFilter';
import MenuCard from '../components/MenuCard';
import AddOnModal from '../components/AddOnModal';
import StoreClosed from '../components/StoreClosed';
import CartDrawer from '../components/CartDrawer';

export default function Home() {
  const { storeData, loading, error, showToast } = useStore();
  const [activeCategory, setActiveCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(null); // null = show all
  const [selectedItem, setSelectedItem] = useState(null);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="skeleton-grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton-card">
              <div className="skel-img"></div>
              <div className="skel-text"></div>
              <div className="skel-price"></div>
            </div>
          ))}
        </div>
        <style jsx>{`
          .loading-page { max-width: 480px; margin: 0 auto; padding: var(--space-6); }
          .skeleton-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
          .skeleton-card { background: var(--color-surface-lowest); border-radius: var(--radius-lg); overflow: hidden; }
          .skel-img { height: 130px; background: var(--color-surface-container); animation: pulse 1.5s infinite; }
          .skel-text { height: 14px; width: 70%; margin: var(--space-3); background: var(--color-surface-container); border-radius: 4px; animation: pulse 1.5s infinite; }
          .skel-price { height: 12px; width: 40%; margin: 0 var(--space-3) var(--space-3); background: var(--color-surface-container); border-radius: 4px; animation: pulse 1.5s infinite; }
          @keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
        `}</style>
      </div>
    );
  }

  if (error || !storeData) {
    return (
      <div className="error-page">
        <div className="error-card">
          <span className="error-icon">😔</span>
          <h2>Something went wrong</h2>
          <p>We couldn't load the menu right now. Please check back in a moment.</p>
          <button onClick={() => window.location.reload()} className="retry-btn">Try Again</button>
        </div>
        <style jsx>{`
          .error-page { max-width: 480px; margin: 0 auto; padding: var(--space-8) var(--space-6); text-align: center; }
          .error-card { background: var(--color-surface-lowest); border-radius: var(--radius-xl); padding: var(--space-8) var(--space-6); }
          .error-icon { font-size: 3rem; display: block; margin-bottom: var(--space-3); }
          h2 { font-size: 1.3rem; margin-bottom: var(--space-2); }
          p { color: var(--color-text-variant); margin-bottom: var(--space-5); }
          .retry-btn { background: var(--color-primary); color: white; border: none; padding: 12px 32px; border-radius: var(--radius-full); font-weight: 600; cursor: pointer; }
        `}</style>
      </div>
    );
  }

  const { store, menu } = storeData;
  const currency = store.currency || '₹';
  const categories = Array.from(new Set(menu.map(item => item.category))).filter(Boolean);

  const filteredMenu = menu.filter(item => {
    if (activeCategory !== 'All' && item.category !== activeCategory) return false;
    if (vegOnly === true && item.type?.toLowerCase() !== 'veg') return false;
    if (vegOnly === false && item.type?.toLowerCase() !== 'non-veg') return false;
    return true;
  });

  const handleAdd = (item) => {
    if (store.open === false || store.open === 'N') {
      showToast('Store is currently closed', 'error');
      return;
    }
    if (item.addons && item.addons.length > 0) {
      setSelectedItem(item);
    } else {
      // No addons — add directly with qty 1
      addToCart({ ...item, qty: 1, addons: [] });
      showToast(`${item.name} added to cart!`, 'success');
    }
  };

  const handleConfirmAdd = (itemWithConfig) => {
    addToCart(itemWithConfig);
    showToast(`${itemWithConfig.name} added to cart!`, 'success');
    setSelectedItem(null);
  };

  const isStoreOpen = store.open === true || store.open === 'Y';

  return (
    <div className="menu-page">
      {!isStoreOpen && <StoreClosed message={store.closedMessage} />}

      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
        vegOnly={vegOnly}
        onVegToggle={(val) => setVegOnly(vegOnly === val ? null : val)}
      />

      <div className="menu-content">
        <div className={`menu-grid ${!isStoreOpen ? 'disabled' : ''}`}>
          {filteredMenu.length > 0 ? (
            filteredMenu.map(item => (
              <MenuCard
                key={item.id}
                item={item}
                currency={currency}
                onAdd={handleAdd}
              />
            ))
          ) : (
            <div className="no-items">
              <span>🔍</span>
              <p>No items match this filter.</p>
            </div>
          )}
        </div>
      </div>

      {selectedItem && (
        <AddOnModal
          item={selectedItem}
          currency={currency}
          onClose={() => setSelectedItem(null)}
          onConfirm={handleConfirmAdd}
        />
      )}

      <CartDrawer currency={currency} />

      <style jsx>{`
        .menu-page {
          max-width: 480px;
          margin: 0 auto;
          padding-bottom: 80px;
        }
        .menu-content {
          padding: var(--space-3) var(--space-6);
        }
        .menu-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
        }
        .disabled {
          opacity: 0.4;
          pointer-events: none;
          filter: grayscale(0.5);
        }
        .no-items {
          grid-column: 1 / -1;
          text-align: center;
          padding: var(--space-8) 0;
          color: var(--color-text-variant);
        }
        .no-items span { font-size: 2rem; display: block; margin-bottom: var(--space-2); }
      `}</style>
    </div>
  );
}
