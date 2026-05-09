import { supabase } from './supabase';

/**
 * 調試 AI 預約是否正確寫入 V3 資料庫
 */
export const debugAIData = async (): Promise<void> => {
  console.log('🔍 [Debug] 開始調試 AI 預約資料...');
  
  try {
    // 1. 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ [Debug] 認證失敗:', authError);
      return;
    }
    
    console.log('✅ [Debug] 當前用戶 ID:', user.id);
    
    // 2. 讀取 V3 資料
    const { data, error } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (error) {
      console.error('❌ [Debug] 讀取 V3 資料失敗:', error);
      return;
    }
    
    const allBookings = data?.all_bookings || [];
    console.log(`📊 [Debug] 總預約數量: ${allBookings.length}`);
    
    // 3. 分析所有預約
    const statusCount = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
      in_progress: 0,
      waiting_list: 0,
      rescheduled: 0
    };
    
    const sourceCount = {
      AI_Chatbot: 0,
      phone: 0,
      web: 0,
      admin: 0
    };
    
    const categoryCount = {
      booking: 0,
      activity: 0
    };
    
    allBookings.forEach((booking: any, index: number) => {
      const status = booking.status || 'unknown';
      const source = booking.admin_meta?.source || 'unknown';
      const category = booking.service_info?.category || 'unknown';
      
      // 狀態統計
      if (statusCount.hasOwnProperty(status)) {
        statusCount[status as keyof typeof statusCount]++;
      }
      
      // 來源統計
      if (sourceCount.hasOwnProperty(source)) {
        sourceCount[source as keyof typeof sourceCount]++;
      }
      
      // 類別統計
      if (categoryCount.hasOwnProperty(category)) {
        categoryCount[category as keyof typeof categoryCount]++;
      }
      
      // 顯示前 5 筆預約的詳細資訊
      if (index < 5) {
        console.log(`  ${index + 1}. ${booking.customer_name} - ${status} - ${source} - ${category}`);
        console.log(`     服務: ${booking.service_info?.name}`);
        console.log(`     時間: ${booking.schedule?.start}`);
      }
    });
    
    console.log('📈 [Debug] 狀態統計:', statusCount);
    console.log('🤖 [Debug] 來源統計:', sourceCount);
    console.log('📦 [Debug] 類別統計:', categoryCount);
    
    // 4. 專門檢查 pending + booking 的預約
    const pendingBookings = allBookings.filter((booking: any) => {
      return booking.status === 'pending' && 
             booking.service_info?.category === 'booking';
    });
    
    console.log(`⏳ [Debug] Pending + Booking 預約數量: ${pendingBookings.length}`);
    
    if (pendingBookings.length === 0) {
      console.log('❌ [Debug] 沒有找到 pending + booking 的預約！');
      console.log('💡 [Debug] 可能的原因:');
      console.log('   1. AI 預約沒有成功寫入');
      console.log('   2. AI 預約的 status 不是 pending');
      console.log('   3. AI 預約的 category 不是 booking');
      console.log('   4. 過濾邏輯有問題');
    } else {
      console.log('✅ [Debug] 找到 pending + booking 預約:');
      pendingBookings.forEach((booking: any, index: number) => {
        console.log(`   ${index + 1}. ${booking.customer_name} (${booking.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ [Debug] 調試過程發生錯誤:', error);
  }
};
