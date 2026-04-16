"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Plus, Trash2, Calendar as CalendarIcon, X, Check, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

// 國定假日資料（台灣 2026）
const taiwanHolidays = [
  { month: 1, day: 1, name: "元旦" },
  { month: 1, day: 28, name: "農曆除夕" },
  { month: 1, day: 29, name: "農曆新年" },
  { month: 1, day: 30, name: "農曆新年" },
  { month: 1, day: 31, name: "農曆新年" },
  { month: 2, day: 1, name: "農曆新年" },
  { month: 2, day: 2, name: "農曆新年" },
  { month: 4, day: 4, name: "兒童節" },
  { month: 4, day: 5, name: "清明節" },
  { month: 6, day: 19, name: "端午節" },
  { month: 9, day: 25, name: "中秋節" },
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
  type: "closed" | "custom" | "special";
  statusTitle?: string;
  reason?: string;
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
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [exceptionType, setExceptionType] = useState<"closed" | "custom" | "special">("closed");
  const [exceptionStatusTitle, setExceptionStatusTitle] = useState("");
  const [exceptionReason, setExceptionReason] = useState("");
  const [aiHolidayAutoTakeover, setAiHolidayAutoTakeover] = useState(false);
  const [lastCustomerBuffer, setLastCustomerBuffer] = useState(30); // 分鐘
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<"all" | "holiday" | "custom">("all");
  const [lastModifiedDay, setLastModifiedDay] = useState<string>("mon");
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pendingDates, setPendingDates] = useState<Set<string>>(new Set());

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
  const calendarDays = getCalendarDays(currentYear, currentMonth);

  // 月份導航
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 拖曳選擇處理
  const handleMouseDown = (date: Date) => {
    setIsDragging(true);
    setHasDragged(false);
    setDragStartDate(date);
  };

  const handleMouseEnter = (date: Date) => {
    if (!isDragging || !dragStartDate) return;
    
    setHasDragged(true);
    
    const startDate = dragStartDate;
    const endDate = date;
    const newSelectedDates = new Set<string>();
    
    const start = startDate < endDate ? startDate : endDate;
    const end = startDate < endDate ? endDate : startDate;
    
    let current = new Date(start);
    while (current <= end) {
      newSelectedDates.add(Intl.DateTimeFormat('en-CA').format(current));
      current.setDate(current.getDate() + 1);
    }
    
    setSelectedDates(newSelectedDates);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartDate(null);
    setHasDragged(false);
  };

  // 單擊選擇
  const handleDateClick = (date: Date) => {
    if (!hasDragged) {
      const dateStr = Intl.DateTimeFormat('en-CA').format(date);
      const existingException = exceptions.find((exc) => exc.date === dateStr);
      
      if (existingException) {
        // 如果該日期已有調休，顯示彈窗詢問
        setPendingDates(new Set([dateStr]));
        setShowEditModal(true);
      } else {
        const newSelected = new Set(selectedDates);
        if (newSelected.has(dateStr)) {
          newSelected.delete(dateStr);
        } else {
          newSelected.add(dateStr);
        }
        setSelectedDates(newSelected);
      }
    }
  };

  // AI 國定假日自動接管
  const applyAiHolidayTakeover = () => {
    if (!aiHolidayAutoTakeover) return;
    
    const newExceptions = [...exceptions];
    taiwanHolidays.forEach((holiday) => {
      const dateStr = `${currentYear}-${String(holiday.month).padStart(2, '0')}-${String(holiday.day).padStart(2, '0')}`;
      if (!newExceptions.some((exc) => exc.date === dateStr)) {
        newExceptions.push({
          date: dateStr,
          type: "closed",
          reason: holiday.name,
        });
      }
    });
    setExceptions(newExceptions);
  };

  // 監聽 AI 開關變化
  useEffect(() => {
    if (aiHolidayAutoTakeover) {
      applyAiHolidayTakeover();
    }
  }, [aiHolidayAutoTakeover, currentYear]);

  // 檢查是否為國定假日
  const isHoliday = (date: Date) => {
    return taiwanHolidays.some(
      (holiday) => holiday.month === date.getMonth() + 1 && holiday.day === date.getDate()
    );
  };

  // 檢查是否為調休日期
  const isException = (date: Date) => {
    const dateStr = Intl.DateTimeFormat('en-CA').format(date);
    return exceptions.some((exc) => exc.date === dateStr);
  };

  // 切換週日啟用狀態
  const toggleDay = (day: string) => {
    setLastModifiedDay(day);
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  // 新增時段
  const addTimeSlot = (day: string) => {
    setLastModifiedDay(day);
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
    setLastModifiedDay(day);
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
    setLastModifiedDay(day);
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
    const sourceSchedule = weeklySchedule[lastModifiedDay];
    setWeeklySchedule((prev) => {
      const newSchedule = { ...prev };
      const weekdays = ["mon", "tue", "wed", "thu", "fri"];
      weekdays.forEach((day) => {
        if (day !== lastModifiedDay) {
          newSchedule[day] = { ...sourceSchedule };
        }
      });
      return newSchedule;
    });
  };


  // 檢查預約衝突（模擬）
  const checkAppointmentConflict = (dateStr: string): boolean => {
    // 這裡應該調用 API 檢查預約
    // 目前返回 false 作為模擬
    return false;
  };

  // 儲存調休設定
  const saveException = () => {
    if (selectedDates.size === 0) return;

    const newExceptions = [...exceptions];
    selectedDates.forEach((dateStr) => {
      const existingIndex = newExceptions.findIndex((exc) => exc.date === dateStr);
      const newException: Exception = {
        date: dateStr,
        type: exceptionType,
        statusTitle: exceptionType === "special" ? exceptionStatusTitle : undefined,
        reason: exceptionReason || "",
      };

      if (exceptionType === "custom") {
        newException.timeSlots = [{ start: "09:00", end: "18:00" }];
      }

      if (existingIndex >= 0) {
        newExceptions[existingIndex] = newException;
      } else {
        newExceptions.push(newException);
      }
    });

    setExceptions(newExceptions);
    setSelectedDates(new Set());
    setExceptionStatusTitle("");
    setExceptionReason("");
    setShowWarning(false);
  };

  // 獲取選中日期的顧客預覽資料
  const getCustomerPreviewData = () => {
    if (selectedDates.size === 0) return null;
    
    const dates = Array.from(selectedDates).sort();
    const startDate = new Date(dates[0]);
    const endDate = new Date(dates[dates.length - 1]);
    
    // 日期範圍
    let dateRange = "";
    if (dates.length === 1) {
      dateRange = `${startDate.getFullYear()}年${startDate.getMonth() + 1}月${startDate.getDate()}日`;
    } else {
      const startFormatted = `${startDate.getMonth() + 1}月${startDate.getDate()}日`;
      const endFormatted = `${endDate.getMonth() + 1}月${endDate.getDate()}日`;
      dateRange = `${startDate.getFullYear()}年${startFormatted} - ${endFormatted}`;
    }
    
    // 當前狀態
    let currentStatus = "";
    if (exceptionType === "closed") {
      currentStatus = "店家調休中";
    } else if (exceptionType === "special") {
      currentStatus = exceptionStatusTitle || "特別營業";
    } else {
      currentStatus = "自定義時間";
    }
    
    // 原因詳情
    const reason = exceptionReason || "";
    
    return { dateRange, currentStatus, reason };
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
          <p className="text-zinc-700">讓每一則私訊，都變成一筆預約 — 營收時段管理</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 左側：常態設定 */}
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900">常態營業時間</h2>
              <button
                onClick={applyToWeekdays}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                一鍵套用至平日
              </button>
              <div className="text-xs text-zinc-500">
                來源：{weekdays[["mon", "tue", "wed", "thu", "fri", "sat", "sun"].indexOf(lastModifiedDay)]}
              </div>
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
                          className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
                              <Clock className="w-4 h-4 text-zinc-600" />
                              <input
                                type="time"
                                value={slot.start}
                                onChange={(e) => updateTimeSlot(dayKey, slotIndex, "start", e.target.value)}
                                className="px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                              />
                              <span className="text-zinc-600">至</span>
                              <input
                                type="time"
                                value={slot.end}
                                onChange={(e) => updateTimeSlot(dayKey, slotIndex, "end", e.target.value)}
                                className="px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                              />
                              {schedule.timeSlots.length > 1 && (
                                <button
                                  onClick={() => removeTimeSlot(dayKey, slotIndex)}
                                  className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

            {/* 緩衝時間設定 */}
            <div className="mt-6 pt-6 border-t border-zinc-200">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-zinc-700">最後收客時間緩衝</span>
                <input
                  type="number"
                  value={lastCustomerBuffer}
                  onChange={(e) => setLastCustomerBuffer(parseInt(e.target.value) || 0)}
                  className="w-20 px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-center"
                  min="0"
                  max="120"
                />
                <span className="text-sm text-zinc-600">分鐘</span>
                <span className="text-xs text-zinc-500">營業結束前多久停止接受新預約</span>
              </div>
            </div>
          </div>

          {/* 右側：日曆與調休 */}
          <div className="space-y-6">
            {/* 日曆組件 */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-zinc-900">特殊日期調休</h2>
                
                {/* AI 國定假日自動接管開關 */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-700">AI 國定假日自動接管</span>
                  <button
                    onClick={() => setAiHolidayAutoTakeover(!aiHolidayAutoTakeover)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      aiHolidayAutoTakeover ? "bg-red-500" : "bg-zinc-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        aiHolidayAutoTakeover ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 操作提示 */}
              <div className="mb-4 p-3 bg-zinc-50 rounded-lg border border-zinc-200 flex items-start gap-2">
                <span className="text-lg">💡</span>
                <p className="text-sm text-zinc-700">小撇步：按住並拖曳滑鼠，可快速跨日選擇多個時段。</p>
              </div>

              {/* 月份導航 */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-lg font-bold text-zinc-900">
                  {currentYear}年 {currentMonth + 1}月
                </div>
                <button
                  onClick={goToNextMonth}
                  className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* 星期標題 */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-zinc-700 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* 日曆日期 */}
              <div 
                className="grid grid-cols-7 gap-2"
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {calendarDays.map((date, index) => {
                  if (!date) return <div key={index} className="aspect-square" />;

                  const isHolidayDate = isHoliday(date);
                  const isExceptionDate = isException(date);
                  const dateStr = Intl.DateTimeFormat('en-CA').format(date);
                  const isSelected = selectedDates.has(dateStr);

                  return (
                    <button
                      key={index}
                      onMouseDown={() => handleMouseDown(date)}
                      onMouseEnter={(e) => {
                        handleMouseEnter(date);
                        if (isExceptionDate) {
                          setHoveredDate(date);
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.bottom + 8 });
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredDate(null);
                        setTooltipPosition(null);
                      }}
                      onClick={() => handleDateClick(date)}
                      className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                        isSelected
                          ? "bg-red-500 text-white shadow-lg"
                          : isHolidayDate
                          ? "bg-red-50 text-red-700 border-2 border-red-200"
                          : isExceptionDate
                          ? "bg-zinc-200 text-zinc-700 cursor-help"
                          : "hover:bg-zinc-100 text-zinc-900"
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span>{date.getDate()}</span>
                        {isHolidayDate && (
                          <span className="text-xs mt-0.5 opacity-75">假</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 懸停提示 */}
              {hoveredDate && tooltipPosition && (() => {
                const dateStr = Intl.DateTimeFormat('en-CA').format(hoveredDate);
                const exception = exceptions.find((exc) => exc.date === dateStr);
                if (!exception) return null;

                return (
                  <div
                    className="fixed bg-zinc-900 text-white px-4 py-3 rounded-lg shadow-xl z-50 text-sm max-w-xs"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div className="font-bold mb-1">{dateStr}</div>
                    <div className={`font-medium mb-1 ${
                      exception.reason === taiwanHolidays.find((h) => h.month === hoveredDate.getMonth() + 1 && h.day === hoveredDate.getDate())?.name
                        ? "text-red-400"
                        : "text-zinc-300"
                    }`}>
                      {exception.type === "closed" ? "全天調休" : exception.statusTitle || "特別營業"}
                    </div>
                    {exception.reason && (
                      <div className="text-zinc-400 text-xs">原因：{exception.reason}</div>
                    )}
                  </div>
                );
              })()}

              {/* 圖例 */}
              <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-50 border-2 border-red-200 rounded" />
                  <span className="text-zinc-700">國定假日</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-zinc-200 rounded" />
                  <span className="text-zinc-700">調休</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded" />
                  <span className="text-zinc-700">已選擇</span>
                </div>
              </div>
            </div>

            {/* 調休操作介面 */}
            {selectedDates.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-zinc-900">
                    調休設定
                  </h3>
                  <button
                    onClick={() => setSelectedDates(new Set())}
                    className="p-2 text-zinc-600 hover:text-zinc-900"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 選中日期清單 */}
                <div className="mb-4 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                  <div className="text-sm font-medium text-zinc-700 mb-2">
                    已選擇 {selectedDates.size} 個日期：
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedDates).sort().map((dateStr) => {
                      const date = new Date(dateStr);
                      const formattedDate = Intl.DateTimeFormat('en-CA').format(date);
                      return (
                        <span
                          key={dateStr}
                          className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium"
                        >
                          {formattedDate}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* 調休狀態切換 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    調休狀態
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExceptionType("closed")}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                        exceptionType === "closed"
                          ? "bg-red-500 text-white shadow-lg"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      【全天調休】
                    </button>
                    <button
                      onClick={() => setExceptionType("special")}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                        exceptionType === "special"
                          ? "bg-red-500 text-white shadow-lg"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      【自定義重開/特別營業】
                    </button>
                  </div>
                </div>

                {/* 狀態標題（僅在特別營業時顯示） */}
                {exceptionType === "special" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      狀態標題
                    </label>
                    <input
                      type="text"
                      value={exceptionStatusTitle}
                      onChange={(e) => setExceptionStatusTitle(e.target.value)}
                      placeholder="例如：週年慶特別營業、僅限外帶..."
                      className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-zinc-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                    />
                  </div>
                )}

                {/* 原因描述 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    調休原因
                  </label>
                  <textarea
                    value={exceptionReason}
                    onChange={(e) => setExceptionReason(e.target.value)}
                    placeholder="例如：員工旅遊、店面整修、私人活動..."
                    className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-zinc-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none"
                    rows={3}
                  />
                </div>

                {/* 顧客預覽窗口 */}
                <div className="mb-4 p-5 bg-zinc-50 rounded-lg border border-zinc-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-bold text-zinc-900">顧客預覽</span>
                  </div>
                  
                  {(() => {
                    const previewData = getCustomerPreviewData();
                    if (!previewData) return <p className="text-sm text-zinc-500">請選擇日期以查看預覽</p>;
                    
                    return (
                      <div className="space-y-3">
                        {/* 日期範圍 */}
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-zinc-600" />
                          <span className="text-sm font-medium text-zinc-900">{previewData.dateRange}</span>
                        </div>
                        
                        {/* 當前狀態 */}
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            exceptionType === "closed" ? "bg-red-500" : "bg-green-500"
                          }`} />
                          <span className={`text-sm font-medium ${
                            exceptionType === "closed" ? "text-red-700" : "text-green-700"
                          }`}>{previewData.currentStatus}</span>
                        </div>
                        
                        {/* 原因詳情 */}
                        {previewData.reason && (
                          <div className="pl-6">
                            <p className="text-sm text-zinc-600 italic">{previewData.reason}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* 儲存按鈕 */}
                <button
                  onClick={saveException}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  儲存調休設定
                </button>
              </motion.div>
            )}

            {/* 編輯調休彈窗 */}
            {showEditModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-bold text-zinc-900 mb-4">調休日期已存在</h3>
                  <p className="text-sm text-zinc-700 mb-6">
                    該日期已有調休設定，您想要：
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedDates(pendingDates);
                        // 預填現有資料
                        const firstDate = Array.from(pendingDates)[0];
                        const existing = exceptions.find((exc) => exc.date === firstDate);
                        if (existing) {
                          setExceptionType(existing.type);
                          setExceptionStatusTitle(existing.statusTitle || "");
                          setExceptionReason(existing.reason || "");
                        }
                      }}
                      className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      編輯調休日
                    </button>
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        // 清空該日期的調休
                        pendingDates.forEach((date) => {
                          removeException(date);
                        });
                        setSelectedDates(new Set());
                      }}
                      className="w-full py-3 bg-zinc-200 text-zinc-700 rounded-lg font-medium hover:bg-zinc-300 transition-colors"
                    >
                      清空調休日狀態
                    </button>
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setPendingDates(new Set());
                      }}
                      className="w-full py-3 border border-zinc-300 text-zinc-700 rounded-lg font-medium hover:bg-zinc-50 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 已選擇調休記錄 */}
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-zinc-900">調休記錄</h3>
                <span className="text-sm text-zinc-500">共 {exceptions.length} 天</span>
              </div>

                {/* 標籤切換 */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "all"
                        ? "bg-zinc-800 text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => setActiveTab("holiday")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "holiday"
                        ? "bg-red-500 text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    國定假日
                  </button>
                  <button
                    onClick={() => setActiveTab("custom")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "custom"
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    自定義調休
                  </button>
                </div>

              {exceptions.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  尚無調休記錄，請從日曆選擇日期進行設定
                </div>
              ) : (
                <div className="space-y-2">
                  {exceptions
                    .filter((exc) => {
                      if (activeTab === "all") return true;
                      if (activeTab === "holiday") return exc.reason === taiwanHolidays.find((h) => h.month === new Date(exc.date).getMonth() + 1 && h.day === new Date(exc.date).getDate())?.name;
                      if (activeTab === "custom") return exc.reason !== taiwanHolidays.find((h) => h.month === new Date(exc.date).getMonth() + 1 && h.day === new Date(exc.date).getDate())?.name;
                      return true;
                    })
                    .map((exc) => (
                      <div
                        key={exc.date}
                        className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            exc.reason === taiwanHolidays.find((h) => h.month === new Date(exc.date).getMonth() + 1 && h.day === new Date(exc.date).getDate())?.name
                              ? "bg-red-500"
                              : "bg-zinc-900"
                          }`} />
                          <div>
                            <div className="text-sm font-medium text-zinc-900">{exc.date}</div>
                            <div className="text-xs text-zinc-600">
                              {exc.type === "closed" ? "全天調休" : exc.statusTitle || "特別營業"}
                              {exc.reason && ` · ${exc.reason}`}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeException(exc.date)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
