"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, MapPin, Phone as PhoneIcon, Mail as MailIcon, Clock, Tag, X, User, Crown, Scissors, Eye, Palette, Calendar, Plus, AlertCircle, AlertTriangle, CalendarPlus, Check, PhoneCall, CreditCard, FileText, Edit, UserX, PlusCircle, Search, Bot, Phone, MessageCircle } from "lucide-react";
import { TimePicker } from "@/components/ui/time-picker";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/bookingService";
import { fetchBookingsByStatus, fetchHistoryBookings, updateBookingStatus, confirmBooking, createBooking, softDeleteBooking } from "@/lib/bookingService";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// 擴展 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Taipei');

const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
    margin: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 10px;
    margin: 4px;
  }
  .custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background: #e5e7eb;
  }
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
  }
  .custom-scrollbar:hover {
    scrollbar-color: #e5e7eb transparent;
  }

  @keyframes highlight-flash {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
    }
    25%, 75% {
      box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.5);
    }
    50% {
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3);
    }
  }

  .highlight-flash {
    animation: highlight-flash 1.5s ease-in-out 2;
  }

  @keyframes error-flash {
    0% {
      border-color: #e5e7eb;
      box-shadow: none;
    }
    20% {
      border-color: #dc2626;
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.3);
    }
    40% {
      border-color: #e5e7eb;
      box-shadow: none;
    }
    60% {
      border-color: #dc2626;
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.3);
    }
    80% {
      border-color: #dc2626;
      box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
    }
    90% {
      border-color: #dc2626;
      box-shadow: 0 0 0 1px rgba(220, 38, 38, 0.1);
    }
    100% {
      border-color: #e5e7eb;
      box-shadow: none;
    }
  }

  .error-flash {
    animation: error-flash 2s ease-in-out;
  }
