import type { Metadata, Viewport } from "next";
import "./globals.css";

const applicationUrl = process.env.APP_BASE_URL?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(applicationUrl || "http://localhost:3000"),
  title: {
    default: "KasiStock AI — Explainable restocking intelligence",
    template: "%s | KasiStock AI",
  },
  description:
    "KasiStock AI turns shelf evidence, supplier prices, and recent sales into an explainable purchase plan for cash-constrained small retailers.",
  applicationName: "KasiStock AI",
  keywords: [
    "small retail",
    "spaza shop",
    "inventory",
    "restocking",
    "South Africa",
    "GPT-5.6",
    "OpenAI Build Week",
  ],
  authors: [{ name: "KasiStock AI" }],
  creator: "KasiStock AI",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_ZA",
    title: "KasiStock AI",
    description: "Turn limited cash into the right stock.",
    siteName: "KasiStock AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "KasiStock AI",
    description: "Turn limited cash into the right stock.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#f5f1e8",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-ZA">
      <body>
        <a className="skipLink" href="#main-content">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
