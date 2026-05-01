import { createClient } from '@/lib/supabase';
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

// 檢查時間衝突（支援跨日訂單）
export const checkTimeConflict = async (date: string, time: string, duration: number, excludeBookingId?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { hasConflict: false, conflicts: [] };

    // 計算新預約的完整開始和結束時間（台北時區）
    const newStartDateTime = dayjs.tz(`${date}T${time}`, 'Asia/Taipei');
    const newEndDateTime = newStartDateTime.add(duration, 'minute');

    // 獲取前後一天的所有非刪除預約（以捕捉跨日訂單）
    const targetDate = dayjs(date);
    const prevDate = targetDate.subtract(1, 'day').format('YYYY-MM-DD');
    const nextDate = targetDate.add(1, 'day').format('YYYY-MM-DD');

    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .in('date', [prevDate, date, nextDate])
      .eq('is_deleted', false)
      .neq('status', 'cancelled');

    if (!existingBookings || existingBookings.length === 0) {
      return { hasConflict: false, conflicts: [] };
    }

    const conflicts = existingBookings
      .filter(booking => {
        // 排除當前正在編輯的預約
        if (excludeBookingId && booking.id === excludeBookingId) return false;

        // 解析現有預約的開始和結束時間
        const bookingStartDateTime = dayjs(booking.start_time);
        const bookingEndDateTime = dayjs(booking.end_time);

        // 檢查時間重疊（使用完整的日期時間）
        // 兩個時間區間重疊的條件：newStart < bookingEnd && newEnd > bookingStart
        const hasOverlap = newStartDateTime.isBefore(bookingEndDateTime) && newEndDateTime.isAfter(bookingStartDateTime);

        return hasOverlap;
      })
      .map(booking => ({
        id: booking.id,
        customer_name: booking.customer_name,
        time: getTimeFromStart(booking.start_time),
        duration: booking.duration,
        service: booking.service,
        start_time: booking.start_time,
        end_time: booking.end_time
      }));

    return { hasConflict: conflicts.length > 0, conflicts };
  } catch (error: any) {
    console.error('Error checking time conflict:', error);
    return { hasConflict: false, conflicts: [] };
  }
};

// 獲取或創建顧客
const getOrCreateCustomer = async (phone: string, customerName: string, email: string | null, tags: string[]) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) return null;

    // 嘗試查找現有顧客
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (existingCustomer) {
      // 顧客已存在，直接返回現有資料
      console.log('找到現有客戶:', existingCustomer);
      return existingCustomer;
    } else {
      // 顧客不存在，創建新顧客
      console.log('創建新客戶:', { phone: normalizedPhone, customerName });
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          phone: normalizedPhone,
          email: email || null,
          customer_name: customerName,
          tags: tags,
          total_bookings: 0,
          no_show_count: 0,
          is_blacklisted: false,
          total_spending: 0
        })
        .select()
        .single();

      if (insertError) {
        console.error('創建客戶失敗:', insertError);
        
        // 如果是重複鍵值錯誤（23505），表示客戶可能已被其他請求創建
        // 再次嘗試查找客戶
        if (insertError.code === '23505') {
          console.log('檢測到重複鍵值，重新查找客戶...');
          const { data: retryCustomer } = await supabase
            .from('customers')
            .select('*')
            .eq('user_id', user.id)
            .eq('phone', normalizedPhone)
            .maybeSingle();
          
          if (retryCustomer) {
            console.log('重新查找成功:', retryCustomer);
            return retryCustomer;
          }
        }
        
        return null;
      }

      console.log('新客戶創建成功:', newCustomer);
      return newCustomer;
    }
  } catch (error: any) {
    console.error('Error in getOrCreateCustomer:', error);
    return null;
  }
};

// 根據狀態獲取預約列表
export const fetchBookingsByStatus = async (status: string, page: number = 0, pageSize: number = 20) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', status)
      .eq('is_deleted', false);

    // 根據狀態使用不同的排序
    if (status === 'pending') {
      // 待處理：依據 created_at 降序（最新申請排最前）
      query = query.order('created_at', { ascending: false });
    } else if (status === 'confirmed') {
      // 已確認：依據日期和時間升序（越快到來排最前）
      query = query.order('date', { ascending: true }).order('time', { ascending: true });
    } else {
      // 其他狀態：默認按日期時間升序
      query = query.order('date', { ascending: true }).order('time', { ascending: true });
    }

    // 分頁處理
    query = query.range(page * pageSize, (page + 1) * pageSize - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in fetchBookingsByStatus:', error);
    return [];
  }
};

// 獲取所有非刪除的預約（用於 "all" 分頁）
export const fetchAllBookings = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .neq('status', 'cancelled')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      console.error('Error fetching all bookings:', error);
      return [];
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in fetchAllBookings:', error);
    return [];
  }
};

// 獲取歷史紀錄（已完成、未到、已取消）
export const fetchHistoryBookings = async (page: number = 0, pageSize: number = 20) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .or('status.in.(completed,no_show,cancelled),is_deleted.eq.true')
      .order('date', { ascending: false })
      .order('time', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error fetching history bookings:', error);
      return [];
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in fetchHistoryBookings:', error);
    return [];
  }
};

// 更新預約狀態
export const updateBookingStatus = async (id: string, newStatus: string) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating booking status:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in updateBookingStatus:', error);
    return { success: false, error };
  }
};

