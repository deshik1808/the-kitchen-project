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
        setLoading(false);
      } else if (!cachedData) {
        setError('Failed to load menu data.');
        setLoading(false);
      }
    }

    initStore();

    // REAL-TIME SYNC: Silently refetch when user returns to tab
    const silentRefetch = async () => {
      if (document.visibilityState === 'visible') {
        const freshData = await fetchMenu();
        if (freshData) {
          setStoreData(freshData);
          sessionStorage.setItem('storeData', JSON.stringify(freshData));
          sessionStorage.setItem('storeDataTime', Date.now().toString());
          if (freshData.branding) applyTheme(freshData.branding);
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
