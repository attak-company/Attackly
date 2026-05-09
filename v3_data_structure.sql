-- ========================================
-- V3 資料物件結構定義
-- shop_bookings_v3 與 shop_customers_v3 的核心存放標準
-- ========================================

-- ========================================
-- 2. 顧客資料格式 (用於 all_customers 陣列)
-- ========================================

/*
將 V1 customers 表格中的營運數據完整打包，方便未來做顧客分析：

{
  "id": "289be5e3-f0c4-4f1c-b0f6-54cf8c9cff79", // 原始顧客 ID
  "name": "李先生", // 姓名
  "phone": "0975999999", // 電話
  "email": "lee9999@gmail.com", // 信箱
  "stats": {
    "total_bookings": 1, // 累計預約數
    "total_spending": 2000, // 累計消費金額
    "no_show_count": 0, // 未到診次數
    "last_purchase_at": "2026-05-02 00:00:00+00" // 最後消費日
  },
  "status": {
    "is_blacklisted": false, // 是否黑名單
    "blacklist_reason": null // 黑名單理由
  },
  "tags": ["新客", "VIP"], // 顧客標籤
  "manual_notes": "" // 店長手寫備註
}
*/

-- ========================================
-- V3 顧客物件完整欄位說明
-- ========================================

/*
頂層欄位：
- id: 顧客唯一識別碼（字串，保持 V1 原始 ID）
- name: 顧客姓名（字串）
- phone: 顧客電話（字串）
- email: 顧客信箱（字串）
- stats: 統計資訊物件
- status: 狀態資訊物件
- tags: 顧客標籤（字串陣列）
- manual_notes: 手寫備註（字串）

stats 物件欄位：
- total_bookings: 累計預約數（整數）
- total_spending: 累計消費金額（整數）
- no_show_count: 未到診次數（整數）
- last_purchase_at: 最後消費時間（ISO 8601 格式字串）

status 物件欄位：
- is_blacklisted: 是否在黑名單（布林值）
- blacklist_reason: 黑名單理由（字串或 null）
*/

-- ========================================
-- V3 顧客物件範例（完整版）
-- ========================================

{
  "id": "289be5e3-f0c4-4f1c-b0f6-54cf8c9cff79",
  "name": "李先生",
  "phone": "0975999999",
  "email": "lee9999@gmail.com",
  "stats": {
    "total_bookings": 1,
    "total_spending": 2000,
    "no_show_count": 0,
    "last_purchase_at": "2026-05-02 00:00:00+00"
  },
  "status": {
    "is_blacklisted": false,
    "blacklist_reason": null
  },
  "tags": ["新客", "VIP"],
  "manual_notes": "首次嘗試美甲服務，對指甲油有特殊要求"
}

-- ========================================
-- V3 顧客物件範例（黑名單）
-- ========================================

{
  "id": "289be5e3-f0c4-4f1c-b0f6-54cf8c9cff80",
  "name": "張小姐",
  "phone": "0912345678",
  "email": "zhang@example.com",
  "stats": {
    "total_bookings": 5,
    "total_spending": 8000,
    "no_show_count": 3,
    "last_purchase_at": "2026-04-15 14:00:00+00"
  },
  "status": {
    "is_blacklisted": true,
    "blacklist_reason": "多次未到且無法聯繫"
  },
  "tags": ["舊客", "問題客戶"],
  "manual_notes": "曾經是 VIP 客戶，但因多次爽約被列入黑名單"
}

-- ========================================
-- V3 顧客物件範例（VIP 客戶）
-- ========================================

{
  "id": "289be5e3-f0c4-4f1c-b0f6-54cf8c9cff81",
  "name": "王女士",
  "phone": "0987654321",
  "email": "wang@example.com",
  "stats": {
    "total_bookings": 12,
    "total_spending": 24000,
    "no_show_count": 0,
    "last_purchase_at": "2026-05-01 16:00:00+00"
  },
  "status": {
    "is_blacklisted": false,
    "blacklist_reason": null
  },
  "tags": ["VIP", "老客戶", "高消費"],
  "manual_notes": "每月固定消費，喜歡嘗試新服務，推薦優先安排"
}

-- ========================================
-- V3 顧客資料驗證規則
-- ========================================

/*
資料驗證規則：
1. id 必須為字串且不為空
2. name 必須為字串且長度 1-50 字元
3. phone 必須符合台灣手機格式或為空字串
4. email 必須為有效 email 格式或為空字串
5. stats.total_bookings 必須為非負整數
6. stats.total_spending 必須為非負整數
7. stats.no_show_count 必須為非負整數
8. stats.last_purchase_at 必須為有效的 ISO 8601 格式或 null
9. status.is_blacklisted 必須為布林值
10. status.blacklist_reason 必須為字串或 null
11. tags 必須為字串陣列
12. manual_notes 長度限制 0-1000 字元
*/

