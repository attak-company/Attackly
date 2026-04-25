"use client";

import { Bell, ChevronDown, User, LogOut, UserPlus, Power, Headphones, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [username, setUsername] = useState<string>("用戶");
  const [notificationCount, setNotificationCount] = useState(0);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('username, ai_enabled')
            .eq('id', user.id)
            .single();
          
          if (userData) {
            setUsername(userData.username);
            setAiEnabled(userData.ai_enabled !== false);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [supabase]);

  const toggleAI = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const newValue = !aiEnabled;
        await supabase
          .from('users')
          .update({ ai_enabled: newValue })
          .eq('id', user.id);
        setAiEnabled(newValue);
      }
    } catch (error) {
      console.error("Error toggling AI:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    setShowAccount(false);
  };

  const handleAddUser = () => {
    // TODO: Implement add user functionality
    // For now, navigate to a placeholder or show a modal
    alert("新增用戶功能開發中");
    setShowAccount(false);
  };

  return (
    <header className="h-16 bg-black text-white flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-[3000] shadow-[0_1px_0_rgba(255,255,255,0.08)_inset]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <img 
            src="/Logo.png" 
            alt="Logo" 
            className="w-11 h-11 object-contain"
          />
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black tracking-tighter leading-tight">ATTAKLY</span>
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mb-1"></span>
            </div>
            <span className="text-xs text-gray-400 tracking-wide">數位店長</span>
          </div>
        </div>

        {/* 分隔線 */}
        <div className="h-8 w-[1px] bg-white/20" />

        {/* 動態日期時間 */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-white uppercase tracking-widest" suppressHydrationWarning>
              {currentTime.getFullYear()} . {String(currentTime.getMonth() + 1).padStart(2, '0')} . {String(currentTime.getDate()).padStart(2, '0')}
            </span>
            <span className="text-[9px] px-1 bg-white/10 text-gray-400 rounded" suppressHydrationWarning>
              {currentTime.toLocaleDateString('zh-TW', { weekday: 'long' })}
            </span>
          </div>
          
          <div className="text-xs font-mono font-medium text-gray-400" suppressHydrationWarning>
            {String(currentTime.getHours()).padStart(2, '0')} : {String(currentTime.getMinutes()).padStart(2, '0')} : {String(currentTime.getSeconds()).padStart(2, '0')}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* AI Toggle */}
        <button
          onClick={toggleAI}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all",
            aiEnabled
              ? "bg-green-600/20 text-green-400 hover:bg-green-600/30"
              : "bg-red-600/20 text-red-400 hover:bg-red-600/30"
          )}
          title={aiEnabled ? "AI 已啟用" : "AI 已停用"}
        >
          <Power className={cn("h-4 w-4", aiEnabled ? "text-green-400" : "text-red-400")} />
          <span className="text-xs font-medium">
            {aiEnabled ? "AI 開啟" : "AI 關閉"}
          </span>
        </button>

        {/* Customer Support */}
        <button
          onClick={() => router.push('/dashboard/settings?tab=other&sub=support')}
          className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-all"
          title="客服"
        >
          <Headphones className="h-5 w-5" />
        </button>

        {/* User Manual */}
        <button
          onClick={() => router.push('/dashboard/settings?tab=other&sub=manual')}
          className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-all"
          title="教學手冊"
        >
          <BookOpen className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-all relative"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {notificationCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 text-gray-900 z-50">
              <div className="p-4 border-b">
                <h6 className="font-semibold text-sm text-gray-900">通知</h6>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <div
                  onClick={() => {
                    setShowNotifications(false);
                    router.push('/dashboard/settings?tab=other&sub=notification');
                  }}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-0"
                >
                  <p className="text-sm font-semibold">系統通知</p>
                  <p className="text-sm text-gray-500 mt-1">歡迎使用數位店長系統</p>
                  <p className="text-xs text-gray-400 mt-2">剛剛</p>
                </div>
              </div>
              <div className="p-3 border-t">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    router.push('/dashboard/settings?tab=other&sub=notification');
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  顯示完整通知
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Account */}
        <div className="relative">
          <button
            onClick={() => setShowAccount(!showAccount)}
            className="flex items-center gap-2 px-3 py-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded-md transition-all"
          >
            <span className="text-sm font-medium">{username}</span>
            <ChevronDown className={cn("h-3 w-3 transition-transform", showAccount && "rotate-180")} />
          </button>

          {showAccount && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 text-gray-900 z-50 py-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>登出</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
