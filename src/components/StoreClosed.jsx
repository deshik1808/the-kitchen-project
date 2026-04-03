export default function StoreClosed({ message }) {
  return (
    <div className="closed-banner">
      <div className="closed-glow" />
      <div className="closed-content">
        <div className="closed-icon-wrap">
          <span className="closed-icon">🌙</span>
        </div>
        <div className="closed-text">
          <h2 className="closed-title">We're closed right now</h2>
          <p className="closed-msg">{message || 'Back soon with fresh food — check back later!'}</p>
        </div>
      </div>
      <style jsx>{`
        .closed-banner {
          position: relative;
          overflow: hidden;
          margin: var(--space-3) var(--space-4);
          padding: var(--space-4) var(--space-4);
          background: var(--color-surface-lowest);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-card);
          border: 1.5px solid var(--color-primary-light);
        }
        .closed-glow {
          position: absolute;
          top: -40px;
          left: -40px;
          width: 140px;
          height: 140px;
          background: var(--color-primary-light);
          border-radius: 50%;
          filter: blur(40px);
          pointer-events: none;
        }
        .closed-content {
          position: relative;
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .closed-icon-wrap {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-primary-light);
          border-radius: var(--radius-lg);
        }
        .closed-icon {
          font-size: 1.5rem;
          line-height: 1;
        }
        .closed-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .closed-title {
          font-family: var(--font-display);
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-primary);
          margin: 0;
          letter-spacing: -0.01em;
        }
        .closed-msg {
          font-size: 0.82rem;
          color: var(--color-text-variant);
          margin: 0;
          line-height: 1.45;
        }
      `}</style>
    </div>
  );
}
