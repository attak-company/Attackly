"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden bg-black">
      <Header />
      <div className="flex h-[calc(100vh-64px)] mt-16 overflow-hidden">
        <Sidebar />
        <main className="flex-1 ml-[280px] bg-[#f3f4f6] overflow-x-hidden overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
