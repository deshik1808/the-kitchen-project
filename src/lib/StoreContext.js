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
      let data = null;
      try {
        const cached = sessionStorage.getItem('storeData');
        if (cached) {
          data = JSON.parse(cached);
        }
      } catch (e) {}

      if (!data) {
        data = await fetchMenu();
        if (data) {
          sessionStorage.setItem('storeData', JSON.stringify(data));
        } else {
          setError('Failed to load menu data.');
        }
      }

      if (data) {
        setStoreData(data);
        if (data.branding) applyTheme(data.branding);
        if (data.store?.name) document.title = data.store.name;
      }
      setLoading(false);
    }

    initStore();

    // REAL-TIME SYNC (Option 3A): Silently refetch when user returns to tab
    const silentRefetch = async () => {
      if (document.visibilityState === 'visible') {
        const freshData = await fetchMenu();
        if (freshData) {
          setStoreData(freshData);
          sessionStorage.setItem('storeData', JSON.stringify(freshData));
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
