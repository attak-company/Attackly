"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 使用 Supabase 的內置密碼重置功能
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError("發送重置郵件失敗: " + error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error("Send reset email error:", err);
      setError("發送重置郵件失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden relative">
          {/* 返回官網按鈕 */}
          <Link href="/" className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-400 transition-colors duration-300 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-medium">返回官網</span>
          </Link>

          <div className="p-8">
            <div className="flex flex-col items-center">
              <div className="bg-green-100 p-4 rounded-full mb-6">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-950 mb-2">重置郵件已發送</h2>
              <p className="text-zinc-600 text-center mb-6">
                我們已向 {email} 發送了密碼重置郵件，請檢查您的郵箱並點擊郵件中的重置鏈接來設置新密碼。
              </p>
              <Link
                href="/login"
                className="text-red-600 font-bold hover:text-red-700 transition-transform hover:translate-x-1 inline-block"
              >
                返回登入
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden relative">
        {/* 返回官網按鈕 */}
        <Link href="/" className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-400 transition-colors duration-300 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-medium">返回官網</span>
        </Link>

        <div className="p-8">
          <div className="flex justify-center mb-8">
            <img 
              src="/Logo.png" 
              alt="Logo" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <h2 className="text-3xl font-black text-center text-zinc-950 mb-2">重置密碼</h2>
          <p className="text-sm text-zinc-600 text-center mb-8">輸入您的電子郵件以接收重置郵件</p>

          <form onSubmit={handleSendResetEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-600 mb-1">電子郵件</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 h-12 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-zinc-900"
                placeholder="name@company.com"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-950 text-white h-12 rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center disabled:bg-gray-400"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "發送重置郵件"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-200 text-center">
            <p className="text-sm text-zinc-600">
              記得密碼了？{" "}
              <Link href="/login" className="text-red-600 font-bold hover:text-red-700 transition-transform hover:translate-x-1 inline-block">
                立即登入
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
