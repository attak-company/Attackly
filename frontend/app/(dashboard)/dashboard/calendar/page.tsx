"use client";



import React, { useState, useEffect, useMemo, useRef, useTransition } from "react";

import { supabase, getTimeFromStart, autoUpdateExpiredBookings, migrateToV3 } from "@/lib/bookingService";

import { useToast } from "@/hooks/use-toast";

import dayjs from 'dayjs';

import utc from 'dayjs/plugin/utc';

import timezone from 'dayjs/plugin/timezone';



// 擴展 dayjs 插件

dayjs.extend(utc);

dayjs.extend(timezone);

dayjs.tz.setDefault('Asia/Taipei');



const errorFlashAnimation = `

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



  /* 隱藏滾動條但保留滾動功能 */

  .hide-scrollbar::-webkit-scrollbar {

    display: none;

  }



  .hide-scrollbar {

    -ms-overflow-style: none;

    scrollbar-width: none;

  }



  /* 自定義極簡滑桿 */

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

`;

import { ChevronDown, MapPin, Phone as PhoneIcon, Mail as MailIcon, Clock, Tag, X, User, Crown, Scissors, Eye, Palette, Calendar, Plus, AlertCircle, AlertTriangle, CalendarPlus, Check, PhoneCall, CreditCard, FileText, Edit, UserX, PlusCircle } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { TimePicker } from "@/components/ui/time-picker";



interface Appointment {

  id: string;

  category: 'booking' | 'activity';

  // V3 新的 JSONB 結構
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  date?: string;

  service_info?: {
    name: string;
    price: number;
    category: string;
    service_type: string;
  };

  schedule?: {
    start: string;
    end: string;
    date: string;
    duration: string;
  };

  status?: string;

  // 保持相容的舊欄位（用於向後相容）
  customerName?: string;
  service?: string;
  serviceType?: "nail" | "eyelash" | "hair" | "other";
  serviceAbbr?: string;
  time?: string;
  remainingTime?: string;
  phone?: string;
  email?: string;
  tags?: string[];
  aiNotes?: string;

  history: {

    date: string;

    service: string;

    status: string;

  }[];

  isActive?: boolean;

  isFinished?: boolean;

  start_time?: string; // UTC 時間字串

  end_time?: string; // UTC 時間字串

  calculatedDuration?: number; // 自動計算的時長（分鐘）

  staffId?: string; // 新增員工 ID

}

// V3 資料結構輔助函數 - 根據實際結構重寫
const getCustomerName = (appointment: Appointment): string => {
  return appointment.customer_name || appointment.service_info?.name || '無名稱';
};

const getService = (appointment: Appointment): string => {
  return appointment.service_info?.name || '未指定服務';
};

const getServicePrice = (appointment: Appointment): number => {
  return appointment.service_info?.price || 0;
};

const getDuration = (appointment: Appointment): number => {
  return parseInt(appointment.schedule?.duration) || 60;
};

const getEndTime = (appointment: Appointment): string => {
  return appointment.schedule?.end || '';
};

// V3 結構的時間提取函數
const getTimeFromSchedule = (appointment: any): string => {
  // 🔧 強化防呆：優先讀取 schedule.start (ISO 字串)
  if (appointment.schedule?.start) {
    try {
      const timeStr = dayjs(appointment.schedule.start).tz('Asia/Taipei').format('HH:mm');
      return timeStr;
    } catch (error) {
      console.warn('🕐 [Calendar] schedule.start 解析失敗:', error);
    }
  }
  
  // 🔧 次選：讀取 start_time 欄位
  if (appointment.start_time) {
    try {
      // 嘗試用 dayjs 解析 start_time
      const timeStr = dayjs(appointment.start_time).tz('Asia/Taipei').format('HH:mm');
      return timeStr;
    } catch (error) {
      console.warn('🕐 [Calendar] start_time dayjs 解析失敗，嘗試字串截取:', error);
      // fallback: 字串截取
      const timeStr = appointment.start_time.split(' ')[1];
      const result = timeStr ? timeStr.substring(0, 5) : '00:00';
      return result;
    }
  }
  
  // 🔧 最後防備：記錄完整資料結構並返回 00:00
  console.error('🚨 [Calendar] 時間解析完全失敗，完整資料結構:', {
    id: appointment.id,
    customer_name: appointment.customer_name,
    source: appointment.admin_meta?.source,
    hasSchedule: !!appointment.schedule,
    scheduleStart: appointment.schedule?.start,
    scheduleEnd: appointment.schedule?.end,
    hasStartTime: !!appointment.start_time,
    startTime: appointment.start_time,
    date: appointment.date,
    scheduleDate: appointment.schedule?.date
  });
  
  return '00:00';
};

const getAINotes = (appointment: Appointment): string => {
  return (appointment as any).ai_notes || '';
};

const getStatus = (appointment: Appointment): string => {
  return appointment.status || 'confirmed';
};

const getPhone = (appointment: Appointment): string => {
  return appointment.customer_phone || appointment.phone || '無電話';
};

const getEmail = (appointment: Appointment): string => {
  return appointment.customer_email || appointment.email || '無信箱';
};

const getTags = (appointment: Appointment): string[] => {
  return appointment.tags || [];
};

const getDate = (appointment: Appointment): string => {
  return appointment.schedule?.date || '';
};

// 電話號碼標準化函數（處理 0912-345-678 vs 0912345678）

const normalizePhoneNumber = (phone: string): string => {

  if (!phone) return '';

  

  // 移除所有非數字字符

  const cleanPhone = phone.replace(/[^\d]/g, '');

  

  // 台灣手機號碼格式驗證

  if (cleanPhone.length === 10 && cleanPhone.startsWith('09')) {

    return cleanPhone; // 標準 10 位手機號碼

  }

  

  // 國碼格式處理

  if (cleanPhone.length === 12 && cleanPhone.startsWith('8869')) {

    return '0' + cleanPhone.substring(3); // 886912345678 -> 0912345678

  }

  

  // 其他格式，直接返回清理後的號碼

  return cleanPhone;

};



// 電話號碼格式驗證函數

const validatePhoneNumber = (phone: string): { isValid: boolean; message: string } => {

  if (!phone) {

    return { isValid: false, message: '電話號碼為必填項目' };

  }

  

  const cleanPhone = phone.replace(/[^\d]/g, '');

  

  // 台灣手機號碼驗證

  if (cleanPhone.length === 10 && cleanPhone.startsWith('09')) {

    return { isValid: true, message: '' };

  }

  

  // 國碼格式驗證

  if (cleanPhone.length === 12 && cleanPhone.startsWith('8869')) {

    return { isValid: true, message: '' };

  }

  

  // 9 位號碼（可能是舊格式）

  if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {

    return { isValid: true, message: '建議使用 10 位號碼格式 (09xxxxxxxx)' };

  }

  

  return { isValid: false, message: '請輸入有效的台灣手機號碼 (09xxxxxxxx 或 +886-9-xxxxxxxx)' };

};



// CRM 輔助函數：根據電話號碼查找或創建顧客

const getOrCreateCustomer = async (supabase: any, phone: string, customerName: string, email: string, tags: string[]) => {

  try {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;



    const normalizedPhone = normalizePhoneNumber(phone);

    if (!normalizedPhone) return null;



    // 嘗試查找現有顧客 - 使用 shop_customers_v3 表

    console.log('[getOrCreateCustomer] 查找客戶 - user_id:', user.id, 'phone:', normalizedPhone);

    const { data: customerData } = await supabase
      .from('shop_customers_v3')
      .select('all_customers')
      .eq('user_id', user.id)
      .maybeSingle();

    const allCustomers = customerData?.all_customers || [];
    const existingCustomer = allCustomers.find((c: any) => {
      const customerPhone = c.phone?.replace(/[^\d]/g, '') || '';
      return customerPhone === normalizedPhone;
    });

    console.log('[getOrCreateCustomer] 查找結果:', existingCustomer ? '找到現有客戶 ID: ' + existingCustomer.id : '未找到現有客戶');



    if (existingCustomer) {

      // 顧客已存在，直接返回現有資料（保留 is_blacklisted 等欄位）

      return existingCustomer;

    } else {

      // 顧客不存在，創建新客戶（使用 shop_customers_v3 的 all_customers JSONB 結構）

      console.log('[getOrCreateCustomer] 創建新客戶 - name:', customerName, 'phone:', normalizedPhone);

      const newCustomer = {
        id: crypto.randomUUID(),
        name: customerName,
        phone: normalizedPhone,
        email: email || '',
        stats: {
          total_bookings: 0,
          total_spending: 0,
          no_show_count: 0,
          last_purchase_at: ''
        },
        status: {
          is_blacklisted: false,
          blacklist_reason: null
        },
        tags: tags || [],
        manual_notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 新增到 all_customers 陣列
      const updatedCustomers = [...allCustomers, newCustomer];

      await supabase
        .from('shop_customers_v3')
        .update({ all_customers: updatedCustomers })
        .eq('user_id', user.id);



      return newCustomer;

    }

  } catch (error: any) {

    console.error('Error in getOrCreateCustomer:', error);

    return null;

  }

};



// CRM 輔助函數：標記顧客為黑名單

const markCustomerAsBlacklisted = async (supabase: any, phone: string, reason: string = 'no_show') => {

  try {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;



    const normalizedPhone = normalizePhoneNumber(phone);

    if (!normalizedPhone) return false;



    // 查找顧客 - 使用 shop_customers_v3 表

    const { data: customerData } = await supabase
      .from('shop_customers_v3')
      .select('all_customers')
      .eq('user_id', user.id)
      .maybeSingle();

    const allCustomers = customerData?.all_customers || [];
    const customerIndex = allCustomers.findIndex((c: any) => {
      const customerPhone = c.phone?.replace(/[^\d]/g, '') || '';
      return customerPhone === normalizedPhone;
    });

    if (customerIndex !== -1) {
      // 更新顧客黑名單狀態
      const customer = allCustomers[customerIndex];
      const currentTags = customer.tags || [];
      const mergedTags = Array.from(new Set([...currentTags, '黑名單']));

      // 使用 shop_customers_v3 的 all_customers JSONB 結構
      const updatedCustomers = allCustomers.map((c: any, index: number) => {
        if (index === customerIndex) {
          return {
            ...c,
            stats: {
              ...c.stats,
              no_show_count: (c.stats?.no_show_count || 0) + 1
            },
            status: {
              is_blacklisted: true,
              blacklist_reason: reason
            },
            tags: mergedTags,
            updated_at: new Date().toISOString()
          };
        }
        return c;
      });

      await supabase
        .from('shop_customers_v3')
        .update({ all_customers: updatedCustomers })
        .eq('user_id', user.id);

      return true;
    }



    return false;

  } catch (error: any) {

    console.error('Error in markCustomerAsBlacklisted:', error);

    return false;

  }

};



// CRM 輔助函數：根據電話號碼獲取顧客資料

const getCustomerByPhone = async (supabase: any, phone: string) => {

  try {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;



    const normalizedPhone = normalizePhoneNumber(phone);

    if (!normalizedPhone) return null;



    const { data: customerData } = await supabase
      .from('shop_customers_v3')
      .select('all_customers')
      .eq('user_id', user.id)
      .maybeSingle();

    const allCustomers = customerData?.all_customers || [];
    const customer = allCustomers.find((c: any) => {
      const customerPhone = c.phone?.replace(/[^\d]/g, '') || '';
      return customerPhone === normalizedPhone;
    });



    return customer;

  } catch (error: any) {

    console.error('Error in getCustomerByPhone:', error);

    return null;

  }

};



// Supabase 查詢函數

const fetchBookingsFromSupabase = async (supabase: any, toast: any) => {

  try {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];



    console.log('[Calendar] 當前登入 user_id:', user.id);

    // 先執行 V3 資料遷移（如果需要）
    try {
      await migrateToV3();
    } catch (migrationError) {
      console.error('[Calendar] 遷移失敗，但繼續嘗試抓取現有資料:', migrationError);
    }

    // 從 shop_bookings_v3 讀取 all_bookings JSONB 欄位
    const { data, error } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    console.log('[Calendar] 從 Supabase 抓取到的原始預約數量:', data?.all_bookings?.length || 0);
    
    // 詳細調試：檢查第一筆 V3 資料的完整結構
    if (data?.all_bookings && data.all_bookings.length > 0) {
      console.log('[V3_INSPECTION]', JSON.parse(JSON.stringify(data.all_bookings[0])));
    }

    // 前端過濾：使用 V3 status 欄位，只排除已取消的預約
    let filteredData = (data?.all_bookings || []).filter((booking: any) => {
      // V3 結構：直接使用 status 欄位
      const status = booking.status;
      
      // 詳細除錯日誌：只記錄被取消的資料
      if (status === 'cancelled') {
        console.log('[Calendar] 排除已取消預約 ID:', booking.id, 'status:', status);
        return false;
      }
      
      // 其他所有狀態（包括 completed, no_show, confirmed）都先保留
      console.log('[Calendar] 保留預約 ID:', booking.id, 'status:', status);
      return true;
    });

    // 🔧 黑名單檢查：批量檢查並添加黑名單標籤（不隱藏）
    try {
      const { batchCheckBlacklist } = await import('@/lib/customerSyncService');

      // 提取所有客戶手機號碼
      const customerPhones = filteredData.map((booking: any) => booking.customer_phone);
      
      // 批量檢查黑名單狀態
      const blacklistResults = await batchCheckBlacklist(customerPhones);

      // 為黑名單客戶添加標籤（不隱藏）
      filteredData = filteredData.map((booking: any) => {
        const blacklistCheck = blacklistResults.get(booking.customer_phone);
        const isBlacklisted = blacklistCheck?.isBlacklisted || false;
        
        if (isBlacklisted) {
          console.log('🚫 [Calendar] 檢測到黑名單客戶預約:', {
            id: booking.id,
            phone: booking.customer_phone,
            reason: blacklistCheck?.reason
          });
          
          // 添加黑名單標籤到預約
          const currentTags = booking.tags || [];
          const updatedTags = currentTags.includes('黑名單') 
            ? currentTags 
            : [...currentTags, '黑名單'];
          
          return {
            ...booking,
            tags: updatedTags,
            isBlacklisted: true,
            blacklistReason: blacklistCheck?.reason
          };
        }
        
        return booking;
      });
    } catch (blacklistError) {
      console.warn('⚠️ [Calendar] 黑名單檢查失敗，保留原始預約:', blacklistError);
    }

    console.log('[Calendar] 前端過濾後的預約數量:', filteredData.length);



    // 修正資料格式：確保 tags 永遠是陣列，正確映射 V2 結構欄位

    const cleanedData = filteredData.map((booking: any) => {

      // V3 結構：從嵌套欄位提取資料
      const schedule = booking.schedule || {};
      const serviceContent = booking.service_info || {};
      const adminMeta = booking.admin_meta || {};

      // 🔧 修復 AI 預約資料結構
      let isAIBooking = false;
      if (adminMeta.source === 'AI_Chatbot' || 
          (booking.customer_name === '黃小姐' && schedule.date === '2026-05-08')) {
        isAIBooking = true;
        // 強制修正 AI 預約的 source
        adminMeta.source = 'AI_Chatbot';
        
        // 確保 AI 預約有正確的時間欄位
        if (!booking.start_time && schedule.start) {
          booking.start_time = dayjs(schedule.start).tz('Asia/Taipei').format('YYYY-MM-DD HH:mm:ss');
        }
        if (!booking.end_time && schedule.end) {
          booking.end_time = dayjs(schedule.end).tz('Asia/Taipei').format('YYYY-MM-DD HH:mm:ss');
        }
        
        // 確保有 date 欄位（從 schedule.date 複製）
        if (!booking.date && schedule.date) {
          booking.date = schedule.date;
        }
        
        console.log('🔧 [AI FIX] 修復 AI 預約資料結構:', {
          customer_name: booking.customer_name,
          date: booking.date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          source: adminMeta.source
        });
      }

      let startTime = schedule.start;
      let endTime = schedule.end;
      let calculatedDuration = parseInt(schedule.duration || '0');

      // V3 資料結構：使用 schedule 欄位
      if (!startTime && schedule.date && booking.time) {
        const startDateTime = new Date(`${schedule.date}T${booking.time}`);
        startTime = startDateTime.toISOString();

        if (calculatedDuration > 0) {
          const endDateTime = new Date(startDateTime.getTime() + calculatedDuration * 60000);
          endTime = endDateTime.toISOString();
        }
      }

      // 計算時長（分鐘）- 使用 UTC 時間戳計算，避免時區影響
      if (startTime && endTime) {
        try {
          const start = new Date(startTime);
          const end = new Date(endTime);
          // 直接使用 UTC 時間戳計算時長，不受時區影響
          calculatedDuration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
          // 確保時長為正數

          if (calculatedDuration < 0) {

            calculatedDuration = booking.duration || 0;

          }

        } catch (e) {

          calculatedDuration = booking.duration || 0;

        }

      }



      return {

        ...booking,

        start_time: startTime, // 使用合成或原本的 start_time

        end_time: endTime, // 使用合成或原本的 end_time

        customerName: booking.customer_name || '店內任務', // V3 結構：直接從 customer_name 取名稱

        calculatedDuration, // 自動計算的時長（分鐘）

        tags: [
          ...(booking.customer_detail?.tags || []), 
          ...(booking.tags || []),
          // 🚨 降魔咒：排程渲染過濾 - 黑名單安檢邏輯
          ...(booking.admin_meta?.tags?.includes('黑名單') ? ['黑名單'] : [])
        ], // 合併所有標籤，強制包含黑名單標籤

        aiNotes: getAINotes(booking), // 使用 V2 相容函數

        service: serviceContent.name || booking.service || '未指定服務', // V3 結構：從 service_info 取 name

        phone: booking.customer_phone || '', // V3 結構：直接從根目錄取 customer_phone

        email: booking.customer_email || '', // V3 結構：直接從根目錄取 customer_email

        date: schedule.date || booking.date, // V3 結構：從 schedule 取 date

        duration: schedule.duration || '60', // V3 結構：直接使用 schedule.duration

        status: adminMeta.status || booking.status || 'confirmed', // V2 結構：從 admin_meta 取 status

        source: adminMeta.source || booking.source || 'manual', // V2 結構：從 admin_meta 取 source

        category: serviceContent.category || booking.category || 'booking', // V2 結構：從 service_content 取 category

        price: serviceContent.price || 0, // V2 結構：從 service_content 取 price

        // 確保 V2 結構欄位可用於 getXXX 函數
        customer_detail: booking.customer_detail,
        service_content: booking.service_content,
        schedule_config: booking.schedule_config,
        admin_meta: booking.admin_meta

      };

    });



    return cleanedData;

  } catch (error: any) {

    toast({

      title: "載入預約失敗",

      description: error?.message || "無法從資料庫載入預約資料"

    });

    return [];

  }

};



const saveBookingToSupabase = async (supabase: any, appointment: Appointment) => {

  try {

    // 使用統一的 saveBooking 函數，確保 source 和時間欄位正確

    const { saveBooking } = await import('@/lib/bookingService');



    // 強制型別轉換：確保 duration 為有效數字

    const duration = appointment.remainingTime ? parseInt(String(appointment.remainingTime).replace(/\D/g, ''), 10) || 60 : 60;

    const isActivity = appointment.service_info?.category === 'activity';



    // 驗證必要欄位

    if (!duration || duration <= 0) {

      throw new Error('服務時長設定無效，請重新選擇');

    }



    if (!isActivity && (!appointment.customerName || !appointment.phone)) {

      throw new Error('顧客姓名和電話為必填項目');

    }



    const result = await saveBooking({

      customerName: appointment.customerName,

      phone: appointment.phone || '',

      email: isActivity ? '' : (appointment.email || ''),

      service: appointment.service_info?.name || '未指定服務',

      date: appointment.date,

      time: getTimeFromSchedule(appointment) || '00:00',

      duration: duration,

      tags: isActivity ? undefined : (appointment.tags || []),

      source: 'manual', // 明確設為 manual

      ai_notes: appointment.aiNotes || '',

      note: '',

      category: appointment.service_info?.category || 'booking'

    });



    if (!result.success) {

      console.error('🔍 [saveBookingToSupabase] saveBooking 失敗詳情:', result);

      const errorMsg = result.error?.message || '儲存預約失敗';
      throw new Error(errorMsg);

    }

    // 調試：檢查 result 物件內容
    console.log('🔍 [saveBookingToSupabase] result 物件:', result);
    console.log('🔍 [saveBookingToSupabase] result.warnings:', result.warnings);
    
    // 檢查是否有時間衝突警告
    if (result.warnings?.timeConflict) {
      console.log('🔍 [saveBookingToSupabase] 進入時間衝突警告邏輯');
      const conflict = result.warnings.conflicts[0];
      const conflictTime = `${conflict.time} (${conflict.duration}分)`;
      const conflictService = conflict.service || '未指定服務';
      const conflictCustomer = conflict.customer_name || '未知客戶';
      
      const warningMessage = `⚠️ 時間衝突提醒：${conflictTime} 已有 ${conflictCustomer} 的 ${conflictService} 預約，但已成功建立`;
      console.warn('⚠️ [saveBookingToSupabase] 時間衝突警告:', warningMessage);
      
      // 顯示警告 Toast，但不阻擋流程
      toast({
        title: "⚠️ 時間衝突提醒",
        description: `此時段已有其他預約，但已成功建立`,
        variant: "default"
      });
    } else {
      console.log('🔍 [saveBookingToSupabase] 沒有時間衝突警告');
    }



    return true;

  } catch (error: any) {

    // 全域 API 錯誤捕捉與處理

    const errorMessage = error?.message || '儲存預約時發生未知錯誤';

    

    // 根據錯誤類型提供具體提示

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {

      throw new Error('網路連線異常，請檢查網路狀態後重試');

    } else if (errorMessage.includes('constraint') || errorMessage.includes('duplicate')) {

      throw new Error('預約時間衝突，請選擇其他時間');

    } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {

      throw new Error('權限不足，請重新登入後重試');

    }

    

    console.error('詳細錯誤內容:', error);

    console.error('錯誤訊息:', errorMessage);

    throw error; // 重新拋出讓上層處理

  }

};



const updateBookingToSupabase = async (supabase: any, appointment: Appointment) => {

  try {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {

      throw new Error('用戶未登入，無法更新預約');

    }



    // 強制型別轉換：確保 duration 為有效數字

    const duration = appointment.remainingTime ? parseInt(String(appointment.remainingTime).replace(/\D/g, ''), 10) : 60;

    

    if (!duration || duration <= 0) {

      throw new Error('服務時長設定無效，請重新選擇');

    }



    // 計算結束時間
    const startTime = dayjs.tz(`${appointment.date}T${getTimeFromSchedule(appointment) || '00:00'}`, 'Asia/Taipei');
    const endTime = startTime.add(duration, 'minute');
    const endTimeStr = endTime.format();

    // 先讀取現有資料，避免覆蓋
    const { data: existingBooking } = await supabase
      .from('shop_bookings_v3')
      .select('schedule, service_info, admin_meta')
      .eq('id', appointment.id)
      .single();

    const currentSchedule = existingBooking?.schedule || {};
    const currentServiceInfo = existingBooking?.service_info || {};
    const currentAdminMeta = existingBooking?.admin_meta || {};

    const bookingData = {
      category: appointment.service_info?.category || 'booking',
      
      // V3 結構 - 使用 schedule 欄位
      schedule: {
        ...currentSchedule,
        date: appointment.date,
        start: startTime.format(),
        end: endTimeStr,
        duration: duration.toString()
      },
      service_info: {
        ...currentServiceInfo,
        name: appointment.service_info?.name || '未指定服務',
        price: getServicePrice(appointment),
        category: appointment.service_info?.category || 'booking'
      },
      admin_meta: {
        ...currentAdminMeta,
        status: getStatus(appointment),
        source: currentAdminMeta.source || 'web_dashboard',
        ai_notes: getAINotes(appointment),
        is_active: true,
        is_finished: false
      }
    };



    const { error } = await supabase

      .from('shop_bookings_v3')

      .update(bookingData)

      .eq('id', appointment.id)

      .eq('user_id', user.id);



    if (error) {

      const errorMessage = error.message || '更新預約失敗';

      

      // 根據錯誤類型提供具體提示

      if (errorMessage.includes('constraint') || errorMessage.includes('duplicate')) {

        throw new Error('預約時間衝突，請選擇其他時間');

      } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {

        throw new Error('權限不足，請重新登入後重試');

      }

      

      throw new Error(errorMessage);

    }



    return true;

  } catch (error: any) {

    const errorMessage = error?.message || '更新預約時發生未知錯誤';

    

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {

      throw new Error('網路連線異常，請檢查網路狀態後重試');

    }

    

    console.error('Error updating booking:', error);

    throw error; // 重新拋出讓上層處理

  }

};



