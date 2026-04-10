"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Bot, Calendar, MessageSquare, Shield, Zap, ArrowRight, CheckCircle2, Star, Globe, Clock, LayoutDashboard } from "lucide-react";

const words = ["預約", "排程", "接單", "客服"];
const staticText1 = "讓 AI 幫您";
const staticText2 = "搞定所有";

export default function LandingPage() {
  const [index, setIndex] = useState(0);
  const [isWaving, setIsWaving] = useState(false);
  const [isPlayingForward, setIsPlayingForward] = useState(true);
  
  const forwardVideoRef = useRef<HTMLVideoElement>(null);
  const reverseVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const forwardVideo = forwardVideoRef.current;
    const reverseVideo = reverseVideoRef.current;
    if (!forwardVideo || !reverseVideo) return;

    // 當正向結束 -> 啟動倒向
    const handleForwardEnded = () => {
      setIsPlayingForward(false);
      reverseVideo.currentTime = 0;
      reverseVideo.play();
    };

    // 當倒向結束 -> 啟動正向
    const handleReverseEnded = () => {
      setIsPlayingForward(true);
      forwardVideo.currentTime = 0;
      forwardVideo.play();
    };

    forwardVideo.addEventListener('ended', handleForwardEnded);
    reverseVideo.addEventListener('ended', handleReverseEnded);

    return () => {
      forwardVideo.removeEventListener('ended', handleForwardEnded);
      reverseVideo.removeEventListener('ended', handleReverseEnded);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      // 1. 先啟動波浪效果
      setIsWaving(true);
      
      // 2. 波浪跳動一段時間後（例如 600ms），切換文字
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length);
        setIsWaving(false);
      }, 600);
      
    }, 3500); // 延長間隔，讓波浪與切換更有節奏感
    return () => clearInterval(timer);
  }, []);

  // 字元跳動動畫設定
  const letterVariants = {
    initial: { y: 0 },
    wave: (i: number) => ({
      y: [0, -15, 0],
      transition: {
        duration: 0.4,
        delay: i * 0.03, // 稍微加快波浪速度
        ease: "easeInOut" as const
      }
    })
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-black selection:text-white">
      {/* 導覽列 */}
      <nav className="fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-lg z-[5000] border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/Logo.png" 
              alt="Logo" 
              className="w-14 h-14 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-black uppercase leading-none">Digital Manager</span>
              <span className="text-xs text-gray-500 font-light tracking-wide mt-1">您的 AI 數位店長</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
              <a href="#features" className="hover:text-black transition-colors">核心功能</a>
              <a href="#pricing" className="hover:text-black transition-colors">價格方案</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-all">
                登入
              </Link>
              <Link 
                href="/register" 
                className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-black/20 active:scale-95 transition-all"
              >
                免費試用
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-32 px-6 overflow-hidden min-h-[90vh] flex items-center">
        {/* 背景影片層 - 雙影片切換技術 (Double Buffering) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-black">
          {/* 正向影片 */}
          <video
            ref={forwardVideoRef}
            autoPlay
            muted
            playsInline
            preload="auto"
            className={`absolute inset-0 w-full h-full object-cover ${isPlayingForward ? "block" : "hidden"}`}
          >
            <source src="/hero-bg.webm" type="video/webm" />
          </video>
          {/* 倒向影片 */}
          <video
            ref={reverseVideoRef}
            muted
            playsInline
            preload="auto"
            className={`absolute inset-0 w-full h-full object-cover ${!isPlayingForward ? "block" : "hidden"}`}
          >
            <source src="/hero-bg-Revert.webm" type="video/webm" />
          </video>
          {/* 磨砂遮罩 Overlay */}
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[3px] z-10"></div>
        </div>

        {/* 內容層 - 強制設定高 z-index */}
        <div className="max-w-7xl mx-auto text-center relative z-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-xs font-bold mb-10 uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            全新 Gemini 驅動
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tight text-black mb-8 leading-[1.1] flex flex-col items-center">
            <div className="flex">
              {staticText1.split("").map((char, i) => (
                <motion.span
                  key={`t1-${i}`}
                  custom={i}
                  animate={isWaving ? "wave" : "initial"}
                  variants={letterVariants}
                  className="inline-block"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </div>
            <div className="flex items-center justify-center">
              {staticText2.split("").map((char, i) => (
                <motion.span
                  key={`t2-${i}`}
                  custom={i + staticText1.length} // 接續上一個字串的延遲
                  animate={isWaving ? "wave" : "initial"}
                  variants={letterVariants}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              ))}
              
              <div className="h-[1.2em] inline-flex items-center overflow-hidden align-bottom ml-4">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={words[index]}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -40, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "circOut" }}
                    className="text-red-600 inline-block"
                  >
                    {words[index]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            告別瑣碎的 LINE 溝通。數位店長為您提供 24/7 全天候 AI 客服，
            從回答問題到自動排程，實現真正的零人力運營。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link 
              href="/register" 
              className="w-full sm:w-auto bg-black text-white px-10 py-5 rounded-2xl text-xl font-bold hover:shadow-2xl hover:shadow-black/20 active:scale-95 transition-all flex items-center justify-center group"
            >
              立即開始 7 天免費試用
              <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="#pricing" 
              className="w-full sm:w-auto border-2 border-gray-200 text-gray-900 px-10 py-5 rounded-2xl text-xl font-bold hover:bg-gray-50 transition-all"
            >
              方案定價
            </Link>
          </div>
        </div>
      </section>

      {/* 痛點對比區 */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6">傳統困境 vs AI 數位店長</h2>
            <p className="text-xl text-gray-500 font-medium">選擇更智能的營運方式</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* 傳統困境 - 左欄，較低對比度 */}
            <div className="p-10 bg-gray-50 border border-gray-200 rounded-[32px]">
              <h4 className="text-2xl font-bold mb-8 text-gray-400">傳統困境</h4>
              <ul className="space-y-6">
                {["漏接訊息", "客戶等待過久", "預約衝突", "半夜無人回覆"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-medium text-gray-400 text-lg">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">✗</span>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* AI 數位店長 - 右欄，高對比白字，紅色點綴 */}
            <div className="p-10 bg-black text-white rounded-[32px] shadow-2xl shadow-black/20">
              <h4 className="text-2xl font-bold mb-8 text-white">AI 數位店長</h4>
              <ul className="space-y-6">
                <li className="flex items-center gap-3 font-bold text-white text-lg">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-white"><span className="text-red-500">0 秒</span>回應</span>
                </li>
                <li className="flex items-center gap-3 font-bold text-white text-lg">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-white"><span className="text-red-500">精準</span>識別需求</span>
                </li>
                <li className="flex items-center gap-3 font-bold text-white text-lg">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-white"><span className="text-red-500">自動</span>串接資料庫</span>
                </li>
                <li className="flex items-center gap-3 font-bold text-white text-lg">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-white"><span className="text-red-500">掌握</span>客流動態</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 功能介紹 */}
      <section id="features" className="py-32 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {/* 功能一：24/7 智慧導購店長 */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0 }}
              className="h-full p-8 bg-[#0A0A0A] border border-white/10 rounded-2xl hover:border-red-600 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_rgba(255,0,0,0.3)] transition-all duration-300 group"
            >
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">24/7 智慧導購店長</h3>
              <p className="text-gray-400 leading-relaxed">
                整合 Gemini 核心，深度學習您的價目表與知識庫。不只回覆問題，更能主動引導預約，讓服務不中斷。
              </p>
            </motion.div>

            {/* 功能二：視覺化經營看板 */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="h-full p-8 bg-[#0A0A0A] border border-white/10 rounded-2xl hover:border-red-600 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_rgba(255,0,0,0.3)] transition-all duration-300 group"
            >
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <LayoutDashboard className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">視覺化經營看板</h3>
              <p className="text-gray-400 leading-relaxed">
                告別混亂訊息與紙本紀錄。一眼掌握今日動態與本週排程，精準預估客流高峰，提升店內翻桌率。
              </p>
            </motion.div>

            {/* 功能三：零門檻閃電部署 */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="h-full p-8 bg-[#0A0A0A] border border-white/10 rounded-2xl hover:border-red-600 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_rgba(255,0,0,0.3)] transition-all duration-300 group"
            >
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">零門檻閃電部署</h3>
              <p className="text-gray-400 leading-relaxed">
                無需技術背景。只需貼上專屬密鑰，3 分鐘內完成全系統對接，讓您的店面瞬間升級 AI 模式。
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 價格方案 */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6">簡單透明的方案</h2>
            <p className="text-xl text-gray-500 font-medium">無隱藏費用，隨時可取消。</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* 標準版 */}
            <div className="p-10 bg-white border-2 border-gray-100 rounded-[32px] hover:border-black transition-all group">
              <h4 className="text-xl font-bold mb-2">基礎版</h4>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black">$990</span>
                <span className="text-gray-500 font-bold">/月</span>
              </div>
              <ul className="space-y-4 mb-10">
                {["每月 500 次 AI 回覆", "自動預約系統", "基礎 FAQ 知識庫", "LINE 整合", "單一商戶後台"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-gray-300" /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full py-4 bg-gray-50 text-black text-center rounded-2xl font-black group-hover:bg-black group-hover:text-white transition-all">
                立即開始
              </Link>
            </div>

            {/* 專業版 */}
            <div className="p-10 bg-black text-white rounded-[32px] relative overflow-hidden shadow-2xl shadow-black/20">
              <div className="absolute top-6 right-6 bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                最受歡迎
              </div>
              <h4 className="text-xl font-bold mb-2 text-gray-400">專業版</h4>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black text-white">$1,990</span>
                <span className="text-gray-400 font-bold">/月</span>
              </div>
              <ul className="space-y-4 mb-10">
                {["無限次 AI 回覆", "自動預約 + 日程分析", "高級 RAG 知識庫 (支援PDF)", "多渠道串接", "詳細數據統計報表"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-green-400" /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full py-4 bg-white text-black text-center rounded-2xl font-black hover:bg-gray-100 transition-all">
                獲取專業版
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-8">
            <img 
              src="/Logo.png" 
              alt="Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            © 2026 Digital Manager AI. 為小型商戶而生。
          </p>
        </div>
      </footer>
    </div>
  );
}
