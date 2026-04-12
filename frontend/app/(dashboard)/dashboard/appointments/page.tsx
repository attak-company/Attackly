"use client";

import { useState } from "react";
import { Plus, Clock, Check, X, Search } from "lucide-react";

const bookings = [
  { id: 1, name: "林小美", service: "美甲保養", time: "14:00 - 15:30", date: "2024-03-21", status: "confirmed" },
  { id: 2, name: "陳大文", service: "足部修整", time: "16:00 - 17:00", date: "2024-03-21", status: "pending" },
  { id: 3, name: "張思思", service: "深層SPA", time: "18:00 - 20:00", date: "2024-03-21", status: "pending" },
  { id: 4, name: "王美玲", service: "美睫造型", time: "10:00 - 11:30", date: "2024-03-22", status: "confirmed" },
  { id: 5, name: "李建國", service: "男士護理", time: "14:00 - 15:00", date: "2024-03-22", status: "pending" },
];

export default function AppointmentsPage() {
  const [filter, setFilter] = useState("all");

  const filteredBookings = filter === "all" 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">預約管理</h2>
          <p className="text-gray-700 mt-2">管理所有客戶預約與確認狀態。</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          手動新增預約
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "pending" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              待確認
            </button>
            <button
              onClick={() => setFilter("confirmed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "confirmed" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              已確認
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋客戶..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="p-4 border border-gray-100 rounded-lg hover:border-black/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-black/5 rounded-lg">
                    <Clock className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{booking.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{booking.service}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{booking.date}</span>
                      <span>{booking.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    booking.status === "confirmed" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {booking.status === "confirmed" ? "已確認" : "待確認"}
                  </span>
                  {booking.status === "pending" && (
                    <div className="flex items-center gap-1 ml-2">
                      <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
                        <Check className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
