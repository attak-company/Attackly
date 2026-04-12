import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Digital Manager",
  description: "讓商家用0技術，擁有會接單、會排程、會成交的AI客服",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={`${inter.className} min-h-screen bg-white text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
