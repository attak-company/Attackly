"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock } from "lucide-react";

const bookings = [
  { id: 1, name: "林小美", service: "美甲保養", time: "14:00 - 15:30", color: "bg-blue-100 text-blue-800" },
  { id: 2, name: "陳大文", service: "足部修整", time: "16:00 - 17:00", color: "bg-purple-100 text-purple-800" },
  { id: 3, name: "張思思", service: "深層SPA", time: "18:00 - 20:00", color: "bg-green-100 text-green-800" },
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">預約行事曆</h2>
          <p className="text-gray-500 mt-2">管理您的工作時段與所有客戶預約。</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          手動新增預約
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar View */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">2024年 3月</h3>
            <div className="flex space-x-2">
              <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                今天
              </button>
              <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
            {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
              <div key={day} className="bg-gray-50 p-2 text-center text-xs font-bold text-gray-500 uppercase">
                {day}
              </div>
            ))}
            {Array.from({ length: 31 }).map((_, i) => (
              <div key={i} className="bg-white min-h-[120px] p-2 hover:bg-gray-50 transition-colors group cursor-pointer relative">
                <span className={`text-sm font-medium ${i + 1 === 21 ? 'bg-black text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700'}`}>
                  {i + 1}
                </span>
                
                {i + 1 === 21 && (
                  <div className="mt-2 space-y-1">
                    {bookings.map((booking) => (
                      <div key={booking.id} className={`text-[10px] p-1 rounded ${booking.color} truncate font-medium`}>
                        {booking.time} {booking.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Bookings Panel */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="font-bold text-lg mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-black" />
              今日待處理
            </h4>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="p-4 border border-gray-100 rounded-lg hover:border-black/50 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-black uppercase">{booking.time}</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-[10px] rounded text-gray-500 group-hover:bg-black/10 group-hover:text-black">確認中</span>
                  </div>
                  <h5 className="font-bold text-gray-900">{booking.name}</h5>
                  <p className="text-xs text-gray-500">{booking.service}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/5 rounded-xl p-6 border border-black/10">
            <h4 className="font-bold text-black mb-2 flex items-center text-sm">
              <CalendarIcon className="w-4 h-4 mr-2" />
              設定工作時間
            </h4>
            <p className="text-xs text-black/80 leading-relaxed">
              您的店鋪預設為 10:00 - 20:00，AI 會根據此時段進行自動排程。
            </p>
            <button className="mt-4 text-xs font-bold text-black hover:underline">
              前往商家設定 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
