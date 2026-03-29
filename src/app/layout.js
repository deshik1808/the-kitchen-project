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
        <link rel="icon" href={defaultFavicon} />
        <link rel="shortcut icon" href={defaultFavicon} />
        <link rel="apple-touch-icon" href={defaultFavicon} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Try sessionStorage first, then localStorage as fallback
                  const raw = sessionStorage.getItem('storeData') || localStorage.getItem('storeData');
                  if (raw) {
                    const data = JSON.parse(raw);
                    if (data.store) {
                      if (data.store.name) document.title = data.store.name;
                      if (data.store.faviconUrl) {
                        const url = data.store.faviconUrl;
                        const links = document.querySelectorAll("link[rel*='icon']");
                        // Update in-place — never remove to avoid flash of no favicon
                        links.forEach(link => { link.href = url; });
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
