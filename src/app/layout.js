import "../styles/globals.css";
import ClientLayout from "./ClientLayout";

export const metadata = {
  title: "Your Kitchen — Fresh Food Ordering",
  description: "Order fresh, delicious food directly from our kitchen. Browse our menu, customize your order, and get it delivered.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="color-scheme" content="light" />
        <link id="favicon-main" rel="icon" href="/favicon.ico" />
        <link id="favicon-shortcut" rel="shortcut icon" href="/favicon.ico" />
        <link id="favicon-apple" rel="apple-touch-icon" href="/favicon.ico" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('touchmove', function(e) {
                if (e.touches.length > 1) e.preventDefault();
              }, { passive: false });
              document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
              document.addEventListener('gesturechange', function(e) { e.preventDefault(); });
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const raw = sessionStorage.getItem('storeData') || localStorage.getItem('storeData');
                  if (raw) {
                    const data = JSON.parse(raw);
                    const faviconUrl = data.branding?.faviconUrl || data.store?.faviconUrl;
                    const storeName = data.store?.name;
                    if (storeName) document.title = storeName;
                    if (faviconUrl) {
                      document.querySelectorAll("link[rel*='icon']").forEach(el => {
                        el.href = faviconUrl;
                      });
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
