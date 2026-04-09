import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "數位店長 - AI 客服自動預約系統",
  description: "讓商家用0技術，擁有會接單、會排程、會成交的AI客服",
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
