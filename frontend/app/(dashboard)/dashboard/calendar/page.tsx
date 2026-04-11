"use client";

import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  const handleYearChange = (year: number) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
    setShowYearDropdown(false);
  };

  const handleMonthChange = (monthIndex: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));
    setShowMonthDropdown(false);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="bg-gray-50 min-h-[120px] p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
      days.push(
        <div key={day} className="bg-white min-h-[120px] p-2 hover:bg-gray-50 transition-colors group cursor-pointer relative">
          <span className={`text-sm font-medium ${isToday ? 'bg-black text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700'}`}>
            {day}
          </span>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">行事曆</h2>
          <p className="text-gray-900 mt-2">查看您的工作時段與行事曆。</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            {/* Year Selector */}
            {/* Year Selector */}
            <div className="relative">
              <button
                onClick={() => setShowYearDropdown(!showYearDropdown)}
                className="flex items-center gap-1 text-xl font-bold text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
              >
                {currentDate.getFullYear()}年
                <ChevronDown className="w-4 h-4" />
              </button>
              {showYearDropdown && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleYearChange(year)}
                      className="block w-full px-4 py-2 text-left text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Month Selector */}
            <div className="relative">
              <button
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                className="flex items-center gap-1 text-xl font-bold text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
              >
                {currentDate.getMonth() + 1}月
                <ChevronDown className="w-4 h-4" />
              </button>
              {showMonthDropdown && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {months.map((month, index) => (
                    <button
                      key={month}
                      onClick={() => handleMonthChange(index)}
                      className="block w-full px-4 py-2 text-left text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      {month}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleToday}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            今天
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
          {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
            <div key={day} className="bg-gray-50 p-2 text-center text-xs font-bold text-gray-900 uppercase">
              {day}
            </div>
          ))}
          {renderCalendarDays()}
        </div>
      </div>
    </div>
  );
}
