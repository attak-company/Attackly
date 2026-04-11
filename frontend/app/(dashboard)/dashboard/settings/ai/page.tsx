"use client";

import { useState } from "react";
import { Save, Bot, Plus, X, Check } from "lucide-react";

interface Rule {
  condition: string;
  action: string;
}

export default function AISettingsPage() {
  const [config, setConfig] = useState<{
    tone: string;
    rules: Rule[];
  }>({
    tone: "friendly",
    rules: [{ condition: "", action: "" }],
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">AI 客服設定</h2>
        <p className="text-gray-700 mt-2">設定 AI 的性格與回應規則。</p>
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
              <select
                value={config.tone}
                onChange={(e) => setConfig({ ...config, tone: e.target.value })}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900"
              >
                <option value="friendly">親切有禮 (推薦)</option>
                <option value="professional">專業正式</option>
                <option value="enthusiastic">熱情主動</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">回覆規則</label>
              <div className="space-y-3">
                {config.rules.map((rule, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">條件</label>
                        <input
                          type="text"
                          value={rule.condition}
                          onChange={(e) => {
                            const newRules = [...config.rules];
                            newRules[index] = { ...rule, condition: e.target.value };
                            setConfig({ ...config, rules: newRules });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900 text-sm"
                          placeholder="例如：只能回覆有關美甲行業的問題"
                        />
                      </div>
                      {config.rules.length > 1 && (
                        <button
                          onClick={() => {
                            const newRules = config.rules.filter((_, i) => i !== index);
                            setConfig({ ...config, rules: newRules });
                          }}
                          className="p-2 text-red-500 hover:text-red-700 transition-colors mt-4"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">違反時處理</label>
                      <input
                        type="text"
                        value={rule.action}
                        onChange={(e) => {
                          const newRules = [...config.rules];
                          newRules[index] = { ...rule, action: e.target.value };
                          setConfig({ ...config, rules: newRules });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900 text-sm"
                        placeholder="例如：不回覆"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setConfig({ ...config, rules: [...config.rules, { condition: "", action: "" }] })}
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
              // 模擬儲存動作
              await new Promise(resolve => setTimeout(resolve, 1000));
              setSaving(false);
              setSaveSuccess(true);
              setTimeout(() => setSaveSuccess(false), 2000);
            }}
            disabled={saving}
            className="flex items-center px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
      </div>
    </div>
  );
}
