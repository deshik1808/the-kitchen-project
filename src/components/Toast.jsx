"use client";

import { useEffect, useState } from 'react';

/**
 * Custom Toast Component
 * types: success, error, info
 */
export default function Toast({ message, type = 'info', duration = 3000, onVisibleChange }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onVisibleChange) onVisibleChange(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onVisibleChange]);

  if (!visible || !message) return null;

  return (
    <div className={`toast-container ${type}`}>
      <div className="toast-content">
        <span className="toast-icon">
          {type === 'success' && '✅'}
          {type === 'error' && '❌'}
          {type === 'info' && '💡'}
        </span>
        <span className="toast-message">{message}</span>
      </div>
      <style jsx>{`
        .toast-container {
          position: fixed;
          bottom: var(--space-8);
          left: 50%;
          transform: translateX(-50%);
          z-index: 10000;
          animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          pointer-events: none;
        }
        .toast-content {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: var(--color-text);
          color: white;
          border-radius: var(--radius-full);
          box-shadow: var(--shadow-glass);
          font-family: var(--font-body);
          font-size: 0.9rem;
          font-weight: 500;
        }
        .success .toast-content { background: var(--color-secondary); }
        .error .toast-content { background: var(--color-error); }
        
        @keyframes slideUp {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
