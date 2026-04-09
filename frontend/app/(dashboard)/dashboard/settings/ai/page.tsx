"use client";

import { useState } from "react";
import { Save, Bot } from "lucide-react";

export default function AISettingsPage() {
  const [config, setConfig] = useState({
    tone: "friendly",
    rules: "1. 必須在 3 分鐘內回覆\n2. 若客人詢問價格，請優先引導至預約系統",
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI 客服設定</h2>
        <p className="text-gray-500 mt-2">設定 AI 的性格與回應規則。</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* AI Behavior */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <Bot className="w-5 h-5 text-black mr-2" />
            <h3 className="font-bold text-lg">AI 行為自訂</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">客服語氣</label>
              <select
                value={config.tone}
                onChange={(e) => setConfig({ ...config, tone: e.target.value })}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
              >
                <option value="friendly">親切有禮 (推薦)</option>
                <option value="professional">專業正式</option>
                <option value="enthusiastic">熱情主動</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">回覆規則 (每行一條)</label>
              <textarea
                rows={5}
                value={config.rules}
                onChange={(e) => setConfig({ ...config, rules: e.target.value })}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
                placeholder="例如：1. 只能回答美甲相關問題"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="flex items-center px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
            <Save className="w-5 h-5 mr-2" />
            儲存設定
          </button>
        </div>
      </div>
    </div>
  );
}
