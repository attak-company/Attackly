const { createClient } = require('@supabase/supabase-js');

// 直接使用環境變數
const supabaseUrl = 'https://your-project.supabase.co'; // 請替換為實際 URL
const supabaseKey = 'your-service-role-key'; // 請替換為實際 key

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupErrorBooking() {
  try {
    console.log('🧹 開始清理錯誤的預約資料...');
    
    const user_id = '9671a408-107d-41cd-8064-b7924f8db229';
    const errorBookingId = '61ae2cb7-04ef-4d5f-a980-36e96505aeae';
    
    // 1. 先獲取當前的預約資料
    const { data: currentData, error: fetchError } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', user_id)
      .maybeSingle();
    
    if (fetchError) {
      console.error('❌ 獲取預約資料失敗:', fetchError);
      return;
    }
    
    if (!currentData?.all_bookings) {
      console.log('📝 沒有找到任何預約資料');
      return;
    }
    
    console.log(`📊 當前預約總數: ${currentData.all_bookings.length}`);
    
    // 2. 過濾掉錯誤的預約
    const filteredBookings = currentData.all_bookings.filter(booking => {
      if (booking.id === errorBookingId) {
        console.log(`🗑️  找到錯誤預約，準備刪除:`, {
          id: booking.id,
          customer_name: booking.customer_name,
          service: booking.service_info?.name,
          start_time: booking.schedule?.start
        });
        return false; // 排除這個預約
      }
      return true; // 保留其他預約
    });
    
    console.log(`✅ 過濾後預約數量: ${filteredBookings.length}`);
    
    // 3. 更新資料庫
    const { data: updateData, error: updateError } = await supabase
      .from('shop_bookings_v3')
      .update({ all_bookings: filteredBookings })
      .eq('user_id', user_id)
      .select();
    
    if (updateError) {
      console.error('❌ 更新資料庫失敗:', updateError);
      return;
    }
    
    console.log('✅ 錯誤預約已成功刪除！');
    console.log('📊 更新後的預約數量:', filteredBookings.length);
    
    // 4. 檢查是否需要清理相關客戶資料
    const errorBooking = currentData.all_bookings.find(b => b.id === errorBookingId);
    if (errorBooking?.customer_phone) {
      console.log(`🔍 檢查客戶 ${errorBooking.customer_phone} 的其他預約...`);
      
      const hasOtherBookings = filteredBookings.some(booking => 
        booking.customer_phone === errorBooking.customer_phone
      );
      
      if (!hasOtherBookings) {
        console.log(`📝 客戶 ${errorBooking.customer_phone} 沒有其他預約，可以考慮清理客戶資料`);
        
        // 獲取客戶資料
        const { data: customerData } = await supabase
          .from('shop_customers_v3')
          .select('all_customers')
          .eq('user_id', user_id)
          .maybeSingle();
        
        if (customerData?.all_customers) {
          const filteredCustomers = customerData.all_customers.filter(customer => 
            customer.phone !== errorBooking.customer_phone
          );
          
          if (filteredCustomers.length < customerData.all_customers.length) {
            await supabase
              .from('shop_customers_v3')
              .update({ all_customers: filteredCustomers })
              .eq('user_id', user_id);
            
            console.log('✅ 相關客戶資料也已清理');
          }
        }
      } else {
        console.log(`✅ 客戶 ${errorBooking.customer_phone} 還有其他預約，保留客戶資料`);
      }
    }
    
  } catch (error) {
    console.error('❌ 清理過程發生錯誤:', error);
  }
}

// 執行清理
cleanupErrorBooking();
