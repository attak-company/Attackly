"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { Bot, LogIn, Lock, Loader2, User, Shield } from "lucide-react";

export default function LoginPage() {
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isEmail = (input: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let email = loginInput;

    // If input is not an email format, treat it as username and fetch the associated email
    if (!isEmail(loginInput)) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('username', loginInput)
          .single();

        if (userError || !userData) {
          setError("找不到該用戶名對應的帳號");
          setLoading(false);
          return;
        }

        email = userData.email;
      } catch (err) {
        setError("登入失敗，請稍後再試");
        setLoading(false);
        return;
      }
    }

    // First verify the password
    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (passwordError) {
      setError(passwordError.message);
      setLoading(false);
      return;
    }

    // Password is correct, now send verification code
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/send-login-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setUserEmail(email);
        setShowCodeInput(true);
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

    if (!userEmail) {
      setError("請先輸入帳號和密碼");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/verify-login-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard");
      } else {
        setError(data.message || "驗證碼錯誤");
        setLoading(false);
      }
    } catch (err) {
      setError("驗證失敗，請稍後再試");
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!userEmail) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/send-login-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
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
            <img 
              src="/Logo.png" 
              alt="Logo" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">歡迎回來</h2>
          <p className="text-gray-500 text-center mb-8">登入您的數位店長帳號</p>

          {!showCodeInput ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件或用戶名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    placeholder="name@company.com 或用戶名"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="text-right">
                <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-black font-medium">
                  忘記密碼？
                </Link>
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
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">驗證碼</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    placeholder="請輸入 6 位數驗證碼"
                    maxLength={6}
                    required
                  />
                </div>
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5 mr-2" />}
                驗證並登入
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

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              還沒有帳號？{" "}
              <Link href="/register" className="text-black font-bold hover:underline">
                立即免費註冊
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
