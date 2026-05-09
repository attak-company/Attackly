// 定義 Appointment 介面以避免循環依賴
export interface Appointment {
  id: string;
  customer_name?: string;
  phone?: string;
  email?: string;
  tags?: string[];
  service?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  remainingTime?: string;
  status?: string;
  source?: string;
  aiNotes?: string;
  history?: any[];
  is_active?: boolean;
  is_finished?: boolean;
  category?: 'booking' | 'activity';
  
  // V2 新的 JSONB 結構
  customer_detail?: {
    name: string;
    phone: string;
    email?: string;
    tags: string[];
  };
  
  service_content?: {
    service: string;
    price: number;
    category: string;
  };
  
  schedule_config?: {
    date: string;
    duration: number;
    end_time: string;
  };
  
  admin_meta?: {
    status: string;
    source: string;
    ai_notes: string;
  };
}

/**
 * AI Context 生成器 - 將 V2 資料結構轉換為 AI 可理解的格式
 * 這確保傳送給 AI 的是 V2 JSONB 結構，並優化 Token 使用
 */

export interface AIContext {
  customer: {
    name: string;
    phone?: string;
    email?: string;
    tags?: string[];
    history_count?: number;
  };
  service: {
    name: string;
    price: number;
    category: string;
  };
  schedule: {
    date: string;
    time: string;
    duration: number;
    end_time: string;
  };
  metadata: {
    status: string;
    source: string;
    ai_notes?: string;
    is_confirmed: boolean;
  };
}

/**
 * 將 Appointment 轉換為 AI 可理解的 Context
 * 只提取必要的資訊，減少 Token 消耗
 */
export const generateAIContext = (appointment: Appointment): AIContext => {
  return {
    customer: {
      name: appointment.customer_name || '未知客戶',
      phone: appointment.phone,
      email: appointment.email,
      tags: appointment.tags || [],
      history_count: appointment.history?.length || 0
    },
    service: {
      name: appointment.service_content?.service || appointment.service || '未指定服務',
      price: appointment.service_content?.price || 0,
      category: appointment.service_content?.category || appointment.category || 'booking'
    },
    schedule: {
      date: appointment.schedule_config?.date || appointment.date || '',
      time: appointment.start_time || '',
      duration: appointment.schedule_config?.duration || parseInt(appointment.remainingTime?.replace(/\D/g, '') || '60'),
      end_time: appointment.schedule_config?.end_time || appointment.end_time || ''
    },
    metadata: {
      status: appointment.admin_meta?.status || appointment.status || 'confirmed',
      source: appointment.admin_meta?.source || appointment.source || 'manual',
      ai_notes: appointment.admin_meta?.ai_notes || appointment.aiNotes || '',
      is_confirmed: (appointment.admin_meta?.status || appointment.status || 'confirmed') === 'confirmed'
    }
  };
};

/**
 * 生成 AI 分析用的 System Prompt
 * 更新 AI 的「世界觀」，告訴它如何讀取 V2 結構
 */
export const getAISystemPrompt = (): string => {
  return `你是一位專業的數位店長 AI 助手。當你分析預約資料時，請遵循以下資料結構：

**資料結構說明：**
- 客戶資訊：從 customer 物件中獲取姓名、電話、標籤和歷史記錄
- 服務內容：從 service 物件中獲取服務名稱、價格和類別
- 排程資訊：從 schedule 物件中獲取日期、時間、時長和結束時間
- 管理資訊：從 metadata 物件中獲取狀態、來源和 AI 備註

**分析重點：**
1. **商業價值分析**：專注於 service.price 和 schedule.duration 計算 CP 值
2. **客戶行為模式**：分析 customer.tags 和 customer.history_count
3. **營運效率**：評估 schedule.date 和 schedule.time 的分佈
4. **來源分析**：區分 metadata.source 的不同管道效果

**重要提醒：**
- 不要理會 metadata 中的技術代碼，專注於商業價值提取
- 僅分析已確認的預約（metadata.is_confirmed === true）
- 使用 metadata.ai_notes 來理解之前的 AI 分析結果
- 回應時請提供具體的商業洞察和建議`;
};

/**
 * 生成 AI 標籤建議的 Prompt
 */
export const getAITaggingPrompt = (context: AIContext): string => {
  return `請根據以下客戶資料，生成 3-5 個精準的標籤來描述客戶特徵：

客戶姓名：${context.customer.name}
服務項目：${context.service.name}（$${context.service.price}）
預約時長：${context.schedule.duration} 分鐘
歷史預約次數：${context.customer.history_count}
現有標籤：${context.customer.tags?.join(', ') || '無'}

請生成適合的標籤，格式為：["標籤1", "標籤2", "標籤3"]
標籤應該反映客戶的消費習慣、偏好特徵或價值等級。`;
};

/**
 * 生成 AI 營運分析 Prompt
 */
export const getAIAnalysisPrompt = (contexts: AIContext[]): string => {
  const totalRevenue = contexts.reduce((sum, ctx) => sum + ctx.service.price, 0);
  const avgDuration = contexts.length > 0 
    ? Math.round(contexts.reduce((sum, ctx) => sum + ctx.schedule.duration, 0) / contexts.length)
    : 0;
  
  return `請分析以下預約數據並提供商業洞察：

**總體數據：**
- 總預約數：${contexts.length}
- 總營收：$${totalRevenue}
- 平均時長：${avgDuration} 分鐘

**分析要求：**
1. 識別最賺錢的服務項目
2. 分析客戶預約時間偏好
3. 評估不同來源的轉化效果
4. 提供營運優化建議

請提供具體、可執行的商業建議。`;
};

/**
 * AI 寫回資料的 Helper
 * 將 AI 生成的標籤或筆記寫入正確的 V2 欄位
 */
export const writeAIResponse = (appointmentId: string, aiTags?: string[], aiNotes?: string) => {
  return {
    admin_meta: {
      ai_notes: aiNotes || '',
      source: 'AI_Chatbot',
      status: 'confirmed'
    },
    marketing_data: aiTags ? {
      tags: aiTags,
      last_analyzed: new Date().toISOString()
    } : undefined
  };
};
