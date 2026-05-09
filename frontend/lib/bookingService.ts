import { createClient } from '@/lib/supabase';
import { generateAIContext, writeAIResponse } from './aiHelper';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// 擴展 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);

// 設定預設時區為 Asia/Taipei
dayjs.tz.setDefault('Asia/Taipei');

// Helper function to extract time string from start_time
export const getTimeFromStart = (start_time: string | null | undefined): string => {
  if (!start_time) return '00:00';
  // 使用 dayjs 解析時區偏移，然後轉換為台灣時間
  // 如果時間字符串包含時區偏移（如 +08:00），dayjs.utc() 會正確解析
  const time = dayjs.utc(start_time).tz('Asia/Taipei');
  return time.format('HH:mm');
};

export const supabase = createClient();

// 電話號碼標準化函數
const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/[^\d]/g, '');
};

// 時間轉換為分鐘數
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// 分鐘數轉換為時間字符串
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

// 檢查時間衝突（支援跨日訂單）- V3 版本
export const checkTimeConflict = async (date: string, time: string, duration: number, excludeBookingId?: string, category?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { hasConflict: false, conflicts: [] };

    // 調試輸出：檢查傳入的參數
    console.log('🕐 [Conflict Check] 開始檢查時間衝突:', {
      date,
      time,
      duration,
      excludeBookingId,
      category
    });

    // 如果是活動，允許重疊，不檢查衝突
    if (category === 'activity') {
      console.log('🕐 [Conflict Check] 活動類型，跳過衝突檢查');
      return { hasConflict: false, conflicts: [] };
    }

    // 計算新預約的完整開始和結束時間（台北時區）
    const newStartDateTime = dayjs.tz(`${date}T${time}`, 'Asia/Taipei');
    const newEndDateTime = newStartDateTime.add(duration, 'minute');

    console.log('🕐 [Conflict Check] 新預約時間範圍:', {
      newStart: newStartDateTime.format('YYYY-MM-DD HH:mm:ss'),
      newEnd: newEndDateTime.format('YYYY-MM-DD HH:mm:ss')
    });

    // 從 shop_bookings_v3 獲取所有預約資料
    const { data, error } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data?.all_bookings) {
      return { hasConflict: false, conflicts: [] };
    }

    const existingBookings = data.all_bookings.filter((booking: any) => {
      // 只檢查非取消的預約
      return booking.status !== 'cancelled';
    });

    if (!existingBookings || existingBookings.length === 0) {
      return { hasConflict: false, conflicts: [] };
    }

    const conflicts = existingBookings
      .filter(booking => {
        // 排除當前正在編輯的預約
        if (excludeBookingId && booking.id === excludeBookingId) return false;

        // 解析現有預約的開始和結束時間（統一使用台北時區）
        const bookingStartDateTime = dayjs.tz(booking.schedule?.start, 'Asia/Taipei');
        const bookingEndDateTime = dayjs.tz(booking.schedule?.end, 'Asia/Taipei');

        // 檢查時間重疊（使用完整的日期時間）
        // 兩個時間區間重疊的條件：newStart < bookingEnd && newEnd > bookingStart
        const hasOverlap = newStartDateTime.isBefore(bookingEndDateTime) && newEndDateTime.isAfter(bookingStartDateTime);

        // 調試輸出：檢查每個預約的時間比對
        console.log('🕐 [Conflict Check] 比對預約:', {
          bookingId: booking.id,
          customerName: booking.customer_name,
          newTime: `${date} ${time} (${duration}分)`,
          newStart: newStartDateTime.format('YYYY-MM-DD HH:mm:ss'),
          newEnd: newEndDateTime.format('YYYY-MM-DD HH:mm:ss'),
          existingStart: bookingStartDateTime.format('YYYY-MM-DD HH:mm:ss'),
          existingEnd: bookingEndDateTime.format('YYYY-MM-DD HH:mm:ss'),
          hasOverlap
        });

        return hasOverlap;
      })
      .map(booking => ({
        id: booking.id,
        customer_name: booking.customer_name,
        time: getTimeFromStart(booking.schedule?.start),
        duration: parseInt(booking.schedule?.duration || '60'),
        service: booking.service_info?.name,
        start_time: booking.schedule?.start,
        end_time: booking.schedule?.end
      }));

    return { hasConflict: conflicts.length > 0, conflicts };
  } catch (error: any) {
    console.error('Error checking time conflict:', error);
    return { hasConflict: false, conflicts: [] };
  }
};

