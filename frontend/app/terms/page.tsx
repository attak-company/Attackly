import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-black text-gray-300">
      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* 返回按鈕 */}
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8">
          <span className="mr-2">←</span> 返回首頁
        </Link>

        {/* 標題 */}
        <h1 className="text-4xl font-bold text-white mb-4">服務條款</h1>
        <p className="text-gray-500 text-sm mb-12">最後更新日期：2026 年 1 月</p>

        {/* 內容區塊 */}
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. 服務概述</h2>
            <p className="leading-relaxed">
              Digital Manager（以下稱「本服務」）提供 AI 數位店長服務，透過 LINE 平台協助商家處理客戶諮詢、預約排程與日常經營管理。本服務條款規範您與我們之間的法律關係。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. AI 內容免責聲明（重要）</h2>
            <div className="bg-gray-900 border border-red-900/30 rounded-lg p-6">
              <p className="leading-relaxed text-gray-300 mb-4">
                <strong className="text-white">請務必仔細閱讀本條款：</strong>
              </p>
              <p className="leading-relaxed text-gray-400 mb-4">
                AI 生成之內容可能存在偏差或錯誤。商家應自行審核 AI 產生的所有訊息，確保內容準確且符合營業需求。
              </p>
              <p className="leading-relaxed text-gray-400 mb-4">
                本團隊不對 AI 產生的錯誤訊息所導致的任何商業損失、客戶投訴或法律糾紛負擔法律責任。您使用本服務即表示您了解並同意自行承擔此風險。
              </p>
              <p className="leading-relaxed text-gray-400">
                如 AI 回覆可能造成重大影響（如醫療建議、法律諮詢等），請務必由人工進行二次確認。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. 退費政策</h2>
            <p className="leading-relaxed mb-4">
              我們提供以下退費與取消政策：
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li><strong className="text-white">7 天免費試用期：</strong>註冊後 7 天內可隨時取消訂閱並申請全額退費。</li>
              <li><strong className="text-white">月費訂閱：</strong>試用期後，訂閱將依月計費 NT$ 799/月。</li>
              <li><strong className="text-white">取消訂閱：</strong>您可隨時於後台停止續約，當月已付費用不退費。</li>
              <li><strong className="text-white">退費申請：</strong>請透過 Email 聯繫我們，我們會在 7 個工作天內處理。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. 服務中斷與可用性</h2>
            <p className="leading-relaxed mb-4">
              本服務依賴以下第三方服務：
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>LINE Messaging API（用於訊息傳輸）</li>
              <li>Google Gemini API（用於 AI 內容生成）</li>
            </ul>
            <p className="leading-relaxed mt-4 text-gray-400">
              如因 LINE 或 Google 端服務不穩定、維護或中斷導致本服務無法正常運作，本團隊將盡快修復但不負賠償責任。我們不保證服務 100% 無中斷。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. 禁止行為</h2>
            <p className="leading-relaxed mb-4">
              使用本服務時，您同意不進行以下行為：
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>使用本系統傳送非法訊息、詐騙或惡意洗版</li>
              <li>利用 AI 生成違反法律或道德規範的內容</li>
              <li>嘗試破解、逆向工程或干擾系統正常運作</li>
              <li>未經授權存取他人帳號或資料</li>
              <li>將本服務用於任何違反 LINE 使用條款的目的</li>
            </ul>
            <p className="leading-relaxed mt-4 text-gray-400">
              如發現上述行為，我們有權立即終止您的服務並保留法律追訴權利。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. 用戶責任</h2>
            <p className="leading-relaxed mb-4">
              作為服務使用者，您需承擔以下責任：
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>妥善保管您的帳號密碼與 LINE 專屬密鑰</li>
              <li>用戶應確保其 LINE Channel Secret 與相關密鑰不外洩予非授權之第三方</li>
              <li>定期審核 AI 產生的內容，確保資訊正確性</li>
              <li>對透過本服務發送的所有訊息負法律責任</li>
              <li>遵守所有適用法律與 LINE 平台規範</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. 服務變更與終止</h2>
            <p className="leading-relaxed">
              我們保留隨時修改或終止本服務的權利。如進行重大變更，我們會透過 Email 或系統通知提前告知。如您不同意變更，可選擇取消訂閱。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. 責任限制</h2>
            <p className="leading-relaxed">
              在法律允許的最大範圍內，本團隊對以下情況不負責：
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>因 AI 錯誤回覆導致的商業損失</li>
              <li>第三方服務（LINE、Google）中斷造成的影響</li>
              <li>因用戶操作不當導致的資料遺失</li>
              <li>任何間接、附帶或懲罰性損害</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. 爭議解決</h2>
            <p className="leading-relaxed">
              如發生爭議，雙方應先以誠信原則協商解決。如協商不成，適用中華民國法律，並以臺灣地區法院為第一審管轄法院。
            </p>
          </section>

          {/* 親民版承諾 */}
          <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mt-12">
            <p className="leading-relaxed text-gray-300">
              我們是一個熱愛技術的開發團隊，我們承諾會像保護自己的資料一樣守護您的隱私。如果您對本服務條款有任何疑問，歡迎隨時透過 <a href="mailto:attak.company@gmail.com" className="text-red-500 hover:text-red-400 transition-colors">attak.company@gmail.com</a> 聯繫我們，或透過我們的官方 LINE 客服進行諮詢，我們會親自為您說明。
            </p>
          </section>

          <section className="pt-8 border-t border-gray-800">
            <p className="text-gray-500 text-sm">
              如您使用本服務，即表示您已閱讀、了解並同意本服務條款的所有內容。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
