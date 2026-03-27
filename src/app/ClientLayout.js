"use client";

import { StoreProvider } from '../lib/StoreContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ToastManager from '../components/ToastManager';

export default function ClientLayout({ children }) {
  return (
    <StoreProvider>
      <div className="app-wrapper">
        <Header />
        <main className="main-content">
          {children}
        </main>
        <Footer />
        <ToastManager />
      </div>
      <style jsx>{`
        .app-wrapper {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .main-content {
          flex: 1;
          position: relative;
          padding-bottom: var(--space-2xl);
        }
      `}</style>
    </StoreProvider>
  );
}
