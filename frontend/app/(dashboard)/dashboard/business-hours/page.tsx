"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Plus, Trash2, Calendar as CalendarIcon, X, Check, AlertTriangle } from "lucide-react";

// 國定假日資料（台灣）
const taiwanHolidays = [
  { month: 1, day: 1, name: "元旦" },
  { month: 2, day: 10, name: "農曆新年" },
  { month: 2, day: 11, name: "農曆新年" },
  { month: 2, day: 12, name: "農曆新年" },
  { month: 4, day: 4, name: "兒童節" },
  { month: 4, day: 5, name: "清明節" },
  { month: 6, day: 10, name: "端午節" },
  { month: 9, day: 29, name: "中秋節" },
  { month: 10, day: 10, name: "國慶日" },
];

const weekdays = ["週一", "週二", "週三", "週四", "週五", "週六", "週日"];

interface TimeSlot {
  start: string;
  end: string;
}

interface WeeklySchedule {
  [key: string]: {
    enabled: boolean;
    timeSlots: TimeSlot[];
  };
}

interface Exception {
  date: string; // YYYY-MM-DD
  type: "closed" | "custom";
  timeSlots?: TimeSlot[];
}

export default function BusinessHoursPage() {
  // 數據結構
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({
    mon: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
    tue: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
    wed: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
    thu: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
    fri: { enabled: true, timeSlots: [{ start: "09:00", end: "18:00" }] },
    sat: { enabled: false, timeSlots: [] },
    sun: { enabled: false, timeSlots: [] },
  });

  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [exceptionType, setExceptionType] = useState<"closed" | "custom">("closed");
  const [lastCustomerBuffer, setLastCustomerBuffer] = useState(30); // 分鐘
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  // 獲取當前月份的日曆數據
  const getCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];
    // 填充月初空白
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    // 填充日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const currentDate = new Date();
  const calendarDays = getCalendarDays(currentDate.getFullYear(), currentDate.getMonth());

  // 檢查是否為國定假日
  const isHoliday = (date: Date) => {
    return taiwanHolidays.some(
      (holiday) => holiday.month === date.getMonth() + 1 && holiday.day === date.getDate()
    );
  };

  // 檢查是否為調休日期
  const isException = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return exceptions.some((exc) => exc.date === dateStr);
  };

  // 切換週日啟用狀態
  const toggleDay = (day: string) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  };

  // 新增時段
  const addTimeSlot = (day: string) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [...prev[day].timeSlots, { start: "09:00", end: "18:00" }],
      },
    }));
  };

  // 刪除時段
  const removeTimeSlot = (day: string, index: number) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.filter((_, i) => i !== index),
      },
    }));
  };

  // 更新時段時間
  const updateTimeSlot = (day: string, index: number, field: keyof TimeSlot, value: string) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.map((slot, i) =>
          i === index ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  };

  // 一鍵套用至平日
  const applyToWeekdays = () => {
    const weekdaySchedule = weeklySchedule.mon;
    setWeeklySchedule((prev) => ({
      ...prev,
      tue: { ...weekdaySchedule },
      wed: { ...weekdaySchedule },
      thu: { ...weekdaySchedule },
      fri: { ...weekdaySchedule },
    }));
  };

  // 處理日期點擊（調休設定）
  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    setSelectedDate(dateStr);
    
    // 檢查是否與現有預約衝突（模擬檢查）
    const hasConflict = checkAppointmentConflict(dateStr);
    if (hasConflict) {
      setShowWarning(true);
      setWarningMessage("此日期已有預約，設為調休可能影響客戶");
    }
  };

  // 檢查預約衝突（模擬）
  const checkAppointmentConflict = (dateStr: string): boolean => {
    // 這裡應該調用 API 檢查預約
    // 目前返回 false 作為模擬
    return false;
  };

  // 儲存調休設定
  const saveException = () => {
    if (!selectedDate) return;

    const newException: Exception = {
      date: selectedDate,
      type: exceptionType,
    };

    if (exceptionType === "custom") {
      newException.timeSlots = [{ start: "09:00", end: "18:00" }];
    }

    setExceptions([...exceptions, newException]);
    setSelectedDate(null);
    setShowWarning(false);
  };

  // 刪除調休設定
  const removeException = (date: string) => {
    setExceptions(exceptions.filter((exc) => exc.date !== date));
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 標題區域 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">營業時間設定</h1>
          <div className="w-12 h-1 bg-red-500 mb-4"></div>
          <p className="text-zinc-500">管理您的常態營業時間與特殊日期調休</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 左側：常態設定 */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900">常態營業時間</h2>
              <button
                onClick={applyToWeekdays}
                className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors text-sm font-medium"
              >
                一鍵套用至平日
              </button>
            </div>

            <div className="space-y-4">
              {weekdays.map((day, index) => {
                const dayKey = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"][index];
                const schedule = weeklySchedule[dayKey];

                return (
                  <motion.div
                    key={dayKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-zinc-200 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleDay(dayKey)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            schedule.enabled ? "bg-red-500" : "bg-zinc-300"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              schedule.enabled ? "translate-x-6" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                        <span className="font-medium text-zinc-900">{day}</span>
                      </div>
                      {schedule.enabled && (
                        <button
                          onClick={() => addTimeSlot(dayKey)}
                          className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {schedule.enabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2"
                        >
                          {schedule.timeSlots.map((slot, slotIndex) => (
                            <motion.div
                              key={slotIndex}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              className="flex items-center gap-2"
                            >
                              <Clock className="w-4 h-4 text-zinc-400" />
                              <input
                                type="time"
                                value={slot.start}
                                onChange={(e) => updateTimeSlot(dayKey, slotIndex, "start", e.target.value)}
                                className="px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                              />
                              <span className="text-zinc-400">至</span>
                              <input
                                type="time"
                                value={slot.end}
                                onChange={(e) => updateTimeSlot(dayKey, slotIndex, "end", e.target.value)}
                                className="px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                              />
                              {schedule.timeSlots.length > 1 && (
                                <button
                                  onClick={() => removeTimeSlot(dayKey, slotIndex)}
                                  className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* 右側：日曆與調休 */}
          <div className="space-y-6">
            {/* 日曆組件 */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-zinc-900">特殊日期調休</h2>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span>國定假日</span>
                  <div className="w-3 h-3 bg-zinc-200 rounded-full ml-2" />
                  <span>調休</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-lg font-bold text-zinc-900 mb-4">
                  {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
                </div>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-zinc-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((date, index) => {
                    if (!date) return <div key={index} className="aspect-square" />;

                    const isHolidayDate = isHoliday(date);
                    const isExceptionDate = isException(date);
                    const isSelected = selectedDate === date.toISOString().split("T")[0];

                    return (
                      <button
                        key={index}
                        onClick={() => handleDateClick(date)}
                        className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                          isSelected
                            ? "bg-red-500 text-white"
                            : isHolidayDate
                            ? "bg-red-100 text-red-700"
                            : isExceptionDate
                            ? "bg-zinc-200 text-zinc-700"
                            : "hover:bg-zinc-100 text-zinc-900"
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 調休設定面板 */}
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-zinc-900">
                    設定 {selectedDate} 調休
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedDate(null);
                      setShowWarning(false);
                    }}
                    className="p-2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {showWarning && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-amber-700">{warningMessage}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExceptionType("closed")}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        exceptionType === "closed"
                          ? "bg-red-500 text-white"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      休息
                    </button>
                    <button
                      onClick={() => setExceptionType("custom")}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        exceptionType === "custom"
                          ? "bg-red-500 text-white"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      自定義時間
                    </button>
                  </div>

                  <button
                    onClick={saveException}
                    className="w-full bg-zinc-900 text-white py-3 rounded-lg font-bold hover:bg-red-600 transition-colors"
                  >
                    儲存設定
                  </button>
                </div>
              </motion.div>
            )}

            {/* 最後收客時間設定 */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
              <h3 className="font-bold text-zinc-900 mb-4">最後收客時間緩衝</h3>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={lastCustomerBuffer}
                  onChange={(e) => setLastCustomerBuffer(parseInt(e.target.value) || 0)}
                  className="w-24 px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                  min="0"
                  max="120"
                />
                <span className="text-zinc-500">分鐘</span>
                <p className="text-sm text-zinc-400">
                  營業結束前多久停止接受新預約
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
