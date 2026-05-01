"use client";

// ====================
// 📦 IMPORTS
// ====================
import { MousePointerClick, DollarSign, MessageCircle, TrendingUp, Clock, Crown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
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
  const [chartType, setChartType] = useState<"conversions" | "revenue" | "conversations">("conversions");
  const [savedHours, setSavedHours] = useState(0);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<'line' | 'dot' | 'label' | 'complete'>('line');

  // ====================
  // 📈 DATA & CALCULATIONS
  // ====================
  // 對話總量數據（模擬）
  const totalConversations = 156;

  // 計算省下的小時數：對話總量 * 1.5 分鐘 / 60
  const calculatedHours = (totalConversations * 1.5) / 60;

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

        // 模擬數據 - 實際應從後端獲取
        const baseValue = chartType === "conversions" ? 30 :
                         chartType === "revenue" ? 9000 : 120;
        const randomFactor = 0.8 + Math.random() * 0.4;
        const value = Math.round(baseValue * randomFactor * (i === 1 ? 0.9 : 1));

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

        // 模擬數據
        const baseValue = chartType === "conversions" ? 120 :
                         chartType === "revenue" ? 36000 : 400;
        const randomFactor = 0.85 + Math.random() * 0.3;
        const value = Math.round(baseValue * randomFactor);

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

        // 模擬數據
        const baseValue = chartType === "conversions" ? 380 :
                         chartType === "revenue" ? 114000 : 1200;
        const randomFactor = 0.9 + Math.random() * 0.2;
        const value = Math.round(baseValue * randomFactor);

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
  const chartData = useMemo(() => getDynamicChartData(), [timePeriod, chartType]);

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
    conversations: "對話總量趨勢",
  };

  const chartUnitMap = {
    conversions: "次",
    revenue: "元",
    conversations: "則",
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
          className={`bg-white p-6 rounded-2xl shadow-sm border cursor-pointer transition-all hover:shadow-md group ${
            chartType === "conversions" ? "border-zinc-900" : "border-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-red-50 transition-colors">
              <MousePointerClick className="w-6 h-6 text-zinc-600 group-hover:text-red-500 transition-colors" />
            </div>
            <span className="text-sm text-emerald-600 font-medium">較上週提升 15%</span>
          </div>
          <h3 className="text-sm font-medium text-zinc-600 mb-1">成功導流數</h3>
          <p className="text-3xl font-black text-zinc-900">42</p>
        </div>

        {/* 預估營收貢獻 */}
        <div
          onClick={() => setChartType("revenue")}
          className={`bg-white p-6 rounded-2xl shadow-sm border cursor-pointer transition-all hover:shadow-md group ${
            chartType === "revenue" ? "border-zinc-900" : "border-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-red-50 transition-colors">
              <DollarSign className="w-6 h-6 text-zinc-600 group-hover:text-red-500 transition-colors" />
            </div>
            <span className="text-sm text-emerald-600 font-medium">較上週提升 12%</span>
          </div>
          <h3 className="text-sm font-medium text-zinc-600 mb-1">預估營收貢獻</h3>
          <p className="text-3xl font-black text-zinc-900">$33,600</p>
        </div>

        {/* 對話總量 */}
        <div
          onClick={() => setChartType("conversations")}
          className={`bg-white p-6 rounded-2xl shadow-sm border cursor-pointer transition-all hover:shadow-md group ${
            chartType === "conversations" ? "border-zinc-900" : "border-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-red-50 transition-colors">
              <MessageCircle className="w-6 h-6 text-zinc-600 group-hover:text-red-500 transition-colors" />
            </div>
            <span className="text-sm text-emerald-600 font-medium">較上週提升 18%</span>
          </div>
          <h3 className="text-sm font-medium text-zinc-600 mb-1">對話總量</h3>
          <p className="text-3xl font-black text-zinc-900">156則</p>
        </div>

        {/* AI 省時偵測器 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-50 rounded-xl">
              <Clock className="w-6 h-6 text-zinc-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-zinc-600 mb-1">AI 已為您省下</h3>
          <p className="text-3xl font-black text-zinc-900">{savedHours.toFixed(1)}h</p>
          <p className="text-xs text-zinc-500 mt-1 whitespace-nowrap">您可以將這些時間專注於服務品質與生活。</p>
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
            onClick={() => setChartType("conversations")}
            className={`flex-1 py-3 text-base font-medium rounded-xl transition-colors flex items-center justify-center gap-2 ${
              chartType === "conversations"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            對話總量
          </button>
        </div>

        {/* Chart Content */}
        {isChartLoading ? (
          <div className="h-[350px] bg-zinc-100 rounded-xl animate-pulse" />
        ) : (
          <div className="h-[350px] relative">
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
                  data={chartData}
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
          🔥 TRENDING KEYWORDS
          ==================== */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
        <h2 className="text-lg font-bold text-zinc-900 mb-4">熱門詢問關鍵字</h2>
        <div className="space-y-5">
          {/* #1 日式指甲 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-16">
              <span className="text-lg font-bold text-zinc-900">1</span>
              <Crown className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1">
              <span className="text-zinc-900 font-medium">#日式指甲</span>
              <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-gray-300 via-gray-300 to-red-500 rounded-full"></div>
              </div>
            </div>
            <span className="text-xs text-zinc-500">42 次詢問</span>
          </div>
          
          {/* #2 漸層色 */}
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-zinc-600 w-16">2</span>
            <div className="flex-1">
              <span className="text-zinc-900 font-medium">#漸層色</span>
              <div className="h-1.5 bg-gray-100 rounded-full mt-2">
                <div className="h-full bg-gray-300 rounded-full" style={{ width: '83%' }}></div>
              </div>
            </div>
            <span className="text-xs text-zinc-500">35 次詢問</span>
          </div>
          
          {/* #3 凝膠指甲 */}
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-zinc-600 w-16">3</span>
            <div className="flex-1">
              <span className="text-zinc-900 font-medium">#凝膠指甲</span>
              <div className="h-1.5 bg-gray-100 rounded-full mt-2">
                <div className="h-full bg-gray-300 rounded-full" style={{ width: '67%' }}></div>
              </div>
            </div>
            <span className="text-xs text-zinc-500">28 次詢問</span>
          </div>
          
          {/* #4 手繪圖案 */}
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-zinc-500 w-16">4</span>
            <div className="flex-1">
              <span className="text-zinc-900 font-medium">#手繪圖案</span>
              <div className="h-1.5 bg-gray-100 rounded-full mt-2">
                <div className="h-full bg-gray-300 rounded-full" style={{ width: '52%' }}></div>
              </div>
            </div>
            <span className="text-xs text-zinc-500">22 次詢問</span>
          </div>
          
          {/* #5 光療指甲 */}
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-zinc-500 w-16">5</span>
            <div className="flex-1">
              <span className="text-zinc-900 font-medium">#光療指甲</span>
              <div className="h-1.5 bg-gray-100 rounded-full mt-2">
                <div className="h-full bg-gray-300 rounded-full" style={{ width: '43%' }}></div>
              </div>
            </div>
            <span className="text-xs text-zinc-500">18 次詢問</span>
          </div>
        </div>
        <p className="text-xs text-zinc-500 mt-4">基於最近 7 天的客戶對話分析</p>
      </div>
    </div>
  );
}
