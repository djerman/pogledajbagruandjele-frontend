import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { getAreas } from "@/lib/directus";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Погледај Багру",
  description: "База података о онима који су заборавили ко су и чему служе",
  icons: {
    icon: [
      { url: '/icon.png', sizes: 'any' },
      { url: '/logo_bagra.png', sizes: 'any', type: 'image/png' },
    ],
    apple: '/logo_bagra.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const areas = await getAreas();

  return (
    <html lang="sr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header areas={areas} />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