const deleteBookingFromSupabase = async (supabase: any, appointmentId: string) => {

  try {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {

      throw new Error('用戶未登入，無法刪除預約');

    }

    const { error } = await supabase

      .from('shop_bookings_v3')

      .update({

        status: 'cancelled',

        admin_meta: {
          status: 'cancelled',
          source: 'web_dashboard',
          ai_notes: ''
        }

      })

      .eq('id', appointmentId)

      .eq('user_id', user.id);



    if (error) {

      return false;

    }



    return true;

  } catch (error: any) {

    console.error('Error deleting booking:', error);

    return false;

  }

};



const fetchDeletedBookingsFromSupabase = async (supabase: any, toast: any) => {

  try {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];



    // 從 shop_bookings_v3 讀取 all_bookings 並過濾已取消的預約
    const { data, error } = await supabase

      .from('shop_bookings_v3')

      .select('all_bookings')

      .eq('user_id', user.id)

      .maybeSingle();



    if (error) {

      return [];

    }



    if (!data?.all_bookings) return [];

    // 過濾已取消的預約（V3 中 status = 'cancelled'）
    const deletedBookings = data.all_bookings.filter((booking: any) => 
      booking.status === 'cancelled'
    ).slice(0, 5); // 限制 5 筆

    return deletedBookings.map((booking: any) => {
      console.log('[Calendar] 除錯 - V3 booking 資料原型:', booking);
      console.log('[Calendar] 除錯 - customer_name:', booking.customer_name);

      return {
        id: booking.id,
        category: booking.service_info?.category || 'booking', // V3 結構：從 service_info 取類別
        customerName: booking.customer_name || '店內任務', // V3 結構：直接從 customer_name 取名稱
        customer_name: booking.customer_name || '店內任務', // V3 欄位
        service: booking.service_info?.name || '未指定服務',
        serviceType: booking.service_info?.service_type,
        serviceAbbr: booking.service_info?.service_abbr,
        date: booking.schedule?.date || booking.date,
        time: getTimeFromSchedule(booking),
        remainingTime: booking.schedule?.duration || '60', // 使用 V3 結構
        phone: booking.customer_phone || booking.phone,
        email: booking.customer_email || booking.email,
        tags: booking.admin_meta?.tags || [],
        aiNotes: booking.admin_meta?.ai_notes || '',
        isActive: booking.admin_meta?.is_active,
        isFinished: booking.admin_meta?.is_finished,
        schedule: booking.schedule, // V3 結構
        customer_phone: booking.customer_phone,
        customer_email: booking.customer_email,
        history: []
      };
    });
  } catch (error: any) {
    toast({
      title: "載入已刪除預約失敗",
      description: error?.message || "無法從資料庫載入已刪除的預約資料"
    });
    return [];
  }
};



const fetchCustomerHistoryFromSupabase = async (supabase: any, phone: string) => {

  try {

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];



    const normalizedPhone = normalizePhoneNumber(phone);

    if (!normalizedPhone) return [];



    // 從 shop_bookings_v3 讀取 all_bookings 並過濾電話和狀態
    const { data, error } = await supabase

      .from('shop_bookings_v3')

      .select('all_bookings')

      .eq('user_id', user.id)

      .maybeSingle();



    if (error) {

      return [];

    }



    if (!data?.all_bookings) return [];

    // 過濾電話和已完成狀態的預約（V3 結構）
    const filteredBookings = data.all_bookings.filter((booking: any) => {
      const bookingPhone = normalizePhoneNumber(booking.customer_phone || booking.phone);
      return bookingPhone === normalizedPhone && booking.status === 'completed';
    }).slice(0, 10); // 限制 10 筆

    return filteredBookings.map((booking: any) => ({

      service: booking.service_info?.name || '未指定服務',

      date: booking.schedule?.date || booking.date,

      time: getTimeFromSchedule(booking),

      duration: booking.schedule?.duration || '60' // 使用 V3 結構

    }));

  } catch (error: any) {

    console.error('Error fetching customer history:', error);

    return [];

  }

};



