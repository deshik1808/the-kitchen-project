export function applyTheme(branding) {
  if (!branding || typeof window === 'undefined') return;

  const root = document.documentElement;

  if (branding.primaryColor) {
    root.style.setProperty('--color-primary', branding.primaryColor);
    root.style.setProperty('--color-primary-hover', `color-mix(in srgb, ${branding.primaryColor}, black 15%)`);
    root.style.setProperty('--color-primary-light', `color-mix(in srgb, ${branding.primaryColor}, transparent 90%)`);
  }
  
  if (branding.accentColor) root.style.setProperty('--color-accent', branding.accentColor);
  if (branding.backgroundColor) root.style.setProperty('--color-bg', branding.backgroundColor);
  if (branding.surfaceColor) root.style.setProperty('--color-surface', branding.surfaceColor);
  if (branding.textColor) root.style.setProperty('--color-text', branding.textColor);

  if (branding.font) {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${branding.font.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    root.style.setProperty('--font-family', `"${branding.font}", sans-serif`);
  }

  if (branding.faviconUrl) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = branding.faviconUrl;
  }
}