// 獲取或創建顧客（使用 V3 結構）
const getOrCreateCustomer = async (phone: string, customerName: string, email: string | null, tags: string[]) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) return null;

    // 從 shop_customers_v3 獲取所有顧客資料
    const { data, error } = await supabase
      .from('shop_customers_v3')
      .select('all_customers')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data?.all_customers) {
      return null;
    }

    // 查找現有顧客
    const existingCustomer = data.all_customers.find((customer: any) => 
      customer.phone === normalizedPhone
    );

    if (existingCustomer) {
      // 顧客已存在，直接返回現有資料
      console.log('找到現有客戶:', existingCustomer);
      return existingCustomer;
    } else {
      // 顧客不存在，創建新顧客（使用 V3 結構）
      console.log('創建新客戶:', { phone: normalizedPhone, customerName });
      
      // 從 shop_customers_v3 獲取現有資料
      const { data: currentData } = await supabase
        .from('shop_customers_v3')
        .select('all_customers')
        .eq('user_id', user.id)
        .maybeSingle();

      const newCustomer = {
        id: crypto.randomUUID(),
        name: customerName,
        phone: normalizedPhone,
        email: email || null,
        stats: {
          total_bookings: 0,
          total_spending: 0,
          no_show_count: 0,
          last_purchase_at: new Date().toISOString()
        },
        status: {
          is_blacklisted: false,
          blacklist_reason: null
        },
        tags: tags,
        manual_notes: ''
      };

      const updatedCustomers = currentData?.all_customers ? [...currentData.all_customers, newCustomer] : [newCustomer];

      const { data: result, error: insertError } = await supabase
        .from('shop_customers_v3')
        .update({ all_customers: updatedCustomers })
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (insertError) {
        console.error('創建客戶失敗:', insertError);
        return null;
      }

      console.log('新客戶創建成功:', newCustomer);
      return newCustomer;
    }
  } catch (error) {
    console.error('Error in getOrCreateCustomer:', error);
    return null;
  }
};

// 根據狀態獲取預約列表 (V3 版本)
export const fetchBookingsByStatus = async (status: string, page: number = 0, pageSize: number = 20) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // 從 shop_bookings_v3 讀取 all_bookings
    const { data, error } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching V3 bookings:', error);
      return [];
    }

    if (!data?.all_bookings || !Array.isArray(data.all_bookings)) {
      console.log('No bookings found or empty array');
      return [];
    }

    // 過濾狀態和類別
    console.log('原始數據:', data);
    
    let filteredBookings = data.all_bookings.filter((booking: any) => {
      // 暴力顯示測試：暫時移除 category 過濾條件
      console.log(`[Filter Debug] 預約 ${booking.id} - 狀態: ${booking.status}, 來源: ${booking.admin_meta?.source}`);
      
      // 暫時只過濾狀態，不過濾 category
      return booking.status === status;
    });

    // 根據狀態使用不同的排序
    if (status === 'pending') {
      // 待處理：依據 schedule.start 降序（最新申請排最前）
      filteredBookings.sort((a: any, b: any) => 
        new Date(b.schedule?.start).getTime() - new Date(a.schedule?.start).getTime()
      );
    } else {
      // 其他狀態：依據 schedule.start 升序（越快到來排最前）
      filteredBookings.sort((a: any, b: any) => 
        new Date(a.schedule?.start).getTime() - new Date(b.schedule?.start).getTime()
      );
    }

    // 分頁處理
    const startIndex = page * pageSize;
    const endIndex = (page + 1) * pageSize;
    return filteredBookings.slice(startIndex, endIndex);
  } catch (error: any) {
    console.error('Error in fetchBookingsByStatus:', error);
    return [];
  }
};

