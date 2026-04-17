"use client";

import { MousePointerClick, DollarSign, MessageCircle, TrendingUp, Clock } from "lucide-react";
import { useState, useEffect } from "react";
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
} from "recharts";

export default function DashboardPage() {
  const [timePeriod, setTimePeriod] = useState<"7d" | "4w" | "3m">("7d");
  const [chartType, setChartType] = useState<"conversions" | "revenue" | "conversations">("conversions");
  const [savedHours, setSavedHours] = useState(0);

  // 對話總量數據（模擬）
  const totalConversations = 156;

  // 計算省下的小時數：對話總量 * 1.5 分鐘 / 60
  const calculatedHours = (totalConversations * 1.5) / 60;

  // Count-up 動畫效果
  useEffect(() => {
    let start = 0;
    const end = calculatedHours;
    const duration = 1500; // 1.5秒
    const increment = end / (duration / 16); // 每幀增加的值

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setSavedHours(end);
        clearInterval(timer);
      } else {
        setSavedHours(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, []);

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

  const chartData = chartDataMap[timePeriod][chartType];

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

  return (
    <div className="space-y-6">
      {/* 數據更新標註 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-full">
          <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse" />
          <span className="text-xs text-zinc-600 font-medium">數據每周日晚間零點更新</span>
        </div>
      </div>

      {/* 頂部戰績卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 成功導流數 */}
        <div
          onClick={() => setChartType("conversions")}
          className={`bg-white p-6 rounded-2xl shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
            chartType === "conversions" ? "border-red-500" : "border-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <MousePointerClick className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-sm text-red-600 font-medium">較上週提升 15%</span>
          </div>
          <h3 className="text-sm font-medium text-zinc-600 mb-1">成功導流數</h3>
          <p className="text-3xl font-bold text-zinc-900">42</p>
        </div>

        {/* 預估營收貢獻 */}
        <div
          onClick={() => setChartType("revenue")}
          className={`bg-white p-6 rounded-2xl shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
            chartType === "revenue" ? "border-red-500" : "border-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-sm text-red-600 font-medium">較上週提升 12%</span>
          </div>
          <h3 className="text-sm font-medium text-zinc-600 mb-1">預估營收貢獻</h3>
          <p className="text-3xl font-bold text-zinc-900">$33,600</p>
        </div>

        {/* 對話總量 */}
        <div
          onClick={() => setChartType("conversations")}
          className={`bg-white p-6 rounded-2xl shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
            chartType === "conversations" ? "border-red-500" : "border-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <MessageCircle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-sm text-red-600 font-medium">較上週提升 18%</span>
          </div>
          <h3 className="text-sm font-medium text-zinc-600 mb-1">對話總量</h3>
          <p className="text-3xl font-bold text-zinc-900">156則</p>
        </div>

        {/* AI 省時偵測器 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-zinc-600 mb-1">AI 已為您省下</h3>
          <p className="text-3xl font-bold text-zinc-900">{savedHours.toFixed(1)}h</p>
          <p className="text-xs text-zinc-500 mt-1 whitespace-nowrap">您可以將這些時間專注於服務品質與生活。</p>
        </div>
      </div>

      {/* AI 銷售轉換趨勢圖表 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-zinc-900">{chartTitleMap[chartType]}</h2>
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

        {/* 圖表類型切換大按鈕 */}
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

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#27272a',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: any) => {
                const formattedValue = chartType === "revenue" ? `$${value.toLocaleString()}` : value;
                return [`${formattedValue} ${chartUnitMap[chartType]}`, "總計"];
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorConversions)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 熱門關鍵字標籤雲 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
        <h2 className="text-lg font-bold text-zinc-900 mb-4">熱門詢問關鍵字</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <span className="text-zinc-900 font-medium">#日式指甲</span>
            <span className="text-xs text-zinc-500 ml-auto">42 次詢問</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <span className="text-zinc-900 font-medium">#漸層色</span>
            <span className="text-xs text-zinc-500 ml-auto">35 次詢問</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-zinc-200 text-zinc-900 rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <span className="text-zinc-900 font-medium">#凝膠指甲</span>
            <span className="text-xs text-zinc-500 ml-auto">28 次詢問</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-zinc-100 text-zinc-700 rounded-full flex items-center justify-center text-sm font-bold">4</span>
            <span className="text-zinc-900 font-medium">#手繪圖案</span>
            <span className="text-xs text-zinc-500 ml-auto">22 次詢問</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-zinc-100 text-zinc-700 rounded-full flex items-center justify-center text-sm font-bold">5</span>
            <span className="text-zinc-900 font-medium">#光療指甲</span>
            <span className="text-xs text-zinc-500 ml-auto">18 次詢問</span>
          </div>
        </div>
        <p className="text-xs text-zinc-500 mt-4">基於最近 7 天的客戶對話分析</p>
      </div>
    </div>
  );
}
