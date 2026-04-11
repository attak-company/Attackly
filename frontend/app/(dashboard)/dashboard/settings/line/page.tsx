"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Key, Save, Copy, Check } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function LineSettingsPage() {
  const [config, setConfig] = useState({
    lineApiKey: "",
    lineSecret: "",
    userId: "",
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const supabase = createClient();

  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
  const webhookUrl = `${baseUrl}/api/webhook/${config.userId}`;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setConfig(prev => ({ ...prev, userId: user.id }));
          
          // 從資料庫讀取 LINE credentials
          const { data: userData, error } = await supabase
            .from('users')
            .select('line_channel_access_token, line_channel_secret')
            .eq('id', user.id)
            .single();
          
          if (userData) {
            setConfig(prev => ({
              ...prev,
              lineApiKey: userData.line_channel_access_token || '',
              lineSecret: userData.line_channel_secret || ''
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [supabase]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // 先檢查用戶記錄是否存在
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        // 用戶記錄不存在，創建新記錄
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            line_channel_access_token: config.lineApiKey,
            line_channel_secret: config.lineSecret
          });
        
        if (insertError) throw insertError;
      } else if (checkError) {
        throw checkError;
      } else {
        // 用戶記錄存在，更新
        const { error: updateError } = await supabase
          .from('users')
          .update({
            line_channel_access_token: config.lineApiKey,
            line_channel_secret: config.lineSecret
          })
          .eq('id', user.id);
        
        if (updateError) throw updateError;
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error saving LINE credentials:", error);
      alert(`儲存失敗: ${error.message || '未知錯誤'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="LINE 設定" />

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center mb-4">
          <Key className="w-5 h-5 text-black mr-2" />
          <h3 className="font-bold text-lg text-gray-900">LINE 串接設定</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">LINE Channel Access Token</label>
            <input
              type="text"
              value={config.lineApiKey}
              onChange={(e) => setConfig({ ...config, lineApiKey: e.target.value })}
              disabled={loading}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black disabled:bg-gray-100 text-gray-900"
              placeholder="請輸入 LINE Channel Access Token"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">LINE Channel Secret</label>
            <input
              type="text"
              value={config.lineSecret}
              onChange={(e) => setConfig({ ...config, lineSecret: e.target.value })}
              disabled={loading}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black disabled:bg-gray-100 text-gray-900"
              placeholder="請輸入 LINE Channel Secret"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Webhook URL</label>
            <p className="text-sm text-gray-800 mb-2">將此 URL 設定至 LINE Developers 平台的 Webhook URL 欄位：</p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-mono text-sm"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    已複製
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    複製
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-700 mt-2">URL 格式：https://your-domain.com/api/webhook/你的註冊ID</p>
          </div>
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:bg-gray-400"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  儲存中...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  已儲存
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  儲存變更
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center mb-4">
          <Key className="w-5 h-5 text-black mr-2" />
          <h3 className="font-bold text-lg text-gray-900">架設教學</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">步驟 1：建立 LINE Messaging API Channel</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-800 ml-2">
              <li>前往 <a href="https://developers.line.biz/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LINE Developers</a> 並登入</li>
              <li>點擊「Create new provider」建立新的 Provider</li>
              <li>在 Provider 下點擊「Create a Channel」選擇「Messaging API」</li>
              <li>填寫 Channel 資訊並建立</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">步驟 2：取得 Channel Access Token 和 Channel Secret</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-800 ml-2">
              <li>進入建立的 Channel 頁面</li>
              <li>在「Basic settings」頁面找到「Channel Secret」並複製</li>
              <li>在「Messaging API」頁面點擊「Channel access token」下方的「Issue」按鈕</li>
              <li>複製生成的 Channel Access Token</li>
              <li>將兩個值填入上方的表單欄位</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">步驟 3：設定 Webhook URL</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-800 ml-2">
              <li>在「Messaging API」頁面找到「Webhook」設定</li>
              <li>將上方的 Webhook URL 複製並貼上到 Webhook URL 欄位</li>
              <li>確保「Use webhook」選項已開啟</li>
              <li>點擊「Update」儲存設定</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">步驟 4：設定 Auto Reply 和 Greeting Message</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-800 ml-2">
              <li>在「Messaging API」頁面找到「Auto reply」設定</li>
              <li>關閉「Auto reply」功能（讓 AI 來處理回覆）</li>
              <li>在「Greeting message」設定中關閉自動歡迎訊息（可選）</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">步驟 5：測試連接</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-800 ml-2">
              <li>儲存此頁面的設定</li>
              <li>透過 LINE 傳送訊息給您的官方帳號</li>
              <li>確認 AI 是否正常回覆</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
