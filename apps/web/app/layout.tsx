import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "Hunter Party — Online Board Game",
    template: "%s · Hunter Party",
  },
  description:
    "Play Hunter Party online with up to 4 friends. Create a room, roll dice, fight bosses, and hunt bounty across the board.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Hunter Party — Online Board Game",
    description:
      "Play Hunter Party online with up to 4 friends. Create a room, roll dice, fight bosses, and hunt bounty.",
    url: siteUrl,
    siteName: "Hunter Party",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hunter Party — Online Board Game",
    description: "Play Hunter Party online with up to 4 friends.",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