// 獲取所有非刪除的預約（用於 "all" 分頁）(V3 版本)
export const fetchAllBookings = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // 從 shop_bookings_v3 讀取 all_bookings
    const { data, error } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching all V3 bookings:', error);
      return [];
    }

    if (!data?.all_bookings || !Array.isArray(data.all_bookings)) {
      console.log('No bookings found or empty array');
      return [];
    }

    // 過濾已取消的預約
    const filteredBookings = data.all_bookings.filter((booking: any) => {
      return booking.status !== 'cancelled';
    });

    // 按開始時間排序
    return filteredBookings.sort((a: any, b: any) => 
      new Date(a.schedule?.start).getTime() - new Date(b.schedule?.start).getTime()
    );
  } catch (error: any) {
    console.error('Error in fetchAllBookings:', error);
    return [];
  }
};

// 獲取歷史紀錄（已完成、未到、已取消）(V3 版本)
export const fetchHistoryBookings = async (page: number = 0, pageSize: number = 20) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // 從 shop_bookings_v3 讀取 all_bookings
    const { data, error } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching history V3 bookings:', error);
      return [];
    }

    if (!data?.all_bookings || !Array.isArray(data.all_bookings)) {
      console.log('No bookings found or empty array');
      return [];
    }

    // 過濾歷史紀錄（已完成、未到、已取消）
    let filteredBookings = data.all_bookings.filter((booking: any) => {
      return booking.service_info?.category === 'booking' && 
             ['completed', 'no_show', 'cancelled'].includes(booking.status);
    });

    // 按開始時間降序排序
    filteredBookings.sort((a: any, b: any) => 
      new Date(b.schedule?.start).getTime() - new Date(a.schedule?.start).getTime()
    );

    // 分頁處理
    const startIndex = page * pageSize;
    const endIndex = (page + 1) * pageSize;
    return filteredBookings.slice(startIndex, endIndex);
  } catch (error: any) {
    console.error('Error in fetchHistoryBookings:', error);
    return [];
  }
};

// 更新預約狀態 (V3 版本)
export const updateBookingStatus = async (id: string, newStatus: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    // 獲取現有的 all_bookings
    const { data: currentData } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!currentData?.all_bookings) {
      return { success: false, error: 'No bookings found' };
    }

    // 找到要更新的預約
    const bookingToUpdate = currentData.all_bookings.find((booking: any) => booking.id === id);
    if (!bookingToUpdate) {
      return { success: false, error: 'Booking not found' };
    }

    // 更新指定預約的狀態
    const updatedBookings = currentData.all_bookings.map((booking: any) => {
      if (booking.id === id) {
        return {
          ...booking,
          status: newStatus,
          admin_meta: {
            ...booking.admin_meta,
            source: 'web_dashboard',
            ai_notes: ''
          }
        };
      }
      return booking;
    });

    const { error } = await supabase
      .from('shop_bookings_v3')
      .update({ all_bookings: updatedBookings })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating booking status:', error);
      return { success: false, error };
    }

    // 🔧 V3 同步：當預約完成時，自動更新客戶的總消費金額
    if (newStatus === 'completed') {
      try {
        const { updateCustomerSpending } = await import('./customerSyncService');
        await updateCustomerSpending(
          bookingToUpdate.customer_phone,
          bookingToUpdate.service_info?.price || 0
        );
      } catch (syncError) {
        console.warn('⚠️ [Booking Service] 客戶消費統計更新失敗，但預約狀態已更新:', syncError);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in updateBookingStatus:', error);
    return { success: false, error };
  }
};