-- ========================================
-- V3 顧客資料遷移說明
-- ========================================

/*
從 V1 遷移到 V3 的資料對應：

V1 欄位 → V3 欄位：
- customers.id → id
- customers.name → name
- customers.phone → phone
- customers.email → email
- customers.total_bookings → stats.total_bookings
- customers.total_spending → stats.total_spending
- customers.no_show_count → stats.no_show_count
- customers.last_purchase_at → stats.last_purchase_at
- customers.is_blacklisted → status.is_blacklisted
- customers.blacklist_reason → status.blacklist_reason
- customers.tags → tags
- customers.manual_notes → manual_notes

注意事項：
1. 保持原始顧客 ID 以確保資料一致性
2. 統計資料打包到 stats 物件中
3. 狀態資料打包到 status 物件中
4. 黑名單相關資料集中管理
5. 方便未來進行顧客分析和行銷
*/

-- ========================================
-- 1. 預約資料格式 (用於 all_bookings 陣列)
-- ========================================

/*
每一筆預約物件必須「焊死」所有相關資訊，包含從 V1 bookings 與 customers 表格中撈出的資料：

{
  "id": "1777694899520", // 保持 V1/V2 的原始 ID
  "customer_name": "陳先生", // 直接存入姓名，不再關聯 ID
  "customer_phone": "0975203226", // 直接存入電話
  "customer_email": "cyx960402@gmail.com", // 直接存入信箱
  "service_info": {
    "name": "中式美甲", // V1 的 service 欄位
    "price": 2000, // V1 的 price 欄位
    "category": "booking", // 區分 'booking' 預約或 'activity' 店內任務
    "service_type": "nail" // 服務類型
  },
  "schedule": {
    "start": "2026-05-02 04:10:00+00", // 原始開始時間
    "end": "2026-05-02 05:10:00+00", // 原始結束時間
    "date": "2026-05-02", // 日期
    "duration": "60" // 分鐘數
  },
  "status": "completed", // 預約狀態
  "admin_meta": {
    "tags": ["新客", "VIP"], // 搬遷自 V1 customers 的 tags
    "ai_notes": "", // V1 的 ai_notes
    "source": "manual", // 預約來源
    "notes": "" // 備註
  }
}
*/

-- ========================================
-- V3 預約物件完整欄位說明
-- ========================================

/*
頂層欄位：
- id: 預約唯一識別碼（字串，保持 V1/V2 原始 ID）
- customer_name: 客戶姓名（字串）
- customer_phone: 客戶電話（字串）
- customer_email: 客戶信箱（字串）
- service_info: 服務資訊物件
- schedule: 排程資訊物件
- status: 預約狀態（字串）
- admin_meta: 管理資訊物件

service_info 物件欄位：
- name: 服務名稱（字串）
- price: 服務價格（整數）
- category: 服務類別（字串，"booking" 或 "activity"）
- service_type: 服務類型（字串，如 "nail", "hair", "facial"）

schedule 物件欄位：
- start: 開始時間（ISO 8601 格式字串）
- end: 結束時間（ISO 8601 格式字串）
- date: 日期（YYYY-MM-DD 格式字串）
- duration: 持續時間（分鐘，字串）

admin_meta 物件欄位：
- tags: 標籤陣列（字串陣列）
- ai_notes: AI 備註（字串）
- source: 資料來源（字串）
- notes: 備註（字串）
*/

-- ========================================
-- V3 預約狀態定義
-- ========================================

/*
status 可選值：
- "pending": 待確認
- "confirmed": 已確認
- "in_progress": 進行中
- "completed": 已完成
- "cancelled": 已取消
- "no_show": 未到
- "rescheduled": 已重新排程
- "waiting_list": 候補
*/

-- ========================================
-- V3 服務類別定義
-- ========================================

/*
service_info.category 可選值：
- "booking": 一般預約服務
- "activity": 店內任務/活動
*/

-- ========================================
-- V3 服務類型定義
-- ========================================

/*
service_info.service_type 可選值：
- "nail": 美甲服務
- "hair": 美髮服務
- "facial": 臉部護理
- "massage": 按摩服務
- "eyelash": 睫毛服務
- "other": 其他服務
*/

-- ========================================
-- V3 資料來源定義
-- ========================================

