import { supabase } from './supabase';

/**
 * V3 客戶資料同步服務
 * 確保預約與顧客資料的自動化同步
 */

export interface CustomerData {
  id?: string;
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

/**
 * 自動建立/更新顧客資料 (Upsert 邏輯)
 * 在預約確認或 AI 預約寫入時調用
 */
export const syncCustomerData = async (
  customerName: string,
  customerPhone: string,
  customerEmail: string = '',
  bookingPrice: number = 0,
  bookingStatus: string = 'pending'
): Promise<{ success: boolean; error?: string; customerId?: string }> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ [Customer Sync] 認證失敗:', authError);
      return { success: false, error: '認證失敗' };
    }

    // 標準化電話號碼
    const normalizedPhone = customerPhone.replace(/[^\d]/g, '');

    // 1. 檢查顧客是否已存在 - V3 結構
    const { data: customerData, error: fetchError } = await supabase
      .from('shop_customers_v3')
      .select('all_customers')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ [Customer Sync] 查詢顧客失敗:', fetchError);
      return { success: false, error: '查詢顧客失敗' };
    }

    const allCustomers = customerData?.all_customers || [];
    const existingCustomer = allCustomers.find((c: any) => {
      const customerPhone = c.phone?.replace(/[^\d]/g, '') || '';
      return customerPhone === normalizedPhone;
    });

    const now = new Date().toISOString();

    if (existingCustomer) {
      // 2. 更新現有顧客資料 - V3 結構
      const updatedStats = { ...existingCustomer.stats };
      
      // 更新預約次數（僅在確認預約時）
      if (bookingStatus === 'confirmed') {
        updatedStats.total_bookings += 1;
        updatedStats.last_purchase_at = now;
      }
      
      // 更新總消費金額（僅在完成預約時）
      if (bookingStatus === 'completed') {
        updatedStats.total_spending += bookingPrice;
      }

      // 檢查 no_show 次數（從預約歷史計算）
      const { data: bookingHistory } = await supabase
        .from('shop_bookings_v3')
        .select('all_bookings')
        .eq('user_id', user.id)
        .maybeSingle();

      if (bookingHistory?.all_bookings) {
        const customerBookings = bookingHistory.all_bookings.filter((booking: any) => {
          const bookingPhone = booking.customer_phone?.replace(/[^\d]/g, '');
          return bookingPhone === normalizedPhone;
        });
        
        updatedStats.no_show_count = customerBookings.filter((booking: any) => 
          booking.status === 'no_show'
        ).length;
      }

      // 更新 all_customers 陣列中的客戶資料
      const updatedCustomers = allCustomers.map((c: any) => {
        const customerPhone = c.phone?.replace(/[^\d]/g, '') || '';
        if (customerPhone === normalizedPhone) {
          return {
            ...c,
            name: customerName,
            email: customerEmail || c.email,
            stats: updatedStats,
            updated_at: now
          };
        }
        return c;
      });

      const { error: updateError } = await supabase
        .from('shop_customers_v3')
        .update({ all_customers: updatedCustomers })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('❌ [Customer Sync] 更新顧客失敗:', updateError);
        return { success: false, error: '更新顧客失敗' };
      }

      console.log('✅ [Customer Sync] 顧客資料已更新:', {
        customerId: existingCustomer.id,
        name: customerName,
        phone: normalizedPhone,
        totalBookings: updatedStats.total_bookings,
        totalSpending: updatedStats.total_spending
      });

      return { success: true, customerId: existingCustomer.id };

    } else {
      // 3. 建立新顧客 - V3 結構
      const newCustomerData = {
        id: crypto.randomUUID(),
        name: customerName,
        phone: normalizedPhone,
        email: customerEmail,
        stats: {
          total_bookings: bookingStatus === 'confirmed' ? 1 : 0,
          total_spending: bookingStatus === 'completed' ? bookingPrice : 0,
          no_show_count: 0,
          last_purchase_at: bookingStatus === 'confirmed' ? now : ''
        },
        status: {
          is_blacklisted: false,
          blacklist_reason: null
        },
        tags: [],
        manual_notes: '',
        created_at: now,
        updated_at: now
      };

      // 新增到 all_customers 陣列
      const updatedCustomers = [...allCustomers, newCustomerData];

      const { error: insertError } = await supabase
        .from('shop_customers_v3')
        .update({ all_customers: updatedCustomers })
        .eq('user_id', user.id);

      if (insertError) {
        console.error('❌ [Customer Sync] 建立顧客失敗:', insertError);
        return { success: false, error: '建立顧客失敗' };
      }

      console.log('✅ [Customer Sync] 新顧客已建立:', {
        customerId: newCustomerData.id,
        name: customerName,
        phone: normalizedPhone
      });

      return { success: true, customerId: newCustomerData.id };
    }

  } catch (error) {
    console.error('❌ [Customer Sync] 系統錯誤:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '系統錯誤' 
    };
  }
};

/**
 * 檢查客戶是否在黑名單中
 * AI 預約進件前調用
 */