// AI 標籤自動化函數 (V3 版本)
export const updateBookingWithAI = async (id: string, aiTags?: string[], aiNotes?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    // 獲取現有的 all_bookings
    const { data: currentData } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!currentData?.all_bookings) {
      return { success: false, error: 'No bookings found' };
    }

    // 更新指定預約的 AI 資料
    const updatedBookings = currentData.all_bookings.map((booking: any) => {
      if (booking.id === id) {
        return {
          ...booking,
          admin_meta: {
            ...booking.admin_meta,
            tags: aiTags || booking.admin_meta?.tags || [],
            ai_notes: aiNotes || booking.admin_meta?.ai_notes || ''
          }
        };
      }
      return booking;
    });

    const { error } = await supabase
      .from('shop_bookings_v3')
      .update({ all_bookings: updatedBookings })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating booking with AI data:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in updateBookingWithAI:', error);
    return { success: false, error };
  }
};

// 獲取預約的 AI Context (V3 版本)
export const getBookingAIContext = async (id: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 從 shop_bookings_v3 獲取所有預約資料
    const { data, error } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data?.all_bookings) {
      console.error('Error fetching booking for AI context:', error);
      return null;
    }

    // 查找指定預約
    const booking = data.all_bookings.find((b: any) => b.id === id);
    if (!booking) {
      console.error('Booking not found for AI context');
      return null;
    }

    if (error || !booking) {
      console.error('Error fetching booking for AI context:', error);
      return null;
    }

    return generateAIContext(booking);
  } catch (error: any) {
    console.error('Error in getBookingAIContext:', error);
    return null;
  }
};

// 確認預約（將狀態從 pending 改為 confirmed）(V3 版本)
export const confirmBooking = async (id: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    // 獲取現有的 all_bookings
    const { data: currentData } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!currentData?.all_bookings) {
      return { success: false, error: 'No bookings found' };
    }

    // 找到要確認的預約
    const bookingToConfirm = currentData.all_bookings.find((booking: any) => booking.id === id);
    if (!bookingToConfirm) {
      return { success: false, error: 'Booking not found' };
    }

    // 🔧 黑名單檢查：確認預約前檢查客戶是否在黑名單中
    try {
      const { checkCustomerBlacklist } = await import('./customerSyncService');
      const blacklistCheck = await checkCustomerBlacklist(bookingToConfirm.customer_phone);
      
      if (blacklistCheck.isBlacklisted) {
        console.log('🚫 [Booking Service] 客戶在黑名單中，拒絕確認預約:', {
          phone: bookingToConfirm.customer_phone,
          reason: blacklistCheck.reason
        });
        return { 
          success: false, 
          error: `客戶在黑名單中：${blacklistCheck.reason}` 
        };
      }
    } catch (blacklistError) {
      console.warn('⚠️ [Booking Service] 黑名單檢查失敗，繼續處理:', blacklistError);
    }

    // 更新指定預約的狀態
    const updatedBookings = currentData.all_bookings.map((booking: any) => {
      if (booking.id === id) {
        return {
          ...booking,
          status: 'confirmed',
          admin_meta: {
            ...booking.admin_meta,
            // 🔧 修復：保留原本的 source，不要覆蓋 AI_Chatbot
            source: booking.admin_meta?.source || 'web_dashboard',
            ai_notes: ''
          }
        };
      }
      return booking;
    });

    const { error } = await supabase
      .from('shop_bookings_v3')
      .update({ all_bookings: updatedBookings })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error confirming booking:', error);
      return { success: false, error };
    }

    // 🔧 V3 同步：自動同步顧客資料
    try {
      const { syncCustomerData } = await import('./customerSyncService');
      await syncCustomerData(
        bookingToConfirm.customer_name,
        bookingToConfirm.customer_phone,
        bookingToConfirm.customer_email || '',
        bookingToConfirm.service_info?.price || 0,
        'confirmed'
      );
    } catch (syncError) {
      console.warn('⚠️ [Booking Service] 顧客資料同步失敗，但預約已確認:', syncError);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in confirmBooking:', error);
    return { success: false, error };
  }
};

