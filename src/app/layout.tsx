import type { Metadata, Viewport } from "next";
import { Geist_Mono, Syne } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Syne is the whole app's typeface — body and headings, no second display
// font. Base size is bumped a notch in globals.css (html font-size) to read
// "un poco más grande" everywhere at once, rather than resizing every
// component individually.
const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "wwwelly — La memoria de tu hogar",
  description:
    "La app que recuerda por ti todo lo que normalmente llevas en la cabeza.",
  // manifest.ts's theme_color only reaches Android. iOS ignores it — without
  // this, "Add to Home Screen" opens as a plain Safari bookmark (full
  // browser chrome) instead of a real standalone app, and the status bar
  // area falls back to a dark system default instead of matching our cream.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "wwwelly",
  },
};

// Separate from manifest.ts's theme_color: this generates the HTML
// <meta name="theme-color"> tag, which is what Android Chrome/installed PWA
// and iOS 15+ Safari actually read to tint their own browser chrome.
export const viewport: Viewport = {
  themeColor: "#FBF7F3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${syne.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* wwwelly's brand look (fondo crema, cálido) is the only theme —
            :root already is that palette, .dark is never applied, so there's
            no runtime switch to mediate and no next-themes provider needed. */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
