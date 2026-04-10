"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { Bot, Lock, Loader2, ArrowLeft, Shield, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: enter email, 2: enter code, 3: enter new password, 4: success
  const [codeSent, setCodeSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/send-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setStep(2);
        setCodeSent(true);
      } else {
        setError("發送驗證碼失敗");
      }
    } catch (err) {
      setError("發送驗證碼失敗，請稍後再試");
    }

    setLoading(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verificationCode,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update password in Supabase
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) {
          setError("更新密碼失敗");
          setLoading(false);
          return;
        }

        setStep(4);
      } else {
        setError(data.message || "驗證碼錯誤");
        setLoading(false);
      }
    } catch (err) {
      setError("驗證失敗，請稍後再試");
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("兩次輸入的密碼不一致");
      return;
    }

    if (newPassword.length < 6) {
      setError("密碼長度至少需要 6 個字元");
      return;
    }

    setStep(3);
    await handleVerifyCode(e);
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/send-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setCodeSent(true);
      } else {
        setError("發送驗證碼失敗");
      }
    } catch (err) {
      setError("發送驗證碼失敗，請稍後再試");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <div className="bg-black p-3 rounded-xl">
              <Bot className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">重置密碼</h2>
          <p className="text-gray-500 text-center mb-8">
            {step === 1 && "輸入您的電子郵件以接收驗證碼"}
            {step === 2 && "輸入您收到的驗證碼"}
            {step === 3 && "設定您的新密碼"}
            {step === 4 && "密碼重置成功"}
          </p>

          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                  placeholder="name@company.com"
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center disabled:bg-gray-400"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5 mr-2" />}
                發送驗證碼
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">驗證碼</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                  placeholder="請輸入 6 位數驗證碼"
                  maxLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">新密碼</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                  placeholder="請輸入新密碼"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">確認新密碼</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                  placeholder="請再次輸入新密碼"
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              {codeSent && (
                <p className="text-green-600 text-sm">驗證碼已發送至您的電子郵件</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center disabled:bg-gray-400"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5 mr-2" />}
                重置密碼
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center disabled:bg-gray-400"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5 mr-2" />}
                重新發送驗證碼
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-black" />
                <p className="mt-4 text-gray-600">正在重置密碼...</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <p className="text-gray-600 mb-6">密碼重置成功！</p>
                <button
                  onClick={() => router.push("/login")}
                  className="w-full bg-black text-white py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  返回登入
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Link href="/login" className="text-sm text-gray-500 hover:text-black font-bold flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回登入
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
