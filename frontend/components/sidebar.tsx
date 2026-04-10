"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  Settings, 
  FileText,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Key
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "儀表板", href: "/dashboard" },
  { icon: Calendar, label: "預約管理", href: "/dashboard/calendar" },
  { icon: MessageSquare, label: "對話紀錄", href: "/dashboard/chats" },
  { icon: FileText, label: "FAQ 知識庫", href: "/dashboard/faq" },
  { icon: UserCheck, label: "AI 設定", href: "/dashboard/settings/ai" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [settingsExpanded, setSettingsExpanded] = useState(true);

  const isSettingsActive = pathname === "/dashboard/settings" || pathname === "/dashboard/settings/line";

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
                  : "text-[#495057] hover:bg-[#e9ecef] hover:text-[#212529]"
              )}
            >
              {isActive && (
                <div className="absolute left-[-13px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#6366f1] rounded-sm" />
              )}
              <item.icon className={cn(
                "w-5 h-5 mr-3 text-center",
                isActive ? "text-[#6366f1]" : "text-[#6c757d] group-hover:text-[#495057]"
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
                : "text-[#495057] hover:bg-[#e9ecef] hover:text-[#212529]"
            )}
          >
            {isSettingsActive && (
              <div className="absolute left-[-13px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#6366f1] rounded-sm" />
            )}
            <Settings className={cn(
              "w-5 h-5 mr-3 text-center",
              isSettingsActive ? "text-[#6366f1]" : "text-[#6c757d] group-hover:text-[#495057]"
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
              settingsExpanded ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <Link
              href="/dashboard/settings/line"
              className={cn(
                "flex items-center px-5 py-2.5 text-sm transition-all rounded-lg group",
                pathname === "/dashboard/settings/line"
                  ? "bg-[#e9ecef] text-[#212529] font-semibold border border-[#dee2e6]"
                  : "text-[#495057] hover:bg-[#e9ecef] hover:text-[#212529]"
              )}
            >
              {pathname === "/dashboard/settings/line" && (
                <div className="absolute left-[-13px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#6366f1] rounded-sm" />
              )}
              <Key className={cn(
                "w-4 h-4 mr-3",
                pathname === "/dashboard/settings/line" ? "text-[#6366f1]" : "text-[#6c757d]"
              )} />
              LINE 設定
            </Link>
          </div>
        </div>
      </nav>
      <div className="p-4 border-t border-[#e9ecef]">
        <div className="flex items-center px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center mr-3">
            <span className="text-xs font-bold text-black">DS</span>
          </div>
          <div>
            <p className="text-sm font-medium">商家管理員</p>
            <p className="text-xs text-gray-500">商戶 ID: 12345</p>
          </div>
        </div>
      </div>
    </div>
  );
}
