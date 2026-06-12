import "./globals.css";

export const metadata = {
  title: "Smart Queue System | ລະບົບເອີ້ນຄິວອັດສະລິຍະ",
  description:
    "A premium, contactless queue management system with real-time tracking, staff dashboards and a TV display board.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0e1a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="lo">
      <body>{children}</body>
    </html>
  );
}
