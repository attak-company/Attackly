import { batchInsertAIBookings, mockAIBookings } from './testAIBookings';
import { confirmAIBooking, cancelAIBooking, getAIBookings } from './aiBookingService';

/**
 * AI 預約系統整合測試
 * 模擬完整的 AI 預約流程
 */

/**
 * 完整的 AI 預約流程測試
 */
export const runCompleteAIBookingTest = async (): Promise<void> => {
  console.log('🚀 [AI Integration] 開始完整 AI 預約系統測試...');
  
  try {
    // 步驟 1: 批量寫入 AI 預約
    console.log('\n📝 步驟 1: 批量寫入 AI 預約...');
    const insertResult = await batchInsertAIBookings();
    
    if (!insertResult.success) {
      console.error('❌ [AI Integration] 批量寫入失敗:', insertResult.message);
      return;
    }
    
    console.log('✅ [AI Integration] 批量寫入成功:', insertResult.message);
    
    // 等待一下確保資料庫更新完成
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 步驟 2: 獲取所有 AI 預約
    console.log('\n📋 步驟 2: 獲取所有 AI 預約...');
    const getResult = await getAIBookings();
    
    if (!getResult.success) {
      console.error('❌ [AI Integration] 獲取失敗:', getResult.error);
      return;
    }
    
    console.log(`✅ [AI Integration] 獲取成功，共 ${getResult.bookings.length} 筆 AI 預約`);
    
    // 顯示所有 AI 預約的狀態
    getResult.bookings.forEach((booking: any, index: number) => {
      console.log(`  ${index + 1}. ${booking.customer_name} - ${booking.status} - ${booking.service_info?.name}`);
    });
    
    // 步驟 3: 測試確認功能（確認前 3 筆）
    console.log('\n✅ 步驟 3: 測試確認功能...');
    const pendingBookings = getResult.bookings.filter((b: any) => b.status === 'pending');
    const bookingsToConfirm = pendingBookings.slice(0, 3);
    
    if (bookingsToConfirm.length > 0) {
      const confirmIds = bookingsToConfirm.map((b: any) => b.id);
      console.log(`🔍 [AI Integration] 將確認 ${bookingsToConfirm.length} 筆預約:`, confirmIds);
      
      const confirmResult = await confirmAIBooking(confirmIds[0]);
      if (confirmResult.success) {
        console.log('✅ [AI Integration] 單筆確認成功:', confirmResult.message);
      } else {
        console.error('❌ [AI Integration] 單筆確認失敗:', confirmResult.message);
      }
    }
    
    // 步驟 4: 測試取消功能（取消 1 筆）
    console.log('\n❌ 步驟 4: 測試取消功能...');
    const confirmedBookings = getResult.bookings.filter((b: any) => b.status === 'confirmed');
    const bookingToCancel = confirmedBookings[0];
    
    if (bookingToCancel) {
      console.log(`🗑️ [AI Integration] 將取消預約: ${bookingToCancel.customer_name} (${bookingToCancel.id})`);
      
      const cancelResult = await cancelAIBooking(bookingToCancel.id, '測試取消');
      if (cancelResult.success) {
        console.log('✅ [AI Integration] 取消成功:', cancelResult.message);
      } else {
        console.error('❌ [AI Integration] 取消失敗:', cancelResult.message);
      }
    }
    
    // 步驟 5: 最終狀態檢查
    console.log('\n📊 步驟 5: 最終狀態檢查...');
    const finalResult = await getAIBookings();
    
    if (finalResult.success) {
      const statusCount = {
        pending: finalResult.bookings.filter((b: any) => b.status === 'pending').length,
        confirmed: finalResult.bookings.filter((b: any) => b.status === 'confirmed').length,
        cancelled: finalResult.bookings.filter((b: any) => b.status === 'cancelled').length,
        total: finalResult.bookings.length
      };
      
      console.log('📈 [AI Integration] 最終狀態統計:', statusCount);
      console.log('✅ [AI Integration] 完整 AI 預約系統測試完成！');
      
    } else {
      console.error('❌ [AI Integration] 最終檢查失敗:', finalResult.error);
    }
    
  } catch (error) {
    console.error('❌ [AI Integration] 測試過程中發生系統錯誤:', error);
  }
};

/**
 * 清理測試資料
 */
export const cleanTestAIBookings = async (): Promise<void> => {
  console.log('🧹 [AI Integration] 開始清理測試資料...');
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ [AI Integration] 認證失敗，無法清理資料');
      return;
    }
    
    // 讀取現有資料
    const { data: existingData, error: fetchError } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (fetchError) {
      console.error('❌ [AI Integration] 讀取資料失敗:', fetchError);
      return;
    }
    
    if (!existingData?.all_bookings) {
      console.log('ℹ️ [AI Integration] 沒有資料需要清理');
      return;
    }
    
    // 過濾出 AI 預約並移除
    const nonAIBookings = existingData.all_bookings.filter((booking: any) => 
      booking.admin_meta?.source !== 'AI_Chatbot'
    );
    
    // 更新資料庫
    const { error: updateError } = await supabase
      .from('shop_bookings_v3')
      .update({ 
        all_bookings: nonAIBookings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
      
    if (updateError) {
      console.error('❌ [AI Integration] 清理失敗:', updateError);
    } else {
      console.log(`✅ [AI Integration] 清理完成，移除了 ${existingData.all_bookings.length - nonAIBookings.length} 筆 AI 預約`);
    }
    
  } catch (error) {
    console.error('❌ [AI Integration] 清理過程中發生錯誤:', error);
  }
};

/**
 * 快速測試 - 只寫入不執行完整流程
 */
export const quickTest = async (): Promise<void> => {
  console.log('⚡ [AI Integration] 快速測試 - 只寫入 AI 預約...');
  
  const result = await batchInsertAIBookings();
  console.log(result.message);
  
  if (result.success) {
    console.log('🎉 [AI Integration] 快速測試成功！AI 預約已寫入 V3 資料庫');
    console.log('💡 [AI Integration] 現在可以到預約管理頁面查看這些預約');
    console.log('💡 [AI Integration] 它們會出現在 "pending" 狀態，等待確認');
  } else {
    console.log('❌ [AI Integration] 快速測試失敗:', result.message);
  }
};
