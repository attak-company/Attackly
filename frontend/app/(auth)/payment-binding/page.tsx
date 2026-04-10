"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { CreditCard, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PaymentBindingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // 調用後端創建定期付款
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/newebpay/create-period-payment`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          amount: 999,
          item_desc: "Digital Manager 付費方案 - 免費試用",
          email: user.email,
          period_type: "M",
          frequency: 1,
          exec_times: 1,
          return_url: `${window.location.origin}/payment-success`,
          notify_url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/newebpay/callback`,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // 提交表單到藍星金流
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.data.PayGateWay;
        
        const merchantIdInput = document.createElement('input');
        merchantIdInput.type = 'hidden';
        merchantIdInput.name = 'MerchantID';
        merchantIdInput.value = data.data.MerchantID;
        form.appendChild(merchantIdInput);

        const tradeInfoInput = document.createElement('input');
        tradeInfoInput.type = 'hidden';
        tradeInfoInput.name = 'TradeInfo';
        tradeInfoInput.value = data.data.TradeInfo;
        form.appendChild(tradeInfoInput);

        const tradeShaInput = document.createElement('input');
        tradeShaInput.type = 'hidden';
        tradeShaInput.name = 'TradeSha';
        tradeShaInput.value = data.data.TradeSha;
        form.appendChild(tradeShaInput);

        const versionInput = document.createElement('input');
        versionInput.type = 'hidden';
        versionInput.name = 'Version';
        versionInput.value = data.data.Version;
        form.appendChild(versionInput);

        document.body.appendChild(form);
        form.submit();
      } else {
        setError("創建付款失敗");
        setLoading(false);
      }
    } catch (err) {
      setError("綁定支付方式失敗，請稍後再試");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-6">
          <Link href="/select-plan" className="text-sm text-gray-500 hover:text-black flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回方案選擇
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">綁定支付方式</h1>
          <p className="text-gray-500">綁定您的信用卡以開始免費試用</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>免費試用說明：</strong>您將被重定向到藍星金流頁面進行信用卡綁定。試用期間不會收費，試用期結束後將自動扣費 NT$999/月。
            </p>
          </div>

          <div className="text-center py-8">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">點擊下方按鈕前往藍星金流綁定信用卡</p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center disabled:bg-gray-400"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "前往藍星金流綁定信用卡"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            您的支付資訊將通過藍星金流安全處理，我們不會儲存您的完整信用卡資訊
          </p>
        </div>
      </div>
    </div>
  );
}