/*
admin_meta.source 可選值：
- "manual": 手動建立
- "web_dashboard": 網頁後台
- "mobile_app": 手機應用程式
- "phone_call": 電話預約
- "walk_in": 現場預約
- "import": 匯入資料
*/

-- ========================================
-- V3 預約物件範例（完整版）
-- ========================================

{
  "id": "1777694899520",
  "customer_name": "陳先生",
  "customer_phone": "0975203226",
  "customer_email": "cyx960402@gmail.com",
  "service_info": {
    "name": "中式美甲",
    "price": 2000,
    "category": "booking",
    "service_type": "nail"
  },
  "schedule": {
    "start": "2026-05-02 04:10:00+00",
    "end": "2026-05-02 05:10:00+00",
    "date": "2026-05-02",
    "duration": "60"
  },
  "status": "completed",
  "admin_meta": {
    "tags": ["新客", "VIP"],
    "ai_notes": "客戶喜歡紅色系",
    "source": "manual",
    "notes": "首次嘗試中式美甲"
  }
}

-- ========================================
-- V3 預約物件範例（店內任務）
-- ========================================

{
  "id": "1777694899521",
  "customer_name": "店內任務",
  "customer_phone": "",
  "customer_email": "",
  "service_info": {
    "name": "店內清潔",
    "price": 0,
    "category": "activity",
    "service_type": "other"
  },
  "schedule": {
    "start": "2026-05-02 06:00:00+00",
    "end": "2026-05-02 07:00:00+00",
    "date": "2026-05-02",
    "duration": "60"
  },
  "status": "completed",
  "admin_meta": {
    "tags": ["維護"],
    "ai_notes": "",
    "source": "manual",
    "notes": "每週固定清潔時間"
  }
}

-- ========================================
-- V3 預約物件範例（新客戶）
-- ========================================

{
  "id": "1777694899522",
  "customer_name": "林小姐",
  "customer_phone": "0912345678",
  "customer_email": "lin@example.com",
  "service_info": {
    "name": "法式美甲",
    "price": 1500,
    "category": "booking",
    "service_type": "nail"
  },
  "schedule": {
    "start": "2026-05-05 14:00:00+00",
    "end": "2026-05-05 15:30:00+00",
    "date": "2026-05-05",
    "duration": "90"
  },
  "status": "confirmed",
  "admin_meta": {
    "tags": ["新客"],
    "ai_notes": "首次嘗試法式美甲",
    "source": "web_dashboard",
    "notes": "客戶要求使用無毒指甲油"
  }
}

-- ========================================
-- V3 資料驗證規則
-- ========================================

/*
資料驗證規則：
1. id 必須為字串且不為空
2. customer_name 必須為字串且長度 1-50 字元
3. customer_phone 必須符合台灣手機格式或為空字串
4. customer_email 必須為有效 email 格式或為空字串
5. service_info.name 必須為字串且長度 1-100 字元
6. service_info.price 必須為非負整數
7. service_info.category 必須為 "booking" 或 "activity"
8. service_info.service_type 必須為預定類型之一
9. schedule.start 必須為有效的 ISO 8601 格式
10. schedule.end 必須為有效的 ISO 8601 格式且晚於 start
11. schedule.date 必須為有效的 YYYY-MM-DD 格式
12. schedule.duration 必須為正整數字串
13. status 必須為預定狀態值之一
14. admin_meta.tags 必須為字串陣列
15. admin_meta.ai_notes 長度限制 0-1000 字元
16. admin_meta.source 必須為預定來源值之一
17. admin_meta.notes 長度限制 0-500 字元
*/

-- ========================================
-- V3 資料遷移說明
-- ========================================

/*
從 V1/V2 遷移到 V3 的資料對應：

V1/V2 欄位 → V3 欄位：
- bookings.id → id
- customers.name → customer_name
- customers.phone → customer_phone
- customers.email → customer_email
- bookings.service → service_info.name
- bookings.price → service_info.price
- bookings.category → service_info.category
- bookings.service_type → service_info.service_type
- bookings.start_time → schedule.start
- bookings.end_time → schedule.end
- bookings.date → schedule.date
- bookings.duration → schedule.duration
- bookings.status → status
- customers.tags → admin_meta.tags
- bookings.ai_notes → admin_meta.ai_notes
- bookings.source → admin_meta.source
- bookings.notes → admin_meta.notes

注意事項：
1. 所有客戶資訊直接「焊死」在預約物件中
2. 不再使用 customer_id 進行關聯
3. 保持原始 ID 以確保資料一致性
4. 時間格式統一為 ISO 8601
5. 價格統一為整數
6. 狀態統一為字串
*/
