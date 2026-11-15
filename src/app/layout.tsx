import type { Metadata, Viewport } from "next";
import "@fontsource-variable/cairo/index.css";
import "./globals.css";
import { text } from "@/lib/strings";

export const metadata: Metadata = {
  title: { default: text.appShortName, template: `%s | ${text.appShortName}` },
  description: text.appDescription,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#b5462a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
