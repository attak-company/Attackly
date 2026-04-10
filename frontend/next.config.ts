import type { NextConfig } from "next";



const nextConfig: NextConfig = {

  allowedDevOrigins: ['rivers-ment-costs-action.trycloudflare.com'],

  // 禁用 Next.js 開發者工具

  devIndicators: {

    buildActivity: false,

    buildActivityPosition: 'bottom-right',

  },

};



export default nextConfig;

