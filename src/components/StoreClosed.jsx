export default function StoreClosed({ message }) {
  return (
    <div className="closed-banner">
      <div className="closed-content">
        <span className="closed-icon">😴</span>
        <div>
          <h2>We're currently closed</h2>
          <p>{message || 'Please check back later for fresh orders.'}</p>
        </div>
      </div>
      <style jsx>{`
        .closed-banner {
          margin: var(--space-3) var(--space-6);
          padding: var(--space-4);
          background: var(--color-surface-lowest);
          border-radius: var(--radius-lg);
          border-left: 4px solid var(--color-warning);
          box-shadow: var(--shadow-ambient);
        }
        .closed-content {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .closed-icon { font-size: 2rem; }
        h2 { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--color-warning); margin-bottom: 2px; }
        p { font-size: 0.85rem; color: var(--color-text-variant); margin: 0; }
      `}</style>
    </div>
  );
}
