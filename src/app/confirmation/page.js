"use client";

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useStore } from '../../lib/StoreContext';
import Link from 'next/link';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('oid');
  const wa = searchParams.get('wa');
  const rzp = searchParams.get('rzp');
  const upi = searchParams.get('upi');
  const { storeData } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  if (!orderId) {
    return (
      <div className="page-center">
        <h2>Invalid Order</h2>
        <Link href="/">Return to Menu</Link>
        <style jsx>{`.page-center { max-width: 480px; margin: 0 auto; padding: 3rem 2rem; text-align: center; }`}</style>
      </div>
    );
  }

  const store = storeData?.store || {};

  return (
    <div className="confirm-page">
      <div className="success-hero">
        <div className="check-circle">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1>Order Placed!</h1>
        <p className="order-id">#{orderId}</p>
      </div>

      <div className="actions">
        {rzp && (
          <a href={rzp} className="action-card pay-card" target="_blank" rel="noreferrer">
            <div className="action-icon">💳</div>
            <div>
              <h3>Complete Payment</h3>
              <p>Pay securely via Razorpay</p>
            </div>
            <span className="action-arrow">→</span>
          </a>
        )}

        {(!rzp && upi) && (
          <div className="action-card qr-card">
            <h3>Pay via UPI</h3>
            <img src={upi} alt="UPI QR Code" className="qr-img" />
            <p className="qr-note">Scan with any UPI app to pay</p>
          </div>
        )}

        {wa && (
          <a href={wa} className="action-card whatsapp-card" target="_blank" rel="noreferrer">
            <div className="action-icon wa-icon">💬</div>
            <div>
              <h3>Confirm on WhatsApp</h3>
              <p>Send order details to the kitchen</p>
            </div>
            <span className="action-arrow">→</span>
          </a>
        )}
      </div>

      <div className="footer-note">
        <p>Thank you for choosing <strong>{store.name || 'us'}</strong>!</p>
        <Link href="/" className="back-link">← Back to Menu</Link>
      </div>

      <style jsx>{`
        .confirm-page { max-width: 480px; margin: 0 auto; padding: var(--space-6); text-align: center; }
        
        .success-hero { margin-bottom: var(--space-6); }
        .check-circle {
          width: 72px; height: 72px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--color-primary-dim), var(--color-primary));
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto var(--space-4);
          box-shadow: 0 8px 24px rgba(255, 82, 0, 0.3);
          animation: pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        h1 { font-family: var(--font-display); font-size: 1.6rem; margin-bottom: var(--space-1); }
        .order-id { font-family: var(--font-body); color: var(--color-text-variant); font-weight: 500; }
        
        .actions { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-6); }
        .action-card {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4) var(--space-3);
          background: var(--color-surface-lowest);
          border-radius: var(--radius-lg);
          text-align: left;
          text-decoration: none;
          color: var(--color-text);
          box-shadow: var(--shadow-ambient);
          transition: transform 0.15s;
        }
        .action-card:hover { transform: translateY(-2px); }
        .action-icon { font-size: 1.8rem; flex-shrink: 0; }
        .action-card h3 { font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin-bottom: 2px; }
        .action-card p { font-size: 0.8rem; color: var(--color-text-variant); margin: 0; }
        .action-arrow { margin-left: auto; font-size: 1.2rem; color: var(--color-primary); font-weight: 700; }
        
        .whatsapp-card { border-left: 4px solid #25D366; }
        .pay-card { border-left: 4px solid #3b82f6; }
        
        .qr-card { flex-direction: column; text-align: center; }
        .qr-img { max-width: 180px; border-radius: var(--radius-md); margin: var(--space-3) 0; }
        .qr-note { font-size: 0.8rem; opacity: 0.7; }
        
        .footer-note { margin-top: var(--space-3); }
        .footer-note p { font-size: 1rem; margin-bottom: var(--space-3); }
        .back-link { color: var(--color-primary); font-weight: 600; }
        
        @keyframes pop { 0% { transform: scale(0.3); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
