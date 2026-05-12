// 技師進階設定 - 單一物件定義
export interface EmployeeAdvanceSettings {
  id: string;                      // 唯一識別碼 (UUID 或 Timestamp)
  name: string;                    // 技師姓名
  concurrentServiceCount: number;   // 多工上限 (例如 1 代表一對一，2 代表可同時接兩單)
  booking_horizon: number;         // 個人開放預約天數 (預設 30，AI 會檢查日期是否超出此範圍)
  services: string[];              // 該技師負責的 Service ID 陣列 (用於第一層篩選)
  
  // 固定排班表：以星期為 Key
  schedule: {
    [key in 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun']: {
      isOpen: boolean;             // 當天是否上班
      timeSlots: Array<{
        startTime: string;         // "HH:mm" (例如 "09:00")
        endTime: string;           // "HH:mm" (例如 "20:00")
      }>;
    };
  };
}

// 輔助函式：將 Date 物件轉換為星期 Key ('mon'~'sun')
const getDayKey = (date: Date): keyof EmployeeAdvanceSettings['schedule'] => {
  const days: (keyof EmployeeAdvanceSettings['schedule'])[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[date.getDay()];
};

// 1. 技師初步篩選 (Resource Filtering)
// 功能：根據客人想做的「項目」與「日期」，撈出有資格服務的人
export const filterQualifiedEmployees = (
  employees: EmployeeAdvanceSettings[], 
  serviceId: string, 
  targetDate: Date
): EmployeeAdvanceSettings[] => {
  const dayOfWeek = getDayKey(targetDate); // 轉換為 'mon'~'sun'
  const today = new Date();
  
  return employees.filter(emp => {
    // A. 檢查服務項目是否匹配
    const canDoService = emp.services.includes(serviceId);
    
    // B. 檢查預約日期是否在該技師的 horizon 範圍內
    const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    const isWithinHorizon = diffDays <= emp.booking_horizon;
    
    // C. 檢查該星期幾是否「有上班」
    const isWorkingToday = emp.schedule[dayOfWeek].isOpen;

    return canDoService && isWithinHorizon && isWorkingToday;
  });
};

// 2. 空檔碰撞檢查 (Capacity Collision Check)
// 功能：針對某個技師，判斷特定時段是否還有「容量」。這考慮了 concurrentServiceCount 與 buffer_time。
export const isSlotAvailable = (
  employee: EmployeeAdvanceSettings,
  requestTime: { start: Date; end: Date }, // 已加上服務時長與緩衝
  existingBookings: Array<{ startTime: Date; endTime: Date }> // 該技師當天的所有訂單
): boolean => {
  // 在請求的這段時間內，每一分鐘的重疊訂單數都不能超過多工上限
  // 實際上，我們只需檢查與 requestTime 有交集的訂單數量
  const overlappingBookings = existingBookings.filter(booking => {
    return (requestTime.start < booking.endTime && requestTime.end > booking.startTime);
  });

  return overlappingBookings.length < employee.concurrentServiceCount;
};

// 3. 隨機派發邏輯 (Equal Opportunity Assignment)
// 功能：當多個技師都符合條件時，確保公平分配。
export const assignEmployeeRandomly = (qualifiedEmpIds: string[]): string | null => {
  if (qualifiedEmpIds.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * qualifiedEmpIds.length);
  return qualifiedEmpIds[randomIndex];
};

// 4. 服務同步邏輯（資料完整性守護者）
// 功能：當刪除 service 時，從所有技師的 services 陣列中移除該 ID
export const removeServiceFromEmployees = (
  employees: EmployeeAdvanceSettings[],
  serviceId: string
): EmployeeAdvanceSettings[] => {
  return employees.map(emp => ({
    ...emp,
    services: emp.services.filter(svcId => svcId !== serviceId)
  }));
};

// 5. 動態時間計算引擎
// 功能：計算總佔用時間（服務時長 + 緩衝時間）
export const calculateTotalOccupancy = (
  serviceDuration: number, // 服務時長（分鐘）
  bufferTime: number // 緩衝時間（分鐘）
): number => {
  return serviceDuration + bufferTime;
};

// 6. 排班重疊校驗
// 功能：檢查同一技師同一天內的 timeSlots 是否有重疊
export const hasScheduleOverlap = (
  employee: EmployeeAdvanceSettings,
  day: keyof EmployeeAdvanceSettings['schedule']
): boolean => {
  const timeSlots = employee.schedule[day].timeSlots;
  
  for (let i = 0; i < timeSlots.length; i++) {
    for (let j = i + 1; j < timeSlots.length; j++) {
      const slot1 = timeSlots[i];
      const slot2 = timeSlots[j];
      
      // 將時間字串轉換為分鐘數進行比較
      const [start1H, start1M] = slot1.startTime.split(':').map(Number);
      const [end1H, end1M] = slot1.endTime.split(':').map(Number);
      const [start2H, start2M] = slot2.startTime.split(':').map(Number);
      const [end2H, end2M] = slot2.endTime.split(':').map(Number);
      
      const start1Minutes = start1H * 60 + start1M;
      const end1Minutes = end1H * 60 + end1M;
      const start2Minutes = start2H * 60 + start2M;
      const end2Minutes = end2H * 60 + end2M;
      
      // 檢查是否有重疊（不包含邊界）
      if (start1Minutes < end2Minutes && end1Minutes > start2Minutes) {
        return true;
      }
    }
  }
  
  return false;
};

// 檢查所有員工的排班是否有重疊
export const validateEmployeeSchedules = (
  employees: EmployeeAdvanceSettings[]
): { isValid: boolean; errors: Array<{ employeeId: string; employeeName: string; day: string }> } => {
  const errors: Array<{ employeeId: string; employeeName: string; day: string }> = [];
  
  const days: (keyof EmployeeAdvanceSettings['schedule'])[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  
  employees.forEach(emp => {
    days.forEach(day => {
      if (hasScheduleOverlap(emp, day)) {
        errors.push({
          employeeId: emp.id,
          employeeName: emp.name,
          day: day
        });
      }
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
