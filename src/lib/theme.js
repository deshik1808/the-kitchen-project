export function applyTheme(branding) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  // Always force light-mode surface defaults as inline styles so Chrome's
  // dark-mode forcing cannot override the CSS stylesheet values.
  const rawBg = branding?.backgroundColor || '#f7f5ff';
  const rawSurf = branding?.surfaceColor || '#e4e7ff';
  const rawPrimaryForTint = branding?.primaryColor || '#555555';

  // Apply a very subtle, premium tint of the primary color to the neutral surfaces
  const bg = `color-mix(in srgb, ${rawBg}, ${rawPrimaryForTint} 2%)`;
  const surf = `color-mix(in srgb, ${rawSurf}, ${rawPrimaryForTint} 4%)`;

  root.style.setProperty('--color-bg', bg);
  root.style.setProperty('--color-surface', surf);
  root.style.setProperty('--color-surface-lowest', `color-mix(in srgb, #ffffff, ${rawPrimaryForTint} 0.5%)`);
  root.style.setProperty('--color-surface-container', surf);
  root.style.setProperty('--color-surface-container-high', `color-mix(in srgb, ${surf}, #000 6%)`);
  root.style.setProperty('--color-surface-container-low', `color-mix(in srgb, ${surf}, #fff 40%)`);
  root.style.setProperty('--color-surface-dim', `color-mix(in srgb, ${surf}, #000 10%)`);

  if (!branding) return;

  if (branding.primaryColor) {
    // Mute and desaturate the raw color for a premium, decent look
    const rawPrimary = branding.primaryColor;
    // Mix with a neutral premium gray to lower saturation and soften the tone
    const premiumPrimary = `color-mix(in srgb, ${rawPrimary}, #787b86 35%)`;

    root.style.setProperty('--color-primary', premiumPrimary);
    root.style.setProperty('--color-primary-hover', `color-mix(in srgb, ${premiumPrimary}, black 10%)`);
    root.style.setProperty('--color-primary-light', `color-mix(in srgb, ${rawPrimary}, transparent 92%)`);
    
    // Improved derived colors for gradients and containers
    root.style.setProperty('--color-primary-dim', `color-mix(in srgb, ${premiumPrimary}, black 20%)`);
    root.style.setProperty('--color-primary-container', `color-mix(in srgb, ${premiumPrimary}, white 20%)`);
  }
  
  if (branding.accentColor) {
    const premiumAccent = `color-mix(in srgb, ${branding.accentColor}, #787b86 30%)`;
    root.style.setProperty('--color-accent', premiumAccent);
  }
  
  if (branding.textColor) {
    // Soften stark dark text colors for less eye strain
    const premiumText = `color-mix(in srgb, ${branding.textColor}, #5c6275 15%)`;
    root.style.setProperty('--color-text', premiumText);
    root.style.setProperty('--color-text-variant', `color-mix(in srgb, ${premiumText}, transparent 45%)`);
  }

  if (branding.font) {
    let link = document.getElementById('theme-font');
    if (!link) {
      link = document.createElement('link');
      link.id = 'theme-font';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${branding.font.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`;
    root.style.setProperty('--font-family', `"${branding.font}", sans-serif`);
    root.style.setProperty('--font-display', `"${branding.font}", sans-serif`);
  }

  const faviconUrl = branding.faviconUrl?.trim();
  document.querySelectorAll("link[rel*='icon']").forEach(el => {
    el.href = faviconUrl || '/favicon.ico';
  });
}
