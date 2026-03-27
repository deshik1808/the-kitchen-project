"use client";

import { useStore } from '../lib/StoreContext';

export default function Footer() {
  const { storeData, loading } = useStore();
  if (loading) return null;

  const branding = storeData?.branding || {};
  const store = storeData?.store || {};

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {store.address && <p className="address">{store.address}</p>}
        <p className="copyright">{branding.footerText || `© ${new Date().getFullYear()} ${store.name || 'Your Kitchen'}`}</p>
        {(branding.instagramUrl || branding.googleMapsUrl) && (
          <div className="social">
            {branding.instagramUrl && <a href={branding.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>}
            {branding.googleMapsUrl && <a href={branding.googleMapsUrl} target="_blank" rel="noreferrer">📍 Locate Us</a>}
          </div>
        )}
      </div>
      <style jsx>{`
        .site-footer {
          background: var(--color-surface-container-low);
          padding: var(--space-6) var(--space-6);
          text-align: center;
          margin-top: auto;
        }
        .footer-inner { max-width: 480px; margin: 0 auto; }
        .address { font-size: 0.85rem; color: var(--color-text-variant); margin-bottom: var(--space-2); }
        .copyright { font-family: var(--font-display); font-weight: 600; font-size: 0.9rem; margin-bottom: var(--space-3); }
        .social { display: flex; justify-content: center; gap: var(--space-5); }
        .social a { font-size: 0.85rem; font-weight: 600; color: var(--color-primary); }
      `}</style>
    </footer>
  );
}
