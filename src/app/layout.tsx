import type { Metadata, Viewport } from "next";
import "@fontsource-variable/cairo/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "مدرسة الشمامسة", template: "%s | مدرسة الشمامسة" },
  description: "نجوم ومسابقات مدرسة الشمامسة",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
