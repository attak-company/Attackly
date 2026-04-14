import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-black text-gray-300">
      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* 返回按鈕 */}
        <Link href="/" className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors duration-300 mb-8 group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-medium">返回官網</span>
        </Link>

        {/* 標題 */}
        <h1 className="text-4xl font-bold text-white mb-4">退費政策</h1>
        <p className="text-gray-500 text-sm mb-12">最後更新日期：2026 年 4 月</p>

        {/* 內容區塊 */}
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">一、政策核心聲明</h2>
            <p className="leading-relaxed mb-4">
              Digital Manager（以下稱「本服務」）秉持以用戶滿意度為優先的原則，同時確保系統資源（如 AI 運算費）的合理使用。本退費政策適用於透過本平台完成訂閱支付的所有正式用戶。
            </p>
            <p className="leading-relaxed text-gray-400">
              我們致力於提供透明的退費機制，讓您在試用本服務時能安心體驗。同時，為防止資源惡意消耗，我們設定了合理的使用限制，以保障所有用戶的權益。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">二、試用期與取消訂閱</h2>
            <div className="bg-gray-900 border border-red-900/30 rounded-lg p-6">
              <p className="leading-relaxed text-gray-300 mb-4">
                <strong className="text-white">7 天免費試用期：</strong>
              </p>
              <p className="leading-relaxed text-gray-400 mb-4">
                新用戶註冊後享有 7 天完整功能試用期。在試用期內，您可以完整體驗本服務的所有功能，包括 AI 智慧導購、視覺化經營看板等核心功能。
              </p>
              <p className="leading-relaxed text-gray-400 mb-4">
                <strong className="text-white">無痛取消：</strong>
              </p>
              <p className="leading-relaxed text-gray-400 mb-4">
                試用期內隨時可於後台「帳號設定」取消續約，系統絕對不會產生任何扣款。您無需提供任何理由，只需一鍵取消即可。
              </p>
              <p className="leading-relaxed text-gray-400">
                <strong className="text-white">權限終止：</strong>
              </p>
              <p className="leading-relaxed text-gray-400">
                試用期結束未續費，或主動取消後，您的資料將保存 30 天。若您在 30 天內重新訂閱，資料將自動恢復。超過 30 天未續費，資料將永久刪除。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">三、正式付費後的退款準則</h2>
            <p className="leading-relaxed mb-4">
              為確保公平性，我們將退款情況分為以下兩種：
            </p>

            <div className="space-y-6">
              <div className="bg-gray-900 border border-green-900/30 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">1. 全額退款（7 天猶豫期內）</h3>
                <p className="leading-relaxed text-gray-400 mb-4">
                  <strong className="text-white">條件：</strong>付費後 7 天內提出退款申請。
                </p>
                <p className="leading-relaxed text-gray-400 mb-4">
                  <strong className="text-white">限制：</strong>為防止資源惡意消耗，申請退款時需符合以下條件：
                </p>
                <ul className="list-disc list-inside mt-4 space-y-2 text-gray-400">
                  <li>AI 回覆次數需低於 30 次</li>
                  <li>無大量匯出資料行為</li>
                  <li>帳號無違反服務條款之紀錄</li>
                </ul>
                <p className="leading-relaxed text-gray-400 mt-4">
                  若符合上述條件，我們將全額退還您的訂閱費用。
                </p>
              </div>

              <div className="bg-gray-900 border border-red-900/30 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">2. 不予退款的情形</h3>
                <p className="leading-relaxed text-gray-400 mb-4">
                  以下情況我們將不予退款：
                </p>
                <ul className="list-disc list-inside mt-4 space-y-2 text-gray-400">
                  <li>超過 7 天猶豫期後提出退款申請</li>
                  <li>AI 回覆次數已超過 30 次，視同已深度使用服務</li>
                  <li>帳號因違反服務條款（如發布違法訊息、惡意攻擊）而被停權者</li>
                  <li>已消耗大量 AI 運算資源或使用深度自訂功能</li>
                  <li>有大量匯出資料行為，可能涉及資源濫用</li>
                </ul>
                <p className="leading-relaxed text-gray-400 mt-4">
                  AI 運算資源由 Google Gemini API 提供，每次回覆皆需支付費用。為防止惡意使用，我們設定了 30 次的使用門檻，既能讓正常用戶充分測試，又能防止資源濫用。
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">四、退款執行程序</h2>
            <p className="leading-relaxed mb-4">
              若您符合退款條件，請依照以下程序申請：
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li><strong className="text-white">申請管道：</strong>請透過「LINE 專人客服」或官方支援信箱 <a href="mailto:attak.company@gmail.com" className="text-red-500 hover:text-red-400 transition-colors">attak.company@gmail.com</a> 聯繫我們。</li>
              <li><strong className="text-white">所需資料：</strong>請提供註冊 Email、訂閱編號（可在後台查看）、退款原因（僅供改進參考）。</li>
              <li><strong className="text-white">退款路徑：</strong>退款將透過 <strong className="text-white">藍新金流</strong> 系統原路退回至原刷卡信用卡，不另行轉帳。</li>
              <li><strong className="text-white">作業時間：</strong>平台於 3 個工作天內核准，銀行端處理約需 7-14 個工作天，實際到帳時間視銀行處理速度而定。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">五、服務異動與爭議處理</h2>
            <p className="leading-relaxed mb-4">
              <strong className="text-white">保留權利：</strong>數位店長保留修改本退費政策之權利，如進行重大變更，我們將透過 Email 或系統通知提前告知，並公告於更新日誌。
            </p>
            <p className="leading-relaxed text-gray-400">
              <strong className="text-white">法律管轄：</strong>若發生爭議，雙方應先以誠信原則協商解決。如協商不成，適用中華民國法律，並以臺灣地區法院為第一審管轄法院。
            </p>
          </section>

          {/* 親民版承諾 */}
          <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mt-12">
            <p className="leading-relaxed text-gray-300">
              我們是一個熱愛技術的開發團隊，我們承諾會像保護自己的資料一樣守護您的隱私與權益。如果您對本退費政策有任何疑問，歡迎隨時透過 <a href="mailto:attak.company@gmail.com" className="text-red-500 hover:text-red-400 transition-colors">attak.company@gmail.com</a> 聯繫我們，或透過我們的官方 LINE 客服進行諮詢，我們會親自為您說明。
            </p>
          </section>

          <section className="pt-8 border-t border-gray-800">
            <p className="text-gray-500 text-sm">
              如您使用本服務，即表示您已閱讀、了解並同意本退費政策的所有內容。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
