"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { Bot, LogIn, Lock, Loader2, User, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  console.log('Login page rendered');
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [savedPassword, setSavedPassword] = useState<string | null>(null);
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

    // Verify the password by signing in
    const { data: signInData, error: passwordError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (passwordError) {
      setError("帳號或密碼錯誤");
      setLoading(false);
      return;
    }

    // Save password for later re-login after code verification
    setSavedPassword(password);

    // Immediately sign out since we only wanted to verify the password
    await supabase.auth.signOut();

    // Password is correct, now send verification code
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/send-login-code`;
      console.log("Sending login code to:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        setUserEmail(email);
        setShowCodeInput(true);
        setCodeSent(true);
      } else {
        setError("發送驗證碼失敗");
      }
    } catch (err) {
      console.error("Error sending login code:", err);
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/verify-login-code`, {
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
        // 使用保存的密碼重新登入建立 session
        if (userEmail && savedPassword) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: savedPassword,
          });

          if (signInError) {
            setError("登入失敗，請重新登入");
            setLoading(false);
            return;
          }
        }

        // 使用後端返回的 user_id 檢查訂閱狀態
        const userId = data.user_id;
        
        if (userId) {
          // 檢查用戶是否已選擇方案
          const { data: subscription, error: subscriptionError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single();

          // 如果沒有訂閱記錄，跳轉到方案選擇頁面
          if (subscriptionError || !subscription) {
            router.push("/select-plan");
          } else {
            router.push("/dashboard");
          }
        } else {
          router.push("/dashboard");
        }
        setLoading(false);
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/send-login-code`, {
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
        setError("重新發送驗證碼失敗");
      }
    } catch (err) {
      setError("重新發送驗證碼失敗，請稍後再試");
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError("Google 登入失敗: " + error.message);
        setLoading(false);
      }
    } catch (err) {
      setError("Google 登入失敗，請稍後再試");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 relative">
      {/* 返回主頁按鈕 */}
      <Link href="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors duration-300 group">
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
        <span className="font-medium">返回官網</span>
      </Link>

      <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <img
              src="/Logo.png"
              alt="Logo"
              className="w-24 h-24 object-contain mb-2"
            />
            <div className="w-20 h-0.5 bg-red-500"></div>
          </div>
          <h2 className="text-3xl font-black text-center text-zinc-950 mb-2">歡迎回來</h2>
          <p className="text-sm text-zinc-600 text-center mb-8">登入您的數位店長帳號</p>

          {!showCodeInput ? (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-1">電子郵件或用戶名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    className="w-full pl-10 pr-4 h-12 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-zinc-900"
                    placeholder="name@company.com 或用戶名"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-1">密碼</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 h-12 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-zinc-900"
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
              </div>

              <div className="text-right">
                <Link href="/forgot-password" className="text-sm text-red-600 hover:text-red-700 font-medium">
                  忘記密碼？
                </Link>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-zinc-950 text-white rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center disabled:bg-gray-400 shadow-red-500/10"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "發送驗證碼"}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">或</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-12 bg-white border border-zinc-300 text-zinc-900 rounded-xl font-bold hover:bg-zinc-50 transition-colors flex items-center justify-center gap-x-2.5 disabled:bg-gray-100"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    使用 Google 登入
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-1">驗證碼</label>
                <div className="relative">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-4 h-12 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-zinc-900"
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
                className="w-full h-12 bg-zinc-950 text-white rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center disabled:bg-gray-400"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5 mr-2" />}
                驗證並登入
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="w-full h-12 bg-zinc-100 text-zinc-900 rounded-xl font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center disabled:bg-gray-400"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "重新發送驗證碼"}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-zinc-200 text-center">
            <p className="text-sm text-zinc-600">
              還沒有帳號？{" "}
              <Link href="/register" className="text-red-600 font-bold hover:text-red-700">
                立即免費註冊
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