// AI 衝突檢查：確保 AI 不會覆蓋手動設定的關鍵欄位 (V3 版本)
export const checkAISourceConflict = async (bookingId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { hasConflict: false };

    // 從 shop_bookings_v3 獲取所有預約資料
    const { data, error } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data?.all_bookings) {
      return { hasConflict: false };
    }

    // 查找指定預約
    const existingBooking = data.all_bookings.find((b: any) => b.id === bookingId);
    if (!existingBooking) {
      return { hasConflict: false };
    }

    if (!existingBooking) return { hasConflict: false };

    // 如果現有記錄的 source 不是 AI_Chatbot，則可能有衝突
    if (existingBooking.admin_meta?.source && existingBooking.admin_meta.source !== 'AI_Chatbot') {
      return {
        hasConflict: true,
        existingSource: existingBooking.admin_meta.source,
        message: '此預約已由手動或其他來源設定，AI 不應覆蓋'
      };
    }

    return { hasConflict: false };
  } catch (error: any) {
    console.error('Error checking AI source conflict:', error);
    return { hasConflict: false };
  }
};

// 從 service_settings 中獲取服務價格
const getServicePrice = async (serviceName: string): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data: settingsData } = await supabase
      .from('settings')
      .select('service_settings')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!settingsData?.service_settings?.services) return 0;

    // 根據服務名稱匹配價格
    const service = settingsData.service_settings.services.find(
      (s: any) => s.name === serviceName
    );

    return service?.price || 0;
  } catch (error) {
    console.error('Error getting service price:', error);
    return 0;
  }
};

