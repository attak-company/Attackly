"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { Bot, UserPlus, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Check, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Step 1: Personal Info
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // 髒話和無效詞彙列表
  const profanityList = [
    // 中文髒話
    '幹', '操', '媽的', '去死', '殺', '草', '婊', '屄', '雞巴', '性交', '做愛',
    '幹你娘', '幹你老母', '幹你媽', '操你媽', '操你娘', '他媽的', '去你媽的',
    '幹你', '操你', '你媽', '你娘', '他媽', '去你媽', '操你媽的',
    '狗屎', '屁眼', '陰道', '陰莖', '射精', '自慰', '手淫',
    '婊子', '妓女', '性奴', '強姦', '輪姦', '性騷擾',
    // 英文髒話
    'fuck', 'shit', 'damn', 'ass', 'bitch', 'whore', 'slut', 'dick',
    'pussy', 'cock', 'penis', 'vagina', 'rape', 'kill', 'death',
    'motherfucker', 'bullshit', 'asshole', 'bastard', 'cunt',
    // 其他無效詞
    'test', 'test123', 'admin', 'user', 'guest', 'demo', 'sample',
    '123', '456', '789', '111', '222', '333', '444', '555', '666', '777', '888', '999', '000',
  ];

  // 常用中文姓氏列表（前100大姓氏）
  const commonChineseSurnames = [
    '王', '李', '張', '劉', '陳', '楊', '黃', '趙', '吳', '周',
    '徐', '孫', '馬', '朱', '胡', '郭', '何', '高', '林', '羅',
    '鄭', '梁', '謝', '宋', '唐', '許', '韓', '馮', '鄧', '曹',
    '彭', '曾', '蕭', '田', '董', '袁', '潘', '于', '蔣', '蔡',
    '余', '杜', '葉', '程', '蘇', '魏', '呂', '丁', '任', '沈',
    '姚', '盧', '姜', '崔', '鍾', '譚', '汪', '范', '金', '石',
    '廖', '賈', '夏', '韋', '付', '方', '白', '鄒', '孟', '熊',
    '秦', '邱', '江', '尹', '薛', '閻', '段', '雷', '侯', '龍',
    '史', '陶', '黎', '賀', '顧', '毛', '郝', '龔', '邵', '萬',
    '錢', '覃', '武', '戴', '莫', '孔', '向', '湯', '嚴', '歐',
    '文', '倪', '龐', '施', '孟', '顏', '寧', '宗', '童', '梁',
    '畢', '霍', '焦', '歐陽', '上官', '皇甫', '諸葛', '尉遲', '司馬',
  ];

  // 常用英文姓氏列表
  const commonEnglishSurnames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
    'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
    'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez',
    'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott',
    'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker',
    'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips',
    'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
    'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz',
    'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos',
    'Kim', 'Cox', 'Ward', 'Richardson', 'Watson', 'Brooks', 'Chavez', 'Wood',
    'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo',
    'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez', 'Powell',
  ];

  // 常用英文名字列表
  const commonEnglishFirstNames = [
    'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard',
    'Joseph', 'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony',
    'Donald', 'Mark', 'Paul', 'Steven', 'Andrew', 'Kenneth', 'Joshua', 'Kevin',
    'Brian', 'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan',
    'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin',
    'Scott', 'Brandon', 'Benjamin', 'Samuel', 'Gregory', 'Frank', 'Alexander', 'Raymond',
    'Patrick', 'Jack', 'Dennis', 'Jerry', 'Tyler', 'Aaron', 'Jose', 'Adam',
    'Henry', 'Nathan', 'Douglas', 'Zachary', 'Peter', 'Kyle', 'Walter', 'Ethan',
    'Jeremy', 'Harold', 'Keith', 'Christian', 'Roger', 'Noah', 'Gerald', 'Terry',
    'Sean', 'Austin', 'Arthur', 'Lawrence', 'Jesse', 'Dylan', 'Bryan', 'Joe',
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica',
    'Sarah', 'Karen', 'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley',
    'Kimberly', 'Emily', 'Donna', 'Michelle', 'Dorothy', 'Carol', 'Amanda', 'Melissa',
    'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia', 'Kathleen', 'Amy',
    'Angela', 'Shirley', 'Anna', 'Brenda', 'Pamela', 'Nicole', 'Emma', 'Samantha',
    'Katherine', 'Christine', 'Debra', 'Rachel', 'Carolyn', 'Janet', 'Catherine', 'Maria',
    'Heather', 'Diane', 'Virginia', 'Julie', 'Joyce', 'Victoria', 'Olivia', 'Kelly',
  ];

  const validateName = (value: string, isLastName: boolean = false): boolean => {
    // 檢查是否為空
    if (!value || value.trim().length === 0) {
      return false;
    }

    // 檢查是否只包含數字
    if (/^\d+$/.test(value)) {
      return false;
    }

    // 檢查是否只包含特殊字符
    if (/^[^a-zA-Z\u4e00-\u9fa5]+$/.test(value)) {
      return false;
    }

    // 檢查是否包含髒話
    const lowerValue = value.toLowerCase();
    for (const word of profanityList) {
      if (lowerValue.includes(word.toLowerCase())) {
        return false;
      }
    }

    // 檢查是否包含至少一個中文字符或英文字母
    if (!/[\u4e00-\u9fa5a-zA-Z]/.test(value)) {
      return false;
    }

    // 檢查長度（至少 1 個字符，最多 20 個字符）
    if (value.length < 1 || value.length > 20) {
      return false;
    }

    // 中文姓名驗證（只接受中文）
    if (/^[\u4e00-\u9fa5]+$/.test(value)) {
      // 姓氏欄位：可以是任何有效的中文字符（1-2個字）
      if (isLastName) {
        return value.length >= 1 && value.length <= 2;
      }
      // 名字欄位：可以是任何有效的中文字符（1-3個字）
      return value.length >= 1 && value.length <= 3;
    }

    // 不接受英文或混合姓名
    return false;
  };

  // Step 2: Email
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  // Email cooldown countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (emailCooldown > 0) {
      interval = setInterval(() => {
        setEmailCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [emailCooldown]);

  // Step 4: Password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (!password) return 0;

    // 長度檢查（至少 8 個字符）
    if (password.length >= 8) strength += 25;
    else if (password.length >= 6) strength += 10;

    // 包含小寫字母
    if (/[a-z]/.test(password)) strength += 25;

    // 包含大寫字母
    if (/[A-Z]/.test(password)) strength += 25;

    // 包含數字
    if (/[0-9]/.test(password)) strength += 15;

    // 包含特殊字符
    if (/[^a-zA-Z0-9]/.test(password)) strength += 25;

    // 最高 100
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
    setPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
    setError(null);
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        setError("Google 註冊失敗: " + error.message);
        setLoading(false);
      }
    } catch (err) {
      setError("Google 註冊失敗，請稍後再試");
      setLoading(false);
    }
  };

  const checkUsernameAvailability = async (value: string) => {
    if (value.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/check-username`;
      console.log("Checking username at:", apiUrl);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: value }),
      });
      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);
      setUsernameAvailable(data.available);
    } catch (err) {
      console.error("Error checking username:", err);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    checkUsernameAvailability(value);
  };

  const sendEmailCode = async () => {
    if (!email) return;
    setSendingEmailCode(true);
    try {
      // 先檢查電子郵件是否已被使用
      const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/check-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const checkData = await checkResponse.json();
      if (!checkData.available) {
        setError("此郵件已經使用過");
        setSendingEmailCode(false);
        return;
      }

      // 電子郵件可用，發送驗證碼
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/send-email-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.success) {
        setEmailCooldown(60); // 60 seconds cooldown
      } else {
        setError("發送驗證碼失敗");
      }
    } catch (err) {
      console.error("Error sending email code:", err);
      setError("發送驗證碼失敗");
    } finally {
      setSendingEmailCode(false);
    }
  };

  const verifyEmailCode = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/verify-email-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code: emailCode }),
      });
      const data = await response.json();
      if (data.success) {
        setEmailVerified(true);
        setStep(3);
      } else {
        setError(data.message || "驗證碼錯誤");
      }
    } catch (err) {
      console.error("Error verifying email code:", err);
      setError("驗證失敗");
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError("密碼不一致");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: email,
            last_name: lastName,
            first_name: firstName,
            username: username,
          });

        if (profileError) {
          setError(profileError.message);
          return;
        }

        // Create merchant profile
        const { error: merchantError } = await supabase
          .from('merchants')
          .insert({
            id: data.user.id,
            name: lastName + firstName,
          });

        if (merchantError) {
          setError(merchantError.message);
          return;
        }

        router.push('/select-plan');
      }
    } catch (err) {
      setError("註冊失敗");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-600 mb-1">姓</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (e.target.value && !validateName(e.target.value, true)) {
                setNameError("請輸入真實中文姓名");
              } else {
                setNameError(null);
              }
            }}
            className={`w-full px-4 h-12 border rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-zinc-900 ${lastName && !validateName(lastName, true) ? "border-red-500" : "border-zinc-300"}`}
            placeholder="陳"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-600 mb-1">名</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (e.target.value && !validateName(e.target.value, false)) {
                setNameError("請輸入真實中文姓名");
              } else {
                setNameError(null);
              }
            }}
            className={`w-full px-4 h-12 border rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-zinc-900 ${firstName && !validateName(firstName, false) ? "border-red-500" : "border-zinc-300"}`}
            placeholder="小明"
            required
          />
        </div>
      </div>
      {nameError && <p className="text-red-500 text-xs">{nameError}</p>}

      <div>
        <label className="block text-sm font-medium text-zinc-600 mb-1">用戶名</label>
        <div className="relative">
          <input
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            className="w-full px-4 h-12 pr-10 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-zinc-900"
            placeholder="請輸入用戶名"
            required
          />
          {checkingUsername && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
          {usernameAvailable === true && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
          {usernameAvailable === false && <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />}
        </div>
        {usernameAvailable === false && <p className="text-red-500 text-xs mt-1">此用戶名已被使用</p>}
      </div>

      <button
        onClick={() => setStep(2)}
        disabled={!lastName || !firstName || !username || usernameAvailable === false || !validateName(lastName, true) || !validateName(firstName, false)}
        className="w-full bg-zinc-950 text-white h-12 rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center disabled:bg-gray-400"
      >
        下一步
        <ArrowRight className="w-4 h-4 ml-2" />
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-600 mb-1">電子郵件</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            className="w-full pl-10 pr-4 h-12 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-zinc-900"
            placeholder="name@company.com"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-600 mb-1">Email 驗證碼</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={emailCode}
            onChange={(e) => {
              setEmailCode(e.target.value);
              setError(null);
            }}
            className="flex-1 px-4 h-12 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-zinc-900"
            placeholder="請輸入驗證碼"
            required
          />
          <button
            type="button"
            onClick={sendEmailCode}
            disabled={!email || sendingEmailCode || emailCooldown > 0}
            className="px-4 h-12 bg-zinc-100 text-zinc-900 rounded-xl hover:bg-zinc-200 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {emailCooldown > 0 ? (
              `${emailCooldown}秒後重試`
            ) : sendingEmailCode ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "發送驗證碼"
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setStep(1)}
          className="flex-1 bg-zinc-100 text-zinc-900 h-12 rounded-xl font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          上一步
        </button>
        <button
          onClick={verifyEmailCode}
          disabled={!email || !emailCode}
          className="flex-1 bg-zinc-950 text-white h-12 rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center disabled:bg-gray-400"
        >
          下一步
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-600 mb-1">密碼</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            className="w-full pl-10 pr-10 h-12 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-zinc-900"
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
        {password && (
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
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <p>密碼規則：</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>至少 8 個字符</li>
                <li>包含大小寫字母</li>
                <li>包含數字</li>
                <li>包含特殊字符</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-600 mb-1">確認密碼</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-10 pr-10 h-12 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-zinc-900"
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
        {password && confirmPassword && password !== confirmPassword && (
          <p className="text-red-500 text-xs mt-1">密碼不一致</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setStep(2)}
          className="flex-1 bg-zinc-100 text-zinc-900 h-12 rounded-xl font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          上一步
        </button>
        <button
          onClick={handleRegister}
          disabled={!password || !confirmPassword || password !== confirmPassword || passwordStrength < 50 || loading}
          className="flex-1 bg-zinc-950 text-white h-12 rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center disabled:bg-gray-400"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "完成註冊"}
        </button>
      </div>
    </div>
  );

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
          <h2 className="text-3xl font-black text-center text-zinc-950 mb-2">開始您的數位經營</h2>
          <p className="text-sm text-zinc-600 text-center mb-6">建立您的 AI 數位店長帳號</p>

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full h-12 bg-white border border-zinc-300 text-zinc-900 rounded-xl font-bold hover:bg-zinc-50 transition-colors flex items-center justify-center gap-x-2.5 disabled:bg-gray-100 mb-6"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                使用 Google 註冊
              </>
            )}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-zinc-600">或使用電子郵件註冊</span>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8 px-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step >= s
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                  animate={{
                    scale: step === s ? 1.2 : 1,
                    backgroundColor: step >= s ? "#000" : "#e5e7eb",
                    color: step >= s ? "#fff" : "#4b5563"
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {s}
                </motion.div>
                {s < 3 && (
                  <motion.div
                    className={`flex-1 h-1 mx-2 ${step > s ? "bg-black" : "bg-gray-200"}`}
                    animate={{
                      backgroundColor: step > s ? "#000" : "#e5e7eb"
                    }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </div>
            ))}
          </div>

          <div>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStep1()}
                </motion.div>
              )}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStep2()}
                </motion.div>
              )}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStep3()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

          <div className="mt-8 pt-6 border-t border-zinc-200 text-center">
            <p className="text-sm text-zinc-600">
              已有帳號？{" "}
              <Link href="/login" className="text-zinc-900 font-bold hover:underline">
                立即登入
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
