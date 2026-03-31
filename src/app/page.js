"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../lib/StoreContext';
import { addToCart } from '../lib/cart';
import CategoryFilter from '../components/CategoryFilter';
import MenuCard from '../components/MenuCard';
import AddOnModal from '../components/AddOnModal';
import StoreClosed from '../components/StoreClosed';
import CartDrawer from '../components/CartDrawer';
import PromotionsCarousel from '../components/PromotionsCarousel';
import CouponList from '../components/CouponList';

export default function Home() {
  const { storeData, loading, error, showToast } = useStore();
  const [activeCategory, setActiveCategory] = useState('All');
  const [vegOnly, setVegOnly] = useState(null); // null = show all
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [isSticky, setIsSticky] = useState(false);
  const stickySentinelRef = useRef(null);

  const store = storeData?.store ?? {};
  const menu = storeData?.menu ?? [];
  const promotions = storeData?.promotions ?? [];
  const discounts = storeData?.discounts ?? [];
  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      if (activeCategory !== 'All' && item.category !== activeCategory) return false;
      if (vegOnly === true && item.type?.toLowerCase() !== 'veg') return false;
      if (vegOnly === false && item.type?.toLowerCase() !== 'non-veg') return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = item.name?.toLowerCase().includes(q);
        const descMatch = item.description?.toLowerCase().includes(q);
        if (!nameMatch && !descMatch) return false;
      }
      return true;
    });
  }, [menu, activeCategory, vegOnly, searchQuery]);

  const showGrouped = activeCategory === 'All' && !searchQuery;

  const groupedMenu = useMemo(() => {
    if (!showGrouped) return null;
    const map = new Map();
    filteredMenu.forEach(item => {
      const cat = item.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(item);
    });
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }, [filteredMenu, showGrouped]);

  useEffect(() => {
    if (!showGrouped || !groupedMenu?.length) {
      setCurrentCategory('');
      return;
    }

    const handleCategoryScroll = () => {
      const sections = document.querySelectorAll('.menu-section');
      if (!sections.length) return;
      
      let newActive = null;
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        // 160px is a good threshold for occupying the area below the sticky header
        if (rect.top <= 160) {
          newActive = section.dataset.category;
        }
      });
      
      // Fallback to first section if we're at the very top
      if (!newActive && sections.length > 0) {
        newActive = sections[0].dataset.category;
      }
      
      if (newActive) {
        setCurrentCategory(prev => prev !== newActive ? newActive : prev);
      }
    };

    // Run once to set initial state
    handleCategoryScroll();

    window.addEventListener('scroll', handleCategoryScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleCategoryScroll);
  }, [showGrouped, groupedMenu]);

  useEffect(() => {
    const handleScroll = () => {
      if (stickySentinelRef.current) {
        const top = stickySentinelRef.current.getBoundingClientRect().top;
        setIsSticky(top <= 75);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="skeleton-hero"></div>
        <div className="skeleton-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-card">
              <div className="skel-img"></div>
              <div className="skel-text"></div>
              <div className="skel-price"></div>
            </div>
          ))}
        </div>
        <style jsx>{`
          .loading-page { max-width: 480px; margin: 0 auto; padding: var(--space-6); }
          .skeleton-hero { height: 200px; background: var(--color-surface-container); border-radius: var(--radius-xl); margin-bottom: var(--space-6); animation: pulse 1.5s infinite; }
          .skeleton-grid { display: flex; flex-direction: column; gap: var(--space-3); }
          .skeleton-card { display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--color-surface-container); }
          .skel-img { width: 100px; height: 100px; flex-shrink: 0; border-radius: var(--radius-md); background: var(--color-surface-container); animation: pulse 1.5s infinite; }
          .skel-text { height: 14px; width: 60%; background: var(--color-surface-container); border-radius: 4px; animation: pulse 1.5s infinite; margin-bottom: 8px; }
          .skel-price { height: 12px; width: 30%; background: var(--color-surface-container); border-radius: 4px; animation: pulse 1.5s infinite; }
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

  const currency = store.currency || '₹';
  const categories = Array.from(new Set(menu.map(item => item.category))).filter(Boolean);

  const handleAdd = (item) => {
    if (store.open === false || store.open === 'N') {
      showToast('Store is currently closed', 'error');
      return;
    }
    if (item.addons && item.addons.length > 0) {
      setSelectedItem(item);
    } else {
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

      <div className="hero-section">
        <PromotionsCarousel promotions={promotions} />
      </div>

      <CouponList discounts={discounts} />

      <div ref={stickySentinelRef} className="sticky-sentinel" />
      <div className={`sticky-group ${isSticky ? 'is-stuck' : ''}`}>
        <div className="sticky-inner-container">
          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
            vegOnly={vegOnly}
            onVegToggle={(val) => setVegOnly(vegOnly === val ? null : val)}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            onAdd={handleAdd}
            currency={currency}
            menu={menu}
          />

          <div className="category-label-wrapper">
            <div className="category-label">{currentCategory}</div>
          </div>
        </div>
      </div>

      <div className="menu-content">
        {showGrouped && groupedMenu ? (
          groupedMenu.length > 0 ? groupedMenu.map(({ category, items }) => (
            <div key={category} className="menu-section" data-category={category}>
              <div className="section-header">
                <span className="section-line"></span>
                <h3 className="section-title">{category}</h3>
                <span className="section-line"></span>
              </div>
              <div className={`menu-grid ${!isStoreOpen ? 'disabled' : ''}`}>
                {items.map(item => (
                  <MenuCard key={item.id} item={item} currency={currency} onAdd={handleAdd} />
                ))}
              </div>
            </div>
          )) : (
            <div className="no-items"><span>🔍</span><p>No items match your filter.</p></div>
          )
        ) : (
          <div className={`menu-grid ${!isStoreOpen ? 'disabled' : ''}`}>
            {filteredMenu.length > 0 ? (
              filteredMenu.map(item => (
                <MenuCard key={item.id} item={item} currency={currency} onAdd={handleAdd} />
              ))
            ) : (
              <div className="no-items">
                <span>🔍</span>
                <p>No items match your search or filter.</p>
              </div>
            )}
          </div>
        )}
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
        .hero-section {
          padding: var(--space-3) 0 0;
        }
        .menu-content {
          padding: 0 var(--space-6) var(--space-6) var(--space-6);
        }
        .sticky-sentinel {
          height: 10px;
          margin-top: -10px;
          width: 100%;
          pointer-events: none;
        }
        .sticky-group {
          position: sticky;
          top: 72px;
          z-index: 90;
          background: var(--color-surface-lowest);
          border-radius: 0 0 12px 12px;
          margin-bottom: var(--space-2);
          transition: box-shadow 0.3s ease;
        }
        .sticky-group.is-stuck {
          box-shadow: var(--shadow-card);
        }
        .sticky-inner-container {
          position: relative;
          width: 100%;
          border-radius: inherit;
        }
        .category-label-wrapper {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--color-surface-lowest);
          border-bottom: 1px solid var(--color-surface-container);
          border-radius: 0 0 12px 12px;
          opacity: 0;
          pointer-events: none;
          transform: translateY(-100%);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
          z-index: 10;
          box-shadow: var(--shadow-ambient);
          display: flex;
          justify-content: center;
        }
        .sticky-group.is-stuck .category-label-wrapper {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }
        .category-label {
          padding: 8px var(--space-6);
          font-family: var(--font-body);
          font-size: 0.72rem;
          font-weight: 600;
          color: #000000;
          letter-spacing: 0.08em;
          text-align: center;
        }
        .section-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin: 0 0 var(--space-3) 0;
          padding: 0 var(--space-6);
        }
        .section-title {
          font-family: var(--font-body);
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--color-text);
          letter-spacing: 0.05em;
          margin: 0;
          white-space: nowrap;
        }
        .section-line {
          height: 1px;
          background-color: var(--color-surface-dim);
          flex: 1;
          opacity: 0.8;
        }
        .menu-section {
          margin-bottom: var(--space-3);
        }
        .menu-grid {
          display: flex;
          flex-direction: column;
        }
        .disabled {
          opacity: 0.4;
          pointer-events: none;
          filter: grayscale(0.5);
        }
        .no-items {
          text-align: center;
          padding: var(--space-8) 0;
          color: var(--color-text-variant);
        }
        .no-items span { font-size: 2rem; display: block; margin-bottom: var(--space-2); }
      `}</style>
    </div>
  );
}
