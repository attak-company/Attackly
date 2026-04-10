"use client";

import { Bell, ChevronDown, User, LogOut, Settings, UserPlus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    setShowAccount(false);
  };

  const handleAccountSettings = () => {
    router.push("/dashboard/settings");
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
      <div className="flex items-center">
        <div className="flex items-center gap-2">
          {/* Logo Placeholder */}
          <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
            <span className="text-xs font-bold text-white">數位</span>
          </div>
          <span className="text-lg font-bold tracking-tight">數位店長</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-all relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              1
            </span>
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 text-gray-900 z-50">
              <div className="p-4 border-b">
                <h6 className="font-semibold text-sm text-gray-900">通知</h6>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <div className="p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-0">
                  <p className="text-sm font-semibold">系統通知</p>
                  <p className="text-sm text-gray-500 mt-1">歡迎使用數位店長系統</p>
                  <p className="text-xs text-gray-400 mt-2">剛剛</p>
                </div>
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
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium border-2 border-white/20">
              U
            </div>
            <span className="text-sm font-medium hidden md:inline">用戶</span>
            <ChevronDown className={cn("h-3 w-3 transition-transform", showAccount && "rotate-180")} />
          </button>

          {showAccount && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 text-gray-900 z-50 py-1">
              <button
                onClick={handleAccountSettings}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>帳戶設定</span>
              </button>
              <button
                onClick={handleAddUser}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span>新增帳號</span>
              </button>
              <div className="h-px bg-gray-100 my-1" />
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
