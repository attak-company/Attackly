"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 3 秒後自動跳轉到 dashboard
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 3000);

    setLoading(false);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-8">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">支付成功！</h1>
          <p className="text-gray-500">您的訂閱已成功啟動</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-green-800 mb-2">免費試用已開始</h2>
          <p className="text-green-700 text-sm">
            您現在可以開始使用 Digital Manager 的所有功能。試用期為 7 天，試用期結束後將自動扣費 NT$999/月。
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center"
          >
            前往 Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          
          <p className="text-sm text-gray-500">
            將在 3 秒後自動跳轉...
          </p>
        </div>
      </div>
    </div>
  );
}
