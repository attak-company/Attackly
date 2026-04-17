"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, MapPin, Phone, Mail, Clock, Tag, X, User, Crown, Scissors, Eye, Palette, Calendar } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface Appointment {
  id: string;
  customerName: string;
  service: string;
  serviceType: "nail" | "eyelash" | "hair" | "other";
  serviceAbbr: string;
  date: string;
  time: string;
  remainingTime: string;
  phone: string;
  email: string;
  tags: string[];
  aiNotes: string;
  history: {
    date: string;
    service: string;
    status: string;
  }[];
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("month");
  const [showTimeline, setShowTimeline] = useState(false);
  const [highlightAppointmentId, setHighlightAppointmentId] = useState<string | null>(null);
  const dayViewRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  // 下班彩蛋訊息
  const offWorkMessages = [
    "「今日滿分！」",
    "Done!",
    "「辛苦啦，女神」",
    "Off Work!",
    "「該休息嘍 ☕」",
    "Cheers!",
    "「明天見 😊」",
    "Relax",
    "「今天也很棒！」",
    "Good Night ✨"
  ];
  const [offWorkMessage, setOffWorkMessage] = useState<string | null>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  // 自動展開時間軸：如果選中日期有預約就顯示
  useEffect(() => {
    const selectedDateApps = getAppointmentsForDate(currentDate);
    if (selectedDateApps.length > 0) {
      setShowTimeline(true);
    }
  }, [currentDate]);

  // 每秒更新當前時間
  useEffect(() => {
    // 立即初始化當前時間
    setCurrentTime(new Date());

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 下班彩蛋邏輯
  useEffect(() => {
    if (viewMode === "day") {
      const dayApps = getAppointmentsForDate(currentDate).sort((a, b) => a.time.localeCompare(b.time));

      if (dayApps.length === 0) {
        setOffWorkMessage(null);
        return;
      }

      // 計算最後一筆預約的結束時間
      const lastAppointment = dayApps[dayApps.length - 1];
      const [lastHours, lastMinutes] = lastAppointment.time.split(':').map(Number);
      const lastAppointmentTime = new Date(currentDate);
      lastAppointmentTime.setHours(lastHours, lastMinutes, 0, 0);

      // 解析服務時長
      const parseRemainingTime = (timeStr: string): number => {
        const match = timeStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      const serviceDuration = parseRemainingTime(lastAppointment.remainingTime);
      const endTime = new Date(lastAppointmentTime.getTime() + serviceDuration * 60000);

      // 檢查當前時間是否已經過了最後一筆預約的結束時間
      if (currentTime >= endTime) {
        // 只有在滾動到底部時才顯示鼓勵訊息
        if (hasScrolledToBottom && !offWorkMessage) {
          const randomIndex = Math.floor(Math.random() * offWorkMessages.length);
          setOffWorkMessage(offWorkMessages[randomIndex]);
        }
      } else {
        setOffWorkMessage(null);
      }
    }
  }, [viewMode, currentDate, currentTime, hasScrolledToBottom]);

  // 滾動偵測
  useEffect(() => {
    if (viewMode === "day" && dayViewRef.current) {
      const container = dayViewRef.current;
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px buffer
        setHasScrolledToBottom(isAtBottom);
      };

      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [viewMode]);

  // 日視圖切換時自動滾動到當前時間或第一筆預約
  useEffect(() => {
    // 重置滾動標記當視圖模式改變
    hasScrolledRef.current = false;
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === "day" && dayViewRef.current && !hasScrolledRef.current) {
      // 延遲一下讓 DOM 渲染完成
      setTimeout(() => {
        // 如果有高亮預約，滾動到該預約
        if (highlightAppointmentId) {
          const highlightedElement = dayViewRef.current?.querySelector(`[data-appointment-id="${highlightAppointmentId}"]`);
          if (highlightedElement) {
            highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // 閃爍兩次後移除高亮
            setTimeout(() => {
              setHighlightAppointmentId(null);
            }, 2000);
            hasScrolledRef.current = true;
            return;
          }
        }

        const dayApps = getAppointmentsForDate(currentDate);
        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

        // 如果有預約且當前時間早於第一筆預約，滾動到頂部
        if (dayApps.length > 0) {
          const [firstHours, firstMinutes] = dayApps[0].time.split(':').map(Number);
          const firstAppointmentMinutes = firstHours * 60 + firstMinutes;
          if (currentMinutes < firstAppointmentMinutes) {
            // 滾動到頂部
            dayViewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            hasScrolledRef.current = true;
            return;
          }
        }

        // 根據當前時間計算滾動位置（假設一天24小時，每小時約佔一定高度）
        const currentHour = currentTime.getHours();
        const scrollPercentage = (currentHour / 24) * 100;
        const container = dayViewRef.current;
        if (container) {
          container.scrollTop = (container.scrollHeight * scrollPercentage) / 100 - (container.clientHeight / 2);
        }
        hasScrolledRef.current = true;
      }, 300); // 增加延遲以配合淡入動畫
    }
  }, [viewMode, currentDate, highlightAppointmentId]);

  // 模擬預約數據
  const appointments: Appointment[] = [
    {
      id: "1",
      customerName: "林小姐",
      service: "日式指甲",
      serviceType: "nail",
      serviceAbbr: "指甲",
      date: "2026-04-17",
      time: "09:00",
      remainingTime: "90分",
      phone: "0912-345-678",
      email: "lin@example.com",
      tags: ["VIP", "常客", "高消費", "預約準時"],
      aiNotes: "客戶喜歡漸層色，上次提到想嘗試新款式。對指甲品質要求高，偏好使用進口凝膠。平均消費 $2000+。生日在 6/15。",
      history: [
        { date: "2026-03-20", service: "凝膠指甲", status: "已完成" },
        { date: "2026-02-15", service: "光療指甲", status: "已完成" },
        { date: "2026-01-10", service: "手繪指甲", status: "已完成" },
        { date: "2025-12-05", service: "水晶指甲", status: "已完成" },
        { date: "2025-11-01", service: "日式指甲", status: "已完成" },
      ],
    },
    {
      id: "2",
      customerName: "王小姐",
      service: "美睫",
      serviceType: "eyelash",
      serviceAbbr: "美睫",
      date: "2026-04-17",
      time: "11:00",
      remainingTime: "60分",
      phone: "0923-456-789",
      email: "wang@example.com",
      tags: ["常客"],
      aiNotes: "喜歡自然捲翹，不喜歡太誇張的款式",
      history: [
        { date: "2026-03-15", service: "美睫", status: "已完成" },
      ],
    },
    {
      id: "3",
      customerName: "李小姐",
      service: "凝膠指甲",
      serviceType: "nail",
      serviceAbbr: "指甲",
      date: "2026-04-17",
      time: "13:00",
      remainingTime: "120分",
      phone: "0934-567-890",
      email: "lee@example.com",
      tags: ["新客"],
      aiNotes: "第一次來店做指甲",
      history: [],
    },
    {
      id: "4",
      customerName: "張小姐",
      service: "理髮",
      serviceType: "hair",
      serviceAbbr: "理髮",
      date: "2026-04-17",
      time: "15:00",
      remainingTime: "45分",
      phone: "0945-678-901",
      email: "zhang@example.com",
      tags: ["VIP"],
      aiNotes: "長期客戶，偏好層次感剪髮",
      history: [
        { date: "2026-03-10", service: "理髮", status: "已完成" },
        { date: "2026-02-05", service: "理髮", status: "已完成" },
      ],
    },
    {
      id: "5",
      customerName: "陳先生",
      service: "理髮",
      serviceType: "hair",
      serviceAbbr: "理髮",
      date: "2026-04-18",
      time: "10:00",
      remainingTime: "30分",
      phone: "0987-654-321",
      email: "chen@example.com",
      tags: ["新客"],
      aiNotes: "第一次來店，偏好短髮造型",
      history: [],
    },
    {
      id: "6",
      customerName: "劉小姐",
      service: "美睫",
      serviceType: "eyelash",
      serviceAbbr: "美睫",
      date: "2026-04-18",
      time: "11:30",
      remainingTime: "60分",
      phone: "0911-222-333",
      email: "liu@example.com",
      tags: ["VIP", "常客"],
      aiNotes: "喜歡自然妝感，每次都要求同一款",
      history: [
        { date: "2026-03-25", service: "美睫", status: "已完成" },
        { date: "2026-02-20", service: "美睫", status: "已完成" },
      ],
    },
    {
      id: "7",
      customerName: "吳小姐",
      service: "凝膠指甲",
      serviceType: "nail",
      serviceAbbr: "指甲",
      date: "2026-04-18",
      time: "14:00",
      remainingTime: "90分",
      phone: "0922-333-444",
      email: "wu@example.com",
      tags: ["常客"],
      aiNotes: "喜歡裸粉色系，每次都做相同顏色",
      history: [
        { date: "2026-03-18", service: "凝膠指甲", status: "已完成" },
      ],
    },
    {
      id: "8",
      customerName: "黃先生",
      service: "理髮",
      serviceType: "hair",
      serviceAbbr: "理髮",
      date: "2026-04-18",
      time: "15:30",
      remainingTime: "45分",
      phone: "0933-444-555",
      email: "huang@example.com",
      tags: ["新客"],
      aiNotes: "朋友推薦來店",
      history: [],
    },
    {
      id: "9",
      customerName: "周小姐",
      service: "光療指甲",
      serviceType: "nail",
      serviceAbbr: "指甲",
      date: "2026-04-18",
      time: "17:00",
      remainingTime: "120分",
      phone: "0944-555-666",
      email: "zhou@example.com",
      tags: ["VIP"],
      aiNotes: "喜歡嘗試新款式，每次都要不同設計",
      history: [
        { date: "2026-03-12", service: "光療指甲", status: "已完成" },
        { date: "2026-02-08", service: "凝膠指甲", status: "已完成" },
        { date: "2026-01-05", service: "光療指甲", status: "已完成" },
      ],
    },
  ];

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
    const today = new Date();
    const isAlreadyToday = currentDate.toDateString() === today.toDateString();

    if (isAlreadyToday) {
      // 如果已經在今天，切換到日模式
      setViewMode("day");
    } else {
      // 否則跳轉到今天
      setCurrentDate(today);
    }
  };

  const handlePrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowSheet(true);
  };

  const handleTimelineAppointmentClick = (appointment: Appointment) => {
    setViewMode("day");
    setCurrentDate(new Date());
    setSelectedAppointment(appointment);
    setHighlightAppointmentId(appointment.id);
    // 不自動開啟 Sheet，讓用戶在日視圖中再次點擊才開啟
  };

  const getTodayAppointments = () => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return appointments.filter((app) => app.date === todayString);
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return appointments.filter((app) => app.date === dateString);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getAppointmentsForDay = (day: number) => {
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.filter((app) => app.date === dateString);
  };

  const getServiceTypeColor = (type: string): string => {
    switch (type) {
      case "nail":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "eyelash":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "hair":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getServiceTypeDotColor = (type: string): string => {
    switch (type) {
      case "nail":
        return "bg-blue-500";
      case "eyelash":
        return "bg-purple-500";
      case "hair":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case "nail":
        return <Palette className="w-3 h-3" />;
      case "eyelash":
        return <Eye className="w-3 h-3" />;
      case "hair":
        return <Scissors className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
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
      const dayAppointments = getAppointmentsForDay(day);

      days.push(
        <div key={day} className={`min-h-[120px] p-2 hover:bg-gray-50 transition-colors group cursor-pointer relative ${isToday ? 'bg-red-50' : 'bg-white'} shadow-sm`}>
          <span className={`text-base font-medium ${isToday ? 'bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center' : 'text-gray-900'}`}>
            {day}
          </span>
          {dayAppointments.length > 0 && (
            <div className="mt-2 space-y-1">
              {dayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAppointmentClick(appointment);
                  }}
                  className={`text-xs px-2 py-1 rounded transition-colors cursor-pointer ${getServiceTypeColor(appointment.serviceType)} shadow-sm`}
                >
                  <div className="flex items-center gap-1 flex-wrap">
                    {appointment.tags.includes("VIP") && <Crown className="w-3 h-3 text-amber-700" />}
                    {getServiceIcon(appointment.serviceType)}
                    <span className="font-medium">{appointment.customerName}</span>
                    <span className="text-gray-500">|</span>
                    <span>{appointment.serviceAbbr}</span>
                    <span className="text-gray-500">|</span>
                    <span className="text-gray-600">{appointment.remainingTime}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }

    return weekDates;
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates();
    const today = new Date();

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronDown className="w-5 h-5 rotate-90" />
          </button>
          <div className="bg-gray-50 rounded-lg p-4 flex-1 mx-4 text-center">
            <div className="text-lg font-bold text-gray-900">
              {weekDates[0].toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })} - {weekDates[6].toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })}
            </div>
          </div>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronDown className="w-5 h-5 -rotate-90" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 rounded-lg overflow-hidden">
          {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
            <div key={day} className="bg-gray-50 p-2 text-center text-sm font-bold text-gray-900 uppercase">
              {day}
            </div>
          ))}
          {weekDates.map((date) => {
            const isToday = date.toDateString() === today.toDateString();
            const dayAppointments = appointments.filter((app) => {
              const appDate = new Date(app.date);
              return appDate.toDateString() === date.toDateString();
            });

            return (
              <div key={date.toISOString()} className={`min-h-[200px] p-2 hover:bg-gray-50 transition-colors group cursor-pointer relative shadow-sm ${isToday ? 'bg-red-50' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-base font-medium ${isToday ? 'bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center' : 'text-gray-900'}`}>
                    {date.getDate()}
                  </span>
                  <span className="text-sm text-gray-500">{date.getMonth() + 1}/{date.getDate()}</span>
                </div>
                {dayAppointments.length > 0 && (
                  <div className="space-y-1">
                    {dayAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAppointmentClick(appointment);
                        }}
                        className={`text-xs px-2 py-1 rounded transition-colors cursor-pointer ${getServiceTypeColor(appointment.serviceType)} shadow-sm`}
                      >
                        <div className="flex items-center gap-1 flex-wrap">
                          {appointment.tags.includes("VIP") && <Crown className="w-3 h-3 text-amber-700" />}
                          {getServiceIcon(appointment.serviceType)}
                          <span className="font-medium">{appointment.time}</span>
                          <span className="font-medium">{appointment.customerName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDate(currentDate).sort((a, b) => a.time.localeCompare(b.time));
    const currentTimeStr = currentTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });

    // 時間感知動態問候語
    const getTimeAwareGreeting = () => {
      const hour = currentTime.getHours();
      const todayApps = getAppointmentsForDate(new Date());
      const totalApps = todayApps.length;

      // 計算進度百分比
      const completedApps = todayApps.filter(app => {
        const [hours, minutes] = app.time.split(':').map(Number);
        const appTime = new Date();
        appTime.setHours(hours, minutes, 0, 0);
        return appTime < currentTime;
      }).length;
      const progress = totalApps > 0 ? Math.round((completedApps / totalApps) * 100) : 0;

      if (hour >= 5 && hour < 12) {
        // 早上
        return `早安！今天共有 ${totalApps} 筆預約，祝您有美好的一天。`;
      } else if (hour >= 12 && hour < 20) {
        // 下午
        return `辛苦了，目前進度已完成 ${progress}%，加油！`;
      } else {
        // 深夜
        return `深夜好，為您準備好明日的排程預覽。`;
      }
    };

    // 檢查是否為過去日期（避免修改 currentDate 物件）
    const currentDateStart = new Date(currentDate);
    currentDateStart.setHours(0, 0, 0, 0);
    const currentTimeStart = new Date(currentTime);
    currentTimeStart.setHours(0, 0, 0, 0);
    const isPastDate = currentDateStart < currentTimeStart;

    // 將 remainingTime 轉換為分鐘
    const parseRemainingTime = (timeStr: string): number => {
      const match = timeStr.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };

    // 計算當前時間是否在第一筆訂單之前
    const isBeforeFirstAppointment = !isPastDate && dayAppointments.length > 0 && (() => {
      const [firstHours, firstMinutes] = dayAppointments[0].time.split(':').map(Number);
      const firstAppointmentMinutes = firstHours * 60 + firstMinutes;
      const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
      return currentMinutes < firstAppointmentMinutes;
    })();

    // 計算當前時間是否在最後一筆訂單結束之後
    const isAfterLastAppointment = !isPastDate && dayAppointments.length > 0 && (() => {
      const lastAppointment = dayAppointments[dayAppointments.length - 1];
      const [lastHours, lastMinutes] = lastAppointment.time.split(':').map(Number);
      const lastAppointmentTime = new Date(currentDate);
      lastAppointmentTime.setHours(lastHours, lastMinutes, 0, 0);
      const serviceDuration = parseRemainingTime(lastAppointment.remainingTime);
      const endTime = new Date(lastAppointmentTime.getTime() + serviceDuration * 60000);
      return currentTime >= endTime;
    })();

    // 如果在第一筆訂單之前，顯示第一筆訂單的時間
    const displayTimeStr = isBeforeFirstAppointment ? dayAppointments[0].time : currentTimeStr;

    // 計算下一個客人的時間
    const getNextAppointmentTime = () => {
      if (isPastDate) return null;
      const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
      for (const appointment of dayAppointments) {
        const [hours, minutes] = appointment.time.split(':').map(Number);
        const appointmentMinutes = hours * 60 + minutes;
        if (appointmentMinutes > currentMinutes) {
          const diffMins = appointmentMinutes - currentMinutes;
          return `${diffMins} 分鐘後`;
        }
      }
      return null;
    };

    const nextAppointmentTime = getNextAppointmentTime();

    // 計算距離第一筆預約的時間
    const getTimeUntilFirstAppointment = () => {
      if (isPastDate) return null;
      if (dayAppointments.length === 0) return null;
      const [firstHours, firstMinutes] = dayAppointments[0].time.split(':').map(Number);
      const firstAppointmentMinutes = firstHours * 60 + firstMinutes;
      const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
      const diffMinutes = firstAppointmentMinutes - currentMinutes;
      if (diffMinutes <= 0) return null;
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      const hoursWithDecimal = hours + minutes / 60;
      return hoursWithDecimal.toFixed(1);
    };

    return (
      <div className="space-y-4 animate-in fade-in duration-300" ref={dayViewRef}>
        {/* 大提示：防止看錯日期 */}
        {getTimeUntilFirstAppointment() && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 border-l-4 border-l-red-600">
            <div className="text-lg font-bold text-gray-700">
              現在是 {currentDate.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })} ({currentDate.toLocaleDateString('zh-TW', { weekday: 'short' })}) {currentTimeStr}
            </div>
            <div className="text-gray-500 mt-1">
              您距離第一筆預約 ({dayAppointments[0].time}) 還有 {getTimeUntilFirstAppointment()} 小時。
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronDown className="w-5 h-5 rotate-90" />
          </button>
          <div className="bg-gray-50 rounded-lg p-4 flex-1 mx-4">
            <div className="text-2xl font-bold text-gray-900 mb-1">{currentDate.toLocaleDateString('zh-TW', { weekday: 'long' })}</div>
            <div className="text-gray-600">{currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            {nextAppointmentTime && (
              <div className="text-sm text-green-600 mt-1 font-medium">下一個客人 {nextAppointmentTime}</div>
            )}
          </div>
          <button
            onClick={handleNextDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronDown className="w-5 h-5 -rotate-90" />
          </button>
        </div>

        {dayAppointments.length > 0 ? (
          <div className="relative pl-8">
            {/* 垂直時間線 */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200"></div>

            {/* 時間軸末端空心圓點 */}
            <div className="absolute left-4 bottom-0 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-gray-900 bg-white z-20"></div>

            {/* 目前時間線（僅在非過去日期顯示） */}
            {!isPastDate && (
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-400" data-now-indicator="true">
                {/* 紅點帶呼吸燈效果 */}
                <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg z-10" style={{ top: isBeforeFirstAppointment ? '0' : isAfterLastAppointment ? '100%' : '50%' }}>
                  <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-75"></div>
                </div>

                {/* 直式資訊框（左側）- 彩蛋出現時替換為彩蛋 */}
                {offWorkMessage && isAfterLastAppointment ? (
                  <div className="absolute bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap animate-pulse" style={{ top: '100%', right: '100%', transform: 'translateY(-50%)', marginRight: '12px' }}>
                    <span className="text-xs font-bold">{offWorkMessage}</span>
                  </div>
                ) : (
                  <div className={`absolute px-2 py-1 rounded shadow-lg whitespace-nowrap ${isBeforeFirstAppointment ? 'bg-gray-900 text-white border-l-2 border-red-600' : 'bg-gray-900 text-white'}`} style={{ top: isBeforeFirstAppointment ? '0' : isAfterLastAppointment ? '100%' : '50%', right: '100%', transform: 'translateY(-50%)', marginRight: '8px' }}>
                    <div className="text-xs font-bold space-y-0.5">
                      <div>{isBeforeFirstAppointment ? `第一筆` : isAfterLastAppointment ? `下班` : `現在`}</div>
                      <div>{isBeforeFirstAppointment ? dayAppointments[0].time : currentTimeStr}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-6">
              {dayAppointments.map((appointment, index) => {
                const [hours, minutes] = appointment.time.split(':').map(Number);
                const appointmentTime = new Date(currentDate);
                appointmentTime.setHours(hours, minutes, 0, 0);

                // 計算與下一個預約的時間間隔（服務結束時間到下一個服務開始時間）
                let timeGap = null;
                if (index < dayAppointments.length - 1) {
                  const nextApp = dayAppointments[index + 1];
                  const [nextHours, nextMinutes] = nextApp.time.split(':').map(Number);
                  const nextTime = new Date(currentDate);
                  nextTime.setHours(nextHours, nextMinutes, 0, 0);

                  // 當前服務結束時間 = 開始時間 + 服務時長
                  const serviceDuration = parseRemainingTime(appointment.remainingTime);
                  const endTime = new Date(appointmentTime.getTime() + serviceDuration * 60000);

                  const diffMs = nextTime.getTime() - endTime.getTime();
                  const diffMins = Math.floor(diffMs / 60000);
                  timeGap = `${diffMins} 分鐘`;
                }

                const isPast = appointmentTime < currentTime;

                return (
                  <div key={appointment.id} className="relative">
                    {/* 時間點 */}
                    <div className={`absolute left-[-1.5rem] w-4 h-4 rounded-full border-2 ${isPast ? 'bg-gray-400 border-gray-400' : 'bg-white border-gray-900'}`}></div>
                    {/* 預約卡片 */}
                    <div
                      data-appointment-id={appointment.id}
                      onClick={() => handleAppointmentClick(appointment)}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer hover:shadow-md ${isPast ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200'} ${highlightAppointmentId === appointment.id ? 'animate-pulse' : ''}`}
                      style={highlightAppointmentId === appointment.id ? {
                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.8)',
                        borderWidth: '3px',
                        borderColor: '#ef4444',
                      } : {}}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          {appointment.tags.includes("VIP") && <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">VIP</span>}
                          <div className={`w-2 h-2 rounded-full ${getServiceTypeDotColor(appointment.serviceType)}`}></div>
                          <span className="text-lg font-bold">{appointment.time}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{appointment.customerName}</div>
                          <div className="text-sm text-gray-600">{appointment.service} · {appointment.remainingTime}</div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.tags.filter(tag => tag !== "VIP").map((tag) => (
                            <span key={tag} className="inline-block bg-gray-100 px-2 py-0.5 rounded text-xs mr-1">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 時間間隔 - 空檔指示器 */}
                    {timeGap && index < dayAppointments.length - 1 && (
                      <div className="ml-4 mt-1">
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                          <div className="w-0.5 h-3 bg-gray-200"></div>
                          <span>☕ {timeGap} 空檔</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>此日期沒有預約</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">排程管理</h2>
          <p className="text-gray-500 mt-1 text-sm">查看今日預約與工作進度。</p>
          <p className="text-gray-600 mt-2 text-xs font-medium">{(() => {
            const hour = currentTime.getHours();
            const todayApps = getAppointmentsForDate(new Date());
            const totalApps = todayApps.length;

            // 計算進度百分比
            const completedApps = todayApps.filter(app => {
              const [hours, minutes] = app.time.split(':').map(Number);
              const appTime = new Date();
              appTime.setHours(hours, minutes, 0, 0);
              return appTime < currentTime;
            }).length;
            const progress = totalApps > 0 ? Math.round((completedApps / totalApps) * 100) : 0;

            if (hour >= 5 && hour < 12) {
              return `早安！今天共有 ${totalApps} 筆預約，祝您有美好的一天。`;
            } else if (hour >= 12 && hour < 20) {
              return `辛苦了，目前進度已完成 ${progress}%，加油！`;
            } else {
              return `深夜好，為您準備好明日的排程預覽。`;
            }
          })()}</p>
        </div>
      </div>

      <div className="bg-[#F9FAFB] rounded-xl p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
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

          <div className="flex items-center gap-3">
            {/* 視圖切換 Segmented Control */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("day")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === "day" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                日
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === "week" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                週
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === "month" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                月
              </button>
            </div>

            <button
              onClick={handleToday}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              今天
            </button>
          </div>
        </div>

        {/* 根據視圖模式渲染不同內容 */}
        {viewMode === "day" && renderDayView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "month" && (
          <div className="grid grid-cols-7 gap-2 rounded-lg overflow-hidden">
            {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
              <div key={day} className="bg-gray-50 p-2 text-center text-sm font-bold text-gray-900 uppercase">
                {day}
              </div>
            ))}
            {renderCalendarDays()}
          </div>
        )}
      </div>

      {/* 今日時間軸 - 極簡摘要型（只在月視圖和週視圖顯示） */}
      {viewMode !== "day" && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowTimeline(!showTimeline)}>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {currentDate.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })} 剩餘預約
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTimeline(!showTimeline);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              {showTimeline ? <ChevronDown className="w-5 h-5" /> : <ChevronDown className="w-5 h-5 rotate-180" />}
            </button>
          </div>

          {showTimeline && (
            <div className="p-4 bg-gray-50">
              {/* 大提示：防止看錯日期 */}
              {(() => {
                const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
                const todayApps = getAppointmentsForDate(currentDate);
                if (todayApps.length > 0) {
                  const [firstHours, firstMinutes] = todayApps[0].time.split(':').map(Number);
                  const firstAppointmentMinutes = firstHours * 60 + firstMinutes;
                  if (currentMinutes < firstAppointmentMinutes) {
                    const diffMinutes = firstAppointmentMinutes - currentMinutes;
                    const hours = Math.floor(diffMinutes / 60);
                    const minutes = diffMinutes % 60;
                    const hoursWithDecimal = hours + minutes / 60;
                    const currentTimeStr = currentTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
                    return (
                      <div className="mb-3 bg-gray-100 border border-gray-200 rounded-xl p-3 shadow-sm">
                        <div className="text-base font-bold text-gray-900">
                          現在是 {currentDate.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })} ({currentDate.toLocaleDateString('zh-TW', { weekday: 'short' })}) {currentTimeStr}
                        </div>
                        <div className="text-gray-600 text-sm mt-1">
                          您距離第一筆預約 ({todayApps[0].time}) 還有 {hoursWithDecimal.toFixed(1)} 小時。
                        </div>
                      </div>
                    );
                  }
                }
                return null;
              })()}

              <div className="space-y-2">
                {getAppointmentsForDate(currentDate)
                  .filter((app) => {
                    const [hours, minutes] = app.time.split(':').map(Number);
                    const appointmentMinutes = hours * 60 + minutes;
                    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
                    return appointmentMinutes >= currentMinutes;
                  })
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((appointment, index) => {
                    const isNext = index === 0;
                    return (
                      <div
                        key={appointment.id}
                        onClick={() => handleTimelineAppointmentClick(appointment)}
                        className={`flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors cursor-pointer text-sm ${isNext ? 'bg-gray-100 border border-gray-300' : ''}`}
                      >
                        {isNext && (
                          <span className="text-xs font-bold text-gray-900 bg-gray-200 px-2 py-0.5 rounded">
                            Next
                          </span>
                        )}
                        <span className={`font-bold min-w-[50px] ${isNext ? 'text-gray-900' : 'text-gray-900'}`}>{appointment.time}</span>
                        <span className={`flex-1 ${isNext ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>{appointment.customerName}</span>
                        <span className={`text-gray-500`}>{appointment.serviceAbbr}</span>
                      </div>
                    );
                  })}
                {getAppointmentsForDate(currentDate).filter((app) => {
                  const [hours, minutes] = app.time.split(':').map(Number);
                  const appointmentMinutes = hours * 60 + minutes;
                  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
                  return appointmentMinutes >= currentMinutes;
                }).length === 0 && (
                  <div className="text-center py-4 text-sm text-gray-400">
                    此日期已無剩餘預約
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 側邊戰情欄 - 預約詳情 */}
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto pl-8">
          {selectedAppointment && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-2xl font-bold">預約詳情</SheetTitle>
                  <button
                    onClick={() => setShowSheet(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </SheetHeader>

              <div className="space-y-6">
                {/* 客戶資訊 */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{selectedAppointment.customerName}</h3>
                      <p className="text-sm text-gray-600">{selectedAppointment.service}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{selectedAppointment.date} {selectedAppointment.time}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{selectedAppointment.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{selectedAppointment.email}</span>
                    </div>
                  </div>
                </div>

                {/* 標籤 */}
                {selectedAppointment.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      標籤
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAppointment.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-3 py-1 text-sm rounded-full ${tag === 'VIP' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-700'}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI 備註 */}
                {selectedAppointment.aiNotes && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2">AI 備註</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {selectedAppointment.aiNotes}
                    </p>
                  </div>
                )}

                {/* 歷史紀錄 */}
                {selectedAppointment.history.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2">歷史紀錄</h4>
                    <div className="space-y-2">
                      {selectedAppointment.history.map((record, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">{record.service}</p>
                            <p className="text-xs text-gray-500">{record.date}</p>
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {record.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