// 確認預約（將狀態從 pending 改為 confirmed）
export const confirmBooking = async (id: string) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error confirming booking:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in confirmBooking:', error);
    return { success: false, error };
  }
};

// AI 衝突檢查：確保 AI 不會覆蓋手動設定的關鍵欄位
export const checkAISourceConflict = async (bookingId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { hasConflict: false };

    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('source, start_time, end_time')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single();

    if (!existingBooking) return { hasConflict: false };

    // 如果現有記錄的 source 不是 AI_Chatbot，則可能有衝突
    if (existingBooking.source && existingBooking.source !== 'AI_Chatbot') {
      return {
        hasConflict: true,
        existingSource: existingBooking.source,
        message: '此預約已由手動或其他來源設定，AI 不應覆蓋'
      };
    }

    return { hasConflict: false };
  } catch (error: any) {
    console.error('Error checking AI source conflict:', error);
    return { hasConflict: false };
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
      bookingData.id // 排除當前正在編輯的預約
    );

    if (conflictCheck.hasConflict) {
      return {
        success: false,
        error: 'Time conflict detected',
        conflicts: conflictCheck.conflicts
      };
    }

    // 5. 生成預約 ID（如果是新預約）
    const bookingId = bookingData.id || Date.now().toString();

    // 6. 計算 start_time 和 end_time (使用 dayjs 統一時區處理)
    // 輸入時間是台灣時間 (UTC+8)，使用 dayjs.tz 確保正確轉換
    const startDateTime = dayjs.tz(`${bookingData.date}T${bookingData.time}`, 'Asia/Taipei');
    const endDateTime = startDateTime.add(bookingData.duration, 'minute');

    // 轉換為帶時區的 ISO 字符串（+08 格式）存入資料庫
    // 使用 format() 會自動包含時區偏移
    const start_time = startDateTime.format();
    const end_time = endDateTime.format();

    console.log('時間計算:', {
      date: bookingData.date,
      time: bookingData.time,
      start_time,
      end_time,
      startDateTime: startDateTime.toString(),
      endDateTime: endDateTime.toString(),
      timezone: startDateTime.format('Z'),
      expectedFormat: '2026-04-28T19:50:00+08:00'
    });

    // 7. 防錯機制：檢查 end_time 是否早於或等於 start_time
    if (endDateTime.valueOf() <= startDateTime.valueOf()) {
      return {
        success: false,
        error: '時間計算錯誤：結束時間必須晚於開始時間'
      };
    }

    // 8. 執行儲存
    const insertData: any = {
      id: bookingId,
      user_id: user.id,
      category: category,
      service: bookingData.service,
      date: bookingData.date,
      duration: bookingData.duration,
      start_time: start_time,
      end_time: end_time,
      ai_notes: bookingData.ai_notes || '',
      notes: bookingData.note || '',
      source: source,
      status: status,
      is_deleted: false
    };

    // 僅預約需要客戶相關欄位
    if (!isActivity) {
      insertData.customer_name = bookingData.customerName;
      insertData.service_type = 'nail';
      insertData.service_abbr = '指甲';
      insertData.phone = normalizePhoneNumber(bookingData.phone!);
      insertData.email = bookingData.email || null;
      insertData.tags = bookingData.tags || [];
      insertData.customer_id = customer.id;
    }

    const { error } = await supabase
      .from('bookings')
      .insert(insertData);

    if (error) {
      console.error('Supabase 寫入錯誤詳細資訊:', JSON.stringify(error, null, 2));
      console.error('錯誤訊息:', error?.message);
      console.error('錯誤詳情:', error?.details);
      console.error('錯誤代碼:', error?.code);
      console.error('寫入的預約資料:', {
        id: bookingId,
        user_id: user.id,
        category: category,
        ...(customer && { customer_id: customer.id }),
        ...(bookingData.customerName && { customer_name: bookingData.customerName }),
        ...(bookingData.phone && { phone: normalizePhoneNumber(bookingData.phone) }),
        date: bookingData.date,
        start_time: start_time,
        duration: bookingData.duration
      });
      return { success: false, error };
    }

    return { success: true, bookingId };
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

// 軟刪除預約
export const softDeleteBooking = async (id: string) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({
        is_deleted: true,
        status: 'cancelled'
      })
      .eq('id', id);

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

// 自動更新已過期的預約狀態
export const autoUpdateExpiredBookings = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User not authenticated' };

    // 獲取所有未完成且未刪除的預約
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, end_time, status')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .neq('status', 'completed')
      .neq('status', 'cancelled');

    if (!bookings || bookings.length === 0) {
      return { success: true, updatedCount: 0 };
    }

    const now = dayjs().tz('Asia/Taipei');
    let updatedCount = 0;

    for (const booking of bookings) {
      if (!booking.end_time) continue;

      const endTime = dayjs(booking.end_time).tz('Asia/Taipei');

      // 如果當前時間已經超過結束時間，更新狀態
      if (now.isAfter(endTime)) {
        const { error } = await supabase
          .from('bookings')
          .update({
            status: 'completed',
            is_finished: true
          })
          .eq('id', booking.id)
          .eq('user_id', user.id);

        if (!error) {
          updatedCount++;
        }
      }
    }

    return { success: true, updatedCount };
  } catch (error: any) {
    console.error('Error in autoUpdateExpiredBookings:', error);
    return { success: false, error };
  }
};
