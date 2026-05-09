import { adaptAIBookingToV3, saveAIBookingToV3, AIBookingData } from './aiBookingAdapter';

/**
 * 模擬七筆 AI 預約訂單數據
 * 完全符合 V3 轉接器的輸入格式
 */
export const mockAIBookings: AIBookingData[] = [
  {
    customer_name: "王小明",
    customer_phone: "0912345678",
    service: "剪髮服務",
    date: "2026-05-07",
    time: "09:30",
    duration: 60,
    ai_notes: "AI 自動預約 - 新客戶",
    tags: ["新客戶", "AI預約"]
  },
  {
    customer_name: "李小美",
    customer_phone: "0923456789",
    service: "染髮服務",
    date: "2026-05-07",
    time: "11:00",
    duration: 120,
    ai_notes: "AI 自動預約 - 回頭客",
    tags: ["回頭客", "染髮"]
  },
  {
    customer_name: "張大華",
    customer_phone: "0934567890",
    service: "燙髮服務",
    date: "2026-05-07",
    time: "14:00",
    duration: 90,
    ai_notes: "AI 自動預約 - 指定時間",
    tags: ["燙髮", "指定時間"]
  },
  {
    customer_name: "陳小芳",
    customer_phone: "0945678901",
    service: "護髮服務",
    date: "2026-05-08",
    time: "10:30",
    duration: 45,
    ai_notes: "AI 自動預約 - 快速服務",
    tags: ["護髮", "快速"]
  },
  {
    customer_name: "林先生",
    customer_phone: "0956789012",
    service: "造型設計",
    date: "2026-05-08",
    time: "13:00",
    duration: 150,
    ai_notes: "AI 自動預約 - 長時間服務",
    tags: ["造型", "長時間"]
  },
  {
    customer_name: "黃小姐",
    customer_phone: "0967890123",
    service: "洗剪吹",
    date: "2026-05-08",
    time: "16:30",
    duration: 30,
    ai_notes: "AI 自動預約 - 臨時預約",
    tags: ["洗剪", "臨時"]
  },
  {
    customer_name: "周老闆",
    customer_phone: "0978901234",
    service: "深層護理",
    date: "2026-05-09",
    time: "15:00",
    duration: 180,
    ai_notes: "AI 自動預約 - VIP客戶",
    tags: ["VIP", "護理", "深層"]
  }
];

/**
 * 批量寫入 AI 預約到 V3 資料庫
 */
export const batchInsertAIBookings = async (): Promise<{ success: boolean; message: string }> => {
  console.log('🚀 [Test AI] 開始批量寫入 AI 預約...');
  
  try {
    const results = [];
    
    for (let i = 0; i < mockAIBookings.length; i++) {
      const booking = mockAIBookings[i];
      console.log(`📝 [Test AI] 處理第 ${i + 1}/${mockAIBookings.length} 筆預約:`, booking.customer_name);
      
      const result = await saveAIBookingToV3(booking);
      results.push(result);
      
      // 模擬 AI 處理延遲
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    
    console.log(`📊 [Test AI] 批量寫入結果: ${successCount} 成功, ${failedCount} 失敗`);
    
    if (failedCount > 0) {
      const failedBookings = results.filter(r => !r.success);
      console.error('❌ [Test AI] 失敗的預約:', failedBookings);
      return {
        success: false,
        message: `部分寫入失敗: ${successCount}/${mockAIBookings.length} 成功`
      };
    }
    
    return {
      success: true,
      message: `✅ 成功寫入 ${successCount} 筆 AI 預約到 V3 資料庫！`
    };
    
  } catch (error) {
    console.error('❌ [Test AI] 批量寫入系統錯誤:', error);
    return {
      success: false,
      message: `系統錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`
    };
  }
};

/**
 * 測試單筆 AI 預約寫入
 */
export const testSingleAIBooking = async (bookingData: AIBookingData): Promise<{ success: boolean; message: string }> => {
  console.log('🧪 [Test AI] 測試單筆 AI 預約:', bookingData.customer_name);
  
  try {
    const result = await saveAIBookingToV3(bookingData);
    
    if (result.success) {
      console.log('✅ [Test AI] 單筆預約成功:', result.bookingId);
      return {
        success: true,
        message: `✅ AI 預約成功寫入，ID: ${result.bookingId}`
      };
    } else {
      console.error('❌ [Test AI] 單筆預約失敗:', result.error);
      return {
        success: false,
        message: `❌ AI 預約失敗: ${result.error}`
      };
    }
    
  } catch (error) {
    console.error('❌ [Test AI] 單筆預約系統錯誤:', error);
    return {
      success: false,
      message: `系統錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`
    };
  }
};
