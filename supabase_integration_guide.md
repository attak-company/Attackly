# Supabase 預約資料庫整合指南

## 第一步：執行 SQL 指令

1. 登入 Supabase Dashboard
2. 選擇你的專案
3. 點擊左側選單的 "SQL Editor"
4. 複製並執行 `supabase_booking_table.sql` 中的所有 SQL 指令

## 第二步：修改 Calendar 頁面以整合 Supabase

在 `c:\Attak\數位店長\frontend\app\(dashboard)\dashboard\calendar\page.tsx` 中進行以下修改：

### 2.1 添加 Supabase 查詢函數

在文件頂部（在 `CalendarPage` 組件之前）添加以下函數：

```typescript
// 從 Supabase 讀取預約資料
const fetchBookingsFromSupabase = async (supabase: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }

    // 將 Supabase 資料轉換為 Appointment 格式
    return data.map((booking: any) => ({
      id: booking.id,
      customerName: booking.customer_name,
      service: booking.service,
      serviceType: booking.service_type,
      serviceAbbr: booking.service_abbr,
      date: booking.date,
      time: booking.time,
      remainingTime: booking.duration,
      phone: booking.phone,
      email: booking.email,
      tags: booking.tags || [],
      aiNotes: booking.ai_notes || '',
      isFinished: booking.is_finished,
      isActive: booking.is_active
    }));
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};

// 保存預約到 Supabase
const saveBookingToSupabase = async (supabase: any, appointment: Appointment) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const bookingData = {
      customer_name: appointment.customerName,
      service: appointment.service,
      service_type: appointment.serviceType,
      service_abbr: appointment.serviceAbbr,
      date: appointment.date,
      time: appointment.time,
      duration: appointment.remainingTime,
      phone: appointment.phone,
      email: appointment.email,
      tags: appointment.tags,
      ai_notes: appointment.aiNotes,
      is_active: appointment.isActive !== false,
      is_finished: appointment.isFinished || false,
      user_id: user.id,
      booking_source: 'manual'
    };

    // 檢查是否已存在該預約
    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', appointment.id)
      .single();

    let result;
    if (existing) {
      // 更新現有預約
      result = await supabase
        .from('bookings')
        .update(bookingData)
        .eq('id', appointment.id);
    } else {
      // 插入新預約
      result = await supabase
        .from('bookings')
        .insert([{ ...bookingData, id: appointment.id }]);
    }

    if (result.error) {
      console.error('Error saving booking:', result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving booking:', error);
    return false;
  }
};

// 從 Supabase 刪除預約
const deleteBookingFromSupabase = async (supabase: any, appointmentId: string) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', appointmentId);

    if (error) {
      console.error('Error deleting booking:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting booking:', error);
    return false;
  }
};
```

### 2.2 修改 CalendarPage 組件的 useEffect

找到現有的 `useEffect`（大約在第 321 行），將 localStorage 的邏輯替換為 Supabase：

```typescript
// 從 Supabase 載入預約資料
useEffect(() => {
  const loadBookings = async () => {
    const bookings = await fetchBookingsFromSupabase(supabase);
    if (bookings.length > 0) {
      setAppointments(bookings);
    } else {
      // 如果 Supabase 沒有資料，使用 localStorage 的資料作為備份
      const localData = localStorage.getItem('appointments');
      if (localData) {
        setAppointments(JSON.parse(localData));
      }
    }
  };

  loadBookings();
}, [supabase]);

// 保存預約資料到 Supabase
useEffect(() => {
  if (appointments.length === 0) return;

  const saveToSupabase = async () => {
    for (const appointment of appointments) {
      await saveBookingToSupabase(supabase, appointment);
    }
  };

  saveToSupabase();
}, [appointments, supabase]);
```

### 2.3 修改新增預約函數

找到 `handleAddAppointment` 函數，在成功新增後添加 Supabase 保存：

```typescript
const handleAddAppointment = () => {
  // ... 現有的驗證邏輯 ...

  // 新增預約
  const newAppointment: Appointment = {
    // ... 現有的預約資料 ...
  };

  const updatedAppointments = [...appointments, newAppointment];
  setAppointments(updatedAppointments);

  // 保存到 Supabase
  saveBookingToSupabase(supabase, newAppointment);

  // ... 現有的其餘邏輯 ...
};
```

### 2.4 修改編輯預約函數

找到編輯預約的函數，在成功編輯後添加 Supabase 更新：

```typescript
// 在編輯預約的函數中
const updatedAppointment: Appointment = {
  // ... 更新的預約資料 ...
};

const updatedAppointments = appointments.map(app =>
  app.id === updatedAppointment.id ? updatedAppointment : app
);
setAppointments(updatedAppointments);

// 更新到 Supabase
saveBookingToSupabase(supabase, updatedAppointment);
```

### 2.5 修改刪除預約函數

找到刪除預約的函數，在成功刪除後添加 Supabase 刪除：

```typescript
const handleDelete = (appointmentId: string) => {
  // 從本地狀態刪除
  const updatedAppointments = appointments.filter(app => app.id !== appointmentId);
  setAppointments(updatedAppointments);

  // 從 Supabase 刪除
  deleteBookingFromSupabase(supabase, appointmentId);

  // ... 現有的其餘邏輯 ...
};
```

## 第三步：測試整合

1. 重新整理頁面
2. 新增一筆預約
3. 檢查 Supabase Dashboard 中的 "booking" 表格，確認資料已保存
4. 重新整理頁面，確認資料正確載入
5. 編輯預約，確認 Supabase 中的資料同步更新
6. 刪除預約，確認 Supabase 中的資料同步刪除

## 注意事項

1. **用戶認證**：確保用戶已登入，否則無法存取 Supabase
2. **權限設置**：RLS (Row Level Security) 政策確保用戶只能存取自己的資料
3. **錯誤處理**：在實際應用中，應該添加更完善的錯誤處理和用戶提示
4. **備份機制**：保留 localStorage 作為備份，以防 Supabase 連線失敗
5. **資料同步**：如果有多個設備，需要實現即時同步（可以使用 Supabase Realtime）
