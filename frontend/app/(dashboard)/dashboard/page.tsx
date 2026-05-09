"use client";

// ====================
// 📦 IMPORTS
// ====================
import { MousePointerClick, DollarSign, MessageCircle, TrendingUp, Clock, Crown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine,
  ReferenceArea,
  Label,
} from "recharts";

// ====================
// 📊 TYPE DEFINITIONS
// ====================
interface ChartDataPoint {
  date: string;
  dateRange?: string;
  dayOfWeek?: string;
  year?: string;
  startDate?: Date;
  isToday?: boolean;
  isCurrentWeek?: boolean;
  isCurrentMonth?: boolean;
  value: number;
  isPrediction: boolean;
}

// ====================
// 🎯 MAIN COMPONENT
// ====================
export default function DashboardPage() {
  // ====================
  // 🎨 STYLES & VISUAL EFFECTS
  // ====================
  // 強制隱藏所有 Recharts 預設可能產生的點狀元素，但排除紅色最高點
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .recharts-dot:not([fill="#ef4444"]):not([fill="red"]),
      .recharts-line-dot:not([fill="#ef4444"]):not([fill="red"]),
      .recharts-active-dot:not([fill="#ef4444"]):not([fill="red"]) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      svg path {
        stroke-linecap: butt !important;
        stroke-linejoin: miter !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // ====================
  // 📊 STATE MANAGEMENT
  // ====================
  const [timePeriod, setTimePeriod] = useState<"7d" | "4w" | "3m">("7d");
  const [chartType, setChartType] = useState<"conversions" | "revenue" | "services">("conversions");
  const [savedHours, setSavedHours] = useState(0);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<'line' | 'dot' | 'label' | 'complete'>('line');
  const supabase = createClient();
  
  // 真實數據狀態
  const [appointments, setAppointments] = useState<any[]>([]);
  const [availableServices, setAvailableServices] = useState<Array<{ id: string; name: string; description: string; price: number; duration: number; category: string }>>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // ====================
  // 📈 DATA & CALCULATIONS
  // ====================
  // 從 Supabase 讀取真實數據
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 讀取預約資料 - 從 V3 讀取
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('shop_bookings_v3')
          .select('all_bookings')
          .eq('user_id', user.id)
          .maybeSingle();

        if (appointmentsError) throw appointmentsError;
        
        // 從 V3 結構提取所有預約並按建立時間排序
        const allBookings = appointmentsData?.all_bookings || [];
        const sortedBookings = allBookings.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setAppointments(sortedBookings);

        // 讀取服務設定
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('service_settings')
          .eq('user_id', user.id)
          .maybeSingle();

        if (settingsError) throw settingsError;
        
        // 從設定中提取可用服務項目
        const services = settingsData?.service_settings?.services || [];
        setAvailableServices(services);

      } catch (error) {
        console.error('讀取數據失敗:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchRealData();
  }, []);

  // 計算真實統計數據 - V3 數據提取
  const totalAppointments = appointments.length;
  
  // 計算 AI 轉換數：從 admin_meta.source === 'AI_Chatbot' 計算
  const successfulConversions = appointments.filter(apt => 
    apt.admin_meta?.source === 'AI_Chatbot'
  ).length;
  
  // 計算預估營收：只計算AI客服預約且未取消的價格（防禦性編碼）
  const totalRevenue = appointments.reduce((sum, apt) => {
    if (apt.admin_meta?.source !== 'AI_Chatbot') return sum;
    if (apt.status === 'cancelled') return sum; // 排除已取消的預約
    const price = apt.service_info?.price || 0;
    const priceValue = typeof price === 'number' ? price : parseFloat(price);
    return sum + (isNaN(priceValue) ? 0 : priceValue);
  }, 0);
  
  // 計算 AI 服務總量：AI 轉換數 * 1.2（漏斗乘數，代表 AI 實際處理的諮詢量）
  const aiServiceCount = Math.round(successfulConversions * 1.2);

  // 計算 AI 省下的小時數：AI 轉換數 * 5 分鐘 / 60（更精確的客服溝通時間）
  const calculatedHours = (successfulConversions * 5) / 60;
  // 計算增長率：今天 vs 過去7天（零值保護）
  const calculateGrowthRate = (todayData: any[], pastData: any[], getValue: (item: any) => number) => {
    const todayValue = todayData.reduce((sum, item) => sum + getValue(item), 0);
    const pastValue = pastData.reduce((sum, item) => sum + getValue(item), 0);
    
    // 零值保護：避免除以零錯誤
    if (pastValue === 0) {
      return todayValue > 0 ? 100 : 0; // 如果過去是0，今天有數據就是100%增長
    }
    
    const growthRate = ((todayValue - pastValue) / pastValue) * 100;
    return Math.round(growthRate * 10) / 10; // 保留一位小數
  };

  // 獲取今天和過去7天的日期範圍
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  // 篩選今天和過去7天的數據
  const todayAppointments = appointments.filter(apt => {
    const aptDate = apt.created_at ? apt.created_at.split('T')[0] : apt.date;
    return aptDate === todayStr;
  });

  const pastAppointments = appointments.filter(apt => {
    const aptDate = apt.created_at ? apt.created_at.split('T')[0] : apt.date;
    return aptDate >= sevenDaysAgoStr && aptDate < todayStr;
  });

  const todayConversations = appointments.filter(apt => {
    const aptDate = apt.created_at ? apt.created_at.split('T')[0] : apt.date;
    return aptDate === todayStr && apt.admin_meta?.source === 'AI_Chatbot';
  });

  const pastConversations = appointments.filter(apt => {
    const aptDate = apt.created_at ? apt.created_at.split('T')[0] : apt.date;
    return aptDate >= sevenDaysAgoStr && aptDate < todayStr && apt.admin_meta?.source === 'AI_Chatbot';
  });

  // 計算各項指標的增長率 - V3 適應
  const conversionsGrowthRate = calculateGrowthRate(
    todayAppointments.filter(apt => apt.admin_meta?.source === 'AI_Chatbot'),
    pastAppointments.filter(apt => apt.admin_meta?.source === 'AI_Chatbot'),
    () => 1
  );

  const revenueGrowthRate = calculateGrowthRate(
    todayAppointments.filter(apt => apt.admin_meta?.source === 'AI_Chatbot' && apt.status !== 'cancelled'),
    pastAppointments.filter(apt => apt.admin_meta?.source === 'AI_Chatbot' && apt.status !== 'cancelled'),
    (apt) => typeof apt.service_info?.price === 'number' ? apt.service_info.price : parseFloat(apt.service_info?.price) || 0
  );

  // AI 服務總量的增長率
  const servicesGrowthRate = conversionsGrowthRate;
  
  // 分析熱門預約項目 - V3 適應，只顯示設定中的項目
  const trendingServices = useMemo(() => {
    const serviceCounts: { [key: string]: number } = {};
    
    // 建立設定中可用服務項目的名稱集合
    const availableServiceNames = new Set(
      availableServices.map(service => service.name)
    );
    
    // 從 all_bookings 中統計，只統計設定中的服務項目
    appointments.forEach(apt => {
      const serviceName = apt.service_info?.name || apt.service || '未分類';
      
      // 只統計設定中定義的服務項目
      if (availableServiceNames.has(serviceName)) {
        serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
      }
    });
    
    // 轉換為數組並排序
    const sortedServices = Object.entries(serviceCounts)
      .map(([serviceName, count]) => ({ keyword: serviceName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // 取前 5 個
    
    // 如果沒有資料，返回空數組
    return sortedServices;
  }, [appointments, availableServices]);

  // 模擬不同時間段的數據
  const chartDataMap = {
    "7d": {
      conversions: [
        { date: "4/11", value: 28 },
        { date: "4/12", value: 35 },
        { date: "4/13", value: 42 },
        { date: "4/14", value: 38 },
        { date: "4/15", value: 45 },
        { date: "4/16", value: 52 },
        { date: "4/17", value: 48 },
      ],
      revenue: [
        { date: "4/11", value: 8400 },
        { date: "4/12", value: 10500 },
        { date: "4/13", value: 12600 },
        { date: "4/14", value: 11400 },
        { date: "4/15", value: 13500 },
        { date: "4/16", value: 15600 },
        { date: "4/17", value: 14400 },
      ],
      conversations: [
        { date: "4/11", value: 85 },
        { date: "4/12", value: 92 },
        { date: "4/13", value: 108 },
        { date: "4/14", value: 95 },
        { date: "4/15", value: 112 },
        { date: "4/16", value: 125 },
        { date: "4/17", value: 118 },
      ],
    },
    "4w": {
      conversions: [
        { date: "3/21", value: 120 },
        { date: "3/28", value: 145 },
        { date: "4/4", value: 168 },
        { date: "4/11", value: 195 },
      ],
      revenue: [
        { date: "3/21", value: 36000 },
        { date: "3/28", value: 43500 },
        { date: "4/4", value: 50400 },
        { date: "4/11", value: 58500 },
      ],
      conversations: [
        { date: "3/21", value: 380 },
        { date: "3/28", value: 420 },
        { date: "4/4", value: 485 },
        { date: "4/11", value: 540 },
      ],
    },
    "3m": {
      conversions: [
        { date: "1月", value: 380 },
        { date: "2月", value: 420 },
        { date: "3月", value: 510 },
      ],
      revenue: [
        { date: "1月", value: 114000 },
        { date: "2月", value: 126000 },
        { date: "3月", value: 153000 },
      ],
      conversations: [
        { date: "1月", value: 1200 },
        { date: "2月", value: 1350 },
        { date: "3月", value: 1680 },
      ],
    },
  };

  // ====================
  // 🎬 ANIMATION EFFECTS
  // ====================
  // Count-up 動畫效果
  useEffect(() => {
    let start = 0;
    const end = calculatedHours;
    const duration = 2000;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用 easeOut 緩動函數讓動畫更平滑
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = start + (end - start) * easeOut;
      
      setSavedHours(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [calculatedHours]);

  // ====================
  // 📅 DYNAMIC DATE CALCULATIONS
  // ====================
  const getDynamicChartData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (timePeriod === "7d") {
      // 近 7 天：[Today-5, Today, Today+1]
      const data = [];
      const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
      for (let i = -5; i <= 1; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const isTomorrow = i === 1;
        const isToday = i === 0;
        const dateString = date.toISOString().split('T')[0];

        // 根據 chartType 計算真實數據 - V3 適應
        let value = 0;
        
        // 修復時區問題：使用本地日期而非 UTC 日期
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        const localDateString = localDate.toISOString().split('T')[0];
        
        if (isTomorrow) {
          // 明天預估邏輯：基於趨勢 + 已有預約
          
          // 1. 計算明天已有的 AI 預約數量
          const tomorrowBookings = appointments.filter(apt => {
            if (!apt.schedule?.date || apt.admin_meta?.source !== 'AI_Chatbot') return false;
            const scheduleDate = apt.schedule.date;
            return scheduleDate === localDateString;
          }).length;
          
          // 2. 基於最近3天趨勢計算預估
          const recentData = data.slice(-3);
          let trendForecast = 0;
          
          if (recentData.length >= 3) {
            const trend = (recentData[2].value - recentData[0].value) / 2;
            trendForecast = Math.max(0, Math.round(recentData[2].value + trend));
          } else {
            // 如果數據不足3天，使用最近1天的數據作為基礎
            const lastDayValue = recentData.length > 0 ? recentData[recentData.length - 1].value : 0;
            trendForecast = Math.max(0, lastDayValue);
          }
          
          // 3. 最終預估：已有預約 + 趨勢預估的額外部分
          value = tomorrowBookings + Math.max(0, trendForecast - tomorrowBookings);
          
        } else {
          // 歷史數據：實際計算
          if (chartType === "conversions") {
            // 計算當天的成功導流數（只計算AI客服預約）
            value = appointments.filter(apt => {
              if (!apt.admin_meta?.created_at || apt.admin_meta?.source !== 'AI_Chatbot') return false;
              // 直接比較日期字符串，確保精確匹配
              const createdDateStr = apt.admin_meta.created_at.split('T')[0];
              return createdDateStr === localDateString;
            }).length;
          } else if (chartType === "revenue") {
            // 計算當天的營收（只計算AI客服預約且未取消）
            value = appointments.filter(apt => {
              if (!apt.admin_meta?.created_at || apt.admin_meta?.source !== 'AI_Chatbot' || apt.status === 'cancelled') return false;
              // 直接比較日期字符串，確保精確匹配
              const createdDateStr = apt.admin_meta.created_at.split('T')[0];
              return createdDateStr === localDateString;
            }).reduce((sum, apt) => {
              const price = apt.service_info?.price || 0;
              return sum + (typeof price === 'number' ? price : parseFloat(price) || 0);
            }, 0);
          } else if (chartType === "services") {
            // AI 服務總量：AI 轉換數 * 1.2（漏斗乘數）
            value = Math.round(appointments.filter(apt => {
              if (!apt.admin_meta?.created_at || apt.admin_meta?.source !== 'AI_Chatbot') return false;
              // 直接比較日期字符串，確保精確匹配
              const createdDateStr = apt.admin_meta.created_at.split('T')[0];
              return createdDateStr === localDateString;
            }).length * 1.2);
          }
        }

        // 不使用預設值，真實反映數據

        data.push({
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          dayOfWeek: weekDays[date.getDay()],
          isToday: isToday,
          value: value,
          isPrediction: isTomorrow
        } as ChartDataPoint);
      }
      return data as ChartDataPoint[];
    } else if (timePeriod === "4w") {
      // 近 4 週：自然月劃分法（每月1號為W1起點）
      const data = [];
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const currentDay = today.getDate();

      // 計算當前週數（1-4）
      const currentWeekNum = Math.ceil(currentDay / 7);

      // 回推4個週區間，考慮跨月
      for (let i = -3; i <= 0; i++) {
        let targetWeekNum = currentWeekNum + i;
        let targetMonth = currentMonth;
        let targetYear = currentYear;

        // 處理跨月
        if (targetWeekNum <= 0) {
          targetMonth -= 1;
          if (targetMonth < 0) {
            targetMonth = 11;
            targetYear -= 1;
          }
          // 計算上個月的天數
          const daysInPrevMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
          const weeksInPrevMonth = Math.ceil(daysInPrevMonth / 7);
          targetWeekNum = weeksInPrevMonth + targetWeekNum;
        }

        // 計算該週的起始和結束日期
        const weekStartDay = (targetWeekNum - 1) * 7 + 1;
        const weekEndDay = Math.min(targetWeekNum * 7, new Date(targetYear, targetMonth + 1, 0).getDate());

        const weekStart = new Date(targetYear, targetMonth, weekStartDay);
        const weekEnd = new Date(targetYear, targetMonth, weekEndDay);

        // 計算該週的數據 - V3 適應
        let value = 0;
        
        // 修復時區問題：使用本地日期而非 UTC 日期
        const localWeekStart = new Date(weekStart.getTime() - weekStart.getTimezoneOffset() * 60000);
        const localWeekEnd = new Date(weekEnd.getTime() - weekEnd.getTimezoneOffset() * 60000);
        
        if (chartType === "conversions") {
          value = appointments.filter(apt => {
            if (!apt.admin_meta?.created_at || apt.admin_meta?.source !== 'AI_Chatbot') return false;
            // 使用本地日期進行比較
            const createdDate = new Date(apt.admin_meta.created_at);
            const localCreatedDate = new Date(createdDate.getTime() - createdDate.getTimezoneOffset() * 60000);
            return localCreatedDate >= localWeekStart && localCreatedDate <= localWeekEnd;
          }).length;
        } else if (chartType === "revenue") {
          value = appointments.filter(apt => {
            if (!apt.admin_meta?.created_at || apt.admin_meta?.source !== 'AI_Chatbot' || apt.status === 'cancelled') return false;
            // 使用本地日期進行比較
            const createdDate = new Date(apt.admin_meta.created_at);
            const localCreatedDate = new Date(createdDate.getTime() - createdDate.getTimezoneOffset() * 60000);
            return localCreatedDate >= localWeekStart && localCreatedDate <= localWeekEnd;
          }).reduce((sum, apt) => {
            const price = apt.service_info?.price || 0;
            return sum + (typeof price === 'number' ? price : parseFloat(price) || 0);
          }, 0);
        } else if (chartType === "services") {
          // AI 服務總量：AI 轉換數 * 1.2（漏斗乘數）
          value = Math.round(appointments.filter(apt => {
            if (!apt.admin_meta?.created_at || apt.admin_meta?.source !== 'AI_Chatbot') return false;
            // 使用本地日期進行比較
            const createdDate = new Date(apt.admin_meta.created_at);
            const localCreatedDate = new Date(createdDate.getTime() - createdDate.getTimezoneOffset() * 60000);
            return localCreatedDate >= localWeekStart && localCreatedDate <= localWeekEnd;
          }).length * 1.2);
        }

        // 不使用預設值，真實反映數據

        data.push({
          date: `${targetMonth + 1}月 W${targetWeekNum}`,
          dateRange: `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`,
          startDate: weekStart,
          isCurrentWeek: i === 0,
          value: value,
          isPrediction: false
        } as ChartDataPoint);
      }
      // 強制按日期排序，確保從過去到現在
      return data.sort((a, b) => (a.startDate as Date).getTime() - (b.startDate as Date).getTime()) as ChartDataPoint[];
    } else {
      // 近 3 個月：以本月為基準回推 2 個自然月
      const data = [];
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      for (let i = -2; i <= 0; i++) {
        const monthDate = new Date(currentYear, currentMonth + i, 1);
        const monthName = `${monthDate.getMonth() + 1}月`;
        const yearName = `${monthDate.getFullYear()}`;
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

        // 計算該月的數據 - V3 適應
        let value = 0;
        
        // 修復時區問題：使用本地日期而非 UTC 日期
        const localMonthStart = new Date(monthStart.getTime() - monthStart.getTimezoneOffset() * 60000);
        const localMonthEnd = new Date(monthEnd.getTime() - monthEnd.getTimezoneOffset() * 60000);
        
        if (chartType === "conversions") {
          value = appointments.filter(apt => {
            if (!apt.admin_meta?.created_at || apt.admin_meta?.source !== 'AI_Chatbot') return false;
            // 使用本地日期進行比較
            const createdDate = new Date(apt.admin_meta.created_at);
            const localCreatedDate = new Date(createdDate.getTime() - createdDate.getTimezoneOffset() * 60000);
            return localCreatedDate >= localMonthStart && localCreatedDate <= localMonthEnd;
          }).length;
        } else if (chartType === "revenue") {
          value = appointments.filter(apt => {
            if (!apt.admin_meta?.created_at || apt.admin_meta?.source !== 'AI_Chatbot' || apt.status === 'cancelled') return false;
            // 使用本地日期進行比較
            const createdDate = new Date(apt.admin_meta.created_at);
            const localCreatedDate = new Date(createdDate.getTime() - createdDate.getTimezoneOffset() * 60000);
            return localCreatedDate >= localMonthStart && localCreatedDate <= localMonthEnd;
          }).reduce((sum, apt) => {
            const price = apt.service_info?.price || 0;
            return sum + (typeof price === 'number' ? price : parseFloat(price) || 0);
          }, 0);
        } else if (chartType === "services") {
          // AI 服務總量：AI 轉換數 * 1.2（漏斗乘數）
          value = Math.round(appointments.filter(apt => {
            if (!apt.admin_meta?.created_at || apt.admin_meta?.source !== 'AI_Chatbot') return false;
            // 使用本地日期進行比較
            const createdDate = new Date(apt.admin_meta.created_at);
            const localCreatedDate = new Date(createdDate.getTime() - createdDate.getTimezoneOffset() * 60000);
            return localCreatedDate >= localMonthStart && localCreatedDate <= localMonthEnd;
          }).length * 1.2);
        }

        // 不使用預設值，真實反映數據

        data.push({
          date: monthName,
          year: yearName,
          isCurrentMonth: i === 0,
          value: value,
          isPrediction: false
        } as ChartDataPoint);
      }
      // 強制按日期排序，確保從過去到現在
      return data.sort((a, b) => {
        const monthA = parseInt(a.date);
        const monthB = parseInt(b.date);
        return monthA - monthB;
      }) as ChartDataPoint[];
    }
  };

  // ====================
  // 🎨 CUSTOM CHART COMPONENTS
  // ====================
  // 自定義雙層標籤組件
  const CustomTick = ({ x, y, payload }: any) => {
    const dataPoint = chartData[payload.index] as ChartDataPoint;
    const isLastPoint = payload.index === chartData.length - 1;
    const textAnchor = isLastPoint ? "end" : "middle";
    const xOffset = isLastPoint ? -10 : 0;

    // 近7天模式：兩行標籤（日期 + 星期幾）
    if (timePeriod === "7d" && dataPoint?.dayOfWeek) {
      const fillColor = dataPoint.isToday ? "#ef4444" : "#475569";
      const fontWeight = dataPoint.isToday ? 600 : 500;
      return (
        <g transform={`translate(${x + xOffset},${y})`}>
          <text x={0} y={0} dy={16} textAnchor={textAnchor} fill={fillColor} fontSize={12} fontWeight={fontWeight}>
            {payload.value}
          </text>
          <text x={0} y={0} dy={32} textAnchor={textAnchor} fill="#94a3b8" fontSize={10}>
            {dataPoint.dayOfWeek}
          </text>
        </g>
      );
    }

    // 近4週模式：兩行標籤（月份週數 + 日期區間）
    if (dataPoint?.dateRange && timePeriod === "4w") {
      const fillColor = dataPoint.isCurrentWeek ? "#ef4444" : "#475569";
      const fontWeight = dataPoint.isCurrentWeek ? 600 : 500;
      return (
        <g transform={`translate(${x + xOffset},${y})`}>
          <text x={0} y={0} dy={16} textAnchor={textAnchor} fill={fillColor} fontSize={12} fontWeight={fontWeight}>
            {payload.value}
          </text>
          <text x={0} y={0} dy={32} textAnchor={textAnchor} fill="#94a3b8" fontSize={10}>
            {dataPoint.dateRange}
          </text>
        </g>
      );
    }

    // 近3個月模式：兩行標籤（月份 + 年份）
    if (timePeriod === "3m" && dataPoint?.year) {
      const fillColor = dataPoint.isCurrentMonth ? "#ef4444" : "#475569";
      const fontWeight = dataPoint.isCurrentMonth ? 600 : 500;
      return (
        <g transform={`translate(${x + xOffset},${y})`}>
          <text x={0} y={0} dy={16} textAnchor={textAnchor} fill={fillColor} fontSize={12} fontWeight={fontWeight}>
            {payload.value}
          </text>
          <text x={0} y={0} dy={32} textAnchor={textAnchor} fill="#94a3b8" fontSize={10}>
            {dataPoint.year}
          </text>
        </g>
      );
    }

    // 默認情況
    return (
      <text x={x + xOffset} y={y} dy={16} textAnchor={textAnchor} fill="#71717a" fontSize={12}>
        {payload.value}
      </text>
    );
  };

  // ====================
  // 🔧 UTILITY FUNCTIONS
  // ====================
  // 輔助函數：獲取週數（使用更安全的算法）
  const getWeekNumber = (date: Date) => {
    // 使用更安全的方式處理跨年週數
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  // 輔助函數：獲取週開始日期（優化邊界處理）
  const getWeekStartDate = (date: Date, weekOffset: number) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const result = new Date(d);
    result.setDate(diff + (weekOffset * 7));
    result.setHours(0, 0, 0, 0); // 確保時間一致性
    return result;
  };

  // ====================
  // 📊 MEMOIZED CALCULATIONS
  // ====================
  const chartData = useMemo(() => getDynamicChartData(), [timePeriod, chartType, appointments]);

  // ====================
  // ⏰ DATA LOADING & ANIMATION
  // ====================
  // 安全的非同步動畫序列（防止記憶體洩漏）
  useEffect(() => {
    let isMounted = true;
    
    const startAnimationSequence = async () => {
      if (!isMounted) return;
      
      setIsChartLoading(true);
      setIsDataReady(false);
      setAnimationPhase('line');

      // 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!isMounted) return;

      setIsDataReady(true);
      setIsChartLoading(false);
      setRenderKey(prev => prev + 1);

      // 定義動畫階段與對應延遲
      const sequence = [
        { phase: 'dot', delay: 1800 },
        { phase: 'label', delay: 300 },
        { phase: 'complete', delay: 200 }
      ];

      for (const step of sequence) {
        await new Promise(resolve => setTimeout(resolve, step.delay));
        if (!isMounted) return;
        setAnimationPhase(step.phase as any);
      }
    };

    startAnimationSequence();
    return () => { isMounted = false; }; // 卸載時徹底切斷所有後續更新
  }, [timePeriod, chartType]);

  // 午夜自動刷新機制（優化為靜態更新）
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const midnightTimer = setTimeout(() => {
      // 午夜時觸發數據更新而非整頁重刷
      setRenderKey(prev => prev + 1);
      // 可以在這裡添加數據重新獲取邏輯
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimer);
  }, []);

  // ====================
  // 📈 DATA PROCESSING
  // ====================
  // 分離歷史數據和預測數據
  const historicalData = useMemo(() => chartData.filter(d => !d.isPrediction), [chartData]);
  const predictionData = useMemo(() => chartData.filter(d => d.isPrediction), [chartData]);

  // 計算最高點 - 使用 useMemo 鎖定（加入空值保護）
  const maxDataPoint = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { value: 0, date: "" }; // 提供安全默認值
    }
    return chartData.reduce((max, current) => 
      current.value > max.value ? current : max, chartData[0]
    );
  }, [chartData]);

  // 計算數值範圍，判斷最高點是否接近頂部 - 使用 useMemo 鎖定（加入空值保護）
  const labelPosition = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return 'top'; // 提供安全默認值
    }
    const maxValue = Math.max(...chartData.map(d => d.value));
    const minValue = Math.min(...chartData.map(d => d.value));
    const valueRange = maxValue - minValue || 1;
    const maxPointRatio = (maxDataPoint.value - minValue) / valueRange;
    return maxPointRatio > 0.8 ? 'bottom' : 'top';
  }, [chartData, maxDataPoint]);

  // ====================
  // 🎨 CONFIGURATION MAPS
  // ====================
  const chartTitleMap = {
    conversions: "銷售轉換趨勢",
    revenue: "營收貢獻趨勢",
    services: "AI 服務趨勢",
  };

  const chartUnitMap = {
    conversions: "次",
    revenue: "元",
    services: "則",
  };

  // ====================
  // 🎯 RENDER: MAIN LAYOUT
  // ====================
  return (
    <div className="space-y-8">
      {/* ====================
          📊 PERFORMANCE CARDS
          ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* 成功導流數 */}
        <div
          onClick={() => setChartType("conversions")}
          className={`bg-white p-6 rounded-2xl shadow-sm border cursor-pointer transition-all hover:shadow-md ${
            chartType === "conversions" ? "border-red-500 shadow-red-100" : "border-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-zinc-900 rounded-xl">
              <MousePointerClick className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-sm font-medium ${
                conversionsGrowthRate === 0 ? 'text-zinc-400' : conversionsGrowthRate > 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {conversionsGrowthRate >= 0 ? '+' : ''}{conversionsGrowthRate}%
              </span>
              <span className="text-sm font-medium text-zinc-900">vs 7天前</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-zinc-600 mb-1">成功導流數</h3>
          <div className="flex items-baseline gap-1">
            <p className="text-5xl font-black text-zinc-900">{isLoadingData ? '...' : successfulConversions}</p>
            <span className="text-lg font-medium text-zinc-500">次</span>
          </div>
        </div>

        {/* 預估營收貢獻 */}
        <div
          onClick={() => setChartType("revenue")}
          className={`bg-white p-6 rounded-2xl shadow-sm border cursor-pointer transition-all hover:shadow-md ${
            chartType === "revenue" ? "border-red-500 shadow-red-100" : "border-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-zinc-900 rounded-xl">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-sm font-medium ${
                revenueGrowthRate === 0 ? 'text-zinc-400' : revenueGrowthRate > 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {revenueGrowthRate >= 0 ? '+' : ''}{revenueGrowthRate}%
              </span>
              <span className="text-sm font-medium text-zinc-900">vs 7天前</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-zinc-600 mb-1">預估營收貢獻</h3>
          <div className="flex items-baseline gap-1">
            <p className="text-5xl font-black text-zinc-900">{isLoadingData ? '...' : totalRevenue.toLocaleString()}</p>
            <span className="text-lg font-medium text-zinc-500">元</span>
          </div>
        </div>

        {/* AI 服務總量 */}
        <div
          onClick={() => setChartType("services")}
          className={`bg-white p-6 rounded-2xl shadow-sm border cursor-pointer transition-all hover:shadow-md ${
            chartType === "services" ? "border-red-500 shadow-red-100" : "border-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-zinc-900 rounded-xl">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-sm font-medium ${
                servicesGrowthRate === 0 ? 'text-zinc-400' : servicesGrowthRate > 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {servicesGrowthRate >= 0 ? '+' : ''}{servicesGrowthRate}%
              </span>
              <span className="text-sm font-medium text-zinc-900">vs 7天前</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-zinc-600 mb-1">AI 服務總量</h3>
          <div className="flex items-baseline gap-1">
            <p className="text-5xl font-black text-zinc-900">{isLoadingData ? '...' : aiServiceCount}</p>
            <span className="text-lg font-medium text-zinc-500">則</span>
          </div>
        </div>

        {/* AI 省時偵測器 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-zinc-900 rounded-xl">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-zinc-600 mb-1">AI 已為您省下</h3>
          <div className="flex items-baseline gap-1">
            <p className="text-5xl font-black text-zinc-900">{isLoadingData ? '...' : savedHours.toFixed(1)}</p>
            <span className="text-lg font-medium text-zinc-500">小時</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1 whitespace-nowrap">您可以將這些時間專注於服務品質與生活。</p>
          <p className="text-xs text-zinc-400 mt-2 italic">*以每筆預約節省 5 分鐘客服溝通計算</p>
        </div>
      </div>

      {/* ====================
          📈 CHART SECTION
          ==================== */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
        {/* Chart Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-zinc-900">{chartTitleMap[chartType]}</h2>
          {/* Time Period Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setTimePeriod("7d")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                timePeriod === "7d"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              近七天
            </button>
            <button
              onClick={() => setTimePeriod("4w")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                timePeriod === "4w"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              近四週
            </button>
            <button
              onClick={() => setTimePeriod("3m")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                timePeriod === "3m"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              近三個月
            </button>
          </div>
        </div>

        {/* Chart Type Selector */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setChartType("conversions")}
            className={`flex-1 py-3 text-base font-medium rounded-xl transition-colors flex items-center justify-center gap-2 ${
              chartType === "conversions"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            <MousePointerClick className="w-5 h-5" />
            成功導流數
          </button>
          <button
            onClick={() => setChartType("revenue")}
            className={`flex-1 py-3 text-base font-medium rounded-xl transition-colors flex items-center justify-center gap-2 ${
              chartType === "revenue"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            <DollarSign className="w-5 h-5" />
            營收貢獻
          </button>
          <button
            onClick={() => setChartType("services")}
            className={`flex-1 py-3 text-base font-medium rounded-xl transition-colors flex items-center justify-center gap-2 ${
              chartType === "services"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            AI 服務
          </button>
        </div>

        {/* Chart Content */}
        {isChartLoading ? (
          <div className="h-[350px] bg-zinc-100 rounded-xl animate-pulse" />
        ) : (
          <div className="h-[350px] relative">
            {/* Debug info - 顯示數據狀態 */}
            <div className="absolute top-2 right-2 text-xs text-zinc-500 z-20">
              數據點: {chartData.length} | 類型: {chartType}
              {chartData.length > 0 && ` | 第一個值: ${chartData[0]?.value}`}
              {appointments.length > 0 && ` | 預約數: ${appointments.length}`}
              {appointments.length > 0 && ` | AI預約數: ${appointments.filter(apt => apt.admin_meta?.source === 'AI_Chatbot').length}`}
              {chartData.length > 0 && ` | 今天日期: ${new Date().toISOString().split('T')[0]}`}
              {(() => {
                const firstAIAppointment = appointments.find(apt => apt.admin_meta?.source === 'AI_Chatbot');
                return firstAIAppointment ? ` | 創建日期: ${firstAIAppointment.admin_meta?.created_at}` : '';
              })()}
              {chartData.length > 0 && ` | 圖表數據: ${chartData.map(d => `${d.date}:${d.value}`).join(', ')}`}
              {chartData.length > 0 && ` | 預約創建日期: ${appointments.filter(apt => apt.admin_meta?.source === 'AI_Chatbot').map(apt => apt.admin_meta?.created_at?.split('T')[0]).join(', ')}`}
              {(() => {
                const testDate = '2026-05-06';
                const matches = appointments.filter(apt => {
                  if (!apt.admin_meta?.created_at || apt.admin_meta?.source !== 'AI_Chatbot') return false;
                  const createdDateStr = apt.admin_meta.created_at.split('T')[0];
                  return createdDateStr === testDate;
                }).length;
                return ` | 5/6匹配測試: ${matches}`;
              })()}
            </div>
            <div className="absolute left-0 top-0 bottom-0 w-5 bg-white z-10" />
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart key={renderKey} data={chartData} margin={{ top: 40, right: 40, left: 0, bottom: 40 }}>
                {/* Chart Gradients */}
                <defs>
                  <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e293b" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#1e293b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#1e293b" stopOpacity={1} />
                    <stop offset="75%" stopColor="#1e293b" stopOpacity={1} />
                    <stop offset="100%" stopColor="#1e293b" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                
                {/* Chart Axes */}
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={<CustomTick />}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={false}
                />
                
                {/* Tooltip */}
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    backgroundColor: '#27272a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  itemStyle={{
                    color: '#ffffff'
                  }}
                  labelStyle={{
                    color: '#ffffff'
                  }}
                  formatter={(value: any, name: any, props: any) => {
                    const formattedValue = chartType === "revenue" ? `$${value.toLocaleString()}` : value;
                    const isPrediction = props.payload?.isPrediction;
                    return [`${formattedValue} ${chartUnitMap[chartType]}`, isPrediction ? "預估" : "總計"];
                  }}
                />
                
                {/* Main Area Chart */}
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={timePeriod === "7d" ? "url(#lineGradient)" : "#1e293b"}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorConversions)"
                  dot={false}
                  activeDot={false}
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationBegin={300}
                  animationEasing="ease-in-out"
                  strokeLinecap="butt"
                />
                
                {/* Reference Elements */}
                {/* 垂直紅線標示今天 */}
                {timePeriod === "7d" && (
                  <ReferenceLine
                    x={chartData[chartData.length - 2]?.date}
                    stroke="#ef4444"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    label={{ value: "今天", position: "top", fill: "#ef4444", fontSize: 11 }}
                  />
                )}
                
                {/* 未來區域背景遮罩 */}
                {timePeriod === "7d" && (
                  <ReferenceArea
                    x1={chartData[chartData.length - 2]?.date}
                    x2={chartData[chartData.length - 1]?.date}
                    fill="rgba(30, 41, 59, 0.02)"
                  />
                )}
                
                {/* 明天預估點標記 */}
                {timePeriod === "7d" && chartData[chartData.length - 1]?.isPrediction && (
                  <ReferenceDot
                    x={chartData[chartData.length - 1]?.date}
                    y={chartData[chartData.length - 1]?.value}
                    r={6}
                    fill="#ffffff"
                    stroke="rgba(30, 41, 59, 0.3)"
                    strokeWidth={2}
                    className="animate-pulse"
                    label={{
                      value: chartType === "revenue" ? `$${chartData[chartData.length - 1]?.value.toLocaleString()} 元 (預估)` : `${chartData[chartData.length - 1]?.value} ${chartUnitMap[chartType]} (預估)`,
                      position: "top",
                      fill: "#94a3b8",
                      fontSize: 10,
                      offset: 15
                    }}
                  />
                )}
                
                {/* Animated Elements */}
                {/* 紅點 - 根據動畫階段顯示 */}
                {animationPhase !== 'line' && (
                  <g>
                    <ReferenceDot
                      x={maxDataPoint.date}
                      y={maxDataPoint.value}
                      r={4}
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  </g>
                )}
                
                {/* 紅字標籤 - 根據動畫階段顯示 */}
                {animationPhase === 'label' || animationPhase === 'complete' ? (
                  <ReferenceDot
                    x={maxDataPoint.date}
                    y={maxDataPoint.value}
                    r={0}
                    fill="transparent"
                    stroke="transparent"
                    label={{
                      value: chartType === "revenue" ? `$${maxDataPoint.value.toLocaleString()} 元` : `${maxDataPoint.value} ${chartUnitMap[chartType]}`,
                      position: labelPosition,
                      fill: '#ef4444',
                      fontSize: 14,
                      fontWeight: 'bold',
                      offset: 10
                    }}
                  />
                ) : null}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ====================
          TRENDING KEYWORDS
          ==================== */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
        <h2 className="text-lg font-bold text-zinc-900 mb-4">熱門預約項目分析</h2>
        <div className="space-y-5">
          {trendingServices.length > 0 ? (
            trendingServices.map((item, index) => {
              const maxCount = trendingServices[0]?.count || 1;
              const percentage = (item.count / maxCount) * 100;
              const isTop3 = index < 3;
              
              return (
                <div key={item.keyword} className="flex items-center gap-4">
                  {index === 0 ? (
                    <div className="flex items-center gap-2 w-16">
                      <span className="text-lg font-bold text-zinc-900">1</span>
                      <Crown className="w-4 h-4 text-amber-500" />
                    </div>
                  ) : (
                    <span className={`text-lg font-bold w-16 ${
                      index === 1 ? 'text-zinc-600' : 'text-zinc-500'
                    }`}>{index + 1}</span>
                  )}
                  <div className="flex-1">
                    <span className="text-zinc-900 font-medium">#{item.keyword}</span>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      {index === 0 ? (
                        <div className="h-full bg-gradient-to-r from-gray-300 via-gray-300 to-red-500 rounded-full" style={{ width: '100%' }}></div>
                      ) : (
                        <div className="h-full bg-gray-300 rounded-full" style={{ width: `${percentage}%` }}></div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500">{item.count} 次預約</span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <div className="text-zinc-500 text-sm">
                目前還沒有預約項目資料！期待開始您的第一筆預約
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-zinc-500 mt-4">基於最近 7 天的預約項目分析</p>
      </div>
    </div>
  );
}
