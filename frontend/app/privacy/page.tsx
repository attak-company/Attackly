import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-gray-300">
      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* 返回按鈕 */}
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8">
          <span className="mr-2">←</span> 返回首頁
        </Link>

        {/* 標題 */}
        <h1 className="text-4xl font-bold text-white mb-4">隱私權政策</h1>
        <p className="text-gray-500 text-sm mb-12">最後更新日期：2026 年 1 月</p>

        {/* 內容區塊 */}
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. 資料收集範圍</h2>
            <p className="leading-relaxed">
              Digital Manager（以下稱「我們」）會收集以下類型的資料，以提供 AI 數位店長服務：
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>LINE 訊息內容（用於 AI 理解並生成回覆）</li>
              <li>用戶 LINE ID（用於識別客戶身份）</li>
              <li>店家提供的知識庫資料（包含菜單、服務項目、營業時間等）</li>
              <li>預約排程資訊（用於管理訂單與提醒）</li>
              <li>我們僅存取您授權予 LINE 官方帳號之必要權限，不會存取您的個人 LINE 好友列表或私人通訊紀錄</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. 使用目的</h2>
            <p className="leading-relaxed">
              我們收集的資料僅用於以下目的：
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>AI 模型回覆生成（透過分析客戶問題提供適當回應）</li>
              <li>系統優化（改善 AI 模型的準確度與回應速度）</li>
              <li>預約排程管理（自動化處理客戶預約與提醒）</li>
              <li>客戶服務改進（分析互動數據以提升服務品質）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. 第三方服務與數據傳輸</h2>
            <p className="leading-relaxed mb-4">
              為提供 AI 服務，我們使用 Google Gemini API 進行自然語言處理。以下是相關說明：
            </p>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-3">Google Gemini API 數據傳輸</h3>
              <p className="leading-relaxed text-gray-400">
                您的資料會經過加密傳輸至 Google Gemini API 進行處理。我們承諾：
              </p>
              <ul className="list-disc list-inside mt-3 space-y-2 text-gray-400">
                <li>不會將您的資料轉售給任何第三方行銷公司</li>
                <li>所有傳輸過程均使用 HTTPS 加密協議</li>
                <li>Google Gemini API 不會將您的資料用於訓練其公開模型</li>
                <li>我們會定期審查第三方服務的隱私政策</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. 資料保留期限</h2>
            <p className="leading-relaxed">
              我們會根據以下原則保留您的資料：
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>訊息記錄：保留 180 天，超過期限將自動刪除</li>
              <li>知識庫資料：只要您持續使用服務，我們會保留以維持服務正常運作</li>
              <li>預約資訊：保留 1 年，用於報表分析與客戶服務改進</li>
              <li>您可隨時要求刪除您的資料，我們會在 7 個工作天內完成處理</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. 資料安全措施</h2>
            <p className="leading-relaxed">
              我們採用以下措施保護您的資料：
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>所有資料傳輸均使用 SSL/TLS 加密</li>
              <li>資料庫使用 AES-256 加密技術</li>
              <li>定期進行安全性審查與漏洞掃描</li>
              <li>員工僅在必要時可存取資料，並需簽署保密協議</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. 您的權利</h2>
            <p className="leading-relaxed">
              您對於您的個人資料享有以下權利：
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>查詢、閱覽您的個人資料</li>
              <li>要求補充或更正您的個人資料</li>
              <li>要求停止收集、處理或使用您的個人資料</li>
              <li>要求刪除您的個人資料</li>
            </ul>
          </section>

          {/* 親民版承諾 */}
          <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mt-12">
            <p className="leading-relaxed text-gray-300">
              我們是一個熱愛技術的開發團隊，我們承諾會像保護自己的資料一樣守護您的隱私。如果您對本隱私權政策有任何疑問，歡迎隨時透過 <a href="mailto:attak.company@gmail.com" className="text-red-500 hover:text-red-400 transition-colors">attak.company@gmail.com</a> 聯繫我們，或透過我們的官方 LINE 客服進行諮詢，我們會親自為您說明。
            </p>
          </section>

          <section className="pt-8 border-t border-gray-800">
            <p className="text-gray-500 text-sm">
              如您同意本隱私權政策，即表示您同意我們按照上述方式處理您的個人資料。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
