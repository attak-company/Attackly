"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Store, Save, MapPin, Phone, Building2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function StoreSettingsPage() {
  const [config, setConfig] = useState({
    storeName: "",
    address: "",
    phone: "",
    storeType: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // 從資料庫讀取店家資料
          const { data: userData, error } = await supabase
            .from('users')
            .select('store_name, address, phone, store_type')
            .eq('id', user.id)
            .single();
          
          if (userData) {
            setConfig({
              storeName: userData.store_name || '',
              address: userData.address || '',
              phone: userData.phone || '',
              storeType: userData.store_type || ''
            });
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

      // 更新或插入店家資料
      const { error } = await supabase
        .from('users')
        .update({
          store_name: config.storeName,
          address: config.address,
          phone: config.phone,
          store_type: config.storeType
        })
        .eq('id', user.id);

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error saving store data:", error);
      alert("儲存失敗：" + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="店家設定" />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-6">
          {/* 店名 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              店名
            </label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={config.storeName}
                onChange={(e) => setConfig(prev => ({ ...prev, storeName: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                placeholder="請輸入店名"
              />
            </div>
          </div>

          {/* 地址 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              地址
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={config.address}
                onChange={(e) => setConfig(prev => ({ ...prev, address: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                placeholder="請輸入地址"
              />
            </div>
          </div>

          {/* 電話 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              電話
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={config.phone}
                onChange={(e) => setConfig(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                placeholder="請輸入電話"
              />
            </div>
          </div>

          {/* 店家類型 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              店家類型
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={config.storeType}
                onChange={(e) => setConfig(prev => ({ ...prev, storeType: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                placeholder="請輸入店家類型（如：餐廳、服飾店等）"
              />
            </div>
          </div>

          {/* 儲存按鈕 */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-all duration-300 hover:scale-105 active:scale-95 disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
    </div>
  );
}
