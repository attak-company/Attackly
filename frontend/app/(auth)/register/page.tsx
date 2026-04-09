"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { Bot, UserPlus, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Check, X, Loader2 } from "lucide-react";

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
      // 姓氏欄位：必須是常用中文姓氏
      if (isLastName) {
        return commonChineseSurnames.includes(value);
      }
      // 名字欄位：可以是任何有效的中文字符（1-2個字是正常的）
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

  const checkUsernameAvailability = async (value: string) => {
    if (value.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    // TODO: Implement actual username check with backend
    // For now, simulate check
    setTimeout(() => {
      setUsernameAvailable(value !== "admin"); // Simulate "admin" is taken
      setCheckingUsername(false);
    }, 500);
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    checkUsernameAvailability(value);
  };

  const sendEmailCode = async () => {
    if (!email) return;
    setSendingEmailCode(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/send-email-code", {
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

        router.push('/dashboard');
      }
    } catch (err) {
      setError("註冊失敗");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">姓</label>
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
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-gray-900 ${lastName && !validateName(lastName, true) ? "border-red-500" : "border-gray-300"}`}
            placeholder="陳"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">名</label>
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
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-gray-900 ${firstName && !validateName(firstName, false) ? "border-red-500" : "border-gray-300"}`}
            placeholder="小明"
            required
          />
        </div>
      </div>
      {nameError && <p className="text-red-500 text-xs">{nameError}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">用戶名</label>
        <div className="relative">
          <input
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-gray-900"
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
        className="w-full bg-black text-white py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center disabled:bg-gray-400"
      >
        下一步
        <ArrowRight className="w-4 h-4 ml-2" />
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-gray-900"
            placeholder="name@company.com"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email 驗證碼</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={emailCode}
            onChange={(e) => setEmailCode(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-gray-900"
            placeholder="請輸入驗證碼"
            required
          />
          <button
            type="button"
            onClick={sendEmailCode}
            disabled={!email || sendingEmailCode || emailCooldown > 0}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
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
          className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          上一步
        </button>
        <button
          onClick={verifyEmailCode}
          disabled={!email || !emailCode}
          className="flex-1 bg-black text-white py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center disabled:bg-gray-400"
        >
          下一步
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-gray-900"
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">確認密碼</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-gray-900"
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
          className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          上一步
        </button>
        <button
          onClick={handleRegister}
          disabled={!password || !confirmPassword || password !== confirmPassword || loading}
          className="flex-1 bg-black text-white py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center justify-center disabled:bg-gray-400"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "完成註冊"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <img 
              src="/Logo.png" 
              alt="Logo" 
              className="w-20 h-20 object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">開始您的數位經營</h2>
          <p className="text-gray-500 text-center mb-6">建立您的 AI 數位店長帳號</p>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8 px-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step >= s
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && <div className={`flex-1 h-1 mx-2 ${step > s ? "bg-black" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          <div>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </div>

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              已有帳號？{" "}
              <Link href="/login" className="text-black font-bold hover:underline">
                立即登入
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
