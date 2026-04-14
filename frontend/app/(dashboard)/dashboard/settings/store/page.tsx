"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Store, Save, MapPin, Phone, Building2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function StoreSettingsPage() {
  const [config, setConfig] = useState({
    storeName: "",
    address: "",
    googleMapLink: "",
    phone: "",
    storeType: "",
    storeDescription: "",
    storeLocationImage: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // 從資料庫讀取店家資料
          const { data: userData, error } = await supabase
            .from('users')
            .select('store_name, store_address, store_google_map_link, store_phone, store_type, store_description, store_location_image')
            .eq('id', user.id)
            .single();
          
          if (userData) {
            setConfig({
              storeName: userData.store_name || '',
              address: userData.store_address || '',
              googleMapLink: userData.store_google_map_link || '',
              phone: userData.store_phone || '',
              storeType: userData.store_type || '',
              storeDescription: userData.store_description || '',
              storeLocationImage: userData.store_location_image || ''
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `store-locations/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('store-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('store-images')
        .getPublicUrl(filePath);

      setConfig(prev => ({ ...prev, storeLocationImage: publicUrl }));
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert("圖片上傳失敗：" + error.message);
    } finally {
      setUploading(false);
    }
  };

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
          store_address: config.address,
          store_google_map_link: config.googleMapLink,
          store_phone: config.phone,
          store_type: config.storeType,
          store_description: config.storeDescription,
          store_location_image: config.storeLocationImage
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
              店家名稱
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

          {/* 店家簡介 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              店家簡介
            </label>
            <textarea
              value={config.storeDescription}
              onChange={(e) => setConfig(prev => ({ ...prev, storeDescription: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-none"
              placeholder="請輸入店家簡介"
              rows={4}
            />
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

          {/* Google Map 連結 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Google Map 連結
            </label>
            <div className="relative">
              <input
                type="url"
                value={config.googleMapLink}
                onChange={(e) => setConfig(prev => ({ ...prev, googleMapLink: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                placeholder="請輸入 Google Map 連結"
              />
            </div>
          </div>

          {/* 店家位置圖片 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              店家位置圖片
            </label>
            <div className="space-y-3">
              {config.storeLocationImage && (
                <div className="relative">
                  <img
                    src={config.storeLocationImage}
                    alt="店家位置"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, storeLocationImage: '' }))}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-black file:text-white file:text-sm file:cursor-pointer disabled:opacity-50"
                />
                {uploading && (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <p className="text-xs text-gray-500">
                上傳店家位置的指示圖片，例如店面照片、位置指示圖等
              </p>
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
