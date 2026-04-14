"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Check, Loader2, X } from "lucide-react";

export default function SelectPlanPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSelectPlan = async (planType: "free" | "trial") => {
    setLoading(true);
    setError(null);

    try {
      // 獲取當前用戶
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setError("無法獲取用戶信息");
        setLoading(false);
        return;
      }

      if (planType === "trial") {
        // 免費試用方案，跳轉到支付綁定頁面
        router.push("/payment-binding");
      } else {
        // 零付費方案，直接創建訂閱記錄
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_type: "free",
            status: "active",
          });

        if (subscriptionError) {
          setError("選擇方案失敗");
          setLoading(false);
          return;
        }

        // 跳轉到 dashboard
        router.push("/dashboard");
      }
    } catch (err) {
      setError("選擇方案失敗，請稍後再試");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 relative">
      <button
        onClick={() => router.push("/dashboard")}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>
      <div className="max-w-4xl w-full">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-3 tracking-tight">選擇您的方案</h1>
          <div className="w-200 h-0.5 bg-red-500 mx-auto mb-6"></div>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">開始您的數位經營之旅</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 零付費方案 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-zinc-200">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">零付費方案</h2>
              <div className="flex items-baseline">
                <span className="text-lg font-bold text-zinc-900 mr-1">NT$</span>
                <span className="text-4xl font-black text-zinc-900">0</span>
                <span className="text-zinc-500 ml-2">/ 月</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start h-2">
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-600">基本 AI 客服功能</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-600">每月 100 則對話</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-600">基礎數據報表</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-600">電子郵件支援</span>
              </li>
              <li className="flex items-start h-7">
              </li>
            </ul>

            <button
              onClick={() => handleSelectPlan("free")}
              disabled={loading}
              className="w-full bg-white border-2 border-zinc-900 text-zinc-900 py-3 rounded-lg font-bold hover:border-red-500 hover:text-red-500 transition-colors flex items-center justify-center disabled:bg-gray-100"
            >
              {loading ? "系統打造中請稍候..." : "開始使用"}
            </button>
          </div>

          {/* 免費試用方案 */}
          <div className="bg-black rounded-2xl shadow-xl p-8 border-2 border-zinc-800 relative overflow-hidden hover:shadow-2xl hover:-translate-y-0.5 transition-all">
            <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              免費試用 7 天
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">付費方案</h2>
              <div className="flex items-baseline">
                <span className="text-lg font-bold text-red-500 mr-1">NT$</span>
                <span className="text-4xl font-black text-red-500">999</span>
                <span className="text-zinc-300 ml-2">/ 月</span>
              </div>
              <p className="text-red-400 text-sm mt-1">試用期後自動續訂</p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-200">進階 AI 客服功能</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-200">無限對話數量</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-200">完整數據分析</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-200">優先客戶支援</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-200">自定義品牌設定</span>
              </li>
            </ul>

            <button
              onClick={() => handleSelectPlan("trial")}
              disabled={loading}
              className="w-full bg-white text-zinc-900 py-3 rounded-lg font-bold hover:bg-red-600 hover:text-white hover:-translate-y-0.5 transition-colors flex items-center justify-center disabled:bg-gray-300"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "開始免費試用"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
