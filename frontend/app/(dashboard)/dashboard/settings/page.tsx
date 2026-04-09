"use client";

import { PageHeader } from "@/components/page-header";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="系統設定" />
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500">請從左側選單選擇具體的設定項目。</p>
      </div>
    </div>
  );
}
