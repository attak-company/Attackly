"use client";

import { useState, useEffect } from "react";
import { Save, Bot, Plus, X, Check } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getAISystemPrompt, getAITaggingPrompt, getAIAnalysisPrompt } from "@/lib/aiHelper";

export default function AISettingsPage() {
  const [config, setConfig] = useState<{
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchAISettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('ai_settings')
            .eq('id', user.id)
            .single();
          
          if (userData && userData.ai_settings) {
            setConfig({
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
        }
      } catch (error) {
        console.error("Error fetching AI settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAISettings();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">AI 客服設定</h2>
        <p className="text-gray-700 mt-2">設定 AI 的性格與回應規則，支援 V2 資料結構分析。</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* AI Behavior */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <Bot className="w-5 h-5 text-black mr-2" />
            <h3 className="font-bold text-lg text-gray-900">AI 行為自訂</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">客服語氣</label>
              <div className="space-y-2">
                <select
                  value={config.tone}
                  onChange={(e) => setConfig({ ...config, tone: e.target.value })}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900"
                >
                  <option value="friendly">親切有禮 (推薦)</option>
                  <option value="professional">專業正式</option>
                  <option value="humorous">幽默風趣</option>
                  <option value="custom">自訂語氣</option>
                  <option value="sample">依照你的口氣</option>
                </select>
                {config.tone === 'custom' && (
                  <input
                    type="text"
                    value={config.customTone || ''}
                    onChange={(e) => setConfig({ ...config, customTone: e.target.value })}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900 text-sm"
                    placeholder="請輸入語氣描述，例如：親切友善、生氣的、滑稽的"
                  />
                )}
                {config.tone === 'sample' && (
                  <textarea
                    value={config.sampleText || ''}
                    onChange={(e) => setConfig({ ...config, sampleText: e.target.value })}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900 text-sm resize-none"
                    rows={4}
                    placeholder="請輸入您平常對客戶說的對話範例，AI 會依照這些範例的語氣風格來回覆"
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">硬性規則</label>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">無法確定就不要亂編造</span>
                  <button
                    onClick={() => setConfig({ ...config, hardcodedRules: { ...config.hardcodedRules, noHallucination: !config.hardcodedRules.noHallucination } })}
                    className={`w-12 h-6 rounded-full transition-colors ${config.hardcodedRules.noHallucination ? 'bg-black' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${config.hardcodedRules.noHallucination ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">對話導向成交與預約</span>
                  <button
                    onClick={() => setConfig({ ...config, hardcodedRules: { ...config.hardcodedRules, driveBooking: !config.hardcodedRules.driveBooking } })}
                    className={`w-12 h-6 rounded-full transition-colors ${config.hardcodedRules.driveBooking ? 'bg-black' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${config.hardcodedRules.driveBooking ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">遇到負面情緒安撫優先</span>
                  <button
                    onClick={() => setConfig({ ...config, hardcodedRules: { ...config.hardcodedRules, comfortEmotions: !config.hardcodedRules.comfortEmotions } })}
                    className={`w-12 h-6 rounded-full transition-colors ${config.hardcodedRules.comfortEmotions ? 'bg-black' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${config.hardcodedRules.comfortEmotions ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">回答以店家利益優先</span>
                  <button
                    onClick={() => setConfig({ ...config, hardcodedRules: { ...config.hardcodedRules, prioritizeStore: !config.hardcodedRules.prioritizeStore } })}
                    className={`w-12 h-6 rounded-full transition-colors ${config.hardcodedRules.prioritizeStore ? 'bg-black' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${config.hardcodedRules.prioritizeStore ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-900 mb-1">自訂規則</label>
              <div className="space-y-3">
                {config.rules.map((rule, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <textarea
                          value={rule}
                          onChange={(e) => {
                            const newRules = [...config.rules];
                            newRules[index] = e.target.value;
                            setConfig({ ...config, rules: newRules });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900 text-sm resize-none"
                          rows={2}
                          placeholder="例如：不知道就不要亂講"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newRules = config.rules.filter((_, i) => i !== index);
                          setConfig({ ...config, rules: newRules });
                        }}
                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setConfig({ ...config, rules: [...config.rules, ""] })}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  新增規則
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={async () => {
              setSaving(true);
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                  throw new Error("User not authenticated");
                }

                // 過濾掉空的規則
                const filteredRules = config.rules.filter(rule => rule.trim());

                const { error } = await supabase
                  .from('users')
                  .update({
                    ai_settings: {
                      tone: config.tone,
                      customTone: config.tone === 'custom' ? config.customTone : undefined,
                      sampleText: config.tone === 'sample' ? config.sampleText : undefined,
                      rules: filteredRules,
                      hardcodedRules: config.hardcodedRules
                    }
                  })
                  .eq('id', user.id);

                if (error) throw error;

                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2000);
              } catch (error: any) {
                console.error("Error saving AI settings:", error);
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving || (config.tone === 'custom' && !config.customTone?.trim()) || (config.tone === 'sample' && !config.sampleText?.trim())}
            className="flex items-center px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all duration-300 hover:scale-105 active:scale-95 disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                儲存中...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                已儲存
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                儲存設定
              </>
            )}
          </button>
        </div>

        {/* V2 資料結構說明 */}
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center mb-4">
            <Bot className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-bold text-lg text-blue-900">V2 資料結構支援</h3>
          </div>
          <div className="space-y-3">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">AI 現在可以精準分析以下 V2 資料結構：</p>
              <ul className="space-y-1 ml-4">
                <li>• <code className="bg-blue-100 px-1 rounded">service_content</code> - 服務價格、類別分析</li>
                <li>• <code className="bg-blue-100 px-1 rounded">schedule_config</code> - 排程時長、時間分析</li>
                <li>• <code className="bg-blue-100 px-1 rounded">admin_meta.ai_notes</code> - AI 分析結果儲存</li>
                <li>• <code className="bg-blue-100 px-1 rounded">customer_detail</code> - 客戶偏好標籤</li>
              </ul>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 font-mono break-all">
                System Prompt: {getAISystemPrompt().substring(0, 100)}...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