`;

// V3 服務資訊物件
interface ServiceInfo {
  name: string;
  price: number;
  category: "booking" | "activity";
  service_type: "nail" | "hair" | "facial" | "massage" | "eyelash" | "other";
}

// V3 排程資訊物件
interface Schedule {
  start: string;
  end: string;
  date: string;
  duration: string;
}

// V3 管理資訊物件
interface AdminMeta {
  tags: string[];
  ai_notes: string;
  source: "manual" | "web_dashboard" | "mobile_app" | "phone_call" | "walk_in" | "import" | "AI_Chatbot";
  notes: string;
}

// V3 預約物件
interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  service_info: ServiceInfo;
  schedule: Schedule;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show" | "rescheduled" | "waiting_list";
  admin_meta: AdminMeta;
}

// V3 顧客物件
interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  stats: {
    total_bookings: number;
    total_spending: number;
    no_show_count: number;
    last_purchase_at: string;
  };
  status: {
    is_blacklisted: boolean;
    blacklist_reason: string | null;
  };
  tags: string[];
  manual_notes: string;
}

// 常用標籤
const commonTags = ["新客", "VIP", "特殊注意"];

export default function AppointmentsPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<"pending" | "confirmed" | "history">("pending");
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: "", description: "" });
  const [errorFields, setErrorFields] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // 從設定讀取的服務資料
  const [services, setServices] = useState<Array<{ id: string; name: string; description: string; price: number; duration: number; category: string }>>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // 服務對應的預設時長（分鐘）- 使用 useMemo 避免重複計算
  const serviceDurationMap = useMemo(() => {
    return services.reduce((acc, service) => {
      acc[service.name] = service.duration;
      return acc;
    }, {} as Record<string, number>);
  }, [services]);

  // 新增預約表單狀態
  const [newBooking, setNewBooking] = useState<{
    name: string;
    phone: string;
    email: string;
    service: string;
    time: string;
    date: string;
    tags: string[];
    source: "manual";
  }>({
    name: "",
    phone: "",
    email: "",
    service: "",
    time: "",
    date: "",
    tags: [],
    source: "manual"
  });
  const [customTagInput, setCustomTagInput] = useState("");
  const [timeWarning, setTimeWarning] = useState<{ type: 'none' | 'short' | 'overlap'; message?: string }>({ type: 'none' });
  const [suggestedEndTime, setSuggestedEndTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);

  // 通用倒數計時組件：穩定不跳動，適用於預約管理頁面
  const UniversalCountdown = () => {
    const [countdown, setCountdown] = useState<{ minutes: number; seconds: number; hours: number } | null>(null);
    const [nextItemType, setNextItemType] = useState<'booking' | 'activity' | null>(null);
    const [shouldShow, setShouldShow] = useState(false);
    const lastUpdateTime = useRef<number>(0);
    const animationFrameRef = useRef<number | undefined | null>(null);

    useEffect(() => {
      const updateCountdown = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const now = dayjs().tz('Asia/Taipei');
          const currentTime = now.valueOf();
          
          // 限制更新頻率，避免過度渲染
          if (currentTime - lastUpdateTime.current < 900) {
            return;
          }
          lastUpdateTime.current = currentTime;

          // 獲取所有今天的預約和活動 - 從 V3 讀取
          const today = dayjs().tz('Asia/Taipei').format('YYYY-MM-DD');
          const { data: todayData } = await supabase
            .from('shop_bookings_v3')
            .select('all_bookings')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!todayData?.all_bookings || todayData.all_bookings.length === 0) {
            if (shouldShow) {
              setShouldShow(false);
              setTimeout(() => {
                setCountdown(null);
                setNextItemType(null);
              }, 300);
            }
            return;
          }
          
          let isInRestPeriod = false;
          let nextItem = null;
          let restEndTime = null;
          
          // 過濾今天的預約（V3 結構）
          const todayBookings = todayData.all_bookings.filter((booking: any) => 
            booking.date === today && booking.status !== 'cancelled'
          );

          // 檢查每個預約項目，找尋休息期間
          for (let i = 0; i < todayBookings.length; i++) {
            const appointment = todayBookings[i];
            const startDateTime = dayjs(appointment.start_time).tz('Asia/Taipei');
            const endDateTime = dayjs(appointment.end_time).tz('Asia/Taipei');
            
            // 檢查當前是否在這個項目的休息期間內
            if (i + 1 < todayBookings.length) {
              const nextAppointment = todayBookings[i + 1];
              const nextStartDateTime = dayjs(nextAppointment.start_time).tz('Asia/Taipei');
              
              // 休息期間：從當前項目結束到下一個項目開始
              if (now.isAfter(endDateTime) && now.isBefore(nextStartDateTime)) {
                isInRestPeriod = true;
                nextItem = nextAppointment;
                restEndTime = nextStartDateTime;
                break;
              }
            }
          }

          // 檢查是否在第一個項目之前的等待時間
          if (!isInRestPeriod && todayData.length > 0) {
            const firstAppointment = todayData[0];
            const firstStartDateTime = dayjs(firstAppointment.start_time).tz('Asia/Taipei');
            if (now.isBefore(firstStartDateTime)) {
              isInRestPeriod = true;
              nextItem = firstAppointment;
              restEndTime = firstStartDateTime;
            }
          }

          // 如果不在休息期間，隱藏倒數計時
          if (!isInRestPeriod || !nextItem || !restEndTime) {
            if (shouldShow) {
              setShouldShow(false);
              setTimeout(() => {
                setCountdown(null);
                setNextItemType(null);
              }, 300);
            }
            return;
          }

          // 計算倒數計時
          const diffMs = restEndTime.diff(now);
          
          if (diffMs <= 0) {
            if (shouldShow) {
              setShouldShow(false);
              setTimeout(() => {
                setCountdown(null);
                setNextItemType(null);
              }, 300);
            }
            return;
          }

          const totalSeconds = Math.floor(diffMs / 1000);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;

          // 使用 requestAnimationFrame 確保穩定更新
          animationFrameRef.current = requestAnimationFrame(() => {
            setCountdown(prev => {
              if (!prev || prev.hours !== hours || prev.minutes !== minutes || prev.seconds !== seconds) {
                return { hours, minutes, seconds };
              }
              return prev;
            });
            setNextItemType(nextItem.category || 'booking');
            setShouldShow(true);
          });
        } catch (error) {
          console.error('Error updating countdown:', error);
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      
      return () => {
        clearInterval(interval);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, []);

    if (!shouldShow || !countdown || !nextItemType) return null;

    // 格式化顯示 - 使用穩定的顯示方式
    const formatTime = () => {
      if (countdown.hours > 0) {
        return (
          <span className="inline-flex items-center gap-1">
            距離下一個{nextItemType === 'activity' ? '活動' : '預約'}還有 
            <span className="text-green-600 font-bold min-w-[2rem] text-center">{countdown.hours}</span>
            <span className="text-black">小時</span>
            <span className="text-green-600 font-bold min-w-[2rem] text-center">{countdown.minutes}</span>
            <span className="text-black">分鐘</span>
          </span>
        );
      } else if (countdown.minutes > 0) {
        return (
          <span className="inline-flex items-center gap-1">
            距離下一個{nextItemType === 'activity' ? '活動' : '預約'}還有 
            <span className="text-green-600 font-bold min-w-[2rem] text-center">{countdown.minutes}</span>
            <span className="text-black">分鐘</span>
            <span className="text-green-600 font-bold min-w-[2rem] text-center">{countdown.seconds.toString().padStart(2, '0')}</span>
            <span className="text-black">秒</span>
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center gap-1">
            距離下一個{nextItemType === 'activity' ? '活動' : '預約'}還有 
            <span className="text-green-600 font-bold min-w-[2rem] text-center">{countdown.seconds}</span>
            <span className="text-black">秒</span>
          </span>
        );
      }
    };

    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 transition-all duration-300 ease-in-out">
        <div className="text-center">
          <div className="text-black font-medium text-base">
            {formatTime()}
          </div>
        </div>
      </div>
    );
  };

  // 從 Supabase 載入預約數據（根據當前分頁）
  useEffect(() => {
    const loadBookings = async (currentUserId: string) => {
      setIsLoading(true);

      let data;
      if (filter === "history") {
        data = await fetchHistoryBookings(currentPage, pageSize);
      } else {
        data = await fetchBookingsByStatus(filter, currentPage, pageSize);
      }
      setBookingsList(data);
      setIsLoading(false);
    };

    // 使用 onAuthStateChange 監聽登入狀態
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.id) {
        loadBookings(session.user.id);
      } else {
        setBookingsList([]);
      }
    });

    // 初始加載時也嘗試獲取 session
    const initialLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        loadBookings(session.user.id);
      }
    };
    initialLoad();

    return () => {
      subscription.unsubscribe();
    };
  }, [filter, currentPage]);

  // 從 Supabase 讀取設定資料
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('service_settings')
          .eq('user_id', user.id)
          .single();

        if (settingsError) throw settingsError;

        // 讀取服務設定
        if (settingsData?.service_settings?.services) {
          setServices(settingsData.service_settings.services);
        }
      } catch (error) {
        console.error('讀取設定資料失敗:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
    fetchBlacklistSet(); // 🛠️ 初始化時建立全域黑名單索引
  }, []);

  // 🔔 監聽黑名單更新事件
  useEffect(() => {
    const handleBlacklistUpdate = (event: CustomEvent) => {
      console.log('🔔 [Appointments] 收到黑名單更新通知:', event.detail);
      
      // 🚨 降魔咒：實時監聽優化 - 強制重新載入並顯示最新狀態
      console.log('🔄 [Appointments] 立即重新載入預約數據以反映黑名單變更...');
      
      // 重新載入預約數據以反映黑名單變更
      const { data: { user } } = supabase.auth.getUser();
      if (user) {
        loadBookings(user.id);
        // 🛠️ 同時更新黑名單索引
        fetchBlacklistSet();
      }
      
      // 顯示成功通知
      toast({
        title: "黑名單狀態已更新",
        description: "預約管理頁面已同步更新",
        duration: 3000
      });
    };

    window.addEventListener('blacklistUpdated', handleBlacklistUpdate as EventListener);
    
    console.log('👂 [Appointments] 黑名單監聽器已啟動');
    
    return () => {
      window.removeEventListener('blacklistUpdated', handleBlacklistUpdate as EventListener);
      console.log('🔇 [Appointments] 黑名單監聽器已移除');
    };
  }, []);

  // 當過濾器變更時重置頁碼
  useEffect(() => {
    setCurrentPage(0);
  }, [filter]);

  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [blacklistSet, setBlacklistSet] = useState<Set<string>>(new Set()); // 🛠️ 全域黑名單索引

  // 🛠️ 建立全域黑名單索引 - 從 shop_customers_v3 抓取所有黑名單手機號碼
  const fetchBlacklistSet = async () => {
    try {
      console.log('🔍 [Blacklist Index] 正在建立全域黑名單索引...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 🔧 V3 資料路徑：從 all_customers JSON 裡的 status.is_blacklisted 判斷
      const { data: customerData, error: customersError } = await supabase
        .from('shop_customers_v3')
        .select('all_customers')
        .eq('user_id', user.id)
        .maybeSingle();

      if (customersError) {
        console.error('❌ [Blacklist Index] 查詢黑名單失敗:', customersError);
        return;
      }

      // 🛠️ 檢查 V3 資料路徑：從 all_customers JSON 的 status.is_blacklisted 判斷
      const blacklistedPhones = customerData?.all_customers?.filter((customer: any) => {
        // 檢查三個地方的黑名單狀態
        const isBlacklisted = customer.is_blacklisted || 
                              customer.status?.is_blacklisted || 
                              customer.tags?.includes('黑名單');
        
        if (isBlacklisted) {
          console.log('📋 [Blacklist Index] 發現黑名單客戶:', {
            name: customer.name,
            phone: customer.phone,
            is_blacklisted: customer.is_blacklisted,
            status_is_blacklisted: customer.status?.is_blacklisted,
            tags: customer.tags
          });
        }
        
        return isBlacklisted;
      }).map((customer: any) => customer.phone) || [];

      const newBlacklistSet = new Set(blacklistedPhones);
      setBlacklistSet(newBlacklistSet);
      
      console.log('✅ [Blacklist Index] 全域黑名單索引建立完成:', {
        totalBlacklisted: newBlacklistSet.size,
        blacklistedPhones: Array.from(newBlacklistSet)
      });
    } catch (error) {
      console.error('❌ [Blacklist Index] 建立索引失敗:', error);
    }
  };

  // 當沒有搜尋詞時，同步顯示當前分頁資料
  useEffect(() => {
    if (!searchTerm) {
      setFilteredBookings(bookingsList);
    }
  }, [bookingsList, searchTerm]);

  // 搜尋過濾 - 當有搜尋詞時，獲取所有資料並搜尋
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      // 當有搜尋詞時，獲取所有資料
      const loadAllAndSearch = async () => {
        const [pendingData, confirmedData, historyData] = await Promise.all([
          fetchBookingsByStatus('pending', 0, 1000),
          fetchBookingsByStatus('confirmed', 0, 1000),
          fetchHistoryBookings(0, 1000)
        ]);
        const allData = [...pendingData, ...confirmedData, ...historyData];
        const filtered = allData.filter(booking =>
          booking.customer_name.toLowerCase().includes(term) ||
          booking.customer_phone.includes(term)
        );
        setFilteredBookings(filtered);
        
        // 自動跳轉到對應分頁
        if (filtered.length > 0) {
          const firstMatch = filtered[0];
          if (firstMatch.status === 'completed' || firstMatch.status === 'cancelled' || firstMatch.status === 'no_show') {
            setFilter("history");
          } else {
            setFilter(firstMatch.status as "pending" | "confirmed");
          }
          setCurrentPage(0);
          setHighlightedBookingId(firstMatch.id);
          
          // 2秒後移除高亮
          setTimeout(() => {
            setHighlightedBookingId(null);
          }, 2000);
        }
      };
      loadAllAndSearch();
    }
  }, [searchTerm]);

  // 檢查預約是否正在進行中
  const isInProgressBooking = (booking: Booking) => {
    if (booking.status !== 'confirmed') return false;
    if (!booking.schedule?.start || !booking.schedule?.end) return false;

    const now = new Date();
    const startTime = new Date(booking.schedule.start);
    const endTime = new Date(booking.schedule.end);

    return now >= startTime && now < endTime;
  };

  // 過濾非預約項目：排除店內任務，專注於真實客戶
  const customerBookings = filteredBookings.filter(booking => 
    booking.customer_name !== "店內任務"
  );

  // 排序：在「已確認」分頁中，正在進行中的訂單置頂
  const sortedBookings = [...customerBookings].sort((a, b) => {
    if (filter === "confirmed") {
      const aInProgress = isInProgressBooking(a);
      const bInProgress = isInProgressBooking(b);
      if (aInProgress && !bInProgress) return -1;
      if (!aInProgress && bInProgress) return 1;
    }
    // 其他情況保持原有順序（按時間）
    return 0;
  });

  // 檢查預約是否即將到期（剩2小時內）
  const isUrgentBooking = (booking: Booking) => {
    if (booking.status !== 'pending') return false;
    if (!booking.schedule?.start) return false;

    const bookingDateTime = new Date(booking.schedule.start);
    const now = new Date();
    const timeDiff = bookingDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    return hoursDiff > 0 && hoursDiff <= 2;
  };

  // 需要單獨獲取待處理數量，因為 bookingsList 只包含當前過濾器的數據
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      const pendingData = await fetchBookingsByStatus('pending');
      setPendingCount(pendingData.length);
    };
    fetchPendingCount();
  }, []);

  // Supabase Realtime 訂閱
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('bookings-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shop_bookings_v3',
            filter: `user_id=eq.${user.id}`
          },
          async (payload) => {
            console.log('預約資料變更:', payload);

            // 重新載入當前過濾器的數據
            let data;
            if (filter === "history") {
              data = await fetchHistoryBookings();
            } else {
              data = await fetchBookingsByStatus(filter);
            }
            setBookingsList(data);

            // 更新待處理數量
            const pendingData = await fetchBookingsByStatus('pending');
            setPendingCount(pendingData.length);

            // 根據事件類型顯示通知
            if (payload.eventType === 'INSERT') {
              const source = payload.new.source;
              if (source === 'AI_Chatbot') {
                toast({
                  title: "🤖 AI 自動預約",
                  description: "AI 幫你接到了一筆新預約！"
                });
              } else if (source === 'Hang_Ke') {
                toast({
                  title: "🔗 夾客轉導",
                  description: "收到來自夾客的預約"
                });
              } else {
                toast({
                  title: "新預約通知",
                  description: "收到一筆新的預約申請"
                });
              }
            } else if (payload.eventType === 'UPDATE') {
              const newStatus = payload.new.status;
              if (newStatus === 'confirmed') {
                toast({
                  title: "預約已確認",
                  description: "預約狀態已更新為已確認"
                });
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeSubscription();
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [filter, supabase, toast]);

  const handleConfirm = async (id: string) => {
    const result = await confirmBooking(id);
    if (result.success) {
      toast({
        title: "預約已成功加入排程",
        description: "預約狀態已更新為已確認"
      });
      // 重新載入數據
      let data;
      if (filter === "history") {
        data = await fetchHistoryBookings();
      } else {
        data = await fetchBookingsByStatus(filter);
      }
      setBookingsList(data);
      // 更新待處理數量
      const pendingData = await fetchBookingsByStatus('pending');
      setPendingCount(pendingData.length);
    } else {
      toast({
        title: "確認失敗",
        description: "無法更新預約狀態，請稍後再試"
      });
    }
  };

  const handleReject = async (id: string) => {
    const result = await softDeleteBooking(id);
    if (result.success) {
      toast({
        title: "預約已刪除",
        description: "預約已成功刪除"
      });
      // 重新載入數據
      let data;
      if (filter === "history") {
        data = await fetchHistoryBookings();
      } else {
        data = await fetchBookingsByStatus(filter);
      }
      setBookingsList(data);
      // 更新待處理數量
      const pendingData = await fetchBookingsByStatus('pending');
      setPendingCount(pendingData.length);
    } else {
      toast({
        title: "刪除失敗",
        description: "無法刪除預約，請稍後再試"
      });
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "phone": return "電話";
      case "line": return "LINE";
      case "walkin": return "現場";
      case "manual": return "手動";
      case "AI_Chatbot": return "🤖 AI 自動預約";
      case "Hang_Ke": return "🔗 夾客轉導";
      default: return "其他";
    }
  };

  const getSourceStyle = (source: string) => {
    switch (source) {
      case "AI_Chatbot":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "Hang_Ke":
        return "bg-purple-100 text-purple-700 border border-purple-200";
      case "manual":
        return "bg-gray-100 text-gray-700 border border-gray-200";
      default:
        return "bg-[#F4F4F5] text-[#1A1A1A]";
    }
  };

  // 切換標籤
  const toggleTag = (tag: string) => {
    setNewBooking(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  // 新增自定義標籤
  const addCustomTag = () => {
    const tag = customTagInput.trim();
    if (tag && !newBooking.tags.includes(tag)) {
      setNewBooking(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setCustomTagInput("");
    }
  };

  // 解析時間字符串為分鐘數
  const parseTimeToMinutes = (timeStr: string | null): number => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // 將分鐘數轉換為時間字符串
  const minutesToTimeString = (minutes: number): string => {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // 檢查時間衝突
  const checkTimeConflict = (date: string, time: string, duration: number) => {
    if (!date || !time) {
      setTimeWarning({ type: 'none' });
      setSuggestedEndTime("");
      return;
    }

    const startTimeMinutes = parseTimeToMinutes(time);
    const endTimeMinutes = startTimeMinutes + duration;
    const endTime = minutesToTimeString(endTimeMinutes);
    setSuggestedEndTime(endTime);

    // 獲取同一天的所有已確認預約 - 適配 V3 數據結構
    const sameDayBookings = bookingsList.filter(b => {
      // V3 數據：schedule.start 是完整的日期時間，需要提取日期部分
      let bookingDate;
      if (b.schedule?.start) {
        const startDate = new Date(b.schedule.start);
        bookingDate = startDate.toISOString().split('T')[0]; // 提取 YYYY-MM-DD
      } else if (b.schedule?.date) {
        bookingDate = b.schedule.date; // 兼容舊格式
      }
      
      return bookingDate === date && 
             b.status === "confirmed" &&
             b.schedule?.start;
    });

    let hasOverlap = false;
    let hasShortGap = false;
    let conflictMessage = '';

    for (const existingBooking of sameDayBookings) {
      if (!existingBooking.schedule?.duration) continue;
      
      const existingStartTime = new Date(existingBooking.schedule.start);
      const existingStartMinutes = existingStartTime.getHours() * 60 + existingStartTime.getMinutes();
      const existingEndMinutes = existingStartMinutes + parseInt(existingBooking.schedule.duration);

      // 檢查新預約是否與現有預約重疊
      if (startTimeMinutes < existingEndMinutes && endTimeMinutes > existingStartMinutes) {
        hasOverlap = true;
        const existingTime = new Date(existingBooking.schedule.start).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
        conflictMessage = `⚠️ 時間重疊：與「${existingBooking.customer_name}」的預約 (${existingTime}) 重疊`;
        break;
      }

      // 檢查間隔是否少於10分鐘
      const gapBefore = startTimeMinutes - existingEndMinutes;
      const gapAfter = existingStartMinutes - endTimeMinutes;

      if (gapBefore >= 0 && gapBefore < 10 * 60) {
        hasShortGap = true;
        const gapMinutes = Math.round(gapBefore / 60);
        conflictMessage = `⚠️ 間隔較短：與「${existingBooking.customer_name}」間隔 ${gapMinutes} 分鐘（建議至少 10 分鐘）`;
      }

      if (gapAfter >= 0 && gapAfter < 10 * 60) {
        hasShortGap = true;
        const gapMinutes = Math.round(gapAfter / 60);
        conflictMessage = `⚠️ 間隔較短：與「${existingBooking.customer_name}」間隔 ${gapMinutes} 分鐘（建議至少 10 分鐘）`;
      }
    }

    if (hasOverlap) {
      setTimeWarning({ type: 'overlap', message: conflictMessage });
    } else if (hasShortGap) {
      setTimeWarning({ type: 'short', message: conflictMessage });
    } else {
      setTimeWarning({ type: 'none' });
    }
  };

  // 監聽服務變化，自動計算預設時長
  useEffect(() => {
    if (newBooking.service && newBooking.time) {
      const duration = serviceDurationMap[newBooking.service] || 60;
      checkTimeConflict(newBooking.date, newBooking.time, duration);
    }
  }, [newBooking.service, newBooking.time, newBooking.date, bookingsList]);

  // 監聽時間變化，檢查衝突
  useEffect(() => {
    if (newBooking.date && newBooking.time && newBooking.service) {
      const duration = serviceDurationMap[newBooking.service] || 60;
      checkTimeConflict(newBooking.date, newBooking.time, duration);
    }
  }, [newBooking.date, newBooking.time, newBooking.service, bookingsList]);

  // 重置表單
  const resetNewBookingForm = () => {
    setNewBooking({
      name: "",
      phone: "",
      email: "",
      service: "",
      date: "",
      time: "",
      tags: [],
      source: "manual"
    });
    setCustomTagInput("");
    setTimeWarning({ type: 'none' });
    setSuggestedEndTime("");
  };

  // 處理新增預約提交
  const handleNewBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrorFields = new Set<string>();
    const missingFieldNames: string[] = [];
    
    if (!newBooking.name) {
      newErrorFields.add("name");
      missingFieldNames.push("客戶姓名");
    }
    if (!newBooking.phone) {
      newErrorFields.add("phone");
      missingFieldNames.push("聯絡電話");
    }
    if (!newBooking.service) {
      newErrorFields.add("service");
      missingFieldNames.push("預約項目");
    }
    if (!newBooking.date) {
      newErrorFields.add("date");
      missingFieldNames.push("日期");
    }
    if (!newBooking.time) {
      newErrorFields.add("time");
      missingFieldNames.push("時間");
    }
    
    if (newErrorFields.size > 0) {
      setErrorFields(newErrorFields);
      setErrorMessage({
        title: "哎呀，資訊還沒填完整呢！",
        description: `請幫我填寫${missingFieldNames.join("、")}，這樣我才能幫您新增預約喔～`
      });
      setShowErrorDialog(true);
      
      // 2秒後清除錯誤欄位狀態
      setTimeout(() => {
        setErrorFields(new Set());
      }, 2000);
      
      return;
    }

    // 檢查黑名單 - 優先檢查 V3 客戶資料，如果失敗則跳過
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const normalizedPhone = newBooking.phone.replace(/[^\d]/g, '');
        
        // 先嘗試從 V3 的 shop_bookings_v3 中查找客戶歷史記錄
        const { data: bookingHistory } = await supabase
          .from('shop_bookings_v3')
          .select('all_bookings')
          .eq('user_id', user.id)
          .maybeSingle();
        
        let customerName = newBooking.name;
        let noShowCount = 0;
        let isBlacklisted = false;
        
        if (bookingHistory?.all_bookings) {
          // 從預約歷史中查找該客戶的記錄
          const customerBookings = bookingHistory.all_bookings.filter((booking: any) => {
            const bookingPhone = booking.customer_phone?.replace(/[^\d]/g, '');
            return bookingPhone === normalizedPhone;
          });
          
          if (customerBookings.length > 0) {
            customerName = customerBookings[0].customer_name || newBooking.name;
            // 統計 no_show 次數
            noShowCount = customerBookings.filter((booking: any) => booking.status === 'no_show').length;
            // 如果超過 3 次 no_show，視為黑名單
            isBlacklisted = noShowCount >= 3;
          }
        }
        
        if (isBlacklisted) {
          console.log('⚠️ [Appointments] 檢測到黑名單客戶預約:', {
            customerName,
            phone: newBooking.phone,
            noShowCount
          });
          
          // 添加黑名單標籤到預約（不阻擋預約）
          const bookingWithBlacklistTag = {
            ...newBooking,
            tags: [...(newBooking.tags || []), '黑名單'],
            isBlacklisted: true,
            blacklistReason: `爽約 ${noShowCount} 次`
          };
          
          // 繼續預約流程，但記錄黑名單狀態
          console.log('📝 [Appointments] 黑名單客戶預約已添加標籤，繼續處理');
        }
      }
    } catch (error) {
      console.error('檢查黑名單失敗:', error);
      // 黑名單檢查失敗不應該阻擋預約，只記錄錯誤
    }
    
    const duration = serviceDurationMap[newBooking.service] || 60;
    
    const result = await createBooking({
      customerName: newBooking.name,
      phone: newBooking.phone,
      email: newBooking.email,
      service: newBooking.service,
      date: newBooking.date,
      time: newBooking.time,
      duration: duration,
      tags: newBooking.tags
    });
    
    if (result.success) {
      toast({
        title: "預約新增成功",
        description: "新預約已成功創建"
      });
      // 重新載入數據
      let data;
      if (filter === "history") {
        data = await fetchHistoryBookings();
      } else {
        data = await fetchBookingsByStatus(filter);
      }
      setBookingsList(data);
      // 更新待處理數量
      const pendingData = await fetchBookingsByStatus('pending');
      setPendingCount(pendingData.length);
      setShowNewBookingModal(false);
      resetNewBookingForm();
    } else {
      toast({
        title: "新增失敗",
        description: "無法創建預約，請稍後再試"
      });
    }
  };

  return (
    <>
      <style>{customScrollbarStyles}</style>
      <div className="min-h-screen bg-white">
      {/* 頂部作戰列 */}
      <div className="px-8 py-8 border-b border-[#F4F4F5]">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A] tracking-tight">預約管理</h1>
            <p className="text-[#9CA3AF] mt-1 text-base">高效處理所有客戶預約與確認狀態</p>
          </div>
          <button 
            onClick={() => {
              resetNewBookingForm();
              setShowNewBookingModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white rounded-xl hover:bg-black transition-colors h-12"
          >
            <Plus className="w-5 h-5" />
            <span className="text-base font-medium">手動新增預約</span>
          </button>
        </div>
      </div>

      {/* 狀態過濾區 */}
      <div className="px-8 py-6">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilter("pending")}
              className={`relative px-5 py-2.5 rounded-lg text-sm font-medium transition-all h-10 ${
                filter === "pending"
                  ? "bg-[#1A1A1A] text-white"
                  : "bg-[#F4F4F5] text-[#1A1A1A] hover:bg-[#E5E5E6]"
              }`}
            >
              待處理
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#EF4444] text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter("confirmed")}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all h-10 ${
                filter === "confirmed"
                  ? "bg-[#1A1A1A] text-white"
                  : "bg-[#F4F4F5] text-[#1A1A1A] hover:bg-[#E5E5E6]"
              }`}
            >
              已確認
            </button>
            <button
              onClick={() => setFilter("history")}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all h-10 ${
                filter === "history"
                  ? "bg-[#1A1A1A] text-white"
                  : "bg-[#F4F4F5] text-[#1A1A1A] hover:bg-[#E5E5E6]"
              }`}
            >
              歷史紀錄
            </button>
          </div>
          <div className="flex items-center gap-2 bg-[#F4F4F5] rounded-lg px-4 py-2.5 w-96">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋客戶姓名或手機號碼"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-0 outline-none text-sm w-full placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* 倒數計時：距離下一個項目 */}
      <div className="px-8 pt-2 pb-4">
        <div className="max-w-[1400px] mx-auto">
          <UniversalCountdown />
        </div>
      </div>

      {/* 主內容區 - 卡片化清單 */}
      <div className="px-8 pb-8">
        <div className="max-w-[1400px] mx-auto space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                <p className="text-sm text-gray-500">載入中...</p>
              </div>
            </div>
          ) : sortedBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 bg-[#F4F4F5] rounded-full flex items-center justify-center mb-4">
                <Clock className="w-12 h-12 text-[#1A1A1A]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">沒有找到預約</h3>
              <p className="text-slate-400 text-sm">
                {searchTerm ? "請試試其他關鍵字" : "目前沒有預約"}
              </p>
            </div>
          ) : sortedBookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">
                {searchTerm ? "請試試其他關鍵字" : "目前尚無預約"}
              </p>
            </div>
          ) : (
            sortedBookings.map((booking) => (
            <div
              key={booking.id}
              data-booking-id={booking.id}
              className={`p-5 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all ${
                highlightedBookingId === booking.id
                  ? "highlight-flash"
                  : ""
              }${
                // 🛠️ 預約名片強制標記 - 黑名單安檢邏輯
                blacklistSet.has(booking.customer_phone)
                  ? " border-2 border-red-500 bg-red-50/30"
                  : booking.customer_name === "店內任務"
                  ? "border-2 border-orange-300 bg-orange-50/50"
                  : booking.admin_meta?.source === 'AI_Chatbot'
                  ? "border-2 border-red-200"
                  : isInProgressBooking(booking)
                  ? "border-2 border-green-500 bg-green-50 ring-2 ring-green-200"
                  : isUrgentBooking(booking)
                  ? "border-2 border-red-500 bg-red-50"
                  : booking.status === "pending"
                  ? "border-l-4 border-l-[#EF4444] border-slate-100 rounded-r-xl"
                  : "border-slate-100"
              }`}
            >
              <div className="flex items-center justify-between">
                {/* 左側區域 */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F4F4F5] rounded-full flex items-center justify-center">
                    {booking.admin_meta?.source === 'AI_Chatbot' ? (
                      <Bot className="w-5 h-5 text-[#1A1A1A]" />
                    ) : (
                      <Phone className="w-5 h-5 text-[#1A1A1A]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-lg font-bold ${booking.customer_name === "店內任務" ? "text-orange-600" : "text-[#1A1A1A]"}`}>
                        {booking.customer_name}
                        {booking.customer_name === "店內任務" && (
                          <span className="ml-2 text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full font-medium">店內任務</span>
                        )}
                      </h3>
                      {/* 🛠️ 預約名片強制標記 - 黑名單標籤 */}
                      {blacklistSet.has(booking.customer_phone) && (
                        <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          🚫 黑名單
                        </span>
                      )}
                      {isInProgressBooking(booking) && (
                        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium animate-pulse">正在進行中</span>
                      )}
                      {booking.admin_meta?.source === 'AI_Chatbot' && (
                        <span className="text-xs text-red-500 font-medium">AI 自動預約</span>
                      )}
                    </div>
                    {booking.admin_meta?.tags && booking.admin_meta.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {/* 🛠️ 預約名片強制標記 - 黑名單標籤優先顯示 */}
                        {blacklistSet.has(booking.customer_phone) && !booking.admin_meta.tags.includes('黑名單') && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">
                            🚫 黑名單
                          </span>
                        )}
                        {booking.admin_meta.tags.map((tag: string, index: number) => (
                          <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-slate-400 mt-0.5 text-sm">{booking.customer_phone}</p>
                    {booking.admin_meta?.ai_notes && (
                      <p className="text-purple-600 mt-1 text-xs flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {booking.admin_meta.ai_notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* 中間區域 */}
                <div className="flex-1 px-8">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1A1A1A]" />
                    <p className="text-base font-semibold text-[#1A1A1A]">{booking.service_info?.name}</p>
                  </div>
                  <p className="text-slate-400 mt-0.5 text-sm">
                    {booking.schedule?.date} {new Date(booking.schedule?.start || '').toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                    {booking.schedule?.duration && (() => {
                      const startTime = new Date(booking.schedule?.start || '');
                      const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
                      const endMinutes = startMinutes + parseInt(booking.schedule?.duration || '0');
                      return ` - ${minutesToTimeString(endMinutes)}`;
                    })()}
                  </p>
                  {false && ( // V3 結構中沒有 hasConflict 欄位
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <X className="w-3 h-3" />
                      時段衝突警告
                    </p>
                  )}
                </div>

                {/* 右側動作區 */}
                <div className="flex items-center gap-3">
                  {booking.status === "pending" ? (
                    <>
                      <button 
                        onClick={() => handleConfirm(String(booking.id))}
                        className="w-10 h-10 bg-[#1A1A1A] text-white rounded-full hover:bg-black transition-all flex items-center justify-center"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleReject(String(booking.id))}
                        className="w-10 h-10 border-2 border-[#EF4444] text-[#EF4444] rounded-full hover:bg-[#EF4444] hover:text-white transition-all flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : booking.status === "confirmed" ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="w-4 h-4" />
                      <span className="text-xs font-medium">已確認</span>
                    </div>
                  ) : booking.status === "completed" ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="w-4 h-4" />
                      <span className="text-xs font-medium">已完成</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-slate-400">
                      <X className="w-4 h-4" />
                      <span className="text-xs font-medium">已取消</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 備註區域 */}
              {booking.admin_meta?.notes && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-sm text-slate-500">備註：{booking.admin_meta.notes}</p>
                </div>
              )}
            </div>
          )))}
        </div>
      </div>

      {/* 手動新增預約彈窗 */}
      {showNewBookingModal && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setShowNewBookingModal(false)}
        >
          <div 
            className="bg-white h-auto max-h-[90vh] w-[95%] max-w-[550px] rounded-3xl shadow-2xl my-8 p-8 flex flex-col border-0 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 標題區 */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">新增預約</h2>
                <p className="text-slate-400 text-sm mt-0.5">直接確認並同步至排程</p>
              </div>
            </div>

            {/* 可滾動內容區 */}
            <div className="flex-1 overflow-y-auto my-4 px-1 custom-scrollbar">
              <form onSubmit={handleNewBookingSubmit} className="space-y-5 py-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">客戶姓名 <span className="text-red-600 font-bold">*</span></label>
                  <input 
                    type="text" 
                    value={newBooking.name}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="請輸入姓名"
                    className={`w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-base focus:ring-2 focus:ring-black outline-none ${errorFields.has("name") ? "error-flash" : ""}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">聯絡電話 <span className="text-red-600 font-bold">*</span></label>
                  <input 
                    type="tel" 
                    value={newBooking.phone}
                    onChange={(e) => {
                      // 只允許輸入數字
                      const value = e.target.value.replace(/[^\d]/g, '');
                      setNewBooking(prev => ({ ...prev, phone: value }));
                    }}
                    placeholder="請輸入電話號碼"
                    className={`w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-base focus:ring-2 focus:ring-black outline-none ${errorFields.has("phone") ? "error-flash" : ""}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">電子信箱（選填）</label>
                  <input 
                    type="email" 
                    value={newBooking.email}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="請輸入電子信箱"
                    className="w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-base focus:ring-2 focus:ring-black outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">預約項目 <span className="text-red-600 font-bold">*</span></label>
                  <select
                    value={newBooking.service}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, service: e.target.value }))}
                    className={`w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-base focus:ring-2 focus:ring-black outline-none ${errorFields.has("service") ? "error-flash" : ""}`}
                    required
                  >
                    <option value="">請選擇項目</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.name}>
                        {service.name} ({service.duration}分鐘) - NT${service.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">日期 <span className="text-red-600 font-bold">*</span></label>
                  <input 
                    type="date" 
                    value={newBooking.date}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, date: e.target.value }))}
                    className={`w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-base focus:ring-2 focus:ring-black outline-none ${errorFields.has("date") ? "error-flash" : ""}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">時間 <span className="text-red-600 font-bold">*</span></label>
                  <div className={errorFields.has("time") ? "error-flash" : ""}>
                    <TimePicker 
                      value={newBooking.time}
                      onChange={(value) => setNewBooking(prev => ({ ...prev, time: value }))}
                    />
                  </div>
                </div>

                {/* 建議結束時間顯示 */}
                {suggestedEndTime && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 bg-gray-50 px-4 py-2.5 rounded-xl">
                    <Clock className="w-4 h-4" />
                    <span>建議結束時間：{suggestedEndTime}</span>
                  </div>
                )}

                {/* 衝突警告 */}
                {timeWarning.type !== 'none' && (
                  <div className={`flex items-start gap-3 p-4 rounded-xl ${
                    timeWarning.type === 'overlap' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
                  }`}>
                    <AlertCircle className={`w-5 h-5 mt-0.5 ${
                      timeWarning.type === 'overlap' ? 'text-red-500' : 'text-amber-500'
                    }`} />
                    <p className={`text-sm ${
                      timeWarning.type === 'overlap' ? 'text-red-700' : 'text-amber-700'
                    }`}>
                      {timeWarning.message}
                    </p>
                  </div>
                )}

                {/* 標籤式備註 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">顧客標籤（選填）</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[...commonTags, ...newBooking.tags.filter(t => !commonTags.includes(t))].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          newBooking.tags.includes(tag)
                            ? 'bg-[#1A1A1A] text-white'
                            : 'bg-[#F4F4F5] text-[#1A1A1A] hover:bg-[#E5E5E6]'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      placeholder="新增自定義標籤"
                      className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        addCustomTag();
                      }}
                      className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* 底部按鈕區 */}
            <div className="flex gap-3 pt-4">
              <button 
                type="button"
                onClick={() => setShowNewBookingModal(false)}
                className="flex-1 h-12 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                取消
              </button>
              <button 
                type="button"
                onClick={handleNewBookingSubmit}
                className={`flex-1 h-12 rounded-xl transition-colors font-medium ${
                  timeWarning.type === 'overlap'
                    ? 'bg-[#EF4444] text-white hover:bg-red-600'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {timeWarning.type === 'overlap' ? '強制新增' : '確認新增'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 錯誤警告彈窗 */}
      {showErrorDialog && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setShowErrorDialog(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{errorMessage.title}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">{errorMessage.description}</p>
            <button
              onClick={() => setShowErrorDialog(false)}
              className="w-full h-10 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
