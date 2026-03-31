"use client";

import { useState, useEffect, useRef } from 'react';

export default function PromotionsCarousel({ promotions = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef(null);

  const slides = promotions.filter(p =>
    (p.Active === 'Y' || p.active === 'Y') && p['Image URL']
  );

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (slides.length > 1) {
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % slides.length);
      }, 5000);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [currentIndex, slides.length]);

  if (slides.length === 0) return null;

  const prev = () => setCurrentIndex(i => (i === 0 ? slides.length - 1 : i - 1));
  const next = () => setCurrentIndex(i => (i + 1) % slides.length);

  return (
    <div className="carousel">
      <div className="track" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {slides.map((promo, i) => (
          <div key={promo.ID || i} className="slide">
            <img src={promo['Image URL']} alt={promo.Title || ''} className="slide-img" />
            <div className="slide-overlay">
              {promo.Title && <h2 className="slide-title">{promo.Title}</h2>}
              {promo.Description && <p className="slide-desc">{promo.Description}</p>}
              {promo.Link && (
                <a href={promo.Link} target="_blank" rel="noopener noreferrer" className="slide-cta">
                  Learn More
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button className="nav-btn nav-prev" onClick={prev} aria-label="Previous">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button className="nav-btn nav-next" onClick={next} aria-label="Next">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <div className="dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      <style jsx>{`
        .carousel {
          position: relative;
          width: 100%;
          height: 200px;
          overflow: hidden;
          border-radius: var(--radius-xl);
          background: var(--color-surface-container);
        }
        .track {
          display: flex;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .slide {
          flex-shrink: 0;
          width: 100%;
          height: 100%;
          position: relative;
        }
        .slide-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .slide-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 60%, transparent 100%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: var(--space-5) var(--space-5) var(--space-4);
        }
        .slide-title {
          color: #fff;
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 800;
          margin-bottom: 4px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
        }
        .slide-desc {
          color: rgba(255,255,255,0.85);
          font-size: 0.8rem;
          font-family: var(--font-body);
          margin-bottom: var(--space-2);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .slide-cta {
          display: inline-block;
          background: #fff;
          color: var(--color-text);
          font-family: var(--font-body);
          font-size: 0.8rem;
          font-weight: 700;
          padding: 6px 18px;
          border-radius: var(--radius-full);
          text-decoration: none;
          width: fit-content;
        }
        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(8px);
          border: none;
          border-radius: var(--radius-full);
          color: #fff;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }
        .nav-btn:hover { background: rgba(255,255,255,0.35); }
        .nav-prev { left: var(--space-3); }
        .nav-next { right: var(--space-3); }
        .dots {
          position: absolute;
          bottom: var(--space-2);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: var(--radius-full);
          background: rgba(255,255,255,0.4);
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          padding: 0;
        }
        .dot.active {
          background: #fff;
          width: 18px;
        }
      `}</style>
    </div>
  );
}
