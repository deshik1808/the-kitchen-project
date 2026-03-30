export function applyTheme(branding) {
  if (!branding || typeof window === 'undefined') return;

  const root = document.documentElement;

  if (branding.primaryColor) {
    root.style.setProperty('--color-primary', branding.primaryColor);
    root.style.setProperty('--color-primary-hover', `color-mix(in srgb, ${branding.primaryColor}, black 15%)`);
    root.style.setProperty('--color-primary-light', `color-mix(in srgb, ${branding.primaryColor}, transparent 90%)`);
    
    // Improved derived colors for gradients and containers
    root.style.setProperty('--color-primary-dim', `color-mix(in srgb, ${branding.primaryColor}, black 35%)`);
    root.style.setProperty('--color-primary-container', `color-mix(in srgb, ${branding.primaryColor}, white 20%)`);
  }
  
  if (branding.accentColor) root.style.setProperty('--color-accent', branding.accentColor);
  if (branding.backgroundColor) root.style.setProperty('--color-bg', branding.backgroundColor);
  if (branding.surfaceColor) root.style.setProperty('--color-surface', branding.surfaceColor);
  if (branding.textColor) root.style.setProperty('--color-text', branding.textColor);

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

  if (branding.faviconUrl) {
    const ids = ['favicon-main', 'favicon-shortcut', 'favicon-apple'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.href = branding.faviconUrl;
    });
    
    // Also update any other link tags that mention icon in their rel
    const allIcons = document.querySelectorAll("link[rel*='icon']");
    allIcons.forEach(link => {
      link.href = branding.faviconUrl;
    });
  }
}
