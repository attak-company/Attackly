"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Phone, Mail, Calendar, DollarSign, AlertTriangle, Shield, TrendingUp, X, Clock, ArrowLeft, MessageCircle, User } from "lucide-react";
import { supabase } from "@/lib/bookingService";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  tags: string[];
  total_bookings: number;
  no_show_count: number;
  is_blacklisted: boolean;
  total_spending: number;
  created_at: string;
  manual_notes?: string | null;
}

interface Booking {
  id: string;
  customer_name: string;
  phone: string;
  service: string;
  time: string;
  date: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  source?: "phone" | "line" | "walkin" | "manual" | "AI_Chatbot" | "Hang_Ke";
  note?: string;
  ai_notes?: string;
  duration?: number;
  tags?: string[];
}

export default function MembersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [manualNotes, setManualNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const { toast } = useToast();

  // 獲取會員數據
  useEffect(() => {
    fetchCustomers();
  }, []);

  // 搜尋過濾 - 使用防抖
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) {
      return customers;
    }
    
    const term = searchTerm.toLowerCase();
    return customers.filter(customer =>
      customer.customer_name.toLowerCase().includes(term) ||
      customer.phone.includes(term)
    );
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 使用單一查詢獲取所有客戶資料，包含 last_purchase_at 欄位
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('last_purchase_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      setCustomers(customers || []);
    } catch (error) {
      console.error('獲取客戶列表失敗:', error);
      toast({
        title: "載入失敗",
        description: "無法載入客戶列表，請稍後再試"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBlacklist = async (customerId: string, currentStatus: boolean) => {
    // 樂觀更新：先更新本地狀態
    const newStatus = !currentStatus;
    setCustomers(customers.map(c =>
      c.id === customerId
        ? { ...c, is_blacklisted: newStatus }
        : c
    ));

    // 更新選中的客戶（如果正在查看詳情）
    if (selectedCustomer && selectedCustomer.id === customerId) {
      setSelectedCustomer({
        ...selectedCustomer,
        is_blacklisted: newStatus
      });
    }

    try {
      const { error } = await supabase
        .from('customers')
        .update({ is_blacklisted: newStatus })
        .eq('id', customerId);

      if (error) throw error;

      toast({
        title: !currentStatus ? "已加入黑名單" : "已移除黑名單",
        description: !currentStatus ? "該會員將無法進行預約" : "該會員可以正常預約"
      });
    } catch (error) {
      console.error('更新黑名單狀態失敗:', error);
      
      // 回滾本地狀態
      setCustomers(customers.map(c =>
        c.id === customerId
          ? { ...c, is_blacklisted: currentStatus }
          : c
      ));
      
      if (selectedCustomer && selectedCustomer.id === customerId) {
        setSelectedCustomer({
          ...selectedCustomer,
          is_blacklisted: currentStatus
        });
      }
      
      toast({
        title: "操作失敗",
        description: "無法更新黑名單狀態，請稍後再試"
      });
    }
  };

  const fetchCustomerBookings = async (customerPhone: string) => {
    setIsLoadingBookings(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const normalizedPhone = customerPhone.replace(/[^\d]/g, '');
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .eq('phone', normalizedPhone)
        .eq('is_deleted', false)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (error) throw error;
      setCustomerBookings(data || []);
    } catch (error) {
      console.error('獲取客戶預約紀錄失敗:', error);
      toast({
        title: "載入失敗",
        description: "無法載入客戶預約紀錄，請稍後再試"
      });
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    fetchCustomerBookings(customer.phone);
  };

  const handleCloseCustomerDetail = () => {
    setSelectedCustomer(null);
    setCustomerBookings([]);
    setIsEditingNotes(false);
    setManualNotes("");
  };

  const handleEditNotes = () => {
    setManualNotes(selectedCustomer?.manual_notes || "");
    setIsEditingNotes(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;

    setIsSavingNotes(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({ manual_notes: manualNotes })
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      // 更新本地狀態
      setSelectedCustomer({
        ...selectedCustomer,
        manual_notes: manualNotes
      });

      // 更新客戶列表中的數據
      setCustomers(customers.map(c =>
        c.id === selectedCustomer.id
          ? { ...c, manual_notes: manualNotes }
          : c
      ));

      toast({
        title: "備註已更新",
        description: "手動備註已成功保存"
      });

      setIsEditingNotes(false);
    } catch (error) {
      console.error('更新備註失敗:', error);
      toast({
        title: "更新失敗",
        description: "無法更新備註，請稍後再試"
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCancelEditNotes = () => {
    setIsEditingNotes(false);
    setManualNotes("");
  };

  const handleAddTag = async (tag: string) => {
    if (!selectedCustomer) return;

    const currentTags = selectedCustomer.tags || [];
    if (currentTags.includes(tag)) {
      toast({
        title: "標籤已存在",
        description: `「${tag}」標籤已經存在`
      });
      return;
    }

    // 樂觀更新：先更新本地狀態
    const newTags = [...currentTags, tag];
    const updatedCustomer = {
      ...selectedCustomer,
      tags: newTags
    };
    
    setSelectedCustomer(updatedCustomer);
    setCustomers(customers.map(c =>
      c.id === selectedCustomer.id
        ? updatedCustomer
        : c
    ));

    try {
      const { error } = await supabase
        .from('customers')
        .update({ tags: newTags })
        .eq('id', selectedCustomer.id);

      if (error) throw error;
      
      toast({
        title: "標籤已添加",
        description: `已添加「${tag}」標籤`
      });
    } catch (error) {
      console.error('添加標籤失敗:', error);
      
      // 回滾本地狀態
      setSelectedCustomer(selectedCustomer);
      setCustomers(customers.map(c =>
        c.id === selectedCustomer.id
          ? selectedCustomer
          : c
      ));
      
      toast({
        title: "添加失敗",
        description: "無法添加標籤，請稍後再試"
      });
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!selectedCustomer) return;

    try {
      const newTags = (selectedCustomer.tags || []).filter(tag => tag !== tagToRemove);
      const { error } = await supabase
        .from('customers')
        .update({ tags: newTags })
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      // 更新本地狀態
      const updatedCustomer = {
        ...selectedCustomer,
        tags: newTags
      };
      setSelectedCustomer(updatedCustomer);

      // 更新客戶列表中的數據
      setCustomers(customers.map(c =>
        c.id === selectedCustomer.id
          ? updatedCustomer
          : c
      ));
      
      toast({
        title: "標籤已移除",
        description: `已移除「${tagToRemove}」標籤`
      });
    } catch (error) {
      console.error('移除標籤失敗:', error);
      toast({
        title: "移除失敗",
        description: "無法移除標籤，請稍後再試"
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "無";
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatCurrency = (amount: number) => {
    return `NT$ ${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 頂部作戰列 */}
      <div className="px-8 py-8 border-b border-[#F4F4F5]">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A] tracking-tight">會員管理</h1>
            <p className="text-[#9CA3AF] mt-1 text-base">管理所有客戶資訊與黑名單設定</p>
          </div>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="px-8 py-6">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#F4F4F5] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-[#9CA3AF]">總會員數</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{customers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#F4F4F5] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-[#9CA3AF]">總消費金額</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">
                  {formatCurrency(customers.reduce((sum, c) => sum + (c.total_spending || 0), 0))}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-[#F4F4F5] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-[#9CA3AF]">總預約次數</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">
                  {customers.reduce((sum, c) => sum + (c.total_bookings || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-[#F4F4F5] rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-[#9CA3AF]">黑名單人數</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">
                  {customers.filter(c => c.is_blacklisted).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 搜尋區 */}
      <div className="px-8 py-4">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center gap-2 bg-[#F4F4F5] rounded-lg px-4 py-2.5 w-96">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋客戶姓名或手機號碼"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-0 outline-none text-sm w-full placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* 會員列表 */}
      <div className="px-8 pb-8">
        <div className="max-w-[1400px] mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                <p className="text-sm text-gray-500">載入中...</p>
              </div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 bg-[#F4F4F5] rounded-full flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-[#1A1A1A]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">沒有找到會員</h3>
              <p className="text-slate-400 text-sm">
                {searchTerm ? "請試試其他關鍵字" : "目前沒有會員資料"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className={`p-5 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all ${
                    customer.is_blacklisted
                      ? "border-2 border-red-500 bg-red-50/30"
                      : "border-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* 左側區域 */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#F4F4F5] rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-[#1A1A1A]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-[#1A1A1A]">{customer.customer_name}</h3>
                          {customer.is_blacklisted && (
                            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              黑名單
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 mt-0.5 text-sm">{customer.phone}</p>
                        {customer.email && (
                          <p className="text-slate-400 text-xs flex items-center gap-1 mt-1">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </p>
                        )}
                        {customer.tags && customer.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            {customer.tags.map((tag, index) => (
                              <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 中間區域 - 統計數據 */}
                    <div className="flex-1 px-8 flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-xs text-[#9CA3AF] mb-1">預約次數</p>
                        <p className="text-lg font-semibold text-[#1A1A1A]">{customer.total_bookings}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-[#9CA3AF] mb-1">總消費</p>
                        <p className="text-lg font-semibold text-[#1A1A1A]">{formatCurrency(customer.total_spending || 0)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-[#9CA3AF] mb-1">爽約次數</p>
                        <p className={`text-lg font-semibold ${customer.no_show_count > 0 ? 'text-red-500' : 'text-[#1A1A1A]'}`}>
                          {customer.no_show_count}
                        </p>
                      </div>
                    </div>

                    {/* 右側區域 - 操作按鈕 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewCustomer(customer)}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-[#1A1A1A] text-white hover:bg-black transition-colors"
                      >
                        查看詳情
                      </button>
                      <button
                        onClick={() => toggleBlacklist(customer.id, customer.is_blacklisted)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          customer.is_blacklisted
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                      >
                        {customer.is_blacklisted ? "移除黑名單" : "加入黑名單"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 客戶詳情 Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#F4F4F5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCloseCustomerDetail}
                  className="p-2 hover:bg-[#F4F4F5] rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-[#1A1A1A]">{selectedCustomer.customer_name}</h2>
                  <p className="text-sm text-[#9CA3AF]">{selectedCustomer.phone}</p>
                </div>
              </div>
              <button
                onClick={handleCloseCustomerDetail}
                className="p-2 hover:bg-[#F4F4F5] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#1A1A1A]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              {/* 客戶統計 */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-[#F4F4F5] rounded-xl p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">總消費</p>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(selectedCustomer.total_spending || 0)}</p>
                </div>
                <div className="bg-[#F4F4F5] rounded-xl p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">預約次數</p>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{selectedCustomer.total_bookings}</p>
                </div>
                <div className="bg-[#F4F4F5] rounded-xl p-4">
                  <p className="text-xs text-[#9CA3AF] mb-1">爽約次數</p>
                  <p className={`text-2xl font-bold ${selectedCustomer.no_show_count > 0 ? 'text-red-500' : 'text-[#1A1A1A]'}`}>
                    {selectedCustomer.no_show_count}
                  </p>
                </div>
              </div>

              {/* 快速貼標籤 */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">快速貼標籤</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['VIP', '難搞', '很久沒來', '老客戶', '新客戶'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className="px-3 py-1.5 text-sm bg-[#F4F4F5] hover:bg-[#E5E5E6] rounded-lg transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
                {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-black text-white rounded-lg"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-gray-300 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 備註區域 - 手動與 AI 備註分流 */}
              <div className="mb-6">
                {/* 手動備註 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                      手動備註
                    </h3>
                    {!isEditingNotes && (
                      <button
                        onClick={handleEditNotes}
                        className="text-sm text-[#1A1A1A] hover:text-gray-600 transition-colors"
                      >
                        編輯
                      </button>
                    )}
                  </div>
                  {isEditingNotes ? (
                    <div className="space-y-3">
                      <textarea
                        value={manualNotes}
                        onChange={(e) => setManualNotes(e.target.value)}
                        placeholder="記錄特殊需求（如：染劑過敏、偏好等）"
                        className="w-full p-3 border border-[#E5E5E6] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-black"
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveNotes}
                          disabled={isSavingNotes}
                          className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
                        >
                          {isSavingNotes ? "保存中..." : "保存"}
                        </button>
                        <button
                          onClick={handleCancelEditNotes}
                          className="px-4 py-2 bg-[#F4F4F5] text-[#1A1A1A] rounded-lg text-sm font-medium hover:bg-[#E5E5E6] transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl min-h-[80px] border border-gray-200">
                      {selectedCustomer.manual_notes ? (
                        <div>
                          <p className="text-xs text-gray-600 font-medium mb-2">店長記錄的客戶偏好</p>
                          <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{selectedCustomer.manual_notes}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">暫無手動備註</p>
                      )}
                    </div>
                  )}
                </div>

                {/* AI 備註 */}
                <div>
                  <h3 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2 mb-3">
                    <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                    AI 分析備註
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-xl min-h-[80px] border border-gray-200">
                    {customerBookings.some(b => b.ai_notes) ? (
                      <div>
                        <p className="text-xs text-gray-600 font-medium mb-2">系統分析的客戶行為模式</p>
                        <div className="space-y-2">
                          {customerBookings.filter(b => b.ai_notes).map((booking, index) => (
                            <div key={index} className="text-sm text-[#1A1A1A] p-2 bg-white rounded-lg border border-gray-100">
                              <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                                <MessageCircle className="w-3 h-3" />
                                <span>{booking.date} - {booking.service}</span>
                              </div>
                              <p>{booking.ai_notes}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">暫無 AI 分析備註</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 消費歷史紀錄 */}
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">消費歷史紀錄</h3>
                {isLoadingBookings ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                  </div>
                ) : customerBookings.length === 0 ? (
                  <div className="text-center py-8 text-[#9CA3AF]">
                    暫無消費紀錄
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="p-4 bg-[#F4F4F5] rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#1A1A1A]" />
                            <span className="font-semibold text-[#1A1A1A]">{booking.service}</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                            booking.status === 'no_show' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {booking.status === 'completed' ? '已完成' :
                             booking.status === 'cancelled' ? '已取消' :
                             booking.status === 'no_show' ? '爽約' :
                             booking.status === 'confirmed' ? '已確認' : '待處理'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#9CA3AF]">
                          <span>{booking.date}</span>
                          <span>{booking.time}</span>
                          {booking.duration && <span>{booking.duration}分鐘</span>}
                        </div>
                        {booking.ai_notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {booking.ai_notes}
                            </p>
                          </div>
                        )}
                        {booking.note && (
                          <div className="mt-2 text-sm text-[#9CA3AF]">
                            備註：{booking.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
