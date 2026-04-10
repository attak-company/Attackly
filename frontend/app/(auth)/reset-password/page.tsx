"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { Lock, Loader2, ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react";

// --- 將原本使用到 searchParams 的邏輯抽離到子組件 ---
function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const router = useRouter();
  const searchParams = useSearchParams(); // 現在這行在 Suspense 內部，不會報錯
  const supabase = createClient();

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    if (accessToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: searchParams.get("refresh_token") || "",
      });
    }
  }, [searchParams, supabase]);

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (!password) return 0;
    if (password.length >= 8) strength += 25;
    else if (password.length >= 6) strength += 10;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 25;
    return Math.min(strength, 100);
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 30) return "bg-red-500";
    if (strength < 50) return "bg-orange-500";
    if (strength < 70) return "bg-yellow-500";
    if (strength < 90) return "bg-green-400";
    return "bg-green-500";
  };

  const getPasswordStrengthText = (strength: number): string => {
    if (strength < 30) return "弱";
    if (strength < 50) return "一般";
    if (strength < 70) return "中等";
    if (strength < 90) return "強";
    return "很強";
  };

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
    setError(null);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("兩次輸入的密碼不一致");
      return;
    }
    if (passwordStrength < 50) {
      setError("密碼強度不足，請使用更強的密碼");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        setError("更新密碼失敗: " + error.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError("更新密碼失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center">
        <div className="bg-green-100 p-4 rounded-full mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">密碼重置成功</h2>
        <p className="text-gray-500 text-center mb-6">
          您的密碼已成功重置，即將跳轉到登入頁面...
        </p>
        <Link href="/login" className="text-black font-bold hover:underline">
          立即登入
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-center mb-8">
        <img src="/Logo.png" alt="Logo" className="w-24 h-24 object-contain" />
      </div>
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">重置密碼</h2>
      <p className="text-gray-500 text-center mb-8">請輸入您的新密碼</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleResetPassword} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">新密碼</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-gray-900"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {newPassword && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                <div className="flex-1 h-1.5 rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">密碼強度: {getPasswordStrengthText(passwordStrength)}</span>
                {passwordStrength < 50 && <span className="text-red-500">至少需要中等強度</span>}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">確認新密碼</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-gray-900"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center disabled:bg-gray-400"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "重置密碼"}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/login");
          }}
          className="text-sm text-gray-500 hover:text-black flex items-center justify-center mx-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回登入
        </button>
      </div>
    </>
  );
}

// --- 這裡是主頁面，使用 Suspense 包裹子組件 ---
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
            <p className="text-gray-500">正在準備重置頁面...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}