// 通用儲存預約函數（統一處理手動和 AI 預約）
export const saveBooking = async (bookingData: {
  customerName?: string;
  phone?: string;
  email?: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  tags?: string[];
  source?: 'phone' | 'line' | 'walkin' | 'manual' | 'AI_Chatbot' | 'Hang_Ke';
  ai_notes?: string;
  note?: string;
  category?: 'booking' | 'activity';
  id?: string; // 用於更新現有預約
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    // 獲取服務價格
    let servicePrice = 0;
    try {
      servicePrice = await getServicePrice(bookingData.service);
      console.log('服務價格獲取成功:', { service: bookingData.service, price: servicePrice });
    } catch (priceError) {
      console.error('獲取服務價格失敗，使用預設價格 0:', priceError);
      servicePrice = 0;
    }

    // 判斷是預約還是活動
    const category = bookingData.category || 'booking';
    const isActivity = category === 'activity';

    // 2. 設定預設來源 (如果是 AI 傳入就用 AI，沒傳就用 Manual)
    const source = bookingData.source || 'manual';

    // AI 衝突檢查：如果是 AI 且正在更新現有預約，檢查是否會覆蓋手動設定
    if (source === 'AI_Chatbot' && bookingData.id) {
      const conflictCheck = await checkAISourceConflict(bookingData.id);
      if (conflictCheck.hasConflict) {
        return {
          success: false,
          error: 'AI conflict: Cannot overwrite manually set booking',
          conflict: conflictCheck
        };
      }
    }

    // 1. 自動關聯或建立客戶（僅預約需要）
    let customer = null;
    if (!isActivity) {
      if (!bookingData.customerName || !bookingData.phone) {
        return { success: false, error: '預約需要客戶姓名和電話' };
      }
      customer = await getOrCreateCustomer(
        bookingData.phone,
        bookingData.customerName,
        bookingData.email || null,
        bookingData.tags || []
      );

      console.log('取得的客戶資料:', customer);

      if (!customer) {
        return { success: false, error: 'Failed to create or find customer' };
      }

      if (!customer.id) {
        console.error('客戶資料缺少 id 欄位:', customer);
        return { success: false, error: 'Customer data missing id field' };
      }
    }

    // 3. 設定預設狀態 (AI 需要審核，手動通常直接確認)
    const status = source === 'AI_Chatbot' ? 'pending' : 'confirmed';

    // 4. 檢查時間衝突
    const conflictCheck = await checkTimeConflict(
      bookingData.date,
      bookingData.time,
      bookingData.duration,
      bookingData.id, // 排除當前正在編輯的預約
      category // 傳入類別，活動不檢查衝突
    );

    // 時間衝突改為警告，不阻擋建立
    let timeConflictWarning = null;
    if (conflictCheck.hasConflict) {
      console.log('⚠️ [saveBooking] 檢測到時間衝突，但允許建立:', conflictCheck.conflicts);
      timeConflictWarning = {
        timeConflict: true,
        conflicts: conflictCheck.conflicts
      };
    }

    // 5. 生成預約 ID（如果是新預約）
    const bookingId = bookingData.id || crypto.randomUUID();

    // 6. 確保變數作用域正確，統一時間處理
    let finalStartTime, finalEndTime;
    
    const baseTime = bookingData.start_time || `${bookingData.date} ${bookingData.time}:00`;
    // 使用台北時區處理時間
    const startMoment = dayjs.tz(baseTime, 'Asia/Taipei');
    const endMoment = startMoment.add(Number(bookingData.duration) || 0, 'minute');

    finalStartTime = startMoment.format('YYYY-MM-DD HH:mm:ss');
    finalEndTime = endMoment.format('YYYY-MM-DD HH:mm:ss');

    console.log('時間計算:', {
      date: bookingData.date,
      time: bookingData.time,
      finalStartTime,
      finalEndTime,
      startMoment: startMoment.toString(),
      endMoment: endMoment.toString(),
      timezone: startMoment.format('Z'),
      expectedFormat: '2026-04-28T19:50:00+08:00'
    });

    // 7. 防錯機制：檢查 end_time 是否早於或等於 start_time
    if (endMoment.valueOf() <= startMoment.valueOf()) {
      return {
        success: false,
        error: '時間計算錯誤：結束時間必須晚於開始時間'
      };
    }

    // 8. 執行儲存 - 完全符合 V3 JSONB 結構
    const newBooking = {
      id: bookingId,
      customer_name: isActivity ? '店內任務' : bookingData.customerName,
      customer_phone: isActivity ? '' : (bookingData.phone || ''),
      customer_email: isActivity ? '' : (bookingData.email || ''),
      service_info: {
        name: bookingData.service,
        price: servicePrice,
        category: category,
        service_type: 'nail' // 預設為美甲服務
      },
      schedule: {
        start: finalStartTime,
        end: finalEndTime,
        date: bookingData.date,
        duration: bookingData.duration.toString()
      },
      status: status,
      admin_meta: {
        tags: isActivity ? ['維護'] : (bookingData.tags || []),
        ai_notes: bookingData.ai_notes || bookingData.note || '',
        source: source,
        notes: ''
      }
    };

    // 準備寫入資料庫前的日誌
    console.log('準備寫入資料庫:', newBooking);
    
    // 獲取現有的 all_bookings
    const { data: currentData } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();

    const updatedBookings = currentData?.all_bookings ? [...currentData.all_bookings, newBooking] : [newBooking];

    const { data, error } = await supabase
      .from('shop_bookings_v3')
      .update({ all_bookings: updatedBookings })
      .eq('user_id', user.id)
      .select();

    console.log('資料庫回傳結果:', { data, error });

    if (error) {
      console.error('Supabase 寫入錯誤詳細資訊:', JSON.stringify(error, null, 2));
      console.error('錯誤訊息:', error?.message);
      console.error('錯誤詳情:', error?.details);
      console.error('錯誤代碼:', error?.code);
      return { success: false, error };
    }

    if (!data || data.length === 0) {
      console.error('資料庫寫入失敗：沒有返回資料');
      return { success: false, error: '資料庫寫入失敗：沒有返回資料' };
    }

    console.log('資料庫寫入成功，ID:', data[0]?.id);
    // 確保返回正確的 bookingId
    const returnedId = data[0]?.id || bookingId;
    return { success: true, bookingId: returnedId };

    // 更新客戶總消費（僅針對預約）- 使用 V3 結構
    if (!isActivity && customer) {
      try {
        // 從 shop_customers_v3 獲取現有資料
        const { data: customerData } = await supabase
          .from('shop_customers_v3')
          .select('all_customers')
          .eq('user_id', user.id)
          .maybeSingle();

        if (customerData?.all_customers) {
          const updatedCustomers = customerData.all_customers.map((c: any) => {
            if (c.id === customer.id) {
              return {
                ...c,
                stats: {
                  total_spending: (c.stats?.total_spending || 0) + servicePrice,
                  total_bookings: (c.stats?.total_bookings || 0) + 1,
                  no_show_count: c.stats?.no_show_count || 0,
                  last_purchase_at: new Date().toISOString()
                }
              };
            }
            return c;
          });

          const { error: updateError } = await supabase
            .from('shop_customers_v3')
            .update({ all_customers: updatedCustomers })
            .eq('user_id', user.id);

          if (updateError) {
            console.error('更新客戶總消費失敗:', updateError);
          } else {
            console.log('客戶總消費已更新:', {
              customer_id: customer.id,
              old_spending: customer.stats?.total_spending || 0,
              new_spending: (customer.stats?.total_spending || 0) + servicePrice,
              booking_price: servicePrice
            });
          }
        }
      } catch (error) {
        console.error('更新客戶總消費時發生錯誤:', error);
      }
    }

    // 返回成功結果，包含時間衝突警告（如果有的話）
    const result = { success: true, bookingId };
    if (timeConflictWarning) {
      (result as any).warnings = timeConflictWarning;
    }
    return result;
  } catch (error: any) {
    console.error('Error in saveBooking:', JSON.stringify(error, null, 2));
    console.error('錯誤訊息:', error?.message);
    return { success: false, error };
  }
};

