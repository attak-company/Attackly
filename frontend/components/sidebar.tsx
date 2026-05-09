"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  MessageSquare,
  Settings,
  FileText,
  UserCheck,
  Key,
  Store,
  Package,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "數據", href: "/dashboard" },
  { icon: Calendar, label: "排程", href: "/dashboard/calendar" },
  { icon: CalendarCheck, label: "預約", href: "/dashboard/appointments" },
  { icon: Users, label: "顧客", href: "/dashboard/members" },
];

export function Sidebar() {
  const pathname = usePathname();

  const isSettingsActive = pathname === "/dashboard/settings";

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
                <div className="absolute left-[-13px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#ef4444] rounded-sm" />
              )}
              <item.icon className={cn(
                "w-5 h-5 mr-3 text-center",
                isActive ? "text-[#ef4444]" : "text-[#495057] group-hover:text-[#212529]"
              )} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 設定 */}
      <div className="px-3 py-4 mt-auto">
        <Link
          href="/dashboard/settings"
          className={cn(
            "w-full flex items-center px-5 py-3 text-sm transition-all rounded-lg group relative",
            isSettingsActive 
              ? "bg-[#e9ecef] text-[#212529] font-semibold border border-[#dee2e6]" 
              : "text-[#212529] hover:bg-[#e9ecef] hover:text-[#212529]"
          )}
        >
          {isSettingsActive && (
            <div className="absolute left-[-13px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#ef4444] rounded-sm" />
          )}
          <Settings className={cn(
            "w-5 h-5 mr-3 text-center",
            isSettingsActive ? "text-[#ef4444]" : "text-[#495057] group-hover:text-[#212529]"
          )} />
          設定
        </Link>
      </div>
    </div>
  );
}