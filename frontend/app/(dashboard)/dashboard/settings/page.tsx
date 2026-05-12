"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Key, Save, Check, CheckCircle, Bot, Plus, X, Store, MapPin, Phone, Building2, Package, FileText, User, Database, Eye, EyeOff, Pen, Calendar, CalendarClock, ExternalLink, MoreHorizontal, Headphones, BookOpen, Bell, Play, Clock, Loader2, Users, Edit, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, XCircle, Ban, Copy, Trash2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import dayjs from "dayjs";
import { useToast } from "@/hooks/use-toast";
import { validateEmployeeSchedules, removeServiceFromEmployees, type EmployeeAdvanceSettings } from "@/lib/booking-logic";

type MainTabType = 'account' | 'basic' | 'third_party' | 'ai' | 'other';
type SubTabType = 'line' | 'ai_agent' | 'store' | 'services' | 'faq' | 'staff' | 'booking_settings' | 'notification' | 'support' | 'manual';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('account');
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('ai_agent');
  const [expandedMainTab, setExpandedMainTab] = useState<MainTabType | null>('account');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // 注入自定義滾動條樣式
  useEffect(() => {
    const customScrollbarStyles = `
      /* 隱藏原生滾動條 */
      .custom-scrollbar-thin {
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE and Edge */
      }
      
      .custom-scrollbar-thin::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera */
        width: 0px;
        height: 0px;
      }
      
      /* 懸停時顯示滾動條 */
      .custom-scrollbar-thin:hover {
        scrollbar-width: thin; /* Firefox */
        scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
      }
      
      .custom-scrollbar-thin:hover::-webkit-scrollbar {
        display: block; /* Chrome, Safari, Opera */
        width: 4px;
        height: 4px;
      }
      
      .custom-scrollbar-thin:hover::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .custom-scrollbar-thin:hover::-webkit-scrollbar-thumb {
        background: rgba(156, 163, 175, 0.3);
        border-radius: 2px;
      }
      
      .custom-scrollbar-thin:hover::-webkit-scrollbar-thumb:hover {
        background: rgba(156, 163, 175, 0.5);
      }
      
      .custom-scrollbar-thin:hover::-webkit-scrollbar-thumb:active {
        background: rgba(156, 163, 175, 0.7);
      }

      /* 滾動選擇器專用滾動條樣式 */
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px !important;
        height: 0 !important; /* 隱藏橫向滾動條 */
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f3f4f6 !important;
        border-radius: 3px !important;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #d1d5db 0%, #9ca3af 100%) !important;
        border-radius: 3px !important;
        transition: all 0.3s ease !important;
        border: 1px solid #e5e7eb !important;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #9ca3af 0%, #6b7280 100%) !important;
        border-color: #d1d5db !important;
        transform: scale(1.1) !important;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb:active {
        background: linear-gradient(180deg, #6b7280 0%, #4b5563 100%) !important;
        transform: scale(0.95) !important;
      }

      /* Firefox 滾動選擇器滾動條樣式 */
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #9ca3af #f3f4f6;
      }
      
      .custom-scrollbar:hover {
        scrollbar-color: #6b7280 #f3f4f6;
      }

      /* 小選單動畫 */
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
    `;

    // 檢查是否已經存在樣式
    if (!document.getElementById('custom-scrollbar-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'custom-scrollbar-styles';
      styleSheet.textContent = customScrollbarStyles;
      document.head.appendChild(styleSheet);
    }

    // 清理函數
    return () => {
      const existingStyle = document.getElementById('custom-scrollbar-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  // 台灣國定假日資料（固定日期的假日）
  const taiwanHolidays: Record<string, string> = {
    // 1月
    '1-1': '元旦',
    
    // 2月
    '2-28': '和平紀念日',
    
    // 4月
    '4-4': '兒童節',
    
    // 6月
    '6-9': '端午節', // 農曆，但暫時用固定日期
    
    // 9月
    '9-28': '教師節',
    
    // 10月
    '10-10': '國慶日',
    
    // 12月
    '12-25': '聖誕節'
  };

  // 判斷是否為假日
  const isHoliday = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day);
    const weekday = date.getDay();
    
    // 週六(6)或週日(0)是假日
    if (weekday === 0 || weekday === 6) {
      return true;
    }
    
    // 檢查國定假日
    const monthDay = `${month + 1}-${day}`;
    if (taiwanHolidays[monthDay]) {
      return true;
    }
    
    // 農曆假日（這裡簡化處理，實際需要農曆轉換）
    // 春節、端午、中秋等需要更複雜的計算
    
    return false;
  };

  // Handle URL parameters for tab/sub-tab navigation
  useEffect(() => {
    const tab = searchParams.get('tab') as MainTabType;
    const sub = searchParams.get('sub') as SubTabType;
    if (tab && sub) {
      setActiveMainTab(tab);
      setActiveSubTab(sub);
      setExpandedMainTab(null);
    }
  }, [searchParams]);

  // Notification List
  const [notifications, setNotifications] = useState([
    { id: 1, title: '系統通知', message: '歡迎使用數位店長系統', time: '剛剛', read: false },
    { id: 2, title: '新預約', message: '客戶張三預約了剪髮服務', time: '10分鐘前', read: false },
    { id: 3, title: '預約提醒', message: '客戶李四的預約將在1小時後開始', time: '1小時前', read: true },
    { id: 4, title: '取消預約', message: '客戶王五取消了預約', time: '2小時前', read: true },
    { id: 5, title: '系統更新', message: '系統已更新至最新版本', time: '昨天', read: true },
  ]);

  // LINE Settings
  const [lineConfig, setLineConfig] = useState({
    lineApiKey: "",
    lineSecret: "",
    userId: "",
  });
  const [lineCopied, setLineCopied] = useState(false);
  const [lineSaving, setLineSaving] = useState(false);
  const [lineSaveSuccess, setLineSaveSuccess] = useState(false);
  const [lineValidating, setLineValidating] = useState(false);
  const [lineValidationError, setLineValidationError] = useState<string | null>(null);
  const [lineValidationStatus, setLineValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [lineValidationMessage, setLineValidationMessage] = useState<string>('');

  // AI Settings
  const [aiConfig, setAiConfig] = useState<{
    tone: string;
    customTone?: string;
    sampleText?: string;
    rules: string[];
    hardcodedRules: {
      noHallucination: boolean;
      driveBooking: boolean;
      comfortEmotions: boolean;
      prioritizeStore: boolean;
    };
  }>({
    tone: "friendly",
    customTone: "",
    sampleText: "",
    rules: [""],
    hardcodedRules: {
      noHallucination: false,
      driveBooking: false,
      comfortEmotions: false,
      prioritizeStore: false
    }
  });
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSaveSuccess, setAiSaveSuccess] = useState(false);

  // Store Settings
  const [storeConfig, setStoreConfig] = useState({
    storeName: "",
    address: "",
    googleMapLink: "",
    phone: "",
    storeType: "",
    storeDescription: "",
    storeLocationImage: "",
  });
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeSaveSuccess, setStoreSaveSuccess] = useState(false);
  const [storeUploading, setStoreUploading] = useState(false);

  // Staff Settings
  const [staffList, setStaffList] = useState<Array<{ id: string; name: string; phone: string; role: string; concurrentServiceCount: number; description: string; color: string; collapsed: boolean; specialty?: string }>>([]);
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffSaveSuccess, setStaffSaveSuccess] = useState(false);
  const [deleteStaffId, setDeleteStaffId] = useState<string | null>(null);

  const colorOptions = [
    "#FF0000", "#FF4500", "#FF6347", "#FF7F50", "#FF8C00", "#FFA500",
    "#FFD700", "#FFFF00", "#ADFF2F", "#32CD32", "#00FF00", "#00FA9A",
    "#00FFFF", "#00BFFF", "#1E90FF", "#0000FF", "#4169E1", "#6495ED",
    "#8A2BE2", "#9400D3", "#4B0082", "#D3D3D3", "#696969", "#000000"
  ];

  // Service Categories Settings
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categorySaveSuccess, setCategorySaveSuccess] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [showCategoryView, setShowCategoryView] = useState(false);
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);

  // Service Items Settings
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("");
  const [serviceItems, setServiceItems] = useState<Array<{ id: string; name: string; description: string; price: number; duration: number; category: string }>>([]);

  // Business Hours Settings
  // Booking Rules Settings
  const [bookingRules, setBookingRules] = useState({
    min_lead_time: 2,
    max_future_days: 30,
    auto_accept: true,
    buffer_time: 15
  });
  const [bookingSaving, setBookingSaving] = useState(false);

  // Employee Advance Settings
  const [employeeSettings, setEmployeeSettings] = useState<EmployeeAdvanceSettings[]>([]);
  const [employeeSettingsSaving, setEmployeeSettingsSaving] = useState(false);

  // Booking Settings - 員工進階編輯
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffAdvancedTab, setStaffAdvancedTab] = useState<'advanced' | 'schedule' | 'service'>('advanced');
  const [staffAdvancedSaving, setStaffAdvancedSaving] = useState(false);
  const [staffAdvancedSaveSuccess, setStaffAdvancedSaveSuccess] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<Array<{ hour: number; minute: number }>>([]);
  const [showEarlyMorningPicker, setShowEarlyMorningPicker] = useState(false);
  const [selectedEarlyMorningTimes, setSelectedEarlyMorningTimes] = useState<Array<{ hour: number; minute: number }>>([]);
  
  // 小彈窗狀態
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hoveredAppointment, setHoveredAppointment] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dateScrollRef = useRef<HTMLDivElement>(null);
  
  // 彈窗專用refs
  const modalMonthDropdownRef = useRef<HTMLDivElement>(null);
  const [showModalMonthDropdown, setShowModalMonthDropdown] = useState(false);
  
  // 區間日期選擇彈窗狀態
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState({ year: new Date().getFullYear(), month: new Date().getMonth(), day: new Date().getDate() });
  const [dateRangeEnd, setDateRangeEnd] = useState({ year: new Date().getFullYear(), month: new Date().getMonth(), day: new Date().getDate() });
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]); // 0=日, 1=一, ..., 6=六
  
  // 指定日期選擇彈窗狀態
  const [showSpecificDateModal, setShowSpecificDateModal] = useState(false);
  const [selectedSpecificDates, setSelectedSpecificDates] = useState<Array<{ year: number; month: number; day: number }>>([]);
  const [calendarMonth, setCalendarMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });
  
  // 刪除本日排班確認彈窗狀態
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  
  // 刪除區間排班彈窗狀態
  const [showDeleteRangeModal, setShowDeleteRangeModal] = useState(false);
  const [deleteRangeStart, setDeleteRangeStart] = useState({ year: new Date().getFullYear(), month: new Date().getMonth(), day: new Date().getDate() });
  const [deleteRangeEnd, setDeleteRangeEnd] = useState({ year: new Date().getFullYear(), month: new Date().getMonth(), day: new Date().getDate() });
  
  // 刪除區間排班確認彈窗狀態
  const [showDeleteRangeConfirmModal, setShowDeleteRangeConfirmModal] = useState(false);
  
  // 刪除全部排班確認彈窗狀態
  const [showDeleteAllSchedulesModal, setShowDeleteAllSchedulesModal] = useState(false);
  
  // 彈窗打開時自動滾動到選中日期
  useEffect(() => {
    if (showAddModal && selectedDate && dateScrollRef.current) {
      // 等待 DOM 更新完成後滾動
      setTimeout(() => {
        const scrollContainer = dateScrollRef.current;
        if (!scrollContainer) return;

        // 查找選中日期的 DOM 元素
        const selectedDateStr = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;
        const selectedButton = scrollContainer.querySelector(`button[data-date="${selectedDateStr}"]`);
        
        if (selectedButton) {
          // 計算讓選中按鈕在容器中間的滾動位置
          const containerHeight = scrollContainer.clientHeight;
          const buttonRect = selectedButton.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();
          
          // 計算按鈕相對於容器的位置
          const buttonTop = buttonRect.top - containerRect.top + scrollContainer.scrollTop;
          const buttonHeight = buttonRect.height;
          
          // 計算目標滾動位置（讓按鈕在容器中間）
          const targetScrollTop = buttonTop - (containerHeight / 2) + (buttonHeight / 2);
          
          // 確保不超出滾動範圍
          const maxScrollTop = scrollContainer.scrollHeight - containerHeight;
          const finalScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));
          
          scrollContainer.scrollTo({
            top: finalScrollTop,
            behavior: 'smooth'
          });
        } else {
          // 如果找不到對應的按鈕，使用備用計算方法
          const year = selectedDate.year;
          const month = selectedDate.month;
          const day = selectedDate.day;
          
          // 計算從年初到選中日期的總天數
          let totalDays = 0;
          for (let m = 0; m < month; m++) {
            totalDays += new Date(year, m + 1, 0).getDate();
          }
          totalDays += day - 1;
          
          // 每個日期元素的高度和間距
          const dayHeight = 48 + 12; // 按鈕高度 + 間距
          const targetScrollTop = totalDays * dayHeight + 50; // 50是初始的padding-top
          
          // 滾動到目標位置，讓選中日期在中間
          const containerHeight = scrollContainer.clientHeight;
          const centerOffset = containerHeight / 2 - dayHeight / 2;
          const finalScrollTop = targetScrollTop - centerOffset;
          
          scrollContainer.scrollTo({
            top: finalScrollTop,
            behavior: 'smooth'
          });
        }
      }, 200); // 等待200ms讓DOM完全渲染
    }
  }, [showAddModal, selectedDate]);

  // 點擊空白處關閉小選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // 檢查是否點擊在小選單外部或按鈕外部
      if (showCopyModal && !target.closest('[data-copy-modal]') && !target.closest('[data-copy-button]')) {
        setShowCopyModal(false);
      }
      if (showDeleteModal && !target.closest('[data-delete-modal]') && !target.closest('[data-delete-button]')) {
        setShowDeleteModal(false);
      }
      // 添加時間選擇器下拉選單的關閉邏輯
      if (showModalMonthDropdown && !target.closest('[data-modal-month-dropdown]') && !target.closest('[data-date-picker]')) {
        setShowModalMonthDropdown(false);
      }
    };

    if (showCopyModal || showDeleteModal || showModalMonthDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showCopyModal, showDeleteModal, showModalMonthDropdown]);
  // 個人班表專用refs
  const staffYearDropdownRef = useRef<HTMLDivElement>(null);
  const staffMonthDropdownRef = useRef<HTMLDivElement>(null);
  const [showStaffYearDropdown, setShowStaffYearDropdown] = useState(false);
  const [showStaffMonthDropdown, setShowStaffMonthDropdown] = useState(false);
  
  // 保留原有的全域refs（用於其他地方）
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  // 年月選擇器相關數據
  const years = Array.from({ length: 10 }, (_, i) => {
    const currentYear = new Date().getFullYear();
    return currentYear - 5 + i;
  });
  
  const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  // 獲取預約狀態
  const getStatus = (appointment: any): string => {
    return appointment.status || 'confirmed';
  };

  // 從 Supabase 獲取預約資料
  const fetchBookingsFromSupabase = async (supabase: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      console.log('[Settings] 當前登入 user_id:', user.id);

      // 從 shop_bookings_v3 讀取 all_bookings JSONB 欄位
      const { data, error } = await supabase
        .from('shop_bookings_v3')
        .select('all_bookings')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      console.log('[Settings] 從 Supabase 抓取到的原始預約數量:', data?.all_bookings?.length || 0);

      // 前端過濾：只排除已取消的預約
      let filteredData = (data?.all_bookings || []).filter((booking: any) => {
        const status = booking.status;
        if (status === 'cancelled') {
          console.log('[Settings] 排除已取消預約 ID:', booking.id, 'status:', status);
          return false;
        }
        console.log('[Settings] 保留預約 ID:', booking.id, 'status:', status);
        return true;
      });

      console.log('[Settings] 前端過濾後的預約數量:', filteredData.length);

      // 修正資料格式
      const cleanedData = filteredData.map((booking: any) => {
        const schedule = booking.schedule || {};
        const serviceContent = booking.service_info || {};
        const adminMeta = booking.admin_meta || {};

        let startTime = schedule.start;
        let endTime = schedule.end;
        let calculatedDuration = parseInt(schedule.duration || '0');
          // Load employee settings from settings table
          if (settingsData && settingsData.employee_settings) {
            setStaffList(settingsData.employee_settings.map((staff: any) => ({ ...staff, collapsed: true })));
            setEmployeeSettings(settingsData.employee_settings);
          }

        // V3 資料結構：使用 schedule 欄位
        if (!startTime && schedule.date && booking.time) {
          const startDateTime = new Date(`${schedule.date}T${booking.time}`);
          startTime = startDateTime.toISOString();

          if (calculatedDuration > 0) {
            const endDateTime = new Date(startDateTime.getTime() + calculatedDuration * 60000);
            endTime = endDateTime.toISOString();
          }
        }

        // 計算時長（分鐘）
        if (startTime && endTime) {
          try {
            const start = new Date(startTime);
            const end = new Date(endTime);
            calculatedDuration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
            if (calculatedDuration < 0) {
              calculatedDuration = booking.duration || 0;
            }
          } catch (e) {
            calculatedDuration = booking.duration || 0;
          }
        }

        return {
          ...booking,
          start_time: startTime,
          end_time: endTime,
          customerName: booking.customer_name || '店內任務',
          calculatedDuration,
          tags: [
            ...(booking.customer_detail?.tags || []),
            ...(booking.tags || []),
            ...(booking.admin_meta?.tags?.includes('黑名單') ? ['黑名單'] : [])
          ],
          aiNotes: booking.ai_notes || '',
          service: serviceContent.name || booking.service || '未指定服務',
          phone: booking.customer_phone || '',
          email: booking.customer_email || '',
          date: schedule.date || booking.date,
          duration: schedule.duration || '60',
          status: adminMeta.status || booking.status || 'confirmed',
          source: adminMeta.source || booking.source || 'manual',
          category: serviceContent.category || booking.category || 'booking',
          price: serviceContent.price || 0,
          customer_detail: booking.customer_detail,
          service_content: booking.service_content,
          schedule_config: booking.schedule_config,
          admin_meta: booking.admin_meta
        };
      });

      return cleanedData;
    } catch (error: any) {
      console.error('[Settings] 載入預約失敗:', error);
      return [];
    }
  };

  // 月曆相關的輔助函數
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getAppointmentsForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return getAppointmentsForDate(date);
  };

  const sortAppointments = (apps: any[], viewDate: Date) => {
    const startOfViewDay = dayjs(viewDate).startOf('day');

    return [...apps].sort((a, b) => {
      // 判定是否為「從昨天跨過來」的預約 - 使用 V3 結構 schedule.start
      const isACross = dayjs(a.schedule?.start).isBefore(startOfViewDay);
      const isBCross = dayjs(b.schedule?.start).isBefore(startOfViewDay);

      // 跨日預約排在最前面
      if (isACross && !isBCross) return -1;
      if (!isACross && isBCross) return 1;

      // 同樣跨日或同樣不跨日，按開始時間排序
      const timeA = dayjs(a.schedule?.start || '00:00');
      const timeB = dayjs(b.schedule?.start || '00:00');
      return timeA.isBefore(timeB) ? -1 : timeA.isAfter(timeB) ? 1 : 0;
    });
  };

  const handleAppointmentClick = (appointment: any) => {
    console.log('Appointment clicked:', appointment);
    // 這裡可以添加處理預約點擊的邏輯，例如打開詳情模態框
    alert('Appointment clicked!');
  };

  const formatTime = (time: string) => {
    // 如果時間格式是 HH:MM:SS，去掉秒數
    if (time && time.length > 5) {
      return time.substring(0, 5);
    }
    return time;
  };

  const parseRemainingTime = (timeStr: string): number => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const getTimeFromSchedule = (appointment: any): string => {
    // 優先讀取 schedule.start (ISO 字串)
    if (appointment.schedule?.start) {
      try {
        const timeStr = new Date(appointment.schedule.start).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
        return timeStr;
      } catch (error) {
        console.warn('schedule.start 解析失敗:', error);
      }
    }
    
    // 次選：讀取 start_time 欄位
    if (appointment.start_time) {
      try {
        const timeStr = appointment.start_time.split(' ')[1];
        const result = timeStr ? timeStr.substring(0, 5) : '00:00';
        return result;
      } catch (error) {
        console.warn('start_time 解析失敗:', error);
      }
    }
    
    return '00:00';
  };

  const handleAddService = (day: number) => {
    console.log('handleAddService called with day:', day);
    const date = {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth(),
      day: day
    };
    console.log('Setting selectedDate to:', date);
    setSelectedDate(date);
    
    // 根據當前格子重新設置選擇狀態
    const dateKey = `${date.year}-${String(date.month + 1).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    const currentSchedule = daySchedules[dateKey] || [];
    
    console.log('Current schedule for this date:', currentSchedule);
    
    // 重新設置選擇狀態
    setSelectedTimes(currentSchedule.filter(t => t.hour >= 6));
    setSelectedEarlyMorningTimes(currentSchedule.filter(t => t.hour < 6));
    
    console.log('Setting showAddModal to true');
    setShowAddModal(true);
  };

  const getWeekdayName = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day);
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return weekdays[date.getDay()];
  };

  const getAppointmentsForDate = (date: Date) => {
    // 強制字串化比對：不要用 Date 物件比對
    const targetDateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    // 核心邏輯：必須嚴格比對字串 + 增加防呆保護
    const filtered = appointments.filter(app => {
      // 同時支援 schedule.date 和 date 欄位
      let appDate;
      
      if (app.schedule?.date) {
        // 從 schedule.date 獲取日期（來自 Supabase 的資料）
        appDate = app.schedule.date;
      } else if (app.date) {
        // 從 date 欄位獲取日期（來自本地新增的資料）
        appDate = app.date;
      } else {
        return false;
      }
      
      // 強制字串化比對
      return appDate === targetDateString;
    });
    
    return filtered;
  };

  // 向上箭頭：回到上三個月的1號
  const handleUpArrow = () => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate.year, selectedDate.month - 3, 1);
    setSelectedDate({ year: newDate.getFullYear(), month: newDate.getMonth(), day: 1 });
    // 滾動到頂部
    if (dateScrollRef.current) {
      dateScrollRef.current.scrollTop = 0;
    }
  };

  // 處理滑鼠滾動事件用於日期選擇器
  const handleScroll = (e: React.WheelEvent, type: string) => {
    e.preventDefault();
    
    if (!selectedDate) return;

    const delta = e.deltaY > 0 ? 1 : -1;

    if (type === 'day') {
      const daysInMonth = new Date(selectedDate.year, selectedDate.month + 1, 0).getDate();
      let newDay = (selectedDate.day || 1) + delta;
      
      if (newDay < 1) newDay = 1;
      if (newDay > daysInMonth) newDay = daysInMonth;
      
      setSelectedDate({ ...selectedDate, day: newDay });
    } else if (type === 'month') {
      let newMonth = selectedDate.month + delta;
      
      if (newMonth < 0) {
        newMonth = 11;
        setSelectedDate({ ...selectedDate, month: newMonth, year: selectedDate.year - 1 });
      } else if (newMonth > 11) {
        newMonth = 0;
        setSelectedDate({ ...selectedDate, month: newMonth, year: selectedDate.year + 1 });
      } else {
        setSelectedDate({ ...selectedDate, month: newMonth });
      }
    } else if (type === 'year') {
      let newYear = selectedDate.year + delta;
      if (newYear < 1900) newYear = 1900;
      if (newYear > 2100) newYear = 2100;
      setSelectedDate({ ...selectedDate, year: newYear });
    }
  };

  // 向下箭頭：到下個月的1號
  const handleDownArrow = () => {
    if (!selectedDate) return;
    const newDate = new Date(selectedDate.year, selectedDate.month + 1, 1);
    setSelectedDate({ year: newDate.getFullYear(), month: newDate.getMonth(), day: 1 });
    // 滾動到頂部
    if (dateScrollRef.current) {
      dateScrollRef.current.scrollTop = 0;
    }
  };
  
  // 個人班表專用處理函數
  const handleStaffYearChange = (year: number) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
    setShowStaffYearDropdown(false);
  };
  
  const handleStaffMonthChange = (monthIndex: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));
    setShowStaffMonthDropdown(false);
  };
  
  // 彈窗專用處理函數
  const handleModalMonthChange = (monthIndex: number) => {
    setSelectedDate(prev => prev ? {...prev, month: monthIndex} : null);
    setShowModalMonthDropdown(false);
  };
  
  // 處理彈窗中的滾動事件
  const handleModalScroll = (e: React.WheelEvent, type: string) => {
    e.preventDefault();
    
    const currentDate = selectedDate || { year: new Date().getFullYear(), month: new Date().getMonth(), day: new Date().getDate() };
    const delta = e.deltaY > 0 ? 1 : -1;

    if (type === 'year') {
      let newYear = currentDate.year + delta;
      if (newYear < 1900) newYear = 1900;
      if (newYear > 2100) newYear = 2100;
      setSelectedDate({...currentDate, year: newYear});
    } else if (type === 'month') {
      let newMonth = currentDate.month + delta;
      let newYear = currentDate.year;
      
      if (newMonth < 0) {
        newMonth = 11;
        newYear = currentDate.year - 1;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear = currentDate.year + 1;
      }
      
      setSelectedDate({...currentDate, month: newMonth, year: newYear});
    }
  };
  
  const handleYearChange = (year: number) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
    setShowYearDropdown(false);
  };
  
  const handleMonthChange = (monthIndex: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));
    setShowMonthDropdown(false);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
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
      const dayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay(); // 0=Sunday, 6=Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const monthDay = `${currentDate.getMonth() + 1}-${day}`;
      const isHoliday = taiwanHolidays[monthDay];
      const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayAppointments = getAppointmentsForDay(day);
      const dayScheduleTimes = daySchedules[dateKey] || [];

      // 決定數字顏色
      let numberColor = 'text-gray-400'; // 預設顏色
      if (isToday) {
        numberColor = 'text-white'; // 今天的白色數字
      } else if (isWeekend || isHoliday) {
        numberColor = 'text-red-600'; // 週末或節日的紅色數字
      }

      days.push(
        <div
          key={day}
          className={`p-2 hover:bg-gray-50 transition-colors group cursor-pointer relative ${isToday ? 'bg-red-50' : 'bg-white'} shadow-sm flex flex-col overflow-hidden`}
          style={{ height: 'calc(3.5 * 56px + 40px)' }} // 固定高度：3.5組 + 其他元素高度
          onClick={() => handleAddService(day)} // 讓整個格子都可以點擊
        >
          <span className={`absolute top-1 right-2 text-sm font-medium ${isToday ? 'bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : numberColor}`}>
            {day}
          </span>
          
          {/* 漸層遮罩 - 覆蓋整個格子底部 */}
          {(() => {
            const groupedByHour = dayScheduleTimes.reduce((groups, time) => {
              const hour = time.hour;
              if (!groups[hour]) {
                groups[hour] = [];
              }
              groups[hour].push(time.minute);
              return groups;
            }, {} as Record<number, number[]>);
            
            const groupCount = Object.keys(groupedByHour).length;
            
            if (groupCount > 3.5) {
              return (
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/85 to-transparent pointer-events-none transition-opacity duration-300" 
                  style={{ 
                    zIndex: 50, // 調整z-index，確保彈窗（z-[70]）在遮罩之上
                    height: 'calc(0.8 * 56px)', // 減少高度，只覆蓋不到一組的資料
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0
                  }}
                  id={`gradient-mask-${day}`}
                ></div>
              );
            }
            return null;
          })()}
          
          {/* 新的排班時間顯示 */}
          {dayScheduleTimes.length > 0 && (
            <div className="mt-6 ml-2 h-full" style={{ height: 'calc(3.5 * 56px)' }}>
              <div 
                className="h-full overflow-y-auto relative group custom-scrollbar-thin" 
                style={{ 
                  maxHeight: 'calc(3.5 * 56px)',
                  zIndex: 20 // 提高z-index確保在遮罩之上，保持滾動功能
                }}
                onScroll={(e) => {
                  const scrollContainer = e.currentTarget;
                  const maskElement = document.getElementById(`gradient-mask-${day}`);
                  
                  if (maskElement && scrollContainer) {
                    const isAtBottom = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 10;
                    
                    if (isAtBottom) {
                      // 滾動到底部時，隱藏遮罩
                      maskElement.style.opacity = '0';
                    } else {
                      // 沒有到底部時，顯示遮罩
                      maskElement.style.opacity = '1';
                    }
                  }
                }}
              >
                <div className="flex flex-col gap-4">
                  {(() => {
                    // 按小時分組
                    const groupedByHour = dayScheduleTimes.reduce((groups, time) => {
                      const hour = time.hour;
                      if (!groups[hour]) {
                        groups[hour] = [];
                      }
                      groups[hour].push(time.minute);
                      return groups;
                    }, {} as Record<number, number[]>);

                    // 按小時排序
                    const sortedHours = Object.keys(groupedByHour)
                      .map(Number)
                      .sort((a, b) => a - b);

                    return sortedHours.map((hour) => {
                      const minutes = groupedByHour[hour].sort((a, b) => a - b);
                      return (
                        <div key={hour} className="flex flex-col items-start w-full">
                          <div className="text-lg font-bold text-gray-900 font-mono tabular-nums tracking-wide">
                            {hour.toString().padStart(2, '0')}
                          </div>
                          <div className="border-t border-gray-400 w-full my-1"></div>
                          <div className="text-xs text-gray-600 font-mono tabular-nums tracking-wide">
                            {minutes.map(m => m.toString().padStart(2, '0')).join('、')}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}
          
          {dayAppointments.length > 0 && (
            <div className="mt-6 flex-1 space-y-1 overflow-y-auto custom-scrollbar">
              {sortAppointments(dayAppointments, new Date(currentDate.getFullYear(), currentDate.getMonth(), day)).map((appointment) => (
                <div
                  key={appointment.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    // 只有預約項目可以點擊，活動項目不能點擊
                    if (appointment.service_info?.category === 'booking') {
                      handleAppointmentClick(appointment);
                    }
                  }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoverPosition({ x: rect.left - 50, y: rect.bottom + 8 });
                    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = setTimeout(() => {
                      setHoveredAppointment(appointment);
                    }, 200);
                  }}
                  onMouseLeave={() => {
                    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                    setHoveredAppointment(null);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md overflow-hidden cursor-pointer transition-colors ${
                    appointment.service_info?.category === 'activity'
                      ? 'bg-gray-50 border-2 border-dashed border-gray-300 hover:bg-gray-100'
                      : 'bg-black hover:bg-gray-900'
                  }`}
                >
                  {/* VIP 黃色色條 */}
                  {appointment.service_info?.category === 'booking' && appointment.admin_meta?.tags && appointment.admin_meta.tags.includes("VIP") && <div className="w-0.5 h-4 bg-yellow-400 rounded-full" />}

                  {/* 時間 */}
                  <span className={`text-[10px] font-bold whitespace-nowrap ${
                    appointment.service_info?.category === 'activity' ? 'text-gray-600 font-normal' : 'text-white'
                  }`}>{formatTime(appointment.schedule?.start) || '00:00'}</span>

                  {/* 姓名 */}
                  <span className={`text-[11px] truncate flex-1 ${
                    appointment.service_info?.category === 'activity' ? 'text-gray-600 font-light' : 'text-gray-100 font-medium'
                  }`}>
                    {appointment.service_info?.category === 'activity' ? appointment.service_info?.name || '未指定服務' : appointment.customer_name || '無名稱'}
                  </span>

                  {/* 時長 */}
                  {appointment.duration && (
                    <span className={`text-[9px] whitespace-nowrap ${
                      appointment.service_info?.category === 'activity' ? 'text-gray-500' : 'text-gray-300'
                    }`}>{appointment.duration}分鐘</span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* 加號或編輯按鈕 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              
              // 如果已有排班時間，預填入現有時間
              if (dayScheduleTimes.length > 0) {
                setSelectedTimes(dayScheduleTimes.filter(t => t.hour >= 6));
                setSelectedEarlyMorningTimes(dayScheduleTimes.filter(t => t.hour < 6));
              } else {
                // 計算建議時間：該日期最後一筆預約結束時間 + 10 分鐘
                const dayAppointments = appointments.filter(app => app.date === dateStr && app.category === 'booking');
                let suggestedTime = '09:00'; // 預設 9:00
                
                if (dayAppointments.length > 0) {
                  // 找到最晚的預約
                  const lastAppointment = sortAppointments([...dayAppointments], new Date(currentDate.getFullYear(), currentDate.getMonth(), day))[0];
                  const timeStr = getTimeFromSchedule(lastAppointment);
                  const [hours, minutes] = timeStr.split(':').map(Number);
                  const lastAppointmentTime = new Date(dateStr);
                  lastAppointmentTime.setHours(hours, minutes, 0, 0);
                  
                  const duration = parseRemainingTime(lastAppointment.remainingTime);
                  const endTime = new Date(lastAppointmentTime.getTime() + duration * 60000);
                  
                  // 加上 10 分鐘
                  endTime.setMinutes(endTime.getMinutes() + 10);
                  
                  const suggestedHours = String(endTime.getHours()).padStart(2, '0');
                  const suggestedMinutes = String(endTime.getMinutes()).padStart(2, '0');
                  suggestedTime = `${suggestedHours}:${suggestedMinutes}`;
                }
              }
              
              handleAddService(day);
            }}
            className={`absolute inset-0 flex items-center justify-center transition-opacity ${
              dayScheduleTimes.length > 0 
                ? 'opacity-0 group-hover:opacity-100' 
                : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {dayScheduleTimes.length > 0 ? (
              <div className="absolute bottom-1 right-1" style={{ zIndex: 60 }}>
                <Plus className="w-4 h-4 text-black" />
              </div>
            ) : (
              <Plus className="w-8 h-8 text-black" />
            )}
          </button>
        </div>
      );
    }

    return days;
  };

  // 下拉選單狀態管理
  const [copyDropdownOpen, setCopyDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 點擊外部關閉複製下拉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCopyDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [copyDropdownOpen]);
  
  // 動態生成複製設定用的人員列表
  const copyStaffList = useMemo(() => {
    const list = [
      { id: 'all', name: '全體員工', type: 'all' }
    ];
    
    // 添加實際員工，排除當前正在編輯的員工
    staffList.forEach(staff => {
      if (staff.id !== editingStaffId) {
        list.push({
          id: staff.id,
          name: staff.name,
          type: 'individual'
        });
      }
    });
    
    return list;
  }, [staffList, editingStaffId]);

  // Booking Settings - 開放預約區間
  const [bookingOpenDay, setBookingOpenDay] = useState(1);
  const [bookingOpenHour, setBookingOpenHour] = useState(10);
  const [bookingOpenMonths, setBookingOpenMonths] = useState('next_month');
  const [bookingAdvance, setBookingAdvance] = useState('1_day');
  const [scrollPickerOpen, setScrollPickerOpen] = useState<'day' | 'hour' | 'months' | 'advance' | null>(null);
  const [pickerPosition, setPickerPosition] = useState<{ x: number; y: number } | null>(null);

  // 複製設定確認彈窗狀態
  const [showCopyConfirmModal, setShowCopyConfirmModal] = useState(false);
  const [copyTargetStaff, setCopyTargetStaff] = useState<{ id: string; name: string; type: string } | null>(null);

  // 個人服務選擇狀態
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [availableServices, setAvailableServices] = useState<string[]>([]);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  
  // 顧客預約選取模式狀態
  const [bookingSelectionMode, setBookingSelectionMode] = useState<'single' | 'multiple'>('single');
  
  // 個人班表時間存儲狀態（單次儲存）
  const [daySchedules, setDaySchedules] = useState<Record<string, Array<{hour: number, minute: number}>>>({});

  // 處理複製設定點擊
  const handleCopySettingsClick = (staff: { id: string; name: string; type: string }) => {
    setCopyTargetStaff(staff);
    setShowCopyConfirmModal(true);
    setCopyDropdownOpen(false);
  };

  // 確認複製設定
  const confirmCopySettings = () => {
    if (copyTargetStaff) {
      console.log(`複製設定到: ${copyTargetStaff.name} (${copyTargetStaff.id})`);
      // 這裡可以添加實際的複製邏輯
      setShowCopyConfirmModal(false);
      setCopyTargetStaff(null);
    }
  };

  // 取消複製設定
  const cancelCopySettings = () => {
    setShowCopyConfirmModal(false);
    setCopyTargetStaff(null);
  };

  // 獲取當前分頁的設定名稱
  const getCurrentTabSettingsName = () => {
    switch (staffAdvancedTab) {
      case 'advanced':
        return '進階設定';
      case 'schedule':
        return '個人班表';
      case 'service':
        return '個人服務';
      default:
        return '設定';
    }
  };

  // 從 Supabase 讀取可用的服務項目
  const fetchAvailableServices = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        console.error('獲取用戶失敗:', userError);
        return;
      }

      console.log('正在讀取用戶ID:', userData.user.id);

      const { data, error } = await supabase
        .from('settings')
        .select('service_settings')
        .eq('user_id', userData.user.id)
        .single();
      
      console.log('資料庫查詢結果:', { data, error });
      
      if (error) {
        console.error('讀取服務設定失敗:', error);
        return;
      }
      
      if (data && data.service_settings) {
        console.log('找到 service_settings 資料:', data.service_settings);
        console.log('資料類型:', typeof data.service_settings);
        console.log('是否為陣列:', Array.isArray(data.service_settings));
        
        // 假設 service_settings 是一個包含服務項目的物件或陣列
        let services: string[] = [];
        
        if (data.service_settings.services && Array.isArray(data.service_settings.services)) {
          // 如果 services 是陣列，提取 name 欄位
          services = data.service_settings.services
            .filter((service: any) => service && typeof service.name === 'string')
            .map((service: any) => service.name as string)
            .filter(Boolean);
          console.log('從 services 陣列提取的服務:', services);
        } else if (Array.isArray(data.service_settings)) {
          // 如果整個 service_settings 是陣列
          services = data.service_settings
            .filter((service: any) => service && typeof service.name === 'string')
            .map((service: any) => service.name as string)
            .filter(Boolean);
          console.log('從 service_settings 陣列提取的服務:', services);
        } else if (typeof data.service_settings === 'object' && data.service_settings !== null) {
          // 如果是物件，嘗試提取服務項目
          services = Object.values(data.service_settings)
            .filter((item: any) => item && typeof item === 'string')
            .map((item: any) => item as string)
            .filter(Boolean);
          console.log('從物件提取的服務:', services);
        }
        
        // 如果沒有找到服務項目，使用預設清單
        if (services.length === 0) {
          console.log('沒有找到服務項目，使用預設清單');
          services = ['洗剪', '染髮', '燙髮', '護髮', '造型', '头皮护理', '其他'];
        }
        
        setAvailableServices(services);
        console.log('最終設定的可用服務:', services);
      } else {
        console.log('沒有找到 service_settings 資料，使用預設清單');
        // 如果沒有資料，使用預設清單
        const defaultServices = ['洗剪', '染髮', '燙髮', '護髮', '造型', '头皮护理', '其他'];
        setAvailableServices(defaultServices);
      }
    } catch (error) {
      console.error('讀取服務設定時發生錯誤:', error);
      // 發生錯誤時使用預設清單
      const defaultServices = ['洗剪', '染髮', '燙髮', '護髮', '造型', '头皮护理', '其他'];
      setAvailableServices(defaultServices);
    }
  };

  // 當服務下拉選單開啟時，讀取服務設定
  useEffect(() => {
    if (showServiceDropdown && !servicesLoaded) {
      fetchAvailableServices();
      setServicesLoaded(true);
    }
  }, [showServiceDropdown, servicesLoaded]);

  // 處理服務項目從未選擇移到已選擇
  const handleSelectService = (service: string) => {
    // 防止重複添加
    if (selectedServices.includes(service)) {
      console.log('服務已存在，跳過:', service);
      return;
    }
    
    console.log('選擇前的可用服務:', availableServices);
    console.log('選擇前的已選擇:', selectedServices);
    
    const newSelectedServices = [...selectedServices, service];
    const newAvailableServices = availableServices.filter(s => s !== service);
    
    console.log('選擇服務:', service);
    console.log('新的已選擇:', newSelectedServices);
    console.log('新的可用服務:', newAvailableServices);
    console.log('過濾是否正確:', !newAvailableServices.includes(service));
    
    setSelectedServices(newSelectedServices);
    setAvailableServices(newAvailableServices);
  };

  // 處理服務項目從已選擇移回未選擇
  const handleRemoveService = (service: string) => {
    // 防止重複移除
    if (!selectedServices.includes(service)) {
      console.log('服務不存在，跳過:', service);
      return;
    }
    
    const newSelectedServices = selectedServices.filter(s => s !== service);
    
    // 確保服務不會重複添加到可用服務列表中
    let newAvailableServices = [...availableServices];
    if (!newAvailableServices.includes(service)) {
      newAvailableServices.push(service);
    }
    
    console.log('移除服務:', service);
    console.log('新的已選擇:', newSelectedServices);
    console.log('新的可用服務:', newAvailableServices);
    
    setSelectedServices(newSelectedServices);
    setAvailableServices(newAvailableServices);
  };

  const handleScrollPickerOpen = (type: 'day' | 'hour' | 'months' | 'advance', event: React.MouseEvent) => {
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // 找到最近的相對定位父容器
    let parent = target.parentElement;
    while (parent && parent.style.position !== 'relative') {
      parent = parent.parentElement;
    }
    
    if (parent) {
      const parentRect = parent.getBoundingClientRect();
      // 計算相對於父容器的位置
      setPickerPosition({
        x: rect.left - parentRect.left,
        y: rect.bottom - parentRect.top + 4
      });
    } else {
      // 如果找不到相對定位父容器，使用視口位置
      setPickerPosition({
        x: rect.left,
        y: rect.bottom + 4
      });
    }
    
    setScrollPickerOpen(type);
  };

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setScrollPickerOpen(null);
        setPickerPosition(null);
      }
    };

    if (scrollPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [scrollPickerOpen]);

  // Booking Settings - 預約取消設定
  const [cancellationPolicy, setCancellationPolicy] = useState<'same_day_allowed' | 'same_day_not_allowed' | 'online_banned' | 'days_not_allowed'>('same_day_allowed');
  const [cancellationDropdownOpen, setCancellationDropdownOpen] = useState(false);
  const [cancellationDays, setCancellationDays] = useState(1);

  // Booking Settings - 顧客遲到設定
  const [lateArrivalEnabled, setLateArrivalEnabled] = useState(false);
  const [lateArrivalCount, setLateArrivalCount] = useState(3);

  // Booking Settings - 顧客爽約設定
  const [noShowEnabled, setNoShowEnabled] = useState(false);
  const [noShowCount, setNoShowCount] = useState(3);

  // Booking Settings - 顧客取消預約設定
  const [customerCancelEnabled, setCustomerCancelEnabled] = useState(false);
  const [customerCancelCount, setCustomerCancelCount] = useState(3);

  // Booking Settings - 預約緩衝設定
  const [bufferEnabled, setBufferEnabled] = useState(false);
  const [bufferMinutes, setBufferMinutes] = useState(15);

  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceSaveSuccess, setServiceSaveSuccess] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [draggedServiceIndex, setDraggedServiceIndex] = useState<number | null>(null);
  const [serviceError, setServiceError] = useState<string>("");
  const [categoryError, setCategoryError] = useState<string>("");
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    price: 0,
    duration: 30,
    category: ""
  });
  const [serviceDropdownId, setServiceDropdownId] = useState<string | null>(null);

  // Account Settings
  const [usernameForm, setUsernameForm] = useState({
    newUsername: "",
    currentPassword: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameSaveSuccess, setUsernameSaveSuccess] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaveSuccess, setPasswordSaveSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [expandedLineStep, setExpandedLineStep] = useState<number | null>(null);

  // Refs for click outside detection
  const tabRefs = useRef<Record<MainTabType, HTMLElement | null>>({} as Record<MainTabType, HTMLElement | null>);
  const serviceDropdownRef = useRef<HTMLDivElement | null>(null);
  const categoryEditRef = useRef<HTMLDivElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const copyDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // 檢查個人班表下拉選單
      if (showStaffYearDropdown && !target.closest('[data-staff-year-dropdown]')) {
        setShowStaffYearDropdown(false);
      }
      if (showStaffMonthDropdown && !target.closest('[data-staff-month-dropdown]')) {
        setShowStaffMonthDropdown(false);
      }
      
      // 檢查彈窗下拉選單
      if (showModalMonthDropdown && !target.closest('[data-modal-month-dropdown]')) {
        setShowModalMonthDropdown(false);
      }
      
      // 檢查原有下拉選單（保留向後兼容）
      if (showYearDropdown && !target.closest('[data-year-dropdown]')) {
        setShowYearDropdown(false);
      }
      if (showMonthDropdown && !target.closest('[data-month-dropdown]')) {
        setShowMonthDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStaffYearDropdown, showStaffMonthDropdown, showModalMonthDropdown, showYearDropdown, showMonthDropdown]);

  // Cancel category edit when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryEditRef.current && !categoryEditRef.current.contains(event.target as Node) && editingCategoryId) {
        cancelCategoryEdit();
      }
    };

    if (editingCategoryId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [editingCategoryId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expandedMainTab) {
        const target = event.target as HTMLElement;
        const currentRef = tabRefs.current[expandedMainTab];
        if (currentRef && !currentRef.contains(target)) {
          setExpandedMainTab(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedMainTab]);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
  const webhookUrl = `${baseUrl}/api/webhook/${lineConfig.userId}`;

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setLineConfig(prev => ({ ...prev, userId: user.id }));

          // Fetch settings from settings table
          const { data: settingsData, error: settingsError } = await supabase
            .from('settings')
            .select('store_setting, employee_settings, service_settings, booking_rules')
            .eq('user_id', user.id)
            .single();

          if (settingsError) throw settingsError;

          // Fetch LINE credentials from users table
          const { data: lineData, error: lineError } = await supabase
            .from('users')
            .select('line_channel_access_token, line_channel_secret, ai_settings, username')
            .eq('id', user.id)
            .maybeSingle();

          if (lineData) {
            if (lineData.username) {
              setCurrentUsername(lineData.username);
            }
            setLineConfig(prev => ({
              ...prev,
              lineApiKey: lineData.line_channel_access_token || '',
              lineSecret: lineData.line_channel_secret || ''
            }));

            if (lineData.ai_settings) {
              setAiConfig({
                tone: lineData.ai_settings.tone || 'friendly',
                customTone: lineData.ai_settings.customTone || '',
                sampleText: lineData.ai_settings.sampleText || '',
                rules: lineData.ai_settings.rules || [""],
                hardcodedRules: lineData.ai_settings.hardcodedRules || {
                  noHallucination: false,
                  driveBooking: false,
                  comfortEmotions: false,
                  prioritizeStore: false
                }
              });
            }
          }

          // Load service settings from settings table
          if (settingsData && settingsData.service_settings) {
            if (settingsData.service_settings.categories) {
              setCategories(settingsData.service_settings.categories);
            }
            if (settingsData.service_settings.services) {
              setServiceItems(settingsData.service_settings.services);
            }
          }

          // Load employee settings from settings table
          if (settingsData && settingsData.employee_settings) {
            setStaffList(settingsData.employee_settings.map((staff: any) => ({ ...staff, collapsed: true })));
          }

          // Load store settings from settings table
          if (settingsData && settingsData.store_setting) {
            const storeSetting = settingsData.store_setting;
            setStoreConfig({
              storeName: storeSetting.store_name || '',
              address: storeSetting.store_address || '',
              googleMapLink: storeSetting.store_google_maps_url || '',
              phone: storeSetting.store_phone || '',
              storeType: storeSetting.store_type || '',
              storeDescription: storeSetting.store_description || '',
              storeLocationImage: storeSetting.store_location_image || ''
            });
          }

          // Load booking rules from settings table
          if (settingsData && settingsData.booking_rules) {
            setBookingRules(settingsData.booking_rules);
          }
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [supabase]);

  const handleEmployeeSettingsSave = async () => {
    setEmployeeSettingsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // 排班重疊校驗（第四階段）
      const validation = validateEmployeeSchedules(employeeSettings);
      if (!validation.isValid) {
        const errorMessages = validation.errors.map(err => 
          `${err.employeeName} 的 ${err.day} 排班有重疊時段`
        ).join('\n');
        alert(`排班設定有誤：\n${errorMessages}`);
        return;
      }

      // Check if settings record exists for this user
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      let error;
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('settings')
          .update({ employee_settings: employeeSettings })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('settings')
          .insert({ user_id: user.id, employee_settings: employeeSettings });
        error = result.error;
      }

      if (error) throw error;
      alert("員工進階設定儲存成功！");
    } catch (error: any) {
      console.error("Error saving employee settings:", error);
      alert("儲存失敗：" + error.message);
    } finally {
      setEmployeeSettingsSaving(false);
    }
  };

  // Helper function to add a new employee
  const addEmployee = () => {
    const newEmployee: EmployeeAdvanceSettings = {
      id: Date.now().toString(),
      name: '新員工',
      concurrentServiceCount: 1,
      booking_horizon: 30,
      services: [],
      schedule: {
        mon: { isOpen: false, timeSlots: [] },
        tue: { isOpen: false, timeSlots: [] },
        wed: { isOpen: false, timeSlots: [] },
        thu: { isOpen: false, timeSlots: [] },
        fri: { isOpen: false, timeSlots: [] },
        sat: { isOpen: false, timeSlots: [] },
        sun: { isOpen: false, timeSlots: [] },
      }
    };
    setEmployeeSettings([...employeeSettings, newEmployee]);
  };

  // Helper function to remove an employee
  const removeEmployee = (id: string) => {
    setEmployeeSettings(employeeSettings.filter(emp => emp.id !== id));
  };

  // Helper function to update employee field
  const updateEmployeeField = (id: string, field: keyof EmployeeAdvanceSettings, value: any) => {
    setEmployeeSettings(employeeSettings.map(emp => 
      emp.id === id ? { ...emp, [field]: value } : emp
    ));
  };

  // Helper function to update employee schedule
  const updateEmployeeSchedule = (id: string, day: keyof EmployeeAdvanceSettings['schedule'], field: 'isOpen' | 'timeSlots', value: any) => {
    setEmployeeSettings(employeeSettings.map(emp => 
      emp.id === id ? { ...emp, schedule: { ...emp.schedule, [day]: { ...emp.schedule[day], [field]: value } } } : emp
    ));
  };

  // Helper function to add time slot
  const addTimeSlot = (employeeId: string, day: keyof EmployeeAdvanceSettings['schedule']) => {
    setEmployeeSettings(employeeSettings.map(emp => 
      emp.id === employeeId ? { ...emp, schedule: { ...emp.schedule, [day]: { ...emp.schedule[day], timeSlots: [...emp.schedule[day].timeSlots, { startTime: '09:00', endTime: '18:00' }] } } } : emp
    ));
  };

  // Helper function to remove time slot
  const removeTimeSlot = (employeeId: string, day: keyof EmployeeAdvanceSettings['schedule'], slotIndex: number) => {
    setEmployeeSettings(employeeSettings.map(emp => 
      emp.id === employeeId ? { ...emp, schedule: { ...emp.schedule, [day]: { ...emp.schedule[day], timeSlots: emp.schedule[day].timeSlots.filter((_, idx) => idx !== slotIndex) } } } : emp
    ));
  };

  // Helper function to update time slot
  const updateTimeSlot = (employeeId: string, day: keyof EmployeeAdvanceSettings['schedule'], slotIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setEmployeeSettings(employeeSettings.map(emp => 
      emp.id === employeeId ? { ...emp, schedule: { ...emp.schedule, [day]: { ...emp.schedule[day], timeSlots: emp.schedule[day].timeSlots.map((slot, idx) => idx === slotIndex ? { ...slot, [field]: value } : slot) } } } : emp
    ));
  };

  const addCategory = async () => {
    // Remove existing empty category if there is one
    if (editingCategoryId) {
      const existingCategory = categories.find(cat => cat.id === editingCategoryId);
      if (existingCategory && !existingCategory.name.trim()) {
        const newCategories = categories.filter(cat => cat.id !== editingCategoryId);
        setCategories(newCategories);
      }
    }

    const newId = Date.now().toString();
    const newCategories = [...categories, { id: newId, name: "" }];
    setCategories(newCategories);
    setEditingCategoryId(newId);
    setEditingCategoryName("");
  };

  // Fetch appointments data for calendar
  useEffect(() => {
    const fetchAppointments = async () => {
      const data = await fetchBookingsFromSupabase(supabase);
      setAppointments(data);
    };
    fetchAppointments();
  }, [supabase]);

  // LINE validation
  const validateCredentials = useCallback(
    (token: string, secret: string) => {
      if (!token || !secret) {
        setLineValidationStatus('idle');
        return;
      }

      setLineValidationStatus('validating');
      setLineValidationError(null);

      const timer = setTimeout(async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/line/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channel_access_token: token,
              channel_secret: secret,
            }),
          });

          const result = await response.json();

          if (result.valid) {
            setLineValidationStatus('valid');
            setLineValidationMessage(result.message || '格式正確');
          } else {
            setLineValidationStatus('invalid');
            setLineValidationError(result.message || 'Credentials 驗證失敗');
          }
        } catch (error: any) {
          setLineValidationStatus('invalid');
          setLineValidationError(`驗證過程發生錯誤: ${error.message}`);
        }
      }, 800);

      return () => clearTimeout(timer);
    },
    []
  );

  useEffect(() => {
    validateCredentials(lineConfig.lineApiKey, lineConfig.lineSecret);
  }, [lineConfig.lineApiKey, lineConfig.lineSecret, validateCredentials]);

  const handleLineSave = async () => {
    setLineSaving(true);
    setLineSaveSuccess(false);
    setLineValidationError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      if (lineConfig.lineApiKey && lineConfig.lineSecret) {
        if (lineValidationStatus === 'invalid') {
          setLineValidationError('請輸入正確的 LINE Credentials');
          return;
        }
        if (lineValidationStatus !== 'valid') {
          setLineValidationError('請等待驗證完成或輸入正確的 Credentials');
          return;
        }
      }
      
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            line_channel_access_token: lineConfig.lineApiKey,
            line_channel_secret: lineConfig.lineSecret
          });
        if (insertError) throw insertError;
      } else if (checkError) {
        throw checkError;
      } else {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            line_channel_access_token: lineConfig.lineApiKey,
            line_channel_secret: lineConfig.lineSecret
          })
          .eq('id', user.id);
        if (updateError) throw updateError;
      }
      
      setLineSaveSuccess(true);
      setTimeout(() => setLineSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error saving LINE credentials:", error);
      alert(`儲存失敗: ${error.message || '未知錯誤'}`);
    } finally {
      setLineSaving(false);
    }
  };

  const handleLineCopy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setLineCopied(true);
      setTimeout(() => setLineCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleAISave = async () => {
    setAiSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const filteredRules = aiConfig.rules.filter(rule => rule.trim());

      const { error } = await supabase
        .from('users')
        .update({
          ai_settings: {
            tone: aiConfig.tone,
            customTone: aiConfig.tone === 'custom' ? aiConfig.customTone : undefined,
            sampleText: aiConfig.tone === 'sample' ? aiConfig.sampleText : undefined,
            rules: filteredRules,
            hardcodedRules: aiConfig.hardcodedRules
          }
        })
        .eq('id', user.id);

      if (error) throw error;

      setAiSaveSuccess(true);
      setTimeout(() => setAiSaveSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error saving AI settings:", error);
    } finally {
      setAiSaving(false);
    }
  };

  const handleStoreImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStoreUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `store-locations/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('store-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('store-images')
        .getPublicUrl(filePath);

      setStoreConfig(prev => ({ ...prev, storeLocationImage: publicUrl }));
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert("圖片上傳失敗：" + error.message);
    } finally {
      setStoreUploading(false);
    }
  };

  const handleStoreSave = async () => {
    setStoreSaving(true);
    setStoreSaveSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const storeSetting = {
        store_name: storeConfig.storeName,
        store_type: storeConfig.storeType,
        store_description: storeConfig.storeDescription,
        store_phone: storeConfig.phone,
        store_address: storeConfig.address,
        store_google_maps_url: storeConfig.googleMapLink,
        store_location_image: storeConfig.storeLocationImage
      };

      // Check if settings record exists for this user
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      let error;
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('settings')
          .update({ store_setting: storeSetting })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('settings')
          .insert({ user_id: user.id, store_setting: storeSetting });
        error = result.error;
      }

      if (error) throw error;

      setStoreSaveSuccess(true);
      setTimeout(() => setStoreSaveSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error saving store data:", error);
      alert("儲存失敗：" + error.message);
    } finally {
      setStoreSaving(false);
    }
  };

  const addStaff = () => {
    setStaffList([...staffList, {
      id: Date.now().toString(),
      name: "",
      phone: "",
      role: "",
      concurrentServiceCount: 1,
      description: "",
      color: "#000000",
      collapsed: false,
      specialty: ""
    }]);
  };

  const removeStaff = (id: string) => {
    setDeleteStaffId(id);
  };

  const confirmDeleteStaff = async () => {
    if (deleteStaffId) {
      const updatedList = staffList.filter(staff => staff.id !== deleteStaffId);
      setStaffList(updatedList);
      setDeleteStaffId(null);

      // Save to database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if settings record exists for this user
        const { data: existingSettings } = await supabase
          .from('settings')
          .select('user_id')
          .eq('user_id', user.id)
          .single();

        let error;
        if (existingSettings) {
          // Update existing record
          const result = await supabase
            .from('settings')
            .update({ employee_settings: updatedList })
            .eq('user_id', user.id);
          error = result.error;
        } else {
          // Insert new record
          const result = await supabase
            .from('settings')
            .insert({ user_id: user.id, employee_settings: updatedList });
          error = result.error;
        }

        if (error) console.error("Error deleting staff:", error);
      } catch (error) {
        console.error("Error deleting staff:", error);
      }
    }
  };

  const cancelDeleteStaff = () => {
    setDeleteStaffId(null);
  };

  const updateStaff = (id: string, field: string, value: string | number) => {
    setStaffList(staffList.map(staff =>
      staff.id === id ? { ...staff, [field]: value } : staff
    ));
  };

  const toggleStaffCollapse = (id: string) => {
    setStaffList(staffList.map(staff =>
      staff.id === id ? { ...staff, collapsed: !staff.collapsed } : staff
    ));
  };

  const isStaffValid = (staff: { id: string; name: string; phone: string; role: string; description: string; specialty?: string }) => {
    const hasRequiredFields = staff.name.trim() !== "" && staff.phone.trim() !== "" && staff.role.trim() !== "" && staff.description.trim() !== "" && staff.specialty?.trim() !== "";
    const isDuplicateName = staffList.some(s => s.id !== staff.id && s.name.trim() === staff.name.trim());
    return hasRequiredFields && !isDuplicateName;
  };

  const handleStaffSave = async () => {
    setStaffSaving(true);
    setStaffSaveSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if settings record exists for this user
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      let error;
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('settings')
          .update({ employee_settings: staffList })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('settings')
          .insert({ user_id: user.id, employee_settings: staffList });
        error = result.error;
      }

      if (error) throw error;

      // Collapse all staff cards after saving
      setStaffList(staffList.map(staff => ({ ...staff, collapsed: true })));

      setStaffSaveSuccess(true);
      setTimeout(() => setStaffSaveSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error saving staff data:", error);
      alert("儲存失敗：" + error.message);
    } finally {
      setStaffSaving(false);
    }
  };

  const handleStaffAdvancedSave = async () => {
    setStaffAdvancedSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if settings record exists for this user
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      let error;
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('settings')
          .update({ employee_settings: staffList })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('settings')
          .insert({ user_id: user.id, employee_settings: staffList });
        error = result.error;
      }

      if (error) throw error;

      setStaffAdvancedSaveSuccess(true);
      setTimeout(() => setStaffAdvancedSaveSuccess(false), 2000);
      setEditingStaffId(null);
    } catch (error: any) {
      console.error("Error saving staff advanced data:", error);
      alert("儲存失敗：" + error.message);
    } finally {
      setStaffAdvancedSaving(false);
    }
  };

  const updateBookingRule = (field: string, value: any) => {
    let processedValue = value;
    
    // 數字型態防呆
    if (field === 'min_lead_time') {
      processedValue = Math.max(0, Math.min(72, parseInt(value) || 0));
    } else if (field === 'max_future_days') {
      processedValue = Math.max(1, Math.min(90, parseInt(value) || 1));
    }
    
    setBookingRules(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  const handleBookingRulesSave = async () => {
    setBookingSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if settings record exists for this user
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      let error;
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('settings')
          .update({ booking_rules: bookingRules })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('settings')
          .insert({ user_id: user.id, booking_rules: bookingRules });
        error = result.error;
      }

      if (error) throw error;
      setBookingSaveSuccess(true);
      setTimeout(() => setBookingSaveSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error saving booking rules:", error);
      alert("儲存失敗：" + error.message);
    } finally {
      setBookingSaving(false);
    }
  };

  const saveCategoryEdit = async (id: string) => {
    // Check for duplicate category name
    const duplicateName = categories.find(
      cat => cat.name === editingCategoryName && cat.id !== id
    );
    if (duplicateName) {
      setCategoryError("分類名稱已存在，請使用其他名稱");
      return;
    }

    setCategoryError("");
    const newCategories = categories.map(cat =>
      cat.id === id ? { ...cat, name: editingCategoryName } : cat
    );
    setCategories(newCategories);
    setEditingCategoryId(null);
    setEditingCategoryName("");

    // Save to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if settings record exists for this user
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id, service_settings')
        .eq('user_id', user.id)
        .single();

      const serviceSettings = {
        categories: newCategories,
        services: existingSettings?.service_settings?.services || []
      };

      let error;
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('settings')
          .update({ service_settings: serviceSettings })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('settings')
          .insert({ user_id: user.id, service_settings: serviceSettings });
        error = result.error;
      }

      if (error) console.error("Error saving category edit:", error);
    } catch (error) {
      console.error("Error saving category edit:", error);
    }
  };

  const removeCategory = async (id: string) => {
    const newCategories = categories.filter(cat => cat.id !== id);
    setCategories(newCategories);
    if (editingCategoryId === id) {
      setEditingCategoryId(null);
      setEditingCategoryName("");
    }

    // Save to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if settings record exists for this user
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id, service_settings')
        .eq('user_id', user.id)
        .single();

      const serviceSettings = {
        categories: newCategories,
        services: existingSettings?.service_settings?.services || []
      };

      let error;
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('settings')
          .update({ service_settings: serviceSettings })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('settings')
          .insert({ user_id: user.id, service_settings: serviceSettings });
        error = result.error;
      }

      if (error) console.error("Error removing category:", error);
    } catch (error) {
      console.error("Error removing category:", error);
    }
  };

  const startEditCategory = (id: string, name: string) => {
    // Remove existing empty category if there is one
    if (editingCategoryId) {
      const existingCategory = categories.find(cat => cat.id === editingCategoryId);
      if (existingCategory && !existingCategory.name.trim()) {
        const newCategories = categories.filter(cat => cat.id !== editingCategoryId);
        setCategories(newCategories);
      }
    }

    setEditingCategoryId(id);
    setEditingCategoryName(name);
  };

  const cancelCategoryEdit = () => {
    // If cancelling edit of a category with empty name, remove it
    if (editingCategoryId) {
      const category = categories.find(cat => cat.id === editingCategoryId);
      if (category && !category.name.trim()) {
        removeCategory(editingCategoryId);
        setEditingCategoryId(null);
        setEditingCategoryName("");
        return;
      }
    }
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  const handleCategoryDragStart = (index: number) => {
    setDraggedCategoryIndex(index);
  };

  const handleCategoryDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedCategoryIndex !== null && draggedCategoryIndex !== index) {
      const newCategories = [...categories];
      const draggedItem = newCategories[draggedCategoryIndex];
      newCategories.splice(draggedCategoryIndex, 1);
      newCategories.splice(index, 0, draggedItem);
      setCategories(newCategories);
      setDraggedCategoryIndex(index);
    }
  };

  const handleCategoryDragEnd = async () => {
    setDraggedCategoryIndex(null);
    // Save the reordered list to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if settings record exists for this user
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id, service_settings')
        .eq('user_id', user.id)
        .single();

      const serviceSettings = {
        categories: categories,
        services: existingSettings?.service_settings?.services || []
      };

      let error;
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('settings')
          .update({ service_settings: serviceSettings })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('settings')
          .insert({ user_id: user.id, service_settings: serviceSettings });
        error = result.error;
      }

      if (error) console.error("Error saving reordered categories:", error);
    } catch (error) {
      console.error("Error saving reordered categories:", error);
    }
  };

  const handleCategorySave = async () => {
    setCategorySaving(true);
    setCategorySaveSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      console.log("Saving categories to database:", categories);

      // Check if settings record exists for this user
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id, service_settings')
        .eq('user_id', user.id)
        .single();

      const serviceSettings = {
        categories: categories,
        services: existingSettings?.service_settings?.services || []
      };

      let error;
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('settings')
          .update({ service_settings: serviceSettings })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('settings')
          .insert({ user_id: user.id, service_settings: serviceSettings });
        error = result.error;
      }

      if (error) throw error;

      console.log("Categories saved successfully");

      setCategorySaveSuccess(true);
      setTimeout(() => setCategorySaveSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error saving categories:", error);
      setCategoryError("儲存失敗：" + error.message);
    } finally {
      setCategorySaving(false);
    }
  };

  const handleServiceSave = async () => {
    setServiceSaving(true);
    setServiceSaveSuccess(false);
    setServiceError("");

    try {
      // Check for duplicate service name
      const duplicateName = serviceItems.find(
        item => item.name === newService.name && item.id !== editingServiceId
      );
      if (duplicateName) {
        setServiceError("服務名稱已存在，請使用其他名稱");
        setServiceSaving(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      let updatedItems;

      if (editingServiceId) {
        // Update existing item
        updatedItems = serviceItems.map(item =>
          item.id === editingServiceId
            ? { ...item, name: newService.name, description: newService.description, price: newService.price, duration: newService.duration, category: newService.category }
            : item
        );
      } else {
        // Add new item
        const newItem = {
          id: Date.now().toString(),
          name: newService.name,
          description: newService.description,
          price: newService.price,
          duration: newService.duration,
          category: newService.category
        };
        updatedItems = [...serviceItems, newItem];
      }

      console.log("Saving services to database:", updatedItems);

      // Check if settings record exists for this user
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id, service_settings')
        .eq('user_id', user.id)
        .single();

      const serviceSettings = {
        categories: existingSettings?.service_settings?.categories || [],
        services: updatedItems
      };

      let error;
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('settings')
          .update({ service_settings: serviceSettings })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('settings')
          .insert({ user_id: user.id, service_settings: serviceSettings });
        error = result.error;
      }

      if (error) throw error;

      console.log("Services saved successfully");

      // Update local state
      setServiceItems(updatedItems);
      setShowAddServiceForm(false);
      setNewService({ name: "", description: "", price: 0, duration: 30, category: "" });
      setEditingServiceId(null);
      setServiceSaveSuccess(true);
      setTimeout(() => setServiceSaveSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error saving service item:", error);
      setServiceError("儲存失敗：" + error.message);
    } finally {
      setServiceSaving(false);
    }
  };

  const handleEditService = (id: string) => {
    const item = serviceItems.find(i => i.id === id);
    if (item) {
      setEditingServiceId(id);
      setNewService({
        name: item.name,
        description: item.description,
        price: item.price,
        duration: item.duration,
        category: item.category
      });
      setShowAddServiceForm(true);
      setServiceDropdownId(null);
    }
  };

  const handleCopyService = async (id: string) => {
    const item = serviceItems.find(i => i.id === id);
    if (item) {
      const newItem = {
        id: Date.now().toString(),
        name: `${item.name} (複製)`,
        description: item.description,
        price: item.price,
        duration: item.duration,
        category: item.category
      };
      const updatedItems = [...serviceItems, newItem];
      setServiceItems(updatedItems);

      // Save to database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from('users')
          .update({
            services: updatedItems
          })
          .eq('id', user.id);

        if (error) console.error("Error copying service:", error);
      } catch (error) {
        console.error("Error copying service:", error);
      }

      setServiceDropdownId(null);
    }
  };

  const handleServiceDragStart = (index: number) => {
    setDraggedServiceIndex(index);
  };

  const handleServiceDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedServiceIndex !== null && draggedServiceIndex !== index) {
      const newItems = [...serviceItems];
      const draggedItem = newItems[draggedServiceIndex];
      newItems.splice(draggedServiceIndex, 1);
      newItems.splice(index, 0, draggedItem);
      setServiceItems(newItems);
      setDraggedServiceIndex(index);
    }
  };

  const handleServiceDragEnd = async () => {
    setDraggedServiceIndex(null);
    // Save the reordered list to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({
          services: serviceItems
        })
        .eq('id', user.id);

      if (error) console.error("Error saving reordered services:", error);
    } catch (error) {
      console.error("Error saving reordered services:", error);
    }
  };

  const handleUsernameChange = async () => {
    setUsernameSaving(true);
    setUsernameError(null);
    setUsernameSaveSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: usernameForm.currentPassword,
      });

      if (signInError) {
        setUsernameError("密碼錯誤");
        return;
      }

      // Check if username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', usernameForm.newUsername)
        .single();

      if (existingUser && existingUser.id !== user.id) {
        setUsernameError("此用戶名已被使用");
        return;
      }

      // Update username in users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ username: usernameForm.newUsername })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUsernameSaveSuccess(true);
      setUsernameForm(prev => ({ ...prev, newUsername: "", currentPassword: "" }));
      setTimeout(() => setUsernameSaveSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error changing username:", error);
      setUsernameError("修改失敗：" + error.message);
    } finally {
      setUsernameSaving(false);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength <= 2) return { label: '弱', color: 'bg-red-500' };
    if (strength <= 4) return { label: '中', color: 'bg-yellow-500' };
    return { label: '強', color: 'bg-green-500' };
  };

  const handlePasswordChange = async () => {
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSaveSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError("新密碼與確認密碼不符");
        return;
      }

      // Verify old password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: passwordForm.oldPassword,
      });

      if (signInError) {
        setPasswordError("舊密碼錯誤");
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (updateError) throw updateError;

      setPasswordSaveSuccess(true);
      setPasswordForm(prev => ({ ...prev, oldPassword: "", newPassword: "", confirmPassword: "" }));
      setTimeout(() => setPasswordSaveSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error changing password:", error);
      setPasswordError("修改失敗：" + error.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  const mainTabs = [
    { id: 'account' as MainTabType, label: '帳號設定', icon: User },
    { id: 'basic' as MainTabType, label: '基本設定', icon: Store },
    { id: 'third_party' as MainTabType, label: '第三方服務設定', icon: ExternalLink },
    { id: 'ai' as MainTabType, label: '人工智慧設定', icon: Bot },
    { id: 'other' as MainTabType, label: '其他', icon: MoreHorizontal },
  ];

  const subTabsConfig: Record<MainTabType, { id: SubTabType, label: string, icon: any }[]> = {
    account: [],
    basic: [
      { id: 'store' as SubTabType, label: '店家設定', icon: Store },
      { id: 'staff' as SubTabType, label: '員工設定', icon: User },
      { id: 'services' as SubTabType, label: '服務設定', icon: Package },
      { id: 'booking_settings' as SubTabType, label: '預約設定', icon: CalendarClock },
    ],
    third_party: [
      { id: 'line' as SubTabType, label: 'LINE設定', icon: Key },
    ],
    ai: [
      { id: 'ai_agent' as SubTabType, label: 'AI客服設定', icon: Bot },
    ],
    other: [
      { id: 'notification' as SubTabType, label: '通知', icon: Bell },
      { id: 'manual' as SubTabType, label: '教學', icon: BookOpen },
      { id: 'support' as SubTabType, label: '客服', icon: Headphones },
    ],
  };

  const handleMainTabChange = (tabId: MainTabType) => {
    const subTabs = subTabsConfig[tabId];
    if (subTabs.length === 0) {
      // If no sub-tabs, directly activate this tab
      setActiveMainTab(tabId);
      setExpandedMainTab(null);
    } else {
      // If has sub-tabs, expand/collapse dropdown
      setExpandedMainTab(expandedMainTab === tabId ? null : tabId);
    }
  };

  const handleSubTabClick = (tabId: SubTabType, mainTabId: MainTabType, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    // Remove empty category if switching away from service settings
    if (editingCategoryId) {
      const existingCategory = categories.find(cat => cat.id === editingCategoryId);
      if (existingCategory && !existingCategory.name.trim()) {
        const newCategories = categories.filter(cat => cat.id !== editingCategoryId);
        setCategories(newCategories);
        setEditingCategoryId(null);
        setEditingCategoryName("");
      }
    }

    setActiveMainTab(mainTabId);
    setActiveSubTab(tabId);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">設定</h1>

      {/* Main Tabs */}
      <div className="bg-white rounded-t-xl shadow-sm border border-gray-100 border-b-0 p-2 flex gap-2 overflow-visible">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isExpanded = expandedMainTab === tab.id;
          const subTabs = subTabsConfig[tab.id];
          return (
            <div key={tab.id} className="relative" ref={(el) => { tabRefs.current[tab.id] = el; }}>
              <button
                onClick={() => handleMainTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeMainTab === tab.id
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {subTabs.length > 0 && (
                  <svg
                    className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              {/* Sub Tabs Dropdown */}
              {isExpanded && subTabs.length > 0 && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-2 min-w-[200px] z-10">
                  {subTabs.map((subTab) => {
                    const SubIcon = subTab.icon;
                    return (
                      <button
                        key={subTab.id}
                        onClick={(e) => handleSubTabClick(subTab.id, tab.id, e)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors whitespace-nowrap ${
                          activeSubTab === subTab.id
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <SubIcon className="w-4 h-4" />
                        {subTab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 border-t-0 p-6">
        {activeMainTab === 'account' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">帳戶設定</h3>
            </div>

            {/* Change Username */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4">修改用戶名</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">目前用戶名</label>
                  <div className="text-gray-700 px-4 py-2 bg-white border border-gray-300 rounded-lg">
                    {currentUsername}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">新用戶名</label>
                  <input
                    type="text"
                    value={usernameForm.newUsername}
                    onChange={(e) => setUsernameForm(prev => ({ ...prev, newUsername: e.target.value }))}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900"
                    placeholder="請輸入新用戶名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">當前密碼</label>
                  <input
                    type="password"
                    value={usernameForm.currentPassword}
                    onChange={(e) => setUsernameForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900"
                    placeholder="請輸入當前密碼以驗證"
                  />
                </div>
                {usernameError && (
                  <div className="text-red-600 text-sm">{usernameError}</div>
                )}
                <button
                  onClick={handleUsernameChange}
                  disabled={usernameSaving || !usernameForm.newUsername || !usernameForm.currentPassword}
                  className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                >
                  {usernameSaving ? '修改中...' : usernameSaveSuccess ? <><Check className="w-4 h-4" />已修改</> : <><Save className="w-4 h-4" />修改用戶名</>}
                </button>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4">更改密碼</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">舊密碼</label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                      className="block w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900"
                      placeholder="請輸入舊密碼"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">新密碼</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="block w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900"
                      placeholder="請輸入新密碼"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordForm.newPassword && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${getPasswordStrengthLabel(calculatePasswordStrength(passwordForm.newPassword)).color}`}
                            style={{ width: `${(calculatePasswordStrength(passwordForm.newPassword) / 6) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{getPasswordStrengthLabel(calculatePasswordStrength(passwordForm.newPassword)).label}</span>
                      </div>
                      <div className="space-y-1">
                        <div className={`flex items-center gap-2 text-xs ${passwordForm.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{passwordForm.newPassword.length >= 8 ? '✓' : '○'}</span>
                          <span>至少 8 個字元</span>
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${/[A-Z]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{/[A-Z]/.test(passwordForm.newPassword) ? '✓' : '○'}</span>
                          <span>至少 1 個大寫字母</span>
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${/[a-z]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{/[a-z]/.test(passwordForm.newPassword) ? '✓' : '○'}</span>
                          <span>至少 1 個小寫字母</span>
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${/[0-9]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{/[0-9]/.test(passwordForm.newPassword) ? '✓' : '○'}</span>
                          <span>至少 1 個數字</span>
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${/[^a-zA-Z0-9]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{/[^a-zA-Z0-9]/.test(passwordForm.newPassword) ? '✓' : '○'}</span>
                          <span>至少 1 個特殊字元</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">確認新密碼</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="block w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900"
                      placeholder="請再次輸入新密碼"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {passwordError && (
                  <div className="text-red-600 text-sm">{passwordError}</div>
                )}
                <button
                  onClick={handlePasswordChange}
                  disabled={passwordSaving || !passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                >
                  {passwordSaving ? '修改中...' : passwordSaveSuccess ? <><Check className="w-4 h-4" />已修改</> : <><Save className="w-4 h-4" />更改密碼</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeMainTab === 'third_party' && activeSubTab === 'line' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Key className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">LINE設定</h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Collapsible steps with video placeholders */}
              <div className="space-y-3">
                {/* Step 1 */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedLineStep(expandedLineStep === 1 ? null : 1)}
                    className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                    <span className="font-medium text-gray-900 text-sm">新增 Messaging API Channel</span>
                    <svg
                      className={`ml-auto w-4 h-4 text-gray-500 transition-transform ${expandedLineStep === 1 ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedLineStep === 1 && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
                        <div className="text-center text-gray-500">
                          <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">影片教學</p>
                          <p className="text-xs mt-1">（待加入影片）</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p>1. 用管理員帳號登入 LINE Developers console 並選擇 LINE 官方帳號的提供者。</p>
                        <p>2. 點擊「Create a Messaging API channel」。</p>
                        <p>3. 點擊「Create a LINE Official Account」以開啟一個外部網站。</p>
                        <p>4. 用您的 LINE 或商業帳號登入，填寫必要資訊後，點擊「Confirm and Complete」。</p>
                        <p>5. 如果跳出提示要申請已驗證的帳號，請選擇「Proceed later」。</p>
                        <p>6. 點擊「Go to LINE Official Account Manager」並同意政策聲明。</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2 */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedLineStep(expandedLineStep === 2 ? null : 2)}
                    className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                    <span className="font-medium text-gray-900 text-sm">啟用 Messaging API</span>
                    <svg
                      className={`ml-auto w-4 h-4 text-gray-500 transition-transform ${expandedLineStep === 2 ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedLineStep === 2 && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
                        <div className="text-center text-gray-500">
                          <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">影片教學</p>
                          <p className="text-xs mt-1">（待加入影片）</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p>1. 在 LINE Developers console 中選擇您建立的 Messaging API channel。</p>
                        <p>2. 點擊「Messaging API」標籤。</p>
                        <p>3. 確認「Use messaging API」開關已開啟。</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 3 */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedLineStep(expandedLineStep === 3 ? null : 3)}
                    className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                    <span className="font-medium text-gray-900 text-sm">取得 Channel Access Token</span>
                    <svg
                      className={`ml-auto w-4 h-4 text-gray-500 transition-transform ${expandedLineStep === 3 ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedLineStep === 3 && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
                        <div className="text-center text-gray-500">
                          <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">影片教學</p>
                          <p className="text-xs mt-1">（待加入影片）</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-700 mb-4">
                        <p>1. 在 LINE Developers console 中選擇您建立的 Messaging API channel。</p>
                        <p>2. 點擊「Messaging API」標籤。</p>
                        <p>3. 在「Channel access token」區域點擊「Issue」。</p>
                        <p>4. 複製生成的 Channel Access Token。</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">LINE Channel Access Token</label>
                        <input
                          type="text"
                          value={lineConfig.lineApiKey}
                          onChange={(e) => setLineConfig({ ...lineConfig, lineApiKey: e.target.value })}
                          className={`block w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors ${
                            lineValidationStatus === 'valid'
                              ? 'border-green-500 focus:ring-green-500'
                              : lineValidationStatus === 'invalid'
                              ? 'border-red-500 focus:ring-red-500'
                              : lineValidationStatus === 'validating'
                              ? 'border-yellow-500 focus:ring-yellow-500'
                              : 'border-gray-300 focus:border-black'
                          }`}
                          placeholder="請輸入 LINE Channel Access Token"
                        />
                        <button
                          onClick={handleLineSave}
                          disabled={lineSaving || lineValidating || (Boolean(lineConfig.lineApiKey) && Boolean(lineConfig.lineSecret) && lineValidationStatus !== 'valid')}
                          className="mt-3 flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                        >
                          {lineSaving ? '儲存中...' : lineSaveSuccess ? '已儲存' : <><Save className="w-4 h-4" />儲存變更</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 4 */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedLineStep(expandedLineStep === 4 ? null : 4)}
                    className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
                    <span className="font-medium text-gray-900 text-sm">取得 Channel Secret</span>
                    <svg
                      className={`ml-auto w-4 h-4 text-gray-500 transition-transform ${expandedLineStep === 4 ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedLineStep === 4 && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
                        <div className="text-center text-gray-500">
                          <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">影片教學</p>
                          <p className="text-xs mt-1">（待加入影片）</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-700 mb-4">
                        <p>1. 在 LINE Developers console 中選擇您建立的 Messaging API channel。</p>
                        <p>2. 點擊「Basic settings」標籤。</p>
                        <p>3. 在「Channel Secret」區域複製您的 Channel Secret。</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">LINE Channel Secret</label>
                        <input
                          type="text"
                          value={lineConfig.lineSecret}
                          onChange={(e) => setLineConfig({ ...lineConfig, lineSecret: e.target.value })}
                          className={`block w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors ${
                            lineValidationStatus === 'valid'
                              ? 'border-green-500 focus:ring-green-500'
                              : lineValidationStatus === 'invalid'
                              ? 'border-red-500 focus:ring-red-500'
                              : lineValidationStatus === 'validating'
                              ? 'border-yellow-500 focus:ring-yellow-500'
                              : 'border-gray-300 focus:border-black'
                          }`}
                          placeholder="請輸入 LINE Channel Secret"
                        />
                        <button
                          onClick={handleLineSave}
                          disabled={lineSaving || lineValidating || (Boolean(lineConfig.lineApiKey) && Boolean(lineConfig.lineSecret) && lineValidationStatus !== 'valid')}
                          className="mt-3 flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                        >
                          {lineSaving ? '儲存中...' : lineSaveSuccess ? '已儲存' : <><Save className="w-4 h-4" />儲存變更</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 5 */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedLineStep(expandedLineStep === 5 ? null : 5)}
                    className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">5</div>
                    <span className="font-medium text-gray-900 text-sm">設定 Webhook URL</span>
                    <svg
                      className={`ml-auto w-4 h-4 text-gray-500 transition-transform ${expandedLineStep === 5 ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedLineStep === 5 && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
                        <div className="text-center text-gray-500">
                          <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">影片教學</p>
                          <p className="text-xs mt-1">（待加入影片）</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-700 mb-4">
                        <p>1. 在 LINE Developers console 中選擇您建立的 Messaging API channel。</p>
                        <p>2. 點擊「Messaging API」標籤。</p>
                        <p>3. 在「Webhook URL」欄位輸入下方的 Webhook URL。</p>
                        <p>4. 點擊「Verify」按鈕驗證 URL。</p>
                        <p>5. 確認「Use webhook」開關已開啟。</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Webhook URL</label>
                        <p className="text-sm text-gray-800 mb-2">將此 URL 設定至 LINE Developers 平台的 Webhook URL 欄位：</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={webhookUrl}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-mono text-sm"
                          />
                          <button
                            onClick={handleLineCopy}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            {lineCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {lineCopied ? '已複製' : '複製'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeMainTab === 'ai' && activeSubTab === 'ai_agent' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Bot className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">AI 行為自訂</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">客服語氣</label>
                <select
                  value={aiConfig.tone}
                  onChange={(e) => setAiConfig({ ...aiConfig, tone: e.target.value })}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900"
                >
                  <option value="friendly">親切有禮 (推薦)</option>
                  <option value="professional">專業正式</option>
                  <option value="humorous">幽默風趣</option>
                  <option value="custom">自訂語氣</option>
                  <option value="sample">依照你的口氣</option>
                </select>
                {aiConfig.tone === 'custom' && (
                  <input
                    type="text"
                    value={aiConfig.customTone || ''}
                    onChange={(e) => setAiConfig({ ...aiConfig, customTone: e.target.value })}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900 text-sm mt-2"
                    placeholder="請輸入語氣描述"
                  />
                )}
                {aiConfig.tone === 'sample' && (
                  <textarea
                    value={aiConfig.sampleText || ''}
                    onChange={(e) => setAiConfig({ ...aiConfig, sampleText: e.target.value })}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900 text-sm resize-none mt-2"
                    rows={4}
                    placeholder="請輸入對話範例"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">硬性規則</label>
                <div className="space-y-2">
                  {[
                    { key: 'noHallucination', label: '無法確定就不要亂編造' },
                    { key: 'driveBooking', label: '對話導向成交與預約' },
                    { key: 'comfortEmotions', label: '遇到負面情緒安撫優先' },
                    { key: 'prioritizeStore', label: '回答以店家利益優先' },
                  ].map((rule) => (
                    <div key={rule.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">{rule.label}</span>
                      <button
                        onClick={() => setAiConfig({ ...aiConfig, hardcodedRules: { ...aiConfig.hardcodedRules, [rule.key]: !aiConfig.hardcodedRules[rule.key as keyof typeof aiConfig.hardcodedRules] } })}
                        className={`w-12 h-6 rounded-full transition-colors ${aiConfig.hardcodedRules[rule.key as keyof typeof aiConfig.hardcodedRules] ? 'bg-black' : 'bg-gray-300'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${aiConfig.hardcodedRules[rule.key as keyof typeof aiConfig.hardcodedRules] ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">自訂規則</label>
                <div className="space-y-3">
                  {aiConfig.rules.map((rule, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <textarea
                            value={rule}
                            onChange={(e) => {
                              const newRules = [...aiConfig.rules];
                              newRules[index] = e.target.value;
                              setAiConfig({ ...aiConfig, rules: newRules });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900 text-sm resize-none"
                            rows={2}
                            placeholder="例如：不知道就不要亂講"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const newRules = aiConfig.rules.filter((_, i) => i !== index);
                            setAiConfig({ ...aiConfig, rules: newRules });
                          }}
                          className="p-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setAiConfig({ ...aiConfig, rules: [...aiConfig.rules, ""] })}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    新增規則
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAISave}
                disabled={aiSaving || (aiConfig.tone === 'custom' && !aiConfig.customTone?.trim()) || (aiConfig.tone === 'sample' && !aiConfig.sampleText?.trim())}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all disabled:bg-gray-400"
              >
                {aiSaving ? '儲存中...' : aiSaveSuccess ? <><Check className="w-5 h-5" />已儲存</> : <><Save className="w-5 h-5" />儲存設定</>}
              </button>
            </div>
          </div>
        )}

        {activeMainTab === 'basic' && activeSubTab === 'store' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Store className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">店家設定</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">店家名稱 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={storeConfig.storeName}
                  onChange={(e) => setStoreConfig(prev => ({ ...prev, storeName: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  placeholder="請輸入店名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">店家類型 <span className="text-red-500">*</span></label>
                <select
                  value={storeConfig.storeType}
                  onChange={(e) => setStoreConfig(prev => ({ ...prev, storeType: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                >
                  <option value="">請選擇店家類型</option>
                  <option value="美甲">美甲</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">店家簡介 <span className="text-red-500">*</span></label>
                <textarea
                  value={storeConfig.storeDescription}
                  onChange={(e) => setStoreConfig(prev => ({ ...prev, storeDescription: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-none"
                  placeholder="請輸入店家簡介"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">店家電話 <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={storeConfig.phone}
                  onChange={(e) => setStoreConfig(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  placeholder="請輸入店家電話"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">店家地址 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={storeConfig.address}
                  onChange={(e) => setStoreConfig(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  placeholder="請輸入店家地址"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">店家 Google Map 連結</label>
                <input
                  type="url"
                  value={storeConfig.googleMapLink}
                  onChange={(e) => setStoreConfig(prev => ({ ...prev, googleMapLink: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  placeholder="請輸入店家Google Map連結"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">店家位置圖片</label>
                <div className="space-y-3">
                  <div
                    onClick={() => !storeConfig.storeLocationImage && document.getElementById('storeLocationImageInput')?.click()}
                    className={`relative cursor-pointer border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${storeConfig.storeLocationImage ? 'border-solid border-gray-200 p-0 inline-block' : 'p-12 hover:border-gray-400 transition-colors'}`}
                  >
                    {storeConfig.storeLocationImage ? (
                      <>
                        <img
                          src={storeConfig.storeLocationImage}
                          alt="店家位置"
                          className="max-w-sm rounded-lg"
                          style={{ maxHeight: '250px' }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStoreConfig(prev => ({ ...prev, storeLocationImage: '' }));
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center">
                        <Plus className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">點擊上傳圖片</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="storeLocationImageInput"
                    type="file"
                    accept="image/*"
                    onChange={handleStoreImageUpload}
                    disabled={storeUploading}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleStoreSave}
                  disabled={storeSaving || !storeConfig.storeName.trim() || !storeConfig.storeType || !storeConfig.storeDescription.trim() || !storeConfig.phone.trim() || !storeConfig.address.trim()}
                  className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {storeSaving ? '儲存中...' : storeSaveSuccess ? <><Check className="w-4 h-4" />已儲存</> : <><Save className="w-4 h-4" />儲存</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeMainTab === 'basic' && activeSubTab === 'staff' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">員工設定</h3>
            </div>
            <div className="space-y-4">
              {staffList.length === 0 ? (
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <p className="text-gray-600">尚未新增員工</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {staffList.map((staff, index) => (
                    <div key={staff.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      {staff.collapsed ? (
                        // Collapsed view
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full border-2"
                              style={{ backgroundColor: staff.color, borderColor: 'black' }}
                            />
                            <div>
                              <h4 className="font-medium text-gray-900">{staff.name || "未命名員工"}</h4>
                              <p className="text-sm text-gray-600">{staff.role || "未填寫職位"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleStaffCollapse(staff.id)}
                              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                              title="展開"
                            >
                              <Pen className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeStaff(staff.id)}
                              className="p-2 text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Expanded view
                        <div className="p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-gray-900">{staff.name || "未命名員工"}</h4>
                            <button
                              onClick={() => removeStaff(staff.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">姓名 <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                value={staff.name}
                                onChange={(e) => updateStaff(staff.id, 'name', e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors ${staff.name.trim() !== "" && staffList.some(s => s.id !== staff.id && s.name.trim() === staff.name.trim()) ? "border-red-500" : "border-gray-300"}`}
                                placeholder="請輸入姓名"
                              />
                              {staff.name.trim() !== "" && staffList.some(s => s.id !== staff.id && s.name.trim() === staff.name.trim()) && (
                                <p className="text-red-500 text-xs mt-1">此員工姓名已存在</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">電話 <span className="text-red-500">*</span></label>
                              <input
                                type="tel"
                                value={staff.phone}
                                onChange={(e) => updateStaff(staff.id, 'phone', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                                placeholder="請輸入電話"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">職位 <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                value={staff.role}
                                onChange={(e) => updateStaff(staff.id, 'role', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                                placeholder="請輸入職位"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">同時服務數量</label>
                              <input
                                type="number"
                                min="1"
                                max="99"
                                value={staff.concurrentServiceCount}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 1;
                                  const clampedValue = Math.min(99, Math.max(1, value));
                                  updateStaff(staff.id, 'concurrentServiceCount', clampedValue);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                                placeholder="1-99"
                              />
                              <p className="text-xs text-gray-500 mt-1">範圍：1-99</p>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-900 mb-1">人員介紹 <span className="text-red-500">*</span></label>
                              <textarea
                                value={staff.description}
                                onChange={(e) => updateStaff(staff.id, 'description', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors resize-none"
                                placeholder="請輸入人員介紹"
                                rows={3}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-900 mb-1">專長 <span className="text-red-500">*</span></label>
                              <textarea
                                value={staff.specialty || ''}
                                onChange={(e) => updateStaff(staff.id, 'specialty', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors resize-none"
                                placeholder="請輸入擅長的項目（如：日式美甲、法式美甲、光療等）"
                                rows={2}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-900 mb-2">自訂人員顏色</label>
                              <div className="grid grid-cols-12 gap-x-0 gap-y-3">
                                {colorOptions.map((color) => (
                                  <button
                                    key={color}
                                    onClick={() => updateStaff(staff.id, 'color', color)}
                                    className="relative w-6 h-6 rounded-full border-2 transition-all hover:border-gray-400"
                                    style={{ backgroundColor: color, borderColor: staff.color === color ? 'black' : 'transparent' }}
                                    title={color}
                                  >
                                    {staff.color === color && (
                                      <Check className="absolute inset-0 m-auto w-3 h-3 text-white" strokeWidth={3} />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={handleStaffSave}
                              disabled={staffSaving || !isStaffValid(staff)}
                              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                            >
                              {staffSaving ? '儲存中...' : staffSaveSuccess ? <><Check className="w-4 h-4" />已儲存</> : <><Save className="w-4 h-4" />儲存</>}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={addStaff}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-black hover:text-black transition-colors"
              >
                <Plus className="w-4 h-4" />
                新增員工
              </button>
              {deleteStaffId && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 backdrop-blur-sm">
                  <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">確認刪除</h3>
                    <p className="text-gray-600 mb-6">確定要刪除此員工嗎？此操作無法復原。</p>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={cancelDeleteStaff}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={confirmDeleteStaff}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        確認刪除
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeMainTab === 'basic' && activeSubTab === 'services' && (
          <div className="space-y-6">
            {!showCategoryView ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-black mr-2" />
                      <h3 className="font-bold text-lg text-gray-900">服務設定</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                      >
                        <option value="">所有分類</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCategoryView(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    <Pen className="w-4 h-4" />
                    編輯分類
                  </button>
                </div>

                <div>
                  {/* Add Service Item Form */}
                  <div className="bg-white border border-gray-200 rounded-t-lg p-6">
                    {!showAddServiceForm ? (
                      <button
                        onClick={() => setShowAddServiceForm(true)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        新增服務項目
                      </button>
                    ) : (
                      <div className="space-y-4">
                        {serviceError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                            {serviceError}
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">服務名稱 <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={newService.name}
                            onChange={(e) => {
                              setNewService({ ...newService, name: e.target.value });
                              setServiceError("");
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                            placeholder="請輸入服務名稱"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">服務描述 <span className="text-red-500">*</span></label>
                          <textarea
                            value={newService.description}
                            onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors resize-none"
                            placeholder="請輸入服務描述"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">價格 (NT$) <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            min="0"
                            value={newService.price}
                            onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                            placeholder="請輸入價格"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">時長 (分鐘) <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            min="1"
                            value={newService.duration}
                            onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) || 1 })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                            placeholder="請輸入時長"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">分類</label>
                          <select
                            value={newService.category}
                            onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                          >
                            <option value="">選擇分類</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setShowAddServiceForm(false);
                              setEditingServiceId(null);
                              setNewService({ name: "", description: "", price: 0, duration: 30, category: "" });
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleServiceSave}
                            disabled={!newService.name || !newService.description || newService.price <= 0 || newService.duration <= 0}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {serviceSaving ? '儲存中...' : serviceSaveSuccess ? <><Check className="w-4 h-4" />已儲存</> : <><Save className="w-4 h-4" />儲存</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Service Items List */}
                  {serviceItems.length > 0 && (
                    <div className="bg-white border-t border-gray-200 rounded-b-lg p-6">
                      <h4 className="font-bold text-gray-900 mb-4">服務項目列表</h4>
                      <div className="space-y-3">
                        {serviceItems
                          .filter(item => !selectedCategoryFilter || item.category === selectedCategoryFilter)
                          .map((item, index) => (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={() => handleServiceDragStart(index)}
                              onDragOver={(e) => handleServiceDragOver(e, index)}
                              onDragEnd={handleServiceDragEnd}
                              className={`border border-gray-200 rounded-lg p-4 cursor-move ${draggedServiceIndex === index ? 'opacity-50' : ''}`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-medium text-gray-900">{item.name}</h5>
                                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                                    <span>價格：NT$ {item.price}</span>
                                    <span>時長：{item.duration} 分鐘</span>
                                    {item.category && (
                                      <span>分類：{categories.find(c => c.id === item.category)?.name || '未分類'}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1 relative">
                                  <button
                                    onClick={() => setServiceDropdownId(serviceDropdownId === item.id ? null : item.id)}
                                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                                  >
                                    <Pen className="w-4 h-4" />
                                  </button>
                                  {serviceDropdownId === item.id && (
                                    <div ref={serviceDropdownRef} className="absolute right-8 top-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[100px]">
                                      <button
                                        onClick={() => handleEditService(item.id)}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                      >
                                        <Pen className="w-4 h-4" />
                                        編輯
                                      </button>
                                      <button
                                        onClick={() => handleCopyService(item.id)}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                      >
                                        <Copy className="w-4 h-4" />
                                        複製
                                      </button>
                                      <button
                                        onClick={async () => {
                                          const updatedItems = serviceItems.filter(i => i.id !== item.id);
                                          setServiceItems(updatedItems);
                                          // Save to database
                                          try {
                                            const { data: { user } } = await supabase.auth.getUser();
                                            if (!user) return;

                                            const { error } = await supabase
                                              .from('users')
                                              .update({
                                                services: updatedItems
                                              })
                                              .eq('id', user.id);

                                            if (error) console.error("Error deleting service:", error);
                                          } catch (error) {
                                            console.error("Error deleting service:", error);
                                          }
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                      >
                                        <X className="w-5 h-5" />
                                        刪除
                                      </button>
                                    </div>
                                  )}
                                  <button
                                    onClick={async () => {
                                      const updatedItems = serviceItems.filter(i => i.id !== item.id);
                                      setServiceItems(updatedItems);
                                      // Save to database
                                      try {
                                        const { data: { user } } = await supabase.auth.getUser();
                                        if (!user) return;

                                        const { error } = await supabase
                                          .from('users')
                                          .update({
                                            services: updatedItems
                                          })
                                          .eq('id', user.id);

                                        if (error) console.error("Error deleting service:", error);
                                      } catch (error) {
                                        console.error("Error deleting service:", error);
                                      }
                                    }}
                                    className="p-2 text-red-500 hover:text-red-700 transition-colors"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Package className="w-5 h-5 text-black mr-2" />
                    <h3 className="font-bold text-lg text-gray-900">分類管理</h3>
                  </div>
                  <button
                    onClick={() => {
                      // Remove empty category if editing one
                      if (editingCategoryId) {
                        const category = categories.find(cat => cat.id === editingCategoryId);
                        if (category && !category.name.trim()) {
                          removeCategory(editingCategoryId);
                        }
                      }
                      setShowCategoryView(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    返回
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="space-y-3">
                    {categoryError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                        {categoryError}
                      </div>
                    )}
                    {categories.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">尚未新增分類</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {categories.map((category, index) => (
                          <div
                            key={category.id}
                            draggable
                            onDragStart={() => handleCategoryDragStart(index)}
                            onDragOver={(e) => handleCategoryDragOver(e, index)}
                            onDragEnd={handleCategoryDragEnd}
                            className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-move ${draggedCategoryIndex === index ? 'opacity-50' : ''}`}
                          >
                            {editingCategoryId === category.id ? (
                              <>
                                <div ref={categoryEditRef} className="flex items-center gap-3 flex-1">
                                  <input
                                    type="text"
                                    value={editingCategoryName}
                                    onChange={(e) => {
                                      setEditingCategoryName(e.target.value);
                                      setCategoryError("");
                                    }}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                                    placeholder="輸入分類名稱"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => saveCategoryEdit(category.id)}
                                    disabled={!editingCategoryName.trim()}
                                    className="p-2 text-green-600 hover:text-green-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                                  >
                                    <Check className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={cancelCategoryEdit}
                                    className="p-2 text-gray-600 hover:text-gray-700 transition-colors"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="flex-1 text-gray-900">{category.name || "未命名分類"}</span>
                                <button
                                  onClick={() => startEditCategory(category.id, category.name)}
                                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                  <Pen className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => removeCategory(category.id)}
                                  className="p-2 text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={addCategory}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-solid border-gray-300 rounded-lg text-gray-600 hover:border-black hover:text-black transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      新增分類
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeMainTab === 'basic' && activeSubTab === 'booking_settings' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Calendar className="w-7 h-7 text-black mr-2" />
              <h3 className="font-bold text-3xl text-gray-900">預約設定</h3>
            </div>
            
            {/* 員工列表區塊 */}
            <div className="space-y-4">
              <div className="flex items-center justify-end">
                <span className="text-sm text-gray-500">共 {staffList.length} 位人員</span>
              </div>
              
              {staffList.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">尚未新增員工，請先前往員工設定新增人員</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {staffList.map((staff) => (
                    <div key={staff.id}>
                      <div
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          {/* 左邊：員工顏色（替代頭像） */}
                          <div
                            className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xl"
                            style={{ backgroundColor: staff.color || '#000000' }}
                          >
                            {staff.name.charAt(0) || '?'}
                          </div>
                          
                          {/* 右邊：員工資訊 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                              <h5 className="text-lg font-semibold text-gray-900 truncate">{staff.name}</h5>
                            </div>
                              
                              {/* 編輯進階資訊按鈕 */}
                              <button
                                onClick={() => setEditingStaffId(editingStaffId === staff.id ? null : staff.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors ml-4 flex-shrink-0"
                              >
                                <Edit className="w-4 h-4" />
                                <span>編輯進階資訊</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 編輯進階資訊介面 */}
                      {editingStaffId === staff.id && (
                        <div className="bg-white border border-gray-200 rounded-lg mt-3 p-6 transition-all duration-300 ease-in-out relative">
                          {/* 左上角關閉按鈕 */}
                          <button
                            onClick={() => setEditingStaffId(null)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <X className="w-5 h-5 text-gray-500" />
                          </button>

                          {/* 分頁標籤 */}
                          <div className="flex border-b border-gray-200 mb-6">
                            <button
                              onClick={() => setStaffAdvancedTab('advanced')}
                              className={`px-6 py-3 font-medium transition-colors ${
                                staffAdvancedTab === 'advanced'
                                  ? 'text-black border-b-2 border-black'
                                  : 'text-gray-500 hover:text-gray-700'
                              } font-mono tabular-nums tracking-wide`}
                            >
                              進階設定
                            </button>
                            <button
                              onClick={() => setStaffAdvancedTab('schedule')}
                              className={`px-6 py-3 font-medium transition-colors ${
                                staffAdvancedTab === 'schedule'
                                  ? 'text-black border-b-2 border-black'
                                  : 'text-gray-500 hover:text-gray-700'
                              } font-mono tabular-nums tracking-wide`}
                            >
                              個人班表
                            </button>
                            <button
                              onClick={() => setStaffAdvancedTab('service')}
                              className={`px-6 py-3 font-medium transition-colors ${
                                staffAdvancedTab === 'service'
                                  ? 'text-black border-b-2 border-black'
                                  : 'text-gray-500 hover:text-gray-700'
                              } font-mono tabular-nums tracking-wide`}
                            >
                              個人服務
                            </button>
                          </div>

                          {/* 分頁內容區域 */}
                          <div className="min-h-[300px] relative pb-16">
                            {staffAdvancedTab === 'advanced' && (
                              <div className="space-y-6">
                                {/* 複製該設定至按鈕 */}
                                <div className="absolute -top-2 right-0" ref={dropdownRef}>
                                  <button
                                    onClick={() => setCopyDropdownOpen(!copyDropdownOpen)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black rounded-lg shadow-sm hover:shadow-lg hover:bg-gray-50 transition-all duration-300 ease-out transform hover:scale-105 text-sm text-gray-900 font-mono tabular-nums tracking-wide"
                                    style={{
                                      animation: 'fadeInScale 0.3s ease-out'
                                    }}
                                  >
                                    <Copy className="w-4 h-4" />
                                    複製該設定至
                                  </button>
                                  
                                  {/* 下拉選單 */}
                                  {copyDropdownOpen && (
                                    <div 
                                      className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 transition-all duration-300 ease-out"
                                      style={{
                                        animation: 'slideDown 0.3s ease-out',
                                        transformOrigin: 'top right'
                                      }}
                                    >
                                      <div className="p-2">
                                        {copyStaffList.map((staff) => (
                                          <button
                                            key={staff.id}
                                            onClick={() => handleCopySettingsClick(staff)}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                          >
                                            {staff.type === 'all' ? (
                                              <Users className="w-4 h-4 text-gray-600" />
                                            ) : (
                                              <User className="w-4 h-4 text-gray-600" />
                                            )}
                                            <span className="text-sm text-gray-900 font-mono tabular-nums tracking-wide">{staff.name}</span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* 進階設定內容 */}
                                <p className="text-xs text-gray-500 mb-4">
                                  管理顧客的可預約時間，設定限制，避免顧客因不妥當操作而影響店內正常運營
                                </p>
                                
                                {/* 開放預約區間功能區塊 */}
                                <div className="bg-white p-6 relative" id="booking-interval-container" style={{ position: 'relative' }}>
                                  <h3 className="font-semibold text-gray-900 text-xl mb-2 font-mono tabular-nums tracking-wide">開放預約區間</h3>
                                  <p className="text-xs text-gray-500 mb-4">
                                    設定員工最遠能被預約到多久的時間之後，避免因長遠時間的排程變動，而導致預約糾紛
                                  </p>
                                  <div className="border-t-2 border-black my-4"></div>
                                  
                                  <div className="text-gray-900">
                                    我將於每個月的
                                    <span 
                                      className="inline-block border-b border-gray-400 cursor-pointer hover:border-black mx-1 font-mono tabular-nums tracking-wide"
                                      onClick={(e) => handleScrollPickerOpen('day', e)}
                                    >
                                      {bookingOpenDay}號
                                    </span>
                                    <span 
                                      className="inline-block border-b border-gray-400 cursor-pointer hover:border-black mx-1 font-mono tabular-nums tracking-wide"
                                      onClick={(e) => handleScrollPickerOpen('hour', e)}
                                    >
                                      {bookingOpenHour}點
                                    </span>
                                    開放
                                    <span 
                                      className="inline-block border-b border-gray-400 cursor-pointer hover:border-black mx-1 font-mono tabular-nums tracking-wide"
                                      onClick={(e) => handleScrollPickerOpen('months', e)}
                                    >
                                      {bookingOpenMonths === 'next_month' ? '下一個月' : 
                                       bookingOpenMonths === 'two_months' ? '下兩個月' : 
                                       bookingOpenMonths === 'three_months' ? '下三個月' : 
                                       bookingOpenMonths === 'four_months' ? '下四個月' : 
                                       bookingOpenMonths === 'five_months' ? '下五個月' : 
                                       bookingOpenMonths === 'six_months' ? '下六個月' : '全部公開'}
                                    </span>
                                    的預約訂單輸入
                                  </div>
                                </div>

                                {/* 預約提前量功能區塊 */}
                                <div className="bg-white p-6 relative mt-6" id="booking-advance-container" style={{ position: 'relative' }}>
                                  <h3 className="font-semibold text-gray-900 text-xl mb-2 font-mono tabular-nums tracking-wide">預約提前量</h3>
                                  <p className="text-xs text-gray-500 mb-4">
                                    限制客人必須要在多久以前提早預約，解決可能的訂單塞車問題
                                  </p>
                                  <div className="border-t-2 border-black my-4"></div>

                                  <div className="text-gray-900">
                                    {bookingAdvance === '0_min' ? (
                                      <>
                                        <span
                                          className="inline-block border-b border-gray-400 cursor-pointer hover:border-black font-mono tabular-nums tracking-wide"
                                          onClick={(e) => handleScrollPickerOpen('advance', e)}
                                        >
                                          不限制
                                        </span>
                                        顧客的提前預約時間
                                      </>
                                    ) : (
                                      <>
                                        顧客必須在
                                        <span
                                          className="inline-block border-b border-gray-400 cursor-pointer hover:border-black mx-1 font-mono tabular-nums tracking-wide"
                                          onClick={(e) => handleScrollPickerOpen('advance', e)}
                                        >
                                          {bookingAdvance === '10_min' ? '10分鐘前' :
                                           bookingAdvance === '30_min' ? '30分鐘前' :
                                           bookingAdvance === '60_min' ? '60分鐘前' :
                                           bookingAdvance === '90_min' ? '90分鐘前' :
                                           bookingAdvance === '120_min' ? '120分鐘前' :
                                           bookingAdvance === '180_min' ? '180分鐘前' :
                                           bookingAdvance === '1_day' ? '1天前' :
                                           bookingAdvance === '2_day' ? '2天前' :
                                           bookingAdvance === '3_day' ? '3天前' :
                                           bookingAdvance === '4_day' ? '4天前' :
                                           bookingAdvance === '5_day' ? '5天前' :
                                           bookingAdvance === '6_day' ? '6天前' : '一周前'}
                                        </span>
                                        提前預約訂單
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* 滾動選擇器 */}
                                {scrollPickerOpen && pickerPosition && (
                                  <div
                                    ref={pickerRef}
                                    className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-out"
                                    style={{
                                      left: `${pickerPosition.x}px`,
                                      top: `${pickerPosition.y}px`,
                                      width: '200px',
                                      overflowX: 'hidden',
                                      opacity: 0,
                                      transform: 'translateY(-10px) scale(0.95)',
                                      animation: 'slideDown 0.3s ease-out forwards'
                                    }}
                                  >
                                    <div className="max-h-48 overflow-y-auto custom-scrollbar" style={{ overflowX: 'hidden' }}>
                                      {scrollPickerOpen === 'day' && (
                                        <div className="divide-y divide-gray-100">
                                          {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                                            <button
                                              key={day}
                                              onClick={(e) => { e.stopPropagation(); setBookingOpenDay(day); setScrollPickerOpen(null); setPickerPosition(null); }}
                                              className={`block w-full px-4 py-3 text-left transition-all duration-200 hover:bg-gray-50 hover:translate-x-1 ${
                                                day === bookingOpenDay ? 'bg-gray-100 font-bold text-gray-900' : 'text-gray-700'
                                              } font-mono tabular-nums tracking-wide`}
                                            >
                                              {day}號
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                      {scrollPickerOpen === 'hour' && (
                                        <div className="divide-y divide-gray-100">
                                          {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                            <button
                                              key={hour}
                                              onClick={(e) => { e.stopPropagation(); setBookingOpenHour(hour); setScrollPickerOpen(null); setPickerPosition(null); }}
                                              className={`block w-full px-4 py-3 text-left transition-all duration-200 hover:bg-gray-50 hover:translate-x-1 ${
                                                hour === bookingOpenHour ? 'bg-gray-100 font-bold text-gray-900' : 'text-gray-700'
                                              } font-mono tabular-nums tracking-wide`}
                                            >
                                              {hour}點
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                      {scrollPickerOpen === 'months' && (
                                        <div className="divide-y divide-gray-100">
                                          {[
                                            { value: 'next_month', label: '下一個月' },
                                            { value: 'two_months', label: '下兩個月' },
                                            { value: 'three_months', label: '下三個月' },
                                            { value: 'four_months', label: '下四個月' },
                                            { value: 'five_months', label: '下五個月' },
                                            { value: 'six_months', label: '下六個月' },
                                            { value: 'all', label: '全部公開' },
                                          ].map((option) => (
                                            <button
                                              key={option.value}
                                              onClick={(e) => { e.stopPropagation(); setBookingOpenMonths(option.value); setScrollPickerOpen(null); setPickerPosition(null); }}
                                              className={`block w-full px-4 py-3 text-left transition-all duration-200 hover:bg-gray-50 hover:translate-x-1 ${
                                                option.value === bookingOpenMonths ? 'bg-gray-100 font-bold text-gray-900' : 'text-gray-700'
                                              } font-mono tabular-nums tracking-wide`}
                                            >
                                              {option.label}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                      {scrollPickerOpen === 'advance' && (
                                        <div className="divide-y divide-gray-100">
                                          {[
                                            { value: '0_min', label: '不限制 (0分鐘前)' },
                                            { value: '10_min', label: '10分鐘前' },
                                            { value: '30_min', label: '30分鐘前' },
                                            { value: '60_min', label: '60分鐘前' },
                                            { value: '90_min', label: '90分鐘前' },
                                            { value: '120_min', label: '120分鐘前' },
                                            { value: '180_min', label: '180分鐘前' },
                                            { value: '1_day', label: '1天前' },
                                            { value: '2_day', label: '2天前' },
                                            { value: '3_day', label: '3天前' },
                                            { value: '4_day', label: '4天前' },
                                            { value: '5_day', label: '5天前' },
                                            { value: '6_day', label: '6天前' },
                                            { value: '1_week', label: '一周前' },
                                          ].map((option) => (
                                            <button
                                              key={option.value}
                                              onClick={(e) => { e.stopPropagation(); setBookingAdvance(option.value); setScrollPickerOpen(null); setPickerPosition(null); }}
                                              className={`block w-full px-4 py-3 text-left transition-all duration-200 hover:bg-gray-50 hover:translate-x-1 ${
                                                option.value === bookingAdvance ? 'bg-gray-100 font-bold text-gray-900' : 'text-gray-700'
                                              } font-mono tabular-nums tracking-wide`}
                                            >
                                              {option.label}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* 存檔按鈕 */}
                                <div className="absolute bottom-0 right-0 mt-4">
                                  <button
                                    onClick={() => {
                                      setStaffAdvancedSaving(true);
                                      // 模擬儲存操作
                                      setTimeout(() => {
                                        setStaffAdvancedSaving(false);
                                        setStaffAdvancedSaveSuccess(true);
                                        // 3秒後恢復原狀
                                        setTimeout(() => {
                                          setStaffAdvancedSaveSuccess(false);
                                        }, 3000);
                                      }, 1000);
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm ${
                                      staffAdvancedSaveSuccess 
                                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                                        : 'bg-black hover:bg-gray-800 text-white'
                                    }`}
                                  >
                                    {staffAdvancedSaving ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        儲存中...
                                      </>
                                    ) : staffAdvancedSaveSuccess ? (
                                      <>
                                        <Check className="w-4 h-4" />
                                        儲存成功
                                      </>
                                    ) : (
                                      <>
                                        <Save className="w-4 h-4" />
                                        儲存變更
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                            {staffAdvancedTab === 'schedule' && (
                              <div className="relative pb-16">
                                {/* 複製該設定至按鈕 */}
                                <div className="absolute -top-2 right-0" ref={dropdownRef}>
                                  <button
                                    onClick={() => setCopyDropdownOpen(!copyDropdownOpen)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black rounded-lg shadow-sm hover:shadow-lg hover:bg-gray-50 transition-all duration-300 ease-out transform hover:scale-105 text-sm text-gray-900 font-mono tabular-nums tracking-wide"
                                    style={{
                                      animation: 'fadeInScale 0.3s ease-out'
                                    }}
                                  >
                                    <Copy className="w-4 h-4" />
                                    複製該設定至
                                  </button>
                                  
                                  {/* 下拉選單 */}
                                  {copyDropdownOpen && (
                                    <div 
                                      className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 transition-all duration-300 ease-out"
                                      style={{
                                        animation: 'slideDown 0.3s ease-out',
                                        transformOrigin: 'top right'
                                      }}
                                    >
                                      <div className="p-2">
                                        {copyStaffList.map((staff) => (
                                          <button
                                            key={staff.id}
                                            onClick={() => handleCopySettingsClick(staff)}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                          >
                                            {staff.type === 'all' ? (
                                              <Users className="w-4 h-4 text-gray-600" />
                                            ) : (
                                              <User className="w-4 h-4 text-gray-600" />
                                            )}
                                            <span className="text-sm text-gray-900">{staff.name}</span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <p className="text-xs text-gray-500 mb-4 mt-4">
                                  通過班表內排定的可服務時段，系統可自動隨機分配訂單到空檔中
                                </p>
                                {/* 月曆月模式組件 - 從 calendar 頁面搬運 */}
                                <div className="space-y-3 animate-in fade-in duration-300 min-h-[600px]">
                                  {/* 導航區域 */}
                                  <div className="flex items-center justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3">
                                      {/* Year Selector */}
                                      <div className="relative" ref={staffYearDropdownRef} data-staff-year-dropdown>
                                        <button
                                          onClick={() => setShowStaffYearDropdown(!showStaffYearDropdown)}
                                          className="flex items-center gap-1 text-lg font-semibold text-gray-900 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-all"
                                        >
                                          {currentDate.getFullYear()}年
                                          <ChevronDown className="w-4 h-4" />
                                        </button>
                                        {showStaffYearDropdown && (
                                          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[60] max-h-48 overflow-y-auto">
                                            {years.map((year) => (
                                              <button
                                                key={year}
                                                onClick={() => handleStaffYearChange(year)}
                                                className={`block w-full px-4 py-2 text-left transition-colors ${
                                                  year === currentDate.getFullYear()
                                                    ? 'bg-gray-100 font-bold'
                                                    : 'hover:bg-gray-50'
                                                }`}
                                              >
                                                {year}
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      {/* Month Selector */}
                                      <div className="relative" ref={staffMonthDropdownRef} data-staff-month-dropdown>
                                        <button
                                          onClick={() => setShowStaffMonthDropdown(!showStaffMonthDropdown)}
                                          className="flex items-center gap-1 text-lg font-semibold text-gray-900 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-all"
                                        >
                                          {currentDate.getMonth() + 1}月
                                          <ChevronDown className="w-4 h-4" />
                                        </button>
                                        {showStaffMonthDropdown && (
                                          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[60] max-h-48 overflow-y-auto">
                                            {months.map((month, index) => (
                                              <button
                                                key={month}
                                                onClick={() => handleStaffMonthChange(index)}
                                                className={`block w-full px-4 py-2 text-left transition-colors ${
                                                  index === currentDate.getMonth()
                                                    ? 'bg-gray-100 font-bold'
                                                    : 'hover:bg-gray-50'
                                                }`}
                                              >
                                                {month}
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      <button
                                        onClick={handleToday}
                                        className="flex items-center gap-2 px-4 py-2 border-2 border-black rounded-lg font-bold hover:bg-black hover:text-white transition-colors"
                                      >
                                        <MapPin className="w-4 h-4" />
                                        今天
                                      </button>
                                    </div>

                                    {/* 月份切換按鈕 */}
                                    <div className="flex items-center gap-2 mt-3">
                                      <button
                                        onClick={handlePreviousMonth}
                                        className="flex items-center gap-1 px-2 py-1.5 bg-white border-2 border-black rounded-lg shadow-sm hover:shadow-lg hover:bg-gray-50 transition-all duration-200 text-xs text-gray-900 font-mono tabular-nums tracking-wide"
                                      >
                                        <ChevronLeft className="w-3 h-3" />
                                        上個月
                                      </button>
                                      <button
                                        onClick={handleNextMonth}
                                        className="flex items-center gap-1 px-2 py-1.5 bg-white border-2 border-black rounded-lg shadow-sm hover:shadow-lg hover:bg-gray-50 transition-all duration-200 text-xs text-gray-900 font-mono tabular-nums tracking-wide"
                                      >
                                        下個月
                                        <ChevronRight className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* 月曆格子 */}
                                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                                    {/* 星期標題 */}
                                    <div className="grid grid-cols-7 gap-2 rounded-lg overflow-hidden">
                                      {["日", "一", "二", "三", "四", "五", "六"].map((day, index) => (
                                        <div key={day} className={`bg-gray-50 p-2 text-center text-sm font-bold uppercase ${
                                          index === 0 || index === 6 ? 'text-red-600' : 'text-gray-900'
                                        }`}>
                                          {day}
                                        </div>
                                      ))}
                                      
                                      {/* 日期格子 - 使用 renderCalendarDays 函數 */}
                                      {renderCalendarDays()}
                                    </div>
                                  </div>
                                </div>

                                {/* 存檔按鈕 */}
                                <div className="absolute bottom-0 right-0 mt-4">
                                  <button
                                    onClick={() => {
                                      setStaffAdvancedSaving(true);
                                      // 模擬儲存操作
                                      setTimeout(() => {
                                        setStaffAdvancedSaving(false);
                                        setStaffAdvancedSaveSuccess(true);
                                        // 3秒後恢復原狀
                                        setTimeout(() => {
                                          setStaffAdvancedSaveSuccess(false);
                                        }, 3000);
                                      }, 1000);
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm ${
                                      staffAdvancedSaveSuccess 
                                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                                        : 'bg-black hover:bg-gray-800 text-white'
                                    }`}
                                  >
                                    {staffAdvancedSaving ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        儲存中...
                                      </>
                                    ) : staffAdvancedSaveSuccess ? (
                                      <>
                                        <Check className="w-4 h-4" />
                                        儲存成功
                                      </>
                                    ) : (
                                      <>
                                        <Save className="w-4 h-4" />
                                        儲存變更
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                            {staffAdvancedTab === 'service' && (
                              <div className="relative pb-16">
                                {/* 複製該設定至按鈕 */}
                                <div className="absolute -top-2 right-0" ref={dropdownRef}>
                                  <button
                                    onClick={() => setCopyDropdownOpen(!copyDropdownOpen)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black rounded-lg shadow-sm hover:shadow-lg hover:bg-gray-50 transition-all duration-300 ease-out transform hover:scale-105 text-sm text-gray-900 font-mono tabular-nums tracking-wide"
                                    style={{
                                      animation: 'fadeInScale 0.3s ease-out'
                                    }}
                                  >
                                    <Copy className="w-4 h-4" />
                                    複製該設定至
                                  </button>
                                  
                                  {/* 下拉選單 */}
                                  {copyDropdownOpen && (
                                    <div 
                                      className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 transition-all duration-300 ease-out"
                                      style={{
                                        animation: 'slideDown 0.3s ease-out',
                                        transformOrigin: 'top right'
                                      }}
                                    >
                                      <div className="p-2">
                                        {copyStaffList.map((staff) => (
                                          <button
                                            key={staff.id}
                                            onClick={() => handleCopySettingsClick(staff)}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                          >
                                            {staff.type === 'all' ? (
                                              <Users className="w-4 h-4 text-gray-600" />
                                            ) : (
                                              <User className="w-4 h-4 text-gray-600" />
                                            )}
                                            <span className="text-sm text-gray-900">{staff.name}</span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mb-4">
                                  為人員設置適合的服務項目，AI客服會將您精準推送到顧客面前！
                                </p>
                                {/* 服務項目選擇區域 */}
                                <div className="flex flex-col items-center justify-center py-12">
                                  {/* 大字顯示與按鈕 */}
                                  <div className="flex items-center gap-4 mb-6">
                                    <div className="text-3xl font-bold text-gray-900 font-mono tabular-nums tracking-wide">
                                      我將選擇這<span className="text-red-600"> {selectedServices.length} </span>個項目作為我的服務項目
                                    </div>
                                    
                                    {/* 下拉選單按鈕 */}
                                    <button
                                      onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                                      className="flex items-center justify-center p-3 hover:bg-gray-50 transition-colors rounded-lg"
                                    >
                                      <ChevronDown className={`w-8 h-8 font-bold text-black transition-transform ${showServiceDropdown ? 'rotate-180' : ''}`} />
                                    </button>
                                  </div>
                                  
                                  {/* 已選擇的服務項目（當下拉選單關閉時顯示） */}
                                  {!showServiceDropdown && selectedServices.length > 0 && (
                                    <div className="text-2xl font-light text-gray-800 font-mono tabular-nums tracking-wide mt-6 text-center">
                                      {selectedServices.map((service, index) => (
                                        <span key={index}>
                                          {service}
                                          {index < selectedServices.length - 1 && '、 '}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* 當沒有選擇項目時顯示 */}
                                  {!showServiceDropdown && selectedServices.length === 0 && (
                                    <div className="text-sm text-gray-400 mt-4 font-mono tabular-nums tracking-wide">
                                      尚未選擇任何服務項目
                                    </div>
                                  )}
                                  
                                  {/* 中型選單（當下拉選單開啟時顯示） */}
                                  {showServiceDropdown && (
                                    <div className="mt-4 w-[700px] bg-white border-2 border-black rounded-lg shadow-lg overflow-hidden relative">
                                      {/* 關閉按鈕 */}
                                      <button
                                        onClick={() => setShowServiceDropdown(false)}
                                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10"
                                      >
                                        <X className="w-5 h-5 text-gray-600" />
                                      </button>
                                      
                                      {/* 第一區：未選擇的預約項目 */}
                                      <div className="p-6">
                                        <div className="text-lg font-bold text-gray-900 mb-4 font-mono tabular-nums tracking-wide">
                                          未選擇的預約項目
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                          {availableServices.map((service, index) => (
                                            <button
                                              key={`available-${index}-${service}`}
                                              onClick={() => handleSelectService(service)}
                                              className="px-4 py-3 bg-white border-2 border-black hover:bg-gray-50 rounded-full transition-colors text-black font-mono tabular-nums tracking-wide text-base"
                                            >
                                              {service}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                      
                                      {/* 分界線 */}
                                      <div className="border-t-2 border-black mx-6"></div>
                                      
                                      {/* 第二區：已選擇的預約項目 */}
                                      <div className="p-6">
                                        <div className="text-lg font-bold text-gray-900 mb-4 font-mono tabular-nums tracking-wide">
                                          已選擇的預約項目
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                          {selectedServices.map((service, index) => (
                                            <div
                                              key={`selected-${index}-${service}`}
                                              className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-red-600 rounded-full transition-colors"
                                            >
                                              <button
                                                onClick={() => handleRemoveService(service)}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                              >
                                                <X className="w-4 h-4" />
                                              </button>
                                              <span className="text-black font-mono tabular-nums tracking-wide text-base">
                                                {service}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* 顧客預約選取模式 */}
                                  <div className="mt-12 w-full max-w-2xl">
                                    <div className="text-3xl font-bold text-gray-900 font-mono tabular-nums tracking-wide mb-6">
                                      顧客的預約選取模式？
                                    </div>
                                    
                                    <div className="flex gap-4 mb-4">
                                      <button
                                        onClick={() => setBookingSelectionMode('single')}
                                        className={`px-8 py-4 text-xl font-bold font-mono tabular-nums tracking-wide rounded-lg transition-colors ${
                                          bookingSelectionMode === 'single'
                                            ? 'bg-black text-white'
                                            : 'bg-white text-black border-2 border-black hover:bg-gray-50'
                                        }`}
                                      >
                                        單選
                                      </button>
                                      <button
                                        onClick={() => setBookingSelectionMode('multiple')}
                                        className={`px-8 py-4 text-xl font-bold font-mono tabular-nums tracking-wide rounded-lg transition-colors ${
                                          bookingSelectionMode === 'multiple'
                                            ? 'bg-black text-white'
                                            : 'bg-white text-black border-2 border-black hover:bg-gray-50'
                                        }`}
                                      >
                                        複選
                                      </button>
                                    </div>
                                    
                                    <p className="text-sm text-gray-500 font-mono tabular-nums tracking-wide">
                                      您​可以​選擇​顧客​在​線上​預​約時，​只​能​夠選​擇單​一​服​務項目或​多個
                                    </p>
                                  </div>
                                </div>

                                {/* 存檔按鈕 */}
                                <div className="absolute bottom-0 right-0 mt-4">
                                  <button
                                    onClick={() => {
                                      setStaffAdvancedSaving(true);
                                      // 模擬儲存操作
                                      setTimeout(() => {
                                        setStaffAdvancedSaving(false);
                                        setStaffAdvancedSaveSuccess(true);
                                        // 3秒後恢復原狀
                                        setTimeout(() => {
                                          setStaffAdvancedSaveSuccess(false);
                                        }, 3000);
                                      }, 1000);
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm ${
                                      staffAdvancedSaveSuccess 
                                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                                        : 'bg-black hover:bg-gray-800 text-white'
                                    }`}
                                  >
                                    {staffAdvancedSaving ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        儲存中...
                                      </>
                                    ) : staffAdvancedSaveSuccess ? (
                                      <>
                                        <Check className="w-4 h-4" />
                                        儲存成功
                                      </>
                                    ) : (
                                      <>
                                        <Save className="w-4 h-4" />
                                        儲存變更
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 分隔線 */}
            <div className="border-t-2 border-gray-900 my-8" />

            {/* 預約限制區塊 */}
            <div className="space-y-8">
              <h4 className="font-semibold text-gray-900 text-2xl">預約限制</h4>

              {/* 功能 1：預約取消設定 */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-semibold text-gray-900 text-lg">預約取消設定</h5>
                    <p className="text-xs text-gray-500 mt-1">規定顧客一旦到了預約的哪一個期限後，便不能取消預約</p>
                  </div>
                  
                  {/* 自定義下拉選單 */}
                  <div className="relative w-64">
                    <button
                      onClick={() => setCancellationDropdownOpen(!cancellationDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-xl hover:border-gray-400 transition-colors text-left"
                    >
                      <span className="text-gray-900">
                        {cancellationPolicy === 'same_day_allowed' && '當天可以取消'}
                        {cancellationPolicy === 'same_day_not_allowed' && '當天無法取消'}
                        {cancellationPolicy === 'online_banned' && '禁止線上取消'}
                        {cancellationPolicy === 'days_not_allowed' && '自定義天數'}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${cancellationDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* 下拉選單 */}
                    {cancellationDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden transition-all duration-300 ease-in-out origin-top">
                        <button
                          onClick={() => {
                            setCancellationPolicy('same_day_allowed');
                            setCancellationDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${cancellationPolicy === 'same_day_allowed' ? 'bg-gray-50' : ''}`}
                        >
                          <CheckCircle className="w-5 h-5 text-black" />
                          <span className="text-gray-900">當天可以取消</span>
                        </button>
                        <button
                          onClick={() => {
                            setCancellationPolicy('same_day_not_allowed');
                            setCancellationDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${cancellationPolicy === 'same_day_not_allowed' ? 'bg-gray-50' : ''}`}
                        >
                          <XCircle className="w-5 h-5 text-black" />
                          <span className="text-gray-900">當天無法取消</span>
                        </button>
                        <button
                          onClick={() => {
                            setCancellationPolicy('online_banned');
                            setCancellationDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${cancellationPolicy === 'online_banned' ? 'bg-gray-50' : ''}`}
                        >
                          <Ban className="w-5 h-5 text-black" />
                          <span className="text-gray-900">禁止線上取消</span>
                        </button>
                        <button
                          onClick={() => {
                            setCancellationPolicy('days_not_allowed');
                            setCancellationDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${cancellationPolicy === 'days_not_allowed' ? 'bg-gray-50' : ''}`}
                        >
                          <Clock className="w-5 h-5 text-black" />
                          <span className="text-gray-900">自定義天數</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 當選擇「自定義天數」時顯示數字輸入 */}
                {cancellationPolicy === 'days_not_allowed' && (
                  <div className="mt-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={cancellationDays}
                        onChange={(e) => setCancellationDays(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 px-3 py-2 text-center border-b-2 border-gray-300 focus:border-red-500 focus:outline-none text-lg font-medium text-gray-900"
                        min="1"
                      />
                      <span className="text-gray-600">天內無法取消</span>
                    </div>
                  </div>
                )}

              </div>

              {/* 功能 2：顧客遲到設定 */}
              <div className="space-y-4">
                {/* 關閉時：只顯示功能名字 */}
                {!lateArrivalEnabled && (
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-semibold text-gray-900 text-lg">顧客遲到設定</h5>
                      <p className="text-xs text-gray-500 mt-1">規定顧客一旦遲到次數超過幾次，便會被系統加入黑名單，不能線上預約</p>
                    </div>
                    
                    {/* 開關按鈕 */}
                    <button
                      onClick={() => setLateArrivalEnabled(!lateArrivalEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        lateArrivalEnabled ? 'bg-red-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          lateArrivalEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                )}

                {/* 開關開啟時：顯示框框包含功能名字和輸入行 */}
                <div className={`border border-gray-300 rounded-lg space-y-4 transition-all duration-300 ease-in-out ${lateArrivalEnabled ? 'p-4 opacity-100 max-h-[500px]' : 'p-0 opacity-0 max-h-0 overflow-hidden'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-semibold text-gray-900 text-lg">顧客遲到設定</h5>
                        <p className="text-xs text-gray-500 mt-1">規定顧客一旦遲到次數超過幾次，便會被系統加入黑名單，不能線上預約</p>
                      </div>
                      
                      {/* 開關按鈕 */}
                      <button
                        onClick={() => setLateArrivalEnabled(!lateArrivalEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          lateArrivalEnabled ? 'bg-red-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            lateArrivalEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* 分界線 */}
                    <div className="border-t border-gray-200" />

                    {/* 可以設定數字的那一行 */}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">當顧客遲到超過</span>
                      <input
                        type="number"
                        value={lateArrivalCount}
                        onChange={(e) => setLateArrivalCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 px-2 py-1 text-center border-b-2 border-gray-300 focus:border-red-500 focus:outline-none text-lg font-medium text-gray-900"
                        min="1"
                      />
                      <span className="text-gray-600">次，我就不想再接他的單了!</span>
                    </div>
                  </div>
              </div>

              {/* 功能 3：顧客爽約設定 */}
              <div className="space-y-4">
                {/* 關閉時：只顯示功能名字 */}
                {!noShowEnabled && (
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-semibold text-gray-900 text-lg">顧客爽約設定</h5>
                      <p className="text-xs text-gray-500 mt-1">規定顧客一旦完全沒到店幾次之後，便會被系統加入黑名單，不能線上預約</p>
                    </div>
                    
                    {/* 開關按鈕 */}
                    <button
                      onClick={() => setNoShowEnabled(!noShowEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        noShowEnabled ? 'bg-red-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          noShowEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                    </button>
                  </div>
                )}

                {/* 開關開啟時：顯示框框包含功能名字和輸入行 */}
                <div className={`border border-gray-300 rounded-lg space-y-4 transition-all duration-300 ease-in-out ${noShowEnabled ? 'p-4 opacity-100 max-h-[500px]' : 'p-0 opacity-0 max-h-0 overflow-hidden'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-semibold text-gray-900 text-lg">顧客爽約設定</h5>
                        <p className="text-xs text-gray-500 mt-1">規定顧客一旦完全沒到店幾次之後，便會被系統加入黑名單，不能線上預約</p>
                      </div>

                      {/* 開關按鈕 */}
                      <button
                        onClick={() => setNoShowEnabled(!noShowEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          noShowEnabled ? 'bg-red-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            noShowEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* 分界線 */}
                    <div className="border-t border-gray-200" />

                    {/* 可以設定數字的那一行 */}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">當顧客爽約超過</span>
                      <input
                        type="number"
                        value={noShowCount}
                        onChange={(e) => setNoShowCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 px-2 py-1 text-center border-b-2 border-gray-300 focus:border-red-500 focus:outline-none text-lg font-medium text-gray-900"
                        min="1"
                      />
                      <span className="text-gray-600">次，我就不想再接他的單了!</span>
                    </div>
                  </div>
              </div>

              {/* 功能 4：顧客取消預約設定 */}
              <div className="space-y-4">
                {/* 關閉時：只顯示功能名字 */}
                {!customerCancelEnabled && (
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-semibold text-gray-900 text-lg">顧客取消預約設定</h5>
                      <p className="text-xs text-gray-500 mt-1">規定顧客一旦在一個期限內取消預約幾次，便會被系統加入黑名單，不能線上預約</p>
                    </div>
                    
                    {/* 開關按鈕 */}
                    <button
                      onClick={() => setCustomerCancelEnabled(!customerCancelEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        customerCancelEnabled ? 'bg-red-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          customerCancelEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                )}

                {/* 開關開啟時：顯示框框包含功能名字和輸入行 */}
                <div className={`border border-gray-300 rounded-lg space-y-4 transition-all duration-300 ease-in-out ${customerCancelEnabled ? 'p-4 opacity-100 max-h-[500px]' : 'p-0 opacity-0 max-h-0 overflow-hidden'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-semibold text-gray-900 text-lg">顧客取消預約設定</h5>
                        <p className="text-xs text-gray-500 mt-1">規定顧客一旦在一個期限內取消預約幾次，便會被系統加入黑名單，不能線上預約</p>
                      </div>

                      {/* 開關按鈕 */}
                      <button
                        onClick={() => setCustomerCancelEnabled(!customerCancelEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          customerCancelEnabled ? 'bg-red-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            customerCancelEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* 分界線 */}
                    <div className="border-t border-gray-200" />

                    {/* 可以設定數字的那一行 */}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">當顧客取消預約超過</span>
                      <input
                        type="number"
                        value={customerCancelCount}
                        onChange={(e) => setCustomerCancelCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 px-2 py-1 text-center border-b-2 border-gray-300 focus:border-red-500 focus:outline-none text-lg font-medium text-gray-900"
                        min="1"
                      />
                      <span className="text-gray-600">次，我就不想再接他的單了!</span>
                    </div>
                  </div>
              </div>

              {/* 分界線 */}
              <div className="border-t-2 border-gray-900" />

              {/* 功能 5：預約緩衝設定 */}
              <div className="space-y-4">
                {/* 關閉時：只顯示功能名字 */}
                {!bufferEnabled && (
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-semibold text-gray-900 text-2xl">預約緩衝設定</h5>
                      <p className="text-xs text-gray-500 mt-1">服務項目的訂單結束後，加入自訂義緩衝時間，確保客人的預約不會出現在緩衝時間中，讓您能充分準備、休息，確保服務品質</p>
                    </div>
                    
                    {/* 開關按鈕 */}
                    <button
                      onClick={() => setBufferEnabled(!bufferEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        bufferEnabled ? 'bg-red-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          bufferEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                )}

                {/* 開關開啟時：顯示框框包含功能名字和輸入行 */}
                <div className={`border border-gray-300 rounded-lg space-y-4 transition-all duration-300 ease-in-out ${bufferEnabled ? 'p-4 opacity-100 max-h-[500px]' : 'p-0 opacity-0 max-h-0 overflow-hidden'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-semibold text-gray-900 text-2xl">預約緩衝設定</h5>
                        <p className="text-xs text-gray-500 mt-1">服務項目的訂單結束後，加入自訂義緩衝時間，確保客人的預約不會出現在緩衝時間中，讓您能充分準備、休息，確保服務品質</p>
                      </div>

                      {/* 開關按鈕 */}
                      <button
                        onClick={() => setBufferEnabled(!bufferEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          bufferEnabled ? 'bg-red-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            bufferEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* 分界線 */}
                    <div className="border-t border-gray-200" />

                    {/* 可以設定數字的那一行 */}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">緩衝時間長度</span>
                      <input
                        type="number"
                        value={bufferMinutes}
                        onChange={(e) => setBufferMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 px-2 py-1 text-center border-b-2 border-gray-300 focus:border-red-500 focus:outline-none text-lg font-medium text-gray-900"
                        min="1"
                      />
                      <span className="text-gray-600">分鐘</span>
                    </div>
                    <p className="text-xs text-gray-500">可以手動輸入任何時長，系統將會根據此時長進行時間加總</p>
                  </div>
              </div>
            </div>
          </div>
        )}

        {activeMainTab === 'other' && activeSubTab === 'notification' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Bell className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">通知</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{notification.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                      </div>
                      {!notification.read && (
                        <div className="ml-4">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeMainTab === 'other' && activeSubTab === 'support' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Headphones className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">客服</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">聯絡我們</h4>
                  <p className="text-gray-600 mb-4">如果您有任何問題或需要協助，請透過以下方式聯絡我們：</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">L</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">LINE ID</p>
                      <p className="font-semibold text-gray-900">@436ejedc</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>服務時間：</strong>週一至週五 9:00-18:00
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeMainTab === 'other' && activeSubTab === 'manual' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <BookOpen className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">教學</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {/* Search Bar */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="搜尋教學內容..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                />
              </div>

              {/* Tutorial Categories */}
              <div className="space-y-6">
                {/* Getting Started */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    快速開始
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">系統介紹</h5>
                      <p className="text-sm text-gray-600">了解數位店長系統的基本功能</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">5 分鐘</span>
                        <span className="text-xs text-green-600">已完成</span>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">建立店家資料</h5>
                      <p className="text-sm text-gray-600">設定您的店家基本資訊</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">8 分鐘</span>
                        <span className="text-xs text-gray-400">未開始</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Staff Management */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    員工管理
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">新增員工</h5>
                      <p className="text-sm text-gray-600">如何新增和管理員工資料</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">6 分鐘</span>
                        <span className="text-xs text-gray-400">未開始</span>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">員工排班</h5>
                      <p className="text-sm text-gray-600">設定員工的工作時間</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">10 分鐘</span>
                        <span className="text-xs text-gray-400">未開始</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Management */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    服務管理
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">新增服務項目</h5>
                      <p className="text-sm text-gray-600">建立和管理您的服務項目</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">7 分鐘</span>
                        <span className="text-xs text-gray-400">未開始</span>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">服務分類</h5>
                      <p className="text-sm text-gray-600">組織和管理服務分類</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">5 分鐘</span>
                        <span className="text-xs text-gray-400">未開始</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Management */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    預約管理
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">接受預約</h5>
                      <p className="text-sm text-gray-600">如何處理和確認預約</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">8 分鐘</span>
                        <span className="text-xs text-gray-400">未開始</span>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">取消和改期</h5>
                      <p className="text-sm text-gray-600">處理預約的取消和改期</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">6 分鐘</span>
                        <span className="text-xs text-gray-400">未開始</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Features */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    進階功能
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">AI 客服設定</h5>
                      <p className="text-sm text-gray-600">設定 AI 客服自動回覆</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">12 分鐘</span>
                        <span className="text-xs text-gray-400">未開始</span>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">LINE 整合</h5>
                      <p className="text-sm text-gray-600">整合 LINE 通知功能</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">15 分鐘</span>
                        <span className="text-xs text-gray-400">未開始</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 新增服務項目彈窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 pt-20 pb-8">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden border border-white/20">
            {/* 彈窗標題區塊 */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200 relative">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2 font-mono tabular-nums tracking-wider">
                  選擇您的人員排班時間
                </h2>
                <p className="text-sm text-gray-600 font-mono tabular-nums tracking-wide">
                  請選擇您想要安排人員的日期和時間段，讓我們為您做好準備
                </p>
              </div>
              
              {/* 右上角關閉按鈕 */}
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            
            {/* 彈窗標題 - 年月日選擇器和星期顯示 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                {/* 年月日選擇器 */}
                <div className="relative">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowModalMonthDropdown(!showModalMonthDropdown)} data-date-picker>
                    <span className="text-lg font-bold text-gray-900">
                      {selectedDate ? `${selectedDate.year}年${selectedDate.month + 1}月${selectedDate.day}日` : `${new Date().getFullYear()}年${new Date().getMonth() + 1}月${new Date().getDate()}日`}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>

                  {/* 下拉選單 */}
                  {showModalMonthDropdown && (
                    <div 
                      className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[70] p-3 min-w-[160px] max-h-[300px] overflow-y-auto custom-scrollbar" 
                      ref={modalMonthDropdownRef} 
                      data-modal-month-dropdown
                      style={{
                        animation: 'slideInFade 0.3s ease-out',
                        transformOrigin: 'top center'
                      }}
                    >
                      <div className="space-y-2">
                        {/* 年份選擇 - 滾動模式 */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">年份 (滾動選擇)</div>
                          <div
                            className="relative overflow-hidden"
                            onWheel={(e) => handleModalScroll(e, 'year')}
                          >
                            <div className="flex items-center justify-center py-2">
                              <button
                                onClick={() => {
                                  const currentDate = selectedDate || { year: new Date().getFullYear(), month: new Date().getMonth(), day: new Date().getDate() };
                                  const newYear = Math.max(1900, currentDate.year - 1);
                                  setSelectedDate({...currentDate, year: newYear});
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <span className="mx-4 text-lg font-bold min-w-[80px] text-center">
                                {selectedDate?.year || new Date().getFullYear()}年
                              </span>
                              <button
                                onClick={() => {
                                  const currentDate = selectedDate || { year: new Date().getFullYear(), month: new Date().getMonth(), day: new Date().getDate() };
                                  const newYear = Math.min(2100, currentDate.year + 1);
                                  setSelectedDate({...currentDate, year: newYear});
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 月份選擇 - 滾動模式 */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">月份 (滾動選擇)</div>
                          <div
                            className="relative overflow-hidden"
                            onWheel={(e) => handleModalScroll(e, 'month')}
                          >
                            <div className="flex items-center justify-center py-2">
                              <button
                                onClick={() => {
                                  const currentDate = selectedDate || { year: new Date().getFullYear(), month: new Date().getMonth(), day: new Date().getDate() };
                                  let newMonth = currentDate.month - 1;
                                  let newYear = currentDate.year;
                                  
                                  if (newMonth < 0) {
                                    newMonth = 11;
                                    newYear = currentDate.year - 1;
                                  }
                                  
                                  setSelectedDate({...currentDate, month: newMonth, year: newYear});
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <span className="mx-4 text-lg font-bold min-w-[80px] text-center">
                                {selectedDate ? `${selectedDate.month + 1}月` : `${new Date().getMonth() + 1}月`}
                              </span>
                              <button
                                onClick={() => {
                                  const currentDate = selectedDate || { year: new Date().getFullYear(), month: new Date().getMonth(), day: new Date().getDate() };
                                  let newMonth = currentDate.month + 1;
                                  let newYear = currentDate.year;
                                  
                                  if (newMonth > 11) {
                                    newMonth = 0;
                                    newYear = currentDate.year + 1;
                                  }
                                  
                                  setSelectedDate({...currentDate, month: newMonth, year: newYear});
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 日期選擇 - 滾動模式 */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">日期 (滾動選擇)</div>
                          <div
                            className="relative overflow-hidden"
                            onWheel={(e) => handleScroll(e, 'day')}
                          >
                            <div className="flex items-center justify-center py-2">
                              <button
                                onClick={() => {
                                  if (!selectedDate) return;
                                  const newDay = Math.max(1, selectedDate.day - 1);
                                  setSelectedDate({...selectedDate, day: newDay});
                                }}
                                disabled={!selectedDate}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <span className="mx-4 text-lg font-bold min-w-[60px] text-center">
                                {selectedDate?.day || 1}日
                              </span>
                              <button
                                onClick={() => {
                                  if (!selectedDate) return;
                                  const daysInMonth = new Date(selectedDate.year, selectedDate.month + 1, 0).getDate();
                                  const newDay = Math.min(daysInMonth, selectedDate.day + 1);
                                  setSelectedDate({...selectedDate, day: newDay});
                                }}
                                disabled={!selectedDate}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 星期顯示 */}
                <div className="text-lg font-bold text-gray-900">
                  {selectedDate ? getWeekdayName(selectedDate.year, selectedDate.month, selectedDate.day) : getWeekdayName(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())}
                </div>

                {/* 顯示凌晨按鈕 */}
                <button
                  onClick={() => {
                    if (showEarlyMorningPicker) {
                      setShowEarlyMorningPicker(false);
                      setSelectedEarlyMorningTimes([]);
                    } else {
                      setShowEarlyMorningPicker(true);
                    }
                  }}
                  className={`px-3 py-3 rounded-lg transition-all duration-150 ease-out font-mono tabular-nums tracking-wide text-xs flex items-center gap-1 ${
                    showEarlyMorningPicker 
                      ? 'bg-black text-white scale-105' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  <Clock className={`w-3 h-3 ${showEarlyMorningPicker ? 'text-white' : 'text-gray-700'}`} />
                  <span>顯示凌晨?</span>
                </button>
              </div>

              {/* 中間區域：四個功能按鈕 */}
              <div className="flex items-center justify-center gap-1 py--5">
                <div className="relative">
                  <button
                    onClick={() => {
                      // 複製今日排班功能
                      if (showCopyModal) {
                        setShowCopyModal(false); // 如果選單已打開，關閉它
                      } else {
                        setShowCopyModal(true);
                        setShowDeleteModal(false); // 關閉另一個選單
                      }
                    }}
                    className="px-3 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-150 ease-out font-mono tabular-nums tracking-wide text-xs flex items-center gap-1 hover:scale-105"
                    data-copy-button
                  >
                    <Copy className="w-3 h-3" />
                    複製今日排班
                  </button>
                  {/* 複製今日排班小選單 */}
                  {showCopyModal && (
                    <div 
                      className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[70] p-3 min-w-[200px]" 
                      data-copy-modal
                      style={{
                        animation: 'slideInFade 0.3s ease-out',
                        transformOrigin: 'top center'
                      }}
                    >
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-900 font-mono tabular-nums tracking-wide">
                          複製今日排班
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="space-y-2">
                          <button className="w-full flex items-center gap-2 px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded transition-all duration-200 font-mono tabular-nums tracking-wide" onClick={() => setShowDateRangeModal(true)}>
                            <Calendar className="w-4 h-4 text-gray-500" />
                            複製到區間日期
                          </button>
                          <button className="w-full flex items-center gap-2 px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded transition-all duration-200 font-mono tabular-nums tracking-wide" onClick={() => setShowSpecificDateModal(true)}>
                            <CalendarClock className="w-4 h-4 text-gray-500" />
                            複製到指定日期
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 pt-2">
                        <div className="h-px bg-gray-400"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* 添加CSS動畫定義 */}
                  <style jsx>{`
                    @keyframes slideInFade {
                      from {
                        opacity: 0;
                        transform: translateY(-8px) scale(0.95);
                      }
                      to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                      }
                    }
                  `}</style>
                </div>
                <div className="relative">
                  <button
                    onClick={() => {
                      // 快速刪除排班功能
                      if (showDeleteModal) {
                        setShowDeleteModal(false); // 如果選單已打開，關閉它
                      } else {
                        setShowDeleteModal(true);
                        setShowCopyModal(false); // 關閉另一個選單
                      }
                    }}
                    className="px-3 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-150 ease-out font-mono tabular-nums tracking-wide text-xs flex items-center gap-1 hover:scale-105"
                    data-delete-button
                  >
                    <Trash2 className="w-3 h-3" />
                    快速刪除排班
                  </button>
                  {/* 快速刪除排班小選單 */}
                  {showDeleteModal && (
                    <div 
                      className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[70] p-3 min-w-[200px]" 
                      data-delete-modal
                      style={{
                        animation: 'slideInFade 0.3s ease-out',
                        transformOrigin: 'top center'
                      }}
                    >
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-900 font-mono tabular-nums tracking-wide">
                          快速刪除排班
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="space-y-2">
                          <button className="w-full flex items-center gap-2 px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded transition-all duration-200 font-mono tabular-nums tracking-wide" onClick={() => setShowDeleteAllModal(true)}>
                            <Trash2 className="w-4 h-4 text-gray-500" />
                            刪除本日排班
                          </button>
                          <button className="w-full flex items-center gap-2 px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded transition-all duration-200 font-mono tabular-nums tracking-wide" onClick={() => setShowDeleteRangeModal(true)}>
                            <Calendar className="w-4 h-4 text-gray-500" />
                            刪除區間排班
                          </button>
                          <button className="w-full flex items-center gap-2 px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded transition-all duration-200 font-mono tabular-nums tracking-wide" onClick={() => setShowDeleteAllSchedulesModal(true)}>
                            <Ban className="w-4 h-4 text-gray-500" />
                            刪除全部排班
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 pt-2">
                        <div className="h-px bg-gray-400"></div>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    // 定位到今天功能
                    const today = new Date();
                    setSelectedDate({
                      year: today.getFullYear(),
                      month: today.getMonth(),
                      day: today.getDate()
                    });
                  }}
                  className="px-3 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-150 ease-out font-mono tabular-nums tracking-wide text-xs flex items-center gap-1 hover:scale-105"
                >
                  <MapPin className="w-3 h-3" />
                  今天
                </button>
              </div>

              <div className="flex items-center gap-3 py-1">
                {/* 點指示器說明 - 垂直排列 */}
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-black" />
                    <span>已選中</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    <span>未選中</span>
                  </div>
                </div>
            </div>
            </div>

            {/* 彈窗內容區域 */}
            <div className="flex-1 flex overflow-hidden" style={{ height: '550px' }}>
              {/* 左側日期選擇區 */}
              <div className="w-32 border-r border-gray-200 bg-white relative flex flex-col overflow-hidden" style={{ height: '100%' }}>
                {/* 滾動容器 */}
                <div 
                  ref={dateScrollRef}
                  className="overflow-y-auto overflow-x-hidden relative custom-scrollbar-thin"
                  style={{ 
                    height: '470px', 
                    paddingTop: '50px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
                  }}
                >
                  
                  <div className="flex flex-col items-center space-y-3 px-4 pb-32" style={{ minHeight: '800px' }}>
                    {(() => {
                      const year = selectedDate?.year || new Date().getFullYear();
                      const month = selectedDate?.month !== undefined ? selectedDate.month : new Date().getMonth();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      
                      const chineseWeekdays = ['日', '一', '二', '三', '四', '五', '六'];
                      
                      return Array.from({length: daysInMonth}, (_, i) => {
                        const day = i + 1;
                        const weekday = new Date(year, month, day).getDay();
                        const chineseWeekday = chineseWeekdays[weekday];
                        const isSelected = selectedDate?.day === day;
                        const isHolidayDay = isHoliday(year, month, day);
                        
                        return (
                          <div key={day} className="relative flex items-center justify-center">
                            {/* 每月1號上面的向上導航按鈕 */}
                            {day === 1 && (
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-80 hover:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={() => {
                                    const newDate = new Date(year, month - 1, 1);
                                    setSelectedDate({ year: newDate.getFullYear(), month: newDate.getMonth(), day: 1 });
                                  }}
                                  className="w-5 h-5 bg-white/90 backdrop-blur-sm border border-gray-400 rounded-full flex items-center justify-center hover:bg-white hover:border-gray-600 transition-all duration-200 shadow-md"
                                  title="上個月"
                                >
                                  <ChevronUp className="w-2.5 h-2.5 text-gray-800" />
                                </button>
                              </div>
                            )}
                            
                            <button
                              onClick={() => setSelectedDate({ year, month, day })}
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold transition-all duration-150 ease-out ${
                                isSelected 
                                  ? isHolidayDay
                                    ? 'bg-black text-white shadow-lg scale-110'
                                    : 'bg-black text-white shadow-lg scale-110'
                                  : isHolidayDay
                                    ? 'bg-white text-red-600 hover:bg-red-50 hover:scale-105 shadow-sm border border-red-300'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 hover:scale-105 shadow-sm border border-gray-200'
                              }`}
                              data-date={`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`}
                            >
                              {day}
                            </button>
                            <span className={`absolute -top-2 -right-2 text-xs font-medium px-2 py-1 rounded-full font-mono tabular-nums tracking-wide ${
                              isSelected 
                                ? isHolidayDay
                                  ? 'bg-red-500 text-white'
                                  : 'bg-white text-black'
                                : isHolidayDay
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-100 text-gray-700'
                            }`}>
                              {chineseWeekday}
                            </span>
                            
                            {/* 每月最後一號下面的向下導航按鈕 */}
                            {day === daysInMonth && (
                              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-80 hover:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={() => {
                                    const newDate = new Date(year, month + 1, 1);
                                    setSelectedDate({ year: newDate.getFullYear(), month: newDate.getMonth(), day: 1 });
                                  }}
                                  className="w-5 h-5 bg-white/90 backdrop-blur-sm border border-gray-400 rounded-full flex items-center justify-center hover:bg-white hover:border-gray-600 transition-all duration-200 shadow-md"
                                  title="下個月"
                                >
                                  <ChevronDown className="w-2.5 h-2.5 text-gray-800" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* 右邊：內容區域 */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar-thin" style={{ 
                paddingBottom: '150px',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
              }}>
                {/* 時間區塊選擇器 */}
                <div className="space-y-4">
                  {/* 凌晨時間選擇器：0-5點（插入到上面） */}
                  {showEarlyMorningPicker && (
                    <>
                      {Array.from({ length: 6 }, (_, i) => {
                        const hour = i;
                        return (
                          <div key={hour} className="p-4">
                            {/* 上方：時（科技感數字） */}
                            <div className="text-3xl font-bold text-gray-900 mb-2 font-mono tabular-nums tracking-wider">
                              {hour.toString().padStart(2, '0')}
                            </div>
                            
                            {/* 中間：分界線（加黑加粗） */}
                            <div className="border-t-2 border-black mb-3"></div>
                            
                            {/* 下方：分鐘按鈕（加上細黑框，科技感數字，拉寬間距） */}
                            <div className="flex gap-3 justify-between">
                              {['00', '10', '20', '30', '40', '50'].map((minute) => {
                                const isSelected = selectedEarlyMorningTimes.some(t => t.hour === hour && t.minute === parseInt(minute));
                                return (
                                  <button
                                    key={minute}
                                    onClick={() => {
                                      const time = { hour, minute: parseInt(minute) };
                                      
                                      if (selectedDate) {
                                        const dateKey = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;
                                        
                                        if (isSelected) {
                                          // 移除凌晨時間
                                          setSelectedEarlyMorningTimes(selectedEarlyMorningTimes.filter(t => t.hour !== hour || t.minute !== parseInt(minute)));
                                          setDaySchedules(prev => ({
                                            ...prev,
                                            [dateKey]: prev[dateKey]?.filter(t => !(t.hour === hour && t.minute === parseInt(minute))) || []
                                          }));
                                        } else {
                                          // 添加凌晨時間
                                          setSelectedEarlyMorningTimes([...selectedEarlyMorningTimes, time]);
                                          setDaySchedules(prev => {
                                            const currentTimes = prev[dateKey] || [];
                                            const newTimes = [...currentTimes, time];
                                            return {
                                              ...prev,
                                              [dateKey]: newTimes
                                            };
                                          });
                                        }
                                      }
                                    }}
                                    className={`flex-1 px-4 py-2 rounded-lg transition-all border font-mono tabular-nums tracking-wide ${
                                      isSelected
                                        ? 'bg-black text-white border-black font-medium'
                                        : 'bg-white text-gray-700 border-gray-900 hover:bg-gray-50 hover:border-black'
                                    }`}
                                  >
                                    {minute}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* 一般時間選擇器：6-23點（始終顯示） */}
                  <>
                    {Array.from({ length: 18 }, (_, i) => {
                      const hour = i + 6; // 從6點開始到23點
                      return (
                        <div key={hour} className="p-4">
                          {/* 上方：時（科技感數字） */}
                          <div className="text-3xl font-bold text-gray-900 mb-2 font-mono tabular-nums tracking-wider">
                            {hour.toString().padStart(2, '0')}
                          </div>
                          
                          {/* 中間：分界線（加黑加粗） */}
                          <div className="border-t-2 border-black mb-3"></div>
                          
                          {/* 下方：分鐘按鈕（加上細黑框，科技感數字，拉寬間距） */}
                          <div className="flex gap-3 justify-between">
                            {['00', '10', '20', '30', '40', '50'].map((minute) => {
                              const isSelected = selectedTimes.some(t => t.hour === hour && t.minute === parseInt(minute));
                              return (
                                <button
                                  key={minute}
                                  onClick={() => {
                                    console.log('Minute button clicked:', { hour, minute: parseInt(minute), isSelected });
                                    const time = { hour, minute: parseInt(minute) };
                                    
                                    if (selectedDate) {
                                      const dateKey = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;
                                      
                                      if (isSelected) {
                                        console.log('Removing time:', time);
                                        // 移除時間
                                        setSelectedTimes(selectedTimes.filter(t => !(t.hour === hour && t.minute === parseInt(minute))));
                                        setDaySchedules(prev => ({
                                          ...prev,
                                          [dateKey]: prev[dateKey]?.filter(t => !(t.hour === hour && t.minute === parseInt(minute))) || []
                                        }));
                                      } else {
                                        console.log('Adding time:', time);
                                        // 添加時間
                                        setSelectedTimes([...selectedTimes, time]);
                                        setDaySchedules(prev => {
                                          const currentTimes = prev[dateKey] || [];
                                          const newTimes = [...currentTimes, time];
                                          return {
                                            ...prev,
                                            [dateKey]: newTimes
                                          };
                                        });
                                      }
                                    }
                                  }}
                                  className={`flex-1 px-4 py-2 rounded-lg transition-all border font-mono tabular-nums tracking-wide ${
                                    isSelected
                                      ? 'bg-black text-white border-black font-medium'
                                      : 'bg-white text-gray-700 border-gray-900 hover:bg-gray-50 hover:border-black'
                                  }`}
                                >
                                  {minute}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </>
                </div>
              </div>
            </div>

            {/* 彈窗底部按鈕 */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-mono tabular-nums tracking-wide"
              >
                取消
              </button>
              <button
                onClick={() => {
                  console.log('Confirm button clicked');
                  console.log('selectedDate:', selectedDate);
                  console.log('selectedTimes:', selectedTimes);
                  console.log('selectedEarlyMorningTimes:', selectedEarlyMorningTimes);
                  
                  // 保存選擇的時間到 daySchedules
                  if (selectedDate) {
                    const dateKey = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;
                    const allTimes = [...selectedTimes, ...selectedEarlyMorningTimes];
                    console.log('Saving to daySchedules:', { dateKey, allTimes });
                    setDaySchedules(prev => ({
                      ...prev,
                      [dateKey]: allTimes
                    }));
                    console.log('DaySchedules updated');
                  }
                  setShowAddModal(false);
                }}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-mono tabular-nums tracking-wide"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}

        {activeMainTab === 'basic' && activeSubTab === 'booking_settings' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">預約設定</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-gray-600">預約設定功能開發中...</p>
            </div>
          </div>
        )}
      
      {/* 區間日期選擇彈窗 */}
      {showDateRangeModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 pt-20 pb-8">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-white/20">
            {/* 彈窗標題區塊 */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200 relative">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2 font-mono tabular-nums tracking-wider">
                  複製到區間日期
                </h2>
                <p className="text-sm text-gray-600 font-mono tabular-nums tracking-wide">
                  請選擇您想要複製排班的日期範圍和星期
                </p>
              </div>
              
              {/* 左上角關閉按鈕 */}
              <button
                onClick={() => setShowDateRangeModal(false)}
                className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
              
              {/* 右上角確認按鈕 */}
              <button
                onClick={() => {
                  // TODO: 實現複製到區間日期的功能
                  console.log('複製到區間日期:', { dateRangeStart, dateRangeEnd, selectedWeekdays });
                  setShowDateRangeModal(false);
                }}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Check className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            
            {/* 彈窗內容區域 */}
            <div className="p-6 space-y-6">
              {/* 開始日期選擇 */}
              <div className="flex items-center gap-3 justify-center p-4 bg-gray-50 rounded-lg">
                {/* 年份選擇 */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1" onWheel={(e) => {
                    e.preventDefault();
                    if (e.deltaY < 0) {
                      setDateRangeStart(prev => ({ ...prev, year: Math.min(2100, prev.year + 1) }));
                    } else {
                      setDateRangeStart(prev => ({ ...prev, year: Math.max(1900, prev.year - 1) }));
                    }
                  }}>
                    <button 
                      onClick={() => setDateRangeStart(prev => ({ ...prev, year: Math.max(1900, prev.year - 1) }))}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <span className="text-lg font-bold text-gray-900 min-w-[60px] text-center font-mono tabular-nums">
                      {dateRangeStart.year}年
                    </span>
                    <button 
                      onClick={() => setDateRangeStart(prev => ({ ...prev, year: Math.min(2100, prev.year + 1) }))}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* 月份選擇 */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1" onWheel={(e) => {
                    e.preventDefault();
                    if (e.deltaY < 0) {
                      let newMonth = dateRangeStart.month + 1;
                      let newYear = dateRangeStart.year;
                      if (newMonth > 11) {
                        newMonth = 0;
                        newYear = dateRangeStart.year + 1;
                      }
                      setDateRangeStart({ ...dateRangeStart, month: newMonth, year: newYear });
                    } else {
                      let newMonth = dateRangeStart.month - 1;
                      let newYear = dateRangeStart.year;
                      if (newMonth < 0) {
                        newMonth = 11;
                        newYear = dateRangeStart.year - 1;
                      }
                      setDateRangeStart({ ...dateRangeStart, month: newMonth, year: newYear });
                    }
                  }}>
                    <button 
                      onClick={() => {
                        let newMonth = dateRangeStart.month - 1;
                        let newYear = dateRangeStart.year;
                        if (newMonth < 0) {
                          newMonth = 11;
                          newYear = dateRangeStart.year - 1;
                        }
                        setDateRangeStart({ ...dateRangeStart, month: newMonth, year: newYear });
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <span className="text-lg font-bold text-gray-900 min-w-[50px] text-center font-mono tabular-nums">
                      {dateRangeStart.month + 1}月
                    </span>
                    <button 
                      onClick={() => {
                        let newMonth = dateRangeStart.month + 1;
                        let newYear = dateRangeStart.year;
                        if (newMonth > 11) {
                          newMonth = 0;
                          newYear = dateRangeStart.year + 1;
                        }
                        setDateRangeStart({ ...dateRangeStart, month: newMonth, year: newYear });
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* 日期選擇 */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1" onWheel={(e) => {
                    e.preventDefault();
                    const daysInMonth = new Date(dateRangeStart.year, dateRangeStart.month + 1, 0).getDate();
                    if (e.deltaY < 0) {
                      setDateRangeStart(prev => ({ ...prev, day: Math.min(daysInMonth, prev.day + 1) }));
                    } else {
                      setDateRangeStart(prev => ({ ...prev, day: Math.max(1, prev.day - 1) }));
                    }
                  }}>
                    <button 
                      onClick={() => {
                        const daysInMonth = new Date(dateRangeStart.year, dateRangeStart.month + 1, 0).getDate();
                        setDateRangeStart(prev => ({ ...prev, day: Math.max(1, prev.day - 1) }));
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <span className="text-lg font-bold text-gray-900 min-w-[40px] text-center font-mono tabular-nums">
                      {dateRangeStart.day}日
                    </span>
                    <button 
                      onClick={() => {
                        const daysInMonth = new Date(dateRangeStart.year, dateRangeStart.month + 1, 0).getDate();
                        setDateRangeStart(prev => ({ ...prev, day: Math.min(daysInMonth, prev.day + 1) }));
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 分界線和 "至" */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-500"></div>
                <span className="text-lg font-bold text-gray-600 font-mono tabular-nums tracking-wide">至</span>
                <div className="flex-1 h-px bg-gray-500"></div>
              </div>
              
              {/* 結束日期選擇 */}
              <div className="flex items-center gap-3 justify-center p-4 bg-gray-50 rounded-lg">
                {/* 年份選擇 */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1" onWheel={(e) => {
                    e.preventDefault();
                    if (e.deltaY < 0) {
                      setDateRangeEnd(prev => ({ ...prev, year: Math.min(2100, prev.year + 1) }));
                    } else {
                      setDateRangeEnd(prev => ({ ...prev, year: Math.max(1900, prev.year - 1) }));
                    }
                  }}>
                    <button 
                      onClick={() => setDateRangeEnd(prev => ({ ...prev, year: Math.max(1900, prev.year - 1) }))}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <span className="text-lg font-bold text-gray-900 min-w-[60px] text-center font-mono tabular-nums">
                      {dateRangeEnd.year}年
                    </span>
                    <button 
                      onClick={() => setDateRangeEnd(prev => ({ ...prev, year: Math.min(2100, prev.year + 1) }))}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* 月份選擇 */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1" onWheel={(e) => {
                    e.preventDefault();
                    if (e.deltaY < 0) {
                      let newMonth = dateRangeEnd.month + 1;
                      let newYear = dateRangeEnd.year;
                      if (newMonth > 11) {
                        newMonth = 0;
                        newYear = dateRangeEnd.year + 1;
                      }
                      setDateRangeEnd({ ...dateRangeEnd, month: newMonth, year: newYear });
                    } else {
                      let newMonth = dateRangeEnd.month - 1;
                      let newYear = dateRangeEnd.year;
                      if (newMonth < 0) {
                        newMonth = 11;
                        newYear = dateRangeEnd.year - 1;
                      }
                      setDateRangeEnd({ ...dateRangeEnd, month: newMonth, year: newYear });
                    }
                  }}>
                    <button 
                      onClick={() => {
                        let newMonth = dateRangeEnd.month - 1;
                        let newYear = dateRangeEnd.year;
                        if (newMonth < 0) {
                          newMonth = 11;
                          newYear = dateRangeEnd.year - 1;
                        }
                        setDateRangeEnd({ ...dateRangeEnd, month: newMonth, year: newYear });
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <span className="text-lg font-bold text-gray-900 min-w-[50px] text-center font-mono tabular-nums">
                      {dateRangeEnd.month + 1}月
                    </span>
                    <button 
                      onClick={() => {
                        let newMonth = dateRangeEnd.month + 1;
                        let newYear = dateRangeEnd.year;
                        if (newMonth > 11) {
                          newMonth = 0;
                          newYear = dateRangeEnd.year + 1;
                        }
                        setDateRangeEnd({ ...dateRangeEnd, month: newMonth, year: newYear });
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* 日期選擇 */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1" onWheel={(e) => {
                    e.preventDefault();
                    const daysInMonth = new Date(dateRangeEnd.year, dateRangeEnd.month + 1, 0).getDate();
                    if (e.deltaY < 0) {
                      setDateRangeEnd(prev => ({ ...prev, day: Math.min(daysInMonth, prev.day + 1) }));
                    } else {
                      setDateRangeEnd(prev => ({ ...prev, day: Math.max(1, prev.day - 1) }));
                    }
                  }}>
                    <button 
                      onClick={() => {
                        const daysInMonth = new Date(dateRangeEnd.year, dateRangeEnd.month + 1, 0).getDate();
                        setDateRangeEnd(prev => ({ ...prev, day: Math.max(1, prev.day - 1) }));
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <span className="text-lg font-bold text-gray-900 min-w-[40px] text-center font-mono tabular-nums">
                      {dateRangeEnd.day}日
                    </span>
                    <button 
                      onClick={() => {
                        const daysInMonth = new Date(dateRangeEnd.year, dateRangeEnd.month + 1, 0).getDate();
                        setDateRangeEnd(prev => ({ ...prev, day: Math.min(daysInMonth, prev.day + 1) }));
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 分界線和 "的" */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-500"></div>
                <span className="text-lg font-bold text-gray-600 font-mono tabular-nums tracking-wide">的</span>
                <div className="flex-1 h-px bg-gray-500"></div>
              </div>
              
              {/* 星期選擇 */}
              <div className="relative">
                {/* 全選按鈕在左上角 */}
                <button 
                  onClick={() => {
                    // 檢查是否已經全選
                    const allWeekdays = [0, 1, 2, 3, 4, 5, 6];
                    const isAllSelected = selectedWeekdays.length === 7 && 
                      allWeekdays.every(day => selectedWeekdays.includes(day));
                    
                    if (isAllSelected) {
                      // 如果已經全選，則全不選
                      setSelectedWeekdays([]);
                    } else {
                      // 如果沒有全選，則全選
                      setSelectedWeekdays(allWeekdays);
                    }
                  }}
                  className={`absolute -top-8 left-0 px-3 py-1 text-sm rounded-lg transition-all duration-200 font-mono tabular-nums tracking-wide ${
                    selectedWeekdays.length === 7 && [0, 1, 2, 3, 4, 5, 6].every(day => selectedWeekdays.includes(day))
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-900 border border-gray-900 hover:bg-gray-50'
                  }`}
                >
                  全選
                </button>
                
                {/* 星期按鈕 */}
                <div className="flex gap-4 justify-center pt-2">
                  {['日', '一', '二', '三', '四', '五', '六'].map((weekday, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (selectedWeekdays.includes(index)) {
                          setSelectedWeekdays(selectedWeekdays.filter(w => w !== index));
                        } else {
                          setSelectedWeekdays([...selectedWeekdays, index]);
                        }
                      }}
                      className={`w-10 h-10 rounded-lg font-mono tabular-nums tracking-wide transition-all duration-200 ${
                        selectedWeekdays.includes(index)
                          ? 'bg-black text-white border-black scale-105'
                          : 'bg-white text-gray-700 border border-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {weekday}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 指定日期選擇彈窗 */}
      {showSpecificDateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 pt-20 pb-8">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-white/20">
            {/* 彈窗標題區塊 */}
            <div className="bg-gray-50 p-6 border-b border-gray-200 relative">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2 font-mono tabular-nums tracking-wider">
                  複製到指定日期
                </h2>
                <p className="text-sm text-gray-600 font-mono tabular-nums tracking-wide">
                  請選擇您想要複製排班的具體日期
                </p>
              </div>
              
              {/* 左上角關閉按鈕 */}
              <button
                onClick={() => setShowSpecificDateModal(false)}
                className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
              
              {/* 右上角確認按鈕 */}
              <button
                onClick={() => {
                  // TODO: 實現複製到指定日期的功能
                  console.log('複製到指定日期:', { selectedSpecificDates });
                  setShowSpecificDateModal(false);
                }}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Check className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            
            {/* 彈窗內容區域 */}
            <div className="p-6 space-y-6">
              {/* 簡潔的小日曆 */}
              <div className="bg-gray-50 rounded-lg p-4">
                {/* 月份導航 */}
                <div className="flex items-center justify-between mb-4">
                  <button 
                    onClick={() => {
                      if (calendarMonth.month === 0) {
                        setCalendarMonth({ year: calendarMonth.year - 1, month: 11 });
                      } else {
                        setCalendarMonth({ year: calendarMonth.year, month: calendarMonth.month - 1 });
                      }
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="text-lg font-bold text-gray-800 font-mono tabular-nums tracking-wide">
                    {calendarMonth.year}年{calendarMonth.month + 1}月
                  </div>
                  <button 
                    onClick={() => {
                      if (calendarMonth.month === 11) {
                        setCalendarMonth({ year: calendarMonth.year + 1, month: 0 });
                      } else {
                        setCalendarMonth({ year: calendarMonth.year, month: calendarMonth.month + 1 });
                      }
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                
                {/* 星期標題 */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['日', '一', '二', '三', '四', '五', '六'].map((weekday) => (
                    <div key={weekday} className="text-center text-xs font-medium text-gray-500 font-mono tabular-nums">
                      {weekday}
                    </div>
                  ))}
                </div>
                
                {/* 日期格子 */}
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const firstDay = new Date(calendarMonth.year, calendarMonth.month, 1).getDay();
                    const daysInMonth = new Date(calendarMonth.year, calendarMonth.month + 1, 0).getDate();
                    const days = [];
                    
                    // 填充空白格子
                    for (let i = 0; i < firstDay; i++) {
                      days.push(<div key={`empty-${i}`} className="h-8"></div>);
                    }
                    
                    // 填充日期格子
                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateStr = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isSelected = selectedSpecificDates.some(date => 
                        date.year === calendarMonth.year && 
                        date.month === calendarMonth.month && 
                        date.day === day
                      );
                      
                      days.push(
                        <button
                          key={day}
                          onClick={() => {
                            const newDate = { year: calendarMonth.year, month: calendarMonth.month, day };
                            if (isSelected) {
                              setSelectedSpecificDates(selectedSpecificDates.filter(date => 
                                !(date.year === calendarMonth.year && 
                                  date.month === calendarMonth.month && 
                                  date.day === day)
                              ));
                            } else {
                              setSelectedSpecificDates([...selectedSpecificDates, newDate]);
                            }
                          }}
                          className={`h-8 rounded text-sm font-mono tabular-nums transition-all duration-200 ${
                            isSelected
                              ? 'bg-black text-white hover:bg-gray-800'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    }
                    
                    return days;
                  })()}
                </div>
              </div>
              
              {/* 分界線 */}
              <div className="h-px bg-gray-500"></div>
              
              {/* 複製今日的時間到 */}
              <div className="space-y-3">
                <div className="text-lg font-bold text-gray-800 font-mono tabular-nums tracking-wide">
                  複製今日的時間到
                </div>
                
                {/* 選擇的日期列表 */}
                <div className="flex flex-wrap gap-2 max-h-16 overflow-x-auto overflow-y-auto">
                  {selectedSpecificDates.length === 0 ? (
                    <div className="text-center text-gray-500 py-4 font-mono tabular-nums w-full">
                      尚未選擇日期
                    </div>
                  ) : (
                    selectedSpecificDates.map((date, index) => (
                      <div key={index} className="flex items-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedSpecificDates(selectedSpecificDates.filter((_, i) => i !== index));
                          }}
                          className="p-1 hover:bg-red-100 rounded transition-colors mr-2 flex-shrink-0"
                        >
                          <X className="w-3 h-3 text-red-500" />
                        </button>
                        <span className="text-gray-800 font-mono tabular-nums tracking-wide text-sm">
                          {date.year}年{date.month + 1}月{date.day}日
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 刪除本日排班確認彈窗 */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 pt-20 pb-8">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
            {/* 彈窗標題區塊 */}
            <div className="bg-gray-50 p-6 relative">
              {/* 左上角關閉按鈕 */}
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            
            {/* 彈窗內容區域 */}
            <div className="p-8 text-center">
              {/* 主要確認文字 */}
              <div className="text-xl font-bold text-gray-800 mb-4 font-mono tabular-nums tracking-wide">
                確定要刪除本日所有排班 ?
              </div>
              
              {/* 警告文字 */}
              <div className="text-red-500 text-sm font-bold mb-8 font-mono tabular-nums tracking-wide">
                此操作不能回頭 !
              </div>
              
              {/* 按鈕區域 */}
              <div className="flex items-center gap-4 justify-center">
                {/* 取消按鈕 */}
                <button
                  onClick={() => setShowDeleteAllModal(false)}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-mono tabular-nums tracking-wide"
                >
                  取消
                </button>
                
                {/* 確定按鈕 */}
                <button
                  onClick={() => {
                    // TODO: 實現刪除本日所有排班的功能
                    console.log('刪除本日所有排班');
                    setShowDeleteAllModal(false);
                  }}
                  className="px-6 py-3 bg-white text-black border-2 border-black rounded-lg hover:bg-gray-50 transition-colors font-mono tabular-nums tracking-wide"
                >
                  確定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 刪除區間排班彈窗 */}
      {showDeleteRangeModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 pt-20 pb-8">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-white/20">
            {/* 彈窗標題區塊 */}
            <div className="bg-gray-50 p-6 border-b border-gray-200 relative">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2 font-mono tabular-nums tracking-wider">
                  刪除區間排班
                </h2>
                <p className="text-sm text-gray-600 font-mono tabular-nums tracking-wide">
                  請選擇您想要刪除排班的日期範圍
                </p>
              </div>
              
              {/* 左上角關閉按鈕 */}
              <button
                onClick={() => setShowDeleteRangeModal(false)}
                className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
              
              {/* 右上角確認按鈕 */}
              <button
                onClick={() => {
                  setShowDeleteRangeModal(false);
                  setShowDeleteRangeConfirmModal(true);
                }}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Check className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            
            {/* 彈窗內容區域 */}
            <div className="p-6 space-y-6">
              {/* 開始日期選擇 */}
              <div className="flex items-center gap-3 justify-center p-4 bg-gray-50 rounded-lg">
                {/* 年份選擇 */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1" onWheel={(e) => {
                    e.preventDefault();
                    if (e.deltaY < 0) {
                      setDeleteRangeStart(prev => ({ ...prev, year: Math.min(2100, prev.year + 1) }));
                    } else {
                      setDeleteRangeStart(prev => ({ ...prev, year: Math.max(1900, prev.year - 1) }));
                    }
                  }}>
                    <button 
                      onClick={() => setDeleteRangeStart(prev => ({ ...prev, year: Math.max(1900, prev.year - 1) }))}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <span className="text-lg font-bold text-gray-900 min-w-[60px] text-center font-mono tabular-nums">
                      {deleteRangeStart.year}年
                    </span>
                    <button 
                      onClick={() => setDeleteRangeStart(prev => ({ ...prev, year: Math.min(2100, prev.year + 1) }))}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* 月份選擇 */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1" onWheel={(e) => {
                    e.preventDefault();
                    if (e.deltaY < 0) {
                      let newMonth = deleteRangeStart.month + 1;
                      let newYear = deleteRangeStart.year;
                      if (newMonth > 11) {
                        newMonth = 0;
                        newYear = deleteRangeStart.year + 1;
                      }
                      setDeleteRangeStart({ ...deleteRangeStart, month: newMonth, year: newYear });
                    } else {
                      let newMonth = deleteRangeStart.month - 1;
                      let newYear = deleteRangeStart.year;
                      if (newMonth < 0) {
                        newMonth = 11;
                        newYear = deleteRangeStart.year - 1;
                      }
                      setDeleteRangeStart({ ...deleteRangeStart, month: newMonth, year: newYear });
                    }
                  }}>
                    <button 
                      onClick={() => {
                        let newMonth = deleteRangeStart.month - 1;
                        let newYear = deleteRangeStart.year;
                        if (newMonth < 0) {
                          newMonth = 11;
                          newYear = deleteRangeStart.year - 1;
                        }
                        setDeleteRangeStart({ ...deleteRangeStart, month: newMonth, year: newYear });
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <span className="text-lg font-bold text-gray-900 min-w-[50px] text-center font-mono tabular-nums">
                      {deleteRangeStart.month + 1}月
                    </span>
                    <button 
                      onClick={() => {
                        let newMonth = deleteRangeStart.month + 1;
                        let newYear = deleteRangeStart.year;
                        if (newMonth > 11) {
                          newMonth = 0;
                          newYear = deleteRangeStart.year + 1;
                        }
                        setDeleteRangeStart({ ...deleteRangeStart, month: newMonth, year: newYear });
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* 日期選擇 */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1" onWheel={(e) => {
                    e.preventDefault();
                    const daysInMonth = new Date(deleteRangeStart.year, deleteRangeStart.month + 1, 0).getDate();
                    if (e.deltaY < 0) {
                      setDeleteRangeStart(prev => ({ ...prev, day: Math.min(daysInMonth, prev.day + 1) }));
                    } else {
                      setDeleteRangeStart(prev => ({ ...prev, day: Math.max(1, prev.day - 1) }));
                    }
                  }}>
                    <button 
                      onClick={() => {
                        const daysInMonth = new Date(deleteRangeStart.year, deleteRangeStart.month + 1, 0).getDate();
                        setDeleteRangeStart(prev => ({ ...prev, day: Math.max(1, prev.day - 1) }));
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <span className="text-lg font-bold text-gray-900 min-w-[40px] text-center font-mono tabular-nums">
                      {deleteRangeStart.day}日
                    </span>
                    <button 
                      onClick={() => {
                        const daysInMonth = new Date(deleteRangeStart.year, deleteRangeStart.month + 1, 0).getDate();
                        setDeleteRangeStart(prev => ({ ...prev, day: Math.min(daysInMonth, prev.day + 1) }));
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 分界線和 "至" */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-600"></div>
                <span className="text-lg font-bold text-gray-600 font-mono tabular-nums tracking-wide">至</span>
                <div className="flex-1 h-px bg-gray-600"></div>
              </div>
              
              {/* 結束日期選擇 */}
              <div className="flex items-center gap-3 justify-center p-4 bg-gray-50 rounded-lg">
                {/* 年份選擇 */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1" onWheel={(e) => {
                    e.preventDefault();
                    if (e.deltaY < 0) {
                      setDeleteRangeEnd(prev => ({ ...prev, year: Math.min(2100, prev.year + 1) }));
                    } else {
                      setDeleteRangeEnd(prev => ({ ...prev, year: Math.max(1900, prev.year - 1) }));
                    }
                  }}>
                    <button 
                      onClick={() => setDeleteRangeEnd(prev => ({ ...prev, year: Math.max(1900, prev.year - 1) }))}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <span className="text-lg font-bold text-gray-900 min-w-[60px] text-center font-mono tabular-nums">
                      {deleteRangeEnd.year}年
                    </span>
                    <button 
                      onClick={() => setDeleteRangeEnd(prev => ({ ...prev, year: Math.min(2100, prev.year + 1) }))}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* 月份選擇 */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1" onWheel={(e) => {
                    e.preventDefault();
                    if (e.deltaY < 0) {
                      let newMonth = deleteRangeEnd.month + 1;
                      let newYear = deleteRangeEnd.year;
                      if (newMonth > 11) {
                        newMonth = 0;
                        newYear = deleteRangeEnd.year + 1;
                      }
                      setDeleteRangeEnd({ ...deleteRangeEnd, month: newMonth, year: newYear });
                    } else {
                      let newMonth = deleteRangeEnd.month - 1;
                      let newYear = deleteRangeEnd.year;
                      if (newMonth < 0) {
                        newMonth = 11;
                        newYear = deleteRangeEnd.year - 1;
                      }
                      setDeleteRangeEnd({ ...deleteRangeEnd, month: newMonth, year: newYear });
                    }
                  }}>
                    <button 
                      onClick={() => {
                        let newMonth = deleteRangeEnd.month - 1;
                        let newYear = deleteRangeEnd.year;
                        if (newMonth < 0) {
                          newMonth = 11;
                          newYear = deleteRangeEnd.year - 1;
                        }
                        setDeleteRangeEnd({ ...deleteRangeEnd, month: newMonth, year: newYear });
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <span className="text-lg font-bold text-gray-900 min-w-[50px] text-center font-mono tabular-nums">
                      {deleteRangeEnd.month + 1}月
                    </span>
                    <button 
                      onClick={() => {
                        let newMonth = deleteRangeEnd.month + 1;
                        let newYear = deleteRangeEnd.year;
                        if (newMonth > 11) {
                          newMonth = 0;
                          newYear = deleteRangeEnd.year + 1;
                        }
                        setDeleteRangeEnd({ ...deleteRangeEnd, month: newMonth, year: newYear });
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* 日期選擇 */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1" onWheel={(e) => {
                    e.preventDefault();
                    const daysInMonth = new Date(deleteRangeEnd.year, deleteRangeEnd.month + 1, 0).getDate();
                    if (e.deltaY < 0) {
                      setDeleteRangeEnd(prev => ({ ...prev, day: Math.min(daysInMonth, prev.day + 1) }));
                    } else {
                      setDeleteRangeEnd(prev => ({ ...prev, day: Math.max(1, prev.day - 1) }));
                    }
                  }}>
                    <button 
                      onClick={() => {
                        const daysInMonth = new Date(deleteRangeEnd.year, deleteRangeEnd.month + 1, 0).getDate();
                        setDeleteRangeEnd(prev => ({ ...prev, day: Math.max(1, prev.day - 1) }));
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <span className="text-lg font-bold text-gray-900 min-w-[40px] text-center font-mono tabular-nums">
                      {deleteRangeEnd.day}日
                    </span>
                    <button 
                      onClick={() => {
                        const daysInMonth = new Date(deleteRangeEnd.year, deleteRangeEnd.month + 1, 0).getDate();
                        setDeleteRangeEnd(prev => ({ ...prev, day: Math.min(daysInMonth, prev.day + 1) }));
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 刪除區間排班確認彈窗 */}
      {showDeleteRangeConfirmModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 pt-20 pb-8">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
            {/* 彈窗標題區塊 */}
            <div className="bg-gray-50 p-6 relative">
              {/* 左上角關閉按鈕 */}
              <button
                onClick={() => setShowDeleteRangeConfirmModal(false)}
                className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            
            {/* 彈窗內容區域 */}
            <div className="p-8 text-center">
              {/* 主要確認文字 */}
              <div className="text-xl font-bold text-gray-800 mb-4 font-mono tabular-nums tracking-wide">
                確定要刪除此區間所有排班 ?
              </div>
              
              {/* 警告文字 */}
              <div className="text-red-500 text-sm font-bold mb-8 font-mono tabular-nums tracking-wide">
                此操作不能回頭 !
              </div>
              
              {/* 按鈕區域 */}
              <div className="flex items-center gap-4 justify-center">
                {/* 取消按鈕 */}
                <button
                  onClick={() => setShowDeleteRangeConfirmModal(false)}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-mono tabular-nums tracking-wide"
                >
                  取消
                </button>
                
                {/* 確定按鈕 */}
                <button
                  onClick={() => {
                    // TODO: 實現刪除區間所有排班的功能
                    console.log('刪除區間所有排班:', { deleteRangeStart, deleteRangeEnd });
                    setShowDeleteRangeConfirmModal(false);
                  }}
                  className="px-6 py-3 bg-white text-black border-2 border-black rounded-lg hover:bg-gray-50 transition-colors font-mono tabular-nums tracking-wide"
                >
                  確定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 刪除全部排班確認彈窗 */}
      {showDeleteAllSchedulesModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 pt-20 pb-8">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
            {/* 彈窗標題區塊 */}
            <div className="bg-gray-50 p-6 relative">
              {/* 左上角關閉按鈕 */}
              <button
                onClick={() => setShowDeleteAllSchedulesModal(false)}
                className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            
            {/* 彈窗內容區域 */}
            <div className="p-8 text-center">
              {/* 主要確認文字 */}
              <div className="text-xl font-bold text-gray-800 mb-4 font-mono tabular-nums tracking-wide">
                確定要刪除所有排班 ?
              </div>
              
              {/* 警告文字 */}
              <div className="text-red-500 text-sm font-bold mb-8 font-mono tabular-nums tracking-wide">
                此操作不能回頭 !
              </div>
              
              {/* 按鈕區域 */}
              <div className="flex items-center gap-4 justify-center">
                {/* 取消按鈕 */}
                <button
                  onClick={() => setShowDeleteAllSchedulesModal(false)}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-mono tabular-nums tracking-wide"
                >
                  取消
                </button>
                
                {/* 確定按鈕 */}
                <button
                  onClick={() => {
                    // TODO: 實現刪除所有排班的功能
                    console.log('刪除所有排班');
                    setShowDeleteAllSchedulesModal(false);
                  }}
                  className="px-6 py-3 bg-white text-black border-2 border-black rounded-lg hover:bg-gray-50 transition-colors font-mono tabular-nums tracking-wide"
                >
                  確定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 複製設定確認彈窗 */}
      {showCopyConfirmModal && copyTargetStaff && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 pt-20 pb-8">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
            {/* 彈窗標題區塊 */}
            <div className="bg-gray-50 p-6 relative">
              {/* 左上角關閉按鈕 */}
              <button
                onClick={cancelCopySettings}
                className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            
            {/* 彈窗內容區域 */}
            <div className="p-8 text-center">
              {/* 主要確認文字 */}
              <div className="text-xl font-bold text-gray-800 mb-4 font-mono tabular-nums tracking-wide">
                確定將{getCurrentTabSettingsName()}複製到{copyTargetStaff.type === 'all' ? '全體員工' : copyTargetStaff.name}?
              </div>
              
              {/* 警告文字 */}
              <div className="text-red-500 text-sm font-bold mb-8 font-mono tabular-nums tracking-wide">
                此操作將覆蓋目標員工的現有設定 !
              </div>
              
              {/* 按鈕區域 */}
              <div className="flex items-center gap-4 justify-center">
                {/* 取消按鈕 */}
                <button
                  onClick={cancelCopySettings}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-mono tabular-nums tracking-wide"
                >
                  取消
                </button>
                
                {/* 確定按鈕 */}
                <button
                  onClick={confirmCopySettings}
                  className="px-6 py-3 bg-white text-black border-2 border-black rounded-lg hover:bg-gray-50 transition-colors font-mono tabular-nums tracking-wide"
                >
                  確定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