// 創建新預約（使用通用函數）
export const createBooking = async (bookingData: {
  customerName: string;
  phone: string;
  email?: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  tags?: string[];
}) => {
  // 使用通用儲存函數，預設 source 為 manual
  return await saveBooking({
    ...bookingData,
    source: 'manual'
  });
};

// 軟刪除預約 (V3 版本) - 實際上只是更新狀態
export const softDeleteBooking = async (id: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    // 獲取現有的 all_bookings
    const { data: currentData } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!currentData?.all_bookings) {
      return { success: false, error: 'No bookings found' };
    }

    // 更新指定預約的狀態
    const updatedBookings = currentData.all_bookings.map((booking: any) => {
      if (booking.id === id) {
        return {
          ...booking,
          status: 'cancelled'
        };
      }
      return booking;
    });

    const { error } = await supabase
      .from('shop_bookings_v3')
      .update({ all_bookings: updatedBookings })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error soft deleting booking:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in softDeleteBooking:', error);
    return { success: false, error };
  }
};

// 執行 V3 資料遷移 - 將舊表資料搬到 shop_bookings_v3
export const migrateToV3 = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('用戶未登入');

    console.log('[Migration] 開始執行 V3 資料遷移...');

    // 檢查是否已經有 V3 資料
    const { data: existingV3 } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingV3 && existingV3.all_bookings && existingV3.all_bookings.length > 0) {
      console.log('[Migration] V3 資料已存在，跳過遷移');
      return existingV3.all_bookings;
    }

    // 從舊 bookings 表獲取資料
    const { data: oldBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('[Migration] 獲取舊資料失敗:', fetchError);
      throw fetchError;
    }

    if (!oldBookings || oldBookings.length === 0) {
      console.log('[Migration] 沒有找到舊資料');
      return [];
    }

    console.log(`[Migration] 找到 ${oldBookings.length} 筆舊資料，開始轉換...`);

    // 轉換資料格式為 V3 結構
    const v3Bookings = oldBookings.map(booking => ({
      id: booking.id,
      user_id: booking.user_id,
      customer_id: booking.customer_id || null,
      customer_name: booking.customer_name || '店內任務',
      service: booking.service || '',
      service_type: booking.service_type || '',
      service_abbr: booking.service_abbr || '',
      category: booking.category || 'booking',
      date: booking.date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      duration: booking.duration || 60,
      price: booking.price || 0,
      status: booking.status || 'confirmed',
      source: booking.source || 'web_dashboard',
      notes: booking.notes || '',
      admin_meta: booking.admin_meta || {},
      schedule_config: booking.schedule_config || {},
      created_at: booking.created_at,
      updated_at: booking.updated_at
    }));

    // 插入到 V3 表
    const { error: insertError } = await supabase
      .from('shop_bookings_v3')
      .upsert({
        user_id: user.id,
        all_bookings: v3Bookings
      });

    if (insertError) {
      console.error('[Migration] 插入 V3 資料失敗:', insertError);
      throw insertError;
    }

    console.log(`[Migration] 成功遷移 ${v3Bookings.length} 筆資料到 V3`);
    return v3Bookings;

  } catch (error) {
    console.error('[Migration] 遷移失敗:', error);
    throw error;
  }
};

