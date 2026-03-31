"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { fetchMenu } from './api';
import { applyTheme } from './theme';

const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info', visible: false });

  const showToast = (message, type = 'info') => {
    setToast({ message, type, visible: true });
    // Reset toast after a delay (matching component duration)
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3100);
  };

  useEffect(() => {
    // Apply CSS defaults as inline styles immediately on mount so Chrome's
    // dark-mode forcing cannot override the stylesheet :root values.
    applyTheme(null);

    async function initStore() {
      // 1. Immediate Load from Cache (for speed)
      let cachedData = null;
      try {
        const cached = sessionStorage.getItem('storeData');
        const cacheTime = sessionStorage.getItem('storeDataTime');
        const now = Date.now();

        if (cached && cacheTime && (now - parseInt(cacheTime) < 300000)) { // 5 min TTL
          cachedData = JSON.parse(cached);
          const faviconUrl = cachedData.branding?.faviconUrl || cachedData.store?.faviconUrl;

          setStoreData(cachedData);
          applyTheme(cachedData.branding);
          if (cachedData.store?.name) document.title = cachedData.store.name;
          if (faviconUrl) updateFavicon(faviconUrl);
          setLoading(false);
        }
      } catch (e) {}

      // 2. Always Fetch Fresh Data (to ensure Sheets edits reflect)
      const freshData = await fetchMenu();
      if (freshData) {
        setStoreData(freshData);
        sessionStorage.setItem('storeData', JSON.stringify(freshData));
        sessionStorage.setItem('storeDataTime', Date.now().toString());
        localStorage.setItem('storeData', JSON.stringify(freshData));

        const faviconUrl = freshData.branding?.faviconUrl || freshData.store?.faviconUrl;

        applyTheme(freshData.branding);
        if (freshData.store?.name) document.title = freshData.store.name;
        
        if (faviconUrl) {
          updateFavicon(faviconUrl);
        }

        setLoading(false);
      } else if (!cachedData) {
        setError('Failed to load menu data.');
        setLoading(false);
      }
    }

    initStore();

    function updateFavicon(url) {
      if (!url) return;
      try {
        const ids = ['favicon-main', 'favicon-shortcut', 'favicon-apple'];
        ids.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.href = url;
        });
        
        // Also update any other icons
        document.querySelectorAll("link[rel*='icon']").forEach(el => {
          el.href = url;
        });
      } catch (e) {}
    }

    // REAL-TIME SYNC: Silently refetch when user returns to tab
    const silentRefetch = async () => {
      if (document.visibilityState === 'visible') {
        const freshData = await fetchMenu();
        if (freshData) {
          setStoreData(freshData);
          sessionStorage.setItem('storeData', JSON.stringify(freshData));
          sessionStorage.setItem('storeDataTime', Date.now().toString());
          localStorage.setItem('storeData', JSON.stringify(freshData)); // fallback for inline head script
          if (freshData.branding) applyTheme(freshData.branding);
          const faviconUrl = freshData.branding?.faviconUrl || freshData.store?.faviconUrl;
          if (faviconUrl) {
            updateFavicon(faviconUrl);
          }
        }
      }
    };

    window.addEventListener('visibilitychange', silentRefetch);
    window.addEventListener('focus', silentRefetch);

    return () => {
      window.removeEventListener('visibilitychange', silentRefetch);
      window.removeEventListener('focus', silentRefetch);
    };
  }, []);

  return (
    <StoreContext.Provider value={{ storeData, loading, error, toast, showToast }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
