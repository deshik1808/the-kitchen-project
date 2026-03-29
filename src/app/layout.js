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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const cached = sessionStorage.getItem('storeData');
                  if (cached) {
                    const data = JSON.parse(cached);
                    if (data.store) {
                      if (data.store.name) document.title = data.store.name;
                      if (data.store.faviconUrl) {
                        const head = document.getElementsByTagName('head')[0];
                        const existing = document.querySelectorAll("link[rel*='icon']");
                        existing.forEach(el => el.parentNode.removeChild(el));
                        
                        const link = document.createElement('link');
                        link.rel = 'shortcut icon';
                        link.href = data.store.faviconUrl;
                        head.appendChild(link);
                        
                        const link2 = document.createElement('link');
                        link2.rel = 'icon';
                        link2.href = data.store.faviconUrl;
                        head.appendChild(link2);
                      }
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
