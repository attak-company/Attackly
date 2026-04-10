import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 保留你原本的 Cloudflare 設定
  allowedDevOrigins: ['rivers-ment-costs-action.trycloudflare.com'],

  // 修正後的 devIndicators 設定
  devIndicators: {
    // buildActivity 已被移除，現在統一放在此處或直接省略
    position: 'bottom-right',
  },
};

export default nextConfig;
