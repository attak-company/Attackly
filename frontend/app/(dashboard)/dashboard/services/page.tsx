"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Package, Save, Plus, X, Check } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface PricingOption {
  id: string;
  label: string;
  price: number;
  duration: number;
}

interface Service {
  id: string;
  name: string;
  description: string;
  type: string;
  pricingOptions: PricingOption[];
  keywords: string;
}

interface ServiceType {
  id: string;
  name: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([
    { id: "1", name: "", description: "", type: "", pricingOptions: [{ id: "1-1", label: "", price: 0, duration: 30 }], keywords: "" }
  ]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [editingType, setEditingType] = useState<ServiceType | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('services, service_types')
            .eq('id', user.id)
            .single();

          if (userData) {
            if (userData.services) {
              setServices(userData.services);
            }
            if (userData.service_types) {
              setServiceTypes(userData.service_types);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const addService = () => {
    setServices([...services, {
      id: Date.now().toString(),
      name: "",
      description: "",
      type: "",
      pricingOptions: [{ id: `${Date.now()}-1`, label: "", price: 0, duration: 30 }],
      keywords: ""
    }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof Service, value: string | number) => {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [field]: value };
    setServices(newServices);
  };

  const addPricingOption = (serviceIndex: number) => {
    const newServices = [...services];
    newServices[serviceIndex].pricingOptions.push({
      id: `${Date.now()}-${newServices[serviceIndex].pricingOptions.length}`,
      label: "",
      price: 0,
      duration: 30
    });
    setServices(newServices);
  };

  const removePricingOption = (serviceIndex: number, optionIndex: number) => {
    const newServices = [...services];
    newServices[serviceIndex].pricingOptions = newServices[serviceIndex].pricingOptions.filter((_, i) => i !== optionIndex);
    setServices(newServices);
  };

  const updatePricingOption = (serviceIndex: number, optionIndex: number, field: keyof PricingOption, value: string | number) => {
    const newServices = [...services];
    newServices[serviceIndex].pricingOptions[optionIndex] = {
      ...newServices[serviceIndex].pricingOptions[optionIndex],
      [field]: value
    };
    setServices(newServices);
  };

  const addServiceType = () => {
    if (newTypeName.trim()) {
      const newType: ServiceType = {
        id: Date.now().toString(),
        name: newTypeName.trim()
      };
      setServiceTypes([...serviceTypes, newType]);
      setNewTypeName("");
    }
  };

  const editServiceType = (type: ServiceType) => {
    setEditingType(type);
    setNewTypeName(type.name);
  };

  const updateServiceType = () => {
    if (editingType && newTypeName.trim()) {
      setServiceTypes(serviceTypes.map(t =>
        t.id === editingType.id ? { ...t, name: newTypeName.trim() } : t
      ));
      setEditingType(null);
      setNewTypeName("");
    }
  };

  const deleteServiceType = (id: string) => {
    setServiceTypes(serviceTypes.filter(t => t.id !== id));
    // Also update services that use this type to empty string
    setServices(services.map(s =>
      s.type === id ? { ...s, type: "" } : s
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from('users')
        .update({ services, service_types: serviceTypes })
        .eq('id', user.id);

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error saving services:", error);
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
      <PageHeader title="服務項目" />

      {/* Service Type Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">服務類型管理</h2>
          <button
            onClick={() => setShowTypeManager(!showTypeManager)}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            {showTypeManager ? "收起" : "展開"}
          </button>
        </div>

        {showTypeManager && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="輸入新類型名稱"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
              <button
                onClick={editingType ? updateServiceType : addServiceType}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors"
              >
                {editingType ? "更新" : "新增"}
              </button>
              {editingType && (
                <button
                  onClick={() => {
                    setEditingType(null);
                    setNewTypeName("");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 transition-colors"
                >
                  取消
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {serviceTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-900">{type.name}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => editServiceType(type)}
                      className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteServiceType(type.id)}
                      className="p-1 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Service Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-4">
          {services.map((service, index) => (
            <div key={service.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">服務類型</label>
                    <select
                      value={service.type}
                      onChange={(e) => updateService(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black"
                    >
                      <option value="">請選擇類型</option>
                      {serviceTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">服務名稱</label>
                    <input
                      type="text"
                      value={service.name}
                      onChange={(e) => updateService(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black"
                      placeholder="請輸入服務名稱"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">服務描述</label>
                    <textarea
                      value={service.description}
                      onChange={(e) => updateService(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black resize-none"
                      rows={2}
                      placeholder="請輸入服務描述"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">AI 辨識關鍵字（選填）</label>
                    <textarea
                      value={service.keywords}
                      onChange={(e) => updateService(index, 'keywords', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black resize-none"
                      rows={2}
                      placeholder="例：白色、邊框、氣質款（用逗號分隔）"
                    />
                    <p className="text-xs text-gray-500 mt-1">輸入相關俗名或特徵，幫助 AI 精確辨識服務</p>
                  </div>

                  {/* Pricing Options */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-900">報價選項</label>
                      <button
                        onClick={() => addPricingOption(index)}
                        className="text-xs text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        新增選項
                      </button>
                    </div>

                    {service.pricingOptions.map((option, optionIndex) => (
                      <div key={option.id} className="p-3 bg-gray-100 rounded-lg space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={option.label}
                              onChange={(e) => updatePricingOption(index, optionIndex, 'label', e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black"
                              placeholder="例：小型犬、本店卸續作"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">價格</label>
                                <input
                                  type="number"
                                  value={option.price}
                                  onChange={(e) => updatePricingOption(index, optionIndex, 'price', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">時長（分鐘）</label>
                                <input
                                  type="number"
                                  value={option.duration}
                                  onChange={(e) => updatePricingOption(index, optionIndex, 'duration', parseInt(e.target.value) || 30)}
                                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black"
                                  placeholder="30"
                                />
                              </div>
                            </div>
                          </div>
                          {service.pricingOptions.length > 1 && (
                            <button
                              onClick={() => removePricingOption(index, optionIndex)}
                              className="p-1 text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => removeService(index)}
                  className="p-2 text-red-500 hover:text-red-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={addService}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增服務項目
          </button>
        </div>

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
  );
}
