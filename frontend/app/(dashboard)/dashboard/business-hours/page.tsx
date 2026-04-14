"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Clock, Save, Plus, X, Check } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface BusinessHour {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

export default function BusinessHoursPage() {
  const [hours, setHours] = useState<BusinessHour[]>([
    { day: "星期一", open: "09:00", close: "18:00", isClosed: false },
    { day: "星期二", open: "09:00", close: "18:00", isClosed: false },
    { day: "星期三", open: "09:00", close: "18:00", isClosed: false },
    { day: "星期四", open: "09:00", close: "18:00", isClosed: false },
    { day: "星期五", open: "09:00", close: "18:00", isClosed: false },
    { day: "星期六", open: "09:00", close: "18:00", isClosed: false },
    { day: "星期日", open: "09:00", close: "18:00", isClosed: false },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchBusinessHours = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('business_hours')
            .eq('id', user.id)
            .single();
          
          if (userData && userData.business_hours) {
            setHours(userData.business_hours);
          }
        }
      } catch (error) {
        console.error("Error fetching business hours:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessHours();
  }, [supabase]);

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
        .update({ business_hours: hours })
        .eq('id', user.id);

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error saving business hours:", error);
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
      <PageHeader title="營業時間" />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-4">
          {hours.map((hour, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1 font-medium text-gray-900">{hour.day}</div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={hour.open}
                  onChange={(e) => {
                    const newHours = [...hours];
                    newHours[index] = { ...hour, open: e.target.value };
                    setHours(newHours);
                  }}
                  disabled={hour.isClosed}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black disabled:opacity-50"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="time"
                  value={hour.close}
                  onChange={(e) => {
                    const newHours = [...hours];
                    newHours[index] = { ...hour, close: e.target.value };
                    setHours(newHours);
                  }}
                  disabled={hour.isClosed}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black disabled:opacity-50"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hour.isClosed}
                  onChange={(e) => {
                    const newHours = [...hours];
                    newHours[index] = { ...hour, isClosed: e.target.checked };
                    setHours(newHours);
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="text-sm text-gray-700">公休</span>
              </label>
            </div>
          ))}
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
