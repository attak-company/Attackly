import { supabase } from './supabase';
import { adaptAIBookingToV3, saveAIBookingToV3, AIBookingData } from './aiBookingAdapter';
import { confirmBooking, cancelBooking } from './bookingService';

/**
 * AI 預約管理服務
 * 提供確認、取消、批量處理等功能
 */

/**
 * 確認 AI 預約
 * 將 pending 狀態的預約改為 confirmed
 */
export const confirmAIBooking = async (bookingId: string): Promise<{ success: boolean; error?: string; message: string }> => {
  try {
    console.log('✅ [AI Service] 開始確認 AI 預約:', bookingId);
    
    // 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        error: '認證失敗',
        message: '❌ 無法確認預約，請重新登入'
      };
    }
    
    // 讀取現有的 V3 資料
    const { data: existingData, error: fetchError } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (fetchError) {
      return {
        success: false,
        error: '讀取資料失敗',
        message: '❌ 無法讀取預約資料'
      };
    }
    
    if (!existingData?.all_bookings) {
      return {
        success: false,
        error: '找不到預約',
        message: '❌ 找不到指定的預約'
      };
    }
    
    // 找到目標預約並更新狀態
    const currentBookings = existingData.all_bookings;
    const updatedBookings = currentBookings.map((booking: any) => {
      if (booking.id === bookingId) {
        return {
          ...booking,
          status: 'confirmed',
          admin_meta: {
            ...booking.admin_meta,
            updated_at: new Date().toISOString()
          }
        };
      }
      return booking;
    });
    
    // 更新資料庫
    const { error: updateError } = await supabase
      .from('shop_bookings_v3')
      .update({ 
        all_bookings: updatedBookings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
      
    if (updateError) {
      return {
        success: false,
        error: '更新失敗',
        message: '❌ 確認預約失敗，請重試'
      };
    }
    
    const updatedBooking = updatedBookings.find(b => b.id === bookingId);
    console.log('✅ [AI Service] AI 預約確認成功:', {
      bookingId,
      customerName: updatedBooking?.customer_name,
      status: 'confirmed'
    });
    
    return {
      success: true,
      message: `✅ 預約已確認！客戶: ${updatedBooking?.customer_name}`
    };
    
  } catch (error) {
    console.error('❌ [AI Service] 確認預約系統錯誤:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '系統錯誤',
      message: '❌ 系統錯誤，請聯繫管理員'
    };
  }
};

/**
 * 取消 AI 預約
 * 將預約狀態改為 cancelled
 */
export const cancelAIBooking = async (bookingId: string, reason?: string): Promise<{ success: boolean; error?: string; message: string }> => {
  try {
    console.log('❌ [AI Service] 開始取消 AI 預約:', bookingId);
    
    // 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        error: '認證失敗',
        message: '❌ 無法取消預約，請重新登入'
      };
    }
    
    // 讀取現有的 V3 資料
    const { data: existingData, error: fetchError } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (fetchError) {
      return {
        success: false,
        error: '讀取資料失敗',
        message: '❌ 無法讀取預約資料'
      };
    }
    
    if (!existingData?.all_bookings) {
      return {
        success: false,
        error: '找不到預約',
        message: '❌ 找不到指定的預約'
      };
    }
    
    // 找到目標預約並更新狀態
    const currentBookings = existingData.all_bookings;
    const updatedBookings = currentBookings.map((booking: any) => {
      if (booking.id === bookingId) {
        return {
          ...booking,
          status: 'cancelled',
          admin_meta: {
            ...booking.admin_meta,
            cancel_reason: reason || 'AI 系統取消',
            updated_at: new Date().toISOString()
          }
        };
      }
      return booking;
    });
    
    // 更新資料庫
    const { error: updateError } = await supabase
      .from('shop_bookings_v3')
      .update({ 
        all_bookings: updatedBookings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
      
    if (updateError) {
      return {
        success: false,
        error: '更新失敗',
        message: '❌ 取消預約失敗，請重試'
      };
    }
    
    const updatedBooking = updatedBookings.find(b => b.id === bookingId);
    console.log('❌ [AI Service] AI 預約取消成功:', {
      bookingId,
      customerName: updatedBooking?.customer_name,
      reason
    });
    
    return {
      success: true,
      message: `❌ 預約已取消！客戶: ${updatedBooking?.customer_name}`
    };
    
  } catch (error) {
    console.error('❌ [AI Service] 取消預約系統錯誤:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '系統錯誤',
      message: '❌ 系統錯誤，請聯繫管理員'
    };
  }
};

/**
 * 批量確認多個 AI 預約
 */
export const batchConfirmAIBookings = async (bookingIds: string[]): Promise<{ success: boolean; results: any[]; message: string }> => {
  console.log('📋 [AI Service] 開始批量確認預約:', bookingIds.length, '筆');
  
  const results = [];
  
  for (const bookingId of bookingIds) {
    const result = await confirmAIBooking(bookingId);
    results.push(result);
    
    // 避免併發問題
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const successCount = results.filter(r => r.success).length;
  const failedCount = results.length - successCount;
  
  console.log(`📊 [AI Service] 批量確認結果: ${successCount} 成功, ${failedCount} 失敗`);
  
  return {
    success: failedCount === 0,
    results,
    message: `批量確認完成: ${successCount}/${bookingIds.length} 成功`
  };
};

/**
 * 批量取消多個 AI 預約
 */
export const batchCancelAIBookings = async (bookingIds: string[], reason?: string): Promise<{ success: boolean; results: any[]; message: string }> => {
  console.log('🗑️ [AI Service] 開始批量取消預約:', bookingIds.length, '筆');
  
  const results = [];
  
  for (const bookingId of bookingIds) {
    const result = await cancelAIBooking(bookingId, reason);
    results.push(result);
    
    // 避免併發問題
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const successCount = results.filter(r => r.success).length;
  const failedCount = results.length - successCount;
  
  console.log(`🗑️ [AI Service] 批量取消結果: ${successCount} 成功, ${failedCount} 失敗`);
  
  return {
    success: failedCount === 0,
    results,
    message: `批量取消完成: ${successCount}/${bookingIds.length} 成功`
  };
};

/**
 * 獲取所有 AI 預約
 */
export const getAIBookings = async (): Promise<{ success: boolean; bookings: any[]; error?: string }> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        bookings: [],
        error: '認證失敗'
      };
    }
    
    const { data, error } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (error) {
      return {
        success: false,
        bookings: [],
        error: '讀取資料失敗'
      };
    }
    
    const allBookings = data?.all_bookings || [];
    
    // 過濾出 AI 預約
    const aiBookings = allBookings.filter((booking: any) => 
      booking.admin_meta?.source === 'AI_Chatbot'
    );
    
    console.log(`🤖 [AI Service] 找到 ${aiBookings.length} 筆 AI 預約`);
    
    return {
      success: true,
      bookings: aiBookings
    };
    
  } catch (error) {
    console.error('❌ [AI Service] 獲取 AI 預約失敗:', error);
    return {
      success: false,
      bookings: [],
      error: error instanceof Error ? error.message : '系統錯誤'
    };
  }
};
