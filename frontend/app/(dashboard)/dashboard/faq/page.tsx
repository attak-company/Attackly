"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, X } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCategory, setNewCategory] = useState("專業知識詢問");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const categories = ["專業知識詢問", "產品資訊詢問", "店家資料詢問"];

  const userId = "086965d1-4fb3-48e0-a560-643d049993d9"; // This should come from auth
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const categoryParam = selectedCategory === "全部" ? "" : `?category=${encodeURIComponent(selectedCategory)}`;
      const response = await fetch(`${baseUrl}/api/v1/faq/${userId}${categoryParam}`);
      if (!response.ok) throw new Error("Failed to fetch FAQs");
      const data = await response.json();
      setFaqs(data);
      setError(null);
    } catch (err) {
      setError("無法載入 FAQ 資料");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFAQs();
  }, [selectedCategory]);

  const handleAddFAQ = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      setError("請填寫問題和答案");
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/api/v1/faq/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: newQuestion,
          answer: newAnswer,
          category: newCategory,
        }),
      });

      if (!response.ok) throw new Error("Failed to add FAQ");

      setSuccess("FAQ 新增成功");
      setNewQuestion("");
      setNewAnswer("");
      setNewCategory("專業知識詢問");
      setIsAdding(false);
      fetchFAQs();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("新增 FAQ 失敗");
      console.error(err);
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!confirm("確定要刪除這個 FAQ 嗎？")) return;

    try {
      const response = await fetch(`${baseUrl}/api/v1/faq/${userId}?faq_id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete FAQ");

      setSuccess("FAQ 刪除成功");
      fetchFAQs();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("刪除 FAQ 失敗");
      console.error(err);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">知識庫管理</h1>
          <div className="flex items-center gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="全部">全部類別</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                新增 FAQ
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {isAdding && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">新增 FAQ</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  類別
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  問題
                </label>
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="輸入問題..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  答案
                </label>
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="輸入答案..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddFAQ}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  儲存
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewQuestion("");
                    setNewAnswer("");
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-700">載入中...</div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12 text-gray-700">
            <p>尚無 FAQ 資料</p>
            <p className="text-sm mt-2">點擊「新增 FAQ」開始建立知識庫</p>
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        {faq.category}
                      </span>
                      <h3 className="font-semibold text-lg">{faq.question}</h3>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{faq.answer}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteFAQ(faq.id)}
                    className="flex-shrink-0 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
