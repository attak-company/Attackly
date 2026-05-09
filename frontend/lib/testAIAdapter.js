// 直接在瀏覽器 Console 執行的 AI 轉接器測試
// 複製貼上到 Console 然後執行：testAIAdapter()

async function testAIAdapter() {
  console.log('🚀 [Direct Test] 開始測試 AI 轉接器...');
  
  try {
    // 1. 檢查 Supabase 是否可用
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase 未定義，請在正確的頁面執行');
      return;
    }
    
    // 2. 獲取當前用戶
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ 認證失敗:', authError);
      return;
    }
    
    console.log('✅ 當前用戶 ID:', user.id);
    
    // 3. 讀取現有的 V3 資料
    const { data: existingData, error: fetchError } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (fetchError) {
      console.error('❌ 讀取資料失敗:', fetchError);
      return;
    }
    
    const currentBookings = existingData?.all_bookings || [];
    console.log(`📊 當前總預約數量: ${currentBookings.length}`);
    
    // 4. 創建測試 AI 預約資料
    const testAIBooking = {
      customer_name: "測試 AI 客戶",
      customer_phone: "0912345678",
      service: "測試剪髮服務",
      date: "2026-05-07",
      time: "14:30",
      duration: 60,
      ai_notes: "直接測試 AI 預約",
      tags: ["測試", "AI"]
    };
    
    console.log('🤖 測試 AI 資料:', testAIBooking);
    
    // 5. 手動創建 V3 格式預約
    const bookingId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const v3Booking = {
      id: bookingId,
      customer_name: testAIBooking.customer_name,
      customer_phone: testAIBooking.customer_phone,
      customer_email: '',
      service_info: {
        name: testAIBooking.service,
        duration: testAIBooking.duration,
        price: 0,
        category: 'booking'
      },
      schedule: {
        date: testAIBooking.date,
        start: new Date(`${testAIBooking.date}T${testAIBooking.time}:00`).toISOString(),
        end: new Date(`${testAIBooking.date}T${testAIBooking.time}:00`).toISOString(),
        duration: testAIBooking.duration
      },
      status: 'pending',
      admin_meta: {
        source: 'AI_Chatbot',
        ai_notes: testAIBooking.ai_notes,
        tags: testAIBooking.tags,
        created_at: now,
        updated_at: now
      }
    };
    
    console.log('✅ 創建的 V3 預約:', v3Booking);
    
    // 6. 直接寫入資料庫
    const updatedBookings = [...currentBookings, v3Booking];
    
    const { error: updateError } = await supabase
      .from('shop_bookings_v3')
      .update({ 
        all_bookings: updatedBookings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
      
    if (updateError) {
      console.error('❌ 寫入失敗:', updateError);
      return;
    }
    
    console.log('✅ AI 預約成功寫入！');
    console.log(`📝 預約 ID: ${v3Booking.id}`);
    console.log(`👤 客戶: ${v3Booking.customer_name}`);
    console.log(`📞 服務: ${v3Booking.service_info.name}`);
    console.log(`🕐 時間: ${v3Booking.schedule.start}`);
    console.log(`📊 來源: ${v3Booking.admin_meta.source}`);
    
    // 7. 驗證寫入
    const { data: verifyData } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const newTotal = verifyData?.all_bookings?.length || 0;
    console.log(`📈 寫入後總預約數量: ${newTotal}`);
    
    if (newTotal > currentBookings.length) {
      console.log('🎉 AI 預約寫入成功！請刷新預約管理頁面查看。');
    } else {
      console.log('❌ AI 預約寫入失敗！');
    }
    
  } catch (error) {
    console.error('❌ 測試過程發生錯誤:', error);
  }
}

console.log('💡 使用方法：複製此段代碼到瀏覽器 Console 執行，然後輸入 testAIAdapter()');
