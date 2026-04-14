"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles, Wrench, Bug, Zap } from "lucide-react";
import { motion } from "framer-motion";

// 狀態標籤組件
const StatusBadge = ({ type }: { type: 'New' | 'Fix' | 'Perf' }) => {
  const styles = {
    New: 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.6)]',
    Fix: 'bg-gray-700 text-gray-300',
    Perf: 'bg-black text-white border border-white'
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[type]}`}>
      {type}
    </span>
  );
};

export default function Changelog() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* 返回按鈕 */}
        <Link href="/" className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors duration-300 mb-8 group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-medium">返回官網</span>
        </Link>

        <h1 className="text-4xl font-bold text-white mb-4">更新日誌</h1>
        <p className="text-gray-400 mb-12">Digital Manager 數位店長 - 版本更新紀錄</p>

        {/* 版本說明 */}
        <div className="mb-12 p-6 bg-gray-900 rounded-lg border border-gray-800">
          <p className="text-gray-300 text-sm">
            <span className="text-red-500 font-medium">版本說明：</span>
            我們的 Beta 階段代表功能快速迭代期，Alpha 則代表進入高穩定性的正式營運階段。
          </p>
        </div>

        {/* 時間軸佈局 */}
        <div className="relative">
          {/* 紅色時間軸線 */}
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            transition={{ duration: 1.5 }}
            className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-600 via-red-500 to-transparent shadow-[0_0_15px_rgba(220,38,38,0.8)]"
          ></motion.div>

          {/* 版本列表 */}
          <div className="space-y-12 pl-12">
            {/* Beta_1.1 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0 }}
              className="relative group"
            >
              {/* 發光紅點 */}
              <div className="absolute left-[-2.25rem] top-2 w-4 h-4 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,1)] group-hover:scale-125 transition-transform duration-300"></div>
              
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 group-hover:border-red-600 group-hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-block px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium shadow-[0_0_15px_rgba(220,38,38,0.8)]">Beta_1.1</span>
                  <span className="text-gray-400 text-sm">2026 年 4 月 13 日</span>
                  <StatusBadge type="New" />
                </div>
                <h2 className="text-xl font-bold text-white mb-6">Alpha_1.0 標籤與金流整合</h2>

                {/* 🌟 新增功能 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white">🌟 新增功能</h3>
                  </div>
                  <ul className="space-y-2 text-gray-300 ml-7">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>核心功能區塊標題添加 Alpha_1.0 版本標籤，採用紅色發光效果</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>三大核心功能卡片添加 Alpha_1.0 標籤，統一視覺風格</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>為 Alpha_1.0 標籤添加進場動畫（scale + opacity），使用 spring 過渡曲線</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>建立退費政策頁面（/refund-policy），詳細說明退款條件與 AI 使用限制</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>頁尾整合藍新金流 Logo，建立支付信任背書</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>頁尾添加 SSL 256bit 加密技術安全聲明</span>
                    </li>
                  </ul>
                </div>

                {/* 🛠️ 優化與改進 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white">🛠️ 優化與改進</h3>
                  </div>
                  <ul className="space-y-2 text-gray-300 ml-7">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>優化頁尾法律連結區塊，整合服務條款、隱私權政策、退費政策</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>調整頁尾區塊間距，提升視覺平衡感</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>免責聲明字級統一縮小至 text-[10px]，顏色改為 text-white/30</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>法律連結添加懸停紅色文字效果，增強互動感</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>為「7 天免費試用」關鍵字加粗，為「申請退費」添加底線</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>為聯繫 LINE 專人客服的 icon 添加懸停紅色邊框效果</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>隱藏原生捲軸，優化頁面視覺體驗</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>新增頂部捲動進度條（2px 高度、#DC2626 品牌紅、發光效果）</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>使用 Framer Motion useScroll 監測進度，進度條隨滾動即時伸縮</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>修正進度條計算邏輯，使用正確的數學公式：CurrentScrollY / (DocumentTotalHeight - WindowInnerHeight)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>添加 resize 事件監聽器，即時監聽網頁長度變化並重新計算進度</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>移除右側黑邊，在 html 與 body 加入 width: 100% 與 overflow-x: hidden</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>進度條 z-index 設為 [9999]，確保高於所有組件</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>更新服務條款和隱私權政策的最後更新日期為 2026 年 4 月</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Beta_1.0 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative group"
            >
              {/* 發光紅點 */}
              <div className="absolute left-[-2.25rem] top-2 w-4 h-4 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,1)] group-hover:scale-125 transition-transform duration-300"></div>
              
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 group-hover:border-red-600 group-hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-block px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium shadow-[0_0_15px_rgba(220,38,38,0.8)]">Beta_1.0</span>
                  <span className="text-gray-400 text-sm">2026 年 4 月 13 日</span>
                  <StatusBadge type="New" />
                </div>
                <h2 className="text-xl font-bold text-white mb-6">最終優化版本</h2>

                {/* 🌟 新增功能 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white">🌟 新增功能</h3>
                  </div>
                  <ul className="space-y-2 text-gray-300 ml-7">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>建立系統狀態監測頁面（/status），提供實時服務監控功能</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>添加 Gemini 1.5 Pro (Google AI) 監測區塊，顯示實時延遲數據（600-950ms）</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>重新設計開發者日誌頁面，採用垂直時間軸佈局</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>添加版本說明區塊，解釋 Beta 與 Alpha 階段定義</span>
                    </li>
                  </ul>
                </div>

                {/* 🛠️ 優化與改進 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white">🛠️ 優化與改進</h3>
                  </div>
                  <ul className="space-y-2 text-gray-300 ml-7">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>將更新日誌內容細分為多個版本，提升追蹤精確度</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>優化時間軸視覺效果，添加發光紅點和懸停動畫</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Beta_0.7 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative group"
            >
              {/* 發光紅點 */}
              <div className="absolute left-[-2.25rem] top-2 w-4 h-4 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,1)] group-hover:scale-125 transition-transform duration-300"></div>
              
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 group-hover:border-red-600 group-hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-block px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium shadow-[0_0_15px_rgba(220,38,38,0.8)]">Beta_0.7</span>
                  <span className="text-gray-400 text-sm">2026 年 4 月 13 日</span>
                  <StatusBadge type="New" />
                </div>
                <h2 className="text-xl font-bold text-white mb-6">開發者日誌佈局優化</h2>

                {/* 🌟 新增功能 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white">🌟 新增功能</h3>
                  </div>
                  <ul className="space-y-2 text-gray-300 ml-7">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>採用垂直時間軸佈局設計</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>添加版本標籤（New、Fix、Perf）分類系統</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>添加圖標（Sparkles、Wrench、Bug）增強視覺識別度</span>
                    </li>
                  </ul>
                </div>

                {/* 🛠️ 優化與改進 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white">🛠️ 優化與改進</h3>
                  </div>
                  <ul className="space-y-2 text-gray-300 ml-7">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>視覺風格與主頁統一（純黑背景、純白文字、紅色強調色）</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>添加懸停發光特效，提升互動體驗</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>將內容重新組織成 New Features、Improvements、Bug Fixes 區塊</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Beta_0.6 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative group"
            >
              {/* 發光紅點 */}
              <div className="absolute left-[-2.25rem] top-2 w-4 h-4 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,1)] group-hover:scale-125 transition-transform duration-300"></div>
              
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 group-hover:border-red-600 group-hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-block px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium shadow-[0_0_15px_rgba(220,38,38,0.8)]">Beta_0.6</span>
                  <span className="text-gray-400 text-sm">2026 年 4 月 13 日</span>
                  <StatusBadge type="New" />
                </div>
                <h2 className="text-xl font-bold text-white mb-6">開發者日誌內容擴充</h2>

                {/* 🌟 新增功能 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white">🌟 新增功能</h3>
                  </div>
                  <ul className="space-y-2 text-gray-300 ml-7">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>建立完整的開發者日誌內容架構</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>基於專案細節豐富版本紀錄（儀表板、AI 設定、登入系統等）</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>添加技術棧細節（Supabase、Next.js 14、Tailwind CSS、Lucide React、Framer Motion）</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>添加預計功能區塊（Alpha_1.0 正式版功能預覽）</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Beta_0.5 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative group"
            >
              {/* 發光紅點 */}
              <div className="absolute left-[-2.25rem] top-2 w-4 h-4 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,1)] group-hover:scale-125 transition-transform duration-300"></div>
              
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 group-hover:border-red-600 group-hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-block px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium shadow-[0_0_15px_rgba(220,38,38,0.8)]">Beta_0.5</span>
                  <span className="text-gray-400 text-sm">2026 年 4 月 13 日</span>
                  <StatusBadge type="Perf" />
                </div>
                <h2 className="text-xl font-bold text-white mb-6">光點偵測範圍優化</h2>

                {/* 🛠️ 優化與改進 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white">🛠️ 優化與改進</h3>
                  </div>
                  <ul className="space-y-2 text-gray-300 ml-7">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>調整光點偵測範圍，改為圓形偵測區域</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>移除 -translate-x-1/2 確保偵測範圍在光點上</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>添加 rounded-full 讓偵測範圍變成圓形</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Beta_0.4 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="relative group"
            >
              {/* 發光紅點 */}
              <div className="absolute left-[-2.25rem] top-2 w-4 h-4 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,1)] group-hover:scale-125 transition-transform duration-300"></div>
              
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 group-hover:border-red-600 group-hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-block px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium shadow-[0_0_15px_rgba(220,38,38,0.8)]">Beta_0.4</span>
                  <span className="text-gray-400 text-sm">2026 年 4 月 12 日</span>
                  <StatusBadge type="Fix" />
                </div>
                <h2 className="text-xl font-bold text-white mb-6">Console 警告修復</h2>

                {/* 🐞 修復錯誤 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Bug className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white">🐞 修復錯誤</h3>
                  </div>
                  <ul className="space-y-2 text-gray-300 ml-7">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>修復 Console 警告：將 <code className="bg-gray-800 px-2 py-1 rounded text-sm text-red-400">webkitMaskImage</code> 統一改為 <code className="bg-gray-800 px-2 py-1 rounded text-sm text-red-400">WebkitMaskImage</code></span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>全域搜尋並修改所有 webkitMaskImage 屬性</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Beta_0.3 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="relative group"
            >
              {/* 發光紅點 */}
              <div className="absolute left-[-2.25rem] top-2 w-4 h-4 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,1)] group-hover:scale-125 transition-transform duration-300"></div>
              
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 group-hover:border-red-600 group-hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-block px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium shadow-[0_0_15px_rgba(220,38,38,0.8)]">Beta_0.3</span>
                  <span className="text-gray-400 text-sm">2026 年 4 月 12 日</span>
                  <StatusBadge type="New" />
                </div>
                <h2 className="text-xl font-bold text-white mb-6">返回按鈕與全域樣式優化</h2>

                {/* 🌟 新增功能 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white">🌟 新增功能</h3>
                  </div>
                  <ul className="space-y-2 text-gray-300 ml-7">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>為所有子頁面（開發者中心、更新日誌、隱私權政策、服務條款）添加統一風格的返回按鈕</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>使用 ArrowLeft 圖標和紅色發光特效</span>
                    </li>
                  </ul>
                </div>

                {/* 🛠️ 優化與改進 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white">🛠️ 優化與改進</h3>
                  </div>
                  <ul className="space-y-2 text-gray-300 ml-7">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>優化 html 和 body 的全域樣式，改用 <code className="bg-gray-800 px-2 py-1 rounded text-sm text-red-400">100vw</code> 確保物理填滿螢幕</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>將 html 和 body 樣式分開，提升靈活性</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Beta_0.2 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="relative group"
            >
              {/* 發光紅點 */}
              <div className="absolute left-[-2.25rem] top-2 w-4 h-4 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,1)] group-hover:scale-125 transition-transform duration-300"></div>
              
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 group-hover:border-red-600 group-hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-block px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium shadow-[0_0_15px_rgba(220,38,38,0.8)]">Beta_0.2</span>
                  <span className="text-gray-400 text-sm">2026 年 4 月 11 日</span>
                  <StatusBadge type="Perf" />
                </div>
                <h2 className="text-xl font-bold text-white mb-6">分界線特效優化</h2>

                {/* 🛠️ 優化與改進 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white">🛠️ 優化與改進</h3>
                  </div>
                  <ul className="space-y-2 text-gray-300 ml-7">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>優化分界線特效，統一使用 <code className="bg-gray-800 px-2 py-1 rounded text-sm text-red-400">calc(100%+20px)</code> 來解決右側黑框問題</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>統一兩條分界線的樣式，替換為 <code className="bg-gray-800 px-2 py-1 rounded text-sm text-red-400">w-[calc(100%+20px)] -ml-[10px]</code></span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>移除父容器的 overflow: hidden 限制</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>將 html 背景色設為黑色 #000000 來同步全域底色</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Beta_0.1 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="relative group"
            >
              {/* 發光紅點 */}
              <div className="absolute left-[-2.25rem] top-2 w-4 h-4 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,1)] group-hover:scale-125 transition-transform duration-300"></div>
              
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 group-hover:border-red-600 group-hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-block px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium shadow-[0_0_15px_rgba(220,38,38,0.8)]">Beta_0.1</span>
                  <span className="text-gray-400 text-sm">2026 年 4 月 10 日</span>
                  <StatusBadge type="New" />
                </div>
                <h2 className="text-xl font-bold text-white mb-6">初始開發版本</h2>

                {/* 🌟 新增功能 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white">🌟 新增功能</h3>
                  </div>
                  <ul className="space-y-2 text-gray-300 ml-7">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>建立數位店長基礎架構，整合 LINE 平台 API</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>實作 AI 客戶服務系統，支援智能問答與預約排程功能</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>設計紅線發光特效分界線，提升視覺層次感</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>建立開發者中心，提供 API 文件與整合指南（認證、Webhook、訂閱管理）</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>完成用戶認證系統（註冊、登入、忘記密碼、重置密碼）</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>支援 Email 和手機號碼雙重登入方式，包含驗證碼功能</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>建立儀表板介面，包含預約管理、聊天記錄、行事曆等功能</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>實作商戶總覽統計數據（今日預約、AI 回覆次數、新客戶、成交轉換率）</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>新增 AI 語氣設定功能，支援專業、親切、活潑等不同風格</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>實作 AI 自訂規則系統，支援條件與動作設定</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>建立 LINE 設定頁面，支援 LINE 官方帳號配置</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>建立商店設定頁面，支援商店資訊管理</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>建立帳號設定頁面，支援個人資料管理</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>實作選擇方案頁面，支援訂閱方案選擇</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>實作支付綁定頁面，支援支付方式設定</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>實作支付成功頁面，顯示付款結果</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>建立常見問題頁面，提供 FAQ 功能</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>建立隱私權政策與服務條款頁面</span>
                    </li>
                  </ul>
                </div>

                {/* 🛠️ 優化與改進 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white">🛠️ 技術架構</h3>
                  </div>
                  <ul className="space-y-2 text-gray-300 ml-7">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>整合 Supabase 作為後端資料庫與認證系統</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>使用 Next.js 14 作為前端框架，採用 App Router 架構</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>使用 Tailwind CSS 作為樣式框架</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>使用 Lucide React 作為圖標庫</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span>使用 Framer Motion 作為動畫庫</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* 即將推出 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="relative group"
            >
              {/* 發光紅點 */}
              <motion.div 
                animate={{ 
                  boxShadow: ['0 0 20px rgba(220,38,38,0.8)', '0 0 40px rgba(220,38,38,0.4)', '0 0 20px rgba(220,38,38,0.8)'] 
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-[-2.25rem] top-2 w-4 h-4 bg-gray-600 rounded-full group-hover:scale-125 transition-transform duration-300"
              ></motion.div>
              
              <motion.div 
                animate={{ 
                  opacity: [0.7, 1, 0.7],
                  borderColor: ['rgba(107, 114, 128, 0.5)', 'rgba(220, 38, 38, 0.5)', 'rgba(107, 114, 128, 0.5)']
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="bg-gray-900 rounded-lg p-6 border-2 border-dashed border-gray-800"
              >
                <div className="flex items-center gap-3 mb-4">
                  <motion.span 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm font-medium"
                  >
                    即將推出
                  </motion.span>
                </div>
                <h2 className="text-xl font-bold text-white mb-6">Alpha_1.0（正式版）預計功能</h2>

                {/* 🌟 新增功能 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white">🌟 預計功能</h3>
                  </div>
                  <ul className="space-y-2 text-gray-300 ml-7">
                    <li className="flex items-start">
                      <span className="text-gray-500 mr-2 mt-1">•</span>
                      <span>完整的 LINE 官方帳號整合與測試</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-500 mr-2 mt-1">•</span>
                      <span>AI 模型優化與多語言支援</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-500 mr-2 mt-1">•</span>
                      <span>支付系統整合與訂閱管理</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-500 mr-2 mt-1">•</span>
                      <span>數據分析與報表功能</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-500 mr-2 mt-1">•</span>
                      <span>行動端響應式設計優化</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-500 mr-2 mt-1">•</span>
                      <span>系統效能優化與負載測試</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
