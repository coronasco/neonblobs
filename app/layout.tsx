import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SupabaseProvider } from "@/lib/auth/SupabaseProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Blobeer - Multiplayer Arena Battle Game | Free Online .io Game',
  description: 'Play Blobeer, the ultimate multiplayer arena battle game. Grow, fight, and dominate in this fast-paced .io game with power-ups, boss battles, and free cosmetics.',
  keywords: 'blobeer, multiplayer game, arena battle, .io game, online game, free game, battle royale, neon game',
  viewport: 'width=device-width, initial-scale=1',
  openGraph: {
    title: 'Blobeer - Multiplayer Arena Battle Game',
    description: 'Join the ultimate neon arena experience. Fast-paced multiplayer action with power-ups, boss battles, and free customization.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blobeer - Multiplayer Arena Battle Game',
    description: 'The ultimate multiplayer .io arena experience. Play now for free!',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-5EQTB2ZJFS"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5EQTB2ZJFS');
          `}
        </Script>

        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7278381785440044"
          crossorigin="anonymous"
        />
        
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
