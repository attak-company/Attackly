"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase";
import { User, Mail, Lock, Save } from "lucide-react";

export default function AccountPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('username, email')
            .eq('id', user.id)
            .single();
          
          if (userData) {
            setUsername(userData.username || "");
            setEmail(userData.email || "");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [supabase]);

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ username })
          .eq('id', user.id);

        if (error) {
          console.error("Error updating username:", error);
        } else {
          setSuccess(true);
        }
      }
    } catch (error) {
      console.error("Error saving user data:", error);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="帳戶設定" />

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="space-y-6">
          {/* 用戶名稱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                用戶名稱
              </div>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="請輸入用戶名稱"
            />
          </div>

          {/* 電子郵件 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                電子郵件
              </div>
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 outline-none"
              placeholder="請輸入電子郵件"
            />
            <p className="text-xs text-gray-500 mt-1">電子郵件無法修改</p>
          </div>

          {/* 密碼 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                密碼
              </div>
            </label>
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              修改密碼
            </button>
          </div>

          {/* 保存按鈕 */}
          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400"
            >
              <Save className="w-4 h-4" />
              {loading ? "保存中..." : "保存變更"}
            </button>

            {success && (
              <p className="text-green-600 text-sm">保存成功！</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
