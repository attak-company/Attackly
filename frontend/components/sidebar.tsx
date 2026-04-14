"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  MessageSquare,
  Settings,
  FileText,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Key,
  Store,
  Clock,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "儀表板", href: "/dashboard" },
  { icon: Clock, label: "營業時間", href: "/dashboard/business-hours" },
  { icon: Package, label: "服務項目", href: "/dashboard/services" },
  { icon: Calendar, label: "行事曆", href: "/dashboard/calendar" },
  { icon: CalendarCheck, label: "預約管理", href: "/dashboard/appointments" },
  { icon: MessageSquare, label: "對話紀錄", href: "/dashboard/chats" },
  { icon: FileText, label: "知識庫管理", href: "/dashboard/faq" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [settingsExpanded, setSettingsExpanded] = useState(true);

  const isSettingsActive = pathname === "/dashboard/settings" || pathname === "/dashboard/settings/line" || pathname === "/dashboard/settings/ai" || pathname === "/dashboard/settings/store";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-5 py-3 text-sm transition-all rounded-lg group relative",
                isActive 
                  ? "bg-[#e9ecef] text-[#212529] font-semibold border border-[#dee2e6]" 
                  : "text-[#212529] hover:bg-[#e9ecef] hover:text-[#212529]"
              )}
            >
              {isActive && (
                <div className="absolute left-[-13px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#6366f1] rounded-sm" />
              )}
              <item.icon className={cn(
                "w-5 h-5 mr-3 text-center",
                isActive ? "text-[#6366f1]" : "text-[#495057] group-hover:text-[#212529]"
              )} />
              {item.label}
            </Link>
          );
        })}

        {/* 系統設定 - 層級選單 */}
        <div className="mt-4">
          <button
            onClick={() => setSettingsExpanded(!settingsExpanded)}
            className={cn(
              "w-full flex items-center px-5 py-3 text-sm transition-all rounded-lg group relative",
              isSettingsActive 
                ? "bg-[#e9ecef] text-[#212529] font-semibold border border-[#dee2e6]" 
                : "text-[#212529] hover:bg-[#e9ecef] hover:text-[#212529]"
            )}
          >
            {isSettingsActive && (
              <div className="absolute left-[-13px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#6366f1] rounded-sm" />
            )}
            <Settings className={cn(
              "w-5 h-5 mr-3 text-center",
              isSettingsActive ? "text-[#6366f1]" : "text-[#495057] group-hover:text-[#212529]"
            )} />
            <span className="flex-1 text-left">系統設定</span>
            {settingsExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>

          <div
            className={cn(
              "ml-4 mt-1 space-y-1 overflow-hidden transition-all duration-300 ease-in-out",
              settingsExpanded ? "max-h-36 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <Link
              href="/dashboard/settings/line"
              className={cn(
                "flex items-center px-5 py-2.5 text-sm transition-all rounded-lg group",
                pathname === "/dashboard/settings/line"
                  ? "bg-[#e9ecef] text-[#212529] font-semibold border border-[#dee2e6]"
                  : "text-[#212529] hover:bg-[#e9ecef] hover:text-[#212529]"
              )}
            >
              {pathname === "/dashboard/settings/line" && (
                <div className="absolute left-[-13px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#6366f1] rounded-sm" />
              )}
              <Key className={cn(
                "w-4 h-4 mr-3",
                pathname === "/dashboard/settings/line" ? "text-[#6366f1]" : "text-[#495057]"
              )} />
              LINE 設定
            </Link>
            <Link
              href="/dashboard/settings/ai"
              className={cn(
                "flex items-center px-5 py-2.5 text-sm transition-all rounded-lg group",
                pathname === "/dashboard/settings/ai"
                  ? "bg-[#e9ecef] text-[#212529] font-semibold border border-[#dee2e6]"
                  : "text-[#212529] hover:bg-[#e9ecef] hover:text-[#212529]"
              )}
            >
              {pathname === "/dashboard/settings/ai" && (
                <div className="absolute left-[-13px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#6366f1] rounded-sm" />
              )}
              <UserCheck className={cn(
                "w-4 h-4 mr-3",
                pathname === "/dashboard/settings/ai" ? "text-[#6366f1]" : "text-[#495057]"
              )} />
              AI 客服設定
            </Link>
            <Link
              href="/dashboard/settings/store"
              className={cn(
                "flex items-center px-5 py-2.5 text-sm transition-all rounded-lg group",
                pathname === "/dashboard/settings/store"
                  ? "bg-[#e9ecef] text-[#212529] font-semibold border border-[#dee2e6]"
                  : "text-[#212529] hover:bg-[#e9ecef] hover:text-[#212529]"
              )}
            >
              {pathname === "/dashboard/settings/store" && (
                <div className="absolute left-[-13px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#6366f1] rounded-sm" />
              )}
              <Store className={cn(
                "w-4 h-4 mr-3",
                pathname === "/dashboard/settings/store" ? "text-[#6366f1]" : "text-[#495057]"
              )} />
              店家設定
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
