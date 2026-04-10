"use client";



import { useEffect, useState, useRef } from "react";

import { motion, AnimatePresence } from "framer-motion";

import Link from "next/link";

import { Bot, Calendar, MessageSquare, Shield, Zap, ArrowRight, CheckCircle2, Star, Globe, Clock, LayoutDashboard, X, Check } from "lucide-react";



const words = ["預約", "排程", "接單", "客服"];

const staticText1 = "讓 AI 幫您";

const staticText2 = "搞定所有";

// 行業數據
type IndustryData = {
  keyBenefit: string;
  features: string[];
  tags: string[];
  chatMessages: { type: 'user' | 'ai'; text: string }[];
};

const industries: Record<string, IndustryData> = {
  '餐飲服務': {
    keyBenefit: '告別電話漏接，離峰自動促銷。',
    features: ['AI 自動處理訂位諮詢', '主動推播今日特餐圖卡', '引導加入會員'],
    tags: ['#不改現有流程', '#自動化行銷', '#高滿意度回覆'],
    chatMessages: [
      { type: 'user', text: '請問今晚還有位置嗎？' },
      { type: 'ai', text: '您好！今晚 7 點還有兩個四人桌的空檔，需要我幫您預約嗎？' },
      { type: 'user', text: '好的，幫我預約 7 點' },
      { type: 'ai', text: '已為您預約今晚 7 點四人桌。今日特餐：香煎鮭魚定餐，要幫您預訂嗎？' }
    ]
  },
  '美髮美容': {
    keyBenefit: '作品即時展示，預約零衝突。',
    features: ['動態展示設計師作品集', 'AI 根據排程自動建議空檔', '傳送染燙後護理叮嚀'],
    tags: ['#作品展示', '#智能排程', '#客戶關懷'],
    chatMessages: [
      { type: 'user', text: '我想預約明天下午剪髮' },
      { type: 'ai', text: '明天下午 3 點有空檔，推薦設計師 Kevin，他的短髮作品很受歡迎，要看嗎？' },
      { type: 'ai', text: '[圖片：Kevin 設計師作品集]' },
      { type: 'user', text: '好的，就預約 3 點' }
    ]
  },
  '零售診所': {
    keyBenefit: '過濾 80% 重複諮詢，專注核心服務。',
    features: ['智慧處理常見 QA', '自動提醒預約看診', '過濾無效推銷訊息'],
    tags: ['#智能客服', '#自動提醒', '#時間管理'],
    chatMessages: [
      { type: 'user', text: '門診時間是什麼時候？' },
      { type: 'ai', text: '門診時間：週一至週五 9:00-18:00，週六 9:00-12:00' },
      { type: 'user', text: '產品規格呢？' },
      { type: 'ai', text: '產品規格已發送至您的手機，請查收。提醒您下週三有預約。' }
    ]
  }
};

// 數字跳動動畫組件
function NumberTicker({ value, duration = 2 }: { value: number | string; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    if (typeof value === 'number') {
      let start = 0;
      const end = value;
      const increment = end / (duration * 60);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 1000 / 60);
      return () => clearInterval(timer);
    }
  }, [isVisible, value, duration]);

  return (
    <div ref={ref}>
      {typeof value === 'number' ? displayValue : value}
    </div>
  );
}

