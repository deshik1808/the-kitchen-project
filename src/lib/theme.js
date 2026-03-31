export function applyTheme(branding) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  // Always force light-mode surface defaults as inline styles so Chrome's
  // dark-mode forcing cannot override the CSS stylesheet values.
  const bg = branding?.backgroundColor || '#f7f5ff';
  const surf = branding?.surfaceColor || '#e4e7ff';
  root.style.setProperty('--color-bg', bg);
  root.style.setProperty('--color-surface', surf);
  root.style.setProperty('--color-surface-lowest', '#ffffff');
  root.style.setProperty('--color-surface-container', surf);
  root.style.setProperty('--color-surface-container-high', `color-mix(in srgb, ${surf}, #000 8%)`);
  root.style.setProperty('--color-surface-container-low', `color-mix(in srgb, ${surf}, #fff 30%)`);
  root.style.setProperty('--color-surface-dim', `color-mix(in srgb, ${surf}, #000 15%)`);

  if (!branding) return;

  if (branding.primaryColor) {
    root.style.setProperty('--color-primary', branding.primaryColor);
    root.style.setProperty('--color-primary-hover', `color-mix(in srgb, ${branding.primaryColor}, black 15%)`);
    root.style.setProperty('--color-primary-light', `color-mix(in srgb, ${branding.primaryColor}, transparent 90%)`);
    
    // Improved derived colors for gradients and containers
    root.style.setProperty('--color-primary-dim', `color-mix(in srgb, ${branding.primaryColor}, black 35%)`);
    root.style.setProperty('--color-primary-container', `color-mix(in srgb, ${branding.primaryColor}, white 20%)`);
  }
  
  if (branding.accentColor) root.style.setProperty('--color-accent', branding.accentColor);
  if (branding.textColor) {
    root.style.setProperty('--color-text', branding.textColor);
    root.style.setProperty('--color-text-variant', `color-mix(in srgb, ${branding.textColor}, transparent 40%)`);
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
