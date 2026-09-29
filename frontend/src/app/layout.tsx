import "@/app/globals.css";

import { Inter } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const interMono = Inter({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

/** Canonical origin used to resolve Open Graph URLs. */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Site-wide metadata.
 *
 * Page-level `title`s are plain names ("Practice arena"); the template below
 * appends the app name, so every tab reads `Practice arena — DevAssess`.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: APP_NAME,
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s — ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "developer assessment",
    "coding assessment platform",
    "online compiler",
    "coding practice",
    "technical hiring",
    "MCQ exams",
    "SQL playground",
    "Python playground",
  ],
  authors: [{ name: APP_NAME, url: siteUrl }],
  creator: APP_NAME,
  publisher: APP_NAME,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: APP_NAME,
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: `${APP_NAME} logo` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    images: ["/icon-512.png"],
  },
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false, email: false, address: false },
  manifest: "/manifest.webmanifest",
};

/** Browser chrome colour + responsive defaults. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${interMono.variable} min-h-screen bg-background text-foreground font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

