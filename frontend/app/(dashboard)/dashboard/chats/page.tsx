"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { MessageSquare, Search, User, Bot, Send } from "lucide-react";

const mockChats = [
  { id: 1, user: "林小姐", lastMsg: "我想預約明天下午三點", time: "10:30 AM", unread: true },
  { id: 2, user: "陳先生", lastMsg: "請問服務價格是多少？", time: "Yesterday", unread: false },
  { id: 3, user: "王小美", lastMsg: "謝謝您的預約確認！", time: "Yesterday", unread: false },
];

export default function ChatsPage() {
  const [selectedChat, setSelectedChat] = useState(mockChats[0]);

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col space-y-6">
      <PageHeader title="對話紀錄" />

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex">
        {/* Chat List */}
        <div className="w-80 border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="搜尋對話..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm outline-none" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {mockChats.map((chat) => (
              <div 
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${selectedChat.id === chat.id ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-sm">{chat.user}</h4>
                  <span className="text-[10px] text-gray-400">{chat.time}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{chat.lastMsg}</p>
                {chat.unread && <div className="mt-2 w-2 h-2 bg-blue-600 rounded-full" />}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 flex flex-col bg-gray-50/30">
          <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center font-bold text-black">
                {selectedChat.user[0]}
              </div>
              <div>
                <h3 className="font-bold text-sm">{selectedChat.user}</h3>
                <span className="text-[10px] text-green-600 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full" /> LINE 在線中
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="flex flex-col items-start max-w-[80%]">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 text-sm">
                {selectedChat.lastMsg}
              </div>
              <span className="text-[10px] text-gray-400 mt-1">10:30 AM</span>
            </div>

            <div className="flex flex-col items-end ml-auto max-w-[80%]">
              <div className="bg-black text-white p-3 rounded-2xl rounded-tr-none shadow-sm text-sm">
                好的，為您查詢明天下午三點的空檔...
                <br />
                目前有位置喔！請問要幫您預約嗎？
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Bot className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] text-gray-400">AI 店長已自動回覆</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="輸入訊息（這將會以商家身份傳送到客人的 LINE）" 
                className="flex-1 px-4 py-2 bg-gray-50 border-none rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
              />
              <button className="bg-black text-white p-2 rounded-lg hover:bg-gray-800">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