export default function CalendarPage() {

  const { toast } = useToast();

  const [isPending, startTransition] = useTransition();

  const [currentDate, setCurrentDate] = useState(() => new Date());

  const [currentTime, setCurrentTime] = useState(() => new Date());

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blacklistSet, setBlacklistSet] = useState<Set<string>>(new Set()); // 🛠️ 全域黑名單索引

  // 🛠️ 建立全域黑名單索引 - 從 shop_customers_v3 抓取所有黑名單手機號碼
  const fetchBlacklistSet = async () => {
    try {
      console.log('🔍 [Calendar Blacklist Index] 正在建立全域黑名單索引...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 🔧 V3 資料路徑：從 all_customers JSON 裡的 status.is_blacklisted 判斷
      const { data: customerData, error: customersError } = await supabase
        .from('shop_customers_v3')
        .select('all_customers')
        .eq('user_id', user.id)
        .maybeSingle();

      if (customersError) {
        console.error('❌ [Calendar Blacklist Index] 查詢黑名單失敗:', customersError);
        return;
      }

      // 🛠️ 檢查 V3 資料路徑：從 all_customers JSON 的 status.is_blacklisted 判斷
      const blacklistedPhones = customerData?.all_customers?.filter((customer: any) => {
        // 檢查三個地方的黑名單狀態
        const isBlacklisted = customer.is_blacklisted || 
                              customer.status?.is_blacklisted || 
                              customer.tags?.includes('黑名單');
        
        if (isBlacklisted) {
          console.log('📋 [Calendar Blacklist Index] 發現黑名單客戶:', {
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
      
      console.log('✅ [Calendar Blacklist Index] 全域黑名單索引建立完成:', {
        totalBlacklisted: newBlacklistSet.size,
        blacklistedPhones: Array.from(newBlacklistSet)
      });
    } catch (error) {
      console.error('❌ [Calendar Blacklist Index] 建立索引失敗:', error);
    }
  };

  const [isClient, setIsClient] = useState(false);



  // 最穩定的倒數計時組件 - 使用基礎 React hooks

  const CountdownBar = ({ appointments }: { appointments: Appointment[] }) => {

    const [displayText, setDisplayText] = useState<React.ReactNode>("");



    useEffect(() => {

      // 建立一個每秒執行的計時器

      const timer = setInterval(() => {

        const now = dayjs().tz('Asia/Taipei');

        

        // 1. 抓取下一個還沒開始的項目 (包含預約跟店內活動)

        const nextEvent = appointments

          .filter(app => {

            if (!app.start_time) return false;

            return dayjs(app.start_time).tz('Asia/Taipei').isAfter(now);

          })

          .sort((a, b) => dayjs(a.start_time).tz('Asia/Taipei').diff(dayjs(b.start_time).tz('Asia/Taipei')))[0];



        if (!nextEvent) {

          setDisplayText(""); // 沒項目就不顯示

          return;

        }



        const diffMs = dayjs(nextEvent.start_time).tz('Asia/Taipei').diff(now);

        const totalSeconds = Math.floor(diffMs / 1000);

        

        // 2. 格式化顯示邏輯

        const hours = Math.floor(totalSeconds / 3600);

        const minutes = Math.floor((totalSeconds % 3600) / 60);

        const seconds = totalSeconds % 60;



        const typeName = nextEvent.category === 'booking' ? '預約' : '店內活動';

        

        // 3. 組合文字與顏色邏輯 (這裡直接回傳 JSX)

        const timeUI = hours >= 1 ? (

          <>還剩下 <span className="text-emerald-500 font-bold">{hours}</span> 小時又 <span className="text-emerald-500 font-bold">{minutes}</span> 分鐘</>

        ) : (

          <>還剩下 <span className="text-emerald-500 font-bold">{minutes}</span> 分鐘 <span className="text-emerald-500 font-bold">{seconds}</span> 秒鐘</>

        );



        setDisplayText(

          <span className="text-black">

            距離下一個 {typeName}：{timeUI}

          </span>

        );

      }, 1000);



      return () => clearInterval(timer); // 卸載時清理，防止內存洩漏

    }, [appointments]);



    if (!displayText) return null;



    return (

      <div className="sticky top-0 z-[100] w-full bg-white/90 backdrop-blur-md border-b border-zinc-100 py-3 shadow-sm text-center">

        <p className="text-sm">{displayText}</p>

      </div>

    );

  };



  // 格式化時間差顯示（超過60分鐘顯示小時，少於60分鐘顯示分鐘）

  const formatTimeUntilAppointment = (diffMs: number): string => {

    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    

    if (diffMinutes >= 60) {

      const hours = Math.floor(diffMinutes / 60);

      const remainingMinutes = diffMinutes % 60;

      

      if (remainingMinutes === 0) {

        return `${hours}小時`;

      } else {

        return `${hours}小時${remainingMinutes}分`;

      }

    } else {

      return `${diffMinutes}分鐘`;

    }

  };



  // 掛載檢查：防止伺服器與客戶端 DOM 不一致

  useEffect(() => {

    setIsClient(true);

  }, []);

  // 🔔 監聽黑名單更新事件
  useEffect(() => {
    const handleBlacklistUpdate = (event: CustomEvent) => {
      console.log('🔔 [Calendar] 收到黑名單更新通知:', event.detail);
      
      // 🚨 降魔咒：實時監聽優化 - 強制重新載入並顯示最新狀態
      console.log('🔄 [Calendar] 立即重新載入預約數據以反映黑名單變更...');
      
      // 重新載入預約數據以反映黑名單變更
      fetchBookingsFromSupabase();
      // 🛠️ 同時更新黑名單索引
      fetchBlacklistSet();
      
      // 顯示成功通知
      toast({
        title: "黑名單狀態已更新",
        description: "排程頁面已同步更新",
        duration: 3000
      });
    };

    window.addEventListener('blacklistUpdated', handleBlacklistUpdate as EventListener);
    
    console.log('👂 [Calendar] 黑名單監聽器已啟動');
    
    return () => {
      window.removeEventListener('blacklistUpdated', handleBlacklistUpdate as EventListener);
      console.log('🔇 [Calendar] 黑名單監聽器已移除');
    };
  }, []);



  // 新增預約彈窗的 ref（非受控組件）

  const customerNameRef = useRef<HTMLInputElement>(null);

  const customerInfoRef = useRef<HTMLInputElement>(null);

  const serviceRef = useRef<HTMLInputElement>(null);

  const timeRef = useRef<HTMLInputElement>(null);

  const durationRef = useRef<HTMLInputElement>(null);



  
  // V3 結構的結束時間提取函數
  const getTimeFromScheduleEnd = (appointment: any): string => {
    if (appointment.schedule?.end) {
      // 直接使用字串截取，避免時區轉換
      const timeStr = appointment.schedule.end.split(' ')[1];
      return timeStr ? timeStr.substring(0, 5) : '00:00';
    }
    // 後備方案：直接處理舊的 end_time 欄位
    if (appointment.end_time) {
      const timeStr = appointment.end_time.split(' ')[1];
      return timeStr ? timeStr.substring(0, 5) : '00:00';
    }
    return '00:00';
  };

  // 將 remainingTime 轉換為分鐘

  const parseRemainingTime = (timeStr: string): number => {

    if (!timeStr) return 0;

    const match = timeStr.match(/(\d+)/);

    return match ? parseInt(match[1]) : 0;

  };



  // 輔助函式：檢查訂單是否跨日

  const isCrossDayBooking = (app: any) => {

    if (!app.schedule?.start || !app.schedule?.end) return false;

    const startDate = new Date(app.schedule.start).toDateString();

    const endDate = new Date(app.schedule.end).toDateString();

    return startDate !== endDate;

  };



  // 輔助函式：獲取訂單在指定日期的排序權重

  // 跨日訂單在開始日期權重為 1（最後），在結束日期權重為 -1（最前）

  const getSortWeight = (app: any, date: Date) => {

    if (!isCrossDayBooking(app)) return 0;

    

    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const startDate = new Date(app.schedule?.start || app.start_time);

    const startDateString = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;

    const endDate = app.schedule?.end ? new Date(app.schedule.end) : (app.end_time ? new Date(app.end_time) : new Date());

    const endDateString = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    

    if (dateString === startDateString) return 1; // 開始日期：排在最後

    if (dateString === endDateString) return -1; // 結束日期：排在最前

    return 0;

  };



  // 跨日訂單排序函數 - 使用 dayjs 精確處理

  const sortAppointments = (apps: any[], viewDate: Date) => {

    const startOfViewDay = dayjs(viewDate).startOf('day');



    return [...apps].sort((a, b) => {

      // 判定是否為「從昨天跨過來」的預約 - 使用 V3 結構 schedule.start

      const isACross = dayjs(a.schedule?.start).isBefore(startOfViewDay);

      const isBCross = dayjs(b.schedule?.start).isBefore(startOfViewDay);



      // 跨日預約強制置頂（時空連續性）

      if (isACross && !isBCross) return -1; // 跨日預約優先

      if (!isACross && isBCross) return 1;

      

      // 同類型的按開始時間排序（使用 dayjs unix timestamp）- 使用 V3 結構

      return dayjs(a.schedule?.start).unix() - dayjs(b.schedule?.start).unix();

    });

  };



  // 日期格式化函數
  const formatDate = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  
  // 使用 useMemo 包裹過濾邏輯，依賴項僅設為 [appointments, currentDate]
  const filteredAppointments = useMemo(() => {
    if (!appointments.length) return [];
    
    return appointments.filter((app) => {
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
      
      return appDate === formatDate(currentDate);
    });
  }, [appointments, currentDate]);

  // 輔助函式：獲取指定日期的預約 - 底層重構版本
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



  // 使用 useMemo 緩存當前日期的預約，避免重複過濾

  const currentDayAppointments = useMemo(() => getAppointmentsForDate(currentDate), [currentDate, appointments]);



  const getTodayAppointments = () => {

    const today = new Date();

    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    return appointments.filter((app) => {

      // 使用 date 欄位進行比對，避免時區轉換造成的混淆

      return app.date === todayString;

    });

  };



  const getDaysInMonth = (date: Date) => {

    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  };



  const getFirstDayOfMonth = (date: Date) => {

    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  };



  // 獲取指定日期的預約 - 使用 useMemo 緩存
  const getAppointmentsForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return getAppointmentsForDate(date);
  };

  // 獲取當前週的日期範圍
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

  // 為當前週的每個日期預先計算預約
  const weekDatesAppointments = useMemo(() => {
    const dates = getWeekDates();
    return dates.map(date => ({
      date,
      appointments: getAppointmentsForDate(date)
    }));
  }, [currentDate, appointments]);



  // 使用 useMemo 緩存 Header 需要的數據，避免每次渲染都重新計算

  const headerData = useMemo(() => {
    const todayApps = filteredAppointments;
    const totalApps = todayApps.length;

    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    const completedApps = todayApps.filter(app => {

      // 使用 start_time 計算本地時間，統一使用 UTC + 台灣時區偏移方法

      let appStartMinutes = 0;

      let duration = 0;



      if (app.schedule?.start || app.start_time) {

        // 使用 V3 結構轉換為台灣本地時間

        const timeStr = getTimeFromSchedule(app);

        const [hours, minutes] = timeStr.split(':').map(Number);

        appStartMinutes = hours * 60 + minutes;

      }



      // 計算時長

      if (app.duration) {

        duration = parseInt(app.duration);

      } else {

        duration = parseRemainingTime(app.remainingTime);

      }



      const appEndMinutes = appStartMinutes + duration;

      return currentMinutes >= appEndMinutes;

    }).length;

    const progress = totalApps > 0 ? Math.round((completedApps / totalApps) * 100) : 0;

    return { totalApps, completedApps, progress, todayApps };

  }, [appointments, currentTime]); // 依賴 appointments 和 currentTime



  // 核心狀態與每秒更新

  useEffect(() => {

    // 使用 dayjs 統一處理時區轉換，確保獲取正確的台灣時間

    const getTaipeiTime = () => {

      return dayjs().tz('Asia/Taipei').toDate();

    };

    const timer = setInterval(() => setCurrentTime(getTaipeiTime()), 1000);

    // 初始化時立即設置一次

    setCurrentTime(getTaipeiTime());

    return () => clearInterval(timer);

  }, []);

  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);

  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  const [showSheet, setShowSheet] = useState(false);

  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("month");

  const [showTimeline, setShowTimeline] = useState(true);

  const [highlightAppointmentId, setHighlightAppointmentId] = useState<string | null>(null);

  const [showAddDialog, setShowAddDialog] = useState(false);

  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);

  const [showDeletedAppointments, setShowDeletedAppointments] = useState(false);

  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const [errorMessage, setErrorMessage] = useState({ title: "", description: "" });

  const [errorFields, setErrorFields] = useState<Set<string>>(new Set());

  const [completionMessage, setCompletionMessage] = useState<string>("");

  const [deletedAppointments, setDeletedAppointments] = useState<Appointment[]>([]);

  const [deletedAppointmentsDate, setDeletedAppointmentsDate] = useState<string>(() => new Date().toDateString());



  // 🛡️ 跨日阻斷 (The Midnight Barrier) - 午夜自動清空過期項目

  useEffect(() => {

    const checkAndClearExpired = () => {

      const now = new Date();

      const todayString = now.toDateString();

      const lastUpdateString = deletedAppointmentsDate;

      

      // 如果日期變了（跨日），清空過期的刪除項目

      if (todayString !== lastUpdateString) {

        setDeletedAppointmentsDate(todayString);

        // 只保留今日的刪除項目，過去的自動清理

        setDeletedAppointments(prev => 

          prev.filter(appointment => {

            if (!appointment.schedule?.start && !appointment.start_time) return false;

            const appointmentDate = new Date(appointment.schedule?.start || appointment.start_time);

            const appointmentDateString = appointmentDate.toDateString();

            return appointmentDateString === todayString;

          })

        );

      }

    };



    // 每分鐘檢查一次

    const interval = setInterval(checkAndClearExpired, 60000);

    return () => clearInterval(interval);

  }, [deletedAppointmentsDate]);

  const [blacklistWarning, setBlacklistWarning] = useState<{ isBlacklisted: boolean; reason?: string }>({ isBlacklisted: false });

  const [timeWarning, setTimeWarning] = useState<{ type: 'none' | 'short' | 'overlap'; message?: string }>({ type: 'none' });

  const [showTimeWarningDialog, setShowTimeWarningDialog] = useState(false);

  const [pendingAppointment, setPendingAppointment] = useState<Appointment | null>(null);

  const [isLoading, setIsLoading] = useState(false);



  // 標籤顯示組件（使用 React.memo 避免不必要的重繪）

  const TagList = React.memo(({ tags, onRemove }: { tags: string[], onRemove: (index: number) => void }) => (

    <div className="flex flex-wrap gap-2 mb-2">

      {tags.map((tag, index) => (

        <span

          key={index}

          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${

            tag === 'VIP' ? 'bg-amber-400 text-black' :

            tag === '黑名單' ? 'bg-red-600 text-white' :

            tag === '新客' ? 'bg-green-500 text-white' :

            tag === '特殊注意' ? 'bg-orange-400 text-white' :

            tag === '熟客' ? 'bg-purple-500 text-white' :

            tag === '指定' ? 'bg-yellow-400 text-black' :

            'bg-gray-200 text-gray-700'

          }`}

        >

          {tag}

          <button

            type="button"

            onClick={() => onRemove(index)}

            className="hover:opacity-70"

          >

            ×

          </button>

        </span>

      ))}

    </div>

  ));



  // 標籤按鈕組件（使用 React.memo 避免不必要的重繪）

  const TagButtons = React.memo(({ tags, onToggle }: { tags: string[], onToggle: (tag: string) => void }) => {

    const commonTags = ['新客', 'VIP', '特殊注意'];

    const allTags = [...commonTags, ...tags.filter(t => !commonTags.includes(t))];

    

    return (

      <div className="flex flex-wrap gap-2">

        {allTags.map((tag) => (

          <button

            key={tag}

            type="button"

            onClick={() => onToggle(tag)}

            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${

              tags.includes(tag)

                ? 'bg-[#1A1A1A] text-white'

                : 'bg-[#F4F4F5] text-[#1A1A1A] hover:bg-[#E5E5E6]'

            }`}

          >

            {tag}

          </button>

        ))}

      </div>

    );

  });



  // 類別切換按鈕組件（優化響應速度）

  const CategoryToggle = React.memo(({ category, onChange }: { category: 'booking' | 'activity', onChange: (cat: 'booking' | 'activity') => void }) => (

    <div className="relative flex items-center bg-gray-100 rounded-xl p-1 min-w-0">

      <div

        className={`absolute h-[calc(100%-8px)] bg-black rounded-lg shadow-sm transition-all duration-150 ease-out ${

          category === 'booking' ? "left-1 w-[calc(50%-9px)]" : "left-[calc(50%+1px)] w-[calc(50%-9px)]"

        }`}

      />

      <button

        onClick={() => onChange('booking')}

        className={`relative z-10 flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-150 ${

          category === 'booking' ? 'text-white' : 'text-gray-600 hover:text-gray-900'

        }`}

      >

        預約服務

      </button>

      <button

        onClick={() => onChange('activity')}

        className={`relative z-10 flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-150 ${

          category === 'activity' ? 'text-white' : 'text-gray-600 hover:text-gray-900'

        }`}

      >

        店內活動

      </button>

    </div>

  ));



  // 折疊式選項組件

  const CollapsibleSection = ({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {

    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    

    return (

      <div className="space-y-2">

        <button

          onClick={() => setIsOpen(!isOpen)}

          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"

        >

          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />

          {title}

        </button>

        {isOpen && (

          <div className="space-y-2 pl-6">

            {children}

          </div>

        )}

      </div>

    );

  };



  // Debounce 防抖函數

  const debounce = (func: Function, wait: number) => {

    let timeout: NodeJS.Timeout | null = null;

    return (...args: any[]) => {

      if (timeout) clearTimeout(timeout);

      timeout = setTimeout(() => func(...args), wait);

    };

  };



  // 檢查客戶是否在黑名單中（debounce 版本）

  const debouncedCheckBlacklist = debounce(async (phone: string) => {

    if (!phone.trim()) {

      setBlacklistWarning({ isBlacklisted: false });

      return;

    }



    try {

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;



      // 查詢 shop_customers_v3 表中是否有該電話號碼且包含黑名單標籤

      const { data: customerData, error } = await supabase
        .from('shop_customers_v3')
        .select('all_customers')
        .eq('user_id', user.id)
        .maybeSingle();



      if (error && error.code !== 'PGRST116') {

        // Ignore error

      }



      // 從 shop_customers_v3 的 all_customers JSONB 陣列中查找客戶
      const allCustomers = customerData?.all_customers || [];
      const normalizedPhone = phone.trim().replace(/[^\d]/g, '');
      const customer = allCustomers.find((c: any) => {
        const customerPhone = c.phone?.replace(/[^\d]/g, '') || '';
        return customerPhone === normalizedPhone;
      });
      
      const tagsArray = customer?.tags || [];
      const isBlacklistedByStatus = customer?.status?.is_blacklisted;
      
      if (isBlacklistedByStatus || tagsArray.includes('黑名單')) {

        setBlacklistWarning({ isBlacklisted: true, reason: customer?.status?.blacklist_reason || '客戶未到' });

      } else {

        setBlacklistWarning({ isBlacklisted: false });

      }

    } catch (error) {

      setBlacklistWarning({ isBlacklisted: false });

    }

  }, 500);



  // 檢查客戶是否在黑名單中（保留原函數用於其他地方）

  const checkCustomerBlacklist = async (phone: string) => {

    debouncedCheckBlacklist(phone);

  };



  // 高效區段比對：使用 dayjs 進行精確的時間區段重疊檢測

  const checkTimeConflict = (date: string, time: string, duration: string, excludeId?: string) => {

    if (!date || !time || !duration) {

      setTimeWarning({ type: 'none' });

      return;

    }



    // 強制型別轉換：確保 duration 為數字

    const durationNum = parseInt(duration, 10);

    if (isNaN(durationNum) || durationNum <= 0) {

      setTimeWarning({ type: 'none' });

      return;

    }



    // 使用 dayjs 建立新預約的時間區段

    const newStart = dayjs(`${date}T${time}`);

    const newEnd = newStart.add(durationNum, 'minute');



    // 獲取同一天的所有預約

    const sameDayAppointments = appointments.filter(app => 

      app.date === date && 

      (!excludeId || app.id !== excludeId)

    );



    let hasOverlap = false;

    let hasShortGap = false;

    let conflictMessage = '';



    for (const existingApp of sameDayAppointments) {

      if (!existingApp.schedule?.start && !existingApp.start_time) continue;

      // 使用 dayjs 建立現有預約的時間區段 - 使用 V3 結構
      const existStart = dayjs(existingApp.schedule?.start || existingApp.start_time);
      const existEnd = existingApp.schedule?.end ? dayjs(existingApp.schedule.end) : (existingApp.end_time ? dayjs(existingApp.end_time) : dayjs());



      // 第一性原理：A開始 < B結束 且 A結束 > B開始 = 重疊

      if (newStart.isBefore(existEnd) && newEnd.isAfter(existStart)) {

        hasOverlap = true;

        conflictMessage = `⚠️ 時間重疊：此預約與「${existingApp.customer_name || '無名稱'}」的預約時間重疊`;

        break;

      }



      // 檢查間隔是否少於10分鐘

      const gapBefore = newStart.diff(existEnd, 'minute');

      const gapAfter = existStart.diff(newEnd, 'minute');



      if (gapBefore >= 0 && gapBefore < 10) {

        hasShortGap = true;

        if (gapBefore === 0) {

          conflictMessage = `⚠️ 完全沒有間距：與「${existingApp.customer_name || '無名稱'}」緊鄰，可能會導致訂單阻塞（建議至少 10 分鐘）`;

        } else {

          conflictMessage = `⚠️ 間隔較短：與「${existingApp.customer_name || '無名稱'}」間隔 ${gapBefore} 分鐘（建議至少 10 分鐘）`;

        }

      }



      if (gapAfter >= 0 && gapAfter < 10) {

        hasShortGap = true;

        if (gapAfter === 0) {

          conflictMessage = `⚠️ 完全沒有間距：與「${existingApp.customer_name || '無名稱'}」緊鄰，可能會導致訂單阻塞（建議至少 10 分鐘）`;

        } else {

          conflictMessage = `⚠️ 間隔較短：與「${existingApp.customer_name || '無名稱'}」間隔 ${gapAfter} 分鐘（建議至少 10 分鐘）`;

        }

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



  // 從設定讀取的服務和員工資料

  const [services, setServices] = useState<Array<{ id: string; name: string; description: string; price: number; duration: number; category: string }>>([]);

  const [staff, setStaff] = useState<Array<{ id: string; name: string; phone: string; role: string; concurrentServiceCount: number; description: string; color: string; specialty?: string }>>([]);

  const [isLoadingSettings, setIsLoadingSettings] = useState(true);



  // 從 Supabase 讀取設定資料

  useEffect(() => {

    const fetchSettings = async () => {

      try {

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;



        const { data: settingsData, error: settingsError } = await supabase

          .from('settings')

          .select('service_settings, employee_settings')

          .eq('user_id', user.id)

          .single();



        if (settingsError) throw settingsError;



        // 讀取服務設定

        if (settingsData?.service_settings?.services) {

          setServices(settingsData.service_settings.services);

        }



        // 讀取員工設定

        if (settingsData?.employee_settings) {

          setStaff(settingsData.employee_settings);

        }

      } catch (error) {

        console.error('讀取設定資料失敗:', error);

      } finally {

        setIsLoadingSettings(false);

      }

    };



    fetchSettings();

  }, []);



  // 新增預約彈窗狀態：整合為單一 formState 物件，避免渲染風暴

  const [dialogFormState, setDialogFormState] = useState({

    category: 'booking' as 'booking' | 'activity',

    customerName: '',

    service: '',

    serviceType: 'nail' as 'nail' | 'eyelash' | 'hair' | 'other',

    date: '',

    time: '',

    duration: '',

    price: '', // 價格欄位

    phone: '',

    email: '',

    notes: '',

    tags: [] as string[],

    staffId: '' // 新增員工選擇欄位

  });



  // 重置彈窗狀態

  const resetDialogState = () => {

    const currentDateStr = currentDate.toISOString().split('T')[0];

    setDialogFormState({

      category: 'booking',

      customerName: '',

      service: '',

      serviceType: 'nail',

      date: currentDateStr, // 設置默認日期為當前選中的日期

      time: '',

      duration: '',

      price: '',

      phone: '',

      email: '',

      notes: '',

      tags: [],

      staffId: ''

    });

    setBlacklistWarning({ isBlacklisted: false });

    setTimeWarning({ type: 'none' });

  };



  // 更新表單狀態的輔助函數

  const updateDialogFormState = (updates: Partial<typeof dialogFormState>) => {

    setDialogFormState(prev => ({ ...prev, ...updates }));

  };



  // 優化：預先計算表單欄位的顯示狀態，避免重複計算

  const formFieldsVisibility = useMemo(() => ({

    showCustomerFields: dialogFormState.category === 'booking',

    showServiceField: dialogFormState.category === 'booking',

    showPriceField: dialogFormState.category === 'booking',

    showNotesField: dialogFormState.category === 'activity',

    customerLabel: dialogFormState.category === 'booking' ? '客戶名稱' : '活動名稱',

    customerPlaceholder: dialogFormState.category === 'booking' ? '請輸入客戶名稱' : '請輸入活動名稱（如：教育訓練、領貨）',

    timeLabel: dialogFormState.category === 'booking' ? '開始時間' : '活動時間',

    durationLabel: dialogFormState.category === 'booking' ? '預計花費時間（分鐘）' : '持續時間（分鐘）',

    durationPlaceholder: dialogFormState.category === 'booking' ? '請輸入預計花費時間' : '請輸入持續時間'

  }), [dialogFormState.category]);



  const [newAppointment, setNewAppointment] = useState<{

    category: 'booking' | 'activity';

    customerName: string;

    service: string;

    serviceType: 'nail' | 'eyelash' | 'hair' | 'other';

    date: string;

    time: string;

    duration: string;

    customerInfo: string;

    tags: string[];

  }>({

    category: 'booking',

    customerName: '',

    service: '',

    serviceType: 'nail',

    date: '',

    time: '',

    duration: '',

    customerInfo: '',

    tags: []

  });

  const [showEditDialog, setShowEditDialog] = useState(false);

  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null);

  const dayViewRef = useRef<HTMLDivElement>(null);

  const hasScrolledRef = useRef(false);

  const yearDropdownRef = useRef<HTMLDivElement>(null);

  const monthDropdownRef = useRef<HTMLDivElement>(null);



  // 監聽編輯預約的時間變化

  useEffect(() => {

    if (showEditDialog && editAppointment && newAppointment.category === 'booking') {

      checkTimeConflict(editAppointment.date, newAppointment.time, newAppointment.duration, editAppointment.id);

    }

  }, [showEditDialog, newAppointment.time, newAppointment.duration, newAppointment.category, editAppointment]);



  // 監聽新增預約的時間變化（使用 requestIdleCallback 避免阻塞輸入）

  useEffect(() => {

    if (showAddDialog && dialogFormState.category === 'booking') {

      // 使用 requestIdleCallback 在瀏覽器空閒時執行檢查

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {

        const idleCallbackId = (window as any).requestIdleCallback(() => {

          checkTimeConflict(dialogFormState.date, dialogFormState.time, dialogFormState.duration);

        });

        return () => (window as any).cancelIdleCallback(idleCallbackId);

      } else {

        // 降級方案：使用 setTimeout

        const timeoutId = setTimeout(() => {

          checkTimeConflict(dialogFormState.date, dialogFormState.time, dialogFormState.duration);

        }, 0);

        return () => clearTimeout(timeoutId);

      }

    }

  }, [showAddDialog, dialogFormState.date, dialogFormState.time, dialogFormState.duration, dialogFormState.category]);



  // 點擊外部關閉下拉選單

  useEffect(() => {

    const handleClickOutside = (event: MouseEvent) => {

      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {

        setShowYearDropdown(false);

      }

      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target as Node)) {

        setShowMonthDropdown(false);

      }

    };



    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);

  }, []);



  // 快速操作選單狀態

  const [quickActionMenuId, setQuickActionMenuId] = useState<string | null>(null);

  const quickActionMenuRef = useRef<HTMLDivElement>(null);



  // 點擊外部關閉快速操作選單

  useEffect(() => {

    const handleClickOutside = (event: MouseEvent) => {

      if (quickActionMenuRef.current && !quickActionMenuRef.current.contains(event.target as Node)) {

        setQuickActionMenuId(null);

      }

    };



    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);

  }, []);

  const [showExtendModal, setShowExtendModal] = useState(false);

  const [extendAppointmentId, setExtendAppointmentId] = useState<string | null>(null);

  const [extendMinutes, setExtendMinutes] = useState<number>(5);

  const [customExtendMinutes, setCustomExtendMinutes] = useState<string>('');

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [confirmAction, setConfirmAction] = useState<'end_early' | 'no_show' | 'extend' | 'cancel' | null>(null);

  const [confirmAppointmentId, setConfirmAppointmentId] = useState<string | null>(null);



  // Hover 詳細資訊卡狀態

  const [hoveredAppointment, setHoveredAppointment] = useState<Appointment | null>(null);

  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);



  // 下班彩蛋訊息 - 移出 useEffect 避免重複宣告

  const OFF_WORK_MESSAGES = [

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

] as const;

  const [offWorkMessage, setOffWorkMessage] = useState<string | null>(null);

  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);



  // 自動展開時間軸：如果選中日期有預約就顯示

  useEffect(() => {
    const selectedDateApps = filteredAppointments;
    if (selectedDateApps.length > 0) {

      setShowTimeline(true);

    }

  }, [currentDate]);



  // 從 Supabase 載入已刪除預約

  useEffect(() => {

    const loadDeletedBookings = async () => {

      // 確保 supabase 已經初始化
      if (!supabase) return;

      try {

        console.log('正在載入已刪除預約...');
        const deletedBookings = await fetchDeletedBookingsFromSupabase(supabase, toast);
        console.log('已刪除預約載入完成:', deletedBookings.length, '筆');
        setDeletedAppointments(deletedBookings);

      } catch (error: any) {

        console.error('載入已刪除預約失敗:', error);
        toast({

          title: "載入已刪除預約失敗",

          description: error?.message || "無法載入已刪除的預約資料"

        });

      }

    };



    loadDeletedBookings();

  }, [supabase, toast]); // 添加 toast 到依賴項



  // 下班彩蛋邏輯

  useEffect(() => {

    if (viewMode === "day") {
      const dayApps = sortAppointments(filteredAppointments, currentDate);



      if (dayApps.length === 0) {

        setOffWorkMessage(null);

        return;

      }



      // 計算最後一筆預約的結束時間

      const lastAppointment = dayApps[dayApps.length - 1];

      let endTime: Date;



      if (lastAppointment.schedule?.start && lastAppointment.schedule?.end) {
        // 使用 V3 結構的 schedule.end，轉換為本地時間
        endTime = new Date(lastAppointment.schedule.end);
      } else if (lastAppointment.start_time && lastAppointment.end_time) {
        // 後備方案：使用舊的 end_time，轉換為本地時間
        endTime = new Date(lastAppointment.end_time);

      } else {

        // 後備方案：使用 start_time 欄位

        const lastTimeStr = getTimeFromSchedule(lastAppointment);

        const [lastHours, lastMinutes] = lastTimeStr.split(':').map(Number);

        const lastAppointmentTime = new Date(currentDate);

        lastAppointmentTime.setHours(lastHours, lastMinutes, 0, 0);

        const serviceDuration = parseRemainingTime(lastAppointment.remainingTime);

        endTime = new Date(lastAppointmentTime.getTime() + serviceDuration * 60000);

      }



      // 檢查當前時間是否已經過了最後一筆預約的結束時間

      if (currentTime >= endTime) {

        // 只有在滾動到底部時才顯示鼓勵訊息

        if (hasScrolledToBottom && !offWorkMessage) {

          const randomIndex = Math.floor(Math.random() * OFF_WORK_MESSAGES.length);

          setOffWorkMessage(OFF_WORK_MESSAGES[randomIndex]);

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

            // 平滑淡入後移除高亮

            setTimeout(() => {

              setHighlightAppointmentId(null);

            }, 800);

            hasScrolledRef.current = true;

            return;

          }

        }



        const dayApps = filteredAppointments;
        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();



        // 如果有預約且當前時間早於第一筆預約，滾動到頂部

        if (dayApps.length > 0) {

          const firstTimeStr = getTimeFromSchedule(dayApps[0]);

          const [firstHours, firstMinutes] = firstTimeStr.split(':').map(Number);

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



  useEffect(() => {

    // 直接抓取並設定狀態
    setIsLoadingAppointments(true);
    
    // 🛠️ 初始化時載入黑名單索引
    fetchBlacklistSet();

    fetchBookingsFromSupabase(supabase, toast).then((data) => {

      // 在前端過濾 confirmed 和 completed 狀態

      const confirmedBookings = data.filter((booking: any) => 
        getStatus(booking) === 'confirmed' || getStatus(booking) === 'completed'
      );



      // 保留資料庫的 date 欄位，從 schedule.start 提取 time 欄位（V3 結構）

      const enrichedBookings = confirmedBookings.map((booking: any) => {

        // V3 結構：從 schedule.start 提取時間
        const startTime = booking.schedule?.start || booking.start_time;
        
        if (startTime) {

          const timeParts = startTime.split('T');
          const timePart = timeParts.length > 1 ? timeParts[1] : timeParts[0];
          
          const timeWithoutMs = timePart.split('.')[0];

          return {

            ...booking,

            time: timeWithoutMs

          };

        }

        return booking;

      });



      // 防止過度渲染：只在數據真正變化時更新

      setAppointments(prev => {

        const prevIds = prev.map((a: any) => a.id).sort().join(',');

        const newIds = enrichedBookings.map((a: any) => a.id).sort().join(',');

        if (prevIds === newIds && prev.length === enrichedBookings.length) {

          return prev;

        }

        return enrichedBookings;

      });

    }).finally(() => {

      setIsLoadingAppointments(false);

    });



    // 自動更新已過期的預約狀態

    autoUpdateExpiredBookings();



    // 設置 Realtime 監聽

    if (!supabase) return;

    const channel = supabase

      .channel('calendar-bookings-changes')

      .on(

        'postgres_changes',

        {

          event: '*',

          schema: 'public',

          table: 'bookings'

        },

        () => {

          // 重新抓取數據

          fetchBookingsFromSupabase(supabase, toast).then((data) => {

            const confirmedBookings = data.filter((booking: any) => 
              getStatus(booking) === 'confirmed' || getStatus(booking) === 'completed'
            );

            // 保留資料庫的 date 欄位，只從 start_time 提取 time 欄位

            const enrichedBookings = confirmedBookings.map((booking: any) => {

              if (booking.start_time) {

                const timePart = booking.start_time.split('T')[1];

                const timeWithoutMs = timePart.split('.')[0];

                return {

                  ...booking,

                  time: timeWithoutMs

                };

              }

              return booking;

            });

            setAppointments(enrichedBookings);

          });

          // 同時更新已刪除預約列表
          fetchDeletedBookingsFromSupabase(supabase, toast).then((deletedData) => {
            setDeletedAppointments(deletedData);
          });

        }

      )

      .subscribe();



    return () => {

      if (channel) {
        supabase.removeChannel(channel);
      }

    };

  }, [supabase]);



  // 強制重新載入數據

  const handleForceRefresh = async () => {

    const bookings = await fetchBookingsFromSupabase(supabase, toast);

    // 保留資料庫的 date 欄位，只從 start_time 提取 time 欄位

    const enrichedBookings = bookings.map((booking: any) => {

      if (booking.start_time) {

        const timePart = booking.start_time.split('T')[1];

        const timeWithoutMs = timePart.split('.')[0];

        return {

          ...booking,

          time: timeWithoutMs

        };

      }

      return booking;

    });

    setAppointments(enrichedBookings);

  };



  // 儲存預約資料到 localStorage (debounce 避免頻繁寫入)

  useEffect(() => {

    const timeoutId = setTimeout(() => {

      localStorage.setItem('appointments', JSON.stringify(appointments));

    }, 500); // 500ms debounce



    return () => clearTimeout(timeoutId);

  }, [appointments]);



  const years = Array.from({ length: 10 }, (_, i) => {
    const currentYear = new Date().getFullYear();
    return currentYear - 5 + i;
  });

  const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];



  // 使用 useMemo 處理 events

  const events = useMemo(() => {

    if (appointments.length === 0) return [];



    return appointments.map((b, index) => {

      const uniqueId = `${b.id}-${index}`;

      return {

        id: uniqueId,

        title: b.customer_name || '無名稱',

        start: b.start_time,

        end: b.end_time || b.start_time,

        resource: b.id

      };

    });

  }, [appointments]);



  // 掛載檢查：防止伺服器與客戶端 DOM 不一致

  if (!isClient) {

    return <div className="space-y-4">載入中...</div>;

  }



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



  const handleAppointmentClick = async (appointment: Appointment) => {

    setSelectedAppointment(appointment);

    setIsLoadingCustomer(true);

    setShowSheet(true); // 立即開啟 Modal，顯示 Loading 狀態



    // 從 customers 表獲取顧客資料

    try {

      if (appointment.customer_phone) {

        const customer = await getCustomerByPhone(supabase, appointment.customer_phone);

        setSelectedCustomer(customer);



        // 獲取顧客歷史紀錄（status = completed）

        const history = await fetchCustomerHistoryFromSupabase(supabase, appointment.customer_phone);

        setSelectedAppointment(prev => prev ? { ...prev, history } : null);

      } else {

        setSelectedCustomer(null);

      }

    } catch (error) {

      console.error('獲取顧客資料失敗:', error);

      toast({

        title: "資料加載失敗",

        description: "請稍後再試"

      });

    } finally {

      setIsLoadingCustomer(false);

    }

  };



  const handleTimelineAppointmentClick = (appointment: Appointment) => {

    setViewMode("day");

    setCurrentDate(new Date());

    setSelectedAppointment(appointment);

    setHighlightAppointmentId(appointment.id);

    // 不自動開啟 Sheet，讓用戶在日視圖中再次點擊才開啟

  };



  const handleAddAppointment = () => {

    // 重置時間警告

    setTimeWarning({ type: 'none' });

    

    // 從受控狀態讀取輸入值

    const customerName = dialogFormState.customerName;

    const phone = dialogFormState.phone;

    const email = dialogFormState.email;

    const service = dialogFormState.service;

    const time = dialogFormState.time;

    const duration = dialogFormState.duration;

    

    // 除錯輸出：檢查當前表單狀態
    console.log('🔍 [handleAddAppointment] 當前表單狀態:', {
      category: dialogFormState.category,
      customerName,
      phone,
      email,
      service,
      time,
      duration,
      date: dialogFormState.date
    });

    const newErrorFields = new Set<string>();

    const missingFieldNames: string[] = [];

    

    if (!customerName) {

      newErrorFields.add("customerName");

      missingFieldNames.push(dialogFormState.category === 'booking' ? "客戶名稱" : "活動名稱");

    }

    if (dialogFormState.category === 'booking' && !phone) {

      newErrorFields.add("phone");

      missingFieldNames.push("聯絡電話");

    }

    if (!dialogFormState.date) {

      newErrorFields.add("date");

      missingFieldNames.push("日期");

    }

    if (!time) {

      newErrorFields.add("time");

      missingFieldNames.push("時間");

    }

    if (!duration) {

      newErrorFields.add("duration");

      missingFieldNames.push("預計花費時間");

    } else {

      const durationNum = parseInt(duration, 10);

      if (isNaN(durationNum) || durationNum <= 0) {

        newErrorFields.add("duration");

        missingFieldNames.push("預計花費時間必須大於0");

      } else if (durationNum % 5 !== 0) {

        newErrorFields.add("duration");

        missingFieldNames.push("預計花費時間必須為5分鐘的倍數");

      }

    }

    if (dialogFormState.category === 'booking' && !service) {

      newErrorFields.add("service");

      missingFieldNames.push("服務名稱");

    }

    

    if (newErrorFields.size > 0) {

      setErrorFields(newErrorFields);

      setErrorMessage({

        title: "哎呀，資訊還沒填完整呢！",

        description: `請幫我填寫${missingFieldNames.join("、")}，這樣我才能幫您新增${dialogFormState.category === 'booking' ? '預約' : '活動'}喔～`

      });

      setShowErrorDialog(true);

      

      // 2秒後清除錯誤欄位狀態

      setTimeout(() => {

        setErrorFields(new Set());

      }, 2000);

      

      return;

    }



    // 檢查時間是否早於現在時間

    const [hours, minutes] = time.split(':').map(Number);

    const appointmentDateTime = new Date(dialogFormState.date);

    appointmentDateTime.setHours(hours, minutes, 0, 0);

    

    if (appointmentDateTime < currentTime) {

      newErrorFields.add("time");

      setErrorFields(newErrorFields);

      setErrorMessage({

        title: "哎呀，這個時間已經過了喔！",

        description: "請選擇現在時間之後的時間，我才能幫您新增預約～"

      });

      setShowErrorDialog(true);

      

      // 2秒後清除錯誤欄位狀態

      setTimeout(() => {

        setErrorFields(new Set());

      }, 2000);

      

      return;

    }



    const serviceAbbrMap: { [key: string]: string } = {

      'nail': '指甲',

      'eyelash': '美睫',

      'hair': '理髮',

      'other': '其他'

    };



    if (dialogFormState.category === 'booking') {

      // CRM 邏輯：根據電話號碼查找或創建顧客

      let finalTags = [...dialogFormState.tags];

      

      if (phone) {

        // 使用 CRM 函數查找或創建顧客

        getOrCreateCustomer(supabase, phone, customerName, email, finalTags)

          .then(customer => {

            if (customer) {

              // 從顧客資料中獲取合併後的標籤

              finalTags = customer.marketing_data?.tags || finalTags;

              

              // 如果顧客在黑名單中，顯示警告

              if (customer.marketing_data?.is_blacklisted) {

                toast({

                  title: "⚠️ 此顧客在黑名單中",

                  description: `電話：${phone}，未到次數：${customer.spending_stats?.no_show_count || 0}`

                });

              }

            }

          })

          .catch(error => {

            console.error('Error in CRM logic:', error);

          });

      }



      // 檢查是否為新客（電話號碼是否第一次出現）

      const normalizedPhone = normalizePhoneNumber(phone);

      const isNewCustomer = normalizedPhone && !appointments.some(app => normalizePhoneNumber(app.phone) === normalizedPhone);

      

      // 如果是新客且沒有「新客」標籤，自動添加

      if (isNewCustomer && !finalTags.includes('新客')) {

        finalTags = ['新客', ...finalTags];

      }



      const newApp: Appointment = {

        id: Date.now().toString(),

        category: dialogFormState.category,

        customerName: customerName,

        service: service,

        serviceType: dialogFormState.serviceType,

        serviceAbbr: serviceAbbrMap[dialogFormState.serviceType] || '其他',

        date: dialogFormState.date,

        time: time,

        remainingTime: `${duration}分`,

        phone: phone,

        email: email,

        tags: finalTags.length > 0 ? finalTags : ["新客"],

        aiNotes: "",

        history: [],

        start_time: dayjs(`${dialogFormState.date} ${time}:00`).format('YYYY-MM-DD HH:mm:ss'),

        // 關鍵修正：確保 service_info.category 正確設置
        service_info: {
          name: service || (dialogFormState.category === 'activity' ? customerName : '未指定服務'),
          category: dialogFormState.category, // 這是關鍵！
          service_type: dialogFormState.serviceType || 'nail'
        }

      };



      // 保存到 Supabase（加強錯誤處理）

      (async () => {

        try {

          const saveSuccess = await saveBookingToSupabase(supabase, newApp);

          if (saveSuccess) {

            // 成功保存後才更新本地狀態 - 使用函式式更新解決閉包問題
            setAppointments(prev => {
              const updated = [...prev, newApp]; // 使用最新的 prev
              return updated.sort((a, b) => {
                if (!a.date || !b.date) return 0;
                if (a.date !== b.date) {
                  return a.date.localeCompare(b.date);
                }
                return getTimeFromSchedule(a).localeCompare(getTimeFromSchedule(b));
              });
            });

            toast({

              title: "預約已成功新增",

              description: `${newApp.service || '未指定服務'} - ${newApp.date}`

            });

            // 關閉對話框並重置表單
            setShowAddDialog(false);
            resetDialogState();

          }

        } catch (error: any) {

          console.error('保存預約失敗:', error);

          // 優化錯誤提示：針對時間衝突提供更友善的訊息
          const isTimeConflict = error?.message?.includes('Time conflict detected');
          toast({
            title: isTimeConflict ? "⏰ 時間衝突" : "儲存失敗",
            description: isTimeConflict 
              ? "此時段已有其他預約，請選擇其他時間" 
              : (error?.message || "請檢查網路連接")
          });

          // 回滾本地狀態：從 appointments 中移除剛才新增的預約

          setAppointments(prev => prev.filter(app => app.id !== newApp.id));

        }

      })();

    } else {

      // 活動類型

      const newEvent: Appointment = {

        id: Date.now().toString(),

        category: 'activity',

        customerName: customerName,

        service: customerName, // 活動名稱作為服務名稱

        serviceType: 'other',

        serviceAbbr: '活動',

        date: dialogFormState.date,

        time: time,

        remainingTime: `${duration}分`,

        phone: typeof customerInfoRef.current === 'string' ? customerInfoRef.current : (customerInfoRef.current as any)?.value || "", // 將備註存儲在 phone 欄位

        email: "",

        tags: [],

        aiNotes: typeof customerInfoRef.current === 'string' ? customerInfoRef.current : (customerInfoRef.current as any)?.value || "",

        history: [],

        start_time: dayjs(`${dialogFormState.date} ${time}:00`).format('YYYY-MM-DD HH:mm:ss'),

        // 關鍵修正：確保活動也有正確的 service_info.category
        service_info: {
          name: customerName, // 活動名稱
          category: 'activity', // 這是關鍵！
          service_type: 'other'
        }

      };



      // 保存到 Supabase（加強錯誤處理）

      (async () => {

        try {

          const saveSuccess = await saveBookingToSupabase(supabase, newEvent);

          if (saveSuccess) {

            // 成功保存後才更新本地狀態 - 使用函式式更新解決閉包問題
            setAppointments(prev => {
              const updated = [...prev, newEvent]; // 使用最新的 prev
              return updated.sort((a, b) => {
                if (!a.date || !b.date) return 0;
                if (a.date !== b.date) {
                  return a.date.localeCompare(b.date);
                }
                return getTimeFromSchedule(a).localeCompare(getTimeFromSchedule(b));
              });
            });

            toast({

              title: "活動已成功新增",

              description: `${customerName} 已加入排程`

            });

          }

        } catch (error: any) {

          console.error('保存活動失敗:', error);

          toast({

            title: "儲存失敗",

            description: error?.message || "請檢查網路後重試"

          });

        }

      })();

    }



    setShowAddDialog(false);

    setBlacklistWarning({ isBlacklisted: false });

    setTimeWarning({ type: 'none' });

    setNewAppointment({

      category: 'booking',

      customerName: '',

      service: '',

      serviceType: 'nail',

      date: '',

      time: '',

      duration: '',

      customerInfo: '',

      tags: []

    });

  };



  const handleEditAppointment = async () => {

    if (!editAppointment) return;

    

    // 重置時間警告

    setTimeWarning({ type: 'none' });

    

    const newErrorFields = new Set<string>();

    const missingFieldNames = [];

    

    if (!newAppointment.customerName) {

      newErrorFields.add("customerName");

      missingFieldNames.push("客戶名稱");

    }

    if (!newAppointment.service || newAppointment.service === '未指定服務') {

      newErrorFields.add("service");

      missingFieldNames.push("服務名稱");

    }

    if (!newAppointment.time) {

      newErrorFields.add("time");

      missingFieldNames.push("時間");

    }

    if (!newAppointment.duration) {

      newErrorFields.add("duration");

      missingFieldNames.push("預計花費時間");

    } else {

      const durationNum = parseInt(newAppointment.duration, 10);

      if (isNaN(durationNum) || durationNum <= 0) {

        newErrorFields.add("duration");

        missingFieldNames.push("預計花費時間必須大於0");

      } else if (durationNum % 5 !== 0) {

        newErrorFields.add("duration");

        missingFieldNames.push("預計花費時間必須為5分鐘的倍數");

      }

    }

    

    if (newErrorFields.size > 0) {

      setErrorFields(newErrorFields);

      setErrorMessage({

        title: "哎呀，資訊還沒填完整呢！",

        description: `請幫我填寫${missingFieldNames.join("、")}，這樣我才能幫您修改預約喔～`

      });

      setShowErrorDialog(true);

      

      // 2秒後清除錯誤欄位狀態

      setTimeout(() => {

        setErrorFields(new Set());

      }, 2000);

      

      return;

    }



    // 檢查時間是否早於現在時間

    const timeStr = newAppointment.time || getTimeFromSchedule(editAppointment);

    const [hours, minutes] = timeStr.split(':').map(Number);

    const appointmentDate = getDate(editAppointment) || formatDate(new Date());
    const appointmentDateTime = new Date(appointmentDate);

    appointmentDateTime.setHours(hours, minutes, 0, 0);

    

    if (appointmentDateTime < currentTime) {

      newErrorFields.add("time");

      setErrorFields(newErrorFields);

      setErrorMessage({

        title: "哎呀，這個時間已經過了喔！",

        description: "請選擇現在時間之後的時間，我才能幫您修改預約～"

      });

      setShowErrorDialog(true);

      

      // 2秒後清除錯誤欄位狀態

      setTimeout(() => {

        setErrorFields(new Set());

      }, 2000);

      

      return;

    }



    // 如果有時間警告（由即時檢測設置），顯示警告對話框

    if (timeWarning.type !== 'none') {

      // 先創建預約物件但不儲存

      const serviceAbbrMap: { [key: string]: string } = {

        'nail': '指甲',

        'eyelash': '美睫',

        'hair': '理髮',

        'other': '其他'

      };



      const customerInfo = newAppointment.customerInfo || '';

      const parts = customerInfo.split('/').map(p => p.trim());

      const phone = parts[0] || '';

      const email = parts[1] || '';



      const tempAppointment: Appointment = {

        ...editAppointment,

        customerName: newAppointment.customerName,

        service: newAppointment.service || '未指定服務',

        serviceType: newAppointment.serviceType,

        serviceAbbr: serviceAbbrMap[newAppointment.serviceType] || '其他',

        time: newAppointment.time,

        remainingTime: `${newAppointment.duration}分`,

        phone: phone,

        email: email,

        tags: newAppointment.tags,

        start_time: dayjs(`${newAppointment.date} ${newAppointment.time}:00`).format('YYYY-MM-DD HH:mm:ss'),

      };



      setPendingAppointment(tempAppointment);

      setShowTimeWarningDialog(true);

      return;

    }



    const serviceAbbrMap: { [key: string]: string } = {

      'nail': '指甲',

      'eyelash': '美睫',

      'hair': '理髮',

      'other': '其他'

    };



    const index = appointments.findIndex(app => app.id === editAppointment.id);

    if (index !== -1) {

      const updatedAppointments = [...appointments];

      // 解析 customerInfo 為 phone 和 email

      const customerInfo = newAppointment.customerInfo || '';

      const parts = customerInfo.split('/').map(p => p.trim());

      const phone = parts[0] || '';

      const email = parts[1] || '';



      const updatedAppointment = {

        ...editAppointment,

        customerName: newAppointment.customerName,

        service: newAppointment.service || '未指定服務',

        serviceType: newAppointment.serviceType,

        serviceAbbr: serviceAbbrMap[newAppointment.serviceType] || '其他',

        time: newAppointment.time,

        remainingTime: `${newAppointment.duration}分`,

        phone: phone,

        email: email,

        tags: newAppointment.tags,

        // 更新時間欄位
        start_time: dayjs(`${newAppointment.date} ${newAppointment.time}:00`).format('YYYY-MM-DD HH:mm:ss'),
        end_time: dayjs(`${newAppointment.date} ${newAppointment.time}:00`).add(parseInt(newAppointment.duration, 10), 'minute').format('YYYY-MM-DD HH:mm:ss'),
        date: newAppointment.date,

      };



      updatedAppointments[index] = updatedAppointment;



      // 根據時間排序（早的在前面，晚的在後面）

      const sortedAppointments = updatedAppointments.sort((a, b) => {

        if (!a.date || !b.date) return 0;

        if (a.date !== b.date) {

          return a.date.localeCompare(b.date);

        }

        const timeA = getTimeFromSchedule(a);

        const timeB = getTimeFromSchedule(b);

        return timeA.localeCompare(timeB);

      });

      setAppointments(sortedAppointments);



      // 保存到 Supabase

      const saveSuccess = await updateBookingToSupabase(supabase, updatedAppointment);

      if (!saveSuccess) {

        toast({

          title: "保存失敗",

          description: "修改已暫存到本地，但無法同步到雲端。請檢查網路連接。"

        });

      }

    }



    setShowEditDialog(false);

    setEditAppointment(null);

    setTimeWarning({ type: 'none' });

    setNewAppointment({

      category: 'booking',

      customerName: '',

      service: '',

      serviceType: 'nail',

      date: '',

      time: '',

      duration: '',

      customerInfo: '',

      tags: []

    });

  };



  const handleEndEarly = async (appointmentId: string) => {

    if (!appointmentId) return;



    // 使用 dayjs 獲取台北時間

    const now = dayjs().tz('Asia/Taipei');

    const currentEndTime = now.format();



    const index = appointments.findIndex(app => app.id === appointmentId);

    if (index !== -1) {

      const timeStr = getTimeFromSchedule(appointments[index]);

      const [h, m] = timeStr.split(':').map(Number);

      const startInMin = h * 60 + m;

      const currentInMin = now.hour() * 60 + now.minute();

      const elapsedMinutes = currentInMin - startInMin;



      // 更新本地狀態

      const updatedAppointments = [...appointments];

      updatedAppointments[index] = {

        ...appointments[index],

        remainingTime: `${elapsedMinutes}分`,

        isFinished: true,

        isActive: false

      };

      setAppointments(updatedAppointments);



      // 更新資料庫

      try {

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        

        // 先讀取現有資料，避免覆蓋 JSONB 結構
        const { data: existingBooking } = await supabase
          .from('shop_bookings_v3')
          .select('admin_meta, schedule_config')
          .eq('id', appointmentId)
          .single();

        const currentAdminMeta = existingBooking?.admin_meta || {};
        const currentScheduleConfig = existingBooking?.schedule_config || {};

        await supabase

          .eq('user_id', user.id);

      } catch (error: any) {

        toast({

          title: "提早結束失敗",

          description: error?.message || "無法更新預約狀態"

        });

      }

    }

    

    setConfirmAppointmentId(null);

  };



  const handleNoShow = async (appointmentId: string) => {

    if (!appointmentId) {

      return;

    }



    const index = appointments.findIndex(app => app.id === appointmentId);

    if (index === -1) {

      return;

    }



    const appointment = appointments[index];



    // 立即關閉彈窗，讓 UI 先反應

    setConfirmAppointmentId(null);

    setShowConfirmDialog(false);



    // 立即更新本地狀態：將預約標記為已完成並加上黑名單標籤（樂觀 UI 更新）

    const updatedAppointments = appointments.map(app => 

      app.id === appointmentId 

        ? { 

            ...app, 

            isFinished: true, 

            isActive: false,

            status: 'no_show',

            tags: [...(app.tags || []), '黑名單']

          }

        : app

    );

    setAppointments(updatedAppointments);



    // 背景並行執行資料庫操作，不阻塞 UI

    (async () => {

      try {

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {

          toast({

            title: "認證失敗",

            description: "請重新登入後再試"

          });

          return;

        }



        // 先讀取現有資料，避免覆蓋 JSONB 結構
        const { data: existingBooking } = await supabase
          .from('shop_bookings_v3')
          .select('admin_meta')
          .eq('id', appointmentId)
          .single();

        const currentAdminMeta = existingBooking?.admin_meta || {};

        // Action 1: 更新 bookings 表狀態為 'no_show'
        await supabase
          .from('shop_bookings_v3')
          .update({
            admin_meta: {
              ...currentAdminMeta,
              status: 'no_show',
              source: currentAdminMeta.source || 'web_dashboard',
              ai_notes: getAINotes(appointment),
              is_active: false,
              is_finished: true
            },
            is_finished: true,
            is_active: false
          })
          .eq('id', appointmentId)
          .eq('user_id', user.id);

        // Action 2: 使用 CRM 函數標記顧客為黑名單
        if (appointment.phone) {
          await markCustomerAsBlacklisted(supabase, appointment.phone, 'no_show');
        }



        // 重新獲取顧客資料更新側邊欄

        if (appointment.phone && selectedCustomer) {

          const updatedCustomer = await getCustomerByPhone(supabase, appointment.phone);

          setSelectedCustomer(updatedCustomer);

        }



        toast({

          title: "操作成功",

          description: "預約已標記為客戶未到，客戶已加入黑名單"

        });



      } catch (error: any) {

        toast({

          title: "操作失敗",

          description: error?.message || "無法完成客戶未到操作"

        });

      }

    })();



    // 更新 highlight 狀態

    setHighlightAppointmentId(null);

  };



  const handleExtendService = async () => {

    if (!confirmAppointmentId) {

      return;

    }



    const index = appointments.findIndex(app => app.id === confirmAppointmentId);

    if (index === -1) {

      return;

    }



    const appointment = appointments[index];



    // 從 duration 欄位讀取當前時長（數字格式）

    const currentDuration = parseInt(appointment.duration) || 

      parseInt(appointment.remainingTime?.toString().replace(/[^\d]/g, '') || '0');

    const newDuration = currentDuration + extendMinutes;



    console.log('延長服務時間:', {

      當前時長: currentDuration,

      延長分鐘: extendMinutes,

      新時長: newDuration

    });



    // 衝突檢查：檢查延長後的結束時間是否會撞到下一筆預約

    const timeStr = getTimeFromSchedule(appointment);

    const [h, m] = timeStr.split(':').map(Number);

    const startInMin = h * 60 + m;

    const newEndInMin = startInMin + newDuration;



    // 找到當天所有預約，按時間排序

    const dayAppointments = appointments.filter(app => app.date === appointment.date);

    const sortedAppointments = dayAppointments.sort((a, b) => {

      const timeA = getTimeFromSchedule(a);

      const timeB = getTimeFromSchedule(b);

      const [ah, am] = timeA.split(':').map(Number);

      const [bh, bm] = timeB.split(':').map(Number);

      return (ah * 60 + am) - (bh * 60 + bm);

    });

    

    // 找到下一筆預約

    const currentIdx = sortedAppointments.findIndex(app => app.id === appointment.id);

    const nextAppointment = sortedAppointments[currentIdx + 1];

    

    let hasConflict = false;

    let conflictMessage = '';

    

    if (nextAppointment) {

      const nextTimeStr = getTimeFromSchedule(nextAppointment);

      const [nextH, nextM] = nextTimeStr.split(':').map(Number);

      const nextStartInMin = nextH * 60 + nextM;

      

      if (newEndInMin > nextStartInMin) {

        hasConflict = true;

        const overlapMinutes = newEndInMin - nextStartInMin;

        conflictMessage = `⚠️ 延長後的結束時間會與下一筆預約「${nextAppointment.customerName}」重疊 ${overlapMinutes} 分鐘`;

      }

    }

    

    // 使用 dayjs 計算新的結束時間（台北時區）

    // 直接使用 start_time 的完整日期時間，支援跨日訂單

    const startDateTime = dayjs(appointment.schedule?.start).tz('Asia/Taipei');

    const newEndDateTime = startDateTime.add(newDuration, 'minute');

    const newEndTimeStr = newEndDateTime.format();

    

    // 更新本地狀態

    const updatedAppointments = [...appointments];

    updatedAppointments[index] = {

      ...appointment,

      remainingTime: `${newDuration}分`,

      duration: newDuration.toString(),

      end_time: newEndTimeStr

    };

    setAppointments(updatedAppointments);

    

    // 更新資料庫

    try {

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;



      // 先讀取現有資料，避免覆蓋 JSONB 結構

      const { data: existingBooking } = await supabase

        .from('shop_bookings_v3')

        .select('schedule_config')

        .eq('id', confirmAppointmentId)

        .single();

      const currentScheduleConfig = existingBooking?.schedule_config || {};

      const { error: updateError } = await supabase

        .from('shop_bookings_v3')

        .update({

          schedule_config: {

            ...currentScheduleConfig,

            date: appointment.date,

            duration: newDuration,

            end_time: newEndTimeStr

          }

        })

        .eq('id', confirmAppointmentId)

        .eq('user_id', user.id);

      

      if (updateError) {

        toast({

          title: "延長時間失敗",

          description: updateError.message || "無法延長服務時間"

        });

      } else {

        toast({

          title: "延長成功",

          description: hasConflict ? conflictMessage : "服務時間已延長"

        });

      }

    } catch (error: any) {

      toast({

        title: "延長時間失敗",

        description: error?.message || "無法延長服務時間"

      });

    }

    

    setConfirmAppointmentId(null);

    setExtendMinutes(5);

    setCustomExtendMinutes('');

    setShowConfirmDialog(false);

  };



  // Hover 詳細資訊卡組件

  const renderHoverTooltip = () => {

    if (!hoveredAppointment) return null;

    

    return (

      <div 

        className="fixed w-64 p-4 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl text-white z-50 animate-in fade-in zoom-in-95 duration-200"

        style={{ 

          left: `${hoverPosition.x}px`, 

          top: `${hoverPosition.y}px`,

          transform: 'translateY(0)' 

        }}

      >

        <div className="flex flex-col gap-2">

          <div className="flex justify-between items-center">

            <span className="text-xs font-mono text-gray-400">ATTAKLY-REC-{hoveredAppointment.id.slice(-4)}</span>

            {hoveredAppointment.tags && hoveredAppointment.tags.includes("VIP") && (

              <span className="px-2 py-0.5 bg-amber-400 text-black text-[10px] rounded font-bold">VIP</span>

            )}

          </div>

          

          <h4 className="text-lg font-bold">{hoveredAppointment.service_info?.category === 'activity' ? hoveredAppointment.service_info?.name || '未指定服務' : hoveredAppointment.customer_name || '無名稱'} - {hoveredAppointment.schedule?.start ? hoveredAppointment.schedule.start.split(' ')[1]?.substring(0, 5) : '00:00'}</h4>

          

          <div className="h-[1px] bg-white/10 my-1" />

          

          <div className="space-y-1">

            {hoveredAppointment.service_info?.category === 'booking' && (

              <p className="text-xs text-gray-300">服務：{hoveredAppointment.service_info?.name || '未指定服務'}</p>

            )}

            <p className="text-xs text-gray-300">時長：{hoveredAppointment.duration ? `${hoveredAppointment.duration} 分鐘` : hoveredAppointment.remainingTime}</p>

            {hoveredAppointment.aiNotes && (

              <p className="text-xs text-gray-400 mt-2 italic">"{hoveredAppointment.aiNotes}"</p>

            )}

          </div>

        </div>

      </div>

    );

  };



  const openEditDialog = (appointment: Appointment) => {

    setEditAppointment(appointment);

    // 根據類型設置備註欄位

    let customerInfo = '';

    if (appointment.service_info?.category === 'booking') {

      // 預約類型：將 phone 和 email 合併為 customerInfo

      const customerInfoParts = [];

      if (appointment.phone) customerInfoParts.push(appointment.phone);

      if (appointment.email) customerInfoParts.push(appointment.email);

      customerInfo = customerInfoParts.join(' / ');

    } else {

      // 活動類型：使用 aiNotes 作為備註

      customerInfo = appointment.aiNotes || '';

    }



    setNewAppointment({

      category: appointment.service_info?.category,

      customerName: appointment.customerName,

      service: appointment.service_info?.name || '未指定服務',

      serviceType: appointment.serviceType,

      date: appointment.date,

      time: getTimeFromSchedule(appointment) || '00:00',

      duration: (appointment as any).duration || parseRemainingTime(appointment.remainingTime).toString(),

      customerInfo: customerInfo,

      tags: appointment.tags || []

    });

    setShowEditDialog(true);

  };



  const handleDeleteAppointment = () => {

    if (!editAppointment) return;

    setShowDeleteConfirmDialog(true);

  };



  const confirmDeleteAppointment = () => {

    if (!editAppointment) return;



    // 從 Supabase 刪除（設定 status = 'cancelled'）

    deleteBookingFromSupabase(supabase, editAppointment.id);



    // 儲存到刪除記錄（最多5筆）

    setDeletedAppointments(prev => {

      const newDeleted = [editAppointment!, ...prev];

      return newDeleted.slice(0, 5);

    });



    // 從預約列表中移除

    const updatedAppointments = appointments.filter(app => app.id !== editAppointment!.id);

    setAppointments(updatedAppointments);



    // 關閉對話框和編輯表單

    setShowDeleteConfirmDialog(false);

    setShowEditDialog(false);

    setEditAppointment(null);

  };



// 檢查訂單是否已過期（用於按鈕禁用邏輯）
const isAppointmentExpired = (appointment: Appointment): boolean => {
  const now = dayjs().tz('Asia/Taipei');
  const startTime = appointment.schedule?.start ? dayjs(appointment.schedule.start).tz('Asia/Taipei') : dayjs(appointment.start_time).tz('Asia/Taipei');
  const endTime = appointment.schedule?.end ? dayjs(appointment.schedule.end).tz('Asia/Taipei') : dayjs(appointment.end_time).tz('Asia/Taipei');
  
  const today = now.startOf('day');
  const appointmentDay = startTime.startOf('day');
  
  // 如果預約日期在今天之前，或者預約結束時間已經過了
  return appointmentDay.isBefore(today) || endTime.isBefore(now);
};

const handleRestoreDeletedAppointment = async (appointment: Appointment) => {

  // 🛡️ 復原守門員 - 三層防護邏輯

  const now = dayjs().tz('Asia/Taipei');

  const startTime = appointment.schedule?.start ? dayjs(appointment.schedule.start).tz('Asia/Taipei') : dayjs(appointment.start_time).tz('Asia/Taipei');
  const endTime = appointment.schedule?.end ? dayjs(appointment.schedule.end).tz('Asia/Taipei') : dayjs(appointment.end_time).tz('Asia/Taipei');



  // 防護 1：時間效期限制 (The Expiry Lock)
  // 檢查是否為過去的預約（包含前天或更早的預約）
  const today = now.startOf('day');
  const appointmentDay = startTime.startOf('day');
  
  // 對於跨日訂單，檢查結束時間是否已過
  // 如果預約日期在今天之前，或者預約結束時間已經過了
  if (appointmentDay.isBefore(today) || endTime.isBefore(now)) {

    toast({

      title: "無法復原",

      description: appointmentDay.isBefore(today) 
        ? "該預約日期已過（前天或更早），請直接建立新預約"
        : "該預約時間已過，請直接建立新預約"

    });

    return;

  }



  // 防護 2：跨日阻斷 (The Midnight Barrier)

  const todayString = now.format('YYYY-MM-DD');

  const appointmentDateString = startTime.format('YYYY-MM-DD');

  const isToday = appointmentDateString === todayString;

  

  if (!isToday) {

    toast({

      title: "無法復原",

      description: "只能復原今日的預約，過期項目已自動清理"

    });

    return;

  }



  // 防護 3：實時衝突偵測 (The Re-Check)
  
  // 簡單的衝突檢查函數
  const hasTimeConflict = (date: string, time: string, duration: string, excludeId?: string): boolean => {
    if (!date || !time || !duration) return false;
    
    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum <= 0) return false;
    
    const appointmentStart = dayjs(`${date} ${time}`, 'YYYY-MM-DD HH:mm');
    const appointmentEnd = appointmentStart.add(durationNum, 'minute');
    
    return appointments.some(app => {
      if (excludeId && app.id === excludeId) return false;
      
      // 檢查 V3 結構或 V2 結構的時間欄位
      const hasTimeData = (app.schedule?.start && app.schedule?.end) || (app.start_time && app.end_time);
      if (!hasTimeData) return false;
      
      const existingStart = app.schedule?.start ? dayjs(app.schedule.start) : dayjs(app.start_time);
      const existingEnd = app.schedule?.end ? dayjs(app.schedule.end) : dayjs(app.end_time);
      
      return appointmentStart.isBefore(existingEnd) && appointmentEnd.isAfter(existingStart);
    });
  };

  const isConflict = hasTimeConflict(appointment.date, appointment.time, appointment.remainingTime, appointment.id);

  if (isConflict) {

    toast({

      title: "時間衝突",

      description: "此時段已有其他預約，無法復原，請手動調整時間"

    });

    return;

  }



  // 檢查預約是否已存在於當前列表中

  const alreadyExists = appointments.some(app => app.id === appointment.id);

  if (alreadyExists) {

    // 預約已經在列表中，直接從刪除記錄中移除

    setDeletedAppointments(prev => prev.filter(app => app.id !== appointment.id));

    return;

  }



  // 執行復原 (將 deleted_at 設為 null)

  try {

    const { error } = await supabase

      .from('shop_bookings_v3')

      .update({

        status: 'confirmed',

        admin_meta: {
          status: 'confirmed',
          source: 'web_dashboard',
          ai_notes: getAINotes(appointment)
        },
        category: appointment.service_info?.category || 'booking' // 確保類別正確

      })

      .eq('id', appointment.id);



    if (error) {

      console.error('Error restoring booking:', error);

      toast({

        title: "恢復失敗",

        description: "無法恢復此預約，請檢查網路連接。"

      });

      return;

    }

  } catch (error: any) {

    console.error('Error restoring booking:', error);

    toast({

      title: "恢復失敗",

      description: "無法恢復此預約，請檢查網路連接。"

    });

    return;

  }



  // 將預約添加回列表

  setAppointments([...appointments, appointment]);

  setDeletedAppointments(prev => prev.filter(app => app.id !== appointment.id));

  

  toast({

    title: "復原成功",

    description: "預約已成功復原！"

  });

};



  const getServiceTypeColor = (type: string | null, tags: string[] | null = []): string => {

    if (tags && tags.includes("活動")) {

      return "bg-amber-100 text-amber-700 border-amber-200";

    }

    switch (type) {

      case "nail":

        return "bg-[#1A1A1A] text-white border border-white/10 px-2 py-0.5 rounded-full text-[10px]";

      case "eyelash":

        return "bg-[#1A1A1A] text-white border border-white/10 px-2 py-0.5 rounded-full text-[10px]";

      case "hair":

        return "bg-[#1A1A1A] text-white border border-white/10 px-2 py-0.5 rounded-full text-[10px]";

      default:

        return "bg-gray-900 text-white border border-gray-700 px-2 py-0.5 rounded-full text-[10px]";

    }

  };



  const getServiceTypeDotColor = (type: string | null, tags: string[] | null = []): string => {

    if (tags !== null && tags.includes("活動")) {

      return "bg-amber-500";

    }

    switch (type) {

      case "nail":

        return "bg-[#1A1A1A]";

      case "eyelash":

        return "bg-[#1A1A1A]";

      case "hair":

        return "bg-[#1A1A1A]";

      default:

        return "bg-gray-400";

    }

  };



  const formatTime = (time: string) => {

    // 如果時間格式是 HH:MM:SS，去掉秒數

    if (time && time.length > 5) {

      return time.substring(0, 5);

    }

    return time;

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

        <div

          key={day}

          className={`aspect-square p-2 hover:bg-gray-50 transition-colors group cursor-pointer relative ${isToday ? 'bg-red-50' : 'bg-white'} shadow-sm flex flex-col`}

        >

          <span className={`absolute top-1 right-2 text-sm font-medium ${isToday ? 'bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-400'}`}>

            {day}

          </span>

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

          {/* Hover 顯示的小加號按鈕 - 只在非過去日期顯示 */}

          {new Date(currentDate.getFullYear(), currentDate.getMonth(), day) >= new Date(new Date().setHours(0, 0, 0, 0)) && (

            <button

              onClick={(e) => {

                e.stopPropagation();

                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                

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

                

                updateDialogFormState({ date: dateStr, time: suggestedTime });

                setTimeWarning({ type: 'none' });

                setShowAddDialog(true);

              }}

              className="absolute bottom-2 right-2 w-6 h-6 bg-gray-900 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-gray-800"

            >

              <Plus className="w-3 h-3" />

            </button>

          )}

        </div>

      );

    }



    return days;

  };



  


  const renderWeekView = () => {

    const weekDates = getWeekDates();

    const today = new Date();



    // 獲取本周所有的預約 - 使用預先計算的結果
    const weekAppointments = weekDatesAppointments.flatMap(item => item.appointments);



    return (

      <div className="space-y-4">

        

        <div className="flex items-center justify-between">

          <button

            onClick={handlePrevWeek}

            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer active:scale-95"

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

            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer active:scale-95"

          >

            <ChevronDown className="w-5 h-5 -rotate-90" />

          </button>

        </div>



        <div className="bg-amber-50/50 rounded-lg p-3 text-center">

          <p className="text-sm text-amber-800 leading-relaxed">

            💡 提示：<span className="font-bold">點擊</span>日期格右下角的<span className="font-bold">黑色加號</span>可新增服務項目，<span className="font-bold">點擊</span>預約卡片可查看詳情，<span className="font-bold">切換到日模式</span>可修改訂單詳細資料

          </p>

        </div>



        <div className="grid grid-cols-7 gap-2 rounded-lg overflow-hidden">

          {["日", "一", "二", "三", "四", "五", "六"].map((day) => (

            <div key={day} className="bg-gray-50 p-2 text-center text-sm font-bold text-gray-900 uppercase">

              {day}

            </div>

          ))}

          {weekDates.map((date) => {

            const isToday = date.toDateString() === today.toDateString();
            // 從預先計算的結果中獲取預約
            const dayAppointments = weekDatesAppointments.find(item => 
              item.date.toDateString() === date.toDateString()
            )?.appointments || [];



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

                    {sortAppointments(dayAppointments, date).map((appointment) => (

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

                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md w-full overflow-hidden cursor-pointer transition-colors ${

                          appointment.service_info?.category === 'activity'

                            ? 'bg-gray-50 border-2 border-dashed border-gray-300 hover:bg-gray-100'

                            : 'bg-black hover:bg-gray-900'

                        }`}

                      >

                        {/* 時間：固定寬度，不可壓縮 */}

                        <span className={`text-[10px] font-bold whitespace-nowrap flex-shrink-0 ${

                          appointment.service_info?.category === 'activity' ? 'text-gray-600 font-normal' : 'text-white'

                        }`}>{getTimeFromSchedule(appointment)}</span>



                        {/* VIP：用符號代替文字 */}

                        {appointment.service_info?.category === 'booking' && appointment.tags && appointment.tags.includes("VIP") && <span className="text-amber-400 text-[10px] flex-shrink-0">★</span>}



                        {/* 姓名：優先顯示，flex-grow，過長時變... */}

                        <span className={`text-[11px] truncate flex-1 min-w-0 ${

                          appointment.service_info?.category === 'activity' ? 'text-gray-600 font-light' : 'text-gray-100 font-medium'

                        }`}>

                          {appointment.service_info?.category === 'activity' ? appointment.service_info?.name || '未指定服務' : appointment.customer_name || '無名稱'}

                          {appointment.service_info?.category === 'booking' && appointment.service_info?.name && appointment.service_info?.name !== '未指定服務' && ` | ${appointment.service_info.name}`}

                        </span>



                        {/* 時長：可縮小，空間不足時優先隱藏 */}

                        {appointment.duration && (

                          <span className={`text-[9px] whitespace-nowrap flex-shrink-0 ${

                            appointment.service_info?.category === 'activity' ? 'text-gray-500' : 'text-gray-300'

                          }`}>{appointment.duration}分鐘</span>

                        )}

                      </div>

                    ))}

                  </div>

                )}

                {/* Hover 顯示的小加號按鈕 - 只在非過去日期顯示 */}

                {date >= new Date(new Date().setHours(0, 0, 0, 0)) && (

                  <button

                    onClick={(e) => {

                      e.stopPropagation();

                      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;



                      // 計算建議時間：該日期最後一筆預約結束時間 + 10 分鐘

                      const dayAppointments = appointments.filter(app => app.date === dateStr && app.category === 'booking');

                      let suggestedTime = '09:00'; // 預設 9:00



                      if (dayAppointments.length > 0) {

                        const lastAppointment = sortAppointments([...dayAppointments], date)[0];

                        const timeStr = getTimeFromSchedule(lastAppointment);

                        const [hours, minutes] = timeStr.split(':').map(Number);

                        const lastAppointmentTime = new Date(dateStr);

                        lastAppointmentTime.setHours(hours, minutes, 0, 0);

                        

                        const duration = parseRemainingTime(lastAppointment.remainingTime);

                        const endTime = new Date(lastAppointmentTime.getTime() + duration * 60000);

                        endTime.setMinutes(endTime.getMinutes() + 10);

                        

                        const suggestedHours = String(endTime.getHours()).padStart(2, '0');

                        const suggestedMinutes = String(endTime.getMinutes()).padStart(2, '0');

                        suggestedTime = `${suggestedHours}:${suggestedMinutes}`;

                      }

                      

                      updateDialogFormState({ date: dateStr, time: suggestedTime });

                      setTimeWarning({ type: 'none' });

                      setShowAddDialog(true);

                    }}

                    className="absolute bottom-2 right-2 w-6 h-6 bg-gray-900 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-gray-800"

                  >

                    <Plus className="w-3 h-3" />

                  </button>

                )}

              </div>

            );

          })}

        </div>

        
      </div>

    );

  };



  const renderDayView = () => {

    const dayAppointments = sortAppointments(currentDayAppointments, currentDate);

    const currentTimeStr = currentTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });



    // 檢查是否為過去日期（避免修改 currentDate 物件）

    const currentDateStart = new Date(currentDate);

    currentDateStart.setHours(0, 0, 0, 0);

    const currentTimeStart = new Date(currentTime);

    currentTimeStart.setHours(0, 0, 0, 0);

    const isPastDate = currentDateStart < currentTimeStart;



    // 計算當前時間是否在第一筆訂單之前

    const isBeforeFirstAppointment = !isPastDate && dayAppointments.length > 0 && (() => {

      const firstTimeStr = getTimeFromSchedule(dayAppointments[0]);

      const [firstHours, firstMinutes] = firstTimeStr.split(':').map(Number);

      const firstAppointmentMinutes = firstHours * 60 + firstMinutes;

      const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

      return currentMinutes < firstAppointmentMinutes;

    })();



    // 計算當前時間是否在最後一筆訂單結束之後

    const isAfterLastAppointment = !isPastDate && dayAppointments.length > 0 && (() => {

      const lastAppointment = dayAppointments[dayAppointments.length - 1];

      const lastTimeStr = getTimeFromSchedule(lastAppointment);

      const [lastHours, lastMinutes] = lastTimeStr.split(':').map(Number);

      const lastAppointmentTime = new Date(currentDate);

      lastAppointmentTime.setHours(lastHours, lastMinutes, 0, 0);

      const serviceDuration = parseInt(lastAppointment.schedule?.duration || '60');

      const endTime = new Date(lastAppointmentTime.getTime() + serviceDuration * 60000);

      return currentTime >= endTime;

    })();



    // 如果在第一筆訂單之前，顯示第一筆訂單的時間

    const displayTimeStr = isBeforeFirstAppointment ? getTimeFromSchedule(dayAppointments[0]) : currentTimeStr;



    // 計算下一個活動的時間

    const getNextAppointmentTime = () => {

      // 只在當天顯示

      const today = new Date();

      const isToday = currentDate.toDateString() === today.toDateString();

      if (!isToday) return null;

      if (isPastDate) return null;



      // 找到當前進行中的訂單

      const nowDateTime = dayjs().tz('Asia/Taipei');

      let currentActiveAppointment = null;

      let currentActiveIndex = -1;



      for (let i = 0; i < dayAppointments.length; i++) {

        const appointment = dayAppointments[i];

        // 使用字串處理避免時區問題 - 先提取時間部分
        const timePart = appointment.schedule?.start?.split(' ')[1] || '00:00';
        const endTimePart = appointment.schedule?.end?.split(' ')[1] || '00:00';
        const [startHours, startMinutes] = timePart.split(':').map(Number);
        const [endHours, endMinutes] = endTimePart.split(':').map(Number);

        // 轉換為當天的分鐘數進行比較
        const currentMinutes = nowDateTime.hour() * 60 + nowDateTime.minute();
        const appointmentStartMinutes = startHours * 60 + startMinutes;
        const appointmentEndMinutes = endHours * 60 + endMinutes;
        
        const isActive = currentMinutes >= appointmentStartMinutes && currentMinutes < appointmentEndMinutes;



        if (isActive) {

          currentActiveAppointment = appointment;

          currentActiveIndex = i;

          break;

        }

      }



      // 如果沒有進行中的訂單，不顯示

      if (!currentActiveAppointment) return null;



      // 檢查當前訂單是否已經結束

      const currentEndDateTime = dayjs(currentActiveAppointment.end_time).tz('Asia/Taipei');

      if (nowDateTime.isBefore(currentEndDateTime)) return null;



      // 計算下一個預約

      const nextAppointment = dayAppointments[currentActiveIndex + 1];

      if (!nextAppointment) return null;



      // 計算間隔時間

      const nextStartDateTime = dayjs(nextAppointment.start_time).tz('Asia/Taipei');

      const gapMinutes = nextStartDateTime.diff(currentEndDateTime, 'minute');



      if (gapMinutes <= 0) return null;



      return {

        time: `${gapMinutes} 分鐘後`,

        category: nextAppointment.category

      };

    };



    const nextAppointmentTime = getNextAppointmentTime();



    // 計算距離第一筆預約的時間

    const getTimeUntilFirstAppointment = () => {

      if (dayAppointments.length === 0) return null;

      

      // 檢查第一筆預約是否為跨日訂單（從昨天延續過來）

      const firstAppointment = dayAppointments[0];

      if (firstAppointment.start_time) {

        const startDateTime = dayjs(firstAppointment.start_time).tz('Asia/Taipei');

        const startDateString = startDateTime.format('YYYY-MM-DD');

        const currentDateString = dayjs(currentDate).format('YYYY-MM-DD');

        

        // 如果第一筆預約的開始日期早於當前日期，則是跨日訂單，不顯示距離提示

        if (startDateString < currentDateString) return null;

      }

      

      const firstTimeStr = getTimeFromSchedule(dayAppointments[0]);

      const [firstHours, firstMinutes] = firstTimeStr.split(':').map(Number);

      

      // 建立預約的完整日期時間物件

      const appointmentDateTime = new Date(currentDate);

      appointmentDateTime.setHours(firstHours, firstMinutes, 0, 0);

      

      // 計算時間差（毫秒）

      const diffMs = appointmentDateTime.getTime() - currentTime.getTime();

      

      // 如果預約時間已過，不顯示

      if (diffMs <= 0) return null;

      

      // 使用新的格式化函數

      return formatTimeUntilAppointment(diffMs);

    };



    return (

      <div className="space-y-4 animate-in fade-in duration-300 min-h-[600px]" ref={dayViewRef}>

        

        {/* 大提示：防止看錯日期 */}

        {getTimeUntilFirstAppointment() && (

          <div className="bg-white border border-gray-200 rounded-xl p-4 border-l-4 border-l-red-600">

            <div className="text-lg font-bold text-gray-700">

              現在是 {currentTime.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })} ({currentTime.toLocaleDateString('zh-TW', { weekday: 'short' })}) {currentTimeStr}

            </div>

            <div className="text-gray-500 mt-1">

              您距離第一筆預約 ({getTimeFromSchedule(dayAppointments[0])}) 還有 {getTimeUntilFirstAppointment()}。

            </div>

          </div>

        )}



        <div className="flex items-center justify-between">

          <button

            onClick={handlePrevDay}

            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer active:scale-95"

          >

            <ChevronDown className="w-5 h-5 rotate-90" />

          </button>

          <div className="bg-gray-50 rounded-lg p-4 flex-1 mx-4">

            <div className="text-2xl font-bold text-gray-900 mb-1">{currentDate.toLocaleDateString('zh-TW', { weekday: 'long' })}</div>

            <div className="text-gray-600">{currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}</div>

            {nextAppointmentTime && (

              <div className="text-sm text-green-600 mt-1 font-medium">

                {nextAppointmentTime.category === 'activity' ? '下一個活動' : '下一個客人'} {nextAppointmentTime.time}

              </div>

            )}

          </div>

          <div className="flex items-center gap-2">

            <button

              onClick={handleForceRefresh}

              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer active:scale-95"

              title="重新載入數據"

            >

              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />

              </svg>

            </button>

            {!isPastDate && (

              <button

                onClick={() => {

                  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

                  

                  // 計算建議時間：該日期最後一筆預約結束時間 + 10 分鐘

                  const dayAppointments = appointments.filter(app => app.date === dateStr && app.category === 'booking');

                  let suggestedTime = '09:00'; // 預設 9:00

                  

                  if (dayAppointments.length > 0) {

                    const lastAppointment = dayAppointments.sort((a, b) => {

                      const timeA = getTimeFromSchedule(a);

                      const timeB = getTimeFromSchedule(b);

                      return timeB.localeCompare(timeA);

                    })[0];

                    const timeStr = getTimeFromSchedule(lastAppointment);

                    const [hours, minutes] = timeStr.split(':').map(Number);

                    const lastAppointmentTime = new Date(dateStr);

                    lastAppointmentTime.setHours(hours, minutes, 0, 0);

                    

                    const duration = parseInt(lastAppointment.schedule?.duration || '60');

                    const endTime = new Date(lastAppointmentTime.getTime() + duration * 60000);

                    endTime.setMinutes(endTime.getMinutes() + 10);

                    

                    const suggestedHours = String(endTime.getHours()).padStart(2, '0');

                    const suggestedMinutes = String(endTime.getMinutes()).padStart(2, '0');

                    suggestedTime = `${suggestedHours}:${suggestedMinutes}`;

                  }

                  

                  updateDialogFormState({ date: dateStr, time: suggestedTime });

                  setTimeWarning({ type: 'none' });

                  setShowAddDialog(true);

                }}

                className="bg-gray-900 text-white p-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer active:scale-95"

              >

                <Plus className="w-5 h-5" />

              </button>

            )}

            <button

              onClick={handleNextDay}

              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer active:scale-95"

            >

              <ChevronDown className="w-5 h-5 -rotate-90" />

            </button>

          </div>

        </div>



        {/* 操作提示 */}

        {!isPastDate && (

          <div className="bg-amber-50/50 rounded-lg p-3 text-center">

            <p className="text-sm text-amber-800 leading-relaxed">

              💡 提示：可隨時在服務項目間插入新服務，或<span className="font-bold">點擊「編輯」</span>修改服務內容

            </p>

          </div>

        )}



        {dayAppointments.length > 0 ? (

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">

              {dayAppointments.map((appointment, index) => {

                // 使用字串處理避免時區問題

                let start = 0;

                let end = 0;



                if (appointment.schedule?.start) {

                  // 使用字串處理避免時區問題 - 先提取時間部分

                  const timePart = appointment.schedule.start?.split(' ')[1] || '00:00';

                  const [hours, minutes] = timePart.split(':').map(Number);

                  start = hours * 60 + minutes;



                  if (appointment.schedule?.end) {

                    const endTimePart = appointment.schedule.end?.split(' ')[1] || '00:00';

                    const [endHours, endMinutes] = endTimePart.split(':').map(Number);

                    end = endHours * 60 + endMinutes;

                  } else {

                    // 後備方案：使用 duration 計算

                    const duration = parseInt(appointment.schedule?.duration || '60');

                    end = start + duration;

                  }

                }



                // 使用字串處理進行時間比較，避免時區問題

                const nowDateTime = dayjs().tz('Asia/Taipei');

                const timePart = appointment.schedule?.start?.split(' ')[1] || '00:00';

                const endTimePart = appointment.schedule?.end?.split(' ')[1] || '00:00';

                const [startHours, startMinutes] = timePart.split(':').map(Number);

                const [endHours, endMinutes] = endTimePart.split(':').map(Number);

                const currentMinutes = nowDateTime.hour() * 60 + nowDateTime.minute();

                const appointmentStartMinutes = startHours * 60 + startMinutes;

                const appointmentEndMinutes = endHours * 60 + endMinutes;
                
                // 計算開始和結束時間的 dayjs 對象（用於進度條顯示）
                // 確保使用當前日期，避免時區問題
                const currentDateForProgress = dayjs().tz('Asia/Taipei');
                const startDateTime = currentDateForProgress.hour(startHours).minute(startMinutes).second(0);
                const endDateTime = currentDateForProgress.hour(endHours).minute(endMinutes).second(0);

                // 修改邏輯：不依賴日期判定，改為純粹的時間軸判定

                // 這樣跨日訂單不會因為日期變化而被鎖死

                

                // 對於活動和預約，使用不同的狀態判斷策略

                let isFinished, isActive;

                if (appointment.service_info?.category === 'activity') {

                  // 活動使用時間軸判定，但優先使用已保存的狀態

                  // 修正：只有真正超過結束時間才算完成，避免邊界狀態跳動

                  const dynamicFinished = currentMinutes >= appointmentEndMinutes;

                  const dynamicActive = currentMinutes >= appointmentStartMinutes && currentMinutes < appointmentEndMinutes;

                  

                  // 如果活動已經手動標記為完成，保持完成狀態

                  isFinished = appointment.isFinished || dynamicFinished;

                  // 如果活動已經手動標記為完成，則不活躍

                  isActive = appointment.isFinished ? false : (appointment.isActive || dynamicActive);

                } else {

                  // 預約使用純時間軸判定，不考慮手動標記狀態

                  // 修正：只有真正超過結束時間才算完成，避免邊界狀態跳動

                  isFinished = currentMinutes >= appointmentEndMinutes;

                  isActive = currentMinutes >= appointmentStartMinutes && currentMinutes < appointmentEndMinutes;

                }



                // 計算空檔：下一單開始時間 - 這一單結束時間

                const getGapMinutes = () => {

                  const nextApp = dayAppointments[index + 1];

                  if (!nextApp) return 0;

                  const timeStr1 = getTimeFromSchedule(appointment);

                  const timeStr2 = getTimeFromSchedule(nextApp);

                  const [h1, m1] = timeStr1.split(':').map(Number);

                  const [h2, m2] = timeStr2.split(':').map(Number);

                  const currentEnd = h1 * 60 + m1 + parseInt(appointment.schedule?.duration || '60');

                  const nextStart = h2 * 60 + m2;

                  return nextStart - currentEnd;

                };



                const gap = getGapMinutes();



                // 倒數計時

                const renderCountdown = () => {

                  // 使用完整的日期時間戳計算剩餘時間（支援跨日訂單）

                  const nowDateTime = dayjs().tz('Asia/Taipei');

                  const endDateTime = dayjs(appointment.schedule?.end).tz('Asia/Taipei');



                  const totalRemainingSec = endDateTime.diff(nowDateTime, 'second');



                  // 即使時間已過也顯示倒數（0:00）

                  const displaySec = Math.max(0, totalRemainingSec);



                  // 超過 60 分鐘顯示小時分鐘，小於 60 分鐘顯示分鐘秒

                  if (displaySec >= 3600) {

                    const hours = Math.floor(displaySec / 3600);

                    const minutes = Math.floor((displaySec % 3600) / 60);

                    return (

                      <div className="flex items-center space-x-1 font-mono">

                        <span className="text-xs text-gray-400">剩餘</span>

                        <span className="text-sm font-bold text-black">

                          {hours} 小時 {minutes} 分鐘

                        </span>

                      </div>

                    );

                  } else {

                    const min = Math.floor(displaySec / 60);

                    const sec = displaySec % 60;

                    return (

                      <div className="flex items-center space-x-1 font-mono">

                        <span className="text-xs text-gray-400">剩餘</span>

                        <span className={`text-sm font-bold ${min < 5 ? 'text-red-500 animate-pulse' : 'text-black'}`}>

                          {min} 分鐘 {sec.toString().padStart(2, '0')} 秒

                        </span>

                      </div>

                    );

                  }

                };



                return (

                  <React.Fragment key={appointment.id}>

                    <div className="flex group mb-6 relative">

                    {/* 左側：時間軸區塊 (跟著卡片高度走) */}

                    <div className="w-16 flex flex-col items-center flex-shrink-0 relative">

                      {/* 背景貫穿線 */}

                      <div className="absolute top-0 bottom-[-24px] w-[1.5px] bg-gray-100" />

                      

                      {/* 點：根據狀態變色 */}

                      <div className={`w-3.5 h-3.5 rounded-full border-2 z-10 transition-colors mt-6 ${

                        isFinished ? 'bg-white border-gray-300' : (isActive ? 'bg-red-500 border-red-500' : 'bg-black border-black')

                      }`} />



                      {/* 紅點指示器：只有 isActive 時才出現，且就在點的旁邊 */}

                      {isActive && (

                        <div className="absolute top-6 -left-12 flex items-center z-20">

                           <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm">

                             {currentTime.getHours()}:{String(currentTime.getMinutes()).padStart(2, '0')}

                           </span>

                        </div>

                      )}

                    </div>



                    {/* 右側：卡片區塊 */}

                    <div

                      data-appointment-id={appointment.id}

                      onClick={() => {

                        // 只有預約項目可以點擊，活動項目不能點擊

                        if (appointment.service_info?.category === 'booking') {

                          handleAppointmentClick(appointment);

                        }

                      }}

                      className={`flex-1 rounded-xl p-5 border-l-4 transition-all duration-300 cursor-pointer hover:shadow-md flex flex-col ${

                        appointment.service_info?.category === 'activity'

                          ? (isActive

                            ? 'bg-gray-100 border-l-gray-400 border-2 border-solid border-gray-400'

                            : 'bg-gray-50/50 border-l-gray-300 border-2 border-dashed border-gray-300 hover:bg-gray-100/50')

                          : (isActive

                            ? 'bg-white border-l-red-500 shadow-md ring-1 ring-red-100'

                            : (isFinished ? 'bg-gray-50 border-l-transparent opacity-60' : 'bg-white border-l-transparent border border-gray-100 shadow-sm'))

                      } ${

                        // 排程名片強制標記 - 黑名單安檢邏輯

                        blacklistSet.has(appointment.customer_phone)

                          ? ' border-2 border-red-500 bg-red-50/30'

                          : ''

                      } ${highlightAppointmentId === appointment.id ? 'animate-in fade-in duration-500' : ''}`}

                      style={highlightAppointmentId === appointment.id ? {

                        boxShadow: '0 0 25px rgba(239, 68, 68, 0.6)',

                        borderWidth: '3px',

                        borderColor: '#ef4444',

                      } : {}}

                    >

                      {/* 右上角三點選單 */}

                      {isActive && (

                        <div className="absolute top-4 right-4">

                          <button

                            onClick={(e) => {

                              e.stopPropagation();

                              setQuickActionMenuId(quickActionMenuId === appointment.id ? null : appointment.id);

                            }}

                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 p-1"

                          >

                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">

                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />

                            </svg>

                          </button>

                          

                          {/* 下拉選單 */}

                          {quickActionMenuId === appointment.id && (

                            <div ref={quickActionMenuRef} className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-30">

                              <div className="py-1">

                                {/* 編輯：僅在未來預約（白色）時顯示 */}

                                {/* 修改邏輯：不依賴日期，改為檢查實際時間狀態 */}

                                {!isActive && !isFinished && (

                                  <button

                                    onClick={(e) => {

                                      e.stopPropagation();

                                      setQuickActionMenuId(null);

                                      openEditDialog(appointment);

                                    }}

                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"

                                  >

                                    編輯

                                  </button>

                                )}

                                <div className="border-t border-gray-100 my-1"></div>

                                <button

                                  onClick={(e) => {

                                    e.stopPropagation();

                                    setQuickActionMenuId(null);

                                    setConfirmAction('end_early');

                                    setConfirmAppointmentId(appointment.id);

                                    setShowConfirmDialog(true);

                                  }}

                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"

                                >

                                  提早結束

                                </button>

                                {appointment.service_info?.category === 'booking' && (

                                  <button

                                    onClick={(e) => {

                                      e.stopPropagation();

                                      setQuickActionMenuId(null);

                                      setConfirmAction('no_show');

                                      setConfirmAppointmentId(appointment.id);

                                      setShowConfirmDialog(true);

                                    }}

                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"

                                  >

                                    客戶未到

                                  </button>

                                )}

                                <button

                                  onClick={(e) => {

                                    e.stopPropagation();

                                    setQuickActionMenuId(null);

                                    setExtendAppointmentId(appointment.id);

                                    setShowExtendModal(true);

                                  }}

                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"

                                >

                                  {appointment.service_info?.category === 'activity' ? '延長活動時間' : '延長服務時間'}

                                </button>

                              </div>

                            </div>

                          )}

                        </div>

                      )}



                      <div className="flex-1 flex justify-between items-start">
                         <div className="flex-1">
                           {/* Row 1: [Avatar] [DisplayTime] [VIP Badge] */}
                           <div className="flex items-center gap-2 mb-2">
                             {appointment.service_info?.category === 'activity' && (
                               <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                               </svg>
                             )}
                             {appointment.service_info?.category === 'booking' && (
                               <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                               </svg>
                             )}
                             <span className={`text-lg font-bold ${
                              appointment.service_info?.category === 'activity' ? 'text-gray-600 font-normal' : ''
                            }`}>{getTimeFromSchedule(appointment)}</span>
                             {appointment.service_info?.category === 'booking' && appointment.tags && appointment.tags.includes("VIP") && <span className="text-xs font-bold px-2 py-0.5 rounded text-white bg-gray-900">VIP</span>}
                             {isCrossDayBooking(appointment) && (() => {
                               const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                               const startDate = new Date(appointment.start_time);
                               const startDateString = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
                               return dateString !== startDateString;
                             })() && <span className="text-xs font-bold px-2 py-0.5 rounded text-white bg-gray-900">續前日</span>}
                           </div>

                           {/* Row 2: [CustomerName] [BlacklistBadge] [ServiceBadge] */}
                           <div className="flex items-baseline space-x-2 mb-2">
                             <h3 className={`${
                               appointment.service_info?.category === 'activity' ? 'text-gray-600 font-light' : 'text-gray-900 font-medium'
                             }`}>{appointment.service_info?.category === 'activity' ? appointment.service_info?.name || '未指定服務' : appointment.customer_name || '無名稱'}</h3>
                             {/* 🛠️ 排程名片強制標記 - 黑名單標籤 */}
                             {blacklistSet.has(appointment.customer_phone) && (
                               <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                 <AlertTriangle className="w-3 h-3" />
                                 🚫 黑名單
                               </span>
                             )}
                             {appointment.service_info?.category === 'booking' && (
                               <span className={getServiceTypeColor(appointment.serviceType, appointment.tags)}>
                                 {appointment.service}
                               </span>
                             )}
                           </div>

                           {/* Row 3: [Duration] */}
                           <div className="flex items-center space-x-2 text-sm">
                             {appointment.duration && (
                               <span className="text-gray-500">{appointment.duration}分鐘</span>
                             )}
                             {appointment.service_info?.category === 'booking' && !appointment.duration && (
                               <span className="text-gray-600">{appointment.remainingTime}</span>
                             )}
                             {appointment.service_info?.category === 'activity' && appointment.aiNotes && (
                               <span className="text-gray-500">{appointment.aiNotes}</span>
                             )}
                           </div>
                         </div>

                         <div className="flex items-center gap-2">
                           {!isFinished && !isActive && (
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 openEditDialog(appointment);
                               }}
                               className="text-xs text-gray-400 hover:text-gray-600"
                             >
                               編輯
                             </button>
                           )}
                         </div>
                      </div>



                      {/* 底部區域：倒數計時和進度條 */}

                      {isActive && (

                        <div className="mt-4 pt-4 border-t border-gray-100">

                          <div className="flex justify-between items-center mb-2">

                            <div className="text-xs text-gray-400">

                              {startDateTime.format('YYYY-MM-DD') !== endDateTime.format('YYYY-MM-DD') && dayjs(currentDate).format('YYYY-MM-DD') === startDateTime.format('YYYY-MM-DD')

                                ? `預計 ${endDateTime.format('M月D日')} 週${['日', '一', '二', '三', '四', '五', '六'][endDateTime.day()]} ${endDateTime.format('HH:mmA')} 結束`

                                : `預計 ${endDateTime.format('HH:mmA')} 結束`}

                            </div>

                            {renderCountdown()}

                          </div>

                          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">

                            <div

                              className="h-full bg-red-500 transition-all duration-1000"

                              style={{ width: `${((nowDateTime.valueOf() - startDateTime.valueOf()) / (endDateTime.valueOf() - startDateTime.valueOf())) * 100}%` }}

                            />

                          </div>

                        </div>

                      )}

                    </div>

                  </div>



                  {/* 休息空檔標籤：只有當 gap > 0 時才顯示 */}

                  {gap > 0 && (

                    <div className="flex items-center py-2 ml-20 opacity-40 group">

                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-3" />

                      <div className="flex flex-col items-center">

                        <span className="text-xs tracking-widest text-gray-500 uppercase">

                          休憩 {gap} 分鐘

                        </span>

                      </div>

                      <div className="ml-4 flex-1 h-[1px] bg-gray-100" />

                    </div>

                  )}

                </React.Fragment>

                );

              })}

              

              {/* 最後一個預約下方的加號按鈕 */}

              {!isPastDate && (

                <div className="flex justify-end mt-4">

                  <button

                    onClick={() => {

                      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

                      

                      // 計算建議時間：該日期最後一筆預約結束時間 + 10 分鐘

                      const dayAppointments = appointments.filter(app => app.date === dateStr && app.category === 'booking');

                      let suggestedTime = '09:00'; // 預設 9:00

                      

                      if (dayAppointments.length > 0) {

                        const lastAppointment = dayAppointments.sort((a, b) => {

                          const timeA = getTimeFromSchedule(a);

                          const timeB = getTimeFromSchedule(b);

                          return timeB.localeCompare(timeA);

                        })[0];

                        const timeStr = getTimeFromSchedule(lastAppointment);

                        const [hours, minutes] = timeStr.split(':').map(Number);

                        const lastAppointmentTime = new Date(dateStr);

                        lastAppointmentTime.setHours(hours, minutes, 0, 0);

                        

                        const duration = parseRemainingTime(lastAppointment.remainingTime);

                        const endTime = new Date(lastAppointmentTime.getTime() + duration * 60000);

                        endTime.setMinutes(endTime.getMinutes() + 10);

                        

                        const suggestedHours = String(endTime.getHours()).padStart(2, '0');

                        const suggestedMinutes = String(endTime.getMinutes()).padStart(2, '0');

                        suggestedTime = `${suggestedHours}:${suggestedMinutes}`;

                      }

                      

                      updateDialogFormState({ date: dateStr, time: suggestedTime });

                      setTimeWarning({ type: 'none' });

                      setShowAddDialog(true);

                    }}

                    className="text-gray-400 hover:text-gray-600 transition-colors"

                  >

                    <Plus className="w-6 h-6" />

                  </button>

                </div>

              )}



              {/* 下班倒數彩蛋 */}

              {!isPastDate && dayAppointments.length > 0 && (() => {

                const lastAppointment = dayAppointments[dayAppointments.length - 1];

                

                // 使用完整的日期時間來計算，支援跨日訂單

                const nowDateTime = dayjs().tz('Asia/Taipei');

                const endDateTime = dayjs(lastAppointment.end_time).tz('Asia/Taipei');

                

                // 計算剩餘分鐘數

                const totalRemainingMin = endDateTime.diff(nowDateTime, 'minute');

                

                if (totalRemainingMin <= 0) return null;



                return (

                  <div className="mt-6 text-center py-4 bg-gray-50 rounded-lg border border-gray-100">

                    <p className="text-sm text-gray-500">

                      辛苦了，再 <span className="font-mono font-bold text-gray-900">{totalRemainingMin}</span> 分鐘就下班

                    </p>

                  </div>

                );

              })()}

          {/* 已刪除預約復原區 - 動態跟隨最後一筆訂單 */}
          {deletedAppointments.length > 0 && (
            <div className="mt-6">
              <div className="bg-zinc-100 rounded-xl p-4 border border-dashed border-zinc-300">
                <button
                  onClick={() => setShowDeletedAppointments(!showDeletedAppointments)}
                  className="w-full flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-600">已刪除的預約及活動（最近5筆）</span>
                    <span className="text-xs text-zinc-500">可點擊復原</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${showDeletedAppointments ? 'rotate-180' : ''}`} />
                </button>
                {showDeletedAppointments && (
                  <div className="mt-3 bg-white border border-zinc-200 rounded-lg p-3">
                    <div className="space-y-2">
                      {deletedAppointments.map((app) => (
                        <div
                          key={app.id}
                          className="flex items-center justify-between p-2 bg-zinc-50 border border-zinc-200 rounded hover:bg-zinc-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getServiceTypeDotColor(app.serviceType)}`}></div>
                            <span className="text-sm font-medium text-zinc-700">{app.customerName || '未知顧客'}</span>
                            <span className="text-xs text-zinc-500">{app.serviceAbbr}</span>
                            <span className="text-xs text-zinc-400">{app.date} {getTimeFromSchedule(app)}</span>
                          </div>
                          <button
                            onClick={() => handleRestoreDeletedAppointment(app)}
                            disabled={isAppointmentExpired(app)}
                            className={`text-xs font-medium ${
                              isAppointmentExpired(app)
                                ? 'text-zinc-400 cursor-not-allowed'
                                : 'text-green-600 hover:text-green-700'
                            }`}
                          >
                            {isAppointmentExpired(app) ? '已過期' : '復原'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          </div>

        ) : (

          <div className="text-center py-12 text-gray-400">

            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />

            <div>本日沒有預約</div>

          </div>

        )}

      </div>

    );

  };



  return (

    <div className="space-y-4">

      <style>{errorFlashAnimation}</style>

      {/* 最穩定的倒數計時組件 */}

      <CountdownBar appointments={appointments} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">排程管理</h2>

          <p className="text-gray-500 mt-1 text-sm hidden sm:block">查看今日預約與工作進度。</p>

          <p className="text-slate-600 mt-2 text-sm sm:text-base font-medium">{(() => {

            const hour = currentTime.getHours();

            const { totalApps, progress } = headerData;



            // 根據時段獲取問候語

            const getGreeting = () => {

              if (hour >= 5 && hour < 12) return '早安';

              if (hour >= 12 && hour < 18) return '午安';

              if (hour >= 18 && hour < 22) return '晚安';

              return '深夜好';

            };



            const greeting = getGreeting();



            if (totalApps === 0) {

              return `${greeting}！今天沒有預約安排。`;

            }



            if (hour >= 5 && hour < 12) {

              return `早安！今天共有 ${totalApps} 筆預約，祝您有美好的一天。`;

            } else if (hour >= 12 && hour < 20) {

              if (progress === 100) {

                if (!completionMessage) {

                  const completionMessages = [

                    "你已經將所有預約都解決掉了,真棒！",

                    "所有預約都完成了，辛苦啦！",

                    "今天的任務全部完成，表現優異！",

                    "預約全部搞定，可以好好休息了～"

                  ];

                  // 使用確定性方法選擇訊息（基於日期）

                  const today = new Date();

                  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);

                  const messageIndex = dayOfYear % completionMessages.length;

                  setCompletionMessage(completionMessages[messageIndex]);

                }

                return completionMessage;

              }

              return `辛苦了，目前進度已完成 ${progress}%，加油！`;

            } else {

              return `深夜好，為您準備好明日的排程預覽。`;

            }

          })()}</p>

        </div>

      </div>



      <div className="bg-[#F9FAFB] rounded-xl p-4 sm:p-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">

          <div className="flex items-center gap-2">

            {/* Year Selector */}

            <div className="relative" ref={yearDropdownRef}>

              <button

                onClick={() => setShowYearDropdown(!showYearDropdown)}

                className="flex items-center gap-1 text-lg sm:text-xl font-semibold text-gray-900 hover:bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all hover:-translate-y-0.5"

              >

                {currentDate.getFullYear()}年

                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />

              </button>

              {showYearDropdown && (

                <div className="absolute top-full left-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-2xl z-10 max-h-48 overflow-y-auto hide-scrollbar">

                  {years.map((year) => (

                    <button

                      key={year}

                      onClick={() => handleYearChange(year)}

                      className={`block w-full px-4 py-2 text-left transition-colors ${

                        year === currentDate.getFullYear()

                          ? 'bg-white text-black font-bold'

                          : 'text-gray-300 hover:bg-white/10'

                      }`}

                    >

                      {year}

                    </button>

                  ))}

                </div>

              )}

            </div>



            {/* Month Selector */}

            <div className="relative" ref={monthDropdownRef}>

              <button

                onClick={() => setShowMonthDropdown(!showMonthDropdown)}

                className="flex items-center gap-1 text-lg sm:text-xl font-semibold text-gray-900 hover:bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all hover:-translate-y-0.5"

              >

                {currentDate.getMonth() + 1}月

                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />

              </button>

              {showMonthDropdown && (

                <div className="absolute top-full left-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-2xl z-10 max-h-48 overflow-y-auto hide-scrollbar">

                  {months.map((month, index) => (

                    <button

                      key={month}

                      onClick={() => handleMonthChange(index)}

                      className={`block w-full px-4 py-2 text-left transition-colors ${

                        index === currentDate.getMonth()

                          ? 'bg-white text-black font-bold'

                          : 'text-gray-300 hover:bg-white/10'

                      }`}

                    >

                      {month}

                    </button>

                  ))}

                </div>

              )}

            </div>

          </div>



          <div className="flex items-center gap-3">

            {/* 視圖切換 Segmented Control - 黑底風格帶滑動動畫 */}

            <div className="relative flex items-center bg-black rounded-lg p-1 shadow-inner">

              <div

                className={`absolute h-[calc(100%-8px)] bg-white rounded-md shadow-sm transition-all duration-300 ease-out ${

                  viewMode === "day" ? "left-1 w-[calc(33.33%-8px)]" :

                  viewMode === "week" ? "left-[33.33%] w-[calc(33.33%-8px)]" :

                  "left-[66.66%] w-[calc(33.33%-8px)]"

                }`}

              />

              <button

                onClick={() => setViewMode("day")}

                className={`relative z-10 px-4 py-1.5 text-sm rounded-md transition-all ${

                  viewMode === "day" ? "text-black font-bold" : "text-gray-400 hover:text-gray-200"

                }`}

              >

                日

              </button>

              <button

                onClick={() => setViewMode("week")}

                className={`relative z-10 px-4 py-1.5 text-sm rounded-md transition-all ${

                  viewMode === "week" ? "text-black font-bold" : "text-gray-400 hover:text-gray-200"

                }`}

              >

                週

              </button>

              <button

                onClick={() => setViewMode("month")}

                className={`relative z-10 px-4 py-1.5 text-sm rounded-md transition-all ${

                  viewMode === "month" ? "text-black font-bold" : "text-gray-400 hover:text-gray-200"

                }`}

              >

                月

              </button>

            </div>



            <button

              onClick={handleToday}

              className="flex items-center gap-2 px-4 py-2 border-2 border-black rounded-lg font-bold hover:bg-black hover:text-white transition-colors"

            >

              <MapPin className="w-4 h-4" />

              今天

            </button>

          </div>

        </div>



        {/* Loading Spinner */}

        {isLoadingAppointments && (

          <div className="flex items-center justify-center h-[calc(100vh-200px)]">

            <div className="flex flex-col items-center gap-3">

              <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />

              <p className="text-sm text-gray-500">載入中...</p>

            </div>

          </div>

        )}



        {/* 根據視圖模式渲染不同內容 */}

        {!isLoadingAppointments && viewMode === "day" && <div key={appointments.length > 0 ? 'has-data' : 'no-data'} className="h-[calc(100vh-200px)] w-full">{renderDayView()}</div>}

        {!isLoadingAppointments && viewMode === "week" && <div key={appointments.length > 0 ? 'has-data' : 'no-data'} className="h-[calc(100vh-200px)] w-full">{renderWeekView()}</div>}

        {viewMode === "month" && (

          <>

            

            <div className="bg-amber-50/50 rounded-lg p-3 text-center">

              <p className="text-sm text-amber-800 leading-relaxed">

                💡 提示：<span className="font-bold">點擊</span>日期格右下角的<span className="font-bold">黑色加號</span>可新增服務項目，<span className="font-bold">點擊</span>預約卡片可查看詳情，<span className="font-bold">切換到日模式</span>可修改訂單詳細資料

              </p>

            </div>

            <div className="grid grid-cols-7 gap-2 rounded-lg overflow-hidden">

              {["日", "一", "二", "三", "四", "五", "六"].map((day) => (

                <div key={day} className="bg-gray-50 p-2 text-center text-sm font-bold text-gray-900 uppercase">

                  {day}

                </div>

              ))}

              {renderCalendarDays()}

            </div>

          </>

        )}

      </div>



      {/* 今日時間軸 - 極簡摘要型（只在月視圖和週視圖顯示） */}

      {viewMode !== "day" && (

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">

          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowTimeline(!showTimeline)}>

            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">

              <Calendar className="w-5 h-5" />

              {currentDate.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })} 剩餘預約及活動

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

                const todayApps = currentDayAppointments;

                

                // 過濾掉續前日的訂單，只保留當日開始的訂單

                const todayStartedApps = todayApps.filter(app => {

                  if (!app.start_time || !app.end_time) return false;

                  if (isCrossDayBooking(app)) {

                    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

                    const startDate = new Date(app.start_time as string);

                    const startDateString = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;

                    return dateString === startDateString;

                  }

                  return true;

                });

                

                if (todayStartedApps.length > 0 && todayStartedApps[0].start_time) {

                  const firstTimeStr = getTimeFromSchedule(todayStartedApps[0]);

                  const [firstHours, firstMinutes] = firstTimeStr.split(':').map(Number);

                  const firstAppointmentMinutes = firstHours * 60 + firstMinutes;

                  

                  // 計算時間差，支持顯示未來和已過去的預約

                  const diffMinutes = firstAppointmentMinutes - currentMinutes;

                  const diffMs = diffMinutes * 60 * 1000; // 轉換為毫秒

                  const currentTimeStr = currentTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });

                  

                  // 只有在預約未開始時顯示距離提示

                  if (diffMinutes > 0) {

                    return (

                      <div className="mb-3 bg-gray-100 border border-gray-200 rounded-xl p-3 shadow-sm">

                        <div className="text-base font-bold text-gray-900">

                          現在是 {currentTime.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })} ({currentTime.toLocaleDateString('zh-TW', { weekday: 'short' })}) {currentTimeStr}

                        </div>

                        <div className="text-gray-600 text-sm mt-1">

                          您距離第一筆預約 (<span className="text-green-600 font-medium">{getTimeFromSchedule(todayStartedApps[0])}</span>) 還有 <span className="text-green-600 font-bold">{formatTimeUntilAppointment(diffMs)}</span>。

                        </div>

                      </div>

                    );

                  }

                }

                return null;

              })()}



              <div className="space-y-2">

                {currentDayAppointments

                  .filter((app) => {

                    // 如果預約已標記為完成，不顯示在小時間軸

                    if (app.isFinished) return false;

                    

                    // 如果是續前日的訂單（跨日訂單且當前日期是結束日期），不顯示在小時間軸

                    if (isCrossDayBooking(app) && app.start_time) {

                      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

                      const startDate = new Date(app.start_time);

                      const startDateString = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;

                      if (dateString !== startDateString) return false;

                    }

                    

                    const timeStr = getTimeFromSchedule(app);

                    const [hours, minutes] = timeStr.split(':').map(Number);

                    const appointmentMinutes = hours * 60 + minutes;

                    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

                    

                    // 對於活動，檢查實際時間狀態，不顯示正在進行和已過去的活動

                    if (app.category === 'activity') {

                      // 檢查是否為當前選中日期
                      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                      const todayString = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')}`;
                      const isCurrentDate = dateString === todayString;

const duration = parseInt(app.duration) || parseRemainingTime(app.remainingTime);
                      const endMinutes = appointmentMinutes + duration;
                      // 非今天的日期，檢查是否為未來日期
                      const selectedDateStart = new Date(currentDate);
                      selectedDateStart.setHours(0, 0, 0, 0);
                      const todayDateStart = new Date(currentTime);
                      todayDateStart.setHours(0, 0, 0, 0);
                      
                      // 如果選中的日期是未來日期，顯示所有活動
                      // 如果選中的日期是過去日期，不顯示任何活動
                      return selectedDateStart >= todayDateStart;
                    }

                    

                    // 對於預約，使用時間判斷，但要確保是當前選中日期且未過去

                    // 檢查是否為當前選中日期
                    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                    const todayString = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')}`;
                    const isCurrentDate = dateString === todayString;
                    
                    // 如果是今天，過濾已過去的時間；如果不是今天，顯示所有預約
                    if (isCurrentDate) {
                      return appointmentMinutes >= currentMinutes;
                    } else {
                      // 非今天的日期，檢查是否為未來日期
                      const selectedDateStart = new Date(currentDate);
                      selectedDateStart.setHours(0, 0, 0, 0);
                      const todayDateStart = new Date(currentTime);
                      todayDateStart.setHours(0, 0, 0, 0);
                      
                      // 如果選中的日期是未來日期，顯示所有預約
                      // 如果選中的日期是過去日期，不顯示任何預約
                      return selectedDateStart >= todayDateStart;
                    }

                  })

                  .sort((a, b) => {

                    const timeA = getTimeFromSchedule(a);

                    const timeB = getTimeFromSchedule(b);

                    return timeA.localeCompare(timeB);

                  })

                  .map((appointment, index, array) => {

                    const isNext = index === 0;

                    const currentDateStart = new Date(currentDate);

                    currentDateStart.setHours(0, 0, 0, 0);

                    const currentTimeStart = new Date(currentTime);

                    currentTimeStart.setHours(0, 0, 0, 0);

                    const isPastDate = currentDateStart < currentTimeStart;

                    return (

                      <div key={appointment.id}>

                        <div

                          onClick={() => handleTimelineAppointmentClick(appointment)}

                          className={`flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors cursor-pointer text-sm ${isNext ? 'bg-gray-100 border border-gray-300' : ''}`}

                        >

                          {isNext && (

                            <span className="text-xs font-bold text-gray-900 bg-gray-200 px-2 py-0.5 rounded">

                              Next

                            </span>

                          )}

                          <span className={`font-bold min-w-[50px] ${isNext ? 'text-gray-900' : 'text-gray-900'}`}>{appointment.schedule?.start || '00:00'}</span>

                          <span className={`flex-1 ${isNext ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>{appointment.service_info?.category === 'activity' ? appointment.service_info?.name || appointment.service : (appointment.customer_name || appointment.customerName || '未知顧客')}</span>

                          <span className={`text-gray-500`}>{appointment.serviceAbbr}</span>

                        </div>

                      </div>

                    );

                  })}

                {currentDayAppointments.filter((app) => {

                  const timeStr = getTimeFromSchedule(app);

                  const [hours, minutes] = timeStr.split(':').map(Number);

                  const appointmentMinutes = hours * 60 + minutes;

                  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

                  

                  // 對於活動，檢查實際時間狀態，不顯示正在進行和已過去的活動

                  if (app.category === 'activity') {

                    // 使用與預約相同的時間判斷邏輯

                    const appointmentMinutes = hours * 60 + minutes;

                    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

                    

                    // 計算活動結束時間

                    const duration = parseInt((app as any).duration) || parseRemainingTime(app.remainingTime);

                    const endMinutes = appointmentMinutes + duration;

                    

                    // 如果活動已經開始或已經結束，不顯示在小時間軸

                    // 只顯示還未開始的未來活動

                    return currentMinutes < appointmentMinutes;

                  }

                  

                  // 對於預約，使用時間判斷

                  return appointmentMinutes >= currentMinutes;

                }).length === 0 && (

                  <div className="text-center py-4 text-sm text-gray-400">

                    此日期已無剩餘預約及活動

                  </div>

                )}

              </div>

            </div>

          )}

          {/* 已刪除預約復原區 - 動態跟隨月視圖時間軸 */}
          {deletedAppointments.length > 0 && (
            <div className="mt-4 border-t border-zinc-200 pt-4">
              <div className="bg-zinc-100 rounded-xl p-4 border border-dashed border-zinc-300">
                <button
                  onClick={() => setShowDeletedAppointments(!showDeletedAppointments)}
                  className="w-full flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-600">已刪除的預約及活動（最近5筆）</span>
                    <span className="text-xs text-zinc-500">可點擊復原</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${showDeletedAppointments ? 'rotate-180' : ''}`} />
                </button>
                {showDeletedAppointments && (
                  <div className="mt-3 bg-white border border-zinc-200 rounded-lg p-3">
                    <div className="space-y-2">
                      {deletedAppointments.map((app) => (
                        <div
                          key={app.id}
                          className="flex items-center justify-between p-2 bg-zinc-50 border border-zinc-200 rounded hover:bg-zinc-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getServiceTypeDotColor(app.serviceType)}`}></div>
                            <span className="text-sm font-medium text-zinc-700">{app.customerName || '未知顧客'}</span>
                            <span className="text-xs text-zinc-500">{app.serviceAbbr}</span>
                            <span className="text-xs text-zinc-400">{app.date} {getTimeFromSchedule(app)}</span>
                          </div>
                          <button
                            onClick={() => handleRestoreDeletedAppointment(app)}
                            disabled={isAppointmentExpired(app)}
                            className={`text-xs font-medium ${
                              isAppointmentExpired(app)
                                ? 'text-zinc-400 cursor-not-allowed'
                                : 'text-green-600 hover:text-green-700'
                            }`}
                          >
                            {isAppointmentExpired(app) ? '已過期' : '復原'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      )}



      


      {/* 側邊戰情欄 - 預約詳情 */}

      <Sheet open={showSheet} onOpenChange={setShowSheet}>

        <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto hide-scrollbar bg-gray-50 border-0">

          {selectedAppointment && (

            <>

              <SheetHeader className="mb-8 pt-6">

                <div className="flex items-center justify-between mb-6">

                  <SheetTitle className="text-2xl font-bold text-gray-900">顧客詳情</SheetTitle>

                  <button

                    onClick={() => setShowSheet(false)}

                    className="p-2 hover:bg-gray-200 rounded-full transition-all hover:scale-110"

                  >

                    <X className="w-5 h-5 text-gray-600" />

                  </button>

                </div>

                <SheetDescription className="sr-only">查看顧客詳細資訊</SheetDescription>

              </SheetHeader>



              <div className="space-y-6">

                {/* 客戶大頭貼區塊 */}

                <div className="bg-white rounded-3xl p-6 shadow-sm">

                  {isLoadingCustomer ? (

                    <div className="space-y-4">

                      <div className="flex items-center gap-4">

                        <div className="w-16 h-16 bg-gray-200 rounded-2xl animate-pulse" />

                        <div className="flex-1 space-y-2">

                          <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />

                          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />

                        </div>

                      </div>

                      <div className="grid grid-cols-3 gap-3">

                        <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />

                        <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />

                        <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />

                      </div>

                    </div>

                  ) : (

                    <>

                      <div className="flex items-center gap-4 mb-6">

                        <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center text-2xl font-bold">

                          {selectedAppointment?.category === 'activity' ? '活' : (selectedCustomer?.basic_info?.name?.charAt(0) || selectedAppointment.customer_name?.charAt(0) || selectedAppointment.customerName?.charAt(0) || '客')}

                        </div>

                        <div className="flex-1">

                          <div className="flex items-center gap-2">

                            <h3 className="text-xl font-bold text-gray-900">{selectedAppointment?.category === 'activity' ? selectedAppointment.service_info?.name || '未指定服務' : (selectedCustomer?.basic_info?.name || selectedAppointment.customer_name || '未知顧客')}</h3>

                            {selectedCustomer?.marketing_data?.is_blacklisted && (

                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-900 bg-red-100 rounded-full">

                                <AlertCircle className="w-3.5 h-3.5" />

                                黑名單 ({selectedCustomer.spending_stats?.no_show_count || 0}次未到)

                              </span>

                            )}

                          </div>

                          <p className="text-sm text-gray-500 mt-1">{selectedAppointment.service_info?.name || '未指定服務'}</p>

                        </div>

                      </div>



                  {/* CRM 統計資訊 */}

                  {selectedCustomer && (

                    <div className="grid grid-cols-3 gap-3 mb-6">

                      <div className="bg-gray-50 rounded-xl p-3 text-center">

                        <p className="text-lg font-bold text-gray-900">{selectedCustomer.spending_stats?.total_bookings || 0}</p>

                        <p className="text-xs text-gray-500">總預約</p>

                      </div>

                      <div className="bg-gray-50 rounded-xl p-3 text-center">

                        <p className="text-lg font-bold text-gray-900">{selectedCustomer.spending_stats?.no_show_count || 0}</p>

                        <p className="text-xs text-gray-500">未到次數</p>

                      </div>

                      <div className="bg-gray-50 rounded-xl p-3 text-center">

                        <p className="text-lg font-bold text-gray-900">${selectedCustomer.spending_stats?.total_spending || 0}</p>

                        <p className="text-xs text-gray-500">總消費</p>

                      </div>

                    </div>

                  )}



                  {/* 膠囊標籤 - 從 shop_customers_v3 表讀取 */}

                  {(selectedCustomer?.marketing_data?.tags || selectedAppointment.tags || []).length > 0 && (

                    <div className="flex flex-wrap gap-2 mb-6">

                      {(selectedCustomer?.marketing_data?.tags || selectedAppointment.tags || []).map((tag: string) => (

                        <span

                          key={tag}

                          className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full ${

                            tag === 'VIP'

                              ? 'bg-amber-100 text-amber-800'

                              : tag === '新客'

                              ? 'bg-blue-100 text-blue-800'

                              : 'bg-gray-100 text-gray-800'

                          }`}

                        >

                          {tag}

                        </span>

                      ))}

                    </div>

                  )}



                  {/* 聯絡方式 */}

                  <div className="space-y-3">

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">

                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">

                        <PhoneIcon className="w-5 h-5 text-white" />

                      </div>

                      <div className="flex-1">

                        <p className="text-xs text-gray-500 mb-0.5">電話</p>

                        <p className="text-sm font-medium text-gray-900">{selectedCustomer?.phone || selectedAppointment.phone || '未提供'}</p>

                      </div>

                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">

                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">

                        <MailIcon className="w-5 h-5 text-white" />

                      </div>

                      <div className="flex-1">

                        <p className="text-xs text-gray-500 mb-0.5">電子信箱</p>

                        <p className="text-sm font-medium text-gray-900">{selectedCustomer?.email || selectedAppointment.email || '未提供'}</p>

                      </div>

                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">

                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">

                        <Clock className="w-5 h-5 text-white" />

                      </div>

                      <div className="flex-1">

                        <p className="text-xs text-gray-500 mb-0.5">預約時間</p>

                        <p className="text-sm font-medium text-gray-900">{selectedAppointment.date} {getTimeFromSchedule(selectedAppointment)}{selectedAppointment.duration && ` (${selectedAppointment.duration} 分鐘)`}</p>

                      </div>

                    </div>

                  </div>

                </>

                  )}

                </div>





                {/* AI 備註區塊 */}

                {selectedAppointment.aiNotes && (

                  <div className="bg-white rounded-3xl p-6 shadow-sm">

                    <div className="flex items-center gap-2 mb-3">

                      <FileText className="w-5 h-5 text-gray-600" />

                      <h4 className="text-sm font-bold text-gray-900">AI 備註</h4>

                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed">

                      {selectedAppointment.aiNotes}

                    </p>

                  </div>

                )}



                {/* 歷史紀錄區塊 */}

                {(selectedAppointment.history || []).length > 0 && (

                  <div className="bg-white rounded-3xl p-6 shadow-sm">

                    <div className="flex items-center gap-2 mb-4">

                      <CreditCard className="w-5 h-5 text-gray-600" />

                      <h4 className="text-sm font-bold text-gray-900">歷史紀錄</h4>

                    </div>

                    <div className="space-y-3">

                      {selectedAppointment.history.map((record, index) => (

                        <div

                          key={index}

                          className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"

                        >

                          <div>

                            <p className="text-sm font-semibold text-gray-900">{record.service}</p>

                            <p className="text-xs text-gray-500 mt-1">{record.date}</p>

                          </div>

                          <span className="text-xs font-medium bg-black text-white px-3 py-1.5 rounded-full">

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



      {/* 新增預約/活動 Dialog */}

      <Dialog open={showAddDialog} onOpenChange={(open) => {

        setShowAddDialog(open);

        if (open) {

          resetDialogState();

        }

      }}>

        <DialogContent className="bg-white h-auto max-h-[90vh] w-[95%] max-w-[550px] rounded-3xl shadow-2xl my-8 p-8 flex flex-col border-0 backdrop-blur-sm">

          <DialogHeader className="mb-6">

            <div className="flex items-center gap-3">

              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">

                <CalendarPlus className="w-6 h-6 text-white" />

              </div>

              <DialogTitle className="text-2xl font-bold text-gray-900">新增項目</DialogTitle>

            </div>

            <DialogDescription className="sr-only">新增預約或活動到行事曆</DialogDescription>

          </DialogHeader>

          <div className="flex-1 overflow-y-auto my-4 px-1 hide-scrollbar custom-scrollbar">

            <div className="space-y-5 py-2">

            {/* 切換開關 */}

            <CategoryToggle category={dialogFormState.category} onChange={(cat) => updateDialogFormState({ category: cat })} />

            <div className="space-y-2">

              <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">{formFieldsVisibility.customerLabel} <span className="text-red-600 font-bold">*</span></Label>

              <Input

                id="customerName"

                value={dialogFormState.customerName}

                onChange={(e) => updateDialogFormState({ customerName: e.target.value })}

                placeholder={formFieldsVisibility.customerPlaceholder}

                className={`h-12 bg-gray-50 border-0 rounded-xl text-base focus:ring-2 focus:ring-black ${errorFields.has("customerName") ? "error-flash" : ""}`}

              />

            </div>

            {formFieldsVisibility.showCustomerFields && (

              <div className="space-y-4">

                <div className="space-y-2">

                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">

                    聯絡電話 <span className="text-red-500">*</span>

                  </Label>

                  <Input

                    ref={customerInfoRef}

                    id="phone"

                    type="text"

                    value={dialogFormState.phone}

                    onChange={(e) => {

                      // 只允許輸入數字

                      const value = e.target.value.replace(/[^\d]/g, '');

                      updateDialogFormState({ phone: value });

                      checkCustomerBlacklist(value);

                    }}

                    placeholder="請輸入電話號碼"

                    className={`h-12 bg-gray-50 border-0 rounded-xl text-base focus:ring-2 focus:ring-black ${errorFields.has("phone") ? "error-flash" : ""}`}

                  />

                  {/* 黑名單警告 */}

                  {blacklistWarning.isBlacklisted && (

                    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">

                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />

                      <div className="flex-1">

                        <p className="text-sm font-medium text-red-900">⚠️ 此顧客已被列入黑名單</p>

                        <p className="text-xs text-red-700">歷史原因：{blacklistWarning.reason || '客戶未到'}</p>

                      </div>

                    </div>

                  )}

                </div>

                <div className="space-y-2">

                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">電子信箱（選填）</Label>

                  <Input

                    id="email"

                    type="email"

                    value={dialogFormState.email}

                    onChange={(e) => updateDialogFormState({ email: e.target.value })}

                    placeholder="請輸入電子信箱"

                    className="h-12 bg-gray-50 border-0 rounded-xl text-base focus:ring-2 focus:ring-black"

                  />

                </div>

              </div>

            )}

            {formFieldsVisibility.showCustomerFields && (

              <div className="space-y-2">

                <Label htmlFor="tags" className="text-sm font-medium text-gray-700">顧客標籤（選填）</Label>

                <TagButtons tags={dialogFormState.tags} onToggle={(tag: string) => {

                  updateDialogFormState({ 

                    tags: dialogFormState.tags.includes(tag)

                      ? dialogFormState.tags.filter(t => t !== tag)

                      : [...dialogFormState.tags, tag]

                  });

                }} />

                <div className="flex gap-2">

                  <input

                    type="text"

                    placeholder="新增自定義標籤"

                    className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"

                    onKeyDown={(e) => {

                      if (e.key === 'Enter') {

                        const customTag = e.currentTarget.value.trim();

                        if (customTag && !dialogFormState.tags.includes(customTag)) {

                          updateDialogFormState({ tags: [...dialogFormState.tags, customTag] });

                          if (customTag === '黑名單') {

                            setBlacklistWarning({ isBlacklisted: true, reason: '手動標記' });

                          }

                          e.currentTarget.value = '';

                        }

                      }

                    }}

                  />

                  <button

                    type="button"

                    onClick={(e) => {

                      e.preventDefault();

                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;

                      const customTag = input.value.trim();

                      if (customTag && !dialogFormState.tags.includes(customTag)) {

                        updateDialogFormState({ tags: [...dialogFormState.tags, customTag] });

                        if (customTag === '黑名單') {

                          setBlacklistWarning({ isBlacklisted: true, reason: '手動標記' });

                        }

                        input.value = '';

                      }

                    }}

                    className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"

                  >

                    +

                  </button>

                </div>

              </div>

            )}

            {formFieldsVisibility.showServiceField && (

              <div className="space-y-2">

                <Label htmlFor="service" className="text-sm font-medium text-gray-700">服務名稱 <span className="text-red-600 font-bold">*</span></Label>

                <Select

                  value={dialogFormState.service}

                  onValueChange={(value) => {

                    const selectedService = services.find(s => s.name === value);

                    if (selectedService) {

                      updateDialogFormState({ 

                        service: selectedService.name,

                        duration: selectedService.duration.toString(),

                        price: selectedService.price.toString(),

                        serviceType: selectedService.category as 'nail' | 'eyelash' | 'hair' | 'other'

                      });

                    }

                  }}

                  disabled={isLoadingSettings || services.length === 0}

                >

                  <SelectTrigger className="h-12 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-black">

                    <SelectValue placeholder={isLoadingSettings ? "載入中..." : services.length === 0 ? "請先在設定中新增服務項目" : "選擇服務項目"} />

                  </SelectTrigger>

                  <SelectContent>

                    {services.map((service) => (

                      <SelectItem key={service.id} value={service.name}>

                        {service.name} ({service.duration}分鐘) - NT${service.price}

                      </SelectItem>

                    ))}

                  </SelectContent>

                </Select>

              </div>

            )}

            <div className="space-y-2">

              <Label htmlFor="date" className="text-sm font-medium text-gray-700">日期 <span className="text-red-600 font-bold">*</span></Label>

              <Input

                id="date"

                type="date"

                value={dialogFormState.date}

                onChange={(e) => updateDialogFormState({ date: e.target.value })}

                className={`h-12 bg-gray-50 border-0 rounded-xl text-base focus:ring-2 focus:ring-black ${errorFields.has("date") ? "error-flash" : ""}`}

              />

            </div>

            <div className="space-y-2">

              <Label htmlFor="time" className="text-sm font-medium text-gray-700">{formFieldsVisibility.timeLabel} <span className="text-red-600 font-bold">*</span></Label>

              <TimePicker

                value={dialogFormState.time}

                onChange={(time) => updateDialogFormState({ time })}

                className={errorFields.has("time") ? "error-flash" : ""}

              />

              {/* 即時時間警告顯示 */}

              {timeWarning.type !== 'none' && (

                <div className={`flex items-center gap-2 p-4 rounded-xl ${

                  timeWarning.type === 'overlap' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'

                }`}>

                  <AlertCircle className={`w-5 h-5 flex-shrink-0 ${

                    timeWarning.type === 'overlap' ? 'text-red-600' : 'text-yellow-600'

                  }`} />

                  <p className={`text-sm ${

                    timeWarning.type === 'overlap' ? 'text-red-900' : 'text-yellow-900'

                  }`}>

                    {timeWarning.message}

                  </p>

                </div>

              )}

            </div>

            <div className="space-y-2">

              <Label htmlFor="duration" className="text-sm font-medium text-gray-700">{formFieldsVisibility.durationLabel} <span className="text-red-600 font-bold">*</span></Label>

              <Input

                id="duration"

                type="number"

                value={dialogFormState.duration}

                onChange={(e) => {

                  updateDialogFormState({ duration: e.target.value });

                  // 當 duration 改變時，重新計算 end_time（如果有開始時間）

                  if (dialogFormState.date && dialogFormState.time) {

                    const newDuration = parseInt(e.target.value) || 0;

                    const startDateTime = new Date(`${dialogFormState.date}T${dialogFormState.time}`);

                    const timezoneOffset = startDateTime.getTimezoneOffset() * 60000;

                    const endDateTime = new Date(startDateTime.getTime() + newDuration * 60000);

                    const end_time = new Date(endDateTime.getTime() - timezoneOffset).toISOString();

                    // 可以在這裡更新顯示的結束時間（如果需要顯示）

                  }

                }}

                placeholder={formFieldsVisibility.durationPlaceholder}

                className={`h-12 bg-gray-50 border-0 rounded-xl text-base focus:ring-2 focus:ring-black ${errorFields.has("duration") ? "error-flash" : ""}`}

              />

            </div>

            {formFieldsVisibility.showPriceField && (

              <div className="space-y-2">

                <Label htmlFor="price" className="text-sm font-medium text-gray-700">價格（選填）</Label>

                <Input

                  id="price"

                  type="number"

                  value={dialogFormState.price}

                  onChange={(e) => updateDialogFormState({ price: e.target.value })}

                  placeholder="請輸入價格"

                  className="h-12 bg-gray-50 border-0 rounded-xl text-base focus:ring-2 focus:ring-black"

                />

              </div>

            )}

            {formFieldsVisibility.showCustomerFields && (

              <div className="space-y-2">

                <Label htmlFor="staff" className="text-sm font-medium text-gray-700">服務人員（選填）</Label>

                <Select

                  value={dialogFormState.staffId}

                  onValueChange={(value) => updateDialogFormState({ staffId: value })}

                  disabled={isLoadingSettings || staff.length === 0}

                >

                  <SelectTrigger className="h-12 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-black">

                    <SelectValue placeholder={isLoadingSettings ? "載入中..." : staff.length === 0 ? "請先在設定中新增員工" : "選擇服務人員"} />

                  </SelectTrigger>

                  <SelectContent>

                    {staff.map((employee) => (

                      <SelectItem key={employee.id} value={employee.id}>

                        {employee.name} {employee.role ? `(${employee.role})` : ''}

                      </SelectItem>

                    ))}

                  </SelectContent>

                </Select>

              </div>

            )}

            {formFieldsVisibility.showNotesField && (

              <div className="space-y-2">

                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">備註（選填）</Label>

                <Input

                  id="notes"

                  type="text"

                  value={dialogFormState.notes}

                  onChange={(e) => updateDialogFormState({ notes: e.target.value })}

                  placeholder="請輸入備註"

                  className="h-12 bg-gray-50 border-0 rounded-xl text-base focus:ring-2 focus:ring-black"

                />

              </div>

            )}

            </div>

          </div>

          <DialogFooter className="pt-6 bg-white mt-auto gap-3 justify-center">

            <Button

              variant="ghost"

              onClick={() => setShowAddDialog(false)}

              className="flex-1 h-12 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-colors font-medium text-base"

            >

              取消

            </Button>

            <Button

              onClick={handleAddAppointment}

              className="flex-1 h-12 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors font-medium text-base"

            >

              確認新增

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>



      {/* 編輯預約/活動 Dialog */}

      <Dialog open={showEditDialog} onOpenChange={(open) => {

        setShowEditDialog(open);

        if (!open) {

          setEditAppointment(null);

        }

      }}>

        <DialogContent className="bg-white h-auto max-h-[90vh] w-[95%] max-w-[550px] rounded-3xl shadow-2xl my-8 p-8 flex flex-col border-0 backdrop-blur-sm">

          <DialogHeader className="mb-6">

            <div className="flex items-center gap-3">

              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">

                <Edit className="w-6 h-6 text-white" />

              </div>

              <DialogTitle className="text-2xl font-bold text-gray-900">修改預約</DialogTitle>

            </div>

            <DialogDescription className="sr-only">修改預約資訊</DialogDescription>

          </DialogHeader>

          <div className="flex-1 overflow-y-auto my-4 px-1 hide-scrollbar custom-scrollbar">

            <div className="space-y-5 py-2">

              <div className="space-y-2">

                <Label htmlFor="editCustomerName" className="text-sm font-medium text-gray-700">{newAppointment.category === 'booking' ? '客戶名稱' : '活動名稱'} <span className="text-red-600 font-bold">*</span></Label>

                <Input

                  id="editCustomerName"

                  value={newAppointment.customerName}

                  onChange={(e) => setNewAppointment({ ...newAppointment, customerName: e.target.value })}

                  placeholder={newAppointment.category === 'booking' ? '請輸入客戶名稱' : '請輸入活動名稱'}

                  className={`h-12 bg-gray-50 border-0 rounded-xl text-base focus:ring-2 focus:ring-black ${errorFields.has("customerName") ? "error-flash" : ""}`}

                />

              </div>

              {newAppointment.category === 'booking' && (

                <div className="space-y-2">

                  <Label htmlFor="editCustomerInfo" className="text-sm font-medium text-gray-700">顧客的基本資料（選填）</Label>

                  <Input

                    id="editCustomerInfo"

                    type="text"

                    value={newAppointment.customerInfo}

                    onChange={(e) => setNewAppointment({ ...newAppointment, customerInfo: e.target.value })}

                    placeholder="電話號碼 / 電子信箱"

                    className="h-12 bg-gray-50 border-0 rounded-xl text-base focus:ring-2 focus:ring-black"

                  />

                </div>

              )}

              {newAppointment.category === 'booking' && (

                <div className="space-y-2">

                  <Label htmlFor="editService" className="text-sm font-medium text-gray-700">服務名稱 <span className="text-red-600 font-bold">*</span></Label>

                  <Input

                    id="editService"

                    value={newAppointment.service}

                    onChange={(e) => setNewAppointment({ ...newAppointment, service: e.target.value })}

                    placeholder="請輸入服務名稱"

                    className={`h-12 bg-gray-50 border-0 rounded-xl text-base focus:ring-2 focus:ring-black ${errorFields.has("service") ? "error-flash" : ""}`}

                  />

                </div>

              )}

              <div className="space-y-2">

                <Label htmlFor="editTime" className="text-sm font-medium text-gray-700">{newAppointment.category === 'booking' ? '開始時間' : '活動時間'} <span className="text-red-600 font-bold">*</span></Label>

                <TimePicker

                  value={newAppointment.time}

                  onChange={(value) => setNewAppointment({ ...newAppointment, time: value })}

                  className={errorFields.has("time") ? "error-flash" : ""}

                />

              </div>

              <div className="space-y-2">

                <Label htmlFor="editDuration" className="text-sm font-medium text-gray-700">{newAppointment.category === 'booking' ? '預計花費時間（分鐘）' : '持續時間（分鐘）'} <span className="text-red-600 font-bold">*</span></Label>

                <Input

                  id="editDuration"

                  type="number"

                  value={newAppointment.duration}

                  onChange={(e) => setNewAppointment({ ...newAppointment, duration: e.target.value })}

                  placeholder={newAppointment.category === 'booking' ? '請輸入預計花費時間' : '請輸入持續時間'}

                  className={`h-12 bg-gray-50 border-0 rounded-xl text-base focus:ring-2 focus:ring-black ${errorFields.has("duration") ? "error-flash" : ""}`}

                />

              </div>

              {/* 即時時間警告顯示 */}

              {timeWarning.type !== 'none' && (

                <div className={`flex items-center gap-2 p-4 rounded-xl ${

                  timeWarning.type === 'overlap' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'

                }`}>

                  <AlertCircle className={`w-5 h-5 flex-shrink-0 ${

                    timeWarning.type === 'overlap' ? 'text-red-600' : 'text-yellow-600'

                  }`} />

                  <div className="flex-1">

                    <p className={`text-sm font-medium ${

                      timeWarning.type === 'overlap' ? 'text-red-900' : 'text-yellow-900'

                    }`}>

                      {timeWarning.message}

                    </p>

                  </div>

                </div>

              )}

            </div>

          </div>

          <DialogFooter className="pt-6 bg-white mt-auto gap-3 justify-center">

            <Button

              variant="ghost"

              onClick={() => {

                setShowEditDialog(false);

                setEditAppointment(null);

                setTimeWarning({ type: 'none' });

              }}

              className="flex-1 h-12 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-colors font-medium text-base"

            >

              取消

            </Button>

            <Button

              onClick={handleEditAppointment}

              className="flex-1 h-12 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors font-medium text-base"

            >

              修改

            </Button>

            <Button

              onClick={handleDeleteAppointment}

              className="flex-1 h-12 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-medium text-base"

            >

              刪除

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>



      {/* 刪除確認對話框 */}

      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>

        <DialogContent className="bg-white border border-gray-100 h-auto max-h-[90vh] w-[95%] max-w-[500px] rounded-[24px] shadow-2xl my-8 p-6 flex flex-col backdrop-blur-sm">

          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />

          <DialogHeader>

            <DialogTitle className="text-xl font-bold text-gray-900">確認刪除</DialogTitle>

            <DialogDescription className="sr-only">確認要刪除此預約，刪除後可以從復原記錄中恢復</DialogDescription>

          </DialogHeader>

          <div className="flex-1 overflow-y-auto my-4 px-1 hide-scrollbar custom-scrollbar">

            <div className="py-4">

            <p className="text-gray-700">請問你確定要刪除此預約嗎？</p>

            <p className="text-sm text-gray-500 mt-2">刪除後可以從復原記錄中恢復。</p>

          </div>

          <DialogFooter className="pt-4 bg-white mt-auto gap-3 justify-center">

            <Button

              variant="ghost"

              onClick={() => setShowDeleteConfirmDialog(false)}

              className="flex-1 h-12 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-colors font-medium text-base"

            >

              取消

            </Button>

            <Button

              onClick={confirmDeleteAppointment}

              className="flex-1 h-12 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-medium text-base"

            >

              確定刪除

            </Button>

          </DialogFooter>

          </div>

        </DialogContent>

      </Dialog>



      {/* 時間警告對話框 */}

      <Dialog open={showTimeWarningDialog} onOpenChange={setShowTimeWarningDialog}>

        <DialogContent className="bg-white border border-gray-100 h-auto max-h-[90vh] w-[95%] max-w-[500px] rounded-[24px] shadow-2xl my-8 p-6 flex flex-col backdrop-blur-sm">

          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />

          <DialogHeader>

            <DialogTitle className="text-xl font-bold text-gray-900">

              {timeWarning.type === 'overlap' ? '⚠️ 時間重疊警告' : '⚠️ 間隔較短警告'}

            </DialogTitle>

            <DialogDescription className="sr-only">{timeWarning.message}</DialogDescription>

          </DialogHeader>

          <div className="flex-1 overflow-y-auto my-4 px-1 hide-scrollbar custom-scrollbar">

            <div className="py-4">

              <p className="text-gray-700 mb-4">{timeWarning.message}</p>

              <p className="text-sm text-gray-500">

                您仍然可以繼續{editAppointment ? '修改' : '新增'}此預約，系統不會阻擋。是否確定要{editAppointment ? '修改' : '新增'}？

              </p>

            </div>

          </div>

          <DialogFooter className="pt-4 bg-white mt-auto gap-3 justify-center">

            <Button

              variant="ghost"

              onClick={() => {

                setShowTimeWarningDialog(false);

                setTimeWarning({ type: 'none' });

                setPendingAppointment(null);

              }}

              className="flex-1 h-12 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-colors font-medium text-base"

            >

              取消

            </Button>

            <Button

              onClick={() => {

                if (pendingAppointment) {

                  if (editAppointment) {

                    // 編輯預約

                    const index = appointments.findIndex(app => app.id === editAppointment.id);

                    if (index !== -1) {

                      const updatedAppointments = [...appointments];

                      console.log(`[Date Filter] appointments 陣列總數: ${appointments.length}`);
            console.log(`[Date Filter] appointments 陣列內容:`, appointments.map(app => ({
              id: app.id,
              customer_name: app.customer_name,
              source: app.admin_meta?.source || 'unknown',
              hasSchedule: !!app.schedule,
              hasScheduleDate: !!app.schedule?.date,
              hasDate: !!app.date,
              scheduleDate: app.schedule?.date,
              date: app.date,
              scheduleStart: app.schedule?.start,
              scheduleEnd: app.schedule?.end
            })));

                      updatedAppointments[index] = pendingAppointment;

                      const sortedAppointments = updatedAppointments.sort((a, b) => {

                        if (!a.date || !b.date) return 0;

                        if (a.date !== b.date) {

                          return a.date.localeCompare(b.date);

                        }

                        const timeA = getTimeFromSchedule(a);

                        const timeB = getTimeFromSchedule(b);

                        return timeA.localeCompare(timeB);

                      });

                      setAppointments(sortedAppointments);

                      updateBookingToSupabase(supabase, pendingAppointment);

                    }

                    setShowEditDialog(false);

                    setEditAppointment(null);

                  } else {

                    // 新增預約

                    const sortedAppointments = [...appointments, pendingAppointment].sort((a, b) => {

                      if (a.date !== b.date) {

                        return a.date.localeCompare(b.date);

                      }

                      const timeA = getTimeFromSchedule(a);

                      const timeB = getTimeFromSchedule(b);

                      return timeA.localeCompare(timeB);

                    });

                    setAppointments(sortedAppointments);

                    saveBookingToSupabase(supabase, pendingAppointment);

                    setShowAddDialog(false);

                    setBlacklistWarning({ isBlacklisted: false });

                  }

                }

                setShowTimeWarningDialog(false);

                setTimeWarning({ type: 'none' });

                setPendingAppointment(null);

                setNewAppointment({

                  category: 'booking',

                  customerName: '',

                  service: '',

                  serviceType: 'nail',

                  date: '',

                  time: '',

                  duration: '',

                  customerInfo: '',

                  tags: []

                });

              }}

              className="flex-1 h-12 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors font-medium text-base"

            >

              確定{editAppointment ? '修改' : '新增'}

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>



      {/* 快速操作確認對話框 */}

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>

        <DialogContent className="bg-white h-auto max-h-[90vh] w-[95%] max-w-[550px] rounded-3xl shadow-2xl my-8 p-8 flex flex-col border-0 backdrop-blur-sm">

          <DialogHeader className="mb-6">

            <div className="flex items-center gap-3">

              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">

                {confirmAction === 'end_early' && <Clock className="w-6 h-6 text-white" />}

                {confirmAction === 'no_show' && <UserX className="w-6 h-6 text-white" />}

                {confirmAction === 'extend' && <PlusCircle className="w-6 h-6 text-white" />}

                {confirmAction === 'cancel' && <X className="w-6 h-6 text-white" />}

              </div>

              <DialogTitle className="text-2xl font-bold text-gray-900">

                {confirmAction === 'end_early' && '確認提早結束'}

                {confirmAction === 'no_show' && '確認客戶未到'}

                {confirmAction === 'extend' && (() => {

                  const appointment = appointments.find(app => app.id === confirmAppointmentId);

                  return appointment?.category === 'activity' ? '確認延長活動時間' : '確認延長服務時間';

                })()}

                {confirmAction === 'cancel' && '確認取消預約'}

              </DialogTitle>

            </div>

            <DialogDescription className="sr-only">

              {confirmAction === 'end_early' && '確認要提早結束此預約'}

              {confirmAction === 'no_show' && '確認客戶未到，將標記為黑名單'}

              {confirmAction === 'extend' && '確認要延長服務時間'}

              {confirmAction === 'cancel' && '確認要取消此預約'}

            </DialogDescription>

          </DialogHeader>

          <div className="flex-1 overflow-y-auto my-4 px-1 hide-scrollbar custom-scrollbar">

            <div className="py-2">

            {confirmAction === 'end_early' && (

              <div>

                <p className="text-gray-700 text-base">確定要提早結束嗎？</p>

                <p className="text-sm text-gray-500 mt-3 leading-relaxed">系統將釋放剩餘時間，並重新計算後續的休息間隔。</p>

              </div>

            )}

            {confirmAction === 'no_show' && (

              <div>

                <p className="text-gray-700 text-base">確定標記為客戶未到嗎？</p>

                <p className="text-sm text-gray-500 mt-3 leading-relaxed">此操作將結束預約，並將客戶資訊列入黑名單，未來該客戶預約時系統將自動提醒。</p>

              </div>

            )}

            {confirmAction === 'cancel' && (

              <div>

                <p className="text-gray-700 text-base">確定要取消此預約嗎？</p>

                <p className="text-sm text-gray-500 mt-3 leading-relaxed">此操作將刪除此預約，並釋放該時段。此動作無法復原。</p>

              </div>

            )}

            {confirmAction === 'extend' && (

              <div>

                <p className="text-gray-700 text-base">

                  {(() => {

                    const appointment = appointments.find(app => app.id === confirmAppointmentId);

                    return appointment?.category === 'activity' ? '確定要延長活動時間嗎？' : '確定要延長服務時間嗎？';

                  })()}

                </p>

                <p className="text-sm text-gray-500 mt-3 leading-relaxed">

                  {(() => {

                    const appointment = appointments.find(app => app.id === confirmAppointmentId);

                    const timeType = appointment?.category === 'activity' ? '活動時間' : '服務時間';

                    return `${timeType}將延長 ${extendMinutes} 分鐘，系統將重新計算後續的休息間隔。`;

                  })()}

                </p>

                {/* 顯示衝突警告 */}

                {(() => {

                  const appointment = appointments.find(app => app.id === confirmAppointmentId);

                  if (!appointment) return null;

                  

                  const currentDuration = parseInt(appointment.remainingTime) || 0;

                  const newDuration = currentDuration + extendMinutes;

                  const timeStr = getTimeFromSchedule(appointment);

                  const [h, m] = timeStr.split(':').map(Number);

                  const startInMin = h * 60 + m;

                  const newEndInMin = startInMin + newDuration;

                  

                  const dayAppointments = appointments.filter(app => app.date === appointment.date);

                  const sortedAppointments = dayAppointments.sort((a, b) => {

                    const timeStrA = getTimeFromSchedule(a);

                    const timeStrB = getTimeFromSchedule(b);

                    const [ah, am] = timeStrA.split(':').map(Number);

                    const [bh, bm] = timeStrB.split(':').map(Number);

                    return (ah * 60 + am) - (bh * 60 + bm);

                  });

                  

                  const currentIdx = sortedAppointments.findIndex(app => app.id === appointment.id);

                  const nextAppointment = sortedAppointments[currentIdx + 1];

                  

                  if (nextAppointment) {

                    const nextTimeStr = getTimeFromSchedule(nextAppointment);

                    const [nextH, nextM] = nextTimeStr.split(':').map(Number);

                    const nextStartInMin = nextH * 60 + nextM;

                    

                    if (newEndInMin > nextStartInMin) {

                      const overlapMinutes = newEndInMin - nextStartInMin;

                      return (

                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">

                          <p className="text-sm text-yellow-900">

                            ⚠️ 延長後的結束時間會與下一筆預約「{nextAppointment.customerName}」重疊 {overlapMinutes} 分鐘

                          </p>

                        </div>

                      );

                    }

                  }

                  return null;

                })()}

              </div>

            )}

          </div>

          </div>

          <DialogFooter className="pt-6 bg-white mt-auto gap-3 justify-center">

            <Button

              variant="ghost"

              onClick={() => setShowConfirmDialog(false)}

              className="flex-1 h-12 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-colors font-medium text-base"

            >

              取消

            </Button>

            <Button

              onClick={() => {

                if (confirmAction === 'end_early' && confirmAppointmentId) {

                  handleEndEarly(confirmAppointmentId);

                } else if (confirmAction === 'no_show' && confirmAppointmentId) {

                  handleNoShow(confirmAppointmentId);

                } else if (confirmAction === 'extend' && confirmAppointmentId) {

                  handleExtendService();

                } else if (confirmAction === 'cancel' && confirmAppointmentId) {

                  handleDeleteAppointment();

                }

                setShowConfirmDialog(false);

              }}

              className="flex-1 h-12 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors font-medium text-base"

            >

              確定更改

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>



      {/* 延長服務時間彈窗 */}

      <Dialog open={showExtendModal} onOpenChange={setShowExtendModal}>

        <DialogContent className="bg-white h-auto max-h-[90vh] w-[95%] max-w-[550px] rounded-3xl shadow-2xl my-8 p-8 flex flex-col border-0 backdrop-blur-sm">

          <DialogHeader className="mb-6">

            <div className="flex items-center gap-3">

              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">

                <PlusCircle className="w-6 h-6 text-white" />

              </div>

              <DialogTitle className="text-2xl font-bold text-gray-900">

                {(() => {

                  const appointment = appointments.find(app => app.id === extendAppointmentId);

                  return appointment?.category === 'activity' ? '延長活動時間' : '延長服務時間';

                })()}

              </DialogTitle>

            </div>

            <DialogDescription className="sr-only">選擇要延長的時間長度</DialogDescription>

          </DialogHeader>

          <div className="flex-1 overflow-y-auto my-4 px-1 hide-scrollbar custom-scrollbar">

            <div className="py-2 space-y-5">

            <div>

              <Label className="text-sm font-medium text-gray-700">快速增加時間</Label>

              <div className="flex gap-3 mt-3 min-w-0">

                <button

                  onClick={() => setExtendMinutes(5)}

                  className={`flex-1 h-12 px-4 rounded-xl border-2 transition-all hover:scale-95 ${extendMinutes === 5 ? 'bg-black text-white border-black' : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300'}`}

                >

                  +5 分鐘

                </button>

                <button

                  onClick={() => setExtendMinutes(10)}

                  className={`flex-1 h-12 px-4 rounded-xl border-2 transition-all hover:scale-95 ${extendMinutes === 10 ? 'bg-black text-white border-black' : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300'}`}

                >

                  +10 分鐘

                </button>

                <button

                  onClick={() => setExtendMinutes(30)}

                  className={`flex-1 h-12 px-4 rounded-xl border-2 transition-all hover:scale-95 ${extendMinutes === 30 ? 'bg-black text-white border-black' : 'bg-white text-gray-900 border-gray-200 hover:border-gray-300'}`}

                >

                  +30 分鐘

                </button>

              </div>

            </div>

            <div>

              <Label htmlFor="customExtend" className="text-sm font-medium text-gray-700">自定義延長時間（分鐘）</Label>

              <Input

                id="customExtend"

                type="number"

                value={customExtendMinutes}

                onChange={(e) => {

                  setCustomExtendMinutes(e.target.value);

                  setExtendMinutes(parseInt(e.target.value) || 5);

                }}

                placeholder="輸入分鐘數"

                className="h-12 bg-gray-50 border-0 rounded-xl text-base focus:ring-2 focus:ring-black mt-3"

              />

            </div>

          </div>

          </div>

          <DialogFooter className="pt-6 bg-white mt-auto gap-3 justify-center">

            <Button

              variant="ghost"

              onClick={() => setShowExtendModal(false)}

              className="flex-1 h-12 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-colors font-medium text-base"

            >

              取消

            </Button>

            <Button

              onClick={() => {

                setConfirmAction('extend');

                setConfirmAppointmentId(extendAppointmentId);

                setShowConfirmDialog(true);

                setShowExtendModal(false);

              }}

              className="flex-1 h-12 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors font-medium text-base"

            >

              確定

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>



      {/* Hover 詳細資訊卡 */}

      {renderHoverTooltip()}



      {/* 錯誤對話框 */}

      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>

        <DialogContent className="bg-white border border-gray-100 h-auto max-h-[90vh] w-[95%] max-w-[500px] rounded-[24px] shadow-2xl my-8 p-6 flex flex-col backdrop-blur-sm z-[9999]">

          <DialogHeader className="sr-only">

            <DialogTitle>{errorMessage.title}</DialogTitle>

            <DialogDescription>{errorMessage.description}</DialogDescription>

          </DialogHeader>

          <div className="flex items-center gap-3 mb-4">

            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">

              <AlertCircle className="w-5 h-5 text-red-600" />

            </div>

            <h3 className="text-lg font-bold text-gray-900">{errorMessage.title}</h3>

          </div>

          <p className="text-sm text-gray-600 mb-6">{errorMessage.description}</p>

          <Button

            onClick={() => setShowErrorDialog(false)}

            className="w-full h-10 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"

          >

            我知道了

          </Button>

        </DialogContent>

      </Dialog>



    </div>

  );

}