// 獲取已刪除的預約 (V3 版本) - 從 all_bookings 過濾
export const fetchDeletedBookings = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // 從 shop_bookings_v3 獲取所有預約資料
    const { data, error } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data?.all_bookings) {
      console.log('No bookings found or empty array');
      return [];
    }

    // 過濾已刪除的預約（在 V3 中，已刪除的預約狀態為 'cancelled'）
    const deletedBookings = data.all_bookings.filter((booking: any) => {
      return booking.status === 'cancelled';
    });

    // 按刪除時間降序排序（這裡可以根據需要調整排序邏輯）
    return deletedBookings.sort((a: any, b: any) => 
      new Date(b.schedule?.start || '').getTime() - new Date(a.schedule?.start || '').getTime()
    );
  } catch (error: any) {
    console.error('Error in fetchDeletedBookings:', error);
    return [];
  }
};

// 自動更新已過期的預約狀態 (V3 版本)
export const autoUpdateExpiredBookings = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    // 獲取所有預約資料
    const { data, error } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data?.all_bookings) {
      return { success: true, updatedCount: 0 };
    }

    const now = dayjs().tz('Asia/Taipei');
    let updatedCount = 0;

    // 找出需要更新的預約
    const bookingsToUpdate = data.all_bookings.filter((booking: any) => {
      const endTime = booking.schedule?.end;
      if (!endTime) return false;
      
      // 修復時區問題：確保正確解析時間
      const endTimeParsed = dayjs(endTime).tz('Asia/Taipei');
      
      // 檢查是否已經過期超過24小時（避免重複處理很久以前的訂單）
      const hoursSinceEnd = now.diff(endTimeParsed, 'hours');
      
      // 只處理過期但未完成的預約，且過期時間在合理範圍內（避免處理很久以前的訂單）
      return now.isAfter(endTimeParsed) && 
             booking.status !== 'completed' && 
             hoursSinceEnd <= 720; // 只處理30天內的過期預約
    });

    if (bookingsToUpdate.length === 0) {
      return { success: true, updatedCount: 0 };
    }

    console.log(`[排程系統] 發現 ${bookingsToUpdate.length} 個過期預約需要更新`);

    // 更新狀態
    const updatedBookings = data.all_bookings.map((booking: any) => {
      if (bookingsToUpdate.find((b: any) => b.id === booking.id)) {
        console.log(`[排程系統] 更新預約狀態: ${booking.id} - ${booking.schedule?.end}`);
        return {
          ...booking,
          status: 'completed'
        };
      }
      return booking;
    });

    const { error: updateError } = await supabase
      .from('shop_bookings_v3')
      .update({ all_bookings: updatedBookings })
      .eq('user_id', user.id);

    if (!updateError) {
      updatedCount = bookingsToUpdate.length;
      console.log(`[排程系統] 成功更新 ${updatedCount} 個過期預約狀態`);
    } else {
      console.error('[排程系統] 更新預約狀態失敗:', updateError);
    }

    return { success: true, updatedCount };
  } catch (error: any) {
    console.error('Error in autoUpdateExpiredBookings:', error);
    return { success: false, error };
  }
};
