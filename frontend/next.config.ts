import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  allowedDevOrigins: ['rivers-ment-costs-action.trycloudflare.com'],

  // 修正後的 devIndicators 設定
  devIndicators: {
    // buildActivity 已被移除，現在統一放在此處或直接省略
    position: 'bottom-right',
  },

  // 移除生產環境的 console.log
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 圖片優化設定
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
