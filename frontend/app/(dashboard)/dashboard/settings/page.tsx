"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Key, Save, Copy, Check, Bot, Plus, X, Store, MapPin, Phone, Building2, Package, FileText, User, Database, Eye, EyeOff, Pen, Calendar, CalendarClock, ExternalLink, MoreHorizontal, Headphones, BookOpen, Bell, Play, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { validateEmployeeSchedules, removeServiceFromEmployees, type EmployeeAdvanceSettings } from "@/lib/booking-logic";

type MainTabType = 'account' | 'basic' | 'third_party' | 'ai' | 'other';
type SubTabType = 'line' | 'ai_agent' | 'store' | 'services' | 'faq' | 'staff' | 'booking_settings' | 'notification' | 'support' | 'manual';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('account');
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('ai_agent');
  const [expandedMainTab, setExpandedMainTab] = useState<MainTabType | null>('account');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Handle URL parameters for tab/sub-tab navigation
  useEffect(() => {
    const tab = searchParams.get('tab') as MainTabType;
    const sub = searchParams.get('sub') as SubTabType;
    if (tab && sub) {
      setActiveMainTab(tab);
      setActiveSubTab(sub);
      setExpandedMainTab(null);
    }
  }, [searchParams]);

  // Notification List
  const [notifications, setNotifications] = useState([
    { id: 1, title: '系統通知', message: '歡迎使用數位店長系統', time: '剛剛', read: false },
    { id: 2, title: '新預約', message: '客戶張三預約了剪髮服務', time: '10分鐘前', read: false },
    { id: 3, title: '預約提醒', message: '客戶李四的預約將在1小時後開始', time: '1小時前', read: true },
    { id: 4, title: '取消預約', message: '客戶王五取消了預約', time: '2小時前', read: true },
    { id: 5, title: '系統更新', message: '系統已更新至最新版本', time: '昨天', read: true },
  ]);

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

  // Staff Settings
  const [staffList, setStaffList] = useState<Array<{ id: string; name: string; phone: string; role: string; concurrentServiceCount: number; description: string; color: string; collapsed: boolean; specialty?: string }>>([]);
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffSaveSuccess, setStaffSaveSuccess] = useState(false);
  const [deleteStaffId, setDeleteStaffId] = useState<string | null>(null);

  const colorOptions = [
    "#FF0000", "#FF4500", "#FF6347", "#FF7F50", "#FF8C00", "#FFA500",
    "#FFD700", "#FFFF00", "#ADFF2F", "#32CD32", "#00FF00", "#00FA9A",
    "#00FFFF", "#00BFFF", "#1E90FF", "#0000FF", "#4169E1", "#6495ED",
    "#8A2BE2", "#9400D3", "#4B0082", "#D3D3D3", "#696969", "#000000"
  ];

  // Service Categories Settings
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categorySaveSuccess, setCategorySaveSuccess] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [showCategoryView, setShowCategoryView] = useState(false);
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);

  // Service Items Settings
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("");
  const [serviceItems, setServiceItems] = useState<Array<{ id: string; name: string; description: string; price: number; duration: number; category: string }>>([]);

  // Business Hours Settings
  // Booking Rules Settings
  const [bookingRules, setBookingRules] = useState({
    min_lead_time: 2,
    max_future_days: 30,
    auto_accept: true,
    buffer_time: 15
  });
  const [bookingSaving, setBookingSaving] = useState(false);

  // Employee Advance Settings
  const [employeeSettings, setEmployeeSettings] = useState<EmployeeAdvanceSettings[]>([]);
  const [employeeSettingsSaving, setEmployeeSettingsSaving] = useState(false);

  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceSaveSuccess, setServiceSaveSuccess] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [draggedServiceIndex, setDraggedServiceIndex] = useState<number | null>(null);
  const [serviceError, setServiceError] = useState<string>("");
  const [categoryError, setCategoryError] = useState<string>("");
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    price: 0,
    duration: 30,
    category: ""
  });
  const [serviceDropdownId, setServiceDropdownId] = useState<string | null>(null);

  // Account Settings
  const [usernameForm, setUsernameForm] = useState({
    newUsername: "",
    currentPassword: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameSaveSuccess, setUsernameSaveSuccess] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaveSuccess, setPasswordSaveSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [expandedLineStep, setExpandedLineStep] = useState<number | null>(null);

  // Refs for click outside detection
  const tabRefs = useRef<Record<MainTabType, HTMLElement | null>>({} as Record<MainTabType, HTMLElement | null>);
  const serviceDropdownRef = useRef<HTMLDivElement | null>(null);
  const categoryEditRef = useRef<HTMLDivElement | null>(null);

  // Close service dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
        setServiceDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cancel category edit when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryEditRef.current && !categoryEditRef.current.contains(event.target as Node) && editingCategoryId) {
        cancelCategoryEdit();
      }
    };

    if (editingCategoryId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [editingCategoryId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expandedMainTab) {
        const target = event.target as HTMLElement;
        const currentRef = tabRefs.current[expandedMainTab];
        if (currentRef && !currentRef.contains(target)) {
          setExpandedMainTab(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedMainTab]);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
  const webhookUrl = `${baseUrl}/api/webhook/${lineConfig.userId}`;

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setLineConfig(prev => ({ ...prev, userId: user.id }));

          // Fetch settings from settings table
          const { data: settingsData, error: settingsError } = await supabase
            .from('settings')
            .select('store_setting, employee_settings, service_settings, booking_rules')
            .eq('user_id', user.id)
            .single();

          // Fetch LINE credentials from users table
          const { data: lineData, error: lineError } = await supabase
            .from('users')
            .select('line_channel_access_token, line_channel_secret, ai_settings, username')
            .eq('id', user.id)
            .maybeSingle();

          if (lineData) {
            if (lineData.username) {
              setCurrentUsername(lineData.username);
            }
            setLineConfig(prev => ({
              ...prev,
              lineApiKey: lineData.line_channel_access_token || '',
              lineSecret: lineData.line_channel_secret || ''
            }));

            if (lineData.ai_settings) {
              setAiConfig({
                tone: lineData.ai_settings.tone || 'friendly',
                customTone: lineData.ai_settings.customTone || '',
                sampleText: lineData.ai_settings.sampleText || '',
                rules: lineData.ai_settings.rules || [""],
                hardcodedRules: lineData.ai_settings.hardcodedRules || {
                  noHallucination: false,
                  driveBooking: false,
                  comfortEmotions: false,
                  prioritizeStore: false
                }
              });
            }
          }

          // Load service settings from settings table
          if (settingsData && settingsData.service_settings) {
            if (settingsData.service_settings.categories) {
              setCategories(settingsData.service_settings.categories);
            }
            if (settingsData.service_settings.services) {
              setServiceItems(settingsData.service_settings.services);
            }
          }

          // Load employee settings from settings table
          if (settingsData && settingsData.employee_settings) {
            setStaffList(settingsData.employee_settings.map((staff: any) => ({ ...staff, collapsed: true })));
            setEmployeeSettings(settingsData.employee_settings);
          }

          // Load store settings from settings table
          if (settingsData && settingsData.store_setting) {
            const storeSetting = settingsData.store_setting;
            setStoreConfig({
              storeName: storeSetting.store_name || '',
              address: storeSetting.store_address || '',
              googleMapLink: storeSetting.store_google_maps_url || '',
              phone: storeSetting.store_phone || '',
              storeType: storeSetting.store_type || '',
              storeDescription: storeSetting.store_description || '',
              storeLocationImage: storeSetting.store_location_image || ''
            });
          }

          // Load booking rules from settings table
          if (settingsData && settingsData.booking_rules) {
            setBookingRules(settingsData.booking_rules);
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

      const storeSetting = {
        store_name: storeConfig.storeName,
        store_type: storeConfig.storeType,
        store_description: storeConfig.storeDescription,
        store_phone: storeConfig.phone,
        store_address: storeConfig.address,
        store_google_maps_url: storeConfig.googleMapLink,
        store_location_image: storeConfig.storeLocationImage
      };

      // Check if settings record exists for this user
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      let error;
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('settings')
          .update({ store_setting: storeSetting })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('settings')
          .insert({ user_id: user.id, store_setting: storeSetting });
        error = result.error;
      }

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

  const addStaff = () => {
    setStaffList([...staffList, {
      id: Date.now().toString(),
      name: "",
      phone: "",
      role: "",
      concurrentServiceCount: 1,
      description: "",
      color: "#000000",
      collapsed: false,
      specialty: ""
    }]);
  };

  const removeStaff = (id: string) => {
    setDeleteStaffId(id);
  };

  const confirmDeleteStaff = async () => {
    if (deleteStaffId) {
      const updatedList = staffList.filter(staff => staff.id !== deleteStaffId);
      setStaffList(updatedList);
      setDeleteStaffId(null);

      // Save to database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if settings record exists for this user
        const { data: existingSettings } = await supabase
          .from('settings')
          .select('user_id')
          .eq('user_id', user.id)
          .single();

        let error;
        if (existingSettings) {
          // Update existing record
          const result = await supabase
            .from('settings')
            .update({ employee_settings: updatedList })
            .eq('user_id', user.id);
          error = result.error;
        } else {
          // Insert new record
          const result = await supabase
            .from('settings')
            .insert({ user_id: user.id, employee_settings: updatedList });
          error = result.error;
        }

        if (error) console.error("Error deleting staff:", error);
      } catch (error) {
        console.error("Error deleting staff:", error);
      }
    }
  };

  const cancelDeleteStaff = () => {
    setDeleteStaffId(null);
  };

  const updateStaff = (id: string, field: string, value: string | number) => {
    setStaffList(staffList.map(staff =>
      staff.id === id ? { ...staff, [field]: value } : staff
    ));
  };

  const toggleStaffCollapse = (id: string) => {
    setStaffList(staffList.map(staff =>
      staff.id === id ? { ...staff, collapsed: !staff.collapsed } : staff
    ));
  };

  const isStaffValid = (staff: { id: string; name: string; phone: string; role: string; description: string; specialty?: string }) => {
    const hasRequiredFields = staff.name.trim() !== "" && staff.phone.trim() !== "" && staff.role.trim() !== "" && staff.description.trim() !== "" && staff.specialty?.trim() !== "";
    const isDuplicateName = staffList.some(s => s.id !== staff.id && s.name.trim() === staff.name.trim());
    return hasRequiredFields && !isDuplicateName;
  };

  const handleStaffSave = async () => {
    setStaffSaving(true);
    setStaffSaveSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if settings record exists for this user
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      let error;
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('settings')
          .update({ employee_settings: staffList })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('settings')
          .insert({ user_id: user.id, employee_settings: staffList });
        error = result.error;
      }

      if (error) throw error;

      // Collapse all staff cards after saving
      setStaffList(staffList.map(staff => ({ ...staff, collapsed: true })));

      setStaffSaveSuccess(true);
      setTimeout(() => setStaffSaveSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error saving staff data:", error);
      alert("儲存失敗：" + error.message);
    } finally {
      setStaffSaving(false);
    }
  };


  const handleBookingRulesSave = async () => {
    setBookingSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if settings record exists for this user
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      let error;
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('settings')
          .update({ booking_rules: bookingRules })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('settings')
          .insert({ user_id: user.id, booking_rules: bookingRules });
        error = result.error;
      }

      if (error) throw error;
      alert("預約規則儲存成功！");
    } catch (error: any) {
      console.error("Error saving booking rules:", error);
      alert("儲存失敗：" + error.message);
    } finally {
      setBookingSaving(false);
    }
  };

  const handleEmployeeSettingsSave = async () => {
    setEmployeeSettingsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // 排班重疊校驗（第四階段）
      const validation = validateEmployeeSchedules(employeeSettings);
      if (!validation.isValid) {
        const errorMessages = validation.errors.map(err => 
          `${err.employeeName} 的 ${err.day} 排班有重疊時段`
        ).join('\n');
        alert(`排班設定有誤：\n${errorMessages}`);
        return;
      }

      // Check if settings record exists for this user
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      let error;
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('settings')
          .update({ employee_settings: employeeSettings })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('settings')
          .insert({ user_id: user.id, employee_settings: employeeSettings });
        error = result.error;
      }

      if (error) throw error;
      alert("員工進階設定儲存成功！");
    } catch (error: any) {
      console.error("Error saving employee settings:", error);
      alert("儲存失敗：" + error.message);
    } finally {
      setEmployeeSettingsSaving(false);
    }
  };

  // Helper function to add a new employee
  const addEmployee = () => {
    const newEmployee: EmployeeAdvanceSettings = {
      id: Date.now().toString(),
      name: '新員工',
      concurrentServiceCount: 1,
      booking_horizon: 30,
      services: [],
      schedule: {
        mon: { isOpen: false, timeSlots: [] },
        tue: { isOpen: false, timeSlots: [] },
        wed: { isOpen: false, timeSlots: [] },
        thu: { isOpen: false, timeSlots: [] },
        fri: { isOpen: false, timeSlots: [] },
        sat: { isOpen: false, timeSlots: [] },
        sun: { isOpen: false, timeSlots: [] },
      }
    };
    setEmployeeSettings([...employeeSettings, newEmployee]);
  };

  // Helper function to remove an employee
  const removeEmployee = (id: string) => {
    setEmployeeSettings(employeeSettings.filter(emp => emp.id !== id));
  };

  // Helper function to update employee field
  const updateEmployeeField = (id: string, field: keyof EmployeeAdvanceSettings, value: any) => {
    setEmployeeSettings(employeeSettings.map(emp => 
      emp.id === id ? { ...emp, [field]: value } : emp
    ));
  };

  // Helper function to update employee schedule
  const updateEmployeeSchedule = (id: string, day: keyof EmployeeAdvanceSettings['schedule'], field: 'isOpen' | 'timeSlots', value: any) => {
    setEmployeeSettings(employeeSettings.map(emp => 
      emp.id === id ? { ...emp, schedule: { ...emp.schedule, [day]: { ...emp.schedule[day], [field]: value } } } : emp
    ));
  };

  // Helper function to add time slot
  const addTimeSlot = (employeeId: string, day: keyof EmployeeAdvanceSettings['schedule']) => {
    setEmployeeSettings(employeeSettings.map(emp => 
      emp.id === employeeId ? { ...emp, schedule: { ...emp.schedule, [day]: { ...emp.schedule[day], timeSlots: [...emp.schedule[day].timeSlots, { startTime: '09:00', endTime: '18:00' }] } } } : emp
    ));
  };

  // Helper function to remove time slot
  const removeTimeSlot = (employeeId: string, day: keyof EmployeeAdvanceSettings['schedule'], slotIndex: number) => {
    setEmployeeSettings(employeeSettings.map(emp => 
      emp.id === employeeId ? { ...emp, schedule: { ...emp.schedule, [day]: { ...emp.schedule[day], timeSlots: emp.schedule[day].timeSlots.filter((_, idx) => idx !== slotIndex) } } } : emp
    ));
  };

  // Helper function to update time slot
  const updateTimeSlot = (employeeId: string, day: keyof EmployeeAdvanceSettings['schedule'], slotIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setEmployeeSettings(employeeSettings.map(emp => 
      emp.id === employeeId ? { ...emp, schedule: { ...emp.schedule, [day]: { ...emp.schedule[day], timeSlots: emp.schedule[day].timeSlots.map((slot, idx) => idx === slotIndex ? { ...slot, [field]: value } : slot) } } } : emp
    ));
  };

  const addCategory = async () => {
    // Remove existing empty category if there is one
    if (editingCategoryId) {
      const existingCategory = categories.find(cat => cat.id === editingCategoryId);
      if (existingCategory && !existingCategory.name.trim()) {
        const newCategories = categories.filter(cat => cat.id !== editingCategoryId);
        setCategories(newCategories);
      }
    }

    const newId = Date.now().toString();
    const newCategories = [...categories, { id: newId, name: "" }];
    setCategories(newCategories);
    setEditingCategoryId(newId);
    setEditingCategoryName("");
  };

  const saveCategoryEdit = async (id: string) => {
    // Check for duplicate category name
    const duplicateName = categories.find(
      cat => cat.name === editingCategoryName && cat.id !== id
    );
    if (duplicateName) {
      setCategoryError("分類名稱已存在，請使用其他名稱");
      return;
    }

    setCategoryError("");
    const newCategories = categories.map(cat =>
      cat.id === id ? { ...cat, name: editingCategoryName } : cat
    );
    setCategories(newCategories);
    setEditingCategoryId(null);
    setEditingCategoryName("");

    // Save to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if settings record exists for this user
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id, service_settings')
        .eq('user_id', user.id)
        .single();

      const serviceSettings = {
        categories: newCategories,
        services: existingSettings?.service_settings?.services || []
      };

      let error;
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('settings')
          .update({ service_settings: serviceSettings })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('settings')
          .insert({ user_id: user.id, service_settings: serviceSettings });
        error = result.error;
      }

      if (error) console.error("Error saving category edit:", error);
    } catch (error) {
      console.error("Error saving category edit:", error);
    }
  };

  const removeCategory = async (id: string) => {
    const newCategories = categories.filter(cat => cat.id !== id);
    setCategories(newCategories);
    if (editingCategoryId === id) {
      setEditingCategoryId(null);
      setEditingCategoryName("");
    }

    // Save to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if settings record exists for this user
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id, service_settings')
        .eq('user_id', user.id)
        .single();

      const serviceSettings = {
        categories: newCategories,
        services: existingSettings?.service_settings?.services || []
      };

      let error;
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('settings')
          .update({ service_settings: serviceSettings })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('settings')
          .insert({ user_id: user.id, service_settings: serviceSettings });
        error = result.error;
      }

      if (error) console.error("Error removing category:", error);
    } catch (error) {
      console.error("Error removing category:", error);
    }
  };

  const startEditCategory = (id: string, name: string) => {
    // Remove existing empty category if there is one
    if (editingCategoryId) {
      const existingCategory = categories.find(cat => cat.id === editingCategoryId);
      if (existingCategory && !existingCategory.name.trim()) {
        const newCategories = categories.filter(cat => cat.id !== editingCategoryId);
        setCategories(newCategories);
      }
    }

    setEditingCategoryId(id);
    setEditingCategoryName(name);
  };

  const cancelCategoryEdit = () => {
    // If cancelling edit of a category with empty name, remove it
    if (editingCategoryId) {
      const category = categories.find(cat => cat.id === editingCategoryId);
      if (category && !category.name.trim()) {
        removeCategory(editingCategoryId);
        setEditingCategoryId(null);
        setEditingCategoryName("");
        return;
      }
    }
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  const handleCategoryDragStart = (index: number) => {
    setDraggedCategoryIndex(index);
  };

  const handleCategoryDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedCategoryIndex !== null && draggedCategoryIndex !== index) {
      const newCategories = [...categories];
      const draggedItem = newCategories[draggedCategoryIndex];
      newCategories.splice(draggedCategoryIndex, 1);
      newCategories.splice(index, 0, draggedItem);
      setCategories(newCategories);
      setDraggedCategoryIndex(index);
    }
  };

  const handleCategoryDragEnd = async () => {
    setDraggedCategoryIndex(null);
    // Save the reordered list to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if settings record exists for this user
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id, service_settings')
        .eq('user_id', user.id)
        .single();

      const serviceSettings = {
        categories: categories,
        services: existingSettings?.service_settings?.services || []
      };

      let error;
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('settings')
          .update({ service_settings: serviceSettings })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('settings')
          .insert({ user_id: user.id, service_settings: serviceSettings });
        error = result.error;
      }

      if (error) console.error("Error saving reordered categories:", error);
    } catch (error) {
      console.error("Error saving reordered categories:", error);
    }
  };

  const handleCategorySave = async () => {
    setCategorySaving(true);
    setCategorySaveSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      console.log("Saving categories to database:", categories);

      // Check if settings record exists for this user
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id, service_settings')
        .eq('user_id', user.id)
        .single();

      const serviceSettings = {
        categories: categories,
        services: existingSettings?.service_settings?.services || []
      };

      let error;
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('settings')
          .update({ service_settings: serviceSettings })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('settings')
          .insert({ user_id: user.id, service_settings: serviceSettings });
        error = result.error;
      }

      if (error) throw error;

      console.log("Categories saved successfully");

      setCategorySaveSuccess(true);
      setTimeout(() => setCategorySaveSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error saving categories:", error);
      setCategoryError("儲存失敗：" + error.message);
    } finally {
      setCategorySaving(false);
    }
  };

  const handleServiceSave = async () => {
    setServiceSaving(true);
    setServiceSaveSuccess(false);
    setServiceError("");

    try {
      // Check for duplicate service name
      const duplicateName = serviceItems.find(
        item => item.name === newService.name && item.id !== editingServiceId
      );
      if (duplicateName) {
        setServiceError("服務名稱已存在，請使用其他名稱");
        setServiceSaving(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      let updatedItems;

      if (editingServiceId) {
        // Update existing item
        updatedItems = serviceItems.map(item =>
          item.id === editingServiceId
            ? { ...item, name: newService.name, description: newService.description, price: newService.price, duration: newService.duration, category: newService.category }
            : item
        );
      } else {
        // Add new item
        const newItem = {
          id: Date.now().toString(),
          name: newService.name,
          description: newService.description,
          price: newService.price,
          duration: newService.duration,
          category: newService.category
        };
        updatedItems = [...serviceItems, newItem];
      }

      console.log("Saving services to database:", updatedItems);

      // Check if settings record exists for this user
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('user_id, service_settings')
        .eq('user_id', user.id)
        .single();

      const serviceSettings = {
        categories: existingSettings?.service_settings?.categories || [],
        services: updatedItems
      };

      let error;
      if (existingSettings) {
        // Update existing record
        const result = await supabase
          .from('settings')
          .update({ service_settings: serviceSettings })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('settings')
          .insert({ user_id: user.id, service_settings: serviceSettings });
        error = result.error;
      }

      if (error) throw error;

      console.log("Services saved successfully");

      // Update local state
      setServiceItems(updatedItems);
      setShowAddServiceForm(false);
      setNewService({ name: "", description: "", price: 0, duration: 30, category: "" });
      setEditingServiceId(null);
      setServiceSaveSuccess(true);
      setTimeout(() => setServiceSaveSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error saving service item:", error);
      setServiceError("儲存失敗：" + error.message);
    } finally {
      setServiceSaving(false);
    }
  };

  const handleEditService = (id: string) => {
    const item = serviceItems.find(i => i.id === id);
    if (item) {
      setEditingServiceId(id);
      setNewService({
        name: item.name,
        description: item.description,
        price: item.price,
        duration: item.duration,
        category: item.category
      });
      setShowAddServiceForm(true);
      setServiceDropdownId(null);
    }
  };

  const handleCopyService = async (id: string) => {
    const item = serviceItems.find(i => i.id === id);
    if (item) {
      const newItem = {
        id: Date.now().toString(),
        name: `${item.name} (複製)`,
        description: item.description,
        price: item.price,
        duration: item.duration,
        category: item.category
      };
      const updatedItems = [...serviceItems, newItem];
      setServiceItems(updatedItems);

      // Save to database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from('users')
          .update({
            services: updatedItems
          })
          .eq('id', user.id);

        if (error) console.error("Error copying service:", error);
      } catch (error) {
        console.error("Error copying service:", error);
      }

      setServiceDropdownId(null);
    }
  };

  const handleServiceDragStart = (index: number) => {
    setDraggedServiceIndex(index);
  };

  const handleServiceDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedServiceIndex !== null && draggedServiceIndex !== index) {
      const newItems = [...serviceItems];
      const draggedItem = newItems[draggedServiceIndex];
      newItems.splice(draggedServiceIndex, 1);
      newItems.splice(index, 0, draggedItem);
      setServiceItems(newItems);
      setDraggedServiceIndex(index);
    }
  };

  const handleServiceDragEnd = async () => {
    setDraggedServiceIndex(null);
    // Save the reordered list to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({
          services: serviceItems
        })
        .eq('id', user.id);

      if (error) console.error("Error saving reordered services:", error);
    } catch (error) {
      console.error("Error saving reordered services:", error);
    }
  };

  const handleUsernameChange = async () => {
    setUsernameSaving(true);
    setUsernameError(null);
    setUsernameSaveSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: usernameForm.currentPassword,
      });

      if (signInError) {
        setUsernameError("密碼錯誤");
        return;
      }

      // Check if username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', usernameForm.newUsername)
        .single();

      if (existingUser && existingUser.id !== user.id) {
        setUsernameError("此用戶名已被使用");
        return;
      }

      // Update username in users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ username: usernameForm.newUsername })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUsernameSaveSuccess(true);
      setUsernameForm(prev => ({ ...prev, newUsername: "", currentPassword: "" }));
      setTimeout(() => setUsernameSaveSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error changing username:", error);
      setUsernameError("修改失敗：" + error.message);
    } finally {
      setUsernameSaving(false);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength <= 2) return { label: '弱', color: 'bg-red-500' };
    if (strength <= 4) return { label: '中', color: 'bg-yellow-500' };
    return { label: '強', color: 'bg-green-500' };
  };

  const handlePasswordChange = async () => {
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSaveSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError("新密碼與確認密碼不符");
        return;
      }

      // Verify old password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: passwordForm.oldPassword,
      });

      if (signInError) {
        setPasswordError("舊密碼錯誤");
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (updateError) throw updateError;

      setPasswordSaveSuccess(true);
      setPasswordForm(prev => ({ ...prev, oldPassword: "", newPassword: "", confirmPassword: "" }));
      setTimeout(() => setPasswordSaveSuccess(false), 2000);
    } catch (error: any) {
      console.error("Error changing password:", error);
      setPasswordError("修改失敗：" + error.message);
    } finally {
      setPasswordSaving(false);
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
    { id: 'account' as MainTabType, label: '帳號設定', icon: User },
    { id: 'basic' as MainTabType, label: '基本設定', icon: Store },
    { id: 'third_party' as MainTabType, label: '第三方服務設定', icon: ExternalLink },
    { id: 'ai' as MainTabType, label: '人工智慧設定', icon: Bot },
    { id: 'other' as MainTabType, label: '其他', icon: MoreHorizontal },
  ];

  const subTabsConfig: Record<MainTabType, { id: SubTabType, label: string, icon: any }[]> = {
    account: [],
    basic: [
      { id: 'store' as SubTabType, label: '店家設定', icon: Store },
      { id: 'staff' as SubTabType, label: '員工設定', icon: User },
      { id: 'services' as SubTabType, label: '服務設定', icon: Package },
      { id: 'booking_settings' as SubTabType, label: '預約設定', icon: CalendarClock },
    ],
    third_party: [
      { id: 'line' as SubTabType, label: 'LINE設定', icon: Key },
    ],
    ai: [
      { id: 'ai_agent' as SubTabType, label: 'AI客服設定', icon: Bot },
    ],
    other: [
      { id: 'notification' as SubTabType, label: '通知', icon: Bell },
      { id: 'manual' as SubTabType, label: '教學', icon: BookOpen },
      { id: 'support' as SubTabType, label: '客服', icon: Headphones },
    ],
  };

  const handleMainTabChange = (tabId: MainTabType) => {
    const subTabs = subTabsConfig[tabId];
    if (subTabs.length === 0) {
      // If no sub-tabs, directly activate this tab
      setActiveMainTab(tabId);
      setExpandedMainTab(null);
    } else {
      // If has sub-tabs, expand/collapse dropdown
      setExpandedMainTab(expandedMainTab === tabId ? null : tabId);
    }
  };

  const handleSubTabClick = (tabId: SubTabType, mainTabId: MainTabType, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    // Remove empty category if switching away from service settings
    if (editingCategoryId) {
      const existingCategory = categories.find(cat => cat.id === editingCategoryId);
      if (existingCategory && !existingCategory.name.trim()) {
        const newCategories = categories.filter(cat => cat.id !== editingCategoryId);
        setCategories(newCategories);
        setEditingCategoryId(null);
        setEditingCategoryName("");
      }
    }

    setActiveMainTab(mainTabId);
    setActiveSubTab(tabId);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">設定</h1>

      {/* Main Tabs */}
      <div className="bg-white rounded-t-xl shadow-sm border border-gray-100 border-b-0 p-2 flex gap-2 overflow-visible">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isExpanded = expandedMainTab === tab.id;
          const subTabs = subTabsConfig[tab.id];
          return (
            <div key={tab.id} className="relative" ref={(el) => { tabRefs.current[tab.id] = el; }}>
              <button
                onClick={() => handleMainTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeMainTab === tab.id
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {subTabs.length > 0 && (
                  <svg
                    className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              {/* Sub Tabs Dropdown */}
              {isExpanded && subTabs.length > 0 && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-2 min-w-[200px] z-10">
                  {subTabs.map((subTab) => {
                    const SubIcon = subTab.icon;
                    return (
                      <button
                        key={subTab.id}
                        onClick={(e) => handleSubTabClick(subTab.id, tab.id, e)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors whitespace-nowrap ${
                          activeSubTab === subTab.id
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
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
      <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 border-t-0 p-6">
        {activeMainTab === 'account' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">帳戶設定</h3>
            </div>

            {/* Change Username */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4">修改用戶名</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">目前用戶名</label>
                  <div className="text-gray-700 px-4 py-2 bg-white border border-gray-300 rounded-lg">
                    {currentUsername}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">新用戶名</label>
                  <input
                    type="text"
                    value={usernameForm.newUsername}
                    onChange={(e) => setUsernameForm(prev => ({ ...prev, newUsername: e.target.value }))}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900"
                    placeholder="請輸入新用戶名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">當前密碼</label>
                  <input
                    type="password"
                    value={usernameForm.currentPassword}
                    onChange={(e) => setUsernameForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900"
                    placeholder="請輸入當前密碼以驗證"
                  />
                </div>
                {usernameError && (
                  <div className="text-red-600 text-sm">{usernameError}</div>
                )}
                <button
                  onClick={handleUsernameChange}
                  disabled={usernameSaving || !usernameForm.newUsername || !usernameForm.currentPassword}
                  className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                >
                  {usernameSaving ? '修改中...' : usernameSaveSuccess ? <><Check className="w-4 h-4" />已修改</> : <><Save className="w-4 h-4" />修改用戶名</>}
                </button>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-4">更改密碼</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">舊密碼</label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                      className="block w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900"
                      placeholder="請輸入舊密碼"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">新密碼</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="block w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900"
                      placeholder="請輸入新密碼"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordForm.newPassword && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${getPasswordStrengthLabel(calculatePasswordStrength(passwordForm.newPassword)).color}`}
                            style={{ width: `${(calculatePasswordStrength(passwordForm.newPassword) / 6) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{getPasswordStrengthLabel(calculatePasswordStrength(passwordForm.newPassword)).label}</span>
                      </div>
                      <div className="space-y-1">
                        <div className={`flex items-center gap-2 text-xs ${passwordForm.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{passwordForm.newPassword.length >= 8 ? '✓' : '○'}</span>
                          <span>至少 8 個字元</span>
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${/[A-Z]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{/[A-Z]/.test(passwordForm.newPassword) ? '✓' : '○'}</span>
                          <span>至少 1 個大寫字母</span>
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${/[a-z]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{/[a-z]/.test(passwordForm.newPassword) ? '✓' : '○'}</span>
                          <span>至少 1 個小寫字母</span>
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${/[0-9]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{/[0-9]/.test(passwordForm.newPassword) ? '✓' : '○'}</span>
                          <span>至少 1 個數字</span>
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${/[^a-zA-Z0-9]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                          <span>{/[^a-zA-Z0-9]/.test(passwordForm.newPassword) ? '✓' : '○'}</span>
                          <span>至少 1 個特殊字元</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">確認新密碼</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="block w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-black focus:border-black text-gray-900"
                      placeholder="請再次輸入新密碼"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {passwordError && (
                  <div className="text-red-600 text-sm">{passwordError}</div>
                )}
                <button
                  onClick={handlePasswordChange}
                  disabled={passwordSaving || !passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                >
                  {passwordSaving ? '修改中...' : passwordSaveSuccess ? <><Check className="w-4 h-4" />已修改</> : <><Save className="w-4 h-4" />更改密碼</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeMainTab === 'third_party' && activeSubTab === 'line' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Key className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">LINE設定</h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Collapsible steps with video placeholders */}
              <div className="space-y-3">
                {/* Step 1 */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedLineStep(expandedLineStep === 1 ? null : 1)}
                    className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                    <span className="font-medium text-gray-900 text-sm">新增 Messaging API Channel</span>
                    <svg
                      className={`ml-auto w-4 h-4 text-gray-500 transition-transform ${expandedLineStep === 1 ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedLineStep === 1 && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
                        <div className="text-center text-gray-500">
                          <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">影片教學</p>
                          <p className="text-xs mt-1">（待加入影片）</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p>1. 用管理員帳號登入 LINE Developers console 並選擇 LINE 官方帳號的提供者。</p>
                        <p>2. 點擊「Create a Messaging API channel」。</p>
                        <p>3. 點擊「Create a LINE Official Account」以開啟一個外部網站。</p>
                        <p>4. 用您的 LINE 或商業帳號登入，填寫必要資訊後，點擊「Confirm and Complete」。</p>
                        <p>5. 如果跳出提示要申請已驗證的帳號，請選擇「Proceed later」。</p>
                        <p>6. 點擊「Go to LINE Official Account Manager」並同意政策聲明。</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2 */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedLineStep(expandedLineStep === 2 ? null : 2)}
                    className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                    <span className="font-medium text-gray-900 text-sm">啟用 Messaging API</span>
                    <svg
                      className={`ml-auto w-4 h-4 text-gray-500 transition-transform ${expandedLineStep === 2 ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedLineStep === 2 && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
                        <div className="text-center text-gray-500">
                          <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">影片教學</p>
                          <p className="text-xs mt-1">（待加入影片）</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p>1. 在 LINE Developers console 中選擇您建立的 Messaging API channel。</p>
                        <p>2. 點擊「Messaging API」標籤。</p>
                        <p>3. 確認「Use messaging API」開關已開啟。</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 3 */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedLineStep(expandedLineStep === 3 ? null : 3)}
                    className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                    <span className="font-medium text-gray-900 text-sm">取得 Channel Access Token</span>
                    <svg
                      className={`ml-auto w-4 h-4 text-gray-500 transition-transform ${expandedLineStep === 3 ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedLineStep === 3 && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
                        <div className="text-center text-gray-500">
                          <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">影片教學</p>
                          <p className="text-xs mt-1">（待加入影片）</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-700 mb-4">
                        <p>1. 在 LINE Developers console 中選擇您建立的 Messaging API channel。</p>
                        <p>2. 點擊「Messaging API」標籤。</p>
                        <p>3. 在「Channel access token」區域點擊「Issue」。</p>
                        <p>4. 複製生成的 Channel Access Token。</p>
                      </div>
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
                        <button
                          onClick={handleLineSave}
                          disabled={lineSaving || lineValidating || (Boolean(lineConfig.lineApiKey) && Boolean(lineConfig.lineSecret) && lineValidationStatus !== 'valid')}
                          className="mt-3 flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                        >
                          {lineSaving ? '儲存中...' : lineSaveSuccess ? '已儲存' : <><Save className="w-4 h-4" />儲存變更</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 4 */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedLineStep(expandedLineStep === 4 ? null : 4)}
                    className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
                    <span className="font-medium text-gray-900 text-sm">取得 Channel Secret</span>
                    <svg
                      className={`ml-auto w-4 h-4 text-gray-500 transition-transform ${expandedLineStep === 4 ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedLineStep === 4 && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
                        <div className="text-center text-gray-500">
                          <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">影片教學</p>
                          <p className="text-xs mt-1">（待加入影片）</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-700 mb-4">
                        <p>1. 在 LINE Developers console 中選擇您建立的 Messaging API channel。</p>
                        <p>2. 點擊「Basic settings」標籤。</p>
                        <p>3. 在「Channel Secret」區域複製您的 Channel Secret。</p>
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
                        <button
                          onClick={handleLineSave}
                          disabled={lineSaving || lineValidating || (Boolean(lineConfig.lineApiKey) && Boolean(lineConfig.lineSecret) && lineValidationStatus !== 'valid')}
                          className="mt-3 flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                        >
                          {lineSaving ? '儲存中...' : lineSaveSuccess ? '已儲存' : <><Save className="w-4 h-4" />儲存變更</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 5 */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedLineStep(expandedLineStep === 5 ? null : 5)}
                    className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">5</div>
                    <span className="font-medium text-gray-900 text-sm">設定 Webhook URL</span>
                    <svg
                      className={`ml-auto w-4 h-4 text-gray-500 transition-transform ${expandedLineStep === 5 ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedLineStep === 5 && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mb-4">
                        <div className="text-center text-gray-500">
                          <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">影片教學</p>
                          <p className="text-xs mt-1">（待加入影片）</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-700 mb-4">
                        <p>1. 在 LINE Developers console 中選擇您建立的 Messaging API channel。</p>
                        <p>2. 點擊「Messaging API」標籤。</p>
                        <p>3. 在「Webhook URL」欄位輸入下方的 Webhook URL。</p>
                        <p>4. 點擊「Verify」按鈕驗證 URL。</p>
                        <p>5. 確認「Use webhook」開關已開啟。</p>
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
                    </div>
                  )}
                </div>
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
              <h3 className="font-bold text-lg text-gray-900">店家設定</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">店家名稱 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={storeConfig.storeName}
                  onChange={(e) => setStoreConfig(prev => ({ ...prev, storeName: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  placeholder="請輸入店名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">店家類型 <span className="text-red-500">*</span></label>
                <select
                  value={storeConfig.storeType}
                  onChange={(e) => setStoreConfig(prev => ({ ...prev, storeType: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                >
                  <option value="">請選擇店家類型</option>
                  <option value="美甲">美甲</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">店家簡介 <span className="text-red-500">*</span></label>
                <textarea
                  value={storeConfig.storeDescription}
                  onChange={(e) => setStoreConfig(prev => ({ ...prev, storeDescription: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-none"
                  placeholder="請輸入店家簡介"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">店家電話 <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={storeConfig.phone}
                  onChange={(e) => setStoreConfig(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  placeholder="請輸入店家電話"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">店家地址 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={storeConfig.address}
                  onChange={(e) => setStoreConfig(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  placeholder="請輸入店家地址"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">店家 Google Map 連結</label>
                <input
                  type="url"
                  value={storeConfig.googleMapLink}
                  onChange={(e) => setStoreConfig(prev => ({ ...prev, googleMapLink: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  placeholder="請輸入店家Google Map連結"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">店家位置圖片</label>
                <div className="space-y-3">
                  <div
                    onClick={() => !storeConfig.storeLocationImage && document.getElementById('storeLocationImageInput')?.click()}
                    className={`relative cursor-pointer border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${storeConfig.storeLocationImage ? 'border-solid border-gray-200 p-0 inline-block' : 'p-12 hover:border-gray-400 transition-colors'}`}
                  >
                    {storeConfig.storeLocationImage ? (
                      <>
                        <img
                          src={storeConfig.storeLocationImage}
                          alt="店家位置"
                          className="max-w-sm rounded-lg"
                          style={{ maxHeight: '250px' }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStoreConfig(prev => ({ ...prev, storeLocationImage: '' }));
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center">
                        <Plus className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">點擊上傳圖片</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="storeLocationImageInput"
                    type="file"
                    accept="image/*"
                    onChange={handleStoreImageUpload}
                    disabled={storeUploading}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleStoreSave}
                  disabled={storeSaving || !storeConfig.storeName.trim() || !storeConfig.storeType || !storeConfig.storeDescription.trim() || !storeConfig.phone.trim() || !storeConfig.address.trim()}
                  className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {storeSaving ? '儲存中...' : storeSaveSuccess ? <><Check className="w-4 h-4" />已儲存</> : <><Save className="w-4 h-4" />儲存</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeMainTab === 'basic' && activeSubTab === 'staff' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">員工設定</h3>
            </div>
            <div className="space-y-4">
              {staffList.length === 0 ? (
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <p className="text-gray-600">尚未新增員工</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {staffList.map((staff, index) => (
                    <div key={staff.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      {staff.collapsed ? (
                        // Collapsed view
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full border-2"
                              style={{ backgroundColor: staff.color, borderColor: 'black' }}
                            />
                            <div>
                              <h4 className="font-medium text-gray-900">{staff.name || "未命名員工"}</h4>
                              <p className="text-sm text-gray-600">{staff.role || "未填寫職位"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleStaffCollapse(staff.id)}
                              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                              title="展開"
                            >
                              <Pen className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeStaff(staff.id)}
                              className="p-2 text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Expanded view
                        <div className="p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-gray-900">{staff.name || "未命名員工"}</h4>
                            <button
                              onClick={() => removeStaff(staff.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">姓名 <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                value={staff.name}
                                onChange={(e) => updateStaff(staff.id, 'name', e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors ${staff.name.trim() !== "" && staffList.some(s => s.id !== staff.id && s.name.trim() === staff.name.trim()) ? "border-red-500" : "border-gray-300"}`}
                                placeholder="請輸入姓名"
                              />
                              {staff.name.trim() !== "" && staffList.some(s => s.id !== staff.id && s.name.trim() === staff.name.trim()) && (
                                <p className="text-red-500 text-xs mt-1">此員工姓名已存在</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">電話 <span className="text-red-500">*</span></label>
                              <input
                                type="tel"
                                value={staff.phone}
                                onChange={(e) => updateStaff(staff.id, 'phone', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                                placeholder="請輸入電話"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">職位 <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                value={staff.role}
                                onChange={(e) => updateStaff(staff.id, 'role', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                                placeholder="請輸入職位"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-1">同時服務數量</label>
                              <input
                                type="number"
                                min="1"
                                max="99"
                                value={staff.concurrentServiceCount}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 1;
                                  const clampedValue = Math.min(99, Math.max(1, value));
                                  updateStaff(staff.id, 'concurrentServiceCount', clampedValue);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                                placeholder="1-99"
                              />
                              <p className="text-xs text-gray-500 mt-1">範圍：1-99</p>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-900 mb-1">人員介紹 <span className="text-red-500">*</span></label>
                              <textarea
                                value={staff.description}
                                onChange={(e) => updateStaff(staff.id, 'description', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors resize-none"
                                placeholder="請輸入人員介紹"
                                rows={3}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-900 mb-1">專長 <span className="text-red-500">*</span></label>
                              <textarea
                                value={staff.specialty || ''}
                                onChange={(e) => updateStaff(staff.id, 'specialty', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors resize-none"
                                placeholder="請輸入擅長的項目（如：日式美甲、法式美甲、光療等）"
                                rows={2}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-900 mb-2">自訂人員顏色</label>
                              <div className="grid grid-cols-12 gap-x-0 gap-y-3">
                                {colorOptions.map((color) => (
                                  <button
                                    key={color}
                                    onClick={() => updateStaff(staff.id, 'color', color)}
                                    className="relative w-6 h-6 rounded-full border-2 transition-all hover:border-gray-400"
                                    style={{ backgroundColor: color, borderColor: staff.color === color ? 'black' : 'transparent' }}
                                    title={color}
                                  >
                                    {staff.color === color && (
                                      <Check className="absolute inset-0 m-auto w-3 h-3 text-white" strokeWidth={3} />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={handleStaffSave}
                              disabled={staffSaving || !isStaffValid(staff)}
                              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                            >
                              {staffSaving ? '儲存中...' : staffSaveSuccess ? <><Check className="w-4 h-4" />已儲存</> : <><Save className="w-4 h-4" />儲存</>}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={addStaff}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-black hover:text-black transition-colors"
              >
                <Plus className="w-4 h-4" />
                新增員工
              </button>
              {deleteStaffId && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 backdrop-blur-sm">
                  <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">確認刪除</h3>
                    <p className="text-gray-600 mb-6">確定要刪除此員工嗎？此操作無法復原。</p>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={cancelDeleteStaff}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={confirmDeleteStaff}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        確認刪除
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeMainTab === 'basic' && activeSubTab === 'services' && (
          <div className="space-y-6">
            {!showCategoryView ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-black mr-2" />
                      <h3 className="font-bold text-lg text-gray-900">服務設定</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                      >
                        <option value="">所有分類</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCategoryView(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    <Pen className="w-4 h-4" />
                    編輯分類
                  </button>
                </div>

                <div>
                  {/* Add Service Item Form */}
                  <div className="bg-white border border-gray-200 rounded-t-lg p-6">
                    {!showAddServiceForm ? (
                      <button
                        onClick={() => setShowAddServiceForm(true)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        新增服務項目
                      </button>
                    ) : (
                      <div className="space-y-4">
                        {serviceError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                            {serviceError}
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">服務名稱 <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={newService.name}
                            onChange={(e) => {
                              setNewService({ ...newService, name: e.target.value });
                              setServiceError("");
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                            placeholder="請輸入服務名稱"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">服務描述 <span className="text-red-500">*</span></label>
                          <textarea
                            value={newService.description}
                            onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors resize-none"
                            placeholder="請輸入服務描述"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">價格 (NT$) <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            min="0"
                            value={newService.price}
                            onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                            placeholder="請輸入價格"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">時長 (分鐘) <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            min="1"
                            value={newService.duration}
                            onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) || 1 })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                            placeholder="請輸入時長"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-1">分類</label>
                          <select
                            value={newService.category}
                            onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                          >
                            <option value="">選擇分類</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setShowAddServiceForm(false);
                              setEditingServiceId(null);
                              setNewService({ name: "", description: "", price: 0, duration: 30, category: "" });
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleServiceSave}
                            disabled={!newService.name || !newService.description || newService.price <= 0 || newService.duration <= 0}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            {serviceSaving ? '儲存中...' : serviceSaveSuccess ? <><Check className="w-4 h-4" />已儲存</> : <><Save className="w-4 h-4" />儲存</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Service Items List */}
                  {serviceItems.length > 0 && (
                    <div className="bg-white border-t border-gray-200 rounded-b-lg p-6">
                      <h4 className="font-bold text-gray-900 mb-4">服務項目列表</h4>
                      <div className="space-y-3">
                        {serviceItems
                          .filter(item => !selectedCategoryFilter || item.category === selectedCategoryFilter)
                          .map((item, index) => (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={() => handleServiceDragStart(index)}
                              onDragOver={(e) => handleServiceDragOver(e, index)}
                              onDragEnd={handleServiceDragEnd}
                              className={`border border-gray-200 rounded-lg p-4 cursor-move ${draggedServiceIndex === index ? 'opacity-50' : ''}`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-medium text-gray-900">{item.name}</h5>
                                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                                    <span>價格：NT$ {item.price}</span>
                                    <span>時長：{item.duration} 分鐘</span>
                                    {item.category && (
                                      <span>分類：{categories.find(c => c.id === item.category)?.name || '未分類'}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1 relative">
                                  <button
                                    onClick={() => setServiceDropdownId(serviceDropdownId === item.id ? null : item.id)}
                                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                                  >
                                    <Pen className="w-4 h-4" />
                                  </button>
                                  {serviceDropdownId === item.id && (
                                    <div ref={serviceDropdownRef} className="absolute right-8 top-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[100px]">
                                      <button
                                        onClick={() => handleEditService(item.id)}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                      >
                                        <Pen className="w-4 h-4" />
                                        編輯
                                      </button>
                                      <button
                                        onClick={() => handleCopyService(item.id)}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                      >
                                        <Copy className="w-4 h-4" />
                                        複製
                                      </button>
                                    </div>
                                  )}
                                  <button
                                    onClick={async () => {
                                      const updatedItems = serviceItems.filter(i => i.id !== item.id);
                                      setServiceItems(updatedItems);
                                      // Save to database
                                      try {
                                        const { data: { user } } = await supabase.auth.getUser();
                                        if (!user) return;

                                        // 服務同步邏輯（第二階段）：從所有技師的 services 陣列中移除該服務 ID
                                        const updatedEmployeeSettings = removeServiceFromEmployees(employeeSettings, item.id);
                                        setEmployeeSettings(updatedEmployeeSettings);

                                        // 更新 users 表的 services
                                        const { error: serviceError } = await supabase
                                          .from('users')
                                          .update({
                                            services: updatedItems
                                          })
                                          .eq('id', user.id);

                                        // 更新 settings 表的 employee_settings
                                        const { data: existingSettings } = await supabase
                                          .from('settings')
                                          .select('user_id')
                                          .eq('user_id', user.id)
                                          .single();

                                        let employeeError;
                                        if (existingSettings) {
                                          const result = await supabase
                                            .from('settings')
                                            .update({ employee_settings: updatedEmployeeSettings })
                                            .eq('user_id', user.id);
                                          employeeError = result.error;
                                        } else {
                                          const result = await supabase
                                            .from('settings')
                                            .insert({ user_id: user.id, employee_settings: updatedEmployeeSettings });
                                          employeeError = result.error;
                                        }

                                        if (serviceError) console.error("Error deleting service:", serviceError);
                                        if (employeeError) console.error("Error updating employee settings:", employeeError);
                                      } catch (error) {
                                        console.error("Error deleting service:", error);
                                      }
                                    }}
                                    className="p-2 text-red-500 hover:text-red-700 transition-colors"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Package className="w-5 h-5 text-black mr-2" />
                    <h3 className="font-bold text-lg text-gray-900">分類管理</h3>
                  </div>
                  <button
                    onClick={() => {
                      // Remove empty category if editing one
                      if (editingCategoryId) {
                        const category = categories.find(cat => cat.id === editingCategoryId);
                        if (category && !category.name.trim()) {
                          removeCategory(editingCategoryId);
                        }
                      }
                      setShowCategoryView(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    返回
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="space-y-3">
                    {categoryError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                        {categoryError}
                      </div>
                    )}
                    {categories.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">尚未新增分類</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {categories.map((category, index) => (
                          <div
                            key={category.id}
                            draggable
                            onDragStart={() => handleCategoryDragStart(index)}
                            onDragOver={(e) => handleCategoryDragOver(e, index)}
                            onDragEnd={handleCategoryDragEnd}
                            className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-move ${draggedCategoryIndex === index ? 'opacity-50' : ''}`}
                          >
                            {editingCategoryId === category.id ? (
                              <>
                                <div ref={categoryEditRef} className="flex items-center gap-3 flex-1">
                                  <input
                                    type="text"
                                    value={editingCategoryName}
                                    onChange={(e) => {
                                      setEditingCategoryName(e.target.value);
                                      setCategoryError("");
                                    }}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                                    placeholder="輸入分類名稱"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => saveCategoryEdit(category.id)}
                                    disabled={!editingCategoryName.trim()}
                                    className="p-2 text-green-600 hover:text-green-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                                  >
                                    <Check className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={cancelCategoryEdit}
                                    className="p-2 text-gray-600 hover:text-gray-700 transition-colors"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="flex-1 text-gray-900">{category.name || "未命名分類"}</span>
                                <button
                                  onClick={() => startEditCategory(category.id, category.name)}
                                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                  <Pen className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => removeCategory(category.id)}
                                  className="p-2 text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={addCategory}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-solid border-gray-300 rounded-lg text-gray-600 hover:border-black hover:text-black transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      新增分類
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeMainTab === 'basic' && activeSubTab === 'booking_settings' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">預約設定</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-gray-600">預約設定功能開發中...</p>
            </div>
          </div>
        )}

        {activeMainTab === 'other' && activeSubTab === 'notification' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Bell className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">通知</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{notification.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                      </div>
                      {!notification.read && (
                        <div className="ml-4">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeMainTab === 'other' && activeSubTab === 'support' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <Headphones className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">客服</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">聯絡我們</h4>
                  <p className="text-gray-600 mb-4">如果您有任何問題或需要協助，請透過以下方式聯絡我們：</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">L</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">LINE ID</p>
                      <p className="font-semibold text-gray-900">@436ejedc</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>服務時間：</strong>週一至週五 9:00-18:00
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeMainTab === 'other' && activeSubTab === 'manual' && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <BookOpen className="w-5 h-5 text-black mr-2" />
              <h3 className="font-bold text-lg text-gray-900">教學</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {/* Search Bar */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="搜尋教學內容..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none text-gray-900 transition-colors"
                />
              </div>

              {/* Tutorial Categories */}
              <div className="space-y-6">
                {/* Getting Started */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    快速開始
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">系統介紹</h5>
                      <p className="text-sm text-gray-600">了解數位店長系統的基本功能</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">5 分鐘</span>
                        <span className="text-xs text-green-600">已完成</span>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">建立店家資料</h5>
                      <p className="text-sm text-gray-600">設定您的店家基本資訊</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">8 分鐘</span>
                        <span className="text-xs text-gray-400">未開始</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Staff Management */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    員工管理
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">新增員工</h5>
                      <p className="text-sm text-gray-600">如何新增和管理員工資料</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">6 分鐘</span>
                        <span className="text-xs text-gray-400">未開始</span>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">員工排班</h5>
                      <p className="text-sm text-gray-600">設定員工的工作時間</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">10 分鐘</span>
                        <span className="text-xs text-gray-400">未開始</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Management */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    服務管理
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">新增服務項目</h5>
                      <p className="text-sm text-gray-600">建立和管理您的服務項目</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">7 分鐘</span>
                        <span className="text-xs text-gray-400">未開始</span>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">服務分類</h5>
                      <p className="text-sm text-gray-600">組織和管理服務分類</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">5 分鐘</span>
                        <span className="text-xs text-gray-400">未開始</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Management */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    預約管理
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">接受預約</h5>
                      <p className="text-sm text-gray-600">如何處理和確認預約</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">8 分鐘</span>
                        <span className="text-xs text-gray-400">未開始</span>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">取消和改期</h5>
                      <p className="text-sm text-gray-600">處理預約的取消和改期</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">6 分鐘</span>
                        <span className="text-xs text-gray-400">未開始</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Features */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    進階功能
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">AI 客服設定</h5>
                      <p className="text-sm text-gray-600">設定 AI 客服自動回覆</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">12 分鐘</span>
                        <span className="text-xs text-gray-400">未開始</span>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-12 h-12 text-gray-400" />
                      </div>
                      <h5 className="font-medium text-gray-900 mb-1">LINE 整合</h5>
                      <p className="text-sm text-gray-600">整合 LINE 通知功能</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">15 分鐘</span>
                        <span className="text-xs text-gray-400">未開始</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
