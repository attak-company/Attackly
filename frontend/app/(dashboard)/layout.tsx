"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">
      <Header />
      <div className="flex flex-1 mt-16 overflow-hidden bg-black">
        <aside className="w-[280px] bg-[#f8f9fa] border-r border-[#e9ecef] rounded-tl-[20px] overflow-hidden">
          <Sidebar />
        </aside>
        <main className="flex-1 bg-[#f3f4f6] rounded-tr-[20px] overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
