"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { Key, Save, Copy, Check, Bot, Plus, X, Store, MapPin, Phone, Building2, Package, FileText, User, Database } from "lucide-react";
import { createClient } from "@/lib/supabase";

type MainTabType = 'account' | 'ai' | 'basic' | 'vector';
type SubTabType = 'line' | 'ai_agent' | 'store' | 'services' | 'faq';

export default function SettingsPage() {
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('account');
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('line');
  const [expandedMainTabs, setExpandedMainTabs] = useState<Set<MainTabType>>(new Set(['ai']));
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // LINE Settings
  const [lineConfig, setLineConfig] = useState({
    lineApiKey: "",
    lineSecret: "",
    userId: "",
  });
  const [lineCopied, setLineCopied] = useState(false);
  const [lineSaving, setLineSaving] = useState(false);
  const [lineSaveSuccess, setLineSaveSuccess] = useState(false);
  const [lineValidating, setLineValidating] = useState(false);
  const [lineValidationError, setLineValidationError] = useState<string | null>(null);
  const [lineValidationStatus, setLineValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [lineValidationMessage, setLineValidationMessage] = useState<string>('');

  // AI Settings
  const [aiConfig, setAiConfig] = useState<{
    tone: string;
    customTone?: string;
    sampleText?: string;
    rules: string[];
    hardcodedRules: {
      noHallucination: boolean;
      driveBooking: boolean;
      comfortEmotions: boolean;
      prioritizeStore: boolean;
    };
  }>({
    tone: "friendly",
    customTone: "",
    sampleText: "",
    rules: [""],
    hardcodedRules: {
      noHallucination: false,
      driveBooking: false,
      comfortEmotions: false,
      prioritizeStore: false
    }
  });
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSaveSuccess, setAiSaveSuccess] = useState(false);

  // Store Settings
  const [storeConfig, setStoreConfig] = useState({
    storeName: "",
    address: "",
    googleMapLink: "",
    phone: "",
    storeType: "",
    storeDescription: "",
    storeLocationImage: "",
  });
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeSaveSuccess, setStoreSaveSuccess] = useState(false);
  const [storeUploading, setStoreUploading] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
  const webhookUrl = `${baseUrl}/api/webhook/${lineConfig.userId}`;

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setLineConfig(prev => ({ ...prev, userId: user.id }));
          
          // Fetch LINE credentials
          const { data: userData, error } = await supabase
            .from('users')
            .select('line_channel_access_token, line_channel_secret, ai_settings, store_name, store_address, store_google_map_link, store_phone, store_type, store_description, store_location_image')
            .eq('id', user.id)
            .single();
          
          if (userData) {
            setLineConfig(prev => ({
              ...prev,
              lineApiKey: userData.line_channel_access_token || '',
              lineSecret: userData.line_channel_secret || ''
            }));
            
            if (userData.ai_settings) {
              setAiConfig({
                tone: userData.ai_settings.tone || 'friendly',
                customTone: userData.ai_settings.customTone || '',
                sampleText: userData.ai_settings.sampleText || '',
                rules: userData.ai_settings.rules || [""],
                hardcodedRules: userData.ai_settings.hardcodedRules || {
                  noHallucination: false,
                  driveBooking: false,
                  comfortEmotions: false,
                  prioritizeStore: false
                }
              });
            }
            
            setStoreConfig({
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
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [supabase]);

  // LINE validation
  const validateCredentials = useCallback(
    (token: string, secret: string) => {
      if (!token || !secret) {
        setLineValidationStatus('idle');
        return;
      }

      setLineValidationStatus('validating');
      setLineValidationError(null);

      const timer = setTimeout(async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/line/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channel_access_token: token,
              channel_secret: secret,
            }),
          });

          const result = await response.json();

          if (result.valid) {
            setLineValidationStatus('valid');
            setLineValidationMessage(result.message || '格式正確');
          } else {
            setLineValidationStatus('invalid');
            setLineValidationError(result.message || 'Credentials 驗證失敗');
          }
        } catch (error: any) {
          setLineValidationStatus('invalid');
          setLineValidationError(`驗證過程發生錯誤: ${error.message}`);
        }
      }, 800);

      return () => clearTimeout(timer);
    },
    []
  );

  useEffect(() => {
    validateCredentials(lineConfig.lineApiKey, lineConfig.lineSecret);
  }, [lineConfig.lineApiKey, lineConfig.lineSecret, validateCredentials]);

  const handleLineSave = async () => {
    setLineSaving(true);
    setLineSaveSuccess(false);
    setLineValidationError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      if (lineConfig.lineApiKey && lineConfig.lineSecret) {
        if (lineValidationStatus === 'invalid') {
          setLineValidationError('請輸入正確的 LINE Credentials');
          return;
        }
        if (lineValidationStatus !== 'valid') {
          setLineValidationError('請等待驗證完成或輸入正確的 Credentials');
          return;
        }
      }
      
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (checkError && checkError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            line_channel_access_token: lineConfig.lineApiKey,
            line_channel_secret: lineConfig.lineSecret
          });
        if (insertError) throw insertError;
      } else if (checkError) {
        throw checkError;
      } else {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            line_channel_access_token: lineConfig.lineApiKey,
            line_channel_secret: lineConfig.lineSecret
          })
          .eq('id', user.id);
        if (updateError) throw updateError;
      }
      
      setLineSaveSuccess(true);
      setTimeout(() => setLineSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error saving LINE credentials:", error);
      alert(`儲存失敗: ${error.message || '未知錯誤'}`);
    } finally {
      setLineSaving(false);
    }
  };

  const handleLineCopy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setLineCopied(true);
      setTimeout(() => setLineCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleAISave = async () => {
    setAiSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const filteredRules = aiConfig.rules.filter(rule => rule.trim());

      const { error } = await supabase
        .from('users')
        .update({
          ai_settings: {
            tone: aiConfig.tone,
            customTone: aiConfig.tone === 'custom' ? aiConfig.customTone : undefined,
            sampleText: aiConfig.tone === 'sample' ? aiConfig.sampleText : undefined,
            rules: filteredRules,
            hardcodedRules: aiConfig.hardcodedRules
          }
        })
        .eq('id', user.id);

      if (error) throw error;

      setAiSaveSuccess(true);
      setTimeout(() => setAiSaveSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error saving AI settings:", error);
    } finally {
      setAiSaving(false);
    }
  };

  const handleStoreImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStoreUploading(true);
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

      setStoreConfig(prev => ({ ...prev, storeLocationImage: publicUrl }));
    } catch (error: any) {
      console.error("Error uploading image:", error);
      alert("圖片上傳失敗：" + error.message);
    } finally {
      setStoreUploading(false);
    }
  };

  const handleStoreSave = async () => {
    setStoreSaving(true);
    setStoreSaveSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('users')
        .update({
          store_name: storeConfig.storeName,
          store_address: storeConfig.address,
          store_google_map_link: storeConfig.googleMapLink,
          store_phone: storeConfig.phone,
          store_type: storeConfig.storeType,
          store_description: storeConfig.storeDescription,
          store_location_image: storeConfig.storeLocationImage
        })
        .eq('id', user.id);

      if (error) throw error;

      setStoreSaveSuccess(true);
      setTimeout(() => setStoreSaveSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error saving store data:", error);
      alert("儲存失敗：" + error.message);
    } finally {
      setStoreSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  const mainTabs = [
    { id: 'account' as MainTabType, label: '帳戶設定', icon: User },
    { id: 'ai' as MainTabType, label: 'AI設定', icon: Bot },
    { id: 'basic' as MainTabType, label: '基本資訊設定', icon: Store },
    { id: 'vector' as MainTabType, label: '向量資訊設定', icon: Database },
  ];

  const subTabsConfig: Record<MainTabType, { id: SubTabType, label: string, icon: any }[]> = {
    account: [],
    ai: [
      { id: 'line' as SubTabType, label: 'LINE設定', icon: Key },
      { id: 'ai_agent' as SubTabType, label: 'AI客服設定', icon: Bot },
    ],
    basic: [
      { id: 'store' as SubTabType, label: '店家設定', icon: Store },
      { id: 'services' as SubTabType, label: '服務項目設定', icon: Package },
    ],
    vector: [
      { id: 'faq' as SubTabType, label: '知識庫管理', icon: FileText },
    ],
  };

  const toggleMainTab = (tabId: MainTabType) => {
    setExpandedMainTabs(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(tabId)) {
        newExpanded.delete(tabId);
      } else {
        newExpanded.add(tabId);
        // When expanding, set the first sub-tab as active
        const subTabs = subTabsConfig[tabId];
        if (subTabs.length > 0) {
          setActiveSubTab(subTabs[0].id);
        }
      }
      return newExpanded;
    });
  };

  const handleSubTabClick = (tabId: SubTabType) => {
    setActiveSubTab(tabId);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader title="設定" />

      {/* Accordion List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isExpanded = expandedMainTabs.has(tab.id);
          const subTabs = subTabsConfig[tab.id];
          return (
            <div key={tab.id} className="border-b border-gray-100 last:border-b-0">
              <button
                onClick={() => toggleMainTab(tab.id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">{tab.label}</span>
                </div>
                {subTabs.length > 0 && (
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              {isExpanded && subTabs.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50 max-h-64 overflow-y-auto">
                  {subTabs.map((subTab) => {
                    const SubIcon = subTab.icon;
                    return (
                      <button
                        key={subTab.id}
                        onClick={() => handleSubTabClick(subTab.id)}
                        className={`w-full flex items-center gap-3 px-12 py-3 text-sm transition-colors ${
                          activeSubTab === subTab.id
                            ? 'bg-gray-200 text-gray-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <SubIcon className="w-4 h-4" />
                        {subTab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {activeMainTab === 'account' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">帳戶設定</h3>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-600">帳戶設定功能開發中...</p>
            </div>
          </div>
        )}

        {activeMainTab === 'ai' && activeSubTab === 'line' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Key className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">LINE 串接設定</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">LINE Channel Access Token</label>
                <input
                  type="text"
                  value={lineConfig.lineApiKey}
                  onChange={(e) => setLineConfig({ ...lineConfig, lineApiKey: e.target.value })}
                  className={`block w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors ${
                    lineValidationStatus === 'valid' 
                      ? 'border-green-500 focus:ring-green-500' 
                      : lineValidationStatus === 'invalid' 
                      ? 'border-red-500 focus:ring-red-500' 
                      : lineValidationStatus === 'validating'
                      ? 'border-yellow-500 focus:ring-yellow-500'
                      : 'border-gray-300 focus:border-black'
                  }`}
                  placeholder="請輸入 LINE Channel Access Token"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">LINE Channel Secret</label>
                <input
                  type="text"
                  value={lineConfig.lineSecret}
                  onChange={(e) => setLineConfig({ ...lineConfig, lineSecret: e.target.value })}
                  className={`block w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors ${
                    lineValidationStatus === 'valid' 
                      ? 'border-green-500 focus:ring-green-500' 
                      : lineValidationStatus === 'invalid' 
                      ? 'border-red-500 focus:ring-red-500' 
                      : lineValidationStatus === 'validating'
                      ? 'border-yellow-500 focus:ring-yellow-500'
                      : 'border-gray-300 focus:border-black'
                  }`}
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
                    onClick={handleLineCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    {lineCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {lineCopied ? '已複製' : '複製'}
                  </button>
                </div>
              </div>
              {lineValidationStatus === 'validating' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">驗證中...</p>
                </div>
              )}
              {lineValidationStatus === 'valid' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">{lineValidationMessage || '格式正確'}</p>
                </div>
              )}
              {lineValidationStatus === 'invalid' && lineValidationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{lineValidationError}</p>
                </div>
              )}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleLineSave}
                  disabled={lineSaving || lineValidating || (Boolean(lineConfig.lineApiKey) && Boolean(lineConfig.lineSecret) && lineValidationStatus !== 'valid')}
                  className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                >
                  {lineSaving ? '儲存中...' : lineSaveSuccess ? '已儲存' : <><Save className="w-4 h-4" />儲存變更</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeMainTab === 'ai' && activeSubTab === 'ai_agent' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Bot className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">AI 行為自訂</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">客服語氣</label>
                <select
                  value={aiConfig.tone}
                  onChange={(e) => setAiConfig({ ...aiConfig, tone: e.target.value })}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900"
                >
                  <option value="friendly">親切有禮 (推薦)</option>
                  <option value="professional">專業正式</option>
                  <option value="humorous">幽默風趣</option>
                  <option value="custom">自訂語氣</option>
                  <option value="sample">依照你的口氣</option>
                </select>
                {aiConfig.tone === 'custom' && (
                  <input
                    type="text"
                    value={aiConfig.customTone || ''}
                    onChange={(e) => setAiConfig({ ...aiConfig, customTone: e.target.value })}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900 text-sm mt-2"
                    placeholder="請輸入語氣描述"
                  />
                )}
                {aiConfig.tone === 'sample' && (
                  <textarea
                    value={aiConfig.sampleText || ''}
                    onChange={(e) => setAiConfig({ ...aiConfig, sampleText: e.target.value })}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900 text-sm resize-none mt-2"
                    rows={4}
                    placeholder="請輸入對話範例"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">硬性規則</label>
                <div className="space-y-2">
                  {[
                    { key: 'noHallucination', label: '無法確定就不要亂編造' },
                    { key: 'driveBooking', label: '對話導向成交與預約' },
                    { key: 'comfortEmotions', label: '遇到負面情緒安撫優先' },
                    { key: 'prioritizeStore', label: '回答以店家利益優先' },
                  ].map((rule) => (
                    <div key={rule.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">{rule.label}</span>
                      <button
                        onClick={() => setAiConfig({ ...aiConfig, hardcodedRules: { ...aiConfig.hardcodedRules, [rule.key]: !aiConfig.hardcodedRules[rule.key as keyof typeof aiConfig.hardcodedRules] } })}
                        className={`w-12 h-6 rounded-full transition-colors ${aiConfig.hardcodedRules[rule.key as keyof typeof aiConfig.hardcodedRules] ? 'bg-black' : 'bg-gray-300'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${aiConfig.hardcodedRules[rule.key as keyof typeof aiConfig.hardcodedRules] ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">自訂規則</label>
                <div className="space-y-3">
                  {aiConfig.rules.map((rule, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <textarea
                            value={rule}
                            onChange={(e) => {
                              const newRules = [...aiConfig.rules];
                              newRules[index] = e.target.value;
                              setAiConfig({ ...aiConfig, rules: newRules });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900 text-sm resize-none"
                            rows={2}
                            placeholder="例如：不知道就不要亂講"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const newRules = aiConfig.rules.filter((_, i) => i !== index);
                            setAiConfig({ ...aiConfig, rules: newRules });
                          }}
                          className="p-2 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setAiConfig({ ...aiConfig, rules: [...aiConfig.rules, ""] })}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    新增規則
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAISave}
                disabled={aiSaving || (aiConfig.tone === 'custom' && !aiConfig.customTone?.trim()) || (aiConfig.tone === 'sample' && !aiConfig.sampleText?.trim())}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all disabled:bg-gray-400"
              >
                {aiSaving ? '儲存中...' : aiSaveSuccess ? <><Check className="w-5 h-5" />已儲存</> : <><Save className="w-5 h-5" />儲存設定</>}
              </button>
            </div>
          </div>
        )}

        {activeMainTab === 'basic' && activeSubTab === 'store' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Store className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">店家資訊</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">店家名稱</label>
                <input
                  type="text"
                  value={storeConfig.storeName}
                  onChange={(e) => setStoreConfig(prev => ({ ...prev, storeName: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  placeholder="請輸入店名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">店家類型</label>
                <input
                  type="text"
                  value={storeConfig.storeType}
                  onChange={(e) => setStoreConfig(prev => ({ ...prev, storeType: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  placeholder="請輸入店家類型"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">店家簡介</label>
                <textarea
                  value={storeConfig.storeDescription}
                  onChange={(e) => setStoreConfig(prev => ({ ...prev, storeDescription: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-none"
                  placeholder="請輸入店家簡介"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">電話</label>
                <input
                  type="tel"
                  value={storeConfig.phone}
                  onChange={(e) => setStoreConfig(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  placeholder="請輸入電話"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">地址</label>
                <input
                  type="text"
                  value={storeConfig.address}
                  onChange={(e) => setStoreConfig(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  placeholder="請輸入地址"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Google Map 連結</label>
                <input
                  type="url"
                  value={storeConfig.googleMapLink}
                  onChange={(e) => setStoreConfig(prev => ({ ...prev, googleMapLink: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  placeholder="請輸入 Google Map 連結"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">店家位置圖片</label>
                <div className="space-y-3">
                  {storeConfig.storeLocationImage && (
                    <div className="relative">
                      <img
                        src={storeConfig.storeLocationImage}
                        alt="店家位置"
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => setStoreConfig(prev => ({ ...prev, storeLocationImage: '' }))}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleStoreImageUpload}
                    disabled={storeUploading}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-black file:text-white file:text-sm file:cursor-pointer disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleStoreSave}
                  disabled={storeSaving}
                  className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-all disabled:bg-gray-400"
                >
                  {storeSaving ? '儲存中...' : storeSaveSuccess ? <><Check className="w-4 h-4" />已儲存</> : <><Save className="w-4 h-4" />儲存變更</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeMainTab === 'basic' && activeSubTab === 'services' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Package className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">服務項目</h3>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-600">請前往服務項目頁面管理服務。</p>
              <a href="/dashboard/services" className="text-blue-600 hover:underline mt-2 inline-block">前往服務項目頁面 →</a>
            </div>
          </div>
        )}

        {activeMainTab === 'vector' && activeSubTab === 'faq' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">知識庫管理</h3>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-600">請前往知識庫管理頁面管理 FAQ。</p>
              <a href="/dashboard/faq" className="text-blue-600 hover:underline mt-2 inline-block">前往知識庫管理頁面 →</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
