import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeScript } from "@/components/ThemeScript";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Frankestein | Nutrición",
  description:
    "Registrá alimentos, conjuntos y macros diarios de forma rápida en el celular.",
  // Sin imagen de preview al compartir (WhatsApp, etc.). El favicon de la pestaña se mantiene.
  openGraph: {
    title: "Frankestein | Nutrición",
    description:
      "Registrá alimentos, conjuntos y macros diarios de forma rápida en el celular.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Frankestein | Nutrición",
    description:
      "Registrá alimentos, conjuntos y macros diarios de forma rápida en el celular.",
  },
  appleWebApp: {
    capable: true,
    title: "Frankestein",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#152a6e" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f1a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
