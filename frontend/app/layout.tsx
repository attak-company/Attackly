import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://digitalmanager.ai'),
  title: "Digital Manager - AI 數位店長",
  description: "讓商家用0技術，擁有會接單、會排程、會成交的AI客服。整合 Gemini 核心，深度學習您的價目表與知識庫，實現真正的零人力運營。",
  keywords: "AI客服, 數位店長, 自動排程, LINE客服, 商業自動化",
  authors: [{ name: "Digital Manager" }],
  creator: "Digital Manager",
  publisher: "Digital Manager",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "https://digitalmanager.ai",
    title: "Digital Manager - AI 數位店長",
    description: "讓商家用0技術，擁有會接單、會排程、會成交的AI客服",
    siteName: "Digital Manager",
    images: [
      {
        url: "/Logo.png",
        width: 1200,
        height: 630,
        alt: "Digital Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Manager - AI 數位店長",
    description: "讓商家用0技術，擁有會接單、會排程、會成交的AI客服",
    images: ["/Logo.png"],
    creator: "@digitalmanager",
  },
  icons: [
    {
      rel: "icon",
      type: "image/png",
      sizes: "96x96",
      url: "/Logo.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      url: "/Logo.png",
    },
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.className} min-h-screen bg-white text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
