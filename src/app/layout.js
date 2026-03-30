import "../styles/globals.css";
import ClientLayout from "./ClientLayout";

export const metadata = {
  title: "Your Kitchen — Fresh Food Ordering",
  description: "Order fresh, delicious food directly from our kitchen. Browse our menu, customize your order, and get it delivered.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  const defaultFavicon = "https://res.cloudinary.com/dgv3ycgxb/image/upload/v1774665125/Biryani_Logo_HD_page-0004_lrs3mp.jpg";

  return (
    <html lang="en">
      <head>
        <link id="favicon-main" rel="icon" href={defaultFavicon} />
        <link id="favicon-shortcut" rel="shortcut icon" href={defaultFavicon} />
        <link id="favicon-apple" rel="apple-touch-icon" href={defaultFavicon} />
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
                      const ids = ['favicon-main', 'favicon-shortcut', 'favicon-apple'];
                      ids.forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.href = faviconUrl;
                      });
                      // Also update any other icons just in case
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
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
