import "../styles/globals.css";
import ClientLayout from "./ClientLayout";

export const metadata = {
  title: "Your Kitchen — Fresh Food Ordering",
  description: "Order fresh, delicious food directly from our kitchen. Browse our menu, customize your order, and get it delivered.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
