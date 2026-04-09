"use client";

import { useState } from "react";
import { Plus, Search, Upload, FileText, Trash2, Edit2 } from "lucide-react";

export default function FAQPage() {
  const [faqs, setFaqs] = useState([
    { id: 1, question: "預約取消政策？", answer: "需於 24 小時前告知，否則需收取 30% 手續費。" },
    { id: 2, question: "付款方式有哪些？", answer: "支援 現金、Line Pay、信用卡。" },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">FAQ 知識庫 (RAG)</h2>
          <p className="text-gray-500 mt-2">上傳資料讓 AI 學習您的業務內容，實現自動問答。</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4 mr-2" />
            批次上傳 (PDF/CSV)
          </button>
          <button className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            新增 FAQ
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b flex items-center bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜尋關鍵字..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {faqs.map((faq) => (
            <div key={faq.id} className="p-6 hover:bg-gray-50/50 transition-colors group">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="mt-1 p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{faq.question}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 text-gray-400 hover:text-black hover:bg-black/10 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex items-center">
        <div className="p-3 bg-blue-100 rounded-full mr-4">
          <BotIcon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h4 className="font-bold text-blue-900">AI 正在學習您的資料...</h4>
          <p className="text-sm text-blue-700">已有 12 條 FAQ 資料被整合進 AI 核心，目前的覆蓋率為 85%。</p>
        </div>
      </div>
    </div>
  );
}

function BotIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}
