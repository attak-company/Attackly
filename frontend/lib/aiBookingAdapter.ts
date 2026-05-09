import { supabase } from './supabase';

/**
 * AI 聊天室預約進件的 V3 轉接器
 * 確保 AI 傳入的任何格式都能正確轉換為 V3 標準格式
 */

/**
 * AI 聊天室傳入的預約資料格式
 */
export interface AIBookingData {
  customer_name?: string;
  customer_phone?: string;
  service?: string;
  date?: string;
  time?: string;
  duration?: number;
  notes?: string;
  ai_notes?: string;
  tags?: string[];
}

interface V3Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  service_info: {
    name: string;
    duration: number;
    price?: number;
    category: 'booking' | 'activity';
  };
  schedule: {
    date: string;
    start: string;
    end: string;
    duration: number;
  };
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled' | 'waiting_list';
  admin_meta: {
    source: 'phone' | 'web' | 'AI_Chatbot' | 'admin';
    ai_notes?: string;
    tags?: string[];
    created_at: string;
    updated_at: string;
  };
}

/**
 * 格式化電話號碼為標準格式
 */
const normalizePhone = (phone: string): string => {
  if (!phone) return '';
  
  // 移除所有非數字字符
  const cleaned = phone.replace(/[^\d]/g, '');
  
  // 如果是 10 碼且以 09 開頭，保持原樣
  if (cleaned.length === 10 && cleaned.startsWith('09')) {
    return cleaned;
  }
  
  // 如果是其他格式，嘗試補上前綴
  if (cleaned.length === 9) {
    return `0${cleaned}`;
  }
  
  return cleaned;
};

/**
 * 格式化時間為 HH:mm 格式
 */