// 批量檢查黑名單，避免並行認證問題
export const batchCheckBlacklist = async (customerPhones: string[]): Promise<Map<string, { isBlacklisted: boolean; reason?: string }>> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ [Batch Blacklist Check] 認證失敗:', authError);
      return new Map();
    }

    // 獲取所有客戶資料一次
    const { data: customerData, error: fetchError } = await supabase
      .from('shop_customers_v3')
      .select('all_customers')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ [Batch Blacklist Check] 查詢失敗:', fetchError);
      return new Map();
    }

    const allCustomers = customerData?.all_customers || [];
    const results = new Map<string, { isBlacklisted: boolean; reason?: string }>();

    // 為每個手機號碼檢查黑名單狀態
    customerPhones.forEach(phone => {
      const normalizedPhone = phone.replace(/[^\d]/g, '');
      const customer = allCustomers.find((c: any) => {
        const customerPhone = c.phone?.replace(/[^\d]/g, '') || '';
        return customerPhone === normalizedPhone;
      });

      const isBlacklistedByStatus = customer?.status?.is_blacklisted;
      const isBlacklistedByTag = customer?.tags?.includes('黑名單');
      
      if (isBlacklistedByStatus || isBlacklistedByTag) {
        results.set(phone, {
          isBlacklisted: true,
          reason: customer?.status?.blacklist_reason || '黑名單標籤'
        });
      } else {
        results.set(phone, { isBlacklisted: false });
      }
    });

    return results;
  } catch (error) {
    console.error('❌ [Batch Blacklist Check] 系統錯誤:', error);
    return new Map();
  }
};

export const checkCustomerBlacklist = async (customerPhone: string): Promise<{ isBlacklisted: boolean; reason?: string }> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ [Blacklist Check] 認證失敗:', authError);
      return { isBlacklisted: false };
    }

    const normalizedPhone = customerPhone.replace(/[^\d]/g, '');

    // 🔧 V3: 查詢 shop_customers_v3 表的 all_customers JSONB
    const { data: customerData, error: fetchError } = await supabase
      .from('shop_customers_v3')
      .select('all_customers')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ [Blacklist Check] 查詢失敗:', fetchError);
      return { isBlacklisted: false };
    }

    // 解析 all_customers JSONB 陣列，查找指定手機號碼的客戶
    const allCustomers = customerData?.all_customers || [];
    const customer = allCustomers.find((c: any) => {
      const customerPhone = c.phone?.replace(/[^\d]/g, '') || '';
      return customerPhone === normalizedPhone;
    });

    // 檢查黑名單狀態：1. is_blacklisted 欄位 2. tags 陣列中的 "黑名單" 標籤
    const isBlacklistedByStatus = customer?.status?.is_blacklisted;
    const isBlacklistedByTag = customer?.tags?.includes('黑名單');
    
    if (isBlacklistedByStatus || isBlacklistedByTag) {
      console.log('🚫 [Blacklist Check] 客戶在黑名單中:', {
        phone: normalizedPhone,
        isBlacklistedByStatus,
        isBlacklistedByTag,
        reason: customer?.status?.blacklist_reason || '黑名單標籤'
      });
      return { 
        isBlacklisted: true, 
        reason: customer?.status?.blacklist_reason || '黑名單標籤'
      };
    }

    return { isBlacklisted: false };

  } catch (error) {
    console.error('❌ [Blacklist Check] 系統錯誤:', error);
    return { isBlacklisted: false };
  }
};

/**
 * 更新客戶消費統計
 * 預約完成時調用
 */
export const updateCustomerSpending = async (
  customerPhone: string,
  bookingPrice: number
): Promise<{ success: boolean; error?: string }> => {
  return syncCustomerData(
    '', // name 不更新
    customerPhone,
    '', // email 不更新
    bookingPrice,
    'completed'
  );
};

/**
 * 批量同步客戶資料
 * 從現有預約歷史重建客戶資料庫
 */
export const batchSyncCustomersFromBookings = async (): Promise<{ success: boolean; processed: number; errors: string[] }> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, processed: 0, errors: ['認證失敗'] };
    }

    // 獲取所有預約歷史
    const { data: bookingData, error: fetchError } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .single();

    if (fetchError || !bookingData?.all_bookings) {
      return { success: false, processed: 0, errors: ['無法讀取預約資料'] };
    }

    const allBookings = bookingData.all_bookings;
    const uniqueCustomers = new Map<string, any>(); // phone -> booking data
    const errors: string[] = [];
    let processed = 0;

    // 收集所有獨特客戶
    allBookings.forEach((booking: any) => {
      if (booking.customer_phone) {
        const normalizedPhone = booking.customer_phone.replace(/[^\d]/g, '');
        if (!uniqueCustomers.has(normalizedPhone)) {
          uniqueCustomers.set(normalizedPhone, booking);
        }
      }
    });

    // 批量同步每個客戶
    for (const [phone, booking] of uniqueCustomers) {
      try {
        await syncCustomerData(
          booking.customer_name,
          phone,
          booking.customer_email || '',
          0, // 不在這裡計算價格
          'pending' // 設為初始狀態
        );
        processed++;
      } catch (error) {
        errors.push(`客戶 ${phone}: ${error instanceof Error ? error.message : '未知錯誤'}`);
      }
    }

    console.log(`📊 [Batch Sync] 批量同步完成: ${processed} 個客戶已處理`);
    
    return { 
      success: true, 
      processed, 
      errors 
    };

  } catch (error) {
    console.error('❌ [Batch Sync] 系統錯誤:', error);
    return { 
      success: false, 
      processed: 0, 
      errors: [error instanceof Error ? error.message : '系統錯誤'] 
    };
  }
};
