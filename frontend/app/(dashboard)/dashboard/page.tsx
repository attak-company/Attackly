"use client";

import { Users, CalendarCheck, MessageCircle, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const stats = [
  { label: "今日預約", value: "12", icon: CalendarCheck, trend: "+2" },
  { label: "AI 回覆次數", value: "148", icon: MessageCircle, trend: "+24%" },
  { label: "新客戶", value: "5", icon: Users, trend: "+1" },
  { label: "成交轉換率", value: "68%", icon: TrendingUp, trend: "+5%" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="商戶總覽" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{item.value}</p>
              </div>
              <div className="p-3 bg-black/5 rounded-lg">
                <item.icon className="w-6 h-6 text-black" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">{item.trend}</span>
              <span className="text-gray-500 ml-2">較昨日</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96 flex flex-col">
          <h3 className="font-bold text-lg mb-4">近期預約</h3>
          <div className="flex-1 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-50 rounded-lg">
            [行事曆預覽圖表]
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96 flex flex-col">
          <h3 className="font-bold text-lg mb-4">AI 對話概況</h3>
          <div className="flex-1 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-50 rounded-lg">
            [對話趨勢圖表]
          </div>
        </div>
      </div>
    </div>
  );
}
