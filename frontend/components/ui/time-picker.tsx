"use client"

import * as React from "react"
import { Clock, Keyboard } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [period, setPeriod] = React.useState<"AM" | "PM">(() => {
    const [hours] = value.split(":").map(Number)
    return hours >= 12 ? "PM" : "AM"
  })
  const [selectedHour, setSelectedHour] = React.useState(() => {
    const [hours] = value.split(":").map(Number)
    return hours % 12 || 12
  })
  const [selectedMinute, setSelectedMinute] = React.useState(() => {
    const [, minutes] = value.split(":").map(Number)
    return minutes
  })
  const [manualInput, setManualInput] = React.useState("")
  const [isManualInputFocused, setIsManualInputFocused] = React.useState(false)
  const [showCorrectionHint, setShowCorrectionHint] = React.useState(false)

  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5)

  const updateTime = (newPeriod: "AM" | "PM", newHour: number, newMinute: number) => {
    let hour24 = newHour
    if (newPeriod === "PM" && newHour !== 12) {
      hour24 += 12
    } else if (newPeriod === "AM" && newHour === 12) {
      hour24 = 0
    }
    const timeString = `${hour24.toString().padStart(2, "0")}:${newMinute.toString().padStart(2, "0")}`
    onChange(timeString)
  }

  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    setPeriod(newPeriod)
    updateTime(newPeriod, selectedHour, selectedMinute)
  }

  const handleHourChange = (newHour: number) => {
    setSelectedHour(newHour)
    updateTime(period, newHour, selectedMinute)
  }

  const handleMinuteChange = (newMinute: number) => {
    setSelectedMinute(newMinute)
    setManualInput("")
    updateTime(period, selectedHour, newMinute)
  }

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/[^0-9]/g, "")
    setManualInput(inputValue)

    // 自動格式化顯示
    if (inputValue.length >= 2) {
      let hours = parseInt(inputValue.substring(0, 2))
      let minutes = inputValue.length >= 4 ? parseInt(inputValue.substring(2, 4)) : 0
      
      // 小時校正：最大23
      if (hours > 23) {
        hours = 23
      }
      
      // 分鐘校正：最大59
      if (minutes > 59) {
        minutes = 59
      }
      
      // 24小時制自動轉換
      if (hours >= 13 && hours <= 23) {
        setPeriod("PM")
        const displayHour = hours - 12
        setSelectedHour(displayHour || 12)
        setSelectedMinute(minutes)
        updateTime("PM", displayHour || 12, minutes)
      } else if (hours >= 1 && hours <= 12) {
        setPeriod("AM")
        setSelectedHour(hours)
        setSelectedMinute(minutes)
        updateTime("AM", hours, minutes)
      }
    }

    // 輸入完成時（4位數）
    if (inputValue.length === 4) {
      let hours = parseInt(inputValue.substring(0, 2))
      let minutes = parseInt(inputValue.substring(2, 4))
      
      // 小時校正
      if (hours > 23) hours = 23
      // 分鐘校正
      if (minutes > 59) minutes = 59
      
      if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes <= 59) {
        setSelectedHour(hours)
        setSelectedMinute(minutes)
        updateTime(period, hours, minutes)
      } else if (hours >= 13 && hours <= 23) {
        // 24小時制轉換
        setPeriod("PM")
        const displayHour = hours - 12
        setSelectedHour(displayHour || 12)
        setSelectedMinute(minutes)
        updateTime("PM", displayHour || 12, minutes)
      }
    }
  }

  const handleManualInputBlur = () => {
    setIsManualInputFocused(false)
    
    // 失去焦點時自動補零和校正
    if (manualInput.length > 0 && manualInput.length < 4) {
      const paddedInput = manualInput.padStart(4, '0')
      let hours = parseInt(paddedInput.substring(0, 2))
      let minutes = parseInt(paddedInput.substring(2, 4))
      
      // 小時校正
      if (hours > 23) hours = 23
      // 分鐘校正
      if (minutes > 59) minutes = 59
      
      if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes <= 59) {
        setSelectedHour(hours)
        setSelectedMinute(minutes)
        updateTime(period, hours, minutes)
        setManualInput(paddedInput)
      } else if (hours >= 13 && hours <= 23) {
        // 24小時制轉換
        setPeriod("PM")
        const displayHour = hours - 12
        setSelectedHour(displayHour || 12)
        setSelectedMinute(minutes)
        updateTime("PM", displayHour || 12, minutes)
        setManualInput(paddedInput)
        setShowCorrectionHint(true)
        setTimeout(() => setShowCorrectionHint(false), 2000)
      }
    } else if (manualInput.length === 4) {
      // 檢查是否需要校正
      let hours = parseInt(manualInput.substring(0, 2))
      let minutes = parseInt(manualInput.substring(2, 4))
      
      if (hours > 23 || minutes > 59) {
        if (hours > 23) hours = 23
        if (minutes > 59) minutes = 59
        
        const correctedInput = `${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}`
        setManualInput(correctedInput)
        
        if (hours >= 13 && hours <= 23) {
          setPeriod("PM")
          const displayHour = hours - 12
          setSelectedHour(displayHour || 12)
          setSelectedMinute(minutes)
          updateTime("PM", displayHour || 12, minutes)
        } else {
          setSelectedHour(hours)
          setSelectedMinute(minutes)
          updateTime(period, hours, minutes)
        }
        
        setShowCorrectionHint(true)
        setTimeout(() => setShowCorrectionHint(false), 2000)
      }
    }
  }

  const handleManualInputFocus = () => {
    setIsManualInputFocused(true)
  }

  const formatDisplayTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    const displayHour = hours % 12 || 12
    const displayPeriod = hours >= 12 ? "PM" : "AM"
    return `${displayHour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${displayPeriod}`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full h-12 justify-start text-left font-normal bg-gray-50 border-0 rounded-xl hover:bg-gray-100 focus:ring-2 focus:ring-black",
            !value && "text-gray-400",
            className
          )}
        >
          <Clock className="mr-2 h-5 w-5 text-gray-500" />
          {value ? formatDisplayTime(value) : "選擇時間"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-5" align="start">
        <div className="flex gap-4">
          {/* Left Column - Hours */}
          <div className="flex-1">
            {/* AM/PM Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5 mb-3">
              <button
                onClick={() => handlePeriodChange("AM")}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all",
                  period === "AM" ? "bg-black text-white" : "text-gray-600 hover:text-gray-900"
                )}
              >
                AM
              </button>
              <button
                onClick={() => handlePeriodChange("PM")}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all",
                  period === "PM" ? "bg-black text-white" : "text-gray-600 hover:text-gray-900"
                )}
              >
                PM
              </button>
            </div>
            
            <p className="text-xs font-medium text-gray-500 mb-2">小時</p>
            <div className="grid grid-cols-3 gap-1.5">
              {hours.map((hour) => (
                <button
                  key={hour}
                  onClick={() => handleHourChange(hour)}
                  className={cn(
                    "h-9 rounded-lg text-sm font-medium transition-all hover:scale-95",
                    selectedHour === hour
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {hour}
                </button>
              ))}
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="w-px bg-gray-200" />

          {/* Right Column - Minutes */}
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 mb-2">分鐘</p>
            <div className="grid grid-cols-3 gap-1.5">
              {minutes.map((minute) => (
                <button
                  key={minute}
                  onClick={() => handleMinuteChange(minute)}
                  className={cn(
                    "h-9 rounded-lg text-sm font-medium transition-all hover:scale-95",
                    !isManualInputFocused && selectedMinute === minute
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {minute.toString().padStart(2, "0")}
                </button>
              ))}
            </div>
            
            {/* Manual Input */}
            <div className="mt-3">
              <div className="relative">
                <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  value={manualInput}
                  onChange={handleManualInputChange}
                  onFocus={handleManualInputFocus}
                  onBlur={handleManualInputBlur}
                  placeholder="請輸入四位數 (如 0730)"
                  className={cn(
                    "h-10 pl-9 pr-3 bg-gray-50 border-0 rounded-xl text-sm font-mono focus:ring-2 focus:ring-black placeholder:text-gray-400 placeholder:text-xs",
                    showCorrectionHint && "animate-pulse"
                  )}
                  maxLength={4}
                />
              </div>
              {/* Live Preview */}
              {manualInput.length > 0 && manualInput.length < 4 && (
                <p className="text-xs text-gray-500 mt-1.5">
                  即將設定為 {manualInput.padStart(4, '0').substring(0, 2)}:{manualInput.padStart(4, '0').substring(2, 4)} {period}
                </p>
              )}
              {/* Correction Hint */}
              {showCorrectionHint && (
                <p className="text-xs text-orange-600 mt-1.5">
                  已自動校正為有效時間
                </p>
              )}
              {/* Status Hint */}
              {!showCorrectionHint && (
                <p className="text-xs text-gray-400 mt-1.5">
                  提示：輸入 4 位數字即可自動對時
                </p>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