const normalizeTime = (time: string): string => {
  if (!time) return '09:00';
  
  // 處理已經是 HH:mm 格式的情況
  if (/^\d{1,2}:\d{2}$/.test(time)) {
    const [h, m] = time.split(':');
    const hours = parseInt(h);
    const minutes = parseInt(m);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }
  
  // 處理純數字格式
  if (/^\d{1,4}$/.test(time)) {
    const num = parseInt(time);
    if (num < 100) {
      // 可能是小時數
      return `${num.toString().padStart(2, '0')}:00`;
    } else if (num >= 100 && num <= 2359) {
      // 可能是 HHmm 格式
      const hours = Math.floor(num / 100);
      const minutes = num % 100;
      if (hours <= 23 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
  }
  
  // 處理中文時間格式
  return parseChineseTime(time);
};

/**
 * 解析中文時間格式
 */
const parseChineseTime = (time: string): string => {
  if (!time) return '09:00';
  
  const chineseTime = time.trim().toLowerCase();
  
  // 處理 "上午/下午" 格式
  if (chineseTime.includes('上午') || chineseTime.includes('早上')) {
    const timePart = chineseTime.replace(/上午|早上/g, '').trim();
    return parseTimePart(timePart, 0); // 上午不加12小時
  }
  
  if (chineseTime.includes('下午') || chineseTime.includes('中午')) {
    const timePart = chineseTime.replace(/下午|中午/g, '').trim();
    return parseTimePart(timePart, 12); // 下午加12小時
  }
  
  if (chineseTime.includes('晚上')) {
    const timePart = chineseTime.replace(/晚上/g, '').trim();
    return parseTimePart(timePart, 12); // 晚上加12小時
  }
  
  // 處理 "X點Y分" 格式
  const pointMatch = chineseTime.match(/(\d{1,2})點(\d{1,2})?分?/);
  if (pointMatch) {
    let hours = parseInt(pointMatch[1]);
    const minutes = pointMatch[2] ? parseInt(pointMatch[2]) : 0;
    
    // 判斷上午/下午
    if (chineseTime.includes('上午') || chineseTime.includes('早上')) {
      // 上午不加12
    } else if (chineseTime.includes('下午') || chineseTime.includes('晚上')) {
      // 下午/晚上加12
      hours += 12;
    }
    
    // 24小時制修正
    if (hours >= 24) hours -= 24;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // 處理 "X點" 格式
  const hourMatch = chineseTime.match(/(\d{1,2})點/);
  if (hourMatch) {
    let hours = parseInt(hourMatch[1]);
    
    // 判斷上午/下午
    if (chineseTime.includes('上午') || chineseTime.includes('早上')) {
      // 上午不加12
    } else if (chineseTime.includes('下午') || chineseTime.includes('晚上')) {
      // 下午/晚上加12
      hours += 12;
    }
    
    // 24小時制修正
    if (hours >= 24) hours -= 24;
    
    return `${hours.toString().padStart(2, '0')}:00`;
  }
  
  return '09:00';
};

/**
 * 解析時間部分
 */
const parseTimePart = (timePart: string, addHours: number): string => {
  // 處理 "HH:mm" 格式
  const timeMatch = timePart.match(/(\d{1,2}):?(\d{0,2})?/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]) + addHours;
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    
    // 24小時制修正
    if (hours >= 24) hours -= 24;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // 處理純數字
  const numMatch = timePart.match(/(\d{1,4})/);
  if (numMatch) {
    let hours = parseInt(numMatch[1]);
    
    if (hours < 100) {
      hours += addHours;
    } else if (hours >= 100 && hours <= 2359) {
      // HHmm 格式
      const h = Math.floor(hours / 100) + addHours;
      const m = hours % 100;
      if (h <= 23 && m <= 59) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      }
    }
  }
  
  return '09:00';
};

/**
 * 格式化日期為 YYYY-MM-DD 格式
 */
const normalizeDate = (date: string): string => {
  if (!date) return new Date().toISOString().split('T')[0];
  
  try {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      // 如果解析失敗，嘗試其他格式
      const today = new Date();
      return today.toISOString().split('T')[0];
    }
    return parsed.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * 生成預約開始和結束時間的 ISO 字串
 */
const generateScheduleTimes = (date: string, time: string, duration: number) => {
  const normalizedDate = normalizeDate(date);
  const normalizedTime = normalizeTime(time);
  const durationMinutes = Math.max(duration || 60, 15); // 最少 15 分鐘
  
  // 建立開始時間 - 確保正確的 ISO 格式
  const startDateTime = new Date(`${normalizedDate}T${normalizedTime}:00`);
  
  // 檢查日期是否有效
  if (isNaN(startDateTime.getTime())) {
    console.warn('[Schedule] 無效的開始時間，使用預設值');
    const fallbackDateTime = new Date();
    const fallbackEndDateTime = new Date(fallbackDateTime.getTime() + durationMinutes * 60 * 1000);
    
    return {
      date: fallbackDateTime.toISOString().split('T')[0],
      start: fallbackDateTime.toISOString(),
      end: fallbackEndDateTime.toISOString(),
      duration: durationMinutes
    };
  }
  
  // 建立結束時間
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);
  
  // 檢查結束時間是否有效
  if (isNaN(endDateTime.getTime())) {
    console.warn('[Schedule] 無效的結束時間，使用預設值');
    const fallbackEndDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
    
    return {
      date: normalizedDate,
      start: startDateTime.toISOString(),
      end: fallbackEndDateTime.toISOString(),
      duration: durationMinutes
    };
  }
  
  return {
    date: normalizedDate,
    start: startDateTime.toISOString(),
    end: endDateTime.toISOString(),
    duration: durationMinutes
  };
};

/**
 * 主要的 AI 預約轉接器
 */
export const adaptAIBookingToV3 = async (aiData: AIBookingData): Promise<V3Booking> => {
  const bookingId = crypto.randomUUID();
  const now = new Date().toISOString();
  
  // 1. 基本資料驗證和預設值
  const customerName = aiData.customer_name || 'AI 客戶';
  const customerPhone = normalizePhone(aiData.customer_phone || '');
  const serviceName = aiData.service || 'AI 預約服務';
  const bookingDate = normalizeDate(aiData.date || '');
  const bookingTime = normalizeTime(aiData.time || '');
  const bookingDuration = Math.max(aiData.duration || 60, 15);
  
  // 2. 生成時間資訊
  const schedule = generateScheduleTimes(bookingDate, bookingTime, bookingDuration);
  
  // 3. 建立 V3 標準格式 - 強制防呆
  const v3Booking: V3Booking = {
    id: bookingId,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: '', // AI 通常不提供 email
    service_info: {
      name: serviceName,
      duration: bookingDuration,
      price: 0, // AI 預約不包含價格
      category: 'booking' as const // 強制設定為 booking，防止過濾器擋掉
    },
    schedule: schedule,
    status: 'pending', // 強制設定為 pending，小寫
    admin_meta: {
      source: 'AI_Chatbot' as const,
      ai_notes: aiData.ai_notes || '',
      tags: aiData.tags || [],
      created_at: now,
      updated_at: now
    }
  };
  
  // 4. 防呆檢查 - 確保關鍵欄位存在
  if (!v3Booking.service_info?.category) {
    console.warn('[AI Adapter] category 缺失，強制設定為 booking');
    v3Booking.service_info.category = 'booking';
  }
  
  if (v3Booking.status !== 'pending') {
    console.warn('[AI Adapter] status 異常，強制設定為 pending');
    v3Booking.status = 'pending';
  }
  
  console.log('🤖 [AI Adapter] AI 資料轉換為 V3 格式:', {
    original: aiData,
    converted: v3Booking
  });
  
  return v3Booking;
};

/**
 * 將 AI 預約寫入 V3 資料庫
 */
export const saveAIBookingToV3 = async (aiData: AIBookingData): Promise<{ success: boolean; error?: string; bookingId?: string }> => {
  try {
    // 1. 轉換為 V3 格式
    const v3Booking = await adaptAIBookingToV3(aiData);
    
    // 2. 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ [AI Adapter] 認證失敗:', authError);
      return { success: false, error: '認證失敗' };
    }
    
    // 3. 🔧 V3 黑名單檢查
    try {
      const { checkCustomerBlacklist } = await import('./customerSyncService');
      const blacklistCheck = await checkCustomerBlacklist(v3Booking.customer_phone);
      
      if (blacklistCheck.isBlacklisted) {
        console.log('🚫 [AI Adapter] 客戶在黑名單中，拒絕預約:', {
          phone: v3Booking.customer_phone,
          reason: blacklistCheck.reason
        });
        return { 
          success: false, 
          error: `客戶在黑名單中：${blacklistCheck.reason}` 
        };
      }
    } catch (blacklistError) {
      console.warn('⚠️ [AI Adapter] 黑名單檢查失敗，繼續處理:', blacklistError);
    }
    
    // 4. 讀取現有的 V3 資料
    const { data: existingData, error: fetchError } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (fetchError) {
      console.error('❌ [AI Adapter] 讀取資料失敗:', fetchError);
      return { success: false, error: '讀取資料失敗' };
    }
    
    // 5. 更新或建立資料
    const currentBookings = existingData?.all_bookings || [];
    const updatedBookings = [...currentBookings, v3Booking];
    
    const { error: updateError } = await supabase
      .from('shop_bookings_v3')
      .update({ 
        all_bookings: updatedBookings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
      
    if (updateError) {
      console.error('❌ [AI Adapter] 寫入失敗:', updateError);
      return { success: false, error: '寫入資料失敗' };
    }
    
    // 6. 🔧 V3 同步：自動建立/更新顧客資料
    try {
      const { syncCustomerData } = await import('./customerSyncService');
      await syncCustomerData(
        v3Booking.customer_name,
        v3Booking.customer_phone,
        v3Booking.customer_email,
        v3Booking.service_info?.price || 0,
        'pending'
      );
    } catch (syncError) {
      console.warn('⚠️ [AI Adapter] 顧客資料同步失敗，但預約已建立:', syncError);
    }
    
    console.log('✅ [AI Adapter] AI 預約成功寫入 V3:', {
      bookingId: v3Booking.id,
      customerName: v3Booking.customer_name,
      service: v3Booking.service_info.name,
      time: v3Booking.schedule.start
    });
    
    return { 
      success: true, 
      bookingId: v3Booking.id 
    };
    
  } catch (error) {
    console.error('❌ [AI Adapter] 系統錯誤:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '系統錯誤' 
    };
  }
};

/**
 * 批量處理多個 AI 預約
 */
export const batchSaveAIBookings = async (aiBookings: AIBookingData[]): Promise<{ success: boolean; results: any[] }> => {
  const results = [];
  
  for (const aiBooking of aiBookings) {
    const result = await saveAIBookingToV3(aiBooking);
    results.push(result);
    
    // 避免併發問題，稍微延遲
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`📊 [AI Adapter] 批量寫入完成: ${successCount}/${aiBookings.length} 成功`);
  
  return {
    success: successCount === aiBookings.length,
    results
  };
};
