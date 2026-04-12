"use client";







import { useEffect, useState, useRef } from "react";



import { motion, AnimatePresence } from "framer-motion";



import Link from "next/link";



import { Bot, Calendar, MessageSquare, Shield, ShieldCheck, Zap, ArrowRight, CheckCircle2, Star, Globe, Clock, LayoutDashboard, X, Check, Key, Settings, Mail } from "lucide-react";







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



  const [activeStep, setActiveStep] = useState(0);



  const [activeSection, setActiveSection] = useState('');



  const [isIndustrySectionInView, setIsIndustrySectionInView] = useState(false);



  const industrySectionRef = useRef<HTMLElement>(null);



  const sparkRef = useRef<HTMLDivElement>(null);

  const animationRef = useRef<Animation | null>(null);

  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isHoveredRef = useRef(false);

  const sparkRef2 = useRef<HTMLDivElement>(null);

  const animationRef2 = useRef<Animation | null>(null);

  const animationIntervalRef2 = useRef<NodeJS.Timeout | null>(null);

  const isHoveredRef2 = useRef(false);



  // Intersection Observer for Industry Section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setIsIndustrySectionInView(true);
            }, 300);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (industrySectionRef.current) {
      observer.observe(industrySectionRef.current);
    }

    return () => {
      if (industrySectionRef.current) {
        observer.unobserve(industrySectionRef.current);
      }
    };
  }, []);

  const handleSparkEnter = () => {
    isHoveredRef.current = true;
    if (sparkRef.current) {
      const animations = sparkRef.current.getAnimations();
      animations.forEach(anim => {
        animationRef.current = anim;
        anim.updatePlaybackRate(2);
      });
    }
  };

  const handleSparkLeave = () => {
    isHoveredRef.current = false;
    if (animationRef.current) {
      animationRef.current.updatePlaybackRate(1);
    }
  };

  const handleSparkEnter2 = () => {
    isHoveredRef2.current = true;
    if (sparkRef2.current) {
      const animations = sparkRef2.current.getAnimations();
      animations.forEach(anim => {
        animationRef2.current = anim;
        anim.updatePlaybackRate(2);
      });
    }
  };

  const handleSparkLeave2 = () => {
    isHoveredRef2.current = false;
    if (animationRef2.current) {
      animationRef2.current.updatePlaybackRate(1);
    }
  };

  useEffect(() => {
    if (sparkRef.current) {
      const checkAnimation = () => {
        if (!isHoveredRef.current && sparkRef.current) {
          const animations = sparkRef.current.getAnimations();
          animations.forEach(anim => {
            anim.updatePlaybackRate(1);
          });
        } else if (isHoveredRef.current && sparkRef.current) {
          const animations = sparkRef.current.getAnimations();
          animations.forEach(anim => {
            anim.updatePlaybackRate(2);
          });
        }
      };
      animationIntervalRef.current = setInterval(checkAnimation, 100);
    }
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (sparkRef2.current) {
      const checkAnimation = () => {
        if (!isHoveredRef2.current && sparkRef2.current) {
          const animations = sparkRef2.current.getAnimations();
          animations.forEach(anim => {
            anim.updatePlaybackRate(1);
          });
        } else if (isHoveredRef2.current && sparkRef2.current) {
          const animations = sparkRef2.current.getAnimations();
          animations.forEach(anim => {
            anim.updatePlaybackRate(2);
          });
        }
      };
      animationIntervalRef2.current = setInterval(checkAnimation, 100);
    }
    return () => {
      if (animationIntervalRef2.current) {
        clearInterval(animationIntervalRef2.current);
      }
    };
  }, []);



  useEffect(() => {

    const interval = setInterval(() => {

      setActiveStep((prev) => (prev + 1) % 3);

    }, 3000);

    return () => clearInterval(interval);

  }, []);



  // 滾動監聽器 - 追蹤當前可見的區塊

  useEffect(() => {

    const sections = ['features', 'solutions', 'setup', 'pricing'];



    const handleScroll = () => {

      const scrollPosition = window.scrollY + 100; // 偏移 100px

      let foundSection = false;



      for (const section of sections) {

        const element = document.getElementById(section);

        if (element) {

          const { offsetTop, offsetHeight } = element;

          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {

            setActiveSection(section);

            foundSection = true;

            break;

          }

        }

      }



      // 如果不在任何追蹤區塊內，重置 activeSection

      if (!foundSection) {

        setActiveSection('');

      }

    };



    window.addEventListener('scroll', handleScroll);

    handleScroll(); // 初始化檢查



    return () => window.removeEventListener('scroll', handleScroll);

  }, []);



  // 平滑滾動功能

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {

    e.preventDefault();

    const element = document.getElementById(targetId);

    if (element) {

      const offset = 80; // Header 高度偏移

      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;

      const offsetPosition = elementPosition - offset;

      

      window.scrollTo({

        top: offsetPosition,

        behavior: 'smooth'

      });

    }

  };







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



      setIsScrolled(window.scrollY > 50);



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



    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 selection:bg-[#0A0A0A] selection:text-white">



      {/* 導覽列 */}



      <nav className={`fixed top-0 left-0 right-0 z-[5000] transition-all duration-500 ease-in-out ${isScrolled ? 'bg-[#FAFAFA]/70 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>



        <div className={`max-w-7xl mx-auto px-6 flex items-center justify-between transition-all duration-500 ${isScrolled ? 'h-16' : 'h-20'}`}>



          <div className="flex items-center gap-3">



            <button

              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}

              className="relative cursor-pointer rounded-none bg-transparent overflow-hidden transition-all duration-300 ease hover:animate-[random-float_4s_ease-in-out_infinite] hover:drop-shadow-[4px_4px_8px_rgba(0,0,0,0.5)]"

            >



              <img



                src="/Logo.png"



                alt="Logo"



                className="w-14 h-14 object-contain rounded-none bg-transparent"



              />



            </button>



            <div className="flex flex-col">



              <span className="text-xl font-black tracking-tighter text-black uppercase leading-none">Digital Manager</span>



              <span className="text-xs text-gray-500 font-light tracking-wide mt-1">您的 AI 數位店長</span>



            </div>



          </div>



          <div className="flex items-center gap-8">



            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">



              <a href="#features" onClick={(e) => handleSmoothScroll(e, 'features')} className={`hover:text-red-600 transition-colors relative ${activeSection === 'features' ? 'text-red-600' : ''}`}>

                核心功能

                {activeSection === 'features' && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-600 rounded-full"></span>}

              </a>



              <a href="#solutions" onClick={(e) => handleSmoothScroll(e, 'solutions')} className={`hover:text-red-600 transition-colors relative ${activeSection === 'solutions' ? 'text-red-600' : ''}`}>

                應用場景

                {activeSection === 'solutions' && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-600 rounded-full"></span>}

              </a>



              <a href="#setup" onClick={(e) => handleSmoothScroll(e, 'setup')} className={`hover:text-red-600 transition-colors relative ${activeSection === 'setup' ? 'text-red-600' : ''}`}>

                設定流程

                {activeSection === 'setup' && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-600 rounded-full"></span>}

              </a>



              <a href="#pricing" onClick={(e) => handleSmoothScroll(e, 'pricing')} className={`hover:text-red-600 transition-colors relative ${activeSection === 'pricing' ? 'text-red-600' : ''}`}>

                價格方案

                {activeSection === 'pricing' && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-600 rounded-full"></span>}

              </a>



            </div>



            <div className="flex items-center gap-3">



              <Link href="/login" className="px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-red-600 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(255,0,0,0.3)] rounded-xl transition-all border-2 border-transparent">



                登入



              </Link>



              <Link



                href="/register"



                className="bg-[#0A0A0A] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:border-red-600 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(255,0,0,0.3)] active:scale-95 transition-all border-2 border-red-600/50 relative overflow-hidden"



              >



                <div className="absolute inset-0 bg-red-600/5 animate-pulse"></div>



                <span className="relative z-10">免費試用</span>



              </Link>



            </div>



          </div>



        </div>



      </nav>







      {/* Hero Section */}



      <section className="relative pt-44 pb-32 px-6 overflow-hidden min-h-[90vh] flex items-center">



        {/* 背景影片層 - 雙影片切換技術 (Double Buffering) */}



        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#0A0A0A]">



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



          <div className="absolute inset-0 bg-[#FAFAFA]/60 backdrop-blur-[3px] z-10"></div>



        </div>







        {/* 內容層 - 強制設定高 z-index */}



        <div className="max-w-7xl mx-auto text-center relative z-20">



          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAFAFA] border border-gray-200 text-gray-600 text-xs font-bold mb-10 uppercase tracking-widest">



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



              className="w-full sm:w-auto bg-[#0A0A0A] text-white px-10 py-5 rounded-2xl text-xl font-bold hover:border-red-600 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(255,0,0,0.3)] active:scale-95 transition-all flex items-center justify-center group border-2 border-transparent"



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

      <section className="py-32 px-6 bg-[#FAFAFA]">

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

              className="bg-[#0A0A0A] p-8 rounded-2xl border-2 border-red-600 relative overflow-hidden hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_rgba(255,0,0,0.3)] transition-all duration-300"

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



      <section id="features" className="py-32 bg-[#0A0A0A]">



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



              <div className="w-16 h-16 bg-[#FAFAFA]/10 rounded-2xl flex items-center justify-center mb-6">



                <MessageSquare className="w-8 h-8 text-white" />



              </div>



              <h3 className="text-2xl font-bold text-white mb-4">24/7 智慧導購店長</h3>



              <p className="text-gray-400 leading-relaxed mb-6">



                整合 Gemini 核心，深度學習您的價目表與知識庫。不只回覆問題，更能主動引導預約，讓服務不中斷。



              </p>



              <div className="flex gap-2">



                <span className="px-2 py-1 bg-[#FAFAFA]/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#自動報價</span>



                <span className="px-2 py-1 bg-[#FAFAFA]/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#預約諮詢</span>



                <span className="px-2 py-1 bg-[#FAFAFA]/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#人工介入機制</span>



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



              <div className="w-16 h-16 bg-[#FAFAFA]/10 rounded-2xl flex items-center justify-center mb-6">



                <LayoutDashboard className="w-8 h-8 text-white" />



              </div>



              <h3 className="text-2xl font-bold text-white mb-4">視覺化經營看板</h3>



              <p className="text-gray-400 leading-relaxed mb-6">



                告別混亂訊息與紙本紀錄。一眼掌握今日動態與本週排程，精準預估客流高峰，提升店內翻桌率。



              </p>



              <div className="flex gap-2">



                <span className="px-2 py-1 bg-[#FAFAFA]/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#今日預約熱圖</span>



                <span className="px-2 py-1 bg-[#FAFAFA]/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#自動客戶標籤</span>



                <span className="px-2 py-1 bg-[#FAFAFA]/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#翻桌率分析</span>



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



              <div className="w-16 h-16 bg-[#FAFAFA]/10 rounded-2xl flex items-center justify-center mb-6">



                <Zap className="w-8 h-8 text-white" />



              </div>



              <h3 className="text-2xl font-bold text-white mb-4">零門檻閃電部署</h3>



              <p className="text-gray-400 leading-relaxed mb-6">



                無需技術背景。只需貼上專屬密鑰，3 分鐘內完成全系統對接，讓您的店面瞬間升級 AI 模式。



              </p>



              <div className="flex gap-2">



                <span className="px-2 py-1 bg-[#FAFAFA]/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#無須寫程式</span>



                <span className="px-2 py-1 bg-[#FAFAFA]/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#串接 LINE 官方帳號</span>



                <span className="px-2 py-1 bg-[#FAFAFA]/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#3分鐘上線</span>



              </div>



            </motion.div>



          </div>



        </div>



      </section>







      {/* 分隔線 */}



      <div className="w-full relative group">
        <div className="absolute inset-0 py-8 -my-8 z-20"></div>
        <div className="w-full h-1 relative overflow-visible bg-red-600 z-10 shadow-[0_0_25px_rgba(255,0,0,0.8)] group-hover:h-2 group-hover:bg-red-500 group-hover:shadow-[0_0_30px_rgba(255,0,0,0.9)] group-hover:-translate-y-0.5 transition-all duration-300">



        <div



          ref={sparkRef}
          className="absolute top-1/2 left-0 w-24 h-16 -translate-y-1/2 -translate-x-1/2 z-50 group-hover:scale-150 group-hover:brightness-125 transition-all duration-300"
          style={{
            mixBlendMode: 'screen',
            animation: 'laser-point 10s ease-in-out infinite alternate, pulse-breath 2s ease-in-out infinite'
          }}
          onMouseEnter={handleSparkEnter}
          onMouseLeave={handleSparkLeave}



        >



          <svg



            viewBox="0 0 100 100"


            className="w-full h-full"


            style={{

              filter: 'blur(3px) brightness(1.2) drop-shadow(0 0 30px #FF0000) drop-shadow(0 0 60px #FF0000) drop-shadow(0 0 100px #FF0000)'



            }}



          >



            <defs>



              <radialGradient id="spark-gradient" cx="50%" cy="50%" r="50%">



                <stop offset="0%" stopColor="#FFFFFF" />



                <stop offset="20%" stopColor="#FF0000" />



                <stop offset="100%" stopColor="#FF0000" stopOpacity="0" />



              </radialGradient>



              <linearGradient id="reflection-fade" x1="0%" y1="0%" x2="0%" y2="100%">



                <stop offset="0%" stopColor="white" stopOpacity="0.3" />



                <stop offset="100%" stopColor="white" stopOpacity="0" />



              </linearGradient>



            </defs>



            <path



              d="M50 0 L55 40 L95 50 L55 60 L50 100 L45 60 L5 50 L45 40 Z"


              fill="url(#spark-gradient)"



            />



          </svg>



          {/* 反射陰影 */}



          <svg



            viewBox="0 0 100 100"


            className="absolute top-full left-0 w-full h-full -scale-y-100 opacity-30 blur-sm"


            style={{


              filter: 'blur(4px)',


              webkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%)',


              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%)'


            }}


          >



            <path



              d="M50 0 L55 40 L95 50 L55 60 L50 100 L45 60 L5 50 L45 40 Z"


              fill="#FF0000"


            />



          </svg>



        </div>



      </div>
      </div>







      {/* LINE AI 核心生態 */}



      <section id="line-integration" className="py-32 px-6 bg-[#0A0A0A] relative overflow-hidden">



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



            <div className="w-16 h-16 rounded-2xl bg-[#FAFAFA]/5 flex items-center justify-center border-2 border-red-600 shadow-[0_0_30px_rgba(255,0,0,0.3)]">



              <span className="text-white font-bold text-2xl">LINE</span>



            </div>



            <div className="flex items-center gap-2">



              <div className="w-12 h-0.5 bg-gradient-to-r from-red-600 to-red-400 animate-pulse"></div>



              <span className="text-red-600 text-3xl font-bold">×</span>



              <div className="w-12 h-0.5 bg-gradient-to-r from-red-400 to-red-600 animate-pulse"></div>



            </div>



            <div className="w-16 h-16 rounded-2xl bg-[#FAFAFA]/5 flex items-center justify-center border-2 border-red-600 shadow-[0_0_30px_rgba(255,0,0,0.3)]">



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



              <div className="w-16 h-16 bg-[#FAFAFA]/10 rounded-2xl flex items-center justify-center mb-6">



                <MessageSquare className="w-8 h-8 text-white" />



              </div>



              <h3 className="text-2xl font-bold text-white mb-4">AI 語意識別</h3>



              <p className="text-gray-400 leading-relaxed mb-6">



                不再依賴死板的關鍵字。AI 能讀懂客戶的口語需求，像真人一樣在 LINE 聊天室進行推銷與解答。



              </p>



              <div className="flex gap-2">



                <span className="px-2 py-1 bg-[#FAFAFA]/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#Gemini1.5支持</span>



                <span className="px-2 py-1 bg-[#FAFAFA]/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#自然語言理解</span>



                <span className="px-2 py-1 bg-[#FAFAFA]/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#語意分析</span>



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



              <div className="w-16 h-16 bg-[#FAFAFA]/10 rounded-2xl flex items-center justify-center mb-6">



                <Clock className="w-8 h-8 text-white" />



              </div>



              <h3 className="text-2xl font-bold text-white mb-4">自動化提醒觸發</h3>



              <p className="text-gray-400 leading-relaxed mb-6">



                串接 LINE 通知機制。無論是預約成功、離峰促銷或是會員生日，AI 都會精準抓時機發送訊息。



              </p>



              <div className="flex gap-2">



                <span className="px-2 py-1 bg-[#FAFAFA]/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#100%訊息抵達</span>



                <span className="px-2 py-1 bg-[#FAFAFA]/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#智能時機判斷</span>



                <span className="px-2 py-1 bg-[#FAFAFA]/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#自動化營銷</span>



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



              <div className="w-16 h-16 bg-[#FAFAFA]/10 rounded-2xl flex items-center justify-center mb-6">



                <LayoutDashboard className="w-8 h-8 text-white" />



              </div>



              <h3 className="text-2xl font-bold text-white mb-4">無感式數據收集</h3>



              <p className="text-gray-400 leading-relaxed mb-6">



                在與客戶聊天的過程中，AI 會自動將對話轉化為標籤存入後台，幫助您在 LINE 上建立精準的客群畫像。



              </p>



              <div className="flex gap-2">



                <span className="px-2 py-1 bg-[#FAFAFA]/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#無須下載App</span>



                <span className="px-2 py-1 bg-[#FAFAFA]/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#自動客戶標籤</span>



                <span className="px-2 py-1 bg-[#FAFAFA]/5 text-gray-500 text-xs rounded-full border border-white/10 group-hover:text-red-400 transition-colors">#精準客群畫像</span>



              </div>



            </motion.div>



          </div>



        </div>



      </section>







      {/* 行業應用情境 */}

      <section ref={industrySectionRef} id="solutions" className="py-32 px-6 bg-[#FAFAFA]">

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

                      ? 'bg-[#0A0A0A] text-white'

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

              <div className="bg-[#0A0A0A] rounded-[3rem] p-3 shadow-2xl shadow-black/30">

                <div className="bg-[#FAFAFA] rounded-[2.5rem] overflow-hidden">

                  {/* 手機頂部 */}

                  <div className="bg-gray-100 px-6 py-4 flex items-center justify-between">

                    <div className="flex items-center gap-2">

                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>

                      <span className="text-xs font-bold text-gray-600">LINE</span>

                    </div>

                    <div className="w-20 h-1 bg-gray-300 rounded-full"></div>

                  </div>



                  {/* 聊天區域 */}

                  <div key={selectedIndustry} className="h-96 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-gray-50 scrollbar-hide">

                    {/* 功能點列表 */}

                    <div className="pb-4 border-b border-gray-200 flex gap-2 flex-wrap">

                      {industries[selectedIndustry].features.map((feature, idx) => (

                        <motion.div

                          key={idx}

                          initial={{ opacity: 0, x: -20 }}

                          animate={isIndustrySectionInView || selectedIndustry !== '餐飲服務' ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}

                          transition={{ delay: 0.5 + idx * (feature.length * 0.05 + 0.2) }}

                          className="flex items-center gap-2"

                        >

                          <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">

                            <CheckCircle2 className="w-3 h-3 text-white" />

                          </div>

                          <span className="text-xs text-gray-600 font-medium"><TypewriterText key={`${selectedIndustry}-${idx}`} text={feature} speed={0.05} /></span>

                        </motion.div>

                      ))}

                    </div>



                    <AnimatePresence mode="popLayout">

                      {industries[selectedIndustry].chatMessages.map((msg, idx) => {

                        // 計算功能點標籤的總時間

                        const featuresTotalTime = industries[selectedIndustry].features.reduce((acc, feature, fIdx) => {

                          return acc + (fIdx === 0 ? 0.5 : 0) + feature.length * 0.05 + 0.2;

                        }, 0);



                        // 計算之前訊息的總時間

                        const previousMessagesTime = industries[selectedIndustry].chatMessages.slice(0, idx).reduce((acc, prevMsg) => {

                          return acc + prevMsg.text.length * 0.05 + 0.3;

                        }, 0);



                        const totalDelay = featuresTotalTime + previousMessagesTime;



                        return (

                          <motion.div

                            key={idx}

                            initial={{ opacity: 0, x: msg.type === 'user' ? 20 : -20 }}

                            animate={isIndustrySectionInView || selectedIndustry !== '餐飲服務' ? { opacity: 1, x: 0 } : { opacity: 0, x: msg.type === 'user' ? 20 : -20 }}

                            exit={{ opacity: 0, x: msg.type === 'user' ? -20 : 20 }}

                            transition={{ duration: 0.3, delay: totalDelay }}

                            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}

                          >

                            <div className={`max-w-[80%] p-3 rounded-2xl ${

                              msg.type === 'user'

                                ? 'bg-[#0A0A0A] text-white rounded-br-sm'

                                : 'bg-[#FAFAFA] text-gray-800 border border-gray-200 rounded-bl-sm'

                            }`}>

                              <p className="text-sm leading-relaxed"><TypewriterText key={`${selectedIndustry}-${idx}`} text={msg.text} speed={0.05} /></p>

                            </div>

                          </motion.div>

                        );

                      })}

                    </AnimatePresence>

                  </div>



                  {/* 輸入區域 */}

                  <div className="bg-gray-100 px-4 py-3 flex items-center gap-2">

                    <div className="flex-1 h-10 bg-[#FAFAFA] rounded-full border border-gray-200"></div>

                    <div className="w-10 h-10 bg-[#0A0A0A] rounded-full flex items-center justify-center">

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

      <section className="py-24 px-6 bg-[#0A0A0A]">

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

              className="px-8 py-12 md:border-r border-dashed border-white/10 md:border-b-0 border-b hover:bg-[#FAFAFA]/5 hover:shadow-[0_0_30px_rgba(255,0,0,0.15)] transition-all duration-300 group"

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

              className="px-8 py-12 md:border-r border-dashed border-white/10 md:border-b-0 border-b hover:bg-[#FAFAFA]/5 hover:shadow-[0_0_30px_rgba(255,0,0,0.15)] transition-all duration-300 group"

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

              className="px-8 py-12 hover:bg-[#FAFAFA]/5 hover:shadow-[0_0_30px_rgba(255,0,0,0.15)] transition-all duration-300 group"

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







      {/* 分隔線 */}

      <div className="w-full relative group">
        <div className="absolute inset-0 py-8 -my-8 z-20"></div>
        <div className="w-full h-1 relative overflow-visible bg-red-600 z-10 shadow-[0_0_25px_rgba(255,0,0,0.8)] group-hover:h-2 group-hover:bg-red-500 group-hover:shadow-[0_0_30px_rgba(255,0,0,0.9)] group-hover:-translate-y-0.5 transition-all duration-300">

        <div
          ref={sparkRef2}
          className="absolute top-1/2 left-0 w-24 h-16 -translate-y-1/2 -translate-x-1/2 z-50 group-hover:scale-150 group-hover:brightness-125 transition-all duration-300"
          style={{
            mixBlendMode: 'screen',
            animation: 'laser-point 10s ease-in-out infinite alternate, pulse-breath 2s ease-in-out infinite'
          }}
          onMouseEnter={handleSparkEnter2}
          onMouseLeave={handleSparkLeave2}
        >
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            style={{
              filter: 'blur(3px) brightness(1.2) drop-shadow(0 0 30px #FF0000) drop-shadow(0 0 60px #FF0000) drop-shadow(0 0 100px #FF0000)'
            }}
          >
            <defs>
              <radialGradient id="spark-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="20%" stopColor="#FF0000" />
                <stop offset="100%" stopColor="#FF0000" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="reflection-fade" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M50 0 L55 40 L95 50 L55 60 L50 100 L45 60 L5 50 L45 40 Z"
              fill="url(#spark-gradient)"
            />
          </svg>
          {/* 反射陰影 */}
          <svg
            viewBox="0 0 100 100"
            className="absolute top-full left-0 w-full h-full -scale-y-100 opacity-30 blur-sm"
            style={{
              filter: 'blur(4px)',
              webkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%)',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%)'
            }}
          >
            <path
              d="M50 0 L55 40 L95 50 L55 60 L50 100 L45 60 L5 50 L45 40 Z"
              fill="#FF0000"
            />
          </svg>
        </div>
      </div>
      </div>







      {/* 設定預覽區塊 */}

      <section id="setup" className="py-24 px-6 bg-[#0A0A0A]">

        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-16">

            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white leading-relaxed">只需三步，喚醒您的專屬店長</h2>

            <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-3xl mx-auto">

              我們將複雜的技術藏在後台。您只需完成簡單設定，即可擁有一位懂生意、有溫度的 AI 夥伴。

            </p>

          </div>



          {/* 三步驟橫向流程 */}

          <div className="relative">

            {/* 紅色連線線條 - 帶流動的呼吸燈效果 */}

            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50 transform -translate-y-1/2 hidden md:block">

              <motion.div

                animate={{

                  left: activeStep === 0 ? '0%' : activeStep === 1 ? '33%' : '66%',

                  width: activeStep === 0 ? '33%' : activeStep === 1 ? '33%' : '33%',

                  opacity: [0.2, 1, 0.2],

                }}

                transition={{

                  duration: 3,

                  repeat: Infinity,

                  ease: [0.4, 0, 0.2, 1],

                }}

                className="absolute top-0 h-full bg-gradient-to-r from-transparent via-red-400 to-transparent"

              />

            </div>



            <div className="grid md:grid-cols-3 gap-8 relative z-10">

              {/* Step 01 */}

              <motion.div

                initial={{ opacity: 0, y: 30 }}

                whileInView={{ opacity: 1, y: 0 }}

                viewport={{ once: true }}

                transition={{ duration: 0.6 }}

                whileHover={{ scale: 1.05, borderColor: 'rgba(255, 0, 0, 1)' }}

                className="bg-[#0A0A0A] border border-white/10 p-8 rounded-2xl hover:shadow-[0_0_40px_rgba(255,0,0,0.2)] transition-all duration-300 relative overflow-hidden"

              >

                {activeStep === 0 && (

                  <motion.div

                    animate={{

                      boxShadow: [

                        "inset 0 0 15px rgba(255, 0, 0, 0.05)",

                        "inset 0 0 50px rgba(255, 0, 0, 0.25)",

                        "inset 0 0 15px rgba(255, 0, 0, 0.05)",

                      ],

                    }}

                    transition={{

                      duration: 3,

                      repeat: Infinity,

                      ease: [0.4, 0, 0.2, 1],

                    }}

                    className="absolute inset-0 pointer-events-none"

                  />

                )}

                <div className="flex items-center gap-3 mb-4">

                  <motion.div

                    animate={{

                      color: activeStep === 0 ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)',

                      scale: activeStep === 0 ? 1.1 : 1,

                    }}

                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}

                  >

                    <Key className="w-8 h-8" />

                  </motion.div>

                  <motion.div

                    animate={{

                      color: activeStep === 0 ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)',

                      scale: activeStep === 0 ? 1.1 : 1,

                    }}

                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}

                    className="text-5xl font-black"

                  >

                    01

                  </motion.div>

                </div>

                <h3 className="text-xl font-bold text-white mb-3">貼入 LINE「專屬密鑰」</h3>

                <p className="text-sm text-gray-400 leading-relaxed mb-4">

                  簡單貼上連線代碼，讓您的 LINE 官方帳號瞬間具備智慧核心。

                </p>

                <p className="text-xs text-gray-500">別擔心，我們備有 1 分鐘新手引導，保證一看就會。</p>

              </motion.div>



              {/* Step 02 - 帶紅色呼吸燈特效 */}

              <motion.div

                initial={{ opacity: 0, y: 30 }}

                whileInView={{ opacity: 1, y: 0 }}

                viewport={{ once: true }}

                transition={{ duration: 0.6, delay: 0.2 }}

                whileHover={{ scale: 1.05, borderColor: 'rgba(255, 0, 0, 1)' }}

                className="bg-[#0A0A0A] border border-white/10 p-8 rounded-2xl hover:shadow-[0_0_40px_rgba(255,0,0,0.2)] transition-all duration-300 relative overflow-hidden"

              >

                {activeStep === 1 && (

                  <motion.div

                    animate={{

                      boxShadow: [

                        "inset 0 0 15px rgba(255, 0, 0, 0.05)",

                        "inset 0 0 50px rgba(255, 0, 0, 0.25)",

                        "inset 0 0 15px rgba(255, 0, 0, 0.05)",

                      ],

                    }}

                    transition={{

                      duration: 3,

                      repeat: Infinity,

                      ease: [0.4, 0, 0.2, 1],

                    }}

                    className="absolute inset-0 pointer-events-none"

                  />

                )}

                <div className="flex items-center gap-3 mb-4">

                  <motion.div

                    animate={{

                      color: activeStep === 1 ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)',

                      scale: activeStep === 1 ? 1.1 : 1,

                    }}

                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}

                  >

                    <Settings className="w-8 h-8" />

                  </motion.div>

                  <motion.div

                    animate={{

                      color: activeStep === 1 ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)',

                      scale: activeStep === 1 ? 1.1 : 1,

                    }}

                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}

                    className="text-5xl font-black"

                  >

                    02

                  </motion.div>

                </div>

                <h3 className="text-xl font-bold text-white mb-3">AI 模型設置（注入靈魂）</h3>

                <p className="text-sm text-gray-400 leading-relaxed mb-4">

                  輸入店家基本資料（如價目表、店內規章），並設定 AI 的服務語氣（如：親切、專業或幽默）。

                </p>

                <p className="text-xs text-gray-500">這是店長的養成過程，讓他成為最懂您店面的人。</p>

              </motion.div>



              {/* Step 03 */}

              <motion.div

                initial={{ opacity: 0, y: 30 }}

                whileInView={{ opacity: 1, y: 0 }}

                viewport={{ once: true }}

                transition={{ duration: 0.6, delay: 0.4 }}

                whileHover={{ scale: 1.05, borderColor: 'rgba(255, 0, 0, 1)' }}

                className="bg-[#0A0A0A] border border-white/10 p-8 rounded-2xl hover:shadow-[0_0_40px_rgba(255,0,0,0.2)] transition-all duration-300 relative overflow-hidden"

              >

                {activeStep === 2 && (

                  <motion.div

                    animate={{

                      boxShadow: [

                        "inset 0 0 15px rgba(255, 0, 0, 0.05)",

                        "inset 0 0 50px rgba(255, 0, 0, 0.25)",

                        "inset 0 0 15px rgba(255, 0, 0, 0.05)",

                      ],

                    }}

                    transition={{

                      duration: 3,

                      repeat: Infinity,

                      ease: [0.4, 0, 0.2, 1],

                    }}

                    className="absolute inset-0 pointer-events-none"

                  />

                )}

                <div className="flex items-center gap-3 mb-4">

                  <motion.div

                    animate={{

                      color: activeStep === 2 ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)',

                      scale: activeStep === 2 ? 1.1 : 1,

                    }}

                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}

                  >

                    <Zap className="w-8 h-8" />

                  </motion.div>

                  <motion.div

                    animate={{

                      color: activeStep === 2 ? 'rgb(239, 68, 68)' : 'rgb(220, 38, 38)',

                      scale: activeStep === 2 ? 1.1 : 1,

                    }}

                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}

                    className="text-5xl font-black"

                  >

                    03

                  </motion.div>

                </div>

                <h3 className="text-xl font-bold text-white mb-3">店長正式上線</h3>

                <p className="text-sm text-gray-400 leading-relaxed mb-4">

                  點擊啟動，AI 數位店長便開始 24H 守護您的諮詢與預約。

                </p>

                <p className="text-xs text-gray-500">現在，您可以放心把瑣事交給他，專心服務眼前的客人。</p>

              </motion.div>

            </div>

          </div>



          {/* 垂直連接線 - 從第二步驟到系統狀態 */}

          <div className="relative mt-0 hidden md:block" style={{ height: '48px' }}>

            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-red-500 to-transparent opacity-50 transform -translate-x-1/2">

              <motion.div

                animate={{

                  top: activeStep === 1 ? '0%' : '50%',

                  height: activeStep === 1 ? '100%' : '0%',

                  opacity: [0.2, 1, 0.2],

                }}

                transition={{

                  duration: 3,

                  repeat: Infinity,

                  ease: [0.4, 0, 0.2, 1],

                }}

                className="absolute left-0 right-0 bg-gradient-to-b from-transparent via-red-400 to-transparent"

              />

            </div>

          </div>



          {/* 手機預覽畫面 */}

          <div className="mt-0 flex justify-center relative">

            <motion.div

              initial={{ opacity: 0, scale: 0.9 }}

              whileInView={{ opacity: 1, scale: 1 }}

              viewport={{ once: true }}

              transition={{ duration: 0.6, delay: 0.6 }}

              className="bg-[#0A0A0A] rounded-3xl p-6 max-w-sm w-full border-2 border-white/10 relative overflow-hidden"

            >

              {activeStep === 1 && (

                <motion.div

                  animate={{

                    boxShadow: [

                      "inset 0 0 15px rgba(255, 0, 0, 0.05)",

                      "inset 0 0 50px rgba(255, 0, 0, 0.25)",

                      "inset 0 0 15px rgba(255, 0, 0, 0.05)",

                    ],

                  }}

                  transition={{

                    duration: 3,

                    repeat: Infinity,

                    ease: [0.4, 0, 0.2, 1],

                  }}

                  className="absolute inset-0 pointer-events-none"

                />

              )}

              <div className="flex items-center justify-between mb-4">

                <div className="flex items-center gap-2">

                  <motion.div

                    animate={{

                      scale: [1, 1.2, 1],

                      opacity: [1, 0.7, 1],

                    }}

                    transition={{

                      duration: 1.5,

                      repeat: Infinity,

                      ease: "easeInOut",

                    }}

                    className="w-3 h-3 bg-green-500 rounded-full"

                  />

                  <span className="text-white font-bold text-sm">系統狀態</span>

                </div>

                <span className="text-green-500 font-bold text-sm">運行中</span>

              </div>

              <div className="bg-[#0A0A0A] rounded-xl p-4">

                <div className="space-y-2">

                  <div className="flex items-center gap-2">

                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />

                    <span className="text-gray-400 text-xs">LINE 連線：正常</span>

                  </div>

                  <div className="flex items-center gap-2">

                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />

                    <span className="text-gray-400 text-xs">AI 引擎：運作中</span>

                  </div>

                  <div className="flex items-center gap-2">

                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />

                    <span className="text-gray-400 text-xs">訊息處理：即時</span>

                  </div>

                </div>

              </div>

            </motion.div>

          </div>

        </div>

      </section>







      {/* 價格方案 - 白色版本 */}



      <section id="pricing" className="py-32 px-6 bg-[#FAFAFA]">



        <div className="max-w-7xl mx-auto">



          <div className="text-center mb-20">



            <h2 className="text-4xl md:text-6xl font-black mb-6 text-gray-900">選擇最適合您的經營方案</h2>



            <p className="text-xl text-gray-500 font-medium">先試用，再決定。我們與您一同成長。</p>



          </div>



          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">



            {/* 基礎啟航版 (Free) */}



            <div className="p-10 bg-[#FAFAFA] border-2 border-gray-200 rounded-[32px] hover:border-gray-300 transition-all group">



              <h4 className="text-xl font-bold mb-2 text-gray-900">基礎啟航版 (Basic)</h4>



              <div className="flex items-baseline gap-1 mb-8">



                <span className="text-5xl font-black text-gray-900">$0</span>



                <span className="text-gray-500 font-bold">/月</span>



              </div>



              <ul className="space-y-4 mb-10">



                {["基礎 AI 自動回覆", "LINE 密鑰對接", "標準語氣設置"].map((item, i) => (



                  <li key={i} className="flex items-center gap-3 font-bold text-gray-600">



                    <CheckCircle2 className="w-5 h-5 text-gray-300" /> {item}



                  </li>



                ))}



              </ul>



              <Link href="/register" className="block w-full py-4 bg-[#FAFAFA] text-gray-900 text-center rounded-2xl font-black border-2 border-gray-300 hover:border-gray-900 hover:-translate-y-1 transition-all">



                立即開始



              </Link>



              <p className="text-sm text-gray-400 mt-4 text-center">註冊帳號即可永久使用。</p>



            </div>



            {/* 專業經營版 (Pro) */}



            <motion.div



              className="p-10 bg-[#0A0A0A] text-white rounded-[32px] relative overflow-hidden border-2 border-red-500/30 shadow-[0_0_20px_rgba(255,0,0,0.2)]"



              whileHover={{



                boxShadow: "0 0 40px rgba(255, 0, 0, 0.4)",



                y: -8,



              }}



              transition={{



                duration: 0.3,



                ease: [0.4, 0, 0.2, 1],



              }}



            >



              <div className="absolute top-6 right-6 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">



                HOT



              </div>



              <div className="absolute top-6 left-6 bg-[#0A0A0A] border-2 border-red-500 text-red-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">



                早鳥支持價



              </div>



              <h4 className="text-xl font-bold mb-2 text-white mt-8">專業經營版 (Pro)</h4>



              <div className="flex items-baseline gap-1 mb-8">



                <span className="text-5xl font-black text-red-500">NT$ 799</span>



                <span className="text-gray-400 font-bold">/月</span>



              </div>



              <ul className="space-y-4 mb-10">



                {["Gemini 1.5 Pro 完整大腦", "視覺化經營看板", "高級自定義語氣", "優先客服支援"].map((item, i) => (



                  <li key={i} className="flex items-center gap-3 font-bold text-gray-200">



                    <CheckCircle2 className="w-5 h-5 text-red-400" /> {item}



                  </li>



                ))}



              </ul>



              <Link href="/register" className="block w-full py-4 bg-red-500 text-white text-center rounded-2xl font-black hover:bg-red-600 hover:-translate-y-1 transition-all">



                開始 7 天免費試用



              </Link>



              <p className="text-sm text-gray-400 mt-4 text-center">每天不到 30 元，換取一位 24 小時在線的 AI 店長。</p>



              <div className="flex items-center justify-center gap-2 mt-3">



                <ShieldCheck className="w-4 h-4 text-red-500" />



                <span className="text-sm font-bold text-red-500">首創 7 天無條件退費保證</span>



              </div>



            </motion.div>



          </div>



          {/* 信任標章 */}



          <div className="flex justify-center gap-8 mt-16">



            {["隨時取消訂閱", "安全加密支付", "7 天滿意保證"].map((item, i) => (



              <div key={i} className="flex items-center gap-2 text-gray-500 font-medium">



                <CheckCircle2 className="w-5 h-5 text-gray-400" />



                <span className="text-sm">{item}</span>



              </div>



            ))}



          </div>



        </div>



      </section>







      {/* Site Footer */}



      <footer className="bg-[#0A0A0A] border-t border-white/5 pt-16 pb-8">



        <div className="max-w-7xl mx-auto px-6">



          {/* 四欄佈局 */}



          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">



            {/* 第一欄：品牌與精神 */}



            <div>



              <div className="mb-6">



                <img 



                  src="/Logo.png" 



                  alt="Digital Manager Logo" 



                  className="w-12 h-12 object-contain mb-4"



                />



                <h3 className="text-white font-bold text-lg mb-2">Digital Manager</h3>



              </div>



              <p className="text-gray-400 text-sm leading-relaxed">



                您的 AI 數位店長 — 讓經營回歸簡單。



              </p>



            </div>







            {/* 第二欄：產品服務 */}



            <div>



              <h4 className="text-white font-bold mb-4">產品服務</h4>



              <ul className="space-y-3">



                <li>



                  <Link href="#features" className="text-gray-400 text-sm hover:text-white transition-colors">



                    核心功能



                  </Link>



                </li>



                <li>



                  <Link href="#industry-scenarios" className="text-gray-400 text-sm hover:text-white transition-colors">



                    行業應用



                  </Link>



                </li>



                <li>



                  <Link href="#pricing" className="text-gray-400 text-sm hover:text-white transition-colors">



                    價格方案



                  </Link>



                </li>



              </ul>



            </div>







            {/* 第三欄：技術支援 */}



            <div>



              <h4 className="text-white font-bold mb-4">技術支援</h4>



              <ul className="space-y-3">



                <li>



                  <Link href="#" className="text-gray-400 text-sm hover:text-white transition-colors">



                    新手教學



                  </Link>



                </li>



                <li>



                  <Link href="#" className="text-gray-400 text-sm hover:text-white transition-colors">



                    API 說明



                  </Link>



                </li>



                <li>



                  <Link href="#" className="text-gray-400 text-sm hover:text-white transition-colors">



                    常見問題



                  </Link>



                </li>



              </ul>



            </div>







            {/* 第四欄：聯繫我們 */}



            <div>



              <h4 className="text-white font-bold mb-4">聯繫我們</h4>



              <ul className="space-y-3">



                <li>



                  <a href="mailto:attak.company@gmail.com" className="text-gray-400 text-sm hover:text-red-500 transition-colors flex items-center gap-2">



                    <Mail className="w-4 h-4" />



                    attak.company@gmail.com



                  </a>



                </li>



                <li>



                  <a href="#" className="text-gray-400 text-sm hover:text-red-500 transition-colors flex items-center gap-2">



                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-4 h-4 fill-current">



                      <path d="M224.1 141c-63.6 0-117.1 19.9-144.6 51.4-15.8 17.9-24.4 40.1-24.4 65.2 0 27.9 11.2 54.1 31.5 73.9 23.2 22.6 57.5 35.8 94.2 37.5v45.5c0 6.5 7.4 10.2 12.6 6.4l62.2-45.2c24.7-2.5 48.1-10.5 67.4-23.2 22.3-14.8 35.1-36.3 35.1-59.4 0-25.1-8.6-47.3-24.4-65.2-27.5-31.5-81-51.4-144.6-51.4zm0 20c55.6 0 102.8 17.5 126.4 44.6 13.2 15 20.4 33.3 20.4 52 0 16.3-5.6 31.5-15.8 43.7-17.2 20.4-46.6 32.9-79.3 34.3l-4.3.2-50.5 36.7v-37.3l-4.3-.2c-32.7-1.4-62.1-13.9-79.3-34.3-10.2-12.2-15.8-27.4-15.8-43.7 0-18.7 7.2-37 20.4-52 23.6-27.1 70.8-44.6 126.4-44.6z"/>



                    </svg>



                    聯繫 LINE 專人客服



                  </a>



                </li>



                <li>



                  <a href="#" className="text-gray-400 text-sm hover:text-red-500 transition-colors flex items-center gap-2">



                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-current">



                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>



                    </svg>



                    Instagram



                  </a>



                </li>



              </ul>



            </div>



          </div>







          {/* 底部版權宣告與法律聲明 */}



          <div className="border-t border-white/5 pt-8">



            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">



              <p className="text-gray-500 text-xs">



                © 2026 Digital Manager. All rights reserved.



              </p>



              <div className="flex gap-4">



                <Link href="/privacy" className="text-gray-500 text-xs hover:text-white transition-colors">



                  隱私權政策



                </Link>



                <span className="text-gray-600 text-xs">|</span>



                <Link href="/terms" className="text-gray-500 text-xs hover:text-white transition-colors">



                  服務條款



                </Link>



              </div>



            </div>



            <p className="text-center text-gray-600 text-xs mb-4">



              Made by Attak團隊 with ❤️



            </p>



            {/* 法律免責聲明 */}



            <div className="space-y-2 text-center">



              <p className="text-[10px] text-gray-600 leading-relaxed">



                LINE is a trademark of LY Corporation. Gemini is a trademark of Google LLC. All other trademarks are the property of their respective owners.



              </p>



              <p className="text-[10px] text-gray-600 leading-relaxed">



                AI 輔助回覆僅供參考，系統不對 AI 生成內容之絕對準確性負責。



              </p>



              <p className="text-[10px] text-gray-600 leading-relaxed">



                我們重視您的隱私，所有連線均經過加密處理，確保您的密鑰與通訊紀錄安全無虞。



              </p>



              <p className="text-[10px] text-gray-600 leading-relaxed">



                7 天免費試用期內可隨時取消訂閱並申請退費。後續訂閱將依月計費，您可隨時於後台停止續約。



              </p>



            </div>



          </div>



        </div>



      </footer>



    </div>



  );



}