// 打字機效果組件 - 使用 framer-motion stagger
function TypewriterText({ text, speed = 0.05 }: { text: string; speed?: number }) {
  return (
    <span>
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * speed }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

export default function LandingPage() {

  const [index, setIndex] = useState(0);

  const [isWaving, setIsWaving] = useState(false);

  const [isPlayingForward, setIsPlayingForward] = useState(true);

  const [isScrolled, setIsScrolled] = useState(false);

  const [selectedIndustry, setSelectedIndustry] = useState('餐飲服務');



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



  useEffect(() => {

    const handleScroll = () => {

      setIsScrolled(window.scrollY > 0);

    };



    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);

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

      <nav className={`fixed top-0 left-0 right-0 z-[5000] transition-all duration-500 ease-in-out ${isScrolled ? 'bg-white/70 backdrop-blur-lg' : 'bg-transparent'}`}>

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

              <Link href="/login" className="px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-red-600 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(255,0,0,0.3)] rounded-xl transition-all border-2 border-transparent">

                登入

              </Link>

              <Link

                href="/register"

                className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:border-red-600 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(255,0,0,0.3)] active:scale-95 transition-all border-2 border-transparent"

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

                    exit={{ y: -20, opacity: 0 }}

                    transition={{ duration: 0.5, ease: "easeInOut" }}

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

              className="w-full sm:w-auto bg-black text-white px-10 py-5 rounded-2xl text-xl font-bold hover:border-red-600 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(255,0,0,0.3)] active:scale-95 transition-all flex items-center justify-center group border-2 border-transparent"

            >

              立即開始 7 天免費試用

              <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />

            </Link>

            <Link

              href="#pricing"

              className="w-full sm:w-auto border-2 border-gray-200 text-gray-900 px-10 py-5 rounded-2xl text-xl font-bold hover:border-red-600 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(255,0,0,0.3)] transition-all"

            >

              方案定價

            </Link>

          </div>

        </div>

      </section>



      {/* 痛點對話 */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6">別讓瑣事，消耗了您的熱情</h2>
            <p className="text-xl text-gray-500 font-medium">傳統經營的混亂 vs. 數位店長的秩序</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 左側：傳統模式 */}
            <motion.div
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              whileInView={{ opacity: 1, filter: 'blur(0px)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-gray-50 p-8 rounded-2xl border border-gray-200"
            >
              <h3 className="text-2xl font-bold text-gray-600 mb-6">傳統經營：身心俱疲</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <X className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-700 mb-2">消失的訂單</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      手機靜音或忙碌中，錯過了一次又一次的詢問。
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <X className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-700 mb-2">客戶的耐心</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      讓客人等待超過 10 分鐘，他們就成了對手的客戶。
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <X className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-700 mb-2">深夜的空白</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      凌晨三點的諮詢無人回應，商機隨之消失。
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 右側：數位店長 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-black p-8 rounded-2xl border-2 border-red-600 relative overflow-hidden hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_rgba(255,0,0,0.3)] transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent pointer-events-none"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-6">數位店長：優雅掌控</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2">秒級回覆</h4>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        0 秒自動響應，讓客人第一時間感受到您的在乎。
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2">智慧識讀</h4>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        Gemini AI 讀懂口語需求，像真人一樣精準推薦服務。
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2">自動獲客</h4>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        即使您在睡覺，AI 也在幫您完成預約與排程。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>



      {/* 功能介紹 */}

      <section id="features" className="py-32 bg-black">

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-20">

            <h2 className="text-4xl md:text-6xl font-black mb-6 text-white">三大核心功能</h2>

            <p className="text-xl text-gray-400 font-medium">全方位 AI 營運解決方案</p>

          </div>

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

              <p className="text-gray-400 leading-relaxed mb-6">

                整合 Gemini 核心，深度學習您的價目表與知識庫。不只回覆問題，更能主動引導預約，讓服務不中斷。

              </p>

              <div className="flex gap-2">

                <span className="px-2 py-1 bg-white/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#自動報價</span>

                <span className="px-2 py-1 bg-white/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#預約諮詢</span>

                <span className="px-2 py-1 bg-white/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#人工介入機制</span>

              </div>

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

              <p className="text-gray-400 leading-relaxed mb-6">

                告別混亂訊息與紙本紀錄。一眼掌握今日動態與本週排程，精準預估客流高峰，提升店內翻桌率。

              </p>

              <div className="flex gap-2">

                <span className="px-2 py-1 bg-white/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#今日預約熱圖</span>

                <span className="px-2 py-1 bg-white/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#自動客戶標籤</span>

                <span className="px-2 py-1 bg-white/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#翻桌率分析</span>

              </div>

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

              <p className="text-gray-400 leading-relaxed mb-6">

                無需技術背景。只需貼上專屬密鑰，3 分鐘內完成全系統對接，讓您的店面瞬間升級 AI 模式。

              </p>

              <div className="flex gap-2">

                <span className="px-2 py-1 bg-white/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#無須寫程式</span>

                <span className="px-2 py-1 bg-white/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#串接 LINE 官方帳號</span>

                <span className="px-2 py-1 bg-white/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#3分鐘上線</span>

              </div>

            </motion.div>

          </div>

        </div>

      </section>



      {/* 分隔線 */}

      <div className="max-w-7xl mx-auto px-6">

        <div className="border-b-4 border-gray-500/50"></div>

      </div>



      {/* LINE AI 核心生態 */}

      <section id="line-integration" className="py-32 px-6 bg-[#050505] relative overflow-hidden">

        {/* 背景浮水印 */}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">

          <span className="text-[400px] font-black text-white leading-none">LINE</span>

        </div>



        <div className="max-w-7xl mx-auto relative z-10">

          {/* 標題區 */}

          <div className="text-center mb-20">

            <h2 className="text-4xl md:text-7xl font-black mb-6 text-white tracking-tight">

              Digital Manager <span className="text-red-600">x</span> LINE

            </h2>

            <p className="text-2xl text-gray-400 font-medium mb-8">

              讓 LINE 帳號成為具備「大腦」的自動化經營中心

            </p>

            <p className="text-lg text-gray-500 leading-relaxed max-w-3xl mx-auto">

              我們不只是串接 LINE，而是將 Google Gemini 的理解能力注入您的官方帳號。

              讓您的店面從「被動等回覆」升級為「主動偵測需求、自動成交預約」。

            </p>

          </div>



          {/* 中間連接動畫區 */}

          <div className="flex items-center justify-center gap-8 mb-16">

            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border-2 border-red-600 shadow-[0_0_30px_rgba(255,0,0,0.3)]">

              <span className="text-white font-bold text-2xl">LINE</span>

            </div>

            <div className="flex items-center gap-2">

              <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-red-400 animate-pulse"></div>

              <span className="text-red-600 text-3xl font-bold">×</span>

              <div className="w-12 h-0.5 bg-gradient-to-r from-red-400 to-red-600 animate-pulse"></div>

            </div>

            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border-2 border-red-600 shadow-[0_0_30px_rgba(255,0,0,0.3)]">

              <img src="/Gemini_logo.png.png" alt="Gemini" className="w-10 h-10 object-contain filter brightness-0 invert" />

            </div>

          </div>



          {/* 三欄式特色點 */}

          <div className="grid md:grid-cols-3 gap-8">

            {/* AI 語意識別 */}

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

              <h3 className="text-2xl font-bold text-white mb-4">AI 語意識別</h3>

              <p className="text-gray-400 leading-relaxed mb-6">

                不再依賴死板的關鍵字。AI 能讀懂客戶的口語需求，像真人一樣在 LINE 聊天室進行推銷與解答。

              </p>

              <div className="flex gap-2">

                <span className="px-2 py-1 bg-white/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#Gemini1.5支持</span>

                <span className="px-2 py-1 bg-white/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#自然語言理解</span>

                <span className="px-2 py-1 bg-white/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#語意分析</span>

              </div>

            </motion.div>



            {/* 自動化提醒觸發 */}

            <motion.div

              initial={{ opacity: 0, y: 60 }}

              whileInView={{ opacity: 1, y: 0 }}

              viewport={{ once: true }}

              transition={{ duration: 0.6, delay: 0.2 }}

              className="h-full p-8 bg-[#0A0A0A] border border-white/10 rounded-2xl hover:border-red-600 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_rgba(255,0,0,0.3)] transition-all duration-300 group"

            >

              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">

                <Clock className="w-8 h-8 text-white" />

              </div>

              <h3 className="text-2xl font-bold text-white mb-4">自動化提醒觸發</h3>

              <p className="text-gray-400 leading-relaxed mb-6">

                串接 LINE 通知機制。無論是預約成功、離峰促銷或是會員生日，AI 都會精準抓時機發送訊息。

              </p>

              <div className="flex gap-2">

                <span className="px-2 py-1 bg-white/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#100%訊息抵達</span>

                <span className="px-2 py-1 bg-white/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#智能時機判斷</span>

                <span className="px-2 py-1 bg-white/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#自動化營銷</span>

              </div>

            </motion.div>



            {/* 無感式數據收集 */}

            <motion.div

              initial={{ opacity: 0, y: 60 }}

              whileInView={{ opacity: 1, y: 0 }}

              viewport={{ once: true }}

              transition={{ duration: 0.6, delay: 0.4 }}

              className="h-full p-8 bg-[#0A0A0A] border border-white/10 rounded-2xl hover:border-red-600 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_rgba(255,0,0,0.3)] transition-all duration-300 group"

            >

              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">

                <LayoutDashboard className="w-8 h-8 text-white" />

              </div>

              <h3 className="text-2xl font-bold text-white mb-4">無感式數據收集</h3>

              <p className="text-gray-400 leading-relaxed mb-6">

                在與客戶聊天的過程中，AI 會自動將對話轉化為標籤存入後台，幫助您在 LINE 上建立精準的客群畫像。

              </p>

              <div className="flex gap-2">

                <span className="px-2 py-1 bg-white/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#無須下載App</span>

                <span className="px-2 py-1 bg-white/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#自動客戶標籤</span>

                <span className="px-2 py-1 bg-white/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#精準客群畫像</span>

              </div>

            </motion.div>

          </div>

        </div>

      </section>



      {/* 行業應用情境 */}
      <section id="industry-scenarios" className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6">適用於各種行業</h2>
            <p className="text-xl text-gray-500 font-medium">看看 AI 如何改變您的營運模式</p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* 左側：行業切換按鈕 */}
            <div className="space-y-4">
              {Object.keys(industries).map((industry) => (
                <button
                  key={industry}
                  onClick={() => setSelectedIndustry(industry)}
                  className={`w-full text-left p-6 rounded-2xl transition-all duration-300 relative ${
                    selectedIndustry === industry
                      ? 'bg-black text-white'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:border-red-600 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_rgba(255,0,0,0.3)] border border-transparent'
                  }`}
                >
                  {selectedIndustry === industry && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-red-600 rounded-r-full"></div>
                  )}
                  <h3 className={`text-2xl font-bold ${selectedIndustry === industry ? 'text-white' : 'text-gray-600'}`}>
                    {industry}
                  </h3>
                  <p className={`mt-2 ${selectedIndustry === industry ? 'text-gray-300' : 'text-gray-400'}`}>
                    {industries[industry].keyBenefit}
                  </p>
                </button>
              ))}
            </div>

            {/* 右側：手機 Mockup */}
            <div className="relative">
              <div className="bg-black rounded-[3rem] p-3 shadow-2xl shadow-black/30">
                <div className="bg-white rounded-[2.5rem] overflow-hidden">
                  {/* 手機頂部 */}
                  <div className="bg-gray-100 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-xs font-bold text-gray-600">LINE</span>
                    </div>
                    <div className="w-20 h-1 bg-gray-300 rounded-full"></div>
                  </div>

                  {/* 聊天區域 */}
                  <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {/* 功能點列表 */}
                    <div className="pb-4 border-b border-gray-200 flex gap-2 flex-wrap">
                      {industries[selectedIndustry].features.map((feature, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + idx * 0.1 }}
                          className="flex items-center gap-2"
                        >
                          <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs text-gray-600 font-medium"><TypewriterText key={`${selectedIndustry}-${idx}`} text={feature} speed={0.05} /></span>
                        </motion.div>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      {industries[selectedIndustry].chatMessages.map((msg, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: msg.type === 'user' ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: msg.type === 'user' ? -20 : 20 }}
                          transition={{ duration: 0.3, delay: idx * 0.1 }}
                          className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] p-3 rounded-2xl ${
                            msg.type === 'user'
                              ? 'bg-black text-white rounded-br-sm'
                              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                          }`}>
                            <p className="text-sm leading-relaxed"><TypewriterText key={`${selectedIndustry}-${idx}`} text={msg.text} speed={0.05} /></p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* 輸入區域 */}
                  <div className="bg-gray-100 px-4 py-3 flex items-center gap-2">
                    <div className="flex-1 h-10 bg-white rounded-full border border-gray-200"></div>
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* 數據背書 */}
      <section className="py-24 px-6 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white leading-relaxed">懂生意，更懂你的不容易</h2>
            <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-3xl mx-auto">
              我們不玩技術名詞。Digital Manager 的目標很簡單：幫你分擔瑣事，讓你把時間留給更重要的客人。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-0">
            {/* 數據一 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="px-8 py-12 md:border-r border-dashed border-white/10 md:border-b-0 border-b hover:bg-white/5 hover:shadow-[0_0_30px_rgba(255,0,0,0.15)] transition-all duration-300 group"
            >
              <div className="text-6xl font-black mb-4">
                <span className="text-red-600">
                  <NumberTicker value={365} duration={2.5} />
                </span>
                <span className="text-white"> 天</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">您的全年無休店長</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                不論深夜或連假，AI 始終在線，隨時為您的客戶提供溫暖回應。
              </p>
            </motion.div>

            {/* 數據二 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="px-8 py-12 md:border-r border-dashed border-white/10 md:border-b-0 border-b hover:bg-white/5 hover:shadow-[0_0_30px_rgba(255,0,0,0.15)] transition-all duration-300 group"
            >
              <div className="text-6xl font-black mb-4">
                <span className="text-red-600">高</span>
                <span className="text-white">情商</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">懂溝通的智慧大腦</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                搭載 Google 領先技術，能像真人一樣理解客人的需求，讓對話不再冷冰冰。
              </p>
            </motion.div>

            {/* 數據三 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="px-8 py-12 hover:bg-white/5 hover:shadow-[0_0_30px_rgba(255,0,0,0.15)] transition-all duration-300 group"
            >
              <div className="text-6xl font-black mb-4">
                <span className="text-red-600">
                  <NumberTicker value={0} duration={2.5} />
                </span>
                <span className="text-white"> 遺漏</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">在乎每一位進店的客人</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                我們確保每一則諮詢都得到即時處理，把路過的詢問通通變成真正的成交。
              </p>
            </motion.div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-xs text-gray-500">
              與您一樣，我們也在創業路上，更理解您對效率的追求。
            </p>
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

              <Link href="/register" className="block w-full py-4 bg-gray-50 text-black text-center rounded-2xl font-black group-hover:bg-black group-hover:text-white hover:border-red-600 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(255,0,0,0.3)] transition-all border-2 border-transparent">

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

              <Link href="/register" className="block w-full py-4 bg-white text-black text-center rounded-2xl font-black hover:bg-gray-100 hover:border-red-600 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(255,0,0,0.3)] transition-all border-2 border-transparent">

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

