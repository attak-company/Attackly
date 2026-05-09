// 修復黃小姐預約的 source 欄位
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

async function fixAISource() {
  try {
    console.log('🔧 開始修復 AI 預約的 source 欄位...');
    
    // 讀取現有資料
    const { data: userData, error: userError } = await supabase
      .from('shop_bookings_v3')
      .select('all_bookings')
      .eq('user_id', '9671a408-107d-41cd-8064-b7924f8db229')
      .maybeSingle();
    
    if (userError) throw userError;
    
    const allBookings = userData?.all_bookings || [];
    console.log(`📊 找到 ${allBookings.length} 筆預約`);
    
    // 找到黃小姐的預約並修復
    let fixedCount = 0;
    const updatedBookings = allBookings.map(booking => {
      if (booking.customer_name === '黃小姐' && 
          booking.schedule?.date === '2026-05-08' &&
          booking.admin_meta?.source === 'web_dashboard') {
        
        console.log('🔧 修復黃小姐預約:', booking.id);
        
        // 修復 source 欄位
        const updatedBooking = {
          ...booking,
          admin_meta: {
            ...booking.admin_meta,
            source: 'AI_Chatbot'
          }
        };
        
        fixedCount++;
        return updatedBooking;
      }
      return booking;
    });
    
    if (fixedCount > 0) {
      // 更新資料庫
      const { error: updateError } = await supabase
        .from('shop_bookings_v3')
        .update({ all_bookings: updatedBookings })
        .eq('user_id', '9671a408-107d-41cd-8064-b7924f8db229');
      
      if (updateError) throw updateError;
      
      console.log(`✅ 成功修復 ${fixedCount} 筆 AI 預約的 source 欄位`);
    } else {
      console.log('ℹ️ 沒有找到需要修復的預約');
    }
    
  } catch (error) {
    console.error('❌ 修復失敗:', error);
  }
}

fixAISource();
