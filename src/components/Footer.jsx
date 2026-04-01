"use client";

import { useState } from 'react';
import { useStore } from '../lib/StoreContext';

function PolicyModal({ title, content, onClose }) {
  return (
    <div className="policy-backdrop" onClick={onClose}>
      <div className="policy-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="policy-header">
          <h3 className="policy-title">{title}</h3>
          <button className="policy-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="policy-body">
          {content.split('\n').map((line, i) => (
            line.trim() ? <p key={i}>{line}</p> : <br key={i} />
          ))}
        </div>
      </div>
      <style>{`
        .policy-backdrop {
          position: fixed;
          inset: 72px 0 0 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 0;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .policy-modal {
          background: var(--color-surface-lowest);
          border-radius: 0;
          width: 100%;
          max-width: 480px;
          height: calc(100vh - 72px);
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .policy-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--color-surface-container);
          flex-shrink: 0;
        }
        .policy-title {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
          margin: 0;
        }
        .policy-close {
          background: var(--color-surface-container);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--color-text);
          flex-shrink: 0;
        }
        .policy-body {
          overflow-y: auto;
          padding: 20px;
          font-size: 0.875rem;
          line-height: 1.7;
          color: var(--color-text-variant);
        }
        .policy-body p { margin: 0 0 0.75em; }
      `}</style>
    </div>
  );
}

export default function Footer() {
  const { storeData, loading } = useStore();
  const [activeModal, setActiveModal] = useState(null); // 'about' | 'terms' | 'privacy'

  if (loading) return null;

  const branding = storeData?.branding || {};
  const store = storeData?.store || {};

  const pages = [
    { key: 'about', label: 'About Us', content: branding.aboutUs },
    { key: 'terms', label: 'Terms & Conditions', content: branding.termsConditions },
    { key: 'privacy', label: 'Privacy Policy', content: branding.privacyPolicy },
  ].filter(p => p.content?.trim());

  const active = pages.find(p => p.key === activeModal);

  return (
    <>
      <footer className="site-footer">
        <div className="footer-inner">
          {pages.length > 0 && (
            <div className="policy-links">
              {pages.map((p, i) => (
                <span key={p.key}>
                  {i > 0 && <span className="sep">·</span>}
                  <button className="policy-btn" onClick={() => setActiveModal(p.key)}>{p.label}</button>
                </span>
              ))}
            </div>
          )}
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
          .copyright { font-family: var(--font-display); font-weight: 400; font-size: 0.9rem; margin-bottom: var(--space-3); }
          .social { display: flex; justify-content: center; gap: var(--space-5); margin-bottom: var(--space-3); }
          .social a { font-size: 0.85rem; font-weight: 600; color: var(--color-primary); }
          .policy-links { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 4px; }
          .sep { color: var(--color-text-variant); font-size: 0.75rem; margin: 0 2px; }
          .policy-btn {
            background: none;
            border: none;
            padding: 0;
            font-size: 0.78rem;
            color: var(--color-text-variant);
            cursor: pointer;
            text-decoration: underline;
            text-underline-offset: 2px;
          }
          .policy-btn:hover { color: var(--color-primary); }
        `}</style>
      </footer>

      {active && (
        <PolicyModal
          title={active.label}
          content={active.content}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  );
}
