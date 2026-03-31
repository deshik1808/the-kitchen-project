"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

export default function PromotionsCarousel({ promotions = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const stripRef = useRef(null);
  const cardRefs = useRef([]);
  const autoScrollRef = useRef(null);
  const isPausedRef = useRef(false);

  const slides = promotions.filter(p => p.imageUrl);

  // IntersectionObserver: update active dot as user swipes
  useEffect(() => {
    if (slides.length <= 1) return;
    const observers = [];
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveIndex(i); },
        { root: stripRef.current, threshold: 0.6 }
      );
      obs.observe(card);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [slides.length]);

  // Auto-scroll every 4s, paused on touch
  const scrollToIndex = useCallback((index) => {
    const card = cardRefs.current[index];
    if (card && stripRef.current) {
      stripRef.current.scrollTo({ left: card.offsetLeft - 16, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    autoScrollRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        setActiveIndex(prev => {
          const next = (prev + 1) % slides.length;
          scrollToIndex(next);
          return next;
        });
      }
    }, 4000);
    return () => clearInterval(autoScrollRef.current);
  }, [slides.length, scrollToIndex]);

  const handleTouchStart = () => { isPausedRef.current = true; };
  const handleTouchEnd = () => {
    setTimeout(() => { isPausedRef.current = false; }, 3000);
  };

  if (slides.length === 0) return null;

  return (
    <div className="promo-wrap">
      <div
        className="strip"
        ref={stripRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((promo, i) => (
          <div
            key={promo.id || i}
            className="card"
            ref={el => cardRefs.current[i] = el}
          >
            {promo.link ? (
              <a href={promo.link} target="_blank" rel="noopener noreferrer" className="card-anchor">
                <img src={promo.imageUrl} alt={promo.title || 'Promotion'} className="card-img" />
              </a>
            ) : (
              <img src={promo.imageUrl} alt={promo.title || 'Promotion'} className="card-img" />
            )}
            {(promo.title || promo.description) && (
              <div className="overlay">
                {promo.title && <h2 className="overlay-title">{promo.title}</h2>}
                {promo.description && <p className="overlay-desc">{promo.description}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === activeIndex ? 'active' : ''}`}
              onClick={() => { scrollToIndex(i); setActiveIndex(i); }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .promo-wrap {
          width: 100%;
        }
        .strip {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .strip::-webkit-scrollbar { display: none; }
        .card {
          flex-shrink: 0;
          width: calc(100% - 32px);
          margin: 0 16px;
          scroll-snap-align: center;
          border-radius: var(--radius-xl);
          overflow: hidden;
          position: relative;
          box-shadow: var(--shadow-card);
        }
        .card-anchor {
          display: block;
          width: 100%;
        }
        .card-img {
          width: 100%;
          aspect-ratio: 16 / 7;
          object-fit: cover;
          display: block;
        }
        .overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.08) 55%, transparent 100%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 12px 14px 10px;
          pointer-events: none;
        }
        .overlay-title {
          color: #fff;
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 800;
          margin: 0 0 3px;
          text-shadow: 0 1px 6px rgba(0,0,0,0.5);
          line-height: 1.2;
        }
        .overlay-desc {
          color: rgba(255,255,255,0.88);
          font-size: 0.72rem;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .dots {
          display: flex;
          justify-content: center;
          gap: 5px;
          padding-top: 8px;
        }
        .dot {
          width: 5px;
          height: 5px;
          border-radius: var(--radius-full);
          background: var(--color-surface-dim);
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          padding: 0;
        }
        .dot.active {
          background: var(--color-primary);
          width: 16px;
        }
      `}</style>
    </div>
  );
}
