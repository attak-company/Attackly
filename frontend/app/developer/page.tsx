"use client";

import { useState } from "react";
import { Book, Key, Globe, AlertCircle, Info, Copy, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Developer() {
  const [activeSection, setActiveSection] = useState("authentication");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* 返回按鈕 */}
        <Link href="/" className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors duration-300 mb-8 group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-medium">返回官網</span>
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">開發者中心</h1>
          <p className="text-gray-400 text-lg">
            Digital Manager API 文件 - 數位店長整合方案
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Base URL: <code className="bg-gray-800 px-2 py-1 rounded text-red-400">https://api.digitalmanager.com/v1</code>
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="sticky top-24 bg-[#111] rounded-lg p-4 border border-gray-800">
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">導航</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveSection("authentication")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeSection === "authentication"
                        ? "bg-red-500 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <Key className="w-4 h-4 inline mr-2" />
                    認證指南
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveSection("api-reference")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeSection === "api-reference"
                        ? "bg-red-500 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <Book className="w-4 h-4 inline mr-2" />
                    API 參考文件
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveSection("webhooks")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeSection === "webhooks"
                        ? "bg-red-500 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <Globe className="w-4 h-4 inline mr-2" />
                    Webhooks
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3">
            {/* Authentication Section */}
            {activeSection === "authentication" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">認證指南</h2>
                  <p className="text-gray-400 mb-6">
                    所有 API 請求都需要在 HTTP Header 中包含您的 API Key 以進行身份驗證。
                  </p>

                  {/* Info Callout */}
                  <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-blue-400 font-bold mb-1">提示</h4>
                        <p className="text-gray-300 text-sm">
                          API Key 可以在您的 Dashboard 設定頁面中生成。請確保將其保存在安全的地方，不要在客戶端代碼中暴露。
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Authentication Code Block */}
                  <div className="bg-[#111] rounded-lg border border-gray-800 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-gray-800">
                      <span className="text-gray-400 text-sm">HTTP Header</span>
                      <button
                        onClick={() => copyToClipboard("Authorization: Bearer YOUR_API_KEY", "auth-header")}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {copiedCode === "auth-header" ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
                      <code>Authorization: Bearer YOUR_API_KEY</code>
                    </pre>
                  </div>

                  {/* Example Request */}
                  <div className="bg-[#111] rounded-lg border border-gray-800 overflow-hidden mt-4">
                    <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-gray-800">
                      <span className="text-gray-400 text-sm">Example Request (JavaScript)</span>
                      <button
                        onClick={() => copyToClipboard(`fetch('https://api.digitalmanager.com/v1/bookings', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})`, "example-request")}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {copiedCode === "example-request" ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
                      <code>{`fetch('https://api.digitalmanager.com/v1/bookings', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})`}</code>
                    </pre>
                  </div>
                </div>

                {/* Warning Callout */}
                <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-orange-400 font-bold mb-1">注意</h4>
                      <p className="text-gray-300 text-sm">
                        API Key 具有完整的系統訪問權限，請勿分享給他人。如果 API Key 不慎洩露，請立即在 Dashboard 中重新生成。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* API Reference Section */}
            {activeSection === "api-reference" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">API 參考文件</h2>
                  <p className="text-gray-400 mb-6">
                    Digital Manager API 提供完整的商戶資訊、預約管理、AI 對話紀錄等功能。
                  </p>

                  {/* Authentication Endpoints */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">認證端點 (Authentication)</h3>
                    <div className="space-y-4">
                      <div className="bg-[#111] rounded-lg border border-gray-800 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">POST</span>
                          <code className="text-gray-300 text-sm">/auth/check-username</code>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">檢查用戶名是否已被使用</p>
                        <div className="bg-[#0A0A0A] rounded p-3">
                          <pre className="text-xs text-gray-400 overflow-x-auto">
                            <code>{`{
  "username": "example_user"
}`}</code>
                          </pre>
                        </div>
                      </div>

                      <div className="bg-[#111] rounded-lg border border-gray-800 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">POST</span>
                          <code className="text-gray-300 text-sm">/auth/check-email</code>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">檢查電子郵件是否已被使用</p>
                        <div className="bg-[#0A0A0A] rounded p-3">
                          <pre className="text-xs text-gray-400 overflow-x-auto">
                            <code>{`{
  "email": "user@example.com"
}`}</code>
                          </pre>
                        </div>
                      </div>

                      <div className="bg-[#111] rounded-lg border border-gray-800 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">POST</span>
                          <code className="text-gray-300 text-sm">/auth/send-email-code</code>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">發送 Email 驗證碼</p>
                        <div className="bg-[#0A0A0A] rounded p-3">
                          <pre className="text-xs text-gray-400 overflow-x-auto">
                            <code>{`{
  "email": "user@example.com"
}`}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Endpoints */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">預約管理 (Booking)</h3>
                    <div className="space-y-4">
                      <div className="bg-[#111] rounded-lg border border-gray-800 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">GET</span>
                          <code className="text-gray-300 text-sm">/bookings</code>
                        </div>
                        <p className="text-gray-400 text-sm">獲取所有預約記錄</p>
                      </div>

                      <div className="bg-[#111] rounded-lg border border-gray-800 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">POST</span>
                          <code className="text-gray-300 text-sm">/bookings</code>
                        </div>
                        <p className="text-gray-400 text-sm">創建新預約</p>
                      </div>
                    </div>
                  </div>

                  {/* Chat Endpoints */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">AI 對話 (Chats)</h3>
                    <div className="space-y-4">
                      <div className="bg-[#111] rounded-lg border border-gray-800 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">GET</span>
                          <code className="text-gray-300 text-sm">/chats</code>
                        </div>
                        <p className="text-gray-400 text-sm">獲取 AI 對話紀錄</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Webhooks Section */}
            {activeSection === "webhooks" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Webhooks 串接</h2>
                  <p className="text-gray-400 mb-6">
                    Webhooks 允許您的應用程式在特定事件發生時接收即時通知。
                  </p>

                  {/* Info Callout */}
                  <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-blue-400 font-bold mb-1">提示</h4>
                        <p className="text-gray-300 text-sm">
                          Webhook 通知會以 POST 請求的形式發送到您設定的 URL，請確保您的伺服器可以處理這些請求。
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Events */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">可用事件</h3>
                    <div className="space-y-4">
                      <div className="bg-[#111] rounded-lg border border-gray-800 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">booking.created</span>
                        </div>
                        <p className="text-gray-400 text-sm">當新預約被創建時觸發</p>
                      </div>

                      <div className="bg-[#111] rounded-lg border border-gray-800 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">customer.first_visit</span>
                        </div>
                        <p className="text-gray-400 text-sm">當新客戶首次到訪時觸發</p>
                      </div>

                      <div className="bg-[#111] rounded-lg border border-gray-800 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">message.unanswered</span>
                        </div>
                        <p className="text-gray-400 text-sm">當 AI 無法回答問題時觸發</p>
                      </div>
                    </div>
                  </div>

                  {/* Security */}
                  <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-orange-400 font-bold mb-1">安全性</h4>
                        <p className="text-gray-300 text-sm">
                          所有 Webhook 請求都包含簽名驗證，請驗證請求的來源以確保安全性。建議使用 HTTPS 端點。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
