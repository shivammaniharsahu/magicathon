import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MagicAthon — Post anything. Make everyone laugh.",
  description:
    "The social playground where authenticity gets applause. Post, roast, vibe. Built for humans, designed for laughs.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "MagicAthon",
    description: "Post anything. Make everyone laugh.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "MagicAthon" },
};

export const viewport: Viewport = {
  themeColor: "#07060d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
