"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/page-header";
import { MessageSquare, Search, User, Bot, Send } from "lucide-react";

interface Chat {
  id: string;
  user_name: string;
  line_user_id: string;
  last_message: string;
  timestamp: string;
  unread: boolean;
  display_name?: string;
  picture_url?: string;
}

interface Message {
  id: string;
  role: string;
  content: string;
  timestamp: string;
}

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchChats();
  }, []);

  // 輪詢獲取新訊息
  useEffect(() => {
    if (!selectedChat) return;

    const interval = setInterval(() => {
      fetchMessages(selectedChat.id);
      fetchChats();
    }, 3000); // 每3秒輪詢一次

    return () => clearInterval(interval);
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/chats`;
      console.log('Fetching chats from:', apiUrl);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Chats data:', data);

      if (data.success) {
        setChats(data.chats);
        if (data.chats.length > 0) {
          setSelectedChat(data.chats[0]);
          fetchMessages(data.chats[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching chats:', err);
      console.error('Error details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/chats/${conversationId}/messages`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || sending) return;

    setSending(true);
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/chats/send`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: selectedChat.id,
          message: newMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewMessage("");
        fetchMessages(selectedChat.id);
        fetchChats();
      } else {
        alert("發送失敗: " + (data.error || "未知錯誤"));
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("發送失敗: 網絡錯誤");
    } finally {
      setSending(false);
    }
  };

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
            {loading ? (
              <div className="p-4 text-center text-gray-500">載入中...</div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-center text-gray-500">暫無對話記錄</div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat)}
                  className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${selectedChat?.id === chat.id ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}
                >
                  <div className="flex items-center gap-3">
                    {chat.picture_url ? (
                      <img src={chat.picture_url} alt={chat.display_name || chat.user_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center font-bold text-black">
                        {(chat.display_name || chat.user_name)[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-sm truncate">{chat.display_name || chat.user_name}</h4>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{new Date(chat.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{chat.last_message}</p>
                    </div>
                    {chat.unread && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 flex flex-col bg-gray-50/30">
          {selectedChat ? (
            <>
              <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedChat.picture_url ? (
                    <img src={selectedChat.picture_url} alt={selectedChat.display_name || selectedChat.user_name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center font-bold text-black">
                      {(selectedChat.display_name || selectedChat.user_name)[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-sm">{selectedChat.display_name || selectedChat.user_name}</h3>
                    <span className="text-[10px] text-green-600 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full" /> LINE 在線中
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500">暫無訊息</div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className={`flex flex-col ${message.role === 'user' ? 'items-start' : 'items-end ml-auto'} max-w-[80%]`}>
                      <div className={`p-3 rounded-2xl shadow-sm text-sm ${message.role === 'user' ? 'bg-black text-white rounded-tl-none' : 'bg-black text-white rounded-tr-none'}`}>
                        {message.content}
                      </div>
                      {message.role === 'ai' && (
                        <div className="flex items-center gap-1 mt-1">
                          <Bot className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] text-gray-400">AI 店長已自動回覆</span>
                        </div>
                      )}
                      <span className="text-[10px] text-gray-400 mt-1">{new Date(message.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="輸入訊息（這將會以商家身份傳送到客人的 LINE）" 
                    className="flex-1 px-4 py-2 bg-gray-50 border-none rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={sending}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="bg-black text-white p-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              請選擇一個對話
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
