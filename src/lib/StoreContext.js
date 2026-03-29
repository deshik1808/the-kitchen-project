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
    async function initStore() {
      // 1. Immediate Load from Cache (for speed)
      let cachedData = null;
      try {
        const cached = sessionStorage.getItem('storeData');
        const cacheTime = sessionStorage.getItem('storeDataTime');
        const now = Date.now();
        
        if (cached && cacheTime && (now - parseInt(cacheTime) < 300000)) { // 5 min TTL
          cachedData = JSON.parse(cached);
          setStoreData(cachedData);
          if (cachedData.branding) applyTheme(cachedData.branding);
          if (cachedData.store?.name) document.title = cachedData.store.name;
          if (cachedData.store?.faviconUrl) updateFavicon(cachedData.store.faviconUrl);
          setLoading(false);
        }
      } catch (e) {}

      // 2. Always Fetch Fresh Data (to ensure Sheets edits reflect)
      const freshData = await fetchMenu();
      if (freshData) {
        setStoreData(freshData);
        sessionStorage.setItem('storeData', JSON.stringify(freshData));
        sessionStorage.setItem('storeDataTime', Date.now().toString());
        if (freshData.branding) applyTheme(freshData.branding);
        if (freshData.store?.name) document.title = freshData.store.name;
        
        // DYNAMIC FAVICON UPDATE
        if (freshData.store?.faviconUrl) {
          updateFavicon(freshData.store.faviconUrl);
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
        const head = document.getElementsByTagName('head')[0];
        
        // Remove ANY existing icons to prevent browser confusion
        const existingIcons = document.querySelectorAll("link[rel*='icon']");
        existingIcons.forEach(el => el.parentNode.removeChild(el));

        // Create new clean icons
        const link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = url;
        head.appendChild(link);

        const link2 = document.createElement('link');
        link2.rel = 'icon';
        link2.type = 'image/png'; // generic
        link2.href = url;
        head.appendChild(link2);

        const apple = document.createElement('link');
        apple.rel = 'apple-touch-icon';
        apple.href = url;
        head.appendChild(apple);
      } catch (e) {
        console.error('Failed to update favicon:', e);
      }
    }

    // REAL-TIME SYNC: Silently refetch when user returns to tab
    const silentRefetch = async () => {
      if (document.visibilityState === 'visible') {
        const freshData = await fetchMenu();
        if (freshData) {
          setStoreData(freshData);
          sessionStorage.setItem('storeData', JSON.stringify(freshData));
          sessionStorage.setItem('storeDataTime', Date.now().toString());
          if (freshData.branding) applyTheme(freshData.branding);
          if (freshData.store?.faviconUrl) {
            updateFavicon(freshData.store.faviconUrl);
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
